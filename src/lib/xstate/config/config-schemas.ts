/**
 * Configuration Management System - Zod Validation Schemas
 * 
 * Comprehensive Zod schemas for configuration validation with
 * runtime type checking and schema evolution support.
 */

import { z } from 'zod';
import type {
  ConfigEnvironment,
  ConfigPriority,
  FeatureFlagState,
  ConfigChangeType
} from './config-types';

// Base validation schemas
export const ConfigEnvironmentSchema = z.enum(['development', 'staging', 'production', 'test']);
export const ConfigPrioritySchema = z.enum(['system', 'environment', 'user', 'runtime']);
export const FeatureFlagStateSchema = z.enum(['enabled', 'disabled', 'experimental', 'deprecated']);
export const ConfigChangeTypeSchema = z.enum([
  'feature_flag_toggle',
  'performance_setting_update', 
  'environment_switch',
  'schema_validation_change',
  'persistence_setting_update',
  'xstate_config_update',
  'stocksage_config_update'
]);

// Base configuration schema
export const BaseConfigSchema = z.object({
  id: z.string().min(1, 'Config ID is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format'),
  environment: ConfigEnvironmentSchema,
  priority: ConfigPrioritySchema,
  timestamp: z.string().datetime('Invalid timestamp format'),
  metadata: z.object({
    source: z.string().min(1, 'Source is required'),
    description: z.string().min(1, 'Description is required'),
    tags: z.array(z.string()).default([])
  })
});

// Feature flag configuration schema
export const FeatureFlagConfigSchema = z.object({
  key: z.string().min(1, 'Feature flag key is required'),
  state: FeatureFlagStateSchema,
  description: z.string().min(1, 'Description is required'),
  dependencies: z.array(z.string()).default([]),
  rolloutPercentage: z.number().min(0).max(100).default(0),
  environments: z.array(ConfigEnvironmentSchema).min(1, 'At least one environment required'),
  conditions: z.object({
    userAttributes: z.record(z.any()).optional(),
    timeWindow: z.object({
      start: z.string().datetime(),
      end: z.string().datetime()
    }).optional(),
    customRules: z.array(z.object({
      condition: z.string().min(1),
      result: z.boolean()
    })).optional()
  }).optional()
}).refine(
  (data) => data.rolloutPercentage === 0 || data.state === 'enabled',
  {
    message: 'Rollout percentage can only be set for enabled features',
    path: ['rolloutPercentage']
  }
);

// XState machine configuration schema
export const XStateMachineConfigSchema = z.object({
  machineId: z.string().min(1, 'Machine ID is required'),
  enabled: z.boolean().default(true),
  debugMode: z.boolean().default(false),
  persistState: z.boolean().default(false),
  performanceMonitoring: z.object({
    enabled: z.boolean().default(true),
    sampleRate: z.number().min(0).max(1).default(0.1),
    trackTransitions: z.boolean().default(true),
    trackActions: z.boolean().default(true),
    trackGuards: z.boolean().default(false)
  }),
  errorHandling: z.object({
    retryAttempts: z.number().min(0).max(10).default(3),
    backoffStrategy: z.enum(['linear', 'exponential', 'custom']).default('exponential'),
    circuitBreakerThreshold: z.number().min(1).max(100).default(5),
    compensationEnabled: z.boolean().default(true)
  }),
  actorSpawning: z.object({
    maxConcurrentActors: z.number().min(1).max(1000).default(10),
    actorPoolSize: z.number().min(1).max(100).default(5),
    cleanupInterval: z.number().min(1000).max(300000).default(30000),
    resourceLimits: z.object({
      memoryLimit: z.number().min(1).max(1000).default(100), // MB
      executionTimeLimit: z.number().min(1000).max(300000).default(60000) // ms
    })
  })
}).refine(
  (data) => data.actorSpawning.actorPoolSize <= data.actorSpawning.maxConcurrentActors,
  {
    message: 'Actor pool size cannot exceed max concurrent actors',
    path: ['actorSpawning', 'actorPoolSize']
  }
);

// Performance monitoring configuration schema
export const PerformanceConfigSchema = z.object({
  enabled: z.boolean().default(true),
  metricsCollection: z.object({
    interval: z.number().min(1000).max(60000).default(5000), // ms
    batchSize: z.number().min(1).max(1000).default(100),
    retentionPeriod: z.number().min(3600000).max(2592000000).default(86400000) // ms (1 day default)
  }),
  alerting: z.object({
    enabled: z.boolean().default(true),
    thresholds: z.object({
      memoryUsage: z.number().min(0).max(100).default(80), // percentage
      executionTime: z.number().min(100).max(60000).default(5000), // ms
      errorRate: z.number().min(0).max(100).default(5), // percentage
      throughput: z.number().min(1).max(10000).default(100) // ops/sec
    })
  }),
  profiling: z.object({
    enabled: z.boolean().default(false),
    sampleRate: z.number().min(0).max(1).default(0.01),
    detailedTracing: z.boolean().default(false)
  })
});

