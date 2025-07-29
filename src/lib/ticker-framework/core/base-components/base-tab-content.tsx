'use client';

/**
 * @fileOverview Base Tab Content Template - Main Orchestrator Component
 * 
 * This is the base template for ticker-specific tab content components.
 * It provides all the deterministic handlers and layout structure needed
 * for a complete ticker analysis tab.
 * 
 * Architecture Pattern: Deterministic Handlers + Context Integration + FSM State Management
 * 
 * Usage:
 * const SPYTabContent = createTabContent(spyConfig, spyContext);
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Loader2, CalendarDays, Search, Zap, Settings, FileText, CandlestickChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Server Actions (reused across all ticker tabs)
import { getExpirationDates } from '@/services/data-sources/adapters/polygon-adapter';
import { fetchStockDataAction } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction } from '@/actions/perform-ai-options-analysis-action';
import { findNextAvailableDate } from '@/lib/date-utils';

// Ticker Logger
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// Types
import type { 
  TickerConfig, 
  TickerContextResult,
  OptionType,
  StrikeCount,
  TableDisplayType 
} from '../types';

interface BaseTabContentProps<T extends TickerConfig> {
  config: T;
  context: TickerContextResult<T>;
  DataSection: React.ComponentType;
  MarketStatusDisplay: React.ComponentType;
  KeyMetricsDisplay: React.ComponentType;
  StockSnapshotDisplay: React.ComponentType;
  StandardTaDisplay: React.ComponentType;
  AiAnalyzedTaDisplay: React.ComponentType;
  OptionsChainTable: React.ComponentType;
  AiKeyTakeawaysDisplay: React.ComponentType;
  AiOptionsAnalysisDisplay: React.ComponentType;
  ConsolidatedChat: React.ComponentType;
  tickerPage?: keyof typeof TICKER_PAGES;
}

export function BaseTabContent<T extends TickerConfig>({
  config,
  context,
  DataSection,
  MarketStatusDisplay,
  KeyMetricsDisplay,
  StockSnapshotDisplay,
  StandardTaDisplay,
  AiAnalyzedTaDisplay,
  OptionsChainTable,
  AiKeyTakeawaysDisplay,
  AiOptionsAnalysisDisplay,
  ConsolidatedChat,
  tickerPage = 'SPY_TAB'
}: BaseTabContentProps<T>) {
  const state = context.hooks.useState();
  const dispatch = context.hooks.useDispatch();
  const { toast } = useToast();

  // Create ticker-specific logger
  const logger = createTickerLogger(config.ticker, TICKER_PAGES[tickerPage] || `${config.ticker} Tab`);

  // Deterministic Handler: Fetch Expirations
  const handleFetchExpirations = async () => {
    logger.userAction('FetchExpirations', 'Starting expiration fetch...', { ticker: config.ticker });
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const expirations = await getExpirationDates(config.ticker);
      logger.dataFetch('FetchExpirations', 'Expirations received', { count: expirations.length });
      
      const nextAvailableDate = findNextAvailableDate(expirations);
      logger.userAction('FetchExpirations', 'Next available date determined', { date: nextAvailableDate });
      
      dispatch({ type: 'SET_EXPIRATION_DATES', payload: expirations });
      
      if (nextAvailableDate) {
        dispatch({ type: 'SET_SELECTED_EXPIRATION', payload: nextAvailableDate });
      }
      
      dispatch({ type: 'SET_IDLE' });
      
      toast({
        title: `${config.ticker} Expirations Loaded`,
        description: `Found ${expirations.length} available dates. Selected: ${nextAvailableDate || 'None'}`,
      });
      
      logger.userAction('FetchExpirations', 'Completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('FetchExpirations', 'Failed to fetch expirations', error);
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Fetching Expirations',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: Get Stock Data (Batch Operation)
  const handleGetStockData = async () => {
    logger.userAction('GetStockData', 'Starting stock data fetch...', {
      ticker: config.ticker,
      expiration: state.selectedExpirationDate,
      optionType: state.optionType,
      strikeCount: state.strikeCount
    });
    
    if (!state.selectedExpirationDate) {
      logger.userAction('GetStockData', 'No expiration date selected');
      toast({
        title: 'No Expiration Selected',
        description: 'Please select an expiration date first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING' });
      dispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: false });

      // Step 1: Fetch Stock Data (including Options Chain)
      logger.serverAction('GetStockData', 'Step 1: Fetching stock data...');
      const stockDataResult = await fetchStockDataAction({
        ticker: config.ticker,
        expirationDate: state.selectedExpirationDate,
        optionType: state.optionType,
        strikeCount: state.strikeCount,
      });

      if (stockDataResult.status !== 'success' || !stockDataResult.data) {
        throw new Error(stockDataResult.error || 'Failed to fetch stock data');
      }
      logger.dataFetch('GetStockData', 'Step 1: Stock data received');

      // Step 2: Fetch Technical Analysis Data
      logger.serverAction('GetStockData', 'Step 2: Fetching technical analysis...');
      const taResult = await analyzeTaAction({
        ticker: config.ticker,
        stockSnapshotJson: stockDataResult.data.stockSnapshotJson,
      });

      if (taResult.status !== 'success' || !taResult.data) {
        throw new Error(taResult.error || 'Failed to fetch technical analysis');
      }
      logger.dataFetch('GetStockData', 'Step 2: Technical analysis received');

      // Step 3: Batch Update State (including Options Chain)
      logger.state('GetStockData', 'Step 3: Updating state with stock data');
      dispatch({ 
        type: 'SET_STOCK_DATA', 
        payload: {
          stockSnapshotJson: stockDataResult.data.stockSnapshotJson,
          marketStatusJson: stockDataResult.data.marketStatusJson,
          standardTasJson: stockDataResult.data.standardTasJson,
          aiAnalyzedTaJson: taResult.data.aiAnalyzedTaJson,
        }
      });

      // Step 4: Set Options Chain Data
      const optionsData = stockDataResult.data.optionsChainJson ? JSON.parse(stockDataResult.data.optionsChainJson) : {};
      logger.dataFetch('GetStockData', 'Step 4: Setting options chain data', {
        hasData: !!stockDataResult.data.optionsChainJson,
        strikeCount: optionsData.strikes?.length || 0,
        callCount: optionsData.calls?.length || 0,
        putCount: optionsData.puts?.length || 0
      });
      dispatch({ 
        type: 'SET_OPTIONS_CHAIN_DATA', 
        payload: stockDataResult.data.optionsChainJson 
      });

      // Step 5: Signal that ALL data retrieval is complete for batch UI updates
      logger.state('GetStockData', 'Step 5: Marking data retrieval complete');
      dispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: true });
      dispatch({ type: 'SET_IDLE' });

      toast({
        title: `${config.ticker} Data Retrieved`,
        description: 'Stock data, technical analysis, and options chain loaded successfully.',
      });
      
      logger.userAction('GetStockData', 'Completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('GetStockData', 'Failed to fetch stock data', error);
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Fetching Stock Data',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: AI Key Takeaways
  const handleAiKeyTakeaways = async () => {
    logger.userAction('AIKeyTakeaways', 'Starting AI key takeaways generation...', {
      ticker: config.ticker,
      hasStockData: !!state.stockSnapshotJson,
      hasStandardTA: !!state.standardTasJson,
      hasAITA: !!state.aiAnalyzedTaJson,
      hasMarketStatus: !!state.marketStatusJson
    });
    
    try {
      // Use specific AI loading state instead of global FSM loading
      dispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: true });

      const result = await performAiAnalysisAction({
        ticker: config.ticker,
        stockSnapshotJson: state.stockSnapshotJson,
        standardTasJson: state.standardTasJson,
        aiAnalyzedTaJson: state.aiAnalyzedTaJson,
        marketStatusJson: state.marketStatusJson,
      });

      if (result.status === 'success' && result.data) {
        logger.aiFlow('AIKeyTakeaways', 'AI analysis completed successfully');
        
        dispatch({ 
          type: 'SET_AI_KEY_TAKEAWAYS', 
          payload: result.data.aiKeyTakeawaysJson 
        });
        
        toast({ 
          title: 'Success', 
          description: `${config.ticker} AI Key Takeaways generated successfully` 
        });
      } else {
        throw new Error(result.message || 'Failed to generate AI Key Takeaways');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('AIKeyTakeaways', 'Failed to generate AI key takeaways', error);
      
      // Clear loading state on error
      dispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: false });
      
      toast({
        title: 'Error Generating AI Key Takeaways',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: AI Options Analysis
  const handleAiOptionsAnalysis = async () => {
    logger.userAction('AIOptionsAnalysis', 'Starting AI options analysis...', {
      ticker: config.ticker,
      hasStockData: !!state.stockSnapshotJson,
      hasOptionsChain: !!state.optionsChainJson
    });
    
    try {
      // Use specific AI loading state instead of global FSM loading
      dispatch({ type: 'SET_AI_OPTIONS_ANALYSIS_LOADING', payload: true });

      const result = await performAiOptionsAnalysisAction({
        ticker: config.ticker,
        stockSnapshotJson: state.stockSnapshotJson,
        optionsChainJson: state.optionsChainJson,
      });

      if (result.status === 'success' && result.data) {
        logger.aiFlow('AIOptionsAnalysis', 'AI options analysis completed successfully');
        
        dispatch({ 
          type: 'SET_AI_OPTIONS_ANALYSIS', 
          payload: result.data.aiOptionsAnalysisJson 
        });
        
        toast({ 
          title: 'Success', 
          description: `${config.ticker} AI Options Analysis generated successfully` 
        });
      } else {
        throw new Error(result.message || 'Failed to generate AI Options Analysis');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('AIOptionsAnalysis', 'Failed to generate AI options analysis', error);
      
      // Clear loading state on error
      dispatch({ type: 'SET_AI_OPTIONS_ANALYSIS_LOADING', payload: false });
      
      toast({
        title: 'Error Generating AI Options Analysis',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Expiration Selection Handler
  const handleExpirationChange = (value: string) => {
    logger.userAction('ExpirationChange', 'Expiration date changed', { 
      from: state.selectedExpirationDate, 
      to: value 
    });
    dispatch({ type: 'SET_SELECTED_EXPIRATION', payload: value });
  };

  // Options Chain Settings Handlers
  const handleOptionTypeChange = (value: OptionType) => {
    logger.userAction('OptionTypeChange', 'Option type changed', { 
      from: state.optionType, 
      to: value 
    });
    dispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { optionType: value } });
  };

  const handleStrikeCountChange = (value: StrikeCount) => {
    logger.userAction('StrikeCountChange', 'Strike count changed', { 
      from: state.strikeCount, 
      to: value 
    });
    dispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { strikeCount: value } });
  };

  const handleTableDisplayTypeChange = (value: TableDisplayType) => {
    logger.userAction('TableDisplayChange', 'Table display type changed', { 
      from: state.tableDisplayType, 
      to: value 
    });
    dispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { tableDisplayType: value } });
  };

  const isLoading = state.status === 'loading';

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">{config.displayName} Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Real-time {config.ticker} stock analysis with technical indicators and options data
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {config.ticker} Analysis Controls
          </CardTitle>
          <CardDescription>
            Manage expiration dates and trigger data retrieval for {config.ticker}
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
                value={state.selectedExpirationDate}
                onValueChange={handleExpirationChange}
                disabled={isLoading || state.availableExpirationDates.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration date" />
                </SelectTrigger>
                <SelectContent>
                  {state.availableExpirationDates.map((date) => (
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
                <Label htmlFor={`${config.ticker.toLowerCase()}-option-type`} className="text-sm font-medium">
                  Option Type
                </Label>
                <Select
                  value={state.optionType}
                  onValueChange={handleOptionTypeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id={`${config.ticker.toLowerCase()}-option-type`}>
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
                <Label htmlFor={`${config.ticker.toLowerCase()}-strike-count`} className="text-sm font-medium">
                  Strike Count
                </Label>
                <Select
                  value={state.strikeCount.toString()}
                  onValueChange={(value) => handleStrikeCountChange(parseInt(value) as StrikeCount)}
                  disabled={isLoading}
                >
                  <SelectTrigger id={`${config.ticker.toLowerCase()}-strike-count`}>
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
                <Label htmlFor={`${config.ticker.toLowerCase()}-table-display`} className="text-sm font-medium">
                  Table Layout
                </Label>
                <Select
                  value={state.tableDisplayType}
                  onValueChange={handleTableDisplayTypeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id={`${config.ticker.toLowerCase()}-table-display`}>
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
              disabled={isLoading || !state.selectedExpirationDate}
              size="lg"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Get {config.ticker} Stock Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {config.ticker} AI Analysis (On-Demand)
          </CardTitle>
          <CardDescription>
            Generate AI analysis manually. Each button is independent and requires specific data to be available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleAiKeyTakeaways}
              disabled={!state.hasStockData || !state.hasAiTaData || isLoading || state.isAiKeyTakeawaysLoading}
              variant="outline"
              className="flex-1"
            >
              {state.isAiKeyTakeawaysLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Generate AI Key Takeaways
            </Button>
            <Button 
              onClick={handleAiOptionsAnalysis}
              disabled={!state.hasOptionsChainData || isLoading || state.isAiOptionsAnalysisLoading}
              variant="outline"
              className="flex-1"
            >
              {state.isAiOptionsAnalysisLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CandlestickChart className="mr-2 h-4 w-4" />
              )}
              Generate AI Options Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* UI Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarketStatusDisplay />
        <KeyMetricsDisplay />
        <StockSnapshotDisplay />
        <StandardTaDisplay />
        <AiAnalyzedTaDisplay />
      </div>

      {/* AI Analysis Components (Full Width) */}
      <AiKeyTakeawaysDisplay />
      <AiOptionsAnalysisDisplay />

      {/* Options Chain Table (Full Width) */}
      <OptionsChainTable />

      {/* Consolidated AI Chat Interface */}
      <ConsolidatedChat />

      {/* Data Section (Self-contained JSON display) */}
      <DataSection />
    </div>
  );
}