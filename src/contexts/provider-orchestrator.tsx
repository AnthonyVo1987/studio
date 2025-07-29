"use client";

/**
 * @fileOverview Provider Orchestrator
 * 
 * Dynamically wraps active ticker providers around the application
 * to avoid provider nesting issues and only load contexts for
 * active ticker tabs.
 * 
 * Features:
 * - Dynamic provider composition based on active tickers
 * - Prevents provider nesting conflicts
 * - Only loads contexts for enabled tickers
 * - Automatic provider cleanup when tickers are disabled
 * - Type-safe provider composition
 */

import React, { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { tickerRegistry, useTickerRegistry } from '@/lib/ticker-registry';

/**
 * Provider information for orchestration
 */
interface ProviderInfo {
  ticker: string;
  Provider: React.FC<{ children: ReactNode }>;
  order: number;
  displayName: string;
}

/**
 * Orchestrator context for accessing provider information
 */
interface ProviderOrchestratorContext {
  providers: ProviderInfo[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const OrchestratorContext = createContext<ProviderOrchestratorContext | null>(null);

/**
 * Hook to access provider orchestrator context
 */
export function useProviderOrchestrator() {
  const context = useContext(OrchestratorContext);
  if (!context) {
    throw new Error('useProviderOrchestrator must be used within a ProviderOrchestrator');
  }
  return context;
}

/**
 * Compose multiple providers into a nested structure
 * Innermost provider comes first in the array
 */
function composeProviders(providers: ProviderInfo[]): React.FC<{ children: ReactNode }> {
  return ({ children }) => {
    // Sort providers by order to ensure consistent nesting
    const sortedProviders = [...providers].sort((a, b) => a.order - b.order);
    
    // Build nested provider structure
    return sortedProviders.reduceRight(
      (acc, { Provider }) => <Provider>{acc}</Provider>,
      children
    ) as React.ReactElement;
  };
}

/**
 * Provider orchestrator props
 */
interface ProviderOrchestratorProps {
  children: ReactNode;
  
  /**
   * Callback when providers change
   */
  onProvidersChange?: (providers: ProviderInfo[]) => void;
  
  /**
   * Custom loading component while providers are being loaded
   */
  loadingComponent?: React.ComponentType;
  
  /**
   * Custom error component for provider loading errors
   */
  errorComponent?: React.ComponentType<{ error: string; onRetry: () => void }>;
}

/**
 * Default loading component
 */
function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading ticker providers...</p>
      </div>
    </div>
  );
}

/**
 * Default error component
 */
function DefaultErrorComponent({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4 text-center max-w-md">
        <div className="rounded-full bg-destructive/10 p-3">
          <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-destructive mb-2">Provider Load Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main provider orchestrator component
 */
export function ProviderOrchestrator({
  children,
  onProvidersChange,
  loadingComponent: LoadingComponent = DefaultLoadingComponent,
  errorComponent: ErrorComponent = DefaultErrorComponent,
}: ProviderOrchestratorProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ComposedProvider, setComposedProvider] = useState<React.FC<{ children: ReactNode }> | null>(null);
  
  const registry = useTickerRegistry();
  
  // Load providers on mount and when registry changes
  useEffect(() => {
    loadProviders();
  }, []);
  
  const loadProviders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[ProviderOrchestrator] Loading ticker providers...');
      
      // Get all providers from registry
      const providerData = await tickerRegistry.getAllProviders();
      
      console.log(`[ProviderOrchestrator] Found ${providerData.length} providers:`, 
        providerData.map(p => p.ticker));
      
      // Transform to provider info
      const providerInfos: ProviderInfo[] = [];
      
      for (const { ticker, Provider, order } of providerData) {
        const tickerEntry = await registry.getTicker(ticker);
        
        if (tickerEntry && tickerEntry.status === 'loaded') {
          providerInfos.push({
            ticker,
            Provider,
            order,
            displayName: tickerEntry.config.displayName,
          });
        }
      }
      
      console.log('[ProviderOrchestrator] Successfully loaded providers:', 
        providerInfos.map(p => `${p.ticker} (order: ${p.order})`));
      
      // Update state
      setProviders(providerInfos);
      
      // Compose providers
      if (providerInfos.length > 0) {
        const composed = composeProviders(providerInfos);
        setComposedProvider(() => composed);
      } else {
        // No providers, just pass through children
        setComposedProvider(() => ({ children }: { children: ReactNode }) => <>{children}</>);
      }
      
      // Notify callback
      onProvidersChange?.(providerInfos);
      
    } catch (err) {
      console.error('[ProviderOrchestrator] Failed to load providers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Provide orchestrator context
  const contextValue: ProviderOrchestratorContext = {
    providers,
    isLoading,
    error,
    reload: loadProviders,
  };
  
  // Show loading state
  if (isLoading || !ComposedProvider) {
    return (
      <OrchestratorContext.Provider value={contextValue}>
        <LoadingComponent />
      </OrchestratorContext.Provider>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <OrchestratorContext.Provider value={contextValue}>
        <ErrorComponent error={error} onRetry={loadProviders} />
      </OrchestratorContext.Provider>
    );
  }
  
  // Render with composed providers
  return (
    <OrchestratorContext.Provider value={contextValue}>
      <ComposedProvider>
        {children}
      </ComposedProvider>
    </OrchestratorContext.Provider>
  );
}

/**
 * HOC for wrapping components with provider orchestrator
 */
export function withProviderOrchestrator<P extends object>(
  Component: React.ComponentType<P>
) {
  const WrappedComponent = (props: P) => (
    <ProviderOrchestrator>
      <Component {...props} />
    </ProviderOrchestrator>
  );
  
  WrappedComponent.displayName = `withProviderOrchestrator(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Debug component for inspecting provider orchestration
 */
export function ProviderOrchestratorDebug() {
  const { providers, isLoading, error } = useProviderOrchestrator();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 max-w-sm p-4 bg-background border rounded-lg shadow-lg text-sm">
      <h3 className="font-semibold mb-2">Provider Orchestrator</h3>
      
      {isLoading && <p className="text-muted-foreground">Loading providers...</p>}
      
      {error && (
        <p className="text-destructive mb-2">Error: {error}</p>
      )}
      
      {providers.length > 0 && (
        <div>
          <p className="font-medium mb-1">Active Providers ({providers.length}):</p>
          <ul className="space-y-1">
            {providers.map((provider, index) => (
              <li key={provider.ticker} className="text-xs text-muted-foreground">
                {index + 1}. {provider.ticker} ({provider.displayName})
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {providers.length === 0 && !isLoading && (
        <p className="text-muted-foreground">No providers loaded</p>
      )}
    </div>
  );
}

/**
 * Utility functions for provider management
 */
export const ProviderOrchestratorUtils = {
  /**
   * Get provider nesting order for debugging
   */
  getProviderNestingOrder: (providers: ProviderInfo[]): string[] => {
    return [...providers]
      .sort((a, b) => a.order - b.order)
      .map(p => p.ticker);
  },
  
  /**
   * Validate provider configuration
   */
  validateProviders: (providers: ProviderInfo[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check for duplicate tickers
    const tickers = providers.map(p => p.ticker);
    const duplicates = tickers.filter((ticker, index) => tickers.indexOf(ticker) !== index);
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate tickers found: ${duplicates.join(', ')}`);
    }
    
    // Check for missing providers
    const missingProviders = providers.filter(p => !p.Provider);
    if (missingProviders.length > 0) {
      errors.push(`Missing Provider components for: ${missingProviders.map(p => p.ticker).join(', ')}`);
    }
    
    // Check for invalid orders
    const invalidOrders = providers.filter(p => typeof p.order !== 'number' || p.order < 0);
    if (invalidOrders.length > 0) {
      errors.push(`Invalid order values for: ${invalidOrders.map(p => p.ticker).join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
  
  /**
   * Create provider composition preview
   */
  getCompositionPreview: (providers: ProviderInfo[]): string => {
    const sorted = [...providers].sort((a, b) => a.order - b.order);
    
    let preview = 'children';
    for (const provider of sorted.reverse()) {
      preview = `<${provider.ticker}Provider>${preview}</${provider.ticker}Provider>`;
    }
    
    return preview;
  },
};