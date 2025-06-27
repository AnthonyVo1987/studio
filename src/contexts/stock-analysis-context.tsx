
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useReducer, useRef, useMemo } from 'react';
import type { LogSourceId, LogSourceConfig } from '@/lib/debug-log-types';
import { logSourceIds, defaultLogSourceConfig } from '@/lib/debug-log-types';
import { addEntryToGlobalLogBuffer, clearGlobalLogBuffer, globalLogEntries } from '@/lib/global-log-buffer';
import { fetchStockDataAction, type AnalyzeStockServerActionState, type StockDataFetchResult } from '@/actions/analyze-stock-server-action';
import { calculateAiTaAction, type CalculateAiTaActionState, type CalculateAiTaResult } from '@/actions/calculate-ai-ta-action';
import { performAiAnalysisAction, type PerformAiAnalysisActionState, type PerformAiAnalysisResult } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction, type PerformAiOptionsAnalysisActionState, type PerformAiOptionsAnalysisResult } from '@/actions/perform-ai-options-analysis-action';
import { appDataChatAction, type AppDataChatActionState, type AppDataChatActionInputs, type AppDataChatActionResult } from '@/actions/app-data-chat-action';
import { useActionState, startTransition } from 'react';
import { isDataReadyForProcessing } from '@/lib/data-validation-utils';

const LOGDEBUG_MARKER = '__LOGDEBUG_MARKER__';

export enum GlobalFsmState {
  APP_INITIALIZING = 'APP_INITIALIZING',
  IDLE = 'IDLE',
  AWAITING_TICKER_INPUT = 'AWAITING_TICKER_INPUT',
  VALID_TICKER_ENTERED = 'VALID_TICKER_ENTERED',

  PIPELINE_REQUESTED_DATA_FETCH = 'PIPELINE_REQUESTED_DATA_FETCH',
  DATA_FETCH_IN_PROGRESS = 'DATA_FETCH_IN_PROGRESS',
  DATA_FETCH_SUCCEEDED = 'DATA_FETCH_SUCCEEDED',
  DATA_FETCH_FAILED = 'DATA_FETCH_FAILED',

  CALCULATING_AI_TA = 'CALCULATING_AI_TA',
  AI_TA_CALCULATION_SUCCEEDED = 'AI_TA_CALCULATION_SUCCEEDED',
  AI_TA_CALCULATION_FAILED = 'AI_TA_CALCULATION_FAILED',

  PIPELINE_AUTOMATED_COMPLETE = 'PIPELINE_AUTOMATED_COMPLETE',
  PIPELINE_PAUSED = 'PIPELINE_PAUSED',

  GENERATING_KEY_TAKEAWAYS = 'GENERATING_KEY_TAKEAWAYS',
  KEY_TAKEAWAYS_SUCCEEDED = 'KEY_TAKEAWAYS_SUCCEEDED',
  KEY_TAKEAWAYS_FAILED = 'KEY_TAKEAWAYS_FAILED',

  ANALYZING_OPTIONS = 'ANALYZING_OPTIONS',
  OPTIONS_ANALYSIS_SUCCEEDED = 'OPTIONS_ANALYSIS_SUCCEEDED',
  OPTIONS_ANALYSIS_FAILED = 'OPTIONS_ANALYSIS_FAILED',

  USER_INPUT_APP_DATA_CHAT_PENDING = 'USER_INPUT_APP_DATA_CHAT_PENDING',
  USER_INPUT_APP_DATA_CHAT_SUCCESS = 'USER_INPUT_APP_DATA_CHAT_SUCCESS',
  USER_INPUT_APP_DATA_CHAT_ERROR = 'USER_INPUT_APP_DATA_CHAT_ERROR',

  STOCK_TRADER_CHAT_PENDING = 'STOCK_TRADER_CHAT_PENDING',
  STOCK_TRADER_CHAT_SUCCESS = 'STOCK_TRADER_CHAT_SUCCESS',
  STOCK_TRADER_CHAT_ERROR = 'STOCK_TRADER_CHAT_ERROR',

  OPTIONS_TRADER_CHAT_PENDING = 'OPTIONS_TRADER_CHAT_PENDING',
  OPTIONS_TRADER_CHAT_SUCCESS = 'OPTIONS_TRADER_CHAT_SUCCESS',
  OPTIONS_TRADER_CHAT_ERROR = 'OPTIONS_TRADER_CHAT_ERROR',

  HOLISTIC_CHAT_PENDING = 'HOLISTIC_CHAT_PENDING',
  HOLISTIC_CHAT_SUCCESS = 'HOLISTIC_CHAT_SUCCESS',
  HOLISTIC_CHAT_ERROR = 'HOLISTIC_CHAT_ERROR',
  
  ERROR_STALE_DATA = 'ERROR_STALE_DATA',
}

export type FullAiMacroChatStep = 'key_takeaways' | 'options_analysis' | 'stock_trader_chat' | 'options_trader_chat' | 'holistic_chat' | null;

