/**
 * @fileOverview Ticker Context Factory
 * 
 * This factory creates isolated React contexts for each ticker, ensuring complete
 * state isolation between ticker tabs while sharing common logic patterns.
 * 
 * Architecture Pattern: Context Factory with Isolated State Management
 * - Each ticker gets its own context instance
 * - Shared reducer logic with ticker-specific actions
 * - Type-safe hooks for each ticker context
 * - Zero cross-dependencies between ticker contexts
 */

'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer, useMemo } from 'react';
import type { TickerConfig } from './ticker-config';
import { createTickerLogger, type TickerPage } from './ticker-logger';

// Shared types for all ticker contexts
export type OptionType = 'both' | 'calls' | 'puts';
export type StrikeCount = 20 | 30 | 40;
export type TableDisplayType = 'side-by-side' | 'top-bottom';

export interface TickerAnalysisState {
  // Ticker identification
  ticker: string;
  
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
  standardTaJson: string;
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
      standardTaJson: string;
      aiAnalyzedTaJson: string;
    }}
  | { type: 'SET_AI_KEY_TAKEAWAYS'; payload: string }
  | { type: 'SET_AI_OPTIONS_ANALYSIS'; payload: string }
  | { type: 'SET_OPTIONS_CHAIN_DATA'; payload: string }
  | { type: 'SET_AI_KEY_TAKEAWAYS_LOADING'; payload: boolean }
  | { type: 'SET_AI_OPTIONS_ANALYSIS_LOADING'; payload: boolean }
  | { type: 'SET_DATA_RETRIEVAL_COMPLETE'; payload: boolean }
  | { type: 'SET_CHAT_DEBUG_DATA'; payload: {
      type: 'stockTrader' | 'optionsTrader' | 'holistic' | 'supportResistance' | 
            'technicalAnalysis' | 'optionsFlow' | 'userInputApp' | 'userInputWeb';
      data: string;
    }}
  | { type: 'RESET_STATE' };

/**
 * Create initial state for a ticker
 */
function createInitialState(config: TickerConfig): TickerAnalysisState {
  return {
    ticker: config.ticker,
    status: 'idle',
    error: null,
    availableExpirationDates: [],
    selectedExpirationDate: '',
    optionType: config.defaults.optionType,
    strikeCount: config.defaults.strikeCount,
    tableDisplayType: config.defaults.tableDisplayType,
    stockSnapshotJson: '',
    marketStatusJson: '',
    standardTaJson: '',
    aiAnalyzedTaJson: '',
    aiKeyTakeawaysJson: '',
    aiOptionsAnalysisJson: '',
    optionsChainJson: '',
    stockTraderTakeawaysRawJson: '',
    optionsTraderTakeawaysRawJson: '',
    holisticTakeawaysRawJson: '',
    supportResistanceWebSearchRawJson: '',
    technicalAnalysisWebSearchRawJson: '',
    optionsFlowWebSearchRawJson: '',
    userInputAppDataRawJson: '',
    userInputWebSearchRawJson: '',
    hasStockData: false,
    hasAiTaData: false,
    hasAiKeyTakeaways: false,
    hasAiOptionsAnalysis: false,
    hasOptionsChainData: false,
    isAiKeyTakeawaysLoading: false,
    isAiOptionsAnalysisLoading: false,
    dataRetrievalComplete: false,
  };
}

/**
 * Shared reducer logic for all ticker contexts
 */
