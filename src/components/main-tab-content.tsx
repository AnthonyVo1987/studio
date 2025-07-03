
'use client';

import React, { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { KeyMetricsDisplay } from "@/components/key-metrics-display";
import { StockSnapshotDetailsDisplay } from "@/components/stock-snapshot-details-display";
import { MarketStatusDisplay } from "@/components/market-status-display";
import { StandardTaDisplay } from "@/components/standard-ta-display";
import { AiAnalyzedTaDisplay } from "@/components/ai-analyzed-ta-display";
import { OptionsChainTable } from "@/components/options-chain-table";
import { AiOptionsAnalysisDisplay } from "@/components/ai-options-analysis-display";
import { AiKeyTakeawaysDisplay } from "@/components/ai-key-takeaways-display";
import { Chatbot, type ExamplePromptButton } from "@/components/chatbot";
import { ChatbotFsmProvider } from "@/contexts/chatbot-fsm-context";
import { isDataReadyForProcessing } from '@/lib/data-validation-utils';
import { DebugSnapshotControls } from "@/components/debug-snapshot-controls";

import { useStockAnalysis, GlobalFsmState, type LogSourceId, type AnalysisToggleType, type GlobalFsmFlags } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, Brain, BarChartBig, FileText, SearchCode, Search, CandlestickChart } from "lucide-react";

import { fetchStockDataAction } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction } from '@/actions/perform-ai-options-analysis-action';

const appDataButtons: ExamplePromptButton[] = [
  { title: "Stock Trader's Takeaways", promptName: 'stock-trader-takeaways', icon: FileText },
  { title: "Options Trader's Takeaways", promptName: 'options-trader-takeaways', icon: FileText },
  { title: "Additional Holistic Takeaways", promptName: 'holistic-takeaways', icon: FileText },
];

const webSearchButtons: ExamplePromptButton[] = [
    { title: "S/R Levels Search", promptName: 'support-resistance-web-search', icon: CandlestickChart },
    { title: "Technical Analysis Search", promptName: 'technical-analysis-web-search', icon: SearchCode },
    { title: "Options Flow Search", promptName: 'options-flow-web-search', icon: Search },
];


