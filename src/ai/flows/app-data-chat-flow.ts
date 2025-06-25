
'use server';
/**
 * @fileOverview Implements a contextual chatbot flow for stock-related questions.
 * This flow is designed to be non-grounded, using only data provided in the
 * application context (stock snapshot, TAs, etc.)
 *
 * - chatWithBot - The main function for the chatbot flow.
 * - AppDataChatInput (from schemas) - The input type for the chatWithBot function.
 * - AppDataChatOutput (from schemas) - The return type for the chatWithBot function.
 */

import { ai } from '@/ai/genkit';
import {
  AppDataChatInputSchema,
  type AppDataChatInput,
  AppDataChatOutputSchema,
  type AppDataChatOutput,
} from '@/ai/schemas/app-data-chat-schemas';
import { DEFAULT_CHAT_MODEL_ID } from '@/ai/models';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';

// Caches for the prompt objects
const promptCache: Record<string, any> = {};

async function getChatPrompt(input: AppDataChatInput) {
  const definitionName = input.promptName || 'app-data-chatbot';
  const logPrefix = `[AIFlow:getChatPrompt:AppData:${definitionName}]`;

  if (promptCache[definitionName]) {
    console.log(`${logPrefix} Returning cached prompt object.`);
    return promptCache[definitionName];
  }

  const genericDefinition = await loadDefinition(definitionName);
  if (genericDefinition.definitionType !== 'llm-prompt') {
    const errorMsg = `Loaded definition for '${definitionName}' is not an LLM prompt type.`;
    console.error(`${logPrefix} ${errorMsg}`);
    throw new Error(errorMsg);
  }
  const promptDefinition = genericDefinition as LlmPromptDefinition;

  const promptString = buildPromptStringFromLlmDefinition(promptDefinition);
  const modelId = promptDefinition.modelId || DEFAULT_CHAT_MODEL_ID;
  const safetySettings = promptDefinition.safetySettings;

  const promptConfig: any = { safetySettings };
  if (promptDefinition.thinkingBudget !== undefined) {
    promptConfig.thinkingConfig = { thinkingBudget: promptDefinition.thinkingBudget };
  }

  const promptOptions: any = {
    name: promptDefinition.promptName,
    input: { schema: AppDataChatInputSchema },
    model: modelId,
    prompt: promptString,
    config: promptConfig,
    output: { schema: AppDataChatOutputSchema },
  };

  console.log(
    `${logPrefix} Defining prompt. Model: ${modelId}, Grounding: false, ThinkingBudget: ${promptConfig.thinkingConfig?.thinkingBudget ?? 'N/A'}`
  );

  const prompt = ai.definePrompt(promptOptions);
  
  promptCache[definitionName] = prompt;
  return prompt;
}

export async function chatWithBot(input: AppDataChatInput): Promise<AppDataChatOutput> {
  const logPrefix = `[AIFlow:chatWithBot:AppData:Ticker:${input.ticker}:Entry]`;
  console.log(`${logPrefix} Received request. User input (first 50): "${input.userInput.substring(0, 50)}..."`);
  console.time('appDataChatFlowExecutionTime');
  try {
    const result = await appDataChatFlow(input);
    console.timeEnd('appDataChatFlowExecutionTime');
    return result;
  } catch (error) {
    console.timeEnd('appDataChatFlowExecutionTime');
    throw error;
  }
}

const appDataChatFlow = ai.defineFlow(
  {
    name: 'appDataChatFlow',
    inputSchema: AppDataChatInputSchema,
    outputSchema: AppDataChatOutputSchema,
  },
  async (input: AppDataChatInput): Promise<AppDataChatOutput> => {
    const logPrefix = `[AIFlow:appDataChatFlow:Ticker:${input.ticker || 'N/A'}]`;
    console.log(`${logPrefix} Flow execution started. PromptName: ${input.promptName || 'app-data-chatbot'}.`);

    try {
      const promptToUse = await getChatPrompt(input);
      const result = await promptToUse(input);
      
      console.log(`${logPrefix} [Tokens] Thoughts: ${result.usageMetadata?.thoughtsTokenCount ?? 'N/A'}, Output: ${result.usageMetadata?.candidatesTokenCount ?? 'N/A'}`);

      const responseText = result.output?.response;

      if (!responseText || typeof responseText !== 'string' || responseText.trim() === '') {
        throw new Error('Chatbot AI prompt returned a malformed or empty response.');
      }
      
      console.log(`${logPrefix} Flow successfully executed. Final response (first 50 chars): "${responseText.substring(0, 50)}..."`);
      return { response: responseText, rawResponse: result };

    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL ERROR during prompt execution. Error: ${error.message}`);
      throw error;
    }
  }
);
