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
import { useCallback, useRef } from 'react';

// SPY Context
import { useSpyAnalysis, useSpyDispatch, SPY_TICKER, type OptionType, type StrikeCount, type TableDisplayType } from '@/contexts/spy-analysis-context';

// Server Actions (reused from Main tab)
import { getExpirationDates } from '@/services/data-sources/adapters/polygon-adapter';
import { fetchStockDataAction } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction } from '@/actions/perform-ai-options-analysis-action';
import { findNextAvailableDate } from '@/lib/date-utils';

// Ticker Logger
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

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

// Macro Orchestrator UI Component (Simplified)
import { SimpleAnalyzeAllButton } from '@/components/macro-orchestrator/simple-analyze-all-button';

export function SpyTabContent() {
  const spyState = useSpyAnalysis();
  const spyDispatch = useSpyDispatch();
  const { toast } = useToast();

  // Create SPY-specific logger
  const logger = createTickerLogger(SPY_TICKER, TICKER_PAGES.SPY_TAB);

  // ✅ CRITICAL FIX: Create ref for fresh state access in async functions
  // This prevents stale closure issues in macro automation Steps 3 & 4
  const spyStateRef = useRef(spyState);
  
  // ✅ CRITICAL FIX: Update ref on every render to ensure fresh state access
  spyStateRef.current = spyState;
  
  // ✅ CRITICAL FIX: Helper function to get fresh SPY state at execution time
  const getFreshSpyState = useCallback(() => spyStateRef.current, []);

  // Deterministic Handler: Fetch SPY Expirations
  const handleFetchExpirations = async () => {
    logger.userAction('FetchExpirations', 'Starting expiration fetch...', { ticker: SPY_TICKER });
    try {
      spyDispatch({ type: 'SET_LOADING' });
      
      // CRITICAL FIX: Clear any previous expiration selection to prevent state contamination
      // This ensures macro automation starts with a clean slate
      logger.state('FetchExpirations', 'Clearing previous expiration selection to prevent contamination', {
        previousSelection: spyState.selectedExpirationDate,
        context: 'Step1_StateCleanup_PreFetch'
      });
      spyDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: '' });
      
      const expirations = await getExpirationDates(SPY_TICKER);
      logger.dataFetch('FetchExpirations', 'Expirations received', { count: expirations.length });
      
      const nextAvailableDate = findNextAvailableDate(expirations);
      logger.dataFetch('FetchExpirations', 'Next available date selected', { nextAvailableDate });
      
      spyDispatch({ type: 'SET_EXPIRATION_DATES', payload: expirations });
      
      if (nextAvailableDate) {
        // CRITICAL: Log expiration selection for macro automation debugging
        logger.state('FetchExpirations', 'Setting default expiration date for macro automation', {
          selectedExpiration: nextAvailableDate,
          availableCount: expirations.length,
          isDefaultSelection: true,
          context: 'Step1_FetchExpirations_DefaultSelection'
        });
        spyDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: nextAvailableDate });
        
        // CRITICAL FIX: Add a brief delay to ensure state update is committed before macro Step 2
        await new Promise(resolve => setTimeout(resolve, 100));
        
        logger.state('FetchExpirations', 'State update committed - ready for Step 2', {
          finalSelectedExpiration: nextAvailableDate,
          context: 'Step1_StateCommit_Complete'
        });
      }
      
      spyDispatch({ type: 'SET_IDLE' });
      
      toast({
        title: `${SPY_TICKER} Expirations Loaded`,
        description: `Found ${expirations.length} available dates. Selected: ${nextAvailableDate || 'None'}`,
      });
      
      logger.userAction('FetchExpirations', 'Completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('FetchExpirations', 'Error occurred', { errorMessage });
      
      spyDispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Fetching Expirations',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: Get SPY Stock Data (Batch Operation)
  // UPDATED: Now accepts optional macro expiration parameter for macro automation
  const handleGetStockData = async (macroExpiration?: string | React.MouseEvent) => {
    // Handle both macro usage (string parameter) and onClick usage (event parameter)
    const macroExp = typeof macroExpiration === 'string' ? macroExpiration : undefined;
    // CRITICAL: Log current selectedExpirationDate before Step 2 execution
    logger.userAction('GetStockData', 'Starting stock data fetch - Step 2 of macro automation', {
      ticker: SPY_TICKER,
      selectedExpiration: spyState.selectedExpirationDate,
      macroExpiration: macroExp, // NEW: Log macro parameter
      parameterProvided: !!macroExp,
      optionType: spyState.optionType,
      strikeCount: spyState.strikeCount,
      context: 'Step2_GetStockData_PreExecution'
    });
    
    // CRITICAL FIX: Use macro expiration if provided, otherwise fallback to shared context
    const finalExpiration = macroExp || spyState.selectedExpirationDate;
    
    logger.state('GetStockData', 'Expiration resolution for API call', {
      macroExpiration: macroExp,
      sharedExpiration: spyState.selectedExpirationDate,
      finalExpiration: finalExpiration,
      usedMacroParameter: !!macroExp,
      context: 'Step2_ExpirationResolution'
    });
    
    // CRITICAL FIX: Enhanced validation with automatic recovery
    let defaultExpiration: string | undefined = undefined;
    if (!finalExpiration) {
      logger.error('GetStockData', 'CRITICAL: No expiration date selected in Step 2', {
        context: 'Step2_GetStockData_ValidationFailure',
        availableExpirations: spyState.availableExpirationDates.length,
        firstAvailable: spyState.availableExpirationDates[0] || 'none'
      });
      
      // CRITICAL FIX: Auto-recovery - try to select the default expiration if available
      if (spyState.availableExpirationDates.length > 0) {
        defaultExpiration = findNextAvailableDate(spyState.availableExpirationDates);
        if (defaultExpiration) {
          logger.state('GetStockData', 'Auto-recovery: Setting default expiration', {
            defaultExpiration,
            context: 'Step2_AutoRecovery_ExpirationFix'
          });
          spyDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: defaultExpiration });
          // Brief delay to ensure state update
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Re-validate after auto-recovery attempt
      if (!finalExpiration && !defaultExpiration) {
        toast({
          title: 'No Expiration Selected',
          description: 'Please select an expiration date first.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // CRITICAL FIX: Final expiration validation before API call
    const finalExpirationToUse = finalExpiration || defaultExpiration;
    logger.state('GetStockData', 'Final expiration validation before API call', {
      finalExpiration: finalExpirationToUse,
      fromState: spyState.selectedExpirationDate,
      fromRecovery: defaultExpiration,
      isValid: !!finalExpirationToUse,
      context: 'Step2_FinalValidation_PreAPI'
    });

    try {
      spyDispatch({ type: 'SET_LOADING' });
      spyDispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: false });

      // Step 1: Fetch Stock Data (including Options Chain)
      // CRITICAL: Log API call parameters with expiration tracking
      logger.serverAction('GetStockData', 'Step 1: About to call fetchStockDataAction', {
        ticker: SPY_TICKER,
        expirationDate: finalExpirationToUse, // ← CRITICAL: Use validated expiration
        optionType: spyState.optionType,
        strikeCount: spyState.strikeCount,
        context: 'Step2_GetStockData_API_Call'
      });
      
      const stockDataResult = await fetchStockDataAction({
        ticker: SPY_TICKER,
        expirationDate: finalExpirationToUse, // ← CRITICAL: Use validated expiration
        optionType: spyState.optionType,
        strikeCount: spyState.strikeCount,
      });

      if (stockDataResult.status !== 'success' || !stockDataResult.data) {
        throw new Error(stockDataResult.error || 'Failed to fetch stock data');
      }
      
      // CRITICAL: Enhanced expiration validation after API response
      const receivedOptionsChain = stockDataResult.data.optionsChainJson;
      let receivedExpiration: string | undefined;
      try {
        const parsedOptionsChain = JSON.parse(receivedOptionsChain);
        receivedExpiration = parsedOptionsChain?.expiration_date;
      } catch (e) {
        receivedExpiration = undefined;
      }
      
      logger.dataFetch('GetStockData', 'Step 1: Stock data received - expiration validation', {
        requestedExpiration: finalExpirationToUse,
        receivedExpiration: receivedExpiration,
        expirationMatch: receivedExpiration === finalExpirationToUse,
        hasOptionsChain: !!receivedOptionsChain && receivedOptionsChain !== '{}',
        context: 'Step2_GetStockData_Response_Validation'
      });
      
      // CRITICAL FIX: Handle expiration mismatch with detailed error reporting
      if (finalExpirationToUse && receivedExpiration && receivedExpiration !== finalExpirationToUse) {
        const mismatchError = `EXPIRATION MISMATCH: Requested ${finalExpirationToUse}, API returned ${receivedExpiration}`;
        logger.error('GetStockData', mismatchError, {
          requestedExpiration: finalExpirationToUse,
          receivedExpiration: receivedExpiration,
          severity: 'CRITICAL',
          context: 'Step2_ExpirationMismatch_Error'
        });
        
        // Show detailed error to user
        toast({
          title: 'Expiration Date Mismatch',
          description: `Expected ${finalExpirationToUse}, but API returned data for ${receivedExpiration}. Please try again.`,
          variant: 'destructive',
        });
        
        // Continue with the received data but log the issue
        logger.state('GetStockData', 'Continuing with received data despite mismatch', {
          willUseExpiration: receivedExpiration,
          context: 'Step2_ContinueWithMismatch'
        });
      }

      // Step 2: Fetch Technical Analysis Data
      logger.dataFetch('GetStockData', 'Step 2: Fetching technical analysis');
      const taResult = await analyzeTaAction({
        ticker: SPY_TICKER,
        stockSnapshotJson: stockDataResult.data.stockSnapshotJson,
      });

      if (taResult.status !== 'success' || !taResult.data) {
        throw new Error(taResult.error || 'Failed to fetch technical analysis');
      }
      logger.dataFetch('GetStockData', 'Step 2: Technical analysis received');

      // Step 3: Batch Update SPY State (including Options Chain)
      logger.state('GetStockData', 'Step 3: Updating state with stock data');
      spyDispatch({ 
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
      logger.state('GetStockData', 'Step 4: Setting options chain data', {
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
      logger.state('GetStockData', 'Step 5: Marking data retrieval complete');
      spyDispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: true });
      spyDispatch({ type: 'SET_IDLE' });

      toast({
        title: `${SPY_TICKER} Data Retrieved`,
        description: 'Stock data, technical analysis, and options chain loaded successfully.',
      });
      
      logger.userAction('GetStockData', 'Completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('GetStockData', 'Error occurred', { errorMessage });
      
      spyDispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Fetching Stock Data',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: SPY AI Key Takeaways (Phase 1)
  // UPDATED: Now accepts optional macro expiration parameter for macro automation
  const handleSpyAiKeyTakeaways = async (macroExpiration?: string | React.MouseEvent) => {
    // Handle both macro usage (string parameter) and onClick usage (event parameter)
    const macroExp = typeof macroExpiration === 'string' ? macroExpiration : undefined;
    
    // ✅ CRITICAL FIX: Get fresh state at execution time to prevent stale closure access
    const freshState = getFreshSpyState();
    
    logger.userAction('AIKeyTakeaways', 'Starting AI key takeaways generation...', {
      ticker: SPY_TICKER,
      macroExpiration: macroExp, // NEW: Log macro parameter
      parameterProvided: !!macroExp,
      selectedExpiration: freshState.selectedExpirationDate, // ✅ FIXED: Fresh state
      hasStockData: !!freshState.stockSnapshotJson, // ✅ FIXED: Fresh state
      hasStandardTA: !!freshState.standardTasJson, // ✅ FIXED: Fresh state
      hasAITA: !!freshState.aiAnalyzedTaJson, // ✅ FIXED: Fresh state
      hasMarketStatus: !!freshState.marketStatusJson // ✅ FIXED: Fresh state
    });
    
    try {
      // Use specific AI loading state instead of global FSM loading
      spyDispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: true });

      const result = await performAiAnalysisAction({
        ticker: SPY_TICKER,
        stockSnapshotJson: freshState.stockSnapshotJson, // ✅ FIXED: Fresh state
        standardTasJson: freshState.standardTasJson, // ✅ FIXED: Fresh state
        aiAnalyzedTaJson: freshState.aiAnalyzedTaJson, // ✅ FIXED: Fresh state
        marketStatusJson: freshState.marketStatusJson, // ✅ FIXED: Fresh state
      });

      if (result.status === 'success' && result.data) {
        logger.userAction('AIKeyTakeaways', 'AI analysis completed successfully');
        
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
      logger.error('AIKeyTakeaways', 'Error occurred', { errorMessage });
      
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
  // UPDATED: Now accepts optional macro expiration parameter for macro automation
  const handleSpyAiOptionsAnalysis = async (macroExpiration?: string | React.MouseEvent) => {
    // Handle both macro usage (string parameter) and onClick usage (event parameter)
    const macroExp = typeof macroExpiration === 'string' ? macroExpiration : undefined;
    
    // ✅ CRITICAL FIX: Get fresh state at execution time to prevent stale closure access
    const freshState = getFreshSpyState();
    
    logger.userAction('AIOptionsAnalysis', 'Starting AI options analysis...', {
      ticker: SPY_TICKER,
      macroExpiration: macroExp, // NEW: Log macro parameter
      parameterProvided: !!macroExp,
      selectedExpiration: freshState.selectedExpirationDate, // ✅ FIXED: Fresh state
      hasStockData: !!freshState.stockSnapshotJson, // ✅ FIXED: Fresh state
      hasOptionsChain: !!freshState.optionsChainJson // ✅ FIXED: Fresh state
    });
    
    try {
      // Use specific AI loading state instead of global FSM loading
      spyDispatch({ type: 'SET_AI_OPTIONS_ANALYSIS_LOADING', payload: true });

      const result = await performAiOptionsAnalysisAction({
        ticker: SPY_TICKER,
        stockSnapshotJson: freshState.stockSnapshotJson, // ✅ FIXED: Fresh state
        optionsChainJson: freshState.optionsChainJson, // ✅ FIXED: Fresh state
      });

      if (result.status === 'success' && result.data) {
        logger.userAction('AIOptionsAnalysis', 'AI options analysis completed successfully');
        
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
      logger.error('AIOptionsAnalysis', 'Error occurred', { errorMessage });
      
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
    // CRITICAL: Enhanced expiration change logging for macro automation
    logger.userAction('ExpirationChange', 'Expiration date manually changed by user', { 
      from: spyState.selectedExpirationDate, 
      to: value,
      changeType: 'manual_user_selection',
      context: 'UI_ExpirationDropdown_Change'
    });
    spyDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: value });
    
    // Log state after change
    logger.state('ExpirationChange', 'State updated with new expiration', {
      newSelectedExpiration: value,
      context: 'Post_Manual_Selection'
    });
  };

  // Options Chain Settings Handlers
  const handleOptionTypeChange = (value: OptionType) => {
    logger.userAction('OptionTypeChange', 'Option type changed', { 
      from: spyState.optionType, 
      to: value 
    });
    spyDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { optionType: value } });
  };

  const handleStrikeCountChange = (value: StrikeCount) => {
    logger.userAction('StrikeCountChange', 'Strike count changed', { 
      from: spyState.strikeCount, 
      to: value 
    });
    spyDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { strikeCount: value } });
  };

  const handleTableDisplayTypeChange = (value: TableDisplayType) => {
    logger.userAction('TableDisplayChange', 'Table display type changed', { 
      from: spyState.tableDisplayType, 
      to: value 
    });
    spyDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { tableDisplayType: value } });
  };

  const isLoading = spyState.status === 'loading';

  // REMOVED: Callback props no longer needed - SimpleAnalyzeAllButton now uses direct hook access
  // This eliminates React hook closure state access issues

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

      {/* SPY Macro Orchestrator */}
      <SimpleAnalyzeAllButton
        ticker={SPY_TICKER}
        onFetchExpirations={handleFetchExpirations}
        onGetStockData={handleGetStockData}
        onGenerateAiKeyTakeaways={handleSpyAiKeyTakeaways}
        onGenerateAiOptionsAnalysis={handleSpyAiOptionsAnalysis}
        canFetchExpirations={() => !isLoading}
        canGetStockData={() => !isLoading && !!spyState.selectedExpirationDate}
        canGenerateAiKeyTakeaways={() => {
          const hasRequiredData = !isLoading && spyState.hasStockData && spyState.hasAiTaData && !spyState.isAiKeyTakeawaysLoading;
          const hasValidExpiration = !!spyState.selectedExpirationDate;
          return hasRequiredData && hasValidExpiration;
        }}
        canGenerateAiOptionsAnalysis={() => {
          const hasRequiredData = !isLoading && spyState.hasOptionsChainData && !spyState.isAiOptionsAnalysisLoading;
          const hasValidExpiration = !!spyState.selectedExpirationDate;
          return hasRequiredData && hasValidExpiration;
        }}
        // REMOVED: getCurrentExpiration and getAvailableExpirations props
        // Component now uses direct context access based on ticker
        onComplete={() => {
          toast({
            title: `${SPY_TICKER} Macro Complete`,
            description: 'All analysis steps have been executed successfully!',
          });
        }}
        onError={(error) => {
          toast({
            title: `${SPY_TICKER} Macro Failed`,
            description: error.message,
            variant: 'destructive',
          });
        }}
      />

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

// Default export for dynamic imports
export default SpyTabContent;