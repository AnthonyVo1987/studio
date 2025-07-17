
/**
 * @fileOverview Global log buffer for client-side debug console.
 * This buffer is outside of React state to avoid re-render issues.
 */

type LogType = 'debug' | 'info' | 'log' | 'warn' | 'error' | 'system';

export interface GlobalLogEntry {
  id: string;
  timestamp: string;
  type: LogType; 
  messages: any[];
  source?: string;
}

export const globalLogEntries: GlobalLogEntry[] = [];
const MAX_BUFFER_SIZE = 2000;

let logIdCounter = 0;
function generateId(): string {
  logIdCounter = (logIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return Date.now().toString() + "_" + logIdCounter.toString();
}

export function addEntryToGlobalLogBuffer(entry: Omit<GlobalLogEntry, 'id' | 'timestamp'>): void {
  // De-duplication logic
  const lastLog = globalLogEntries[globalLogEntries.length - 1];
  if (lastLog) {
      try {
          const isDuplicate = 
              lastLog.source === entry.source && 
              lastLog.type === entry.type && 
              JSON.stringify(lastLog.messages) === JSON.stringify(entry.messages);
          if (isDuplicate) {
              return;
          }
      } catch (e) {
          // JSON.stringify can fail on complex objects, proceed with logging in that case.
      }
  }

  const newEntryWithDetails: GlobalLogEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  let wrapped = false;
  if (globalLogEntries.length >= MAX_BUFFER_SIZE) {
    globalLogEntries.shift();
    wrapped = true;
  }

  globalLogEntries.push(newEntryWithDetails);

  if (wrapped) {
    const wrapMarkerEntry: GlobalLogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: 'system',
      source: 'LogBuffer',
      messages: ['--- LOG BUFFER WRAPPED (Oldest entries removed) ---'],
    };
    // Check if the first entry is already a wrap marker to avoid duplicates
    if (globalLogEntries[0]?.source !== 'LogBuffer' || globalLogEntries[0]?.type !== 'system') {
        globalLogEntries.unshift(wrapMarkerEntry);
    }
  }

  while (globalLogEntries.length > MAX_BUFFER_SIZE) {
    if (globalLogEntries.length > 1 && globalLogEntries[0]?.source === 'LogBuffer' && globalLogEntries[0]?.type === 'system') {
      globalLogEntries.splice(1, 1);
    } else {
      globalLogEntries.shift();
    }
  }
}

export function clearGlobalLogBuffer(): void {
  globalLogEntries.length = 0;
}
