
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

// Export types for use in actions
export type { StockAnalysisInput, StockAnalysisOutput };
import {DEFAULT_ANALYSIS_MODEL_ID} from '@/ai/models';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';
import { stockAnalysisTemplates } from '@/ai/prompt-template-system';

// Cache for the prompt object
let analyzeStockDataPrompt: any = null;

// Flag to use template system (can be toggled for A/B testing)
const USE_TEMPLATE_SYSTEM = process.env.USE_AI_TEMPLATE_SYSTEM === 'true' || false;

async function getAnalyzedStockDataPrompt() {
  const logPrefix = '[AIFlow:getAnalyzedStockDataPrompt]';
  if (analyzeStockDataPrompt) {
    return analyzeStockDataPrompt;
  }

  let analyzeStockDataPromptDefinition: LlmPromptDefinition;
  
  if (USE_TEMPLATE_SYSTEM) {
    analyzeStockDataPromptDefinition = stockAnalysisTemplates.stockAnalysis();
  } else {
    const genericDefinition = await loadDefinition('analyze-stock-data');
    if (genericDefinition.definitionType !== 'llm-prompt') {
      const errorMsg = `Loaded definition for 'analyze-stock-data' is not an LLM prompt type. Type: ${genericDefinition.definitionType}`;
      throw new Error(errorMsg);
    }
    analyzeStockDataPromptDefinition = genericDefinition;
  }
  

  const promptString = buildPromptStringFromLlmDefinition(analyzeStockDataPromptDefinition);
  const modelId = analyzeStockDataPromptDefinition.modelId || DEFAULT_ANALYSIS_MODEL_ID;
  const safetySettings = analyzeStockDataPromptDefinition.safetySettings || [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  ];
  
  const promptConfig: {
    safetySettings: any[];
    thinkingConfig?: { thinkingBudget?: number };
  } = {
    safetySettings: safetySettings,
  };

  if (analyzeStockDataPromptDefinition.thinkingBudget !== undefined) {
    promptConfig.thinkingConfig = { thinkingBudget: analyzeStockDataPromptDefinition.thinkingBudget };
  }
  
  const prompt = ai.definePrompt({
    name: 'analyzeStockDataPrompt', 
    input: {schema: StockAnalysisInputSchema},
    output: {schema: StockAnalysisOutputSchema},
    model: modelId,
    prompt: promptString,
    config: promptConfig,
  });

  analyzeStockDataPrompt = prompt; // Cache the prompt object
  return analyzeStockDataPrompt;
}

export async function analyzeStockData(
  input: StockAnalysisInput
): Promise<StockAnalysisOutput> {
  const logPrefix = `[AIFlow:analyzeStockData:Ticker:${input.ticker}:Entry_DJ]`;
  try {
    const result = await analyzeStockDataFlow(input);
    return result;
  } catch (error) {
    throw error;
  }
}

const defaultTakeaway = (category: string, ticker: string): { takeaway: string; sentiment: "neutral" } => ({
  takeaway: `AI analysis for ${category} for ${ticker} was incomplete or not provided by the AI model.`,
  sentiment: "neutral",
});

const analyzeStockDataFlow = ai.defineFlow(
  {
    name: 'analyzeStockDataFlow',
    inputSchema: StockAnalysisInputSchema,
    outputSchema: StockAnalysisOutputSchema,
  },
  async (input: StockAnalysisInput): Promise<StockAnalysisOutput> => {
    const logPrefix = `[AIFlow:analyzeStockDataFlow:Ticker:${input.ticker}:DJ]`;
    
    let outputFromPrompt: StockAnalysisOutput | undefined;

    try {
      const promptToUse = await getAnalyzedStockDataPrompt();
      const result = await promptToUse(input);
      outputFromPrompt = result.output; 
      
      if (outputFromPrompt) {
      } else {
        throw new Error('AI prompt execution for Key Takeaways failed to return any output structure.');
      }

    } catch (error: any) {
      throw error; 
    }
    
    const finalOutput: StockAnalysisOutput = {
    };
    
    const categories: (keyof StockAnalysisOutput)[] = ["priceAction", "trend", "volatility", "momentum", "patterns"];
    for (const category of categories) {
        if (!finalOutput[category] || !finalOutput[category].takeaway || finalOutput[category].takeaway.trim() === "") {
            finalOutput[category] = defaultTakeaway(category, input.ticker);
        }
    }
    
    if (finalOutput.volatility && (!finalOutput.volatility.takeaway || finalOutput.volatility.takeaway.trim().split(/\s+/).length < 5)) {
        finalOutput.volatility.takeaway = `Volatility analysis for ${input.ticker} was not sufficiently detailed by the AI. Please refer to specific volatility indicators or market context.`;
        if (!finalOutput.volatility.sentiment) {
             finalOutput.volatility.sentiment = "neutral";
        }
    }

    return finalOutput;
  }
);
    
