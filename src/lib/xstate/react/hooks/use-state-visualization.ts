/**
 * @fileoverview State Visualization React Hook
 * 
 * Provides hooks for visualizing XState machine states, transitions,
 * and execution flows with React integration.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from '@xstate/react';
import type { AnyStateMachine, SnapshotFrom } from 'xstate';
import type { XStateMachineResult } from './use-xstate-machine';
import type { MacroExecutionContext, MacroStep } from '@/lib/xstate';

export interface StateVisualizationData {
  /** Current state value */
  currentState: string | object;
  /** Previous state for transition tracking */
  previousState?: string | object;
  /** State transition history */
  transitionHistory: Array<{
    from: string | object;
    to: string | object;
    event: string;
    timestamp: number;
    duration?: number;
  }>;
  /** Available next states/events */
  nextEvents: string[];
  /** State context data */
  context: any;
  /** State metadata */
  meta: {
    machineId: string;
    stateName: string;
    isInitial: boolean;
    isFinal: boolean;
    hasError: boolean;
    depth: number; // Nested state depth
  };
}

export interface MacroVisualizationData extends StateVisualizationData {
  /** Macro-specific progress information */
  macroProgress: {
    currentStep: MacroStep;
    totalSteps: number;
    completedSteps: number;
    stepProgress: number;
    overallProgress: number;
    timeElapsed: number;
    estimatedTimeRemaining?: number;
  };
  /** Step-specific information */
  stepInfo: {
    name: string;
    description: string;
    status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
    startTime?: number;
    endTime?: number;
    duration?: number;
    result?: any;
    error?: Error;
  };
  /** Workflow visualization data */
  workflow: {
    steps: Array<{
      id: MacroStep;
      name: string;
      status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
      dependencies: MacroStep[];
      estimatedDuration: number;
      actualDuration?: number;
    }>;
    connections: Array<{
      from: MacroStep;
      to: MacroStep;
      condition?: string;
    }>;
  };
}

export interface VisualizationConfig {
  /** Enable transition history tracking */
  trackHistory?: boolean;
  /** Maximum history entries to keep */
  maxHistorySize?: number;
  /** Enable performance timing */
  trackTiming?: boolean;
  /** Update frequency (ms) */
  updateFrequency?: number;
  /** Enable debug logging */
  enableDebugLogging?: boolean;
  /** Custom state name formatter */
  formatStateName?: (state: string | object) => string;
  /** Custom event name formatter */
  formatEventName?: (event: string) => string;
}

export interface UseStateVisualizationResult {
  /** Current visualization data */
  data: StateVisualizationData;
  /** Visualization controls */
  controls: {
    /** Clear transition history */
    clearHistory: () => void;
    /** Export visualization data */
    exportData: () => any;
    /** Take snapshot of current state */
    takeSnapshot: () => StateVisualizationData;
    /** Reset visualization tracking */
    reset: () => void;
  };
  /** Visualization utilities */
  utils: {
    /** Format state name for display */
    formatState: (state: string | object) => string;
    /** Format event name for display */
    formatEvent: (event: string) => string;
    /** Get state color for visualization */
    getStateColor: (state: string | object) => string;
    /** Check if state is error state */
    isErrorState: (state: string | object) => boolean;
    /** Check if state is final state */
    isFinalState: (state: string | object) => boolean;
  };
}

/**
 * Core state visualization hook
 */
