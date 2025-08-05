/**
 * XState Macro Automation System - Main Export Module
 * 
 * This file provides the main exports for the XState-based macro automation system,
 * making it easy to import and use across the application.
 */

// Import implementations for convenience functions
import { createDefaultContext } from './types/context-types';
import { macroExecutionMachine, createMacroExecutionMachine } from './machines/macro-execution-machine';
import { createInspectedMachine, createInspectedActor, enableGlobalInspection } from './dev-tools/xstate-inspector';
import { validateMockData } from './test-utils/mock-services';
import type { TimeoutConfig, MacroExecutionContext } from './types/macro-types';

// ================================
// CORE TYPES
// ================================
export type {
  MacroExecutionContext,
  MacroExecutionEvent,
  MacroExecutionStateValue,
  MacroExecutionState,
  StepResult,
  MacroStep,
  MacroStepPrerequisite,
  TimeoutConfig,
  PerformanceMetrics,
  MacroGuardParams,
  MacroGuard,
  MacroAction,
  MacroService,
  MacroServiceId,
  MacroMachineConfig,
  DEFAULT_TIMEOUT_CONFIG,
  DEFAULT_PERFORMANCE_METRICS,
  MACRO_STEPS
} from './types/macro-types';

export {
  macroStepToKey,
  isMacroStep
} from './types/macro-types';

export type {
  MacroExecutionContextOptions,
  MacroExecutionContextSnapshot,
  ContextValidator,
  ContextValidationResult,
  StepValidationResult,
  PrerequisiteValidationResult,
  ContextMutations,
  ContextQueries,
  ExecutionProgress,
  ContextSerializer,
  ContextDebugInfo,
  ContextDebugger
} from './types/context-types';

export type {
  MacroExecutionEvent as MacroEvent,
  StartExecutionEvent,
  CancelExecutionEvent,
  ResetExecutionEvent,
  StepCompletedEvent,
  StepFailedEvent,
  StepTimeoutEvent,
  RetryStepEvent,
  UpdateTimeoutConfigEvent,
  SetDebugModeEvent,
  ExpirationSelectedEvent,
  PrerequisitesValidatedEvent,
  PerformanceUpdateEvent
} from './types/event-types';

// ================================
// EVENT FACTORIES
// ================================
export {
  createStartExecutionEvent,
  createStepCompletedEvent,
  createStepFailedEvent,
  createRetryStepEvent,
  createCancelExecutionEvent,
  isExecutionControlEvent,
  isStepManagementEvent,
  isConfigurationEvent,
  isValidationEvent,
  isErrorEvent,
  isSuccessEvent,
  validateEvent,
  serializeEvent,
  deserializeEvent
} from './types/event-types';

// ================================
// CONTEXT UTILITIES
// ================================
export {
  createDefaultContext,
  isValidContext,
  isValidStepResult
} from './types/context-types';

// ================================
// MACHINES
// ================================
export {
  macroExecutionMachine,
  createMacroExecutionMachine
} from './machines/macro-execution-machine';

export type {
  MacroExecutionMachine,
  MacroExecutionActor
} from './machines/macro-execution-machine';

// ================================
// MACHINE FACTORY
// ================================
export {
  machineFactory,
  getDefaultMachineConfig,
  createTickerMachine,
  createTickerActor,
  MachineRegistry,
  globalMachineRegistry
} from './machines/machine-factory';

export type {
  MachineFactory,
  ConfigValidationResult
} from './machines/machine-factory';

// ================================
// DEVELOPMENT TOOLS
// ================================
export {
  MacroExecutionLogger,
  MachineDebugger,
  createInspectedMachine,
  createInspectedActor,
  visualizeMachine,
  globalLogger,
  globalDebugger,
  enableGlobalInspection,
  disableGlobalInspection,
  DEFAULT_INSPECTOR_CONFIG
} from './dev-tools/xstate-inspector';

export type {
  InspectorConfig,
  MachineVisualization,
  DebugSnapshot
} from './dev-tools/xstate-inspector';

// ================================
// DEBUG UTILITIES
// ================================
export {
  analyzeContext,
  EventTracer,
  PerformanceMonitor,
  globalEventTracer,
  globalPerformanceMonitor,
  createDebugReport,
  logDebugSummary
} from './dev-tools/debug-utils';

export type {
  ContextAnalysis,
  EventTrace,
  EventAnalysis,
  PerformanceReport
} from './dev-tools/debug-utils';

// ================================
// TESTING UTILITIES
// ================================
export {
  createTestActor,
  waitForState,
  waitForEvent,
  assertState,
  assertContext,
  assertStepResult,
  runTestScenario,
  runPerformanceTest,
  runAllTestScenarios,
  TEST_SCENARIOS
} from './test-utils/machine-test-utils';

export type {
  TestActorOptions,
  TestScenario,
  PerformanceTestResult
} from './test-utils/machine-test-utils';

// ================================
// MOCK SERVICES
// ================================
export {
  MockServiceFactory,
  MockStepResultFactory,
  MockContextFactory,
  MOCK_STOCK_DATA,
  MOCK_OPTIONS_DATA,
  MOCK_AI_ANALYSIS,
  MOCK_OPTIONS_RECOMMENDATIONS,
  MOCK_SCENARIOS,
  createMockServiceProvider,
  validateMockData
} from './test-utils/mock-services';

