/**
 * @fileOverview Zod schemas for the NVDA Consolidated AI Chat.
 * Unifies both app data and web search capabilities in a single interface.
 */

import { z } from 'zod';

// Chat message schema for history
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
  id: z.string(),
});

// Unified input schema combining app data and web search capabilities
export const NvdaConsolidatedChatInputSchema = z.object({
  // Core chat properties
  ticker: z.string().describe('The stock ticker symbol (NVDA for NVDA tab)'),
  userInput: z.string().describe('The user input or processed prompt template text'),
  promptName: z.string().optional().describe("Optional prompt name (e.g., 'stock-trader-takeaways', 'support-resistance-web-search')"),
  
  // Web search control
  webSearchEnabled: z.boolean().describe('Whether to enable Google Search grounding for this request'),
  
  // App data context (for non-web search prompts)
  stockSnapshotJson: z.string().optional().describe('JSON string of stock snapshot data'),
  aiKeyTakeawaysJson: z.string().optional().describe('JSON string of AI key takeaways'),
  aiAnalyzedTaJson: z.string().optional().describe('JSON string of AI analyzed technical analysis'),
  aiOptionsAnalysisJson: z.string().optional().describe('JSON string of AI options analysis'),
  marketStatusJson: z.string().optional().describe('JSON string of market status data'),
  
  // Chat history
  chatHistory: z.array(ChatMessageSchema).optional().describe('Previous conversation turns'),
});

export type NvdaConsolidatedChatInput = z.infer<typeof NvdaConsolidatedChatInputSchema>;

// Unified output schema
export const NvdaConsolidatedChatOutputSchema = z.object({
  response: z.string().describe('The AI response text in markdown format'),
  webSearchUsed: z.boolean().describe('Whether web search grounding was actually used'),
  groundingMetadata: z.any().optional().describe('Grounding metadata when web search is used'),
  rawResponse: z.any().optional().describe('Full raw response from the AI model'),
});

export type NvdaConsolidatedChatOutput = z.infer<typeof NvdaConsolidatedChatOutputSchema>;

// Action result schema for logging
export const NvdaConsolidatedChatResultSchema = z.object({
  requestJson: z.string().describe('JSON string of the request payload'),
  responseJson: z.string().describe('JSON string of the response data'),
});

export type NvdaConsolidatedChatResult = z.infer<typeof NvdaConsolidatedChatResultSchema>;

// Action state schema for useActionState
export const NvdaConsolidatedChatStateSchema = z.object({
  status: z.enum(['idle', 'success', 'error', 'pending']),
  data: NvdaConsolidatedChatResultSchema.optional(),
  error: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});

export type NvdaConsolidatedChatState = z.infer<typeof NvdaConsolidatedChatStateSchema>;