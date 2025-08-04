/**
 * @fileOverview Defines the main Genkit flow for the agentic chat orchestrator.
 * This flow acts as an intelligent agent, deciding which tool to use
 * (e.g., Google Search, or a custom prompt-based tool) to best answer
 * a user's query.
 */

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { allPromptTools } from '../tools/prompt-tools';
import { googleSearch } from '@genkit-ai/googleai';
import { Message } from 'genkit/ai';
import { AgenticChatInputSchema, type AgenticChatInput } from '@/actions/agentic-chat-action';

// Define the output schema for the flow.
export const AgenticChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user.'),
});
export type AgenticChatOutput = z.infer<typeof AgenticChatOutputSchema>;


// The system prompt that guides the ReAct (Reason + Act) agent.
const agentSystemPrompt = `
You are StockSage, a sophisticated financial AI assistant. Your primary function is to act as an intelligent orchestrator to answer user queries about a specific stock ticker.

Your task is to analyze the user's query and select the most appropriate tool to find the information needed to construct a comprehensive response. You must use the tools provided.

Here are the tools available to you:
- googleSearch: Use this for any queries that require real-time information, breaking news, or general financial knowledge not present in the provided context data. For example, "What's the latest news on NVDA?" or "Explain what a P/E ratio is."
- stockTraderTakeaways: Use this when the user asks for a summary, insights, or a "takeaway" from a stock trader's perspective. It provides actionable insights based on technical data.
- optionsTraderTakeaways: Use this when the user asks for analysis related to options trading, options flow, or a summary from an options trader's perspective.
- holisticTakeaways: Use this for broad, open-ended questions about the stock's overall situation, such as "What's the big picture for this stock?" or "Give me a complete summary."

Your reasoning process should be:
1.  **Analyze the Query:** Understand the user's specific intent. What information are they really asking for?
2.  **Select the Best Tool:** Based on the intent, choose the single best tool for the job from the list above. Do not use a tool if the query does not match its purpose.
3.  **Execute and Respond:** Call the chosen tool and use its output to formulate a helpful, well-written response to the user.

If the user asks a simple conversational question (e.g., "hello", "thank you"), you may respond directly without using a tool.
If you are unsure which tool to use, you can ask the user for clarification.
`;

// Define the agentic orchestrator flow.
export const agenticChatOrchestratorFlow = ai.defineFlow(
  {
    name: 'agenticChatOrchestratorFlow',
    inputSchema: AgenticChatInputSchema,
    outputSchema: AgenticChatOutputSchema,
  },
  async (input: AgenticChatInput): Promise<AgenticChatOutput> => {
    const logPrefix = `[AgenticFlow:${input.ticker}]`;
    console.log(`${logPrefix} Starting flow with user input: "${input.userInput}"`);

    // Combine all available tools.
    const allTools = [
        googleSearch,
        ...allPromptTools
    ];

    // Convert the chat history from the simple format to the Genkit Message format.
    const history: Message[] = input.chatHistory.map(msg => ({
        role: msg.role,
        content: [{ text: msg.content }],
    }));

    // Generate a response using the agentic model.
    const response = await ai.generate({
      tools: allTools,
      prompt: input.userInput,
      history: history,
      system: agentSystemPrompt,
      config: {
        temperature: 0.1, // Lower temperature for more deterministic tool selection.
      },
      // Pass the context data from the input directly. Genkit's tool-calling
      // mechanism will automatically pass these to the tool if the tool's
      // input schema has matching field names.
      context: {
        ticker: input.ticker,
        stockSnapshotJson: input.stockSnapshotJson,
        aiKeyTakeawaysJson: input.aiKeyTakeawaysJson,
        aiAnalyzedTaJson: input.aiAnalyzedTaJson,
        aiOptionsAnalysisJson: input.aiOptionsAnalysisJson,
        marketStatusJson: input.marketStatusJson,
      }
    });

    const responseText = response.text();
    console.log(`${logPrefix} Successfully generated response.`);

    return {
      response: responseText,
    };
  }
);
