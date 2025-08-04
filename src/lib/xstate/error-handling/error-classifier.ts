/**
 * Error Classification Engine
 * 
 * Intelligent error categorization and analysis system that integrates with 
 * existing v4.4.3.5 AI timeout protection patterns.
 */

import {
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  type ClassifiedError,
  type ErrorContext,
  type ErrorClassification,
  type ClassificationRule
} from './error-types';

// ================================
// CLASSIFICATION RULES ENGINE
// ================================

/**
 * Built-in classification rules for common error patterns
 */
export const DEFAULT_CLASSIFICATION_RULES: ClassificationRule[] = [
  // Network Errors (v4.4.3.5 compatibility)
  {
    id: 'network-timeout',
    name: 'Network Timeout',
    pattern: '(timeout|ENOTFOUND|ECONNRESET|ECONNREFUSED)',
    category: ErrorCategory.TIMEOUT,
    severity: ErrorSeverity.MEDIUM,
    weight: 0.9,
    description: 'Network connectivity issues and timeouts'
  },
  {
    id: 'network-dns',
    name: 'DNS Resolution Failed',
    pattern: 'ENOTFOUND|getaddrinfo',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    weight: 0.85,
    description: 'DNS resolution failures'
  },
  {
    id: 'network-connection-reset',
    name: 'Connection Reset',
    pattern: 'ECONNRESET|connection.*reset',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    weight: 0.8,
    description: 'Connection reset by peer'
  },

  // AI Service Errors (v4.4.3.5 specific patterns)
  {
    id: 'ai-timeout-45s',
    name: 'AI Service 45s Timeout',
    pattern: 'Request timeout after 45 seconds|timeout.*45.*second',
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.HIGH,
    weight: 0.95,
    description: 'AI service hitting 45-second timeout limit'
  },
  {
    id: 'ai-quota-exceeded',
    name: 'AI Quota Exceeded',
    pattern: 'quota|rate limit|too many requests|429',
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.HIGH,
    weight: 0.9,
    description: 'AI service quota or rate limit exceeded'
  },
  {
    id: 'ai-model-error', 
    name: 'AI Model Error',
    pattern: 'model.*error|generation.*failed|invalid.*model',
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.HIGH,
    weight: 0.8,
    description: 'AI model processing errors'
  },
  {
    id: 'ai-empty-response',
    name: 'AI Empty Response',
    pattern: '^\\{\\}$|empty.*response|no.*content',
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.MEDIUM,
    weight: 0.75,
    description: 'AI service returning empty or invalid responses'
  },

  // Data Validation Errors
  {
    id: 'json-parse-error',
    name: 'JSON Parse Error',
    pattern: 'JSON|parse|invalid.*json|unexpected.*token',
    category: ErrorCategory.DATA_VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    weight: 0.8,
    description: 'JSON parsing and validation errors'
  },
  {
    id: 'schema-validation',
    name: 'Schema Validation Error',
    pattern: 'schema|validation|zod|invalid.*input',
    category: ErrorCategory.DATA_VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    weight: 0.75,
    description: 'Data schema validation failures'
  },

  // Business Logic Errors (StockSage specific)
  {
    id: 'prerequisites-not-met',
    name: 'Prerequisites Not Met',
    pattern: 'prerequisites.*not.*met|required.*data.*missing',
    category: ErrorCategory.BUSINESS_LOGIC,
    severity: ErrorSeverity.HIGH,
    weight: 0.9,
    description: 'Macro automation prerequisites validation failure'
  },
  {
    id: 'macro-state-stale',
    name: 'Stale State Access',
    pattern: 'stale.*closure|state.*null|undefined.*expiration',
    category: ErrorCategory.BUSINESS_LOGIC,
    severity: ErrorSeverity.HIGH,
    weight: 0.85,
    description: 'React stale closure issues in macro automation'
  },
  {
    id: 'options-chain-error',
    name: 'Options Chain Error',
    pattern: 'options.*chain|expiration.*invalid|contract.*not.*found',
    category: ErrorCategory.BUSINESS_LOGIC,
    severity: ErrorSeverity.MEDIUM,
    weight: 0.7,
    description: 'Options chain data processing errors'
  },

  // Authentication & Authorization
  {
    id: 'auth-token-expired',
    name: 'Authentication Token Expired',
    pattern: 'token.*expired|unauthorized|401|invalid.*credentials',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    weight: 0.9,
    description: 'Authentication token expiration or invalid credentials'
  },
  {
    id: 'auth-forbidden',
    name: 'Access Forbidden',
    pattern: 'forbidden|403|access.*denied|insufficient.*permissions',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    weight: 0.85,
    description: 'Insufficient permissions for requested operation'
  },

  // UI and Rendering Errors
  {
    id: 'react-render-error',
    name: 'React Rendering Error',
    pattern: 'react|render|component|hook.*error|minified.*react',
    category: ErrorCategory.UI_RENDER,
    severity: ErrorSeverity.MEDIUM,
    weight: 0.7,
    description: 'React component rendering and hook errors'
  },

  // System Errors
  {
    id: 'out-of-memory',
    name: 'Out of Memory',
    pattern: 'out.*of.*memory|memory.*exceeded|heap.*limit',
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.CRITICAL,
    weight: 0.95,
    description: 'System memory exhaustion'
  },
  {
    id: 'filesystem-error',
    name: 'Filesystem Error',
    pattern: 'ENOENT|EACCES|EMFILE|no.*such.*file|permission.*denied',
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.HIGH,
    weight: 0.8,
    description: 'Filesystem access errors'
  }
];

