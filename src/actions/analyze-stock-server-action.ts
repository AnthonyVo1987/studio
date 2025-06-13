
'use server';

import { getFullStockData } from '@/services/data-sources/adapters/polygon-adapter';
import type { AdapterOutput } from '@/services/data-sources/types';

export interface StockDataFetchResult {
  marketStatusJson: string;
  stockSnapshotJson: string;
  standardTasJson: string;
  optionsChainJson: string;
  polygonApiRequestLogJson: string; // Will now store input to getFullStockData
  polygonApiResponseLogJson: string; // Will now store summary of getFullStockData output
  // polygonAdapterDebugMessages?: string[]; // Removed as adapter no longer provides this
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
  console.log(`[ServerAction:fetchStockDataAction] Received request for ticker: ${ticker}`);

  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    const errorMsg = 'Ticker symbol is required and must be a non-empty string.';
    console.error(`[ServerAction:fetchStockDataAction] Validation Error: ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Invalid ticker symbol provided.',
      data: undefined,
    };
  }

  try {
    console.log(`[ServerAction:fetchStockDataAction] Calling getFullStockData for ${ticker.toUpperCase()}`);
    const adapterOutput: AdapterOutput = await getFullStockData(ticker.toUpperCase());
    console.log(`[ServerAction:fetchStockDataAction] getFullStockData returned for ${ticker.toUpperCase()}. Error in package: ${adapterOutput.stockData.error || 'none'}`);

    if (adapterOutput.stockData.error) {
      console.error(`[ServerAction:fetchStockDataAction] Adapter Error for ${ticker.toUpperCase()}: ${adapterOutput.stockData.error}`);
      return {
        status: 'error',
        error: `Adapter Error: ${adapterOutput.stockData.error}`,
        message: `Failed to fetch data for ${ticker}. Adapter reported an error. Check client debug console for Polygon Adapter logs.`,
        data: undefined,
      };
    }

    const stringify = (obj: any): string => {
      if (obj === undefined || obj === null) return '{}';
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        console.error("[ServerAction:fetchStockDataAction] Error stringifying object:", e);
        return JSON.stringify({ error: "Failed to stringify content", details: (e as Error).message }, null, 2);
      }
    };

    const marketStatusJson = stringify(adapterOutput.stockData.marketStatus);
    const stockSnapshotJson = stringify(adapterOutput.stockData.stockSnapshot);
    const standardTasJson = stringify(adapterOutput.stockData.technicalIndicators);
    const optionsChainJson = stringify(adapterOutput.stockData.optionsChain);
    
    const polygonApiRequestLogJson = stringify(adapterOutput.rawRequestParams); 
    const polygonApiResponseLogJson = stringify(adapterOutput.rawResponseSummary);

    console.log(`[ServerAction:fetchStockDataAction] Successfully fetched and processed data for ${ticker.toUpperCase()}.`);
    return {
      status: 'success',
      data: {
        marketStatusJson,
        stockSnapshotJson,
        standardTasJson,
        optionsChainJson,
        polygonApiRequestLogJson,
        polygonApiResponseLogJson,
        // polygonAdapterDebugMessages: adapterOutput.polygonAdapterDebugMessages || [], // Removed
      },
      message: `Data for ${ticker.toUpperCase()} fetched successfully.`,
      error: null,
    };
  } catch (error: any) {
    console.error(`[ServerAction:fetchStockDataAction] CRITICAL Error for ${ticker.toUpperCase()}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during data fetching.',
      message: `Failed to fetch data for ${ticker.toUpperCase()}. Check server logs.`,
      data: undefined,
    };
  }
}
