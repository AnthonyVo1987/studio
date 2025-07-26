'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useStockAnalysis, BusinessFsmState } from './business-logic-context';
import type { OptionType, StrikeCount, TableDisplayType } from './business-logic-context';

// UI-specific interfaces for transformed data
export interface UIStockSnapshot {
  ticker: string | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: string | null;
  previousClose: number | null;
  isDataReady: boolean;
  lastUpdated: string | null;
}

export interface UIMarketStatus {
  market: string;
  localDateTime: string;
  status: string;
  isOpen: boolean;
  nextOpenTime: string | null;
  nextCloseTime: string | null;
  isDataReady: boolean;
}

export interface UITechnicalAnalysis {
  indicators: Record<string, any>;
  signals: string[];
  recommendation: string | null;
  strength: number | null;
  isDataReady: boolean;
  lastUpdated: string | null;
}

export interface UIOptionsData {
  expirationDate: string | null;
  availableDates: string[];
  isLoadingDates: boolean;
  optionType: OptionType;
  strikeCount: StrikeCount;
  tableDisplayType: TableDisplayType;
  chainData: any;
  isDataReady: boolean;
  lastUpdated: string | null;
}

export interface UIAIAnalysis {
  keyTakeaways: any;
  optionsAnalysis: any;
  technicalAnalysis: any;
  isKeyTakeawaysReady: boolean;
  isOptionsAnalysisReady: boolean;
  isTechnicalAnalysisReady: boolean;
  lastUpdated: string | null;
}

export interface UILoadingStates {
  isAnalyzing: boolean;
  isFetchingData: boolean;
  isCalculatingTA: boolean;
  isGeneratingTakeaways: boolean;
  isAnalyzingOptions: boolean;
  currentStep: string | null;
  progress: number; // 0-100
}

export interface UIErrorState {
  hasError: boolean;
  message: string | null;
  source: string | null;
  canRetry: boolean;
}

// Main UI Snapshot interface - this is what UI components consume
export interface UISnapshot {
  version: number;
  timestamp: string;
  stockSnapshot: UIStockSnapshot;
  marketStatus: UIMarketStatus;
  technicalAnalysis: UITechnicalAnalysis;
  optionsData: UIOptionsData;
  aiAnalysis: UIAIAnalysis;
  loadingStates: UILoadingStates;
  errorState: UIErrorState;
  canAnalyze: boolean;
  activeTicker: string | null;
  userInputTicker: string;
  // Analysis toggle states
  isAiKeyTakeawaysSelected: boolean;
  isAiOptionsAnalysisSelected: boolean;
}

interface UIStateContextType {
  // Current snapshot for rendering
  currentSnapshot: UISnapshot;
  
  // Previous snapshot for comparison
  previousSnapshot: UISnapshot | null;
  
  // Pending snapshot (for lag mechanism debugging)
  pendingSnapshot: UISnapshot | null;
  
  // Snapshot history (last 5 for debugging)
  snapshotHistory: UISnapshot[];
  
  // Version counter
  snapshotVersion: number;
  
  // Methods to get specific UI data
  getStockDisplayData: () => UIStockSnapshot;
  getMarketStatusData: () => UIMarketStatus;
  getTechnicalAnalysisData: () => UITechnicalAnalysis;
  getOptionsDisplayData: () => UIOptionsData;
  getAIAnalysisData: () => UIAIAnalysis;
  getLoadingStates: () => UILoadingStates;
  getErrorState: () => UIErrorState;
  
