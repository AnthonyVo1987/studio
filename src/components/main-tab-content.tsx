
"use client";

import type { FormEvent } from 'react';
import React, { useState, useEffect, startTransition, useRef, useCallback, useReducer } from "react";
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
import { ChatbotFsmProvider } from "@/contexts/chatbot-fsm-context";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";

import { fetchStockDataAction, type AnalyzeStockServerActionState } from "@/actions/analyze-stock-server-action";
// analyzeTaAction related types and initial state are no longer directly used here for action calls
// performAiAnalysisAction related types and initial state are no longer directly used here for action calls
// performAiOptionsAnalysisAction related types and initial state are no longer directly used here for action calls
import { chatServerAction, type ChatActionState, type ChatActionInputs } from "@/actions/chat-server-action";

import { useStockAnalysis, type ChatMessage, FsmState as GlobalFsmState } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap, Brain, BarChartBig } from "lucide-react";
import type { StockSnapshotData } from '@/services/data-sources/types';
import { useActionState } from 'react';

// --- Local FSM for MainTabContent ---
enum MainTabLocalFsmState {
  IDLE = 'IDLE', // No ticker or after full reset
  INPUT_VALID = 'INPUT_VALID', // Valid ticker entered, ready for automated analysis
  AUTOMATED_PIPELINE_REQUESTED = 'AUTOMATED_PIPELINE_REQUESTED', // "Analyze Stock" clicked
  AUTOMATED_PIPELINE_IN_PROGRESS = 'AUTOMATED_PIPELINE_IN_PROGRESS', // Global FSM is running data fetch/AI TA
  MANUAL_ACTIONS_ENABLED = 'MANUAL_ACTIONS_ENABLED', // Automated pipeline complete, data ready for manual AI
  MANUAL_KEY_TAKEAWAYS_REQUESTED = 'MANUAL_KEY_TAKEAWAYS_REQUESTED',
  MANUAL_KEY_TAKEAWAYS_PENDING = 'MANUAL_KEY_TAKEAWAYS_PENDING', // Global FSM running key takeaways
  MANUAL_OPTIONS_ANALYSIS_REQUESTED = 'MANUAL_OPTIONS_ANALYSIS_REQUESTED',
  MANUAL_OPTIONS_ANALYSIS_PENDING = 'MANUAL_OPTIONS_ANALYSIS_PENDING', // Global FSM running options analysis
}

type MainTabLocalFsmEvent =
  | { type: 'TICKER_INPUT_CHANGED'; payload: { isValid: boolean } }
  | { type: 'AUTOMATED_ANALYSIS_SUBMITTED' }
  | { type: 'MANUAL_KEY_TAKEAWAYS_SUBMITTED' }
  | { type: 'MANUAL_OPTIONS_ANALYSIS_SUBMITTED' }
  | { type: 'GLOBAL_FSM_UPDATED'; payload: { globalFsmState: GlobalFsmState } }
  | { type: 'RESET_REQUESTED' };

interface MainTabLocalFsmManagedState {
  localState: MainTabLocalFsmState;
  activeAnalysisTicker: string | null; // Ticker for which data is loaded and manual actions can run
}

const initialMainTabLocalFsmState: MainTabLocalFsmManagedState = {
  localState: MainTabLocalFsmState.IDLE,
  activeAnalysisTicker: null,
};
// --- End Local FSM ---

const initialChatActionState: ChatActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};

