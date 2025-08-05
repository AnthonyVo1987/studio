/**
 * @fileoverview Actor Types for XState-StockSage Integration
 * 
 * Defines interfaces and types for actor lifecycle management,
 * event broadcasting, and multi-ticker state machine coordination.
 */

import type { Actor, ActorRef, AnyMachineSnapshot, EventObject } from 'xstate';
import type { 
  IntegrationEvent, 
  TickerContextHooks,
  IntegrationMetrics 
} from '@/lib/xstate/integration';

/**
 * Supported ticker symbols for StockSage integration
 */
export type SupportedTicker = 'NVDA' | 'SPY';

/**
 * Actor lifecycle states
 */
export type ActorLifecycleState = 
  | 'created'
  | 'starting'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'error';

/**
 * Actor identification and metadata
 */
export interface ActorIdentity {
  /** Unique actor ID */
  id: string;
  /** Ticker symbol this actor manages */
  ticker: SupportedTicker;
  /** Actor type/category */
  type: 'macro-execution' | 'data-fetcher' | 'ai-processor' | 'custom';
  /** Human-readable name */
  name: string;
  /** Actor creation timestamp */
  createdAt: number;
  /** Actor version/iteration */
  version: number;
}

/**
 * Actor configuration
 */
export interface ActorConfig {
  /** Actor identity */
  identity: ActorIdentity;
  /** Context hooks for StockSage integration */
  contextHooks: TickerContextHooks;
  /** Actor-specific options */
  options: {
    /** Enable debug logging */
    enableDebug?: boolean;
    /** Auto-start actor on creation */
    autoStart?: boolean;
    /** Actor timeout in milliseconds */
    timeout?: number;
    /** Max retry attempts */
    maxRetries?: number;
    /** Custom configuration */
    customConfig?: Record<string, any>;
  };
  /** Event handlers */
  eventHandlers?: {
    onStateChange?: (snapshot: AnyMachineSnapshot) => void;
    onError?: (error: Error, context?: any) => void;
    onComplete?: (result: any) => void;
    onCancel?: (reason?: string) => void;
  };
}

/**
 * Actor instance interface
 */
export interface ActorInstance {
  /** Actor identity */
  identity: ActorIdentity;
  /** XState actor reference */
  actorRef: ActorRef<any, any>;
  /** Current lifecycle state */
  lifecycleState: ActorLifecycleState;
  /** Actor configuration */
  config: ActorConfig;
  /** Start timestamp */
  startedAt?: number;
  /** Stop timestamp */
  stoppedAt?: number;
  /** Last error */
  lastError?: Error;
  /** Actor metrics */
  metrics: ActorMetrics;
  /** Subscription cleanup functions */
  subscriptions: (() => void)[];
}

/**
 * Actor metrics and performance data
 */
export interface ActorMetrics {
  /** Total executions */
  totalExecutions: number;
  /** Successful executions */
  successfulExecutions: number;
  /** Failed executions */
  failedExecutions: number;
  /** Average execution time */
  averageExecutionTime: number;
  /** Total uptime in milliseconds */
  totalUptime: number;
  /** Number of restarts */
  restartCount: number;
  /** Last execution duration */
  lastExecutionDuration?: number;
  /** Performance samples for trending */
  performanceSamples: PerformanceSample[];
}

/**
 * Performance sample data point
 */
export interface PerformanceSample {
  /** Sample timestamp */
  timestamp: number;
  /** Execution duration */
  duration: number;
  /** Success status */
  success: boolean;
  /** Memory usage in bytes */
  memoryUsage?: number;
  /** CPU usage percentage */
  cpuUsage?: number;
}

/**
 * Actor registry interface
 */
export interface ActorRegistry {
  /** Register new actor */
  register(actor: ActorInstance): Promise<void>;
  
  /** Unregister actor */
  unregister(actorId: string): Promise<boolean>;
  
  /** Get actor by ID */
  get(actorId: string): ActorInstance | undefined;
  
  /** Get all actors for ticker */
  getByTicker(ticker: SupportedTicker): ActorInstance[];
  