  // UI-specific state setters (these don't affect business logic)
  updateOptionsUISettings: (settings: Partial<Pick<UIOptionsData, 'optionType' | 'strikeCount' | 'tableDisplayType'>>) => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

// Helper function to safely parse JSON with fallback
const safeParseJSON = (jsonString: string, fallback: any = {}) => {
  try {
    if (!jsonString || jsonString.trim() === '' || jsonString === '{ "status": "no_analysis_run_yet" }' || jsonString === '{ "status": "pending..." }') {
      return fallback;
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
};

// Helper function to extract stock data from snapshot JSON
const extractStockSnapshot = (stockSnapshotJson: string): UIStockSnapshot => {
  const data = safeParseJSON(stockSnapshotJson);
  
  if (!data.results || !data.results[0]) {
    return {
      ticker: null,
      price: null,
      change: null,
      changePercent: null,
      volume: null,
      marketCap: null,
      previousClose: null,
      isDataReady: false,
      lastUpdated: null,
    };
  }
  
  const result = data.results[0];
  return {
    ticker: result.ticker || null,
    price: result.value || null,
    change: result.todaysChange || null,
    changePercent: result.todaysChangePerc || null,
    volume: result.volume || null,
    marketCap: result.market_cap ? `$${(result.market_cap / 1e9).toFixed(2)}B` : null,
    previousClose: result.prevDay?.c || null,
    isDataReady: true,
    lastUpdated: result.updated || new Date().toISOString(),
  };
};

// Helper function to extract market status
const extractMarketStatus = (marketStatusJson: string): UIMarketStatus => {
  const data = safeParseJSON(marketStatusJson);
  
  if (!data.results) {
    return {
      market: 'Unknown',
      localDateTime: new Date().toISOString(),
      status: 'Unknown',
      isOpen: false,
      nextOpenTime: null,
      nextCloseTime: null,
      isDataReady: false,
    };
  }
  
  const result = data.results;
  return {
    market: result.market || 'stocks',
    localDateTime: result.serverTime || new Date().toISOString(),
    status: result.status || 'unknown',
    isOpen: result.status === 'open',
    nextOpenTime: result.nextOpenTime || null,
    nextCloseTime: result.nextCloseTime || null,
    isDataReady: true,
  };
};

// Helper function to extract technical analysis
const extractTechnicalAnalysis = (standardTasJson: string, aiAnalyzedTaJson: string): UITechnicalAnalysis => {
  const standardData = safeParseJSON(standardTasJson);
  const aiData = safeParseJSON(aiAnalyzedTaJson);
  
  return {
    indicators: standardData.values || {},
    signals: aiData.signals || [],
    recommendation: aiData.recommendation || null,
    strength: aiData.strength || null,
    isDataReady: !!standardData.values,
    lastUpdated: aiData.timestamp || new Date().toISOString(),
  };
};

export function UIStateProvider({ children }: { children: ReactNode }) {
  const businessContext = useStockAnalysis();
  
  // UI state version counter
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  
  // Snapshot history for debugging
  const [snapshotHistory, setSnapshotHistory] = useState<UISnapshot[]>([]);
  
  // Previous snapshot for comparison
  const [previousSnapshot, setPreviousSnapshot] = useState<UISnapshot | null>(null);
  
  // UI-only settings that don't affect business logic
  const [uiOptionsSettings, setUIOptionsSettings] = useState({
    optionType: 'both' as OptionType,
    strikeCount: 20 as StrikeCount,
    tableDisplayType: 'side-by-side' as TableDisplayType,
  });
  
  // Ref to track last business state for change detection
  const lastBusinessStateRef = useRef({
    fsmState: businessContext.fsmState,
    stockSnapshotJson: businessContext.stockSnapshotJson,
    marketStatusJson: businessContext.marketStatusJson,
    standardTasJson: businessContext.standardTasJson,
    optionsChainJson: businessContext.optionsChainJson,
    aiAnalyzedTaJson: businessContext.aiAnalyzedTaJson,
    aiKeyTakeawaysJson: businessContext.aiKeyTakeawaysJson,
    aiOptionsAnalysisJson: businessContext.aiOptionsAnalysisJson,
  });
  
  // Function to create a new UI snapshot from business context
  const createUISnapshot = useCallback((): UISnapshot => {
    const timestamp = new Date().toISOString();
    
    // Extract loading states based on FSM state
    const loadingStates: UILoadingStates = {
      isAnalyzing: [
        BusinessFsmState.DATA_FETCH_IN_PROGRESS,
        BusinessFsmState.CALCULATING_AI_TA,
        BusinessFsmState.GENERATING_KEY_TAKEAWAYS,
        BusinessFsmState.ANALYZING_OPTIONS,
      ].includes(businessContext.fsmState),
      isFetchingData: businessContext.fsmState === BusinessFsmState.DATA_FETCH_IN_PROGRESS,
      isCalculatingTA: businessContext.fsmState === BusinessFsmState.CALCULATING_AI_TA,
      isGeneratingTakeaways: businessContext.fsmState === BusinessFsmState.GENERATING_KEY_TAKEAWAYS,
      isAnalyzingOptions: businessContext.fsmState === BusinessFsmState.ANALYZING_OPTIONS,
      currentStep: businessContext.fsmState,
      progress: (() => {
        switch (businessContext.fsmState) {
          case BusinessFsmState.DATA_FETCH_IN_PROGRESS: return 25;
          case BusinessFsmState.CALCULATING_AI_TA: return 50;
          case BusinessFsmState.GENERATING_KEY_TAKEAWAYS: return 75;
          case BusinessFsmState.ANALYZING_OPTIONS: return 90;
          case BusinessFsmState.IDLE: return businessContext.fsmFlags.isSnapshotDataReady ? 100 : 0;
          default: return 0;
        }
      })(),
    };
    
    // Extract error state
    const errorState: UIErrorState = {
      hasError: !!businessContext.fsmVariables.lastError,
      message: businessContext.fsmVariables.lastError?.message || null,
      source: businessContext.fsmVariables.lastError?.source || null,
      canRetry: [BusinessFsmState.IDLE, BusinessFsmState.VALID_TICKER_ENTERED].includes(businessContext.fsmState),
    };
    
    return {
      version: snapshotVersion + 1,
      timestamp,
      stockSnapshot: extractStockSnapshot(businessContext.stockSnapshotJson),
      marketStatus: extractMarketStatus(businessContext.marketStatusJson),
      technicalAnalysis: extractTechnicalAnalysis(businessContext.standardTasJson, businessContext.aiAnalyzedTaJson),
      optionsData: {
        expirationDate: businessContext.selectedExpirationDate || null,
        availableDates: businessContext.availableExpirationDates,
        isLoadingDates: businessContext.isLoadingExpirations,
        optionType: uiOptionsSettings.optionType,
        strikeCount: uiOptionsSettings.strikeCount,
        tableDisplayType: uiOptionsSettings.tableDisplayType,
        chainData: safeParseJSON(businessContext.optionsChainJson),
        isDataReady: businessContext.fsmFlags.isOptionsChainDataReady,
        lastUpdated: timestamp,
      },
      aiAnalysis: {
        keyTakeaways: safeParseJSON(businessContext.aiKeyTakeawaysJson),
        optionsAnalysis: safeParseJSON(businessContext.aiOptionsAnalysisJson),
        technicalAnalysis: safeParseJSON(businessContext.aiAnalyzedTaJson),
        isKeyTakeawaysReady: businessContext.fsmFlags.isKeyTakeawaysDataAvailable,
        isOptionsAnalysisReady: businessContext.fsmFlags.isOptionsAnalysisDataAvailable,
        isTechnicalAnalysisReady: businessContext.fsmFlags.isCalculatedTADataReady,
        lastUpdated: timestamp,
      },
      loadingStates,
      errorState,
      canAnalyze: businessContext.fsmFlags.canAnalyzeStock,
      activeTicker: businessContext.fsmVariables.activeTicker,
      userInputTicker: businessContext.fsmVariables.userInputTicker,
      // Analysis toggle states
      isAiKeyTakeawaysSelected: businessContext.fsmFlags.isAiKeyTakeawaysSelected,
      isAiOptionsAnalysisSelected: businessContext.fsmFlags.isAiOptionsAnalysisSelected,
    };
  }, [businessContext, snapshotVersion, uiOptionsSettings]);
  
  // Current snapshot state
  const [currentSnapshot, setCurrentSnapshot] = useState<UISnapshot>(() => createUISnapshot());
  
  // Lag mechanism state
  const [pendingSnapshot, setPendingSnapshot] = useState<UISnapshot | null>(null);
  const lagTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to watch for business context changes and create new snapshots
  useEffect(() => {
    const currentBusinessState = {
      fsmState: businessContext.fsmState,
      stockSnapshotJson: businessContext.stockSnapshotJson,
      marketStatusJson: businessContext.marketStatusJson,
      standardTasJson: businessContext.standardTasJson,
      optionsChainJson: businessContext.optionsChainJson,
      aiAnalyzedTaJson: businessContext.aiAnalyzedTaJson,
      aiKeyTakeawaysJson: businessContext.aiKeyTakeawaysJson,
      aiOptionsAnalysisJson: businessContext.aiOptionsAnalysisJson,
    };
    
    // Check if any business state has changed
    const hasChanged = JSON.stringify(currentBusinessState) !== JSON.stringify(lastBusinessStateRef.current);
    
    if (hasChanged) {
      // Update the ref
      lastBusinessStateRef.current = currentBusinessState;
      
      // Create new snapshot
      const newSnapshot = createUISnapshot();
      
      // PHASE 4: Implement "1-step-behind" lag mechanism
      // Instead of immediately updating UI, introduce a small delay
      // This ensures UI updates are deterministic and race-condition free
      
      // Clear any existing timer
      if (lagTimerRef.current) {
        clearTimeout(lagTimerRef.current);
      }
      
      // Store the pending snapshot
      setPendingSnapshot(newSnapshot);
      
      // Apply UI update after a short delay (500ms)
      // This makes UI render "1 step behind" business logic changes
      lagTimerRef.current = setTimeout(() => {
        setPreviousSnapshot(currentSnapshot);
        setCurrentSnapshot(newSnapshot);
        setSnapshotVersion(prev => prev + 1);
        
        // Update history (keep last 5)
        setSnapshotHistory(prev => [newSnapshot, ...prev].slice(0, 5));
        
        console.log(`[UIStateContext] Applied lagged snapshot v${newSnapshot.version} (business state settled)`);
        setPendingSnapshot(null);
      }, 500);
      
      console.log(`[UIStateContext] Business state changed, queuing UI update for v${newSnapshot.version}`);
    }
  }, [businessContext, currentSnapshot, createUISnapshot]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (lagTimerRef.current) {
        clearTimeout(lagTimerRef.current);
      }
    };
  }, []);
  
  // UI-specific methods
  const getStockDisplayData = useCallback(() => currentSnapshot.stockSnapshot, [currentSnapshot]);
  const getMarketStatusData = useCallback(() => currentSnapshot.marketStatus, [currentSnapshot]);
  const getTechnicalAnalysisData = useCallback(() => currentSnapshot.technicalAnalysis, [currentSnapshot]);
  const getOptionsDisplayData = useCallback(() => currentSnapshot.optionsData, [currentSnapshot]);
  const getAIAnalysisData = useCallback(() => currentSnapshot.aiAnalysis, [currentSnapshot]);
  const getLoadingStates = useCallback(() => currentSnapshot.loadingStates, [currentSnapshot]);
  const getErrorState = useCallback(() => currentSnapshot.errorState, [currentSnapshot]);
  
  // UI settings updater (doesn't affect business logic)
  const updateOptionsUISettings = useCallback((settings: Partial<Pick<UIOptionsData, 'optionType' | 'strikeCount' | 'tableDisplayType'>>) => {
    setUIOptionsSettings(prev => ({ ...prev, ...settings }));
  }, []);
  
  const contextValue: UIStateContextType = useMemo(() => ({
    currentSnapshot,
    previousSnapshot,
    pendingSnapshot,
    snapshotHistory,
    snapshotVersion,
    getStockDisplayData,
    getMarketStatusData,
    getTechnicalAnalysisData,
    getOptionsDisplayData,
    getAIAnalysisData,
    getLoadingStates,
    getErrorState,
    updateOptionsUISettings,
  }), [
    currentSnapshot,
    previousSnapshot,
    pendingSnapshot,
    snapshotHistory,
    snapshotVersion,
    getStockDisplayData,
    getMarketStatusData,
    getTechnicalAnalysisData,
    getOptionsDisplayData,
    getAIAnalysisData,
    getLoadingStates,
    getErrorState,
    updateOptionsUISettings,
  ]);
  
  return (
    <UIStateContext.Provider value={contextValue}>
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
}

// Convenience hooks for specific UI data
export function useStockDisplayData() {
  const { getStockDisplayData } = useUIState();
  return getStockDisplayData();
}

export function useMarketStatusData() {
  const { getMarketStatusData } = useUIState();
  return getMarketStatusData();
}

export function useTechnicalAnalysisData() {
  const { getTechnicalAnalysisData } = useUIState();
  return getTechnicalAnalysisData();
}

export function useOptionsDisplayData() {
  const { getOptionsDisplayData } = useUIState();
  return getOptionsDisplayData();
}

export function useAIAnalysisData() {
  const { getAIAnalysisData } = useUIState();
  return getAIAnalysisData();
}

export function useLoadingStates() {
  const { getLoadingStates } = useUIState();
  return getLoadingStates();
}

export function useErrorState() {
  const { getErrorState } = useUIState();
  return getErrorState();
}