
'use server';

import {
  generateFullAnalysisSummary,
  type GenerateFullAnalysisSummaryInput,
  type GenerateFullAnalysisSummaryOutput,
} from '@/ai/flows/generate-full-analysis-summary-flow';

export interface GenerateChatSummaryResult {
  requestJson: string; // Stringified GenerateFullAnalysisSummaryInput
  summaryText: string; // The actual summary
}

export interface GenerateChatSummaryActionState {
  status: 'idle' | 'success' | 'error';
  data?: GenerateChatSummaryResult;
  error?: string | null;
  message?: string | null;
}

// Input directly matches GenerateFullAnalysisSummaryInput
export type GenerateChatSummaryActionInputs = GenerateFullAnalysisSummaryInput;

export async function generateChatSummaryAction(
  prevState: GenerateChatSummaryActionState,
  payload: GenerateChatSummaryActionInputs
): Promise<GenerateChatSummaryActionState> {
  const { ticker } = payload;
  console.log(`[ServerAction:generateChatSummaryAction] Request for ticker: ${ticker}`);

  const requestJson = JSON.stringify(payload, null, 2);
  console.log(`[ServerAction:generateChatSummaryAction] Calling generateFullAnalysisSummary flow for ${ticker}. Input snapshot (first 100): ${payload.stockSnapshotJson.substring(0,100)}...`);

  try {
    const flowOutput: GenerateFullAnalysisSummaryOutput = await generateFullAnalysisSummary(payload);
    
    if (!flowOutput.summaryText) {
        console.error(`[ServerAction:generateChatSummaryAction] Flow for ${ticker} returned empty summaryText.`);
        return {
            status: 'error',
            error: 'Flow returned an empty summary.',
            message: `AI failed to generate a summary for ${ticker}.`,
            data: { requestJson, summaryText: '' },
        };
    }
    
    console.log(`[ServerAction:generateChatSummaryAction] generateFullAnalysisSummary flow succeeded for ${ticker}. Summary preview: ${flowOutput.summaryText.substring(0,100)}...`);

    return {
      status: 'success',
      data: {
        requestJson,
        summaryText: flowOutput.summaryText,
      },
      message: `Chat summary for ${ticker} generated successfully.`,
      error: null,
    };
  } catch (error: any) {
    console.error(`[ServerAction:generateChatSummaryAction] CRITICAL Error for ${ticker}:`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during chat summary generation.',
      message: `Failed to generate chat summary for ${ticker}.`,
      data: { 
        requestJson,
        summaryText: `Error generating summary: ${error.message || 'Unknown flow error'}` 
      },
    };
  }
}
