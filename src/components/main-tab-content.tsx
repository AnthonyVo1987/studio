
"use client";

import type { FormEvent } from 'react';
import React, { useState, useEffect, useRef, useReducer, useCallback } from "react";
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
import { OptionsChainTable } from "@/components/options-chain-table";
import { AiOptionsAnalysisDisplay } from "@/components/ai-options-analysis-display";
import { AiKeyTakeawaysDisplay } from "@/components/ai-key-takeaways-display";
import { Chatbot } from "@/components/chatbot";
import { ChatbotFsmProvider } from "@/contexts/chatbot-fsm-context";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";

import { useStockAnalysis, type ChatMessage, FsmState as GlobalFsmState, type FsmDisplayTuple, type LogSourceId, type FsmEvent } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap, Brain, BarChartBig } from "lucide-react";
import type { StockSnapshotData } from '@/services/data-sources/types';
import { useActionState } from 'react';
import { chatServerAction, type ChatActionState, type ChatActionInputs } from '@/actions/chat-server-action';


enum MainTabLocalFsmState {
  IDLE = 'IDLE',
  INPUT_VALID = 'INPUT_VALID',
  AUTOMATED_PIPELINE_REQUESTED = 'AUTOMATED_PIPELINE_REQUESTED',
  AUTOMATED_PIPELINE_AWAITING_GLOBAL_PICKUP = 'AUTOMATED_PIPELINE_AWAITING_GLOBAL_PICKUP', // New
  AUTOMATED_PIPELINE_IN_PROGRESS = 'AUTOMATED_PIPELINE_IN_PROGRESS',
  MANUAL_ACTIONS_ENABLED = 'MANUAL_ACTIONS_ENABLED',
  MANUAL_KEY_TAKEAWAYS_REQUESTED = 'MANUAL_KEY_TAKEAWAYS_REQUESTED',
  MANUAL_KEY_TAKEAWAYS_AWAITING_GLOBAL_PICKUP = 'MANUAL_KEY_TAKEAWAYS_AWAITING_GLOBAL_PICKUP', // New
  MANUAL_KEY_TAKEAWAYS_PENDING = 'MANUAL_KEY_TAKEAWAYS_PENDING',
  MANUAL_OPTIONS_ANALYSIS_REQUESTED = 'MANUAL_OPTIONS_ANALYSIS_REQUESTED',
  MANUAL_OPTIONS_ANALYSIS_AWAITING_GLOBAL_PICKUP = 'MANUAL_OPTIONS_ANALYSIS_AWAITING_GLOBAL_PICKUP', // New
  MANUAL_OPTIONS_ANALYSIS_PENDING = 'MANUAL_OPTIONS_ANALYSIS_PENDING',
}

type MainTabLocalFsmEvent =
  | { type: 'TICKER_INPUT_CHANGED'; payload: { isValid: boolean; tickerValue: string } }
  | { type: 'SUBMIT_AUTOMATED_ANALYSIS_FORM' } // User intent
  | { type: 'INTERNAL_GLOBAL_AUTOMATED_DISPATCH_SUCCESSFUL' } // Internal after successful global dispatch
  | { type: 'SUBMIT_MANUAL_KEY_TAKEAWAYS_FORM' } // User intent
  | { type: 'INTERNAL_GLOBAL_KT_DISPATCH_SUCCESSFUL' } // Internal
  | { type: 'SUBMIT_MANUAL_OPTIONS_ANALYSIS_FORM' } // User intent
  | { type: 'INTERNAL_GLOBAL_OPTIONS_DISPATCH_SUCCESSFUL' } // Internal
  | { type: 'GLOBAL_FSM_UPDATED'; payload: { globalFsmState: GlobalFsmState; previousGlobalFsmState: GlobalFsmState | null } };


interface MainTabLocalFsmManagedState {
  localState: MainTabLocalFsmState;
  previousLocalState: MainTabLocalFsmState | null;
  activeAnalysisTicker: string | null; // Stores the ticker for which analysis (auto or manual) was last run or is running
  currentInputTicker: string; // Stores the current value in the ticker input field
}

const initialMainTabLocalFsmState: MainTabLocalFsmManagedState = {
  localState: MainTabLocalFsmState.IDLE,
  previousLocalState: null,
  activeAnalysisTicker: null,
  currentInputTicker: "NVDA",
};

const initialLocalChatActionState: ChatActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};


