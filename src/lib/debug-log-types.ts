
/**
 * @fileOverview Defines types and identifiers for debug logging sources.
 */

export const logSourceIds = [
  'KeyMetricsDisplay',
  'StockSnapshotDetailsDisplay',
  'StandardTaDisplay',
  'MarketStatusDisplay',
  'AiAnalyzedTaDisplay', 
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
  'AnalyzeTaFlow', 
  'AnalyzeStockDataFlow',
  'ChatFlow',
  'AnalyzeOptionsChainFlow', 
  'DefinitionLoader',
  'PolygonAdapter',
  'ChatbotFsmContext',
  'DebugConsoleFsmContext',
  'FsmStateDebugCard',
  'MainTabContent_FSM:ButtonStateEffect_DB',
  'MainTabContent_FSM:ButtonStateEffect_DC',
  'MainTabContent_FSM:ButtonStateEffect_DA', 
] as const;

export type LogSourceId = typeof logSourceIds[number];

export type LogSourceConfig = Record<LogSourceId, boolean>;

export const defaultLogSourceConfig: LogSourceConfig = {
  KeyMetricsDisplay: true,
  StockSnapshotDetailsDisplay: true,
  StandardTaDisplay: true,
  MarketStatusDisplay: true,
  AiAnalyzedTaDisplay: true, 
  AiKeyTakeawaysDisplay: true,
  OptionsChainTable: false, 
  AiOptionsAnalysisDisplay: true, 
  DebugTabContent: true,
  MainTabContent: true,
  StockAnalysisContext: true,
  NATIVE_CONSOLE: true,
  Chatbot: true,
  DebugConsole: true, 
  AnalyzeTaAction: true, 
  PerformAiAnalysisAction: true,
  PerformAiOptionsAnalysisAction: true, 
  ChatServerAction: true,
  AnalyzeTaFlow: true, 
  AnalyzeStockDataFlow: true,
  ChatFlow: true,
  AnalyzeOptionsChainFlow: true, 
  DefinitionLoader: true,
  PolygonAdapter: true,
  ChatbotFsmContext: true,
  DebugConsoleFsmContext: true,
  FsmStateDebugCard: true,
  'MainTabContent_FSM:ButtonStateEffect_DB': true,
  'MainTabContent_FSM:ButtonStateEffect_DC': true,
  'MainTabContent_FSM:ButtonStateEffect_DA': true,
};

export const logSourceLabels: Record<LogSourceId, string> = {
  KeyMetricsDisplay: 'Key Metrics UI',
  StockSnapshotDetailsDisplay: 'Snapshot Details UI',
  StandardTaDisplay: 'Standard TA UI',
  MarketStatusDisplay: 'Market Status UI',
  AiAnalyzedTaDisplay: 'AI Analyzed TA UI', 
  AiKeyTakeawaysDisplay: 'AI Key Takeaways UI',
  OptionsChainTable: 'Options Chain UI',
  AiOptionsAnalysisDisplay: 'AI Options Analysis UI', 
  DebugTabContent: 'Debug Tab UI',
  MainTabContent: 'Main Tab UI/Logic',
  StockAnalysisContext: 'Global Context/FSM',
  NATIVE_CONSOLE: 'Native Console (General)',
  Chatbot: 'Chatbot UI',
  DebugConsole: 'Debug Console UI', 
  AnalyzeTaAction: 'Analyze TA Action (Server)', 
  PerformAiAnalysisAction: 'AI Key Takeaways Action (Server)',
  PerformAiOptionsAnalysisAction: 'AI Options Action (Server)', 
  ChatServerAction: 'Chat Action (Server)',
  AnalyzeTaFlow: 'TA Flow (Genkit)', 
  AnalyzeStockDataFlow: 'Key Takeaways Flow (Genkit)',
  ChatFlow: 'Chat Flow (Genkit)',
  AnalyzeOptionsChainFlow: 'Options Flow (Genkit)', 
  DefinitionLoader: 'AI Definition Loader',
  PolygonAdapter: 'Polygon Data Adapter',
  ChatbotFsmContext: 'Chatbot FSM Context',
  DebugConsoleFsmContext: 'Debug Console FSM Context',
  FsmStateDebugCard: 'FSM State Debug Card UI',
  'MainTabContent_FSM:ButtonStateEffect_DB': 'MTC Button Effect (D.B Minimal)',
  'MainTabContent_FSM:ButtonStateEffect_DC': 'MTC Button Effect (D.C Full)',
  'MainTabContent_FSM:ButtonStateEffect_DA': 'MTC Button Effect (D.A Test)',
};

// For DebugConsole.tsx filter UI
export const logTypes = ['debug', 'info', 'log', 'warn', 'error'] as const;
export type LogType = typeof logTypes[number];

