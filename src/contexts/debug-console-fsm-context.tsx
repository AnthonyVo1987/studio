
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer, useCallback, useState, useEffect } from 'react';
import type { LogSourceId, LogType } from '@/lib/debug-log-types';
import { logSourceIds as allLogSourceIds, logTypes as allLogTypes } from '@/lib/debug-log-types';
import type { FsmDisplayTuple } from './stock-analysis-context';


// FSM States for DebugConsole UI
export enum DebugConsoleFsmMenuState {
  IDLE = 'IDLE', 
  FILTER_TYPE_MENU_OPEN = 'FILTER_TYPE_MENU_OPEN',
  FILTER_SOURCE_MENU_OPEN = 'FILTER_SOURCE_MENU_OPEN', 
  COPY_MENU_OPEN = 'COPY_MENU_OPEN',
  EXPORT_MENU_OPEN = 'EXPORT_MENU_OPEN',
}

export interface DebugConsoleFsmManagedState {
  uiMenuState: DebugConsoleFsmMenuState;
  previousUiMenuState: DebugConsoleFsmMenuState | null;
  activeFilters: {
    types: Set<LogType>;
    sources: Set<LogSourceId>;
  };
  searchTerm: string;
}

// FSM Events for DebugConsole UI
export type DebugConsoleFsmEvent =
  | { type: 'SET_MENU_OPEN_STATE'; payload: { menu: 'filterType' | 'filterSource' | 'copy' | 'export'; isOpen: boolean } }
  | { type: 'UPDATE_TYPE_FILTER'; payload: { type: LogType; checked: boolean } }
  | { type: 'UPDATE_SOURCE_FILTER'; payload: { source: LogSourceId; checked: boolean } }
  | { type: 'SET_ALL_TYPE_FILTERS'; payload: { selectAll: boolean } }
  | { type: 'SET_ALL_SOURCE_FILTERS'; payload: { selectAll: boolean } }
  | { type: 'SEARCH_TERM_CHANGED'; payload: string }
  | { type: 'CLEAR_SEARCH_TERM' };

interface DebugConsoleFsmContextType {
  uiMenuState: DebugConsoleFsmMenuState;
  previousUiMenuState: DebugConsoleFsmMenuState | null;
  targetUiMenuDisplayState: DebugConsoleFsmMenuState | null;
  activeFilters: {
    types: Set<LogType>;
    sources: Set<LogSourceId>;
  };
  searchTerm: string;
  dispatchDebugConsoleFsmEvent: (event: DebugConsoleFsmEvent) => void;
}

const initialDebugConsoleFsmState: DebugConsoleFsmManagedState = {
  uiMenuState: DebugConsoleFsmMenuState.IDLE,
  previousUiMenuState: null,
  activeFilters: {
    types: new Set<LogType>(),
    sources: new Set<LogSourceId>(),
  },
  searchTerm: '',
};

const DebugConsoleFsmContext = createContext<DebugConsoleFsmContextType | undefined>(undefined);

interface DebugConsoleFsmProviderProps {
  children: ReactNode;
  logDebug: (source: string, category: string, ...messages: any[]) => void;
  setDebugConsoleMenuFsmDisplayState: (display: FsmDisplayTuple | null) => void; // For reporting
}

