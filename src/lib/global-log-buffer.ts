
/**
 * @fileOverview Global log buffer for client-side debug console.
 * This buffer is outside of React state to avoid re-render issues.
 */
import type { LogSourceId } from './debug-log-types';

export interface GlobalLogEntry {
  id: string;
  timestamp: string;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug' | 'system'; // Added 'system'
  messages: any[];
  source?: LogSourceId;
}

export const globalLogEntries: GlobalLogEntry[] = [];
const MAX_BUFFER_SIZE = 1000; // Increased from 300 to 1000

let logIdCounter = 0;
function generateId(): string {
  logIdCounter = (logIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return Date.now().toString() + "_" + logIdCounter.toString();
}

export function addEntryToGlobalLogBuffer(entry: Omit<GlobalLogEntry, 'id' | 'timestamp'>): void {
  const newEntryWithDetails: GlobalLogEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  let wrapped = false;
  if (globalLogEntries.length >= MAX_BUFFER_SIZE) {
    // If the buffer is full (or somehow over, though it shouldn't be),
    // we need to make space. The oldest entry will be removed.
    globalLogEntries.shift();
    wrapped = true;
  }

  globalLogEntries.push(newEntryWithDetails); // Add the new log entry

  if (wrapped) {
    // A wrap occurred. Insert the wrap marker at the beginning of the array.
    // This might make the array temporarily exceed MAX_BUFFER_SIZE if it was exactly full
    // before this whole operation.
    const wrapMarkerEntry: GlobalLogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(), // Timestamp of the wrap event
      type: 'system',
      source: 'LogBuffer', // New source for this specific message
      messages: ['--- LOG BUFFER WRAPPED (Oldest entries removed) ---'],
    };
    globalLogEntries.unshift(wrapMarkerEntry);
  }

  // Final trim to ensure the buffer strictly adheres to MAX_BUFFER_SIZE.
  // If a wrap marker was added and the buffer was full, this loop will remove
  // the oldest *actual* log entry that came after the marker, preserving the marker.
  while (globalLogEntries.length > MAX_BUFFER_SIZE) {
    if (globalLogEntries.length > 1 && globalLogEntries[0]?.source === 'LogBuffer' && globalLogEntries[0]?.type === 'system') {
      // If the marker is present and we're over size, remove the entry *after* the marker
      globalLogEntries.splice(1, 1);
    } else {
      // Otherwise, or if only the marker is left and we're still over (unlikely with MAX_BUFFER_SIZE > 0), remove the oldest.
      globalLogEntries.shift();
    }
  }
}

export function clearGlobalLogBuffer(): void {
  globalLogEntries.length = 0;
}
