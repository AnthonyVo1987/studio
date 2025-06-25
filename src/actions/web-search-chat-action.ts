
'use server';

import {
  webSearchChat,
  type WebSearchChatInput,
  type WebSearchChatOutput,
} from '@/ai/flows/web-search-chat-flow';

export interface WebSearchChatActionResult {
  chatbotRequestJson: string;
  chatbotResponseJson: string;
}

export interface WebSearchChatActionState {
  status: 'idle' | 'success' | 'error' | 'pending';
  data?: WebSearchChatActionResult;
  error?: string | null;
  message?: string | null;
}

export async function webSearchChatAction(
  prevState: WebSearchChatActionState,
  payload: WebSearchChatInput
): Promise<WebSearchChatActionState> {
  const { ticker, userInput, promptName, chatHistory } = payload;
  const actionLogPrefix = `[ServerAction:webSearchChatAction:Ticker:${ticker || 'N/A'}]`;
  console.log(`${actionLogPrefix} Action_Entry - Received request. PromptName: ${promptName || 'default_web_search'}. User Input (first 50 chars): "${userInput.substring(0,50)}...".`);

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
  
  const flowInput: WebSearchChatInput = {
    ticker,
    chatHistory: chatHistory || [],
    userInput,
    promptName: promptName,
  };

  const chatbotRequestJson = JSON.stringify(flowInput, null, 2);
  console.log(`${actionLogPrefix} Action_PreFlowCall - Calling webSearchChat flow. PromptName: ${flowInput.promptName || 'default_web_search'}.`);

  try {
    const flowOutput: WebSearchChatOutput = await webSearchChat(flowInput);
    console.log(`${actionLogPrefix} Action_PostFlowCall_Success - webSearchChat flow returned. Response (first 50 chars): "${flowOutput.response?.substring(0,50)}..."`);
    const chatbotResponseJson = JSON.stringify(flowOutput, null, 2);

    return {
      status: 'success',
      data: {
        chatbotRequestJson,
        chatbotResponseJson,
      },
      message: 'Web Search response received.',
      error: null,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} Action_FlowError_Or_ActionCatch - CRITICAL Error during web search processing. Error: ${error.message}.`);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during web search processing.',
      message: 'Web search failed to respond.',
      data: {
        chatbotRequestJson,
        chatbotResponseJson: JSON.stringify({ error: error.message || 'Flow execution failed', details: String(error) }, null, 2),
      },
    };
  }
}
