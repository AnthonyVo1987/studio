
'use server';
/**
 * @fileOverview An AI agent that takes a raw JSON string from a web search
 * and formats it into a user-friendly, readable markdown string for the chat UI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  FormatWebSearchResultsInputSchema,
  type FormatWebSearchResultsInput,
  FormatWebSearchResultsOutputSchema,
  type FormatWebSearchResultsOutput,
} from '@/ai/schemas/format-web-search-schemas';
import { DEFAULT_ANALYSIS_MODEL_ID } from '@/ai/models';
import { loadDefinition, buildPromptStringFromLlmDefinition, type LlmPromptDefinition } from '@/ai/definition-loader';
import { extractJsonString } from '@/lib/string-utils';

const promptCache: Record<string, any> = {};

async function getFormattingPrompt(searchType: 'TA' | 'Options') {
  const definitionName = searchType === 'TA' ? 'format-ta-search-results' : 'format-options-search-results';
  const logPrefix = `[AIFlow:getFormattingPrompt:${definitionName}]`;

  if (promptCache[definitionName]) {
    console.log(`${logPrefix} Returning cached prompt object.`);
    return promptCache[definitionName];
  }

  const genericDefinition = await loadDefinition(definitionName);
  if (genericDefinition.definitionType !== 'llm-prompt') {
    throw new Error(`Loaded definition for '${definitionName}' is not an LLM prompt type.`);
  }

  const promptDefinition = genericDefinition as LlmPromptDefinition;
  const promptString = buildPromptStringFromLlmDefinition(promptDefinition);

  const prompt = ai.definePrompt({
    name: promptDefinition.promptName,
    input: { schema: z.object({ rawJsonString: z.string() }) },
    output: { schema: FormatWebSearchResultsOutputSchema },
    model: promptDefinition.modelId || DEFAULT_ANALYSIS_MODEL_ID,
    prompt: promptString,
    config: {
      safetySettings: promptDefinition.safetySettings,
      thinkingConfig: { thinkingBudget: promptDefinition.thinkingBudget },
    },
  });

  promptCache[definitionName] = prompt;
  console.log(`${logPrefix} Prompt object defined and cached.`);
  return prompt;
}

export async function formatWebSearchResults(input: FormatWebSearchResultsInput): Promise<FormatWebSearchResultsOutput> {
  const logPrefix = `[AIFlow:formatWebSearchResults:Type:${input.searchType}]`;
  console.log(`${logPrefix} Received request.`);
  try {
    return await formatWebSearchResultsFlow(input);
  } catch (error) {
    console.error(`${logPrefix} Error in formatWebSearchResults:`, error);
    throw error;
  }
}

const formatWebSearchResultsFlow = ai.defineFlow(
  {
    name: 'formatWebSearchResultsFlow',
    inputSchema: FormatWebSearchResultsInputSchema,
    outputSchema: FormatWebSearchResultsOutputSchema,
  },
  async (input: FormatWebSearchResultsInput): Promise<FormatWebSearchResultsOutput> => {
    const logPrefix = `[AIFlow:formatWebSearchResultsFlow:Type:${input.searchType}]`;
    
    // Clean the input JSON string first to handle potential markdown fences or duplicate content
    const cleanedJsonString = extractJsonString(input.rawJsonString);
    if (!cleanedJsonString) {
      console.error(`${logPrefix} Could not extract a valid JSON string from the raw input. Returning error response.`);
      return { formattedResponse: "**Error:** Could not parse the web search data. The data received was malformed." };
    }

    console.log(`${logPrefix} Executing formatting prompt. Cleaned JSON length: ${cleanedJsonString.length}`);
    const promptToUse = await getFormattingPrompt(input.searchType);
    const result = await promptToUse({ rawJsonString: cleanedJsonString });

    const output = result.output;
    if (!output || !output.formattedResponse) {
      throw new Error('AI formatting flow failed to return a valid formatted response.');
    }

    console.log(`${logPrefix} Flow successfully formatted response. Length: ${output.formattedResponse.length}`);
    return output;
  }
);
