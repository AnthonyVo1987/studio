
/**
 * @fileOverview Defines types and identifiers for debug logging sources.
 */

export const logSourceIds = [
  'KeyMetricsDisplay',
  'StockSnapshotDetailsDisplay',
  'StandardTaDisplay',
  'MarketStatusDisplay',
  'AiCalculatedTaDisplay',
  'AiKeyTakeawaysDisplay',
  'OptionsChainTable',
  'DebugTabContent',
  'MainTabContent',
  'StockAnalysisContext',
  'NATIVE_CONSOLE',
  'Chatbot',
  'DebugConsole', // Added for logs from the debug console itself
  // Add new source identifiers here
] as const;

export type LogSourceId = typeof logSourceIds[number];

export type LogSourceConfig = Record<LogSourceId, boolean>;

export const defaultLogSourceConfig: LogSourceConfig = {
  KeyMetricsDisplay: false,
  StockSnapshotDetailsDisplay: false,
  StandardTaDisplay: false,
  MarketStatusDisplay: false,
  AiCalculatedTaDisplay: false,
  AiKeyTakeawaysDisplay: false,
  OptionsChainTable: false,
  DebugTabContent: false,
  MainTabContent: false,
  StockAnalysisContext: false,
  NATIVE_CONSOLE: false,
  Chatbot: false,
  DebugConsole: true, // Default to true to see console's own debug messages
};

export const logSourceLabels: Record<LogSourceId, string> = {
  KeyMetricsDisplay: 'Key Metrics Display',
  StockSnapshotDetailsDisplay: 'Stock Snapshot Details Display',
  StandardTaDisplay: 'Standard TA Display',
  MarketStatusDisplay: 'Market Status Display',
  AiCalculatedTaDisplay: 'AI Calculated TA Display',
  AiKeyTakeawaysDisplay: 'AI Key Takeaways Display',
  OptionsChainTable: 'Options Chain Table',
  DebugTabContent: 'Debug Tab Content',
  MainTabContent: 'Main Tab Content (Actions/Logic)',
  StockAnalysisContext: 'Stock Analysis Context (Internals)',
  NATIVE_CONSOLE: 'Native Console Logs (General)',
  Chatbot: 'Chatbot UI',
  DebugConsole: 'Debug Console UI/Internals',
};

// For DebugConsole.tsx filter UI
export const logTypes = ['debug', 'info', 'log', 'warn', 'error'] as const;
export type LogType = typeof logTypes[number];

