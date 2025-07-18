
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

import { logger } from '@/lib/logger';
import { ai } from '@/ai/genkit';
import {
  AppDataChatInputSchema,
  type AppDataChatInput,
  AppDataChatOutputSchema,
  type AppDataChatOutput,
} from '@/ai/schemas/app-data-chat-schemas';
import { DEFAULT_CHAT_MODEL_ID } from '@/ai/models';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition, loadExamplePrompts } from '@/ai/definition-loader';

// Cache for the single, core prompt object
let coreChatPrompt: any = null;

async function getChatPrompt() {
  const logPrefix = `[AIFlow:getChatPrompt:AppData:Core]`;

  if (coreChatPrompt) {
    logger.debug(`${logPrefix} Returning cached prompt object.`);
    return coreChatPrompt;
  }

  // This function now ONLY loads the core app-data-chatbot definition.
  const genericDefinition = await loadDefinition('app-data-chatbot');
  if (genericDefinition.definitionType !== 'llm-prompt') {
    const errorMsg = `Loaded definition for 'app-data-chatbot' is not an LLM prompt type.`;
    logger.error(`${logPrefix} ${errorMsg}`);
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

  logger.info(`${logPrefix} Defining prompt.`, {
    modelId,
    grounding: false,
    thinkingBudget: promptConfig.thinkingConfig?.thinkingBudget ?? 'N/A'
  });

  const prompt = ai.definePrompt(promptOptions);
  
  coreChatPrompt = prompt; // Cache the single core prompt
  return coreChatPrompt;
}

export async function chatWithBot(input: AppDataChatInput): Promise<AppDataChatOutput> {
  const startTime = Date.now();
  const logPrefix = `[AIFlow:chatWithBot:AppData:Ticker:${input.ticker}:Entry]`;
  logger.info(`${logPrefix} Received request.`, {
    userInputStart: input.userInput.substring(0, 50)
  });
  try {
    const result = await appDataChatFlow(input);
    const duration = Date.now() - startTime;
    logger.info(`${logPrefix} Flow execution completed in ${duration}ms.`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${logPrefix} Flow execution failed after ${duration}ms.`);
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
    logger.info(`${logPrefix} Flow execution started.`, {
      promptName: input.promptName || 'app-data-chatbot'
    });

    let finalInput = { ...input };

    // If a specific promptName is provided (from an example button), load its template
    // and use it as the user input for the single, core chat prompt.
    if (input.promptName) {
        logger.info(`${logPrefix} Handling example prompt.`, {
          promptName: input.promptName
        });
        try {
            const examplePrompts = await loadExamplePrompts('example-chat-prompts.json');
            const promptTemplateObj = examplePrompts.find(p => p.promptName === input.promptName);
            if (promptTemplateObj) {
                const templatedUserInput = promptTemplateObj.promptTemplate.replace(/\{TICKER\}/g, input.ticker || 'the stock');
                finalInput.userInput = templatedUserInput; // Overwrite userInput with the template
                logger.info(`${logPrefix} Successfully created user input from template.`);
            } else {
                throw new Error(`Template for prompt name '${input.promptName}' not found in example-chat-prompts.json.`);
            }
        } catch (templateError: any) {
            logger.error(`${logPrefix} CRITICAL ERROR handling prompt template.`, {
              error: templateError.message
            });
            // Fail gracefully by falling back to the original user input, if any.
            finalInput.userInput = input.userInput || `Error: Could not process template for ${input.promptName}.`;
        }
    }

    try {
      const promptToUse = await getChatPrompt();
      const result = await promptToUse(finalInput); // Use the final, possibly modified, input
      
      logger.debug(`${logPrefix} [Tokens]`, {
        thoughts: result.usageMetadata?.thoughtsTokenCount ?? 'N/A',
        output: result.usageMetadata?.candidatesTokenCount ?? 'N/A'
      });

      const output = result.output;
      if (!output || typeof output.response !== 'string' || output.response.trim() === '') {
        throw new Error('Chatbot AI prompt returned a malformed or empty response.');
      }
      
      // Augment the direct output with the raw response object before returning
      output.rawResponse = result; 
      
      logger.info(`${logPrefix} Flow successfully executed.`, {
        responseStart: output.response.substring(0, 50)
      });
      return output;

    } catch (error: any) {
      logger.error(`${logPrefix} CRITICAL ERROR during prompt execution.`, {
        error: error.message
      });
      throw error;
    }
  }
);
