
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

// Export types for use in actions
export type { AiOptionsAnalysisInput, AiOptionsAnalysisOutput };
import {DEFAULT_ANALYSIS_MODEL_ID} from '@/ai/models';
import type { OptionsChainData } from '@/services/data-sources/types';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';

// Cache for the prompt object
let analyzeOptionsChainPrompt: any = null;

async function getAnalyzedOptionsChainPrompt() {
  const logPrefix = '[AIFlow:getAnalyzedOptionsChainPrompt]';
  if (analyzeOptionsChainPrompt) {
    return analyzeOptionsChainPrompt;
  }
  
  const genericDefinition = await loadDefinition('analyze-options-chain');
  if (genericDefinition.definitionType !== 'llm-prompt') {
    const errorMsg = `Loaded definition for 'analyze-options-chain' is not an LLM prompt type. Type: ${genericDefinition.definitionType}`;
    throw new Error(errorMsg);
  }
  const analyzeOptionsChainPromptDefinition = genericDefinition;

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
    temperature?: number;
    seed?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  } = {
    safetySettings: safetySettings,
  };

  if (analyzeOptionsChainPromptDefinition!.thinkingBudget !== undefined) {
    promptConfig.thinkingConfig = { thinkingBudget: analyzeOptionsChainPromptDefinition!.thinkingBudget };
  }

  // Add generation config parameters directly to promptConfig (Genkit expects flat structure)
  if (analyzeOptionsChainPromptDefinition!.temperature !== undefined) {
    promptConfig.temperature = analyzeOptionsChainPromptDefinition!.temperature;
  }
  if (analyzeOptionsChainPromptDefinition!.seed !== undefined) {
    promptConfig.seed = analyzeOptionsChainPromptDefinition!.seed;
  }
  if (analyzeOptionsChainPromptDefinition!.maxOutputTokens !== undefined) {
    promptConfig.maxOutputTokens = analyzeOptionsChainPromptDefinition!.maxOutputTokens;
  }
  if (analyzeOptionsChainPromptDefinition!.topP !== undefined) {
    promptConfig.topP = analyzeOptionsChainPromptDefinition!.topP;
  }
  if (analyzeOptionsChainPromptDefinition!.topK !== undefined) {
    promptConfig.topK = analyzeOptionsChainPromptDefinition!.topK;
  }

  
  const prompt = ai.definePrompt({
    name: 'analyzeOptionsChainPrompt', 
    input: {schema: AiOptionsAnalysisInputSchema},
    output: {schema: AiOptionsAnalysisOutputSchema},
    model: modelId,
    prompt: promptString,
    config: promptConfig,
  });

  analyzeOptionsChainPrompt = prompt; // Cache the prompt object
  return analyzeOptionsChainPrompt;
}


export async function analyzeOptionsChain(
  input: AiOptionsAnalysisInput
): Promise<AiOptionsAnalysisOutput> {
  const logPrefix = `[AIFlow:analyzeOptionsChain:Ticker:${input.ticker}:Entry]`;
  try {
    const result = await analyzeOptionsChainFlow(input);
    return result;
  } catch (error) {
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
    
    const emptyOutputOnError: AiOptionsAnalysisOutput = {
      callWalls: [],
      putWalls: [],
    };

    let parsedOptionsData: OptionsChainData | null = null;
    try {
      parsedOptionsData = JSON.parse(input.optionsChainJson) as OptionsChainData;
      if (!parsedOptionsData.contracts || parsedOptionsData.contracts.length < 3) {
        return emptyOutputOnError; 
      }
    } catch (e: any) {
      return emptyOutputOnError;
    }

    let outputFromPrompt: AiOptionsAnalysisOutput | undefined;
    try {
        const promptToUse = await getAnalyzedOptionsChainPrompt();
        const result = await promptToUse(input); 
        outputFromPrompt = result.output;

        if (!outputFromPrompt || !Array.isArray(outputFromPrompt.callWalls) || !Array.isArray(outputFromPrompt.putWalls)) {
          throw new Error('AI prompt for Options Analysis failed to return a valid structure.');
        }
        
        const finalOutput: AiOptionsAnalysisOutput = {
            callWalls: (outputFromPrompt.callWalls || []).slice(0, 3),
            putWalls: (outputFromPrompt.putWalls || []).slice(0, 3),
        };

        return finalOutput;

    } catch (promptError: any) {
        throw promptError;
    }
  }
);
    
