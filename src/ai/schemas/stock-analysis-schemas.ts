
/**
 * @fileOverview Zod schemas for AI-driven stock analysis key takeaways.
 * Defines the input and output structures for the stock analysis flow.
 */

import {z} from 'zod'; // CRITICAL: Use direct 'zod' import

export const StockAnalysisInputSchema = z.object({
  ticker: z.string().describe('The ticker symbol of the stock being analyzed.'),
  stockSnapshotJson: z
    .string()
    .describe('A JSON string containing current and previous day stock data (prices, volume, etc.).'),
  standardTasJson: z
    .string()
    .describe('A JSON string containing standard technical indicators (RSI, SMA, EMA, MACD, VWAP).'),
  aiAnalyzedTaJson: z // Correctly renamed from aiCalculatedTaJson
    .string()
    .describe('A JSON string containing AI-analyzed technical analysis (e.g., pivot points).'),
  marketStatusJson: z
    .string()
    .describe('A JSON string containing current market status information.'),
});
export type StockAnalysisInput = z.infer<typeof StockAnalysisInputSchema>;

const TakeawayDetailSchema = z.object({
  takeaway: z
    .string()
    .describe('A concise key takeaway statement for the category.'),
  sentiment: z
    .enum(['bullish', 'bearish', 'neutral', 'positive', 'negative', 'high', 'low', 'increasing', 'decreasing', 'strong', 'weak', 'moderate', 'stable'])
    .describe('The sentiment associated with the takeaway (e.g., bullish, bearish, neutral, positive, negative, high, low, etc.).'),
});

export const StockAnalysisOutputSchema = z.object({
  priceAction: TakeawayDetailSchema.describe('Key takeaway regarding price action.'),
  trend: TakeawayDetailSchema.describe('Key takeaway regarding the stock trend.'),
  volatility: TakeawayDetailSchema.describe('Key takeaway regarding stock volatility.'),
  momentum: TakeawayDetailSchema.describe('Key takeaway regarding stock momentum.'),
  patterns: TakeawayDetailSchema.describe('Key takeaway regarding observed chart patterns or lack thereof.'),
});
export type StockAnalysisOutput = z.infer<typeof StockAnalysisOutputSchema>;

