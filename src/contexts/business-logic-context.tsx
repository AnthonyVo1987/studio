
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useReducer, useRef, useMemo } from 'react';
import type { StockDataFetchResult, AnalyzeStockServerActionState } from '@/actions/analyze-stock-server-action';
import type { AnalyzeTaResult, AnalyzeTaActionState } from '@/actions/analyze-ta-action';
import type { PerformAiAnalysisResult, PerformAiAnalysisActionState } from '@/actions/perform-ai-analysis-action';
import type { PerformAiOptionsAnalysisResult, PerformAiOptionsAnalysisActionState } from '@/actions/perform-ai-options-analysis-action';
import { startTransition } from 'react';
import { getExpirationDates } from '@/services/data-sources/adapters/polygon-adapter';
import { findNextAvailableDate } from '@/lib/date-utils';
import { createSetterBatch } from './context-setter-factory';


// Business Logic FSM States - Minimal for on-demand architecture (v4.0.0.4)
export enum BusinessFsmState {
  APP_INITIALIZING = 'APP_INITIALIZING',
  IDLE = 'IDLE',
  LOADING = 'LOADING', // Generic loading state for any on-demand operation
}

// Business domain types (moved from UI context)
export type OptionType = 'both' | 'calls' | 'puts';
export type StrikeCount = 20 | 30 | 40;
export type TableDisplayType = 'side-by-side' | 'top-bottom';

// Legacy export for backwards compatibility (will be phased out)
export const GlobalFsmState = BusinessFsmState;

// Business Logic Variables - Core business state
export interface BusinessContextVariables {
  activeTicker: string | null;
  userInputTicker: string;
  lastError: { message: string; source: string; details?: any } | null;
}

// Business Logic Flags - Simple boolean flags for on-demand architecture (v4.0.0.4)
export interface BusinessFlags {
  canGetStockData: boolean;
  hasStockData: boolean;
  hasMarketData: boolean;
  hasOptionsData: boolean;
  hasAiTaData: boolean;
  hasAiKeyTakeaways: boolean;
  hasAiOptionsAnalysis: boolean;
}

// Business FSM State Container
interface BusinessFsmReducerManagedState {
  current: BusinessFsmState;
  previous: BusinessFsmState | null;
  variables: BusinessContextVariables;
  flags: BusinessFlags;
}

// Legacy exports for backwards compatibility (will be phased out)
export type GlobalFsmContextVariables = BusinessContextVariables;
export type GlobalFsmFlags = BusinessFlags;

export type FsmDisplayTuple = {
  previous: string | null;
  current: string;
  target: string | null;
};

interface StaleDataFromActionPayload { error: string; message: string; expectedTicker: string; foundTickerInSnapshot?: string; actionStateData?: StockDataFetchResult; }

export type FsmEvent =
  | { type: 'INITIALIZATION_COMPLETE' }
  | { type: 'USER_INPUT_TICKER_CHANGED'; payload: { ticker: string } }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'SET_ERROR'; payload: { error: string; source: string } }
  | { type: 'CLEAR_ERROR' };

export interface AppDataChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

// Pure Business Data State - Only core business data, no UI concerns
interface BusinessDataState {
  // API request/response logs
  polygonApiRequestLogJson: string;
  polygonApiResponseLogJson: string;
  
  // Core market data
  marketStatusJson: string;
  stockSnapshotJson: string;
  standardTasJson: string;
  optionsChainJson: string;
  
  // AI analysis data
  aiAnalyzedTaRequestJson: string;
  aiAnalyzedTaJson: string;
  aiOptionsAnalysisRequestJson: string;
  aiOptionsAnalysisJson: string;
  aiKeyTakeawaysRequestJson: string;
  aiKeyTakeawaysJson: string;
  
  // Chat and analysis histories
  userInputAppDataChatRequestJson: string;
  userInputAppDataChatResponseJson: string;
  stockTraderTakeawaysRequestJson: string;
  stockTraderTakeawaysResponseJson: string;
  optionsTraderTakeawaysRequestJson: string;
  optionsTraderTakeawaysResponseJson: string;
  holisticTakeawaysRequestJson: string;
  holisticTakeawaysResponseJson: string;
  appDataChatHistory: AppDataChatMessage[];
  
  // Web search data
  userInputWebSearchChatRequestJson: string;
  userInputWebSearchChatResponseJson: string;
  rawTaWebSearchRequestJson: string;
  rawTaWebSearchResponseJson: string;
  rawOptionsWebSearchRequestJson: string;
  rawOptionsWebSearchResponseJson: string;
  rawSupportResistanceWebSearchRequestJson: string;
  rawSupportResistanceWebSearchResponseJson: string;
  webSearchChatHistory: AppDataChatMessage[];
  
  // Business FSM state
  businessFsmState: BusinessFsmReducerManagedState;
  
  // Business options configuration (not UI presentation)
  availableExpirationDates: string[];
  selectedExpirationDate: string | undefined;
  isLoadingExpirations: boolean;
  
  // UI Display states (these will be moved to UI context eventually)
  targetFsmDisplayState: BusinessFsmState | null;
  mainTabFsmDisplay: FsmDisplayTuple | null;
  chatbotFsmDisplay: FsmDisplayTuple | null;
  debugConsoleMenuFsmDisplay: FsmDisplayTuple | null;
}

// Legacy interface for backwards compatibility
interface StockAnalysisState extends BusinessDataState {
  globalFsmState: BusinessFsmReducerManagedState;
  optionType: OptionType;
  strikeCount: StrikeCount;
  tableDisplayType: TableDisplayType;
}

