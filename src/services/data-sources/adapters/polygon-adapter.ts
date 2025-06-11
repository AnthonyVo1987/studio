
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

// Ensure Polygon API key is available
if (!process.env.POLYGON_API_KEY) {
  console.warn(
    'POLYGON_API_KEY environment variable is not set. PolygonAdapter will not function.'
  );
}

class PolygonAdapter {
  private client: IRestClient;

  constructor(apiKey?: string) {
    const keyToUse = apiKey || process.env.POLYGON_API_KEY;
    if (!keyToUse) {
      console.error('Polygon API key is missing or empty. PolygonAdapter may not function correctly.');
    }
    this.client = restClient(keyToUse);
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

    try {
      // 1. Fetch Market Status
      try {
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
        stockDataPackage.marketStatus = { error: errorMessage, rawError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))) } as any;
      }
      
      // 2. Fetch Ticker Snapshot (current day, prev day, current price)
      try {
        const snapshotResponse = await this.client.stocks.snapshotTicker({ ticker });
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
        let rawErrorDetails: any = { message: error.message };

        if (error.stack) rawErrorDetails.stack = error.stack.substring(0, 500);
        // For Polygon, error responses might be structured differently than typical HTTP libraries
        // Check for common fields in Polygon error objects if known, or serialize safely
        if (error.request_id) rawErrorDetails.requestId = error.request_id;
        if (error.status) rawErrorDetails.status = error.status; // Polygon sometimes includes a status in error obj
        
        // Attempt to capture more context if it's an HTTP-like error from the client library
        if (typeof error === 'object' && error !== null) {
            for (const prop in error) {
                if (Object.prototype.hasOwnProperty.call(error, prop) && typeof error[prop] !== 'function' && typeof error[prop] !== 'object') {
                    rawErrorDetails[prop] = error[prop];
                }
            }
        }

        const errorMessage = `Failed to fetch snapshot for ${ticker}. ${detailedErrorMessage}`;
        console.error(`Error fetching stock snapshot for ${ticker} from Polygon:`, error); // Full error to server logs
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

        const rsiRes = await this.client.stocks.rsi(ticker, { timespan: 'day', window: 14, series_type: 'close', limit: 1 });
        if (rsiRes.results?.values?.[0]?.value) technicalIndicators.RSI = { value: rsiRes.results.values[0].value };

        const emaRes = await this.client.stocks.ema(ticker, { timespan: 'day', window: 20, series_type: 'close', limit: 1 });
        if (emaRes.results?.values?.[0]?.value) technicalIndicators.EMA = { value: emaRes.results.values[0].value };
        
        const smaRes = await this.client.stocks.sma(ticker, { timespan: 'day', window: 50, series_type: 'close', limit: 1 });
        if (smaRes.results?.values?.[0]?.value) technicalIndicators.SMA = { value: smaRes.results.values[0].value };

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
          stockDataPackage.technicalIndicators = { ...(stockDataPackage.technicalIndicators || {}), error: errorMessage, rawError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))) } as any;
      }
      
      // 4. Fetch Options Chain
      try {
        if (currentStockPrice !== undefined) { 
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
        stockDataPackage.optionsChain = { error: errorMessage, rawError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))) } as any;
      }

      return {
        stockData: stockDataPackage,
        // rawRequestParams and rawResponse are not populated by this adapter structure
      };

    } catch (error: any) {
      const overallErrorMessage = `Overall failure in fetching data for ${ticker}. Some data might be missing or incomplete. Original error: ${error.message || String(error)}`;
      console.error(`An unexpected error occurred in getFullStockData for ${ticker}:`, error); // Full error to server logs
      return {
        stockData: {
          ...stockDataPackage,
          error: overallErrorMessage,
          rawOverallError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
        } as StockDataPackage,
      };
    }
  }
}

export async function getFullStockData(ticker: string): Promise<AdapterOutput> {
  if (!process.env.POLYGON_API_KEY || process.env.POLYGON_API_KEY.trim() === "") { 
     console.error('POLYGON_API_KEY is not set or is empty. Returning error structure.');
     return {
       stockData: {
         ticker,
         error: 'POLYGON_API_KEY environment variable is not set or is empty. Cannot fetch data.',
       }
     };
  }
  const adapter = new PolygonAdapter(); 
  return adapter.getFullStockData(ticker);
}
    

    