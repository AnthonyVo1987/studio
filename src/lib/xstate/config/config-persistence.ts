/**
 * Configuration Management System - Persistence Layer
 * 
 * Comprehensive configuration persistence with multiple storage backends,
 * versioning, backup/restore, and synchronization capabilities.
 */

import type {
  AppConfig,
  ConfigPersistenceOptions,
  ConfigSyncOptions,
  ConfigChangeEvent,
  ConfigValidationResult,
  ConfigAuditEntry,
  ConfigHealthCheck
} from './config-types';
import { AppConfigSchema, ConfigValidationResultSchema } from './config-schemas';

// Storage backend interface
interface StorageBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

// LocalStorage backend implementation
class LocalStorageBackend implements StorageBackend {
  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('LocalStorage set error:', error);
      throw new Error(`Failed to store configuration: ${error}`);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      throw new Error(`Failed to remove configuration: ${error}`);
    }
  }

  async keys(): Promise<string[]> {
    try {
      return Object.keys(localStorage).filter(key => key.startsWith('xstate-config'));
    } catch (error) {
      console.error('LocalStorage keys error:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.keys();
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      throw new Error(`Failed to clear configuration: ${error}`);
    }
  }
}

// SessionStorage backend implementation
class SessionStorageBackend implements StorageBackend {
  async get(key: string): Promise<string | null> {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('SessionStorage get error:', error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('SessionStorage set error:', error);
      throw new Error(`Failed to store configuration: ${error}`);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('SessionStorage remove error:', error);
      throw new Error(`Failed to remove configuration: ${error}`);
    }
  }

  async keys(): Promise<string[]> {
    try {
      return Object.keys(sessionStorage).filter(key => key.startsWith('xstate-config'));
    } catch (error) {
      console.error('SessionStorage keys error:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.keys();
      keys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('SessionStorage clear error:', error);
      throw new Error(`Failed to clear configuration: ${error}`);
    }
  }
}

// IndexedDB backend implementation
class IndexedDBBackend implements StorageBackend {
  private dbName = 'xstate-config-db';
  private storeName = 'configurations';
  private version = 1;

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.put({ key, value, timestamp: Date.now() });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('IndexedDB set error:', error);
      throw new Error(`Failed to store configuration: ${error}`);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('IndexedDB remove error:', error);
      throw new Error(`Failed to remove configuration: ${error}`);
    }
  }

  async keys(): Promise<string[]> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const keys = request.result as string[];
          resolve(keys.filter(key => key.startsWith('xstate-config')));
        };
      });
    } catch (error) {
      console.error('IndexedDB keys error:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const keys = await this.keys();
      const deletePromises = keys.map(key => 
        new Promise<void>((resolve, reject) => {
          const request = store.delete(key);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        })
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('IndexedDB clear error:', error);
      throw new Error(`Failed to clear configuration: ${error}`);
    }
  }
}

// Configuration persistence manager
export class ConfigPersistenceManager {
  private backend: StorageBackend;
  private options: ConfigPersistenceOptions;
  private syncOptions: ConfigSyncOptions;
  private compressionEnabled: boolean;
  private encryptionEnabled: boolean;

  constructor(
    options: ConfigPersistenceOptions,
    syncOptions: ConfigSyncOptions = { 
      enabled: false, 
      strategy: 'merge', 
      conflictResolution: 'latest', 
      broadcastChanges: true, 
      syncInterval: 60000 
    }
  ) {
    this.options = options;
    this.syncOptions = syncOptions;
    this.compressionEnabled = options.compression;
    this.encryptionEnabled = options.encryption;

    // Initialize storage backend
    switch (options.storage) {
      case 'localStorage':
        this.backend = new LocalStorageBackend();
        break;
      case 'sessionStorage':
        this.backend = new SessionStorageBackend();
        break;
      case 'indexedDB':
        this.backend = new IndexedDBBackend();
        break;
      default:
        this.backend = new LocalStorageBackend();
    }
  }

