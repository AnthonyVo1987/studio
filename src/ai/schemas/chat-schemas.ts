
/**
 * @fileOverview Zod schemas for the AI Chatbot.
 * Defines the input and output structures for the chatbot flow.
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
  aiAnalyzedTaJson: z // Renamed from aiCalculatedTaJson
    .string()
    .describe('A JSON string of AI-analyzed technical analysis (e.g., pivot points). This provides technical context.'),
  aiOptionsAnalysisJson: z // New field
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

// Example prompts for UI
export const exampleChatPrompts: {title: string; prompt: string}[] = [
    {
        title: "Stock Trader's 3 Takeaways",
        prompt: "Based on all currently available data for {TICKER} (including snapshot, technical indicators, any AI-generated TAs, key takeaways, and options analysis if present), provide 3 concise key takeaways specifically for a stock trader. Focus on actionable insights for short-to-medium term price action, trend, and momentum."
    },
    {
        title: "Options Trader's 3 Takeaways",
        prompt: "Based on all currently available data for {TICKER} (including snapshot, technical indicators, any AI-generated TAs, key takeaways, and especially options analysis if present), provide 3 concise key takeaways specifically for an options trader. Focus on volatility, key support/resistance levels for strike selection, and potential sentiment shifts relevant to options strategies."
    },
    {
        title: "Additional 3 Holistic Takeaways",
        prompt: "Provide 3 additional holistic key takeaways for {TICKER} that are distinct from typical price/trend/indicator summaries and not redundant with other AI analyses already displayed. Consider overall market sentiment reflected in the data, unique patterns in the provided JSONs, or broader implications if context allows. Focus on insights a human analyst might highlight beyond pure numbers."
    }
];
