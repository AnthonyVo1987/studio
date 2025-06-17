
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
      {category: 'SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH'},
  ];

  console.log(`${logPrefix} Using Model: ${modelId}. Prompt string (first 100 chars): ${promptString.substring(0,100)}...`);
  console.log(`${logPrefix} Safety settings configuration (count): ${safetySettings.length}. First setting category (if any): ${safetySettings[0]?.category}`);

  return ai.definePrompt({
    name: 'stockChatBotPrompt', 
    input: {schema: ChatInputSchema},
    output: {schema: ChatOutputSchema},
    model: modelId,
    prompt: promptString,
    config: {
      safetySettings: safetySettings,
    },
  });
}


export async function chatWithBot(input: ChatInput): Promise<ChatOutput> {
  console.log('[AIFlow:chatWithBot:Entry] Received request for ticker:', input.ticker, 'User input (first 50):', input.userInput.substring(0,50), 'History length:', input.chatHistory?.length || 0);
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'stockChatBotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input: ChatInput) => {
    const logPrefix = `[AIFlow:stockChatBotFlow:Ticker:${input.ticker}]`;
    console.log(`${logPrefix} Flow execution started. User input (first 50 chars): "${input.userInput.substring(0,50)}...". History length: ${input.chatHistory?.length || 0}.`);
    
    try {
      const promptToUse = await getStockChatBotPrompt();
      console.log(`${logPrefix} Executing stockChatBotPrompt for ticker ${input.ticker}. User input (first 50): "${input.userInput.substring(0,50)}..."`);
      const {output} = await promptToUse(input);
      
      if (!output) {
          console.error(`${logPrefix} Chatbot flow for ticker ${input.ticker} did not return an output.`);
          return { response: "Sorry, I encountered an unexpected issue and couldn't generate a response. Please try again." };
      }
      if (!output.response || typeof output.response !== 'string') {
          console.error(`${logPrefix} Chatbot flow output for ticker ${input.ticker} is malformed (missing response string). Output: ${JSON.stringify(output).substring(0,200)}`);
          return { response: "Sorry, I received a malformed response. Please try asking in a different way." };
      }
      console.log(`${logPrefix} Flow successfully executed for ticker ${input.ticker}. Response (first 50 chars): "${output.response.substring(0,50)}..."`);
      return output;
    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL ERROR during stockChatBotPrompt execution for ticker ${input.ticker}. Error name: ${error?.name}, Message: ${error?.message}, Stack (first 500): ${error?.stack?.substring(0,500)}, Full error object (first 500): ${JSON.stringify(error).substring(0,500)}.`);
      return { response: "I'm sorry, but I encountered a problem while processing your request. Please try again later." };
    }
  }
);

