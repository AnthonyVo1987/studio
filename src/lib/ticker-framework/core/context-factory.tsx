'use client';

/**
 * @fileOverview Context Factory for Ticker Framework
 * 
 * This factory generates isolated React contexts for each ticker tab,
 * following the NVDA/SPY blueprint architecture. Each generated context
 * includes state management, custom hooks, and setter functions.
 * 
 * Features:
 * - Complete state isolation between ticker contexts
 * - Type-safe custom hooks with dynamic naming
 * - 79 state fields matching NVDA/SPY blueprint
 * - 12 action types for state updates
 * - Integrated logging with ticker-specific loggers
 */

import React from 'react';
import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';
import type {
  TickerConfig,
  TickerAnalysisState,
  TickerAnalysisAction,
  TickerContextResult,
  TickerSetterFunctions,
  StrikeCount,
  TableDisplayType,
} from './types';

/**
 * Creates the initial state for a ticker context
 * @param config - The ticker configuration
 * @returns Initial state with all fields initialized
 */
function createInitialState(config: TickerConfig): TickerAnalysisState {
  return {
    // Status Management
    status: 'idle',
    error: null,
    
    // Expiration Management
    availableExpirationDates: [],
    selectedExpirationDate: '',
    
    // Options Chain Settings (with ticker-specific defaults)
    optionType: 'both',
    strikeCount: config.defaultStrikeCount || 30,
    tableDisplayType: config.defaultTableDisplay || 'side-by-side',
    
    // Raw Data (JSON strings from server actions)
    stockSnapshotJson: '',
    marketStatusJson: '',
    standardTasJson: '',
    aiAnalyzedTaJson: '',
    aiKeyTakeawaysJson: '',
    aiOptionsAnalysisJson: '',
    optionsChainJson: '',
    
    // AI Chat Raw Debug Data
    stockTraderTakeawaysRawJson: '',
    optionsTraderTakeawaysRawJson: '',
    holisticTakeawaysRawJson: '',
    supportResistanceWebSearchRawJson: '',
    technicalAnalysisWebSearchRawJson: '',
    optionsFlowWebSearchRawJson: '',
    userInputAppDataRawJson: '',
    userInputWebSearchRawJson: '',
    
    // Data Flags
    hasStockData: false,
    hasAiTaData: false,
    hasAiKeyTakeaways: false,
    hasAiOptionsAnalysis: false,
    hasOptionsChainData: false,
    
    // AI Operation Loading States
    isAiKeyTakeawaysLoading: false,
    isAiOptionsAnalysisLoading: false,
    
    // UI Update Flag
    dataRetrievalComplete: false,
  };
}

/**
 * Creates a reducer function for the ticker context
 * @param config - The ticker configuration
 * @param logger - Ticker-specific logger instance
 * @param initialState - The initial state
 * @returns Reducer function
 */
