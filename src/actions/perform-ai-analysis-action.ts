
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
    marketStatusJson 
  } = payload;
  console.log(`[ServerAction:performAiAnalysisAction] Request for ticker: ${ticker}`);

  if (!ticker || !stockSnapshotJson || stockSnapshotJson === '{}' || 
      !standardTasJson || standardTasJson === '{}' ||
      !aiAnalyzedTaJson || aiAnalyzedTaJson === '{}' || 
      !marketStatusJson || marketStatusJson === '{}') {
    const errorMsg = 'One or more required data inputs for AI analysis are missing or empty.';
    console.warn(`[ServerAction:performAiAnalysisAction] Validation Error for ${ticker}: ${errorMsg}`);
    const requestPayloadSnapshot = {
        ticker, 
        stockSnapshotJsonValid: !!(stockSnapshotJson && stockSnapshotJson !== '{}'),
        standardTasJsonValid: !!(standardTasJson && standardTasJson !== '{}'),
        aiAnalyzedTaJsonValid: !!(aiAnalyzedTaJson && aiAnalyzedTaJson !== '{}'),
        marketStatusJsonValid: !!(marketStatusJson && marketStatusJson !== '{}'),
    };
    return {
      status: 'error',
      error: errorMsg,
      message: 'Prerequisite data not available for AI key takeaways.',
      data: {
        aiKeyTakeawaysRequestJson: JSON.stringify({ error: errorMsg, inputSnapshot: requestPayloadSnapshot }, null, 2),
        aiKeyTakeawaysJson: JSON.stringify({ error: errorMsg }, null, 2),
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
  console.log(`[ServerAction:performAiAnalysisAction] Calling analyzeStockData flow for ${ticker}. Input (keys): ${Object.keys(flowInput).join(', ')}`);

  try {
    const flowOutput: StockAnalysisOutput = await analyzeStockData(flowInput);
    const aiKeyTakeawaysJson = JSON.stringify(flowOutput, null, 2);
    console.log(`[ServerAction:performAiAnalysisAction] analyzeStockData flow succeeded for ${ticker}. Output keys: ${Object.keys(flowOutput).join(', ')}`);

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
    console.error(`[ServerAction:performAiAnalysisAction] CRITICAL Error for ${ticker}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI key takeaways generation.',
      message: `Failed to generate AI key takeaways for ${ticker}.`,
      data: { 
        aiKeyTakeawaysRequestJson,
        aiKeyTakeawaysJson: JSON.stringify({ error: error.message || 'Flow execution failed' }, null, 2),
      },
    };
  }
}

