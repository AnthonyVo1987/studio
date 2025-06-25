
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import type { ChatMessage, FsmDisplayTuple, FsmEvent } from './stock-analysis-context'; 
import type { ChatActionInputs } from '@/actions/chat-server-action';

// FSM States for Chatbot UI
export enum ChatbotFsmInternalState {
  IDLE = 'IDLE', 
  PROCESSING_USER_INPUT = 'PROCESSING_USER_INPUT', 
}

interface SubmitMessagePayload {
  userInput: string;
  promptName?: string;
}

// FSM Events for Chatbot UI
export type ChatbotFsmEvent =
  | { type: 'USER_INPUT_CHANGED'; payload: string }
  | { type: 'SUBMIT_MESSAGE_REQUESTED'; payload: SubmitMessagePayload }
  | { type: 'PENDING_SUBMISSION_CLEARED' };


interface ChatbotFsmManagedState {
  fsmState: ChatbotFsmInternalState;
  previousFsmState: ChatbotFsmInternalState | null;
  userInput: string;
  pendingSubmissionPayload: SubmitMessagePayload | null;
}

interface ChatbotFsmContextType {
  fsmState: ChatbotFsmInternalState;
  userInput: string;
  dispatchChatbotFsmEvent: (event: ChatbotFsmEvent) => void;
}

const initialChatbotFsmState: ChatbotFsmManagedState = {
  fsmState: ChatbotFsmInternalState.IDLE,
  previousFsmState: null,
  userInput: '',
  pendingSubmissionPayload: null,
};

const ChatbotFsmContext = createContext<ChatbotFsmContextType | undefined>(undefined);

interface ChatbotFsmProviderProps {
  children: ReactNode;
  dispatchGlobalFsmEvent: (event: FsmEvent) => void; 
  currentTicker: string;
  stockSnapshotJson: string;
  aiKeyTakeawaysJson: string;
  aiAnalyzedTaJson: string;
  aiOptionsAnalysisJson?: string;
  currentGlobalChatHistory: ChatMessage[]; 
  logDebug: (source: string, category: string, ...messages: any[]) => void;
}

export function ChatbotFsmProvider({
  children,
  dispatchGlobalFsmEvent,
  currentTicker,
  stockSnapshotJson,
  aiKeyTakeawaysJson,
  aiAnalyzedTaJson,
  aiOptionsAnalysisJson,
  currentGlobalChatHistory,
  logDebug,
}: ChatbotFsmProviderProps) {
  const componentLogSource = 'ChatbotFsmContext';

  const chatbotFsmReducer = (
    state: ChatbotFsmManagedState,
    event: ChatbotFsmEvent
  ): ChatbotFsmManagedState => {
    const previousState = state.fsmState;
    logDebug(componentLogSource, 'LocalFSM_Event', `Event: ${event.type}, CurrentLocalState: ${state.fsmState}`);
    
    switch (event.type) {
      case 'USER_INPUT_CHANGED':
        return {
          ...state,
          userInput: event.payload,
          fsmState: ChatbotFsmInternalState.PROCESSING_USER_INPUT,
          previousFsmState: previousState,
        };
      case 'SUBMIT_MESSAGE_REQUESTED':
        if (!event.payload.userInput.trim()) {
          return { ...state, previousFsmState: previousState };
        }
        return {
          ...state,
          userInput: '', 
          pendingSubmissionPayload: event.payload,
          fsmState: ChatbotFsmInternalState.IDLE, 
          previousFsmState: previousState,
        };
      case 'PENDING_SUBMISSION_CLEARED':
        return {
            ...state,
            pendingSubmissionPayload: null,
            previousFsmState: previousState,
        };
      default:
         logDebug(componentLogSource, 'LocalFSM_UnhandledEvent', `Unhandled event type: ${(event as any).type}`);
        return state;
    }
  };

  const [state, dispatch] = useReducer(chatbotFsmReducer, initialChatbotFsmState);

  useEffect(() => {
    if (state.pendingSubmissionPayload) {
      const payload = state.pendingSubmissionPayload;
      const chatPayloadForGlobalFsm: ChatActionInputs = {
        ticker: currentTicker,
        stockSnapshotJson,
        aiKeyTakeawaysJson,
        aiAnalyzedTaJson,
        aiOptionsAnalysisJson: aiOptionsAnalysisJson || '{}',
        chatHistory: currentGlobalChatHistory, 
        userInput: payload.userInput.trim(),
        promptName: payload.promptName,
      };

      logDebug(componentLogSource, 'GlobalFSM_DispatchTrigger', `useEffect triggering SUBMIT_CHAT_MESSAGE for prompt: ${payload.promptName || 'default_chat'}`);
      dispatchGlobalFsmEvent({ type: 'SUBMIT_CHAT_MESSAGE', payload: chatPayloadForGlobalFsm });
      
      // Clear the pending submission to prevent re-triggering
      dispatch({ type: 'PENDING_SUBMISSION_CLEARED' });
    }
  }, [
    state.pendingSubmissionPayload, 
    dispatchGlobalFsmEvent, 
    currentTicker, 
    stockSnapshotJson, 
    aiKeyTakeawaysJson, 
    aiAnalyzedTaJson, 
    aiOptionsAnalysisJson, 
    currentGlobalChatHistory, 
    logDebug
  ]);


  const contextValue: ChatbotFsmContextType = {
    fsmState: state.fsmState,
    userInput: state.userInput,
    dispatchChatbotFsmEvent: dispatch, 
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
