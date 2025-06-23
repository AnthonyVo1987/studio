
/**
 * @fileOverview Zod schemas for the AI Chatbot.
 * Defines the input and output structures for the chatbot flow.
 * Example prompts are now loaded from a separate JSON file.
 */

import {z} from 'zod'; // CRITICAL: Use direct 'zod' import

export const ChatInputSchema = z.object({
  ticker: z.string().optional().describe('The stock ticker symbol relevant to the chat context. Optional if grounding is used for general queries.'),
  stockSnapshotJson: z
    .string()
    .optional()
    .describe('A JSON string of the latest stock snapshot data (current day, prev day, etc.). Optional.'),
  aiKeyTakeawaysJson: z
    .string()
    .optional()
    .describe('A JSON string of AI-generated key takeaways (price action, trend, volatility, momentum, patterns with sentiment). Optional.'),
  aiAnalyzedTaJson: z 
    .string()
    .optional()
    .describe('A JSON string of AI-analyzed technical analysis (e.g., pivot points). Optional.'),
  aiOptionsAnalysisJson: z 
    .string()
    .optional()
    .describe('An optional JSON string of AI-analyzed options chain data (e.g., call/put walls).'),
  chatHistory: z.array(z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })).optional().describe('Previous turns in the conversation. Optional.'),
  userInput: z.string().describe('The latest question or statement from the user.'),
  isChatGroundingEnabled: z.boolean().optional().describe('When true, the model should use Google Search to ground its response with real-time information.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;


export const ChatOutputSchema = z.object({
  response: z.string().optional().describe('The chatbot\'s text response, formatted in Markdown.'),
  rawResponse: z.any().optional().describe('The full raw response object from the Genkit API, including grounding metadata.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// Example prompts are now loaded from src/ai/prompts/example-chat-prompts.json
// The chatbot.tsx component will handle loading this JSON.
