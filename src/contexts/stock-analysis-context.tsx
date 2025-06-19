
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useReducer, useRef, startTransition, useMemo } from 'react';
import type { LogSourceId, LogSourceConfig, LogType } from '@/lib/debug-log-types'; // Keep existing imports from debug-log-types
import { logSourceIds, defaultLogSourceConfig, logTypes as allLogTypes } from '@/lib/debug-log-types'; // For enabling/disabling all
import { addEntryToGlobalLogBuffer, clearGlobalLogBuffer } from '@/lib/global-log-buffer';
import { fetchStockDataAction, type AnalyzeStockServerActionState, type StockDataFetchResult } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction, type AnalyzeTaActionState, type AnalyzeTaResult } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction, type PerformAiAnalysisActionState, type PerformAiAnalysisResult } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction, type PerformAiOptionsAnalysisActionState, type PerformAiOptionsAnalysisResult } from '@/actions/perform-ai-options-analysis-action';
import { useActionState } from 'react';


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

  ERROR_STALE_DATA = 'ERROR_STALE_DATA', 
  // CHAT_MESSAGE_PENDING = 'CHAT_MESSAGE_PENDING' // Placeholder
}

export interface GlobalFsmContextVariables {
  activeTicker: string | null; 
  userInputTicker: string; 
  isInitialLoad: boolean; 
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
  actionStateData?: any;
}
interface AiTaSuccessPayload extends AnalyzeTaResult {}
interface AiTaFailurePayload {
  error?: string | null;
  message?: string | null;
  aiAnalyzedTaRequestJson?: string;
}
interface AiKeyTakeawaysSuccessPayload extends PerformAiAnalysisResult {} 
interface AiKeyTakeawaysFailurePayload { error?: string | null; message?: string | null; aiKeyTakeawaysRequestJson?: string; } 
interface AiOptionsAnalysisSuccessPayload extends PerformAiOptionsAnalysisResult {} 
interface AiOptionsAnalysisFailurePayload { error?: string | null; message?: string | null; aiOptionsAnalysisRequestJson?: string; } 


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
  fsmState: GlobalFsmState; // Expose only the 'current' state directly for simple access
  previousFsmState: GlobalFsmState | null; // Expose previous for UI display
  fsmVariables: GlobalFsmContextVariables; // Expose all variables
  fsmFlags: GlobalFsmFlags; // Expose all flags

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

  setReducedStartupLoggingEnabled: (enabled: boolean) => void;
}

const initialJsonPlaceholder = '{ "status": "no_analysis_run_yet" }';
const pendingJson = '{ "status": "pending..." }';

