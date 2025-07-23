
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
const REPETITIVE_LOG_THRESHOLD = 10;

let logIdCounter = 0;
function generateId(): string {
  logIdCounter = (logIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return Date.now().toString() + "_" + logIdCounter.toString();
}

// Repetitive log detection state
interface RepetitiveLogState {
  logKey: string;
  count: number;
  firstOccurrence: GlobalLogEntry;
  suppressedUntilCount: number;
}

let repetitiveLogState: RepetitiveLogState | null = null;

function createLogKey(entry: Omit<GlobalLogEntry, 'id' | 'timestamp'>): string {
  try {
    return `${entry.source || 'unknown'}:${entry.type}:${JSON.stringify(entry.messages)}`;
  } catch (e) {
    return `${entry.source || 'unknown'}:${entry.type}:${String(entry.messages)}`;
  }
}

export function addEntryToGlobalLogBuffer(entry: Omit<GlobalLogEntry, 'id' | 'timestamp'>): void {
  const currentLogKey = createLogKey(entry);
  
  // Handle repetitive log detection
  if (repetitiveLogState?.logKey === currentLogKey) {
    // This is a repetitive log
    repetitiveLogState.count++;
    
    if (repetitiveLogState.count <= REPETITIVE_LOG_THRESHOLD) {
      // Still within the first 10 occurrences, log normally
      addLogEntryToBuffer({
        ...entry,
        id: generateId(),
        timestamp: new Date().toISOString(),
      });
      
      // If this is exactly the 10th occurrence, add a warning about consolidation
      if (repetitiveLogState.count === REPETITIVE_LOG_THRESHOLD) {
        addLogEntryToBuffer({
          id: generateId(),
          timestamp: new Date().toISOString(),
          type: 'system',
          source: 'LogBuffer',
          messages: [`--- REPETITIVE LOG DETECTED: Future occurrences of this log will be consolidated (every ${REPETITIVE_LOG_THRESHOLD}th occurrence) ---`],
        });
        repetitiveLogState.suppressedUntilCount = repetitiveLogState.count + REPETITIVE_LOG_THRESHOLD;
      }
    } else {
      // We're past the threshold, only log every 10th occurrence
      if (repetitiveLogState.count >= repetitiveLogState.suppressedUntilCount) {
        const suppressedCount = repetitiveLogState.count - REPETITIVE_LOG_THRESHOLD;
        addLogEntryToBuffer({
          id: generateId(),
          timestamp: new Date().toISOString(),
          type: 'system',
          source: 'LogBuffer',
          messages: [`--- CONSOLIDATED LOG (${suppressedCount} occurrences suppressed) ---`],
        });
        
        addLogEntryToBuffer({
          ...entry,
          id: generateId(),
          timestamp: new Date().toISOString(),
        });
        
        repetitiveLogState.suppressedUntilCount = repetitiveLogState.count + REPETITIVE_LOG_THRESHOLD;
      }
      // Otherwise, suppress this log entry
    }
  } else {
    // This is a new log pattern, reset repetitive log state
    repetitiveLogState = {
      logKey: currentLogKey,
      count: 1,
      firstOccurrence: {
        ...entry,
        id: generateId(),
        timestamp: new Date().toISOString(),
      },
      suppressedUntilCount: 0,
    };
    
    // Add the log entry normally
    addLogEntryToBuffer(repetitiveLogState.firstOccurrence);
  }
}

function addLogEntryToBuffer(newEntry: GlobalLogEntry): void {
  let wrapped = false;
  if (globalLogEntries.length >= MAX_BUFFER_SIZE) {
    globalLogEntries.shift();
    wrapped = true;
  }

  globalLogEntries.push(newEntry);

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
  repetitiveLogState = null;
}
