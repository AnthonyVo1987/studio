
/**
 * @fileOverview Zod schemas for AI Analyzed Technical Analysis.
 * Defines the input and output structures for the AI TA analysis flow.
 * This was formerly for "AI Calculated TA" (which was primarily pivot points).
 * The flow still calculates pivots, but the output is now framed as "AI Analyzed TA".
 */

import {z} from 'zod'; // CRITICAL: Use direct 'zod' import

export const AnalyzeTaInputSchema = z.object({
  previousDayHigh: z.number().describe('The high price of the stock from the previous trading day.'),
  previousDayLow: z.number().describe('The low price of the stock from the previous trading day.'),
  previousDayClose: z.number().describe('The closing price of the stock from the previous trading day.'),
});
export type AnalyzeTaInput = z.infer<typeof AnalyzeTaInputSchema>;

export const AnalyzeTaOutputSchema = z.object({
  pivotPoint: z.number().describe('The calculated central pivot point (PP).'),
  support1: z.number().describe('The first support level (S1).'),
  support2: z.number().describe('The second support level (S2).'),
  support3: z.number().describe('The third support level (S3).'),
  resistance1: z.number().describe('The first resistance level (R1).'),
  resistance2: z.number().describe('The second resistance level (R2).'),
  resistance3: z.number().describe('The third resistance level (R3).'), // Corrected from support3 to resistance3
});
export type AnalyzeTaOutput = z.infer<typeof AnalyzeTaOutputSchema>;
