
/**
 * @fileOverview Utility functions for validating data readiness, typically from JSON strings.
 */
import type { LogSourceId } from '@/lib/debug-log-types';
import { PENDING_STATUS_JSON_VARIANTS } from '@/lib/constants';


/**
 * Checks if a JSON string represents data that is ready for processing.
 * It's considered NOT ready if it's null/undefined, empty, a generic pending/error status string,
 * or if it parses to an object containing a "status" field indicating error/skipped/pending,
 * or an "error" field.
 * 
 * @param jsonString The JSON string to check.
 * @param logDebugFn Optional logging function (e.g., from useStockAnalysis) for detailed tracing.
 * @param sourceComponent Optional source component name for logging.
 * @param dataName Optional specific name of the data being checked for logging.
 * @param category Optional logging category, e.g., 'RenderState' to allow suppression.
 * @returns True if data is ready, false otherwise.
 */
export function isDataReadyForProcessing(
  jsonString: string | null | undefined,
  logDebugFn?: (source: LogSourceId, category: string, ...messages: any[]) => void,
  sourceComponent?: string,
  dataName?: string,
  category: string = 'Validation' // Default category if not provided
): boolean {
  const callContext = `${sourceComponent || 'isDataReadyCheck'}:${dataName || 'data'}`;
  const effectiveLogDebug = logDebugFn || (() => {}); // No-op if no logger provided

  if (!jsonString || jsonString.trim() === '{}' || PENDING_STATUS_JSON_VARIANTS.includes(jsonString.trim())) {
    effectiveLogDebug(sourceComponent as LogSourceId, category, `${callContext} JSON (is null/empty/generic pending): '${jsonString?.substring(0, 50)}...' -> Not Ready`);
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
        effectiveLogDebug(sourceComponent as LogSourceId, category, `${callContext} JSON contains status='${parsed.status}' -> Not Ready`);
        return false;
      }
      if (parsed.error) {
        effectiveLogDebug(sourceComponent as LogSourceId, category, `${callContext} JSON contains 'error' field: ${parsed.error} -> Not Ready`);
        return false;
      }
    }
  } catch (e) {
    // If parsing fails, it's definitely not ready and likely indicates an error JSON that isn't caught above.
    effectiveLogDebug(sourceComponent as LogSourceId, category, `${callContext} JSON parsing failed. Content (start): '${jsonString.trim().substring(0, 100)}...' -> Not Ready`);
    return false;
  }

  effectiveLogDebug(sourceComponent as LogSourceId, category, `${callContext} JSON appears valid and ready. Content (start): '${jsonString.trim().substring(0, 100)}...' -> Ready`);
  return true;
}
