
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useReducer, useRef, useMemo } from 'react';
import type { LogSourceId, LogSourceConfig } from '@/lib/debug-log-types';
import { logSourceIds, defaultLogSourceConfig } from '@/lib/debug-log-types';
import { addEntryToGlobalLogBuffer, clearGlobalLogBuffer, globalLogEntries } from '@/lib/global-log-buffer';
import { fetchStockDataAction, type AnalyzeStockServerActionState, type StockDataFetchResult } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction, type AnalyzeTaActionState, type AnalyzeTaResult } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction, type PerformAiAnalysisActionState, type PerformAiAnalysisResult } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction, type PerformAiOptionsAnalysisActionState, type PerformAiOptionsAnalysisResult } from '@/actions/perform-ai-options-analysis-action';
import { chatServerAction, type ChatActionState, type ChatActionInputs, type ChatActionResult } from '@/actions/chat-server-action';
import { augmentedTaSearchAction, type AugmentedTaSearchActionState, type AugmentedTaSearchResult } from '@/actions/augmented-ta-search-action';
import { augmentedOptionsSearchAction, type AugmentedOptionsSearchActionState, type AugmentedOptionsSearchResult } from '@/actions/augmented-options-search-action';
import { useActionState, startTransition } from 'react';
import { isDataReadyForProcessing } from '@/lib/data-validation-utils';
import exampleChatPromptsData from '@/ai/definitions/example-chat-prompts.json';
import type { ExampleChatPromptsFile } from '@/ai/definition-loader';

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

  FETCHING_AUGMENTED_TA = 'FETCHING_AUGMENTED_TA',
  AUGMENTED_TA_FETCH_SUCCEEDED = 'AUGMENTED_TA_FETCH_SUCCEEDED',
  AUGMENTED_TA_FETCH_FAILED = 'AUGMENTED_TA_FETCH_FAILED',
  
  FETCHING_AUGMENTED_OPTIONS = 'FETCHING_AUGMENTED_OPTIONS',
  AUGMENTED_OPTIONS_FETCH_SUCCEEDED = 'AUGMENTED_OPTIONS_FETCH_SUCCEEDED',
  AUGMENTED_OPTIONS_FETCH_FAILED = 'AUGMENTED_OPTIONS_FETCH_FAILED',

  PIPELINE_AUTOMATED_COMPLETE = 'PIPELINE_AUTOMATED_COMPLETE',

  GENERATING_KEY_TAKEAWAYS = 'GENERATING_KEY_TAKEAWAYS',
  KEY_TAKEAWAYS_SUCCEEDED = 'KEY_TAKEAWAYS_SUCCEEDED',
  KEY_TAKEAWAYS_FAILED = 'KEY_TAKEAWAYS_FAILED',

  ANALYZING_OPTIONS = 'ANALYZING_OPTIONS',
  OPTIONS_ANALYSIS_SUCCEEDED = 'OPTIONS_ANALYSIS_SUCCEEDED',
  OPTIONS_ANALYSIS_FAILED = 'OPTIONS_ANALYSIS_FAILED',

  CHAT_MESSAGE_PENDING = 'CHAT_MESSAGE_PENDING',
  CHAT_MESSAGE_SUCCESS = 'CHAT_MESSAGE_SUCCESS',
  CHAT_MESSAGE_ERROR = 'CHAT_MESSAGE_ERROR',

  ERROR_STALE_DATA = 'ERROR_STALE_DATA',
}

export type FullAiMacroChatStep = 'key_takeaways' | 'options_analysis' | 'stock_trader_chat' | 'options_trader_chat' | 'holistic_chat' | null;

