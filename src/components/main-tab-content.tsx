
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
import { AiOptionsAnalysisDisplay } from "@/components/ai-options-analysis-display";
import { AiKeyTakeawaysDisplay } from "@/components/ai-key-takeaways-display";
import { Chatbot } from "@/components/chatbot";
import { ChatbotFsmProvider } from "@/contexts/chatbot-fsm-context";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";

import { useStockAnalysis, type ChatMessage, FsmState as GlobalFsmState, type FsmDisplayTuple } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap, Brain, BarChartBig } from "lucide-react";
import type { StockSnapshotData } from '@/services/data-sources/types';
import { useActionState } from 'react';
import type { ChatActionState, ChatActionInputs } from '@/actions/chat-server-action';


enum MainTabLocalFsmState {
  IDLE = 'IDLE',
  INPUT_VALID = 'INPUT_VALID',
  AUTOMATED_PIPELINE_REQUESTED = 'AUTOMATED_PIPELINE_REQUESTED',
  AUTOMATED_PIPELINE_IN_PROGRESS = 'AUTOMATED_PIPELINE_IN_PROGRESS',
  MANUAL_ACTIONS_ENABLED = 'MANUAL_ACTIONS_ENABLED',
  MANUAL_KEY_TAKEAWAYS_REQUESTED = 'MANUAL_KEY_TAKEAWAYS_REQUESTED',
  MANUAL_KEY_TAKEAWAYS_PENDING = 'MANUAL_KEY_TAKEAWAYS_PENDING',
  MANUAL_OPTIONS_ANALYSIS_REQUESTED = 'MANUAL_OPTIONS_ANALYSIS_REQUESTED',
  MANUAL_OPTIONS_ANALYSIS_PENDING = 'MANUAL_OPTIONS_ANALYSIS_PENDING',
}

type MainTabLocalFsmEvent =
  | { type: 'TICKER_INPUT_CHANGED'; payload: { isValid: boolean; tickerValue: string } }
  | { type: 'AUTOMATED_ANALYSIS_SUBMITTED' }
  | { type: 'MANUAL_KEY_TAKEAWAYS_SUBMITTED' }
  | { type: 'MANUAL_OPTIONS_ANALYSIS_SUBMITTED' }
  | { type: 'GLOBAL_FSM_UPDATED'; payload: { globalFsmState: GlobalFsmState } };

interface MainTabLocalFsmManagedState {
  localState: MainTabLocalFsmState;
  previousLocalState: MainTabLocalFsmState | null;
  activeAnalysisTicker: string | null;
  currentInputTicker: string;
}

