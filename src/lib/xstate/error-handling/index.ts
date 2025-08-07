/**
 * Advanced Error Handling System - Main Export Module
 * 
 * Comprehensive error handling and recovery system with circuit breakers,
 * retry strategies, compensation transactions, and intelligent recovery.
 * 
 * This module provides the main exports for the advanced error handling system,
 * integrating with existing v4.4.3.5 AI timeout protection and XState infrastructure.
 */

// ================================
// CORE TYPES AND INTERFACES
// ================================
export type {
  // Error classification types
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  ClassifiedError,
  ErrorContext,
  ErrorClassification,
  ClassificationRule,
  
  // Circuit breaker types
  CircuitBreakerState,
  CircuitBreakerConfig,
  CircuitBreakerMetrics,
  CircuitBreakerEvent,
  
  // Retry strategy types
  RetryConfig,
  RetryAttempt,
  RetryResult,
  
  // Compensation transaction types
  CompensationAction,
  TransactionStep,
  TransactionContext,
  TransactionResult,
  TransactionLogEntry,
  
  // Recovery system types
  RecoveryAction,
  RecoveryResult,
  RecoveryPlan,
  
  // Error boundary types
  ErrorBoundaryState,
  ErrorBoundaryConfig,
  ErrorBoundaryFallbackProps,
  
  // Reporting and monitoring types
  ErrorReport,
  SystemHealthMetrics,
  ErrorHandlingConfig,
  
  // Utility types
  ErrorHandler,
  ErrorHandlerFactory
} from './error-types';

// Type guards and utility types
export {
  isClassifiedError,
  isCircuitBreakerEvent,
  isTransactionResult
} from './error-types';

// ================================
// ERROR CLASSIFICATION SYSTEM
// ================================
export {
  ErrorClassifier,
  DEFAULT_CLASSIFICATION_RULES,
  createErrorClassifier,
  globalErrorClassifier,
  classifyError,
  createClassifiedError,
  createErrorContext
} from './error-classifier';

// ================================
// CIRCUIT BREAKER SYSTEM
// ================================
export {
  CircuitBreaker,
  CircuitBreakerRegistry,
  CIRCUIT_BREAKER_CONFIGS,
  globalCircuitBreakerRegistry,
  createCircuitBreaker,
  executeWithCircuitBreaker,
  getCircuitBreakerHealth,
  getAllCircuitBreakersHealth
} from './circuit-breaker';

// ================================
// RETRY STRATEGIES SYSTEM
// ================================
export {
  // Strategy implementations
  ExponentialBackoffRetryStrategy,
  LinearBackoffRetryStrategy,
  FixedDelayRetryStrategy,
  
  // Registry and management
  RetryStrategyRegistry,
  globalRetryRegistry,
  
  // Predefined configurations
  RETRY_CONFIGS,
  
  // Utility functions
  retryWithExponentialBackoff,
  retryWithLinearBackoff,
  retryWithFixedDelay,
  createAIServiceRetry,
  enhanceExistingRetry
} from './retry-strategies';

// Types from retry strategies
export type {
  RetryStrategy,
  RetryContext
} from './retry-strategies';

// ================================
// COMPENSATION TRANSACTION SYSTEM
// ================================
export {
  CompensationManager,
  TransactionBuilder,
  globalCompensationManager,
  createTransaction,
  executeCompensatableOperation,
  createMacroTransaction
} from './compensation-manager';

// ================================
// RECOVERY STRATEGIES SYSTEM
// ================================
export {
  // Recovery action implementations
  RetryRecoveryAction,
  CircuitBreakerRecoveryAction,
  FallbackRecoveryAction,
  GracefulDegradationRecoveryAction,
  CompensationRecoveryAction,
  UserInterventionRecoveryAction,
  
  // Recovery manager
  RecoveryStrategyManager,
  globalRecoveryManager,
  
  // Utility functions
  executeErrorRecovery,
  createErrorRecoveryPlan,
  getFallbackRecoveryAction,
  getGracefulDegradationAction
} from './recovery-strategies';

// ================================
// ERROR BOUNDARY COMPONENTS
// ================================
export {
  AdvancedErrorBoundary,
  DefaultErrorFallback,
  withErrorBoundary,
  useErrorHandler
} from './error-boundary';

// Error boundary types
export type {
  ErrorBoundaryProps
} from './error-boundary';

