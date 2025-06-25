
'use server';

import {
  chatWithBot,
  type AppDataChatInput,
  type AppDataChatOutput,
} from '@/ai/flows/app-data-chat-flow';

export interface AppDataChatActionResult {
  chatbotRequestJson: string;
  chatbotResponseJson: string;
}

export interface AppDataChatActionState {
  status: 'idle' | 'success' | 'error' | 'pending';
  data?: AppDataChatActionResult;
  error?: string | null;
  message?: string | null;
}

export interface AppDataChatActionInputs {
  ticker: string;
  stockSnapshotJson: string;
  aiKeyTakeawaysJson: string;
  aiAnalyzedTaJson: string;
  aiOptionsAnalysisJson?: string;
  chatHistory?: Array<{ role: 'user' | 'model'; content: string }>;
  userInput: string;
  promptName?: string;
}

export async function appDataChatAction(
  prevState: AppDataChatActionState,
  payload: AppDataChatActionInputs
): Promise<AppDataChatActionState> {
  const {
    ticker,
    stockSnapshotJson,
    aiKeyTakeawaysJson,
    aiAnalyzedTaJson,
    aiOptionsAnalysisJson,
    chatHistory,
    userInput,
    promptName,
  } = payload;
  const actionLogPrefix = `[ServerAction:appDataChatAction:Ticker:${ticker || 'N/A'}]`;
  console.log(`${actionLogPrefix} Action_Entry - Received request. PromptName: ${promptName || 'default_chat'}. User Input (first 50 chars): "${userInput.substring(0,50)}...". History length: ${chatHistory?.length || 0}. PrevState status: ${prevState.status}`);


  if (!userInput || userInput.trim() === '') {
    const errorMsg = 'User input cannot be empty.';
    console.warn(`${actionLogPrefix} Action_ValidationError - ${errorMsg}`);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Please provide a question or statement.',
      data: {
        chatbotRequestJson: JSON.stringify({ error: errorMsg, ticker, userInput, promptName }, null, 2),
        chatbotResponseJson: JSON.stringify({ error: errorMsg, details: "User input was empty." }, null, 2),
      },
    };
  }
  
  const flowInput: AppDataChatInput = {
    ticker,
    stockSnapshotJson,
    aiKeyTakeawaysJson,
    aiAnalyzedTaJson,
    aiOptionsAnalysisJson: aiOptionsAnalysisJson || "{}",
    chatHistory: chatHistory || [],
    userInput,
    promptName: promptName,
  };

  const chatbotRequestJson = JSON.stringify(flowInput, null, 2);
  
  try {
    console.log(`${actionLogPrefix} [AI_CALL_START] Calling chatWithBot flow. PromptName: ${flowInput.promptName || 'default_chat'}.`);
    const flowOutput: AppDataChatOutput = await chatWithBot(flowInput);
    console.log(`${actionLogPrefix} [AI_CALL_END] chatWithBot flow returned. Response (first 50 chars): "${flowOutput.response?.substring(0,50)}..."`);
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
    console.error(`${actionLogPrefix} [AI_CALL_END_ERROR] CRITICAL Error during chat processing. Error: ${error.message}.`);
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
