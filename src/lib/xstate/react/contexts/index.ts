/**
 * @fileoverview React Contexts for XState Integration - Export Module
 * 
 * Provides React context providers for XState system management and
 * macro execution state sharing across components.
 */

// XState System Context
export {
  XStateProvider,
  useXStateSystem,
  useActorSystem,
  useActorFactory,
  useMacroActorManager,
  useXStateSystemMonitoring,
  createXStateMachineContext,
} from './XStateContext';

export type {
  XStateSystemConfig,
  XStateSystemContextValue,
  XStateProviderProps,
} from './XStateContext';

// Macro Execution Context
export {
  MacroExecutionProvider,
  useMacroExecutionContext,
  useTickerExecution,
  useGlobalExecutionStatus,
  useExecutionConfig,
  useContextualMacroExecution,
} from './MacroExecutionContext';

export type {
  MacroExecutionContextState,
  MacroExecutionContextAction,
  MacroExecutionContextValue,
  MacroExecutionProviderProps,
} from './MacroExecutionContext';

// Default exports for convenience (using different names to avoid conflicts)
export { default as XStateProviderDefault } from './XStateContext';
export { default as MacroExecutionProviderDefault } from './MacroExecutionContext';