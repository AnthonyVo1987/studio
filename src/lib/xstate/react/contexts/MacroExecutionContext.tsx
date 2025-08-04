/**
 * @fileoverview Macro Execution React Context Provider
 * 
 * Provides specialized React context for macro execution state sharing,
 * progress tracking, and result management across components.
 */

'use client';

import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useXStateSystem } from './XStateContext';
import { useMacroExecution, type MacroExecutionConfig, type MacroExecutionState, type MacroExecutionResults } from '../hooks/use-macro-execution';
import type { SupportedTicker } from '@/lib/xstate/actors';
import type { MacroStep } from '@/lib/xstate';
import { MacroStepName } from '../components/MacroProgressIndicator';
import { globalLogger } from '@/lib/xstate';

// Macro execution context state
export interface MacroExecutionContextState {
  /** Active macro executions by ticker */
  executions: Record<SupportedTicker, MacroExecutionState>;
  /** Shared execution results */
  results: Record<SupportedTicker, MacroExecutionResults>;
  /** Global execution status */
  globalStatus: {
    activeExecutions: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    lastExecutionAt?: number;
  };
  /** Shared configuration */
  config: {
    enableParallelExecution: boolean;
    maxConcurrentExecutions: number;
    globalTimeout: number;
    enableResultCaching: boolean;
  };
}

// Context actions
export type MacroExecutionContextAction =
  | { type: 'REGISTER_EXECUTION'; payload: { ticker: SupportedTicker; state: MacroExecutionState } }
  | { type: 'UPDATE_EXECUTION'; payload: { ticker: SupportedTicker; state: MacroExecutionState } }
  | { type: 'COMPLETE_EXECUTION'; payload: { ticker: SupportedTicker; results: MacroExecutionResults } }
  | { type: 'REMOVE_EXECUTION'; payload: { ticker: SupportedTicker } }
  | { type: 'UPDATE_CONFIG'; payload: Partial<MacroExecutionContextState['config']> }
  | { type: 'RESET_ALL' };

// Context value interface
export interface MacroExecutionContextValue {
  /** Current state */
  state: MacroExecutionContextState;
  /** Dispatch actions */
  dispatch: React.Dispatch<MacroExecutionContextAction>;
  /** Execution management */
  execution: {
    /** Register a new execution */
    register: (ticker: SupportedTicker, state: MacroExecutionState) => void;
    /** Update execution state */
    update: (ticker: SupportedTicker, state: MacroExecutionState) => void;
    /** Mark execution as completed */
    complete: (ticker: SupportedTicker, results: MacroExecutionResults) => void;
    /** Remove execution */
    remove: (ticker: SupportedTicker) => void;
    /** Get execution state for ticker */
    get: (ticker: SupportedTicker) => MacroExecutionState | undefined;
    /** Check if ticker has active execution */
    isActive: (ticker: SupportedTicker) => boolean;
    /** Get all active executions */
    getActive: () => Array<{ ticker: SupportedTicker; state: MacroExecutionState }>;
  };
  /** Results management */
  results: {
    /** Get results for ticker */
    get: (ticker: SupportedTicker) => MacroExecutionResults | undefined;
    /** Check if ticker has cached results */
    has: (ticker: SupportedTicker) => boolean;
    /** Clear results for ticker */
    clear: (ticker: SupportedTicker) => void;
    /** Get all results */
    getAll: () => Record<SupportedTicker, MacroExecutionResults>;
  };
  /** Configuration management */
  config: {
    /** Update configuration */
    update: (config: Partial<MacroExecutionContextState['config']>) => void;
    /** Get current configuration */
    get: () => MacroExecutionContextState['config'];
  };
  /** Utilities */
  utils: {
    /** Reset entire context */
    reset: () => void;
    /** Get context statistics */
    getStats: () => MacroExecutionContextState['globalStatus'];
    /** Export context state */
    export: () => any;
  };
}

