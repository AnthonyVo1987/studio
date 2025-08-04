/**
 * Configuration Management System - Type Definitions
 * 
 * Comprehensive type definitions for dynamic configuration management
 * with XState integration and StockSage compatibility.
 */

import { z } from 'zod';

// Environment types
export type ConfigEnvironment = 'development' | 'staging' | 'production' | 'test';

// Configuration priority levels
export type ConfigPriority = 'system' | 'environment' | 'user' | 'runtime';

// Feature flag states
export type FeatureFlagState = 'enabled' | 'disabled' | 'experimental' | 'deprecated';

// Configuration change event types
export type ConfigChangeType = 
  | 'feature_flag_toggle'
  | 'performance_setting_update'
  | 'environment_switch'
  | 'schema_validation_change'
  | 'persistence_setting_update'
  | 'xstate_config_update'
  | 'stocksage_config_update';

// Base configuration interface
export interface BaseConfig {
  id: string;
  version: string;
  environment: ConfigEnvironment;
  priority: ConfigPriority;
  timestamp: string;
  metadata: {
    source: string;
    description: string;
    tags: string[];
  };
}

// Feature flag configuration
export interface FeatureFlagConfig {
  key: string;
  state: FeatureFlagState;
  description: string;
  dependencies: string[];
  rolloutPercentage: number;
  environments: ConfigEnvironment[];
  conditions?: {
    userAttributes?: Record<string, any>;
    timeWindow?: {
      start: string;
      end: string;
    };
    customRules?: Array<{
      condition: string;
      result: boolean;
    }>;
  };
}

// XState machine configuration
export interface XStateMachineConfig {
  machineId: string;
  enabled: boolean;
  debugMode: boolean;
  persistState: boolean;
  performanceMonitoring: {
    enabled: boolean;
    sampleRate: number;
    trackTransitions: boolean;
    trackActions: boolean;
    trackGuards: boolean;
  };
  errorHandling: {
    retryAttempts: number;
    backoffStrategy: 'linear' | 'exponential' | 'custom';
    circuitBreakerThreshold: number;
    compensationEnabled: boolean;
  };
  actorSpawning: {
    maxConcurrentActors: number;
    actorPoolSize: number;
    cleanupInterval: number;
    resourceLimits: {
      memoryLimit: number;
      executionTimeLimit: number;
    };
  };
}

// Performance monitoring configuration
export interface PerformanceConfig {
  enabled: boolean;
  metricsCollection: {
    interval: number;
    batchSize: number;
    retentionPeriod: number;
  };
  alerting: {
    enabled: boolean;
    thresholds: {
      memoryUsage: number;
      executionTime: number;
      errorRate: number;
      throughput: number;
    };
  };
  profiling: {
    enabled: boolean;
    sampleRate: number;
    detailedTracing: boolean;
  };
}

// StockSage-specific configuration
export interface StockSageConfig {
  tickers: {
    enabled: string[];
    refreshInterval: number;
    batchSize: number;
  };
  aiIntegration: {
    timeoutMs: number;
    retryAttempts: number;
    backoffMs: number;
    maxConcurrentRequests: number;
  };
  macroAutomation: {
    enabled: boolean;
    sequentialExecution: boolean;
    parallelProcessing: boolean;
    maxStepsPerMacro: number;
    debugLogging: boolean;
  };
  dataExport: {
    enabled: boolean;
    formats: string[];
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
  };
}

// Environment-specific configuration
export interface EnvironmentConfig extends BaseConfig {
  apiEndpoints: {
    polygon: string;
    gemini: string;
    fallback: string[];
  };
  rateLimiting: {
    requestsPerMinute: number;
    burstLimit: number;
    backoffMs: number;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    strategy: 'lru' | 'fifo' | 'ttl';
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    destination: 'console' | 'file' | 'remote';
    structured: boolean;
  };
}

// Main application configuration
export interface AppConfig extends BaseConfig {
  featureFlags: Record<string, FeatureFlagConfig>;
  xstateMachines: Record<string, XStateMachineConfig>;
  performance: PerformanceConfig;
  stocksage: StockSageConfig;
  environmentConfig: EnvironmentConfig;
}

// Configuration change event
export interface ConfigChangeEvent {
  type: ConfigChangeType;
  timestamp: string;
  path: string;
  oldValue: any;
  newValue: any;
  source: string;
  metadata?: Record<string, any>;
}

// Configuration validation result
export interface ConfigValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    path: string;
    message: string;
    code: string;
  }>;
}

// Configuration persistence options
export interface ConfigPersistenceOptions {
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'remote';
  encryption: boolean;
  compression: boolean;
  versioning: boolean;
  backup: {
    enabled: boolean;
    interval: number;
    maxBackups: number;
  };
}

// Configuration synchronization options
export interface ConfigSyncOptions {
  enabled: boolean;
  strategy: 'push' | 'pull' | 'merge';
  conflictResolution: 'latest' | 'priority' | 'manual';
  broadcastChanges: boolean;
  syncInterval: number;
}

// Configuration manager state
export interface ConfigManagerState {
  initialized: boolean;
  loading: boolean;
  syncing: boolean;
  lastSync: string | null;
  errors: string[];
  warnings: string[];
  activeEnvironment: ConfigEnvironment;
  configVersion: string;
}

// Configuration export format
export interface ConfigExport {
  format: 'json' | 'yaml' | 'toml';
  includeSecrets: boolean;
  includeMetadata: boolean;
  environmentFilter?: ConfigEnvironment[];
  featureFlagFilter?: string[];
}

// Configuration import options
export interface ConfigImportOptions {
  merge: boolean;
  overwrite: boolean;
  validateSchema: boolean;
  dryRun: boolean;
  backupBeforeImport: boolean;
}

// Configuration subscription callback
export type ConfigSubscriptionCallback = (
  changes: ConfigChangeEvent[],
  config: AppConfig
) => void;

// Configuration watcher options
export interface ConfigWatcherOptions {
  debounceMs: number;
  includeMetadata: boolean;
  filterByPath?: string[];
  filterByType?: ConfigChangeType[];
}

// Configuration defaults interface
export interface ConfigDefaults {
  environment: Record<ConfigEnvironment, Partial<EnvironmentConfig>>;
  featureFlags: Record<string, Partial<FeatureFlagConfig>>;
  xstateMachines: Record<string, Partial<XStateMachineConfig>>;
  performance: Partial<PerformanceConfig>;
  stocksage: Partial<StockSageConfig>;
}

// Configuration profile for different use cases
export interface ConfigProfile {
  name: string;
  description: string;
  environment: ConfigEnvironment;
  overrides: Partial<AppConfig>;
  tags: string[];
}

// Configuration migration interface
export interface ConfigMigration {
  fromVersion: string;
  toVersion: string;
  migrate: (config: any) => any;
  validate: (config: any) => ConfigValidationResult;
}

// Configuration audit log entry
export interface ConfigAuditEntry {
  timestamp: string;
  action: string;
  user: string;
  path: string;
  oldValue: any;
  newValue: any;
  success: boolean;
  error?: string;
}

// Configuration health check result
export interface ConfigHealthCheck {
  healthy: boolean;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    timestamp: string;
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

// Re-export common types for convenience
export type {
  AppConfig as Config,
  ConfigChangeEvent as ChangeEvent,
  ConfigValidationResult as ValidationResult,
  ConfigManagerState as ManagerState,
  FeatureFlagConfig as FeatureFlag,
  XStateMachineConfig as MachineConfig,
  PerformanceConfig as Performance,
  StockSageConfig as StockSage,
  EnvironmentConfig as Environment
};