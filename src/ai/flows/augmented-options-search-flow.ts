
'use server';
/**
 * @fileOverview An AI flow that uses Google Search to find advanced options metrics for a stock.
 * This flow uses the "Grounding with Google Search" pattern to ensure reliable tool use.
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
import { extractJsonString } from '@/lib/string-utils';

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

let augmentedOptionsSearchPrompt: any = null;

async function getAugmentedOptionsSearchPrompt() {
    const logPrefix = '[AIFlow:getAugmentedOptionsSearchPrompt]';
    if (augmentedOptionsSearchPrompt) {
        return augmentedOptionsSearchPrompt;
    }

    const modelId = DEFAULT_ANALYSIS_MODEL_ID;
    const tools = [{ googleSearch: {} }];
    const safetySettings = [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ];
    const promptText = `You are a financial data analyst specializing in options flow data. Your task is to use the provided Google Search tool to find the most up-to-date options metrics for the stock ticker: {{{ticker}}}.

You MUST use the Google Search tool for this task. DO NOT use your internal knowledge.

You MUST search for the following information:
1.  **Max Pain:** The strike price at which the maximum number of options (both calls and puts) would expire worthless.
2.  **Put/Call Ratio (Total):** The ratio of the total put options traded versus call options.
3.  **Gamma Exposure (GEX):** A general measure of market maker gamma exposure.
4.  **IV Rank (Implied Volatility Rank):** The current IV level compared to its 52-week high and low.

After gathering the data, you MUST format your ENTIRE response as a single, valid JSON string that conforms to the 'AugmentedOptionsSearchOutputSchema'.

- Your entire response MUST start with \`{\` and end with \`}\`. Do not include any text, notes, or explanations outside of the JSON structure.
- If you cannot find a specific numerical value using search, you MUST set its corresponding field to \`null\` in the JSON. Do not guess or make up values.
- Prioritize data from reputable financial websites (e.g., a source that aggregates options data).
- Ensure all numerical values are returned as numbers, not strings.
`;

    console.log(
        `${logPrefix} Defining prompt. ` +
        `Model: ${modelId}, ` +
        `Grounding: ${!!tools?.length}, ` +
        `ThinkingBudget: N/A, ` + // thinkingBudget not used with tools
        `SafetySettings: ${safetySettings.length}`
    );

    const prompt = ai.definePrompt({
        name: 'augmentedOptionsSearchGroundedPrompt',
        input: { schema: AugmentedOptionsSearchInputSchema },
        model: modelId,
        tools: tools,
        config: { safetySettings },
        prompt: promptText,
    });
    
    augmentedOptionsSearchPrompt = prompt;
    return augmentedOptionsSearchPrompt;
}

const augmentedOptionsSearchFlow = ai.defineFlow(
  {
    name: 'augmentedOptionsSearchFlow',
    inputSchema: AugmentedOptionsSearchInputSchema,
  },
  async (input): Promise<AugmentedOptionsSearchOutput> => {
    const logPrefix = `[AIFlow:augmentedOptionsSearchFlow:Ticker:${input.ticker}]`;
    console.log(`${logPrefix} Flow execution started using Grounding pattern.`);
    
    const promptToUse = await getAugmentedOptionsSearchPrompt();
    const result = await promptToUse(input);
    const rawTextResponse = result.text;
    
    if (!rawTextResponse) {
      console.warn(`${logPrefix} AI prompt failed to return any text response. Returning empty/null object.`);
      throw new Error('Augmented options search AI did not return a response.');
    }

    try {
        const jsonString = extractJsonString(rawTextResponse);
        if (!jsonString) {
            throw new Error('No valid JSON block found in the AI response for augmented options search.');
        }
        const parsedOutput = JSON.parse(jsonString);
        const validatedOutput = AugmentedOptionsSearchOutputSchema.parse(parsedOutput);
        console.log(`${logPrefix} Flow execution completed and response parsed successfully.`);
        return validatedOutput;
    } catch (error: any) {
        console.error(`${logPrefix} Failed to parse JSON from AI response. Error: ${error.message}. Raw Response: "${rawTextResponse}"`);
        throw new Error(`Failed to parse structured data from augmented options search: ${error.message}`);
    }
  }
);