function tickerAnalysisReducer(
  state: TickerAnalysisState,
  action: TickerAnalysisAction
): TickerAnalysisState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, status: 'loading', error: null };
      
    case 'SET_IDLE':
      return { ...state, status: 'idle' };
      
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload };
      
    case 'SET_EXPIRATION_DATES':
      return {
        ...state,
        availableExpirationDates: action.payload,
        selectedExpirationDate: action.payload[0] || '',
      };
      
    case 'SET_SELECTED_EXPIRATION':
      return { ...state, selectedExpirationDate: action.payload };
      
    case 'SET_OPTIONS_SETTINGS':
      return { ...state, ...action.payload };
      
    case 'SET_STOCK_DATA':
      return {
        ...state,
        stockSnapshotJson: action.payload.stockSnapshotJson,
        marketStatusJson: action.payload.marketStatusJson,
        standardTaJson: action.payload.standardTaJson,
        aiAnalyzedTaJson: action.payload.aiAnalyzedTaJson,
        hasStockData: true,
        hasAiTaData: true,
      };
      
    case 'SET_AI_KEY_TAKEAWAYS':
      return {
        ...state,
        aiKeyTakeawaysJson: action.payload,
        hasAiKeyTakeaways: true,
      };
      
    case 'SET_AI_OPTIONS_ANALYSIS':
      return {
        ...state,
        aiOptionsAnalysisJson: action.payload,
        hasAiOptionsAnalysis: true,
      };
      
    case 'SET_OPTIONS_CHAIN_DATA':
      return {
        ...state,
        optionsChainJson: action.payload,
        hasOptionsChainData: true,
      };
      
    case 'SET_AI_KEY_TAKEAWAYS_LOADING':
      return { ...state, isAiKeyTakeawaysLoading: action.payload };
      
    case 'SET_AI_OPTIONS_ANALYSIS_LOADING':
      return { ...state, isAiOptionsAnalysisLoading: action.payload };
      
    case 'SET_DATA_RETRIEVAL_COMPLETE':
      return { ...state, dataRetrievalComplete: action.payload };
      
    case 'SET_CHAT_DEBUG_DATA': {
      const fieldMap: Record<typeof action.payload.type, keyof TickerAnalysisState> = {
        stockTrader: 'stockTraderTakeawaysRawJson',
        optionsTrader: 'optionsTraderTakeawaysRawJson',
        holistic: 'holisticTakeawaysRawJson',
        supportResistance: 'supportResistanceWebSearchRawJson',
        technicalAnalysis: 'technicalAnalysisWebSearchRawJson',
        optionsFlow: 'optionsFlowWebSearchRawJson',
        userInputApp: 'userInputAppDataRawJson',
        userInputWeb: 'userInputWebSearchRawJson',
      };
      
      const field = fieldMap[action.payload.type];
      return { ...state, [field]: action.payload.data };
    }
    
    case 'RESET_STATE':
      return createInitialState({ ticker: state.ticker } as TickerConfig);
      
    default:
      return state;
  }
}

/**
 * Context factory result type
 */
export interface TickerContextResult {
  Provider: React.FC<{ children: ReactNode }>;
  useAnalysis: () => TickerAnalysisState;
  useDispatch: () => React.Dispatch<TickerAnalysisAction>;
}

/**
 * Factory to create ticker-specific contexts
 */
export function createTickerContext(config: TickerConfig): TickerContextResult {
  // Create contexts
  const AnalysisContext = createContext<TickerAnalysisState | undefined>(undefined);
  const DispatchContext = createContext<React.Dispatch<TickerAnalysisAction> | undefined>(undefined);
  
  // Create provider component
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(tickerAnalysisReducer, createInitialState(config));
    
    // Create logger for this ticker
    const logger = useMemo(
      () => createTickerLogger(config.ticker, config.pageName as TickerPage),
      [config.ticker, config.pageName]
    );
    
    // Log state changes in development
    if (process.env.NODE_ENV === 'development') {
      // Use effect-less logging to avoid loops
      const stateStr = `status: ${state.status}, hasData: ${state.hasStockData}`;
      if (state.status === 'error') {
        logger.error('StateUpdate', `State: ${stateStr}`, state.error);
      }
    }
    
    return (
      <AnalysisContext.Provider value={state}>
        <DispatchContext.Provider value={dispatch}>
          {children}
        </DispatchContext.Provider>
      </AnalysisContext.Provider>
    );
  };
  
  // Create hooks
  const useAnalysis = () => {
    const context = useContext(AnalysisContext);
    if (!context) {
      throw new Error(`use${config.contextName} must be used within ${config.contextName}Provider`);
    }
    return context;
  };
  
  const useDispatch = () => {
    const context = useContext(DispatchContext);
    if (!context) {
      throw new Error(`use${config.contextName}Dispatch must be used within ${config.contextName}Provider`);
    }
    return context;
  };
  
  // Set display names for debugging
  Provider.displayName = `${config.contextName}Provider`;
  
  return {
    Provider,
    useAnalysis,
    useDispatch,
  };
}