// StockSage-specific configuration schema
export const StockSageConfigSchema = z.object({
  tickers: z.object({
    enabled: z.array(z.string().min(1)).min(1, 'At least one ticker must be enabled'),
    refreshInterval: z.number().min(1000).max(300000).default(30000), // ms
    batchSize: z.number().min(1).max(50).default(10)
  }),
  aiIntegration: z.object({
    timeoutMs: z.number().min(5000).max(120000).default(45000),
    retryAttempts: z.number().min(0).max(5).default(2),
    backoffMs: z.number().min(100).max(10000).default(1000),
    maxConcurrentRequests: z.number().min(1).max(20).default(3)
  }),
  macroAutomation: z.object({
    enabled: z.boolean().default(true),
    sequentialExecution: z.boolean().default(true),
    parallelProcessing: z.boolean().default(false),
    maxStepsPerMacro: z.number().min(1).max(20).default(10),
    debugLogging: z.boolean().default(false)
  }).refine(
    (data) => !(data.sequentialExecution && data.parallelProcessing),
    {
      message: 'Cannot enable both sequential and parallel execution',
      path: ['parallelProcessing']
    }
  ),
  dataExport: z.object({
    enabled: z.boolean().default(true),
    formats: z.array(z.enum(['json', 'csv', 'xlsx'])).min(1).default(['json']),
    compressionEnabled: z.boolean().default(false),
    encryptionEnabled: z.boolean().default(false)
  })
});

// Environment-specific configuration schema
export const EnvironmentConfigSchema = BaseConfigSchema.extend({
  apiEndpoints: z.object({
    polygon: z.string().url('Invalid Polygon API endpoint'),
    gemini: z.string().url('Invalid Gemini API endpoint'),
    fallback: z.array(z.string().url()).default([])
  }),
  rateLimiting: z.object({
    requestsPerMinute: z.number().min(1).max(10000).default(60),
    burstLimit: z.number().min(1).max(1000).default(10),
    backoffMs: z.number().min(100).max(60000).default(1000)
  }),
  caching: z.object({
    enabled: z.boolean().default(true),
    ttl: z.number().min(1000).max(86400000).default(300000), // ms
    maxSize: z.number().min(1).max(1000).default(100), // MB
    strategy: z.enum(['lru', 'fifo', 'ttl']).default('lru')
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    destination: z.enum(['console', 'file', 'remote']).default('console'),
    structured: z.boolean().default(true)
  })
});

// Main application configuration schema
export const AppConfigSchema = BaseConfigSchema.extend({
  featureFlags: z.record(z.string(), FeatureFlagConfigSchema).default({}),
  xstateMachines: z.record(z.string(), XStateMachineConfigSchema).default({}),
  performance: PerformanceConfigSchema,
  stocksage: StockSageConfigSchema,
  environmentConfig: EnvironmentConfigSchema
});

// Configuration change event schema
export const ConfigChangeEventSchema = z.object({
  type: ConfigChangeTypeSchema,
  timestamp: z.string().datetime(),
  path: z.string().min(1),
  oldValue: z.any(),
  newValue: z.any(),
  source: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

// Configuration validation result schema
export const ConfigValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    path: z.string(),
    message: z.string(),
    code: z.string()
  })),
  warnings: z.array(z.object({
    path: z.string(),
    message: z.string(),
    code: z.string()
  }))
});

// Configuration persistence options schema
export const ConfigPersistenceOptionsSchema = z.object({
  storage: z.enum(['localStorage', 'sessionStorage', 'indexedDB', 'remote']).default('localStorage'),
  encryption: z.boolean().default(false),
  compression: z.boolean().default(false),
  versioning: z.boolean().default(true),
  backup: z.object({
    enabled: z.boolean().default(true),
    interval: z.number().min(300000).max(86400000).default(3600000), // ms
    maxBackups: z.number().min(1).max(50).default(10)
  })
});

// Configuration synchronization options schema
export const ConfigSyncOptionsSchema = z.object({
  enabled: z.boolean().default(false),
  strategy: z.enum(['push', 'pull', 'merge']).default('merge'),
  conflictResolution: z.enum(['latest', 'priority', 'manual']).default('latest'),
  broadcastChanges: z.boolean().default(true),
  syncInterval: z.number().min(10000).max(3600000).default(60000) // ms
});

