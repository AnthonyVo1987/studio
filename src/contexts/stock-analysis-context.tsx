
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { type LogSourceId, type LogSourceConfig, defaultLogSourceConfig } from '@/lib/debug-log-types';
import { addEntryToGlobalLogBuffer, clearGlobalLogBuffer, GlobalLogEntry } from '@/lib/global-log-buffer';

const LOGDEBUG_MARKER = '__LOGDEBUG_MARKER__';

export type FullAnalysisStatus =
  | 'idle'
  | 'pending'
  | 'fetchingData'
  | 'calculatingAiTa'
  | 'generatingTakeaways'
  | 'chatting'
  | 'success'
  | 'error';

export interface ChatMessage {
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
  aiCalculatedTaRequestJson: string;
  aiCalculatedTaJson: string;
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
}

interface StockAnalysisContextType extends StockAnalysisState {
  setPolygonApiRequestLogJson: (json: string) => void;
  setPolygonApiResponseLogJson: (json: string) => void;
  setMarketStatusJson: (json: string) => void;
  setStockSnapshotJson: (json: string) => void;
  setStandardTasJson: (json: string) => void;
  setOptionsChainJson: (json: string) => void;
  setAiCalculatedTaRequestJson: (json: string) => void;
  setAiCalculatedTaJson: (json: string) => void;
  setAiKeyTakeawaysRequestJson: (json: string) => void;
  setAiKeyTakeawaysJson: (json: string) => void;
  setChatbotRequestJson: (json: string) => void;
  setChatbotResponseJson: (json: string) => void;

  setFullAnalysisStatus: (status: FullAnalysisStatus) => void;
  setIsFullAnalysisTriggered: (triggered: boolean) => void;
  setChatHistory: (history: ChatMessage[]) => void;
  clearChatHistory: () => void;
  addChatMessage: (message: ChatMessage) => void;

  setClientDebugConsoleEnabled: (enabled: boolean) => void;
  setClientDebugConsoleOpen: (open: boolean) => void;
  setLogSourceEnabled: (source: LogSourceId, enabled: boolean) => void;
  logDebug: (source: LogSourceId, ...messages: any[]) => void;
}

const initialJsonPlaceholder = '{ "status": "initializing..." }';

const defaultState: StockAnalysisState = {
  polygonApiRequestLogJson: initialJsonPlaceholder,
  polygonApiResponseLogJson: initialJsonPlaceholder,
  marketStatusJson: initialJsonPlaceholder,
  stockSnapshotJson: initialJsonPlaceholder,
  standardTasJson: initialJsonPlaceholder,
  optionsChainJson: initialJsonPlaceholder,
  aiCalculatedTaRequestJson: initialJsonPlaceholder,
  aiCalculatedTaJson: initialJsonPlaceholder,
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
};

const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