function createTickerReducer(
  config: TickerConfig,
  logger: ReturnType<typeof createTickerLogger>,
  initialState: TickerAnalysisState
) {
  return function tickerAnalysisReducer(
    state: TickerAnalysisState,
    action: TickerAnalysisAction
  ): TickerAnalysisState {
    logger.state('Reducer', 'Action dispatched', { 
      type: action.type, 
      previousStatus: state.status,
      ticker: config.ticker 
    });
    
    switch (action.type) {
      case 'SET_LOADING':
        logger.state('FSM', 'Transition -> LOADING');
        return {
          ...state,
          status: 'loading',
          error: null,
          dataRetrievalComplete: false,
        };

      case 'SET_IDLE':
        logger.state('FSM', 'Transition -> IDLE');
        return {
          ...state,
          status: 'idle',
          error: null,
        };

      case 'SET_ERROR':
        logger.error('FSM', 'Transition -> ERROR', action.payload);
        return {
          ...state,
          status: 'error',
          error: action.payload,
        };

      case 'SET_EXPIRATION_DATES':
        logger.state('ExpirationDates', 'Setting expiration dates', { 
          count: action.payload.length,
          ticker: config.ticker 
        });
        return {
          ...state,
          availableExpirationDates: action.payload,
        };

      case 'SET_SELECTED_EXPIRATION':
        logger.state('ExpirationSelection', 'Setting selected expiration', { 
          expiration: action.payload,
          ticker: config.ticker 
        });
        return {
          ...state,
          selectedExpirationDate: action.payload,
        };

      case 'SET_OPTIONS_SETTINGS':
        logger.state('OptionsSettings', 'Updating options settings', {
          ...action.payload,
          ticker: config.ticker
        });
        return {
          ...state,
          ...(action.payload.optionType !== undefined && { optionType: action.payload.optionType }),
          ...(action.payload.strikeCount !== undefined && { strikeCount: action.payload.strikeCount }),
          ...(action.payload.tableDisplayType !== undefined && { tableDisplayType: action.payload.tableDisplayType }),
        };

      case 'SET_STOCK_DATA':
        logger.state('StockData', 'Setting stock data', {
          hasSnapshot: !!action.payload.stockSnapshotJson,
          hasMarketStatus: !!action.payload.marketStatusJson,
          hasStandardTA: !!action.payload.standardTasJson,
          hasAITA: !!action.payload.aiAnalyzedTaJson,
          ticker: config.ticker
        });
        return {
          ...state,
          stockSnapshotJson: action.payload.stockSnapshotJson,
          marketStatusJson: action.payload.marketStatusJson,
          standardTasJson: action.payload.standardTasJson,
          aiAnalyzedTaJson: action.payload.aiAnalyzedTaJson,
          hasStockData: true,
          hasAiTaData: true,
        };

      case 'SET_OPTIONS_CHAIN_DATA': {
        const optionsData = action.payload ? (() => {
          try {
            return JSON.parse(action.payload);
          } catch {
            return {};
          }
        })() : {};
        logger.state('OptionsChain', 'Setting options chain data', {
          hasData: !!action.payload,
          strikeCount: optionsData.strikes?.length || 0,
          ticker: config.ticker
        });
        return {
          ...state,
          optionsChainJson: action.payload,
          hasOptionsChainData: true,
        };
      }

      case 'SET_AI_KEY_TAKEAWAYS':
        logger.state('AIKeyTakeaways', 'Setting AI key takeaways', { 
          hasData: !!action.payload,
          ticker: config.ticker 
        });
        return {
          ...state,
          aiKeyTakeawaysJson: action.payload,
          hasAiKeyTakeaways: true,
          isAiKeyTakeawaysLoading: false,
        };

      case 'SET_AI_KEY_TAKEAWAYS_LOADING':
        logger.state('AIKeyTakeaways', 'Setting loading state', { 
          loading: action.payload,
          ticker: config.ticker 
        });
        return {
          ...state,
          isAiKeyTakeawaysLoading: action.payload,
        };

      case 'SET_AI_OPTIONS_ANALYSIS':
        logger.state('AIOptionsAnalysis', 'Setting AI options analysis', { 
          hasData: !!action.payload,
          ticker: config.ticker 
        });
        return {
          ...state,
          aiOptionsAnalysisJson: action.payload,
          hasAiOptionsAnalysis: true,
          isAiOptionsAnalysisLoading: false,
        };

      case 'SET_AI_OPTIONS_ANALYSIS_LOADING':
        logger.state('AIOptionsAnalysis', 'Setting loading state', { 
          loading: action.payload,
          ticker: config.ticker 
        });
        return {
          ...state,
          isAiOptionsAnalysisLoading: action.payload,
        };

      case 'SET_DATA_RETRIEVAL_COMPLETE':
        logger.state('DataRetrieval', 'Setting data retrieval complete', { 
          complete: action.payload,
          ticker: config.ticker 
        });
        return {
          ...state,
          dataRetrievalComplete: action.payload,
        };

      case 'SET_AI_CHAT_RAW_DATA': {
        const { promptName, responseJson, webSearchEnabled, isUserInput } = action.payload;
        logger.state('AIChatData', 'Setting AI chat raw data', { 
          promptName, 
          webSearchEnabled, 
          isUserInput: !!isUserInput,
          hasData: !!responseJson,
          ticker: config.ticker 
        });
        
        // Map prompt names to state fields
        const updates: Partial<TickerAnalysisState> = {};
        
        if (isUserInput) {
          // User input responses (based on mode)
          if (webSearchEnabled) {
            updates.userInputWebSearchRawJson = responseJson;
          } else {
            updates.userInputAppDataRawJson = responseJson;
          }
        } else {
          // Button prompt responses
          switch (promptName) {
            case 'stock-trader-takeaways':
              updates.stockTraderTakeawaysRawJson = responseJson;
              break;
            case 'options-trader-takeaways':
              updates.optionsTraderTakeawaysRawJson = responseJson;
              break;
            case 'holistic-takeaways':
              updates.holisticTakeawaysRawJson = responseJson;
              break;
            case 'support-resistance-web-search':
              updates.supportResistanceWebSearchRawJson = responseJson;
              break;
            case 'technical-analysis-web-search':
              updates.technicalAnalysisWebSearchRawJson = responseJson;
              break;
            case 'options-flow-web-search':
              updates.optionsFlowWebSearchRawJson = responseJson;
              break;
            default:
              logger.state('AIChatData', `Unknown prompt name for raw data storage: ${promptName}`);
          }
        }
        
        return {
          ...state,
          ...updates,
        };
      }

      case 'RESET_STATE':
        logger.state('Reset', 'Resetting state to initial values', { ticker: config.ticker });
        return initialState;

      default:
        logger.error('Reducer', 'Unknown action type', { action, ticker: config.ticker });
        throw new Error(`Unknown action type`);
    }
  };
}