// ================================
// IMPORTS FOR IMPLEMENTATION
// ================================
import { createErrorContext, globalErrorClassifier } from './error-classifier';
import type { ErrorContext } from './error-types';
import { globalRecoveryManager } from './recovery-strategies';
import { globalCircuitBreakerRegistry, CIRCUIT_BREAKER_CONFIGS } from './circuit-breaker';
import { globalRetryRegistry, RETRY_CONFIGS } from './retry-strategies';
import { globalCompensationManager, createMacroTransaction } from './compensation-manager';
import { executeWithCircuitBreaker } from './circuit-breaker';
import { enhanceExistingRetry } from './retry-strategies';
import { AdvancedErrorBoundary, withErrorBoundary } from './error-boundary';

// ================================
// INTEGRATION UTILITIES
// ================================

/**
 * Initialize the complete error handling system with StockSage-specific configuration
 */
export const initializeErrorHandlingSystem = (config?: {
  enableGlobalErrorReporting?: boolean;
  enableAutoRecovery?: boolean;
  aiServiceTimeoutMs?: number;
  maxRetryAttempts?: number;
  enableCircuitBreakers?: boolean;
  debugMode?: boolean;
}) => {
  const {
    enableGlobalErrorReporting = true,
    enableAutoRecovery = true,
    aiServiceTimeoutMs = 45000, // Match v4.4.3.5 timeout
    maxRetryAttempts = 2, // Match existing retry logic
    enableCircuitBreakers = true,
    debugMode = process.env.NODE_ENV === 'development'
  } = config || {};

  console.log('🛡️ Initializing Advanced Error Handling System...');

  // Set up global error handlers if in browser environment
  if (typeof window !== 'undefined' && enableGlobalErrorReporting) {
    window.addEventListener('error', (event) => {
      const context = createErrorContext({
        operation: 'global-error-handler',
        component: 'window',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript-error'
        }
      });

      const classifiedError = globalErrorClassifier.createClassifiedError(event.error, context);
      
      console.error('[GlobalErrorHandler] Unhandled error:', classifiedError);
      
      if (enableAutoRecovery) {
        globalRecoveryManager.executeRecoveryPlan(classifiedError, context).catch((recoveryError: any) => {
          console.error('[GlobalErrorHandler] Recovery failed:', recoveryError);
        });
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      
      const context = createErrorContext({
        operation: 'global-promise-rejection',
        component: 'window',
        metadata: {
          type: 'unhandled-promise-rejection',
          reason: event.reason
        }
      });

      const classifiedError = globalErrorClassifier.createClassifiedError(error, context);
      
      console.error('[GlobalErrorHandler] Unhandled promise rejection:', classifiedError);
      
      if (enableAutoRecovery) {
        globalRecoveryManager.executeRecoveryPlan(classifiedError, context).catch((recoveryError: any) => {
          console.error('[GlobalErrorHandler] Recovery failed:', recoveryError);
        });
      }
    });
  }

  // Configure AI service circuit breaker to match v4.4.3.5 patterns
  if (enableCircuitBreakers) {
    globalCircuitBreakerRegistry.setDefaultConfig('ai-service', {
      ...CIRCUIT_BREAKER_CONFIGS.AI_SERVICE,
      timeout: aiServiceTimeoutMs
    });
  }

  // Configure retry strategies to match existing patterns
  globalRetryRegistry.setDefaultConfig('ai-service', {
    ...RETRY_CONFIGS.AI_SERVICE,
    maxAttempts: maxRetryAttempts,
    timeout: aiServiceTimeoutMs
  });

  console.log('✅ Advanced Error Handling System initialized:', {
    globalErrorReporting: enableGlobalErrorReporting,
    autoRecovery: enableAutoRecovery,
    aiServiceTimeout: aiServiceTimeoutMs,
    maxRetryAttempts,
    circuitBreakers: enableCircuitBreakers,
    debugMode
  });

  return {
    errorClassifier: globalErrorClassifier,
    circuitBreakerRegistry: globalCircuitBreakerRegistry,
    retryRegistry: globalRetryRegistry,
    compensationManager: globalCompensationManager,
    recoveryManager: globalRecoveryManager
  };
};

/**
 * Enhanced version of existing v4.4.3.5 timeout protection with full error handling
 */
