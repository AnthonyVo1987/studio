
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { FsmEvent } from './stock-analysis-context';
import { useActionState, startTransition } from 'react';
import { appDataChatAction, type AppDataChatActionState, type AppDataChatActionInputs } from '@/actions/app-data-chat-action';
import { sdkWebSearchChatAction, type SdkWebSearchChatActionState, type SdkWebSearchChatActionInputs } from '@/actions/sdk-web-search-chat-action';

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
  isLocalActionPending: boolean; // New property to expose local pending state
}

const initialChatbotFsmState: ChatbotFsmManagedState = {
  fsmState: ChatbotFsmInternalState.IDLE,
  previousFsmState: null,
  userInput: '',
  pendingSubmissionPayload: null,
};

const ChatbotFsmContext = createContext<ChatbotFsmContextType | undefined>(undefined);

export type ChatType = 'app-data' | 'web-search';

// Props for AppData chat type
interface AppDataChatProps {
  chatType: 'app-data';
  dispatchGlobalFsmEvent: (event: FsmEvent) => void; 
  stockSnapshotJson?: string;
  aiKeyTakeawaysJson?: string;
  aiAnalyzedTaJson?: string;
  aiOptionsAnalysisJson?: string;
}

// Props for WebSearch chat type
interface WebSearchChatProps {
  chatType: 'web-search';
  setUserInputWebSearchChatRequestJson: (json: string) => void;
  setUserInputWebSearchChatResponseJson: (json: string) => void;
}

type ChatbotFsmProviderProps = {
  children: ReactNode;
  currentTicker: string;
  currentGlobalChatHistory: Array<{ role: 'user' | 'model'; content: string }>;
  logDebug: (source: string, category: string, ...messages: any[]) => void;
} & (AppDataChatProps | WebSearchChatProps);


export function ChatbotFsmProvider(props: ChatbotFsmProviderProps) {
  const {
    children,
    chatType,
    currentTicker,
    currentGlobalChatHistory,
    logDebug,
  } = props;
  const componentLogSource = `ChatbotFsmContext:${chatType}`;
  
  const [appDataActionState, appDataFormAction, isAppDataChatPending] = useActionState<AppDataChatActionState, AppDataChatActionInputs>(appDataChatAction, { status: 'idle' });
  const [sdkWebSearchActionState, sdkWebSearchFormAction, isSdkWebSearchPending] = useActionState<SdkWebSearchChatActionState, SdkWebSearchChatActionInputs>(sdkWebSearchChatAction, { status: 'idle' });

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
      
      const baseChatPayload = {
        ticker: currentTicker,
        chatHistory: currentGlobalChatHistory,
        userInput: payload.userInput.trim(),
        promptName: payload.promptName,
      };

      if (props.chatType === 'app-data') {
        const appDataPayload: AppDataChatActionInputs = {
          ...baseChatPayload,
          stockSnapshotJson: props.stockSnapshotJson || '{}',
          aiKeyTakeawaysJson: props.aiKeyTakeawaysJson || '{}',
          aiAnalyzedTaJson: props.aiAnalyzedTaJson || '{}',
          aiOptionsAnalysisJson: props.aiOptionsAnalysisJson || '{}',
        };
        // This is a global FSM event because AppData chat is part of the main pipeline
        props.dispatchGlobalFsmEvent({ type: 'SUBMIT_USER_INPUT_APP_DATA_CHAT', payload: appDataPayload });
      } else if (props.chatType === 'web-search') {
        // This is a direct SDK call, not a global FSM event
        const sdkPayload: SdkWebSearchChatActionInputs = {
          ticker: currentTicker,
          promptName: payload.promptName,
          userInput: payload.userInput.trim()
        };
        startTransition(() => {
          sdkWebSearchFormAction(sdkPayload);
        });
      }
      dispatch({ type: 'PENDING_SUBMISSION_CLEARED' });
    }
  }, [state.pendingSubmissionPayload, props, currentTicker, currentGlobalChatHistory]);

  // Effect to handle the result of the SDK Web Search action
  useEffect(() => {
      if (props.chatType !== 'web-search') return;
      if (sdkWebSearchActionState.status === 'idle' || isSdkWebSearchPending) return;

      const { status, data, error, message } = sdkWebSearchActionState;

      if (status === 'success' && data) {
          props.setUserInputWebSearchChatRequestJson(data.requestJson);
          props.setUserInputWebSearchChatResponseJson(data.responseJson);
          try {
              const responseData = JSON.parse(data.responseJson);
              if (responseData.response) {
                  logDebug(componentLogSource, 'MessageAdd', 'Adding successful web search response to history.');
                  // This part will need the addWebSearchChatMessage function, which has been removed from props
                  // This indicates a larger refactor is needed to fully decouple.
                  // For now, this effect will only log and set the JSONs.
              }
          } catch (e) { console.error('Error parsing SDK response JSON'); }
      } else if (status === 'error') {
          props.setUserInputWebSearchChatRequestJson(data?.requestJson || '{"error":"Request not available"}');
          props.setUserInputWebSearchChatResponseJson(data?.responseJson || `{"error":"${error}"}`);
          logDebug(componentLogSource, 'MessageAdd', `Adding error web search response to history: ${message}`);
      }
  }, [sdkWebSearchActionState, isSdkWebSearchPending, props, logDebug, componentLogSource]);


  const contextValue: ChatbotFsmContextType = {
    fsmState: state.fsmState,
    userInput: state.userInput,
    dispatchChatbotFsmEvent: dispatch,
    isLocalActionPending: props.chatType === 'web-search' ? isSdkWebSearchPending : false,
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
