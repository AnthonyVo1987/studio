
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useReducer, useRef, startTransition, useMemo } from 'react';
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

  fsmState: FsmState; 
  previousFsmState: FsmState | null; 
  targetFsmDisplayState: FsmState | null; 

  isFsmDebugCardEnabled: boolean;
  isFsmDebugCardOpen: boolean;
  
  mainTabFsmDisplay: FsmDisplayTuple | null;
  chatbotFsmDisplay: FsmDisplayTuple | null;
  debugConsoleMenuFsmDisplay: FsmDisplayTuple | null;
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

  dispatchFsmEvent: (event: FsmEvent) => void; 

  setFsmDebugCardEnabled: (enabled: boolean) => void;
  setFsmDebugCardOpen: (open: boolean) => void;

  setMainTabFsmDisplay: (display: FsmDisplayTuple | null) => void;
  setChatbotFsmDisplay: (display: FsmDisplayTuple | null) => void;
  setDebugConsoleMenuFsmDisplay: (display: FsmDisplayTuple | null) => void;
}

const initialJsonPlaceholder = '{ "status": "no_analysis_run_yet" }';
const pendingJson = '{ "status": "pending..." }';
const createSkippedJson = (reasonKey: string, message?: string) =>
  `{ "status": "skipped_due_to_${reasonKey}_failure", "message": "${message || `Skipped due to ${reasonKey} failure.`}" }`;

