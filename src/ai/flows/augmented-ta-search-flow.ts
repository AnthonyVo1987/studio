
'use server';
/**
 * @fileOverview An AI flow dedicated to searching for advanced technical analysis indicators using Google Search.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  AugmentedTaSearchInputSchema,
  type AugmentedTaSearchInput,
  AugmentedTaSearchOutputSchema,
  type AugmentedTaSearchOutput,
} from '@/ai/schemas/augmented-ta-search-schemas';
import { DEFAULT_ANALYSIS_MODEL_ID } from '@/ai/models';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';
import { extractJsonString } from '@/lib/string-utils';

let augmentedTaSearchPrompt: any = null;

async function getAugmentedTaSearchPrompt() {
  const logPrefix = '[AIFlow:getAugmentedTaSearchPrompt]';
  if (augmentedTaSearchPrompt) {
    return augmentedTaSearchPrompt;
  }
  
  const definition = await loadDefinition('augmented-ta-search') as LlmPromptDefinition;
  const promptString = buildPromptStringFromLlmDefinition(definition);
  
  console.log(`${logPrefix} Defining prompt. Model: ${definition.modelId}, Grounding: true`);

  const prompt = ai.definePrompt({
    name: 'augmentedTaSearchPrompt',
    input: { schema: AugmentedTaSearchInputSchema },
    model: definition.modelId || DEFAULT_ANALYSIS_MODEL_ID,
    prompt: promptString,
    config: {
      safetySettings: definition.safetySettings,
      thinkingConfig: { thinkingBudget: definition.thinkingBudget },
      tools: [{ googleSearch: {} }],
    },
  });

  augmentedTaSearchPrompt = prompt;
  return augmentedTaSearchPrompt;
}

export async function augmentedTaSearch(input: AugmentedTaSearchInput): Promise<AugmentedTaSearchOutput> {
  return augmentedTaSearchFlow(input);
}

const augmentedTaSearchFlow = ai.defineFlow(
  {
    name: 'augmentedTaSearchFlow',
    inputSchema: AugmentedTaSearchInputSchema,
    outputSchema: AugmentedTaSearchOutputSchema,
  },
  async (input) => {
    const logPrefix = `[AIFlow:augmentedTaSearchFlow:Ticker:${input.ticker}]`;
    console.log(`${logPrefix} Flow execution started.`);
    
    const prompt = await getAugmentedTaSearchPrompt();
    const result = await prompt(input);
    const rawTextResponse = result.text;
    
    if (!rawTextResponse) {
      throw new Error("Augmented TA search returned no text response.");
    }

    const jsonString = extractJsonString(rawTextResponse);
    if (!jsonString) {
      throw new Error("Could not extract valid JSON from augmented TA search AI response.");
    }
    
    const parsedData = JSON.parse(jsonString);
    return AugmentedTaSearchOutputSchema.parse(parsedData);
  }
);