// Business Context Setters - Only for business data
interface BusinessContextSetters {
  setPolygonApiRequestLogJson: (json: string) => void;
  setPolygonApiResponseLogJson: (json: string) => void;
  setMarketStatusJson: (json: string) => void;
  setStockSnapshotJson: (json: string) => void;
  setStandardTasJson: (json: string) => void;
  setOptionsChainJson: (json: string) => void;
  setAiAnalyzedTaRequestJson: (json: string) => void;
  setAiAnalyzedTaJson: (json: string) => void;
  setAiOptionsAnalysisRequestJson: (json: string) => void;
  setAiOptionsAnalysisJson: (json: string) => void;
  setAiKeyTakeawaysRequestJson: (json: string) => void;
  setAiKeyTakeawaysJson: (json: string) => void;
  setUserInputAppDataChatRequestJson: (json: string) => void;
  setUserInputAppDataChatResponseJson: (json: string) => void;
  setStockTraderTakeawaysRequestJson: (json: string) => void;
  setStockTraderTakeawaysResponseJson: (json: string) => void;
  setOptionsTraderTakeawaysRequestJson: (json: string) => void;
  setOptionsTraderTakeawaysResponseJson: (json: string) => void;
  setHolisticTakeawaysRequestJson: (json: string) => void;
  setHolisticTakeawaysResponseJson: (json: string) => void;
  setUserInputWebSearchChatRequestJson: (json: string) => void;
  setUserInputWebSearchChatResponseJson: (json: string) => void;
  setRawTaWebSearchRequestJson: (json: string) => void;
  setRawTaWebSearchResponseJson: (json: string) => void;
  setRawOptionsWebSearchRequestJson: (json: string) => void;
  setRawOptionsWebSearchResponseJson: (json: string) => void;
  setRawSupportResistanceWebSearchRequestJson: (json: string) => void;
  setRawSupportResistanceWebSearchResponseJson: (json: string) => void;
  // Business options configuration setters
  setAvailableExpirationDates: (dates: string[]) => void;
  setSelectedExpirationDate: (date: string | undefined) => void;
  setIsLoadingExpirations: (loading: boolean) => void;
}

// Main Business Logic Context Type
interface BusinessLogicContextType extends BusinessDataState, BusinessContextSetters {
  // Core FSM state and control
  fsmState: BusinessFsmState;
  previousFsmState: BusinessFsmState | null;
  fsmVariables: BusinessContextVariables;
  fsmFlags: BusinessFlags;
  dispatchFsmEvent: (event: FsmEvent) => void;
  
  // On-demand operation helpers
  setActiveTicker: (ticker: string) => void;
  setLoadingState: (isLoading: boolean) => void;
  setErrorState: (error: string, source: string) => void;
  clearError: () => void;
  
  // Chat management
  addAppDataChatMessage: (message: AppDataChatMessage) => void;
  clearAppDataChatHistory: () => void;
  addWebSearchChatMessage: (message: AppDataChatMessage) => void;
  clearWebSearchChatHistory: () => void;
  
  // UI Display management (will be moved to UI context eventually)
  setMainTabFsmDisplay: (display: FsmDisplayTuple | null) => void;
  setChatbotFsmDisplay: (display: FsmDisplayTuple | null) => void;
}

// Legacy context interface for backwards compatibility
interface StockAnalysisContextSetters extends BusinessContextSetters {
  setOptionType: (type: OptionType) => void;
  setStrikeCount: (count: StrikeCount) => void;
  setTableDisplayType: (type: TableDisplayType) => void;
}

interface StockAnalysisContextType extends Omit<StockAnalysisState, 'globalFsmState' | 'businessFsmState'>, StockAnalysisContextSetters {
  fsmState: BusinessFsmState;
  previousFsmState: BusinessFsmState | null;
  fsmVariables: BusinessContextVariables;
  fsmFlags: BusinessFlags;
  addAppDataChatMessage: (message: AppDataChatMessage) => void;
  clearAppDataChatHistory: () => void;
  addWebSearchChatMessage: (message: AppDataChatMessage) => void;
  clearWebSearchChatHistory: () => void;
  dispatchFsmEvent: (event: FsmEvent) => void;
  setMainTabFsmDisplay: (display: FsmDisplayTuple | null) => void;
  setChatbotFsmDisplay: (display: FsmDisplayTuple | null) => void;
  // On-demand operation helpers
  setActiveTicker: (ticker: string) => void;
  setLoadingState: (isLoading: boolean) => void;
  setErrorState: (error: string, source: string) => void;
  clearError: () => void;
  // Data availability flag setters (anti-pattern fix)
  markStockDataReady: () => void;
  markAiTaDataReady: () => void;
  markAiKeyTakeawaysReady: () => void;
  markAiOptionsAnalysisReady: () => void;
}

const initialJsonPlaceholder = '{ "status": "no_analysis_run_yet" }';
const pendingJson = '{ "status": "pending..." }';

// Business FSM Initial State
const initialBusinessFsmState: BusinessFsmReducerManagedState = {
  current: BusinessFsmState.APP_INITIALIZING,
  previous: null,
  variables: {
    activeTicker: null,
    userInputTicker: "NVDA", 
    lastError: null,
  },
  flags: {
    canGetStockData: false,
    hasStockData: false,
    hasMarketData: false,
    hasOptionsData: false,
    hasAiTaData: false,
    hasAiKeyTakeaways: false,
    hasAiOptionsAnalysis: false,
  },
};

const initialFsmDisplayTuple: FsmDisplayTuple = { previous: null, current: 'N/A', target: null };