export function useStateVisualization<TMachine extends AnyStateMachine>(
  machineResult: XStateMachineResult<TMachine>,
  config: VisualizationConfig = {}
): UseStateVisualizationResult {
  const {
    trackHistory = true,
    maxHistorySize = 100,
    trackTiming = true,
    updateFrequency = 100,
    enableDebugLogging = false,
    formatStateName,
    formatEventName,
  } = config;

  // Visualization data state
  const [transitionHistory, setTransitionHistory] = useState<StateVisualizationData['transitionHistory']>([]);
  const [previousState, setPreviousState] = useState<string | object>();

  // Performance tracking
  const timingRef = useRef({
    lastTransitionTime: Date.now(),
    stateStartTime: Date.now(),
  });

  // Current state tracking with selector for performance
  const currentState = useSelector(machineResult.actorRef, (state) => state.value);
  const nextEvents = useSelector(machineResult.actorRef, (state) => state.nextEvents || []);
  const context = useSelector(machineResult.actorRef, (state) => state.context);

  // Track state transitions
  useEffect(() => {
    if (!trackHistory) return;

    if (previousState && previousState !== currentState) {
      const now = Date.now();
      const duration = trackTiming ? now - timingRef.current.stateStartTime : undefined;

      const transition = {
        from: previousState,
        to: currentState,
        event: machineResult.state.event?.type || 'unknown',
        timestamp: now,
        duration,
      };

      setTransitionHistory(prev => {
        const newHistory = [...prev, transition];
        return newHistory.length > maxHistorySize 
          ? newHistory.slice(-maxHistorySize)
          : newHistory;
      });

      if (enableDebugLogging) {
        console.log('🔄 State Transition:', transition);
      }

      timingRef.current.stateStartTime = now;
    }

    setPreviousState(currentState);
  }, [currentState, previousState, trackHistory, maxHistorySize, trackTiming, enableDebugLogging, machineResult.state.event]);

  // State metadata
  const meta = useMemo(() => {
    const stateString = typeof currentState === 'string' ? currentState : JSON.stringify(currentState);
    
    return {
      machineId: machineResult.meta.machineId,
      stateName: formatStateName ? formatStateName(currentState) : stateString,
      isInitial: stateString === 'idle' || stateString === 'initial',
      isFinal: machineResult.state.done || stateString === 'completed' || stateString === 'final',
      hasError: stateString.includes('error') || stateString.includes('failed') || machineResult.meta.hasError,
      depth: typeof currentState === 'object' ? Object.keys(currentState).length : 0,
    };
  }, [currentState, machineResult, formatStateName]);

  // Visualization data
  const data = useMemo<StateVisualizationData>(() => ({
    currentState,
    previousState,
    transitionHistory,
    nextEvents,
    context,
    meta,
  }), [currentState, previousState, transitionHistory, nextEvents, context, meta]);

  // Controls
  const controls = useMemo(() => ({
    clearHistory: () => {
      setTransitionHistory([]);
      setPreviousState(undefined);
    },

    exportData: () => ({
      ...data,
      exportedAt: Date.now(),
      machineSnapshot: machineResult.state,
      performanceMetrics: machineResult.debug.getPerformanceMetrics(),
    }),

    takeSnapshot: () => ({ ...data }),

    reset: () => {
      setTransitionHistory([]);
      setPreviousState(undefined);
      timingRef.current = {
        lastTransitionTime: Date.now(),
        stateStartTime: Date.now(),
      };
    },
  }), [data, machineResult]);

  // Utilities
  const utils = useMemo(() => ({
    formatState: (state: string | object) => {
      if (formatStateName) return formatStateName(state);
      if (typeof state === 'string') return state;
      return JSON.stringify(state);
    },

    formatEvent: (event: string) => {
      if (formatEventName) return formatEventName(event);
      return event.replace(/_/g, ' ').toLowerCase();
    },

    getStateColor: (state: string | object) => {
      const stateStr = typeof state === 'string' ? state : JSON.stringify(state);
      
      if (stateStr.includes('error') || stateStr.includes('failed')) return '#ef4444'; // red
      if (stateStr.includes('loading') || stateStr.includes('executing')) return '#f59e0b'; // yellow
      if (stateStr.includes('completed') || stateStr.includes('success')) return '#10b981'; // green
      if (stateStr.includes('idle') || stateStr.includes('initial')) return '#6b7280'; // gray
      return '#3b82f6'; // blue
    },

    isErrorState: (state: string | object) => {
      const stateStr = typeof state === 'string' ? state : JSON.stringify(state);
      return stateStr.includes('error') || stateStr.includes('failed');
    },

    isFinalState: (state: string | object) => meta.isFinal,
  }), [formatStateName, formatEventName, meta.isFinal]);

  return {
    data,
    controls,
    utils,
  };
}

/**
 * Specialized hook for macro execution visualization
 */
