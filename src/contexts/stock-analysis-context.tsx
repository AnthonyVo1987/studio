
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useReducer, useRef, startTransition, useMemo } from 'react';
import type { LogSourceId, LogSourceConfig, LogType } from '@/lib/debug-log-types';
import { logSourceIds, defaultLogSourceConfig, logTypes as allLogTypes } from '@/lib/debug-log-types';
import { addEntryToGlobalLogBuffer, clearGlobalLogBuffer } from '@/lib/global-log-buffer';
import { fetchStockDataAction, type AnalyzeStockServerActionState, type StockDataFetchResult } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction, type AnalyzeTaActionState, type AnalyzeTaResult } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction, type PerformAiAnalysisActionState, type PerformAiAnalysisResult } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction, type PerformAiOptionsAnalysisActionState, type PerformAiOptionsAnalysisResult } from '@/actions/perform-ai-options-analysis-action';
import type { ChatActionInputs, ChatActionResult } from '@/actions/chat-server-action'; // For payload type
import { useActionState } from 'react';
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

export interface GlobalFsmContextVariables {
  activeTicker: string | null;
  userInputTicker: string;
  isInitialLoad: boolean;
  lastError: { message: string; source: string; details?: any } | null;
  pendingChatSubmissionPayload: ChatActionInputs | null;
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
  isDebugConsoleFilterMenuOpen: boolean;
  isDebugConsoleCopyMenuOpen: boolean;
  isDebugConsoleExportMenuOpen: boolean;
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
interface FetchDataFailurePayload {
  error?: string | null;
  message?: string | null;
  polygonApiRequestLogJson?: string;
  polygonApiResponseLogJson?: string;
}
interface StaleDataFromActionPayload {
  error: string;
  message: string;
  expectedTicker: string;
  foundTickerInSnapshot?: string;
  actionStateData?: StockDataFetchResult;
}
interface AiTaSuccessPayload extends AnalyzeTaResult {}
interface AiTaFailurePayload { error?: string | null; message?: string | null; aiAnalyzedTaRequestJson?: string; }
interface AiKeyTakeawaysSuccessPayload extends PerformAiAnalysisResult {}
interface AiKeyTakeawaysFailurePayload { error?: string | null; message?: string | null; aiKeyTakeawaysRequestJson?: string; }
interface AiOptionsAnalysisSuccessPayload extends PerformAiOptionsAnalysisResult {}
interface AiOptionsAnalysisFailurePayload { error?: string | null; message?: string | null; aiOptionsAnalysisRequestJson?: string; }
interface SubmitChatMessagePayload extends ChatActionInputs {}
interface ChatMessageActionSuccessPayload extends ChatActionResult {}
interface ChatMessageActionErrorPayload { error?: string | null; message?: string | null; chatbotRequestJson?: string; chatbotResponseJson?: string; }
type DebugConsoleMenuType = 'filter' | 'copy' | 'export';
interface ToggleDebugConsoleMenuPayload { menu: DebugConsoleMenuType; isOpen: boolean; }


export type FsmEvent =
  | { type: 'START_FULL_ANALYSIS'; payload: { ticker: string } }
  | { type: 'INITIALIZATION_COMPLETE' }

  | { type: 'TRIGGER_DATA_FETCH' }
  | { type: 'FETCH_DATA_SUCCESS'; payload: FetchDataSuccessPayload }
  | { type: 'FETCH_DATA_FAILURE'; payload: FetchDataFailurePayload }
  | { type: 'STALE_DATA_FROM_ACTION'; payload: StaleDataFromActionPayload }

  | { type: 'INITIATE_AI_TA_SEQUENCE' }
  | { type: 'AI_TA_SUCCESS'; payload: AiTaSuccessPayload }
  | { type: 'AI_TA_FAILURE'; payload: AiTaFailurePayload }

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
  chatbotRequestJson: string;
  chatbotResponseJson: string;

  chatHistory: ChatMessage[];

  isClientDebugConsoleEnabled: boolean;
  isClientDebugConsoleOpen: boolean;
  logSourceConfig: LogSourceConfig;

  globalFsmState: GlobalFsmReducerManagedState;
  targetFsmDisplayState: GlobalFsmState | null;

  isFsmDebugCardEnabled: boolean;
  isFsmDebugCardOpen: boolean;

  mainTabFsmDisplay: FsmDisplayTuple | null;
  chatbotFsmDisplay: FsmDisplayTuple | null;
  debugConsoleMenuFsmDisplay: FsmDisplayTuple | null;

  isInitialAppStartupComplete: boolean;
  isReducedStartupLoggingEnabled: boolean;
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

  setFsmDebugCardEnabled: (enabled: boolean) => void;
  setFsmDebugCardOpen: (open: boolean) => void;

  setMainTabFsmDisplay: (display: FsmDisplayTuple | null) => void;
  setChatbotFsmDisplay: (display: FsmDisplayTuple | null) => void;

  setReducedStartupLoggingEnabled: (enabled: boolean) => void;
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
    isDebugConsoleFilterMenuOpen: false,
    isDebugConsoleCopyMenuOpen: false,
    isDebugConsoleExportMenuOpen: false,
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
  chatbotRequestJson: initialJsonPlaceholder,
  chatbotResponseJson: initialJsonPlaceholder,
  chatHistory: [],
  isClientDebugConsoleEnabled: true,
  isClientDebugConsoleOpen: true,
  logSourceConfig: defaultLogSourceConfig,

  globalFsmState: initialGlobalFsmReducerState,
  targetFsmDisplayState: null,

  isFsmDebugCardEnabled: true,
  isFsmDebugCardOpen: true,

  mainTabFsmDisplay: { ...initialFsmDisplayTuple, current: GlobalFsmState.IDLE.toString() },
  chatbotFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
  debugConsoleMenuFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },

  isInitialAppStartupComplete: false,
  isReducedStartupLoggingEnabled: true,
};

const localInitialStockDataFetchResult: AnalyzeStockServerActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const localInitialAnalyzeTaState: AnalyzeTaActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const localInitialPerformAiAnalysisState: PerformAiAnalysisActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const localInitialPerformAiOptionsAnalysisState: PerformAiOptionsAnalysisActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};


const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

let chatMessageIdCounter = 0;

