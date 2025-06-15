
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
  private readonly currentTickerForClient: string; // Made readonly and non-null

  constructor(apiKey?: string, tickerForThisInstance?: string) {
    const keyToUse = apiKey || process.env.POLYGON_API_KEY;
    this.currentTickerForClient = (tickerForThisInstance || "UNKNOWN_TICKER_AT_CONSTRUCTION").toUpperCase();
    const logPrefix = `[PolygonAdapter.constructor InstanceFor: ${this.currentTickerForClient}]`;

    if (!keyToUse || keyToUse.trim() === "" || keyToUse === "INVALID_KEY_ADAPTER_INIT_FAILURE_CONSTRUCTOR") {
      const errorMessage = `${logPrefix} Polygon API key is MISSING, EMPTY, or previously marked INVALID. Adapter cannot be properly initialized.`;
      console.error(errorMessage);
      this.client = restClient("INVALID_KEY_ADAPTER_INIT_FAILURE_CONSTRUCTOR"); // Ensure it uses an invalid key
      // No need to throw an error here, as getFullStockData will fail if this client is used.
      return;
    }
    
    console.log(`${logPrefix} Initializing with API key.`);
    this.client = restClient(keyToUse);
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
    const requestedTickerMethodArg = ticker.toUpperCase();
    const logPrefix = `[PolygonAdapter.getFullStockData InstanceFor: ${this.currentTickerForClient}][Requested: ${requestedTickerMethodArg}]`;
    
    console.log(`${logPrefix} Method START. Verifying internal ticker consistency.`);

    if (this.currentTickerForClient !== requestedTickerMethodArg) {
        const criticalErrorMsg = `${logPrefix} CRITICAL MISMATCH: Adapter instance was constructed for ${this.currentTickerForClient} but method called with ${requestedTickerMethodArg}. Aborting fetch. This indicates an issue in how adapter instances are created or used.`;
        console.error(criticalErrorMsg);
        return {
            stockData: { ticker: requestedTickerMethodArg, error: criticalErrorMsg, rawOverallError: { message: criticalErrorMsg } },
            rawRequestParams: { requestedTicker: requestedTickerMethodArg, adapterInstanceFor: this.currentTickerForClient },
            rawResponseSummary: { error: criticalErrorMsg, requestedTicker: requestedTickerMethodArg, adapterInstanceFor: this.currentTickerForClient },
        };
    }
    
    const stockDataPackage: StockDataPackage = {
      ticker: this.currentTickerForClient, // Use the validated instance ticker
    };
    let currentStockPrice: number | undefined;
    const apiCallDelay = 150; 

    console.log(`${logPrefix} Starting data fetch operations for ${this.currentTickerForClient}.`);

    try {
      // 1. Fetch Market Status
      try {
        console.log(`${logPrefix} Fetching market status (generic call). Delay: ${apiCallDelay}ms`);
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
        const errorMessage = `Failed to fetch market status for ${this.currentTickerForClient}. Polygon client error: ${error.message || String(error)}`;
        console.error(`${logPrefix} Error fetching market status:`, error);
        stockDataPackage.marketStatus = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }

      // 2. Fetch Ticker Snapshot
      try {
        console.log(`${logPrefix} Fetching snapshot for ${this.currentTickerForClient}. Delay: ${apiCallDelay}ms`);
        await delay(apiCallDelay);
        const snapshotResponse = await this.client.stocks.snapshotTicker(this.currentTickerForClient);
        
        if (snapshotResponse.ticker && snapshotResponse.ticker.ticker === this.currentTickerForClient) {
          console.log(`${logPrefix} Snapshot for ${this.currentTickerForClient} fetched successfully. Ticker in response: ${snapshotResponse.ticker.ticker}`);
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
            const errMsg = `Snapshot response for ${this.currentTickerForClient} did not contain matching ticker data or was malformed. Expected: ${this.currentTickerForClient}, Got in response: ${snapshotResponse.ticker?.ticker}`;
            console.error(`${logPrefix} ${errMsg}. Response:`, snapshotResponse);
            throw new Error(errMsg); 
        }
      } catch (error: any) {
        let detailedErrorMessage = `Polygon client error: ${error.message || String(error)}`;
        const rawErrorDetails: any = { message: error.message || String(error) };
        if (error.stack) rawErrorDetails.stack = error.stack.substring(0, 500);
        const polygonError = error as any;
        if (polygonError.request_id) rawErrorDetails.requestId = polygonError.request_id;
        if (polygonError.status) rawErrorDetails.status = polygonError.status;
        const errorMessage = `Failed to fetch snapshot for ${this.currentTickerForClient}. ${detailedErrorMessage}`;
        console.error(`${logPrefix} Error fetching stock snapshot:`, error);
        stockDataPackage.stockSnapshot = { error: errorMessage, rawErrorDetails: rawErrorDetails, ticker: this.currentTickerForClient } as any;
      }

      // 3. Fetch Standard Technical Indicators
      const technicalIndicators: TechnicalIndicatorsData = {};
      let taErrorOccurred = false;
      let taErrorMessages: string[] = [];
      console.log(`${logPrefix} Fetching technical indicators for ${this.currentTickerForClient}.`);

      try {
        technicalIndicators.RSI = {};
        const rsiWindows = [7, 10, 14];
        for (const window of rsiWindows) {
          try {
            console.log(`${logPrefix} Fetching RSI(${window}) for ${this.currentTickerForClient}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const rsiRes = await this.client.stocks.rsi(this.currentTickerForClient, { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (rsiRes.results?.values?.[0]?.value) {
              (technicalIndicators.RSI as MultiWindowIndicatorValues)[String(window)] = roundNumber(rsiRes.results.values[0].value, 2);
              console.log(`${logPrefix} RSI(${window}) for ${this.currentTickerForClient} fetched: ${rsiRes.results.values[0].value}`);
            } else { console.warn(`${logPrefix} No RSI(${window}) data for ${this.currentTickerForClient}. Response:`, rsiRes); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`RSI(${window}): ${e.message}`); console.error(`${logPrefix} Error fetching RSI(${window}) for ${this.currentTickerForClient}:`, e.message); }
        }

        try {
            console.log(`${logPrefix} Fetching MACD for ${this.currentTickerForClient}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const macdRes = await this.client.stocks.macd(this.currentTickerForClient, { timespan: 'day', series_type: 'close', limit: 1 });
            if (macdRes.results?.values?.[0]) {
              const macdValue = macdRes.results.values[0];
              technicalIndicators.MACD = {
                value: roundNumber(macdValue.value, 4),
                signal: roundNumber(macdValue.signal, 4),
                histogram: roundNumber(macdValue.histogram, 4)
              };
              console.log(`${logPrefix} MACD for ${this.currentTickerForClient} fetched: V=${macdValue.value},S=${macdValue.signal},H=${macdValue.histogram}`);
            } else { console.warn(`${logPrefix} No MACD data for ${this.currentTickerForClient}. Response:`, macdRes); }
        } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`MACD: ${e.message}`); console.error(`${logPrefix} Error fetching MACD for ${this.currentTickerForClient}:`, e.message); }

        technicalIndicators.VWAP = {};
        if (stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.day?.vw !== undefined) {
          (technicalIndicators.VWAP as VWAPValue).day = roundNumber(stockDataPackage.stockSnapshot.day.vw, 4);
        }
        if (stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.min?.vw !== undefined) {
            (technicalIndicators.VWAP as VWAPValue).minute = roundNumber(stockDataPackage.stockSnapshot.min.vw, 4);
        }

        technicalIndicators.EMA = {};
        const emaWindows = [5, 10, 20, 50, 200];
        for (const window of emaWindows) {
          try {
            console.log(`${logPrefix} Fetching EMA(${window}) for ${this.currentTickerForClient}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const emaRes = await this.client.stocks.ema(this.currentTickerForClient, { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (emaRes.results?.values?.[0]?.value) {
              (technicalIndicators.EMA as MultiWindowIndicatorValues)[String(window)] = roundNumber(emaRes.results.values[0].value, 2);
            } else { console.warn(`${logPrefix} No EMA(${window}) data for ${this.currentTickerForClient}. Response:`, emaRes); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`EMA(${window}): ${e.message}`); console.error(`${logPrefix} Error fetching EMA(${window}) for ${this.currentTickerForClient}:`, e.message); }
        }

        technicalIndicators.SMA = {};
        const smaWindows = [5, 10, 20, 50, 200];
        for (const window of smaWindows) {
          try {
            console.log(`${logPrefix} Fetching SMA(${window}) for ${this.currentTickerForClient}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const smaRes = await this.client.stocks.sma(this.currentTickerForClient, { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (smaRes.results?.values?.[0]?.value) {
              (technicalIndicators.SMA as MultiWindowIndicatorValues)[String(window)] = roundNumber(smaRes.results.values[0].value, 2);
            } else { console.warn(`${logPrefix} No SMA(${window}) data for ${this.currentTickerForClient}. Response:`, smaRes); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`SMA(${window}): ${e.message}`); console.error(`${logPrefix} Error fetching SMA(${window}) for ${this.currentTickerForClient}:`, e.message); }
        }
        
        if (taErrorOccurred) {
            const combinedErrorMsg = `One or more TAs failed for ${this.currentTickerForClient}: ${taErrorMessages.join('; ')}`;
            console.error(`${logPrefix} TA Errors: ${combinedErrorMsg}`);
            technicalIndicators.error = combinedErrorMsg;
        }
        stockDataPackage.technicalIndicators = technicalIndicators;

      } catch (error: any) { 
          const errorMessage = `General error fetching TAs for ${this.currentTickerForClient}: ${error.message || String(error)}`;
          console.error(`${logPrefix} General TA Error:`, error);
          technicalIndicators.error = errorMessage;
          technicalIndicators.rawErrorDetails = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request')));
          stockDataPackage.technicalIndicators = technicalIndicators;
      }

      // 4. Fetch Options Chain
      try {
        if (currentStockPrice !== undefined && currentStockPrice !== null) {
          const expirationDate = calculateNextFridayExpiration();
          const strikePriceWindowPercentage = 0.20; 
          const lowerStrikeBound = currentStockPrice * (1 - strikePriceWindowPercentage);
          const upperStrikeBound = currentStockPrice * (1 + strikePriceWindowPercentage);
          const commonOptionsParams: any = {
            expiration_date: expirationDate,
            "strike_price.gte": formatToTwoDecimals(lowerStrikeBound, "0"),
            "strike_price.lte": formatToTwoDecimals(upperStrikeBound, "0"),
            limit: 250, 
          };

          console.log(`${logPrefix} Fetching CALLS for ${this.currentTickerForClient}, expiration ${expirationDate}. Current price for strike window: ${currentStockPrice}. Delay: ${apiCallDelay}ms`);
          await delay(apiCallDelay);
          const callsSnapshot = await this.client.options.snapshotOptionChain(this.currentTickerForClient, {
            ...commonOptionsParams, contract_type: 'call',
          });
          
          console.log(`${logPrefix} Fetching PUTS for ${this.currentTickerForClient}, expiration ${expirationDate}. Delay: ${apiCallDelay}ms`);
          await delay(apiCallDelay);
          const putsSnapshot = await this.client.options.snapshotOptionChain(this.currentTickerForClient, {
            ...commonOptionsParams, contract_type: 'put',
          });

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
            ticker: this.currentTickerForClient, expiration_date: expirationDate, contracts: optionsTableRows, underlying_price: roundNumber(currentStockPrice, 2),
          };
        } else {
            const errMsg = `Current stock price not available for options chain fetching for ${this.currentTickerForClient}. Snapshot data: ${JSON.stringify(stockDataPackage.stockSnapshot).substring(0,200)}`;
            console.warn(`${logPrefix} ${errMsg}`);
            stockDataPackage.optionsChain = { error: errMsg, ticker: this.currentTickerForClient } as any;
        }
      } catch (error: any) {
        const errorMessage = `Failed to fetch options chain for ${this.currentTickerForClient}. Polygon client error: ${error.message || String(error)}`;
        console.error(`${logPrefix} Error fetching options chain:`, error);
        stockDataPackage.optionsChain = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))), ticker: this.currentTickerForClient } as any;
      }

      console.log(`${logPrefix} All data fetching operations for ${this.currentTickerForClient} complete.`);
      return {
        stockData: stockDataPackage,
        rawRequestParams: { requestedTicker: requestedTickerMethodArg, adapterInstanceFor: this.currentTickerForClient }, 
        rawResponseSummary: {
          requestedTicker: requestedTickerMethodArg, 
          adapterInstanceFor: this.currentTickerForClient,
          responseTicker: stockDataPackage.ticker, 
          marketStatusLoaded: !!stockDataPackage.marketStatus && !stockDataPackage.marketStatus.error,
          snapshotLoaded: !!stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.ticker === this.currentTickerForClient,
          tasLoaded: !!stockDataPackage.technicalIndicators && !stockDataPackage.technicalIndicators.error,
          optionsLoaded: !!stockDataPackage.optionsChain && !stockDataPackage.optionsChain.error && stockDataPackage.optionsChain.ticker === this.currentTickerForClient,
          error: stockDataPackage.error
        },
      };

    } catch (error: any) {
      const overallErrorMessage = `Overall failure in fetching data for ${this.currentTickerForClient}. Some data might be missing or incomplete. Original error: ${error.message || String(error)}`;
      console.error(`${logPrefix} An unexpected error occurred:`, error);
      return {
        stockData: {
          ...stockDataPackage, 
          ticker: this.currentTickerForClient, 
          error: overallErrorMessage,
          rawOverallError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request')))
        } as StockDataPackage,
        rawRequestParams: { requestedTicker: requestedTickerMethodArg, adapterInstanceFor: this.currentTickerForClient },
        rawResponseSummary: { error: overallErrorMessage, requestedTicker: requestedTickerMethodArg, adapterInstanceFor: this.currentTickerForClient, responseTicker: this.currentTickerForClient },
      };
    }
  }
}

export async function getFullStockData(ticker: string): Promise<AdapterOutput> {
  const apiKeyFromEnv = process.env.POLYGON_API_KEY;
  const uppercasedTicker = ticker.toUpperCase();
  const logPrefix = `[adapter.getFullStockData GlobalExport ForTicker: ${uppercasedTicker}]`;
  console.log(`${logPrefix} Creating NEW PolygonAdapter instance.`);
  const adapter = new PolygonAdapter(apiKeyFromEnv, uppercasedTicker); 
  return adapter.getFullStockData(uppercasedTicker); 
}

