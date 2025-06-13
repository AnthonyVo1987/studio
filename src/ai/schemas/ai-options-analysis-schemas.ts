
/**
 * @fileOverview Zod schemas for AI-driven options chain analysis.
 * Defines input and output structures for analyzing options data.
 */

import {z} from 'zod'; // CRITICAL: Use direct 'zod' import

export const AiOptionsAnalysisInputSchema = z.object({
  optionsChainJson: z
    .string()
    .describe('A JSON string representing the options chain data, typically from OptionsChainData type. This includes calls, puts, strikes, and their details like open interest (OI).'),
  currentUnderlyingPrice: z
    .number()
    .describe('The current price of the underlying stock. Used for context, e.g., determining at-the-money strikes if needed by analysis.'),
  ticker: z
    .string()
    .describe('The stock ticker symbol for which the options chain is being analyzed.'),
});
export type AiOptionsAnalysisInput = z.infer<typeof AiOptionsAnalysisInputSchema>;

export const WallDetailSchema = z.object({
  strike: z.number().describe('The strike price of the identified wall.'),
  openInterest: z.number().describe('The open interest at this strike, contributing to it being a wall.'),
  type: z.enum(['call', 'put']).describe('The type of option (call or put) forming the wall.'),
  // analysisNote: z.string().optional().describe("A brief note from the AI on why this was identified as a wall, e.g., 'Significantly high OI compared to average and neighbors'.")
});
export type WallDetail = z.infer<typeof WallDetailSchema>;

export const AiOptionsAnalysisOutputSchema = z.object({
  callWalls: z
    .array(WallDetailSchema)
    .min(0) // Can be 0 if no walls found meeting criteria
    .max(3)
    .describe('An array of identified call walls, ordered by significance (e.g., highest OI first). Max 3.'),
  putWalls: z
    .array(WallDetailSchema)
    .min(0) // Can be 0 if no walls found meeting criteria
    .max(3)
    .describe('An array of identified put walls, ordered by significance. Max 3.'),
  analysisSummary: z
    .string()
    .optional()
    .describe("A brief summary if no walls were found or if there are particular conditions to note, e.g., 'No significant call or put walls identified based on the provided criteria.' or 'Low overall open interest, making wall detection less reliable.'")
});
export type AiOptionsAnalysisOutput = z.infer<typeof AiOptionsAnalysisOutputSchema>;
