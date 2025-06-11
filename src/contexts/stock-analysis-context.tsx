
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DebugLogCategory, type DebugLogConfig, defaultDebugLogConfig } from '@/lib/debug-log-types';
import { addEntryToGlobalLogBuffer } from '@/lib/global-log-buffer';

// Marker for logs originating from our logDebug utility
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

// Keep a reference to the original console methods
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

  // Debug Console Control State (not the logs themselves)
  isClientDebugConsoleEnabled: boolean;
  isClientDebugConsoleOpen: boolean;
  debugLogConfig: DebugLogConfig;
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

  // Debug Console Actions
  setClientDebugConsoleEnabled: (enabled: boolean) => void;
  setClientDebugConsoleOpen: (open: boolean) => void;
  setDebugLogCategoryEnabled: (category: DebugLogCategory, enabled: boolean) => void;
  logDebug: (category: DebugLogCategory, ...messages: any[]) => void;
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
  debugLogConfig: defaultDebugLogConfig,
};

const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

export function StockAnalysisProvider({ children }: { children: ReactNode }) {
  const [polygonApiRequestLogJson, _setPolygonApiRequestLogJson] = useState<string>(defaultState.polygonApiRequestLogJson);
  const [polygonApiResponseLogJson, _setPolygonApiResponseLogJson] = useState<string>(defaultState.polygonApiResponseLogJson);
  const [marketStatusJson, _setMarketStatusJson] = useState<string>(defaultState.marketStatusJson);
  const [stockSnapshotJson, _setStockSnapshotJson] = useState<string>(defaultState.stockSnapshotJson);
  const [standardTasJson, _setStandardTasJson] = useState<string>(defaultState.standardTasJson);
  const [optionsChainJson, _setOptionsChainJson] = useState<string>(defaultState.optionsChainJson);
  const [aiCalculatedTaRequestJson, _setAiCalculatedTaRequestJson] = useState<string>(defaultState.aiCalculatedTaRequestJson);
  const [aiCalculatedTaJson, _setAiCalculatedTaJson] = useState<string>(defaultState.aiCalculatedTaJson);
  const [aiKeyTakeawaysRequestJson, _setAiKeyTakeawaysRequestJson] = useState<string>(defaultState.aiKeyTakeawaysRequestJson);
  const [aiKeyTakeawaysJson, _setAiKeyTakeawaysJson] = useState<string>(defaultState.aiKeyTakeawaysJson);
  const [chatbotRequestJson, _setChatbotRequestJson] = useState<string>(defaultState.chatbotRequestJson);
  const [chatbotResponseJson, _setChatbotResponseJson] = useState<string>(defaultState.chatbotResponseJson);
  const [fullAnalysisStatus, _setFullAnalysisStatus] = useState<FullAnalysisStatus>(defaultState.fullAnalysisStatus);
  const [isFullAnalysisTriggered, _setIsFullAnalysisTriggered] = useState<boolean>(defaultState.isFullAnalysisTriggered);
  const [chatHistory, _setChatHistory] = useState<ChatMessage[]>(defaultState.chatHistory);
  const [isClientDebugConsoleEnabled, _setClientDebugConsoleEnabled] = useState<boolean>(defaultState.isClientDebugConsoleEnabled);
  const [isClientDebugConsoleOpen, _setClientDebugConsoleOpen] = useState<boolean>(defaultState.isClientDebugConsoleOpen);
  const [debugLogConfig, _setDebugLogConfig] = useState<DebugLogConfig>(defaultState.debugLogConfig);

  const logDebug = useCallback((category: DebugLogCategory, ...messages: any[]) => {
    // This function now simply calls the wrapped console.debug with a marker.
    // The actual filtering and logging to global buffer is handled by the interceptor.
    console.debug(LOGDEBUG_MARKER, category, ...messages);
  }, []); // No dependencies needed here as it just calls the global console

  const setAndLogJson = (setter: React.Dispatch<React.SetStateAction<string>>, name: string, value: string) => {
    logDebug(DebugLogCategory.CONTEXT_INTERNALS, `Setting ${name} to:`, value.substring(0, 100));
    setter(value);
  };

  const setPolygonApiRequestLogJson = (json: string) => setAndLogJson(_setPolygonApiRequestLogJson, 'polygonApiRequestLogJson', json);
  const setPolygonApiResponseLogJson = (json: string) => setAndLogJson(_setPolygonApiResponseLogJson, 'polygonApiResponseLogJson', json);
  const setMarketStatusJson = (json: string) => setAndLogJson(_setMarketStatusJson, 'marketStatusJson', json);
  const setStockSnapshotJson = (json: string) => setAndLogJson(_setStockSnapshotJson, 'stockSnapshotJson', json);
  const setStandardTasJson = (json: string) => setAndLogJson(_setStandardTasJson, 'standardTasJson', json);
  const setOptionsChainJson = (json: string) => setAndLogJson(_setOptionsChainJson, 'optionsChainJson', json);
  const setAiCalculatedTaRequestJson = (json: string) => setAndLogJson(_setAiCalculatedTaRequestJson, 'aiCalculatedTaRequestJson', json);
  const setAiCalculatedTaJson = (json: string) => setAndLogJson(_setAiCalculatedTaJson, 'aiCalculatedTaJson', json);
  const setAiKeyTakeawaysRequestJson = (json: string) => setAndLogJson(_setAiKeyTakeawaysRequestJson, 'aiKeyTakeawaysRequestJson', json);
  const setAiKeyTakeawaysJson = (json: string) => setAndLogJson(_setAiKeyTakeawaysJson, 'aiKeyTakeawaysJson', json);
  const setChatbotRequestJson = (json: string) => setAndLogJson(_setChatbotRequestJson, 'chatbotRequestJson', json);
  const setChatbotResponseJson = (json: string) => setAndLogJson(_setChatbotResponseJson, 'chatbotResponseJson', json);
  const setFullAnalysisStatus = (status: FullAnalysisStatus) => _setFullAnalysisStatus(status);
  const setIsFullAnalysisTriggered = (triggered: boolean) => _setIsFullAnalysisTriggered(triggered);
  const setChatHistory = (history: ChatMessage[]) => _setChatHistory(history);
  const clearChatHistory = useCallback(() => _setChatHistory([]), []);
  const addChatMessage = useCallback((message: ChatMessage) => _setChatHistory(prev => [...prev, message]), []);

  const setClientDebugConsoleEnabled = (enabled: boolean) => {
    _setClientDebugConsoleEnabled(enabled);
    if (!enabled) _setClientDebugConsoleOpen(false);
  };
  const setClientDebugConsoleOpen = (open: boolean) => {
    if (isClientDebugConsoleEnabled || !open) _setClientDebugConsoleOpen(open);
  };
  const setDebugLogCategoryEnabled = useCallback((category: DebugLogCategory, enabled: boolean) => {
    _setDebugLogConfig(prevConfig => ({ ...prevConfig, [category]: enabled }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isClientDebugConsoleEnabled) {
      if ((console as any).__stockSageOriginals) {
        Object.assign(console, (console as any).__stockSageOriginals);
        delete (console as any).__stockSageOriginals;
        browserConsole.debug('[DebugConsoleInterceptor] Console interception disabled, originals restored.');
      }
      return;
    }

    if (!(console as any).__stockSageOriginals) {
      (console as any).__stockSageOriginals = { ...browserConsole };
    }
    const currentOriginals = (console as any).__stockSageOriginals;

    const interceptAndProcessLog = (
      type: 'log' | 'warn' | 'error' | 'info' | 'debug',
      ...args: any[]
    ) => {
      // Always pass through to native console synchronously
      currentOriginals[type](...args);

      // Asynchronously process for our UI console
      queueMicrotask(() => {
        if (!isClientDebugConsoleEnabled) return; // Re-check in case it was disabled during microtask

        let category: DebugLogCategory | undefined = undefined;
        let messagesForBuffer = args;

        if (args.length > 0 && args[0] === LOGDEBUG_MARKER) {
          // This log came from our logDebug utility
          category = args[1] as DebugLogCategory;
          messagesForBuffer = args.slice(2);
          if (!debugLogConfig[category]) {
            return; // Category is disabled
          }
        } else {
          // This is a generic console call
          category = DebugLogCategory.NATIVE_CONSOLE;
          if (!debugLogConfig[DebugLogCategory.NATIVE_CONSOLE]) {
            return; // Native console logging category is disabled
          }
        }
        addEntryToGlobalLogBuffer({ type, messages: messagesForBuffer, category });
      });
    };

    console.log = (...args) => interceptAndProcessLog('log', ...args);
    console.warn = (...args) => interceptAndProcessLog('warn', ...args);
    console.error = (...args) => interceptAndProcessLog('error', ...args);
    console.info = (...args) => interceptAndProcessLog('info', ...args);
    console.debug = (...args) => interceptAndProcessLog('debug', ...args);
    
    browserConsole.debug('[DebugConsoleInterceptor] Console interception enabled.');

    return () => {
      if ((console as any).__stockSageOriginals) {
        Object.assign(console, (console as any).__stockSageOriginals);
        delete (console as any).__stockSageOriginals;
        browserConsole.debug('[DebugConsoleInterceptor] Console interception disabled on cleanup, originals restored.');
      }
    };
  }, [isClientDebugConsoleEnabled, debugLogConfig]); // debugLogConfig is a dependency for filtering

  const contextValue: StockAnalysisContextType = {
    polygonApiRequestLogJson, setPolygonApiRequestLogJson,
    polygonApiResponseLogJson, setPolygonApiResponseLogJson,
    marketStatusJson, setMarketStatusJson,
    stockSnapshotJson, setStockSnapshotJson,
    standardTasJson, setStandardTasJson,
    optionsChainJson, setOptionsChainJson,
    aiCalculatedTaRequestJson, setAiCalculatedTaRequestJson,
    aiCalculatedTaJson, setAiCalculatedTaJson,
    aiKeyTakeawaysRequestJson, setAiKeyTakeawaysRequestJson,
    aiKeyTakeawaysJson, setAiKeyTakeawaysJson,
    chatbotRequestJson, setChatbotRequestJson,
    chatbotResponseJson, setChatbotResponseJson,
    fullAnalysisStatus, setFullAnalysisStatus,
    isFullAnalysisTriggered, setIsFullAnalysisTriggered,
    chatHistory, setChatHistory,
    clearChatHistory, addChatMessage,
    isClientDebugConsoleEnabled, isClientDebugConsoleOpen,
    debugLogConfig, 
    setClientDebugConsoleEnabled, setClientDebugConsoleOpen,
    setDebugLogCategoryEnabled, logDebug,
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
