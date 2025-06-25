
/**
 * @fileOverview Zod schemas for the Web Search AI Chatbot.
 * Defines the input and output structures for the grounded chatbot flow.
 */

import {z} from 'zod';
import { extractJsonString } from '@/lib/string-utils';

export const WebSearchChatInputSchema = z.object({
  ticker: z.string().optional().describe('The stock ticker symbol relevant to the chat context.'),
  chatHistory: z.array(z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })).optional().describe('Previous turns in the conversation. Optional.'),
  userInput: z.string().describe('The latest question or statement from the user.'),
  promptName: z.string().optional().describe("The name of the specific prompt definition to use (e.g., 'technical-analysis-web-search'). If omitted, defaults to general web search chat."),
});
export type WebSearchChatInput = z.infer<typeof WebSearchChatInputSchema>;


export const WebSearchChatOutputSchema = z.object({
  response: z.string().optional().describe('The chatbot\'s text response, formatted in Markdown.'),
  rawResponse: z.any().optional().describe('The full raw response object from the Genkit API, including grounding metadata.'),
});
export type WebSearchChatOutput = z.infer<typeof WebSearchChatOutputSchema>;


/**
 * A Zod transform to safely extract a JSON string from a text response and parse it.
 * @template T - The Zod schema to validate the parsed JSON against.
 * @param {T} schema - The Zod schema for validation.
 * @returns A Zod effect type that transforms a string into a validated object.
 */
export const JsonExtractionSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.string().transform((text, ctx): z.infer<T> => {
    const jsonString = extractJsonString(text);
    if (!jsonString) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Could not extract a valid JSON block from the AI text response.',
      });
      return z.NEVER;
    }

    try {
      const parsed = JSON.parse(jsonString);
      const validationResult = schema.safeParse(parsed);
      if (!validationResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Parsed JSON does not match the target schema. Errors: ${validationResult.error.message}`,
        });
        return z.NEVER;
      }
      return validationResult.data;
    } catch (e: any) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Failed to parse the extracted JSON string. Error: ${e.message}`,
      });
      return z.NEVER;
    }
  });

