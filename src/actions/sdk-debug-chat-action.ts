
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
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" });
const groundedModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17", tools: [{googleSearch: {}}] });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  console.log(`${logPrefix} Received request.`);

  let debugPrompt = '';
  let requestJson = '';
  let modelToUse = model;
  let isGroundedSearch = false;

  try {
    switch (promptType) {
        case 'sdk-app-data':
            debugPrompt = "What are the current 3 support and 3 resistance levels for NVDA?";
            requestJson = JSON.stringify({ prompt: debugPrompt, type: 'sdk_app_data' }, null, 2);
            modelToUse = model;
            break;

        case 'sdk-web-search':
            debugPrompt = "What's the current ATR-14 for NVDA";
            requestJson = JSON.stringify({ prompt: debugPrompt, type: 'sdk_web_search' }, null, 2);
            modelToUse = groundedModel;
            isGroundedSearch = true;
            break;

        case 'sdk-ta-web-search':
            debugPrompt = await loadPromptText('technical-analysis-web-search');
            requestJson = JSON.stringify({ prompt: "Loaded prompt from technical-analysis-web-search.json", type: 'sdk-ta-web-search' }, null, 2);
            modelToUse = groundedModel;
            isGroundedSearch = true;
            break;

        case 'sdk-options-web-search':
            debugPrompt = await loadPromptText('options-flow-web-search');
            requestJson = JSON.stringify({ prompt: "Loaded prompt from options-flow-web-search.json", type: 'sdk-options-web-search' }, null, 2);
            modelToUse = groundedModel;
            isGroundedSearch = true;
            break;

        case 'sdk-user-web-search':
            if (!userInput || userInput.trim() === '') {
                throw new Error("User input cannot be empty for this prompt type.");
            }
            debugPrompt = userInput;
            requestJson = JSON.stringify({ prompt: debugPrompt, type: 'sdk-user-web-search' }, null, 2);
            modelToUse = groundedModel;
            isGroundedSearch = true;
            break;

        default:
            return { status: 'error', error: 'Invalid prompt type.', message: 'Unknown debug prompt type requested.' };
    }
    
    if (isGroundedSearch) {
      console.log(`${logPrefix} Applying initial 5-second delay for grounded search.`);
      await delay(5000);
    }

    console.log(`${logPrefix} Executing direct SDK prompt. Length: ${debugPrompt.length}`);
    const result = await modelToUse.generateContent(debugPrompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      status: 'success',
      data: { requestJson, responseJson: JSON.stringify({ response: text }, null, 2) },
      message: `SDK action for '${promptType}' succeeded.`,
    };
  } catch (error: any) {
    console.error(`${logPrefix} CRITICAL Error: ${error.message}.`);
    if (!requestJson) {
        requestJson = JSON.stringify({ prompt: "Error during prompt setup", type: promptType, error: error.message }, null, 2);
    }
    return {
      status: 'error', error: error.message, message: `SDK action for '${promptType}' failed.`,
      data: { requestJson, responseJson: JSON.stringify({ error: error.message, details: String(error) }, null, 2) },
    };
  }
}