// Business Data Default State
const defaultBusinessState: BusinessDataState = {
  // API logs
  polygonApiRequestLogJson: initialJsonPlaceholder,
  polygonApiResponseLogJson: initialJsonPlaceholder,
  
  // Core market data
  marketStatusJson: initialJsonPlaceholder,
  stockSnapshotJson: initialJsonPlaceholder,
  standardTasJson: initialJsonPlaceholder,
  optionsChainJson: initialJsonPlaceholder,
  
  // AI analysis data
  aiAnalyzedTaRequestJson: initialJsonPlaceholder,
  aiAnalyzedTaJson: initialJsonPlaceholder,
  aiOptionsAnalysisRequestJson: initialJsonPlaceholder,
  aiOptionsAnalysisJson: initialJsonPlaceholder,
  aiKeyTakeawaysRequestJson: initialJsonPlaceholder,
  aiKeyTakeawaysJson: initialJsonPlaceholder,
  
  // Chat and analysis data
  userInputAppDataChatRequestJson: initialJsonPlaceholder,
  userInputAppDataChatResponseJson: initialJsonPlaceholder,
  stockTraderTakeawaysRequestJson: initialJsonPlaceholder,
  stockTraderTakeawaysResponseJson: initialJsonPlaceholder,
  optionsTraderTakeawaysRequestJson: initialJsonPlaceholder,
  optionsTraderTakeawaysResponseJson: initialJsonPlaceholder,
  holisticTakeawaysRequestJson: initialJsonPlaceholder,
  holisticTakeawaysResponseJson: initialJsonPlaceholder,
  appDataChatHistory: [],
  
  // Web search data
  userInputWebSearchChatRequestJson: initialJsonPlaceholder,
  userInputWebSearchChatResponseJson: initialJsonPlaceholder,
  rawTaWebSearchRequestJson: initialJsonPlaceholder,
  rawTaWebSearchResponseJson: initialJsonPlaceholder,
  rawOptionsWebSearchRequestJson: initialJsonPlaceholder,
  rawOptionsWebSearchResponseJson: initialJsonPlaceholder,
  rawSupportResistanceWebSearchRequestJson: initialJsonPlaceholder,
  rawSupportResistanceWebSearchResponseJson: initialJsonPlaceholder,
  webSearchChatHistory: [],
  
  // Business FSM state
  businessFsmState: initialBusinessFsmState,
  
  // Options configuration (business domain)
  availableExpirationDates: [],
  selectedExpirationDate: undefined,
  isLoadingExpirations: false,
  
  // UI Display states (will be moved eventually)
  targetFsmDisplayState: null,
  mainTabFsmDisplay: { ...initialFsmDisplayTuple, current: BusinessFsmState.IDLE.toString() },
  chatbotFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
  debugConsoleMenuFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
};

// Legacy default state for backwards compatibility
const defaultState: StockAnalysisState = {
  ...defaultBusinessState,
  globalFsmState: initialBusinessFsmState,
  optionType: 'both',
  strikeCount: 20,
  tableDisplayType: 'side-by-side',
};

const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

let chatMessageIdCounter = 0;

