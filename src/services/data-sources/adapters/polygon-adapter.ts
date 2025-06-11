
'use server';
/**
 * @fileOverview Polygon.io API adapter for fetching stock market data.
 */

import { restClient, type IRestClient } from '@polygon.io/client-js';
import type {
  MarketStatusData,
  StockSnapshotData,
  StockPriceData,
  TechnicalIndicatorsData,
  OptionsChainData,
  StreamlinedOptionContract,
  OptionsTableRow,
  AdapterOutput,
  StockDataPackage,
} from '@/services/data-sources/types';
import { calculateNextFridayExpiration } from '@/lib/date-utils';
import { formatToTwoDecimals, roundNumber } from '@/lib/number-utils'; // Added roundNumber

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to round all numeric values in an object (shallowly for TA, deeper for options)
// This is for ensuring the JSON in Debug tab also respects decimal limits
const roundObjectNumbers = (obj: any, precision: number = 2): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  const newObj: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'number') {
        newObj[key] = roundNumber(value, key === 'iv' || key === 'delta' || key === 'gamma' || key === 'theta' || key === 'vega' ? 4 : precision);
      } else if (typeof value === 'object') {
        // Recursively round nested objects (like 'day', 'prevDay', 'greeks' in options)
         newObj[key] = roundObjectNumbers(value, precision);
      }
       else {
        newObj[key] = value;
      }
    }
  }
  return newObj;
};


class PolygonAdapter {
  private client: IRestClient;
  private apiKeyValidForBasicCheck: boolean = false;

  constructor(apiKey?: string) {
    const keyToUse = apiKey || process.env.POLYGON_API_KEY;

    if (!keyToUse || keyToUse.trim() === "") {
      const errorMessage = "[StockSage Critical Error] Polygon API key is MISSING or EMPTY. PolygonAdapter cannot be initialized correctly. Please set POLYGON_API_KEY environment variable.";
      console.error(errorMessage);
      this.client = restClient("INVALID_KEY_ADAPTER_INIT_FAILURE");
      console.error("[StockSage Debug] Initializing Polygon client with INVALID_KEY_ADAPTER_INIT_FAILURE due to missing actual key.");
      
      this.client.reference.marketHolidays({limit:1})
        .then(() => {
          console.error("[StockSage Debug] Polygon constructor test call with INVALID_KEY_ADAPTER_INIT_FAILURE unexpectedly SUCCEEDED. This is very odd.");
        })
        .catch(err => {
          const errorDetails = err as any;
          console.log(`[StockSage Debug] Polygon constructor test call with INVALID_KEY_ADAPTER_INIT_FAILURE FAILED as expected: Status: ${errorDetails?.status}, Request ID: ${errorDetails?.request_id}, Message: ${errorDetails?.message}`);
        });
      return; 
    }
    
    console.log(`[StockSage Debug] PolygonAdapter constructor attempting to use API key (Ends In): ...${keyToUse.substring(Math.max(0, keyToUse.length - 5))}, Length: ${keyToUse.length}`);
    this.client = restClient(keyToUse);
    
    this.client.reference.marketHolidays({limit:1})
      .then(() => {
        console.log("[StockSage Debug] Polygon constructor test call (marketHolidays) with actual key SUCCEEDED.");
        this.apiKeyValidForBasicCheck = true;
      })
      .catch(err => {
        const errorDetails = err as any;
        console.error(`[StockSage Debug] Polygon constructor test call (marketHolidays) with actual key FAILED: Status: ${errorDetails?.status}, Request ID: ${errorDetails?.request_id}, Message: ${errorDetails?.message}`);
        this.apiKeyValidForBasicCheck = false;
      });
  }

  private mapToStockPriceData(
    polygonAgg: any,
    timestamp?: number
  ): StockPriceData {
    return roundObjectNumbers({ // Round numbers here
      o: polygonAgg?.o,
      h: polygonAgg?.h,
      l: polygonAgg?.l,
      c: polygonAgg?.c,
      v: polygonAgg?.v,
      vw: polygonAgg?.vw,
      t: timestamp || polygonAgg?.t,
      n: polygonAgg?.n,
    }) as StockPriceData;
  }

