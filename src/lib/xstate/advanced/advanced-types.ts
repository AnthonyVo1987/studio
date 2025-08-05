/**
 * @fileoverview Advanced XState Types for Enterprise-Grade Features
 * 
 * Extended type definitions for advanced XState v5 features including
 * parallel machines, actor spawning, hierarchical composition, and
 * enterprise state management patterns.
 */

import type { 
  Actor, 
  ActorRef, 
  ActorOptions,
  AnyMachineSnapshot, 
  EventObject,
  StateValue,
  MachineContext,
  AnyEventObject
} from 'xstate';
import type { 
  MacroExecutionContext, 
  MacroExecutionEvent
} from '@/lib/xstate/types/macro-types';
import type { ActorInstance, ActorMetrics } from '@/lib/xstate/actors/actor-types';
import type { SupportedTicker } from '@/lib/xstate/types/macro-types';

// ================================
// PARALLEL MACHINE TYPES
// ================================

/**
 * Configuration for parallel ticker operations
 */
export interface ParallelMachineConfig {
  /** Target ticker symbols for parallel execution */
  tickers: SupportedTicker[];
  /** Maximum concurrent executions allowed */
  maxConcurrency: number;
  /** Resource sharing strategy between parallel executions */
  resourceSharing: 'independent' | 'shared' | 'coordinated';
  /** Synchronization points where parallel machines must coordinate */
  synchronizationPoints: string[];
  /** Timeout for parallel execution coordination */
  coordinationTimeout: number;
  /** Enable cross-ticker data sharing */
  enableCrossTickerSharing: boolean;
}

/**
 * Resource pool configuration for managing shared resources
 */
export interface ResourcePoolConfig {
  /** Maximum number of concurrent API requests */
  maxApiRequests: number;
  /** Memory limit in bytes for concurrent operations */
  memoryLimit: number;
  /** Network connection pool size */
  connectionPoolSize: number;
  /** Resource acquisition timeout */
  acquisitionTimeout: number;
  /** Resource cleanup interval */
  cleanupInterval: number;
}

/**
 * Resource type enumeration for simple resource identification
 */
export type ResourceTypeId = 'api' | 'memory' | 'connection' | 'computation';

/**
 * Resource allocation tracking
 */
export interface ResourceAllocation {
  /** Resource identifier */
  resourceId: string;
  /** Resource type */
  resourceType: ResourceTypeId;
  /** Allocated amount */
  allocatedAmount: number;
  /** Maximum available */
  maxAvailable: number;
  /** Current usage */
  currentUsage: number;
  /** Allocation timestamp */
  allocatedAt: number;
  /** Owner actor ID */
  ownerId: string;
}

/**
 * Parallel execution context extending base macro context
 */
export interface ParallelExecutionContext extends MacroExecutionContext {
  /** Parallel configuration */
  parallelConfig: ParallelMachineConfig;
  /** Resource allocations */
  resourceAllocations: Map<string, ResourceAllocation>;
  /** Cross-ticker shared data */
  sharedData: Map<string, any>;
  /** Synchronization state */
  synchronizationState: Map<string, boolean>;
  /** Coordination results */
  coordinationResults: Map<string, any>;
}

// ================================
// ACTOR SPAWNING TYPES
// ================================

/**
 * Actor spawning configuration
 */
export interface ActorSpawningConfig {
  /** Maximum number of spawned actors */
  maxActors: number;
  /** Actor spawning strategy */
  spawnStrategy: 'onDemand' | 'preAllocated' | 'adaptive';
  /** Actor lifecycle management approach */
  lifecycleManagement: 'automatic' | 'manual';
  /** Actor pool warm-up size */
  warmUpSize: number;
  /** Actor idle timeout */
  idleTimeout: number;
  /** Actor restart policy */
  restartPolicy: 'never' | 'onFailure' | 'always';
}

/**
 * Spawned actor metadata
 */
export interface SpawnedActorMetadata {
  /** Spawn ID */
  spawnId: string;
  /** Parent actor ID */
  parentId: string;
  /** Spawn timestamp */
  spawnedAt: number;
  /** Actor purpose/role */
  purpose: string;
  /** Spawn parameters */
  spawnParams: Record<string, any>;
  /** Last activity timestamp */
  lastActivity: number;
  /** Activity count */
  activityCount: number;
}

/**
 * Actor spawning context
 */