// Configuration export format schema
export const ConfigExportSchema = z.object({
  format: z.enum(['json', 'yaml', 'toml']).default('json'),
  includeSecrets: z.boolean().default(false),
  includeMetadata: z.boolean().default(true),
  environmentFilter: z.array(ConfigEnvironmentSchema).optional(),
  featureFlagFilter: z.array(z.string()).optional()
});

// Configuration import options schema
export const ConfigImportOptionsSchema = z.object({
  merge: z.boolean().default(true),
  overwrite: z.boolean().default(false),
  validateSchema: z.boolean().default(true),
  dryRun: z.boolean().default(false),
  backupBeforeImport: z.boolean().default(true)
});

// Configuration profile schema
export const ConfigProfileSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  environment: ConfigEnvironmentSchema,
  overrides: AppConfigSchema.partial(),
  tags: z.array(z.string()).default([])
});

// Configuration migration schema
export const ConfigMigrationSchema = z.object({
  fromVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  toVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  migrate: z.function().args(z.any()).returns(z.any()),
  validate: z.function().args(z.any()).returns(ConfigValidationResultSchema)
});

// Configuration audit entry schema
export const ConfigAuditEntrySchema = z.object({
  timestamp: z.string().datetime(),
  action: z.string().min(1),
  user: z.string().min(1),
  path: z.string().min(1),
  oldValue: z.any(),
  newValue: z.any(),
  success: z.boolean(),
  error: z.string().optional()
});

// Configuration health check schema
export const ConfigHealthCheckSchema = z.object({
  healthy: z.boolean(),
  checks: z.array(z.object({
    name: z.string().min(1),
    status: z.enum(['pass', 'fail', 'warn']),
    message: z.string(),
    timestamp: z.string().datetime()
  })),
  summary: z.object({
    total: z.number().min(0),
    passed: z.number().min(0),
    failed: z.number().min(0),
    warnings: z.number().min(0)
  })
});

// Schema validation utilities
export const validateConfig = (config: unknown): config is z.infer<typeof AppConfigSchema> => {
  try {
    AppConfigSchema.parse(config);
    return true;
  } catch {
    return false;
  }
};

export const validateFeatureFlag = (flag: unknown): flag is z.infer<typeof FeatureFlagConfigSchema> => {
  try {
    FeatureFlagConfigSchema.parse(flag);
    return true;
  } catch {
    return false;
  }
};

export const validateXStateMachine = (machine: unknown): machine is z.infer<typeof XStateMachineConfigSchema> => {
  try {
    XStateMachineConfigSchema.parse(machine);
    return true;
  } catch {
    return false;
  }
};

// Schema registry for dynamic validation
export const SchemaRegistry = {
  AppConfig: AppConfigSchema,
  BaseConfig: BaseConfigSchema,
  FeatureFlagConfig: FeatureFlagConfigSchema,
  XStateMachineConfig: XStateMachineConfigSchema,
  PerformanceConfig: PerformanceConfigSchema,
  StockSageConfig: StockSageConfigSchema,
  EnvironmentConfig: EnvironmentConfigSchema,
  ConfigChangeEvent: ConfigChangeEventSchema,
  ConfigValidationResult: ConfigValidationResultSchema,
  ConfigPersistenceOptions: ConfigPersistenceOptionsSchema,
  ConfigSyncOptions: ConfigSyncOptionsSchema,
  ConfigExport: ConfigExportSchema,
  ConfigImportOptions: ConfigImportOptionsSchema,
  ConfigProfile: ConfigProfileSchema,
  ConfigMigration: ConfigMigrationSchema,
  ConfigAuditEntry: ConfigAuditEntrySchema,
  ConfigHealthCheck: ConfigHealthCheckSchema
} as const;

// Type inference helpers
export type ValidatedAppConfig = z.infer<typeof AppConfigSchema>;
export type ValidatedFeatureFlag = z.infer<typeof FeatureFlagConfigSchema>;
export type ValidatedXStateMachine = z.infer<typeof XStateMachineConfigSchema>;
export type ValidatedPerformanceConfig = z.infer<typeof PerformanceConfigSchema>;
export type ValidatedStockSageConfig = z.infer<typeof StockSageConfigSchema>;
export type ValidatedEnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

// Schema version for migration compatibility
export const SCHEMA_VERSION = '1.0.0';

// Default validation options
export const DEFAULT_VALIDATION_OPTIONS = {
  stripUnknown: false,
  abortEarly: false,
  allowUnknown: false
} as const;