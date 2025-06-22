
'use server';

import {
  augmentedTaSearch,
  type AugmentedTaSearchInput,
  type AugmentedTaSearchOutput,
} from '@/ai/flows/augmented-ta-search-flow';

export interface AugmentedTaSearchResult {
  augmentedTaSearchJson: string;
}

export interface AugmentedTaSearchActionState {
  status: 'idle' | 'success' | 'error';
  data?: AugmentedTaSearchResult;
  error?: string | null;
  message?: string | null;
}

interface AugmentedTaSearchActionInputs {
  ticker: string;
}

export async function augmentedTaSearchAction(
  prevState: AugmentedTaSearchActionState,
  payload: AugmentedTaSearchActionInputs
): Promise<AugmentedTaSearchActionState> {
  const { ticker } = payload;
  const actionLogPrefix = `[ServerAction:augmentedTaSearchAction:Ticker:${ticker}]`;
  console.log(`${actionLogPrefix} Action received request.`);

  if (!ticker) {
    const errorMsg = 'Ticker is required for augmented TA search.';
    console.error(`${actionLogPrefix} Validation Error: ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Invalid ticker provided for search.',
      data: {
        augmentedTaSearchJson: JSON.stringify({ error: errorMsg }, null, 2),
      },
    };
  }

  const flowInput: AugmentedTaSearchInput = { ticker };
  console.log(`${actionLogPrefix} Calling augmentedTaSearch flow.`);

  try {
    const flowOutput: AugmentedTaSearchOutput = await augmentedTaSearch(flowInput);
    const augmentedTaSearchJson = JSON.stringify(flowOutput, null, 2);
    console.log(`${actionLogPrefix} Flow succeeded. ATR-14 found: ${flowOutput.atr14}`);

    return {
      status: 'success',
      data: {
        augmentedTaSearchJson,
      },
      message: `Augmented TA search for ${ticker} completed.`,
      error: null,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'An unknown error occurred during augmented TA search.';
    console.error(`${actionLogPrefix} Flow failed. Error: ${errorMessage}`);
    return {
      status: 'error',
      error: errorMessage,
      message: `Augmented TA search for ${ticker} failed.`,
      data: {
        augmentedTaSearchJson: JSON.stringify({ error: errorMessage, details: String(error) }, null, 2),
      },
    };
  }
}
