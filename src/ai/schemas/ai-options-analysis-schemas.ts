
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
  type: z.enum(['call', 'put']).describe('The type of option (call or put) forming the wall.'),
  wallScore: z.number().optional().describe('A score indicating the strength of the wall, typically an average of Z_OI and local_ratio, rounded to one decimal place.'),
});
export type WallDetail = z.infer<typeof WallDetailSchema>;

export const AiOptionsAnalysisOutputSchema = z.object({
  callWalls: z
    .array(WallDetailSchema)
    .min(0)
    .max(3)
    .describe('An array of identified call walls, ordered by significance (e.g., highest wallScore first). Max 3. Can be empty if none meet criteria.'),
  putWalls: z
    .array(WallDetailSchema)
    .min(0)
    .max(3)
    .describe('An array of identified put walls, ordered by significance. Max 3. Can be empty if none meet criteria.'),
  liquidityTier: z
    .enum(['Low', 'Medium', 'High', 'NotApplicable'])
    .optional()
    .describe('The determined liquidity tier of the options chain (e.g., Low <1000 avg OI, Medium 1000-4000, High >4000).'),
  analysisMethodology: z
    .string()
    .optional()
    .describe('A brief description of the methodology used for wall detection, as outlined in the CoT prompt.'),
});
export type AiOptionsAnalysisOutput = z.infer<typeof AiOptionsAnalysisOutputSchema>;
