
'use server';
/**
 * @fileOverview Implements a contextual chatbot flow for stock-related questions.
 * This flow uses provided stock data, AI analysis, and chat history to respond to user queries.
 * Prompt definition is now loaded from a JSON file.
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

let stockChatBotPromptDefinition: LlmPromptDefinition | null = null;

async function getStockChatBotPrompt() {
  const logPrefix = '[AIFlow:getStockChatBotPrompt]';
  if (!stockChatBotPromptDefinition) {
    console.log(`${logPrefix} Loading 'stock-chatbot' definition for the first time.`);
    const genericDefinition = await loadDefinition('stock-chatbot');
    if (genericDefinition.definitionType !== 'llm-prompt') {
      const errorMsg = `Loaded definition for 'stock-chatbot' is not an LLM prompt type. Type: ${genericDefinition.definitionType}`;
      console.error(`${logPrefix} ${errorMsg}`);
      throw new Error(errorMsg);
    }
    stockChatBotPromptDefinition = genericDefinition;
    console.log(`${logPrefix} 'stock-chatbot' definition loaded and validated. Loaded definition (keys): ${Object.keys(stockChatBotPromptDefinition).join(', ')}`);
  }

  const promptString = buildPromptStringFromLlmDefinition(stockChatBotPromptDefinition);
  const modelId = stockChatBotPromptDefinition.modelId || DEFAULT_CHAT_MODEL_ID;
  const safetySettings = stockChatBotPromptDefinition.safetySettings || [
      {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH'},
  ];

  const promptConfig: {
    safetySettings: any[];
    thinkingConfig?: { thinkingBudget?: number };
  } = {
    safetySettings: safetySettings,
  };

  if (stockChatBotPromptDefinition.thinkingBudget !== undefined) {
    promptConfig.thinkingConfig = { thinkingBudget: stockChatBotPromptDefinition.thinkingBudget };
  }

  console.log(`${logPrefix} Using Model: ${modelId}. Prompt string (first 100 chars): ${promptString.substring(0,100)}...`);
  console.log(`${logPrefix} Safety settings configuration (count): ${safetySettings.length}. First setting category (if any): ${safetySettings[0]?.category}`);
  console.log(`${logPrefix} Thinking config: thinkingBudget=${promptConfig.thinkingConfig?.thinkingBudget}`);


  return ai.definePrompt({
    name: 'stockChatBotPrompt',
    input: {schema: ChatInputSchema},
    output: {schema: ChatOutputSchema},
    model: modelId,
    prompt: promptString,
    config: promptConfig,
  });
}


export async function chatWithBot(input: ChatInput): Promise<ChatOutput> {
  console.time('chatFlowExecutionTime');
  const logPrefix = `[AIFlow:chatWithBot:Ticker:${input.ticker}:Entry]`;
  console.log(`${logPrefix} Received request. User input (first 50): "${input.userInput.substring(0,50)}...". History length: ${input.chatHistory?.length || 0}`);
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
    const logPrefix = `[AIFlow:stockChatBotFlow:Ticker:${input.ticker}]`;
    console.log(`${logPrefix} Flow execution started. User input (first 50 chars): "${input.userInput.substring(0,50)}...". History length: ${input.chatHistory?.length || 0}.`);

    try {
      const promptToUse = await getStockChatBotPrompt();
      console.log(`${logPrefix} Executing stockChatBotPrompt for ticker ${input.ticker}. User input (first 50): "${input.userInput.substring(0,50)}..."`);
      const result = await promptToUse(input);
      const outputFromPrompt = result.output;
      console.log(`${logPrefix} [Tokens] Thoughts: ${result.usageMetadata?.thoughtsTokenCount ?? 'N/A'}, Output: ${result.usageMetadata?.candidatesTokenCount ?? 'N/A'}`);


      if (!outputFromPrompt) {
          console.error(`${logPrefix} Chatbot AI prompt for ticker ${input.ticker} did not return an output structure.`);
          throw new Error('Chatbot AI prompt failed to return any output structure.');
      }
      if (!outputFromPrompt.response || typeof outputFromPrompt.response !== 'string') {
          console.error(`${logPrefix} Chatbot AI prompt output for ticker ${input.ticker} is malformed (missing response string or not a string). Output (first 200): ${JSON.stringify(outputFromPrompt).substring(0,200)}`);
          throw new Error('Chatbot AI prompt returned a malformed response (e.g., response not a string).');
      }
      console.log(`${logPrefix} Flow successfully executed for ticker ${input.ticker}. Response (first 50 chars): "${outputFromPrompt.response.substring(0,50)}..."`);
      return outputFromPrompt;
    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL ERROR during stockChatBotPrompt execution for ticker ${input.ticker}. Error name: ${error?.name}, Message: ${error?.message}. Throwing error further.`);
      throw error; // Re-throw the error
    }
  }
);