function isDataReadyForProcessing(jsonString: string | null | undefined, logDebugFn?: Function, sourceComponent?: string, dataName?: string): boolean {
  const callContext = `${sourceComponent || 'isDataReadyForProcessing'}:${dataName || 'data'}`;
  if (!jsonString || jsonString === '{}' || jsonString.trim() === '{ "status": "pending..." }') {
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
    fsmState: globalFsmStateFromContext, // Renamed to avoid clash
    dispatchFsmEvent: dispatchGlobalFsmEvent,
    chatHistory: contextChatHistory,
    addChatMessage: addChatMessageToGlobalContext,
  } = useStockAnalysis();

  const contextChatHistoryRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    contextChatHistoryRef.current = contextChatHistory;
  }, [contextChatHistory]);

  const mainTabLocalFsmReducer = (
    state: MainTabLocalFsmManagedState,
    event: MainTabLocalFsmEvent
  ): MainTabLocalFsmManagedState => {
    logDebug('MainTabContent_FSM', 'LocalReducerEvent', `Event: ${event.type}, CurrentLocalState: ${state.localState}, CurrentActiveTicker: ${state.activeAnalysisTicker}`);
    switch (state.localState) {
      case MainTabLocalFsmState.IDLE:
        if (event.type === 'TICKER_INPUT_CHANGED' && event.payload.isValid) {
          return { ...state, localState: MainTabLocalFsmState.INPUT_VALID };
        }
        return state;

      case MainTabLocalFsmState.INPUT_VALID:
        if (event.type === 'TICKER_INPUT_CHANGED' && !event.payload.isValid) {
          return { ...state, localState: MainTabLocalFsmState.IDLE };
        }
        if (event.type === 'AUTOMATED_ANALYSIS_SUBMITTED') {
          return { ...state, localState: MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED, activeAnalysisTicker: tickerInput };
        }
        return state;

      case MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if ([GlobalFsmState.INITIALIZING_ANALYSIS, GlobalFsmState.AWAITING_DATA_FETCH_TRIGGER, GlobalFsmState.FETCHING_DATA, GlobalFsmState.ANALYZING_TA].includes(event.payload.globalFsmState)) {
            return { ...state, localState: MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS };
          }
        }
        return state;

      case MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if (event.payload.globalFsmState === GlobalFsmState.FULL_ANALYSIS_COMPLETE) {
            return { ...state, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED };
          }
          if (event.payload.globalFsmState === GlobalFsmState.IDLE || event.payload.globalFsmState === GlobalFsmState.STALE_DATA_FROM_ACTION_ERROR || event.payload.globalFsmState === GlobalFsmState.DATA_FETCH_FAILED) {
            return { ...state, localState: MainTabLocalFsmState.IDLE, activeAnalysisTicker: null };
          }
        }
        if (event.type === 'RESET_REQUESTED') {
             return { ...initialMainTabLocalFsmState, activeAnalysisTicker: null };
        }
        return state;

      case MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED:
        if (event.type === 'AUTOMATED_ANALYSIS_SUBMITTED') { // User starts a new automated analysis
          return { ...state, localState: MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED, activeAnalysisTicker: tickerInput };
        }
        if (event.type === 'MANUAL_KEY_TAKEAWAYS_SUBMITTED') {
          return { ...state, localState: MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED };
        }
        if (event.type === 'MANUAL_OPTIONS_ANALYSIS_SUBMITTED') {
          return { ...state, localState: MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED };
        }
        if (event.type === 'GLOBAL_FSM_UPDATED' && event.payload.globalFsmState === GlobalFsmState.IDLE) {
            // If global FSM somehow resets while we are here, MTC should also reset.
            return { ...initialMainTabLocalFsmState, activeAnalysisTicker: null };
        }
        if (event.type === 'RESET_REQUESTED') {
             return { ...initialMainTabLocalFsmState, activeAnalysisTicker: null };
        }
        if (event.type === 'TICKER_INPUT_CHANGED' && event.payload.isValid) { // If user types new ticker while manual actions are enabled
            return { ...state, localState: MainTabLocalFsmState.INPUT_VALID, activeAnalysisTicker: null }; // Reset active ticker
        }
         if (event.type === 'TICKER_INPUT_CHANGED' && !event.payload.isValid) {
            return { ...state, localState: MainTabLocalFsmState.IDLE, activeAnalysisTicker: null };
        }
        return state;

      case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED:
        if (event.type === 'GLOBAL_FSM_UPDATED' && event.payload.globalFsmState === GlobalFsmState.GENERATING_KEY_TAKEAWAYS) {
          return { ...state, localState: MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING };
        }
        // If global FSM fails to start this, it might go back to FULL_ANALYSIS_COMPLETE or IDLE
        if (event.type === 'GLOBAL_FSM_UPDATED' && (event.payload.globalFsmState === GlobalFsmState.FULL_ANALYSIS_COMPLETE || event.payload.globalFsmState === GlobalFsmState.IDLE)) {
          return { ...state, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED };
        }
        return state;

      case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if ([GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE].includes(event.payload.globalFsmState)) {
            return { ...state, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED };
          }
           if (event.payload.globalFsmState === GlobalFsmState.IDLE) { // If something reset global FSM
            return { ...initialMainTabLocalFsmState, activeAnalysisTicker: null };
          }
        }
        return state;

      case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED:
        if (event.type === 'GLOBAL_FSM_UPDATED' && event.payload.globalFsmState === GlobalFsmState.ANALYZING_OPTIONS) {
          return { ...state, localState: MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING };
        }
        if (event.type === 'GLOBAL_FSM_UPDATED' && (event.payload.globalFsmState === GlobalFsmState.FULL_ANALYSIS_COMPLETE || event.payload.globalFsmState === GlobalFsmState.IDLE)) {
          return { ...state, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED };
        }
        return state;

      case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if ([GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE].includes(event.payload.globalFsmState)) {
            return { ...state, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED };
          }
          if (event.payload.globalFsmState === GlobalFsmState.IDLE) {
            return { ...initialMainTabLocalFsmState, activeAnalysisTicker: null };
          }
        }
        return state;
      default:
        return state;
    }
  };

  const [localFsm, dispatchLocalFsmEvent] = useReducer(mainTabLocalFsmReducer, initialMainTabLocalFsmState);

  // Server actions (still using useActionState for their pending status)
  const [, analyzeStockFormAction, isAnalyzeStockPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(fetchStockDataAction, { status: 'idle' });
  // The other server actions (analyzeTa, performAiAnalysis, performAiOptionsAnalysis) are now triggered by the global FSM,
  // so MainTabContent doesn't call their formActions directly anymore. Their pending states are reflected in the globalFsmStateFromContext.
  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(chatServerAction, initialChatActionState);


  // Effect to dispatch to Global FSM or call server actions based on Local FSM state changes
  useEffect(() => {
    logDebug('MainTabContent_FSM', 'LocalFsmSideEffect', `LocalState: ${localFsm.localState}, ActiveTicker: ${localFsm.activeAnalysisTicker}`);
    if (localFsm.localState === MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED && localFsm.activeAnalysisTicker) {
      logDebug('MainTabContent_FSM', 'DispatchToGlobal', `Local FSM state AUTOMATED_PIPELINE_REQUESTED. Dispatching START_FULL_ANALYSIS to global FSM for ${localFsm.activeAnalysisTicker}.`);
      dispatchGlobalFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: localFsm.activeAnalysisTicker } });
    } else if (localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED && localFsm.activeAnalysisTicker) {
      logDebug('MainTabContent_FSM', 'DispatchToGlobal', `Local FSM state MANUAL_KEY_TAKEAWAYS_REQUESTED. Dispatching TRIGGER_MANUAL_KEY_TAKEAWAYS to global FSM for ${localFsm.activeAnalysisTicker}.`);
      dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS', payload: { ticker: localFsm.activeAnalysisTicker }});
    } else if (localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED && localFsm.activeAnalysisTicker) {
      logDebug('MainTabContent_FSM', 'DispatchToGlobal', `Local FSM state MANUAL_OPTIONS_ANALYSIS_REQUESTED. Dispatching TRIGGER_MANUAL_OPTIONS_ANALYSIS to global FSM for ${localFsm.activeAnalysisTicker}.`);
      dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS', payload: { ticker: localFsm.activeAnalysisTicker }});
    }
  }, [localFsm.localState, localFsm.activeAnalysisTicker, dispatchGlobalFsmEvent, logDebug]);

  // Effect to subscribe to Global FSM state changes
  useEffect(() => {
    logDebug('MainTabContent_FSM', 'GlobalFsmListener', `Global FSM state changed to: ${globalFsmStateFromContext}. Current Local FSM State: ${localFsm.localState}`);
    dispatchLocalFsmEvent({ type: 'GLOBAL_FSM_UPDATED', payload: { globalFsmState: globalFsmStateFromContext } });

    // If global FSM resets to IDLE or FULL_ANALYSIS_COMPLETE, and local FSM is not in a pending manual op, it should also consider resetting.
    if (globalFsmStateFromContext === GlobalFsmState.IDLE &&
        ![
            MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING,
            MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING,
            MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS // Should have resolved before global IDLE
        ].includes(localFsm.localState)
    ) {
        logDebug('MainTabContent_FSM', 'GlobalFsmListener', `Global FSM is IDLE. Requesting local FSM reset.`);
        dispatchLocalFsmEvent({ type: 'RESET_REQUESTED' });
    }

  }, [globalFsmStateFromContext, logDebug, localFsm.localState]);


  // Chat action state handling (remains similar, might be simplified or integrated further if Chatbot FSM takes more direct control)
  useEffect(() => {
    if (![GlobalFsmState.IDLE, GlobalFsmState.FULL_ANALYSIS_COMPLETE].includes(globalFsmStateFromContext)) {
        if (chatActionState.status === 'success' || chatActionState.status === 'error') {
            logDebug('MainTabContent:chatActionState', 'SkipHandleChatResult', `Skipping chat result processing. Global FSM State: ${globalFsmStateFromContext} is not IDLE or FULL_ANALYSIS_COMPLETE. Chat Action Status: ${chatActionState.status}`);
        }
        return;
    }
    if (chatActionState.status !== 'success' && chatActionState.status !== 'error') return;

    logDebug('MainTabContent:chatActionState', 'HandleChatActionResult', `Processing chat action result. Global FSM State: ${globalFsmStateFromContext}, Chat Action Status: ${chatActionState.status}`);
    let messageToAdd: ChatMessage | null = null;
    if (chatActionState.status === 'success' && chatActionState.data?.chatbotResponseJson) {
        try {
            const responseObj = JSON.parse(chatActionState.data.chatbotResponseJson);
            messageToAdd = { id: `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, role: 'model', content: responseObj.response || "No response text." };
        } catch (e) {
            messageToAdd = { id: `model_error_${Date.now()}`, role: 'model', content: "Sorry, I had trouble formatting my response." };
        }
    } else if (chatActionState.status === 'error') {
        messageToAdd = { id: `model_error_${Date.now()}`, role: 'model', content: chatActionState.message || "Sorry, an error occurred with the chat." };
    }
    if (messageToAdd) {
        const lastMessage = contextChatHistoryRef.current[contextChatHistoryRef.current.length - 1];
        if (lastMessage && lastMessage.role === messageToAdd.role && lastMessage.content === messageToAdd.content) {
            logDebug('MainTabContent:chatActionState', 'DuplicateChatMessageSkipped', 'Skipping add of duplicate chat message.', messageToAdd);
        } else {
            dispatchGlobalFsmEvent({ type: 'ADD_CHAT_MESSAGE', payload: messageToAdd });
        }
    }
  }, [chatActionState, dispatchGlobalFsmEvent, logDebug, globalFsmStateFromContext]);


  const handleTickerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTicker = e.target.value.toUpperCase();
    setTickerInput(newTicker);
    dispatchLocalFsmEvent({ type: 'TICKER_INPUT_CHANGED', payload: { isValid: !!newTicker.trim() } });
  };

  const handleAnalyzeStockSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!tickerInput.trim()) {
      toast({ title: "Invalid Ticker", description: "Please enter a stock ticker.", variant: "destructive" });
      return;
    }
    logDebug('MainTabContent_FSM', 'UserAction', `Automated "Analyze Stock" button clicked for ${tickerInput}. Current Local FSM State: ${localFsm.localState}`);
    dispatchLocalFsmEvent({ type: 'AUTOMATED_ANALYSIS_SUBMITTED' });
  };

  const handleGenerateKeyTakeaways = () => {
    if (!localFsm.activeAnalysisTicker) {
      toast({ title: "No Active Stock", description: "Please analyze a stock first.", variant: "default" });
      return;
    }
    logDebug('MainTabContent_FSM', 'UserAction', `Manual "Generate AI Key Takeaways" clicked for ${localFsm.activeAnalysisTicker}. Current Local FSM State: ${localFsm.localState}`);
    dispatchLocalFsmEvent({ type: 'MANUAL_KEY_TAKEAWAYS_SUBMITTED' });
  };

  const handleGenerateOptionsAnalysis = () => {
    if (!localFsm.activeAnalysisTicker) {
      toast({ title: "No Active Stock", description: "Please analyze a stock first.", variant: "default" });
      return;
    }
    logDebug('MainTabContent_FSM', 'UserAction', `Manual "Generate AI Options Analysis" clicked for ${localFsm.activeAnalysisTicker}. Current Local FSM State: ${localFsm.localState}`);
    dispatchLocalFsmEvent({ type: 'MANUAL_OPTIONS_ANALYSIS_SUBMITTED' });
  };

  // Button disabled logic derived from localFsm.localState and globalFsmStateFromContext
  const isAnyPipelineActive = ![
      MainTabLocalFsmState.IDLE,
      MainTabLocalFsmState.INPUT_VALID,
      MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED,
  ].includes(localFsm.localState);

  const isGlobalPipelineActive = ![
    GlobalFsmState.IDLE,
    GlobalFsmState.FULL_ANALYSIS_COMPLETE,
    GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, // These are terminal for manual ops but allow new global start
    GlobalFsmState.KEY_TAKEAWAYS_FAILED,
    GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED,
    GlobalFsmState.OPTIONS_ANALYSIS_FAILED
  ].includes(globalFsmStateFromContext);


  const analyzeButtonDisabled = localFsm.localState !== MainTabLocalFsmState.INPUT_VALID || isGlobalPipelineActive || isAnyPipelineActive;
  const analyzeButtonLoading = localFsm.localState === MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED ||
                             localFsm.localState === MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS ||
                             isAnalyzeStockPending; // isAnalyzeStockPending is for the initial data fetch action

  const manualActionsPossible = localFsm.localState === MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED && !!localFsm.activeAnalysisTicker;

  const keyTakeawaysButtonDisabled = !manualActionsPossible ||
    isAnyPipelineActive || // If MTC FSM is busy
    globalFsmStateFromContext === GlobalFsmState.GENERATING_KEY_TAKEAWAYS || // If global FSM is busy with this
    !isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'KTButtonCheck', 'Snapshot') ||
    !isDataReadyForProcessing(contextStandardTasJson, logDebug, 'KTButtonCheck', 'StdTA') ||
    !isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'KTButtonCheck', 'AiTA') ||
    !isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'KTButtonCheck', 'MarketStatus');

  const keyTakeawaysButtonLoading = localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED ||
                                  localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING ||
                                  globalFsmStateFromContext === GlobalFsmState.GENERATING_KEY_TAKEAWAYS;

  const optionsAnalysisButtonDisabled = !manualActionsPossible ||
    isAnyPipelineActive ||
    globalFsmStateFromContext === GlobalFsmState.ANALYZING_OPTIONS ||
    !isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'OptButtonCheck', 'Snapshot') ||
    !isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'OptButtonCheck', 'OptionsChain');

  const optionsAnalysisButtonLoading = localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED ||
                                     localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING ||
                                     globalFsmStateFromContext === GlobalFsmState.ANALYZING_OPTIONS;


  const getCombinedDataForExport = useCallback(() => {
    return {
      ticker: localFsm.activeAnalysisTicker || tickerInput,
      marketStatus: JSON.parse(contextMarketStatusJson || '{}'),
      stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
      standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'),
      aiAnalyzedTechnicalAnalysis: JSON.parse(contextAiAnalyzedTaJson || '{}'),
      aiKeyTakeaways: JSON.parse(contextAiKeyTakeawaysJson || '{}'),
      optionsChain: JSON.parse(contextOptionsChainJson || '{}'),
      aiOptionsAnalysis: JSON.parse(contextAiOptionsAnalysisJson || '{}'),
    };
  }, [contextMarketStatusJson, contextStockSnapshotJson, contextStandardTasJson, contextOptionsChainJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, tickerInput, localFsm.activeAnalysisTicker]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis Input</CardTitle>
        <CardDescription>
          Enter ticker for Data Fetch & AI TA (Pivots). Then, manually trigger Key Takeaways or Options Analysis.
          Local FSM: {localFsm.localState} | Global FSM: {globalFsmStateFromContext}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleAnalyzeStockSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="ticker">Stock Ticker</Label>
              <Input
                id="ticker"
                value={tickerInput}
                onChange={handleTickerInputChange}
                placeholder="e.g., AAPL, MSFT"
                disabled={analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon" disabled>
                <SelectTrigger id="dataSource" disabled={analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading}>
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
              disabled={analyzeButtonDisabled || analyzeButtonLoading}>
              { analyzeButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
              <Zap className="mr-2 h-4 w-4" /> Analyze Stock (Data & AI TA)
            </Button>
          </div>
        </form>

        <Separator />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">On-Demand AI Analysis</CardTitle>
            <CardDescription>
              Generate specific AI insights for {localFsm.activeAnalysisTicker || "the analyzed stock"}. Available after initial "Analyze Stock" (Data & AI TA) is complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button onClick={handleGenerateKeyTakeaways} className="w-full sm:w-auto" disabled={keyTakeawaysButtonDisabled || keyTakeawaysButtonLoading}>
              {keyTakeawaysButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Brain className="mr-2 h-4 w-4" /> Generate AI Key Takeaways
            </Button>
            <Button onClick={handleGenerateOptionsAnalysis} className="w-full sm:w-auto" disabled={optionsAnalysisButtonDisabled || optionsAnalysisButtonLoading}>
              {optionsAnalysisButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <BarChartBig className="mr-2 h-4 w-4" /> Generate AI Options Analysis
            </Button>
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-2">
            <h3 className="text-lg font-medium">Combined Data Export</h3>
            <CardDescription>Exports Snapshot, Standard TAs, AI Analyzed TA, AI Key Takeaways, AI Options Analysis, Options Chain, and Market Status.</CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={handleExportAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isAllDataReadyForCombinedExport || analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading}>
                    <Download className="mr-2 h-4 w-4" /> Export All to JSON
                </Button>
                <Button onClick={handleCopyAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isAllDataReadyForCombinedExport || analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading}>
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
          <ChatbotFsmProvider
            chatFormAction={chatFormAction}
            addChatMessageToGlobalContext={addChatMessageToGlobalContext}
            currentTicker={localFsm.activeAnalysisTicker || tickerInput}
            stockSnapshotJson={contextStockSnapshotJson || '{}'}
            aiKeyTakeawaysJson={contextAiKeyTakeawaysJson || '{}'}
            aiAnalyzedTaJson={contextAiAnalyzedTaJson || '{}'}
            aiOptionsAnalysisJson={contextAiOptionsAnalysisJson || '{}'}
            currentGlobalChatHistory={contextChatHistory}
            logDebug={logDebug}
          >
            <Chatbot
              isChatPending={isChatPending}
              currentTickerForDisplay={localFsm.activeAnalysisTicker || tickerInput}
            />
          </ChatbotFsmProvider>
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}
