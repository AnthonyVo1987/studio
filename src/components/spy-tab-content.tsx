'use client';

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

      // Step 1: Fetch Stock Data (including Options Chain)
      const stockDataResult = await fetchStockDataAction({
        ticker: SPY_TICKER,
        expirationDate: spyState.selectedExpirationDate,
        optionType: spyState.optionType,
        strikeCount: spyState.strikeCount,
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

      // Step 3: Batch Update SPY State (including Options Chain)
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
      spyDispatch({ 
        type: 'SET_OPTIONS_CHAIN_DATA', 
        payload: stockDataResult.data.optionsChainJson 
      });

      // Step 5: Signal that ALL data retrieval is complete for batch UI updates
      spyDispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: true });
      spyDispatch({ type: 'SET_IDLE' });

      toast({
        title: `${SPY_TICKER} Data Retrieved`,
        description: 'Stock data, technical analysis, and options chain loaded successfully.',
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

  // Deterministic Handler: SPY AI Key Takeaways (Phase 1)
  const handleSpyAiKeyTakeaways = async () => {
    try {
      spyDispatch({ type: 'SET_LOADING' });

      const result = await performAiAnalysisAction({
        ticker: SPY_TICKER,
        stockSnapshotJson: spyState.stockSnapshotJson,
        standardTasJson: spyState.standardTaJson,
        aiAnalyzedTaJson: spyState.aiAnalyzedTaJson,
        marketStatusJson: spyState.marketStatusJson,
      });

      if (result.status === 'success' && result.data) {
        spyDispatch({ 
          type: 'SET_AI_KEY_TAKEAWAYS', 
          payload: result.data.aiKeyTakeawaysJson 
        });
        
        spyDispatch({ type: 'SET_IDLE' });
        
        toast({ 
          title: 'Success', 
          description: `${SPY_TICKER} AI Key Takeaways generated successfully` 
        });
      } else {
        throw new Error(result.message || 'Failed to generate AI Key Takeaways');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      spyDispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Generating AI Key Takeaways',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: SPY AI Options Analysis (Phase 1)
  const handleSpyAiOptionsAnalysis = async () => {
    try {
      spyDispatch({ type: 'SET_LOADING' });

      const result = await performAiOptionsAnalysisAction({
        ticker: SPY_TICKER,
        stockSnapshotJson: spyState.stockSnapshotJson,
        optionsChainJson: spyState.optionsChainJson,
      });

      if (result.status === 'success' && result.data) {
        spyDispatch({ 
          type: 'SET_AI_OPTIONS_ANALYSIS', 
          payload: result.data.aiOptionsAnalysisJson 
        });
        
        spyDispatch({ type: 'SET_IDLE' });
        
        toast({ 
          title: 'Success', 
          description: `${SPY_TICKER} AI Options Analysis generated successfully` 
        });
      } else {
        throw new Error(result.message || 'Failed to generate AI Options Analysis');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      spyDispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Generating AI Options Analysis',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Expiration Selection Handler
  const handleExpirationChange = (value: string) => {
    spyDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: value });
  };

  // Options Chain Settings Handlers
  const handleOptionTypeChange = (value: OptionType) => {
    spyDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { optionType: value } });
  };

  const handleStrikeCountChange = (value: StrikeCount) => {
    spyDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { strikeCount: value } });
  };

  const handleTableDisplayTypeChange = (value: TableDisplayType) => {
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
              disabled={!spyState.hasStockData || !spyState.hasAiTaData || isLoading}
              variant="outline"
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate AI Key Takeaways
            </Button>
            <Button 
              onClick={handleSpyAiOptionsAnalysis}
              disabled={!spyState.hasOptionsChainData || isLoading}
              variant="outline"
              className="flex-1"
            >
              <CandlestickChart className="mr-2 h-4 w-4" />
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