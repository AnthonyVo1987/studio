'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, CalendarDays, Search, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// SPY Context
import { useSpyAnalysis, useSpyDispatch, SPY_TICKER } from '@/contexts/spy-analysis-context';

// Server Actions (reused from Main tab)
import { getExpirationDates } from '@/services/data-sources/adapters/polygon-adapter';
import { fetchStockDataAction } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction } from '@/actions/analyze-ta-action';
import { findNextAvailableDate } from '@/lib/date-utils';

// SPY Data Section Component
import { SpyDataSection } from '@/components/spy-data-section';

// Placeholder UI Components (copied from Main tab but isolated)
import { SpyMarketStatusDisplay } from '@/components/spy-market-status-display';
import { SpyKeyMetricsDisplay } from '@/components/spy-key-metrics-display';
import { SpyStockSnapshotDisplay } from '@/components/spy-stock-snapshot-display';
import { SpyStandardTaDisplay } from '@/components/spy-standard-ta-display';
import { SpyAiAnalyzedTaDisplay } from '@/components/spy-ai-analyzed-ta-display';

export function SpyTabContent() {
  const spyState = useSpyAnalysis();
  const spyDispatch = useSpyDispatch();
  const { toast } = useToast();

  // Auto-fetch SPY expirations when component mounts
  useEffect(() => {
    let mounted = true;
    
    const fetchInitialData = async () => {
      if (!mounted) return;
      
      try {
        spyDispatch({ type: 'SET_LOADING' });
        
        const expirations = await getExpirationDates(SPY_TICKER);
        const nextAvailableDate = findNextAvailableDate(expirations);
        
        if (!mounted) return;
        
        spyDispatch({ type: 'SET_EXPIRATION_DATES', payload: expirations });
        
        if (nextAvailableDate) {
          spyDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: nextAvailableDate });
        }
        
        spyDispatch({ type: 'SET_IDLE' });
        
        toast({
          title: `${SPY_TICKER} Expirations Loaded`,
          description: `Found ${expirations.length} available dates. Selected: ${nextAvailableDate || 'None'}`,
        });
      } catch (error) {
        if (!mounted) return;
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        spyDispatch({ type: 'SET_ERROR', payload: errorMessage });
        
        toast({
          title: 'Error Fetching Expirations',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    };
    
    fetchInitialData();
    
    return () => {
      mounted = false;
    };
  }, [spyDispatch, toast]);

  // Deterministic Handler: Fetch SPY Expirations
  const handleFetchExpirations = async () => {
    try {
      spyDispatch({ type: 'SET_LOADING' });
      
      const expirations = await getExpirationDates(SPY_TICKER);
      const nextAvailableDate = findNextAvailableDate(expirations);
      
      spyDispatch({ type: 'SET_EXPIRATION_DATES', payload: expirations });
      
      if (nextAvailableDate) {
        spyDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: nextAvailableDate });
      }
      
      spyDispatch({ type: 'SET_IDLE' });
      
      toast({
        title: `${SPY_TICKER} Expirations Loaded`,
        description: `Found ${expirations.length} available dates. Selected: ${nextAvailableDate || 'None'}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      spyDispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Fetching Expirations',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: Get SPY Stock Data (Batch Operation)
  const handleGetStockData = async () => {
    if (!spyState.selectedExpirationDate) {
      toast({
        title: 'No Expiration Selected',
        description: 'Please select an expiration date first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      spyDispatch({ type: 'SET_LOADING' });
      spyDispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: false });

      // Step 1: Fetch Stock Data
      const stockDataResult = await fetchStockDataAction({
        ticker: SPY_TICKER,
        expirationDate: spyState.selectedExpirationDate,
      });

      if (stockDataResult.status !== 'success' || !stockDataResult.data) {
        throw new Error(stockDataResult.error || 'Failed to fetch stock data');
      }

      // Step 2: Fetch Technical Analysis Data
      const taResult = await analyzeTaAction({
        ticker: SPY_TICKER,
        stockSnapshotJson: stockDataResult.data.stockSnapshotJson,
      });

      if (taResult.status !== 'success' || !taResult.data) {
        throw new Error(taResult.error || 'Failed to fetch technical analysis');
      }

      // Step 3: Batch Update SPY State
      // Parse key metrics from stock snapshot
      let keyMetricsJson = '';
      try {
        const snapshotData = JSON.parse(stockDataResult.data.stockSnapshotJson);
        if (snapshotData.results && snapshotData.results.length > 0) {
          const result = snapshotData.results[0];
          keyMetricsJson = JSON.stringify({
            ticker: result.T || SPY_TICKER,
            currentPrice: result.c || 0,
            changeAmount: ((result.c || 0) - (result.pc || 0)).toFixed(2),
            changePercent: (((result.c || 0) - (result.pc || 0)) / (result.pc || 1) * 100).toFixed(2),
          });
        }
      } catch (e) {
        keyMetricsJson = JSON.stringify({ error: 'Failed to parse key metrics' });
      }

      spyDispatch({ 
        type: 'SET_STOCK_DATA', 
        payload: {
          stockSnapshotJson: stockDataResult.data.stockSnapshotJson,
          marketStatusJson: stockDataResult.data.marketStatusJson,
          keyMetricsJson,
          standardTaJson: stockDataResult.data.standardTasJson,
          aiAnalyzedTaJson: taResult.data.aiAnalyzedTaJson,
        }
      });

      // Step 4: Signal that ALL data retrieval is complete for batch UI updates
      spyDispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: true });
      spyDispatch({ type: 'SET_IDLE' });

      toast({
        title: `${SPY_TICKER} Data Retrieved`,
        description: 'Stock data and technical analysis loaded successfully.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      spyDispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Fetching Stock Data',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Expiration Selection Handler
  const handleExpirationChange = (value: string) => {
    spyDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: value });
  };

  const isLoading = spyState.status === 'loading';

  return (
    <div className="space-y-6">
      {/* SPY Analysis Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">SPY Dedicated Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Real-time {SPY_TICKER} stock analysis with technical indicators and options data
        </p>
      </div>

      {/* SPY Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {SPY_TICKER} Analysis Controls
          </CardTitle>
          <CardDescription>
            Manage expiration dates and trigger data retrieval for {SPY_TICKER}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Expiration Selection */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label className="text-sm font-medium mb-2 block">
                Expiration Date
              </label>
              <Select
                value={spyState.selectedExpirationDate}
                onValueChange={handleExpirationChange}
                disabled={isLoading || spyState.availableExpirationDates.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration date" />
                </SelectTrigger>
                <SelectContent>
                  {spyState.availableExpirationDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleFetchExpirations}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )}
              Fetch Expirations
            </Button>
          </div>

          <Separator />

          {/* Get Stock Data Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGetStockData}
              disabled={isLoading || !spyState.selectedExpirationDate}
              size="lg"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Get {SPY_TICKER} Stock Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SPY UI Cards Grid (Static for now - future task will connect data) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpyMarketStatusDisplay />
        <SpyKeyMetricsDisplay />
        <SpyStockSnapshotDisplay />
        <SpyStandardTaDisplay />
        <SpyAiAnalyzedTaDisplay />
      </div>

      {/* SPY Data Section (Self-contained JSON display) */}
      <SpyDataSection />
    </div>
  );
}