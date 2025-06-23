
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
  supportLevels: z.array(z.number()).nullable().describe('An array of key support price levels.'),
  resistanceLevels: z.array(z.number()).nullable().describe('An array of key resistance price levels.'),
  fibonacciRetracement: z.record(z.number()).nullable().describe('An object of Fibonacci retracement levels and their corresponding prices.'),
});
export type AugmentedTaSearchOutput = z.infer<typeof AugmentedTaSearchOutputSchema>;
