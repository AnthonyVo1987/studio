'use server';
/**
 * @fileOverview Implements a contextual chatbot flow for stock-related questions.
 * This flow is now intelligent and can handle standard chat, web searches,
 * and other predefined prompts by loading the appropriate prompt definition dynamically
 * based on the 'promptName' input.
 *
 * - chatWithBot - The main function for the chatbot flow.
 * - ChatInput (from schemas) - The input type for the chatWithBot function.
 * - ChatOutput (from schemas) - The return type for the chatWithBot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  ChatInputSchema,
  type ChatInput,
  ChatOutputSchema,
  type ChatOutput,
} from '@/ai/schemas/chat-schemas';
import { DEFAULT_CHAT_MODEL_ID, DEFAULT_ANALYSIS_MODEL_ID } from '@/ai/models';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';
import { extractJsonString } from '@/lib/string-utils';


// Caches for the prompt objects
const promptCache: Record<string, any> = {};

async function getChatPrompt(input: ChatInput) {
  const definitionName = input.promptName || 'stock-chatbot';
  const logPrefix = `[AIFlow:getChatPrompt:${definitionName}]`;

  if (promptCache[definitionName]) {
    console.log(`${logPrefix} Returning cached prompt object.`);
    return { prompt: promptCache[definitionName], isGrounded: promptCache[definitionName].__isGrounded || false };
  }

  const genericDefinition = await loadDefinition(definitionName);
  if (genericDefinition.definitionType !== 'llm-prompt') {
    const errorMsg = `Loaded definition for '${definitionName}' is not an LLM prompt type.`;
    console.error(`${logPrefix} ${errorMsg}`);
    throw new Error(errorMsg);
  }
  const promptDefinition = genericDefinition as LlmPromptDefinition;
  const isGroundedSearch = promptDefinition.useGoogleSearch || false;

  const promptString = buildPromptStringFromLlmDefinition(promptDefinition);
  const modelId = promptDefinition.modelId || DEFAULT_CHAT_MODEL_ID;
  const safetySettings = promptDefinition.safetySettings;

  const promptConfig: any = { safetySettings };
  if (promptDefinition.thinkingBudget !== undefined) {
    promptConfig.thinkingConfig = { thinkingBudget: promptDefinition.thinkingBudget };
  }

  const promptOptions: any = {
    name: promptDefinition.promptName,
    input: { schema: ChatInputSchema },
    model: modelId,
    prompt: promptString,
    config: promptConfig,
  };

  if (isGroundedSearch) {
    promptOptions.tools = [{ tool: 'googleSearch' }];
  } else {
    promptOptions.output = { schema: z.object({ response: z.string() }) };
  }

  console.log(
    `${logPrefix} Defining prompt. Model: ${modelId}, Grounding: ${isGroundedSearch}, ThinkingBudget: ${promptConfig.thinkingConfig?.thinkingBudget ?? 'N/A'}`
  );

  const prompt = ai.definePrompt(promptOptions);
  prompt.__isGrounded = isGroundedSearch; // Attach metadata for the flow
  promptCache[definitionName] = prompt;
  return { prompt, isGrounded: isGroundedSearch };
}

export async function chatWithBot(input: ChatInput): Promise<ChatOutput> {
  const logPrefix = `[AIFlow:chatWithBot:Ticker:${input.ticker}:Entry]`;
  console.log(`${logPrefix} Received request. User input (first 50): "${input.userInput.substring(0, 50)}..."`);
  console.time('chatFlowExecutionTime');
  try {
    const result = await chatFlow(input);
    console.timeEnd('chatFlowExecutionTime');
    return result;
  } catch (error) {
    console.timeEnd('chatFlowExecutionTime');
    throw error;
  }
}

const chatFlow = ai.defineFlow(
  {
    name: 'stockChatBotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input: ChatInput): Promise<ChatOutput> => {
    const logPrefix = `[AIFlow:stockChatBotFlow:Ticker:${input.ticker || 'N/A'}]`;
    console.log(`${logPrefix} Flow execution started. PromptName: ${input.promptName || 'default_chat'}.`);

    try {
      const { prompt: promptToUse, isGrounded } = await getChatPrompt(input);
      const result = await promptToUse(input);
      
      console.log(`${logPrefix} [Tokens] Thoughts: ${result.usageMetadata?.thoughtsTokenCount ?? 'N/A'}, Output: ${result.usageMetadata?.candidatesTokenCount ?? 'N/A'}`);
      if (isGrounded) {
        console.log(`${logPrefix} [Grounding] Search Entries: ${result.usageMetadata?.search?.searchEntries?.length ?? 0}`);
      }

      let responseText: string | undefined;

      if (isGrounded) {
        responseText = result.text;
        const isWebSearchPrompt = input.promptName === 'technical-analysis-web-search' || input.promptName === 'options-flow-web-search';
        
        if (isWebSearchPrompt && responseText) {
          console.log(`${logPrefix} Web Search prompt detected. Raw JSON string received, initiating internal formatting step.`);
          const cleanedJsonString = extractJsonString(responseText);
          
          if (!cleanedJsonString) {
            console.error(`${logPrefix} Could not extract a valid JSON string from the web search response. Returning error.`);
            return { response: "**Error:** Web search returned malformed data.", rawResponse: result };
          }
          
          const searchType = input.promptName === 'technical-analysis-web-search' ? 'TA' : 'Options';
          
          console.log(`${logPrefix} Defining and calling internal formatting prompt for ${searchType}.`);
          const formattingPrompt = ai.definePrompt({
              name: 'inlineWebSearchResultFormatter',
              input: { schema: z.object({ rawJsonString: z.string() }) },
              output: { schema: z.object({ formattedResponse: z.string() }) },
              model: DEFAULT_ANALYSIS_MODEL_ID,
              prompt: `You are a data formatting expert. Your task is to convert a raw JSON string into a human-readable markdown report. Use headings for sections, bullet points for lists, and bold text for labels.

              **Raw Data:**
              {{{rawJsonString}}}
              `,
              config: {
                safetySettings: [
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                ],
                thinkingConfig: { thinkingBudget: -1 },
              },
          });
          
          const formatResult = await formattingPrompt({ rawJsonString: cleanedJsonString });
          
          if (formatResult.output?.formattedResponse) {
             console.log(`${logPrefix} Internal formatting successful. Setting final response text.`);
             responseText = formatResult.output.formattedResponse;
          } else {
            console.error(`${logPrefix} Internal formatting step failed to produce a response.`);
            responseText = "**Error:** Failed to format the data retrieved from the web search.";
          }
        }
      } else {
        responseText = result.output?.response;
      }

      if (!responseText || typeof responseText !== 'string' || responseText.trim() === '') {
        throw new Error('Chatbot AI prompt returned a malformed or empty response.');
      }
      
      console.log(`${logPrefix} Flow successfully executed. Final response (first 50 chars): "${responseText.substring(0, 50)}..."`);
      return { response: responseText, rawResponse: result };

    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL ERROR during prompt execution. Error: ${error.message}`);
      throw error;
    }
  }
);
