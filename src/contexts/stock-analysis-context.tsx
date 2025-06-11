
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DebugLogCategory, type DebugLogConfig, defaultDebugLogConfig } from '@/lib/debug-log-types';

export type FullAnalysisStatus =
  | 'idle'
  | 'pending' // Initial state when button is clicked
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

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  messages: any[];
  category?: DebugLogCategory; // Optional category for debug logs
}

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

  // Debug Console State
  clientLogs: LogEntry[];
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
  addClientLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearClientLogs: () => void;
  setClientDebugConsoleEnabled: (enabled: boolean) => void;
  setClientDebugConsoleOpen: (open: boolean) => void;
  setDebugLogCategoryEnabled: (category: DebugLogCategory, enabled: boolean) => void;
  logDebug: (category: DebugLogCategory, ...messages: any[]) => void;
}

const initialJsonPlaceholder = '{ "status": "initializing..." }';

// Keep a reference to the original console methods
const browserConsole = {
  log: typeof console !== 'undefined' ? console.log : () => {},
  warn: typeof console !== 'undefined' ? console.warn : () => {},
  error: typeof console !== 'undefined' ? console.error : () => {},
  info: typeof console !== 'undefined' ? console.info : () => {},
  debug: typeof console !== 'undefined' ? console.debug : () => {},
};


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

  clientLogs: [],
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

  const [clientLogs, _setClientLogs] = useState<LogEntry[]>(defaultState.clientLogs);
  const [isClientDebugConsoleEnabled, _setClientDebugConsoleEnabled] = useState<boolean>(defaultState.isClientDebugConsoleEnabled);
  const [isClientDebugConsoleOpen, _setClientDebugConsoleOpen] = useState<boolean>(defaultState.isClientDebugConsoleOpen);
  const [debugLogConfig, _setDebugLogConfig] = useState<DebugLogConfig>(defaultState.debugLogConfig);

  const addClientLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    // This update is already deferred by queueMicrotask in the interceptor for application logs
    _setClientLogs(prevLogs => [
      ...prevLogs,
      {
        ...log,
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        timestamp: new Date().toISOString(),
      },
    ].slice(-200));
  }, []);

  const logDebug = useCallback((category: DebugLogCategory, ...messages: any[]) => {
    if (isClientDebugConsoleEnabled && debugLogConfig[category]) {
      console.debug(`[${category}]`, ...messages);
    }
  }, [isClientDebugConsoleEnabled, debugLogConfig]);

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

  const clearClientLogs = useCallback(() => _setClientLogs([]), []);
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
    if (typeof window === 'undefined' || !isClientDebugConsoleEnabled) {
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

    const interceptAndLog = (type: LogEntry['type'], ...args: any[]) => {
      const isSelfLog = args.some(arg => typeof arg === 'string' && arg.startsWith('[DebugConsoleInterceptor]'));

      if (isSelfLog) {
        currentOriginals[type](...args); // Interceptor's own logs go directly to native console
        return;
      }
      
      // For application logs, queue both adding to our UI log and calling the original console
      queueMicrotask(() => {
        let categoryForLog: DebugLogCategory | undefined = undefined;
        let messagesForLog = args;
        if (type === 'debug' && args.length > 0 && typeof args[0] === 'string' && args[0].startsWith('[') && args[0].endsWith(']')) {
            const potentialCategoryKey = args[0].substring(1, args[0].length - 1);
            if (Object.values(DebugLogCategory).includes(potentialCategoryKey as DebugLogCategory)) {
              categoryForLog = potentialCategoryKey as DebugLogCategory;
              messagesForLog = args.slice(1);
            }
        }
        addClientLog({ type, messages: messagesForLog, category: categoryForLog });
        currentOriginals[type](...args);
      });
    };

    console.log = (...args) => interceptAndLog('log', ...args);
    console.warn = (...args) => interceptAndLog('warn', ...args);
    console.error = (...args) => interceptAndLog('error', ...args);
    console.info = (...args) => interceptAndLog('info', ...args);
    console.debug = (...args) => interceptAndLog('debug', ...args);
    
    currentOriginals.debug('[DebugConsoleInterceptor] Console interception enabled.');

    return () => {
      if ((console as any).__stockSageOriginals) {
        Object.assign(console, (console as any).__stockSageOriginals);
        delete (console as any).__stockSageOriginals;
        browserConsole.debug('[DebugConsoleInterceptor] Console interception disabled on cleanup, originals restored.');
      }
    };
  }, [isClientDebugConsoleEnabled, addClientLog, debugLogConfig]); // debugLogConfig added as it's used in logDebug, which is called by setAndLogJson

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
    clientLogs, isClientDebugConsoleEnabled, isClientDebugConsoleOpen,
    debugLogConfig, addClientLog, clearClientLogs,
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
