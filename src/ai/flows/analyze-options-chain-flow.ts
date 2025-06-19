
'use server';
/**
 * @fileOverview An AI agent that analyzes options chain data to identify significant
 * features like Call/Put Walls. Prompt definition is loaded from a JSON file.
 *
 * - analyzeOptionsChain - Function to trigger the options analysis flow.
 * - AiOptionsAnalysisInput (from schemas) - Input type.
 * - AiOptionsAnalysisOutput (from schemas) - Output type.
 */

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

let analyzeOptionsChainPromptDefinition: LlmPromptDefinition | null = null;

async function getAnalyzedOptionsChainPrompt() {
  const logPrefix = '[AIFlow:getAnalyzedOptionsChainPrompt]';
  if (!analyzeOptionsChainPromptDefinition) {
    console.log(`${logPrefix} Loading 'analyze-options-chain' definition for the first time.`);
    const genericDefinition = await loadDefinition('analyze-options-chain');
    if (genericDefinition.definitionType !== 'llm-prompt') {
      const errorMsg = `Loaded definition for 'analyze-options-chain' is not an LLM prompt type. Type: ${genericDefinition.definitionType}`;
      console.error(`${logPrefix} ${errorMsg}`);
      throw new Error(errorMsg);
    }
    analyzeOptionsChainPromptDefinition = genericDefinition;
    console.log(`${logPrefix} 'analyze-options-chain' definition loaded and validated. Loaded definition (keys): ${Object.keys(analyzeOptionsChainPromptDefinition).join(', ')}`);
  }

  const promptString = buildPromptStringFromLlmDefinition(analyzeOptionsChainPromptDefinition);
  const modelId = analyzeOptionsChainPromptDefinition.modelId || DEFAULT_ANALYSIS_MODEL_ID;
  const safetySettings = analyzeOptionsChainPromptDefinition.safetySettings || [
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

  if (analyzeOptionsChainPromptDefinition.thinkingBudget !== undefined) {
    promptConfig.thinkingConfig = { thinkingBudget: analyzeOptionsChainPromptDefinition.thinkingBudget };
  }

  console.log(`${logPrefix} Using Model: ${modelId}. Prompt string (first 100 chars): ${promptString.substring(0,100)}...`);
  console.log(`${logPrefix} Safety settings configuration (count): ${safetySettings.length}. First setting category (if any): ${safetySettings[0]?.category}`);
  console.log(`${logPrefix} Thinking config: thinkingBudget=${promptConfig.thinkingConfig?.thinkingBudget}`);

  return ai.definePrompt({
    name: 'analyzeOptionsChainPrompt', 
    input: {schema: AiOptionsAnalysisInputSchema},
    output: {schema: AiOptionsAnalysisOutputSchema},
    model: modelId,
    prompt: promptString,
    config: promptConfig,
  });
}


export async function analyzeOptionsChain(
  input: AiOptionsAnalysisInput
): Promise<AiOptionsAnalysisOutput> {
  console.time('analyzeOptionsChainFlowExecutionTime');
  const logPrefix = `[AIFlow:analyzeOptionsChain:Ticker:${input.ticker}:Entry]`;
  console.log(`${logPrefix} Received input. Input keys: ${Object.keys(input).join(', ')}`);
  try {
    const result = await analyzeOptionsChainFlow(input);
    console.timeEnd('analyzeOptionsChainFlowExecutionTime');
    return result;
  } catch (error) {
    console.timeEnd('analyzeOptionsChainFlowExecutionTime');
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
    console.log(`${logPrefix} Flow execution started. Current underlying: ${input.currentUnderlyingPrice}`);
    console.log(`${logPrefix} Flow_Log_DJ_Input - optionsChainJson (len: ${input.optionsChainJson.length}): ${input.optionsChainJson.substring(0,100)}...`);
    
    const emptyOutputOnError: AiOptionsAnalysisOutput = {
      callWalls: [],
      putWalls: [],
    };

    let parsedOptionsData: OptionsChainData | null = null;
    try {
      parsedOptionsData = JSON.parse(input.optionsChainJson) as OptionsChainData;
      if (!parsedOptionsData.contracts || parsedOptionsData.contracts.length < 3) {
        console.warn(`${logPrefix} Pre-check: Options chain data seems insufficient (less than 3 contracts). Contracts length: ${parsedOptionsData.contracts?.length}. Returning empty walls.`);
        return emptyOutputOnError; // Return empty, not throw, as this is a valid data condition.
      }
      const totalOI = parsedOptionsData.contracts.reduce((sum, contract) => {
        return sum + (contract.call?.open_interest || 0) + (contract.put?.open_interest || 0);
      }, 0);
      const totalVolume = parsedOptionsData.contracts.reduce((sum, contract) => {
        return sum + (contract.call?.volume || 0) + (contract.put?.volume || 0);
      }, 0);

      if (totalOI === 0 && totalVolume === 0 && parsedOptionsData.contracts.length > 0) {
         console.warn(`${logPrefix} Pre-check: All open interest and volume are zero. Returning empty walls.`);
         return emptyOutputOnError; // Return empty for valid "no activity" data.
      }
      console.log(`${logPrefix} Pre-check passed. Total OI: ${totalOI}, Total Volume: ${totalVolume}, Contract Count: ${parsedOptionsData.contracts.length}`);
    } catch (e: any) {
      console.error(`${logPrefix} Pre-check: Failed to parse optionsChainJson or basic validation failed. Error: ${e.message}. Returning empty walls.`);
      return emptyOutputOnError; // Return empty, as this is a data integrity issue before AI.
    }

    let outputFromPrompt: AiOptionsAnalysisOutput | undefined;
    console.log(`${logPrefix} Flow_Log_DJ_PrePromptCall_Options - Executing analyzeOptionsChainPrompt.`);
    try {
        const promptToUse = await getAnalyzedOptionsChainPrompt();
        const result = await promptToUse(input); 
        outputFromPrompt = result.output;
        console.log(`${logPrefix} [Tokens] Thoughts: ${result.usageMetadata?.thoughtsTokenCount ?? 'N/A'}, Output: ${result.usageMetadata?.candidatesTokenCount ?? 'N/A'}`);
        console.log(`${logPrefix} Flow_Log_DJ_PostPromptCall_Options - Prompt execution completed. Output from AI (first 500 chars): ${outputFromPrompt ? JSON.stringify(outputFromPrompt).substring(0,500) : 'undefined'}`);

        if (!outputFromPrompt || !Array.isArray(outputFromPrompt.callWalls) || !Array.isArray(outputFromPrompt.putWalls)) {
          console.error(`${logPrefix} AI options analysis flow did not return a valid output structure. Received output: ${JSON.stringify(outputFromPrompt)}. Throwing error.`);
          throw new Error('AI prompt for Options Analysis failed to return a valid structure.');
        }
        
        const finalOutput: AiOptionsAnalysisOutput = {
            callWalls: (outputFromPrompt.callWalls || []).slice(0, 3),
            putWalls: (outputFromPrompt.putWalls || []).slice(0, 3),
        };

        console.log(`${logPrefix} Analysis complete. Call Walls identified: ${finalOutput.callWalls.length}, Put Walls identified: ${finalOutput.putWalls.length}.`);
        return finalOutput;

    } catch (promptError: any) {
        console.error(`${logPrefix} CRITICAL ERROR during analyzeOptionsChainPrompt execution. Error name: ${promptError?.name}, Message: ${promptError?.message}. Throwing error further.`);
        throw promptError; // Re-throw the error to be caught by the server action
    }
  }
);
    
