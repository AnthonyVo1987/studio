
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import type { ChatMessage, FsmDisplayTuple } from './stock-analysis-context'; 
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

interface ChatbotFsmContextType {
  fsmState: ChatbotFsmInternalState;
  previousChatbotFsmState: ChatbotFsmInternalState | null; 
  targetChatbotFsmDisplayState: ChatbotFsmInternalState | null;
  userInput: string;
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
  setChatbotFsmDisplayState: (display: FsmDisplayTuple | null) => void; // For reporting to global context
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
  setChatbotFsmDisplayState,
}: ChatbotFsmProviderProps) {
  const componentLogSource = 'ChatbotFsmContext'; // Consistent source for logs from this context

  const chatbotFsmReducer = (
    state: ChatbotFsmManagedState,
    event: ChatbotFsmEvent
  ): ChatbotFsmManagedState => {
    const previousState = state.fsmState;
    logDebug(componentLogSource, 'Reducer_Event', `Event: ${event.type}, CurrentState: ${state.fsmState}, PrevState: ${previousState}, UserInput: "${state.userInput.substring(0,20)}"`);
    let nextState: ChatbotFsmInternalState = state.fsmState;

    switch (event.type) {
      case 'USER_INPUT_CHANGED':
        nextState = state.fsmState === ChatbotFsmInternalState.SUBMITTING_MESSAGE ? state.fsmState : ChatbotFsmInternalState.PROCESSING_USER_INPUT;
        logDebug(componentLogSource, 'Reducer_Transition', `USER_INPUT_CHANGED: Transitioning to ${nextState}. New input: "${event.payload.substring(0,20)}"`);
        return {
          ...state,
          userInput: event.payload,
          fsmState: nextState,
          previousFsmState: previousState,
        };
      case 'SUBMIT_MESSAGE_REQUESTED':
        if (!state.userInput.trim()) {
          logDebug(componentLogSource, 'Reducer_Action', 'SUBMIT_MESSAGE_REQUESTED: User input empty, no change.');
          return { ...state, previousFsmState: previousState };
        }
        logDebug(componentLogSource, 'Reducer_Transition', 'SUBMIT_MESSAGE_REQUESTED: Transitioning to SUBMITTING_MESSAGE.');
        nextState = ChatbotFsmInternalState.SUBMITTING_MESSAGE;
        return {
          ...state,
          fsmState: nextState,
          previousFsmState: previousState,
        };
      case 'SUBMISSION_CONCLUDED':
        logDebug(componentLogSource, 'Reducer_Transition', 'SUBMISSION_CONCLUDED: Transitioning to IDLE.');
        nextState = ChatbotFsmInternalState.IDLE;
        return {
          ...state,
          fsmState: nextState,
          previousFsmState: previousState,
        };
      default:
         logDebug(componentLogSource, 'Reducer_UnhandledEvent', `Unhandled event type: ${event.type}`);
        return { ...state, previousFsmState: previousState };
    }
  };

  const [state, dispatch] = useReducer(chatbotFsmReducer, initialChatbotFsmState);
  const [targetChatbotFsmDisplayState, setTargetChatbotFsmDisplayState] = useState<ChatbotFsmInternalState | null>(null);

  useEffect(() => {
    setChatbotFsmDisplayState({
      previous: state.previousFsmState,
      current: state.fsmState,
      target: targetChatbotFsmDisplayState,
    });
    logDebug(componentLogSource, 'Effect_DisplayUpdate', `FSM display state reported to global context. Prev: ${state.previousFsmState}, Curr: ${state.fsmState}, Target: ${targetChatbotFsmDisplayState}`);
  }, [state.fsmState, state.previousFsmState, targetChatbotFsmDisplayState, setChatbotFsmDisplayState, logDebug]);

  const dispatchChatbotFsmEventWithTarget = useCallback((event: ChatbotFsmEvent) => {
    let targetState: ChatbotFsmInternalState | null = state.fsmState; 
    const currentState = state.fsmState;
    logDebug(componentLogSource, 'Dispatch_Attempt', `Attempting dispatch. Event: ${event.type}, CurrentState: ${currentState}`);

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

    if (targetState && targetState !== currentState) {
      logDebug(componentLogSource, 'Dispatch_TargetSet', `Event ${event.type} from ${currentState} targeting ${targetState}.`);
      setTargetChatbotFsmDisplayState(targetState);
    } else if (targetState === currentState && event.type !== 'USER_INPUT_CHANGED') { // Avoid clearing target if only input changed within same conceptual state
      logDebug(componentLogSource, 'Dispatch_TargetClear', `Event ${event.type} from ${currentState} resulted in same target. Clearing target display.`);
      setTargetChatbotFsmDisplayState(null);
    } else if (targetState === currentState && event.type === 'USER_INPUT_CHANGED'){
      // No change to target display if only user input changes within PROCESSING_USER_INPUT
    }
    dispatch(event);
  }, [state.fsmState, state.userInput, logDebug]);

  useEffect(() => {
    if (targetChatbotFsmDisplayState !== null && state.fsmState === targetChatbotFsmDisplayState) {
      logDebug(componentLogSource, 'Effect_TargetReached', `Chatbot FSM state changed to ${state.fsmState}. Clearing target display state.`);
      setTargetChatbotFsmDisplayState(null);
    }
  }, [state.fsmState, targetChatbotFsmDisplayState, logDebug]);

  useEffect(() => {
    if (state.fsmState === ChatbotFsmInternalState.SUBMITTING_MESSAGE && state.userInput.trim()) {
      logDebug(componentLogSource, 'Effect_SubmitMessage', 'SUBMITTING_MESSAGE state detected. Preparing to call actions.');

      const userMessageContent = state.userInput.trim();
      const userMessage: ChatMessage = {
        id: Date.now().toString() + '_user_fsm',
        role: 'user',
        content: userMessageContent
      };

      addChatMessageToGlobalContext(userMessage);
      logDebug(componentLogSource, 'Effect_SubmitMessage', 'User message added to global context.');

      const chatPayload: ChatActionInputs = {
        ticker: currentTicker,
        stockSnapshotJson,
        aiKeyTakeawaysJson,
        aiAnalyzedTaJson,
        aiOptionsAnalysisJson: aiOptionsAnalysisJson || '{}',
        chatHistory: [...currentGlobalChatHistory, userMessage],
        userInput: userMessageContent,
      };
      logDebug(componentLogSource, 'Effect_SubmitMessage_Payload', 'Chat payload prepared:', { ticker: currentTicker, historyLength: chatPayload.chatHistory.length, userInputSnippet: userMessageContent.substring(0,30) });

      logDebug(componentLogSource, 'Effect_SubmitMessage', 'Calling server action chatFormAction within startTransition.');
      startTransition(() => {
        chatFormAction(chatPayload);
      });

      dispatchChatbotFsmEventWithTarget({ type: 'USER_INPUT_CHANGED', payload: '' });
      logDebug(componentLogSource, 'Effect_SubmitMessage', 'User input cleared in FSM, server action initiated.');
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

