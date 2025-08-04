/**
 * @fileoverview XState React Integration - Main Export Module
 * 
 * Provides complete React integration for XState macro automation system,
 * including hooks, components, contexts, and utilities for seamless
 * integration with existing StockSage architecture.
 */

// ================================
// REACT HOOKS
// ================================
export {
  useXStateMachine,
  useMacroExecutionMachine,
  useXStateSelector,
  useXStateSubscription,
  useXStateActor,
  useMacroExecutionActor,
  useXStateActorGroup,
  useMacroExecution,
  useSimpleMacroExecution,
  useStateVisualization,
  useMacroVisualization,
  useVisualizationConfig,
} from './hooks';

export type {
  XStateMachineOptions,
  XStateMachineResult,
  ActorConfig,
  XStateActorResult,
  MacroExecutionConfig,
  MacroProgress,
  MacroExecutionResults,
  MacroExecutionState,
  MacroExecutionControls,
  UseMacroExecutionResult,
  StateVisualizationData,
  MacroVisualizationData,
  VisualizationConfig,
  UseStateVisualizationResult,
} from './hooks';

// ================================
// REACT CONTEXTS
// ================================
export {
  XStateProvider,
  useXStateSystem,
  useActorSystem,
  useActorFactory,
  useMacroActorManager,
  useXStateSystemMonitoring,
  createXStateMachineContext,
  MacroExecutionProvider,
  useMacroExecutionContext,
  useTickerExecution,
  useGlobalExecutionStatus,
  useExecutionConfig,
  useContextualMacroExecution,
} from './contexts';

export type {
  XStateSystemConfig,
  XStateSystemContextValue,
  XStateProviderProps,
  MacroExecutionContextState,
  MacroExecutionContextAction,
  MacroExecutionContextValue,
  MacroExecutionProviderProps,
} from './contexts';

// ================================
// REACT COMPONENTS
// ================================
export {
  XStateErrorBoundary,
  withXStateErrorBoundary,
  useXStateErrorReporting,
  StateMachineVisualizer,
  MacroVisualizer,
  StateIndicator,
  MacroProgressIndicator,
  MacroProgressBar,
  StepStatusIndicator,
  StateTransitionLog,
  TransitionCounter,
} from './components';

export type {
  StateMachineVisualizerProps,
  MacroVisualizerProps,
  MacroProgressIndicatorProps,
  StateTransitionLogProps,
} from './components';

// Define error boundary types
export interface XStateErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableAutoRecovery?: boolean;
  maxRetries?: number;
  recoveryDelay?: number;
  handleErrorTypes?: XStateErrorType[];
}

export interface XStateErrorType {
  name: string;
  message: string;
  stack?: string;
  code?: string;
}

export interface XStateError extends Error {
  code?: string;
  context?: any;
  type?: 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'SERVICE_ERROR' | 'VALIDATION_ERROR';
}

// ================================
// RE-EXPORTS FROM CORE SYSTEM
// ================================
// Re-export commonly used types for convenience
export type { SupportedTicker } from '@/lib/xstate/actors';
export type { MacroExecutionContext, MacroStep } from '@/lib/xstate';

// Import the types we need for the integration utilities
import type { SupportedTicker } from '@/lib/xstate/actors';
import type {
  XStateSystemConfig,
  XStateSystemContextValue,
  MacroExecutionContextState,
} from './contexts';
import {
  useStateVisualization,
} from './hooks';
import {
  useContextualMacroExecution,
} from './contexts';

// ================================
// INTEGRATION UTILITIES
// ================================

/**
 * Complete XState React setup utility
 * Creates a fully configured React integration for macro automation
 */
export interface XStateReactSetupOptions {
  /** Enable debug mode */
  debugMode?: boolean;
  /** Enable XState inspector */
  enableInspection?: boolean;
  /** System configuration */
  systemConfig?: XStateSystemConfig;
  /** Macro execution configuration */
  macroConfig?: Partial<MacroExecutionContextState['config']>;
  /** Error boundary configuration */
  errorBoundaryConfig?: Partial<XStateErrorBoundaryProps>;
}

