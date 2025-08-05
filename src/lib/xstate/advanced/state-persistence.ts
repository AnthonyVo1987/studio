/**
 * @fileoverview State Persistence System for XState Machines
 * 
 * Provides comprehensive state machine snapshot serialization, storage,
 * and restoration capabilities with encryption, compression, and migration support.
 */

import { 
  type AnyMachineSnapshot,
  type ActorRef
} from 'xstate';
import type {
  StatePersistenceConfig,
  PersistenceAdapter,
  PersistedState,
  PersistenceMetadata,
  AdvancedMachineSnapshot
} from './advanced-types';

// ================================
// STORAGE ADAPTERS
// ================================

/**
 * Memory storage adapter for testing and temporary persistence
 */
class MemoryStorageAdapter implements PersistenceAdapter {
  private storage: Map<string, PersistedState> = new Map();

  async save(key: string, state: PersistedState): Promise<void> {
    this.storage.set(key, state);
  }

  async load(key: string): Promise<PersistedState | null> {
    return this.storage.get(key) || null;
  }

  async delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  async list(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

/**
 * LocalStorage adapter for browser persistence
 */
class LocalStorageAdapter implements PersistenceAdapter {
  private prefix: string;

  constructor(prefix: string = 'xstate-') {
    this.prefix = prefix;
  }

  async save(key: string, state: PersistedState): Promise<void> {
    const storageKey = `${this.prefix}${key}`;
    const serialized = JSON.stringify(state);
    localStorage.setItem(storageKey, serialized);
  }

  async load(key: string): Promise<PersistedState | null> {
    const storageKey = `${this.prefix}${key}`;
    const serialized = localStorage.getItem(storageKey);
    
    if (!serialized) {
      return null;
    }

    try {
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Failed to parse persisted state:', error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    const storageKey = `${this.prefix}${key}`;
    const existed = localStorage.getItem(storageKey) !== null;
    localStorage.removeItem(storageKey);
    return existed;
  }

  async list(): Promise<string[]> {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    
    return keys;
  }

  async clear(): Promise<void> {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

/**
 * SessionStorage adapter for session-based persistence
 */
class SessionStorageAdapter implements PersistenceAdapter {
  private prefix: string;

  constructor(prefix: string = 'xstate-session-') {
    this.prefix = prefix;
  }

  async save(key: string, state: PersistedState): Promise<void> {
    const storageKey = `${this.prefix}${key}`;
    const serialized = JSON.stringify(state);
    sessionStorage.setItem(storageKey, serialized);
  }

  async load(key: string): Promise<PersistedState | null> {
    const storageKey = `${this.prefix}${key}`;
    const serialized = sessionStorage.getItem(storageKey);
    
    if (!serialized) {
      return null;
    }

    try {
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Failed to parse persisted state:', error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    const storageKey = `${this.prefix}${key}`;
    const existed = sessionStorage.getItem(storageKey) !== null;
    sessionStorage.removeItem(storageKey);
    return existed;
  }

  async list(): Promise<string[]> {
    const keys: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    
    return keys;
  }

  async clear(): Promise<void> {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }                                      
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }
}

/**
 * IndexedDB adapter for large-scale browser persistence
 */
class IndexedDBAdapter implements PersistenceAdapter {
  private dbName: string;
  private storeName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = 'XStateDB', storeName: string = 'states', version: number = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async save(key: string, state: PersistedState): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ key, ...state });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async load(key: string): Promise<PersistedState | null> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { key: _, ...state } = result;
          resolve(state as PersistedState);
        } else {
          resolve(null);
        }
      };
    });
  }

  async delete(key: string): Promise<boolean> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(key);
      
      getRequest.onsuccess = () => {
        const existed = getRequest.result !== undefined;
        if (existed) {
          const deleteRequest = store.delete(key);
          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onsuccess = () => resolve(true);
        } else {
          resolve(false);
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async list(): Promise<string[]> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// ================================
// COMPRESSION UTILITIES
// ================================

/**
 * Simple text compression using LZ-string-like algorithm
 */
class CompressionUtils {
  /**
   * Compress string data
   */
  static compress(data: string): string {
    // Simple run-length encoding for demonstration
    let compressed = '';
    let count = 1;
    let current = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i] === current && count < 255) {
        count++;
      } else {
        compressed += current + (count > 1 ? count.toString() : '');
        current = data[i];
        count = 1;
      }
    }
    
    compressed += current + (count > 1 ? count.toString() : '');
    return compressed;
  }

  /**
   * Decompress string data
   */
  static decompress(compressed: string): string {
    let decompressed = '';
    let i = 0;
    
    while (i < compressed.length) {
      const char = compressed[i];
      i++;
      
      // Check if next characters are digits
      let count = '';
      while (i < compressed.length && /\d/.test(compressed[i])) {
        count += compressed[i];
        i++;
      }
      
      const repeatCount = count ? parseInt(count) : 1;
      decompressed += char.repeat(repeatCount);
    }
    
    return decompressed;
  }
}

