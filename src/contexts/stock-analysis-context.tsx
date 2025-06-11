
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// LogEntry and CONSOLE_HEIGHT are specific to the debug console, remove them.

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

  // Remove useEffect for console interception

  const setAndLog = (setter: React.Dispatch<React.SetStateAction<string>>, name: string, value: string) => {
    // Keep simple console.debug for server-side or if user manually uses browser devtools
    // console.debug(`[StockAnalysisContext] Setting ${name} to:`, value.substring(0,100) + (value.length > 100 ? '...' : ''));
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
