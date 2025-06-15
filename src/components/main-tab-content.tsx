
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
// Removed: import { generateChatSummaryAction, type GenerateChatSummaryActionState, type GenerateChatSummaryResult, type GenerateChatSummaryActionInputs as GenerateChatSummaryActionInputsType } from "@/actions/generate-chat-summary-action"; 

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
// Removed: const initialGenerateChatSummaryState: GenerateChatSummaryActionState = { 
//   status: 'idle', data: undefined, error: null, message: null,
// };
const initialChatActionState: ChatActionState = { 
  status: 'idle', data: undefined, error: null, message: null,
};

const PENDING_STATUS_JSON = '{ "status": "pending..." }'; 

function isDataReadyForProcessing(jsonString: string | null | undefined, logDebugFn?: Function, sourceComponent?: string, dataName?: string): boolean {
  const callContext = `${sourceComponent || 'isDataReadyForProcessing'}:${dataName || 'data'}`;
  if (!jsonString || jsonString === '{}' || jsonString.trim() === PENDING_STATUS_JSON) {
    logDebugFn?.(callContext, `Data is not ready (null, empty, or generic pending). Value: '${jsonString?.substring(0,50)}...'`);
    return false;
  }
  
  try {
    const parsed = JSON.parse(jsonString.trim());
    if (parsed && typeof parsed === 'object') {
      if (parsed.status && (parsed.status.includes('error') || parsed.status.includes('skipped') || parsed.status.includes('pending') || parsed.status.includes('initializing'))) {
        logDebugFn?.(callContext, `Data not ready (JSON indicates error/skipped/pending status). Value: '${jsonString.trim().substring(0,100)}...'`);
        return false;
      }
      if (parsed.error) { 
        logDebugFn?.(callContext, `Data not ready (JSON contains direct error field). Value: '${jsonString.trim().substring(0,100)}...'`);
        return false;
      }
    }
  } catch(e) {
    logDebugFn?.(callContext, `Data is not a known status/error JSON, but failed to parse. Treating as not ready. Value: '${jsonString.trim().substring(0,100)}...'`);
    return false; 
  }
  logDebugFn?.(callContext, `Data IS ready (passed checks). Value: '${jsonString.trim().substring(0,100)}...'`);
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
    isFullAnalysisTriggered, 
    logDebug,
    fsmState,
    dispatchFsmEvent,
    chatHistory, 
  } = useStockAnalysis();
  
  logDebug('FSM_PIPELINE', `MainTabContent RENDER: fsmState=${fsmState}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}, activeAnalysisTicker=${activeAnalysisTicker}, isFullAnalysisTriggered=${isFullAnalysisTriggered}`);

  const [analyzeStockState, analyzeStockFormAction, isAnalyzeStockPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(fetchStockDataAction, initialStockDataFetchState);
  const [analyzeTaState, analyzeTaFormAction, isAnalyzeTaPending] = useActionState<AnalyzeTaActionState, { stockSnapshotJson: string, ticker?: string }>(analyzeTaAction, initialAnalyzeTaState);
  const [performAiAnalysisState, performAiAnalysisFormAction, isPerformAiAnalysisPending] = useActionState<PerformAiAnalysisActionState, PerformAiAnalysisActionInputs>(performAiAnalysisAction, initialPerformAiAnalysisState);
  const [performAiOptionsAnalysisState, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending] = useActionState<PerformAiOptionsAnalysisActionState, PerformAiOptionsAnalysisActionInputsType>(performAiOptionsAnalysisAction, initialPerformAiOptionsAnalysisState);
  // Removed: const [generateChatSummaryState, generateChatSummaryFormAction, isGenerateChatSummaryPending] = useActionState<GenerateChatSummaryActionState, GenerateChatSummaryActionInputsType>(generateChatSummaryAction, initialGenerateChatSummaryState);
  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(chatServerAction, initialChatActionState);
  
  const isPipelineActive = ![FsmState.IDLE, FsmState.FULL_ANALYSIS_COMPLETE, FsmState.STALE_DATA_FROM_ACTION_ERROR].includes(fsmState);

  const handleAnalyzeStockButtonSubmit = useCallback((event?: FormEvent<HTMLFormElement>) => { // Renamed from handleAnalyzeStockSubmit
    event?.preventDefault();
    if (isPipelineActive) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" }); return;
    }
    analysisTriggeredForTickerRef.current = tickerInput; 
    setActiveAnalysisTicker(tickerInput);
    logDebug('MainTabContent', `"Analyze Stock" button clicked for ${tickerInput}. This triggers a FULL analysis. Current FSM State: ${fsmState}`);
    dispatchFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: tickerInput } });
  }, [isPipelineActive, toast, tickerInput, dispatchFsmEvent, logDebug, fsmState]);


  useEffect(() => {
    if (fsmState === FsmState.IDLE || fsmState === FsmState.STALE_DATA_FROM_ACTION_ERROR) {
      logDebug('FSM_PIPELINE', `MainTabContent: FSM is ${fsmState}. Resetting analysisTriggeredForTickerRef and activeAnalysisTicker from ${analysisTriggeredForTickerRef.current} / ${activeAnalysisTicker} to null.`);
      analysisTriggeredForTickerRef.current = null;
      setActiveAnalysisTicker(null);
      if(fsmState === FsmState.STALE_DATA_FROM_ACTION_ERROR) {
        dispatchFsmEvent({ type: 'PROCEED_TO_IDLE'});
      }
    }
  }, [fsmState, logDebug, activeAnalysisTicker, dispatchFsmEvent]);

  useEffect(() => {
    if (fsmState === FsmState.INITIALIZING_ANALYSIS) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected INITIALIZING_ANALYSIS. Dispatching INITIALIZATION_COMPLETE.`);
      dispatchFsmEvent({ type: 'INITIALIZATION_COMPLETE' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Detected AWAITING_DATA_FETCH_TRIGGER. Dispatching TRIGGER_DATA_FETCH.`);
      dispatchFsmEvent({ type: 'TRIGGER_DATA_FETCH' });
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.FETCHING_DATA && activeAnalysisTicker && !isAnalyzeStockPending) {
      const payload = { ticker: activeAnalysisTicker };
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in FETCHING_DATA for ${activeAnalysisTicker}. Calling analyzeStockFormAction.`);
      startTransition(() => { analyzeStockFormAction(payload); });
    }
  }, [fsmState, analyzeStockFormAction, isAnalyzeStockPending, logDebug, activeAnalysisTicker]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Data Fetch Action state changed. FSM State: ${fsmState}, Action Status: ${analyzeStockState.status}, Expected Ticker (analysisTriggeredForTickerRef): ${analysisTriggeredForTickerRef.current}`);
    if (analyzeStockState.status === 'idle' || fsmState !== FsmState.FETCHING_DATA) {
       if (analyzeStockState.status !== 'idle') {
        logDebug('FSM_PIPELINE', `MainTabContent: Data Fetch Action state changed, but FSM not in FETCHING_DATA or action idle. Ignoring. State: ${fsmState}, Action: ${analyzeStockState.status}`);
       }
       return;
    }
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
          logDebug('FSM_PIPELINE', "Error parsing snapshot from action state data to check ticker consistency.", e);
        }
      }
      
      if (isDataConsistent) {
        toast({ title: "Data Fetched", description: analyzeStockState.message || `Data for ${currentExpectedTicker} fetched.` });
        dispatchFsmEvent({ type: 'FETCH_DATA_SUCCESS', payload: analyzeStockState.data as StockDataFetchResult });
      } else {
        const errorMsg = `Stale data detected in fetch action result. Expected: ${currentExpectedTicker}, Got: ${actionDataTicker || 'Unknown'}.`;
        logDebug('FSM_PIPELINE', `CRITICAL: ${errorMsg} analyzeStockState.data:`, analyzeStockState.data);
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
    logDebug('FSM_PIPELINE', `MainTabContent: DATA_FETCH_SUCCEEDED/FAILED Effect. fsmState: ${fsmState}. analysisRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.DATA_FETCH_SUCCEEDED) {
        const currentActionTicker = analysisTriggeredForTickerRef.current;
        if (!currentActionTicker) {
            logDebug('FSM_PIPELINE', `DATA_FETCH_SUCCEEDED: No analysis ticker ref. This should not happen. Dispatching AI_TA_FAILURE.`);
            dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: "ConsistencyCheck: Ticker reference missing after data fetch.", message: "Internal error." } });
            return;
        }
        if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `MTC_DATA_FETCH_SUCCEEDED:${currentActionTicker}`, 'Snapshot')) {
            logDebug('FSM_PIPELINE', `DATA_FETCH_SUCCEEDED: Snapshot for ${currentActionTicker} not ready in context. Waiting.`);
            return;
        }
        let snapshotData: StockSnapshotData | null = null;
        try { snapshotData = JSON.parse(contextStockSnapshotJson!); } 
        catch (e) {
            logDebug('FSM_PIPELINE', `DATA_FETCH_SUCCEEDED: Error parsing snapshot JSON for ${currentActionTicker}. Cannot proceed.`, e);
            dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: `ConsistencyCheck: Failed to parse snapshot for ${currentActionTicker}`, message: "Corrupted snapshot data." } });
            return;
        }
        if (snapshotData?.ticker !== currentActionTicker) {
            logDebug('FSM_PIPELINE', `DATA_FETCH_SUCCEEDED: Snapshot for ${currentActionTicker} INCONSISTENT in context (found ${snapshotData?.ticker}). Waiting.`);
            return;
        }
        logDebug('FSM_PIPELINE', `DATA_FETCH_SUCCEEDED: Snapshot for ${currentActionTicker} ready and consistent in context. Dispatching INITIATE_AI_TA_SEQUENCE.`);
        dispatchFsmEvent({ type: 'INITIATE_AI_TA_SEQUENCE' });
    } else if (fsmState === FsmState.DATA_FETCH_FAILED || fsmState === FsmState.STALE_DATA_FROM_ACTION_ERROR) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. Dispatching PROCEED_TO_IDLE.`);
        dispatchFsmEvent({ type: 'PROCEED_TO_IDLE' });
    }
  }, [fsmState, contextStockSnapshotJson, dispatchFsmEvent, logDebug]);


  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AI_TA AWAITING Effect. fsmState: ${fsmState}. analysisRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState !== FsmState.AWAITING_AI_TA_TRIGGER) return;

    const currentActionTicker = analysisTriggeredForTickerRef.current;
    if (!currentActionTicker) {
      logDebug('FSM_PIPELINE', `AWAITING_AI_TA_TRIGGER: No analysis ticker ref. Dispatching AI_TA_FAILURE.`);
      dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: "NoAnalysisTicker: Ticker reference missing for AI TA.", message: "Internal error for AI TA." } });
      return;
    }
    
    if (!isDataReadyForProcessing(contextStockSnapshotJson, logDebug, `MTC_AWAIT_AITA:${currentActionTicker}`, 'Snapshot')) {
      logDebug('FSM_PIPELINE', `AWAITING_AI_TA_TRIGGER: Snapshot for ${currentActionTicker} not yet ready in context. Waiting.`);
      return; 
    }
    let snapshotDataForAction: StockSnapshotData | null = null;
    try { snapshotDataForAction = JSON.parse(contextStockSnapshotJson!); } 
    catch(e) {
      logDebug('FSM_PIPELINE', `AWAITING_AI_TA_TRIGGER: Error parsing snapshot JSON for ${currentActionTicker}. Dispatching AI_TA_FAILURE.`, e);
      dispatchFsmEvent({ type: 'AI_TA_FAILURE', payload: { error: `SnapshotParse: Failed to parse snapshot for ${currentActionTicker}`, message: "Corrupted snapshot data for AI TA." } });
      return;
    }
    if (snapshotDataForAction?.ticker !== currentActionTicker) {
      logDebug('FSM_PIPELINE', `AWAITING_AI_TA_TRIGGER: Snapshot for ${currentActionTicker} INCONSISTENT in context (found ${snapshotDataForAction?.ticker}). Waiting.`);
      return; 
    }
    
    logDebug('FSM_PIPELINE', `AWAITING_AI_TA_TRIGGER: Snapshot for ${currentActionTicker} ready and consistent. Dispatching TRIGGER_AI_TA.`);
    dispatchFsmEvent({ type: 'TRIGGER_AI_TA' });
    
  }, [fsmState, contextStockSnapshotJson, dispatchFsmEvent, logDebug]); 


  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_TA Effect Check. fsmState: ${fsmState}. isPending: ${isAnalyzeTaPending}. analysisRef: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.ANALYZING_TA && analysisTriggeredForTickerRef.current && !isAnalyzeTaPending) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      const payload = { stockSnapshotJson: contextStockSnapshotJson!, ticker: currentActionTicker };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling analyzeTaFormAction for ${currentActionTicker}.`);
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

  
  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: AI_TA_SUCCEEDED/FAILED Effect. fsmState: ${fsmState}. analysisRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.AI_TA_SUCCEEDED || fsmState === FsmState.AI_TA_FAILED) {
      const currentActionTicker = analysisTriggeredForTickerRef.current;
      if (!currentActionTicker) { return; }

      const checks = [
        { name: 'Snapshot', json: contextStockSnapshotJson, checkTicker: true },
        { name: 'StdTA', json: contextStandardTasJson },
        { name: 'AITAResult', json: contextAiAnalyzedTaJson },
        { name: 'MarketStatus', json: contextMarketStatusJson },
      ];
      let allPrereqsReady = true;
      for (const check of checks) {
        if (!isDataReadyForProcessing(check.json, logDebug, `MTC_POST_AITA:${currentActionTicker}`, check.name)) {
            allPrereqsReady = false; break;
        }
        if (check.checkTicker) {
            try {
                const parsed = JSON.parse(check.json!);
                if (parsed.ticker !== currentActionTicker) {
                    allPrereqsReady = false; 
                    logDebug('FSM_PIPELINE', `MTC_POST_AITA:${currentActionTicker}: ${check.name} INCONSISTENT (found ${parsed.ticker}). Waiting.`);
                    break;
                }
            } catch { allPrereqsReady = false; break; }
        }
      }
      
      if (allPrereqsReady) {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} for ${currentActionTicker}. All prerequisites for Key Takeaways READY. Dispatching INITIATE_KEY_TAKEAWAYS_SEQUENCE.`);
        dispatchFsmEvent({ type: 'INITIATE_KEY_TAKEAWAYS_SEQUENCE' });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} for ${currentActionTicker}, but prerequisites for Key Takeaways NOT YET READY. Waiting for context update.`);
      }
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, dispatchFsmEvent, logDebug]);


  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Key_Takeaways AWAITING Effect. fsmState: ${fsmState}. analysisRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState !== FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER) return;
    const currentActionTicker = analysisTriggeredForTickerRef.current;
    if (!currentActionTicker) { return; }
    logDebug('FSM_PIPELINE', `AWAITING_KEY_TAKEAWAYS_TRIGGER: Prerequisites for ${currentActionTicker} should be READY. Dispatching TRIGGER_KEY_TAKEAWAYS.`);
    dispatchFsmEvent({ type: 'TRIGGER_KEY_TAKEAWAYS' });
  }, [fsmState, dispatchFsmEvent, logDebug]);


  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_KEY_TAKEAWAYS Effect Check. fsmState: ${fsmState}. isPending: ${isPerformAiAnalysisPending}. analysisRef: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.GENERATING_KEY_TAKEAWAYS && analysisTriggeredForTickerRef.current && !isPerformAiAnalysisPending) {
      const payload: PerformAiAnalysisActionInputs = { ticker: analysisTriggeredForTickerRef.current, stockSnapshotJson: contextStockSnapshotJson!, standardTasJson: contextStandardTasJson!, aiAnalyzedTaJson: contextAiAnalyzedTaJson!, marketStatusJson: contextMarketStatusJson! };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiAnalysisFormAction (Key Takeaways) for ${analysisTriggeredForTickerRef.current}.`);
      startTransition(() => { performAiAnalysisFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, performAiAnalysisFormAction, isPerformAiAnalysisPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Key Takeaways Action state changed. FSM State: ${fsmState}, Action Status: ${performAiAnalysisState.status}`);
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
    logDebug('FSM_PIPELINE', `MainTabContent: KEY_TAKEAWAYS_SUCCEEDED/FAILED Effect. fsmState: ${fsmState}. analysisRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.KEY_TAKEAWAYS_SUCCEEDED || fsmState === FsmState.KEY_TAKEAWAYS_FAILED) {
        const currentActionTicker = analysisTriggeredForTickerRef.current;
        if (!currentActionTicker) { return; }

        const checks = [
          { name: 'Snapshot', json: contextStockSnapshotJson, checkTicker: true },
          { name: 'OptionsChain', json: contextOptionsChainJson },
        ];
        let allPrereqsReady = true;
        for (const check of checks) {
          if (!isDataReadyForProcessing(check.json, logDebug, `MTC_POST_KT:${currentActionTicker}`, check.name)) {
              allPrereqsReady = false; break;
          }
          if (check.checkTicker) { 
              try {
                  const parsed = JSON.parse(check.json!);
                  if (parsed.ticker !== currentActionTicker) {
                      allPrereqsReady = false; 
                      logDebug('FSM_PIPELINE', `MTC_POST_KT:${currentActionTicker}: ${check.name} INCONSISTENT (found ${parsed.ticker}). Waiting.`);
                      break;
                  }
              } catch { allPrereqsReady = false; break; }
          }
        }
        
        if(allPrereqsReady) {
            logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} for ${currentActionTicker}. Prerequisites for Options Analysis READY. Dispatching INITIATE_OPTIONS_ANALYSIS_SEQUENCE.`);
            dispatchFsmEvent({ type: 'INITIATE_OPTIONS_ANALYSIS_SEQUENCE' });
        } else {
            logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} for ${currentActionTicker}, but prerequisites for Options Analysis NOT YET READY. Waiting for context update.`);
        }
    }
  }, [fsmState, contextStockSnapshotJson, contextOptionsChainJson, dispatchFsmEvent, logDebug]);


  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Options_Analysis AWAITING Effect. fsmState: ${fsmState}. analysisRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState !== FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER) return;
    const currentActionTicker = analysisTriggeredForTickerRef.current;
    if (!currentActionTicker) { return; }
    logDebug('FSM_PIPELINE', `AWAITING_OPTIONS_ANALYSIS_TRIGGER: Prerequisites for ${currentActionTicker} should be READY. Dispatching TRIGGER_OPTIONS_ANALYSIS.`);
    dispatchFsmEvent({ type: 'TRIGGER_OPTIONS_ANALYSIS' });
  }, [fsmState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_OPTIONS Effect Check. fsmState: ${fsmState}. isPending: ${isPerformAiOptionsAnalysisPending}. analysisRef: ${analysisTriggeredForTickerRef.current}.`);
    if (fsmState === FsmState.ANALYZING_OPTIONS && analysisTriggeredForTickerRef.current && !isPerformAiOptionsAnalysisPending) {
      const payload: PerformAiOptionsAnalysisActionInputsType = { ticker: analysisTriggeredForTickerRef.current, optionsChainJson: contextOptionsChainJson!, stockSnapshotJson: contextStockSnapshotJson! };
      logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiOptionsAnalysisFormAction for ${analysisTriggeredForTickerRef.current}.`);
      startTransition(() => { performAiOptionsAnalysisFormAction(payload); });
    }
  }, [fsmState, contextStockSnapshotJson, contextOptionsChainJson, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending, dispatchFsmEvent, logDebug]);


  useEffect(() => {
    logDebug('FSM_PIPELINE', `MainTabContent: Options Analysis Action state changed. FSM State: ${fsmState}, Action Status: ${performAiOptionsAnalysisState.status}`);
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
    // This effect now handles the transition from Options Analysis (success or fail) to FULL_ANALYSIS_COMPLETE
    logDebug('FSM_PIPELINE', `MainTabContent: OPTIONS_ANALYSIS_SUCCEEDED/FAILED Effect. fsmState: ${fsmState}. analysisRef: ${analysisTriggeredForTickerRef.current}`);
    if (fsmState === FsmState.OPTIONS_ANALYSIS_SUCCEEDED || fsmState === FsmState.OPTIONS_ANALYSIS_FAILED) {
        const currentActionTicker = analysisTriggeredForTickerRef.current;
        if (!currentActionTicker) { return; }
        logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState} for ${currentActionTicker}. All automated analysis steps complete. Dispatching PROCEED_TO_IDLE (indirectly via FULL_ANALYSIS_COMPLETE).`);
        // The FSM reducer will handle transitioning OPTIONS_ANALYSIS_SUCCEEDED/FAILED to FULL_ANALYSIS_COMPLETE
        // No need to dispatch anything specific here to trigger next FSM state if reducer handles it directly.
        // The next useEffect for FULL_ANALYSIS_COMPLETE will then proceed to IDLE.
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);
  
  
  useEffect(() => {
    // This effect handles the transition from FULL_ANALYSIS_COMPLETE to IDLE
    logDebug('FSM_PIPELINE', `MainTabContent: Effect for FULL_ANALYSIS_COMPLETE. Current fsmState: ${fsmState}.`);
    if (fsmState === FsmState.FULL_ANALYSIS_COMPLETE) { 
      logDebug('FSM_PIPELINE', `MainTabContent: Detected ${fsmState}. Dispatching PROCEED_TO_IDLE.`);
      dispatchFsmEvent({ type: 'PROCEED_TO_IDLE' }); 
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  
  useEffect(() => {
    if (chatActionState.status === 'idle' || ![FsmState.IDLE, FsmState.FULL_ANALYSIS_COMPLETE].includes(fsmState) ) { 
      if (chatActionState.status !== 'idle' && ![FsmState.IDLE, FsmState.FULL_ANALYSIS_COMPLETE].includes(fsmState)) {
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

  const currentTickerForChatDisplay = activeAnalysisTicker || tickerInput;
  const isFormDisabled = isPipelineActive;
  const analyzeButtonIsPending = isPipelineActive; 

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis</CardTitle>
        <CardDescription>
          Enter a stock ticker. The "Analyze Stock" button performs a full data fetch and AI analysis (Key Metrics, Snapshot, TAs, AI TA, Key Takeaways, Options Analysis). Use the Chatbot below to ask questions. FSM: {fsmState}
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
              disabled={isFormDisabled || analyzeButtonIsPending }>
              { analyzeButtonIsPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
              <Zap className="mr-2 h-4 w-4" /> Analyze Stock
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
            currentTicker={currentTickerForChatDisplay}
          />
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}
    
