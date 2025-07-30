'use client';

/**
 * @fileOverview NVDA Tab Content - Created from SPY Blueprint Orchestrator
 * 
 * Main orchestrator component for the NVDA-specific analysis tab.
 * Architecture Pattern: Deterministic Handlers + Context Integration + FSM State Management
 * 
 * Created from the SPY blueprint which demonstrated excellent architectural patterns:
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

// NVDA Context
import { useNvdaAnalysis, useNvdaDispatch, NVDA_TICKER, type OptionType, type StrikeCount, type TableDisplayType } from '@/contexts/nvda-analysis-context';

// Server Actions (reused from Main/SPY tabs)
import { getExpirationDates } from '@/services/data-sources/adapters/polygon-adapter';
import { fetchStockDataAction, fetchStockDataActionWithLogging } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction } from '@/actions/perform-ai-options-analysis-action';
import { findNextAvailableDate } from '@/lib/date-utils';

// Server Log Handler
import { useServerLogs } from '@/lib/client-log-handler';

// Ticker Logger
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// NVDA Data Section Component
import { NvdaDataSection } from '@/components/nvda-data-section';

// NVDA UI Components (will be created next)
import { NvdaMarketStatusDisplay } from '@/components/nvda-market-status-display';
import { NvdaKeyMetricsDisplay } from '@/components/nvda-key-metrics-display';
import { NvdaStockSnapshotDisplay } from '@/components/nvda-stock-snapshot-display';
import { NvdaStandardTaDisplay } from '@/components/nvda-standard-ta-display';
import { NvdaAiAnalyzedTaDisplay } from '@/components/nvda-ai-analyzed-ta-display';
import { NvdaOptionsChainTable } from '@/components/nvda-options-chain-table';
import { NvdaAiKeyTakeawaysDisplay } from '@/components/nvda-ai-key-takeaways-display';
import { NvdaAiOptionsAnalysisDisplay } from '@/components/nvda-ai-options-analysis-display';
import { NvdaConsolidatedChat } from '@/components/nvda-consolidated-chat';

// Macro Orchestrator UI Component (Simplified)
import { SimpleAnalyzeAllButton } from '@/components/macro-orchestrator/simple-analyze-all-button';

// Create NVDA-specific logger
const logger = createTickerLogger(NVDA_TICKER, TICKER_PAGES.NVDA_TAB);

export function NvdaTabContent() {
  const nvdaState = useNvdaAnalysis();
  const nvdaDispatch = useNvdaDispatch();
  const { toast } = useToast();
  const { processLogs } = useServerLogs();

  // Deterministic Handler: Fetch NVDA Expirations
  const handleFetchExpirations = async () => {
    logger.userAction('FetchExpirations', 'Starting expiration fetch...', { ticker: NVDA_TICKER });
    try {
      nvdaDispatch({ type: 'SET_LOADING' });
      
      // CRITICAL FIX: Clear any previous expiration selection to prevent state contamination
      // This ensures macro automation starts with a clean slate
      logger.state('FetchExpirations', 'Clearing previous expiration selection to prevent contamination', {
        previousSelection: nvdaState.selectedExpirationDate,
        context: 'Step1_StateCleanup_PreFetch'
      });
      nvdaDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: '' });
      
      const expirations = await getExpirationDates(NVDA_TICKER);
      logger.dataFetch('FetchExpirations', 'Expirations received', { count: expirations.length });
      
      const nextAvailableDate = findNextAvailableDate(expirations);
      logger.userAction('FetchExpirations', 'Next available date determined', { date: nextAvailableDate });
      
      nvdaDispatch({ type: 'SET_EXPIRATION_DATES', payload: expirations });
      
      if (nextAvailableDate) {
        // CRITICAL: Log expiration selection for macro automation debugging
        logger.state('FetchExpirations', 'Setting default expiration date for macro automation', {
          selectedExpiration: nextAvailableDate,
          availableCount: expirations.length,
          isDefaultSelection: true,
          context: 'Step1_FetchExpirations_DefaultSelection'
        });
        nvdaDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: nextAvailableDate });
        
        // CRITICAL FIX: Add a brief delay to ensure state update is committed before macro Step 2
        await new Promise(resolve => setTimeout(resolve, 100));
        
        logger.state('FetchExpirations', 'State update committed - ready for Step 2', {
          finalSelectedExpiration: nextAvailableDate,
          context: 'Step1_StateCommit_Complete'
        });
      }
      
      nvdaDispatch({ type: 'SET_IDLE' });
      
      toast({
        title: `${NVDA_TICKER} Expirations Loaded`,
        description: `Found ${expirations.length} available dates. Selected: ${nextAvailableDate || 'None'}`,
      });
      
      logger.userAction('FetchExpirations', 'Completed successfully with state cleanup');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('FetchExpirations', 'Failed to fetch expirations', error);
      
      nvdaDispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Fetching Expirations',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: Get NVDA Stock Data (Batch Operation)
  const handleGetStockData = async () => {
    // CRITICAL: Log current selectedExpirationDate before Step 2 execution
    logger.userAction('GetStockData', 'Starting stock data fetch - Step 2 of macro automation', {
      ticker: NVDA_TICKER,
      selectedExpiration: nvdaState.selectedExpirationDate,
      optionType: nvdaState.optionType,
      strikeCount: nvdaState.strikeCount,
      context: 'Step2_GetStockData_PreExecution'
    });
    
    // CRITICAL FIX: Enhanced validation with automatic recovery
    let defaultExpiration: string | undefined = undefined;
    if (!nvdaState.selectedExpirationDate) {
      logger.error('GetStockData', 'CRITICAL: No expiration date selected in Step 2', {
        context: 'Step2_GetStockData_ValidationFailure',
        availableExpirations: nvdaState.availableExpirationDates.length,
        firstAvailable: nvdaState.availableExpirationDates[0] || 'none'
      });
      
      // CRITICAL FIX: Auto-recovery - try to select the default expiration if available
      if (nvdaState.availableExpirationDates.length > 0) {
        defaultExpiration = findNextAvailableDate(nvdaState.availableExpirationDates);
        if (defaultExpiration) {
          logger.state('GetStockData', 'Auto-recovery: Setting default expiration', {
            defaultExpiration,
            context: 'Step2_AutoRecovery_ExpirationFix'
          });
          nvdaDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: defaultExpiration });
          // Brief delay to ensure state update
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Re-validate after auto-recovery attempt
      if (!nvdaState.selectedExpirationDate && !defaultExpiration) {
        toast({
          title: 'No Expiration Selected',
          description: 'Please select an expiration date first.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // CRITICAL FIX: Final expiration validation before API call
    const finalExpirationToUse = nvdaState.selectedExpirationDate || defaultExpiration;
    logger.state('GetStockData', 'Final expiration validation before API call', {
      finalExpiration: finalExpirationToUse,
      fromState: nvdaState.selectedExpirationDate,
      fromRecovery: defaultExpiration,
      isValid: !!finalExpirationToUse,
      context: 'Step2_FinalValidation_PreAPI'
    });

    try {
      nvdaDispatch({ type: 'SET_LOADING' });
      nvdaDispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: false });

      // Step 1: Fetch Stock Data (including Options Chain)
      // CRITICAL: Log API call parameters with expiration tracking
      logger.serverAction('GetStockData', 'Step 1: About to call fetchStockDataAction', {
        ticker: NVDA_TICKER,
        expirationDate: finalExpirationToUse, // ← CRITICAL: Use validated expiration
        optionType: nvdaState.optionType,
        strikeCount: nvdaState.strikeCount,
        context: 'Step2_GetStockData_API_Call'
      });
      
      const stockDataResult = await fetchStockDataActionWithLogging({
        ticker: NVDA_TICKER,
        expirationDate: finalExpirationToUse, // ← CRITICAL: Use validated expiration
        optionType: nvdaState.optionType,
        strikeCount: nvdaState.strikeCount,
      });

      // Process server logs to client console
      processLogs(stockDataResult);

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
      logger.serverAction('GetStockData', 'Step 2: Fetching technical analysis...');
      const taResult = await analyzeTaAction({
        ticker: NVDA_TICKER,
        stockSnapshotJson: stockDataResult.data.stockSnapshotJson,
      });

      if (taResult.status !== 'success' || !taResult.data) {
        throw new Error(taResult.error || 'Failed to fetch technical analysis');
      }
      logger.dataFetch('GetStockData', 'Step 2: Technical analysis received');

      // Step 3: Batch Update NVDA State (including Options Chain)
      // CRITICAL: Log state update with expiration tracking
      logger.state('GetStockData', 'Step 3: About to update state with received data', {
        requestedExpiration: finalExpirationToUse,
        receivedExpiration: receivedExpiration,
        dataIntegrityCheck: receivedExpiration === finalExpirationToUse ? 'PASSED' : 'FAILED',
        context: 'Step2_GetStockData_State_Update'
      });
      nvdaDispatch({ 
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
      nvdaDispatch({ 
        type: 'SET_OPTIONS_CHAIN_DATA', 
        payload: stockDataResult.data.optionsChainJson 
      });

      // Step 5: Signal that ALL data retrieval is complete for batch UI updates
      logger.state('GetStockData', 'Step 5: Marking data retrieval complete');
      nvdaDispatch({ type: 'SET_DATA_RETRIEVAL_COMPLETE', payload: true });
      nvdaDispatch({ type: 'SET_IDLE' });

      toast({
        title: `${NVDA_TICKER} Data Retrieved`,
        description: 'Stock data, technical analysis, and options chain loaded successfully.',
      });
      
      logger.userAction('GetStockData', 'Completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('GetStockData', 'Failed to fetch stock data', error);
      
      nvdaDispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast({
        title: 'Error Fetching Stock Data',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: NVDA AI Key Takeaways
  const handleNvdaAiKeyTakeaways = async () => {
    logger.userAction('AIKeyTakeaways', 'Starting AI key takeaways generation...', {
      ticker: NVDA_TICKER,
      hasStockData: !!nvdaState.stockSnapshotJson,
      hasStandardTA: !!nvdaState.standardTasJson,
      hasAITA: !!nvdaState.aiAnalyzedTaJson,
      hasMarketStatus: !!nvdaState.marketStatusJson
    });
    
    try {
      // Use specific AI loading state instead of global FSM loading
      nvdaDispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: true });

      const result = await performAiAnalysisAction({
        ticker: NVDA_TICKER,
        stockSnapshotJson: nvdaState.stockSnapshotJson,
        standardTasJson: nvdaState.standardTasJson,
        aiAnalyzedTaJson: nvdaState.aiAnalyzedTaJson,
        marketStatusJson: nvdaState.marketStatusJson,
      });

      if (result.status === 'success' && result.data) {
        logger.aiFlow('AIKeyTakeaways', 'AI analysis completed successfully');
        
        nvdaDispatch({ 
          type: 'SET_AI_KEY_TAKEAWAYS', 
          payload: result.data.aiKeyTakeawaysJson 
        });
        
        toast({ 
          title: 'Success', 
          description: `${NVDA_TICKER} AI Key Takeaways generated successfully` 
        });
      } else {
        throw new Error(result.message || 'Failed to generate AI Key Takeaways');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('AIKeyTakeaways', 'Failed to generate AI key takeaways', error);
      
      // Clear loading state on error
      nvdaDispatch({ type: 'SET_AI_KEY_TAKEAWAYS_LOADING', payload: false });
      
      toast({
        title: 'Error Generating AI Key Takeaways',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Deterministic Handler: NVDA AI Options Analysis
  const handleNvdaAiOptionsAnalysis = async () => {
    logger.userAction('AIOptionsAnalysis', 'Starting AI options analysis...', {
      ticker: NVDA_TICKER,
      hasStockData: !!nvdaState.stockSnapshotJson,
      hasOptionsChain: !!nvdaState.optionsChainJson
    });
    
    try {
      // Use specific AI loading state instead of global FSM loading
      nvdaDispatch({ type: 'SET_AI_OPTIONS_ANALYSIS_LOADING', payload: true });

      const result = await performAiOptionsAnalysisAction({
        ticker: NVDA_TICKER,
        stockSnapshotJson: nvdaState.stockSnapshotJson,
        optionsChainJson: nvdaState.optionsChainJson,
      });

      if (result.status === 'success' && result.data) {
        logger.aiFlow('AIOptionsAnalysis', 'AI options analysis completed successfully');
        
        nvdaDispatch({ 
          type: 'SET_AI_OPTIONS_ANALYSIS', 
          payload: result.data.aiOptionsAnalysisJson 
        });
        
        toast({ 
          title: 'Success', 
          description: `${NVDA_TICKER} AI Options Analysis generated successfully` 
        });
      } else {
        throw new Error(result.message || 'Failed to generate AI Options Analysis');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('AIOptionsAnalysis', 'Failed to generate AI options analysis', error);
      
      // Clear loading state on error
      nvdaDispatch({ type: 'SET_AI_OPTIONS_ANALYSIS_LOADING', payload: false });
      
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
      from: nvdaState.selectedExpirationDate, 
      to: value,
      changeType: 'manual_user_selection',
      context: 'UI_ExpirationDropdown_Change'
    });
    nvdaDispatch({ type: 'SET_SELECTED_EXPIRATION', payload: value });
    
    // Log state after change
    logger.state('ExpirationChange', 'State updated with new expiration', {
      newSelectedExpiration: value,
      context: 'Post_Manual_Selection'
    });
  };

  // Options Chain Settings Handlers
  const handleOptionTypeChange = (value: OptionType) => {
    logger.userAction('OptionTypeChange', 'Option type changed', { 
      from: nvdaState.optionType, 
      to: value 
    });
    nvdaDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { optionType: value } });
  };

  const handleStrikeCountChange = (value: StrikeCount) => {
    logger.userAction('StrikeCountChange', 'Strike count changed', { 
      from: nvdaState.strikeCount, 
      to: value 
    });
    nvdaDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { strikeCount: value } });
  };

  const handleTableDisplayTypeChange = (value: TableDisplayType) => {
    logger.userAction('TableDisplayChange', 'Table display type changed', { 
      from: nvdaState.tableDisplayType, 
      to: value 
    });
    nvdaDispatch({ type: 'SET_OPTIONS_SETTINGS', payload: { tableDisplayType: value } });
  };

  const isLoading = nvdaState.status === 'loading';

  return (
    <div className="space-y-6">
      {/* NVDA Analysis Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">NVDA Dedicated Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Real-time {NVDA_TICKER} (NVIDIA Corporation) stock analysis with technical indicators and options data
        </p>
      </div>

      {/* NVDA Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {NVDA_TICKER} Analysis Controls
          </CardTitle>
          <CardDescription>
            Manage expiration dates and trigger data retrieval for {NVDA_TICKER}
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
                value={nvdaState.selectedExpirationDate}
                onValueChange={handleExpirationChange}
                disabled={isLoading || nvdaState.availableExpirationDates.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration date" />
                </SelectTrigger>
                <SelectContent>
                  {nvdaState.availableExpirationDates.map((date) => (
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
                <Label htmlFor="nvda-option-type" className="text-sm font-medium">
                  Option Type
                </Label>
                <Select
                  value={nvdaState.optionType}
                  onValueChange={handleOptionTypeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="nvda-option-type">
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
                <Label htmlFor="nvda-strike-count" className="text-sm font-medium">
                  Strike Count
                </Label>
                <Select
                  value={nvdaState.strikeCount.toString()}
                  onValueChange={(value) => handleStrikeCountChange(parseInt(value) as StrikeCount)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="nvda-strike-count">
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
                <Label htmlFor="nvda-table-display" className="text-sm font-medium">
                  Table Layout
                </Label>
                <Select
                  value={nvdaState.tableDisplayType}
                  onValueChange={handleTableDisplayTypeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="nvda-table-display">
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
              disabled={isLoading || !nvdaState.selectedExpirationDate}
              size="lg"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Get {NVDA_TICKER} Stock Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* NVDA AI Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {NVDA_TICKER} AI Analysis (On-Demand)
          </CardTitle>
          <CardDescription>
            Generate AI analysis manually. Each button is independent and requires specific data to be available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleNvdaAiKeyTakeaways}
              disabled={!nvdaState.hasStockData || !nvdaState.hasAiTaData || isLoading || nvdaState.isAiKeyTakeawaysLoading}
              variant="outline"
              className="flex-1"
            >
              {nvdaState.isAiKeyTakeawaysLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Generate AI Key Takeaways
            </Button>
            <Button 
              onClick={handleNvdaAiOptionsAnalysis}
              disabled={!nvdaState.hasOptionsChainData || isLoading || nvdaState.isAiOptionsAnalysisLoading}
              variant="outline"
              className="flex-1"
            >
              {nvdaState.isAiOptionsAnalysisLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CandlestickChart className="mr-2 h-4 w-4" />
              )}
              Generate AI Options Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* NVDA Macro Orchestrator */}
      <SimpleAnalyzeAllButton
        ticker={NVDA_TICKER}
        onFetchExpirations={handleFetchExpirations}
        onGetStockData={handleGetStockData}
        onGenerateAiKeyTakeaways={handleNvdaAiKeyTakeaways}
        onGenerateAiOptionsAnalysis={handleNvdaAiOptionsAnalysis}
        canFetchExpirations={() => !isLoading}
        canGetStockData={() => !isLoading && !!nvdaState.selectedExpirationDate}
        canGenerateAiKeyTakeaways={() => !isLoading && nvdaState.hasStockData && nvdaState.hasAiTaData && !nvdaState.isAiKeyTakeawaysLoading}
        canGenerateAiOptionsAnalysis={() => !isLoading && nvdaState.hasOptionsChainData && !nvdaState.isAiOptionsAnalysisLoading}
        getCurrentExpiration={() => nvdaState.selectedExpirationDate}
        getAvailableExpirations={() => nvdaState.availableExpirationDates}
        onComplete={() => {
          toast({
            title: `${NVDA_TICKER} Macro Complete`,
            description: 'All analysis steps have been executed successfully!',
          });
        }}
        onError={(error) => {
          toast({
            title: `${NVDA_TICKER} Macro Failed`,
            description: error.message,
            variant: 'destructive',
          });
        }}
      />

      {/* NVDA UI Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NvdaMarketStatusDisplay />
        <NvdaKeyMetricsDisplay />
        <NvdaStockSnapshotDisplay />
        <NvdaStandardTaDisplay />
        <NvdaAiAnalyzedTaDisplay />
      </div>

      {/* NVDA AI Analysis Components (Full Width) */}
      <NvdaAiKeyTakeawaysDisplay />
      <NvdaAiOptionsAnalysisDisplay />

      {/* NVDA Options Chain Table (Full Width) */}
      <NvdaOptionsChainTable />

      {/* NVDA Consolidated AI Chat Interface */}
      <NvdaConsolidatedChat />

      {/* NVDA Data Section (Self-contained JSON display) */}
      <NvdaDataSection />
    </div>
  );
}

// Default export for dynamic imports
export default NvdaTabContent;