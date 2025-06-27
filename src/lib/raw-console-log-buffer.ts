/**
 * @fileOverview Global log buffer for raw, unfiltered client-side console output.
 * This buffer is separate from the curated 'global-log-buffer' and captures everything.
 */
import type { GlobalLogEntry } from './debug-log-types';

export const rawConsoleLogEntries: GlobalLogEntry[] = [];
const MAX_BUFFER_SIZE = 2000;

let logIdCounter = 0;
function generateId(): string {
  logIdCounter = (logIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return Date.now().toString() + "_" + logIdCounter.toString();
}

export function addEntryToRawConsoleBuffer(entry: Omit<GlobalLogEntry, 'id' | 'timestamp'>): void {
  const newEntryWithDetails: GlobalLogEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  let wrapped = false;
  if (rawConsoleLogEntries.length >= MAX_BUFFER_SIZE) {
    rawConsoleLogEntries.shift();
    wrapped = true;
  }

  rawConsoleLogEntries.push(newEntryWithDetails);

  if (wrapped) {
    const wrapMarkerEntry: GlobalLogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'system',
      source: 'LogBuffer',
      messages: ['--- RAW CONSOLE LOG BUFFER WRAPPED (Oldest entries removed) ---'],
    };
    rawConsoleLogEntries.unshift(wrapMarkerEntry);
  }

  while (rawConsoleLogEntries.length > MAX_BUFFER_SIZE) {
    rawConsoleLogEntries.shift();
  }
}

export function clearRawConsoleBuffer(): void {
  rawConsoleLogEntries.length = 0;
}
