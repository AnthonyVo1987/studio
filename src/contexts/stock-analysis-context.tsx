
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useReducer } from 'react';
import { type LogSourceId, logSourceIds, type LogSourceConfig, defaultLogSourceConfig } from '@/lib/debug-log-types';
import { addEntryToGlobalLogBuffer, clearGlobalLogBuffer } from '@/lib/global-log-buffer';
import type { StockDataFetchResult } from '@/actions/analyze-stock-server-action';
import type { AnalyzeTaResult } from '@/actions/analyze-ta-action';
import type { PerformAiAnalysisResult } from '@/actions/perform-ai-analysis-action';
import type { PerformAiOptionsAnalysisResult } from '@/actions/perform-ai-options-analysis-action';

const LOGDEBUG_MARKER = '__LOGDEBUG_MARKER__';

// FSM States
export enum FsmState {
  IDLE = 'IDLE',
  INITIALIZING_ANALYSIS = 'INITIALIZING_ANALYSIS',

  AWAITING_DATA_FETCH_TRIGGER = 'AWAITING_DATA_FETCH_TRIGGER',
  FETCHING_DATA = 'FETCHING_DATA',
  DATA_FETCH_SUCCEEDED = 'DATA_FETCH_SUCCEEDED',
  DATA_FETCH_FAILED = 'DATA_FETCH_FAILED',
  STALE_DATA_FROM_ACTION_ERROR = 'STALE_DATA_FROM_ACTION_ERROR',

  AWAITING_AI_TA_TRIGGER = 'AWAITING_AI_TA_TRIGGER',
  ANALYZING_TA = 'ANALYZING_TA',
  AI_TA_SUCCEEDED = 'AI_TA_SUCCEEDED',
  AI_TA_FAILED = 'AI_TA_FAILED',

  GENERATING_KEY_TAKEAWAYS = 'GENERATING_KEY_TAKEAWAYS',
  KEY_TAKEAWAYS_SUCCEEDED = 'KEY_TAKEAWAYS_SUCCEEDED',
  KEY_TAKEAWAYS_FAILED = 'KEY_TAKEAWAYS_FAILED',

  ANALYZING_OPTIONS = 'ANALYZING_OPTIONS',
  OPTIONS_ANALYSIS_SUCCEEDED = 'OPTIONS_ANALYSIS_SUCCEEDED',
  OPTIONS_ANALYSIS_FAILED = 'OPTIONS_ANALYSIS_FAILED',

  FULL_ANALYSIS_COMPLETE = 'FULL_ANALYSIS_COMPLETE',
}


// FSM Event Types & Payloads
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
  actionStateData?: any;
}
interface AiTaSuccessPayload extends AnalyzeTaResult {}
interface AiTaFailurePayload {
  error?: string | null;
  message?: string | null;
  aiAnalyzedTaRequestJson?: string;
}
interface AiKeyTakeawaysSuccessPayload extends PerformAiAnalysisResult {}
interface AiKeyTakeawaysFailurePayload {
  error?: string | null;
  message?: string | null;
  aiKeyTakeawaysRequestJson?: string;
}
interface AiOptionsAnalysisSuccessPayload extends PerformAiOptionsAnalysisResult {}
interface AiOptionsAnalysisFailurePayload {
  error?: string | null;
  message?: string | null;
  aiOptionsAnalysisRequestJson?: string;
}


