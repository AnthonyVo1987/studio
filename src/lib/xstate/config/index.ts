/**
 * Configuration Management System - Main Exports
 * 
 * Comprehensive configuration management system with runtime updates,
 * feature flags, environment management, and persistence capabilities.
 */

// Core configuration manager
export { ConfigManager } from './config-manager';
export type { ConfigManagerOptions } from './config-manager';

// Persistence system
export { ConfigPersistenceManager } from './config-persistence';

// Feature flags system
export { FeatureFlagManager } from './feature-flags';
export type { 
  FeatureFlagContext, 
  FeatureFlagResult, 
  AdvancedFeatureFlagConfig 
} from './feature-flags';

// Environment management
export { EnvironmentConfigManager } from './environment-config';
export type { 
  EnvironmentDetectionResult, 
  EnvironmentOverride 
} from './environment-config';

// React UI components (commented out due to JSX compilation requirements)
// export { ConfigManagerUI } from './config-ui';

// Type definitions
export type {
  // Core types
  AppConfig,
  BaseConfig,
  ConfigEnvironment,
  ConfigPriority,
  FeatureFlagState,
  ConfigChangeType,
  ConfigChangeEvent,
  ConfigValidationResult,
  ConfigManagerState,

  // Feature flag types
  FeatureFlagConfig,
  
  // XState machine types
  XStateMachineConfig,
  
  // Performance types
  PerformanceConfig,
  
  // StockSage types
  StockSageConfig,
  
  // Environment types
  EnvironmentConfig,
  
  // Configuration options
  ConfigPersistenceOptions,
  ConfigSyncOptions,
  ConfigSubscriptionCallback,
  ConfigWatcherOptions,
  
  // Export/import types
  ConfigExport,
  ConfigImportOptions,
  
  // Profile and migration types
  ConfigProfile,
  ConfigMigration,
  
  // Audit and health types
  ConfigAuditEntry,
  ConfigHealthCheck,
  
  // Convenience aliases
  Config,
  ChangeEvent,
  ValidationResult,
  ManagerState,
  FeatureFlag,
  MachineConfig,
  Performance,
  StockSage,
  Environment
} from './config-types';

// Schema exports
export {
  // Main schemas
  AppConfigSchema,
  BaseConfigSchema,
  FeatureFlagConfigSchema,
  XStateMachineConfigSchema,
  PerformanceConfigSchema,
  StockSageConfigSchema,
  EnvironmentConfigSchema,
  
  // Event schemas
  ConfigChangeEventSchema,
  ConfigValidationResultSchema,
  
  // Options schemas
  ConfigPersistenceOptionsSchema,
  ConfigSyncOptionsSchema,
  ConfigExportSchema,
  ConfigImportOptionsSchema,
  
  // Utility schemas
  ConfigProfileSchema,
  ConfigMigrationSchema,
  ConfigAuditEntrySchema,
  ConfigHealthCheckSchema,
  
  // Schema registry
  SchemaRegistry,
  
  // Validation utilities
  validateConfig,
  validateFeatureFlag,
  validateXStateMachine,
  
  // Type inference helpers
  type ValidatedAppConfig,
  type ValidatedFeatureFlag,
  type ValidatedXStateMachine,
  type ValidatedPerformanceConfig,
  type ValidatedStockSageConfig,
  type ValidatedEnvironmentConfig,
  
  // Schema metadata
  SCHEMA_VERSION,
  DEFAULT_VALIDATION_OPTIONS
} from './config-schemas';

// Utility functions and constants
export const CONFIG_DEFAULTS = {
  CACHE_TIMEOUT: 60000, // 1 minute
  SYNC_INTERVAL: 60000, // 1 minute
  BACKUP_INTERVAL: 3600000, // 1 hour
  MAX_BACKUPS: 10,
  MAX_CHANGE_HISTORY: 1000,
  VALIDATION_CACHE_SIZE: 100,
  
  // Feature flag defaults
  FEATURE_FLAG_CACHE_TIMEOUT: 60000,
  FEATURE_FLAG_EVALUATION_BATCH_SIZE: 50,
  
  // Performance monitoring defaults
  PERFORMANCE_METRICS_INTERVAL: 5000,
  PERFORMANCE_RETENTION_PERIOD: 86400000, // 24 hours
  
  // StockSage defaults
  AI_TIMEOUT_MS: 45000,
  AI_RETRY_ATTEMPTS: 2,
  MACRO_MAX_STEPS: 10,
  TICKER_REFRESH_INTERVAL: 30000,
  
  // Environment defaults
  ENVIRONMENT_DETECTION_CONFIDENCE_THRESHOLD: 0.7,
  ENVIRONMENT_HEALTH_CHECK_INTERVAL: 30000
} as const;

// Configuration management utilities
export class ConfigUtils {
  /**
   * Deep merge two configuration objects
   */
  static mergeConfigs<T extends Record<string, any>>(base: T, override: Partial<T>): T {
    const result = { ...base };
    
    for (const [key, value] of Object.entries(override)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result[key as keyof T] = this.mergeConfigs(result[key] || {}, value);
        } else {
          result[key as keyof T] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Generate a configuration diff
   */
  static generateConfigDiff(
    oldConfig: Record<string, any>,
    newConfig: Record<string, any>
  ): Array<{
    path: string;
    type: 'added' | 'removed' | 'changed';
    oldValue?: any;
    newValue?: any;
  }> {
    const diff: Array<{
      path: string;
      type: 'added' | 'removed' | 'changed';
      oldValue?: any;
      newValue?: any;
    }> = [];

    const allKeys = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)]);
    
