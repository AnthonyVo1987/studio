
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
import { Chatbot } from "@/components/chatbot";
import { ChatbotFsmProvider } from "@/contexts/chatbot-fsm-context";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";
import { isDataReadyForProcessing } from '@/lib/data-validation-utils';

import { useStockAnalysis, GlobalFsmState, type LogSourceId, type AnalysisToggleType } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap, Brain, BarChartBig, WandSparkles } from "lucide-react";


export function MainTabContent() {
  const { toast } = useToast();
  const {
    marketStatusJson: contextMarketStatusJson, stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson, optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson, aiKeyTakeawaysJson: contextAiKeyTakeawaysJson,
    aiOptionsAnalysisJson: contextAiOptionsAnalysisJson, logDebug,
    fsmState: globalFsmStateFromContext, fsmVariables: globalFsmVariables, fsmFlags: globalFsmFlags,
    dispatchFsmEvent: dispatchGlobalFsmEvent, chatHistory: contextChatHistory,
    setChatbotFsmDisplay, isChatGroundingEnabled,
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

  const handleAnalyzeStockSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!globalUserInputTicker.trim()) { toast({ title: "Invalid Ticker", description: "Please enter a stock ticker.", variant: "destructive" }); return; }
    logDebug('MainTabContent' as LogSourceId, 'UserAction', `Analyze Stock CLICKED for ${globalUserInputTicker}. Dispatching START_FULL_ANALYSIS to global FSM.`);
    dispatchGlobalFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: globalUserInputTicker } });
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
    dispatchGlobalFsmEvent({
      type: 'ANALYSIS_TOGGLE_CHANGED',
      payload: { toggleType, isEnabled },
    });
  };

  const analyzeButtonLoading = [GlobalFsmState.APP_INITIALIZING, GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH, GlobalFsmState.DATA_FETCH_IN_PROGRESS, GlobalFsmState.CALCULATING_AI_TA].includes(globalFsmStateFromContext);
  const analyzeButtonDisabled = !globalFsmFlags.canAnalyzeStock || analyzeButtonLoading || !globalUserInputTicker.trim();

  const keyTakeawaysButtonLoading = globalFsmStateFromContext === GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
  const optionsAnalysisButtonLoading = globalFsmStateFromContext === GlobalFsmState.ANALYZING_OPTIONS;
  const isGlobalChatFsmPending = globalFsmStateFromContext === GlobalFsmState.CHAT_MESSAGE_PENDING;

  const getCombinedDataForExport = useCallback(() => {
    const baseData: any = { ticker: globalFsmVariables.activeTicker || globalUserInputTicker, marketStatus: JSON.parse(contextMarketStatusJson || '{}'), stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'), standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'), aiAnalyzedTechnicalAnalysis: JSON.parse(contextAiAnalyzedTaJson || '{}'), };
    if (isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, 'MainTabContent', 'CombinedExport_AiKeyTakeaways', 'Validation')) { baseData.aiKeyTakeaways = JSON.parse(contextAiKeyTakeawaysJson || '{}'); }
    if (isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, 'MainTabContent', 'CombinedExport_AiOptionsAnalysis', 'Validation')) { baseData.aiOptionsAnalysis = JSON.parse(contextAiOptionsAnalysisJson || '{}'); }
    if (isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'MainTabContent', 'CombinedExport_OptionsChain', 'Validation')) { baseData.optionsChain = JSON.parse(contextOptionsChainJson || '{}'); }
    return baseData;
  }, [ globalFsmVariables.activeTicker, globalUserInputTicker, contextMarketStatusJson, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextOptionsChainJson, logDebug ]);

  const isBaseDataReadyForCombinedExport = isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent', 'ExportCheck_MarketStatus', 'Validation') && isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent', 'ExportCheck_StockSnapshot', 'Validation') && isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent', 'ExportCheck_StandardTAs', 'Validation') && isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent', 'ExportCheck_AiAnalyzedTA', 'Validation');
  const combinedExportButtonsDisabled = !isBaseDataReadyForCombinedExport || analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading || isGlobalChatFsmPending;

  const handleExportAllToJson = useCallback(async () => {
    logDebug('MainTabContent' as LogSourceId, 'UserAction_ExportAll', 'Export All to JSON clicked.');
    if (!isBaseDataReadyForCombinedExport) { toast({ variant: 'destructive', title: 'Data Not Ready', description: 'Core data sections are not available for export.' }); return; }
    try {
      const combinedData = getCombinedDataForExport();
      const filename = `${combinedData.ticker || 'StockSage'}_full_analysis_${new Date().toISOString().split('T')[0]}.json`;
      downloadJson(combinedData, filename);
      toast({ title: 'Export Successful', description: `Data exported to ${filename}` });
    } catch (e: any) { toast({ variant: 'destructive', title: 'Export Error', description: `Could not export data: ${e.message}` }); }
  }, [isBaseDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  const handleCopyAllToJson = useCallback(async () => {
    logDebug('MainTabContent' as LogSourceId, 'UserAction_CopyAll', 'Copy All to JSON clicked.');
    if (!isBaseDataReadyForCombinedExport) { toast({ variant: 'destructive', title: 'Copy Failed', description: 'Core data sections are not available for copy.' }); return; }
    try {
      const combinedData = getCombinedDataForExport();
      const success = await copyToClipboard(JSON.stringify(combinedData, null, 2));
      if (success) { toast({ title: 'Copied to Clipboard', description: 'Data copied as JSON.' }); } else { throw new Error('Clipboard API failed.'); }
    } catch (e: any) { toast({ variant: 'destructive', title: 'Copy Error', description: `Could not copy data: ${e.message}` }); }
  }, [isBaseDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  const isAnyAnalysisInProgress = analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading || isGlobalChatFsmPending;


  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis Input</CardTitle>
        <CardDescription>Enter ticker for Data Fetch & AI TA. Manual AI actions available after. Chat integrated with global FSM.</CardDescription>
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
              <Select defaultValue="polygon" disabled>
                <SelectTrigger id="dataSource" disabled={isAnyAnalysisInProgress}><SelectValue placeholder="Select data source" /></SelectTrigger>
                <SelectContent><SelectItem value="polygon">Polygon.io</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={analyzeButtonDisabled || isGlobalChatFsmPending}>
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
            <div className="flex items-center justify-between space-x-2 p-2 border rounded-md">
              <Label htmlFor="toggle-chat-stock-trader" className="flex-grow text-sm">AI Chat: Stock Trader's Takeaways</Label>
              <Switch id="toggle-chat-stock-trader" checked={globalFsmFlags.isAiChatStockTraderTakeawaysSelected} onCheckedChange={(checked) => handleToggleChange('ai_chat_stock_trader', checked)} disabled={isAnyAnalysisInProgress} />
            </div>
            <div className="flex items-center justify-between space-x-2 p-2 border rounded-md">
              <Label htmlFor="toggle-chat-options-trader" className="flex-grow text-sm">AI Chat: Options Trader's Takeaways</Label>
              <Switch id="toggle-chat-options-trader" checked={globalFsmFlags.isAiChatOptionsTraderTakeawaysSelected} onCheckedChange={(checked) => handleToggleChange('ai_chat_options_trader', checked)} disabled={isAnyAnalysisInProgress} />
            </div>
            <div className="flex items-center justify-between space-x-2 p-2 border rounded-md">
              <Label htmlFor="toggle-chat-holistic" className="flex-grow text-sm">AI Chat: Additional Holistic Takeaways</Label>
              <Switch id="toggle-chat-holistic" checked={globalFsmFlags.isAiChatHolisticTakeawaysSelected} onCheckedChange={(checked) => handleToggleChange('ai_chat_holistic', checked)} disabled={isAnyAnalysisInProgress} />
            </div>
          </CardContent>
        </Card>
        <Separator />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center"><WandSparkles className="mr-2 h-5 w-5 text-primary" />Google Search Grounding</CardTitle>
            <CardDescription>Enhance analysis with real-time data from Google Search (slower, requires more tokens).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between space-x-2 p-2 border rounded-md">
              <Label htmlFor="toggle-web-search-ta" className="flex-grow text-sm">Run TA Web Search in Chat Post-Analysis</Label>
              <Switch id="toggle-web-search-ta" checked={globalFsmFlags.isWebSearchTaEnabled} onCheckedChange={(checked) => handleToggleChange('web_search_ta', checked)} disabled={isAnyAnalysisInProgress} />
            </div>
            <div className="flex items-center justify-between space-x-2 p-2 border rounded-md">
              <Label htmlFor="toggle-web-search-options" className="flex-grow text-sm">Run Options Web Search in Chat Post-Analysis</Label>
              <Switch id="toggle-web-search-options" checked={globalFsmFlags.isWebSearchOptionsEnabled} onCheckedChange={(checked) => handleToggleChange('web_search_options', checked)} disabled={isAnyAnalysisInProgress} />
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
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Combined Data Export</h3>
          <CardDescription>Exports Snapshot, Standard TAs, AI Analyzed TA, and Market Status. AI Key Takeaways, Options Chain, and AI Options Analysis are included if available.</CardDescription>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={handleExportAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={combinedExportButtonsDisabled}><Download className="mr-2 h-4 w-4" /> Export All to JSON</Button>
            <Button onClick={handleCopyAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={combinedExportButtonsDisabled}><Copy className="mr-2 h-4 w-4" /> Copy All to JSON</Button>
          </div>
        </div>
        <Separator />
        <div className="space-y-6">
          <KeyMetricsDisplay />
          <StockSnapshotDetailsDisplay />
          <StandardTaDisplay />
          <AiAnalyzedTaDisplay />
          <AiKeyTakeawaysDisplay />
          <OptionsChainTable />
          <AiOptionsAnalysisDisplay />
          <ChatbotFsmProvider 
            dispatchGlobalFsmEvent={dispatchGlobalFsmEvent} 
            currentTicker={globalFsmVariables.activeTicker || globalUserInputTicker} 
            stockSnapshotJson={contextStockSnapshotJson || '{}'} 
            aiKeyTakeawaysJson={contextAiKeyTakeawaysJson || '{}'} 
            aiAnalyzedTaJson={contextAiAnalyzedTaJson || '{}'} 
            aiOptionsAnalysisJson={contextAiOptionsAnalysisJson || '{}'} 
            currentGlobalChatHistory={contextChatHistory} 
            logDebug={logDebug} 
            setChatbotFsmDisplayState={setChatbotFsmDisplay}
            isChatGroundingEnabled={isChatGroundingEnabled}
          >
            <Chatbot isAnyAnalysisInProgress={isAnyAnalysisInProgress} currentTickerForDisplay={globalFsmVariables.activeTicker || globalUserInputTicker} />
          </ChatbotFsmProvider>
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}
