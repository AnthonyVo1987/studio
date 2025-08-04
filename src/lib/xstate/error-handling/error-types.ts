/**
 * Error Handling System - Core Types and Interfaces
 * 
 * Comprehensive type definitions for the advanced error handling and recovery system.
 * Integrates with existing v4.4.3.5 AI timeout protection and XState infrastructure.
 */

// ================================
// CORE ERROR CATEGORIES
// ================================

/**
 * Primary error categories for intelligent classification
 */
export enum ErrorCategory {
  NETWORK = 'network',
  TIMEOUT = 'timeout', 
  AI_SERVICE = 'ai_service',
  DATA_VALIDATION = 'data_validation',
  BUSINESS_LOGIC = 'business_logic',
  UI_RENDER = 'ui_render',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

/**
 * Error severity levels for recovery strategy selection
 */
export enum ErrorSeverity {
  LOW = 'low',           // Warning-level, graceful degradation possible
  MEDIUM = 'medium',     // Error-level, retry strategies applicable
  HIGH = 'high',         // Critical error, compensation required
  CRITICAL = 'critical'  // System-level failure, full rollback needed
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategy {
  RETRY = 'retry',                    // Simple retry with backoff
  CIRCUIT_BREAKER = 'circuit_breaker', // Circuit breaker pattern
  COMPENSATION = 'compensation',       // Rollback transaction
  FALLBACK = 'fallback',              // Use fallback data/service
  GRACEFUL_DEGRADATION = 'graceful_degradation', // Disable feature
  USER_INTERVENTION = 'user_intervention',       // Require user action
  SYSTEM_RESTART = 'system_restart'              // Full system reset
}

// ================================
// ERROR CLASSIFICATION TYPES
// ================================

/**
 * Base error interface with classification metadata
 */
export interface ClassifiedError extends Error {
  readonly id: string;
  readonly timestamp: Date;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly isRetryable: boolean;
  readonly context: ErrorContext;
  readonly classification: ErrorClassification;
  readonly originalError?: Error;
}

/**
 * Error context information for debugging and recovery
 */
export interface ErrorContext {
  readonly ticker?: string;
  readonly operation?: string;
  readonly step?: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly requestId?: string;
  readonly component?: string;
  readonly stackTrace?: string;
  readonly userAgent?: string;
  readonly timestamp: string;
  readonly environment: 'development' | 'production' | 'test';
  readonly version: string;
  readonly metadata: Record<string, unknown>;
}

/**
 * Error classification result with confidence scoring
 */
export interface ErrorClassification {
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly confidence: number; // 0-1 confidence score
  readonly suggestedStrategy: RecoveryStrategy;
  readonly isRetryable: boolean;
  readonly estimatedRecoveryTime: number; // milliseconds
  readonly similarErrors: string[]; // IDs of similar past errors
  readonly classificationRules: ClassificationRule[];
}

/**
 * Classification rule that was matched
 */
export interface ClassificationRule {
  readonly id: string;
  readonly name: string; 
  readonly pattern: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly weight: number;
  readonly description: string;
}

// ================================
// CIRCUIT BREAKER TYPES
// ================================

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing, rejecting requests
  HALF_OPEN = 'half_open' // Testing recovery
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  readonly name: string;
  readonly failureThreshold: number;    // Number of failures to open circuit
  readonly successThreshold: number;    // Number of successes to close circuit  
  readonly timeout: number;             // Time before attempting half-open (ms)
  readonly resetTimeout: number;        // Time before reset attempt (ms)
  readonly monitoringWindow: number;    // Time window for failure counting (ms)
  readonly halfOpenMaxCalls: number;    // Max calls in half-open state
  readonly errorFilter?: (error: Error) => boolean; // Which errors count as failures
}

/**
 * Circuit breaker metrics and state
 */
export interface CircuitBreakerMetrics {
  readonly state: CircuitBreakerState;
  readonly failureCount: number;
  readonly successCount: number;
  readonly lastFailureTime: number;
  readonly lastSuccessTime: number;
  readonly nextAttemptTime: number;
  readonly totalRequests: number;
  readonly totalFailures: number;
  readonly totalSuccesses: number;
  readonly averageResponseTime: number;
  readonly uptime: number; // Percentage
}

/**
 * Circuit breaker event types
 */
export interface CircuitBreakerEvent {
  readonly type: 'opened' | 'closed' | 'half_opened' | 'failure' | 'success';
  readonly timestamp: number;
  readonly metrics: CircuitBreakerMetrics;
  readonly error?: Error;
  readonly duration?: number;
}

// ================================
// RETRY STRATEGY TYPES  
// ================================

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly multiplier: number;
  readonly jitterFactor: number; // 0-1 for randomization
  readonly retryableErrors: ErrorCategory[];
  readonly nonRetryableErrors: ErrorCategory[];
  readonly timeout: number; // Per-attempt timeout
  readonly exponentialBackoff: boolean;
  readonly customDelay?: (attempt: number, error: Error) => number;
}

