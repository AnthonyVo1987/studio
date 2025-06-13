
"use client";

import type { FormEvent } from 'react';
import React, { useState, useActionState, useEffect, startTransition, useRef, useCallback } from "react";
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
import { AiOptionsAnalysisDisplay } from "@/components/ai-options-analysis-display";
import { AiKeyTakeawaysDisplay } from "@/components/ai-key-takeaways-display";
import { OptionsChainTable } from "@/components/options-chain-table";
import { Chatbot } from "@/components/chatbot";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";

import { fetchStockDataAction, type AnalyzeStockServerActionState, type StockDataFetchResult } from "@/actions/analyze-stock-server-action";
import { analyzeTaAction, type AnalyzeTaActionState } from "@/actions/analyze-ta-action";
import { performAiAnalysisAction, type PerformAiAnalysisActionState } from "@/actions/perform-ai-analysis-action";
import { performAiOptionsAnalysisAction, type PerformAiOptionsAnalysisActionState } from "@/actions/perform-ai-options-analysis-action";
import { chatServerAction, type ChatActionState, type ChatActionInputs } from "@/actions/chat-server-action";

import { useStockAnalysis, type FullAnalysisStatus, type ChatMessage, FsmState } from "@/contexts/stock-analysis-context"; 
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap } from "lucide-react";

const initialStockDataFetchState: AnalyzeStockServerActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialAnalyzeTaState: AnalyzeTaActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialPerformAiAnalysisState: PerformAiAnalysisActionState = { 
  status: 'idle', data: undefined, error: null, message: null,
};
const initialPerformAiOptionsAnalysisState: PerformAiOptionsAnalysisActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialChatActionState: ChatActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};


