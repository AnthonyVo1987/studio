
'use server';
/**
 * @fileOverview Implements a grounded chatbot flow for web search queries.
 * This flow is designed to ALWAYS use the Google Search tool.
 *
 * - webSearchChat - The main function for the grounded chatbot flow.
 * - WebSearchChatInput (from schemas) - The input type.
 * - WebSearchChatOutput (from schemas) - The return type.
 */

import { ai } from '@/ai/genkit';
import {
  WebSearchChatInputSchema,
  type WebSearchChatInput,
  WebSearchChatOutputSchema,
  type WebSearchChatOutput,
} from '@/ai/schemas/web-search-chat-schemas';
import { DEFAULT_CHAT_MODEL_ID } from '@/ai/models';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';
import { AugmentedTaSearchOutputSchema } from '../schemas/augmented-ta-search-schemas';
import { AugmentedOptionsSearchOutputSchema } from '../schemas/augmented-options-search-schemas';
import { z } from 'zod';
import { extractJsonString } from '@/lib/string-utils';

const promptCache: Record<string, any> = {};

// Defines a mapping from prompt name to the Zod schema used for JSON extraction.
const jsonPromptSchemaMap: Record<string, z.ZodTypeAny> = {
  'technical-analysis-web-search': AugmentedTaSearchOutputSchema,
  'options-flow-web-search': AugmentedOptionsSearchOutputSchema,
};

async function getWebSearchChatPrompt(input: WebSearchChatInput) {
  const definitionName = input.promptName || 'web-search-chatbot';
  const logPrefix = `[AIFlow:getWebSearchChatPrompt:Grounded:${definitionName}]`;

  if (promptCache[definitionName]) {
    console.log(`${logPrefix} Returning cached prompt object.`);
    return promptCache[definitionName];
  }

  const genericDefinition = await loadDefinition(definitionName);
  if (genericDefinition.definitionType !== 'llm-prompt') {
    throw new Error(`Loaded definition for '${definitionName}' is not an LLM prompt type.`);
  }
  const promptDefinition = genericDefinition as LlmPromptDefinition;

  const promptString = buildPromptStringFromLlmDefinition(promptDefinition);
  const modelId = promptDefinition.modelId || DEFAULT_CHAT_MODEL_ID;

  // ARCHITECTURAL FIX: A grounded prompt with tools CANNOT have an `output` schema.
  // This was the root cause of the `Unable to determine type of tool` error.
  const promptOptions: any = {
    name: promptDefinition.promptName,
    input: { schema: WebSearchChatInputSchema },
    model: modelId,
    prompt: promptString,
    tools: [{ googleSearch: {} }], // Always use Google Search for this flow
    config: {
      safetySettings: promptDefinition.safetySettings,
      thinkingConfig: promptDefinition.thinkingBudget !== undefined ? { thinkingBudget: promptDefinition.thinkingBudget } : undefined,
    },
  };
  
  console.log(
    `${logPrefix} Defining prompt. Model: ${modelId}, Grounding: true, ThinkingBudget: ${promptOptions.config.thinkingConfig?.thinkingBudget ?? 'N/A'}`
  );

  const prompt = ai.definePrompt(promptOptions);
  promptCache[definitionName] = prompt;
  return prompt;
}

export async function webSearchChat(input: WebSearchChatInput): Promise<WebSearchChatOutput> {
  const logPrefix = `[AIFlow:webSearchChat:Grounded:Ticker:${input.ticker}:Entry]`;
  console.log(`${logPrefix} Received request. User input (first 50): "${input.userInput.substring(0, 50)}..."`);
  console.time('webSearchChatFlowExecutionTime');
  try {
    const result = await webSearchChatFlow(input);
    console.timeEnd('webSearchChatFlowExecutionTime');
    return result;
  } catch (error) {
    console.timeEnd('webSearchChatFlowExecutionTime');
    throw error;
  }
}

