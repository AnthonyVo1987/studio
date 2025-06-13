
'use server';

import {
  analyzeTaIndicators, // Renamed import
  type AnalyzeTaInput,    // Renamed import
  type AnalyzeTaOutput,   // Renamed import
} from '@/ai/flows/analyze-ta-flow'; // Updated import path
import type { StockSnapshotData } from '@/services/data-sources/types';

export interface AnalyzeTaResult { // Renamed interface
  aiAnalyzedTaRequestJson: string; // Renamed field
  aiAnalyzedTaJson: string;        // Renamed field
}

export interface AnalyzeTaActionState { // Renamed interface
  status: 'idle' | 'success' | 'error';
  data?: AnalyzeTaResult; // Updated type
  error?: string | null;
  message?: string | null;
}

interface AnalyzeTaActionInputs { // Renamed interface
  stockSnapshotJson: string;
  ticker?: string; // For logging
}

export async function analyzeTaAction( // Renamed function
  prevState: AnalyzeTaActionState,
  payload: AnalyzeTaActionInputs
): Promise<AnalyzeTaActionState> {
  const { stockSnapshotJson, ticker } = payload;
  console.log(`[ServerAction:analyzeTaAction] Request for ticker: ${ticker || 'Unknown'}`);

  if (!stockSnapshotJson || stockSnapshotJson === '{}') {
    const errorMsg = 'Stock snapshot data is missing or empty. Cannot perform AI TA analysis.';
    console.warn(`[ServerAction:analyzeTaAction] Validation Error for ${ticker || 'Unknown'}: ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Prerequisite data not available.',
      data: undefined,
    };
  }

  let snapshotData: StockSnapshotData;
  try {
    snapshotData = JSON.parse(stockSnapshotJson) as StockSnapshotData;
    console.log(`[ServerAction:analyzeTaAction] Parsed stockSnapshotJson for ${ticker || snapshotData.ticker}`);
  } catch(e: any) {
    const errorMsg = `Failed to parse stockSnapshotJson: ${e.message}`;
    console.error(`[ServerAction:analyzeTaAction] Error parsing snapshot for ${ticker || 'Unknown'}: ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Corrupted snapshot data.',
      data: undefined,
    };
  }

  try {
    if (!snapshotData.prevDay ||
        snapshotData.prevDay.h == null || 
        snapshotData.prevDay.l == null ||
        snapshotData.prevDay.c == null) {
      const errorMsg = 'Previous day HLC data is missing from the stock snapshot.';
      console.warn(`[ServerAction:analyzeTaAction] Data Error for ${ticker || snapshotData.ticker}: ${errorMsg}`);
      return {
        status: 'error',
        error: errorMsg,
        message: 'Incomplete data for AI TA analysis.',
        data: undefined,
      };
    }
    
    const flowInput: AnalyzeTaInput = {
      previousDayHigh: snapshotData.prevDay.h,
      previousDayLow: snapshotData.prevDay.l,
      previousDayClose: snapshotData.prevDay.c,
    };

    const aiAnalyzedTaRequestJson = JSON.stringify(flowInput, null, 2); // Renamed variable
    console.log(`[ServerAction:analyzeTaAction] Calling analyzeTaIndicators flow for ${ticker || snapshotData.ticker} with input: ${aiAnalyzedTaRequestJson}`);

    const flowOutput: AnalyzeTaOutput = await analyzeTaIndicators(flowInput); // Call renamed function
    const aiAnalyzedTaJson = JSON.stringify(flowOutput, null, 2); // Renamed variable
    console.log(`[ServerAction:analyzeTaAction] analyzeTaIndicators flow succeeded for ${ticker || snapshotData.ticker}. Output: ${aiAnalyzedTaJson}`);

    return {
      status: 'success',
      data: {
        aiAnalyzedTaRequestJson, // Renamed field
        aiAnalyzedTaJson,        // Renamed field
      },
      message: `AI Analyzed TA for ${ticker || snapshotData.ticker || 'stock'} completed successfully.`, // Updated message
      error: null,
    };
  } catch (error: any) {
    console.error(`[ServerAction:analyzeTaAction] CRITICAL Error for ${ticker || snapshotData?.ticker || 'Unknown'}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI TA analysis.', // Updated message
      message: 'Failed to complete AI TA analysis.', // Updated message
      data: undefined,
    };
  }
}
