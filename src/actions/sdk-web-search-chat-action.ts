
'use server';
/**
 * @fileOverview A server action for handling web-grounded chat requests using the
 * raw Google AI SDK, bypassing the Genkit wrapper for this specific feature.
 * It returns the AI's raw text response.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
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


export async function sdkWebSearchChatAction(
  prevState: SdkWebSearchChatActionState,
  payload: SdkWebSearchChatActionInputs
): Promise<SdkWebSearchChatActionState> {
  const {
    ticker,
    promptName,
    userInput
  } = payload;

  const actionLogPrefix = `[ServerAction:sdkWebSearchChatAction:${promptName || 'user_input'}]`;
  console.log(`${actionLogPrefix} Received request.`);
  
  const requestPayloadForLogging = {
      ticker,
      promptName,
      userInput,
  };
  const requestJson = JSON.stringify(requestPayloadForLogging, null, 2);

  try {
    const finalUserInput = userInput;
    if (!finalUserInput || finalUserInput.trim() === '') {
        throw new Error("User input cannot be empty for a web search query.");
    }
    
    console.log(`${actionLogPrefix} Generating content with prompt (first 100): ${finalUserInput.substring(0, 100)}...`);
    const result = await groundedModel.generateContent(finalUserInput);
    const rawTextResponse = result.response.text();

    console.log(`${actionLogPrefix} SDK call successful. Returning raw text response.`);
    
    const responseJson = JSON.stringify({ response: rawTextResponse }, null, 2);

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