// Helper function to create default execution state
const createDefaultExecutionState = (): MacroExecutionState => ({
  status: 'idle',
  progress: {
    currentStep: 'fetchExpirations' as any, // MacroStep type compatibility
    totalSteps: 4,
    completedSteps: 0,
    overallProgress: 0,
    stepProgress: 0,
    stepResults: {},
    errors: [],
  },
  meta: {
    executionId: crypto.randomUUID(),
    ticker: 'NVDA' as SupportedTicker,
    startedAt: undefined,
    completedAt: undefined,
    isRunning: false,
    canRetry: true,
    hasErrors: false,
  },
  error: undefined,
});

// Helper function to create default execution results
const createDefaultExecutionResults = (): MacroExecutionResults => ({
  success: false,
  completedAt: 0,
  executionTime: 0,
  stepResults: {
    fetchExpirations: null,
    getStockData: null,
    generateAITakeaways: null,
    generateAIOptions: null,
  },
  contextUpdates: {},
  metadata: {
    ticker: 'NVDA' as SupportedTicker,
    startedAt: Date.now(),
    stepCount: 4,
    retryCount: 0,
  },
});

// Initial state
const initialState: MacroExecutionContextState = {
  executions: {
    NVDA: createDefaultExecutionState(),
    SPY: createDefaultExecutionState(),
  },
  results: {
    NVDA: createDefaultExecutionResults(),
    SPY: createDefaultExecutionResults(),
  },
  globalStatus: {
    activeExecutions: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
  },
  config: {
    enableParallelExecution: true,
    maxConcurrentExecutions: 3,
    globalTimeout: 45000,
    enableResultCaching: true,
  },
};

// Reducer function
function macroExecutionReducer(
  state: MacroExecutionContextState,
  action: MacroExecutionContextAction
): MacroExecutionContextState {
  switch (action.type) {
    case 'REGISTER_EXECUTION': {
      const { ticker, state: executionState } = action.payload;
      return {
        ...state,
        executions: {
          ...state.executions,
          [ticker]: executionState,
        },
        globalStatus: {
          ...state.globalStatus,
          activeExecutions: state.globalStatus.activeExecutions + 1,
          totalExecutions: state.globalStatus.totalExecutions + 1,
          lastExecutionAt: Date.now(),
        },
      };
    }

    case 'UPDATE_EXECUTION': {
      const { ticker, state: executionState } = action.payload;
      return {
        ...state,
        executions: {
          ...state.executions,
          [ticker]: executionState,
        },
      };
    }

    case 'COMPLETE_EXECUTION': {
      const { ticker, results } = action.payload;
      const currentExecution = state.executions[ticker];
      const wasActive = currentExecution?.meta.isRunning || false;
      
      return {
        ...state,
        executions: {
          ...state.executions,
          [ticker]: {
            ...currentExecution,
            status: results.success ? 'completed' : 'failed',
            results,
            meta: {
              ...currentExecution?.meta,
              isRunning: false,
              completedAt: results.completedAt,
            },
          } as MacroExecutionState,
        },
        results: state.config.enableResultCaching ? {
          ...state.results,
          [ticker]: results,
        } : state.results,
        globalStatus: {
          ...state.globalStatus,
          activeExecutions: wasActive 
            ? Math.max(0, state.globalStatus.activeExecutions - 1)
            : state.globalStatus.activeExecutions,
          successfulExecutions: results.success 
            ? state.globalStatus.successfulExecutions + 1
            : state.globalStatus.successfulExecutions,
          failedExecutions: !results.success 
            ? state.globalStatus.failedExecutions + 1
            : state.globalStatus.failedExecutions,
        },
      };
    }

    case 'REMOVE_EXECUTION': {
      const { ticker } = action.payload;
      const currentExecution = state.executions[ticker];
      const wasActive = currentExecution?.meta.isRunning || false;
      
      const newExecutions = { ...state.executions };
      delete newExecutions[ticker];
      
      return {
        ...state,
        executions: newExecutions,
        globalStatus: {
          ...state.globalStatus,
          activeExecutions: wasActive 
            ? Math.max(0, state.globalStatus.activeExecutions - 1)
            : state.globalStatus.activeExecutions,
        },
      };
    }

    case 'UPDATE_CONFIG': {
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload,
        },
      };
    }

    case 'RESET_ALL': {
      return {
        ...initialState,
        config: state.config, // Preserve configuration
      };
    }

    default:
      return state;
  }
}

