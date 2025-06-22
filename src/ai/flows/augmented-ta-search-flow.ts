'use server';
/**
 * @fileOverview An AI flow that uses Google Search to find additional technical analysis indicators for a stock.
 *
 * - augmentedTaSearch - A function that handles the augmented TA search process.
 * - AugmentedTaSearchInput - The input type for the augmentedTaSearch function.
 * - AugmentedTaSearchOutput - The return type for the augmentedTaSearch function.
 */

import { ai } from '@/ai/genkit';
import { DEFAULT_ANALYSIS_MODEL_ID } from '@/ai/models';
import {
  AugmentedTaSearchInputSchema,
  type AugmentedTaSearchInput,
  AugmentedTaSearchOutputSchema,
  type AugmentedTaSearchOutput,
} from '@/ai/schemas/augmented-ta-search-schemas';

// Re-export types for consumer convenience
export type { AugmentedTaSearchInput, AugmentedTaSearchOutput };

/**
 * Executes the augmented TA search flow.
 * @param {AugmentedTaSearchInput} input The input object containing the stock ticker.
 * @returns {Promise<AugmentedTaSearchOutput>} A promise that resolves to the structured search results.
 */
export async function augmentedTaSearch(input: AugmentedTaSearchInput): Promise<AugmentedTaSearchOutput> {
  return await augmentedTaSearchFlow(input);
}

// --- Prompt and Flow Definition ---

const augmentedTaSearchPrompt = ai.definePrompt({
  name: 'augmentedTaSearchPrompt',
  input: { schema: AugmentedTaSearchInputSchema },
  output: { schema: AugmentedTaSearchOutputSchema },
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
  prompt: `You are a financial data analyst. Your task is to use the provided Google Search tool to find the most up-to-date technical analysis indicators for the stock ticker: {{{ticker}}}.

You MUST use the Google Search tool for this task. DO NOT use your internal knowledge. Be diligent and perform multiple searches if necessary to find each piece of data.

You MUST search for the following information:
1.  **ATR (14-day):** Find the 14-day Average True Range.
2.  **Support Levels:** Identify up to three key, recent support price levels.
3.  **Resistance Levels:** Identify up to three key, recent resistance price levels.
4.  **Bollinger Bands (20, 2):** Find the current Upper Band, Middle Band (20-day SMA), and Lower Band values.
5.  **Fibonacci Retracement:** Find the key Fibonacci retracement levels (23.6%, 38.2%, 50.0%, 6.18%, 7.86%).

After gathering the data via search, you MUST populate the output strictly according to the 'AugmentedTaSearchOutputSchema' JSON format.

- If you cannot find a specific numerical value (like ATR) using search, you MUST set its corresponding field to \`null\`. Do not guess or make up values.
- If you cannot find any values for a group (like support levels), you MUST return an empty array \`[]\`.
- If you cannot find the complete set of values for a complex object (like Bollinger Bands or Fibonacci levels), you MUST set the entire object to \`null\`. Do not return a partial object.
- Prioritize data from reputable financial websites (e.g., TradingView, Yahoo Finance, Barchart).
- Ensure all numerical values are returned as numbers, not strings.
`,
});

const augmentedTaSearchFlow = ai.defineFlow(
  {
    name: 'augmentedTaSearchFlow',
    inputSchema: AugmentedTaSearchInputSchema,
    outputSchema: AugmentedTaSearchOutputSchema,
  },
  async (input) => {
    const logPrefix = `[AIFlow:augmentedTaSearchFlow:Ticker:${input.ticker}]`;
    console.log(`${logPrefix} Flow execution started.`);

    const { output } = await augmentedTaSearchPrompt(input);

    if (!output) {
      console.warn(`${logPrefix} AI prompt failed to return any output structure. Returning empty/null object.`);
      return {
        atr14: null,
        supportLevels: [],
        resistanceLevels: [],
        bollingerBands: null,
        fibonacciRetracement: null,
      };
    }
    
    console.log(`${logPrefix} Flow execution completed successfully.`);
    return output;
  }
);
