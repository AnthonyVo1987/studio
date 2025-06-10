
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

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

// Create the context with a default value
const StockAnalysisContext = createContext<StockAnalysisContextType | undefined>(undefined);

// Create the provider component
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

  const contextValue: StockAnalysisContextType = {
    polygonApiRequestLogJson,
    setPolygonApiRequestLogJson,
    polygonApiResponseLogJson,
    setPolygonApiResponseLogJson,
    marketStatusJson,
    setMarketStatusJson,
    stockSnapshotJson,
    setStockSnapshotJson,
    standardTasJson,
    setStandardTasJson,
    optionsChainJson,
    setOptionsChainJson,
    aiCalculatedTaRequestJson,
    setAiCalculatedTaRequestJson,
    aiCalculatedTaJson,
    setAiCalculatedTaJson,
    aiKeyTakeawaysRequestJson,
    setAiKeyTakeawaysRequestJson,
    aiKeyTakeawaysJson,
    setAiKeyTakeawaysJson,
    chatbotRequestJson,
    setChatbotRequestJson,
    chatbotResponseJson,
    setChatbotResponseJson,
  };

  return (
    <StockAnalysisContext.Provider value={contextValue}>
      {children}
    </StockAnalysisContext.Provider>
  );
}

// Create a custom hook to use the context
export function useStockAnalysis() {
  const context = useContext(StockAnalysisContext);
  if (context === undefined) {
    throw new Error('useStockAnalysis must be used within a StockAnalysisProvider');
  }
  return context;
}
