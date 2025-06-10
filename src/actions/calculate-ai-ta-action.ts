
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

const initialCalculateAiTaState: CalculateAiTaActionState = {
  status: 'idle',
  data: undefined,
  error: null,
  message: null,
};

interface CalculateAiTaActionInputs {
  stockSnapshotJson: string;
}

export async function calculateAiTaAction(
  prevState: CalculateAiTaActionState,
  payload: CalculateAiTaActionInputs
): Promise<CalculateAiTaActionState> {
  const { stockSnapshotJson } = payload;

  if (!stockSnapshotJson || stockSnapshotJson === '{}') {
    return {
      status: 'error',
      error: 'Stock snapshot data is missing or empty. Cannot calculate AI TA.',
      message: 'Prerequisite data not available.',
      data: undefined,
    };
  }

  try {
    const snapshotData = JSON.parse(stockSnapshotJson) as StockSnapshotData;

    if (!snapshotData.prevDay ||
        snapshotData.prevDay.h == null || // check for null or undefined
        snapshotData.prevDay.l == null ||
        snapshotData.prevDay.c == null) {
      return {
        status: 'error',
        error: 'Previous day HLC data is missing from the stock snapshot.',
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
      message: `AI TA indicators for ${snapshotData.ticker || 'stock'} calculated successfully.`,
      error: null,
    };
  } catch (error: any) {
    console.error('Error in calculateAiTaAction:', error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI TA calculation.',
      message: 'Failed to calculate AI TA indicators.',
      data: undefined,
    };
  }
}
