/**
 * Recovery Strategies Engine
 * 
 * Intelligent error recovery system with strategy selection based on error classification.
 * Provides graceful degradation, fallback mechanisms, and user intervention flows.
 */

import {
  RecoveryStrategy as RecoveryStrategyType,
  type RecoveryAction,
  type RecoveryResult,
  type RecoveryPlan,
  type ClassifiedError,
  type ErrorContext,
  ErrorCategory,
  ErrorSeverity
} from './error-types';

import { classifyError, createErrorContext } from './error-classifier';
import { executeWithCircuitBreaker } from './circuit-breaker';
import { retryWithExponentialBackoff } from './retry-strategies';
import { globalCompensationManager } from './compensation-manager';

// ================================
// RECOVERY ACTION IMPLEMENTATIONS
// ================================

/**
 * Retry recovery action with exponential backoff
 */
export class RetryRecoveryAction implements RecoveryAction {
  public readonly id = 'retry-recovery';
  public readonly name = 'Retry with Exponential Backoff';
  public readonly strategy = RecoveryStrategyType.RETRY;
  public readonly priority = 100;
  public readonly timeout = 60000;
  public readonly description = 'Retry the failed operation with exponential backoff';

  public canHandle(error: ClassifiedError): boolean {
    return error.isRetryable && 
           error.severity !== ErrorSeverity.CRITICAL &&
           [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT, ErrorCategory.AI_SERVICE].includes(error.category);
  }

  public async execute(error: ClassifiedError, context: ErrorContext): Promise<RecoveryResult> {
    const startTime = performance.now();
    
    console.log(`[RetryRecovery] Attempting retry recovery for error: ${error.message}`);
    
    try {
      // Extract original operation from context if available
      const originalOperation = (context.metadata as any)?.originalOperation;
      
      if (!originalOperation || typeof originalOperation !== 'function') {
        throw new Error('No original operation available for retry');
      }

      // Use enhanced retry logic
      const result = await retryWithExponentialBackoff(
        originalOperation,
        {
          maxAttempts: 3,
          baseDelayMs: 2000,
          maxDelayMs: 8000,
          timeout: 45000
        },
        {
          operation: context.operation,
          component: context.component,
          ticker: context.ticker
        }
      );

      if (result.success) {
        return {
          success: true,
          strategy: this.strategy,
          actionId: this.id,
          duration: performance.now() - startTime,
          metadata: {
            attempts: result.attempts.length,
            totalRetryTime: result.totalDuration,
            originalError: error.message
          }
        };
      } else {
        throw result.error || new Error('Retry exhausted');
      }

    } catch (recoveryError) {
      console.error(`[RetryRecovery] Recovery failed:`, recoveryError);
      
      return {
        success: false,
        strategy: this.strategy,
        actionId: this.id,
        duration: performance.now() - startTime,
        error: recoveryError as Error,
        metadata: {
          originalError: error.message,
          recoveryError: (recoveryError as Error).message
        },
        nextAction: 'circuit-breaker-recovery' // Try circuit breaker next
      };
    }
  }
}

/**
 * Circuit breaker recovery action
 */
export class CircuitBreakerRecoveryAction implements RecoveryAction {
  public readonly id = 'circuit-breaker-recovery';
  public readonly name = 'Circuit Breaker Protection';
  public readonly strategy = RecoveryStrategyType.CIRCUIT_BREAKER;
  public readonly priority = 90;
  public readonly timeout = 45000;
  public readonly description = 'Protect system with circuit breaker pattern';

  public canHandle(error: ClassifiedError): boolean {
    return [ErrorCategory.NETWORK, ErrorCategory.AI_SERVICE, ErrorCategory.TIMEOUT].includes(error.category) &&
           error.severity >= ErrorSeverity.MEDIUM;
  }

