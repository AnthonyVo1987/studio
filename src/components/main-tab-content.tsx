
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
import { OptionsChainTable } from "@/components/options-chain-table";
import { Chatbot } from "@/components/chatbot";
import { ChatbotFsmProvider } from "@/contexts/chatbot-fsm-context";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";

import { useStockAnalysis, type ChatMessage, FsmState as GlobalFsmState } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap, Brain, BarChartBig } from "lucide-react";
import type { StockSnapshotData } from '@/services/data-sources/types';
import { useActionState } from 'react';
import type { AnalyzeStockServerActionState, StockDataFetchResult } from '@/actions/analyze-stock-server-action';
import type { ChatActionState, ChatActionInputs } from '@/actions/chat-server-action';


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
  | { type: 'TICKER_INPUT_CHANGED'; payload: { isValid: boolean; tickerValue: string } }
  | { type: 'AUTOMATED_ANALYSIS_SUBMITTED' }
  | { type: 'MANUAL_KEY_TAKEAWAYS_SUBMITTED' }
  | { type: 'MANUAL_OPTIONS_ANALYSIS_SUBMITTED' }
  | { type: 'GLOBAL_FSM_UPDATED'; payload: { globalFsmState: GlobalFsmState } }
  | { type: 'RESET_REQUESTED' };

interface MainTabLocalFsmManagedState {
  localState: MainTabLocalFsmState;
  activeAnalysisTicker: string | null; // Ticker for which data is loaded and manual actions can run
  currentInputTicker: string; // Tracks the ticker currently in the input field
}

