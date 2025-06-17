
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
  const actionLogPrefix = `[ServerAction:analyzeTaAction:Ticker:${ticker || 'Unknown'}]`;
  console.log(`${actionLogPrefix} Received request. Payload keys: ${Object.keys(payload).join(', ')}. PrevState status: ${prevState.status}`);

  if (!stockSnapshotJson || stockSnapshotJson === '{}') {
    const errorMsg = 'Stock snapshot data is missing or empty. Cannot perform AI TA analysis.';
    console.warn(`${actionLogPrefix} Validation Error: ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Prerequisite data not available for AI TA.',
      data: {
        aiAnalyzedTaRequestJson: JSON.stringify({ error: errorMsg, ticker }, null, 2),
        aiAnalyzedTaJson: JSON.stringify({ error: errorMsg }, null, 2),
      },
    };
  }

  let snapshotData: StockSnapshotData;
  try {
    snapshotData = JSON.parse(stockSnapshotJson) as StockSnapshotData;
    console.log(`${actionLogPrefix} Parsed stockSnapshotJson. Snapshot ticker: ${snapshotData.ticker}`);
  } catch(e: any) {
    const errorMsg = `Failed to parse stockSnapshotJson: ${e.message}`;
    console.error(`${actionLogPrefix} Error parsing snapshot: ${errorMsg}. Snapshot JSON (first 100): ${stockSnapshotJson.substring(0,100)}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Corrupted snapshot data for AI TA.',
      data: {
        aiAnalyzedTaRequestJson: JSON.stringify({ error: errorMsg, ticker, stockSnapshotJsonSnippet: stockSnapshotJson.substring(0,100) }, null, 2),
        aiAnalyzedTaJson: JSON.stringify({ error: errorMsg }, null, 2),
      },
    };
  }

  try {
    if (!snapshotData.prevDay ||
        snapshotData.prevDay.h == null || 
        snapshotData.prevDay.l == null ||
        snapshotData.prevDay.c == null) {
      const errorMsg = 'Previous day HLC data is missing from the stock snapshot.';
      console.warn(`${actionLogPrefix} Data Error: ${errorMsg}. PrevDay data: ${JSON.stringify(snapshotData.prevDay)}`);
      return {
        status: 'error',
        error: errorMsg,
        message: 'Incomplete data for AI TA analysis.',
        data: {
            aiAnalyzedTaRequestJson: JSON.stringify({ error: errorMsg, ticker, snapshotPrevDay: snapshotData.prevDay }, null, 2),
            aiAnalyzedTaJson: JSON.stringify({ error: errorMsg }, null, 2),
        },
      };
    }
    
    const flowInput: AnalyzeTaInput = {
      previousDayHigh: snapshotData.prevDay.h,
      previousDayLow: snapshotData.prevDay.l,
      previousDayClose: snapshotData.prevDay.c,
    };

    const aiAnalyzedTaRequestJson = JSON.stringify(flowInput, null, 2); 
    console.log(`${actionLogPrefix} Calling analyzeTaIndicators flow. Input keys: ${Object.keys(flowInput).join(', ')}`);

    const flowOutput: AnalyzeTaOutput = await analyzeTaIndicators(flowInput); 
    const aiAnalyzedTaJson = JSON.stringify(flowOutput, null, 2); 
    console.log(`${actionLogPrefix} analyzeTaIndicators flow succeeded. Output keys: ${Object.keys(flowOutput).join(', ')}`);

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
    console.error(`${actionLogPrefix} CRITICAL Error during AI TA analysis. Error: ${error.message}, Stack: ${error.stack}`);
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
        aiAnalyzedTaJson: JSON.stringify({ error: error.message || 'Flow execution failed', details: String(error) }, null, 2),
      },
    };
  }
}