export const createEnhancedAITimeoutWrapper = <T>(
  operation: () => Promise<T>,
  options?: {
    timeoutMs?: number;
    maxRetries?: number;
    enableCircuitBreaker?: boolean;
    enableCompensation?: boolean;
    context?: Partial<ErrorContext>;
  }
): Promise<T> => {
  const {
    timeoutMs = 45000,
    maxRetries = 2,
    enableCircuitBreaker = true,
    enableCompensation = false,
    context = {}
  } = options || {};

  const errorContext = createErrorContext({
    operation: 'enhanced-ai-operation',
    component: 'ai-service',
    ...context
  });

  const wrappedOperation = async (): Promise<T> => {
    if (enableCircuitBreaker) {
      return executeWithCircuitBreaker(
        'ai-service',
        operation,
        {
          circuitBreakerConfig: {
            timeout: timeoutMs
          },
          context: {
            operation: errorContext.operation,
            metadata: errorContext.metadata
          }
        }
      );
    } else {
      // Use existing v4.4.3.5 timeout pattern
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
      });
      
      return Promise.race([operation(), timeoutPromise]);
    }
  };

  if (maxRetries > 1) {
    return enhanceExistingRetry(wrappedOperation, maxRetries, {
      operation: errorContext.operation,
      component: errorContext.component,
      metadata: errorContext.metadata
    });
  } else {
    return wrappedOperation();
  }
};

/**
 * Create a macro automation transaction wrapper for StockSage
 */
export const createMacroAutomationWrapper = (
  ticker: string,
  steps: Array<{
    id: string;
    name: string;
    execute: () => Promise<unknown>;
    rollback: () => Promise<void>;
    validate?: () => Promise<boolean>;
  }>
) => {
  const transactionBuilder = createMacroTransaction(ticker, steps);
  const { transactionId, steps: transactionSteps } = transactionBuilder.build();

  return {
    transactionId,
    execute: () => globalCompensationManager.executeTransaction(transactionId, transactionSteps),
    cancel: (reason?: string) => globalCompensationManager.cancelTransaction(transactionId, reason),
    getStatus: () => globalCompensationManager.getTransactionStatus(transactionId)
  };
};

/**
 * Get system health summary
 */
export const getSystemHealthSummary = () => {
  const circuitBreakerHealth = globalCircuitBreakerRegistry.getHealthSummary();
  const recoveryStats = globalRecoveryManager.getRecoveryStatistics();
  const compensationStats = globalCompensationManager.getStatistics();

  // Determine overall system status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (!circuitBreakerHealth.healthy || recoveryStats.successRate < 0.8) {
    status = 'degraded';
  }
  
  if (compensationStats.activeTransactions > 5 || circuitBreakerHealth.openBreakers.length > 2) {
    status = 'unhealthy';
  }

  return {
    errorHandling: {
      circuitBreakers: circuitBreakerHealth,
      recovery: recoveryStats,
      compensation: compensationStats
    },
    timestamp: Date.now(),
    status
  };
};

// ================================
// VERSION AND METADATA
// ================================
export const ERROR_HANDLING_VERSION = '1.0.0';
export const INTEGRATION_VERSION = 'v4.4.3.5-compatible';

/**
 * System metadata for monitoring and debugging
 */
export const getSystemMetadata = () => ({
  version: ERROR_HANDLING_VERSION,
  integrationVersion: INTEGRATION_VERSION,
  features: {
    errorClassification: true,
    circuitBreakers: true,
    retryStrategies: true,
    compensationTransactions: true,
    recoveryStrategies: true,
    errorBoundaries: true,
    v4435Integration: true
  },
  components: {
    errorClassifier: globalErrorClassifier.constructor.name,
    circuitBreakerRegistry: globalCircuitBreakerRegistry.constructor.name,
    retryRegistry: globalRetryRegistry.constructor.name,
    compensationManager: globalCompensationManager.constructor.name,
    recoveryManager: globalRecoveryManager.constructor.name
  },
  initialized: Date.now()
});

// ================================
// DEFAULT EXPORT
// ================================
export default {
  // Main system initialization
  initialize: initializeErrorHandlingSystem,
  
  // Core systems
  classifier: globalErrorClassifier,
  circuitBreakers: globalCircuitBreakerRegistry,
  retry: globalRetryRegistry,
  compensation: globalCompensationManager,
  recovery: globalRecoveryManager,
  
  // Utility functions
  createEnhancedAIWrapper: createEnhancedAITimeoutWrapper,
  createMacroWrapper: createMacroAutomationWrapper,
  getHealthSummary: getSystemHealthSummary,
  getMetadata: getSystemMetadata,
  
  // React components
  ErrorBoundary: AdvancedErrorBoundary,
  withErrorBoundary,
  
  // Version info
  version: ERROR_HANDLING_VERSION,
  integrationVersion: INTEGRATION_VERSION
};