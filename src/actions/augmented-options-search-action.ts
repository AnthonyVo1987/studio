
'use server';

import {
  augmentedOptionsSearch,
  type AugmentedOptionsSearchInput,
  type AugmentedOptionsSearchOutput,
} from '@/ai/flows/augmented-options-search-flow';

export interface AugmentedOptionsSearchResult {
  augmentedOptionsSearchJson: string;
}

export interface AugmentedOptionsSearchActionState {
  status: 'idle' | 'success' | 'error';
  data?: AugmentedOptionsSearchResult;
  error?: string | null;
  message?: string | null;
}

interface AugmentedOptionsSearchActionInputs {
  ticker: string;
}

export async function augmentedOptionsSearchAction(
  prevState: AugmentedOptionsSearchActionState,
  payload: AugmentedOptionsSearchActionInputs
): Promise<AugmentedOptionsSearchActionState> {
  const { ticker } = payload;
  const actionLogPrefix = `[ServerAction:augmentedOptionsSearchAction:Ticker:${ticker}]`;
  console.log(`${actionLogPrefix} Action received request.`);

  if (!ticker) {
    const errorMsg = 'Ticker is required for augmented options search.';
    console.error(`${actionLogPrefix} Validation Error: ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Invalid ticker provided for search.',
      data: {
        augmentedOptionsSearchJson: JSON.stringify({ error: errorMsg }, null, 2),
      },
    };
  }

  const flowInput: AugmentedOptionsSearchInput = { ticker };
  console.log(`${actionLogPrefix} Calling augmentedOptionsSearch flow.`);

  try {
    const flowOutput: AugmentedOptionsSearchOutput = await augmentedOptionsSearch(flowInput);
    const augmentedOptionsSearchJson = JSON.stringify(flowOutput, null, 2);
    console.log(`${actionLogPrefix} Flow succeeded. Max Pain found: ${flowOutput.maxPain}`);

    return {
      status: 'success',
      data: {
        augmentedOptionsSearchJson,
      },
      message: `Augmented options search for ${ticker} completed.`,
      error: null,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'An unknown error occurred during augmented options search.';
    console.error(`${actionLogPrefix} Flow failed. Error: ${errorMessage}`);
    return {
      status: 'error',
      error: errorMessage,
      message: `Augmented options search for ${ticker} failed.`,
      data: {
        augmentedOptionsSearchJson: JSON.stringify({ error: errorMessage, details: String(error) }, null, 2),
      },
    };
  }
}
