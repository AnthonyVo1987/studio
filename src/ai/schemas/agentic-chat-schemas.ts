import { z } from 'zod';

// Define the input schema for the agentic orchestrator flow.
// This captures all the information coming from the frontend.
export const AgenticChatInputSchema = z.object({
  userInput: z.string().describe('The free-form text input from the user.'),
  ticker: z.string().describe('The stock ticker symbol for context, e.g., NVDA.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The history of the conversation so far.'),

  // Context data that the agent can pass to tools.
  stockSnapshotJson: z.string().optional().describe('JSON string of the stock snapshot data.'),
  aiKeyTakeawaysJson: z.string().optional().describe('JSON string of AI key takeaways.'),
  aiAnalyzedTaJson: z.string().optional().describe('JSON string of AI analyzed technical analysis.'),
  aiOptionsAnalysisJson: z.string().optional().describe('JSON string of AI options analysis.'),
  marketStatusJson: z.string().optional().describe('JSON string of the market status.'),
});
export type AgenticChatInput = z.infer<typeof AgenticChatInputSchema>;
