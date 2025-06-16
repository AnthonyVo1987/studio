
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useReducer, useRef, startTransition } from 'react';
import { type LogSourceId, logSourceIds, type LogSourceConfig, defaultLogSourceConfig } from '@/lib/debug-log-types';
import { addEntryToGlobalLogBuffer, clearGlobalLogBuffer } from '@/lib/global-log-buffer';
import { fetchStockDataAction, type AnalyzeStockServerActionState, type StockDataFetchResult } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction, type AnalyzeTaActionState, type AnalyzeTaResult } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction, type PerformAiAnalysisActionState, type PerformAiAnalysisResult } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction, type PerformAiOptionsAnalysisActionState, type PerformAiOptionsAnalysisResult } from '@/actions/perform-ai-options-analysis-action';
import { useActionState } from 'react';


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

// FSM History State
export interface FsmHistoryState {
  previous: FsmState | null;
  current: FsmState;
}

export type FsmDisplayTuple = {
  previous: string | null;
  current: string;
  target: string | null;
};

const initialFsmDisplayTuple: FsmDisplayTuple = { previous: 'N/A', current: 'N/A', target: 'N/A'};


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
  
  | { type: 'FINALIZE_AUTOMATED_PIPELINE' }

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

  fsmState: FsmState; // Current FSM state derived from fsmHistory
  previousFsmState: FsmState | null; // Previous FSM state derived from fsmHistory
  targetFsmDisplayState: FsmState | null; // For UI display of intended next state

  isFsmDebugCardEnabled: boolean;
  isFsmDebugCardOpen: boolean;
  mainTabFsmDisplay: FsmDisplayTuple;
  chatbotFsmDisplay: FsmDisplayTuple;
  debugConsoleMenuFsmDisplay: FsmDisplayTuple;
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

  dispatchFsmEvent: (event: FsmEvent) => void; // Wrapped dispatch

  setFsmDebugCardEnabled: (enabled: boolean) => void;
  setFsmDebugCardOpen: (open: boolean) => void;
  setMainTabFsmDisplay: (display: FsmDisplayTuple) => void;
  setChatbotFsmDisplay: (display: FsmDisplayTuple) => void;
  setDebugConsoleMenuFsmDisplay: (display: FsmDisplayTuple) => void;
}

const initialJsonPlaceholder = '{ "status": "no_analysis_run_yet" }';
const pendingJson = '{ "status": "pending..." }';
const createSkippedJson = (reasonKey: string, message?: string) =>
  `{ "status": "skipped_due_to_${reasonKey}_failure", "message": "${message || `Skipped due to ${reasonKey} failure.`}" }`;

const initialFsmHistory: FsmHistoryState = {
  current: FsmState.IDLE,
  previous: null,
};

