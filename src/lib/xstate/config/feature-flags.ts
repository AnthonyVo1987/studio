/**
 * Configuration Management System - Feature Flags
 * 
 * Advanced feature flag management with real-time toggles,
 * rollout strategies, A/B testing, and conditional activation.
 */

import type {
  FeatureFlagConfig,
  FeatureFlagState,
  ConfigEnvironment,
  ConfigChangeEvent
} from './config-types';
import { FeatureFlagConfigSchema } from './config-schemas';

// Feature flag evaluation context
export interface FeatureFlagContext {
  userId?: string;
  userAttributes?: Record<string, any>;
  environment: ConfigEnvironment;
  timestamp: string;
  sessionId?: string;
  customProperties?: Record<string, any>;
}

// Feature flag evaluation result
export interface FeatureFlagResult {
  enabled: boolean;
  variant?: string;
  reason: string;
  metadata?: Record<string, any>;
}

// Feature flag rollout strategy
export interface RolloutStrategy {
  type: 'percentage' | 'user_attribute' | 'time_window' | 'custom';
  configuration: Record<string, any>;
}

// Feature flag variant configuration
export interface FeatureFlagVariant {
  key: string;
  weight: number;
  configuration?: Record<string, any>;
}

// Advanced feature flag configuration
export interface AdvancedFeatureFlagConfig extends FeatureFlagConfig {
  variants?: FeatureFlagVariant[];
  rolloutStrategy?: RolloutStrategy;
  targeting?: {
    rules: Array<{
      conditions: Array<{
        attribute: string;
        operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
        value: any;
      }>;
      result: boolean | string;
    }>;
    defaultResult: boolean | string;
  };
  metrics?: {
    trackConversions: boolean;
    conversionGoals: string[];
    customEvents: string[];
  };
}

