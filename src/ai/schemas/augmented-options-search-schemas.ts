/**
 * @fileOverview Zod schemas for the AI-driven augmented options flow search.
 * Defines the input and output structures for searching for advanced options metrics online.
 */

import { z } from 'zod';

export const AugmentedOptionsSearchInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol to search for, e.g., "SPY".'),
});
export type AugmentedOptionsSearchInput = z.infer<typeof AugmentedOptionsSearchInputSchema>;

export const AugmentedOptionsSearchOutputSchema = z.object({
  maxPain: z.number().nullable().describe('The max pain strike price. Null if not found.'),
  ivRank: z.number().nullable().describe('The current IV Rank as a percentage (e.g., 35.5 for 35.5%). Null if not found.'),
  ivPercentile: z.number().nullable().describe('The current IV Percentile as a percentage (e.g., 45.0 for 45.0%). Null if not found.'),
  putCallRatio: z.number().nullable().describe('The latest put/call ratio. Null if not found.'),
  gammaExposure: z.number().nullable().describe('The total Gamma Exposure (GEX) value. Null if not found.'),
  volatilitySkew: z.string().nullable().describe('A brief textual description of the current volatility/IV skew (e.g., "Slightly favors puts"). Null if not found.'),
});
export type AugmentedOptionsSearchOutput = z.infer<typeof AugmentedOptionsSearchOutputSchema>;
