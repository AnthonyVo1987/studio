'use server';
/**
 * @fileOverview An AI flow that uses Google Search to find additional technical analysis indicators for a stock.
 *
 * - augmentedTaSearch - A function that handles the augmented TA search process.
 * - AugmentedTaSearchInput - The input type for the augmentedTaSearch function.
 * - AugmentedTaSearchOutput - The return type for the augmentedTaSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DEFAULT_ANALYSIS_MODEL_ID } from '@/ai/models';

// --- Zod Schemas for Input and Output ---

export const AugmentedTaSearchInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol to search for, e.g., "NVDA".'),
});
export type AugmentedTaSearchInput = z.infer<typeof AugmentedTaSearchInputSchema>;

export const AugmentedTaSearchOutputSchema = z.object({
  atr14: z.number().nullable().describe('The 14-day Average True Range (ATR). Null if not found.'),
  supportLevels: z.array(z.number()).max(3).describe('Up to three key support price levels. Empty array if none found.'),
  resistanceLevels: z.array(z.number()).max(3).describe('Up to three key resistance price levels. Empty array if none found.'),
  bollingerBands: z.object({
    upper: z.number().describe('The upper Bollinger Band value.'),
    middle: z.number().describe('The middle Bollinger Band value (typically a 20-period SMA).'),
    lower: z.number().describe('The lower Bollinger Band value.'),
  }).nullable().describe('The Bollinger Bands values. Null if not found.'),
  fibonacciRetracement: z.object({
    '0.236': z.number().describe('The 23.6% Fibonacci retracement level.'),
    '0.382': z.number().describe('The 38.2% Fibonacci retracement level.'),
    '0.500': z.number().describe('The 50.0% Fibonacci retracement level.'),
    '0.618': z.number().describe('The 61.8% Fibonacci retracement level.'),
    '0.786': z.number().describe('The 78.6% Fibonacci retracement level.'),
  }).nullable().describe('Key Fibonacci retracement levels. Null if the entire set cannot be determined.'),
});
export type AugmentedTaSearchOutput = z.infer<typeof AugmentedTaSearchOutputSchema>;

// --- Exported Main Function ---

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

You MUST use the Google Search tool to find the following information. Be diligent and perform multiple searches if necessary to find each piece of data.

1.  **ATR (14-day):** Find the 14-day Average True Range.
2.  **Support Levels:** Identify up to three key, recent support price levels.
3.  **Resistance Levels:** Identify up to three key, recent resistance price levels.
4.  **Bollinger Bands (20, 2):** Find the current Upper Band, Middle Band (20-day SMA), and Lower Band values.
5.  **Fibonacci Retracement:** Find the key Fibonacci retracement levels (23.6%, 38.2%, 50.0%, 61.8%, 78.6%).

After gathering the data, you MUST populate the output strictly according to the 'AugmentedTaSearchOutputSchema' JSON format.

- If you cannot find a specific numerical value (like ATR), set its corresponding field to \`null\`.
- If you cannot find any values for a group (like support levels), return an empty array \`[]\`.
- If you cannot find the complete set of values for a complex object (like Bollinger Bands or Fibonacci levels), set the entire object to \`null\`. Do not return a partial object.
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
