
'use server';
/**
 * @fileOverview An AI agent that analyzes classic technical analysis indicators.
 * This flow specifically calculates daily pivot points (PP, S1-S3, R1-R3)
 * based on the previous day's high, low, and close (HLC) prices.
 * The output is part of the "AI Analyzed Technical Analysis".
 * The definition of parameters is now loaded from a JSON file for consistency,
 * though the calculation remains direct.
 *
 * - analyzeTaIndicators - A function that triggers the pivot point calculation flow.
 * - AnalyzeTaInput - The input type (from schemas).
 * - AnalyzeTaOutput - The return type (from schemas).
 */

import {ai} from '@/ai/genkit';
import {
  AnalyzeTaInputSchema,
  type AnalyzeTaInput,
  AnalyzeTaOutputSchema,
  type AnalyzeTaOutput,
} from '@/ai/schemas/ai-analyzed-ta-schemas'; 
import { formatToTwoDecimals } from '@/lib/number-utils'; 
import { loadPromptDefinition, type PromptDefinition } from '@/ai/prompt-loader';

// Load the definition for documentation and future potential use, not for LLM prompting in this version.
let analyzeTaPromptDefinition: PromptDefinition | null = null;

async function ensureTaPromptDefinitionLoaded() {
  if (!analyzeTaPromptDefinition) {
    try {
      analyzeTaPromptDefinition = await loadPromptDefinition('analyze-ta-prompt');
      console.log('[AIFlow:analyzeTaIndicators] analyze-ta-prompt.json loaded successfully for reference.');
    } catch (error) {
      console.error('[AIFlow:analyzeTaIndicators] Failed to load analyze-ta-prompt.json. Flow will proceed with hardcoded logic if possible, but this indicates a configuration issue.', error);
      // Depending on how critical the JSON is, you might throw or allow fallback.
      // For now, as it's mostly for future-proofing, we'll log and continue.
    }
  }
}
// Ensure it's loaded when the module is initialized
ensureTaPromptDefinitionLoaded();


export async function analyzeTaIndicators( 
  input: AnalyzeTaInput
): Promise<AnalyzeTaOutput> {
  console.log('[AIFlow:analyzeTaIndicators] Received input (keys):', Object.keys(input).join(', '));
  // Ensure definition is available if needed, though not directly used for LLM call here.
  // await ensureTaPromptDefinitionLoaded(); 
  // No need to await again here as it's loaded at module init, but good for visibility if it were lazy-loaded per call.
  return analyzeTaIndicatorsFlow(input); 
}

const analyzeTaIndicatorsFlow = ai.defineFlow( 
  {
    name: 'analyzeTaIndicatorsFlow', 
    inputSchema: AnalyzeTaInputSchema,
    outputSchema: AnalyzeTaOutputSchema,
    // No LLM prompt is defined here as it's a direct calculation.
    // The JSON definition is for structure and future extensibility.
  },
  async (input: AnalyzeTaInput): Promise<AnalyzeTaOutput> => {
    console.log('[AIFlow:analyzeTaIndicatorsFlow] Starting calculation with input:', input);
    const H = input.previousDayHigh;
    const L = input.previousDayLow;
    const C = input.previousDayClose;

    const PP = (H + L + C) / 3;
    const S1 = (2 * PP) - H;
    const R1 = (2 * PP) - L;
    const S2 = PP - (H - L);
    const R2 = PP + (H - L);
    const S3 = L - 2 * (H - PP);
    const R3 = H + 2 * (PP - L);

    const parseAndFormat = (value: number) => parseFloat(formatToTwoDecimals(value, "0.00"));

    const output = {
      pivotPoint: parseAndFormat(PP),
      support1: parseAndFormat(S1),
      support2: parseAndFormat(S2),
      support3: parseAndFormat(S3),
      resistance1: parseAndFormat(R1),
      resistance2: parseAndFormat(R2),
      resistance3: parseAndFormat(R3),
    };
    console.log('[AIFlow:analyzeTaIndicatorsFlow] Calculation complete. Output (keys):', Object.keys(output).join(', '));
    return output;
  }
);