// Define initial states for useActionState directly in this client component
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
  isClientDebugConsoleEnabled: true, 
  isClientDebugConsoleOpen: true,   
  logSourceConfig: defaultLogSourceConfig,
  fsmState: initialFsmHistory.current,
  previousFsmState: initialFsmHistory.previous,
  targetFsmDisplayState: null,
  isFsmDebugCardEnabled: true,
  isFsmDebugCardOpen: true,
  mainTabFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
  chatbotFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
  debugConsoleMenuFsmDisplay: { ...initialFsmDisplayTuple, current: 'IDLE' },
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
  const [_targetFsmDisplayState, _setTargetFsmDisplayState] = useState<FsmState | null>(null);
  const activeAnalysisTickerRef = useRef<string | null>(null);

  const [_isFsmDebugCardEnabled, _setIsFsmDebugCardEnabled] = useState<boolean>(defaultState.isFsmDebugCardEnabled);
  const [_isFsmDebugCardOpen, _setIsFsmDebugCardOpen] = useState<boolean>(defaultState.isFsmDebugCardOpen);
  const [_mainTabFsmDisplay, _setMainTabFsmDisplay] = useState<FsmDisplayTuple>(defaultState.mainTabFsmDisplay);
  const [_chatbotFsmDisplay, _setChatbotFsmDisplay] = useState<FsmDisplayTuple>(defaultState.chatbotFsmDisplay);
  const [_debugConsoleMenuFsmDisplay, _setDebugConsoleMenuFsmDisplay] = useState<FsmDisplayTuple>(defaultState.debugConsoleMenuFsmDisplay);


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
    if (isFullAnalysis) {
        _setChatbotRequestJson(pendingJson);
        _setChatbotResponseJson(pendingJson);
    }
  }, [logDebug]);

  const enableAllLogSources = useCallback(() => {
    contextOriginals.debug('[CONTEXT_ENABLE_ALL_SOURCES] Called.');
    const newConfig: LogSourceConfig = {} as LogSourceConfig;
    logSourceIds.forEach(id => { newConfig[id] = true; });
    newConfig.DebugConsole = true; 
    contextOriginals.debug('[CONTEXT_ENABLE_ALL_SOURCES] newConfig prepared:', JSON.stringify(newConfig));
    _setLogSourceConfig(newConfig);
  }, [contextOriginals]);

  const disableAllLogSources = useCallback(() => {
    contextOriginals.debug('[CONTEXT_DISABLE_ALL_SOURCES] Called.');
    const newConfig: LogSourceConfig = {} as LogSourceConfig;
    logSourceIds.forEach(id => {
      newConfig[id] = id === 'DebugConsole'; 
    });
    contextOriginals.debug('[CONTEXT_DISABLE_ALL_SOURCES] newConfig prepared:', JSON.stringify(newConfig));
    _setLogSourceConfig(newConfig);
  }, [contextOriginals]);


  const setClientDebugConsoleEnabled = useCallback((enabled: boolean) => {
    contextOriginals.debug(`[CONTEXT_SET_CONSOLE_ENABLED] Called with: ${enabled}. Current _isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}`);
    _setClientDebugConsoleEnabled(enabled);
    if (enabled) {
        contextOriginals.debug(`[CONTEXT_SET_CONSOLE_ENABLED] Condition (enabled === true) met. Calling enableAllLogSources and _setClientDebugConsoleOpen(true).`);
        enableAllLogSources();
        _setLogSourceConfig(prevConfig => ({ ...prevConfig, OptionsChainTable: false }));
        logDebug('StockAnalysisContext', 'LogConfig', `OptionsChainTable log source explicitly DISABLED after enabling all.`);
        _setClientDebugConsoleOpen(true);
    } else {
        contextOriginals.debug(`[CONTEXT_SET_CONSOLE_ENABLED] Condition (enabled === false) met. Calling _setClientDebugConsoleOpen(false).`);
        _setClientDebugConsoleOpen(false);
    }
  }, [_isClientDebugConsoleEnabled, _setClientDebugConsoleOpen, contextOriginals, enableAllLogSources, logDebug]);

  const setFsmDebugCardEnabled = useCallback((enabled: boolean) => {
    logDebug('StockAnalysisContext', 'FsmDebugCard', `FSM Debug Card ENabled toggled to: ${enabled}`);
    _setIsFsmDebugCardEnabled(enabled);
    if (enabled) {
        _setIsFsmDebugCardOpen(true);
    } else {
        _setIsFsmDebugCardOpen(false);
    }
  }, [logDebug]);


  const fsmReducer = (currentHistory: FsmHistoryState, event: FsmEvent): FsmHistoryState => {
    const currentActualState = currentHistory.current;
    logDebug('StockAnalysisContext', 'FSM_REDUCER_ENTRY', `Global FSM Event: ${event.type}, Current State: ${currentActualState}`);
    if ('payload' in event && event.type !== 'ADD_CHAT_MESSAGE') {
        logDebug('StockAnalysisContext', 'FSM_REDUCER_PAYLOAD', `Payload for ${event.type}:`, event.payload ? JSON.stringify(event.payload).substring(0, 200) : 'No Payload Content');
    }


    const errorJsonWithDetails = (message: string, details: string | null | undefined) =>
      `{ "status": "error", "message": "${message.replace(/"/g, '\\"')}", "details": "${(details || '').replace(/"/g, '\\"')}" }`;
    
    let nextCurrentState: FsmState = currentActualState;

    switch (currentActualState) {
      case FsmState.IDLE:
        if (event.type === 'START_FULL_ANALYSIS') {
          activeAnalysisTickerRef.current = event.payload.ticker;
          setAllPlaceholdersInternal(event.payload.ticker, true);
          _setIsFullAnalysisTriggeredInternalState(true);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `START_FULL_ANALYSIS for ${event.payload.ticker}. activeAnalysisTickerRef set. isFullAnalysisTriggered true. Transitioning to INITIALIZING_ANALYSIS.`);
          nextCurrentState = FsmState.INITIALIZING_ANALYSIS;
        } else if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') {
          activeAnalysisTickerRef.current = event.payload.ticker;
          logDebug('StockAnalysisContext','FSM_TRANSITION', `Manually triggering Key Takeaways for ${event.payload.ticker}. Setting placeholders.`);
          contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
          contextSetters.setAiKeyTakeawaysJson(pendingJson);
          nextCurrentState = FsmState.GENERATING_KEY_TAKEAWAYS;
        } else if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') {
          activeAnalysisTickerRef.current = event.payload.ticker;
          logDebug('StockAnalysisContext','FSM_TRANSITION', `Manually triggering Options Analysis for ${event.payload.ticker}. Setting placeholders.`);
          contextSetters.setAiOptionsAnalysisRequestJson(pendingJson);
          contextSetters.setAiOptionsAnalysisJson(pendingJson);
          nextCurrentState = FsmState.ANALYZING_OPTIONS;
        } else if (event.type === 'ADD_CHAT_MESSAGE' && 'payload' in event) {
          const uniqueMessageSuffix = Math.random().toString(36).substring(2, 9);
          addChatMessage({...event.payload, id: `${event.payload.id}_${uniqueMessageSuffix}` });
        }
        break;

      case FsmState.INITIALIZING_ANALYSIS:
        if (event.type === 'INITIALIZATION_COMPLETE') {
            logDebug('StockAnalysisContext', 'FSM_TRANSITION', `INITIALIZATION_COMPLETE. Transitioning to AWAITING_DATA_FETCH_TRIGGER.`);
            nextCurrentState = FsmState.AWAITING_DATA_FETCH_TRIGGER;
        }
        break;

      case FsmState.AWAITING_DATA_FETCH_TRIGGER:
        if (event.type === 'TRIGGER_DATA_FETCH') {
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `TRIGGER_DATA_FETCH. Transitioning to FETCHING_DATA.`);
          nextCurrentState = FsmState.FETCHING_DATA;
        }
        break;

      case FsmState.FETCHING_DATA:
        if (event.type === 'FETCH_DATA_SUCCESS') {
          contextSetters.setMarketStatusJson(event.payload.marketStatusJson);
          contextSetters.setStockSnapshotJson(event.payload.stockSnapshotJson);
          contextSetters.setStandardTasJson(event.payload.standardTasJson);
          contextSetters.setOptionsChainJson(event.payload.optionsChainJson);
          contextSetters.setPolygonApiRequestLogJson(event.payload.polygonApiRequestLogJson);
          contextSetters.setPolygonApiResponseLogJson(event.payload.polygonApiResponseLogJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `FETCH_DATA_SUCCESS. Transitioning to DATA_FETCH_SUCCEEDED.`);
          nextCurrentState = FsmState.DATA_FETCH_SUCCEEDED;
        } else if (event.type === 'FETCH_DATA_FAILURE') {
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
          nextCurrentState = FsmState.DATA_FETCH_FAILED;
        } else if (event.type === 'STALE_DATA_FROM_ACTION') {
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
          nextCurrentState = FsmState.STALE_DATA_FROM_ACTION_ERROR;
        }
        break;

      case FsmState.DATA_FETCH_SUCCEEDED:
        if (event.type === 'INITIATE_AI_TA_SEQUENCE') {
            logDebug('StockAnalysisContext', 'FSM_TRANSITION', `DATA_FETCH_SUCCEEDED handling INITIATE_AI_TA_SEQUENCE. Setting AI TA placeholders. Transitioning to AWAITING_AI_TA_TRIGGER.`);
            contextSetters.setAiAnalyzedTaRequestJson(pendingJson);
            contextSetters.setAiAnalyzedTaJson(pendingJson);
            nextCurrentState = FsmState.AWAITING_AI_TA_TRIGGER;
        }
        break;
      case FsmState.DATA_FETCH_FAILED:
      case FsmState.STALE_DATA_FROM_ACTION_ERROR:
        if (event.type === 'PROCEED_TO_IDLE') {
            logDebug('StockAnalysisContext', 'FSM_TRANSITION', `${currentActualState} -> IDLE on PROCEED_TO_IDLE. Resetting isFullAnalysisTriggered.`);
            _setIsFullAnalysisTriggeredInternalState(false);
            activeAnalysisTickerRef.current = null;
            nextCurrentState = FsmState.IDLE;
        }
        break;

      case FsmState.AWAITING_AI_TA_TRIGGER:
        if (event.type === 'TRIGGER_AI_TA') {
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `TRIGGER_AI_TA. Transitioning to ANALYZING_TA.`);
          nextCurrentState = FsmState.ANALYZING_TA;
        } else if (event.type === 'AI_TA_FAILURE') { 
            const errorPayload = event.payload; const errorMsg = errorPayload.message || 'AI TA failed (consistency check in AWAITING)';
            const taErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
            contextSetters.setAiAnalyzedTaRequestJson(errorPayload.aiAnalyzedTaRequestJson || taErrorJson); contextSetters.setAiAnalyzedTaJson(taErrorJson);
            const skippedJson = createSkippedJson("ai_ta_consistency", errorMsg);
            contextSetters.setAiKeyTakeawaysRequestJson(skippedJson); contextSetters.setAiKeyTakeawaysJson(skippedJson);
            contextSetters.setAiOptionsAnalysisRequestJson(skippedJson); contextSetters.setAiOptionsAnalysisJson(skippedJson);
            logDebug('StockAnalysisContext', 'FSM_TRANSITION', `AI_TA_FAILURE (from AWAITING). Error: ${errorMsg}. Transitioning to AI_TA_FAILED.`);
            nextCurrentState = FsmState.AI_TA_FAILED;
        }
        break;

      case FsmState.ANALYZING_TA:
        if (event.type === 'AI_TA_SUCCESS') {
          contextSetters.setAiAnalyzedTaRequestJson(event.payload.aiAnalyzedTaRequestJson);
          contextSetters.setAiAnalyzedTaJson(event.payload.aiAnalyzedTaJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `AI_TA_SUCCESS. Transitioning to AI_TA_SUCCEEDED.`);
          nextCurrentState = FsmState.AI_TA_SUCCEEDED;
        } else if (event.type === 'AI_TA_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'AI TA analysis failed';
          const taErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiAnalyzedTaRequestJson(errorPayload.aiAnalyzedTaRequestJson || taErrorJson); contextSetters.setAiAnalyzedTaJson(taErrorJson);
          const skippedJson = createSkippedJson("ai_ta", errorMsg);
          contextSetters.setAiKeyTakeawaysRequestJson(skippedJson); contextSetters.setAiKeyTakeawaysJson(skippedJson);
          contextSetters.setAiOptionsAnalysisRequestJson(skippedJson); contextSetters.setAiOptionsAnalysisJson(skippedJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `AI_TA_FAILURE. Error: ${errorMsg}. Transitioning to AI_TA_FAILED.`);
          nextCurrentState = FsmState.AI_TA_FAILED;
        }
        break;

      case FsmState.AI_TA_SUCCEEDED:
      case FsmState.AI_TA_FAILED:
        logDebug('StockAnalysisContext', 'FSM_STATE_LOG', `State is ${currentActualState}. Current event: ${event.type}`);
        if (event.type === 'FINALIZE_AUTOMATED_PIPELINE') {
            logDebug('StockAnalysisContext', 'FSM_TRANSITION', `Event FINALIZE_AUTOMATED_PIPELINE received in ${currentActualState} state. Transitioning to FULL_ANALYSIS_COMPLETE.`);
            nextCurrentState = FsmState.FULL_ANALYSIS_COMPLETE;
        }
        break; 

      case FsmState.GENERATING_KEY_TAKEAWAYS:
        if (event.type === 'KEY_TAKEAWAYS_SUCCESS') {
          contextSetters.setAiKeyTakeawaysRequestJson(event.payload.aiKeyTakeawaysRequestJson);
          contextSetters.setAiKeyTakeawaysJson(event.payload.aiKeyTakeawaysJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `KEY_TAKEAWAYS_SUCCESS (manual). Transitioning to FULL_ANALYSIS_COMPLETE.`);
          nextCurrentState = FsmState.FULL_ANALYSIS_COMPLETE;
        } else if (event.type === 'KEY_TAKEAWAYS_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Key Takeaways generation failed';
          const ktErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiKeyTakeawaysRequestJson(errorPayload.aiKeyTakeawaysRequestJson || ktErrorJson);
          contextSetters.setAiKeyTakeawaysJson(ktErrorJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `KEY_TAKEAWAYS_FAILURE (manual). Error: ${errorMsg}. Transitioning to FULL_ANALYSIS_COMPLETE.`);
          nextCurrentState = FsmState.FULL_ANALYSIS_COMPLETE;
        }
        break;

      case FsmState.ANALYZING_OPTIONS:
        if (event.type === 'OPTIONS_ANALYSIS_SUCCESS') {
          contextSetters.setAiOptionsAnalysisRequestJson(event.payload.aiOptionsAnalysisRequestJson);
          contextSetters.setAiOptionsAnalysisJson(event.payload.aiOptionsAnalysisJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `OPTIONS_ANALYSIS_SUCCESS (manual). Transitioning to FULL_ANALYSIS_COMPLETE.`);
          nextCurrentState = FsmState.FULL_ANALYSIS_COMPLETE;
        } else if (event.type === 'OPTIONS_ANALYSIS_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Options Analysis failed';
          const optErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiOptionsAnalysisRequestJson(errorPayload.aiOptionsAnalysisRequestJson || optErrorJson);
          contextSetters.setAiOptionsAnalysisJson(optErrorJson);
          logDebug('StockAnalysisContext', 'FSM_TRANSITION', `OPTIONS_ANALYSIS_FAILURE (manual). Error: ${errorMsg}. Transitioning to FULL_ANALYSIS_COMPLETE.`);
          nextCurrentState = FsmState.FULL_ANALYSIS_COMPLETE;
        }
        break;

      case FsmState.FULL_ANALYSIS_COMPLETE:
        if (event.type === 'PROCEED_TO_IDLE') {
            logDebug('StockAnalysisContext', 'FSM_TRANSITION', `${currentActualState} handling PROCEED_TO_IDLE. isFullAnalysisTriggered: ${_isFullAnalysisTriggeredInternalState}. Active Ticker: ${activeAnalysisTickerRef.current}. Transitioning to IDLE.`);
            _setIsFullAnalysisTriggeredInternalState(false);
            nextCurrentState = FsmState.IDLE;
        } else if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') {
          activeAnalysisTickerRef.current = event.payload.ticker;
          logDebug('StockAnalysisContext','FSM_TRANSITION', `Manually triggering Key Takeaways for ${event.payload.ticker} from FULL_ANALYSIS_COMPLETE. Setting placeholders.`);
          contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
          contextSetters.setAiKeyTakeawaysJson(pendingJson);
          nextCurrentState = FsmState.GENERATING_KEY_TAKEAWAYS;
        } else if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') {
          activeAnalysisTickerRef.current = event.payload.ticker;
          logDebug('StockAnalysisContext','FSM_TRANSITION', `Manually triggering Options Analysis for ${event.payload.ticker} from FULL_ANALYSIS_COMPLETE. Setting placeholders.`);
          contextSetters.setAiOptionsAnalysisRequestJson(pendingJson);
          contextSetters.setAiOptionsAnalysisJson(pendingJson);
          nextCurrentState = FsmState.ANALYZING_OPTIONS;
        } else if (event.type === 'ADD_CHAT_MESSAGE' && 'payload' in event) {
          const uniqueMessageSuffix = Math.random().toString(36).substring(2, 9);
          addChatMessage({...event.payload, id: `${event.payload.id}_${uniqueMessageSuffix}` });
        }
        break;
      default:
        logDebug('StockAnalysisContext', 'FSM_UnhandledState', `Unhandled state in FSM reducer: ${currentActualState} for event ${event.type}`);
        break;
    }
    return { current: nextCurrentState, previous: currentActualState };
  };

  const [fsmHistory, _dispatchFsmEventActual] = useReducer(fsmReducer, initialFsmHistory);
  const fsmHistoryRef = useRef<FsmHistoryState>(fsmHistory);

  useEffect(() => {
    fsmHistoryRef.current = fsmHistory;
  }, [fsmHistory]);

  const dispatchFsmEvent = useCallback((event: FsmEvent) => {
    const currentActualState = fsmHistoryRef.current.current;
    let determinedTarget: FsmState | null = null;

    switch (currentActualState) {
        case FsmState.IDLE:
            if (event.type === 'START_FULL_ANALYSIS') determinedTarget = FsmState.INITIALIZING_ANALYSIS;
            else if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') determinedTarget = FsmState.GENERATING_KEY_TAKEAWAYS;
            else if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') determinedTarget = FsmState.ANALYZING_OPTIONS;
            break;
        case FsmState.INITIALIZING_ANALYSIS:
            if (event.type === 'INITIALIZATION_COMPLETE') determinedTarget = FsmState.AWAITING_DATA_FETCH_TRIGGER;
            break;
        case FsmState.AWAITING_DATA_FETCH_TRIGGER:
            if (event.type === 'TRIGGER_DATA_FETCH') determinedTarget = FsmState.FETCHING_DATA;
            break;
        case FsmState.FETCHING_DATA:
            if (event.type === 'FETCH_DATA_SUCCESS') determinedTarget = FsmState.DATA_FETCH_SUCCEEDED;
            else if (event.type === 'FETCH_DATA_FAILURE') determinedTarget = FsmState.DATA_FETCH_FAILED;
            else if (event.type === 'STALE_DATA_FROM_ACTION') determinedTarget = FsmState.STALE_DATA_FROM_ACTION_ERROR;
            break;
        case FsmState.DATA_FETCH_SUCCEEDED:
            if (event.type === 'INITIATE_AI_TA_SEQUENCE') determinedTarget = FsmState.AWAITING_AI_TA_TRIGGER;
            break;
        case FsmState.AWAITING_AI_TA_TRIGGER:
            if (event.type === 'TRIGGER_AI_TA') determinedTarget = FsmState.ANALYZING_TA;
            else if (event.type === 'AI_TA_FAILURE') determinedTarget = FsmState.AI_TA_FAILED; 
            break;
        case FsmState.ANALYZING_TA:
            if (event.type === 'AI_TA_SUCCESS') determinedTarget = FsmState.AI_TA_SUCCEEDED;
            else if (event.type === 'AI_TA_FAILURE') determinedTarget = FsmState.AI_TA_FAILED;
            break;
        case FsmState.AI_TA_SUCCEEDED:
        case FsmState.AI_TA_FAILED:
            if (event.type === 'FINALIZE_AUTOMATED_PIPELINE') determinedTarget = FsmState.FULL_ANALYSIS_COMPLETE;
            break;
        case FsmState.GENERATING_KEY_TAKEAWAYS:
            if (event.type === 'KEY_TAKEAWAYS_SUCCESS' || event.type === 'KEY_TAKEAWAYS_FAILURE') determinedTarget = FsmState.FULL_ANALYSIS_COMPLETE;
            break;
        case FsmState.ANALYZING_OPTIONS:
            if (event.type === 'OPTIONS_ANALYSIS_SUCCESS' || event.type === 'OPTIONS_ANALYSIS_FAILURE') determinedTarget = FsmState.FULL_ANALYSIS_COMPLETE;
            break;
        case FsmState.FULL_ANALYSIS_COMPLETE:
            if (event.type === 'PROCEED_TO_IDLE') determinedTarget = FsmState.IDLE;
            else if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') determinedTarget = FsmState.GENERATING_KEY_TAKEAWAYS;
            else if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') determinedTarget = FsmState.ANALYZING_OPTIONS;
            break;
        case FsmState.DATA_FETCH_FAILED:
        case FsmState.STALE_DATA_FROM_ACTION_ERROR:
            if (event.type === 'PROCEED_TO_IDLE') determinedTarget = FsmState.IDLE;
            break;
    }

    if (determinedTarget) {
        logDebug('StockAnalysisContext', 'FSM_TARGET', `Event ${event.type} from ${currentActualState} targeting ${determinedTarget}.`);
        _setTargetFsmDisplayState(determinedTarget);
    }
    _dispatchFsmEventActual(event);
  }, [_dispatchFsmEventActual, _setTargetFsmDisplayState, logDebug]);

  useEffect(() => {
    logDebug('StockAnalysisContext', 'FSM_TARGET_CLEAR', `Current FSM state changed to ${fsmHistory.current}. Clearing target display state.`);
    _setTargetFsmDisplayState(null);
  }, [fsmHistory.current, logDebug]);


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
      
      queueMicrotask(() => {
        if (!_isClientDebugConsoleEnabled) {
          return;
        }

        let source: LogSourceId = 'NATIVE_CONSOLE';
        let messagesForBuffer = args;
        let logTypeForBuffer = type;

        if (args.length > 0 && args[0] === LOGDEBUG_MARKER) {
          source = args[1] as LogSourceId;
          messagesForBuffer = args.slice(3);
          logTypeForBuffer = 'debug';
          if (!_logSourceConfig[source]) {
            return;
          }
        } else {
          if (!_logSourceConfig['NATIVE_CONSOLE']) {
            return;
          }
        }
        addEntryToGlobalLogBuffer({ type: logTypeForBuffer, messages: messagesForBuffer, source });
      });
    };

    if (_isClientDebugConsoleEnabled) {
      contextOriginals.debug('[CONTEXT_EFFECT_INTERCEPTION] APPLYING interceptors.');
      console.log = (...args) => interceptAndProcessLog('log', ...args);
      console.warn = (...args) => interceptAndProcessLog('warn', ...args);
      console.error = (...args) => interceptAndProcessLog('error', ...args);
      console.info = (...args) => interceptAndProcessLog('info', ...args);
      console.debug = (...args) => interceptAndProcessLog('debug', ...args);
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

  // Server Action states
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
  
  // Effect for Global FSM Pipeline Orchestration
  useEffect(() => {
    const currentGlobalFsmState = fsmHistoryRef.current.current;
    logDebug('StockAnalysisContext', 'GlobalFsmEffect', `Global FSM Orchestrator running. Current State: ${currentGlobalFsmState}, Active Ticker: ${activeAnalysisTickerRef.current}`);

    if (currentGlobalFsmState === FsmState.INITIALIZING_ANALYSIS) {
        logDebug('StockAnalysisContext', 'GlobalFsmEffect_Action', 'State is INITIALIZING_ANALYSIS. Dispatching INITIALIZATION_COMPLETE.');
        _dispatchFsmEventActual({ type: 'INITIALIZATION_COMPLETE' });
    } else if (currentGlobalFsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER) {
        logDebug('StockAnalysisContext', 'GlobalFsmEffect_Action', 'State is AWAITING_DATA_FETCH_TRIGGER. Dispatching TRIGGER_DATA_FETCH.');
        _dispatchFsmEventActual({ type: 'TRIGGER_DATA_FETCH' });
    } else if (currentGlobalFsmState === FsmState.FETCHING_DATA && activeAnalysisTickerRef.current) {
        logDebug('StockAnalysisContext', 'GlobalFsmEffect_Action', `State is FETCHING_DATA for ${activeAnalysisTickerRef.current}. Calling fetchStockDataFormAction.`);
        startTransition(() => {
            fetchStockDataFormAction({ ticker: activeAnalysisTickerRef.current! });
        });
        logDebug('StockAnalysisContext', 'GlobalFsmEffect_Action', `fetchStockDataFormAction call initiated for ${activeAnalysisTickerRef.current}.`);
    } else if (currentGlobalFsmState === FsmState.DATA_FETCH_SUCCEEDED && _isFullAnalysisTriggeredInternalState) {
        logDebug('StockAnalysisContext', 'GlobalFsmEffect_Action', `State is DATA_FETCH_SUCCEEDED and full analysis is triggered. Dispatching INITIATE_AI_TA_SEQUENCE.`);
        _dispatchFsmEventActual({ type: 'INITIATE_AI_TA_SEQUENCE' });
    } else if (currentGlobalFsmState === FsmState.AWAITING_AI_TA_TRIGGER && _isFullAnalysisTriggeredInternalState) {
        logDebug('StockAnalysisContext', 'GlobalFsmEffect_Action', `State is AWAITING_AI_TA_TRIGGER and full analysis is triggered. Dispatching TRIGGER_AI_TA.`);
         _dispatchFsmEventActual({ type: 'TRIGGER_AI_TA' });
    } else if (currentGlobalFsmState === FsmState.ANALYZING_TA && activeAnalysisTickerRef.current && _isFullAnalysisTriggeredInternalState) {
        logDebug('StockAnalysisContext', 'GlobalFsmEffect_Action', `State is ANALYZING_TA for ${activeAnalysisTickerRef.current} (full analysis). Calling analyzeTaFormAction.`);
        if (_stockSnapshotJson && _stockSnapshotJson !== pendingJson && !_stockSnapshotJson.includes("error")) {
            startTransition(() => {
                analyzeTaFormAction({ stockSnapshotJson: _stockSnapshotJson, ticker: activeAnalysisTickerRef.current! });
            });
        } else {
            logDebug('StockAnalysisContext', 'GlobalFsmEffect_Error', `Skipping AI TA for ${activeAnalysisTickerRef.current} due to missing or error in stockSnapshotJson.`);
            _dispatchFsmEventActual({ type: 'AI_TA_FAILURE', payload: { message: 'Snapshot data missing for AI TA', error: 'Snapshot data unavailable' } });
        }
    } else if ((currentGlobalFsmState === FsmState.AI_TA_SUCCEEDED || currentGlobalFsmState === FsmState.AI_TA_FAILED) && _isFullAnalysisTriggeredInternalState) {
        logDebug('StockAnalysisContext', 'GlobalFsmEffect_Action', `State is ${currentGlobalFsmState} (full analysis). Dispatching FINALIZE_AUTOMATED_PIPELINE.`);
        _dispatchFsmEventActual({ type: 'FINALIZE_AUTOMATED_PIPELINE' });
    } else if (currentGlobalFsmState === FsmState.GENERATING_KEY_TAKEAWAYS && activeAnalysisTickerRef.current) {
        logDebug('StockAnalysisContext', 'GlobalFsmEffect_Action', `State is GENERATING_KEY_TAKEAWAYS for ${activeAnalysisTickerRef.current}. Calling performAiAnalysisFormAction.`);
        if (_stockSnapshotJson && _standardTasJson && _aiAnalyzedTaJson && _marketStatusJson &&
            !_stockSnapshotJson.includes("error") && !_standardTasJson.includes("error") && !_aiAnalyzedTaJson.includes("error") && !_marketStatusJson.includes("error")) {
            startTransition(() => {
                performAiAnalysisFormAction({ ticker: activeAnalysisTickerRef.current!, stockSnapshotJson: _stockSnapshotJson, standardTasJson: _standardTasJson, aiAnalyzedTaJson: _aiAnalyzedTaJson, marketStatusJson: _marketStatusJson });
            });
        } else {
            logDebug('StockAnalysisContext', 'GlobalFsmEffect_Error', `Skipping Key Takeaways for ${activeAnalysisTickerRef.current} due to missing or error in prerequisite data.`);
            _dispatchFsmEventActual({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { message: 'Prerequisite data missing for Key Takeaways', error: 'Data unavailable' } });
        }
    } else if (currentGlobalFsmState === FsmState.ANALYZING_OPTIONS && activeAnalysisTickerRef.current) {
        logDebug('StockAnalysisContext', 'GlobalFsmEffect_Action', `State is ANALYZING_OPTIONS for ${activeAnalysisTickerRef.current}. Calling performAiOptionsAnalysisFormAction.`);
        if (_optionsChainJson && _stockSnapshotJson && !_optionsChainJson.includes("error") && !_stockSnapshotJson.includes("error")) {
            startTransition(() => {
                performAiOptionsAnalysisFormAction({ ticker: activeAnalysisTickerRef.current!, optionsChainJson: _optionsChainJson, stockSnapshotJson: _stockSnapshotJson });
            });
        } else {
            logDebug('StockAnalysisContext', 'GlobalFsmEffect_Error', `Skipping Options Analysis for ${activeAnalysisTickerRef.current} due to missing or error in prerequisite data.`);
            _dispatchFsmEventActual({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { message: 'Prerequisite data missing for Options Analysis', error: 'Data unavailable' } });
        }
    } else if ((currentGlobalFsmState === FsmState.DATA_FETCH_FAILED || currentGlobalFsmState === FsmState.STALE_DATA_FROM_ACTION_ERROR || currentGlobalFsmState === FsmState.FULL_ANALYSIS_COMPLETE)) {
        logDebug('StockAnalysisContext', 'GlobalFsmEffect_Action', `State is ${currentGlobalFsmState}. Dispatching PROCEED_TO_IDLE.`);
        _dispatchFsmEventActual({ type: 'PROCEED_TO_IDLE' });
    }


  }, [fsmHistory.current, _dispatchFsmEventActual, logDebug, _isFullAnalysisTriggeredInternalState, _stockSnapshotJson, _standardTasJson, _aiAnalyzedTaJson, _marketStatusJson, _optionsChainJson, fetchStockDataFormAction, analyzeTaFormAction, performAiAnalysisFormAction, performAiOptionsAnalysisFormAction ]);


  // Effect for fetchStockDataAction results
  useEffect(() => {
    if (fsmHistoryRef.current.current !== FsmState.FETCHING_DATA) return; 

    if (fetchDataActionState.status === 'success' && fetchDataActionState.data) {
        logDebug('StockAnalysisContext', 'ActionState:fetchData', 'SUCCESS', fetchDataActionState.data);
        dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: fetchDataActionState.data });
    } else if (fetchDataActionState.status === 'error') {
        logDebug('StockAnalysisContext', 'ActionState:fetchData', 'ERROR', fetchDataActionState);
        if (fetchDataActionState.message && fetchDataActionState.message.includes("Stale data detected")) {
             dispatchFsmEvent({ 
                type: 'STALE_DATA_FROM_ACTION', 
                payload: { 
                    error: fetchDataActionState.error || "Stale data error", 
                    message: fetchDataActionState.message,
                    expectedTicker: activeAnalysisTickerRef.current || "UNKNOWN",
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

  // Effect for analyzeTaAction results
  useEffect(() => {
    if (fsmHistoryRef.current.current !== FsmState.ANALYZING_TA) return;

    if (analyzeTaActionState.status === 'success' && analyzeTaActionState.data) {
        logDebug('StockAnalysisContext', 'ActionState:analyzeTa', 'SUCCESS', analyzeTaActionState.data);
        dispatchFsmEvent({ type: 'AI_TA_SUCCESS', payload: analyzeTaActionState.data });
    } else if (analyzeTaActionState.status === 'error') {
        logDebug('StockAnalysisContext', 'ActionState:analyzeTa', 'ERROR', analyzeTaActionState);
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
  
  // Effect for performAiAnalysisAction (Key Takeaways) results
  useEffect(() => {
    if (fsmHistoryRef.current.current !== FsmState.GENERATING_KEY_TAKEAWAYS) return;

    if (performAiAnalysisActionState.status === 'success' && performAiAnalysisActionState.data) {
        logDebug('StockAnalysisContext', 'ActionState:performAiAnalysis', 'SUCCESS', performAiAnalysisActionState.data);
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: performAiAnalysisActionState.data });
    } else if (performAiAnalysisActionState.status === 'error') {
        logDebug('StockAnalysisContext', 'ActionState:performAiAnalysis', 'ERROR', performAiAnalysisActionState);
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

  // Effect for performAiOptionsAnalysisAction results
  useEffect(() => {
    if (fsmHistoryRef.current.current !== FsmState.ANALYZING_OPTIONS) return;

    if (performAiOptionsAnalysisActionState.status === 'success' && performAiOptionsAnalysisActionState.data) {
        logDebug('StockAnalysisContext', 'ActionState:performAiOptions', 'SUCCESS', performAiOptionsAnalysisActionState.data);
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: performAiOptionsAnalysisActionState.data });
    } else if (performAiOptionsAnalysisActionState.status === 'error') {
        logDebug('StockAnalysisContext', 'ActionState:performAiOptions', 'ERROR', performAiOptionsAnalysisActionState);
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
    fsmState: fsmHistory.current, 
    previousFsmState: fsmHistory.previous,
    targetFsmDisplayState: _targetFsmDisplayState,
    dispatchFsmEvent,
    isFsmDebugCardEnabled: _isFsmDebugCardEnabled, setFsmDebugCardEnabled,
    isFsmDebugCardOpen: _isFsmDebugCardOpen, setFsmDebugCardOpen: _setIsFsmDebugCardOpen,
    mainTabFsmDisplay: _mainTabFsmDisplay, setMainTabFsmDisplay: _setMainTabFsmDisplay,
    chatbotFsmDisplay: _chatbotFsmDisplay, setChatbotFsmDisplay: _setChatbotFsmDisplay,
    debugConsoleMenuFsmDisplay: _debugConsoleMenuFsmDisplay, setDebugConsoleMenuFsmDisplay: _setDebugConsoleMenuFsmDisplay,
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

    