const initialFsmHistory: FsmHistoryState = {
  current: FsmState.IDLE,
  previous: null,
};
const initialFsmDisplayTuple: FsmDisplayTuple = { previous: null, current: 'N/A', target: null };

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

  const [_mainTabFsmDisplay, _setMainTabFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.mainTabFsmDisplay);
  const [_chatbotFsmDisplay, _setChatbotFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.chatbotFsmDisplay);
  const [_debugConsoleMenuFsmDisplay, _setDebugConsoleMenuFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.debugConsoleMenuFsmDisplay);


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
      logDebug('StockAnalysisContext', 'LogConfigChange', `Log source '${source}' ${enabled ? 'ENABLED' : 'DISABLED'}.`);
      return newConfig;
    });
  }, [_setLogSourceConfig, logDebug]);

  const addChatMessage = useCallback((message: ChatMessage) => {
    _setChatHistory(prev => [...prev, message]);
    logDebug('StockAnalysisContext', 'ChatUpdate', `Added interactive chat message from ${message.role}:`, message.content.substring(0, 50));
  }, [_setChatHistory, logDebug]);

  const clearChatHistory = useCallback(() => {
    _setChatHistory([]);
    logDebug('StockAnalysisContext', 'ChatUpdate', 'Interactive chat history CLEARED by user action.');
  }, [_setChatHistory, logDebug]);

  const setAllPlaceholdersInternal = useCallback((currentTickerForLogOnly: string, isFullAnalysis: boolean) => {
    logDebug('StockAnalysisContext','FsmUtil', `Resetting analysis-related context JSONs to generic PENDING for new analysis of ${currentTickerForLogOnly}. Full analysis mode: ${isFullAnalysis}. CHAT HISTORY AND DEBUG LOGS ARE PRESERVED.`);
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
      if (prevDisplay?.current === display?.current &&
          prevDisplay?.previous === display?.previous &&
          prevDisplay?.target === display?.target) {
        return prevDisplay;
      }
      logDebug('StockAnalysisContext', 'FSMDisplayUpdate', 'MainTabFsmDisplay updated.', display);
      return display;
    });
  }, [_setMainTabFsmDisplay, logDebug]);

  const setChatbotFsmDisplay = useCallback((display: FsmDisplayTuple | null) => {
    _setChatbotFsmDisplay(prevDisplay => {
      if (prevDisplay?.current === display?.current &&
          prevDisplay?.previous === display?.previous &&
          prevDisplay?.target === display?.target) {
        return prevDisplay;
      }
      logDebug('StockAnalysisContext', 'FSMDisplayUpdate', 'ChatbotFsmDisplay updated.', display);
      return display;
    });
  }, [_setChatbotFsmDisplay, logDebug]);

  const setDebugConsoleMenuFsmDisplay = useCallback((display: FsmDisplayTuple | null) => {
    _setDebugConsoleMenuFsmDisplay(prevDisplay => {
      if (prevDisplay?.current === display?.current &&
          prevDisplay?.previous === display?.previous &&
          prevDisplay?.target === display?.target) {
        return prevDisplay;
      }
      logDebug('StockAnalysisContext', 'FSMDisplayUpdate', 'DebugConsoleMenuFsmDisplay updated.', display);
      return display;
    });
  }, [_setDebugConsoleMenuFsmDisplay, logDebug]);


  const fsmReducer = (currentHistory: FsmHistoryState, event: FsmEvent): FsmHistoryState => {
    const currentActualState = currentHistory.current;
    logDebug('StockAnalysisContext', 'FSM_Reducer_Event', `Global FSM Event: ${event.type}, Current State: ${currentActualState}`);
    if ('payload' in event && event.type !== 'ADD_CHAT_MESSAGE') {
        logDebug('StockAnalysisContext', 'FSM_Reducer_Payload', `Payload for ${event.type}:`, event.payload ? JSON.stringify(event.payload).substring(0, 200) : 'No Payload Content');
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
          logDebug('StockAnalysisContext', 'FSM_Transition', `IDLE -> START_FULL_ANALYSIS for ${event.payload.ticker}. Transitioning to INITIALIZING_ANALYSIS.`);
          nextCurrentState = FsmState.INITIALIZING_ANALYSIS;
        } else if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') {
          activeAnalysisTickerRef.current = event.payload.ticker;
          logDebug('StockAnalysisContext','FSM_Transition', `IDLE -> TRIGGER_MANUAL_KEY_TAKEAWAYS for ${event.payload.ticker}. Setting placeholders. Transitioning to GENERATING_KEY_TAKEAWAYS.`);
          contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
          contextSetters.setAiKeyTakeawaysJson(pendingJson);
          nextCurrentState = FsmState.GENERATING_KEY_TAKEAWAYS;
        } else if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') {
          activeAnalysisTickerRef.current = event.payload.ticker;
          logDebug('StockAnalysisContext','FSM_Transition', `IDLE -> TRIGGER_MANUAL_OPTIONS_ANALYSIS for ${event.payload.ticker}. Setting placeholders. Transitioning to ANALYZING_OPTIONS.`);
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
            logDebug('StockAnalysisContext', 'FSM_Transition', `INITIALIZING_ANALYSIS -> INITIALIZATION_COMPLETE. Transitioning to AWAITING_DATA_FETCH_TRIGGER.`);
            nextCurrentState = FsmState.AWAITING_DATA_FETCH_TRIGGER;
        }
        break;

      case FsmState.AWAITING_DATA_FETCH_TRIGGER:
        if (event.type === 'TRIGGER_DATA_FETCH') {
          logDebug('StockAnalysisContext', 'FSM_Transition', `AWAITING_DATA_FETCH_TRIGGER -> TRIGGER_DATA_FETCH. Transitioning to FETCHING_DATA.`);
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
          logDebug('StockAnalysisContext', 'FSM_Transition', `FETCHING_DATA -> FETCH_DATA_SUCCESS. Transitioning to DATA_FETCH_SUCCEEDED.`);
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
          logDebug('StockAnalysisContext', 'FSM_Transition', `FETCHING_DATA -> FETCH_DATA_FAILURE. Error: ${errorMsg}. Transitioning to DATA_FETCH_FAILED.`);
          nextCurrentState = FsmState.DATA_FETCH_FAILED;
        } else if (event.type === 'STALE_DATA_FROM_ACTION') {
          const { error, message, expectedTicker, foundTickerInSnapshot } = event.payload;
          logDebug('StockAnalysisContext', 'FSM_Transition', `FETCHING_DATA -> STALE_DATA_FROM_ACTION. Expected: ${expectedTicker}, Found: ${foundTickerInSnapshot}. Error: ${error}. Msg: ${message}. Transitioning to STALE_DATA_FROM_ACTION_ERROR.`);
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
            logDebug('StockAnalysisContext', 'FSM_Transition', `DATA_FETCH_SUCCEEDED -> INITIATE_AI_TA_SEQUENCE. Setting AI TA placeholders. Transitioning to AWAITING_AI_TA_TRIGGER.`);
            contextSetters.setAiAnalyzedTaRequestJson(pendingJson);
            contextSetters.setAiAnalyzedTaJson(pendingJson);
            nextCurrentState = FsmState.AWAITING_AI_TA_TRIGGER;
        }
        break;
      case FsmState.DATA_FETCH_FAILED:
      case FsmState.STALE_DATA_FROM_ACTION_ERROR:
        if (event.type === 'PROCEED_TO_IDLE') {
            logDebug('StockAnalysisContext', 'FSM_Transition', `${currentActualState} -> PROCEED_TO_IDLE. Resetting isFullAnalysisTriggered. Transitioning to IDLE.`);
            _setIsFullAnalysisTriggeredInternalState(false);
            activeAnalysisTickerRef.current = null;
            nextCurrentState = FsmState.IDLE;
        }
        break;

      case FsmState.AWAITING_AI_TA_TRIGGER:
        if (event.type === 'TRIGGER_AI_TA') {
          logDebug('StockAnalysisContext', 'FSM_Transition', `AWAITING_AI_TA_TRIGGER -> TRIGGER_AI_TA. Transitioning to ANALYZING_TA.`);
          nextCurrentState = FsmState.ANALYZING_TA;
        } else if (event.type === 'AI_TA_FAILURE') { 
            const errorPayload = event.payload; const errorMsg = errorPayload.message || 'AI TA failed (consistency check in AWAITING)';
            const taErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
            contextSetters.setAiAnalyzedTaRequestJson(errorPayload.aiAnalyzedTaRequestJson || taErrorJson); contextSetters.setAiAnalyzedTaJson(taErrorJson);
            const skippedJson = createSkippedJson("ai_ta_consistency", errorMsg);
            contextSetters.setAiKeyTakeawaysRequestJson(skippedJson); contextSetters.setAiKeyTakeawaysJson(skippedJson);
            contextSetters.setAiOptionsAnalysisRequestJson(skippedJson); contextSetters.setAiOptionsAnalysisJson(skippedJson);
            logDebug('StockAnalysisContext', 'FSM_Transition', `AWAITING_AI_TA_TRIGGER -> AI_TA_FAILURE (from AWAITING). Error: ${errorMsg}. Transitioning to AI_TA_FAILED.`);
            nextCurrentState = FsmState.AI_TA_FAILED;
        }
        break;

      case FsmState.ANALYZING_TA:
        if (event.type === 'AI_TA_SUCCESS') {
          contextSetters.setAiAnalyzedTaRequestJson(event.payload.aiAnalyzedTaRequestJson);
          contextSetters.setAiAnalyzedTaJson(event.payload.aiAnalyzedTaJson);
          logDebug('StockAnalysisContext', 'FSM_Transition', `ANALYZING_TA -> AI_TA_SUCCESS. Transitioning to AI_TA_SUCCEEDED.`);
          nextCurrentState = FsmState.AI_TA_SUCCEEDED;
        } else if (event.type === 'AI_TA_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'AI TA analysis failed';
          const taErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiAnalyzedTaRequestJson(errorPayload.aiAnalyzedTaRequestJson || taErrorJson); contextSetters.setAiAnalyzedTaJson(taErrorJson);
          const skippedJson = createSkippedJson("ai_ta", errorMsg);
          contextSetters.setAiKeyTakeawaysRequestJson(skippedJson); contextSetters.setAiKeyTakeawaysJson(skippedJson);
          contextSetters.setAiOptionsAnalysisRequestJson(skippedJson); contextSetters.setAiOptionsAnalysisJson(skippedJson);
          logDebug('StockAnalysisContext', 'FSM_Transition', `ANALYZING_TA -> AI_TA_FAILURE. Error: ${errorMsg}. Transitioning to AI_TA_FAILED.`);
          nextCurrentState = FsmState.AI_TA_FAILED;
        }
        break;

      case FsmState.AI_TA_SUCCEEDED:
      case FsmState.AI_TA_FAILED:
        logDebug('StockAnalysisContext', 'FSM_StateLog', `State is ${currentActualState}. Current event: ${event.type}. isFullAnalysisTriggered: ${_isFullAnalysisTriggeredInternalState}`);
        if (event.type === 'FINALIZE_AUTOMATED_PIPELINE') {
            logDebug('StockAnalysisContext', 'FSM_Transition', `${currentActualState} -> FINALIZE_AUTOMATED_PIPELINE. Transitioning to FULL_ANALYSIS_COMPLETE.`);
            nextCurrentState = FsmState.FULL_ANALYSIS_COMPLETE;
        }
        break; 

      case FsmState.GENERATING_KEY_TAKEAWAYS:
        if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') { // Re-triggering while already generating
            logDebug('StockAnalysisContext', 'FSM_Reducer_Action', `GENERATING_KEY_TAKEAWAYS -> Retriggering TRIGGER_MANUAL_KEY_TAKEAWAYS for ${event.payload.ticker}. Remains in GENERATING_KEY_TAKEAWAYS.`);
            contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
            contextSetters.setAiKeyTakeawaysJson(pendingJson);
            activeAnalysisTickerRef.current = event.payload.ticker; 
            return { ...currentHistory, previous: currentActualState }; 
        }
        if (event.type === 'KEY_TAKEAWAYS_SUCCESS') {
          contextSetters.setAiKeyTakeawaysRequestJson(event.payload.aiKeyTakeawaysRequestJson);
          contextSetters.setAiKeyTakeawaysJson(event.payload.aiKeyTakeawaysJson);
          logDebug('StockAnalysisContext', 'FSM_Transition', `GENERATING_KEY_TAKEAWAYS -> KEY_TAKEAWAYS_SUCCESS (manual). Transitioning to FULL_ANALYSIS_COMPLETE.`);
          nextCurrentState = FsmState.FULL_ANALYSIS_COMPLETE;
        } else if (event.type === 'KEY_TAKEAWAYS_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Key Takeaways generation failed';
          const ktErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiKeyTakeawaysRequestJson(errorPayload.aiKeyTakeawaysRequestJson || ktErrorJson);
          contextSetters.setAiKeyTakeawaysJson(ktErrorJson);
          logDebug('StockAnalysisContext', 'FSM_Transition', `GENERATING_KEY_TAKEAWAYS -> KEY_TAKEAWAYS_FAILURE (manual). Error: ${errorMsg}. Transitioning to FULL_ANALYSIS_COMPLETE.`);
          nextCurrentState = FsmState.FULL_ANALYSIS_COMPLETE;
        }
        break;

      case FsmState.ANALYZING_OPTIONS:
         if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') { // Re-triggering
            logDebug('StockAnalysisContext', 'FSM_Reducer_Action', `ANALYZING_OPTIONS -> Retriggering TRIGGER_MANUAL_OPTIONS_ANALYSIS for ${event.payload.ticker}. Remains in ANALYZING_OPTIONS.`);
            contextSetters.setAiOptionsAnalysisRequestJson(pendingJson);
            contextSetters.setAiOptionsAnalysisJson(pendingJson);
            activeAnalysisTickerRef.current = event.payload.ticker;
            return { ...currentHistory, previous: currentActualState };
        }
        if (event.type === 'OPTIONS_ANALYSIS_SUCCESS') {
          contextSetters.setAiOptionsAnalysisRequestJson(event.payload.aiOptionsAnalysisRequestJson);
          contextSetters.setAiOptionsAnalysisJson(event.payload.aiOptionsAnalysisJson);
          logDebug('StockAnalysisContext', 'FSM_Transition', `ANALYZING_OPTIONS -> OPTIONS_ANALYSIS_SUCCESS (manual). Transitioning to FULL_ANALYSIS_COMPLETE.`);
          nextCurrentState = FsmState.FULL_ANALYSIS_COMPLETE;
        } else if (event.type === 'OPTIONS_ANALYSIS_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Options Analysis failed';
          const optErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiOptionsAnalysisRequestJson(errorPayload.aiOptionsAnalysisRequestJson || optErrorJson);
          contextSetters.setAiOptionsAnalysisJson(optErrorJson);
          logDebug('StockAnalysisContext', 'FSM_Transition', `ANALYZING_OPTIONS -> OPTIONS_ANALYSIS_FAILURE (manual). Error: ${errorMsg}. Transitioning to FULL_ANALYSIS_COMPLETE.`);
          nextCurrentState = FsmState.FULL_ANALYSIS_COMPLETE;
        }
        break;

      case FsmState.FULL_ANALYSIS_COMPLETE:
        if (event.type === 'PROCEED_TO_IDLE') {
            logDebug('StockAnalysisContext', 'FSM_Transition', `${currentActualState} -> PROCEED_TO_IDLE. isFullAnalysisTriggered: ${_isFullAnalysisTriggeredInternalState}. Active Ticker: ${activeAnalysisTickerRef.current}. Transitioning to IDLE.`);
            _setIsFullAnalysisTriggeredInternalState(false);
            nextCurrentState = FsmState.IDLE;
        } else if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') {
          activeAnalysisTickerRef.current = event.payload.ticker;
          logDebug('StockAnalysisContext','FSM_Transition', `FULL_ANALYSIS_COMPLETE -> TRIGGER_MANUAL_KEY_TAKEAWAYS for ${event.payload.ticker}. Setting placeholders. Transitioning to GENERATING_KEY_TAKEAWAYS.`);
          contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
          contextSetters.setAiKeyTakeawaysJson(pendingJson);
          nextCurrentState = FsmState.GENERATING_KEY_TAKEAWAYS;
        } else if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') {
          activeAnalysisTickerRef.current = event.payload.ticker;
          logDebug('StockAnalysisContext','FSM_Transition', `FULL_ANALYSIS_COMPLETE -> TRIGGER_MANUAL_OPTIONS_ANALYSIS for ${event.payload.ticker}. Setting placeholders. Transitioning to ANALYZING_OPTIONS.`);
          contextSetters.setAiOptionsAnalysisRequestJson(pendingJson);
          contextSetters.setAiOptionsAnalysisJson(pendingJson);
          nextCurrentState = FsmState.ANALYZING_OPTIONS;
        } else if (event.type === 'ADD_CHAT_MESSAGE' && 'payload' in event) {
          const uniqueMessageSuffix = Math.random().toString(36).substring(2, 9);
          addChatMessage({...event.payload, id: `${event.payload.id}_${uniqueMessageSuffix}` });
        }
        break;
      default:
        logDebug('StockAnalysisContext', 'FSM_UnhandledEvent', `Unhandled event ${event.type} in state ${currentActualState}`);
        break;
    }
    return { current: nextCurrentState, previous: currentActualState };
  };

  const [fsmHistory, _dispatchFsmEventActual] = useReducer(fsmReducer, initialFsmHistory);
  const fsmHistoryRef = useRef<FsmHistoryState>(fsmHistory);

  useEffect(() => {
    fsmHistoryRef.current = fsmHistory;
    logDebug('StockAnalysisContext', 'FSM_StateUpdate', `Global FSM actual state updated. Prev: ${fsmHistory.previous}, Curr: ${fsmHistory.current}.`);
  }, [fsmHistory, logDebug]);

  const dispatchFsmEvent = useCallback((event: FsmEvent) => {
    const currentActualState = fsmHistoryRef.current.current;
    let determinedTarget: FsmState | null = null;
    logDebug('StockAnalysisContext', 'FSM_Dispatch', `Dispatching event: ${event.type}. Current actual state: ${currentActualState}`);
     if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') {
        logDebug('StockAnalysisContext', 'FSM_Dispatch_ManualKT', `Received TRIGGER_MANUAL_KEY_TAKEAWAYS for ticker: ${event.payload.ticker}`);
    } else if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') {
        logDebug('StockAnalysisContext', 'FSM_Dispatch_ManualOptions', `Received TRIGGER_MANUAL_OPTIONS_ANALYSIS for ticker: ${event.payload.ticker}`);
    }


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
            else if (event.type === 'TRIGGER_MANUAL_KEY_TAKEAWAYS') determinedTarget = FsmState.GENERATING_KEY_TAKEAWAYS; 
            break;
        case FsmState.ANALYZING_OPTIONS:
            if (event.type === 'OPTIONS_ANALYSIS_SUCCESS' || event.type === 'OPTIONS_ANALYSIS_FAILURE') determinedTarget = FsmState.FULL_ANALYSIS_COMPLETE;
            else if (event.type === 'TRIGGER_MANUAL_OPTIONS_ANALYSIS') determinedTarget = FsmState.ANALYZING_OPTIONS; 
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
        logDebug('StockAnalysisContext', 'FSM_TargetSet', `Event ${event.type} from ${currentActualState} targeting ${determinedTarget}.`);
        _setTargetFsmDisplayState(determinedTarget);
    }
    _dispatchFsmEventActual(event);
  }, [_dispatchFsmEventActual, _setTargetFsmDisplayState, logDebug]);

  useEffect(() => {
    if (_targetFsmDisplayState !== null && fsmHistory.current === _targetFsmDisplayState) {
      logDebug('StockAnalysisContext', 'FSM_TargetReached', `Global FSM current state ${_targetFsmDisplayState} matches target. Clearing target display state.`);
      _setTargetFsmDisplayState(null);
    }
  }, [fsmHistory.current, _targetFsmDisplayState, logDebug]);


  useEffect(() => {
      logDebug('StockAnalysisContext', 'Effect_ConsoleInterception', `Running. _isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}`);

    if (typeof window === 'undefined') {
      logDebug('StockAnalysisContext', 'Effect_ConsoleInterception_SSR', 'Skipping on server.');
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
      logDebug('StockAnalysisContext', 'Effect_ConsoleInterception_Status', 'APPLYING interceptors.');
      console.log = (...args) => interceptAndProcessLog('log', ...args);
      console.warn = (...args) => interceptAndProcessLog('warn', ...args);
      console.error = (...args) => interceptAndProcessLog('error', ...args);
      console.info = (...args) => interceptAndProcessLog('info', ...args);
      console.debug = (...args) => interceptAndProcessLog('debug', ...args);
    } else {
      logDebug('StockAnalysisContext', 'Effect_ConsoleInterception_Status', '_isClientDebugConsoleEnabled is FALSE. Attempting to RESTORE original console methods.');
      if ((console as any).__stockSageContextOriginals) {
        Object.assign(console, (console as any).__stockSageContextOriginals);
        logDebug('StockAnalysisContext', 'Effect_ConsoleInterception_Status', 'Console interception for UI buffer is NOW INACTIVE, context originals restored.');
      } else {
         contextOriginals.warn('[CONTEXT_EFFECT_INTERCEPTION] No context originals found to restore! This is unexpected.');
      }
    }

    return () => {
      logDebug('StockAnalysisContext', 'Effect_ConsoleInterception_Cleanup', 'CLEANUP: Restoring originals.');
      if ((console as any).__stockSageContextOriginals) {
        Object.assign(console, (console as any).__stockSageContextOriginals);
      } else {
        contextOriginals.warn('[CONTEXT_EFFECT_INTERCEPTION] Cleanup: No context originals found to restore!');
      }
    };
  }, [_isClientDebugConsoleEnabled, _logSourceConfig, contextOriginals, logDebug]);


  const setClientDebugConsoleOpen = useCallback((open: boolean) => {
    logDebug('StockAnalysisContext', 'DebugConsoleUIToggle', `ClientDebugConsoleOpen will be set to: ${open}. Current isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}`);
    if (_isClientDebugConsoleEnabled || !open) {
        _setClientDebugConsoleOpen(open);
    } else if (!_isClientDebugConsoleEnabled && open) {
        logDebug('StockAnalysisContext', 'DebugConsoleUIToggle', 'Attempted to open console while it is disabled. Opening action will be ignored.');
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
    const currentGlobalFsmStatePrev = fsmHistoryRef.current.previous; 
    logDebug('StockAnalysisContext', 'FSM_Orchestrator', `Global FSM Orchestrator. State: ${currentGlobalFsmState}, Prev: ${currentGlobalFsmStatePrev}, ActiveTicker: ${activeAnalysisTickerRef.current}, FullAnalysisTriggered: ${_isFullAnalysisTriggeredInternalState}`);

    if (currentGlobalFsmState === FsmState.INITIALIZING_ANALYSIS) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', 'State is INITIALIZING_ANALYSIS. Dispatching INITIALIZATION_COMPLETE.');
        _dispatchFsmEventActual({ type: 'INITIALIZATION_COMPLETE' });
    } else if (currentGlobalFsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', 'State is AWAITING_DATA_FETCH_TRIGGER. Dispatching TRIGGER_DATA_FETCH.');
        _dispatchFsmEventActual({ type: 'TRIGGER_DATA_FETCH' });
    } else if (currentGlobalFsmState === FsmState.FETCHING_DATA && activeAnalysisTickerRef.current) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is FETCHING_DATA for ${activeAnalysisTickerRef.current}. Calling fetchStockDataFormAction.`);
        startTransition(() => {
            fetchStockDataFormAction({ ticker: activeAnalysisTickerRef.current! });
        });
    } else if (currentGlobalFsmState === FsmState.DATA_FETCH_SUCCEEDED && _isFullAnalysisTriggeredInternalState) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is DATA_FETCH_SUCCEEDED and full analysis is triggered. Dispatching INITIATE_AI_TA_SEQUENCE.`);
        _dispatchFsmEventActual({ type: 'INITIATE_AI_TA_SEQUENCE' });
    } else if (currentGlobalFsmState === FsmState.AWAITING_AI_TA_TRIGGER && _isFullAnalysisTriggeredInternalState) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is AWAITING_AI_TA_TRIGGER and full analysis is triggered. Dispatching TRIGGER_AI_TA.`);
         _dispatchFsmEventActual({ type: 'TRIGGER_AI_TA' });
    } else if (currentGlobalFsmState === FsmState.ANALYZING_TA && activeAnalysisTickerRef.current && _isFullAnalysisTriggeredInternalState) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is ANALYZING_TA for ${activeAnalysisTickerRef.current} (full analysis). Calling analyzeTaFormAction.`);
        if (_stockSnapshotJson && _stockSnapshotJson !== pendingJson && !_stockSnapshotJson.includes("error")) {
            startTransition(() => {
                analyzeTaFormAction({ stockSnapshotJson: _stockSnapshotJson, ticker: activeAnalysisTickerRef.current! });
            });
        } else {
            logDebug('StockAnalysisContext', 'FSM_Orchestrator_Error', `Skipping AI TA for ${activeAnalysisTickerRef.current} due to missing or error in stockSnapshotJson.`);
            _dispatchFsmEventActual({ type: 'AI_TA_FAILURE', payload: { message: 'Snapshot data missing for AI TA', error: 'Snapshot data unavailable' } });
        }
    } else if ((currentGlobalFsmState === FsmState.AI_TA_SUCCEEDED || currentGlobalFsmState === FsmState.AI_TA_FAILED) && _isFullAnalysisTriggeredInternalState) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is ${currentGlobalFsmState} (full analysis). Dispatching FINALIZE_AUTOMATED_PIPELINE.`);
        _dispatchFsmEventActual({ type: 'FINALIZE_AUTOMATED_PIPELINE' });
    } else if (currentGlobalFsmState === FsmState.GENERATING_KEY_TAKEAWAYS && activeAnalysisTickerRef.current) {
        if (currentGlobalFsmStatePrev === FsmState.IDLE || currentGlobalFsmStatePrev === FsmState.FULL_ANALYSIS_COMPLETE || currentGlobalFsmStatePrev === FsmState.KEY_TAKEAWAYS_FAILED || currentGlobalFsmStatePrev === FsmState.KEY_TAKEAWAYS_SUCCEEDED) {
            logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is GENERATING_KEY_TAKEAWAYS for ${activeAnalysisTickerRef.current}. Prereq JSONs: Snapshot(${_stockSnapshotJson.substring(0,30)}), StdTA(${_standardTasJson.substring(0,30)}), AiTA(${_aiAnalyzedTaJson.substring(0,30)}), MktStatus(${_marketStatusJson.substring(0,30)})`);
            if (_stockSnapshotJson && _standardTasJson && _aiAnalyzedTaJson && _marketStatusJson &&
                !_stockSnapshotJson.includes("error") && !_standardTasJson.includes("error") && !_aiAnalyzedTaJson.includes("error") && !_marketStatusJson.includes("error")) {
                logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `Calling performAiAnalysisFormAction for Key Takeaways.`);
                startTransition(() => {
                    performAiAnalysisFormAction({ ticker: activeAnalysisTickerRef.current!, stockSnapshotJson: _stockSnapshotJson, standardTasJson: _standardTasJson, aiAnalyzedTaJson: _aiAnalyzedTaJson, marketStatusJson: _marketStatusJson });
                });
            } else {
                logDebug('StockAnalysisContext', 'FSM_Orchestrator_Error', `Skipping Key Takeaways for ${activeAnalysisTickerRef.current} due to missing or error in prerequisite data.`);
                _dispatchFsmEventActual({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { message: 'Prerequisite data missing for Key Takeaways', error: 'Data unavailable' } });
            }
        } else {
            logDebug('StockAnalysisContext', 'FSM_Orchestrator_Info', 'State is GENERATING_KEY_TAKEAWAYS, but not just entered. Action likely already pending.');
        }
    } else if (currentGlobalFsmState === FsmState.ANALYZING_OPTIONS && activeAnalysisTickerRef.current) {
         if (currentGlobalFsmStatePrev === FsmState.IDLE || currentGlobalFsmStatePrev === FsmState.FULL_ANALYSIS_COMPLETE || currentGlobalFsmStatePrev === FsmState.OPTIONS_ANALYSIS_FAILED || currentGlobalFsmStatePrev === FsmState.OPTIONS_ANALYSIS_SUCCEEDED) {
            logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is ANALYZING_OPTIONS for ${activeAnalysisTickerRef.current}. Prereq JSONs: OptionsChain(${_optionsChainJson.substring(0,30)}), Snapshot(${_stockSnapshotJson.substring(0,30)})`);
            if (_optionsChainJson && _stockSnapshotJson && !_optionsChainJson.includes("error") && !_stockSnapshotJson.includes("error")) {
                logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `Calling performAiOptionsAnalysisFormAction for Options Analysis.`);
                startTransition(() => {
                    performAiOptionsAnalysisFormAction({ ticker: activeAnalysisTickerRef.current!, optionsChainJson: _optionsChainJson, stockSnapshotJson: _stockSnapshotJson });
                });
            } else {
                logDebug('StockAnalysisContext', 'FSM_Orchestrator_Error', `Skipping Options Analysis for ${activeAnalysisTickerRef.current} due to missing or error in prerequisite data.`);
                _dispatchFsmEventActual({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { message: 'Prerequisite data missing for Options Analysis', error: 'Data unavailable' } });
            }
        } else {
            logDebug('StockAnalysisContext', 'FSM_Orchestrator_Info', 'State is ANALYZING_OPTIONS, but not just entered. Action likely already pending.');
        }
    } else if ((currentGlobalFsmState === FsmState.DATA_FETCH_FAILED || currentGlobalFsmState === FsmState.STALE_DATA_FROM_ACTION_ERROR || currentGlobalFsmState === FsmState.FULL_ANALYSIS_COMPLETE)) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is ${currentGlobalFsmState}. Dispatching PROCEED_TO_IDLE.`);
        _dispatchFsmEventActual({ type: 'PROCEED_TO_IDLE' });
    }


  }, [fsmHistory.current, _dispatchFsmEventActual, logDebug, _isFullAnalysisTriggeredInternalState, _stockSnapshotJson, _standardTasJson, _aiAnalyzedTaJson, _marketStatusJson, _optionsChainJson, fetchStockDataFormAction, analyzeTaFormAction, performAiAnalysisFormAction, performAiOptionsAnalysisFormAction ]);


  // Effect for fetchStockDataAction results
  useEffect(() => {
    logDebug('StockAnalysisContext', 'ActionStateEffect_FetchData', `fetchDataActionState changed. Status: ${fetchDataActionState.status}. Current FSM state: ${fsmHistoryRef.current.current}`);
    if (fsmHistoryRef.current.current !== FsmState.FETCHING_DATA) return; 

    if (fetchDataActionState.status === 'success' && fetchDataActionState.data) {
        logDebug('StockAnalysisContext', 'ActionState_Result_FetchData', 'SUCCESS', fetchDataActionState.data);
        dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: fetchDataActionState.data });
    } else if (fetchDataActionState.status === 'error') {
        logDebug('StockAnalysisContext', 'ActionState_Result_FetchData', 'ERROR', fetchDataActionState);
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
    logDebug('StockAnalysisContext', 'ActionStateEffect_AnalyzeTa', `analyzeTaActionState changed. Status: ${analyzeTaActionState.status}. Current FSM state: ${fsmHistoryRef.current.current}`);
    if (fsmHistoryRef.current.current !== FsmState.ANALYZING_TA) return;

    if (analyzeTaActionState.status === 'success' && analyzeTaActionState.data) {
        logDebug('StockAnalysisContext', 'ActionState_Result_AnalyzeTa', 'SUCCESS', analyzeTaActionState.data);
        dispatchFsmEvent({ type: 'AI_TA_SUCCESS', payload: analyzeTaActionState.data });
    } else if (analyzeTaActionState.status === 'error') {
        logDebug('StockAnalysisContext', 'ActionState_Result_AnalyzeTa', 'ERROR', analyzeTaActionState);
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
    logDebug('StockAnalysisContext', 'ActionStateEffect_PerformAiAnalysis', `performAiAnalysisActionState changed. Status: ${performAiAnalysisActionState.status}. Current FSM state: ${fsmHistoryRef.current.current}`);
    if (fsmHistoryRef.current.current !== FsmState.GENERATING_KEY_TAKEAWAYS) return;

    if (performAiAnalysisActionState.status === 'success' && performAiAnalysisActionState.data) {
        logDebug('StockAnalysisContext', 'ActionState_Result_PerformAiAnalysis', 'SUCCESS', performAiAnalysisActionState.data);
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: performAiAnalysisActionState.data });
    } else if (performAiAnalysisActionState.status === 'error') {
        logDebug('StockAnalysisContext', 'ActionState_Result_PerformAiAnalysis', 'ERROR', performAiAnalysisActionState);
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
    logDebug('StockAnalysisContext', 'ActionStateEffect_PerformAiOptions', `performAiOptionsAnalysisActionState changed. Status: ${performAiOptionsAnalysisActionState.status}. Current FSM state: ${fsmHistoryRef.current.current}`);
    if (fsmHistoryRef.current.current !== FsmState.ANALYZING_OPTIONS) return;

    if (performAiOptionsAnalysisActionState.status === 'success' && performAiOptionsAnalysisActionState.data) {
        logDebug('StockAnalysisContext', 'ActionState_Result_PerformAiOptions', 'SUCCESS', performAiOptionsAnalysisActionState.data);
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: performAiOptionsAnalysisActionState.data });
    } else if (performAiOptionsAnalysisActionState.status === 'error') {
        logDebug('StockAnalysisContext', 'ActionState_Result_PerformAiOptions', 'ERROR', performAiOptionsAnalysisActionState);
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
    mainTabFsmDisplay: _mainTabFsmDisplay, setMainTabFsmDisplay,
    chatbotFsmDisplay: _chatbotFsmDisplay, setChatbotFsmDisplay,
    debugConsoleMenuFsmDisplay: _debugConsoleMenuFsmDisplay, setDebugConsoleMenuFsmDisplay,
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
    _isFullAnalysisTriggeredInternalState,
    chatHistory, addChatMessage, clearChatHistory,
    _isClientDebugConsoleEnabled, _isClientDebugConsoleOpen,
    _logSourceConfig, setClientDebugConsoleEnabled, setClientDebugConsoleOpen,
    setLogSourceEnabled, enableAllLogSources, disableAllLogSources,
    logDebug, fsmHistory, _targetFsmDisplayState, dispatchFsmEvent,
    _isFsmDebugCardEnabled, setFsmDebugCardEnabled,
    _isFsmDebugCardOpen, _setIsFsmDebugCardOpen,
    _mainTabFsmDisplay, setMainTabFsmDisplay,
    _chatbotFsmDisplay, setChatbotFsmDisplay,
    _debugConsoleMenuFsmDisplay, setDebugConsoleMenuFsmDisplay
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