export function MainTabContent() {
  const [tickerInput, setTickerInput] = useState("NVDA");
  const analysisTriggeredForTickerRef = useRef<string | null>(null);

  const { toast } = useToast();
  const {
    // Context state variables (mostly read, FSM will write via reducer now for pipeline data)
    marketStatusJson: contextMarketStatusJson,
    stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson,
    optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson, // Keep reading for display
    aiKeyTakeawaysJson: contextAiKeyTakeawaysJson, // Keep reading for display
    aiOptionsAnalysisJson: contextAiOptionsAnalysisJson, // Keep reading for display
    chatHistory: contextChatHistory,

    // Context setters (will be less directly used from here for pipeline data)
    // setMarketStatusJson, setStockSnapshotJson, etc. now called by FSM reducer in context
    
    // Full analysis tracking (will be deprecated by FSM)
    fullAnalysisStatus,
    setFullAnalysisStatus, // Still used for legacy parts / overall status until FSM covers all
    isFullAnalysisTriggered, // Now read from context, set by FSM
    setIsFullAnalysisTriggered, // Now set by FSM
    logDebug,

    // FSM
    fsmState,
    dispatchFsmEvent,
  } = useStockAnalysis();

  const [analyzeStockState, analyzeStockFormAction, isAnalyzeStockPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(
    fetchStockDataAction,
    initialStockDataFetchState
  );

  const [analyzeTaState, analyzeTaFormAction, isAnalyzeTaPending] = useActionState<AnalyzeTaActionState, { stockSnapshotJson: string, ticker?: string }>(
    analyzeTaAction,
    initialAnalyzeTaState
  );

  const [performAiAnalysisState, performAiAnalysisFormAction, isPerformAiAnalysisPending] = useActionState<PerformAiAnalysisActionState, Parameters<typeof performAiAnalysisAction>[1]>(
    performAiAnalysisAction,
    initialPerformAiAnalysisState
  );

  const [performAiOptionsAnalysisState, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending] = useActionState<PerformAiOptionsAnalysisActionState, Parameters<typeof performAiOptionsAnalysisAction>[1]>(
    performAiOptionsAnalysisAction,
    initialPerformAiOptionsAnalysisState
  );
  
  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(
    chatServerAction,
    initialChatActionState
  );
  
  const isAnySubActionPending = isAnalyzeStockPending || isAnalyzeTaPending || isPerformAiAnalysisPending || isPerformAiOptionsAnalysisPending || isChatPending;
  const isPipelineActive = fsmState !== FsmState.IDLE && fsmState !== FsmState.DATA_FETCH_FAILED && fsmState !== FsmState.AWAITING_AI_TA_TRIGGER; // Adjust as more terminal/idle states are added


  const handleGenericError = useCallback((step: string, message: string | null | undefined, currentTicker: string) => {
    logDebug('MainTabContent:handleGenericError', `Error during ${step} for ${currentTicker}: ${message}`);
    toast({ variant: "destructive", title: `${step} Error`, description: message || "An unknown error occurred." });
    // This function might be deprecated or simplified as FSM handles error state JSONs.
    // For now, it's a fallback.
    setFullAnalysisStatus('error'); 
    if (analysisTriggeredForTickerRef.current === currentTicker) {
        analysisTriggeredForTickerRef.current = null; 
    }
  }, [logDebug, toast, setFullAnalysisStatus]);
  

  const handleAnalyzeStockButtonSubmit = useCallback((event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    logDebug('MainTabContent', `Analyze Stock button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    if (fsmState !== FsmState.IDLE) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running or initializing.", variant: "default" });
      return;
    }
    analysisTriggeredForTickerRef.current = tickerInput; 
    dispatchFsmEvent({ type: 'START_PARTIAL_ANALYSIS', payload: { ticker: tickerInput } });
  }, [fsmState, toast, tickerInput, dispatchFsmEvent, logDebug]);

  const handleAiFullAnalysisSubmit = useCallback(() => {
    logDebug('MainTabContent', `AI Full Stock Analysis button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    if (fsmState !== FsmState.IDLE) {
      toast({ title: "Process Busy", description: "Another analysis process is currently running or initializing.", variant: "default" });
      return;
    }
    analysisTriggeredForTickerRef.current = tickerInput; 
    dispatchFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: tickerInput } });
  }, [fsmState, toast, tickerInput, dispatchFsmEvent, logDebug]);


  // Effect to progress FSM from AWAITING_DATA_FETCH_TRIGGER to FETCHING_DATA
  useEffect(() => {
    if (fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER && analysisTriggeredForTickerRef.current) {
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in AWAITING_DATA_FETCH_TRIGGER for ${analysisTriggeredForTickerRef.current}. Dispatching TRIGGER_DATA_FETCH.`);
      dispatchFsmEvent({ type: 'TRIGGER_DATA_FETCH' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // Effect to trigger the actual data fetch server action when FSM is in FETCHING_DATA
  useEffect(() => {
    if (fsmState === FsmState.FETCHING_DATA && analysisTriggeredForTickerRef.current && !isAnalyzeStockPending) {
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in FETCHING_DATA for ${analysisTriggeredForTickerRef.current}. Calling analyzeStockFormAction.`);
      startTransition(() => {
        analyzeStockFormAction({ ticker: analysisTriggeredForTickerRef.current! });
      });
    }
  }, [fsmState, analyzeStockFormAction, isAnalyzeStockPending, logDebug]);


  // Effect for analyzeStockState (Data Fetch) -> Dispatch FSM events
  useEffect(() => {
    // Only react if the FSM is expecting the result of this action
    if (fsmState !== FsmState.FETCHING_DATA || analyzeStockState.status === 'idle' || !analysisTriggeredForTickerRef.current) {
      return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Data Fetch Action state (analyzeStockState) changed:", analyzeStockState, "CurrentTickerRef:", analysisTriggeredForTickerRef.current);

    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      toast({ title: "Data Fetched", description: analyzeStockState.message || `Data for ${analysisTriggeredForTickerRef.current} fetched.` });
      dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: analyzeStockState.data as StockDataFetchResult });
    } else if (analyzeStockState.status === 'error') {
      toast({ variant: "destructive", title: "Data Fetch Error", description: analyzeStockState.message || "Failed to fetch data." });
      dispatchFsmEvent({ 
        type: 'FETCH_DATA_FAILURE', 
        payload: { 
          error: analyzeStockState.error, 
          message: analyzeStockState.message,
          // Pass along polygon logs if available, though analyzeStockState doesn't directly hold them in this structure
          polygonApiRequestLogJson: analyzeStockState.data?.polygonApiRequestLogJson, // Might be undefined on error
          polygonApiResponseLogJson: analyzeStockState.data?.polygonApiResponseLogJson // Might be undefined on error
        }
      });
    }
  }, [analyzeStockState, fsmState, dispatchFsmEvent, toast, logDebug]);


  // --- Placeholder for subsequent FSM integrations (AI TA, Key Takeaways, etc.) ---
  // Effect for analyzeTaState 
  useEffect(() => {
    if (fsmState === FsmState.IDLE || fsmState === FsmState.INITIALIZING_ANALYSIS || fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER || fsmState === FsmState.FETCHING_DATA || fsmState === FsmState.DATA_FETCH_SUCCEEDED || fsmState === FsmState.DATA_FETCH_FAILED ) {
        return; 
    }
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (!currentAnalysisTicker || analyzeTaState.status === 'idle' || (fullAnalysisStatus !== 'analyzingTa' && !isAnalyzeTaPending)) {
      return;
    }
     logDebug('MainTabContent:useEffect[analyzeTaState]', "AI TA state changed (LEGACY PATH):", analyzeTaState, "FullAnalysisTriggered:", isFullAnalysisTriggered, "CurrentTickerRef:", currentAnalysisTicker);
    // ... (rest of legacy logic, will be replaced by FSM)
  }, [analyzeTaState, fullAnalysisStatus, isAnalyzeTaPending, isFullAnalysisTriggered, contextStockSnapshotJson, contextStandardTasJson, contextMarketStatusJson, logDebug, toast, handleGenericError, fsmState]);
  
  // Effect for performAiAnalysisState (Key Takeaways)
  useEffect(() => {
     if (fsmState === FsmState.IDLE || fsmState === FsmState.INITIALIZING_ANALYSIS || fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER || fsmState === FsmState.FETCHING_DATA || fsmState === FsmState.DATA_FETCH_SUCCEEDED || fsmState === FsmState.DATA_FETCH_FAILED) {
        return; 
    }
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (!currentAnalysisTicker || !isFullAnalysisTriggered || performAiAnalysisState.status === 'idle' || (fullAnalysisStatus !== 'generatingTakeaways' && !isPerformAiAnalysisPending)) {
      return;
    }
    logDebug('MainTabContent:useEffect[performAiAnalysisState]', "Key Takeaways state changed (LEGACY PATH):", performAiAnalysisState, "CurrentTickerRef:", currentAnalysisTicker);
    // ... (rest of legacy logic)
  }, [performAiAnalysisState, isFullAnalysisTriggered, fullAnalysisStatus, isPerformAiAnalysisPending, contextOptionsChainJson, contextStockSnapshotJson, logDebug, toast, handleGenericError, fsmState]);

  // Effect for performAiOptionsAnalysisState (Options Analysis)
  useEffect(() => {
     if (fsmState === FsmState.IDLE || fsmState === FsmState.INITIALIZING_ANALYSIS || fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER || fsmState === FsmState.FETCHING_DATA || fsmState === FsmState.DATA_FETCH_SUCCEEDED || fsmState === FsmState.DATA_FETCH_FAILED) {
        return; 
    }
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (!currentAnalysisTicker || !isFullAnalysisTriggered || performAiOptionsAnalysisState.status === 'idle' || (fullAnalysisStatus !== 'analyzingOptions' && !isPerformAiOptionsAnalysisPending)) {
      return;
    }
    logDebug('MainTabContent:useEffect[performAiOptionsAnalysisState]', "Options Analysis state changed (LEGACY PATH):", performAiOptionsAnalysisState, "CurrentTickerRef:", currentAnalysisTicker);
    // ... (rest of legacy logic)
  }, [performAiOptionsAnalysisState, isFullAnalysisTriggered, fullAnalysisStatus, isPerformAiOptionsAnalysisPending, contextStockSnapshotJson, contextAiKeyTakeawaysJson, contextAiAnalyzedTaJson, contextChatHistory, logDebug, toast, handleGenericError, fsmState]); 
  
  // Effect for chatActionState
  useEffect(() => {
     if (fsmState === FsmState.IDLE || fsmState === FsmState.INITIALIZING_ANALYSIS || fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER || fsmState === FsmState.FETCHING_DATA || fsmState === FsmState.DATA_FETCH_SUCCEEDED || fsmState === FsmState.DATA_FETCH_FAILED) {
        return; 
    }
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (chatActionState.status === 'idle' && (!currentAnalysisTicker || !isFullAnalysisTriggered || fullAnalysisStatus !== 'chatting')) {
        return;
    }
    logDebug('MainTabContent:useEffect[chatActionState]', "Chat state changed (LEGACY PATH):", chatActionState, "FullAnalysisTriggered:", isFullAnalysisTriggered, "FullAnalysisStatus:", fullAnalysisStatus, "CurrentTickerRef:", currentAnalysisTicker);
    // ... (rest of legacy logic)
  }, [chatActionState, isFullAnalysisTriggered, fullAnalysisStatus, toast, setIsFullAnalysisTriggered, logDebug, fsmState]);
 // --- End of placeholder legacy useEffects ---


  const getCombinedDataForExport = useCallback(() => {
    logDebug('MainTabContent:getCombinedDataForExport', 'Called.');
    try {
      return {
        stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
        standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'),
        aiAnalyzedTechnicalAnalysis: JSON.parse(contextAiAnalyzedTaJson || '{}'),
        aiKeyTakeaways: JSON.parse(contextAiKeyTakeawaysJson || '{}'),
        aiOptionsAnalysis: JSON.parse(contextAiOptionsAnalysisJson || '{}'),
        optionsChain: JSON.parse(contextOptionsChainJson || '{}'),
        marketStatus: JSON.parse(contextMarketStatusJson || '{}'),
      };
    } catch (e) {
        logDebug('MainTabContent:getCombinedDataForExport', 'Error parsing JSON:', e);
        toast({variant: "destructive", title: "Data Preparation Error", description: "Could not parse all data components for export."});
        return { error: "Failed to parse one or more data components." };
    }
  }, [logDebug, toast, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextOptionsChainJson, contextMarketStatusJson]);

  const isJsonReadyForExport = (jsonString: string): boolean => {
    return !!jsonString && jsonString !== '{}' && !jsonString.includes('"status":') && !jsonString.includes('"error":');
  };

  const isDataReadyForCombinedExport =
    isJsonReadyForExport(contextStockSnapshotJson) &&
    isJsonReadyForExport(contextStandardTasJson) &&
    isJsonReadyForExport(contextAiAnalyzedTaJson) &&
    isJsonReadyForExport(contextAiKeyTakeawaysJson) &&
    isJsonReadyForExport(contextAiOptionsAnalysisJson) &&
    isJsonReadyForExport(contextOptionsChainJson) &&
    isJsonReadyForExport(contextMarketStatusJson);

  const handleExportAllToJson = useCallback(async () => {
    logDebug('MainTabContent:handleExportAllToJson', 'Button clicked.');
    if (!isDataReadyForCombinedExport) {
        toast({variant: "destructive", title: "Data Not Ready", description: "Not all required data sections are available for combined export."});
        return;
    }
    try {
      const dataToExport = getCombinedDataForExport();
      if ((dataToExport as any).error) return;
      const currentDisplayTicker = dataToExport.stockSnapshot?.ticker || tickerInput || 'STOCK';
      downloadJson(dataToExport, `${currentDisplayTicker}_stocksage_all_data.json`);
      toast({ title: "Data Exported", description: `Combined analysis for ${currentDisplayTicker} downloaded as JSON.` });
    } catch (e) {
      toast({variant: "destructive", title: "Export Error", description: "Could not export combined data."});
    }
  }, [isDataReadyForCombinedExport, getCombinedDataForExport, tickerInput, toast, logDebug]);

  const handleCopyAllToJson = useCallback(async () => {
    logDebug('MainTabContent:handleCopyAllToJson', 'Button clicked.');
    if (!isDataReadyForCombinedExport) {
        toast({variant: "destructive", title: "Data Not Ready", description: "Not all required data sections are available for combined copy."});
        return;
    }
    try {
      const dataToExport = getCombinedDataForExport();
       if ((dataToExport as any).error) return;
      const currentDisplayTicker = dataToExport.stockSnapshot?.ticker || tickerInput || 'STOCK';
      const success = await copyToClipboard(JSON.stringify(dataToExport, null, 2));
      if (success) {
        toast({ title: "Data Copied", description: `Combined analysis for ${currentDisplayTicker} copied to clipboard.` });
      } else {
        toast({variant: "destructive", title: "Copy Failed", description: "Could not copy combined data."});
      }
    } catch (e) {
       toast({variant: "destructive", title: "Copy Error", description: "Could not prepare combined data for copy."});
    }
  }, [isDataReadyForCombinedExport, getCombinedDataForExport, tickerInput, toast, logDebug]);

  logDebug('MainTabContent', `Rendering. FSM State=${fsmState}, isPipelineActive=${isPipelineActive}, isAnalyzeStockPending=${isAnalyzeStockPending}, Legacy FullAnalysisStatus=${fullAnalysisStatus}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}`);
  const activeTickerForChat = (analysisTriggeredForTickerRef.current && isPipelineActive) ? analysisTriggeredForTickerRef.current : tickerInput;


  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis</CardTitle>
        <CardDescription>
          Enter a stock ticker and select a data source to begin your analysis. Current FSM State: {fsmState}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAnalyzeStockButtonSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="ticker">Stock Ticker</Label>
              <Input
                id="ticker"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, MSFT"
                disabled={fsmState !== FsmState.IDLE}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon" disabled>
                <SelectTrigger id="dataSource" disabled={fsmState !== FsmState.IDLE}>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polygon">Polygon.io</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={fsmState !== FsmState.IDLE || isAnalyzeStockPending}>
              { (isAnalyzeStockPending && (fsmState === FsmState.FETCHING_DATA || fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
              Analyze Stock
            </Button>
            <Button onClick={handleAiFullAnalysisSubmit} type="button" variant="outline" className="w-full sm:w-auto" disabled={fsmState !== FsmState.IDLE || isPipelineActive}>
               {(isPipelineActive && isFullAnalysisTriggered) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Zap className="mr-2 h-4 w-4" /> AI Full Stock Analysis
            </Button>
          </div>
        </form>

        <Separator />

        <div className="space-y-2">
            <h3 className="text-lg font-medium">Combined Data Export</h3>
            <CardDescription>Exports Snapshot, Standard TAs, AI Analyzed TA, AI Key Takeaways, AI Options Analysis, Options Chain, and Market Status.</CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={handleExportAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isDataReadyForCombinedExport || isPipelineActive }>
                    <Download className="mr-2 h-4 w-4" /> Export All to JSON
                </Button>
                <Button onClick={handleCopyAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isDataReadyForCombinedExport || isPipelineActive}>
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
          <Chatbot
            chatFormAction={chatFormAction}
            isChatPending={isChatPending || (isFullAnalysisTriggered && fullAnalysisStatus === 'chatting')}
            currentTicker={activeTickerForChat}
          />
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}

