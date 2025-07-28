'use client';

/**
 * @fileOverview User Input Ticker Analysis Context - Dynamic Ticker Implementation
 * 
 * This context manages state for user-input ticker analysis tab.
 * Unlike SPY/NVDA tabs which have fixed tickers, this tab allows users
 * to input any ticker symbol for analysis.
 * 
 * Architecture Pattern: Isolated Context + useReducer + Custom Hooks + Dynamic Ticker
 * Created from the SPY blueprint architecture which scored 9.8/10
 */

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer } from 'react';
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// Default ticker for initial state
const DEFAULT_TICKER = '';

// Options Chain Settings (matching SPY/NVDA pattern)
export type OptionType = 'both' | 'calls' | 'puts';
export type StrikeCount = 20 | 30 | 40;
export type TableDisplayType = 'side-by-side' | 'top-bottom';

interface UserTickerAnalysisState {
  // Ticker Management (unique to User Input tab)
  currentTicker: string;
  isTickerValid: boolean;
  tickerValidationError: string | null;
  
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

type UserTickerAnalysisAction =
  | { type: 'SET_CURRENT_TICKER'; payload: { ticker: string; isValid: boolean; error?: string } }
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
  | { type: 'RESET_STATE' }
  | { type: 'CLEAR_TICKER_DATA' }; // Clear data when ticker changes

const initialState: UserTickerAnalysisState = {
  currentTicker: DEFAULT_TICKER,
  isTickerValid: false,
  tickerValidationError: null,
  status: 'idle',
  error: null,
  availableExpirationDates: [],
  selectedExpirationDate: '',
  optionType: 'both',
  strikeCount: 30, // Default to 30 strikes
  tableDisplayType: 'side-by-side',
  stockSnapshotJson: '',
  marketStatusJson: '',
  standardTasJson: '',
  aiAnalyzedTaJson: '',
  aiKeyTakeawaysJson: '',
  aiOptionsAnalysisJson: '',
  optionsChainJson: '',
  
  // Initialize AI Chat Raw Debug Data
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

function userTickerAnalysisReducer(state: UserTickerAnalysisState, action: UserTickerAnalysisAction): UserTickerAnalysisState {
  // Create dynamic logger based on current ticker
  const ticker = action.type === 'SET_CURRENT_TICKER' ? action.payload.ticker : state.currentTicker;
  const logger = createTickerLogger(ticker || 'USER', TICKER_PAGES.USER_INPUT_TAB);
  
  logger.state('Reducer', 'Action dispatched', { type: action.type, currentTicker: ticker });
  
  switch (action.type) {
    case 'SET_CURRENT_TICKER':
      logger.userAction('TickerChange', 'Setting current ticker', {
        from: state.currentTicker,
        to: action.payload.ticker,
        isValid: action.payload.isValid
      });
      return {
        ...state,
        currentTicker: action.payload.ticker,
        isTickerValid: action.payload.isValid,
        tickerValidationError: action.payload.error || null,
        // Clear existing data when ticker changes
        availableExpirationDates: [],
        selectedExpirationDate: '',
        stockSnapshotJson: '',
        marketStatusJson: '',
        standardTasJson: '',
        aiAnalyzedTaJson: '',
        aiKeyTakeawaysJson: '',
        aiOptionsAnalysisJson: '',
        optionsChainJson: '',
        hasStockData: false,
        hasAiTaData: false,
        hasAiKeyTakeaways: false,
        hasAiOptionsAnalysis: false,
        hasOptionsChainData: false,
        dataRetrievalComplete: false,
      };

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
      logger.state('ExpirationDates', 'Setting expiration dates', { count: action.payload.length });
      return {
        ...state,
        availableExpirationDates: action.payload,
      };

    case 'SET_SELECTED_EXPIRATION':
      logger.state('ExpirationSelection', 'Setting selected expiration', { expiration: action.payload });
      return {
        ...state,
        selectedExpirationDate: action.payload,
      };

    case 'SET_OPTIONS_SETTINGS':
      logger.state('OptionsSettings', 'Updating options settings', action.payload);
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
        hasStandardTA: !!action.payload.standardTaJson,
        hasAITA: !!action.payload.aiAnalyzedTaJson
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

    case 'SET_OPTIONS_CHAIN_DATA':
      const optionsData = action.payload ? (() => {
        try {
          return JSON.parse(action.payload);
        } catch {
          return {};
        }
      })() : {};
      logger.state('OptionsChain', 'Setting options chain data', {
        hasData: !!action.payload,
        strikeCount: optionsData.strikes?.length || 0
      });
      return {
        ...state,
        optionsChainJson: action.payload,
        hasOptionsChainData: true,
      };

    case 'SET_AI_KEY_TAKEAWAYS':
      logger.state('AIKeyTakeaways', 'Setting AI key takeaways', { hasData: !!action.payload });
      return {
        ...state,
        aiKeyTakeawaysJson: action.payload,
        hasAiKeyTakeaways: true,
        isAiKeyTakeawaysLoading: false,
      };

    case 'SET_AI_KEY_TAKEAWAYS_LOADING':
      logger.state('AIKeyTakeaways', 'Setting loading state', { loading: action.payload });
      return {
        ...state,
        isAiKeyTakeawaysLoading: action.payload,
      };

    case 'SET_AI_OPTIONS_ANALYSIS':
      logger.state('AIOptionsAnalysis', 'Setting AI options analysis', { hasData: !!action.payload });
      return {
        ...state,
        aiOptionsAnalysisJson: action.payload,
        hasAiOptionsAnalysis: true,
        isAiOptionsAnalysisLoading: false,
      };

    case 'SET_AI_OPTIONS_ANALYSIS_LOADING':
      logger.state('AIOptionsAnalysis', 'Setting loading state', { loading: action.payload });
      return {
        ...state,
        isAiOptionsAnalysisLoading: action.payload,
      };

    case 'SET_DATA_RETRIEVAL_COMPLETE':
      logger.state('DataRetrieval', 'Setting data retrieval complete', { complete: action.payload });
      return {
        ...state,
        dataRetrievalComplete: action.payload,
      };

    case 'SET_AI_CHAT_RAW_DATA':
      const { promptName, responseJson, webSearchEnabled, isUserInput } = action.payload;
      logger.state('AIChatData', 'Setting AI chat raw data', { 
        promptName, 
        webSearchEnabled, 
        isUserInput: !!isUserInput,
        hasData: !!responseJson 
      });
      
      // Map prompt names to state fields
      const updates: Partial<UserTickerAnalysisState> = {};
      
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

    case 'CLEAR_TICKER_DATA':
      logger.state('ClearData', 'Clearing ticker-specific data');
      return {
        ...state,
        availableExpirationDates: [],
        selectedExpirationDate: '',
        stockSnapshotJson: '',
        marketStatusJson: '',
        standardTasJson: '',
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
        dataRetrievalComplete: false,
        error: null,
      };

    case 'RESET_STATE':
      logger.state('Reset', 'Resetting state to initial values');
      return initialState;

    default:
      logger.error('Reducer', 'Unknown action type', action);
      throw new Error(`Unknown action type`);
  }
}

const UserTickerAnalysisContext = createContext<UserTickerAnalysisState | null>(null);
const UserTickerAnalysisDispatchContext = createContext<React.Dispatch<UserTickerAnalysisAction> | null>(null);

interface UserTickerAnalysisProviderProps {
  children: ReactNode;
}

export function UserTickerAnalysisProvider({ children }: UserTickerAnalysisProviderProps) {
  const [state, dispatch] = useReducer(userTickerAnalysisReducer, initialState);

  return (
    <UserTickerAnalysisContext.Provider value={state}>
      <UserTickerAnalysisDispatchContext.Provider value={dispatch}>
        {children}
      </UserTickerAnalysisDispatchContext.Provider>
    </UserTickerAnalysisContext.Provider>
  );
}

export function useUserTickerAnalysis() {
  const context = useContext(UserTickerAnalysisContext);
  if (!context) {
    throw new Error('useUserTickerAnalysis must be used within a UserTickerAnalysisProvider');
  }
  return context;
}

export function useUserTickerDispatch() {
  const context = useContext(UserTickerAnalysisDispatchContext);
  if (!context) {
    throw new Error('useUserTickerDispatch must be used within a UserTickerAnalysisProvider');
  }
  return context;
}

// Helper function to validate ticker symbols
export function validateTicker(ticker: string): { isValid: boolean; error?: string } {
  const trimmedTicker = ticker.trim().toUpperCase();
  
  if (!trimmedTicker) {
    return { isValid: false, error: 'Ticker symbol is required' };
  }
  
  if (trimmedTicker.length < 1 || trimmedTicker.length > 10) {
    return { isValid: false, error: 'Ticker symbol must be 1-10 characters' };
  }
  
  if (!/^[A-Z0-9.-]+$/.test(trimmedTicker)) {
    return { isValid: false, error: 'Ticker symbol can only contain letters, numbers, periods, and hyphens' };
  }
  
  return { isValid: true };
}

export type { UserTickerAnalysisState, UserTickerAnalysisAction };