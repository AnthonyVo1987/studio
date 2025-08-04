/**
 * Circuit Breaker Implementation
 * 
 * Advanced circuit breaker pattern with configurable failure detection,
 * state management, and integration with existing v4.4.3.5 timeout protection.
 */

import {
  CircuitBreakerState,
  type CircuitBreakerConfig,
  type CircuitBreakerMetrics,
  type CircuitBreakerEvent,
  ErrorCategory
} from './error-types';

import { classifyError, createErrorContext } from './error-classifier';

// ================================
// CIRCUIT BREAKER IMPLEMENTATION
// ================================

/**
 * Circuit breaker class implementing the circuit breaker pattern
 * with sophisticated failure detection and recovery logic
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private lastSuccessTime = 0;
  private nextAttemptTime = 0;
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private responseTimes: number[] = [];
  private eventListeners: Array<(event: CircuitBreakerEvent) => void> = [];
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private config: CircuitBreakerConfig) {
    this.validateConfig(config);
    this.setupCleanup();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  public async execute<T>(
    operation: () => Promise<T>,
    context?: { operation?: string; metadata?: Record<string, unknown> }
  ): Promise<T> {
    const startTime = performance.now();
    
    // Check if circuit allows execution
    if (!this.canExecute()) {
      const error = new Error(`Circuit breaker '${this.config.name}' is ${this.state.toUpperCase()}`);
      this.recordFailure(error, startTime);
      throw error;
    }

    this.totalRequests++;

    try {
      // Execute the operation with timeout protection
      const result = await this.executeWithTimeout(operation);
      const endTime = performance.now();
      
      this.recordSuccess(endTime - startTime);
      return result;
    } catch (error) {
      this.recordFailure(error as Error, startTime, context);
      throw error;
    }
  }

  /**
   * Get current circuit breaker metrics
   */
  public getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      averageResponseTime: this.calculateAverageResponseTime(),
      uptime: this.calculateUptime()
    };
  }

  /**
   * Get current circuit breaker state
   */
  public getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get circuit breaker configuration
   */
  public getConfig(): Readonly<CircuitBreakerConfig> {
    return { ...this.config };
  }

  /**
   * Force state change (for testing/emergency scenarios)
   */
  public forceState(newState: CircuitBreakerState, reason = 'Manual override'): void {
    const previousState = this.state;
    this.state = newState;
    
    if (newState === CircuitBreakerState.CLOSED) {
      this.reset();
    } else if (newState === CircuitBreakerState.OPEN) {
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    }

    this.emitEvent({
      type: newState as any,
      timestamp: Date.now(),
      metrics: this.getMetrics()
    });

    console.log(`[CircuitBreaker:${this.config.name}] State forced from ${previousState.toUpperCase()} to ${newState.toUpperCase()}: ${reason}`);
  }

  /**
   * Reset circuit breaker to initial state
   */
  public reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.nextAttemptTime = 0;
    
    console.log(`[CircuitBreaker:${this.config.name}] Reset to CLOSED state`);
  }

  /**
   * Add event listener for circuit breaker events
   */
  public addEventListener(listener: (event: CircuitBreakerEvent) => void): () => void {
    this.eventListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get health status for monitoring
   */
  public getHealthStatus(): {
    healthy: boolean;
    state: CircuitBreakerState;
    failureRate: number;
    uptime: number;
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const failureRate = this.totalRequests > 0 ? this.totalFailures / this.totalRequests : 0;
    const recommendations: string[] = [];

    // Health assessment
    let healthy = true;
    
    if (this.state === CircuitBreakerState.OPEN) {
      healthy = false;
      recommendations.push('Circuit is OPEN - check downstream service health');
    }
    
    if (failureRate > 0.5) {
      healthy = false;
      recommendations.push('High failure rate detected - investigate root cause');
    }
    
    if (metrics.averageResponseTime > 5000) {
      recommendations.push('High response times - consider increasing timeout or capacity');
    }

    if (this.failureCount >= this.config.failureThreshold * 0.8) {
      recommendations.push('Approaching failure threshold - monitor closely');
    }

    return {
      healthy,
      state: this.state,
      failureRate,
      uptime: metrics.uptime,
      recommendations
    };
  }

  /**
   * Dispose of circuit breaker resources
   */
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.eventListeners.length = 0;
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        if (now >= this.nextAttemptTime) {
          this.transitionToHalfOpen();
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return this.successCount < this.config.halfOpenMaxCalls;

      default:
        return false;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    // Integrate with existing v4.4.3.5 timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Circuit breaker timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  private recordSuccess(responseTime: number): void {
    this.lastSuccessTime = Date.now();
    this.totalSuccesses++;
    this.responseTimes.push(responseTime);
    
    // Limit response time history
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        // Stay closed, reset failure count if we had failures
        if (this.failureCount > 0) {
          this.failureCount = 0;
        }
        break;

      case CircuitBreakerState.HALF_OPEN:
        this.successCount++;
        if (this.successCount >= this.config.successThreshold) {
          this.transitionToClosed();
        }
        break;
    }

    this.emitEvent({
      type: 'success',
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      duration: responseTime
    });
  }

  private recordFailure(
    error: Error, 
    startTime: number,
    context?: { operation?: string; metadata?: Record<string, unknown> }
  ): void {
    const now = Date.now();
    const duration = now - startTime;
    
    // Check if error should count as failure
    if (this.config.errorFilter && !this.config.errorFilter(error)) {
      return; // Error is filtered out
    }

    this.lastFailureTime = now;
    this.totalFailures++;

    // Classify error for better understanding
    const errorContext = createErrorContext({
      operation: context?.operation || 'circuit-breaker-execution',
      component: `circuit-breaker-${this.config.name}`,
      metadata: {
        ...context?.metadata,
        circuitBreakerState: this.state,
        failureCount: this.failureCount,
        responseTime: duration
      }
    });

    const classification = classifyError(error, errorContext);
    
    console.warn(`[CircuitBreaker:${this.config.name}] Failure recorded:`, {
      error: error.message,
      category: classification.category,
      severity: classification.severity,
      duration,
      state: this.state,
      failureCount: this.failureCount + 1
    });

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        this.failureCount++;
        if (this.isFailureThresholdExceeded()) {
          this.transitionToOpen();
        }
        break;

      case CircuitBreakerState.HALF_OPEN:
        this.transitionToOpen();
        break;
    }

    this.emitEvent({
      type: 'failure',
      timestamp: now,
      metrics: this.getMetrics(),
      error,
      duration
    });
  }

  private isFailureThresholdExceeded(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.monitoringWindow;
    
    // Count failures within the monitoring window
    // For simplicity, we're using the current failure count
    // In a production system, you'd want to track failures with timestamps
    return this.failureCount >= this.config.failureThreshold;
  }

  private transitionToClosed(): void {
    console.log(`[CircuitBreaker:${this.config.name}] Transitioning from ${this.state.toUpperCase()} to CLOSED`);
    
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = 0;

    this.emitEvent({
      type: 'closed',
      timestamp: Date.now(),
      metrics: this.getMetrics()
    });
  }

  private transitionToOpen(): void {
    console.log(`[CircuitBreaker:${this.config.name}] Transitioning from ${this.state.toUpperCase()} to OPEN`);
    
    this.state = CircuitBreakerState.OPEN;
    this.successCount = 0;
    this.nextAttemptTime = Date.now() + this.config.resetTimeout;

    this.emitEvent({
      type: 'opened',
      timestamp: Date.now(),
      metrics: this.getMetrics()
    });
  }

  private transitionToHalfOpen(): void {
    console.log(`[CircuitBreaker:${this.config.name}] Transitioning from OPEN to HALF_OPEN`);
    
    this.state = CircuitBreakerState.HALF_OPEN;
    this.successCount = 0;

    this.emitEvent({
      type: 'half_opened',
      timestamp: Date.now(),
      metrics: this.getMetrics()
    });
  }

  private calculateAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.responseTimes.length;
  }

  private calculateUptime(): number {
    if (this.totalRequests === 0) return 100;
    return (this.totalSuccesses / this.totalRequests) * 100;
  }

  private emitEvent(event: CircuitBreakerEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`[CircuitBreaker:${this.config.name}] Error in event listener:`, error);
      }
    });
  }

  private validateConfig(config: CircuitBreakerConfig): void {
    if (!config.name || config.name.trim() === '') {
      throw new Error('Circuit breaker name is required');
    }
    
    if (config.failureThreshold <= 0) {
      throw new Error('Failure threshold must be greater than 0');
    }
    
    if (config.successThreshold <= 0) {
      throw new Error('Success threshold must be greater than 0');
    }
    
    if (config.timeout <= 0) {
      throw new Error('Timeout must be greater than 0');
    }
    
    if (config.resetTimeout <= 0) {
      throw new Error('Reset timeout must be greater than 0');
    }
    
    if (config.monitoringWindow <= 0) {
      throw new Error('Monitoring window must be greater than 0');
    }
    
    if (config.halfOpenMaxCalls <= 0) {
      throw new Error('Half-open max calls must be greater than 0');
    }
  }

  private setupCleanup(): void {
    // Cleanup old response times periodically
    this.cleanupInterval = setInterval(() => {
      if (this.responseTimes.length > 100) {
        this.responseTimes = this.responseTimes.slice(-50);
      }
    }, 60000); // Cleanup every minute
  }
}

