
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
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';

let analyzeStockDataPromptDefinition: LlmPromptDefinition | null = null;

async function getAnalyzedStockDataPrompt() {
  if (!analyzeStockDataPromptDefinition) {
    const genericDefinition = await loadDefinition('analyze-stock-data');
    if (genericDefinition.definitionType !== 'llm-prompt') {
      throw new Error('Loaded definition for analyze-stock-data is not an LLM prompt type.');
    }
    analyzeStockDataPromptDefinition = genericDefinition;
  }

  const promptString = buildPromptStringFromLlmDefinition(analyzeStockDataPromptDefinition);
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

const defaultTakeaway = (category: string, ticker: string): { takeaway: string; sentiment: "neutral" } => ({
  takeaway: `AI analysis for ${category} for ${ticker} was incomplete or not provided.`,
  sentiment: "neutral",
});

const analyzeStockDataFlow = ai.defineFlow(
  {
    name: 'analyzeStockDataFlow',
    inputSchema: StockAnalysisInputSchema,
    outputSchema: StockAnalysisOutputSchema,
  },
  async (input: StockAnalysisInput): Promise<StockAnalysisOutput> => {
    console.log('[AIFlow:analyzeStockDataFlow] Executing for ticker:', input.ticker);
    let output: StockAnalysisOutput | undefined;

    try {
      const promptToUse = await getAnalyzedStockDataPrompt();
      const result = await promptToUse(input);
      output = result.output;
    } catch (error) {
      console.error('[AIFlow:analyzeStockDataFlow] Error during prompt execution for ticker:', input.ticker, error);
      output = undefined; // Ensure output is undefined on error
    }

    if (!output) {
      console.error('[AIFlow:analyzeStockDataFlow] AI analysis flow did not return an output for ticker:', input.ticker);
      return {
        priceAction: defaultTakeaway("price action", input.ticker),
        trend: defaultTakeaway("trend", input.ticker),
        volatility: { takeaway: `Volatility analysis for ${input.ticker} was not sufficiently detailed by the AI. Please refer to specific volatility indicators if available or consider re-running the analysis.`, sentiment: "neutral" },
        momentum: defaultTakeaway("momentum", input.ticker),
        patterns: defaultTakeaway("patterns", input.ticker),
      };
    }

    const categories: (keyof StockAnalysisOutput)[] = ["priceAction", "trend", "volatility", "momentum", "patterns"];
    for (const category of categories) {
        if (!output[category] || !output[category].takeaway || output[category].takeaway.trim() === "") {
            console.warn('[AIFlow:analyzeStockDataFlow]', `Output for category '${category}' was missing or empty for ticker ${input.ticker}. Providing default message.`);
            output[category] = defaultTakeaway(category, input.ticker);
        }
    }
    
    if (output.volatility && (!output.volatility.takeaway || output.volatility.takeaway.trim().split(/\s+/).length < 5)) {
        console.warn(`[AIFlow:analyzeStockDataFlow] Volatility takeaway for ${input.ticker} was too short. Setting default placeholder.`);
        output.volatility.takeaway = `Volatility analysis for ${input.ticker} was not sufficiently detailed by the AI. Please refer to specific volatility indicators or market context.`;
        if (!output.volatility.sentiment) {
             output.volatility.sentiment = "neutral";
        }
    }

    console.log('[AIFlow:analyzeStockDataFlow] Successfully executed for ticker:', input.ticker, 'Output keys:', Object.keys(output).join(', '));
    return output;
  }
);

