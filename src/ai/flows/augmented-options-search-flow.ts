
'use server';
/**
 * @fileOverview An AI flow that uses Google Search to find advanced options metrics for a stock.
 *
 * - augmentedOptionsSearch - A function that handles the augmented options search process.
 * - AugmentedOptionsSearchInput - The input type for the augmentedOptionsSearch function.
 * - AugmentedOptionsSearchOutput - The return type for the augmentedOptionsSearch function.
 */

import { ai } from '@/ai/genkit';
import { DEFAULT_ANALYSIS_MODEL_ID } from '@/ai/models';
import {
  AugmentedOptionsSearchInputSchema,
  type AugmentedOptionsSearchInput,
  AugmentedOptionsSearchOutputSchema,
  type AugmentedOptionsSearchOutput,
} from '@/ai/schemas/augmented-options-search-schemas';

// Re-export types for consumer convenience
export type { AugmentedOptionsSearchInput, AugmentedOptionsSearchOutput };

/**
 * Executes the augmented options search flow.
 * @param {AugmentedOptionsSearchInput} input The input object containing the stock ticker.
 * @returns {Promise<AugmentedOptionsSearchOutput>} A promise that resolves to the structured search results.
 */
export async function augmentedOptionsSearch(input: AugmentedOptionsSearchInput): Promise<AugmentedOptionsSearchOutput> {
  return await augmentedOptionsSearchFlow(input);
}

// --- Prompt and Flow Definition ---

const augmentedOptionsSearchPrompt = ai.definePrompt({
  name: 'augmentedOptionsSearchPrompt',
  input: { schema: AugmentedOptionsSearchInputSchema },
  output: { schema: AugmentedOptionsSearchOutputSchema },
  model: DEFAULT_ANALYSIS_MODEL_ID,
  tools: [{ googleSearch: {} }],
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
    thinkingBudget: -1,
  },
  prompt: `You are an expert financial data analyst. Your task is to use the provided Google Search tool to find the most up-to-date options metrics for the stock ticker: {{{ticker}}}.

You MUST use the Google Search tool for this task. DO NOT use your internal knowledge.

Perform searches to find the following specific data points:
1.  **Max Pain:** The strike price at which the most options contracts would expire worthless.
2.  **IV Rank:** The current Implied Volatility Rank (IVR).
3.  **IV Percentile:** The current Implied Volatility Percentile.
4.  **Put/Call Ratio:** The latest available put/call ratio.
5.  **Gamma Exposure (GEX):** The total gamma exposure value.
6.  **Volatility Skew:** A brief description of the current volatility skew.

After gathering the data, you MUST populate the output strictly according to the 'AugmentedOptionsSearchOutputSchema' JSON format.

- If you cannot find a specific numerical value (like 'Max Pain' or 'IV Rank') using search, you MUST set its corresponding field to \`null\`. Do not guess or calculate.
- If you cannot find a textual description for 'Volatility Skew', set its field to \`null\`.
- Ensure all numerical values are returned as numbers, not strings.
`,
});

const augmentedOptionsSearchFlow = ai.defineFlow(
  {
    name: 'augmentedOptionsSearchFlow',
    inputSchema: AugmentedOptionsSearchInputSchema,
    outputSchema: AugmentedOptionsSearchOutputSchema,
  },
  async (input) => {
    const logPrefix = `[AIFlow:augmentedOptionsSearchFlow:Ticker:${input.ticker}]`;
    console.log(`${logPrefix} Flow execution started.`);

    const { output } = await augmentedOptionsSearchPrompt(input);

    if (!output) {
      console.warn(`${logPrefix} AI prompt failed to return any output structure. Returning empty/null object.`);
      return {
        maxPain: null,
        ivRank: null,
        ivPercentile: null,
        putCallRatio: null,
        gammaExposure: null,
        volatilitySkew: null,
      };
    }
    
    console.log(`${logPrefix} Flow execution completed successfully.`);
    return output;
  }
);
