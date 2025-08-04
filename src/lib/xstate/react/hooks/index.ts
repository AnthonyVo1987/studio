/**
 * @fileoverview React Hooks for XState Integration - Export Module
 * 
 * Provides all React hooks for integrating XState machines with React components,
 * including machine management, actor control, macro execution, and state visualization.
 */

// Core XState Machine Hook
export {
  useXStateMachine,
  useMacroExecutionMachine,
  useXStateSelector,
  useXStateSubscription,
} from './use-xstate-machine';

export type {
  XStateMachineOptions,
  XStateMachineResult,
} from './use-xstate-machine';

// XState Actor Management Hook
export {
  useXStateActor,
  useMacroExecutionActor,
  useXStateActorGroup,
} from './use-xstate-actor';

export type {
  ActorConfig,
  XStateActorResult,
} from './use-xstate-actor';

// High-Level Macro Execution Hook
export {
  useMacroExecution,
  useSimpleMacroExecution,
} from './use-macro-execution';

export type {
  MacroExecutionConfig,
  MacroProgress,
  MacroExecutionResults,
  MacroExecutionState,
  MacroExecutionControls,
  UseMacroExecutionResult,
} from './use-macro-execution';

// State Visualization Hooks
export {
  useStateVisualization,
  useMacroVisualization,
  useVisualizationConfig,
} from './use-state-visualization';

export type {
  StateVisualizationData,
  MacroVisualizationData,
  VisualizationConfig,
  UseStateVisualizationResult,
} from './use-state-visualization';

// Re-export common types for convenience
export type { SupportedTicker } from '@/lib/xstate/actors';
export type { MacroExecutionContext, MacroStep } from '@/lib/xstate';