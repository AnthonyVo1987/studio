
/**
 * @fileOverview Utility for loading and parsing AI prompt and logic definitions from JSON files.
 * Uses dynamic imports for robust file access in various environments.
 */
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
  temperature: z.number().optional().describe("Model temperature for consistency. 0.2 recommended for financial analysis."),
  seed: z.number().optional().describe("Random seed for reproducibility. 42 recommended for consistency."),
  maxOutputTokens: z.number().optional().describe("Maximum output tokens for the model response."),
  topP: z.number().optional().describe("Top-p sampling parameter."),
  topK: z.number().optional().describe("Top-k sampling parameter."),
  safetySettings: z.array(z.object({
    category: z.string(),
    threshold: z.string(),
  })).optional(),
  thinkingBudget: z.number().optional().describe("Sets a budget for thinking tokens. -1 for dynamic allocation, 0 to disable, >0 for specific limit."),
  useGoogleSearch: z.boolean().optional().describe("Whether to enable Google Search grounding for this prompt."),
  chainOfThought: z.array(LlmChainOfThoughtStepSchema).optional(),
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
 * Loads a prompt or logic definition from a JSON file using dynamic import.
 * @param definitionName The name of the definition file (without .json extension).
 * @returns A promise that resolves to the parsed and validated definition.
 */
export async function loadDefinition(definitionName: string): Promise<GenericDefinition> {
  try {
    const importedModule = await import(`@/ai/definitions/${definitionName}.json`);
    const jsonData = importedModule.default;
    

    const validationResult = GenericDefinitionSchema.safeParse(jsonData);
    if (!validationResult.success) {
      throw new Error(`Invalid definition structure in ${definitionName}.json: ${validationResult.error.message}`);
    }
    return validationResult.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof Error && 'code' in error ? (error as Error & { code?: string }).code : undefined;
    if (errorMessage.includes('Cannot find module') || errorCode === 'MODULE_NOT_FOUND') {
      // File not found - will throw generic error below
    }
    throw new Error(`Failed to load AI definition '${definitionName}': ${errorMessage}`);
  }
}

/**
 * Builds a single prompt string from an LlmPromptDefinition.
 * @param definition The LlmPromptDefinition object.
 * @returns A single string concatenating all prompt parts.
 */
export function buildPromptStringFromLlmDefinition(definition: LlmPromptDefinition): string {
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
    // Not a structured prompt - return as-is
  }
  return fullPrompt.trim();
}

// --- Schema for example prompt definition files ---
export const ExamplePromptSchema = z.object({
  title: z.string().describe("The display title for the example prompt button in the UI."),
  promptName: z.string().describe("A unique machine-readable identifier for the prompt."),
  promptTemplate: z.string().describe("The Handlebars template string for the example prompt. {{{TICKER}}} will be replaced."),
});
export type ExamplePrompt = z.infer<typeof ExamplePromptSchema>;

const ExamplePromptsFileSchema = z.array(ExamplePromptSchema);

/**
 * Loads a set of example prompts from a specified JSON file.
 * @param {string} fileName The name of the JSON file in `src/ai/definitions/` (e.g., 'example-chat-prompts.json').
 * @returns {Promise<ExamplePrompt[]>} A promise that resolves to the array of validated example prompts.
 * @throws {Error} If the file cannot be read or its content is invalid.
 */
export async function loadExamplePrompts(fileName: string): Promise<ExamplePrompt[]> {
  try {
    const importedModule = await import(`@/ai/definitions/${fileName}`);
    const jsonData = importedModule.default;
    const validationResult = ExamplePromptsFileSchema.safeParse(jsonData);
    if (!validationResult.success) {
      throw new Error(`Invalid structure in ${fileName}.`);
    }
    return validationResult.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load or parse ${fileName}: ${errorMessage}`);
  }
}
