'use server';
/**
 * @fileOverview A dedicated, minimal Genkit flow for raw web search debugging.
 * This flow exists to provide a stable, registered context for Genkit to resolve
 * the googleSearch tool, which fails when called from an ad-hoc server action.
 *
 * - rawWebSearchDebug - The main function for the raw debug flow.
 */

import { ai } from '@/ai/genkit';
import {
  RawWebSearchDebugInputSchema,
  type RawWebSearchDebugInput,
  type RawWebSearchDebugOutput,
} from '@/ai/schemas/raw-debug-chat-schemas';
import { DEFAULT_CHAT_MODEL_ID } from '@/ai/models';

export async function rawWebSearchDebug(
  input: RawWebSearchDebugInput
): Promise<RawWebSearchDebugOutput> {
  return rawWebSearchDebugFlow(input);
}

const rawWebSearchDebugFlow = ai.defineFlow(
  {
    name: 'rawWebSearchDebugFlow',
    inputSchema: RawWebSearchDebugInputSchema,
    // REMOVED: outputSchema to resolve tool conflict
  },
  async (prompt): Promise<RawWebSearchDebugOutput> => {
    const logPrefix = `[AIFlow:rawWebSearchDebugFlow]`;
    console.log(`${logPrefix} Executing raw debug web search prompt.`);

    try {
      const result = await ai.generate({
        model: DEFAULT_CHAT_MODEL_ID,
        prompt: prompt,
        tools: [{ googleSearch: {} }],
        config: { thinkingConfig: { thinkingBudget: -1 } },
      });
      
      const responseText = result.text ?? "Debug prompt failed to return text.";
      console.log(`${logPrefix} Flow succeeded. Returning text and raw result.`);
      return { response: responseText, rawResponse: result };

    } catch (error: any) {
        console.error(`${logPrefix} CRITICAL Error during raw web search flow execution. Error: ${error.message}`);
        throw error; // Re-throw to be caught by the calling server action
    }
  }
);
