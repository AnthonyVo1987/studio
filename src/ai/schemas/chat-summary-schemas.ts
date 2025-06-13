
/**
 * @fileOverview Zod schemas for AI-generated full analysis summary for chat.
 * Defines the input and output structures for the chat summary generation flow.
 */

import {z} from 'zod'; // CRITICAL: Use direct 'zod' import

export const GenerateFullAnalysisSummaryInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol.'),
  stockSnapshotJson: z
    .string()
    .describe('JSON string of StockSnapshotData: current/previous day prices, volume, etc.'),
  standardTasJson: z
    .string()
    .describe('JSON string of TechnicalIndicatorsData: RSI, MACD, VWAP, EMA, SMA.'),
  aiAnalyzedTaJson: z
    .string()
    .describe('JSON string of AnalyzeTaOutput (Pivot Points) or an error/skipped status string.'),
  aiKeyTakeawaysJson: z
    .string()
    .describe('JSON string of StockAnalysisOutput (5 key takeaways with sentiment) or an error/skipped status string.'),
  aiOptionsAnalysisJson: z
    .string()
    .describe('JSON string of AiOptionsAnalysisOutput (Call/Put Walls, OI Clusters) or an error/skipped status string.'),
  marketStatusJson: z
    .string()
    .describe('JSON string of MarketStatusData.'),
});
export type GenerateFullAnalysisSummaryInput = z.infer<typeof GenerateFullAnalysisSummaryInputSchema>;

export const GenerateFullAnalysisSummaryOutputSchema = z.object({
  summaryText: z
    .string()
    .describe('Markdown formatted summary of the full analysis, suitable for initiating a chat conversation.'),
});
export type GenerateFullAnalysisSummaryOutput = z.infer<typeof GenerateFullAnalysisSummaryOutputSchema>;
