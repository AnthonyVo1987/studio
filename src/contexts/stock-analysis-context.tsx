
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useReducer, useRef, useMemo } from 'react';
import type { StockDataFetchResult, AnalyzeStockServerActionState } from '@/actions/analyze-stock-server-action';
import type { AnalyzeTaResult, AnalyzeTaActionState } from '@/actions/analyze-ta-action';
import type { PerformAiAnalysisResult, PerformAiAnalysisActionState } from '@/actions/perform-ai-analysis-action';
import type { PerformAiOptionsAnalysisResult, PerformAiOptionsAnalysisActionState } from '@/actions/perform-ai-options-analysis-action';
import { startTransition } from 'react';
import { isDataReadyForProcessing } from '@/lib/data-validation-utils';
import { getExpirationDates } from '@/services/data-sources/adapters/polygon-adapter';
import { format } from 'date-fns';
import { findNextAvailableDate } from '@/lib/date-utils';
import { createSetterBatch } from './context-setter-factory';


export enum GlobalFsmState {
  APP_INITIALIZING = 'APP_INITIALIZING',
  IDLE = 'IDLE',
  AWAITING_TICKER_INPUT = 'AWAITING_TICKER_INPUT',
  VALID_TICKER_ENTERED = 'VALID_TICKER_ENTERED',

  DATA_FETCH_IN_PROGRESS = 'DATA_FETCH_IN_PROGRESS',
  DATA_FETCH_SUCCEEDED = 'DATA_FETCH_SUCCEEDED',
  DATA_FETCH_FAILED = 'DATA_FETCH_FAILED',

  CALCULATING_AI_TA = 'CALCULATING_AI_TA',
  AI_TA_CALCULATION_SUCCEEDED = 'AI_TA_CALCULATION_SUCCEEDED',
  AI_TA_CALCULATION_FAILED = 'AI_TA_CALCULATION_FAILED',
  
  GENERATING_KEY_TAKEAWAYS = 'GENERATING_KEY_TAKEAWAYS',
  KEY_TAKEAWAYS_SUCCEEDED = 'KEY_TAKEAWAYS_SUCCEEDED',
  KEY_TAKEAWAYS_FAILED = 'KEY_TAKEAWAYS_FAILED',

  ANALYZING_OPTIONS = 'ANALYZING_OPTIONS',
  OPTIONS_ANALYSIS_SUCCEEDED = 'OPTIONS_ANALYSIS_SUCCEEDED',
  OPTIONS_ANALYSIS_FAILED = 'OPTIONS_ANALYSIS_FAILED',

  ERROR_STALE_DATA = 'ERROR_STALE_DATA',
}

// Types for the new on-demand options UI controls
export type OptionType = 'both' | 'calls' | 'puts';
export type StrikeCount = 20 | 30 | 40;
export type TableDisplayType = 'side-by-side' | 'top-bottom';

export interface GlobalFsmContextVariables {
  activeTicker: string | null;
  userInputTicker: string;
  lastError: { message: string; source: string; details?: any } | null;
}

export interface GlobalFsmFlags {
  canAnalyzeStock: boolean;
  isMarketDataReady: boolean;
  isSnapshotDataReady: boolean;
  isStandardTADataReady: boolean;
  isOptionsChainDataReady: boolean;
  isCalculatedTADataReady: boolean;
  isKeyTakeawaysDataAvailable: boolean;
  isOptionsAnalysisDataAvailable: boolean;
  isAiKeyTakeawaysSelected: boolean;
  isAiOptionsAnalysisSelected: boolean;
}

interface GlobalFsmReducerManagedState {
  current: GlobalFsmState;
  previous: GlobalFsmState | null;
  variables: GlobalFsmContextVariables;
  flags: GlobalFsmFlags;
}

export type FsmDisplayTuple = {
  previous: string | null;
  current: string;
  target: string | null;
};

interface StaleDataFromActionPayload { error: string; message: string; expectedTicker: string; foundTickerInSnapshot?: string; actionStateData?: StockDataFetchResult; }

export type AnalysisToggleType =
  | 'ai_key_takeaways'
  | 'ai_options_analysis';

interface AnalysisToggleChangedPayload {
  toggleType: AnalysisToggleType;
  isEnabled: boolean;
}


