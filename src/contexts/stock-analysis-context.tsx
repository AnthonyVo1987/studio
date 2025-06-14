
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
  STALE_DATA_FROM_ACTION_ERROR = 'STALE_DATA_FROM_ACTION_ERROR', // New error state
  
  AWAITING_AI_TA_TRIGGER = 'AWAITING_AI_TA_TRIGGER',
  ANALYZING_TA = 'ANALYZING_TA',
  AI_TA_SUCCEEDED = 'AI_TA_SUCCEEDED', 
  AI_TA_FAILED = 'AI_TA_FAILED',
  
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
  
  ANALYZE_STOCK_COMPLETE = 'ANALYZE_STOCK_COMPLETE', 
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
interface GenerateChatSummarySuccessPayload extends GenerateChatSummaryResult {}
interface GenerateChatSummaryFailurePayload {
  error?: string | null;
  message?: string | null;
  requestJson?: string; 
}


export type FsmEvent =
  | { type: 'START_ANALYZE_STOCK'; payload: { ticker: string } } 
  | { type: 'START_FULL_ANALYSIS'; payload: { ticker: string } }    
  | { type: 'INITIALIZATION_COMPLETE' } 

  | { type: 'TRIGGER_DATA_FETCH' }
  | { type: 'FETCH_DATA_SUCCESS'; payload: FetchDataSuccessPayload }
  | { type: 'FETCH_DATA_FAILURE'; payload: FetchDataFailurePayload }
  | { type: 'STALE_DATA_FROM_ACTION'; payload: StaleDataFromActionPayload } // New event

  | { type: 'INITIATE_AI_TA_SEQUENCE' } 
  | { type: 'TRIGGER_AI_TA' }
  | { type: 'AI_TA_SUCCESS'; payload: AiTaSuccessPayload }
  | { type: 'AI_TA_FAILURE'; payload: AiTaFailurePayload }

  | { type: 'INITIATE_KEY_TAKEAWAYS_SEQUENCE' } 
  | { type: 'TRIGGER_KEY_TAKEAWAYS' }
  | { type: 'KEY_TAKEAWAYS_SUCCESS'; payload: AiKeyTakeawaysSuccessPayload }
  | { type: 'KEY_TAKEAWAYS_FAILURE'; payload: AiKeyTakeawaysFailurePayload }

  | { type: 'INITIATE_OPTIONS_ANALYSIS_SEQUENCE' } 
  | { type: 'TRIGGER_OPTIONS_ANALYSIS' }
  | { type: 'OPTIONS_ANALYSIS_SUCCESS'; payload: AiOptionsAnalysisSuccessPayload }
  | { type: 'OPTIONS_ANALYSIS_FAILURE'; payload: AiOptionsAnalysisFailurePayload }
  
  | { type: 'INITIATE_CHAT_SUMMARY_SEQUENCE' } 
  | { type: 'TRIGGER_CHAT_SUMMARY' }
  | { type: 'CHAT_SUMMARY_SUCCESS'; payload: GenerateChatSummarySuccessPayload }
  | { type: 'CHAT_SUMMARY_FAILURE'; payload: GenerateChatSummaryFailurePayload }
  
  | { type: 'PROCEED_TO_ANALYZE_STOCK_COMPLETE' } 
  | { type: 'PROCEED_TO_FULL_COMPLETE' }    
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
  clearChatHistory: () => void;
}

interface StockAnalysisContextType extends StockAnalysisState, StockAnalysisContextSetters {
  addChatMessage: (message: ChatMessage) => void; 

  setClientDebugConsoleEnabled: (enabled: boolean) => void;
  setClientDebugConsoleOpen: (open: boolean) => void;
  setLogSourceEnabled: (source: LogSourceId, enabled: boolean) => void;
  enableAllLogSources: () => void;
  disableAllLogSources: () => void;
  logDebug: (source: LogSourceId, ...messages: any[]) => void;

  dispatchFsmEvent: React.Dispatch<FsmEvent>; 
}