function formatJsonResponseToMarkdown(jsonResponse: any, promptName: string, ticker?: string): string {
    if (promptName === 'technical-analysis-web-search') {
      const data = jsonResponse as z.infer<typeof AugmentedTaSearchOutputSchema>;
      let md = `**Web Search: Technical Analysis for ${ticker || 'Stock'}**\n\n`;
      md += `- **ATR-14:** ${data.averageTrueRange14 ?? 'Not found'}\n\n`;
      md += `- **Bollinger Bands:** Upper: ${data.bollingerBands?.upper ?? 'N/A'}, Middle: ${data.bollingerBands?.middle ?? 'N/A'}, Lower: ${data.bollingerBands?.lower ?? 'N/A'}\n\n`;
      md += `- **Fibonacci Levels:** ${data.fibonacciRetracement ? Object.entries(data.fibonacciRetracement).map(([key, value]) => `${key}: $${value}`).join(', ') : 'Not found'}`;
      return md;
    }
    if (promptName === 'options-flow-web-search') {
      const data = jsonResponse as z.infer<typeof AugmentedOptionsSearchOutputSchema>;
      let md = `**Web Search: Options Metrics for ${ticker || 'Stock'}**\n\n`;
      md += `- **Max Pain:** ${data.maxPain ?? 'Not found'}\n\n`;
      md += `- **Gamma Exposure (GEX):** ${data.gammaExposure ?? 'Not found'}\n\n`;
      md += `- **Put/Call Ratio:** ${data.putCallRatio ?? 'Not found'}\n\n`;
      md += `- **IV Skew:** ${data.ivSkew ?? 'Not found'}\n\n`;
      md += `- **IV Rank:** ${data.ivRank ?? 'Not found'}%\n\n`;
      md += `- **IV Percentile:** ${data.ivPercentile ?? 'Not found'}th\n\n`;
      return md;
    }
    return `\`\`\`json\n${JSON.stringify(jsonResponse, null, 2)}\n\`\`\``;
}


const webSearchChatFlow = ai.defineFlow(
  {
    name: 'webSearchChatFlow',
    inputSchema: WebSearchChatInputSchema,
    outputSchema: WebSearchChatOutputSchema,
  },
  async (input: WebSearchChatInput): Promise<WebSearchChatOutput> => {
    const logPrefix = `[AIFlow:webSearchChatFlow:Ticker:${input.ticker || 'N/A'}]`;
    console.log(`${logPrefix} Flow execution started. PromptName: ${input.promptName || 'web-search-chatbot'}.`);

    try {
      const promptToUse = await getWebSearchChatPrompt(input);
      const result = await promptToUse(input);
      
      console.log(`${logPrefix} [Tokens] Thoughts: ${result.usageMetadata?.thoughtsTokenCount ?? 'N/A'}, Output: ${result.usageMetadata?.candidatesTokenCount ?? 'N/A'}`);
      console.log(`${logPrefix} Grounded search metadata:`, JSON.stringify(result.usageMetadata?.grounding?.sources, null, 2));


      // ARCHITECTURAL FIX: A grounded prompt's response is ALWAYS in `result.text`.
      const rawTextResponse = result.text;
      if (!rawTextResponse || rawTextResponse.trim() === '') {
        throw new Error('Grounded AI prompt returned a malformed or empty text response.');
      }

      let responseText: string;
      const isJsonPrompt = !!jsonPromptSchemaMap[input.promptName || ''];

      if (isJsonPrompt) {
        // This is a "Grounded JSON-in-Text" prompt. We must parse the JSON from the text.
        const jsonString = extractJsonString(rawTextResponse);
        if (!jsonString) {
          console.error(`${logPrefix} Failed to extract JSON from text:`, rawTextResponse);
          throw new Error(`Could not extract a valid JSON block from the AI's text response for prompt '${input.promptName}'.`);
        }
        
        const jsonSchema = jsonPromptSchemaMap[input.promptName!];
        const parsedData = JSON.parse(jsonString);
        const validatedData = jsonSchema.parse(parsedData); // Zod validation

        responseText = formatJsonResponseToMarkdown(validatedData, input.promptName!, input.ticker);
      } else {
        // This is a standard conversational grounded prompt.
        responseText = rawTextResponse;
      }
      
      console.log(`${logPrefix} Flow successfully executed. Final response (first 50 chars): "${responseText.substring(0, 50)}..."`);
      return { response: responseText, rawResponse: result };

    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL ERROR during prompt execution. Error: ${error.message}`);
      throw error;
    }
  }
);
