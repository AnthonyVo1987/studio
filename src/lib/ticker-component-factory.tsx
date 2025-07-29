/**
 * @fileOverview Ticker Component Factory
 * 
 * This factory creates ticker-specific UI components using a shared template system.
 * Components are generated based on ticker configuration, ensuring consistent
 * behavior while allowing ticker-specific customization.
 * 
 * Architecture Benefits:
 * - Eliminates code duplication across ticker tabs
 * - Ensures consistent UI/UX patterns
 * - Simplifies addition of new ticker tabs
 * - Centralizes component logic updates
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { TickerConfig } from './ticker-config';
import type { TickerAnalysisState, TickerAnalysisAction } from './ticker-context-factory';
import { createTickerLogger } from './ticker-logger';
import { AlertCircle, TrendingUp, BarChart3, FileJson } from 'lucide-react';

/**
 * Component factory options
 */
export interface ComponentFactoryOptions {
  config: TickerConfig;
  useAnalysis: () => TickerAnalysisState;
  useDispatch: () => React.Dispatch<TickerAnalysisAction>;
}

/**
 * Create main tab content component for a ticker
 */
export function createTickerTabContent({ config, useAnalysis, useDispatch }: ComponentFactoryOptions) {
  const TabContent: React.FC = () => {
    const state = useAnalysis();
    const dispatch = useDispatch();
    const logger = createTickerLogger(config.ticker, config.pageName);
    
    const handleFetchData = async () => {
      logger.userAction('FetchData', 'User clicked fetch data button');
      dispatch({ type: 'SET_LOADING' });
      
      try {
        // Simulated data fetch - replace with actual server action
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demonstration
        const mockData = {
          stockSnapshotJson: JSON.stringify({ ticker: config.ticker, price: 100 }),
          marketStatusJson: JSON.stringify({ market: 'open' }),
          standardTaJson: JSON.stringify({ indicators: {} }),
          aiAnalyzedTaJson: JSON.stringify({ analysis: {} }),
        };
        
        dispatch({ type: 'SET_STOCK_DATA', payload: mockData });
        dispatch({ type: 'SET_IDLE' });
        logger.dataFetch('FetchComplete', 'Data fetched successfully');
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch data' });
        logger.error('FetchData', 'Failed to fetch data', error);
      }
    };
    
    const handleFetchAIKeyTakeaways = async () => {
      if (!state.hasStockData) return;
      
      logger.userAction('FetchAIKeyTakeaways', 'User requested AI key takeaways');
      dispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: true });
      
      try {
        // Simulated AI analysis - replace with actual server action
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockTakeaways = JSON.stringify({
          takeaways: [`${config.ticker} shows strong momentum`, 'Technical indicators are bullish'],
        });
        
        dispatch({ type: 'SET_AI_KEY_TAKEAWAYS', payload: mockTakeaways });
        logger.aiFlow('AIKeyTakeaways', 'AI analysis completed');
      } catch (error) {
        logger.error('FetchAIKeyTakeaways', 'Failed to get AI takeaways', error);
      } finally {
        dispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: false });
      }
    };
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{config.displayName}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {config.ticker}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Display */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{state.status}</span>
              </div>
              
              {/* Error Display */}
              {state.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
              
              {/* Main Actions */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Button 
                  onClick={handleFetchData}
                  disabled={state.status === 'loading'}
                  size="lg"
                  className="w-full"
                >
                  {state.status === 'loading' ? 'Fetching...' : `Fetch ${config.ticker} Data`}
                </Button>
                
                {config.features.aiKeyTakeaways && (
                  <Button
                    onClick={handleFetchAIKeyTakeaways}
                    disabled={!state.hasStockData || state.isAiKeyTakeawaysLoading}
                    variant="secondary"
                    size="lg"
                    className="w-full"
                  >
                    {state.isAiKeyTakeawaysLoading ? 'Analyzing...' : 'AI Key Takeaways'}
                  </Button>
                )}
              </div>
              
              {/* Data Display Tabs */}
              {state.hasStockData && (
                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                    <TabsTrigger value="data">Raw Data</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Market Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm">{state.stockSnapshotJson}</pre>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="technical" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Technical Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm">{state.standardTaJson}</pre>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="data" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileJson className="h-5 w-5" />
                          Raw JSON Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <strong>Stock Snapshot:</strong>
                            <pre className="text-xs mt-1">{state.stockSnapshotJson}</pre>
                          </div>
                          <div>
                            <strong>Market Status:</strong>
                            <pre className="text-xs mt-1">{state.marketStatusJson}</pre>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
              
              {/* AI Takeaways Display */}
              {state.hasAiKeyTakeaways && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">AI Key Takeaways</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm whitespace-pre-wrap">{state.aiKeyTakeawaysJson}</pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  TabContent.displayName = `${config.ticker}TabContent`;
  return TabContent;
}

/**
 * Create data display component for a ticker
 */
export function createTickerDataDisplay({ config, useAnalysis }: ComponentFactoryOptions) {
  const DataDisplay: React.FC = () => {
    const state = useAnalysis();
    
    if (!state.hasStockData) {
      return (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No data available. Click "Fetch {config.ticker} Data" to load.
            </p>
          </CardContent>
        </Card>
      );
    }
    
    // Parse stock data
    let stockData: any = {};
    try {
      stockData = JSON.parse(state.stockSnapshotJson);
    } catch (e) {
      // Handle parse error
    }
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stockData.price || 'N/A'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stockData.volume || 'N/A'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Market Cap</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stockData.marketCap || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  DataDisplay.displayName = `${config.ticker}DataDisplay`;
  return DataDisplay;
}

/**
 * Create loading skeleton component for a ticker
 */
export function createTickerLoadingSkeleton({ config }: { config: TickerConfig }) {
  const LoadingSkeleton: React.FC = () => {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  LoadingSkeleton.displayName = `${config.ticker}LoadingSkeleton`;
  return LoadingSkeleton;
}