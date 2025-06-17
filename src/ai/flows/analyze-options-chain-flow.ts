
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
      { category: 'SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  ];

  console.log(`${logPrefix} Using Model: ${modelId}. Prompt string (first 100 chars): ${promptString.substring(0,100)}...`);
  console.log(`${logPrefix} Safety settings configuration (count): ${safetySettings.length}. First setting category (if any): ${safetySettings[0]?.category}`);

  return ai.definePrompt({
    name: 'analyzeOptionsChainPrompt', 
    input: {schema: AiOptionsAnalysisInputSchema},
    output: {schema: AiOptionsAnalysisOutputSchema},
    model: modelId,
    prompt: promptString,
    config: {
      safetySettings: safetySettings,
    },
  });
}


export async function analyzeOptionsChain(
  input: AiOptionsAnalysisInput
): Promise<AiOptionsAnalysisOutput> {
  console.log('[AIFlow:analyzeOptionsChain:Entry] Received input for ticker:', input.ticker, 'Input keys:', Object.keys(input).join(', '));
  return analyzeOptionsChainFlow(input);
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
    
    const emptyOutput: AiOptionsAnalysisOutput = {
      callWalls: [],
      putWalls: [],
    };

    let parsedOptionsData: OptionsChainData | null = null;
    try {
      parsedOptionsData = JSON.parse(input.optionsChainJson) as OptionsChainData;
      if (!parsedOptionsData.contracts || parsedOptionsData.contracts.length < 3) {
        console.warn(`${logPrefix} Pre-check: Options chain data seems insufficient (less than 3 contracts). Contracts length: ${parsedOptionsData.contracts?.length}. Returning empty walls.`);
        return emptyOutput;
      }
      const totalOI = parsedOptionsData.contracts.reduce((sum, contract) => {
        return sum + (contract.call?.open_interest || 0) + (contract.put?.open_interest || 0);
      }, 0);
      const totalVolume = parsedOptionsData.contracts.reduce((sum, contract) => {
        return sum + (contract.call?.volume || 0) + (contract.put?.volume || 0);
      }, 0);

      if (totalOI === 0 && totalVolume === 0 && parsedOptionsData.contracts.length > 0) {
         console.warn(`${logPrefix} Pre-check: All open interest and volume are zero for ticker ${input.ticker}. Returning empty walls.`);
         return emptyOutput;
      }
      console.log(`${logPrefix} Pre-check passed for ${input.ticker}. Total OI: ${totalOI}, Total Volume: ${totalVolume}, Contract Count: ${parsedOptionsData.contracts.length}`);
    } catch (e: any) {
      console.error(`${logPrefix} Pre-check: Failed to parse optionsChainJson or basic validation failed for ticker ${input.ticker}. Error: ${e.message}. Returning empty walls.`);
      return emptyOutput;
    }

    console.log(`${logPrefix} Executing prompt for ticker ${input.ticker}. Input keys: ${Object.keys(input).join(', ')}`);
    try {
        const promptToUse = await getAnalyzedOptionsChainPrompt();
        const {output} = await promptToUse(input);

        if (!output || !Array.isArray(output.callWalls) || !Array.isArray(output.putWalls)) {
          console.error(`${logPrefix} AI options analysis flow for ticker ${input.ticker} did not return a valid output structure. Received output (first 500 chars): ${JSON.stringify(output).substring(0,500)}. Returning empty walls.`);
          return emptyOutput;
        }
        
        const finalOutput: AiOptionsAnalysisOutput = {
            callWalls: (output.callWalls || []).slice(0, 3),
            putWalls: (output.putWalls || []).slice(0, 3),
        };

        console.log(`${logPrefix} Analysis complete for ${input.ticker}. Call Walls identified: ${finalOutput.callWalls.length}, Put Walls identified: ${finalOutput.putWalls.length}.`);
        return finalOutput;

    } catch (promptError: any) {
        console.error(`${logPrefix} CRITICAL ERROR during analyzeOptionsChainPrompt execution for ticker ${input.ticker}. Error name: ${promptError?.name}, Message: ${promptError?.message}, Stack (first 500): ${promptError?.stack?.substring(0,500)}, Full error object (first 500): ${JSON.stringify(promptError).substring(0,500)}. Returning empty walls.`);
        return emptyOutput;
    }
  }
);

