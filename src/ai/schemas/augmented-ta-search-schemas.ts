
/**
 * @fileOverview Zod schemas for the AI Augmented Technical Analysis Search feature.
 */

import { z } from 'zod';

export const AugmentedTaSearchInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol to search for.'),
});
export type AugmentedTaSearchInput = z.infer<typeof AugmentedTaSearchInputSchema>;

export const AugmentedTaSearchOutputSchema = z.object({
  averageTrueRange14: z.number().nullable().describe('The 14-day Average True Range (ATR).'),
  bollingerBands: z.object({
    upper: z.number(),
    middle: z.number(),
    lower: z.number(),
  }).nullable().describe('The upper, middle, and lower Bollinger Bands.'),
  fibonacciRetracement: z.record(z.number()).nullable().describe('An object of Fibonacci retracement levels and their corresponding prices.'),
  searchStatus: z.enum(['COMPLETE', 'PARTIAL', 'NOT_FOUND']).describe('The status of the web search operation.')
});
export type AugmentedTaSearchOutput = z.infer<typeof AugmentedTaSearchOutputSchema>;
