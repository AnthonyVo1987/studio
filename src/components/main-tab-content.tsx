
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
  '{ "status": "full_analysis_pending..." }',
  '{ "status": "pending_request_for_ticker" }', // Added from context
  '{ "status": "fetching_data..." }',          // Added from context
  '{ "status": "no_analysis_run_yet" }'
];


function isDataReadyForProcessing(jsonString: string | null | undefined, logDebugFn?: Function, sourceComponent?: string, dataName?: string): boolean {
  const callContext = `${sourceComponent || 'isDataReadyForProcessing'}:${dataName || 'data'}`;
  if (!jsonString || jsonString === '{}') {
    logDebugFn?.(callContext, `Data is not ready: string is null, undefined, or empty object.`);
    return false;
  }
  const trimmedJsonString = jsonString.trim();
  // Check if the string is exactly one of the known pending/status strings
  if (PENDING_STATUS_JSON_VARIANTS.some(variant => trimmedJsonString === variant)) {
    logDebugFn?.(callContext, `Data is not ready: string is a known pending/initializing placeholder: '${trimmedJsonString.substring(0,50)}...'`);
    return false;
  }
  // Check if the string *contains* a status field indicating it's not actual data
  // This is more robust for JSON objects that might have additional fields but are still status messages
  try {
    const parsed = JSON.parse(trimmedJsonString);
    if (parsed && typeof parsed === 'object') {
      if (parsed.status && (parsed.status.includes('error') || parsed.status.includes('skipped') || parsed.status.includes('pending') || parsed.status.includes('initializing'))) {
        logDebugFn?.(callContext, `Data is not ready: JSON content indicates error/skipped/pending status: '${trimmedJsonString.substring(0,100)}...'`);
        return false;
      }
      if (parsed.error) { // Handle direct error objects
        logDebugFn?.(callContext, `Data is not ready: JSON content indicates a direct error field: '${trimmedJsonString.substring(0,100)}...'`);
        return false;
      }
    }
  } catch(e) {
    // If it's not valid JSON, it might be actual data (like a simple string from an AI flow if schemas are loose)
    // or it could be an error during development. For strict data flows, we might want this to return false.
    // For now, if it's not a known status string and doesn't parse to an error/status object, assume it *could* be data.
    // The responsibility of ensuring it's the *correct* data (e.g. right ticker) is separate.
    logDebugFn?.(callContext, `Data is not known status/error JSON, but failed to parse. Assuming it might be non-JSON data or malformed. Proceeding as 'potentially ready'. String: '${trimmedJsonString.substring(0,100)}...'`);
  }
  logDebugFn?.(callContext, `Data passed initial 'isDataReadyForProcessing' checks: '${trimmedJsonString.substring(0,100)}...'`);
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
    chatbotRequestJson: contextChatbotRequestJson, // Added for completeness
    chatbotResponseJson: contextChatbotResponseJson, // Added for completeness
    isFullAnalysisTriggered,
    logDebug,
    fsmState,
    dispatchFsmEvent,
    chatHistory, 
  } = useStockAnalysis();
  
  logDebug('FSM_PIPELINE', `MainTabContent RENDER: fsmState=${fsmState}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}, isFullAnalysisTriggered=${isFullAnalysisTriggered}`);

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
  }, [isPipelineActive, toast, tickerInput, dispatchFsmEvent, logDebug, fsmState]);

  const handleAiFullAnalysisSubmit = useCallback(() => {
    if (isPipelineActive) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" }); return;
    }
    analysisTriggeredForTickerRef.current = tickerInput;
    logDebug('MainTabContent', `"${FsmState.START_FULL_ANALYSIS}" button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    dispatchFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: tickerInput } });
  }, [isPipelineActive, toast, tickerInput, dispatchFsmEvent, logDebug, fsmState]);

  // Effect to reset analysisTriggeredForTickerRef when FSM becomes IDLE
  useEffect(() => {
    if (fsmState === FsmState.IDLE) {
      logDebug('FSM_PIPELINE', `MainTabContent: FSM is IDLE. Resetting analysisTriggeredForTickerRef from ${analysisTriggeredForTickerRef.current} to null.`);
      analysisTriggeredForTickerRef.current = null;
    }
  }, [fsmState, logDebug]);

  // --- Step 1: FSM Progression: Initializing Analysis ---
  useEffect(() => {
    if (fsmState === FsmState.INITIALIZING_ANALYSIS) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected INITIALIZING_ANALYSIS. Dispatching INITIALIZATION_COMPLETE.`);
      dispatchFsmEvent({ type: 'INITIALIZATION_COMPLETE' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // --- Step 2: FSM Progression: Data Fetching Trigger ---
  useEffect(() => {
    if (fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected AWAITING_DATA_FETCH_TRIGGER. Dispatching TRIGGER_DATA_FETCH.`);
      dispatchFsmEvent({ type: 'TRIGGER_DATA_FETCH' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // --- Step 2b: Call Data Fetch Action ---
  useEffect(() => {
    if (fsmState === FsmState.FETCHING_DATA && analysisTriggeredForTickerRef.current && !isAnalyzeStockPending) {
      const payload = { ticker: analysisTriggeredForTickerRef.current };
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in FETCHING_DATA for ${analysisTriggeredForTickerRef.current}. Calling analyzeStockFormAction.`);
      startTransition(() => { analyzeStockFormAction(payload); });
    }
  }, [fsmState, analyzeStockFormAction, isAnalyzeStockPending, logDebug]);

  // --- Step 2c: Handle Data Fetch Action Result ---
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
  
  // --- Step 3: Post Data Fetch Logic (handles success or failure, initiates AI TA sequence) ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Effect for DATA_FETCH_SUCCEEDED/FAILED. Current fsmState: ${fsmState}. analysisTickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.DATA_FETCH_SUCCEEDED) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
        logDebug('FSM_PIPELINE', `MainTabContent: DATA_FETCH_SUCCEEDED but currentActionTicker is null. Dispatching AI_TA_FAILURE.`);
        dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: "Ticker reference missing post data fetch.", message: "Internal error preparing for AI TA." } }); 
        return;
      }
      
      let snapshotData: StockSnapshotData | null = null;
      if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `DATA_FETCH_SUCCEEDED_Effect:${currentActionTicker}`, 'Snapshot')) {
        logDebug('FSM_PIPELINE', `MainTabContent: DATA_FETCH_SUCCEEDED - Snapshot for ${currentActionTicker} not ready. Waiting for context update.`);
        return; 
      }
      try {
        snapshotData = JSON.parse(contextStockSnapshotJson!);
      } catch (e) {
        logDebug('FSM_PIPELINE', `MainTabContent: DATA_FETCH_SUCCEEDED - Failed to parse snapshot for ${currentActionTicker}. Waiting.`, e);
        return;
      }

      if (snapshotData?.ticker !== currentActionTicker) {
        logDebug('FSM_PIPELINE', `MainTabContent: DATA_FETCH_SUCCEEDED - Snapshot for ${currentActionTicker} INCONSISTENT (found ${snapshotData?.ticker}). Waiting for context update.`);
        return; 
      }

      logDebug('FSM_PIPELINE', `MainTabContent: DATA_FETCH_SUCCEEDED - Snapshot for ${currentActionTicker} is READY and CONSISTENT. Dispatching INITIATE_AI_TA_SEQUENCE.`);
      dispatchFsmEvent({ type: 'INITIATE_AI_TA_SEQUENCE' });

    } else if (fsmState === FsmState.DATA_FETCH_FAILED) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected DATA_FETCH_FAILED. Dispatching PROCEED_TO_IDLE.`);
      dispatchFsmEvent({ type: 'PROCEED_TO_IDLE' });
    }
  }, [fsmState, contextStockSnapshotJson, dispatchFsmEvent, logDebug]);

  // --- Step 4: AI TA - AWAITING_TRIGGER ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AI_TA AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_AI_TA_TRIGGER) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
        dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: "Ticker reference missing for AI TA.", message: "Internal error for AI TA." } }); return;
      }
      
      let snapshotDataForAction: StockSnapshotData | null = null;
      if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `AWAIT_AITA:${currentActionTicker}`, 'Snapshot')) {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_AITA - Snapshot for ${currentActionTicker} not yet ready. Waiting.`);
        return;
      }
      try {
        snapshotDataForAction = JSON.parse(contextStockSnapshotJson!);
      } catch(e) {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_AITA - Error parsing snapshot for ${currentActionTicker}. Waiting.`, e);
        return;
      }

      if (snapshotDataForAction?.ticker !== currentActionTicker) {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_AITA - Snapshot for ${currentActionTicker} INCONSISTENT (found ${snapshotDataForAction?.ticker}). Waiting.`);
        return;
      }

      logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_AITA - Snapshot for ${currentActionTicker} READY and CONSISTENT. Dispatching TRIGGER_AI_TA.`);
      dispatchFsmEvent({ type: 'TRIGGER_AI_TA' });
    }
  }, [fsmState, contextStockSnapshotJson, dispatchFsmEvent, logDebug]); 

  // --- Step 5: AI TA - ANALYZING_TA (Calling Action) ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_TA Effect Check. Current fsmState: ${fsmState}. isAnalyzeTaPending: ${isAnalyzeTaPending}. Ticker: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.ANALYZING_TA && analysisTriggeredForTickerRef.current && !isAnalyzeTaPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      // Final check before action call, though AWAITING_AI_TA_TRIGGER should have ensured consistency.
      let snapshotData: StockSnapshotData | null = null; try { if(contextStockSnapshotJson) snapshotData = JSON.parse(contextStockSnapshotJson); } catch(e){}
      if (!snapshotData || snapshotData.ticker !== currentActionTicker || !isDataReadyForProcessing(contextStockSnapshotJson)) {
        dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: `Data inconsistency right before AI TA call. Action: ${currentActionTicker}, Snapshot: ${snapshotData?.ticker}`, message: 'Data inconsistency for AI TA.' } }); return;
      }
      const payload = { stockSnapshotJson: contextStockSnapshotJson!, ticker: currentActionTicker };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling analyzeTaFormAction for ${currentActionTicker}.`);
      startTransition(() => { analyzeTaFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, analyzeTaFormAction, isAnalyzeTaPending, dispatchFsmEvent, logDebug]);

  // --- Step 5b: Handle AI TA Action Result ---
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

  // --- Step 6: Post AI TA Logic (handles success or failure, initiates Key Takeaways or completes partial) ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Effect for AI_TA_SUCCEEDED/FAILED. Current fsmState: ${fsmState}. analysisTickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AI_TA_SUCCEEDED || fsmState === FsmState.AI_TA_FAILED) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: "Ticker reference missing post AI TA.", message: "Internal error for Key Takeaways." } }); return;
      }
      
      let snapshotData: StockSnapshotData | null = null;
      if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `POST_AITA_Effect:${currentActionTicker}`, 'Snapshot') ||
          !(snapshotData = JSON.parse(contextStockSnapshotJson!)) || 
          snapshotData.ticker !== currentActionTicker) {
        logDebug('FSM_PIPELINE', `MainTabContent: POST_AITA - Snapshot for ${currentActionTicker} not ready or INCONSISTENT (found ${snapshotData?.ticker}). Waiting.`);
        return; 
      }
      // Other prerequisites for Key Takeaways
      if (!isDataReadyForProcessing(contextStandardTasJson, logDebug, `POST_AITA_Effect:${currentActionTicker}`, 'StdTA') ||
          !isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, `POST_AITA_Effect:${currentActionTicker}`, 'AITAResult') || // Result of AI TA must be ready
          !isDataReadyForProcessing(contextMarketStatusJson, logDebug, `POST_AITA_Effect:${currentActionTicker}`, 'MarketStatus')) {
        logDebug('FSM_PIPELINE', `MainTabContent: POST_AITA - Not all prerequisites for Key Takeaways for ${currentActionTicker} are ready. Waiting.`);
        return;
      }

      logDebug('FSM_PIPELINE', `MainTabContent: POST_AITA - All prerequisites for Key Takeaways for ${currentActionTicker} READY and CONSISTENT. Dispatching INITIATE_KEY_TAKEAWAYS_SEQUENCE.`);
      dispatchFsmEvent({ type: 'INITIATE_KEY_TAKEAWAYS_SEQUENCE' });
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, dispatchFsmEvent, logDebug]);
  
  // --- Step 7 & 8: Key Takeaways (AWAITING_TRIGGER -> GENERATING -> SUCCEEDED/FAILED) ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Key_Takeaways AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: "Ticker reference missing for Key Takeaways.", message: "Internal error for Key Takeaways." } }); return;
      }

      let snapshotData: StockSnapshotData | null = null;
      if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'Snapshot') ||
          !(snapshotData = JSON.parse(contextStockSnapshotJson!)) || 
          snapshotData.ticker !== currentActionTicker) {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - Snapshot INCONSISTENT for ${currentActionTicker} (found ${snapshotData?.ticker}). Waiting.`); return;
      }
      if (!isDataReadyForProcessing(contextStandardTasJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'StdTA') ||
          !isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'AITAResult') ||
          !isDataReadyForProcessing(contextMarketStatusJson, logDebug, `AWAIT_KT:${currentActionTicker}`, 'MarketStatus')) {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - Other prerequisites for ${currentActionTicker} NOT YET READY. Waiting.`); return;
      }
      
      logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_KT - All prerequisites for ${currentActionTicker} READY and CONSISTENT. Dispatching TRIGGER_KEY_TAKEAWAYS.`);
      dispatchFsmEvent({ type: 'TRIGGER_KEY_TAKEAWAYS' });
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.GENERATING_KEY_TAKEAWAYS && analysisTriggeredForTickerRef.current && !isPerformAiAnalysisPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      // Final consistency check before action call
      let snapshotData: StockSnapshotData | null = null; try { if(contextStockSnapshotJson) snapshotData = JSON.parse(contextStockSnapshotJson); } catch(e){}
      if (!snapshotData || snapshotData.ticker !== currentActionTicker || 
          !isDataReadyForProcessing(contextStandardTasJson) || !isDataReadyForProcessing(contextAiAnalyzedTaJson) || !isDataReadyForProcessing(contextMarketStatusJson)) {
        dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: `Data inconsistency/not ready right before Key Takeaways call for ${currentActionTicker}.`, message: 'Data inconsistency for Key Takeaways.' } }); return;
      }
      const payload: PerformAiAnalysisActionInputs = { ticker: currentActionTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, marketStatusJson: contextMarketStatusJson! };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiAnalysisFormAction (Key Takeaways) for ${currentActionTicker}.`);
      startTransition(() => { performAiAnalysisFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, performAiAnalysisFormAction, isPerformAiAnalysisPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (performAiAnalysisState.status === 'idle' || fsmState !== FsmState.GENERATING_KEY_TAKEAWAYS) return;
    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Complete", description: performAiAnalysisState.message });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: performAiAnalysisState.data });
    } else if (performAiAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Key Takeaways Error", description: performAiAnalysisState.message });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: performAiAnalysisState.error, message: performAiAnalysisState.message, aiKeyTakeawaysRequestJson: performAiAnalysisState.data?.aiKeyTakeawaysRequestJson } });
    }
  }, [performAiAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  // --- Step 9 & 10 & 11: Options Analysis (POST_KEY_TAKEAWAYS -> AWAITING_TRIGGER -> TRIGGER -> ANALYZING -> SUCCEEDED/FAILED) ---
   useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Effect for KEY_TAKEAWAYS_SUCCEEDED/FAILED. Current fsmState: ${fsmState}. analysisTickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.KEY_TAKEAWAYS_SUCCEEDED || fsmState === FsmState.KEY_TAKEAWAYS_FAILED) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: "Ticker reference missing post Key Takeaways.", message: "Internal error for Options Analysis." } }); return;
      }
      
      let snapshotData: StockSnapshotData | null = null;
      if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `POST_KT_Effect:${currentActionTicker}`, 'Snapshot_Opt') ||
          !(snapshotData = JSON.parse(contextStockSnapshotJson!)) ||
          snapshotData.ticker !== currentActionTicker) {
        logDebug('FSM_PIPELINE', `MainTabContent: POST_KT - Snapshot for Options for ${currentActionTicker} not ready/INCONSISTENT. Waiting.`); return;
      }
      if (!isDataReadyForProcessing(contextOptionsChainJson, logDebug, `POST_KT_Effect:${currentActionTicker}`, 'OptionsChain')) {
        logDebug('FSM_PIPELINE', `MainTabContent: POST_KT - Options Chain for ${currentActionTicker} not ready. Waiting.`); return;
      }

      logDebug('FSM_PIPELINE', `MainTabContent: POST_KT - All prerequisites for Options Analysis for ${currentActionTicker} READY. Dispatching INITIATE_OPTIONS_ANALYSIS_SEQUENCE.`);
      dispatchFsmEvent({ type: 'INITIATE_OPTIONS_ANALYSIS_SEQUENCE' });
    }
  }, [fsmState, contextStockSnapshotJson, contextOptionsChainJson, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Options_Analysis AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER) {
       const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: "Ticker reference missing for Options Analysis.", message: "Internal error for Options Analysis." } }); return;
      }
      let snapshotData: StockSnapshotData | null = null;
      if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `AWAIT_OPT:${currentActionTicker}`, 'Snapshot') ||
          !(snapshotData = JSON.parse(contextStockSnapshotJson!)) || 
          snapshotData.ticker !== currentActionTicker) {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_OPT - Snapshot INCONSISTENT for ${currentActionTicker} (found ${snapshotData?.ticker}). Waiting.`); return;
      }
      if (!isDataReadyForProcessing(contextOptionsChainJson, logDebug, `AWAIT_OPT:${currentActionTicker}`, 'OptionsChain')) {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_OPT - Options Chain for ${currentActionTicker} NOT YET READY. Waiting.`); return;
      }
      logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_OPT - All prerequisites for ${currentActionTicker} READY and CONSISTENT. Dispatching TRIGGER_OPTIONS_ANALYSIS.`);
      dispatchFsmEvent({ type: 'TRIGGER_OPTIONS_ANALYSIS' });
    }
  }, [fsmState, contextStockSnapshotJson, contextOptionsChainJson, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.ANALYZING_OPTIONS && analysisTriggeredForTickerRef.current && !isPerformAiOptionsAnalysisPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      let snapshotData: StockSnapshotData | null = null; try { if(contextStockSnapshotJson) snapshotData = JSON.parse(contextStockSnapshotJson); } catch(e){}
      if (!snapshotData || snapshotData.ticker !== currentActionTicker || !isDataReadyForProcessing(contextOptionsChainJson)) {
        dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: `Data inconsistency/not ready right before Options Analysis call for ${currentActionTicker}.`, message: 'Data inconsistency for Options Analysis.' } }); return;
      }
      const payload: PerformAiOptionsAnalysisActionInputsType = { ticker: currentActionTicker, optionsChainJson: contextOptionsChainJson!, stockSnapshotJson: contextStockSnapshotJson! };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiOptionsAnalysisFormAction for ${currentActionTicker}.`);
      startTransition(() => { performAiOptionsAnalysisFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextOptionsChainJson, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (performAiOptionsAnalysisState.status === 'idle' || fsmState !== FsmState.ANALYZING_OPTIONS) return;
    if (performAiOptionsAnalysisState.status === 'success' && performAiOptionsAnalysisState.data) {
      toast({ title: "AI Options Analysis Complete", description: performAiOptionsAnalysisState.message });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: performAiOptionsAnalysisState.data });
    } else if (performAiOptionsAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Options Analysis Error", description: performAiOptionsAnalysisState.message });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: performAiOptionsAnalysisState.error, message: performAiOptionsAnalysisState.message, aiOptionsAnalysisRequestJson: performAiOptionsAnalysisState.data?.aiOptionsAnalysisRequestJson } });
    }
  }, [performAiOptionsAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);

  // --- Step 12 & 13 & 14: Chat Summary (POST_OPTIONS_ANALYSIS -> AWAITING_TRIGGER -> TRIGGER -> GENERATING -> SUCCEEDED/FAILED) ---
   useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Effect for OPTIONS_ANALYSIS_SUCCEEDED/FAILED. Current fsmState: ${fsmState}. isFullAnalysis: ${isFullAnalysisTriggered}. analysisTickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.OPTIONS_ANALYSIS_SUCCEEDED || fsmState === FsmState.OPTIONS_ANALYSIS_FAILED) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
         dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: "Ticker reference missing post Options Analysis.", message: "Internal error for Chat Summary." } }); return;
      }
      if (isFullAnalysisTriggered) {
        let snapshotData: StockSnapshotData | null = null;
        if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `POST_OPT_Effect:${currentActionTicker}`, 'Snapshot_ChatSum') ||
            !(snapshotData = JSON.parse(contextStockSnapshotJson!)) ||
            snapshotData.ticker !== currentActionTicker) {
          logDebug('FSM_PIPELINE', `MainTabContent: POST_OPT - Snapshot for Chat Summary for ${currentActionTicker} not ready/INCONSISTENT. Waiting.`); return;
        }
        if (!isDataReadyForProcessing(contextStandardTasJson, logDebug, `POST_OPT_Effect:${currentActionTicker}`, 'StdTA_ChatSum') ||
            !isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, `POST_OPT_Effect:${currentActionTicker}`, 'AITA_ChatSum') ||
            !isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, `POST_OPT_Effect:${currentActionTicker}`, 'KeyTakeaways_ChatSum') ||
            !isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, `POST_OPT_Effect:${currentActionTicker}`, 'Options_ChatSum') || // Result of options analysis
            !isDataReadyForProcessing(contextMarketStatusJson, logDebug, `POST_OPT_Effect:${currentActionTicker}`, 'MarketStatus_ChatSum')) {
          logDebug('FSM_PIPELINE', `MainTabContent: POST_OPT - Not all prerequisites for Chat Summary for ${currentActionTicker} are ready. Waiting.`); return;
        }
        logDebug('FSM_PIPELINE', `MainTabContent: POST_OPT - All prerequisites for Chat Summary for ${currentActionTicker} READY. Dispatching INITIATE_CHAT_SUMMARY_SEQUENCE.`);
        dispatchFsmEvent({ type: 'INITIATE_CHAT_SUMMARY_SEQUENCE' });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: POST_OPT - "Analyze Stock" flow complete for ${currentActionTicker}. Dispatching PROCEED_TO_ANALYZE_STOCK_COMPLETE.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_ANALYZE_STOCK_COMPLETE' });
      }
    }
  }, [fsmState, isFullAnalysisTriggered, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson, dispatchFsmEvent, logDebug]);
  
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Chat_Summary AWAITING Effect. fsmState: ${fsmState}. TickerRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AWAITING_CHAT_SUMMARY_TRIGGER) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) {
        dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: "Ticker reference missing for Chat Summary.", message: "Internal error for Chat Summary." } }); return;
      }
      // All data assumed ready and consistent from previous step (POST_OPTIONS_ANALYSIS effect)
      logDebug('FSM_PIPELINE', `MainTabContent: AWAIT_CS - Prerequisites for ${currentActionTicker} assumed READY. Dispatching TRIGGER_CHAT_SUMMARY.`);
      dispatchFsmEvent({ type: 'TRIGGER_CHAT_SUMMARY' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]); // Removed context data dependencies as checks are done before this state is entered.

  useEffect(() => {
    if (fsmState === FsmState.GENERATING_CHAT_SUMMARY && analysisTriggeredForTickerRef.current && !isGenerateChatSummaryPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      // Final consistency check for snapshot before action call
      let snapshotData: StockSnapshotData | null = null; try { if(contextStockSnapshotJson) snapshotData = JSON.parse(contextStockSnapshotJson); } catch(e){}
      if (!snapshotData || snapshotData.ticker !== currentActionTicker ||
          !isDataReadyForProcessing(contextStandardTasJson) || !isDataReadyForProcessing(contextAiAnalyzedTaJson) ||
          !isDataReadyForProcessing(contextAiKeyTakeawaysJson) || !isDataReadyForProcessing(contextAiOptionsAnalysisJson) ||
          !isDataReadyForProcessing(contextMarketStatusJson) ) {
        dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: `Data inconsistency/not ready right before Chat Summary call for ${currentActionTicker}.`, message: 'Data inconsistency for Chat Summary.' } }); return;
      }
      const payload: GenerateChatSummaryActionInputsType = { ticker: currentActionTicker, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, aiKeyTakeawaysJson: contextAiKeyTakeawaysJson!, aiOptionsAnalysisJson: contextAiOptionsAnalysisJson!, marketStatusJson: contextMarketStatusJson! };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling generateChatSummaryFormAction for ${currentActionTicker}.`);
      startTransition(() => { generateChatSummaryFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson, generateChatSummaryFormAction, isGenerateChatSummaryPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (generateChatSummaryState.status === 'idle' || fsmState !== FsmState.GENERATING_CHAT_SUMMARY) return;
    if (generateChatSummaryState.status === 'success' && generateChatSummaryState.data) {
      toast({ title: "Chat Summary Generated", description: generateChatSummaryState.message });
      dispatchFsmEvent({ type: 'CHAT_SUMMARY_SUCCESS', payload: generateChatSummaryState.data });
    } else if (generateChatSummaryState.status === 'error') {
      toast({ variant: "destructive", title: "Chat Summary Error", description: generateChatSummaryState.message });
      dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: generateChatSummaryState.error, message: generateChatSummaryState.message, requestJson: generateChatSummaryState.data?.requestJson } });
    }
  }, [generateChatSummaryState, fsmState, dispatchFsmEvent, toast, logDebug]);

  // --- Step 15 & 16: Final Completion to IDLE ---
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Effect for CHAT_SUMMARY_SUCCEEDED/FAILED or ANALYZE_STOCK_COMPLETE. Current fsmState: ${fsmState}.`);
    if (fsmState === FsmState.CHAT_SUMMARY_SUCCEEDED || fsmState === FsmState.CHAT_SUMMARY_FAILED) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. Dispatching PROCEED_TO_FULL_COMPLETE.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_FULL_COMPLETE' });
    } else if (fsmState === FsmState.ANALYZE_STOCK_COMPLETE || fsmState === FsmState.FULL_ANALYSIS_COMPLETE) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. Dispatching PROCEED_TO_IDLE.`);
      dispatchFsmEvent({ type: 'PROCEED_TO_IDLE' }); 
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  // Handle interactive chat messages 
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
      marketStatus: JSON.parse(contextMarketStatusJson || '{}'),
      stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
      standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'),
      aiAnalyzedTechnicalAnalysis: JSON.parse(contextAiAnalyzedTaJson || '{}'),
      aiKeyTakeaways: JSON.parse(contextAiKeyTakeawaysJson || '{}'),
      optionsChain: JSON.parse(contextOptionsChainJson || '{}'),
      aiOptionsAnalysis: JSON.parse(contextAiOptionsAnalysisJson || '{}'),
    };
  }, [contextMarketStatusJson, contextStockSnapshotJson, contextStandardTasJson, contextOptionsChainJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, tickerInput]);

  const isDataReadyForCombinedExport =
    isDataReadyForProcessing(contextMarketStatusJson, undefined, 'ExportCheck', 'MarketStatus') &&
    isDataReadyForProcessing(contextStockSnapshotJson, undefined, 'ExportCheck', 'StockSnapshot') &&
    isDataReadyForProcessing(contextStandardTasJson, undefined, 'ExportCheck', 'StandardTAs') &&
    isDataReadyForProcessing(contextOptionsChainJson, undefined, 'ExportCheck', 'OptionsChain') &&
    isDataReadyForProcessing(contextAiAnalyzedTaJson, undefined, 'ExportCheck', 'AiAnalyzedTA') &&
    isDataReadyForProcessing(contextAiKeyTakeawaysJson, undefined, 'ExportCheck', 'AiKeyTakeaways') &&
    isDataReadyForProcessing(contextAiOptionsAnalysisJson, undefined, 'ExportCheck', 'AiOptionsAnalysis');

  const handleExportAllToJson = useCallback(async () => {
    logDebug('MainTabContent', 'Export All to JSON clicked.');
    if (!isDataReadyForCombinedExport) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'Not all data sections are available for export.' });
      return;
    }
    try {
      const combinedData = getCombinedDataForExport();
      const filename = `${combinedData.ticker || 'StockSage'}_full_analysis_${new Date().toISOString().split('T')[0]}.json`;
      downloadJson(combinedData, filename);
      toast({ title: 'Export Successful', description: `All data exported to ${filename}` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export Error', description: `Could not export data: ${e.message}` });
    }
  }, [isDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  const handleCopyAllToJson = useCallback(async () => {
    logDebug('MainTabContent', 'Copy All to JSON clicked.');
     if (!isDataReadyForCombinedExport) {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Not all data sections are available for copy.' });
      return;
    }
    try {
      const combinedData = getCombinedDataForExport();
      const success = await copyToClipboard(JSON.stringify(combinedData, null, 2));
      if (success) {
        toast({ title: 'Copied to Clipboard', description: 'All data copied as JSON.' });
      } else {
        throw new Error('Clipboard API failed.');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Copy Error', description: `Could not copy data: ${e.message}` });
    }
  }, [isDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  const activeTickerForDisplay = analysisTriggeredForTickerRef.current || tickerInput;
  const isFormDisabled = isPipelineActive;
  const isAnalyzeStockButtonPending = isPipelineActive && !isFullAnalysisTriggered; 
  const isFullAnalysisButtonPending = isPipelineActive && isFullAnalysisTriggered;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis</CardTitle>
        <CardDescription>
          Enter a stock ticker. &quot;Analyze Stock&quot; provides data, AI TA, Key Takeaways, and Options Analysis. &quot;AI Full Stock Analysis&quot; adds a chat summary. FSM: {fsmState}
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
    
