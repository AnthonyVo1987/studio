
/**
 * @fileOverview Zod schemas for the App Data AI Chatbot.
 * Defines the input and output structures for the non-grounded chatbot flow.
 */

import {z} from 'zod';

export const AppDataChatInputSchema = z.object({
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
      id: z.string(), // Added ID for completeness
    })).optional().describe('Previous turns in the conversation. Optional.'),
  userInput: z.string().describe('The latest question or statement from the user, or the full text from a prompt template.'),
  promptName: z.string().optional().describe("The name of the specific prompt definition to use (e.g., 'stock-trader-takeaways'). If omitted, defaults to general app data chat."),
});
export type AppDataChatInput = z.infer<typeof AppDataChatInputSchema>;


export const AppDataChatOutputSchema = z.object({
  response: z.string().optional().describe('The chatbot\'s text response, formatted in Markdown.'),
  rawResponse: z.any().optional().describe('The full raw response object from the Genkit API, including grounding metadata.'),
});
export type AppDataChatOutput = z.infer<typeof AppDataChatOutputSchema>;