function isDataReadyForProcessing(jsonString: string | null | undefined, logDebugFn?: Function, sourceComponent?: string, dataName?: string): boolean {
  const callContext = `${sourceComponent || 'isDataReadyForProcessingCheck'}:${dataName || 'data'}`;
  if (!jsonString || jsonString === '{}' || jsonString.trim() === '{ "status": "pending..." }' || jsonString.trim() === '{ "status": "no_analysis_run_yet" }' || jsonString.trim() === '{ "status": "initializing..." }') {
    logDebugFn?.(sourceComponent as LogSourceId, 'Result:NotReady(EmptyOrGenericPending)', `${callContext} JSON: '${jsonString?.substring(0,50)}...'`);
    return false;
  }
  try {
    const parsed = JSON.parse(jsonString.trim());
    if (parsed && typeof parsed === 'object') {
      if (parsed.status && (parsed.status.includes('error') || parsed.status.includes('skipped') || parsed.status.includes('pending') || parsed.status.includes('initializing'))) {
        logDebugFn?.(sourceComponent as LogSourceId,'Result:NotReady(StatusField)', `${callContext} JSON: '${jsonString.trim().substring(0,100)}...'`);
        return false;
      }
      if (parsed.error) {
        logDebugFn?.(sourceComponent as LogSourceId,'Result:NotReady(ErrorField)', `${callContext} JSON: '${jsonString.trim().substring(0,100)}...'`);
        return false;
      }
    }
  } catch(e) {
    logDebugFn?.(sourceComponent as LogSourceId,'Result:NotReady(ParseFailed)', `${callContext} JSON: '${jsonString.trim().substring(0,100)}...'`);
    return false;
  }
  logDebugFn?.(sourceComponent as LogSourceId,'Result:Ready', `${callContext} JSON: '${jsonString.trim().substring(0,100)}...'`);
  return true;
}

interface MainTabContentProps {
  setMainTabFsmPreviousState: (state: string | null) => void;
  setMainTabFsmCurrentState: (state: string) => void;
  setMainTabFsmTargetState: (state: string | null) => void;
  setMainTabFsmDisplayState: (display: FsmDisplayTuple | null) => void;
}