/**
 * Retry attempt result
 */
export interface RetryAttempt {
  readonly attemptNumber: number;
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly success: boolean;
  readonly error?: Error;
  readonly delay: number; // Delay before next attempt
}

/**
 * Retry execution result
 */
export interface RetryResult<T = unknown> {
  readonly success: boolean;
  readonly result?: T;
  readonly error?: Error;
  readonly attempts: RetryAttempt[];
  readonly totalDuration: number;
  readonly finalAttempt: number;
  readonly exhausted: boolean;
}

// ================================
// COMPENSATION TRANSACTION TYPES
// ================================

/**
 * Compensation action definition
 */
export interface CompensationAction {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly execute: () => Promise<void>;
  readonly validate?: () => Promise<boolean>;
  readonly timeout: number;
  readonly retryable: boolean;
  readonly dependencies: string[]; // IDs of actions that must run first
  readonly priority: number; // Higher = runs first
}

/**
 * Transaction step with compensation
 */
export interface TransactionStep {
  readonly id: string;
  readonly name: string;
  readonly execute: () => Promise<unknown>;
  readonly compensate: CompensationAction;
  readonly validate?: () => Promise<boolean>;
  readonly timeout: number;
  readonly critical: boolean; // If true, failure stops entire transaction
}

/**
 * Transaction execution context
 */
export interface TransactionContext {
  readonly transactionId: string;
  readonly steps: TransactionStep[];
  readonly executedSteps: string[];
  readonly compensatedSteps: string[];
  readonly startTime: number;
  readonly currentStep?: string;
  readonly metadata: Record<string, unknown>;
}

/**
 * Transaction execution result
 */
export interface TransactionResult {
  readonly success: boolean;
  readonly transactionId: string;
  readonly completedSteps: string[];
  readonly failedStep?: string;
  readonly compensatedSteps: string[];
  readonly error?: Error;
  readonly duration: number;
  readonly auditLog: TransactionLogEntry[];
}

/**
 * Transaction audit log entry
 */
export interface TransactionLogEntry {
  readonly timestamp: number;
  readonly type: 'step_start' | 'step_success' | 'step_failure' | 'compensation_start' | 'compensation_success' | 'compensation_failure';
  readonly stepId: string;
  readonly duration?: number;
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;
}

// ================================
// RECOVERY SYSTEM TYPES
// ================================

/**
 * Recovery action definition
 */
export interface RecoveryAction {
  readonly id: string;
  readonly name: string;
  readonly strategy: RecoveryStrategy;
  readonly execute: (error: ClassifiedError, context: ErrorContext) => Promise<RecoveryResult>;
  readonly canHandle: (error: ClassifiedError) => boolean;
  readonly priority: number;
  readonly timeout: number;
  readonly description: string;
}

/**
 * Recovery execution result
 */
export interface RecoveryResult {
  readonly success: boolean;
  readonly strategy: RecoveryStrategy;
  readonly actionId: string;
  readonly duration: number;
  readonly error?: Error;
  readonly metadata: Record<string, unknown>;
  readonly nextAction?: string; // Chain to another recovery action
}

/**
 * Recovery plan for a classified error
 */
export interface RecoveryPlan {
  readonly errorId: string;
  readonly actions: RecoveryAction[];
  readonly fallbackActions: RecoveryAction[];
  readonly estimatedDuration: number;
  readonly confidence: number;
  readonly description: string;
}

// ================================
// ERROR BOUNDARY TYPES
// ================================

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error?: Error;
  readonly errorInfo?: React.ErrorInfo;
  readonly errorId?: string;
  readonly classifiedError?: ClassifiedError;
  readonly recoveryPlan?: RecoveryPlan;
  readonly recoveryAttempts: number;
  readonly lastRecoveryTime?: number;
}

/**
 * Error boundary configuration
 */
