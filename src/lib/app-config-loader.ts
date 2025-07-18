
/**
 * @fileOverview Utility for loading and parsing the application's metadata configuration.
 */
'use server'; // Ensures this module runs only on the server

import { logger } from '@/lib/logger';
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
    logger.debug(`${logPrefix} CACHE_HIT: Returning cached application configuration.`, {
      version: loadedConfig.appVersion
    });
    return loadedConfig;
  }

  if (loadError) {
    logger.warn(`${logPrefix} CACHE_ERROR_HIT: Returning previous load error for application configuration.`, {
      error: loadError.message
    });
    throw loadError;
  }

  const filePath = path.join(process.cwd(), 'src', 'config', 'app-metadata.json');
  logger.info(`${logPrefix} FILE_ACCESS_INIT: Attempting to load application metadata from: ${filePath}`);

  try {
    logger.debug(`${logPrefix} FILE_READ_START: Reading file content...`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    logger.debug(`${logPrefix} FILE_READ_SUCCESS: File content read successfully.`, {
      length: fileContent.length
    });
    
    logger.debug(`${logPrefix} JSON_PARSE_START: Parsing file content...`);
    const jsonData = JSON.parse(fileContent);
    logger.debug(`${logPrefix} JSON_PARSE_SUCCESS: File content parsed successfully.`);
    
    logger.debug(`${logPrefix} ZOD_VALIDATE_START: Validating JSON data against schema...`);
    const validationResult = AppConfigSchema.safeParse(jsonData);
    
    if (!validationResult.success) {
      logger.error(`${logPrefix} ZOD_VALIDATE_FAIL: Zod validation FAILED for app-metadata.json.`, {
        errors: JSON.stringify(validationResult.error.errors, null, 2)
      });
      loadError = new Error(`Invalid application metadata structure in app-metadata.json: ${validationResult.error.message}`);
      throw loadError;
    }
    
    loadedConfig = validationResult.data;
    logger.info(`${logPrefix} ZOD_VALIDATE_SUCCESS: Successfully loaded and validated app-metadata.json.`, {
      version: loadedConfig.appVersion,
      timestamp: loadedConfig.lastUpdatedTimestamp || 'N/A'
    });
    return loadedConfig;
  } catch (error: any) {
    logger.error(`${logPrefix} CRITICAL_ERROR_LOAD_PARSE: Error during loading or parsing app-metadata.json.`, {
      type: error.name,
      message: error.message,
      stack: error.stack ? error.stack.substring(0, 300) : 'No stack'
    });
    loadError = new Error(`Failed to load application metadata: ${error.message}`);
    throw loadError;
  }
}