// ================================
// ENCRYPTION UTILITIES
// ================================

/**
 * Simple encryption utilities (for demonstration - use proper crypto in production)
 */
class EncryptionUtils {
  /**
   * Simple XOR encryption (demo only - use proper encryption in production)
   */
  static encrypt(data: string, key: string): string {
    let encrypted = '';
    
    for (let i = 0; i < data.length; i++) {
      const keyChar = key[i % key.length];
      const encryptedChar = data.charCodeAt(i) ^ keyChar.charCodeAt(0);
      encrypted += String.fromCharCode(encryptedChar);
    }
    
    return btoa(encrypted); // Base64 encode
  }

  /**
   * Decrypt XOR encrypted data
   */
  static decrypt(encryptedData: string, key: string): string {
    const decoded = atob(encryptedData); // Base64 decode
    let decrypted = '';
    
    for (let i = 0; i < decoded.length; i++) {
      const keyChar = key[i % key.length];
      const decryptedChar = decoded.charCodeAt(i) ^ keyChar.charCodeAt(0);
      decrypted += String.fromCharCode(decryptedChar);
    }
    
    return decrypted;
  }
}

// ================================
// STATE PERSISTENCE MANAGER
// ================================

/**
 * Main state persistence manager with full feature support
 */
export class StatePersistenceManager {
  private config: StatePersistenceConfig;
  private adapter: PersistenceAdapter;
  private migrationStrategies: Map<number, (state: any) => any> = new Map();

  constructor(config: StatePersistenceConfig) {
    this.config = config;
    this.adapter = this.createAdapter(config);
    this.setupDefaultMigrations();
  }

  /**
   * Create storage adapter based on configuration
   */
  private createAdapter(config: StatePersistenceConfig): PersistenceAdapter {
    switch (config.storageType) {
      case 'memory':
        return new MemoryStorageAdapter();
      case 'localStorage':
        return new LocalStorageAdapter();
      case 'sessionStorage':
        return new SessionStorageAdapter();
      case 'indexedDB':
        return new IndexedDBAdapter();
      case 'custom':
        if (!config.customAdapter) {
          throw new Error('Custom adapter required when storageType is "custom"');
        }
        return config.customAdapter;
      default:
        return new MemoryStorageAdapter();
    }
  }

  /**
   * Persist state machine snapshot with XState v5 compatibility
   */
  async persistState(
    key: string,
    snapshot: AnyMachineSnapshot,
    metadata: Partial<PersistenceMetadata> = {}
  ): Promise<void> {
    const fullMetadata: PersistenceMetadata = {
      persistedAt: Date.now(),
      schemaVersion: this.config.schemaVersion,
      actorId: key,
      machineType: 'unknown',
      reason: 'manual',
      ...metadata
    };

    // XState v5 compatibility: Create a serializable snapshot structure
    const serializableSnapshot = {
      value: snapshot.value,
      context: snapshot.context,
      status: (snapshot as any).status || 'active',
      output: (snapshot as any).output,
      error: (snapshot as any).error,
      // Include any additional XState v5 properties that need to be persisted
      _version: 'v5',
      _timestamp: Date.now(),
    };

    // Serialize snapshot
    let serializedSnapshot = JSON.stringify(serializableSnapshot);

    // Apply compression if enabled
    if (this.config.compressionEnabled) {
      serializedSnapshot = CompressionUtils.compress(serializedSnapshot);
    }

    // Create persisted state
    const persistedState: PersistedState = {
      snapshot: serializableSnapshot as any, // Store the serializable version
      metadata: fullMetadata,
      checksum: this.generateChecksum(serializedSnapshot)
    };

    // Apply encryption if enabled
    if (this.config.encryptionEnabled && this.config.encryptionKey) {
      persistedState.encryptedData = EncryptionUtils.encrypt(serializedSnapshot, this.config.encryptionKey);
    } else {
      persistedState.compressedData = serializedSnapshot;
    }

    // Save to adapter
    await this.adapter.save(key, persistedState);
  }

