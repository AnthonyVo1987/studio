/**
 * @fileoverview Core XState Machine React Hook
 * 
 * Provides seamless integration between XState machines and React components,
 * leveraging the @xstate/react useMachine hook with StockSage-specific optimizations.
 */

import { useActor, useSelector, createActorContext } from '@xstate/react';
import { createActor } from 'xstate';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { AnyStateMachine, AnyActorRef, SnapshotFrom, EventFrom, ContextFrom, StateValueFrom } from 'xstate';
import type { MacroExecutionMachine, MacroExecutionContext } from '@/lib/xstate';
import { globalLogger } from '@/lib/xstate';

export interface XStateMachineOptions<TMachine extends AnyStateMachine> {
  /** Enable debug logging for this machine instance */
  debugMode?: boolean;
  /** Custom actions to override machine actions */
  actions?: Record<string, (...args: any[]) => void>;
  /** Custom guards to override machine guards */
  guards?: Record<string, (...args: any[]) => boolean>;
  /** Custom services to override machine services */
  services?: Record<string, (...args: any[]) => any>;
  /** Initial context override */
  context?: Partial<ContextFrom<TMachine>>;
  /** Lifecycle callbacks */
  onStateChange?: (state: SnapshotFrom<TMachine>) => void;
  onTransition?: (from: SnapshotFrom<TMachine>, to: SnapshotFrom<TMachine>) => void;
  onError?: (error: Error) => void;
  /** Performance optimization flags */
  enableSubscriptionOptimization?: boolean;
  enableMemoization?: boolean;
}

export interface XStateMachineResult<TMachine extends AnyStateMachine> {
  /** Current machine state snapshot */
  state: SnapshotFrom<TMachine>;
  /** Send events to the machine */
  send: (event: EventFrom<TMachine>) => void;
  /** Actor reference for advanced usage */
  actorRef: AnyActorRef;
  /** Machine context data */
  context: ContextFrom<TMachine>;
  /** Current state value */
  stateValue: StateValueFrom<TMachine>;
  /** Check if machine matches specific state pattern */
  matches: (stateValue: StateValueFrom<TMachine>) => boolean;
  /** Check if machine can handle specific event */
  can: (event: EventFrom<TMachine>) => boolean;
  /** Machine metadata */
  meta: {
    machineId: string;
    isStarted: boolean;
    isRunning: boolean;
    hasError: boolean;
    error?: Error;
  };
  /** Performance and debug utilities */
  debug: {
    logState: () => void;
    logContext: () => void;
    logTransitions: (enabled: boolean) => void;
    getPerformanceMetrics: () => {
      transitionCount: number;
      averageTransitionTime: number;
      lastTransitionAt: number;
    };
  };
}

/**
 * Core XState machine hook with React integration optimizations
 */
export function useXStateMachine<TMachine extends AnyStateMachine>(
  machine: TMachine | (() => TMachine),
  options: XStateMachineOptions<TMachine> = {}
): XStateMachineResult<TMachine> {
  const {
    debugMode = process.env.NODE_ENV === 'development',
    actions,
    guards,
    services,
    context,
    onStateChange,
    onTransition,
    onError,
    enableSubscriptionOptimization = true,
    enableMemoization = true,
  } = options;

  // Performance tracking
  const performanceRef = useRef({
    transitionCount: 0,
    transitionTimes: [] as number[],
    lastTransitionAt: 0,
  });

  // Create machine configuration with options
  const machineConfig = useMemo(() => {
    const config: any = {};
    if (actions) config.actions = actions;
    if (guards) config.guards = guards;
    if (services) config.services = services;
    if (context) config.context = context;
    return config;
  }, [actions, guards, services, context]);

  // Initialize machine with XState 5.x useActor pattern
  const machineInstance = useMemo(() => {
    const resolvedMachine = typeof machine === 'function' ? machine() : machine;
    // For XState 5.x, machines are configured differently
    return resolvedMachine.provide({
      actions: {
        ...actions,
        // Add error reporting action
        reportError: (context: any, event: any) => {
          const error = event.data?.error || new Error('Machine error occurred');
          if (debugMode) {
            globalLogger.error('XState Machine Error:', {
              machineId: resolvedMachine.id || 'unknown',
              event: event.type,
              error: error.message,
              context,
            });
          }
          onError?.(error);
        },
      },
      guards: guards || {},
      actors: services || {},
    });
  }, [machine, actions, guards, services, debugMode, onError]);

  const [state, send] = useActor(machineInstance);
  
  // Create actor reference for compatibility - use createActor with the machine
  const actorRef = useMemo(() => {
    return createActor(machineInstance);
  }, [machineInstance]);

  // Track state transitions for performance monitoring
  const previousStateRef = useRef(state);
  useEffect(() => {
    const previousState = previousStateRef.current;
    if (previousState && previousState !== state) {
      // Record transition performance
      const now = Date.now();
      performanceRef.current.transitionCount++;
      performanceRef.current.transitionTimes.push(now - performanceRef.current.lastTransitionAt);
      performanceRef.current.lastTransitionAt = now;

      // Keep only last 100 transition times for average calculation
      if (performanceRef.current.transitionTimes.length > 100) {
        performanceRef.current.transitionTimes = performanceRef.current.transitionTimes.slice(-100);
      }

      // Call lifecycle callbacks
      onTransition?.(previousState, state);
      onStateChange?.(state);

      if (debugMode) {
        globalLogger.debug('XState Transition:', {
          machineId: machineInstance.id || 'unknown',
          from: previousState.value,
          to: state.value,
          transitionCount: performanceRef.current.transitionCount,
        });
      }
    }
    previousStateRef.current = state;
  }, [state, onStateChange, onTransition, debugMode, machineInstance]);

  // Optimized selectors for common state queries
  const contextData = useSelector(actorRef, (state) => state.context);
  const stateValue = useSelector(actorRef, (state) => state.value);

  // Memoized utility functions
  const matches = useCallback(
    (statePattern: StateValueFrom<TMachine>) => state.matches(statePattern),
    [state]
  );

  const can = useCallback(
    (event: EventFrom<TMachine>) => state.can(event),
    [state]
  );

  // Debug utilities
  const debug = useMemo(() => ({
    logState: () => {
      console.group(`🎭 XState Machine State - ${machineInstance.id || 'unknown'}`);
      console.log('Current State:', state.value);
      console.log('Context:', state.context);
      console.groupEnd();
    },

    logContext: () => {
      console.log(`🎯 Machine Context - ${machineInstance.id || 'unknown'}:`, state.context);
    },

    logTransitions: (enabled: boolean) => {
      // This would typically connect to XState inspector
      if (enabled && debugMode) {
        globalLogger.info('Transition logging enabled for machine:', machineInstance.id);
      }
    },

    getPerformanceMetrics: () => {
      const times = performanceRef.current.transitionTimes;
      const averageTime = times.length > 0 
        ? times.reduce((sum, time) => sum + time, 0) / times.length 
        : 0;

      return {
        transitionCount: performanceRef.current.transitionCount,
        averageTransitionTime: averageTime,
        lastTransitionAt: performanceRef.current.lastTransitionAt,
      };
    },
  }), [state, machineInstance, debugMode]);

  // Machine metadata
  const meta = useMemo(() => ({
    machineId: machineInstance.id || 'unknown',
    isStarted: true, // Actor is always started when using useActor
    isRunning: state.status !== 'done',
    hasError: state.matches('error') || Boolean(state.context?.error),
    error: (state.context as any)?.error,
  }), [machineInstance, state]);

  return {
    state,
    send,
    actorRef,
    context: contextData,
    stateValue,
    matches,
    can,
    meta,
    debug,
  };
}

