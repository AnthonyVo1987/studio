
      
/**
 * @fileOverview Zod schemas for AI-driven options chain analysis.
 * Defines input and output structures for analyzing options data.
 */

import {z} from 'zod'; // CRITICAL: Use direct 'zod' import

export const AiOptionsAnalysisInputSchema = z.object({
  optionsChainJson: z
    .string()
    .describe('A JSON string representing the options chain data, typically from OptionsChainData type. This includes calls, puts, strikes, and their details like open interest (OI) and volume.'),
  currentUnderlyingPrice: z
    .number()
    .describe('The current price of the underlying stock. Used for context, e.g., determining at-the-money strikes if needed by analysis or for the AI to understand the general price level.'),
  ticker: z
    .string()
    .describe('The stock ticker symbol for which the options chain is being analyzed.'),
});
export type AiOptionsAnalysisInput = z.infer<typeof AiOptionsAnalysisInputSchema>;

export const WallDetailSchema = z.object({
  strike: z.number().describe('The strike price of the identified wall.'),
  openInterest: z.number().describe('The open interest at this strike, contributing to it being a wall.'),
  volume: z.number().optional().describe('The volume at this strike, if it contributed to it being identified as a wall.'),
  type: z.enum(['call', 'put']).describe('The type of option (call or put) forming the wall.'),
});
export type WallDetail = z.infer<typeof WallDetailSchema>;

export const AiOptionsAnalysisOutputSchema = z.object({
  callWalls: z
    .array(WallDetailSchema)
    .min(0)
    .max(3)
    .describe('An array of identified call walls, ordered by significance. Max 3. Can be empty if none meet criteria.'),
  putWalls: z
    .array(WallDetailSchema)
    .min(0)
    .max(3)
    .describe('An array of identified put walls, ordered by significance. Max 3. Can be empty if none meet criteria.'),
});
export type AiOptionsAnalysisOutput = z.infer<typeof AiOptionsAnalysisOutputSchema>;

    