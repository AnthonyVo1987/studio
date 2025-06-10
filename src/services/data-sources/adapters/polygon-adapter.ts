
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

const polygonRest: IRestClient = restClient(process.env.POLYGON_API_KEY);

class PolygonAdapter {
  private client: IRestClient;

  constructor(apiKey?: string) {
    if (!apiKey && !process.env.POLYGON_API_KEY) {
      throw new Error(
        'Polygon API key is required. Set POLYGON_API_KEY environment variable or pass it to the constructor.'
      );
    }
    this.client = restClient(apiKey || process.env.POLYGON_API_KEY);
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
      ticker, // Add ticker to the package for context
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
      } catch (error) {
        console.error(`Error fetching market status from Polygon:`, error);
        stockDataPackage.marketStatus = { error: 'Failed to fetch market status' } as any;
      }
      
      // 2. Fetch Ticker Snapshot (current day, prev day, current price)
      try {
        const snapshotResponse = await this.client.stocks.snapshotTicker({ ticker });
        if (snapshotResponse.ticker) {
          const { day, prevDay, todaysChange, todaysChangePerc, updated } = snapshotResponse.ticker;
          currentStockPrice = snapshotResponse.ticker.lastTrade?.p ?? snapshotResponse.ticker.day?.c ?? snapshotResponse.ticker.prevDay?.c;

          stockDataPackage.stockSnapshot = {
            ticker: snapshotResponse.ticker.ticker,
            day: this.mapToStockPriceData(day, day?.t || updated),
            prevDay: this.mapToStockPriceData(prevDay, prevDay?.t),
            todaysChange: todaysChange,
            todaysChangePerc: todaysChangePerc,
            updated: updated,
            currentPrice: currentStockPrice, // For convenience
          } as StockSnapshotData;
        } else {
            throw new Error('Snapshot response did not contain ticker data.');
        }
      } catch (error) {
        console.error(`Error fetching stock snapshot for ${ticker} from Polygon:`, error);
        stockDataPackage.stockSnapshot = { error: `Failed to fetch snapshot for ${ticker}` } as any;
      }

      // 3. Fetch Standard Technical Indicators (RSI, EMA, SMA, MACD) & map VWAP from snapshot
      const technicalIndicators: TechnicalIndicatorsData = {};
      try {
        if (stockDataPackage.stockSnapshot?.day?.vw) {
          technicalIndicators.VWAP = { value: stockDataPackage.stockSnapshot.day.vw };
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
      } catch (error) {
          console.error(`Error fetching technical indicators for ${ticker} from Polygon:`, error);
          stockDataPackage.technicalIndicators = { error: `Failed to fetch TAs for ${ticker}` } as any;
      }
      
      // 4. Fetch Options Chain
      try {
        if (currentStockPrice) {
          const expirationDate = calculateNextFridayExpiration();
          const optionsChainResponse = await this.client.reference.optionsContracts({
            underlying_ticker: ticker,
            expiration_date: expirationDate,
            limit: 1000, // Fetch a large number to filter client-side
          });

          const allContracts: StreamlinedOptionContract[] = (optionsChainResponse.results || []).map(contract => ({
            strike_price: contract.strike_price as number,
            option_type: contract.contract_type as 'call' | 'put',
            gamma: contract.greeks?.gamma,
            iv: contract.details?.implied_volatility,
            // Polygon might not directly provide %change for option contracts in this endpoint's basic response
            // It might be in a snapshot for the option ticker or require calculation. Placeholder for now.
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
            contract_name: contract.ticker, // For debugging or specific identification
            primary_exchange: contract.primary_exchange,
            underlying_ticker: contract.underlying_ticker,
            break_even_price: contract.details?.break_even_price,
          }));

          // Filter strikes around current price (+/- 10 actual strikes, not % based)
          const uniqueStrikes = Array.from(new Set(allContracts.map(c => c.strike_price))).sort((a, b) => a - b);
          const closestStrikeIndex = uniqueStrikes.reduce((prev, curr, index) => 
            (Math.abs(curr - currentStockPrice!) < Math.abs(uniqueStrikes[prev] - currentStockPrice!) ? index : prev), 0);
          
          const startIndex = Math.max(0, closestStrikeIndex - 10);
          const endIndex = Math.min(uniqueStrikes.length - 1, closestStrikeIndex + 10);
          const selectedStrikes = uniqueStrikes.slice(startIndex, endIndex + 1);

          const optionsTableRows: OptionsTableRow[] = [];
          selectedStrikes.sort((a, b) => b - a); // Sort descending for final output

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
            stockDataPackage.optionsChain = { error: 'Current stock price not available for options chain fetching.' } as any;
        }
      } catch (error) {
        console.error(`Error fetching options chain for ${ticker} from Polygon:`, error);
        stockDataPackage.optionsChain = { error: `Failed to fetch options chain for ${ticker}` } as any;
      }

      return {
        stockData: stockDataPackage,
      };

    } catch (error) {
      console.error(`An unexpected error occurred in getFullStockData for ${ticker}:`, error);
      // Return whatever data was partially fetched along with an error indicator
      return {
        stockData: {
          ...stockDataPackage,
          error: `Overall failure in fetching data for ${ticker}. Some data might be missing or incomplete.`,
        } as StockDataPackage,
      };
    }
  }
}

// Export an instance or the class itself, depending on desired usage pattern
// For server actions, exporting functions might be cleaner.
// For now, let's export a function that uses an instance.
const polygonAdapterInstance = new PolygonAdapter();

export async function getFullStockData(ticker: string): Promise<AdapterOutput> {
  if (!process.env.POLYGON_API_KEY) {
     console.error('POLYGON_API_KEY is not set. Returning error structure.');
     return {
       stockData: {
         ticker,
         error: 'POLYGON_API_KEY environment variable is not set. Cannot fetch data.',
       }
     };
  }
  // Re-instantiate if API key could change or pass it if necessary
  // Or rely on the global instance if API key is static from env
  return polygonAdapterInstance.getFullStockData(ticker);
}

    