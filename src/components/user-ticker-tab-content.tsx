'use client';

/**
 * @fileOverview User Input Ticker Tab Content - Dynamic Ticker Orchestrator
 * 
 * Main orchestrator component for user-input ticker analysis tab.
 * This component allows users to input any ticker symbol for analysis.
 * 
 * Architecture Pattern: Deterministic Handlers + Dynamic Ticker + Context Integration + FSM State Management
 * 
 * Key Features:
 * - Ticker input UI with validation
 * - All handlers are ticker-agnostic (work with any valid ticker)
 * - Data clearing when ticker changes
 * - Same functionality as SPY/NVDA tabs but for any ticker
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Loader2, CalendarDays, Search, Zap, Settings, FileText, CandlestickChart, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// User Ticker Context
import { 
  useUserTickerAnalysis, 
  useUserTickerDispatch, 
  validateTicker,
  type OptionType, 
  type StrikeCount, 
  type TableDisplayType 
} from '@/contexts/user-ticker-analysis-context';

// Server Actions (reused from other tabs)
import { getExpirationDates } from '@/services/data-sources/adapters/polygon-adapter';
import { fetchStockDataAction } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction } from '@/actions/perform-ai-options-analysis-action';
import { findNextAvailableDate } from '@/lib/date-utils';

// Ticker Logger
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// User Ticker UI Components (will be created next)
import { UserTickerDataSection } from '@/components/user-ticker-data-section';
import { UserTickerMarketStatusDisplay } from '@/components/user-ticker-market-status-display';
import { UserTickerKeyMetricsDisplay } from '@/components/user-ticker-key-metrics-display';
import { UserTickerStockSnapshotDisplay } from '@/components/user-ticker-stock-snapshot-display';
import { UserTickerStandardTaDisplay } from '@/components/user-ticker-standard-ta-display';
import { UserTickerAiAnalyzedTaDisplay } from '@/components/user-ticker-ai-analyzed-ta-display';
import { UserTickerOptionsChainTable } from '@/components/user-ticker-options-chain-table';
import { UserTickerAiKeyTakeawaysDisplay } from '@/components/user-ticker-ai-key-takeaways-display';
import { UserTickerAiOptionsAnalysisDisplay } from '@/components/user-ticker-ai-options-analysis-display';
import { UserTickerConsolidatedChat } from '@/components/user-ticker-consolidated-chat';

export function UserTickerTabContent() {
  const userTickerState = useUserTickerAnalysis();
  const userTickerDispatch = useUserTickerDispatch();
  const { toast } = useToast();
  
  // Local state for ticker input
  const [tickerInput, setTickerInput] = useState('');

  // Create dynamic logger based on current ticker
  const logger = createTickerLogger(userTickerState.currentTicker || 'USER', TICKER_PAGES.USER_INPUT_TAB);

  // Handler: Set Ticker
  const handleSetTicker = () => {
    const validation = validateTicker(tickerInput);
    const cleanTicker = tickerInput.trim().toUpperCase();
    
    logger.userAction('SetTicker', 'Attempting to set ticker', { 
      input: tickerInput, 
      clean: cleanTicker, 
      isValid: validation.isValid 
    });
    
    if (validation.isValid) {
      userTickerDispatch({ 
        type: 'SET_CURRENT_TICKER', 
        payload: { ticker: cleanTicker, isValid: true } 
      });
      
      toast({
        title: 'Ticker Set',
        description: `Analysis ticker set to ${cleanTicker}`,
      });
      
      logger.userAction('SetTicker', 'Ticker set successfully', { ticker: cleanTicker });
    } else {
      userTickerDispatch({ 
        type: 'SET_CURRENT_TICKER', 
        payload: { ticker: cleanTicker, isValid: false, error: validation.error } 
      });
      
      toast({
        title: 'Invalid Ticker',
        description: validation.error,
        variant: 'destructive',
      });
      
      logger.error('SetTicker', 'Ticker validation failed', validation.error);
    }
  };

  // Handler: Clear Ticker and Data
  const handleClearTicker = () => {
    logger.userAction('ClearTicker', 'Clearing ticker and all data', { currentTicker: userTickerState.currentTicker });
    
    setTickerInput('');
    userTickerDispatch({ type: 'SET_CURRENT_TICKER', payload: { ticker: '', isValid: false } });
    userTickerDispatch({ type: 'CLEAR_TICKER_DATA' });
    
    toast({
      title: 'Ticker Cleared',
      description: 'Ticker and all associated data have been cleared',
    });
    
    logger.userAction('ClearTicker', 'Ticker and data cleared successfully');
  };

  // Deterministic Handler: Fetch Expirations (Dynamic Ticker)
  const handleFetchExpirations = async () => {
    if (!userTickerState.currentTicker || !userTickerState.isTickerValid) {
      toast({
        title: 'No Valid Ticker',
        description: 'Please enter a valid ticker symbol first.',
        variant: 'destructive',
      });
      return;
    }

    logger.userAction('FetchExpirations', 'Starting expiration fetch...', { ticker: userTickerState.currentTicker });
    try {
      userTickerDispatch({ type: 'SET_LOADING' });
      
      const expirations = await getExpirationDates(userTickerState.currentTicker);
      logger.dataFetch('FetchExpirations', 'Expirations received', { count: expirations.length });
      
      const nextAvailableDate = findNextAvailableDate(expirations);
      logger.userAction('FetchExpirations', 'Next available date determined', { date: nextAvailableDate });
      
      userTickerDispatch({ type: 'SET_EXPIRATION_DATES', payload: expirations });
      
      if (nextAvailableDate) {
        userTickerDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: nextAvailableDate });
      }
      
      userTickerDispatch({ type: 'SET_IDLE' });
      
      toast({
        title: `${userTickerState.currentTicker} Expirations Loaded`,
        description: `Found ${expirations.length} available dates. Selected: ${nextAvailableDate || 'None'}`,
      });
      
      logger.userAction('FetchExpirations', 'Completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('FetchExpirations', 'Failed to fetch expirations', error);
      
      userTickerDispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Fetching Expirations',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: Get Stock Data (Dynamic Ticker)
  const handleGetStockData = async () => {
    if (!userTickerState.currentTicker || !userTickerState.isTickerValid) {
      toast({
        title: 'No Valid Ticker',
        description: 'Please enter a valid ticker symbol first.',
        variant: 'destructive',
      });
      return;
    }

    logger.userAction('GetStockData', 'Starting stock data fetch...', {
      ticker: userTickerState.currentTicker,
      expiration: userTickerState.selectedExpirationDate,
      optionType: userTickerState.optionType,
      strikeCount: userTickerState.strikeCount
    });
    
    if (!userTickerState.selectedExpirationDate) {
      logger.userAction('GetStockData', 'No expiration date selected');
      toast({
        title: 'No Expiration Selected',
        description: 'Please select an expiration date first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      userTickerDispatch({ type: 'SET_LOADING' });
      userTickerDispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: false });

      // Step 1: Fetch Stock Data (including Options Chain)
      logger.serverAction('GetStockData', 'Step 1: Fetching stock data...');
      const stockDataResult = await fetchStockDataAction({
        ticker: userTickerState.currentTicker,
        expirationDate: userTickerState.selectedExpirationDate,
        optionType: userTickerState.optionType,
        strikeCount: userTickerState.strikeCount,
      });

      if (stockDataResult.status !== 'success' || !stockDataResult.data) {
        throw new Error(stockDataResult.error || 'Failed to fetch stock data');
      }
      logger.dataFetch('GetStockData', 'Step 1: Stock data received');

      // Step 2: Fetch Technical Analysis Data
      logger.serverAction('GetStockData', 'Step 2: Fetching technical analysis...');
      const taResult = await analyzeTaAction({
        ticker: userTickerState.currentTicker,
        stockSnapshotJson: stockDataResult.data.stockSnapshotJson,
      });

      if (taResult.status !== 'success' || !taResult.data) {
        throw new Error(taResult.error || 'Failed to fetch technical analysis');
      }
      logger.dataFetch('GetStockData', 'Step 2: Technical analysis received');

      // Step 3: Batch Update State
      logger.state('GetStockData', 'Step 3: Updating state with stock data');
      userTickerDispatch({ 
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
      userTickerDispatch({ 
        type: 'SET_OPTIONS_CHAIN_DATA', 
        payload: stockDataResult.data.optionsChainJson 
      });

      // Step 5: Signal completion
      logger.state('GetStockData', 'Step 5: Marking data retrieval complete');
      userTickerDispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: true });
      userTickerDispatch({ type: 'SET_IDLE' });

      toast({
        title: `${userTickerState.currentTicker} Data Retrieved`,
        description: 'Stock data, technical analysis, and options chain loaded successfully.',
      });
      
      logger.userAction('GetStockData', 'Completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('GetStockData', 'Failed to fetch stock data', error);
      
      userTickerDispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Fetching Stock Data',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: AI Key Takeaways (Dynamic Ticker)
  const handleAiKeyTakeaways = async () => {
    if (!userTickerState.currentTicker || !userTickerState.isTickerValid) {
      toast({
        title: 'No Valid Ticker',
        description: 'Please enter a valid ticker symbol first.',
        variant: 'destructive',
      });
      return;
    }

    logger.userAction('AIKeyTakeaways', 'Starting AI key takeaways generation...', {
      ticker: userTickerState.currentTicker,
      hasStockData: !!userTickerState.stockSnapshotJson,
      hasStandardTA: !!userTickerState.standardTasJson,
      hasAITA: !!userTickerState.aiAnalyzedTaJson,
      hasMarketStatus: !!userTickerState.marketStatusJson
    });
    
    try {
      userTickerDispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: true });

      const result = await performAiAnalysisAction({
        ticker: userTickerState.currentTicker,
        stockSnapshotJson: userTickerState.stockSnapshotJson,
        standardTasJson: userTickerState.standardTasJson,
        aiAnalyzedTaJson: userTickerState.aiAnalyzedTaJson,
        marketStatusJson: userTickerState.marketStatusJson,
      });

      if (result.status === 'success' && result.data) {
        logger.aiFlow('AIKeyTakeaways', 'AI analysis completed successfully');
        
        userTickerDispatch({ 
          type: 'SET_AI_KEY_TAKEAWAYS', 
          payload: result.data.aiKeyTakeawaysJson 
        });
        
        toast({ 
          title: 'Success', 
          description: `${userTickerState.currentTicker} AI Key Takeaways generated successfully` 
        });
      } else {
        throw new Error(result.message || 'Failed to generate AI Key Takeaways');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('AIKeyTakeaways', 'Failed to generate AI key takeaways', error);
      
      userTickerDispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: false });
      
      toast({
        title: 'Error Generating AI Key Takeaways',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: AI Options Analysis (Dynamic Ticker)
  const handleAiOptionsAnalysis = async () => {
    if (!userTickerState.currentTicker || !userTickerState.isTickerValid) {
      toast({
        title: 'No Valid Ticker',
        description: 'Please enter a valid ticker symbol first.',
        variant: 'destructive',
      });
      return;
    }

    logger.userAction('AIOptionsAnalysis', 'Starting AI options analysis...', {
      ticker: userTickerState.currentTicker,
      hasStockData: !!userTickerState.stockSnapshotJson,
      hasOptionsChain: !!userTickerState.optionsChainJson
    });
    
    try {
      userTickerDispatch({ type: 'SET_AI_OPTIONS_ANALYSIS_LOADING', payload: true });

      const result = await performAiOptionsAnalysisAction({
        ticker: userTickerState.currentTicker,
        stockSnapshotJson: userTickerState.stockSnapshotJson,
        optionsChainJson: userTickerState.optionsChainJson,
      });

      if (result.status === 'success' && result.data) {
        logger.aiFlow('AIOptionsAnalysis', 'AI options analysis completed successfully');
        
        userTickerDispatch({ 
          type: 'SET_AI_OPTIONS_ANALYSIS', 
          payload: result.data.aiOptionsAnalysisJson 
        });
        
        toast({ 
          title: 'Success', 
          description: `${userTickerState.currentTicker} AI Options Analysis generated successfully` 
        });
      } else {
        throw new Error(result.message || 'Failed to generate AI Options Analysis');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('AIOptionsAnalysis', 'Failed to generate AI options analysis', error);
      
      userTickerDispatch({ type: 'SET_AI_OPTIONS_ANALYSIS_LOADING', payload: false });
      
      toast({
        title: 'Error Generating AI Options Analysis',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Options Settings Handlers
  const handleExpirationChange = (value: string) => {
    logger.userAction('ExpirationChange', 'Expiration date changed', { 
      from: userTickerState.selectedExpirationDate, 
      to: value 
    });
    userTickerDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: value });
  };

  const handleOptionTypeChange = (value: OptionType) => {
    logger.userAction('OptionTypeChange', 'Option type changed', { 
      from: userTickerState.optionType, 
      to: value 
    });
    userTickerDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { optionType: value } });
  };

  const handleStrikeCountChange = (value: StrikeCount) => {
    logger.userAction('StrikeCountChange', 'Strike count changed', { 
      from: userTickerState.strikeCount, 
      to: value 
    });
    userTickerDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { strikeCount: value } });
  };

  const handleTableDisplayTypeChange = (value: TableDisplayType) => {
    logger.userAction('TableDisplayChange', 'Table display type changed', { 
      from: userTickerState.tableDisplayType, 
      to: value 
    });
    userTickerDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { tableDisplayType: value } });
  };

  const isLoading = userTickerState.status === 'loading';
  const hasValidTicker = userTickerState.currentTicker && userTickerState.isTickerValid;

  return (
    <div className="space-y-6">
      {/* User Input Ticker Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">User Input Ticker Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Enter any ticker symbol for real-time stock analysis with technical indicators and options data
        </p>
      </div>

      {/* Ticker Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ticker Symbol Input
          </CardTitle>
          <CardDescription>
            Enter a valid ticker symbol (e.g., AAPL, MSFT, TSLA) to begin analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow">
              <Label htmlFor="ticker-input" className="text-sm font-medium mb-2 block">
                Ticker Symbol
              </Label>
              <Input
                id="ticker-input"
                placeholder="Enter ticker (e.g. AAPL)"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                disabled={isLoading}
                className={userTickerState.tickerValidationError ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSetTicker();
                  }
                }}
              />
              {userTickerState.tickerValidationError && (
                <p className="text-red-500 text-sm mt-1">{userTickerState.tickerValidationError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSetTicker}
                disabled={isLoading || !tickerInput.trim()}
                variant="default"
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Set Ticker
              </Button>
              <Button
                onClick={handleClearTicker}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                Clear
              </Button>
            </div>
          </div>
          
          {hasValidTicker && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">
                Current Ticker: <strong>{userTickerState.currentTicker}</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Controls - Only show if ticker is set */}
      {hasValidTicker && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {userTickerState.currentTicker} Analysis Controls
            </CardTitle>
            <CardDescription>
              Manage expiration dates and trigger data retrieval for {userTickerState.currentTicker}
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
                  value={userTickerState.selectedExpirationDate}
                  onValueChange={handleExpirationChange}
                  disabled={isLoading || userTickerState.availableExpirationDates.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration date" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTickerState.availableExpirationDates.map((date) => (
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
                  <Label htmlFor="user-option-type" className="text-sm font-medium">
                    Option Type
                  </Label>
                  <Select
                    value={userTickerState.optionType}
                    onValueChange={handleOptionTypeChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="user-option-type">
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
                  <Label htmlFor="user-strike-count" className="text-sm font-medium">
                    Strike Count
                  </Label>
                  <Select
                    value={userTickerState.strikeCount.toString()}
                    onValueChange={(value) => handleStrikeCountChange(parseInt(value) as StrikeCount)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="user-strike-count">
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
                  <Label htmlFor="user-table-display" className="text-sm font-medium">
                    Table Layout
                  </Label>
                  <Select
                    value={userTickerState.tableDisplayType}
                    onValueChange={handleTableDisplayTypeChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="user-table-display">
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
                disabled={isLoading || !userTickerState.selectedExpirationDate}
                size="lg"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Get {userTickerState.currentTicker} Stock Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Controls - Only show if ticker is set */}
      {hasValidTicker && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {userTickerState.currentTicker} AI Analysis (On-Demand)
            </CardTitle>
            <CardDescription>
              Generate AI analysis manually. Each button is independent and requires specific data to be available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleAiKeyTakeaways}
                disabled={!userTickerState.hasStockData || !userTickerState.hasAiTaData || isLoading || userTickerState.isAiKeyTakeawaysLoading}
                variant="outline"
                className="flex-1"
              >
                {userTickerState.isAiKeyTakeawaysLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Generate AI Key Takeaways
              </Button>
              <Button 
                onClick={handleAiOptionsAnalysis}
                disabled={!userTickerState.hasOptionsChainData || isLoading || userTickerState.isAiOptionsAnalysisLoading}
                variant="outline"
                className="flex-1"
              >
                {userTickerState.isAiOptionsAnalysisLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CandlestickChart className="mr-2 h-4 w-4" />
                )}
                Generate AI Options Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Display Components - Only show if ticker is set and has data */}
      {hasValidTicker && userTickerState.hasStockData && (
        <>
          {/* UI Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserTickerMarketStatusDisplay />
            <UserTickerKeyMetricsDisplay />
            <UserTickerStockSnapshotDisplay />
            <UserTickerStandardTaDisplay />
            <UserTickerAiAnalyzedTaDisplay />
          </div>

          {/* AI Analysis Components (Full Width) */}
          <UserTickerAiKeyTakeawaysDisplay />
          <UserTickerAiOptionsAnalysisDisplay />

          {/* Options Chain Table (Full Width) */}
          <UserTickerOptionsChainTable />

          {/* Consolidated AI Chat Interface */}
          <UserTickerConsolidatedChat />

          {/* Data Section (Self-contained JSON display) */}
          <UserTickerDataSection />
        </>
      )}

      {/* Help Text - Show when no ticker is set */}
      {!hasValidTicker && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Get Started</h3>
            <p className="text-muted-foreground mb-4">
              Enter a ticker symbol above to begin your analysis. You can analyze any publicly traded stock.
            </p>
            <p className="text-sm text-muted-foreground">
              Examples: AAPL (Apple), MSFT (Microsoft), TSLA (Tesla), GOOGL (Google), AMZN (Amazon)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}