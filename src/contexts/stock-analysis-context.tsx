
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

  clientLogs: [],
  isClientDebugConsoleEnabled: false,
  isClientDebugConsoleOpen: false,
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


  const setAndLogJson = (setter: React.Dispatch<React.SetStateAction<string>>, name: string, value: string) => {
    // console.debug(`[StockAnalysisContext] Setting JSON ${name} to:`, value.substring(0,100) + (value.length > 100 ? '...' : ''));
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

  const setFullAnalysisStatus = (status: FullAnalysisStatus) => {
    _setFullAnalysisStatus(status);
  };
  const setIsFullAnalysisTriggered = (triggered: boolean) => {
    _setIsFullAnalysisTriggered(triggered);
  };

  const setChatHistory = (history: ChatMessage[]) => {
    _setChatHistory(history);
  };

  const clearChatHistory = useCallback(() => {
    _setChatHistory([]);
  }, []);

  const addChatMessage = useCallback((message: ChatMessage) => {
    _setChatHistory(prev => [...prev, message]);
  }, []);

  // Debug Console Logic
  const addClientLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    _setClientLogs(prevLogs => [
      ...prevLogs,
      {
        ...log,
        id: Date.now().toString() + Math.random().toString(36).substring(2), // Simple unique ID
        timestamp: new Date().toISOString(),
      },
    ].slice(-200)); // Keep last 200 logs
  }, []);

  const clearClientLogs = useCallback(() => {
    _setClientLogs([]);
  }, []);

  const setClientDebugConsoleEnabled = (enabled: boolean) => {
    _setClientDebugConsoleEnabled(enabled);
    if (!enabled) { // Also close if disabling entirely
        _setClientDebugConsoleOpen(false);
    }
  };
  const setClientDebugConsoleOpen = (open: boolean) => {
    if (isClientDebugConsoleEnabled || !open) { // Can only open if enabled, can always close
        _setClientDebugConsoleOpen(open);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !isClientDebugConsoleEnabled) {
      return;
    }

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };

    const interceptAndLog = (type: LogEntry['type'], ...args: any[]) => {
      // Prevent logging calls originating from the logger itself to avoid infinite loops
      if (args.some(arg => typeof arg === 'string' && arg.startsWith('[DebugConsoleInterceptor]'))) {
        originalConsole[type](...args);
        return;
      }
      
      // Add to internal logs state
      addClientLog({ type, messages: args });
      // Call original console method
      originalConsole[type](...args);
    };

    console.log = (...args) => interceptAndLog('log', ...args);
    console.warn = (...args) => interceptAndLog('warn', ...args);
    console.error = (...args) => interceptAndLog('error', ...args);
    console.info = (...args) => interceptAndLog('info', ...args);
    console.debug = (...args) => interceptAndLog('debug', ...args);
    
    originalConsole.debug('[DebugConsoleInterceptor] Console interception enabled.');

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
      originalConsole.debug('[DebugConsoleInterceptor] Console interception disabled, originals restored.');
    };
  }, [isClientDebugConsoleEnabled, addClientLog]);


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
    clearChatHistory,
    addChatMessage,

    clientLogs,
    isClientDebugConsoleEnabled,
    isClientDebugConsoleOpen,
    addClientLog,
    clearClientLogs,
    setClientDebugConsoleEnabled,
    setClientDebugConsoleOpen,
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
