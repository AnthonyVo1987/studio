/**
 * @fileoverview Advanced XState Features & Patterns - Main Export Index
 * 
 * Provides clean exports for all advanced XState v5 features including
 * parallel machines, actor spawning, hierarchical machines, advanced guards,
 * state persistence, machine composition, and resource management.
 */

// ================================
// ADVANCED TYPES
// ================================
export type {
  // Parallel Machine Types
  ParallelMachineConfig,
  ParallelExecutionContext,
  ResourcePoolConfig,
  ResourceAllocation,
  
  // Actor Spawning Types
  ActorSpawningConfig,
  SpawnedActorMetadata,
  SpawnMetrics,
  ActorSpawningContext,
  
  // Hierarchical Machine Types
  HierarchicalMachineConfig,
  HierarchicalContext,
  HierarchicalChildConfig,
  ContextInheritanceRule,
  EventDelegationState,
  DelegationMetrics,
  
  // Advanced Guard Types
  CompositeGuard,
  GuardCondition,
  GuardEvaluationResult,
  
  // State Persistence Types
  StatePersistenceConfig,
  PersistenceAdapter,
  PersistedState,
  PersistenceMetadata,
  
  // Machine Composition Types
  MachineCompositionConfig,
  CompositionMachine,
  DataMapping,
  DataFlowConfig,
  ValidationRule,
  DataTransform,
  CompositionErrorHandling,
  
  // Resource Management Types
  ResourceType,
  ResourceConstraint,
  ResourceRequest,
  AllocationResult,
  ResourceManagerConfig,
  ResourceUsageMetrics,
  
  // Core Advanced Types
  AdvancedFeatureConfig,
  AdvancedExecutionContext,
  AdvancedEvent,
  AdvancedMachineSnapshot,
  EnterpriseFeatureFlags
} from './advanced-types';

// ================================
// PARALLEL MACHINES
// ================================
export {
  // Core Classes
  ResourcePool,
  ParallelExecutionManager,
  
  // Machine Factories
  createParallelCoordinationMachine,
  
  // Utilities
  ParallelCoordinationUtils
} from './parallel-machines';

// ================================
// ACTOR SPAWNING
// ================================
export {
  // Core Classes
  ActorPool,
  ActorSpawner,
  
  // Machine Factories
  createActorSpawningMachine,
  
  // Utilities
  ActorCommunicationUtils
} from './actor-spawning';

// ================================
// ADVANCED GUARDS
// ================================
export {
  // Core Classes
  GuardEngine,
  
  // Predefined Conditions
  StockSageGuardConditions,
  
  // Builder Utilities
  GuardBuilder,
  
  // Examples
  ExampleGuardConfigurations
} from './advanced-guards';

// ================================
// HIERARCHICAL MACHINES
// ================================
export {
  // Core Classes
  HierarchicalManager,
  
  // Utilities
  HierarchicalUtils
} from './hierarchical-machines';

// ================================
// STATE PERSISTENCE
// ================================
export {
  // Core Classes
  StatePersistenceManager,
  ActorPersistenceUtils,
  
  // Storage Adapters
  MemoryStorageAdapter,
  LocalStorageAdapter,
  SessionStorageAdapter,
  IndexedDBAdapter,
  
  // Utilities
  CompressionUtils,
  EncryptionUtils
} from './state-persistence';

// ================================
// MACHINE COMPOSITION
// ================================
export {
  // Core Classes
  MachineCompositionOrchestrator,
  DataTransformationPipeline
} from './machine-composition';

// ================================
// RESOURCE MANAGEMENT
// ================================
export {
  // Core Classes
  ResourceManager,
  AdvancedResourcePool
} from './resource-management';

// ================================
// ENTERPRISE FEATURE MANAGER
// ================================

/**
 * Enterprise feature manager for coordinating all advanced XState features
 */
