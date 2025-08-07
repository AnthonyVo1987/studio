
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
import { loadDefinition, buildPromptStringFromLlmDefinition } from '@/ai/definition-loader';

// Cache for the prompt object
let analyzeOptionsChainPrompt: unknown = null;

async function getAnalyzedOptionsChainPrompt() {
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
    safetySettings: Array<Record<string, unknown>>;
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
  const result = await analyzeOptionsChainFlow(input);
  return result;
}


const analyzeOptionsChainFlow = ai.defineFlow(
  {
    name: 'analyzeOptionsChainFlow',
    inputSchema: AiOptionsAnalysisInputSchema,
    outputSchema: AiOptionsAnalysisOutputSchema,
  },
  async (input: AiOptionsAnalysisInput): Promise<AiOptionsAnalysisOutput> => {
    
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
    } catch {
      return emptyOutputOnError;
    }

    const promptToUse = await getAnalyzedOptionsChainPrompt() as (input: unknown) => Promise<{ output: unknown }>;
    const result = await promptToUse(input); 
    const outputFromPrompt = result.output;

    if (!outputFromPrompt || !Array.isArray((outputFromPrompt as { callWalls?: unknown; putWalls?: unknown }).callWalls) || !Array.isArray((outputFromPrompt as { callWalls?: unknown; putWalls?: unknown }).putWalls)) {
      throw new Error('AI prompt for Options Analysis failed to return a valid structure.');
    }
    
    const finalOutput: AiOptionsAnalysisOutput = {
        callWalls: ((outputFromPrompt as { callWalls?: Array<unknown> }).callWalls || []).slice(0, 3) as Array<{ type: "call" | "put"; strike: number; openInterest: number; volume?: number }>,
        putWalls: ((outputFromPrompt as { putWalls?: Array<unknown> }).putWalls || []).slice(0, 3) as Array<{ type: "call" | "put"; strike: number; openInterest: number; volume?: number }>,
    };

    return finalOutput;
  }
);
    
