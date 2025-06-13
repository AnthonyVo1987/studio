
'use server';
/**
 * @fileOverview An AI agent that analyzes options chain data to identify significant
 * features like Call and Put Walls.
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
import type { OptionsChainData, OptionsTableRow } from '@/services/data-sources/types';

export async function analyzeOptionsChain(
  input: AiOptionsAnalysisInput
): Promise<AiOptionsAnalysisOutput> {
  console.log('[AIFlow:analyzeOptionsChain] Received input for ticker:', input.ticker);
  return analyzeOptionsChainFlow(input);
}

const analyzeOptionsChainPrompt = ai.definePrompt({
  name: 'analyzeOptionsChainPrompt',
  input: {schema: AiOptionsAnalysisInputSchema},
  output: {schema: AiOptionsAnalysisOutputSchema},
  model: DEFAULT_ANALYSIS_MODEL_ID,
  prompt: `You are an expert options market analyst. Your task is to identify significant Call and Put "Walls" from the provided options chain data for the stock: {{{ticker}}}.
The current underlying price is \${{{currentUnderlyingPrice}}}.

The options chain data is provided as a JSON string: {{{optionsChainJson}}}
This JSON string represents an 'OptionsChainData' object with a 'contracts' array. Each element in 'contracts' is an 'OptionsTableRow' having 'strike', 'call' (StreamlinedOptionContract), and 'put' (StreamlinedOptionContract) properties.
Focus on the 'open_interest' (OI) field within the 'call' and 'put' contract objects.

Wall Detection Algorithm:
A "Wall" is a strike level with unusually high Open Interest (OI) that might act as support or resistance.
1.  Parse the \`optionsChainJson\` to access the list of contracts. If parsing fails or data is insufficient (e.g., very few strikes or contracts), note this in \`analysisSummary\` and return empty arrays for walls.
2.  Separate Call OI and Put OI data per strike.
3.  For Calls:
    a.  Calculate the average OI across all strikes that have call contracts with OI > 0. If no calls have OI, this step is skipped for calls.
    b.  Iterate through each strike with a call contract. A call strike is a potential Call Wall if its OI meets BOTH conditions:
        i.  Call OI at this strike ≥ 1.5 × average Call OI (if average OI is calculable and > 0).
        ii. Call OI at this strike ≥ 2 × OI of the immediately preceding call strike (if one exists and has OI > 0) AND Call OI at this strike ≥ 2 × OI of the immediately succeeding call strike (if one exists and has OI > 0).
            - If only one adjacent strike exists (e.g., at the edge of the chain), only that side's 2x condition needs to be met.
            - If a strike has no valid adjacent strikes with OI for comparison, this sub-condition might be relaxed or weighted less, but the 1.5x average OI condition remains crucial.
4.  For Puts:
    a.  Calculate the average OI across all strikes that have put contracts with OI > 0. If no puts have OI, this step is skipped for puts.
    b.  Iterate through each strike with a put contract. A put strike is a potential Put Wall if its OI meets BOTH conditions:
        i.  Put OI at this strike ≥ 1.5 × average Put OI (if average OI is calculable and > 0).
        ii. Put OI at this strike ≥ 2 × OI of the immediately preceding put strike (if one exists and has OI > 0) AND Put OI at this strike ≥ 2 × OI of the immediately succeeding put strike (if one exists and has OI > 0). (Apply same edge case logic as for calls).
5.  Output Requirements:
    a.  Identify AT LEAST 1 Call Wall and AT LEAST 1 Put Wall if the data supports it according to the criteria.
    b.  If multiple strikes qualify as walls for calls or puts, select UP TO 3 of the most significant ones for each type (typically those with the highest OI that meet the criteria).
    c.  Populate the \`callWalls\` and \`putWalls\` arrays in the output. Each element should include \`strike\`, \`openInterest\`, and \`type\`.
    d.  If, after applying the criteria, you cannot identify at least one call wall or at least one put wall (e.g., due to low overall OI, flat OI distribution, or insufficient data), clearly state this in the \`analysisSummary\` field. For instance: "No significant call walls identified meeting the criteria. Put OI is generally low." or "Insufficient options data to reliably identify walls." In such cases, the respective wall arrays can be empty. The primary goal is robust identification; do not force walls if criteria are not met.

Example of a small part of optionsChainJson.contracts array element:
\`{ "strike": 150, "call": { "open_interest": 1200, ... }, "put": { "open_interest": 800, ... } }\`

Strictly adhere to the output schema. Provide the \`callWalls\` and \`putWalls\` arrays. Ensure openInterest values are numbers.
If you encounter issues parsing or the data is clearly insufficient (e.g., less than 5 strikes with OI for both calls and puts), note this in analysisSummary.
Focus only on identifying walls. Do not include analysis of OI clusters in this output.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
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
    // Basic validation of optionsChainJson before sending to LLM
    try {
      const optionsData = JSON.parse(input.optionsChainJson) as OptionsChainData;
      if (!optionsData.contracts || optionsData.contracts.length < 5) { // Arbitrary small number for "insufficient"
        console.warn('[AIFlow:analyzeOptionsChainFlow] Options chain data seems insufficient. Contracts length:', optionsData.contracts?.length);
        return {
          callWalls: [],
          putWalls: [],
          analysisSummary: 'Warning: Options chain data appears insufficient (e.g., too few contracts/strikes) for reliable wall detection by AI. Proceeding with analysis, but results may be limited.'
        };
      }
    } catch (e) {
      console.error('[AIFlow:analyzeOptionsChainFlow] Failed to parse optionsChainJson in pre-check:', e);
      return {
        callWalls: [],
        putWalls: [],
        analysisSummary: 'Error: Failed to parse input optionsChainJson. Cannot perform AI options analysis.'
      };
    }

    const {output} = await analyzeOptionsChainPrompt(input);
    if (!output) {
      console.error('[AIFlow:analyzeOptionsChainFlow] AI options analysis flow did not return an output.');
      return {
        callWalls: [],
        putWalls: [],
        analysisSummary: 'AI analysis flow did not return an output. Please check Genkit logs.'
      };
    }
    // Ensure min 0 / max 3 constraint even if LLM doesn't perfectly adhere
    output.callWalls = output.callWalls.slice(0, 3);
    output.putWalls = output.putWalls.slice(0, 3);
    
    console.log('[AIFlow:analyzeOptionsChainFlow] Analysis complete. Call Walls:', output.callWalls.length, 'Put Walls:', output.putWalls.length);
    return output;
  }
);
