
'use server';

import {
  augmentedTaSearch,
  type AugmentedTaSearchInput,
  type AugmentedTaSearchOutput,
} from '@/ai/flows/augmented-ta-search-flow';

export interface AugmentedTaSearchResult {
  requestJson: string;
  responseJson: string;
}

export interface AugmentedTaSearchActionState {
  status: 'idle' | 'success' | 'error';
  data?: AugmentedTaSearchResult;
  error?: string | null;
  message?: string | null;
}

export async function augmentedTaSearchAction(
  prevState: AugmentedTaSearchActionState,
  payload: AugmentedTaSearchInput
): Promise<AugmentedTaSearchActionState> {
  const { ticker } = payload;
  const actionLogPrefix = `[ServerAction:augmentedTaSearchAction:Ticker:${ticker}]`;
  console.log(`${actionLogPrefix} Received request.`);

  const requestJson = JSON.stringify(payload, null, 2);

  try {
    const flowOutput: AugmentedTaSearchOutput = await augmentedTaSearch(payload);
    const responseJson = JSON.stringify(flowOutput, null, 2);
    console.log(`${actionLogPrefix} Flow succeeded. Output keys: ${Object.keys(flowOutput).join(', ')}`);

    return {
      status: 'success',
      data: { requestJson, responseJson },
      message: `Augmented TA search for ${ticker} completed successfully.`,
      error: null,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} CRITICAL Error during flow. Error: ${error.message}`);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during augmented TA search.',
      message: 'Failed to complete augmented TA search.',
      data: {
        requestJson,
        responseJson: JSON.stringify({ error: error.message || 'Flow execution failed', details: String(error) }, null, 2),
      },
    };
  }
}