// Create context
const MacroExecutionContext = createContext<MacroExecutionContextValue | null>(null);

// Provider props
export interface MacroExecutionProviderProps {
  children: ReactNode;
  config?: Partial<MacroExecutionContextState['config']>;
}

/**
 * Macro execution context provider
 */
export function MacroExecutionProvider({ children, config = {} }: MacroExecutionProviderProps) {
  const [state, dispatch] = useReducer(macroExecutionReducer, {
    ...initialState,
    config: { ...initialState.config, ...config },
  });

  const xstateSystem = useXStateSystem();

  // Execution management functions
  const execution = useMemo(() => ({
    register: (ticker: SupportedTicker, executionState: MacroExecutionState) => {
      dispatch({ type: 'REGISTER_EXECUTION', payload: { ticker, state: executionState } });
    },

    update: (ticker: SupportedTicker, executionState: MacroExecutionState) => {
      dispatch({ type: 'UPDATE_EXECUTION', payload: { ticker, state: executionState } });
    },

    complete: (ticker: SupportedTicker, results: MacroExecutionResults) => {
      dispatch({ type: 'COMPLETE_EXECUTION', payload: { ticker, results } });
    },

    remove: (ticker: SupportedTicker) => {
      dispatch({ type: 'REMOVE_EXECUTION', payload: { ticker } });
    },

    get: (ticker: SupportedTicker) => state.executions[ticker],

    isActive: (ticker: SupportedTicker) => {
      const execution = state.executions[ticker];
      return execution?.meta.isRunning || false;
    },

    getActive: () => {
      return Object.entries(state.executions)
        .filter(([_, executionState]) => executionState.meta.isRunning)
        .map(([ticker, executionState]) => ({ 
          ticker: ticker as SupportedTicker, 
          state: executionState 
        }));
    },
  }), [state.executions]);

  // Results management functions
  const results = useMemo(() => ({
    get: (ticker: SupportedTicker) => state.results[ticker],

    has: (ticker: SupportedTicker) => Boolean(state.results[ticker]),

    clear: (ticker: SupportedTicker) => {
      const newResults = { ...state.results };
      delete newResults[ticker];
      // We can't directly update results here, so we would dispatch an action
      // For now, we'll use the execution removal which clears associated data
      globalLogger.warn('Direct result clearing not implemented, use execution.remove instead');
    },

    getAll: () => state.results,
  }), [state.results]);

  // Configuration management
  const configManagement = useMemo(() => ({
    update: (newConfig: Partial<MacroExecutionContextState['config']>) => {
      dispatch({ type: 'UPDATE_CONFIG', payload: newConfig });
    },

    get: () => state.config,
  }), [state.config]);

  // Utility functions
  const utils = useMemo(() => ({
    reset: () => {
      dispatch({ type: 'RESET_ALL' });
    },

    getStats: () => state.globalStatus,

    export: () => ({
      state,
      timestamp: Date.now(),
      systemInfo: {
        nodeEnv: process.env.NODE_ENV,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      },
      xstateSystemStatus: xstateSystem.status,
    }),
  }), [state, xstateSystem.status]);

  // Context value
  const contextValue = useMemo<MacroExecutionContextValue>(() => ({
    state,
    dispatch,
    execution,
    results,
    config: configManagement,
    utils,
  }), [state, execution, results, configManagement, utils]);

  return (
    <MacroExecutionContext.Provider value={contextValue}>
      {children}
    </MacroExecutionContext.Provider>
  );
}

/**
 * Hook to access macro execution context
 */
