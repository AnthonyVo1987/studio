
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

// FSM Events for Chatbot UI
export type ChatbotFsmEvent =
  | { type: 'USER_INPUT_CHANGED'; payload: string }
  | { type: 'SUBMIT_MESSAGE_REQUESTED'; payload?: string }; // payload is optional for direct input

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
  dispatchGlobalFsmEvent: (event: FsmEvent) => void; 
  currentTicker: string;
  stockSnapshotJson: string;
  aiKeyTakeawaysJson: string;
  aiAnalyzedTaJson: string;
  aiOptionsAnalysisJson?: string;
  currentGlobalChatHistory: ChatMessage[]; 
  logDebug: (source: string, category: string, ...messages: any[]) => void;
  setChatbotFsmDisplayState: (display: FsmDisplayTuple | null) => void;
  isChatGroundingEnabled: boolean;
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
  setChatbotFsmDisplayState,
  isChatGroundingEnabled,
}: ChatbotFsmProviderProps) {
  const componentLogSource = 'ChatbotFsmContext';

  const chatbotFsmReducer = (
    state: ChatbotFsmManagedState,
    event: ChatbotFsmEvent
  ): ChatbotFsmManagedState => {
    const previousState = state.fsmState;
    logDebug(componentLogSource, 'LocalFSM_Event', `Event: ${event.type}, CurrentLocalState: ${state.fsmState}`);
    let nextState: ChatbotFsmInternalState = state.fsmState;
    let nextUserInput = state.userInput;

    switch (event.type) {
      case 'USER_INPUT_CHANGED':
        nextState = ChatbotFsmInternalState.PROCESSING_USER_INPUT;
        nextUserInput = event.payload;
        logDebug(componentLogSource, 'LocalFSM_Transition', `USER_INPUT_CHANGED: To ${nextState}. New input: "${event.payload.substring(0,20)}"`);
        return {
          ...state,
          userInput: nextUserInput,
          fsmState: nextState,
          previousFsmState: previousState,
        };
      case 'SUBMIT_MESSAGE_REQUESTED':
        // Input for submission is either from payload (example prompt) or current state (manual typing)
        const inputToSubmit = event.payload || state.userInput;
        if (!inputToSubmit.trim()) {
          logDebug(componentLogSource, 'LocalFSM_Action', 'SUBMIT_MESSAGE_REQUESTED: User input empty, no change.');
          return { ...state, previousFsmState: previousState };
        }
        // Local FSM resets its input state, global FSM handles submission
        nextState = ChatbotFsmInternalState.IDLE; 
        nextUserInput = ''; // Clear input field after submission is requested
        logDebug(componentLogSource, 'LocalFSM_Transition', `SUBMIT_MESSAGE_REQUESTED: Input cleared. Transitioning to ${nextState}. Global FSM will handle actual submission with input: "${inputToSubmit.substring(0,30)}"`);
        return {
          ...state,
          userInput: nextUserInput, 
          fsmState: nextState, 
          previousFsmState: previousState,
        };
      default:
         logDebug(componentLogSource, 'LocalFSM_UnhandledEvent', `Unhandled event type: ${(event as any).type}`);
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
  }, [state.fsmState, state.previousFsmState, targetChatbotFsmDisplayState, setChatbotFsmDisplayState]);

  const dispatchChatbotFsmEventWithTarget = useCallback((event: ChatbotFsmEvent) => {
    let targetState: ChatbotFsmInternalState | null = state.fsmState; 
    const currentState = state.fsmState;
    logDebug(componentLogSource, 'LocalFSM_DispatchAttempt', `Event: ${event.type}, CurrentLocalState: ${currentState}`);

    switch (currentState) {
        case ChatbotFsmInternalState.IDLE:
        case ChatbotFsmInternalState.PROCESSING_USER_INPUT:
            if (event.type === 'USER_INPUT_CHANGED') targetState = ChatbotFsmInternalState.PROCESSING_USER_INPUT;
            else if (event.type === 'SUBMIT_MESSAGE_REQUESTED' && (event.payload || state.userInput.trim())) {
                 targetState = ChatbotFsmInternalState.IDLE; 
            }
            break;
    }

    if (targetState && targetState !== currentState) {
      logDebug(componentLogSource, 'LocalFSM_DispatchTargetSet', `Event ${event.type} from ${currentState} targeting ${targetState}.`);
      setTargetChatbotFsmDisplayState(targetState);
    } else {
      setTargetChatbotFsmDisplayState(null);
    }
    dispatch(event);
  }, [state.fsmState, state.userInput, logDebug]);

  useEffect(() => {
    if (targetChatbotFsmDisplayState !== null && state.fsmState === targetChatbotFsmDisplayState) {
      logDebug(componentLogSource, 'LocalFSM_TargetReached', `Local FSM state changed to ${state.fsmState}. Clearing target display.`);
      setTargetChatbotFsmDisplayState(null);
    }
  }, [state.fsmState, targetChatbotFsmDisplayState, logDebug]);

  const handleLocalFsmSubmitRequest = useCallback((directInput?: string) => {
    const inputForSubmission = directInput || state.userInput;
    if (inputForSubmission.trim()) {
      logDebug(componentLogSource, 'GlobalFSM_DispatchTrigger', `Local FSM requests global chat submission with input: "${inputForSubmission.substring(0,30)}"`);
      const chatPayloadForGlobalFsm: ChatActionInputs = {
        ticker: currentTicker,
        stockSnapshotJson,
        aiKeyTakeawaysJson,
        aiAnalyzedTaJson,
        aiOptionsAnalysisJson: aiOptionsAnalysisJson || '{}',
        chatHistory: currentGlobalChatHistory, 
        userInput: inputForSubmission.trim(),
        isChatGroundingEnabled,
      };
      dispatchGlobalFsmEvent({ type: 'SUBMIT_CHAT_MESSAGE', payload: chatPayloadForGlobalFsm });
    } else {
      logDebug(componentLogSource, 'GlobalFSM_DispatchBlocked', `Submission blocked. Input empty.`);
    }
  }, [
    state.userInput, currentTicker, stockSnapshotJson, aiKeyTakeawaysJson, 
    aiAnalyzedTaJson, aiOptionsAnalysisJson, currentGlobalChatHistory, dispatchGlobalFsmEvent, logDebug, isChatGroundingEnabled
  ]);

  const interceptingDispatch = useCallback((event: ChatbotFsmEvent) => {
    if (event.type === 'SUBMIT_MESSAGE_REQUESTED') {
      handleLocalFsmSubmitRequest(event.payload); // Pass direct input if available
      dispatchChatbotFsmEventWithTarget(event); // Local FSM still handles its state (like clearing input)
    } else {
      dispatchChatbotFsmEventWithTarget(event);
    }
  }, [dispatchChatbotFsmEventWithTarget, handleLocalFsmSubmitRequest]);


  const contextValue: ChatbotFsmContextType = {
    fsmState: state.fsmState,
    previousChatbotFsmState: state.previousFsmState,
    targetChatbotFsmDisplayState,
    userInput: state.userInput,
    dispatchChatbotFsmEvent: interceptingDispatch, 
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