export function MainTabContent() {
  const { toast } = useToast();
  const {
    marketStatusJson: contextMarketStatusJson, stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson, optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson, aiKeyTakeawaysJson: contextAiKeyTakeawaysJson,
    aiOptionsAnalysisJson: contextAiOptionsAnalysisJson, logDebug,
    fsmState: globalFsmStateFromContext, fsmVariables: globalFsmVariables, fsmFlags: globalFsmFlags,
    dispatchFsmEvent: dispatchGlobalFsmEvent, 
    appDataChatHistory: contextAppDataChatHistory, clearAppDataChatHistory,
    webSearchChatHistory: contextWebSearchChatHistory, clearWebSearchChatHistory, addWebSearchChatMessage,
    setUserInputWebSearchChatRequestJson, setUserInputWebSearchChatResponseJson,
    setRawTaWebSearchRequestJson, setRawTaWebSearchResponseJson,
    setRawOptionsWebSearchRequestJson, setRawOptionsWebSearchResponseJson,
    setRawSupportResistanceWebSearchRequestJson, setRawSupportResistanceWebSearchResponseJson,
  } = useStockAnalysis();

  const { userInputTicker: globalUserInputTicker } = globalFsmVariables;
  const globalDispatchGuardRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const logPrefixEff = 'MainTabContent:GlobalDispatchGuardEffect';
    logDebug(logPrefixEff as LogSourceId, 'RenderState', `GlobalFSM: ${globalFsmStateFromContext}, ActiveTicker: ${globalFsmVariables.activeTicker}, GuardRef: ${JSON.stringify(globalDispatchGuardRef.current)}`);
    const activeTickerForGuardReset = globalFsmVariables.activeTicker;
    const guardKeyForManualKT = activeTickerForGuardReset ? `TRIGGER_MANUAL_KEY_TAKEAWAYS_FOR_${activeTickerForGuardReset}` : null;
    if (guardKeyForManualKT && globalDispatchGuardRef.current[guardKeyForManualKT] && (globalFsmStateFromContext === GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED || globalFsmStateFromContext === GlobalFsmState.KEY_TAKEAWAYS_FAILED || globalFsmStateFromContext === GlobalFsmState.IDLE)) {
      logDebug(logPrefixEff as LogSourceId, 'GuardReset', `Resetting guard for KT: ${guardKeyForManualKT}. FSM state: ${globalFsmStateFromContext}`);
      globalDispatchGuardRef.current[guardKeyForManualKT] = false;
    }
    const guardKeyForManualOpt = activeTickerForGuardReset ? `TRIGGER_MANUAL_OPTIONS_ANALYSIS_FOR_${activeTickerForGuardReset}` : null;
    if (guardKeyForManualOpt && globalDispatchGuardRef.current[guardKeyForManualOpt] && (globalFsmStateFromContext === GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED || globalFsmStateFromContext === GlobalFsmState.OPTIONS_ANALYSIS_FAILED || globalFsmStateFromContext === GlobalFsmState.IDLE)) {
      logDebug(logPrefixEff as LogSourceId, 'GuardReset', `Resetting guard for Options: ${guardKeyForManualOpt}. FSM state: ${globalFsmStateFromContext}`);
      globalDispatchGuardRef.current[guardKeyForManualOpt] = false;
    }
  }, [globalFsmStateFromContext, globalFsmVariables.activeTicker, logDebug]);

  const handleTickerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTicker = e.target.value.toUpperCase();
    dispatchGlobalFsmEvent({ type: 'USER_INPUT_TICKER_CHANGED', payload: { ticker: newTicker } });
  };

  const handleAnalyzeStockSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const ticker = globalUserInputTicker.trim();
    if (!ticker) {
      toast({ title: "Invalid Ticker", description: "Please enter a stock ticker.", variant: "destructive" });
      return;
    }
    
    logDebug('MainTabContent' as LogSourceId, 'UserAction_AnalyzeStock', `Deterministic pipeline STARTED for ${ticker}.`);
    
    // 1. Dispatch initial event to reset state and set active ticker
    dispatchGlobalFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker } });

    try {
      // 2. Fetch stock data
      dispatchGlobalFsmEvent({ type: 'DATA_FETCH_IN_PROGRESS' });
      const stockDataResult = await fetchStockDataAction({ ticker });

      if (stockDataResult.status !== 'success' || !stockDataResult.data) {
        if (stockDataResult.error?.includes('CRITICAL STALE DATA')) {
          dispatchGlobalFsmEvent({ type: 'STALE_DATA_FROM_ACTION', payload: { error: stockDataResult.error, message: stockDataResult.message || 'Stale data detected', expectedTicker: ticker, actionStateData: stockDataResult.data } });
        } else {
          dispatchGlobalFsmEvent({ type: 'FETCH_DATA_FAILURE', payload: stockDataResult });
        }
        toast({ title: "Data Fetch Failed", description: stockDataResult.message || 'Could not fetch stock data.', variant: 'destructive' });
        return; // Stop the pipeline
      }
      dispatchGlobalFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: stockDataResult.data });
      
      // 3. Analyze TA indicators
      dispatchGlobalFsmEvent({ type: 'CALCULATING_AI_TA' });
      const taResult = await analyzeTaAction({ stockSnapshotJson: stockDataResult.data.stockSnapshotJson, ticker });

      if (taResult.status !== 'success' || !taResult.data) {
        dispatchGlobalFsmEvent({ type: 'AI_TA_FAILURE', payload: taResult });
        toast({ title: "AI TA Failed", description: taResult.message || 'Could not calculate AI TA.', variant: 'destructive' });
        return; // Stop the pipeline
      }
      dispatchGlobalFsmEvent({ type: 'AI_TA_SUCCESS', payload: taResult.data });
      
      // --- Phase 3: Deterministic Customizable Analysis Pipeline ---
      logDebug('MainTabContent' as LogSourceId, 'PipelinePhase3', 'Starting deterministic custom analysis pipeline.');
      
      const { isAiKeyTakeawaysSelected, isAiOptionsAnalysisSelected } = globalFsmFlags;

      if (isAiKeyTakeawaysSelected) {
          logDebug('MainTabContent' as LogSourceId, 'PipelinePhase3_Step', 'AI Key Takeaways is selected. Executing...');
          dispatchGlobalFsmEvent({ type: 'GENERATING_KEY_TAKEAWAYS' });
          const keyTakeawaysResult = await performAiAnalysisAction({
              ticker, 
              stockSnapshotJson: stockDataResult.data.stockSnapshotJson,
              standardTasJson: stockDataResult.data.standardTasJson,
              aiAnalyzedTaJson: taResult.data.aiAnalyzedTaJson,
              marketStatusJson: stockDataResult.data.marketStatusJson,
          });
          if (keyTakeawaysResult.status === 'success' && keyTakeawaysResult.data) {
              dispatchGlobalFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: keyTakeawaysResult.data });
          } else {
              dispatchGlobalFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: keyTakeawaysResult });
              toast({ title: "AI Key Takeaways Failed", description: keyTakeawaysResult.message || 'Could not generate key takeaways.', variant: 'destructive' });
          }
      }

      if (isAiOptionsAnalysisSelected) {
          logDebug('MainTabContent' as LogSourceId, 'PipelinePhase3_Step', 'AI Options Analysis is selected. Executing...');
          dispatchGlobalFsmEvent({ type: 'ANALYZING_OPTIONS' });
          const optionsAnalysisResult = await performAiOptionsAnalysisAction({
              ticker,
              stockSnapshotJson: stockDataResult.data.stockSnapshotJson,
              optionsChainJson: stockDataResult.data.optionsChainJson,
          });
          if (optionsAnalysisResult.status === 'success' && optionsAnalysisResult.data) {
              dispatchGlobalFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: optionsAnalysisResult.data });
          } else {
              dispatchGlobalFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: optionsAnalysisResult });
              toast({ title: "AI Options Analysis Failed", description: optionsAnalysisResult.message || 'Could not generate options analysis.', variant: 'destructive' });
          }
      }

      logDebug('MainTabContent' as LogSourceId, 'PipelinePhase3_Complete', 'Custom analysis steps finished. Finalizing pipeline.');
      dispatchGlobalFsmEvent({ type: 'FINALIZE_AUTOMATED_PIPELINE' });

    } catch (error: any) {
      const errorMessage = error.message || 'A critical error occurred.';
      dispatchGlobalFsmEvent({ type: 'FETCH_DATA_FAILURE', payload: { error: errorMessage, message: 'Pipeline failed unexpectedly.' } });
      toast({ title: "Pipeline Error", description: errorMessage, variant: 'destructive' });
    }
  };


  const handleGenerateKeyTakeaways = () => {
    const currentActiveTicker = globalFsmVariables.activeTicker;
    if (!currentActiveTicker) { toast({ title: "No Active Ticker", description: "Please analyze a stock first.", variant: "destructive" }); logDebug('MainTabContent' as LogSourceId, 'UserAction_GenKT', 'Prevented: No active ticker.'); return; }
    const guardKey = `TRIGGER_MANUAL_KEY_TAKEAWAYS_FOR_${currentActiveTicker}`;
    if (globalDispatchGuardRef.current[guardKey]) { logDebug('MainTabContent' as LogSourceId, 'UserAction_GenKT', `Blocked by dispatch guard for ${currentActiveTicker}.`); toast({ title: "Processing...", description: "Key Takeaways generation already in progress or recently completed."}); return; }
    logDebug('MainTabContent' as LogSourceId, 'UserAction_GenKT', `Button clicked for ${currentActiveTicker}. Dispatching TRIGGER_MANUAL_KEY_TAKEAWAYS to global FSM.`);
    globalDispatchGuardRef.current[guardKey] = true;
    dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS', payload: { ticker: currentActiveTicker } });
  };

  const handleGenerateOptionsAnalysis = () => {
    const currentActiveTicker = globalFsmVariables.activeTicker;
    if (!currentActiveTicker) { toast({ title: "No Active Ticker", description: "Please analyze a stock first.", variant: "destructive" }); logDebug('MainTabContent' as LogSourceId, 'UserAction_GenOpt', 'Prevented: No active ticker.'); return; }
    const guardKey = `TRIGGER_MANUAL_OPTIONS_ANALYSIS_FOR_${currentActiveTicker}`;
    if (globalDispatchGuardRef.current[guardKey]) { logDebug('MainTabContent' as LogSourceId, 'UserAction_GenOpt', `Blocked by dispatch guard for ${currentActiveTicker}.`); toast({ title: "Processing...", description: "Options Analysis generation already in progress or recently completed."}); return; }
    logDebug('MainTabContent' as LogSourceId, 'UserAction_GenOpt', `Button clicked for ${currentActiveTicker}. Dispatching TRIGGER_MANUAL_OPTIONS_ANALYSIS to global FSM.`);
    globalDispatchGuardRef.current[guardKey] = true;
    dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS', payload: { ticker: currentActiveTicker } });
  };

  const handleToggleChange = (toggleType: AnalysisToggleType, isEnabled: boolean) => {
    dispatchGlobalFsmEvent({ type: 'ANALYSIS_TOGGLE_CHANGED', payload: { toggleType, isEnabled } });
  };

  const analyzeButtonLoading = [GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH, GlobalFsmState.DATA_FETCH_IN_PROGRESS, GlobalFsmState.CALCULATING_AI_TA, GlobalFsmState.GENERATING_KEY_TAKEAWAYS, GlobalFsmState.ANALYZING_OPTIONS].includes(globalFsmStateFromContext);
  const analyzeButtonDisabled = !globalFsmFlags.canAnalyzeStock || analyzeButtonLoading || !globalUserInputTicker.trim();

  const keyTakeawaysButtonLoading = globalFsmStateFromContext === GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
  const optionsAnalysisButtonLoading = globalFsmStateFromContext === GlobalFsmState.ANALYZING_OPTIONS;
  
  const isAppDataChatFsmPending = globalFsmStateFromContext === GlobalFsmState.USER_INPUT_APP_DATA_CHAT_PENDING;
  
  const isAnyAnalysisInProgress = analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading || isAppDataChatFsmPending;


  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis Input</CardTitle>
        <CardDescription>Enter a stock ticker to begin the analysis pipeline. Use the toggles to customize the AI-driven steps.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleAnalyzeStockSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="ticker">Stock Ticker</Label>
              <Input id="ticker" value={globalUserInputTicker} onChange={handleTickerInputChange} placeholder="e.g., AAPL, MSFT" disabled={isAnyAnalysisInProgress}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon" disabled><SelectTrigger id="dataSource" disabled={isAnyAnalysisInProgress}><SelectValue placeholder="Select data source" /></SelectTrigger><SelectContent><SelectItem value="polygon">Polygon.io</SelectItem></SelectContent></Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={analyzeButtonDisabled || isAppDataChatFsmPending}>
              {analyzeButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <Zap className="mr-2 h-4 w-4" /> Analyze Stock
            </Button>
          </div>
        </form>
        <Separator />
        <Card>
          <CardHeader>
            <CardTitle>Customizable Analysis Pipeline</CardTitle>
            <CardDescription>Select which AI analyses to run when you click "Analyze Stock".</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between space-x-2 p-2 border rounded-md">
              <Label htmlFor="toggle-key-takeaways" className="flex-grow text-sm">AI Key Takeaways</Label>
              <Switch id="toggle-key-takeaways" checked={globalFsmFlags.isAiKeyTakeawaysSelected} onCheckedChange={(checked) => handleToggleChange('ai_key_takeaways', checked)} disabled={isAnyAnalysisInProgress} />
            </div>
            <div className="flex items-center justify-between space-x-2 p-2 border rounded-md">
              <Label htmlFor="toggle-options-analysis" className="flex-grow text-sm">AI Analyzed Options Chain</Label>
              <Switch id="toggle-options-analysis" checked={globalFsmFlags.isAiOptionsAnalysisSelected} onCheckedChange={(checked) => handleToggleChange('ai_options_analysis', checked)} disabled={isAnyAnalysisInProgress} />
            </div>
          </CardContent>
        </Card>
        <Separator />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">On-Demand AI Analysis</CardTitle>
            <CardDescription>Generate specific AI insights for {globalFsmVariables.activeTicker || "the analyzed stock"}. Available after "Analyze Stock" is complete and no macro is active.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleGenerateKeyTakeaways} className="w-full sm:w-auto" disabled={!globalFsmFlags.isManualKeyTakeawaysActionPossible || keyTakeawaysButtonLoading || isAnyAnalysisInProgress}>
                {keyTakeawaysButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <Brain className="mr-2 h-4 w-4" /> Generate AI Key Takeaways
              </Button>
              <Button onClick={handleGenerateOptionsAnalysis} className="w-full sm:w-auto" disabled={!globalFsmFlags.isManualOptionsAnalysisActionPossible || optionsAnalysisButtonLoading || isAnyAnalysisInProgress}>
                {optionsAnalysisButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <BarChartBig className="mr-2 h-4 w-4" /> Generate AI Options Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
        <Separator />
        <div className="space-y-6">
          <KeyMetricsDisplay />
          <StockSnapshotDetailsDisplay />
          <StandardTaDisplay />
          <AiAnalyzedTaDisplay />
          <AiKeyTakeawaysDisplay />
          <OptionsChainTable />
          <AiOptionsAnalysisDisplay />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChatbotFsmProvider 
              chatType='app-data'
              dispatchGlobalFsmEvent={dispatchGlobalFsmEvent} 
              currentTicker={globalFsmVariables.activeTicker || globalUserInputTicker} 
              stockSnapshotJson={contextStockSnapshotJson || '{}'} 
              aiKeyTakeawaysJson={contextAiKeyTakeawaysJson || '{}'} 
              aiAnalyzedTaJson={contextAiAnalyzedTaJson || '{}'} 
              aiOptionsAnalysisJson={contextAiOptionsAnalysisJson || '{}'} 
              currentGlobalChatHistory={contextAppDataChatHistory} 
              logDebug={logDebug}
            >
              <Chatbot
                title="App Data AI Chat"
                description={`Analyzes loaded app data for ${globalFsmVariables.activeTicker || "the stock"}. Cannot access web.`}
                chatHistory={contextAppDataChatHistory}
                clearChatHistory={clearAppDataChatHistory}
                fsmState={globalFsmStateFromContext}
                isProcessing={isAnyAnalysisInProgress}
                exampleButtons={appDataButtons}
                currentTickerForDisplay={globalFsmVariables.activeTicker || globalUserInputTicker}
                logDebug={logDebug}
              />
            </ChatbotFsmProvider>
            <ChatbotFsmProvider 
              chatType='web-search'
              dispatchGlobalFsmEvent={dispatchGlobalFsmEvent} 
              currentTicker={globalFsmVariables.activeTicker || globalUserInputTicker} 
              currentGlobalChatHistory={contextWebSearchChatHistory}
              addWebSearchChatMessage={addWebSearchChatMessage}
              setUserInputWebSearchChatRequestJson={setUserInputWebSearchChatRequestJson}
              setUserInputWebSearchChatResponseJson={setUserInputWebSearchChatResponseJson}
              setRawTaWebSearchRequestJson={setRawTaWebSearchRequestJson}
              setRawTaWebSearchResponseJson={setRawTaWebSearchResponseJson}
              setRawOptionsWebSearchRequestJson={setRawOptionsWebSearchRequestJson}
              setRawOptionsWebSearchResponseJson={setRawOptionsWebSearchResponseJson}
              setRawSupportResistanceWebSearchRequestJson={setRawSupportResistanceWebSearchRequestJson}
              setRawSupportResistanceWebSearchResponseJson={setRawSupportResistanceWebSearchResponseJson}
              logDebug={logDebug}
            >
              <Chatbot
                title="Web Search AI Chat"
                description={`Ask AI anything with Google Search Support...`}
                chatHistory={contextWebSearchChatHistory}
                clearChatHistory={clearWebSearchChatHistory}
                fsmState={globalFsmStateFromContext}
                isProcessing={isAnyAnalysisInProgress}
                exampleButtons={webSearchButtons}
                currentTickerForDisplay={globalFsmVariables.activeTicker || globalUserInputTicker}
                logDebug={logDebug}
              />
            </ChatbotFsmProvider>
          </div>
          <Separator />
          <MarketStatusDisplay />
          <Separator />
          <DebugSnapshotControls />
        </div>
      </CardContent>
    </Card>
  );
}
