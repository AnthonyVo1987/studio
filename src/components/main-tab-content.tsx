
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

import { useStockAnalysis, type ChatMessage, FsmState } from "@/contexts/stock-analysis-context"; 
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap, Brain, BarChartBig } from "lucide-react"; 
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
const initialChatActionState: ChatActionState = { 
  status: 'idle', data: undefined, error: null, message: null,
};

const PENDING_STATUS_JSON = '{ "status": "pending..." }'; 

function isDataReadyForProcessing(jsonString: string | null | undefined, logDebugFn?: Function, sourceComponent?: string, dataName?: string): boolean {
  const callContext = `${sourceComponent || 'isDataReadyForProcessing'}:${dataName || 'data'}`;
  if (!jsonString || jsonString === '{}' || jsonString.trim() === PENDING_STATUS_JSON) {
    logDebugFn?.(sourceComponent || 'isDataReadyForProcessing', 'Check', `${callContext} Data is not ready (null, empty, or generic pending). Value: '${jsonString?.substring(0,50)}...'`);
    return false;
  }
  
  try {
    const parsed = JSON.parse(jsonString.trim());
    if (parsed && typeof parsed === 'object') {
      if (parsed.status && (parsed.status.includes('error') || parsed.status.includes('skipped') || parsed.status.includes('pending') || parsed.status.includes('initializing'))) {
        logDebugFn?.(sourceComponent || 'isDataReadyForProcessing','Check', `${callContext} Data not ready (JSON indicates error/skipped/pending status). Value: '${jsonString.trim().substring(0,100)}...'`);
        return false;
      }
      if (parsed.error) { 
        logDebugFn?.(sourceComponent || 'isDataReadyForProcessing','Check', `${callContext} Data not ready (JSON contains direct error field). Value: '${jsonString.trim().substring(0,100)}...'`);
        return false;
      }
    }
  } catch(e) {
    logDebugFn?.(sourceComponent || 'isDataReadyForProcessing','Check', `${callContext} Data is not a known status/error JSON, but failed to parse. Treating as not ready. Value: '${jsonString.trim().substring(0,100)}...'`);
    return false; 
  }
  logDebugFn?.(sourceComponent || 'isDataReadyForProcessing','Check', `${callContext} Data IS ready (passed checks). Value: '${jsonString.trim().substring(0,100)}...'`);
  return true;
}


