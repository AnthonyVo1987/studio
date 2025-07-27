'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer } from 'react';

const SPY_TICKER = 'SPY';

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
  standardTaJson: string;
  aiAnalyzedTaJson: string;
  aiKeyTakeawaysJson: string;
  aiOptionsAnalysisJson: string;
  optionsChainJson: string;
  
  // Data Flags
  hasStockData: boolean;
  hasAiTaData: boolean;
  hasAiKeyTakeaways: boolean;
  hasAiOptionsAnalysis: boolean;
  hasOptionsChainData: boolean;
  
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
      standardTaJson: string;
      aiAnalyzedTaJson: string;
    }}
  | { type: 'SET_OPTIONS_CHAIN_DATA'; payload: string }
  | { type: 'SET_AI_KEY_TAKEAWAYS'; payload: string }
  | { type: 'SET_AI_OPTIONS_ANALYSIS'; payload: string }
  | { type: 'SET_DATA_RETRIEVAL_COMPLETE'; payload: boolean }
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
  standardTaJson: '',
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

function spyAnalysisReducer(state: SpyAnalysisState, action: SpyAnalysisAction): SpyAnalysisState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        status: 'loading',
        error: null,
        dataRetrievalComplete: false,
      };

    case 'SET_IDLE':
      return {
        ...state,
        status: 'idle',
        error: null,
      };

    case 'SET_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
      };

    case 'SET_EXPIRATION_DATES':
      return {
        ...state,
        availableExpirationDates: action.payload,
      };

    case 'SET_SELECTED_EXPIRATION':
      return {
        ...state,
        selectedExpirationDate: action.payload,
      };

    case 'SET_OPTIONS_SETTINGS':
      return {
        ...state,
        ...(action.payload.optionType !== undefined && { optionType: action.payload.optionType }),
        ...(action.payload.strikeCount !== undefined && { strikeCount: action.payload.strikeCount }),
        ...(action.payload.tableDisplayType !== undefined && { tableDisplayType: action.payload.tableDisplayType }),
      };

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

    case 'SET_OPTIONS_CHAIN_DATA':
      return {
        ...state,
        optionsChainJson: action.payload,
        hasOptionsChainData: true,
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

    case 'SET_DATA_RETRIEVAL_COMPLETE':
      return {
        ...state,
        dataRetrievalComplete: action.payload,
      };

    case 'RESET_STATE':
      return initialState;

    default:
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

export { SPY_TICKER };
export type { SpyAnalysisState, SpyAnalysisAction };