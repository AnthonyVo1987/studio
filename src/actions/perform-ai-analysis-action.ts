
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

const initialPerformAiAnalysisState: PerformAiAnalysisActionState = {
  status: 'idle',
  data: undefined,
  error: null,
  message: null,
};

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
  const actionLogPrefix = `[ServerAction:performAiAnalysisAction:Ticker:${ticker}]`;
  console.log(`${actionLogPrefix} Received request. Payload keys: ${Object.keys(payload).join(', ')}. PrevState status: ${prevState.status}`);
  console.log(`${actionLogPrefix} Payload - stockSnapshotJson (len: ${stockSnapshotJson.length}): ${stockSnapshotJson.substring(0,150)}...`);
  console.log(`${actionLogPrefix} Payload - standardTasJson (len: ${standardTasJson.length}): ${standardTasJson.substring(0,150)}...`);
  console.log(`${actionLogPrefix} Payload - aiAnalyzedTaJson (len: ${aiAnalyzedTaJson.length}): ${aiAnalyzedTaJson.substring(0,150)}...`);
  console.log(`${actionLogPrefix} Payload - marketStatusJson (len: ${marketStatusJson.length}): ${marketStatusJson.substring(0,150)}...`);


  if (!ticker || !stockSnapshotJson || stockSnapshotJson === '{}' || 
      !standardTasJson || standardTasJson === '{}' ||
      !aiAnalyzedTaJson || aiAnalyzedTaJson === '{}' || 
      !marketStatusJson || marketStatusJson === '{}') {
    const errorMsg = 'One or more required data inputs for AI Key Takeaways analysis are missing or empty.';
    console.warn(`${actionLogPrefix} Validation Error: ${errorMsg}. Details - Snapshot valid: ${!!(stockSnapshotJson && stockSnapshotJson !== '{}')}, Standard TAs valid: ${!!(standardTasJson && standardTasJson !== '{}')}, AI TA valid: ${!!(aiAnalyzedTaJson && aiAnalyzedTaJson !== '{}')}, MarketStatus valid: ${!!(marketStatusJson && marketStatusJson !== '{}')}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Prerequisite data not available for AI key takeaways.',
      data: {
        aiKeyTakeawaysRequestJson: JSON.stringify({ error: errorMsg, ticker, inputValidity: {stockSnapshotJsonValid: !!(stockSnapshotJson && stockSnapshotJson !== '{}'), standardTasJsonValid: !!(standardTasJson && standardTasJson !== '{}'), aiAnalyzedTaJsonValid: !!(aiAnalyzedTaJson && aiAnalyzedTaJson !== '{}'), marketStatusJsonValid: !!(marketStatusJson && marketStatusJson !== '{}')} }, null, 2),
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
  console.log(`${actionLogPrefix} Calling analyzeStockData flow. Input keys: ${Object.keys(flowInput).join(', ')}`);

  try {
    const flowOutput: StockAnalysisOutput = await analyzeStockData(flowInput);
    const aiKeyTakeawaysJson = JSON.stringify(flowOutput, null, 2);
    console.log(`${actionLogPrefix} analyzeStockData flow succeeded. Output keys: ${Object.keys(flowOutput).join(', ')}`);

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
    console.error(`${actionLogPrefix} CRITICAL Error during AI key takeaways generation. Error name: ${error?.name}, Message: ${error?.message}, Stack (first 500): ${error?.stack?.substring(0,500)}, Full error object (first 500): ${JSON.stringify(error).substring(0,500)}.`);
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


    