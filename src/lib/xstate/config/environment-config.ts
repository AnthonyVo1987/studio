/**
 * Configuration Management System - Environment Configuration
 * 
 * Environment-specific configuration management with automatic
 * detection, validation, and hot-swapping capabilities.
 */

import type {
  ConfigEnvironment,
  EnvironmentConfig,
  AppConfig,
  ConfigValidationResult
} from './config-types';
import { EnvironmentConfigSchema } from './config-schemas';

// Environment detection result
export interface EnvironmentDetectionResult {
  detected: ConfigEnvironment;
  confidence: number;
  indicators: Array<{
    type: 'url' | 'variable' | 'header' | 'storage';
    value: string;
    weight: number;
  }>;
}

// Environment override configuration
export interface EnvironmentOverride {
  environment: ConfigEnvironment;
  path: string;
  value: any;
  priority: number;
  source: string;
}

// Environment configuration manager
export class EnvironmentConfigManager {
  private configs: Map<ConfigEnvironment, EnvironmentConfig> = new Map();
  private overrides: Map<string, EnvironmentOverride> = new Map();
  private currentEnvironment: ConfigEnvironment = 'development';
  private detectionCallbacks: Array<(env: ConfigEnvironment) => void> = [];
  private initialized = false;

  constructor() {
    this.initializeDefaultConfigs();
    this.detectCurrentEnvironment();
  }

  // Initialize with default configurations
  private initializeDefaultConfigs(): void {
    const baseTimestamp = new Date().toISOString();

    // Development configuration
    const developmentConfig: EnvironmentConfig = {
      id: 'env-development',
      version: '1.0.0',
      environment: 'development',
      priority: 'environment',
      timestamp: baseTimestamp,
      metadata: {
        source: 'system',
        description: 'Development environment configuration',
        tags: ['dev', 'local']
      },
      apiEndpoints: {
        polygon: 'https://api.polygon.io',
        gemini: 'https://generativelanguage.googleapis.com',
        fallback: ['https://api.polygon.io/v2']
      },
      rateLimiting: {
        requestsPerMinute: 300,
        burstLimit: 50,
        backoffMs: 1000
      },
      caching: {
        enabled: true,
        ttl: 300000, // 5 minutes
        maxSize: 50,
        strategy: 'lru'
      },
      logging: {
        level: 'debug',
        destination: 'console',
        structured: true
      }
    };

    // Staging configuration
    const stagingConfig: EnvironmentConfig = {
      ...developmentConfig,
      id: 'env-staging',
      environment: 'staging',
      metadata: {
        source: 'system',
        description: 'Staging environment configuration',
        tags: ['staging', 'pre-prod']
      },
      rateLimiting: {
        requestsPerMinute: 600,
        burstLimit: 100,
        backoffMs: 500
      },
      caching: {
        enabled: true,
        ttl: 600000, // 10 minutes
        maxSize: 100,
        strategy: 'lru'
      },
      logging: {
        level: 'info',
        destination: 'console',
        structured: true
      }
    };

    // Production configuration
    const productionConfig: EnvironmentConfig = {
      ...developmentConfig,
      id: 'env-production',
      environment: 'production',
      metadata: {
        source: 'system',
        description: 'Production environment configuration',
        tags: ['prod', 'live']
      },
      rateLimiting: {
        requestsPerMinute: 1200,
        burstLimit: 200,
        backoffMs: 250
      },
      caching: {
        enabled: true,
        ttl: 1800000, // 30 minutes
        maxSize: 200,
        strategy: 'lru'
      },
      logging: {
        level: 'error',
        destination: 'remote',
        structured: true
      }
    };

    // Test configuration
    const testConfig: EnvironmentConfig = {
      ...developmentConfig,
      id: 'env-test',
      environment: 'test',
      metadata: {
        source: 'system',
        description: 'Test environment configuration',
        tags: ['test', 'ci']
      },
      rateLimiting: {
        requestsPerMinute: 100,
        burstLimit: 20,
        backoffMs: 2000
      },
      caching: {
        enabled: false,
        ttl: 60000, // 1 minute
        maxSize: 10,
        strategy: 'fifo'
      },
      logging: {
        level: 'warn',
        destination: 'console',
        structured: false
      }
    };

    this.configs.set('development', developmentConfig);
    this.configs.set('staging', stagingConfig);
    this.configs.set('production', productionConfig);
    this.configs.set('test', testConfig);

    this.initialized = true;
    console.log('Environment configurations initialized');
  }

