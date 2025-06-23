
'use server';
/**
 * @fileOverview An AI flow dedicated to searching for advanced options metrics using Google Search.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  AugmentedOptionsSearchInputSchema,
  type AugmentedOptionsSearchInput,
  AugmentedOptionsSearchOutputSchema,
  type AugmentedOptionsSearchOutput,
} from '@/ai/schemas/augmented-options-search-schemas';
import { DEFAULT_ANALYSIS_MODEL_ID } from '@/ai/models';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';
import { extractJsonString } from '@/lib/string-utils';

let augmentedOptionsSearchPrompt: any = null;

async function getAugmentedOptionsSearchPrompt() {
  const logPrefix = '[AIFlow:getAugmentedOptionsSearchPrompt]';
  if (augmentedOptionsSearchPrompt) {
    return augmentedOptionsSearchPrompt;
  }
  
  const definition = await loadDefinition('augmented-options-search') as LlmPromptDefinition;
  const promptString = buildPromptStringFromLlmDefinition(definition);
  
  console.log(`${logPrefix} Defining prompt. Model: ${definition.modelId}, Grounding: true`);

  const prompt = ai.definePrompt({
    name: 'augmentedOptionsSearchPrompt',
    input: { schema: AugmentedOptionsSearchInputSchema },
    model: definition.modelId || DEFAULT_ANALYSIS_MODEL_ID,
    prompt: promptString,
    config: {
      safetySettings: definition.safetySettings,
      thinkingConfig: { thinkingBudget: definition.thinkingBudget },
      tools: [{ googleSearch: {} }],
    },
  });

  augmentedOptionsSearchPrompt = prompt;
  return augmentedOptionsSearchPrompt;
}

export async function augmentedOptionsSearch(input: AugmentedOptionsSearchInput): Promise<AugmentedOptionsSearchOutput> {
  return augmentedOptionsSearchFlow(input);
}

const augmentedOptionsSearchFlow = ai.defineFlow(
  {
    name: 'augmentedOptionsSearchFlow',
    inputSchema: AugmentedOptionsSearchInputSchema,
    outputSchema: AugmentedOptionsSearchOutputSchema,
  },
  async (input) => {
    const logPrefix = `[AIFlow:augmentedOptionsSearchFlow:Ticker:${input.ticker}]`;
    console.log(`${logPrefix} Flow execution started.`);
    
    const prompt = await getAugmentedOptionsSearchPrompt();
    const result = await prompt(input);
    const rawTextResponse = result.text;
    
    if (!rawTextResponse) {
      throw new Error("Augmented options search returned no text response.");
    }
    
    const jsonString = extractJsonString(rawTextResponse);
    if (!jsonString) {
      throw new Error("Could not extract valid JSON from augmented options search AI response.");
    }

    const parsedData = JSON.parse(jsonString);
    return AugmentedOptionsSearchOutputSchema.parse(parsedData);
  }
);
