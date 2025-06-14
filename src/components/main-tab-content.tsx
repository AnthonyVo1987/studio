
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

import { useStockAnalysis, type ChatMessage, FsmState } from "@/contexts/stock-analysis-context"; 
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
      // Specific checks for critical fields if needed (though general error/status checks are primary)
      if (dataName === 'contextStockSnapshotJson' && parsed.ticker === undefined) {
        logDebugFn?.(callContext, `Data check: Snapshot JSON ('contextStockSnapshotJson') missing 'ticker' field. Considered not ready.`);
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
  } = useStockAnalysis();

  logDebug('FSM_PIPELINE', `MainTabContent RENDER: fsmState=${fsmState}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}, isFullAnalysisTriggered=${isFullAnalysisTriggered}`);
  
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: fsmState EFFECT change detected. New fsmState: ${fsmState}. Current Ticker Ref: ${analysisTriggeredForTickerRef.current}. IsFullAnalysisTriggered: ${isFullAnalysisTriggered}`);
  }, [fsmState, isFullAnalysisTriggered, logDebug]);


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
  
  const isPipelineActive = fsmState !== FsmState.IDLE && fsmState !== FsmState.PARTIAL_ANALYSIS_COMPLETE && fsmState !== FsmState.FULL_ANALYSIS_COMPLETE;

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

  // Effect for AWAITING_DATA_FETCH_TRIGGER -> TRIGGER_DATA_FETCH
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_DATA_FETCH_TRIGGER Effect Check. Current fsmState: ${fsmState}. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER) {
      if (analysisTriggeredForTickerRef.current) {
        dispatchFsmEvent({ type: 'TRIGGER_DATA_FETCH' });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_DATA_FETCH_TRIGGER - Ref is null. Dispatching FETCH_DATA_FAILURE.`);
        dispatchFsmEvent({ type: 'FETCH_DATA_FAILURE', payload: { error: "Internal: Ticker reference lost.", message: "Failed to initiate data fetch." } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // Effect for FETCHING_DATA (calling server action)
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

  // Effect for analyzeStockState change (server action completion for data fetch)
  useEffect(() => {
    if (analyzeStockState.status === 'idle' || !analysisTriggeredForTickerRef.current || fsmState !== FsmState.FETCHING_DATA) { 
      if(fsmState !== FsmState.FETCHING_DATA && analyzeStockState.status !== 'idle') {
         logDebug('FSM_PIPELINE', "MainTabContent: Data Fetch Action (analyzeStockState) changed, but FSM not in FETCHING_DATA. Ignoring.", `Current FSM State: ${fsmState}, Action Status: ${analyzeStockState.status}`);
      }
      return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Data Fetch Action state (analyzeStockState) changed:", `Status: ${analyzeStockState.status}, Message: ${analyzeStockState.message}, CurrentTickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      toast({ title: "Data Fetched", description: analyzeStockState.message || `Data for ${analysisTriggeredForTickerRef.current} fetched.` });
      dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: analyzeStockState.data as StockDataFetchResult });
    } else if (analyzeStockState.status === 'error') {
      toast({ variant: "destructive", title: "Data Fetch Error", description: analyzeStockState.message || "Failed to fetch data." });
      dispatchFsmEvent({ type: 'FETCH_DATA_FAILURE', payload: { error: analyzeStockState.error, message: analyzeStockState.message, polygonApiRequestLogJson: analyzeStockState.data?.polygonApiRequestLogJson, polygonApiResponseLogJson: analyzeStockState.data?.polygonApiResponseLogJson }});
    }
  }, [analyzeStockState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  // Effect to progress from DATA_FETCH_SUCCEEDED
  useEffect(() => {
    if (fsmState === FsmState.DATA_FETCH_SUCCEEDED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected DATA_FETCH_SUCCEEDED. Dispatching PROCEED_TO_AI_TA_SETUP.`);
      dispatchFsmEvent({ type: 'PROCEED_TO_AI_TA_SETUP' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // Effect for AWAITING_AI_TA_TRIGGER -> TRIGGER_AI_TA
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AI_TA AWAITING Effect Check. Current fsmState: ${fsmState}. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.AWAITING_AI_TA_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_AI_TA_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}. Snapshot: '${contextStockSnapshotJson?.substring(0,50)}...'`);
      if (analysisTriggeredForTickerRef.current) {
        const snapshotIsValid = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_AI_TA_TRIGGER', 'contextStockSnapshotJson');
        if (snapshotIsValid) {
          dispatchFsmEvent({ type: 'TRIGGER_AI_TA' });
        } else {
          dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: `Prerequisite stock snapshot data not ready/invalid for AI TA. Snapshot: ${contextStockSnapshotJson?.substring(0,100)}...`, message: 'Prerequisite stock data error for AI TA.' } });
        }
      } else {
        dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: 'Internal error: Ticker reference lost for AI TA.', message: 'Internal error for AI TA.' } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug]); // ONLY fsmState, dispatch, logDebug (contextStockSnapshotJson is read inside)

  // Effect for ANALYZING_TA (calling server action)
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

  // Effect for analyzeTaState change
  useEffect(() => {
    if (analyzeTaState.status === 'idle' || !analysisTriggeredForTickerRef.current || fsmState !== FsmState.ANALYZING_TA) {
      if(fsmState !== FsmState.ANALYZING_TA && analyzeTaState.status !== 'idle') {
         logDebug('FSM_PIPELINE', "MainTabContent: AI TA Action (analyzeTaState) changed, but FSM not in ANALYZING_TA. Ignoring.", `Current FSM State: ${fsmState}, Action Status: ${analyzeTaState.status}`);
      }
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
  
  // Effect to progress from AI_TA_SUCCEEDED or AI_TA_FAILED
  useEffect(() => {
    if (fsmState === FsmState.AI_TA_SUCCEEDED || fsmState === FsmState.AI_TA_FAILED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. isFullAnalysisTriggered: ${isFullAnalysisTriggered}.`);
      if (isFullAnalysisTriggered) {
        logDebug('FSM_PIPELINE', `MainTabContent: ${fsmState} (Full Analysis). Dispatching PROCEED_TO_KEY_TAKEAWAYS_SETUP.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_KEY_TAKEAWAYS_SETUP' });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: ${fsmState} (Partial Analysis). Dispatching PROCEED_TO_PARTIAL_COMPLETE.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_PARTIAL_COMPLETE' });
      }
    }
  }, [fsmState, isFullAnalysisTriggered, dispatchFsmEvent, logDebug]);

  // Effect for AWAITING_KEY_TAKEAWAYS_TRIGGER
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Key_Takeaways AWAITING Effect Check. Current fsmState: ${fsmState}.`);
    if (fsmState === FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_KEY_TAKEAWAYS_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}. FullAnalysis: ${isFullAnalysisTriggered}.`);
      if (isFullAnalysisTriggered && analysisTriggeredForTickerRef.current) {
        const prereqs = {
          snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_KT', 'contextStockSnapshotJson'),
          stdTAs: isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:AWAITING_KT', 'contextStandardTasJson'),
          aiTA: isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:AWAITING_KT', 'contextAiAnalyzedTaJson'),
          market: isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:AWAITING_KT', 'contextMarketStatusJson'),
        };
        if (prereqs.snapshot && prereqs.stdTAs && prereqs.aiTA && prereqs.market) {
          dispatchFsmEvent({ type: 'TRIGGER_KEY_TAKEAWAYS' });
        } else {
          const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', ');
          dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: `Missing/invalid prerequisites for Key Takeaways: ${missing}.`, message: 'Prerequisite data error for Key Takeaways.' } });
        }
      } else if (!isFullAnalysisTriggered) { /* Should not reach here if previous effect is correct */ } 
      else { /* Ticker ref missing */
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: 'Ticker reference missing for Key Takeaways.', message: 'Internal error.' } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug]); // ONLY fsmState and stable functions

  // Effect for GENERATING_KEY_TAKEAWAYS
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_KEY_TAKEAWAYS Effect Check. Current fsmState: ${fsmState}. isPerformAiAnalysisPending: ${isPerformAiAnalysisPending}. Ticker: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.GENERATING_KEY_TAKEAWAYS && analysisTriggeredForTickerRef.current && !isPerformAiAnalysisPending) {
      const currentTicker = analysisTriggeredForTickerRef.current;
      if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:GEN_KT', 'contextStockSnapshotJson') &&
          isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:GEN_KT', 'contextStandardTasJson') &&
          isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:GEN_KT', 'contextAiAnalyzedTaJson') &&
          isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:GEN_KT', 'contextMarketStatusJson')) {
        const payload = { ticker: currentTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, marketStatusJson: contextMarketStatusJson! };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiAnalysisFormAction (Key Takeaways) for ${currentTicker}.`);
        startTransition(() => { performAiAnalysisFormAction(payload); });
      } else {
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: `Prerequisites for Key Takeaways became invalid during GENERATING.`, message: 'Prerequisite data error for Key Takeaways.' } });
      }
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, performAiAnalysisFormAction, isPerformAiAnalysisPending, dispatchFsmEvent, logDebug]);

  // Effect for performAiAnalysisState change (Key Takeaways completion)
  useEffect(() => {
    if (performAiAnalysisState.status === 'idle' || !analysisTriggeredForTickerRef.current || fsmState !== FsmState.GENERATING_KEY_TAKEAWAYS) { return; }
    logDebug('FSM_PIPELINE', "MainTabContent: Key Takeaways Action state (performAiAnalysisState) changed:", `Status: ${performAiAnalysisState.status}, Message: ${performAiAnalysisState.message}`);
    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Complete", description: performAiAnalysisState.message || `Key Takeaways for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: performAiAnalysisState.data as PerformAiAnalysisResult });
    } else if (performAiAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Key Takeaways Error", description: performAiAnalysisState.message || "Failed to generate Key Takeaways." });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: performAiAnalysisState.error, message: performAiAnalysisState.message, aiKeyTakeawaysRequestJson: performAiAnalysisState.data?.aiKeyTakeawaysRequestJson } });
    }
  }, [performAiAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  // Effect to progress from KEY_TAKEAWAYS_SUCCEEDED or FAILED
  useEffect(() => {
    if (fsmState === FsmState.KEY_TAKEAWAYS_SUCCEEDED || fsmState === FsmState.KEY_TAKEAWAYS_FAILED) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. Dispatching PROCEED_TO_OPTIONS_ANALYSIS_SETUP.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_OPTIONS_ANALYSIS_SETUP' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // Effect for AWAITING_OPTIONS_ANALYSIS_TRIGGER
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Options_Analysis AWAITING Effect Check. Current fsmState: ${fsmState}.`);
    if (fsmState === FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_OPTIONS_ANALYSIS_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}.`);
      if (analysisTriggeredForTickerRef.current) {
        const optionsChainIsValid = isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'MainTabContent:AWAITING_OPT', 'contextOptionsChainJson');
        const snapshotIsValid = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_OPT', 'contextStockSnapshotJson');
        if (optionsChainIsValid && snapshotIsValid) {
          dispatchFsmEvent({ type: 'TRIGGER_OPTIONS_ANALYSIS' });
        } else {
          dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: `Prerequisites not ready for Options Analysis. OptionsChain: ${optionsChainIsValid}, Snapshot: ${snapshotIsValid}`, message: 'Prerequisite data error for Options Analysis.' } });
        }
      } else {
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: 'Ticker reference missing for Options Analysis.', message: 'Internal error.' } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug]); // ONLY fsmState and stable functions

  // Effect for ANALYZING_OPTIONS
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_OPTIONS Effect Check. Current fsmState: ${fsmState}. isPerformAiOptionsAnalysisPending: ${isPerformAiOptionsAnalysisPending}. Ticker: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.ANALYZING_OPTIONS && analysisTriggeredForTickerRef.current && !isPerformAiOptionsAnalysisPending) {
      const currentTicker = analysisTriggeredForTickerRef.current;
      if (isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'MainTabContent:ANALYZING_OPT', 'contextOptionsChainJson') &&
          isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:ANALYZING_OPT', 'contextStockSnapshotJson')) {
        const payload = { ticker: currentTicker, optionsChainJson: contextOptionsChainJson!, stockSnapshotJson: contextStockSnapshotJson! };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiOptionsAnalysisFormAction for ${currentTicker}.`);
        startTransition(() => { performAiOptionsAnalysisFormAction(payload); });
      } else {
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: `Prerequisites for Options Analysis became invalid during ANALYZING.`, message: 'Prerequisite data error for Options Analysis.' } });
      }
    }
  }, [fsmState, contextOptionsChainJson, contextStockSnapshotJson, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending, dispatchFsmEvent, logDebug]);

  // Effect for performAiOptionsAnalysisState change
  useEffect(() => {
    if (performAiOptionsAnalysisState.status === 'idle' || !analysisTriggeredForTickerRef.current || fsmState !== FsmState.ANALYZING_OPTIONS) { return; }
    logDebug('FSM_PIPELINE', "MainTabContent: Options Analysis Action state (performAiOptionsAnalysisState) changed:", `Status: ${performAiOptionsAnalysisState.status}, Message: ${performAiOptionsAnalysisState.message}`);
    if (performAiOptionsAnalysisState.status === 'success' && performAiOptionsAnalysisState.data) {
      toast({ title: "AI Options Analysis Complete", description: performAiOptionsAnalysisState.message || `Options Analysis for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: performAiOptionsAnalysisState.data as PerformAiOptionsAnalysisResult });
    } else if (performAiOptionsAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Options Analysis Error", description: performAiOptionsAnalysisState.message || "Failed to generate Options Analysis." });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: performAiOptionsAnalysisState.error, message: performAiOptionsAnalysisState.message, aiOptionsAnalysisRequestJson: performAiOptionsAnalysisState.data?.aiOptionsAnalysisRequestJson } });
    }
  }, [performAiOptionsAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  // Effect to progress from OPTIONS_ANALYSIS_SUCCEEDED or FAILED
  useEffect(() => {
    if (fsmState === FsmState.OPTIONS_ANALYSIS_SUCCEEDED || fsmState === FsmState.OPTIONS_ANALYSIS_FAILED) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. Dispatching PROCEED_TO_CHAT_SUMMARY_SETUP.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_CHAT_SUMMARY_SETUP' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // Effect for AWAITING_CHAT_SUMMARY_TRIGGER
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Chat_Summary AWAITING Effect Check. Current fsmState: ${fsmState}.`);
    if (fsmState === FsmState.AWAITING_CHAT_SUMMARY_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_CHAT_SUMMARY_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}.`);
      if (analysisTriggeredForTickerRef.current) {
        const allPrereqsValid = 
            isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_CHAT', 'contextStockSnapshotJson') &&
            isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:AWAITING_CHAT', 'contextStandardTasJson') &&
            isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:AWAITING_CHAT', 'contextAiAnalyzedTaJson') &&
            isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, 'MainTabContent:AWAITING_CHAT', 'contextAiKeyTakeawaysJson') &&
            isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, 'MainTabContent:AWAITING_CHAT', 'contextAiOptionsAnalysisJson') &&
            isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:AWAITING_CHAT', 'contextMarketStatusJson');
        if (allPrereqsValid) {
          dispatchFsmEvent({ type: 'TRIGGER_CHAT_SUMMARY' });
        } else {
          dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: `Prerequisites not ready for Chat Summary.`, message: 'Prerequisite data error for Chat Summary.' } });
        }
      } else {
        dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: 'Ticker reference missing for chat summary.', message: 'Internal error.' } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug]); // ONLY fsmState and stable functions

  // Effect for GENERATING_CHAT_SUMMARY
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_CHAT_SUMMARY Effect Check. Current fsmState: ${fsmState}. isGenerateChatSummaryPending: ${isGenerateChatSummaryPending}. Ticker: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.GENERATING_CHAT_SUMMARY && analysisTriggeredForTickerRef.current && !isGenerateChatSummaryPending) {
      const currentTicker = analysisTriggeredForTickerRef.current;
      if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:GEN_CHAT', 'contextStockSnapshotJson') &&
          isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:GEN_CHAT', 'contextStandardTasJson') &&
          isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:GEN_CHAT', 'contextAiAnalyzedTaJson') &&
          isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, 'MainTabContent:GEN_CHAT', 'contextAiKeyTakeawaysJson') &&
          isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, 'MainTabContent:GEN_CHAT', 'contextAiOptionsAnalysisJson') &&
          isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:GEN_CHAT', 'contextMarketStatusJson')) {
        const payload: GenerateChatSummaryActionInputs = { ticker: currentTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, aiKeyTakeawaysJson: contextAiKeyTakeawaysJson!, aiOptionsAnalysisJson: contextAiOptionsAnalysisJson!, marketStatusJson: contextMarketStatusJson! };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling generateChatSummaryFormAction for ${currentTicker}.`);
        startTransition(() => { generateChatSummaryFormAction(payload); });
      } else {
        dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: `Prerequisites for Chat Summary became invalid during GENERATING.`, message: 'Prerequisite data error for Chat Summary.' } });
      }
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson, generateChatSummaryFormAction, isGenerateChatSummaryPending, dispatchFsmEvent, logDebug]);

  // Effect for generateChatSummaryState change
  useEffect(() => {
    if (generateChatSummaryState.status === 'idle' || !analysisTriggeredForTickerRef.current || fsmState !== FsmState.GENERATING_CHAT_SUMMARY) { return; }
    logDebug('FSM_PIPELINE', "MainTabContent: Chat Summary Action state (generateChatSummaryState) changed:", `Status: ${generateChatSummaryState.status}, Message: ${generateChatSummaryState.message}`);
    if (generateChatSummaryState.status === 'success' && generateChatSummaryState.data) {
      toast({ title: "Chat Summary Generated", description: generateChatSummaryState.message || `Chat summary for ${analysisTriggeredForTickerRef.current} generated.` });
      dispatchFsmEvent({ type: 'CHAT_SUMMARY_SUCCESS', payload: generateChatSummaryState.data as GenerateChatSummaryResult });
    } else if (generateChatSummaryState.status === 'error') {
      toast({ variant: "destructive", title: "Chat Summary Error", description: generateChatSummaryState.message || "Failed to generate chat summary." });
      dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: generateChatSummaryState.error, message: generateChatSummaryState.message, requestJson: generateChatSummaryState.data?.requestJson } });
    }
  }, [generateChatSummaryState, fsmState, dispatchFsmEvent, toast, logDebug]);

  // Effect to progress from CHAT_SUMMARY_SUCCEEDED or FAILED
  useEffect(() => {
    if (fsmState === FsmState.CHAT_SUMMARY_SUCCEEDED || fsmState === FsmState.CHAT_SUMMARY_FAILED) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. Dispatching PROCEED_TO_FULL_COMPLETE.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_FULL_COMPLETE' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // Effect to progress from PARTIAL_ANALYSIS_COMPLETE or FULL_ANALYSIS_COMPLETE to IDLE
  useEffect(() => {
    if (fsmState === FsmState.PARTIAL_ANALYSIS_COMPLETE || fsmState === FsmState.FULL_ANALYSIS_COMPLETE) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. Dispatching PROCEED_TO_IDLE.`);
      dispatchFsmEvent({ type: 'PROCEED_TO_IDLE' as any }); // Cast if 'PROCEED_TO_IDLE' not in FsmEvent yet
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);


  // Effect for interactive chat action completion
  useEffect(() => {
    if (chatActionState.status === 'idle' || !analysisTriggeredForTickerRef.current || fsmState !== FsmState.IDLE) { 
      if(fsmState !== FsmState.IDLE && chatActionState.status !== 'idle') {
          logDebug('MainTabContent:chatActionState', 'Interactive chat state changed, but FSM not IDLE. Ignoring for now.', `FSM: ${fsmState}, ChatAction: ${chatActionState.status}`);
      }
      return;
    } 
    logDebug('MainTabContent:chatActionState', 'Interactive chat state changed while FSM is IDLE:', `Status: ${chatActionState.status}, Message: ${chatActionState.message}`);
    if (chatActionState.status === 'success' && chatActionState.data?.chatbotResponseJson) {
        try {
            const responseObj = JSON.parse(chatActionState.data.chatbotResponseJson);
            const modelMessage: ChatMessage = { id: Date.now().toString() + '_model', role: 'model', content: responseObj.response || "No response text." };
            dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE' as any, payload: modelMessage }); 
            logDebug('MainTabContent:chatActionState', 'Interactive chat success, added model message to context.');
        } catch (e) {
            logDebug('MainTabContent:chatActionState', 'Error parsing chatbot response for interactive chat:', e);
            const errorMessage: ChatMessage = { id: Date.now().toString() + '_model_error', role: 'model', content: "Sorry, I had trouble formatting my response." };
            dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE' as any, payload: errorMessage }); 
        }
    } else if (chatActionState.status === 'error') {
        const errorMessageContent = chatActionState.message || "Sorry, an error occurred with the chat.";
        const errorModelMessage: ChatMessage = { id: Date.now().toString() + '_model_error', role: 'model', content: errorMessageContent };
        dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE' as any, payload: errorModelMessage }); 
        logDebug('MainTabContent:chatActionState', 'Interactive chat error, added error model message to context.');
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
    isDataReadyForProcessing(contextStockSnapshotJson) &&
    isDataReadyForProcessing(contextStandardTasJson) &&
    isDataReadyForProcessing(contextAiAnalyzedTaJson) &&
    isDataReadyForProcessing(contextAiKeyTakeawaysJson) &&
    isDataReadyForProcessing(contextAiOptionsAnalysisJson) &&
    isDataReadyForProcessing(contextOptionsChainJson) &&
    isDataReadyForProcessing(contextMarketStatusJson);

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
          Enter a stock ticker and select a data source to begin your analysis. FSM: {fsmState}
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
              Analyze Stock (Partial)
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
    