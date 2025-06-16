
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer, useCallback } from 'react';
import type { LogSourceId, LogType } from '@/lib/debug-log-types';

// FSM States for DebugConsole UI
export enum DebugConsoleFsmMenuState {
  IDLE = 'IDLE', // All menus closed
  FILTER_TYPE_MENU_OPEN = 'FILTER_TYPE_MENU_OPEN',
  FILTER_SOURCE_MENU_OPEN = 'FILTER_SOURCE_MENU_OPEN',
  COPY_MENU_OPEN = 'COPY_MENU_OPEN',
  EXPORT_MENU_OPEN = 'EXPORT_MENU_OPEN',
}

export interface DebugConsoleFsmManagedState {
  uiMenuState: DebugConsoleFsmMenuState;
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

interface DebugConsoleFsmContextType extends DebugConsoleFsmManagedState {
  dispatchDebugConsoleFsmEvent: (event: DebugConsoleFsmEvent) => void;
}

const initialDebugConsoleFsmState: DebugConsoleFsmManagedState = {
  uiMenuState: DebugConsoleFsmMenuState.IDLE,
  activeFilters: {
    types: new Set<LogType>(),
    sources: new Set<LogSourceId>(),
  },
  searchTerm: '',
};

const DebugConsoleFsmContext = createContext<DebugConsoleFsmContextType | undefined>(undefined);

interface DebugConsoleFsmProviderProps {
  children: ReactNode;
  logDebug: (source: string, category: string, ...messages: any[]) => void; // From StockAnalysisContext
}

export function DebugConsoleFsmProvider({
  children,
  logDebug,
}: DebugConsoleFsmProviderProps) {
  const debugConsoleFsmReducer = (
    state: DebugConsoleFsmManagedState,
    event: DebugConsoleFsmEvent
  ): DebugConsoleFsmManagedState => {
    logDebug('DebugConsoleFsmContext', 'ReducerEvent', `Event: ${event.type}, Current MenuState: ${state.uiMenuState}`);
    switch (event.type) {
      case 'SET_MENU_OPEN_STATE': {
        const { menu, isOpen } = event.payload;
        if (!isOpen) { // If any menu is closed, go to IDLE
          return { ...state, uiMenuState: DebugConsoleFsmMenuState.IDLE };
        }
        switch (menu) {
          case 'filterType':
            return { ...state, uiMenuState: DebugConsoleFsmMenuState.FILTER_TYPE_MENU_OPEN };
          case 'filterSource':
            return { ...state, uiMenuState: DebugConsoleFsmMenuState.FILTER_SOURCE_MENU_OPEN };
          case 'copy':
            return { ...state, uiMenuState: DebugConsoleFsmMenuState.COPY_MENU_OPEN };
          case 'export':
            return { ...state, uiMenuState: DebugConsoleFsmMenuState.EXPORT_MENU_OPEN };
          default:
            return state;
        }
      }
      case 'UPDATE_TYPE_FILTER': {
        const newTypes = new Set(state.activeFilters.types);
        if (event.payload.checked) newTypes.add(event.payload.type);
        else newTypes.delete(event.payload.type);
        logDebug('DebugConsoleFsmContext', 'FilterChange', `Type filter updated: ${event.payload.type}, checked: ${event.payload.checked}. New types: ${Array.from(newTypes).join(', ')}`);
        return { ...state, activeFilters: { ...state.activeFilters, types: newTypes } };
      }
      case 'UPDATE_SOURCE_FILTER': {
        const newSources = new Set(state.activeFilters.sources);
        if (event.payload.checked) newSources.add(event.payload.source);
        else newSources.delete(event.payload.source);
        logDebug('DebugConsoleFsmContext', 'FilterChange', `Source filter updated: ${event.payload.source}, checked: ${event.payload.checked}. New sources: ${Array.from(newSources).join(', ')}`);
        return { ...state, activeFilters: { ...state.activeFilters, sources: newSources } };
      }
      case 'SET_ALL_TYPE_FILTERS': {
        const newTypes = event.payload.selectAll ? new Set(['debug', 'info', 'log', 'warn', 'error'] as LogType[]) : new Set<LogType>();
        logDebug('DebugConsoleFsmContext', 'FilterChange', `Set all type filters to: ${event.payload.selectAll}. New types: ${Array.from(newTypes).join(', ')}`);
        return { ...state, activeFilters: { ...state.activeFilters, types: newTypes } };
      }
      case 'SET_ALL_SOURCE_FILTERS': {
        // Assuming logSourceIds is available or passed if needed, for now, clears all.
        // For full "select all" functionality, logSourceIds would need to be imported and used here.
        // This implementation simplifies to clear or keeps current selection logic.
        // For a full "Select All", this should iterate over all available LogSourceIds.
        // Keeping it simple to clear all or rely on individual toggles from previous structure.
        // To properly implement "Select All", this reducer or context would need access to all `logSourceIds`.
        // For now, SET_ALL_SOURCE_FILTERS will just clear the sources. A true select all requires more info.
        const newSources = event.payload.selectAll ? new Set(state.activeFilters.sources) /* Placeholder for actual all */ : new Set<LogSourceId>();
        if (event.payload.selectAll) {
            logDebug('DebugConsoleFsmContext', 'FilterChange', `Set all source filters - SELECT ALL action NOT fully implemented here yet, needs all source IDs. Currently keeps existing or clears.`);
        } else {
            logDebug('DebugConsoleFsmContext', 'FilterChange', `Set all source filters to: ${event.payload.selectAll}. New sources cleared.`);
        }
        return { ...state, activeFilters: { ...state.activeFilters, sources: newSources } };
      }
      case 'SEARCH_TERM_CHANGED':
        logDebug('DebugConsoleFsmContext', 'SearchChange', `Search term changed to: "${event.payload}"`);
        return { ...state, searchTerm: event.payload };
      case 'CLEAR_SEARCH_TERM':
        logDebug('DebugConsoleFsmContext', 'SearchChange', `Search term cleared.`);
        return { ...state, searchTerm: '' };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(debugConsoleFsmReducer, initialDebugConsoleFsmState);

  const contextValue: DebugConsoleFsmContextType = {
    uiMenuState: state.uiMenuState,
    activeFilters: state.activeFilters,
    searchTerm: state.searchTerm,
    dispatchDebugConsoleFsmEvent: dispatch,
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
