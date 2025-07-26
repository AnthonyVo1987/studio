'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer } from 'react';

const SPY_TICKER = 'SPY';

interface SpyAnalysisState {
  // Status Management
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  
  // Expiration Management
  availableExpirationDates: string[];
  selectedExpirationDate: string;
  
  // Raw Data (JSON strings from server actions)
  stockSnapshotJson: string;
  marketStatusJson: string;
  keyMetricsJson: string;
  standardTaJson: string;
  aiAnalyzedTaJson: string;
  aiKeyTakeawaysJson: string;
  aiOptionsAnalysisJson: string;
  
  // Data Flags
  hasStockData: boolean;
  hasAiTaData: boolean;
  hasAiKeyTakeaways: boolean;
  hasAiOptionsAnalysis: boolean;
}

type SpyAnalysisAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_IDLE' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_EXPIRATION_DATES'; payload: string[] }
  | { type: 'SET_SELECTED_EXPIRATION'; payload: string }
  | { type: 'SET_STOCK_DATA'; payload: {
      stockSnapshotJson: string;
      marketStatusJson: string;
      keyMetricsJson: string;
      standardTaJson: string;
      aiAnalyzedTaJson: string;
    }}
  | { type: 'SET_AI_KEY_TAKEAWAYS'; payload: string }
  | { type: 'SET_AI_OPTIONS_ANALYSIS'; payload: string }
  | { type: 'RESET_STATE' };

const initialState: SpyAnalysisState = {
  status: 'idle',
  error: null,
  availableExpirationDates: [],
  selectedExpirationDate: '',
  stockSnapshotJson: '',
  marketStatusJson: '',
  keyMetricsJson: '',
  standardTaJson: '',
  aiAnalyzedTaJson: '',
  aiKeyTakeawaysJson: '',
  aiOptionsAnalysisJson: '',
  hasStockData: false,
  hasAiTaData: false,
  hasAiKeyTakeaways: false,
  hasAiOptionsAnalysis: false,
};

function spyAnalysisReducer(state: SpyAnalysisState, action: SpyAnalysisAction): SpyAnalysisState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        status: 'loading',
        error: null,
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

    case 'SET_STOCK_DATA':
      return {
        ...state,
        stockSnapshotJson: action.payload.stockSnapshotJson,
        marketStatusJson: action.payload.marketStatusJson,
        keyMetricsJson: action.payload.keyMetricsJson,
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