  public async execute(error: ClassifiedError, context: ErrorContext): Promise<RecoveryResult> {
    const startTime = performance.now();
    
    console.log(`[CircuitBreakerRecovery] Implementing circuit breaker for: ${error.message}`);
    
    try {
      const originalOperation = (context.metadata as any)?.originalOperation;
      
      if (!originalOperation || typeof originalOperation !== 'function') {
        throw new Error('No original operation available for circuit breaker protection');
      }

      // Determine circuit breaker name based on context
      const circuitBreakerName = this.getCircuitBreakerName(context);
      
      // Execute with circuit breaker protection
      const result = await executeWithCircuitBreaker(
        circuitBreakerName,
        originalOperation,
        {
          context: {
            operation: context.operation,
            metadata: {
              ticker: context.ticker,
              originalError: error.message,
              errorCategory: error.category
            }
          }
        }
      );

      return {
        success: true,
        strategy: this.strategy,
        actionId: this.id,
        duration: performance.now() - startTime,
        metadata: {
          circuitBreakerName,
          originalError: error.message,
          protected: true
        }
      };

    } catch (recoveryError) {
      console.error(`[CircuitBreakerRecovery] Recovery failed:`, recoveryError);
      
      return {
        success: false,
        strategy: this.strategy,
        actionId: this.id,
        duration: performance.now() - startTime,
        error: recoveryError as Error,
        metadata: {
          originalError: error.message,
          recoveryError: (recoveryError as Error).message
        },
        nextAction: 'fallback-recovery' // Try fallback next
      };
    }
  }

  private getCircuitBreakerName(context: ErrorContext): string {
    if (context.operation?.includes('ai')) return 'ai-service';
    if (context.operation?.includes('network')) return 'network-service';
    return `${context.component || 'default'}-service`;
  }
}

/**
 * Fallback recovery action with cached data
 */
export class FallbackRecoveryAction implements RecoveryAction {
  public readonly id = 'fallback-recovery';
  public readonly name = 'Fallback to Cached Data';
  public readonly strategy = RecoveryStrategyType.FALLBACK;
  public readonly priority = 80;
  public readonly timeout = 5000;
  public readonly description = 'Use cached or default data when primary operation fails';

  private fallbackCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 300000; // 5 minutes

  public canHandle(error: ClassifiedError): boolean {
    return error.category !== ErrorCategory.AUTHENTICATION && 
           error.category !== ErrorCategory.SYSTEM;
  }

  public async execute(error: ClassifiedError, context: ErrorContext): Promise<RecoveryResult> {
    const startTime = performance.now();
    
    console.log(`[FallbackRecovery] Looking for fallback data for error: ${error.message}`);
    
    try {
      // Try to get cached data
      const cacheKey = this.generateCacheKey(context);
      const fallbackData = this.getFallbackData(cacheKey, context);
      
      if (fallbackData) {
        console.log(`[FallbackRecovery] Using cached fallback data (age: ${Date.now() - fallbackData.timestamp}ms)`);
        
        return {
          success: true,
          strategy: this.strategy,
          actionId: this.id,
          duration: performance.now() - startTime,
          metadata: {
            dataSource: 'cache',
            cacheAge: Date.now() - fallbackData.timestamp,
            originalError: error.message,
            fallbackData: fallbackData.data
          }
        };
      }

      // Generate default/mock data based on context
      const defaultData = this.generateDefaultData(context);
      
      if (defaultData) {
        console.log(`[FallbackRecovery] Using generated default data`);
        
        // Cache the default data for future use
        this.setFallbackData(cacheKey, defaultData, this.DEFAULT_TTL);
        
        return {
          success: true,
          strategy: this.strategy,
          actionId: this.id,
          duration: performance.now() - startTime,
          metadata: {
            dataSource: 'default',
            originalError: error.message,
            fallbackData: defaultData
          }
        };
      }

      throw new Error('No fallback data available');

    } catch (recoveryError) {
      console.error(`[FallbackRecovery] Recovery failed:`, recoveryError);
      
      return {
        success: false,
        strategy: this.strategy,
        actionId: this.id,
        duration: performance.now() - startTime,
        error: recoveryError as Error,
        metadata: {
          originalError: error.message,
          recoveryError: (recoveryError as Error).message
        },
        nextAction: 'graceful-degradation-recovery'
      };
    }
  }

  /**
   * Set fallback data in cache
   */
  public setFallbackData(key: string, data: unknown, ttl = this.DEFAULT_TTL): void {
    this.fallbackCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear expired cache entries
   */
  public clearExpiredCache(): number {
    const now = Date.now();
    let cleared = 0;
    
    for (const [key, entry] of this.fallbackCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.fallbackCache.delete(key);
        cleared++;
      }
    }
    
    return cleared;
  }

