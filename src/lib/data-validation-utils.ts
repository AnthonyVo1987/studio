
/**
 * @fileOverview Utility functions for validating data readiness, typically from JSON strings.
 */
import { PENDING_STATUS_JSON_VARIANTS } from '@/lib/constants';


/**
 * Checks if a JSON string represents data that is ready for processing.
 * It's considered NOT ready if it's null/undefined, empty, a generic pending/error status string,
 * or if it parses to an object containing a "status" field indicating error/skipped/pending,
 * or an "error" field.
 * 
 * @param jsonString The JSON string to check.
 * @param sourceComponent Optional source component name for logging.
 * @param dataName Optional specific name of the data being checked for logging.
 * @returns True if data is ready, false otherwise.
 */
export function isDataReadyForProcessing(
  jsonString: string | null | undefined,
  sourceComponent?: string,
  dataName?: string
): boolean {
  const callContext = `${sourceComponent || 'isDataReadyCheck'}:${dataName || 'data'}`;

  if (!jsonString || jsonString.trim() === '{}' || PENDING_STATUS_JSON_VARIANTS.includes(jsonString.trim())) {
    return false;
  }

  try {
    const parsed = JSON.parse(jsonString.trim());
    if (parsed && typeof parsed === 'object') {
      if (parsed.status && (
          String(parsed.status).toLowerCase().includes('error') ||
          String(parsed.status).toLowerCase().includes('skipped') ||
          String(parsed.status).toLowerCase().includes('pending') ||
          String(parsed.status).toLowerCase().includes('initializing')
      )) {
        return false;
      }
      if (parsed.error) {
        return false;
      }
    }
  } catch (e) {
    // If parsing fails, it's definitely not ready and likely indicates an error JSON that isn't caught above.
    return false;
  }

  return true;
}
