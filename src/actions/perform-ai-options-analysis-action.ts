
'use server';

import {
  analyzeOptionsChain,
  type AiOptionsAnalysisInput,
  type AiOptionsAnalysisOutput,
} from '@/ai/flows/analyze-options-chain-flow';
import type { OptionsChainData, StockSnapshotData } from '@/services/data-sources/types';

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

interface PerformAiOptionsAnalysisActionInputs {
  ticker: string;
  optionsChainJson: string;
  stockSnapshotJson: string; // To get current underlying price
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

  if (!ticker || !optionsChainJson || optionsChainJson === '{}' || !stockSnapshotJson || stockSnapshotJson === '{}') {
    const errorMsg = 'Ticker, Options Chain JSON, or Stock Snapshot JSON is missing or empty. Cannot perform AI options analysis.';
    console.warn(`[ServerAction:performAiOptionsAnalysisAction] Validation Error for ${ticker}: ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Prerequisite data not available for AI options analysis.',
      data: undefined,
    };
  }
  
  let currentUnderlyingPrice: number;
  try {
    const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
    if (snapshot.currentPrice === null || snapshot.currentPrice === undefined) {
      throw new Error('Current price not found in stock snapshot.');
    }
    currentUnderlyingPrice = snapshot.currentPrice;
  } catch (e: any) {
    const errorMsg = `Failed to get current price from stockSnapshotJson: ${e.message}`;
    console.error(`[ServerAction:performAiOptionsAnalysisAction] ${errorMsg} for ${ticker}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Could not determine current price for AI options analysis.',
      data: undefined,
    };
  }

  const flowInput: AiOptionsAnalysisInput = {
    ticker,
    optionsChainJson,
    currentUnderlyingPrice,
  };

  const aiOptionsAnalysisRequestJson = JSON.stringify(flowInput, null, 2);
  console.log(`[ServerAction:performAiOptionsAnalysisAction] Calling analyzeOptionsChain flow for ${ticker}. Input (partial options): ${optionsChainJson.substring(0,100)}...`);

  try {
    const flowOutput: AiOptionsAnalysisOutput = await analyzeOptionsChain(flowInput);
    const aiOptionsAnalysisJson = JSON.stringify(flowOutput, null, 2);
    console.log(`[ServerAction:performAiOptionsAnalysisAction] analyzeOptionsChain flow succeeded for ${ticker}. Output (summary): ${flowOutput.analysisSummary || `CallWalls: ${flowOutput.callWalls.length}, PutWalls: ${flowOutput.putWalls.length}`}`);

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
    console.error(`[ServerAction:performAiOptionsAnalysisAction] CRITICAL Error for ${ticker}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during AI options analysis.',
      message: `Failed to generate AI options analysis for ${ticker}.`,
      data: { 
        aiOptionsAnalysisRequestJson,
        aiOptionsAnalysisJson: JSON.stringify({ error: error.message || 'Flow execution failed', callWalls:[], putWalls:[], analysisSummary: "Flow execution failed" }, null, 2),
      },
    };
  }
}
