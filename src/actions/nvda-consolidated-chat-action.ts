'use server';
/**
 * @fileOverview Unified server action for NVDA consolidated chat interface.
 * Combines both app data and web search capabilities using the modern
 * unified Google GenAI SDK with conditional GoogleSearch tool.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  type NvdaConsolidatedChatState,
  type NvdaConsolidatedChatInput,
  type NvdaConsolidatedChatOutput,
  NvdaConsolidatedChatInputSchema,
} from '@/ai/schemas/nvda-consolidated-chat-schemas';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition, loadExamplePrompts } from '@/ai/definition-loader';

// Initialize Google GenAI SDK
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}
const genAI = new GoogleGenerativeAI(apiKey);

// Cache for app data prompt templates
let appDataPromptCache: Record<string, string> = {};
let webSearchPromptCache: Record<string, string> = {};

/**
 * Load and cache prompt templates for app data prompts
 */
async function getAppDataPrompt(promptName: string): Promise<string> {
  if (appDataPromptCache[promptName]) {
    return appDataPromptCache[promptName];
  }

  try {
    // Map prompt names to their corresponding definition files
    const promptNameToFile: Record<string, string> = {
      'stock-trader-takeaways': 'stock-trader-takeaways',
      'options-trader-takeaways': 'options-trader-takeaways', 
      'holistic-takeaways': 'holistic-takeaways',
      'general': 'app-data-chatbot'
    };

    // Use specific definition file for the prompt, fallback to general app-data-chatbot
    const definitionFile = promptNameToFile[promptName] || 'app-data-chatbot';
    console.log(`[getAppDataPrompt] Loading definition for promptName: ${promptName}, file: ${definitionFile}`);
    
    const definition = await loadDefinition(definitionFile);
    if (definition.definitionType === 'llm-prompt') {
      const promptDefinition = definition as LlmPromptDefinition;
      const promptString = buildPromptStringFromLlmDefinition(promptDefinition);
      appDataPromptCache[promptName] = promptString;
      console.log(`[getAppDataPrompt] Successfully cached prompt for: ${promptName}`);
      return promptString;
    }
  } catch (error) {
    console.error(`Failed to load app data prompt for ${promptName}:`, error);
  }
  
  // Fallback prompt
  console.log(`[getAppDataPrompt] Using fallback prompt for: ${promptName}`);
  return "You are a helpful AI assistant specializing in stock market analysis. Use the provided context data to answer the user's question accurately and concisely.";
}

/**
 * Extract current date from market status data for date grounding
 */
