'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  RawDebugChatActionState,
  RawDebugChatInputs,
} from '@/ai/schemas/raw-debug-chat-schemas';

// Ensure API key is available
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" });
const groundedModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17", tools: [{googleSearch: {}}] });

export async function sdkDebugChatAction(
  prevState: RawDebugChatActionState,
  payload: RawDebugChatInputs
): Promise<RawDebugChatActionState> {
  const { promptType } = payload;
  const logPrefix = `[ServerAction:sdkDebugChatAction:${promptType}]`;
  console.log(`${logPrefix} Received request.`);

  if (promptType === 'sdk-app-data') {
    const debugPrompt = "What's the correlation for NVDA and the broader AI market?";
    const requestJson = JSON.stringify({ prompt: debugPrompt, type: 'sdk_app_data' }, null, 2);
    try {
      console.log(`${logPrefix} Executing direct SDK (non-grounded) prompt.`);
      const result = await model.generateContent(debugPrompt);
      const response = await result.response;
      const text = response.text();
      return {
        status: 'success',
        data: { requestJson, responseJson: JSON.stringify({ response: text }, null, 2) },
        message: 'SDK App Data response received.',
      };
    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL Error: ${error.message}.`);
      return {
        status: 'error', error: error.message, message: 'SDK App Data prompt failed.',
        data: { requestJson, responseJson: JSON.stringify({ error: error.message, details: String(error) }, null, 2) },
      };
    }
  } else if (promptType === 'sdk-web-search') {
    const debugPrompt = "What's the current ATR-14 for NVDA";
    const requestJson = JSON.stringify({ prompt: debugPrompt, type: 'sdk_web_search' }, null, 2);
    try {
      console.log(`${logPrefix} Executing direct SDK (grounded) prompt.`);
      const result = await groundedModel.generateContent(debugPrompt);
      const response = await result.response;
      const text = response.text();
       return {
        status: 'success',
        data: { requestJson, responseJson: JSON.stringify({ response: text }, null, 2) },
        message: 'SDK Web Search response received.',
      };
    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL Error: ${error.message}.`);
      return {
        status: 'error', error: error.message, message: 'SDK Web Search prompt failed.',
        data: { requestJson, responseJson: JSON.stringify({ error: error.message, details: String(error) }, null, 2) },
      };
    }
  } else {
    return { status: 'error', error: 'Invalid prompt type.', message: 'Unknown debug prompt type requested.' };
  }
}