  async getFullStockData(ticker: string): Promise<AdapterOutput> {
    const stockDataPackage: StockDataPackage = {
      ticker,
    };
    let currentStockPrice: number | undefined;
    const apiCallDelay = 100; 

    if (!this.apiKeyValidForBasicCheck && process.env.POLYGON_API_KEY && process.env.POLYGON_API_KEY.trim() !== "" && process.env.POLYGON_API_KEY !== "INVALID_KEY_ADAPTER_INIT_FAILURE") {
      console.warn("[StockSage Debug] Proceeding with getFullStockData, but initial API key validity check (marketHolidays) may not have succeeded or completed yet.");
    }

    try {
      // 1. Fetch Market Status
      try {
        await delay(apiCallDelay);
        const marketStatusResponse = await this.client.reference.marketStatus();
        stockDataPackage.marketStatus = {
          market: marketStatusResponse.market === 'extended-hours' ? 'Extended Hours' : marketStatusResponse.market,
          earlyHours: marketStatusResponse.earlyHours || false,
          lateHours: marketStatusResponse.lateHours || false,
          serverTime: marketStatusResponse.serverTime || new Date().toISOString(),
          exchanges: marketStatusResponse.exchanges || {},
          currencies: marketStatusResponse.currencies || {},
        } as MarketStatusData;
      } catch (error: any) {
        const errorMessage = `Failed to fetch market status. Polygon client error: ${error.message || String(error)}`;
        console.error(`Error fetching market status from Polygon:`, error);
        stockDataPackage.marketStatus = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }
      
      // 2. Fetch Ticker Snapshot (current day, prev day, current price)
      try {
        await delay(apiCallDelay);
        const snapshotResponse = await this.client.stocks.snapshotTicker(ticker.toUpperCase());

        if (snapshotResponse.ticker) {
          const { day, prevDay, todaysChange, todaysChangePerc, updated, lastTrade } = snapshotResponse.ticker;
          currentStockPrice = roundNumber(lastTrade?.p ?? day?.c ?? prevDay?.c);

          stockDataPackage.stockSnapshot = {
            ticker: snapshotResponse.ticker.ticker,
            day: this.mapToStockPriceData(day, day?.t || updated),
            prevDay: this.mapToStockPriceData(prevDay, prevDay?.t),
            todaysChange: roundNumber(todaysChange),
            todaysChangePerc: roundNumber(todaysChangePerc, 4), // Percentage, allow more precision initially
            updated: updated,
            currentPrice: currentStockPrice, 
          } as StockSnapshotData;
        } else {
            throw new Error('Snapshot response did not contain ticker data or was malformed.');
        }
      } catch (error: any) {
        let detailedErrorMessage = `Polygon client error: ${error.message || String(error)}`;
        const rawErrorDetails: any = { message: error.message || String(error) }; 
        if (error.stack) rawErrorDetails.stack = error.stack.substring(0, 500);
        const polygonError = error as any; 
        if (polygonError.request_id) rawErrorDetails.requestId = polygonError.request_id;
        if (polygonError.status) rawErrorDetails.status = polygonError.status; 
        for (const prop in polygonError) {
            if (Object.prototype.hasOwnProperty.call(polygonError, prop) && typeof polygonError[prop] !== 'function' && prop !== 'config' && prop !== 'request') {
                if (!rawErrorDetails[prop]) { 
                    rawErrorDetails[prop] = polygonError[prop];
                }
            }
        }
        const errorMessage = `Failed to fetch snapshot for ${ticker}. ${detailedErrorMessage}`;
        console.error(`Error fetching stock snapshot for ${ticker} from Polygon (Adapter):`, JSON.stringify(rawErrorDetails, null, 2)); 
        stockDataPackage.stockSnapshot = { error: errorMessage, rawErrorDetails: rawErrorDetails } as any;
      }

      // 3. Fetch Standard Technical Indicators & map VWAP
      const technicalIndicators: Partial<TechnicalIndicatorsData> = {};
      try {
        if (stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.day?.vw !== undefined) {
          technicalIndicators.VWAP = { value: roundNumber(stockDataPackage.stockSnapshot.day.vw) };
        }
        // Fetch other TAs and round their values
        await delay(apiCallDelay);
        const rsiRes = await this.client.stocks.rsi(ticker.toUpperCase(), { timespan: 'day', window: 14, series_type: 'close', limit: 1 });
        if (rsiRes.results?.values?.[0]?.value) technicalIndicators.RSI = { value: roundNumber(rsiRes.results.values[0].value) };
        
        await delay(apiCallDelay);
        const emaRes = await this.client.stocks.ema(ticker.toUpperCase(), { timespan: 'day', window: 20, series_type: 'close', limit: 1 });
        if (emaRes.results?.values?.[0]?.value) technicalIndicators.EMA = { value: roundNumber(emaRes.results.values[0].value) };
        
        await delay(apiCallDelay);
        const smaRes = await this.client.stocks.sma(ticker.toUpperCase(), { timespan: 'day', window: 50, series_type: 'close', limit: 1 });
        if (smaRes.results?.values?.[0]?.value) technicalIndicators.SMA = { value: roundNumber(smaRes.results.values[0].value) };
        
        await delay(apiCallDelay);
        const macdRes = await this.client.stocks.macd(ticker.toUpperCase(), { timespan: 'day', series_type: 'close', limit: 1 });
        if (macdRes.results?.values?.[0]) {
          const macdValue = macdRes.results.values[0];
          technicalIndicators.MACD = { 
            value: roundNumber(macdValue.value, 4), 
            signal: roundNumber(macdValue.signal, 4), 
            histogram: roundNumber(macdValue.histogram, 4) 
          };
        }
        stockDataPackage.technicalIndicators = technicalIndicators as TechnicalIndicatorsData;
      } catch (error: any) {
          const errorMessage = `Failed to fetch TAs for ${ticker}. Polygon client error: ${error.message || String(error)}`;
          console.error(`Error fetching technical indicators for ${ticker} from Polygon:`, error);
          stockDataPackage.technicalIndicators = { ...(stockDataPackage.technicalIndicators || {}), error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }
      
      // 4. Fetch Options Chain using snapshotOptionChain
      try {
        if (currentStockPrice !== undefined && currentStockPrice !== null) { 
          await delay(apiCallDelay);
          const expirationDate = calculateNextFridayExpiration();
          const strikePriceWindowPercentage = 0.20; 
          const lowerStrikeBound = currentStockPrice * (1 - strikePriceWindowPercentage);
          const upperStrikeBound = currentStockPrice * (1 + strikePriceWindowPercentage);

          const commonOptionsParams = {
            expiration_date: expirationDate,
            "strike_price.gte": formatToTwoDecimals(lowerStrikeBound, "0"),
            "strike_price.lte": formatToTwoDecimals(upperStrikeBound, "0"),
            limit: 250, 
            // order: "desc", // Fetching sorted and then re-sorting later. Default asc is fine.
            // sort: "strike_price" 
          };

          const callsSnapshot = await this.client.options.snapshotOptionChain(ticker.toUpperCase(), {
            ...commonOptionsParams,
            contract_type: 'call',
          });
          await delay(apiCallDelay);
          const putsSnapshot = await this.client.options.snapshotOptionChain(ticker.toUpperCase(), {
            ...commonOptionsParams,
            contract_type: 'put',
          });
          
          const allStrikes = new Set<number>();
          const callDataByStrike = new Map<number, any>();
          const putDataByStrike = new Map<number, any>();

          (callsSnapshot.results || []).forEach(contract => {
            const strike = roundNumber(contract.details.strike_price);
            if(strike === undefined || strike === null) return;
            allStrikes.add(strike);
            callDataByStrike.set(strike, contract);
          });

          (putsSnapshot.results || []).forEach(contract => {
            const strike = roundNumber(contract.details.strike_price);
            if(strike === undefined || strike === null) return;
            allStrikes.add(strike);
            putDataByStrike.set(strike, contract);
          });
          
          let sortedStrikes = Array.from(allStrikes).sort((a, b) => a - b); // Sort ascending first

          let closestStrikeIndex = 0;
          if (sortedStrikes.length > 0 && currentStockPrice !== undefined) {
             closestStrikeIndex = sortedStrikes.reduce((prevIdx, currentStrikeItem, currentIdx) => {
                return (Math.abs(currentStrikeItem - currentStockPrice) < Math.abs(sortedStrikes[prevIdx] - currentStockPrice)) ? currentIdx : prevIdx;
            }, 0);
          }
          
          const startIndex = Math.max(0, closestStrikeIndex - 10);
          const endIndex = Math.min(sortedStrikes.length, closestStrikeIndex + 11); // Fetch 11 to get 10 on each side after filtering
          const finalStrikesToProcess = sortedStrikes.slice(startIndex, endIndex).sort((a,b) => b - a); // Now sort descending

          const optionsTableRows: OptionsTableRow[] = [];

          for (const strike of finalStrikesToProcess) {
            const callContractData = callDataByStrike.get(strike);
            const putContractData = putDataByStrike.get(strike);

            const mapContractData = (data: any, type: 'call' | 'put'): StreamlinedOptionContract | undefined => {
              if (!data) return undefined;
              // Rounding applied here for the values that go into the final JSON
              return {
                strike_price: roundNumber(data.details.strike_price)!, // strike_price is essential
                option_type: type,
                primary_exchange: data.details.primary_exchange,
                iv: roundNumber(data.implied_volatility, 4),
                last_price: roundNumber(data.day?.close), 
                change: roundNumber(data.day?.change),
                percent_change: roundNumber(data.day?.change_percent, 2), // Keep some precision for % change
                volume: data.day?.volume, // Volume is whole number
                open_interest: data.open_interest, // OI is whole number
                break_even_price: roundNumber(data.details?.break_even_price),
                delta: roundNumber(data.greeks?.delta, 4),
                gamma: roundNumber(data.greeks?.gamma, 4),
                theta: roundNumber(data.greeks?.theta, 4),
                vega: roundNumber(data.greeks?.vega, 4),
                rho: roundNumber(data.greeks?.rho, 4),
                bid: roundNumber(data.last_quote?.bid), // last_quote often not in snapshot
                ask: roundNumber(data.last_quote?.ask), // last_quote often not in snapshot
                bid_size: data.last_quote?.bs,
                ask_size: data.last_quote?.as,
              };
            };
            
            optionsTableRows.push({
              strike: strike,
              call: mapContractData(callContractData, 'call'),
              put: mapContractData(putContractData, 'put'),
            });
          }

          stockDataPackage.optionsChain = {
            ticker: ticker,
            expiration_date: expirationDate,
            contracts: optionsTableRows, 
            underlying_price: roundNumber(currentStockPrice),
          };
        } else {
            stockDataPackage.optionsChain = { error: 'Current stock price not available for options chain fetching (snapshot likely failed).' } as any;
        }
      } catch (error: any) {
        const errorMessage = `Failed to fetch options chain for ${ticker}. Polygon client error: ${error.message || String(error)}`;
        console.error(`Error fetching options chain for ${ticker} from Polygon:`, error);
        stockDataPackage.optionsChain = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }

      return {
        stockData: stockDataPackage,
      };

    } catch (error: any) {
      const overallErrorMessage = `Overall failure in fetching data for ${ticker}. Some data might be missing or incomplete. Original error: ${error.message || String(error)}`;
      console.error(`An unexpected error occurred in getFullStockData for ${ticker}:`, error); 
      return {
        stockData: {
          ...stockDataPackage,
          error: overallErrorMessage,
          rawOverallError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request')))
        } as StockDataPackage,
      };
    }
  }
}

export async function getFullStockData(ticker: string): Promise<AdapterOutput> {
  const apiKeyFromEnv = process.env.POLYGON_API_KEY;
  const adapter = new PolygonAdapter(apiKeyFromEnv); 
  return adapter.getFullStockData(ticker);
}
