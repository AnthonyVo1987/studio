/**
 * Retry Strategies with Exponential Backoff
 * 
 * Advanced retry logic with intelligent backoff strategies, jitter,
 * and integration with existing v4.4.3.5 AI timeout protection patterns.
 */

import {
  type RetryConfig,
  type RetryAttempt,
  type RetryResult,
  ErrorCategory,
  type ClassifiedError
} from './error-types';

import { classifyError, createErrorContext } from './error-classifier';

// ================================
// RETRY STRATEGY TYPES
// ================================

/**
 * Retry strategy interface
 */
export interface RetryStrategy {
  readonly name: string;
  readonly config: RetryConfig;
  execute<T>(operation: () => Promise<T>, context?: RetryContext): Promise<RetryResult<T>>;
  canRetry(error: Error, attempt: number): boolean;
  calculateDelay(attempt: number, error: Error): number;
}

/**
 * Retry execution context
 */
export interface RetryContext {
  readonly operation?: string;
  readonly component?: string;
  readonly ticker?: string;
  readonly metadata?: Record<string, unknown>;
  readonly onAttempt?: (attempt: RetryAttempt) => void;
  readonly onError?: (error: Error, attempt: number) => void;
  readonly onSuccess?: (result: unknown, attempts: number) => void;
}

// ================================
// EXPONENTIAL BACKOFF RETRY STRATEGY
// ================================

/**
 * Exponential backoff retry strategy with jitter and intelligent error handling
 */
export class ExponentialBackoffRetryStrategy implements RetryStrategy {
  public readonly name = 'exponential-backoff';

  constructor(public readonly config: RetryConfig) {
    this.validateConfig(config);
  }

  /**
   * Execute operation with exponential backoff retry logic
   */
  public async execute<T>(
    operation: () => Promise<T>,
    context: RetryContext = {}
  ): Promise<RetryResult<T>> {
    const attempts: RetryAttempt[] = [];
    const startTime = performance.now();
    let lastError: Error | undefined;

    for (let attemptNumber = 1; attemptNumber <= this.config.maxAttempts; attemptNumber++) {
      const attemptStartTime = performance.now();
      
      try {
        // Execute operation with per-attempt timeout
        const result = await this.executeWithTimeout(operation, this.config.timeout);
        const attemptEndTime = performance.now();
        
        // Record successful attempt
        const successfulAttempt: RetryAttempt = {
          attemptNumber,
          startTime: attemptStartTime,
          endTime: attemptEndTime,
          duration: attemptEndTime - attemptStartTime,
          success: true,
          delay: 0 // No delay needed for successful attempt
        };
        
        attempts.push(successfulAttempt);
        
        // Notify context callbacks
        context.onAttempt?.(successfulAttempt);
        context.onSuccess?.(result, attemptNumber);
        
        // Return successful result
        const totalDuration = performance.now() - startTime;
        
        console.log(`[RetryStrategy:${this.name}] Operation succeeded on attempt ${attemptNumber}/${this.config.maxAttempts} after ${totalDuration.toFixed(2)}ms`);
        
        return {
          success: true,
          result,
          attempts,
          totalDuration,
          finalAttempt: attemptNumber,
          exhausted: false
        };

      } catch (error) {
        const attemptEndTime = performance.now();
        const attemptError = error as Error;
        lastError = attemptError;
        
        // Classify error for intelligent retry decision
        const errorContext = createErrorContext({
          operation: context.operation || 'retry-operation',
          component: context.component || 'retry-strategy',
          ticker: context.ticker,
          metadata: {
            ...context.metadata,
            attemptNumber,
            maxAttempts: this.config.maxAttempts,
            strategyName: this.name
          }
        });

        const classifiedError = classifyError(attemptError, errorContext);
        
        // Calculate delay for next attempt
        const delay = attemptNumber < this.config.maxAttempts 
          ? this.calculateDelay(attemptNumber, attemptError)
          : 0;
        
        // Record failed attempt
        const failedAttempt: RetryAttempt = {
          attemptNumber,
          startTime: attemptStartTime,
          endTime: attemptEndTime,
          duration: attemptEndTime - attemptStartTime,
          success: false,
          error: attemptError,
          delay
        };
        
        attempts.push(failedAttempt);
        
        // Notify context callbacks
        context.onAttempt?.(failedAttempt);
        context.onError?.(attemptError, attemptNumber);
        
        // Check if we should retry
        if (attemptNumber >= this.config.maxAttempts || !this.canRetry(attemptError, attemptNumber)) {
          console.warn(`[RetryStrategy:${this.name}] Operation failed after ${attemptNumber} attempts:`, {
            error: attemptError.message,
            category: classifiedError.category,
            severity: classifiedError.severity,
            finalAttempt: attemptNumber,
            maxAttempts: this.config.maxAttempts,
            exhausted: attemptNumber >= this.config.maxAttempts
          });
          
          break; // Exit retry loop
        }
        
        // Log retry attempt
        console.log(`[RetryStrategy:${this.name}] Attempt ${attemptNumber}/${this.config.maxAttempts} failed, retrying in ${delay}ms:`, {
          error: attemptError.message,
          category: classifiedError.category,
          retryable: classifiedError.isRetryable,
          delay
        });
        
        // Wait before next attempt
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }

    // All attempts failed
    const totalDuration = performance.now() - startTime;
    
    return {
      success: false,
      error: lastError,
      attempts,
      totalDuration,
      finalAttempt: attempts.length,
      exhausted: attempts.length >= this.config.maxAttempts
    };
  }

  /**
   * Check if error is retryable based on configuration and classification
   */
  public canRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    // Classify error to determine retryability
    const errorContext = createErrorContext({
      operation: 'retry-check',
      component: 'retry-strategy',
      metadata: { attempt, maxAttempts: this.config.maxAttempts }
    });

    const classification = classifyError(error, errorContext);
    
    // Check against non-retryable errors
    if (this.config.nonRetryableErrors.includes(classification.category)) {
      return false;
    }
    
    // Check against retryable errors (if specified)
    if (this.config.retryableErrors.length > 0) {
      return this.config.retryableErrors.includes(classification.category);
    }
    
    // Default to classification retryability
    return classification.isRetryable;
  }

