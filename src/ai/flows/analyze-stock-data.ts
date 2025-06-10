'use server';
/**
 * @fileOverview An AI agent that generates key insights about a stock, emphasizing sentiment.
 *
 * - analyzeStockData - A function that handles the stock analysis process.
 * - StockAnalysisInput - The input type for the analyzeStockData function.
 * - StockAnalysisOutput - The return type for the analyzeStockData function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';
import { DEFAULT_ANALYSIS_MODEL_ID } from '@/ai/models';

const StockAnalysisInputSchema = z.object({
  ticker: z.string().describe('The ticker symbol of the stock to analyze.'),
  marketStatus: z.string().describe('Current market status information in JSON format.'),
  stockSnapshot: z.string().describe('Snapshot of the stock data including current and previous day information in JSON format.'),
  technicalAnalysis: z.string().describe('Technical analysis indicators for the stock in JSON format.'),
  aiCalculatedTa: z.string().describe('AI calculated technical analysis, including pivot points in JSON format.'),
});
export type StockAnalysisInput = z.infer<typeof StockAnalysisInputSchema>;

const StockAnalysisOutputSchema = z.object({
  priceAction: z.object({
    takeaway: z.string().describe('A key takeaway about the price action of the stock.'),
    sentiment: z.string().describe('The sentiment associated with the price action (e.g., bullish, bearish, neutral).'),
  }),
  trend: z.object({
    takeaway: z.string().describe('A key takeaway about the trend of the stock.'),
    sentiment: z.string().describe('The sentiment associated with the trend (e.g., bullish, bearish, neutral).'),
  }),
  volatility: z.object({
    takeaway: z.string().describe('A key takeaway about the volatility of the stock.'),
    sentiment: z.string().describe('The sentiment associated with the volatility (e.g., high, low, increasing, decreasing).'),
  }),
  momentum: z.object({
    takeaway: z.string().describe('A key takeaway about the momentum of the stock.'),
    sentiment: z.string().describe('The sentiment associated with the momentum (e.g., positive, negative, strong, weak).'),
  }),
  patterns: z.object({
    takeaway: z.string().describe('A key takeaway about the chart patterns of the stock.'),
    sentiment: z.string().describe('The sentiment associated with the chart patterns (e.g., bullish, bearish, neutral).'),
  }),
});
export type StockAnalysisOutput = z.infer<typeof StockAnalysisOutputSchema>;

export async function analyzeStockData(input: StockAnalysisInput): Promise<StockAnalysisOutput> {
  return analyzeStockDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStockDataPrompt',
  input: {schema: StockAnalysisInputSchema},
  output: {schema: StockAnalysisOutputSchema},
  model: DEFAULT_ANALYSIS_MODEL_ID,
  prompt: `You are an expert financial analyst providing key takeaways about a given stock.

  Analyze the provided market status, stock snapshot, technical analysis, and AI-calculated technical analysis to generate 5 key takeaways:
  - Price Action
  - Trend
  - Volatility
  - Momentum
  - Patterns

  For each takeaway, provide a concise statement and an associated sentiment (bullish, bearish, or neutral).
  Ensure numerical values are formatted to two decimal places, and monetary values are prefixed with "$".

  Market Status: {{{marketStatus}}}
  Stock Snapshot: {{{stockSnapshot}}}
  Technical Analysis: {{{technicalAnalysis}}}
  AI Calculated Technical Analysis: {{{aiCalculatedTa}}}

  Format the output as a JSON object conforming to the StockAnalysisOutputSchema.
`,
});

const analyzeStockDataFlow = ai.defineFlow(
  {
    name: 'analyzeStockDataFlow',
    inputSchema: StockAnalysisInputSchema,
    outputSchema: StockAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
