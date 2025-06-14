
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
import { generateChatSummaryAction, type GenerateChatSummaryActionState, type GenerateChatSummaryResult, type GenerateChatSummaryActionInputs as GenerateChatSummaryActionInputsType } from "@/actions/generate-chat-summary-action"; 

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
    // If it's not a "status" or "error" JSON, but still fails to parse, it's not ready.
    // However, if parsing succeeds but it's not an object (e.g. just a string "true"), that might be valid in some edge cases,
    // but generally our JSONs are objects. For this function, a parse error means not ready.
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
    // Context Data JSONs
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
    // Chat related (though chatFormAction is passed directly)
    chatHistory,
  } = useStockAnalysis();
  
  logDebug('FSM_PIPELINE', `MainTabContent RENDER: fsmState=${fsmState}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}, isFullAnalysisTriggered=${isFullAnalysisTriggered}`);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: fsmState EFFECT change detected. New fsmState: ${fsmState}.`);
  }, [fsmState, logDebug]);

  const [analyzeStockState, analyzeStockFormAction, isAnalyzeStockPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(fetchStockDataAction, initialStockDataFetchState);
  const [analyzeTaState, analyzeTaFormAction, isAnalyzeTaPending] = useActionState<AnalyzeTaActionState, { stockSnapshotJson: string, ticker?: string }>(analyzeTaAction, initialAnalyzeTaState);
  const [performAiAnalysisState, performAiAnalysisFormAction, isPerformAiAnalysisPending] = useActionState<PerformAiAnalysisActionState, PerformAiAnalysisActionInputs>(performAiAnalysisAction, initialPerformAiAnalysisState);
  const [performAiOptionsAnalysisState, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending] = useActionState<PerformAiOptionsAnalysisActionState, PerformAiOptionsAnalysisActionInputsType>(performAiOptionsAnalysisAction, initialPerformAiOptionsAnalysisState);
  const [generateChatSummaryState, generateChatSummaryFormAction, isGenerateChatSummaryPending] = useActionState<GenerateChatSummaryActionState, GenerateChatSummaryActionInputsType>(generateChatSummaryAction, initialGenerateChatSummaryState);
  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(chatServerAction, initialChatActionState);
  
  const isPipelineActive = ![FsmState.IDLE, FsmState.ANALYZE_STOCK_COMPLETE, FsmState.FULL_ANALYSIS_COMPLETE].includes(fsmState);

  const handleAnalyzeStockButtonSubmit = useCallback((event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (isPipelineActive) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" }); return;
    }
    analysisTriggeredForTickerRef.current = tickerInput; 
    logDebug('MainTabContent', `"${FsmState.START_ANALYZE_STOCK}" button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    dispatchFsmEvent({ type: 'START_ANALYZE_STOCK', payload: { ticker: tickerInput } });
  }, [fsmState, toast, tickerInput, dispatchFsmEvent, logDebug, isPipelineActive]);

  const handleAiFullAnalysisSubmit = useCallback(() => {
    if (isPipelineActive) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" }); return;
    }
    analysisTriggeredForTickerRef.current = tickerInput;
    logDebug('MainTabContent', `"${FsmState.START_FULL_ANALYSIS}" button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    dispatchFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: tickerInput } });
  }, [fsmState, toast, tickerInput, dispatchFsmEvent, logDebug, isPipelineActive]);

  // --- Step 1: FSM Progression: Initializing Analysis ---
  useEffect(() => {
    if (fsmState === FsmState.INITIALIZING_ANALYSIS) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected INITIALIZING_ANALYSIS. Dispatching INITIALIZATION_COMPLETE.`);
      dispatchFsmEvent({ type: 'INITIALIZATION_COMPLETE' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // --- Step 2: FSM Progression: Data Fetching ---
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
    logDebug('FSM_PIPELINE', `MainTabContent: Data Fetch Action state changed. FSM State: ${fsmState}, Action Status: ${analyzeStockState.status}`);
    if (analyzeStockState.status === 'idle' || fsmState !== FsmState.FETCHING_DATA) {
       if (analyzeStockState.status !== 'idle') {
        logDebug('FSM_PIPELINE', `MainTabContent: Data Fetch Action state changed, but FSM not in FETCHING_DATA or action idle. Ignoring. State: ${fsmState}, Action: ${analyzeStockState.status}`);
       }
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
  
  // --- Step 3: FSM Progression: Post Data Fetch Logic -> AI TA ---
  useEffect(() => {
    if (fsmState === FsmState.DATA_FETCH_SUCCEEDED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected DATA_FETCH_SUCCEEDED. Dispatching INITIATE_AI_TA_SEQUENCE.`);
      dispatchFsmEvent({ type: 'INITIATE_AI_TA_SEQUENCE' });
    } else if (fsmState === FsmState.DATA_FETCH_FAILED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected DATA_FETCH_FAILED. Dispatching PROCEED_TO_IDLE.`);
      dispatchFsmEvent({ type: 'PROCEED_TO_IDLE' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // --- Step 4: FSM Progression: AI TA Trigger ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AI_TA AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_AI_TA_TRIGGER) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
        dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: "Ticker reference missing for AI TA.", message: "Internal error for AI TA." } }); return;
      }
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_AI_TA_TRIGGER for ${currentActionTicker}. Validating snapshot...`);
      if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `AWAIT_AITA:${currentActionTicker}`, 'Snapshot')) {
        let snapshotData: StockSnapshotData | null = null;
        try { snapshotData = JSON.parse(contextStockSnapshotJson!); } catch(e) { /* handled by isDataReady */ }
        if (snapshotData?.ticker === currentActionTicker) {
          logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_AITA - Snapshot for ${currentActionTicker} READY and CONSISTENT. Dispatching TRIGGER_AI_TA.`);
          dispatchFsmEvent({ type: 'TRIGGER_AI_TA' });
        } else {
          logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_AITA - Snapshot for ${currentActionTicker} INCONSISTENT (found ${snapshotData?.ticker}). Waiting.`);
        }
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_AITA - Snapshot for ${currentActionTicker} NOT READY. Waiting.`);
      }
    }
  }, [fsmState, contextStockSnapshotJson, dispatchFsmEvent, logDebug]);

  // --- Step 5: FSM Progression: Analyzing TA ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_TA Effect Check. Current fsmState: ${fsmState}. isAnalyzeTaPending: ${isAnalyzeTaPending}. Ticker: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.ANALYZING_TA && analysisTriggeredForTickerRef.current && !isAnalyzeTaPending) {
      const payload = { stockSnapshotJson: contextStockSnapshotJson!, ticker: analysisTriggeredForTickerRef.current };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling analyzeTaFormAction for ${analysisTriggeredForTickerRef.current}.`);
      startTransition(() => { analyzeTaFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, analyzeTaFormAction, isAnalyzeTaPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AI TA Action state changed. FSM State: ${fsmState}, Action Status: ${analyzeTaState.status}`);
    if (analyzeTaState.status === 'idle' || fsmState !== FsmState.ANALYZING_TA) {
        if (analyzeTaState.status !== 'idle') {
             logDebug('FSM_PIPELINE', `MainTabContent: AI TA Action state changed, but FSM not in ANALYZING_TA or action idle. Ignoring. State: ${fsmState}, Action: ${analyzeTaState.status}`);
        }
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

  // --- Step 6: FSM Progression: Post AI TA Logic -> Key Takeaways or completion ---
  useEffect(() => {
    if (fsmState === FsmState.AI_TA_SUCCEEDED || fsmState === FsmState.AI_TA_FAILED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. isFullAnalysisTriggered: ${isFullAnalysisTriggered}.`);
      // "Analyze Stock" button now includes Key Takeaways and Options Analysis
      logDebug('FSM_PIPELINE', `MainTabContent: ${fsmState}. Proceeding to Key Takeaways (for both 'Analyze Stock' and 'Full Analysis'). Dispatching INITIATE_KEY_TAKEAWAYS_SEQUENCE.`);
      dispatchFsmEvent({ type: 'INITIATE_KEY_TAKEAWAYS_SEQUENCE' });
    }
  }, [fsmState, isFullAnalysisTriggered, dispatchFsmEvent, logDebug]);

  // --- Step 7: FSM Progression: Key Takeaways Trigger ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Key_Takeaways AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: "Ticker ref missing for KT.", message: "Internal error for KT." } }); return;
      }
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_KEY_TAKEAWAYS_TRIGGER for ${currentActionTicker}. Validating prerequisites...`);
      
      let snapshotData: StockSnapshotData | null = null;
      let isSnapshotConsistentAndReady = false;
      if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'Snapshot')) {
          try { snapshotData = JSON.parse(contextStockSnapshotJson!); } catch(e) { /* ignore */ }
          if (snapshotData?.ticker === currentActionTicker) isSnapshotConsistentAndReady = true;
          else { logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - Snapshot for ${currentActionTicker} INCONSISTENT (found ${snapshotData?.ticker}). Waiting.`); return; }
      } else { logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - Snapshot for ${currentActionTicker} NOT READY. Waiting.`); return; }

      const stdTasIsValid = isDataReadyForProcessing(contextStandardTasJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'StdTA');
      const aiTaIsValid = isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'AITA');
      const marketIsValid = isDataReadyForProcessing(contextMarketStatusJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'MarketStatus');

      if (isSnapshotConsistentAndReady && stdTasIsValid && aiTaIsValid && marketIsValid) {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - All prerequisites for ${currentActionTicker} READY & CONSISTENT. Dispatching TRIGGER_KEY_TAKEAWAYS.`);
        dispatchFsmEvent({ type: 'TRIGGER_KEY_TAKEAWAYS' });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - Other prereqs for ${currentActionTicker} NOT READY. StdTA: ${stdTasIsValid}, AITA: ${aiTaIsValid}, Market: ${marketIsValid}. Waiting.`);
      }
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, dispatchFsmEvent, logDebug]);

  // --- Step 8: FSM Progression: Generating Key Takeaways ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_KEY_TAKEAWAYS Effect Check. Current fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.GENERATING_KEY_TAKEAWAYS && analysisTriggeredForTickerRef.current && !isPerformAiAnalysisPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      // Consistency check for snapshot is vital here again before constructing payload
      let snapshotData: StockSnapshotData | null = null;
      try { if (contextStockSnapshotJson) snapshotData = JSON.parse(contextStockSnapshotJson); } catch(e) {/*ignore*/}
      if (!snapshotData || snapshotData.ticker !== currentActionTicker) {
        logDebug('FSM_PIPELINE', `MainTabContent: GEN_KT - Consistency check FAIL before action. Expected ${currentActionTicker}, got ${snapshotData?.ticker}. Dispatching failure.`);
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: `Data inconsistency before KT action. Action: ${currentActionTicker}, Snapshot: ${snapshotData?.ticker}`, message: 'Data inconsistency.' } }); 
        return;
      }
      const payload: PerformAiAnalysisActionInputs = { ticker: currentActionTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, marketStatusJson: contextMarketStatusJson! };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiAnalysisFormAction (Key Takeaways) for ${currentActionTicker}.`);
      startTransition(() => { performAiAnalysisFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, performAiAnalysisFormAction, isPerformAiAnalysisPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Key Takeaways Action state changed. FSM State: ${fsmState}, Action Status: ${performAiAnalysisState.status}`);
     if (performAiAnalysisState.status === 'idle' || fsmState !== FsmState.GENERATING_KEY_TAKEAWAYS) {
       if (performAiAnalysisState.status !== 'idle') {
         logDebug('FSM_PIPELINE', `MainTabContent: Key Takeaways Action state changed, but FSM not in GENERATING_KEY_TAKEAWAYS or action idle. Ignoring. State: ${fsmState}, Action: ${performAiAnalysisState.status}`);
       }
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
  
  // --- Step 9: FSM Progression: Post Key Takeaways -> Options Analysis ---
  useEffect(() => {
    if (fsmState === FsmState.KEY_TAKEAWAYS_SUCCEEDED || fsmState === FsmState.KEY_TAKEAWAYS_FAILED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} (after Key Takeaways). Proceeding to Options Analysis. Dispatching INITIATE_OPTIONS_ANALYSIS_SEQUENCE.`);
      dispatchFsmEvent({ type: 'INITIATE_OPTIONS_ANALYSIS_SEQUENCE' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // --- Step 10: FSM Progression: Options Analysis Trigger ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Options_Analysis AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: "Ticker ref missing for Options.", message: "Internal error for Options." } }); return;
      }
      logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_OPTIONS_ANALYSIS_TRIGGER for ${currentActionTicker}. Validating prerequisites...`);
      
      let snapshotData: StockSnapshotData | null = null;
      let isSnapshotConsistentAndReady = false;
      if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `AWAIT_OPT:${currentActionTicker}`, 'Snapshot')) {
          try { snapshotData = JSON.parse(contextStockSnapshotJson!); } catch(e) { /* ignore */ }
          if (snapshotData?.ticker === currentActionTicker) isSnapshotConsistentAndReady = true;
          else { logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_OPT - Snapshot for ${currentActionTicker} INCONSISTENT (found ${snapshotData?.ticker}). Waiting.`); return; }
      } else { logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_OPT - Snapshot for ${currentActionTicker} NOT READY. Waiting.`); return; }
      
      const optionsChainIsValid = isDataReadyForProcessing(contextOptionsChainJson, logDebug, `AWAIT_OPT:${currentActionTicker}`, 'OptionsChain');

      if (isSnapshotConsistentAndReady && optionsChainIsValid) {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_OPT - All prerequisites for ${currentActionTicker} READY & CONSISTENT. Dispatching TRIGGER_OPTIONS_ANALYSIS.`);
        dispatchFsmEvent({ type: 'TRIGGER_OPTIONS_ANALYSIS' });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_OPT - Options Chain for ${currentActionTicker} NOT YET READY (${optionsChainIsValid}). Waiting.`);
      }
    }
  }, [fsmState, contextStockSnapshotJson, contextOptionsChainJson, dispatchFsmEvent, logDebug]);

  // --- Step 11: FSM Progression: Analyzing Options ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_OPTIONS Effect Check. Current fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.ANALYZING_OPTIONS && analysisTriggeredForTickerRef.current && !isPerformAiOptionsAnalysisPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      let snapshotData: StockSnapshotData | null = null;
      try { if (contextStockSnapshotJson) snapshotData = JSON.parse(contextStockSnapshotJson); } catch(e) {/*ignore*/}
      if (!snapshotData || snapshotData.ticker !== currentActionTicker) {
        logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_OPT - Consistency check FAIL. Expected ${currentActionTicker}, got ${snapshotData?.ticker}. Dispatching failure.`);
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: `Data inconsistency before Options action. Action: ${currentActionTicker}, Snapshot: ${snapshotData?.ticker}`, message: 'Data inconsistency.' } }); 
        return;
      }
      const payload: PerformAiOptionsAnalysisActionInputsType = { ticker: currentActionTicker, optionsChainJson: contextOptionsChainJson!, stockSnapshotJson: contextStockSnapshotJson! };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiOptionsAnalysisFormAction for ${currentActionTicker}.`);
      startTransition(() => { performAiOptionsAnalysisFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextOptionsChainJson, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Options Analysis Action state changed. FSM State: ${fsmState}, Action Status: ${performAiOptionsAnalysisState.status}`);
    if (performAiOptionsAnalysisState.status === 'idle' || fsmState !== FsmState.ANALYZING_OPTIONS) {
        if (performAiOptionsAnalysisState.status !== 'idle') {
            logDebug('FSM_PIPELINE', `MainTabContent: Options Analysis Action state changed, but FSM not in ANALYZING_OPTIONS or action idle. Ignoring. State: ${fsmState}, Action: ${performAiOptionsAnalysisState.status}`);
        }
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

  // --- Step 12: FSM Progression: Post Options Analysis -> Chat Summary (Full) or Completion (Analyze Stock) ---
  useEffect(() => {
    if (fsmState === FsmState.OPTIONS_ANALYSIS_SUCCEEDED || fsmState === FsmState.OPTIONS_ANALYSIS_FAILED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} (after Options). isFullAnalysisTriggered: ${isFullAnalysisTriggered}.`);
      if (isFullAnalysisTriggered) {
        logDebug('FSM_PIPELINE', `MainTabContent: ${fsmState} (Full Analysis - after Options). Dispatching INITIATE_CHAT_SUMMARY_SEQUENCE.`);
        dispatchFsmEvent({ type: 'INITIATE_CHAT_SUMMARY_SEQUENCE' });
      } else { 
        logDebug('FSM_PIPELINE', `MainTabContent: ${fsmState} ("Analyze Stock" flow complete after Options). Dispatching PROCEED_TO_ANALYZE_STOCK_COMPLETE.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_ANALYZE_STOCK_COMPLETE' });
      }
    }
  }, [fsmState, isFullAnalysisTriggered, dispatchFsmEvent, logDebug]);

  // --- Step 13: FSM Progression: Chat Summary Trigger (Full Analysis Only) ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Chat_Summary AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_CHAT_SUMMARY_TRIGGER) {
        const currentActionTicker = analysisTriggeredForTickerRef.current;
        if (!currentActionTicker) {
             dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: "Ticker ref missing for Chat Summary.", message: "Internal error for Chat Summary." } }); return;
        }
        logDebug('FSM_PIPELINE', `MainTabContent: Processing AWAITING_CHAT_SUMMARY_TRIGGER for ${currentActionTicker}. Validating prerequisites...`);
        
        let snapshotData: StockSnapshotData | null = null;
        let isSnapshotConsistentAndReady = false;
        if (isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'Snapshot')) {
            try { snapshotData = JSON.parse(contextStockSnapshotJson!); } catch(e) {/*ignore*/}
            if (snapshotData?.ticker === currentActionTicker) isSnapshotConsistentAndReady = true;
            else { logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_CS - Snapshot INCONSISTENT for ${currentActionTicker} (found ${snapshotData?.ticker}). Waiting.`); return; }
        } else { logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_CS - Snapshot NOT READY for ${currentActionTicker}. Waiting.`); return; }

        const allPrereqsReady = isSnapshotConsistentAndReady &&
            isDataReadyForProcessing(contextStandardTasJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'StdTA') &&
            isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'AITA') &&
            isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'KeyTakeaways') &&
            isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'OptionsAnalysis') &&
            isDataReadyForProcessing(contextMarketStatusJson, logDebug, `AWAIT_CS:${currentActionTicker}`, 'MarketStatus');

        if (allPrereqsReady) {
            logDebug('FSM_PIPELINE', `AWAIT_CS - All prerequisites for ${currentActionTicker} READY & CONSISTENT. Dispatching TRIGGER_CHAT_SUMMARY.`);
            dispatchFsmEvent({ type: 'TRIGGER_CHAT_SUMMARY' });
        } else {
            logDebug('FSM_PIPELINE', `AWAIT_CS - Other prerequisites for ${currentActionTicker} NOT YET READY. Waiting.`);
        }
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson, dispatchFsmEvent, logDebug]);

  // --- Step 14: FSM Progression: Generating Chat Summary ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_CHAT_SUMMARY Effect Check. Current fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.GENERATING_CHAT_SUMMARY && analysisTriggeredForTickerRef.current && !isGenerateChatSummaryPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      let snapshotData: StockSnapshotData | null = null;
      try { if (contextStockSnapshotJson) snapshotData = JSON.parse(contextStockSnapshotJson); } catch(e) {/*ignore*/}
      if (!snapshotData || snapshotData.ticker !== currentActionTicker) {
        logDebug('FSM_PIPELINE', `MainTabContent: GEN_CS - Consistency check FAIL. Expected ${currentActionTicker}, got ${snapshotData?.ticker}. Dispatching failure.`);
        dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: `Data inconsistency before Chat Summary. Action: ${currentActionTicker}, Snapshot: ${snapshotData?.ticker}`, message: 'Data inconsistency.' } }); 
        return;
      }
      const payload: GenerateChatSummaryActionInputsType = { ticker: currentActionTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, aiKeyTakeawaysJson: contextAiKeyTakeawaysJson!, aiOptionsAnalysisJson: contextAiOptionsAnalysisJson!, marketStatusJson: contextMarketStatusJson! };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling generateChatSummaryFormAction for ${currentActionTicker}.`);
      startTransition(() => { generateChatSummaryFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson, generateChatSummaryFormAction, isGenerateChatSummaryPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Chat Summary Action state changed. FSM State: ${fsmState}, Action Status: ${generateChatSummaryState.status}`);
    if (generateChatSummaryState.status === 'idle' || fsmState !== FsmState.GENERATING_CHAT_SUMMARY) {
        if (generateChatSummaryState.status !== 'idle') {
            logDebug('FSM_PIPELINE', `MainTabContent: Chat Summary Action state changed, but FSM not in GENERATING_CHAT_SUMMARY or action idle. Ignoring. State: ${fsmState}, Action: ${generateChatSummaryState.status}`);
        }
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

  // --- Step 15: FSM Progression: Completion & IDLE ---
  useEffect(() => {
    if (fsmState === FsmState.CHAT_SUMMARY_SUCCEEDED || fsmState === FsmState.CHAT_SUMMARY_FAILED) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} (after Chat Summary). Dispatching PROCEED_TO_FULL_COMPLETE.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_FULL_COMPLETE' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.ANALYZE_STOCK_COMPLETE || fsmState === FsmState.FULL_ANALYSIS_COMPLETE) {
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


  // Handle interactive chat messages (only when FSM is IDLE or a terminal COMPLETE state)
  useEffect(() => {
    if (chatActionState.status === 'idle' || ![FsmState.IDLE, FsmState.ANALYZE_STOCK_COMPLETE, FsmState.FULL_ANALYSIS_COMPLETE].includes(fsmState) ) { 
      if (chatActionState.status !== 'idle' && ![FsmState.IDLE, FsmState.ANALYZE_STOCK_COMPLETE, FsmState.FULL_ANALYSIS_COMPLETE].includes(fsmState)) {
        logDebug('MainTabContent:chatActionState', `Ignoring chat action state change because FSM is active (${fsmState}). Chat action: ${chatActionState.status}`);
      }
      return; 
    } 
    logDebug('MainTabContent:chatActionState', 'Interactive chat state changed while FSM is in a terminal state:', `FSM State: ${fsmState}, Chat Action Status: ${chatActionState.status}`);
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
  }, [tickerInput, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextOptionsChainJson, contextMarketStatusJson]);

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

  const activeTickerForDisplay = analysisTriggeredForTickerRef.current || tickerInput;
  const isFormDisabled = isPipelineActive;
  const isAnalyzeStockButtonPending = isPipelineActive && !isFullAnalysisTriggered; 
  const isFullAnalysisButtonPending = isPipelineActive && isFullAnalysisTriggered;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis</CardTitle>
        <CardDescription>
          Enter a stock ticker. "Analyze Stock" provides data, AI TA, Key Takeaways, and Options Analysis. "AI Full Stock Analysis" adds a chat summary. FSM: {fsmState}
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
          <AiOptionsAnalysisDisplay />
          <OptionsChainTable />
          <Chatbot
            chatFormAction={chatFormAction} 
            isChatPending={isChatPending} 
            currentTicker={activeTickerForDisplay}
          />
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}
    