export interface ActorSpawningContext {
  /** Spawning configuration */
  config: ActorSpawningConfig;
  /** Currently spawned actors */
  spawnedActors: Map<string, SpawnedActorMetadata>;
  /** Actor pool for pre-allocated actors */
  actorPool: SpawnedActorMetadata[];
  /** Spawning metrics */
  spawnMetrics: SpawnMetrics;
  /** Resource constraints */
  resourceConstraints: ResourcePoolConfig;
}

/**
 * Actor spawning metrics
 */
export interface SpawnMetrics {
  /** Total actors spawned */
  totalSpawned: number;
  /** Currently active spawned actors */
  activeSpawned: number;
  /** Actors destroyed */
  destroyed: number;
  /** Average actor lifetime */
  averageLifetime: number;
  /** Spawn rate per minute */
  spawnRate: number;
  /** Resource utilization */
  resourceUtilization: number;
}

// ================================
// HIERARCHICAL MACHINE TYPES
// ================================

/**
 * Hierarchical machine configuration
 */
export interface HierarchicalMachineConfig {
  /** Parent machine identifier */
  parentMachine: string;
  /** Child machine configurations */
  childMachines: Record<string, HierarchicalChildConfig>;
  /** Event delegation strategy */
  eventDelegation: 'bubble' | 'capture' | 'both';
  /** Context sharing approach */
  contextSharing: 'inherit' | 'isolated' | 'selective';
  /** Selective context properties to share */
  sharedContextProperties?: string[];
  /** Maximum hierarchy depth */
  maxDepth: number;
}

/**
 * Child machine configuration within hierarchy
 */
export interface HierarchicalChildConfig {
  /** Child machine type */
  machineType: string;
  /** Child initialization parameters */
  initParams: Record<string, any>;
  /** Event filters for delegation */
  eventFilters: string[];
  /** Context inheritance rules */
  contextInheritance: ContextInheritanceRule[];
  /** Child priority in hierarchy */
  priority: number;
}

/**
 * Context inheritance rule
 */
export interface ContextInheritanceRule {
  /** Source property path */
  source: string;
  /** Target property path */
  target: string;
  /** Transformation function */
  transform?: (value: any) => any;
  /** Inheritance direction */
  direction: 'parent-to-child' | 'child-to-parent' | 'bidirectional';
}

/**
 * Hierarchical execution context
 */
export interface HierarchicalContext {
  /** Hierarchy configuration */
  hierarchyConfig: HierarchicalMachineConfig;
  /** Current hierarchy level */
  hierarchyLevel: number;
  /** Parent context reference */
  parentContext?: HierarchicalContext;
  /** Child contexts */
  childContexts: Map<string, HierarchicalContext>;
  /** Event delegation state */
  eventDelegation: EventDelegationState;
  /** Shared context store */
  sharedContextStore: Map<string, any>;
}

/**
 * Event delegation state tracking
 */
export interface EventDelegationState {
  /** Events being bubbled up */
  bubblingEvents: Set<string>;
  /** Events being captured down */
  capturingEvents: Set<string>;
  /** Event delegation metrics */
  delegationMetrics: DelegationMetrics;
}

/**
 * Event delegation metrics
 */
export interface DelegationMetrics {
  /** Total events delegated */
  totalDelegated: number;
  /** Events bubbled up */
  bubbledUp: number;
  /** Events captured down */
  capturedDown: number;
  /** Average delegation time */
  averageDelegationTime: number;
}

// ================================
// ADVANCED GUARD TYPES
// ================================

/**
 * Composite guard configuration
 */
export interface CompositeGuard {
  /** Guard composition type */
  type: 'AND' | 'OR' | 'NOT' | 'XOR' | 'IMPLIES';
  /** Sub-conditions to evaluate */
  conditions: GuardCondition[];
  /** Enable dynamic evaluation at runtime */
  dynamicEvaluation: boolean;
  /** Caching strategy for guard results */
  cachingStrategy: 'none' | 'result' | 'evaluation';
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
}

/**
 * Individual guard condition
 */
export interface GuardCondition {
  /** Condition identifier */
  id: string;
  /** Guard function or predicate */
  predicate: (context: any, event: any) => boolean;
  /** Condition weight in composite evaluation */
  weight: number;
  /** Memoization settings */
  memoize: boolean;
  /** Dependencies that invalidate memoization */
  dependencies: string[];
}

/**
 * Guard evaluation result
 */
