
'use server';
/**
 * @fileOverview Implements a contextual chatbot flow for stock-related questions.
 * This flow is designed to be non-grounded, using only data provided in the
 * application context (stock snapshot, TAs, etc.)
 *
 * - chatWithBot - The main function for the chatbot flow.
 * - AppDataChatInput (from schemas) - The input type for the chatWithBot function.
 * - AppDataChatOutput (from schemas) - The return type for the chatWithBot function.
 */

import { ai } from '@/ai/genkit';
import {
  AppDataChatInputSchema,
  type AppDataChatInput,
  AppDataChatOutputSchema,
  type AppDataChatOutput,
} from '@/ai/schemas/app-data-chat-schemas';

// Export types for use in actions
export type { AppDataChatInput, AppDataChatOutput };
import { DEFAULT_CHAT_MODEL_ID } from '@/ai/models';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition, loadExamplePrompts } from '@/ai/definition-loader';

// Cache for the single, core prompt object
let coreChatPrompt: any = null;

async function getChatPrompt() {
  const logPrefix = `[AIFlow:getChatPrompt:AppData:Core]`;

  if (coreChatPrompt) {
    return coreChatPrompt;
  }

  // This function now ONLY loads the core app-data-chatbot definition.
  const genericDefinition = await loadDefinition('app-data-chatbot');
  if (genericDefinition.definitionType !== 'llm-prompt') {
    const errorMsg = `Loaded definition for 'app-data-chatbot' is not an LLM prompt type.`;
    throw new Error(errorMsg);
  }
  const promptDefinition = genericDefinition as LlmPromptDefinition;

  const promptString = buildPromptStringFromLlmDefinition(promptDefinition);
  const modelId = promptDefinition.modelId || DEFAULT_CHAT_MODEL_ID;
  const safetySettings = promptDefinition.safetySettings;

  const promptConfig: any = { safetySettings };
  if (promptDefinition.thinkingBudget !== undefined) {
    promptConfig.thinkingConfig = { thinkingBudget: promptDefinition.thinkingBudget };
  }

  const promptOptions: any = {
    name: promptDefinition.promptName,
    input: { schema: AppDataChatInputSchema },
    model: modelId,
    prompt: promptString,
    config: promptConfig,
    output: { schema: AppDataChatOutputSchema },
  };


  const prompt = ai.definePrompt(promptOptions);
  
  coreChatPrompt = prompt; // Cache the single core prompt
  return coreChatPrompt;
}

export async function chatWithBot(input: AppDataChatInput): Promise<AppDataChatOutput> {
  const logPrefix = `[AIFlow:chatWithBot:AppData:Ticker:${input.ticker}:Entry]`;
  try {
    const result = await appDataChatFlow(input);
    return result;
  } catch (error) {
    throw error;
  }
}

const appDataChatFlow = ai.defineFlow(
  {
    name: 'appDataChatFlow',
    inputSchema: AppDataChatInputSchema,
    outputSchema: AppDataChatOutputSchema,
  },
  async (input: AppDataChatInput): Promise<AppDataChatOutput> => {
    const logPrefix = `[AIFlow:appDataChatFlow:Ticker:${input.ticker || 'N/A'}]`;

    let finalInput = { ...input };

    // If a specific promptName is provided (from an example button), load its template
    // and use it as the user input for the single, core chat prompt.
    if (input.promptName) {
        try {
            const examplePrompts = await loadExamplePrompts('example-chat-prompts.json');
            const promptTemplateObj = examplePrompts.find(p => p.promptName === input.promptName);
            if (promptTemplateObj) {
                const templatedUserInput = promptTemplateObj.promptTemplate.replace(/\{TICKER\}/g, input.ticker || 'the stock');
                finalInput.userInput = templatedUserInput; // Overwrite userInput with the template
            } else {
                throw new Error(`Template for prompt name '${input.promptName}' not found in example-chat-prompts.json.`);
            }
        } catch (templateError: any) {
            // Fail gracefully by falling back to the original user input, if any.
            finalInput.userInput = input.userInput || `Error: Could not process template for ${input.promptName}.`;
        }
    }

    try {
      const promptToUse = await getChatPrompt();
      const result = await promptToUse(finalInput); // Use the final, possibly modified, input
      

      const output = result.output;
      if (!output || typeof output.response !== 'string' || output.response.trim() === '') {
        throw new Error('Chatbot AI prompt returned a malformed or empty response.');
      }
      
      // Augment the direct output with the raw response object before returning
      output.rawResponse = result; 
      
      return output;

    } catch (error: any) {
      throw error;
    }
  }
);