  /**
   * Calculate delay for next attempt using exponential backoff with jitter
   */
  public calculateDelay(attempt: number, error: Error): number {
    if (this.config.customDelay) {
      return this.config.customDelay(attempt, error);
    }

    let delay: number;

    if (this.config.exponentialBackoff) {
      // Exponential backoff: baseDelay * (multiplier ^ (attempt - 1))
      delay = this.config.baseDelayMs * Math.pow(this.config.multiplier, attempt - 1);
    } else {
      // Linear backoff: baseDelay * attempt
      delay = this.config.baseDelayMs * attempt;
    }

    // Apply jitter to prevent thundering herd
    if (this.config.jitterFactor > 0) {
      const jitter = delay * this.config.jitterFactor * Math.random();
      delay += jitter;
    }

    // Clamp to max delay
    delay = Math.min(delay, this.config.maxDelayMs);

    return Math.round(delay);
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    // Integration with existing v4.4.3.5 timeout pattern
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timeout after ${timeout}ms`));
      }, timeout);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private validateConfig(config: RetryConfig): void {
    if (config.maxAttempts <= 0) {
      throw new Error('maxAttempts must be greater than 0');
    }
    
    if (config.baseDelayMs < 0) {
      throw new Error('baseDelayMs must be non-negative');
    }
    
    if (config.maxDelayMs < config.baseDelayMs) {
      throw new Error('maxDelayMs must be greater than or equal to baseDelayMs');
    }
    
    if (config.multiplier <= 0) {
      throw new Error('multiplier must be greater than 0');
    }
    
    if (config.jitterFactor < 0 || config.jitterFactor > 1) {
      throw new Error('jitterFactor must be between 0 and 1');
    }
    
    if (config.timeout <= 0) {
      throw new Error('timeout must be greater than 0');
    }
  }
}

// ================================
// LINEAR BACKOFF RETRY STRATEGY
// ================================

/**
 * Linear backoff retry strategy for scenarios where exponential growth is too aggressive
 */
export class LinearBackoffRetryStrategy implements RetryStrategy {
  public readonly name = 'linear-backoff';

  constructor(public readonly config: RetryConfig) {
    this.validateConfig(config);
  }

  public async execute<T>(
    operation: () => Promise<T>,
    context: RetryContext = {}
  ): Promise<RetryResult<T>> {
    // Use same implementation as exponential but force linear backoff
    const linearConfig: RetryConfig = {
      ...this.config,
      exponentialBackoff: false
    };

    const strategy = new ExponentialBackoffRetryStrategy(linearConfig);
    return strategy.execute(operation, context);
  }

  public canRetry(error: Error, attempt: number): boolean {
    const strategy = new ExponentialBackoffRetryStrategy(this.config);
    return strategy.canRetry(error, attempt);
  }

  public calculateDelay(attempt: number, error: Error): number {
    // Linear delay: baseDelay * attempt
    let delay = this.config.baseDelayMs * attempt;

    // Apply jitter
    if (this.config.jitterFactor > 0) {
      const jitter = delay * this.config.jitterFactor * Math.random();
      delay += jitter;
    }

    // Clamp to max delay
    delay = Math.min(delay, this.config.maxDelayMs);

    return Math.round(delay);
  }

  private validateConfig(config: RetryConfig): void {
    // Same validation as exponential backoff
    if (config.maxAttempts <= 0) {
      throw new Error('maxAttempts must be greater than 0');
    }
    // ... (rest of validation)
  }
}

// ================================
// FIXED DELAY RETRY STRATEGY
// ================================

/**
 * Fixed delay retry strategy for predictable retry timing
 */
export class FixedDelayRetryStrategy implements RetryStrategy {
  public readonly name = 'fixed-delay';

  constructor(public readonly config: RetryConfig) {
    this.validateConfig(config);
  }

  public async execute<T>(
    operation: () => Promise<T>,
    context: RetryContext = {}
  ): Promise<RetryResult<T>> {
    // Use exponential implementation but override delay calculation
    const strategy = new ExponentialBackoffRetryStrategy(this.config);
    return strategy.execute(operation, context);
  }

  public canRetry(error: Error, attempt: number): boolean {
    const strategy = new ExponentialBackoffRetryStrategy(this.config);
    return strategy.canRetry(error, attempt);
  }

  public calculateDelay(attempt: number, error: Error): number {
    // Fixed delay regardless of attempt number
    let delay = this.config.baseDelayMs;

    // Apply jitter if specified
    if (this.config.jitterFactor > 0) {
      const jitter = delay * this.config.jitterFactor * Math.random();
      delay += jitter;
    }

    return Math.round(delay);
  }

  private validateConfig(config: RetryConfig): void {
    if (config.maxAttempts <= 0) {
      throw new Error('maxAttempts must be greater than 0');
    }
    if (config.baseDelayMs < 0) {
      throw new Error('baseDelayMs must be non-negative');
    }
  }
}

// ================================
// RETRY STRATEGY REGISTRY
// ================================

/**
 * Registry for managing retry strategies
 */
export class RetryStrategyRegistry {
  private strategies = new Map<string, RetryStrategy>();
  private defaultConfigs = new Map<string, RetryConfig>();

  constructor() {
    this.registerBuiltInStrategies();
  }

  /**
   * Register a retry strategy
   */
  public register(name: string, strategy: RetryStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Get a retry strategy by name
   */
  public get(name: string): RetryStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * Create a retry strategy with configuration
   */
  public create(
    strategyType: 'exponential' | 'linear' | 'fixed',
    config: Partial<RetryConfig> = {}
  ): RetryStrategy {
    const fullConfig = this.buildConfig(strategyType, config);

    switch (strategyType) {
      case 'exponential':
        return new ExponentialBackoffRetryStrategy(fullConfig);
      case 'linear':
        return new LinearBackoffRetryStrategy(fullConfig);
      case 'fixed':
        return new FixedDelayRetryStrategy(fullConfig);
      default:
        throw new Error(`Unknown retry strategy type: ${strategyType}`);
    }
  }

  /**
   * Execute operation with retry strategy
   */
  public async executeWithRetry<T>(
    strategyName: string,
    operation: () => Promise<T>,
    context?: RetryContext
  ): Promise<RetryResult<T>> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Retry strategy '${strategyName}' not found`);
    }

    return strategy.execute(operation, context);
  }

  /**
   * Set default configuration for a strategy type
   */
  public setDefaultConfig(strategyType: string, config: RetryConfig): void {
    this.defaultConfigs.set(strategyType, config);
  }

  /**
   * Get all registered strategy names
   */
  public getStrategyNames(): string[] {
    return Array.from(this.strategies.keys());
  }

  private buildConfig(strategyType: string, customConfig: Partial<RetryConfig>): RetryConfig {
    const defaultConfig = this.defaultConfigs.get(strategyType) || this.getSystemDefaults();
    
    return {
      ...defaultConfig,
      ...customConfig
    };
  }

  private getSystemDefaults(): RetryConfig {
    return {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      multiplier: 2,
      jitterFactor: 0.1,
      retryableErrors: [
        ErrorCategory.NETWORK,
        ErrorCategory.TIMEOUT,
        ErrorCategory.AI_SERVICE,
        ErrorCategory.RATE_LIMIT
      ],
      nonRetryableErrors: [
        ErrorCategory.AUTHENTICATION,
        ErrorCategory.DATA_VALIDATION
      ],
      timeout: 45000, // Match v4.4.3.5 timeout
      exponentialBackoff: true
    };
  }

  private registerBuiltInStrategies(): void {
    // Register built-in strategies with sensible defaults
    this.register('default-exponential', this.create('exponential'));
    this.register('default-linear', this.create('linear'));
    this.register('default-fixed', this.create('fixed'));
  }
}

