
'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  RawDebugChatActionState,
  RawDebugChatInputs,
} from '@/ai/schemas/raw-debug-chat-schemas';
import {
  buildPromptStringFromLlmDefinition,
  LlmPromptDefinitionSchema,
} from '@/ai/definition-loader';

// Ensure API key is available
const apiKey = process.env.GEMINI_API_KEY; // Corrected to use GEMINI_API_KEY
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" });
const groundedModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17", tools: [{googleSearch: {}}] });

async function loadPromptText(definitionName: string, ticker: string = "NVDA"): Promise<string> {
    const module = await import(`@/ai/definitions/${definitionName}.json`);
    const jsonData = module.default;
    const validationResult = LlmPromptDefinitionSchema.safeParse(jsonData);
    if (!validationResult.success) {
      throw new Error(`Invalid prompt definition structure in ${definitionName}.json`);
    }
    const rawPrompt = buildPromptStringFromLlmDefinition(validationResult.data);
    return rawPrompt.replace(/{{{ticker}}}/g, ticker);
}

export async function sdkDebugChatAction(
  prevState: RawDebugChatActionState,
  payload: RawDebugChatInputs
): Promise<RawDebugChatActionState> {
  const { promptType, userInput } = payload;
  const logPrefix = `[ServerAction:sdkDebugChatAction:${promptType}]`;
  const genLogPrefix = '[DEBUG_SDK_CALL]';
  console.log(`${logPrefix} Received request.`);

  let debugPrompt = '';
  let requestJson = '';
  let modelToUse = model;
  let specificLogPrefix = '';

  try {
    switch (promptType) {
        case 'sdk-app-data':
            specificLogPrefix = `${genLogPrefix} SDK App Data prompt:`;
            console.log(`${specificLogPrefix} START.`);
            debugPrompt = "What are the current 3 support and 3 resistance levels for NVDA?";
            requestJson = JSON.stringify({ prompt: debugPrompt, type: 'sdk_app_data' }, null, 2);
            modelToUse = model;
            break;

        case 'sdk-web-search':
            specificLogPrefix = `${genLogPrefix} SDK Web Search (Default) prompt:`;
            console.log(`${specificLogPrefix} START.`);
            debugPrompt = "What are the current 3 support and 3 resistance levels for NVDA?";
            requestJson = JSON.stringify({ prompt: debugPrompt, type: 'sdk_web_search' }, null, 2);
            modelToUse = groundedModel;
            break;

        case 'sdk-ta-web-search':
            specificLogPrefix = `${genLogPrefix} SDK TA Web Search prompt:`;
            console.log(`${specificLogPrefix} START.`);
            debugPrompt = await loadPromptText('technical-analysis-web-search');
            requestJson = JSON.stringify({ prompt: debugPrompt, type: 'sdk-ta-web-search' }, null, 2);
            modelToUse = groundedModel;
            break;

        case 'sdk-options-web-search':
            specificLogPrefix = `${genLogPrefix} SDK Options Web Search prompt:`;
            console.log(`${specificLogPrefix} START.`);
            debugPrompt = await loadPromptText('options-flow-web-search');
            requestJson = JSON.stringify({ prompt: debugPrompt, type: 'sdk-options-web-search' }, null, 2);
            modelToUse = groundedModel;
            break;

        case 'sdk-user-web-search':
            specificLogPrefix = `${genLogPrefix} SDK User Web Search prompt:`;
            console.log(`${specificLogPrefix} START.`);
            if (!userInput || userInput.trim() === '') {
                throw new Error("User input cannot be empty for this prompt type.");
            }
            debugPrompt = userInput;
            requestJson = JSON.stringify({ prompt: debugPrompt, type: 'sdk-user-web-search' }, null, 2);
            modelToUse = groundedModel;
            break;

        default:
            return { status: 'error', error: 'Invalid prompt type.', message: 'Unknown debug prompt type requested.' };
    }
    
    const result = await modelToUse.generateContent(debugPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log(`${specificLogPrefix} END.`);
    return {
      status: 'success',
      data: { requestJson, responseJson: JSON.stringify({ response: text }, null, 2) },
      message: `SDK action for '${promptType}' succeeded.`,
    };
  } catch (error: any) {
    if(specificLogPrefix) {
        console.error(`${specificLogPrefix} FAILED. Error: ${error.message}`);
    } else {
        console.error(`${logPrefix} CRITICAL Unhandled Outer Error: ${error.message}.`);
    }

    if (!requestJson) {
        requestJson = JSON.stringify({ prompt: "Error during prompt setup", type: promptType, error: error.message }, null, 2);
    }
    return {
      status: 'error', error: error.message, message: `SDK action for '${promptType}' failed.`,
      data: { requestJson, responseJson: JSON.stringify({ error: error.message, details: String(error) }, null, 2) },
    };
  }
}
