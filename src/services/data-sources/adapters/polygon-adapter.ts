
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
      // Initialize with a clearly invalid key. This should cause auth errors from Polygon.
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
      return; // Stop constructor if key is bad
    }
    
    // If keyToUse is present
    const keyDisplay = `${keyToUse.substring(0, Math.min(5, keyToUse.length))}...${keyToUse.substring(Math.max(0, keyToUse.length - 5))}`;
    console.log(`[StockSage Debug] PolygonAdapter constructor attempting to use API key (Ends In): ...${keyToUse.substring(Math.max(0, keyToUse.length - 5))}, Length: ${keyToUse.length}`);
    this.client = restClient(keyToUse);
    
    // Test call immediately after client initialization with the actual key
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
    const apiCallDelay = 100; // 100ms delay

    if (!this.apiKeyValidForBasicCheck && process.env.POLYGON_API_KEY && process.env.POLYGON_API_KEY.trim() !== "" && process.env.POLYGON_API_KEY !== "INVALID_KEY_ADAPTER_INIT_FAILURE") {
      // This implies the constructor's async test call might not have completed or failed.
      // For critical operations, you might want to await this or handle it.
      // For now, we'll proceed but note this state.
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
        // Use the minimal parameter for snapshotTicker as per library's primary use.
        // The type definition is snapshotTicker(params: { ticker: string }): Promise<StocksSnapshot>;
        // OR snapshotTicker(symbol: string, query?: SnapshotRequest): Promise<SnapshotResponse>;
        // The { ticker: string } object form is often for the "all tickers snapshot".
        // For a single ticker, just the symbol string is common. Let's try with just the ticker string.
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
        // Avoid circular structures or overly large objects like 'config' or 'request' from Axios
        for (const prop in polygonError) {
            if (Object.prototype.hasOwnProperty.call(polygonError, prop) && typeof polygonError[prop] !== 'function' && prop !== 'config' && prop !== 'request') {
                if (!rawErrorDetails[prop]) { 
                    rawErrorDetails[prop] = polygonError[prop];
                }
            }
        }
        
        const errorMessage = `Failed to fetch snapshot for ${ticker}. ${detailedErrorMessage}`;
        console.error(`Error fetching stock snapshot for ${ticker} from Polygon (Adapter):`, JSON.stringify(rawErrorDetails, null, 2)); 
        stockDataPackage.stockSnapshot = { 
            error: errorMessage, 
            rawErrorDetails: rawErrorDetails 
        } as any;
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
        const rsiRes = await this.client.stocks.rsi(ticker, { timespan: 'day', window: 14, series_type: 'close', limit: 1 });
        if (rsiRes.results?.values?.[0]?.value) technicalIndicators.RSI = { value: rsiRes.results.values[0].value };

        await delay(apiCallDelay);
        const emaRes = await this.client.stocks.ema(ticker, { timespan: 'day', window: 20, series_type: 'close', limit: 1 });
        if (emaRes.results?.values?.[0]?.value) technicalIndicators.EMA = { value: emaRes.results.values[0].value };
        
        await delay(apiCallDelay);
        const smaRes = await this.client.stocks.sma(ticker, { timespan: 'day', window: 50, series_type: 'close', limit: 1 });
        if (smaRes.results?.values?.[0]?.value) technicalIndicators.SMA = { value: smaRes.results.values[0].value };

        await delay(apiCallDelay);
        const macdRes = await this.client.stocks.macd(ticker, { timespan: 'day', series_type: 'close', limit: 1 });
        if (macdRes.results?.values?.[0]) {
          const macdValue = macdRes.results.values[0];
          technicalIndicators.MACD = {
            value: macdValue.value,
            signal: macdValue.signal,
            histogram: macdValue.histogram,
          };
        }
        stockDataPackage.technicalIndicators = technicalIndicators;
      } catch (error: any) {
          const errorMessage = `Failed to fetch TAs for ${ticker}. Polygon client error: ${error.message || String(error)}`;
          console.error(`Error fetching technical indicators for ${ticker} from Polygon:`, error);
          stockDataPackage.technicalIndicators = { ...(stockDataPackage.technicalIndicators || {}), error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }
      
      // 4. Fetch Options Chain
      try {
        if (currentStockPrice !== undefined) { 
          await delay(apiCallDelay);
          const expirationDate = calculateNextFridayExpiration();
          const optionsChainResponse = await this.client.reference.optionsContracts({
            underlying_ticker: ticker,
            expiration_date: expirationDate,
            limit: 1000, 
          });

          const allContracts: StreamlinedOptionContract[] = (optionsChainResponse.results || []).map(contract => ({
            strike_price: contract.strike_price as number,
            option_type: contract.contract_type as 'call' | 'put',
            gamma: contract.greeks?.gamma,
            iv: contract.details?.implied_volatility,
            percent_change: contract.day?.change_percent, 
            bid: contract.last_quote?.bid,
            ask: contract.last_quote?.ask,
            last_price: contract.last_trade?.price,
            volume: contract.day?.volume,
            open_interest: contract.open_interest,
            delta: contract.greeks?.delta,
            theta: contract.greeks?.theta,
            vega: contract.greeks?.vega,
            rho: contract.greeks?.rho,
            bid_size: contract.last_quote?.bid_size,
            ask_size: contract.last_quote?.ask_size,
            change: contract.day?.change,
            contract_name: contract.ticker, 
            primary_exchange: contract.primary_exchange,
            underlying_ticker: contract.underlying_ticker,
            break_even_price: contract.details?.break_even_price,
          }));

          const uniqueStrikes = Array.from(new Set(allContracts.map(c => c.strike_price))).sort((a, b) => a - b);
          const closestStrikeIndex = uniqueStrikes.reduce((prev, curr, index) => 
            (Math.abs(curr - currentStockPrice!) < Math.abs(uniqueStrikes[prev] - currentStockPrice!) ? index : prev), 0);
          
          const startIndex = Math.max(0, closestStrikeIndex - 10);
          const endIndex = Math.min(uniqueStrikes.length - 1, closestStrikeIndex + 10);
          const selectedStrikes = uniqueStrikes.slice(startIndex, endIndex + 1);

          const optionsTableRows: OptionsTableRow[] = [];
          selectedStrikes.sort((a, b) => b - a); 

          for (const strike of selectedStrikes) {
            const callContract = allContracts.find(c => c.strike_price === strike && c.option_type === 'call');
            const putContract = allContracts.find(c => c.strike_price === strike && c.option_type === 'put');
            optionsTableRows.push({
              strike: strike,
              call: callContract ? { ...callContract } : undefined,
              put: putContract ? { ...putContract } : undefined,
            });
          }

          stockDataPackage.optionsChain = {
            ticker: ticker,
            expiration_date: expirationDate,
            contracts: optionsTableRows,
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
  // No need to check apiKeyFromEnv here again, constructor handles it.
  const adapter = new PolygonAdapter(apiKeyFromEnv); 
  return adapter.getFullStockData(ticker);
}