export type FsmEvent =
  | { type: 'START_FULL_ANALYSIS'; payload: { ticker: string } }
  | { type: 'INITIALIZATION_COMPLETE' }

  | { type: 'TRIGGER_DATA_FETCH' }
  | { type: 'FETCH_DATA_SUCCESS'; payload: FetchDataSuccessPayload }
  | { type: 'FETCH_DATA_FAILURE'; payload: FetchDataFailurePayload }
  | { type: 'STALE_DATA_FROM_ACTION'; payload: StaleDataFromActionPayload }

  | { type: 'INITIATE_AI_TA_SEQUENCE' }
  | { type: 'TRIGGER_AI_TA' }
  | { type: 'AI_TA_SUCCESS'; payload: AiTaSuccessPayload }
  | { type: 'AI_TA_FAILURE'; payload: AiTaFailurePayload }

  | { type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS'; payload: { ticker: string } }
  | { type: 'KEY_TAKEAWAYS_SUCCESS'; payload: AiKeyTakeawaysSuccessPayload }
  | { type: 'KEY_TAKEAWAYS_FAILURE'; payload: AiKeyTakeawaysFailurePayload }

  | { type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS'; payload: { ticker: string } }
  | { type: 'OPTIONS_ANALYSIS_SUCCESS'; payload: AiOptionsAnalysisSuccessPayload }
  | { type: 'OPTIONS_ANALYSIS_FAILURE'; payload: AiOptionsAnalysisFailurePayload }

  | { type: 'PROCEED_TO_IDLE' }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage };


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

  isFullAnalysisTriggered: boolean;
  chatHistory: ChatMessage[];

  isClientDebugConsoleEnabled: boolean;
  isClientDebugConsoleOpen: boolean;
  logSourceConfig: LogSourceConfig;

  fsmState: FsmState;
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

interface StockAnalysisContextType extends StockAnalysisState, StockAnalysisContextSetters {
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;

  setClientDebugConsoleEnabled: (enabled: boolean) => void;
  setClientDebugConsoleOpen: (open: boolean) => void;
  setLogSourceEnabled: (source: LogSourceId, enabled: boolean) => void;
  enableAllLogSources: () => void;
  disableAllLogSources: () => void;
  logDebug: (source: LogSourceId, category: string, ...messages: any[]) => void;

  dispatchFsmEvent: React.Dispatch<FsmEvent>;
}

const initialJsonPlaceholder = '{ "status": "no_analysis_run_yet" }';
const pendingJson = '{ "status": "pending..." }';
const createSkippedJson = (reasonKey: string, message?: string) =>
  `{ "status": "skipped_due_to_${reasonKey}_failure", "message": "${message || `Skipped due to ${reasonKey} failure.`}" }`;


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
  isFullAnalysisTriggered: false,
  chatHistory: [],
  isClientDebugConsoleEnabled: false,
  isClientDebugConsoleOpen: false,
  logSourceConfig: defaultLogSourceConfig,
  fsmState: FsmState.IDLE,
};

