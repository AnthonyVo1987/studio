
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
  MultiWindowIndicatorValues, 
  MACDValue, 
  VWAPValue, 
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
  private currentTickerForClient: string | null = null;

  constructor(apiKey?: string, tickerForThisInstance?: string) {
    const keyToUse = apiKey || process.env.POLYGON_API_KEY;
    this.currentTickerForClient = tickerForThisInstance || null;
    const logPrefix = `[PolygonAdapter.constructor Ticker: ${this.currentTickerForClient || 'UNKNOWN'}]`;

    if (!keyToUse || keyToUse.trim() === "") {
      const errorMessage = `${logPrefix} Polygon API key is MISSING or EMPTY. PolygonAdapter cannot be initialized correctly. Please set POLYGON_API_KEY environment variable.`;
      console.error(errorMessage);
      // Initialize with a clearly invalid key to ensure it fails if used.
      this.client = restClient("INVALID_KEY_ADAPTER_INIT_FAILURE");
      // Attempt a benign call to see if it fails as expected.
      this.client.reference.marketHolidays({limit:1})
        .catch(err => {
          const errorDetails = err as any;
          console.log(`${logPrefix} Polygon constructor test call (marketHolidays) with INVALID_KEY_ADAPTER_INIT_FAILURE FAILED as expected: Status: ${errorDetails?.status}, Request ID: ${errorDetails?.request_id}, Message: ${errorDetails?.message}`);
        });
      return;
    }

    this.client = restClient(keyToUse);
    console.log(`${logPrefix} Initialized with API key. Attempting Polygon constructor test call (marketHolidays)...`);
    // Perform a benign call to verify API key and connectivity.
    this.client.reference.marketHolidays({limit:1})
      .then(() => {
        console.log(`${logPrefix} Polygon constructor test call (marketHolidays) with actual key SUCCEEDED.`);
      })
      .catch(err => {
        const errorDetails = err as any;
        const msg = `${logPrefix} Polygon constructor test call (marketHolidays) with actual key FAILED: Status: ${errorDetails?.status}, Request ID: ${errorDetails?.request_id}, Message: ${errorDetails?.message}`;
        console.error(msg);
        // Note: The adapter might still partially work for some public endpoints if the key is wrong but format is okay.
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
    const logPrefix = `[PolygonAdapter.getFullStockData Ticker: ${ticker}]`;
    console.log(`${logPrefix} Operation START. Internal client instance is for ticker: ${this.currentTickerForClient}`);
    // Ensure this instance is being used for the ticker it was initialized for.
    if (this.currentTickerForClient !== ticker) {
        const criticalErrorMsg = `${logPrefix} CRITICAL MISMATCH: Adapter instance for ${this.currentTickerForClient} was called for ${ticker}. This indicates a major issue in how adapter instances are managed.`;
        console.error(criticalErrorMsg);
        return {
            stockData: { ticker, error: criticalErrorMsg, rawOverallError: { message: criticalErrorMsg } },
            rawRequestParams: { ticker },
            rawResponseSummary: { error: criticalErrorMsg, ticker },
        };
    }


    const stockDataPackage: StockDataPackage = {
      ticker,
    };
    let currentStockPrice: number | undefined;
    const apiCallDelay = 150; 

    console.log(`${logPrefix} Starting data fetch operations.`);

    try {
      // 1. Fetch Market Status
      try {
        console.log(`${logPrefix} Fetching market status. Delay: ${apiCallDelay}ms`);
        await delay(apiCallDelay);
        const marketStatusResponse = await this.client.reference.marketStatus();
        console.log(`${logPrefix} Market status fetched successfully.`);
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
        console.error(`${logPrefix} Error fetching market status:`, error);
        stockDataPackage.marketStatus = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }

      // 2. Fetch Ticker Snapshot
      try {
        console.log(`${logPrefix} Fetching snapshot. Delay: ${apiCallDelay}ms`);
        await delay(apiCallDelay);
        const snapshotResponse = await this.client.stocks.snapshotTicker(ticker.toUpperCase());
        if (snapshotResponse.ticker && snapshotResponse.ticker.ticker === ticker.toUpperCase()) {
          console.log(`${logPrefix} Snapshot fetched successfully.`);
          const { day, prevDay, min, todaysChange, todaysChangePerc, updated, lastTrade } = snapshotResponse.ticker;
          currentStockPrice = roundNumber(lastTrade?.p ?? day?.c ?? prevDay?.c, 2);

          stockDataPackage.stockSnapshot = {
            ticker: snapshotResponse.ticker.ticker,
            day: this.mapToStockPriceData(day, day?.t || updated),
            prevDay: this.mapToStockPriceData(prevDay, prevDay?.t),
            min: this.mapToStockPriceData(min, min?.t || updated), 
            todaysChange: roundNumber(todaysChange, 2),
            todaysChangePerc: roundNumber(todaysChangePerc, 4),
            updated: updated,
            currentPrice: currentStockPrice,
          } as StockSnapshotData;
        } else {
            const errMsg = `Snapshot response for ${ticker.toUpperCase()} did not contain matching ticker data or was malformed. Expected: ${ticker.toUpperCase()}, Got: ${snapshotResponse.ticker?.ticker}`;
            console.error(`${logPrefix} ${errMsg}`);
            throw new Error(errMsg);
        }
      } catch (error: any) {
        let detailedErrorMessage = `Polygon client error: ${error.message || String(error)}`;
        const rawErrorDetails: any = { message: error.message || String(error) };
        if (error.stack) rawErrorDetails.stack = error.stack.substring(0, 500);
        const polygonError = error as any;
        if (polygonError.request_id) rawErrorDetails.requestId = polygonError.request_id;
        if (polygonError.status) rawErrorDetails.status = polygonError.status;
        const errorMessage = `Failed to fetch snapshot. ${detailedErrorMessage}`;
        console.error(`${logPrefix} Error fetching stock snapshot:`, error);
        stockDataPackage.stockSnapshot = { error: errorMessage, rawErrorDetails: rawErrorDetails } as any;
      }

      // 3. Fetch Standard Technical Indicators
      const technicalIndicators: TechnicalIndicatorsData = {};
      let taErrorOccurred = false;
      let taErrorMessages: string[] = [];
      console.log(`${logPrefix} Fetching technical indicators.`);

      try {
        // RSI
        technicalIndicators.RSI = {};
        const rsiWindows = [7, 10, 14];
        for (const window of rsiWindows) {
          try {
            console.log(`${logPrefix} Fetching RSI(${window}). Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const rsiRes = await this.client.stocks.rsi(ticker.toUpperCase(), { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (rsiRes.results?.values?.[0]?.value) {
              (technicalIndicators.RSI as MultiWindowIndicatorValues)[String(window)] = roundNumber(rsiRes.results.values[0].value, 2);
              console.log(`${logPrefix} RSI(${window}) fetched: ${rsiRes.results.values[0].value}`);
            } else { console.warn(`${logPrefix} No RSI(${window}) data`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`RSI(${window}): ${e.message}`); console.error(`${logPrefix} Error fetching RSI(${window}):`, e.message); }
        }

        // MACD
        try {
            console.log(`${logPrefix} Fetching MACD. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const macdRes = await this.client.stocks.macd(ticker.toUpperCase(), { timespan: 'day', series_type: 'close', limit: 1 });
            if (macdRes.results?.values?.[0]) {
              const macdValue = macdRes.results.values[0];
              technicalIndicators.MACD = {
                value: roundNumber(macdValue.value, 4),
                signal: roundNumber(macdValue.signal, 4),
                histogram: roundNumber(macdValue.histogram, 4)
              };
              console.log(`${logPrefix} MACD fetched: V=${macdValue.value},S=${macdValue.signal},H=${macdValue.histogram}`);
            } else { console.warn(`${logPrefix} No MACD data`); }
        } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`MACD: ${e.message}`); console.error(`${logPrefix} Error fetching MACD:`, e.message); }


        // VWAP
        technicalIndicators.VWAP = {};
        if (stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.day?.vw !== undefined) {
          (technicalIndicators.VWAP as VWAPValue).day = roundNumber(stockDataPackage.stockSnapshot.day.vw, 4);
          console.log(`${logPrefix} VWAP (Day) from snapshot: ${stockDataPackage.stockSnapshot.day.vw}`);
        }
        if (stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.min?.vw !== undefined) {
            (technicalIndicators.VWAP as VWAPValue).minute = roundNumber(stockDataPackage.stockSnapshot.min.vw, 4);
            console.log(`${logPrefix} VWAP (Minute) from snapshot: ${stockDataPackage.stockSnapshot.min.vw}`);
        }


        // EMA
        technicalIndicators.EMA = {};
        const emaWindows = [5, 10, 20, 50, 200];
        for (const window of emaWindows) {
          try {
            console.log(`${logPrefix} Fetching EMA(${window}). Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const emaRes = await this.client.stocks.ema(ticker.toUpperCase(), { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (emaRes.results?.values?.[0]?.value) {
              (technicalIndicators.EMA as MultiWindowIndicatorValues)[String(window)] = roundNumber(emaRes.results.values[0].value, 2);
              console.log(`${logPrefix} EMA(${window}) fetched: ${emaRes.results.values[0].value}`);
            } else { console.warn(`${logPrefix} No EMA(${window}) data`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`EMA(${window}): ${e.message}`); console.error(`${logPrefix} Error fetching EMA(${window}):`, e.message); }
        }

        // SMA
        technicalIndicators.SMA = {};
        const smaWindows = [5, 10, 20, 50, 200];
        for (const window of smaWindows) {
          try {
            console.log(`${logPrefix} Fetching SMA(${window}). Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const smaRes = await this.client.stocks.sma(ticker.toUpperCase(), { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (smaRes.results?.values?.[0]?.value) {
              (technicalIndicators.SMA as MultiWindowIndicatorValues)[String(window)] = roundNumber(smaRes.results.values[0].value, 2);
              console.log(`${logPrefix} SMA(${window}) fetched: ${smaRes.results.values[0].value}`);
            } else { console.warn(`${logPrefix} No SMA(${window}) data`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`SMA(${window}): ${e.message}`); console.error(`${logPrefix} Error fetching SMA(${window}):`, e.message); }
        }
        
        if (taErrorOccurred) {
            const combinedErrorMsg = `One or more TAs failed: ${taErrorMessages.join('; ')}`;
            console.error(`${logPrefix} TA Errors: ${combinedErrorMsg}`);
            technicalIndicators.error = combinedErrorMsg;
        }
        stockDataPackage.technicalIndicators = technicalIndicators;

      } catch (error: any) { 
          const errorMessage = `General error fetching TAs: ${error.message || String(error)}`;
          console.error(`${logPrefix} General TA Error:`, error);
          technicalIndicators.error = errorMessage;
          technicalIndicators.rawErrorDetails = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request')));
          stockDataPackage.technicalIndicators = technicalIndicators;
      }

      // 4. Fetch Options Chain
      try {
        if (currentStockPrice !== undefined && currentStockPrice !== null) {
          const expirationDate = calculateNextFridayExpiration();
          console.log(`${logPrefix} Fetching options chain, expiration ${expirationDate}. Current price: ${currentStockPrice}. Delay: ${apiCallDelay}ms`);
          const strikePriceWindowPercentage = 0.20; 
          const lowerStrikeBound = currentStockPrice * (1 - strikePriceWindowPercentage);
          const upperStrikeBound = currentStockPrice * (1 + strikePriceWindowPercentage);
          const commonOptionsParams: any = {
            expiration_date: expirationDate,
            "strike_price.gte": formatToTwoDecimals(lowerStrikeBound, "0"),
            "strike_price.lte": formatToTwoDecimals(upperStrikeBound, "0"),
            limit: 250, 
          };

          console.log(`${logPrefix} Fetching CALLS, expiration ${expirationDate}. Delay: ${apiCallDelay}ms`);
          await delay(apiCallDelay);
          const callsSnapshot = await this.client.options.snapshotOptionChain(ticker.toUpperCase(), {
            ...commonOptionsParams, contract_type: 'call',
          });
          console.log(`${logPrefix} CALLS fetched. Results count: ${callsSnapshot.results?.length || 0}`);
          
          console.log(`${logPrefix} Fetching PUTS, expiration ${expirationDate}. Delay: ${apiCallDelay}ms`);
          await delay(apiCallDelay);
          const putsSnapshot = await this.client.options.snapshotOptionChain(ticker.toUpperCase(), {
            ...commonOptionsParams, contract_type: 'put',
          });
          console.log(`${logPrefix} PUTS fetched. Results count: ${putsSnapshot.results?.length || 0}`);

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
          let closestStrikeIndex = 0;
          if (sortedStrikes.length > 0 && currentStockPrice !== undefined) {
             closestStrikeIndex = sortedStrikes.reduce((prevIdx, currentStrikeItem, currentIdx) => {
                return (Math.abs(currentStrikeItem - currentStockPrice) < Math.abs(sortedStrikes[prevIdx] - currentStockPrice)) ? currentIdx : prevIdx;
            }, 0);
          }
          const startIndex = Math.max(0, closestStrikeIndex - 10);
          const endIndex = Math.min(sortedStrikes.length, closestStrikeIndex + 11); // Get 10 above, 10 below + ATM = 21 total
          const finalStrikesToProcess = sortedStrikes.slice(startIndex, endIndex).sort((a,b) => b - a); // Sort descending for display
          const optionsTableRows: OptionsTableRow[] = [];
          console.log(`${logPrefix} Processing ${finalStrikesToProcess.length} strikes for options table.`);

          for (const strike of finalStrikesToProcess) {
            const callContractData = callDataByStrike.get(strike);
            const putContractData = putDataByStrike.get(strike);
            const mapContractData = (data: any, type: 'call' | 'put'): StreamlinedOptionContract | undefined => {
              if (!data) return undefined;
              return {
                strike_price: roundNumber(data.details.strike_price, 2)!, option_type: type,
                primary_exchange: data.details.primary_exchange, iv: roundNumber(data.implied_volatility, 4),
                last_price: roundNumber(data.day?.close, 2), change: roundNumber(data.day?.change, 2),
                percent_change: roundNumber(data.day?.change_percent, 2), volume: roundNumber(data.day?.volume, 0),
                open_interest: roundNumber(data.open_interest, 0), break_even_price: roundNumber(data.details?.break_even_price, 2),
                delta: roundNumber(data.greeks?.delta, 4), gamma: roundNumber(data.greeks?.gamma, 4),
                theta: roundNumber(data.greeks?.theta, 4), vega: roundNumber(data.greeks?.vega, 4),
                rho: roundNumber(data.greeks?.rho, 4), bid: roundNumber(data.last_quote?.bid, 2),
                ask: roundNumber(data.last_quote?.ask, 2), bid_size: data.last_quote?.bs, ask_size: data.last_quote?.as,
              };
            };
            optionsTableRows.push({ strike: strike, call: mapContractData(callContractData, 'call'), put: mapContractData(putContractData, 'put') });
          }
          stockDataPackage.optionsChain = {
            ticker: ticker, expiration_date: expirationDate, contracts: optionsTableRows, underlying_price: roundNumber(currentStockPrice, 2),
          };
          console.log(`${logPrefix} Options chain processed. Number of rows: ${optionsTableRows.length}.`);
        } else {
            const errMsg = 'Current stock price not available for options chain fetching.';
            console.warn(`${logPrefix} ${errMsg}`);
            stockDataPackage.optionsChain = { error: errMsg } as any;
        }
      } catch (error: any) {
        const errorMessage = `Failed to fetch options chain. Polygon client error: ${error.message || String(error)}`;
        console.error(`${logPrefix} Error fetching options chain:`, error);
        stockDataPackage.optionsChain = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }

      console.log(`${logPrefix} All data fetching operations complete.`);
      return {
        stockData: stockDataPackage,
        rawRequestParams: { ticker }, // Log the ticker this specific call was for
        rawResponseSummary: {
          ticker: stockDataPackage.ticker, // This should match the request ticker
          marketStatusLoaded: !!stockDataPackage.marketStatus && !stockDataPackage.marketStatus.error,
          snapshotLoaded: !!stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.ticker === ticker.toUpperCase(),
          tasLoaded: !!stockDataPackage.technicalIndicators && !stockDataPackage.technicalIndicators.error,
          optionsLoaded: !!stockDataPackage.optionsChain && !stockDataPackage.optionsChain.error && stockDataPackage.optionsChain.ticker === ticker.toUpperCase(),
          error: stockDataPackage.error
        },
      };

    } catch (error: any) {
      const overallErrorMessage = `Overall failure in fetching data. Some data might be missing or incomplete. Original error: ${error.message || String(error)}`;
      console.error(`${logPrefix} An unexpected error occurred:`, error);
      return {
        stockData: {
          ...stockDataPackage, // Return whatever was partially collected
          error: overallErrorMessage,
          rawOverallError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request')))
        } as StockDataPackage,
        rawRequestParams: { ticker },
        rawResponseSummary: { error: overallErrorMessage, ticker },
      };
    }
  }
}

// This is the key change: `getFullStockData` now creates a *new* PolygonAdapter for each call,
// passing the specific ticker to the adapter's constructor.
// This ensures that each call sequence for a ticker uses a fresh client instance
// that is explicitly aware of the ticker it's supposed to be working with.
export async function getFullStockData(ticker: string): Promise<AdapterOutput> {
  const apiKeyFromEnv = process.env.POLYGON_API_KEY;
  console.log(`[adapter.getFullStockData function (global scope)] Creating new PolygonAdapter for ticker: ${ticker}`);
  const adapter = new PolygonAdapter(apiKeyFromEnv, ticker); // Pass ticker to constructor
  return adapter.getFullStockData(ticker);
}