const initialMainTabLocalFsmState: MainTabLocalFsmManagedState = {
  localState: MainTabLocalFsmState.IDLE,
  activeAnalysisTicker: null,
  currentInputTicker: "NVDA", 
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
    fsmState: globalFsmStateFromContext,
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
    logDebug('MainTabContent_FSM', 'LocalReducerEvent', `Event: ${event.type}, CurrentLocalState: ${state.localState}, CurrentInputTicker: ${state.currentInputTicker}, ActiveAnalysisTicker: ${state.activeAnalysisTicker}`);
    switch (state.localState) {
      case MainTabLocalFsmState.IDLE:
        if (event.type === 'TICKER_INPUT_CHANGED') {
          const newState = { ...state, currentInputTicker: event.payload.tickerValue };
          if (event.payload.isValid) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `IDLE -> TICKER_INPUT_CHANGED (Valid: ${event.payload.tickerValue}). Transitioning to INPUT_VALID.`);
            return { ...newState, localState: MainTabLocalFsmState.INPUT_VALID };
          }
          logDebug('MainTabContent_FSM', 'LocalReducerAction', `IDLE -> TICKER_INPUT_CHANGED (Invalid: ${event.payload.tickerValue}). Remaining IDLE.`);
          return newState; 
        }
        return state;

      case MainTabLocalFsmState.INPUT_VALID:
        if (event.type === 'TICKER_INPUT_CHANGED') {
          const newState = { ...state, currentInputTicker: event.payload.tickerValue };
          if (!event.payload.isValid) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `INPUT_VALID -> TICKER_INPUT_CHANGED (Invalid: ${event.payload.tickerValue}). Transitioning to IDLE.`);
            return { ...newState, localState: MainTabLocalFsmState.IDLE };
          }
          logDebug('MainTabContent_FSM', 'LocalReducerAction', `INPUT_VALID -> TICKER_INPUT_CHANGED (Valid: ${event.payload.tickerValue}). Remaining INPUT_VALID.`);
          return newState; 
        }
        if (event.type === 'AUTOMATED_ANALYSIS_SUBMITTED') {
          logDebug('MainTabContent_FSM', 'LocalReducerAction', `INPUT_VALID -> AUTOMATED_ANALYSIS_SUBMITTED. Setting activeAnalysisTicker to: ${state.currentInputTicker}. Transitioning to AUTOMATED_PIPELINE_REQUESTED.`);
          return { ...state, localState: MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED, activeAnalysisTicker: state.currentInputTicker };
        }
        return state;

      case MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if ([GlobalFsmState.INITIALIZING_ANALYSIS, GlobalFsmState.AWAITING_DATA_FETCH_TRIGGER, GlobalFsmState.FETCHING_DATA, GlobalFsmState.ANALYZING_TA].includes(event.payload.globalFsmState)) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `AUTOMATED_PIPELINE_REQUESTED -> GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Transitioning to AUTOMATED_PIPELINE_IN_PROGRESS.`);
            return { ...state, localState: MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS };
          }
        }
        return state;

      case MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if (event.payload.globalFsmState === GlobalFsmState.FULL_ANALYSIS_COMPLETE) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `AUTOMATED_PIPELINE_IN_PROGRESS -> GLOBAL_FSM_UPDATED (FULL_ANALYSIS_COMPLETE). Transitioning to MANUAL_ACTIONS_ENABLED.`);
            return { ...state, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED };
          }
          if ([GlobalFsmState.IDLE, GlobalFsmState.STALE_DATA_FROM_ACTION_ERROR, GlobalFsmState.DATA_FETCH_FAILED].includes(event.payload.globalFsmState)) {
            const isInputStillValid = !!state.currentInputTicker.trim();
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `AUTOMATED_PIPELINE_IN_PROGRESS -> GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Resetting. Input still valid: ${isInputStillValid}.`);
            return {
              ...initialMainTabLocalFsmState, 
              currentInputTicker: state.currentInputTicker, 
              localState: isInputStillValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE, 
              activeAnalysisTicker: null, 
            };
          }
        }
        if (event.type === 'RESET_REQUESTED') {
             logDebug('MainTabContent_FSM', 'LocalReducerAction', `AUTOMATED_PIPELINE_IN_PROGRESS -> RESET_REQUESTED. Resetting to initial state, preserving currentInputTicker.`);
             return { ...initialMainTabLocalFsmState, currentInputTicker: state.currentInputTicker, activeAnalysisTicker: null };
        }
        return state;

      case MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED:
        if (event.type === 'AUTOMATED_ANALYSIS_SUBMITTED') { 
          logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_ACTIONS_ENABLED -> AUTOMATED_ANALYSIS_SUBMITTED. Setting activeAnalysisTicker to: ${state.currentInputTicker}. Transitioning to AUTOMATED_PIPELINE_REQUESTED.`);
          return { ...state, localState: MainTabLocalFsmState.AUTOMATED_PIPELINE_REQUESTED, activeAnalysisTicker: state.currentInputTicker };
        }
        if (event.type === 'MANUAL_KEY_TAKEAWAYS_SUBMITTED') {
          logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_ACTIONS_ENABLED -> MANUAL_KEY_TAKEAWAYS_SUBMITTED. Transitioning to MANUAL_KEY_TAKEAWAYS_REQUESTED.`);
          return { ...state, localState: MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED };
        }
        if (event.type === 'MANUAL_OPTIONS_ANALYSIS_SUBMITTED') {
          logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_ACTIONS_ENABLED -> MANUAL_OPTIONS_ANALYSIS_SUBMITTED. Transitioning to MANUAL_OPTIONS_ANALYSIS_REQUESTED.`);
          return { ...state, localState: MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED };
        }
        if (event.type === 'GLOBAL_FSM_UPDATED' && event.payload.globalFsmState === GlobalFsmState.IDLE) {
            const isInputStillValid = !!state.currentInputTicker.trim();
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_ACTIONS_ENABLED -> GLOBAL_FSM_UPDATED (IDLE). Resetting. Input still valid: ${isInputStillValid}. ActiveAnalysisTicker will be ${state.activeAnalysisTicker}.`);
            return {
              ...initialMainTabLocalFsmState,
              currentInputTicker: state.currentInputTicker,
              localState: isInputStillValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE,
              activeAnalysisTicker: state.activeAnalysisTicker, // Preserve activeAnalysisTicker if global FSM went idle after manual action
            };
        }
        if (event.type === 'RESET_REQUESTED') {
             logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_ACTIONS_ENABLED -> RESET_REQUESTED. Resetting to initial state, preserving currentInputTicker.`);
             return { ...initialMainTabLocalFsmState, currentInputTicker: state.currentInputTicker, activeAnalysisTicker: null };
        }
        if (event.type === 'TICKER_INPUT_CHANGED') {
            const newState = { ...state, currentInputTicker: event.payload.tickerValue };
            if (event.payload.isValid) {
                if (event.payload.tickerValue !== state.activeAnalysisTicker) {
                    logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_ACTIONS_ENABLED -> TICKER_INPUT_CHANGED (Valid, but new: ${event.payload.tickerValue}). Resetting manual capability, activeAnalysisTicker. Transitioning to INPUT_VALID.`);
                    return { ...newState, localState: MainTabLocalFsmState.INPUT_VALID, activeAnalysisTicker: null };
                }
                logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_ACTIONS_ENABLED -> TICKER_INPUT_CHANGED (Valid, same: ${event.payload.tickerValue}). Remaining MANUAL_ACTIONS_ENABLED.`);
                return newState; 
            } else { 
                logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_ACTIONS_ENABLED -> TICKER_INPUT_CHANGED (Invalid: ${event.payload.tickerValue}). Resetting activeAnalysisTicker. Transitioning to IDLE.`);
                return { ...newState, localState: MainTabLocalFsmState.IDLE, activeAnalysisTicker: null };
            }
        }
        return state;

      case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED:
        if (event.type === 'GLOBAL_FSM_UPDATED' && event.payload.globalFsmState === GlobalFsmState.GENERATING_KEY_TAKEAWAYS) {
          logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_KEY_TAKEAWAYS_REQUESTED -> GLOBAL_FSM_UPDATED (GENERATING_KEY_TAKEAWAYS). Transitioning to MANUAL_KEY_TAKEAWAYS_PENDING.`);
          return { ...state, localState: MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING };
        }
        if (event.type === 'GLOBAL_FSM_UPDATED' && (event.payload.globalFsmState === GlobalFsmState.FULL_ANALYSIS_COMPLETE || event.payload.globalFsmState === GlobalFsmState.IDLE)) {
          logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_KEY_TAKEAWAYS_REQUESTED -> GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Transitioning to MANUAL_ACTIONS_ENABLED.`);
          return { ...state, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED };
        }
        return state;

      case MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if ([GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE].includes(event.payload.globalFsmState)) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_KEY_TAKEAWAYS_PENDING -> GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Transitioning to MANUAL_ACTIONS_ENABLED.`);
            return { ...state, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED };
          }
           if (event.payload.globalFsmState === GlobalFsmState.IDLE) {
            const isInputStillValid = !!state.currentInputTicker.trim();
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_KEY_TAKEAWAYS_PENDING -> GLOBAL_FSM_UPDATED (IDLE). Resetting. Input still valid: ${isInputStillValid}.`);
            return { ...initialMainTabLocalFsmState, currentInputTicker: state.currentInputTicker, localState: isInputStillValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE, activeAnalysisTicker: null };
          }
        }
        return state;

      case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED:
        if (event.type === 'GLOBAL_FSM_UPDATED' && event.payload.globalFsmState === GlobalFsmState.ANALYZING_OPTIONS) {
          logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_OPTIONS_ANALYSIS_REQUESTED -> GLOBAL_FSM_UPDATED (ANALYZING_OPTIONS). Transitioning to MANUAL_OPTIONS_ANALYSIS_PENDING.`);
          return { ...state, localState: MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING };
        }
        if (event.type === 'GLOBAL_FSM_UPDATED' && (event.payload.globalFsmState === GlobalFsmState.FULL_ANALYSIS_COMPLETE || event.payload.globalFsmState === GlobalFsmState.IDLE)) {
          logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_OPTIONS_ANALYSIS_REQUESTED -> GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Transitioning to MANUAL_ACTIONS_ENABLED.`);
          return { ...state, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED };
        }
        return state;

      case MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING:
        if (event.type === 'GLOBAL_FSM_UPDATED') {
          if ([GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED, GlobalFsmState.FULL_ANALYSIS_COMPLETE].includes(event.payload.globalFsmState)) {
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_OPTIONS_ANALYSIS_PENDING -> GLOBAL_FSM_UPDATED (${event.payload.globalFsmState}). Transitioning to MANUAL_ACTIONS_ENABLED.`);
            return { ...state, localState: MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED };
          }
          if (event.payload.globalFsmState === GlobalFsmState.IDLE) {
            const isInputStillValid = !!state.currentInputTicker.trim();
            logDebug('MainTabContent_FSM', 'LocalReducerAction', `MANUAL_OPTIONS_ANALYSIS_PENDING -> GLOBAL_FSM_UPDATED (IDLE). Resetting. Input still valid: ${isInputStillValid}.`);
            return { ...initialMainTabLocalFsmState, currentInputTicker: state.currentInputTicker, localState: isInputStillValid ? MainTabLocalFsmState.INPUT_VALID : MainTabLocalFsmState.IDLE, activeAnalysisTicker: null };
          }
        }
        return state;
      default:
        return state;
    }
  };

  const [localFsm, dispatchLocalFsmEvent] = useReducer(mainTabLocalFsmReducer, {
    ...initialMainTabLocalFsmState,
    currentInputTicker: tickerInput, 
  });

  useEffect(() => {
    logDebug('MainTabContent_FSM', 'InitialMountEffect', `Component mounted. Initial tickerInput: "${tickerInput}". Dispatching TICKER_INPUT_CHANGED.`);
    dispatchLocalFsmEvent({
      type: 'TICKER_INPUT_CHANGED',
      payload: { isValid: !!tickerInput.trim(), tickerValue: tickerInput }
    });
  }, [dispatchLocalFsmEvent, logDebug]); 

  const [, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(() => ({status: 'idle'}), initialChatActionState);


  useEffect(() => {
    logDebug('MainTabContent_FSM', 'LocalFsmSideEffect', `LocalState: ${localFsm.localState}, ActiveAnalysisTicker: ${localFsm.activeAnalysisTicker}, CurrentInputTicker: ${localFsm.currentInputTicker}`);
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


  useEffect(() => {
    logDebug('MainTabContent_FSM', 'GlobalFsmListener', `Global FSM state changed to: ${globalFsmStateFromContext}. Current Local FSM State: ${localFsm.localState}`);
    dispatchLocalFsmEvent({ type: 'GLOBAL_FSM_UPDATED', payload: { globalFsmState: globalFsmStateFromContext } });

    // This handles the case where global FSM goes to IDLE *after* a full analysis cycle,
    // potentially making the "Analyze Stock" button ready again if input is valid.
    // This logic is now more deeply embedded in the reducer for specific state transitions.
    if (globalFsmStateFromContext === GlobalFsmState.IDLE &&
        (
            localFsm.localState === MainTabLocalFsmState.AUTOMATED_PIPELINE_IN_PROGRESS ||
            localFsm.localState === MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED ||
            localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING ||
            localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING
        )
    ) {
        logDebug('MainTabContent_FSM', 'GlobalFsmListener', `Global FSM is IDLE and local FSM was in an active/post-active state (${localFsm.localState}). Dispatching GLOBAL_FSM_UPDATED to local FSM to potentially transition to INPUT_VALID.`);
        // The reducer handles transitioning to INPUT_VALID if currentInputTicker is still valid.
    }

  }, [globalFsmStateFromContext, logDebug, localFsm.localState]);


  useEffect(() => {
    const dummyChatActionState: ChatActionState = {status: 'idle'}; 
    if (![GlobalFsmState.IDLE, GlobalFsmState.FULL_ANALYSIS_COMPLETE].includes(globalFsmStateFromContext)) {
        if (dummyChatActionState.status === 'success' || dummyChatActionState.status === 'error') {
            logDebug('MainTabContent:chatActionState', 'SkipHandleChatResult', `Skipping chat result processing. Global FSM State: ${globalFsmStateFromContext} is not IDLE or FULL_ANALYSIS_COMPLETE. Chat Action Status: ${dummyChatActionState.status}`);
        }
        return;
    }
    if (dummyChatActionState.status !== 'success' && dummyChatActionState.status !== 'error') return;

    logDebug('MainTabContent:chatActionState', 'HandleChatActionResult', `Processing chat action result. Global FSM State: ${globalFsmStateFromContext}, Chat Action Status: ${dummyChatActionState.status}`);
    let messageToAdd: ChatMessage | null = null;
    if (dummyChatActionState.status === 'success' && dummyChatActionState.data?.chatbotResponseJson) {
        try {
            const responseObj = JSON.parse(dummyChatActionState.data.chatbotResponseJson);
            messageToAdd = { id: `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, role: 'model', content: responseObj.response || "No response text." };
        } catch (e) {
            messageToAdd = { id: `model_error_${Date.now()}`, role: 'model', content: "Sorry, I had trouble formatting my response." };
        }
    } else if (dummyChatActionState.status === 'error') {
        messageToAdd = { id: `model_error_${Date.now()}`, role: 'model', content: dummyChatActionState.message || "Sorry, an error occurred with the chat." };
    }
    if (messageToAdd) {
        const lastMessage = contextChatHistoryRef.current[contextChatHistoryRef.current.length - 1];
        if (lastMessage && lastMessage.role === messageToAdd.role && lastMessage.content === messageToAdd.content) {
            logDebug('MainTabContent:chatActionState', 'DuplicateChatMessageSkipped', 'Skipping add of duplicate chat message.', messageToAdd);
        } else {
            dispatchGlobalFsmEvent({ type: 'ADD_CHAT_MESSAGE', payload: messageToAdd });
        }
    }
  }, [dispatchGlobalFsmEvent, logDebug, globalFsmStateFromContext]);


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
                             globalFsmStateFromContext === GlobalFsmState.FETCHING_DATA || 
                             globalFsmStateFromContext === GlobalFsmState.ANALYZING_TA ||
                             globalFsmStateFromContext === GlobalFsmState.INITIALIZING_ANALYSIS ||
                             globalFsmStateFromContext === GlobalFsmState.AWAITING_DATA_FETCH_TRIGGER ||
                             globalFsmStateFromContext === GlobalFsmState.AWAITING_AI_TA_TRIGGER;

  const analyzeButtonDisabled = localFsm.localState !== MainTabLocalFsmState.INPUT_VALID || analyzeButtonLoading || isGlobalPipelineActive;


  const manualActionsPossible = localFsm.localState === MainTabLocalFsmState.MANUAL_ACTIONS_ENABLED &&
                              !!localFsm.activeAnalysisTicker &&
                              localFsm.activeAnalysisTicker === localFsm.currentInputTicker; 


  const keyTakeawaysButtonLoading = localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_REQUESTED ||
                                  localFsm.localState === MainTabLocalFsmState.MANUAL_KEY_TAKEAWAYS_PENDING ||
                                  globalFsmStateFromContext === GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
  const keyTakeawaysButtonDisabled = !manualActionsPossible || keyTakeawaysButtonLoading || analyzeButtonLoading || isGlobalPipelineActive ||
    !isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'KTButtonCheck', 'Snapshot') ||
    !isDataReadyForProcessing(contextStandardTasJson, logDebug, 'KTButtonCheck', 'StdTA') ||
    !isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'KTButtonCheck', 'AiTA') ||
    !isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'KTButtonCheck', 'MarketStatus');


  const optionsAnalysisButtonLoading = localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_REQUESTED ||
                                     localFsm.localState === MainTabLocalFsmState.MANUAL_OPTIONS_ANALYSIS_PENDING ||
                                     globalFsmStateFromContext === GlobalFsmState.ANALYZING_OPTIONS;
  const optionsAnalysisButtonDisabled = !manualActionsPossible || optionsAnalysisButtonLoading || analyzeButtonLoading || isGlobalPipelineActive ||
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
              Generate specific AI insights for {localFsm.activeAnalysisTicker || "the analyzed stock"}. Available after initial "Analyze Stock" (Data & AI TA) is complete.
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
