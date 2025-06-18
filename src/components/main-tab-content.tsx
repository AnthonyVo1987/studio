
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

import { useStockAnalysis, type ChatMessage, FsmState as GlobalFsmState, type FsmDisplayTuple, type LogSourceId } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap, Brain, BarChartBig } from "lucide-react";
import type { StockSnapshotData } from '@/services/data-sources/types';
import { useActionState } from 'react';
import { chatServerAction, type ChatActionState, type ChatActionInputs } from '@/actions/chat-server-action';


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
    const logPrefixFSM = 'MainTabContent_FSM:Reducer';
    logDebug(logPrefixFSM as LogSourceId, 'Event_ENTRY', `Event: ${event.type}, CurrLocal: ${state.localState}, PrevLocal: ${previousLocalState}, CurrInput: ${state.currentInputTicker}, ActiveAnalysis: ${state.activeAnalysisTicker}`);
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
        } else if (event.type === 'AUTOMATED_ANALYSIS_SUBMITTED') {
          newActiveAnalysisTicker = state.currentInputTicker;
          logDebug(logPrefixFSM as LogSourceId, 'Action_AUTOSUBMIT', `Setting activeAnalysisTicker to: ${newActiveAnalysisTicker}.`);
          nextLocalState = MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED;
        }
        break;

      case MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED:
        if (event.type === 'GLOBAL_FSM_UPDATED' && [GlobalFsmState.INITIALIZING_ANALYSIS, GlobalFsmState.AWAITING_DATA_FETCH_TRIGGER, GlobalFsmState.FETCHING_DATA, GlobalFsmState.ANALYZING_TA].includes(event.payload.globalFsmState)) {
          nextLocalState = MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS;
        }
        break;

      case MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if (event.payload.globalFsmState === GlobalFsmState.FULL_ANALYSIS_COMPLETE) {
            logDebug(logPrefixFSM as LogSourceId, 'ReducerToManualEnabled_PreCheck', `Global FSM is FULL_ANALYSIS_COMPLETE. Current local state: ${state.localState}, ActiveAnalysisTicker (before logic): ${state.activeAnalysisTicker}, CurrentInputTicker: ${state.currentInputTicker}`);
            newActiveAnalysisTicker = state.currentInputTicker; 
            logDebug(logPrefixFSM as LogSourceId, 'ReducerToManualEnabled_FinalCheck', `Transitioning TO MANUAL_ACTIONS_ENABLED. ActiveAnalysisTicker in state after update: ${newActiveAnalysisTicker}`);
            nextLocalState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
          } else if ([GlobalFsmState.IDLE, GlobalFsmState.STALE_DATA_FROM_ACTION_ERROR, GlobalFsmState.DATA_FETCH_FAILED, GlobalFsmState.AI_TA_FAILED].includes(event.payload.globalFsmState)) {
            logDebug(logPrefixFSM as LogSourceId, 'AutoFail_Reset', `GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Resetting. CurrentInput: ${state.currentInputTicker}, ActiveAnalysisTicker (PRESERVED): ${state.activeAnalysisTicker}`);
            nextLocalState = state.currentInputTicker.trim() ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
            newActiveAnalysisTicker = state.activeAnalysisTicker;
          }
        }
        break;

      case MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED:
        if (event.type === 'TICKER_INPUT_CHANGED') {
          logDebug(logPrefixFSM as LogSourceId, 'ManualEnabled_TickerChange', `New Ticker: ${event.payload.tickerValue}, Valid: ${event.payload.isValid}, Active: ${state.activeAnalysisTicker}`);
          if (!event.payload.isValid || event.payload.tickerValue !== state.activeAnalysisTicker) {
            newActiveAnalysisTicker = null; 
            nextLocalState = event.payload.isValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE;
            logDebug(logPrefixFSM as LogSourceId, 'ManualEnabled_TickerChange_Transition', `Invalidated activeAnalysisTicker. New state: ${nextLocalState}`);
          }
        } else if (event.type === 'AUTOMATED_ANALYSIS_SUBMITTED') {
          newActiveAnalysisTicker = state.currentInputTicker;
          nextLocalState = MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED;
        } else if (event.type === 'MANUAL_KEY_TAKEAWAYS_SUBMITTED') {
          logDebug(logPrefixFSM as LogSourceId, 'Reducer_Event_Received_ManualKT', 'MANUAL_KEY_TAKEAWAYS_SUBMITTED event received. Transitioning to MANUAL_KEY_TAKEAWAYS_REQUESTED.');
          nextLocalState = MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED;
        } else if (event.type === 'MANUAL_OPTIONS_ANALYSIS_SUBMITTED') {
          logDebug(logPrefixFSM as LogSourceId, 'Reducer_Event_Received_ManualOpt', 'MANUAL_OPTIONS_ANALYSIS_SUBMITTED event received. Transitioning to MANUAL_OPTIONS_ANALYSIS_REQUESTED.');
          nextLocalState = MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED;
        } else if (event.type === 'GLOBAL_FSM_UPDATED' && event.payload.globalFsmState === GlobalFsmState.IDLE) {
          logDebug(logPrefixFSM as LogSourceId, 'ManualEnabled_GlobalIdle', `Global FSM is IDLE. Local state remains MANUAL_ACTIONS_ENABLED. ActiveAnalysisTicker PRESERVED: ${state.activeAnalysisTicker}.`);
        }
        break;
      
      case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED:
      case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING:
      case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED:
      case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING:
         if (event.type === 'GLOBAL_FSM_UPDATED') {
          if (event.payload.globalFsmState === GlobalFsmState.GENERATING_KEY_TAKEAWAYS && state.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED) {
            nextLocalState = MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING;
          } else if (event.payload.globalFsmState === GlobalFsmState.ANALYZING_OPTIONS && state.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED) {
            nextLocalState = MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING;
          } else if ([GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED, GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE, GlobalFsmState.IDLE].includes(event.payload.globalFsmState)) {
            logDebug(logPrefixFSM as LogSourceId, 'ManualFlowEnd', `Manual AI flow concluded (${event.payload.globalFsmState}). Returning to MANUAL_ACTIONS_ENABLED. ActiveTicker: ${state.activeAnalysisTicker}`);
            nextLocalState = MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED;
            newActiveAnalysisTicker = state.activeAnalysisTicker; 
          }
        }
        break;
      default:
        break;
    }
    const finalState = { ...state, previousLocalState, localState: nextLocalState, currentInputTicker: event.type === 'TICKER_INPUT_CHANGED' ? event.payload.tickerValue : state.currentInputTicker, activeAnalysisTicker: newActiveAnalysisTicker };
    if (finalState.localState === MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED) {
        logDebug(logPrefixFSM as LogSourceId, 'ReducerToManualEnabled_FinalCheck', `Transitioning TO MANUAL_ACTIONS_ENABLED. ActiveAnalysisTicker in state after update: ${finalState.activeAnalysisTicker}`);
    }
    return finalState;
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
        logDebug('MainTabContent_FSM' as LogSourceId, 'DispatchWithTarget', `Event ${event.type} from ${currentLocalState} targeting ${targetState}.`);
        setTargetLocalFsmDisplayState(targetState);
        setMainTabFsmTargetState(targetState);
    }
    dispatchLocalFsmEventActual(event);
  }, [localFsm.localState, localFsm.currentInputTicker, localFsm.activeAnalysisTicker, logDebug, setMainTabFsmTargetState]);

  useEffect(() => {
    if (targetLocalFsmDisplayState !== null && localFsm.localState === targetLocalFsmDisplayState) {
        logDebug('MainTabContent_FSM' as LogSourceId, 'TargetClearEffect', `Local FSM state changed to ${localFsm.localState}. Clearing target display state.`);
        setTargetLocalFsmDisplayState(null);
        setMainTabFsmTargetState(null);
    }
  }, [localFsm.localState, targetLocalFsmDisplayState, logDebug, setMainTabFsmTargetState]);

  useEffect(() => {
    setMainTabFsmPreviousState(localFsm.previousLocalState);
    setMainTabFsmCurrentState(localFsm.localState);
  }, [localFsm.localState, localFsm.previousLocalState, setMainTabFsmPreviousState, setMainTabFsmCurrentState]);


  useEffect(() => {
    logDebug('MainTabContent_FSM' as LogSourceId, 'InitialMountEffect', `Component mounted. Initial tickerInput: "${tickerInput}". Dispatching TICKER_INPUT_CHANGED.`);
    dispatchLocalFsmEvent({
      type: 'TICKER_INPUT_CHANGED',
      payload: { isValid: !!tickerInput.trim(), tickerValue: tickerInput }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(
    chatServerAction,
    initialLocalChatActionState 
  );


  useEffect(() => {
    logDebug('MainTabContent_FSM' as LogSourceId, 'LocalFsmSideEffect_TriggerCheck', `LocalState: ${localFsm.localState}, PrevLocal: ${localFsm.previousLocalState}, ActiveAnalysisTicker: ${localFsm.activeAnalysisTicker}, CurrentInputTicker: ${localFsm.currentInputTicker}`);
    if (localFsm.localState === MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED && localFsm.activeAnalysisTicker) {
      logDebug('MainTabContent_FSM' as LogSourceId, 'DispatchToGlobal_Automated', `Dispatching START_FULL_ANALYSIS to global FSM for ${localFsm.activeAnalysisTicker}.`);
      dispatchGlobalFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: localFsm.activeAnalysisTicker } });
    } else if (localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED && localFsm.activeAnalysisTicker) {
      logDebug('MainTabContent_FSM' as LogSourceId, 'DispatchToGlobal_ManualKT', `Dispatching TRIGGER_MANUAL_KEY_TAKEAWAYS to global FSM for ${localFsm.activeAnalysisTicker}.`);
      dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS', payload: { ticker: localFsm.activeAnalysisTicker }});
    } else if (localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED && localFsm.activeAnalysisTicker) {
      logDebug('MainTabContent_FSM' as LogSourceId, 'DispatchToGlobal_ManualOptions', `Dispatching TRIGGER_MANUAL_OPTIONS_ANALYSIS to global FSM for ${localFsm.activeAnalysisTicker}.`);
      dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS', payload: { ticker: localFsm.activeAnalysisTicker }});
    }
  }, [localFsm.localState, localFsm.activeAnalysisTicker, localFsm.previousLocalState, dispatchGlobalFsmEvent, logDebug]);


  useEffect(() => {
    const logPrefix = 'MainTabContent_FSM:GlobalFsmListener';
    logDebug(logPrefix as LogSourceId, 'ENTRY', `Global FSM state changed to: ${globalFsmStateFromContext}. Current Local FSM State: ${localFsm.localState}. Active Ticker: ${localFsm.activeAnalysisTicker}`);
    if (globalFsmStateFromContext === GlobalFsmState.FULL_ANALYSIS_COMPLETE) {
      logDebug(logPrefix as LogSourceId, 'FullComplete', `Global FSM is FULL_ANALYSIS_COMPLETE. Current local activeAnalysisTicker (before local dispatch): ${localFsm.activeAnalysisTicker}. Local FSM should now transition to MANUAL_ACTIONS_ENABLED.`);
    }
    dispatchLocalFsmEvent({ type: 'GLOBAL_FSM_UPDATED', payload: { globalFsmState: globalFsmStateFromContext } });
  }, [globalFsmStateFromContext, logDebug, localFsm.localState, localFsm.activeAnalysisTicker, dispatchLocalFsmEvent]);


  useEffect(() => {
    if (chatActionState.status === 'success' && chatActionState.data) {
        logDebug('MainTabContent:chatActionState' as LogSourceId, 'ChatActionResultObserved:SUCCESS', `Chat action server call succeeded. Message: ${chatActionState.message}`);
        setChatbotRequestJson(chatActionState.data.chatbotRequestJson);
        setChatbotResponseJson(chatActionState.data.chatbotResponseJson);
        try {
            const modelResponse = JSON.parse(chatActionState.data.chatbotResponseJson);
            if (modelResponse.error) { // Check for error field within successful action
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
    dispatchLocalFsmEvent({ type: 'AUTOMATED_ANALYSIS_SUBMITTED' });
  };

  const handleGenerateKeyTakeaways = () => {
    logDebug('MainTabContent' as LogSourceId, 'ONCLICK_KT_D.E_HANDLER_ENTERED', 'Active Ticker:', localFsm.activeAnalysisTicker);
    dispatchLocalFsmEvent({ type: 'MANUAL_KEY_TAKEAWAYS_SUBMITTED' });
  };

  const handleGenerateOptionsAnalysis = () => {
    logDebug('MainTabContent' as LogSourceId, 'ONCLICK_OPTIONS_D.E_HANDLER_ENTERED', 'Active Ticker:', localFsm.activeAnalysisTicker);
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

  const isOverallAnalysisPending = isGlobalPipelineActive || isChatPending;


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

  const [isKtButtonDisabled, setIsKtButtonDisabled] = useState(true);
  const [isOptButtonDisabled, setIsOptButtonDisabled] = useState(true);

  const keyTakeawaysButtonLoading = localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED ||
                                  localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING ||
                                  globalFsmStateFromContext === GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
  
  const optionsAnalysisButtonLoading = localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED ||
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
    
    logDebug(logPrefixDC as LogSourceId, 'VARIABLES_CHECK_DC', {
        currentLocalFsmState,
        currentActiveAnalysisTicker,
        currentInputTickerValue,
        currentGlobalFsmState,
        currentAnalyzeButtonLoading,
        currentKtButtonLoading,
        currentOptButtonLoading,
        currentIsGlobalPipelineActive
    });
    
    const manualActionsPossible = currentLocalFsmState === MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED &&
                                  !!currentActiveAnalysisTicker &&
                                  currentActiveAnalysisTicker === currentInputTickerValue;

    logDebug(logPrefixDC as LogSourceId, 'MANUAL_ACTIONS_POSSIBLE_EVALUATION_DC', {
        manualActionsPossible,
        localFsmState: currentLocalFsmState,
        activeAnalysisTicker: currentActiveAnalysisTicker,
        currentInputTicker: currentInputTickerValue,
        isTickerMatch: currentActiveAnalysisTicker === currentInputTickerValue,
    });

    const ktSnapshotReady = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, logPrefixDC as LogSourceId, 'KT_Snapshot_DC');
    const ktStdTaReady = isDataReadyForProcessing(contextStandardTasJson, logDebug, logPrefixDC as LogSourceId, 'KT_StdTA_DC');
    const ktAiTaReady = isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, logPrefixDC as LogSourceId, 'KT_AiTA_DC');
    const ktMarketStatusReady = isDataReadyForProcessing(contextMarketStatusJson, logDebug, logPrefixDC as LogSourceId, 'KT_MarketStatus_DC');
    const ktPrereqsMet = ktSnapshotReady && ktStdTaReady && ktAiTaReady && ktMarketStatusReady;
    
    logDebug(logPrefixDC as LogSourceId, 'KEY_TAKEAWAYS_PREREQS_EVALUATION_DC', { ktSnapshotReady, ktStdTaReady, ktAiTaReady, ktMarketStatusReady, overallPrereqsMet: ktPrereqsMet });
    
    const optSnapshotReady = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, logPrefixDC as LogSourceId, 'Opt_Snapshot_DC');
    const optChainReady = isDataReadyForProcessing(contextOptionsChainJson, logDebug, logPrefixDC as LogSourceId, 'Opt_Chain_DC');
    const optPrereqsMet = optSnapshotReady && optChainReady;

    logDebug(logPrefixDC as LogSourceId, 'OPTIONS_ANALYSIS_PREREQS_EVALUATION_DC', { optSnapshotReady, optChainReady, overallPrereqsMet: optPrereqsMet });
    
    const shouldKtButtonBeEnabled = manualActionsPossible && !currentKtButtonLoading && !currentAnalyzeButtonLoading &&
                                 !(currentIsGlobalPipelineActive && currentGlobalFsmState !== GlobalFsmState.IDLE && currentGlobalFsmState !== GlobalFsmState.FULL_ANALYSIS_COMPLETE) &&
                                 ktPrereqsMet;
    
    const shouldOptButtonBeEnabled = manualActionsPossible && !currentOptButtonLoading && !currentAnalyzeButtonLoading &&
                                  !(currentIsGlobalPipelineActive && currentGlobalFsmState !== GlobalFsmState.IDLE && currentGlobalFsmState !== GlobalFsmState.FULL_ANALYSIS_COMPLETE) &&
                                  optPrereqsMet;
    
    logDebug(logPrefixDC as LogSourceId, 'CALCULATED_SHOULD_BE_ENABLED_STATES_DC', { shouldKtButtonBeEnabled, shouldOptButtonBeEnabled });
    logDebug(logPrefixDC as LogSourceId, 'SETTING_BUTTON_DISABLED_STATES_DC', `Setting KT Button Disabled: ${!shouldKtButtonBeEnabled}, Setting OPT Button Disabled: ${!shouldOptButtonBeEnabled}`);
    
    setIsKtButtonDisabled(!shouldKtButtonBeEnabled);
    setIsOptButtonDisabled(!shouldOptButtonBeEnabled);

    logDebug(logPrefixDC as LogSourceId, 'FINAL_DISABLED_STATE_BOOLEANS_DC', { 
        final_isKtButtonDisabled: !shouldKtButtonBeEnabled, 
        final_isOptButtonDisabled: !shouldOptButtonBeEnabled 
    });

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
