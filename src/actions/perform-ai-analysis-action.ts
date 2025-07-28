
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

  console.log(`${actionLogPrefix} Starting AI key takeaways analysis...`, {
    ticker,
    hasStockSnapshot: !!stockSnapshotJson,
    hasStandardTas: !!standardTasJson,
    hasAiAnalyzedTa: !!aiAnalyzedTaJson,
    hasMarketStatus: !!marketStatusJson
  });

  // Check only for essential data - allow technical analysis to contain errors
  if (!ticker || !stockSnapshotJson || stockSnapshotJson === '{}' ||
      !marketStatusJson || marketStatusJson === '{}') {
    const errorMsg = 'Essential data inputs (ticker, stock snapshot, market status) are missing for AI Key Takeaways analysis.';
    console.error(`${actionLogPrefix} Validation error:`, errorMsg);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Essential prerequisite data not available for AI key takeaways.',
      data: {
        aiKeyTakeawaysRequestJson: JSON.stringify({ error: errorMsg, ticker }, null, 2),
        aiKeyTakeawaysJson: JSON.stringify({ error: errorMsg, details: "Missing essential prerequisite data." }, null, 2),
      },
    };
  }

  // Log warning if technical analysis data is missing or contains errors, but continue processing
  if (!standardTasJson || standardTasJson === '{}') {
    console.warn(`${actionLogPrefix} Warning: Standard technical analysis data is missing or empty`);
  }
  if (!aiAnalyzedTaJson || aiAnalyzedTaJson === '{}') {
    console.warn(`${actionLogPrefix} Warning: AI analyzed technical analysis data is missing or empty`);
  }

  const flowInput: StockAnalysisInput = {
    ticker,
    stockSnapshotJson,
    standardTasJson,
    aiAnalyzedTaJson,
    marketStatusJson,
  };

  console.log(`${actionLogPrefix} Prepared flow input for AI analysis`);
  const aiKeyTakeawaysRequestJson = JSON.stringify(flowInput, null, 2);
  
  try {
    console.log(`${actionLogPrefix} Calling AI flow for key takeaways generation...`);
    const flowOutput: StockAnalysisOutput = await analyzeStockData(flowInput);
    console.log(`${actionLogPrefix} AI flow completed successfully`);

    const aiKeyTakeawaysJson = JSON.stringify(flowOutput, null, 2);

    console.log(`${actionLogPrefix} SUCCESS - AI key takeaways analysis completed`);
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
    console.error(`${actionLogPrefix} CATCH ERROR:`, error.message || error);
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
