
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

  constructor(apiKey?: string) {
    const keyToUse = apiKey || process.env.POLYGON_API_KEY;

    if (!keyToUse || keyToUse.trim() === "") {
      const errorMessage = "[StockSage Critical Error] Polygon API key is MISSING or EMPTY. PolygonAdapter cannot be initialized correctly. Please set POLYGON_API_KEY environment variable.";
      console.error(errorMessage);
      this.client = restClient("INVALID_KEY_ADAPTER_INIT_FAILURE");
      this.client.reference.marketHolidays({limit:1})
        .catch(err => {
          const errorDetails = err as any;
          console.log(`[PolygonAdapter.constructor] Polygon constructor test call (marketHolidays) with INVALID_KEY_ADAPTER_INIT_FAILURE FAILED as expected: Status: ${errorDetails?.status}, Request ID: ${errorDetails?.request_id}, Message: ${errorDetails?.message}`);
        });
      return;
    }

    this.client = restClient(keyToUse);
    console.log("[PolygonAdapter.constructor] Attempting Polygon constructor test call (marketHolidays)...");
    this.client.reference.marketHolidays({limit:1})
      .then(() => {
        console.log("[PolygonAdapter.constructor] Polygon constructor test call (marketHolidays) with actual key SUCCEEDED.");
      })
      .catch(err => {
        const errorDetails = err as any;
        const msg = `[PolygonAdapter.constructor] Polygon constructor test call (marketHolidays) with actual key FAILED: Status: ${errorDetails?.status}, Request ID: ${errorDetails?.request_id}, Message: ${errorDetails?.message}`;
        console.error(msg);
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
    const stockDataPackage: StockDataPackage = {
      ticker,
    };
    let currentStockPrice: number | undefined;
    const apiCallDelay = 150; 

    console.log(`[PolygonAdapter.getFullStockData] Starting data fetch for ${ticker}`);

    try {
      // 1. Fetch Market Status
      try {
        console.log(`[PolygonAdapter.getFullStockData] Fetching market status. Delay: ${apiCallDelay}ms`);
        await delay(apiCallDelay);
        const marketStatusResponse = await this.client.reference.marketStatus();
        console.log(`[PolygonAdapter.getFullStockData] Market status fetched successfully.`);
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
        console.error(`[PolygonAdapter.getFullStockData] Error fetching market status:`, error);
        stockDataPackage.marketStatus = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }

      // 2. Fetch Ticker Snapshot
      try {
        console.log(`[PolygonAdapter.getFullStockData] Fetching snapshot for ${ticker}. Delay: ${apiCallDelay}ms`);
        await delay(apiCallDelay);
        const snapshotResponse = await this.client.stocks.snapshotTicker(ticker.toUpperCase());
        if (snapshotResponse.ticker) {
          console.log(`[PolygonAdapter.getFullStockData] Snapshot for ${ticker} fetched successfully.`);
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
            const errMsg = `Snapshot response for ${ticker.toUpperCase()} did not contain ticker data or was malformed.`;
            console.error(`[PolygonAdapter.getFullStockData] ${errMsg}`);
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
        console.error(`[PolygonAdapter.getFullStockData] Error fetching stock snapshot for ${ticker}:`, error);
        stockDataPackage.stockSnapshot = { error: errorMessage, rawErrorDetails: rawErrorDetails } as any;
      }

      // 3. Fetch Standard Technical Indicators
      const technicalIndicators: TechnicalIndicatorsData = {};
      let taErrorOccurred = false;
      let taErrorMessages: string[] = [];
      console.log(`[PolygonAdapter.getFullStockData] Fetching technical indicators for ${ticker}.`);

      try {
        // RSI
        technicalIndicators.RSI = {};
        const rsiWindows = [7, 10, 14];
        for (const window of rsiWindows) {
          try {
            console.log(`[PolygonAdapter.getFullStockData] Fetching RSI(${window}) for ${ticker}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const rsiRes = await this.client.stocks.rsi(ticker.toUpperCase(), { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (rsiRes.results?.values?.[0]?.value) {
              (technicalIndicators.RSI as MultiWindowIndicatorValues)[String(window)] = roundNumber(rsiRes.results.values[0].value, 2);
              console.log(`[PolygonAdapter.getFullStockData] RSI(${window}) for ${ticker} fetched: ${rsiRes.results.values[0].value}`);
            } else { console.warn(`[PolygonAdapter.getFullStockData] No RSI(${window}) data for ${ticker}`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`RSI(${window}): ${e.message}`); console.error(`[PolygonAdapter.getFullStockData] Error fetching RSI(${window}) for ${ticker}:`, e.message); }
        }

        // MACD
        try {
            console.log(`[PolygonAdapter.getFullStockData] Fetching MACD for ${ticker}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const macdRes = await this.client.stocks.macd(ticker.toUpperCase(), { timespan: 'day', series_type: 'close', limit: 1 });
            if (macdRes.results?.values?.[0]) {
              const macdValue = macdRes.results.values[0];
              technicalIndicators.MACD = {
                value: roundNumber(macdValue.value, 4),
                signal: roundNumber(macdValue.signal, 4),
                histogram: roundNumber(macdValue.histogram, 4)
              };
              console.log(`[PolygonAdapter.getFullStockData] MACD for ${ticker} fetched: V=${macdValue.value},S=${macdValue.signal},H=${macdValue.histogram}`);
            } else { console.warn(`[PolygonAdapter.getFullStockData] No MACD data for ${ticker}`); }
        } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`MACD: ${e.message}`); console.error(`[PolygonAdapter.getFullStockData] Error fetching MACD for ${ticker}:`, e.message); }


        // VWAP
        technicalIndicators.VWAP = {};
        if (stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.day?.vw !== undefined) {
          (technicalIndicators.VWAP as VWAPValue).day = roundNumber(stockDataPackage.stockSnapshot.day.vw, 4);
          console.log(`[PolygonAdapter.getFullStockData] VWAP (Day) for ${ticker} from snapshot: ${stockDataPackage.stockSnapshot.day.vw}`);
        }
        if (stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.min?.vw !== undefined) {
            (technicalIndicators.VWAP as VWAPValue).minute = roundNumber(stockDataPackage.stockSnapshot.min.vw, 4);
            console.log(`[PolygonAdapter.getFullStockData] VWAP (Minute) for ${ticker} from snapshot: ${stockDataPackage.stockSnapshot.min.vw}`);
        }


        // EMA
        technicalIndicators.EMA = {};
        const emaWindows = [5, 10, 20, 50, 200];
        for (const window of emaWindows) {
          try {
            console.log(`[PolygonAdapter.getFullStockData] Fetching EMA(${window}) for ${ticker}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const emaRes = await this.client.stocks.ema(ticker.toUpperCase(), { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (emaRes.results?.values?.[0]?.value) {
              (technicalIndicators.EMA as MultiWindowIndicatorValues)[String(window)] = roundNumber(emaRes.results.values[0].value, 2);
              console.log(`[PolygonAdapter.getFullStockData] EMA(${window}) for ${ticker} fetched: ${emaRes.results.values[0].value}`);
            } else { console.warn(`[PolygonAdapter.getFullStockData] No EMA(${window}) data for ${ticker}`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`EMA(${window}): ${e.message}`); console.error(`[PolygonAdapter.getFullStockData] Error fetching EMA(${window}) for ${ticker}:`, e.message); }
        }

        // SMA
        technicalIndicators.SMA = {};
        const smaWindows = [5, 10, 20, 50, 200];
        for (const window of smaWindows) {
          try {
            console.log(`[PolygonAdapter.getFullStockData] Fetching SMA(${window}) for ${ticker}. Delay: ${apiCallDelay}ms`);
            await delay(apiCallDelay);
            const smaRes = await this.client.stocks.sma(ticker.toUpperCase(), { timespan: 'day', window, series_type: 'close', limit: 1 });
            if (smaRes.results?.values?.[0]?.value) {
              (technicalIndicators.SMA as MultiWindowIndicatorValues)[String(window)] = roundNumber(smaRes.results.values[0].value, 2);
              console.log(`[PolygonAdapter.getFullStockData] SMA(${window}) for ${ticker} fetched: ${smaRes.results.values[0].value}`);
            } else { console.warn(`[PolygonAdapter.getFullStockData] No SMA(${window}) data for ${ticker}`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`SMA(${window}): ${e.message}`); console.error(`[PolygonAdapter.getFullStockData] Error fetching SMA(${window}) for ${ticker}:`, e.message); }
        }
        
        if (taErrorOccurred) {
            const combinedErrorMsg = `One or more TAs failed: ${taErrorMessages.join('; ')}`;
            console.error(`[PolygonAdapter.getFullStockData] TA Errors for ${ticker}: ${combinedErrorMsg}`);
            technicalIndicators.error = combinedErrorMsg;
        }
        stockDataPackage.technicalIndicators = technicalIndicators;

      } catch (error: any) { 
          const errorMessage = `General error fetching TAs for ${ticker}: ${error.message || String(error)}`;
          console.error(`[PolygonAdapter.getFullStockData] General TA Error for ${ticker}:`, error);
          technicalIndicators.error = errorMessage;
          technicalIndicators.rawErrorDetails = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request')));
          stockDataPackage.technicalIndicators = technicalIndicators;
      }

      // 4. Fetch Options Chain
      try {
        if (currentStockPrice !== undefined && currentStockPrice !== null) {
          const expirationDate = calculateNextFridayExpiration();
          console.log(`[PolygonAdapter.getFullStockData] Fetching options chain for ${ticker}, expiration ${expirationDate}. Current price: ${currentStockPrice}. Delay: ${apiCallDelay}ms`);
          const strikePriceWindowPercentage = 0.20; 
          const lowerStrikeBound = currentStockPrice * (1 - strikePriceWindowPercentage);
          const upperStrikeBound = currentStockPrice * (1 + strikePriceWindowPercentage);
          const commonOptionsParams: any = {
            expiration_date: expirationDate,
            "strike_price.gte": formatToTwoDecimals(lowerStrikeBound, "0"),
            "strike_price.lte": formatToTwoDecimals(upperStrikeBound, "0"),
            limit: 250, 
          };

          console.log(`[PolygonAdapter.getFullStockData] Fetching CALLS for ${ticker}, expiration ${expirationDate}. Delay: ${apiCallDelay}ms`);
          await delay(apiCallDelay);
          const callsSnapshot = await this.client.options.snapshotOptionChain(ticker.toUpperCase(), {
            ...commonOptionsParams, contract_type: 'call',
          });
          console.log(`[PolygonAdapter.getFullStockData] CALLS for ${ticker} fetched. Results count: ${callsSnapshot.results?.length || 0}`);
          
          console.log(`[PolygonAdapter.getFullStockData] Fetching PUTS for ${ticker}, expiration ${expirationDate}. Delay: ${apiCallDelay}ms`);
          await delay(apiCallDelay);
          const putsSnapshot = await this.client.options.snapshotOptionChain(ticker.toUpperCase(), {
            ...commonOptionsParams, contract_type: 'put',
          });
          console.log(`[PolygonAdapter.getFullStockData] PUTS for ${ticker} fetched. Results count: ${putsSnapshot.results?.length || 0}`);

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
          console.log(`[PolygonAdapter.getFullStockData] Processing ${finalStrikesToProcess.length} strikes for options table for ${ticker}.`);

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
          console.log(`[PolygonAdapter.getFullStockData] Options chain for ${ticker} processed. Number of rows: ${optionsTableRows.length}.`);
        } else {
            const errMsg = 'Current stock price not available for options chain fetching.';
            console.warn(`[PolygonAdapter.getFullStockData] ${errMsg} for ${ticker}.`);
            stockDataPackage.optionsChain = { error: errMsg } as any;
        }
      } catch (error: any) {
        const errorMessage = `Failed to fetch options chain for ${ticker}. Polygon client error: ${error.message || String(error)}`;
        console.error(`[PolygonAdapter.getFullStockData] Error fetching options chain for ${ticker}:`, error);
        stockDataPackage.optionsChain = { error: errorMessage, rawErrorDetails: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request'))) } as any;
      }

      console.log(`[PolygonAdapter.getFullStockData] All data fetching for ${ticker} complete.`);
      return {
        stockData: stockDataPackage,
        rawRequestParams: { ticker },
        rawResponseSummary: {
          ticker: stockDataPackage.ticker,
          marketStatusLoaded: !!stockDataPackage.marketStatus && !stockDataPackage.marketStatus.error,
          snapshotLoaded: !!stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error,
          tasLoaded: !!stockDataPackage.technicalIndicators && !stockDataPackage.technicalIndicators.error,
          optionsLoaded: !!stockDataPackage.optionsChain && !stockDataPackage.optionsChain.error,
          error: stockDataPackage.error
        },
      };

    } catch (error: any) {
      const overallErrorMessage = `Overall failure in fetching data for ${ticker}. Some data might be missing or incomplete. Original error: ${error.message || String(error)}`;
      console.error(`[PolygonAdapter.getFullStockData] An unexpected error occurred in getFullStockData for ${ticker}:`, error);
      return {
        stockData: {
          ...stockDataPackage,
          error: overallErrorMessage,
          rawOverallError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error).filter(prop => prop !== 'config' && prop !== 'request')))
        } as StockDataPackage,
        rawRequestParams: { ticker },
        rawResponseSummary: { error: overallErrorMessage, ticker },
      };
    }
  }
}

export async function getFullStockData(ticker: string): Promise<AdapterOutput> {
  const apiKeyFromEnv = process.env.POLYGON_API_KEY;
  const adapter = new PolygonAdapter(apiKeyFromEnv);
  return adapter.getFullStockData(ticker);
}

