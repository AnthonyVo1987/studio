
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

// Example prompts for UI
export const exampleChatPrompts: {title: string; prompt: string}[] = [
    {
        title: "Stock Trader's 3 Takeaways",
        prompt: "Based on all currently available data for {TICKER} (including snapshot, pivot points, MAs, RSI, MACD, key takeaways, and options analysis if present), provide 3 concise key takeaways specifically for a stock trader. Focus on: 1. Actionable insights for short-to-medium term price action. 2. Potential entry or exit points considering support/resistance and key levels. 3. Overall trend and momentum considerations."
    },
    {
        title: "Options Trader's 3 Takeaways",
        prompt: "Based on all currently available data for {TICKER} (snapshot, TAs, AI Key Takeaways, and especially options analysis like Call/Put Walls), provide 3 concise key takeaways for an options trader. Focus on: 1. Volatility assessment and its implications. 2. Key support/resistance levels (from TAs and Options Walls) for strike selection. 3. Suggest one or two example directional option trade ideas (e.g., 'Consider buying {TICKER} $XXX Calls expiring YYY based on Z' or 'A Put spread around $ABC might be interesting if D happens') with brief rationale based *only* on the provided data. Do NOT invent expiration dates or exact strike prices if not deducible; speak in general terms if necessary."
    },
    {
        title: "Additional 3 Holistic Takeaways",
        prompt: "Provide 3 additional holistic key takeaways for {TICKER} that are distinct from typical price/trend/indicator summaries and not redundant with other AI analyses already displayed. Consider overall market sentiment reflected in the data, unique patterns in the provided JSONs, or broader implications if context allows. Ensure you provide three full, distinct takeaways. Focus on insights a human analyst might highlight beyond pure numbers."
    }
];
