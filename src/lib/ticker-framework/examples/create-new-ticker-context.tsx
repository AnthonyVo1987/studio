/**
 * @fileOverview Example: Creating a New Ticker Context
 * 
 * This example demonstrates how to use the context factory to create
 * a new ticker-specific context for your application.
 */

import { createTickerContext } from '../core/context-factory';
import type { TickerConfig, StrikeCount } from '../core/types';

// Step 1: Define your ticker configuration
const msftConfig: TickerConfig = {
  ticker: 'MSFT',
  displayName: 'Microsoft Corporation',
  defaultStrikeCount: 30,
  defaultTableDisplay: 'side-by-side',
  customSettings: {
    // Add any ticker-specific settings here
    sector: 'Technology',
    marketCap: 'Large Cap',
  },
};

// Step 2: Create the context using the factory
export const msftContext = createTickerContext(msftConfig);

// Step 3: Export the generated components and hooks
// These exports match the pattern used by NVDA/SPY contexts

// Provider component
export const MsftAnalysisProvider = msftContext.Provider;

// Custom hooks with ticker-specific names
export const useMsftAnalysis = msftContext.hooks.useState;
export const useMsftDispatch = msftContext.hooks.useDispatch;
export const useMsftAnalysisWithSetters = msftContext.hooks.useStateWithSetters;

// Export types for use in components
export type MsftAnalysisState = ReturnType<typeof useMsftAnalysis>;
export type MsftAnalysisDispatch = ReturnType<typeof useMsftDispatch>;

// Step 4: Example usage in a component
import React from 'react';

export const MsftDashboard: React.FC = () => {
  const state = useMsftAnalysis();
  const dispatch = useMsftDispatch();
  
  // Or use the combined hook for convenience
  // const { status, stockSnapshotJson, setLoading, setStockData } = useMsftAnalysisWithSetters();
  
  const handleFetchData = async () => {
    dispatch({ type: 'SET_LOADING' });
    
    try {
      // Fetch your data here
      const response = await fetch(`/api/stock/${msftConfig.ticker}`);
      const data = await response.json();
      
      dispatch({
        type: 'SET_STOCK_DATA',
        payload: {
          stockSnapshotJson: JSON.stringify(data.snapshot),
          marketStatusJson: JSON.stringify(data.marketStatus),
          standardTasJson: JSON.stringify(data.standardTA),
          aiAnalyzedTaJson: JSON.stringify(data.aiTA),
        },
      });
      
      dispatch({ type: 'SET_IDLE' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  };
  
  return (
    <div>
      <h1>{msftConfig.displayName} Analysis</h1>
      <p>Status: {state.status}</p>
      {state.error && <p>Error: {state.error}</p>}
      <button onClick={handleFetchData}>Fetch Data</button>
      
      {state.hasStockData && (
        <div>
          <h2>Stock Data</h2>
          <pre>{state.stockSnapshotJson}</pre>
        </div>
      )}
    </div>
  );
};

// Step 5: Example of creating multiple contexts at once
export function createMultipleTickerContexts() {
  const tickers: TickerConfig[] = [
    { ticker: 'AAPL', displayName: 'Apple Inc.', defaultStrikeCount: 40 },
    { ticker: 'GOOGL', displayName: 'Alphabet Inc.', defaultStrikeCount: 30 },
    { ticker: 'AMZN', displayName: 'Amazon.com Inc.', defaultStrikeCount: 35 as StrikeCount },
    { ticker: 'TSLA', displayName: 'Tesla Inc.', defaultStrikeCount: 50 as StrikeCount },
  ];
  
  const contexts = tickers.map(config => ({
    ticker: config.ticker,
    context: createTickerContext(config),
  }));
  
  return contexts;
}

// Step 6: Example of wrapping your app with the provider
export const App: React.FC = () => {
  return (
    <MsftAnalysisProvider>
      <MsftDashboard />
    </MsftAnalysisProvider>
  );
};

// Step 7: Example of using setter functions
export const MsftQuickActions: React.FC = () => {
  const {
    status,
    hasStockData,
    setLoading,
    setIdle,
    setError,
    setStockData,
    resetState,
  } = useMsftAnalysisWithSetters();
  
  return (
    <div>
      <h2>Quick Actions</h2>
      <button onClick={setLoading}>Set Loading</button>
      <button onClick={setIdle}>Set Idle</button>
      <button onClick={() => setError('Test error')}>Set Error</button>
      <button onClick={() => setStockData({
        stockSnapshotJson: '{"test": true}',
        marketStatusJson: '{}',
        standardTasJson: '{}',
        aiAnalyzedTaJson: '{}',
      })}>Set Test Data</button>
      <button onClick={resetState}>Reset State</button>
      
      <p>Current Status: {status}</p>
      <p>Has Stock Data: {hasStockData ? 'Yes' : 'No'}</p>
    </div>
  );
};