
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  category?: string; 
}

export const CONSOLE_HEIGHT = 250; 

interface StockAnalysisState {
  polygonApiRequestLogJson: string;
  polygonApiResponseLogJson: string;
  isClientDebugConsoleEnabled: boolean; // Added state variable
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
  isClientDebugConsoleOpen: boolean;
  clientLogs: LogEntry[];
}

interface StockAnalysisContextType extends StockAnalysisState {
  setPolygonApiRequestLogJson: (json: string) => void;
  setPolygonApiResponseLogJson: (json: string) => void;
  setClientDebugConsoleEnabled: (isEnabled: boolean) => void; // Added setter
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
  setClientDebugConsoleOpen: (isOpen: boolean) => void;
  addClientLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearClientLogs: () => void;
}

const initialJsonPlaceholder = '{ "status": "initializing..." }';

const defaultState: StockAnalysisState = {
  polygonApiRequestLogJson: initialJsonPlaceholder,
  polygonApiResponseLogJson: initialJsonPlaceholder,
  isClientDebugConsoleEnabled: true, // Initialize to true by default
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
  isClientDebugConsoleOpen: false,
  clientLogs: [],
};

const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

export function StockAnalysisProvider({ children }: { children: ReactNode }) {
  const [polygonApiRequestLogJson, _setPolygonApiRequestLogJson] = useState<string>(defaultState.polygonApiRequestLogJson);
  const [polygonApiResponseLogJson, _setPolygonApiResponseLogJson] = useState<string>(defaultState.polygonApiResponseLogJson);
  const [isClientDebugConsoleEnabled, _setClientDebugConsoleEnabled] = useState<boolean>(defaultState.isClientDebugConsoleEnabled); // Add state variable
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
  const [isClientDebugConsoleOpen, _setClientDebugConsoleOpen] = useState<boolean>(defaultState.isClientDebugConsoleOpen);
  const [clientLogs, setClientLogs] = useState<LogEntry[]>(defaultState.clientLogs);

  const addClientLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setClientLogs(prevLogs => {
      const newLog: LogEntry = {
        ...log,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
      };
      return [newLog, ...prevLogs].slice(0, 500); 
    });
  }, []);

  useEffect(() => {
    if (isClientDebugConsoleEnabled) {
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
      
      // Only log this if interception is enabled
      originalConsoleDebug("[StockAnalysisProvider] Console interception enabled.");
    }

    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      console.info = originalConsoleInfo;
      console.debug = originalConsoleDebug;
    };
  }, [addClientLog, isClientDebugConsoleEnabled]); // Add isClientDebugConsoleEnabled as dependency

  const setAndLog = (setter: React.Dispatch<React.SetStateAction<string>>, name: string, value: string) => {
    const originalConsoleDebug = (console as any).__originalDebug || console.debug; // Access original if available, fallback otherwise
    originalConsoleDebug(`[StockAnalysisContext] Setting ${name} to:`, value.substring(0,100) + (value.length > 100 ? '...' : ''));
    setter(value);
  };

  const setPolygonApiRequestLogJson = (json: string) => setAndLog(_setPolygonApiRequestLogJson, 'polygonApiRequestLogJson', json);
  const setPolygonApiResponseLogJson = (json: string) => setAndLog(_setPolygonApiResponseLogJson, 'polygonApiResponseLogJson', json);
  const setMarketStatusJson = (json: string) => setAndLog(_setMarketStatusJson, 'marketStatusJson', json);
  const setStockSnapshotJson = (json: string) => setAndLog(_setStockSnapshotJson, 'stockSnapshotJson', json);
  const setStandardTasJson = (json: string) => setAndLog(_setStandardTasJson, 'standardTasJson', json);
  const setOptionsChainJson = (json: string) => setAndLog(_setOptionsChainJson, 'optionsChainJson', json);
  const setAiCalculatedTaRequestJson = (json: string) => setAndLog(_setAiCalculatedTaRequestJson, 'aiCalculatedTaRequestJson', json);
  const setAiCalculatedTaJson = (json: string) => setAndLog(_setAiCalculatedTaJson, 'aiCalculatedTaJson', json);
  const setAiKeyTakeawaysRequestJson = (json: string) => setAndLog(_setAiKeyTakeawaysRequestJson, 'aiKeyTakeawaysRequestJson', json);
  const setAiKeyTakeawaysJson = (json: string) => setAndLog(_setAiKeyTakeawaysJson, 'aiKeyTakeawaysJson', json);
  const setChatbotRequestJson = (json: string) => setAndLog(_setChatbotRequestJson, 'chatbotRequestJson', json);
  const setChatbotResponseJson = (json: string) => setAndLog(_setChatbotResponseJson, 'chatbotResponseJson', json);

  const setClientDebugConsoleOpen = (isOpen: boolean) => {
    console.debug(`[StockAnalysisContext] Setting clientDebugConsoleOpen to: ${isOpen}`);
    _setClientDebugConsoleOpen(isOpen);
  };

  const setClientDebugConsoleEnabled = (isEnabled: boolean) => {
    console.debug(`[StockAnalysisContext] Setting clientDebugConsoleEnabled to: ${isEnabled}`);
    _setClientDebugConsoleEnabled(isEnabled);
  };

  const clearClientLogs = useCallback(() => {
    setClientLogs([]);
  }, []);

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
    isClientDebugConsoleOpen, setClientDebugConsoleOpen, isClientDebugConsoleEnabled, setClientDebugConsoleEnabled,
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
