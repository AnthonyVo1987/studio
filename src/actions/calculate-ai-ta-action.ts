
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
  console.log(`[ServerAction:calculateAiTaAction] Request for ticker: ${ticker || 'Unknown'}`);

  if (!stockSnapshotJson || stockSnapshotJson === '{}') {
    const errorMsg = 'Stock snapshot data is missing or empty. Cannot calculate AI TA.';
    console.warn(`[ServerAction:calculateAiTaAction] Validation Error for ${ticker || 'Unknown'}: ${errorMsg}`);
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
    console.log(`[ServerAction:calculateAiTaAction] Parsed stockSnapshotJson for ${ticker || snapshotData.ticker}`);
  } catch(e: any) {
    const errorMsg = `Failed to parse stockSnapshotJson: ${e.message}`;
    console.error(`[ServerAction:calculateAiTaAction] Error parsing snapshot for ${ticker || 'Unknown'}: ${errorMsg}`);
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
      console.warn(`[ServerAction:calculateAiTaAction] Data Error for ${ticker || snapshotData.ticker}: ${errorMsg}`);
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
    console.log(`[ServerAction:calculateAiTaAction] Calling calculateAiTaIndicators flow for ${ticker || snapshotData.ticker} with input: ${aiCalculatedTaRequestJson}`);

    const flowOutput: CalculateAiTaOutput = await calculateAiTaIndicators(flowInput);
    const aiCalculatedTaJson = JSON.stringify(flowOutput, null, 2);
    console.log(`[ServerAction:calculateAiTaAction] calculateAiTaIndicators flow succeeded for ${ticker || snapshotData.ticker}. Output: ${aiCalculatedTaJson}`);

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
    console.error(`[ServerAction:calculateAiTaAction] CRITICAL Error for ${ticker || snapshotData?.ticker || 'Unknown'}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI TA calculation.',
      message: 'Failed to calculate AI TA indicators.',
      data: undefined,
    };
  }
}
