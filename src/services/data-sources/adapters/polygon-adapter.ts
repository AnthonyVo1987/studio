
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
  private readonly currentTickerForClient: string;

  constructor(apiKey?: string, tickerForThisInstance?: string) {
    const keyToUse = apiKey || process.env.POLYGON_API_KEY;
    this.currentTickerForClient = (tickerForThisInstance || "UNKNOWN_TICKER_AT_CONSTRUCTOR").toUpperCase();
    const logPrefix = `[PolygonAdapter.constructor InstanceFor: ${this.currentTickerForClient}]`;

    if (!keyToUse || keyToUse.trim() === "" || keyToUse === "INVALID_KEY_ADAPTER_INIT_FAILURE_CONSTRUCTOR") {
      const errorMessage = `${logPrefix} Polygon API key is MISSING, EMPTY, or previously marked INVALID. Adapter cannot be properly initialized.`;
      console.error(errorMessage);
      this.client = restClient("INVALID_KEY_ADAPTER_INIT_FAILURE_CONSTRUCTOR");
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

  private createSafeErrorObject(error: any, contextMessage: string): any {
    return {
      name: String(error.name || 'UnknownError'),
      message: String(error.message || String(error) || contextMessage),
      stack: error.stack ? String(error.stack).substring(0, 1000) : undefined,
      code: error.code || undefined,
    };
  }

  async getFullStockData(ticker: string): Promise<AdapterOutput> {
    const requestedTickerMethodArg = ticker.toUpperCase();
    const logPrefix = `[PolygonAdapter.getFullStockData InstanceFor: ${this.currentTickerForClient}][MethodArg: ${requestedTickerMethodArg}]`;

    console.log(`${logPrefix} Method START. Verifying internal ticker consistency.`);

    if (this.currentTickerForClient !== requestedTickerMethodArg) {
        const criticalErrorMsg = `${logPrefix} CRITICAL MISMATCH: Adapter instance was constructed for ${this.currentTickerForClient} but method called with ${requestedTickerMethodArg}. Aborting fetch.`;
        console.error(criticalErrorMsg);
        return {
            stockData: { ticker: requestedTickerMethodArg, error: criticalErrorMsg, rawOverallError: this.createSafeErrorObject({ message: criticalErrorMsg }, "Adapter instance mismatch") },
            rawRequestParams: { requestedTicker: requestedTickerMethodArg, adapterInstanceFor: this.currentTickerForClient },
            rawResponseSummary: { error: criticalErrorMsg, requestedTicker: requestedTickerMethodArg, adapterInstanceFor: this.currentTickerForClient },
        };
    }

    const tickerToUse = this.currentTickerForClient;
    const stockDataPackage: StockDataPackage = { ticker: tickerToUse };
    let currentStockPrice: number | undefined;
    const apiCallDelay = 150;
    const cacheBustQuery = { query: { _t: Date.now() } }; // Cache bust value generated once per full fetch

    console.log(`${logPrefix} Starting data fetch operations for ${tickerToUse}. Cache bust value for this run: ${cacheBustQuery.query._t}`);

    try {
      try {
        console.log(`${logPrefix} Fetching market status. Delay: ${apiCallDelay}ms.`);
        await delay(apiCallDelay);
        const marketStatusResponse = await this.client.reference.marketStatus(undefined, cacheBustQuery);
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
        const errorMessage = `Failed to fetch market status for ${tickerToUse}. Polygon client error: ${error.message || String(error)}`;
        console.error(`${logPrefix} Error fetching market status:`, error);
        stockDataPackage.marketStatus = { error: errorMessage, rawErrorDetails: this.createSafeErrorObject(error, "Market status fetch failed") } as any;
      }

      try {
        console.log(`${logPrefix} Fetching snapshot for ${tickerToUse}. Delay: ${apiCallDelay}ms.`);
        await delay(apiCallDelay);
        const snapshotResponse = await this.client.stocks.snapshotTicker(tickerToUse, undefined, cacheBustQuery);

        if (snapshotResponse.ticker && snapshotResponse.ticker.ticker === tickerToUse) {
          console.log(`${logPrefix} Snapshot for ${tickerToUse} fetched successfully. Ticker in response: ${snapshotResponse.ticker.ticker}`);
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
            const errMsg = `Snapshot response for ${tickerToUse} did not contain matching ticker data or was malformed. Expected: ${tickerToUse}, Got in response: ${snapshotResponse.ticker?.ticker}`;
            console.error(`${logPrefix} ${errMsg}. Response:`, snapshotResponse);
            throw new Error(errMsg);
        }
      } catch (error: any) {
        const detailedErrorMessage = `Polygon client error: ${error.message || String(error)}`;
        const errorMessage = `Failed to fetch snapshot for ${tickerToUse}. ${detailedErrorMessage}`;
        console.error(`${logPrefix} Error fetching stock snapshot:`, error);
        stockDataPackage.stockSnapshot = { error: errorMessage, rawErrorDetails: this.createSafeErrorObject(error, "Snapshot fetch failed"), ticker: tickerToUse } as any;
      }

      const technicalIndicators: TechnicalIndicatorsData = {};
      let taErrorOccurred = false;
      let taErrorMessages: string[] = [];
      console.log(`${logPrefix} Fetching technical indicators for ${tickerToUse}.`);

      try {
        technicalIndicators.RSI = {};
        const rsiWindows = [7, 10, 14];
        for (const window of rsiWindows) {
          try {
            console.log(`${logPrefix} Fetching RSI(${window}) for ${tickerToUse}. Delay: ${apiCallDelay}ms.`);
            await delay(apiCallDelay);
            const rsiRes = await this.client.stocks.rsi(tickerToUse, { timespan: 'day', window, series_type: 'close', limit: 1 }, cacheBustQuery);
            if (rsiRes.results?.values?.[0]?.value) {
              (technicalIndicators.RSI as MultiWindowIndicatorValues)[String(window)] = roundNumber(rsiRes.results.values[0].value, 2);
            } else { console.warn(`${logPrefix} No RSI(${window}) data for ${tickerToUse}.`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`RSI(${window}): ${e.message}`); console.error(`${logPrefix} Error fetching RSI(${window}) for ${tickerToUse}:`, e.message); }
        }

        try {
            console.log(`${logPrefix} Fetching MACD for ${tickerToUse}. Delay: ${apiCallDelay}ms.`);
            await delay(apiCallDelay);
            const macdRes = await this.client.stocks.macd(tickerToUse, { timespan: 'day', series_type: 'close', limit: 1 }, cacheBustQuery);
            if (macdRes.results?.values?.[0]) {
              const macdValue = macdRes.results.values[0];
              technicalIndicators.MACD = {
                value: roundNumber(macdValue.value, 4), signal: roundNumber(macdValue.signal, 4), histogram: roundNumber(macdValue.histogram, 4)
              };
            } else { console.warn(`${logPrefix} No MACD data for ${tickerToUse}.`); }
        } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`MACD: ${e.message}`); console.error(`${logPrefix} Error fetching MACD for ${tickerToUse}:`, e.message); }

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
            console.log(`${logPrefix} Fetching EMA(${window}) for ${tickerToUse}. Delay: ${apiCallDelay}ms.`);
            await delay(apiCallDelay);
            const emaRes = await this.client.stocks.ema(tickerToUse, { timespan: 'day', window, series_type: 'close', limit: 1 }, cacheBustQuery);
            if (emaRes.results?.values?.[0]?.value) {
              (technicalIndicators.EMA as MultiWindowIndicatorValues)[String(window)] = roundNumber(emaRes.results.values[0].value, 2);
            } else { console.warn(`${logPrefix} No EMA(${window}) data for ${tickerToUse}.`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`EMA(${window}): ${e.message}`); console.error(`${logPrefix} Error fetching EMA(${window}) for ${tickerToUse}:`, e.message); }
        }

        technicalIndicators.SMA = {};
        const smaWindows = [5, 10, 20, 50, 200];
        for (const window of smaWindows) {
          try {
            console.log(`${logPrefix} Fetching SMA(${window}) for ${tickerToUse}. Delay: ${apiCallDelay}ms.`);
            await delay(apiCallDelay);
            const smaRes = await this.client.stocks.sma(tickerToUse, { timespan: 'day', window, series_type: 'close', limit: 1 }, cacheBustQuery);
            if (smaRes.results?.values?.[0]?.value) {
              (technicalIndicators.SMA as MultiWindowIndicatorValues)[String(window)] = roundNumber(smaRes.results.values[0].value, 2);
            } else { console.warn(`${logPrefix} No SMA(${window}) data for ${tickerToUse}.`); }
          } catch (e: any) { taErrorOccurred = true; taErrorMessages.push(`SMA(${window}): ${e.message}`); console.error(`${logPrefix} Error fetching SMA(${window}) for ${tickerToUse}:`, e.message); }
        }

        if (taErrorOccurred) {
            const combinedErrorMsg = `One or more TAs failed for ${tickerToUse}: ${taErrorMessages.join('; ')}`;
            console.error(`${logPrefix} TA Errors: ${combinedErrorMsg}`);
            technicalIndicators.error = combinedErrorMsg;
        }
        stockDataPackage.technicalIndicators = technicalIndicators;

      } catch (error: any) {
          const errorMessage = `General error fetching TAs for ${tickerToUse}: ${error.message || String(error)}`;
          console.error(`${logPrefix} General TA Error:`, error);
          technicalIndicators.error = errorMessage;
          technicalIndicators.rawErrorDetails = this.createSafeErrorObject(error, "General TA fetch failed");
          stockDataPackage.technicalIndicators = technicalIndicators;
      }

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

          console.log(`${logPrefix} Fetching CALLS for ${tickerToUse}, expiration ${expirationDate}. Current price: ${currentStockPrice}. Delay: ${apiCallDelay}ms.`);
          await delay(apiCallDelay);
          const callsSnapshot = await this.client.options.snapshotOptionChain(tickerToUse, {
            ...commonOptionsParams, contract_type: 'call',
          }, cacheBustQuery);

          console.log(`${logPrefix} Fetching PUTS for ${tickerToUse}, expiration ${expirationDate}. Delay: ${apiCallDelay}ms.`);
          await delay(apiCallDelay);
          const putsSnapshot = await this.client.options.snapshotOptionChain(tickerToUse, {
            ...commonOptionsParams, contract_type: 'put',
          }, cacheBustQuery);

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
            ticker: tickerToUse, expiration_date: expirationDate, contracts: optionsTableRows, underlying_price: roundNumber(currentStockPrice, 2),
          };
        } else {
            const errMsg = `Current stock price not available for options chain fetching for ${tickerToUse}. Snapshot data: ${JSON.stringify(stockDataPackage.stockSnapshot).substring(0,200)}`;
            console.warn(`${logPrefix} ${errMsg}`);
            stockDataPackage.optionsChain = { error: errMsg, ticker: tickerToUse } as any;
        }
      } catch (error: any) {
        const errorMessage = `Failed to fetch options chain for ${tickerToUse}. Polygon client error: ${error.message || String(error)}`;
        console.error(`${logPrefix} Error fetching options chain:`, error);
        stockDataPackage.optionsChain = { error: errorMessage, rawErrorDetails: this.createSafeErrorObject(error, "Options chain fetch failed"), ticker: tickerToUse } as any;
      }

      console.log(`${logPrefix} All data fetching operations for ${tickerToUse} complete.`);
      return {
        stockData: stockDataPackage,
        rawRequestParams: { requestedTicker: requestedTickerMethodArg, adapterInstanceFor: this.currentTickerForClient, cacheBustValueForRun: cacheBustQuery.query._t },
        rawResponseSummary: {
          requestedTicker: requestedTickerMethodArg,
          adapterInstanceFor: this.currentTickerForClient,
          responseTicker: stockDataPackage.ticker,
          marketStatusLoaded: !!stockDataPackage.marketStatus && !stockDataPackage.marketStatus.error,
          snapshotLoaded: !!stockDataPackage.stockSnapshot && !stockDataPackage.stockSnapshot.error && stockDataPackage.stockSnapshot.ticker === tickerToUse,
          tasLoaded: !!stockDataPackage.technicalIndicators && !stockDataPackage.technicalIndicators.error,
          optionsLoaded: !!stockDataPackage.optionsChain && !stockDataPackage.optionsChain.error && stockDataPackage.optionsChain.ticker === tickerToUse,
          error: stockDataPackage.error
        },
      };

    } catch (error: any) {
      const overallErrorMessage = `Overall failure in fetching data for ${tickerToUse}. Some data might be missing or incomplete. Original error: ${error.message || String(error)}`;
      console.error(`${logPrefix} An unexpected error occurred:`, error);
      return {
        stockData: {
          ...stockDataPackage,
          ticker: tickerToUse,
          error: overallErrorMessage,
          rawOverallError: this.createSafeErrorObject(error, "Overall data fetch failed")
        } as StockDataPackage,
        rawRequestParams: { requestedTicker: requestedTickerMethodArg, adapterInstanceFor: this.currentTickerForClient, cacheBustValueForRun: cacheBustQuery.query._t },
        rawResponseSummary: { error: overallErrorMessage, requestedTicker: requestedTickerMethodArg, adapterInstanceFor: this.currentTickerForClient, responseTicker: tickerToUse },
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