// ================================
// ERROR CLASSIFIER CLASS
// ================================

/**
 * Advanced error classification engine with pattern matching and confidence scoring
 */
export class ErrorClassifier {
  private rules: ClassificationRule[];
  private classificationCache = new Map<string, ErrorClassification>();
  private similarityThreshold = 0.7;

  constructor(customRules: ClassificationRule[] = []) {
    this.rules = [...DEFAULT_CLASSIFICATION_RULES, ...customRules]
      .sort((a, b) => b.weight - a.weight); // Sort by weight descending
  }

  /**
   * Classify an error with confidence scoring and recovery strategy recommendation
   */
  public classify(error: Error, context: ErrorContext): ErrorClassification {
    const errorKey = this.generateErrorKey(error, context);
    
    // Check cache first
    if (this.classificationCache.has(errorKey)) {
      return this.classificationCache.get(errorKey)!;
    }

    const matchedRules = this.matchRules(error, context);
    const classification = this.buildClassification(error, context, matchedRules);
    
    // Cache the result
    this.classificationCache.set(errorKey, classification);
    
    return classification;
  }

  /**
   * Create a classified error from a raw error
   */
  public createClassifiedError(
    error: Error, 
    context: ErrorContext,
    id?: string
  ): ClassifiedError {
    const classification = this.classify(error, context);
    
    const classifiedError = Object.assign(error, {
      id: id || this.generateErrorId(),
      timestamp: new Date(),
      category: classification.category,
      severity: classification.severity,
      isRetryable: classification.isRetryable,
      context,
      classification,
      originalError: error
    }) as ClassifiedError;

    return classifiedError;
  }

  /**
   * Batch classify multiple errors for analysis
   */
  public classifyBatch(errors: { error: Error; context: ErrorContext }[]): ClassifiedError[] {
    return errors.map(({ error, context }) => 
      this.createClassifiedError(error, context)
    );
  }

