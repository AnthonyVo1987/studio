
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

const initialPerformAiOptionsAnalysisState: PerformAiOptionsAnalysisActionState = {
  status: 'idle',
  data: undefined,
  error: null,
  message: null,
};

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
  console.log(`${actionLogPrefix} Received request. Payload keys: ${Object.keys(payload).join(', ')}. PrevState status: ${prevState.status}`);
  console.log(`${actionLogPrefix} Payload - optionsChainJson (len: ${optionsChainJson.length}): ${optionsChainJson.substring(0,150)}...`);
  console.log(`${actionLogPrefix} Payload - stockSnapshotJson (len: ${stockSnapshotJson.length}): ${stockSnapshotJson.substring(0,150)}...`);


  let currentUnderlyingPrice: number;
  let flowInput: AiOptionsAnalysisInput;
  let aiOptionsAnalysisRequestJson: string = JSON.stringify({ error: "Request preparation incomplete", ticker }, null, 2); 

  const baseErrorReturn = (errMsg: string, detailMsg?: string, reqJsonOverride?: string) => {
    console.error(`${actionLogPrefix} Returning error: ${errMsg}, Detail: ${detailMsg}`);
    return {
      status: 'error' as 'error',
      error: errMsg, 
      message: detailMsg || errMsg, 
      data: {
        aiOptionsAnalysisRequestJson: reqJsonOverride || aiOptionsAnalysisRequestJson,
        aiOptionsAnalysisJson: JSON.stringify({ 
          status: 'error', error: errMsg, details: detailMsg, 
          callWalls: [], putWalls: [] 
        }, null, 2),
      },
    };
  };

  try {
    if (!ticker || !optionsChainJson || optionsChainJson === '{}' || !stockSnapshotJson || stockSnapshotJson === '{}') {
      const errorMsg = 'Ticker, Options Chain JSON, or Stock Snapshot JSON is missing or empty.';
      console.warn(`${actionLogPrefix} Validation Error: ${errorMsg}. OptionsChain empty: ${optionsChainJson === '{}'}, Snapshot empty: ${stockSnapshotJson === '{}'}`);
      aiOptionsAnalysisRequestJson = JSON.stringify({ error: errorMsg, ticker, optionsChainJsonProvided: !!(optionsChainJson && optionsChainJson !== '{}'), stockSnapshotJsonProvided: !!(stockSnapshotJson && stockSnapshotJson !== '{}') }, null, 2);
      return baseErrorReturn(errorMsg, 'Prerequisite data not available for AI options analysis.');
    }

    try {
      const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
      if (snapshot.currentPrice === null || snapshot.currentPrice === undefined) {
        throw new Error('Current price not found in stock snapshot.');
      }
      currentUnderlyingPrice = snapshot.currentPrice;
      console.log(`${actionLogPrefix} Extracted current underlying price: ${currentUnderlyingPrice}`);
    } catch (e: any) {
      const errorMsg = `Failed to get current price from stockSnapshotJson: ${e.message}`;
      console.error(`${actionLogPrefix} ${errorMsg}. Snapshot JSON (first 100): ${stockSnapshotJson.substring(0,100)}`);
      aiOptionsAnalysisRequestJson = JSON.stringify({ error: errorMsg, ticker, stockSnapshotJsonSnippet: stockSnapshotJson.substring(0,100) }, null, 2);
      return baseErrorReturn(errorMsg, 'Could not determine current price for AI options analysis.');
    }

    flowInput = {
      ticker,
      optionsChainJson,
      currentUnderlyingPrice,
    };
    aiOptionsAnalysisRequestJson = JSON.stringify(flowInput, null, 2);

    console.log(`${actionLogPrefix} Calling analyzeOptionsChain flow. Input Keys: ${Object.keys(flowInput).join(', ')}.`);

    const flowOutput: AiOptionsAnalysisOutput = await analyzeOptionsChain(flowInput);
    
    if (!flowOutput || !Array.isArray(flowOutput.callWalls) || !Array.isArray(flowOutput.putWalls)) {
        const flowErrorMsg = 'AI options analysis flow returned invalid, malformed, or empty data structure.';
        console.error(`${actionLogPrefix} Flow returned malformed output. Output (first 200): ${JSON.stringify(flowOutput).substring(0,200)}`);
        return baseErrorReturn(flowErrorMsg, `AI options analysis failed to produce valid wall data from the flow.`);
    }
    
    const aiOptionsAnalysisJsonOutput = JSON.stringify(flowOutput, null, 2);
    console.log(`${actionLogPrefix} analyzeOptionsChain flow succeeded. CallWalls: ${flowOutput.callWalls.length}, PutWalls: ${flowOutput.putWalls.length}.`);

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
    console.error(`${actionLogPrefix} CRITICAL Unhandled Error. Error: ${errorMessage}, Stack: ${error.stack}`);
    const userFriendlyDetailMsg = `Failed to generate AI options analysis for ${ticker}.`;
    return baseErrorReturn(errorMessage, userFriendlyDetailMsg, JSON.stringify({ error: errorMessage, details: String(error) }, null, 2));
  }
}


    