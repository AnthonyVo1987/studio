
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

interface AnalyzeTaActionInputs {
  stockSnapshotJson: string;
  ticker?: string; // For logging
}

export async function analyzeTaAction(
  payload: AnalyzeTaActionInputs
): Promise<AnalyzeTaActionState> {
  const { stockSnapshotJson, ticker } = payload;
  const actionLogPrefix = `[ServerAction:analyzeTaAction:Ticker:${ticker || 'Unknown'}]`;

  console.log(`${actionLogPrefix} Starting technical analysis...`, {
    hasStockSnapshot: !!stockSnapshotJson,
    dataSize: stockSnapshotJson?.length || 0
  });

  if (!stockSnapshotJson || stockSnapshotJson === '{}') {
    const errorMsg = 'Stock snapshot data is missing or empty. Cannot analyze AI TA.';
    console.error(`${actionLogPrefix} Validation error:`, errorMsg);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Prerequisite data not available.',
      data: undefined,
    };
  }

  let snapshotData: StockSnapshotData;
  try {
    console.log(`${actionLogPrefix} Parsing stock snapshot data...`);
    snapshotData = JSON.parse(stockSnapshotJson) as StockSnapshotData;
    console.log(`${actionLogPrefix} Stock snapshot parsed successfully`);
  } catch(e: any) {
    const errorMsg = `Failed to parse stockSnapshotJson: ${e.message}`;
    console.error(`${actionLogPrefix} JSON parsing error:`, errorMsg);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Corrupted snapshot data.',
      data: undefined,
    };
  }

  try {
    console.log(`${actionLogPrefix} Validating previous day data...`);
    if (!snapshotData.prevDay ||
        snapshotData.prevDay.h == null || 
        snapshotData.prevDay.l == null ||
        snapshotData.prevDay.c == null) {
      const errorMsg = 'Previous day HLC data is missing from the stock snapshot.';
      console.error(`${actionLogPrefix} Data validation error:`, errorMsg);
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

    console.log(`${actionLogPrefix} Prepared flow input:`, flowInput);
    const aiAnalyzedTaRequestJson = JSON.stringify(flowInput, null, 2);
    
    console.log(`${actionLogPrefix} Calling AI flow for technical analysis...`);
    const flowOutput: AnalyzeTaOutput = await analyzeTaIndicators(flowInput);
    console.log(`${actionLogPrefix} AI flow completed successfully`);
    
    const aiAnalyzedTaJson = JSON.stringify(flowOutput, null, 2);

    console.log(`${actionLogPrefix} SUCCESS - Technical analysis completed`);
    return {
      status: 'success',
      data: {
        aiAnalyzedTaRequestJson,
        aiAnalyzedTaJson,
      },
      message: `AI TA indicators for ${ticker || snapshotData.ticker || 'stock'} analyzed successfully.`,
      error: null,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} CATCH ERROR:`, error.message || error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI TA analysis.',
      message: 'Failed to analyze AI TA indicators.',
      data: undefined,
    };
  }
}
