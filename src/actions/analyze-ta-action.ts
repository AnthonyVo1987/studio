
'use server';

import { logger } from '@/lib/logger';
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
  logger.info(`${actionLogPrefix} Received request.`);

  if (!stockSnapshotJson || stockSnapshotJson === '{}') {
    const errorMsg = 'Stock snapshot data is missing or empty. Cannot analyze AI TA.';
    logger.warn(`${actionLogPrefix} Validation Error: ${errorMsg}`);
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
    logger.info(`${actionLogPrefix} Parsed stockSnapshotJson for ${ticker || snapshotData.ticker}`);
  } catch(e: any) {
    const errorMsg = `Failed to parse stockSnapshotJson: ${e.message}`;
    logger.error(`${actionLogPrefix} Error parsing snapshot for ${ticker || 'Unknown'}: ${errorMsg}`);
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
        snapshotДay.l == null ||
        snapshotData.prevDay.c == null) {
      const errorMsg = 'Previous day HLC data is missing from the stock snapshot.';
      logger.warn(`${actionLogPrefix} Data Error for ${ticker || snapshotData.ticker}: ${errorMsg}`);
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
    
    const flowOutput: AnalyzeTaOutput = await analyzeTaIndicators(flowInput);
    
    const aiAnalyzedTaJson = JSON.stringify(flowOutput, null, 2);

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
    logger.error(`${actionLogPrefix} CRITICAL Error for ${ticker || snapshotData?.ticker || 'Unknown'}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI TA analysis.',
      message: 'Failed to analyze AI TA indicators.',
      data: undefined,
    };
  }
}