  /**
   * Restore state machine snapshot with XState v5 compatibility
   */
  async restoreState(key: string): Promise<AnyMachineSnapshot | null> {
    const persistedState = await this.adapter.load(key);
    if (!persistedState) {
      return null;
    }

    // Decrypt if necessary
    let serializedSnapshot: string;
    
    if (persistedState.encryptedData && this.config.encryptionKey) {
      serializedSnapshot = EncryptionUtils.decrypt(persistedState.encryptedData, this.config.encryptionKey);
    } else if (persistedState.compressedData) {
      serializedSnapshot = persistedState.compressedData;
    } else {
      console.error('No serialized data found in persisted state');
      return null;
    }

    // Verify checksum
    const expectedChecksum = this.generateChecksum(serializedSnapshot);
    if (persistedState.checksum !== expectedChecksum) {
      console.error('Checksum mismatch - data may be corrupted');
      return null;
    }

    // Decompress if necessary
    if (this.config.compressionEnabled) {
      serializedSnapshot = CompressionUtils.decompress(serializedSnapshot);
    }

    // Parse snapshot
    let parsedSnapshot: any;
    try {
      parsedSnapshot = JSON.parse(serializedSnapshot);
    } catch (error) {
      console.error('Failed to parse persisted snapshot:', error);
      return null;
    }

    // XState v5 compatibility: Validate and transform snapshot structure
    let snapshot: AnyMachineSnapshot;
    if (parsedSnapshot._version === 'v5') {
      // This is a v5 snapshot - use it directly
      snapshot = parsedSnapshot as AnyMachineSnapshot;
    } else {
      // Legacy snapshot - attempt to migrate to v5 format
      snapshot = {
        value: parsedSnapshot.value,
        context: parsedSnapshot.context,
        status: parsedSnapshot.done ? 'done' : 'active',
        output: parsedSnapshot.output,
        error: parsedSnapshot.error,
      } as AnyMachineSnapshot;
    }

    // Apply migrations if necessary
    if (persistedState.metadata.schemaVersion < this.config.schemaVersion) {
      snapshot = await this.migrateSnapshot(snapshot, persistedState.metadata.schemaVersion);
    }

    return snapshot;
  }

  /**
   * Delete persisted state
   */
  async deleteState(key: string): Promise<boolean> {
    return await this.adapter.delete(key);
  }

  /**
   * List all persisted state keys
   */
  async listStates(): Promise<string[]> {
    return await this.adapter.list();
  }

  /**
   * Clear all persisted states
   */
  async clearAllStates(): Promise<void> {
    await this.adapter.clear();
  }

  /**
   * Get persistence metadata for a state
   */
  async getStateMetadata(key: string): Promise<PersistenceMetadata | null> {
    const persistedState = await this.adapter.load(key);
    return persistedState?.metadata || null;
  }

