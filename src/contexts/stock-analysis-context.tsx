
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useReducer } from 'react';
import { type LogSourceId, logSourceIds, type LogSourceConfig, defaultLogSourceConfig } from '@/lib/debug-log-types';
import { addEntryToGlobalLogBuffer, clearGlobalLogBuffer } from '@/lib/global-log-buffer'; 
import type { StockDataFetchResult } from '@/actions/analyze-stock-server-action';
import type { AnalyzeTaResult } from '@/actions/analyze-ta-action';
import type { PerformAiAnalysisResult } from '@/actions/perform-ai-analysis-action';
import type { PerformAiOptionsAnalysisResult } from '@/actions/perform-ai-options-analysis-action';
import type { GenerateChatSummaryResult } from '@/actions/generate-chat-summary-action';

const LOGDEBUG_MARKER = '__LOGDEBUG_MARKER__';

// FSM States
export enum FsmState {
  IDLE = 'IDLE',
  INITIALIZING_ANALYSIS = 'INITIALIZING_ANALYSIS',
  AWAITING_DATA_FETCH_TRIGGER = 'AWAITING_DATA_FETCH_TRIGGER',
  FETCHING_DATA = 'FETCHING_DATA',
  DATA_FETCH_SUCCEEDED = 'DATA_FETCH_SUCCEEDED',
  DATA_FETCH_FAILED = 'DATA_FETCH_FAILED',
  AWAITING_AI_TA_TRIGGER = 'AWAITING_AI_TA_TRIGGER',
  ANALYZING_TA = 'ANALYZING_TA',
  AI_TA_SUCCEEDED = 'AI_TA_SUCCEEDED',
  AI_TA_FAILED = 'AI_TA_FAILED',
  PARTIAL_ANALYSIS_COMPLETE = 'PARTIAL_ANALYSIS_COMPLETE',
  AWAITING_KEY_TAKEAWAYS_TRIGGER = 'AWAITING_KEY_TAKEAWAYS_TRIGGER',
  GENERATING_KEY_TAKEAWAYS = 'GENERATING_KEY_TAKEAWAYS',
  KEY_TAKEAWAYS_SUCCEEDED = 'KEY_TAKEAWAYS_SUCCEEDED',
  KEY_TAKEAWAYS_FAILED = 'KEY_TAKEAWAYS_FAILED',
  AWAITING_OPTIONS_ANALYSIS_TRIGGER = 'AWAITING_OPTIONS_ANALYSIS_TRIGGER',
  ANALYZING_OPTIONS = 'ANALYZING_OPTIONS',
  OPTIONS_ANALYSIS_SUCCEEDED = 'OPTIONS_ANALYSIS_SUCCEEDED',
  OPTIONS_ANALYSIS_FAILED = 'OPTIONS_ANALYSIS_FAILED',
  AWAITING_CHAT_SUMMARY_TRIGGER = 'AWAITING_CHAT_SUMMARY_TRIGGER',
  GENERATING_CHAT_SUMMARY = 'GENERATING_CHAT_SUMMARY',
  CHAT_SUMMARY_SUCCEEDED = 'CHAT_SUMMARY_SUCCEEDED',
  CHAT_SUMMARY_FAILED = 'CHAT_SUMMARY_FAILED',
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
interface GenerateChatSummarySuccessPayload extends GenerateChatSummaryResult {}
interface GenerateChatSummaryFailurePayload {
  error?: string | null;
  message?: string | null;
  requestJson?: string; 
}


export type FsmEvent =
  | { type: 'START_PARTIAL_ANALYSIS'; payload: { ticker: string } }
  | { type: 'START_FULL_ANALYSIS'; payload: { ticker: string } }
  | { type: 'INITIALIZATION_COMPLETE' }
  | { type: 'TRIGGER_DATA_FETCH' }
  | { type: 'FETCH_DATA_SUCCESS'; payload: FetchDataSuccessPayload }
  | { type: 'FETCH_DATA_FAILURE'; payload: FetchDataFailurePayload }
  | { type: 'TRIGGER_AI_TA' }
  | { type: 'AI_TA_SUCCESS'; payload: AiTaSuccessPayload }
  | { type: 'AI_TA_FAILURE'; payload: AiTaFailurePayload }
  | { type: 'TRIGGER_KEY_TAKEAWAYS' }
  | { type: 'KEY_TAKEAWAYS_SUCCESS'; payload: AiKeyTakeawaysSuccessPayload }
  | { type: 'KEY_TAKEAWAYS_FAILURE'; payload: AiKeyTakeawaysFailurePayload }
  | { type: 'TRIGGER_OPTIONS_ANALYSIS' }
  | { type: 'OPTIONS_ANALYSIS_SUCCESS'; payload: AiOptionsAnalysisSuccessPayload }
  | { type: 'OPTIONS_ANALYSIS_FAILURE'; payload: AiOptionsAnalysisFailurePayload }
  | { type: 'TRIGGER_CHAT_SUMMARY' }
  | { type: 'CHAT_SUMMARY_SUCCESS'; payload: GenerateChatSummarySuccessPayload }
  | { type: 'CHAT_SUMMARY_FAILURE'; payload: GenerateChatSummaryFailurePayload };

export type FullAnalysisStatus =
  | 'idle'
  | 'pending'
  | 'fetchingData'
  | 'analyzingTa'
  | 'generatingTakeaways' 
  | 'analyzingOptions'
  | 'generatingChatSummary'
  | 'chatting'
  | 'success'
  | 'error';

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