export interface GlobalFsmContextVariables {
  activeTicker: string | null;
  userInputTicker: string;
  isInitialLoad: boolean;
  lastError: { message: string; source: string; details?: any } | null;
  pendingChatSubmissionPayload: ChatActionInputs | null;
  activePipelineProfile: 'standard' | null;
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
  isAugmentedTaSearchEnabled: boolean;
  isAugmentedOptionsSearchEnabled: boolean;
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
interface AiTaSuccessPayload extends AnalyzeTaResult {}
interface AiTaFailurePayload { error?: string | null; message?: string | null; aiAnalyzedTaRequestJson?: string; }
interface AugmentedTaFetchSuccessPayload extends AugmentedTaSearchResult {}
interface AugmentedTaFetchFailurePayload { error?: string | null; message?: string | null; augmentedTaSearchJson?: string; }
interface AugmentedOptionsFetchSuccessPayload extends AugmentedOptionsSearchResult {}
interface AugmentedOptionsFetchFailurePayload { error?: string | null; message?: string | null; augmentedOptionsSearchJson?: string; }
interface AiKeyTakeawaysSuccessPayload extends PerformAiAnalysisResult {}
interface AiKeyTakeawaysFailurePayload { error?: string | null; message?: string | null; aiKeyTakeawaysRequestJson?: string; }
interface AiOptionsAnalysisSuccessPayload extends PerformAiOptionsAnalysisResult {}
interface AiOptionsAnalysisFailurePayload { error?: string | null; message?: string | null; aiOptionsAnalysisRequestJson?: string; }
interface SubmitChatMessagePayload extends ChatActionInputs {}
interface ChatMessageActionSuccessPayload extends ChatActionResult {}
interface ChatMessageActionErrorPayload { error?: string | null; message?: string | null; chatbotRequestJson?: string; chatbotResponseJson?: string; }
type DebugConsoleMenuType = 'filter' | 'copy' | 'export';
interface ToggleDebugConsoleMenuPayload { menu: DebugConsoleMenuType; isOpen: boolean; }
interface UpdateManualActionFlagsPayload { ktPossible: boolean; optPossible: boolean; }

export type AnalysisToggleType =
  | 'ai_key_takeaways'
  | 'ai_options_analysis'
  | 'ai_chat_stock_trader'
  | 'ai_chat_options_trader'
  | 'ai_chat_holistic'
  | 'augmented_ta_search'
  | 'augmented_options_search';

interface AnalysisToggleChangedPayload {
  toggleType: AnalysisToggleType;
  isEnabled: boolean;
}


export type FsmEvent =
  | { type: 'START_FULL_ANALYSIS'; payload: { ticker: string } }
  | { type: 'INITIALIZATION_COMPLETE' }
  | { type: 'USER_INPUT_TICKER_CHANGED'; payload: { ticker: string } }
  | { type: 'TRIGGER_DATA_FETCH' }
  | { type: 'FETCH_DATA_SUCCESS'; payload: FetchDataSuccessPayload }
  | { type: 'FETCH_DATA_FAILURE'; payload: FetchDataFailurePayload }
  | { type: 'STALE_DATA_FROM_ACTION'; payload: StaleDataFromActionPayload }
  | { type: 'INITIATE_AI_TA_SEQUENCE' }
  | { type: 'AI_TA_SUCCESS'; payload: AiTaSuccessPayload }
  | { type: 'AI_TA_FAILURE'; payload: AiTaFailurePayload }
  | { type: 'TRIGGER_AUGMENTED_TA_FETCH'; payload: { ticker: string } }
  | { type: 'AUGMENTED_TA_FETCH_SUCCESS'; payload: AugmentedTaFetchSuccessPayload }
  | { type: 'AUGMENTED_TA_FETCH_FAILURE'; payload: AugmentedTaFetchFailurePayload }
  | { type: 'TRIGGER_AUGMENTED_OPTIONS_FETCH'; payload: { ticker: string } }
  | { type: 'AUGMENTED_OPTIONS_FETCH_SUCCESS'; payload: AugmentedOptionsFetchSuccessPayload }
  | { type: 'AUGMENTED_OPTIONS_FETCH_FAILURE'; payload: AugmentedOptionsFetchFailurePayload }
  | { type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS'; payload: { ticker: string } }
  | { type: 'KEY_TAKEAWAYS_SUCCESS'; payload: AiKeyTakeawaysSuccessPayload }
  | { type: 'KEY_TAKEAWAYS_FAILURE'; payload: AiKeyTakeawaysFailurePayload }
  | { type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS'; payload: { ticker: string } }
  | { type: 'OPTIONS_ANALYSIS_SUCCESS'; payload: AiOptionsAnalysisSuccessPayload }
  | { type: 'OPTIONS_ANALYSIS_FAILURE'; payload: AiOptionsAnalysisFailurePayload }
  | { type: 'SUBMIT_CHAT_MESSAGE'; payload: SubmitChatMessagePayload }
  | { type: 'PENDING_CHAT_SUBMISSION_TRIGGERED' }
  | { type: 'CHAT_MESSAGE_ACTION_SUCCESS'; payload: ChatMessageActionSuccessPayload }
  | { type: 'CHAT_MESSAGE_ACTION_ERROR'; payload: ChatMessageActionErrorPayload }
  | { type: 'TOGGLE_DEBUG_CONSOLE_MENU'; payload: ToggleDebugConsoleMenuPayload }
  | { type: 'FINALIZE_AUTOMATED_PIPELINE' }
  | { type: 'UPDATE_MANUAL_ACTION_FLAGS'; payload: UpdateManualActionFlagsPayload }
  | { type: 'ANALYSIS_TOGGLE_CHANGED'; payload: AnalysisToggleChangedPayload }
  | { type: 'PROCEED_TO_IDLE' };

export interface ChatMessage {
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
  augmentedTaSearchJson: string;
  augmentedOptionsSearchJson: string;
  chatbotRequestJson: string;
  chatbotResponseJson: string;
  chatHistory: ChatMessage[];
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
  isChatGroundingEnabled: boolean;
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
  setAugmentedTaSearchJson: (json: string) => void;
  setAugmentedOptionsSearchJson: (json: string) => void;
  setChatbotRequestJson: (json: string) => void;
  setChatbotResponseJson: (json: string) => void;
}

interface StockAnalysisContextType extends Omit<StockAnalysisState, 'globalFsmState'>, StockAnalysisContextSetters {
  fsmState: GlobalFsmState;
  previousFsmState: GlobalFsmState | null;
  fsmVariables: GlobalFsmContextVariables;
  fsmFlags: GlobalFsmFlags;
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
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
  setChatGroundingEnabled: (enabled: boolean) => void;
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
    pendingChatSubmissionPayload: null,
    activePipelineProfile: null,
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
    isAugmentedTaSearchEnabled: false,
    isAugmentedOptionsSearchEnabled: false,
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
  augmentedTaSearchJson: initialJsonPlaceholder,
  augmentedOptionsSearchJson: initialJsonPlaceholder,
  chatbotRequestJson: initialJsonPlaceholder,
  chatbotResponseJson: initialJsonPlaceholder,
  chatHistory: [],
  isClientDebugConsoleEnabled: true,
  isClientDebugConsoleOpen: true,
  logSourceConfig: defaultLogSourceConfig,
  globalFsmState: initialGlobalFsmReducerState,
  targetFsmDisplayState: null,
  mainTabFsmDisplay: { ...initialFsmDisplayTuple, current: GlobalFsmState.IDLE.toString() },
  chatbotFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
  debugConsoleMenuFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
  isReducedStartupLoggingEnabled: true,
  isUiRenderLoggingEnabled: false,
  isChatGroundingEnabled: false,
};

const localInitialStockDataFetchResult: AnalyzeStockServerActionState = { status: 'idle', data: undefined, error: null, message: null };
const localInitialAnalyzeTaState: AnalyzeTaActionState = { status: 'idle', data: undefined, error: null, message: null };
const localInitialPerformAiAnalysisState: PerformAiAnalysisActionState = { status: 'idle', data: undefined, error: null, message: null };
const localInitialPerformAiOptionsAnalysisState: PerformAiOptionsAnalysisActionState = { status: 'idle', data: undefined, error: null, message: null };
const localInitialAugmentedTaSearchState: AugmentedTaSearchActionState = { status: 'idle', data: undefined, error: null, message: null };
const localInitialAugmentedOptionsSearchState: AugmentedOptionsSearchActionState = { status: 'idle', data: undefined, error: null, message: null };


const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

let chatMessageIdCounter = 0;

const macroPrompts: ExampleChatPromptsFile = exampleChatPromptsData;

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
  const [_augmentedTaSearchJson, _setAugmentedTaSearchJson] = useState<string>(defaultState.augmentedTaSearchJson);
  const [_augmentedOptionsSearchJson, _setAugmentedOptionsSearchJson] = useState<string>(defaultState.augmentedOptionsSearchJson);
  const [_chatbotRequestJson, _setChatbotRequestJson] = useState<string>(defaultState.chatbotRequestJson);
  const [_chatbotResponseJson, _setChatbotResponseJson] = useState<string>(defaultState.chatbotResponseJson);
  const [_chatHistory, _setChatHistory] = useState<ChatMessage[]>(defaultState.chatHistory);
  const [_isClientDebugConsoleEnabled, _setClientDebugConsoleEnabled] = useState<boolean>(defaultState.isClientDebugConsoleEnabled);
  const [_isClientDebugConsoleOpen, _setClientDebugConsoleOpen] = useState<boolean>(defaultState.isClientDebugConsoleOpen);
  const [_logSourceConfig, _setLogSourceConfig] = useState<LogSourceConfig>(defaultState.logSourceConfig);
  const [_targetFsmDisplayState, _setTargetFsmDisplayState] = useState<GlobalFsmState | null>(defaultState.targetFsmDisplayState);
  const [_mainTabFsmDisplay, _setMainTabFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.mainTabFsmDisplay);
  const [_chatbotFsmDisplay, _setChatbotFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.chatbotFsmDisplay);
  const [_debugConsoleMenuFsmDisplayInternal, _setDebugConsoleMenuFsmDisplayInternal] = useState<FsmDisplayTuple | null>(defaultState.debugConsoleMenuFsmDisplay);
  const [_isReducedStartupLoggingEnabled, _setIsReducedStartupLoggingEnabled] = useState<boolean>(defaultState.isReducedStartupLoggingEnabled);
  const [_isUiRenderLoggingEnabled, _setIsUiRenderLoggingEnabled] = useState<boolean>(defaultState.isUiRenderLoggingEnabled);
  const [_isChatGroundingEnabled, _setIsChatGroundingEnabled] = useState<boolean>(defaultState.isChatGroundingEnabled);
  const initialInitializationDispatchedRef = useRef(false);

  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(chatServerAction, localInitialStockDataFetchResult);


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
    setAugmentedTaSearchJson: (json: string) => setAndLogJson(_setAugmentedTaSearchJson, 'augmentedTaSearchJson', json),
    setAugmentedOptionsSearchJson: (json: string) => setAndLogJson(_setAugmentedOptionsSearchJson, 'augmentedOptionsSearchJson', json),
    setChatbotRequestJson: (json: string) => setAndLogJson(_setChatbotRequestJson, 'chatbotRequestJson (Interactive)', json),
    setChatbotResponseJson: (json: string) => setAndLogJson(_setChatbotResponseJson, 'chatbotResponseJson (Interactive)', json),
  }), [setAndLogJson]);


  const setLogSourceEnabled = useCallback((source: LogSourceId, enabled: boolean) => {
    _setLogSourceConfig(prevConfig => {
      const newConfig = { ...prevConfig, [source]: enabled };
      logDebug('StockAnalysisContext', 'LogConfigChange', `Log source '${source}' ${enabled ? 'ENABLED' : 'DISABLED'}.`);
      return newConfig;
    });
  }, [_setLogSourceConfig, logDebug]);

  const addChatMessage = useCallback((message: ChatMessage) => {
    _setChatHistory(prev => {
      const uniqueMessageId = `${Date.now()}_${chatMessageIdCounter++}_${message.role}_ctx`;
      const uniqueMessage: ChatMessage = { ...message, id: uniqueMessageId };
      if (prev.length > 0 && prev[prev.length - 1].role === message.role && prev[prev.length - 1].content === message.content) {
        logDebug('StockAnalysisContext', 'GlobalChatHistoryUpdate_Guard', `Skipped adding duplicate chat message from ${message.role} with content: "${message.content.substring(0,30)}..." (ID attempted: ${uniqueMessageId})`);
        return prev;
      }
      logDebug('StockAnalysisContext', 'GlobalChatHistoryUpdate_Add', `Added interactive chat message from ${uniqueMessage.role} with ID ${uniqueMessage.id}: "${uniqueMessage.content.substring(0, 50)}..."`);
      return [...prev, uniqueMessage];
    });
  }, [_setChatHistory, logDebug]);

  const clearChatHistory = useCallback(() => {
    _setChatHistory([]);
    logDebug('StockAnalysisContext', 'GlobalChatHistoryUpdate_Clear', 'Interactive chat history CLEARED by user action.');
  }, [_setChatHistory, logDebug]);

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
    contextSetters.setAugmentedTaSearchJson(pendingJson);
    contextSetters.setAugmentedOptionsSearchJson(pendingJson);
    if (isFullAnalysis) {
        contextSetters.setChatbotRequestJson(chatPendingJson);
        contextSetters.setChatbotResponseJson(chatPendingJson);
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
    logDebug('StockAnalysisContext', 'DebugConsoleToggle', `ClientDebugConsoleEnabled toggled to: ${enabled}.`);
    _setClientDebugConsoleEnabled(enabled);
    if (enabled) {
        enableAllLogSources(); 
        _setLogSourceConfig(prevConfig => ({ ...prevConfig, OptionsChainTable: false })); 
        logDebug('StockAnalysisContext', 'LogConfigChange', `OptionsChainTable log source explicitly DISABLED after enabling all.`);
        _setClientDebugConsoleOpen(true); 
    } else {
      _setClientDebugConsoleOpen(false); 
    }
  }, [_setClientDebugConsoleEnabled, _setClientDebugConsoleOpen, enableAllLogSources, logDebug]);

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

  const setChatGroundingEnabled = useCallback((enabled: boolean) => {
    logDebug('StockAnalysisContext', 'ChatGroundingToggle', `Chat grounding with Google Search toggled to: ${enabled}.`);
    _setIsChatGroundingEnabled(enabled);
  }, [logDebug]);


  const fsmReducer = (state: GlobalFsmReducerManagedState, event: FsmEvent): GlobalFsmReducerManagedState => {
    const previousState = state.current;
    const logPrefixFsmReducer = 'StockAnalysisContext:GlobalFSM';
    logDebug(logPrefixFsmReducer as LogSourceId, 'ReducerEntry', `Event: ${event.type}, FromState: ${previousState}, ActiveProfile: ${state.variables.activePipelineProfile}`);

    if ('payload' in event && event.type !== 'SUBMIT_CHAT_MESSAGE' && event.type !== 'USER_INPUT_TICKER_CHANGED' && event.type !== 'UPDATE_MANUAL_ACTION_FLAGS' && event.type !== 'ANALYSIS_TOGGLE_CHANGED') {
      logDebug(logPrefixFsmReducer as LogSourceId, 'EventPayload', `For ${event.type}:`, JSON.stringify(event.payload).substring(0, 150));
    } else if (event.type === 'SUBMIT_CHAT_MESSAGE') {
      logDebug(logPrefixFsmReducer as LogSourceId, 'EventPayload_Chat', `For SUBMIT_CHAT_MESSAGE: UserInput: ${event.payload.userInput.substring(0,50)}..., HistoryLen: ${event.payload.chatHistory?.length}`);
    } else if (event.type === 'USER_INPUT_TICKER_CHANGED') {
      logDebug(logPrefixFsmReducer as LogSourceId, 'EventPayload_TickerInput', `For USER_INPUT_TICKER_CHANGED: Ticker: ${event.payload.ticker}`);
    } else if (event.type === 'UPDATE_MANUAL_ACTION_FLAGS') {
      logDebug(logPrefixFsmReducer as LogSourceId, 'EventPayload_ManualFlags', `For UPDATE_MANUAL_ACTION_FLAGS: KT: ${event.payload.ktPossible}, Opt: ${event.payload.optPossible}`);
    } else if (event.type === 'ANALYSIS_TOGGLE_CHANGED') {
      logDebug(logPrefixFsmReducer as LogSourceId, 'EventPayload_Toggle', `For ANALYSIS_TOGGLE_CHANGED: ${event.payload.toggleType} -> ${event.payload.isEnabled}`);
    }


    let nextCurrentState: GlobalFsmState = previousState;
    let nextVariables: GlobalFsmContextVariables = { ...state.variables };
    let nextFlags: GlobalFsmFlags = { ...state.flags };
    const errorJsonWithDetails = (message: string, details: string | null | undefined) => `{ "status": "error", "message": "${message.replace(/"/g, '\\"')}", "details": "${(details || '').replace(/"/g, '\\"')}" }`;

    const resetForNewAnalysis = (ticker: string) => {
        nextVariables.activeTicker = ticker;
        nextVariables.lastError = null;
        nextVariables.pendingChatSubmissionPayload = null;
        nextVariables.activePipelineProfile = 'standard';
        nextFlags.canAnalyzeStock = false;
        nextFlags.isMarketDataReady = false; nextFlags.isSnapshotDataReady = false;
        nextFlags.isStandardTADataReady = false; nextFlags.isOptionsChainDataReady = false;
        nextFlags.isCalculatedTADataReady = false; nextFlags.isKeyTakeawaysDataAvailable = false;
        nextFlags.isOptionsAnalysisDataAvailable = false;
        setAllPlaceholdersInternal(ticker, true);
    };

    const handlePipelineError = (source: string, errorMessage: string, errorDetails?: any) => {
        nextVariables.lastError = { message: errorMessage, source, details: errorDetails };
        nextVariables.activePipelineProfile = null;
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
          case 'augmented_ta_search': nextFlags.isAugmentedTaSearchEnabled = isEnabled; break;
          case 'augmented_options_search': nextFlags.isAugmentedOptionsSearchEnabled = isEnabled; break;
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
      case 'TRIGGER_DATA_FETCH':
        if (previousState === GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH) {
            nextCurrentState = GlobalFsmState.DATA_FETCH_IN_PROGRESS;
            logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To DATA_FETCH_IN_PROGRESS.`);
        }
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
      case 'INITIATE_AI_TA_SEQUENCE':
        if (previousState === GlobalFsmState.DATA_FETCH_SUCCEEDED) {
            contextSetters.setAiAnalyzedTaRequestJson(pendingJson); contextSetters.setAiAnalyzedTaJson(pendingJson);
            nextCurrentState = GlobalFsmState.CALCULATING_AI_TA;
            logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To CALCULATING_AI_TA.`);
        }
        break;
      case 'AI_TA_SUCCESS':
        contextSetters.setAiAnalyzedTaRequestJson(event.payload.aiAnalyzedTaRequestJson); contextSetters.setAiAnalyzedTaJson(event.payload.aiAnalyzedTaJson);
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
      case 'TRIGGER_AUGMENTED_TA_FETCH':
        contextSetters.setAugmentedTaSearchJson(pendingJson);
        nextCurrentState = GlobalFsmState.FETCHING_AUGMENTED_TA;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To FETCHING_AUGMENTED_TA for ${event.payload.ticker}.`);
        break;
      case 'AUGMENTED_TA_FETCH_SUCCESS':
        contextSetters.setAugmentedTaSearchJson(event.payload.augmentedTaSearchJson);
        nextCurrentState = GlobalFsmState.AUGMENTED_TA_FETCH_SUCCEEDED;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To AUGMENTED_TA_FETCH_SUCCEEDED.`);
        break;
      case 'AUGMENTED_TA_FETCH_FAILURE':
        const augTaErr = event.payload; const augTaErrMsg = augTaErr.message || 'Augmented TA search failed';
        contextSetters.setAugmentedTaSearchJson(augTaErr.augmentedTaSearchJson || errorJsonWithDetails(augTaErrMsg, augTaErr.error));
        handlePipelineError('AugmentedTaSearch', augTaErrMsg, augTaErr.error);
        nextCurrentState = GlobalFsmState.AUGMENTED_TA_FETCH_FAILED;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To AUGMENTED_TA_FETCH_FAILED. Error: ${augTaErrMsg}.`);
        break;
      case 'TRIGGER_AUGMENTED_OPTIONS_FETCH':
        contextSetters.setAugmentedOptionsSearchJson(pendingJson);
        nextCurrentState = GlobalFsmState.FETCHING_AUGMENTED_OPTIONS;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To FETCHING_AUGMENTED_OPTIONS for ${event.payload.ticker}.`);
        break;
      case 'AUGMENTED_OPTIONS_FETCH_SUCCESS':
        contextSetters.setAugmentedOptionsSearchJson(event.payload.augmentedOptionsSearchJson);
        nextCurrentState = GlobalFsmState.AUGMENTED_OPTIONS_FETCH_SUCCEEDED;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To AUGMENTED_OPTIONS_FETCH_SUCCEEDED.`);
        break;
      case 'AUGMENTED_OPTIONS_FETCH_FAILURE':
        const augOptErr = event.payload; const augOptErrMsg = augOptErr.message || 'Augmented Options search failed';
        contextSetters.setAugmentedOptionsSearchJson(augOptErr.augmentedOptionsSearchJson || errorJsonWithDetails(augOptErrMsg, augOptErr.error));
        handlePipelineError('AugmentedOptionsSearch', augOptErrMsg, augOptErr.error);
        nextCurrentState = GlobalFsmState.AUGMENTED_OPTIONS_FETCH_FAILED;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To AUGMENTED_OPTIONS_FETCH_FAILED. Error: ${augOptErrMsg}.`);
        break;
      case 'FINALIZE_AUTOMATED_PIPELINE':
        if (
            previousState === GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED ||
            previousState === GlobalFsmState.AI_TA_CALCULATION_FAILED ||
            previousState === GlobalFsmState.AUGMENTED_TA_FETCH_SUCCEEDED ||
            previousState === GlobalFsmState.AUGMENTED_TA_FETCH_FAILED ||
            previousState === GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED ||
            previousState === GlobalFsmState.KEY_TAKEAWAYS_FAILED ||
            previousState === GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED ||
            previousState === GlobalFsmState.OPTIONS_ANALYSIS_FAILED ||
            previousState === GlobalFsmState.AUGMENTED_OPTIONS_FETCH_SUCCEEDED ||
            previousState === GlobalFsmState.AUGMENTED_OPTIONS_FETCH_FAILED ||
            previousState === GlobalFsmState.CHAT_MESSAGE_SUCCESS ||
            previousState === GlobalFsmState.CHAT_MESSAGE_ERROR
        ) {
            nextCurrentState = GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE;
            logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To PIPELINE_AUTOMATED_COMPLETE.`);
        }
        break;
      case 'TRIGGER_MANUAL_KEY_TAKEAWAYS':
        if (nextVariables.activeTicker === event.payload.ticker) {
            contextSetters.setAiKeyTakeawaysRequestJson(pendingJson); contextSetters.setAiKeyTakeawaysJson(pendingJson);
            nextFlags.isKeyTakeawaysDataAvailable = false;
            nextCurrentState = GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
            logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To GENERATING_KEY_TAKEAWAYS for ${event.payload.ticker}.`);
        } else { logDebug(logPrefixFsmReducer as LogSourceId, 'Guard', `Ignoring TRIGGER_MANUAL_KEY_TAKEAWAYS, ticker mismatch.`); }
        break;
      case 'KEY_TAKEAWAYS_SUCCESS':
        contextSetters.setAiKeyTakeawaysRequestJson(event.payload.aiKeyTakeawaysRequestJson); contextSetters.setAiKeyTakeawaysJson(event.payload.aiKeyTakeawaysJson);
        nextFlags.isKeyTakeawaysDataAvailable = true;
        nextCurrentState = GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To KEY_TAKEAWAYS_SUCCEEDED.`);
        break;
      case 'KEY_TAKEAWAYS_FAILURE':
        const ktErr = event.payload; const ktErrMsg = ktErr.message || 'AI Key Takeaways failed';
        const ktErrorJson = errorJsonWithDetails(ktErrMsg, ktErr.error);
        contextSetters.setAiKeyTakeawaysRequestJson(ktErr.aiKeyTakeawaysRequestJson || ktErrorJson); contextSetters.setAiKeyTakeawaysJson(ktErrorJson);
        handlePipelineError('KeyTakeaways', ktErrMsg, ktErr.error);
        nextCurrentState = GlobalFsmState.KEY_TAKEAWAYS_FAILED;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To KEY_TAKEAWAYS_FAILED. Error: ${ktErrMsg}.`);
        break;
      case 'TRIGGER_MANUAL_OPTIONS_ANALYSIS':
        if (nextVariables.activeTicker === event.payload.ticker) {
            contextSetters.setAiOptionsAnalysisRequestJson(pendingJson); contextSetters.setAiOptionsAnalysisJson(pendingJson);
            nextFlags.isOptionsAnalysisDataAvailable = false;
            nextCurrentState = GlobalFsmState.ANALYZING_OPTIONS;
            logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To ANALYZING_OPTIONS for ${event.payload.ticker}.`);
        } else { logDebug(logPrefixFsmReducer as LogSourceId, 'Guard', `Ignoring TRIGGER_MANUAL_OPTIONS_ANALYSIS, ticker mismatch.`); }
        break;
      case 'OPTIONS_ANALYSIS_SUCCESS':
        contextSetters.setAiOptionsAnalysisRequestJson(event.payload.aiOptionsAnalysisRequestJson); contextSetters.setAiOptionsAnalysisJson(event.payload.aiOptionsAnalysisJson);
        nextFlags.isOptionsAnalysisDataAvailable = true;
        nextCurrentState = GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To OPTIONS_ANALYSIS_SUCCEEDED.`);
        break;
      case 'OPTIONS_ANALYSIS_FAILURE':
        const optErr = event.payload; const optErrMsg = optErr.message || 'AI Options Analysis failed';
        const optErrorJson = errorJsonWithDetails(optErrMsg, optErr.error);
        contextSetters.setAiOptionsAnalysisRequestJson(optErr.aiOptionsAnalysisRequestJson || optErrorJson); contextSetters.setAiOptionsAnalysisJson(optErrorJson);
        handlePipelineError('OptionsAnalysis', optErrMsg, optErr.error);
        nextCurrentState = GlobalFsmState.OPTIONS_ANALYSIS_FAILED;
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To OPTIONS_ANALYSIS_FAILED. Error: ${optErrMsg}.`);
        break;
      case 'SUBMIT_CHAT_MESSAGE':
        if (state.current === GlobalFsmState.CHAT_MESSAGE_PENDING && state.variables.pendingChatSubmissionPayload?.userInput === event.payload.userInput) {
          logDebug(logPrefixFsmReducer as LogSourceId, 'GuardDuplicateSubmission', `SUBMIT_CHAT_MESSAGE for "${event.payload.userInput.substring(0,20)}" ignored, already pending with same input.`);
        } else if (nextVariables.activeTicker || event.payload.isChatGroundingEnabled) {
            _setChatHistory(prev => {
              const userMessage: ChatMessage = { id: `${Date.now()}_${chatMessageIdCounter++}_user_gbl_fsm`, role: 'user', content: event.payload.userInput };
              if (prev.length > 0 && prev[prev.length - 1].role === 'user' && prev[prev.length -1].content === userMessage.content) {
                 logDebug(logPrefixFsmReducer as LogSourceId, 'GuardDuplicateUserMsgAdd', `Skipped adding duplicate user message to history. Content: ${userMessage.content.substring(0,30)}...`);
                 return prev;
              }
              logDebug(logPrefixFsmReducer as LogSourceId, 'AddUserMsgToHistory', `Adding user message. Content: ${userMessage.content.substring(0,30)}...`);
              return [...prev, userMessage];
            });
            nextVariables.pendingChatSubmissionPayload = { ...event.payload };
            nextCurrentState = GlobalFsmState.CHAT_MESSAGE_PENDING;
            contextSetters.setChatbotRequestJson(chatPendingJson); contextSetters.setChatbotResponseJson(chatPendingJson);
            logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To CHAT_MESSAGE_PENDING for ${nextVariables.activeTicker || 'grounded query'}. Payload set.`);
        } else { logDebug(logPrefixFsmReducer as LogSourceId, 'Guard', `SUBMIT_CHAT_MESSAGE ignored. No active ticker and grounding is disabled.`); }
        break;
      case 'PENDING_CHAT_SUBMISSION_TRIGGERED':
        nextVariables.pendingChatSubmissionPayload = null;
        logDebug(logPrefixFsmReducer as LogSourceId, 'InternalUpdate', `Pending chat payload cleared. State remains CHAT_MESSAGE_PENDING.`);
        break;
      case 'CHAT_MESSAGE_ACTION_SUCCESS':
        if (state.current === GlobalFsmState.CHAT_MESSAGE_PENDING) {
          contextSetters.setChatbotRequestJson(event.payload.chatbotRequestJson);
          contextSetters.setChatbotResponseJson(event.payload.chatbotResponseJson);
          try {
            const modelResponse = JSON.parse(event.payload.chatbotResponseJson);
            const messageId = `${Date.now()}_${chatMessageIdCounter++}_model_ctx`;
            if (modelResponse.response) { addChatMessage({ id: messageId, role: 'model', content: modelResponse.response }); }
            else if (modelResponse.error) { addChatMessage({ id: `${messageId}_err`, role: 'model', content: `Chatbot Error: ${modelResponse.error}` }); }
          } catch (e) { addChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_model_ctx_parse_err`, role: 'model', content: "Error parsing chatbot response." }); }
          nextVariables.lastError = null;
          nextCurrentState = GlobalFsmState.CHAT_MESSAGE_SUCCESS;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To CHAT_MESSAGE_SUCCESS.`);
        } else { logDebug(logPrefixFsmReducer as LogSourceId, 'Guard', `CHAT_MESSAGE_ACTION_SUCCESS ignored. Not in CHAT_MESSAGE_PENDING state.`); }
        nextVariables.pendingChatSubmissionPayload = null;
        break;
      case 'CHAT_MESSAGE_ACTION_ERROR':
        const chatErrPayload = event.payload; const chatErrMsg = chatErrPayload.message || 'Chat failed';
        contextSetters.setChatbotRequestJson(chatErrPayload.chatbotRequestJson || errorJsonWithDetails("Chat request data unavailable on error", null));
        contextSetters.setChatbotResponseJson(chatErrPayload.chatbotResponseJson || errorJsonWithDetails(chatErrMsg, chatErrPayload.error));
        addChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_model_ctx_act_err`, role: 'model', content: `Error: ${chatErrMsg}` });
        handlePipelineError('ChatAction', chatErrMsg, chatErrPayload.error);
        nextCurrentState = GlobalFsmState.CHAT_MESSAGE_ERROR;
        nextVariables.pendingChatSubmissionPayload = null; 
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `To CHAT_MESSAGE_ERROR. Error: ${chatErrMsg}.`);
        break;
      case 'PROCEED_TO_IDLE':
        nextCurrentState = GlobalFsmState.IDLE;
        nextVariables.activePipelineProfile = null;
        nextVariables.pendingChatSubmissionPayload = null; 
        logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `Event PROCEED_TO_IDLE. To IDLE. Macro state & pending chat reset.`);
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
      default:
        logDebug(logPrefixFsmReducer as LogSourceId, 'UnhandledEvent', `Unhandled event type: ${(event as any).type} in state ${previousState}`);
    }

    if (nextCurrentState === GlobalFsmState.IDLE || nextCurrentState === GlobalFsmState.VALID_TICKER_ENTERED ||
        nextCurrentState === GlobalFsmState.AWAITING_TICKER_INPUT || nextCurrentState === GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE ||
        nextCurrentState === GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED || nextCurrentState === GlobalFsmState.KEY_TAKEAWAYS_FAILED ||
        nextCurrentState === GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED || nextCurrentState === GlobalFsmState.OPTIONS_ANALYSIS_FAILED ||
        nextCurrentState === GlobalFsmState.CHAT_MESSAGE_SUCCESS || nextCurrentState === GlobalFsmState.CHAT_MESSAGE_ERROR ||
        nextCurrentState === GlobalFsmState.DATA_FETCH_FAILED || nextCurrentState === GlobalFsmState.ERROR_STALE_DATA
    ) { nextFlags.canAnalyzeStock = true; } else { nextFlags.canAnalyzeStock = false; }

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
    const currentActualState = fsmStateRef.current.current;
    let determinedTarget: GlobalFsmState | null = null;

    switch (currentActualState) {
        case GlobalFsmState.IDLE: case GlobalFsmState.AWAITING_TICKER_INPUT: case GlobalFsmState.VALID_TICKER_ENTERED:
        case GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE: case GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED: case GlobalFsmState.KEY_TAKEAWAYS_FAILED:
        case GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED: case GlobalFsmState.OPTIONS_ANALYSIS_FAILED: case GlobalFsmState.CHAT_MESSAGE_SUCCESS:
        case GlobalFsmState.CHAT_MESSAGE_ERROR: case GlobalFsmState.DATA_FETCH_FAILED: case GlobalFsmState.ERROR_STALE_DATA: case GlobalFsmState.AI_TA_CALCULATION_FAILED:
            if (event.type === 'START_FULL_ANALYSIS') determinedTarget = GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH;
            else if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') determinedTarget = GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
            else if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') determinedTarget = GlobalFsmState.ANALYZING_OPTIONS;
            else if (event.type === 'SUBMIT_CHAT_MESSAGE') determinedTarget = GlobalFsmState.CHAT_MESSAGE_PENDING;
            else if (event.type === 'USER_INPUT_TICKER_CHANGED') determinedTarget = event.payload.ticker.trim() ? GlobalFsmState.VALID_TICKER_ENTERED : GlobalFsmState.AWAITING_TICKER_INPUT;
            break;
        case GlobalFsmState.GENERATING_KEY_TAKEAWAYS:
            if (event.type === 'KEY_TAKEAWAYS_SUCCESS') determinedTarget = GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED;
            else if (event.type === 'KEY_TAKEAWAYS_FAILURE') determinedTarget = GlobalFsmState.KEY_TAKEAWAYS_FAILED;
            break;
        case GlobalFsmState.ANALYZING_OPTIONS:
            if (event.type === 'OPTIONS_ANALYSIS_SUCCESS') determinedTarget = GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED;
            else if (event.type === 'OPTIONS_ANALYSIS_FAILURE') determinedTarget = GlobalFsmState.OPTIONS_ANALYSIS_FAILED;
            break;
        case GlobalFsmState.CHAT_MESSAGE_PENDING:
            if (event.type === 'PENDING_CHAT_SUBMISSION_TRIGGERED') determinedTarget = currentActualState; 
            else if (event.type === 'CHAT_MESSAGE_ACTION_SUCCESS') determinedTarget = GlobalFsmState.CHAT_MESSAGE_SUCCESS;
            else if (event.type === 'CHAT_MESSAGE_ACTION_ERROR') determinedTarget = GlobalFsmState.CHAT_MESSAGE_ERROR;
            break;
        case GlobalFsmState.APP_INITIALIZING:
            if (event.type === 'INITIALIZATION_COMPLETE') determinedTarget = fsmStateRef.current.variables.userInputTicker.trim() !== "" ? GlobalFsmState.VALID_TICKER_ENTERED : GlobalFsmState.AWAITING_TICKER_INPUT;
            break;
        case GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH:
            if (event.type === 'TRIGGER_DATA_FETCH') determinedTarget = GlobalFsmState.DATA_FETCH_IN_PROGRESS;
            break;
        case GlobalFsmState.DATA_FETCH_IN_PROGRESS:
            if (event.type === 'FETCH_DATA_SUCCESS') determinedTarget = GlobalFsmState.DATA_FETCH_SUCCEEDED;
            else if (event.type === 'FETCH_DATA_FAILURE') determinedTarget = GlobalFsmState.DATA_FETCH_FAILED;
            else if (event.type === 'STALE_DATA_FROM_ACTION') determinedTarget = GlobalFsmState.ERROR_STALE_DATA;
            break;
        case GlobalFsmState.DATA_FETCH_SUCCEEDED:
            if (event.type === 'INITIATE_AI_TA_SEQUENCE') determinedTarget = GlobalFsmState.CALCULATING_AI_TA;
            break;
        case GlobalFsmState.CALCULATING_AI_TA:
            if (event.type === 'AI_TA_SUCCESS') determinedTarget = GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED;
            else if (event.type === 'AI_TA_FAILURE') determinedTarget = GlobalFsmState.AI_TA_CALCULATION_FAILED;
            break;
        case GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED: 
             if (event.type === 'FINALIZE_AUTOMATED_PIPELINE') determinedTarget = GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE;
             else if (event.type === 'TRIGGER_AUGMENTED_TA_FETCH') determinedTarget = GlobalFsmState.FETCHING_AUGMENTED_TA;
             else if (event.type === 'TRIGGER_AUGMENTED_OPTIONS_FETCH') determinedTarget = GlobalFsmState.FETCHING_AUGMENTED_OPTIONS;
            break;
        case GlobalFsmState.FETCHING_AUGMENTED_TA:
            if (event.type === 'AUGMENTED_TA_FETCH_SUCCESS') determinedTarget = GlobalFsmState.AUGMENTED_TA_FETCH_SUCCEEDED;
            else if (event.type === 'AUGMENTED_TA_FETCH_FAILURE') determinedTarget = GlobalFsmState.AUGMENTED_TA_FETCH_FAILED;
            break;
        case GlobalFsmState.FETCHING_AUGMENTED_OPTIONS:
            if (event.type === 'AUGMENTED_OPTIONS_FETCH_SUCCESS') determinedTarget = GlobalFsmState.AUGMENTED_OPTIONS_FETCH_SUCCEEDED;
            else if (event.type === 'AUGMENTED_OPTIONS_FETCH_FAILURE') determinedTarget = GlobalFsmState.AUGMENTED_OPTIONS_FETCH_FAILED;
            break;
    }
    if (event.type === 'PROCEED_TO_IDLE') { determinedTarget = GlobalFsmState.IDLE; }
    if (event.type === 'TOGGLE_DEBUG_CONSOLE_MENU') { determinedTarget = currentActualState; }
    if (event.type === 'UPDATE_MANUAL_ACTION_FLAGS') { determinedTarget = currentActualState; }
    if (event.type === 'ANALYSIS_TOGGLE_CHANGED') { determinedTarget = currentActualState; }


    logDebug('StockAnalysisContext:GlobalFSM' as LogSourceId, 'DispatchAttempt', `Event: ${event.type}, CurrentActual: ${currentActualState}, DeterminedTarget: ${determinedTarget || 'N/A'}`);
    if (determinedTarget && event.type !== 'TOGGLE_DEBUG_CONSOLE_MENU' && event.type !== 'USER_INPUT_TICKER_CHANGED' && event.type !== 'UPDATE_MANUAL_ACTION_FLAGS' && event.type !== 'ANALYSIS_TOGGLE_CHANGED') { _setTargetFsmDisplayState(determinedTarget); }
    _dispatchFsmEventActual(event);
  }, [_dispatchFsmEventActual, _setTargetFsmDisplayState, logDebug]);

  useEffect(() => {
    if (_targetFsmDisplayState !== null && globalFsmReducerState.current === _targetFsmDisplayState) {
      logDebug('StockAnalysisContext:GlobalFSM' as LogSourceId, 'TargetReached', `Current state ${_targetFsmDisplayState} matches target. Clearing target display.`);
      _setTargetFsmDisplayState(null);
    }
  }, [globalFsmReducerState.current, _targetFsmDisplayState, logDebug]);

  useEffect(() => {
    const { isInitialLoad } = globalFsmReducerState.variables;
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
        
        if (isInitialLoad && _isReducedStartupLoggingEnabled) {
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

  const setClientDebugConsoleOpen = useCallback((open: boolean) => {
    logDebug('StockAnalysisContext', 'DebugConsoleUIToggle', `ClientDebugConsoleOpen will be set to: ${open}. Current isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}`);
    if (_isClientDebugConsoleEnabled || !open) { _setClientDebugConsoleOpen(open); }
    else if (!_isClientDebugConsoleEnabled && open) { logDebug('StockAnalysisContext', 'DebugConsoleUIToggle', 'Attempted to open console while it is disabled. Opening action will be ignored.'); }
  }, [_isClientDebugConsoleEnabled, _setClientDebugConsoleOpen, logDebug]);

  const [fetchDataActionState, fetchStockDataFormAction, isFetchDataPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(fetchStockDataAction, localInitialStockDataFetchResult);
  const [analyzeTaActionState, analyzeTaFormAction, isAnalyzeTaPending] = useActionState<AnalyzeTaActionState, { stockSnapshotJson: string, ticker?: string }>(analyzeTaAction, localInitialAnalyzeTaState);
  const [augmentedTaSearchActionState, augmentedTaSearchFormAction, isAugmentedTaSearchPending] = useActionState<AugmentedTaSearchActionState, { ticker: string }>(augmentedTaSearchAction, localInitialAugmentedTaSearchState);
  const [augmentedOptionsSearchActionState, augmentedOptionsSearchFormAction, isAugmentedOptionsSearchPending] = useActionState<AugmentedOptionsSearchActionState, { ticker: string }>(augmentedOptionsSearchAction, localInitialAugmentedOptionsSearchState);
  const [performAiAnalysisActionState, performAiAnalysisFormAction, isPerformAiAnalysisPending] = useActionState<PerformAiAnalysisActionState, { ticker: string, stockSnapshotJson: string, standardTasJson: string, aiAnalyzedTaJson: string, marketStatusJson: string, augmentedTaSearchJson?: string, augmentedOptionsSearchJson?: string }>(performAiAnalysisAction, localInitialPerformAiAnalysisState);
  const [performAiOptionsAnalysisActionState, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending] = useActionState<PerformAiOptionsAnalysisActionState, { ticker: string, optionsChainJson: string, stockSnapshotJson: string, augmentedTaSearchJson?: string, augmentedOptionsSearchJson?: string }>(performAiOptionsAnalysisAction, localInitialPerformAiOptionsAnalysisState);
  
  useEffect(() => {
    const logPrefix = 'StockAnalysisContext:ChatActionStateEffect';
    if (chatActionState.status === 'idle' || isChatPending) { return; }
    logDebug(logPrefix as LogSourceId, 'StateChanged', `Status: ${chatActionState.status}, Message: ${chatActionState.message}`);
    if (chatActionState.status === 'success' && chatActionState.data) {
      logDebug(logPrefix as LogSourceId, 'GlobalDispatch', 'Dispatching CHAT_MESSAGE_ACTION_SUCCESS to Global FSM.');
      dispatchFsmEvent({ type: 'CHAT_MESSAGE_ACTION_SUCCESS', payload: chatActionState.data });
    } else if (chatActionState.status === 'error') {
      logDebug(logPrefix as LogSourceId, 'GlobalDispatch', `Dispatching CHAT_MESSAGE_ACTION_ERROR to Global FSM. Error: ${chatActionState.error}`);
      dispatchFsmEvent({ type: 'CHAT_MESSAGE_ACTION_ERROR', payload: { error: chatActionState.error, message: chatActionState.message, chatbotRequestJson: chatActionState.data?.chatbotRequestJson, chatbotResponseJson: chatActionState.data?.chatbotResponseJson }});
    }
  }, [chatActionState, isChatPending, dispatchFsmEvent, logDebug]);


  useEffect(() => {
    contextOriginals.log('[[ORCHESTRATOR_EFFECT_ENTRY]] GlobalFSM State:', globalFsmReducerState.current, 'Active Ticker:', globalFsmReducerState.variables.activeTicker, 'Profile:', globalFsmReducerState.variables.activePipelineProfile, 'isFetchPending:', isFetchDataPending, 'isInitialLoad:', globalFsmReducerState.variables.isInitialLoad);
  
    const state = fsmStateRef.current;
    const logPrefixOrchestrator = 'StockAnalysisContext:GlobalFSM_Orchestrator';
  
    type PipelineStep = 'base' | 'augmented_ta' | 'augmented_options' | 'key_takeaways' | 'options_analysis' | 'chat_stock' | 'chat_options' | 'chat_holistic';
    const dispatchNextCustomAction = (lastCompletedStep: PipelineStep) => {
      const activeTicker = state.variables.activeTicker;
      if (!activeTicker) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'CustomPipeline_Guard', `Aborting custom pipeline, no active ticker.`);
        _dispatchFsmEventActual({ type: 'FINALIZE_AUTOMATED_PIPELINE' });
        return;
      }
  
      const dispatchChat = (promptTitle: string, nextStepName: string) => {
        const promptTemplate = macroPrompts.find(p => p.title.includes(promptTitle))?.promptTemplate;
        if (promptTemplate) {
          logDebug(logPrefixOrchestrator as LogSourceId, 'CustomPipeline_Trigger', `Triggering ${nextStepName}.`);
          const payload: ChatActionInputs = {
            ticker: activeTicker, stockSnapshotJson: _stockSnapshotJson, aiKeyTakeawaysJson: _aiKeyTakeawaysJson,
            aiAnalyzedTaJson: _aiAnalyzedTaJson, aiOptionsAnalysisJson: _aiOptionsAnalysisJson,
            augmentedTaSearchJson: isDataReadyForProcessing(_augmentedTaSearchJson) ? _augmentedTaSearchJson : undefined,
            augmentedOptionsSearchJson: isDataReadyForProcessing(_augmentedOptionsSearchJson) ? _augmentedOptionsSearchJson : undefined,
            chatHistory: _chatHistory, userInput: promptTemplate.replace(/{TICKER}/g, activeTicker),
            isChatGroundingEnabled: _isChatGroundingEnabled,
          };
          _dispatchFsmEventActual({ type: 'SUBMIT_CHAT_MESSAGE', payload });
        } else {
          logDebug(logPrefixOrchestrator as LogSourceId, 'CustomPipeline_Error', `Could not find prompt template for '${promptTitle}'. Skipping.`);
          dispatchNextCustomAction('chat_stock');
        }
      };
      
      const stepOrder: PipelineStep[] = ['base', 'augmented_ta', 'augmented_options', 'key_takeaways', 'options_analysis', 'chat_stock', 'chat_options', 'chat_holistic'];
      const currentStepIndex = stepOrder.indexOf(lastCompletedStep);
  
      if (currentStepIndex === -1) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'CustomPipeline_Error', `Unknown step '${lastCompletedStep}'. Finalizing pipeline.`);
        _dispatchFsmEventActual({ type: 'FINALIZE_AUTOMATED_PIPELINE' });
        return;
      }
  
      for (let i = currentStepIndex + 1; i < stepOrder.length; i++) {
        const nextStep = stepOrder[i];
        if (nextStep === 'augmented_ta' && state.flags.isAugmentedTaSearchEnabled) { _dispatchFsmEventActual({ type: 'TRIGGER_AUGMENTED_TA_FETCH', payload: { ticker: activeTicker } }); return; }
        if (nextStep === 'augmented_options' && state.flags.isAugmentedOptionsSearchEnabled) { _dispatchFsmEventActual({ type: 'TRIGGER_AUGMENTED_OPTIONS_FETCH', payload: { ticker: activeTicker } }); return; }
        if (nextStep === 'key_takeaways' && state.flags.isAiKeyTakeawaysSelected) { _dispatchFsmEventActual({ type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS', payload: { ticker: activeTicker } }); return; }
        if (nextStep === 'options_analysis' && state.flags.isAiOptionsAnalysisSelected) { _dispatchFsmEventActual({ type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS', payload: { ticker: activeTicker } }); return; }
        if (nextStep === 'chat_stock' && state.flags.isAiChatStockTraderTakeawaysSelected) { dispatchChat("Stock Trader", "AI Chat: Stock Trader's Takeaways"); return; }
        if (nextStep === 'chat_options' && state.flags.isAiChatOptionsTraderTakeawaysSelected) { dispatchChat("Options Trader", "AI Chat: Options Trader's Takeaways"); return; }
        if (nextStep === 'chat_holistic' && state.flags.isAiChatHolisticTakeawaysSelected) { dispatchChat("Additional Holistic", "AI Chat: Additional Holistic Takeaways"); return; }
      }
  
      logDebug(logPrefixOrchestrator as LogSourceId, 'CustomPipeline_End', `No more custom analyses selected after '${lastCompletedStep}'. Finalizing.`);
      _dispatchFsmEventActual({ type: 'FINALIZE_AUTOMATED_PIPELINE' });
    };
  
    if (state.current === GlobalFsmState.APP_INITIALIZING && !initialInitializationDispatchedRef.current) {
      logDebug(logPrefixOrchestrator as LogSourceId, '[Orchestrator_Init]', 'Dispatching INITIALIZATION_COMPLETE.');
      _dispatchFsmEventActual({ type: 'INITIALIZATION_COMPLETE' });
      initialInitializationDispatchedRef.current = true;
    } else if (state.current === GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH && state.variables.activeTicker) {
      _dispatchFsmEventActual({ type: 'TRIGGER_DATA_FETCH' });
    } else if (state.current === GlobalFsmState.DATA_FETCH_IN_PROGRESS && state.variables.activeTicker && !isFetchDataPending) {
      startTransition(() => { fetchStockDataFormAction({ ticker: state.variables.activeTicker! }); });
    } else if (state.current === GlobalFsmState.DATA_FETCH_SUCCEEDED) {
      _dispatchFsmEventActual({ type: 'INITIATE_AI_TA_SEQUENCE' });
    } else if (state.current === GlobalFsmState.CALCULATING_AI_TA && state.variables.activeTicker && !isAnalyzeTaPending) {
      if (isDataReadyForProcessing(_stockSnapshotJson, logDebug, logPrefixOrchestrator as LogSourceId, 'SnapshotForAITACalc')) {
        startTransition(() => { analyzeTaFormAction({ stockSnapshotJson: _stockSnapshotJson, ticker: state.variables.activeTicker! }); });
      } else {
        _dispatchFsmEventActual({ type: 'AI_TA_FAILURE', payload: { message: `Snapshot data missing/error for AI TA of ${state.variables.activeTicker}.`, error: 'Snapshot data unavailable', aiAnalyzedTaRequestJson: JSON.stringify({ error: "Snapshot data missing for AI TA", ticker: state.variables.activeTicker }) } });
      }
    } else if (state.current === GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED) {
      if (state.variables.activePipelineProfile === 'standard') {
        dispatchNextCustomAction('base');
      }
    } else if (state.current === GlobalFsmState.FETCHING_AUGMENTED_TA && state.variables.activeTicker && !isAugmentedTaSearchPending) {
        startTransition(() => { augmentedTaSearchFormAction({ ticker: state.variables.activeTicker! }); });
    } else if (state.current === GlobalFsmState.AUGMENTED_TA_FETCH_SUCCEEDED || state.current === GlobalFsmState.AUGMENTED_TA_FETCH_FAILED) {
      if (state.variables.activePipelineProfile === 'standard') {
        dispatchNextCustomAction('augmented_ta');
      }
    } else if (state.current === GlobalFsmState.FETCHING_AUGMENTED_OPTIONS && state.variables.activeTicker && !isAugmentedOptionsSearchPending) {
        startTransition(() => { augmentedOptionsSearchFormAction({ ticker: state.variables.activeTicker! }); });
    } else if (state.current === GlobalFsmState.AUGMENTED_OPTIONS_FETCH_SUCCEEDED || state.current === GlobalFsmState.AUGMENTED_OPTIONS_FETCH_FAILED) {
      if (state.variables.activePipelineProfile === 'standard') {
        dispatchNextCustomAction('augmented_options');
      }
    } else if (state.current === GlobalFsmState.GENERATING_KEY_TAKEAWAYS && state.variables.activeTicker && !isPerformAiAnalysisPending) {
      if (isDataReadyForProcessing(_stockSnapshotJson, logDebug, logPrefixOrchestrator as LogSourceId, 'KT_Snapshot') && isDataReadyForProcessing(_standardTasJson, logDebug, logPrefixOrchestrator as LogSourceId, 'KT_StdTA') && isDataReadyForProcessing(_aiAnalyzedTaJson, logDebug, logPrefixOrchestrator as LogSourceId, 'KT_AiTA') && isDataReadyForProcessing(_marketStatusJson, logDebug, logPrefixOrchestrator as LogSourceId, 'KT_MarketStatus')) {
        startTransition(() => { performAiAnalysisFormAction({ ticker: state.variables.activeTicker!, stockSnapshotJson: _stockSnapshotJson, standardTasJson: _standardTasJson, aiAnalyzedTaJson: _aiAnalyzedTaJson, marketStatusJson: _marketStatusJson, augmentedTaSearchJson: isDataReadyForProcessing(_augmentedTaSearchJson) ? _augmentedTaSearchJson : undefined, augmentedOptionsSearchJson: isDataReadyForProcessing(_augmentedOptionsSearchJson) ? _augmentedOptionsSearchJson : undefined }); });
      } else {
        _dispatchFsmEventActual({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { message: `Prerequisite data for Key Takeaways of ${state.variables.activeTicker} is not ready.`, error: 'Prerequisite data unavailable' } });
      }
    } else if (state.current === GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED || state.current === GlobalFsmState.KEY_TAKEAWAYS_FAILED) {
      if (state.variables.activePipelineProfile === 'standard') {
        dispatchNextCustomAction('key_takeaways');
      } else {
        _dispatchFsmEventActual({ type: 'PROCEED_TO_IDLE' });
      }
    } else if (state.current === GlobalFsmState.ANALYZING_OPTIONS && state.variables.activeTicker && !isPerformAiOptionsAnalysisPending) {
      if (isDataReadyForProcessing(_stockSnapshotJson, logDebug, logPrefixOrchestrator as LogSourceId, 'Opt_Snapshot', 'Validation') && isDataReadyForProcessing(_optionsChainJson, logDebug, logPrefixOrchestrator as LogSourceId, 'Opt_Chain', 'Validation')) {
        startTransition(() => { performAiOptionsAnalysisFormAction({ ticker: state.variables.activeTicker!, optionsChainJson: _optionsChainJson, stockSnapshotJson: _stockSnapshotJson, augmentedTaSearchJson: isDataReadyForProcessing(_augmentedTaSearchJson) ? _augmentedTaSearchJson : undefined, augmentedOptionsSearchJson: isDataReadyForProcessing(_augmentedOptionsSearchJson) ? _augmentedOptionsSearchJson : undefined }); });
      } else {
        _dispatchFsmEventActual({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { message: `Prerequisite data for Options Analysis of ${state.variables.activeTicker} is not ready.`, error: 'Prerequisite data unavailable' } });
      }
    } else if (state.current === GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED || state.current === GlobalFsmState.OPTIONS_ANALYSIS_FAILED) {
      if (state.variables.activePipelineProfile === 'standard') {
        dispatchNextCustomAction('options_analysis');
      } else {
        _dispatchFsmEventActual({ type: 'PROCEED_TO_IDLE' });
      }
    } else if (state.current === GlobalFsmState.CHAT_MESSAGE_SUCCESS || state.current === GlobalFsmState.CHAT_MESSAGE_ERROR) {
      if (state.variables.activePipelineProfile === 'standard') {
        let lastPromptIdentifier: PipelineStep = 'base';
        try {
          const req = JSON.parse(_chatbotRequestJson);
          if (req.userInput.includes("Stock Trader's Takeaways")) lastPromptIdentifier = "chat_stock";
          else if (req.userInput.includes("Options Trader's Takeaways")) lastPromptIdentifier = "chat_options";
          else if (req.userInput.includes("Additional Holistic Takeaways")) lastPromptIdentifier = "chat_holistic";
        } catch (e) { }
        dispatchNextCustomAction(lastPromptIdentifier);
      }
    } else if (state.current === GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE && state.variables.activePipelineProfile === 'standard') {
      logDebug(logPrefixOrchestrator as LogSourceId, '[Orchestrator_Standard_PipelineFinallyComplete]', `Standard automated pipeline complete. Dispatching PROCEED_TO_IDLE.`);
      _dispatchFsmEventActual({ type: 'PROCEED_TO_IDLE' });
    } else if (state.current === GlobalFsmState.CHAT_MESSAGE_PENDING && state.variables.pendingChatSubmissionPayload && !isChatPending) {
      startTransition(() => { chatFormAction(state.variables.pendingChatSubmissionPayload!); });
      _dispatchFsmEventActual({ type: 'PENDING_CHAT_SUBMISSION_TRIGGERED' });
    }
  
  }, [
    globalFsmReducerState.current, globalFsmReducerState.variables, globalFsmReducerState.flags,
    isFetchDataPending, isAnalyzeTaPending, isPerformAiAnalysisPending, isPerformAiOptionsAnalysisPending, 
    isAugmentedTaSearchPending, isAugmentedOptionsSearchPending,
    isChatPending, 
    _dispatchFsmEventActual, logDebug, contextOriginals, 
    _stockSnapshotJson, _standardTasJson, _aiAnalyzedTaJson, _marketStatusJson, _optionsChainJson,
    _aiKeyTakeawaysJson, _aiOptionsAnalysisJson, _chatHistory, _isChatGroundingEnabled, _chatbotRequestJson,
    _augmentedTaSearchJson, _augmentedOptionsSearchJson
  ]);

  useEffect(() => {
    const currentFsmState = fsmStateRef.current.current; const logPrefix = 'StockAnalysisContext:ActionStateEffect_FetchData';
    if (currentFsmState !== GlobalFsmState.DATA_FETCH_IN_PROGRESS) { if (fetchDataActionState.status !== 'idle') { logDebug(logPrefix as LogSourceId, 'GuardBypass', `FSM state ${currentFsmState} not DATA_FETCH_IN_PROGRESS. Ignoring update.`); } return; }
    if (fetchDataActionState.status === 'success' && fetchDataActionState.data) { dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: fetchDataActionState.data }); }
    else if (fetchDataActionState.status === 'error') {
        if (fetchDataActionState.message && fetchDataActionState.message.includes("Stale data detected") && fetchDataActionState.data) { dispatchFsmEvent({ type: 'STALE_DATA_FROM_ACTION', payload: { error: fetchDataActionState.error || "Stale data error", message: fetchDataActionState.message, expectedTicker: fsmStateRef.current.variables.activeTicker || "UNKNOWN", actionStateData: fetchDataActionState.data }}); }
        else { dispatchFsmEvent({ type: 'FETCH_DATA_FAILURE', payload: { error: fetchDataActionState.error, message: fetchDataActionState.message, polygonApiRequestLogJson: fetchDataActionState.data?.polygonApiRequestLogJson, polygonApiResponseLogJson: fetchDataActionState.data?.polygonApiResponseLogJson }}); }
    }
  }, [fetchDataActionState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    const currentFsmState = fsmStateRef.current.current; const logPrefix = 'StockAnalysisContext:ActionStateEffect_AnalyzeTa';
    if (currentFsmState !== GlobalFsmState.CALCULATING_AI_TA) { if (analyzeTaActionState.status !== 'idle') { logDebug(logPrefix as LogSourceId, 'GuardBypass', `FSM state ${currentFsmState} not CALCULATING_AI_TA. Ignoring update.`); } return; }
    if (analyzeTaActionState.status === 'success' && analyzeTaActionState.data) { dispatchFsmEvent({ type: 'AI_TA_SUCCESS', payload: analyzeTaActionState.data }); }
    else if (analyzeTaActionState.status === 'error') { dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: analyzeTaActionState.error, message: analyzeTaActionState.message, aiAnalyzedTaRequestJson: analyzeTaActionState.data?.aiAnalyzedTaRequestJson }}); }
  }, [analyzeTaActionState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    const currentFsmState = fsmStateRef.current.current; const logPrefix = 'StockAnalysisContext:ActionStateEffect_AugmentedTa';
    if (currentFsmState !== GlobalFsmState.FETCHING_AUGMENTED_TA) { if (augmentedTaSearchActionState.status !== 'idle') { logDebug(logPrefix as LogSourceId, 'GuardBypass', `FSM state ${currentFsmState} not FETCHING_AUGMENTED_TA. Ignoring update.`); } return; }
    if (augmentedTaSearchActionState.status === 'success' && augmentedTaSearchActionState.data) { dispatchFsmEvent({ type: 'AUGMENTED_TA_FETCH_SUCCESS', payload: augmentedTaSearchActionState.data }); }
    else if (augmentedTaSearchActionState.status === 'error') { dispatchFsmEvent({ type: 'AUGMENTED_TA_FETCH_FAILURE', payload: { error: augmentedTaSearchActionState.error, message: augmentedTaSearchActionState.message, augmentedTaSearchJson: augmentedTaSearchActionState.data?.augmentedTaSearchJson }}); }
  }, [augmentedTaSearchActionState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    const currentFsmState = fsmStateRef.current.current; const logPrefix = 'StockAnalysisContext:ActionStateEffect_AugmentedOptions';
    if (currentFsmState !== GlobalFsmState.FETCHING_AUGMENTED_OPTIONS) { if (augmentedOptionsSearchActionState.status !== 'idle') { logDebug(logPrefix as LogSourceId, 'GuardBypass', `FSM state ${currentFsmState} not FETCHING_AUGMENTED_OPTIONS. Ignoring update.`); } return; }
    if (augmentedOptionsSearchActionState.status === 'success' && augmentedOptionsSearchActionState.data) { dispatchFsmEvent({ type: 'AUGMENTED_OPTIONS_FETCH_SUCCESS', payload: augmentedOptionsSearchActionState.data }); }
    else if (augmentedOptionsSearchActionState.status === 'error') { dispatchFsmEvent({ type: 'AUGMENTED_OPTIONS_FETCH_FAILURE', payload: { error: augmentedOptionsSearchActionState.error, message: augmentedOptionsSearchActionState.message, augmentedOptionsSearchJson: augmentedOptionsSearchActionState.data?.augmentedOptionsSearchJson }}); }
  }, [augmentedOptionsSearchActionState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    const currentFsmState = fsmStateRef.current.current; const logPrefix = 'StockAnalysisContext:ActionStateEffect_PerformAiAnalysis';
    if (currentFsmState !== GlobalFsmState.GENERATING_KEY_TAKEAWAYS) { if (performAiAnalysisActionState.status !== 'idle') { logDebug(logPrefix as LogSourceId, 'GuardBypass', `FSM state ${currentFsmState} not GENERATING_KEY_TAKEAWAYS. Ignoring update.`); } return; }
    if (performAiAnalysisActionState.status === 'success' && performAiAnalysisActionState.data) { dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: performAiAnalysisActionState.data }); }
    else if (performAiAnalysisActionState.status === 'error') { dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: performAiAnalysisActionState.error, message: performAiAnalysisActionState.message, aiKeyTakeawaysRequestJson: performAiAnalysisActionState.data?.aiKeyTakeawaysRequestJson }}); }
  }, [performAiAnalysisActionState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    const currentFsmState = fsmStateRef.current.current; const logPrefix = 'StockAnalysisContext:ActionStateEffect_PerformAiOptions';
    if (currentFsmState !== GlobalFsmState.ANALYZING_OPTIONS) { if (performAiOptionsAnalysisActionState.status !== 'idle') { logDebug(logPrefix as LogSourceId, 'GuardBypass', `FSM state ${currentFsmState} not ANALYZING_OPTIONS. Ignoring update.`); } return; }
    if (performAiOptionsAnalysisActionState.status === 'success' && performAiOptionsAnalysisActionState.data) { dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: performAiOptionsAnalysisActionState.data }); }
    else if (performAiOptionsAnalysisActionState.status === 'error') { dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: performAiOptionsAnalysisActionState.error, message: performAiOptionsAnalysisActionState.message, aiOptionsAnalysisRequestJson: performAiOptionsAnalysisActionState.data?.aiOptionsAnalysisRequestJson }}); }
  }, [performAiOptionsAnalysisActionState, dispatchFsmEvent, logDebug]);
  
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
        state.current === GlobalFsmState.CHAT_MESSAGE_SUCCESS ||
        state.current === GlobalFsmState.CHAT_MESSAGE_ERROR) &&
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
    augmentedTaSearchJson: _augmentedTaSearchJson, setAugmentedTaSearchJson: contextSetters.setAugmentedTaSearchJson,
    augmentedOptionsSearchJson: _augmentedOptionsSearchJson, setAugmentedOptionsSearchJson: contextSetters.setAugmentedOptionsSearchJson,
    chatbotRequestJson: _chatbotRequestJson, setChatbotRequestJson: contextSetters.setChatbotRequestJson,
    chatbotResponseJson: _chatbotResponseJson, setChatbotResponseJson: contextSetters.setChatbotResponseJson,
    chatHistory: _chatHistory, addChatMessage, clearChatHistory,
    isClientDebugConsoleEnabled: _isClientDebugConsoleEnabled, isClientDebugConsoleOpen: _isClientDebugConsoleOpen,
    logSourceConfig: _logSourceConfig, setClientDebugConsoleEnabled, setClientDebugConsoleOpen,
    setLogSourceEnabled, enableAllLogSources, disableAllLogSources, logDebug,
    fsmState: globalFsmReducerState.current, previousFsmState: globalFsmReducerState.previous,
    fsmVariables: globalFsmReducerState.variables, fsmFlags: globalFsmReducerState.flags,
    targetFsmDisplayState: _targetFsmDisplayState, dispatchFsmEvent,
    mainTabFsmDisplay: _mainTabFsmDisplay, setMainTabFsmDisplay,
    chatbotFsmDisplay: _chatbotFsmDisplay, setChatbotFsmDisplay,
    debugConsoleMenuFsmDisplay: _debugConsoleMenuFsmDisplayInternal,
    setReducedStartupLoggingEnabled, 
    isReducedStartupLoggingEnabled: _isReducedStartupLoggingEnabled,
    setUiRenderLoggingEnabled,
    isUiRenderLoggingEnabled: _isUiRenderLoggingEnabled,
    setChatGroundingEnabled,
    isChatGroundingEnabled: _isChatGroundingEnabled,
  }), [
    _polygonApiRequestLogJson, contextSetters, _polygonApiResponseLogJson,
    _marketStatusJson, _stockSnapshotJson, _standardTasJson, _optionsChainJson,
    _aiAnalyzedTaRequestJson, _aiAnalyzedTaJson, _aiOptionsAnalysisRequestJson,
    _aiOptionsAnalysisJson, _aiKeyTakeawaysRequestJson, _aiKeyTakeawaysJson,
    _augmentedTaSearchJson, _augmentedOptionsSearchJson, _chatbotRequestJson, 
    _chatbotResponseJson, _chatHistory, addChatMessage,
    clearChatHistory, _isClientDebugConsoleEnabled, _isClientDebugConsoleOpen,
    _logSourceConfig, setClientDebugConsoleEnabled, setClientDebugConsoleOpen,
    setLogSourceEnabled, enableAllLogSources, disableAllLogSources, logDebug,
    globalFsmReducerState, _targetFsmDisplayState, dispatchFsmEvent,
    _mainTabFsmDisplay, setMainTabFsmDisplay, _chatbotFsmDisplay, setChatbotFsmDisplay,
    _debugConsoleMenuFsmDisplayInternal, 
    _isReducedStartupLoggingEnabled, setReducedStartupLoggingEnabled,
    _isUiRenderLoggingEnabled, setUiRenderLoggingEnabled,
    _isChatGroundingEnabled, setChatGroundingEnabled,
  ]);

  return (<StockAnalysisContext.Provider value={contextValue}>{children}</StockAnalysisContext.Provider>);
}

export function useStockAnalysis() {
  const context = useContext(StockAnalysisContext);
  if (context === undefined) { throw new Error('useStockAnalysis must be used within a StockAnalysisProvider'); }
  return context;
}
