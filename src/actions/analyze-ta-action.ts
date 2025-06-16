
'use server';

import {
  analyzeTaIndicators, 
  type AnalyzeTaInput,    
  type AnalyzeTaOutput,   
} from '@/ai/flows/analyze-ta-flow'; 
import type { StockSnapshotData } from '@/services/data-sources/types';

export interface AnalyzeTaResult { 
  aiAnalyzedTaRequestJson: string; 
  aiAnalyzedTaJson: string;        
}

export interface AnalyzeTaActionState { 
  status: 'idle' | 'success' | 'error';
  data?: AnalyzeTaResult; 
  error?: string | null;
  message?: string | null;
}

// Definition remains, but NOT exported
const initialAnalyzeTaState: AnalyzeTaActionState = {
  status: 'idle',
  data: undefined,
  error: null,
  message: null,
};

interface AnalyzeTaActionInputs { 
  stockSnapshotJson: string;
  ticker?: string; 
}

export async function analyzeTaAction( 
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

    const aiAnalyzedTaRequestJson = JSON.stringify(flowInput, null, 2); 
    console.log(`[ServerAction:analyzeTaAction] Calling analyzeTaIndicators flow for ${ticker || snapshotData.ticker} with input (keys): ${Object.keys(flowInput).join(', ')}`);

    const flowOutput: AnalyzeTaOutput = await analyzeTaIndicators(flowInput); 
    const aiAnalyzedTaJson = JSON.stringify(flowOutput, null, 2); 
    console.log(`[ServerAction:analyzeTaAction] analyzeTaIndicators flow succeeded for ${ticker || snapshotData.ticker}. Output (keys): ${Object.keys(flowOutput).join(', ')}`);

    return {
      status: 'success',
      data: {
        aiAnalyzedTaRequestJson, 
        aiAnalyzedTaJson,        
      },
      message: `AI Analyzed TA for ${ticker || snapshotData.ticker || 'stock'} completed successfully.`, 
      error: null,
    };
  } catch (error: any) {
    console.error(`[ServerAction:analyzeTaAction] CRITICAL Error for ${ticker || snapshotData?.ticker || 'Unknown'}:`, error);
    const requestJsonOnError = JSON.stringify({ 
      error: 'Flow input could not be prepared or flow failed', 
      snapshotPrevDay: snapshotData?.prevDay 
    }, null, 2);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI TA analysis.', 
      message: 'Failed to complete AI TA analysis.', 
      data: {
        aiAnalyzedTaRequestJson: requestJsonOnError,
        aiAnalyzedTaJson: JSON.stringify({ error: error.message || 'Flow execution failed' }, null, 2),
      },
    };
  }
}
