
'use server';
/**
 * @fileOverview Utility for loading and parsing AI prompt and logic definitions from JSON files.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod'; // Using direct zod import for server-side utility

// --- LLM Prompt Definition Schemas ---
const LlmPromptPartSchema = z.object({
  text: z.string(),
});

const LlmChainOfThoughtStepSchema = z.object({
  role: z.string(),
  parts: z.array(LlmPromptPartSchema),
});

export const LlmPromptDefinitionSchema = z.object({
  definitionType: z.literal('llm-prompt'),
  promptName: z.string(),
  description: z.string(),
  modelId: z.string().optional(),
  safetySettings: z.array(z.object({
    category: z.string(),
    threshold: z.string(),
  })).optional(),
  chainOfThought: z.array(LlmChainOfThoughtStepSchema),
  outputSchemaHint: z.string().optional(),
});
export type LlmPromptDefinition = z.infer<typeof LlmPromptDefinitionSchema>;


// --- Calculation Logic Definition Schemas ---
const CalculationInputSchema = z.object({
  name: z.string(),
  type: z.string(), // e.g., "number"
  description: z.string(),
});

const CalculationStepSchema = z.object({
  outputVar: z.string().describe("The variable name to store the result of this calculation step."),
  sourceInput: z.string().optional().describe("If this step directly uses an input, specify the input name here."),
  formula: z.string().optional().describe("The formula string for this calculation. Uses outputVars from previous steps or sourceInputs. E.g., '(H + L + C) / 3'"),
  // Potentially add 'operation' for predefined ops like 'sum', 'average' etc.
});

const CalculationOutputSchema = z.object({
  name: z.string().describe("The final output field name for the flow's Zod schema."),
  sourceCalculation: z.string().describe("The outputVar from a calculation step that provides this output value."),
});

export const CalculationLogicDefinitionSchema = z.object({
  definitionType: z.literal('calculation-logic'),
  logicName: z.string(),
  description: z.string(),
  inputs: z.array(CalculationInputSchema).optional(),
  calculations: z.array(CalculationStepSchema),
  outputs: z.array(CalculationOutputSchema),
  outputSchemaHint: z.string().optional(),
});
export type CalculationLogicDefinition = z.infer<typeof CalculationLogicDefinitionSchema>;

// --- Union Schema ---
export const GenericDefinitionSchema = z.union([
  LlmPromptDefinitionSchema,
  CalculationLogicDefinitionSchema,
]);
export type GenericDefinition = z.infer<typeof GenericDefinitionSchema>;


/**
 * Loads a prompt or logic definition from a JSON file.
 * @param definitionName The name of the definition file (without .json extension).
 * @returns A promise that resolves to the parsed and validated definition.
 */
export async function loadDefinition(definitionName: string): Promise<GenericDefinition> {
  const logPrefix = `[DefinitionLoader:loadDefinition:${definitionName}]`;
  const filePath = path.join(process.cwd(), 'src', 'ai', 'definitions', `${definitionName}.json`);
  console.log(`${logPrefix} Attempting to load from: ${filePath}`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    const validationResult = GenericDefinitionSchema.safeParse(jsonData);
    if (!validationResult.success) {
      console.error(`${logPrefix} Zod validation failed for ${definitionName}.json:`, validationResult.error.errors);
      throw new Error(`Invalid definition structure in ${definitionName}.json: ${validationResult.error.message}`);
    }
    console.log(`${logPrefix} Successfully loaded and validated ${definitionName}.json. Type: ${validationResult.data.definitionType}`);
    return validationResult.data;
  } catch (error: any) {
    console.error(`${logPrefix} Error loading or parsing definition file ${definitionName}.json:`, error);
    throw new Error(`Failed to load AI definition '${definitionName}': ${error.message}`);
  }
}

/**
 * Builds a single prompt string from an LlmPromptDefinition.
 * @param definition The LlmPromptDefinition object.
 * @returns A single string concatenating all prompt parts.
 */
export function buildPromptStringFromLlmDefinition(definition: LlmPromptDefinition): string {
  let fullPrompt = "";
  for (const step of definition.chainOfThought) {
    for (const part of step.parts) {
      fullPrompt += part.text + "\\n"; // Add newline between parts/steps
    }
  }
  // console.log(`[DefinitionLoader:buildPromptString] Built prompt for ${definition.promptName}: ${fullPrompt.substring(0,100)}...`);
  return fullPrompt.trim();
}
