
/**
 * @fileOverview Utility for loading and parsing the application's metadata configuration.
 */
'use server'; // Ensures this module runs only on the server

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const AppConfigSchema = z.object({
  appVersion: z.string().describe("The current version of the application."),
  lastUpdatedTimestamp: z.string().datetime().describe("The ISO 8601 timestamp of when the metadata was last updated."),
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
    console.log(`${logPrefix} Returning cached application configuration.`);
    return loadedConfig;
  }

  if (loadError) {
    console.warn(`${logPrefix} Returning previous load error for application configuration.`);
    throw loadError;
  }

  const filePath = path.join(process.cwd(), 'src', 'config', 'app-metadata.json');
  console.log(`${logPrefix} Attempting to load application metadata from: ${filePath}`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    
    const validationResult = AppConfigSchema.safeParse(jsonData);
    if (!validationResult.success) {
      console.error(`${logPrefix} Zod validation FAILED for app-metadata.json. Errors:`, JSON.stringify(validationResult.error.errors, null, 2));
      loadError = new Error(`Invalid application metadata structure in app-metadata.json: ${validationResult.error.message}`);
      throw loadError;
    }
    
    loadedConfig = validationResult.data;
    // Ensure lastUpdatedTimestamp is a fresh value reflecting file read for dynamic updates, if desired.
    // For now, we'll use the value from the file. If dynamic update is needed, adjust here.
    // Or, more simply, ensure the build process updates the timestamp in the JSON file.
    // For this implementation, we assume the timestamp in the file is the source of truth for "last updated".

    // Let's ensure the timestamp in the file is a valid ISO string and use it.
    // If we wanted to override with "now", we'd do:
    // loadedConfig.lastUpdatedTimestamp = new Date().toISOString();
    
    console.log(`${logPrefix} Successfully loaded and validated app-metadata.json. Version: ${loadedConfig.appVersion}`);
    return loadedConfig;
  } catch (error: any) {
    console.error(`${logPrefix} CRITICAL ERROR loading or parsing app-metadata.json. Error: ${error.message}`);
    loadError = new Error(`Failed to load application metadata: ${error.message}`);
    throw loadError;
  }
}

