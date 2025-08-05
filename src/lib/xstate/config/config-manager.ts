/**
 * Configuration Management System - Core Manager
 * 
 * Central configuration management with runtime updates, validation,
 * synchronization, and integration with all configuration subsystems.
 */

import type {
  AppConfig,
  ConfigEnvironment,
  ConfigChangeEvent,
  ConfigChangeType,
  ConfigValidationResult,
  ConfigManagerState,
  ConfigPersistenceOptions,
  ConfigSyncOptions,
  ConfigSubscriptionCallback,
  ConfigWatcherOptions,
  ConfigProfile,
  ConfigHealthCheck,
  FeatureFlagConfig,
  XStateMachineConfig,
  PerformanceConfig,
  StockSageConfig
} from './config-types';

import { AppConfigSchema } from './config-schemas';
import { ConfigPersistenceManager } from './config-persistence';
import { FeatureFlagManager, type FeatureFlagContext, type FeatureFlagResult } from './feature-flags';
import { EnvironmentConfigManager } from './environment-config';

// Configuration manager options
export interface ConfigManagerOptions {
  persistence?: ConfigPersistenceOptions;
  sync?: ConfigSyncOptions;
  autoSave?: boolean;
  validateOnUpdate?: boolean;
  enableHotReload?: boolean;
  debugMode?: boolean;
}

// Configuration change subscription
interface ConfigSubscription {
  id: string;
  callback: ConfigSubscriptionCallback;
  options: ConfigWatcherOptions;
}

// Configuration manager implementation
export class ConfigManager {
  private config: AppConfig | null = null;
  private state: ConfigManagerState;
  private persistenceManager: ConfigPersistenceManager;
  private featureFlagManager: FeatureFlagManager;
  private environmentManager: EnvironmentConfigManager;
  private subscriptions: Map<string, ConfigSubscription> = new Map();
  private changeHistory: ConfigChangeEvent[] = [];
  private options: Required<ConfigManagerOptions>;
  private profiles: Map<string, ConfigProfile> = new Map();
  private validationCache: Map<string, ConfigValidationResult> = new Map();

  constructor(options: ConfigManagerOptions = {}) {
    // Initialize state
    this.state = {
      initialized: false,
      loading: false,
      syncing: false,
      lastSync: null,
      errors: [],
      warnings: [],
      activeEnvironment: 'development',
      configVersion: '1.0.0'
    };

    // Set default options
    this.options = {
      persistence: {
        storage: 'localStorage',
        encryption: false,
        compression: false,
        versioning: true,
        backup: {
          enabled: true,
          interval: 3600000,
          maxBackups: 10
        }
      },
      sync: {
        enabled: false,
        strategy: 'merge',
        conflictResolution: 'latest',
        broadcastChanges: true,
        syncInterval: 60000
      },
      autoSave: true,
      validateOnUpdate: true,
      enableHotReload: true,
      debugMode: false,
      ...options
    };

    // Initialize subsystems
    this.persistenceManager = new ConfigPersistenceManager(
      this.options.persistence,
      this.options.sync
    );
    this.featureFlagManager = new FeatureFlagManager();
    this.environmentManager = new EnvironmentConfigManager();

    // Setup environment change listener
    this.environmentManager.onEnvironmentChange((env) => {
      this.handleEnvironmentChange(env);
    });

    if (this.options.debugMode) {
      console.log('ConfigManager initialized with options:', this.options);
    }
  }

  // Initialize configuration manager
  async initialize(): Promise<void> {
    try {
      this.setState({ loading: true });
      
      const currentEnvironment = this.environmentManager.getCurrentEnvironment();
      this.setState({ activeEnvironment: currentEnvironment });

      // Try to load existing configuration
      const existingConfig = await this.persistenceManager.loadConfig(currentEnvironment);
      
      if (existingConfig) {
        await this.setConfig(existingConfig, { skipValidation: false, skipSave: true });
      } else {
        // Create default configuration
        const defaultConfig = await this.createDefaultConfig();
        await this.setConfig(defaultConfig, { skipValidation: false, skipSave: false });
      }

      // Initialize feature flags from config
      if (this.config?.featureFlags) {
        for (const [key, flag] of Object.entries(this.config.featureFlags)) {
          this.featureFlagManager.registerFlag(flag as any);
        }
      }

      // Start sync if enabled
      if (this.options.sync.enabled) {
        this.startSync();
      }

      this.setState({ 
        initialized: true, 
        loading: false,
        configVersion: this.config?.version || '1.0.0'
      });

      console.log(`ConfigManager initialized for environment: ${currentEnvironment}`);
    } catch (error) {
      this.setState({ 
        loading: false, 
        errors: [`Initialization failed: ${error}`] 
      });
      console.error('ConfigManager initialization failed:', error);
      throw error;
    }
  }

