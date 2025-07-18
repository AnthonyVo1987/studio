
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

import { logger } from '@/lib/logger';
import {ai} from '@/ai/genkit';
import {
  StockAnalysisInputSchema,
  type StockAnalysisInput,
  StockAnalysisOutputSchema,
  type StockAnalysisOutput,
} from '@/ai/schemas/stock-analysis-schemas';
import {DEFAULT_ANALYSIS_MODEL_ID} from '@/ai/models';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';

// Cache for the prompt object
let analyzeStockDataPrompt: any = null;

async function getAnalyzedStockDataPrompt() {
  const logPrefix = '[AIFlow:getAnalyzedStockDataPrompt]';
  if (analyzeStockDataPrompt) {
    logger.debug(`${logPrefix} Returning cached prompt object.`);
    return analyzeStockDataPrompt;
  }

  logger.info(`${logPrefix} Loading 'analyze-stock-data' definition.`);
  const genericDefinition = await loadDefinition('analyze-stock-data');
  if (genericDefinition.definitionType !== 'llm-prompt') {
    const errorMsg = `Loaded definition for 'analyze-stock-data' is not an LLM prompt type. Type: ${genericDefinition.definitionType}`;
    logger.error(`${logPrefix} ${errorMsg}`);
    throw new Error(errorMsg);
  }
  const analyzeStockDataPromptDefinition = genericDefinition;
  logger.info(`${logPrefix} 'analyze-stock-data' definition loaded and validated.`, {
    keys: Object.keys(analyzeStockDataPromptDefinition)
  });

  const promptString = buildPromptStringFromLlmDefinition(analyzeStockDataPromptDefinition!);
  const modelId = analyzeStockDataPromptDefinition!.modelId || DEFAULT_ANALYSIS_MODEL_ID;
  const safetySettings = analyzeStockDataPromptDefinition!.safetySettings || [
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

  if (analyzeStockDataPromptDefinition!.thinkingBudget !== undefined) {
    promptConfig.thinkingConfig = { thinkingBudget: analyzeStockDataPromptDefinition!.thinkingBudget };
  }
  
  logger.info(`${logPrefix} Defining prompt.`, {
    modelId,
    grounding: false,
    thinkingBudget: promptConfig.thinkingConfig?.thinkingBudget ?? 'N/A',
    safetySettings: safetySettings.length,
    promptStart: promptString.substring(0, 50)
  });
  
  const prompt = ai.definePrompt({
    name: 'analyzeStockDataPrompt', 
    input: {schema: StockAnalysisInputSchema},
    output: {schema: StockAnalysisOutputSchema},
    model: modelId,
    prompt: promptString,
    config: promptConfig,
  });

  analyzeStockDataPrompt = prompt; // Cache the prompt object
  logger.info(`${logPrefix} Prompt object defined and cached.`);
  return analyzeStockDataPrompt;
}

export async function analyzeStockData(
  input: StockAnalysisInput
): Promise<StockAnalysisOutput> {
  const startTime = Date.now();
  const logPrefix = `[AIFlow:analyzeStockData:Ticker:${input.ticker}:Entry_DJ]`;
  logger.info(`${logPrefix} Received request.`, {
    keys: Object.keys(input)
  });
  try {
    const result = await analyzeStockDataFlow(input);
    const duration = Date.now() - startTime;
    logger.info(`${logPrefix} Flow execution completed in ${duration}ms.`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${logPrefix} Flow execution failed after ${duration}ms.`);
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
    logger.info(`${logPrefix} Flow execution started.`, {
      keys: Object.keys(input)
    });
    
    let outputFromPrompt: StockAnalysisOutput | undefined;

    try {
      const promptToUse = await getAnalyzedStockDataPrompt();
      logger.info(`${logPrefix} Executing analyzeStockDataPrompt.`);
      const result = await promptToUse(input);
      outputFromPrompt = result.output; 
      logger.debug(`${logPrefix} [Tokens]`, {
        thoughts: result.usageMetadata?.thoughtsTokenCount ?? 'N/A',
        output: result.usageMetadata?.candidatesTokenCount ?? 'N/A'
      });
      logger.debug(`${logPrefix} Prompt execution completed.`, {
        outputDefined: !!outputFromPrompt
      });
      
      if (outputFromPrompt) {
        logger.debug(`${logPrefix} OutputFromPrompt (raw from AI)`, {
          output: JSON.stringify(outputFromPrompt).substring(0,500)
        });
      } else {
        logger.warn(`${logPrefix} OutputFromPrompt_UNDEFINED - outputFromPrompt is UNDEFINED after AI call. This indicates a likely AI/prompt execution failure.`);
        throw new Error('AI prompt execution for Key Takeaways failed to return any output structure.');
      }

    } catch (error: any) {
      logger.error(`${logPrefix} CRITICAL ERROR during analyzeStockDataPrompt execution.`, {
        name: error?.name,
        message: error?.message,
        stack: error?.stack?.substring(0,500),
        fullError: JSON.stringify(error).substring(0,500)
      });
      throw error; 
    }
    
    const finalOutput: StockAnalysisOutput = {
      priceAction: outputFromPrompt.priceAction || (logger.warn(`${logPrefix} Defaulting Price Action.`), defaultTakeaway("price action", input.ticker)),
      trend: outputFromPrompt.trend || (logger.warn(`${logPrefix} Defaulting Trend.`), defaultTakeaway("trend", input.ticker)),
      volatility: outputFromPrompt.volatility || (logger.warn(`${logPrefix} Defaulting Volatility (initial).`), { takeaway: `Volatility analysis for ${input.ticker} was not sufficiently detailed by the AI. Please refer to specific volatility indicators or market context.`, sentiment: "neutral" }),
      momentum: outputFromPrompt.momentum || (logger.warn(`${logPrefix} Defaulting Momentum.`), defaultTakeaway("momentum", input.ticker)),
      patterns: outputFromPrompt.patterns || (logger.warn(`${logPrefix} Defaulting Patterns.`), defaultTakeaway("patterns", input.ticker)),
    };
    
    const categories: (keyof StockAnalysisOutput)[] = ["priceAction", "trend", "volatility", "momentum", "patterns"];
    for (const category of categories) {
        if (!finalOutput[category] || !finalOutput[category].takeaway || finalOutput[category].takeaway.trim() === "") {
            logger.warn(`${logPrefix} Defaulting_PostCheck - Output for category '${category}' was missing or empty after initial population from AI. Providing default message again.`);
            finalOutput[category] = defaultTakeaway(category, input.ticker);
        }
    }
    
    if (finalOutput.volatility && (!finalOutput.volatility.takeaway || finalOutput.volatility.takeaway.trim().split(/\s+/).length < 5)) {
        logger.warn(`${logPrefix} VolatilityShort - Volatility takeaway was too short or still default after initial. Setting specific placeholder.`, {
          currentTakeaway: finalOutput.volatility.takeaway
        });
        finalOutput.volatility.takeaway = `Volatility analysis for ${input.ticker} was not sufficiently detailed by the AI. Please refer to specific volatility indicators or market context.`;
        if (!finalOutput.volatility.sentiment) {
             finalOutput.volatility.sentiment = "neutral";
        }
    }

    logger.info(`${logPrefix} Flow successfully constructed output.`, {
      keys: Object.keys(finalOutput),
      priceActionTakeaway: finalOutput.priceAction.takeaway.substring(0,30)
    });
    return finalOutput;
  }
);
    
