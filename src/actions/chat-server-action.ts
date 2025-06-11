
'use server';

import {
  chatWithBot,
  type ChatInput,
  type ChatOutput,
} from '@/ai/flows/chat-flow';

export interface ChatActionResult {
  chatbotRequestJson: string;
  chatbotResponseJson: string;
}

export interface ChatActionState {
  status: 'idle' | 'success' | 'error' | 'pending'; 
  data?: ChatActionResult;
  error?: string | null;
  message?: string | null;
}

export interface ChatActionInputs {
  ticker: string;
  stockSnapshotJson: string;
  aiKeyTakeawaysJson: string;
  aiCalculatedTaJson: string;
  chatHistory?: Array<{ role: 'user' | 'model'; content: string }>; 
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
  console.log(`[ServerAction:chatServerAction] Request for ticker: ${ticker}, User Input: "${userInput}"`);

  if (!userInput || userInput.trim() === '') {
    const errorMsg = 'User input cannot be empty.';
    console.warn(`[ServerAction:chatServerAction] Validation Error for ${ticker}: ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Please provide a question or statement.',
      data: undefined,
    };
  }
  if (!ticker || !stockSnapshotJson || stockSnapshotJson === '{}' || 
      !aiKeyTakeawaysJson || aiKeyTakeawaysJson === '{}' || 
      !aiCalculatedTaJson || aiCalculatedTaJson === '{}') {
     const errorMsg = 'Contextual stock data is missing for the chat.';
     console.warn(`[ServerAction:chatServerAction] Validation Error for ${ticker}: ${errorMsg}. Snapshot empty: ${stockSnapshotJson === '{}'}, Takeaways empty: ${aiKeyTakeawaysJson === '{}'}, TA empty: ${aiCalculatedTaJson === '{}'}`);
     return {
      status: 'error',
      error: errorMsg,
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
  console.log(`[ServerAction:chatServerAction] Calling chatWithBot flow for ${ticker}. Input (partial): ${chatbotRequestJson.substring(0,300)}...`);

  try {
    const flowOutput: ChatOutput = await chatWithBot(flowInput);
    const chatbotResponseJson = JSON.stringify(flowOutput, null, 2);
    console.log(`[ServerAction:chatServerAction] chatWithBot flow succeeded for ${ticker}. Response: ${chatbotResponseJson.substring(0,200)}...`);

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
    console.error(`[ServerAction:chatServerAction] CRITICAL Error for ${ticker} with input "${userInput}":`, error);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during chat processing.',
      message: 'Chatbot failed to respond.',
      data: { 
        chatbotRequestJson,
        chatbotResponseJson: JSON.stringify({ error: error.message || 'Flow execution failed' }, null, 2),
      },
    };
  }
}