export interface GuardEvaluationResult {
  /** Final result */
  result: boolean;
  /** Evaluation path taken */
  evaluationPath: string[];
  /** Individual condition results */
  conditionResults: Map<string, boolean>;
  /** Evaluation time in milliseconds */
  evaluationTime: number;
  /** Was result cached */
  fromCache: boolean;
}

// ================================
// STATE PERSISTENCE TYPES
// ================================

/**
 * State persistence configuration
 */
export interface StatePersistenceConfig {
  /** Storage backend type */
  storageType: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'custom';
  /** Custom storage adapter */
  customAdapter?: PersistenceAdapter;
  /** Enable compression for stored state */
  compressionEnabled: boolean;
  /** Enable encryption for sensitive data */
  encryptionEnabled: boolean;
  /** Encryption key for state data */
  encryptionKey?: string;
  /** State migration strategy */
  migrationStrategy: 'auto' | 'manual' | 'versioned';
  /** Version for migration tracking */
  schemaVersion: number;
}

/**
 * Custom persistence adapter interface
 */
export interface PersistenceAdapter {
  /** Save state to storage */
  save(key: string, state: PersistedState): Promise<void>;
  /** Load state from storage */
  load(key: string): Promise<PersistedState | null>;
  /** Delete state from storage */
  delete(key: string): Promise<boolean>;
  /** List all stored state keys */
  list(): Promise<string[]>;
  /** Clear all stored states */
  clear(): Promise<void>;
}

/**
 * Persisted state structure
 */
export interface PersistedState {
  /** State snapshot data */
  snapshot: AnyMachineSnapshot;
  /** Persistence metadata */
  metadata: PersistenceMetadata;
  /** Compressed state data */
  compressedData?: string;
  /** Encrypted state data */
  encryptedData?: string;
  /** State checksum for integrity */
  checksum: string;
}

/**
 * Persistence metadata
 */
export interface PersistenceMetadata {
  /** Persistence timestamp */
  persistedAt: number;
  /** Schema version */
  schemaVersion: number;
  /** Actor ID */
  actorId: string;
  /** Machine type */
  machineType: string;
  /** Persistence reason */
  reason: 'manual' | 'checkpoint' | 'shutdown' | 'error';
  /** Additional metadata */
  custom?: Record<string, any>;
}

// ================================
// MACHINE COMPOSITION TYPES
// ================================

/**
 * Machine composition configuration
 */
export interface MachineCompositionConfig {
  /** Composition strategy */
  strategy: 'sequential' | 'parallel' | 'conditional' | 'pipeline';
  /** Component machines */
  machines: CompositionMachine[];
  /** Data flow configuration */
  dataFlow: DataFlowConfig;
  /** Error handling strategy */
  errorHandling: CompositionErrorHandling;
  /** Performance constraints */
  performanceConstraints: PerformanceConstraints;
}

/**
 * Individual machine in composition
 */
export interface CompositionMachine {
  /** Machine identifier */
  id: string;
  /** Machine factory function */
  factory: () => any;
  /** Input mapping configuration */
  inputMapping: DataMapping[];
  /** Output mapping configuration */
  outputMapping: DataMapping[];
  /** Machine-specific options */
  options: MachineOptions;
  /** Dependencies on other machines */
  dependencies: string[];
}

/**
 * Data mapping configuration
 */
export interface DataMapping {
  /** Source path */
  source: string;
  /** Target path */
  target: string;
  /** Data transformation function */
  transform?: (value: any) => any;
  /** Validation function */
  validate?: (value: any) => boolean;
  /** Required field flag */
  required: boolean;
}

/**
 * Data flow configuration
 */
export interface DataFlowConfig {
  /** Enable data streaming between machines */
  streaming: boolean;
  /** Buffer size for streaming */
  bufferSize: number;
  /** Data validation rules */
  validationRules: ValidationRule[];
  /** Data transformation pipeline */
  transformationPipeline: DataTransform[];
}

/**
 * Validation rule for data flow
 */
