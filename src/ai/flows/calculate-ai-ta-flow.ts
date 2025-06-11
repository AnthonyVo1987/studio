
'use server';
/**
 * @fileOverview An AI agent that calculates classic technical analysis indicators.
 * This flow specifically calculates daily pivot points (PP, S1-S3, R1-R3)
 * based on the previous day's high, low, and close (HLC) prices.
 *
 * - calculateAiTaIndicators - A function that triggers the pivot point calculation flow.
 * - CalculateAiTaInput - The input type (from schemas).
 * - CalculateAiTaOutput - The return type (from schemas).
 */

import {ai} from '@/ai/genkit';
import {
  CalculateAiTaInputSchema,
  type CalculateAiTaInput,
  CalculateAiTaOutputSchema,
  type CalculateAiTaOutput,
} from '@/ai/schemas/ai-calculated-ta-schemas';
import { formatToTwoDecimals } from '@/lib/number-utils'; 

export async function calculateAiTaIndicators(
  input: CalculateAiTaInput
): Promise<CalculateAiTaOutput> {
  console.log('[AIFlow:calculateAiTaIndicators] Received input:', input);
  return calculateAiTaIndicatorsFlow(input);
}

const calculateAiTaIndicatorsFlow = ai.defineFlow(
  {
    name: 'calculateAiTaIndicatorsFlow',
    inputSchema: CalculateAiTaInputSchema,
    outputSchema: CalculateAiTaOutputSchema,
  },
  async (input: CalculateAiTaInput): Promise<CalculateAiTaOutput> => {
    console.log('[AIFlow:calculateAiTaIndicatorsFlow] Starting calculation with input:', input);
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
    console.log('[AIFlow:calculateAiTaIndicatorsFlow] Calculation complete. Output:', output);
    return output;
  }
);