export function DebugConsoleFsmProvider({
  children,
  logDebug,
  setDebugConsoleMenuFsmDisplayState,
}: DebugConsoleFsmProviderProps) {
  const componentLogSource = 'DebugConsoleFsmContext'; // Consistent source for logs

  const debugConsoleFsmReducer = (
    state: DebugConsoleFsmManagedState,
    event: DebugConsoleFsmEvent
  ): DebugConsoleFsmManagedState => {
    const previousState = state.uiMenuState;
    logDebug(componentLogSource, 'Reducer_Event', `Event: ${event.type}, Current MenuState: ${state.uiMenuState}, Prev MenuState: ${previousState}`);
    let nextUiMenuState = state.uiMenuState;

    switch (event.type) {
      case 'SET_MENU_OPEN_STATE': {
        const { menu, isOpen } = event.payload;
        if (!isOpen) {
          nextUiMenuState = DebugConsoleFsmMenuState.IDLE;
        } else {
          switch (menu) {
            case 'filterType':
            case 'filterSource': 
              nextUiMenuState = DebugConsoleFsmMenuState.FILTER_TYPE_MENU_OPEN; 
              break;
            case 'copy':
              nextUiMenuState = DebugConsoleFsmMenuState.COPY_MENU_OPEN;
              break;
            case 'export':
              nextUiMenuState = DebugConsoleFsmMenuState.EXPORT_MENU_OPEN;
              break;
          }
        }
        logDebug(componentLogSource, 'Reducer_Transition_Menu', `SET_MENU_OPEN_STATE: Menu ${menu} to ${isOpen ? nextUiMenuState : 'IDLE'}.`);
        return { ...state, uiMenuState: nextUiMenuState, previousUiMenuState: previousState };
      }
      case 'UPDATE_TYPE_FILTER': {
        const newTypes = new Set(state.activeFilters.types);
        if (event.payload.checked) newTypes.add(event.payload.type);
        else newTypes.delete(event.payload.type);
        logDebug(componentLogSource, 'Reducer_FilterChange', `Type filter updated: ${event.payload.type}, checked: ${event.payload.checked}. New types: ${Array.from(newTypes).join(', ')}`);
        return { ...state, activeFilters: { ...state.activeFilters, types: newTypes }, previousUiMenuState: previousState };
      }
      case 'UPDATE_SOURCE_FILTER': {
        const newSources = new Set(state.activeFilters.sources);
        if (event.payload.checked) newSources.add(event.payload.source);
        else newSources.delete(event.payload.source);
        logDebug(componentLogSource, 'Reducer_FilterChange', `Source filter updated: ${event.payload.source}, checked: ${event.payload.checked}. New sources: ${Array.from(newSources).join(', ')}`);
        return { ...state, activeFilters: { ...state.activeFilters, sources: newSources }, previousUiMenuState: previousState };
      }
      case 'SET_ALL_TYPE_FILTERS': {
        const newTypes = event.payload.selectAll ? new Set(allLogTypes) : new Set<LogType>();
        logDebug(componentLogSource, 'Reducer_FilterChange', `Set all type filters to: ${event.payload.selectAll}. New types: ${Array.from(newTypes).join(', ')}`);
        return { ...state, activeFilters: { ...state.activeFilters, types: newTypes }, previousUiMenuState: previousState };
      }
      case 'SET_ALL_SOURCE_FILTERS': {
        const newSources = event.payload.selectAll ? new Set(allLogSourceIds) : new Set<LogSourceId>();
        logDebug(componentLogSource, 'Reducer_FilterChange', `Set all source filters to: ${event.payload.selectAll}. New sources: ${Array.from(newSources).join(', ')}`);
        return { ...state, activeFilters: { ...state.activeFilters, sources: newSources }, previousUiMenuState: previousState };
      }
      case 'SEARCH_TERM_CHANGED':
        logDebug(componentLogSource, 'Reducer_SearchChange', `Search term changed to: "${event.payload}"`);
        return { ...state, searchTerm: event.payload, previousUiMenuState: previousState }; 
      case 'CLEAR_SEARCH_TERM':
        logDebug(componentLogSource, 'Reducer_SearchChange', `Search term cleared.`);
        return { ...state, searchTerm: '', previousUiMenuState: previousState }; 
      default:
        logDebug(componentLogSource, 'Reducer_UnhandledEvent', `Unhandled event type: ${event.type}`);
        return { ...state, previousUiMenuState: previousState };
    }
  };

  const [state, dispatch] = useReducer(debugConsoleFsmReducer, initialDebugConsoleFsmState);
  const [targetUiMenuDisplayState, setTargetUiMenuDisplayState] = useState<DebugConsoleFsmMenuState | null>(null);

  useEffect(() => {
    setDebugConsoleMenuFsmDisplayState({
        previous: state.previousUiMenuState,
        current: state.uiMenuState,
        target: targetUiMenuDisplayState,
    });
    logDebug(componentLogSource, 'Effect_DisplayUpdate', `FSM display state reported to global context. Prev: ${state.previousUiMenuState}, Curr: ${state.uiMenuState}, Target: ${targetUiMenuDisplayState}`);
  }, [state.uiMenuState, state.previousUiMenuState, targetUiMenuDisplayState, setDebugConsoleMenuFsmDisplayState, logDebug]);


  const dispatchDebugConsoleFsmEventWithTarget = useCallback((event: DebugConsoleFsmEvent) => {
    let targetState: DebugConsoleFsmMenuState | null = state.uiMenuState; 
    const currentState = state.uiMenuState;
    logDebug(componentLogSource, 'Dispatch_Attempt', `Attempting dispatch. Event: ${event.type}, CurrentState: ${currentState}`);
    
     if (event.type === 'SET_MENU_OPEN_STATE') {
        targetState = event.payload.isOpen
            ? (event.payload.menu === 'filterType' || event.payload.menu === 'filterSource'
                ? DebugConsoleFsmMenuState.FILTER_TYPE_MENU_OPEN
                : event.payload.menu === 'copy'
                    ? DebugConsoleFsmMenuState.COPY_MENU_OPEN
                    : DebugConsoleFsmMenuState.EXPORT_MENU_OPEN)
            : DebugConsoleFsmMenuState.IDLE;
    }
    
    if (event.type === 'SET_MENU_OPEN_STATE' && targetState !== currentState) {
        logDebug(componentLogSource, 'Dispatch_TargetSet', `Event ${event.type} from ${currentState} targeting ${targetState}.`);
        setTargetUiMenuDisplayState(targetState);
    } else {
        setTargetUiMenuDisplayState(null); // Clear target if no menu state change or not a menu event
    }
    dispatch(event);
  }, [state.uiMenuState, logDebug]);

  useEffect(() => {
    if (targetUiMenuDisplayState !== null && state.uiMenuState === targetUiMenuDisplayState) {
        logDebug(componentLogSource, 'Effect_TargetReached', `DebugConsole FSM state changed to ${state.uiMenuState}. Clearing target display state.`);
        setTargetUiMenuDisplayState(null);
    }
  }, [state.uiMenuState, targetUiMenuDisplayState, logDebug]);


  const contextValue: DebugConsoleFsmContextType = {
    uiMenuState: state.uiMenuState,
    previousUiMenuState: state.previousUiMenuState,
    targetUiMenuDisplayState,
    activeFilters: state.activeFilters,
    searchTerm: state.searchTerm,
    dispatchDebugConsoleFsmEvent: dispatchDebugConsoleFsmEventWithTarget,
  };

  return (
    <DebugConsoleFsmContext.Provider value={contextValue}>
      {children}
    </DebugConsoleFsmContext.Provider>
  );
}

export function useDebugConsoleFsm() {
  const context = useContext(DebugConsoleFsmContext);
  if (context === undefined) {
    throw new Error('useDebugConsoleFsm must be used within a DebugConsoleFsmProvider');
  }
  return context;
}

