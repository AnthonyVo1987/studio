
'use server';

import {
  chatWithBot,
  type AppDataChatInput,
  type AppDataChatOutput,
} from '@/ai/flows/app-data-chat-flow';
import {
  loadExampleChatPrompts,
} from '@/ai/definition-loader';
import type { AppDataChatActionInputs } from '@/ai/schemas/app-data-chat-schemas';

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

export async function appDataChatAction(
  prevState: AppDataChatActionState,
  payload: AppDataChatActionInputs
): Promise<AppDataChatActionState> {
  const {
    ticker,
    stockSnapshotJson = '{}',
    aiKeyTakeawaysJson = '{}',
    aiAnalyzedTaJson = '{}',
    aiOptionsAnalysisJson = '{}',
    chatHistory = [],
    promptName,
    userInput,
  } = payload;

  const actionLogPrefix = `[ServerAction:appDataChatAction:Ticker:${ticker || 'N/A'}]`;
  console.log(
    `${actionLogPrefix} Received request. PromptName: ${promptName || 'user_input'}. User Input from payload: "${userInput?.substring(0, 50) || 'N/A'}...".`
  );

  let finalUserInput = userInput || '';

  try {
    if (promptName) {
      const examplePrompts = await loadExampleChatPrompts();
      const matchedPrompt = examplePrompts.find(
        (p) => p.promptName === promptName
      );
      if (matchedPrompt) {
        finalUserInput = matchedPrompt.promptTemplate.replace(
          /\{TICKER\}/g,
          ticker || 'the stock'
        );
        console.log(
          `${actionLogPrefix} Loaded template for promptName '${promptName}'.`
        );
      } else {
        throw new Error(`Could not find example prompt definition for '${promptName}'.`);
      }
    }

    if (!finalUserInput || finalUserInput.trim() === '') {
      const errorMsg = 'User input cannot be empty.';
      console.warn(`${actionLogPrefix} Validation Error - ${errorMsg}`);
      return {
        status: 'error',
        error: errorMsg,
        message: 'Please provide a question or statement.',
        data: {
          chatbotRequestJson: JSON.stringify(
            { error: errorMsg, ticker, userInput: finalUserInput, promptName },
            null,
            2
          ),
          chatbotResponseJson: JSON.stringify(
            { error: errorMsg, details: 'User input was empty.' },
            null,
            2
          ),
        },
      };
    }

    const flowInput: AppDataChatInput = {
      ticker,
      stockSnapshotJson,
      aiKeyTakeawaysJson,
      aiAnalyzedTaJson,
      aiOptionsAnalysisJson,
      chatHistory,
      userInput: finalUserInput,
      promptName: promptName || undefined,
    };

    const chatbotRequestJson = JSON.stringify(flowInput, null, 2);

    const flowOutput: AppDataChatOutput = await chatWithBot(flowInput);
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
    console.error(
      `${actionLogPrefix} CRITICAL Error during chat processing. Error: ${error.message}.`
    );
    const chatbotRequestJson = JSON.stringify({
      error: 'Failed during input assembly',
      details: String(error),
      ticker, promptName, userInput
    }, null, 2);
    return {
      status: 'error',
      error: error.message || 'An unknown error occurred during chat processing.',
      message: 'Chatbot failed to respond.',
      data: {
        chatbotRequestJson,
        chatbotResponseJson: JSON.stringify(
          { error: error.message || 'Flow execution failed', details: String(error) },
          null,
          2
        ),
      },
    };
  }
}
