
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
    console.log(`${logPrefix} Returning cached prompt object.`);
    return coreChatPrompt;
  }

  // This function now ONLY loads the core app-data-chatbot definition.
  const genericDefinition = await loadDefinition('app-data-chatbot');
  if (genericDefinition.definitionType !== 'llm-prompt') {
    const errorMsg = `Loaded definition for 'app-data-chatbot' is not an LLM prompt type.`;
    console.error(`${logPrefix} ${errorMsg}`);
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

  console.log(
    `${logPrefix} Defining prompt. Model: ${modelId}, Grounding: false, ThinkingBudget: ${promptConfig.thinkingConfig?.thinkingBudget ?? 'N/A'}`
  );

  const prompt = ai.definePrompt(promptOptions);
  
  coreChatPrompt = prompt; // Cache the single core prompt
  return coreChatPrompt;
}

export async function chatWithBot(input: AppDataChatInput): Promise<AppDataChatOutput> {
  const logPrefix = `[AIFlow:chatWithBot:AppData:Ticker:${input.ticker}:Entry]`;
  console.log(`${logPrefix} Received request. User input (first 50): "${input.userInput.substring(0, 50)}..."`);
  console.time('appDataChatFlowExecutionTime');
  try {
    const result = await appDataChatFlow(input);
    console.timeEnd('appDataChatFlowExecutionTime');
    return result;
  } catch (error) {
    console.timeEnd('appDataChatFlowExecutionTime');
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
    console.log(`${logPrefix} Flow execution started. PromptName: ${input.promptName || 'app-data-chatbot'}.`);

    let finalInput = { ...input };

    // If a specific promptName is provided (from an example button), load its template
    // and use it as the user input for the single, core chat prompt.
    if (input.promptName) {
        console.log(`${logPrefix} Handling example prompt: ${input.promptName}. Loading template...`);
        try {
            const examplePrompts = await loadExamplePrompts('example-chat-prompts.json');
            const promptTemplateObj = examplePrompts.find(p => p.promptName === input.promptName);
            if (promptTemplateObj) {
                const templatedUserInput = promptTemplateObj.promptTemplate.replace(/\{TICKER\}/g, input.ticker || 'the stock');
                finalInput.userInput = templatedUserInput; // Overwrite userInput with the template
                console.log(`${logPrefix} Successfully created user input from template for ${input.promptName}.`);
            } else {
                throw new Error(`Template for prompt name '${input.promptName}' not found in example-chat-prompts.json.`);
            }
        } catch (templateError: any) {
            console.error(`${logPrefix} CRITICAL ERROR handling prompt template. Error: ${templateError.message}`);
            // Fail gracefully by falling back to the original user input, if any.
            finalInput.userInput = input.userInput || `Error: Could not process template for ${input.promptName}.`;
        }
    }

    try {
      const promptToUse = await getChatPrompt();
      const result = await promptToUse(finalInput); // Use the final, possibly modified, input
      
      console.log(`${logPrefix} [Tokens] Thoughts: ${result.usageMetadata?.thoughtsTokenCount ?? 'N/A'}, Output: ${result.usageMetadata?.candidatesTokenCount ?? 'N/A'}`);

      const output = result.output;
      if (!output || typeof output.response !== 'string' || output.response.trim() === '') {
        throw new Error('Chatbot AI prompt returned a malformed or empty response.');
      }
      
      // Augment the direct output with the raw response object before returning
      output.rawResponse = result; 
      
      console.log(`${logPrefix} Flow successfully executed. Final response (first 50 chars): "${output.response.substring(0, 50)}..."`);
      return output;

    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL ERROR during prompt execution. Error: ${error.message}`);
      throw error;
    }
  }
);
