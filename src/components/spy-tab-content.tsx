'use client';

/**
 * @fileOverview SPY Tab Content - Blueprint Orchestrator Component
 * 
 * This component serves as the main orchestrator for ticker-specific analysis tabs.
 * Architecture Pattern: Deterministic Handlers + Context Integration + FSM State Management
 * 
 * REPLICATION GUIDE for creating new ticker pages (e.g., NVDA):
 * 1. Copy this file: spy-tab-content.tsx → nvda-tab-content.tsx
 * 2. Update imports: useSpyAnalysis → useNvdaAnalysis, SPY_TICKER → NVDA_TICKER
 * 3. Update component name: SpyTabContent → NvdaTabContent
 * 4. Update display component imports: spy-*-display.tsx → nvda-*-display.tsx
 * 5. Update header text and descriptions to reference new ticker
 * 
 * ARCHITECTURE STRENGTHS:
 * - All handlers follow async/await deterministic patterns
 * - Complete error handling with user feedback via toast
 * - Proper FSM state transitions (loading → idle/error)
 * - Server actions are ticker-agnostic and reusable
 * - Batch data operations prevent race conditions
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Loader2, CalendarDays, Search, Zap, Settings, FileText, CandlestickChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// SPY Context
import { useSpyAnalysis, useSpyDispatch, SPY_TICKER, type OptionType, type StrikeCount, type TableDisplayType } from '@/contexts/spy-analysis-context';

// Server Actions (reused from Main tab)
import { getExpirationDates } from '@/services/data-sources/adapters/polygon-adapter';
import { fetchStockDataAction } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction } from '@/actions/perform-ai-options-analysis-action';
import { findNextAvailableDate } from '@/lib/date-utils';

// SPY Data Section Component
import { SpyDataSection } from '@/components/spy-data-section';

// SPY UI Components (isolated)
import { SpyMarketStatusDisplay } from '@/components/spy-market-status-display';
import { SpyKeyMetricsDisplay } from '@/components/spy-key-metrics-display';
import { SpyStockSnapshotDisplay } from '@/components/spy-stock-snapshot-display';
import { SpyStandardTaDisplay } from '@/components/spy-standard-ta-display';
import { SpyAiAnalyzedTaDisplay } from '@/components/spy-ai-analyzed-ta-display';
import { SpyOptionsChainTable } from '@/components/spy-options-chain-table';
import { SpyAiKeyTakeawaysDisplay } from '@/components/spy-ai-key-takeaways-display';
import { SpyAiOptionsAnalysisDisplay } from '@/components/spy-ai-options-analysis-display';
import { SpyConsolidatedChat } from '@/components/spy-consolidated-chat';

export function SpyTabContent() {
  const spyState = useSpyAnalysis();
  const spyDispatch = useSpyDispatch();
  const { toast } = useToast();


  // Deterministic Handler: Fetch SPY Expirations
  const handleFetchExpirations = async () => {
    console.log('[SPY:UserAction:FetchExpirations] Starting expiration fetch...', { ticker: SPY_TICKER });
    try {
      spyDispatch({ type: 'SET_LOADING' });
      
      const expirations = await getExpirationDates(SPY_TICKER);
      console.log('[SPY:UserAction:FetchExpirations] Expirations received:', { count: expirations.length });
      
      const nextAvailableDate = findNextAvailableDate(expirations);
      console.log('[SPY:UserAction:FetchExpirations] Next available date:', nextAvailableDate);
      
      spyDispatch({ type: 'SET_EXPIRATION_DATES', payload: expirations });
      
      if (nextAvailableDate) {
        spyDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: nextAvailableDate });
      }
      
      spyDispatch({ type: 'SET_IDLE' });
      
      toast({
        title: `${SPY_TICKER} Expirations Loaded`,
        description: `Found ${expirations.length} available dates. Selected: ${nextAvailableDate || 'None'}`,
      });
      
      console.log('[SPY:UserAction:FetchExpirations] Completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[SPY:UserAction:FetchExpirations] Error:', errorMessage);
      
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
    console.log('[SPY:UserAction:GetStockData] Starting stock data fetch...', {
      ticker: SPY_TICKER,
      expiration: spyState.selectedExpirationDate,
      optionType: spyState.optionType,
      strikeCount: spyState.strikeCount
    });
    
    if (!spyState.selectedExpirationDate) {
      console.warn('[SPY:UserAction:GetStockData] No expiration date selected');
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

      // Step 1: Fetch Stock Data (including Options Chain)
      console.log('[SPY:UserAction:GetStockData] Step 1: Fetching stock data...');
      const stockDataResult = await fetchStockDataAction({
        ticker: SPY_TICKER,
        expirationDate: spyState.selectedExpirationDate,
        optionType: spyState.optionType,
        strikeCount: spyState.strikeCount,
      });

      if (stockDataResult.status !== 'success' || !stockDataResult.data) {
        throw new Error(stockDataResult.error || 'Failed to fetch stock data');
      }
      console.log('[SPY:UserAction:GetStockData] Step 1: Stock data received');

      // Step 2: Fetch Technical Analysis Data
      console.log('[SPY:UserAction:GetStockData] Step 2: Fetching technical analysis...');
      const taResult = await analyzeTaAction({
        ticker: SPY_TICKER,
        stockSnapshotJson: stockDataResult.data.stockSnapshotJson,
      });

      if (taResult.status !== 'success' || !taResult.data) {
        throw new Error(taResult.error || 'Failed to fetch technical analysis');
      }
      console.log('[SPY:UserAction:GetStockData] Step 2: Technical analysis received');

      // Step 3: Batch Update SPY State (including Options Chain)
      console.log('[SPY:UserAction:GetStockData] Step 3: Updating state with stock data');
      spyDispatch({ 
        type: 'SET_STOCK_DATA', 
        payload: {
          stockSnapshotJson: stockDataResult.data.stockSnapshotJson,
          marketStatusJson: stockDataResult.data.marketStatusJson,
          standardTaJson: stockDataResult.data.standardTasJson,
          aiAnalyzedTaJson: taResult.data.aiAnalyzedTaJson,
        }
      });

      // Step 4: Set Options Chain Data
      const optionsData = stockDataResult.data.optionsChainJson ? JSON.parse(stockDataResult.data.optionsChainJson) : {};
      console.log('[SPY:UserAction:GetStockData] Step 4: Setting options chain data', {
        hasData: !!stockDataResult.data.optionsChainJson,
        strikeCount: optionsData.strikes?.length || 0,
        callCount: optionsData.calls?.length || 0,
        putCount: optionsData.puts?.length || 0
      });
      spyDispatch({ 
        type: 'SET_OPTIONS_CHAIN_DATA', 
        payload: stockDataResult.data.optionsChainJson 
      });

      // Step 5: Signal that ALL data retrieval is complete for batch UI updates
      console.log('[SPY:UserAction:GetStockData] Step 5: Marking data retrieval complete');
      spyDispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: true });
      spyDispatch({ type: 'SET_IDLE' });

      toast({
        title: `${SPY_TICKER} Data Retrieved`,
        description: 'Stock data, technical analysis, and options chain loaded successfully.',
      });
      
      console.log('[SPY:UserAction:GetStockData] Completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[SPY:UserAction:GetStockData] Error:', errorMessage);
      
      spyDispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Fetching Stock Data',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: SPY AI Key Takeaways (Phase 1)
  const handleSpyAiKeyTakeaways = async () => {
    console.log('[SPY:UserAction:AIKeyTakeaways] Starting AI key takeaways generation...', {
      ticker: SPY_TICKER,
      hasStockData: !!spyState.stockSnapshotJson,
      hasStandardTA: !!spyState.standardTaJson,
      hasAITA: !!spyState.aiAnalyzedTaJson,
      hasMarketStatus: !!spyState.marketStatusJson
    });
    
    try {
      // Use specific AI loading state instead of global FSM loading
      spyDispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: true });

      const result = await performAiAnalysisAction({
        ticker: SPY_TICKER,
        stockSnapshotJson: spyState.stockSnapshotJson,
        standardTasJson: spyState.standardTaJson,
        aiAnalyzedTaJson: spyState.aiAnalyzedTaJson,
        marketStatusJson: spyState.marketStatusJson,
      });

      if (result.status === 'success' && result.data) {
        console.log('[SPY:UserAction:AIKeyTakeaways] AI analysis completed successfully');
        
        spyDispatch({ 
          type: 'SET_AI_KEY_TAKEAWAYS', 
          payload: result.data.aiKeyTakeawaysJson 
        });
        
        toast({ 
          title: 'Success', 
          description: `${SPY_TICKER} AI Key Takeaways generated successfully` 
        });
      } else {
        throw new Error(result.message || 'Failed to generate AI Key Takeaways');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[SPY:UserAction:AIKeyTakeaways] Error:', errorMessage);
      
      // Clear loading state on error
      spyDispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: false });
      
      toast({
        title: 'Error Generating AI Key Takeaways',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: SPY AI Options Analysis (Phase 1)
  const handleSpyAiOptionsAnalysis = async () => {
    console.log('[SPY:UserAction:AIOptionsAnalysis] Starting AI options analysis...', {
      ticker: SPY_TICKER,
      hasStockData: !!spyState.stockSnapshotJson,
      hasOptionsChain: !!spyState.optionsChainJson
    });
    
    try {
      // Use specific AI loading state instead of global FSM loading
      spyDispatch({ type: 'SET_AI_OPTIONS_ANALYSIS_LOADING', payload: true });

      const result = await performAiOptionsAnalysisAction({
        ticker: SPY_TICKER,
        stockSnapshotJson: spyState.stockSnapshotJson,
        optionsChainJson: spyState.optionsChainJson,
      });

      if (result.status === 'success' && result.data) {
        console.log('[SPY:UserAction:AIOptionsAnalysis] AI options analysis completed successfully');
        
        spyDispatch({ 
          type: 'SET_AI_OPTIONS_ANALYSIS', 
          payload: result.data.aiOptionsAnalysisJson 
        });
        
        toast({ 
          title: 'Success', 
          description: `${SPY_TICKER} AI Options Analysis generated successfully` 
        });
      } else {
        throw new Error(result.message || 'Failed to generate AI Options Analysis');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[SPY:UserAction:AIOptionsAnalysis] Error:', errorMessage);
      
      // Clear loading state on error
      spyDispatch({ type: 'SET_AI_OPTIONS_ANALYSIS_LOADING', payload: false });
      
      toast({
        title: 'Error Generating AI Options Analysis',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Expiration Selection Handler
  const handleExpirationChange = (value: string) => {
    console.log('[SPY:UserAction:ExpirationChange] Expiration date changed:', { 
      from: spyState.selectedExpirationDate, 
      to: value 
    });
    spyDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: value });
  };

  // Options Chain Settings Handlers
  const handleOptionTypeChange = (value: OptionType) => {
    console.log('[SPY:UserAction:OptionTypeChange] Option type changed:', { 
      from: spyState.optionType, 
      to: value 
    });
    spyDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { optionType: value } });
  };

  const handleStrikeCountChange = (value: StrikeCount) => {
    console.log('[SPY:UserAction:StrikeCountChange] Strike count changed:', { 
      from: spyState.strikeCount, 
      to: value 
    });
    spyDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { strikeCount: value } });
  };

  const handleTableDisplayTypeChange = (value: TableDisplayType) => {
    console.log('[SPY:UserAction:TableDisplayChange] Table display type changed:', { 
      from: spyState.tableDisplayType, 
      to: value 
    });
    spyDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { tableDisplayType: value } });
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

          {/* Options Chain Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Options Chain Settings</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Option Type Selector */}
              <div className="space-y-2">
                <Label htmlFor="spy-option-type" className="text-sm font-medium">
                  Option Type
                </Label>
                <Select
                  value={spyState.optionType}
                  onValueChange={handleOptionTypeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="spy-option-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both (Calls & Puts)</SelectItem>
                    <SelectItem value="calls">Calls Only</SelectItem>
                    <SelectItem value="puts">Puts Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Strike Count Selector */}
              <div className="space-y-2">
                <Label htmlFor="spy-strike-count" className="text-sm font-medium">
                  Strike Count
                </Label>
                <Select
                  value={spyState.strikeCount.toString()}
                  onValueChange={(value) => handleStrikeCountChange(parseInt(value) as StrikeCount)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="spy-strike-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 Strikes</SelectItem>
                    <SelectItem value="30">30 Strikes</SelectItem>
                    <SelectItem value="40">40 Strikes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table Display Type Selector */}
              <div className="space-y-2">
                <Label htmlFor="spy-table-display" className="text-sm font-medium">
                  Table Layout
                </Label>
                <Select
                  value={spyState.tableDisplayType}
                  onValueChange={handleTableDisplayTypeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="spy-table-display">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="side-by-side">Side by Side</SelectItem>
                    <SelectItem value="top-bottom">Top & Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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

      {/* SPY AI Analysis Controls (Phase 1) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {SPY_TICKER} AI Analysis (On-Demand)
          </CardTitle>
          <CardDescription>
            Generate AI analysis manually. Each button is independent and requires specific data to be available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSpyAiKeyTakeaways}
              disabled={!spyState.hasStockData || !spyState.hasAiTaData || isLoading || spyState.isAiKeyTakeawaysLoading}
              variant="outline"
              className="flex-1"
            >
              {spyState.isAiKeyTakeawaysLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Generate AI Key Takeaways
            </Button>
            <Button 
              onClick={handleSpyAiOptionsAnalysis}
              disabled={!spyState.hasOptionsChainData || isLoading || spyState.isAiOptionsAnalysisLoading}
              variant="outline"
              className="flex-1"
            >
              {spyState.isAiOptionsAnalysisLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CandlestickChart className="mr-2 h-4 w-4" />
              )}
              Generate AI Options Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SPY UI Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpyMarketStatusDisplay />
        <SpyKeyMetricsDisplay />
        <SpyStockSnapshotDisplay />
        <SpyStandardTaDisplay />
        <SpyAiAnalyzedTaDisplay />
      </div>

      {/* SPY AI Analysis Components (Full Width) */}
      <SpyAiKeyTakeawaysDisplay />
      <SpyAiOptionsAnalysisDisplay />

      {/* SPY Options Chain Table (Full Width) */}
      <SpyOptionsChainTable />

      {/* SPY Consolidated AI Chat Interface */}
      <SpyConsolidatedChat />

      {/* SPY Data Section (Self-contained JSON display) */}
      <SpyDataSection />
    </div>
  );
}