// ================================
// CIRCUIT BREAKER REGISTRY
// ================================

/**
 * Registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();
  private defaultConfigs = new Map<string, Partial<CircuitBreakerConfig>>();

  /**
   * Create or get a circuit breaker
   */
  public getOrCreate(
    name: string, 
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!;
    }

    const fullConfig = this.buildConfig(name, config);
    const breaker = new CircuitBreaker(fullConfig);
    
    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Get an existing circuit breaker
   */
  public get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Remove and dispose a circuit breaker
   */
  public remove(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.dispose();
      return this.breakers.delete(name);
    }
    return false;
  }

  /**
   * Get all circuit breaker names
   */
  public getNames(): string[] {
    return Array.from(this.breakers.keys());
  }

  /**
   * Get metrics for all circuit breakers
   */
  public getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Get health status for all circuit breakers
   */
  public getHealthSummary(): {
    healthy: boolean;
    totalBreakers: number;
    healthyBreakers: number;
    openBreakers: string[];
    unhealthyBreakers: string[];
  } {
    const openBreakers: string[] = [];
    const unhealthyBreakers: string[] = [];
    let healthyCount = 0;

    for (const [name, breaker] of this.breakers) {
      const health = breaker.getHealthStatus();
      
      if (health.healthy) {
        healthyCount++;
      } else {
        unhealthyBreakers.push(name);
      }
      
      if (health.state === CircuitBreakerState.OPEN) {
        openBreakers.push(name);
      }
    }

    return {
      healthy: unhealthyBreakers.length === 0,
      totalBreakers: this.breakers.size,
      healthyBreakers: healthyCount,
      openBreakers,
      unhealthyBreakers
    };
  }

  /**
   * Set default configuration for a service type
   */
  public setDefaultConfig(serviceType: string, config: Partial<CircuitBreakerConfig>): void {
    this.defaultConfigs.set(serviceType, config);
  }

  /**
   * Dispose all circuit breakers
   */
  public dispose(): void {
    for (const breaker of this.breakers.values()) {
      breaker.dispose();
    }
    this.breakers.clear();
    this.defaultConfigs.clear();
  }

  private buildConfig(name: string, customConfig?: Partial<CircuitBreakerConfig>): CircuitBreakerConfig {
    // Determine service type from name for default config lookup
    const serviceType = this.extractServiceType(name);
    const defaultConfig = this.defaultConfigs.get(serviceType) || this.getSystemDefaults();

    return {
      name,
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 45000, // Match existing v4.4.3.5 timeout
      resetTimeout: 60000,
      monitoringWindow: 120000,
      halfOpenMaxCalls: 3,
      ...defaultConfig,
      ...customConfig
    };
  }

  private extractServiceType(name: string): string {
    // Extract service type from circuit breaker name
    const parts = name.split('-');
    return parts[0] || 'default';
  }

  private getSystemDefaults(): Partial<CircuitBreakerConfig> {
    return {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 45000,
      resetTimeout: 60000,
      monitoringWindow: 120000,
      halfOpenMaxCalls: 3
    };
  }
}

