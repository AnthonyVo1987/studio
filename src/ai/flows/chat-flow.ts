
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
import { loadPromptDefinition, buildPromptStringFromDefinition, type PromptDefinition } from '@/ai/prompt-loader';

let stockChatBotPromptDefinition: PromptDefinition | null = null;

async function getStockChatBotPrompt() {
  if (!stockChatBotPromptDefinition) {
    stockChatBotPromptDefinition = await loadPromptDefinition('stock-chatbot-prompt');
  }

  const promptString = buildPromptStringFromDefinition(stockChatBotPromptDefinition);
  const modelId = stockChatBotPromptDefinition.modelId || DEFAULT_CHAT_MODEL_ID;
  const safetySettings = stockChatBotPromptDefinition.safetySettings || [
      {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH'},
  ];

  return ai.definePrompt({
    name: 'stockChatBotPrompt', // Keep consistent internal name
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
  console.log('[AIFlow:chatWithBot] Received request for ticker:', input.ticker, 'User input (first 50):', input.userInput.substring(0,50), 'History length:', input.chatHistory?.length || 0);
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'stockChatBotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input: ChatInput) => {
    console.log('[AIFlow:stockChatBotFlow] Executing for ticker:', input.ticker, 'User input (first 50):', input.userInput.substring(0,50));
    const promptToUse = await getStockChatBotPrompt();
    const {output} = await promptToUse(input);
    
    if (!output) {
        console.error('[AIFlow:stockChatBotFlow] Chatbot flow did not return an output for ticker:', input.ticker);
        // Return a structured error that matches ChatOutputSchema
        return { response: "Sorry, I encountered an unexpected issue and couldn't generate a response. Please try again." };
    }
    if (!output.response || typeof output.response !== 'string') {
        console.error('[AIFlow:stockChatBotFlow] Chatbot flow output is malformed (missing response string) for ticker:', input.ticker, 'Output:', output);
        return { response: "Sorry, I received a malformed response. Please try asking in a different way." };
    }
    console.log('[AIFlow:stockChatBotFlow] Successfully executed for ticker:', input.ticker, 'Response (first 50):', output.response.substring(0,50));
    return output;
  }
);
