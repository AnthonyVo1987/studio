
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
    const logPrefix = `[PolygonAdapter.constructor TickerForInstance: ${this.currentTickerForClient || 'NOT_SET'}]`;

    if (!keyToUse || keyToUse.trim() === "") {
      const errorMessage = `${logPrefix} Polygon API key is MISSING or EMPTY. Adapter cannot be initialized.`;
      console.error(errorMessage);
      // Initialize with a clearly invalid key to ensure it fails if used.
      this.client = restClient("INVALID_KEY_ADAPTER_INIT_FAILURE_CONSTRUCTOR");
      return;
    }

    this.client = restClient(keyToUse);
    console.log(`${logPrefix} Initialized with API key.`);
    // Optional: A benign test call to verify API key could be placed here if needed,
    // but it adds an API call on every adapter instantiation.
    // For now, assume key is valid if provided.
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
    const instanceLogPrefix = `[PolygonAdapter.getFullStockData AdapterInstanceFor: ${this.currentTickerForClient || 'NOT_SET'}]`;
    const callLogPrefix = `${instanceLogPrefix}[RequestedTicker: ${ticker}]`;

    console.log(`${callLogPrefix} Operation START.`);

    if (this.currentTickerForClient && this.currentTickerForClient !== ticker.toUpperCase()) {
        const criticalErrorMsg = `${callLogPrefix} CRITICAL MISMATCH: Adapter instance was for ${this.currentTickerForClient} but was called to fetch data for ${ticker.toUpperCase()}. This indicates a major issue in how adapter instances are managed or used. Aborting fetch.`;
        console.error(criticalErrorMsg);
        return {
            stockData: { ticker, error: criticalErrorMsg, rawOverallError: { message: criticalErrorMsg } },
            rawRequestParams: { requestedTicker: ticker, adapterInstanceFor: this.currentTickerForClient },
            rawResponseSummary: { error: criticalErrorMsg, requestedTicker: ticker, adapterInstanceFor: this.currentTickerForClient },
        };
    }
    
    const tickerUpperCase = ticker.toUpperCase(); // Use consistent casing for API calls & comparisons

    const stockDataPackage: StockDataPackage = {
      ticker: tickerUpperCase, // Store the uppercased ticker
    };
    let currentStockPrice: number | undefined;
    const apiCallDelay = 150; 

    console.log(`${callLogPrefix} Starting data fetch operations for ${tickerUpperCase}.`);

    try {
      // 1. Fetch Market Status
      try {
        console.log(`${callLogPrefix} Fetching market status. Delay: ${apiCallDelay}ms`);
        await delay(apiCallDelay);
        const marketStatusResponse = await this.client.reference.marketStatus();
        console.log(`${callLogPrefix} Market status fetched successfully.`);
        stockDataPackage.marketStatus = {
          market: marketStatusResponse.market === 'extended-hours' ? 'Extended Hours' : marketStatusResponse.market,
          earlyHours: marketStatusResponse.earlyHours || false,
          lateHours: marketStatusResponse.lateHours || false,
          serverTime: marketStatusResponse.serverTime || new Date().toISOString(),
          exchanges: marketStatusResponse.exchanges || {},
          currencies: marketStatusResponse.currencies || {},
        } as MarketStatusData;
      } catch (error: any) {
        const errorMessage = `Failed to fetch market status for ${tickerUpperCase}. Polygon client error: ${error.message || String(error)}`;
        console.error(`${callLogPrefix} Error fetching market status:`, error);
        stockDataPackage.marketStatus = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }

      // 2. Fetch Ticker Snapshot
      try {
        console.log(`${callLogPrefix} Fetching snapshot for ${tickerUpperCase}. Delay: ${apiCallDelay}ms`);
        await delay(apiCallDelay);
        const snapshotResponse = await this.client.stocks.snapshotTicker(tickerUpperCase);
        
        if (snapshotResponse.ticker && snapshotResponse.ticker.ticker === tickerUpperCase) {
          console.log(`${callLogPrefix} Snapshot for ${tickerUpperCase} fetched successfully. Ticker in response: ${snapshotResponse.ticker.ticker}`);
          const { day, prevDay, min, todaysChange, todaysChangePerc, updated, lastTrade } = snapshotResponse.ticker;
          currentStockPrice = roundNumber(lastTrade?.p ?? day?.c ?? prevDay?.c, 2);

          stockDataPackage.stockSnapshot = {
            ticker: snapshotResponse.ticker.ticker, // Ensure this is the correct ticker
            day: this.mapToStockPriceData(day, day?.t || updated),
            prevDay: this.mapToStockPriceData(prevDay, prevDay?.t),
            min: this.mapToStockPriceData(min, min?.t || updated), 
            todaysChange: roundNumber(todaysChange, 2),
            todaysChangePerc: roundNumber(todaysChangePerc, 4),
            updated: updated,
            currentPrice: currentStockPrice,
          } as StockSnapshotData;
        } else {
            const errMsg = `Snapshot response for ${tickerUpperCase} did not contain matching ticker data or was malformed. Expected: ${tickerUpperCase}, Got in response: ${snapshotResponse.ticker?.ticker}`;
            console.error(`${callLogPrefix} ${errMsg}`);
            throw new Error(errMsg); // This will be caught by the outer catch for snapshot
        }
      } catch (error: any) {
        let detailedErrorMessage = `Polygon client error: ${error.message || String(error)}`;
        const rawErrorDetails: any = { message: error.message || String(error) };
        if (error.stack) rawErrorDetails.stack = error.stack.substring(0, 500);
        const polygonError = error as any;
        if (polygonError.request_id) rawErrorDetails.requestId = polygonError.request_id;
        if (polygonError.status) rawErrorDetails.status = polygonError.status;
        const errorMessage = `Failed to fetch snapshot for ${tickerUpperCase}. ${detailedErrorMessage}`;
        console.error(`${callLogPrefix} Error fetching stock snapshot:`, error);
        stockDataPackage.stockSnapshot = { error: errorMessage, rawErrorDetails: rawErrorDetails, ticker: tickerUpperCase } as any; // Ensure ticker is set on error object
      }

      // 3. Fetch Standard Technical Indicators
      const technicalIndicators: TechnicalIndicatorsData = {};
      let taErrorOccurred = false;
      let taErrorMessages: string[] = [];
      console.log(`${callLogPrefix} Fetching technical indicators for ${tickerUpperCase}.`);

      try {
        // RSI
        technicalIndicators.RSI = {};
        const rsiWindows = [7, 10, 14];
        for (const window of rsiWindows) {
          try {
            console.log(`${callLogPrefix} Fetching RSI(${window}) for ${tickerUpperCase}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const rsiRes = await this.client.stocks.rsi(tickerUpperCase, { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (rsiRes.results?.values?.[0]?.value) {
              (technicalIndicators.RSI as MultiWindowIndicatorValues)[String(window)] = roundNumber(rsiRes.results.values[0].value, 2);
              console.log(`${callLogPrefix} RSI(${window}) for ${tickerUpperCase} fetched: ${rsiRes.results.values[0].value}`);
            } else { console.warn(`${callLogPrefix} No RSI(${window}) data for ${tickerUpperCase}`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`RSI(${window}): ${e.message}`); console.error(`${callLogPrefix} Error fetching RSI(${window}) for ${tickerUpperCase}:`, e.message); }
        }

        // MACD
        try {
            console.log(`${callLogPrefix} Fetching MACD for ${tickerUpperCase}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const macdRes = await this.client.stocks.macd(tickerUpperCase, { timespan: 'day', series_type: 'close', limit: 1 });
            if (macdRes.results?.values?.[0]) {
              const macdValue = macdRes.results.values[0];
              technicalIndicators.MACD = {
                value: roundNumber(macdValue.value, 4),
                signal: roundNumber(macdValue.signal, 4),
                histogram: roundNumber(macdValue.histogram, 4)
              };
              console.log(`${callLogPrefix} MACD for ${tickerUpperCase} fetched: V=${macdValue.value},S=${macdValue.signal},H=${macdValue.histogram}`);
            } else { console.warn(`${callLogPrefix} No MACD data for ${tickerUpperCase}`); }
        } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`MACD: ${e.message}`); console.error(`${callLogPrefix} Error fetching MACD for ${tickerUpperCase}:`, e.message); }


        // VWAP
        technicalIndicators.VWAP = {};
        if (stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.day?.vw !== undefined) {
          (technicalIndicators.VWAP as VWAPValue).day = roundNumber(stockDataPackage.stockSnapshot.day.vw, 4);
          console.log(`${callLogPrefix} VWAP (Day) for ${tickerUpperCase} from snapshot: ${stockDataPackage.stockSnapshot.day.vw}`);
        }
        if (stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.min?.vw !== undefined) {
            (technicalIndicators.VWAP as VWAPValue).minute = roundNumber(stockDataPackage.stockSnapshot.min.vw, 4);
            console.log(`${callLogPrefix} VWAP (Minute) for ${tickerUpperCase} from snapshot: ${stockDataPackage.stockSnapshot.min.vw}`);
        }


        // EMA
        technicalIndicators.EMA = {};
        const emaWindows = [5, 10, 20, 50, 200];
        for (const window of emaWindows) {
          try {
            console.log(`${callLogPrefix} Fetching EMA(${window}) for ${tickerUpperCase}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const emaRes = await this.client.stocks.ema(tickerUpperCase, { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (emaRes.results?.values?.[0]?.value) {
              (technicalIndicators.EMA as MultiWindowIndicatorValues)[String(window)] = roundNumber(emaRes.results.values[0].value, 2);
              console.log(`${callLogPrefix} EMA(${window}) for ${tickerUpperCase} fetched: ${emaRes.results.values[0].value}`);
            } else { console.warn(`${callLogPrefix} No EMA(${window}) data for ${tickerUpperCase}`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`EMA(${window}): ${e.message}`); console.error(`${callLogPrefix} Error fetching EMA(${window}) for ${tickerUpperCase}:`, e.message); }
        }

        // SMA
        technicalIndicators.SMA = {};
        const smaWindows = [5, 10, 20, 50, 200];
        for (const window of smaWindows) {
          try {
            console.log(`${callLogPrefix} Fetching SMA(${window}) for ${tickerUpperCase}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const smaRes = await this.client.stocks.sma(tickerUpperCase, { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (smaRes.results?.values?.[0]?.value) {
              (technicalIndicators.SMA as MultiWindowIndicatorValues)[String(window)] = roundNumber(smaRes.results.values[0].value, 2);
              console.log(`${callLogPrefix} SMA(${window}) for ${tickerUpperCase} fetched: ${smaRes.results.values[0].value}`);
            } else { console.warn(`${callLogPrefix} No SMA(${window}) data for ${tickerUpperCase}`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`SMA(${window}): ${e.message}`); console.error(`${callLogPrefix} Error fetching SMA(${window}) for ${tickerUpperCase}:`, e.message); }
        }
        
        if (taErrorOccurred) {
            const combinedErrorMsg = `One or more TAs failed for ${tickerUpperCase}: ${taErrorMessages.join('; ')}`;
            console.error(`${callLogPrefix} TA Errors: ${combinedErrorMsg}`);
            technicalIndicators.error = combinedErrorMsg;
        }
        stockDataPackage.technicalIndicators = technicalIndicators;

      } catch (error: any) { 
          const errorMessage = `General error fetching TAs for ${tickerUpperCase}: ${error.message || String(error)}`;
          console.error(`${callLogPrefix} General TA Error:`, error);
          technicalIndicators.error = errorMessage;
          technicalIndicators.rawErrorDetails = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request')));
          stockDataPackage.technicalIndicators = technicalIndicators;
      }

      // 4. Fetch Options Chain
      try {
        if (currentStockPrice !== undefined && currentStockPrice !== null) {
          const expirationDate = calculateNextFridayExpiration();
          console.log(`${callLogPrefix} Fetching options chain for ${tickerUpperCase}, expiration ${expirationDate}. Current price: ${currentStockPrice}. Delay: ${apiCallDelay}ms`);
          const strikePriceWindowPercentage = 0.20; 
          const lowerStrikeBound = currentStockPrice * (1 - strikePriceWindowPercentage);
          const upperStrikeBound = currentStockPrice * (1 + strikePriceWindowPercentage);
          const commonOptionsParams: any = {
            expiration_date: expirationDate,
            "strike_price.gte": formatToTwoDecimals(lowerStrikeBound, "0"),
            "strike_price.lte": formatToTwoDecimals(upperStrikeBound, "0"),
            limit: 250, 
          };

          console.log(`${callLogPrefix} Fetching CALLS for ${tickerUpperCase}, expiration ${expirationDate}. Delay: ${apiCallDelay}ms`);
          await delay(apiCallDelay);
          const callsSnapshot = await this.client.options.snapshotOptionChain(tickerUpperCase, {
            ...commonOptionsParams, contract_type: 'call',
          });
          console.log(`${callLogPrefix} CALLS for ${tickerUpperCase} fetched. Results count: ${callsSnapshot.results?.length || 0}`);
          
          console.log(`${callLogPrefix} Fetching PUTS for ${tickerUpperCase}, expiration ${expirationDate}. Delay: ${apiCallDelay}ms`);
          await delay(apiCallDelay);
          const putsSnapshot = await this.client.options.snapshotOptionChain(tickerUpperCase, {
            ...commonOptionsParams, contract_type: 'put',
          });
          console.log(`${callLogPrefix} PUTS for ${tickerUpperCase} fetched. Results count: ${putsSnapshot.results?.length || 0}`);

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
          const endIndex = Math.min(sortedStrikes.length, closestStrikeIndex + 11); 
          const finalStrikesToProcess = sortedStrikes.slice(startIndex, endIndex).sort((a,b) => b - a); 
          const optionsTableRows: OptionsTableRow[] = [];
          console.log(`${callLogPrefix} Processing ${finalStrikesToProcess.length} strikes for options table for ${tickerUpperCase}.`);

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
            ticker: tickerUpperCase, expiration_date: expirationDate, contracts: optionsTableRows, underlying_price: roundNumber(currentStockPrice, 2),
          };
          console.log(`${callLogPrefix} Options chain for ${tickerUpperCase} processed. Number of rows: ${optionsTableRows.length}.`);
        } else {
            const errMsg = `Current stock price not available for options chain fetching for ${tickerUpperCase}.`;
            console.warn(`${callLogPrefix} ${errMsg}`);
            stockDataPackage.optionsChain = { error: errMsg, ticker: tickerUpperCase } as any; // Ensure ticker is set
        }
      } catch (error: any) {
        const errorMessage = `Failed to fetch options chain for ${tickerUpperCase}. Polygon client error: ${error.message || String(error)}`;
        console.error(`${callLogPrefix} Error fetching options chain:`, error);
        stockDataPackage.optionsChain = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))), ticker: tickerUpperCase } as any; // Ensure ticker is set
      }

      console.log(`${callLogPrefix} All data fetching operations for ${tickerUpperCase} complete.`);
      return {
        stockData: stockDataPackage,
        rawRequestParams: { requestedTicker: ticker, adapterInstanceFor: this.currentTickerForClient }, 
        rawResponseSummary: {
          requestedTicker: ticker, // Log the originally requested ticker
          adapterInstanceFor: this.currentTickerForClient,
          responseTicker: stockDataPackage.ticker, // This is the ticker from the fetched data package
          marketStatusLoaded: !!stockDataPackage.marketStatus && !stockDataPackage.marketStatus.error,
          snapshotLoaded: !!stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.ticker === tickerUpperCase,
          tasLoaded: !!stockDataPackage.technicalIndicators && !stockDataPackage.technicalIndicators.error,
          optionsLoaded: !!stockDataPackage.optionsChain && !stockDataPackage.optionsChain.error && stockDataPackage.optionsChain.ticker === tickerUpperCase,
          error: stockDataPackage.error
        },
      };

    } catch (error: any) {
      const overallErrorMessage = `Overall failure in fetching data for ${tickerUpperCase}. Some data might be missing or incomplete. Original error: ${error.message || String(error)}`;
      console.error(`${callLogPrefix} An unexpected error occurred:`, error);
      return {
        stockData: {
          ...stockDataPackage, 
          ticker: tickerUpperCase, // Ensure ticker is set even on overall failure
          error: overallErrorMessage,
          rawOverallError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request')))
        } as StockDataPackage,
        rawRequestParams: { requestedTicker: ticker, adapterInstanceFor: this.currentTickerForClient },
        rawResponseSummary: { error: overallErrorMessage, requestedTicker: ticker, adapterInstanceFor: this.currentTickerForClient, responseTicker: tickerUpperCase },
      };
    }
  }
}

export async function getFullStockData(ticker: string): Promise<AdapterOutput> {
  const apiKeyFromEnv = process.env.POLYGON_API_KEY;
  const logPrefix = `[adapter.getFullStockData GlobalExport Ticker: ${ticker}]`;
  console.log(`${logPrefix} Creating NEW PolygonAdapter instance.`);
  const adapter = new PolygonAdapter(apiKeyFromEnv, ticker.toUpperCase()); // Pass uppercased ticker to constructor
  return adapter.getFullStockData(ticker.toUpperCase()); // Call method with uppercased ticker
}
