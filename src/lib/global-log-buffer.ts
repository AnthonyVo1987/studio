
/**
 * @fileOverview Global log buffer for client-side debug console.
 * This buffer is outside of React state to avoid re-render issues.
 */
import type { LogSourceId } from './debug-log-types'; // Changed from DebugLogCategory

export interface GlobalLogEntry {
  id: string;
  timestamp: string;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  messages: any[];
  source?: LogSourceId; // Use LogSourceId
}

export const globalLogEntries: GlobalLogEntry[] = [];
const MAX_BUFFER_SIZE = 300; // Max logs to keep in the global buffer

let logIdCounter = 0;
function generateId(): string {
  logIdCounter = (logIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return Date.now().toString() + "_" + logIdCounter.toString();
}

export function addEntryToGlobalLogBuffer(entry: Omit<GlobalLogEntry, 'id' | 'timestamp'>): void {
  const newEntry: GlobalLogEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  globalLogEntries.push(newEntry);
  if (globalLogEntries.length > MAX_BUFFER_SIZE) {
    globalLogEntries.shift(); // Remove oldest entry
  }
}

export function clearGlobalLogBuffer(): void {
  globalLogEntries.length = 0;
}
