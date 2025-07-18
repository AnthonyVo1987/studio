
'use server';
/**
 * @fileOverview An AI agent that analyzes options chain data to identify significant
 * features like Call/Put Walls. Prompt definition is loaded from a JSON file.
 *
 * - analyzeOptionsChain - Function to trigger the options analysis flow.
 * - AiOptionsAnalysisInput (from schemas) - Input type.
 * - AiOptionsAnalysisOutput (from schemas) - Output type.
 */

import { logger } from '@/lib/logger';
import {ai} from '@/ai/genkit';
import {
  AiOptionsAnalysisInputSchema,
  type AiOptionsAnalysisInput,
  AiOptionsAnalysisOutputSchema,
  type AiOptionsAnalysisOutput,
} from '@/ai/schemas/ai-options-analysis-schemas';
import {DEFAULT_ANALYSIS_MODEL_ID} from '@/ai/models';
import type { OptionsChainData } from '@/services/data-sources/types';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';

// Cache for the prompt object
let analyzeOptionsChainPrompt: any = null;

async function getAnalyzedOptionsChainPrompt() {
  const logPrefix = '[AIFlow:getAnalyzedOptionsChainPrompt]';
  if (analyzeOptionsChainPrompt) {
    logPrefix && logger.debug(`${logPrefix} Returning cached prompt object.`);
    return analyzeOptionsChainPrompt;
  }
  
  logger.info(`${logPrefix} Loading 'analyze-options-chain' definition.`);
  const genericDefinition = await loadDefinition('analyze-options-chain');
  if (genericDefinition.definitionType !== 'llm-prompt') {
    const errorMsg = `Loaded definition for 'analyze-options-chain' is not an LLM prompt type. Type: ${genericDefinition.definitionType}`;
    logger.error(`${logPrefix} ${errorMsg}`);
    throw new Error(errorMsg);
  }
  const analyzeOptionsChainPromptDefinition = genericDefinition;
  logger.info(`${logPrefix} 'analyze-options-chain' definition loaded and validated.`, {
    keys: Object.keys(analyzeOptionsChainPromptDefinition)
  });

  const promptString = buildPromptStringFromLlmDefinition(analyzeOptionsChainPromptDefinition!);
  const modelId = analyzeOptionsChainPromptDefinition!.modelId || DEFAULT_ANALYSIS_MODEL_ID;
  const safetySettings = analyzeOptionsChainPromptDefinition!.safetySettings || [
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

  if (analyzeOptionsChainPromptDefinition!.thinkingBudget !== undefined) {
    promptConfig.thinkingConfig = { thinkingBudget: analyzeOptionsChainPromptDefinition!.thinkingBudget };
  }

  logger.info(`${logPrefix} Defining prompt.`, {
    modelId,
    grounding: false,
    thinkingBudget: promptConfig.thinkingConfig?.thinkingBudget ?? 'N/A',
    safetySettings: safetySettings.length,
    promptStart: promptString.substring(0, 50)
  });
  
  const prompt = ai.definePrompt({
    name: 'analyzeOptionsChainPrompt', 
    input: {schema: AiOptionsAnalysisInputSchema},
    output: {schema: AiOptionsAnalysisOutputSchema},
    model: modelId,
    prompt: promptString,
    config: promptConfig,
  });

  analyzeOptionsChainPrompt = prompt; // Cache the prompt object
  logger.info(`${logPrefix} Prompt object defined and cached.`);
  return analyzeOptionsChainPrompt;
}


export async function analyzeOptionsChain(
  input: AiOptionsAnalysisInput
): Promise<AiOptionsAnalysisOutput> {
  const startTime = Date.now();
  const logPrefix = `[AIFlow:analyzeOptionsChain:Ticker:${input.ticker}:Entry]`;
  logger.info(`${logPrefix} Received input.`, {
    keys: Object.keys(input)
  });
  try {
    const result = await analyzeOptionsChainFlow(input);
    const duration = Date.now() - startTime;
    logger.info(`${logPrefix} Flow execution completed in ${duration}ms.`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${logPrefix} Flow execution failed after ${duration}ms.`);
    throw error;
  }
}


const analyzeOptionsChainFlow = ai.defineFlow(
  {
    name: 'analyzeOptionsChainFlow',
    inputSchema: AiOptionsAnalysisInputSchema,
    outputSchema: AiOptionsAnalysisOutputSchema,
  },
  async (input: AiOptionsAnalysisInput): Promise<AiOptionsAnalysisOutput> => {
    const logPrefix = `[AIFlow:analyzeOptionsChainFlow:Ticker:${input.ticker}]`;
    logger.info(`${logPrefix} Flow execution started.`, {
      currentUnderlyingPrice: input.currentUnderlyingPrice
    });
    
    const emptyOutputOnError: AiOptionsAnalysisOutput = {
      callWalls: [],
      putWalls: [],
    };

    let parsedOptionsData: OptionsChainData | null = null;
    try {
      parsedOptionsData = JSON.parse(input.optionsChainJson) as OptionsChainData;
      if (!parsedOptionsData.contracts || parsedOptionsData.contracts.length < 3) {
        logger.warn(`${logPrefix} Pre-check: Options chain data seems insufficient (less than 3 contracts). Returning empty walls.`, {
          contractsLength: parsedOptionsData.contracts?.length
        });
        return emptyOutputOnError; 
      }
      logger.info(`${logPrefix} Pre-check passed.`, {
        contractCount: parsedOptionsData.contracts.length
      });
    } catch (e: any) {
      logger.error(`${logPrefix} Pre-check: Failed to parse optionsChainJson or basic validation failed. Returning empty walls.`, {
        error: e.message
      });
      return emptyOutputOnError;
    }

    let outputFromPrompt: AiOptionsAnalysisOutput | undefined;
    logger.info(`${logPrefix} Executing analyzeOptionsChainPrompt.`);
    try {
        const promptToUse = await getAnalyzedOptionsChainPrompt();
        const result = await promptToUse(input); 
        outputFromPrompt = result.output;
        logger.debug(`${logPrefix} [Tokens]`, {
          thoughts: result.usageMetadata?.thoughtsTokenCount ?? 'N/A',
          output: result.usageMetadata?.candidatesTokenCount ?? 'N/A'
        });
        logger.debug(`${logPrefix} Prompt execution completed.`, {
          output: outputFromPrompt ? JSON.stringify(outputFromPrompt).substring(0,500) : 'undefined'
        });

        if (!outputFromPrompt || !Array.isArray(outputFromPrompt.callWalls) || !Array.isArray(outputFromPrompt.putWalls)) {
          logger.error(`${logPrefix} AI options analysis flow did not return a valid output structure. Throwing error.`, {
            output: JSON.stringify(outputFromPrompt)
          });
          throw new Error('AI prompt for Options Analysis failed to return a valid structure.');
        }
        
        const finalOutput: AiOptionsAnalysisOutput = {
            callWalls: (outputFromPrompt.callWalls || []).slice(0, 3),
            putWalls: (outputFromPrompt.putWalls || []).slice(0, 3),
        };

        logger.info(`${logPrefix} Analysis complete.`, {
          callWalls: finalOutput.callWalls.length,
          putWalls: finalOutput.putWalls.length
        });
        return finalOutput;

    } catch (promptError: any) {
        logger.error(`${logPrefix} CRITICAL ERROR during analyzeOptionsChainPrompt execution. Throwing error further.`, {
          name: promptError?.name,
          message: promptError?.message
        });
        throw promptError;
    }
  }
);
    
