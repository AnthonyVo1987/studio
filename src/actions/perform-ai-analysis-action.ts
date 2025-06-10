
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

// Input for this action is derived from context within MainTabContent
// It will pass the necessary JSON strings.
interface PerformAiAnalysisActionInputs {
  ticker: string;
  stockSnapshotJson: string;
  standardTasJson: string;
  aiCalculatedTaJson: string;
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
    aiCalculatedTaJson, 
    marketStatusJson 
  } = payload;

  if (!ticker || !stockSnapshotJson || stockSnapshotJson === '{}' || 
      !standardTasJson || standardTasJson === '{}' ||
      !aiCalculatedTaJson || aiCalculatedTaJson === '{}' ||
      !marketStatusJson || marketStatusJson === '{}') {
    return {
      status: 'error',
      error: 'One or more required data inputs for AI analysis are missing or empty.',
      message: 'Prerequisite data not available for AI key takeaways.',
      data: undefined,
    };
  }
  
  const flowInput: StockAnalysisInput = {
    ticker,
    stockSnapshotJson,
    standardTasJson,
    aiCalculatedTaJson,
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
    console.error(`Error in performAiAnalysisAction for ${ticker}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI key takeaways generation.',
      message: `Failed to generate AI key takeaways for ${ticker}.`,
      data: { // Still return the request JSON if it was formed
        aiKeyTakeawaysRequestJson,
        aiKeyTakeawaysJson: JSON.stringify({ error: error.message || 'Flow execution failed' }, null, 2),
      },
    };
  }
}