export interface ValidationRule {
  /** Rule identifier */
  id: string;
  /** Field path to validate */
  field: string;
  /** Validation function */
  validator: (value: any) => boolean | string;
  /** Error message */
  errorMessage: string;
  /** Rule severity */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Data transformation step
 */
export interface DataTransform {
  /** Transform identifier */
  id: string;
  /** Transform function */
  transform: (data: any) => any;
  /** Transform description */
  description: string;
  /** Transform order */
  order: number;
}

/**
 * Composition error handling configuration
 */
export interface CompositionErrorHandling {
  /** Error propagation strategy */
  propagation: 'stop' | 'continue' | 'retry' | 'compensate';
  /** Retry configuration */
  retryConfig: CompositionRetryConfig;
  /** Compensation strategies */
  compensationStrategies: CompensationStrategy[];
  /** Error recovery timeout */
  recoveryTimeout: number;
}

/**
 * Retry configuration for composition
 */
export interface CompositionRetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Retry delay */
  delay: number;
  /** Backoff strategy */
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  /** Backoff multiplier */
  backoffMultiplier: number;
}

/**
 * Compensation strategy for error recovery
 */
export interface CompensationStrategy {
  /** Strategy identifier */
  id: string;
  /** Trigger conditions */
  triggers: CompensationTrigger[];
  /** Compensation actions */
  actions: CompensationAction[];
  /** Strategy priority */
  priority: number;
}

/**
 * Compensation trigger condition
 */
export interface CompensationTrigger {
  /** Error type to trigger on */
  errorType: string;
  /** Machine state when trigger activates */
  machineState?: string;
  /** Custom trigger predicate */
  predicate?: (error: Error, context: any) => boolean;
}

/**
 * Compensation action
 */
export interface CompensationAction {
  /** Action type */
  type: 'rollback' | 'repair' | 'notify' | 'restart' | 'custom';
  /** Action parameters */
  params: Record<string, any>;
  /** Custom action implementation */
  implementation?: (context: any) => Promise<void>;
}

/**
 * Performance constraints for composition
 */
export interface PerformanceConstraints {
  /** Maximum execution time */
  maxExecutionTime: number;
  /** Memory usage limit */
  memoryLimit: number;
  /** CPU usage limit */
  cpuLimit: number;
  /** Throughput requirements */
  throughputRequirement: number;
  /** Latency requirements */
  latencyRequirement: number;
}

/**
 * Machine options for composition
 */
export interface MachineOptions {
  /** Enable debug mode */
  debug: boolean;
  /** Timeout settings */
  timeout: number;
  /** Resource constraints */
  resources: ResourceConstraints;
  /** Custom configuration */
  custom: Record<string, any>;
}

/**
 * Resource constraints for individual machines
 */
export interface ResourceConstraints {
  /** Memory limit in bytes */
  memory: number;
  /** CPU time limit in milliseconds */
  cpu: number;
  /** Network bandwidth limit */
  bandwidth: number;
  /** Disk I/O limit */
  diskIO: number;
}

// ================================
// RESOURCE MANAGEMENT TYPES
// ================================

/**
 * Resource manager configuration
 */
export interface ResourceManagerConfig {
  /** Resource pool configurations */
  pools: Record<string, ResourcePoolConfig>;
  /** Resource allocation strategy */
  allocationStrategy: 'fair' | 'priority' | 'adaptive';
  /** Enable resource monitoring */
  monitoring: boolean;
  /** Monitoring interval */
  monitoringInterval: number;
  /** Resource cleanup policy */
  cleanupPolicy: ResourceCleanupPolicy;
}

/**
 * Resource cleanup policy
 */
export interface ResourceCleanupPolicy {
  /** Cleanup strategy */
  strategy: 'immediate' | 'deferred' | 'scheduled';
  /** Cleanup interval for scheduled strategy */
  interval?: number;
  /** Resource retention time */
  retentionTime: number;
  /** Force cleanup threshold */
  forceCleanupThreshold: number;
}

/**
 * Resource usage metrics
 */
export interface ResourceUsageMetrics {
  /** Resource type */
  resourceType: string;
  /** Total available */
  totalAvailable: number;
  /** Currently allocated */
  currentlyAllocated: number;
  /** Peak usage */
  peakUsage: number;
  /** Average usage */
  averageUsage: number;
  /** Allocation efficiency */
  allocationEfficiency: number;
  /** Usage history */
  usageHistory: ResourceUsagePoint[];
}

/**
 * Resource usage data point
 */
export interface ResourceUsagePoint {
  /** Timestamp */
  timestamp: number;
  /** Usage amount */
  usage: number;
  /** Allocation count */
  allocations: number;
  /** Active actors */
  activeActors: number;
}

// ================================
// UTILITY TYPES
// ================================

/**
 * Advanced feature configuration union
 */
