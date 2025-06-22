/**
 * @fileOverview Zod schemas for the AI-driven augmented technical analysis search flow.
 * Defines the input and output structures for searching for TA indicators online.
 */

import { z } from 'zod';

export const AugmentedTaSearchInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol to search for, e.g., "NVDA".'),
});
export type AugmentedTaSearchInput = z.infer<typeof AugmentedTaSearchInputSchema>;

export const AugmentedTaSearchOutputSchema = z.object({
  atr14: z.number().nullable().describe('The 14-day Average True Range (ATR). Null if not found.'),
  supportLevels: z.array(z.number()).max(3).describe('Up to three key support price levels. Empty array if none found.'),
  resistanceLevels: z.array(z.number()).max(3).describe('Up to three key resistance price levels. Empty array if none found.'),
  bollingerBands: z.object({
    upper: z.number().describe('The upper Bollinger Band value.'),
    middle: z.number().describe('The middle Bollinger Band value (typically a 20-period SMA).'),
    lower: z.number().describe('The lower Bollinger Band value.'),
  }).nullable().describe('The Bollinger Bands values. Null if not found.'),
  fibonacciRetracement: z.object({
    '0.236': z.number().describe('The 23.6% Fibonacci retracement level.'),
    '0.382': z.number().describe('The 38.2% Fibonacci retracement level.'),
    '0.500': z.number().describe('The 50.0% Fibonacci retracement level.'),
    '0.618': z.number().describe('The 61.8% Fibonacci retracement level.'),
    '0.786': z.number().describe('The 78.6% Fibonacci retracement level.'),
  }).nullable().describe('Key Fibonacci retracement levels. Null if the entire set cannot be determined.'),
});
export type AugmentedTaSearchOutput = z.infer<typeof AugmentedTaSearchOutputSchema>;
