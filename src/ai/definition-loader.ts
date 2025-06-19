
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
  thinkingBudget: z.number().optional().describe("Sets a budget for thinking tokens. -1 for dynamic allocation, 0 to disable, >0 for specific limit."),
  chainOfThought: z.array(LlmChainOfThoughtStepSchema).optional(), // Made optional
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
  console.log(`${logPrefix} Initiating load for definition: ${definitionName}`);
  const filePath = path.join(process.cwd(), 'src', 'ai', 'definitions', `${definitionName}.json`);
  console.log(`${logPrefix} Attempting to load from file path: ${filePath}`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    const validationResult = GenericDefinitionSchema.safeParse(jsonData);
    if (!validationResult.success) {
      console.error(`${logPrefix} Zod validation FAILED for ${definitionName}.json. Errors:`, JSON.stringify(validationResult.error.errors, null, 2));
      throw new Error(`Invalid definition structure in ${definitionName}.json: ${validationResult.error.message}`);
    }
    console.log(`${logPrefix} Successfully loaded and validated ${definitionName}.json. Type: ${validationResult.data.definitionType}`);
    return validationResult.data;
  } catch (error: any) {
    console.error(`${logPrefix} CRITICAL ERROR loading or parsing definition file ${definitionName}.json. Error: ${error.message}, Stack: ${error.stack}`);
    throw new Error(`Failed to load AI definition '${definitionName}': ${error.message}`);
  }
}

/**
 * Builds a single prompt string from an LlmPromptDefinition.
 * @param definition The LlmPromptDefinition object.
 * @returns A single string concatenating all prompt parts.
 */
export function buildPromptStringFromLlmDefinition(definition: LlmPromptDefinition): string {
  const logPrefix = `[DefinitionLoader:buildPromptStringFromLlmDefinition:${definition.promptName}]`;
  console.log(`${logPrefix} Building prompt string.`);
  let fullPrompt = "";
  if (definition.chainOfThought && Array.isArray(definition.chainOfThought)) {
    for (const step of definition.chainOfThought) {
      if (step.parts && Array.isArray(step.parts)) {
        for (const part of step.parts) {
          fullPrompt += part.text + "\\n"; 
        }
      }
    }
  } else {
    console.warn(`${logPrefix} Definition has no 'chainOfThought' or it's not an array. Prompt string will be empty.`);
  }
  console.log(`${logPrefix} Built prompt string (first 100 chars): ${fullPrompt.substring(0,100)}...`);
  return fullPrompt.trim();
}

// --- Schema for example-chat-prompts.json (Loaded by client component) ---
export const ExampleChatPromptSchema = z.object({
  title: z.string().describe("The display title for the example prompt button in the UI."),
  promptTemplate: z.string().describe("The Handlebars template string for the example prompt. {{{TICKER}}} will be replaced."),
});
export type ExampleChatPrompt = z.infer<typeof ExampleChatPromptSchema>;

export const ExampleChatPromptsFileSchema = z.array(ExampleChatPromptSchema);
export type ExampleChatPromptsFile = z.infer<typeof ExampleChatPromptsFileSchema>;

/**
 * Loads example chat prompts from the JSON file.
 * This is typically used by client-side components.
 * @returns {Promise<ExampleChatPromptsFile>}
 * @throws {Error} If the file cannot be read or the content is invalid.
 */
export async function loadExampleChatPrompts(): Promise<ExampleChatPromptsFile> {
  const logPrefix = '[DefinitionLoader:loadExampleChatPrompts]';
  console.log(`${logPrefix} Loading example-chat-prompts.json`);
  const filePath = path.join(process.cwd(), 'src', 'ai', 'definitions', 'example-chat-prompts.json');
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    const validationResult = ExampleChatPromptsFileSchema.safeParse(jsonData);
     if (!validationResult.success) {
      console.error(`${logPrefix} Zod validation FAILED for example-chat-prompts.json:`, JSON.stringify(validationResult.error.issues, null, 2));
      throw new Error("Invalid example chat prompts structure.");
    }
    console.log(`${logPrefix} Successfully loaded and validated example-chat-prompts.json. Count: ${validationResult.data.length}`);
    return validationResult.data;
  } catch (error: any) {
    console.error(`${logPrefix} CRITICAL ERROR loading example-chat-prompts.json:`, error);
    throw new Error(`Failed to load or parse example-chat-prompts.json: ${error.message}`);
  }
}

