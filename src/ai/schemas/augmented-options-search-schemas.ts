
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
});
export type AugmentedOptionsSearchOutput = z.infer<typeof AugmentedOptionsSearchOutputSchema>;