const initialJsonPlaceholder = '{ "status": "no_analysis_run_yet" }';
const pendingJson = '{ "status": "pending..." }'; // Generic pending state for ALL resettable JSONs
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
  
  const clearChatHistoryInternal = useCallback(() => {
    _setChatHistory([]);
    logDebug('StockAnalysisContext', 'Chat history cleared (internal)');
  }, [_setChatHistory, logDebug]);
  
  const addChatMessage = useCallback((message: ChatMessage) => {
    _setChatHistory(prev => [...prev, message]);
    logDebug('StockAnalysisContext', `Added chat message from ${message.role}:`, message.content.substring(0, 50));
  }, [_setChatHistory, logDebug]);

  const setAllPlaceholdersInternal = useCallback((currentTickerForLogOnly: string, isFullAnalysis: boolean) => {
    logDebug('StockAnalysisContext:setAllPlaceholdersInternal', `Resetting ALL context JSONs to generic PENDING ('${pendingJson}') for new analysis of ${currentTickerForLogOnly}. isFull: ${isFullAnalysis}`);
    
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
    clearChatHistory: clearChatHistoryInternal,
  };

  const fsmReducer = (state: FsmState, event: FsmEvent): FsmState => {
    const currentIsFullAnalysisTriggered = _isFullAnalysisTriggeredInternalState; 
    logDebug('FSM_PIPELINE', `Reducer: Current state: ${state}, Event Type: ${event.type}, isFullAnalysisTriggered: ${currentIsFullAnalysisTriggered}, Event Payload (keys):`, 
        event.type !== 'ADD_CHAT_MESSAGE' ? Object.keys(event.payload || {}).join(', ') : 'ChatMessage');
    
    const errorJsonWithDetails = (message: string, details: string | null | undefined) => 
      `{ "status": "error", "message": "${message.replace(/"/g, '\\"')}", "details": "${(details || '').replace(/"/g, '\\"')}" }`;
    
    switch (state) {
      case FsmState.IDLE:
        if (event.type === 'START_ANALYZE_STOCK' || event.type === 'START_FULL_ANALYSIS') {
          const isFull = event.type === 'START_FULL_ANALYSIS';
          setAllPlaceholdersInternal(event.payload.ticker, isFull); 
          _setIsFullAnalysisTriggeredInternalState(isFull); 
          if (isFull) clearChatHistoryInternal(); 
          logDebug('FSM_PIPELINE', `Reducer: ${event.type} received. isFullAnalysisTriggered set to: ${isFull}. Transitioning to INITIALIZING_ANALYSIS.`);
          return FsmState.INITIALIZING_ANALYSIS;
        }
        if (event.type === 'ADD_CHAT_MESSAGE' && 'payload' in event) { 
          addChatMessage(event.payload);
        }
        return state;

      case FsmState.INITIALIZING_ANALYSIS:
        if (event.type === 'INITIALIZATION_COMPLETE') {
            logDebug('FSM_PIPELINE', `Reducer: INITIALIZATION_COMPLETE. Transitioning to AWAITING_DATA_FETCH_TRIGGER.`);
            return FsmState.AWAITING_DATA_FETCH_TRIGGER;
        }
        return state;

      case FsmState.AWAITING_DATA_FETCH_TRIGGER:
        if (event.type === 'TRIGGER_DATA_FETCH') {
          logDebug('FSM_PIPELINE', `Reducer: TRIGGER_DATA_FETCH. Transitioning to FETCHING_DATA.`);
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
          logDebug('FSM_PIPELINE', `Reducer: FETCH_DATA_SUCCESS. Transitioning to DATA_FETCH_SUCCEEDED.`);
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
          if (currentIsFullAnalysisTriggered) {
            contextSetters.setChatbotRequestJson(skippedJson); contextSetters.setChatbotResponseJson(skippedJson);
          }
          logDebug('FSM_PIPELINE', `Reducer: FETCH_DATA_FAILURE. Error: ${errorMsg}. Transitioning to DATA_FETCH_FAILED.`);
          return FsmState.DATA_FETCH_FAILED;
        }
         if (event.type === 'STALE_DATA_FROM_ACTION') { // Handle new error event
          const { error, message, expectedTicker, foundTickerInSnapshot } = event.payload;
          logDebug('FSM_PIPELINE', `Reducer: STALE_DATA_FROM_ACTION detected. Expected: ${expectedTicker}, Found: ${foundTickerInSnapshot}. Error: ${error}. Msg: ${message}`);
          // Set all relevant data to error/skipped states
          const staleErrorJson = errorJsonWithDetails(message, `Expected ${expectedTicker}, got ${foundTickerInSnapshot || 'unknown'} from action state.`);
          contextSetters.setMarketStatusJson(staleErrorJson);
          contextSetters.setStockSnapshotJson(staleErrorJson);
          contextSetters.setStandardTasJson(staleErrorJson);
          contextSetters.setOptionsChainJson(staleErrorJson);
          // Skip subsequent AI steps
          const skippedDueToStale = createSkippedJson("stale_action_data", message);
          contextSetters.setAiAnalyzedTaRequestJson(skippedDueToStale); contextSetters.setAiAnalyzedTaJson(skippedDueToStale);
          contextSetters.setAiKeyTakeawaysRequestJson(skippedDueToStale); contextSetters.setAiKeyTakeawaysJson(skippedDueToStale);
          contextSetters.setAiOptionsAnalysisRequestJson(skippedDueToStale); contextSetters.setAiOptionsAnalysisJson(skippedDueToStale);
          if (currentIsFullAnalysisTriggered) {
            contextSetters.setChatbotRequestJson(skippedDueToStale); contextSetters.setChatbotResponseJson(skippedDueToStale);
          }
          return FsmState.STALE_DATA_FROM_ACTION_ERROR;
        }
        return state;
      
      case FsmState.DATA_FETCH_SUCCEEDED:
        if (event.type === 'INITIATE_AI_TA_SEQUENCE') {
            logDebug('FSM_PIPELINE', `Reducer: DATA_FETCH_SUCCEEDED handling INITIATE_AI_TA_SEQUENCE. Setting AI TA placeholders to '${pendingJson}'.`);
            contextSetters.setAiAnalyzedTaRequestJson(pendingJson);
            contextSetters.setAiAnalyzedTaJson(pendingJson);
            logDebug('FSM_PIPELINE', 'Reducer: Correctly returning AWAITING_AI_TA_TRIGGER from DATA_FETCH_SUCCEEDED');
            return FsmState.AWAITING_AI_TA_TRIGGER;
        }
        return state;
      case FsmState.DATA_FETCH_FAILED:
      case FsmState.STALE_DATA_FROM_ACTION_ERROR: // New error state handling
        if (event.type === 'PROCEED_TO_IDLE') { 
            logDebug('FSM_PIPELINE', `Reducer: ${state} -> IDLE on PROCEED_TO_IDLE.`);
            _setIsFullAnalysisTriggeredInternalState(false);
            return FsmState.IDLE;
        }
        return state; 

      case FsmState.AWAITING_AI_TA_TRIGGER:
        if (event.type === 'TRIGGER_AI_TA') {
          logDebug('FSM_PIPELINE', `Reducer: TRIGGER_AI_TA. Transitioning to ANALYZING_TA.`);
          return FsmState.ANALYZING_TA;
        }
        if (event.type === 'AI_TA_FAILURE') { 
            const errorPayload = event.payload; const errorMsg = errorPayload.message || 'AI TA failed (consistency check in AWAITING)';
            const taErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
            contextSetters.setAiAnalyzedTaRequestJson(errorPayload.aiAnalyzedTaRequestJson || taErrorJson); contextSetters.setAiAnalyzedTaJson(taErrorJson);
            const skippedJson = createSkippedJson("ai_ta_consistency", errorMsg);
            contextSetters.setAiKeyTakeawaysRequestJson(skippedJson); contextSetters.setAiKeyTakeawaysJson(skippedJson);
            contextSetters.setAiOptionsAnalysisRequestJson(skippedJson); contextSetters.setAiOptionsAnalysisJson(skippedJson);
            if (currentIsFullAnalysisTriggered) {
              contextSetters.setChatbotRequestJson(skippedJson); contextSetters.setChatbotResponseJson(skippedJson);
            }
            logDebug('FSM_PIPELINE', `Reducer: AI_TA_FAILURE (from AWAITING). Error: ${errorMsg}. Transitioning to AI_TA_FAILED.`);
            return FsmState.AI_TA_FAILED;
        }
        return state;
        
      case FsmState.ANALYZING_TA:
        if (event.type === 'AI_TA_SUCCESS') {
          contextSetters.setAiAnalyzedTaRequestJson(event.payload.aiAnalyzedTaRequestJson);
          contextSetters.setAiAnalyzedTaJson(event.payload.aiAnalyzedTaJson);
          logDebug('FSM_PIPELINE', `Reducer: AI_TA_SUCCESS. Transitioning to AI_TA_SUCCEEDED.`);
          return FsmState.AI_TA_SUCCEEDED;
        }
        if (event.type === 'AI_TA_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'AI TA analysis failed';
          const taErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiAnalyzedTaRequestJson(errorPayload.aiAnalyzedTaRequestJson || taErrorJson); contextSetters.setAiAnalyzedTaJson(taErrorJson);
          const skippedJson = createSkippedJson("ai_ta", errorMsg);
          contextSetters.setAiKeyTakeawaysRequestJson(skippedJson); contextSetters.setAiKeyTakeawaysJson(skippedJson);
          contextSetters.setAiOptionsAnalysisRequestJson(skippedJson); contextSetters.setAiOptionsAnalysisJson(skippedJson);
          if (currentIsFullAnalysisTriggered) {
            contextSetters.setChatbotRequestJson(skippedJson); contextSetters.setChatbotResponseJson(skippedJson);
          }
          logDebug('FSM_PIPELINE', `Reducer: AI_TA_FAILURE. Error: ${errorMsg}. Transitioning to AI_TA_FAILED.`);
          return FsmState.AI_TA_FAILED;
        }
        return state;

      case FsmState.AI_TA_SUCCEEDED:
      case FsmState.AI_TA_FAILED: 
        if (event.type === 'INITIATE_KEY_TAKEAWAYS_SEQUENCE') {
            logDebug('FSM_PIPELINE', `Reducer: ${state} got INITIATE_KEY_TAKEAWAYS_SEQUENCE. Setting Key Takeaways placeholders to '${pendingJson}'.`);
            contextSetters.setAiKeyTakeawaysRequestJson(pendingJson);
            contextSetters.setAiKeyTakeawaysJson(pendingJson);
            return FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER;
        }
        return state;

      case FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER:
        if (event.type === 'TRIGGER_KEY_TAKEAWAYS') {
          logDebug('FSM_PIPELINE', `Reducer: TRIGGER_KEY_TAKEAWAYS. Transitioning to GENERATING_KEY_TAKEAWAYS.`);
          return FsmState.GENERATING_KEY_TAKEAWAYS;
        }
        if (event.type === 'KEY_TAKEAWAYS_FAILURE') { 
            const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Key Takeaways failed (consistency check)';
            const ktErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
            contextSetters.setAiKeyTakeawaysRequestJson(errorPayload.aiKeyTakeawaysRequestJson || ktErrorJson); contextSetters.setAiKeyTakeawaysJson(ktErrorJson);
            const skippedJson = createSkippedJson("key_takeaways_consistency", errorMsg);
            contextSetters.setAiOptionsAnalysisRequestJson(skippedJson); contextSetters.setAiOptionsAnalysisJson(skippedJson);
             if (currentIsFullAnalysisTriggered) {
              contextSetters.setChatbotRequestJson(skippedJson); contextSetters.setChatbotResponseJson(skippedJson);
            }
            logDebug('FSM_PIPELINE', `Reducer: KEY_TAKEAWAYS_FAILURE (from AWAITING). Error: ${errorMsg}. Transitioning to KEY_TAKEAWAYS_FAILED.`);
            return FsmState.KEY_TAKEAWAYS_FAILED;
        }
        return state;

      case FsmState.GENERATING_KEY_TAKEAWAYS:
        if (event.type === 'KEY_TAKEAWAYS_SUCCESS') {
          contextSetters.setAiKeyTakeawaysRequestJson(event.payload.aiKeyTakeawaysRequestJson);
          contextSetters.setAiKeyTakeawaysJson(event.payload.aiKeyTakeawaysJson);
           logDebug('FSM_PIPELINE', `Reducer: KEY_TAKEAWAYS_SUCCESS. Transitioning to KEY_TAKEAWAYS_SUCCEEDED.`);
          return FsmState.KEY_TAKEAWAYS_SUCCEEDED;
        }
        if (event.type === 'KEY_TAKEAWAYS_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Key Takeaways generation failed';
          const ktErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiKeyTakeawaysRequestJson(errorPayload.aiKeyTakeawaysRequestJson || ktErrorJson); contextSetters.setAiKeyTakeawaysJson(ktErrorJson);
          const skippedJson = createSkippedJson("key_takeaways", errorMsg);
          contextSetters.setAiOptionsAnalysisRequestJson(skippedJson); contextSetters.setAiOptionsAnalysisJson(skippedJson);
           if (currentIsFullAnalysisTriggered) {
            contextSetters.setChatbotRequestJson(skippedJson); contextSetters.setChatbotResponseJson(skippedJson);
          }
          logDebug('FSM_PIPELINE', `Reducer: KEY_TAKEAWAYS_FAILURE. Error: ${errorMsg}. Transitioning to KEY_TAKEAWAYS_FAILED.`);
          return FsmState.KEY_TAKEAWAYS_FAILED;
        }
        return state;

      case FsmState.KEY_TAKEAWAYS_SUCCEEDED:
      case FsmState.KEY_TAKEAWAYS_FAILED:
        if (event.type === 'INITIATE_OPTIONS_ANALYSIS_SEQUENCE') {
            logDebug('FSM_PIPELINE', `Reducer: ${state} got INITIATE_OPTIONS_ANALYSIS_SEQUENCE. Setting Options Analysis placeholders to '${pendingJson}'.`);
            contextSetters.setAiOptionsAnalysisRequestJson(pendingJson);
            contextSetters.setAiOptionsAnalysisJson(pendingJson);
            return FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER;
        }
        return state;
        
      case FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER:
        if (event.type === 'TRIGGER_OPTIONS_ANALYSIS') {
          logDebug('FSM_PIPELINE', `Reducer: TRIGGER_OPTIONS_ANALYSIS. Transitioning to ANALYZING_OPTIONS.`);
          return FsmState.ANALYZING_OPTIONS;
        }
         if (event.type === 'OPTIONS_ANALYSIS_FAILURE') { 
            const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Options Analysis failed (consistency check)';
            const optErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
            contextSetters.setAiOptionsAnalysisRequestJson(errorPayload.aiOptionsAnalysisRequestJson || optErrorJson); contextSetters.setAiOptionsAnalysisJson(optErrorJson);
            const skippedJson = createSkippedJson("options_analysis_consistency", errorMsg);
            if (currentIsFullAnalysisTriggered) {
              contextSetters.setChatbotRequestJson(skippedJson); contextSetters.setChatbotResponseJson(skippedJson);
            }
            logDebug('FSM_PIPELINE', `Reducer: OPTIONS_ANALYSIS_FAILURE (from AWAITING). Error: ${errorMsg}. Transitioning to OPTIONS_ANALYSIS_FAILED.`);
            return FsmState.OPTIONS_ANALYSIS_FAILED;
        }
        return state;

      case FsmState.ANALYZING_OPTIONS:
        if (event.type === 'OPTIONS_ANALYSIS_SUCCESS') {
          contextSetters.setAiOptionsAnalysisRequestJson(event.payload.aiOptionsAnalysisRequestJson);
          contextSetters.setAiOptionsAnalysisJson(event.payload.aiOptionsAnalysisJson);
          logDebug('FSM_PIPELINE', `Reducer: OPTIONS_ANALYSIS_SUCCESS. Transitioning to OPTIONS_ANALYSIS_SUCCEEDED.`);
          return FsmState.OPTIONS_ANALYSIS_SUCCEEDED;
        }
        if (event.type === 'OPTIONS_ANALYSIS_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Options Analysis failed';
          const optErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setAiOptionsAnalysisRequestJson(errorPayload.aiOptionsAnalysisRequestJson || optErrorJson); contextSetters.setAiOptionsAnalysisJson(optErrorJson);
          const skippedJson = createSkippedJson("options_analysis", errorMsg);
           if (currentIsFullAnalysisTriggered) {
            contextSetters.setChatbotRequestJson(skippedJson); contextSetters.setChatbotResponseJson(skippedJson);
          }
           logDebug('FSM_PIPELINE', `Reducer: OPTIONS_ANALYSIS_FAILURE. Error: ${errorMsg}. Transitioning to OPTIONS_ANALYSIS_FAILED.`);
          return FsmState.OPTIONS_ANALYSIS_FAILED;
        }
        return state;

      case FsmState.OPTIONS_ANALYSIS_SUCCEEDED:
      case FsmState.OPTIONS_ANALYSIS_FAILED:
        if (event.type === 'INITIATE_CHAT_SUMMARY_SEQUENCE' && currentIsFullAnalysisTriggered) { 
            logDebug('FSM_PIPELINE', `Reducer: ${state} (Full Analysis) got INITIATE_CHAT_SUMMARY_SEQUENCE. Setting Chat Summary placeholders to '${pendingJson}'.`);
            contextSetters.setChatbotRequestJson(pendingJson);
            contextSetters.setChatbotResponseJson(pendingJson);
            return FsmState.AWAITING_CHAT_SUMMARY_TRIGGER;
        }
        if (event.type === 'PROCEED_TO_ANALYZE_STOCK_COMPLETE' && !currentIsFullAnalysisTriggered) { 
            logDebug('FSM_PIPELINE', `Reducer: ${state} (Partial Analysis) handling PROCEED_TO_ANALYZE_STOCK_COMPLETE. Transitioning to ANALYZE_STOCK_COMPLETE.`);
            return FsmState.ANALYZE_STOCK_COMPLETE;
        }
        return state;
      
      case FsmState.AWAITING_CHAT_SUMMARY_TRIGGER:
        if (event.type === 'TRIGGER_CHAT_SUMMARY') {
          logDebug('FSM_PIPELINE', `Reducer: TRIGGER_CHAT_SUMMARY. Transitioning to GENERATING_CHAT_SUMMARY.`);
          return FsmState.GENERATING_CHAT_SUMMARY;
        }
        if (event.type === 'CHAT_SUMMARY_FAILURE') { 
            const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Chat Summary failed (consistency check)';
            const chatErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
            contextSetters.setChatbotRequestJson(errorPayload.requestJson || chatErrorJson); contextSetters.setChatbotResponseJson(chatErrorJson);
            logDebug('FSM_PIPELINE', `Reducer: CHAT_SUMMARY_FAILURE (from AWAITING). Error: ${errorMsg}. Transitioning to CHAT_SUMMARY_FAILED.`);
            return FsmState.CHAT_SUMMARY_FAILED;
        }
        return state;

      case FsmState.GENERATING_CHAT_SUMMARY:
        if (event.type === 'CHAT_SUMMARY_SUCCESS') {
          contextSetters.setChatbotRequestJson(event.payload.requestJson);
          contextSetters.setChatbotResponseJson(JSON.stringify({ summaryText: event.payload.summaryText }, null, 2));
          _setChatHistory([{ id: 'summary_0', role: 'model', content: event.payload.summaryText }]);
          logDebug('FSM_PIPELINE', `Reducer: CHAT_SUMMARY_SUCCESS. Transitioning to CHAT_SUMMARY_SUCCEEDED.`);
          return FsmState.CHAT_SUMMARY_SUCCEEDED;
        }
        if (event.type === 'CHAT_SUMMARY_FAILURE') {
          const errorPayload = event.payload; const errorMsg = errorPayload.message || 'Chat summary generation failed';
          const chatErrorJson = errorJsonWithDetails(errorMsg, errorPayload.error);
          contextSetters.setChatbotRequestJson(errorPayload.requestJson || chatErrorJson); contextSetters.setChatbotResponseJson(chatErrorJson);
          logDebug('FSM_PIPELINE', `Reducer: CHAT_SUMMARY_FAILURE. Error: ${errorMsg}. Transitioning to CHAT_SUMMARY_FAILED.`);
          return FsmState.CHAT_SUMMARY_FAILED;
        }
        return state;

      case FsmState.CHAT_SUMMARY_SUCCEEDED:
      case FsmState.CHAT_SUMMARY_FAILED:
        if (event.type === 'PROCEED_TO_FULL_COMPLETE') {
            logDebug('FSM_PIPELINE', `Reducer: ${state} handling PROCEED_TO_FULL_COMPLETE. Transitioning to FULL_ANALYSIS_COMPLETE.`);
            return FsmState.FULL_ANALYSIS_COMPLETE;
        }
        return state;
      
      case FsmState.ANALYZE_STOCK_COMPLETE: 
      case FsmState.FULL_ANALYSIS_COMPLETE:
        if (event.type === 'PROCEED_TO_IDLE') {
            logDebug('FSM_PIPELINE', `Reducer: ${state} handling PROCEED_TO_IDLE. Resetting isFullAnalysisTriggered. Transitioning to IDLE.`);
             _setIsFullAnalysisTriggeredInternalState(false); 
            return FsmState.IDLE;
        }
        return state;
      default:
        logDebug('FSM_PIPELINE', `Unhandled state in FSM reducer: ${state} for event ${event.type}`);
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
    logDebug('StockAnalysisContext', `ClientDebugConsoleEnabled will be set to: ${enabled}.`);
    _setClientDebugConsoleEnabled(enabled);
    if (enabled) {
      logDebug('StockAnalysisContext', `ClientDebugConsoleEnabled is true, calling enableAllLogSources and opening console.`);
      enableAllLogSources();
      _setClientDebugConsoleOpen(true); 
    } else {
      logDebug('StockAnalysisContext', `ClientDebugConsoleEnabled is false, ensuring console is closed and buffer cleared.`);
      _setClientDebugConsoleOpen(false);
      clearGlobalLogBuffer(); 
    }
  }, [_setClientDebugConsoleEnabled, _setClientDebugConsoleOpen, enableAllLogSources, logDebug]);


  const setClientDebugConsoleOpen = useCallback((open: boolean) => {
    logDebug('StockAnalysisContext', `ClientDebugConsoleOpen will be set to: ${open}. Current isClientDebugConsoleEnabled: ${_isClientDebugConsoleEnabled}`);
    if (_isClientDebugConsoleEnabled || !open) { 
        _setClientDebugConsoleOpen(open);
    } else if (!_isClientDebugConsoleEnabled && open) {
        logDebug('StockAnalysisContext', 'Attempted to open console while it is disabled. Opening action will be ignored.');
    }
  }, [_isClientDebugConsoleEnabled, _setClientDebugConsoleOpen, logDebug]);

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
        if (!_isClientDebugConsoleEnabled) return; 

        let source: LogSourceId = 'NATIVE_CONSOLE';
        let messagesForBuffer = args;
        let logTypeForBuffer = type;

        if (args.length > 0 && args[0] === LOGDEBUG_MARKER) {
          source = args[1] as LogSourceId;
          messagesForBuffer = args.slice(2);
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
  }, [_isClientDebugConsoleEnabled, _logSourceConfig, logDebug]); 

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
    clearChatHistory: clearChatHistoryInternal, addChatMessage,
    
    isClientDebugConsoleEnabled: _isClientDebugConsoleEnabled, isClientDebugConsoleOpen: _isClientDebugConsoleOpen,
    logSourceConfig: _logSourceConfig,
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

