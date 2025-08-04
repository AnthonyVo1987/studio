/**
 * @fileoverview React Components for XState Integration - Export Module
 * 
 * Provides React components for XState machine visualization, error handling,
 * macro progress tracking, and state transition logging.
 */

// Error Boundary Component
export {
  XStateErrorBoundary,
  withXStateErrorBoundary,
  useXStateErrorReporting,
} from './XStateErrorBoundary';

export type {
  XStateError,
  XStateErrorType,
  XStateErrorBoundaryProps,
} from './XStateErrorBoundary';

// State Machine Visualizer Components
export {
  StateMachineVisualizer,
  MacroVisualizer,
  StateIndicator,
} from './StateMachineVisualizer';

export type {
  StateMachineVisualizerProps,
  MacroVisualizerProps,
} from './StateMachineVisualizer';

// Macro Progress Components
export {
  MacroProgressIndicator,
  MacroProgressBar,
  StepStatusIndicator,
} from './MacroProgressIndicator';

export type {
  MacroProgressIndicatorProps,
} from './MacroProgressIndicator';

// State Transition Log Components
export {
  StateTransitionLog,
  TransitionCounter,
} from './StateTransitionLog';

export type {
  StateTransitionLogProps,
} from './StateTransitionLog';

// Default exports for convenience - using different names to avoid duplicates
export { default as DefaultXStateErrorBoundary } from './XStateErrorBoundary';
export { default as DefaultStateMachineVisualizer } from './StateMachineVisualizer';
export { default as DefaultMacroProgressIndicator } from './MacroProgressIndicator';
export { default as DefaultStateTransitionLog } from './StateTransitionLog';