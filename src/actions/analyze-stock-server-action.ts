
'use server';

import { getFullStockData } from '@/services/data-sources/adapters/polygon-adapter';
import type { AdapterOutput } from '@/services/data-sources/types';

// Structure for the data returned by the action on success
export interface StockDataFetchResult {
  marketStatusJson: string;
  stockSnapshotJson: string;
  standardTasJson: string;
  optionsChainJson: string;
  polygonApiRequestLogJson: string;
  polygonApiResponseLogJson: string;
}

// Defines the state that this server action will manage and return.
// This is designed for use with React's useActionState hook on the client.
export interface AnalyzeStockServerActionState {
  status: 'idle' | 'success' | 'error'; // 'pending' is handled by useActionState
  data?: StockDataFetchResult;
  error?: string | null;
  message?: string | null; // General feedback message
}

// Initial state for the action, to be used with useActionState
export const initialStockDataFetchState: AnalyzeStockServerActionState = {
  status: 'idle',
  data: undefined,
  error: null,
  message: null,
};

// Input parameters for the server action
interface FetchStockDataActionInputs {
  ticker: string;
  dataSource?: string; // Currently unused, adapter defaults to Polygon
  analysisType?: string; // Currently unused for basic data fetching
}

// Server Action: Fetches stock data
export async function fetchStockDataAction(
  prevState: AnalyzeStockServerActionState, // Previous state from useActionState
  payload: FetchStockDataActionInputs
): Promise<AnalyzeStockServerActionState> {
  const { ticker } = payload;

  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return {
      status: 'error',
      error: 'Ticker symbol is required and must be a non-empty string.',
      message: 'Invalid ticker symbol provided.',
      data: undefined,
    };
  }

  try {
    // Call the adapter to get stock data
    const adapterOutput: AdapterOutput = await getFullStockData(ticker.toUpperCase());

    // Check for errors reported by the adapter itself (e.g., API key missing)
    if (adapterOutput.stockData.error) {
      return {
        status: 'error',
        error: `Adapter Error: ${adapterOutput.stockData.error}`,
        message: `Failed to fetch data for ${ticker}. Adapter reported an error.`,
        data: undefined,
      };
    }

    // Helper to safely stringify objects, returning "{}" for undefined/null
    const stringify = (obj: any): string => {
      if (obj === undefined || obj === null) return '{}';
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        console.error("Error stringifying object for action state:", e);
        // Provide a structured error in the JSON string itself
        return JSON.stringify({ error: "Failed to stringify content", details: (e as Error).message }, null, 2);
      }
    };

    // Prepare JSON strings for the context/Debug Tab
    const marketStatusJson = stringify(adapterOutput.stockData.marketStatus);
    const stockSnapshotJson = stringify(adapterOutput.stockData.stockSnapshot);
    const standardTasJson = stringify(adapterOutput.stockData.technicalIndicators);
    const optionsChainJson = stringify(adapterOutput.stockData.optionsChain);
    
    // For Debug Tab: Polygon API Request/Response Logs
    // The current polygon-adapter.ts does not populate rawRequestParams or rawResponse.
    // So these will be "{}" unless the adapter is updated.
    const polygonApiRequestLogJson = stringify(adapterOutput.rawRequestParams);
    const polygonApiResponseLogJson = stringify(adapterOutput.rawResponse);

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
      message: `Data for ${ticker.toUpperCase()} fetched successfully.`,
      error: null,
    };
  } catch (error: any) {
    console.error(`Error in fetchStockDataAction for ${ticker.toUpperCase()}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during data fetching.',
      message: `Failed to fetch data for ${ticker.toUpperCase()}.`,
      data: undefined,
    };
  }
}
