
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

// Removed: const initialPerformAiAnalysisState as it's not used server-side for export

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
  const actionLogPrefix = `[ServerAction:performAiAnalysisAction:Ticker:${ticker}:DJ]`; // Kept DJ from previous log scope
  console.log(`${actionLogPrefix} Action_Log_DJ_Entry - Received request. PrevState status: ${prevState.status}. Payload keys: ${Object.keys(payload).join(', ')}.`);
  console.log(`${actionLogPrefix} Action_Log_DJ_Payload - stockSnapshotJson (len: ${stockSnapshotJson.length}): ${stockSnapshotJson.substring(0,100)}...`);
  console.log(`${actionLogPrefix} Action_Log_DJ_Payload - standardTasJson (len: ${standardTasJson.length}): ${standardTasJson.substring(0,100)}...`);
  console.log(`${actionLogPrefix} Action_Log_DJ_Payload - aiAnalyzedTaJson (len: ${aiAnalyzedTaJson.length}): ${aiAnalyzedTaJson.substring(0,100)}...`);
  console.log(`${actionLogPrefix} Action_Log_DJ_Payload - marketStatusJson (len: ${marketStatusJson.length}): ${marketStatusJson.substring(0,100)}...`);


  if (!ticker || !stockSnapshotJson || stockSnapshotJson === '{}' || 
      !standardTasJson || standardTasJson === '{}' ||
      !aiAnalyzedTaJson || aiAnalyzedTaJson === '{}' || 
      !marketStatusJson || marketStatusJson === '{}') {
    const errorMsg = 'One or more required data inputs for AI Key Takeaways analysis are missing or empty.';
    console.warn(`${actionLogPrefix} Action_Log_DJ_ValidationError - ${errorMsg}. Details - Snapshot valid: ${!!(stockSnapshotJson && stockSnapshotJson !== '{}')}, Standard TAs valid: ${!!(standardTasJson && standardTasJson !== '{}')}, AI TA valid: ${!!(aiAnalyzedTaJson && aiAnalyzedTaJson !== '{}')}, MarketStatus valid: ${!!(marketStatusJson && marketStatusJson !== '{}')}`);
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
  console.log(`${actionLogPrefix} Action_Log_DJ_PreFlowCall - Calling analyzeStockData flow. Input (first 300 chars of request JSON): ${aiKeyTakeawaysRequestJson.substring(0,300)}...`);

  try {
    const flowOutput: StockAnalysisOutput = await analyzeStockData(flowInput);
    console.log(`${actionLogPrefix} Action_Log_DJ_FlowSuccess - analyzeStockData flow returned. FlowOutput (first 500 chars): ${JSON.stringify(flowOutput).substring(0,500)}`);
    
    // Additional check: Ensure all 5 categories are present in the flowOutput, even if with default messages.
    const categories: (keyof StockAnalysisOutput)[] = ["priceAction", "trend", "volatility", "momentum", "patterns"];
    let allCategoriesPresent = true;
    for (const category of categories) {
        if (!flowOutput[category] || !flowOutput[category].takeaway) {
            allCategoriesPresent = false;
            console.warn(`${actionLogPrefix} Action_Log_DJ_Warning - Flow output missing or has empty takeaway for category '${category}'. This might indicate an issue in the flow's default filling. Output for category: ${JSON.stringify(flowOutput[category])}`);
        }
    }
    if (!allCategoriesPresent) {
        console.error(`${actionLogPrefix} Action_Log_DJ_Error - Not all takeaway categories were present in the flow output from analyzeStockData. This is unexpected.`);
        // Decide if this should be a hard error or if the (potentially partial) flowOutput is still passed.
        // For now, pass it but log an error.
    }

    const aiKeyTakeawaysJson = JSON.stringify(flowOutput, null, 2);
    console.log(`${actionLogPrefix} Action_Log_DJ_ProcessComplete - analyzeStockData flow processing in action completed. Final aiKeyTakeawaysJson (first 300 chars): ${aiKeyTakeawaysJson.substring(0,300)}...`);

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
    console.error(`${actionLogPrefix} Action_Log_DJ_FlowError_Or_ActionCatch - CRITICAL Error in performAiAnalysisAction's try-catch block (flow threw error or action itself failed). Error name: ${error?.name}, Message: ${error?.message}, Stack (first 500): ${error?.stack?.substring(0,500)}, Full error object (first 500): ${JSON.stringify(error).substring(0,500)}.`);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI key takeaways generation in action.',
      message: `Failed to generate AI key takeaways for ${ticker} due to an action-level error. Flow might have failed.`,
      data: { 
        aiKeyTakeawaysRequestJson, // Request to the flow
        aiKeyTakeawaysJson: JSON.stringify({ error: error.message || 'Flow execution failed critically or action failed', details: String(error) }, null, 2),
      },
    };
  }
}
    
