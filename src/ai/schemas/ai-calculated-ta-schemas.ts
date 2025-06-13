
/**
 * @fileOverview Zod schemas for AI-calculated Technical Analysis.
 * Defines the input and output structures for the AI TA calculation flow.
 */

import {z} from 'zod';

export const CalculateAiTaInputSchema = z.object({
  previousDayHigh: z.number().describe('The high price of the stock from the previous trading day.'),
  previousDayLow: z.number().describe('The low price of the stock from the previous trading day.'),
  previousDayClose: z.number().describe('The closing price of the stock from the previous trading day.'),
});
export type CalculateAiTaInput = z.infer<typeof CalculateAiTaInputSchema>;

export const CalculateAiTaOutputSchema = z.object({
  pivotPoint: z.number().describe('The calculated central pivot point (PP).'),
  support1: z.number().describe('The first support level (S1).'),
  support2: z.number().describe('The second support level (S2).'),
  support3: z.number().describe('The third support level (S3).'),
  resistance1: z.number().describe('The first resistance level (R1).'),
  resistance2: z.number().describe('The second resistance level (R2).'),
  resistance3: z.number().describe('The third support level (R3).'),
});
export type CalculateAiTaOutput = z.infer<typeof CalculateAiTaOutputSchema>;
