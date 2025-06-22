
'use server';
/**
 * @fileOverview An AI flow that uses Google Search to find additional technical analysis indicators for a stock.
 * This flow uses the "Grounded with Google Search" pattern to ensure reliable tool use.
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
import { extractJsonString } from '@/lib/string-utils';

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

let augmentedTaSearchPrompt: any = null;

async function getAugmentedTaSearchPrompt() {
    const logPrefix = '[AIFlow:getAugmentedTaSearchPrompt]';
    if (augmentedTaSearchPrompt) {
        return augmentedTaSearchPrompt;
    }

    const modelId = DEFAULT_ANALYSIS_MODEL_ID;
    const tools = [{ googleSearch: {} }];
    const safetySettings = [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ];
    const promptText = `You are a financial data analyst. Your task is to use the provided Google Search tool to find the most up-to-date technical analysis indicators for the stock ticker: {{{ticker}}}.

You MUST use the Google Search tool for this task. DO NOT use your internal knowledge. Be diligent and perform multiple searches if necessary to find each piece of data.

You MUST search for the following information:
1.  **ATR (14-day):** Find the 14-day Average True Range.
2.  **Support Levels:** Identify up to three key, recent support price levels.
3.  **Resistance Levels:** Identify up to three key, recent resistance price levels.
4.  **Bollinger Bands (20, 2):** Find the current Upper Band, Middle Band (20-day SMA), and Lower Band values.
5.  **Fibonacci Retracement:** Find the key Fibonacci retracement levels (e.g., 23.6%, 38.2%, 50.0%, 61.8%).

After gathering the data, you MUST format your ENTIRE response as a single, valid JSON string that conforms to the 'AugmentedTaSearchOutputSchema'.

- Your entire response MUST start with \`{\` and end with \`}\`. Do not include any text, notes, or explanations outside of the JSON structure.
- If you cannot find a specific numerical value (like ATR) using search, you MUST set its corresponding field to \`null\` in the JSON. Do not guess or make up values.
- If you cannot find any values for a group (like support levels), you MUST return an empty array \`[]\` for that field in the JSON.
- If you cannot find the complete set of values for a complex object (like Bollinger Bands or Fibonacci levels), you MUST set the entire object to \`null\` in the JSON. Do not return a partial object.
- Prioritize data from reputable financial websites (e.g., TradingView, Yahoo Finance, Barchart).
- Ensure all numerical values are returned as numbers, not strings.
`;
    
    console.log(
        `${logPrefix} Defining prompt. ` +
        `Model: ${modelId}, ` +
        `Grounding: true, ` +
        `ThinkingBudget: N/A, ` +
        `SafetySettings: ${safetySettings.length}`
    );

    const prompt = ai.definePrompt({
        name: 'augmentedTaSearchGroundedPrompt',
        input: { schema: AugmentedTaSearchInputSchema },
        model: modelId,
        tools: tools,
        config: { safetySettings },
        prompt: promptText,
    });
    
    augmentedTaSearchPrompt = prompt;
    return augmentedTaSearchPrompt;
}

const augmentedTaSearchFlow = ai.defineFlow(
  {
    name: 'augmentedTaSearchFlow',
    inputSchema: AugmentedTaSearchInputSchema,
    outputSchema: AugmentedTaSearchOutputSchema,
  },
  async (input): Promise<AugmentedTaSearchOutput> => {
    const logPrefix = `[AIFlow:augmentedTaSearchFlow:Ticker:${input.ticker}]`;
    console.log(`${logPrefix} Flow execution started using Grounding pattern.`);
    
    const promptToUse = await getAugmentedTaSearchPrompt();
    const result = await promptToUse(input);
    const rawTextResponse = result.text;
    
    if (!rawTextResponse) {
      console.warn(`${logPrefix} AI prompt failed to return any text response. Returning empty/null object.`);
      throw new Error('Augmented TA search AI did not return a response.');
    }

    try {
        const jsonString = extractJsonString(rawTextResponse);
        if (!jsonString) {
            throw new Error('No valid JSON block found in the AI response.');
        }
        const parsedOutput = JSON.parse(jsonString);
        const validatedOutput = AugmentedTaSearchOutputSchema.parse(parsedOutput);
        console.log(`${logPrefix} Flow execution completed and response parsed successfully.`);
        return validatedOutput;
    } catch (error: any) {
        console.error(`${logPrefix} Failed to parse JSON from AI response. Error: ${error.message}. Raw Response: "${rawTextResponse}"`);
        throw new Error(`Failed to parse structured data from augmented TA search: ${error.message}`);
    }
  }
);
