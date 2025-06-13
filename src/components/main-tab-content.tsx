
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
import { analyzeTaAction, type AnalyzeTaActionState, type AnalyzeTaResult } from "@/actions/analyze-ta-action";
import { performAiAnalysisAction, type PerformAiAnalysisActionState, type PerformAiAnalysisResult } from "@/actions/perform-ai-analysis-action";
import { performAiOptionsAnalysisAction, type PerformAiOptionsAnalysisActionState, type PerformAiOptionsAnalysisResult } from "@/actions/perform-ai-options-analysis-action";
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
    marketStatusJson: contextMarketStatusJson,
    stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson,
    optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson, 
    aiKeyTakeawaysJson: contextAiKeyTakeawaysJson, 
    aiOptionsAnalysisJson: contextAiOptionsAnalysisJson, 
    chatHistory: contextChatHistory,
    
    fullAnalysisStatus, 
    setFullAnalysisStatus, 
    isFullAnalysisTriggered, 
    
    logDebug,

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
  
  const isAnyLegacyActionPending = isAnalyzeStockPending || isAnalyzeTaPending || isPerformAiAnalysisPending || isPerformAiOptionsAnalysisPending || isChatPending;
  const isPipelineActive = fsmState !== FsmState.IDLE;


  const handleGenericError = useCallback((step: string, message: string | null | undefined, currentTicker: string) => {
    logDebug('MainTabContent:handleGenericError', `Error during ${step} for ${currentTicker}: ${message}`);
    toast({ variant: "destructive", title: `${step} Error`, description: message || "An unknown error occurred." });
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
          polygonApiRequestLogJson: analyzeStockState.data?.polygonApiRequestLogJson, 
          polygonApiResponseLogJson: analyzeStockState.data?.polygonApiResponseLogJson
        }
      });
    }
  }, [analyzeStockState, fsmState, dispatchFsmEvent, toast, logDebug]);

  // Effect to progress FSM from AWAITING_AI_TA_TRIGGER
  useEffect(() => {
    if (fsmState === FsmState.AWAITING_AI_TA_TRIGGER && analysisTriggeredForTickerRef.current) {
      if (contextStockSnapshotJson && contextStockSnapshotJson !== '{}' && !contextStockSnapshotJson.includes('"error":') && !contextStockSnapshotJson.includes('"status":')) {
        logDebug('FSM_PIPELINE', `MainTabContent: FSM in AWAITING_AI_TA_TRIGGER for ${analysisTriggeredForTickerRef.current}. Snapshot is valid. Dispatching TRIGGER_AI_TA.`);
        dispatchFsmEvent({ type: 'TRIGGER_AI_TA' });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: FSM in AWAITING_AI_TA_TRIGGER for ${analysisTriggeredForTickerRef.current}. Snapshot invalid/missing. AI TA will be skipped by reducer logic or next check.`);
         dispatchFsmEvent({
          type: 'AI_TA_FAILURE',
          payload: { error: 'Missing or invalid stock snapshot data for AI TA.', message: 'Prerequisite stock data not available.' }
        });
      }
    }
  }, [fsmState, contextStockSnapshotJson, dispatchFsmEvent, logDebug]);
  
  // Effect to trigger AI TA server action when FSM is in ANALYZING_TA
  useEffect(() => {
    if (fsmState === FsmState.ANALYZING_TA && analysisTriggeredForTickerRef.current && !isAnalyzeTaPending) {
      if (contextStockSnapshotJson && contextStockSnapshotJson !== '{}' && !contextStockSnapshotJson.includes('"error":') && !contextStockSnapshotJson.includes('"status":')) {
        logDebug('FSM_PIPELINE', `MainTabContent: FSM in ANALYZING_TA for ${analysisTriggeredForTickerRef.current}. Calling analyzeTaFormAction.`);
        startTransition(() => {
          analyzeTaFormAction({ stockSnapshotJson: contextStockSnapshotJson, ticker: analysisTriggeredForTickerRef.current! });
        });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: FSM in ANALYZING_TA for ${analysisTriggeredForTickerRef.current}, but stockSnapshotJson is invalid. Dispatching AI_TA_FAILURE.`);
        dispatchFsmEvent({
          type: 'AI_TA_FAILURE',
          payload: { error: 'Missing or invalid stock snapshot data for AI TA.', message: 'Prerequisite stock data not available.' }
        });
      }
    }
  }, [fsmState, contextStockSnapshotJson, analyzeTaFormAction, isAnalyzeTaPending, dispatchFsmEvent, logDebug]);

  // Effect for analyzeTaState (AI TA) -> Dispatch FSM events
  useEffect(() => {
    if (fsmState !== FsmState.ANALYZING_TA || analyzeTaState.status === 'idle' || !analysisTriggeredForTickerRef.current) {
      return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: AI TA Action state (analyzeTaState) changed:", analyzeTaState, "CurrentTickerRef:", analysisTriggeredForTickerRef.current);

    if (analyzeTaState.status === 'success' && analyzeTaState.data) {
      toast({ title: "AI TA Complete", description: analyzeTaState.message || `AI TA for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'AI_TA_SUCCESS', payload: analyzeTaState.data as AnalyzeTaResult });
    } else if (analyzeTaState.status === 'error') {
      toast({ variant: "destructive", title: "AI TA Error", description: analyzeTaState.message || "Failed to perform AI TA." });
      dispatchFsmEvent({ 
        type: 'AI_TA_FAILURE', 
        payload: { 
          error: analyzeTaState.error, 
          message: analyzeTaState.message,
          aiAnalyzedTaRequestJson: analyzeTaState.data?.aiAnalyzedTaRequestJson 
        } 
      });
    }
  }, [analyzeTaState, fsmState, dispatchFsmEvent, toast, logDebug]);

  // Effect to progress FSM from AWAITING_KEY_TAKEAWAYS_TRIGGER
  useEffect(() => {
    if (fsmState === FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER && isFullAnalysisTriggered && analysisTriggeredForTickerRef.current) {
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in AWAITING_KEY_TAKEAWAYS_TRIGGER for ${analysisTriggeredForTickerRef.current}. Dispatching TRIGGER_KEY_TAKEAWAYS.`);
      dispatchFsmEvent({ type: 'TRIGGER_KEY_TAKEAWAYS' });
    }
  }, [fsmState, isFullAnalysisTriggered, dispatchFsmEvent, logDebug]);

  // Effect to trigger AI Key Takeaways server action when FSM is in GENERATING_KEY_TAKEAWAYS
  useEffect(() => {
    if (fsmState === FsmState.GENERATING_KEY_TAKEAWAYS && analysisTriggeredForTickerRef.current && !isPerformAiAnalysisPending) {
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in GENERATING_KEY_TAKEAWAYS for ${analysisTriggeredForTickerRef.current}. Preparing to call performAiAnalysisFormAction.`);
      
      const ticker = analysisTriggeredForTickerRef.current;
      const snapshotReady = contextStockSnapshotJson && contextStockSnapshotJson !== '{}' && !contextStockSnapshotJson.includes('"error":') && !contextStockSnapshotJson.includes('"status": "pending"'); 
      const tasReady = contextStandardTasJson && contextStandardTasJson !== '{}' && !contextStandardTasJson.includes('"error":') && !contextStandardTasJson.includes('"status": "pending"');
      const aiTaReady = contextAiAnalyzedTaJson && contextAiAnalyzedTaJson !== '{}' && !contextAiAnalyzedTaJson.includes('"status": "pending"'); 
      const marketStatusReady = contextMarketStatusJson && contextMarketStatusJson !== '{}' && !contextMarketStatusJson.includes('"error":') && !contextMarketStatusJson.includes('"status": "pending"');

      if (snapshotReady && tasReady && aiTaReady && marketStatusReady) {
        logDebug('FSM_PIPELINE', `MainTabContent: Prerequisites met for performAiAnalysisAction. Snapshot: ${snapshotReady}, TAs: ${tasReady}, AI TA: ${aiTaReady}, Market: ${marketStatusReady}`);
        startTransition(() => {
          performAiAnalysisFormAction({
            ticker,
            stockSnapshotJson: contextStockSnapshotJson,
            standardTasJson: contextStandardTasJson,
            aiAnalyzedTaJson: contextAiAnalyzedTaJson,
            marketStatusJson: contextMarketStatusJson,
          });
        });
      } else {
        const missingPrereqs: string[] = [];
        if (!snapshotReady) missingPrereqs.push("Stock Snapshot");
        if (!tasReady) missingPrereqs.push("Standard TAs");
        if (!aiTaReady) missingPrereqs.push("AI Analyzed TA (might be error state from prior step)");
        if (!marketStatusReady) missingPrereqs.push("Market Status");
        logDebug('FSM_PIPELINE', `MainTabContent: FSM in GENERATING_KEY_TAKEAWAYS for ${ticker}, but prerequisites not met. Dispatching KEY_TAKEAWAYS_FAILURE. Missing: ${missingPrereqs.join(', ')}`);
        
        dispatchFsmEvent({
          type: 'KEY_TAKEAWAYS_FAILURE',
          payload: { 
            error: `Missing prerequisite data for AI Key Takeaways: ${missingPrereqs.join(', ')}.`, 
            message: 'Prerequisite data not available.' 
          }
        });
      }
    }
  }, [
    fsmState, 
    performAiAnalysisFormAction, 
    isPerformAiAnalysisPending, 
    contextStockSnapshotJson, 
    contextStandardTasJson, 
    contextAiAnalyzedTaJson, 
    contextMarketStatusJson, 
    dispatchFsmEvent, 
    logDebug
  ]);

  // Effect for performAiAnalysisState (Key Takeaways) -> Dispatch FSM events
  useEffect(() => {
    if (fsmState !== FsmState.GENERATING_KEY_TAKEAWAYS || performAiAnalysisState.status === 'idle' || !analysisTriggeredForTickerRef.current) {
      return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Key Takeaways Action state (performAiAnalysisState) changed:", performAiAnalysisState, "CurrentTickerRef:", analysisTriggeredForTickerRef.current);

    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Complete", description: performAiAnalysisState.message || `Key Takeaways for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: performAiAnalysisState.data as PerformAiAnalysisResult });
    } else if (performAiAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Key Takeaways Error", description: performAiAnalysisState.message || "Failed to generate Key Takeaways." });
      dispatchFsmEvent({ 
        type: 'KEY_TAKEAWAYS_FAILURE', 
        payload: { 
          error: performAiAnalysisState.error, 
          message: performAiAnalysisState.message,
          aiKeyTakeawaysRequestJson: performAiAnalysisState.data?.aiKeyTakeawaysRequestJson
        } 
      });
    }
  }, [performAiAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);

  // Effect to progress FSM from AWAITING_OPTIONS_ANALYSIS_TRIGGER
  useEffect(() => {
    if (fsmState === FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER && isFullAnalysisTriggered && analysisTriggeredForTickerRef.current) {
        logDebug('FSM_PIPELINE', `MainTabContent: FSM in AWAITING_OPTIONS_ANALYSIS_TRIGGER for ${analysisTriggeredForTickerRef.current}. Dispatching TRIGGER_OPTIONS_ANALYSIS.`);
        dispatchFsmEvent({ type: 'TRIGGER_OPTIONS_ANALYSIS' });
    }
  }, [fsmState, isFullAnalysisTriggered, dispatchFsmEvent, logDebug]);

  // Effect to trigger AI Options Analysis server action when FSM is in ANALYZING_OPTIONS
  useEffect(() => {
    if (fsmState === FsmState.ANALYZING_OPTIONS && analysisTriggeredForTickerRef.current && !isPerformAiOptionsAnalysisPending) {
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in ANALYZING_OPTIONS for ${analysisTriggeredForTickerRef.current}. Preparing to call performAiOptionsAnalysisFormAction.`);
      
      const ticker = analysisTriggeredForTickerRef.current;
      const optionsChainReady = contextOptionsChainJson && contextOptionsChainJson !== '{}' && !contextOptionsChainJson.includes('"error":') && !contextOptionsChainJson.includes('"status": "pending"');
      const snapshotReady = contextStockSnapshotJson && contextStockSnapshotJson !== '{}' && !contextStockSnapshotJson.includes('"error":') && !contextStockSnapshotJson.includes('"status": "pending"');

      if (optionsChainReady && snapshotReady) {
        logDebug('FSM_PIPELINE', `MainTabContent: Prerequisites met for performAiOptionsAnalysisAction. OptionsChain: ${optionsChainReady}, Snapshot: ${snapshotReady}`);
        startTransition(() => {
          performAiOptionsAnalysisFormAction({
            ticker,
            optionsChainJson: contextOptionsChainJson,
            stockSnapshotJson: contextStockSnapshotJson,
          });
        });
      } else {
        const missingPrereqs: string[] = [];
        if (!optionsChainReady) missingPrereqs.push("Options Chain Data");
        if (!snapshotReady) missingPrereqs.push("Stock Snapshot Data");
        logDebug('FSM_PIPELINE', `MainTabContent: FSM in ANALYZING_OPTIONS for ${ticker}, but prerequisites not met. Dispatching OPTIONS_ANALYSIS_FAILURE. Missing: ${missingPrereqs.join(', ')}`);
        
        dispatchFsmEvent({
          type: 'OPTIONS_ANALYSIS_FAILURE',
          payload: { 
            error: `Missing prerequisite data for AI Options Analysis: ${missingPrereqs.join(', ')}.`, 
            message: 'Prerequisite data not available.' 
          }
        });
      }
    }
  }, [
    fsmState,
    performAiOptionsAnalysisFormAction,
    isPerformAiOptionsAnalysisPending,
    contextOptionsChainJson,
    contextStockSnapshotJson,
    dispatchFsmEvent,
    logDebug
  ]);

  // Effect for performAiOptionsAnalysisState (Options Analysis) -> Dispatch FSM events
  useEffect(() => {
    if (fsmState !== FsmState.ANALYZING_OPTIONS || performAiOptionsAnalysisState.status === 'idle' || !analysisTriggeredForTickerRef.current) {
      return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Options Analysis Action state (performAiOptionsAnalysisState) changed:", performAiOptionsAnalysisState, "CurrentTickerRef:", analysisTriggeredForTickerRef.current);

    if (performAiOptionsAnalysisState.status === 'success' && performAiOptionsAnalysisState.data) {
      toast({ title: "AI Options Analysis Complete", description: performAiOptionsAnalysisState.message || `Options Analysis for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: performAiOptionsAnalysisState.data as PerformAiOptionsAnalysisResult });
    } else if (performAiOptionsAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Options Analysis Error", description: performAiOptionsAnalysisState.message || "Failed to generate Options Analysis." });
      dispatchFsmEvent({ 
        type: 'OPTIONS_ANALYSIS_FAILURE', 
        payload: { 
          error: performAiOptionsAnalysisState.error, 
          message: performAiOptionsAnalysisState.message,
          aiOptionsAnalysisRequestJson: performAiOptionsAnalysisState.data?.aiOptionsAnalysisRequestJson
        } 
      });
    }
  }, [performAiOptionsAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  // Effect for chatActionState
  useEffect(() => {
     if (fsmState !== FsmState.AWAITING_CHAT_SUMMARY_TRIGGER ) { // Placeholder - adapt to actual FSM state for chat summary
        return; 
    }
    // ... (logic for chat summary if it were part of this task)
  }, [chatActionState, isFullAnalysisTriggered, fullAnalysisStatus, toast, logDebug, fsmState]);


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

  logDebug('MainTabContent', `Rendering. FSM State=${fsmState}, isPipelineActive=${isPipelineActive}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}`);
  const activeTickerForChat = (analysisTriggeredForTickerRef.current && isPipelineActive) ? analysisTriggeredForTickerRef.current : tickerInput;

  const isFormDisabled = fsmState !== FsmState.IDLE;
  
  const showAnalyzeStockSpinner = fsmState === FsmState.FETCHING_DATA && isAnalyzeStockPending;
  const showAnalyzeTaSpinner = fsmState === FsmState.ANALYZING_TA && isAnalyzeTaPending;
  const showKeyTakeawaysSpinner = fsmState === FsmState.GENERATING_KEY_TAKEAWAYS && isPerformAiAnalysisPending;
  const showOptionsAnalysisSpinner = fsmState === FsmState.ANALYZING_OPTIONS && isPerformAiOptionsAnalysisPending;

  const isPartialAnalysisButtonPending = showAnalyzeStockSpinner || showAnalyzeTaSpinner;
  const isFullAnalysisButtonPending = isPipelineActive && isFullAnalysisTriggered;


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
                disabled={isFormDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon" disabled>
                <SelectTrigger id="dataSource" disabled={isFormDisabled}>
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
              disabled={isFormDisabled || isPartialAnalysisButtonPending || isFullAnalysisButtonPending }>
              { isPartialAnalysisButtonPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
              Analyze Stock
            </Button>
            <Button onClick={handleAiFullAnalysisSubmit} type="button" variant="outline" className="w-full sm:w-auto" 
              disabled={isFormDisabled || isFullAnalysisButtonPending }>
               { isFullAnalysisButtonPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
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
