
/**
 * @fileOverview Utility for loading and parsing the application's metadata configuration.
 */
'use server'; // Ensures this module runs only on the server

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const AppConfigSchema = z.object({
  appVersion: z.string().describe("The current version of the application."),
  lastUpdatedTimestamp: z.string().datetime().optional().describe("The ISO 8601 timestamp of when the metadata was last updated."),
  metadataSchemaVersion: z.string().describe("The version of the metadata schema itself, for future migrations/compatibility.")
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

let loadedConfig: AppConfig | null = null;
let loadError: Error | null = null;

/**
 * Reads, validates, and returns the application configuration from app-metadata.json.
 * Caches the configuration after the first successful load to avoid repeated file reads.
 * @returns {Promise<AppConfig>} A promise that resolves to the validated application configuration.
 * @throws {Error} If the configuration file cannot be read, parsed, or validated.
 */
export async function getAppConfig(): Promise<AppConfig> {
  const logPrefix = '[AppConfigLoader:getAppConfig]';

  if (loadedConfig) {
    return loadedConfig;
  }

  if (loadError) {
    throw loadError;
  }

  const filePath = path.join(process.cwd(), 'src', 'config', 'app-metadata.json');

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const jsonData = JSON.parse(fileContent);
    
    const validationResult = AppConfigSchema.safeParse(jsonData);
    
    if (!validationResult.success) {
      loadError = new Error(`Invalid application metadata structure in app-metadata.json: ${validationResult.error.message}`);
      throw loadError;
    }
    
    loadedConfig = validationResult.data;
    return loadedConfig;
  } catch (error: any) {
    loadError = new Error(`Failed to load application metadata: ${error.message}`);
    throw loadError;
  }
}