export function MainTabContent({
  setMainTabFsmPreviousState,
  setMainTabFsmCurrentState,
  setMainTabFsmTargetState,
  setMainTabFsmDisplayState,
}: MainTabContentProps) {
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
    setChatbotRequestJson,
    setChatbotResponseJson,
    logDebug,
    fsmState: globalFsmStateFromContext,
    previousFsmState: previousGlobalFsmStateFromContext,
    dispatchFsmEvent: dispatchGlobalFsmEvent,
    chatHistory: contextChatHistory,
    addChatMessage: addChatMessageToGlobalContext,
    setChatbotFsmDisplay,
  } = useStockAnalysis();

  const contextChatHistoryRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    contextChatHistoryRef.current = contextChatHistory;
  }, [contextChatHistory]);

  const mainTabLocalFsmReducer = (
    state: MainTabLocalFsmManagedState,
    event: MainTabLocalFsmEvent
  ): MainTabLocalFsmManagedState => {
    const previousLocalState = state.localState;
    const logPrefixFSM = 'MainTabContent_FSM:Reducer_v3133';
    logDebug(logPrefixFSM as LogSourceId, 'Event_ENTRY', `Ev: ${event.type}, CurLoc: ${state.localState}, PrevLoc: ${previousLocalState}, CurIn: ${state.currentInputTicker}, ActAn: ${state.activeAnalysisTicker}`);
    let nextLocalState = state.localState;
    let newActiveAnalysisTicker = state.activeAnalysisTicker;

    switch (state.localState) {
      case MainTabLocalFsmState.IDLE:
        if (event.type === 'TICKER_INPUT_CHANGED') {
          nextLocalState = event.payload.isValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
        }
        break;

      case MainTabLocalFsmState.INPUT_VALID:
        if (event.type === 'TICKER_INPUT_CHANGED') {
          nextLocalState = event.payload.isValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
        } else if (event.type === 'SUBMIT_AUTOMATED_ANALYSIS_FORM') {
          newActiveAnalysisTicker = state.currentInputTicker;
          logDebug(logPrefixFSM as LogSourceId, 'Action_AUTOSUBMIT_FORM', `Setting activeAnalysisTicker to: ${newActiveAnalysisTicker}.`);
          nextLocalState = MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED;
        }
        break;
      
      case MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED:
        if (event.type === 'INTERNAL_GLOBAL_AUTOMATED_DISPATCH_SUCCESSFUL') {
          nextLocalState = MainTabLocalFsmState.AUTOMATED_PIPELINE_AWAITING_GLOBAL_PICKUP;
        } else if (event.type === 'TICKER_INPUT_CHANGED') { // Allow changing ticker even if request was made but not picked up
            nextLocalState = event.payload.isValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
            newActiveAnalysisTicker = null; // Invalidate previous request context
        }
        break;

      case MainTabLocalFsmState.AUTOMATED_PIPELINE_AWAITING_GLOBAL_PICKUP:
      case MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          const { globalFsmState } = event.payload;
          if (globalFsmState === GlobalFsmState.FULL_ANALYSIS_COMPLETE) {
            newActiveAnalysisTicker = state.currentInputTicker; // Solidify the active ticker on completion
            nextLocalState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
          } else if ([GlobalFsmState.IDLE, GlobalFsmState.STALE_DATA_FROM_ACTION_ERROR, GlobalFsmState.DATA_FETCH_FAILED, GlobalFsmState.AI_TA_FAILED].includes(globalFsmState)) {
            nextLocalState = state.currentInputTicker.trim() ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
            // Keep activeAnalysisTicker if pipeline failed, for potential manual retries on same ticker
          } else if ([GlobalFsmState.INITIALIZING_ANALYSIS, GlobalFsmState.AWAITING_DATA_FETCH_TRIGGER, GlobalFsmState.FETCHING_DATA, GlobalFsmState.ANALYZING_TA].includes(globalFsmState)) {
            nextLocalState = MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS;
          }
        } else if (event.type === 'TICKER_INPUT_CHANGED') { // Allow changing ticker during automated pipeline
            nextLocalState = event.payload.isValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
            newActiveAnalysisTicker = null;
        }
        break;

      case MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED:
        if (event.type === 'TICKER_INPUT_CHANGED') {
          if (!event.payload.isValid || event.payload.tickerValue !== state.activeAnalysisTicker) {
            newActiveAnalysisTicker = null;
            nextLocalState = event.payload.isValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
          }
        } else if (event.type === 'SUBMIT_AUTOMATED_ANALYSIS_FORM') {
          newActiveAnalysisTicker = state.currentInputTicker;
          nextLocalState = MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED;
        } else if (event.type === 'SUBMIT_MANUAL_KEY_TAKEAWAYS_FORM') {
          nextLocalState = MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED;
        } else if (event.type === 'SUBMIT_MANUAL_OPTIONS_ANALYSIS_FORM') {
          nextLocalState = MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED;
        }
        break;
      
      case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED:
        if (event.type === 'INTERNAL_GLOBAL_KT_DISPATCH_SUCCESSFUL') {
          nextLocalState = MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_AWAITING_GLOBAL_PICKUP;
        } // Other events (like TickerChanged) would transition out via MANUAL_ACTIONS_ENABLED first
        break;
      
      case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED:
        if (event.type === 'INTERNAL_GLOBAL_OPTIONS_DISPATCH_SUCCESSFUL') {
          nextLocalState = MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_AWAITING_GLOBAL_PICKUP;
        }
        break;

      case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_AWAITING_GLOBAL_PICKUP:
      case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          const { globalFsmState } = event.payload;
          if (globalFsmState === GlobalFsmState.GENERATING_KEY_TAKEAWAYS && state.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_AWAITING_GLOBAL_PICKUP) {
            nextLocalState = MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING;
          } else if ([GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED, GlobalFsmState.IDLE].includes(globalFsmState)) {
            nextLocalState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
            newActiveAnalysisTicker = state.activeAnalysisTicker;
          }
        }
        break;

      case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_AWAITING_GLOBAL_PICKUP:
      case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          const { globalFsmState } = event.payload;
          if (globalFsmState === GlobalFsmState.ANALYZING_OPTIONS && state.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_AWAITING_GLOBAL_PICKUP) {
            nextLocalState = MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING;
          } else if ([GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED, GlobalFsmState.IDLE].includes(globalFsmState)) {
            nextLocalState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
            newActiveAnalysisTicker = state.activeAnalysisTicker;
          }
        }
        break;
      default:
        break;
    }
    return { ...state, previousLocalState, localState: nextLocalState, currentInputTicker: event.type === 'TICKER_INPUT_CHANGED' ? event.payload.tickerValue : state.currentInputTicker, activeAnalysisTicker: newActiveAnalysisTicker };
  };

  const [localFsm, dispatchLocalFsmEventActual] = useReducer(mainTabLocalFsmReducer, {
    ...initialMainTabLocalFsmState,
    currentInputTicker: tickerInput,
  });
  const [targetLocalFsmDisplayState, setTargetLocalFsmDisplayState] = useState<MainTabLocalFsmState | null>(null);

   useEffect(() => {
    setMainTabFsmDisplayState({
      previous: localFsm.previousLocalState,
      current: localFsm.localState,
      target: targetLocalFsmDisplayState,
    });
  }, [localFsm.localState, localFsm.previousLocalState, targetLocalFsmDisplayState, setMainTabFsmDisplayState]);


  const dispatchLocalFsmEvent = useCallback((event: MainTabLocalFsmEvent) => {
    dispatchLocalFsmEventActual(event);
  }, [dispatchLocalFsmEventActual]);

  useEffect(() => {
    setMainTabFsmPreviousState(localFsm.previousLocalState);
    setMainTabFsmCurrentState(localFsm.localState);
  }, [localFsm.localState, localFsm.previousLocalState, setMainTabFsmPreviousState, setMainTabFsmCurrentState]);


  useEffect(() => {
    dispatchLocalFsmEvent({
      type: 'TICKER_INPUT_CHANGED',
      payload: { isValid: !!tickerInput.trim(), tickerValue: tickerInput }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  const globalDispatchGuardRef = useRef<Record<string, boolean>>({});
  const prevInputTickerRef = useRef<string>(localFsm.currentInputTicker);
  const prevActiveAnalysisTickerRef = useRef<string | null>(localFsm.activeAnalysisTicker);
  
  useEffect(() => {
    const logPrefixEff = 'MainTabContent_FSM:GlobalDispatchEffect_v3133';
    const currentGlobalState = globalFsmStateFromContext;
    const prevGlobalState = previousGlobalFsmStateFromContext;
  
    logDebug(logPrefixEff as LogSourceId, 'ENTRY', `Local: ${localFsm.localState}, ActiveTkr: ${localFsm.activeAnalysisTicker}, InputTkr: ${localFsm.currentInputTicker}, Global: ${currentGlobalState}, PrevGlobal: ${prevGlobalState}, Guard: ${JSON.stringify(globalDispatchGuardRef.current)}`);
  
    const activeTickerForAutomated = localFsm.currentInputTicker;
    const activeTickerForManual = localFsm.activeAnalysisTicker;
  
    const automatedActionName = `START_FULL_ANALYSIS_FOR_${activeTickerForAutomated}`;
    const ktActionName = `TRIGGER_MANUAL_KEY_TAKEAWAYS_FOR_${activeTickerForManual}`;
    const optActionName = `TRIGGER_MANUAL_OPTIONS_ANALYSIS_FOR_${activeTickerForManual}`;
  
    // Reset guards if ticker context fundamentally changes for that action type
    if (activeTickerForAutomated !== prevInputTickerRef.current && prevInputTickerRef.current) {
      const oldAutomatedKey = `START_FULL_ANALYSIS_FOR_${prevInputTickerRef.current}`;
      if (globalDispatchGuardRef.current[oldAutomatedKey]) {
        logDebug(logPrefixEff as LogSourceId, 'GuardReset_InputTickerChange', `Resetting guard: ${oldAutomatedKey}`);
        globalDispatchGuardRef.current[oldAutomatedKey] = false;
      }
    }
    if (activeTickerForManual !== prevActiveAnalysisTickerRef.current && prevActiveAnalysisTickerRef.current) {
      const oldKtKey = `TRIGGER_MANUAL_KEY_TAKEAWAYS_FOR_${prevActiveAnalysisTickerRef.current}`;
      const oldOptKey = `TRIGGER_MANUAL_OPTIONS_ANALYSIS_FOR_${prevActiveAnalysisTickerRef.current}`;
      if (globalDispatchGuardRef.current[oldKtKey]) {
        logDebug(logPrefixEff as LogSourceId, 'GuardReset_ActiveTickerChange_KT', `Resetting guard: ${oldKtKey}`);
        globalDispatchGuardRef.current[oldKtKey] = false;
      }
      if (globalDispatchGuardRef.current[oldOptKey]) {
        logDebug(logPrefixEff as LogSourceId, 'GuardReset_ActiveTickerChange_Opt', `Resetting guard: ${oldOptKey}`);
        globalDispatchGuardRef.current[oldOptKey] = false;
      }
    }
    prevInputTickerRef.current = activeTickerForAutomated;
    prevActiveAnalysisTickerRef.current = activeTickerForManual;
  
    // Dispatch logic
    if (localFsm.localState === MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED && activeTickerForAutomated) {
      if (!globalDispatchGuardRef.current[automatedActionName]) {
        logDebug(logPrefixEff as LogSourceId, 'DispatchingGlobal_Automated', `Dispatching START_FULL_ANALYSIS for ${activeTickerForAutomated}. Setting guard.`);
        globalDispatchGuardRef.current[automatedActionName] = true;
        dispatchGlobalFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: activeTickerForAutomated } });
        dispatchLocalFsmEventActual({ type: 'INTERNAL_GLOBAL_AUTOMATED_DISPATCH_SUCCESSFUL' });
      } else {
        logDebug(logPrefixEff as LogSourceId, 'DispatchSkipped_Automated_GuardActive', `Global dispatch for ${automatedActionName} skipped.`);
      }
    }
  
    if (localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED && activeTickerForManual) {
      if (!globalDispatchGuardRef.current[ktActionName]) {
        logDebug(logPrefixEff as LogSourceId, 'DispatchingGlobal_ManualKT', `Dispatching TRIGGER_MANUAL_KEY_TAKEAWAYS for ${activeTickerForManual}. Setting guard.`);
        globalDispatchGuardRef.current[ktActionName] = true;
        dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS', payload: { ticker: activeTickerForManual } });
        dispatchLocalFsmEventActual({ type: 'INTERNAL_GLOBAL_KT_DISPATCH_SUCCESSFUL' });
      } else {
        logDebug(logPrefixEff as LogSourceId, 'DispatchSkipped_ManualKT_GuardActive', `Global dispatch for ${ktActionName} skipped.`);
      }
    }
  
    if (localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED && activeTickerForManual) {
      if (!globalDispatchGuardRef.current[optActionName]) {
        logDebug(logPrefixEff as LogSourceId, 'DispatchingGlobal_ManualOpt', `Dispatching TRIGGER_MANUAL_OPTIONS_ANALYSIS for ${activeTickerForManual}. Setting guard.`);
        globalDispatchGuardRef.current[optActionName] = true;
        dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS', payload: { ticker: activeTickerForManual } });
        dispatchLocalFsmEventActual({ type: 'INTERNAL_GLOBAL_OPTIONS_DISPATCH_SUCCESSFUL' });
      } else {
        logDebug(logPrefixEff as LogSourceId, 'DispatchSkipped_ManualOpt_GuardActive', `Global dispatch for ${optActionName} skipped.`);
      }
    }
  
    // Guard Reset Logic based on Global FSM Terminal States for the specific ticker
    const automatedPipelineTerminalStates: GlobalFsmState[] = [GlobalFsmState.FULL_ANALYSIS_COMPLETE, GlobalFsmState.DATA_FETCH_FAILED, GlobalFsmState.STALE_DATA_FROM_ACTION_ERROR, GlobalFsmState.AI_TA_FAILED];
    const keyTakeawaysTerminalStates: GlobalFsmState[] = [GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED];
    const optionsAnalysisTerminalStates: GlobalFsmState[] = [GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED];
    
    const tickerJustCompletedAutomated = localFsm.activeAnalysisTicker; // Check against the activeAnalysisTicker as it's set upon completion
    const guardKeyForAutomated = tickerJustCompletedAutomated ? `START_FULL_ANALYSIS_FOR_${tickerJustCompletedAutomated}` : null;

    if (guardKeyForAutomated && globalDispatchGuardRef.current[guardKeyForAutomated] &&
        currentGlobalState === GlobalFsmState.IDLE &&
        prevGlobalState && automatedPipelineTerminalStates.includes(prevGlobalState)
    ) {
      logDebug(logPrefixEff as LogSourceId, 'ResettingGuard_AutomatedDone', `Global FSM IDLE after terminal state ${prevGlobalState} for ${guardKeyForAutomated}. Resetting guard.`);
      globalDispatchGuardRef.current[guardKeyForAutomated] = false;
    }
  
    const tickerJustCompletedManualKT = localFsm.activeAnalysisTicker;
    const guardKeyForManualKT = tickerJustCompletedManualKT ? `TRIGGER_MANUAL_KEY_TAKEAWAYS_FOR_${tickerJustCompletedManualKT}` : null;
    if (guardKeyForManualKT && globalDispatchGuardRef.current[guardKeyForManualKT] &&
        currentGlobalState === GlobalFsmState.IDLE &&
        prevGlobalState && keyTakeawaysTerminalStates.includes(prevGlobalState)
    ) {
      logDebug(logPrefixEff as LogSourceId, 'ResettingGuard_ManualKTDone', `Global FSM IDLE after terminal state ${prevGlobalState} for ${guardKeyForManualKT}. Resetting guard.`);
      globalDispatchGuardRef.current[guardKeyForManualKT] = false;
    }
  
    const tickerJustCompletedManualOpt = localFsm.activeAnalysisTicker;
    const guardKeyForManualOpt = tickerJustCompletedManualOpt ? `TRIGGER_MANUAL_OPTIONS_ANALYSIS_FOR_${tickerJustCompletedManualOpt}` : null;
    if (guardKeyForManualOpt && globalDispatchGuardRef.current[guardKeyForManualOpt] &&
        currentGlobalState === GlobalFsmState.IDLE &&
        prevGlobalState && optionsAnalysisTerminalStates.includes(prevGlobalState)
    ) {
      logDebug(logPrefixEff as LogSourceId, 'ResettingGuard_ManualOptDone', `Global FSM IDLE after terminal state ${prevGlobalState} for ${guardKeyForManualOpt}. Resetting guard.`);
      globalDispatchGuardRef.current[guardKeyForManualOpt] = false;
    }
  
  }, [
    localFsm.localState,
    localFsm.activeAnalysisTicker,
    localFsm.currentInputTicker,
    globalFsmStateFromContext,
    previousGlobalFsmStateFromContext, // Make sure this is correctly passed if needed for more precise guard reset
    dispatchGlobalFsmEvent,
    logDebug,
    dispatchLocalFsmEventActual // Added for internal dispatch
  ]);


  useEffect(() => {
    dispatchLocalFsmEvent({ type: 'GLOBAL_FSM_UPDATED', payload: { globalFsmState: globalFsmStateFromContext, previousGlobalFsmState: previousGlobalFsmStateFromContext } });
  }, [globalFsmStateFromContext, previousGlobalFsmStateFromContext, dispatchLocalFsmEvent]);


  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(
    chatServerAction,
    initialLocalChatActionState
  );


  useEffect(() => {
    if (chatActionState.status === 'success' && chatActionState.data) {
        logDebug('MainTabContent:chatActionState' as LogSourceId, 'ChatActionResultObserved:SUCCESS', `Chat action server call succeeded. Message: ${chatActionState.message}`);
        setChatbotRequestJson(chatActionState.data.chatbotRequestJson);
        setChatbotResponseJson(chatActionState.data.chatbotResponseJson);
        try {
            const modelResponse = JSON.parse(chatActionState.data.chatbotResponseJson);
            if (modelResponse.error) {
                logDebug('MainTabContent:chatActionState' as LogSourceId, 'ModelResponseWithErrorField', 'Chatbot flow indicated an error:', modelResponse.error);
                addChatMessageToGlobalContext({
                    id: Date.now().toString() + '_model_flow_error_main',
                    role: 'model',
                    content: modelResponse.message || modelResponse.error || "Sorry, the chatbot encountered an issue.",
                });
            } else if (modelResponse.response) {
                const lastMessageInHistory = contextChatHistoryRef.current[contextChatHistoryRef.current.length -1];
                if (lastMessageInHistory?.role !== 'model' || lastMessageInHistory?.content !== modelResponse.response) {
                    addChatMessageToGlobalContext({
                        id: Date.now().toString() + '_model_main',
                        role: 'model',
                        content: modelResponse.response,
                    });
                    logDebug('MainTabContent:chatActionState' as LogSourceId, 'ModelResponseAdded', 'Model response added to global chat history.');
                } else {
                    logDebug('MainTabContent:chatActionState' as LogSourceId, 'ModelResponseDuplicate', 'Duplicate model response detected, not adding to history.');
                }
            } else {
                 logDebug('MainTabContent:chatActionState' as LogSourceId, 'ModelResponseMissing', 'Model response content missing in successful action state data.');
                 addChatMessageToGlobalContext({
                    id: Date.now().toString() + '_model_malformed_main',
                    role: 'model',
                    content: "Sorry, I received an unclear response. Please try again.",
                });
            }
        } catch (e) {
            logDebug('MainTabContent:chatActionState' as LogSourceId, 'ModelResponseParseError', 'Failed to parse chatbotResponseJson.', e);
             addChatMessageToGlobalContext({
                id: Date.now().toString() + '_model_parse_error_main',
                role: 'model',
                content: "Sorry, I had trouble understanding that response. Please try again.",
            });
        }
    } else if (chatActionState.status === 'error') {
        logDebug('MainTabContent:chatActionState' as LogSourceId, 'ChatActionResultObserved:ERROR', `Chat action server call failed. Error: ${chatActionState.error}, Message: ${chatActionState.message}`);
        setChatbotRequestJson(chatActionState.data?.chatbotRequestJson || JSON.stringify({ error: chatActionState.error, message: chatActionState.message }, null, 2));
        setChatbotResponseJson(chatActionState.data?.chatbotResponseJson || JSON.stringify({ error: chatActionState.error, details: "Server action failed directly." }, null, 2));
        addChatMessageToGlobalContext({
            id: Date.now().toString() + '_model_action_error_main',
            role: 'model',
            content: chatActionState.message || "Sorry, an error occurred. Please try again.",
        });
    }
  }, [chatActionState, addChatMessageToGlobalContext, logDebug, setChatbotRequestJson, setChatbotResponseJson]);


  const handleTickerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTicker = e.target.value.toUpperCase();
    setTickerInput(newTicker);
    dispatchLocalFsmEvent({ type: 'TICKER_INPUT_CHANGED', payload: { isValid: !!newTicker.trim(), tickerValue: newTicker } });
  };

  const handleAnalyzeStockSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!localFsm.currentInputTicker.trim()) {
      toast({ title: "Invalid Ticker", description: "Please enter a stock ticker.", variant: "destructive" });
      return;
    }
    logDebug('MainTabContent_FSM' as LogSourceId, 'UserAction_AnalyzeStock_CLICKED', `Button clicked for ${localFsm.currentInputTicker}. LocalState: ${localFsm.localState}`);
    dispatchLocalFsmEvent({ type: 'SUBMIT_AUTOMATED_ANALYSIS_FORM' });
  };

  const handleGenerateKeyTakeaways = () => {
    logDebug('MainTabContent_FSM' as LogSourceId, 'UserAction_GenKT_CLICKED', `Button clicked for ${localFsm.activeAnalysisTicker}. LocalState: ${localFsm.localState}`);
    dispatchLocalFsmEvent({ type: 'SUBMIT_MANUAL_KEY_TAKEAWAYS_FORM' });
  };

  const handleGenerateOptionsAnalysis = () => {
    logDebug('MainTabContent_FSM' as LogSourceId, 'UserAction_GenOpt_CLICKED', `Button clicked for ${localFsm.activeAnalysisTicker}. LocalState: ${localFsm.localState}`);
    dispatchLocalFsmEvent({ type: 'SUBMIT_MANUAL_OPTIONS_ANALYSIS_FORM' });
  };


  const isGlobalPipelineActive = ![
    GlobalFsmState.IDLE,
    GlobalFsmState.FULL_ANALYSIS_COMPLETE,
    GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED,
    GlobalFsmState.KEY_TAKEAWAYS_FAILED,
    GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED,
    GlobalFsmState.OPTIONS_ANALYSIS_FAILED,
    GlobalFsmState.STALE_DATA_FROM_ACTION_ERROR,
    GlobalFsmState.DATA_FETCH_FAILED,
    GlobalFsmState.AI_TA_FAILED,
  ].includes(globalFsmStateFromContext);

  const isOverallAnalysisPending = isGlobalPipelineActive || isChatPending;


  const analyzeButtonLoading = 
    localFsm.localState === MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED ||
    localFsm.localState === MainTabLocalFsmState.AUTOMATED_PIPELINE_AWAITING_GLOBAL_PICKUP ||
    localFsm.localState === MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS ||
    [ GlobalFsmState.INITIALIZING_ANALYSIS, GlobalFsmState.AWAITING_DATA_FETCH_TRIGGER,
      GlobalFsmState.FETCHING_DATA, GlobalFsmState.AWAITING_AI_TA_TRIGGER, GlobalFsmState.ANALYZING_TA
    ].includes(globalFsmStateFromContext);

  const analyzeButtonDisabled = !([MainTabLocalFsmState.INPUT_VALID, MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED].includes(localFsm.localState)) ||
                                analyzeButtonLoading ||
                                (isGlobalPipelineActive && globalFsmStateFromContext !== GlobalFsmState.IDLE && globalFsmStateFromContext !== GlobalFsmState.FULL_ANALYSIS_COMPLETE);

  const [isKtButtonDisabled, setIsKtButtonDisabled] = useState(true);
  const [isOptButtonDisabled, setIsOptButtonDisabled] = useState(true);

  const keyTakeawaysButtonLoading = 
    localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED ||
    localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_AWAITING_GLOBAL_PICKUP ||
    localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING ||
    globalFsmStateFromContext === GlobalFsmState.GENERATING_KEY_TAKEAWAYS;

  const optionsAnalysisButtonLoading = 
    localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED ||
    localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_AWAITING_GLOBAL_PICKUP ||
    localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING ||
    globalFsmStateFromContext === GlobalFsmState.ANALYZING_OPTIONS;

  useEffect(() => {
    const logPrefixDC = 'MainTabContent_FSM:ButtonStateEffect_DC';

    const currentLocalFsmState = localFsm.localState;
    const currentActiveAnalysisTicker = localFsm.activeAnalysisTicker;
    const currentInputTickerValue = localFsm.currentInputTicker;
    const currentGlobalFsmState = globalFsmStateFromContext;
    const currentAnalyzeButtonLoading = analyzeButtonLoading;
    const currentKtButtonLoading = keyTakeawaysButtonLoading;
    const currentOptButtonLoading = optionsAnalysisButtonLoading;
    const currentIsGlobalPipelineActive = isGlobalPipelineActive;

    const manualActionsPossible = currentLocalFsmState === MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED &&
                                  !!currentActiveAnalysisTicker &&
                                  currentActiveAnalysisTicker === currentInputTickerValue;

    const ktSnapshotReady = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, logPrefixDC as LogSourceId, 'KT_Snapshot_DC');
    const ktStdTaReady = isDataReadyForProcessing(contextStandardTasJson, logDebug, logPrefixDC as LogSourceId, 'KT_StdTA_DC');
    const ktAiTaReady = isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, logPrefixDC as LogSourceId, 'KT_AiTA_DC');
    const ktMarketStatusReady = isDataReadyForProcessing(contextMarketStatusJson, logDebug, logPrefixDC as LogSourceId, 'KT_MarketStatus_DC');
    const ktPrereqsMet = ktSnapshotReady && ktStdTaReady && ktAiTaReady && ktMarketStatusReady;

    const optSnapshotReady = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, logPrefixDC as LogSourceId, 'Opt_Snapshot_DC');
    const optChainReady = isDataReadyForProcessing(contextOptionsChainJson, logDebug, logPrefixDC as LogSourceId, 'Opt_Chain_DC');
    const optPrereqsMet = optSnapshotReady && optChainReady;

    const shouldKtButtonBeEnabled = manualActionsPossible && !currentKtButtonLoading && !currentAnalyzeButtonLoading &&
                                 !(currentIsGlobalPipelineActive && currentGlobalFsmState !== GlobalFsmState.IDLE && currentGlobalFsmState !== GlobalFsmState.FULL_ANALYSIS_COMPLETE) &&
                                 ktPrereqsMet;

    const shouldOptButtonBeEnabled = manualActionsPossible && !currentOptButtonLoading && !currentAnalyzeButtonLoading &&
                                  !(currentIsGlobalPipelineActive && currentGlobalFsmState !== GlobalFsmState.IDLE && currentGlobalFsmState !== GlobalFsmState.FULL_ANALYSIS_COMPLETE) &&
                                  optPrereqsMet;

    setIsKtButtonDisabled(!shouldKtButtonBeEnabled);
    setIsOptButtonDisabled(!shouldOptButtonBeEnabled);

  }, [
      localFsm.localState, localFsm.activeAnalysisTicker, localFsm.currentInputTicker,
      globalFsmStateFromContext,
      contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, contextOptionsChainJson,
      analyzeButtonLoading, keyTakeawaysButtonLoading, optionsAnalysisButtonLoading, isGlobalPipelineActive, logDebug
    ]);


  const getCombinedDataForExport = useCallback(() => {
    const baseData: any = {
      ticker: localFsm.activeAnalysisTicker || localFsm.currentInputTicker,
      marketStatus: JSON.parse(contextMarketStatusJson || '{}'),
      stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
      standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'),
      aiAnalyzedTechnicalAnalysis: JSON.parse(contextAiAnalyzedTaJson || '{}'),
    };

    if (isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, 'CombinedExportCheck' as LogSourceId, 'AiKeyTakeaways')) {
      baseData.aiKeyTakeaways = JSON.parse(contextAiKeyTakeawaysJson || '{}');
    }
    if (isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, 'CombinedExportCheck' as LogSourceId, 'AiOptionsAnalysis')) {
      baseData.aiOptionsAnalysis = JSON.parse(contextAiOptionsAnalysisJson || '{}');
    }
    if (isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'CombinedExportCheck' as LogSourceId, 'OptionsChain')) {
      baseData.optionsChain = JSON.parse(contextOptionsChainJson || '{}');
    }


    return baseData;
  }, [
      localFsm.activeAnalysisTicker, localFsm.currentInputTicker,
      contextMarketStatusJson, contextStockSnapshotJson, contextStandardTasJson,
      contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson,
      contextOptionsChainJson, logDebug
    ]);

  const isBaseDataReadyForCombinedExport =
    isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'ExportCheck' as LogSourceId, 'MarketStatus') &&
    isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'ExportCheck' as LogSourceId, 'StockSnapshot') &&
    isDataReadyForProcessing(contextStandardTasJson, logDebug, 'ExportCheck' as LogSourceId, 'StandardTAs') &&
    isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'ExportCheck' as LogSourceId, 'AiAnalyzedTA');

  const combinedExportButtonsDisabled =
    !isBaseDataReadyForCombinedExport ||
    analyzeButtonLoading ||
    keyTakeawaysButtonLoading ||
    optionsAnalysisButtonLoading ||
    isGlobalPipelineActive;


  const handleExportAllToJson = useCallback(async () => {
    logDebug('MainTabContent' as LogSourceId, 'Export_All', 'Export All to JSON clicked.');
    if (!isBaseDataReadyForCombinedExport) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'Core data sections are not available for export.' });
      return;
    }
    try {
      const combinedData = getCombinedDataForExport();
      const filename = `${combinedData.ticker || 'StockSage'}_full_analysis_${new Date().toISOString().split('T')[0]}.json`;
      downloadJson(combinedData, filename);
      toast({ title: 'Export Successful', description: `Data exported to ${filename}` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export Error', description: `Could not export data: ${e.message}` });
    }
  }, [isBaseDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  const handleCopyAllToJson = useCallback(async () => {
    logDebug('MainTabContent' as LogSourceId, 'Copy_All', 'Copy All to JSON clicked.');
     if (!isBaseDataReadyForCombinedExport) {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Core data sections are not available for copy.' });
      return;
    }
    try {
      const combinedData = getCombinedDataForExport();
      const success = await copyToClipboard(JSON.stringify(combinedData, null, 2));
      if (success) {
        toast({ title: 'Copied to Clipboard', description: 'Data copied as JSON.' });
      } else {
        throw new Error('Clipboard API failed.');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Copy Error', description: `Could not copy data: ${e.message}` });
    }
  }, [isBaseDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis Input</CardTitle>
        <CardDescription>
          Enter ticker for Data Fetch & AI TA. Manual AI actions available after.
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
                disabled={analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading || isGlobalPipelineActive}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon" disabled>
                <SelectTrigger id="dataSource" disabled={analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading || isGlobalPipelineActive}>
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
              disabled={analyzeButtonDisabled}>
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
              Generate specific AI insights for {localFsm.activeAnalysisTicker || "the analyzed stock"}. Available after initial "Analyze Stock" is complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleGenerateKeyTakeaways}
                  className="w-full sm:w-auto"
                  disabled={isKtButtonDisabled}
                >
                  {keyTakeawaysButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Brain className="mr-2 h-4 w-4" /> Generate AI Key Takeaways
                </Button>
                <Button
                  onClick={handleGenerateOptionsAnalysis}
                  className="w-full sm:w-auto"
                  disabled={isOptButtonDisabled}
                >
                  {optionsAnalysisButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <BarChartBig className="mr-2 h-4 w-4" /> Generate AI Options Analysis
                </Button>
              </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-2">
            <h3 className="text-lg font-medium">Combined Data Export</h3>
            <CardDescription>Exports Snapshot, Standard TAs, AI Analyzed TA, and Market Status. AI Key Takeaways, Options Chain, and AI Options Analysis are included if available.</CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={handleExportAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={combinedExportButtonsDisabled}>
                    <Download className="mr-2 h-4 w-4" /> Export All to JSON
                </Button>
                <Button onClick={handleCopyAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={combinedExportButtonsDisabled}>
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
          <ChatbotFsmProvider
            chatFormAction={chatFormAction}
            addChatMessageToGlobalContext={addChatMessageToGlobalContext}
            currentTicker={localFsm.activeAnalysisTicker || localFsm.currentInputTicker}
            stockSnapshotJson={contextStockSnapshotJson || '{}'}
            aiKeyTakeawaysJson={contextAiKeyTakeawaysJson || '{}'}
            aiAnalyzedTaJson={contextAiAnalyzedTaJson || '{}'}
            aiOptionsAnalysisJson={contextAiOptionsAnalysisJson || '{}'}
            currentGlobalChatHistory={contextChatHistory}
            logDebug={logDebug}
            setChatbotFsmDisplayState={setChatbotFsmDisplay}
          >
            <Chatbot
              isAnyAnalysisInProgress={isOverallAnalysisPending}
              currentTickerForDisplay={localFsm.activeAnalysisTicker || localFsm.currentInputTicker}
            />
          </ChatbotFsmProvider>
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}
