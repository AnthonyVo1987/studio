'use server';

/**
 * @fileOverview Implements a contextual chatbot flow for stock-related questions.
 *
 * - chatWithBot - The main function for the chatbot flow.
 * - ChatInput - The input type for the chatWithBot function.
 * - ChatOutput - The return type for the chatWithBot function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';
import {DEFAULT_CHAT_MODEL_ID} from '@/ai/models';

const ChatInputSchema = z.object({
  ticker: z.string().describe('The ticker symbol of the stock.'),
  stockSnapshotJson: z.string().describe('The latest stock snapshot data in JSON format.'),
  aiKeyTakeawaysJson: z.string().describe('AI-generated key takeaways in JSON format.'),
  aiCalculatedTaJson: z.string().describe('AI-calculated technical analysis in JSON format.'),
  userInput: z.string().describe('The user input question regarding the stock.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user input.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chatWithBot(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: ChatInputSchema},
  output: {schema: ChatOutputSchema},
  model: DEFAULT_CHAT_MODEL_ID,
  prompt: `You are a financial expert chatbot providing insights on stocks.
  You will be provided with the latest stock data, AI-generated key takeaways, and technical analysis.
  Use this information to answer the user's question about the stock.

  Stock Ticker: {{{ticker}}}
  Latest Stock Data: {{{stockSnapshotJson}}}
  AI Key Takeaways: {{{aiKeyTakeawaysJson}}}
  AI Technical Analysis: {{{aiCalculatedTaJson}}}

  User Question: {{{userInput}}}

  Provide a clear and concise answer, formatted with markdown and emojis where appropriate.
  If the answer is not available in the context, respond politely that you can not answer.
  Adhere to the formatting requested by the user, such as monetary values formatted to two decimal places and prefixed with "$".`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
