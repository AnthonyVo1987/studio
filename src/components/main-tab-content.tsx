
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
  // Check for explicit error or skipped status within the JSON itself
  // This is important because some steps might successfully return a JSON that internally denotes an error/skipped status from the AI flow
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object') {
      if (parsed.error || (parsed.status && (parsed.status.includes('error') || parsed.status.includes('skipped')))) {
        logDebugFn?.(callContext, `Data is not ready: JSON content indicates error/skipped status: '${jsonString.substring(0,100)}...'`);
        return false;
      }
       // For AI Key Takeaways, which has a specific structure
      if (dataName === 'aiKeyTakeawaysJson' && (!parsed.priceAction || !parsed.trend || !parsed.volatility || !parsed.momentum || !parsed.patterns)) {
        logDebugFn?.(callContext, `Data is not ready: AI Key Takeaways JSON missing one or more core takeaway categories.`);
        return false;
      }
      // For AI Analyzed TA (Pivot Points)
      if (dataName === 'aiAnalyzedTaJson' && parsed.pivotPoint === undefined) { // Pivot point is a good indicator
        logDebugFn?.(callContext, `Data is not ready: AI Analyzed TA JSON missing pivotPoint field.`);
        return false;
      }
       // For AI Options Analysis
      if (dataName === 'aiOptionsAnalysisJson' && parsed.callWalls === undefined && parsed.putWalls === undefined) { // Check for core structure
        logDebugFn?.(callContext, `Data is not ready: AI Options Analysis JSON missing callWalls/putWalls fields.`);
        return false;
      }
    }
  } catch(e) {
    // If JSON.parse fails, it's not valid data (unless it was one of the placeholder strings, handled above)
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
    if (fsmState === FsmState.AWAITING_DATA_FETCH_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Entered AWAITING_DATA_FETCH_TRIGGER. Current Ticker Ref: ${analysisTriggeredForTickerRef.current}`);
      if (analysisTriggeredForTickerRef.current) {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_DATA_FETCH_TRIGGER for ${analysisTriggeredForTickerRef.current}. Dispatching TRIGGER_DATA_FETCH.`);
        dispatchFsmEvent({ type: 'TRIGGER_DATA_FETCH' });
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_DATA_FETCH_TRIGGER - Ref is null. This should not happen if analysis was started. FSM will stall here.`);
      }
    }
  }, [fsmState, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.FETCHING_DATA && analysisTriggeredForTickerRef.current && !isAnalyzeStockPending) {
      const payload = { ticker: analysisTriggeredForTickerRef.current! };
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in FETCHING_DATA for ${analysisTriggeredForTickerRef.current}. Calling analyzeStockFormAction with payload:`, payload);
      startTransition(() => {
        analyzeStockFormAction(payload);
      });
    }
  }, [fsmState, analyzeStockFormAction, isAnalyzeStockPending, logDebug]);


  useEffect(() => {
    if (fsmState !== FsmState.FETCHING_DATA || analyzeStockState.status === 'idle' || !analysisTriggeredForTickerRef.current) {
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
  }, [analyzeStockState, fsmState, dispatchFsmEvent, toast, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.AWAITING_AI_TA_TRIGGER) {
      logDebug('FSM_PIPELINE', `MainTabContent: Entered AWAITING_AI_TA_TRIGGER effect. Current Ticker Ref: ${analysisTriggeredForTickerRef.current}. Snapshot JSON (at effect start): '${contextStockSnapshotJson?.substring(0,100)}...'`);
      if (analysisTriggeredForTickerRef.current) {
        const snapshotIsValid = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_AI_TA_TRIGGER', 'contextStockSnapshotJson');
        logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_AI_TA_TRIGGER for ${analysisTriggeredForTickerRef.current}. Snapshot valid (isDataReadyForProcessing): ${snapshotIsValid}.`);
        if (snapshotIsValid) {
          dispatchFsmEvent({ type: 'TRIGGER_AI_TA' });
        } else {
          let failureReason = "Snapshot JSON not ready or invalid.";
          if (!contextStockSnapshotJson || contextStockSnapshotJson === '{}') failureReason = "Snapshot JSON is empty or null.";
          else if (PENDING_PLACEHOLDER_JSON_STRINGS.includes(contextStockSnapshotJson.trim())) failureReason = "Snapshot JSON is still a pending placeholder.";
          else if (contextStockSnapshotJson.includes('"error":') || contextStockSnapshotJson.includes('"status": "error"')) failureReason = "Snapshot JSON indicates an error state.";
          else if (contextStockSnapshotJson.includes('"status": "skipped"')) failureReason = "Snapshot JSON indicates a skipped state.";
          
          logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_AI_TA_TRIGGER - Snapshot not valid for AI TA. Reason: ${failureReason}. Snapshot content (first 100): '${contextStockSnapshotJson?.substring(0,100)}'. Dispatching AI_TA_FAILURE.`);
          dispatchFsmEvent({
            type: 'AI_TA_FAILURE',
            payload: { 
              error: `Prerequisite stock snapshot data not ready for AI TA. Reason: ${failureReason}`, 
              message: 'Prerequisite stock data not available or still pending for AI TA.' 
            }
          });
        }
      } else {
        logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_AI_TA_TRIGGER - analysisTriggeredForTickerRef.current is null/falsy. Cannot proceed. Dispatching AI_TA_FAILURE.`);
        dispatchFsmEvent({
          type: 'AI_TA_FAILURE',
          payload: { 
            error: 'Internal error: Active ticker reference was lost before AI TA could be triggered.', 
            message: 'Internal error preventing AI TA initiation.' 
          }
        });
      }
    }
  }, [fsmState, contextStockSnapshotJson, dispatchFsmEvent, logDebug]);
  
  useEffect(() => {
    if (fsmState === FsmState.ANALYZING_TA && analysisTriggeredForTickerRef.current && !isAnalyzeTaPending) {
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in ANALYZING_TA for ${analysisTriggeredForTickerRef.current}. Raw contextStockSnapshotJson (first 100 chars): '${contextStockSnapshotJson?.substring(0,100)}'. isAnalyzeTaPending: ${isAnalyzeTaPending}`);
      
      const snapshotIsValid = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:ANALYZING_TA', 'contextStockSnapshotJson');
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in ANALYZING_TA for ${analysisTriggeredForTickerRef.current}. Snapshot valid (isDataReadyForProcessing): ${snapshotIsValid}.`);

      if (snapshotIsValid) {
        const payload = { stockSnapshotJson: contextStockSnapshotJson!, ticker: analysisTriggeredForTickerRef.current };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling analyzeTaFormAction with payload:`, {ticker: payload.ticker, snapshotLength: payload.stockSnapshotJson.length});
        startTransition(() => {
          analyzeTaFormAction(payload);
        });
      } else {
        dispatchFsmEvent({
          type: 'AI_TA_FAILURE',
          payload: { error: `Missing or invalid stock snapshot data for AI TA during ANALYZING_TA state. Snapshot was: ${contextStockSnapshotJson?.substring(0,100)}`, message: 'Prerequisite stock data not available for AI TA.' }
        });
      }
    }
  }, [fsmState, contextStockSnapshotJson, analyzeTaFormAction, isAnalyzeTaPending, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState !== FsmState.ANALYZING_TA || analyzeTaState.status === 'idle' || !analysisTriggeredForTickerRef.current) {
      return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: AI TA Action state (analyzeTaState) changed:", 
               `Status: ${analyzeTaState.status}, Message: ${analyzeTaState.message}, CurrentTickerRef: ${analysisTriggeredForTickerRef.current}`);

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

  useEffect(() => {
    if (fsmState === FsmState.AWAITING_KEY_TAKEAWAYS_TRIGGER) {
        logDebug('FSM_PIPELINE', `MainTabContent: Entered AWAITING_KEY_TAKEAWAYS_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}. FullAnalysis: ${isFullAnalysisTriggered}`);
        if (isFullAnalysisTriggered && analysisTriggeredForTickerRef.current) {
            const prereqs = {
                snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_KEY_TAKEAWAYS', 'contextStockSnapshotJson'),
                stdTAs: isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:AWAITING_KEY_TAKEAWAYS', 'contextStandardTasJson'),
                aiTA: isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:AWAITING_KEY_TAKEAWAYS', 'contextAiAnalyzedTaJson'),
                market: isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:AWAITING_KEY_TAKEAWAYS', 'contextMarketStatusJson'),
            };
            const allPrereqsValid = prereqs.snapshot && prereqs.stdTAs && prereqs.aiTA && prereqs.market;
            logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_KEY_TAKEAWAYS_TRIGGER for ${analysisTriggeredForTickerRef.current}. All prereqs valid: ${allPrereqsValid}. Details:`, prereqs);
            
            if (allPrereqsValid) {
                dispatchFsmEvent({ type: 'TRIGGER_KEY_TAKEAWAYS' });
            } else {
                const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', ');
                dispatchFsmEvent({
                    type: 'KEY_TAKEAWAYS_FAILURE',
                    payload: { 
                        error: `Missing/invalid prerequisites for Key Takeaways: ${missing}.`, 
                        message: 'Prerequisite data for Key Takeaways not ready.' 
                    }
                });
            }
        } else if (!isFullAnalysisTriggered) {
            logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_KEY_TAKEAWAYS_TRIGGER - Not a full analysis, skipping.`);
        } else {
            logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_KEY_TAKEAWAYS_TRIGGER - Ticker ref missing. Dispatching failure.`);
             dispatchFsmEvent({ type: 'KEY_TAKEAWAYS_FAILURE', payload: { error: 'Ticker reference missing.', message: 'Internal error.' } });
        }
    }
  }, [fsmState, isFullAnalysisTriggered, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.GENERATING_KEY_TAKEAWAYS && analysisTriggeredForTickerRef.current && !isPerformAiAnalysisPending) {
      const currentTicker = analysisTriggeredForTickerRef.current;
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in GENERATING_KEY_TAKEAWAYS for ${currentTicker}. Validating prereqs again.`);
      const prereqs = {
          snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:GENERATING_KEY_TAKEAWAYS', 'contextStockSnapshotJson'),
          stdTAs: isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:GENERATING_KEY_TAKEAWAYS', 'contextStandardTasJson'),
          aiTA: isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:GENERATING_KEY_TAKEAWAYS', 'contextAiAnalyzedTaJson'),
          market: isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:GENERATING_KEY_TAKEAWAYS', 'contextMarketStatusJson'),
      };
      const allPrereqsValid = prereqs.snapshot && prereqs.stdTAs && prereqs.aiTA && prereqs.market;

      if (allPrereqsValid) {
        const payload = {
          ticker: currentTicker,
          stockSnapshotJson: contextStockSnapshotJson!,
          standardTasJson: contextStandardTasJson!,
          aiAnalyzedTaJson: contextAiAnalyzedTaJson!,
          marketStatusJson: contextMarketStatusJson!,
        };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiAnalysisFormAction (Key Takeaways) for ${currentTicker}. Payload keys: ${Object.keys(payload).join(', ')}`);
        startTransition(() => {
          performAiAnalysisFormAction(payload);
        });
      } else {
        const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', ');
        logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_KEY_TAKEAWAYS for ${currentTicker}, but prereqs became invalid: ${missing}. Dispatching KEY_TAKEAWAYS_FAILURE.`);
        dispatchFsmEvent({
          type: 'KEY_TAKEAWAYS_FAILURE',
          payload: { error: `Prerequisites for Key Takeaways became invalid: ${missing}.`, message: 'Prerequisite data error for Key Takeaways.' }
        });
      }
    }
  }, [fsmState, performAiAnalysisFormAction, isPerformAiAnalysisPending, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState !== FsmState.GENERATING_KEY_TAKEAWAYS || performAiAnalysisState.status === 'idle' || !analysisTriggeredForTickerRef.current) {
      return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Key Takeaways Action state (performAiAnalysisState) changed:", 
              `Status: ${performAiAnalysisState.status}, Message: ${performAiAnalysisState.message}, CurrentTickerRef: ${analysisTriggeredForTickerRef.current}`);

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

  useEffect(() => {
    if (fsmState === FsmState.AWAITING_OPTIONS_ANALYSIS_TRIGGER) {
        logDebug('FSM_PIPELINE', `MainTabContent: Entered AWAITING_OPTIONS_ANALYSIS_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}. FullAnalysis: ${isFullAnalysisTriggered}`);
        if (isFullAnalysisTriggered && analysisTriggeredForTickerRef.current) {
            const prereqs = {
                options: isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'MainTabContent:AWAITING_OPTIONS_ANALYSIS', 'contextOptionsChainJson'),
                snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_OPTIONS_ANALYSIS', 'contextStockSnapshotJson'),
            };
            const allPrereqsValid = prereqs.options && prereqs.snapshot;
            logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_OPTIONS_ANALYSIS_TRIGGER for ${analysisTriggeredForTickerRef.current}. All prereqs valid: ${allPrereqsValid}. Details:`, prereqs);

            if (allPrereqsValid) {
                dispatchFsmEvent({ type: 'TRIGGER_OPTIONS_ANALYSIS' });
            } else {
                const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', ');
                dispatchFsmEvent({
                    type: 'OPTIONS_ANALYSIS_FAILURE',
                    payload: { 
                        error: `Missing/invalid prerequisites for Options Analysis: ${missing}.`, 
                        message: 'Prerequisite data for Options Analysis not ready.' 
                    }
                });
            }
        } else if (!isFullAnalysisTriggered) {
             logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_OPTIONS_ANALYSIS_TRIGGER - Not a full analysis, skipping.`);
        } else {
            logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_OPTIONS_ANALYSIS_TRIGGER - Ticker ref missing. Dispatching failure.`);
            dispatchFsmEvent({ type: 'OPTIONS_ANALYSIS_FAILURE', payload: { error: 'Ticker reference missing.', message: 'Internal error.' } });
        }
    }
  }, [fsmState, isFullAnalysisTriggered, contextOptionsChainJson, contextStockSnapshotJson, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState === FsmState.ANALYZING_OPTIONS && analysisTriggeredForTickerRef.current && !isPerformAiOptionsAnalysisPending) {
      const currentTicker = analysisTriggeredForTickerRef.current;
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in ANALYZING_OPTIONS for ${currentTicker}. Validating prereqs.`);
      const prereqs = {
          options: isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'MainTabContent:ANALYZING_OPTIONS', 'contextOptionsChainJson'),
          snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:ANALYZING_OPTIONS', 'contextStockSnapshotJson'),
      };
      const allPrereqsValid = prereqs.options && prereqs.snapshot;
      
      if (allPrereqsValid) {
        const payload = {
          ticker: currentTicker,
          optionsChainJson: contextOptionsChainJson!,
          stockSnapshotJson: contextStockSnapshotJson!,
        };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling performAiOptionsAnalysisFormAction for ${currentTicker}. Payload keys: ${Object.keys(payload).join(', ')}`);
        startTransition(() => {
          performAiOptionsAnalysisFormAction(payload);
        });
      } else {
        const missing = Object.entries(prereqs).filter(([,valid]) => !valid).map(([key]) => key).join(', ');
        logDebug('FSM_PIPELINE', `MainTabContent: ANALYZING_OPTIONS for ${currentTicker}, but prereqs became invalid: ${missing}. Dispatching OPTIONS_ANALYSIS_FAILURE.`);
        dispatchFsmEvent({
          type: 'OPTIONS_ANALYSIS_FAILURE',
          payload: { error: `Prerequisites for Options Analysis became invalid: ${missing}.`, message: 'Prerequisite data error for Options Analysis.' }
        });
      }
    }
  }, [fsmState, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending, contextOptionsChainJson, contextStockSnapshotJson, dispatchFsmEvent, logDebug]);

  useEffect(() => {
    if (fsmState !== FsmState.ANALYZING_OPTIONS || performAiOptionsAnalysisState.status === 'idle' || !analysisTriggeredForTickerRef.current) {
      return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Options Analysis Action state (performAiOptionsAnalysisState) changed:", 
               `Status: ${performAiOptionsAnalysisState.status}, Message: ${performAiOptionsAnalysisState.message}, CurrentTickerRef: ${analysisTriggeredForTickerRef.current}`);

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
  
  useEffect(() => {
    if (fsmState === FsmState.AWAITING_CHAT_SUMMARY_TRIGGER) {
        logDebug('FSM_PIPELINE', `MainTabContent: Entered AWAITING_CHAT_SUMMARY_TRIGGER. Ticker: ${analysisTriggeredForTickerRef.current}. FullAnalysis: ${isFullAnalysisTriggered}`);
        if (isFullAnalysisTriggered && analysisTriggeredForTickerRef.current) {
            const prereqs = {
                snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextStockSnapshotJson'),
                stdTAs: isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextStandardTasJson'),
                aiTA: isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextAiAnalyzedTaJson'), // Should be actual data or error, not pending
                keyTakeaways: isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextAiKeyTakeawaysJson'), // same
                options: isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextAiOptionsAnalysisJson'), // same
                market: isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:AWAITING_CHAT_SUMMARY', 'contextMarketStatusJson'),
            };
             // For summary, we can proceed even if some AI steps failed (their JSONs would reflect error/skipped)
             // The core data (snapshot, std TAs, market) must be valid.
            const coreDataValid = prereqs.snapshot && prereqs.stdTAs && prereqs.market;
            const aiStepsNonPending = 
                contextAiAnalyzedTaJson && !PENDING_PLACEHOLDER_JSON_STRINGS.includes(contextAiAnalyzedTaJson.trim()) &&
                contextAiKeyTakeawaysJson && !PENDING_PLACEHOLDER_JSON_STRINGS.includes(contextAiKeyTakeawaysJson.trim()) &&
                contextAiOptionsAnalysisJson && !PENDING_PLACEHOLDER_JSON_STRINGS.includes(contextAiOptionsAnalysisJson.trim());

            logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_CHAT_SUMMARY_TRIGGER for ${analysisTriggeredForTickerRef.current}. Core data valid: ${coreDataValid}. AI steps non-pending: ${aiStepsNonPending}. Details:`, prereqs);

            if (coreDataValid && aiStepsNonPending) {
                dispatchFsmEvent({ type: 'TRIGGER_CHAT_SUMMARY' });
            } else {
                const missing: string[] = [];
                if (!prereqs.snapshot) missing.push("Snapshot");
                if (!prereqs.stdTAs) missing.push("Standard TAs");
                if (!prereqs.market) missing.push("Market Status");
                if (!aiStepsNonPending) missing.push("One or more AI analysis steps still pending");
                
                dispatchFsmEvent({
                    type: 'CHAT_SUMMARY_FAILURE',
                    payload: { 
                        error: `Missing/invalid prerequisites for Chat Summary: ${missing.join(', ')}.`, 
                        message: 'Prerequisite data for Chat Summary not ready.' 
                    }
                });
            }
        } else if (!isFullAnalysisTriggered) {
             logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_CHAT_SUMMARY_TRIGGER - Not a full analysis, skipping this step explicitly (should not reach here if partial).`);
        } else {
             logDebug('FSM_PIPELINE', `MainTabContent: AWAITING_CHAT_SUMMARY_TRIGGER - Ticker ref missing. Dispatching failure.`);
            dispatchFsmEvent({ type: 'CHAT_SUMMARY_FAILURE', payload: { error: 'Ticker reference missing for chat summary.', message: 'Internal error.' } });
        }
    }
  }, [
    fsmState, isFullAnalysisTriggered, 
    contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, 
    contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson, 
    dispatchFsmEvent, logDebug
  ]);

  useEffect(() => {
    if (fsmState === FsmState.GENERATING_CHAT_SUMMARY && analysisTriggeredForTickerRef.current && !isGenerateChatSummaryPending) {
      const currentTicker = analysisTriggeredForTickerRef.current;
      logDebug('FSM_PIPELINE', `MainTabContent: FSM in GENERATING_CHAT_SUMMARY for ${currentTicker}. Validating prereqs again.`);
       const prereqs = {
          snapshot: isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'MainTabContent:GENERATING_CHAT_SUMMARY', 'contextStockSnapshotJson'),
          stdTAs: isDataReadyForProcessing(contextStandardTasJson, logDebug, 'MainTabContent:GENERATING_CHAT_SUMMARY', 'contextStandardTasJson'),
          aiTA: contextAiAnalyzedTaJson && !PENDING_PLACEHOLDER_JSON_STRINGS.includes(contextAiAnalyzedTaJson.trim()), 
          keyTakeaways: contextAiKeyTakeawaysJson && !PENDING_PLACEHOLDER_JSON_STRINGS.includes(contextAiKeyTakeawaysJson.trim()),
          options: contextAiOptionsAnalysisJson && !PENDING_PLACEHOLDER_JSON_STRINGS.includes(contextAiOptionsAnalysisJson.trim()),
          market: isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'MainTabContent:GENERATING_CHAT_SUMMARY', 'contextMarketStatusJson'),
      };
      const coreDataValid = prereqs.snapshot && prereqs.stdTAs && prereqs.market;
      const aiStepsNonPending = prereqs.aiTA && prereqs.keyTakeaways && prereqs.options;


      if (coreDataValid && aiStepsNonPending) {
        const payload: GenerateChatSummaryActionInputs = {
            ticker: currentTicker,
            stockSnapshotJson: contextStockSnapshotJson!,
            standardTasJson: contextStandardTasJson!,
            aiAnalyzedTaJson: contextAiAnalyzedTaJson!, 
            aiKeyTakeawaysJson: contextAiKeyTakeawaysJson!, 
            aiOptionsAnalysisJson: contextAiOptionsAnalysisJson!, 
            marketStatusJson: contextMarketStatusJson!,
        };
        logDebug('FSM_PIPELINE', `MainTabContent: Calling generateChatSummaryFormAction for ${currentTicker}. Payload keys: ${Object.keys(payload).join(', ')}`);
        startTransition(() => {
          generateChatSummaryFormAction(payload);
        });
      } else {
        const missing: string[] = [];
        if (!prereqs.snapshot) missing.push("Snapshot");
        if (!prereqs.stdTAs) missing.push("Standard TAs");
        if (!prereqs.market) missing.push("Market Status");
        if (!prereqs.aiTA) missing.push("AI TA (still pending/invalid)");
        if (!prereqs.keyTakeaways) missing.push("Key Takeaways (still pending/invalid)");
        if (!prereqs.options) missing.push("Options Analysis (still pending/invalid)");
        logDebug('FSM_PIPELINE', `MainTabContent: GENERATING_CHAT_SUMMARY for ${currentTicker}, but prereqs became invalid: ${missing.join(', ')}. Dispatching CHAT_SUMMARY_FAILURE.`);
        dispatchFsmEvent({
          type: 'CHAT_SUMMARY_FAILURE',
          payload: { 
            error: `Prerequisites for Chat Summary became invalid: ${missing.join(', ')}.`, 
            message: 'Prerequisite data error for Chat Summary.' 
          }
        });
      }
    }
  }, [
    fsmState, generateChatSummaryFormAction, isGenerateChatSummaryPending, 
    contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, 
    contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextMarketStatusJson, 
    dispatchFsmEvent, logDebug
  ]);

  useEffect(() => {
    if (fsmState !== FsmState.GENERATING_CHAT_SUMMARY || generateChatSummaryState.status === 'idle' || !analysisTriggeredForTickerRef.current) {
      return;
    }
    logDebug('FSM_PIPELINE', "MainTabContent: Chat Summary Action state (generateChatSummaryState) changed:", 
               `Status: ${generateChatSummaryState.status}, Message: ${generateChatSummaryState.message}`);

    if (generateChatSummaryState.status === 'success' && generateChatSummaryState.data) {
      toast({ title: "Chat Summary Generated", description: generateChatSummaryState.message || `Chat summary for ${analysisTriggeredForTickerRef.current} generated.` });
      dispatchFsmEvent({ type: 'CHAT_SUMMARY_SUCCESS', payload: generateChatSummaryState.data as GenerateChatSummaryResult });
    } else if (generateChatSummaryState.status === 'error') {
      toast({ variant: "destructive", title: "Chat Summary Error", description: generateChatSummaryState.message || "Failed to generate chat summary." });
      dispatchFsmEvent({ 
        type: 'CHAT_SUMMARY_FAILURE', 
        payload: { 
          error: generateChatSummaryState.error, 
          message: generateChatSummaryState.message,
          requestJson: generateChatSummaryState.data?.requestJson
        } 
      });
    }
  }, [generateChatSummaryState, fsmState, dispatchFsmEvent, toast, logDebug]);

  useEffect(() => {
    if (chatActionState.status === 'idle' || !analysisTriggeredForTickerRef.current || fsmState !== FsmState.IDLE) return;
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

  logDebug('MainTabContent', `Rendering. FSM State=${fsmState}, isPipelineActive=${isPipelineActive}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}`);
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

