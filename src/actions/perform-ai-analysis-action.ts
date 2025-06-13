
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
  aiAnalyzedTaJson: string; // Renamed field
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
    aiAnalyzedTaJson, // Renamed variable
    marketStatusJson 
  } = payload;
  console.log(`[ServerAction:performAiAnalysisAction] Request for ticker: ${ticker}`);

  if (!ticker || !stockSnapshotJson || stockSnapshotJson === '{}' || 
      !standardTasJson || standardTasJson === '{}' ||
      !aiAnalyzedTaJson || aiAnalyzedTaJson === '{}' || // Renamed variable
      !marketStatusJson || marketStatusJson === '{}') {
    const errorMsg = 'One or more required data inputs for AI analysis are missing or empty.';
    console.warn(`[ServerAction:performAiAnalysisAction] Validation Error for ${ticker}: ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Prerequisite data not available for AI key takeaways.',
      data: undefined,
    };
  }
  
  const flowInput: StockAnalysisInput = {
    ticker,
    stockSnapshotJson,
    standardTasJson,
    aiCalculatedTaJson: aiAnalyzedTaJson, // Map renamed variable to schema field (schema will be updated later if needed, or prompt adjusted)
                                        // Self-correction: The schema field name is 'aiCalculatedTaJson'.
                                        // I should update the schema name eventually, but for now, map it.
                                        // For the AI prompt `analyze-stock-data.ts`, it refers to `{{{aiCalculatedTaJson}}}`.
                                        // So `StockAnalysisInputSchema`'s field `aiCalculatedTaJson` should remain if the prompt isn't changing that part.
                                        // The *content producer* (analyze-ta-action) now produces `aiAnalyzedTaJson`.
                                        // This action *consumes* it. So the input parameter should be `aiAnalyzedTaJson`.
                                        // The `StockAnalysisInputSchema` and the prompt `analyze-stock-data.ts` should be updated
                                        // to expect `aiAnalyzedTaJson` instead of `aiCalculatedTaJson`.
    marketStatusJson,
  };

  const aiKeyTakeawaysRequestJson = JSON.stringify(flowInput, null, 2);
  console.log(`[ServerAction:performAiAnalysisAction] Calling analyzeStockData flow for ${ticker} with input: ${aiKeyTakeawaysRequestJson.substring(0,200)}...`);

  try {
    const flowOutput: StockAnalysisOutput = await analyzeStockData(flowInput);
    const aiKeyTakeawaysJson = JSON.stringify(flowOutput, null, 2);
    console.log(`[ServerAction:performAiAnalysisAction] analyzeStockData flow succeeded for ${ticker}. Output: ${aiKeyTakeawaysJson.substring(0,200)}...`);

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
