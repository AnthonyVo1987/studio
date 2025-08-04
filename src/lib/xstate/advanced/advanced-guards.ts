/**
 * @fileoverview Advanced Guard System with Complex Conditional Logic
 * 
 * Provides sophisticated guard evaluation with composite logic, caching,
 * memoization, and performance optimization for complex state transitions.
 */

import type {
  CompositeGuard,
  GuardCondition,
  GuardEvaluationResult,
  AdvancedEvent
} from './advanced-types';
import type { 
  MacroExecutionContext,
  MacroExecutionEvent 
} from '@/lib/xstate/types/macro-types';

// ================================
// GUARD CACHE MANAGER
// ================================

/**
 * Cache manager for guard evaluation results with TTL support
 */
class GuardCache {
  private cache: Map<string, { result: boolean; expiry: number; metadata: any }> = new Map();
  private dependencyTracker: Map<string, Set<string>> = new Map();

  /**
   * Get cached result if still valid
   */
  get(cacheKey: string): { result: boolean; metadata: any } | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(cacheKey);
      return null;
    }

    return {
      result: cached.result,
      metadata: cached.metadata
    };
  }

  /**
   * Store result in cache
   */
  set(
    cacheKey: string, 
    result: boolean, 
    ttl: number, 
    metadata: any = {},
    dependencies: string[] = []
  ): void {
    this.cache.set(cacheKey, {
      result,
      expiry: Date.now() + ttl,
      metadata
    });

    // Track dependencies
    if (dependencies.length > 0) {
      this.dependencyTracker.set(cacheKey, new Set(dependencies));
    }
  }

  /**
   * Invalidate cache entries based on dependencies
   */
  invalidateDependencies(changedProperty: string): void {
    const keysToInvalidate: string[] = [];

    for (const [cacheKey, dependencies] of this.dependencyTracker.entries()) {
      if (dependencies.has(changedProperty)) {
        keysToInvalidate.push(cacheKey);
      }
    }

    keysToInvalidate.forEach(key => {
      this.cache.delete(key);
      this.dependencyTracker.delete(key);
    });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.dependencyTracker.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; dependencyCount: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
      dependencyCount: this.dependencyTracker.size
    };
  }
}

// ================================
// GUARD EVALUATION ENGINE
// ================================

/**
 * High-performance guard evaluation engine with caching and optimization
 */
export class GuardEngine {
  private cache: GuardCache = new GuardCache();
  private memoizedPredicates: Map<string, { predicate: Function; lastResult: boolean; lastContext: any }> = new Map();
  private evaluationMetrics: Map<string, { totalEvaluations: number; totalTime: number; cacheHits: number }> = new Map();

