
'use server';

import { getFullStockData } from '@/services/data-sources/adapters/polygon-adapter';
import type { AdapterOutput } from '@/services/data-sources/types';

export interface StockDataFetchResult {
  marketStatusJson: string;
  stockSnapshotJson: string;
  standardTasJson: string;
  optionsChainJson: string;
  polygonApiRequestLogJson: string; 
  polygonApiResponseLogJson: string; 
}

export interface AnalyzeStockServerActionState {
  status: 'idle' | 'success' | 'error';
  data?: StockDataFetchResult;
  error?: string | null;
  message?: string | null;
}

interface FetchStockDataActionInputs {
  ticker: string;
  dataSource?: string;
  analysisType?: string;
}

export async function fetchStockDataAction(
  prevState: AnalyzeStockServerActionState,
  payload: FetchStockDataActionInputs
): Promise<AnalyzeStockServerActionState> {
  const { ticker } = payload;
  const requestedTickerUpperCase = ticker.toUpperCase();
  const actionLogPrefix = `[ServerAction:fetchStockDataAction RequestedTicker: ${requestedTickerUpperCase}]`;
  console.log(`${actionLogPrefix} Received request payload. Current prevState status: ${prevState.status}`);

  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    const errorMsg = 'Ticker symbol is required and must be a non-empty string.';
    console.error(`${actionLogPrefix} Validation Error: ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Invalid ticker symbol provided.',
      data: undefined,
    };
  }

  try {
    console.log(`${actionLogPrefix} Calling getFullStockData for ${requestedTickerUpperCase}.`);
    const adapterOutput: AdapterOutput = await getFullStockData(requestedTickerUpperCase);
    const adapterTicker = adapterOutput.stockData.ticker; // This should be uppercased from adapter
    const rawResponseSummaryTicker = adapterOutput.rawResponseSummary?.responseTicker; // From adapter's summary

    console.log(`${actionLogPrefix} getFullStockData returned. Requested: ${requestedTickerUpperCase}, AdapterOutputStockDataTicker: ${adapterTicker}, AdapterRawResponseSummaryTicker: ${rawResponseSummaryTicker}. Adapter reported error in stockData: ${adapterOutput.stockData.error || 'none'}. Snapshot ticker from adapter's snapshot data: ${adapterOutput.stockData.stockSnapshot?.ticker}`);
    
    if (adapterTicker && adapterTicker !== requestedTickerUpperCase) {
        const staleDataErrorMsg = `CRITICAL STALE DATA FROM ADAPTER (stockData.ticker): Adapter returned data for ${adapterTicker} when ${requestedTickerUpperCase} was requested.`;
        console.error(`${actionLogPrefix} ${staleDataErrorMsg}`);
        // Fall through to the next check for snapshot ticker, but this is already a red flag.
    }
    if (rawResponseSummaryTicker && rawResponseSummaryTicker !== requestedTickerUpperCase) {
         const staleDataErrorMsg = `CRITICAL STALE DATA FROM ADAPTER (rawResponseSummary.responseTicker): Adapter summary indicates data for ${rawResponseSummaryTicker} when ${requestedTickerUpperCase} was requested.`;
        console.error(`${actionLogPrefix} ${staleDataErrorMsg}`);
    }


    // Critical Check: Ensure the data returned by the adapter is for the requested ticker, specifically from stockSnapshot
    if (adapterOutput.stockData.stockSnapshot?.ticker && adapterOutput.stockData.stockSnapshot.ticker !== requestedTickerUpperCase) {
        const staleDataErrorMsg = `CRITICAL STALE DATA (Snapshot): Adapter returned snapshot data for ${adapterOutput.stockData.stockSnapshot.ticker} when ${requestedTickerUpperCase} was requested.`;
        console.error(`${actionLogPrefix} ${staleDataErrorMsg}`);
        return {
            status: 'error',
            error: staleDataErrorMsg,
            message: `Stale data detected from data source. Expected ${requestedTickerUpperCase}, but received snapshot for ${adapterOutput.stockData.stockSnapshot.ticker}.`,
            data: { 
                marketStatusJson: JSON.stringify({ error: staleDataErrorMsg, details: adapterOutput.stockData.marketStatus }, null, 2),
                stockSnapshotJson: JSON.stringify({ error: staleDataErrorMsg, details: adapterOutput.stockData.stockSnapshot }, null, 2),
                standardTasJson: JSON.stringify({ error: staleDataErrorMsg, details: adapterOutput.stockData.technicalIndicators }, null, 2),
                optionsChainJson: JSON.stringify({ error: staleDataErrorMsg, details: adapterOutput.stockData.optionsChain }, null, 2),
                polygonApiRequestLogJson: JSON.stringify(adapterOutput.rawRequestParams || { error: "Request params missing" }, null, 2),
                polygonApiResponseLogJson: JSON.stringify(adapterOutput.rawResponseSummary || { error: "Response summary missing" }, null, 2),
            }
        };
    }


    if (adapterOutput.stockData.error) {
      console.error(`${actionLogPrefix} Adapter Error for ${requestedTickerUpperCase}: ${adapterOutput.stockData.error}`);
      const adapterErrorJson = JSON.stringify({ error: adapterOutput.stockData.error, rawErrorDetails: adapterOutput.stockData.rawOverallError || adapterOutput.stockData.rawErrorDetails }, null, 2);
      return {
        status: 'error',
        error: `Adapter Error: ${adapterOutput.stockData.error}`,
        message: `Failed to fetch data for ${requestedTickerUpperCase}. Adapter reported an error. Check client debug console for Polygon Adapter logs.`,
        data: {
            marketStatusJson: adapterErrorJson,
            stockSnapshotJson: adapterErrorJson,
            standardTasJson: adapterErrorJson,
            optionsChainJson: adapterErrorJson,
            polygonApiRequestLogJson: JSON.stringify(adapterOutput.rawRequestParams || { error: "Request params missing" }, null, 2),
            polygonApiResponseLogJson: JSON.stringify(adapterOutput.rawResponseSummary || { error: "Response summary missing" }, null, 2),
        },
      };
    }

    const stringify = (obj: any): string => {
      if (obj === undefined || obj === null) return '{}';
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        console.error(`${actionLogPrefix} Error stringifying object:`, e);
        return JSON.stringify({ error: "Failed to stringify content", details: (e as Error).message }, null, 2);
      }
    };

    const marketStatusJson = stringify(adapterOutput.stockData.marketStatus);
    const stockSnapshotJson = stringify(adapterOutput.stockData.stockSnapshot);
    const standardTasJson = stringify(adapterOutput.stockData.technicalIndicators);
    const optionsChainJson = stringify(adapterOutput.stockData.optionsChain);

    const polygonApiRequestLogJson = stringify(adapterOutput.rawRequestParams);
    const polygonApiResponseLogJson = stringify(adapterOutput.rawResponseSummary);

    console.log(`${actionLogPrefix} Successfully fetched and processed data for ${requestedTickerUpperCase}. Snapshot Ticker from output: ${adapterOutput.stockData.stockSnapshot?.ticker}`);
    return {
      status: 'success',
      data: {
        marketStatusJson,
        stockSnapshotJson,
        standardTasJson,
        optionsChainJson,
        polygonApiRequestLogJson,
        polygonApiResponseLogJson,
      },
      message: `Data for ${requestedTickerUpperCase} fetched successfully.`,
      error: null,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} CRITICAL Error for ${requestedTickerUpperCase}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during data fetching.',
      message: `Failed to fetch data for ${requestedTickerUpperCase}. Check server logs.`,
      data: undefined,
    };
  }
}