  // Get current configuration
  getConfig(): AppConfig | null {
    return this.config;
  }

  // Set configuration
  async setConfig(
    config: AppConfig, 
    options: { 
      skipValidation?: boolean; 
      skipSave?: boolean; 
      source?: string 
    } = {}
  ): Promise<void> {
    try {
      const { skipValidation = false, skipSave = false, source = 'manual' } = options;

      // Validate configuration if not skipped
      if (!skipValidation && this.options.validateOnUpdate) {
        const validation = await this.validateConfig(config);
        if (!validation.valid) {
          throw new Error(`Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      const oldConfig = this.config;
      this.config = { ...config };

      // Update environment manager
      this.setState({ 
        activeEnvironment: config.environmentConfig.environment,
        configVersion: config.version 
      });

      // Generate change events
      const changes = this.generateChangeEvents(oldConfig, config, source);
      
      // Add to change history
      this.changeHistory.push(...changes);
      
      // Keep history size manageable
      if (this.changeHistory.length > 1000) {
        this.changeHistory = this.changeHistory.slice(-500);
      }

      // Notify subscribers
      this.notifySubscribers(changes);

      // Save configuration if not skipped and auto-save is enabled
      if (!skipSave && this.options.autoSave) {
        await this.persistenceManager.storeConfig(config);
      }

      // Update feature flags
      this.updateFeatureFlags(config.featureFlags);

      if (this.options.debugMode) {
        console.log('Configuration updated:', {
          version: config.version,
          environment: config.environment,
          changes: changes.length
        });
      }
    } catch (error) {
      this.setState({ errors: [...this.state.errors, `Config update failed: ${error}`] });
      console.error('Failed to set configuration:', error);
      throw error;
    }
  }

  // Update partial configuration
  async updateConfig(
    updates: Partial<AppConfig>,
    options: { source?: string; skipValidation?: boolean } = {}
  ): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not initialized');
    }

    const updatedConfig: AppConfig = {
      ...this.config,
      ...updates,
      timestamp: new Date().toISOString()
    };

    await this.setConfig(updatedConfig, options);
  }

  // Get feature flag result
  getFeatureFlag(key: string, context?: Partial<FeatureFlagContext>): FeatureFlagResult {
    const flagContext: FeatureFlagContext = {
      environment: this.state.activeEnvironment,
      timestamp: new Date().toISOString(),
      ...context
    };

    return this.featureFlagManager.evaluateFlag(key, flagContext);
  }

  // Update feature flag
  async updateFeatureFlag(key: string, updates: Partial<FeatureFlagConfig>): Promise<void> {
    this.featureFlagManager.updateFlag(key, updates as any);

    // Update in main configuration
    if (this.config && this.config.featureFlags[key]) {
      const updatedFlags = {
        ...this.config.featureFlags,
        [key]: { ...this.config.featureFlags[key], ...updates }
      };

      await this.updateConfig({ featureFlags: updatedFlags }, { source: 'feature_flag_update' });
    }
  }

  // Get XState machine configuration
  getXStateMachineConfig(machineId: string): XStateMachineConfig | null {
    return this.config?.xstateMachines[machineId] || null;
  }

  // Update XState machine configuration
  async updateXStateMachineConfig(machineId: string, updates: Partial<XStateMachineConfig>): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not initialized');
    }

    const updatedMachines = {
      ...this.config.xstateMachines,
      [machineId]: { ...this.config.xstateMachines[machineId], ...updates }
    };

    await this.updateConfig({ xstateMachines: updatedMachines }, { source: 'xstate_config_update' });
  }

  // Get performance configuration
  getPerformanceConfig(): PerformanceConfig | null {
    return this.config?.performance || null;
  }

  // Update performance configuration
  async updatePerformanceConfig(updates: Partial<PerformanceConfig>): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not initialized');
    }

    const updatedPerformance = { ...this.config.performance, ...updates };
    await this.updateConfig({ performance: updatedPerformance }, { source: 'performance_setting_update' });
  }

  // Get StockSage configuration
  getStockSageConfig(): StockSageConfig | null {
    return this.config?.stocksage || null;
  }

  // Update StockSage configuration
  async updateStockSageConfig(updates: Partial<StockSageConfig>): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not initialized');
    }

    const updatedStockSage = { ...this.config.stocksage, ...updates };
    await this.updateConfig({ stocksage: updatedStockSage }, { source: 'stocksage_config_update' });
  }

  // Switch environment
  async switchEnvironment(environment: ConfigEnvironment): Promise<void> {
    try {
      this.setState({ loading: true });

      // Load configuration for new environment
      const envConfig = await this.persistenceManager.loadConfig(environment);
      
      if (envConfig) {
        await this.setConfig(envConfig, { skipSave: true });
      } else {
        // Create default config for environment
        const defaultConfig = await this.createDefaultConfig(environment);
        await this.setConfig(defaultConfig);
      }

      // Update environment manager
      this.environmentManager.setCurrentEnvironment(environment);

      this.setState({ loading: false });
      console.log(`Switched to environment: ${environment}`);
    } catch (error) {
      this.setState({ 
        loading: false, 
        errors: [...this.state.errors, `Environment switch failed: ${error}`] 
      });
      console.error('Failed to switch environment:', error);
      throw error;
    }
  }

  // Subscribe to configuration changes
  subscribe(
    callback: ConfigSubscriptionCallback,
    options: ConfigWatcherOptions = { debounceMs: 100, includeMetadata: true }
  ): () => void {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(id, {
      id,
      callback,
      options
    });

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(id);
    };
  }

  // Export configuration
  async exportConfig(format: 'json' | 'yaml' = 'json'): Promise<string | null> {
    if (!this.config) {
      return null;
    }

    return await this.persistenceManager.exportConfig(this.config.environment, format);
  }

  // Import configuration
  async importConfig(data: string, format: 'json' | 'yaml' = 'json'): Promise<boolean> {
    try {
      const success = await this.persistenceManager.importConfig(data, format);
      
      if (success) {
        // Reload configuration
        const environment = this.state.activeEnvironment;
        const importedConfig = await this.persistenceManager.loadConfig(environment);
        
        if (importedConfig) {
          await this.setConfig(importedConfig, { source: 'import' });
        }
      }
      
      return success;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }

  // Create configuration profile
  createProfile(profile: ConfigProfile): void {
    this.profiles.set(profile.name, profile);
    console.log(`Configuration profile created: ${profile.name}`);
  }

  // Apply configuration profile
  async applyProfile(profileName: string): Promise<void> {
    const profile = this.profiles.get(profileName);
    if (!profile) {
      throw new Error(`Configuration profile not found: ${profileName}`);
    }

    if (!this.config) {
      throw new Error('Configuration not initialized');
    }

    // Merge profile overrides with current config
    const updatedConfig: AppConfig = {
      ...this.config,
      ...profile.overrides,
      timestamp: new Date().toISOString()
    };

    await this.setConfig(updatedConfig, { source: `profile_${profileName}` });
  }

  // Get configuration state
  getState(): ConfigManagerState {
    return { ...this.state };
  }

  // Validate configuration
  async validateConfig(config: AppConfig): Promise<ConfigValidationResult> {
    const cacheKey = `${config.id}-${config.version}-${config.timestamp}`;
    
    // Check cache first
    const cached = this.validationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      AppConfigSchema.parse(config);
      
      const result: ConfigValidationResult = {
        valid: true,
        errors: [],
        warnings: []
      };

      // Cache result
      this.validationCache.set(cacheKey, result);
      
      // Limit cache size
      if (this.validationCache.size > 100) {
        const firstKey = this.validationCache.keys().next().value;
        if (firstKey) {
          this.validationCache.delete(firstKey);
        }
      }

      return result;
    } catch (error: any) {
      const errors = error.errors?.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code
      })) || [{ path: 'unknown', message: 'Validation failed', code: 'VALIDATION_ERROR' }];

      const result: ConfigValidationResult = {
        valid: false,
        errors,
        warnings: []
      };

      // Cache result
      this.validationCache.set(cacheKey, result);

      return result;
    }
  }

  // Health check
  async healthCheck(): Promise<ConfigHealthCheck> {
    const checks = [];
    let healthy = true;

    // Check initialization
    if (!this.state.initialized) {
      healthy = false;
      checks.push({
        name: 'Initialization',
        status: 'fail' as const,
        message: 'Configuration manager not initialized',
        timestamp: new Date().toISOString()
      });
    } else {
      checks.push({
        name: 'Initialization',
        status: 'pass' as const,
        message: 'Configuration manager initialized successfully',
        timestamp: new Date().toISOString()
      });
    }

    // Check configuration validity
    if (this.config) {
      const validation = await this.validateConfig(this.config);
      if (!validation.valid) {
        healthy = false;
        checks.push({
          name: 'Configuration Validity',
          status: 'fail' as const,
          message: `Configuration validation failed: ${validation.errors.length} errors`,
          timestamp: new Date().toISOString()
        });
      } else {
        checks.push({
          name: 'Configuration Validity',
          status: 'pass' as const,
          message: 'Configuration is valid',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      healthy = false;
      checks.push({
        name: 'Configuration Validity',
        status: 'fail' as const,
        message: 'No configuration loaded',
        timestamp: new Date().toISOString()
      });
    }

    // Check persistence manager
    const persistenceHealth = await this.persistenceManager.healthCheck();
    if (!persistenceHealth.healthy) {
      healthy = false;
    }
    checks.push(...persistenceHealth.checks);

    // Check environment manager
    const environmentHealth = await this.environmentManager.healthCheck();
    if (!environmentHealth.healthy) {
      healthy = false;
    }
    
    // Add environment health as summary check
    const envErrors = Object.values(environmentHealth.environments)
      .filter(env => !env.valid || !env.accessible)
      .length;
    
    if (envErrors > 0) {
      checks.push({
        name: 'Environment Configuration',
        status: 'warn' as const,
        message: `${envErrors} environment(s) have issues`,
        timestamp: new Date().toISOString()
      });
    } else {
      checks.push({
        name: 'Environment Configuration',
        status: 'pass' as const,
        message: 'All environments are healthy',
        timestamp: new Date().toISOString()
      });
    }

    return {
      healthy,
      checks,
      summary: {
        total: checks.length,
        passed: checks.filter(c => c.status === 'pass').length,
        failed: checks.filter(c => c.status === 'fail').length,
        warnings: checks.filter(c => c.status === 'warn').length
      }
    };
  }

  // Private helper methods
  private async createDefaultConfig(environment?: ConfigEnvironment): Promise<AppConfig> {
    const env = environment || this.environmentManager.getCurrentEnvironment();
    const envConfig = this.environmentManager.getEffectiveConfig(env);
    
    if (!envConfig) {
      throw new Error(`Cannot create default config: environment ${env} not found`);
    }

    const defaultConfig: AppConfig = {
      id: `config-${env}-${Date.now()}`,
      version: '1.0.0',
      environment: env,
      priority: 'system',
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'system',
        description: `Default configuration for ${env} environment`,
        tags: ['default', env]
      },
      featureFlags: {},
      xstateMachines: {},
      performance: {
        enabled: true,
        metricsCollection: {
          interval: 5000,
          batchSize: 100,
          retentionPeriod: 86400000
        },
        alerting: {
          enabled: true,
          thresholds: {
            memoryUsage: 80,
            executionTime: 5000,
            errorRate: 5,
            throughput: 100
          }
        },
        profiling: {
          enabled: false,
          sampleRate: 0.01,
          detailedTracing: false
        }
      },
      stocksage: {
        tickers: {
          enabled: ['NVDA', 'SPY'],
          refreshInterval: 30000,
          batchSize: 10
        },
        aiIntegration: {
          timeoutMs: 45000,
          retryAttempts: 2,
          backoffMs: 1000,
          maxConcurrentRequests: 3
        },
        macroAutomation: {
          enabled: true,
          sequentialExecution: true,
          parallelProcessing: false,
          maxStepsPerMacro: 10,
          debugLogging: env === 'development'
        },
        dataExport: {
          enabled: true,
          formats: ['json'],
          compressionEnabled: false,
          encryptionEnabled: false
        }
      },
      environmentConfig: envConfig
    };

    return defaultConfig;
  }

  private generateChangeEvents(
    oldConfig: AppConfig | null, 
    newConfig: AppConfig, 
    source: string
  ): ConfigChangeEvent[] {
    const changes: ConfigChangeEvent[] = [];
    const timestamp = new Date().toISOString();

    if (!oldConfig) {
      // Initial configuration
      changes.push({
        type: 'environment_switch',
        timestamp,
        path: 'root',
        oldValue: null,
        newValue: newConfig,
        source,
        metadata: { initialConfig: true }
      });
    } else {
      // Compare configurations and generate specific change events
      if (oldConfig.environmentConfig.environment !== newConfig.environmentConfig.environment) {
        changes.push({
          type: 'environment_switch',
          timestamp,
          path: 'environment',
          oldValue: oldConfig.environmentConfig.environment,
          newValue: newConfig.environmentConfig.environment,
          source
        });
      }

      // Compare feature flags
      const oldFlags = oldConfig.featureFlags || {};
      const newFlags = newConfig.featureFlags || {};
      
      for (const key of new Set([...Object.keys(oldFlags), ...Object.keys(newFlags)])) {
        if (JSON.stringify(oldFlags[key]) !== JSON.stringify(newFlags[key])) {
          changes.push({
            type: 'feature_flag_toggle',
            timestamp,
            path: `featureFlags.${key}`,
            oldValue: oldFlags[key] || null,
            newValue: newFlags[key] || null,
            source
          });
        }
      }

      // Compare performance settings
      if (JSON.stringify(oldConfig.performance) !== JSON.stringify(newConfig.performance)) {
        changes.push({
          type: 'performance_setting_update',
          timestamp,
          path: 'performance',
          oldValue: oldConfig.performance,
          newValue: newConfig.performance,
          source
        });
      }

      // Compare XState machine configurations
      const oldMachines = oldConfig.xstateMachines || {};
      const newMachines = newConfig.xstateMachines || {};
      
      for (const key of new Set([...Object.keys(oldMachines), ...Object.keys(newMachines)])) {
        if (JSON.stringify(oldMachines[key]) !== JSON.stringify(newMachines[key])) {
          changes.push({
            type: 'xstate_config_update',
            timestamp,
            path: `xstateMachines.${key}`,
            oldValue: oldMachines[key] || null,
            newValue: newMachines[key] || null,
            source
          });
        }
      }

      // Compare StockSage configuration
      if (JSON.stringify(oldConfig.stocksage) !== JSON.stringify(newConfig.stocksage)) {
        changes.push({
          type: 'stocksage_config_update',
          timestamp,
          path: 'stocksage',
          oldValue: oldConfig.stocksage,
          newValue: newConfig.stocksage,
          source
        });
      }

      // Compare environment configuration
      if (JSON.stringify(oldConfig.environmentConfig) !== JSON.stringify(newConfig.environmentConfig)) {
        changes.push({
          type: 'environment_switch',
          timestamp,
          path: 'environmentConfig',
          oldValue: oldConfig.environmentConfig,
          newValue: newConfig.environmentConfig,
          source
        });
      }
    }

    return changes;
  }

  private notifySubscribers(changes: ConfigChangeEvent[]): void {
    if (changes.length === 0 || !this.config) {
      return;
    }

    for (const subscription of this.subscriptions.values()) {
      try {
        // Filter changes based on subscription options
        let filteredChanges = changes;
        
        if (subscription.options.filterByPath) {
          filteredChanges = changes.filter(change => 
            subscription.options.filterByPath!.some(path => change.path.startsWith(path))
          );
        }
        
        if (subscription.options.filterByType) {
          filteredChanges = changes.filter(change => 
            subscription.options.filterByType!.includes(change.type)
          );
        }

        if (filteredChanges.length > 0) {
          subscription.callback(filteredChanges, this.config);
        }
      } catch (error) {
        console.error('Error in configuration subscription callback:', error);
      }
    }
  }

  private updateFeatureFlags(flags: Record<string, FeatureFlagConfig>): void {
    // Update feature flag manager with new flags
    for (const [key, flag] of Object.entries(flags)) {
      try {
        const existingFlag = this.featureFlagManager.getFlag(key);
        if (existingFlag) {
          this.featureFlagManager.updateFlag(key, flag as any);
        } else {
          this.featureFlagManager.registerFlag(flag as any);
        }
      } catch (error) {
        console.error(`Failed to update feature flag ${key}:`, error);
      }
    }
  }

  private handleEnvironmentChange(environment: ConfigEnvironment): void {
    if (this.state.activeEnvironment !== environment) {
      this.setState({ activeEnvironment: environment });
      
      // Optionally reload configuration for new environment
      if (this.options.enableHotReload) {
        this.switchEnvironment(environment).catch(error => {
          console.error('Failed to switch environment after detection:', error);
        });
      }
    }
  }

  private setState(updates: Partial<ConfigManagerState>): void {
    this.state = { ...this.state, ...updates };
  }

  private startSync(): void {
    if (!this.options.sync.enabled) {
      return;
    }

    setInterval(() => {
      this.performSync().catch(error => {
        console.error('Configuration sync failed:', error);
      });
    }, this.options.sync.syncInterval);
  }

  private async performSync(): Promise<void> {
    if (this.state.syncing || !this.config) {
      return;
    }

    try {
      this.setState({ syncing: true });
      
      // In a real implementation, this would sync with a remote service
      // For now, we'll just update the last sync timestamp
      this.setState({ 
        syncing: false, 
        lastSync: new Date().toISOString() 
      });
    } catch (error) {
      this.setState({ 
        syncing: false, 
        errors: [...this.state.errors, `Sync failed: ${error}`] 
      });
      throw error;
    }
  }
}