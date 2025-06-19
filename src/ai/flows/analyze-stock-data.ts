
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
  
  console.log(`${logPrefix} Using Model: ${modelId}. Prompt string (first 100 chars): ${promptString.substring(0,100)}...`);
  console.log(`${logPrefix} Safety settings configuration (count): ${safetySettings.length}. First setting category (if any): ${safetySettings[0]?.category}`);
  console.log(`${logPrefix} Thinking config: thinkingBudget=${promptConfig.thinkingConfig?.thinkingBudget}`);
  
  return ai.definePrompt({
    name: 'analyzeStockDataPrompt', 
    input: {schema: StockAnalysisInputSchema},
    output: {schema: StockAnalysisOutputSchema},
    model: modelId,
    prompt: promptString,
    config: promptConfig,
  });
}

export async function analyzeStockData(
  input: StockAnalysisInput
): Promise<StockAnalysisOutput> {
  console.time('analyzeStockDataFlowExecutionTime');
  const logPrefix = `[AIFlow:analyzeStockData:Ticker:${input.ticker}:Entry_DJ]`;
  console.log(`${logPrefix} Received request. Input keys: ${Object.keys(input).join(', ')}`);
  try {
    const result = await analyzeStockDataFlow(input);
    console.timeEnd('analyzeStockDataFlowExecutionTime');
    return result;
  } catch (error) {
    console.timeEnd('analyzeStockDataFlowExecutionTime');
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
    console.log(`${logPrefix} Flow execution started. Input keys: ${Object.keys(input).join(', ')}`);
    console.log(`${logPrefix} Flow_Log_DJ_Input - stockSnapshotJson (len: ${input.stockSnapshotJson.length}): ${input.stockSnapshotJson.substring(0,100)}...`);
    console.log(`${logPrefix} Flow_Log_DJ_Input - standardTasJson (len: ${input.standardTasJson.length}): ${input.standardTasJson.substring(0,100)}...`);
    console.log(`${logPrefix} Flow_Log_DJ_Input - aiAnalyzedTaJson (len: ${input.aiAnalyzedTaJson.length}): ${input.aiAnalyzedTaJson.substring(0,100)}...`);
    console.log(`${logPrefix} Flow_Log_DJ_Input - marketStatusJson (len: ${input.marketStatusJson.length}): ${input.marketStatusJson.substring(0,100)}...`);
    
    let outputFromPrompt: StockAnalysisOutput | undefined;

    try {
      const promptToUse = await getAnalyzedStockDataPrompt();
      console.log(`${logPrefix} Flow_Log_DJ_PrePromptCall - Executing analyzeStockDataPrompt.`);
      const result = await promptToUse(input);
      outputFromPrompt = result.output; 
      console.log(`${logPrefix} [Tokens] Thoughts: ${result.usageMetadata?.thoughtsTokenCount ?? 'N/A'}, Output: ${result.usageMetadata?.candidatesTokenCount ?? 'N/A'}`);
      console.log(`${logPrefix} Flow_Log_DJ_PostPromptCall - Prompt execution completed. outputFromPrompt is defined: ${!!outputFromPrompt}`);
      
      if (outputFromPrompt) {
        console.log(`${logPrefix} Flow_Log_DJ_OutputFromPrompt (raw from AI, first 500 chars): ${JSON.stringify(outputFromPrompt).substring(0,500)}`);
      } else {
        console.warn(`${logPrefix} Flow_Log_DJ_OutputFromPrompt_UNDEFINED - outputFromPrompt is UNDEFINED after AI call. This indicates a likely AI/prompt execution failure.`);
        throw new Error('AI prompt execution for Key Takeaways failed to return any output structure.');
      }

    } catch (error: any) {
      console.error(`${logPrefix} Flow_Log_DJ_PromptError - CRITICAL ERROR during analyzeStockDataPrompt execution. Error name: ${error?.name}, Message: ${error?.message}, Stack (first 500): ${error?.stack?.substring(0,500)}, Full error object (first 500): ${JSON.stringify(error).substring(0,500)}.`);
      throw error; 
    }
    
    const finalOutput: StockAnalysisOutput = {
      priceAction: outputFromPrompt.priceAction || (console.warn(`${logPrefix} Flow_Log_DJ_Defaulting - Defaulting Price Action.`), defaultTakeaway("price action", input.ticker)),
      trend: outputFromPrompt.trend || (console.warn(`${logPrefix} Flow_Log_DJ_Defaulting - Defaulting Trend.`), defaultTakeaway("trend", input.ticker)),
      volatility: outputFromPrompt.volatility || (console.warn(`${logPrefix} Flow_Log_DJ_Defaulting - Defaulting Volatility (initial).`), { takeaway: `Volatility analysis for ${input.ticker} was not sufficiently detailed by the AI. Please refer to specific volatility indicators or market context.`, sentiment: "neutral" }),
      momentum: outputFromPrompt.momentum || (console.warn(`${logPrefix} Flow_Log_DJ_Defaulting - Defaulting Momentum.`), defaultTakeaway("momentum", input.ticker)),
      patterns: outputFromPrompt.patterns || (console.warn(`${logPrefix} Flow_Log_DJ_Defaulting - Defaulting Patterns.`), defaultTakeaway("patterns", input.ticker)),
    };
    
    const categories: (keyof StockAnalysisOutput)[] = ["priceAction", "trend", "volatility", "momentum", "patterns"];
    for (const category of categories) {
        if (!finalOutput[category] || !finalOutput[category].takeaway || finalOutput[category].takeaway.trim() === "") {
            console.warn(`${logPrefix} Flow_Log_DJ_Defaulting_PostCheck - Output for category '${category}' was missing or empty after initial population from AI. Providing default message again.`);
            finalOutput[category] = defaultTakeaway(category, input.ticker);
        }
    }
    
    if (finalOutput.volatility && (!finalOutput.volatility.takeaway || finalOutput.volatility.takeaway.trim().split(/\s+/).length < 5)) {
        console.warn(`${logPrefix} Flow_Log_DJ_VolatilityShort - Volatility takeaway was too short or still default after initial. Setting specific placeholder. Current takeaway: "${finalOutput.volatility.takeaway}"`);
        finalOutput.volatility.takeaway = `Volatility analysis for ${input.ticker} was not sufficiently detailed by the AI. Please refer to specific volatility indicators or market context.`;
        if (!finalOutput.volatility.sentiment) {
             finalOutput.volatility.sentiment = "neutral";
        }
    }

    console.log(`${logPrefix} Flow_Log_DJ_Success - Flow successfully constructed output. Final output keys: ${Object.keys(finalOutput).join(', ')}. PriceAction takeaway (first 30): "${finalOutput.priceAction.takeaway.substring(0,30)}..."`);
    return finalOutput;
  }
);
    
