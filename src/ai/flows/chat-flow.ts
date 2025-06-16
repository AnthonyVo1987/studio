
'use server';
/**
 * @fileOverview Implements a contextual chatbot flow for stock-related questions.
 * This flow uses provided stock data, AI analysis, and chat history to respond to user queries.
 *
 * - chatWithBot - The main function for the chatbot flow.
 * - ChatInput (from schemas) - The input type for the chatWithBot function.
 * - ChatOutput (from schemas) - The return type for the chatWithBot function.
 */

import {ai} from '@/ai/genkit';
import {
  ChatInputSchema,
  type ChatInput,
  ChatOutputSchema,
  type ChatOutput,
} from '@/ai/schemas/chat-schemas';
import {DEFAULT_CHAT_MODEL_ID} from '@/ai/models';

export async function chatWithBot(input: ChatInput): Promise<ChatOutput> {
  console.log('[AIFlow:chatWithBot] Received request for ticker:', input.ticker, 'User input (first 50):', input.userInput.substring(0,50), 'History length:', input.chatHistory?.length || 0);
  return chatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'stockChatBotPrompt',
  input: {schema: ChatInputSchema},
  output: {schema: ChatOutputSchema},
  model: DEFAULT_CHAT_MODEL_ID,
  prompt: `You are StockSage, a friendly and knowledgeable financial assistant chatbot.
Your expertise is in analyzing stock data and explaining it clearly to users.
You do NOT have access to real-time external web information or any data beyond what is provided in this context.
Politely decline any requests for information outside of the provided context (e.g., news, other tickers not in context, predictions).

You will be provided with the following contextual information for the stock: {{ticker}}
1.  **Stock Snapshot JSON:** {{{stockSnapshotJson}}} (Contains current and previous day prices, volume, etc.)
2.  **AI Key Takeaways JSON:** {{{aiKeyTakeawaysJson}}} (Contains AI-generated analysis on price action, trend, volatility, momentum, and patterns, along with sentiment.)
3.  **AI Analyzed TA JSON:** {{{aiAnalyzedTaJson}}} (Contains AI-analyzed technical analysis like pivot points.) 
{{#if aiOptionsAnalysisJson}}
4.  **AI Options Analysis JSON:** {{{aiOptionsAnalysisJson}}} (Contains AI-identified call/put walls from options data. If empty or "{}", no significant walls were identified or data was unavailable.)
{{/if}}

{{#if chatHistory.length}}
Conversation History:
{{#each chatHistory}}
{{this.role}}: {{this.content}}
{{/each}}
{{/if}}

User's Current Input: {{{userInput}}}

Based ONLY on the provided contextual information and conversation history (if any):
- Answer the user's question comprehensively.
- If the question cannot be answered from the provided context, state that clearly and politely. For example: "I don't have that specific information in my current dataset."
- Format your responses using Markdown for readability. **Use bullet points (e.g., \`- Point 1\`, \`* Point 2\`) for lists or distinct pieces of information. Ensure adequate line spacing between paragraphs or distinct ideas for better visual separation.**
- Use emojis where appropriate to maintain a friendly tone (e.g., 📈, 📉, 🤔, ✅).
- Ensure numerical values are formatted to two decimal places.
- Ensure monetary values are prefixed with "$".
- Synthesize your answer using all provided data segments that are relevant to the user's query. If some data segments (like AI Options Analysis) are not provided or are empty, simply work with the information you do have.

Model Response:
`,
  config: {
    safetySettings: [
      {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH'},
      {category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH'},
    ],
  },
});


const chatFlow = ai.defineFlow(
  {
    name: 'stockChatBotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input: ChatInput) => {
    console.log('[AIFlow:stockChatBotFlow] Executing for ticker:', input.ticker, 'User input (first 50):', input.userInput.substring(0,50));
    const {output} = await prompt(input);
    if (!output) {
        console.error('[AIFlow:stockChatBotFlow] Chatbot flow did not return an output for ticker:', input.ticker);
        throw new Error('Chatbot flow did not return an output.');
    }
    console.log('[AIFlow:stockChatBotFlow] Successfully executed for ticker:', input.ticker, 'Response (first 50):', output.response.substring(0,50));
    return output;
  }
);


    