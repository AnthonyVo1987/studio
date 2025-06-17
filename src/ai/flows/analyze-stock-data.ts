
'use server';
/**
 * @fileOverview An AI agent that generates key insights about a stock, emphasizing sentiment.
 * This flow analyzes stock data and technical indicators to provide 5 key takeaways.
 * Prompt definition is now loaded from a JSON file.
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
import { loadPromptDefinition, buildPromptStringFromDefinition, type PromptDefinition } from '@/ai/prompt-loader';

let analyzeStockDataPromptDefinition: PromptDefinition | null = null;

async function getAnalyzedStockDataPrompt() {
  if (!analyzeStockDataPromptDefinition) {
    analyzeStockDataPromptDefinition = await loadPromptDefinition('analyze-stock-data-prompt');
  }

  const promptString = buildPromptStringFromDefinition(analyzeStockDataPromptDefinition);
  const modelId = analyzeStockDataPromptDefinition.modelId || DEFAULT_ANALYSIS_MODEL_ID;
  const safetySettings = analyzeStockDataPromptDefinition.safetySettings || [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  ];
  
  return ai.definePrompt({
    name: 'analyzeStockDataPrompt', // Keep consistent internal name
    input: {schema: StockAnalysisInputSchema},
    output: {schema: StockAnalysisOutputSchema},
    model: modelId,
    prompt: promptString,
    config: {
      safetySettings: safetySettings,
    },
  });
}

export async function analyzeStockData(
  input: StockAnalysisInput
): Promise<StockAnalysisOutput> {
  console.log('[AIFlow:analyzeStockData] Received request for ticker:', input.ticker, 'Input keys:', Object.keys(input).join(', '));
  return analyzeStockDataFlow(input);
}


const analyzeStockDataFlow = ai.defineFlow(
  {
    name: 'analyzeStockDataFlow',
    inputSchema: StockAnalysisInputSchema,
    outputSchema: StockAnalysisOutputSchema,
  },
  async input => {
    console.log('[AIFlow:analyzeStockDataFlow] Executing for ticker:', input.ticker);
    const promptToUse = await getAnalyzedStockDataPrompt();
    const {output} = await promptToUse(input);

    if (!output) {
      console.error('[AIFlow:analyzeStockDataFlow] AI analysis flow did not return an output for ticker:', input.ticker);
      return {
        priceAction: { takeaway: "Error: AI analysis for price action failed.", sentiment: "neutral" },
        trend: { takeaway: "Error: AI analysis for trend failed.", sentiment: "neutral" },
        volatility: { takeaway: `Volatility analysis for ${input.ticker} was not sufficiently detailed by the AI. Please refer to specific volatility indicators if available or consider re-running the analysis.`, sentiment: "neutral" },
        momentum: { takeaway: "Error: AI analysis for momentum failed.", sentiment: "neutral" },
        patterns: { takeaway: "Error: AI analysis for patterns failed.", sentiment: "neutral" },
      };
    }

    const categories: (keyof StockAnalysisOutput)[] = ["priceAction", "trend", "volatility", "momentum", "patterns"];
    for (const category of categories) {
        if (!output[category] || !output[category].takeaway) {
            console.warn('[AIFlow:analyzeStockDataFlow]', `Output for category '${category}' was missing or empty for ticker ${input.ticker}. Providing default error message.`);
            output[category] = { takeaway: `AI analysis for ${category} was incomplete or not provided.`, sentiment: "neutral" };
        }
    }
    
    if (output.volatility && (!output.volatility.takeaway || output.volatility.takeaway.trim().split(/\s+/).length < 5)) {
        console.warn(`[AIFlow:analyzeStockDataFlow] Volatility takeaway for ${input.ticker} was too short. Setting default.`);
        output.volatility.takeaway = `Volatility analysis for ${input.ticker} was not sufficiently detailed by the AI. Please refer to specific volatility indicators if available or consider re-running the analysis.`;
        if (!output.volatility.sentiment) {
             output.volatility.sentiment = "neutral";
        }
    }

    console.log('[AIFlow:analyzeStockDataFlow] Successfully executed for ticker:', input.ticker, 'Output keys:', Object.keys(output).join(', '));
    return output;
  }
);