const initialGlobalFsmReducerState: GlobalFsmReducerManagedState = {
  current: GlobalFsmState.APP_INITIALIZING,
  previous: null,
  variables: {
    activeTicker: null,
    userInputTicker: "NVDA", 
    isInitialLoad: true,
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
  
  mainTabFsmDisplay: null, // MainTabContent no longer manages its own FSM display state to report
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
  const [_debugConsoleMenuFsmDisplay, _setDebugConsoleMenuFsmDisplay] = useState<FsmDisplayTuple | null>(defaultState.debugConsoleMenuFsmDisplay);

  const [_isInitialAppStartupComplete, _setIsInitialAppStartupComplete] = useState<boolean>(defaultState.isInitialAppStartupComplete);
  const [_isReducedStartupLoggingEnabled, _setIsReducedStartupLoggingEnabled] = useState<boolean>(defaultState.isReducedStartupLoggingEnabled);
  const initialStartupFlaggedRef = useRef(false);
  const initializationDispatchedRef = useRef(false); 


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
      // No longer logging this update as MainTabContent's local FSM is removed for automated pipeline
      return display; 
    });
  }, [_setMainTabFsmDisplay]);

  const setChatbotFsmDisplay = useCallback((display: FsmDisplayTuple | null) => {
    _setChatbotFsmDisplay(prevDisplay => {
      const hasChanged = !(
        prevDisplay?.current === display?.current &&
        prevDisplay?.previous === display?.previous &&
        prevDisplay?.target === display?.target
      );
      if (hasChanged) {
        logDebug('StockAnalysisContext', 'FSMDisplayUpdate', 'ChatbotFsmDisplay updated.', display);
        return display;
      }
      return prevDisplay;
    });
  }, [_setChatbotFsmDisplay, logDebug]);

  const setDebugConsoleMenuFsmDisplay = useCallback((display: FsmDisplayTuple | null) => {
    _setDebugConsoleMenuFsmDisplay(prevDisplay => {
      const hasChanged = !(
        prevDisplay?.current === display?.current &&
        prevDisplay?.previous === display?.previous &&
        prevDisplay?.target === display?.target
      );
      if (hasChanged) {
        logDebug('StockAnalysisContext', 'FSMDisplayUpdate', 'DebugConsoleMenuFsmDisplay updated.', display);
        return display;
      }
      return prevDisplay;
    });
  }, [_setDebugConsoleMenuFsmDisplay, logDebug]);

  const setReducedStartupLoggingEnabled = useCallback((enabled: boolean) => {
    logDebug('StockAnalysisContext', 'StartupLogToggle', `ReducedStartupLoggingEnabled set to: ${enabled}.`);
    _setIsReducedStartupLoggingEnabled(enabled);
  }, [logDebug]);

  const fsmReducer = (
    state: GlobalFsmReducerManagedState,
    event: FsmEvent
  ): GlobalFsmReducerManagedState => {
    const previousState = state.current;
    logDebug('StockAnalysisContext', 'GlobalFSM_Event', `Event: ${event.type}, Current State: ${previousState}`);
    if ('payload' in event && event.type !== 'ADD_CHAT_MESSAGE') { 
        logDebug('StockAnalysisContext', 'GlobalFSM_Payload', `Payload for ${event.type}:`, JSON.stringify(event.payload).substring(0, 150));
    }

    let nextCurrentState: GlobalFsmState = previousState;
    let nextVariables: GlobalFsmContextVariables = { ...state.variables };
    let nextFlags: GlobalFsmFlags = { ...state.flags };

    const errorJsonWithDetails = (message: string, details: string | null | undefined) =>
        `{ "status": "error", "message": "${message.replace(/"/g, '\\"')}", "details": "${(details || '').replace(/"/g, '\\"')}" }`;

    switch (previousState) {
      case GlobalFsmState.IDLE:
      case GlobalFsmState.AWAITING_TICKER_INPUT: 
      case GlobalFsmState.VALID_TICKER_ENTERED: 
        if (event.type === 'START_FULL_ANALYSIS') {
          nextVariables.activeTicker = event.payload.ticker;
          nextVariables.userInputTicker = event.payload.ticker; 
          nextFlags.canAnalyzeStock = false;
          nextFlags.isMarketDataReady = false;
          nextFlags.isSnapshotDataReady = false;
          nextFlags.isStandardTADataReady = false;
          nextFlags.isOptionsChainDataReady = false;
          nextFlags.isCalculatedTADataReady = false;
          nextFlags.isKeyTakeawaysDataAvailable = false;
          nextFlags.isOptionsAnalysisDataAvailable = false;
          nextVariables.lastError = null;
          setAllPlaceholdersInternal(event.payload.ticker, true); 
          nextCurrentState = GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH; 
          logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `${previousState} -> START_FULL_ANALYSIS for ${event.payload.ticker}. To PIPELINE_REQUESTED_DATA_FETCH.`);
        }
        break;

      case GlobalFsmState.APP_INITIALIZING:
        if (event.type === 'INITIALIZATION_COMPLETE') {
          if (state.current !== GlobalFsmState.APP_INITIALIZING) {
            logDebug('StockAnalysisContext', 'GlobalFSM_Reducer_Warning', `Received INITIALIZATION_COMPLETE but current state is already ${state.current}. Ignoring.`);
            return { ...state, previous: previousState }; 
          }
          if (nextVariables.userInputTicker && nextVariables.userInputTicker.trim() !== "") {
              nextCurrentState = GlobalFsmState.VALID_TICKER_ENTERED;
              nextFlags.canAnalyzeStock = true; 
          } else {
              nextCurrentState = GlobalFsmState.AWAITING_TICKER_INPUT;
              nextFlags.canAnalyzeStock = false;
          }
          logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `APP_INITIALIZING -> INITIALIZATION_COMPLETE. To ${nextCurrentState}. canAnalyze: ${nextFlags.canAnalyzeStock}`);
        }
        break;
      
      case GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH: 
        if (event.type === 'TRIGGER_DATA_FETCH') { 
            nextCurrentState = GlobalFsmState.DATA_FETCH_IN_PROGRESS;
            // canAnalyzeStock remains false
            logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `PIPELINE_REQUESTED_DATA_FETCH -> TRIGGER_DATA_FETCH. To DATA_FETCH_IN_PROGRESS.`);
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
          logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `DATA_FETCH_IN_PROGRESS -> FETCH_DATA_SUCCESS. To DATA_FETCH_SUCCEEDED.`);
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
          logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `DATA_FETCH_IN_PROGRESS -> FETCH_DATA_FAILURE. Error: ${errorMsg}. To DATA_FETCH_FAILED.`);
        } else if (event.type === 'STALE_DATA_FROM_ACTION') {
          const { error, message, expectedTicker, foundTickerInSnapshot } = event.payload;
          const staleErrorJson = errorJsonWithDetails(message, `Expected ${expectedTicker}, got ${foundTickerInSnapshot || 'unknown'}.`);
          contextSetters.setMarketStatusJson(staleErrorJson); 
          contextSetters.setStockSnapshotJson(staleErrorJson);
          contextSetters.setStandardTasJson(staleErrorJson);
          contextSetters.setOptionsChainJson(staleErrorJson);
          if (event.payload.actionStateData?.polygonApiRequestLogJson) contextSetters.setPolygonApiRequestLogJson(event.payload.actionStateData.polygonApiRequestLogJson);
          if (event.payload.actionStateData?.polygonApiResponseLogJson) contextSetters.setPolygonApiResponseLogJson(event.payload.actionStateData.polygonApiResponseLogJson);
          nextFlags.isMarketDataReady = false; nextFlags.isSnapshotDataReady = false;
          nextFlags.isStandardTADataReady = false; nextFlags.isOptionsChainDataReady = false;
          nextVariables.lastError = { message, source: 'StaleData', details: error };
          nextCurrentState = GlobalFsmState.ERROR_STALE_DATA; 
          logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `DATA_FETCH_IN_PROGRESS -> STALE_DATA_FROM_ACTION. To ERROR_STALE_DATA.`);
        }
        break;

      case GlobalFsmState.DATA_FETCH_SUCCEEDED:
        if (event.type === 'INITIATE_AI_TA_SEQUENCE') {
          contextSetters.setAiAnalyzedTaRequestJson(pendingJson); 
          contextSetters.setAiAnalyzedTaJson(pendingJson);
          nextCurrentState = GlobalFsmState.CALCULATING_AI_TA;
          logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `DATA_FETCH_SUCCEEDED -> INITIATE_AI_TA_SEQUENCE. To CALCULATING_AI_TA.`);
        }
        break;
      
      case GlobalFsmState.CALCULATING_AI_TA:
        if (event.type === 'AI_TA_SUCCESS') {
          contextSetters.setAiAnalyzedTaRequestJson(event.payload.aiAnalyzedTaRequestJson);
          contextSetters.setAiAnalyzedTaJson(event.payload.aiAnalyzedTaJson);
          nextFlags.isCalculatedTADataReady = true;
          nextCurrentState = GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED;
          logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `CALCULATING_AI_TA -> AI_TA_SUCCESS. To AI_TA_CALCULATION_SUCCEEDED.`);
        } else if (event.type === 'AI_TA_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'AI TA analysis failed';
          const taErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiAnalyzedTaRequestJson(errorPayload.aiAnalyzedTaRequestJson || taErrorJson);
          contextSetters.setAiAnalyzedTaJson(taErrorJson);
          nextFlags.isCalculatedTADataReady = false;
          nextVariables.lastError = { message: errorMsg, source: 'AITaCalculation', details: errorPayload.error };
          nextCurrentState = GlobalFsmState.AI_TA_CALCULATION_FAILED;
          logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `CALCULATING_AI_TA -> AI_TA_FAILURE. Error: ${errorMsg}. To AI_TA_CALCULATION_FAILED.`);
        }
        break;

      case GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED:
        if (event.type === 'FINALIZE_AUTOMATED_PIPELINE') {
          nextCurrentState = GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE;
          nextVariables.isInitialLoad = false; 
          logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `AI_TA_CALCULATION_SUCCEEDED -> FINALIZE_AUTOMATED_PIPELINE. To PIPELINE_AUTOMATED_COMPLETE. Initial load set to false.`);
        }
        break;
      
      case GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE:
      case GlobalFsmState.DATA_FETCH_FAILED:
      case GlobalFsmState.AI_TA_CALCULATION_FAILED:
      case GlobalFsmState.ERROR_STALE_DATA:
        if (event.type === 'PROCEED_TO_IDLE') {
            nextVariables.lastError = null; 
            if (nextVariables.userInputTicker && nextVariables.userInputTicker.trim() !== "") {
                nextCurrentState = GlobalFsmState.VALID_TICKER_ENTERED;
                nextFlags.canAnalyzeStock = true;
            } else {
                nextCurrentState = GlobalFsmState.AWAITING_TICKER_INPUT; // Default to awaiting if no valid user input ticker
                nextFlags.canAnalyzeStock = false; // If no ticker, cannot analyze
            }
            logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `${previousState} -> PROCEED_TO_IDLE. To ${nextCurrentState}. canAnalyze: ${nextFlags.canAnalyzeStock}`);
        } else if (event.type === 'START_FULL_ANALYSIS') { 
            nextVariables.activeTicker = event.payload.ticker;
            nextVariables.userInputTicker = event.payload.ticker;
            nextFlags.canAnalyzeStock = false;
            nextFlags.isMarketDataReady = false; nextFlags.isSnapshotDataReady = false;
            nextFlags.isStandardTADataReady = false; nextFlags.isOptionsChainDataReady = false;
            nextFlags.isCalculatedTADataReady = false; nextFlags.isKeyTakeawaysDataAvailable = false;
            nextFlags.isOptionsAnalysisDataAvailable = false;
            nextVariables.lastError = null;
            setAllPlaceholdersInternal(event.payload.ticker, true);
            nextCurrentState = GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH;
            logDebug('StockAnalysisContext', 'GlobalFSM_Transition', `${previousState} -> START_FULL_ANALYSIS (re-analysis) for ${event.payload.ticker}. To PIPELINE_REQUESTED_DATA_FETCH.`);
        }
        break;

      default:
        logDebug('StockAnalysisContext', 'GlobalFSM_UnhandledEvent', `Unhandled event ${event.type} in state ${previousState}`);
        break;
    }

    return { current: nextCurrentState, previous: previousState, variables: nextVariables, flags: nextFlags };
  };

  const [globalFsmReducerState, _dispatchFsmEventActual] = useReducer(fsmReducer, defaultState.globalFsmState);
  const fsmStateRef = useRef<GlobalFsmReducerManagedState>(globalFsmReducerState); 

  useEffect(() => {
    fsmStateRef.current = globalFsmReducerState;
    logDebug('StockAnalysisContext', 'FSM_StateUpdate', `Global FSM actual state updated. Prev: ${globalFsmReducerState.previous}, Curr: ${globalFsmReducerState.current}.`);
  }, [globalFsmReducerState, logDebug]);

  const dispatchFsmEvent = useCallback((event: FsmEvent) => {
    const currentActualState = fsmStateRef.current.current;
    let determinedTarget: GlobalFsmState | null = null; 
    
    switch (currentActualState) {
        case GlobalFsmState.IDLE:
        case GlobalFsmState.AWAITING_TICKER_INPUT:
        case GlobalFsmState.VALID_TICKER_ENTERED:
            if (event.type === 'START_FULL_ANALYSIS') determinedTarget = GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH;
            break;
        case GlobalFsmState.APP_INITIALIZING:
            if (event.type === 'INITIALIZATION_COMPLETE') determinedTarget = GlobalFsmState.AWAITING_TICKER_INPUT; 
            break;
        case GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH:
            if (event.type === 'TRIGGER_DATA_FETCH') determinedTarget = GlobalFsmState.DATA_FETCH_IN_PROGRESS;
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
            break;
        case GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE:
        case GlobalFsmState.DATA_FETCH_FAILED:
        case GlobalFsmState.AI_TA_CALCULATION_FAILED:
        case GlobalFsmState.ERROR_STALE_DATA:
             if (event.type === 'PROCEED_TO_IDLE') determinedTarget = GlobalFsmState.IDLE; // Or VALID_TICKER_ENTERED
             else if (event.type === 'START_FULL_ANALYSIS') determinedTarget = GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH;
            break;
    }

    logDebug('StockAnalysisContext', 'FSM_Dispatch', `Dispatching event: ${event.type}. Current actual state: ${currentActualState}. Determined target: ${determinedTarget || 'N/A'}`);
    if (determinedTarget) {
        _setTargetFsmDisplayState(determinedTarget);
    }
    _dispatchFsmEventActual(event);
  }, [_dispatchFsmEventActual, _setTargetFsmDisplayState, logDebug]);

  useEffect(() => {
    if (_targetFsmDisplayState !== null && globalFsmReducerState.current === _targetFsmDisplayState) {
      logDebug('StockAnalysisContext', 'FSM_TargetReached', `Global FSM current state ${_targetFsmDisplayState} matches target. Clearing target display state.`);
      _setTargetFsmDisplayState(null);
    }
  }, [globalFsmReducerState.current, _targetFsmDisplayState, logDebug]);


  useEffect(() => {
    logDebug('StockAnalysisContext', 'Effect_ConsoleInterception', `Running. _isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}, _isInitialAppStartupComplete: ${_isInitialAppStartupComplete}, _isReducedStartupLoggingEnabled: ${_isReducedStartupLoggingEnabled}`);

    if (typeof window === 'undefined') {
      logDebug('StockAnalysisContext', 'Effect_ConsoleInterception_SSR', 'Skipping on server.');
      return;
    }

    const currentOriginalsForInterceptor = (console as any).__stockSageContextOriginals || browserConsole;

    const interceptAndProcessLog = (
      type: LogType,
      ...args: any[]
    ) => {
      currentOriginalsForInterceptor[type as Exclude<LogType, 'system'>](...args); 
      
      queueMicrotask(() => {
        if (!_isClientDebugConsoleEnabled) {
          return;
        }

        let sourceForBuffer: LogSourceId = 'NATIVE_CONSOLE';
        let messagesForBuffer = args;
        let typeForBuffer = type;

        if (args.length > 0 && args[0] === LOGDEBUG_MARKER) {
          sourceForBuffer = args[1] as LogSourceId;
          messagesForBuffer = args.slice(3); 
          typeForBuffer = 'debug'; 
          if (!_logSourceConfig[sourceForBuffer]) {
            return;
          }
        } else {
          if (!_logSourceConfig['NATIVE_CONSOLE']) {
            return;
          }
        }
        
        if (!_isInitialAppStartupComplete && _isReducedStartupLoggingEnabled) {
          const criticalSources: LogSourceId[] = ['StockAnalysisContext', 'DefinitionLoader'];
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
              `[CONTEXT_INTERCEPTOR_SUPPRESSED_STARTUP_LOG] Type: ${typeForBuffer}, Source: ${sourceForBuffer}, Msg: ${String(messagesForBuffer[0]).substring(0,50)}...`
            );
            return; 
          }
        }
        addEntryToGlobalLogBuffer({ type: typeForBuffer, messages: messagesForBuffer, source: sourceForBuffer });
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
    logDebug('StockAnalysisContext', 'FSM_Orchestrator', `Global FSM Orchestrator. State: ${currentGlobalFsmState}, ActiveTicker: ${currentVars.activeTicker}, InitialLoad: ${currentVars.isInitialLoad}`);

    if (currentGlobalFsmState === GlobalFsmState.APP_INITIALIZING && !initializationDispatchedRef.current) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', 'State is APP_INITIALIZING. Dispatching INITIALIZATION_COMPLETE.');
        _dispatchFsmEventActual({ type: 'INITIALIZATION_COMPLETE' }); 
        initializationDispatchedRef.current = true; 
    } else if (currentGlobalFsmState === GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH && currentVars.activeTicker) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is PIPELINE_REQUESTED_DATA_FETCH for ${currentVars.activeTicker}. Calling fetchStockDataFormAction.`);
        startTransition(() => {
            fetchStockDataFormAction({ ticker: currentVars.activeTicker! });
        });
         _dispatchFsmEventActual({ type: 'TRIGGER_DATA_FETCH' });
    } else if (currentGlobalFsmState === GlobalFsmState.DATA_FETCH_SUCCEEDED && currentVars.isInitialLoad) { 
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is DATA_FETCH_SUCCEEDED and initial load. Dispatching INITIATE_AI_TA_SEQUENCE.`);
        _dispatchFsmEventActual({ type: 'INITIATE_AI_TA_SEQUENCE' });
    } else if (currentGlobalFsmState === GlobalFsmState.CALCULATING_AI_TA && currentVars.activeTicker && currentVars.isInitialLoad) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is CALCULATING_AI_TA for ${currentVars.activeTicker} (initial load). Calling analyzeTaFormAction.`);
        if (_stockSnapshotJson && _stockSnapshotJson !== pendingJson && !_stockSnapshotJson.includes("error")) {
            startTransition(() => {
                analyzeTaFormAction({ stockSnapshotJson: _stockSnapshotJson, ticker: currentVars.activeTicker! });
            });
        } else {
            logDebug('StockAnalysisContext', 'FSM_Orchestrator_Error', `Skipping AI TA for ${currentVars.activeTicker} due to missing/error snapshotJson.`);
            _dispatchFsmEventActual({ type: 'AI_TA_FAILURE', payload: { message: 'Snapshot data missing for AI TA', error: 'Snapshot data unavailable' } });
        }
    } else if ((currentGlobalFsmState === GlobalFsmState.AI_TA_CALCULATION_SUCCEEDED || currentGlobalFsmState === GlobalFsmState.AI_TA_CALCULATION_FAILED) && currentVars.isInitialLoad) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is ${currentGlobalFsmState} (initial load). Dispatching FINALIZE_AUTOMATED_PIPELINE.`);
        _dispatchFsmEventActual({ type: 'FINALIZE_AUTOMATED_PIPELINE' });
    } else if (currentGlobalFsmState === GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE || currentGlobalFsmState === GlobalFsmState.DATA_FETCH_FAILED || currentGlobalFsmState === GlobalFsmState.AI_TA_CALCULATION_FAILED || currentGlobalFsmState === GlobalFsmState.ERROR_STALE_DATA) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_Action', `State is ${currentGlobalFsmState}. Dispatching PROCEED_TO_IDLE.`);
        _dispatchFsmEventActual({ type: 'PROCEED_TO_IDLE' });
    }
    
    if (
        currentGlobalFsmState === GlobalFsmState.IDLE && 
        currentVars.isInitialLoad === false && 
        !initialStartupFlaggedRef.current
    ) {
        logDebug('StockAnalysisContext', 'FSM_Orchestrator_StartupComplete', `Initial automated pipeline concluded (isInitialLoad is false, curr: IDLE). Setting isInitialAppStartupComplete to true.`);
        _setIsInitialAppStartupComplete(true);
        initialStartupFlaggedRef.current = true; 
        logDebug('StockAnalysisContext', 'StartupComplete', 'Initial application startup sequence complete. Full debug logging is now active.');
    }

  }, [globalFsmReducerState.current, globalFsmReducerState.variables.activeTicker, globalFsmReducerState.variables.isInitialLoad, _dispatchFsmEventActual, logDebug, _stockSnapshotJson, fetchStockDataFormAction, analyzeTaFormAction ]);


  useEffect(() => {
    const currentFsmState = fsmStateRef.current.current; 
    logDebug('StockAnalysisContext', 'ActionStateEffect_FetchData', `fetchDataActionState changed. Status: ${fetchDataActionState.status}. Current FSM state: ${currentFsmState}`);
    if (currentFsmState !== GlobalFsmState.DATA_FETCH_IN_PROGRESS) return; 

    if (fetchDataActionState.status === 'success' && fetchDataActionState.data) {
        dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: fetchDataActionState.data });
    } else if (fetchDataActionState.status === 'error') {
        if (fetchDataActionState.message && fetchDataActionState.message.includes("Stale data detected")) {
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
    logDebug('StockAnalysisContext', 'ActionStateEffect_AnalyzeTa', `analyzeTaActionState changed. Status: ${analyzeTaActionState.status}. Current FSM state: ${currentFsmState}`);
    if (currentFsmState !== GlobalFsmState.CALCULATING_AI_TA) return;

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
    logDebug('StockAnalysisContext', 'ActionStateEffect_PerformAiAnalysis', `performAiAnalysisActionState changed. Status: ${performAiAnalysisActionState.status}. Current FSM state: ${currentFsmState}`);
    if (currentFsmState !== GlobalFsmState.GENERATING_KEY_TAKEAWAYS) return;

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
    logDebug('StockAnalysisContext', 'ActionStateEffect_PerformAiOptions', `performAiOptionsAnalysisActionState changed. Status: ${performAiOptionsAnalysisActionState.status}. Current FSM state: ${currentFsmState}`);
    if (currentFsmState !== GlobalFsmState.ANALYZING_OPTIONS) return;

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
    debugConsoleMenuFsmDisplay: _debugConsoleMenuFsmDisplay, setDebugConsoleMenuFsmDisplay,
    isInitialAppStartupComplete: _isInitialAppStartupComplete,
    isReducedStartupLoggingEnabled: _isReducedStartupLoggingEnabled,
    setReducedStartupLoggingEnabled,
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
    _debugConsoleMenuFsmDisplay, setDebugConsoleMenuFsmDisplay,
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

