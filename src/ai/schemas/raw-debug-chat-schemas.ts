/**
 * @fileOverview Zod schemas and TypeScript types for the raw debug chat feature.
 */

import { z } from 'zod';

// Schemas for raw-debug-chat-action
export const RawDebugChatInputsSchema = z.object({
  promptType: z.enum([
    'app-data',
    'web-search',
    'sdk-app-data',
    'sdk-web-search',
    'sdk-support-resistance-web-search',
    'sdk-ta-web-search',
    'sdk-options-web-search',
    'sdk-user-web-search',
  ]),
  userInput: z.string().optional(),
});
export type RawDebugChatInputs = z.infer<typeof RawDebugChatInputsSchema>;

export const RawDebugResultSchema = z.object({
  requestJson: z.string(),
  responseJson: z.string(),
});
export type RawDebugResult = z.infer<typeof RawDebugResultSchema>;

export const RawDebugChatActionStateSchema = z.object({
  status: z.enum(['idle', 'success', 'error']),
  data: RawDebugResultSchema.optional(),
  error: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});
export type RawDebugChatActionState = z.infer<typeof RawDebugChatActionStateSchema>;
