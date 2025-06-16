
'use server';
/**
 * @fileOverview An AI agent that analyzes options chain data to identify significant
 * features like Call/Put Walls.
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
  prompt: `You are an expert options market analyst. Your task is to identify the MOST significant Call and Put "Walls" from the provided options chain data for the stock: {{{ticker}}}.
The current underlying price is \${{{currentUnderlyingPrice}}}. This price is provided for context (e.g., to understand the general price level and relation of strikes to it), your primary analysis should focus on Open Interest (OI).

The options chain data is provided as a JSON string: {{{optionsChainJson}}}
This JSON string represents an 'OptionsChainData' object with a 'contracts' array. Each element in 'contracts' is an 'OptionsTableRow' having 'strike', 'call' (StreamlinedOptionContract), and 'put' (StreamlinedOptionContract) properties.
Focus on the 'open_interest' (OI) field within the 'call' and 'put' contract objects.

Definitions:
-   **Wall:** A single strike level with unusually high OI that might act as support or resistance.

Analysis Steps:
1.  Parse the \`optionsChainJson\` to access the list of contracts. If parsing fails or data is insufficient (e.g., very few strikes or contracts), return empty arrays for walls.
2.  Separate Call OI and Put OI data per strike. Calculate the average OI for all calls with OI > 0 and for all puts with OI > 0 separately. If no calls/puts have OI, skip average calculation for that type.

Wall Detection Algorithm:
A strike is a potential Wall if its OI meets BOTH conditions:
    a.  OI at this strike ≥ 1.5 × average OI for its type (if average OI is calculable and > 0).
    b.  OI at this strike ≥ 2 × OI of the immediately preceding strike of the same type (if one exists and has OI > 0) AND OI at this strike ≥ 2 × OI of the immediately succeeding strike of the same type (if one exists and has OI > 0).
        - If only one adjacent strike exists (e.g., at the edge of the chain), only that side's 2x condition needs to be met.
        - If a strike has no valid adjacent strikes with OI for comparison, this sub-condition might be relaxed if the 1.5x average OI condition is strongly met.

Output Requirements:
-   **Walls:** Identify the MOST significant Call Walls and Put Walls if data supports. Select AT MOST 3 Call Walls and AT MOST 3 Put Walls (ordered by significance, e.g., highest OI meeting criteria). Populate \`callWalls\` and \`putWalls\` arrays. Each element: \`{strike: number, openInterest: number, type: 'call'|'put'}\`.
-   If no significant wall is identified for a type, return an empty array for that type.

Strictly adhere to the output schema (only callWalls and putWalls, each an array with AT MOST 3 elements). Ensure numerical values. Do not force walls if criteria are not met.
If you encounter issues parsing or the data is clearly insufficient (e.g., less than 5 strikes with OI for both calls and puts), return empty arrays.
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
    let parsedOptionsData: OptionsChainData | null = null;
    try {
      parsedOptionsData = JSON.parse(input.optionsChainJson) as OptionsChainData;
      console.log('[AIFlow:analyzeOptionsChainFlow] Parsed options chain JSON. Contracts count:', parsedOptionsData.contracts?.length);
      if (!parsedOptionsData.contracts || parsedOptionsData.contracts.length < 3) { // Pre-check for clearly insufficient data
        console.warn('[AIFlow:analyzeOptionsChainFlow] Options chain data seems insufficient (less than 3 contracts). Returning empty walls. Contracts length:', parsedOptionsData.contracts?.length);
        return { callWalls: [], putWalls: [] };
      }
    } catch (e) {
      console.error('[AIFlow:analyzeOptionsChainFlow] Failed to parse optionsChainJson in pre-check:', e);
      return { callWalls: [], putWalls: [] }; // Return valid empty structure on parse failure
    }

    console.log('[AIFlow:analyzeOptionsChainFlow] Executing prompt for ticker:', input.ticker);
    const {output} = await analyzeOptionsChainPrompt(input);

    if (!output || !output.callWalls || !output.putWalls) { 
      console.error('[AIFlow:analyzeOptionsChainFlow] AI options analysis flow did not return a valid output for ticker:', input.ticker, 'Received output:', output);
      return { callWalls: [], putWalls: [] }; // Return valid empty structure on AI error
    }
    
    // Output directly conforms to schema (max 3 walls), no further slicing needed here.
    // The display component will handle rendering up to 3.
    const finalOutput: AiOptionsAnalysisOutput = {
        callWalls: (output.callWalls || []).slice(0, 3), // Ensure it respects max 3 even if AI gives more.
        putWalls: (output.putWalls || []).slice(0, 3),   // Ensure it respects max 3.
    };
    
    console.log('[AIFlow:analyzeOptionsChainFlow] Analysis complete for ticker:', input.ticker, 'Call Walls:', finalOutput.callWalls.length, 'Put Walls:', finalOutput.putWalls.length);
    return finalOutput;
  }
);


    