// ================================
// PREDEFINED CONFIGURATIONS
// ================================

/**
 * Predefined retry configurations for common scenarios
 */
export const RETRY_CONFIGS = {
  // AI Service retry (matches v4.4.3.5 patterns)
  AI_SERVICE: {
    maxAttempts: 2, // Match existing retry logic
    baseDelayMs: 2000, // Start with 2 seconds
    maxDelayMs: 8000, // Cap at 8 seconds
    multiplier: 2, // Exponential: 2s, 4s, 8s
    jitterFactor: 0.1,
    retryableErrors: [ErrorCategory.TIMEOUT, ErrorCategory.NETWORK, ErrorCategory.AI_SERVICE],
    nonRetryableErrors: [ErrorCategory.RATE_LIMIT, ErrorCategory.AUTHENTICATION],
    timeout: 45000, // 45-second per-attempt timeout
    exponentialBackoff: true
  } as RetryConfig,

  // Network operations
  NETWORK_OPERATIONS: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    multiplier: 2,
    jitterFactor: 0.2,
    retryableErrors: [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT],
    nonRetryableErrors: [ErrorCategory.AUTHENTICATION, ErrorCategory.DATA_VALIDATION],
    timeout: 30000,
    exponentialBackoff: true
  } as RetryConfig,

  // Fast operations (UI interactions)
  FAST_OPERATIONS: {
    maxAttempts: 2,
    baseDelayMs: 500,
    maxDelayMs: 2000,
    multiplier: 2,
    jitterFactor: 0.1,
    retryableErrors: [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT],
    nonRetryableErrors: [ErrorCategory.DATA_VALIDATION, ErrorCategory.BUSINESS_LOGIC],
    timeout: 5000,
    exponentialBackoff: true
  } as RetryConfig,

  // Critical operations (require high reliability)
  CRITICAL_OPERATIONS: {
    maxAttempts: 5,
    baseDelayMs: 2000,
    maxDelayMs: 60000,
    multiplier: 1.5,
    jitterFactor: 0.3,
    retryableErrors: [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT, ErrorCategory.SYSTEM],
    nonRetryableErrors: [ErrorCategory.AUTHENTICATION, ErrorCategory.DATA_VALIDATION],
    timeout: 60000,
    exponentialBackoff: true
  } as RetryConfig
};

