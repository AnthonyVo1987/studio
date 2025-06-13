
'use server';
/**
 * @fileOverview An AI agent that generates a textual summary of a full stock analysis.
 * This summary is intended to be used as an initial message in a chat.
 *
 * - generateFullAnalysisSummary - Function to trigger the summary generation flow.
 * - GenerateFullAnalysisSummaryInput (from schemas) - Input type.
 * - GenerateFullAnalysisSummaryOutput (from schemas) - Output type.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateFullAnalysisSummaryInputSchema,
  type GenerateFullAnalysisSummaryInput,
  GenerateFullAnalysisSummaryOutputSchema,
  type GenerateFullAnalysisSummaryOutput,
} from '@/ai/schemas/chat-summary-schemas';
import {DEFAULT_CHAT_MODEL_ID} from '@/ai/models'; // Use chat model for conversational summary

export async function generateFullAnalysisSummary(
  input: GenerateFullAnalysisSummaryInput
): Promise<GenerateFullAnalysisSummaryOutput> {
  console.log('[AIFlow:generateFullAnalysisSummary] Received input for ticker:', input.ticker);
  return generateFullAnalysisSummaryFlow(input);
}

const generateFullAnalysisSummaryPrompt = ai.definePrompt({
  name: 'generateFullAnalysisSummaryPrompt',
  input: {schema: GenerateFullAnalysisSummaryInputSchema},
  output: {schema: GenerateFullAnalysisSummaryOutputSchema},
  model: DEFAULT_CHAT_MODEL_ID,
  prompt: `You are StockSage, an expert financial analyst AI. Your task is to provide a concise, engaging summary of the full stock analysis performed for {{{ticker}}}. This summary will be the first message in a chat conversation with the user, inviting them to ask follow-up questions.

Here's the data you have access to:
1.  **Stock Snapshot:** {{{stockSnapshotJson}}} (Current & previous day prices, volume)
2.  **Standard Technical Indicators:** {{{standardTasJson}}} (RSI, MACD, VWAP, EMAs, SMAs)
3.  **AI Analyzed Technical Analysis (Pivot Points):** {{{aiAnalyzedTaJson}}}
4.  **AI Key Takeaways:** {{{aiKeyTakeawaysJson}}} (5 takeaways on Price Action, Trend, Volatility, Momentum, Patterns)
5.  **AI Options Analysis:** {{{aiOptionsAnalysisJson}}} (Call/Put Walls, OI Clusters)
6.  **Market Status:** {{{marketStatusJson}}}

**IMPORTANT:** Some analysis parts (AI Analyzed TA, Key Takeaways, Options Analysis) might have been skipped or resulted in an error. Their JSON strings might contain \`{"status": "skipped_..."}\` or \`{"status": "error", ...}\`.
*   If a section was skipped or errored, **gracefully acknowledge this** in your summary. For example: "AI-driven pivot point analysis was not available for this summary." or "Key Takeaways could not be generated due to a previous issue."
*   **DO NOT** attempt to invent data or analysis for these missing parts. Focus on what *is* available.

**Output Requirements:**
*   Provide a holistic overview. Start with a key observation if possible.
*   Mention significant findings from each available data section.
*   Keep the summary relatively brief (e.g., 3-5 paragraphs).
*   Use Markdown for formatting (bolding, bullet points if helpful).
*   Maintain a professional yet approachable tone.
*   End with an invitation for the user to ask more specific questions.

Example of acknowledging missing data:
"While the full AI options analysis was not completed for this stock, the available snapshot data shows..."

Generate the summaryText.
`,
  config: {
    safetySettings: [
      {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH'},
    ],
  },
});

const generateFullAnalysisSummaryFlow = ai.defineFlow(
  {
    name: 'generateFullAnalysisSummaryFlow',
    inputSchema: GenerateFullAnalysisSummaryInputSchema,
    outputSchema: GenerateFullAnalysisSummaryOutputSchema,
  },
  async (input: GenerateFullAnalysisSummaryInput): Promise<GenerateFullAnalysisSummaryOutput> => {
    const {output} = await generateFullAnalysisSummaryPrompt(input);
    if (!output || !output.summaryText) {
      console.error('[AIFlow:generateFullAnalysisSummaryFlow] AI summary generation flow did not return a valid summaryText.');
      return {
        summaryText: 'I was unable to generate a summary for this stock at the moment. Please try again later or ask a specific question.'
      };
    }
    console.log('[AIFlow:generateFullAnalysisSummaryFlow] Summary generation complete for ticker:', input.ticker);
    return output;
  }
);