    for (const key of allKeys) {
      const oldValue = oldConfig[key];
      const newValue = newConfig[key];
      
      if (oldValue === undefined && newValue !== undefined) {
        diff.push({ path: key, type: 'added', newValue });
      } else if (oldValue !== undefined && newValue === undefined) {
        diff.push({ path: key, type: 'removed', oldValue });
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diff.push({ path: key, type: 'changed', oldValue, newValue });
      }
    }
    
    return diff;
  }

  /**
   * Validate configuration path
   */
  static isValidPath(path: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(path);
  }

  /**
   * Get nested configuration value by path
   */
  static getValueByPath(config: any, path: string): any {
    const parts = path.split('.');
    let current = config;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Set nested configuration value by path
   */
  static setValueByPath(config: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  /**
   * Generate unique configuration ID
   */
  static generateConfigId(environment: ConfigEnvironment, prefix = 'config'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${environment}-${timestamp}-${random}`;
  }

  /**
   * Sanitize configuration for export (remove sensitive data)
   */
  static sanitizeForExport(config: any, sensitiveKeys: string[] = ['apiKey', 'secret', 'token', 'password']): any {
    const sanitized = JSON.parse(JSON.stringify(config));
    
    const sanitizeObject = (obj: any): void => {
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveKeys.some(sensitiveKey => 
          key.toLowerCase().includes(sensitiveKey.toLowerCase())
        )) {
          obj[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitizeObject(value);
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Validate configuration environment compatibility
   */
  static validateEnvironmentCompatibility(
    config: any,
    targetEnvironment: string
  ): { compatible: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check if configuration is for the target environment
    if (config.environmentConfig?.environment !== targetEnvironment) {
      issues.push(`Configuration is for ${config.environmentConfig?.environment}, not ${targetEnvironment}`);
    }
    
    // Check feature flag environment compatibility
    for (const [key, flag] of Object.entries(config.featureFlags || {})) {
      if (!(flag as any).environments?.includes(targetEnvironment)) {
        issues.push(`Feature flag '${key}' is not enabled for ${targetEnvironment}`);
      }
    }
    
    // Check environment-specific settings
    const envConfig = config.environmentConfig;
    if (targetEnvironment === 'production') {
      if (envConfig?.logging?.level === 'debug') {
        issues.push('Debug logging should not be enabled in production');
      }
      
      if (config.performance?.profiling?.enabled) {
        issues.push('Performance profiling should not be enabled in production');
      }
    }
    
    return {
      compatible: issues.length === 0,
      issues
    };
  }
}

// Export configuration factory for common scenarios
export class ConfigFactory {
  /**
   * Create development configuration
   */
  static createDevelopmentConfig(): any {
    return {
      environment: 'development',
      metadata: {
        source: 'factory',
        description: 'Development configuration',
        tags: ['dev', 'local', 'factory']
      },
      performance: {
        enabled: true,
        profiling: {
          enabled: true,
          sampleRate: 0.1,
          detailedTracing: true
        },
        alerting: {
          enabled: false,
          thresholds: {
            memoryUsage: 90,
            executionTime: 10000,
            errorRate: 10,
            throughput: 50
          }
        }
      },
      stocksage: {
        aiIntegration: {
          timeoutMs: 60000,
          retryAttempts: 3,
          backoffMs: 2000,
          maxConcurrentRequests: 5
        },
        macroAutomation: {
          enabled: true,
          debugLogging: true,
          sequentialExecution: true,
          parallelProcessing: false,
          maxStepsPerMacro: 15
        }
      }
    };
  }

  /**
   * Create production configuration
   */
  static createProductionConfig(): any {
    return {
      environment: 'production',
      metadata: {
        source: 'factory',
        description: 'Production configuration',
        tags: ['prod', 'live', 'factory']
      },
      performance: {
        enabled: true,
        profiling: {
          enabled: false,
          sampleRate: 0.001,
          detailedTracing: false
        },
        alerting: {
          enabled: true,
          thresholds: {
            memoryUsage: 75,
            executionTime: 3000,
            errorRate: 1,
            throughput: 200
          }
        }
      },
      stocksage: {
        aiIntegration: {
          timeoutMs: 30000,
          retryAttempts: 1,
          backoffMs: 500,
          maxConcurrentRequests: 2
        },
        macroAutomation: {
          enabled: true,
          debugLogging: false,
          sequentialExecution: true,
          parallelProcessing: false,
          maxStepsPerMacro: 8
        }
      }
    };
  }

  /**
   * Create test configuration
   */
  static createTestConfig(): any {
    return {
      environment: 'test',
      metadata: {
        source: 'factory',
        description: 'Test configuration',
        tags: ['test', 'ci', 'factory']
      },
      performance: {
        enabled: false,
        profiling: {
          enabled: false,
          sampleRate: 0,
          detailedTracing: false
        },
        alerting: {
          enabled: false,
          thresholds: {
            memoryUsage: 95,
            executionTime: 30000,
            errorRate: 50,
            throughput: 10
          }
        }
      },
      stocksage: {
        aiIntegration: {
          timeoutMs: 10000,
          retryAttempts: 0,
          backoffMs: 100,
          maxConcurrentRequests: 1
        },
        macroAutomation: {
          enabled: false,
          debugLogging: true,
          sequentialExecution: true,
          parallelProcessing: false,
          maxStepsPerMacro: 5
        }
      }
    };
  }
}

// Version and metadata
export const CONFIG_SYSTEM_VERSION = '1.0.0';
export const CONFIG_SYSTEM_NAME = 'XState Configuration Management System';
export const CONFIG_SYSTEM_DESCRIPTION = 'Comprehensive configuration management with runtime updates, feature flags, and environment management';

// Export all for convenience
export * from './config-types';
export * from './config-schemas';