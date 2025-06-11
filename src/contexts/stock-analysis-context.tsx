
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  category?: string; // For future advanced filtering
}

// Define the shape of the context data
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
  // New state for client debug console
  isClientDebugConsoleOpen: boolean;
  clientLogs: LogEntry[];
}

// Define the shape of the context, including setters
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
  // New setters for client debug console
  setClientDebugConsoleOpen: (isOpen: boolean) => void;
  addClientLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearClientLogs: () => void;
}

const initialJsonPlaceholder = '{ "status": "initializing..." }';
export const CONSOLE_HEIGHT = 250; // px, can be adjusted

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
  // New defaults
  isClientDebugConsoleOpen: false,
  clientLogs: [],
};

const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

export function StockAnalysisProvider({ children }: { children: ReactNode }) {
  const [polygonApiRequestLogJson, setPolygonApiRequestLogJson] = useState<string>(defaultState.polygonApiRequestLogJson);
  const [polygonApiResponseLogJson, setPolygonApiResponseLogJson] = useState<string>(defaultState.polygonApiResponseLogJson);
  const [marketStatusJson, setMarketStatusJson] = useState<string>(defaultState.marketStatusJson);
  const [stockSnapshotJson, setStockSnapshotJson] = useState<string>(defaultState.stockSnapshotJson);
  const [standardTasJson, setStandardTasJson] = useState<string>(defaultState.standardTasJson);
  const [optionsChainJson, setOptionsChainJson] = useState<string>(defaultState.optionsChainJson);
  const [aiCalculatedTaRequestJson, setAiCalculatedTaRequestJson] = useState<string>(defaultState.aiCalculatedTaRequestJson);
  const [aiCalculatedTaJson, setAiCalculatedTaJson] = useState<string>(defaultState.aiCalculatedTaJson);
  const [aiKeyTakeawaysRequestJson, setAiKeyTakeawaysRequestJson] = useState<string>(defaultState.aiKeyTakeawaysRequestJson);
  const [aiKeyTakeawaysJson, setAiKeyTakeawaysJson] = useState<string>(defaultState.aiKeyTakeawaysJson);
  const [chatbotRequestJson, setChatbotRequestJson] = useState<string>(defaultState.chatbotRequestJson);
  const [chatbotResponseJson, setChatbotResponseJson] = useState<string>(defaultState.chatbotResponseJson);

  // Client Debug Console State
  const [isClientDebugConsoleOpen, setClientDebugConsoleOpen] = useState<boolean>(defaultState.isClientDebugConsoleOpen);
  const [clientLogs, setClientLogs] = useState<LogEntry[]>(defaultState.clientLogs);

  const addClientLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setClientLogs(prevLogs => {
      const newLog: LogEntry = {
        ...log,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
      };
      return [newLog, ...prevLogs].slice(0, 500); // Keep max 500 logs
    });
  }, []);

  const clearClientLogs = useCallback(() => {
    setClientLogs([]);
  }, []);

  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    const originalConsoleInfo = console.info;
    const originalConsoleDebug = console.debug;

    console.log = (...args: any[]) => {
      originalConsoleLog.apply(console, args);
      addClientLog({ type: 'log', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') });
    };
    console.warn = (...args: any[]) => {
      originalConsoleWarn.apply(console, args);
      addClientLog({ type: 'warn', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') });
    };
    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      addClientLog({ type: 'error', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') });
    };
     console.info = (...args: any[]) => {
      originalConsoleInfo.apply(console, args);
      addClientLog({ type: 'info', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') });
    };
    console.debug = (...args: any[]) => {
      originalConsoleDebug.apply(console, args);
      addClientLog({ type: 'debug', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') });
    };

    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      console.info = originalConsoleInfo;
      console.debug = originalConsoleDebug;
    };
  }, [addClientLog]);


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
    // Client Debug Console
    isClientDebugConsoleOpen, setClientDebugConsoleOpen,
    clientLogs, addClientLog, clearClientLogs,
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