  // Detect current environment
  detectCurrentEnvironment(): EnvironmentDetectionResult {
    const indicators: EnvironmentDetectionResult['indicators'] = [];
    let confidence = 0;
    let detected: ConfigEnvironment = 'development';

    // Check URL-based indicators
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('local')) {
        indicators.push({ type: 'url', value: hostname, weight: 0.8 });
        detected = 'development';
        confidence += 0.8;
      } else if (hostname.includes('staging') || hostname.includes('stg')) {
        indicators.push({ type: 'url', value: hostname, weight: 0.9 });
        detected = 'staging';
        confidence += 0.9;
      } else if (hostname.includes('test') || hostname.includes('testing')) {
        indicators.push({ type: 'url', value: hostname, weight: 0.9 });
        detected = 'test';
        confidence += 0.9;
      } else {
        indicators.push({ type: 'url', value: hostname, weight: 0.7 });
        detected = 'production';
        confidence += 0.7;
      }
    }

    // Check environment variables
    if (typeof process !== 'undefined' && process.env) {
      const nodeEnv = process.env.NODE_ENV as string;
      const appEnv = process.env.APP_ENV || process.env.ENVIRONMENT;

      if (nodeEnv) {
        indicators.push({ type: 'variable', value: `NODE_ENV=${nodeEnv}`, weight: 0.6 });
        
        // Map common environment values to ConfigEnvironment types
        if (nodeEnv === 'development' || nodeEnv === 'dev') {
          detected = 'development';
          confidence += 0.6;
        } else if (nodeEnv === 'staging' || nodeEnv === 'stage') {
          detected = 'staging';
          confidence += 0.6;
        } else if (nodeEnv === 'production' || nodeEnv === 'prod') {
          detected = 'production';
          confidence += 0.6;
        } else if (nodeEnv === 'test' || nodeEnv === 'testing') {
          detected = 'test';
          confidence += 0.6;
        }
      }

      if (appEnv) {
        indicators.push({ type: 'variable', value: `APP_ENV=${appEnv}`, weight: 0.8 });
        
        switch (appEnv) {
          case 'development':
          case 'dev':
            detected = 'development';
            confidence += 0.8;
            break;
          case 'staging':
          case 'stage':
            detected = 'staging';
            confidence += 0.8;
            break;
          case 'production':
          case 'prod':
            detected = 'production';
            confidence += 0.8;
            break;
          case 'test':
          case 'testing':
            detected = 'test';
            confidence += 0.8;
            break;
        }
      }
    }

    // Check local storage indicators
    if (typeof localStorage !== 'undefined') {
      try {
        const storedEnv = localStorage.getItem('xstate-config-environment');
        if (storedEnv && ['development', 'staging', 'production', 'test'].includes(storedEnv)) {
          indicators.push({ type: 'storage', value: `localStorage=${storedEnv}`, weight: 0.5 });
          detected = storedEnv as ConfigEnvironment;
          confidence += 0.5;
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }

    // Normalize confidence (cap at 1.0)
    confidence = Math.min(confidence, 1.0);

    const result: EnvironmentDetectionResult = {
      detected,
      confidence,
      indicators
    };

    this.currentEnvironment = detected;
    console.log(`Environment detected: ${detected} (confidence: ${confidence.toFixed(2)})`);

    // Notify callbacks
    this.detectionCallbacks.forEach(callback => {
      try {
        callback(detected);
      } catch (error) {
        console.error('Error in environment detection callback:', error);
      }
    });

    return result;
  }

  // Get current environment
  getCurrentEnvironment(): ConfigEnvironment {
    return this.currentEnvironment;
  }

  // Set current environment
  setCurrentEnvironment(environment: ConfigEnvironment): void {
    if (!this.configs.has(environment)) {
      throw new Error(`Environment configuration not found: ${environment}`);
    }

    const oldEnvironment = this.currentEnvironment;
    this.currentEnvironment = environment;

    // Store in localStorage for persistence
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('xstate-config-environment', environment);
      } catch (error) {
        console.warn('Failed to store environment in localStorage:', error);
      }
    }

    console.log(`Environment switched from ${oldEnvironment} to ${environment}`);

    // Notify callbacks
    this.detectionCallbacks.forEach(callback => {
      try {
        callback(environment);
      } catch (error) {
        console.error('Error in environment change callback:', error);
      }
    });
  }

  // Get environment configuration
  getEnvironmentConfig(environment?: ConfigEnvironment): EnvironmentConfig | null {
    const env = environment || this.currentEnvironment;
    return this.configs.get(env) || null;
  }

  // Update environment configuration
  updateEnvironmentConfig(environment: ConfigEnvironment, updates: Partial<EnvironmentConfig>): void {
    const existingConfig = this.configs.get(environment);
    if (!existingConfig) {
      throw new Error(`Environment configuration not found: ${environment}`);
    }

    const updatedConfig = { 
      ...existingConfig, 
      ...updates,
      timestamp: new Date().toISOString()
    };

    // Validate updated configuration
    const validation = this.validateEnvironmentConfig(updatedConfig);
    if (!validation.valid) {
      throw new Error(`Invalid environment configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.configs.set(environment, updatedConfig);
    console.log(`Environment configuration updated: ${environment}`);
  }

  // Add environment override
  addOverride(override: EnvironmentOverride): void {
    const key = `${override.environment}-${override.path}`;
    this.overrides.set(key, override);
    console.log(`Environment override added: ${key}`);
  }

  // Remove environment override
  removeOverride(environment: ConfigEnvironment, path: string): void {
    const key = `${environment}-${path}`;
    const removed = this.overrides.delete(key);
    if (removed) {
      console.log(`Environment override removed: ${key}`);
    } else {
      console.warn(`Environment override not found: ${key}`);
    }
  }

  // Get effective configuration with overrides applied
  getEffectiveConfig(environment?: ConfigEnvironment): EnvironmentConfig | null {
    const env = environment || this.currentEnvironment;
    const baseConfig = this.configs.get(env);
    
    if (!baseConfig) {
      return null;
    }

    // Apply overrides
    let effectiveConfig = { ...baseConfig };
    
    // Get overrides for this environment sorted by priority
    const applicableOverrides = Array.from(this.overrides.values())
      .filter(override => override.environment === env)
      .sort((a, b) => b.priority - a.priority);

    for (const override of applicableOverrides) {
      try {
        this.applyOverride(effectiveConfig, override);
      } catch (error) {
        console.error(`Failed to apply override ${override.path}:`, error);
      }
    }

    return effectiveConfig;
  }

  // List all environments
  listEnvironments(): ConfigEnvironment[] {
    return Array.from(this.configs.keys());
  }

  // Get environment configuration summary
  getEnvironmentSummary(): Array<{
    environment: ConfigEnvironment;
    isActive: boolean;
    hasOverrides: boolean;
    overrideCount: number;
    lastModified: string;
  }> {
    return this.listEnvironments().map(env => {
      const config = this.configs.get(env)!;
      const overrides = Array.from(this.overrides.values())
        .filter(override => override.environment === env);

      return {
        environment: env,
        isActive: env === this.currentEnvironment,
        hasOverrides: overrides.length > 0,
        overrideCount: overrides.length,
        lastModified: config.timestamp
      };
    });
  }

  // Subscribe to environment changes
  onEnvironmentChange(callback: (environment: ConfigEnvironment) => void): () => void {
    this.detectionCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.detectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.detectionCallbacks.splice(index, 1);
      }
    };
  }

  // Validate environment configuration
  validateEnvironmentConfig(config: EnvironmentConfig): ConfigValidationResult {
    try {
      EnvironmentConfigSchema.parse(config);
      return {
        valid: true,
        errors: [],
        warnings: []
      };
    } catch (error: any) {
      const errors = error.errors?.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code
      })) || [{ path: 'unknown', message: 'Validation failed', code: 'VALIDATION_ERROR' }];

      return {
        valid: false,
        errors,
        warnings: []
      };
    }
  }

  // Export environment configurations
  exportConfigurations(): Record<ConfigEnvironment, EnvironmentConfig> {
    const exported: Record<ConfigEnvironment, EnvironmentConfig> = {} as any;
    
    for (const [env, config] of this.configs.entries()) {
      exported[env] = { ...config };
    }
    
    return exported;
  }

  // Import environment configurations
  importConfigurations(configurations: Record<ConfigEnvironment, EnvironmentConfig>): void {
    for (const [env, config] of Object.entries(configurations)) {
      const environment = env as ConfigEnvironment;
      
      // Validate configuration
      const validation = this.validateEnvironmentConfig(config);
      if (!validation.valid) {
        console.error(`Invalid configuration for environment ${environment}:`, validation.errors);
        continue;
      }
      
      this.configs.set(environment, config);
      console.log(`Environment configuration imported: ${environment}`);
    }
  }

  // Health check for environment configurations
  async healthCheck(): Promise<{
    healthy: boolean;
    environments: Record<ConfigEnvironment, {
      valid: boolean;
      accessible: boolean;
      errors: string[];
    }>;
  }> {
    const environments: Record<ConfigEnvironment, {
      valid: boolean;
      accessible: boolean;
      errors: string[];
    }> = {} as any;

    let overallHealthy = true;

    for (const [env, config] of this.configs.entries()) {
      const errors: string[] = [];
      
      // Validate configuration
      const validation = this.validateEnvironmentConfig(config);
      const valid = validation.valid;
      
      if (!valid) {
        errors.push(...validation.errors.map(e => e.message));
        overallHealthy = false;
      }

      // Test API endpoint accessibility (simplified check)
      let accessible = true;
      try {
        // In a real implementation, you'd make actual HTTP requests
        // For now, we'll just validate the URLs
        new URL(config.apiEndpoints.polygon);
        new URL(config.apiEndpoints.gemini);
      } catch (error) {
        accessible = false;
        errors.push('Invalid API endpoint URLs');
        overallHealthy = false;
      }

      environments[env] = {
        valid,
        accessible,
        errors
      };
    }

    return {
      healthy: overallHealthy,
      environments
    };
  }

  // Private helper methods
  private applyOverride(config: any, override: EnvironmentOverride): void {
    const pathParts = override.path.split('.');
    let current = config;
    
    // Navigate to the parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the final value
    const finalKey = pathParts[pathParts.length - 1];
    current[finalKey] = override.value;
  }

  // Get initialization status
  isInitialized(): boolean {
    return this.initialized;
  }

  // Reset to default configurations
  resetToDefaults(): void {
    this.configs.clear();
    this.overrides.clear();
    this.initializeDefaultConfigs();
    console.log('Environment configurations reset to defaults');
  }
}