export interface ErrorBoundaryConfig {
  readonly fallbackComponent?: React.ComponentType<ErrorBoundaryFallbackProps>;
  readonly enableRecovery: boolean;
  readonly maxRecoveryAttempts: number;
  readonly autoRecoveryDelay: number;
  readonly reportErrors: boolean;
  readonly onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  readonly onRecovery?: (error: Error) => void;
}

/**
 * Error boundary fallback component props
 */
export interface ErrorBoundaryFallbackProps {
  readonly error: Error;
  readonly errorInfo: React.ErrorInfo;
  readonly classifiedError?: ClassifiedError;
  readonly recoveryPlan?: RecoveryPlan;
  readonly onRetry: () => void;
  readonly onReset: () => void;
  readonly canRetry: boolean;
}

// ================================
// ERROR REPORTING TYPES
// ================================

/**
 * Error report for monitoring and analytics
 */
export interface ErrorReport {
  readonly id: string;
  readonly timestamp: number;
  readonly error: ClassifiedError;
  readonly context: ErrorContext;
  readonly classification: ErrorClassification;
  readonly recoveryAttempts: RecoveryResult[];
  readonly finalOutcome: 'recovered' | 'failed' | 'degraded';
  readonly userImpact: 'none' | 'minor' | 'moderate' | 'severe';
  readonly businessImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

/**
 * System health metrics
 */
export interface SystemHealthMetrics {
  readonly timestamp: number;
  readonly totalErrors: number;
  readonly errorsByCategory: Record<ErrorCategory, number>;
  readonly errorsBySeverity: Record<ErrorSeverity, number>;
  readonly circuitBreakerStates: Record<string, CircuitBreakerState>;
  readonly averageRecoveryTime: number;
  readonly successfulRecoveries: number;
  readonly failedRecoveries: number;
  readonly systemUptime: number;
  readonly performanceImpact: number; // 0-1 scale
}

// ================================
// CONFIGURATION TYPES
// ================================

/**
 * Master error handling system configuration
 */
export interface ErrorHandlingConfig {
  readonly circuitBreakers: Record<string, CircuitBreakerConfig>;
  readonly retryConfigs: Record<string, RetryConfig>;
  readonly recoveryActions: RecoveryAction[];
  readonly classificationRules: ClassificationRule[];
  readonly errorBoundary: ErrorBoundaryConfig;
  readonly monitoring: {
    readonly enabled: boolean;
    readonly reportingInterval: number;
    readonly metricsRetention: number;
    readonly alertThresholds: Record<string, number>;
  };
  readonly integration: {
    readonly existingTimeoutMs: number; // Integration with v4.4.3.5 timeout
    readonly respectExistingRetry: boolean;
    readonly preserveErrorMessages: boolean;
  };
}

// ================================
// UTILITY TYPES
// ================================

/**
 * Type guard for classified errors
 */
export const isClassifiedError = (error: unknown): error is ClassifiedError => {
  return (
    error instanceof Error &&
    'id' in error &&
    'category' in error &&
    'severity' in error &&
    'classification' in error
  );
};

/**
 * Type guard for circuit breaker events
 */
export const isCircuitBreakerEvent = (event: unknown): event is CircuitBreakerEvent => {
  return (
    typeof event === 'object' &&
    event !== null &&
    'type' in event &&
    'timestamp' in event &&
    'metrics' in event
  );
};

/**
 * Type guard for transaction results
 */
export const isTransactionResult = (result: unknown): result is TransactionResult => {
  return (
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    'transactionId' in result &&
    'completedSteps' in result
  );
};

/**
 * Factory type for creating error handling components
 */
export type ErrorHandlerFactory<T extends Record<string, unknown> = Record<string, unknown>> = {
  create: (config: T) => unknown;
  validate: (config: T) => boolean;
  dispose?: () => void;
};

/**
 * Generic error handler interface
 */
export interface ErrorHandler<TError = Error, TResult = unknown> {
  readonly name: string;
  readonly canHandle: (error: TError) => boolean;
  readonly handle: (error: TError, context?: ErrorContext) => Promise<TResult>;
  readonly dispose?: () => void;
}

// Export all types as a namespace for convenience
export namespace ErrorHandling {
  export type Category = ErrorCategory;
  export type Severity = ErrorSeverity;
  export type Strategy = RecoveryStrategy;
  export type State = CircuitBreakerState;
  export type Error = ClassifiedError;
  export type Context = ErrorContext;
  export type Classification = ErrorClassification;
  export type Config = ErrorHandlingConfig;
  export type Report = ErrorReport;
  export type Metrics = SystemHealthMetrics;
}