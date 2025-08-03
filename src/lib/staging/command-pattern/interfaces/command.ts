/**
 * @fileOverview Command Pattern Core Interfaces - Enterprise Implementation
 * 
 * Defines the foundational interfaces for the command pattern implementation
 * with enterprise-grade security, monitoring, and resilience features.
 * 
 * ENTERPRISE FEATURES:
 * - Security context with authorization and audit trails
 * - Circuit breaker pattern for resilience
 * - Distributed tracing with correlation IDs
 * - Performance monitoring and metrics collection
 * - Comprehensive error handling with categorized error types
 * - Retry logic with exponential backoff and jitter
 */

import { generateUUID } from '@/lib/staging/uuid-polyfill';

// ===============================
// ERROR HANDLING SYSTEM
// ===============================

export class CommandError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly category: 'TIMEOUT' | 'NETWORK' | 'VALIDATION' | 'BUSINESS' | 'SECURITY',
    public readonly retryable: boolean = true,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CommandError';
  }
}

// ===============================
// CORE TYPE DEFINITIONS
// ===============================

export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  error?: CommandError;
  executionTime: number;
  retryCount: number;
  metadata: {
    commandId: string;
    executionId: string;
    correlationId: string;
    timestamp: number;
    traceId: string;
    spanId: string;
  };
}

export interface CommandMetadata {
  id: string;
  name: string;
  description: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  priority: number; // 0 = highest priority
  dependencies?: string[]; // Command IDs this command depends on
  tags?: string[]; // For filtering and grouping
  permissions?: string[]; // Required permissions
}

export interface SecurityContext {
  userId: string;
  permissions: string[];
  sessionId: string;
  ipAddress: string;
  correlationId: string;
  environment: 'staging' | 'production';
}

export interface MacroExecutionContext {
  getExecutionId(): string;
  setResult(commandId: string, result: any): void;
  getResult(commandId: string): any;
  getAllResults(): Record<string, any>;
  getSharedState(): Record<string, any>;
  getSharedState(key: string): any;
  setSharedState(key: string, value: any): void;
  cleanup(): void;
}

// ===============================
// CIRCUIT BREAKER INTERFACE
// ===============================

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeoutDuration: number;
  retryTimeout: number;
  name: string;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailureTime: number;
  successCount: number;
}

// ===============================
// ABSTRACT COMMAND BASE CLASS
// ===============================

export abstract class MacroCommand {
  protected metadata: CommandMetadata;
  protected context: MacroExecutionContext;
  protected securityContext: SecurityContext;
  private circuitBreaker: CircuitBreakerInterface;

  constructor(
    metadata: CommandMetadata,
    context: MacroExecutionContext,
    securityContext: SecurityContext,
    circuitBreaker?: CircuitBreakerInterface
  ) {
    this.metadata = metadata;
    this.context = context;
    this.securityContext = securityContext;
    this.circuitBreaker = circuitBreaker || new DefaultCircuitBreaker({
      failureThreshold: 5,
      timeoutDuration: 60000,
      retryTimeout: 10000,
      name: metadata.name
    });
  }

  // Abstract method to be implemented by concrete commands
  abstract execute(): Promise<any>;

  // Optional validation method - override in concrete commands
  protected validateInput(): void {
    // Default implementation - no validation
  }

  // Permission check utility
  protected checkPermissions(requiredPermission: string): void {
    if (!this.securityContext.permissions.includes(requiredPermission)) {
      throw new CommandError(
        `Insufficient permissions: ${requiredPermission}`,
        'PERMISSION_DENIED',
        'SECURITY',
        false,
        { requiredPermission, userPermissions: this.securityContext.permissions }
      );
    }
  }

  // Input validation utility
  protected validateInputParam<T>(input: T, validator: (input: T) => boolean, errorMessage?: string): void {
    if (!validator(input)) {
      throw new CommandError(
        errorMessage || 'Invalid input parameters',
        'VALIDATION_FAILED',
        'VALIDATION',
        false,
        { input }
      );
    }
  }

