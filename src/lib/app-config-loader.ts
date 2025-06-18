
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
    console.log(`${logPrefix} CACHE_HIT: Returning cached application configuration. Version: ${loadedConfig.appVersion}`);
    return loadedConfig;
  }

  if (loadError) {
    console.warn(`${logPrefix} CACHE_ERROR_HIT: Returning previous load error for application configuration: ${loadError.message}`);
    throw loadError;
  }

  const filePath = path.join(process.cwd(), 'src', 'config', 'app-metadata.json');
  console.log(`${logPrefix} FILE_ACCESS_INIT: Attempting to load application metadata from: ${filePath}`);

  try {
    console.log(`${logPrefix} FILE_READ_START: Reading file content...`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    console.log(`${logPrefix} FILE_READ_SUCCESS: File content read successfully. Length: ${fileContent.length}`);
    
    console.log(`${logPrefix} JSON_PARSE_START: Parsing file content...`);
    const jsonData = JSON.parse(fileContent);
    console.log(`${logPrefix} JSON_PARSE_SUCCESS: File content parsed successfully.`);
    
    console.log(`${logPrefix} ZOD_VALIDATE_START: Validating JSON data against schema...`);
    const validationResult = AppConfigSchema.safeParse(jsonData);
    
    if (!validationResult.success) {
      console.error(`${logPrefix} ZOD_VALIDATE_FAIL: Zod validation FAILED for app-metadata.json. Errors:`, JSON.stringify(validationResult.error.errors, null, 2));
      loadError = new Error(`Invalid application metadata structure in app-metadata.json: ${validationResult.error.message}`);
      throw loadError;
    }
    
    loadedConfig = validationResult.data;
    console.log(`${logPrefix} ZOD_VALIDATE_SUCCESS: Successfully loaded and validated app-metadata.json. Version: ${loadedConfig.appVersion}, Timestamp: ${loadedConfig.lastUpdatedTimestamp}`);
    return loadedConfig;
  } catch (error: any) {
    console.error(`${logPrefix} CRITICAL_ERROR_LOAD_PARSE: Error during loading or parsing app-metadata.json. Error Type: ${error.name}, Message: ${error.message}, Stack: ${error.stack ? error.stack.substring(0, 300) : 'No stack'}`);
    loadError = new Error(`Failed to load application metadata: ${error.message}`);
    throw loadError;
  }
}