function extractCurrentDate(marketStatusJson?: string): string {
  try {
    if (marketStatusJson) {
      const marketData = JSON.parse(marketStatusJson);
      if (marketData.serverTime) {
        const date = new Date(marketData.serverTime);
        // Format as mm/dd/yyyy
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }
    }
  } catch (error) {
    console.log('[extractCurrentDate] Failed to parse market status for date:', error);
  }
  
  // Fallback to current date
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const year = now.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Load and cache prompt templates for web search prompts
 */
async function getWebSearchPrompt(promptName: string): Promise<string> {
  if (webSearchPromptCache[promptName]) {
    return webSearchPromptCache[promptName];
  }

  try {
    const examplePrompts = await loadExamplePrompts('example-web-search-prompts.json');
    const promptData = examplePrompts.find(p => p.promptName === promptName);
    if (promptData) {
      webSearchPromptCache[promptName] = promptData.promptTemplate;
      return promptData.promptTemplate;
    }
  } catch (error) {
    console.error(`Failed to load web search prompt for ${promptName}:`, error);
  }

  // Fallback prompt
  return "You are a helpful AI assistant with access to current web information. Use Google Search to find the most recent and relevant information to answer the user's question.";
}

/**
 * Build date-grounded web search system instruction
 */
function buildWebSearchSystemInstruction(promptTemplate: string, currentDate: string): string {
  const dateGroundingHeader = `CURRENT DATE: ${currentDate}\n\n`;
  const searchInstructions = `\n\nIMPORTANT: When using Google Search, include "as of ${currentDate}" in your search queries to find the most current and recent information. This ensures results are filtered for up-to-date data.`;
  
  return dateGroundingHeader + promptTemplate + searchInstructions;
}

/**
 * Build context string for app data prompts
 */
function buildAppDataContext(payload: NvdaConsolidatedChatInput): string {
  const contextParts: string[] = [];
  
  if (payload.stockSnapshotJson) {
    contextParts.push(`STOCK SNAPSHOT DATA:\n${payload.stockSnapshotJson}`);
  }
  
  if (payload.aiKeyTakeawaysJson) {
    contextParts.push(`AI KEY TAKEAWAYS:\n${payload.aiKeyTakeawaysJson}`);
  }
  
  if (payload.aiAnalyzedTaJson) {
    contextParts.push(`AI TECHNICAL ANALYSIS:\n${payload.aiAnalyzedTaJson}`);
  }
  
  if (payload.aiOptionsAnalysisJson) {
    contextParts.push(`AI OPTIONS ANALYSIS:\n${payload.aiOptionsAnalysisJson}`);
  }
  
  if (payload.marketStatusJson) {
    contextParts.push(`MARKET STATUS:\n${payload.marketStatusJson}`);
  }

  return contextParts.length > 0 ? `\n\nCONTEXT DATA:\n${contextParts.join('\n\n')}` : '';
}

/**
 * Build chat history for model context
 */
function buildChatHistory(chatHistory?: Array<{role: 'user' | 'model'; content: string; id: string}>): Array<{role: 'user' | 'model'; parts: [{text: string}]}> {
  if (!chatHistory || chatHistory.length === 0) {
    return [];
  }

  return chatHistory.map(message => ({
    role: message.role,
    parts: [{ text: message.content }]
  }));
}

/**
 * Main unified chat action
 */
export async function nvdaConsolidatedChatAction(
  prevState: NvdaConsolidatedChatState,
  payload: NvdaConsolidatedChatInput
): Promise<NvdaConsolidatedChatState> {
  const actionLogPrefix = `[ServerAction:nvdaConsolidatedChatAction:${payload.promptName || 'user_input'}]`;
  
  // Validate input
  try {
    NvdaConsolidatedChatInputSchema.parse(payload);
  } catch (error) {
    return {
      status: 'error',
      error: 'Invalid input parameters',
      message: 'Please check your input and try again.',
    };
  }

  // Create request payload for logging
  const requestPayload = {
    ticker: payload.ticker,
    promptName: payload.promptName,
    webSearchEnabled: payload.webSearchEnabled,
    userInput: payload.userInput,
    hasContext: !!(payload.stockSnapshotJson || payload.aiKeyTakeawaysJson || payload.aiAnalyzedTaJson),
  };
  const requestJson = JSON.stringify(requestPayload, null, 2);

  try {
    console.log(`${actionLogPrefix} Starting unified chat request`);
    
    // Validate user input
    if (!payload.userInput || payload.userInput.trim() === '') {
      throw new Error('User input cannot be empty.');
    }

    // Configure model with conditional GoogleSearch tool (Tool type, not FunctionDeclarationsTool)
    const tools = payload.webSearchEnabled ? [{
      googleSearch: {} // GoogleSearch tool configuration
    }] as any[] : [];
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      tools,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      }
    });

    // Extract current date for web search grounding
    const currentDate = extractCurrentDate(payload.marketStatusJson);
    console.log(`${actionLogPrefix} Extracted current date for grounding: ${currentDate}`);

    // Build system instruction based on prompt type
    let systemInstruction = '';
    let finalUserInput = payload.userInput;

    if (payload.promptName) {
      if (payload.webSearchEnabled) {
        // Web search prompt with date grounding
        const promptTemplate = await getWebSearchPrompt(payload.promptName);
        systemInstruction = buildWebSearchSystemInstruction(promptTemplate, currentDate);
        finalUserInput = promptTemplate.replace(/\{TICKER\}/g, payload.ticker || 'the stock');
      } else {
        // App data prompt
        const promptTemplate = await getAppDataPrompt(payload.promptName);
        systemInstruction = promptTemplate;
        const contextData = buildAppDataContext(payload);
        finalUserInput = payload.userInput + contextData;
      }
    } else {
      // User input prompt
      if (payload.webSearchEnabled) {
        const promptTemplate = await getWebSearchPrompt('general');
        systemInstruction = buildWebSearchSystemInstruction(promptTemplate, currentDate);
      } else {
        systemInstruction = await getAppDataPrompt('general');
        const contextData = buildAppDataContext(payload);
        finalUserInput = payload.userInput + contextData;
      }
    }

    // Build conversation history
    const history = buildChatHistory(payload.chatHistory);

    // Generate content
    console.log(`${actionLogPrefix} Generating content with webSearch: ${payload.webSearchEnabled}`);
    const result = await model.generateContent({
      contents: [
        ...history,
        {
          role: 'user',
          parts: [{ text: finalUserInput }]
        }
      ],
      systemInstruction: systemInstruction,
    });

    const response = result.response;
    const responseText = response.text();
    
    // Extract grounding metadata if available
    const groundingMetadata = (response as any).groundingMetadata || null;
    const webSearchUsed = payload.webSearchEnabled && !!groundingMetadata;

    // Prepare output
    const outputData: NvdaConsolidatedChatOutput = {
      response: responseText,
      webSearchUsed,
      groundingMetadata,
      rawResponse: response,
    };

    const responseJson = JSON.stringify(outputData, null, 2);

    console.log(`${actionLogPrefix} Successfully generated response`);

    return {
      status: 'success',
      data: {
        requestJson,
        responseJson,
      },
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`${actionLogPrefix} Error:`, error);

    return {
      status: 'error',
      error: errorMessage,
      message: 'Failed to generate chat response. Please try again.',
      data: {
        requestJson,
        responseJson: JSON.stringify({ error: errorMessage }, null, 2),
      },
    };
  }
}