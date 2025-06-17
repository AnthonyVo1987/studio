
'use server';
/**
 * @fileOverview An AI agent that analyzes options chain data to identify significant
 * features like Call/Put Walls by looking for high and/or clustered OI/Volume.
 * Prompt definition is now loaded from a JSON file.
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
import { loadPromptDefinition, buildPromptStringFromDefinition, type PromptDefinition } from '@/ai/prompt-loader';

let analyzeOptionsChainPromptDefinition: PromptDefinition | null = null;

async function getAnalyzedOptionsChainPrompt() {
  if (!analyzeOptionsChainPromptDefinition) {
    analyzeOptionsChainPromptDefinition = await loadPromptDefinition('analyze-options-chain-prompt');
  }

  const promptString = buildPromptStringFromDefinition(analyzeOptionsChainPromptDefinition);
  const modelId = analyzeOptionsChainPromptDefinition.modelId || DEFAULT_ANALYSIS_MODEL_ID;
  const safetySettings = analyzeOptionsChainPromptDefinition.safetySettings || [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  ];

  return ai.definePrompt({
    name: 'analyzeOptionsChainPrompt', // Keep a consistent internal name for Genkit
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
  console.log('[AIFlow:analyzeOptionsChain] Received input for ticker:', input.ticker, 'Input keys:', Object.keys(input).join(', '));
  return analyzeOptionsChainFlow(input);
}


const analyzeOptionsChainFlow = ai.defineFlow(
  {
    name: 'analyzeOptionsChainFlow',
    inputSchema: AiOptionsAnalysisInputSchema,
    outputSchema: AiOptionsAnalysisOutputSchema,
  },
  async (input: AiOptionsAnalysisInput): Promise<AiOptionsAnalysisOutput> => {
    const emptyOutput: AiOptionsAnalysisOutput = {
      callWalls: [],
      putWalls: [],
    };

    let parsedOptionsData: OptionsChainData | null = null;
    try {
      parsedOptionsData = JSON.parse(input.optionsChainJson) as OptionsChainData;
      if (!parsedOptionsData.contracts || parsedOptionsData.contracts.length < 3) {
        console.warn('[AIFlow:analyzeOptionsChainFlow] Pre-check: Options chain data seems insufficient (less than 3 contracts). Returning empty walls.', 'Contracts length:', parsedOptionsData.contracts?.length);
        return emptyOutput;
      }
      const totalOI = parsedOptionsData.contracts.reduce((sum, contract) => {
        return sum + (contract.call?.open_interest || 0) + (contract.put?.open_interest || 0);
      }, 0);
      const totalVolume = parsedOptionsData.contracts.reduce((sum, contract) => {
        return sum + (contract.call?.volume || 0) + (contract.put?.volume || 0);
      }, 0);

      if (totalOI === 0 && totalVolume === 0 && parsedOptionsData.contracts.length > 0) {
         console.warn('[AIFlow:analyzeOptionsChainFlow] Pre-check: All open interest and volume are zero. Returning empty walls.');
         return emptyOutput;
      }

    } catch (e) {
      console.error('[AIFlow:analyzeOptionsChainFlow] Pre-check: Failed to parse optionsChainJson or basic validation failed:', e);
      return emptyOutput;
    }

    console.log('[AIFlow:analyzeOptionsChainFlow] Executing prompt for ticker:', input.ticker);
    try {
        const promptToUse = await getAnalyzedOptionsChainPrompt();
        const {output} = await promptToUse(input);

        if (!output || !Array.isArray(output.callWalls) || !Array.isArray(output.putWalls)) {
          console.error('[AIFlow:analyzeOptionsChainFlow] AI options analysis flow did not return a valid output structure for ticker:', input.ticker, 'Received output:', JSON.stringify(output).substring(0,500));
          return emptyOutput;
        }
        
        const finalOutput: AiOptionsAnalysisOutput = {
            callWalls: (output.callWalls || []).slice(0, 3),
            putWalls: (output.putWalls || []).slice(0, 3),
        };

        console.log('[AIFlow:analyzeOptionsChainFlow] Analysis complete for ticker:', input.ticker, 'Call Walls:', finalOutput.callWalls.length, 'Put Walls:', finalOutput.putWalls.length);
        return finalOutput;

    } catch (promptError: any) {
        console.error('[AIFlow:analyzeOptionsChainFlow] CRITICAL ERROR during analyzeOptionsChainPrompt execution for ticker:', input.ticker, 'Error name:', promptError?.name, 'Error message:', promptError?.message, 'Error stack (first 500):', promptError?.stack?.substring(0,500), 'Full error object:', JSON.stringify(promptError).substring(0,500));
        return emptyOutput;
    }
  }
);