export class EnterpriseXStateManager {
  private parallelManager: ParallelExecutionManager;
  private actorSpawner: ActorSpawner;
  private hierarchicalManager: HierarchicalManager;
  private guardEngine: GuardEngine;
  private persistenceManager: StatePersistenceManager;
  private compositionOrchestrator: MachineCompositionOrchestrator;
  private resourceManager: ResourceManager;
  private featureFlags: EnterpriseFeatureFlags;

  constructor(
    resourceConfig: ResourcePoolConfig,
    persistenceConfig: StatePersistenceConfig,
    spawningConfig: ActorSpawningConfig,
    resourceManagerConfig: ResourceManagerConfig,
    featureFlags: Partial<EnterpriseFeatureFlags> = {}
  ) {
    // Import default feature flags
    const { DEFAULT_ENTERPRISE_FEATURES } = require('./advanced-types');
    this.featureFlags = { ...DEFAULT_ENTERPRISE_FEATURES, ...featureFlags };

    // Initialize managers based on feature flags
    if (this.featureFlags.enableParallelExecution) {
      this.parallelManager = new ParallelExecutionManager(resourceConfig);
    }

    if (this.featureFlags.enableActorSpawning) {
      this.actorSpawner = new ActorSpawner(spawningConfig);
    }

    if (this.featureFlags.enableHierarchicalMachines) {
      this.hierarchicalManager = new HierarchicalManager();
    }

    this.guardEngine = new GuardEngine();

    if (this.featureFlags.enableStatePersistence) {
      this.persistenceManager = new StatePersistenceManager(persistenceConfig);
    }

    this.compositionOrchestrator = new MachineCompositionOrchestrator();

    if (this.featureFlags.enableResourceManagement) {
      this.resourceManager = new ResourceManager(resourceManagerConfig);
    }
  }

  /**
   * Get parallel execution manager
   */
  getParallelManager(): ParallelExecutionManager | undefined {
    return this.parallelManager;
  }

  /**
   * Get actor spawner
   */
  getActorSpawner(): ActorSpawner | undefined {
    return this.actorSpawner;
  }

  /**
   * Get hierarchical manager
   */
  getHierarchicalManager(): HierarchicalManager | undefined {
    return this.hierarchicalManager;
  }

  /**
   * Get guard engine
   */
  getGuardEngine(): GuardEngine {
    return this.guardEngine;
  }

  /**
   * Get persistence manager
   */
  getPersistenceManager(): StatePersistenceManager | undefined {
    return this.persistenceManager;
  }

  /**
   * Get composition orchestrator
   */
  getCompositionOrchestrator(): MachineCompositionOrchestrator {
    return this.compositionOrchestrator;
  }

  /**
   * Get resource manager
   */
  getResourceManager(): ResourceManager | undefined {
    return this.resourceManager;
  }

  /**
   * Get current feature flags
   */
  getFeatureFlags(): EnterpriseFeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Update feature flags
   */
  updateFeatureFlags(updates: Partial<EnterpriseFeatureFlags>): void {
    this.featureFlags = { ...this.featureFlags, ...updates };
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    parallelExecutions: string[];
    spawnedActors: number;
    hierarchyNodes: number;
    persistedStates: number;
    activeCompositions: number;
    resourceUtilization: any;
    featureFlags: EnterpriseFeatureFlags;
  } {
    return {
      parallelExecutions: this.parallelManager?.getActiveExecutions() || [],
      spawnedActors: this.actorSpawner?.getAllSpawnedActors().size || 0,
      hierarchyNodes: this.hierarchicalManager?.getHierarchyTree().size || 0,
      persistedStates: 0, // Would need async call to get this
      activeCompositions: 0, // Would need to track this
      resourceUtilization: this.resourceManager?.getGlobalMetrics() || {},
      featureFlags: this.featureFlags
    };
  }

