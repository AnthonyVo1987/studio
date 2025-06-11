
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
import { formatToTwoDecimals, roundNumber } from '@/lib/number-utils'; 

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class PolygonAdapter {
  private client: IRestClient;
  private apiKeyValidForBasicCheck: boolean = false;
  private debugMessages: string[] = [];

  constructor(apiKey?: string) {
    const keyToUse = apiKey || process.env.POLYGON_API_KEY;
    this.debugMessages.push(`[PolygonAdapter.constructor] Initializing...`);

    if (!keyToUse || keyToUse.trim() === "") {
      const errorMessage = "[StockSage Critical Error] Polygon API key is MISSING or EMPTY. PolygonAdapter cannot be initialized correctly. Please set POLYGON_API_KEY environment variable.";
      console.error(errorMessage);
      this.debugMessages.push(errorMessage);
      this.client = restClient("INVALID_KEY_ADAPTER_INIT_FAILURE");
      this.debugMessages.push("[PolygonAdapter.constructor] Initializing Polygon client with INVALID_KEY_ADAPTER_INIT_FAILURE due to missing actual key.");
      
      this.client.reference.marketHolidays({limit:1})
        .then(() => {
          const msg = "[PolygonAdapter.constructor] Polygon constructor test call (marketHolidays) with INVALID_KEY_ADAPTER_INIT_FAILURE unexpectedly SUCCEEDED. This is very odd.";
          console.error(msg);
          this.debugMessages.push(msg);
        })
        .catch(err => {
          const errorDetails = err as any;
          const msg = `[PolygonAdapter.constructor] Polygon constructor test call (marketHolidays) with INVALID_KEY_ADAPTER_INIT_FAILURE FAILED as expected: Status: ${errorDetails?.status}, Request ID: ${errorDetails?.request_id}, Message: ${errorDetails?.message}`;
          console.log(msg); // Use console.log for expected failures
          this.debugMessages.push(msg);
        });
      return; 
    }
    
    this.debugMessages.push(`[PolygonAdapter.constructor] Attempting to use API key (Ends In): ...${keyToUse.substring(Math.max(0, keyToUse.length - 5))}, Length: ${keyToUse.length}`);
    this.client = restClient(keyToUse);
    
    this.client.reference.marketHolidays({limit:1})
      .then(() => {
        const msg = "[PolygonAdapter.constructor] Polygon constructor test call (marketHolidays) with actual key SUCCEEDED.";
        console.log(msg);
        this.debugMessages.push(msg);
        this.apiKeyValidForBasicCheck = true;
      })
      .catch(err => {
        const errorDetails = err as any;
        const msg = `[PolygonAdapter.constructor] Polygon constructor test call (marketHolidays) with actual key FAILED: Status: ${errorDetails?.status}, Request ID: ${errorDetails?.request_id}, Message: ${errorDetails?.message}`;
        console.error(msg);
        this.debugMessages.push(msg);
        this.apiKeyValidForBasicCheck = false;
      });
  }

  private mapToStockPriceData(
    polygonAgg: any,
    timestamp?: number
  ): StockPriceData | null {
    if (!polygonAgg) return null;
    return { 
      o: roundNumber(polygonAgg?.o, 2),
      h: roundNumber(polygonAgg?.h, 2),
      l: roundNumber(polygonAgg?.l, 2),
      c: roundNumber(polygonAgg?.c, 2),
      v: roundNumber(polygonAgg?.v, 0), 
      vw: roundNumber(polygonAgg?.vw, 4), 
      t: timestamp || polygonAgg?.t,
      n: polygonAgg?.n,
    };
  }

  async getFullStockData(ticker: string): Promise<AdapterOutput> {
    this.debugMessages.push(`[PolygonAdapter.getFullStockData] Initiating for ticker: ${ticker.toUpperCase()}`);
    const stockDataPackage: StockDataPackage = {
      ticker,
      polygonAdapterDebugMessages: [], // Initialize here
    };
    let currentStockPrice: number | undefined;
    const apiCallDelay = 120; // Increased slightly

    if (!this.apiKeyValidForBasicCheck && process.env.POLYGON_API_KEY && process.env.POLYGON_API_KEY.trim() !== "" && process.env.POLYGON_API_KEY !== "INVALID_KEY_ADAPTER_INIT_FAILURE") {
      this.debugMessages.push("[PolygonAdapter.getFullStockData] Warning: Proceeding, but initial API key validity check (marketHolidays) may not have succeeded or completed yet.");
    }

    try {
      // 1. Fetch Market Status
      this.debugMessages.push("[PolygonAdapter.getFullStockData] Fetching Market Status...");
      try {
        await delay(apiCallDelay);
        const marketStatusResponse = await this.client.reference.marketStatus();
        this.debugMessages.push(`[PolygonAdapter.getFullStockData] Market Status API call successful. Market: ${marketStatusResponse.market}`);
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
        this.debugMessages.push(`[PolygonAdapter.getFullStockData] ERROR fetching market status: ${errorMessage}`);
        stockDataPackage.marketStatus = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }
      
      // 2. Fetch Ticker Snapshot
      this.debugMessages.push(`[PolygonAdapter.getFullStockData] Fetching Ticker Snapshot for ${ticker.toUpperCase()}...`);
      try {
        await delay(apiCallDelay);
        const snapshotResponse = await this.client.stocks.snapshotTicker(ticker.toUpperCase());
        this.debugMessages.push(`[PolygonAdapter.getFullStockData] Ticker Snapshot API call for ${ticker.toUpperCase()} successful.`);

        if (snapshotResponse.ticker) {
          const { day, prevDay, todaysChange, todaysChangePerc, updated, lastTrade } = snapshotResponse.ticker;
          currentStockPrice = roundNumber(lastTrade?.p ?? day?.c ?? prevDay?.c, 2);
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] Current price for ${ticker.toUpperCase()} determined as: ${currentStockPrice}`);

          stockDataPackage.stockSnapshot = {
            ticker: snapshotResponse.ticker.ticker,
            day: this.mapToStockPriceData(day, day?.t || updated),
            prevDay: this.mapToStockPriceData(prevDay, prevDay?.t),
            todaysChange: roundNumber(todaysChange, 2),
            todaysChangePerc: roundNumber(todaysChangePerc, 4), 
            updated: updated,
            currentPrice: currentStockPrice, 
          } as StockSnapshotData;
        } else {
            const errMsg = `Snapshot response for ${ticker.toUpperCase()} did not contain ticker data or was malformed.`;
            this.debugMessages.push(`[PolygonAdapter.getFullStockData] ERROR: ${errMsg}`);
            throw new Error(errMsg);
        }
      } catch (error: any) {
        let detailedErrorMessage = `Polygon client error: ${error.message || String(error)}`;
        const rawErrorDetails: any = { message: error.message || String(error) }; 
        if (error.stack) rawErrorDetails.stack = error.stack.substring(0, 500);
        const polygonError = error as any; 
        if (polygonError.request_id) rawErrorDetails.requestId = polygonError.request_id;
        if (polygonError.status) rawErrorDetails.status = polygonError.status; 
        const errorMessage = `Failed to fetch snapshot for ${ticker}. ${detailedErrorMessage}`;
        console.error(`Error fetching stock snapshot for ${ticker} from Polygon (Adapter):`, JSON.stringify(rawErrorDetails, null, 2)); 
        this.debugMessages.push(`[PolygonAdapter.getFullStockData] ERROR fetching stock snapshot for ${ticker}: ${errorMessage}`);
        stockDataPackage.stockSnapshot = { error: errorMessage, rawErrorDetails: rawErrorDetails } as any;
      }

      // 3. Fetch Standard Technical Indicators
      this.debugMessages.push(`[PolygonAdapter.getFullStockData] Fetching Standard Technical Indicators for ${ticker.toUpperCase()}...`);
      const technicalIndicators: Partial<TechnicalIndicatorsData> = {};
      try {
        if (stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.day?.vw !== undefined) {
          technicalIndicators.VWAP = { value: roundNumber(stockDataPackage.stockSnapshot.day.vw, 4) };
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] Mapped VWAP: ${technicalIndicators.VWAP.value}`);
        }
        
        await delay(apiCallDelay);
        const rsiRes = await this.client.stocks.rsi(ticker.toUpperCase(), { timespan: 'day', window: 14, series_type: 'close', limit: 1 });
        if (rsiRes.results?.values?.[0]?.value) technicalIndicators.RSI = { value: roundNumber(rsiRes.results.values[0].value, 2) };
        this.debugMessages.push(`[PolygonAdapter.getFullStockData] Fetched RSI: ${technicalIndicators.RSI?.value}`);
        
        await delay(apiCallDelay);
        const emaRes = await this.client.stocks.ema(ticker.toUpperCase(), { timespan: 'day', window: 20, series_type: 'close', limit: 1 });
        if (emaRes.results?.values?.[0]?.value) technicalIndicators.EMA = { value: roundNumber(emaRes.results.values[0].value, 2) };
        this.debugMessages.push(`[PolygonAdapter.getFullStockData] Fetched EMA: ${technicalIndicators.EMA?.value}`);
        
        await delay(apiCallDelay);
        const smaRes = await this.client.stocks.sma(ticker.toUpperCase(), { timespan: 'day', window: 50, series_type: 'close', limit: 1 });
        if (smaRes.results?.values?.[0]?.value) technicalIndicators.SMA = { value: roundNumber(smaRes.results.values[0].value, 2) };
        this.debugMessages.push(`[PolygonAdapter.getFullStockData] Fetched SMA: ${technicalIndicators.SMA?.value}`);
        
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
        this.debugMessages.push(`[PolygonAdapter.getFullStockData] Fetched MACD: Value=${technicalIndicators.MACD?.value}, Signal=${technicalIndicators.MACD?.signal}, Histogram=${technicalIndicators.MACD?.histogram}`);
        stockDataPackage.technicalIndicators = technicalIndicators as TechnicalIndicatorsData;
      } catch (error: any) {
          const errorMessage = `Failed to fetch TAs for ${ticker}. Polygon client error: ${error.message || String(error)}`;
          console.error(`Error fetching technical indicators for ${ticker} from Polygon:`, error);
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] ERROR fetching TAs for ${ticker}: ${errorMessage}`);
          stockDataPackage.technicalIndicators = { ...(stockDataPackage.technicalIndicators || {}), error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }
      
      // 4. Fetch Options Chain
      this.debugMessages.push(`[PolygonAdapter.getFullStockData] Fetching Options Chain for ${ticker.toUpperCase()}...`);
      try {
        if (currentStockPrice !== undefined && currentStockPrice !== null) { 
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] Current stock price for options: ${currentStockPrice}`);
          await delay(apiCallDelay);
          const expirationDate = calculateNextFridayExpiration();
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] Calculated next Friday expiration: ${expirationDate}`);
          
          const strikePriceWindowPercentage = 0.20; 
          const lowerStrikeBound = currentStockPrice * (1 - strikePriceWindowPercentage);
          const upperStrikeBound = currentStockPrice * (1 + strikePriceWindowPercentage);
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] Options strike bounds: ${lowerStrikeBound.toFixed(2)} - ${upperStrikeBound.toFixed(2)}`);

          const commonOptionsParams = {
            expiration_date: expirationDate,
            "strike_price.gte": formatToTwoDecimals(lowerStrikeBound, "0"),
            "strike_price.lte": formatToTwoDecimals(upperStrikeBound, "0"),
            limit: 250, 
          };
          
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] Fetching CALL options... Params: ${JSON.stringify(commonOptionsParams)}`);
          const callsSnapshot = await this.client.options.snapshotOptionChain(ticker.toUpperCase(), {
            ...commonOptionsParams,
            contract_type: 'call',
          });
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] CALL options fetched. Results count: ${callsSnapshot.results?.length || 0}`);
          
          await delay(apiCallDelay);
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] Fetching PUT options... Params: ${JSON.stringify(commonOptionsParams)}`);
          const putsSnapshot = await this.client.options.snapshotOptionChain(ticker.toUpperCase(), {
            ...commonOptionsParams,
            contract_type: 'put',
          });
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] PUT options fetched. Results count: ${putsSnapshot.results?.length || 0}`);
          
          const allStrikes = new Set<number>();
          const callDataByStrike = new Map<number, any>();
          const putDataByStrike = new Map<number, any>();

          (callsSnapshot.results || []).forEach(contract => {
            const strike = roundNumber(contract.details.strike_price, 2); 
            if(strike === undefined || strike === null) return;
            allStrikes.add(strike);
            callDataByStrike.set(strike, contract);
          });

          (putsSnapshot.results || []).forEach(contract => {
            const strike = roundNumber(contract.details.strike_price, 2); 
            if(strike === undefined || strike === null) return;
            allStrikes.add(strike);
            putDataByStrike.set(strike, contract);
          });
          
          let sortedStrikes = Array.from(allStrikes).sort((a, b) => a - b); 
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] Total unique strikes fetched: ${sortedStrikes.length}`);

          let closestStrikeIndex = 0;
          if (sortedStrikes.length > 0 && currentStockPrice !== undefined) {
             closestStrikeIndex = sortedStrikes.reduce((prevIdx, currentStrikeItem, currentIdx) => {
                return (Math.abs(currentStrikeItem - currentStockPrice) < Math.abs(sortedStrikes[prevIdx] - currentStockPrice)) ? currentIdx : prevIdx;
            }, 0);
            this.debugMessages.push(`[PolygonAdapter.getFullStockData] Closest strike index to ${currentStockPrice}: ${closestStrikeIndex} (Strike: ${sortedStrikes[closestStrikeIndex]})`);
          }
          
          const startIndex = Math.max(0, closestStrikeIndex - 10);
          const endIndex = Math.min(sortedStrikes.length, closestStrikeIndex + 11); 
          const finalStrikesToProcess = sortedStrikes.slice(startIndex, endIndex).sort((a,b) => b - a); 
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] Final strikes to process (count ${finalStrikesToProcess.length}): ${finalStrikesToProcess.join(', ')}`);

          const optionsTableRows: OptionsTableRow[] = [];

          for (const strike of finalStrikesToProcess) {
            const callContractData = callDataByStrike.get(strike);
            const putContractData = putDataByStrike.get(strike);

            const mapContractData = (data: any, type: 'call' | 'put'): StreamlinedOptionContract | undefined => {
              if (!data) return undefined;
              return {
                strike_price: roundNumber(data.details.strike_price, 2)!, 
                option_type: type,
                primary_exchange: data.details.primary_exchange,
                iv: roundNumber(data.implied_volatility, 4),
                last_price: roundNumber(data.day?.close, 2), 
                change: roundNumber(data.day?.change, 2),
                percent_change: roundNumber(data.day?.change_percent, 2),
                volume: roundNumber(data.day?.volume, 0), 
                open_interest: roundNumber(data.open_interest, 0), 
                break_even_price: roundNumber(data.details?.break_even_price, 2),
                delta: roundNumber(data.greeks?.delta, 4),    
                gamma: roundNumber(data.greeks?.gamma, 4),
                theta: roundNumber(data.greeks?.theta, 4),
                vega: roundNumber(data.greeks?.vega, 4),
                rho: roundNumber(data.greeks?.rho, 4), 
                bid: roundNumber(data.last_quote?.bid, 2), 
                ask: roundNumber(data.last_quote?.ask, 2), 
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
          this.debugMessages.push(`[PolygonAdapter.getFullStockData] Mapped ${optionsTableRows.length} options table rows.`);

          stockDataPackage.optionsChain = {
            ticker: ticker,
            expiration_date: expirationDate,
            contracts: optionsTableRows, 
            underlying_price: roundNumber(currentStockPrice, 2),
          };
        } else {
            const errMsg = 'Current stock price not available for options chain fetching (snapshot likely failed).';
            this.debugMessages.push(`[PolygonAdapter.getFullStockData] ERROR: ${errMsg}`);
            stockDataPackage.optionsChain = { error: errMsg } as any;
        }
      } catch (error: any) {
        const errorMessage = `Failed to fetch options chain for ${ticker}. Polygon client error: ${error.message || String(error)}`;
        console.error(`Error fetching options chain for ${ticker} from Polygon:`, error);
        this.debugMessages.push(`[PolygonAdapter.getFullStockData] ERROR fetching options chain for ${ticker}: ${errorMessage}`);
        stockDataPackage.optionsChain = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }

      stockDataPackage.polygonAdapterDebugMessages = this.debugMessages;
      this.debugMessages.push(`[PolygonAdapter.getFullStockData] Completed for ${ticker.toUpperCase()}.`);
      return {
        stockData: stockDataPackage,
        rawRequestParams: { ticker }, // Summary of adapter input
        rawResponseSummary: { 
          ticker: stockDataPackage.ticker, 
          marketStatusLoaded: !!stockDataPackage.marketStatus && !stockDataPackage.marketStatus.error,
          snapshotLoaded: !!stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error,
          tasLoaded: !!stockDataPackage.technicalIndicators && !stockDataPackage.technicalIndicators.error,
          optionsLoaded: !!stockDataPackage.optionsChain && !stockDataPackage.optionsChain.error,
          error: stockDataPackage.error 
        },
        polygonAdapterDebugMessages: this.debugMessages,
      };

    } catch (error: any) {
      const overallErrorMessage = `Overall failure in fetching data for ${ticker}. Some data might be missing or incomplete. Original error: ${error.message || String(error)}`;
      console.error(`An unexpected error occurred in getFullStockData for ${ticker}:`, error); 
      this.debugMessages.push(`[PolygonAdapter.getFullStockData] CRITICAL ERROR for ${ticker}: ${overallErrorMessage}`);
      stockDataPackage.polygonAdapterDebugMessages = this.debugMessages;
      return {
        stockData: {
          ...stockDataPackage,
          error: overallErrorMessage,
          rawOverallError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request')))
        } as StockDataPackage,
        rawRequestParams: { ticker },
        rawResponseSummary: { error: overallErrorMessage, ticker },
        polygonAdapterDebugMessages: this.debugMessages,
      };
    }
  }
}

export async function getFullStockData(ticker: string): Promise<AdapterOutput> {
  const apiKeyFromEnv = process.env.POLYGON_API_KEY;
  const adapter = new PolygonAdapter(apiKeyFromEnv); 
  return adapter.getFullStockData(ticker);
}
