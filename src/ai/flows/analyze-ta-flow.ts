
'use server';
/**
 * @fileOverview An AI agent that analyzes classic technical analysis indicators.
 * This flow specifically calculates daily pivot points (PP, S1-S3, R1-R3)
 * based on the previous day's high, low, and close (HLC) prices.
 * The output is part of the "AI Analyzed Technical Analysis".
 * The definition of parameters and calculation logic is now loaded from a JSON file.
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
import { loadDefinition, type CalculationLogicDefinition, type CalculationStep } from '@/ai/definition-loader';

let taCalculationDefinition: CalculationLogicDefinition | null = null;

async function ensureTaCalculationDefinitionLoaded() {
  const logPrefix = '[AIFlow:ensureTaCalculationDefinitionLoaded]';
  if (!taCalculationDefinition) {
    console.log(`${logPrefix} Loading 'analyze-ta-indicators' definition for the first time.`);
    const genericDefinition = await loadDefinition('analyze-ta-indicators');
    if (genericDefinition.definitionType !== 'calculation-logic') {
      console.error(`${logPrefix} Loaded definition for 'analyze-ta-indicators' is not a calculation-logic type. Type: ${genericDefinition.definitionType}`);
      throw new Error("Loaded definition for 'analyze-ta-indicators' is not a calculation-logic type.");
    }
    taCalculationDefinition = genericDefinition;
    console.log(`${logPrefix} 'analyze-ta-indicators' definition loaded and validated. Logic name: ${taCalculationDefinition.logicName}`);
  }
}
ensureTaCalculationDefinitionLoaded();


export async function analyzeTaIndicators( 
  input: AnalyzeTaInput
): Promise<AnalyzeTaOutput> {
  console.log('[AIFlow:analyzeTaIndicators:Entry] Received input (keys):', Object.keys(input).join(', '));
  await ensureTaCalculationDefinitionLoaded(); // Ensure definition is available
  return analyzeTaIndicatorsFlow(input); 
}

// Helper function to evaluate a formula from the definition
function evaluateFormula(formula: string, context: Record<string, number>): number {
  const logPrefix = '[AIFlow:evaluateFormula]';
  // Sanitize variable names for eval (basic protection)
  const sanitizedFormula = formula.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
    if (context.hasOwnProperty(match)) {
      return `context['${match}']`;
    }
    console.warn(`${logPrefix} Variable '${match}' in formula '${formula}' not found in context. This may lead to errors.`);
    return 'undefined'; // Or throw an error
  });

  try {
    // IMPORTANT: Using eval is generally unsafe. This is a simplified example.
    // In a production system, a proper math expression parser/evaluator should be used.
    // For this controlled environment where formulas are from our JSON, it's a shortcut.
    // eslint-disable-next-line no-eval
    const result = eval(sanitizedFormula);
    if (typeof result !== 'number' || isNaN(result)) {
      console.error(`${logPrefix} Formula '${formula}' (sanitized: '${sanitizedFormula}') did not evaluate to a valid number. Result: ${result}`);
      throw new Error(`Formula evaluation failed for: ${formula}`);
    }
    return result;
  } catch (e: any) {
    console.error(`${logPrefix} Error evaluating formula '${formula}' (sanitized: '${sanitizedFormula}'). Error: ${e.message}`);
    throw new Error(`Error in formula evaluation: ${e.message}`);
  }
}

const analyzeTaIndicatorsFlow = ai.defineFlow( 
  {
    name: 'analyzeTaIndicatorsFlow', 
    inputSchema: AnalyzeTaInputSchema,
    outputSchema: AnalyzeTaOutputSchema,
  },
  async (input: AnalyzeTaInput): Promise<AnalyzeTaOutput> => {
    const logPrefix = '[AIFlow:analyzeTaIndicatorsFlow]';
    console.log(`${logPrefix} Starting calculation with input:`, JSON.stringify(input));

    if (!taCalculationDefinition) {
      console.error(`${logPrefix} TA Calculation Definition not loaded. Cannot proceed.`);
      throw new Error("TA Calculation Definition not loaded.");
    }
    console.log(`${logPrefix} Using calculation logic: ${taCalculationDefinition.logicName} - ${taCalculationDefinition.description}`);

    const calculationContext: Record<string, number> = {};

    // 1. Populate context with direct inputs
    if (taCalculationDefinition.inputs) {
      for (const defInput of taCalculationDefinition.inputs) {
        if (defInput.name in input) {
          // @ts-ignore TypeScript doesn't know defInput.name is a key of AnalyzeTaInput here
          calculationContext[defInput.name] = input[defInput.name];
        } else {
          console.error(`${logPrefix} Defined input '${defInput.name}' not found in flow input object.`);
          throw new Error(`Missing required input for calculation: ${defInput.name}`);
        }
      }
    }
    console.log(`${logPrefix} Initial calculation context from inputs:`, JSON.stringify(calculationContext));


    // 2. Perform calculations based on definition
    const calculatedValues: Record<string, number> = { ...calculationContext }; // Start with inputs
    for (const step of taCalculationDefinition.calculations) {
      if (step.sourceInput && calculatedValues[step.sourceInput] !== undefined) {
        calculatedValues[step.outputVar] = calculatedValues[step.sourceInput];
        console.log(`${logPrefix} Step '${step.outputVar}': Copied from sourceInput '${step.sourceInput}', Value: ${calculatedValues[step.outputVar]}`);
      } else if (step.formula) {
        calculatedValues[step.outputVar] = evaluateFormula(step.formula, calculatedValues);
        console.log(`${logPrefix} Step '${step.outputVar}': Calculated from formula '${step.formula}', Value: ${calculatedValues[step.outputVar]}`);
      } else {
         console.error(`${logPrefix} Calculation step '${step.outputVar}' has no sourceInput or formula.`);
         throw new Error(`Invalid calculation step definition for ${step.outputVar}`);
      }
    }
    console.log(`${logPrefix} All calculated values:`, JSON.stringify(calculatedValues));

    // 3. Construct output based on definition
    const output: Partial<AnalyzeTaOutput> = {};
    const parseAndFormat = (value: number) => parseFloat(formatToTwoDecimals(value, "0.00"));

    for (const defOutput of taCalculationDefinition.outputs) {
      if (calculatedValues[defOutput.sourceCalculation] !== undefined) {
        // @ts-ignore
        output[defOutput.name] = parseAndFormat(calculatedValues[defOutput.sourceCalculation]);
      } else {
        console.error(`${logPrefix} Output sourceCalculation '${defOutput.sourceCalculation}' for output field '${defOutput.name}' not found in calculated values.`);
        throw new Error(`Failed to find source for output field: ${defOutput.name}`);
      }
    }
    console.log(`${logPrefix} Calculation complete. Final output (keys): ${Object.keys(output).join(', ')}`);
    return output as AnalyzeTaOutput; // Cast as we've built it according to the schema
  }
);

