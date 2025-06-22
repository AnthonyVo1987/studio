
'use server';
/**
 * @fileOverview Implements a contextual chatbot flow for stock-related questions.
 * This flow uses provided stock data, AI analysis, and chat history to respond to user queries.
 * Prompt definition is now loaded from a JSON file.
 * This flow now supports conditional grounding with Google Search.
 *
 * - chatWithBot - The main function for the chatbot flow.
 * - ChatInput (from schemas) - The input type for the chatWithBot function.
 * - ChatOutput (from schemas) - The return type for the chatWithBot function.
 */

import {ai} from '@/ai/genkit';
import {
  ChatInputSchema,
  type ChatInput,
  ChatOutputSchema,
  type ChatOutput,
} from '@/ai/schemas/chat-schemas';
import {DEFAULT_CHAT_MODEL_ID} from '@/ai/models';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';

// Caches for the prompt objects
let standardChatPrompt: any = null;
let groundedChatPrompt: any = null;

async function getChatPrompt(isGrounded: boolean) {
  const logPrefix = '[AIFlow:getChatPrompt]';
  const promptType: 'standard' | 'grounded' = isGrounded ? 'grounded' : 'standard';

  // Return cached prompt if available
  if (isGrounded && groundedChatPrompt) {
    console.log(`${logPrefix} Returning cached grounded prompt object.`);
    return groundedChatPrompt;
  }
  if (!isGrounded && standardChatPrompt) {
    console.log(`${logPrefix} Returning cached standard prompt object.`);
    return standardChatPrompt;
  }

  console.log(`${logPrefix} Defining prompt. Type: ${promptType}.`);
  const genericDefinition = await loadDefinition('stock-chatbot');
  if (genericDefinition.definitionType !== 'llm-prompt') {
    const errorMsg = `Loaded definition for 'stock-chatbot' is not an LLM prompt type. Type: ${genericDefinition.definitionType}`;
    console.error(`${logPrefix} ${errorMsg}`);
    throw new Error(errorMsg);
  }
  const stockChatBotPromptDefinition = genericDefinition;
  console.log(`${logPrefix} 'stock-chatbot' definition loaded and validated.`);

  const promptString = buildPromptStringFromLlmDefinition(stockChatBotPromptDefinition!);
  const modelId = stockChatBotPromptDefinition!.modelId || DEFAULT_CHAT_MODEL_ID;
  const safetySettings = stockChatBotPromptDefinition!.safetySettings || [
      {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH'},
  ];

  const promptConfig: {
    safetySettings: any[];
    thinkingConfig?: { thinkingBudget?: number };
    tools?: any[];
  } = {
    safetySettings: safetySettings,
  };

  if (stockChatBotPromptDefinition!.thinkingBudget !== undefined) {
    promptConfig.thinkingConfig = { thinkingBudget: stockChatBotPromptDefinition!.thinkingBudget };
  }

  const promptOptions: any = {
    name: `stockChatBotPrompt_${promptType}`,
    input: {schema: ChatInputSchema},
    model: modelId,
    prompt: promptString,
    config: promptConfig,
  };

  if (isGrounded) {
    promptConfig.tools = [{ googleSearch: {} }];
  } else {
    promptOptions.output = {schema: ChatOutputSchema};
  }

  console.log(
    `${logPrefix} Defining prompt. ` +
    `Type: ${promptType}, ` +
    `Model: ${modelId}, ` +
    `Grounding: ${isGrounded}, ` +
    `ThinkingBudget: ${promptConfig.thinkingConfig?.thinkingBudget ?? 'N/A'}, ` +
    `SafetySettings: ${safetySettings.length}`
  );

  const prompt = ai.definePrompt(promptOptions);

  // Cache the newly created prompt
  if (isGrounded) {
    groundedChatPrompt = prompt;
    console.log(`${logPrefix} Grounded prompt object defined and cached.`);
  } else {
    standardChatPrompt = prompt;
    console.log(`${logPrefix} Standard prompt object defined and cached.`);
  }

  return prompt;
}


export async function chatWithBot(input: ChatInput): Promise<ChatOutput> {
  console.time('chatFlowExecutionTime');
  const logPrefix = `[AIFlow:chatWithBot:Ticker:${input.ticker}:Entry]`;
  console.log(`${logPrefix} Received request. User input (first 50): "${input.userInput.substring(0,50)}...". History length: ${input.chatHistory?.length || 0}. Grounding Enabled: ${!!input.isChatGroundingEnabled}`);
  try {
    const result = await chatFlow(input);
    console.timeEnd('chatFlowExecutionTime');
    return result;
  } catch (error) {
    console.timeEnd('chatFlowExecutionTime');
    throw error; // Re-throw to be caught by server action
  }
}

const chatFlow = ai.defineFlow(
  {
    name: 'stockChatBotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input: ChatInput): Promise<ChatOutput> => {
    const logPrefix = `[AIFlow:stockChatBotFlow:Ticker:${input.ticker || 'N/A'}]`;
    const isGrounded = input.isChatGroundingEnabled || false;
    console.log(`${logPrefix} Flow execution started. Grounding: ${isGrounded}. User input (first 50 chars): "${input.userInput.substring(0,50)}...". History length: ${input.chatHistory?.length || 0}.`);

    try {
      const promptToUse = await getChatPrompt(isGrounded);
      console.log(`${logPrefix} Executing stockChatBotPrompt (type: ${isGrounded ? 'grounded' : 'standard'}) for ticker ${input.ticker}.`);
      const result = await promptToUse(input);
      
      console.log(`${logPrefix} [Tokens] Thoughts: ${result.usageMetadata?.thoughtsTokenCount ?? 'N/A'}, Output: ${result.usageMetadata?.candidatesTokenCount ?? 'N/A'}`);
      if(isGrounded) {
        console.log(`${logPrefix} [Grounding] Search Entries: ${result.usageMetadata?.search?.searchEntries?.length ?? 0}`);
      }

      let responseText: string | undefined;

      if (isGrounded) {
        responseText = result.text; // For grounded prompts, the response is simple text
      } else {
        responseText = result.output?.response; // For standard prompts, it's in the structured output
      }

      if (!responseText || typeof responseText !== 'string' || responseText.trim() === '') {
          console.error(`${logPrefix} Chatbot AI prompt output for ticker ${input.ticker} is malformed or empty. Full result object (first 500 chars): ${JSON.stringify(result).substring(0,500)}`);
          throw new Error('Chatbot AI prompt returned a malformed or empty response.');
      }
      
      console.log(`${logPrefix} Flow successfully executed for ticker ${input.ticker}. Response (first 50 chars): "${responseText.substring(0,50)}..."`);
      return { response: responseText }; // Manually construct the valid output object

    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL ERROR during stockChatBotPrompt execution for ticker ${input.ticker}. Error name: ${error?.name}, Message: ${error?.message}. Throwing error further.`);
      throw error; // Re-throw the error
    }
  }
);
