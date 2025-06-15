
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { ChatMessage } from './stock-analysis-context'; 
import type { ChatActionInputs } from '@/actions/chat-server-action';
import { startTransition } from 'react';

// FSM States for Chatbot UI
export enum ChatbotFsmInternalState {
  IDLE = 'IDLE', // Ready for input, or after a response
  PROCESSING_USER_INPUT = 'PROCESSING_USER_INPUT', // User is actively typing
  SUBMITTING_MESSAGE = 'SUBMITTING_MESSAGE', // User has clicked send, action is being invoked
}

// FSM Events for Chatbot UI
export type ChatbotFsmEvent =
  | { type: 'USER_INPUT_CHANGED'; payload: string }
  | { type: 'SUBMIT_MESSAGE_REQUESTED' }
  | { type: 'SUBMISSION_CONCLUDED' }; // When isChatPending (external) becomes false

interface ChatbotFsmManagedState {
  fsmState: ChatbotFsmInternalState;
  userInput: string;
}

interface ChatbotFsmContextType extends ChatbotFsmManagedState {
  dispatchChatbotFsmEvent: (event: ChatbotFsmEvent) => void;
}

const initialChatbotFsmState: ChatbotFsmManagedState = {
  fsmState: ChatbotFsmInternalState.IDLE,
  userInput: '',
};

const ChatbotFsmContext = createContext<ChatbotFsmContextType | undefined>(undefined);

interface ChatbotFsmProviderProps {
  children: ReactNode;
  // Callback to execute the server action
  chatFormAction: (payload: ChatActionInputs) => void;
  // Callback to add the user's message to the global chat history
  addChatMessageToGlobalContext: (message: ChatMessage) => void;
  // Ticker and other context needed for the payload
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
  chatFormAction,
  addChatMessageToGlobalContext,
  currentTicker,
  stockSnapshotJson,
  aiKeyTakeawaysJson,
  aiAnalyzedTaJson,
  aiOptionsAnalysisJson,
  currentGlobalChatHistory,
  logDebug,
}: ChatbotFsmProviderProps) {
  const chatbotFsmReducer = (
    state: ChatbotFsmManagedState,
    event: ChatbotFsmEvent
  ): ChatbotFsmManagedState => {
    logDebug('ChatbotFsmContext', 'ReducerEvent', `Event: ${event.type}, CurrentState: ${state.fsmState}, UserInput: "${state.userInput.substring(0,20)}"`);
    switch (event.type) {
      case 'USER_INPUT_CHANGED':
        return {
          ...state,
          userInput: event.payload,
          fsmState: state.fsmState === ChatbotFsmInternalState.SUBMITTING_MESSAGE ? state.fsmState : ChatbotFsmInternalState.PROCESSING_USER_INPUT,
        };
      case 'SUBMIT_MESSAGE_REQUESTED':
        if (!state.userInput.trim()) {
          logDebug('ChatbotFsmContext', 'ReducerAction', 'SUBMIT_MESSAGE_REQUESTED: User input empty, no action.');
          return state; // No change if input is empty
        }
        
        // Important: The actual call to chatFormAction (server action) and addChatMessageToGlobalContext
        // should happen in a useEffect or callback triggered by this state change,
        // to allow startTransition to be used correctly.
        // Here, we just set the state to indicate submission is starting.
        logDebug('ChatbotFsmContext', 'ReducerAction', 'SUBMIT_MESSAGE_REQUESTED: Transitioning to SUBMITTING_MESSAGE.');
        return {
          ...state,
          fsmState: ChatbotFsmInternalState.SUBMITTING_MESSAGE,
        };
      case 'SUBMISSION_CONCLUDED':
        logDebug('ChatbotFsmContext', 'ReducerAction', 'SUBMISSION_CONCLUDED: Transitioning to IDLE.');
        return {
          ...state,
          // userInput: '', // User input is cleared in the effect that calls the action
          fsmState: ChatbotFsmInternalState.IDLE,
        };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(chatbotFsmReducer, initialChatbotFsmState);

  // Effect to handle the actual submission when state becomes SUBMITTING_MESSAGE
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
        chatHistory: [...currentGlobalChatHistory, userMessage], // Use the latest history
        userInput: userMessageContent,
      };
      
      logDebug('ChatbotFsmContext', 'EffectOnSubmit', 'Calling server action chatFormAction within startTransition.');
      startTransition(() => {
        chatFormAction(chatPayload);
      });

      // Clear input in the FSM after submission has been initiated
      // This will trigger a re-render, but SUBMITTING_MESSAGE state will persist until SUBMISSION_CONCLUDED
      dispatch({ type: 'USER_INPUT_CHANGED', payload: '' }); 
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