  private getFallbackData(key: string, context: ErrorContext): { data: unknown; timestamp: number } | null {
    const entry = this.fallbackCache.get(key);
    
    if (!entry) return null;
    
    // Check if data is still valid
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.fallbackCache.delete(key);
      return null;
    }
    
    return entry;
  }

  private generateCacheKey(context: ErrorContext): string {
    return `${context.component}-${context.operation}-${context.ticker || 'default'}`;
  }

  private generateDefaultData(context: ErrorContext): unknown | null {
    // Generate contextual default data based on StockSage operations
    if (context.operation?.includes('stock-data')) {
      return this.generateDefaultStockData(context.ticker);
    }
    
    if (context.operation?.includes('options-chain')) {
      return this.generateDefaultOptionsData(context.ticker);
    }
    
    if (context.operation?.includes('ai-analysis')) {
      return this.generateDefaultAIAnalysis(context.ticker);
    }
    
    if (context.operation?.includes('market-status')) {
      return this.generateDefaultMarketStatus();
    }
    
    return null;
  }

  private generateDefaultStockData(ticker?: string): unknown {
    return {
      ticker: ticker || 'UNKNOWN',
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      timestamp: Date.now(),
      status: 'fallback',
      message: 'Using cached/default data due to service unavailability'
    };
  }

  private generateDefaultOptionsData(ticker?: string): unknown {
    return {
      ticker: ticker || 'UNKNOWN',
      expirations: [],
      chains: [],
      timestamp: Date.now(),
      status: 'fallback',
      message: 'Options data temporarily unavailable'
    };
  }

  private generateDefaultAIAnalysis(ticker?: string): unknown {
    return {
      ticker: ticker || 'UNKNOWN',
      analysis: 'AI analysis temporarily unavailable. Please try again later.',
      confidence: 0,
      timestamp: Date.now(),
      status: 'fallback'
    };
  }

  private generateDefaultMarketStatus(): unknown {
    return {
      market: 'unknown',
      status: 'fallback',
      message: 'Market status temporarily unavailable',
      timestamp: Date.now()
    };
  }
}

/**
 * Graceful degradation recovery action
 */
export class GracefulDegradationRecoveryAction implements RecoveryAction {
  public readonly id = 'graceful-degradation-recovery';
  public readonly name = 'Graceful Degradation';
  public readonly strategy = RecoveryStrategyType.GRACEFUL_DEGRADATION;
  public readonly priority = 70;
  public readonly timeout = 1000;
  public readonly description = 'Disable non-essential features and continue with reduced functionality';

  private disabledFeatures = new Set<string>();

  public canHandle(error: ClassifiedError): boolean {
    return error.severity <= ErrorSeverity.HIGH && 
           error.category !== ErrorCategory.SYSTEM;
  }

  public async execute(error: ClassifiedError, context: ErrorContext): Promise<RecoveryResult> {
    const startTime = performance.now();
    
    console.log(`[GracefulDegradation] Implementing graceful degradation for: ${error.message}`);
    
    try {
      // Determine what feature to disable based on error context
      const featureToDisable = this.determineFeatureToDisable(error, context);
      
      if (featureToDisable) {
        this.disabledFeatures.add(featureToDisable);
        
        console.log(`[GracefulDegradation] Disabled feature: ${featureToDisable}`);
        
        return {
          success: true,
          strategy: this.strategy,
          actionId: this.id,
          duration: performance.now() - startTime,
          metadata: {
            disabledFeature: featureToDisable,
            totalDisabledFeatures: this.disabledFeatures.size,
            originalError: error.message,
            userMessage: this.getUserMessage(featureToDisable)
          }
        };
      }

      throw new Error('No feature could be disabled for graceful degradation');

    } catch (recoveryError) {
      console.error(`[GracefulDegradation] Recovery failed:`, recoveryError);
      
      return {
        success: false,
        strategy: this.strategy,
        actionId: this.id,
        duration: performance.now() - startTime,
        error: recoveryError as Error,
        metadata: {
          originalError: error.message,
          recoveryError: (recoveryError as Error).message
        },
        nextAction: 'user-intervention-recovery'
      };
    }
  }

  /**
   * Check if a feature is currently disabled
   */
  public isFeatureDisabled(feature: string): boolean {
    return this.disabledFeatures.has(feature);
  }

  /**
   * Re-enable a previously disabled feature
   */
  public enableFeature(feature: string): boolean {
    return this.disabledFeatures.delete(feature);
  }

