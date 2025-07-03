
'use server';

import { ai } from '@/ai/genkit';
import { AppDataChatOutputSchema } from '@/ai/schemas/app-data-chat-schemas';
import { DEFAULT_CHAT_MODEL_ID } from '@/ai/models';
import type {
  RawDebugChatActionState,
  RawDebugChatInputs,
} from '@/ai/schemas/raw-debug-chat-schemas';

export async function rawDebugChatAction(
  prevState: RawDebugChatActionState,
  payload: RawDebugChatInputs
): Promise<RawDebugChatActionState> {
  const { promptType } = payload;
  const logPrefix = `[ServerAction:rawDebugChatAction:${promptType}]`;
  console.log(`${logPrefix} Received request.`);

  if (promptType === 'app-data') {
    const debugPrompt = "What's the correlation for NVDA and the broader AI market?";
    const requestJson = JSON.stringify({ prompt: debugPrompt, type: 'debug_app_data' }, null, 2);
    try {
      console.log(`${logPrefix} Executing raw App Data prompt.`);
      const result = await ai.generate({
        model: DEFAULT_CHAT_MODEL_ID,
        prompt: debugPrompt,
        output: { schema: AppDataChatOutputSchema },
        config: { thinkingConfig: { thinkingBudget: -1 } },
      });
      const output = result.output || { response: "Debug prompt failed to return valid output." };
      return {
        status: 'success',
        data: { requestJson, responseJson: JSON.stringify(output, null, 2) },
        message: 'Debug App Data response received.',
      };
    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL Error: ${error.message}.`);
      return {
        status: 'error', error: error.message, message: 'Debug App Data prompt failed.',
        data: { requestJson, responseJson: JSON.stringify({ error: error.message, details: String(error) }, null, 2) },
      };
    }
  } else if (promptType === 'web-search') {
    const debugPrompt = "What's the current ATR-14 for NVDA";
    const requestJson = JSON.stringify({ prompt: debugPrompt, type: 'debug_web_search' }, null, 2);
    try {
      console.log(`${logPrefix} Executing raw Web Search prompt directly via ai.generate.`);
      const result = await ai.generate({
        model: DEFAULT_CHAT_MODEL_ID,
        prompt: debugPrompt,
        tools: [{ googleSearch: {} }],
        config: { thinkingConfig: { thinkingBudget: -1 } },
      });
      
      const responseText = result.text ?? "Debug prompt failed to return text.";
      const responseJson = JSON.stringify({ response: responseText, rawResponse: result }, null, 2);

      return {
        status: 'success',
        data: { requestJson, responseJson },
        message: 'Debug Web Search response received.',
      };
    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL Error during direct ai.generate call: ${error.message}.`);
      return {
        status: 'error', error: error.message, message: 'Debug Web Search prompt failed.',
        data: { requestJson, responseJson: JSON.stringify({ error: error.message, details: String(error) }, null, 2) },
      };
    }
  } else {
    return { status: 'error', error: 'Invalid prompt type.', message: 'Unknown debug prompt type requested.' };
  }
}