  /** Get all actors by type */
  getByType(type: ActorIdentity['type']): ActorInstance[];
  
  /** Get all actors */
  getAll(): ActorInstance[];
  
  /** Check if actor exists */
  exists(actorId: string): boolean;
  
  /** Get registry metrics */
  getMetrics(): RegistryMetrics;
  
  /** Clear all actors */
  clear(): Promise<void>;
}

/**
 * Registry metrics
 */
export interface RegistryMetrics {
  /** Total registered actors */
  totalActors: number;
  /** Active actors count */
  activeActors: number;
  /** Stopped actors count */
  stoppedActors: number;
  /** Error actors count */
  errorActors: number;
  /** Actors by ticker */
  actorsByTicker: Record<SupportedTicker, number>;
  /** Actors by type */
  actorsByType: Record<string, number>;
  /** Registry uptime */
  uptime: number;
}

/**
 * Actor manager interface
 */
export interface ActorManager {
  /** Create new actor */
  createActor(config: ActorConfig): Promise<ActorInstance>;
  
  /** Start actor */
  startActor(actorId: string): Promise<boolean>;
  
  /** Stop actor */
  stopActor(actorId: string, reason?: string): Promise<boolean>;
  
  /** Restart actor */
  restartActor(actorId: string): Promise<boolean>;
  
  /** Pause actor */
  pauseActor(actorId: string): Promise<boolean>;
  
  /** Resume actor */
  resumeActor(actorId: string): Promise<boolean>;
  
  /** Send event to actor */
  sendEvent(actorId: string, event: EventObject): Promise<boolean>;
  
  /** Get actor status */
  getActorStatus(actorId: string): ActorStatus | undefined;
  
  /** Subscribe to actor events */
  subscribe(
    actorId: string,
    callback: (event: ActorEvent) => void
  ): () => void;
  
  /** Remove actor completely */
  removeActor(actorId: string, reason?: string): Promise<boolean>;
  
  /** Get manager metrics */
  getMetrics(): ManagerMetrics;
  
  /** Cleanup all actors */
  cleanup(): Promise<void>;
}

/**
 * Actor status information
 */
export interface ActorStatus {
  /** Actor identity */
  identity: ActorIdentity;
  /** Current lifecycle state */
  lifecycleState: ActorLifecycleState;
  /** Current machine state */
  machineState: string;
  /** Is actor running */
  isRunning: boolean;
  /** Is actor healthy */
  isHealthy: boolean;
  /** Uptime in milliseconds */
  uptime: number;
  /** Last activity timestamp */
  lastActivity: number;
  /** Current metrics */
  metrics: ActorMetrics;
}

/**
 * Actor events for pub/sub communication
 */
export type ActorEvent =
  | { type: 'ACTOR_CREATED'; actorId: string; identity: ActorIdentity }
  | { type: 'ACTOR_STARTED'; actorId: string; timestamp: number }
  | { type: 'ACTOR_STOPPED'; actorId: string; timestamp: number; reason?: string }
  | { type: 'ACTOR_REMOVED'; actorId: string; reason?: string }
  | { type: 'ACTOR_ERROR'; actorId: string; error: Error; timestamp: number }
  | { type: 'ACTOR_STATE_CHANGED'; actorId: string; newState: string; oldState: string }
  | { type: 'ACTOR_EXECUTION_COMPLETE'; actorId: string; result: any; duration: number }
  | { type: 'ACTOR_METRICS_UPDATED'; actorId: string; metrics: ActorMetrics };

/**
 * Manager metrics
 */
export interface ManagerMetrics {
  /** Registry metrics */
  registry: RegistryMetrics;
  /** Number of active actors */
  activeActors: number;
  /** Total events processed */
  totalEvents: number;
  /** Events per second */
  eventsPerSecond: number;
  /** Average actor lifetime */
  averageActorLifetime: number;
  /** Memory usage */
  memoryUsage: number;
  /** Manager uptime */
  uptime: number;
}

/**
 * Event broadcaster interface
 */