export interface GlobalFsmContextVariables {
  activeTicker: string | null;
  userInputTicker: string;
  isInitialLoad: boolean;
  lastError: { message: string; source: string; details?: any } | null;
  pendingAppDataChatSubmissionPayload: AppDataChatActionInputs | null;
  activePipelineProfile: 'standard' | null;
  completedChatPrompts: string[];
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
  isManualKeyTakeawaysActionPossible: boolean;
  isManualOptionsAnalysisActionPossible: boolean;
  isDebugConsoleFilterMenuOpen: boolean;
  isDebugConsoleCopyMenuOpen: boolean;
  isDebugConsoleExportMenuOpen: boolean;
  isAiKeyTakeawaysSelected: boolean;
  isAiOptionsAnalysisSelected: boolean;
  isAiChatStockTraderTakeawaysSelected: boolean;
  isAiChatOptionsTraderTakeawaysSelected: boolean;
  isAiChatHolisticTakeawaysSelected: boolean;
  isWebSearchTaEnabled: boolean;
  isWebSearchOptionsEnabled: boolean;
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

interface FetchDataSuccessPayload extends StockDataFetchResult {}
interface FetchDataFailurePayload { error?: string | null; message?: string | null; polygonApiRequestLogJson?: string; polygonApiResponseLogJson?: string; }
interface StaleDataFromActionPayload { error: string; message: string; expectedTicker: string; foundTickerInSnapshot?: string; actionStateData?: StockDataFetchResult; }
interface AiTaSuccessPayload extends CalculateAiTaResult {}
interface AiTaFailurePayload { error?: string | null; message?: string | null; aiAnalyzedTaRequestJson?: string; }
interface AiKeyTakeawaysSuccessPayload extends PerformAiAnalysisResult {}
interface AiKeyTakeawaysFailurePayload { error?: string | null; message?: string | null; aiKeyTakeawaysRequestJson?: string; }
interface AiOptionsAnalysisSuccessPayload extends PerformAiOptionsAnalysisResult {}
interface AiOptionsAnalysisFailurePayload { error?: string | null; message?: string | null; aiOptionsAnalysisRequestJson?: string; }
interface AppDataChatActionSuccessPayload extends AppDataChatActionResult { promptName?: string; }
interface AppDataChatActionErrorPayload { error?: string | null; message?: string | null; chatbotRequestJson?: string; chatbotResponseJson?: string; promptName?: string; }

type DebugConsoleMenuType = 'filter' | 'copy' | 'export';
interface ToggleDebugConsoleMenuPayload { menu: DebugConsoleMenuType; isOpen: boolean; }
interface UpdateManualActionFlagsPayload { ktPossible: boolean; optPossible: boolean; }

export type AnalysisToggleType =
  | 'ai_key_takeaways'
  | 'ai_options_analysis'
  | 'ai_chat_stock_trader'
  | 'ai_chat_options_trader'
  | 'ai_chat_holistic'
  | 'web_search_ta'
  | 'web_search_options';

interface AnalysisToggleChangedPayload {
  toggleType: AnalysisToggleType;
  isEnabled: boolean;
}


export type FsmEvent =
  | { type: 'START_FULL_ANALYSIS'; payload: { ticker: string } }
  | { type: 'INITIALIZATION_COMPLETE' }
  | { type: 'USER_INPUT_TICKER_CHANGED'; payload: { ticker: string } }
  | { type: 'TRIGGER_DATA_FETCH' }
  | { type: 'DATA_FETCH_IN_PROGRESS' }
  | { type: 'FETCH_DATA_SUCCESS'; payload: FetchDataSuccessPayload }
  | { type: 'FETCH_DATA_FAILURE'; payload: FetchDataFailurePayload }
  | { type: 'STALE_DATA_FROM_ACTION'; payload: StaleDataFromActionPayload }
  | { type: 'AI_TA_SUCCESS'; payload: AiTaSuccessPayload }
  | { type: 'AI_TA_FAILURE'; payload: AiTaFailurePayload }
  | { type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS'; payload: { ticker: string } }
  | { type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS'; payload: { ticker: string } }
  | { type: 'KEY_TAKEAWAYS_SUCCESS'; payload: AiKeyTakeawaysSuccessPayload }
  | { type: 'KEY_TAKEAWAYS_FAILURE'; payload: AiKeyTakeawaysFailurePayload }
  | { type: 'OPTIONS_ANALYSIS_SUCCESS'; payload: AiOptionsAnalysisSuccessPayload }
  | { type: 'OPTIONS_ANALYSIS_FAILURE'; payload: AiOptionsAnalysisFailurePayload }
  | { type: 'SUBMIT_USER_INPUT_APP_DATA_CHAT'; payload: AppDataChatActionInputs }
  | { type: 'USER_INPUT_APP_DATA_CHAT_ACTION_SUCCESS'; payload: AppDataChatActionSuccessPayload }
  | { type: 'USER_INPUT_APP_DATA_CHAT_ACTION_ERROR'; payload: AppDataChatActionErrorPayload }
  | { type: 'SUBMIT_STOCK_TRADER_TAKEAWAYS_CHAT'; payload: AppDataChatActionInputs }
  | { type: 'STOCK_TRADER_TAKEAWAYS_CHAT_ACTION_SUCCESS'; payload: AppDataChatActionSuccessPayload }
  | { type: 'STOCK_TRADER_TAKEAWAYS_CHAT_ACTION_ERROR'; payload: AppDataChatActionErrorPayload }
  | { type: 'SUBMIT_OPTIONS_TRADER_TAKEAWAYS_CHAT'; payload: AppDataChatActionInputs }
  | { type: 'OPTIONS_TRADER_TAKEAWAYS_CHAT_ACTION_SUCCESS'; payload: AppDataChatActionSuccessPayload }
  | { type: 'OPTIONS_TRADER_TAKEAWAYS_CHAT_ACTION_ERROR'; payload: AppDataChatActionErrorPayload }
  | { type: 'SUBMIT_HOLISTIC_TAKEAWAYS_CHAT'; payload: AppDataChatActionInputs }
  | { type: 'HOLISTIC_TAKEAWAYS_CHAT_ACTION_SUCCESS'; payload: AppDataChatActionSuccessPayload }
  | { type: 'HOLISTIC_TAKEAWAYS_CHAT_ACTION_ERROR'; payload: AppDataChatActionErrorPayload }
  | { type: 'TOGGLE_DEBUG_CONSOLE_MENU'; payload: ToggleDebugConsoleMenuPayload }
  | { type: 'UPDATE_MANUAL_ACTION_FLAGS'; payload: UpdateManualActionFlagsPayload }
  | { type: 'ANALYSIS_TOGGLE_CHANGED'; payload: AnalysisToggleChangedPayload }
  | { type: 'FINALIZE_AUTOMATED_PIPELINE' }
  | { type: 'RESUME_PIPELINE' }
  | { type: '_PIPELINE_STEP_SUCCEEDED'; payload: { stepName: string, nextState: GlobalFsmState } }
  | { type: '_PIPELINE_STEP_FAILED'; payload: { stepName: string, error: any, nextState: GlobalFsmState } };

export interface AppDataChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

const browserConsole = {
  log: typeof console !== 'undefined' ? console.log.bind(console) : () => {},
  warn: typeof console !== 'undefined' ? console.warn.bind(console) : () => {},
  error: typeof console !== 'undefined' ? console.error.bind(console) : () => {},
  info: typeof console !== 'undefined' ? console.info.bind(console) : () => {},
  debug: typeof console !== 'undefined' ? console.debug.bind(console) : () => {},
};

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
  webSearchChatHistory: AppDataChatMessage[];
  isClientDebugConsoleEnabled: boolean;
  isClientDebugConsoleOpen: boolean;
  logSourceConfig: LogSourceConfig;
  globalFsmState: GlobalFsmReducerManagedState;
  targetFsmDisplayState: GlobalFsmState | null;
  mainTabFsmDisplay: FsmDisplayTuple | null;
  chatbotFsmDisplay: FsmDisplayTuple | null;
  debugConsoleMenuFsmDisplay: FsmDisplayTuple | null;
  isReducedStartupLoggingEnabled: boolean;
  isUiRenderLoggingEnabled: boolean;
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
  setClientDebugConsoleEnabled: (enabled: boolean) => void;
  setClientDebugConsoleOpen: (open: boolean) => void;
  setLogSourceEnabled: (source: LogSourceId, enabled: boolean) => void;
  enableAllLogSources: () => void;
  disableAllLogSources: () => void;
  logDebug: (source: LogSourceId, category: string, ...messages: any[]) => void;
  dispatchFsmEvent: (event: FsmEvent) => void;
  setMainTabFsmDisplay: (display: FsmDisplayTuple | null) => void;
  setChatbotFsmDisplay: (display: FsmDisplayTuple | null) => void;
  setReducedStartupLoggingEnabled: (enabled: boolean) => void;
  setUiRenderLoggingEnabled: (enabled: boolean) => void;
}

const initialJsonPlaceholder = '{ "status": "no_analysis_run_yet" }';
const pendingJson = '{ "status": "pending..." }';
const chatPendingJson = '{ "status": "chat_pending..." }';

const initialGlobalFsmReducerState: GlobalFsmReducerManagedState = {
  current: GlobalFsmState.APP_INITIALIZING,
  previous: null,
  variables: {
    activeTicker: null,
    userInputTicker: "NVDA", 
    isInitialLoad: true,
    lastError: null,
    pendingAppDataChatSubmissionPayload: null,
    activePipelineProfile: null,
    completedChatPrompts: [],
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
    isManualKeyTakeawaysActionPossible: false,
    isManualOptionsAnalysisActionPossible: false,
    isDebugConsoleFilterMenuOpen: false,
    isDebugConsoleCopyMenuOpen: false,
    isDebugConsoleExportMenuOpen: false,
    isAiKeyTakeawaysSelected: true,
    isAiOptionsAnalysisSelected: true,
    isAiChatStockTraderTakeawaysSelected: true,
    isAiChatOptionsTraderTakeawaysSelected: true,
    isAiChatHolisticTakeawaysSelected: true,
    isWebSearchTaEnabled: true,
    isWebSearchOptionsEnabled: true,
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
  webSearchChatHistory: [],
  isClientDebugConsoleEnabled: true,
  isClientDebugConsoleOpen: true,
  logSourceConfig: defaultLogSourceConfig,
  globalFsmState: initialGlobalFsmReducerState,
  targetFsmDisplayState: null,
  mainTabFsmDisplay: { ...initialFsmDisplayTuple, current: GlobalFsmState.IDLE.toString() },
  chatbotFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
  debugConsoleMenuFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
  isReducedStartupLoggingEnabled: false,
  isUiRenderLoggingEnabled: true,
};

const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

let chatMessageIdCounter = 0;

export function StockAnalysisProvider({ children }: { children: ReactNode }) {
  if (typeof window !== 'undefined' && !(console as any).__stockSageContextOriginals) {
    (console as any).__stockSageContextOriginals = {
      log: console.log.bind(console), warn: console.warn.bind(console), error: console.error.bind(console),
      info: console.info.bind(console), debug: console.debug.bind(console),
    };
    (console as any).__stockSageContextOriginals.debug('[CONTEXT_INIT]', 'Original console methods captured by StockAnalysisProvider.');
  }
  const contextOriginals = (console as any).__stockSageContextOriginals || browserConsole;

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
  const [_webSearchChatHistory, _setWebSearchChatHistory] = useState<AppDataChatMessage[]>(defaultState.webSearchChatHistory);
  const [_isClientDebugConsoleEnabled, _setClientDebugConsoleEnabled] = useState<boolean>(defaultState.isClientDebugConsoleEnabled);
  const [_isClientDebugConsoleOpen, _setClientDebugConsoleOpen] = useState<boolean>(defaultState.isClientDebugConsoleOpen);
  const [_logSourceConfig, _setLogSourceConfig] = useState<LogSourceConfig>(defaultState.logSourceConfig);
  const [_targetFsmDisplayState, _setTargetFsmDisplayState] = useState<GlobalFsmState | null>(defaultState.targetFsmDisplayState);
  const [_mainTabFsmDisplay, _setMainTabFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.mainTabFsmDisplay);
  const [_chatbotFsmDisplay, _setChatbotFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.chatbotFsmDisplay);
  const [_debugConsoleMenuFsmDisplayInternal, _setDebugConsoleMenuFsmDisplayInternal] = useState<FsmDisplayTuple | null>(defaultState.debugConsoleMenuFsmDisplay);
  const [_isReducedStartupLoggingEnabled, _setIsReducedStartupLoggingEnabled] = useState<boolean>(defaultState.isReducedStartupLoggingEnabled);
  const [_isUiRenderLoggingEnabled, _setIsUiRenderLoggingEnabled] = useState<boolean>(defaultState.isUiRenderLoggingEnabled);
  const initialInitializationDispatchedRef = useRef(false);
  
  const [appDataChatActionState, appDataChatFormAction, isAppDataChatPending] = useActionState<AppDataChatActionState, AppDataChatActionInputs>(appDataChatAction, { status: 'idle' });

  const logDebug = useCallback((source: LogSourceId, category: string, ...messages: any[]) => {
      console.debug(LOGDEBUG_MARKER, source, category, ...messages);
  }, []);

  const setAndLogJson = useCallback((setter: React.Dispatch<React.SetStateAction<string>>, name: string, value: string) => {
    setter(value);
  }, []);

  const contextSetters: StockAnalysisContextSetters = useMemo(() => ({
    setPolygonApiRequestLogJson: (json: string) => setAndLogJson(_setPolygonApiRequestLogJson, 'polygonApiRequestLogJson', json),
    setPolygonApiResponseLogJson: (json: string) => setAndLogJson(_setPolygonApiResponseLogJson, 'polygonApiResponseLogJson', json),
    setMarketStatusJson: (json: string) => setAndLogJson(_setMarketStatusJson, 'marketStatusJson', json),
    setStockSnapshotJson: (json: string) => setAndLogJson(_setStockSnapshotJson, 'stockSnapshotJson', json),
    setStandardTasJson: (json: string) => setAndLogJson(_setStandardTasJson, 'standardTasJson', json),
    setOptionsChainJson: (json: string) => setAndLogJson(_setOptionsChainJson, 'optionsChainJson', json),
    setAiAnalyzedTaRequestJson: (json: string) => setAndLogJson(_setAiAnalyzedTaRequestJson, 'aiAnalyzedTaRequestJson', json),
    setAiAnalyzedTaJson: (json: string) => setAndLogJson(_setAiAnalyzedTaJson, 'aiAnalyzedTaJson', json),
    setAiOptionsAnalysisRequestJson: (json: string) => setAndLogJson(_setAiOptionsAnalysisRequestJson, 'aiOptionsAnalysisRequestJson', json),
    setAiOptionsAnalysisJson: (json: string) => setAndLogJson(_setAiOptionsAnalysisJson, 'aiOptionsAnalysisJson', json),
    setAiKeyTakeawaysRequestJson: (json: string) => setAndLogJson(_setAiKeyTakeawaysRequestJson, 'aiKeyTakeawaysRequestJson', json),
    setAiKeyTakeawaysJson: (json: string) => setAndLogJson(_setAiKeyTakeawaysJson, 'aiKeyTakeawaysJson', json),
    setUserInputAppDataChatRequestJson: (json: string) => setAndLogJson(_setUserInputAppDataChatRequestJson, 'userInputAppDataChatRequestJson', json),
    setUserInputAppDataChatResponseJson: (json: string) => setAndLogJson(_setUserInputAppDataChatResponseJson, 'userInputAppDataChatResponseJson', json),
    setStockTraderTakeawaysRequestJson: (json: string) => setAndLogJson(_setStockTraderTakeawaysRequestJson, 'stockTraderTakeawaysRequestJson', json),
    setStockTraderTakeawaysResponseJson: (json: string) => setAndLogJson(_setStockTraderTakeawaysResponseJson, 'stockTraderTakeawaysResponseJson', json),
    setOptionsTraderTakeawaysRequestJson: (json: string) => setAndLogJson(_setOptionsTraderTakeawaysRequestJson, 'optionsTraderTakeawaysRequestJson', json),
    setOptionsTraderTakeawaysResponseJson: (json: string) => setAndLogJson(_setOptionsTraderTakeawaysResponseJson, 'optionsTraderTakeawaysResponseJson', json),
    setHolisticTakeawaysRequestJson: (json: string) => setAndLogJson(_setHolisticTakeawaysRequestJson, 'holisticTakeawaysRequestJson', json),
    setHolisticTakeawaysResponseJson: (json: string) => setAndLogJson(_setHolisticTakeawaysResponseJson, 'holisticTakeawaysResponseJson', json),
    setUserInputWebSearchChatRequestJson: (json: string) => setAndLogJson(_setUserInputWebSearchChatRequestJson, 'userInputWebSearchChatRequestJson', json),
    setUserInputWebSearchChatResponseJson: (json: string) => setAndLogJson(_setUserInputWebSearchChatResponseJson, 'userInputWebSearchChatResponseJson', json),
    setRawTaWebSearchRequestJson: (json: string) => setAndLogJson(_setRawTaWebSearchRequestJson, 'rawTaWebSearchRequestJson', json),
    setRawTaWebSearchResponseJson: (json: string) => setAndLogJson(_setRawTaWebSearchResponseJson, 'rawTaWebSearchResponseJson', json),
    setRawOptionsWebSearchRequestJson: (json: string) => setAndLogJson(_setRawOptionsWebSearchRequestJson, 'rawOptionsWebSearchRequestJson', json),
    setRawOptionsWebSearchResponseJson: (json: string) => setAndLogJson(_setRawOptionsWebSearchResponseJson, 'rawOptionsWebSearchResponseJson', json),
  }), [setAndLogJson]);

  const setLogSourceEnabled = useCallback((source: LogSourceId, enabled: boolean) => {
    _setLogSourceConfig(prevConfig => {
      const newConfig = { ...prevConfig, [source]: enabled };
      logDebug('StockAnalysisContext', 'LogConfigChange', `Log source '${source}' ${enabled ? 'ENABLED' : 'DISABLED'}.`);
      return newConfig;
    });
  }, [_setLogSourceConfig, logDebug]);

  const addAppDataChatMessage = useCallback((message: AppDataChatMessage) => {
    _setAppDataChatHistory(prev => {
      const uniqueMessageId = `${Date.now()}_${chatMessageIdCounter++}_${message.role}_ctx_app`;
      const uniqueMessage: AppDataChatMessage = { ...message, id: uniqueMessageId };
      if (prev.length > 0 && prev[prev.length - 1].role === message.role && prev[prev.length - 1].content === message.content) {
        logDebug('StockAnalysisContext', 'GlobalChatHistoryUpdate_Guard', `Skipped adding duplicate app data chat message from ${message.role}.`);
        return prev;
      }
      logDebug('StockAnalysisContext', 'GlobalChatHistoryUpdate_Add', `Added app data chat message from ${uniqueMessage.role} with ID ${uniqueMessage.id}.`);
      return [...prev, uniqueMessage];
    });
  }, [_setAppDataChatHistory, logDebug]);

  const clearAppDataChatHistory = useCallback(() => {
    _setAppDataChatHistory([]);
    logDebug('StockAnalysisContext', 'GlobalChatHistoryUpdate_Clear', 'App data chat history CLEARED.');
  }, [_setAppDataChatHistory, logDebug]);

  const addWebSearchChatMessage = useCallback((message: AppDataChatMessage) => {
    _setWebSearchChatHistory(prev => {
      const uniqueMessageId = `${Date.now()}_${chatMessageIdCounter++}_${message.role}_ctx_web`;
      const uniqueMessage: AppDataChatMessage = { ...message, id: uniqueMessageId };
      if (prev.length > 0 && prev[prev.length - 1].role === message.role && prev[prev.length - 1].content === message.content) {
        logDebug('StockAnalysisContext', 'GlobalChatHistoryUpdate_Guard', `Skipped adding duplicate web search chat message from ${message.role}.`);
        return prev;
      }
      logDebug('StockAnalysisContext', 'GlobalChatHistoryUpdate_Add', `Added web search chat message from ${uniqueMessage.role} with ID ${uniqueMessage.id}.`);
      return [...prev, uniqueMessage];
    });
  }, [_setWebSearchChatHistory, logDebug]);

  const clearWebSearchChatHistory = useCallback(() => {
    _setWebSearchChatHistory([]);
    logDebug('StockAnalysisContext', 'GlobalChatHistoryUpdate_Clear', 'Web search chat history CLEARED.');
  }, [_setWebSearchChatHistory, logDebug]);

  const setAllPlaceholdersInternal = useCallback((currentTickerForLogOnly: string, isFullAnalysis: boolean) => {
    logDebug('StockAnalysisContext','GlobalFSM_Action_Util', `Resetting analysis JSONs to PENDING for ${currentTickerForLogOnly}. Full analysis: ${isFullAnalysis}.`);
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
        contextSetters.setUserInputAppDataChatRequestJson(chatPendingJson);
        contextSetters.setUserInputAppDataChatResponseJson(chatPendingJson);
        contextSetters.setStockTraderTakeawaysRequestJson(chatPendingJson);
        contextSetters.setStockTraderTakeawaysResponseJson(chatPendingJson);
        contextSetters.setOptionsTraderTakeawaysRequestJson(chatPendingJson);
        contextSetters.setOptionsTraderTakeawaysResponseJson(chatPendingJson);
        contextSetters.setHolisticTakeawaysRequestJson(chatPendingJson);
        contextSetters.setHolisticTakeawaysResponseJson(chatPendingJson);
        contextSetters.setUserInputWebSearchChatRequestJson(chatPendingJson);
        contextSetters.setUserInputWebSearchChatResponseJson(chatPendingJson);
        contextSetters.setRawTaWebSearchRequestJson(chatPendingJson);
        contextSetters.setRawTaWebSearchResponseJson(chatPendingJson);
        contextSetters.setRawOptionsWebSearchRequestJson(chatPendingJson);
        contextSetters.setRawOptionsWebSearchResponseJson(chatPendingJson);
    }
  }, [logDebug, contextSetters]);

  const enableAllLogSources = useCallback(() => {
    logDebug('StockAnalysisContext', 'LogConfigChange', 'Enable All Log Sources button clicked.');
    const newConfig: LogSourceConfig = {} as LogSourceConfig;
    logSourceIds.forEach(id => { newConfig[id] = true; });
    newConfig.DebugConsole = true; 
    _setLogSourceConfig(newConfig);
  }, [_setLogSourceConfig, logDebug]);

  const disableAllLogSources = useCallback(() => {
    logDebug('StockAnalysisContext', 'LogConfigChange', 'Disable All Log Sources button clicked.');
    const newConfig: LogSourceConfig = {} as LogSourceConfig;
    logSourceIds.forEach(id => { newConfig[id] = id === 'DebugConsole'; }); 
    _setLogSourceConfig(newConfig);
  }, [_setLogSourceConfig, logDebug]);

  const setClientDebugConsoleEnabled = useCallback((enabled: boolean) => {
    logDebug('StockAnalysisContext', 'DebugConsoleUIToggle', `ClientDebugConsoleEnabled toggled to: ${enabled}.`);
    _setClientDebugConsoleEnabled(enabled);
    if (enabled) {
        enableAllLogSources(); 
        _setLogSourceConfig(prevConfig => ({ ...prevConfig, OptionsChainTable: false })); 
        logDebug('StockAnalysisContext', 'LogConfigChange', `OptionsChainTable log source explicitly DISABLED after enabling all.`);
        _setClientDebugConsoleOpen(true); 
    } else {
      _setClientDebugConsoleOpen(false); 
    }
  }, [_isClientDebugConsoleEnabled, _setClientDebugConsoleOpen, enableAllLogSources, logDebug]);

  const setMainTabFsmDisplay = useCallback((display: FsmDisplayTuple | null) => {
    _setMainTabFsmDisplay(prevDisplay => {
      const hasChanged = !prevDisplay || !(prevDisplay.current === display?.current && prevDisplay.previous === display?.previous && prevDisplay.target === display?.target);
      if (hasChanged) { logDebug('StockAnalysisContext', 'FSMDisplayTupleUpdate', 'MainTabFsmDisplay updated.', display); return display; }
      return prevDisplay;
    });
  }, [_setMainTabFsmDisplay, logDebug]);

  const setChatbotFsmDisplay = useCallback((display: FsmDisplayTuple | null) => {
    _setChatbotFsmDisplay(prevDisplay => {
      const hasChanged = !prevDisplay || !(prevDisplay.current === display?.current && prevDisplay.previous === display?.previous && prevDisplay.target === display?.target);
      if (hasChanged) { logDebug('StockAnalysisContext', 'FSMDisplayTupleUpdate', 'ChatbotFsmDisplay updated.', display); return display; }
      return prevDisplay;
    });
  }, [_setChatbotFsmDisplay, logDebug]);

  const setReducedStartupLoggingEnabled = useCallback((enabled: boolean) => {
    logDebug('DebugSettingsCard', 'Reduced startup logging toggled to: ${enabled}');
    _setIsReducedStartupLoggingEnabled(enabled);
  }, [logDebug]);

  const setUiRenderLoggingEnabled = useCallback((enabled: boolean) => {
    logDebug('DebugSettingsCard', 'UI Render log spam toggled to: ${enabled}');
    _setIsUiRenderLoggingEnabled(enabled);
  }, [logDebug]);


  const fsmReducer = (state: GlobalFsmReducerManagedState, event: FsmEvent): GlobalFsmReducerManagedState => {
    const previousState = state.current;
    const logPrefixFsmReducer = 'StockAnalysisContext:GlobalFSM';
    logDebug(logPrefixFsmReducer as LogSourceId, 'ReducerEntry', `Event: ${event.type}, FromState: ${previousState}, ActiveProfile: ${state.variables.activePipelineProfile}`);

    if ('payload' in event && event.type.includes('CHAT') && !(event.type.includes('SUCCESS') || event.type.includes('ERROR'))) {
      logDebug(logPrefixFsmReducer as LogSourceId, 'EventPayload_Chat', `For ${event.type}: UserInput: ${(event.payload as any).userInput?.substring(0,50)}..., PromptName: ${(event.payload as any).promptName}`);
    } else if ('payload' in event && event.type !== 'USER_INPUT_TICKER_CHANGED' && event.type !== 'UPDATE_MANUAL_ACTION_FLAGS' && event.type !== 'ANALYSIS_TOGGLE_CHANGED') {
      logDebug(logPrefixFsmReducer as LogSourceId, 'EventPayload', `For ${event.type}:`, JSON.stringify(event.payload).substring(0, 150));
    }


    let nextCurrentState: GlobalFsmState = previousState;
    let nextVariables: GlobalFsmContextVariables = { ...state.variables };
    let nextFlags: GlobalFsmFlags = { ...state.flags };
    const errorJsonWithDetails = (message: string, details: string | null | undefined) => `{ "status": "error", "message": "${message.replace(/"/g, '\\"')}", "details": "${(details || '').replace(/"/g, '\\"')}" }`;

    const resetForNewAnalysis = (ticker: string) => {
        nextVariables.activeTicker = ticker;
        nextVariables.lastError = null;
        nextVariables.pendingAppDataChatSubmissionPayload = null;
        nextVariables.activePipelineProfile = 'standard';
        nextVariables.completedChatPrompts = [];
        nextFlags.canAnalyzeStock = false;
        nextFlags.isMarketDataReady = false; nextFlags.isSnapshotDataReady = false;
        nextFlags.isStandardTADataReady = false; nextFlags.isOptionsChainDataReady = false;
        nextFlags.isCalculatedTADataReady = false;
        nextFlags.isKeyTakeawaysDataAvailable = false;
        nextFlags.isOptionsAnalysisDataAvailable = false;
        setAllPlaceholdersInternal(ticker, true);
    };

    const handlePipelineError = (source: string, errorMessage: string, errorDetails?: any) => {
        nextVariables.lastError = { message: errorMessage, source, details: errorDetails };
        nextVariables.activePipelineProfile = null;
    };
    
    const handleAppDataChatSuccess = (payload: AppDataChatActionSuccessPayload) => {
        try {
            const flowOutput = JSON.parse(payload.chatbotResponseJson);
            if (flowOutput.response) { addAppDataChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_model_ctx_app_succ`, role: 'model', content: flowOutput.response }); }
            else if (flowOutput.error) { addAppDataChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_model_ctx_app_err`, role: 'model', content: `Chatbot Error: ${flowOutput.error}` }); }
        } catch (e) {
            addAppDataChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_model_ctx_parse_err`, role: 'model', content: "Error parsing chatbot response." });
        }
        if (payload.promptName) {
            nextVariables.completedChatPrompts.push(payload.promptName);
        }
        nextVariables.lastError = null;
    };

    const handleAppDataChatError = (payload: AppDataChatActionErrorPayload) => {
        const chatErrMsg = payload.message || 'Chat failed';
        addAppDataChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_model_ctx_act_err`, role: 'model', content: `Error: ${chatErrMsg}` });
        handlePipelineError('AppDataChatAction', chatErrMsg, payload.error);
    };

