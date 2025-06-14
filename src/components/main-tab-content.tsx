
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
import { performAiAnalysisAction, type PerformAiAnalysisActionState, type PerformAiAnalysisResult, type PerformAiAnalysisActionInputs } from "@/actions/perform-ai-analysis-action";
import { performAiOptionsAnalysisAction, type PerformAiOptionsAnalysisActionState, type PerformAiOptionsAnalysisResult, type PerformAiOptionsAnalysisActionInputs as PerformAiOptionsAnalysisActionInputsType } from "@/actions/perform-ai-options-analysis-action"; 
import { chatServerAction, type ChatActionState, type ChatActionInputs } from "@/actions/chat-server-action";
import { generateChatSummaryAction, type GenerateChatSummaryActionState, type GenerateChatSummaryResult, type GenerateChatSummaryActionInputs } from "@/actions/generate-chat-summary-action"; 

import { useStockAnalysis, type ChatMessage, FsmState } from "@/contexts/stock-analysis-context"; 
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap } from "lucide-react";
import type { StockSnapshotData } from '@/services/data-sources/types';

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
const initialGenerateChatSummaryState: GenerateChatSummaryActionState = { 
  status: 'idle', data: undefined, error: null, message: null,
};
const initialChatActionState: ChatActionState = { 
  status: 'idle', data: undefined, error: null, message: null,
};

const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }'
];

