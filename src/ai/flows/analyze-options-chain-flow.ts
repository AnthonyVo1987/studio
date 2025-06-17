
      
'use server';
/**
 * @fileOverview An AI agent that analyzes options chain data to identify significant
 * features like Call/Put Walls by looking for high and/or clustered OI/Volume.
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
  prompt: `You are an expert options market analyst.
Your task is to identify significant Call and Put "Walls" from the provided options chain data for the stock: {{{ticker}}}.
The current underlying price is \${{{currentUnderlyingPrice}}} for context.
The options chain data is provided as a JSON string: {{{optionsChainJson}}}
This JSON string represents an 'OptionsChainData' object with a 'contracts' array. Each element in 'contracts' is an 'OptionsTableRow' having 'strike', 'call' (StreamlinedOptionContract), and 'put' (StreamlinedOptionContract) properties.

Focus on identifying strikes with **High and/or Clustered Concentrations of Open Interest (OI) and/or Volume**.
These concentrations represent potential support (for Puts) or resistance (for Calls).

Output Requirements:
- Select AT MOST 3 Call Walls and AT MOST 3 Put Walls. Order them by your perceived significance (e.g., highest OI/Volume first, or most impactful cluster).
- For each selected wall, populate the output JSON:
    - \`callWalls\`: Array of wall objects: \`{strike: number, openInterest: number, volume?: number, type: 'call'}\`. Include volume if it's a key factor for identification.
    - \`putWalls\`: Array of wall objects: \`{strike: number, openInterest: number, volume?: number, type: 'put'}\`. Include volume if it's a key factor for identification.
- If no significant walls are identified for a type, return an empty array for that type (e.g., \`callWalls: []\`).

Strictly adhere to the output schema.
If optionsChainJson is empty or clearly insufficient (e.g., very few contracts or all zero OI/volume), return empty walls.
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
        const {output} = await analyzeOptionsChainPrompt(input);

        if (!output || !Array.isArray(output.callWalls) || !Array.isArray(output.putWalls)) {
          console.error('[AIFlow:analyzeOptionsChainFlow] AI options analysis flow did not return a valid output structure for ticker:', input.ticker, 'Received output:', JSON.stringify(output).substring(0,500));
          return emptyOutput;
        }

        // Ensure it still conforms to max 3 even if AI provides more
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

    