// New Business Logic Provider
export function BusinessLogicProvider({ children }: { children: ReactNode }) {

  const [_polygonApiRequestLogJson, _setPolygonApiRequestLogJson] = useState<string>(defaultState.polygonApiRequestLogJson);
  const [_polygonApiResponseLogJson, _setPolygonApiResponseLogJson] = useState<string>(defaultState.polygonApiResponseLogJson);
  const [_marketStatusJson, _setMarketStatusJson] = useState<string>(defaultState.marketStatusJson);
  const [_stockSnapshotJson, _setStockSnapshotJson] = useState<string>(defaultState.stockSnapshotJson);
  const [_standardTasJson, _setStandardTasJson] = useState<string>(defaultState.standardTasJson);
  const [_optionsChainJson, _setOptionsChainJson] = useState<string>(defaultState.optionsChainJson);
  const [_aiAnalyzedTaRequestJson, _setAiAnalyzedTaRequestJson] = useState<string>(defaultState.aiAnalyzedTaRequestJson);
  const [_aiAnalyzedTaJson, _setAiAnalyzedTaJson] = useState<string>(defaultState.aiAnalyzedTaJson);
  const [_aiOptionsAnalysisRequestJson, _setAiOptionsAnalysisRequestJson] = useState<string>(defaultState.aiOptionsAnalysisRequestJson);
  const [_aiOptionsAnalysisJson, _setAiOptionsAnalysisJson] = useState<string>(defaultState.aiOptionsAnalysisJson);
  const [_aiKeyTakeawaysRequestJson, _setAiKeyTakeawaysRequestJson] = useState<string>(defaultState.aiKeyTakeawaysRequestJson);
  const [_aiKeyTakeawaysJson, _setAiKeyTakeawaysJson] = useState<string>(defaultState.aiKeyTakeawaysJson);
  const [_userInputAppDataChatRequestJson, _setUserInputAppDataChatRequestJson] = useState<string>(defaultState.userInputAppDataChatRequestJson);
  const [_userInputAppDataChatResponseJson, _setUserInputAppDataChatResponseJson] = useState<string>(defaultState.userInputAppDataChatResponseJson);
  const [_stockTraderTakeawaysRequestJson, _setStockTraderTakeawaysRequestJson] = useState<string>(defaultState.stockTraderTakeawaysRequestJson);
  const [_stockTraderTakeawaysResponseJson, _setStockTraderTakeawaysResponseJson] = useState<string>(defaultState.stockTraderTakeawaysResponseJson);
  const [_optionsTraderTakeawaysRequestJson, _setOptionsTraderTakeawaysRequestJson] = useState<string>(defaultState.optionsTraderTakeawaysRequestJson);
  const [_optionsTraderTakeawaysResponseJson, _setOptionsTraderTakeawaysResponseJson] = useState<string>(defaultState.optionsTraderTakeawaysResponseJson);
  const [_holisticTakeawaysRequestJson, _setHolisticTakeawaysRequestJson] = useState<string>(defaultState.holisticTakeawaysRequestJson);
  const [_holisticTakeawaysResponseJson, _setHolisticTakeawaysResponseJson] = useState<string>(defaultState.holisticTakeawaysResponseJson);
  const [_appDataChatHistory, _setAppDataChatHistory] = useState<AppDataChatMessage[]>(defaultState.appDataChatHistory);
  const [_userInputWebSearchChatRequestJson, _setUserInputWebSearchChatRequestJson] = useState<string>(defaultState.userInputWebSearchChatRequestJson);
  const [_userInputWebSearchChatResponseJson, _setUserInputWebSearchChatResponseJson] = useState<string>(defaultState.userInputWebSearchChatResponseJson);
  const [_rawTaWebSearchRequestJson, _setRawTaWebSearchRequestJson] = useState<string>(defaultState.rawTaWebSearchRequestJson);
  const [_rawTaWebSearchResponseJson, _setRawTaWebSearchResponseJson] = useState<string>(defaultState.rawTaWebSearchResponseJson);
  const [_rawOptionsWebSearchRequestJson, _setRawOptionsWebSearchRequestJson] = useState<string>(defaultState.rawOptionsWebSearchRequestJson);
  const [_rawOptionsWebSearchResponseJson, _setRawOptionsWebSearchResponseJson] = useState<string>(defaultState.rawOptionsWebSearchResponseJson);
  const [_rawSupportResistanceWebSearchRequestJson, _setRawSupportResistanceWebSearchRequestJson] = useState<string>(defaultState.rawSupportResistanceWebSearchRequestJson);
  const [_rawSupportResistanceWebSearchResponseJson, _setRawSupportResistanceWebSearchResponseJson] = useState<string>(defaultState.rawSupportResistanceWebSearchResponseJson);
  const [_webSearchChatHistory, _setWebSearchChatHistory] = useState<AppDataChatMessage[]>(defaultState.webSearchChatHistory);
  const [_targetFsmDisplayState, _setTargetFsmDisplayState] = useState<BusinessFsmState | null>(defaultState.targetFsmDisplayState);
  const [_mainTabFsmDisplay, _setMainTabFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.mainTabFsmDisplay);
  const [_chatbotFsmDisplay, _setChatbotFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.chatbotFsmDisplay);
  const [_debugConsoleMenuFsmDisplayInternal, _setDebugConsoleMenuFsmDisplayInternal] = useState<FsmDisplayTuple | null>(defaultState.debugConsoleMenuFsmDisplay);

  // New states for on-demand options
  const [_availableExpirationDates, _setAvailableExpirationDates] = useState<string[]>(defaultState.availableExpirationDates);
  const [_selectedExpirationDate, _setSelectedExpirationDate] = useState<string | undefined>(defaultState.selectedExpirationDate);
  const [_isLoadingExpirations, _setIsLoadingExpirations] = useState<boolean>(defaultState.isLoadingExpirations);
  const [_optionType, _setOptionType] = useState<OptionType>(defaultState.optionType);
  const [_strikeCount, _setStrikeCount] = useState<StrikeCount>(defaultState.strikeCount);
  const [_tableDisplayType, _setTableDisplayType] = useState<TableDisplayType>(defaultState.tableDisplayType);
  


  // Create all JSON setters using factory pattern
  const jsonSetters = useMemo(() => createSetterBatch({
    polygonApiRequestLogJson: _setPolygonApiRequestLogJson,
    polygonApiResponseLogJson: _setPolygonApiResponseLogJson,
    marketStatusJson: _setMarketStatusJson,
    stockSnapshotJson: _setStockSnapshotJson,
    standardTasJson: _setStandardTasJson,
    optionsChainJson: _setOptionsChainJson,
    aiAnalyzedTaRequestJson: _setAiAnalyzedTaRequestJson,
    aiAnalyzedTaJson: _setAiAnalyzedTaJson,
    aiOptionsAnalysisRequestJson: _setAiOptionsAnalysisRequestJson,
    aiOptionsAnalysisJson: _setAiOptionsAnalysisJson,
    aiKeyTakeawaysRequestJson: _setAiKeyTakeawaysRequestJson,
    aiKeyTakeawaysJson: _setAiKeyTakeawaysJson,
    userInputAppDataChatRequestJson: _setUserInputAppDataChatRequestJson,
    userInputAppDataChatResponseJson: _setUserInputAppDataChatResponseJson,
    stockTraderTakeawaysRequestJson: _setStockTraderTakeawaysRequestJson,
    stockTraderTakeawaysResponseJson: _setStockTraderTakeawaysResponseJson,
    optionsTraderTakeawaysRequestJson: _setOptionsTraderTakeawaysRequestJson,
    optionsTraderTakeawaysResponseJson: _setOptionsTraderTakeawaysResponseJson,
    holisticTakeawaysRequestJson: _setHolisticTakeawaysRequestJson,
    holisticTakeawaysResponseJson: _setHolisticTakeawaysResponseJson,
    userInputWebSearchChatRequestJson: _setUserInputWebSearchChatRequestJson,
    userInputWebSearchChatResponseJson: _setUserInputWebSearchChatResponseJson,
    rawTaWebSearchRequestJson: _setRawTaWebSearchRequestJson,
    rawTaWebSearchResponseJson: _setRawTaWebSearchResponseJson,
    rawOptionsWebSearchRequestJson: _setRawOptionsWebSearchRequestJson,
    rawOptionsWebSearchResponseJson: _setRawOptionsWebSearchResponseJson,
    rawSupportResistanceWebSearchRequestJson: _setRawSupportResistanceWebSearchRequestJson,
    rawSupportResistanceWebSearchResponseJson: _setRawSupportResistanceWebSearchResponseJson,
  }, { 
    enableLogging: false // Disabled to reduce console noise - consolidating to targeted console logs only
  }), [
    _setPolygonApiRequestLogJson,
    _setPolygonApiResponseLogJson,
    _setMarketStatusJson,
    _setStockSnapshotJson,
    _setStandardTasJson,
    _setOptionsChainJson,
    _setAiAnalyzedTaRequestJson,
    _setAiAnalyzedTaJson,
    _setAiOptionsAnalysisRequestJson,
    _setAiOptionsAnalysisJson,
    _setAiKeyTakeawaysRequestJson,
    _setAiKeyTakeawaysJson,
    _setUserInputAppDataChatRequestJson,
    _setUserInputAppDataChatResponseJson,
    _setStockTraderTakeawaysRequestJson,
    _setStockTraderTakeawaysResponseJson,
    _setOptionsTraderTakeawaysRequestJson,
    _setOptionsTraderTakeawaysResponseJson,
    _setHolisticTakeawaysRequestJson,
    _setHolisticTakeawaysResponseJson,
    _setUserInputWebSearchChatRequestJson,
    _setUserInputWebSearchChatResponseJson,
    _setRawTaWebSearchRequestJson,
    _setRawTaWebSearchResponseJson,
    _setRawOptionsWebSearchRequestJson,
    _setRawOptionsWebSearchResponseJson,
    _setRawSupportResistanceWebSearchRequestJson,
    _setRawSupportResistanceWebSearchResponseJson,
  ])

  const contextSetters = useMemo(() => ({
    ...jsonSetters,
    // Non-JSON setters
    setAvailableExpirationDates: _setAvailableExpirationDates,
    setSelectedExpirationDate: _setSelectedExpirationDate,
    setIsLoadingExpirations: _setIsLoadingExpirations,
    setOptionType: _setOptionType,
    setStrikeCount: _setStrikeCount,
    setTableDisplayType: _setTableDisplayType,
  }), [jsonSetters]) as StockAnalysisContextSetters;

  const addAppDataChatMessage = useCallback((message: AppDataChatMessage) => {
    _setAppDataChatHistory(prev => {
      const uniqueMessageId = `${Date.now()}_${chatMessageIdCounter++}_${message.role}_ctx_app`;
      const uniqueMessage: AppDataChatMessage = { ...message, id: uniqueMessageId };
      if (prev.length > 0 && prev[prev.length - 1].role === message.role && prev[prev.length - 1].content === message.content) {
        return prev;
      }
      return [...prev, uniqueMessage];
    });
  }, [_setAppDataChatHistory]);

  const clearAppDataChatHistory = useCallback(() => {
    _setAppDataChatHistory([]);
  }, [_setAppDataChatHistory]);

  const addWebSearchChatMessage = useCallback((message: AppDataChatMessage) => {
    _setWebSearchChatHistory(prev => {
      const uniqueMessageId = `${Date.now()}_${chatMessageIdCounter++}_${message.role}_ctx_web`;
      const uniqueMessage: AppDataChatMessage = { ...message, id: uniqueMessageId };
      if (prev.length > 0 && prev[prev.length - 1].role === message.role && prev[prev.length - 1].content === message.content) {
        return prev;
      }
      return [...prev, uniqueMessage];
    });
  }, [_setWebSearchChatHistory]);

  const clearWebSearchChatHistory = useCallback(() => {
    _setWebSearchChatHistory([]);
  }, [_setWebSearchChatHistory]);

  const setAllPlaceholdersInternal = useCallback((currentTickerForLogOnly: string, isFullAnalysis: boolean) => {
    // Batch all state updates to prevent multiple re-renders
    startTransition(() => {
      contextSetters.setPolygonApiRequestLogJson(pendingJson);
      contextSetters.setPolygonApiResponseLogJson(pendingJson);
      contextSetters.setMarketStatusJson(pendingJson);
      contextSetters.setStockSnapshotJson(pendingJson);
      contextSetters.setStandardTasJson(pendingJson);
      contextSetters.setOptionsChainJson(pendingJson);
      contextSetters.setAiAnalyzedTaRequestJson(pendingJson);
      contextSetters.setAiAnalyzedTaJson(pendingJson);
      contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
      contextSetters.setAiKeyTakeawaysJson(pendingJson);
      contextSetters.setAiOptionsAnalysisRequestJson(pendingJson);
      contextSetters.setAiOptionsAnalysisJson(pendingJson);
      if (isFullAnalysis) {
          contextSetters.setUserInputAppDataChatRequestJson(initialJsonPlaceholder);
          contextSetters.setUserInputAppDataChatResponseJson(initialJsonPlaceholder);
          contextSetters.setStockTraderTakeawaysRequestJson(initialJsonPlaceholder);
          contextSetters.setStockTraderTakeawaysResponseJson(initialJsonPlaceholder);
          contextSetters.setOptionsTraderTakeawaysRequestJson(initialJsonPlaceholder);
          contextSetters.setOptionsTraderTakeawaysResponseJson(initialJsonPlaceholder);
          contextSetters.setHolisticTakeawaysRequestJson(initialJsonPlaceholder);
          contextSetters.setHolisticTakeawaysResponseJson(initialJsonPlaceholder);
          contextSetters.setUserInputWebSearchChatRequestJson(initialJsonPlaceholder);
          contextSetters.setUserInputWebSearchChatResponseJson(initialJsonPlaceholder);
          contextSetters.setRawTaWebSearchRequestJson(initialJsonPlaceholder);
          contextSetters.setRawTaWebSearchResponseJson(initialJsonPlaceholder);
          contextSetters.setRawOptionsWebSearchRequestJson(initialJsonPlaceholder);
          contextSetters.setRawOptionsWebSearchResponseJson(initialJsonPlaceholder);
          contextSetters.setRawSupportResistanceWebSearchRequestJson(initialJsonPlaceholder);
          contextSetters.setRawSupportResistanceWebSearchResponseJson(initialJsonPlaceholder);
      }
    });
  }, [contextSetters]);

  const resetOnDemandOptionsState = useCallback(() => {
    // Batch all state updates to prevent multiple re-renders
    startTransition(() => {
      _setAvailableExpirationDates([]);
      _setSelectedExpirationDate(undefined);
      _setIsLoadingExpirations(false);
      _setOptionType('both');
      _setStrikeCount(20);
      _setTableDisplayType('side-by-side');
    });
  }, []);

  const fsmReducer = (state: BusinessFsmReducerManagedState, event: FsmEvent): BusinessFsmReducerManagedState => {
    const previousState = state.current;

    let nextCurrentState: BusinessFsmState = previousState;
    let nextVariables: BusinessContextVariables = { ...state.variables };
    let nextFlags: BusinessFlags = { ...state.flags };

    switch (event.type) {
      case 'INITIALIZATION_COMPLETE':
        if (previousState === BusinessFsmState.APP_INITIALIZING) {
            nextCurrentState = BusinessFsmState.IDLE;
        }
        break;
      case 'USER_INPUT_TICKER_CHANGED':
        nextVariables.userInputTicker = event.payload.ticker;
        break;
      case 'SET_LOADING':
        nextCurrentState = event.payload.isLoading ? BusinessFsmState.LOADING : BusinessFsmState.IDLE;
        break;
      case 'SET_ERROR':
        nextVariables.lastError = { message: event.payload.error, source: event.payload.source };
        nextCurrentState = BusinessFsmState.IDLE;
        break;
      case 'CLEAR_ERROR':
        nextVariables.lastError = null;
        break;
      default:
        break;
    }

    // Always allow stock data operations when not loading
    nextFlags.canGetStockData = nextCurrentState !== BusinessFsmState.LOADING;

    return { current: nextCurrentState, previous: previousState, variables: nextVariables, flags: nextFlags };
  };

  const [businessFsmReducerState, _dispatchFsmEventActual] = useReducer(fsmReducer, defaultBusinessState.businessFsmState);
  const fsmStateRef = useRef<BusinessFsmReducerManagedState>(businessFsmReducerState);

  useEffect(() => {
    fsmStateRef.current = businessFsmReducerState;
  }, [businessFsmReducerState]);
  
  const userInputTickerForEffect = businessFsmReducerState.variables.userInputTicker;

  // Proactive expiration date management hook with debouncing
  useEffect(() => {
    const logPrefix = 'ProactiveExpirationHook';
    const currentTicker = userInputTickerForEffect.trim();

    if (!currentTicker || currentTicker === businessFsmReducerState.variables.activeTicker) {
      return; // Do nothing if ticker is empty or hasn't changed from the last *analyzed* ticker
    }
    
    // Set a timer to fetch expirations after user stops typing
    const handler = setTimeout(() => {
      // This is a new ticker, so reset all previous options state first
      resetOnDemandOptionsState();

      const fetchAndSetDefaultExpiration = async () => {
        _setIsLoadingExpirations(true);
        
        try {
            const allDates = await getExpirationDates(currentTicker);
            const nextExpDate = findNextAvailableDate(allDates);
            
            _setAvailableExpirationDates(allDates);
            
            if (nextExpDate) {
              _setSelectedExpirationDate(nextExpDate);
            }
        } catch (error: any) {
        }
        
        _setIsLoadingExpirations(false);
      };

      fetchAndSetDefaultExpiration();
    }, 1000); // 1-second debounce timer

    // Cleanup function to clear the timeout if the user types again
    return () => {
      clearTimeout(handler);
    };
  }, [userInputTickerForEffect, businessFsmReducerState.variables.activeTicker, resetOnDemandOptionsState]);

  const setMainTabFsmDisplay = useCallback((display: FsmDisplayTuple | null) => {
    _setMainTabFsmDisplay(prevDisplay => {
      const hasChanged = !prevDisplay || !(prevDisplay.current === display?.current && prevDisplay.previous === display?.previous && prevDisplay.target === display?.target);
      if (hasChanged) { return display; }
      return prevDisplay;
    });
  }, [_setMainTabFsmDisplay]);

  const setChatbotFsmDisplay = useCallback((display: FsmDisplayTuple | null) => {
    _setChatbotFsmDisplay(prevDisplay => {
      const hasChanged = !prevDisplay || !(prevDisplay.current === display?.current && prevDisplay.previous === display?.previous && prevDisplay.target === display?.target);
      if (hasChanged) { return display; }
      return prevDisplay;
    });
  }, [_setChatbotFsmDisplay]);
  
  const dispatchFsmEvent = useCallback((event: FsmEvent) => {
    startTransition(() => {
      _dispatchFsmEventActual(event);
    });
  }, []);

  // Helper functions for on-demand operations
  const setActiveTicker = useCallback((ticker: string) => {
    startTransition(() => {
      _dispatchFsmEventActual({ type: 'USER_INPUT_TICKER_CHANGED', payload: { ticker } });
      // Reset all data flags when changing ticker
      const resetState = businessFsmReducerState;
      resetState.variables.activeTicker = ticker;
      resetState.flags.hasStockData = false;
      resetState.flags.hasMarketData = false;
      resetState.flags.hasOptionsData = false;
      resetState.flags.hasAiTaData = false;
      resetState.flags.hasAiKeyTakeaways = false;
      resetState.flags.hasAiOptionsAnalysis = false;
    });
  }, [businessFsmReducerState]);

  const setLoadingState = useCallback((isLoading: boolean) => {
    dispatchFsmEvent({ type: 'SET_LOADING', payload: { isLoading } });
  }, [dispatchFsmEvent]);

  const setErrorState = useCallback((error: string, source: string) => {
    dispatchFsmEvent({ type: 'SET_ERROR', payload: { error, source } });
  }, [dispatchFsmEvent]);

  const clearError = useCallback(() => {
    dispatchFsmEvent({ type: 'CLEAR_ERROR' });
  }, [dispatchFsmEvent]);

  // Data availability flag setters
  const setDataFlags = useCallback((flags: Partial<BusinessFlags>) => {
    startTransition(() => {
      // Update flags in the FSM state
      const currentState = fsmStateRef.current;
      Object.assign(currentState.flags, flags);
      _dispatchFsmEventActual({ type: 'USER_INPUT_TICKER_CHANGED', payload: { ticker: currentState.variables.userInputTicker } });
    });
  }, []);

  const markStockDataReady = useCallback(() => {
    setDataFlags({ hasStockData: true, hasMarketData: true, hasOptionsData: true });
  }, [setDataFlags]);

  const markAiTaDataReady = useCallback(() => {
    setDataFlags({ hasAiTaData: true });
  }, [setDataFlags]);

  const markAiKeyTakeawaysReady = useCallback(() => {
    setDataFlags({ hasAiKeyTakeaways: true });
  }, [setDataFlags]);

  const markAiOptionsAnalysisReady = useCallback(() => {
    setDataFlags({ hasAiOptionsAnalysis: true });
  }, [setDataFlags]);
  
  const contextValue: StockAnalysisContextType = useMemo(() => ({
    polygonApiRequestLogJson: _polygonApiRequestLogJson, setPolygonApiRequestLogJson: contextSetters.setPolygonApiRequestLogJson,
    polygonApiResponseLogJson: _polygonApiResponseLogJson, setPolygonApiResponseLogJson: contextSetters.setPolygonApiResponseLogJson,
    marketStatusJson: _marketStatusJson, setMarketStatusJson: contextSetters.setMarketStatusJson,
    stockSnapshotJson: _stockSnapshotJson, setStockSnapshotJson: contextSetters.setStockSnapshotJson,
    standardTasJson: _standardTasJson, setStandardTasJson: contextSetters.setStandardTasJson,
    optionsChainJson: _optionsChainJson, setOptionsChainJson: contextSetters.setOptionsChainJson,
    aiAnalyzedTaRequestJson: _aiAnalyzedTaRequestJson, setAiAnalyzedTaRequestJson: contextSetters.setAiAnalyzedTaRequestJson,
    aiAnalyzedTaJson: _aiAnalyzedTaJson, setAiAnalyzedTaJson: contextSetters.setAiAnalyzedTaJson,
    aiOptionsAnalysisRequestJson: _aiOptionsAnalysisRequestJson, setAiOptionsAnalysisRequestJson: contextSetters.setAiOptionsAnalysisRequestJson,
    aiOptionsAnalysisJson: _aiOptionsAnalysisJson, setAiOptionsAnalysisJson: contextSetters.setAiOptionsAnalysisJson,
    aiKeyTakeawaysRequestJson: _aiKeyTakeawaysRequestJson, setAiKeyTakeawaysRequestJson: contextSetters.setAiKeyTakeawaysRequestJson,
    aiKeyTakeawaysJson: _aiKeyTakeawaysJson, setAiKeyTakeawaysJson: contextSetters.setAiKeyTakeawaysJson,
    userInputAppDataChatRequestJson: _userInputAppDataChatRequestJson, setUserInputAppDataChatRequestJson: contextSetters.setUserInputAppDataChatRequestJson,
    userInputAppDataChatResponseJson: _userInputAppDataChatResponseJson, setUserInputAppDataChatResponseJson: contextSetters.setUserInputAppDataChatResponseJson,
    stockTraderTakeawaysRequestJson: _stockTraderTakeawaysRequestJson, setStockTraderTakeawaysRequestJson: contextSetters.setStockTraderTakeawaysRequestJson,
    stockTraderTakeawaysResponseJson: _stockTraderTakeawaysResponseJson, setStockTraderTakeawaysResponseJson: contextSetters.setStockTraderTakeawaysResponseJson,
    optionsTraderTakeawaysRequestJson: _optionsTraderTakeawaysRequestJson, setOptionsTraderTakeawaysRequestJson: contextSetters.setOptionsTraderTakeawaysRequestJson,
    optionsTraderTakeawaysResponseJson: _optionsTraderTakeawaysResponseJson, setOptionsTraderTakeawaysResponseJson: contextSetters.setOptionsTraderTakeawaysResponseJson,
    holisticTakeawaysRequestJson: _holisticTakeawaysRequestJson, setHolisticTakeawaysRequestJson: contextSetters.setHolisticTakeawaysRequestJson,
    holisticTakeawaysResponseJson: _holisticTakeawaysResponseJson, setHolisticTakeawaysResponseJson: contextSetters.setHolisticTakeawaysResponseJson,
    appDataChatHistory: _appDataChatHistory, addAppDataChatMessage, clearAppDataChatHistory, 
    userInputWebSearchChatRequestJson: _userInputWebSearchChatRequestJson, setUserInputWebSearchChatRequestJson: contextSetters.setUserInputWebSearchChatRequestJson,
    userInputWebSearchChatResponseJson: _userInputWebSearchChatResponseJson, setUserInputWebSearchChatResponseJson: contextSetters.setUserInputWebSearchChatResponseJson,
    rawTaWebSearchRequestJson: _rawTaWebSearchRequestJson, setRawTaWebSearchRequestJson: contextSetters.setRawTaWebSearchRequestJson,
    rawTaWebSearchResponseJson: _rawTaWebSearchResponseJson, setRawTaWebSearchResponseJson: contextSetters.setRawTaWebSearchResponseJson,
    rawOptionsWebSearchRequestJson: _rawOptionsWebSearchRequestJson, setRawOptionsWebSearchRequestJson: contextSetters.setRawOptionsWebSearchRequestJson,
    rawOptionsWebSearchResponseJson: _rawOptionsWebSearchResponseJson, setRawOptionsWebSearchResponseJson: contextSetters.setRawOptionsWebSearchResponseJson,
    rawSupportResistanceWebSearchRequestJson: _rawSupportResistanceWebSearchRequestJson, setRawSupportResistanceWebSearchRequestJson: contextSetters.setRawSupportResistanceWebSearchRequestJson,
    rawSupportResistanceWebSearchResponseJson: _rawSupportResistanceWebSearchResponseJson, setRawSupportResistanceWebSearchResponseJson: contextSetters.setRawSupportResistanceWebSearchResponseJson,
    webSearchChatHistory: _webSearchChatHistory, addWebSearchChatMessage, clearWebSearchChatHistory,
    fsmState: businessFsmReducerState.current, previousFsmState: businessFsmReducerState.previous,
    fsmVariables: businessFsmReducerState.variables, fsmFlags: businessFsmReducerState.flags,
    targetFsmDisplayState: _targetFsmDisplayState, dispatchFsmEvent,
    mainTabFsmDisplay: _mainTabFsmDisplay, setMainTabFsmDisplay,
    chatbotFsmDisplay: _chatbotFsmDisplay, setChatbotFsmDisplay,
    debugConsoleMenuFsmDisplay: _debugConsoleMenuFsmDisplayInternal,
    // On-demand operation helpers
    setActiveTicker, setLoadingState, setErrorState, clearError,
    // Data availability flag setters (anti-pattern fix)
    markStockDataReady, markAiTaDataReady, markAiKeyTakeawaysReady, markAiOptionsAnalysisReady,
    // Expose new state and setters
    availableExpirationDates: _availableExpirationDates, setAvailableExpirationDates: contextSetters.setAvailableExpirationDates,
    selectedExpirationDate: _selectedExpirationDate, setSelectedExpirationDate: contextSetters.setSelectedExpirationDate,
    isLoadingExpirations: _isLoadingExpirations, setIsLoadingExpirations: contextSetters.setIsLoadingExpirations,
    optionType: _optionType, setOptionType: contextSetters.setOptionType,
    strikeCount: _strikeCount, setStrikeCount: contextSetters.setStrikeCount,
    tableDisplayType: _tableDisplayType, setTableDisplayType: contextSetters.setTableDisplayType,
  }), [
    _polygonApiRequestLogJson, contextSetters, _polygonApiResponseLogJson,
    _marketStatusJson, _stockSnapshotJson, _standardTasJson, _optionsChainJson,
    _aiAnalyzedTaRequestJson, _aiAnalyzedTaJson, _aiOptionsAnalysisRequestJson,
    _aiOptionsAnalysisJson, _aiKeyTakeawaysJson,
    _userInputAppDataChatRequestJson, _userInputAppDataChatResponseJson,
    _stockTraderTakeawaysRequestJson, _stockTraderTakeawaysResponseJson,
    _optionsTraderTakeawaysRequestJson, _optionsTraderTakeawaysResponseJson,
    _holisticTakeawaysRequestJson, _holisticTakeawaysResponseJson,
    _appDataChatHistory, addAppDataChatMessage, clearAppDataChatHistory, 
    _userInputWebSearchChatRequestJson, _userInputWebSearchChatResponseJson,
    _rawTaWebSearchRequestJson, _rawTaWebSearchResponseJson, _rawOptionsWebSearchRequestJson, _rawOptionsWebSearchResponseJson,
    _rawSupportResistanceWebSearchRequestJson, _rawSupportResistanceWebSearchResponseJson,
    _webSearchChatHistory, addWebSearchChatMessage, clearWebSearchChatHistory,
    businessFsmReducerState, _targetFsmDisplayState, dispatchFsmEvent,
    _mainTabFsmDisplay, setMainTabFsmDisplay, _chatbotFsmDisplay, setChatbotFsmDisplay,
    _availableExpirationDates, _selectedExpirationDate,
    _isLoadingExpirations, _optionType, _strikeCount, _tableDisplayType,
    _aiKeyTakeawaysRequestJson, setActiveTicker, setLoadingState, setErrorState, clearError,
    markStockDataReady, markAiTaDataReady, markAiKeyTakeawaysReady, markAiOptionsAnalysisReady,
  ]);
  
  
  return (<StockAnalysisContext.Provider value={contextValue}>{children}</StockAnalysisContext.Provider>);
}

// Legacy provider function for backwards compatibility
export function StockAnalysisProvider({ children }: { children: ReactNode }) {
  return <BusinessLogicProvider>{children}</BusinessLogicProvider>;
}

// Hooks
export function useBusinessLogic() {
  const context = useContext(StockAnalysisContext);
  if (context === undefined) { 
    throw new Error('useBusinessLogic must be used within a BusinessLogicProvider'); 
  }
  return context;
}

export function useStockAnalysis() {
  const context = useContext(StockAnalysisContext);
  if (context === undefined) { 
    throw new Error('useStockAnalysis must be used within a StockAnalysisProvider'); 
  }
  return context;
}
