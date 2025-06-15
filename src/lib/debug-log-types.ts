
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
  'AiOptionsAnalysisDisplay', 
  'DebugTabContent',
  'MainTabContent',
  'StockAnalysisContext',
  'NATIVE_CONSOLE',
  'Chatbot',
  'DebugConsole', 
  'AnalyzeTaAction', 
  'PerformAiAnalysisAction',
  'PerformAiOptionsAnalysisAction', 
  'ChatServerAction',
  // Removed: 'GenerateChatSummaryAction', 
  'AnalyzeTaFlow', 
  'AnalyzeStockDataFlow',
  'ChatFlow',
  'AnalyzeOptionsChainFlow', 
  // Removed: 'GenerateFullAnalysisSummaryFlow', 
  'FSM_PIPELINE', 
  // Add new source identifiers here
] as const;

export type LogSourceId = typeof logSourceIds[number];

export type LogSourceConfig = Record<LogSourceId, boolean>;

export const defaultLogSourceConfig: LogSourceConfig = {
  KeyMetricsDisplay: false,
  StockSnapshotDetailsDisplay: false,
  StandardTaDisplay: false,
  MarketStatusDisplay: false,
  AiAnalyzedTaDisplay: false, 
  AiKeyTakeawaysDisplay: false,
  OptionsChainTable: false,
  AiOptionsAnalysisDisplay: false, 
  DebugTabContent: false,
  MainTabContent: false,
  StockAnalysisContext: false,
  NATIVE_CONSOLE: false,
  Chatbot: false,
  DebugConsole: true, 
  AnalyzeTaAction: false, 
  PerformAiAnalysisAction: false,
  PerformAiOptionsAnalysisAction: false, 
  ChatServerAction: false,
  // Removed: GenerateChatSummaryAction: false, 
  AnalyzeTaFlow: false, 
  AnalyzeStockDataFlow: false,
  ChatFlow: false,
  AnalyzeOptionsChainFlow: false, 
  // Removed: GenerateFullAnalysisSummaryFlow: false, 
  FSM_PIPELINE: true, 
};

export const logSourceLabels: Record<LogSourceId, string> = {
  KeyMetricsDisplay: 'Key Metrics Display',
  StockSnapshotDetailsDisplay: 'Stock Snapshot Details Display',
  StandardTaDisplay: 'Standard TA Display',
  MarketStatusDisplay: 'Market Status Display',
  AiAnalyzedTaDisplay: 'AI Analyzed TA Display', 
  AiKeyTakeawaysDisplay: 'AI Key Takeaways Display',
  OptionsChainTable: 'Options Chain Table',
  AiOptionsAnalysisDisplay: 'AI Options Analysis Display', 
  DebugTabContent: 'Debug Tab Content',
  MainTabContent: 'Main Tab Content (Logic)',
  StockAnalysisContext: 'Stock Analysis Context (Internals)',
  NATIVE_CONSOLE: 'Native Console Logs (General)',
  Chatbot: 'Chatbot UI',
  DebugConsole: 'Debug Console UI/Internals',
  AnalyzeTaAction: 'Analyze TA Action (Server)', 
  PerformAiAnalysisAction: 'Perform AI Key Takeaways Action (Server)',
  PerformAiOptionsAnalysisAction: 'Perform AI Options Analysis Action (Server)', 
  ChatServerAction: 'Chat Server Action',
  // Removed: GenerateChatSummaryAction: 'Generate Chat Summary Action (Server)', 
  AnalyzeTaFlow: 'Analyze TA Flow (Genkit)', 
  AnalyzeStockDataFlow: 'Analyze Stock Data (Key Takeaways) Flow (Genkit)',
  ChatFlow: 'Chat Flow (Genkit)',
  AnalyzeOptionsChainFlow: 'Analyze Options Chain Flow (Genkit)', 
  // Removed: GenerateFullAnalysisSummaryFlow: 'Generate Chat Summary Flow (Genkit)', 
  FSM_PIPELINE: 'FSM Pipeline Events',
};

// For DebugConsole.tsx filter UI
export const logTypes = ['debug', 'info', 'log', 'warn', 'error'] as const;
export type LogType = typeof logTypes[number];

