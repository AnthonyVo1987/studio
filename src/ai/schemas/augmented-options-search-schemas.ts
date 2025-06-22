/**
 * @fileOverview Zod schemas for the AI-driven augmented options metrics search flow.
 */

import { z } from 'zod';

export const AugmentedOptionsSearchInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol to search for, e.g., "SPY".'),
});
export type AugmentedOptionsSearchInput = z.infer<typeof AugmentedOptionsSearchInputSchema>;

export const AugmentedOptionsSearchOutputSchema = z.object({
  maxPain: z.number().nullable().describe('The Max Pain strike price. Null if not found.'),
  putCallRatio: z.number().nullable().describe('The total Put/Call ratio. Null if not found.'),
  gammaExposure: z.number().nullable().describe('The Gamma Exposure (GEX) value. Null if not found.'),
  ivRank: z.number().nullable().describe('The Implied Volatility (IV) Rank as a percentage (e.g., 45.5 for 45.5%). Null if not found.'),
});
export type AugmentedOptionsSearchOutput = z.infer<typeof AugmentedOptionsSearchOutputSchema>;