  /**
   * Evaluate composite guard with complex logical operations
   */
  evaluateCompositeGuard(
    guard: CompositeGuard,
    context: any,
    event: any
  ): GuardEvaluationResult {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(guard, context, event);
    
    // Check cache first
    if (guard.cachingStrategy !== 'none') {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          result: cached.result,
          evaluationPath: ['cache'],
          conditionResults: new Map(),
          evaluationTime: performance.now() - startTime,
          fromCache: true
        };
      }
    }

    // Evaluate conditions
    const conditionResults = new Map<string, boolean>();
    const evaluationPath: string[] = [];

    let result: boolean;

    switch (guard.type) {
      case 'AND':
        result = this.evaluateAND(guard.conditions, context, event, conditionResults, evaluationPath);
        break;
      case 'OR':
        result = this.evaluateOR(guard.conditions, context, event, conditionResults, evaluationPath);
        break;
      case 'NOT':
        result = this.evaluateNOT(guard.conditions, context, event, conditionResults, evaluationPath);
        break;
      case 'XOR':
        result = this.evaluateXOR(guard.conditions, context, event, conditionResults, evaluationPath);
        break;
      case 'IMPLIES':
        result = this.evaluateIMPLIES(guard.conditions, context, event, conditionResults, evaluationPath);
        break;
      default:
        throw new Error(`Unknown guard type: ${guard.type}`);
    }

    const evaluationTime = performance.now() - startTime;

    // Cache result if enabled
    if (guard.cachingStrategy === 'result' && guard.cacheTTL) {
      const dependencies = guard.conditions.flatMap(c => c.dependencies);
      this.cache.set(cacheKey, result, guard.cacheTTL, { evaluationPath }, dependencies);
    }

    // Update metrics
    this.updateEvaluationMetrics(cacheKey, evaluationTime, false);

    return {
      result,
      evaluationPath,
      conditionResults,
      evaluationTime,
      fromCache: false
    };
  }

  /**
   * Evaluate AND logic with short-circuit optimization
   */
  private evaluateAND(
    conditions: GuardCondition[],
    context: any,
    event: any,
    results: Map<string, boolean>,
    path: string[]
  ): boolean {
    path.push('AND');

    // Sort conditions by weight (lighter conditions first for faster short-circuit)
    const sortedConditions = [...conditions].sort((a, b) => a.weight - b.weight);

    for (const condition of sortedConditions) {
      const conditionResult = this.evaluateCondition(condition, context, event);
      results.set(condition.id, conditionResult);
      path.push(`${condition.id}:${conditionResult}`);

      if (!conditionResult) {
        // Short-circuit: AND fails if any condition is false
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate OR logic with short-circuit optimization
   */
  private evaluateOR(
    conditions: GuardCondition[],
    context: any,
    event: any,
    results: Map<string, boolean>,
    path: string[]
  ): boolean {
    path.push('OR');

    // Sort conditions by weight (heavier conditions first for faster short-circuit on true)
    const sortedConditions = [...conditions].sort((a, b) => b.weight - a.weight);

    for (const condition of sortedConditions) {
      const conditionResult = this.evaluateCondition(condition, context, event);
      results.set(condition.id, conditionResult);
      path.push(`${condition.id}:${conditionResult}`);

      if (conditionResult) {
        // Short-circuit: OR succeeds if any condition is true
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluate NOT logic
   */
  private evaluateNOT(
    conditions: GuardCondition[],
    context: any,
    event: any,
    results: Map<string, boolean>,
    path: string[]
  ): boolean {
    path.push('NOT');

    if (conditions.length !== 1) {
      throw new Error('NOT guard must have exactly one condition');
    }

    const condition = conditions[0];
    const conditionResult = this.evaluateCondition(condition, context, event);
    results.set(condition.id, conditionResult);
    path.push(`${condition.id}:${conditionResult}`);

    return !conditionResult;
  }

  /**
   * Evaluate XOR logic (exclusive or)
   */
  private evaluateXOR(
    conditions: GuardCondition[],
    context: any,
    event: any,
    results: Map<string, boolean>,
    path: string[]
  ): boolean {
    path.push('XOR');

    let trueCount = 0;

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context, event);
      results.set(condition.id, conditionResult);
      path.push(`${condition.id}:${conditionResult}`);

      if (conditionResult) {
        trueCount++;
      }
    }

    // XOR is true if exactly one condition is true
    return trueCount === 1;
  }

  /**
   * Evaluate IMPLIES logic (A → B ≡ ¬A ∨ B)
   */
  private evaluateIMPLIES(
    conditions: GuardCondition[],
    context: any,
    event: any,
    results: Map<string, boolean>,
    path: string[]
  ): boolean {
    path.push('IMPLIES');

    if (conditions.length !== 2) {
      throw new Error('IMPLIES guard must have exactly two conditions');
    }

    const [antecedent, consequent] = conditions;
    
    const antecedentResult = this.evaluateCondition(antecedent, context, event);
    results.set(antecedent.id, antecedentResult);
    path.push(`${antecedent.id}:${antecedentResult}`);

    // If antecedent is false, implication is automatically true
    if (!antecedentResult) {
      return true;
    }

    // If antecedent is true, evaluate consequent
    const consequentResult = this.evaluateCondition(consequent, context, event);
    results.set(consequent.id, consequentResult);
    path.push(`${consequent.id}:${consequentResult}`);

    return consequentResult;
  }

  /**
   * Evaluate individual condition with memoization
   */
  private evaluateCondition(
    condition: GuardCondition,
    context: any,
    event: any
  ): boolean {
    if (condition.memoize) {
      const memoized = this.memoizedPredicates.get(condition.id);
      
      if (memoized && this.contextEquals(memoized.lastContext, context)) {
        return memoized.lastResult;
      }
    }

    try {
      const result = condition.predicate(context, event);
      
      if (condition.memoize) {
        this.memoizedPredicates.set(condition.id, {
          predicate: condition.predicate,
          lastResult: result,
          lastContext: this.deepClone(context)
        });
      }
      
      return result;
    } catch (error) {
      console.warn(`Guard condition ${condition.id} evaluation failed:`, error);
      return false;
    }
  }

  /**
   * Generate cache key for guard evaluation
   */
  private generateCacheKey(guard: CompositeGuard, context: any, event: any): string {
    const guardHash = JSON.stringify({
      type: guard.type,
      conditionIds: guard.conditions.map(c => c.id),
      contextHash: this.hashObject(context),
      eventHash: this.hashObject(event)
    });
    
    return `guard-${this.hashString(guardHash)}`;
  }

  /**
   * Simple object hashing for cache keys
   */
  private hashObject(obj: any): string {
    return this.hashString(JSON.stringify(obj));
  }

  /**
   * Simple string hashing function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Deep equality check for context objects
   */
  private contextEquals(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  /**
   * Deep clone object for memoization
   */
  private deepClone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Update evaluation metrics
   */
  private updateEvaluationMetrics(cacheKey: string, evaluationTime: number, fromCache: boolean): void {
    if (!this.evaluationMetrics.has(cacheKey)) {
      this.evaluationMetrics.set(cacheKey, {
        totalEvaluations: 0,
        totalTime: 0,
        cacheHits: 0
      });
    }

    const metrics = this.evaluationMetrics.get(cacheKey)!;
    metrics.totalEvaluations++;
    metrics.totalTime += evaluationTime;
    
    if (fromCache) {
      metrics.cacheHits++;
    }
  }

  /**
   * Invalidate cache for specific context properties
   */
  invalidateCache(changedProperties: string[]): void {
    changedProperties.forEach(property => {
      this.cache.invalidateDependencies(property);
    });
  }

  /**
   * Clear all memoized results
   */
  clearMemoization(): void {
    this.memoizedPredicates.clear();
  }

  /**
   * Get evaluation metrics
   */
  getMetrics(): Map<string, { totalEvaluations: number; averageTime: number; cacheHitRate: number }> {
    const processedMetrics = new Map();
    
    for (const [key, metrics] of this.evaluationMetrics.entries()) {
      processedMetrics.set(key, {
        totalEvaluations: metrics.totalEvaluations,
        averageTime: metrics.totalTime / metrics.totalEvaluations,
        cacheHitRate: metrics.cacheHits / metrics.totalEvaluations
      });
    }
    
    return processedMetrics;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cache.clear();
    this.memoizedPredicates.clear();
    this.evaluationMetrics.clear();
  }
}

// ================================
// PREDEFINED GUARD CONDITIONS
// ================================

/**
 * Library of common guard conditions for StockSage macro operations
 */
export const StockSageGuardConditions = {
  /**
   * Check if ticker data exists and is valid
   */
  hasValidTickerData: (ticker: string): GuardCondition => ({
    id: `hasValidTickerData-${ticker}`,
    predicate: (context: MacroExecutionContext) => {
      const stockData = context.stepResults.get(2); // Step 2 is typically stock data
      return stockData?.status === 'success' && stockData.data;
    },
    weight: 1,
    memoize: true,
    dependencies: ['stepResults', 'currentStep']
  }),

  /**
   * Check if AI analysis is complete
   */
  hasAIAnalysis: (): GuardCondition => ({
    id: 'hasAIAnalysis',
    predicate: (context: MacroExecutionContext) => {
      const aiData = context.stepResults.get(3); // Step 3 is typically AI takeaways
      return aiData?.status === 'success' && aiData.data;
    },
    weight: 2,
    memoize: true,
    dependencies: ['stepResults']
  }),

  /**
   * Check if expiration date is selected and valid
   */
  hasValidExpiration: (): GuardCondition => ({
    id: 'hasValidExpiration',
    predicate: (context: MacroExecutionContext) => {
      return Boolean(context.selectedExpiration) && 
             new Date(context.selectedExpiration!) >= new Date();
    },
    weight: 1,
    memoize: true,
    dependencies: ['selectedExpiration']
  }),

  /**
   * Check if retry limit has been exceeded
   */
  canRetry: (maxRetries: number = 2): GuardCondition => ({
    id: `canRetry-${maxRetries}`,
    predicate: (context: MacroExecutionContext) => {
      return context.currentRetryAttempt < maxRetries;
    },
    weight: 1,
    memoize: false, // Don't memoize retry checks
    dependencies: ['currentRetryAttempt']
  }),

  /**
   * Check if execution was cancelled
   */
  isNotCancelled: (): GuardCondition => ({
    id: 'isNotCancelled',
    predicate: (context: MacroExecutionContext) => {
      return !context.cancelled;
    },
    weight: 1,
    memoize: true,
    dependencies: ['cancelled']
  }),

  /**
   * Check if all prerequisites are met for a step
   */
  prerequisitesMet: (stepId: number): GuardCondition => ({
    id: `prerequisitesMet-${stepId}`,
    predicate: (context: MacroExecutionContext) => {
      // This would check if all required data for the step exists
      const requiredSteps = Array.from({ length: stepId - 1 }, (_, i) => i + 1);
      return requiredSteps.every(step => 
        context.stepResults.has(step) && 
        context.stepResults.get(step)?.status === 'success'
      );
    },
    weight: 3,
    memoize: true,
    dependencies: ['stepResults', 'completedSteps']
  }),

  /**
   * Check if within timeout constraints
   */
  withinTimeout: (timeoutMs: number): GuardCondition => ({
    id: `withinTimeout-${timeoutMs}`,
    predicate: (context: MacroExecutionContext) => {
      if (!context.startTime) return true;
      return Date.now() - context.startTime < timeoutMs;
    },
    weight: 1,
    memoize: false, // Don't memoize time-based checks
    dependencies: ['startTime']
  }),

  /**
   * Check resource availability
   */
  hasResources: (resourceType: string, amount: number): GuardCondition => ({
    id: `hasResources-${resourceType}-${amount}`,
    predicate: (context: any) => {
      // This would check resource availability from resource manager
      return true; // Simplified for now
    },
    weight: 2,
    memoize: true,
    dependencies: ['resourceAllocations']
  })
};

// ================================
// COMPOSITE GUARD BUILDERS
// ================================

/**
 * Builder utilities for creating composite guards
 */
export const GuardBuilder = {
  /**
   * Create AND composite guard
   */
  and(...conditions: GuardCondition[]): CompositeGuard {
    return {
      type: 'AND',
      conditions,
      dynamicEvaluation: true,
      cachingStrategy: 'result',
      cacheTTL: 30000 // 30 seconds
    };
  },

  /**
   * Create OR composite guard
   */
  or(...conditions: GuardCondition[]): CompositeGuard {
    return {
      type: 'OR',
      conditions,
      dynamicEvaluation: true,
      cachingStrategy: 'result',
      cacheTTL: 30000
    };
  },

  /**
   * Create NOT composite guard
   */
  not(condition: GuardCondition): CompositeGuard {
    return {
      type: 'NOT',
      conditions: [condition],
      dynamicEvaluation: true,
      cachingStrategy: 'result',
      cacheTTL: 30000
    };
  },

  /**
   * Create XOR composite guard
   */
  xor(...conditions: GuardCondition[]): CompositeGuard {
    return {
      type: 'XOR',
      conditions,
      dynamicEvaluation: true,
      cachingStrategy: 'result',
      cacheTTL: 30000
    };
  },

  /**
   * Create IMPLIES composite guard
   */
  implies(antecedent: GuardCondition, consequent: GuardCondition): CompositeGuard {
    return {
      type: 'IMPLIES',
      conditions: [antecedent, consequent],
      dynamicEvaluation: true,
      cachingStrategy: 'result',
      cacheTTL: 30000
    };
  },

  /**
   * Create complex nested guard
   */
  complex(
    type: CompositeGuard['type'],
    conditions: GuardCondition[],
    options: {
      cachingStrategy?: CompositeGuard['cachingStrategy'];
      cacheTTL?: number;
      dynamicEvaluation?: boolean;
    } = {}
  ): CompositeGuard {
    return {
      type,
      conditions,
      dynamicEvaluation: options.dynamicEvaluation ?? true,
      cachingStrategy: options.cachingStrategy ?? 'result',
      cacheTTL: options.cacheTTL ?? 30000
    };
  }
};

// ================================
// USAGE EXAMPLES
// ================================

/**
 * Example guard configurations for common StockSage scenarios
 */
export const ExampleGuardConfigurations = {
  /**
   * Guard for executing AI analysis step
   */
  canExecuteAIAnalysis: GuardBuilder.and(
    StockSageGuardConditions.hasValidTickerData('NVDA'),
    StockSageGuardConditions.hasValidExpiration(),
    StockSageGuardConditions.isNotCancelled(),
    StockSageGuardConditions.withinTimeout(300000) // 5 minutes
  ),

  /**
   * Guard for retry logic
   */
  canRetryOperation: GuardBuilder.and(
    StockSageGuardConditions.canRetry(2),
    StockSageGuardConditions.isNotCancelled(),
    GuardBuilder.not(StockSageGuardConditions.withinTimeout(600000)) // Not within 10 minutes (timeout occurred)
  ),

  /**
   * Guard for options analysis
   */
  canExecuteOptionsAnalysis: GuardBuilder.and(
    StockSageGuardConditions.hasValidTickerData('NVDA'),
    StockSageGuardConditions.hasAIAnalysis(),
    StockSageGuardConditions.prerequisitesMet(4),
    StockSageGuardConditions.hasResources('api', 1)
  ),

  /**
   * Complex guard with multiple paths
   */
  complexExecutionGuard: GuardBuilder.or(
    StockSageGuardConditions.hasValidTickerData('NVDA'),
    StockSageGuardConditions.hasValidExpiration(),
    StockSageGuardConditions.hasAIAnalysis(),
    StockSageGuardConditions.canRetry(1)
  )
};

// ================================
// EXPORTS
// ================================

export {
  type CompositeGuard,
  type GuardCondition,
  type GuardEvaluationResult
};