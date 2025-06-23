
'use server';

import {
  augmentedOptionsSearch,
  type AugmentedOptionsSearchInput,
  type AugmentedOptionsSearchOutput,
} from '@/ai/flows/augmented-options-search-flow';

export interface AugmentedOptionsSearchResult {
  requestJson: string;
  responseJson: string;
}

export interface AugmentedOptionsSearchActionState {
  status: 'idle' | 'success' | 'error';
  data?: AugmentedOptionsSearchResult;
  error?: string | null;
  message?: string | null;
}

export async function augmentedOptionsSearchAction(
  prevState: AugmentedOptionsSearchActionState,
  payload: AugmentedOptionsSearchInput
): Promise<AugmentedOptionsSearchActionState> {
  const { ticker } = payload;
  const actionLogPrefix = `[ServerAction:augmentedOptionsSearchAction:Ticker:${ticker}]`;
  console.log(`${actionLogPrefix} Received request.`);

  const requestJson = JSON.stringify(payload, null, 2);

  try {
    const flowOutput: AugmentedOptionsSearchOutput = await augmentedOptionsSearch(payload);
    const responseJson = JSON.stringify(flowOutput, null, 2);
    console.log(`${actionLogPrefix} Flow succeeded. Output keys: ${Object.keys(flowOutput).join(', ')}`);

    return {
      status: 'success',
      data: { requestJson, responseJson },
      message: `Augmented options search for ${ticker} completed successfully.`,
      error: null,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} CRITICAL Error during flow. Error: ${error.message}`);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during augmented options search.',
      message: 'Failed to complete augmented options search.',
      data: {
        requestJson,
        responseJson: JSON.stringify({ error: error.message || 'Flow execution failed', details: String(error) }, null, 2),
      },
    };
  }
}
