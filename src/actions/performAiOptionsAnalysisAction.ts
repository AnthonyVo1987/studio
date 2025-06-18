
'use server';

import {
  analyzeOptionsChain,
  type AiOptionsAnalysisInput,
  type AiOptionsAnalysisOutput,
} from '@/ai/flows/analyze-options-chain-flow';
import type { StockSnapshotData } from '@/services/data-sources/types';

export interface PerformAiOptionsAnalysisResult {
  aiOptionsAnalysisRequestJson: string;
  aiOptionsAnalysisJson: string;
}

export interface PerformAiOptionsAnalysisActionState {
  status: 'idle' | 'success' | 'error';
  data?: PerformAiOptionsAnalysisResult;
  error?: string | null;
  message?: string | null;
}

// Removed: const initialPerformAiOptionsAnalysisState as it's not used server-side for export

interface PerformAiOptionsAnalysisActionInputs {
  ticker: string;
  optionsChainJson: string;
  stockSnapshotJson: string;
}

export async function performAiOptionsAnalysisAction(
  prevState: PerformAiOptionsAnalysisActionState,
  payload: PerformAiOptionsAnalysisActionInputs
): Promise<PerformAiOptionsAnalysisActionState> {
  const {
    ticker,
    optionsChainJson,
    stockSnapshotJson,
  } = payload;
  const actionLogPrefix = `[ServerAction:performAiOptionsAnalysisAction:Ticker:${ticker}]`;
  console.log(`${actionLogPrefix} Action_Entry - Received request. PrevState status: ${prevState.status}. Payload keys: ${Object.keys(payload).join(', ')}.`);

  let currentUnderlyingPrice: number;
  let flowInput: AiOptionsAnalysisInput;
  let aiOptionsAnalysisRequestJson: string = JSON.stringify({ error: "Request preparation incomplete", ticker }, null, 2);

  const baseErrorReturnForValidation = (errMsg: string, detailMsg?: string, reqJsonOverride?: string) => {
    console.warn(`${actionLogPrefix} Action_ValidationError - Validation Error: ${errMsg}, Detail: ${detailMsg}`);
    return {
      status: 'error' as 'error',
      error: errMsg,
      message: detailMsg || errMsg,
      data: {
        aiOptionsAnalysisRequestJson: reqJsonOverride || aiOptionsAnalysisRequestJson,
        aiOptionsAnalysisJson: JSON.stringify({
          error: errMsg, details: detailMsg || "Validation failed before AI options analysis.",
          callWalls: [], putWalls: [] // Ensure this structure for consistency
        }, null, 2),
      },
    };
  };

  try {
    if (!ticker || !optionsChainJson || optionsChainJson === '{}' || !stockSnapshotJson || stockSnapshotJson === '{}') {
      const errorMsg = 'Ticker, Options Chain JSON, or Stock Snapshot JSON is missing or empty.';
      aiOptionsAnalysisRequestJson = JSON.stringify({ error: errorMsg, ticker, optionsChainJsonProvided: !!(optionsChainJson && optionsChainJson !== '{}'), stockSnapshotJsonProvided: !!(stockSnapshotJson && stockSnapshotJson !== '{}') }, null, 2);
      return baseErrorReturnForValidation(errorMsg, 'Prerequisite data not available for AI options analysis.');
    }

    try {
      const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
      if (snapshot.currentPrice === null || snapshot.currentPrice === undefined) {
        throw new Error('Current price not found in stock snapshot.');
      }
      currentUnderlyingPrice = snapshot.currentPrice;
      console.log(`${actionLogPrefix} Action_Info - Extracted current underlying price: ${currentUnderlyingPrice}`);
    } catch (e: any) {
      const errorMsg = `Failed to get current price from stockSnapshotJson: ${e.message}`;
      console.error(`${actionLogPrefix} Action_DataParseError - ${errorMsg}. Snapshot JSON (first 100): ${stockSnapshotJson.substring(0,100)}`);
      aiOptionsAnalysisRequestJson = JSON.stringify({ error: errorMsg, ticker, stockSnapshotJsonSnippet: stockSnapshotJson.substring(0,100) }, null, 2);
      return baseErrorReturnForValidation(errorMsg, 'Could not determine current price for AI options analysis.');
    }

    flowInput = {
      ticker,
      optionsChainJson,
      currentUnderlyingPrice,
    };
    aiOptionsAnalysisRequestJson = JSON.stringify(flowInput, null, 2);

    console.log(`${actionLogPrefix} Action_PreFlowCall - Calling analyzeOptionsChain flow. Input Keys: ${Object.keys(flowInput).join(', ')}.`);
    const flowOutput: AiOptionsAnalysisOutput = await analyzeOptionsChain(flowInput);
    console.log(`${actionLogPrefix} Action_PostFlowCall_Success - analyzeOptionsChain flow returned. CallWalls: ${flowOutput.callWalls?.length}, PutWalls: ${flowOutput.putWalls?.length}.`);

    if (!flowOutput || !Array.isArray(flowOutput.callWalls) || !Array.isArray(flowOutput.putWalls)) {
        const flowErrorMsg = 'AI options analysis flow returned invalid, malformed, or empty data structure.';
        console.error(`${actionLogPrefix} Action_Error_PostFlowCall - Flow returned malformed output. Output (first 200): ${JSON.stringify(flowOutput).substring(0,200)}`);
        // This path ideally shouldn't be hit if the flow itself throws an error for bad structure
        return {
          status: 'error',
          error: flowErrorMsg,
          message: `AI options analysis failed to produce valid wall data from the flow.`,
          data: {
            aiOptionsAnalysisRequestJson,
            aiOptionsAnalysisJson: JSON.stringify({ error: flowErrorMsg, details: "Flow output structure was invalid.", callWalls: [], putWalls: [] }, null, 2),
          },
        };
    }

    const aiOptionsAnalysisJsonOutput = JSON.stringify(flowOutput, null, 2);
    console.log(`${actionLogPrefix} Action_ProcessComplete - analyzeOptionsChain flow processing in action completed.`);

    return {
      status: 'success',
      data: {
        aiOptionsAnalysisRequestJson,
        aiOptionsAnalysisJson: aiOptionsAnalysisJsonOutput,
      },
      message: `AI options analysis for ${ticker} generated successfully.`,
      error: null,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'An unknown error occurred during AI options analysis.';
    console.error(`${actionLogPrefix} Action_FlowError_Or_ActionCatch - CRITICAL Error in performAiOptionsAnalysisAction's try-catch block. Error: ${errorMessage}.`);
    return {
      status: 'error',
      error: errorMessage,
      message: `Failed to generate AI options analysis for ${ticker}. Flow might have failed.`,
      data: {
        aiOptionsAnalysisRequestJson, // Request to the flow
        aiOptionsAnalysisJson: JSON.stringify({ error: errorMessage, details: String(error) }, null, 2),
      },
    };
  }
}
