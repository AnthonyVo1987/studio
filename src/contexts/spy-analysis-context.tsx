'use client';

/**
 * @fileOverview SPY Analysis Context - Blueprint Implementation
 * 
 * This context serves as a BLUEPRINT for ticker-specific analysis tabs.
 * Architecture Pattern: Isolated Context + useReducer + Custom Hooks
 * 
 * REPLICATION GUIDE for creating new ticker pages (e.g., NVDA):
 * 1. Copy this file: spy-analysis-context.tsx → nvda-analysis-context.tsx
 * 2. Update ticker constant: SPY_TICKER → NVDA_TICKER
 * 3. Rename hooks: useSpyAnalysis → useNvdaAnalysis, useSpyDispatch → useNvdaDispatch
 * 4. Update provider: SpyAnalysisProvider → NvdaAnalysisProvider
 * 5. Update all context names and function names to match new ticker
 * 
 * This pattern ensures complete isolation between ticker-specific tabs.
 */

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer } from 'react';

// Ticker configuration for this specific analysis tab
export const SPY_TICKER = 'SPY';

// Options Chain Settings (matching Main tab pattern)
export type OptionType = 'both' | 'calls' | 'puts';
export type StrikeCount = 20 | 30 | 40;
export type TableDisplayType = 'side-by-side' | 'top-bottom';

interface SpyAnalysisState {
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

type SpyAnalysisAction =
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

const initialState: SpyAnalysisState = {
  status: 'idle',
  error: null,
  availableExpirationDates: [],
  selectedExpirationDate: '',
  optionType: 'both',
  strikeCount: 20,
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

function spyAnalysisReducer(state: SpyAnalysisState, action: SpyAnalysisAction): SpyAnalysisState {
  console.log('[SPY:State] Reducer action:', { type: action.type, previousStatus: state.status });
  
  switch (action.type) {
    case 'SET_LOADING':
      console.log('[SPY:State] FSM transition: -> LOADING');
      return {
        ...state,
        status: 'loading',
        error: null,
        dataRetrievalComplete: false,
      };

    case 'SET_IDLE':
      console.log('[SPY:State] FSM transition: -> IDLE');
      return {
        ...state,
        status: 'idle',
        error: null,
      };

    case 'SET_ERROR':
      console.log('[SPY:State] FSM transition: -> ERROR', { error: action.payload });
      return {
        ...state,
        status: 'error',
        error: action.payload,
      };

    case 'SET_EXPIRATION_DATES':
      console.log('[SPY:State] Setting expiration dates:', { count: action.payload.length });
      return {
        ...state,
        availableExpirationDates: action.payload,
      };

    case 'SET_SELECTED_EXPIRATION':
      console.log('[SPY:State] Setting selected expiration:', { expiration: action.payload });
      return {
        ...state,
        selectedExpirationDate: action.payload,
      };

    case 'SET_OPTIONS_SETTINGS':
      console.log('[SPY:State] Updating options settings:', action.payload);
      return {
        ...state,
        ...(action.payload.optionType !== undefined && { optionType: action.payload.optionType }),
        ...(action.payload.strikeCount !== undefined && { strikeCount: action.payload.strikeCount }),
        ...(action.payload.tableDisplayType !== undefined && { tableDisplayType: action.payload.tableDisplayType }),
      };

    case 'SET_STOCK_DATA':
      console.log('[SPY:State] Setting stock data:', {
        hasSnapshot: !!action.payload.stockSnapshotJson,
        hasMarketStatus: !!action.payload.marketStatusJson,
        hasStandardTA: !!action.payload.standardTasJson,
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
      console.log('[SPY:State] Setting options chain data:', {
        hasData: !!action.payload,
        strikeCount: optionsData.strikes?.length || 0
      });
      return {
        ...state,
        optionsChainJson: action.payload,
        hasOptionsChainData: true,
      };

    case 'SET_AI_KEY_TAKEAWAYS':
      console.log('[SPY:State] Setting AI key takeaways:', { hasData: !!action.payload });
      return {
        ...state,
        aiKeyTakeawaysJson: action.payload,
        hasAiKeyTakeaways: true,
        isAiKeyTakeawaysLoading: false,
      };

    case 'SET_AI_KEY_TAKEAWAYS_LOADING':
      console.log('[SPY:State] Setting AI key takeaways loading:', { loading: action.payload });
      return {
        ...state,
        isAiKeyTakeawaysLoading: action.payload,
      };

    case 'SET_AI_OPTIONS_ANALYSIS':
      console.log('[SPY:State] Setting AI options analysis:', { hasData: !!action.payload });
      return {
        ...state,
        aiOptionsAnalysisJson: action.payload,
        hasAiOptionsAnalysis: true,
        isAiOptionsAnalysisLoading: false,
      };

    case 'SET_AI_OPTIONS_ANALYSIS_LOADING':
      console.log('[SPY:State] Setting AI options analysis loading:', { loading: action.payload });
      return {
        ...state,
        isAiOptionsAnalysisLoading: action.payload,
      };

    case 'SET_DATA_RETRIEVAL_COMPLETE':
      console.log('[SPY:State] Setting data retrieval complete:', { complete: action.payload });
      return {
        ...state,
        dataRetrievalComplete: action.payload,
      };

    case 'SET_AI_CHAT_RAW_DATA':
      const { promptName, responseJson, webSearchEnabled, isUserInput } = action.payload;
      console.log('[SPY:State] Setting AI chat raw data:', { 
        promptName, 
        webSearchEnabled, 
        isUserInput: !!isUserInput,
        hasData: !!responseJson 
      });
      
      // Map prompt names to state fields
      const updates: Partial<SpyAnalysisState> = {};
      
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
            console.warn('[SPY:State] Unknown prompt name for raw data storage:', promptName);
        }
      }
      
      return {
        ...state,
        ...updates,
      };

    case 'RESET_STATE':
      console.log('[SPY:State] Resetting state to initial values');
      return initialState;

    default:
      console.error('[SPY:State] Unknown action type:', action);
      throw new Error(`Unknown action type`);
  }
}

const SpyAnalysisContext = createContext<SpyAnalysisState | null>(null);
const SpyAnalysisDispatchContext = createContext<React.Dispatch<SpyAnalysisAction> | null>(null);

interface SpyAnalysisProviderProps {
  children: ReactNode;
}

export function SpyAnalysisProvider({ children }: SpyAnalysisProviderProps) {
  const [state, dispatch] = useReducer(spyAnalysisReducer, initialState);

  return (
    <SpyAnalysisContext.Provider value={state}>
      <SpyAnalysisDispatchContext.Provider value={dispatch}>
        {children}
      </SpyAnalysisDispatchContext.Provider>
    </SpyAnalysisContext.Provider>
  );
}

export function useSpyAnalysis() {
  const context = useContext(SpyAnalysisContext);
  if (!context) {
    throw new Error('useSpyAnalysis must be used within a SpyAnalysisProvider');
  }
  return context;
}

export function useSpyDispatch() {
  const context = useContext(SpyAnalysisDispatchContext);
  if (!context) {
    throw new Error('useSpyDispatch must be used within a SpyAnalysisProvider');
  }
  return context;
}

export type { SpyAnalysisState, SpyAnalysisAction };

// Default export for dynamic imports
export default SpyAnalysisProvider;