  /**
   * Get all disabled features
   */
  public getDisabledFeatures(): string[] {
    return Array.from(this.disabledFeatures);
  }

  /**
   * Clear all disabled features
   */
  public clearDisabledFeatures(): void {
    this.disabledFeatures.clear();
  }

  private determineFeatureToDisable(error: ClassifiedError, context: ErrorContext): string | null {
    // Determine feature based on error context and category
    if (error.category === ErrorCategory.AI_SERVICE) {
      if (context.operation?.includes('options-analysis')) return 'ai-options-analysis';
      if (context.operation?.includes('takeaways')) return 'ai-key-takeaways';
      if (context.operation?.includes('ta-analysis')) return 'ai-technical-analysis';
      return 'ai-chat';
    }
    
    if (error.category === ErrorCategory.NETWORK) {
      if (context.operation?.includes('real-time')) return 'real-time-updates';
      if (context.operation?.includes('charts')) return 'advanced-charts';
      return 'live-data';
    }
    
    if (error.category === ErrorCategory.DATA_VALIDATION) {
      if (context.operation?.includes('options')) return 'options-chain';
      return 'advanced-metrics';
    }
    
    return null;
  }

  private getUserMessage(feature: string): string {
    const messages: Record<string, string> = {
      'ai-options-analysis': 'AI options analysis is temporarily disabled. Basic options data is still available.',
      'ai-key-takeaways': 'AI key takeaways are temporarily disabled. Raw data analysis is still available.',
      'ai-technical-analysis': 'AI technical analysis is temporarily disabled. Standard indicators are still available.',
      'ai-chat': 'AI chat is temporarily disabled. Manual analysis tools are still available.',
      'real-time-updates': 'Real-time updates are temporarily disabled. Data will be refreshed manually.',
      'advanced-charts': 'Advanced charts are temporarily disabled. Basic charts are still available.',
      'live-data': 'Live data feeds are temporarily disabled. Cached data is being used.',
      'options-chain': 'Options chain data is temporarily disabled. Stock data is still available.',
      'advanced-metrics': 'Advanced metrics are temporarily disabled. Basic metrics are still available.'
    };
    
    return messages[feature] || `Feature '${feature}' is temporarily disabled.`;
  }
}

/**
 * Compensation recovery action
 */
export class CompensationRecoveryAction implements RecoveryAction {
  public readonly id = 'compensation-recovery';
  public readonly name = 'Transaction Compensation';
  public readonly strategy = RecoveryStrategyType.COMPENSATION;
  public readonly priority = 60;
  public readonly timeout = 120000;
  public readonly description = 'Rollback failed multi-step operations using compensation transactions';

  public canHandle(error: ClassifiedError): boolean {
    return error.category === ErrorCategory.BUSINESS_LOGIC ||
           (error.severity >= ErrorSeverity.HIGH && 
            [ErrorCategory.DATA_VALIDATION, ErrorCategory.SYSTEM].includes(error.category));
  }

  public async execute(error: ClassifiedError, context: ErrorContext): Promise<RecoveryResult> {
    const startTime = performance.now();
    
    console.log(`[CompensationRecovery] Initiating transaction rollback for: ${error.message}`);
    
    try {
      // Look for active transaction in context
      const transactionId = (context.metadata as any)?.transactionId;
      
      if (!transactionId) {
        throw new Error('No transaction ID found in error context');
      }

      // Cancel the transaction (which triggers compensation)
      const result = await globalCompensationManager.cancelTransaction(
        transactionId,
        `Error recovery: ${error.message}`
      );

      if (result && result.compensatedSteps.length > 0) {
        return {
          success: true,
          strategy: this.strategy,
          actionId: this.id,
          duration: performance.now() - startTime,
          metadata: {
            transactionId,
            compensatedSteps: result.compensatedSteps.length,
            totalSteps: result.completedSteps.length,
            originalError: error.message,
            rollbackDuration: result.duration
          }
        };
      }

      throw new Error('Transaction compensation failed or no steps to compensate');

    } catch (recoveryError) {
      console.error(`[CompensationRecovery] Recovery failed:`, recoveryError);
      
      return {
        success: false,
        strategy: this.strategy,
        actionId: this.id,
        duration: performance.now() - startTime,
        error: recoveryError as Error,
        metadata: {
          originalError: error.message,
          recoveryError: (recoveryError as Error).message
        },
        nextAction: 'system-restart-recovery'
      };
    }
  }
}