export function StockAnalysisProvider({ children }: { children: ReactNode }) {
  if (typeof window !== 'undefined' && !(console as any).__stockSageContextOriginals) {
    (console as any).__stockSageContextOriginals = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
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
  const [_chatbotRequestJson, _setChatbotRequestJson] = useState<string>(defaultState.chatbotRequestJson);
  const [_chatbotResponseJson, _setChatbotResponseJson] = useState<string>(defaultState.chatbotResponseJson);

  const [chatHistory, _setChatHistory] = useState<ChatMessage[]>(defaultState.chatHistory);

  const [_isClientDebugConsoleEnabled, _setClientDebugConsoleEnabled] = useState<boolean>(defaultState.isClientDebugConsoleEnabled);
  const [_isClientDebugConsoleOpen, _setClientDebugConsoleOpen] = useState<boolean>(defaultState.isClientDebugConsoleOpen);
  const [_logSourceConfig, _setLogSourceConfig] = useState<LogSourceConfig>(defaultState.logSourceConfig);
  const [_targetFsmDisplayState, _setTargetFsmDisplayState] = useState<GlobalFsmState | null>(defaultState.targetFsmDisplayState);

  const [_isFsmDebugCardEnabled, _setIsFsmDebugCardEnabled] = useState<boolean>(defaultState.isFsmDebugCardEnabled);
  const [_isFsmDebugCardOpen, _setIsFsmDebugCardOpen] = useState<boolean>(defaultState.isFsmDebugCardOpen);

  const [_mainTabFsmDisplay, _setMainTabFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.mainTabFsmDisplay);
  const [_chatbotFsmDisplay, _setChatbotFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.chatbotFsmDisplay);
  const [_debugConsoleMenuFsmDisplayInternal, _setDebugConsoleMenuFsmDisplayInternal] = useState<FsmDisplayTuple | null>(defaultState.debugConsoleMenuFsmDisplay);

  const [_isInitialAppStartupComplete, _setIsInitialAppStartupComplete] = useState<boolean>(defaultState.isInitialAppStartupComplete);
  const [_isReducedStartupLoggingEnabled, _setIsReducedStartupLoggingEnabled] = useState<boolean>(defaultState.isReducedStartupLoggingEnabled);
  const initialInitializationDispatchedRef = useRef(false);
  const initialStartupFlaggedRef = useRef(false);


  const logDebug = useCallback((source: LogSourceId, category: string, ...messages: any[]) => {
      console.debug(LOGDEBUG_MARKER, source, category, ...messages);
  }, []);

  const setAndLogJson = useCallback((setter: React.Dispatch<React.SetStateAction<string>>, name: string, value: string) => {
    setter(value);
  }, []);

  const setPolygonApiRequestLogJson = useCallback((json: string) => setAndLogJson(_setPolygonApiRequestLogJson, 'polygonApiRequestLogJson', json), [_setPolygonApiRequestLogJson, setAndLogJson]);
  const setPolygonApiResponseLogJson = useCallback((json: string) => setAndLogJson(_setPolygonApiResponseLogJson, 'polygonApiResponseLogJson', json), [_setPolygonApiResponseLogJson, setAndLogJson]);
  const setMarketStatusJson = useCallback((json: string) => setAndLogJson(_setMarketStatusJson, 'marketStatusJson', json), [_setMarketStatusJson, setAndLogJson]);
  const setStockSnapshotJson = useCallback((json: string) => setAndLogJson(_setStockSnapshotJson, 'stockSnapshotJson', json), [_setStockSnapshotJson, setAndLogJson]);
  const setStandardTasJson = useCallback((json: string) => setAndLogJson(_setStandardTasJson, 'standardTasJson', json), [_setStandardTasJson, setAndLogJson]);
  const setOptionsChainJson = useCallback((json: string) => setAndLogJson(_setOptionsChainJson, 'optionsChainJson', json), [_setOptionsChainJson, setAndLogJson]);
  const setAiAnalyzedTaRequestJson = useCallback((json: string) => setAndLogJson(_setAiAnalyzedTaRequestJson, 'aiAnalyzedTaRequestJson', json), [_setAiAnalyzedTaRequestJson, setAndLogJson]);
  const setAiAnalyzedTaJson = useCallback((json: string) => setAndLogJson(_setAiAnalyzedTaJson, 'aiAnalyzedTaJson', json), [_setAiAnalyzedTaJson, setAndLogJson]);
  const setAiOptionsAnalysisRequestJson = useCallback((json: string) => setAndLogJson(_setAiOptionsAnalysisRequestJson, 'aiOptionsAnalysisRequestJson', json), [_setAiOptionsAnalysisRequestJson, setAndLogJson]);
  const setAiOptionsAnalysisJson = useCallback((json: string) => setAndLogJson(_setAiOptionsAnalysisJson, 'aiOptionsAnalysisJson', json), [_setAiOptionsAnalysisJson, setAndLogJson]);
  const setAiKeyTakeawaysRequestJson = useCallback((json: string) => setAndLogJson(_setAiKeyTakeawaysRequestJson, 'aiKeyTakeawaysRequestJson', json), [_setAiKeyTakeawaysRequestJson, setAndLogJson]);
  const setAiKeyTakeawaysJson = useCallback((json: string) => setAndLogJson(_setAiKeyTakeawaysJson, 'aiKeyTakeawaysJson', json), [_setAiKeyTakeawaysJson, setAndLogJson]);
  const setChatbotRequestJson = useCallback((json: string) => setAndLogJson(_setChatbotRequestJson, 'chatbotRequestJson (Interactive)', json), [_setChatbotRequestJson, setAndLogJson]);
  const setChatbotResponseJson = useCallback((json: string) => setAndLogJson(_setChatbotResponseJson, 'chatbotResponseJson (Interactive)', json), [_setChatbotResponseJson, setAndLogJson]);

  const contextSetters: StockAnalysisContextSetters = {
    setPolygonApiRequestLogJson, setPolygonApiResponseLogJson,
    setMarketStatusJson, setStockSnapshotJson, setStandardTasJson,
    setOptionsChainJson, setAiAnalyzedTaRequestJson, setAiAnalyzedTaJson,
    setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson,
    setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
    setChatbotRequestJson, setChatbotResponseJson,
  };

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
      if (prev.length > 0) {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === message.role && lastMessage.content === message.content) {
          logDebug('StockAnalysisContext', 'GlobalChatHistoryUpdate_Guard', `Skipped adding duplicate chat message from ${message.role} with content: "${message.content.substring(0,30)}..." (ID attempted: ${uniqueMessageId})`);
          return prev;
        }
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
    _setPolygonApiRequestLogJson(pendingJson);
    _setPolygonApiResponseLogJson(pendingJson);
    _setMarketStatusJson(pendingJson);
    _setStockSnapshotJson(pendingJson);
    _setStandardTasJson(pendingJson);
    _setOptionsChainJson(pendingJson);
    _setAiAnalyzedTaRequestJson(pendingJson);
    _setAiAnalyzedTaJson(pendingJson);
    _setAiKeyTakeawaysRequestJson(pendingJson);
    _setAiKeyTakeawaysJson(pendingJson);
    _setAiOptionsAnalysisRequestJson(pendingJson);
    _setAiOptionsAnalysisJson(pendingJson);
    if (isFullAnalysis) {
        _setChatbotRequestJson(chatPendingJson);
        _setChatbotResponseJson(chatPendingJson);
    }
  }, [logDebug]);

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
    logSourceIds.forEach(id => {
      newConfig[id] = id === 'DebugConsole';
    });
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

  const setFsmDebugCardEnabled = useCallback((enabled: boolean) => {
    logDebug('StockAnalysisContext', 'FsmDebugCardToggle', `FSM Debug Card Enabled toggled to: ${enabled}`);
    _setIsFsmDebugCardEnabled(enabled);
    if (enabled) {
        _setIsFsmDebugCardOpen(true);
    } else {
        _setIsFsmDebugCardOpen(false);
    }
  }, [logDebug]);

  const setMainTabFsmDisplay = useCallback((display: FsmDisplayTuple | null) => {
    _setMainTabFsmDisplay(prevDisplay => {
      const hasChanged = !(
        prevDisplay?.current === display?.current &&
        prevDisplay?.previous === display?.previous &&
        prevDisplay?.target === display?.target
      );
       if (hasChanged) {
        logDebug('StockAnalysisContext', 'FSMDisplayTupleUpdate', 'MainTabFsmDisplay updated.', display);
        return display;
      }
      return prevDisplay;
    });
  }, [_setMainTabFsmDisplay, logDebug]);

  const setChatbotFsmDisplay = useCallback((display: FsmDisplayTuple | null) => {
    _setChatbotFsmDisplay(prevDisplay => {
      const hasChanged = !(
        prevDisplay?.current === display?.current &&
        prevDisplay?.previous === display?.previous &&
        prevDisplay?.target === display?.target
      );
      if (hasChanged) {
        logDebug('StockAnalysisContext', 'FSMDisplayTupleUpdate', 'ChatbotFsmDisplay updated.', display);
        return display;
      }
      return prevDisplay;
    });
  }, [_setChatbotFsmDisplay, logDebug]);

  const setReducedStartupLoggingEnabled = useCallback((enabled: boolean) => {
    logDebug('StockAnalysisContext', 'StartupLogToggle', `ReducedStartupLoggingEnabled set to: ${enabled}.`);
    _setIsReducedStartupLoggingEnabled(enabled);
  }, [logDebug]);

  const fsmReducer = (
    state: GlobalFsmReducerManagedState,
    event: FsmEvent
  ): GlobalFsmReducerManagedState => {
    const previousState = state.current;
    const logPrefixFsmReducer = 'StockAnalysisContext:GlobalFSM';
    logDebug(logPrefixFsmReducer as LogSourceId, 'EventReceived', `Type: ${event.type}, FromState: ${previousState}`);

    if ('payload' in event && event.type !== 'SUBMIT_CHAT_MESSAGE') {
        logDebug(logPrefixFsmReducer as LogSourceId, 'EventPayload', `For ${event.type}:`, JSON.stringify(event.payload).substring(0, 150));
    } else if (event.type === 'SUBMIT_CHAT_MESSAGE') {
        logDebug(logPrefixFsmReducer as LogSourceId, 'EventPayload_Chat', `For SUBMIT_CHAT_MESSAGE: UserInput: ${event.payload.userInput.substring(0,50)}..., HistoryLen: ${event.payload.chatHistory?.length}`);
    }

    let nextCurrentState: GlobalFsmState = previousState;
    let nextVariables: GlobalFsmContextVariables = { ...state.variables };
    let nextFlags: GlobalFsmFlags = { ...state.flags };
    let currentDebugConsoleMenuFsmStateForDisplay = _debugConsoleMenuFsmDisplayInternal?.current || 'IDLE';

    const errorJsonWithDetails = (message: string, details: string | null | undefined) =>
        `{ "status": "error", "message": "${message.replace(/"/g, '\\"')}", "details": "${(details || '').replace(/"/g, '\\"')}" }`;

    switch (event.type) {
      case 'TOGGLE_DEBUG_CONSOLE_MENU': {
        const { menu, isOpen } = event.payload;
        let newMenuDisplayState = 'IDLE';
        if (isOpen) {
            nextFlags.isDebugConsoleFilterMenuOpen = menu === 'filter';
            nextFlags.isDebugConsoleCopyMenuOpen = menu === 'copy';
            nextFlags.isDebugConsoleExportMenuOpen = menu === 'export';
            if (menu === 'filter') newMenuDisplayState = 'FILTER_MENU_OPEN';
            if (menu === 'copy') newMenuDisplayState = 'COPY_MENU_OPEN';
            if (menu === 'export') newMenuDisplayState = 'EXPORT_MENU_OPEN';
        } else {
            if (menu === 'filter') nextFlags.isDebugConsoleFilterMenuOpen = false;
            if (menu === 'copy') nextFlags.isDebugConsoleCopyMenuOpen = false;
            if (menu === 'export') nextFlags.isDebugConsoleExportMenuOpen = false;
        }
        logDebug(logPrefixFsmReducer as LogSourceId, 'FlagsUpdate_DebugMenu', `Menu: ${menu}, isOpen: ${isOpen}. Filter: ${nextFlags.isDebugConsoleFilterMenuOpen}, Copy: ${nextFlags.isDebugConsoleCopyMenuOpen}, Export: ${nextFlags.isDebugConsoleExportMenuOpen}`);
        _setDebugConsoleMenuFsmDisplayInternal(prev => ({
            previous: prev?.current || 'IDLE',
            current: newMenuDisplayState,
            target: null,
        }));
        currentDebugConsoleMenuFsmStateForDisplay = newMenuDisplayState;
        return { ...state, flags: nextFlags, previous: previousState };
      }
    }

    switch (previousState) {
      case GlobalFsmState.IDLE:
      case GlobalFsmState.AWAITING_TICKER_INPUT:
      case GlobalFsmState.VALID_TICKER_ENTERED:
      case GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE:
      case GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED:
      case GlobalFsmState.KEY_TAKEAWAYS_FAILED:
      case GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED:
      case GlobalFsmState.OPTIONS_ANALYSIS_FAILED:
      case GlobalFsmState.CHAT_MESSAGE_SUCCESS:
      case GlobalFsmState.CHAT_MESSAGE_ERROR:
      case GlobalFsmState.DATA_FETCH_FAILED:
      case GlobalFsmState.ERROR_STALE_DATA:
      case GlobalFsmState.AI_TA_CALCULATION_FAILED:
        if (event.type === 'START_FULL_ANALYSIS') {
          nextVariables.activeTicker = event.payload.ticker;
          nextVariables.userInputTicker = event.payload.ticker;
          nextFlags.canAnalyzeStock = false;
          nextFlags.isMarketDataReady = false; nextFlags.isSnapshotDataReady = false;
          nextFlags.isStandardTADataReady = false; nextFlags.isOptionsChainDataReady = false;
          nextFlags.isCalculatedTADataReady = false; nextFlags.isKeyTakeawaysDataAvailable = false;
          nextFlags.isOptionsAnalysisDataAvailable = false;
          nextVariables.lastError = null; nextVariables.pendingChatSubmissionPayload = null;
          setAllPlaceholdersInternal(event.payload.ticker, true);
          nextCurrentState = GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `From ${previousState} -> START_FULL_ANALYSIS for ${event.payload.ticker}. To PIPELINE_REQUESTED_DATA_FETCH.`);
        } else if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') {
            if (state.variables.activeTicker === event.payload.ticker) {
                contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
                contextSetters.setAiKeyTakeawaysJson(pendingJson);
                nextFlags.isKeyTakeawaysDataAvailable = false;
                nextVariables.lastError = null; nextVariables.pendingChatSubmissionPayload = null;
                nextCurrentState = GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
                logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `From ${previousState} -> TRIGGER_MANUAL_KEY_TAKEAWAYS for ${event.payload.ticker}. To GENERATING_KEY_TAKEAWAYS.`);
            } else {
                 logDebug(logPrefixFsmReducer as LogSourceId, 'ActionInvalid', `TRIGGER_MANUAL_KEY_TAKEAWAYS for ${event.payload.ticker} ignored. Active ticker is ${state.variables.activeTicker}.`);
            }
        } else if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') {
            if (state.variables.activeTicker === event.payload.ticker) {
                contextSetters.setAiOptionsAnalysisRequestJson(pendingJson);
                contextSetters.setAiOptionsAnalysisJson(pendingJson);
                nextFlags.isOptionsAnalysisDataAvailable = false;
                nextVariables.lastError = null; nextVariables.pendingChatSubmissionPayload = null;
                nextCurrentState = GlobalFsmState.ANALYZING_OPTIONS;
                logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `From ${previousState} -> TRIGGER_MANUAL_OPTIONS_ANALYSIS for ${event.payload.ticker}. To ANALYZING_OPTIONS.`);
            } else {
                 logDebug(logPrefixFsmReducer as LogSourceId, 'ActionInvalid', `TRIGGER_MANUAL_OPTIONS_ANALYSIS for ${event.payload.ticker} ignored. Active ticker is ${state.variables.activeTicker}.`);
            }
        } else if (event.type === 'SUBMIT_CHAT_MESSAGE') {
            if (nextVariables.activeTicker) {
                 if (state.current === GlobalFsmState.CHAT_MESSAGE_PENDING &&
                    nextVariables.pendingChatSubmissionPayload?.userInput === event.payload.userInput) {
                    logDebug(logPrefixFsmReducer as LogSourceId, 'GuardDuplicateSubmission', `SUBMIT_CHAT_MESSAGE for "${event.payload.userInput.substring(0,20)}" ignored, already pending with same input.`);
                    return { ...state, previous: previousState };
                }

                const userMessage: ChatMessage = {
                    id: `${Date.now()}_${chatMessageIdCounter++}_user_gbl_fsm`,
                    role: 'user',
                    content: event.payload.userInput
                };

                _setChatHistory(prev => {
                    if (prev.length > 0 && prev[prev.length - 1].role === 'user' && prev[prev.length - 1].content === userMessage.content) {
                        logDebug(logPrefixFsmReducer as LogSourceId, 'GuardDuplicateUserMsgRender', `Skipping add user message, content identical to last user msg. Current ID: ${userMessage.id}`);
                        return prev;
                    }
                    return [...prev, userMessage];
                });

                nextVariables.pendingChatSubmissionPayload = { ...event.payload };
                nextCurrentState = GlobalFsmState.CHAT_MESSAGE_PENDING;
                contextSetters.setChatbotRequestJson(chatPendingJson);
                contextSetters.setChatbotResponseJson(chatPendingJson);
                logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `From ${previousState} -> SUBMIT_CHAT_MESSAGE for ${nextVariables.activeTicker}. To CHAT_MESSAGE_PENDING.`);
            } else {
                logDebug(logPrefixFsmReducer as LogSourceId, 'ActionInvalid', `SUBMIT_CHAT_MESSAGE ignored. No active analysis ticker.`);
            }
        }
        break;

      case GlobalFsmState.GENERATING_KEY_TAKEAWAYS:
        if (event.type === 'KEY_TAKEAWAYS_SUCCESS') {
          contextSetters.setAiKeyTakeawaysRequestJson(event.payload.aiKeyTakeawaysRequestJson);
          contextSetters.setAiKeyTakeawaysJson(event.payload.aiKeyTakeawaysJson);
          nextFlags.isKeyTakeawaysDataAvailable = true;
          nextCurrentState = GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `GENERATING_KEY_TAKEAWAYS -> KEY_TAKEAWAYS_SUCCESS. To KEY_TAKEAWAYS_SUCCEEDED.`);
        } else if (event.type === 'KEY_TAKEAWAYS_FAILURE') {
          const errorPayloadKT = event.payload; const errorMsgKT = errorPayloadKT.message || 'AI Key Takeaways failed';
          const ktErrorJson = errorJsonWithDetails(errorMsgKT, errorPayloadKT.error);
          contextSetters.setAiKeyTakeawaysRequestJson(errorPayloadKT.aiKeyTakeawaysRequestJson || ktErrorJson);
          contextSetters.setAiKeyTakeawaysJson(ktErrorJson);
          nextFlags.isKeyTakeawaysDataAvailable = false;
          nextVariables.lastError = { message: errorMsgKT, source: 'KeyTakeaways', details: errorPayloadKT.error };
          nextCurrentState = GlobalFsmState.KEY_TAKEAWAYS_FAILED;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `GENERATING_KEY_TAKEAWAYS -> KEY_TAKEAWAYS_FAILURE. Error: ${errorMsgKT}. To KEY_TAKEAWAYS_FAILED.`);
        }
        break;

      case GlobalFsmState.ANALYZING_OPTIONS:
        if (event.type === 'OPTIONS_ANALYSIS_SUCCESS') {
          contextSetters.setAiOptionsAnalysisRequestJson(event.payload.aiOptionsAnalysisRequestJson);
          contextSetters.setAiOptionsAnalysisJson(event.payload.aiOptionsAnalysisJson);
          nextFlags.isOptionsAnalysisDataAvailable = true;
          nextCurrentState = GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `ANALYZING_OPTIONS -> OPTIONS_ANALYSIS_SUCCESS. To OPTIONS_ANALYSIS_SUCCEEDED.`);
        } else if (event.type === 'OPTIONS_ANALYSIS_FAILURE') {
          const errorPayloadOpt = event.payload; const errorMsgOpt = errorPayloadOpt.message || 'AI Options Analysis failed';
          const optErrorJson = errorJsonWithDetails(errorMsgOpt, errorPayloadOpt.error);
          contextSetters.setAiOptionsAnalysisRequestJson(errorPayloadOpt.aiOptionsAnalysisRequestJson || optErrorJson);
          contextSetters.setAiOptionsAnalysisJson(optErrorJson);
          nextFlags.isOptionsAnalysisDataAvailable = false;
          nextVariables.lastError = { message: errorMsgOpt, source: 'OptionsAnalysis', details: errorPayloadOpt.error };
          nextCurrentState = GlobalFsmState.OPTIONS_ANALYSIS_FAILED;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `ANALYZING_OPTIONS -> OPTIONS_ANALYSIS_FAILURE. Error: ${errorMsgOpt}. To OPTIONS_ANALYSIS_FAILED.`);
        }
        break;

      case GlobalFsmState.CHAT_MESSAGE_PENDING:
        if (event.type === 'PENDING_CHAT_SUBMISSION_TRIGGERED') {
            nextVariables.pendingChatSubmissionPayload = null;
            logDebug(logPrefixFsmReducer as LogSourceId, 'InternalUpdate', `CHAT_MESSAGE_PENDING -> PENDING_CHAT_SUBMISSION_TRIGGERED. Pending payload cleared. State remains CHAT_MESSAGE_PENDING.`);
        } else if (event.type === 'CHAT_MESSAGE_ACTION_SUCCESS') {
            if (_chatbotResponseJson !== chatPendingJson && _chatbotResponseJson === event.payload.chatbotResponseJson &&
                _chatbotRequestJson !== chatPendingJson && _chatbotRequestJson === event.payload.chatbotRequestJson) {
                 logDebug(logPrefixFsmReducer as LogSourceId, 'GuardDuplicateChatSuccess', `Skipping CHAT_MESSAGE_ACTION_SUCCESS. Already processed this response: ${_chatbotResponseJson.substring(0,50)}...`);
            } else {
                contextSetters.setChatbotRequestJson(event.payload.chatbotRequestJson);
                contextSetters.setChatbotResponseJson(event.payload.chatbotResponseJson);
                try {
                    const modelResponse = JSON.parse(event.payload.chatbotResponseJson);
                    if (modelResponse.response) {
                        addChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_model_gbl_fsm`, role: 'model', content: modelResponse.response });
                    } else if (modelResponse.error) {
                        addChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_model_gbl_fsm_err`, role: 'model', content: `Chatbot Error: ${modelResponse.error}` });
                    }
                } catch (e) {
                     addChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_model_gbl_fsm_parse_err`, role: 'model', content: "Error parsing chatbot response." });
                }
                nextVariables.lastError = null;
                nextCurrentState = GlobalFsmState.CHAT_MESSAGE_SUCCESS;
                logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `CHAT_MESSAGE_PENDING -> CHAT_MESSAGE_ACTION_SUCCESS. To ${nextCurrentState}.`);
            }
        } else if (event.type === 'CHAT_MESSAGE_ACTION_ERROR') {
            const errPayload = event.payload;
            const errMsg = errPayload.message || 'Chat failed';
            contextSetters.setChatbotRequestJson(errPayload.chatbotRequestJson || errorJsonWithDetails("Chat request data unavailable on error", null));
            contextSetters.setChatbotResponseJson(errPayload.chatbotResponseJson || errorJsonWithDetails(errMsg, errPayload.error));
            addChatMessage({ id: `${Date.now()}_${chatMessageIdCounter++}_model_gbl_fsm_act_err`, role: 'model', content: `Error: ${errMsg}` });
            nextVariables.lastError = { message: errMsg, source: 'ChatAction', details: errPayload.error };
            nextCurrentState = GlobalFsmState.CHAT_MESSAGE_ERROR;
            logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `CHAT_MESSAGE_PENDING -> CHAT_MESSAGE_ACTION_ERROR. Error: ${errMsg}. To ${nextCurrentState}.`);
        }
        break;

      case GlobalFsmState.APP_INITIALIZING:
        if (event.type === 'INITIALIZATION_COMPLETE') {
          if (previousState !== GlobalFsmState.APP_INITIALIZING && state.current !== GlobalFsmState.APP_INITIALIZING) {
            logDebug(logPrefixFsmReducer as LogSourceId, 'Reducer_Warning', `Received INITIALIZATION_COMPLETE but current state is already ${state.current}. Ignoring.`);
            return { ...state, previous: previousState };
          }
          if (nextVariables.userInputTicker && nextVariables.userInputTicker.trim() !== "") {
              nextCurrentState = GlobalFsmState.VALID_TICKER_ENTERED;
              nextFlags.canAnalyzeStock = true;
          } else {
              nextCurrentState = GlobalFsmState.AWAITING_TICKER_INPUT;
              nextFlags.canAnalyzeStock = false;
          }
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `APP_INITIALIZING -> INITIALIZATION_COMPLETE. To ${nextCurrentState}. canAnalyze: ${nextFlags.canAnalyzeStock}`);
        }
        break;

      case GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH:
        if (event.type === 'TRIGGER_DATA_FETCH') {
            nextCurrentState = GlobalFsmState.DATA_FETCH_IN_PROGRESS;
            logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `PIPELINE_REQUESTED_DATA_FETCH -> TRIGGER_DATA_FETCH. To DATA_FETCH_IN_PROGRESS.`);
        }
        break;

      case GlobalFsmState.DATA_FETCH_IN_PROGRESS:
        if (event.type === 'FETCH_DATA_SUCCESS') {
          contextSetters.setMarketStatusJson(event.payload.marketStatusJson);
          contextSetters.setStockSnapshotJson(event.payload.stockSnapshotJson);
          contextSetters.setStandardTasJson(event.payload.standardTasJson);
          contextSetters.setOptionsChainJson(event.payload.optionsChainJson);
          contextSetters.setPolygonApiRequestLogJson(event.payload.polygonApiRequestLogJson);
          contextSetters.setPolygonApiResponseLogJson(event.payload.polygonApiResponseLogJson);
          nextFlags.isMarketDataReady = true; nextFlags.isSnapshotDataReady = true;
          nextFlags.isStandardTADataReady = true; nextFlags.isOptionsChainDataReady = true;
          nextCurrentState = GlobalFsmState.DATA_FETCH_SUCCEEDED;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `DATA_FETCH_IN_PROGRESS -> FETCH_DATA_SUCCESS. To DATA_FETCH_SUCCEEDED.`);
        } else if (event.type === 'FETCH_DATA_FAILURE') {
          const errorMsg = event.payload.message || 'Data fetch failed';
          const errorDetails = event.payload.error || 'Unknown data fetch error';
          const dataFetchErrorJson = errorJsonWithDetails(errorMsg, errorDetails);
          contextSetters.setMarketStatusJson(dataFetchErrorJson); contextSetters.setStockSnapshotJson(dataFetchErrorJson);
          contextSetters.setStandardTasJson(dataFetchErrorJson); contextSetters.setOptionsChainJson(dataFetchErrorJson);
          contextSetters.setPolygonApiRequestLogJson(event.payload.polygonApiRequestLogJson || dataFetchErrorJson);
          contextSetters.setPolygonApiResponseLogJson(event.payload.polygonApiResponseLogJson || dataFetchErrorJson);
          nextFlags.isMarketDataReady = false; nextFlags.isSnapshotDataReady = false;
          nextFlags.isStandardTADataReady = false; nextFlags.isOptionsChainDataReady = false;
          nextVariables.lastError = { message: errorMsg, source: 'DataFetch', details: errorDetails };
          nextCurrentState = GlobalFsmState.DATA_FETCH_FAILED;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `DATA_FETCH_IN_PROGRESS -> FETCH_DATA_FAILURE. Error: ${errorMsg}. To DATA_FETCH_FAILED.`);
        } else if (event.type === 'STALE_DATA_FROM_ACTION') {
          const { error, message, expectedTicker, foundTickerInSnapshot, actionStateData } = event.payload;
          const staleErrorJson = errorJsonWithDetails(message, `Expected ${expectedTicker}, got ${foundTickerInSnapshot || 'unknown'}.`);
          contextSetters.setMarketStatusJson(actionStateData?.marketStatusJson || staleErrorJson);
          contextSetters.setStockSnapshotJson(actionStateData?.stockSnapshotJson || staleErrorJson);
          contextSetters.setStandardTasJson(actionStateData?.standardTasJson || staleErrorJson);
          contextSetters.setOptionsChainJson(actionStateData?.optionsChainJson || staleErrorJson);
          contextSetters.setPolygonApiRequestLogJson(actionStateData?.polygonApiRequestLogJson || errorJsonWithDetails("Request log unavailable for stale data.", null));
          contextSetters.setPolygonApiResponseLogJson(actionStateData?.polygonApiResponseLogJson || errorJsonWithDetails("Response log unavailable for stale data.", null));
          nextFlags.isMarketDataReady = false; nextFlags.isSnapshotDataReady = false;
          nextFlags.isStandardTADataReady = false; nextFlags.isOptionsChainDataReady = false;
          nextVariables.lastError = { message, source: 'StaleData', details: error };
          nextCurrentState = GlobalFsmState.ERROR_STALE_DATA;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `DATA_FETCH_IN_PROGRESS -> STALE_DATA_FROM_ACTION. To ERROR_STALE_DATA.`);
        }
        break;

      case GlobalFsmState.DATA_FETCH_SUCCEEDED:
        if (event.type === 'INITIATE_AI_TA_SEQUENCE') {
          contextSetters.setAiAnalyzedTaRequestJson(pendingJson);
          contextSetters.setAiAnalyzedTaJson(pendingJson);
          nextCurrentState = GlobalFsmState.CALCULATING_AI_TA;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `DATA_FETCH_SUCCEEDED -> INITIATE_AI_TA_SEQUENCE. To CALCULATING_AI_TA.`);
        }
        break;

      case GlobalFsmState.CALCULATING_AI_TA:
        if (event.type === 'AI_TA_SUCCESS') {
          contextSetters.setAiAnalyzedTaRequestJson(event.payload.aiAnalyzedTaRequestJson);
          contextSetters.setAiAnalyzedTaJson(event.payload.aiAnalyzedTaJson);
          nextFlags.isCalculatedTADataReady = true;
          nextCurrentState = GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `CALCULATING_AI_TA -> AI_TA_SUCCESS. To AI_TA_CALCULATION_SUCCEEDED.`);
        } else if (event.type === 'AI_TA_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'AI TA analysis failed';
          const taErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiAnalyzedTaRequestJson(errorPayload.aiAnalyzedTaRequestJson || taErrorJson);
          contextSetters.setAiAnalyzedTaJson(taErrorJson);
          nextFlags.isCalculatedTADataReady = false;
          nextVariables.lastError = { message: errorMsg, source: 'AITaCalculation', details: errorPayload.error };
          nextCurrentState = GlobalFsmState.AI_TA_CALCULATION_FAILED;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `CALCULATING_AI_TA -> AI_TA_FAILURE. Error: ${errorMsg}. To AI_TA_CALCULATION_FAILED.`);
        }
        break;

      case GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED:
      case GlobalFsmState.AI_TA_CALCULATION_FAILED: // If AI TA fails, we still finalize the automated part of the pipeline
        if (event.type === 'FINALIZE_AUTOMATED_PIPELINE') {
          nextCurrentState = GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE;
          nextVariables.isInitialLoad = false;
          logDebug(logPrefixFsmReducer as LogSourceId, 'Transition', `${previousState} -> FINALIZE_AUTOMATED_PIPELINE. To PIPELINE_AUTOMATED_COMPLETE. Initial load set to false.`);
        }
        break;

      default:
        logDebug(logPrefixFsmReducer as LogSourceId, 'UnhandledEventInState', `Unhandled event ${event.type} in state ${previousState}`);
        break;
    }

    if (nextCurrentState === GlobalFsmState.IDLE ||
        nextCurrentState === GlobalFsmState.VALID_TICKER_ENTERED ||
        nextCurrentState === GlobalFsmState.AWAITING_TICKER_INPUT ||
        nextCurrentState === GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE ||
        nextCurrentState === GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED ||
        nextCurrentState === GlobalFsmState.KEY_TAKEAWAYS_FAILED ||
        nextCurrentState === GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED ||
        nextCurrentState === GlobalFsmState.OPTIONS_ANALYSIS_FAILED ||
        nextCurrentState === GlobalFsmState.CHAT_MESSAGE_SUCCESS ||
        nextCurrentState === GlobalFsmState.CHAT_MESSAGE_ERROR ||
        nextCurrentState === GlobalFsmState.DATA_FETCH_FAILED ||
        nextCurrentState === GlobalFsmState.ERROR_STALE_DATA
    ) {
        nextFlags.canAnalyzeStock = true;
    } else {
        nextFlags.canAnalyzeStock = false;
    }

    let newDebugConsoleMenuDisplayStateValue = 'IDLE';
    if (nextFlags.isDebugConsoleFilterMenuOpen) newDebugConsoleMenuDisplayStateValue = 'FILTER_MENU_OPEN';
    else if (nextFlags.isDebugConsoleCopyMenuOpen) newDebugConsoleMenuDisplayStateValue = 'COPY_MENU_OPEN';
    else if (nextFlags.isDebugConsoleExportMenuOpen) newDebugConsoleMenuDisplayStateValue = 'EXPORT_MENU_OPEN';

    if (newDebugConsoleMenuDisplayStateValue !== currentDebugConsoleMenuFsmStateForDisplay) {
        _setDebugConsoleMenuFsmDisplayInternal(prev => ({
            previous: prev?.current || 'IDLE',
            current: newDebugConsoleMenuDisplayStateValue,
            target: null,
        }));
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
    const currentActualState = fsmStateRef.current.current;
    let determinedTarget: GlobalFsmState | null = null;

    switch (currentActualState) {
        case GlobalFsmState.IDLE:
        case GlobalFsmState.AWAITING_TICKER_INPUT:
        case GlobalFsmState.VALID_TICKER_ENTERED:
        case GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE:
        case GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED:
        case GlobalFsmState.KEY_TAKEAWAYS_FAILED:
        case GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED:
        case GlobalFsmState.OPTIONS_ANALYSIS_FAILED:
        case GlobalFsmState.CHAT_MESSAGE_SUCCESS:
        case GlobalFsmState.CHAT_MESSAGE_ERROR:
        case GlobalFsmState.DATA_FETCH_FAILED:
        case GlobalFsmState.ERROR_STALE_DATA:
        case GlobalFsmState.AI_TA_CALCULATION_FAILED:
            if (event.type === 'START_FULL_ANALYSIS') determinedTarget = GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH;
            else if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') determinedTarget = GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
            else if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') determinedTarget = GlobalFsmState.ANALYZING_OPTIONS;
            else if (event.type === 'SUBMIT_CHAT_MESSAGE') determinedTarget = GlobalFsmState.CHAT_MESSAGE_PENDING;
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
            if (event.type === 'INITIALIZATION_COMPLETE') determinedTarget = GlobalFsmState.AWAITING_TICKER_INPUT;
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
        case GlobalFsmState.AI_TA_CALCULATION_FAILED:
             if (event.type === 'FINALIZE_AUTOMATED_PIPELINE') determinedTarget = GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE;
            break;
    }

    if (event.type === 'TOGGLE_DEBUG_CONSOLE_MENU') {
        determinedTarget = currentActualState;
    }

    logDebug('StockAnalysisContext:GlobalFSM' as LogSourceId, 'DispatchAttempt', `Event: ${event.type}, CurrentActual: ${currentActualState}, DeterminedTarget: ${determinedTarget || 'N/A'}`);
    if (determinedTarget && event.type !== 'TOGGLE_DEBUG_CONSOLE_MENU') {
        _setTargetFsmDisplayState(determinedTarget);
    }
    _dispatchFsmEventActual(event);
  }, [_dispatchFsmEventActual, _setTargetFsmDisplayState, logDebug]);

  useEffect(() => {
    if (_targetFsmDisplayState !== null && globalFsmReducerState.current === _targetFsmDisplayState) {
      logDebug('StockAnalysisContext:GlobalFSM' as LogSourceId, 'TargetReached', `Current state ${_targetFsmDisplayState} matches target. Clearing target display.`);
      _setTargetFsmDisplayState(null);
    }
  }, [globalFsmReducerState.current, _targetFsmDisplayState, logDebug]);


  useEffect(() => {
    const logPrefix = 'StockAnalysisContext:ConsoleInterceptor';
    logDebug(logPrefix as LogSourceId, 'EffectRun', `Running. Enabled: ${_isClientDebugConsoleEnabled}, StartupComplete: ${_isInitialAppStartupComplete}, ReducedLogging: ${_isReducedStartupLoggingEnabled}`);

    if (typeof window === 'undefined') {
      logDebug(logPrefix as LogSourceId, 'SSR_Skip', 'Skipping console interception on server.');
      return;
    }

    const currentOriginalsForInterceptor = (console as any).__stockSageContextOriginals || browserConsole;

    const interceptAndProcessLog = (
      type: LogType,
      ...args: any[]
    ) => {
      currentOriginalsForInterceptor[type as Exclude<LogType, 'system'>](...args);

      queueMicrotask(() => {
        if (!_isClientDebugConsoleEnabled) return;

        let sourceForBuffer: LogSourceId = 'NATIVE_CONSOLE';
        let messagesForBuffer = args;
        let typeForBuffer = type;

        if (args.length > 0 && args[0] === LOGDEBUG_MARKER) {
          sourceForBuffer = args[1] as LogSourceId;
          messagesForBuffer = args.slice(3);
          typeForBuffer = 'debug';
          if (!_logSourceConfig[sourceForBuffer]) return;
        } else {
          if (!_logSourceConfig['NATIVE_CONSOLE']) return;
        }

        if (!_isInitialAppStartupComplete && _isReducedStartupLoggingEnabled) {
          const criticalSources: LogSourceId[] = ['StockAnalysisContext', 'DefinitionLoader', 'PolygonAdapter'];
          let allowLog = false;

          if (sourceForBuffer && criticalSources.includes(sourceForBuffer)) {
            allowLog = true;
          } else if (typeForBuffer === 'error' || typeForBuffer === 'warn') {
            allowLog = true;
          }

          if (sourceForBuffer === 'NATIVE_CONSOLE' && typeForBuffer !== 'error' && typeForBuffer !== 'warn' && !criticalSources.includes('NATIVE_CONSOLE')) {
             allowLog = false;
          }

          if (!allowLog) {
            currentOriginalsForInterceptor.debug(
              `[${logPrefix}_SUPPRESSED_STARTUP_LOG] Type: ${typeForBuffer}, Source: ${sourceForBuffer}, Msg: ${String(messagesForBuffer[0]).substring(0,50)}...`
            );
            return;
          }
        }
        addEntryToGlobalLogBuffer({ type: typeForBuffer, messages: messagesForBuffer, source: sourceForBuffer });
      });
    };

    if (_isClientDebugConsoleEnabled) {
      logDebug(logPrefix as LogSourceId, 'Status', 'APPLYING interceptors.');
      console.log = (...args) => interceptAndProcessLog('log', ...args);
      console.warn = (...args) => interceptAndProcessLog('warn', ...args);
      console.error = (...args) => interceptAndProcessLog('error', ...args);
      console.info = (...args) => interceptAndProcessLog('info', ...args);
      console.debug = (...args) => interceptAndProcessLog('debug', ...args);
    } else {
      logDebug(logPrefix as LogSourceId, 'Status', 'ClientDebugConsole is DISABLED. Attempting to RESTORE original console methods.');
      if ((console as any).__stockSageContextOriginals) {
        Object.assign(console, (console as any).__stockSageContextOriginals);
        logDebug(logPrefix as LogSourceId, 'Status', 'Console interception INACTIVE, originals restored.');
      } else {
         contextOriginals.warn(`[${logPrefix}] No context originals found to restore!`);
      }
    }

    return () => {
      logDebug(logPrefix as LogSourceId, 'Cleanup', 'Restoring original console methods.');
      if ((console as any).__stockSageContextOriginals) {
        Object.assign(console, (console as any).__stockSageContextOriginals);
      } else {
        contextOriginals.warn(`[${logPrefix}] Cleanup: No context originals found to restore!`);
      }
    };
  }, [_isClientDebugConsoleEnabled, _logSourceConfig, contextOriginals, logDebug, _isInitialAppStartupComplete, _isReducedStartupLoggingEnabled]);


  const setClientDebugConsoleOpen = useCallback((open: boolean) => {
    logDebug('StockAnalysisContext', 'DebugConsoleUIToggle', `ClientDebugConsoleOpen will be set to: ${open}. Current isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}`);
    if (_isClientDebugConsoleEnabled || !open) {
        _setClientDebugConsoleOpen(open);
    } else if (!_isClientDebugConsoleEnabled && open) {
        logDebug('StockAnalysisContext', 'DebugConsoleUIToggle', 'Attempted to open console while it is disabled. Opening action will be ignored.');
    }
  }, [_isClientDebugConsoleEnabled, _setClientDebugConsoleOpen, logDebug]);

  const [fetchDataActionState, fetchStockDataFormAction, isFetchDataPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(
    fetchStockDataAction,
    localInitialStockDataFetchResult
  );
  const [analyzeTaActionState, analyzeTaFormAction, isAnalyzeTaPending] = useActionState<AnalyzeTaActionState, { stockSnapshotJson: string, ticker?: string }>(
    analyzeTaAction,
    localInitialAnalyzeTaState
  );
  const [performAiAnalysisActionState, performAiAnalysisFormAction, isPerformAiAnalysisPending] = useActionState<PerformAiAnalysisActionState, { ticker: string, stockSnapshotJson: string, standardTasJson: string, aiAnalyzedTaJson: string, marketStatusJson: string }>(
    performAiAnalysisAction,
    localInitialPerformAiAnalysisState
  );
  const [performAiOptionsAnalysisActionState, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending] = useActionState<PerformAiOptionsAnalysisActionState, { ticker: string, optionsChainJson: string, stockSnapshotJson: string }>(
    performAiOptionsAnalysisAction,
    localInitialPerformAiOptionsAnalysisState
  );

  useEffect(() => {
    const currentGlobalFsmState = fsmStateRef.current.current;
    const currentVars = fsmStateRef.current.variables;
    const logPrefixOrchestrator = 'StockAnalysisContext:GlobalFSM_Orchestrator';
    logDebug(logPrefixOrchestrator as LogSourceId, 'Entry', `State: ${currentGlobalFsmState}, ActiveTicker: ${currentVars.activeTicker}, InitialLoad: ${currentVars.isInitialLoad}`);

    if (currentGlobalFsmState === GlobalFsmState.APP_INITIALIZING && !initialInitializationDispatchedRef.current) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'Action', 'State is APP_INITIALIZING and initial init not dispatched. Dispatching INITIALIZATION_COMPLETE.');
        _dispatchFsmEventActual({ type: 'INITIALIZATION_COMPLETE' });
        initialInitializationDispatchedRef.current = true;
    } else if (currentGlobalFsmState === GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH && currentVars.activeTicker) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'Action', `State is PIPELINE_REQUESTED_DATA_FETCH for ${currentVars.activeTicker}. Dispatching TRIGGER_DATA_FETCH.`);
        _dispatchFsmEventActual({ type: 'TRIGGER_DATA_FETCH' });
    } else if (currentGlobalFsmState === GlobalFsmState.DATA_FETCH_IN_PROGRESS && currentVars.activeTicker && !isFetchDataPending ) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'Action', `State is DATA_FETCH_IN_PROGRESS for ${currentVars.activeTicker}. Calling fetchStockDataFormAction.`);
        startTransition(() => {
            fetchStockDataFormAction({ ticker: currentVars.activeTicker! });
        });
    } else if (currentGlobalFsmState === GlobalFsmState.DATA_FETCH_SUCCEEDED) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'Action', `State is DATA_FETCH_SUCCEEDED. Dispatching INITIATE_AI_TA_SEQUENCE.`);
        _dispatchFsmEventActual({ type: 'INITIATE_AI_TA_SEQUENCE' });
    } else if (currentGlobalFsmState === GlobalFsmState.CALCULATING_AI_TA && currentVars.activeTicker && !isAnalyzeTaPending) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'Action', `State is CALCULATING_AI_TA for ${currentVars.activeTicker}. Calling analyzeTaFormAction.`);
        if (isDataReadyForProcessing(_stockSnapshotJson, logDebug, logPrefixOrchestrator as LogSourceId, 'SnapshotForAITACalc')) {
            startTransition(() => {
                analyzeTaFormAction({ stockSnapshotJson: _stockSnapshotJson, ticker: currentVars.activeTicker! });
            });
        } else {
            const errorMsg = `Snapshot data missing/error for AI TA of ${currentVars.activeTicker}. Snapshot (start): ${_stockSnapshotJson.substring(0,100)}`;
            logDebug(logPrefixOrchestrator as LogSourceId, 'Error', errorMsg);
            _dispatchFsmEventActual({ type: 'AI_TA_FAILURE', payload: { message: 'Snapshot data missing/error for AI TA', error: 'Snapshot data unavailable', aiAnalyzedTaRequestJson: JSON.stringify({error: errorMsg, ticker: currentVars.activeTicker}) } });
        }
    } else if (currentGlobalFsmState === GlobalFsmState.GENERATING_KEY_TAKEAWAYS && currentVars.activeTicker && !isPerformAiAnalysisPending) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'Action', `State is GENERATING_KEY_TAKEAWAYS for ${currentVars.activeTicker}. Calling performAiAnalysisFormAction.`);
        const prerequisitesMet =
            isDataReadyForProcessing(_stockSnapshotJson, logDebug, logPrefixOrchestrator as LogSourceId, 'SnapshotForKT') &&
            isDataReadyForProcessing(_standardTasJson, logDebug, logPrefixOrchestrator as LogSourceId, 'StdTAForKT') &&
            isDataReadyForProcessing(_aiAnalyzedTaJson, logDebug, logPrefixOrchestrator as LogSourceId, 'AITaForKT') &&
            isDataReadyForProcessing(_marketStatusJson, logDebug, logPrefixOrchestrator as LogSourceId, 'MarketStatusForKT');

        if (prerequisitesMet) {
            startTransition(() => {
                performAiAnalysisFormAction({
                    ticker: currentVars.activeTicker!,
                    stockSnapshotJson: _stockSnapshotJson,
                    standardTasJson: _standardTasJson,
                    aiAnalyzedTaJson: _aiAnalyzedTaJson,
                    marketStatusJson: _marketStatusJson
                });
            });
        } else {
            const errorMsg = `Prerequisite data for Key Takeaways analysis of ${currentVars.activeTicker} is not ready.`;
            logDebug(logPrefixOrchestrator as LogSourceId, 'Error', errorMsg);
            _dispatchFsmEventActual({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { message: errorMsg, error: 'Prerequisite data unavailable for Key Takeaways' } });
        }
    } else if (currentGlobalFsmState === GlobalFsmState.ANALYZING_OPTIONS && currentVars.activeTicker && !isPerformAiOptionsAnalysisPending) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'Action', `State is ANALYZING_OPTIONS for ${currentVars.activeTicker}. Calling performAiOptionsAnalysisFormAction.`);
        const prereqsMet =
            isDataReadyForProcessing(_stockSnapshotJson, logDebug, logPrefixOrchestrator as LogSourceId, 'SnapshotForOptAI') &&
            isDataReadyForProcessing(_optionsChainJson, logDebug, logPrefixOrchestrator as LogSourceId, 'OptionsChainForOptAI');
        if (prereqsMet) {
            startTransition(() => {
                performAiOptionsAnalysisFormAction({
                    ticker: currentVars.activeTicker!,
                    optionsChainJson: _optionsChainJson,
                    stockSnapshotJson: _stockSnapshotJson,
                });
            });
        } else {
            const errorMsg = `Prerequisite data for Options Analysis of ${currentVars.activeTicker} is not ready.`;
            logDebug(logPrefixOrchestrator as LogSourceId, 'Error', errorMsg);
            _dispatchFsmEventActual({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { message: errorMsg, error: 'Prerequisite data unavailable for Options Analysis' } });
        }
    } else if (currentGlobalFsmState === GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED || currentGlobalFsmState === GlobalFsmState.AI_TA_CALCULATION_FAILED) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'Action', `State is ${currentGlobalFsmState}. Dispatching FINALIZE_AUTOMATED_PIPELINE.`);
        _dispatchFsmEventActual({ type: 'FINALIZE_AUTOMATED_PIPELINE' });
    } else if (
        currentGlobalFsmState === GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE ||
        currentGlobalFsmState === GlobalFsmState.DATA_FETCH_FAILED ||
        currentGlobalFsmState === GlobalFsmState.ERROR_STALE_DATA ||
        currentGlobalFsmState === GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED ||
        currentGlobalFsmState === GlobalFsmState.KEY_TAKEAWAYS_FAILED ||
        currentGlobalFsmState === GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED ||
        currentGlobalFsmState === GlobalFsmState.OPTIONS_ANALYSIS_FAILED ||
        currentGlobalFsmState === GlobalFsmState.CHAT_MESSAGE_SUCCESS ||
        currentGlobalFsmState === GlobalFsmState.CHAT_MESSAGE_ERROR
    ) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'Action', `State is ${currentGlobalFsmState}. Dispatching PROCEED_TO_IDLE.`);
        _dispatchFsmEventActual({ type: 'PROCEED_TO_IDLE' });
    }

    if (
        currentGlobalFsmState === GlobalFsmState.IDLE &&
        currentVars.isInitialLoad === false &&
        !initialStartupFlaggedRef.current
    ) {
        logDebug(logPrefixOrchestrator as LogSourceId, 'StartupComplete', `Initial automated pipeline concluded (isInitialLoad false, curr: IDLE). Setting isInitialAppStartupComplete to true.`);
        _setIsInitialAppStartupComplete(true);
        initialStartupFlaggedRef.current = true;
        logDebug('StockAnalysisContext:StartupComplete' as LogSourceId, 'Info', 'Initial application startup sequence complete. Full debug logging is now active.');
    }

  }, [
    globalFsmReducerState.current, globalFsmReducerState.variables.activeTicker, globalFsmReducerState.variables.isInitialLoad,
    _dispatchFsmEventActual, logDebug,
    _stockSnapshotJson, _standardTasJson, _aiAnalyzedTaJson, _marketStatusJson, _optionsChainJson,
    fetchStockDataFormAction, analyzeTaFormAction, performAiAnalysisFormAction, performAiOptionsAnalysisFormAction,
    isFetchDataPending, isAnalyzeTaPending, isPerformAiAnalysisPending, isPerformAiOptionsAnalysisPending
  ]);


  useEffect(() => {
    const currentFsmState = fsmStateRef.current.current;
    const logPrefixActionEffect = 'StockAnalysisContext:ActionStateEffect_FetchData';
    logDebug(logPrefixActionEffect as LogSourceId, 'Trigger', `fetchDataActionState changed. Status: ${fetchDataActionState.status}. Current FSM: ${currentFsmState}`);
    if (currentFsmState !== GlobalFsmState.DATA_FETCH_IN_PROGRESS) {
        if (fetchDataActionState.status !== 'idle') {
            logDebug(logPrefixActionEffect as LogSourceId, 'GuardBypass', `FSM state ${currentFsmState} not DATA_FETCH_IN_PROGRESS. Ignoring fetchDataActionState update.`);
        }
        return;
    }

    if (fetchDataActionState.status === 'success' && fetchDataActionState.data) {
        dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: fetchDataActionState.data });
    } else if (fetchDataActionState.status === 'error') {
        if (fetchDataActionState.message && fetchDataActionState.message.includes("Stale data detected") && fetchDataActionState.data) {
             dispatchFsmEvent({
                type: 'STALE_DATA_FROM_ACTION',
                payload: {
                    error: fetchDataActionState.error || "Stale data error",
                    message: fetchDataActionState.message,
                    expectedTicker: fsmStateRef.current.variables.activeTicker || "UNKNOWN",
                    actionStateData: fetchDataActionState.data
                }
            });
        } else {
            dispatchFsmEvent({
                type: 'FETCH_DATA_FAILURE',
                payload: {
                    error: fetchDataActionState.error,
                    message: fetchDataActionState.message,
                    polygonApiRequestLogJson: fetchDataActionState.data?.polygonApiRequestLogJson,
                    polygonApiResponseLogJson: fetchDataActionState.data?.polygonApiResponseLogJson
                }
            });
        }
    }
  }, [fetchDataActionState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    const currentFsmState = fsmStateRef.current.current;
    const logPrefixActionEffect = 'StockAnalysisContext:ActionStateEffect_AnalyzeTa';
    logDebug(logPrefixActionEffect as LogSourceId, 'Trigger', `analyzeTaActionState changed. Status: ${analyzeTaActionState.status}. Current FSM: ${currentFsmState}`);
    if (currentFsmState !== GlobalFsmState.CALCULATING_AI_TA) {
        if (analyzeTaActionState.status !== 'idle') {
            logDebug(logPrefixActionEffect as LogSourceId, 'GuardBypass', `FSM state ${currentFsmState} not CALCULATING_AI_TA. Ignoring analyzeTaActionState update.`);
        }
        return;
    }

    if (analyzeTaActionState.status === 'success' && analyzeTaActionState.data) {
        dispatchFsmEvent({ type: 'AI_TA_SUCCESS', payload: analyzeTaActionState.data });
    } else if (analyzeTaActionState.status === 'error') {
        dispatchFsmEvent({
            type: 'AI_TA_FAILURE',
            payload: {
                error: analyzeTaActionState.error,
                message: analyzeTaActionState.message,
                aiAnalyzedTaRequestJson: analyzeTaActionState.data?.aiAnalyzedTaRequestJson
            }
        });
    }
  }, [analyzeTaActionState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    const currentFsmState = fsmStateRef.current.current;
    const logPrefixActionEffect = 'StockAnalysisContext:ActionStateEffect_PerformAiAnalysis';
    logDebug(logPrefixActionEffect as LogSourceId, 'Trigger', `performAiAnalysisActionState changed. Status: ${performAiAnalysisActionState.status}. Current FSM: ${currentFsmState}`);
    if (currentFsmState !== GlobalFsmState.GENERATING_KEY_TAKEAWAYS) {
        if (performAiAnalysisActionState.status !== 'idle') {
            logDebug(logPrefixActionEffect as LogSourceId, 'GuardBypass', `FSM state ${currentFsmState} not GENERATING_KEY_TAKEAWAYS. Ignoring performAiAnalysisActionState update.`);
        }
        return;
    }

    if (performAiAnalysisActionState.status === 'success' && performAiAnalysisActionState.data) {
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: performAiAnalysisActionState.data });
    } else if (performAiAnalysisActionState.status === 'error') {
        dispatchFsmEvent({
            type: 'KEY_TAKEAWAYS_FAILURE',
            payload: {
                error: performAiAnalysisActionState.error,
                message: performAiAnalysisActionState.message,
                aiKeyTakeawaysRequestJson: performAiAnalysisActionState.data?.aiKeyTakeawaysRequestJson
            }
        });
    }
  }, [performAiAnalysisActionState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    const currentFsmState = fsmStateRef.current.current;
    const logPrefixActionEffect = 'StockAnalysisContext:ActionStateEffect_PerformAiOptions';
    logDebug(logPrefixActionEffect as LogSourceId, 'Trigger', `performAiOptionsAnalysisActionState changed. Status: ${performAiOptionsAnalysisActionState.status}. Current FSM: ${currentFsmState}`);
    if (currentFsmState !== GlobalFsmState.ANALYZING_OPTIONS) {
        if (performAiOptionsAnalysisActionState.status !== 'idle') {
             logDebug(logPrefixActionEffect as LogSourceId, 'GuardBypass', `FSM state ${currentFsmState} not ANALYZING_OPTIONS. Ignoring performAiOptionsAnalysisActionState update.`);
        }
        return;
    }

    if (performAiOptionsAnalysisActionState.status === 'success' && performAiOptionsAnalysisActionState.data) {
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: performAiOptionsAnalysisActionState.data });
    } else if (performAiOptionsAnalysisActionState.status === 'error') {
        dispatchFsmEvent({
            type: 'OPTIONS_ANALYSIS_FAILURE',
            payload: {
                error: performAiOptionsAnalysisActionState.error,
                message: performAiOptionsAnalysisActionState.message,
                aiOptionsAnalysisRequestJson: performAiOptionsAnalysisActionState.data?.aiOptionsAnalysisRequestJson
            }
        });
    }
  }, [performAiOptionsAnalysisActionState, dispatchFsmEvent, logDebug]);


  const contextValue: StockAnalysisContextType = useMemo(() => ({
    polygonApiRequestLogJson: _polygonApiRequestLogJson, setPolygonApiRequestLogJson,
    polygonApiResponseLogJson: _polygonApiResponseLogJson, setPolygonApiResponseLogJson,
    marketStatusJson: _marketStatusJson, setMarketStatusJson,
    stockSnapshotJson: _stockSnapshotJson, setStockSnapshotJson,
    standardTasJson: _standardTasJson, setStandardTasJson,
    optionsChainJson: _optionsChainJson, setOptionsChainJson,
    aiAnalyzedTaRequestJson: _aiAnalyzedTaRequestJson, setAiAnalyzedTaRequestJson,
    aiAnalyzedTaJson: _aiAnalyzedTaJson, setAiAnalyzedTaJson,
    aiOptionsAnalysisRequestJson: _aiOptionsAnalysisRequestJson, setAiOptionsAnalysisRequestJson,
    aiOptionsAnalysisJson: _aiOptionsAnalysisJson, setAiOptionsAnalysisJson,
    aiKeyTakeawaysRequestJson: _aiKeyTakeawaysRequestJson, setAiKeyTakeawaysRequestJson,
    aiKeyTakeawaysJson: _aiKeyTakeawaysJson, setAiKeyTakeawaysJson,
    chatbotRequestJson: _chatbotRequestJson, setChatbotRequestJson,
    chatbotResponseJson: _chatbotResponseJson, setChatbotResponseJson,
    chatHistory,
    addChatMessage,
    clearChatHistory,
    isClientDebugConsoleEnabled: _isClientDebugConsoleEnabled, isClientDebugConsoleOpen: _isClientDebugConsoleOpen,
    logSourceConfig: _logSourceConfig,
    setClientDebugConsoleEnabled, setClientDebugConsoleOpen,
    setLogSourceEnabled,
    enableAllLogSources,
    disableAllLogSources,
    logDebug,
    fsmState: globalFsmReducerState.current,
    previousFsmState: globalFsmReducerState.previous,
    fsmVariables: globalFsmReducerState.variables,
    fsmFlags: globalFsmReducerState.flags,
    targetFsmDisplayState: _targetFsmDisplayState,
    dispatchFsmEvent,
    isFsmDebugCardEnabled: _isFsmDebugCardEnabled, setFsmDebugCardEnabled,
    isFsmDebugCardOpen: _isFsmDebugCardOpen, setFsmDebugCardOpen: _setIsFsmDebugCardOpen,
    mainTabFsmDisplay: _mainTabFsmDisplay, setMainTabFsmDisplay,
    chatbotFsmDisplay: _chatbotFsmDisplay, setChatbotFsmDisplay,
    debugConsoleMenuFsmDisplay: _debugConsoleMenuFsmDisplayInternal,
    setReducedStartupLoggingEnabled,
    isInitialAppStartupComplete: _isInitialAppStartupComplete,
    isReducedStartupLoggingEnabled: _isReducedStartupLoggingEnabled,
  }), [
    _polygonApiRequestLogJson, setPolygonApiRequestLogJson,
    _polygonApiResponseLogJson, setPolygonApiResponseLogJson,
    _marketStatusJson, setMarketStatusJson,
    _stockSnapshotJson, setStockSnapshotJson,
    _standardTasJson, setStandardTasJson,
    _optionsChainJson, setOptionsChainJson,
    _aiAnalyzedTaRequestJson, setAiAnalyzedTaRequestJson,
    _aiAnalyzedTaJson, setAiAnalyzedTaJson,
    _aiOptionsAnalysisRequestJson, setAiOptionsAnalysisRequestJson,
    _aiOptionsAnalysisJson, setAiOptionsAnalysisJson,
    _aiKeyTakeawaysRequestJson, setAiKeyTakeawaysRequestJson,
    _aiKeyTakeawaysJson, setAiKeyTakeawaysJson,
    _chatbotRequestJson, setChatbotRequestJson,
    _chatbotResponseJson, setChatbotResponseJson,
    chatHistory, addChatMessage, clearChatHistory,
    _isClientDebugConsoleEnabled, _isClientDebugConsoleOpen,
    _logSourceConfig, setClientDebugConsoleEnabled, setClientDebugConsoleOpen,
    setLogSourceEnabled, enableAllLogSources, disableAllLogSources,
    logDebug,
    globalFsmReducerState,
    _targetFsmDisplayState, dispatchFsmEvent,
    _isFsmDebugCardEnabled, setFsmDebugCardEnabled,
    _isFsmDebugCardOpen, _setIsFsmDebugCardOpen,
    _mainTabFsmDisplay, setMainTabFsmDisplay,
    _chatbotFsmDisplay, setChatbotFsmDisplay,
    _debugConsoleMenuFsmDisplayInternal,
    _isInitialAppStartupComplete, _isReducedStartupLoggingEnabled, setReducedStartupLoggingEnabled
  ]);

  return (
    <StockAnalysisContext.Provider value={contextValue}>
      {children}
    </StockAnalysisContext.Provider>
  );
}

export function useStockAnalysis() {
  const context = useContext(StockAnalysisContext);
  if (context === undefined) {
    throw new Error('useStockAnalysis must be used within a StockAnalysisProvider');
  }
  return context;
}