export type FsmEvent =
  | { type: 'START_FULL_ANALYSIS'; payload: { ticker: string } }
  | { type: 'INITIALIZATION_COMPLETE' }
  | { type: 'USER_INPUT_TICKER_CHANGED'; payload: { ticker: string } }
  | { type: 'SET_STATE_DATA_FETCH_IN_PROGRESS' }
  | { type: 'FETCH_DATA_SUCCESS'; payload: AnalyzeStockServerActionState }
  | { type: 'FETCH_DATA_FAILURE'; payload: AnalyzeStockServerActionState }
  | { type: 'SET_STATE_CALCULATING_AI_TA' }
  | { type: 'AI_TA_SUCCESS'; payload: AnalyzeTaActionState }
  | { type: 'AI_TA_FAILURE'; payload: AnalyzeTaActionState }
  | { type: 'STALE_DATA_FROM_ACTION'; payload: StaleDataFromActionPayload }
  | { type: 'KEY_TAKEAWAYS_SUCCESS'; payload: PerformAiAnalysisActionState }
  | { type: 'KEY_TAKEAWAYS_FAILURE'; payload: PerformAiAnalysisActionState }
  | { type: 'OPTIONS_ANALYSIS_SUCCESS'; payload: PerformAiOptionsAnalysisActionState }
  | { type: 'OPTIONS_ANALYSIS_FAILURE'; payload: PerformAiOptionsAnalysisActionState }
  | { type: 'ANALYSIS_TOGGLE_CHANGED'; payload: AnalysisToggleChangedPayload }
  | { type: 'FINALIZE_AUTOMATED_PIPELINE' };

export interface AppDataChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface StockAnalysisState {
  polygonApiRequestLogJson: string;
  polygonApiResponseLogJson: string;
  marketStatusJson: string;
  stockSnapshotJson: string;
  standardTasJson: string;
  optionsChainJson: string;
  aiAnalyzedTaRequestJson: string;
  aiAnalyzedTaJson: string;
  aiOptionsAnalysisRequestJson: string;
  aiOptionsAnalysisJson: string;
  aiKeyTakeawaysRequestJson: string;
  aiKeyTakeawaysJson: string;
  userInputAppDataChatRequestJson: string;
  userInputAppDataChatResponseJson: string;
  stockTraderTakeawaysRequestJson: string;
  stockTraderTakeawaysResponseJson: string;
  optionsTraderTakeawaysRequestJson: string;
  optionsTraderTakeawaysResponseJson: string;
  holisticTakeawaysRequestJson: string;
  holisticTakeawaysResponseJson: string;
  appDataChatHistory: AppDataChatMessage[];
  userInputWebSearchChatRequestJson: string;
  userInputWebSearchChatResponseJson: string;
  rawTaWebSearchRequestJson: string;
  rawTaWebSearchResponseJson: string;
  rawOptionsWebSearchRequestJson: string;
  rawOptionsWebSearchResponseJson: string;
  rawSupportResistanceWebSearchRequestJson: string;
  rawSupportResistanceWebSearchResponseJson: string;
  webSearchChatHistory: AppDataChatMessage[];
  globalFsmState: GlobalFsmReducerManagedState;
  targetFsmDisplayState: GlobalFsmState | null;
  mainTabFsmDisplay: FsmDisplayTuple | null;
  chatbotFsmDisplay: FsmDisplayTuple | null;
  debugConsoleMenuFsmDisplay: FsmDisplayTuple | null;
  // New state for on-demand options
  availableExpirationDates: string[];
  selectedExpirationDate: string | undefined;
  isLoadingExpirations: boolean;
  optionType: OptionType;
  strikeCount: StrikeCount;
  tableDisplayType: TableDisplayType;
}

interface StockAnalysisContextSetters {
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
  // New setters for on-demand options
  setAvailableExpirationDates: (dates: string[]) => void;
  setSelectedExpirationDate: (date: string | undefined) => void;
  setIsLoadingExpirations: (loading: boolean) => void;
  setOptionType: (type: OptionType) => void;
  setStrikeCount: (count: StrikeCount) => void;
  setTableDisplayType: (type: TableDisplayType) => void;
}

interface StockAnalysisContextType extends Omit<StockAnalysisState, 'globalFsmState'>, StockAnalysisContextSetters {
  fsmState: GlobalFsmState;
  previousFsmState: GlobalFsmState | null;
  fsmVariables: GlobalFsmContextVariables;
  fsmFlags: GlobalFsmFlags;
  addAppDataChatMessage: (message: AppDataChatMessage) => void;
  clearAppDataChatHistory: () => void;
  addWebSearchChatMessage: (message: AppDataChatMessage) => void;
  clearWebSearchChatHistory: () => void;
  // logDebug removed - using console.log/console.debug directly for simplified logging
  dispatchFsmEvent: (event: FsmEvent) => void;
  setMainTabFsmDisplay: (display: FsmDisplayTuple | null) => void;
  setChatbotFsmDisplay: (display: FsmDisplayTuple | null) => void;
}

