
'use server';

import {
  webSearchChat,
  type WebSearchChatInput,
  type WebSearchChatOutput,
} from '@/ai/flows/web-search-chat-flow';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { DEFAULT_CHAT_MODEL_ID } from '@/ai/models';

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
  console.log(`[DIAG_LOG_WEBACTION_ENTRY] ${actionLogPrefix} Received request. PromptName: ${promptName || 'default_web_search'}. User Input (first 50 chars): "${userInput?.substring(0,50) || 'undefined_input'}...".`);

  // Handle the new debug prompt directly
  if (promptName === 'debug_web_search') {
    const debugPrompt = "What's the current ATR-14 for NVDA";
    const chatbotRequestJson = JSON.stringify({ prompt: debugPrompt, type: 'debug_web_search' }, null, 2);
    try {
      console.log(`${actionLogPrefix} Executing DEBUG Web Search prompt. This is a direct, non-cached call.`);
      const result = await ai.generate({
        model: DEFAULT_CHAT_MODEL_ID,
        prompt: debugPrompt,
        tools: [googleAI.googleSearch],
        config: {
          thinkingConfig: { thinkingBudget: -1 },
        },
      });
      const responseText = result.text ?? "Debug prompt failed to return text.";
      const chatbotResponseJson = JSON.stringify({ response: responseText, rawResponse: result }, null, 2);
       return {
        status: 'success',
        data: { chatbotRequestJson, chatbotResponseJson },
        message: 'Debug Web Search response received.',
        error: null,
      };
    } catch (error: any) {
       console.error(`${actionLogPrefix} CRITICAL Error during DEBUG Web Search processing. Error: ${error.message}.`);
      return {
        status: 'error', error: error.message, message: 'Debug Web Search prompt failed.',
        data: {
          chatbotRequestJson,
          chatbotResponseJson: JSON.stringify({ error: error.message, details: String(error) }, null, 2),
        },
      };
    }
  }


  if (!userInput || userInput.trim() === '') {
    const errorMsg = 'User input cannot be empty.';
    console.warn(`${actionLogPrefix} Validation Error - ${errorMsg}`);
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
  
  try {
    console.log(`[DIAG_LOG_WEBACTION_PRE_FLOW] ${actionLogPrefix} Calling webSearchChat flow.`);
    const flowOutput: WebSearchChatOutput = await webSearchChat(flowInput);
    const chatbotResponseJson = JSON.stringify(flowOutput, null, 2);
    console.log(`[DIAG_LOG_WEBACTION_POST_FLOW_SUCCESS] ${actionLogPrefix} Flow succeeded. chatbotResponseJson length: ${chatbotResponseJson.length}`);

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
    console.error(`[DIAG_LOG_WEBACTION_POST_FLOW_ERROR] ${actionLogPrefix} CRITICAL Error during web search processing. Error: ${error.message}.`);
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