  /**
   * Check if state exists
   */
  async stateExists(key: string): Promise<boolean> {
    const state = await this.adapter.load(key);
    return state !== null;
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Migrate snapshot to current schema version
   */
  private async migrateSnapshot(
    snapshot: AnyMachineSnapshot,
    fromVersion: number
  ): Promise<AnyMachineSnapshot> {
    let migratedSnapshot = snapshot;
    
    // Apply migrations sequentially from old version to current
    for (let version = fromVersion + 1; version <= this.config.schemaVersion; version++) {
      const migrationFn = this.migrationStrategies.get(version);
      if (migrationFn) {
        migratedSnapshot = migrationFn(migratedSnapshot);
      }
    }
    
    return migratedSnapshot;
  }

  /**
   * Setup default migration strategies
   */
  private setupDefaultMigrations(): void {
    // Example migration from version 1 to 2
    this.migrationStrategies.set(2, (snapshot: any) => {
      // Add new fields or transform existing ones
      return {
        ...snapshot,
        // Add migration logic here
      };
    });
  }

  /**
   * Add custom migration strategy
   */
  addMigration(version: number, migrationFn: (state: any) => any): void {
    this.migrationStrategies.set(version, migrationFn);
  }

  /**
   * Get persistence statistics
   */
  async getStatistics(): Promise<{
    totalStates: number;
    totalSize: number;
    averageSize: number;
    oldestState: Date | null;
    newestState: Date | null;
  }> {
    const keys = await this.listStates();
    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    for (const key of keys) {
      const state = await this.adapter.load(key);
      if (state) {
        const stateSize = JSON.stringify(state).length;
        totalSize += stateSize;
        
        if (state.metadata.persistedAt < oldestTimestamp) {
          oldestTimestamp = state.metadata.persistedAt;
        }
        if (state.metadata.persistedAt > newestTimestamp) {
          newestTimestamp = state.metadata.persistedAt;
        }
      }
    }

    return {
      totalStates: keys.length,
      totalSize,
      averageSize: keys.length > 0 ? totalSize / keys.length : 0,
      oldestState: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
      newestState: newestTimestamp === 0 ? null : new Date(newestTimestamp)
    };
  }

  /**
   * Cleanup old states based on age
   */
  async cleanupOldStates(maxAgeMs: number): Promise<number> {
    const keys = await this.listStates();
    const cutoffTime = Date.now() - maxAgeMs;
    let deletedCount = 0;

    for (const key of keys) {
      const metadata = await this.getStateMetadata(key);
      if (metadata && metadata.persistedAt < cutoffTime) {
        await this.deleteState(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

// ================================
// ACTOR PERSISTENCE UTILITIES
// ================================

/**
 * Utilities for persisting actor states with automatic snapshots
 */
export class ActorPersistenceUtils {
  private persistenceManager: StatePersistenceManager;
  private autoSaveIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(persistenceManager: StatePersistenceManager) {
    this.persistenceManager = persistenceManager;
  }

  /**
   * Setup automatic state persistence for actor
   */
  setupAutoPersistence(
    actorId: string,
    actor: ActorRef<any, any>,
    intervalMs: number = 30000, // 30 seconds
    conditions?: (snapshot: AnyMachineSnapshot) => boolean
  ): void {
    // Clear existing interval if any
    this.clearAutoPersistence(actorId);

    const interval = setInterval(async () => {
      const snapshot = actor.getSnapshot();
      
      // Check conditions if provided
      if (conditions && !conditions(snapshot)) {
        return;
      }

      // Persist snapshot
      await this.persistenceManager.persistState(actorId, snapshot, {
        actorId,
        reason: 'checkpoint'
      });
    }, intervalMs);

    this.autoSaveIntervals.set(actorId, interval);
  }

  /**
   * Clear automatic persistence for actor
   */
  clearAutoPersistence(actorId: string): void {
    const interval = this.autoSaveIntervals.get(actorId);
    if (interval) {
      clearInterval(interval);
      this.autoSaveIntervals.delete(actorId);
    }
  }

  /**
   * Persist actor state immediately
   */
  async persistActorState(
    actorId: string,
    actor: ActorRef<any, any>,
    reason: PersistenceMetadata['reason'] = 'manual'
  ): Promise<void> {
    const snapshot = actor.getSnapshot();
    await this.persistenceManager.persistState(actorId, snapshot, {
      actorId,
      reason
    });
  }

  /**
   * Setup persistence on actor shutdown
   */
  setupShutdownPersistence(actorId: string, actor: ActorRef<any, any>): void {
    // Listen for actor completion
    actor.subscribe({
      complete: async () => {
        const snapshot = actor.getSnapshot();
        await this.persistenceManager.persistState(actorId, snapshot, {
          actorId,
          reason: 'shutdown'
        });
      }
    });
  }

  /**
   * Cleanup all auto-persistence intervals
   */
  destroy(): void {
    for (const interval of this.autoSaveIntervals.values()) {
      clearInterval(interval);
    }
    this.autoSaveIntervals.clear();
  }
}

// ================================
// EXPORTS
// ================================

export {
  type StatePersistenceConfig,
  type PersistenceAdapter,
  type PersistedState,
  type PersistenceMetadata,
  MemoryStorageAdapter,
  LocalStorageAdapter,
  SessionStorageAdapter,
  IndexedDBAdapter,
  CompressionUtils,
  EncryptionUtils
};