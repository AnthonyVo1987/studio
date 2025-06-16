
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import type { ChatMessage, FsmDisplayTuple } from './stock-analysis-context'; // Added FsmDisplayTuple
import type { ChatActionInputs } from '@/actions/chat-server-action';
import { startTransition } from 'react';

// FSM States for Chatbot UI
export enum ChatbotFsmInternalState {
  IDLE = 'IDLE', 
  PROCESSING_USER_INPUT = 'PROCESSING_USER_INPUT', 
  SUBMITTING_MESSAGE = 'SUBMITTING_MESSAGE', 
}

// FSM Events for Chatbot UI
export type ChatbotFsmEvent =
  | { type: 'USER_INPUT_CHANGED'; payload: string }
  | { type: 'SUBMIT_MESSAGE_REQUESTED' }
  | { type: 'SUBMISSION_CONCLUDED' }; 

interface ChatbotFsmManagedState {
  fsmState: ChatbotFsmInternalState;
  previousFsmState: ChatbotFsmInternalState | null;
  userInput: string;
}

interface ChatbotFsmContextType extends Omit<ChatbotFsmManagedState, 'previousFsmState'> {
  previousChatbotFsmState: ChatbotFsmInternalState | null; 
  targetChatbotFsmDisplayState: ChatbotFsmInternalState | null;
  dispatchChatbotFsmEvent: (event: ChatbotFsmEvent) => void;
}

const initialChatbotFsmState: ChatbotFsmManagedState = {
  fsmState: ChatbotFsmInternalState.IDLE,
  previousFsmState: null,
  userInput: '',
};

const ChatbotFsmContext = createContext<ChatbotFsmContextType | undefined>(undefined);

interface ChatbotFsmProviderProps {
  children: ReactNode;
  chatFormAction: (payload: ChatActionInputs) => void;
  addChatMessageToGlobalContext: (message: ChatMessage) => void;
  currentTicker: string;
  stockSnapshotJson: string;
  aiKeyTakeawaysJson: string;
  aiAnalyzedTaJson: string;
  aiOptionsAnalysisJson?: string;
  currentGlobalChatHistory: ChatMessage[];
  logDebug: (source: string, category: string, ...messages: any[]) => void;
  setChatbotFsmDisplayState: (displayTuple: FsmDisplayTuple) => void; // New prop
}

