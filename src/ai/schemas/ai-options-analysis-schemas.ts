
/**
 * @fileOverview Zod schemas for AI-driven options chain analysis.
 * Defines input and output structures for analyzing options data.
 */

import {z} from 'zod'; // CRITICAL: Use direct 'zod' import

export const AiOptionsAnalysisInputSchema = z.object({
  optionsChainJson: z
    .string()
    .describe('A JSON string representing the options chain data, typically from OptionsChainData type. This includes calls, puts, strikes, and their details like open interest (OI).'),
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
});
export type WallDetail = z.infer<typeof WallDetailSchema>;

export const ClusterDetailSchema = z.object({
  strikes: z.array(z.number()).describe('An array of 2 or more adjacent strike prices forming the cluster.'),
  totalOI: z.number().describe('The total open interest across all strikes in this cluster.'),
  averageOI: z.number().describe('The average open interest per strike within this cluster.'),
  type: z.enum(['call', 'put']).describe('The type of option (call or put) forming the cluster.'),
});
export type ClusterDetail = z.infer<typeof ClusterDetailSchema>;

export const AiOptionsAnalysisOutputSchema = z.object({
  callWalls: z
    .array(WallDetailSchema)
    .min(0)
    .max(3)
    .describe('An array of identified call walls, ordered by significance (e.g., highest OI first). Max 3. Can be empty if none meet criteria.'),
  putWalls: z
    .array(WallDetailSchema)
    .min(0)
    .max(3)
    .describe('An array of identified put walls, ordered by significance. Max 3. Can be empty if none meet criteria.'),
  callClusters: z
    .array(ClusterDetailSchema)
    .min(0)
    .max(3)
    .optional()
    .describe('An array of identified call OI clusters, ordered by significance (e.g., highest total OI first). Max 3. Can be empty or undefined.'),
  putClusters: z
    .array(ClusterDetailSchema)
    .min(0)
    .max(3)
    .optional()
    .describe('An array of identified put OI clusters, ordered by significance. Max 3. Can be empty or undefined.'),
  analysisSummary: z
    .string()
    .optional()
    .describe("A brief summary if no significant walls/clusters were found or if there are particular conditions to note, e.g., 'No significant call or put walls identified based on the provided criteria.' or 'Low overall open interest, making wall detection less reliable.'")
});
export type AiOptionsAnalysisOutput = z.infer<typeof AiOptionsAnalysisOutputSchema>;
