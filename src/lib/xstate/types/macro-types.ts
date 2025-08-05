/**
 * Core XState Type Definitions for Macro Execution System
 * 
 * This file defines the complete TypeScript interfaces for the XState-based
 * macro execution system, providing type safety and IntelliSense support.
 */

// ================================
// CORE TICKER TYPES
// ================================

/** Supported ticker symbols in the StockSage application */
export type SupportedTicker = 'NVDA' | 'SPY';

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

/** String identifiers for macro steps - compatible with React components */
export type MacroStepId = 
  | 'fetchExpirations'
  | 'getStockData' 
  | 'generateAITakeaways'
  | 'generateAIOptions';

/** Numeric identifiers for macro steps - compatible with XState machines */
export type MacroStepNumber = 1 | 2 | 3 | 4;

/** Union type supporting both string and numeric step identifiers */
export type MacroStep = MacroStepId | MacroStepNumber;

/** MacroStep type constraint for index operations */
export type MacroStepKey = Extract<MacroStep, string | number>;


/** Convert MacroStep to string for use as object key */
export function macroStepToKey(step: MacroStep): string {
  return String(step);
}

export interface StepResult {
  /** Unique identifier for the step - supports both string and number */
  stepId: MacroStep;
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

/** Full step configuration interface */
export interface MacroStepConfig {
  /** Unique step identifier */
  id: MacroStepNumber;
  /** String identifier for React compatibility */
  stepId: MacroStepId;
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
  /** Results from completed steps - supports both string and numeric keys */
  stepResults: Map<MacroStep, StepResult>;
  /** Currently executing step - supports both string and numeric identifiers */
  currentStep: MacroStep;
  /** Total number of steps in the execution */
  totalSteps: number;
  /** Array of completed step IDs - supports both string and numeric identifiers */
  completedSteps: MacroStep[];
  /** Current error state */
  error: Error | null;
  /** Timeout and retry configuration */
  timeoutSettings: TimeoutConfig;
  /** Execution start timestamp */
  startTime: number | null;
  /** Execution progress information */
  progress?: {
    percentage: number;
    stage: string;
    details?: string;
    stepProgress?: number;
    overallProgress?: number;
  };
  /** Performance tracking metrics */
  performance: PerformanceMetrics;
  /** Current retry attempt for the current step */
  currentRetryAttempt: number;
  /** Whether execution was cancelled by user */
  cancelled: boolean;
  /** Debug mode flag */
  debugMode: boolean;
  /** Step start times for performance tracking */
  stepStartTimes?: Record<string, number>;
  /** Step end times for performance tracking */
  stepEndTimes?: Record<string, number>;
  /** Step errors for error tracking */
  stepErrors?: Record<string, Error>;
}

// ================================
// EVENT TYPE DEFINITIONS
// ================================

export type MacroExecutionEvent =
  | { type: 'START_EXECUTION'; ticker: string; debugMode?: boolean }
  | { type: 'STEP_COMPLETED'; stepId: MacroStep; result: StepResult }
  | { type: 'STEP_FAILED'; stepId: MacroStep; error: Error; retryable?: boolean }
  | { type: 'STEP_TIMEOUT'; stepId: MacroStep; error: Error }
  | { type: 'RETRY_STEP'; stepId: MacroStep }
  | { type: 'CANCEL_EXECUTION'; reason?: string }
  | { type: 'RESET'; }
  | { type: 'UPDATE_TIMEOUT_CONFIG'; config: Partial<TimeoutConfig> }
  | { type: 'SET_DEBUG_MODE'; enabled: boolean }
  | { type: 'EXPIRATION_SELECTED'; expiration: string }
  // Advanced parallel execution events
  | { type: 'START_PARALLEL_EXECUTION'; tickers?: string[]; config?: any }
  | { type: 'INITIALIZATION_COMPLETE'; actorId?: string }
  | { type: 'INITIALIZATION_FAILED'; actorId?: string; error: Error }
  | { type: 'ALL_ACTORS_SPAWNED'; count: number }
  | { type: 'TICKER_EXECUTION_COMPLETE'; ticker: string; result?: any }
  | { type: 'SYNCHRONIZATION_COMPLETE'; synchronizationPoint: string }
  | { type: 'SYNCHRONIZATION_TIMEOUT'; synchronizationPoint: string }
  | { type: 'RESOURCE_RELEASED'; resourceId: string; resourceType: string }
  | { type: 'RETRY_PARALLEL_EXECUTION'; reason?: string }
  | { type: 'COMPOSITION_ERROR_OCCURRED'; machineId: string; error: Error }
  | { type: 'SPAWN_FAILED'; actorId?: string; error: Error }
  | { type: 'ALL_TICKERS_COMPLETE'; results: any[] }
  | { type: 'PREREQUISITES_VALIDATED'; stepId: MacroStep; valid: boolean }
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
  steps: MacroStepConfig[];
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

/** Step mapping for conversion between numeric and string identifiers */
export const STEP_ID_MAP: Record<MacroStepNumber, MacroStepId> = {
  1: 'fetchExpirations',
  2: 'getStockData',
  3: 'generateAITakeaways',
  4: 'generateAIOptions'
} as const;

/** Reverse mapping for conversion from string to numeric identifiers */
export const STEP_NUMBER_MAP: Record<MacroStepId, MacroStepNumber> = {
  'fetchExpirations': 1,
  'getStockData': 2,
  'generateAITakeaways': 3,
  'generateAIOptions': 4
} as const;

export const MACRO_STEPS: MacroStepConfig[] = [
  {
    id: 1,
    stepId: 'fetchExpirations',
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
    stepId: 'getStockData',
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
    stepId: 'generateAITakeaways',
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
    stepId: 'generateAIOptions',
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

// ================================
// UTILITY FUNCTIONS
// ================================

/** Convert numeric step ID to string identifier */
export function stepNumberToId(stepNumber: MacroStepNumber): MacroStepId {
  return STEP_ID_MAP[stepNumber];
}

/** Convert string step ID to numeric identifier */
export function stepIdToNumber(stepId: MacroStepId): MacroStepNumber {
  return STEP_NUMBER_MAP[stepId];
}

/** Check if a value is a valid MacroStep */
export function isMacroStep(value: unknown): value is MacroStep {
  return typeof value === 'string' && Object.values(STEP_ID_MAP).includes(value as MacroStepId) ||
         typeof value === 'number' && Object.keys(STEP_ID_MAP).map(Number).includes(value as MacroStepNumber);
}

/** Get step configuration by step identifier */
export function getStepConfig(step: MacroStep): MacroStepConfig | undefined {
  return MACRO_STEPS.find(config => 
    config.id === step || config.stepId === step
  );
}

/** Convert any MacroStep to its string identifier for React compatibility */
export function toStepId(step: MacroStep): MacroStepId {
  if (typeof step === 'string') {
    return step;
  }
  return stepNumberToId(step);
}

/** Convert any MacroStep to its numeric identifier for XState compatibility */
export function toStepNumber(step: MacroStep): MacroStepNumber {
  if (typeof step === 'number') {
    return step;
  }
  return stepIdToNumber(step);
}