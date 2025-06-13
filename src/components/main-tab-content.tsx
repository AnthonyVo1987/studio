
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
import { generateChatSummaryAction, type GenerateChatSummaryActionState, type GenerateChatSummaryResult, type GenerateChatSummaryActionInputs } from "@/actions/generate-chat-summary-action"; 

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
const initialGenerateChatSummaryState: GenerateChatSummaryActionState = { 
  status: 'idle', data: undefined, error: null, message: null,
};
const initialChatActionState: ChatActionState = { 
  status: 'idle', data: undefined, error: null, message: null,
};

const PENDING_PLACEHOLDER_JSON_STRINGS = [
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
  if (PENDING_PLACEHOLDER_JSON_STRINGS.includes(jsonString.trim())) {
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
      if (dataName === 'contextStockSnapshotJson' && parsed.ticker === undefined) {
        logDebugFn?.(callContext, `Data is not ready: Stock Snapshot JSON missing 'ticker' field.`);
        return false;
      }
      if (dataName === 'aiKeyTakeawaysJson' && (!parsed.priceAction || !parsed.trend || !parsed.volatility || !parsed.momentum || !parsed.patterns)) {
        logDebugFn?.(callContext, `Data is not ready: AI Key Takeaways JSON missing one or more core takeaway categories.`);
        return false;
      }
      if (dataName === 'aiAnalyzedTaJson' && parsed.pivotPoint === undefined) { 
        logDebugFn?.(callContext, `Data is not ready: AI Analyzed TA JSON missing pivotPoint field.`);
        return false;
      }
      if (dataName === 'aiOptionsAnalysisJson' && parsed.callWalls === undefined && parsed.putWalls === undefined) { 
        logDebugFn?.(callContext, `Data is not ready: AI Options Analysis JSON missing callWalls/putWalls fields.`);
        return false;
      }
    }
  } catch(e) {
    logDebugFn?.(callContext, `Data is not ready: JSON.parse failed for string: '${jsonString.substring(0,100)}...'`);
    return false;
  }
  logDebugFn?.(callContext, `Data is ready: '${jsonString.substring(0,100)}...'`);
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
  } = useStockAnalysis();

  logDebug('FSM_PIPELINE', `MainTabContent RENDER: fsmState=${fsmState}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}, isFullAnalysisTriggered=${isFullAnalysisTriggered}`);

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
  
  const [generateChatSummaryState, generateChatSummaryFormAction, isGenerateChatSummaryPending] = useActionState<GenerateChatSummaryActionState, GenerateChatSummaryActionInputs>( 
    generateChatSummaryAction,
    initialGenerateChatSummaryState
  );

  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>( 
    chatServerAction,
    initialChatActionState
  );
  
  const isPipelineActive = fsmState !== FsmState.IDLE && fsmState !== FsmState.FULL_ANALYSIS_COMPLETE && fsmState !== FsmState.PARTIAL_ANALYSIS_COMPLETE;

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: fsmState EFFECT change detected. New fsmState: ${fsmState}. Current Ticker Ref: ${analysisTriggeredForTickerRef.current}. IsFullAnalysisTriggered: ${isFullAnalysisTriggered}`);
  }, [fsmState, isFullAnalysisTriggered, logDebug]);


  const handleAnalyzeStockButtonSubmit = useCallback((event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    logDebug('MainTabContent', `Analyze Stock button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    if (isPipelineActive) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" });
      return;
    }
    analysisTriggeredForTickerRef.current = tickerInput; 
    dispatchFsmEvent({ type: 'START_PARTIAL_ANALYSIS', payload: { ticker: tickerInput } });
  }, [fsmState, toast, tickerInput, dispatchFsmEvent, logDebug, isPipelineActive]);

  const handleAiFullAnalysisSubmit = useCallback(() => {
    logDebug('MainTabContent', `AI Full Stock Analysis button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    if (isPipelineActive) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" });
      return;
    }
    analysisTriggeredForTickerRef.current = tickerInput; 
    dispatchFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: tickerInput } });
  }, [fsmState, toast, tickerInput, dispatchFsmEvent, logDebug, isPipelineActive]);


  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_DATA_FETCH_TRIGGER Effect Check. Current fsmState: ${fsmState}. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_DATA_FETCH_TRIGGER. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
      if (analysisTriggeredForTickerRef.current) {
        dispatchFsmEvent({ type: 'TRIGGER_DATA_FETCH' });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_DATA_FETCH_TRIGGER - Ref is null. This should not happen. FSM will stall here. Dispatching FETCH_DATA_FAILURE.`);
        dispatchFsmEvent({ type: 'FETCH_DATA_FAILURE', payload: { error: "Internal: Ticker reference lost.", message: "Failed to initiate data fetch." } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: FETCHING_DATA Effect Check. Current fsmState: ${fsmState}. isAnalyzeStockPending: ${isAnalyzeStockPending}. Ticker: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.FETCHING_DATA && analysisTriggeredForTickerRef.current && !isAnalyzeStockPending) {
      const payload = { ticker: analysisTriggeredForTickerRef.current! };
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in FETCHING_DATA for ${analysisTriggeredForTickerRef.current}. Calling analyzeStockFormAction with payload:`, payload);
      startTransition(() => {
        analyzeStockFormAction(payload);
      });
    }
  }, [fsmState, analyzeStockFormAction, isAnalyzeStockPending, logDebug]);


  useEffect(() => {
    if (analyzeStockState.status === 'idle' || !analysisTriggeredForTickerRef.current) { // Only act if action state is not idle and we have a ticker
      return;
    }
    // Ensure this effect only processes results for the *current* pipeline's FSM state.
    if (fsmState !== FsmState.FETCHING_DATA) {
        logDebug('FSM_PIPELINE', "MainTabContent: Data Fetch Action (analyzeStockState) changed, but FSM not in FETCHING_DATA. Ignoring.", `Current FSM State: ${fsmState}, Action Status: ${analyzeStockState.status}`);
        return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Data Fetch Action state (analyzeStockState) changed:", 
               `Status: ${analyzeStockState.status}, Message: ${analyzeStockState.message}, CurrentTickerRef: ${analysisTriggeredForTickerRef.current}`);

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
  }, [analyzeStockState, fsmState, dispatchFsmEvent, toast, logDebug]); // Added fsmState here
  
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AI_TA AWAITING Effect Check. Current fsmState: ${fsmState}. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.AWAITING_AI_TA_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_AI_TA_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}. Snapshot: '${contextStockSnapshotJson?.substring(0,50)}...'`);
      if (analysisTriggeredForTickerRef.current) {
        const snapshotIsValid = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_AI_TA_TRIGGER_CHECK', 'contextStockSnapshotJson');
        if (snapshotIsValid) {
          dispatchFsmEvent({ type: 'TRIGGER_AI_TA' });
        } else {
          const reason = `Snapshot not ready. Current value: '${contextStockSnapshotJson?.substring(0, 100)}...'`;
          dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: `Prerequisite stock snapshot data not ready for AI TA. ${reason}`, message: 'Prerequisite stock data not available or invalid for AI TA.' } });
        }
      } else {
         dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: 'Internal error: Ticker reference lost before AI TA.', message: 'Internal error for AI TA.' } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug, contextStockSnapshotJson]); // contextStockSnapshotJson is needed to re-evaluate if it becomes ready while in this state
  
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_TA Effect Check. Current fsmState: ${fsmState}. isAnalyzeTaPending: ${isAnalyzeTaPending}. Ticker: ${analysisTriggeredForTickerRef.current}. Snapshot: ${contextStockSnapshotJson?.substring(0,30)}...`);
    if (fsmState === FsmState.ANALYZING_TA && analysisTriggeredForTickerRef.current && !isAnalyzeTaPending) {
      if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:ANALYZING_TA', 'contextStockSnapshotJson')) {
        const payload = { stockSnapshotJson: contextStockSnapshotJson!, ticker: analysisTriggeredForTickerRef.current };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling analyzeTaFormAction with payload:`, {ticker: payload.ticker, snapshotLength: payload.stockSnapshotJson.length});
        startTransition(() => { analyzeTaFormAction(payload); });
      } else {
        dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: `Snapshot became invalid during ANALYZING_TA. Snapshot: '${contextStockSnapshotJson?.substring(0,100)}...'`, message: 'Prerequisite stock data error for AI TA.' } });
      }
    }
  }, [fsmState, contextStockSnapshotJson, analyzeTaFormAction, isAnalyzeTaPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (analyzeTaState.status === 'idle' || !analysisTriggeredForTickerRef.current) return;
    if (fsmState !== FsmState.ANALYZING_TA) {
        logDebug('FSM_PIPELINE', "MainTabContent: AI TA Action (analyzeTaState) changed, but FSM not in ANALYZING_TA. Ignoring.", `Current FSM State: ${fsmState}, Action Status: ${analyzeTaState.status}`);
        return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: AI TA Action state (analyzeTaState) changed:", `Status: ${analyzeTaState.status}, Message: ${analyzeTaState.message}`);
    if (analyzeTaState.status === 'success' && analyzeTaState.data) {
      toast({ title: "AI TA Complete", description: analyzeTaState.message || `AI TA for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'AI_TA_SUCCESS', payload: analyzeTaState.data as AnalyzeTaResult });
    } else if (analyzeTaState.status === 'error') {
      toast({ variant: "destructive", title: "AI TA Error", description: analyzeTaState.message || "Failed to perform AI TA." });
      dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: analyzeTaState.error, message: analyzeTaState.message, aiAnalyzedTaRequestJson: analyzeTaState.data?.aiAnalyzedTaRequestJson } });
    }
  }, [analyzeTaState, fsmState, dispatchFsmEvent, toast, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Key_Takeaways AWAITING Effect Check. Current fsmState: ${fsmState}. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_KEY_TAKEAWAYS_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}. FullAnalysis: ${isFullAnalysisTriggered}. Snapshot: '${contextStockSnapshotJson?.substring(0,30)}', StdTAs: '${contextStandardTasJson?.substring(0,30)}', AITA: '${contextAiAnalyzedTaJson?.substring(0,30)}', Market: '${contextMarketStatusJson?.substring(0,30)}'`);
      if (isFullAnalysisTriggered && analysisTriggeredForTickerRef.current) {
        const prereqs = {
          snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_KEY_TAKEAWAYS', 'contextStockSnapshotJson'),
          stdTAs: isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:AWAITING_KEY_TAKEAWAYS', 'contextStandardTasJson'),
          aiTA: isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:AWAITING_KEY_TAKEAWAYS', 'contextAiAnalyzedTaJson'),
          market: isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:AWAITING_KEY_TAKEAWAYS', 'contextMarketStatusJson'),
        };
        if (prereqs.snapshot && prereqs.stdTAs && prereqs.aiTA && prereqs.market) {
          dispatchFsmEvent({ type: 'TRIGGER_KEY_TAKEAWAYS' });
        } else {
          const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', ');
          dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: `Missing/invalid prerequisites for Key Takeaways: ${missing}.`, message: 'Prerequisite data for Key Takeaways not ready.' } });
        }
      } else if (!isFullAnalysisTriggered) { /* No action for partial */ } 
      else {
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: 'Ticker reference missing for Key Takeaways.', message: 'Internal error.' } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug, isFullAnalysisTriggered, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_KEY_TAKEAWAYS Effect Check. Current fsmState: ${fsmState}. isPerformAiAnalysisPending: ${isPerformAiAnalysisPending}. Ticker: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.GENERATING_KEY_TAKEAWAYS && analysisTriggeredForTickerRef.current && !isPerformAiAnalysisPending) {
      const currentTicker = analysisTriggeredForTickerRef.current;
      const prereqs = {
          snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:GENERATING_KEY_TAKEAWAYS', 'contextStockSnapshotJson'),
          stdTAs: isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:GENERATING_KEY_TAKEAWAYS', 'contextStandardTasJson'),
          aiTA: isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:GENERATING_KEY_TAKEAWAYS', 'contextAiAnalyzedTaJson'),
          market: isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:GENERATING_KEY_TAKEAWAYS', 'contextMarketStatusJson'),
      };
      if (prereqs.snapshot && prereqs.stdTAs && prereqs.aiTA && prereqs.market) {
        const payload = { ticker: currentTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, marketStatusJson: contextMarketStatusJson! };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiAnalysisFormAction (Key Takeaways) for ${currentTicker}.`);
        startTransition(() => { performAiAnalysisFormAction(payload); });
      } else {
        const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', ');
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: `Prerequisites for Key Takeaways became invalid during GENERATING: ${missing}.`, message: 'Prerequisite data error for Key Takeaways.' } });
      }
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, performAiAnalysisFormAction, isPerformAiAnalysisPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (performAiAnalysisState.status === 'idle' || !analysisTriggeredForTickerRef.current) return;
    if (fsmState !== FsmState.GENERATING_KEY_TAKEAWAYS) {
        logDebug('FSM_PIPELINE', "MainTabContent: Key Takeaways Action (performAiAnalysisState) changed, but FSM not in GENERATING_KEY_TAKEAWAYS. Ignoring.", `Current FSM State: ${fsmState}, Action Status: ${performAiAnalysisState.status}`);
        return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Key Takeaways Action state (performAiAnalysisState) changed:", `Status: ${performAiAnalysisState.status}, Message: ${performAiAnalysisState.message}`);
    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Complete", description: performAiAnalysisState.message || `Key Takeaways for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: performAiAnalysisState.data as PerformAiAnalysisResult });
    } else if (performAiAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Key Takeaways Error", description: performAiAnalysisState.message || "Failed to generate Key Takeaways." });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: performAiAnalysisState.error, message: performAiAnalysisState.message, aiKeyTakeawaysRequestJson: performAiAnalysisState.data?.aiKeyTakeawaysRequestJson } });
    }
  }, [performAiAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Options_Analysis AWAITING Effect Check. Current fsmState: ${fsmState}. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_OPTIONS_ANALYSIS_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}. FullAnalysis: ${isFullAnalysisTriggered}. OptionsJSON: '${contextOptionsChainJson?.substring(0,30)}', Snapshot: '${contextStockSnapshotJson?.substring(0,30)}'`);
      if (isFullAnalysisTriggered && analysisTriggeredForTickerRef.current) {
        const prereqs = {
          options: isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'MainTabContent:AWAITING_OPTIONS_ANALYSIS', 'contextOptionsChainJson'),
          snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_OPTIONS_ANALYSIS', 'contextStockSnapshotJson'),
        };
        if (prereqs.options && prereqs.snapshot) {
          dispatchFsmEvent({ type: 'TRIGGER_OPTIONS_ANALYSIS' });
        } else {
          const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', ');
          dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: `Missing/invalid prerequisites for Options Analysis: ${missing}.`, message: 'Prerequisite data for Options Analysis not ready.' } });
        }
      } else if (!isFullAnalysisTriggered) { /* No action */ } 
      else {
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: 'Ticker reference missing for Options Analysis.', message: 'Internal error.' } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug, isFullAnalysisTriggered, contextOptionsChainJson, contextStockSnapshotJson]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_OPTIONS Effect Check. Current fsmState: ${fsmState}. isPerformAiOptionsAnalysisPending: ${isPerformAiOptionsAnalysisPending}. Ticker: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.ANALYZING_OPTIONS && analysisTriggeredForTickerRef.current && !isPerformAiOptionsAnalysisPending) {
      const currentTicker = analysisTriggeredForTickerRef.current;
      const prereqs = {
          options: isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'MainTabContent:ANALYZING_OPTIONS', 'contextOptionsChainJson'),
          snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:ANALYZING_OPTIONS', 'contextStockSnapshotJson'),
      };
      if (prereqs.options && prereqs.snapshot) {
        const payload = { ticker: currentTicker, optionsChainJson: contextOptionsChainJson!, stockSnapshotJson: contextStockSnapshotJson! };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiOptionsAnalysisFormAction for ${currentTicker}.`);
        startTransition(() => { performAiOptionsAnalysisFormAction(payload); });
      } else {
        const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', ');
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: `Prerequisites for Options Analysis became invalid during ANALYZING: ${missing}.`, message: 'Prerequisite data error for Options Analysis.' } });
      }
    }
  }, [fsmState, contextOptionsChainJson, contextStockSnapshotJson, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (performAiOptionsAnalysisState.status === 'idle' || !analysisTriggeredForTickerRef.current) return;
    if (fsmState !== FsmState.ANALYZING_OPTIONS) {
        logDebug('FSM_PIPELINE', "MainTabContent: Options Analysis Action (performAiOptionsAnalysisState) changed, but FSM not in ANALYZING_OPTIONS. Ignoring.", `Current FSM State: ${fsmState}, Action Status: ${performAiOptionsAnalysisState.status}`);
        return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Options Analysis Action state (performAiOptionsAnalysisState) changed:", `Status: ${performAiOptionsAnalysisState.status}, Message: ${performAiOptionsAnalysisState.message}`);
    if (performAiOptionsAnalysisState.status === 'success' && performAiOptionsAnalysisState.data) {
      toast({ title: "AI Options Analysis Complete", description: performAiOptionsAnalysisState.message || `Options Analysis for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: performAiOptionsAnalysisState.data as PerformAiOptionsAnalysisResult });
    } else if (performAiOptionsAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Options Analysis Error", description: performAiOptionsAnalysisState.message || "Failed to generate Options Analysis." });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: performAiOptionsAnalysisState.error, message: performAiOptionsAnalysisState.message, aiOptionsAnalysisRequestJson: performAiOptionsAnalysisState.data?.aiOptionsAnalysisRequestJson } });
    }
  }, [performAiOptionsAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]); 
  
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Chat_Summary AWAITING Effect Check. Current fsmState: ${fsmState}. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.AWAITING_CHAT_SUMMARY_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_CHAT_SUMMARY_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}. FullAnalysis: ${isFullAnalysisTriggered}. Snapshot: '${contextStockSnapshotJson?.substring(0,30)}', StdTAs: '${contextStandardTasJson?.substring(0,30)}', AITA: '${contextAiAnalyzedTaJson?.substring(0,30)}', KeyTakeaways: '${contextAiKeyTakeawaysJson?.substring(0,30)}', Options: '${contextAiOptionsAnalysisJson?.substring(0,30)}', Market: '${contextMarketStatusJson?.substring(0,30)}'`);
      if (isFullAnalysisTriggered && analysisTriggeredForTickerRef.current) {
        const prereqs = {
          snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextStockSnapshotJson'),
          stdTAs: isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextStandardTasJson'),
          aiTA: isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextAiAnalyzedTaJson'), 
          keyTakeaways: isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextAiKeyTakeawaysJson'), 
          options: isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextAiOptionsAnalysisJson'), 
          market: isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextMarketStatusJson'),
        };
        if (prereqs.snapshot && prereqs.stdTAs && prereqs.market && prereqs.aiTA && prereqs.keyTakeaways && prereqs.options) {
          dispatchFsmEvent({ type: 'TRIGGER_CHAT_SUMMARY' });
        } else {
          const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', ');
          dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: `Missing/invalid prerequisites for Chat Summary: ${missing}.`, message: 'Prerequisite data for Chat Summary not ready.' } });
        }
      } else if (!isFullAnalysisTriggered) { /* No action */ } 
      else {
        dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: 'Ticker reference missing for chat summary.', message: 'Internal error.' } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug, isFullAnalysisTriggered, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_CHAT_SUMMARY Effect Check. Current fsmState: ${fsmState}. isGenerateChatSummaryPending: ${isGenerateChatSummaryPending}. Ticker: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.GENERATING_CHAT_SUMMARY && analysisTriggeredForTickerRef.current && !isGenerateChatSummaryPending) {
      const currentTicker = analysisTriggeredForTickerRef.current;
       const prereqs = {
          snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:GENERATING_CHAT_SUMMARY', 'contextStockSnapshotJson'),
          stdTAs: isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:GENERATING_CHAT_SUMMARY', 'contextStandardTasJson'),
          aiTA: isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:GENERATING_CHAT_SUMMARY', 'contextAiAnalyzedTaJson'),
          keyTakeaways: isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, 'MainTabContent:GENERATING_CHAT_SUMMARY', 'contextAiKeyTakeawaysJson'),
          options: isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, 'MainTabContent:GENERATING_CHAT_SUMMARY', 'contextAiOptionsAnalysisJson'),
          market: isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:GENERATING_CHAT_SUMMARY', 'contextMarketStatusJson'),
      };
      if (prereqs.snapshot && prereqs.stdTAs && prereqs.market && prereqs.aiTA && prereqs.keyTakeaways && prereqs.options) {
        const payload: GenerateChatSummaryActionInputs = { ticker: currentTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, aiKeyTakeawaysJson: contextAiKeyTakeawaysJson!, aiOptionsAnalysisJson: contextAiOptionsAnalysisJson!, marketStatusJson: contextMarketStatusJson! };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling generateChatSummaryFormAction for ${currentTicker}.`);
        startTransition(() => { generateChatSummaryFormAction(payload); });
      } else {
        const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', ');
        dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: `Prerequisites for Chat Summary became invalid during GENERATING: ${missing}.`, message: 'Prerequisite data error for Chat Summary.' } });
      }
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson, generateChatSummaryFormAction, isGenerateChatSummaryPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (generateChatSummaryState.status === 'idle' || !analysisTriggeredForTickerRef.current) return;
    if (fsmState !== FsmState.GENERATING_CHAT_SUMMARY) {
      logDebug('FSM_PIPELINE', "MainTabContent: Chat Summary Action (generateChatSummaryState) changed, but FSM not in GENERATING_CHAT_SUMMARY. Ignoring.", `Current FSM State: ${fsmState}, Action Status: ${generateChatSummaryState.status}`);
      return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Chat Summary Action state (generateChatSummaryState) changed:", `Status: ${generateChatSummaryState.status}, Message: ${generateChatSummaryState.message}`);
    if (generateChatSummaryState.status === 'success' && generateChatSummaryState.data) {
      toast({ title: "Chat Summary Generated", description: generateChatSummaryState.message || `Chat summary for ${analysisTriggeredForTickerRef.current} generated.` });
      dispatchFsmEvent({ type: 'CHAT_SUMMARY_SUCCESS', payload: generateChatSummaryState.data as GenerateChatSummaryResult });
    } else if (generateChatSummaryState.status === 'error') {
      toast({ variant: "destructive", title: "Chat Summary Error", description: generateChatSummaryState.message || "Failed to generate chat summary." });
      dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: generateChatSummaryState.error, message: generateChatSummaryState.message, requestJson: generateChatSummaryState.data?.requestJson } });
    }
  }, [generateChatSummaryState, fsmState, dispatchFsmEvent, toast, logDebug]);

  useEffect(() => {
    if (chatActionState.status === 'idle' || !analysisTriggeredForTickerRef.current || fsmState !== FsmState.IDLE) return; // Only for interactive chat after pipeline is IDLE
    logDebug('MainTabContent:chatActionState', 'Interactive chat state changed:', `Status: ${chatActionState.status}, Message: ${chatActionState.message}`);
    if (chatActionState.status === 'success' && chatActionState.data?.chatbotResponseJson) {
        try {
            const responseObj = JSON.parse(chatActionState.data.chatbotResponseJson);
            const modelMessage: ChatMessage = { id: Date.now().toString() + '_model', role: 'model', content: responseObj.response || "No response text." };
            dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE' as any, payload: modelMessage }); 
            logDebug('MainTabContent:chatActionState', 'Interactive chat success, added model message.');
        } catch (e) {
            logDebug('MainTabContent:chatActionState', 'Error parsing chatbot response for interactive chat:', e);
            const errorMessage: ChatMessage = { id: Date.now().toString() + '_model_error', role: 'model', content: "Sorry, I had trouble formatting my response." };
            dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE' as any, payload: errorMessage });
        }
    } else if (chatActionState.status === 'error') {
        const errorMessageContent = chatActionState.message || "Sorry, an error occurred with the chat.";
        const errorModelMessage: ChatMessage = { id: Date.now().toString() + '_model_error', role: 'model', content: errorMessageContent };
        dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE' as any, payload: errorModelMessage });
        logDebug('MainTabContent:chatActionState', 'Interactive chat error, added error model message.');
    }
  }, [chatActionState, dispatchFsmEvent, logDebug, fsmState]);


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

  const isDataReadyForCombinedExport =
    isDataReadyForProcessing(contextStockSnapshotJson, undefined, 'MainTabContent:isDataReadyForCombinedExport', 'contextStockSnapshotJson') &&
    isDataReadyForProcessing(contextStandardTasJson, undefined, 'MainTabContent:isDataReadyForCombinedExport', 'contextStandardTasJson') &&
    isDataReadyForProcessing(contextAiAnalyzedTaJson, undefined, 'MainTabContent:isDataReadyForCombinedExport', 'contextAiAnalyzedTaJson') &&
    isDataReadyForProcessing(contextAiKeyTakeawaysJson, undefined, 'MainTabContent:isDataReadyForCombinedExport', 'contextAiKeyTakeawaysJson') &&
    isDataReadyForProcessing(contextAiOptionsAnalysisJson, undefined, 'MainTabContent:isDataReadyForCombinedExport', 'contextAiOptionsAnalysisJson') &&
    isDataReadyForProcessing(contextOptionsChainJson, undefined, 'MainTabContent:isDataReadyForCombinedExport', 'contextOptionsChainJson') &&
    isDataReadyForProcessing(contextMarketStatusJson, undefined, 'MainTabContent:isDataReadyForCombinedExport', 'contextMarketStatusJson');

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

  const activeTickerForChat = (analysisTriggeredForTickerRef.current && (isPipelineActive || isFullAnalysisTriggered)) ? analysisTriggeredForTickerRef.current : tickerInput;

  const isFormDisabled = isPipelineActive;
  const isPartialAnalysisButtonPending = isPipelineActive && !isFullAnalysisTriggered;
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
            isChatPending={isChatPending} 
            currentTicker={activeTickerForChat}
          />
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}

    