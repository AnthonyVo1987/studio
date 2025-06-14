
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
    // Context JSON states
    marketStatusJson: contextMarketStatusJson,
    stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson,
    optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson,
    aiKeyTakeawaysJson: contextAiKeyTakeawaysJson,
    aiOptionsAnalysisJson: contextAiOptionsAnalysisJson,
    // FSM related states and functions
    isFullAnalysisTriggered,
    logDebug,
    fsmState,
    dispatchFsmEvent,
  } = useStockAnalysis();
  
  // Log FSM state on every render for debugging
  logDebug('FSM_PIPELINE', `MainTabContent RENDER: fsmState=${fsmState}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}, isFullAnalysisTriggered=${isFullAnalysisTriggered}`);

  // Log specific FSM state changes
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: fsmState EFFECT change detected. New fsmState: ${fsmState}. Current Ticker Ref: ${analysisTriggeredForTickerRef.current}. IsFullAnalysisTriggered: ${isFullAnalysisTriggered}`);
  }, [fsmState, isFullAnalysisTriggered, logDebug]);

  // Server action states
  const [analyzeStockState, analyzeStockFormAction, isAnalyzeStockPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(fetchStockDataAction, initialStockDataFetchState);
  const [analyzeTaState, analyzeTaFormAction, isAnalyzeTaPending] = useActionState<AnalyzeTaActionState, { stockSnapshotJson: string, ticker?: string }>(analyzeTaAction, initialAnalyzeTaState);
  const [performAiAnalysisState, performAiAnalysisFormAction, isPerformAiAnalysisPending] = useActionState<PerformAiAnalysisActionState, PerformAiAnalysisActionInputs>(performAiAnalysisAction, initialPerformAiAnalysisState);
  const [performAiOptionsAnalysisState, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending] = useActionState<PerformAiOptionsAnalysisActionState, PerformAiOptionsAnalysisActionInputsType>(performAiOptionsAnalysisAction, initialPerformAiOptionsAnalysisState);
  const [generateChatSummaryState, generateChatSummaryFormAction, isGenerateChatSummaryPending] = useActionState<GenerateChatSummaryActionState, GenerateChatSummaryActionInputs>(generateChatSummaryAction, initialGenerateChatSummaryState);
  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(chatServerAction, initialChatActionState);
  
  const isPipelineActive = fsmState !== FsmState.IDLE && fsmState !== FsmState.PARTIAL_ANALYSIS_COMPLETE && fsmState !== FsmState.FULL_ANALYSIS_COMPLETE;

  // Handlers for analysis buttons
  const handleStandardAnalysisSubmit = useCallback((event?: FormEvent<HTMLFormElement>) => { // Renamed for clarity
    event?.preventDefault();
    logDebug('MainTabContent', `Standard "Analyze Stock" button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    if (isPipelineActive) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" });
      return;
    }
    analysisTriggeredForTickerRef.current = tickerInput; 
    dispatchFsmEvent({ type: 'START_PARTIAL_ANALYSIS', payload: { ticker: tickerInput } }); // This will set isFullAnalysisTriggered to false in reducer
  }, [fsmState, toast, tickerInput, dispatchFsmEvent, logDebug, isPipelineActive]);

  const handleAiFullAnalysisSubmit = useCallback(() => {
    logDebug('MainTabContent', `"AI Full Stock Analysis" button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    if (isPipelineActive) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" });
      return;
    }
    analysisTriggeredForTickerRef.current = tickerInput; 
    dispatchFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: tickerInput } }); // This will set isFullAnalysisTriggered to true in reducer
  }, [fsmState, toast, tickerInput, dispatchFsmEvent, logDebug, isPipelineActive]);

  // --- FSM Progression useEffect Hooks ---

  // 1. Initializing -> Awaiting Data Fetch Trigger
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_DATA_FETCH_TRIGGER Effect Check. Current fsmState: ${fsmState}. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER) {
      if (analysisTriggeredForTickerRef.current) {
        dispatchFsmEvent({ type: 'TRIGGER_DATA_FETCH' });
      } else {
        dispatchFsmEvent({ type: 'FETCH_DATA_FAILURE', payload: { error: "Internal: Ticker reference lost at AWAITING_DATA_FETCH_TRIGGER.", message: "Failed to initiate data fetch." } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // 2. Fetching Data (Calling Server Action)
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: FETCHING_DATA Effect Check. Current fsmState: ${fsmState}. isAnalyzeStockPending: ${isAnalyzeStockPending}. Ticker: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.FETCHING_DATA && analysisTriggeredForTickerRef.current && !isAnalyzeStockPending) {
      const payload = { ticker: analysisTriggeredForTickerRef.current! };
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in FETCHING_DATA for ${analysisTriggeredForTickerRef.current}. Calling analyzeStockFormAction.`);
      startTransition(() => { analyzeStockFormAction(payload); });
    }
  }, [fsmState, analyzeStockFormAction, isAnalyzeStockPending, dispatchFsmEvent, logDebug]);

  // 3. Handling Data Fetch Result (Success/Failure)
  useEffect(() => {
    if (!analysisTriggeredForTickerRef.current && analyzeStockState.status !== 'idle') { return; }
    if (analyzeStockState.status === 'idle' || fsmState !== FsmState.FETCHING_DATA) { 
      if (analyzeStockState.status !== 'idle') logDebug('FSM_PIPELINE', `MainTabContent: Data Fetch Action state changed, but FSM not in FETCHING_DATA. Ignoring. State: ${fsmState}, Action: ${analyzeStockState.status}`);
      return; 
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Data Fetch Action state (analyzeStockState) changed:", `Status: ${analyzeStockState.status}`);
    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      toast({ title: "Data Fetched", description: analyzeStockState.message || `Data for ${analysisTriggeredForTickerRef.current} fetched.` });
      dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: analyzeStockState.data as StockDataFetchResult });
    } else if (analyzeStockState.status === 'error') {
      toast({ variant: "destructive", title: "Data Fetch Error", description: analyzeStockState.message || "Failed to fetch data." });
      dispatchFsmEvent({ type: 'FETCH_DATA_FAILURE', payload: { error: analyzeStockState.error, message: analyzeStockState.message, polygonApiRequestLogJson: analyzeStockState.data?.polygonApiRequestLogJson, polygonApiResponseLogJson: analyzeStockState.data?.polygonApiResponseLogJson }});
    }
  }, [analyzeStockState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  // 4. Data Fetch Succeeded -> Proceed to AI TA Setup (Reducer handles this now)
  useEffect(() => {
    if (fsmState === FsmState.DATA_FETCH_SUCCEEDED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected DATA_FETCH_SUCCEEDED. Dispatching PROCEED_TO_AI_TA_SETUP.`);
      dispatchFsmEvent({ type: 'PROCEED_TO_AI_TA_SETUP' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // 5. Awaiting AI TA Trigger -> Trigger AI TA
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AI_TA AWAITING Effect Check. Current fsmState: ${fsmState}.`);
    if (fsmState === FsmState.AWAITING_AI_TA_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_AI_TA_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}. Snapshot: '${contextStockSnapshotJson?.substring(0,50)}...'`);
      if (analysisTriggeredForTickerRef.current) {
        const snapshotIsValid = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_AI_TA_TRIGGER_CHECK', 'contextStockSnapshotJson');
        if (snapshotIsValid) {
          dispatchFsmEvent({ type: 'TRIGGER_AI_TA' });
        } else {
          dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: `Snapshot not ready for AI TA. Current Snapshot: ${contextStockSnapshotJson?.substring(0,100)}`, message: 'Prerequisite stock data error for AI TA.' } });
        }
      } else { 
        dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: 'Ticker reference missing for AI TA.', message: 'Internal error: Ticker ref missing.' } });
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug]); // Removed contextStockSnapshotJson

  // 6. Analyzing TA (Calling Server Action)
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_TA Effect Check. Current fsmState: ${fsmState}. isAnalyzeTaPending: ${isAnalyzeTaPending}. Ticker: ${analysisTriggeredForTickerRef.current}. Snapshot: ${contextStockSnapshotJson?.substring(0,30)}...`);
    if (fsmState === FsmState.ANALYZING_TA && analysisTriggeredForTickerRef.current && !isAnalyzeTaPending) {
      if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:ANALYZING_TA_CHECK', 'contextStockSnapshotJson')) {
        const payload = { stockSnapshotJson: contextStockSnapshotJson!, ticker: analysisTriggeredForTickerRef.current };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling analyzeTaFormAction for ${analysisTriggeredForTickerRef.current}.`);
        startTransition(() => { analyzeTaFormAction(payload); });
      } else { 
        dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: `Snapshot became invalid during ANALYZING_TA. Snapshot: '${contextStockSnapshotJson?.substring(0,100)}...'`, message: 'Prerequisite stock data error for AI TA.' } });
      }
    }
  }, [fsmState, contextStockSnapshotJson, analyzeTaFormAction, isAnalyzeTaPending, dispatchFsmEvent, logDebug]);

  // 7. Handling AI TA Result
  useEffect(() => {
    if (!analysisTriggeredForTickerRef.current && analyzeTaState.status !== 'idle') { return; }
    if (analyzeTaState.status === 'idle' || fsmState !== FsmState.ANALYZING_TA) { 
      if (analyzeTaState.status !== 'idle') logDebug('FSM_PIPELINE', `MainTabContent: AI TA Action state changed, but FSM not in ANALYZING_TA. Ignoring. State: ${fsmState}, Action: ${analyzeTaState.status}`);
      return; 
    }
    logDebug('FSM_PIPELINE', "MainTabContent: AI TA Action state (analyzeTaState) changed:", `Status: ${analyzeTaState.status}`);
    if (analyzeTaState.status === 'success' && analyzeTaState.data) {
      toast({ title: "AI TA Complete", description: analyzeTaState.message || `AI TA for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'AI_TA_SUCCESS', payload: analyzeTaState.data as AnalyzeTaResult });
    } else if (analyzeTaState.status === 'error') {
      toast({ variant: "destructive", title: "AI TA Error", description: analyzeTaState.message || "Failed to perform AI TA." });
      dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: analyzeTaState.error, message: analyzeTaState.message, aiAnalyzedTaRequestJson: analyzeTaState.data?.aiAnalyzedTaRequestJson } });
    }
  }, [analyzeTaState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  // 8. AI TA Succeeded/Failed -> Proceed to Key Takeaways Setup (Reducer handles this now)
  useEffect(() => {
    if (fsmState === FsmState.AI_TA_SUCCEEDED || fsmState === FsmState.AI_TA_FAILED) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} for AI TA. Dispatching PROCEED_TO_KEY_TAKEAWAYS_SETUP.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_KEY_TAKEAWAYS_SETUP' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);


  // 9. Awaiting Key Takeaways Trigger
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Key_Takeaways AWAITING Effect Check. Current fsmState: ${fsmState}.`);
    if (fsmState === FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_KEY_TAKEAWAYS_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}.`);
      if (analysisTriggeredForTickerRef.current) {
        const prereqs = {
          snap: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAIT_KT_CHECK', 'contextStockSnapshotJson'),
          stdTA: isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:AWAIT_KT_CHECK', 'contextStandardTasJson'),
          aiTA: isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:AWAIT_KT_CHECK', 'contextAiAnalyzedTaJson'),
          market: isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:AWAIT_KT_CHECK', 'contextMarketStatusJson'),
        };
        if (prereqs.snap && prereqs.stdTA && prereqs.aiTA && prereqs.market) {
          dispatchFsmEvent({ type: 'TRIGGER_KEY_TAKEAWAYS' });
        } else { 
          const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', '); 
          dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: `Missing/invalid prerequisites for Key Takeaways: ${missing}. Snapshot: ${contextStockSnapshotJson?.substring(0,50)}, StdTA: ${contextStandardTasJson?.substring(0,50)}, AITA: ${contextAiAnalyzedTaJson?.substring(0,50)}, Market: ${contextMarketStatusJson?.substring(0,50)}`, message: 'Prerequisite data error for Key Takeaways.' } });
        }
      } else { dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: 'Ticker reference missing for Key Takeaways.', message: 'Internal error.' } });}
    }
  }, [fsmState, dispatchFsmEvent, logDebug]); // Removed context data dependencies

  // 10. Generating Key Takeaways (Calling Server Action)
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_KEY_TAKEAWAYS Effect Check. Current fsmState: ${fsmState}. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.GENERATING_KEY_TAKEAWAYS && analysisTriggeredForTickerRef.current && !isPerformAiAnalysisPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      logDebug('FSM_PIPELINE', `MainTabContent: Processing GENERATING_KEY_TAKEAWAYS for ${currentActionTicker}. Validating data consistency.`);

      let snapshotDataFromContext: StockSnapshotData | null = null;
      let isSnapshotConsistentAndReady = false;
      try {
        if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:GEN_KT_CONSISTENCY_CHECK', 'contextStockSnapshotJson')) {
          snapshotDataFromContext = JSON.parse(contextStockSnapshotJson!);
          if (snapshotDataFromContext?.ticker === currentActionTicker) {
            isSnapshotConsistentAndReady = true;
          } else {
            logDebug('FSM_PIPELINE', `MainTabContent: GEN_KT - DATA INCONSISTENCY! Action: ${currentActionTicker}, Snapshot: ${snapshotDataFromContext?.ticker}. Effect will re-run.`);
            return; 
          }
        } else {
           logDebug('FSM_PIPELINE', `MainTabContent: GEN_KT - Snapshot data for ${currentActionTicker} not ready. Effect will re-run.`); return;
        }
      } catch (e) { logDebug('FSM_PIPELINE', `MainTabContent: GEN_KT - Error parsing snapshot for ${currentActionTicker}.`, e); return; }
      
      const stdTasIsValid = isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:GEN_KT_PREREQ_CHECK', 'contextStandardTasJson');
      const aiTaIsValid = isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:GEN_KT_PREREQ_CHECK', 'contextAiAnalyzedTaJson');
      const marketIsValid = isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:GEN_KT_PREREQ_CHECK', 'contextMarketStatusJson');

      if (isSnapshotConsistentAndReady && stdTasIsValid && aiTaIsValid && marketIsValid) {
        const payload: PerformAiAnalysisActionInputs = { ticker: currentActionTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, marketStatusJson: contextMarketStatusJson! };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiAnalysisFormAction (Key Takeaways) for ${currentActionTicker}.`);
        startTransition(() => { performAiAnalysisFormAction(payload); });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: GEN_KT - Other prereqs not ready for ${currentActionTicker}. StdTA: ${stdTasIsValid}, AITA: ${aiTaIsValid}, Market: ${marketIsValid}. Effect will re-run.`);
      }
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, performAiAnalysisFormAction, isPerformAiAnalysisPending, dispatchFsmEvent, logDebug]);

  // 11. Handling Key Takeaways Result
  useEffect(() => {
     if (!analysisTriggeredForTickerRef.current && performAiAnalysisState.status !== 'idle') { return; }
    if (performAiAnalysisState.status === 'idle' || fsmState !== FsmState.GENERATING_KEY_TAKEAWAYS) { 
      if (performAiAnalysisState.status !== 'idle') logDebug('FSM_PIPELINE', `MainTabContent: Key Takeaways Action state changed, but FSM not in GENERATING_KEY_TAKEAWAYS. Ignoring. State: ${fsmState}`);
      return; 
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Key Takeaways Action state changed:", `Status: ${performAiAnalysisState.status}`);
    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Complete", description: performAiAnalysisState.message || `Key Takeaways for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: performAiAnalysisState.data as PerformAiAnalysisResult });
    } else if (performAiAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Key Takeaways Error", description: performAiAnalysisState.message || "Failed to generate Key Takeaways." });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: performAiAnalysisState.error, message: performAiAnalysisState.message, aiKeyTakeawaysRequestJson: performAiAnalysisState.data?.aiKeyTakeawaysRequestJson } });
    }
  }, [performAiAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  // 12. Key Takeaways Succeeded/Failed -> Proceed to Options Analysis Setup (Reducer handles this now)
  useEffect(() => {
    if (fsmState === FsmState.KEY_TAKEAWAYS_SUCCEEDED || fsmState === FsmState.KEY_TAKEAWAYS_FAILED) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} for Key Takeaways. Dispatching PROCEED_TO_OPTIONS_ANALYSIS_SETUP.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_OPTIONS_ANALYSIS_SETUP' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // 13. Awaiting Options Analysis Trigger
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Options_Analysis AWAITING Effect Check. Current fsmState: ${fsmState}.`);
    if (fsmState === FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_OPTIONS_ANALYSIS_TRIGGER for ${analysisTriggeredForTickerRef.current}.`);
      if (analysisTriggeredForTickerRef.current) {
        const prereqs = { options: isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'MainTabContent:AWAIT_OPT_CHECK', 'contextOptionsChainJson'), snap: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAIT_OPT_CHECK', 'contextStockSnapshotJson') };
        if (prereqs.options && prereqs.snap) {
          dispatchFsmEvent({ type: 'TRIGGER_OPTIONS_ANALYSIS' });
        } else { 
          const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', '); 
          dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: `Missing/invalid prerequisites for Options Analysis: ${missing}. Options: ${contextOptionsChainJson?.substring(0,50)}, Snapshot: ${contextStockSnapshotJson?.substring(0,50)}`, message: 'Prerequisite data error for Options Analysis.' } });
        }
      } else { dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: 'Ticker reference missing for Options Analysis.', message: 'Internal error.' } });}
    }
  }, [fsmState, dispatchFsmEvent, logDebug]); // Removed context data dependencies

  // 14. Analyzing Options (Calling Server Action)
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_OPTIONS Effect Check. Current fsmState: ${fsmState}. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.ANALYZING_OPTIONS && analysisTriggeredForTickerRef.current && !isPerformAiOptionsAnalysisPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      logDebug('FSM_PIPELINE', `MainTabContent: Processing ANALYZING_OPTIONS for ${currentActionTicker}. Validating data consistency.`);
      
      let snapshotDataFromContext: StockSnapshotData | null = null;
      let isSnapshotConsistentAndReady = false;
      try {
        if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:GEN_OPT_CONSISTENCY_CHECK', 'contextStockSnapshotJson')) {
          snapshotDataFromContext = JSON.parse(contextStockSnapshotJson!);
          if (snapshotDataFromContext?.ticker === currentActionTicker) {
            isSnapshotConsistentAndReady = true;
          } else { logDebug('FSM_PIPELINE', `MainTabContent: GEN_OPT - DATA INCONSISTENCY! Action: ${currentActionTicker}, Snapshot: ${snapshotDataFromContext?.ticker}. Effect will re-run.`); return; }
        } else { logDebug('FSM_PIPELINE', `MainTabContent: GEN_OPT - Snapshot data for ${currentActionTicker} not ready. Effect will re-run.`); return; }
      } catch (e) { logDebug('FSM_PIPELINE', `MainTabContent: GEN_OPT - Error parsing snapshot for ${currentActionTicker}.`, e); return; }

      if (!isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'MainTabContent:ANALYZING_OPT_PREREQ_CHECK', 'contextOptionsChainJson')) {
        logDebug('FSM_PIPELINE', `MainTabContent: GEN_OPT - Options Chain data NOT YET READY for ${currentActionTicker}. Effect will re-run.`); return;
      }
      
      if (isSnapshotConsistentAndReady) { // Options chain readiness checked above
        const payload: PerformAiOptionsAnalysisActionInputsType = { ticker: currentActionTicker, optionsChainJson: contextOptionsChainJson!, stockSnapshotJson: contextStockSnapshotJson! };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiOptionsAnalysisFormAction for ${currentActionTicker}.`);
        startTransition(() => { performAiOptionsAnalysisFormAction(payload); });
      }
      // No explicit failure dispatch here, rely on data dependency re-run
    }
  }, [fsmState, contextOptionsChainJson, contextStockSnapshotJson, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending, dispatchFsmEvent, logDebug]);

  // 15. Handling Options Analysis Result
  useEffect(() => {
    if (!analysisTriggeredForTickerRef.current && performAiOptionsAnalysisState.status !== 'idle') { return; }
    if (performAiOptionsAnalysisState.status === 'idle' || fsmState !== FsmState.ANALYZING_OPTIONS) {
      if(performAiOptionsAnalysisState.status !== 'idle') logDebug('FSM_PIPELINE', `MainTabContent: Options Analysis Action state changed, but FSM not in ANALYZING_OPTIONS. Ignoring. State: ${fsmState}`);
      return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Options Analysis Action state changed:", `Status: ${performAiOptionsAnalysisState.status}`);
    if (performAiOptionsAnalysisState.status === 'success' && performAiOptionsAnalysisState.data) {
      toast({ title: "AI Options Analysis Complete", description: performAiOptionsAnalysisState.message || `Options Analysis for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: performAiOptionsAnalysisState.data as PerformAiOptionsAnalysisResult });
    } else if (performAiOptionsAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Options Analysis Error", description: performAiOptionsAnalysisState.message || "Failed to generate Options Analysis." });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: performAiOptionsAnalysisState.error, message: performAiOptionsAnalysisState.message, aiOptionsAnalysisRequestJson: performAiOptionsAnalysisState.data?.aiOptionsAnalysisRequestJson } });
    }
  }, [performAiOptionsAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  // 16. Options Analysis Succeeded/Failed -> Decide Next Step (Chat Summary or Partial Complete)
  useEffect(() => {
    if (fsmState === FsmState.OPTIONS_ANALYSIS_SUCCEEDED || fsmState === FsmState.OPTIONS_ANALYSIS_FAILED) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} for Options Analysis. isFullAnalysisTriggered: ${isFullAnalysisTriggered}`);
        if (isFullAnalysisTriggered) {
             logDebug('FSM_PIPELINE', `MainTabContent: ${fsmState} (Full Analysis). Dispatching PROCEED_TO_CHAT_SUMMARY_SETUP.`);
            dispatchFsmEvent({ type: 'PROCEED_TO_CHAT_SUMMARY_SETUP' });
        } else {
            logDebug('FSM_PIPELINE', `MainTabContent: ${fsmState} (Standard Analysis). Dispatching PROCEED_TO_PARTIAL_COMPLETE.`);
            dispatchFsmEvent({ type: 'PROCEED_TO_PARTIAL_COMPLETE' });
        }
    }
  }, [fsmState, isFullAnalysisTriggered, dispatchFsmEvent, logDebug]);

  // 17. Awaiting Chat Summary Trigger
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Chat_Summary AWAITING Effect Check. Current fsmState: ${fsmState}.`);
    if (fsmState === FsmState.AWAITING_CHAT_SUMMARY_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_CHAT_SUMMARY_TRIGGER for ${analysisTriggeredForTickerRef.current}.`);
      if (analysisTriggeredForTickerRef.current) {
        const prereqs = { 
            snap: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAIT_CS_CHECK','contextStockSnapshotJson'), 
            stdTA: isDataReadyForProcessing(contextStandardTasJson,logDebug, 'MainTabContent:AWAIT_CS_CHECK','contextStandardTasJson'), 
            aiTA: isDataReadyForProcessing(contextAiAnalyzedTaJson,logDebug, 'MainTabContent:AWAIT_CS_CHECK','contextAiAnalyzedTaJson'), 
            kt: isDataReadyForProcessing(contextAiKeyTakeawaysJson,logDebug, 'MainTabContent:AWAIT_CS_CHECK','contextAiKeyTakeawaysJson'), 
            opt: isDataReadyForProcessing(contextAiOptionsAnalysisJson,logDebug, 'MainTabContent:AWAIT_CS_CHECK','contextAiOptionsAnalysisJson'), 
            market: isDataReadyForProcessing(contextMarketStatusJson,logDebug, 'MainTabContent:AWAIT_CS_CHECK','contextMarketStatusJson')
        };
        if (prereqs.snap && prereqs.stdTA && prereqs.aiTA && prereqs.kt && prereqs.opt && prereqs.market) {
          dispatchFsmEvent({ type: 'TRIGGER_CHAT_SUMMARY' });
        } else { 
          const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', '); 
          dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: `Missing/invalid prerequisites for Chat Summary: ${missing}.`, message: 'Prerequisite data error for Chat Summary.' } });
        }
      } else { dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: 'Ticker reference missing for chat summary.', message: 'Internal error.' } });}
    }
  }, [fsmState, dispatchFsmEvent, logDebug]); // Removed context data dependencies

  // 18. Generating Chat Summary (Calling Server Action)
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_CHAT_SUMMARY Effect Check. Current fsmState: ${fsmState}. Ticker Ref: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.GENERATING_CHAT_SUMMARY && analysisTriggeredForTickerRef.current && !isGenerateChatSummaryPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      logDebug('FSM_PIPELINE', `MainTabContent: Processing GENERATING_CHAT_SUMMARY for ${currentActionTicker}. Validating data consistency.`);
      
      let snapshotDataFromContext: StockSnapshotData | null = null;
      let isSnapshotConsistentAndReady = false; // Renamed for clarity
      try {
        if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:GEN_CS_CONSISTENCY_CHECK', 'contextStockSnapshotJson')) {
          snapshotDataFromContext = JSON.parse(contextStockSnapshotJson!);
          if (snapshotDataFromContext?.ticker === currentActionTicker) {
            isSnapshotConsistentAndReady = true;
          } else { logDebug('FSM_PIPELINE', `MainTabContent: GEN_CS - DATA INCONSISTENCY! Action: ${currentActionTicker}, Snapshot: ${snapshotDataFromContext?.ticker}. Effect will re-run.`); return; }
        } else { logDebug('FSM_PIPELINE', `MainTabContent: GEN_CS - Snapshot data for ${currentActionTicker} not ready. Effect will re-run.`); return; }
      } catch (e) { logDebug('FSM_PIPELINE', `MainTabContent: GEN_CS - Error parsing snapshot for ${currentActionTicker}.`, e); return; }

      const allOtherPrereqsReady = 
        isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:GEN_CS_PREREQ','contextStandardTasJson') && 
        isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:GEN_CS_PREREQ','contextAiAnalyzedTaJson') && 
        isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, 'MainTabContent:GEN_CS_PREREQ','contextAiKeyTakeawaysJson') && 
        isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, 'MainTabContent:GEN_CS_PREREQ','contextAiOptionsAnalysisJson') && 
        isDataReadyForProcessing(contextMarketStatusJson,logDebug, 'MainTabContent:GEN_CS_PREREQ','contextMarketStatusJson');

      if (isSnapshotConsistentAndReady && allOtherPrereqsReady) {
        const payload: GenerateChatSummaryActionInputs = { ticker: currentActionTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, aiKeyTakeawaysJson: contextAiKeyTakeawaysJson!, aiOptionsAnalysisJson: contextAiOptionsAnalysisJson!, marketStatusJson: contextMarketStatusJson! };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling generateChatSummaryFormAction for ${currentActionTicker}.`);
        startTransition(() => { generateChatSummaryFormAction(payload); });
      } else {
         logDebug('FSM_PIPELINE', `MainTabContent: GEN_CS - Other prerequisites not yet ready for ${currentActionTicker} after consistency check. Effect will re-run.`);
      }
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson, generateChatSummaryFormAction, isGenerateChatSummaryPending, dispatchFsmEvent, logDebug]);

  // 19. Handling Chat Summary Result
  useEffect(() => {
    if (!analysisTriggeredForTickerRef.current && generateChatSummaryState.status !== 'idle') { return; }
    if (generateChatSummaryState.status === 'idle' || fsmState !== FsmState.GENERATING_CHAT_SUMMARY) { 
      if(generateChatSummaryState.status !== 'idle') logDebug('FSM_PIPELINE', `MainTabContent: Chat Summary Action state changed, but FSM not in GENERATING_CHAT_SUMMARY. Ignoring. State: ${fsmState}`);
      return; 
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Chat Summary Action state changed:", `Status: ${generateChatSummaryState.status}`);
    if (generateChatSummaryState.status === 'success' && generateChatSummaryState.data) {
      toast({ title: "Chat Summary Generated", description: generateChatSummaryState.message || `Chat summary for ${analysisTriggeredForTickerRef.current} generated.` });
      dispatchFsmEvent({ type: 'CHAT_SUMMARY_SUCCESS', payload: generateChatSummaryState.data as GenerateChatSummaryResult });
    } else if (generateChatSummaryState.status === 'error') {
      toast({ variant: "destructive", title: "Chat Summary Error", description: generateChatSummaryState.message || "Failed to generate chat summary." });
      dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: generateChatSummaryState.error, message: generateChatSummaryState.message, requestJson: generateChatSummaryState.data?.requestJson } });
    }
  }, [generateChatSummaryState, fsmState, dispatchFsmEvent, toast, logDebug]);

  // 20. Chat Summary Succeeded/Failed -> Proceed to Full Complete (Reducer handles this now)
  useEffect(() => {
    if (fsmState === FsmState.CHAT_SUMMARY_SUCCEEDED || fsmState === FsmState.CHAT_SUMMARY_FAILED) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} for Chat Summary. Dispatching PROCEED_TO_FULL_COMPLETE.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_FULL_COMPLETE' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // 21. Partial or Full Analysis Complete -> Proceed to IDLE (Reducer handles this now)
  useEffect(() => {
    if (fsmState === FsmState.PARTIAL_ANALYSIS_COMPLETE || fsmState === FsmState.FULL_ANALYSIS_COMPLETE) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. Dispatching PROCEED_TO_IDLE.`);
      dispatchFsmEvent({ type: 'PROCEED_TO_IDLE' }); 
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // Handle interactive chat messages (only when FSM is IDLE)
  useEffect(() => {
    if (chatActionState.status === 'idle' || !analysisTriggeredForTickerRef.current || fsmState !== FsmState.IDLE) { 
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

  // Combined data export
  const getCombinedDataForExport = useCallback(() => { /* ... as before ... */ return {}; }, []);
  const isDataReadyForCombinedExport = true; // Placeholder, actual logic in PRD
  const handleExportAllToJson = useCallback(async () => { /* ... */ }, []);
  const handleCopyAllToJson = useCallback(async () => { /* ... */ }, []);

  const activeTickerForChat = (analysisTriggeredForTickerRef.current && (isPipelineActive || isFullAnalysisTriggered)) ? analysisTriggeredForTickerRef.current : tickerInput;
  const isFormDisabled = isPipelineActive;
  const isStandardAnalysisButtonPending = isPipelineActive && !isFullAnalysisTriggered; // If pipeline is active and it's NOT a full analysis run, this button is pending
  const isFullAnalysisButtonPending = isPipelineActive && isFullAnalysisTriggered; // If pipeline is active and IS a full analysis run, this button is pending

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis</CardTitle>
        <CardDescription>
          Enter a stock ticker. "Analyze Stock" provides key data and AI insights. "AI Full Stock Analysis" adds a chat summary. FSM: {fsmState}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form for ticker input and analysis buttons */}
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
            <Button onClick={handleStandardAnalysisSubmit} type="button" className="w-full sm:w-auto" 
              disabled={isFormDisabled || isStandardAnalysisButtonPending || isFullAnalysisButtonPending }>
              { isStandardAnalysisButtonPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
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
    
