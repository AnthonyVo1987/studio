/**
 * @fileoverview High-Level Macro Execution React Hook
 * 
 * Provides a simplified, high-level interface for macro automation workflows
 * that integrates with existing StockSage architecture and patterns.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useXStateMachine, useMacroExecutionMachine } from './use-xstate-machine';
import { useMacroExecutionActor } from './use-xstate-actor';
import type { SupportedTicker } from '@/lib/xstate/actors';
import type { MacroExecutionContext, MacroStep, MacroStepConfig, toStepId } from '@/lib/xstate/types/macro-types';
import { globalLogger } from '@/lib/xstate';

// Import existing StockSage types for compatibility
interface StockSageContext {
  stockSnapshotJson: string;
  optionsChainJson: string;
  aiKeyTakeawaysJson: string;
  aiOptionsRecommendationsJson: string;
  // ... other 75 fields
}

export interface MacroExecutionConfig {
  /** Ticker symbol for execution */
  ticker: SupportedTicker;
  /** StockSage context hooks for integration */
  contextHooks: {
    useAnalysis: () => StockSageContext;
    dispatch: (action: any) => void;
  };
  /** Execution options */
  options?: {
    autoStart?: boolean;
    debugMode?: boolean;
    timeout?: number;
    maxRetries?: number;
    enableProgressUpdates?: boolean;
    enableErrorRecovery?: boolean;
  };
  /** Lifecycle callbacks */
  callbacks?: {
    onStart?: () => void;
    onComplete?: (results: MacroExecutionResults) => void;
    onError?: (error: Error, context?: any) => void;
    onProgress?: (progress: MacroProgress) => void;
    onStepComplete?: (step: MacroStep, result: any) => void;
    onStepError?: (step: MacroStep, error: Error) => void;
  };
}

export interface MacroProgress {
  currentStep: MacroStep;
  totalSteps: number;
  completedSteps: number;
  stepProgress: number; // 0-1 for current step
  overallProgress: number; // 0-1 for entire macro
  estimatedTimeRemaining?: number;
  stepResults: Record<string, any>;
  errors: Array<{ step: MacroStep; error: Error; timestamp: number }>;
}

export interface MacroExecutionResults {
  success: boolean;
  completedAt: number;
  executionTime: number;
  stepResults: {
    fetchExpirations: any;
    getStockData: any;
    generateAITakeaways: any;
    generateAIOptions: any;
  };
  contextUpdates: {
    stockSnapshotJson?: string;
    optionsChainJson?: string;
    aiKeyTakeawaysJson?: string;
    aiOptionsRecommendationsJson?: string;
  };
  metadata: {
    ticker: SupportedTicker;
    startedAt: number;
    stepCount: number;
    retryCount: number;
  };
}

export interface MacroExecutionState {
  /** Current execution status */
  status: 'idle' | 'starting' | 'executing' | 'completed' | 'failed' | 'cancelled';
  /** Current step being executed */
  currentStep?: MacroStep;
  /** Execution progress information */
  progress: MacroProgress;
  /** Final results (if completed) */
  results?: MacroExecutionResults;
  /** Error information (if failed) */
  error?: {
    message: string;
    step?: MacroStep;
    code?: string;
    details?: any;
  };
  /** Execution metadata */
  meta: {
    executionId: string;
    ticker: SupportedTicker;
    startedAt?: number;
    completedAt?: number;
    isRunning: boolean;
    canRetry: boolean;
    hasErrors: boolean;
  };
}

export interface MacroExecutionControls {
  /** Start macro execution */
  start: () => Promise<void>;
  /** Cancel running execution */
  cancel: (reason?: string) => Promise<void>;
  /** Retry failed execution */
  retry: () => Promise<void>;
  /** Reset to initial state */
  reset: () => void;
  /** Pause execution (if supported) */
  pause: () => Promise<void>;
  /** Resume paused execution */
  resume: () => Promise<void>;
  /** Select expiration date */
  selectExpiration: (expiration: string) => void;
  /** Force step completion */
  forceStepCompletion: (step: MacroStep) => void;
  /** Skip current step */
  skipStep: (reason?: string) => void;
}

