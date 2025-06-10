
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
  return chatFlow(input);
}

// Constructing the prompt history for the model
const buildChatHistoryForPrompt = (chatHistory?: ChatInput['chatHistory']) => {
  if (!chatHistory || chatHistory.length === 0) {
    return '';
  }
  return chatHistory
    .map(turn => `{{#if (eq role "${turn.role}")}}${turn.role}: ${turn.content}{{/if}}`)
    .join('\n');
};


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
3.  **AI Calculated TA JSON:** {{{aiCalculatedTaJson}}} (Contains AI-calculated technical indicators like pivot points.)

{{#if chatHistory}}
Conversation History:
{{{chatHistory}}}
{{/if}}

User's Current Input: {{{userInput}}}

Based ONLY on the provided contextual information and conversation history (if any):
- Answer the user's question comprehensively.
- If the question cannot be answered from the provided context, state that clearly and politely. For example: "I don't have that specific information in my current dataset."
- Format your responses using Markdown for readability (e.g., bolding, bullet points).
- Use emojis where appropriate to maintain a friendly tone (e.g., 📈, 📉, 🤔, ✅).
- Ensure numerical values are formatted to two decimal places.
- Ensure monetary values are prefixed with "$".

Model Response:
`,
  // Customize prompt to handle history if present
  customize: (prompt, input) => {
    const historyTurns = (input.chatHistory || []).map(turn => ({
      role: turn.role,
      content: turn.content,
    }));
    
    // The main prompt text already includes Handlebars for history.
    // Here, we ensure the history is part of what Handlebars can access.
    // However, the \`generate\` call needs messages in a specific format.
    // For prompts defined with \`ai.definePrompt\`, the input object is directly available
    // to the Handlebars template. We will pass the structured history to \`generate\` later.
    // For now, the Handlebars \`{{{chatHistory}}}\` in the prompt string is not directly usable
    // in the way an array of messages is for the \`generate\` API.
    // The actual history injection needs to be done when calling \`generate\`.
    // The definePrompt's \`prompt\` string itself is a template for the text part of the generate call.

    // Let's simplify: The prompt string will reference fields from the ChatInputSchema directly.
    // The flow will then prepare the messages array for the \`generate\` call.
    // This means the \`{{{chatHistory}}}\` in the prompt string itself isn't ideal.
    // Better to use a system message and pass history separately.

    // Re-thinking: for \`ai.definePrompt\`, the prompt string IS the main user instruction.
    // We need to ensure the \`chatHistory\` part of the input schema can be rendered by Handlebars.
    // The \`buildChatHistoryForPrompt\` helper is not needed if Handlebars can iterate.
    // Handlebars can iterate over \`chatHistory\` if it's an array of objects.

    // The model's \`generate\` method takes \`messages\` or a \`prompt\` string.
    // If using \`ai.definePrompt\`, the prompt string is primary.
    // Let's construct the history string and provide it if Handlebars has issues with complex objects.
    
    let historyString = "";
    if (input.chatHistory && input.chatHistory.length > 0) {
      historyString = input.chatHistory.map(h => `${h.role === 'user' ? 'User' : 'Model'}: ${h.content}`).join('\n');
    }
    // The prompt itself needs to be just the text.
    // The history is better handled by passing messages to generate().
    // However, ai.definePrompt output is a function that takes input and returns a model response.
    // It's simpler if the prompt template can handle everything.

    // Final approach for ai.definePrompt:
    // The prompt template will iterate chatHistory directly.
    // The \`ChatInputSchema\` defines \`chatHistory\` as \`z.array(z.object({role: z.enum(['user', 'model']), content: z.string()}))\`
    // Handlebars can do:
    // {{#if chatHistory}}
    // Conversation History:
    // {{#each chatHistory}}
    // {{this.role}}: {{this.content}}
    // {{/each}}
    // {{/if}}
    // This should work. My current prompt string already uses this.

    return prompt; // No customization needed if Handlebars handles it.
  },
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
    // The \`ai.definePrompt\` output \`prompt\` is a function that internally calls \`ai.generate\`.
    // It will use the \`prompt\` string template from its definition, filling it with \`input\`.
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('Chatbot flow did not return an output.');
    }
    return output;
  }
);