export interface EventBroadcaster {
  /** Broadcast event to all subscribers */
  broadcast(event: ActorEvent | IntegrationEvent): void;
  
  /** Subscribe to events */
  subscribe(
    eventType: ActorEvent['type'] | IntegrationEvent['type'],
    callback: (event: any) => void
  ): () => void;
  
  /** Subscribe to all events */
  subscribeAll(callback: (event: any) => void): () => void;
  
  /** Get subscriber count */
  getSubscriberCount(): number;
  
  /** Clear all subscriptions */
  clearSubscriptions(): void;
}

/**
 * Actor factory interface
 */
export interface ActorFactory {
  /** Create macro execution actor */
  createMacroExecutionActor(
    ticker: SupportedTicker,
    contextHooks: TickerContextHooks,
    options?: Partial<ActorConfig['options']>
  ): Promise<ActorInstance>;
  
  /** Create custom actor */
  createCustomActor(
    machine: any,
    config: ActorConfig
  ): Promise<ActorInstance>;
  
  /** Create actor from configuration */
  createFromConfig(config: ActorConfig): Promise<ActorInstance>;
}

/**
 * Actor coordinator interface for multi-ticker orchestration
 */
export interface ActorCoordinator {
  /** Coordinate multiple actors for workflow execution */
  coordinateWorkflow(
    tickers: SupportedTicker[],
    workflowType: 'parallel' | 'sequential',
    options?: {
      timeout?: number;
      onProgress?: (progress: WorkflowProgress) => void;
      onComplete?: (results: WorkflowResult[]) => void;
      onError?: (error: Error, context?: any) => void;
    }
  ): Promise<WorkflowResult[]>;
  
  /** Synchronize actors across tickers */
  synchronizeActors(actorIds: string[]): Promise<boolean>;
  
  /** Get coordination status */
  getCoordinationStatus(): CoordinationStatus;
}

/**
 * Workflow progress information
 */
export interface WorkflowProgress {
  /** Total steps */
  totalSteps: number;
  /** Completed steps */
  completedSteps: number;
  /** Current step */
  currentStep: number;
  /** Progress percentage */
  percentage: number;
  /** Active actors */
  activeActors: string[];
  /** Completed actors */
  completedActors: string[];
  /** Failed actors */
  failedActors: string[];
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  /** Actor ID */
  actorId: string;
  /** Ticker symbol */
  ticker: SupportedTicker;
  /** Success status */
  success: boolean;
  /** Result data */
  data?: any;
  /** Error information */
  error?: Error;
  /** Execution duration */
  duration: number;
  /** Actor metrics at completion */
  metrics: ActorMetrics;
}

/**
 * Coordination status
 */
export interface CoordinationStatus {
  /** Active coordinated workflows */
  activeWorkflows: number;
  /** Total workflows executed */
  totalWorkflows: number;
  /** Success rate */
  successRate: number;
  /** Average workflow duration */
  averageWorkflowDuration: number;
  /** Current coordinator load */
  currentLoad: number;
}

/**
 * Health check interface for actors
 */
export interface ActorHealthCheck {
  /** Check actor health */
  checkHealth(actorId: string): Promise<HealthStatus>;
  
  /** Check all actors health */
  checkAllHealth(): Promise<Record<string, HealthStatus>>;
  
  /** Subscribe to health changes */
  subscribeToHealthChanges(
    callback: (actorId: string, status: HealthStatus) => void
  ): () => void;
}

/**
 * Health status information
 */
export interface HealthStatus {
  /** Actor ID */
  actorId: string;
  /** Is healthy */
  isHealthy: boolean;
  /** Health score (0-100) */
  healthScore: number;
  /** Last check timestamp */
  lastCheck: number;
  /** Health issues */
  issues: HealthIssue[];
  /** Performance metrics */
  performanceMetrics: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
  };
}

/**
 * Health issue information
 */
export interface HealthIssue {
  /** Issue type */
  type: 'memory' | 'performance' | 'error' | 'timeout' | 'network';
  /** Issue severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Issue message */
  message: string;
  /** Timestamp */
  timestamp: number;
  /** Additional context */
  context?: any;
}