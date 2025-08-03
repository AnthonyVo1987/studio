/**
 * Core XState Type Definitions for Macro Execution System
 * 
 * This file defines the complete TypeScript interfaces for the XState-based
 * macro execution system, providing type safety and IntelliSense support.
 */

// ================================
// PERFORMANCE & TIMEOUT TYPES
// ================================

export interface TimeoutConfig {
  /** Timeout for individual macro steps (default: 45000ms) */
  stepTimeout: number;
  /** Maximum retries for failed operations (default: 2) */
  maxRetries: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier: number;
  /** Base delay for retry operations (default: 1000ms) */
  baseRetryDelay: number;
}

export interface PerformanceMetrics {
  /** Total execution duration in milliseconds */
  totalDuration: number;
  /** Duration of each individual step */
  stepDurations: Map<number, number>;
  /** Total number of retry attempts */
  retryCount: number;
  /** Number of operations that hit timeout */
  timeoutCount: number;
}

// ================================
// STEP EXECUTION TYPES
// ================================

export interface StepResult {
  /** Unique identifier for the step */
  stepId: number;
  /** Human-readable step name */
  stepName: string;
  /** Execution status */
  status: 'success' | 'error' | 'timeout' | 'cancelled';
  /** Result data from the step */
  data?: any;
  /** Error information if step failed */
  error?: Error;
  /** Execution duration in milliseconds */
  duration: number;
  /** Timestamp when step started */
  startTime: number;
  /** Timestamp when step completed */
  endTime?: number;
  /** Number of retry attempts for this step */
  retryCount: number;
}

export interface MacroStep {
  /** Unique step identifier */
  id: number;
  /** Human-readable step name */
  name: string;
  /** Step description for debugging */
  description: string;
  /** Prerequisites that must be met before this step */
  prerequisites: MacroStepPrerequisite[];
  /** Whether this step can be retried on failure */
  retryable: boolean;
  /** Step-specific timeout override */
  timeout?: number;
}

export interface MacroStepPrerequisite {
  /** Type of prerequisite check */
  type: 'data_exists' | 'state_value' | 'context_property' | 'custom';
  /** Property or state to check */
  property: string;
  /** Expected value (optional) */
  expectedValue?: any;
  /** Custom validation function (for 'custom' type) */
  validator?: (context: MacroExecutionContext) => boolean;
}

// ================================
// CORE CONTEXT INTERFACE
// ================================

export interface MacroExecutionContext {
  /** Target ticker symbol */
  ticker: string;
  /** Unique execution identifier */
  executionId: string;
  /** Currently selected expiration date */
  selectedExpiration: string | null;
  /** Results from completed steps */
  stepResults: Map<number, StepResult>;
  /** Currently executing step */
  currentStep: number;
  /** Array of completed step IDs */
  completedSteps: number[];
  /** Current error state */
  error: Error | null;
  /** Timeout and retry configuration */
  timeoutSettings: TimeoutConfig;
  /** Execution start timestamp */
  startTime: number | null;
  /** Performance tracking metrics */
  performance: PerformanceMetrics;
  /** Current retry attempt for the current step */
  currentRetryAttempt: number;
  /** Whether execution was cancelled by user */
  cancelled: boolean;
  /** Debug mode flag */
  debugMode: boolean;
}

// ================================
// EVENT TYPE DEFINITIONS
// ================================

export type MacroExecutionEvent =
  | { type: 'START_EXECUTION'; ticker: string; debugMode?: boolean }
  | { type: 'STEP_COMPLETED'; stepId: number; result: StepResult }
  | { type: 'STEP_FAILED'; stepId: number; error: Error; retryable?: boolean }
  | { type: 'STEP_TIMEOUT'; stepId: number; error: Error }
  | { type: 'RETRY_STEP'; stepId: number }
  | { type: 'CANCEL_EXECUTION'; reason?: string }
  | { type: 'RESET'; }
  | { type: 'UPDATE_TIMEOUT_CONFIG'; config: Partial<TimeoutConfig> }
  | { type: 'SET_DEBUG_MODE'; enabled: boolean }
  | { type: 'EXPIRATION_SELECTED'; expiration: string }
  | { type: 'PREREQUISITES_VALIDATED'; stepId: number; valid: boolean }
  | { type: 'PERFORMANCE_UPDATE'; metrics: Partial<PerformanceMetrics> };