  fullAnalysisStatus: FullAnalysisStatus; 
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
  clearChatHistory: () => void;
}

interface StockAnalysisContextType extends StockAnalysisState, StockAnalysisContextSetters {
  setFullAnalysisStatus: (status: FullAnalysisStatus) => void;
  setIsFullAnalysisTriggered: (triggered: boolean) => void;
  setChatHistory: (history: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void; 

  setClientDebugConsoleEnabled: (enabled: boolean) => void;
  setClientDebugConsoleOpen: (open: boolean) => void;
  setLogSourceEnabled: (source: LogSourceId, enabled: boolean) => void;
  enableAllLogSources: () => void;
  disableAllLogSources: () => void;
  logDebug: (source: LogSourceId, ...messages: any[]) => void;

  dispatchFsmEvent: React.Dispatch<FsmEvent>; 
}

const initialJsonPlaceholder = '{ "status": "initializing..." }';
const createSkippedJson = (reasonKey: string) => `{ "status": "skipped_due_to_${reasonKey}_failure" }`;


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
  fullAnalysisStatus: 'idle',
  isFullAnalysisTriggered: false,
  chatHistory: [],
  isClientDebugConsoleEnabled: false,
  isClientDebugConsoleOpen: false,
  logSourceConfig: defaultLogSourceConfig,
  fsmState: FsmState.IDLE, 
};