// ================================
// PREDEFINED CONFIGURATIONS
// ================================

/**
 * Predefined circuit breaker configurations for common scenarios
 */
export const CIRCUIT_BREAKER_CONFIGS = {
  // AI Service configuration (matches v4.4.3.5 patterns)
  AI_SERVICE: {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 45000, // Match existing AI timeout
    resetTimeout: 300000, // 5 minutes
    monitoringWindow: 180000, // 3 minutes
    halfOpenMaxCalls: 2,
    errorFilter: (error: Error) => {
      // Don't count quota errors as circuit breaker failures
      return !error.message.includes('quota') && !error.message.includes('rate limit');
    }
  } as Partial<CircuitBreakerConfig>,

  // Network service configuration
  NETWORK_SERVICE: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000,
    resetTimeout: 60000,
    monitoringWindow: 120000,
    halfOpenMaxCalls: 3,
    errorFilter: (error: Error) => {
      // Count timeout and connection errors
      return error.message.includes('timeout') || 
             error.message.includes('ENOTFOUND') || 
             error.message.includes('ECONNRESET');
    }
  } as Partial<CircuitBreakerConfig>,

  // Data validation service
  DATA_SERVICE: {
    failureThreshold: 10,
    successThreshold: 5,
    timeout: 15000,
    resetTimeout: 30000,
    monitoringWindow: 60000,
    halfOpenMaxCalls: 5
  } as Partial<CircuitBreakerConfig>
};

