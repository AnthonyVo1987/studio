
'use server';

import {
  calculateAiTaIndicators,
  type CalculateAiTaInput,
  type CalculateAiTaOutput,
} from '@/ai/flows/calculate-ai-ta-flow';
import type { StockSnapshotData } from '@/services/data-sources/types';

export interface CalculateAiTaResult {
  aiCalculatedTaRequestJson: string;
  aiCalculatedTaJson: string;
}

export interface CalculateAiTaActionState {
  status: 'idle' | 'success' | 'error';
  data?: CalculateAiTaResult;
  error?: string | null;
  message?: string | null;
}

interface CalculateAiTaActionInputs {
  stockSnapshotJson: string;
  ticker?: string; // For logging
}

export async function calculateAiTaAction(
  prevState: CalculateAiTaActionState,
  payload: CalculateAiTaActionInputs
): Promise<CalculateAiTaActionState> {
  const { stockSnapshotJson, ticker } = payload;
  const actionLogPrefix = `[ServerAction:calculateAiTaAction:Ticker:${ticker || 'Unknown'}]`;
  console.log(`${actionLogPrefix} Received request.`);

  if (!stockSnapshotJson || stockSnapshotJson === '{}') {
    const errorMsg = 'Stock snapshot data is missing or empty. Cannot calculate AI TA.';
    console.warn(`${actionLogPrefix} Validation Error: ${errorMsg}`);
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
    console.log(`${actionLogPrefix} Parsed stockSnapshotJson for ${ticker || snapshotData.ticker}`);
  } catch(e: any) {
    const errorMsg = `Failed to parse stockSnapshotJson: ${e.message}`;
    console.error(`${actionLogPrefix} Error parsing snapshot for ${ticker || 'Unknown'}: ${errorMsg}`);
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
      console.warn(`${actionLogPrefix} Data Error for ${ticker || snapshotData.ticker}: ${errorMsg}`);
      return {
        status: 'error',
        error: errorMsg,
        message: 'Incomplete data for AI TA calculation.',
        data: undefined,
      };
    }
    
    const flowInput: CalculateAiTaInput = {
      previousDayHigh: snapshotData.prevDay.h,
      previousDayLow: snapshotData.prevDay.l,
      previousDayClose: snapshotData.prevDay.c,
    };

    const aiCalculatedTaRequestJson = JSON.stringify(flowInput, null, 2);
    
    const flowOutput: CalculateAiTaOutput = await calculateAiTaIndicators(flowInput);
    
    const aiCalculatedTaJson = JSON.stringify(flowOutput, null, 2);

    return {
      status: 'success',
      data: {
        aiCalculatedTaRequestJson,
        aiCalculatedTaJson,
      },
      message: `AI TA indicators for ${ticker || snapshotData.ticker || 'stock'} calculated successfully.`,
      error: null,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} CRITICAL Error for ${ticker || snapshotData?.ticker || 'Unknown'}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI TA calculation.',
      message: 'Failed to calculate AI TA indicators.',
      data: undefined,
    };
  }
}