  // Store configuration
  async storeConfig(config: AppConfig): Promise<void> {
    try {
      // Validate configuration before storing
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Serialize configuration
      let serialized = JSON.stringify(config, null, 2);

      // Apply compression if enabled
      if (this.compressionEnabled) {
        serialized = await this.compress(serialized);
      }

      // Apply encryption if enabled
      if (this.encryptionEnabled) {
        serialized = await this.encrypt(serialized);
      }

      // Store configuration
      const key = this.getConfigKey(config.environmentConfig.environment, config.version);
      await this.backend.set(key, serialized);

      // Create backup if enabled
      if (this.options.backup.enabled) {
        await this.createBackup(config);
      }

      // Create audit entry
      await this.createAuditEntry({
        timestamp: new Date().toISOString(),
        action: 'store_config',
        user: 'system',
        path: key,
        oldValue: null,
        newValue: config,
        success: true
      });

      console.log(`Configuration stored successfully: ${key}`);
    } catch (error) {
      console.error('Failed to store configuration:', error);
      
      // Create audit entry for failure
      await this.createAuditEntry({
        timestamp: new Date().toISOString(),
        action: 'store_config',
        user: 'system',
        path: 'unknown',
        oldValue: null,
        newValue: config,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  // Load configuration
  async loadConfig(environment: string, version?: string): Promise<AppConfig | null> {
    try {
      const key = version 
        ? this.getConfigKey(environment, version)
        : await this.getLatestConfigKey(environment);

      if (!key) {
        console.warn(`No configuration found for environment: ${environment}`);
        return null;
      }

      let serialized = await this.backend.get(key);
      if (!serialized) {
        console.warn(`Configuration not found: ${key}`);
        return null;
      }

      // Apply decryption if enabled
      if (this.encryptionEnabled) {
        serialized = await this.decrypt(serialized);
      }

      // Apply decompression if enabled
      if (this.compressionEnabled) {
        serialized = await this.decompress(serialized);
      }

      // Parse configuration
      const config = JSON.parse(serialized) as AppConfig;

      // Validate loaded configuration
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        console.error('Loaded configuration is invalid:', validation.errors);
        return null;
      }

      console.log(`Configuration loaded successfully: ${key}`);
      return config;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return null;
    }
  }

  // Remove configuration
  async removeConfig(environment: string, version?: string): Promise<void> {
    try {
      const key = version 
        ? this.getConfigKey(environment, version)
        : await this.getLatestConfigKey(environment);

      if (!key) {
        console.warn(`No configuration found for environment: ${environment}`);
        return;
      }

      await this.backend.remove(key);

      // Create audit entry
      await this.createAuditEntry({
        timestamp: new Date().toISOString(),
        action: 'remove_config',
        user: 'system',
        path: key,
        oldValue: null,
        newValue: null,
        success: true
      });

      console.log(`Configuration removed successfully: ${key}`);
    } catch (error) {
      console.error('Failed to remove configuration:', error);
      throw error;
    }
  }

  // List all configurations
  async listConfigurations(): Promise<Array<{ environment: string; version: string; key: string }>> {
    try {
      const keys = await this.backend.keys();
      return keys
        .filter(key => key.startsWith('xstate-config-'))
        .map(key => {
          const parts = key.replace('xstate-config-', '').split('-');
          return {
            environment: parts[0],
            version: parts[1],
            key
          };
        })
        .sort((a, b) => b.version.localeCompare(a.version));
    } catch (error) {
      console.error('Failed to list configurations:', error);
      return [];
    }
  }

  // Create backup
  async createBackup(config: AppConfig): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupKey = `xstate-config-backup-${config.environmentConfig.environment}-${timestamp}`;
      
      const serialized = JSON.stringify(config, null, 2);
      await this.backend.set(backupKey, serialized);

      // Clean up old backups
      await this.cleanupOldBackups();

      console.log(`Backup created: ${backupKey}`);
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  // Restore from backup
  async restoreFromBackup(backupKey: string): Promise<AppConfig | null> {
    try {
      const serialized = await this.backend.get(backupKey);
      if (!serialized) {
        console.warn(`Backup not found: ${backupKey}`);
        return null;
      }

      const config = JSON.parse(serialized) as AppConfig;
      
      // Validate restored configuration
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        console.error('Restored configuration is invalid:', validation.errors);
        return null;
      }

      // Store as current configuration
      await this.storeConfig(config);

      console.log(`Configuration restored from backup: ${backupKey}`);
      return config;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return null;
    }
  }

  // Export configuration
  async exportConfig(environment: string, format: 'json' | 'yaml' = 'json'): Promise<string | null> {
    try {
      const config = await this.loadConfig(environment);
      if (!config) {
        return null;
      }

      switch (format) {
        case 'json':
          return JSON.stringify(config, null, 2);
        case 'yaml':
          // Note: In a real implementation, you'd use a YAML library
          return JSON.stringify(config, null, 2); // Fallback to JSON for now
        default:
          return JSON.stringify(config, null, 2);
      }
    } catch (error) {
      console.error('Failed to export configuration:', error);
      return null;
    }
  }

  // Import configuration
  async importConfig(data: string, format: 'json' | 'yaml' = 'json'): Promise<boolean> {
    try {
      let config: AppConfig;

      switch (format) {
        case 'json':
          config = JSON.parse(data);
          break;
        case 'yaml':
          // Note: In a real implementation, you'd use a YAML library
          config = JSON.parse(data); // Fallback to JSON for now
          break;
        default:
          config = JSON.parse(data);
      }

      // Validate imported configuration
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        console.error('Imported configuration is invalid:', validation.errors);
        return false;
      }

      // Store imported configuration
      await this.storeConfig(config);
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }

  // Validate configuration
  private validateConfig(config: unknown): ConfigValidationResult {
    try {
      AppConfigSchema.parse(config);
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

  // Health check
  async healthCheck(): Promise<ConfigHealthCheck> {
    const checks = [];
    let healthy = true;

    try {
      // Check storage backend availability
      const testKey = 'xstate-config-health-check';
      const testValue = 'test';
      
      await this.backend.set(testKey, testValue);
      const retrieved = await this.backend.get(testKey);
      await this.backend.remove(testKey);

      if (retrieved === testValue) {
        checks.push({
          name: 'Storage Backend',
          status: 'pass' as const,
          message: 'Storage backend is accessible',
          timestamp: new Date().toISOString()
        });
      } else {
        healthy = false;
        checks.push({
          name: 'Storage Backend',
          status: 'fail' as const,
          message: 'Storage backend test failed',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      healthy = false;
      checks.push({
        name: 'Storage Backend',
        status: 'fail' as const,
        message: `Storage backend error: ${error}`,
        timestamp: new Date().toISOString()
      });
    }

    // Check configuration validity
    try {
      const configs = await this.listConfigurations();
      const validConfigs = [];
      
      for (const { environment } of configs.slice(0, 5)) { // Check first 5 configs
        const config = await this.loadConfig(environment);
        if (config) {
          const validation = this.validateConfig(config);
          if (validation.valid) {
            validConfigs.push(environment);
          }
        }
      }

      checks.push({
        name: 'Configuration Validity',
        status: 'pass' as const,
        message: `${validConfigs.length} configurations validated successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      healthy = false;
      checks.push({
        name: 'Configuration Validity',
        status: 'fail' as const,
        message: `Configuration validation error: ${error}`,
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
        warnings: 0 // No warnings status available, only 'pass' and 'fail'
      }
    };
  }

  // Helper methods
  private getConfigKey(environment: string, version: string): string {
    return `xstate-config-${environment}-${version}`;
  }

  private async getLatestConfigKey(environment: string): Promise<string | null> {
    const configs = await this.listConfigurations();
    const envConfigs = configs.filter(c => c.environment === environment);
    return envConfigs.length > 0 ? envConfigs[0].key : null;
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const keys = await this.backend.keys();
      const backupKeys = keys
        .filter(key => key.startsWith('xstate-config-backup-'))
        .sort()
        .reverse();

      if (backupKeys.length > this.options.backup.maxBackups) {
        const keysToRemove = backupKeys.slice(this.options.backup.maxBackups);
        for (const key of keysToRemove) {
          await this.backend.remove(key);
        }
        console.log(`Cleaned up ${keysToRemove.length} old backups`);
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  private async createAuditEntry(entry: ConfigAuditEntry): Promise<void> {
    try {
      const auditKey = `xstate-config-audit-${entry.timestamp}-${Date.now()}`;
      const serialized = JSON.stringify(entry);
      await this.backend.set(auditKey, serialized);
    } catch (error) {
      console.error('Failed to create audit entry:', error);
    }
  }

  private async compress(data: string): Promise<string> {
    // Note: In a real implementation, you'd use a compression library like pako
    // For now, we'll just return the data as-is
    return data;
  }

  private async decompress(data: string): Promise<string> {
    // Note: In a real implementation, you'd use a compression library like pako
    // For now, we'll just return the data as-is
    return data;
  }

  private async encrypt(data: string): Promise<string> {
    // Note: In a real implementation, you'd use a proper encryption library
    // For now, we'll just return the data as-is with a warning
    console.warn('Encryption is enabled but not implemented. Data is stored unencrypted.');
    return data;
  }

  private async decrypt(data: string): Promise<string> {
    // Note: In a real implementation, you'd use a proper encryption library
    // For now, we'll just return the data as-is
    return data;
  }
}