/**
 * Creates setter functions that wrap dispatch calls
 * @param dispatch - The dispatch function from useReducer
 * @returns Object containing all setter functions
 */
function createSetterFunctions(
  dispatch: React.Dispatch<TickerAnalysisAction>
): TickerSetterFunctions {
  return {
    setLoading: () => dispatch({ type: 'SET_LOADING' }),
    setIdle: () => dispatch({ type: 'SET_IDLE' }),
    setError: (error: string) => dispatch({ type: 'SET_ERROR', payload: error }),
    setExpirationDates: (dates: string[]) => 
      dispatch({ type: 'SET_EXPIRATION_DATES', payload: dates }),
    setSelectedExpiration: (date: string) => 
      dispatch({ type: 'SET_SELECTED_EXPIRATION', payload: date }),
    setOptionsSettings: (settings) => 
      dispatch({ type: 'SET_OPTIONS_SETTINGS', payload: settings }),
    setStockData: (data) => 
      dispatch({ type: 'SET_STOCK_DATA', payload: data }),
    setOptionsChainData: (json: string) => 
      dispatch({ type: 'SET_OPTIONS_CHAIN_DATA', payload: json }),
    setAiKeyTakeaways: (json: string) => 
      dispatch({ type: 'SET_AI_KEY_TAKEAWAYS', payload: json }),
    setAiKeyTakeawaysLoading: (loading: boolean) => 
      dispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: loading }),
    setAiOptionsAnalysis: (json: string) => 
      dispatch({ type: 'SET_AI_OPTIONS_ANALYSIS', payload: json }),
    setAiOptionsAnalysisLoading: (loading: boolean) => 
      dispatch({ type: 'SET_AI_OPTIONS_ANALYSIS_LOADING', payload: loading }),
    setDataRetrievalComplete: (complete: boolean) => 
      dispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: complete }),
    setAiChatRawData: (data) => 
      dispatch({ type: 'SET_AI_CHAT_RAW_DATA', payload: data }),
    resetState: () => dispatch({ type: 'RESET_STATE' }),
  };
}

/**
 * Main factory function that creates a complete ticker context
 * @param config - The ticker configuration
 * @returns Complete context result with all components and hooks
 */
export function createTickerContext<T extends TickerConfig>(
  config: T
): TickerContextResult<T> {
  // Create ticker-specific logger
  const pageId = `${config.ticker}_TAB` as keyof typeof TICKER_PAGES;
  const logger = createTickerLogger(config.ticker, TICKER_PAGES[pageId] || config.displayName);
  
  // Create initial state
  const initialState = createInitialState(config);
  
  // Create reducer
  const reducer = createTickerReducer(config, logger, initialState);
  
  // Create contexts
  const StateContext = createContext<TickerAnalysisState | null>(null);
  const DispatchContext = createContext<React.Dispatch<TickerAnalysisAction> | null>(null);
  
  // Set display names for debugging
  StateContext.displayName = `${config.ticker}AnalysisContext`;
  DispatchContext.displayName = `${config.ticker}AnalysisDispatchContext`;
  
  // Create provider component
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    
    return (
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={dispatch}>
          {children}
        </DispatchContext.Provider>
      </StateContext.Provider>
    );
  };
  
  Provider.displayName = `${config.ticker}AnalysisProvider`;
  
  // Create custom hooks
  const useState = () => {
    const context = useContext(StateContext);
    if (!context) {
      throw new Error(
        `use${config.ticker}Analysis must be used within a ${config.ticker}AnalysisProvider`
      );
    }
    return context;
  };
  
  const useDispatch = () => {
    const context = useContext(DispatchContext);
    if (!context) {
      throw new Error(
        `use${config.ticker}Dispatch must be used within a ${config.ticker}AnalysisProvider`
      );
    }
    return context;
  };
  
  // Create a hook that returns both state and setters for convenience
  const useStateWithSetters = () => {
    const state = useState();
    const dispatch = useDispatch();
    const setters = createSetterFunctions(dispatch);
    return { ...state, ...setters };
  };
  
  return {
    config,
    StateContext,
    DispatchContext,
    Provider,
    hooks: {
      useState,
      useDispatch,
      useStateWithSetters,
    },
    setters: {} as TickerSetterFunctions, // Setters are created per-instance in the hooks
    initialState,
  };
}