const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

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

  const [_isFullAnalysisTriggeredInternalState, _setIsFullAnalysisTriggeredInternalState] = useState<boolean>(defaultState.isFullAnalysisTriggered);
  const [chatHistory, _setChatHistory] = useState<ChatMessage[]>(defaultState.chatHistory);

  const [_isClientDebugConsoleEnabled, _setClientDebugConsoleEnabled] = useState<boolean>(defaultState.isClientDebugConsoleEnabled);
  const [_isClientDebugConsoleOpen, _setClientDebugConsoleOpen] = useState<boolean>(defaultState.isClientDebugConsoleOpen);
  const [_logSourceConfig, _setLogSourceConfig] = useState<LogSourceConfig>(defaultState.logSourceConfig);

  const logDebug = useCallback((source: LogSourceId, category: string, ...messages: any[]) => {
      console.debug(LOGDEBUG_MARKER, source, category, ...messages);
  }, []);

  const setAndLogJson = useCallback((setter: React.Dispatch<React.SetStateAction<string>>, name: string, value: string) => {
    logDebug('StockAnalysisContext', 'JSON_SET', `Setting ${name} to:`, value.substring(0, 100) + (value.length > 100 ? '...' : ''));
    setter(value);
  }, [logDebug]);

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

  const setLogSourceEnabled = useCallback((source: LogSourceId, enabled: boolean) => {
    _setLogSourceConfig(prevConfig => {
      const newConfig = { ...prevConfig, [source]: enabled };
      logDebug('StockAnalysisContext', 'LogConfig', `Log source '${source}' ${enabled ? 'ENABLED' : 'DISABLED'}.`);
      return newConfig;
    });
  }, [_setLogSourceConfig, logDebug]);

  const addChatMessage = useCallback((message: ChatMessage) => {
    _setChatHistory(prev => [...prev, message]);
    logDebug('StockAnalysisContext', 'Chat', `Added interactive chat message from ${message.role}:`, message.content.substring(0, 50));
  }, [_setChatHistory, logDebug]);

  const clearChatHistory = useCallback(() => {
    _setChatHistory([]);
    logDebug('StockAnalysisContext', 'Chat', 'Interactive chat history CLEARED by user action.');
  }, [_setChatHistory, logDebug]);

  const setAllPlaceholdersInternal = useCallback((currentTickerForLogOnly: string, isFullAnalysis: boolean) => {
    logDebug('StockAnalysisContext','FSM_UTIL', `Resetting analysis-related context JSONs to generic PENDING for new analysis of ${currentTickerForLogOnly}. Full analysis mode: ${isFullAnalysis}. CHAT HISTORY AND DEBUG LOGS ARE PRESERVED.`);
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
    _setChatbotRequestJson(pendingJson);
    _setChatbotResponseJson(pendingJson);
  }, [logDebug]);

  const contextSetters: StockAnalysisContextSetters = {
    setPolygonApiRequestLogJson, setPolygonApiResponseLogJson,
    setMarketStatusJson, setStockSnapshotJson, setStandardTasJson,
    setOptionsChainJson, setAiAnalyzedTaRequestJson, setAiAnalyzedTaJson,
    setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson,
    setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
    setChatbotRequestJson, setChatbotResponseJson,
  };

  const enableAllLogSources = () => {
    contextOriginals.debug('[CONTEXT_ENABLE_ALL_SOURCES] Called.');
    const newConfig: LogSourceConfig = {} as LogSourceConfig;
    logSourceIds.forEach(id => { newConfig[id] = true; });
    newConfig.DebugConsole = true;
    contextOriginals.debug('[CONTEXT_ENABLE_ALL_SOURCES] newConfig prepared:', JSON.stringify(newConfig));
    _setLogSourceConfig(newConfig);
  };

  const disableAllLogSources = () => {
    contextOriginals.debug('[CONTEXT_DISABLE_ALL_SOURCES] Called.');
    const newConfig: LogSourceConfig = {} as LogSourceConfig;
    logSourceIds.forEach(id => {
      newConfig[id] = id === 'DebugConsole';
    });
    contextOriginals.debug('[CONTEXT_DISABLE_ALL_SOURCES] newConfig prepared:', JSON.stringify(newConfig));
    _setLogSourceConfig(newConfig);
  };

  const setClientDebugConsoleEnabled = useCallback((enabled: boolean) => {
    contextOriginals.debug(`[CONTEXT_SET_CONSOLE_ENABLED] Called with: ${enabled}. Current _isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}`);
    _setClientDebugConsoleEnabled(enabled);
    if (enabled) {
        contextOriginals.debug(`[CONTEXT_SET_CONSOLE_ENABLED] Condition (enabled === true) met. Calling enableAllLogSources and _setClientDebugConsoleOpen(true).`);
        enableAllLogSources();
        _setClientDebugConsoleOpen(true);
    } else {
        contextOriginals.debug(`[CONTEXT_SET_CONSOLE_ENABLED] Condition (enabled === false) met. Calling _setClientDebugConsoleOpen(false).`);
        _setClientDebugConsoleOpen(false);
    }
  }, [_isClientDebugConsoleEnabled, _setClientDebugConsoleEnabled, _setClientDebugConsoleOpen, contextOriginals]);


  const fsmReducer = (state: FsmState, event: FsmEvent): FsmState => {
    contextOriginals.debug('[CONTEXT_FSM_REDUCER]', `Event: ${event.type}, Current State: ${state}, Payload (keys):`,
        event.type !== 'ADD_CHAT_MESSAGE' && 'payload' in event ? Object.keys(event.payload || {}).join(', ') : (event.type === 'ADD_CHAT_MESSAGE' ? 'ChatMessage' : 'NoPayload'));

    const errorJsonWithDetails = (message: string, details: string | null | undefined) =>
      `{ "status": "error", "message": "${message.replace(/"/g, '\\"')}", "details": "${(details || '').replace(/"/g, '\\"')}" }`;

    switch (state) {
      case FsmState.IDLE:
        if (event.type === 'START_FULL_ANALYSIS') {
          setAllPlaceholdersInternal(event.payload.ticker, true);
          _setIsFullAnalysisTriggeredInternalState(true);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `START_FULL_ANALYSIS for ${event.payload.ticker}. isFullAnalysisTriggered true. Transitioning to INITIALIZING_ANALYSIS.`);
          return FsmState.INITIALIZING_ANALYSIS;
        }
        if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') {
          logDebug('StockAnalysisContext','FSM_TRANSITION', `Manually triggering Key Takeaways for ${event.payload.ticker}. Setting placeholders.`);
          contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
          contextSetters.setAiKeyTakeawaysJson(pendingJson);
          return FsmState.GENERATING_KEY_TAKEAWAYS;
        }
        if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') {
          logDebug('StockAnalysisContext','FSM_TRANSITION', `Manually triggering Options Analysis for ${event.payload.ticker}. Setting placeholders.`);
          contextSetters.setAiOptionsAnalysisRequestJson(pendingJson);
          contextSetters.setAiOptionsAnalysisJson(pendingJson);
          return FsmState.ANALYZING_OPTIONS;
        }
        if (event.type === 'ADD_CHAT_MESSAGE' && 'payload' in event) {
          const uniqueMessageSuffix = Math.random().toString(36).substring(2, 9);
          addChatMessage({...event.payload, id: `${event.payload.id}_${uniqueMessageSuffix}` });
        }
        return state;

      case FsmState.INITIALIZING_ANALYSIS:
        if (event.type === 'INITIALIZATION_COMPLETE') {
            logDebug('StockAnalysisContext', 'FSM_TRANSITION', `INITIALIZATION_COMPLETE. Transitioning to AWAITING_DATA_FETCH_TRIGGER.`);
            return FsmState.AWAITING_DATA_FETCH_TRIGGER;
        }
        return state;

      case FsmState.AWAITING_DATA_FETCH_TRIGGER:
        if (event.type === 'TRIGGER_DATA_FETCH') {
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `TRIGGER_DATA_FETCH. Transitioning to FETCHING_DATA.`);
          return FsmState.FETCHING_DATA;
        }
        return state;

      case FsmState.FETCHING_DATA:
        if (event.type === 'FETCH_DATA_SUCCESS') {
          contextSetters.setMarketStatusJson(event.payload.marketStatusJson);
          contextSetters.setStockSnapshotJson(event.payload.stockSnapshotJson);
          contextSetters.setStandardTasJson(event.payload.standardTasJson);
          contextSetters.setOptionsChainJson(event.payload.optionsChainJson);
          contextSetters.setPolygonApiRequestLogJson(event.payload.polygonApiRequestLogJson);
          contextSetters.setPolygonApiResponseLogJson(event.payload.polygonApiResponseLogJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `FETCH_DATA_SUCCESS. Transitioning to DATA_FETCH_SUCCEEDED.`);
          return FsmState.DATA_FETCH_SUCCEEDED;
        }
        if (event.type === 'FETCH_DATA_FAILURE') {
          const errorMsg = event.payload.message || 'Data fetch failed';
          const errorDetails = event.payload.error || 'Unknown data fetch error';
          const dataFetchErrorJson = errorJsonWithDetails(errorMsg, errorDetails);
          contextSetters.setMarketStatusJson(dataFetchErrorJson);
          contextSetters.setStockSnapshotJson(dataFetchErrorJson);
          contextSetters.setStandardTasJson(dataFetchErrorJson);
          contextSetters.setOptionsChainJson(dataFetchErrorJson);
          contextSetters.setPolygonApiRequestLogJson(event.payload.polygonApiRequestLogJson || dataFetchErrorJson);
          contextSetters.setPolygonApiResponseLogJson(event.payload.polygonApiResponseLogJson || dataFetchErrorJson);
          const skippedJson = createSkippedJson("data_fetch", errorMsg);
          contextSetters.setAiAnalyzedTaRequestJson(skippedJson); contextSetters.setAiAnalyzedTaJson(skippedJson);
          contextSetters.setAiKeyTakeawaysRequestJson(skippedJson); contextSetters.setAiKeyTakeawaysJson(skippedJson);
          contextSetters.setAiOptionsAnalysisRequestJson(skippedJson); contextSetters.setAiOptionsAnalysisJson(skippedJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `FETCH_DATA_FAILURE. Error: ${errorMsg}. Transitioning to DATA_FETCH_FAILED.`);
          return FsmState.DATA_FETCH_FAILED;
        }
         if (event.type === 'STALE_DATA_FROM_ACTION') {
          const { error, message, expectedTicker, foundTickerInSnapshot } = event.payload;
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `STALE_DATA_FROM_ACTION. Expected: ${expectedTicker}, Found: ${foundTickerInSnapshot}. Error: ${error}. Msg: ${message}. Transitioning to STALE_DATA_FROM_ACTION_ERROR.`);
          const staleErrorJson = errorJsonWithDetails(message, `Expected ${expectedTicker}, got ${foundTickerInSnapshot || 'unknown'} from action state.`);
          contextSetters.setMarketStatusJson(staleErrorJson);
          contextSetters.setStockSnapshotJson(staleErrorJson);
          contextSetters.setStandardTasJson(staleErrorJson);
          contextSetters.setOptionsChainJson(staleErrorJson);
          const skippedDueToStale = createSkippedJson("stale_action_data", message);
          contextSetters.setAiAnalyzedTaRequestJson(skippedDueToStale); contextSetters.setAiAnalyzedTaJson(skippedDueToStale);
          contextSetters.setAiKeyTakeawaysRequestJson(skippedDueToStale); contextSetters.setAiKeyTakeawaysJson(skippedDueToStale);
          contextSetters.setAiOptionsAnalysisRequestJson(skippedDueToStale); contextSetters.setAiOptionsAnalysisJson(skippedDueToStale);
          return FsmState.STALE_DATA_FROM_ACTION_ERROR;
        }
        return state;

      case FsmState.DATA_FETCH_SUCCEEDED:
        if (event.type === 'INITIATE_AI_TA_SEQUENCE') {
            logDebug('StockAnalysisContext', 'FSM_TRANSITION', `DATA_FETCH_SUCCEEDED handling INITIATE_AI_TA_SEQUENCE. Setting AI TA placeholders. Transitioning to AWAITING_AI_TA_TRIGGER.`);
            contextSetters.setAiAnalyzedTaRequestJson(pendingJson);
            contextSetters.setAiAnalyzedTaJson(pendingJson);
            return FsmState.AWAITING_AI_TA_TRIGGER;
        }
        return state;
      case FsmState.DATA_FETCH_FAILED:
      case FsmState.STALE_DATA_FROM_ACTION_ERROR:
        if (event.type === 'PROCEED_TO_IDLE') {
            logDebug('StockAnalysisContext', 'FSM_TRANSITION', `${state} -> IDLE on PROCEED_TO_IDLE. Resetting isFullAnalysisTriggered.`);
            _setIsFullAnalysisTriggeredInternalState(false);
            return FsmState.IDLE;
        }
        return state;

      case FsmState.AWAITING_AI_TA_TRIGGER:
        if (event.type === 'TRIGGER_AI_TA') {
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `TRIGGER_AI_TA. Transitioning to ANALYZING_TA.`);
          return FsmState.ANALYZING_TA;
        }
        if (event.type === 'AI_TA_FAILURE') {
            const errorPayload = event.payload; const errorMsg = errorPayload.message || 'AI TA failed (consistency check in AWAITING)';
            const taErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
            contextSetters.setAiAnalyzedTaRequestJson(errorPayload.aiAnalyzedTaRequestJson || taErrorJson); contextSetters.setAiAnalyzedTaJson(taErrorJson);
            const skippedJson = createSkippedJson("ai_ta_consistency", errorMsg);
            contextSetters.setAiKeyTakeawaysRequestJson(skippedJson); contextSetters.setAiKeyTakeawaysJson(skippedJson);
            contextSetters.setAiOptionsAnalysisRequestJson(skippedJson); contextSetters.setAiOptionsAnalysisJson(skippedJson);
            logDebug('StockAnalysisContext', 'FSM_TRANSITION', `AI_TA_FAILURE (from AWAITING). Error: ${errorMsg}. Transitioning to AI_TA_FAILED.`);
            return FsmState.AI_TA_FAILED;
        }
        return state;

      case FsmState.ANALYZING_TA:
        if (event.type === 'AI_TA_SUCCESS') {
          contextSetters.setAiAnalyzedTaRequestJson(event.payload.aiAnalyzedTaRequestJson);
          contextSetters.setAiAnalyzedTaJson(event.payload.aiAnalyzedTaJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `AI_TA_SUCCESS. Transitioning to AI_TA_SUCCEEDED.`);
          return FsmState.AI_TA_SUCCEEDED;
        }
        if (event.type === 'AI_TA_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'AI TA analysis failed';
          const taErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiAnalyzedTaRequestJson(errorPayload.aiAnalyzedTaRequestJson || taErrorJson); contextSetters.setAiAnalyzedTaJson(taErrorJson);
          const skippedJson = createSkippedJson("ai_ta", errorMsg);
          contextSetters.setAiKeyTakeawaysRequestJson(skippedJson); contextSetters.setAiKeyTakeawaysJson(skippedJson);
          contextSetters.setAiOptionsAnalysisRequestJson(skippedJson); contextSetters.setAiOptionsAnalysisJson(skippedJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `AI_TA_FAILURE. Error: ${errorMsg}. Transitioning to AI_TA_FAILED.`);
          return FsmState.AI_TA_FAILED;
        }
        return state;

      case FsmState.AI_TA_SUCCEEDED:
        contextOriginals.debug('[CONTEXT_FSM_REDUCER]', `State: AI_TA_SUCCEEDED. Transitioning to FULL_ANALYSIS_COMPLETE.`);
        return FsmState.FULL_ANALYSIS_COMPLETE;

      case FsmState.AI_TA_FAILED:
        contextOriginals.debug('[CONTEXT_FSM_REDUCER]', `State: AI_TA_FAILED. Transitioning to FULL_ANALYSIS_COMPLETE.`);
        return FsmState.FULL_ANALYSIS_COMPLETE;

      case FsmState.GENERATING_KEY_TAKEAWAYS:
        if (event.type === 'KEY_TAKEAWAYS_SUCCESS') {
          contextSetters.setAiKeyTakeawaysRequestJson(event.payload.aiKeyTakeawaysRequestJson);
          contextSetters.setAiKeyTakeawaysJson(event.payload.aiKeyTakeawaysJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `KEY_TAKEAWAYS_SUCCESS (manual). Transitioning to FULL_ANALYSIS_COMPLETE.`);
          return FsmState.FULL_ANALYSIS_COMPLETE;
        }
        if (event.type === 'KEY_TAKEAWAYS_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Key Takeaways generation failed';
          const ktErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiKeyTakeawaysRequestJson(errorPayload.aiKeyTakeawaysRequestJson || ktErrorJson);
          contextSetters.setAiKeyTakeawaysJson(ktErrorJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `KEY_TAKEAWAYS_FAILURE (manual). Error: ${errorMsg}. Transitioning to FULL_ANALYSIS_COMPLETE.`);
          return FsmState.FULL_ANALYSIS_COMPLETE;
        }
        return state;

      case FsmState.ANALYZING_OPTIONS:
        if (event.type === 'OPTIONS_ANALYSIS_SUCCESS') {
          contextSetters.setAiOptionsAnalysisRequestJson(event.payload.aiOptionsAnalysisRequestJson);
          contextSetters.setAiOptionsAnalysisJson(event.payload.aiOptionsAnalysisJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `OPTIONS_ANALYSIS_SUCCESS (manual). Transitioning to FULL_ANALYSIS_COMPLETE.`);
          return FsmState.FULL_ANALYSIS_COMPLETE;
        }
        if (event.type === 'OPTIONS_ANALYSIS_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Options Analysis failed';
          const optErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiOptionsAnalysisRequestJson(errorPayload.aiOptionsAnalysisRequestJson || optErrorJson);
          contextSetters.setAiOptionsAnalysisJson(optErrorJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `OPTIONS_ANALYSIS_FAILURE (manual). Error: ${errorMsg}. Transitioning to FULL_ANALYSIS_COMPLETE.`);
          return FsmState.FULL_ANALYSIS_COMPLETE;
        }
        return state;

      case FsmState.FULL_ANALYSIS_COMPLETE:
        if (event.type === 'PROCEED_TO_IDLE') {
            logDebug('StockAnalysisContext', 'FSM_TRANSITION', `${state} handling PROCEED_TO_IDLE. Resetting isFullAnalysisTriggered. Transitioning to IDLE.`);
            _setIsFullAnalysisTriggeredInternalState(false);
            return FsmState.IDLE;
        }
        if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') {
          logDebug('StockAnalysisContext','FSM_TRANSITION', `Manually triggering Key Takeaways for ${event.payload.ticker} from FULL_ANALYSIS_COMPLETE. Setting placeholders.`);
          contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
          contextSetters.setAiKeyTakeawaysJson(pendingJson);
          return FsmState.GENERATING_KEY_TAKEAWAYS;
        }
        if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') {
          logDebug('StockAnalysisContext','FSM_TRANSITION', `Manually triggering Options Analysis for ${event.payload.ticker} from FULL_ANALYSIS_COMPLETE. Setting placeholders.`);
          contextSetters.setAiOptionsAnalysisRequestJson(pendingJson);
          contextSetters.setAiOptionsAnalysisJson(pendingJson);
          return FsmState.ANALYZING_OPTIONS;
        }
        if (event.type === 'ADD_CHAT_MESSAGE' && 'payload' in event) {
          const uniqueMessageSuffix = Math.random().toString(36).substring(2, 9);
          addChatMessage({...event.payload, id: `${event.payload.id}_${uniqueMessageSuffix}` });
        }
        return state;
      default:
        logDebug('StockAnalysisContext', 'FSM_UnhandledState', `Unhandled state in FSM reducer: ${state} for event ${event.type}`);
        return state;
    }
  };

  const [fsmState, dispatchFsmEvent] = useReducer(fsmReducer, defaultState.fsmState);

  useEffect(() => {
      contextOriginals.debug(`[CONTEXT_EFFECT_MONITOR_STATES] States changed: _isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}, _logSourceConfig.NATIVE_CONSOLE: ${_logSourceConfig.NATIVE_CONSOLE}, _logSourceConfig.StockAnalysisContext: ${_logSourceConfig.StockAnalysisContext}, _logSourceConfig.DebugConsole: ${_logSourceConfig.DebugConsole}`);
  }, [_isClientDebugConsoleEnabled, _logSourceConfig, contextOriginals]);


  useEffect(() => {
    contextOriginals.debug(`[CONTEXT_EFFECT_INTERCEPTION] Running. _isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}`);

    if (typeof window === 'undefined') {
      contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION_SSR]', 'Skipping on server.');
      return;
    }

    const currentOriginalsForInterceptor = (console as any).__stockSageContextOriginals || browserConsole;

    const interceptAndProcessLog = (
      type: 'log' | 'warn' | 'error' | 'info' | 'debug',
      ...args: any[]
    ) => {
      currentOriginalsForInterceptor[type](...args);
      contextOriginals.debug(`[CONTEXT_INTERCEPT] Intercepted. Type: ${type}, Args[0]: ${args[0]}, Marker: ${args[0] === LOGDEBUG_MARKER}, _isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}`);
      
      queueMicrotask(() => {
        if (!_isClientDebugConsoleEnabled) {
          contextOriginals.debug(`[CONTEXT_INTERCEPT_PROCESS] Discarding (console disabled). Type: ${type}`);
          return;
        }

        let source: LogSourceId = 'NATIVE_CONSOLE';
        let messagesForBuffer = args;
        let logTypeForBuffer = type;

        if (args.length > 0 && args[0] === LOGDEBUG_MARKER) {
          source = args[1] as LogSourceId;
          messagesForBuffer = args.slice(3);
          logTypeForBuffer = 'debug';
          contextOriginals.debug(`[CONTEXT_INTERCEPT_PROCESS] logDebug detected. Source: ${source}. _logSourceConfig[${source}]: ${_logSourceConfig[source]}`);
          if (!_logSourceConfig[source]) {
            contextOriginals.debug(`[CONTEXT_INTERCEPT_PROCESS] logDebug for ${source} is DISABLED by config. Discarding.`);
            return;
          }
        } else {
          contextOriginals.debug(`[CONTEXT_INTERCEPT_PROCESS] Native console log. _logSourceConfig.NATIVE_CONSOLE: ${_logSourceConfig['NATIVE_CONSOLE']}`);
          if (!_logSourceConfig['NATIVE_CONSOLE']) {
            contextOriginals.debug(`[CONTEXT_INTERCEPT_PROCESS] NATIVE_CONSOLE source is DISABLED by config. Discarding.`);
            return;
          }
        }
        contextOriginals.debug(`[CONTEXT_INTERCEPT_PROCESS] Adding to globalLogBuffer: Type: ${logTypeForBuffer}, Source: ${source}, Messages:`, messagesForBuffer);
        addEntryToGlobalLogBuffer({ type: logTypeForBuffer, messages: messagesForBuffer, source });
      });
    };

    if (_isClientDebugConsoleEnabled) {
      contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION] APPLYING interceptors.');
      contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION] Intercepting console.log...'); console.log = (...args) => interceptAndProcessLog('log', ...args);
      contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION] Intercepting console.warn...'); console.warn = (...args) => interceptAndProcessLog('warn', ...args);
      contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION] Intercepting console.error...'); console.error = (...args) => interceptAndProcessLog('error', ...args);
      contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION] Intercepting console.info...'); console.info = (...args) => interceptAndProcessLog('info', ...args);
      contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION] Intercepting console.debug...'); console.debug = (...args) => interceptAndProcessLog('debug', ...args);
      logDebug('StockAnalysisContext', 'EFFECT_DEBUG_INTERCEPT_ACTIVE', 'Console interception is NOW ACTIVE for UI buffer (call via intercepted console.debug).');
    } else {
      contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION] _isClientDebugConsoleEnabled is FALSE. Attempting to RESTORE original console methods.');
      if ((console as any).__stockSageContextOriginals) {
        Object.assign(console, (console as any).__stockSageContextOriginals);
        contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION] Console interception for UI buffer is NOW INACTIVE, context originals restored.');
      } else {
         contextOriginals.warn('[CONTEXT_EFFECT_INTERCEPTION] No context originals found to restore! This is unexpected.');
      }
    }

    return () => {
      contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION] CLEANUP: Restoring originals.');
      if ((console as any).__stockSageContextOriginals) {
        Object.assign(console, (console as any).__stockSageContextOriginals);
        contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION] Originals restored from context capture on cleanup.');
      } else {
        contextOriginals.warn('[CONTEXT_EFFECT_INTERCEPTION] Cleanup: No context originals found to restore!');
      }
    };
  }, [_isClientDebugConsoleEnabled, logDebug, _logSourceConfig, contextOriginals]);


  const setClientDebugConsoleOpen = useCallback((open: boolean) => {
    logDebug('StockAnalysisContext', 'DebugConsoleToggle', `ClientDebugConsoleOpen will be set to: ${open}. Current isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}`);
    if (_isClientDebugConsoleEnabled || !open) {
        _setClientDebugConsoleOpen(open);
    } else if (!_isClientDebugConsoleEnabled && open) {
        logDebug('StockAnalysisContext', 'DebugConsoleToggle', 'Attempted to open console while it is disabled. Opening action will be ignored.');
    }
  }, [_isClientDebugConsoleEnabled, _setClientDebugConsoleOpen, logDebug]);

  const contextValue: StockAnalysisContextType = {
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

    isFullAnalysisTriggered: _isFullAnalysisTriggeredInternalState,
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
    fsmState, dispatchFsmEvent,
  };

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
