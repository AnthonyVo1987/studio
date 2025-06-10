'use server';
/**
 * @fileOverview An AI agent that calculates technical analysis indicators for a given stock.
 *
 * - calculateAiTaIndicators - A function that calculates AI TA indicators.
 * - CalculateAiTaIndicatorsInput - The input type for the calculateAiTaIndicators function.
 * - CalculateAiTaIndicatorsOutput - The return type for the calculateAiTaIndicators function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateAiTaIndicatorsInputSchema = z.object({
  previousDayHigh: z.number().describe('The high price of the previous day.'),
  previousDayLow: z.number().describe('The low price of the previous day.'),
  previousDayClose: z.number().describe('The closing price of the previous day.'),
});

export type CalculateAiTaIndicatorsInput = z.infer<
  typeof CalculateAiTaIndicatorsInputSchema
>;

const CalculateAiTaIndicatorsOutputSchema = z.object({
  pivotPoint: z.number().describe('The pivot point.'),
  support1: z.number().describe('The first level of support.'),
  support2: z.number().describe('The second level of support.'),
  support3: z.number().describe('The third level of support.'),
  resistance1: z.number().describe('The first level of resistance.'),
  resistance2: z.number().describe('The second level of resistance.'),
  resistance3: z.number().describe('The third level of resistance.'),
});

export type CalculateAiTaIndicatorsOutput = z.infer<
  typeof CalculateAiTaIndicatorsOutputSchema
>;

export async function calculateAiTaIndicators(
  input: CalculateAiTaIndicatorsInput
): Promise<CalculateAiTaIndicatorsOutput> {
  return calculateAiTaIndicatorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateAiTaIndicatorsPrompt',
  input: {schema: CalculateAiTaIndicatorsInputSchema},
  output: {schema: CalculateAiTaIndicatorsOutputSchema},
  prompt: `You are an expert financial analyst.

  Calculate the classic pivot points, supports, and resistances based on the following data:

  Previous Day High: {{{previousDayHigh}}}
  Previous Day Low: {{{previousDayLow}}}
  Previous Day Close: {{{previousDayClose}}}

  Return the results in JSON format.
  `,
});

const calculateAiTaIndicatorsFlow = ai.defineFlow(
  {
    name: 'calculateAiTaIndicatorsFlow',
    inputSchema: CalculateAiTaIndicatorsInputSchema,
    outputSchema: CalculateAiTaIndicatorsOutputSchema,
  },
  async input => {
    const pivotPoint = (input.previousDayHigh + input.previousDayLow + input.previousDayClose) / 3;

    const support1 = 2 * pivotPoint - input.previousDayHigh;
    const support2 = pivotPoint - (input.previousDayHigh - input.previousDayLow);
    const support3 = input.previousDayLow - 2 * (input.previousDayHigh - pivotPoint);

    const resistance1 = 2 * pivotPoint - input.previousDayLow;
    const resistance2 = pivotPoint + (input.previousDayHigh - input.previousDayLow);
    const resistance3 = input.previousDayHigh + 2 * (pivotPoint - input.previousDayLow);

    return {
      pivotPoint: pivotPoint,
      support1: support1,
      support2: support2,
      support3: support3,
      resistance1: resistance1,
      resistance2: resistance2,
      resistance3: resistance3,
    };
  }
);