export type {
  MockServiceOptions
} from './test-utils/mock-services';

// ================================
// SERVICES LAYER
// ================================
export {
  createFetchExpirationsService,
  createGetStockDataService,
  createAITakeawaysService,
  createAIOptionsService,
  createMacroExecution,
  executeMacroWorkflow,
  MacroServiceRegistry,
  MacroServiceOrchestrator
} from './services';

export type {
  MacroServiceOptions,
  MacroServiceResult,
  ExpirationData,
  StockDataResult,
  AITakeawaysResult,
  AIOptionsResult,
  ServiceError,
  MacroWorkflowResult,
  MacroWorkflowSummary,
  ExecutionMetadata,
  PerformanceMetrics as ServicePerformanceMetrics
} from './services';

// ================================
// INTEGRATION LAYER
// ================================
export {
  createIntegrationSetup,
  createServiceConfig,
  createStockSageAdapter,
  createContextBridge,
  createCompatibilityLayer,
  createDataTransformers,
  checkIntegrationStatus,
  debugIntegration,
  STANDARD_SERVICE_CONFIGS,
  STANDARD_WORKFLOW_CONFIGS
} from './integration';

export type {
  SupportedTicker,
  TickerContextState,
  TickerContextHooks,
  IntegrationResult,
  IntegrationMetrics,
  StockSageCompatConfig,
  ServiceIntegrationConfig,
  WorkflowIntegrationConfig,
  IntegrationAdapter,
  ContextBridge,
  CompatibilityLayer,
  DataValidator
} from './integration';

// ================================
// ACTOR MANAGEMENT
// ================================
export {
  createActorSystem,
  createActorFactory,
  createTickerActorSetup,
  getGlobalActorRegistry,
  getGlobalActorManager,
  getGlobalEventBroadcaster,
  ActorDebugUtils
} from './actors';

export type {
  ActorLifecycleState,
  ActorIdentity,
  ActorConfig,
  ActorInstance,
  ActorRegistry,
  ActorManager,
  ActorStatus,
  ActorEvent,
  EventBroadcaster,
  WorkflowProgress,
  WorkflowResult,
  HealthStatus
} from './actors';

// ================================
// CONVENIENCE FUNCTIONS
// ================================

/**
 * Creates a complete XState setup for a ticker with sensible defaults
 */
export const createMacroAutomationSetup = (ticker: string, options: {
  debugMode?: boolean;
  enableInspection?: boolean;
  autoStart?: boolean;
  customTimeouts?: Partial<TimeoutConfig>;
} = {}) => {
  const {
    debugMode = process.env.NODE_ENV === 'development',
    enableInspection = debugMode,
    autoStart = true,
    customTimeouts
  } = options;
  
  // Create machine
  const machine = createMacroExecutionMachine(ticker, { debugMode });
  
  // Apply inspection if enabled
  const inspectedMachine = enableInspection 
    ? createInspectedMachine(machine, { enabled: true })
    : machine;
  
  // Create actor
  const { actor, logger } = createInspectedActor(inspectedMachine, {
    enabled: enableInspection,
    logLevel: debugMode ? 'debug' : 'info'
  });
  
  if (autoStart) {
    actor.start();
  }
  
  return {
    machine: inspectedMachine,
    actor,
    logger,
    ticker,
    debugMode,
    // Convenience methods
    start: () => actor.send({ type: 'START_EXECUTION', ticker, debugMode } as any),
    stop: () => actor.stop(),
    reset: () => actor.send({ type: 'RESET' }),
    cancel: (reason?: string) => actor.send({ type: 'CANCEL_EXECUTION', reason } as any),
    selectExpiration: (expiration: string) => 
      actor.send({ type: 'EXPIRATION_SELECTED', expiration } as any),
    getState: () => actor.getSnapshot(),
    getContext: () => actor.getSnapshot().context as MacroExecutionContext
  };
};

/**
 * Quick setup for testing scenarios
 */
export const createTestSetup = (ticker: string = 'TEST') => {
  return createMacroAutomationSetup(ticker, {
    debugMode: true,
    enableInspection: false,
    autoStart: false
  });
};

/**
 * Production setup with minimal logging
 */
export const createProductionSetup = (ticker: string) => {
  return createMacroAutomationSetup(ticker, {
    debugMode: false,
    enableInspection: false,
    autoStart: true
  });
};

// ================================
// VERSION INFO
// ================================
export const XSTATE_MACRO_VERSION = '1.0.0-alpha';
export const XSTATE_VERSION_REQUIREMENT = '^5.20.0';

// ================================
// INITIALIZATION CHECK
// ================================
export const initializeXStateMacroSystem = () => {
  console.log(`🚀 XState Macro Automation System v${XSTATE_MACRO_VERSION} initialized`);
  
  // Validate mock data in development
  if (process.env.NODE_ENV === 'development') {
    validateMockData();
  }
  
  // Enable global debugging in development
  if (process.env.NODE_ENV === 'development') {
    enableGlobalInspection({
      enabled: true,
      logLevel: 'info',
      logTransitions: true,
      logActions: false
    });
  }
  
  return {
    version: XSTATE_MACRO_VERSION,
    environment: process.env.NODE_ENV,
    debugMode: process.env.NODE_ENV === 'development'
  };
};