export function useMacroVisualization(
  machineResult: XStateMachineResult<any>,
  config?: VisualizationConfig
): UseStateVisualizationResult & { macroData: MacroVisualizationData } {
  const baseVisualization = useStateVisualization(machineResult, config);
  const [startTime] = useState(Date.now());

  // Macro-specific data extraction
  const macroContext = machineResult.context as MacroExecutionContext;
  
  const macroData = useMemo<MacroVisualizationData>(() => {
    const currentStep = macroContext.currentStep || 'fetchExpirations';
    const completedSteps = Object.keys(macroContext.stepResults || {}).length;
    const timeElapsed = Date.now() - startTime;
    
    // Define workflow steps
    const workflowSteps: MacroVisualizationData['workflow']['steps'] = [
      {
        id: 'fetchExpirations',
        name: 'Fetch Expirations',
        status: getStepStatus('fetchExpirations', currentStep, macroContext),
        dependencies: [],
        estimatedDuration: 5000,
        actualDuration: getActualDuration('fetchExpirations', macroContext),
      },
      {
        id: 'getStockData',
        name: 'Get Stock Data',
        status: getStepStatus('getStockData', currentStep, macroContext),
        dependencies: ['fetchExpirations'],
        estimatedDuration: 8000,
        actualDuration: getActualDuration('getStockData', macroContext),
      },
      {
        id: 'generateAITakeaways',
        name: 'Generate AI Takeaways',
        status: getStepStatus('generateAITakeaways', currentStep, macroContext),
        dependencies: ['getStockData'],
        estimatedDuration: 15000,
        actualDuration: getActualDuration('generateAITakeaways', macroContext),
      },
      {
        id: 'generateAIOptions',
        name: 'Generate AI Options',
        status: getStepStatus('generateAIOptions', currentStep, macroContext),
        dependencies: ['generateAITakeaways'],
        estimatedDuration: 12000,
        actualDuration: getActualDuration('generateAIOptions', macroContext),
      },
    ];

    return {
      ...baseVisualization.data,
      macroProgress: {
        currentStep,
        totalSteps: 4,
        completedSteps,
        stepProgress: macroContext.progress?.stepProgress || 0,
        overallProgress: macroContext.progress?.overallProgress || (completedSteps / 4),
        timeElapsed,
        estimatedTimeRemaining: calculateEstimatedTime(workflowSteps, currentStep),
      },
      stepInfo: {
        name: getStepDisplayName(currentStep),
        description: getStepDescription(currentStep),
        status: getStepStatus(currentStep, currentStep, macroContext),
        startTime: macroContext.stepStartTimes?.[currentStep],
        endTime: macroContext.stepEndTimes?.[currentStep],
        duration: getActualDuration(currentStep, macroContext),
        result: macroContext.stepResults?.[currentStep],
        error: macroContext.stepErrors?.[currentStep],
      },
      workflow: {
        steps: workflowSteps,
        connections: [
          { from: 'fetchExpirations', to: 'getStockData' },
          { from: 'getStockData', to: 'generateAITakeaways' },
          { from: 'generateAITakeaways', to: 'generateAIOptions' },
        ],
      },
    };
  }, [baseVisualization.data, macroContext, startTime]);

  return {
    ...baseVisualization,
    macroData,
  };
}

// Helper functions
function getStepStatus(
  step: MacroStep, 
  currentStep: MacroStep, 
  context: MacroExecutionContext
): 'pending' | 'executing' | 'completed' | 'failed' | 'skipped' {
  if (context.stepResults?.[step]) return 'completed';
  if (context.stepErrors?.[step]) return 'failed';
  if (step === currentStep) return 'executing';
  return 'pending';
}

function getActualDuration(step: MacroStep, context: MacroExecutionContext): number | undefined {
  const startTime = context.stepStartTimes?.[step];
  const endTime = context.stepEndTimes?.[step];
  return startTime && endTime ? endTime - startTime : undefined;
}

function getStepDisplayName(step: MacroStep): string {
  const names: Record<MacroStep, string> = {
    fetchExpirations: 'Fetch Expirations',
    getStockData: 'Get Stock Data',
    generateAITakeaways: 'Generate AI Takeaways',
    generateAIOptions: 'Generate AI Options',
  };
  return names[step] || step;
}

function getStepDescription(step: MacroStep): string {
  const descriptions: Record<MacroStep, string> = {
    fetchExpirations: 'Fetching available option expiration dates',
    getStockData: 'Retrieving current stock data and options chain',
    generateAITakeaways: 'Analyzing data and generating key insights',
    generateAIOptions: 'Creating options trading recommendations',
  };
  return descriptions[step] || `Executing ${step}`;
}

function calculateEstimatedTime(
  steps: MacroVisualizationData['workflow']['steps'],
  currentStep: MacroStep
): number | undefined {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  if (currentStepIndex === -1) return undefined;

  const remainingSteps = steps.slice(currentStepIndex + 1);
  return remainingSteps.reduce((total, step) => total + step.estimatedDuration, 0);
}

/**
 * Hook for creating custom visualization configurations
 */
export function useVisualizationConfig(
  overrides?: Partial<VisualizationConfig>
): VisualizationConfig {
  return useMemo(() => ({
    trackHistory: true,
    maxHistorySize: 100,
    trackTiming: true,
    updateFrequency: 100,
    enableDebugLogging: process.env.NODE_ENV === 'development',
    formatStateName: (state) => {
      if (typeof state === 'string') {
        return state.replace(/([A-Z])/g, ' $1').trim();
      }
      return JSON.stringify(state, null, 2);
    },
    formatEventName: (event) => {
      return event.replace(/_/g, ' ').toLowerCase();
    },
    ...overrides,
  }), [overrides]);
}