// ================================
// GLOBAL REGISTRY INSTANCE
// ================================

/**
 * Global circuit breaker registry
 */
export const globalCircuitBreakerRegistry = new CircuitBreakerRegistry();

// Set up default configurations
globalCircuitBreakerRegistry.setDefaultConfig('ai', CIRCUIT_BREAKER_CONFIGS.AI_SERVICE);
globalCircuitBreakerRegistry.setDefaultConfig('network', CIRCUIT_BREAKER_CONFIGS.NETWORK_SERVICE);
globalCircuitBreakerRegistry.setDefaultConfig('data', CIRCUIT_BREAKER_CONFIGS.DATA_SERVICE);

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Create a circuit breaker with predefined configuration
 */
export const createCircuitBreaker = (
  name: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker => {
  return globalCircuitBreakerRegistry.getOrCreate(name, config);
};

/**
 * Execute function with circuit breaker protection
 */
export const executeWithCircuitBreaker = async <T>(
  circuitBreakerName: string,
  operation: () => Promise<T>,
  config?: {
    circuitBreakerConfig?: Partial<CircuitBreakerConfig>;
    context?: { operation?: string; metadata?: Record<string, unknown> };
  }
): Promise<T> => {
  const breaker = globalCircuitBreakerRegistry.getOrCreate(
    circuitBreakerName,
    config?.circuitBreakerConfig
  );
  
  return breaker.execute(operation, config?.context);
};

/**
 * Get circuit breaker health status
 */
export const getCircuitBreakerHealth = (name: string) => {
  const breaker = globalCircuitBreakerRegistry.get(name);
  return breaker?.getHealthStatus();
};

/**
 * Get all circuit breakers health summary
 */
export const getAllCircuitBreakersHealth = () => {
  return globalCircuitBreakerRegistry.getHealthSummary();
};

export default CircuitBreaker;