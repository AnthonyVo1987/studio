
/**
 * @fileOverview Zod schemas for the AI Augmented Options Search feature.
 */

import { z } from 'zod';

export const AugmentedOptionsSearchInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol to search for.'),
});
export type AugmentedOptionsSearchInput = z.infer<typeof AugmentedOptionsSearchInputSchema>;

export const AugmentedOptionsSearchOutputSchema = z.object({
  maxPain: z.number().nullable().describe('The strike price at which the maximum number of options would expire worthless.'),
  gammaExposure: z.string().nullable().describe('A qualitative description of the Gamma Exposure (GEX).'),
  putCallRatio: z.number().nullable().describe('The ratio of put options to call options.'),
  ivSkew: z.number().nullable().describe('The difference in implied volatility between out-of-the-money puts and calls.'),
  ivRank: z.number().nullable().describe('The current IV compared to the high and low IV over the past year (as a percentage, e.g., 45 for 45%).'),
  ivPercentile: z.number().nullable().describe('The percentage of days in the past year that IV was lower than the current IV (e.g., 60 for 60th percentile).'),
  historicVolatility30d: z.number().nullable().describe('The realized volatility of the stock over the past 30 days (as a decimal, e.g., 0.35 for 35%).'),
  optionsVolatilitySkew: z.string().nullable().describe('A general description of the options volatility skew (e.g., "Steep bearish skew").'),
  searchStatus: z.enum(['COMPLETE', 'PARTIAL', 'NOT_FOUND']).describe('The status of the web search operation.')
});
export type AugmentedOptionsSearchOutput = z.infer<typeof AugmentedOptionsSearchOutputSchema>;
