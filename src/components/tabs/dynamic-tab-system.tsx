"use client";

/**
 * @fileOverview Dynamic Tab System
 * 
 * Replaces hardcoded ticker tabs with dynamic loading based on
 * ticker registry configuration. Provides lazy loading, error
 * boundaries, and seamless integration with ShadCN Tabs.
 * 
 * Features:
 * - Dynamic tab generation from ticker registry
 * - Lazy loading of ticker components
 * - Error boundaries for failed loads
 * - Smooth loading states
 * - Keyboard navigation support
 * - Responsive design
 */

import React, { Suspense, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { tickerRegistry, useTickerRegistry, type TickerRegistryEntry } from '@/lib/ticker-registry';
// Removed unused chat action import
import { cn } from '@/lib/utils';

/**
 * Props for the dynamic tab system
 */
interface DynamicTabSystemProps {
  /**
   * Default tab to show on first load
   */
  defaultTab?: string;
  
  /**
   * Additional CSS classes for the tabs container
   */
  className?: string;
  
  /**
   * Callback when tab changes
   */
  onTabChange?: (ticker: string) => void;
  
  /**
   * Custom loading component
   */
  loadingComponent?: React.ComponentType;
  
  /**
   * Custom error component
   */
  errorComponent?: React.ComponentType<{ error: string; onRetry: () => void }>;
}

/**
 * Individual tab content wrapper with error boundary
 */
interface TabContentWrapperProps {
  entry: TickerRegistryEntry;
  isActive: boolean;
}

function TabContentWrapper({ entry, isActive }: TabContentWrapperProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Only render if tab is active to improve performance
  if (!isActive) {
    return null;
  }
  
  if (entry.status === 'error') {
    return (
      <TabErrorDisplay 
        error={entry.error || 'Unknown error'} 
        ticker={entry.config.ticker}
        onRetry={() => window.location.reload()} 
      />
    );
  }
  
  if (entry.status !== 'loaded' || !entry.components) {
    return <TabLoadingDisplay ticker={entry.config.ticker} />;
  }
  
  try {
    const { TabContent } = entry.components;
    
    return (
      <Suspense fallback={<TabLoadingDisplay ticker={entry.config.ticker} />}>
        <TabContent 
          tickerPage={`${entry.config.ticker}_TAB`}
        />
      </Suspense>
    );
  } catch (error) {
    console.error(`Error rendering ${entry.config.ticker} tab:`, error);
    return (
      <TabErrorDisplay 
        error={error instanceof Error ? error.message : 'Render error'} 
        ticker={entry.config.ticker}
        onRetry={() => setError(null)} 
      />
    );
  }
}

/**
 * Loading display for individual tabs
 */
function TabLoadingDisplay({ ticker }: { ticker: string }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <CardTitle>Loading {ticker} Analysis</CardTitle>
        </div>
        <CardDescription>
          Initializing ticker components and data sources...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Error display for individual tabs
 */
function TabErrorDisplay({ 
  error, 
  ticker, 
  onRetry 
}: { 
  error: string; 
  ticker: string; 
  onRetry: () => void;
}) {
  return (
    <Card className="h-full border-destructive">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <CardTitle className="text-destructive">Error Loading {ticker}</CardTitle>
        </div>
        <CardDescription>
          Failed to load ticker analysis components
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-destructive/10 rounded-lg">
          <p className="text-sm text-muted-foreground font-mono">{error}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Tab trigger with enhanced styling
 */
function TickerTabTrigger({ entry }: { entry: TickerRegistryEntry }) {
  const isError = entry.status === 'error';
  const isLoading = entry.status === 'loading';
  
  return (
    <TabsTrigger
      value={entry.config.ticker}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2",
        isError && "text-destructive data-[state=active]:text-destructive",
        isLoading && "opacity-60"
      )}
      disabled={isError || isLoading}
    >
      {/* Ticker Symbol */}
      <span className="font-semibold">{entry.config.ticker}</span>
      
      {/* Category badge */}
      {entry.config.category && (
        <Badge 
          variant="secondary" 
          className="text-xs"
          style={{
            backgroundColor: entry.config.accentColor 
              ? `${entry.config.accentColor}20` 
              : undefined,
            color: entry.config.accentColor || undefined,
          }}
        >
          {entry.config.category}
        </Badge>
      )}
      
      {/* Status indicators */}
      {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
      {isError && <AlertCircle className="h-3 w-3 text-destructive" />}
      {entry.status === 'loaded' && (
        <TrendingUp className="h-3 w-3 text-muted-foreground" />
      )}
    </TabsTrigger>
  );
}

/**
 * Main dynamic tab system component
 */
export function DynamicTabSystem({
  defaultTab,
  className,
  onTabChange,
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
}: DynamicTabSystemProps) {
  const [tickers, setTickers] = useState<TickerRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  
  const registry = useTickerRegistry();
  
  // Load tickers on mount
  useEffect(() => {
    loadTickers();
  }, []);
  
  const loadTickers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[DynamicTabSystem] Loading tickers from registry...');
      const registeredTickers = await registry.getTickers();
      
      console.log(`[DynamicTabSystem] Loaded ${registeredTickers.length} tickers:`, 
        registeredTickers.map(t => t.config.ticker));
      
      setTickers(registeredTickers);
      
      // Set default tab
      if (registeredTickers.length > 0) {
        const defaultTicker = defaultTab 
          ? registeredTickers.find(t => t.config.ticker === defaultTab.toUpperCase())?.config.ticker
          : registeredTickers[0].config.ticker;
        
        if (defaultTicker) {
          setActiveTab(defaultTicker);
        }
      }
      
    } catch (err) {
      console.error('[DynamicTabSystem] Failed to load tickers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickers');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (ticker: string) => {
    console.log(`[DynamicTabSystem] Tab changed to: ${ticker}`);
    setActiveTab(ticker);
    onTabChange?.(ticker);
  };
  
  // System-wide loading state
  if (loading) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }
    
    return (
      <Card className="h-96">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <CardTitle>Loading Ticker Analysis System</CardTitle>
          </div>
          <CardDescription>
            Initializing dynamic ticker tabs and components...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }
  
  // System-wide error state
  if (error) {
    if (ErrorComponent) {
      return <ErrorComponent error={error} onRetry={loadTickers} />;
    }
    
    return (
      <Card className="h-96 border-destructive">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <CardTitle className="text-destructive">System Error</CardTitle>
          </div>
          <CardDescription>
            Failed to initialize dynamic ticker system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm text-muted-foreground font-mono">{error}</p>
          </div>
          <button
            onClick={loadTickers}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry System Load
          </button>
        </CardContent>
      </Card>
    );
  }
  
  // No tickers available
  if (tickers.length === 0) {
    return (
      <Card className="h-96">
        <CardHeader>
          <CardTitle>No Tickers Available</CardTitle>
          <CardDescription>
            No ticker configurations are currently enabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Check your ticker configuration in <code>src/config/ticker-configs.ts</code>
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={handleTabChange}
      className={cn("w-full", className)}
    >
      <TabsList className="flex w-full overflow-x-auto">
        {tickers.map((entry) => (
          <TickerTabTrigger key={entry.config.ticker} entry={entry} />
        ))}
      </TabsList>
      
      {tickers.map((entry) => (
        <TabsContent 
          key={entry.config.ticker} 
          value={entry.config.ticker}
          className="mt-4"
        >
          <TabContentWrapper 
            entry={entry} 
            isActive={activeTab === entry.config.ticker}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}


/**
 * Default export with sensible defaults
 */
export default function DefaultDynamicTabSystem() {
  return (
    <DynamicTabSystem 
      defaultTab="SPY"
      className="min-h-[600px]"
    />
  );
}