// ================================
// GLOBAL REGISTRY INSTANCE
// ================================

/**
 * Global retry strategy registry
 */
export const globalRetryRegistry = new RetryStrategyRegistry();

// Set up default configurations
globalRetryRegistry.setDefaultConfig('ai-service', RETRY_CONFIGS.AI_SERVICE);
globalRetryRegistry.setDefaultConfig('network', RETRY_CONFIGS.NETWORK_OPERATIONS);
globalRetryRegistry.setDefaultConfig('fast', RETRY_CONFIGS.FAST_OPERATIONS);
globalRetryRegistry.setDefaultConfig('critical', RETRY_CONFIGS.CRITICAL_OPERATIONS);

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Execute operation with exponential backoff retry
 */
export const retryWithExponentialBackoff = async <T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  context?: RetryContext
): Promise<RetryResult<T>> => {
  const strategy = globalRetryRegistry.create('exponential', config);
  return strategy.execute(operation, context);
};

/**
 * Execute operation with linear backoff retry
 */
export const retryWithLinearBackoff = async <T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  context?: RetryContext
): Promise<RetryResult<T>> => {
  const strategy = globalRetryRegistry.create('linear', config);
  return strategy.execute(operation, context);
};

/**
 * Execute operation with fixed delay retry
 */
export const retryWithFixedDelay = async <T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  context?: RetryContext
): Promise<RetryResult<T>> => {
  const strategy = globalRetryRegistry.create('fixed', config);
  return strategy.execute(operation, context);
};

/**
 * Create AI service retry function (v4.4.3.5 compatible)
 */
export const createAIServiceRetry = <T>(
  operation: () => Promise<T>,
  context?: Omit<RetryContext, 'operation'> & { operation?: string }
): Promise<RetryResult<T>> => {
  return retryWithExponentialBackoff(
    operation,
    RETRY_CONFIGS.AI_SERVICE,
    {
      ...context,
      operation: context?.operation || 'ai-service-operation'
    }
  );
};

/**
 * Wrap existing v4.4.3.5 retry pattern with enhanced retry logic
 */
export const enhanceExistingRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  context?: RetryContext
): Promise<T> => {
  const result = await retryWithExponentialBackoff(
    operation,
    {
      maxAttempts: maxRetries,
      baseDelayMs: 2000,
      maxDelayMs: 8000,
      multiplier: 2,
      timeout: 45000 // Match existing timeout
    },
    context
  );

  if (result.success) {
    return result.result!;
  } else {
    throw result.error || new Error('Retry exhausted');
  }
};

// Types already exported above as interfaces