const initialJsonPlaceholder = '{ "status": "no_analysis_run_yet" }';
const pendingJson = '{ "status": "pending..." }';

const initialGlobalFsmReducerState: GlobalFsmReducerManagedState = {
  current: GlobalFsmState.APP_INITIALIZING,
  previous: null,
  variables: {
    activeTicker: null,
    userInputTicker: "NVDA", 
    lastError: null,
  },
  flags: {
    canAnalyzeStock: false,
    isMarketDataReady: false,
    isSnapshotDataReady: false,
    isStandardTADataReady: false,
    isOptionsChainDataReady: false,
    isCalculatedTADataReady: false,
    isKeyTakeawaysDataAvailable: false,
    isOptionsAnalysisDataAvailable: false,
    isAiKeyTakeawaysSelected: true,
    isAiOptionsAnalysisSelected: true,
  },
};

const initialFsmDisplayTuple: FsmDisplayTuple = { previous: null, current: 'N/A', target: null };

const defaultState: StockAnalysisState = {
  polygonApiRequestLogJson: initialJsonPlaceholder,
  polygonApiResponseLogJson: initialJsonPlaceholder,
  marketStatusJson: initialJsonPlaceholder,
  stockSnapshotJson: initialJsonPlaceholder,
  standardTasJson: initialJsonPlaceholder,
  optionsChainJson: initialJsonPlaceholder,
  aiAnalyzedTaRequestJson: initialJsonPlaceholder,
  aiAnalyzedTaJson: initialJsonPlaceholder,
  aiOptionsAnalysisRequestJson: initialJsonPlaceholder,
  aiOptionsAnalysisJson: initialJsonPlaceholder,
  aiKeyTakeawaysRequestJson: initialJsonPlaceholder,
  aiKeyTakeawaysJson: initialJsonPlaceholder,
  userInputAppDataChatRequestJson: initialJsonPlaceholder,
  userInputAppDataChatResponseJson: initialJsonPlaceholder,
  stockTraderTakeawaysRequestJson: initialJsonPlaceholder,
  stockTraderTakeawaysResponseJson: initialJsonPlaceholder,
  optionsTraderTakeawaysRequestJson: initialJsonPlaceholder,
  optionsTraderTakeawaysResponseJson: initialJsonPlaceholder,
  holisticTakeawaysRequestJson: initialJsonPlaceholder,
  holisticTakeawaysResponseJson: initialJsonPlaceholder,
  appDataChatHistory: [],
  userInputWebSearchChatRequestJson: initialJsonPlaceholder,
  userInputWebSearchChatResponseJson: initialJsonPlaceholder,
  rawTaWebSearchRequestJson: initialJsonPlaceholder,
  rawTaWebSearchResponseJson: initialJsonPlaceholder,
  rawOptionsWebSearchRequestJson: initialJsonPlaceholder,
  rawOptionsWebSearchResponseJson: initialJsonPlaceholder,
  rawSupportResistanceWebSearchRequestJson: initialJsonPlaceholder,
  rawSupportResistanceWebSearchResponseJson: initialJsonPlaceholder,
  webSearchChatHistory: [],
  globalFsmState: initialGlobalFsmReducerState,
  targetFsmDisplayState: null,
  mainTabFsmDisplay: { ...initialFsmDisplayTuple, current: GlobalFsmState.IDLE.toString() },
  chatbotFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
  debugConsoleMenuFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
  // New state defaults
  availableExpirationDates: [],
  selectedExpirationDate: undefined,
  isLoadingExpirations: false,
  optionType: 'both',
  strikeCount: 20,
  tableDisplayType: 'side-by-side',
};

const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

let chatMessageIdCounter = 0;