function isDataReadyForProcessing(jsonString: string | null | undefined, logDebugFn?: Function, sourceComponent?: string, dataName?: string): boolean {
  const callContext = `${sourceComponent || 'isDataReadyForProcessing'}:${dataName || 'data'}`;
  if (!jsonString || jsonString === '{}') {
    logDebugFn?.(callContext, `Data is not ready: string is null, undefined, or empty object.`);
    return false;
  }
  if (PENDING_STATUS_JSON_VARIANTS.includes(jsonString.trim())) {
    logDebugFn?.(callContext, `Data is not ready: string is a pending placeholder: '${jsonString.substring(0,50)}...'`);
    return false;
  }
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object') {
      if (parsed.error || (parsed.status && (parsed.status.includes('error') || parsed.status.includes('skipped')))) {
        logDebugFn?.(callContext, `Data is not ready: JSON content indicates error/skipped status: '${jsonString.substring(0,100)}...'`);
        return false;
      }
    }
  } catch(e) {
    logDebugFn?.(callContext, `Data is not ready: JSON.parse failed for string: '${jsonString.substring(0,100)}...'`);
    return false; 
  }
  logDebugFn?.(callContext, `Data is ready (passed all checks): '${jsonString.substring(0,100)}...'`);
  return true;
}


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
    isFullAnalysisTriggered,
    logDebug,
    fsmState,
    dispatchFsmEvent,
    chatHistory, // For chat action state handling
  } = useStockAnalysis();
  
  logDebug('FSM_PIPELINE', `MainTabContent RENDER: fsmState=${fsmState}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}, isFullAnalysisTriggered=${isFullAnalysisTriggered}`);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: fsmState EFFECT change detected. New fsmState: ${fsmState}.`);
  }, [fsmState, logDebug]);

  const [analyzeStockState, analyzeStockFormAction, isAnalyzeStockPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(fetchStockDataAction, initialStockDataFetchState);
  const [analyzeTaState, analyzeTaFormAction, isAnalyzeTaPending] = useActionState<AnalyzeTaActionState, { stockSnapshotJson: string, ticker?: string }>(analyzeTaAction, initialAnalyzeTaState);
  const [performAiAnalysisState, performAiAnalysisFormAction, isPerformAiAnalysisPending] = useActionState<PerformAiAnalysisActionState, PerformAiAnalysisActionInputs>(performAiAnalysisAction, initialPerformAiAnalysisState);
  const [performAiOptionsAnalysisState, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending] = useActionState<PerformAiOptionsAnalysisActionState, PerformAiOptionsAnalysisActionInputsType>(performAiOptionsAnalysisAction, initialPerformAiOptionsAnalysisState);
  const [generateChatSummaryState, generateChatSummaryFormAction, isGenerateChatSummaryPending] = useActionState<GenerateChatSummaryActionState, GenerateChatSummaryActionInputs>(generateChatSummaryAction, initialGenerateChatSummaryState);
  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(chatServerAction, initialChatActionState);
  
  const isPipelineActive = fsmState !== FsmState.IDLE && fsmState !== FsmState.PARTIAL_ANALYSIS_COMPLETE && fsmState !== FsmState.FULL_ANALYSIS_COMPLETE;

  const handleAnalyzeStockButtonSubmit = useCallback((event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    logDebug('MainTabContent', `"${FsmState.START_PARTIAL_ANALYSIS}" button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    if (isPipelineActive) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" });
      return;
    }
    analysisTriggeredForTickerRef.current = tickerInput; 
    dispatchFsmEvent({ type: 'START_PARTIAL_ANALYSIS', payload: { ticker: tickerInput } });
  }, [fsmState, toast, tickerInput, dispatchFsmEvent, logDebug, isPipelineActive]);

  const handleAiFullAnalysisSubmit = useCallback(() => {
    logDebug('MainTabContent', `"${FsmState.START_FULL_ANALYSIS}" button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    if (isPipelineActive) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" });
      return;
    }
    analysisTriggeredForTickerRef.current = tickerInput; 
    dispatchFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: tickerInput } });
  }, [fsmState, toast, tickerInput, dispatchFsmEvent, logDebug, isPipelineActive]);

  // --- FSM Progression: Data Fetching ---
  useEffect(() => {
    if (fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected AWAITING_DATA_FETCH_TRIGGER. Dispatching TRIGGER_DATA_FETCH.`);
      dispatchFsmEvent({ type: 'TRIGGER_DATA_FETCH' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.FETCHING_DATA && analysisTriggeredForTickerRef.current && !isAnalyzeStockPending) {
      const payload = { ticker: analysisTriggeredForTickerRef.current };
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in FETCHING_DATA for ${analysisTriggeredForTickerRef.current}. Calling analyzeStockFormAction.`);
      startTransition(() => { analyzeStockFormAction(payload); });
    }
  }, [fsmState, analyzeStockFormAction, isAnalyzeStockPending, logDebug]);

  useEffect(() => {
    if (analyzeStockState.status === 'idle' || fsmState !== FsmState.FETCHING_DATA) { 
      if (analyzeStockState.status !== 'idle') logDebug('FSM_PIPELINE', `MainTabContent: Data Fetch Action state changed, but FSM not in FETCHING_DATA. Ignoring. State: ${fsmState}, Action: ${analyzeStockState.status}`);
      return; 
    }
    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      toast({ title: "Data Fetched", description: analyzeStockState.message || `Data for ${analysisTriggeredForTickerRef.current} fetched.` });
      dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: analyzeStockState.data as StockDataFetchResult });
    } else if (analyzeStockState.status === 'error') {
      toast({ variant: "destructive", title: "Data Fetch Error", description: analyzeStockState.message || "Failed to fetch data." });
      dispatchFsmEvent({ type: 'FETCH_DATA_FAILURE', payload: { error: analyzeStockState.error, message: analyzeStockState.message, polygonApiRequestLogJson: analyzeStockState.data?.polygonApiRequestLogJson, polygonApiResponseLogJson: analyzeStockState.data?.polygonApiResponseLogJson }});
    }
  }, [analyzeStockState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  // --- FSM Progression: AI TA ---
  useEffect(() => {
    if (fsmState === FsmState.DATA_FETCH_SUCCEEDED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected DATA_FETCH_SUCCEEDED. Dispatching INITIATE_AI_TA_SEQUENCE.`);
      dispatchFsmEvent({ type: 'INITIATE_AI_TA_SEQUENCE' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AI_TA AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_AI_TA_TRIGGER) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
        dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: "Ticker reference missing for AI TA.", message: "Internal error." } }); return;
      }
      logDebug('FSM_PIPELINE', `MainTabContent: Handling AWAITING_AI_TA_TRIGGER for ${currentActionTicker}. Validating prerequisites...`);
      if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `AWAIT_AITA:${currentActionTicker}`, 'Snapshot')) {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_AITA - Snapshot for ${currentActionTicker} READY. Dispatching TRIGGER_AI_TA.`);
        dispatchFsmEvent({ type: 'TRIGGER_AI_TA' });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_AITA - Snapshot for ${currentActionTicker} NOT READY. Waiting.`);
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug, contextStockSnapshotJson]);

  useEffect(() => {
    if (fsmState === FsmState.ANALYZING_TA && analysisTriggeredForTickerRef.current && !isAnalyzeTaPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_TA for ${currentActionTicker}. Final check snapshot.`);
      if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `ANALYZING_TA:${currentActionTicker}`, 'SnapshotFinalCheck')) {
        const payload = { stockSnapshotJson: contextStockSnapshotJson!, ticker: currentActionTicker };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling analyzeTaFormAction for ${currentActionTicker}.`);
        startTransition(() => { analyzeTaFormAction(payload); });
      } else {
        dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: `Snapshot became invalid during ANALYZING_TA for ${currentActionTicker}.`, message: 'Prerequisite stock data error for AI TA.' } });
      }
    }
  }, [fsmState, contextStockSnapshotJson, analyzeTaFormAction, isAnalyzeTaPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (analyzeTaState.status === 'idle' || fsmState !== FsmState.ANALYZING_TA) { 
      if (analyzeTaState.status !== 'idle') logDebug('FSM_PIPELINE', `MainTabContent: AI TA Action state changed, but FSM not in ANALYZING_TA. Ignoring. State: ${fsmState}`);
      return; 
    }
    if (analyzeTaState.status === 'success' && analyzeTaState.data) {
      toast({ title: "AI TA Complete", description: analyzeTaState.message || `AI TA for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'AI_TA_SUCCESS', payload: analyzeTaState.data as AnalyzeTaResult });
    } else if (analyzeTaState.status === 'error') {
      toast({ variant: "destructive", title: "AI TA Error", description: analyzeTaState.message || "Failed to perform AI TA." });
      dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: analyzeTaState.error, message: analyzeTaState.message, aiAnalyzedTaRequestJson: analyzeTaState.data?.aiAnalyzedTaRequestJson } });
    }
  }, [analyzeTaState, fsmState, dispatchFsmEvent, toast, logDebug]);

  // --- FSM Progression: Key Takeaways ---
  useEffect(() => {
    if (fsmState === FsmState.AI_TA_SUCCEEDED || fsmState === FsmState.AI_TA_FAILED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. isFullAnalysisTriggered: ${isFullAnalysisTriggered}.`);
      if (isFullAnalysisTriggered) {
        dispatchFsmEvent({ type: 'INITIATE_KEY_TAKEAWAYS_SEQUENCE' });
      } else {
        dispatchFsmEvent({ type: 'PROCEED_TO_PARTIAL_COMPLETE' });
      }
    }
  }, [fsmState, isFullAnalysisTriggered, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Key_Takeaways AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER) {
        const currentActionTicker = analysisTriggeredForTickerRef.current;
        if (!currentActionTicker) { dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: "Ticker ref missing for KT.", message: "Internal error for KT." } }); return; }
        logDebug('FSM_PIPELINE', `MainTabContent: Handling AWAITING_KEY_TAKEAWAYS_TRIGGER for ${currentActionTicker}. Validating prerequisites...`);
        
        let snapshotData: StockSnapshotData | null = null;
        if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'Snapshot') || !(snapshotData = JSON.parse(contextStockSnapshotJson!)) || snapshotData.ticker !== currentActionTicker) {
            logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - Snapshot for ${currentActionTicker} not ready/inconsistent (found ${snapshotData?.ticker}). Waiting.`); return;
        }
        if (!isDataReadyForProcessing(contextStandardTasJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'StdTA')) { logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - Std TAs for ${currentActionTicker} not ready. Waiting.`); return; }
        if (!isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'AITA')) { logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - AI TA for ${currentActionTicker} not ready. Waiting.`); return; }
        if (!isDataReadyForProcessing(contextMarketStatusJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'MarketStatus')) { logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - Market Status for ${currentActionTicker} not ready. Waiting.`); return; }

        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - All prereqs for ${currentActionTicker} READY & CONSISTENT. Dispatching TRIGGER_KEY_TAKEAWAYS.`);
        dispatchFsmEvent({ type: 'TRIGGER_KEY_TAKEAWAYS' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson]);

  useEffect(() => {
    if (fsmState === FsmState.GENERATING_KEY_TAKEAWAYS && analysisTriggeredForTickerRef.current && !isPerformAiAnalysisPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_KEY_TAKEAWAYS for ${currentActionTicker}. Final consistency check.`);
      let snapshotData: StockSnapshotData | null = null;
      try { snapshotData = JSON.parse(contextStockSnapshotJson!); } catch(e) {}

      if (snapshotData?.ticker !== currentActionTicker) {
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: `Final KT consistency check failed for ${currentActionTicker}. Snapshot ticker ${snapshotData?.ticker}.`, message: "Data inconsistency." } }); return;
      }
      // Assume other data is consistent if snapshot is, as they were checked before AWAITING_KEY_TAKEAWAYS_TRIGGER
      const payload: PerformAiAnalysisActionInputs = { ticker: currentActionTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, marketStatusJson: contextMarketStatusJson! };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiAnalysisFormAction (Key Takeaways) for ${currentActionTicker}.`);
      startTransition(() => { performAiAnalysisFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, performAiAnalysisFormAction, isPerformAiAnalysisPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
     if (performAiAnalysisState.status === 'idle' || fsmState !== FsmState.GENERATING_KEY_TAKEAWAYS) { 
      if (performAiAnalysisState.status !== 'idle') logDebug('FSM_PIPELINE', `MainTabContent: Key Takeaways Action state changed, but FSM not in GENERATING_KEY_TAKEAWAYS. Ignoring. State: ${fsmState}`);
      return; 
    }
    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Complete", description: performAiAnalysisState.message || `Key Takeaways for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: performAiAnalysisState.data as PerformAiAnalysisResult });
    } else if (performAiAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Key Takeaways Error", description: performAiAnalysisState.message || "Failed to generate Key Takeaways." });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: performAiAnalysisState.error, message: performAiAnalysisState.message, aiKeyTakeawaysRequestJson: performAiAnalysisState.data?.aiKeyTakeawaysRequestJson } });
    }
  }, [performAiAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  // --- FSM Progression: Options Analysis ---
  useEffect(() => {
    if (fsmState === FsmState.KEY_TAKEAWAYS_SUCCEEDED || fsmState === FsmState.KEY_TAKEAWAYS_FAILED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} (after KT). isFullAnalysisTriggered: ${isFullAnalysisTriggered}.`);
      if (isFullAnalysisTriggered) { // Always proceed for full analysis as per v2.9.A.G
        dispatchFsmEvent({ type: 'INITIATE_OPTIONS_ANALYSIS_SEQUENCE' });
      } else { // This path should not be taken anymore based on v2.9.A.G changes
        dispatchFsmEvent({ type: 'PROCEED_TO_PARTIAL_COMPLETE' }); 
      }
    }
  }, [fsmState, isFullAnalysisTriggered, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Options_Analysis AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER) {
        const currentActionTicker = analysisTriggeredForTickerRef.current;
        if (!currentActionTicker) { dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: "Ticker ref missing for Options.", message: "Internal error for Options." } }); return; }
        logDebug('FSM_PIPELINE', `MainTabContent: Handling AWAITING_OPTIONS_ANALYSIS_TRIGGER for ${currentActionTicker}. Validating prerequisites...`);
        
        let snapshotData: StockSnapshotData | null = null;
        if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `AWAIT_OPT:${currentActionTicker}`, 'Snapshot') || !(snapshotData = JSON.parse(contextStockSnapshotJson!)) || snapshotData.ticker !== currentActionTicker) {
            logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_OPT - Snapshot for ${currentActionTicker} not ready/inconsistent (found ${snapshotData?.ticker}). Waiting.`); return;
        }
        if (!isDataReadyForProcessing(contextOptionsChainJson, logDebug, `AWAIT_OPT:${currentActionTicker}`, 'OptionsChain')) { logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_OPT - Options Chain for ${currentActionTicker} not ready. Waiting.`); return; }

        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_OPT - All prereqs for ${currentActionTicker} READY & CONSISTENT. Dispatching TRIGGER_OPTIONS_ANALYSIS.`);
        dispatchFsmEvent({ type: 'TRIGGER_OPTIONS_ANALYSIS' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug, contextStockSnapshotJson, contextOptionsChainJson]);

  useEffect(() => {
    if (fsmState === FsmState.ANALYZING_OPTIONS && analysisTriggeredForTickerRef.current && !isPerformAiOptionsAnalysisPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_OPTIONS for ${currentActionTicker}. Final consistency check.`);
      let snapshotData: StockSnapshotData | null = null;
      try { snapshotData = JSON.parse(contextStockSnapshotJson!); } catch(e) {}

      if (snapshotData?.ticker !== currentActionTicker) {
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: `Final Options consistency check failed for ${currentActionTicker}. Snapshot ticker ${snapshotData?.ticker}.`, message: "Data inconsistency." } }); return;
      }
      // Assuming options chain is consistent if snapshot is (checked before AWAITING_OPTIONS_ANALYSIS_TRIGGER)
      const payload: PerformAiOptionsAnalysisActionInputsType = { ticker: currentActionTicker, optionsChainJson: contextOptionsChainJson!, stockSnapshotJson: contextStockSnapshotJson! };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiOptionsAnalysisFormAction for ${currentActionTicker}.`);
      startTransition(() => { performAiOptionsAnalysisFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextOptionsChainJson, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (performAiOptionsAnalysisState.status === 'idle' || fsmState !== FsmState.ANALYZING_OPTIONS) {
      if(performAiOptionsAnalysisState.status !== 'idle') logDebug('FSM_PIPELINE', `MainTabContent: Options Analysis Action state changed, but FSM not in ANALYZING_OPTIONS. Ignoring. State: ${fsmState}`);
      return;
    }
    if (performAiOptionsAnalysisState.status === 'success' && performAiOptionsAnalysisState.data) {
      toast({ title: "AI Options Analysis Complete", description: performAiOptionsAnalysisState.message || `Options Analysis for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: performAiOptionsAnalysisState.data as PerformAiOptionsAnalysisResult });
    } else if (performAiOptionsAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Options Analysis Error", description: performAiOptionsAnalysisState.message || "Failed to generate Options Analysis." });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: performAiOptionsAnalysisState.error, message: performAiOptionsAnalysisState.message, aiOptionsAnalysisRequestJson: performAiOptionsAnalysisState.data?.aiOptionsAnalysisRequestJson } });
    }
  }, [performAiOptionsAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);

  // --- FSM Progression: Chat Summary ---
  useEffect(() => {
    if (fsmState === FsmState.OPTIONS_ANALYSIS_SUCCEEDED || fsmState === FsmState.OPTIONS_ANALYSIS_FAILED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} (after Options). isFullAnalysisTriggered: ${isFullAnalysisTriggered}.`);
      if (isFullAnalysisTriggered) {
        dispatchFsmEvent({ type: 'INITIATE_CHAT_SUMMARY_SEQUENCE' });
      } else { // This is the new "Analyze Stock" (no chat summary) completion point
        dispatchFsmEvent({ type: 'PROCEED_TO_PARTIAL_COMPLETE' });
      }
    }
  }, [fsmState, isFullAnalysisTriggered, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Chat_Summary AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_CHAT_SUMMARY_TRIGGER) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) { dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: "Ticker ref missing for Chat Summary.", message: "Internal error for Chat Summary." } }); return; }
      logDebug('FSM_PIPELINE', `MainTabContent: Handling AWAITING_CHAT_SUMMARY_TRIGGER for ${currentActionTicker}. Validating prerequisites...`);

      let snapshotData: StockSnapshotData | null = null;
      if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'Snapshot') || !(snapshotData = JSON.parse(contextStockSnapshotJson!)) || snapshotData.ticker !== currentActionTicker) {
          logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_CS - Snapshot for ${currentActionTicker} not ready/inconsistent (found ${snapshotData?.ticker}). Waiting.`); return;
      }
      const allPrereqsReady = 
          isDataReadyForProcessing(contextStandardTasJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'StdTA') &&
          isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'AITA') &&
          isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'KeyTakeaways') &&
          isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'OptionsAnalysis') &&
          isDataReadyForProcessing(contextMarketStatusJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'MarketStatus');

      if (allPrereqsReady) {
          logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_CS - All prereqs for ${currentActionTicker} READY & CONSISTENT. Dispatching TRIGGER_CHAT_SUMMARY.`);
          dispatchFsmEvent({ type: 'TRIGGER_CHAT_SUMMARY' });
      } else {
          logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_CS - Some prereqs for ${currentActionTicker} NOT YET READY. Waiting.`);
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson]);

  useEffect(() => {
    if (fsmState === FsmState.GENERATING_CHAT_SUMMARY && analysisTriggeredForTickerRef.current && !isGenerateChatSummaryPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_CHAT_SUMMARY for ${currentActionTicker}. Final consistency check.`);
      let snapshotData: StockSnapshotData | null = null;
      try { snapshotData = JSON.parse(contextStockSnapshotJson!); } catch(e) {}
      if (snapshotData?.ticker !== currentActionTicker) {
        dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: `Final Chat Summary consistency check failed for ${currentActionTicker}. Snapshot ticker ${snapshotData?.ticker}.`, message: "Data inconsistency." } }); return;
      }
      const payload: GenerateChatSummaryActionInputs = { ticker: currentActionTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, aiKeyTakeawaysJson: contextAiKeyTakeawaysJson!, aiOptionsAnalysisJson: contextAiOptionsAnalysisJson!, marketStatusJson: contextMarketStatusJson! };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling generateChatSummaryFormAction for ${currentActionTicker}.`);
      startTransition(() => { generateChatSummaryFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson, generateChatSummaryFormAction, isGenerateChatSummaryPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (generateChatSummaryState.status === 'idle' || fsmState !== FsmState.GENERATING_CHAT_SUMMARY) { 
      if(generateChatSummaryState.status !== 'idle') logDebug('FSM_PIPELINE', `MainTabContent: Chat Summary Action state changed, but FSM not in GENERATING_CHAT_SUMMARY. Ignoring. State: ${fsmState}`);
      return; 
    }
    if (generateChatSummaryState.status === 'success' && generateChatSummaryState.data) {
      toast({ title: "Chat Summary Generated", description: generateChatSummaryState.message || `Chat summary for ${analysisTriggeredForTickerRef.current} generated.` });
      dispatchFsmEvent({ type: 'CHAT_SUMMARY_SUCCESS', payload: generateChatSummaryState.data as GenerateChatSummaryResult });
    } else if (generateChatSummaryState.status === 'error') {
      toast({ variant: "destructive", title: "Chat Summary Error", description: generateChatSummaryState.message || "Failed to generate chat summary." });
      dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: generateChatSummaryState.error, message: generateChatSummaryState.message, requestJson: generateChatSummaryState.data?.requestJson } });
    }
  }, [generateChatSummaryState, fsmState, dispatchFsmEvent, toast, logDebug]);

  // --- FSM Progression: Completion & IDLE ---
  useEffect(() => {
    if (fsmState === FsmState.CHAT_SUMMARY_SUCCEEDED || fsmState === FsmState.CHAT_SUMMARY_FAILED) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} (after Chat Summary). Dispatching PROCEED_TO_FULL_COMPLETE.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_FULL_COMPLETE' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.PARTIAL_ANALYSIS_COMPLETE || fsmState === FsmState.FULL_ANALYSIS_COMPLETE) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. Dispatching PROCEED_TO_IDLE.`);
      dispatchFsmEvent({ type: 'PROCEED_TO_IDLE' }); 
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);
  
  useEffect(() => {
    if (fsmState === FsmState.IDLE) {
      logDebug('FSM_PIPELINE', `MainTabContent: FSM is IDLE. Resetting analysisTriggeredForTickerRef from ${analysisTriggeredForTickerRef.current} to null.`);
      analysisTriggeredForTickerRef.current = null;
    }
  }, [fsmState, logDebug]);


  // Handle interactive chat messages (only when FSM is IDLE)
  useEffect(() => {
    if (chatActionState.status === 'idle' || fsmState !== FsmState.IDLE) { 
      if (chatActionState.status !== 'idle' && fsmState !== FsmState.IDLE) {
        logDebug('MainTabContent:chatActionState', `Ignoring chat action state change because FSM is not IDLE. Current FSM State: ${fsmState}`);
      }
      return; 
    } 
    logDebug('MainTabContent:chatActionState', 'Interactive chat state changed while FSM is IDLE:', `Status: ${chatActionState.status}`);
    if (chatActionState.status === 'success' && chatActionState.data?.chatbotResponseJson) {
        try {
            const responseObj = JSON.parse(chatActionState.data.chatbotResponseJson);
            const modelMessage: ChatMessage = { id: Date.now().toString() + '_model', role: 'model', content: responseObj.response || "No response text." };
            dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE', payload: modelMessage }); 
        } catch (e) {
            const errorMessage: ChatMessage = { id: Date.now().toString() + '_model_error', role: 'model', content: "Sorry, I had trouble formatting my response." };
            dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE', payload: errorMessage }); 
        }
    } else if (chatActionState.status === 'error') {
        const errorMessageContent = chatActionState.message || "Sorry, an error occurred with the chat.";
        const errorModelMessage: ChatMessage = { id: Date.now().toString() + '_model_error', role: 'model', content: errorMessageContent };
        dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE', payload: errorModelMessage }); 
    }
  }, [chatActionState, dispatchFsmEvent, logDebug, fsmState]);

  const getCombinedDataForExport = useCallback(() => {
    return {
        ticker: analysisTriggeredForTickerRef.current || tickerInput,
        stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
        standardTAs: JSON.parse(contextStandardTasJson || '{}'),
        aiAnalyzedTA: JSON.parse(contextAiAnalyzedTaJson || '{}'),
        aiKeyTakeaways: JSON.parse(contextAiKeyTakeawaysJson || '{}'),
        aiOptionsAnalysis: JSON.parse(contextAiOptionsAnalysisJson || '{}'),
        optionsChain: JSON.parse(contextOptionsChainJson || '{}'),
        marketStatus: JSON.parse(contextMarketStatusJson || '{}'),
    };
  }, [contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextOptionsChainJson, contextMarketStatusJson, tickerInput]);

  const isDataReadyForCombinedExport = 
    isDataReadyForProcessing(contextStockSnapshotJson) &&
    isDataReadyForProcessing(contextStandardTasJson) &&
    isDataReadyForProcessing(contextAiAnalyzedTaJson) &&
    isDataReadyForProcessing(contextAiKeyTakeawaysJson) &&
    isDataReadyForProcessing(contextAiOptionsAnalysisJson) &&
    isDataReadyForProcessing(contextOptionsChainJson) &&
    isDataReadyForProcessing(contextMarketStatusJson);


  const handleExportAllToJson = useCallback(async () => {
    if (!isDataReadyForCombinedExport) {
        toast({variant: "destructive", title: "Data Not Ready", description: "Not all data components are available for export."});
        return;
    }
    const currentTicker = analysisTriggeredForTickerRef.current || tickerInput;
    logDebug('MainTabContent', `Exporting all data to JSON for ${currentTicker}`);
    downloadJson(getCombinedDataForExport(), `${currentTicker}_full_analysis.json`);
    toast({title: "Exported All Data", description: "All analysis data downloaded as JSON."});
  }, [getCombinedDataForExport, isDataReadyForCombinedExport, tickerInput, toast, logDebug]);

  const handleCopyAllToJson = useCallback(async () => {
    if (!isDataReadyForCombinedExport) {
        toast({variant: "destructive", title: "Data Not Ready", description: "Not all data components are available for copy."});
        return;
    }
    const currentTicker = analysisTriggeredForTickerRef.current || tickerInput;
    logDebug('MainTabContent', `Copying all data to JSON for clipboard for ${currentTicker}`);
    const success = await copyToClipboard(JSON.stringify(getCombinedDataForExport(), null, 2));
    if (success) {
        toast({title: "Copied All Data", description: "All analysis data copied to clipboard."});
    } else {
        toast({variant: "destructive", title: "Copy Failed", description: "Could not copy all analysis data."});
    }
  }, [getCombinedDataForExport, isDataReadyForCombinedExport, tickerInput, toast, logDebug]);

  const activeTickerForChat = analysisTriggeredForTickerRef.current || tickerInput;
  const isFormDisabled = isPipelineActive;
  const isAnalyzeStockButtonPending = isPipelineActive && !isFullAnalysisTriggered; 
  const isFullAnalysisButtonPending = isPipelineActive && isFullAnalysisTriggered;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis</CardTitle>
        <CardDescription>
          Enter a stock ticker. "Analyze Stock" provides key data and AI insights (TA, Key Takeaways, Options). "AI Full Stock Analysis" adds a chat summary. FSM: {fsmState}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4">
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
            <Button onClick={handleAnalyzeStockButtonSubmit} type="button" className="w-full sm:w-auto" 
              disabled={isFormDisabled || isAnalyzeStockButtonPending || isFullAnalysisButtonPending }>
              { isAnalyzeStockButtonPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
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
            isChatPending={isChatPending} 
            currentTicker={activeTickerForChat}
          />
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}
    
