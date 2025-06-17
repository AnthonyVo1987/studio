
/**
 * @fileOverview Utilities for loading and processing AI prompt definitions from JSON files.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod'; // Using direct zod import

// Define the structure for a part of a prompt (text segment)
const PromptPartSchema = z.object({
  text: z.string().describe("A segment of the prompt text. Can contain Handlebars placeholders like {{{variable}}}."),
});
export type PromptPart = z.infer<typeof PromptPartSchema>;

// Define the structure for a step in the chain of thought
const ChainOfThoughtStepSchema = z.object({
  role: z.string().describe("The conceptual role for this step (e.g., System, User, AnalystTask, OutputInstructions)."),
  parts: z.array(PromptPartSchema).min(1).describe("An array of text parts that make up this step of the prompt."),
});
export type ChainOfThoughtStep = z.infer<typeof ChainOfThoughtStepSchema>;

// Define the structure for safety settings
const SafetySettingSchema = z.object({
  category: z.string(),
  threshold: z.string(),
});
export type SafetySetting = z.infer<typeof SafetySettingSchema>;


// Define the main schema for a prompt definition JSON file
export const PromptDefinitionSchema = z.object({
  promptName: z.string().describe("A unique identifier for the prompt."),
  description: z.string().describe("A human-readable description of the prompt's purpose and functionality."),
  modelId: z.string().optional().describe("Optional Genkit model ID (e.g., googleai/gemini-pro). If not provided, a default can be used in the flow."),
  safetySettings: z.array(SafetySettingSchema).optional().describe("Optional Genkit safety settings configuration."),
  chainOfThought: z.array(ChainOfThoughtStepSchema).min(1).optional().describe("An array of chain-of-thought steps that constitute the prompt."),
  calculationConfig: z.any().optional().describe("Configuration for non-LLM flows, e.g. specifying which indicators to calculate."),
  outputSchemaHint: z.string().optional().describe("Optional: A string hinting at the Zod output schema name used by ai.definePrompt (for documentation/reference)."),
});
export type PromptDefinition = z.infer<typeof PromptDefinitionSchema>;

const promptsDirectory = path.join(process.cwd(), 'src', 'ai', 'prompts');

/**
 * Loads a prompt definition from a JSON file.
 * @param {string} promptName - The name of the prompt (corresponds to the JSON filename without extension).
 * @returns {Promise<PromptDefinition>} - The validated prompt definition object.
 * @throws {Error} If the file cannot be read or the content is invalid.
 */
export async function loadPromptDefinition(promptName: string): Promise<PromptDefinition> {
  const filePath = path.join(promptsDirectory, `${promptName}.json`);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    const validationResult = PromptDefinitionSchema.safeParse(jsonData);
    if (!validationResult.success) {
      console.error(`Validation error for prompt '${promptName}':`, validationResult.error.issues);
      throw new Error(`Invalid prompt definition structure for '${promptName}'.`);
    }
    return validationResult.data;
  } catch (error: any) {
    console.error(`Error loading prompt definition '${promptName}' from ${filePath}:`, error);
    throw new Error(`Failed to load or parse prompt definition for '${promptName}': ${error.message}`);
  }
}

/**
 * Builds a single prompt string from a PromptDefinition object.
 * Concatenates all text parts from all chain-of-thought steps.
 * Returns an empty string if chainOfThought is not present.
 * @param {PromptDefinition} definition - The prompt definition object.
 * @returns {string} The fully constructed prompt string.
 */
export function buildPromptStringFromDefinition(definition: PromptDefinition): string {
  let fullPrompt = "";
  if (definition.chainOfThought && Array.isArray(definition.chainOfThought)) {
    definition.chainOfThought.forEach(step => {
      if (step.parts && Array.isArray(step.parts)) {
        step.parts.forEach(part => {
          fullPrompt += part.text + "\n"; // Add newline between parts for clarity
        });
      }
      fullPrompt += "\n"; // Add extra newline between steps
    });
  }
  return fullPrompt.trim();
}

// --- Schema for example-chat-prompts.json ---
export const ExampleChatPromptSchema = z.object({
  title: z.string().describe("The display title for the example prompt button in the UI."),
  promptTemplate: z.string().describe("The Handlebars template string for the example prompt. {{{TICKER}}} will be replaced."),
});
export type ExampleChatPrompt = z.infer<typeof ExampleChatPromptSchema>;

export const ExampleChatPromptsFileSchema = z.array(ExampleChatPromptSchema);
export type ExampleChatPromptsFile = z.infer<typeof ExampleChatPromptsFileSchema>;

/**
 * Loads example chat prompts from the JSON file.
 * @returns {Promise<ExampleChatPromptsFile>}
 * @throws {Error} If the file cannot be read or the content is invalid.
 */
export async function loadExampleChatPrompts(): Promise<ExampleChatPromptsFile> {
  const filePath = path.join(promptsDirectory, 'example-chat-prompts.json');
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    const validationResult = ExampleChatPromptsFileSchema.safeParse(jsonData);
     if (!validationResult.success) {
      console.error("Validation error for example-chat-prompts.json:", validationResult.error.issues);
      throw new Error("Invalid example chat prompts structure.");
    }
    return validationResult.data;
  } catch (error: any) {
    console.error("Error loading example-chat-prompts.json:", error);
    throw new Error(`Failed to load or parse example-chat-prompts.json: ${error.message}`);
  }
}
