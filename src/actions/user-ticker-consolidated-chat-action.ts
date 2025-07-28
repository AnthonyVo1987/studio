'use server';
/**
 * @fileOverview Unified server action for User Ticker consolidated chat interface.
 * Combines both app data and web search capabilities using the modern
 * unified Google GenAI SDK with conditional GoogleSearch tool.
 * 
 * This is a ticker-agnostic version that works with any ticker symbol.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  type UserTickerConsolidatedChatState,
  type UserTickerConsolidatedChatInput,
  type UserTickerConsolidatedChatOutput,
  UserTickerConsolidatedChatInputSchema,
} from '@/ai/schemas/user-ticker-consolidated-chat-schemas';
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
    // Map prompt names to their corresponding definition files for web search
    const promptNameToFile: Record<string, string> = {
      'support-resistance-web-search': 'support-resistance-web-search',
      'technical-analysis-web-search': 'technical-analysis-web-search',
      'options-flow-web-search': 'options-flow-web-search',
      'general': 'web-search-chatbot'
    };

    // Use specific definition file for the prompt, fallback to general web-search-chatbot
    const definitionFile = promptNameToFile[promptName] || 'web-search-chatbot';
    console.log(`[getWebSearchPrompt] Loading definition for promptName: ${promptName}, file: ${definitionFile}`);
    
    const definition = await loadDefinition(definitionFile);
    if (definition.definitionType === 'llm-prompt') {
      const promptDefinition = definition as LlmPromptDefinition;
      const promptString = buildPromptStringFromLlmDefinition(promptDefinition);
      webSearchPromptCache[promptName] = promptString;
      console.log(`[getWebSearchPrompt] Successfully cached prompt for: ${promptName}`);
      return promptString;
    }
  } catch (error) {
    console.error(`Failed to load web search prompt for ${promptName}:`, error);
  }
  
  // Fallback prompt for web search
  console.log(`[getWebSearchPrompt] Using fallback prompt for: ${promptName}`);
  return "You are a helpful AI assistant specializing in stock market analysis. Use web search to find current information and provide comprehensive analysis.";
}

/**
 * Build context data for app data prompts
 */
function buildAppDataContext(input: UserTickerConsolidatedChatInput): string {
  const ticker = input.ticker || 'UNKNOWN';
  const currentDate = extractCurrentDate(input.marketStatusJson);
  
  let context = `**${ticker} Stock Analysis Context (Current Date: ${currentDate})**\n\n`;

  // Add stock snapshot data
  if (input.stockSnapshotJson) {
    try {
      const stockData = JSON.parse(input.stockSnapshotJson);
      context += `**Stock Snapshot Data:**\n\`\`\`json\n${JSON.stringify(stockData, null, 2)}\n\`\`\`\n\n`;
    } catch (e) {
      context += `**Stock Snapshot Data:** [Parse Error]\n\n`;
    }
  }

  // Add market status
  if (input.marketStatusJson) {
    try {
      const marketData = JSON.parse(input.marketStatusJson);
      context += `**Market Status:**\n\`\`\`json\n${JSON.stringify(marketData, null, 2)}\n\`\`\`\n\n`;
    } catch (e) {
      context += `**Market Status:** [Parse Error]\n\n`;
    }
  }

  // Add AI key takeaways if available
  if (input.aiKeyTakeawaysJson) {
    try {
      const takeawaysData = JSON.parse(input.aiKeyTakeawaysJson);
      context += `**AI Key Takeaways:**\n\`\`\`json\n${JSON.stringify(takeawaysData, null, 2)}\n\`\`\`\n\n`;
    } catch (e) {
      context += `**AI Key Takeaways:** [Parse Error]\n\n`;
    }
  }

  // Add AI analyzed TA if available
  if (input.aiAnalyzedTaJson) {
    try {
      const taData = JSON.parse(input.aiAnalyzedTaJson);
      context += `**AI Technical Analysis:**\n\`\`\`json\n${JSON.stringify(taData, null, 2)}\n\`\`\`\n\n`;
    } catch (e) {
      context += `**AI Technical Analysis:** [Parse Error]\n\n`;
    }
  }

  // Add AI options analysis if available
  if (input.aiOptionsAnalysisJson) {
    try {
      const optionsData = JSON.parse(input.aiOptionsAnalysisJson);
      context += `**AI Options Analysis:**\n\`\`\`json\n${JSON.stringify(optionsData, null, 2)}\n\`\`\`\n\n`;
    } catch (e) {
      context += `**AI Options Analysis:** [Parse Error]\n\n`;
    }
  }

  return context;
}

/**
 * Build chat history for context
 */
