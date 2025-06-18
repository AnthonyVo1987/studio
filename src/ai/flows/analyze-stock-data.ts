
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
  const logPrefix = '[AIFlow:getAnalyzedStockDataPrompt]';
  if (!analyzeStockDataPromptDefinition) {
    console.log(`${logPrefix} Loading 'analyze-stock-data' definition for the first time.`);
    const genericDefinition = await loadDefinition('analyze-stock-data');
    if (genericDefinition.definitionType !== 'llm-prompt') {
      const errorMsg = `Loaded definition for 'analyze-stock-data' is not an LLM prompt type. Type: ${genericDefinition.definitionType}`;
      console.error(`${logPrefix} ${errorMsg}`);
      throw new Error(errorMsg);
    }
    analyzeStockDataPromptDefinition = genericDefinition;
    console.log(`${logPrefix} 'analyze-stock-data' definition loaded and validated. Loaded definition (keys): ${Object.keys(analyzeStockDataPromptDefinition).join(', ')}`);
  }

  const promptString = buildPromptStringFromLlmDefinition(analyzeStockDataPromptDefinition);
  const modelId = analyzeStockDataPromptDefinition.modelId || DEFAULT_ANALYSIS_MODEL_ID;
  const safetySettings = analyzeStockDataPromptDefinition.safetySettings || [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  ];
  
  console.log(`${logPrefix} Using Model: ${modelId}. Prompt string (first 100 chars): ${promptString.substring(0,100)}...`);
  console.log(`${logPrefix} Safety settings configuration (count): ${safetySettings.length}. First setting category (if any): ${safetySettings[0]?.category}`);
  
  return ai.definePrompt({
    name: 'analyzeStockDataPrompt', 
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
  console.log('[AIFlow:analyzeStockData:Entry] Received request for ticker:', input.ticker, 'Input keys:', Object.keys(input).join(', '));
  return analyzeStockDataFlow(input);
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
    const logPrefix = `[AIFlow:analyzeStockDataFlow:Ticker:${input.ticker}]`;
    console.log(`${logPrefix} Flow execution started. Input keys: ${Object.keys(input).join(', ')}`);
    console.log(`${logPrefix} Flow Input - ticker: ${input.ticker}`);
    console.log(`${logPrefix} Flow Input - stockSnapshotJson (len: ${input.stockSnapshotJson.length}): ${input.stockSnapshotJson.substring(0,100)}...`);
    console.log(`${logPrefix} Flow Input - standardTasJson (len: ${input.standardTasJson.length}): ${input.standardTasJson.substring(0,100)}...`);
    console.log(`${logPrefix} Flow Input - aiAnalyzedTaJson (len: ${input.aiAnalyzedTaJson.length}): ${input.aiAnalyzedTaJson.substring(0,100)}...`);
    console.log(`${logPrefix} Flow Input - marketStatusJson (len: ${input.marketStatusJson.length}): ${input.marketStatusJson.substring(0,100)}...`);
    
    let outputFromPrompt: StockAnalysisOutput | undefined;

    try {
      const promptToUse = await getAnalyzedStockDataPrompt();
      console.log(`${logPrefix} Executing analyzeStockDataPrompt for ticker: ${input.ticker}.`);
      const result = await promptToUse(input);
      outputFromPrompt = result.output;
      console.log(`${logPrefix} analyzeStockDataPrompt completed for ticker: ${input.ticker}. Output keys from AI: ${outputFromPrompt ? Object.keys(outputFromPrompt).join(', ') : 'undefined'}`);
    } catch (error: any) {
      console.error(`${logPrefix} CRITICAL ERROR during analyzeStockDataPrompt execution for ticker: ${input.ticker}. Error name: ${error?.name}, Message: ${error?.message}, Stack (first 500): ${error?.stack?.substring(0,500)}, Full error object (first 500): ${JSON.stringify(error).substring(0,500)}.`);
      outputFromPrompt = undefined; 
    }

    const finalOutput: StockAnalysisOutput = {
      priceAction: outputFromPrompt?.priceAction || defaultTakeaway("price action", input.ticker),
      trend: outputFromPrompt?.trend || defaultTakeaway("trend", input.ticker),
      volatility: outputFromPrompt?.volatility || { takeaway: `Volatility analysis for ${input.ticker} was not sufficiently detailed by the AI. Please refer to specific volatility indicators or market context.`, sentiment: "neutral" },
      momentum: outputFromPrompt?.momentum || defaultTakeaway("momentum", input.ticker),
      patterns: outputFromPrompt?.patterns || defaultTakeaway("patterns", input.ticker),
    };
    
    const categories: (keyof StockAnalysisOutput)[] = ["priceAction", "trend", "volatility", "momentum", "patterns"];
    for (const category of categories) {
        if (!finalOutput[category] || !finalOutput[category].takeaway || finalOutput[category].takeaway.trim() === "") {
            console.warn(`${logPrefix} Output for category '${category}' was missing or empty after initial population for ticker ${input.ticker}. Providing default message.`);
            finalOutput[category] = defaultTakeaway(category, input.ticker);
        }
    }
    
    if (finalOutput.volatility && (!finalOutput.volatility.takeaway || finalOutput.volatility.takeaway.trim().split(/\s+/).length < 5)) {
        console.warn(`${logPrefix} Volatility takeaway for ${input.ticker} was too short or still default after initial. Setting specific placeholder.`);
        finalOutput.volatility.takeaway = `Volatility analysis for ${input.ticker} was not sufficiently detailed by the AI. Please refer to specific volatility indicators or market context.`;
        if (!finalOutput.volatility.sentiment) {
             finalOutput.volatility.sentiment = "neutral";
        }
    }

    console.log(`${logPrefix} Flow successfully executed for ticker ${input.ticker}. Final output keys: ${Object.keys(finalOutput).join(', ')}`);
    return finalOutput;
  }
);


    