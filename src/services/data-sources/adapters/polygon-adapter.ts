
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
import { formatToTwoDecimals } from '@/lib/number-utils';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    
    const keyDisplay = `${keyToUse.substring(0, Math.min(5, keyToUse.length))}...${keyToUse.substring(Math.max(0, keyToUse.length - 5))}`;
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
    return {
      o: polygonAgg?.o ?? 0,
      h: polygonAgg?.h ?? 0,
      l: polygonAgg?.l ?? 0,
      c: polygonAgg?.c ?? 0,
      v: polygonAgg?.v ?? 0,
      vw: polygonAgg?.vw,
      t: timestamp || polygonAgg?.t,
      n: polygonAgg?.n,
    };
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
          currentStockPrice = lastTrade?.p ?? day?.c ?? prevDay?.c;

          stockDataPackage.stockSnapshot = {
            ticker: snapshotResponse.ticker.ticker,
            day: this.mapToStockPriceData(day, day?.t || updated),
            prevDay: this.mapToStockPriceData(prevDay, prevDay?.t),
            todaysChange: todaysChange,
            todaysChangePerc: todaysChangePerc,
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

      // 3. Fetch Standard Technical Indicators (RSI, EMA, SMA, MACD) & map VWAP from snapshot
      const technicalIndicators: TechnicalIndicatorsData = {};
      try {
        if (stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.day?.vw !== undefined) {
          technicalIndicators.VWAP = { value: stockDataPackage.stockSnapshot.day.vw };
        } else if (stockDataPackage.stockSnapshot?.error) {
            technicalIndicators.VWAP = { error: "VWAP not available due to snapshot fetch error." } as any;
        } else {
            technicalIndicators.VWAP = { error: "VWAP not available, snapshot data missing or incomplete." } as any;
        }
        await delay(apiCallDelay);
        const rsiRes = await this.client.stocks.rsi(ticker.toUpperCase(), { timespan: 'day', window: 14, series_type: 'close', limit: 1 });
        if (rsiRes.results?.values?.[0]?.value) technicalIndicators.RSI = { value: rsiRes.results.values[0].value };
        await delay(apiCallDelay);
        const emaRes = await this.client.stocks.ema(ticker.toUpperCase(), { timespan: 'day', window: 20, series_type: 'close', limit: 1 });
        if (emaRes.results?.values?.[0]?.value) technicalIndicators.EMA = { value: emaRes.results.values[0].value };
        await delay(apiCallDelay);
        const smaRes = await this.client.stocks.sma(ticker.toUpperCase(), { timespan: 'day', window: 50, series_type: 'close', limit: 1 });
        if (smaRes.results?.values?.[0]?.value) technicalIndicators.SMA = { value: smaRes.results.values[0].value };
        await delay(apiCallDelay);
        const macdRes = await this.client.stocks.macd(ticker.toUpperCase(), { timespan: 'day', series_type: 'close', limit: 1 });
        if (macdRes.results?.values?.[0]) {
          const macdValue = macdRes.results.values[0];
          technicalIndicators.MACD = { value: macdValue.value, signal: macdValue.signal, histogram: macdValue.histogram };
        }
        stockDataPackage.technicalIndicators = technicalIndicators;
      } catch (error: any) {
          const errorMessage = `Failed to fetch TAs for ${ticker}. Polygon client error: ${error.message || String(error)}`;
          console.error(`Error fetching technical indicators for ${ticker} from Polygon:`, error);
          stockDataPackage.technicalIndicators = { ...(stockDataPackage.technicalIndicators || {}), error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }
      
      // 4. Fetch Options Chain using snapshotOptionChain
      try {
        if (currentStockPrice !== undefined) { 
          await delay(apiCallDelay);
          const expirationDate = calculateNextFridayExpiration();
          // Define a strike price window (e.g., +/- 20% of current price, or a fixed number of strikes)
          const strikePriceWindowPercentage = 0.20; // 20%
          const lowerStrikeBound = currentStockPrice * (1 - strikePriceWindowPercentage);
          const upperStrikeBound = currentStockPrice * (1 + strikePriceWindowPercentage);

          const commonOptionsParams = {
            // underlying_ticker: ticker.toUpperCase(), // Not needed for snapshotOptionChain as ticker is the first arg
            expiration_date: expirationDate,
            "strike_price.gte": formatToTwoDecimals(lowerStrikeBound, "0"),
            "strike_price.lte": formatToTwoDecimals(upperStrikeBound, "0"),
            limit: 250, // Fetch a generous limit to ensure we get enough strikes. Max is 250 for snapshot.
            // order: "asc", // Default is asc by strike price
            // sort: "strike_price" // Default
          };

          // Fetch Calls
          const callsSnapshot = await this.client.options.snapshotOptionChain(ticker.toUpperCase(), {
            ...commonOptionsParams,
            contract_type: 'call',
          });
          await delay(apiCallDelay);

          // Fetch Puts
          const putsSnapshot = await this.client.options.snapshotOptionChain(ticker.toUpperCase(), {
            ...commonOptionsParams,
            contract_type: 'put',
          });
          
          const allStrikes = new Set<number>();
          const callDataByStrike = new Map<number, any>();
          const putDataByStrike = new Map<number, any>();

          (callsSnapshot.results || []).forEach(contract => {
            const strike = contract.details.strike_price;
            allStrikes.add(strike);
            callDataByStrike.set(strike, contract);
          });

          (putsSnapshot.results || []).forEach(contract => {
            const strike = contract.details.strike_price;
            allStrikes.add(strike);
            putDataByStrike.set(strike, contract);
          });
          
          const sortedStrikes = Array.from(allStrikes).sort((a, b) => b - a); // Sort descending

          const optionsTableRows: OptionsTableRow[] = [];
          let addedStrikesCount = 0;
          const maxStrikesToDisplay = 20; // +/- 10 effectively

          // Find index of strike closest to currentStockPrice
          let closestStrikeIndex = 0;
          if (sortedStrikes.length > 0) {
             closestStrikeIndex = sortedStrikes.reduce((prevIdx, currentStrike, currentIdx) => {
                return (Math.abs(currentStrike - currentStockPrice) < Math.abs(sortedStrikes[prevIdx] - currentStockPrice)) ? currentIdx : prevIdx;
            }, 0);
          }
          
          const startIndex = Math.max(0, closestStrikeIndex - 10);
          const endIndex = Math.min(sortedStrikes.length -1, closestStrikeIndex + 10);

          const finalStrikesToProcess = sortedStrikes.slice(startIndex, endIndex + 1);


          for (const strike of finalStrikesToProcess) {
            const callContractData = callDataByStrike.get(strike);
            const putContractData = putDataByStrike.get(strike);

            const mapContractData = (data: any, type: 'call' | 'put'): StreamlinedOptionContract | undefined => {
              if (!data) return undefined;
              return {
                strike_price: data.details.strike_price,
                option_type: type,
                contract_name: data.details.ticker,
                primary_exchange: data.details.primary_exchange,
                underlying_ticker: data.underlying_asset.ticker,
                iv: data.implied_volatility,
                last_price: data.day?.close, // Snapshot uses day.close for last price
                change: data.day?.change,
                percent_change: data.day?.change_percent,
                volume: data.day?.volume,
                open_interest: data.open_interest,
                break_even_price: data.details?.break_even_price,
                delta: data.greeks?.delta,
                gamma: data.greeks?.gamma,
                theta: data.greeks?.theta,
                vega: data.greeks?.vega,
                rho: data.greeks?.rho,
                // Bid/Ask and their sizes are not typically in snapshotOptionChain results
                bid: undefined, 
                ask: undefined,
                bid_size: undefined,
                ask_size: undefined,
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
            contracts: optionsTableRows, // Already sorted descending and filtered
            underlying_price: currentStockPrice,
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
