
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

  let currentUnderlyingPrice: number;
  let flowInput: AiOptionsAnalysisInput;
  let aiOptionsAnalysisRequestJson: string = "{}"; // Initialize

  try {
    if (!ticker || !optionsChainJson || optionsChainJson === '{}' || !stockSnapshotJson || stockSnapshotJson === '{}') {
      const errorMsg = 'Ticker, Options Chain JSON, or Stock Snapshot JSON is missing or empty. Cannot perform AI options analysis.';
      console.warn(`[ServerAction:performAiOptionsAnalysisAction] Validation Error for ${ticker}: ${errorMsg}`);
      return {
        status: 'error',
        error: errorMsg,
        message: 'Prerequisite data not available for AI options analysis.',
        data: undefined, // Or provide placeholder error JSONs if needed by context
      };
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
      return {
        status: 'error',
        error: errorMsg,
        message: 'Could not determine current price for AI options analysis.',
        data: undefined,
      };
    }

    flowInput = {
      ticker,
      optionsChainJson,
      currentUnderlyingPrice,
    };
    aiOptionsAnalysisRequestJson = JSON.stringify(flowInput, null, 2);

    console.log(`[ServerAction:performAiOptionsAnalysisAction] Calling analyzeOptionsChain flow for ${ticker}. Input (partial options): ${optionsChainJson.substring(0,100)}...`);
    
    const flowOutput: AiOptionsAnalysisOutput = await analyzeOptionsChain(flowInput);
    
    // Check if the flow itself indicated an internal error in its summary, even if it didn't throw
    if (flowOutput && flowOutput.analysisSummary && flowOutput.analysisSummary.toLowerCase().includes('error:')) {
        console.warn(`[ServerAction:performAiOptionsAnalysisAction] Flow for ${ticker} returned an error in summary: ${flowOutput.analysisSummary}`);
        return {
            status: 'error',
            error: `Flow error: ${flowOutput.analysisSummary}`,
            message: `AI options analysis for ${ticker} reported an internal error.`,
            data: {
                aiOptionsAnalysisRequestJson,
                aiOptionsAnalysisJson: JSON.stringify(flowOutput, null, 2), // Return the flow's error output
            }
        };
    }
    
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
    const errorMessage = error.message || 'An unknown error occurred during AI options analysis.';
    // Ensure aiOptionsAnalysisRequestJson is stringified even in error if flowInput was prepared
    if (!flowInput! && payload.optionsChainJson && payload.stockSnapshotJson && payload.ticker) {
        try {
             const tempSnapshot = JSON.parse(payload.stockSnapshotJson) as StockSnapshotData;
             const tempCurrentPrice = tempSnapshot.currentPrice;
             if (tempCurrentPrice !== null && tempCurrentPrice !== undefined) {
                aiOptionsAnalysisRequestJson = JSON.stringify({ticker: payload.ticker, optionsChainJson: payload.optionsChainJson, currentUnderlyingPrice: tempCurrentPrice}, null, 2);
             }
        } catch { /* ignore, keep default "{}" */ }
    }

    return {
      status: 'error',
      error: errorMessage,
      message: `Failed to generate AI options analysis for ${ticker}.`,
      data: { 
        aiOptionsAnalysisRequestJson,
        aiOptionsAnalysisJson: JSON.stringify({ 
            error: errorMessage, 
            callWalls:[], 
            putWalls:[], 
            callClusters: [], 
            putClusters:[], 
            analysisSummary: `Action execution failed: ${errorMessage}` 
        }, null, 2),
      },
    };
  }
}