/**
 * Specialized hook for macro execution machines
 */
export function useMacroExecutionMachine(
  ticker: string,
  options?: Omit<XStateMachineOptions<MacroExecutionMachine>, 'debugMode'> & {
    debugMode?: boolean;
    autoStart?: boolean;
    customTimeouts?: Record<string, number>;
  }
) {
  const { autoStart = false, customTimeouts, ...hookOptions } = options || {};
  
  // Import machine factory dynamically to avoid circular dependencies
  const machine = useMemo(() => {
    // This would use the machine factory from the existing infrastructure
    const { createMacroExecutionMachine } = require('@/lib/xstate');
    return createMacroExecutionMachine(ticker, {
      debugMode: hookOptions.debugMode,
      customTimeouts,
    });
  }, [ticker, hookOptions.debugMode, customTimeouts]);

  const result = useXStateMachine(machine, hookOptions);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && !result.meta.isRunning) {
      result.send({ type: 'START_EXECUTION', ticker } as any);
    }
  }, [autoStart, result.meta.isRunning, result.send, ticker]);

  return {
    ...result,
    // Macro-specific convenience methods
    startExecution: () => result.send({ type: 'START_EXECUTION', ticker } as any),
    cancelExecution: (reason?: string) => result.send({ type: 'CANCEL_EXECUTION', reason } as any),
    resetExecution: () => result.send({ type: 'RESET' } as any),
    selectExpiration: (expiration: string) => 
      result.send({ type: 'EXPIRATION_SELECTED', expiration } as any),
    
    // Macro execution context typings
    macroContext: result.context as MacroExecutionContext,
    
    // State pattern matching for macro steps
    isIdle: () => result.matches('idle'),
    isExecuting: () => result.matches('executing'),
    isCompleted: () => result.matches('completed'),
    isFailed: () => result.matches('failed'),
    
    // Step-specific state checks
    isFetchingExpirations: () => result.matches({ executing: 'fetchingExpirations' }),
    isGettingStockData: () => result.matches({ executing: 'gettingStockData' }),
    isGeneratingAITakeaways: () => result.matches({ executing: 'generatingAITakeaways' }),
    isGeneratingAIOptions: () => result.matches({ executing: 'generatingAIOptions' }),
  };
}

/**
 * Performance-optimized hook for selecting specific machine state slices
 */
export function useXStateSelector<TMachine extends AnyStateMachine, TSelected>(
  machineResult: XStateMachineResult<TMachine>,
  selector: (state: SnapshotFrom<TMachine>) => TSelected,
  isEqual?: (prev: TSelected, next: TSelected) => boolean
): TSelected {
  return useSelector(
    machineResult.actorRef,
    selector,
    isEqual || ((prev, next) => prev === next)
  );
}

/**
 * Hook for subscribing to machine state changes with cleanup
 */
export function useXStateSubscription<TMachine extends AnyStateMachine>(
  machineResult: XStateMachineResult<TMachine>,
  callback: (state: SnapshotFrom<TMachine>) => void,
  dependencies: any[] = []
) {
  useEffect(() => {
    const subscription = machineResult.actorRef.subscribe(callback);
    return () => subscription.unsubscribe();
  }, [machineResult.actorRef, callback, ...dependencies]);
}