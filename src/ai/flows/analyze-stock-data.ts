
'use server';
/**
 * @fileOverview An AI agent that generates key insights about a stock, emphasizing sentiment.
 * This flow analyzes stock data and technical indicators to provide 5 key takeaways.
 *
 * - analyzeStockData - A function that handles the stock analysis process.
 * - StockAnalysisInput (from schemas) - The input type for the analyzeStockData function.
 * - StockAnalysisOutput (from schemas) - The return type for the analyzeStockData function.
 */

import {ai} from '@/ai/genkit';
import {
  StockAnalysisInputSchema,
  type StockAnalysisInput,
  StockAnalysisOutputSchema,
  type StockAnalysisOutput,
} from '@/ai/schemas/stock-analysis-schemas';
import {DEFAULT_ANALYSIS_MODEL_ID} from '@/ai/models';

export async function analyzeStockData(
  input: StockAnalysisInput
): Promise<StockAnalysisOutput> {
  return analyzeStockDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStockDataPrompt',
  input: {schema: StockAnalysisInputSchema},
  output: {schema: StockAnalysisOutputSchema},
  model: DEFAULT_ANALYSIS_MODEL_ID,
  prompt: `You are an expert financial analyst tasked with providing key takeaways about a stock.
You will be given the stock ticker, a snapshot of its current and previous day data, standard technical indicators, AI-analyzed technical analysis (like pivot points), and current market status.

The standard technical indicators JSON ({{{standardTasJson}}}) will have the following structure:
- "RSI": An object with keys like "7", "10", "14" representing RSI values for those periods. e.g., {"7": 50.0, "14": 55.0}. The 14-period RSI is standard for overbought (>70) / oversold (<30) conditions.
- "MACD": An object with "value", "signal", and "histogram" keys. e.g., {"value": 0.5, "signal": 0.4, "histogram": 0.1}. A positive histogram is generally bullish; negative is bearish.
- "VWAP": An object with "day" and "minute" keys for Volume Weighted Average Price. e.g., {"day": 150.00, "minute": 150.05}.
- "EMA": An object with keys for different Exponential Moving Average periods ("5", "10", "20", "50", "200"). e.g., {"20": 148.00, "50": 145.00}.
- "SMA": An object with keys for different Simple Moving Average periods ("5", "10", "20", "50", "200"). e.g., {"50": 146.00, "200": 130.00}.
If a specific indicator or window was not available, it might be missing from the JSON or have a null value.

Analyze all the provided data comprehensively. Your goal is to generate 5 distinct key takeaways, each with a concise statement and an associated sentiment. The categories for these takeaways are:
1.  **Price Action:** Observations about the stock's recent price movements, support/resistance interactions with MAs or pivot points, etc.
2.  **Trend:** The prevailing direction (or lack thereof) of the stock's price over a relevant period, considering MAs.
3.  **Volatility:** The degree of variation of the stock's trading price series over time.
4.  **Momentum:** The speed or rate of price changes for the stock, considering RSI and MACD.
5.  **Patterns:** Any significant chart patterns observed or noteworthy absence of clear patterns.

For each takeaway:
- Provide a clear, insightful \`takeaway\` statement.
- Assign a \`sentiment\`. Use terms like: bullish, bearish, neutral, positive, negative, high, low, increasing, decreasing, strong, weak, moderate, stable. Choose the most appropriate term for the category.

Formatting instructions:
- Ensure any numerical values mentioned in your takeaways are formatted to a maximum of two decimal places.
- Monetary values (like price targets or levels) should be prefixed with a "$" sign.

Contextual Data:
Ticker: {{{ticker}}}
Stock Snapshot (current & prev day data, incl. minute VWAP in 'min' field): {{{stockSnapshotJson}}}
Standard Technical Indicators (RSI, MACD, VWAP, EMA, SMA with multiple windows): {{{standardTasJson}}}
AI Analyzed Technical Analysis (Pivot Points): {{{aiAnalyzedTaJson}}}
Market Status: {{{marketStatusJson}}}

Provide your analysis as a JSON object strictly conforming to the StockAnalysisOutputSchema.
`,
  config: {
    safetySettings: [ 
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
});

const analyzeStockDataFlow = ai.defineFlow(
  {
    name: 'analyzeStockDataFlow',
    inputSchema: StockAnalysisInputSchema,
    outputSchema: StockAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI analysis flow did not return an output.');
    }
    return output;
  }
);