export function ChatbotFsmProvider({
  children,
  chatFormAction,
  addChatMessageToGlobalContext,
  currentTicker,
  stockSnapshotJson,
  aiKeyTakeawaysJson,
  aiAnalyzedTaJson,
  aiOptionsAnalysisJson,
  currentGlobalChatHistory,
  logDebug,
  setChatbotFsmDisplayState, // New prop
}: ChatbotFsmProviderProps) {
  const chatbotFsmReducer = (
    state: ChatbotFsmManagedState,
    event: ChatbotFsmEvent
  ): ChatbotFsmManagedState => {
    const previousState = state.fsmState;
    logDebug('ChatbotFsmContext', 'ReducerEvent', `Event: ${event.type}, CurrentState: ${state.fsmState}, PrevState: ${previousState}, UserInput: "${state.userInput.substring(0,20)}"`);
    let nextState: ChatbotFsmInternalState = state.fsmState;

    switch (event.type) {
      case 'USER_INPUT_CHANGED':
        nextState = state.fsmState === ChatbotFsmInternalState.SUBMITTING_MESSAGE ? state.fsmState : ChatbotFsmInternalState.PROCESSING_USER_INPUT;
        return {
          ...state,
          userInput: event.payload,
          fsmState: nextState,
          previousFsmState: previousState,
        };
      case 'SUBMIT_MESSAGE_REQUESTED':
        if (!state.userInput.trim()) {
          logDebug('ChatbotFsmContext', 'ReducerAction', 'SUBMIT_MESSAGE_REQUESTED: User input empty, no change.');
          return { ...state, previousFsmState: previousState };
        }
        logDebug('ChatbotFsmContext', 'ReducerAction', 'SUBMIT_MESSAGE_REQUESTED: Transitioning to SUBMITTING_MESSAGE.');
        nextState = ChatbotFsmInternalState.SUBMITTING_MESSAGE;
        return {
          ...state,
          fsmState: nextState,
          previousFsmState: previousState,
        };
      case 'SUBMISSION_CONCLUDED':
        logDebug('ChatbotFsmContext', 'ReducerAction', 'SUBMISSION_CONCLUDED: Transitioning to IDLE.');
        nextState = ChatbotFsmInternalState.IDLE;
        return {
          ...state,
          fsmState: nextState,
          previousFsmState: previousState,
        };
      default:
        return { ...state, previousFsmState: previousState };
    }
  };

  const [state, dispatch] = useReducer(chatbotFsmReducer, initialChatbotFsmState);
  const [targetChatbotFsmDisplayState, setTargetChatbotFsmDisplayState] = useState<ChatbotFsmInternalState | null>(null);

  const dispatchChatbotFsmEventWithTarget = useCallback((event: ChatbotFsmEvent) => {
    let targetState: ChatbotFsmInternalState | null = null;
    const currentState = state.fsmState;

    switch (currentState) {
        case ChatbotFsmInternalState.IDLE:
        case ChatbotFsmInternalState.PROCESSING_USER_INPUT:
            if (event.type === 'USER_INPUT_CHANGED') targetState = ChatbotFsmInternalState.PROCESSING_USER_INPUT;
            else if (event.type === 'SUBMIT_MESSAGE_REQUESTED' && state.userInput.trim()) targetState = ChatbotFsmInternalState.SUBMITTING_MESSAGE;
            break;
        case ChatbotFsmInternalState.SUBMITTING_MESSAGE:
            if (event.type === 'SUBMISSION_CONCLUDED') targetState = ChatbotFsmInternalState.IDLE;
            else if (event.type === 'USER_INPUT_CHANGED') targetState = currentState; 
            break;
    }

    if (targetState) {
      logDebug('ChatbotFsmContext', 'DispatchWithTarget', `Event ${event.type} from ${currentState} targeting ${targetState}.`);
      setTargetChatbotFsmDisplayState(targetState);
    }
    dispatch(event);
  }, [state.fsmState, state.userInput, logDebug]);

  useEffect(() => {
    if (targetChatbotFsmDisplayState !== null && state.fsmState === targetChatbotFsmDisplayState) {
      logDebug('ChatbotFsmContext', 'TargetClearEffect', `Chatbot FSM state changed to ${state.fsmState}. Clearing target display state.`);
      setTargetChatbotFsmDisplayState(null);
    }
  }, [state.fsmState, targetChatbotFsmDisplayState, logDebug]);

  useEffect(() => {
    setChatbotFsmDisplayState({
      previous: state.previousFsmState,
      current: state.fsmState,
      target: targetChatbotFsmDisplayState,
    });
  }, [state.fsmState, state.previousFsmState, targetChatbotFsmDisplayState, setChatbotFsmDisplayState]);


  useEffect(() => {
    if (state.fsmState === ChatbotFsmInternalState.SUBMITTING_MESSAGE && state.userInput.trim()) {
      logDebug('ChatbotFsmContext', 'EffectOnSubmit', 'SUBMITTING_MESSAGE state detected. Preparing to call actions.');

      const userMessageContent = state.userInput.trim();
      const userMessage: ChatMessage = {
        id: Date.now().toString() + '_user_fsm',
        role: 'user',
        content: userMessageContent
      };

      addChatMessageToGlobalContext(userMessage);
      logDebug('ChatbotFsmContext', 'EffectOnSubmit', 'User message added to global context.');

      const chatPayload: ChatActionInputs = {
        ticker: currentTicker,
        stockSnapshotJson,
        aiKeyTakeawaysJson,
        aiAnalyzedTaJson,
        aiOptionsAnalysisJson: aiOptionsAnalysisJson || '{}',
        chatHistory: [...currentGlobalChatHistory, userMessage],
        userInput: userMessageContent,
      };

      logDebug('ChatbotFsmContext', 'EffectOnSubmit', 'Calling server action chatFormAction within startTransition.');
      startTransition(() => {
        chatFormAction(chatPayload);
      });

      dispatchChatbotFsmEventWithTarget({ type: 'USER_INPUT_CHANGED', payload: '' });
      logDebug('ChatbotFsmContext', 'EffectOnSubmit', 'User input cleared in FSM, server action initiated.');
    }
  }, [
    state.fsmState,
    state.userInput,
    addChatMessageToGlobalContext,
    chatFormAction,
    currentTicker,
    stockSnapshotJson,
    aiKeyTakeawaysJson,
    aiAnalyzedTaJson,
    aiOptionsAnalysisJson,
    currentGlobalChatHistory,
    logDebug,
    dispatchChatbotFsmEventWithTarget 
  ]);


  const contextValue: ChatbotFsmContextType = {
    fsmState: state.fsmState,
    previousChatbotFsmState: state.previousFsmState,
    targetChatbotFsmDisplayState,
    userInput: state.userInput,
    dispatchChatbotFsmEvent: dispatchChatbotFsmEventWithTarget,
  };

  return (
    <ChatbotFsmContext.Provider value={contextValue}>
      {children}
    </ChatbotFsmContext.Provider>
  );
}

export function useChatbotFsm() {
  const context = useContext(ChatbotFsmContext);
  if (context === undefined) {
    throw new Error('useChatbotFsm must be used within a ChatbotFsmProvider');
  }
  return context;
}

    