  /**
   * Find similar errors based on classification patterns
   */
  public findSimilarErrors(error: Error, context: ErrorContext, limit = 5): string[] {
    const classification = this.classify(error, context);
    const similarErrors: Array<{ id: string; similarity: number }> = [];

    // Search through cached classifications
    for (const [cachedKey, cachedClassification] of this.classificationCache) {
      if (cachedKey === this.generateErrorKey(error, context)) continue;

      const similarity = this.calculateSimilarity(classification, cachedClassification);
      if (similarity >= this.similarityThreshold) {
        similarErrors.push({ id: cachedKey, similarity });
      }
    }

    return similarErrors
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.id);
  }

  /**
   * Add custom classification rule
   */
  public addRule(rule: ClassificationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.weight - a.weight);
    this.clearCache(); // Clear cache when rules change
  }

  /**
   * Remove classification rule by ID
   */
  public removeRule(ruleId: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    
    if (this.rules.length < initialLength) {
      this.clearCache();
      return true;
    }
    return false;
  }

  /**
   * Get all active classification rules
   */
  public getRules(): readonly ClassificationRule[] {
    return [...this.rules];
  }

  /**
   * Clear classification cache
   */
  public clearCache(): void {
    this.classificationCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; hitRate: number } {
    // Simple implementation - in real system would track hits/misses
    return {
      size: this.classificationCache.size,
      hitRate: 0.8 // Placeholder
    };
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private matchRules(error: Error, context: ErrorContext): ClassificationRule[] {
    const errorText = this.extractErrorText(error, context);
    const matchedRules: ClassificationRule[] = [];

    for (const rule of this.rules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(errorText)) {
          matchedRules.push(rule);
        }
      } catch (regexError) {
        console.warn(`Invalid regex pattern in rule ${rule.id}: ${rule.pattern}`);
      }
    }

    return matchedRules;
  }

  private buildClassification(
    error: Error,
    context: ErrorContext,
    matchedRules: ClassificationRule[]
  ): ErrorClassification {
    if (matchedRules.length === 0) {
      return this.getDefaultClassification(error, context);
    }

    // Weight-based classification
    const topRule = matchedRules[0];
    const confidence = this.calculateConfidence(matchedRules);
    const suggestedStrategy = this.suggestRecoveryStrategy(topRule.category, topRule.severity);
    const isRetryable = this.determineRetryability(topRule.category, topRule.severity);
    const estimatedRecoveryTime = this.estimateRecoveryTime(topRule.category, topRule.severity);
    const similarErrors = this.findSimilarErrors(error, context);

    return {
      category: topRule.category,
      severity: topRule.severity,
      confidence,
      suggestedStrategy,
      isRetryable,
      estimatedRecoveryTime,
      similarErrors,
      classificationRules: matchedRules
    };
  }

  private getDefaultClassification(error: Error, context: ErrorContext): ErrorClassification {
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      confidence: 0.1,
      suggestedStrategy: RecoveryStrategy.USER_INTERVENTION,
      isRetryable: false,
      estimatedRecoveryTime: 0,
      similarErrors: [],
      classificationRules: []
    };
  }

  private extractErrorText(error: Error, context: ErrorContext): string {
    const parts = [
      error.message,
      error.name,
      error.stack,
      context.operation,
      context.component,
      JSON.stringify(context.metadata)
    ].filter(Boolean);

    return parts.join(' ').toLowerCase();
  }

  private calculateConfidence(matchedRules: ClassificationRule[]): number {
    if (matchedRules.length === 0) return 0;
    
    // Confidence based on top rule weight and number of matching rules
    const topWeight = matchedRules[0].weight;
    const matchBonus = Math.min(matchedRules.length * 0.1, 0.3);
    
    return Math.min(topWeight + matchBonus, 1.0);
  }

  private suggestRecoveryStrategy(category: ErrorCategory, severity: ErrorSeverity): RecoveryStrategy {
    // Strategy mapping based on category and severity
    const strategyMap: Record<ErrorCategory, Record<ErrorSeverity, RecoveryStrategy>> = {
      [ErrorCategory.NETWORK]: {
        [ErrorSeverity.LOW]: RecoveryStrategy.RETRY,
        [ErrorSeverity.MEDIUM]: RecoveryStrategy.RETRY,
        [ErrorSeverity.HIGH]: RecoveryStrategy.CIRCUIT_BREAKER,
        [ErrorSeverity.CRITICAL]: RecoveryStrategy.FALLBACK
      },
      [ErrorCategory.TIMEOUT]: {
        [ErrorSeverity.LOW]: RecoveryStrategy.RETRY,
        [ErrorSeverity.MEDIUM]: RecoveryStrategy.RETRY,
        [ErrorSeverity.HIGH]: RecoveryStrategy.CIRCUIT_BREAKER,
        [ErrorSeverity.CRITICAL]: RecoveryStrategy.FALLBACK
      },
      [ErrorCategory.AI_SERVICE]: {
        [ErrorSeverity.LOW]: RecoveryStrategy.RETRY,
        [ErrorSeverity.MEDIUM]: RecoveryStrategy.RETRY,
        [ErrorSeverity.HIGH]: RecoveryStrategy.CIRCUIT_BREAKER,
        [ErrorSeverity.CRITICAL]: RecoveryStrategy.FALLBACK
      },
      [ErrorCategory.DATA_VALIDATION]: {
        [ErrorSeverity.LOW]: RecoveryStrategy.GRACEFUL_DEGRADATION,
        [ErrorSeverity.MEDIUM]: RecoveryStrategy.FALLBACK,
        [ErrorSeverity.HIGH]: RecoveryStrategy.USER_INTERVENTION,
        [ErrorSeverity.CRITICAL]: RecoveryStrategy.COMPENSATION
      },
      [ErrorCategory.BUSINESS_LOGIC]: {
        [ErrorSeverity.LOW]: RecoveryStrategy.GRACEFUL_DEGRADATION,
        [ErrorSeverity.MEDIUM]: RecoveryStrategy.COMPENSATION,
        [ErrorSeverity.HIGH]: RecoveryStrategy.COMPENSATION,
        [ErrorSeverity.CRITICAL]: RecoveryStrategy.SYSTEM_RESTART
      },
      [ErrorCategory.UI_RENDER]: {
        [ErrorSeverity.LOW]: RecoveryStrategy.GRACEFUL_DEGRADATION,
        [ErrorSeverity.MEDIUM]: RecoveryStrategy.FALLBACK,
        [ErrorSeverity.HIGH]: RecoveryStrategy.USER_INTERVENTION,
        [ErrorSeverity.CRITICAL]: RecoveryStrategy.SYSTEM_RESTART
      },
      [ErrorCategory.AUTHENTICATION]: {
        [ErrorSeverity.LOW]: RecoveryStrategy.RETRY,
        [ErrorSeverity.MEDIUM]: RecoveryStrategy.USER_INTERVENTION,
        [ErrorSeverity.HIGH]: RecoveryStrategy.USER_INTERVENTION,
        [ErrorSeverity.CRITICAL]: RecoveryStrategy.SYSTEM_RESTART
      },
      [ErrorCategory.RATE_LIMIT]: {
        [ErrorSeverity.LOW]: RecoveryStrategy.RETRY,
        [ErrorSeverity.MEDIUM]: RecoveryStrategy.CIRCUIT_BREAKER,
        [ErrorSeverity.HIGH]: RecoveryStrategy.FALLBACK,
        [ErrorSeverity.CRITICAL]: RecoveryStrategy.GRACEFUL_DEGRADATION
      },
      [ErrorCategory.SYSTEM]: {
        [ErrorSeverity.LOW]: RecoveryStrategy.RETRY,
        [ErrorSeverity.MEDIUM]: RecoveryStrategy.FALLBACK,
        [ErrorSeverity.HIGH]: RecoveryStrategy.SYSTEM_RESTART,
        [ErrorSeverity.CRITICAL]: RecoveryStrategy.SYSTEM_RESTART
      },
      [ErrorCategory.UNKNOWN]: {
        [ErrorSeverity.LOW]: RecoveryStrategy.GRACEFUL_DEGRADATION,
        [ErrorSeverity.MEDIUM]: RecoveryStrategy.USER_INTERVENTION,
        [ErrorSeverity.HIGH]: RecoveryStrategy.USER_INTERVENTION,
        [ErrorSeverity.CRITICAL]: RecoveryStrategy.SYSTEM_RESTART
      }
    };

    return strategyMap[category]?.[severity] || RecoveryStrategy.USER_INTERVENTION;
  }

  private determineRetryability(category: ErrorCategory, severity: ErrorSeverity): boolean {
    const retryableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.TIMEOUT,
      ErrorCategory.AI_SERVICE,
      ErrorCategory.RATE_LIMIT
    ];

    const nonRetryableSeverities = [ErrorSeverity.CRITICAL];

    return retryableCategories.includes(category) && !nonRetryableSeverities.includes(severity);
  }

  private estimateRecoveryTime(category: ErrorCategory, severity: ErrorSeverity): number {
    // Recovery time estimates in milliseconds
    const timeMap: Record<ErrorCategory, Record<ErrorSeverity, number>> = {
      [ErrorCategory.NETWORK]: {
        [ErrorSeverity.LOW]: 1000,
        [ErrorSeverity.MEDIUM]: 5000,
        [ErrorSeverity.HIGH]: 15000,
        [ErrorSeverity.CRITICAL]: 60000
      },
      [ErrorCategory.TIMEOUT]: {
        [ErrorSeverity.LOW]: 2000,
        [ErrorSeverity.MEDIUM]: 8000,
        [ErrorSeverity.HIGH]: 20000,
        [ErrorSeverity.CRITICAL]: 60000
      },
      [ErrorCategory.AI_SERVICE]: {
        [ErrorSeverity.LOW]: 3000,
        [ErrorSeverity.MEDIUM]: 10000,
        [ErrorSeverity.HIGH]: 30000,
        [ErrorSeverity.CRITICAL]: 120000
      },
      [ErrorCategory.DATA_VALIDATION]: {
        [ErrorSeverity.LOW]: 500,
        [ErrorSeverity.MEDIUM]: 2000,
        [ErrorSeverity.HIGH]: 5000,
        [ErrorSeverity.CRITICAL]: 10000
      },
      [ErrorCategory.BUSINESS_LOGIC]: {
        [ErrorSeverity.LOW]: 1000,
        [ErrorSeverity.MEDIUM]: 5000,
        [ErrorSeverity.HIGH]: 15000,
        [ErrorSeverity.CRITICAL]: 300000
      },
      [ErrorCategory.UI_RENDER]: {
        [ErrorSeverity.LOW]: 100,
        [ErrorSeverity.MEDIUM]: 1000,
        [ErrorSeverity.HIGH]: 5000,
        [ErrorSeverity.CRITICAL]: 30000
      },
      [ErrorCategory.AUTHENTICATION]: {
        [ErrorSeverity.LOW]: 2000,
        [ErrorSeverity.MEDIUM]: 10000,
        [ErrorSeverity.HIGH]: 30000,
        [ErrorSeverity.CRITICAL]: 0 // Manual intervention required
      },
      [ErrorCategory.RATE_LIMIT]: {
        [ErrorSeverity.LOW]: 5000,
        [ErrorSeverity.MEDIUM]: 30000,
        [ErrorSeverity.HIGH]: 300000,
        [ErrorSeverity.CRITICAL]: 3600000
      },
      [ErrorCategory.SYSTEM]: {
        [ErrorSeverity.LOW]: 2000,
        [ErrorSeverity.MEDIUM]: 10000,
        [ErrorSeverity.HIGH]: 60000,
        [ErrorSeverity.CRITICAL]: 0 // System restart required
      },
      [ErrorCategory.UNKNOWN]: {
        [ErrorSeverity.LOW]: 5000,
        [ErrorSeverity.MEDIUM]: 15000,
        [ErrorSeverity.HIGH]: 60000,
        [ErrorSeverity.CRITICAL]: 0
      }
    };

    return timeMap[category]?.[severity] || 0;
  }

  private calculateSimilarity(
    classification1: ErrorClassification,
    classification2: ErrorClassification
  ): number {
    let similarity = 0;

    // Category match (40% weight)
    if (classification1.category === classification2.category) {
      similarity += 0.4;
    }

    // Severity match (30% weight)
    if (classification1.severity === classification2.severity) {
      similarity += 0.3;
    }

    // Strategy match (20% weight)
    if (classification1.suggestedStrategy === classification2.suggestedStrategy) {
      similarity += 0.2;
    }

    // Retryability match (10% weight)
    if (classification1.isRetryable === classification2.isRetryable) {
      similarity += 0.1;
    }

    return similarity;
  }

  private generateErrorKey(error: Error, context: ErrorContext): string {
    return `${error.name}:${error.message}:${context.operation}:${context.component}`;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Create a default error classifier instance
 */
export const createErrorClassifier = (customRules: ClassificationRule[] = []): ErrorClassifier => {
  return new ErrorClassifier(customRules);
};

/**
 * Global error classifier instance for singleton usage
 */
export const globalErrorClassifier = createErrorClassifier();

/**
 * Quick classification utility function
 */
export const classifyError = (error: Error, context: ErrorContext): ErrorClassification => {
  return globalErrorClassifier.classify(error, context);
};

/**
 * Quick classified error creation utility
 */
export const createClassifiedError = (
  error: Error,
  context: ErrorContext,
  id?: string
): ClassifiedError => {
  return globalErrorClassifier.createClassifiedError(error, context, id);
};

/**
 * Create error context from common parameters
 */
export const createErrorContext = (params: {
  ticker?: string;
  operation?: string;
  step?: string;
  component?: string;
  metadata?: Record<string, unknown>;
}): ErrorContext => {
  return {
    ticker: params.ticker,
    operation: params.operation,
    step: params.step,
    component: params.component,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    metadata: params.metadata || {},
    stackTrace: new Error().stack,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
  };
};

export default ErrorClassifier;