const initialMainTabLocalFsmState: MainTabLocalFsmManagedState = {
  localState: MainTabLocalFsmState.IDLE,
  previousLocalState: null,
  activeAnalysisTicker: null,
  currentInputTicker: "NVDA",
};

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
    fsmState: globalFsmStateFromContext,
    dispatchFsmEvent: dispatchGlobalFsmEvent,
    chatHistory: contextChatHistory,
    addChatMessage: addChatMessageToGlobalContext,
    setMainTabFsmDisplay,
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
    logDebug('MainTabContent_FSM', 'LocalReducerEvent', `Event: ${event.type}, CurrLocal: ${state.localState}, PrevLocal: ${previousLocalState}, CurrInput: ${state.currentInputTicker}, ActiveAnalysis: ${state.activeAnalysisTicker}`);
    let nextLocalState = state.localState;

    switch (state.localState) {
      case MainTabLocalFsmState.IDLE:
        if (event.type === 'TICKER_INPUT_CHANGED') {
          nextLocalState = event.payload.isValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
          return { ...state, previousLocalState, localState: nextLocalState, currentInputTicker: event.payload.tickerValue };
        }
        return { ...state, previousLocalState };


      case MainTabLocalFsmState.INPUT_VALID:
        if (event.type === 'TICKER_INPUT_CHANGED') {
          nextLocalState = event.payload.isValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
          return { ...state, previousLocalState, localState: nextLocalState, currentInputTicker: event.payload.tickerValue };
        }
        if (event.type === 'AUTOMATED_ANALYSIS_SUBMITTED') {
          logDebug('MainTabContent_FSM', 'LocalReducerAction', `INPUT_VALID -> AUTOMATED_ANALYSIS_SUBMITTED. Setting activeAnalysisTicker to: ${state.currentInputTicker}. Transitioning to AUTOMATED_PIPELINE_REQUESTED.`);
          return { ...state, previousLocalState, localState: MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED, activeAnalysisTicker: state.currentInputTicker };
        }
        return { ...state, previousLocalState };

      case MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if ([GlobalFsmState.INITIALIZING_ANALYSIS, GlobalFsmState.AWAITING_DATA_FETCH_TRIGGER, GlobalFsmState.FETCHING_DATA, GlobalFsmState.ANALYZING_TA].includes(event.payload.globalFsmState)) {
            nextLocalState = MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS;
          }
        }
        return { ...state, previousLocalState, localState: nextLocalState };

      case MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if (event.payload.globalFsmState === GlobalFsmState.FULL_ANALYSIS_COMPLETE) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `AUTOMATED_PIPELINE_IN_PROGRESS -> GLOBAL_FSM_UPDATED (FULL_ANALYSIS_COMPLETE). Transitioning to MANUAL_ACTIONS_ENABLED. ActiveAnalysisTicker (${state.activeAnalysisTicker}) PRESERVED.`);
            return { ...state, previousLocalState, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED }; // activeAnalysisTicker is preserved
          }
          if ([GlobalFsmState.IDLE, GlobalFsmState.STALE_DATA_FROM_ACTION_ERROR, GlobalFsmState.DATA_FETCH_FAILED, GlobalFsmState.AI_TA_FAILED].includes(event.payload.globalFsmState)) {
            const isInputStillValid = !!state.currentInputTicker.trim();
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `AUTOMATED_PIPELINE_IN_PROGRESS -> GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Resetting to INPUT_VALID/IDLE. ActiveAnalysisTicker cleared.`);
            nextLocalState = isInputStillValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
            return {
              ...initialMainTabLocalFsmState, previousLocalState,
              currentInputTicker: state.currentInputTicker,
              localState: nextLocalState,
              activeAnalysisTicker: null, 
            };
          }
        }
        return { ...state, previousLocalState, localState: nextLocalState };

      case MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED:
        if (event.type === 'TICKER_INPUT_CHANGED') {
          const newState = { ...state, previousLocalState, currentInputTicker: event.payload.tickerValue };
          if (!event.payload.isValid) { // Current input becomes invalid
            return { ...newState, localState: MainTabLocalFsmState.IDLE, activeAnalysisTicker: null };
          }
          if (event.payload.tickerValue !== state.activeAnalysisTicker) { // Current input is valid but DIFFERENT from active analyzed ticker
            return { ...newState, localState: MainTabLocalFsmState.INPUT_VALID, activeAnalysisTicker: null };
          }
          // Ticker is valid and matches activeAnalysisTicker, or was re-typed to be the same
          return newState; 
        }
        if (event.type === 'AUTOMATED_ANALYSIS_SUBMITTED') { // User wants to re-run full analysis for current input
          return { ...state, previousLocalState, localState: MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED, activeAnalysisTicker: state.currentInputTicker };
        }
        if (event.type === 'MANUAL_KEY_TAKEAWAYS_SUBMITTED') {
          return { ...state, previousLocalState, localState: MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED };
        }
        if (event.type === 'MANUAL_OPTIONS_ANALYSIS_SUBMITTED') {
          return { ...state, previousLocalState, localState: MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED };
        }
        if (event.type === 'GLOBAL_FSM_UPDATED' && event.payload.globalFsmState === GlobalFsmState.IDLE) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_ACTIONS_ENABLED -> GLOBAL_FSM_UPDATED (IDLE). Global is IDLE, but local stays MANUAL_ACTIONS_ENABLED to keep manual buttons active for ${state.activeAnalysisTicker}.`);
            // Crucially, stay in MANUAL_ACTIONS_ENABLED and preserve activeAnalysisTicker.
            // The "Analyze Stock" button will become enabled based on currentInputTicker.
            return { ...state, previousLocalState, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED }; 
        }
        return { ...state, previousLocalState, localState: nextLocalState };


      case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if (event.payload.globalFsmState === GlobalFsmState.GENERATING_KEY_TAKEAWAYS) {
            nextLocalState = MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING;
          } else if ([GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE, GlobalFsmState.IDLE].includes(event.payload.globalFsmState)) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_KEY_TAKEAWAYS_REQUESTED -> GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Returning to MANUAL_ACTIONS_ENABLED.`);
            nextLocalState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
          }
        }
        return { ...state, previousLocalState, localState: nextLocalState };

      case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if ([GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE, GlobalFsmState.IDLE].includes(event.payload.globalFsmState)) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_KEY_TAKEAWAYS_PENDING -> GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Returning to MANUAL_ACTIONS_ENABLED.`);
            nextLocalState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
          }
        }
        return { ...state, previousLocalState, localState: nextLocalState };

      case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED:
         if (event.type === 'GLOBAL_FSM_UPDATED') {
          if (event.payload.globalFsmState === GlobalFsmState.ANALYZING_OPTIONS) {
            nextLocalState = MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING;
          } else if ([GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE, GlobalFsmState.IDLE].includes(event.payload.globalFsmState)) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_OPTIONS_ANALYSIS_REQUESTED -> GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Returning to MANUAL_ACTIONS_ENABLED.`);
            nextLocalState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
          }
        }
        return { ...state, previousLocalState, localState: nextLocalState };

      case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if ([GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE, GlobalFsmState.IDLE].includes(event.payload.globalFsmState)) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_OPTIONS_ANALYSIS_PENDING -> GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Returning to MANUAL_ACTIONS_ENABLED.`);
            nextLocalState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
          }
        }
        return { ...state, previousLocalState, localState: nextLocalState };
      default:
        return { ...state, previousLocalState };
    }
  };

  const [localFsm, dispatchLocalFsmEventActual] = useReducer(mainTabLocalFsmReducer, {
    ...initialMainTabLocalFsmState,
    currentInputTicker: tickerInput,
  });
  const [targetLocalFsmDisplayState, setTargetLocalFsmDisplayState] = useState<MainTabLocalFsmState | null>(null);

  const dispatchLocalFsmEvent = useCallback((event: MainTabLocalFsmEvent) => {
    let targetState: MainTabLocalFsmState | null = null;
    const currentLocalState = localFsm.localState;

    switch(currentLocalState) {
        case MainTabLocalFsmState.IDLE:
            if (event.type === 'TICKER_INPUT_CHANGED') targetState = event.payload.isValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
            break;
        case MainTabLocalFsmState.INPUT_VALID:
            if (event.type === 'TICKER_INPUT_CHANGED') targetState = event.payload.isValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
            else if (event.type === 'AUTOMATED_ANALYSIS_SUBMITTED') targetState = MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED;
            break;
        case MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED:
            if (event.type === 'GLOBAL_FSM_UPDATED' && [GlobalFsmState.INITIALIZING_ANALYSIS, GlobalFsmState.AWAITING_DATA_FETCH_TRIGGER, GlobalFsmState.FETCHING_DATA, GlobalFsmState.ANALYZING_TA].includes(event.payload.globalFsmState)) {
                targetState = MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS;
            }
            break;
        case MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS:
            if (event.type === 'GLOBAL_FSM_UPDATED') {
                if (event.payload.globalFsmState === GlobalFsmState.FULL_ANALYSIS_COMPLETE) targetState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
                else if ([GlobalFsmState.IDLE, GlobalFsmState.STALE_DATA_FROM_ACTION_ERROR, GlobalFsmState.DATA_FETCH_FAILED, GlobalFsmState.AI_TA_FAILED].includes(event.payload.globalFsmState)) {
                    targetState = localFsm.currentInputTicker.trim() ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
                }
            }
            break;
        case MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED:
            if (event.type === 'TICKER_INPUT_CHANGED') {
                 if (!event.payload.isValid) targetState = MainTabLocalFsmState.IDLE;
                 else if (event.payload.tickerValue !== localFsm.activeAnalysisTicker) targetState = MainTabLocalFsmState.INPUT_VALID;
                 else targetState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED; 
            } else if (event.type === 'AUTOMATED_ANALYSIS_SUBMITTED') targetState = MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED;
            else if (event.type === 'MANUAL_KEY_TAKEAWAYS_SUBMITTED') targetState = MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED;
            else if (event.type === 'MANUAL_OPTIONS_ANALYSIS_SUBMITTED') targetState = MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED;
            else if (event.type === 'GLOBAL_FSM_UPDATED' && event.payload.globalFsmState === GlobalFsmState.IDLE) targetState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED; 
            break;
        case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED:
            if (event.type === 'GLOBAL_FSM_UPDATED') {
                if (event.payload.globalFsmState === GlobalFsmState.GENERATING_KEY_TAKEAWAYS) targetState = MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING;
                else if ([GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE, GlobalFsmState.IDLE].includes(event.payload.globalFsmState)) targetState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
            }
            break;
        case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING:
             if (event.type === 'GLOBAL_FSM_UPDATED' && [GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE, GlobalFsmState.IDLE].includes(event.payload.globalFsmState)) targetState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
            break;
        case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED:
            if (event.type === 'GLOBAL_FSM_UPDATED') {
                if (event.payload.globalFsmState === GlobalFsmState.ANALYZING_OPTIONS) targetState = MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING;
                else if ([GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE, GlobalFsmState.IDLE].includes(event.payload.globalFsmState)) targetState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
            }
            break;
        case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING:
            if (event.type === 'GLOBAL_FSM_UPDATED' && [GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE, GlobalFsmState.IDLE].includes(event.payload.globalFsmState)) targetState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
            break;
        default: targetState = null; 
    }

    if (targetState) {
        logDebug('MainTabContent_FSM', 'DispatchWithTarget', `Event ${event.type} from ${currentLocalState} targeting ${targetState}.`);
        setTargetLocalFsmDisplayState(targetState);
    }
    dispatchLocalFsmEventActual(event);
  }, [localFsm.localState, localFsm.currentInputTicker, localFsm.activeAnalysisTicker, logDebug]);

  useEffect(() => {
    if (targetLocalFsmDisplayState !== null && localFsm.localState === targetLocalFsmDisplayState) {
        logDebug('MainTabContent_FSM', 'TargetClearEffect', `Local FSM state changed to ${localFsm.localState}. Clearing target display state.`);
        setTargetLocalFsmDisplayState(null);
    }
  }, [localFsm.localState, targetLocalFsmDisplayState, logDebug]);

  useEffect(() => {
    setMainTabFsmDisplay({
        previous: localFsm.previousLocalState,
        current: localFsm.localState,
        target: targetLocalFsmDisplayState
    });
  }, [localFsm.localState, localFsm.previousLocalState, targetLocalFsmDisplayState, setMainTabFsmDisplay]);


  useEffect(() => {
    logDebug('MainTabContent_FSM', 'InitialMountEffect', `Component mounted. Initial tickerInput: "${tickerInput}". Dispatching TICKER_INPUT_CHANGED.`);
    dispatchLocalFsmEvent({
      type: 'TICKER_INPUT_CHANGED',
      payload: { isValid: !!tickerInput.trim(), tickerValue: tickerInput }
    });
  }, []); // tickerInput removed as per previous fix, ensure it's not re-added if not needed. Dispatch and logDebug are stable.

  const [, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(() => ({status: 'idle'}), initialChatActionState);


  useEffect(() => {
    logDebug('MainTabContent_FSM', 'LocalFsmSideEffect', `LocalState: ${localFsm.localState}, PrevLocal: ${localFsm.previousLocalState}, ActiveAnalysisTicker: ${localFsm.activeAnalysisTicker}, CurrentInputTicker: ${localFsm.currentInputTicker}`);
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
  }, [localFsm.localState, localFsm.activeAnalysisTicker, localFsm.previousLocalState, dispatchGlobalFsmEvent, logDebug]);


  useEffect(() => {
    logDebug('MainTabContent_FSM', 'GlobalFsmListener', `Global FSM state changed to: ${globalFsmStateFromContext}. Current Local FSM State: ${localFsm.localState}`);
    dispatchLocalFsmEvent({ type: 'GLOBAL_FSM_UPDATED', payload: { globalFsmState: globalFsmStateFromContext } });
  }, [globalFsmStateFromContext, logDebug, localFsm.localState, dispatchLocalFsmEvent]);


  useEffect(() => {
    const dummyChatActionState: ChatActionState = {status: 'idle'};
    if (dummyChatActionState.status === 'success' || dummyChatActionState.status === 'error') {
        logDebug('MainTabContent:chatActionState', 'ChatActionResultObserved', `Chat action server call concluded. Status: ${dummyChatActionState.status}. Message: ${dummyChatActionState.message}`);
    }
  }, [ logDebug, globalFsmStateFromContext]);


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
    logDebug('MainTabContent_FSM', 'UserAction', `Automated "Analyze Stock" button clicked for ${localFsm.currentInputTicker}. Current Local FSM State: ${localFsm.localState}`);
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


  const analyzeButtonLoading = localFsm.localState === MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED ||
                             localFsm.localState === MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS ||
                             globalFsmStateFromContext === GlobalFsmState.INITIALIZING_ANALYSIS ||
                             globalFsmStateFromContext === GlobalFsmState.AWAITING_DATA_FETCH_TRIGGER ||
                             globalFsmStateFromContext === GlobalFsmState.FETCHING_DATA ||
                             globalFsmStateFromContext === GlobalFsmState.AWAITING_AI_TA_TRIGGER ||
                             globalFsmStateFromContext === GlobalFsmState.ANALYZING_TA;

  const analyzeButtonDisabled = !([MainTabLocalFsmState.INPUT_VALID, MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED].includes(localFsm.localState)) ||
                                analyzeButtonLoading ||
                                (isGlobalPipelineActive && globalFsmStateFromContext !== GlobalFsmState.IDLE && globalFsmStateFromContext !== GlobalFsmState.FULL_ANALYSIS_COMPLETE);


  const manualActionsPossible = localFsm.localState === MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED &&
                              !!localFsm.activeAnalysisTicker &&
                              localFsm.activeAnalysisTicker === localFsm.currentInputTicker;


  const keyTakeawaysButtonLoading = localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED ||
                                  localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING ||
                                  globalFsmStateFromContext === GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
  const keyTakeawaysButtonDisabled = !manualActionsPossible || keyTakeawaysButtonLoading || analyzeButtonLoading ||
    (isGlobalPipelineActive && globalFsmStateFromContext !== GlobalFsmState.IDLE && globalFsmStateFromContext !== GlobalFsmState.FULL_ANALYSIS_COMPLETE) ||
    !isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'KTButtonCheck', 'Snapshot') ||
    !isDataReadyForProcessing(contextStandardTasJson, logDebug, 'KTButtonCheck', 'StdTA') ||
    !isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'KTButtonCheck', 'AiTA') ||
    !isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'KTButtonCheck', 'MarketStatus');


  const optionsAnalysisButtonLoading = localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED ||
                                     localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING ||
                                     globalFsmStateFromContext === GlobalFsmState.ANALYZING_OPTIONS;
  const optionsAnalysisButtonDisabled = !manualActionsPossible || optionsAnalysisButtonLoading || analyzeButtonLoading ||
    (isGlobalPipelineActive && globalFsmStateFromContext !== GlobalFsmState.IDLE && globalFsmStateFromContext !== GlobalFsmState.FULL_ANALYSIS_COMPLETE) ||
    !isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'OptButtonCheck', 'Snapshot') ||
    !isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'OptButtonCheck', 'OptionsChain');


  const getCombinedDataForExport = useCallback(() => {
    return {
      ticker: localFsm.activeAnalysisTicker || localFsm.currentInputTicker,
      marketStatus: JSON.parse(contextMarketStatusJson || '{}'),
      stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
      standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'),
      aiAnalyzedTechnicalAnalysis: JSON.parse(contextAiAnalyzedTaJson || '{}'),
      aiKeyTakeaways: JSON.parse(contextAiKeyTakeawaysJson || '{}'),
      optionsChain: JSON.parse(contextOptionsChainJson || '{}'),
      aiOptionsAnalysis: JSON.parse(contextAiOptionsAnalysisJson || '{}'),
    };
  }, [contextMarketStatusJson, contextStockSnapshotJson, contextStandardTasJson, contextOptionsChainJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, localFsm.currentInputTicker, localFsm.activeAnalysisTicker]);

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
          Enter ticker for Data Fetch & AI TA. Manual AI actions available after completion.
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
          <CardContent className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button onClick={handleGenerateKeyTakeaways} className="w-full sm:w-auto" disabled={keyTakeawaysButtonDisabled}>
              {keyTakeawaysButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Brain className="mr-2 h-4 w-4" /> Generate AI Key Takeaways
            </Button>
            <Button onClick={handleGenerateOptionsAnalysis} className="w-full sm:w-auto" disabled={optionsAnalysisButtonDisabled}>
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
                <Button onClick={handleExportAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isAllDataReadyForCombinedExport || analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading || isGlobalPipelineActive}>
                    <Download className="mr-2 h-4 w-4" /> Export All to JSON
                </Button>
                <Button onClick={handleCopyAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isAllDataReadyForCombinedExport || analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading || isGlobalPipelineActive}>
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
          <ChatbotFsmProvider
            chatFormAction={chatFormAction as any}
            addChatMessageToGlobalContext={addChatMessageToGlobalContext}
            currentTicker={localFsm.activeAnalysisTicker || localFsm.currentInputTicker}
            stockSnapshotJson={contextStockSnapshotJson || '{}'}
            aiKeyTakeawaysJson={contextAiKeyTakeawaysJson || '{}'}
            aiAnalyzedTaJson={contextAiAnalyzedTaJson || '{}'}
            aiOptionsAnalysisJson={contextAiOptionsAnalysisJson || '{}'}
            currentGlobalChatHistory={contextChatHistory}
            logDebug={logDebug}
            setChatbotFsmDisplayState={(displayTuple: FsmDisplayTuple) => setMainTabFsmDisplay(displayTuple)} 
          >
            <Chatbot
              isChatPending={isChatPending}
              currentTickerForDisplay={localFsm.activeAnalysisTicker || localFsm.currentInputTicker}
            />
          </ChatbotFsmProvider>
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}

    