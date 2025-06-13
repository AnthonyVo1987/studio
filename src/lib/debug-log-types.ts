
/**
 * @fileOverview Defines types and identifiers for debug logging sources.
 */

export const logSourceIds = [
  'KeyMetricsDisplay',
  'StockSnapshotDetailsDisplay',
  'StandardTaDisplay',
  'MarketStatusDisplay',
  'AiAnalyzedTaDisplay', // Renamed
  'AiKeyTakeawaysDisplay',
  'OptionsChainTable',
  'AiOptionsAnalysisDisplay', // New
  'DebugTabContent',
  'MainTabContent',
  'StockAnalysisContext',
  'NATIVE_CONSOLE',
  'Chatbot',
  'DebugConsole', 
  'AnalyzeTaAction', // Renamed
  'PerformAiAnalysisAction',
  'PerformAiOptionsAnalysisAction', // New
  'ChatServerAction',
  'AnalyzeTaFlow', // Renamed
  'AnalyzeStockDataFlow',
  'ChatFlow',
  'AnalyzeOptionsChainFlow', // New
  // Add new source identifiers here
] as const;

export type LogSourceId = typeof logSourceIds[number];

export type LogSourceConfig = Record<LogSourceId, boolean>;

export const defaultLogSourceConfig: LogSourceConfig = {
  KeyMetricsDisplay: false,
  StockSnapshotDetailsDisplay: false,
  StandardTaDisplay: false,
  MarketStatusDisplay: false,
  AiAnalyzedTaDisplay: false, // Renamed
  AiKeyTakeawaysDisplay: false,
  OptionsChainTable: false,
  AiOptionsAnalysisDisplay: false, // New
  DebugTabContent: false,
  MainTabContent: false,
  StockAnalysisContext: false,
  NATIVE_CONSOLE: false,
  Chatbot: false,
  DebugConsole: true, 
  AnalyzeTaAction: false, // Renamed
  PerformAiAnalysisAction: false,
  PerformAiOptionsAnalysisAction: false, // New
  ChatServerAction: false,
  AnalyzeTaFlow: false, // Renamed
  AnalyzeStockDataFlow: false,
  ChatFlow: false,
  AnalyzeOptionsChainFlow: false, // New
};

export const logSourceLabels: Record<LogSourceId, string> = {
  KeyMetricsDisplay: 'Key Metrics Display',
  StockSnapshotDetailsDisplay: 'Stock Snapshot Details Display',
  StandardTaDisplay: 'Standard TA Display',
  MarketStatusDisplay: 'Market Status Display',
  AiAnalyzedTaDisplay: 'AI Analyzed TA Display', // Renamed
  AiKeyTakeawaysDisplay: 'AI Key Takeaways Display',
  OptionsChainTable: 'Options Chain Table',
  AiOptionsAnalysisDisplay: 'AI Options Analysis Display', // New
  DebugTabContent: 'Debug Tab Content',
  MainTabContent: 'Main Tab Content (Logic)',
  StockAnalysisContext: 'Stock Analysis Context (Internals)',
  NATIVE_CONSOLE: 'Native Console Logs (General)',
  Chatbot: 'Chatbot UI',
  DebugConsole: 'Debug Console UI/Internals',
  AnalyzeTaAction: 'Analyze TA Action (Server)', // Renamed
  PerformAiAnalysisAction: 'Perform AI Key Takeaways Action (Server)',
  PerformAiOptionsAnalysisAction: 'Perform AI Options Analysis Action (Server)', // New
  ChatServerAction: 'Chat Server Action',
  AnalyzeTaFlow: 'Analyze TA Flow (Genkit)', // Renamed
  AnalyzeStockDataFlow: 'Analyze Stock Data (Key Takeaways) Flow (Genkit)',
  ChatFlow: 'Chat Flow (Genkit)',
  AnalyzeOptionsChainFlow: 'Analyze Options Chain Flow (Genkit)', // New
};

// For DebugConsole.tsx filter UI
export const logTypes = ['debug', 'info', 'log', 'warn', 'error'] as const;
export type LogType = typeof logTypes[number];
