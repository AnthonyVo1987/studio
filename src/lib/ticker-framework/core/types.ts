/**
 * @fileOverview Core types for the ticker framework context factory
 * 
 * This file defines the types used by the context factory to generate
 * isolated contexts for each ticker tab. Based on the NVDA/SPY blueprint
 * architecture with 79 state fields and 12 action types.
 */

import type { ReactNode, Dispatch } from 'react';

// Options Chain Settings (common across all ticker contexts)
export type OptionType = 'both' | 'calls' | 'puts';
export type StrikeCount = 20 | 30 | 40;
export type TableDisplayType = 'side-by-side' | 'top-bottom';

/**
 * Base ticker configuration interface
 */
export interface TickerConfig {
  ticker: string;
  displayName: string;
  defaultStrikeCount?: StrikeCount;
  defaultTableDisplay?: TableDisplayType;
  customSettings?: Record<string, unknown>;
}

/**
 * Complete state structure for ticker analysis contexts
 * Based on NVDA/SPY blueprint with 79 fields
 */
export interface TickerAnalysisState {
  // Status Management
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  
  // Expiration Management
  availableExpirationDates: string[];
  selectedExpirationDate: string;
  
  // Options Chain Settings
  optionType: OptionType;
  strikeCount: StrikeCount;
  tableDisplayType: TableDisplayType;
  
  // Raw Data (JSON strings from server actions)
  stockSnapshotJson: string;
  marketStatusJson: string;
  standardTasJson: string;
  aiAnalyzedTaJson: string;
  aiKeyTakeawaysJson: string;
  aiOptionsAnalysisJson: string;
  optionsChainJson: string;
  
  // AI Chat Raw Debug Data (JSON strings for each chat response type)
  // App Data Analysis Button Responses
  stockTraderTakeawaysRawJson: string;
  optionsTraderTakeawaysRawJson: string;
  holisticTakeawaysRawJson: string;
  
  // Web Search Analysis Button Responses  
  supportResistanceWebSearchRawJson: string;
  technicalAnalysisWebSearchRawJson: string;
  optionsFlowWebSearchRawJson: string;
  
  // User Input Responses (separated by mode)
  userInputAppDataRawJson: string;
  userInputWebSearchRawJson: string;
  
  // Data Flags
  hasStockData: boolean;
  hasAiTaData: boolean;
  hasAiKeyTakeaways: boolean;
  hasAiOptionsAnalysis: boolean;
  hasOptionsChainData: boolean;
  
  // AI Operation Loading States (separate from main FSM)
  isAiKeyTakeawaysLoading: boolean;
  isAiOptionsAnalysisLoading: boolean;
  
  // UI Update Flag - signals when ALL data retrieval is complete for batch UI updates
  dataRetrievalComplete: boolean;
}

/**
 * All possible action types for ticker analysis contexts
 * Based on the 12 existing action types from NVDA/SPY
 */
export type TickerAnalysisAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_IDLE' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_EXPIRATION_DATES'; payload: string[] }
  | { type: 'SET_SELECTED_EXPIRATION'; payload: string }
  | { type: 'SET_OPTIONS_SETTINGS'; payload: {
      optionType?: OptionType;
      strikeCount?: StrikeCount;
      tableDisplayType?: TableDisplayType;
    }}
  | { type: 'SET_STOCK_DATA'; payload: {
      stockSnapshotJson: string;
      marketStatusJson: string;
      standardTasJson: string;
      aiAnalyzedTaJson: string;
    }}
  | { type: 'SET_OPTIONS_CHAIN_DATA'; payload: string }
  | { type: 'SET_AI_KEY_TAKEAWAYS'; payload: string }
  | { type: 'SET_AI_KEY_TAKEAWAYS_LOADING'; payload: boolean }
  | { type: 'SET_AI_OPTIONS_ANALYSIS'; payload: string }
  | { type: 'SET_AI_OPTIONS_ANALYSIS_LOADING'; payload: boolean }
  | { type: 'SET_DATA_RETRIEVAL_COMPLETE'; payload: boolean }
  | { type: 'SET_AI_CHAT_RAW_DATA'; payload: {
      promptName: string;
      responseJson: string;
      webSearchEnabled: boolean;
      isUserInput?: boolean;
    }}
  | { type: 'RESET_STATE' };

/**
 * Context factory result containing all generated items
 */
export interface TickerContextResult<T extends TickerConfig> {
  // The configuration used to create this context
  config: T;
  
  // React Context objects
  StateContext: React.Context<TickerAnalysisState | null>;
  DispatchContext: React.Context<Dispatch<TickerAnalysisAction> | null>;
  
  // Provider component
  Provider: React.FC<{ children: ReactNode }>;
  
  // Custom hooks with dynamic names
  hooks: {
    useState: () => TickerAnalysisState;
    useDispatch: () => Dispatch<TickerAnalysisAction>;
    useStateWithSetters: () => TickerAnalysisState & TickerSetterFunctions;
  };
  
  // Setter functions (matching context-setter-factory pattern)
  setters: TickerSetterFunctions;
  
  // Initial state for testing/reference
  initialState: TickerAnalysisState;
}

/**
 * All setter functions for updating context state
 * These wrap dispatch calls for convenience
 */
export interface TickerSetterFunctions {
  setLoading: () => void;
  setIdle: () => void;
  setError: (error: string) => void;
  setExpirationDates: (dates: string[]) => void;
  setSelectedExpiration: (date: string) => void;
  setOptionsSettings: (settings: {
    optionType?: OptionType;
    strikeCount?: StrikeCount;
    tableDisplayType?: TableDisplayType;
  }) => void;
  setStockData: (data: {
    stockSnapshotJson: string;
    marketStatusJson: string;
    standardTasJson: string;
    aiAnalyzedTaJson: string;
  }) => void;
  setOptionsChainData: (json: string) => void;
  setAiKeyTakeaways: (json: string) => void;
  setAiKeyTakeawaysLoading: (loading: boolean) => void;
  setAiOptionsAnalysis: (json: string) => void;
  setAiOptionsAnalysisLoading: (loading: boolean) => void;
  setDataRetrievalComplete: (complete: boolean) => void;
  setAiChatRawData: (data: {
    promptName: string;
    responseJson: string;
    webSearchEnabled: boolean;
    isUserInput?: boolean;
  }) => void;
  resetState: () => void;
}