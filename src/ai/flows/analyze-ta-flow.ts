
'use server';
/**
 * @fileOverview An AI agent that analyzes classic technical analysis indicators.
 * This flow specifically calculates daily pivot points (PP, S1-S3, R1-R3)
 * based on the previous day's high, low, and close (HLC) prices.
 * The output is part of the "AI Analyzed Technical Analysis".
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

export async function analyzeTaIndicators(
  input: AnalyzeTaInput
): Promise<AnalyzeTaOutput> {
  console.log('[AIFlow:analyzeTaIndicators] Received input:', input);
  return analyzeTaIndicatorsFlow(input);
}

const analyzeTaIndicatorsFlow = ai.defineFlow(
  {
    name: 'analyzeTaIndicatorsFlow',
    inputSchema: AnalyzeTaInputSchema,
    outputSchema: AnalyzeTaOutputSchema,
  },
  async (input: AnalyzeTaInput): Promise<AnalyzeTaOutput> => {
    console.log('[AIFlow:analyzeTaIndicatorsFlow] Starting analysis with input:', input);
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
    console.log('[AIFlow:analyzeTaIndicatorsFlow] Analysis complete. Output:', output);
    return output;
  }
);