function buildChatHistory(chatHistory?: Array<{ role: 'user' | 'model'; content: string; id: string }>): string {
  if (!chatHistory || chatHistory.length === 0) {
    return '';
  }

  let historyText = '\n**Previous Conversation:**\n';
  chatHistory.forEach(msg => {
    historyText += `**${msg.role === 'user' ? 'User' : 'Assistant'}:** ${msg.content}\n\n`;
  });
  
  return historyText;
}

export async function userTickerConsolidatedChatAction(
  prevState: UserTickerConsolidatedChatState,
  input: UserTickerConsolidatedChatInput
): Promise<UserTickerConsolidatedChatState> {
  console.log('[userTickerConsolidatedChatAction] Starting request processing');

  try {
    // Validate input
    const validatedInput = UserTickerConsolidatedChatInputSchema.parse(input);
    console.log(`[userTickerConsolidatedChatAction] Validated input for ticker: ${validatedInput.ticker}, webSearch: ${validatedInput.webSearchEnabled}`);

    const ticker = validatedInput.ticker || 'UNKNOWN';
    const currentDate = extractCurrentDate(validatedInput.marketStatusJson);

    // Determine if this is a web search request
    const useWebSearch = validatedInput.webSearchEnabled;
    console.log(`[userTickerConsolidatedChatAction] Using web search: ${useWebSearch}`);

    // Validate user input
    if (!validatedInput.userInput || validatedInput.userInput.trim() === "") {
      throw new Error("User input cannot be empty.");
    }
    // Get appropriate prompt
    const promptName = validatedInput.promptName || (useWebSearch ? 'general' : 'general');
    const systemPrompt = useWebSearch 
      ? await getWebSearchPrompt(promptName)
      : await getAppDataPrompt(promptName);

    // Build user message
    let userMessage = '';
    
    if (validatedInput.userInput) {
      // User input message
      userMessage = validatedInput.userInput;
    } else if (validatedInput.promptName) {
      // Button prompt message
      userMessage = `Please provide ${validatedInput.promptName.replace('-', ' ')} analysis for ${ticker}.`;
    } else {
      userMessage = `Please analyze ${ticker}.`;
    }

    // Add context data for app data requests
    if (!useWebSearch) {
      const contextData = buildAppDataContext(validatedInput);
      userMessage = `${contextData}\n**User Request:** ${userMessage}`;
    } else {
      // For web search, add ticker and date context
      userMessage = `**Analysis Request for ${ticker} (Current Date: ${currentDate})**\n\n${userMessage}`;
    }

    // Add chat history
    const chatHistoryText = buildChatHistory(validatedInput.chatHistory);
    if (chatHistoryText) {
      userMessage = `${userMessage}${chatHistoryText}`;
    }

    console.log(`[userTickerConsolidatedChatAction] System prompt preview: ${systemPrompt.substring(0, 100)}...`);
    console.log(`[userTickerConsolidatedChatAction] User message preview: ${userMessage.substring(0, 200)}...`);

    // Configure model
    const modelConfig = {
      model: useWebSearch ? 'gemini-2.0-flash-exp' : 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      },
      ...(useWebSearch && {
        tools: [{ googleSearch: {} }] as any[] // Enable Google Search tool conditionally
      })
    };

    const model = genAI.getGenerativeModel(modelConfig);

    // Generate response
    console.log(`[userTickerConsolidatedChatAction] Generating response with model: ${modelConfig.model}`);
    
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ],
      systemInstruction: systemPrompt,
    });

    const response = await result.response;
    const responseText = response.text();

    // Check if web search was actually used
    const groundingMetadata = (response as any).groundingMetadata || null;
    const webSearchUsed = useWebSearch && !!groundingMetadata;

    console.log(`[userTickerConsolidatedChatAction] Generated response length: ${responseText.length}`);
    console.log(`[userTickerConsolidatedChatAction] Web search actually used: ${webSearchUsed}`);

    // Create output data
    const outputData: UserTickerConsolidatedChatOutput = {
      response: responseText,
      webSearchUsed,
      groundingMetadata,
      rawResponse: response
    };

    const resultData = {
      requestJson: JSON.stringify(validatedInput),
      responseJson: JSON.stringify(outputData)
    };

    console.log('[userTickerConsolidatedChatAction] Request completed successfully');

    return {
      status: 'success',
      data: resultData,
      error: null,
      message: 'Chat response generated successfully'
    };

  } catch (error) {
    console.error('[userTickerConsolidatedChatAction] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      status: 'error',
      data: undefined,
      error: errorMessage,
      message: 'Failed to generate chat response'
    };
  }
}