
/**
 * @fileOverview Zod schemas for the AI Chatbot.
 * Defines the input and output structures for the chatbot flow.
 * Example prompts are now loaded from a separate JSON file.
 */

import {z} from 'zod'; // CRITICAL: Use direct 'zod' import

export const ChatInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol relevant to the chat context.'),
  stockSnapshotJson: z
    .string()
    .describe('A JSON string of the latest stock snapshot data (current day, prev day, etc.). This provides numerical context.'),
  aiKeyTakeawaysJson: z
    .string()
    .describe('A JSON string of AI-generated key takeaways (price action, trend, volatility, momentum, patterns with sentiment). This provides analytical context.'),
  aiAnalyzedTaJson: z 
    .string()
    .describe('A JSON string of AI-analyzed technical analysis (e.g., pivot points). This provides technical context.'),
  aiOptionsAnalysisJson: z 
    .string()
    .optional()
    .describe('An optional JSON string of AI-analyzed options chain data (e.g., call/put walls). This provides options context.'),
  chatHistory: z.array(z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })).optional().describe('Previous turns in the conversation. Optional.'),
  userInput: z.string().describe('The latest question or statement from the user.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;


export const ChatOutputSchema = z.object({
  response: z.string().describe('The chatbot\'s response, formatted in Markdown.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// Example prompts are now loaded from src/ai/prompts/example-chat-prompts.json
// The chatbot.tsx component will handle loading this JSON.
