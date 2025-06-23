
'use server';

import {
  formatWebSearchResults,
  type FormatWebSearchResultsInput,
  type FormatWebSearchResultsOutput,
} from '@/ai/flows/format-web-search-flow';

export interface FormatWebSearchResultsResult {
  formattedResponse: string;
}

export interface FormatWebSearchResultsActionState {
  status: 'idle' | 'success' | 'error';
  data?: FormatWebSearchResultsResult;
  error?: string | null;
  message?: string | null;
}

export type FormatWebSearchResultsActionInputs = FormatWebSearchResultsInput;

export async function formatWebSearchResultsAction(
  prevState: FormatWebSearchResultsActionState,
  payload: FormatWebSearchResultsActionInputs
): Promise<FormatWebSearchResultsActionState> {
  const { searchType } = payload;
  const actionLogPrefix = `[ServerAction:formatWebSearchResultsAction:Type:${searchType}]`;
  console.log(`${actionLogPrefix} Received request.`);

  try {
    const flowOutput: FormatWebSearchResultsOutput = await formatWebSearchResults(payload);
    console.log(`${actionLogPrefix} Flow succeeded. Response length: ${flowOutput.formattedResponse.length}`);

    return {
      status: 'success',
      data: { formattedResponse: flowOutput.formattedResponse },
      message: `Web search results formatted successfully for ${searchType}.`,
      error: null,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} CRITICAL Error during flow. Error: ${error.message}`);
    return {
      status: 'error',
      error: error.message || `An unknown error occurred during ${searchType} web search formatting.`,
      message: 'Failed to format web search results.',
      data: {
        formattedResponse: `**Error:** Failed to format web search results. Details: ${error.message || 'Unknown error'}`
      },
    };
  }
}
