/**
 * @fileOverview Defines custom Genkit tools that wrap existing prompt definitions.
 * This allows the agentic orchestrator to use the application's predefined
 * analysis prompts as distinct capabilities.
 */

import { defineTool } from 'genkit/tool';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';
import { DEFAULT_ANALYSIS_MODEL_ID } from '@/ai/models';

// Initialize Google GenAI SDK
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}
const genAI = new GoogleGenerativeAI(apiKey);

// Cache for prompt templates to avoid reloading from disk
const promptCache: Record<string, LlmPromptDefinition> = {};

/**
 * A helper function to load and cache a prompt definition.
 */
async function getPromptDefinition(promptName: string): Promise<LlmPromptDefinition> {
  if (promptCache[promptName]) {
    return promptCache[promptName];
  }
  const definition = await loadDefinition(promptName);
  if (definition.definitionType !== 'llm-prompt') {
    throw new Error(`Definition for '${promptName}' is not an LLM prompt.`);
  }
  promptCache[promptName] = definition;
  return definition;
}

/**
 * Builds the data context string to be injected into a prompt.
 * This is similar to the logic in the original chat actions.
 */
function buildDataContext(context: any): string {
    const contextParts: string[] = [];
    if (context.stockSnapshotJson) {
        contextParts.push(`STOCK SNAPSHOT DATA:\\n${context.stockSnapshotJson}`);
    }
    if (context.aiKeyTakeawaysJson) {
        contextParts.push(`AI KEY TAKEAWAYS:\\n${context.aiKeyTakeawaysJson}`);
    }
    if (context.aiAnalyzedTaJson) {
        contextParts.push(`AI TECHNICAL ANALYSIS:\\n${context.aiAnalyzedTaJson}`);
    }
    if (context.aiOptionsAnalysisJson) {
        contextParts.push(`AI OPTIONS ANALYSIS:\\n${context.aiOptionsAnalysisJson}`);
    }
    if (context.marketStatusJson) {
        contextParts.push(`MARKET STATUS:\\n${context.marketStatusJson}`);
    }
    return contextParts.length > 0 ? `\\n\\nCONTEXT DATA:\\n${contextParts.join('\\n\\n')}` : '';
}

/**
 * A generic tool executor that can run any prompt definition.
 */
async function executePromptAsTool(promptName: string, input: any) {
    const logPrefix = `[PromptTool:${promptName}]`;
    try {
        console.log(`${logPrefix} Executing tool with input:`, input);

        // 1. Load the prompt definition
        const definition = await getPromptDefinition(promptName);
        const systemInstruction = buildPromptStringFromLlmDefinition(definition);

        // 2. Build the context and user input
        const contextData = buildDataContext(input);
        // The user input for a tool is typically the description of the task itself.
        const userInput = definition.description + contextData;

        // 3. Configure and call the model
        const model = genAI.getGenerativeModel({
            model: definition.modelId || DEFAULT_ANALYSIS_MODEL_ID,
            generationConfig: {
                temperature: definition.temperature ?? 0.2,
                maxOutputTokens: definition.maxOutputTokens ?? 2048,
                topP: definition.topP,
                topK: definition.topK,
                candidateCount: 1,
            },
            safetySettings: definition.safetySettings,
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userInput }] }],
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
        });

        const responseText = result.response.text();
        console.log(`${logPrefix} Successfully generated response.`);
        return responseText;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`${logPrefix} Error executing tool:`, error);
        return `Error executing tool ${promptName}: ${errorMessage}`;
    }
}

// Define the input schema for our prompt-based tools.
// They all need a ticker and the optional context data.
const ToolInputSchema = z.object({
    ticker: z.string().describe('The stock ticker symbol, e.g., NVDA or SPY.'),
    stockSnapshotJson: z.string().optional().describe('JSON string of the stock snapshot data.'),
    aiKeyTakeawaysJson: z.string().optional().describe('JSON string of AI key takeaways.'),
    aiAnalyzedTaJson: z.string().optional().describe('JSON string of AI analyzed technical analysis.'),
    aiOptionsAnalysisJson: z.string().optional().describe('JSON string of AI options analysis.'),
    marketStatusJson: z.string().optional().describe('JSON string of the market status.'),
});


// Now, define the specific tools the agent can use.

export const stockTraderTakeawaysTool = defineTool({
    name: 'stockTraderTakeaways',
    description: "Generates actionable takeaways for a stock trader based on the available market data. Use this when a user asks for stock trading insights, takeaways, or a summary from a trader's perspective.",
    inputSchema: ToolInputSchema,
    outputSchema: z.string(),
    async execute(input) {
        return executePromptAsTool('stock-trader-takeaways', input);
    },
});

export const optionsTraderTakeawaysTool = defineTool({
    name: 'optionsTraderTakeaways',
    description: "Generates actionable takeaways for an options trader based on the available market and options chain data. Use this when a user asks for options trading insights, takeaways, or an analysis of the options market.",
    inputSchema: ToolInputSchema,
    outputSchema: z.string(),
    async execute(input) {
        return executePromptAsTool('options-trader-takeaways', input);
    },
});

export const holisticTakeawaysTool = defineTool({
    name: 'holisticTakeaways',
    description: "Generates a holistic, high-level summary of the stock's situation, combining technical, fundamental, and options data. Use this for broad, open-ended questions about the stock's overall picture.",
    inputSchema: ToolInputSchema,
    outputSchema: z.string(),
    async execute(input) {
        return executePromptAsTool('holistic-takeaways', input);
    },
});

// A list of all prompt-based tools for easy import into the orchestrator.
export const allPromptTools = [
    stockTraderTakeawaysTool,
    optionsTraderTakeawaysTool,
    holisticTakeawaysTool,
];
