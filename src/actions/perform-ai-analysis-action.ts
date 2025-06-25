
'use server';

import {
  analyzeStockData,
  type StockAnalysisInput,
  type StockAnalysisOutput,
} from '@/ai/flows/analyze-stock-data';

export interface PerformAiAnalysisResult {
  aiKeyTakeawaysRequestJson: string;
  aiKeyTakeawaysJson: string;
}

export interface PerformAiAnalysisActionState {
  status: 'idle' | 'success' | 'error';
  data?: PerformAiAnalysisResult;
  error?: string | null;
  message?: string | null;
}

interface PerformAiAnalysisActionInputs {
  ticker: string;
  stockSnapshotJson: string;
  standardTasJson: string;
  aiAnalyzedTaJson: string;
  marketStatusJson: string;
}

export async function performAiAnalysisAction(
  prevState: PerformAiAnalysisActionState,
  payload: PerformAiAnalysisActionInputs
): Promise<PerformAiAnalysisActionState> {
  const {
    ticker,
    stockSnapshotJson,
    standardTasJson,
    aiAnalyzedTaJson,
    marketStatusJson,
  } = payload;
  const actionLogPrefix = `[ServerAction:performAiAnalysisAction:Ticker:${ticker}]`;
  console.log(`${actionLogPrefix} Received request. Payload keys: ${Object.keys(payload).join(', ')}.`);


  if (!ticker || !stockSnapshotJson || stockSnapshotJson === '{}' ||
      !standardTasJson || standardTasJson === '{}' ||
      !aiAnalyzedTaJson || aiAnalyzedTaJson === '{}' ||
      !marketStatusJson || marketStatusJson === '{}') {
    const errorMsg = 'One or more required data inputs for AI Key Takeaways analysis are missing or empty.';
    console.warn(`${actionLogPrefix} Validation Error - ${errorMsg}.`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Prerequisite data not available for AI key takeaways.',
      data: {
        aiKeyTakeawaysRequestJson: JSON.stringify({ error: errorMsg, ticker }, null, 2),
        aiKeyTakeawaysJson: JSON.stringify({ error: errorMsg, details: "Missing prerequisite data." }, null, 2),
      },
    };
  }

  const flowInput: StockAnalysisInput = {
    ticker,
    stockSnapshotJson,
    standardTasJson,
    aiAnalyzedTaJson,
    marketStatusJson,
  };

  const aiKeyTakeawaysRequestJson = JSON.stringify(flowInput, null, 2);
  
  try {
    const flowOutput: StockAnalysisOutput = await analyzeStockData(flowInput);

    const aiKeyTakeawaysJson = JSON.stringify(flowOutput, null, 2);

    return {
      status: 'success',
      data: {
        aiKeyTakeawaysRequestJson,
        aiKeyTakeawaysJson,
      },
      message: `AI key takeaways for ${ticker} generated successfully.`,
      error: null,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} CRITICAL Error in action's try-catch. Error: ${error?.message}.`);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI key takeaways generation.',
      message: `Failed to generate AI key takeaways for ${ticker}.`,
      data: {
        aiKeyTakeawaysRequestJson,
        aiKeyTakeawaysJson: JSON.stringify({ error: error.message || 'Flow execution failed', details: String(error) }, null, 2),
      },
    };
  }
}
