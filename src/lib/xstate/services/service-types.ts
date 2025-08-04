/**
 * @fileOverview Service interfaces and types for XState-compatible macro services
 * 
 * Defines comprehensive service interfaces that wrap existing StockSage macro operations
 * into XState-compatible services with timeout protection, retry logic, and performance metrics.
 */

export interface MacroServiceOptions {
  /** Timeout in milliseconds (default: 45000 = 45 seconds) */
  timeout?: number;
  /** Maximum retry attempts (default: 2) */
  maxRetries?: number;
  /** Enable debug logging */
  enableDebug?: boolean;
  /** Ticker symbol for the operation */
  ticker: string;
  /** Unique execution ID for tracking and logging */
  executionId: string;
  /** Optional expiration date for macro context */
  macroExpiration?: string;
  /** Cancellation token for aborting operations */
  cancellationToken?: AbortSignal;
}

export interface MacroServiceResult<T = any> {
  /** Operation success status */
  success: boolean;
  /** Result data (if successful) */
  data?: T;
  /** Error information (if failed) */
  error?: Error;
  /** Operation duration in milliseconds */
  duration: number;
  /** Number of retry attempts used */
  retryCount: number;
  /** Step identifier */
  stepId: number;
  /** Performance metrics */
  metrics?: {
    startTime: number;
    endTime: number;
    networkLatency?: number;
    processTime?: number;
  };
  /** Additional metadata */
  metadata?: {
    wasTimeout?: boolean;
    wasCancelled?: boolean;
    wasRetried?: boolean;
    originalError?: string;
  };
}

export interface MacroServiceConfig {
  /** Service name for logging and identification */
  name: string;
  /** Service description */
  description: string;
  /** Default timeout (can be overridden per call) */
  defaultTimeout: number;
  /** Default retry count */
  defaultRetries: number;
  /** Service dependencies (other services that must complete first) */
  dependencies?: string[];
  /** Whether this service can be skipped if dependencies fail */
  optional?: boolean;
  /** Service validation function */
  canExecute?: (options: MacroServiceOptions) => boolean;
}

export interface ServiceError extends Error {
  /** Error type classification */
  type: 'timeout' | 'network' | 'validation' | 'api' | 'cancellation' | 'unknown';
  /** Whether the error is retryable */
  retryable: boolean;
  /** Original error if this is a wrapped error */
  originalError?: Error;
  /** Service context information */
  serviceContext?: {
    serviceName: string;
    stepId: number;
    ticker: string;
    executionId: string;
    attempt: number;
  };
}

export interface ExpirationData {
  availableExpirations: string[];
  selectedExpiration: string;
  autoSelected: boolean;
  source: 'polygon' | 'cache';
}

export interface StockDataResult {
  stockSnapshotJson: string;
  marketStatusJson: string;
  technicalIndicatorsJson: string;
  optionsChainJson: string;
  currentPrice: number;
  dataSource: 'polygon';
  fetchTimestamp: number;
}

export interface AITakeawaysResult {
  aiKeyTakeawaysJson: string;
  promptUsed: string;
  processingTime: number;
  tokenCount?: number;
  modelUsed: 'gemini-2.5-flash-lite';
}

export interface AIOptionsResult {
  aiOptionsAnalysisJson: string;
  promptUsed: string;
  processingTime: number;
  tokenCount?: number;
  modelUsed: 'gemini-2.5-flash-lite';
  strategiesGenerated: number;
}

// Service function type definitions
export type FetchExpirationsService = (
  options: MacroServiceOptions
) => Promise<MacroServiceResult<ExpirationData>>;

export type GetStockDataService = (
  options: MacroServiceOptions
) => Promise<MacroServiceResult<StockDataResult>>;

export type AITakeawaysService = (
  options: MacroServiceOptions
) => Promise<MacroServiceResult<AITakeawaysResult>>;

export type AIOptionsService = (
  options: MacroServiceOptions
) => Promise<MacroServiceResult<AIOptionsResult>>;

// Orchestrator service type
export interface MacroOrchestrator {
  /** Execute all macro steps in sequence */
  executeAll: (options: MacroServiceOptions) => Promise<MacroServiceResult[]>;
  /** Execute a single step by ID */
  executeStep: (stepId: number, options: MacroServiceOptions) => Promise<MacroServiceResult>;
  /** Get service configuration */
  getServiceConfig: (stepId: number) => MacroServiceConfig | undefined;
  /** Validate if all services can execute */
  validateExecution: (options: MacroServiceOptions) => boolean;
  /** Cancel ongoing execution */
  cancel: (executionId: string) => void;
}

// Service registry interface
export interface ServiceRegistry {
  /** Register a service */
  register: (stepId: number, service: any, config: MacroServiceConfig) => void;
  /** Get a service by step ID */
  get: (stepId: number) => any;
  /** Get service configuration */
  getConfig: (stepId: number) => MacroServiceConfig | undefined;
  /** Check if service is registered */
  has: (stepId: number) => boolean;
  /** List all registered services */
  list: () => Array<{ stepId: number; config: MacroServiceConfig }>;
}

// Context type for XState integration
export interface MacroExecutionContext {
  /** Current ticker being processed */
  ticker: string;
  /** Unique execution ID */
  executionId: string;
  /** Macro-isolated expiration date */
  selectedExpiration: string | null;
  /** Current step being executed */
  currentStep: number;
  /** Completed steps */
  completedSteps: number[];
  /** Step results */
  stepResults: Map<number, MacroServiceResult>;
  /** Execution start time */
  startTime: number;
  /** Total execution duration */
  totalDuration?: number;
  /** Execution status */
  status: 'idle' | 'executing' | 'completed' | 'failed' | 'cancelled';
  /** Last error */
  lastError?: ServiceError;
  /** Performance metrics */
  performanceMetrics?: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    averageStepDuration: number;
    totalNetworkTime: number;
    totalProcessTime: number;
  };
}

// Event types for XState machine
export type MacroExecutionEvent =
  | { type: 'START_EXECUTION'; ticker: string; executionId: string }
  | { type: 'STEP_COMPLETED'; stepId: number; result: MacroServiceResult }
  | { type: 'STEP_FAILED'; stepId: number; error: ServiceError }
  | { type: 'EXECUTION_CANCELLED'; reason: string }
  | { type: 'EXECUTION_COMPLETED'; results: MacroServiceResult[] }
  | { type: 'RETRY_STEP'; stepId: number }
  | { type: 'SKIP_STEP'; stepId: number; reason: string };

// Service creation utilities
export interface ServiceFactory {
  /** Create fetch expirations service */
  createFetchExpirationsService: () => FetchExpirationsService;
  /** Create stock data service */
  createGetStockDataService: () => GetStockDataService;
  /** Create AI takeaways service */
  createAITakeawaysService: () => AITakeawaysService;
  /** Create AI options service */
  createAIOptionsService: () => AIOptionsService;
  /** Create macro orchestrator */
  createMacroOrchestrator: () => MacroOrchestrator;
  /** Create service registry */
  createServiceRegistry: () => ServiceRegistry;
}

// Utility type for service creation
export type ServiceCreator<T> = (config: MacroServiceConfig) => T;

// Re-export for convenience
export type {
  MacroServiceOptions as ServiceOptions,
  MacroServiceResult as ServiceResult,
  MacroServiceConfig as ServiceConfig,
};