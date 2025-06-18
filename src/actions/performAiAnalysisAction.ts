
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
  const actionLogPrefix = `[ServerAction:performAiAnalysisAction:Ticker:${ticker}]`; // Simplified log prefix
  console.log(`${actionLogPrefix} Action_Entry - Received request. PrevState status: ${prevState.status}. Payload keys: ${Object.keys(payload).join(', ')}.`);


  if (!ticker || !stockSnapshotJson || stockSnapshotJson === '{}' ||
      !standardTasJson || standardTasJson === '{}' ||
      !aiAnalyzedTaJson || aiAnalyzedTaJson === '{}' ||
      !marketStatusJson || marketStatusJson === '{}') {
    const errorMsg = 'One or more required data inputs for AI Key Takeaways analysis are missing or empty.';
    console.warn(`${actionLogPrefix} Action_ValidationError - ${errorMsg}. Details - Snapshot valid: ${!!(stockSnapshotJson && stockSnapshotJson !== '{}')}, Standard TAs valid: ${!!(standardTasJson && standardTasJson !== '{}')}, AI TA valid: ${!!(aiAnalyzedTaJson && aiAnalyzedTaJson !== '{}')}, MarketStatus valid: ${!!(marketStatusJson && marketStatusJson !== '{}')}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Prerequisite data not available for AI key takeaways.',
      data: {
        aiKeyTakeawaysRequestJson: JSON.stringify({ error: errorMsg, ticker, inputValidity: {stockSnapshotJsonValid: !!(stockSnapshotJson && stockSnapshotJson !== '{}'), standardTasJsonValid: !!(standardTasJson && standardTasJson !== '{}'), aiAnalyzedTaJsonValid: !!(aiAnalyzedTaJson && aiAnalyzedTaJson !== '{}'), marketStatusJsonValid: !!(marketStatusJson && marketStatusJson !== '{}')} }, null, 2),
        aiKeyTakeawaysJson: JSON.stringify({ error: errorMsg, details: "Missing prerequisite data for AI key takeaways analysis." }, null, 2),
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
  console.log(`${actionLogPrefix} Action_PreFlowCall - Calling analyzeStockData flow. Input (first 300 chars of request JSON): ${aiKeyTakeawaysRequestJson.substring(0,300)}...`);

  try {
    const flowOutput: StockAnalysisOutput = await analyzeStockData(flowInput);
    console.log(`${actionLogPrefix} Action_PostFlowCall_Success - analyzeStockData flow returned. FlowOutput (first 500 chars): ${JSON.stringify(flowOutput).substring(0,500)}`);

    // Additional check: Ensure all 5 categories are present in the flowOutput, even if with default messages.
    const categories: (keyof StockAnalysisOutput)[] = ["priceAction", "trend", "volatility", "momentum", "patterns"];
    let allCategoriesPresent = true;
    for (const category of categories) {
        if (!flowOutput[category] || !flowOutput[category].takeaway) {
            allCategoriesPresent = false;
            console.warn(`${actionLogPrefix} Action_Warning_PostFlowCall - Flow output missing or has empty takeaway for category '${category}'. This might indicate an issue in the flow's default filling. Output for category: ${JSON.stringify(flowOutput[category])}`);
        }
    }
    if (!allCategoriesPresent) {
        console.error(`${actionLogPrefix} Action_Error_PostFlowCall - Not all takeaway categories were present in the flow output from analyzeStockData. This is unexpected.`);
    }

    const aiKeyTakeawaysJson = JSON.stringify(flowOutput, null, 2);
    console.log(`${actionLogPrefix} Action_ProcessComplete - analyzeStockData flow processing in action completed. Final aiKeyTakeawaysJson (first 300 chars): ${aiKeyTakeawaysJson.substring(0,300)}...`);

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
    console.error(`${actionLogPrefix} Action_FlowError_Or_ActionCatch - CRITICAL Error in performAiAnalysisAction's try-catch block (flow threw error or action itself failed). Error name: ${error?.name}, Message: ${error?.message}.`);
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