/**
 * User intervention recovery action
 */
export class UserInterventionRecoveryAction implements RecoveryAction {
  public readonly id = 'user-intervention-recovery';
  public readonly name = 'User Intervention Required';
  public readonly strategy = RecoveryStrategyType.USER_INTERVENTION;
  public readonly priority = 50;
  public readonly timeout = 0; // No timeout for user intervention
  public readonly description = 'Request user action to resolve the error';

  public canHandle(error: ClassifiedError): boolean {
    return error.category === ErrorCategory.AUTHENTICATION ||
           error.severity === ErrorSeverity.HIGH ||
           error.category === ErrorCategory.DATA_VALIDATION;
  }

  public async execute(error: ClassifiedError, context: ErrorContext): Promise<RecoveryResult> {
    const startTime = performance.now();
    
    console.log(`[UserInterventionRecovery] User intervention required for: ${error.message}`);
    
    try {
      const interventionPlan = this.createInterventionPlan(error, context);
      
      // In a real implementation, this would trigger UI notifications,
      // email alerts, or other user notification mechanisms
      console.warn(`[UserInterventionRecovery] User intervention plan:`, interventionPlan);
      
      return {
        success: true,
        strategy: this.strategy,
        actionId: this.id,
        duration: performance.now() - startTime,
        metadata: {
          interventionPlan,
          originalError: error.message,
          userMessage: interventionPlan.userMessage,
          actionRequired: interventionPlan.actionRequired,
          priority: interventionPlan.priority
        }
      };

    } catch (recoveryError) {
      console.error(`[UserInterventionRecovery] Recovery failed:`, recoveryError);
      
      return {
        success: false,
        strategy: this.strategy,
        actionId: this.id,
        duration: performance.now() - startTime,
        error: recoveryError as Error,
        metadata: {
          originalError: error.message,
          recoveryError: (recoveryError as Error).message
        }
      };
    }
  }

  private createInterventionPlan(error: ClassifiedError, context: ErrorContext): {
    userMessage: string;
    actionRequired: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    suggestedActions: string[];
    contactInfo?: string;
  } {
    const basePlan = {
      userMessage: '',
      actionRequired: '',
      priority: 'medium' as const,
      suggestedActions: [] as string[]
    };

    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        return {
          ...basePlan,
          userMessage: 'Authentication failed. Please check your credentials and try again.',
          actionRequired: 'Re-authenticate or check API keys',
          priority: 'high',
          suggestedActions: [
            'Check API key configuration',
            'Verify authentication tokens',
            'Contact system administrator'
          ]
        };

      case ErrorCategory.RATE_LIMIT:
        return {
          ...basePlan,
          userMessage: 'Rate limit exceeded. Please wait before trying again.',
          actionRequired: 'Wait for rate limit reset or upgrade service plan',
          priority: 'medium',
          suggestedActions: [
            'Wait for rate limit reset',
            'Upgrade to higher tier plan',
            'Implement request throttling'
          ]
        };

      case ErrorCategory.DATA_VALIDATION:
        return {
          ...basePlan,
          userMessage: 'Data validation failed. Please check your input and try again.',
          actionRequired: 'Fix input data or update validation rules',
          priority: 'medium',
          suggestedActions: [
            'Check input data format',
            'Verify required fields',
            'Update validation schemas'
          ]
        };

      default:
        return {
          ...basePlan,
          userMessage: `An error occurred: ${error.message}. Manual intervention may be required.`,
          actionRequired: 'Investigate error and take appropriate action',
          priority: error.severity === ErrorSeverity.CRITICAL ? 'critical' : 'medium',
          suggestedActions: [
            'Check system logs',
            'Restart affected services',
            'Contact technical support'
          ]
        };
    }
  }
}

// ================================
// RECOVERY STRATEGY MANAGER
// ================================

/**
 * Main recovery strategy manager that orchestrates error recovery
 */
export class RecoveryStrategyManager {
  private actions: RecoveryAction[] = [];
  private executionHistory = new Map<string, RecoveryResult[]>();

  constructor() {
    this.registerBuiltInActions();
  }