// ================================
// STATE VALUE TYPES
// ================================

export type MacroExecutionStateValue =
  | 'idle'
  | 'initializing'
  | 'validatingPrerequisites'
  | 'executing'
  | 'retrying'
  | 'completed'
  | 'error'
  | 'cancelled'
  | 'timeout';

export interface MacroExecutionState {
  value: MacroExecutionStateValue;
  context: MacroExecutionContext;
}

// ================================
// GUARD TYPES
// ================================

export interface MacroGuardParams {
  stepId?: number;
  maxRetries?: number;
  requiredData?: string[];
}

export type MacroGuard = 
  | 'canExecuteStep'
  | 'hasValidExpiration'
  | 'canRetryStep'
  | 'hasRequiredData'
  | 'isWithinRetryLimit'
  | 'prerequisitesMet';

// ================================
// ACTION TYPES
// ================================

export type MacroAction =
  | 'initializeContext'
  | 'updateStepResult'
  | 'incrementRetryCount'
  | 'setError'
  | 'clearError'
  | 'markStepCompleted'
  | 'resetExecution'
  | 'updatePerformanceMetrics'
  | 'logDebugInfo'
  | 'cancelExecution';

// ================================
// SERVICE TYPES
// ================================

export interface MacroService {
  /** Service identifier */
  id: string;
  /** Service implementation */
  implementation: (context: MacroExecutionContext, event: MacroExecutionEvent) => Promise<any>;
  /** Timeout for this service */
  timeout?: number;
  /** Whether service supports retry */
  retryable: boolean;
}

export type MacroServiceId =
  | 'fetchExpirations'
  | 'fetchStockData'
  | 'performAIAnalysis'
  | 'validatePrerequisites'
  | 'executeStep'
  | 'performRetry';

// ================================
// CONFIGURATION TYPES
// ================================

export interface MacroMachineConfig {
  /** Machine identifier */
  id: string;
  /** Target ticker */
  ticker: string;
  /** Steps to execute */
  steps: MacroStep[];
  /** Timeout configuration */
  timeouts: TimeoutConfig;
  /** Debug mode settings */
  debug: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    logSteps: boolean;
    logTransitions: boolean;
  };
}

// ================================
// DEFAULT CONFIGURATIONS
// ================================

export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  stepTimeout: 45000, // 45 seconds
  maxRetries: 2,
  backoffMultiplier: 2,
  baseRetryDelay: 1000 // 1 second
};

export const DEFAULT_PERFORMANCE_METRICS: PerformanceMetrics = {
  totalDuration: 0,
  stepDurations: new Map(),
  retryCount: 0,
  timeoutCount: 0
};

// ================================
// MACRO STEPS CONFIGURATION
// ================================

export const MACRO_STEPS: MacroStep[] = [
  {
    id: 1,
    name: 'Fetch Expirations',
    description: 'Retrieve available options expiration dates',
    prerequisites: [
      {
        type: 'context_property',
        property: 'ticker',
        validator: (ctx) => Boolean(ctx.ticker)
      }
    ],
    retryable: true,
    timeout: 30000
  },
  {
    id: 2,
    name: 'Get Stock Data',
    description: 'Fetch current stock snapshot and market data',
    prerequisites: [
      {
        type: 'context_property',
        property: 'selectedExpiration',
        validator: (ctx) => Boolean(ctx.selectedExpiration)
      }
    ],
    retryable: true,
    timeout: 30000
  },
  {
    id: 3,
    name: 'AI Takeaways',
    description: 'Generate AI-powered stock analysis and insights',
    prerequisites: [
      {
        type: 'data_exists',
        property: 'stockData',
        validator: (ctx) => ctx.stepResults.has(2) && ctx.stepResults.get(2)?.status === 'success'
      }
    ],
    retryable: true,
    timeout: 60000
  },
  {
    id: 4,
    name: 'AI Options',
    description: 'Generate AI-powered options trading recommendations',
    prerequisites: [
      {
        type: 'data_exists',
        property: 'aiTakeaways',
        validator: (ctx) => ctx.stepResults.has(3) && ctx.stepResults.get(3)?.status === 'success'
      }
    ],
    retryable: true,
    timeout: 60000
  }
];