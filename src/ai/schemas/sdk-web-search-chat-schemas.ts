
/**
 * @fileOverview Zod schemas and TypeScript types for the SDK Web Search Chat action.
 */

import { z } from 'zod';

// This is now defined by the server action based on FormData and not used as a direct input type
export const SdkWebSearchChatActionInputsSchema = z.object({
  ticker: z.string().describe("The stock ticker symbol for context."),
  promptName: z.string().optional().describe("The specific, predefined prompt to use (e.g., 'technical-analysis-web-search')."),
  userInput: z.string().optional().describe("The user's direct input for general queries. Used if promptName is absent."),
});
export type SdkWebSearchChatActionInputs = z.infer<typeof SdkWebSearchChatActionInputsSchema>;

export const SdkWebSearchChatActionResultSchema = z.object({
  requestJson: z.string().describe("The JSON string of the request sent to the server action."),
  responseJson: z.string().describe("The JSON string of the response from the server action, containing the formatted markdown."),
});
export type SdkWebSearchChatActionResult = z.infer<typeof SdkWebSearchChatActionResultSchema>;

export const SdkWebSearchChatActionStateSchema = z.object({
  status: z.enum(['idle', 'success', 'error']),
  data: SdkWebSearchChatActionResultSchema.optional(),
  error: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});
export type SdkWebSearchChatActionState = z.infer<typeof SdkWebSearchChatActionStateSchema>;
