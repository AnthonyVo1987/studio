/**
 * @fileOverview Zod schemas for the AI Chatbot.
 * Defines the input and output structures for the chatbot flow.
 */

import {z} from 'zod';

export const ChatInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol relevant to the chat context.'),
  stockSnapshotJson: z
    .string()
    .describe('A JSON string of the latest stock snapshot data (current day, prev day, etc.). This provides numerical context.'),
  aiKeyTakeawaysJson: z
    .string()
    .describe('A JSON string of AI-generated key takeaways (price action, trend, volatility, momentum, patterns with sentiment). This provides analytical context.'),
  aiCalculatedTaJson: z
    .string()
    .describe('A JSON string of AI-calculated technical analysis (e.g., pivot points). This provides technical context.'),
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

// Example prompts for UI (as per PRD Section 2.2 - AI Chatbot Interface)
export const exampleChatPrompts: {title: string; prompt: string}[] = [
    { title: "Current Price?", prompt: "What is the current price of {TICKER}?" },
    { title: "Explain Pivot Points", prompt: "Can you explain the pivot points for {TICKER}?" },
    { title: "Summarize Analysis", prompt: "Give me a quick summary of your analysis for {TICKER}." },
    { title: "Recent Trend?", prompt: "What's the recent trend for {TICKER} according to your takeaways?" },
];
