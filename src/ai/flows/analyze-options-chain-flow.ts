
'use server';
/**
 * @fileOverview An AI agent that analyzes options chain data to identify significant
 * features like Call/Put Walls using an adaptive, chain-of-thought methodology.
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

export async function analyzeOptionsChain(
  input: AiOptionsAnalysisInput
): Promise<AiOptionsAnalysisOutput> {
  console.log('[AIFlow:analyzeOptionsChain] Received input for ticker:', input.ticker, 'Input keys:', Object.keys(input).join(', '));
  return analyzeOptionsChainFlow(input);
}

const analyzeOptionsChainPrompt = ai.definePrompt({
  name: 'analyzeOptionsChainPrompt',
  input: {schema: AiOptionsAnalysisInputSchema},
  output: {schema: AiOptionsAnalysisOutputSchema},
  model: DEFAULT_ANALYSIS_MODEL_ID,
  prompt: `You are an expert options market analyst. Your task is to identify significant Call and Put "Walls" from the provided options chain data for the stock: {{{ticker}}} using an adaptive, chain-of-thought process.
The current underlying price is \${{{currentUnderlyingPrice}}}. This price is for context.
The options chain data is provided as a JSON string: {{{optionsChainJson}}}
This JSON string represents an 'OptionsChainData' object with a 'contracts' array. Each element in 'contracts' is an 'OptionsTableRow' having 'strike', 'call' (StreamlinedOptionContract), and 'put' (StreamlinedOptionContract) properties. Focus on 'open_interest' (OI) and 'volume'.

Follow these steps:

1.  **Parse Options Chain:** Conceptually parse the options chain data. Separate call and put contracts for each strike.

2.  **Calculate Overall OI Statistics:**
    *   Calculate the average Open Interest (avg_OI_total) across ALL strikes for both calls and puts combined.
    *   Calculate the maximum Open Interest (max_OI_total) across ALL strikes for both calls and puts combined.

3.  **Classify Liquidity Tier:**
    *   Based on avg_OI_total:
        *   If avg_OI_total < 1000: Liquidity Tier = "Low"
        *   If 1000 <= avg_OI_total <= 4000: Liquidity Tier = "Medium"
        *   If avg_OI_total > 4000: Liquidity Tier = "High"
        *   If data is clearly insufficient (e.g., less than 5 strikes with meaningful OI, or avg_OI_total is very low like < 100), classify as "NotApplicable".

4.  **Per-Side OI Normalization (Calls and Puts separately):**
    *   For Calls: Compute mean_OI_calls and std_dev_OI_calls. For each call strike, calculate Z_OI_call = (OI_call - mean_OI_calls) / std_dev_OI_calls. If std_dev_OI_calls is 0, Z_OI_call is 0.
    *   For Puts: Compute mean_OI_puts and std_dev_OI_puts. For each put strike, calculate Z_OI_put = (OI_put - mean_OI_puts) / std_dev_OI_puts. If std_dev_OI_puts is 0, Z_OI_put is 0.

5.  **Local Spike Detection (Calls and Puts separately):**
    *   For each call strike: Compute local_avg_OI_call using a ±2 strike window (i.e., average OI of 5 strikes centered on the current strike, or fewer if at edges). Calculate local_ratio_call = OI_call / local_avg_OI_call. If local_avg_OI_call is 0, local_ratio_call is OI_call.
    *   For each put strike: Compute local_avg_OI_put using a ±2 strike window. Calculate local_ratio_put = OI_put / local_avg_OI_put. If local_avg_OI_put is 0, local_ratio_put is OI_put.

6.  **Tier-Based Threshold Filter (Calls and Puts separately):**
    *   Apply these thresholds to flag potential walls. A strike is a wall if ALL three conditions for its tier are met:
        *   **Low Liquidity Tier:** Min OI ≥ 500, Min Z_OI ≥ 1.5, Min local_ratio ≥ 2.5
        *   **Medium Liquidity Tier:** Min OI ≥ 2000, Min Z_OI ≥ 2.0, Min local_ratio ≥ 3.0
        *   **High Liquidity Tier:** Min OI ≥ 5000, Min Z_OI ≥ 2.5, Min local_ratio ≥ 3.5
        *   If Liquidity Tier is "NotApplicable", do not flag any walls.

7.  **Volume Confirmation (Optional):**
    *   If 'volume' data is available and greater than 0 for a flagged strike, consider this as strengthening the wall signal (but not a strict requirement for flagging).

8.  **Output Formatting:**
    *   Select AT MOST 3 Call Walls and AT MOST 3 Put Walls from the flagged strikes. Order them by significance (e.g., highest calculated wall_score).
    *   For each selected wall, calculate wall_score = (Z_OI + local_ratio) / 2. Round wall_score to one decimal place.
    *   Populate the output JSON:
        *   \`callWalls\`: Array of wall objects (strike, openInterest, type: 'call', wallScore).
        *   \`putWalls\`: Array of wall objects (strike, openInterest, type: 'put', wallScore).
        *   \`liquidityTier\`: The determined liquidity tier ("Low", "Medium", "High", or "NotApplicable").
        *   \`analysisMethodology\`: "Adaptive wall detection using OI normalization, local spike analysis, and tier-based thresholds."
    *   If no walls are identified for a type, return an empty array for that type.

Strictly adhere to the output schema. Ensure all numerical calculations are performed carefully.
If optionsChainJson is empty or clearly insufficient (e.g., very few contracts or all zero OI), return empty walls and tier "NotApplicable".
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
});

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
      liquidityTier: 'NotApplicable',
      analysisMethodology: 'Initial check: Input data insufficient or unparsable.',
    };

    let parsedOptionsData: OptionsChainData | null = null;
    try {
      parsedOptionsData = JSON.parse(input.optionsChainJson) as OptionsChainData;
      if (!parsedOptionsData.contracts || parsedOptionsData.contracts.length < 3) {
        console.warn('[AIFlow:analyzeOptionsChainFlow] Pre-check: Options chain data seems insufficient (less than 3 contracts). Returning empty walls.', 'Contracts length:', parsedOptionsData.contracts?.length);
        return emptyOutput;
      }
      // Further check if all OI is zero
      const totalOI = parsedOptionsData.contracts.reduce((sum, contract) => {
        return sum + (contract.call?.open_interest || 0) + (contract.put?.open_interest || 0);
      }, 0);
      if (totalOI === 0 && parsedOptionsData.contracts.length > 0) {
         console.warn('[AIFlow:analyzeOptionsChainFlow] Pre-check: All open interest is zero. Returning empty walls.');
         return { ...emptyOutput, analysisMethodology: 'Initial check: All open interest is zero.'};
      }

    } catch (e) {
      console.error('[AIFlow:analyzeOptionsChainFlow] Pre-check: Failed to parse optionsChainJson or basic validation failed:', e);
      return emptyOutput;
    }

    console.log('[AIFlow:analyzeOptionsChainFlow] Executing prompt for ticker:', input.ticker);
    try {
        const {output} = await analyzeOptionsChainPrompt(input);

        if (!output || !Array.isArray(output.callWalls) || !Array.isArray(output.putWalls) || !output.liquidityTier || !output.analysisMethodology) {
          console.error('[AIFlow:analyzeOptionsChainFlow] AI options analysis flow did not return a valid output structure for ticker:', input.ticker, 'Received output:', JSON.stringify(output).substring(0,500));
          return {
            callWalls: (output?.callWalls || []).slice(0,3), // defensive slicing
            putWalls: (output?.putWalls || []).slice(0,3),
            liquidityTier: output?.liquidityTier || 'NotApplicable',
            analysisMethodology: output?.analysisMethodology || 'Error: AI output structure malformed.',
          };
        }

        const finalOutput: AiOptionsAnalysisOutput = {
            callWalls: (output.callWalls || []).slice(0, 3),
            putWalls: (output.putWalls || []).slice(0, 3),
            liquidityTier: output.liquidityTier,
            analysisMethodology: output.analysisMethodology,
        };

        console.log('[AIFlow:analyzeOptionsChainFlow] Analysis complete for ticker:', input.ticker, 'Call Walls:', finalOutput.callWalls.length, 'Put Walls:', finalOutput.putWalls.length, 'Tier:', finalOutput.liquidityTier);
        return finalOutput;

    } catch (promptError: any) {
        console.error('[AIFlow:analyzeOptionsChainFlow] CRITICAL ERROR during analyzeOptionsChainPrompt execution for ticker:', input.ticker, 'Error name:', promptError?.name, 'Error message:', promptError?.message, 'Error stack (first 500):', promptError?.stack?.substring(0,500), 'Full error object:', JSON.stringify(promptError).substring(0,500));
        return {
          callWalls: [],
          putWalls: [],
          liquidityTier: 'NotApplicable',
          analysisMethodology: `Error during AI prompt execution: ${promptError?.message || 'Unknown prompt error'}.`,
        };
    }
  }
);
