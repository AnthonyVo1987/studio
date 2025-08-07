
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

interface PerformAiOptionsAnalysisActionInputs {
  ticker: string;
  optionsChainJson: string;
  stockSnapshotJson: string;
}

export async function performAiOptionsAnalysisAction(
  payload: PerformAiOptionsAnalysisActionInputs
): Promise<PerformAiOptionsAnalysisActionState> {
  const {
    ticker,
    optionsChainJson,
    stockSnapshotJson,
  } = payload;
  const actionLogPrefix = `[ServerAction:performAiOptionsAnalysisAction:Ticker:${ticker}]`;

  console.log(`${actionLogPrefix} Starting AI options analysis...`, {
    ticker,
    hasOptionsChain: !!optionsChainJson,
    hasStockSnapshot: !!stockSnapshotJson
  });

  let currentUnderlyingPrice: number;
  let flowInput: AiOptionsAnalysisInput;
  let aiOptionsAnalysisRequestJson: string = JSON.stringify({ error: "Request preparation incomplete", ticker }, null, 2);

  const baseErrorReturnForValidation = (errMsg: string, detailMsg?: string, reqJsonOverride?: string) => {
    return {
      status: 'error' as const,
      error: errMsg,
      message: detailMsg || errMsg,
      data: {
        aiOptionsAnalysisRequestJson: reqJsonOverride || aiOptionsAnalysisRequestJson,
        aiOptionsAnalysisJson: JSON.stringify({ error: errMsg, details: detailMsg }, null, 2),
      },
    };
  };

  try {
    console.log(`${actionLogPrefix} Validating input data...`);
    if (!ticker || !optionsChainJson || optionsChainJson === '{}' || !stockSnapshotJson || stockSnapshotJson === '{}') {
      console.error(`${actionLogPrefix} Validation error: Missing prerequisite data`);
      return baseErrorReturnForValidation('Ticker, Options Chain, or Snapshot JSON missing.', 'Prerequisite data not available.');
    }

    try {
      const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
      if (snapshot.currentPrice === null || snapshot.currentPrice === undefined) {
        throw new Error('Current price not found in stock snapshot.');
      }
      currentUnderlyingPrice = snapshot.currentPrice;
    } catch (e: any) {
      return baseErrorReturnForValidation(`Failed to get current price: ${e.message}`, 'Could not determine current price for analysis.');
    }

    flowInput = { ticker, optionsChainJson, currentUnderlyingPrice };
    aiOptionsAnalysisRequestJson = JSON.stringify(flowInput, null, 2);

    console.log(`${actionLogPrefix} Calling AI flow for options analysis...`);
    const flowOutput: AiOptionsAnalysisOutput = await analyzeOptionsChain(flowInput);
    console.log(`${actionLogPrefix} AI flow completed successfully`);
    
    const aiOptionsAnalysisJsonOutput = JSON.stringify(flowOutput, null, 2);

    console.log(`${actionLogPrefix} SUCCESS - AI options analysis completed`);
    return {
      status: 'success',
      data: { aiOptionsAnalysisRequestJson, aiOptionsAnalysisJson: aiOptionsAnalysisJsonOutput },
      message: `AI options analysis for ${ticker} generated successfully.`,
      error: null,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'An unknown error occurred.';
    console.error(`${actionLogPrefix} CATCH ERROR:`, errorMessage);
    return {
      status: 'error',
      error: errorMessage,
      message: `Failed to generate AI options analysis for ${ticker}.`,
      data: {
        aiOptionsAnalysisRequestJson,
        aiOptionsAnalysisJson: JSON.stringify({ error: errorMessage, details: String(error) }, null, 2),
      },
    };
  }
}