export function useMacroExecutionContext(): MacroExecutionContextValue {
  const context = useContext(MacroExecutionContext);
  if (!context) {
    throw new Error('useMacroExecutionContext must be used within a MacroExecutionProvider');
  }
  return context;
}

/**
 * Hook to manage execution for a specific ticker
 */
export function useTickerExecution(ticker: SupportedTicker) {
  const context = useMacroExecutionContext();
  
  return {
    state: context.execution.get(ticker),
    results: context.results.get(ticker),
    isActive: context.execution.isActive(ticker),
    
    // Ticker-specific operations
    register: (state: MacroExecutionState) => context.execution.register(ticker, state),
    update: (state: MacroExecutionState) => context.execution.update(ticker, state),
    complete: (results: MacroExecutionResults) => context.execution.complete(ticker, results),
    remove: () => context.execution.remove(ticker),
  };
}

/**
 * Hook to monitor global execution status
 */
export function useGlobalExecutionStatus() {
  const { state, utils } = useMacroExecutionContext();
  
  return {
    status: state.globalStatus,
    activeExecutions: utils.getStats().activeExecutions,
    totalExecutions: utils.getStats().totalExecutions,
    successRate: utils.getStats().totalExecutions > 0 
      ? (utils.getStats().successfulExecutions / utils.getStats().totalExecutions) * 100
      : 0,
    activeExecutionList: Object.entries(state.executions)
      .filter(([_, execution]) => execution.meta.isRunning)
      .map(([ticker, execution]) => ({ ticker: ticker as SupportedTicker, execution })),
  };
}

/**
 * Hook for managing execution configuration
 */
export function useExecutionConfig() {
  const { config } = useMacroExecutionContext();
  
  return {
    config: config.get(),
    update: config.update,
    
    // Configuration presets
    setOptimizedForSpeed: () => config.update({
      enableParallelExecution: true,
      maxConcurrentExecutions: 5,
      globalTimeout: 30000,
    }),
    
    setOptimizedForReliability: () => config.update({
      enableParallelExecution: false,
      maxConcurrentExecutions: 1,
      globalTimeout: 60000,
    }),
    
    setDefault: () => config.update({
      enableParallelExecution: true,
      maxConcurrentExecutions: 3,
      globalTimeout: 45000,
    }),
  };
}

/**
 * Hook that integrates macro execution context with the useMacroExecution hook
 */
export function useContextualMacroExecution(
  ticker: SupportedTicker,
  contextHooks: MacroExecutionConfig['contextHooks'],
  options?: Partial<MacroExecutionConfig['options']>,
  callbacks?: MacroExecutionConfig['callbacks']
) {
  const executionContext = useTickerExecution(ticker);
  const { config } = useMacroExecutionContext();
  
  // Create macro execution with context integration
  const macroExecution = useMacroExecution({
    ticker,
    contextHooks,
    options: {
      ...options,
      timeout: options?.timeout || config.get().globalTimeout,
    },
    callbacks: {
      ...callbacks?.onStart && { onStart: callbacks.onStart },
      onComplete: (results) => {
        executionContext.complete(results);
        callbacks?.onComplete?.(results);
      },
      onError: (error, context) => {
        callbacks?.onError?.(error, context);
      },
      onProgress: (progress) => {
        executionContext.update({
          ...macroExecution.state,
          progress,
        });
        callbacks?.onProgress?.(progress);
      },
    },
  });

  // Register execution when it starts
  useEffect(() => {
    if (macroExecution.state.status !== 'idle' && !executionContext.state) {
      executionContext.register(macroExecution.state);
    }
  }, [macroExecution.state.status]);

  // Update execution state
  useEffect(() => {
    if (executionContext.state) {
      executionContext.update(macroExecution.state);
    }
  }, [macroExecution.state]);

  return {
    ...macroExecution,
    // Add context-specific utilities
    contextState: executionContext.state,
    contextResults: executionContext.results,
    isRegistered: Boolean(executionContext.state),
  };
}

/**
 * Default export for convenience
 */
export default MacroExecutionProvider;