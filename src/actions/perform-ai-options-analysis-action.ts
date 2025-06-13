
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
  let aiOptionsAnalysisRequestJson: string; 

  const baseErrorReturn = (errMsg: string, detailMsg?: string, reqJson?: string) => ({
    status: 'error' as 'error',
    error: errMsg,
    message: detailMsg || errMsg,
    data: {
      aiOptionsAnalysisRequestJson: reqJson || JSON.stringify({ error: "Failed to prepare request", ticker }, null, 2),
      aiOptionsAnalysisJson: JSON.stringify({ 
          error: errMsg, 
          callWalls:[], putWalls:[], callClusters: [], putClusters:[], 
          analysisSummary: `Action execution failed: ${errMsg}` 
      }, null, 2),
    },
  });

  try {
    if (!ticker || !optionsChainJson || optionsChainJson === '{}' || !stockSnapshotJson || stockSnapshotJson === '{}') {
      const errorMsg = 'Ticker, Options Chain JSON, or Stock Snapshot JSON is missing or empty. Cannot perform AI options analysis.';
      console.warn(`[ServerAction:performAiOptionsAnalysisAction] Validation Error for ${ticker}: ${errorMsg}`);
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
    
    if (flowOutput && flowOutput.analysisSummary && flowOutput.analysisSummary.toLowerCase().includes('error:')) {
        console.warn(`[ServerAction:performAiOptionsAnalysisAction] Flow for ${ticker} returned an error in summary: ${flowOutput.analysisSummary}`);
        return baseErrorReturn(
            `Flow error: ${flowOutput.analysisSummary}`, 
            `AI options analysis for ${ticker} reported an internal error.`,
            aiOptionsAnalysisRequestJson
        );
    }
    
    const aiOptionsAnalysisJson = JSON.stringify(flowOutput, null, 2);
    console.log(`[ServerAction:performAiOptionsAnalysisAction] analyzeOptionsChain flow succeeded for ${ticker}. Output summary: ${flowOutput.analysisSummary || `CallWalls: ${flowOutput.callWalls?.length || 0}, PutWalls: ${flowOutput.putWalls?.length || 0}`}`);

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
    
    // Ensure aiOptionsAnalysisRequestJson has a value even if flowInput wasn't fully prepared (though earlier checks should catch this)
    if (!aiOptionsAnalysisRequestJson!) {
        aiOptionsAnalysisRequestJson = JSON.stringify({ 
            error: "Flow input preparation failed prior to call", 
            ticker, 
            optionsChainJsonProvided: !!(optionsChainJson && optionsChainJson !== '{}'),
            stockSnapshotJsonProvided: !!(stockSnapshotJson && stockSnapshotJson !== '{}'),
        }, null, 2);
    }

    return baseErrorReturn(errorMessage, `Failed to generate AI options analysis for ${ticker}.`, aiOptionsAnalysisRequestJson);
  }
}