/**
 * Creates a complete XState React integration setup
 * This is the main entry point for setting up XState with React
 */
export function createXStateReactSetup(options: XStateReactSetupOptions = {}) {
  const {
    debugMode = process.env.NODE_ENV === 'development',
    enableInspection = debugMode,
    systemConfig = {},
    macroConfig = {},
    errorBoundaryConfig = {},
  } = options;

  // System configuration with defaults
  const finalSystemConfig: XStateSystemConfig = {
    debugMode,
    enableInspection,
    maxActors: 10,
    cleanupInterval: 300000, // 5 minutes
    timeouts: {
      default: 45000,
      dataFetch: 30000,
      aiGeneration: 60000,
    },
    monitoring: {
      enableMetrics: true,
      metricsInterval: 5000,
    },
    ...systemConfig,
  };

  // Error boundary configuration with defaults
  const finalErrorBoundaryConfig = {
    enableAutoRecovery: true,
    maxRetries: 3,
    recoveryDelay: 2000,
    handleErrorTypes: [{ name: 'NETWORK_ERROR', message: 'Network error occurred' }, { name: 'TIMEOUT_ERROR', message: 'Operation timed out' }, { name: 'SERVICE_ERROR', message: 'Service error occurred' }] as XStateErrorType[],
    ...errorBoundaryConfig,
  };

  return {
    systemConfig: finalSystemConfig,
    errorBoundaryConfig: finalErrorBoundaryConfig,
    macroConfig,
  };
}

/**
 * Hook for StockSage integration
 * Provides a simplified interface for integrating with existing StockSage contexts
 */
export function useStockSageXStateIntegration(
  ticker: SupportedTicker,
  contextHooks: {
    useAnalysis: () => any;
    dispatch: (action: any) => void;
  },
  options?: {
    autoStart?: boolean;
    enableProgress?: boolean;
    enableVisualization?: boolean;
  }
) {
  const { autoStart = false, enableProgress = true, enableVisualization = false } = options || {};
  
  // Use the contextual macro execution hook
  const macroExecution = useContextualMacroExecution(ticker, contextHooks, {
    autoStart,
  });
  
  // Optional visualization
  const visualization = useStateVisualization(macroExecution as any, {
    trackHistory: enableVisualization,
    enableDebugLogging: process.env.NODE_ENV === 'development',
  });
  
  return {
    // Core macro execution
    ...macroExecution,
    
    // Optional visualization data
    ...(enableVisualization && { visualization }),
    
    // Simplified status
    isExecuting: macroExecution.state.meta.isRunning,
    isCompleted: macroExecution.state.status === 'completed',
    hasError: macroExecution.state.meta.hasErrors,
    progress: macroExecution.state.progress.overallProgress,
    
    // Component configuration for easy integration
    // Note: Actual components should be created in .tsx files
    componentConfig: {
      progressIndicator: {
        executionState: macroExecution.state,
        mode: 'compact' as const,
        showTiming: true,
      },
      errorBoundary: {
        contextInfo: { ticker, component: 'StockSageIntegration' },
      },
      ...(enableVisualization && {
        stateVisualizer: {
          machineResult: macroExecution as any,
          mode: 'compact' as const,
        },
      }),
    },
  };
}

// ================================
// VERSION INFO
// ================================
export const XSTATE_REACT_VERSION = '1.0.0-alpha';
export const REACT_INTEGRATION_STATUS = 'Phase 3 - Complete';

// ================================
// INITIALIZATION
// ================================
export const initializeXStateReact = (options: XStateReactSetupOptions = {}) => {
  console.log(`🚀 XState React Integration v${XSTATE_REACT_VERSION} initialized`);
  
  const setup = createXStateReactSetup(options);
  
  return {
    version: XSTATE_REACT_VERSION,
    status: REACT_INTEGRATION_STATUS,
    setup,
    environment: process.env.NODE_ENV,
    features: {
      hooks: '✅ Complete',
      contexts: '✅ Complete', 
      components: '✅ Complete',
      errorBoundaries: '✅ Complete',
      visualization: '✅ Complete',
      stockSageIntegration: '✅ Complete',
    },
  };
};