// Feature flag manager
export class FeatureFlagManager {
  private flags: Map<string, AdvancedFeatureFlagConfig> = new Map();
  private subscribers: Map<string, Set<(result: FeatureFlagResult) => void>> = new Map();
  private cache: Map<string, { result: FeatureFlagResult; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute
  private evaluationCount = 0;

  constructor() {
    this.initializeDefaultFlags();
  }

  // Register feature flag
  registerFlag(flag: AdvancedFeatureFlagConfig): void {
    try {
      // Validate flag configuration
      const validation = this.validateFlag(flag);
      if (!validation.valid) {
        throw new Error(`Invalid feature flag: ${validation.errors.join(', ')}`);
      }

      this.flags.set(flag.key, flag);
      console.log(`Feature flag registered: ${flag.key}`);

      // Notify subscribers of flag registration
      this.notifySubscribers(flag.key);
    } catch (error) {
      console.error(`Failed to register feature flag ${flag.key}:`, error);
      throw error;
    }
  }

  // Update feature flag
  updateFlag(key: string, updates: Partial<AdvancedFeatureFlagConfig>): void {
    const existingFlag = this.flags.get(key);
    if (!existingFlag) {
      throw new Error(`Feature flag not found: ${key}`);
    }

    const updatedFlag = { ...existingFlag, ...updates };
    
    // Validate updated flag
    const validation = this.validateFlag(updatedFlag);
    if (!validation.valid) {
      throw new Error(`Invalid feature flag update: ${validation.errors.join(', ')}`);
    }

    this.flags.set(key, updatedFlag);
    
    // Clear cache for this flag
    this.clearFlagCache(key);
    
    console.log(`Feature flag updated: ${key}`);
    
    // Notify subscribers of flag update
    this.notifySubscribers(key);
  }

  // Remove feature flag
  removeFlag(key: string): void {
    if (!this.flags.has(key)) {
      console.warn(`Feature flag not found: ${key}`);
      return;
    }

    this.flags.delete(key);
    this.clearFlagCache(key);
    this.subscribers.delete(key);
    
    console.log(`Feature flag removed: ${key}`);
  }

  // Evaluate feature flag
  evaluateFlag(key: string, context: FeatureFlagContext): FeatureFlagResult {
    this.evaluationCount++;
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(key, context);
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.result;
      }

      const flag = this.flags.get(key);
      if (!flag) {
        const result: FeatureFlagResult = {
          enabled: false,
          reason: 'FLAG_NOT_FOUND',
          metadata: { key, evaluationCount: this.evaluationCount }
        };
        this.cacheResult(cacheKey, result);
        return result;
      }

      // Check if flag is enabled for the environment
      if (!flag.environments.includes(context.environment)) {
        const result: FeatureFlagResult = {
          enabled: false,
          reason: 'ENVIRONMENT_NOT_ALLOWED',
          metadata: { 
            key, 
            environment: context.environment, 
            allowedEnvironments: flag.environments,
            evaluationCount: this.evaluationCount 
          }
        };
        this.cacheResult(cacheKey, result);
        return result;
      }

      // Check flag state
      if (flag.state === 'disabled') {
        const result: FeatureFlagResult = {
          enabled: false,
          reason: 'FLAG_DISABLED',
          metadata: { key, state: flag.state, evaluationCount: this.evaluationCount }
        };
        this.cacheResult(cacheKey, result);
        return result;
      }

      // Evaluate advanced targeting rules
      const targetingResult = this.evaluateTargeting(flag, context);
      if (targetingResult !== null) {
        const result: FeatureFlagResult = {
          enabled: typeof targetingResult === 'boolean' ? targetingResult : true,
          variant: typeof targetingResult === 'string' ? targetingResult : undefined,
          reason: 'TARGETING_RULE_MATCH',
          metadata: { 
            key, 
            targetingResult,
            evaluationCount: this.evaluationCount 
          }
        };
        this.cacheResult(cacheKey, result);
        return result;
      }

      // Evaluate rollout strategy
      const rolloutResult = this.evaluateRollout(flag, context);
      if (!rolloutResult) {
        const result: FeatureFlagResult = {
          enabled: false,
          reason: 'ROLLOUT_NOT_ACTIVE',
          metadata: { 
            key, 
            rolloutPercentage: flag.rolloutPercentage,
            evaluationCount: this.evaluationCount 
          }
        };
        this.cacheResult(cacheKey, result);
        return result;
      }

      // Evaluate time window conditions
      if (flag.conditions?.timeWindow) {
        const timeResult = this.evaluateTimeWindow(flag.conditions.timeWindow, context);
        if (!timeResult) {
          const result: FeatureFlagResult = {
            enabled: false,
            reason: 'TIME_WINDOW_NOT_ACTIVE',
            metadata: { 
              key, 
              timeWindow: flag.conditions.timeWindow,
              evaluationCount: this.evaluationCount 
            }
          };
          this.cacheResult(cacheKey, result);
          return result;
        }
      }

      // Evaluate custom rules
      if (flag.conditions?.customRules) {
        const customResult = this.evaluateCustomRules(flag.conditions.customRules, context);
        if (!customResult) {
          const result: FeatureFlagResult = {
            enabled: false,
            reason: 'CUSTOM_RULE_FAILED',
            metadata: { 
              key, 
              customRules: flag.conditions.customRules.length,
              evaluationCount: this.evaluationCount 
            }
          };
          this.cacheResult(cacheKey, result);
          return result;
        }
      }

      // Select variant if variants are configured
      const variant = this.selectVariant(flag, context);

      const result: FeatureFlagResult = {
        enabled: true,
        variant,
        reason: 'FLAG_ENABLED',
        metadata: { 
          key, 
          state: flag.state,
          rolloutPercentage: flag.rolloutPercentage,
          evaluationCount: this.evaluationCount 
        }
      };

      this.cacheResult(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error evaluating feature flag ${key}:`, error);
      
      const result: FeatureFlagResult = {
        enabled: false,
        reason: 'EVALUATION_ERROR',
        metadata: { 
          key, 
          error: error instanceof Error ? error.message : 'Unknown error',
          evaluationCount: this.evaluationCount 
        }
      };
      return result;
    }
  }

  // Batch evaluate multiple flags
  evaluateFlags(keys: string[], context: FeatureFlagContext): Record<string, FeatureFlagResult> {
    const results: Record<string, FeatureFlagResult> = {};
    
    for (const key of keys) {
      results[key] = this.evaluateFlag(key, context);
    }
    
    return results;
  }

  // Subscribe to flag changes
  subscribe(key: string, callback: (result: FeatureFlagResult) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Get all registered flags
  getAllFlags(): AdvancedFeatureFlagConfig[] {
    return Array.from(this.flags.values());
  }

  // Get flag by key
  getFlag(key: string): AdvancedFeatureFlagConfig | undefined {
    return this.flags.get(key);
  }

  // Get flag evaluation statistics
  getStatistics(): {
    totalFlags: number;
    evaluationCount: number;
    cacheHitRate: number;
    flagsByState: Record<FeatureFlagState, number>;
    flagsByEnvironment: Record<ConfigEnvironment, number>;
  } {
    const flagsByState: Record<FeatureFlagState, number> = {
      enabled: 0,
      disabled: 0,
      experimental: 0,
      deprecated: 0
    };

    const flagsByEnvironment: Record<ConfigEnvironment, number> = {
      development: 0,
      staging: 0,
      production: 0,
      test: 0
    };

    for (const flag of this.flags.values()) {
      flagsByState[flag.state]++;
      for (const env of flag.environments) {
        flagsByEnvironment[env]++;
      }
    }

    return {
      totalFlags: this.flags.size,
      evaluationCount: this.evaluationCount,
      cacheHitRate: this.cache.size > 0 ? 0.8 : 0, // Simplified calculation
      flagsByState,
      flagsByEnvironment
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    console.log('Feature flag cache cleared');
  }

  // Private helper methods
  private validateFlag(flag: AdvancedFeatureFlagConfig): { valid: boolean; errors: string[] } {
    try {
      // Use base schema validation
      FeatureFlagConfigSchema.parse(flag);
      
      const errors: string[] = [];
      
      // Additional validation for advanced features
      if (flag.variants) {
        const totalWeight = flag.variants.reduce((sum, v) => sum + v.weight, 0);
        if (Math.abs(totalWeight - 100) > 0.01) {
          errors.push('Variant weights must sum to 100');
        }
        
        const uniqueKeys = new Set(flag.variants.map(v => v.key));
        if (uniqueKeys.size !== flag.variants.length) {
          errors.push('Variant keys must be unique');
        }
      }
      
      if (flag.rolloutStrategy?.type === 'percentage') {
        const percentage = flag.rolloutStrategy.configuration.percentage;
        if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
          errors.push('Rollout percentage must be between 0 and 100');
        }
      }
      
      return { valid: errors.length === 0, errors };
    } catch (error: any) {
      return { 
        valid: false, 
        errors: error.errors?.map((e: any) => e.message) || ['Validation failed'] 
      };
    }
  }

  private evaluateTargeting(flag: AdvancedFeatureFlagConfig, context: FeatureFlagContext): boolean | string | null {
    if (!flag.targeting) {
      return null;
    }

    for (const rule of flag.targeting.rules) {
      let allConditionsMet = true;
      
      for (const condition of rule.conditions) {
        const attributeValue = this.getAttributeValue(condition.attribute, context);
        const conditionMet = this.evaluateCondition(condition, attributeValue);
        
        if (!conditionMet) {
          allConditionsMet = false;
          break;
        }
      }
      
      if (allConditionsMet) {
        return rule.result;
      }
    }
    
    return flag.targeting.defaultResult;
  }

  private evaluateRollout(flag: AdvancedFeatureFlagConfig, context: FeatureFlagContext): boolean {
    if (flag.rolloutPercentage === 100) {
      return true;
    }
    
    if (flag.rolloutPercentage === 0) {
      return false;
    }

    // Use a hash of user ID or session ID for consistent rollout
    const identifier = context.userId || context.sessionId || 'anonymous';
    const hash = this.hashString(`${flag.key}-${identifier}`);
    const percentage = (hash % 100) + 1;
    
    return percentage <= flag.rolloutPercentage;
  }

  private evaluateTimeWindow(timeWindow: { start: string; end: string }, context: FeatureFlagContext): boolean {
    const now = new Date(context.timestamp);
    const start = new Date(timeWindow.start);
    const end = new Date(timeWindow.end);
    
    return now >= start && now <= end;
  }

  private evaluateCustomRules(rules: Array<{ condition: string; result: boolean }>, context: FeatureFlagContext): boolean {
    for (const rule of rules) {
      try {
        // Note: In a real implementation, you'd want a safer expression evaluator
        // For now, we'll just check some basic conditions
        if (rule.condition.includes('userAttributes') && context.userAttributes) {
          // Simple attribute checks
          if (rule.condition.includes('premium') && context.userAttributes.plan === 'premium') {
            return rule.result;
          }
        }
      } catch (error) {
        console.error('Error evaluating custom rule:', error);
      }
    }
    
    return true; // Default to true if no rules match
  }

  private selectVariant(flag: AdvancedFeatureFlagConfig, context: FeatureFlagContext): string | undefined {
    if (!flag.variants || flag.variants.length === 0) {
      return undefined;
    }

    // Use consistent hashing for variant selection
    const identifier = context.userId || context.sessionId || 'anonymous';
    const hash = this.hashString(`${flag.key}-variant-${identifier}`);
    const percentage = hash % 100;
    
    let cumulativeWeight = 0;
    for (const variant of flag.variants) {
      cumulativeWeight += variant.weight;
      if (percentage < cumulativeWeight) {
        return variant.key;
      }
    }
    
    // Fallback to first variant
    return flag.variants[0].key;
  }

  private getAttributeValue(attribute: string, context: FeatureFlagContext): any {
    const parts = attribute.split('.');
    let value: any = context;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  }

  private evaluateCondition(condition: any, attributeValue: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return attributeValue === condition.value;
      case 'not_equals':
        return attributeValue !== condition.value;
      case 'contains':
        return typeof attributeValue === 'string' && attributeValue.includes(condition.value);
      case 'greater_than':
        return typeof attributeValue === 'number' && attributeValue > condition.value;
      case 'less_than':
        return typeof attributeValue === 'number' && attributeValue < condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(attributeValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(attributeValue);
      default:
        return false;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getCacheKey(flagKey: string, context: FeatureFlagContext): string {
    const keyParts = [
      flagKey,
      context.environment,
      context.userId || 'anonymous',
      context.sessionId || 'no-session'
    ];
    return keyParts.join('-');
  }

  private cacheResult(cacheKey: string, result: FeatureFlagResult): void {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  private clearFlagCache(flagKey: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(flagKey));
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  private notifySubscribers(flagKey: string): void {
    const subscribers = this.subscribers.get(flagKey);
    if (subscribers) {
      // Create a default context for notification
      const context: FeatureFlagContext = {
        environment: 'development',
        timestamp: new Date().toISOString()
      };
      
      const result = this.evaluateFlag(flagKey, context);
      
      subscribers.forEach(callback => {
        try {
          callback(result);
        } catch (error) {
          console.error('Error in feature flag subscriber:', error);
        }
      });
    }
  }

  private initializeDefaultFlags(): void {
    // Initialize some default feature flags for StockSage
    const defaultFlags: AdvancedFeatureFlagConfig[] = [
      {
        key: 'xstate_macro_automation',
        state: 'enabled',
        description: 'Enable XState-powered macro automation system',
        dependencies: [],
        rolloutPercentage: 100,
        environments: ['development', 'staging', 'production'],
        variants: [
          { key: 'full_featured', weight: 80 },
          { key: 'basic', weight: 20 }
        ]
      },
      {
        key: 'ai_timeout_protection',
        state: 'enabled',
        description: 'Enable AI timeout protection and retry logic',
        dependencies: [],
        rolloutPercentage: 100,
        environments: ['development', 'staging', 'production']
      },
      {
        key: 'performance_monitoring',
        state: 'enabled',
        description: 'Enable performance monitoring and analytics',
        dependencies: [],
        rolloutPercentage: 100,
        environments: ['development', 'staging', 'production']
      },
      {
        key: 'advanced_debugging',
        state: 'experimental',
        description: 'Enable advanced debugging tools and panels',
        dependencies: ['performance_monitoring'],
        rolloutPercentage: 50,
        environments: ['development', 'staging']
      },
      {
        key: 'multi_ticker_support',
        state: 'experimental',
        description: 'Enable multi-ticker analysis support',
        dependencies: ['xstate_macro_automation'],
        rolloutPercentage: 25,
        environments: ['development']
      }
    ];

    for (const flag of defaultFlags) {
      try {
        this.registerFlag(flag);
      } catch (error) {
        console.error(`Failed to register default flag ${flag.key}:`, error);
      }
    }
  }
}