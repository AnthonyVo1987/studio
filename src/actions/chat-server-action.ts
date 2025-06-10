
'use server';

import {
  chatWithBot,
  type ChatInput,
  type ChatOutput,
} from '@/ai/flows/chat-flow';

export interface ChatActionResult {
  chatbotRequestJson: string;
  chatbotResponseJson: string;
  // We might also return the updated full chat history here if needed by client
}

export interface ChatActionState {
  status: 'idle' | 'success' | 'error' | 'pending'; // Added pending for explicit client use
  data?: ChatActionResult;
  error?: string | null;
  message?: string | null;
}

// This is the payload the client-side form/action call will send
export interface ChatActionInputs {
  ticker: string;
  stockSnapshotJson: string;
  aiKeyTakeawaysJson: string;
  aiCalculatedTaJson: string;
  chatHistory?: Array<{ role: 'user' | 'model'; content: string }>; // Pass existing history
  userInput: string;
}

export async function chatServerAction(
  prevState: ChatActionState,
  payload: ChatActionInputs
): Promise<ChatActionState> {
  const { 
    ticker, 
    stockSnapshotJson, 
    aiKeyTakeawaysJson, 
    aiCalculatedTaJson, 
    chatHistory, 
    userInput 
  } = payload;

  if (!userInput || userInput.trim() === '') {
    return {
      status: 'error',
      error: 'User input cannot be empty.',
      message: 'Please provide a question or statement.',
      data: undefined,
    };
  }
  if (!ticker || !stockSnapshotJson || !aiKeyTakeawaysJson || !aiCalculatedTaJson) {
     return {
      status: 'error',
      error: 'Contextual stock data is missing for the chat.',
      message: 'Cannot process chat without full stock context.',
      data: undefined,
    };
  }

  const flowInput: ChatInput = {
    ticker,
    stockSnapshotJson,
    aiKeyTakeawaysJson,
    aiCalculatedTaJson,
    chatHistory: chatHistory || [],
    userInput,
  };

  const chatbotRequestJson = JSON.stringify(flowInput, null, 2);

  try {
    const flowOutput: ChatOutput = await chatWithBot(flowInput);
    const chatbotResponseJson = JSON.stringify(flowOutput, null, 2);

    return {
      status: 'success',
      data: {
        chatbotRequestJson,
        chatbotResponseJson,
      },
      message: 'Chatbot response received.',
      error: null,
    };
  } catch (error: any) {
    console.error(`Error in chatServerAction for ${ticker} with input "${userInput}":`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during chat processing.',
      message: 'Chatbot failed to respond.',
      data: { // Still return the request JSON if it was formed
        chatbotRequestJson,
        chatbotResponseJson: JSON.stringify({ error: error.message || 'Flow execution failed' }, null, 2),
      },
    };
  }
}
