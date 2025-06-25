
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { FsmEvent } from './stock-analysis-context'; 
import type { AppDataChatActionInputs } from '@/actions/app-data-chat-action';
import type { WebSearchChatInput } from '@/actions/web-search-chat-action';

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

export type ChatType = 'app-data' | 'web-search';

interface ChatbotFsmProviderProps {
  children: ReactNode;
  chatType: ChatType; // Determines which global event to dispatch
  dispatchGlobalFsmEvent: (event: FsmEvent) => void; 
  currentTicker: string;
  stockSnapshotJson?: string;
  aiKeyTakeawaysJson?: string;
  aiAnalyzedTaJson?: string;
  aiOptionsAnalysisJson?: string;
  currentGlobalChatHistory: Array<{ role: 'user' | 'model'; content: string }>;
  logDebug: (source: string, category: string, ...messages: any[]) => void;
}

export function ChatbotFsmProvider({
  children,
  chatType,
  dispatchGlobalFsmEvent,
  currentTicker,
  stockSnapshotJson,
  aiKeyTakeawaysJson,
  aiAnalyzedTaJson,
  aiOptionsAnalysisJson,
  currentGlobalChatHistory,
  logDebug,
}: ChatbotFsmProviderProps) {
  const componentLogSource = `ChatbotFsmContext:${chatType}`;

  const chatbotFsmReducer = (
    state: ChatbotFsmManagedState,
    event: ChatbotFsmEvent
  ): ChatbotFsmManagedState => {
    const previousState = state.fsmState;
    logDebug(componentLogSource, 'LocalFSM_Event', `Event: ${event.type}, CurrentLocalState: ${state.fsmState}`);
    
    switch (event.type) {
      case 'USER_INPUT_CHANGED':
        return { ...state, userInput: event.payload, fsmState: ChatbotFsmInternalState.PROCESSING_USER_INPUT, previousFsmState: previousState };
      case 'SUBMIT_MESSAGE_REQUESTED':
        if (!event.payload.userInput.trim()) return { ...state, previousFsmState: previousState };
        return { ...state, userInput: '', pendingSubmissionPayload: event.payload, fsmState: ChatbotFsmInternalState.IDLE, previousFsmState: previousState };
      case 'PENDING_SUBMISSION_CLEARED':
        return { ...state, pendingSubmissionPayload: null, previousFsmState: previousState };
      default:
        logDebug(componentLogSource, 'LocalFSM_UnhandledEvent', `Unhandled event type: ${(event as any).type}`);
        return state;
    }
  };

  const [state, dispatch] = useReducer(chatbotFsmReducer, initialChatbotFsmState);

  useEffect(() => {
    if (state.pendingSubmissionPayload) {
      const payload = state.pendingSubmissionPayload;
      
      if (chatType === 'app-data') {
        const chatPayloadForGlobalFsm: AppDataChatActionInputs = {
          ticker: currentTicker, stockSnapshotJson: stockSnapshotJson || '{}', aiKeyTakeawaysJson: aiKeyTakeawaysJson || '{}',
          aiAnalyzedTaJson: aiAnalyzedTaJson || '{}', aiOptionsAnalysisJson: aiOptionsAnalysisJson || '{}',
          chatHistory: currentGlobalChatHistory, userInput: payload.userInput.trim(), promptName: payload.promptName,
        };
        logDebug(componentLogSource, 'GlobalFSM_DispatchTrigger', `Dispatching SUBMIT_APP_DATA_CHAT_MESSAGE for prompt: ${payload.promptName || 'default_chat'}`);
        dispatchGlobalFsmEvent({ type: 'SUBMIT_APP_DATA_CHAT_MESSAGE', payload: chatPayloadForGlobalFsm });
      } else if (chatType === 'web-search') {
        const chatPayloadForGlobalFsm: WebSearchChatInput = {
            ticker: currentTicker,
            chatHistory: currentGlobalChatHistory,
            userInput: payload.userInput.trim(),
            promptName: payload.promptName,
        };
        logDebug(componentLogSource, 'GlobalFSM_DispatchTrigger', `Dispatching SUBMIT_WEB_SEARCH_CHAT_MESSAGE for prompt: ${payload.promptName || 'default_web_search'}`);
        dispatchGlobalFsmEvent({ type: 'SUBMIT_WEB_SEARCH_CHAT_MESSAGE', payload: chatPayloadForGlobalFsm });
      }
      
      dispatch({ type: 'PENDING_SUBMISSION_CLEARED' });
    }
  }, [
    state.pendingSubmissionPayload, chatType, dispatchGlobalFsmEvent, currentTicker, 
    stockSnapshotJson, aiKeyTakeawaysJson, aiAnalyzedTaJson, aiOptionsAnalysisJson, 
    currentGlobalChatHistory, logDebug, componentLogSource
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
