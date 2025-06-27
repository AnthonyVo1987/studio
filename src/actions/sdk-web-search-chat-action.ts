
'use server';
/**
 * @fileOverview A server action for handling web-grounded chat requests using the
 * raw Google AI SDK, bypassing the Genkit wrapper for this specific feature.
 * It formats the AI's response into user-friendly markdown.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  buildPromptStringFromLlmDefinition,
  LlmPromptDefinitionSchema,
} from '@/ai/definition-loader';
import {
  formatResponseToMarkdown,
} from '@/lib/string-utils';
import {
  type SdkWebSearchChatActionState,
  type SdkWebSearchChatActionInputs,
} from '@/ai/schemas/sdk-web-search-chat-schemas';


// Ensure API key is available
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}
const genAI = new GoogleGenerativeAI(apiKey);
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


export async function sdkWebSearchChatAction(
  prevState: SdkWebSearchChatActionState,
  payload: SdkWebSearchChatActionInputs
): Promise<SdkWebSearchChatActionState> {
  const { promptName, userInput, ticker } = payload;
  const actionLogPrefix = `[ServerAction:sdkWebSearchChatAction:${promptName || 'user_input'}]`;
  console.log(`${actionLogPrefix} Received request.`);

  const requestJson = JSON.stringify(payload, null, 2);

  try {
    let currentPrompt: string;
    
    if (promptName) {
        currentPrompt = await loadPromptText(promptName, ticker);
    } else {
        if (!userInput || userInput.trim() === '') {
            throw new Error("User input cannot be empty for a general web search query.");
        }
        currentPrompt = userInput;
    }

    console.log(`${actionLogPrefix} Generating content with prompt (first 100): ${currentPrompt.substring(0, 100)}...`);
    const result = await groundedModel.generateContent(currentPrompt);
    const rawTextResponse = result.response.text();

    console.log(`${actionLogPrefix} SDK call successful. Formatting response.`);
    const formattedResponse = formatResponseToMarkdown(
      rawTextResponse,
      promptName,
      ticker
    );
    
    const responseJson = JSON.stringify({ response: formattedResponse, rawResponse: rawTextResponse }, null, 2);

    return {
      status: 'success',
      data: { requestJson, responseJson },
      message: `SDK Web Search for '${promptName || 'user query'}' succeeded.`,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} CRITICAL Error: ${error.message}`);
    return {
      status: 'error',
      error: error.message,
      message: `SDK Web Search failed.`,
      data: {
        requestJson,
        responseJson: JSON.stringify({ error: error.message, details: String(error) }, null, 2),
      },
    };
  }
}