    switch (event.type) {
      case 'ANALYSIS_TOGGLE_CHANGED':
        const { toggleType, isEnabled } = event.payload;
        switch (toggleType) {
          case 'ai_key_takeaways': nextFlags.isAiKeyTakeawaysSelected = isEnabled; break;
          case 'ai_options_analysis': nextFlags.isAiOptionsAnalysisSelected = isEnabled; break;
          case 'ai_chat_stock_trader': nextFlags.isAiChatStockTraderTakeawaysSelected = isEnabled; break;
          case 'ai_chat_options_trader': nextFlags.isAiChatOptionsTraderTakeawaysSelected = isEnabled; break;
          case 'ai_chat_holistic': nextFlags.isAiChatHolisticTakeawaysSelected = isEnabled; break;
          case 'web_search_ta': nextFlags.isWebSearchTaEnabled = isEnabled; break;
          case 'web_search_options': nextFlags.isWebSearchOptionsEnabled = isEnabled; break;
        }
        logDebug(logPrefixFsmReducer as LogSourceId, 'FlagsUpdate_Toggle', `Flag '${toggleType}' set to ${isEnabled}.`);
        nextCurrentState = previousState;
        break;
      case 'START_FULL_ANALYSIS':
        resetForNewAnalysis(event.payload.ticker);
        nextCurrentState = GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `START_FULL_ANALYSIS for ${event.payload.ticker}. To PIPELINE_REQUESTED_DATA_FETCH.`);
        break;
      case 'INITIALIZATION_COMPLETE':
        if (previousState === GlobalFsmState.APP_INITIALIZING) {
            nextCurrentState = nextVariables.userInputTicker.trim() !== "" ? GlobalFsmState.VALID_TICKER_ENTERED : GlobalFsmState.AWAITING_TICKER_INPUT;
            logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `APP_INITIALIZING -> INITIALIZATION_COMPLETE. To ${nextCurrentState}.`);
        } else { logDebug(logPrefixFsmReducer as LogSourceId, 'Guard', `Ignoring INITIALIZATION_COMPLETE, not in APP_INITIALIZING state.`); }
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
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `USER_INPUT_TICKER_CHANGED. To ${nextCurrentState}.`);
        break;
      case 'DATA_FETCH_IN_PROGRESS':
        nextCurrentState = GlobalFsmState.DATA_FETCH_IN_PROGRESS;
        break;
      case 'FETCH_DATA_SUCCESS':
        contextSetters.setMarketStatusJson(event.payload.marketStatusJson); contextSetters.setStockSnapshotJson(event.payload.stockSnapshotJson);
        contextSetters.setStandardTasJson(event.payload.standardTasJson); contextSetters.setOptionsChainJson(event.payload.optionsChainJson);
        contextSetters.setPolygonApiRequestLogJson(event.payload.polygonApiRequestLogJson); contextSetters.setPolygonApiResponseLogJson(event.payload.polygonApiResponseLogJson);
        nextFlags.isMarketDataReady = true; nextFlags.isSnapshotDataReady = true; nextFlags.isStandardTADataReady = true; nextFlags.isOptionsChainDataReady = true;
        nextCurrentState = GlobalFsmState.DATA_FETCH_SUCCEEDED;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To DATA_FETCH_SUCCEEDED.`);
        break;
      case 'FETCH_DATA_FAILURE':
        const fetchErr = event.payload; const fetchErrMsg = fetchErr.message || 'Data fetch failed';
        const fetchErrorJson = errorJsonWithDetails(fetchErrMsg, fetchErr.error);
        contextSetters.setMarketStatusJson(fetchErrorJson); contextSetters.setStockSnapshotJson(fetchErrorJson);
        contextSetters.setStandardTasJson(fetchErrorJson); contextSetters.setOptionsChainJson(fetchErrorJson);
        contextSetters.setPolygonApiRequestLogJson(fetchErr.polygonApiRequestLogJson || fetchErrorJson); contextSetters.setPolygonApiResponseLogJson(fetchErr.polygonApiResponseLogJson || fetchErrorJson);
        handlePipelineError('DataFetch', fetchErrMsg, fetchErr.error);
        nextCurrentState = GlobalFsmState.DATA_FETCH_FAILED;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To DATA_FETCH_FAILED. Error: ${fetchErrMsg}.`);
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
        nextCurrentState = GlobalFsmState.ERROR_STALE_DATA;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To ERROR_STALE_DATA. Error: ${staleErrMsg}.`);
        break;
      case 'AI_TA_SUCCESS':
        contextSetters.setAiAnalyzedTaRequestJson(event.payload.aiCalculatedTaRequestJson); contextSetters.setAiAnalyzedTaJson(event.payload.aiCalculatedTaJson);
        nextFlags.isCalculatedTADataReady = true;
        nextCurrentState = GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED;
        nextVariables.isInitialLoad = false;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To AI_TA_CALCULATION_SUCCEEDED. isInitialLoad set to false.`);
        break;
      case 'AI_TA_FAILURE':
        const aiTaErr = event.payload; const aiTaErrMsg = aiTaErr.message || 'AI TA analysis failed';
        const aiTaErrorJson = errorJsonWithDetails(aiTaErrMsg, aiTaErr.error);
        contextSetters.setAiAnalyzedTaRequestJson(aiTaErr.aiAnalyzedTaRequestJson || aiTaErrorJson); contextSetters.setAiAnalyzedTaJson(aiTaErrorJson);
        handlePipelineError('AITaCalculation', aiTaErrMsg, aiTaErr.error);
        nextCurrentState = GlobalFsmState.AI_TA_CALCULATION_FAILED;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To AI_TA_CALCULATION_FAILED. Error: ${aiTaErrMsg}.`);
        break;
      case 'TRIGGER_MANUAL_KEY_TAKEAWAYS':
        if (state.current !== GlobalFsmState.GENERATING_KEY_TAKEAWAYS) {
          contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
          contextSetters.setAiKeyTakeawaysJson(pendingJson);
          nextCurrentState = GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
        }
        break;
      case 'TRIGGER_MANUAL_OPTIONS_ANALYSIS':
        if (state.current !== GlobalFsmState.ANALYZING_OPTIONS) {
          contextSetters.setAiOptionsAnalysisRequestJson(pendingJson);
          contextSetters.setAiOptionsAnalysisJson(pendingJson);
          nextCurrentState = GlobalFsmState.ANALYZING_OPTIONS;
        }
        break;
      case 'KEY_TAKEAWAYS_SUCCESS':
        contextSetters.setAiKeyTakeawaysRequestJson(event.payload.aiKeyTakeawaysRequestJson); contextSetters.setAiKeyTakeawaysJson(event.payload.aiKeyTakeawaysJson);
        nextFlags.isKeyTakeawaysDataAvailable = true;
        if(state.variables.activePipelineProfile !== 'standard') { nextCurrentState = GlobalFsmState.IDLE; }
        else { nextCurrentState = GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED; }
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To ${nextCurrentState}.`);
        break;
      case 'KEY_TAKEAWAYS_FAILURE':
        const ktErr = event.payload; const ktErrMsg = ktErr.message || 'AI Key Takeaways failed';
        const ktErrorJson = errorJsonWithDetails(ktErrMsg, ktErr.error);
        contextSetters.setAiKeyTakeawaysRequestJson(ktErr.aiKeyTakeawaysRequestJson || ktErrorJson); contextSetters.setAiKeyTakeawaysJson(ktErrorJson);
        handlePipelineError('KeyTakeaways', ktErrMsg, ktErr.error);
        if(state.variables.activePipelineProfile !== 'standard') { nextCurrentState = GlobalFsmState.IDLE; }
        else { nextCurrentState = GlobalFsmState.KEY_TAKEAWAYS_FAILED; }
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To ${nextCurrentState}. Error: ${ktErrMsg}.`);
        break;
      case 'OPTIONS_ANALYSIS_SUCCESS':
        contextSetters.setAiOptionsAnalysisRequestJson(event.payload.aiOptionsAnalysisRequestJson); contextSetters.setAiOptionsAnalysisJson(event.payload.aiOptionsAnalysisJson);
        nextFlags.isOptionsAnalysisDataAvailable = true;
        if(state.variables.activePipelineProfile !== 'standard') { nextCurrentState = GlobalFsmState.IDLE; }
        else { nextCurrentState = GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED; }
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To ${nextCurrentState}.`);
        break;
      case 'OPTIONS_ANALYSIS_FAILURE':
        const optErr = event.payload; const optErrMsg = optErr.message || 'AI Options Analysis failed';
        const optErrorJson = errorJsonWithDetails(optErrMsg, optErr.error);
        contextSetters.setAiOptionsAnalysisRequestJson(optErr.aiOptionsAnalysisRequestJson || optErrorJson); contextSetters.setAiOptionsAnalysisJson(optErrorJson);
        handlePipelineError('OptionsAnalysis', optErrMsg, optErr.error);
        if(state.variables.activePipelineProfile !== 'standard') { nextCurrentState = GlobalFsmState.IDLE; }
        else { nextCurrentState = GlobalFsmState.OPTIONS_ANALYSIS_FAILED; }
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To ${nextCurrentState}. Error: ${optErrMsg}.`);
        break;
      
      case 'SUBMIT_USER_INPUT_APP_DATA_CHAT':
        addAppDataChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_user_gbl_fsm`, role: 'user', content: event.payload.userInput });
        nextVariables.pendingAppDataChatSubmissionPayload = event.payload;
        nextVariables.activePipelineProfile = null;
        nextCurrentState = GlobalFsmState.USER_INPUT_APP_DATA_CHAT_PENDING;
        break;
      case 'SUBMIT_STOCK_TRADER_TAKEAWAYS_CHAT':
        addAppDataChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_user_gbl_fsm`, role: 'user', content: event.payload.userInput });
        nextVariables.pendingAppDataChatSubmissionPayload = event.payload;
        nextCurrentState = GlobalFsmState.STOCK_TRADER_CHAT_PENDING;
        break;
      case 'SUBMIT_OPTIONS_TRADER_TAKEAWAYS_CHAT':
        addAppDataChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_user_gbl_fsm`, role: 'user', content: event.payload.userInput });
        nextVariables.pendingAppDataChatSubmissionPayload = event.payload;
        nextCurrentState = GlobalFsmState.OPTIONS_TRADER_CHAT_PENDING;
        break;
      case 'SUBMIT_HOLISTIC_TAKEAWAYS_CHAT':
        addAppDataChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_user_gbl_fsm`, role: 'user', content: event.payload.userInput });
        nextVariables.pendingAppDataChatSubmissionPayload = event.payload;
        nextCurrentState = GlobalFsmState.HOLISTIC_CHAT_PENDING;
        break;

      case 'USER_INPUT_APP_DATA_CHAT_ACTION_SUCCESS':
        contextSetters.setUserInputAppDataChatRequestJson(event.payload.chatbotRequestJson);
        contextSetters.setUserInputAppDataChatResponseJson(event.payload.chatbotResponseJson);
        handleAppDataChatSuccess(event.payload);
        nextCurrentState = GlobalFsmState.IDLE;
        break;
      case 'STOCK_TRADER_TAKEAWAYS_CHAT_ACTION_SUCCESS':
        contextSetters.setStockTraderTakeawaysRequestJson(event.payload.chatbotRequestJson);
        contextSetters.setStockTraderTakeawaysResponseJson(event.payload.chatbotResponseJson);
        handleAppDataChatSuccess(event.payload);
        nextCurrentState = state.variables.activePipelineProfile === 'standard' ? GlobalFsmState.PIPELINE_PAUSED : GlobalFsmState.IDLE;
        break;
      case 'OPTIONS_TRADER_TAKEAWAYS_CHAT_ACTION_SUCCESS':
        contextSetters.setOptionsTraderTakeawaysRequestJson(event.payload.chatbotRequestJson);
        contextSetters.setOptionsTraderTakeawaysResponseJson(event.payload.chatbotResponseJson);
        handleAppDataChatSuccess(event.payload);
        nextCurrentState = state.variables.activePipelineProfile === 'standard' ? GlobalFsmState.PIPELINE_PAUSED : GlobalFsmState.IDLE;
        break;
      case 'HOLISTIC_TAKEAWAYS_CHAT_ACTION_SUCCESS':
        contextSetters.setHolisticTakeawaysRequestJson(event.payload.chatbotRequestJson);
        contextSetters.setHolisticTakeawaysResponseJson(event.payload.chatbotResponseJson);
        handleAppDataChatSuccess(event.payload);
        nextCurrentState = state.variables.activePipelineProfile === 'standard' ? GlobalFsmState.PIPELINE_PAUSED : GlobalFsmState.IDLE;
        break;

      case 'USER_INPUT_APP_DATA_CHAT_ACTION_ERROR':
        contextSetters.setUserInputAppDataChatRequestJson(event.payload.chatbotRequestJson || errorJsonWithDetails("Request unavailable", null));
        contextSetters.setUserInputAppDataChatResponseJson(event.payload.chatbotResponseJson || errorJsonWithDetails(event.payload.message || "Error", null));
        handleAppDataChatError(event.payload);
        nextCurrentState = GlobalFsmState.IDLE;
        break;
      case 'STOCK_TRADER_TAKEAWAYS_CHAT_ACTION_ERROR':
        contextSetters.setStockTraderTakeawaysRequestJson(event.payload.chatbotRequestJson || errorJsonWithDetails("Request unavailable", null));
        contextSetters.setStockTraderTakeawaysResponseJson(event.payload.chatbotResponseJson || errorJsonWithDetails(event.payload.message || "Error", null));
        handleAppDataChatError(event.payload);
        nextCurrentState = state.variables.activePipelineProfile === 'standard' ? GlobalFsmState.PIPELINE_PAUSED : GlobalFsmState.IDLE;
        break;
      case 'OPTIONS_TRADER_TAKEAWAYS_CHAT_ACTION_ERROR':
        contextSetters.setOptionsTraderTakeawaysRequestJson(event.payload.chatbotRequestJson || errorJsonWithDetails("Request unavailable", null));
        contextSetters.setOptionsTraderTakeawaysResponseJson(event.payload.chatbotResponseJson || errorJsonWithDetails(event.payload.message || "Error", null));
        handleAppDataChatError(event.payload);
        nextCurrentState = state.variables.activePipelineProfile === 'standard' ? GlobalFsmState.PIPELINE_PAUSED : GlobalFsmState.IDLE;
        break;
      case 'HOLISTIC_TAKEAWAYS_CHAT_ACTION_ERROR':
        contextSetters.setHolisticTakeawaysRequestJson(event.payload.chatbotRequestJson || errorJsonWithDetails("Request unavailable", null));
        contextSetters.setHolisticTakeawaysResponseJson(event.payload.chatbotResponseJson || errorJsonWithDetails(event.payload.message || "Error", null));
        handleAppDataChatError(event.payload);
        nextCurrentState = state.variables.activePipelineProfile === 'standard' ? GlobalFsmState.PIPELINE_PAUSED : GlobalFsmState.IDLE;
        break;
      
      case 'FINALIZE_AUTOMATED_PIPELINE':
        nextCurrentState = GlobalFsmState.IDLE;
        nextVariables.activePipelineProfile = null;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To IDLE after pipeline finalization.`);
        break;
      case 'TOGGLE_DEBUG_CONSOLE_MENU':
        const { menu, isOpen } = event.payload;
        nextFlags.isDebugConsoleFilterMenuOpen = menu === 'filter' && isOpen;
        nextFlags.isDebugConsoleCopyMenuOpen = menu === 'copy' && isOpen;
        nextFlags.isDebugConsoleExportMenuOpen = menu === 'export' && isOpen;
        logDebug(logPrefixFsmReducer as LogSourceId, 'FlagsUpdate_DebugMenu', `Menu: ${menu}, isOpen: ${isOpen}.`);
        break;
      case 'UPDATE_MANUAL_ACTION_FLAGS':
        nextFlags.isManualKeyTakeawaysActionPossible = event.payload.ktPossible;
        nextFlags.isManualOptionsAnalysisActionPossible = event.payload.optPossible;
        logDebug(logPrefixFsmReducer as LogSourceId, 'FlagsUpdate_ManualActions', `KT possible: ${event.payload.ktPossible}, Opt possible: ${event.payload.optPossible}.`);
        nextCurrentState = previousState;
        break;
      case 'RESUME_PIPELINE':
        if (previousState === GlobalFsmState.PIPELINE_PAUSED) {
            nextCurrentState = GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED;
            logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `Resuming pipeline from PAUSED to AI_TA_CALCULATION_SUCCEEDED.`);
        } else {
            logDebug(logPrefixFsmReducer as LogSourceId, 'Guard', `Ignoring RESUME_PIPELINE, not in PAUSED state.`);
        }
        break;
      default:
        logDebug(logPrefixFsmReducer as LogSourceId, 'UnhandledEvent', `Unhandled event type: ${(event as any).type} in state ${previousState}`);
    }

    if ([
        GlobalFsmState.IDLE, GlobalFsmState.VALID_TICKER_ENTERED, GlobalFsmState.AWAITING_TICKER_INPUT,
        GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE, GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED,
        GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED,
        GlobalFsmState.USER_INPUT_APP_DATA_CHAT_SUCCESS, GlobalFsmState.USER_INPUT_APP_DATA_CHAT_ERROR,
        GlobalFsmState.STOCK_TRADER_CHAT_SUCCESS, GlobalFsmState.STOCK_TRADER_CHAT_ERROR,
        GlobalFsmState.OPTIONS_TRADER_CHAT_SUCCESS, GlobalFsmState.OPTIONS_TRADER_CHAT_ERROR,
        GlobalFsmState.HOLISTIC_CHAT_SUCCESS, GlobalFsmState.HOLISTIC_CHAT_ERROR,
        GlobalFsmState.DATA_FETCH_FAILED, GlobalFsmState.ERROR_STALE_DATA
    ].includes(nextCurrentState)) {
        nextFlags.canAnalyzeStock = true;
    } else {
        nextFlags.canAnalyzeStock = false;
    }

    logDebug(logPrefixFsmReducer as LogSourceId, 'StateExit', `Exiting reducer. OldState: ${previousState}, NewState: ${nextCurrentState}, CanAnalyze: ${nextFlags.canAnalyzeStock}`);
    return { current: nextCurrentState, previous: previousState, variables: nextVariables, flags: nextFlags };
  };

  const [globalFsmReducerState, _dispatchFsmEventActual] = useReducer(fsmReducer, defaultState.globalFsmState);
  const fsmStateRef = useRef<GlobalFsmReducerManagedState>(globalFsmReducerState);

  useEffect(() => {
    fsmStateRef.current = globalFsmReducerState;
    logDebug('StockAnalysisContext:GlobalFSM', 'StateChange', `Actual state updated. Prev: ${globalFsmReducerState.previous}, Curr: ${globalFsmReducerState.current}.`);
  }, [globalFsmReducerState, logDebug]);

  const dispatchFsmEvent = useCallback((event: FsmEvent) => {
    startTransition(() => {
      _dispatchFsmEventActual(event);
    });
  }, []);

  useEffect(() => {
    const logPrefix = 'StockAnalysisContext:AppDataChatActionEffect';
    if (appDataChatActionState.status === 'idle' || isAppDataChatPending) { return; }
    logDebug(logPrefix as LogSourceId, 'StateChanged', `Status: ${appDataChatActionState.status}, Message: ${appDataChatActionState.message}`);

    const currentState = fsmStateRef.current.current;
    let successEvent: FsmEvent['type'];
    let errorEvent: FsmEvent['type'];

    if (currentState === GlobalFsmState.USER_INPUT_APP_DATA_CHAT_PENDING) { successEvent = 'USER_INPUT_APP_DATA_CHAT_ACTION_SUCCESS'; errorEvent = 'USER_INPUT_APP_DATA_CHAT_ACTION_ERROR'; }
    else if (currentState === GlobalFsmState.STOCK_TRADER_CHAT_PENDING) { successEvent = 'STOCK_TRADER_TAKEAWAYS_CHAT_ACTION_SUCCESS'; errorEvent = 'STOCK_TRADER_TAKEAWAYS_CHAT_ACTION_ERROR'; }
    else if (currentState === GlobalFsmState.OPTIONS_TRADER_CHAT_PENDING) { successEvent = 'OPTIONS_TRADER_TAKEAWAYS_CHAT_ACTION_SUCCESS'; errorEvent = 'OPTIONS_TRADER_TAKEAWAYS_CHAT_ACTION_ERROR'; }
    else if (currentState === GlobalFsmState.HOLISTIC_CHAT_PENDING) { successEvent = 'HOLISTIC_TAKEAWAYS_CHAT_ACTION_SUCCESS'; errorEvent = 'HOLISTIC_TAKEAWAYS_CHAT_ACTION_ERROR'; }
    else { return; }

    if (appDataChatActionState.status === 'success' && appDataChatActionState.data) {
        let promptName; try { promptName = JSON.parse(appDataChatActionState.data.chatbotRequestJson).promptName; } catch(e){}
        dispatchFsmEvent({ type: successEvent, payload: { ...appDataChatActionState.data, promptName } } as FsmEvent);
    } else if (appDataChatActionState.status === 'error') {
        let promptName; try { promptName = JSON.parse(appDataChatActionState.data?.chatbotRequestJson || '{}').promptName; } catch(e){}
        dispatchFsmEvent({ type: errorEvent, payload: { ...appDataChatActionState, promptName } } as FsmEvent);
    }
  }, [appDataChatActionState, isAppDataChatPending, dispatchFsmEvent, logDebug]);
  
  const dispatchNextCustomAction = useCallback(() => {
    const state = fsmStateRef.current;
    const { flags, variables } = state;
    const { activeTicker, completedChatPrompts } = variables;
    const logPrefix = 'StockAnalysisContext:dispatchNextCustomAction';
  
    logDebug(logPrefix as LogSourceId, 'Execution', `Checking next action. Ticker: ${activeTicker}, Completed: [${completedChatPrompts.join(', ')}]`);

    if (!activeTicker) {
        logDebug(logPrefix as LogSourceId, 'Exit', 'No active ticker. Finalizing pipeline.');
        dispatchFsmEvent({ type: 'FINALIZE_AUTOMATED_PIPELINE' });
        return;
    }

    const baseAppDataChatPayload = { ticker: activeTicker, chatHistory: [], stockSnapshotJson: _stockSnapshotJson, aiKeyTakeawaysJson: _aiKeyTakeawaysJson, aiAnalyzedTaJson: _aiAnalyzedTaJson, aiOptionsAnalysisJson: _aiOptionsAnalysisJson };

    if (flags.isAiKeyTakeawaysSelected && !flags.isKeyTakeawaysDataAvailable) {
        logDebug(logPrefix as LogSourceId, 'Dispatch', 'Triggering manual key takeaways.');
        dispatchFsmEvent({ type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS', payload: { ticker: activeTicker } });
    } else if (flags.isAiOptionsAnalysisSelected && !flags.isOptionsAnalysisDataAvailable) {
        logDebug(logPrefix as LogSourceId, 'Dispatch', 'Triggering manual options analysis.');
        dispatchFsmEvent({ type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS', payload: { ticker: activeTicker } });
    } else if (flags.isAiChatStockTraderTakeawaysSelected && !completedChatPrompts.includes('stock-trader-takeaways')) {
        logDebug(logPrefix as LogSourceId, 'Dispatch', "Dispatching 'stock-trader-takeaways' chat.");
        dispatchFsmEvent({ type: 'SUBMIT_STOCK_TRADER_TAKEAWAYS_CHAT', payload: { ...baseAppDataChatPayload, userInput: 'stock-trader-takeaways', promptName: 'stock-trader-takeaways' } });
    } else if (flags.isAiChatOptionsTraderTakeawaysSelected && !completedChatPrompts.includes('options-trader-takeaways')) {
        logDebug(logPrefix as LogSourceId, 'Dispatch', "Dispatching 'options-trader-takeaways' chat.");
        dispatchFsmEvent({ type: 'SUBMIT_OPTIONS_TRADER_TAKEAWAYS_CHAT', payload: { ...baseAppDataChatPayload, userInput: 'options-trader-takeaways', promptName: 'options-trader-takeaways' } });
    } else if (flags.isAiChatHolisticTakeawaysSelected && !completedChatPrompts.includes('holistic-takeaways')) {
        logDebug(logPrefix as LogSourceId, 'Dispatch', "Dispatching 'holistic-takeaways' chat.");
        dispatchFsmEvent({ type: 'SUBMIT_HOLISTIC_TAKEAWAYS_CHAT', payload: { ...baseAppDataChatPayload, userInput: 'holistic-takeaways', promptName: 'holistic-takeaways' } });
    } else {
        logDebug(logPrefix as LogSourceId, 'Exit', 'All selected actions are complete. Finalizing pipeline.');
        dispatchFsmEvent({ type: 'FINALIZE_AUTOMATED_PIPELINE' });
    }
  }, [dispatchFsmEvent, _stockSnapshotJson, _aiKeyTakeawaysJson, _aiAnalyzedTaJson, _aiOptionsAnalysisJson, logDebug]);

  useEffect(() => {
    const orchestratePipeline = async () => {
      const state = fsmStateRef.current;
      const currentState = state.current;
  
      if (currentState === GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH) {
        dispatchFsmEvent({ type: 'DATA_FETCH_IN_PROGRESS' });
        const result = await fetchStockDataAction({ ticker: state.variables.activeTicker! });
        if (result.status === 'success' && result.data) {
          const expectedTicker = state.variables.activeTicker!;
          const receivedTicker = JSON.parse(result.data.stockSnapshotJson)?.ticker;
          if (receivedTicker && receivedTicker !== expectedTicker) {
            dispatchFsmEvent({ type: 'STALE_DATA_FROM_ACTION', payload: { error: 'Stale data detected', message: `Expected ${expectedTicker}, got ${receivedTicker}`, expectedTicker, foundTickerInSnapshot: receivedTicker, actionStateData: result.data }});
          } else {
            dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: result.data });
          }
        } else {
          dispatchFsmEvent({ type: 'FETCH_DATA_FAILURE', payload: { error: result.error, message: result.message, polygonApiRequestLogJson: result.data?.polygonApiRequestLogJson, polygonApiResponseLogJson: result.data?.polygonApiResponseLogJson } });
        }
      } else if (currentState === GlobalFsmState.DATA_FETCH_SUCCEEDED) {
        dispatchFsmEvent({ type: GlobalFsmState.CALCULATING_AI_TA });
        const result = await calculateAiTaAction({ stockSnapshotJson: _stockSnapshotJson, ticker: state.variables.activeTicker! });
        if (result.status === 'success' && result.data) {
          dispatchFsmEvent({ type: 'AI_TA_SUCCESS', payload: result.data });
        } else {
          dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: result.error, message: result.message, aiAnalyzedTaRequestJson: result.data?.aiCalculatedTaRequestJson }});
        }
      } else if (currentState === GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED && state.variables.activePipelineProfile === 'standard') {
        dispatchNextCustomAction();
      } else if (currentState === GlobalFsmState.GENERATING_KEY_TAKEAWAYS) {
        const result = await performAiAnalysisAction({ ticker: state.variables.activeTicker!, stockSnapshotJson: _stockSnapshotJson, standardTasJson: _standardTasJson, aiAnalyzedTaJson: _aiAnalyzedTaJson, marketStatusJson: _marketStatusJson });
        if (result.status === 'success' && result.data) {
          dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: result.data });
        } else {
          dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: result.error, message: result.message, aiKeyTakeawaysRequestJson: result.data?.aiKeyTakeawaysRequestJson }});
        }
      } else if (currentState === GlobalFsmState.ANALYZING_OPTIONS) {
        const result = await performAiOptionsAnalysisAction({ ticker: state.variables.activeTicker!, optionsChainJson: _optionsChainJson, stockSnapshotJson: _stockSnapshotJson });
        if (result.status === 'success' && result.data) {
          dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: result.data });
        } else {
          dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: result.error, message: result.message, aiOptionsAnalysisRequestJson: result.data?.aiOptionsAnalysisRequestJson }});
        }
      } else if ((currentState === GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED || currentState === GlobalFsmState.KEY_TAKEAWAYS_FAILED || currentState === GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED || currentState === GlobalFsmState.OPTIONS_ANALYSIS_FAILED) && state.variables.activePipelineProfile === 'standard') {
        dispatchNextCustomAction();
      } else if (
        currentState === GlobalFsmState.USER_INPUT_APP_DATA_CHAT_PENDING || 
        currentState === GlobalFsmState.STOCK_TRADER_CHAT_PENDING || 
        currentState === GlobalFsmState.OPTIONS_TRADER_CHAT_PENDING || 
        currentState === GlobalFsmState.HOLISTIC_CHAT_PENDING
      ) {
        if (state.variables.pendingAppDataChatSubmissionPayload) {
          startTransition(() => {
            appDataChatFormAction(state.variables.pendingAppDataChatSubmissionPayload!);
          });
        }
      }
    };
    orchestratePipeline();
  }, [globalFsmReducerState.current]);
  
  // New debouncing effect for the custom analysis pipeline
  useEffect(() => {
    const logPrefix = 'StockAnalysisContext:PipelinePauseEffect';
    if (globalFsmReducerState.current === GlobalFsmState.PIPELINE_PAUSED) {
        logDebug(logPrefix as LogSourceId, 'PauseTriggered', `Pipeline paused. Will resume in 50ms.`);
        const timer = setTimeout(() => {
            logDebug(logPrefix as LogSourceId, 'ResumeDispatch', `Resuming pipeline by dispatching RESUME_PIPELINE.`);
            dispatchFsmEvent({ type: 'RESUME_PIPELINE' });
        }, 50);

        return () => clearTimeout(timer);
    }
  }, [globalFsmReducerState.current, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    const logPrefix = 'StockAnalysisContext:ManualActionFlagEffect';
    const state = fsmStateRef.current;

    const manualActionsPossibleOverall =
      (state.current === GlobalFsmState.IDLE ||
        state.current === GlobalFsmState.VALID_TICKER_ENTERED ||
        state.current === GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE ||
        state.current === GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED ||
        state.current === GlobalFsmState.KEY_TAKEAWAYS_FAILED ||
        state.current === GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED ||
        state.current === GlobalFsmState.OPTIONS_ANALYSIS_FAILED ||
        state.current === GlobalFsmState.USER_INPUT_APP_DATA_CHAT_SUCCESS ||
        state.current === GlobalFsmState.USER_INPUT_APP_DATA_CHAT_ERROR ||
        state.current === GlobalFsmState.STOCK_TRADER_CHAT_SUCCESS ||
        state.current === GlobalFsmState.STOCK_TRADER_CHAT_ERROR ||
        state.current === GlobalFsmState.OPTIONS_TRADER_CHAT_SUCCESS ||
        state.current === GlobalFsmState.OPTIONS_TRADER_CHAT_ERROR ||
        state.current === GlobalFsmState.HOLISTIC_CHAT_SUCCESS ||
        state.current === GlobalFsmState.HOLISTIC_CHAT_ERROR) &&
      !!state.variables.activeTicker &&
      state.variables.activeTicker === state.variables.userInputTicker;

    const ktPrereqsMet =
      isDataReadyForProcessing(_stockSnapshotJson, logDebug, logPrefix as LogSourceId, 'KT_Snapshot', 'Validation') &&
      isDataReadyForProcessing(_standardTasJson, logDebug, logPrefix as LogSourceId, 'KT_StdTA', 'Validation') &&
      isDataReadyForProcessing(_aiAnalyzedTaJson, logDebug, logPrefix as LogSourceId, 'KT_AiTA', 'Validation') &&
      isDataReadyForProcessing(_marketStatusJson, logDebug, logPrefix as LogSourceId, 'KT_MarketStatus', 'Validation');
    const shouldKtButtonBeEnabled = manualActionsPossibleOverall && ktPrereqsMet;

    const optPrereqsMet =
      isDataReadyForProcessing(_stockSnapshotJson, logDebug, logPrefix as LogSourceId, 'Opt_Snapshot', 'Validation') &&
      isDataReadyForProcessing(_optionsChainJson, logDebug, logPrefix as LogSourceId, 'Opt_Chain', 'Validation');
    const shouldOptButtonBeEnabled = manualActionsPossibleOverall && optPrereqsMet;
    
    if (
      shouldKtButtonBeEnabled !== state.flags.isManualKeyTakeawaysActionPossible ||
      shouldOptButtonBeEnabled !== state.flags.isManualOptionsAnalysisActionPossible
    ) {
      logDebug(logPrefix as LogSourceId, 'Dispatch', `Dispatching UPDATE_MANUAL_ACTION_FLAGS. KT: ${shouldKtButtonBeEnabled}, OPT: ${shouldOptButtonBeEnabled}`);
      dispatchFsmEvent({
        type: 'UPDATE_MANUAL_ACTION_FLAGS',
        payload: {
          ktPossible: shouldKtButtonBeEnabled,
          optPossible: shouldOptButtonBeEnabled,
        },
      });
    }
  }, [
    globalFsmReducerState.current, 
    globalFsmReducerState.variables.activeTicker,
    globalFsmReducerState.variables.userInputTicker,
    globalFsmReducerState.flags.isManualKeyTakeawaysActionPossible,
    globalFsmReducerState.flags.isManualOptionsAnalysisActionPossible,
    _stockSnapshotJson, _standardTasJson, _aiAnalyzedTaJson,
    _marketStatusJson, _optionsChainJson,
    dispatchFsmEvent, logDebug
  ]);
  
  useEffect(() => {
    if (!initialInitializationDispatchedRef.current) {
        logDebug('StockAnalysisContext:GlobalFSM', 'Initialization', 'Dispatching INITIALIZATION_COMPLETE event on mount.');
        dispatchFsmEvent({ type: 'INITIALIZATION_COMPLETE' });
        initialInitializationDispatchedRef.current = true;
    }
  }, [dispatchFsmEvent, logDebug]);

  const setClientDebugConsoleOpen = useCallback((open: boolean) => {
    logDebug('StockAnalysisContext', 'DebugConsoleUIToggle', `ClientDebugConsoleOpen will be set to: ${open}. Current isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}`);
    if (_isClientDebugConsoleEnabled || !open) { _setClientDebugConsoleOpen(open); }
    else if (!_isClientDebugConsoleEnabled && open) { logDebug('StockAnalysisContext', 'DebugConsoleUIToggle', 'Attempted to open console while it is disabled. Opening action will be ignored.'); }
  }, [_isClientDebugConsoleEnabled, _setClientDebugConsoleOpen, logDebug]);
  
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
    webSearchChatHistory: _webSearchChatHistory, addWebSearchChatMessage, clearWebSearchChatHistory,
    isClientDebugConsoleEnabled: _isClientDebugConsoleEnabled, isClientDebugConsoleOpen: _isClientDebugConsoleOpen,
    logSourceConfig: _logSourceConfig, setClientDebugConsoleEnabled, setClientDebugConsoleOpen,
    setLogSourceEnabled, enableAllLogSources, disableAllLogSources, logDebug,
    fsmState: globalFsmReducerState.current, previousFsmState: globalFsmReducerState.previous,
    fsmVariables: globalFsmReducerState.variables, fsmFlags: globalFsmReducerState.flags,
    targetFsmDisplayState: _targetFsmDisplayState, dispatchFsmEvent,
    mainTabFsmDisplay: _mainTabFsmDisplay, setMainTabFsmDisplay,
    chatbotFsmDisplay: _chatbotFsmDisplay, setChatbotFsmDisplay,
    setReducedStartupLoggingEnabled, 
    isReducedStartupLoggingEnabled: _isReducedStartupLoggingEnabled,
    setUiRenderLoggingEnabled,
    isUiRenderLoggingEnabled: _isUiRenderLoggingEnabled,
  }), [
    _polygonApiRequestLogJson, contextSetters, _polygonApiResponseLogJson,
    _marketStatusJson, _stockSnapshotJson, _standardTasJson, _optionsChainJson,
    _aiAnalyzedTaRequestJson, _aiAnalyzedTaJson, _aiOptionsAnalysisRequestJson,
    _aiOptionsAnalysisJson, _aiKeyTakeawaysJson, _aiKeyTakeawaysJson,
    _userInputAppDataChatRequestJson, _userInputAppDataChatResponseJson,
    _stockTraderTakeawaysRequestJson, _stockTraderTakeawaysResponseJson,
    _optionsTraderTakeawaysRequestJson, _optionsTraderTakeawaysResponseJson,
    _holisticTakeawaysRequestJson, _holisticTakeawaysResponseJson,
    _appDataChatHistory, addAppDataChatMessage, clearAppDataChatHistory, 
    _userInputWebSearchChatRequestJson, _userInputWebSearchChatResponseJson,
    _rawTaWebSearchRequestJson, _rawTaWebSearchResponseJson, _rawOptionsWebSearchRequestJson, _rawOptionsWebSearchResponseJson,
    _webSearchChatHistory, addWebSearchChatMessage, clearWebSearchChatHistory,
    _isClientDebugConsoleEnabled, _isClientDebugConsoleOpen,
    _logSourceConfig, setClientDebugConsoleEnabled, setClientDebugConsoleOpen,
    setLogSourceEnabled, enableAllLogSources, disableAllLogSources, logDebug,
    globalFsmReducerState, _targetFsmDisplayState, dispatchFsmEvent,
    _mainTabFsmDisplay, setMainTabFsmDisplay, _chatbotFsmDisplay, setChatbotFsmDisplay,
    _isReducedStartupLoggingEnabled, setReducedStartupLoggingEnabled,
    _isUiRenderLoggingEnabled, setUiRenderLoggingEnabled,
  ]);
  
  useEffect(() => {
    const logPrefix = 'StockAnalysisContext:ConsoleInterceptor';
    if (typeof window === 'undefined') { return; }
    const currentOriginalsForInterceptor = (console as any).__stockSageContextOriginals || browserConsole;
    
    const interceptAndProcessLog = (type: LogType, ...args: any[]) => {
      currentOriginalsForInterceptor[type as Exclude<LogType, 'system'>](...args);
      queueMicrotask(() => {
        if (!_isClientDebugConsoleEnabled) return;
        let sourceForBuffer: LogSourceId = 'NATIVE_CONSOLE'; let messagesForBuffer = args; let typeForBuffer = type;
        if (args.length > 0 && args[0] === LOGDEBUG_MARKER) {
          sourceForBuffer = args[1] as LogSourceId;
          const category = args[2] as string;
          messagesForBuffer = args.slice(3);
          
          const noisyUiCategories = ['RenderState', 'PropsReceived', 'Validation'];
          if (!_isUiRenderLoggingEnabled && noisyUiCategories.includes(category)) {
              return; 
          }

          if (!_logSourceConfig[sourceForBuffer]) return;
          typeForBuffer = 'debug';
        } else { if (!_logSourceConfig['NATIVE_CONSOLE']) return; }
        
        if (globalFsmReducerState.variables.isInitialLoad && _isReducedStartupLoggingEnabled) {
          const criticalSources: LogSourceId[] = ['StockAnalysisContext', 'DefinitionLoader', 'PolygonAdapter', 'StockAnalysisContext:GlobalFSM_Orchestrator', 'StockAnalysisContext:GlobalFSM']; let allowLog = false;
          if (sourceForBuffer && criticalSources.includes(sourceForBuffer)) { allowLog = true; }
          else if (typeForBuffer === 'error' || typeForBuffer === 'warn') { allowLog = true; }
          if (sourceForBuffer === 'NATIVE_CONSOLE' && typeForBuffer !== 'error' && typeForBuffer !== 'warn' && !criticalSources.includes('NATIVE_CONSOLE')) { allowLog = false; }
          if (!allowLog && String(messagesForBuffer[0]).startsWith('[[ORCHESTRATOR_EFFECT_ENTRY]]')) { allowLog = true; } 
          if (!allowLog) { return; }
        }
        
        const lastLog = globalLogEntries[globalLogEntries.length - 1];
        if (lastLog) {
            try {
                const isDuplicate = lastLog.source === sourceForBuffer &&
                                  lastLog.type === typeForBuffer &&
                                  JSON.stringify(lastLog.messages) === JSON.stringify(messagesForBuffer);
                if (isDuplicate) {
                    return; 
                }
            } catch (e) {}
        }
        
        addEntryToGlobalLogBuffer({ type: typeForBuffer, messages: messagesForBuffer, source: sourceForBuffer });
      });
    };

    if (_isClientDebugConsoleEnabled) {
      console.log = (...args) => interceptAndProcessLog('log', ...args); console.warn = (...args) => interceptAndProcessLog('warn', ...args);
      console.error = (...args) => interceptAndProcessLog('error', ...args); console.info = (...args) => interceptAndProcessLog('info', ...args);
      console.debug = (...args) => interceptAndProcessLog('debug', ...args);
    } else {
      if ((console as any).__stockSageContextOriginals) { Object.assign(console, (console as any).__stockSageContextOriginals); }
    }
    return () => {
      if ((console as any).__stockSageContextOriginals) { Object.assign(console, (console as any).__stockSageContextOriginals); }
    };
  }, [_isClientDebugConsoleEnabled, _isUiRenderLoggingEnabled, _logSourceConfig, contextOriginals, logDebug, globalFsmReducerState.variables.isInitialLoad, _isReducedStartupLoggingEnabled]);
  
  return (<StockAnalysisContext.Provider value={contextValue}>{children}</StockAnalysisContext.Provider>);
}

export function useStockAnalysis() {
  const context = useContext(StockAnalysisContext);
  if (context === undefined) { throw new Error('useStockAnalysis must be used within a StockAnalysisProvider'); }
  return context;
}