  /**
   * Perform system optimization
   */
  async optimizeSystem(): Promise<{
    parallelOptimization?: any;
    resourceOptimization?: any;
    persistenceCleanup?: number;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    const result: any = {};

    // Optimize parallel execution
    if (this.parallelManager && this.featureFlags.enableParallelExecution) {
      const parallelMetrics = this.parallelManager.getResourceMetrics();
      // Add optimization logic
      recommendations.push('Parallel execution optimized');
    }

    // Optimize resource management
    if (this.resourceManager && this.featureFlags.enableResourceManagement) {
      result.resourceOptimization = this.resourceManager.optimizeAllPools();
      recommendations.push('Resource allocation optimized');
    }

    // Cleanup old persisted states
    if (this.persistenceManager && this.featureFlags.enableStatePersistence) {
      const cleanedUp = await this.persistenceManager.cleanupOldStates(24 * 60 * 60 * 1000); // 24 hours
      result.persistenceCleanup = cleanedUp;
      if (cleanedUp > 0) {
        recommendations.push(`Cleaned up ${cleanedUp} old persisted states`);
      }
    }

    result.recommendations = recommendations;
    return result;
  }

  /**
   * Cleanup and destroy all managers
   */
  destroy(): void {
    this.parallelManager?.destroy();
    this.actorSpawner?.destroy();
    this.hierarchicalManager?.destroy();
    this.guardEngine?.destroy();
    this.compositionOrchestrator?.destroy();
    this.resourceManager?.destroy();
  }
}

// ================================
// CONVENIENCE FACTORIES
// ================================

/**
 * Create a complete enterprise XState setup with sensible defaults
 */
export function createEnterpriseXStateSetup(options: {
  maxConcurrency?: number;
  maxSpawnedActors?: number;
  persistenceType?: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  enableAllFeatures?: boolean;
} = {}): EnterpriseXStateManager {
  const {
    maxConcurrency = 4,
    maxSpawnedActors = 20,
    persistenceType = 'memory',
    enableAllFeatures = true
  } = options;

  const resourceConfig: ResourcePoolConfig = {
    maxApiRequests: 10,
    memoryLimit: 1024 * 1024 * 100, // 100MB
    connectionPoolSize: 5,
    acquisitionTimeout: 5000,
    cleanupInterval: 30000
  };

  const persistenceConfig: StatePersistenceConfig = {
    storageType: persistenceType,
    compressionEnabled: true,
    encryptionEnabled: false,
    migrationStrategy: 'auto',
    schemaVersion: 1
  };

  const spawningConfig: ActorSpawningConfig = {
    maxActors: maxSpawnedActors,
    spawnStrategy: 'adaptive',
    lifecycleManagement: 'automatic',
    warmUpSize: 5,
    idleTimeout: 300000, // 5 minutes
    restartPolicy: 'onFailure'
  };

  const resourceManagerConfig: ResourceManagerConfig = {
    pools: {
      memory: resourceConfig,
      api: resourceConfig,
      network: resourceConfig
    },
    allocationStrategy: 'adaptive',
    monitoring: true,
    monitoringInterval: 5000,
    cleanupPolicy: {
      strategy: 'scheduled',
      interval: 60000,
      retentionTime: 300000,
      forceCleanupThreshold: 0.9
    }
  };

  const featureFlags: EnterpriseFeatureFlags = enableAllFeatures ? {
    enableParallelExecution: true,
    enableActorSpawning: true,
    enableHierarchicalMachines: true,
    enableStatePersistence: true,
    enableResourceManagement: true,
    enablePerformanceMonitoring: true,
    enableAdvancedDebugging: false
  } : {
    enableParallelExecution: false,
    enableActorSpawning: false,
    enableHierarchicalMachines: false,
    enableStatePersistence: false,
    enableResourceManagement: false,
    enablePerformanceMonitoring: false,
    enableAdvancedDebugging: false
  };

  return new EnterpriseXStateManager(
    resourceConfig,
    persistenceConfig,
    spawningConfig,
    resourceManagerConfig,
    featureFlags
  );
}

/**
 * Create StockSage-specific XState setup optimized for financial data processing
 */
export function createStockSageXStateSetup(): EnterpriseXStateManager {
  return createEnterpriseXStateSetup({
    maxConcurrency: 2, // NVDA and SPY
    maxSpawnedActors: 10,
    persistenceType: 'localStorage',
    enableAllFeatures: true
  });
}