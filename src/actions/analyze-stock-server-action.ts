
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

const initialStockDataFetchResult: AnalyzeStockServerActionState = {
  status: 'idle',
  data: undefined,
  error: null,
  message: null,
};

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
  const actionLogPrefix = `[ServerAction:fetchStockDataAction:Ticker:${requestedTickerUpperCase}]`;
  console.log(`${actionLogPrefix} Received request. Payload keys: ${Object.keys(payload).join(', ')}. PrevState status: ${prevState.status}`);

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
    
    console.log(`${actionLogPrefix} getFullStockData returned. Raw request params keys: ${adapterOutput.rawRequestParams ? Object.keys(adapterOutput.rawRequestParams).join(', ') : 'N/A'}. Raw response summary keys: ${adapterOutput.rawResponseSummary ? Object.keys(adapterOutput.rawResponseSummary).join(', ') : 'N/A'}`);
    
    const adapterStockDataTicker = adapterOutput.stockData.ticker;
    const adapterSnapshotTicker = adapterOutput.stockData.stockSnapshot?.ticker;
    
    console.log(`${actionLogPrefix} Ticker consistency check: Requested: ${requestedTickerUpperCase}, AdapterStockDataPkgTicker: ${adapterStockDataTicker}, AdapterSnapshotTicker: ${adapterSnapshotTicker}`);
    
    if (adapterSnapshotTicker && adapterSnapshotTicker !== requestedTickerUpperCase) {
        const staleDataErrorMsg = `CRITICAL STALE DATA (Snapshot): Adapter returned snapshot data for ${adapterSnapshotTicker} when ${requestedTickerUpperCase} was requested.`;
        console.error(`${actionLogPrefix} ${staleDataErrorMsg}. Adapter output snapshot (first 200 chars): ${JSON.stringify(adapterOutput.stockData.stockSnapshot).substring(0,200)}`);
        const errorJson = JSON.stringify({ error: staleDataErrorMsg, details: `Expected ${requestedTickerUpperCase}, adapter provided snapshot for ${adapterSnapshotTicker}.` }, null, 2);
        
        return {
            status: 'error',
            error: staleDataErrorMsg,
            message: `Stale data detected from data source. Expected ${requestedTickerUpperCase}, received snapshot for ${adapterSnapshotTicker}.`,
            data: { 
                marketStatusJson: errorJson, stockSnapshotJson: errorJson,
                standardTasJson: errorJson, optionsChainJson: errorJson,
                polygonApiRequestLogJson: JSON.stringify(adapterOutput.rawRequestParams || { error: "Request params missing during stale data error" }, null, 2),
                polygonApiResponseLogJson: JSON.stringify(adapterOutput.rawResponseSummary || { error: "Response summary missing during stale data error" }, null, 2),
            }
        };
    }

    if (adapterOutput.stockData.error) {
      console.error(`${actionLogPrefix} Adapter Error: ${adapterOutput.stockData.error}. RawOverallError (first 200 chars): ${JSON.stringify(adapterOutput.stockData.rawOverallError).substring(0,200)}`);
      const adapterErrorJson = JSON.stringify({ error: adapterOutput.stockData.error, rawErrorDetails: adapterOutput.stockData.rawOverallError || adapterOutput.stockData.rawErrorDetails }, null, 2);
      return {
        status: 'error',
        error: `Adapter Error: ${adapterOutput.stockData.error}`,
        message: `Failed to fetch data. Adapter reported an error.`,
        data: {
            marketStatusJson: adapterErrorJson, stockSnapshotJson: adapterErrorJson,
            standardTasJson: adapterErrorJson, optionsChainJson: adapterErrorJson,
            polygonApiRequestLogJson: JSON.stringify(adapterOutput.rawRequestParams || { error: "Request params missing" }, null, 2),
            polygonApiResponseLogJson: JSON.stringify(adapterOutput.rawResponseSummary || { error: "Response summary missing" }, null, 2),
        },
      };
    }

    const stringify = (obj: any, name: string): string => {
      if (obj === undefined || obj === null) {
        console.warn(`${actionLogPrefix} Data for '${name}' is null or undefined before stringifying.`);
        return '{}';
      }
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e: any) {
        console.error(`${actionLogPrefix} Error stringifying '${name}': ${e.message}. Object (first 100 chars): ${String(obj).substring(0,100)}`);
        return JSON.stringify({ error: `Failed to stringify ${name}`, details: e.message }, null, 2);
      }
    };

    const marketStatusJson = stringify(adapterOutput.stockData.marketStatus, "marketStatus");
    const stockSnapshotJson = stringify(adapterOutput.stockData.stockSnapshot, "stockSnapshot");
    const standardTasJson = stringify(adapterOutput.stockData.technicalIndicators, "technicalIndicators");
    const optionsChainJson = stringify(adapterOutput.stockData.optionsChain, "optionsChain");
    const polygonApiRequestLogJson = stringify(adapterOutput.rawRequestParams, "rawRequestParams");
    const polygonApiResponseLogJson = stringify(adapterOutput.rawResponseSummary, "rawResponseSummary");

    console.log(`${actionLogPrefix} Successfully processed data. Final snapshot ticker: ${adapterOutput.stockData.stockSnapshot?.ticker}`);
    return {
      status: 'success',
      data: {
        marketStatusJson, stockSnapshotJson, standardTasJson, optionsChainJson,
        polygonApiRequestLogJson, polygonApiResponseLogJson,
      },
      message: `Data for ${requestedTickerUpperCase} fetched successfully.`,
      error: null,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} CRITICAL Unhandled Error in fetchStockDataAction. Error: ${error.message}, Stack: ${error.stack}`);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during data fetching.',
      message: `Failed to fetch data. Check server logs.`,
      data: undefined,
    };
  }
}

