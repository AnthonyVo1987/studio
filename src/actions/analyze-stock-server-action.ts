
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
    
    // Enhanced logging for adapter output
    const adapterStockDataTicker = adapterOutput.stockData.ticker;
    const adapterSnapshotTicker = adapterOutput.stockData.stockSnapshot?.ticker;
    const adapterRawResponseSummaryTicker = adapterOutput.rawResponseSummary?.responseTicker;
    const adapterRawRequestSummaryTicker = adapterOutput.rawResponseSummary?.requestedTicker; // This should match requestedTickerUpperCase if adapter got it right

    console.log(`${actionLogPrefix} getFullStockData returned. Requested: ${requestedTickerUpperCase}, AdapterStockDataPkgTicker: ${adapterStockDataTicker}, AdapterSnapshotTicker: ${adapterSnapshotTicker}, AdapterRawRespSummaryTicker: ${adapterRawResponseSummaryTicker}, AdapterRawReqSummaryTicker(from adapter): ${adapterRawRequestSummaryTicker}`);
    
    // Critical Check: Ensure the data returned by the adapter, specifically from stockSnapshot, is for the requested ticker.
    // This is the most reliable source of truth for the ticker the data pertains to from Polygon.
    if (adapterSnapshotTicker && adapterSnapshotTicker !== requestedTickerUpperCase) {
        const staleDataErrorMsg = `CRITICAL STALE DATA (Snapshot): Adapter returned snapshot data for ${adapterSnapshotTicker} when ${requestedTickerUpperCase} was requested.`;
        console.error(`${actionLogPrefix} ${staleDataErrorMsg}`);
        const errorJson = JSON.stringify({ error: staleDataErrorMsg, details: `Expected ${requestedTickerUpperCase}, adapter provided snapshot for ${adapterSnapshotTicker}. Adapter output for snapshot: ${JSON.stringify(adapterOutput.stockData.stockSnapshot)}` }, null, 2);
        const requestLogJsonOnError = JSON.stringify(adapterOutput.rawRequestParams || { error: "Request params missing during stale data error" }, null, 2);
        const responseLogJsonOnError = JSON.stringify(adapterOutput.rawResponseSummary || { error: "Response summary missing during stale data error" }, null, 2);
        
        return {
            status: 'error',
            error: staleDataErrorMsg,
            message: `Stale data detected from data source. Expected ${requestedTickerUpperCase}, but received snapshot for ${adapterSnapshotTicker}.`,
            data: { 
                marketStatusJson: errorJson,
                stockSnapshotJson: errorJson,
                standardTasJson: errorJson,
                optionsChainJson: errorJson,
                polygonApiRequestLogJson: requestLogJsonOnError,
                polygonApiResponseLogJson: responseLogJsonOnError,
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

    // Final log to confirm the ticker in the successfully processed snapshotJson
    console.log(`${actionLogPrefix} Successfully processed data. Ticker in final stockSnapshotJson being returned to client: ${adapterOutput.stockData.stockSnapshot?.ticker} (Expected: ${requestedTickerUpperCase})`);
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
    console.error(`${actionLogPrefix} CRITICAL Unhandled Error in fetchStockDataAction for ${requestedTickerUpperCase}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during data fetching.',
      message: `Failed to fetch data for ${requestedTickerUpperCase}. Check server logs.`,
      data: undefined,
    };
  }
}

