
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
The current underlying price is \${{{currentUnderlyingPrice}}}. This price is provided for context (e.g., to understand the general price level and relation of strikes to it).

The options chain data is provided as a JSON string: {{{optionsChainJson}}}
This JSON string represents an 'OptionsChainData' object with a 'contracts' array. Each element in 'contracts' is an 'OptionsTableRow' having 'strike', 'call' (StreamlinedOptionContract), and 'put' (StreamlinedOptionContract) properties.
Focus on the 'open_interest' (OI) field within the 'call' and 'put' contract objects.

Wall Detection Guidance:
- A "Wall" is a strike price with exceptionally high Open Interest (OI) relative to its neighboring strikes or the general OI levels in the chain for that option type (call or put).
- These levels often act as psychological or actual support/resistance.
- Your primary task is to identify strikes where the OI stands out significantly.
- Consider both the absolute OI value and its magnitude compared to surrounding strikes.
- If the data is sparse or OI is generally low across the board, it's acceptable to find no significant walls.

Output Requirements:
-   **Walls:** Identify the MOST significant Call Walls and Put Walls if data supports. Select AT MOST 3 Call Walls and AT MOST 3 Put Walls (ordered by significance, e.g., highest OI first). Populate \`callWalls\` and \`putWalls\` arrays. Each element: \`{strike: number, openInterest: number, type: 'call'|'put'}\`.
-   If no significant wall is identified for a type, return an empty array for that type.

Strictly adhere to the output schema (callWalls and putWalls, each an array with AT MOST 3 elements). Ensure numerical values. Do not force walls if criteria are not met.
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
      if (!parsedOptionsData.contracts || parsedOptionsData.contracts.length < 3) { 
        console.warn('[AIFlow:analyzeOptionsChainFlow] Options chain data seems insufficient (less than 3 contracts). Returning empty walls. Contracts length:', parsedOptionsData.contracts?.length);
        return { callWalls: [], putWalls: [] };
      }
    } catch (e) {
      console.error('[AIFlow:analyzeOptionsChainFlow] Failed to parse optionsChainJson in pre-check:', e);
      return { callWalls: [], putWalls: [] }; 
    }

    console.log('[AIFlow:analyzeOptionsChainFlow] Executing prompt for ticker:', input.ticker);
    try {
        const {output} = await analyzeOptionsChainPrompt(input);

        if (!output || !Array.isArray(output.callWalls) || !Array.isArray(output.putWalls)) { 
          console.error('[AIFlow:analyzeOptionsChainFlow] AI options analysis flow did not return a valid output structure for ticker:', input.ticker, 'Received output:', output);
          return { callWalls: [], putWalls: [] }; 
        }
        
        const finalOutput: AiOptionsAnalysisOutput = {
            callWalls: (output.callWalls || []).slice(0, 3),
            putWalls: (output.putWalls || []).slice(0, 3),
        };
        
        console.log('[AIFlow:analyzeOptionsChainFlow] Analysis complete for ticker:', input.ticker, 'Call Walls:', finalOutput.callWalls.length, 'Put Walls:', finalOutput.putWalls.length);
        return finalOutput;

    } catch (promptError: any) {
        console.error('[AIFlow:analyzeOptionsChainFlow] CRITICAL ERROR during analyzeOptionsChainPrompt execution for ticker:', input.ticker, 'Error name:', promptError?.name, 'Error message:', promptError?.message, 'Error stack:', promptError?.stack, 'Full error object:', promptError);
        return { callWalls: [], putWalls: [] };
    }
  }
);