export interface UseMacroExecutionResult {
  /** Current execution state */
  state: MacroExecutionState;
  /** Execution controls */
  controls: MacroExecutionControls;
  /** StockSage context integration */
  context: {
    /** Current StockSage context data */
    data: StockSageContext;
    /** Update context with macro results */
    updateFromResults: (results: MacroExecutionResults) => void;
    /** Check if context has required data */
    hasRequiredData: () => boolean;
    /** Get context validation errors */
    getValidationErrors: () => string[];
  };
  /** Debug and monitoring utilities */
  debug: {
    /** Log current state */
    logState: () => void;
    /** Export execution diagnostics */
    exportDiagnostics: () => any;
    /** Get performance metrics */
    getMetrics: () => any;
    /** Enable/disable debug mode */
    setDebugMode: (enabled: boolean) => void;
  };
}

/**
 * High-level macro execution hook with StockSage integration
 */
export function useMacroExecution(config: MacroExecutionConfig): UseMacroExecutionResult {
  const {
    ticker,
    contextHooks,
    options = {},
    callbacks = {},
  } = config;

  const {
    autoStart = false,
    debugMode = process.env.NODE_ENV === 'development',
    timeout = 45000,
    maxRetries = 2,
    enableProgressUpdates = true,
    enableErrorRecovery = true,
  } = options;

  // StockSage context integration
  const stockSageContext = contextHooks.useAnalysis();
  const dispatch = contextHooks.dispatch;

  // Execution state
  const [executionId] = useState(() => `macro-${ticker}-${Date.now()}`);
  const [status, setStatus] = useState<MacroExecutionState['status']>('idle');
  const [currentStep, setCurrentStep] = useState<MacroStep | undefined>();
  const [results, setResults] = useState<MacroExecutionResults | undefined>();
  const [error, setError] = useState<MacroExecutionState['error'] | undefined>();
  
  // Progress tracking
  const [progress, setProgress] = useState<MacroProgress>({
    currentStep: 'fetchExpirations' as MacroStep,
    totalSteps: 4,
    completedSteps: 0,
    stepProgress: 0,
    overallProgress: 0,
    stepResults: {},
    errors: [],
  });

  // Performance tracking
  const performanceRef = useRef({
    startedAt: 0,
    stepTimes: {} as Record<string, number>,
    retryCount: 0,
  });

  // XState machine integration
  const machineResult = useMacroExecutionMachine(ticker, {
    debugMode,
    autoStart: false, // We control start manually
    onStateChange: useCallback((state: any) => {
      const machineStatus = state.value;
      const context = state.context as MacroExecutionContext;

      // Map machine state to our status
      if (typeof machineStatus === 'string') {
        switch (machineStatus) {
          case 'idle':
            setStatus('idle');
            break;
          case 'executing':
            setStatus('executing');
            break;
          case 'completed':
            setStatus('completed');
            break;
          case 'failed':
            setStatus('failed');
            break;
          default:
            setStatus('idle');
        }
      } else if (typeof machineStatus === 'object' && machineStatus.executing) {
        setStatus('executing');
        setCurrentStep(machineStatus.executing as MacroStep);
      }

      // Update progress from machine context
      if (enableProgressUpdates) {
        updateProgressFromContext(context);
      }

      // Handle completion
      if (machineStatus === 'completed' && context.stepResults) {
        handleMacroCompletion(context);
      }

      // Handle errors
      if (machineStatus === 'failed' && context.error) {
        handleMacroError(context.error, context.currentStep);
      }

    }, [enableProgressUpdates, ticker]),

    onError: useCallback((error: Error) => {
      callbacks.onError?.(error);
      setError({
        message: error.message,
        step: currentStep,
        code: 'MACHINE_ERROR',
        details: error,
      });
      setStatus('failed');
    }, [callbacks, currentStep]),
  });

  // Update progress from machine context
  const updateProgressFromContext = useCallback((context: MacroExecutionContext) => {
    const newProgress: MacroProgress = {
      currentStep: context.currentStep || ('fetchExpirations' as MacroStep),
      totalSteps: 4,
      completedSteps: context.stepResults ? context.stepResults.size : 0,
      stepProgress: context.progress?.stepProgress || 0,
      overallProgress: context.progress?.overallProgress || 0,
      stepResults: context.stepResults ? Object.fromEntries(context.stepResults) : {},
      errors: progress.errors, // Preserve existing errors
    };

    // Add new errors if any
    if (context.error) {
      newProgress.errors = [
        ...progress.errors,
        {
          step: context.currentStep || ('fetchExpirations' as MacroStep),
          error: context.error,
          timestamp: Date.now(),
        },
      ];
    }

    setProgress(newProgress);
    callbacks.onProgress?.(newProgress);
  }, [progress.errors, callbacks]);

  // Handle macro completion
  const handleMacroCompletion = useCallback((context: MacroExecutionContext) => {
    const completedAt = Date.now();
    const executionTime = completedAt - performanceRef.current.startedAt;

    const macroResults: MacroExecutionResults = {
      success: true,
      completedAt,
      executionTime,
      stepResults: {
        fetchExpirations: context.stepResults?.get('fetchExpirations') || context.stepResults?.get(1),
        getStockData: context.stepResults?.get('getStockData') || context.stepResults?.get(2),
        generateAITakeaways: context.stepResults?.get('generateAITakeaways') || context.stepResults?.get(3),
        generateAIOptions: context.stepResults?.get('generateAIOptions') || context.stepResults?.get(4),
      },
      contextUpdates: extractContextUpdates(context.stepResults),
      metadata: {
        ticker,
        startedAt: performanceRef.current.startedAt,
        stepCount: 4,
        retryCount: performanceRef.current.retryCount,
      },
    };

    setResults(macroResults);
    
    // Update StockSage context with results
    updateStockSageContext(macroResults.contextUpdates);
    
    callbacks.onComplete?.(macroResults);
  }, [ticker, callbacks]);

  // Handle macro errors
  const handleMacroError = useCallback((error: Error, step?: MacroStep) => {
    setError({
      message: error.message,
      step,
      code: 'EXECUTION_ERROR',
      details: error,
    });
    
    callbacks.onError?.(error, { step, ticker, executionId });
  }, [callbacks, ticker, executionId]);

  // Extract context updates from step results
  const extractContextUpdates = useCallback((stepResults: Map<MacroStep, any> | undefined) => {
    const updates: MacroExecutionResults['contextUpdates'] = {};
    
    if (!stepResults) return updates;
    
    const getStockDataResult = stepResults.get('getStockData') || stepResults.get(2);
    if (getStockDataResult?.stockSnapshotJson) {
      updates.stockSnapshotJson = getStockDataResult.stockSnapshotJson;
    }
    
    if (getStockDataResult?.optionsChainJson) {
      updates.optionsChainJson = getStockDataResult.optionsChainJson;
    }
    
    const aiTakeawaysResult = stepResults.get('generateAITakeaways') || stepResults.get(3);
    if (aiTakeawaysResult?.aiKeyTakeawaysJson) {
      updates.aiKeyTakeawaysJson = aiTakeawaysResult.aiKeyTakeawaysJson;
    }
    
    const aiOptionsResult = stepResults.get('generateAIOptions') || stepResults.get(4);
    if (aiOptionsResult?.aiOptionsRecommendationsJson) {
      updates.aiOptionsRecommendationsJson = aiOptionsResult.aiOptionsRecommendationsJson;
    }
    
    return updates;
  }, []);

  // Update StockSage context with macro results
  const updateStockSageContext = useCallback((updates: MacroExecutionResults['contextUpdates']) => {
    if (updates.stockSnapshotJson) {
      dispatch({ type: 'SET_STOCK_SNAPSHOT_JSON', payload: { stockSnapshotJson: updates.stockSnapshotJson } });
    }
    
    if (updates.optionsChainJson) {
      dispatch({ type: 'SET_OPTIONS_CHAIN_JSON', payload: { optionsChainJson: updates.optionsChainJson } });
    }
    
    if (updates.aiKeyTakeawaysJson) {
      dispatch({ type: 'SET_AI_KEY_TAKEAWAYS_JSON', payload: { aiKeyTakeawaysJson: updates.aiKeyTakeawaysJson } });
    }
    
    if (updates.aiOptionsRecommendationsJson) {
      dispatch({ type: 'SET_AI_OPTIONS_RECOMMENDATIONS_JSON', payload: { aiOptionsRecommendationsJson: updates.aiOptionsRecommendationsJson } });
    }
  }, [dispatch]);

  // Execution controls
  const controls = useMemo<MacroExecutionControls>(() => ({
    start: async () => {
      setStatus('starting');
      setError(undefined);
      setResults(undefined);
      performanceRef.current.startedAt = Date.now();
      performanceRef.current.retryCount = 0;
      
      callbacks.onStart?.();
      
      try {
        await machineResult.startExecution();
      } catch (error) {
        handleMacroError(error as Error);
      }
    },

    cancel: async (reason = 'User cancelled') => {
      machineResult.cancelExecution(reason);
      setStatus('cancelled');
    },

    retry: async () => {
      if (results?.success || status === 'executing') return;
      
      performanceRef.current.retryCount++;
      setError(undefined);
      
      try {
        machineResult.resetExecution();
        await machineResult.startExecution();
      } catch (error) {
        handleMacroError(error as Error);
      }
    },

    reset: () => {
      machineResult.resetExecution();
      setStatus('idle');
      setCurrentStep(undefined);
      setResults(undefined);
      setError(undefined);
      setProgress({
        currentStep: 'fetchExpirations' as MacroStep,
        totalSteps: 4,
        completedSteps: 0,
        stepProgress: 0,
        overallProgress: 0,
        stepResults: {},
        errors: [],
      });
    },

    pause: async () => {
      // Implementation depends on machine support for pausing
      globalLogger.warn('Pause functionality not yet implemented');
    },

    resume: async () => {
      // Implementation depends on machine support for resuming
      globalLogger.warn('Resume functionality not yet implemented');
    },

    selectExpiration: (expiration: string) => {
      machineResult.selectExpiration(expiration);
    },

    forceStepCompletion: (step: MacroStep) => {
      // Implementation for forcing step completion
      globalLogger.warn('Force step completion not yet implemented', { step });
    },

    skipStep: (reason = 'User requested skip') => {
      // Implementation for skipping steps
      globalLogger.warn('Skip step not yet implemented', { currentStep, reason });
    },
  }), [machineResult, results, status, currentStep, callbacks, handleMacroError]);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart && status === 'idle') {
      controls.start();
    }
  }, [autoStart, status]); // Don't include controls to avoid infinite loop

  // State object
  const state = useMemo<MacroExecutionState>(() => ({
    status,
    currentStep,
    progress,
    results,
    error,
    meta: {
      executionId,
      ticker,
      startedAt: performanceRef.current.startedAt,
      completedAt: results?.completedAt,
      isRunning: status === 'starting' || status === 'executing',
      canRetry: status === 'failed' && enableErrorRecovery,
      hasErrors: Boolean(error) || progress.errors.length > 0,
    },
  }), [status, currentStep, progress, results, error, executionId, ticker, enableErrorRecovery]);

  // Context integration
  const context = useMemo(() => ({
    data: stockSageContext,
    
    updateFromResults: (results: MacroExecutionResults) => {
      updateStockSageContext(results.contextUpdates);
    },
    
    hasRequiredData: () => {
      // Check if StockSage context has minimum required data
      return Boolean(stockSageContext.stockSnapshotJson || stockSageContext.optionsChainJson);
    },
    
    getValidationErrors: () => {
      const errors: string[] = [];
      if (!stockSageContext.stockSnapshotJson) {
        errors.push('Missing stock snapshot data');
      }
      // Add other validation checks as needed
      return errors;
    },
  }), [stockSageContext, updateStockSageContext]);

  // Debug utilities
  const debug = useMemo(() => ({
    logState: () => {
      console.group(`🎯 Macro Execution State - ${ticker}`);
      console.log('Status:', status);
      console.log('Current Step:', currentStep);
      console.log('Progress:', progress);
      console.log('Results:', results);
      console.log('Error:', error);
      console.log('Meta:', state.meta);
      console.groupEnd();
    },

    exportDiagnostics: () => ({
      executionId,
      ticker,
      state,
      machineState: machineResult.state.value,
      machineContext: machineResult.context,
      performance: performanceRef.current,
      timestamp: Date.now(),
    }),

    getMetrics: () => machineResult.debug.getPerformanceMetrics(),

    setDebugMode: (enabled: boolean) => {
      if (enabled) {
        globalLogger.info('Debug mode enabled for macro execution:', executionId);
      }
      // This would update machine debug mode
    },
  }), [status, currentStep, progress, results, error, state, executionId, ticker, machineResult]);

  return {
    state,
    controls,
    context,
    debug,
  };
}

/**
 * Simplified hook for basic macro execution without advanced features
 */
export function useSimpleMacroExecution(
  ticker: SupportedTicker,
  contextHooks: MacroExecutionConfig['contextHooks']
) {
  const result = useMacroExecution({
    ticker,
    contextHooks,
    options: {
      autoStart: false,
      debugMode: false,
      enableProgressUpdates: true,
      enableErrorRecovery: true,
    },
  });

  return {
    // Simplified interface
    isRunning: result.state.meta.isRunning,
    isCompleted: result.state.status === 'completed',
    hasError: result.state.meta.hasErrors,
    progress: result.state.progress.overallProgress,
    currentStep: result.state.currentStep,
    
    // Simple controls
    start: result.controls.start,
    cancel: result.controls.cancel,
    retry: result.controls.retry,
    
    // Results
    results: result.state.results,
    error: result.state.error,
  };
}