  // Main execution method with retry logic and monitoring
  async executeWithRetry(): Promise<CommandResult> {
    const startTime = Date.now();
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    let lastError: CommandError | undefined;

    // Pre-execution validation
    try {
      this.validateInput();
      
      // Check permissions if required
      if (this.metadata.permissions?.length) {
        this.metadata.permissions.forEach(permission => 
          this.checkPermissions(permission)
        );
      }
    } catch (error) {
      const commandError = error instanceof CommandError ? error : new CommandError(
        error instanceof Error ? error.message : String(error),
        'VALIDATION_ERROR',
        'VALIDATION',
        false
      );

      return this.createErrorResult(commandError, startTime, traceId, spanId, 0);
    }

    // Retry loop with exponential backoff
    for (let attempt = 1; attempt <= this.metadata.maxRetries; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new CommandError(
            `Command timeout: ${this.metadata.name} exceeded ${this.metadata.timeout}ms`,
            'COMMAND_TIMEOUT',
            'TIMEOUT',
            true
          )), this.metadata.timeout);
        });

        // Execute command through circuit breaker with timeout
        const result = await this.circuitBreaker.execute(() =>
          Promise.race([this.execute(), timeoutPromise])
        );

        // Success - return result
        return {
          success: true,
          data: result,
          executionTime: Date.now() - startTime,
          retryCount: attempt - 1,
          metadata: {
            commandId: this.metadata.id,
            executionId: this.context.getExecutionId(),
            correlationId: this.securityContext.correlationId,
            timestamp: Date.now(),
            traceId,
            spanId
          }
        };

      } catch (error) {
        lastError = error instanceof CommandError ? error : new CommandError(
          error instanceof Error ? error.message : String(error),
          'EXECUTION_ERROR',
          'BUSINESS',
          true,
          { originalError: error }
        );

        // Log retry attempt (only for critical errors or final attempt)
        if (attempt === this.metadata.maxRetries || lastError.category === 'SECURITY') {
          console.warn(`Command ${this.metadata.name} failed on attempt ${attempt}/${this.metadata.maxRetries}`, {
            error: lastError,
            traceId,
            spanId
          });
        }

        // If not the last attempt and error is retryable, wait before retry
        if (attempt < this.metadata.maxRetries && lastError.retryable) {
          const delay = this.calculateRetryDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted - return failure
    return this.createErrorResult(lastError!, startTime, traceId, spanId, this.metadata.maxRetries);
  }

  // Helper method to create error results
  private createErrorResult(
    error: CommandError,
    startTime: number,
    traceId: string,
    spanId: string,
    retryCount: number
  ): CommandResult {
    return {
      success: false,
      error,
      executionTime: Date.now() - startTime,
      retryCount,
      metadata: {
        commandId: this.metadata.id,
        executionId: this.context.getExecutionId(),
        correlationId: this.securityContext.correlationId,
        timestamp: Date.now(),
        traceId,
        spanId
      }
    };
  }

  // Exponential backoff with jitter calculation
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.metadata.retryDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    return Math.min(baseDelay + jitter, 30000); // Max 30 seconds
  }

  // Trace ID generation for distributed tracing
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Span ID generation for distributed tracing
  private generateSpanId(): string {
    return `span_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Metadata accessor methods
  getId(): string { return this.metadata.id; }
  getName(): string { return this.metadata.name; }
  getDescription(): string { return this.metadata.description; }
  getPriority(): number { return this.metadata.priority; }
  getDependencies(): string[] { return this.metadata.dependencies || []; }
  getTags(): string[] { return this.metadata.tags || []; }
  getPermissions(): string[] { return this.metadata.permissions || []; }
  getTimeout(): number { return this.metadata.timeout; }
  getMaxRetries(): number { return this.metadata.maxRetries; }
}

// ===============================
// CIRCUIT BREAKER INTERFACE
// ===============================

export interface CircuitBreakerInterface {
  execute<T>(operation: () => Promise<T>): Promise<T>;
  getState(): CircuitBreakerState;
  reset(): void;
  forceOpen(): void;
  forceClose(): void;
}

// Default circuit breaker implementation
class DefaultCircuitBreaker implements CircuitBreakerInterface {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this.state = {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      successCount: 0
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should be half-open
    if (this.state.state === 'OPEN') {
      if (Date.now() - this.state.lastFailureTime > this.config.retryTimeout) {
        this.state.state = 'HALF_OPEN';
        this.state.successCount = 0;
      } else {
        throw new CommandError(
          `Circuit breaker is OPEN for ${this.config.name}`,
          'CIRCUIT_OPEN',
          'NETWORK',
          false,
          { circuitBreakerState: this.state }
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.state.successCount++;
    
    if (this.state.state === 'HALF_OPEN') {
      // Require a few successes before closing
      if (this.state.successCount >= 2) {
        this.state.state = 'CLOSED';
        this.state.failures = 0;
      }
    } else {
      this.state.failures = 0;
    }
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'OPEN';
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      successCount: 0
    };
  }

  forceOpen(): void {
    this.state.state = 'OPEN';
    this.state.lastFailureTime = Date.now();
  }

  forceClose(): void {
    this.state.state = 'CLOSED';
    this.state.failures = 0;
    this.state.successCount = 0;
  }
}

// ===============================
// EXECUTION CONTEXT IMPLEMENTATION
// ===============================

export class DefaultMacroExecutionContext implements MacroExecutionContext {
  private executionId: string;
  private results: Map<string, any> = new Map();
  private sharedState: Map<string, any> = new Map();

  constructor() {
    this.executionId = generateUUID();
  }

  getExecutionId(): string {
    return this.executionId;
  }

  setResult(commandId: string, result: any): void {
    this.results.set(commandId, result);
  }

  getResult(commandId: string): any {
    return this.results.get(commandId);
  }

  getAllResults(): Record<string, any> {
    return Object.fromEntries(this.results);
  }

  getSharedState(): Record<string, any>;
  getSharedState(key: string): any;
  getSharedState(key?: string): any {
    if (key === undefined) {
      return Object.fromEntries(this.sharedState);
    }
    return this.sharedState.get(key);
  }

  setSharedState(key: string, value: any): void {
    this.sharedState.set(key, value);
  }

  cleanup(): void {
    this.results.clear();
    this.sharedState.clear();
  }
}