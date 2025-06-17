
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
  aiAnalyzedTaJson: string; 
  aiOptionsAnalysisJson?: string; 
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
    aiAnalyzedTaJson, 
    aiOptionsAnalysisJson, 
    chatHistory, 
    userInput 
  } = payload;
  const actionLogPrefix = `[ServerAction:chatServerAction:Ticker:${ticker}]`;
  console.log(`${actionLogPrefix} Received request. User Input (first 50 chars): "${userInput.substring(0,50)}...". History length: ${chatHistory?.length || 0}. PrevState status: ${prevState.status}`);


  if (!userInput || userInput.trim() === '') {
    const errorMsg = 'User input cannot be empty.';
    console.warn(`${actionLogPrefix} Validation Error: ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Please provide a question or statement.',
      data: {
        chatbotRequestJson: JSON.stringify({ error: errorMsg, ticker, userInput }, null, 2),
        chatbotResponseJson: JSON.stringify({ error: errorMsg }, null, 2),
      },
    };
  }
  if (!ticker || !stockSnapshotJson || stockSnapshotJson === '{}' || 
      !aiKeyTakeawaysJson || aiKeyTakeawaysJson === '{}' || 
      !aiAnalyzedTaJson || aiAnalyzedTaJson === '{}') { 
     const errorMsg = 'Contextual stock data is missing for the chat.';
     console.warn(`${actionLogPrefix} Validation Error: ${errorMsg}. Snapshot empty: ${stockSnapshotJson === '{}'}, Takeaways empty: ${aiKeyTakeawaysJson === '{}'}, Analyzed TA empty: ${aiAnalyzedTaJson === '{}'}`);
     return {
      status: 'error',
      error: errorMsg,
      message: 'Cannot process chat without full stock context.',
      data: {
        chatbotRequestJson: JSON.stringify({ error: errorMsg, payloadSnapshot: { ticker, userInput, chatHistoryLength: chatHistory?.length || 0 } }, null, 2),
        chatbotResponseJson: JSON.stringify({ error: errorMsg }, null, 2),
      },
    };
  }

  const flowInput: ChatInput = {
    ticker,
    stockSnapshotJson,
    aiKeyTakeawaysJson,
    aiAnalyzedTaJson, 
    aiOptionsAnalysisJson: aiOptionsAnalysisJson || "{}", 
    chatHistory: chatHistory || [],
    userInput,
  };

  const chatbotRequestJson = JSON.stringify(flowInput, null, 2);
  console.log(`${actionLogPrefix} Calling chatWithBot flow. Input keys: ${Object.keys(flowInput).join(', ')}. History length: ${flowInput.chatHistory.length}.`);

  try {
    const flowOutput: ChatOutput = await chatWithBot(flowInput);
    const chatbotResponseJson = JSON.stringify(flowOutput, null, 2);
    console.log(`${actionLogPrefix} chatWithBot flow succeeded. Response (first 50 chars): "${flowOutput.response.substring(0,50)}..."`);

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
    console.error(`${actionLogPrefix} CRITICAL Error during chat processing. Error: ${error.message}, Stack: ${error.stack}`);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during chat processing.',
      message: 'Chatbot failed to respond.',
      data: { 
        chatbotRequestJson,
        chatbotResponseJson: JSON.stringify({ error: error.message || 'Flow execution failed', details: String(error) }, null, 2),
      },
    };
  }
}