export type AdvancedFeatureConfig = 
  | ParallelMachineConfig
  | ActorSpawningConfig  
  | HierarchicalMachineConfig
  | StatePersistenceConfig
  | MachineCompositionConfig
  | ResourceManagerConfig;

/**
 * Advanced execution context union
 */
export type AdvancedExecutionContext =
  | ParallelExecutionContext
  | ActorSpawningContext
  | HierarchicalContext;

/**
 * Advanced event types
 */
export type AdvancedEvent = 
  | { type: 'PARALLEL_COORDINATION_REQUIRED'; synchronizationPoint: string }
  | { type: 'ACTOR_SPAWN_REQUESTED'; spawnConfig: ActorSpawningConfig }
  | { type: 'HIERARCHY_EVENT_DELEGATED'; targetLevel: number; event: AnyEventObject }
  | { type: 'STATE_PERSISTENCE_REQUESTED'; reason: PersistenceMetadata['reason'] }
  | { type: 'RESOURCE_ALLOCATION_REQUESTED'; resourceType: string; amount: number }
  | { type: 'COMPOSITION_ERROR_OCCURRED'; machineId: string; error: Error };

/**
 * Advanced machine snapshot extending base snapshot
 */
export interface AdvancedMachineSnapshot {
  /** Base snapshot properties */
  value: StateValue;
  context: any;
  /** Advanced feature state */
  advancedState?: {
    parallel?: ParallelExecutionContext;
    spawning?: ActorSpawningContext;
    hierarchical?: HierarchicalContext;
    persistence?: PersistenceMetadata;
    resources?: ResourceUsageMetrics[];
  };
}

/**
 * Enterprise feature flags
 */
export interface EnterpriseFeatureFlags {
  /** Enable parallel execution */
  enableParallelExecution: boolean;
  /** Enable dynamic actor spawning */
  enableActorSpawning: boolean;
  /** Enable hierarchical machines */
  enableHierarchicalMachines: boolean;
  /** Enable state persistence */
  enableStatePersistence: boolean;
  /** Enable advanced resource management */
  enableResourceManagement: boolean;
  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean;
  /** Enable debug features */
  enableAdvancedDebugging: boolean;
}

// ================================
// ADDITIONAL RESOURCE TYPES (MISSING EXPORTS)
// ================================

/**
 * Resource type definition
 */
export interface ResourceType {
  /** Resource type identifier */
  id: string;
  /** Resource type name */
  name: string;
  /** Resource category */
  category: 'compute' | 'memory' | 'network' | 'storage';
  /** Resource unit */
  unit: string;
  /** Default allocation amount */
  defaultAllocation: number;
}

/**
 * Resource constraint definition
 */
export interface ResourceConstraint {
  /** Resource type */
  resourceType: string;
  /** Minimum required amount */
  minimum: number;
  /** Maximum allowed amount */
  maximum: number;
  /** Preferred amount */
  preferred?: number;
}

/**
 * Resource request
 */
export interface ResourceRequest {
  /** Request ID */
  id: string;
  /** Resource type */
  type: string;
  /** Resource amount */
  amount: number;
  /** Resource constraints */
  constraints: ResourceConstraint[];
  /** Request priority */
  priority: 'low' | 'medium' | 'high' | 'critical' | number;
  /** Request timeout */
  timeout: number;
  /** Requesting actor ID */
  actorId?: string;
  /** Requester actor ID (alternative name for compatibility) */
  requesterActorId: string;
  /** Request timestamp */
  requestedAt: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Resource allocation result
 */
export interface AllocationResult {
  /** Request ID */
  requestId: string;
  /** Allocation status */
  status: 'success' | 'partial' | 'failed';
  /** Success flag for compatibility */
  success: boolean;
  /** Allocated resources */
  allocatedResources: Record<string, number>;
  /** Allocated resource reference */
  allocation?: ResourceAllocation;
  /** Allocation error if failed */
  error?: string;
  /** Allocation timestamp */
  timestamp: Date;
  /** Wait time for allocation */
  waitTime: number;
  /** Queue position if waiting */
  queuePosition?: number;
}

/**
 * Default enterprise feature flags
 */
export const DEFAULT_ENTERPRISE_FEATURES: EnterpriseFeatureFlags = {
  enableParallelExecution: true,
  enableActorSpawning: true,
  enableHierarchicalMachines: true,
  enableStatePersistence: true,
  enableResourceManagement: true,
  enablePerformanceMonitoring: true,
  enableAdvancedDebugging: false
};