  /**
   * Register a recovery action
   */
  public registerAction(action: RecoveryAction): void {
    this.actions.push(action);
    this.actions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Create a recovery plan for a classified error
   */
  public createRecoveryPlan(error: ClassifiedError): RecoveryPlan {
    const applicableActions = this.actions.filter(action => action.canHandle(error));
    const fallbackActions = this.actions.filter(action => !action.canHandle(error));
    
    const estimatedDuration = applicableActions.reduce(
      (sum, action) => sum + action.timeout, 
      0
    );
    
    const confidence = applicableActions.length > 0 ? 
      Math.min(applicableActions.length * 0.2, 0.9) : 0.1;

    return {
      errorId: error.id,
      actions: applicableActions,
      fallbackActions: fallbackActions.slice(0, 3), // Limit fallback actions
      estimatedDuration,
      confidence,
      description: this.generatePlanDescription(applicableActions)
    };
  }

  /**
   * Execute recovery plan for an error
   */
  public async executeRecoveryPlan(
    error: ClassifiedError, 
    context: ErrorContext,
    plan?: RecoveryPlan
  ): Promise<RecoveryResult> {
    const recoveryPlan = plan || this.createRecoveryPlan(error);
    const executionResults: RecoveryResult[] = [];
    
    console.log(`[RecoveryManager] Executing recovery plan for error ${error.id} with ${recoveryPlan.actions.length} actions`);
    
    // Try primary recovery actions
    for (const action of recoveryPlan.actions) {
      try {
        console.log(`[RecoveryManager] Executing recovery action: ${action.name}`);
        
        const result = await this.executeActionWithTimeout(action, error, context);
        executionResults.push(result);
        
        if (result.success) {
          console.log(`[RecoveryManager] Recovery successful with action: ${action.name}`);
          this.recordExecution(error.id, executionResults);
          return result;
        }
        
        // Check if we should try the next action suggested by this action
        if (result.nextAction) {
          const nextAction = this.actions.find(a => a.id === result.nextAction);
          if (nextAction && !recoveryPlan.actions.includes(nextAction)) {
            console.log(`[RecoveryManager] Trying suggested next action: ${nextAction.name}`);
            const nextResult = await this.executeActionWithTimeout(nextAction, error, context);
            executionResults.push(nextResult);
            
            if (nextResult.success) {
              console.log(`[RecoveryManager] Recovery successful with suggested action: ${nextAction.name}`);
              this.recordExecution(error.id, executionResults);
              return nextResult;
            }
          }
        }
        
      } catch (actionError) {
        console.error(`[RecoveryManager] Recovery action ${action.name} threw error:`, actionError);
        
        const failureResult: RecoveryResult = {
          success: false,
          strategy: action.strategy,
          actionId: action.id,
          duration: 0,
          error: actionError as Error,
          metadata: {
            originalError: error.message,
            actionError: (actionError as Error).message
          }
        };
        
        executionResults.push(failureResult);
      }
    }
    
    // If all primary actions failed, try fallback actions
    console.log(`[RecoveryManager] Primary actions failed, trying fallback actions`);
    
    for (const fallbackAction of recoveryPlan.fallbackActions) {
      try {
        const result = await this.executeActionWithTimeout(fallbackAction, error, context);
        executionResults.push(result);
        
        if (result.success) {
          console.log(`[RecoveryManager] Recovery successful with fallback action: ${fallbackAction.name}`);
          this.recordExecution(error.id, executionResults);
          return result;
        }
        
      } catch (actionError) {
        console.error(`[RecoveryManager] Fallback action ${fallbackAction.name} threw error:`, actionError);
      }
    }
    
    // All recovery attempts failed
    const finalResult: RecoveryResult = {
      success: false,
      strategy: RecoveryStrategyType.USER_INTERVENTION,
      actionId: 'recovery-exhausted',
      duration: executionResults.reduce((sum, r) => sum + r.duration, 0),
      error: new Error('All recovery strategies exhausted'),
      metadata: {
        originalError: error.message,
        attemptedActions: executionResults.length,
        executionResults
      }
    };
    
    this.recordExecution(error.id, executionResults);
    console.error(`[RecoveryManager] All recovery attempts failed for error ${error.id}`);
    
    return finalResult;
  }

  /**
   * Get recovery history for an error
   */
  public getRecoveryHistory(errorId: string): RecoveryResult[] {
    return this.executionHistory.get(errorId) || [];
  }

  /**
   * Get all registered recovery actions
   */
  public getRegisteredActions(): readonly RecoveryAction[] {
    return [...this.actions];
  }

  /**
   * Get recovery statistics
   */
  public getRecoveryStatistics(): {
    totalRecoveries: number;
    successfulRecoveries: number;
    successRate: number;
    averageRecoveryTime: number;
    actionSuccessRates: Record<string, { attempts: number; successes: number; rate: number }>;
  } {
    const allResults = Array.from(this.executionHistory.values()).flat();
    const successful = allResults.filter(r => r.success);
    const actionStats: Record<string, { attempts: number; successes: number }> = {};
    
    for (const result of allResults) {
      if (!actionStats[result.actionId]) {
        actionStats[result.actionId] = { attempts: 0, successes: 0 };
      }
      actionStats[result.actionId].attempts++;
      if (result.success) {
        actionStats[result.actionId].successes++;
      }
    }
    
    const actionSuccessRates: Record<string, { attempts: number; successes: number; rate: number }> = {};
    for (const [actionId, stats] of Object.entries(actionStats)) {
      actionSuccessRates[actionId] = {
        ...stats,
        rate: stats.attempts > 0 ? stats.successes / stats.attempts : 0
      };
    }
    
    return {
      totalRecoveries: allResults.length,
      successfulRecoveries: successful.length,
      successRate: allResults.length > 0 ? successful.length / allResults.length : 0,
      averageRecoveryTime: allResults.length > 0 ? 
        allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length : 0,
      actionSuccessRates
    };
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private async executeActionWithTimeout(
    action: RecoveryAction,
    error: ClassifiedError,
    context: ErrorContext
  ): Promise<RecoveryResult> {
    if (action.timeout <= 0) {
      // No timeout for actions like user intervention
      return action.execute(error, context);
    }
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Recovery action timeout after ${action.timeout}ms`));
      }, action.timeout);
    });
    
    return Promise.race([
      action.execute(error, context),
      timeoutPromise
    ]);
  }

  private recordExecution(errorId: string, results: RecoveryResult[]): void {
    this.executionHistory.set(errorId, [...results]);
  }

  private generatePlanDescription(actions: RecoveryAction[]): string {
    if (actions.length === 0) {
      return 'No applicable recovery actions found';
    }
    
    const strategies = actions.map(a => a.name).join(' → ');
    return `Recovery plan: ${strategies}`;
  }

  private registerBuiltInActions(): void {
    this.registerAction(new RetryRecoveryAction());
    this.registerAction(new CircuitBreakerRecoveryAction());
    this.registerAction(new FallbackRecoveryAction());
    this.registerAction(new GracefulDegradationRecoveryAction());
    this.registerAction(new CompensationRecoveryAction());
    this.registerAction(new UserInterventionRecoveryAction());
  }
}

// ================================
// GLOBAL RECOVERY MANAGER
// ================================

/**
 * Global recovery strategy manager instance
 */
export const globalRecoveryManager = new RecoveryStrategyManager();

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Execute automatic error recovery
 */
export const executeErrorRecovery = async (
  error: ClassifiedError,
  context: ErrorContext
): Promise<RecoveryResult> => {
  return globalRecoveryManager.executeRecoveryPlan(error, context);
};

/**
 * Create recovery plan for an error
 */
export const createErrorRecoveryPlan = (error: ClassifiedError): RecoveryPlan => {
  return globalRecoveryManager.createRecoveryPlan(error);
};

/**
 * Get fallback recovery action instance (for manual fallback data management)
 */
export const getFallbackRecoveryAction = (): FallbackRecoveryAction => {
  const action = globalRecoveryManager.getRegisteredActions()
    .find(a => a.id === 'fallback-recovery') as FallbackRecoveryAction;
  
  if (!action) {
    throw new Error('Fallback recovery action not found');
  }
  
  return action;
};

/**
 * Get graceful degradation recovery action instance (for feature management)
 */
export const getGracefulDegradationAction = (): GracefulDegradationRecoveryAction => {
  const action = globalRecoveryManager.getRegisteredActions()
    .find(a => a.id === 'graceful-degradation-recovery') as GracefulDegradationRecoveryAction;
  
  if (!action) {
    throw new Error('Graceful degradation recovery action not found');
  }
  
  return action;
};

// Classes are already exported above, no need to re-export