const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

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
  const [_chatbotRequestJson, _setChatbotRequestJson] = useState<string>(defaultState.chatbotRequestJson);
  const [_chatbotResponseJson, _setChatbotResponseJson] = useState<string>(defaultState.chatbotResponseJson);
  
  const [fullAnalysisStatus, _setFullAnalysisStatus] = useState<FullAnalysisStatus>(defaultState.fullAnalysisStatus);
  const [isFullAnalysisTriggered, _setIsFullAnalysisTriggered] = useState<boolean>(defaultState.isFullAnalysisTriggered);
  const [chatHistory, _setChatHistory] = useState<ChatMessage[]>(defaultState.chatHistory);
  
  const [isClientDebugConsoleEnabled, _setClientDebugConsoleEnabled] = useState<boolean>(defaultState.isClientDebugConsoleEnabled);
  const [isClientDebugConsoleOpen, _setClientDebugConsoleOpen] = useState<boolean>(defaultState.isClientDebugConsoleOpen);
  const [logSourceConfig, _setLogSourceConfig] = useState<LogSourceConfig>(defaultState.logSourceConfig);

  const logDebug = useCallback((source: LogSourceId, ...messages: any[]) => {
    console.debug(LOGDEBUG_MARKER, source, ...messages);
  }, []);

  const setAndLogJson = useCallback((setter: React.Dispatch<React.SetStateAction<string>>, name: string, value: string) => {
    logDebug('StockAnalysisContext', `Setting ${name} to:`, value.substring(0, 100) + (value.length > 100 ? '...' : ''));
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
  const setChatbotRequestJson = useCallback((json: string) => setAndLogJson(_setChatbotRequestJson, 'chatbotRequestJson', json), [_setChatbotRequestJson, setAndLogJson]);
  const setChatbotResponseJson = useCallback((json: string) => setAndLogJson(_setChatbotResponseJson, 'chatbotResponseJson', json), [_setChatbotResponseJson, setAndLogJson]);

  const setFullAnalysisStatus = useCallback((status: FullAnalysisStatus) => {
    logDebug('StockAnalysisContext', `Setting fullAnalysisStatus to: ${status}`);
    _setFullAnalysisStatus(status);
  }, [_setFullAnalysisStatus, logDebug]);

  const setIsFullAnalysisTriggeredInternal = useCallback((triggered: boolean) => {
     logDebug('StockAnalysisContext', `Setting isFullAnalysisTriggered to: ${triggered}`);
    _setIsFullAnalysisTriggered(triggered);
  }, [_setIsFullAnalysisTriggered, logDebug]);

  const setChatHistory = useCallback((history: ChatMessage[]) => _setChatHistory(history), [_setChatHistory]);
  const clearChatHistoryInternal = useCallback(() => {
    _setChatHistory([]);
    logDebug('StockAnalysisContext', 'Chat history cleared (internal)');
  }, [_setChatHistory, logDebug]);
  
  const addChatMessage = useCallback((message: ChatMessage) => {
    _setChatHistory(prev => [...prev, message]);
    logDebug('StockAnalysisContext', `Added chat message from ${message.role}:`, message.content.substring(0, 50));
  }, [_setChatHistory, logDebug]);

  const setAllPlaceholdersInternal = useCallback((currentTicker: string, forFullAnalysis: boolean) => {
    const pendingPlaceholder = `{ "status": "pending..." }`;
    const fullAnalysisPendingPlaceholder = `{ "status": "full_analysis_pending..." }`;
    const initializingPlaceholder = `{ "status": "initializing..." }`;
    const placeholderToUse = forFullAnalysis ? fullAnalysisPendingPlaceholder : pendingPlaceholder;
    const requestLogPlaceholder = forFullAnalysis
        ? `{ "status": "full_analysis_pending...", "input": {"ticker": "${currentTicker}"} }`
        : `{ "status": "pending...", "input": {"ticker": "${currentTicker}"} }`;

    _setMarketStatusJson(placeholderToUse);
    _setStockSnapshotJson(placeholderToUse);
    _setStandardTasJson(placeholderToUse);
    _setOptionsChainJson(placeholderToUse);
    _setPolygonApiRequestLogJson(requestLogPlaceholder);
    _setPolygonApiResponseLogJson(placeholderToUse);

    _setAiAnalyzedTaRequestJson(placeholderToUse);
    _setAiAnalyzedTaJson(placeholderToUse);
    _setAiKeyTakeawaysRequestJson(placeholderToUse);
    _setAiKeyTakeawaysJson(placeholderToUse);
    _setAiOptionsAnalysisRequestJson(placeholderToUse);
    _setAiOptionsAnalysisJson(placeholderToUse);
    
    _setChatbotRequestJson(initializingPlaceholder);
    _setChatbotResponseJson(initializingPlaceholder);
    logDebug('StockAnalysisContext', `Set all placeholders for ${currentTicker}. Full analysis: ${forFullAnalysis}`);
  }, [logDebug]);

  const contextSetters: StockAnalysisContextSetters = {
    setPolygonApiRequestLogJson: _setPolygonApiRequestLogJson, 
    setPolygonApiResponseLogJson: _setPolygonApiResponseLogJson,
    setMarketStatusJson: _setMarketStatusJson, 
    setStockSnapshotJson: _setStockSnapshotJson, 
    setStandardTasJson: _setStandardTasJson,
    setOptionsChainJson: _setOptionsChainJson, 
    setAiAnalyzedTaRequestJson: _setAiAnalyzedTaRequestJson, 
    setAiAnalyzedTaJson: _setAiAnalyzedTaJson,
    setAiOptionsAnalysisRequestJson: _setAiOptionsAnalysisRequestJson, 
    setAiOptionsAnalysisJson: _setAiOptionsAnalysisJson,
    setAiKeyTakeawaysRequestJson: _setAiKeyTakeawaysRequestJson, 
    setAiKeyTakeawaysJson: _setAiKeyTakeawaysJson,
    setChatbotRequestJson: _setChatbotRequestJson, 
    setChatbotResponseJson: _setChatbotResponseJson,
    clearChatHistory: clearChatHistoryInternal,
  };

  const fsmReducer = (state: FsmState, event: FsmEvent): FsmState => {
    logDebug('FSM_PIPELINE', `Reducer: Current state: ${state}, Event Type: ${event.type}, Event Payload (preview):`, 
        Object.entries(event).reduce((acc, [key, value]) => {
          if (key === 'payload' && typeof value === 'object' && value !== null) {
            acc[key] = Object.entries(value).reduce((pAcc, [pKey, pValue]) => {
              pAcc[pKey] = typeof pValue === 'string' ? pValue.substring(0, 50) + '...' : pValue;
              return pAcc;
            }, {} as any);
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as any)
    );
    const pendingJson = `{ "status": "pending..." }`;
    const errorJsonWithDetails = (message: string, details: string) => 
      `{ "status": "error", "message": "${message.replace(/"/g, '\\"')}", "details": "${details.replace(/"/g, '\\"')}" }`;
    
    switch (state) {
      case FsmState.IDLE:
        if (event.type === 'START_PARTIAL_ANALYSIS' || event.type === 'START_FULL_ANALYSIS') {
          logDebug('FSM_PIPELINE', `Transition: IDLE -> INITIALIZING_ANALYSIS on ${event.type} for ticker: ${event.payload.ticker}`);
          _setIsFullAnalysisTriggered(event.type === 'START_FULL_ANALYSIS'); 
          setAllPlaceholdersInternal(event.payload.ticker, event.type === 'START_FULL_ANALYSIS');
          clearChatHistoryInternal();
          return FsmState.INITIALIZING_ANALYSIS;
        }
        return state;

      case FsmState.INITIALIZING_ANALYSIS:
        if (event.type === 'INITIALIZATION_COMPLETE') {
          logDebug('FSM_PIPELINE', `Transition: INITIALIZING_ANALYSIS -> AWAITING_DATA_FETCH_TRIGGER on INITIALIZATION_COMPLETE`);
          return FsmState.AWAITING_DATA_FETCH_TRIGGER;
        }
        return state;

      case FsmState.AWAITING_DATA_FETCH_TRIGGER:
        if (event.type === 'TRIGGER_DATA_FETCH') {
          logDebug('FSM_PIPELINE', `Transition: AWAITING_DATA_FETCH_TRIGGER -> FETCHING_DATA on TRIGGER_DATA_FETCH`);
          const fetchingLogPlaceholder = `{ "status": "fetching_data..." }`;
          contextSetters.setPolygonApiRequestLogJson(fetchingLogPlaceholder);
          contextSetters.setPolygonApiResponseLogJson(fetchingLogPlaceholder);
          return FsmState.FETCHING_DATA;
        }
        return state;

      case FsmState.FETCHING_DATA:
        if (event.type === 'FETCH_DATA_SUCCESS') {
          logDebug('FSM_PIPELINE', `Transition: FETCHING_DATA -> DATA_FETCH_SUCCEEDED on FETCH_DATA_SUCCESS. Payload keys: ${Object.keys(event.payload).join(', ')}`);
          contextSetters.setMarketStatusJson(event.payload.marketStatusJson);
          contextSetters.setStockSnapshotJson(event.payload.stockSnapshotJson);
          contextSetters.setStandardTasJson(event.payload.standardTasJson);
          contextSetters.setOptionsChainJson(event.payload.optionsChainJson);
          contextSetters.setPolygonApiRequestLogJson(event.payload.polygonApiRequestLogJson);
          contextSetters.setPolygonApiResponseLogJson(event.payload.polygonApiResponseLogJson);
          return FsmState.DATA_FETCH_SUCCEEDED;
        }
        if (event.type === 'FETCH_DATA_FAILURE') {
          logDebug('FSM_PIPELINE', `Transition: FETCHING_DATA -> DATA_FETCH_FAILED on FETCH_DATA_FAILURE. Message: ${event.payload.message}`);
          const errorMsg = event.payload.message || 'Data fetch failed';
          const errorDetails = event.payload.error || 'Unknown data fetch error';
          const dataFetchErrorJson = errorJsonWithDetails(errorMsg, errorDetails);
          
          contextSetters.setMarketStatusJson(dataFetchErrorJson);
          contextSetters.setStockSnapshotJson(dataFetchErrorJson);
          contextSetters.setStandardTasJson(dataFetchErrorJson);
          contextSetters.setOptionsChainJson(dataFetchErrorJson);
          contextSetters.setPolygonApiRequestLogJson(event.payload.polygonApiRequestLogJson || dataFetchErrorJson);
          contextSetters.setPolygonApiResponseLogJson(event.payload.polygonApiResponseLogJson || dataFetchErrorJson);
          
          const skippedJson = createSkippedJson("data_fetch");
          contextSetters.setAiAnalyzedTaRequestJson(skippedJson);
          contextSetters.setAiAnalyzedTaJson(skippedJson);
          contextSetters.setAiKeyTakeawaysRequestJson(skippedJson);
          contextSetters.setAiKeyTakeawaysJson(skippedJson);
          contextSetters.setAiOptionsAnalysisRequestJson(skippedJson);
          contextSetters.setAiOptionsAnalysisJson(skippedJson);
          contextSetters.setChatbotRequestJson(skippedJson);
          contextSetters.setChatbotResponseJson(skippedJson);
          
          return FsmState.DATA_FETCH_FAILED;
        }
        return state;

      case FsmState.DATA_FETCH_SUCCEEDED:
        logDebug('FSM_PIPELINE', `Transition: DATA_FETCH_SUCCEEDED -> AWAITING_AI_TA_TRIGGER`);
        return FsmState.AWAITING_AI_TA_TRIGGER;

      case FsmState.DATA_FETCH_FAILED:
        logDebug('FSM_PIPELINE', `Transition: DATA_FETCH_FAILED -> IDLE. isFullAnalysisTriggered was: ${isFullAnalysisTriggered}`);
        _setIsFullAnalysisTriggered(false); 
        return FsmState.IDLE;

      case FsmState.AWAITING_AI_TA_TRIGGER:
        if (event.type === 'TRIGGER_AI_TA') {
          logDebug('FSM_PIPELINE', `Transition: AWAITING_AI_TA_TRIGGER -> ANALYZING_TA on TRIGGER_AI_TA`);
          contextSetters.setAiAnalyzedTaRequestJson(pendingJson);
          contextSetters.setAiAnalyzedTaJson(pendingJson);
          return FsmState.ANALYZING_TA;
        }
        return state;

      case FsmState.ANALYZING_TA:
        if (event.type === 'AI_TA_SUCCESS') {
          logDebug('FSM_PIPELINE', `Transition: ANALYZING_TA -> AI_TA_SUCCEEDED on AI_TA_SUCCESS. Payload keys: ${Object.keys(event.payload).join(', ')}`);
          contextSetters.setAiAnalyzedTaRequestJson(event.payload.aiAnalyzedTaRequestJson);
          contextSetters.setAiAnalyzedTaJson(event.payload.aiAnalyzedTaJson);
          return FsmState.AI_TA_SUCCEEDED;
        }
        if (event.type === 'AI_TA_FAILURE') {
          logDebug('FSM_PIPELINE', `Transition: ANALYZING_TA -> AI_TA_FAILED on AI_TA_FAILURE. Message: ${event.payload.message}`);
          const errorPayload = event.payload;
          const errorMsg = errorPayload.message || 'AI TA analysis failed';
          const errorDetails = errorPayload.error || 'Unknown AI TA error';
          const taErrorJson = errorJsonWithDetails(errorMsg, errorDetails);
          
          contextSetters.setAiAnalyzedTaRequestJson(errorPayload.aiAnalyzedTaRequestJson || taErrorJson);
          contextSetters.setAiAnalyzedTaJson(taErrorJson);

          const skippedJson = createSkippedJson("ai_ta");
          contextSetters.setAiKeyTakeawaysRequestJson(skippedJson);
          contextSetters.setAiKeyTakeawaysJson(skippedJson);
          contextSetters.setAiOptionsAnalysisRequestJson(skippedJson);
          contextSetters.setAiOptionsAnalysisJson(skippedJson);
          contextSetters.setChatbotRequestJson(skippedJson);
          contextSetters.setChatbotResponseJson(skippedJson);
          return FsmState.AI_TA_FAILED;
        }
        return state;

      case FsmState.AI_TA_SUCCEEDED:
        logDebug('FSM_PIPELINE', `In AI_TA_SUCCEEDED. isFullAnalysisTriggered: ${isFullAnalysisTriggered}`);
        if (isFullAnalysisTriggered) {
          logDebug('FSM_PIPELINE', `Transition: AI_TA_SUCCEEDED -> AWAITING_KEY_TAKEAWAYS_TRIGGER (Full Analysis)`);
          return FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER;
        } else {
          logDebug('FSM_PIPELINE', `Transition: AI_TA_SUCCEEDED -> PARTIAL_ANALYSIS_COMPLETE (Partial Analysis)`);
          return FsmState.PARTIAL_ANALYSIS_COMPLETE;
        }

      case FsmState.AI_TA_FAILED:
        logDebug('FSM_PIPELINE', `In AI_TA_FAILED. isFullAnalysisTriggered: ${isFullAnalysisTriggered}`);
        if (isFullAnalysisTriggered) {
          logDebug('FSM_PIPELINE', `Transition: AI_TA_FAILED -> AWAITING_KEY_TAKEAWAYS_TRIGGER (Full Analysis, TA error noted)`);
          return FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER;
        } else {
          logDebug('FSM_PIPELINE', `Transition: AI_TA_FAILED -> IDLE (Partial Analysis Error)`);
           _setIsFullAnalysisTriggered(false); 
          return FsmState.IDLE;
        }
      
      case FsmState.PARTIAL_ANALYSIS_COMPLETE:
         logDebug('FSM_PIPELINE', `Reached PARTIAL_ANALYSIS_COMPLETE. Resetting isFullAnalysisTriggered. Transition to IDLE.`);
         _setIsFullAnalysisTriggered(false); 
        return FsmState.IDLE; 

      case FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER:
        if (event.type === 'TRIGGER_KEY_TAKEAWAYS') {
           if (_aiKeyTakeawaysJson.includes("skipped_due_to_")) { 
             logDebug('FSM_PIPELINE', `Transition: AWAITING_KEY_TAKEAWAYS_TRIGGER -> KEY_TAKEAWAYS_FAILED (pre-skipped due to prior failure) on TRIGGER_KEY_TAKEAWAYS`);
             const skippedFromKT = createSkippedJson("key_takeaways_pre_skipped");
             contextSetters.setAiOptionsAnalysisRequestJson(skippedFromKT);
             contextSetters.setAiOptionsAnalysisJson(skippedFromKT);
             contextSetters.setChatbotRequestJson(skippedFromKT);
             contextSetters.setChatbotResponseJson(skippedFromKT);
             return FsmState.KEY_TAKEAWAYS_FAILED;
           }
          logDebug('FSM_PIPELINE', `Transition: AWAITING_KEY_TAKEAWAYS_TRIGGER -> GENERATING_KEY_TAKEAWAYS on TRIGGER_KEY_TAKEAWAYS`);
          contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
          contextSetters.setAiKeyTakeawaysJson(pendingJson);
          return FsmState.GENERATING_KEY_TAKEAWAYS;
        }
        return state;

      case FsmState.GENERATING_KEY_TAKEAWAYS:
        if (event.type === 'KEY_TAKEAWAYS_SUCCESS') {
          logDebug('FSM_PIPELINE', `Transition: GENERATING_KEY_TAKEAWAYS -> KEY_TAKEAWAYS_SUCCEEDED. Payload keys: ${Object.keys(event.payload).join(', ')}`);
          contextSetters.setAiKeyTakeawaysRequestJson(event.payload.aiKeyTakeawaysRequestJson);
          contextSetters.setAiKeyTakeawaysJson(event.payload.aiKeyTakeawaysJson);
          return FsmState.KEY_TAKEAWAYS_SUCCEEDED;
        }
        if (event.type === 'KEY_TAKEAWAYS_FAILURE') {
          logDebug('FSM_PIPELINE', `Transition: GENERATING_KEY_TAKEAWAYS -> KEY_TAKEAWAYS_FAILED. Message: ${event.payload.message}`);
          const ktErrorPayload = event.payload;
          const ktErrorMsg = ktErrorPayload.message || 'AI Key Takeaways generation failed';
          const ktErrorDetails = ktErrorPayload.error || '';
          const ktErrorJson = errorJsonWithDetails(ktErrorMsg, ktErrorDetails);
          
          contextSetters.setAiKeyTakeawaysRequestJson(ktErrorPayload.aiKeyTakeawaysRequestJson || ktErrorJson);
          contextSetters.setAiKeyTakeawaysJson(ktErrorJson);
          
          const skippedJson = createSkippedJson("key_takeaways");
          contextSetters.setAiOptionsAnalysisRequestJson(skippedJson);
          contextSetters.setAiOptionsAnalysisJson(skippedJson);
          contextSetters.setChatbotRequestJson(skippedJson);
          contextSetters.setChatbotResponseJson(skippedJson);
          return FsmState.KEY_TAKEAWAYS_FAILED;
        }
        return state;

      case FsmState.KEY_TAKEAWAYS_SUCCEEDED:
      case FsmState.KEY_TAKEAWAYS_FAILED:
        logDebug('FSM_PIPELINE', `Transition from ${state} -> AWAITING_OPTIONS_ANALYSIS_TRIGGER`);
        return FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER;

      case FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER:
        if (event.type === 'TRIGGER_OPTIONS_ANALYSIS') {
          if (_aiOptionsAnalysisJson.includes("skipped_due_to_")) { 
            logDebug('FSM_PIPELINE', `Transition: AWAITING_OPTIONS_ANALYSIS_TRIGGER -> OPTIONS_ANALYSIS_FAILED (pre-skipped) on TRIGGER_OPTIONS_ANALYSIS`);
            const skippedFromOpt = createSkippedJson("options_analysis_pre_skipped");
            contextSetters.setChatbotRequestJson(skippedFromOpt);
            contextSetters.setChatbotResponseJson(skippedFromOpt);
            return FsmState.OPTIONS_ANALYSIS_FAILED;
          }
          logDebug('FSM_PIPELINE', `Transition: AWAITING_OPTIONS_ANALYSIS_TRIGGER -> ANALYZING_OPTIONS on TRIGGER_OPTIONS_ANALYSIS`);
          contextSetters.setAiOptionsAnalysisRequestJson(pendingJson);
          contextSetters.setAiOptionsAnalysisJson(pendingJson);
          return FsmState.ANALYZING_OPTIONS;
        }
        return state;

      case FsmState.ANALYZING_OPTIONS:
        if (event.type === 'OPTIONS_ANALYSIS_SUCCESS') {
          logDebug('FSM_PIPELINE', `Transition: ANALYZING_OPTIONS -> OPTIONS_ANALYSIS_SUCCEEDED. Payload keys: ${Object.keys(event.payload).join(', ')}`);
          contextSetters.setAiOptionsAnalysisRequestJson(event.payload.aiOptionsAnalysisRequestJson);
          contextSetters.setAiOptionsAnalysisJson(event.payload.aiOptionsAnalysisJson);
          return FsmState.OPTIONS_ANALYSIS_SUCCEEDED;
        }
        if (event.type === 'OPTIONS_ANALYSIS_FAILURE') {
          logDebug('FSM_PIPELINE', `Transition: ANALYZING_OPTIONS -> OPTIONS_ANALYSIS_FAILED. Message: ${event.payload.message}`);
          const optErrorPayload = event.payload;
          const optErrorMsg = optErrorPayload.message || 'AI Options Analysis failed';
          const optErrorDetails = optErrorPayload.error || '';
          const optErrorJson = errorJsonWithDetails(optErrorMsg, optErrorDetails);
          
          contextSetters.setAiOptionsAnalysisRequestJson(optErrorPayload.aiOptionsAnalysisRequestJson || optErrorJson);
          contextSetters.setAiOptionsAnalysisJson(optErrorJson);
          
          const skippedJson = createSkippedJson("options_analysis");
          contextSetters.setChatbotRequestJson(skippedJson);
          contextSetters.setChatbotResponseJson(skippedJson);
          return FsmState.OPTIONS_ANALYSIS_FAILED;
        }
        return state;

      case FsmState.OPTIONS_ANALYSIS_SUCCEEDED:
      case FsmState.OPTIONS_ANALYSIS_FAILED:
        logDebug('FSM_PIPELINE', `Transition from ${state} -> AWAITING_CHAT_SUMMARY_TRIGGER`);
        return FsmState.AWAITING_CHAT_SUMMARY_TRIGGER;
      
      case FsmState.AWAITING_CHAT_SUMMARY_TRIGGER:
        if (event.type === 'TRIGGER_CHAT_SUMMARY') {
          if (_chatbotResponseJson.includes("skipped_due_to_")) { 
             logDebug('FSM_PIPELINE', `Transition: AWAITING_CHAT_SUMMARY_TRIGGER -> CHAT_SUMMARY_FAILED (pre-skipped) on TRIGGER_CHAT_SUMMARY`);
             return FsmState.CHAT_SUMMARY_FAILED;
          }
          logDebug('FSM_PIPELINE', `Transition: AWAITING_CHAT_SUMMARY_TRIGGER -> GENERATING_CHAT_SUMMARY on TRIGGER_CHAT_SUMMARY`);
          contextSetters.setChatbotRequestJson(pendingJson);
          contextSetters.setChatbotResponseJson(pendingJson);
          return FsmState.GENERATING_CHAT_SUMMARY;
        }
        return state;

      case FsmState.GENERATING_CHAT_SUMMARY:
        if (event.type === 'CHAT_SUMMARY_SUCCESS') {
          logDebug('FSM_PIPELINE', `Transition: GENERATING_CHAT_SUMMARY -> CHAT_SUMMARY_SUCCEEDED. Payload keys: ${Object.keys(event.payload).join(', ')}`);
          contextSetters.setChatbotRequestJson(event.payload.requestJson);
          contextSetters.setChatbotResponseJson(JSON.stringify({ summaryText: event.payload.summaryText }, null, 2));
          _setChatHistory([{ id: 'summary_0', role: 'model', content: event.payload.summaryText }]);
          return FsmState.CHAT_SUMMARY_SUCCEEDED;
        }
        if (event.type === 'CHAT_SUMMARY_FAILURE') {
          logDebug('FSM_PIPELINE', `Transition: GENERATING_CHAT_SUMMARY -> CHAT_SUMMARY_FAILED. Message: ${event.payload.message}`);
          const chatErrorPayload = event.payload;
          const chatErrorMsg = chatErrorPayload.message || 'Chat summary generation failed';
          const chatErrorDetails = chatErrorPayload.error || '';
          const chatErrorJson = errorJsonWithDetails(chatErrorMsg, chatErrorDetails);
          
          contextSetters.setChatbotRequestJson(chatErrorPayload.requestJson || chatErrorJson);
          contextSetters.setChatbotResponseJson(chatErrorJson);
          return FsmState.CHAT_SUMMARY_FAILED;
        }
        return state;

      case FsmState.CHAT_SUMMARY_SUCCEEDED:
      case FsmState.CHAT_SUMMARY_FAILED:
        logDebug('FSM_PIPELINE', `Transition from ${state} -> FULL_ANALYSIS_COMPLETE`);
        return FsmState.FULL_ANALYSIS_COMPLETE;

      case FsmState.FULL_ANALYSIS_COMPLETE:
        logDebug('FSM_PIPELINE', `Full analysis pipeline complete. Transition: FULL_ANALYSIS_COMPLETE -> IDLE.`);
        _setIsFullAnalysisTriggered(false);
        return FsmState.IDLE;

      default:
        logDebug('FSM_PIPELINE', `Unhandled state in FSM reducer: ${state}`);
        return state;
    }
  };

  const [fsmState, dispatchFsmEvent] = useReducer(fsmReducer, defaultState.fsmState);

  useEffect(() => {
    if (fsmState === FsmState.INITIALIZING_ANALYSIS) {
      logDebug('FSM_PIPELINE', 'Effect: Entered INITIALIZING_ANALYSIS. Dispatching INITIALIZATION_COMPLETE.');
      dispatchFsmEvent({ type: 'INITIALIZATION_COMPLETE' });
    }
  }, [fsmState, logDebug]);


  const enableAllLogSources = useCallback(() => {
    logDebug('StockAnalysisContext', 'Enabling all log sources.');
    const newConfig: LogSourceConfig = { ...defaultLogSourceConfig }; 
    logSourceIds.forEach(id => { newConfig[id] = true; });
    newConfig.DebugConsole = true; 
    _setLogSourceConfig(newConfig);
  }, [_setLogSourceConfig, logDebug]);

  const disableAllLogSources = useCallback(() => {
    logDebug('StockAnalysisContext', 'Disabling all log sources (except DebugConsole itself).');
    const newConfig: LogSourceConfig = { ...defaultLogSourceConfig }; 
    logSourceIds.forEach(id => { newConfig[id] = false; });
    newConfig.DebugConsole = true; 
    _setLogSourceConfig(newConfig);
  }, [_setLogSourceConfig, logDebug]);

  const setClientDebugConsoleEnabled = useCallback((enabled: boolean) => {
    logDebug('StockAnalysisContext', `ClientDebugConsoleEnabled will be set to: ${enabled}. Current value: ${_isClientDebugConsoleEnabled => _isClientDebugConsoleEnabled}`);
    _setClientDebugConsoleEnabled(enabled);
    if (enabled) {
      logDebug('StockAnalysisContext', `ClientDebugConsoleEnabled is true, calling enableAllLogSources.`);
      enableAllLogSources(); 
    } else {
      logDebug('StockAnalysisContext', `ClientDebugConsoleEnabled is false, ensuring console is closed and buffer cleared.`);
      _setClientDebugConsoleOpen(false);
      clearGlobalLogBuffer(); 
    }
  }, [_setClientDebugConsoleEnabled, _setClientDebugConsoleOpen, enableAllLogSources, logDebug]);

  const setClientDebugConsoleOpen = useCallback((open: boolean) => {
    logDebug('StockAnalysisContext', `ClientDebugConsoleOpen will be set to: ${open}. Current value: ${_isClientDebugConsoleOpen => _isClientDebugConsoleOpen}. Enabled: ${isClientDebugConsoleEnabled}`);
    if (isClientDebugConsoleEnabled || !open) { 
        _setClientDebugConsoleOpen(open);
    }
  }, [isClientDebugConsoleEnabled, _setClientDebugConsoleOpen, logDebug]);

  const setLogSourceEnabled = useCallback((source: LogSourceId, enabled: boolean) => {
    _setLogSourceConfig(prevConfig => {
        const newConfig = { ...prevConfig, [source]: enabled };
        if (source === 'DebugConsole' && !enabled) {
            logDebug('StockAnalysisContext', 'Attempted to disable DebugConsole source via setLogSourceEnabled, overriding to keep it true.');
            newConfig.DebugConsole = true;
        }
        logDebug('StockAnalysisContext', `Log source '${source}' set to: ${newConfig[source]}`);
        return newConfig;
    });
  }, [_setLogSourceConfig, logDebug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let currentOriginals = (console as any).__stockSageOriginals;
    if (!currentOriginals) {
      currentOriginals = { ...browserConsole };
      (console as any).__stockSageOriginals = currentOriginals;
    }
    
    const interceptAndProcessLog = (
      type: 'log' | 'warn' | 'error' | 'info' | 'debug',
      ...args: any[]
    ) => {
      if (args.length > 0 && args[0] === LOGDEBUG_MARKER && args[1] === 'StockAnalysisContext' && args[2] === 'Console Interceptor Native Call') {
        currentOriginals[type](...args.slice(3)); 
        return;
      }
      
      currentOriginals[type](...args); 

      queueMicrotask(() => {
        if (!isClientDebugConsoleEnabled) return; 

        let source: LogSourceId = 'NATIVE_CONSOLE';
        let messagesForBuffer = args;
        let logTypeForBuffer = type;

        if (args.length > 0 && args[0] === LOGDEBUG_MARKER) {
          source = args[1] as LogSourceId;
          messagesForBuffer = args.slice(2);
          logTypeForBuffer = 'debug'; 
          if (!logSourceConfig[source]) {
            return; 
          }
        } else {
          if (!logSourceConfig['NATIVE_CONSOLE']) {
            return; 
          }
        }
        addEntryToGlobalLogBuffer({ type: logTypeForBuffer, messages: messagesForBuffer, source });
      });
    };
    
    if (isClientDebugConsoleEnabled) { 
      console.log = (...args) => interceptAndProcessLog('log', ...args);
      console.warn = (...args) => interceptAndProcessLog('warn', ...args);
      console.error = (...args) => interceptAndProcessLog('error', ...args);
      console.info = (...args) => interceptAndProcessLog('info', ...args);
      console.debug = (...args) => interceptAndProcessLog('debug', ...args);
      logDebug('StockAnalysisContext', 'Console Interceptor Native Call', 'Console interception active (for UI buffer).');
    } else {
      if ((console as any).__stockSageOriginals) {
        Object.assign(console, (console as any).__stockSageOriginals);
         currentOriginals.debug('[StockAnalysisContext]', 'Console Interceptor Native Call', 'Console interception for UI buffer disabled, originals restored.');
      }
    }

    return () => {
      if ((console as any).__stockSageOriginals) {
        Object.assign(console, (console as any).__stockSageOriginals);
        currentOriginals.debug('[StockAnalysisContext]', 'Console Interceptor Native Call', 'Console interception disabled on cleanup, originals restored.');
      }
    };
  }, [isClientDebugConsoleEnabled, logSourceConfig, logDebug]); 

  const contextValue: StockAnalysisContextType = {
    polygonApiRequestLogJson: _polygonApiRequestLogJson, setPolygonApiRequestLogJson: _setPolygonApiRequestLogJson,
    polygonApiResponseLogJson: _polygonApiResponseLogJson, setPolygonApiResponseLogJson: _setPolygonApiResponseLogJson,
    marketStatusJson: _marketStatusJson, setMarketStatusJson: _setMarketStatusJson,
    stockSnapshotJson: _stockSnapshotJson, setStockSnapshotJson: _setStockSnapshotJson,
    standardTasJson: _standardTasJson, setStandardTasJson: _setStandardTasJson,
    optionsChainJson: _optionsChainJson, setOptionsChainJson: _setOptionsChainJson,
    aiAnalyzedTaRequestJson: _aiAnalyzedTaRequestJson, setAiAnalyzedTaRequestJson: _setAiAnalyzedTaRequestJson,
    aiAnalyzedTaJson: _aiAnalyzedTaJson, setAiAnalyzedTaJson: _setAiAnalyzedTaJson,
    aiOptionsAnalysisRequestJson: _aiOptionsAnalysisRequestJson, setAiOptionsAnalysisRequestJson: _setAiOptionsAnalysisRequestJson,
    aiOptionsAnalysisJson: _aiOptionsAnalysisJson, setAiOptionsAnalysisJson: _setAiOptionsAnalysisJson,
    aiKeyTakeawaysRequestJson: _aiKeyTakeawaysRequestJson, setAiKeyTakeawaysRequestJson: _setAiOptionsAnalysisRequestJson,
    aiKeyTakeawaysJson: _aiKeyTakeawaysJson, setAiKeyTakeawaysJson: _setAiOptionsAnalysisJson,
    chatbotRequestJson: _chatbotRequestJson, setChatbotRequestJson: _setAiOptionsAnalysisRequestJson,
    chatbotResponseJson: _chatbotResponseJson, setChatbotResponseJson: _setAiOptionsAnalysisJson,
    
    fullAnalysisStatus, setFullAnalysisStatus,
    isFullAnalysisTriggered, setIsFullAnalysisTriggered: setIsFullAnalysisTriggeredInternal,
    chatHistory, setChatHistory,
    clearChatHistory: clearChatHistoryInternal, addChatMessage,
    
    isClientDebugConsoleEnabled, isClientDebugConsoleOpen,
    logSourceConfig,
    setClientDebugConsoleEnabled, setClientDebugConsoleOpen,
    setLogSourceEnabled, 
    enableAllLogSources, disableAllLogSources,
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