export function StockAnalysisProvider({ children }: { children: ReactNode }) {

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
  const [_targetFsmDisplayState, _setTargetFsmDisplayState] = useState<GlobalFsmState | null>(defaultState.targetFsmDisplayState);
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
  

  const setAndLogJson = useCallback((setter: React.Dispatch<React.SetStateAction<string>>, name: string, value: string) => {
    setter(value);
  }, []);

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
  }, [contextSetters]);

  const resetOnDemandOptionsState = useCallback(() => {
    _setAvailableExpirationDates([]);
    _setSelectedExpirationDate(undefined);
    _setIsLoadingExpirations(false);
    _setOptionType('both');
    _setStrikeCount(20);
    _setTableDisplayType('side-by-side');
  }, []);

  const fsmReducer = (state: GlobalFsmReducerManagedState, event: FsmEvent): GlobalFsmReducerManagedState => {
    const previousState = state.current;

    let nextCurrentState: GlobalFsmState = previousState;
    let nextVariables: GlobalFsmContextVariables = { ...state.variables };
    let nextFlags: GlobalFsmFlags = { ...state.flags };
    const errorJsonWithDetails = (message: string, details: string | null | undefined) => `{ "status": "error", "message": "${message.replace(/"/g, '\\"')}", "details": "${(details || '').replace(/"/g, '\\"')}" }`;

    const resetForNewAnalysis = (ticker: string) => {
        nextVariables.activeTicker = ticker;
        nextVariables.lastError = null;
        nextFlags.canAnalyzeStock = false;
        nextFlags.isMarketDataReady = false; nextFlags.isSnapshotDataReady = false;
        nextFlags.isStandardTADataReady = false; nextFlags.isOptionsChainDataReady = false;
        nextFlags.isCalculatedTADataReady = false;
        nextFlags.isKeyTakeawaysDataAvailable = false;
        nextFlags.isOptionsAnalysisDataAvailable = false;
    };

    const handlePipelineError = (source: string, errorMessage: string, errorDetails?: any) => {
        nextVariables.lastError = { message: errorMessage, source, details: errorDetails };
        nextCurrentState = GlobalFsmState.IDLE;
    };
    
    // Helper to determine the next step in the pipeline
    const determineNextStepAfterTA = (): GlobalFsmState => {
        if (nextFlags.isAiKeyTakeawaysSelected) return GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
        if (nextFlags.isAiOptionsAnalysisSelected) return GlobalFsmState.ANALYZING_OPTIONS;
        return GlobalFsmState.IDLE;
    };

    switch (event.type) {
      case 'ANALYSIS_TOGGLE_CHANGED':
        const { toggleType, isEnabled } = event.payload;
        switch (toggleType) {
          case 'ai_key_takeaways': nextFlags.isAiKeyTakeawaysSelected = isEnabled; break;
          case 'ai_options_analysis': nextFlags.isAiOptionsAnalysisSelected = isEnabled; break;
        }
        nextCurrentState = previousState;
        break;
      case 'START_FULL_ANALYSIS':
        resetForNewAnalysis(event.payload.ticker);
        nextCurrentState = GlobalFsmState.DATA_FETCH_IN_PROGRESS;
        break;
      case 'INITIALIZATION_COMPLETE':
        if (previousState === GlobalFsmState.APP_INITIALIZING) {
            nextCurrentState = nextVariables.userInputTicker.trim() !== "" ? GlobalFsmState.VALID_TICKER_ENTERED : GlobalFsmState.AWAITING_TICKER_INPUT;
        }
        break;
      case 'USER_INPUT_TICKER_CHANGED':
        nextVariables.userInputTicker = event.payload.ticker;
        if (!event.payload.ticker.trim()) {
            nextCurrentState = GlobalFsmState.AWAITING_TICKER_INPUT;
        } else if (event.payload.ticker.trim() !== nextVariables.activeTicker) {
            nextCurrentState = GlobalFsmState.VALID_TICKER_ENTERED;
        } else {
             nextCurrentState = previousState;
        }
        break;
      case 'FETCH_DATA_SUCCESS':
        if (event.payload.data) {
            contextSetters.setMarketStatusJson(event.payload.data.marketStatusJson); contextSetters.setStockSnapshotJson(event.payload.data.stockSnapshotJson);
            contextSetters.setStandardTasJson(event.payload.data.standardTasJson); contextSetters.setOptionsChainJson(event.payload.data.optionsChainJson);
            contextSetters.setPolygonApiRequestLogJson(event.payload.data.polygonApiRequestLogJson); 
            const responseLogJson = event.payload.data.polygonApiResponseLogJson;
            contextSetters.setPolygonApiResponseLogJson(responseLogJson);
            
            try {
              const responseLog = JSON.parse(responseLogJson);
              if (responseLog.autoSelectedExpirationDate) {
                _setSelectedExpirationDate(responseLog.autoSelectedExpirationDate);
              }
            } catch (e) { }

            nextFlags.isMarketDataReady = true; nextFlags.isSnapshotDataReady = true; nextFlags.isStandardTADataReady = true; nextFlags.isOptionsChainDataReady = true;
            nextCurrentState = GlobalFsmState.CALCULATING_AI_TA;
        } else {
             handlePipelineError('DataFetchSuccess', 'Payload data missing in success event.');
        }
        break;
      case 'FETCH_DATA_FAILURE':
        const fetchErr = event.payload;
        const fetchErrMsg = fetchErr.message || 'Data fetch failed';
        if(fetchErr.data) {
            contextSetters.setMarketStatusJson(fetchErr.data.marketStatusJson); contextSetters.setStockSnapshotJson(fetchErr.data.stockSnapshotJson);
            contextSetters.setStandardTasJson(fetchErr.data.standardTasJson); contextSetters.setOptionsChainJson(fetchErr.data.optionsChainJson);
            contextSetters.setPolygonApiRequestLogJson(fetchErr.data.polygonApiRequestLogJson); contextSetters.setPolygonApiResponseLogJson(fetchErr.data.polygonApiResponseLogJson);
        }
        handlePipelineError('DataFetch', fetchErrMsg, fetchErr.error);
        break;
      case 'STALE_DATA_FROM_ACTION':
        const staleErr = event.payload; const staleErrMsg = staleErr.message || 'Stale data error';
        const staleErrorJson = errorJsonWithDetails(staleErrMsg, `Expected ${staleErr.expectedTicker}, got ${staleErr.foundTickerInSnapshot || 'unknown'}.`);
        contextSetters.setMarketStatusJson(staleErr.actionStateData?.marketStatusJson || staleErrorJson);
        contextSetters.setStockSnapshotJson(staleErr.actionStateData?.stockSnapshotJson || staleErrorJson);
        contextSetters.setStandardTasJson(staleErr.actionStateData?.standardTasJson || staleErrorJson);
        contextSetters.setOptionsChainJson(staleErr.actionStateData?.optionsChainJson || staleErrorJson);
        contextSetters.setPolygonApiRequestLogJson(staleErr.actionStateData?.polygonApiRequestLogJson || errorJsonWithDetails("Req log unavailable for stale data.", null));
        contextSetters.setPolygonApiResponseLogJson(staleErr.actionStateData?.polygonApiResponseLogJson || errorJsonWithDetails("Res log unavailable for stale data.", null));
        handlePipelineError('StaleData', staleErrMsg, staleErr.error);
        break;
      case 'AI_TA_SUCCESS':
        if(event.payload.data) {
            contextSetters.setAiAnalyzedTaRequestJson(event.payload.data.aiAnalyzedTaRequestJson); contextSetters.setAiAnalyzedTaJson(event.payload.data.aiAnalyzedTaJson);
            nextFlags.isCalculatedTADataReady = true;
            nextCurrentState = determineNextStepAfterTA();
        } else {
            handlePipelineError('AITaCalculationSuccess', 'Payload data missing in success event.');
        }
        break;
      case 'AI_TA_FAILURE':
        const aiTaErr = event.payload; const aiTaErrMsg = aiTaErr.message || 'AI TA analysis failed';
        const aiTaErrorJson = errorJsonWithDetails(aiTaErrMsg, aiTaErr.error);
        contextSetters.setAiAnalyzedTaRequestJson(aiTaErr.data?.aiAnalyzedTaRequestJson || aiTaErrorJson); contextSetters.setAiAnalyzedTaJson(aiTaErrorJson);
        handlePipelineError('AITaCalculation', aiTaErrMsg, aiTaErr.error);
        break;
      case 'KEY_TAKEAWAYS_SUCCESS':
        if (event.payload.data) {
          contextSetters.setAiKeyTakeawaysRequestJson(event.payload.data.aiKeyTakeawaysRequestJson);
          contextSetters.setAiKeyTakeawaysJson(event.payload.data.aiKeyTakeawaysJson);
        }
        nextFlags.isKeyTakeawaysDataAvailable = true;
        nextCurrentState = nextFlags.isAiOptionsAnalysisSelected ? GlobalFsmState.ANALYZING_OPTIONS : GlobalFsmState.IDLE;
        break;
      case 'KEY_TAKEAWAYS_FAILURE':
        nextCurrentState = nextFlags.isAiOptionsAnalysisSelected ? GlobalFsmState.ANALYZING_OPTIONS : GlobalFsmState.IDLE;
        break;
      case 'OPTIONS_ANALYSIS_SUCCESS':
        if (event.payload.data) {
          contextSetters.setAiOptionsAnalysisRequestJson(event.payload.data.aiOptionsAnalysisRequestJson);
          contextSetters.setAiOptionsAnalysisJson(event.payload.data.aiOptionsAnalysisJson);
        }
        nextFlags.isOptionsAnalysisDataAvailable = true;
        nextCurrentState = GlobalFsmState.IDLE;
        break;
      case 'OPTIONS_ANALYSIS_FAILURE':
        nextCurrentState = GlobalFsmState.IDLE;
        break;
      case 'FINALIZE_AUTOMATED_PIPELINE':
        nextCurrentState = GlobalFsmState.IDLE;
        break;
      default:
        break;
    }

    if ([
        GlobalFsmState.IDLE, GlobalFsmState.VALID_TICKER_ENTERED, GlobalFsmState.AWAITING_TICKER_INPUT,
    ].includes(nextCurrentState)) {
        nextFlags.canAnalyzeStock = true;
    } else {
        nextFlags.canAnalyzeStock = false;
    }

    return { current: nextCurrentState, previous: previousState, variables: nextVariables, flags: nextFlags };
  };

  const [globalFsmReducerState, _dispatchFsmEventActual] = useReducer(fsmReducer, defaultState.globalFsmState);
  const fsmStateRef = useRef<GlobalFsmReducerManagedState>(globalFsmReducerState);

  useEffect(() => {
    fsmStateRef.current = globalFsmReducerState;
  }, [globalFsmReducerState]);
  
  useEffect(() => {
    const isNewAnalysis = globalFsmReducerState.current === GlobalFsmState.DATA_FETCH_IN_PROGRESS && 
                          globalFsmReducerState.previous !== GlobalFsmState.DATA_FETCH_IN_PROGRESS;

    if (isNewAnalysis) {
      const ticker = globalFsmReducerState.variables.activeTicker;
      if (ticker) {
        setAllPlaceholdersInternal(ticker, true);
      }
    }
  }, [globalFsmReducerState.current, globalFsmReducerState.previous, globalFsmReducerState.variables.activeTicker, setAllPlaceholdersInternal]);
  
  const userInputTickerForEffect = globalFsmReducerState.variables.userInputTicker;

  // Proactive expiration date management hook with debouncing
  useEffect(() => {
    const logPrefix = 'ProactiveExpirationHook';
    const currentTicker = userInputTickerForEffect.trim();

    if (!currentTicker || currentTicker === globalFsmReducerState.variables.activeTicker) {
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
            console.error(`[StockAnalysisContext:${logPrefix}] Failed to fetch expirations for '${currentTicker}'. Error: ${error.message}`);
        }
        
        _setIsLoadingExpirations(false);
      };

      fetchAndSetDefaultExpiration();
    }, 1000); // 1-second debounce timer

    // Cleanup function to clear the timeout if the user types again
    return () => {
      clearTimeout(handler);
    };
  }, [userInputTickerForEffect, globalFsmReducerState.variables.activeTicker, resetOnDemandOptionsState]);

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
    fsmState: globalFsmReducerState.current, previousFsmState: globalFsmReducerState.previous,
    fsmVariables: globalFsmReducerState.variables, fsmFlags: globalFsmReducerState.flags,
    targetFsmDisplayState: _targetFsmDisplayState, dispatchFsmEvent,
    mainTabFsmDisplay: _mainTabFsmDisplay, setMainTabFsmDisplay,
    chatbotFsmDisplay: _chatbotFsmDisplay, setChatbotFsmDisplay,
    debugConsoleMenuFsmDisplay: _debugConsoleMenuFsmDisplayInternal,
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
    globalFsmReducerState, _targetFsmDisplayState, dispatchFsmEvent,
    _mainTabFsmDisplay, setMainTabFsmDisplay, _chatbotFsmDisplay, setChatbotFsmDisplay,
    _availableExpirationDates, _selectedExpirationDate,
    _isLoadingExpirations, _optionType, _strikeCount, _tableDisplayType,
    _aiKeyTakeawaysRequestJson,
  ]);
  
  
  return (<StockAnalysisContext.Provider value={contextValue}>{children}</StockAnalysisContext.Provider>);
}

export function useStockAnalysis() {
  const context = useContext(StockAnalysisContext);
  if (context === undefined) { throw new Error('useStockAnalysis must be used within a StockAnalysisProvider'); }
  return context;
}
