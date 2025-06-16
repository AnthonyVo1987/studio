
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

const initialPerformAiOptionsAnalysisState: PerformAiOptionsAnalysisActionState = { // Not exported
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
  console.log(`[ServerAction:performAiOptionsAnalysisAction] Request for ticker: ${ticker}`);

  let currentUnderlyingPrice: number;
  let flowInput: AiOptionsAnalysisInput;
  let aiOptionsAnalysisRequestJson: string = JSON.stringify({ error: "Request preparation incomplete", ticker }, null, 2); // Default request JSON

  const baseErrorReturn = (errMsg: string, detailMsg?: string, reqJsonOverride?: string) => ({
    status: 'error' as 'error',
    error: errMsg,
    message: detailMsg || errMsg,
    data: {
      aiOptionsAnalysisRequestJson: reqJsonOverride || aiOptionsAnalysisRequestJson,
      aiOptionsAnalysisJson: JSON.stringify({ status: 'error', error: errMsg, details: detailMsg, callWalls: [], putWalls: [] }, null, 2),
    },
  });

  try {
    if (!ticker || !optionsChainJson || optionsChainJson === '{}' || !stockSnapshotJson || stockSnapshotJson === '{}') {
      const errorMsg = 'Ticker, Options Chain JSON, or Stock Snapshot JSON is missing or empty. Cannot perform AI options analysis.';
      console.warn(`[ServerAction:performAiOptionsAnalysisAction] Validation Error for ${ticker}: ${errorMsg}`);
      aiOptionsAnalysisRequestJson = JSON.stringify({ error: errorMsg, ticker, optionsChainJsonProvided: !!(optionsChainJson && optionsChainJson !== '{}'), stockSnapshotJsonProvided: !!(stockSnapshotJson && stockSnapshotJson !== '{}') }, null, 2);
      return baseErrorReturn(errorMsg, 'Prerequisite data not available for AI options analysis.');
    }

    try {
      const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
      if (snapshot.currentPrice === null || snapshot.currentPrice === undefined) {
        throw new Error('Current price not found in stock snapshot.');
      }
      currentUnderlyingPrice = snapshot.currentPrice;
    } catch (e: any) {
      const errorMsg = `Failed to get current price from stockSnapshotJson: ${e.message}`;
      console.error(`[ServerAction:performAiOptionsAnalysisAction] ${errorMsg} for ${ticker}`);
      aiOptionsAnalysisRequestJson = JSON.stringify({ error: errorMsg, ticker, stockSnapshotJson }, null, 2);
      return baseErrorReturn(errorMsg, 'Could not determine current price for AI options analysis.');
    }

    flowInput = {
      ticker,
      optionsChainJson,
      currentUnderlyingPrice,
    };
    aiOptionsAnalysisRequestJson = JSON.stringify(flowInput, null, 2);

    console.log(`[ServerAction:performAiOptionsAnalysisAction] Calling analyzeOptionsChain flow for ${ticker}. Input Keys: ${Object.keys(flowInput).join(', ')}. Current Price: ${currentUnderlyingPrice}`);

    const flowOutput: AiOptionsAnalysisOutput = await analyzeOptionsChain(flowInput);

    
    if (!flowOutput || !Array.isArray(flowOutput.callWalls) || !Array.isArray(flowOutput.putWalls)) {
        const flowErrorMsg = 'AI options analysis flow returned invalid or malformed data structure.';
        console.error(`[ServerAction:performAiOptionsAnalysisAction] Flow for ${ticker} returned malformed output (not arrays or missing keys):`, flowOutput);
        return baseErrorReturn(flowErrorMsg, `AI options analysis for ${ticker} failed to produce valid wall data.`);
    }
    
    const aiOptionsAnalysisJson = JSON.stringify(flowOutput, null, 2);
    console.log(`[ServerAction:performAiOptionsAnalysisAction] analyzeOptionsChain flow succeeded for ${ticker}. CallWalls: ${flowOutput.callWalls.length}, PutWalls: ${flowOutput.putWalls.length}`);

    return {
      status: 'success',
      data: {
        aiOptionsAnalysisRequestJson,
        aiOptionsAnalysisJson,
      },
      message: `AI options analysis for ${ticker} generated successfully.`,
      error: null,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'An unknown error occurred during AI options analysis.';
    console.error(`[ServerAction:performAiOptionsAnalysisAction] CRITICAL Error for ${ticker}:`, error);
    // Capture details of the error if it's an object
    const errorDetails = (typeof error === 'object' && error !== null) ? JSON.stringify(error) : String(error);
    return baseErrorReturn(errorMessage, `Failed to generate AI options analysis for ${ticker}. Error: ${errorDetails}`);
  }
}