export function StockAnalysisProvider({ children }: { children: ReactNode }) {
  const [_polygonApiRequestLogJson, _setPolygonApiRequestLogJson] = useState<string>(defaultState.polygonApiRequestLogJson);
  const [_polygonApiResponseLogJson, _setPolygonApiResponseLogJson] = useState<string>(defaultState.polygonApiResponseLogJson);
  const [_marketStatusJson, _setMarketStatusJson] = useState<string>(defaultState.marketStatusJson);
  const [_stockSnapshotJson, _setStockSnapshotJson] = useState<string>(defaultState.stockSnapshotJson);
  const [_standardTasJson, _setStandardTasJson] = useState<string>(defaultState.standardTasJson);
  const [_optionsChainJson, _setOptionsChainJson] = useState<string>(defaultState.optionsChainJson);
  const [_aiCalculatedTaRequestJson, _setAiCalculatedTaRequestJson] = useState<string>(defaultState.aiCalculatedTaRequestJson);
  const [_aiCalculatedTaJson, _setAiCalculatedTaJson] = useState<string>(defaultState.aiCalculatedTaJson);
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
    logDebug('StockAnalysisContext', `Setting ${name} to:`, value.substring(0, 100));
    setter(value);
  }, [logDebug]);

  const setPolygonApiRequestLogJson = useCallback((json: string) => setAndLogJson(_setPolygonApiRequestLogJson, 'polygonApiRequestLogJson', json), [_setPolygonApiRequestLogJson, setAndLogJson]);
  const setPolygonApiResponseLogJson = useCallback((json: string) => setAndLogJson(_setPolygonApiResponseLogJson, 'polygonApiResponseLogJson', json), [_setPolygonApiResponseLogJson, setAndLogJson]);
  const setMarketStatusJson = useCallback((json: string) => setAndLogJson(_setMarketStatusJson, 'marketStatusJson', json), [_setMarketStatusJson, setAndLogJson]);
  const setStockSnapshotJson = useCallback((json: string) => setAndLogJson(_setStockSnapshotJson, 'stockSnapshotJson', json), [_setStockSnapshotJson, setAndLogJson]);
  const setStandardTasJson = useCallback((json: string) => setAndLogJson(_setStandardTasJson, 'standardTasJson', json), [_setStandardTasJson, setAndLogJson]);
  const setOptionsChainJson = useCallback((json: string) => setAndLogJson(_setOptionsChainJson, 'optionsChainJson', json), [_setOptionsChainJson, setAndLogJson]);
  const setAiCalculatedTaRequestJson = useCallback((json: string) => setAndLogJson(_setAiCalculatedTaRequestJson, 'aiCalculatedTaRequestJson', json), [_setAiCalculatedTaRequestJson, setAndLogJson]);
  const setAiCalculatedTaJson = useCallback((json: string) => setAndLogJson(_setAiCalculatedTaJson, 'aiCalculatedTaJson', json), [_setAiCalculatedTaJson, setAndLogJson]);
  const setAiKeyTakeawaysRequestJson = useCallback((json: string) => setAndLogJson(_setAiKeyTakeawaysRequestJson, 'aiKeyTakeawaysRequestJson', json), [_setAiKeyTakeawaysRequestJson, setAndLogJson]);
  const setAiKeyTakeawaysJson = useCallback((json: string) => setAndLogJson(_setAiKeyTakeawaysJson, 'aiKeyTakeawaysJson', json), [_setAiKeyTakeawaysJson, setAndLogJson]);
  const setChatbotRequestJson = useCallback((json: string) => setAndLogJson(_setChatbotRequestJson, 'chatbotRequestJson', json), [_setChatbotRequestJson, setAndLogJson]);
  const setChatbotResponseJson = useCallback((json: string) => setAndLogJson(_setChatbotResponseJson, 'chatbotResponseJson', json), [_setChatbotResponseJson, setAndLogJson]);

  const setFullAnalysisStatus = useCallback((status: FullAnalysisStatus) => _setFullAnalysisStatus(status), [_setFullAnalysisStatus]);
  const setIsFullAnalysisTriggered = useCallback((triggered: boolean) => _setIsFullAnalysisTriggered(triggered), [_setIsFullAnalysisTriggered]);
  const setChatHistory = useCallback((history: ChatMessage[]) => _setChatHistory(history), [_setChatHistory]);
  const clearChatHistory = useCallback(() => _setChatHistory([]), [_setChatHistory]);
  const addChatMessage = useCallback((message: ChatMessage) => _setChatHistory(prev => [...prev, message]), [_setChatHistory]);

  const setClientDebugConsoleEnabled = useCallback((enabled: boolean) => {
    _setClientDebugConsoleEnabled(enabled);
    if (!enabled) {
      _setClientDebugConsoleOpen(false);
      clearGlobalLogBuffer(); 
    }
  }, [_setClientDebugConsoleEnabled, _setClientDebugConsoleOpen]);

  const setClientDebugConsoleOpen = useCallback((open: boolean) => {
    if (isClientDebugConsoleEnabled || !open) { // Only allow opening if enabled, or always allow closing
        _setClientDebugConsoleOpen(open);
    }
  }, [isClientDebugConsoleEnabled, _setClientDebugConsoleOpen]);

  const setLogSourceEnabled = useCallback((source: LogSourceId, enabled: boolean) => {
    _setLogSourceConfig(prevConfig => ({ ...prevConfig, [source]: enabled }));
  }, [_setLogSourceConfig]);

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
      // Check if this log call is from the interceptor itself to avoid infinite loops
      if (args.length > 0 && args[0] === LOGDEBUG_MARKER && args[1] === 'StockAnalysisContext' && args[2] === 'Console Interceptor Native Call') {
        currentOriginals[type](...args.slice(3)); // Log only the message part
        return;
      }
      
      currentOriginals[type](...args); // Always log to native console immediately

      queueMicrotask(() => {
        if (!isClientDebugConsoleEnabled) return; // Master switch

        let source: LogSourceId = 'NATIVE_CONSOLE';
        let messagesForBuffer = args;
        let logTypeForBuffer = type;

        if (args.length > 0 && args[0] === LOGDEBUG_MARKER) {
          source = args[1] as LogSourceId;
          messagesForBuffer = args.slice(2);
          logTypeForBuffer = 'debug'; // Logs from logDebug are always 'debug' type for buffer
          if (!logSourceConfig[source]) {
            return; // Specific source is disabled
          }
        } else {
          // This is a general console.x call not from our logDebug
          if (!logSourceConfig['NATIVE_CONSOLE']) {
            return; // Native console passthrough is disabled for UI console
          }
        }
        addEntryToGlobalLogBuffer({ type: logTypeForBuffer, messages: messagesForBuffer, source });
      });
    };
    
    if (isClientDebugConsoleEnabled) { // This only controls if we add to buffer, not interception itself
      console.log = (...args) => interceptAndProcessLog('log', ...args);
      console.warn = (...args) => interceptAndProcessLog('warn', ...args);
      console.error = (...args) => interceptAndProcessLog('error', ...args);
      console.info = (...args) => interceptAndProcessLog('info', ...args);
      console.debug = (...args) => interceptAndProcessLog('debug', ...args);
      logDebug('StockAnalysisContext', 'Console Interceptor Native Call', 'Console interception active (for UI buffer).');
    } else {
      // Restore original console methods if they were overridden
      if ((console as any).__stockSageOriginals) {
        Object.assign(console, (console as any).__stockSageOriginals);
         // No logDebug here as it might be restored
         currentOriginals.debug('[StockAnalysisContext]', 'Console Interceptor Native Call', 'Console interception for UI buffer disabled, originals restored.');
        // Keep __stockSageOriginals so we know they were stored
      }
    }

    return () => {
      // On cleanup, always restore originals if they exist
      if ((console as any).__stockSageOriginals) {
        Object.assign(console, (console as any).__stockSageOriginals);
        // No logDebug here as it might be restored
        currentOriginals.debug('[StockAnalysisContext]', 'Console Interceptor Native Call', 'Console interception disabled on cleanup, originals restored.');
        // Optionally delete: delete (console as any).__stockSageOriginals; 
        // but keeping it might be safer if component re-mounts rapidly
      }
    };
  }, [isClientDebugConsoleEnabled, logSourceConfig, logDebug]); // logDebug is stable, logSourceConfig changes

  const contextValue: StockAnalysisContextType = {
    polygonApiRequestLogJson: _polygonApiRequestLogJson, setPolygonApiRequestLogJson,
    polygonApiResponseLogJson: _polygonApiResponseLogJson, setPolygonApiResponseLogJson,
    marketStatusJson: _marketStatusJson, setMarketStatusJson,
    stockSnapshotJson: _stockSnapshotJson, setStockSnapshotJson,
    standardTasJson: _standardTasJson, setStandardTasJson,
    optionsChainJson: _optionsChainJson, setOptionsChainJson,
    aiCalculatedTaRequestJson: _aiCalculatedTaRequestJson, setAiCalculatedTaRequestJson,
    aiCalculatedTaJson: _aiCalculatedTaJson, setAiCalculatedTaJson,
    aiKeyTakeawaysRequestJson: _aiKeyTakeawaysRequestJson, setAiKeyTakeawaysRequestJson,
    aiKeyTakeawaysJson: _aiKeyTakeawaysJson, setAiKeyTakeawaysJson,
    chatbotRequestJson: _chatbotRequestJson, setChatbotRequestJson,
    chatbotResponseJson: _chatbotResponseJson, setChatbotResponseJson,
    
    fullAnalysisStatus, setFullAnalysisStatus,
    isFullAnalysisTriggered, setIsFullAnalysisTriggered,
    chatHistory, setChatHistory,
    clearChatHistory, addChatMessage,
    
    isClientDebugConsoleEnabled, isClientDebugConsoleOpen,
    logSourceConfig,
    setClientDebugConsoleEnabled, setClientDebugConsoleOpen,
    setLogSourceEnabled, logDebug,
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
