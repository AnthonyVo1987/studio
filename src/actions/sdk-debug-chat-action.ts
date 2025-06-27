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
  const actionLogPrefix = `[ServerAction:sdkDebugChatAction:${promptType}]`;
  const genLogPrefix = '[DEBUG_SDK_CALL]';
  console.log(`${actionLogPrefix} Received request.`);

  try {
    switch (promptType) {
        case 'sdk-app-data': {
            const specificLogPrefix = `${genLogPrefix} SDK App Data prompt:`;
            console.log(`${specificLogPrefix} START.`);
            const currentPrompt = "What are the current 3 support and 3 resistance levels for NVDA?";
            const requestJson = JSON.stringify({ prompt: currentPrompt, type: promptType }, null, 2);
            const result = await model.generateContent(currentPrompt);
            const text = result.response.text();
            console.log(`${specificLogPrefix} END.`);
            return {
                status: 'success', data: { requestJson, responseJson: JSON.stringify({ response: text }, null, 2) },
                message: `SDK action for '${promptType}' succeeded.`
            };
        }

        case 'sdk-web-search': {
            const specificLogPrefix = `${genLogPrefix} SDK Web Search (Default) prompt:`;
            console.log(`${specificLogPrefix} START.`);
            const currentPrompt = "What are the current 3 support and 3 resistance levels for NVDA?";
            const requestJson = JSON.stringify({ prompt: currentPrompt, type: promptType }, null, 2);
            const result = await groundedModel.generateContent(currentPrompt);
            const text = result.response.text();
            console.log(`${specificLogPrefix} END.`);
            return {
                status: 'success', data: { requestJson, responseJson: JSON.stringify({ response: text }, null, 2) },
                message: `SDK action for '${promptType}' succeeded.`
            };
        }

        case 'sdk-ta-web-search': {
            const specificLogPrefix = `${genLogPrefix} SDK TA Web Search prompt:`;
            console.log(`${specificLogPrefix} START.`);
            const currentPrompt = await loadPromptText('technical-analysis-web-search');
            const requestJson = JSON.stringify({ prompt: currentPrompt, type: promptType }, null, 2);
            const result = await groundedModel.generateContent(currentPrompt);
            const text = result.response.text();
            console.log(`${specificLogPrefix} END.`);
            return {
                status: 'success', data: { requestJson, responseJson: JSON.stringify({ response: text }, null, 2) },
                message: `SDK action for '${promptType}' succeeded.`
            };
        }

        case 'sdk-options-web-search': {
            const specificLogPrefix = `${genLogPrefix} SDK Options Web Search prompt:`;
            console.log(`${specificLogPrefix} START.`);
            const currentPrompt = await loadPromptText('options-flow-web-search');
            const requestJson = JSON.stringify({ prompt: currentPrompt, type: promptType }, null, 2);
            const result = await groundedModel.generateContent(currentPrompt);
            const text = result.response.text();
            console.log(`${specificLogPrefix} END.`);
            return {
                status: 'success', data: { requestJson, responseJson: JSON.stringify({ response: text }, null, 2) },
                message: `SDK action for '${promptType}' succeeded.`
            };
        }
      
        case 'sdk-user-web-search': {
            const specificLogPrefix = `${genLogPrefix} SDK User Web Search prompt:`;
            console.log(`${specificLogPrefix} START.`);
            if (!userInput || userInput.trim() === '') {
                throw new Error("User input cannot be empty for this prompt type.");
            }
            const currentPrompt = userInput;
            const requestJson = JSON.stringify({ prompt: currentPrompt, type: promptType }, null, 2);
            const result = await groundedModel.generateContent(currentPrompt);
            const text = result.response.text();
            console.log(`${specificLogPrefix} END.`);
            return {
                status: 'success', data: { requestJson, responseJson: JSON.stringify({ response: text }, null, 2) },
                message: `SDK action for '${promptType}' succeeded.`
            };
        }

        default:
            return { status: 'error', error: 'Invalid prompt type.', message: 'Unknown debug prompt type requested.' };
    }
  } catch (error: any) {
    const specificLogPrefix = `${genLogPrefix} ${promptType}`;
    console.error(`${specificLogPrefix} FAILED. Error: ${error.message}`);
    const requestJson = JSON.stringify({ prompt: "Error during execution", type: promptType, error: error.message }, null, 2);
    return {
      status: 'error', error: error.message, message: `SDK action for '${promptType}' failed.`,
      data: { requestJson, responseJson: JSON.stringify({ error: error.message, details: String(error) }, null, 2) },
    };
  }
}
