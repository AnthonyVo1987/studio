
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import type { ChatMessage, FsmDisplayTuple, FsmEvent } from './stock-analysis-context'; 
import type { ChatActionInputs } from '@/actions/chat-server-action';
// Removed: import { startTransition } from 'react'; // No longer directly calling server action here

// FSM States for Chatbot UI
export enum ChatbotFsmInternalState {
  IDLE = 'IDLE', 
  PROCESSING_USER_INPUT = 'PROCESSING_USER_INPUT', 
  // REMOVED: SUBMITTING_MESSAGE - Global FSM handles submission lifecycle
}

// FSM Events for Chatbot UI
export type ChatbotFsmEvent =
  | { type: 'USER_INPUT_CHANGED'; payload: string }
  | { type: 'SUBMIT_MESSAGE_REQUESTED' };
  // REMOVED: | { type: 'SUBMISSION_CONCLUDED' };

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
  dispatchGlobalFsmEvent: (event: FsmEvent) => void; // To dispatch SUBMIT_CHAT_MESSAGE
  currentTicker: string;
  stockSnapshotJson: string;
  aiKeyTakeawaysJson: string;
  aiAnalyzedTaJson: string;
  aiOptionsAnalysisJson?: string;
  currentGlobalChatHistory: ChatMessage[]; // Needed for context in SUBMIT_CHAT_MESSAGE
  logDebug: (source: string, category: string, ...messages: any[]) => void;
  setChatbotFsmDisplayState: (display: FsmDisplayTuple | null) => void;
  isGlobalChatPending: boolean; // To disable input if global FSM is busy with chat
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
  isGlobalChatPending, // Receive this prop
}: ChatbotFsmProviderProps) {
  const componentLogSource = 'ChatbotFsmContext';

  const chatbotFsmReducer = (
    state: ChatbotFsmManagedState,
    event: ChatbotFsmEvent
  ): ChatbotFsmManagedState => {
    const previousState = state.fsmState;
    logDebug(componentLogSource, 'Reducer_Event', `Event: ${event.type}, CurrentState: ${state.fsmState}, PrevState: ${previousState}, UserInput: "${state.userInput.substring(0,20)}"`);
    let nextState: ChatbotFsmInternalState = state.fsmState;

    switch (event.type) {
      case 'USER_INPUT_CHANGED':
        // Allow input change even if global chat is pending, UI will disable actual submission
        nextState = ChatbotFsmInternalState.PROCESSING_USER_INPUT;
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
        // This FSM no longer goes to SUBMITTING_MESSAGE. It just signals intent.
        // The actual submission and pending state are handled by Global FSM.
        logDebug(componentLogSource, 'Reducer_Action', 'SUBMIT_MESSAGE_REQUESTED: Requesting global chat submission.');
        // Return to IDLE or PROCESSING_USER_INPUT, ready for next input
        // The actual submission logic is moved to the useEffect below.
        nextState = state.userInput ? ChatbotFsmInternalState.PROCESSING_USER_INPUT : ChatbotFsmInternalState.IDLE;
        return {
          ...state,
          fsmState: nextState, // Or IDLE if input is cleared after submission request
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
            // SUBMIT_MESSAGE_REQUESTED no longer changes local FSM state to SUBMITTING
            else if (event.type === 'SUBMIT_MESSAGE_REQUESTED' && state.userInput.trim()) targetState = ChatbotFsmInternalState.IDLE; // Or PROCESSING_USER_INPUT if input isn't cleared immediately
            break;
    }

    if (targetState && targetState !== currentState) {
      logDebug(componentLogSource, 'Dispatch_TargetSet', `Event ${event.type} from ${currentState} targeting ${targetState}.`);
      setTargetChatbotFsmDisplayState(targetState);
    } else {
      logDebug(componentLogSource, 'Dispatch_TargetClear', `Event ${event.type} from ${currentState} resulted in same target or no target change. Clearing target display.`);
      setTargetChatbotFsmDisplayState(null);
    }
    dispatch(event);
  }, [state.fsmState, state.userInput, logDebug]);

  useEffect(() => {
    if (targetChatbotFsmDisplayState !== null && state.fsmState === targetChatbotFsmDisplayState) {
      logDebug(componentLogSource, 'Effect_TargetReached', `Chatbot FSM state changed to ${state.fsmState}. Clearing target display state.`);
      setTargetChatbotFsmDisplayState(null);
    }
  }, [state.fsmState, targetChatbotFsmDisplayState, logDebug]);

  // Effect to handle SUBMIT_MESSAGE_REQUESTED from the local FSM
  // This effect will now dispatch to the GLOBAL FSM
  useEffect(() => {
    // This check should ideally be managed by the reducer setting a flag or the component directly calling.
    // For simplicity, if the user input is present and a "submit" conceptually happened (even if local FSM state reset),
    // we check if we should dispatch to global.
    // This logic might be better placed in the dispatchChatbotFsmEventWithTarget or component if SUBMIT_MESSAGE_REQUESTED doesn't change local state.
    // Let's assume the component will call a submit function that directly dispatches to global FSM.
    // So, this specific useEffect reacting to SUBMITTING_MESSAGE state is removed.
    // The dispatch to global FSM will happen in response to the SUBMIT_MESSAGE_REQUESTED event.
  }, [
    /* dependencies removed as this effect's old logic is moved */
  ]);

  const handleLocalFsmSubmitRequest = useCallback(() => {
    // This function is called when the local FSM decides a submission is ready.
    if (state.userInput.trim() && !isGlobalChatPending) {
      logDebug(componentLogSource, 'GlobalSubmitTrigger', 'Local FSM requests global chat submission.');
      const chatPayloadForGlobalFsm: ChatActionInputs = {
        ticker: currentTicker,
        stockSnapshotJson,
        aiKeyTakeawaysJson,
        aiAnalyzedTaJson,
        aiOptionsAnalysisJson: aiOptionsAnalysisJson || '{}',
        // Global FSM will add its own user message to history, so use currentGlobalChatHistory
        chatHistory: currentGlobalChatHistory, 
        userInput: state.userInput.trim(),
      };
      dispatchGlobalFsmEvent({ type: 'SUBMIT_CHAT_MESSAGE', payload: chatPayloadForGlobalFsm });
      // Clear local user input after dispatching to global FSM
      dispatchChatbotFsmEventWithTarget({ type: 'USER_INPUT_CHANGED', payload: '' });
    } else {
      logDebug(componentLogSource, 'GlobalSubmitTrigger_Blocked', `Submission blocked. Input: "${state.userInput.trim()}", GlobalChatPending: ${isGlobalChatPending}`);
    }
  }, [
    state.userInput, 
    isGlobalChatPending, 
    currentTicker, 
    stockSnapshotJson, 
    aiKeyTakeawaysJson, 
    aiAnalyzedTaJson, 
    aiOptionsAnalysisJson, 
    currentGlobalChatHistory,
    dispatchGlobalFsmEvent, 
    dispatchChatbotFsmEventWithTarget, 
    logDebug, 
    componentLogSource
  ]);

  // Modify the context's dispatch to intercept SUBMIT_MESSAGE_REQUESTED
  const interceptingDispatch = useCallback((event: ChatbotFsmEvent) => {
    if (event.type === 'SUBMIT_MESSAGE_REQUESTED') {
      handleLocalFsmSubmitRequest();
      // Original dispatch might still be needed to update local state if necessary (e.g., to IDLE)
      // but the primary action is now handleLocalFsmSubmitRequest.
      // For now, let's let the original reducer handle local state updates from SUBMIT_MESSAGE_REQUESTED.
      dispatchChatbotFsmEventWithTarget(event); 
    } else {
      dispatchChatbotFsmEventWithTarget(event);
    }
  }, [dispatchChatbotFsmEventWithTarget, handleLocalFsmSubmitRequest]);


  const contextValue: ChatbotFsmContextType = {
    fsmState: state.fsmState,
    previousChatbotFsmState: state.previousFsmState,
    targetChatbotFsmDisplayState,
    userInput: state.userInput,
    dispatchChatbotFsmEvent: interceptingDispatch, // Use the intercepting dispatch
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

