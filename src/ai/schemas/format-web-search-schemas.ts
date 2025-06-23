
/**
 * @fileOverview Zod schemas for the Web Search Results Formatting feature.
 */

import { z } from 'zod';

export const FormatWebSearchResultsInputSchema = z.object({
  searchType: z.enum(['TA', 'Options']).describe('The type of web search results to format.'),
  rawJsonString: z.string().describe('The raw JSON string returned from the initial web search flow.'),
});
export type FormatWebSearchResultsInput = z.infer<typeof FormatWebSearchResultsInputSchema>;

export const FormatWebSearchResultsOutputSchema = z.object({
  formattedResponse: z.string().describe('The formatted, user-friendly markdown string representing the web search results.'),
});
export type FormatWebSearchResultsOutput = z.infer<typeof FormatWebSearchResultsOutputSchema>;