export function MainTabContent() {
  const [tickerInput, setTickerInput] = useState("NVDA");
  const analysisTriggeredForTickerRef = useRef<string | null>(null);
  const [activeAnalysisTicker, setActiveAnalysisTicker] = useState<string | null>(null);


  const { toast } = useToast();
  const {
    marketStatusJson: contextMarketStatusJson,
    stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson,
    optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson,
    aiKeyTakeawaysJson: contextAiKeyTakeawaysJson,
    aiOptionsAnalysisJson: contextAiOptionsAnalysisJson,
    logDebug,
    fsmState,
    dispatchFsmEvent,
    addChatMessage, 
  } = useStockAnalysis();
  
  logDebug('MainTabContent', 'FSM_STATE_RENDER', `MainTabContent RENDER: fsmState=${fsmState}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}, activeAnalysisTicker=${activeAnalysisTicker}`);

  const [analyzeStockState, analyzeStockFormAction, isAnalyzeStockPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(fetchStockDataAction, initialStockDataFetchState);
  const [analyzeTaState, analyzeTaFormAction, isAnalyzeTaPending] = useActionState<AnalyzeTaActionState, { stockSnapshotJson: string, ticker?: string }>(analyzeTaAction, initialAnalyzeTaState);
  const [performAiAnalysisState, performAiAnalysisFormAction, isPerformAiAnalysisPending] = useActionState<PerformAiAnalysisActionState, PerformAiAnalysisActionInputs>(performAiAnalysisAction, initialPerformAiAnalysisState);
  const [performAiOptionsAnalysisState, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending] = useActionState<PerformAiOptionsAnalysisActionState, PerformAiOptionsAnalysisActionInputsType>(performAiOptionsAnalysisAction, initialPerformAiOptionsAnalysisState); 
  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(chatServerAction, initialChatActionState);
  
  const isAutomatedPipelineActive = ![
      FsmState.IDLE, 
      FsmState.FULL_ANALYSIS_COMPLETE, 
      FsmState.KEY_TAKEAWAYS_SUCCEEDED, // Technically FULL_ANALYSIS_COMPLETE covers these now
      FsmState.KEY_TAKEAWAYS_FAILED,
      FsmState.OPTIONS_ANALYSIS_SUCCEEDED,
      FsmState.OPTIONS_ANALYSIS_FAILED
    ].includes(fsmState);


  const handleAnalyzeStockButtonSubmit = useCallback((event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (isAutomatedPipelineActive || isPerformAiAnalysisPending || isPerformAiOptionsAnalysisPending) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" }); return;
    }
    analysisTriggeredForTickerRef.current = tickerInput; 
    setActiveAnalysisTicker(tickerInput);
    logDebug('MainTabContent', 'ButtonSubmit', `Automated "Analyze Stock" (Data + AI TA) button clicked for ${tickerInput}. Current FSM State: ${fsmState}`);
    dispatchFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: tickerInput } });
  }, [isAutomatedPipelineActive, isPerformAiAnalysisPending, isPerformAiOptionsAnalysisPending, toast, tickerInput, dispatchFsmEvent, logDebug, fsmState]);


  useEffect(() => {
    if (fsmState === FsmState.IDLE || fsmState === FsmState.STALE_DATA_FROM_ACTION_ERROR) {
      logDebug('FSM_PIPELINE', 'Effect_ResetRefs', `FSM is ${fsmState}. Resetting analysisTriggeredForTickerRef from ${analysisTriggeredForTickerRef.current} to null.`);
      analysisTriggeredForTickerRef.current = null; 
      if(fsmState === FsmState.STALE_DATA_FROM_ACTION_ERROR) {
        dispatchFsmEvent({ type: 'PROCEED_TO_IDLE'});
      }
    }
  }, [fsmState, logDebug, dispatchFsmEvent]);

  useEffect(() => {
    if (fsmState === FsmState.INITIALIZING_ANALYSIS) {
      logDebug('FSM_PIPELINE', 'Effect_InitComplete', `Detected INITIALIZING_ANALYSIS. Dispatching INITIALIZATION_COMPLETE.`);
      dispatchFsmEvent({ type: 'INITIALIZATION_COMPLETE' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER) {
      logDebug('FSM_PIPELINE', 'Effect_TriggerDataFetch', `Detected AWAITING_DATA_FETCH_TRIGGER. Dispatching TRIGGER_DATA_FETCH.`);
      dispatchFsmEvent({ type: 'TRIGGER_DATA_FETCH' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.FETCHING_DATA && activeAnalysisTicker && !isAnalyzeStockPending) {
      const payload = { ticker: activeAnalysisTicker };
      logDebug('FSM_PIPELINE', 'Effect_CallDataFetchAction', `FSM in FETCHING_DATA for ${activeAnalysisTicker}. Calling analyzeStockFormAction.`);
      startTransition(() => { analyzeStockFormAction(payload); });
    }
  }, [fsmState, analyzeStockFormAction, isAnalyzeStockPending, logDebug, activeAnalysisTicker]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', 'Effect_HandleDataFetchResult', `Data Fetch Action state changed. FSM State: ${fsmState}, Action Status: ${analyzeStockState.status}, Expected Ticker (analysisTriggeredForTickerRef): ${analysisTriggeredForTickerRef.current}`);
    if (analyzeStockState.status === 'idle' || fsmState !== FsmState.FETCHING_DATA) return;

    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      let currentExpectedTicker = analysisTriggeredForTickerRef.current;
      let actionDataTicker: string | undefined = undefined;
      let isDataConsistent = false;

      if (analyzeStockState.data.stockSnapshotJson) {
        try {
          const parsedSnapshot = JSON.parse(analyzeStockState.data.stockSnapshotJson) as StockSnapshotData;
          actionDataTicker = parsedSnapshot.ticker;
          if (actionDataTicker && currentExpectedTicker && actionDataTicker === currentExpectedTicker) {
            isDataConsistent = true;
          }
        } catch (e) {
          logDebug('FSM_PIPELINE', 'Error_ParseSnapshot', "Error parsing snapshot from action state data to check ticker consistency.", e);
        }
      }
      
      if (isDataConsistent) {
        toast({ title: "Data Fetched", description: analyzeStockState.message || `Data for ${currentExpectedTicker} fetched.` });
        dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: analyzeStockState.data as StockDataFetchResult });
      } else {
        const errorMsg = `Stale data detected in fetch action result. Expected: ${currentExpectedTicker}, Got: ${actionDataTicker || 'Unknown'}.`;
        logDebug('FSM_PIPELINE', 'Error_StaleData', `CRITICAL: ${errorMsg} analyzeStockState.data:`, analyzeStockState.data);
        toast({ variant: "destructive", title: "Data Consistency Error", description: "Stale data detected from server action. Aborting analysis." });
        dispatchFsmEvent({ 
          type: 'STALE_DATA_FROM_ACTION', 
          payload: { 
            error: "StaleDataError", 
            message: errorMsg, 
            expectedTicker: currentExpectedTicker || "UnknownExpected",
            foundTickerInSnapshot: actionDataTicker,
            actionStateData: analyzeStockState.data 
          }
        });
      }

    } else if (analyzeStockState.status === 'error') {
      toast({ variant: "destructive", title: "Data Fetch Error", description: analyzeStockState.message || "Failed to fetch data." });
      dispatchFsmEvent({ type: 'FETCH_DATA_FAILURE', payload: { error: analyzeStockState.error, message: analyzeStockState.message, polygonApiRequestLogJson: analyzeStockState.data?.polygonApiRequestLogJson, polygonApiResponseLogJson: analyzeStockState.data?.polygonApiResponseLogJson }});
    }
  }, [analyzeStockState, fsmState, dispatchFsmEvent, toast, logDebug]); 
  
  useEffect(() => {
    logDebug('FSM_PIPELINE', 'Effect_CheckDataFetchSuccess', `DATA_FETCH_SUCCEEDED/FAILED Effect. fsmState: ${fsmState}. analysisRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.DATA_FETCH_SUCCEEDED) {
        const currentActionTicker = analysisTriggeredForTickerRef.current;
        if (!currentActionTicker) {
            logDebug('FSM_PIPELINE', 'Error_NoTickerRef_DataSuccess', `DATA_FETCH_SUCCEEDED: No analysis ticker ref. This should not happen. Dispatching AI_TA_FAILURE.`);
            dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: "ConsistencyCheck: Ticker reference missing after data fetch.", message: "Internal error." } });
            return;
        }
        if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MTC_Effect_DataSuccess', `Snapshot_${currentActionTicker}`)) {
            logDebug('FSM_PIPELINE', 'Wait_SnapshotNotReady_DataSuccess', `DATA_FETCH_SUCCEEDED: Snapshot for ${currentActionTicker} not ready in context. Waiting.`);
            return;
        }
        let snapshotData: StockSnapshotData | null = null;
        try { snapshotData = JSON.parse(contextStockSnapshotJson!); } 
        catch (e) {
            logDebug('FSM_PIPELINE', 'Error_ParseSnapshot_DataSuccess', `DATA_FETCH_SUCCEEDED: Error parsing snapshot JSON for ${currentActionTicker}. Cannot proceed.`, e);
            dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: `ConsistencyCheck: Failed to parse snapshot for ${currentActionTicker}`, message: "Corrupted snapshot data." } });
            return;
        }
        if (snapshotData?.ticker !== currentActionTicker) {
            logDebug('FSM_PIPELINE', 'Wait_SnapshotInconsistent_DataSuccess', `DATA_FETCH_SUCCEEDED: Snapshot for ${currentActionTicker} INCONSISTENT in context (found ${snapshotData?.ticker}). Waiting.`);
            return;
        }
        logDebug('FSM_PIPELINE', 'Dispatch_InitiateAiTa', `DATA_FETCH_SUCCEEDED: Snapshot for ${currentActionTicker} ready and consistent in context. Dispatching INITIATE_AI_TA_SEQUENCE.`);
        dispatchFsmEvent({ type: 'INITIATE_AI_TA_SEQUENCE' });
    } else if (fsmState === FsmState.DATA_FETCH_FAILED || fsmState === FsmState.STALE_DATA_FROM_ACTION_ERROR) {
        logDebug('FSM_PIPELINE', 'Dispatch_ProceedToIdle_DataFail', `Detected ${fsmState}. Dispatching PROCEED_TO_IDLE.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_IDLE' });
    }
  }, [fsmState, contextStockSnapshotJson, dispatchFsmEvent, logDebug]);


  useEffect(() => {
    logDebug('FSM_PIPELINE', 'Effect_CheckAiTaTrigger', `AI_TA AWAITING Effect. fsmState: ${fsmState}. analysisRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState !== FsmState.AWAITING_AI_TA_TRIGGER) return;

    const currentActionTicker = analysisTriggeredForTickerRef.current;
    if (!currentActionTicker) {
      logDebug('FSM_PIPELINE', 'Error_NoTickerRef_AiTaTrigger', `AWAITING_AI_TA_TRIGGER: No analysis ticker ref. Dispatching AI_TA_FAILURE.`);
      dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: "NoAnalysisTicker: Ticker reference missing for AI TA.", message: "Internal error for AI TA." } });
      return;
    }
    
    if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MTC_Effect_AwaitAiTa', `Snapshot_${currentActionTicker}`)) {
      logDebug('FSM_PIPELINE', 'Wait_SnapshotNotReady_AiTaTrigger', `AWAITING_AI_TA_TRIGGER: Snapshot for ${currentActionTicker} not yet ready in context. Waiting.`);
      return; 
    }
    let snapshotDataForAction: StockSnapshotData | null = null;
    try { snapshotDataForAction = JSON.parse(contextStockSnapshotJson!); } 
    catch(e) {
      logDebug('FSM_PIPELINE', 'Error_ParseSnapshot_AiTaTrigger', `AWAITING_AI_TA_TRIGGER: Error parsing snapshot JSON for ${currentActionTicker}. Dispatching AI_TA_FAILURE.`, e);
      dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: `SnapshotParse: Failed to parse snapshot for ${currentActionTicker}`, message: "Corrupted snapshot data for AI TA." } });
      return;
    }
    if (snapshotDataForAction?.ticker !== currentActionTicker) {
      logDebug('FSM_PIPELINE', 'Wait_SnapshotInconsistent_AiTaTrigger', `AWAITING_AI_TA_TRIGGER: Snapshot for ${currentActionTicker} INCONSISTENT in context (found ${snapshotDataForAction?.ticker}). Waiting.`);
      return; 
    }
    
    logDebug('FSM_PIPELINE', 'Dispatch_TriggerAiTa', `AWAITING_AI_TA_TRIGGER: Snapshot for ${currentActionTicker} ready and consistent. Dispatching TRIGGER_AI_TA.`);
    dispatchFsmEvent({ type: 'TRIGGER_AI_TA' });
    
  }, [fsmState, contextStockSnapshotJson, dispatchFsmEvent, logDebug]); 


  useEffect(() => {
    logDebug('FSM_PIPELINE', 'Effect_CallAiTaAction', `ANALYZING_TA Effect Check. fsmState: ${fsmState}. isPending: ${isAnalyzeTaPending}. analysisRef: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.ANALYZING_TA && analysisTriggeredForTickerRef.current && !isAnalyzeTaPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      const payload = { stockSnapshotJson: contextStockSnapshotJson!, ticker: currentActionTicker };
      logDebug('FSM_PIPELINE', 'ActionCall_AiTa', `Calling analyzeTaFormAction for ${currentActionTicker}.`);
      startTransition(() => { analyzeTaFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, analyzeTaFormAction, isAnalyzeTaPending, logDebug, analysisTriggeredForTickerRef]);


  useEffect(() => {
    logDebug('FSM_PIPELINE', 'Effect_HandleAiTaResult', `AI TA Action state changed. FSM State: ${fsmState}, Action Status: ${analyzeTaState.status}`);
    if (analyzeTaState.status === 'idle' || fsmState !== FsmState.ANALYZING_TA) return;

    if (analyzeTaState.status === 'success' && analyzeTaState.data) {
      toast({ title: "AI TA Complete", description: analyzeTaState.message || `AI TA for ${analysisTriggeredForTickerRef.current} successful.` });
      dispatchFsmEvent({ type: 'AI_TA_SUCCESS', payload: analyzeTaState.data as AnalyzeTaResult });
    } else if (analyzeTaState.status === 'error') {
      toast({ variant: "destructive", title: "AI TA Error", description: analyzeTaState.message || "Failed to perform AI TA." });
      dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: analyzeTaState.error, message: analyzeTaState.message, aiAnalyzedTaRequestJson: analyzeTaState.data?.aiAnalyzedTaRequestJson } });
    }
  }, [analyzeTaState, fsmState, dispatchFsmEvent, toast, logDebug]);

  // This useEffect handles the transition from the end of the automated pipeline (AI_TA_SUCCEEDED/FAILED)
  // to FULL_ANALYSIS_COMPLETE, which then triggers the transition to IDLE.
  useEffect(() => {
    logDebug('FSM_PIPELINE', 'Effect_PostAiTaTransition', `AI_TA_SUCCEEDED/FAILED Effect (now terminal for auto-pipeline). fsmState: ${fsmState}.`);
    if (fsmState === FsmState.AI_TA_SUCCEEDED || fsmState === FsmState.AI_TA_FAILED) {
        logDebug('FSM_PIPELINE', 'Info_AiTaTerminal', `State is ${fsmState}. Automated pipeline part concluded. FSM should transition to FULL_ANALYSIS_COMPLETE via reducer.`);
        // The reducer now handles transitioning to FULL_ANALYSIS_COMPLETE from these states directly.
    }
  }, [fsmState, logDebug]);


  useEffect(() => {
    logDebug('FSM_PIPELINE', 'Effect_CallKeyTakeawaysAction', `GENERATING_KEY_TAKEAWAYS Effect Check. fsmState: ${fsmState}. isPending: ${isPerformAiAnalysisPending}. activeAnalysisTicker: ${activeAnalysisTicker}.`);
    if (fsmState === FsmState.GENERATING_KEY_TAKEAWAYS && activeAnalysisTicker && !isPerformAiAnalysisPending) {
      const payload: PerformAiAnalysisActionInputs = { 
        ticker: activeAnalysisTicker, 
        stockSnapshotJson: contextStockSnapshotJson!, 
        standardTasJson: contextStandardTasJson!, 
        aiAnalyzedTaJson: contextAiAnalyzedTaJson!, 
        marketStatusJson: contextMarketStatusJson! 
      };
      logDebug('FSM_PIPELINE', 'ActionCall_KeyTakeaways', `Calling performAiAnalysisFormAction (Manual Key Takeaways) for ${activeAnalysisTicker}.`);
      startTransition(() => { performAiAnalysisFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, performAiAnalysisFormAction, isPerformAiAnalysisPending, logDebug, activeAnalysisTicker]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', 'Effect_HandleKeyTakeawaysResult', `Key Takeaways Action state changed (Manual). FSM State: ${fsmState}, Action Status: ${performAiAnalysisState.status}`);
    if (performAiAnalysisState.status === 'idle' || fsmState !== FsmState.GENERATING_KEY_TAKEAWAYS) return;
    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Complete", description: performAiAnalysisState.message });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: performAiAnalysisState.data });
    } else if (performAiAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Key Takeaways Error", description: performAiAnalysisState.message });
      dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: performAiAnalysisState.error, message: performAiAnalysisState.message, aiKeyTakeawaysRequestJson: performAiAnalysisState.data?.aiKeyTakeawaysRequestJson } });
    }
  }, [performAiAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
  
  useEffect(() => {
    logDebug('FSM_PIPELINE', 'Effect_CallOptionsAnalysisAction', `ANALYZING_OPTIONS Effect Check. fsmState: ${fsmState}. isPending: ${isPerformAiOptionsAnalysisPending}. activeAnalysisTicker: ${activeAnalysisTicker}.`);
    if (fsmState === FsmState.ANALYZING_OPTIONS && activeAnalysisTicker && !isPerformAiOptionsAnalysisPending) {
      const payload: PerformAiOptionsAnalysisActionInputsType = { 
        ticker: activeAnalysisTicker, 
        optionsChainJson: contextOptionsChainJson!, 
        stockSnapshotJson: contextStockSnapshotJson! 
      };
      logDebug('FSM_PIPELINE', 'ActionCall_OptionsAnalysis', `Calling performAiOptionsAnalysisFormAction (Manual Options) for ${activeAnalysisTicker}.`);
      startTransition(() => { performAiOptionsAnalysisFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextOptionsChainJson, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending, logDebug, activeAnalysisTicker]);


  useEffect(() => {
    logDebug('FSM_PIPELINE', 'Effect_HandleOptionsAnalysisResult', `Options Analysis Action state changed (Manual). FSM State: ${fsmState}, Action Status: ${performAiOptionsAnalysisState.status}`);
    if (performAiOptionsAnalysisState.status === 'idle' || fsmState !== FsmState.ANALYZING_OPTIONS) return;
    if (performAiOptionsAnalysisState.status === 'success' && performAiOptionsAnalysisState.data) {
      toast({ title: "AI Options Analysis Complete", description: performAiOptionsAnalysisState.message });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: performAiOptionsAnalysisState.data });
    } else if (performAiOptionsAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Options Analysis Error", description: performAiOptionsAnalysisState.message });
      dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: performAiOptionsAnalysisState.error, message: performAiOptionsAnalysisState.message, aiOptionsAnalysisRequestJson: performAiOptionsAnalysisState.data?.aiOptionsAnalysisRequestJson } });
    }
  }, [performAiOptionsAnalysisState, fsmState, dispatchFsmEvent, toast, logDebug]);
  
   
  useEffect(() => {
    const currentFsmState = fsmState;
    logDebug('FSM_PIPELINE', 'Effect_CheckFullAnalysisComplete', `Effect for FULL_ANALYSIS_COMPLETE. Current fsmState: ${currentFsmState}.`);
    if (currentFsmState === FsmState.FULL_ANALYSIS_COMPLETE) { 
      logDebug('FSM_PIPELINE', 'Dispatch_Attempt_ProceedToIdle', `MainTabContent: Detected ${currentFsmState}. Attempting to dispatch PROCEED_TO_IDLE.`);
      analysisTriggeredForTickerRef.current = null; 
      dispatchFsmEvent({ type: 'PROCEED_TO_IDLE' }); 
      logDebug('FSM_PIPELINE', 'Dispatch_Called_ProceedToIdle', `MainTabContent: PROCEED_TO_IDLE dispatched after ${currentFsmState}.`);
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  
  useEffect(() => {
    if (chatActionState.status === 'idle' || ![FsmState.IDLE, FsmState.FULL_ANALYSIS_COMPLETE].includes(fsmState) ) return; 
    logDebug('MainTabContent:chatActionState', 'HandleChatActionResult', 'Interactive chat state changed while FSM is in a terminal state:', `FSM State: ${fsmState}, Chat Action Status: ${chatActionState.status}`);
    if (chatActionState.status === 'success' && chatActionState.data?.chatbotResponseJson) {
        try {
            const responseObj = JSON.parse(chatActionState.data.chatbotResponseJson);
            const uniqueSuffix = Math.random().toString(36).substring(2, 9);
            const modelMessage: ChatMessage = { id: `model_${Date.now()}_${uniqueSuffix}`, role: 'model', content: responseObj.response || "No response text." };
            dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE', payload: modelMessage }); 
        } catch (e) {
            const uniqueSuffix = Math.random().toString(36).substring(2, 9);
            const errorMessage: ChatMessage = { id: `model_error_${Date.now()}_${uniqueSuffix}`, role: 'model', content: "Sorry, I had trouble formatting my response." };
            dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE', payload: errorMessage }); 
        }
    } else if (chatActionState.status === 'error') {
        const errorMessageContent = chatActionState.message || "Sorry, an error occurred with the chat.";
        const uniqueSuffix = Math.random().toString(36).substring(2, 9);
        const errorModelMessage: ChatMessage = { id: `model_error_${Date.now()}_${uniqueSuffix}`, role: 'model', content: errorMessageContent };
        dispatchFsmEvent({type: 'ADD_CHAT_MESSAGE', payload: errorModelMessage }); 
    }
  }, [chatActionState, dispatchFsmEvent, logDebug, fsmState]);

  const getCombinedDataForExport = useCallback(() => {
    return {
      ticker: activeAnalysisTicker || tickerInput,
      marketStatus: JSON.parse(contextMarketStatusJson || '{}'),
      stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
      standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'),
      aiAnalyzedTechnicalAnalysis: JSON.parse(contextAiAnalyzedTaJson || '{}'),
      aiKeyTakeaways: JSON.parse(contextAiKeyTakeawaysJson || '{}'),
      optionsChain: JSON.parse(contextOptionsChainJson || '{}'),
      aiOptionsAnalysis: JSON.parse(contextAiOptionsAnalysisJson || '{}'),
    };
  }, [contextMarketStatusJson, contextStockSnapshotJson, contextStandardTasJson, contextOptionsChainJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, tickerInput, activeAnalysisTicker]);

  const isAllDataReadyForCombinedExport =
    isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'ExportCheck', 'MarketStatus') &&
    isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'ExportCheck', 'StockSnapshot') &&
    isDataReadyForProcessing(contextStandardTasJson, logDebug, 'ExportCheck', 'StandardTAs') &&
    isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'ExportCheck', 'OptionsChain') &&
    isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'ExportCheck', 'AiAnalyzedTA') &&
    isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, 'ExportCheck', 'AiKeyTakeaways') &&
    isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, 'ExportCheck', 'AiOptionsAnalysis');

  const handleExportAllToJson = useCallback(async () => {
    logDebug('MainTabContent', 'Export_All', 'Export All to JSON clicked.');
    if (!isAllDataReadyForCombinedExport) {
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
  }, [isAllDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  const handleCopyAllToJson = useCallback(async () => {
    logDebug('MainTabContent', 'Copy_All', 'Copy All to JSON clicked.');
     if (!isAllDataReadyForCombinedExport) {
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
  }, [isAllDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  const currentTickerForChatDisplay = activeAnalysisTicker || tickerInput;
  const analyzeButtonIsPending = isAutomatedPipelineActive || isAnalyzeStockPending; 
  
  const canRunManualAi = (fsmState === FsmState.IDLE || fsmState === FsmState.FULL_ANALYSIS_COMPLETE) && !!activeAnalysisTicker;

  const isLoadingKeyTakeaways = isPerformAiAnalysisPending && fsmState === FsmState.GENERATING_KEY_TAKEAWAYS;
  const keyTakeawaysPrereqsMet = 
    !!activeAnalysisTicker &&
    isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'KTButtonCheck', 'Snapshot') &&
    isDataReadyForProcessing(contextStandardTasJson, logDebug, 'KTButtonCheck', 'StdTA') &&
    isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'KTButtonCheck', 'AiTA') &&
    isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'KTButtonCheck', 'MarketStatus');
  const isKeyTakeawaysButtonDisabled = !canRunManualAi || !keyTakeawaysPrereqsMet || isLoadingKeyTakeaways || isAutomatedPipelineActive;

  const handleGenerateKeyTakeaways = useCallback(() => {
    if (isKeyTakeawaysButtonDisabled) {
      toast({ title: "Cannot Generate Key Takeaways", description: "Ensure initial 'Analyze Stock' (Data & AI TA) is complete and all prerequisite data is loaded.", variant: "default" });
      return;
    }
    logDebug('MainTabContent', 'ButtonSubmit_ManualKT', `Manual "Generate AI Key Takeaways" clicked for ${activeAnalysisTicker}`);
    dispatchFsmEvent({ type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS', payload: { ticker: activeAnalysisTicker! } });
  }, [isKeyTakeawaysButtonDisabled, activeAnalysisTicker, dispatchFsmEvent, toast, logDebug]);

  const isLoadingOptionsAnalysis = isPerformAiOptionsAnalysisPending && fsmState === FsmState.ANALYZING_OPTIONS;
  const optionsAnalysisPrereqsMet = 
    !!activeAnalysisTicker &&
    isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'OptButtonCheck', 'Snapshot') &&
    isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'OptButtonCheck', 'OptionsChain');
  const isOptionsAnalysisButtonDisabled = !canRunManualAi || !optionsAnalysisPrereqsMet || isLoadingOptionsAnalysis || isAutomatedPipelineActive;
  
  const handleGenerateOptionsAnalysis = useCallback(() => {
    if (isOptionsAnalysisButtonDisabled) {
      toast({ title: "Cannot Generate Options Analysis", description: "Ensure initial 'Analyze Stock' (Data & AI TA) is complete and stock snapshot & options chain data are loaded.", variant: "default" });
      return;
    }
    logDebug('MainTabContent', 'ButtonSubmit_ManualOpt', `Manual "Generate AI Options Analysis" clicked for ${activeAnalysisTicker}`);
    dispatchFsmEvent({ type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS', payload: { ticker: activeAnalysisTicker! } });
  }, [isOptionsAnalysisButtonDisabled, activeAnalysisTicker, dispatchFsmEvent, toast, logDebug]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis Input</CardTitle>
        <CardDescription>
          Enter ticker for Data Fetch & AI TA (Pivots). Then, manually trigger Key Takeaways or Options Analysis. FSM: {fsmState}
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
                disabled={analyzeButtonIsPending || isLoadingKeyTakeaways || isLoadingOptionsAnalysis}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon" disabled>
                <SelectTrigger id="dataSource" disabled={analyzeButtonIsPending || isLoadingKeyTakeaways || isLoadingOptionsAnalysis}>
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
              disabled={analyzeButtonIsPending || isLoadingKeyTakeaways || isLoadingOptionsAnalysis }>
              { analyzeButtonIsPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
              <Zap className="mr-2 h-4 w-4" /> Analyze Stock (Data & AI TA)
            </Button>
          </div>
        </form>

        <Separator />
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">On-Demand AI Analysis</CardTitle>
            <CardDescription>
              Generate specific AI insights for {activeAnalysisTicker || "the analyzed stock"}. Available after initial "Analyze Stock" (Data & AI TA) is complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button onClick={handleGenerateKeyTakeaways} className="w-full sm:w-auto" disabled={isKeyTakeawaysButtonDisabled}>
              {isLoadingKeyTakeaways && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Brain className="mr-2 h-4 w-4" /> Generate AI Key Takeaways
            </Button>
            <Button onClick={handleGenerateOptionsAnalysis} className="w-full sm:w-auto" disabled={isOptionsAnalysisButtonDisabled}>
              {isLoadingOptionsAnalysis && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <BarChartBig className="mr-2 h-4 w-4" /> Generate AI Options Analysis
            </Button>
          </CardContent>
        </Card>
        
        <Separator />

        <div className="space-y-2">
            <h3 className="text-lg font-medium">Combined Data Export</h3>
            <CardDescription>Exports Snapshot, Standard TAs, AI Analyzed TA, AI Key Takeaways, AI Options Analysis, Options Chain, and Market Status.</CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={handleExportAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isAllDataReadyForCombinedExport || isAutomatedPipelineActive || isLoadingKeyTakeaways || isLoadingOptionsAnalysis }>
                    <Download className="mr-2 h-4 w-4" /> Export All to JSON
                </Button>
                <Button onClick={handleCopyAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isAllDataReadyForCombinedExport || isAutomatedPipelineActive || isLoadingKeyTakeaways || isLoadingOptionsAnalysis}>
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
            currentTicker={currentTickerForChatDisplay}
          />
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}

