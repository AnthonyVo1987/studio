
"use client";

import type { FormEvent } from 'react';
import React, { useState, useEffect, useRef, useCallback } from "react"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

import { useStockAnalysis, type ChatMessage, GlobalFsmState, type FsmDisplayTuple, type LogSourceId, type FsmEvent } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap, Brain, BarChartBig } from "lucide-react";
import { useActionState } from 'react';
import { chatServerAction, type ChatActionState, type ChatActionInputs, type ChatActionResult } from '@/actions/chat-server-action';


const initialLocalChatActionState: ChatActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};


export function MainTabContent() {
  const [tickerInput, setTickerInput] = useState("NVDA");
  const { toast } = useToast();
  const {
    marketStatusJson: contextMarketStatusJson,
    stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson,
    optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson,
    aiKeyTakeawaysJson: contextAiKeyTakeawaysJson,
    aiOptionsAnalysisJson: contextAiOptionsAnalysisJson,
    // Removed: setChatbotRequestJson, setChatbotResponseJson as global FSM handles these now
    logDebug,
    fsmState: globalFsmStateFromContext,
    fsmVariables: globalFsmVariables,
    fsmFlags: globalFsmFlags,
    dispatchFsmEvent: dispatchGlobalFsmEvent,
    chatHistory: contextChatHistory, 
    addChatMessage: addChatMessageToGlobalContext, // Still needed by global FSM
    setChatbotFsmDisplay, // For ChatbotFsmProvider to report its state
    // No need to pass down setMainTabFsmDisplay from here.
  } = useStockAnalysis();

  const contextChatHistoryRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    contextChatHistoryRef.current = contextChatHistory;
  }, [contextChatHistory]);

  const globalDispatchGuardRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const logPrefixEff = 'MainTabContent:GlobalDispatchGuardEffect_v3221';
    // This effect remains the same as it handles guards for manual AI actions.
    // No changes needed for chat integration here.
    logDebug(logPrefixEff as LogSourceId, 'ENTRY', `Global: ${globalFsmStateFromContext}, ActiveTicker: ${globalFsmVariables.activeTicker}, Guard: ${JSON.stringify(globalDispatchGuardRef.current)}`);
  
    const activeTickerForGuardReset = globalFsmVariables.activeTicker; 
  
    const guardKeyForManualKT = activeTickerForGuardReset ? `TRIGGER_MANUAL_KEY_TAKEAWAYS_FOR_${activeTickerForGuardReset}` : null;
    if (guardKeyForManualKT && globalDispatchGuardRef.current[guardKeyForManualKT] &&
        (globalFsmStateFromContext === GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED || globalFsmStateFromContext === GlobalFsmState.KEY_TAKEAWAYS_FAILED || globalFsmStateFromContext === GlobalFsmState.IDLE)
    ) {
      logDebug(logPrefixEff as LogSourceId, 'ResettingGuard_ManualKTDoneOrIdle', `Resetting guard: ${guardKeyForManualKT}. FSM state: ${globalFsmStateFromContext}`);
      globalDispatchGuardRef.current[guardKeyForManualKT] = false;
    }
  
    const guardKeyForManualOpt = activeTickerForGuardReset ? `TRIGGER_MANUAL_OPTIONS_ANALYSIS_FOR_${activeTickerForGuardReset}` : null;
    if (guardKeyForManualOpt && globalDispatchGuardRef.current[guardKeyForManualOpt] &&
        (globalFsmStateFromContext === GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED || globalFsmStateFromContext === GlobalFsmState.OPTIONS_ANALYSIS_FAILED || globalFsmStateFromContext === GlobalFsmState.IDLE)
    ) {
      logDebug(logPrefixEff as LogSourceId, 'ResettingGuard_ManualOptDoneOrIdle', `Resetting guard: ${guardKeyForManualOpt}. FSM state: ${globalFsmStateFromContext}`);
      globalDispatchGuardRef.current[guardKeyForManualOpt] = false;
    }
  
  }, [
    globalFsmStateFromContext,
    globalFsmVariables.activeTicker,
    logDebug,
  ]);


  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(
    chatServerAction,
    initialLocalChatActionState
  );

  // Effect to dispatch results of chatServerAction to Global FSM
  useEffect(() => {
    const logPrefix = 'MainTabContent:ChatActionStateEffect_v3230';
    if (chatActionState.status === 'idle') return; // Ignore initial state

    // Only process if the global FSM *was* in CHAT_MESSAGE_PENDING, implying this action result is relevant
    // This check might need refinement if MainTabContent doesn't have access to *previous* global FSM state.
    // For now, we assume if this effect fires, it's because chatFormAction was called.

    logDebug(logPrefix as LogSourceId, 'ChatActionStateChanged', `Status: ${chatActionState.status}, Message: ${chatActionState.message}`);

    if (chatActionState.status === 'success' && chatActionState.data) {
      logDebug(logPrefix as LogSourceId, 'Dispatching_CHAT_MESSAGE_ACTION_SUCCESS', 'Dispatching to Global FSM.');
      dispatchGlobalFsmEvent({ type: 'CHAT_MESSAGE_ACTION_SUCCESS', payload: chatActionState.data });
    } else if (chatActionState.status === 'error') {
      logDebug(logPrefix as LogSourceId, 'Dispatching_CHAT_MESSAGE_ACTION_ERROR', `Error: ${chatActionState.error}. Dispatching to Global FSM.`);
      dispatchGlobalFsmEvent({
        type: 'CHAT_MESSAGE_ACTION_ERROR',
        payload: {
          error: chatActionState.error,
          message: chatActionState.message,
          chatbotRequestJson: chatActionState.data?.chatbotRequestJson,
          chatbotResponseJson: chatActionState.data?.chatbotResponseJson,
        }
      });
    }
  }, [chatActionState, dispatchGlobalFsmEvent, logDebug]);

  // Effect to trigger chatFormAction when Global FSM indicates a pending chat submission
  useEffect(() => {
    const logPrefix = 'MainTabContent:GlobalFsmChatTriggerEffect_v3230';
    if (
      globalFsmStateFromContext === GlobalFsmState.CHAT_MESSAGE_PENDING &&
      globalFsmVariables.pendingChatSubmissionPayload &&
      !isChatPending // Ensure local action state is not already pending
    ) {
      logDebug(logPrefix as LogSourceId, 'TriggeringChatServerAction', 'Global FSM is CHAT_MESSAGE_PENDING with payload. Calling chatFormAction.');
      // Use startTransition if chatFormAction updates state that affects rendering outside this immediate flow
      startTransition(() => {
        chatFormAction(globalFsmVariables.pendingChatSubmissionPayload!);
      });
      // Notify global FSM that the pending payload has been actioned
      dispatchGlobalFsmEvent({ type: 'PENDING_CHAT_SUBMISSION_TRIGGERED' });
    }
  }, [
    globalFsmStateFromContext,
    globalFsmVariables.pendingChatSubmissionPayload,
    isChatPending,
    chatFormAction,
    dispatchGlobalFsmEvent,
    logDebug
  ]);


  const handleTickerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTicker = e.target.value.toUpperCase();
    setTickerInput(newTicker);
  };

  const handleAnalyzeStockSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!tickerInput.trim()) {
      toast({ title: "Invalid Ticker", description: "Please enter a stock ticker.", variant: "destructive" });
      return;
    }
    logDebug('MainTabContent' as LogSourceId, 'UserAction_AnalyzeStock_CLICKED', `Button clicked for ${tickerInput}. Dispatching START_FULL_ANALYSIS to global FSM.`);
    dispatchGlobalFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: tickerInput } });
  };

  const handleGenerateKeyTakeaways = () => {
    const currentActiveTicker = globalFsmVariables.activeTicker;
    if (!currentActiveTicker) {
      toast({ title: "No Active Ticker", description: "Please analyze a stock first.", variant: "destructive" });
      return;
    }
    const guardKey = `TRIGGER_MANUAL_KEY_TAKEAWAYS_FOR_${currentActiveTicker}`;
    if (globalDispatchGuardRef.current[guardKey]) {
      logDebug('MainTabContent' as LogSourceId, 'UserAction_GenKT_BlockedByGuard', `KT generation for ${currentActiveTicker} blocked by dispatch guard.`);
      toast({ title: "Processing...", description: "Key Takeaways generation already in progress or recently completed.", variant: "default" });
      return;
    }
    logDebug('MainTabContent' as LogSourceId, 'UserAction_GenKT_CLICKED', `Button clicked for ${currentActiveTicker}. Dispatching TRIGGER_MANUAL_KEY_TAKEAWAYS.`);
    globalDispatchGuardRef.current[guardKey] = true;
    dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS', payload: { ticker: currentActiveTicker } });
  };

  const handleGenerateOptionsAnalysis = () => {
    const currentActiveTicker = globalFsmVariables.activeTicker;
     if (!currentActiveTicker) {
      toast({ title: "No Active Ticker", description: "Please analyze a stock first.", variant: "destructive" });
      return;
    }
    const guardKey = `TRIGGER_MANUAL_OPTIONS_ANALYSIS_FOR_${currentActiveTicker}`;
    if (globalDispatchGuardRef.current[guardKey]) {
        logDebug('MainTabContent' as LogSourceId, 'UserAction_GenOpt_BlockedByGuard', `Options Analysis generation for ${currentActiveTicker} blocked by dispatch guard.`);
        toast({ title: "Processing...", description: "Options Analysis generation already in progress or recently completed.", variant: "default" });
        return;
    }
    logDebug('MainTabContent' as LogSourceId, 'UserAction_GenOpt_CLICKED', `Button clicked for ${currentActiveTicker}. Dispatching TRIGGER_MANUAL_OPTIONS_ANALYSIS.`);
    globalDispatchGuardRef.current[guardKey] = true;
    dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS', payload: { ticker: currentActiveTicker } });
  };

  const analyzeButtonLoading = [
    GlobalFsmState.APP_INITIALIZING, 
    GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH,
    GlobalFsmState.DATA_FETCH_IN_PROGRESS,
    GlobalFsmState.CALCULATING_AI_TA
  ].includes(globalFsmStateFromContext);

  const analyzeButtonDisabled = !globalFsmFlags.canAnalyzeStock || analyzeButtonLoading || !tickerInput.trim();

  const [isKtButtonDisabled, setIsKtButtonDisabled] = useState(true);
  const [isOptButtonDisabled, setIsOptButtonDisabled] = useState(true);

  const keyTakeawaysButtonLoading = globalFsmStateFromContext === GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
  const optionsAnalysisButtonLoading = globalFsmStateFromContext === GlobalFsmState.ANALYZING_OPTIONS;
  
  const isGlobalPipelineActive = ![
    GlobalFsmState.IDLE,
    GlobalFsmState.AWAITING_TICKER_INPUT,
    GlobalFsmState.VALID_TICKER_ENTERED,
    GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE,
    GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED,
    GlobalFsmState.KEY_TAKEAWAYS_FAILED,
    GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED,
    GlobalFsmState.OPTIONS_ANALYSIS_FAILED,
    GlobalFsmState.CHAT_MESSAGE_SUCCESS, // Chat done
    GlobalFsmState.CHAT_MESSAGE_ERROR,   // Chat failed
    GlobalFsmState.ERROR_STALE_DATA,
    GlobalFsmState.DATA_FETCH_FAILED,
    GlobalFsmState.AI_TA_CALCULATION_FAILED,
  ].includes(globalFsmStateFromContext);

  // Updated: isChatPending (from useActionState) now also considered for overall pending state
  const isChatActionHookPending = isChatPending; // from useActionState for chatServerAction
  const isGlobalChatFsmPending = globalFsmStateFromContext === GlobalFsmState.CHAT_MESSAGE_PENDING;
  const isOverallAnalysisPending = isGlobalPipelineActive || isChatActionHookPending || isGlobalChatFsmPending;


  useEffect(() => {
    const logPrefixDC = 'MainTabContent:ButtonStateEffect_v3221';
    logDebug(logPrefixDC as LogSourceId, 'ButtonStateEffect_Entry', `GlobalFSM: ${globalFsmStateFromContext}, ActiveTicker: ${globalFsmVariables.activeTicker}, CurrentInput: ${tickerInput}`);

    const manualActionsPossibleOverall = 
      (globalFsmStateFromContext === GlobalFsmState.IDLE ||
       globalFsmStateFromContext === GlobalFsmState.VALID_TICKER_ENTERED || 
       globalFsmStateFromContext === GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE ||
       globalFsmStateFromContext === GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED ||
       globalFsmStateFromContext === GlobalFsmState.KEY_TAKEAWAYS_FAILED ||
       globalFsmStateFromContext === GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED || 
       globalFsmStateFromContext === GlobalFsmState.OPTIONS_ANALYSIS_FAILED ||
       globalFsmStateFromContext === GlobalFsmState.CHAT_MESSAGE_SUCCESS || // Can trigger manual AI after chat
       globalFsmStateFromContext === GlobalFsmState.CHAT_MESSAGE_ERROR   // Can trigger manual AI after chat
      ) &&
      !!globalFsmVariables.activeTicker && 
      globalFsmVariables.activeTicker === tickerInput; 

    logDebug(logPrefixDC as LogSourceId, 'ButtonStateChecks', `manualActionsPossibleOverall: ${manualActionsPossibleOverall}, isGlobalPipelineActive: ${isGlobalPipelineActive}`);
    
    // Key Takeaways Button Logic
    const ktSnapshotReady = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, logPrefixDC as LogSourceId, 'KT_Snapshot');
    const ktStdTaReady = isDataReadyForProcessing(contextStandardTasJson, logDebug, logPrefixDC as LogSourceId, 'KT_StdTA');
    const ktAiTaReady = isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, logPrefixDC as LogSourceId, 'KT_AiAnalyzedTA');
    const ktMarketStatusReady = isDataReadyForProcessing(contextMarketStatusJson, logDebug, logPrefixDC as LogSourceId, 'KT_MarketStatus');
    const ktPrereqsMet = ktSnapshotReady && ktStdTaReady && ktAiTaReady && ktMarketStatusReady;
    
    const shouldKtButtonBeEnabled = manualActionsPossibleOverall && 
                                    !keyTakeawaysButtonLoading && 
                                    !analyzeButtonLoading && 
                                    !isGlobalPipelineActive && // Existing check
                                    !isGlobalChatFsmPending && // New: Don't allow if chat is pending
                                    ktPrereqsMet;
    
    logDebug(logPrefixDC as LogSourceId, 'KTButtonChecks', `ktPrereqsMet: ${ktPrereqsMet}, keyTakeawaysButtonLoading: ${keyTakeawaysButtonLoading}, analyzeButtonLoading: ${analyzeButtonLoading}, isGlobalChatFsmPending: ${isGlobalChatFsmPending}, shouldKtBeEnabled: ${shouldKtButtonBeEnabled}`);
    setIsKtButtonDisabled(!shouldKtButtonBeEnabled);

    // Options Analysis Button Logic
    const optSnapshotReady = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, logPrefixDC as LogSourceId, 'Opt_Snapshot');
    const optChainReady = isDataReadyForProcessing(contextOptionsChainJson, logDebug, logPrefixDC as LogSourceId, 'Opt_Chain');
    const optPrereqsMet = optSnapshotReady && optChainReady;

    const shouldOptButtonBeEnabled = manualActionsPossibleOverall && 
                                     !optionsAnalysisButtonLoading && 
                                     !analyzeButtonLoading && 
                                     !isGlobalPipelineActive && // Existing check
                                     !isGlobalChatFsmPending && // New: Don't allow if chat is pending
                                     optPrereqsMet;
    logDebug(logPrefixDC as LogSourceId, 'OptButtonChecks', `optPrereqsMet: ${optPrereqsMet}, optionsAnalysisButtonLoading: ${optionsAnalysisButtonLoading}, isGlobalChatFsmPending: ${isGlobalChatFsmPending}, shouldOptBeEnabled: ${shouldOptButtonBeEnabled}`);
    setIsOptButtonDisabled(!shouldOptButtonBeEnabled);

  }, [
      globalFsmStateFromContext, globalFsmVariables.activeTicker, tickerInput,
      contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, contextOptionsChainJson,
      analyzeButtonLoading, keyTakeawaysButtonLoading, optionsAnalysisButtonLoading, isGlobalPipelineActive, isGlobalChatFsmPending, logDebug
    ]);


  const getCombinedDataForExport = useCallback(() => {
    const baseData: any = {
      ticker: globalFsmVariables.activeTicker || tickerInput,
      marketStatus: JSON.parse(contextMarketStatusJson || '{}'),
      stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
      standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'),
      aiAnalyzedTechnicalAnalysis: JSON.parse(contextAiAnalyzedTaJson || '{}'),
    };

    if (isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, 'CombinedExportCheck' as LogSourceId, 'AiKeyTakeaways')) {
      baseData.aiKeyTakeaways = JSON.parse(contextAiKeyTakeawaysJson || '{}');
    }
    if (isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, 'CombinedExportCheck' as LogSourceId, 'AiOptionsAnalysis')) {
      baseData.aiOptionsAnalysis = JSON.parse(contextAiOptionsAnalysisJson || '{}');
    }
    if (isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'CombinedExportCheck' as LogSourceId, 'OptionsChain')) {
      baseData.optionsChain = JSON.parse(contextOptionsChainJson || '{}');
    }
    return baseData;
  }, [
      globalFsmVariables.activeTicker, tickerInput,
      contextMarketStatusJson, contextStockSnapshotJson, contextStandardTasJson,
      contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson,
      contextOptionsChainJson, logDebug
    ]);

  const isBaseDataReadyForCombinedExport =
    isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'ExportCheck' as LogSourceId, 'MarketStatus') &&
    isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'ExportCheck' as LogSourceId, 'StockSnapshot') &&
    isDataReadyForProcessing(contextStandardTasJson, logDebug, 'ExportCheck' as LogSourceId, 'StandardTAs') &&
    isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'ExportCheck' as LogSourceId, 'AiAnalyzedTA');

  const combinedExportButtonsDisabled =
    !isBaseDataReadyForCombinedExport ||
    analyzeButtonLoading ||
    keyTakeawaysButtonLoading ||
    optionsAnalysisButtonLoading ||
    isGlobalPipelineActive || // Existing
    isGlobalChatFsmPending; // New: Disable export if chat is pending


  const handleExportAllToJson = useCallback(async () => {
    logDebug('MainTabContent' as LogSourceId, 'Export_All', 'Export All to JSON clicked.');
    if (!isBaseDataReadyForCombinedExport) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'Core data sections are not available for export.' });
      return;
    }
    try {
      const combinedData = getCombinedDataForExport();
      const filename = `${combinedData.ticker || 'StockSage'}_full_analysis_${new Date().toISOString().split('T')[0]}.json`;
      downloadJson(combinedData, filename);
      toast({ title: 'Export Successful', description: `Data exported to ${filename}` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export Error', description: `Could not export data: ${e.message}` });
    }
  }, [isBaseDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  const handleCopyAllToJson = useCallback(async () => {
    logDebug('MainTabContent' as LogSourceId, 'Copy_All', 'Copy All to JSON clicked.');
     if (!isBaseDataReadyForCombinedExport) {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Core data sections are not available for copy.' });
      return;
    }
    try {
      const combinedData = getCombinedDataForExport();
      const success = await copyToClipboard(JSON.stringify(combinedData, null, 2));
      if (success) {
        toast({ title: 'Copied to Clipboard', description: 'Data copied as JSON.' });
      } else {
        throw new Error('Clipboard API failed.');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Copy Error', description: `Could not copy data: ${e.message}` });
    }
  }, [isBaseDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis Input</CardTitle>
        <CardDescription>
          Enter ticker for Data Fetch & AI TA. Manual AI actions available after. Chat integrated with global FSM.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleAnalyzeStockSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="ticker">Stock Ticker</Label>
              <Input
                id="ticker"
                value={tickerInput}
                onChange={handleTickerInputChange}
                placeholder="e.g., AAPL, MSFT"
                disabled={analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading || isGlobalPipelineActive || isGlobalChatFsmPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon" disabled>
                <SelectTrigger id="dataSource" disabled={analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading || isGlobalPipelineActive || isGlobalChatFsmPending}>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polygon">Polygon.io</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" className="w-full sm:w-auto"
              disabled={analyzeButtonDisabled || isGlobalChatFsmPending}>
              { analyzeButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
              <Zap className="mr-2 h-4 w-4" /> Analyze Stock (Data & AI TA)
            </Button>
          </div>
        </form>

        <Separator />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">On-Demand AI Analysis</CardTitle>
            <CardDescription>
              Generate specific AI insights for {globalFsmVariables.activeTicker || "the analyzed stock"}. Available after initial "Analyze Stock" is complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleGenerateKeyTakeaways}
                  className="w-full sm:w-auto"
                  disabled={isKtButtonDisabled}
                >
                  {keyTakeawaysButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Brain className="mr-2 h-4 w-4" /> Generate AI Key Takeaways
                </Button>
                <Button
                  onClick={handleGenerateOptionsAnalysis}
                  className="w-full sm:w-auto"
                  disabled={isOptButtonDisabled}
                >
                  {optionsAnalysisButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <BarChartBig className="mr-2 h-4 w-4" /> Generate AI Options Analysis
                </Button>
              </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-2">
            <h3 className="text-lg font-medium">Combined Data Export</h3>
            <CardDescription>Exports Snapshot, Standard TAs, AI Analyzed TA, and Market Status. AI Key Takeaways, Options Chain, and AI Options Analysis are included if available.</CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={handleExportAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={combinedExportButtonsDisabled}>
                    <Download className="mr-2 h-4 w-4" /> Export All to JSON
                </Button>
                <Button onClick={handleCopyAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={combinedExportButtonsDisabled}>
                    <Copy className="mr-2 h-4 w-4" /> Copy All to JSON
                </Button>
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
            // Removed: chatFormAction, addChatMessageToGlobalContext
            // Global FSM handles these now. ChatbotFsmProvider will use dispatchGlobalFsmEvent
            dispatchGlobalFsmEvent={dispatchGlobalFsmEvent} // Pass this down
            currentTicker={globalFsmVariables.activeTicker || tickerInput}
            stockSnapshotJson={contextStockSnapshotJson || '{}'}
            aiKeyTakeawaysJson={contextAiKeyTakeawaysJson || '{}'}
            aiAnalyzedTaJson={contextAiAnalyzedTaJson || '{}'}
            aiOptionsAnalysisJson={contextAiOptionsAnalysisJson || '{}'}
            currentGlobalChatHistory={contextChatHistory} // For context, if ChatbotFsm needs it for SUBMIT_CHAT_MESSAGE
            logDebug={logDebug}
            setChatbotFsmDisplayState={setChatbotFsmDisplay}
            isGlobalChatPending={isGlobalChatFsmPending} // Pass global pending state
          >
            <Chatbot
              isAnyAnalysisInProgress={isOverallAnalysisPending}
              currentTickerForDisplay={globalFsmVariables.activeTicker || tickerInput}
            />
          </ChatbotFsmProvider>
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}

