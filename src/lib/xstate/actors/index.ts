/**
 * @fileoverview XState Actor Management System - Main Export Module
 * 
 * Provides comprehensive actor lifecycle management, event broadcasting,
 * and coordination for XState-StockSage integration.
 */

// Core actor types
export type {
  ActorLifecycleState,
  ActorIdentity,
  ActorConfig,
  ActorInstance,
  ActorMetrics,
  PerformanceSample,
  ActorRegistry,
  RegistryMetrics,
  ActorManager,
  ActorStatus,
  ActorEvent,
  ManagerMetrics,
  EventBroadcaster,
  ActorFactory,
  ActorCoordinator,
  WorkflowProgress,
  WorkflowResult,
  CoordinationStatus,
  ActorHealthCheck,
  HealthStatus,
  HealthIssue,
} from './actor-types';

// Import types for use in this file
import type {
  ActorManager,
  ActorRegistry,
  ActorInstance,
  ActorConfig,
  ActorEvent,
  SupportedTicker,
} from './actor-types';

// Actor Registry
export {
  StockSageActorRegistry,
  createActorRegistry,
  getGlobalActorRegistry,
  resetGlobalActorRegistry,
} from './actor-registry';

// Actor Manager
export {
  StockSageActorManager,
  createActorManager,
  getGlobalActorManager,
  resetGlobalActorManager,
} from './actor-manager';

// Event Broadcaster
export {
  StockSageEventBroadcaster,
  createEventBroadcaster,
  getGlobalEventBroadcaster,
  resetGlobalEventBroadcaster,
  createTypedSubscription,
  broadcastMultiple,
  createEventFilter,
  EventFilters,
} from './event-broadcaster';

// Re-export integration types for convenience
export type { SupportedTicker, IntegrationEvent } from '@/lib/xstate/integration';

// Import additional types and functions for use in this file
import type { IntegrationEvent, TickerContextHooks } from '@/lib/xstate/integration';
import { 
  getGlobalActorRegistry, 
  createActorRegistry 
} from './actor-registry';
import { 
  getGlobalActorManager, 
  createActorManager 
} from './actor-manager';
import { 
  getGlobalEventBroadcaster, 
  createEventBroadcaster 
} from './event-broadcaster';

/**
 * Complete actor system factory
 * Creates fully configured actor management system
 */
export function createActorSystem(options?: {
  enableDebug?: boolean;
  maxHistorySize?: number;
  globalInstances?: boolean;
}) {
  const useGlobal = options?.globalInstances ?? true;
  
  const registry = useGlobal ? getGlobalActorRegistry() : createActorRegistry();
  const manager = useGlobal ? getGlobalActorManager() : createActorManager();
  const broadcaster = useGlobal ? getGlobalEventBroadcaster() : createEventBroadcaster();

  return {
    registry,
    manager,
    broadcaster,
    
    // Convenience methods
    createActor: (config: any) => manager.createActor(config),
    startActor: (actorId: string) => manager.startActor(actorId),
    stopActor: (id: string, reason?: string) => manager.stopActor(id, reason),
    getActor: (actorId: string) => registry.get(actorId),
    subscribeToEvents: (type: ActorEvent['type'], callback: (event: ActorEvent) => void) => 
      broadcaster.subscribe(type, callback),
    broadcastEvent: (event: ActorEvent | IntegrationEvent) => broadcaster.broadcast(event),
    
    // System-wide operations
    getSystemMetrics: () => ({
      registry: registry.getMetrics(),
      manager: manager.getMetrics(),
      broadcaster: { subscriberCount: broadcaster.getSubscriberCount() },
    }),
    
    cleanup: async () => {
      await manager.cleanup();
      await registry.clear();
      broadcaster.clearSubscriptions();
    },
  };
}

/**
 * Actor factory implementation for common use cases
 */
export class StockSageActorFactory {
  constructor(
    private manager: ActorManager,
    private registry: ActorRegistry
  ) {}

  /**
   * Create macro execution actor for ticker
   */
  async createMacroExecutionActor(
    ticker: any, // SupportedTicker,
    contextHooks: any, // TickerContextHooks,
    options?: {
      autoStart?: boolean;
      timeout?: number;
      maxRetries?: number;
      enableDebug?: boolean;
    }
  ): Promise<any> { // ActorInstance
    const config: any = { // ActorConfig
      identity: {
        id: `macro-${ticker.toLowerCase()}-${Date.now()}`,
        ticker,
        type: 'macro-execution',
        name: `Macro Execution Actor for ${ticker}`,
        createdAt: Date.now(),
        version: 1,
      },
      contextHooks,
      options: {
        autoStart: options?.autoStart ?? true,
        timeout: options?.timeout ?? 45000,
        maxRetries: options?.maxRetries ?? 2,
        enableDebug: options?.enableDebug ?? false,
      },
    };

    return this.manager.createActor(config);
  }

  /**
   * Create multiple actors for different tickers
   */
  async createMultiTickerActors(
    configs: Array<{
      ticker: SupportedTicker;
      contextHooks: TickerContextHooks;
      options?: Parameters<StockSageActorFactory['createMacroExecutionActor']>[2];
    }>
  ): Promise<ActorInstance[]> {
    const createPromises = configs.map(config =>
      this.createMacroExecutionActor(config.ticker, config.contextHooks, config.options)
    );

    return Promise.all(createPromises);
  }

  /**
   * Create actor with custom configuration
   */
  async createCustomActor(
    baseConfig: Partial<ActorConfig>,
    overrides?: {
      machine?: any;
      eventHandlers?: any; // ActorConfig['eventHandlers'];
    }
  ): Promise<ActorInstance> {
    const config: ActorConfig = {
      identity: {
        id: `custom-${Date.now()}`,
        ticker: 'NVDA', // Default
        type: 'custom',
        name: 'Custom Actor',
        createdAt: Date.now(),
        version: 1,
        ...baseConfig.identity,
      },
      contextHooks: baseConfig.contextHooks!,
      options: {
        autoStart: false,
        timeout: 45000,
        maxRetries: 2,
        enableDebug: false,
        ...baseConfig.options,
      },
      eventHandlers: overrides?.eventHandlers || baseConfig.eventHandlers,
    };

    return this.manager.createActor(config);
  }
}

/**
 * Create actor factory
 */
export function createActorFactory(
  manager?: ActorManager,
  registry?: ActorRegistry
): StockSageActorFactory {
  const actorManager = manager || getGlobalActorManager();
  const actorRegistry = registry || getGlobalActorRegistry();
  return new StockSageActorFactory(actorManager, actorRegistry);
}

/**
 * Utility function to create complete setup for a ticker
 */
export async function createTickerActorSetup(
  ticker: SupportedTicker,
  contextHooks: TickerContextHooks,
  options?: {
    autoStart?: boolean;
    enableDebug?: boolean;
    timeout?: number;
    maxRetries?: number;
    eventHandlers?: ActorConfig['eventHandlers'];
  }
) {
  const system = createActorSystem({ enableDebug: options?.enableDebug });
  const factory = createActorFactory(system.manager, system.registry);

  // Create the macro execution actor
  const actor = await factory.createMacroExecutionActor(ticker, contextHooks, {
    autoStart: options?.autoStart ?? true,
    timeout: options?.timeout,
    maxRetries: options?.maxRetries,
    enableDebug: options?.enableDebug,
  });

  // Set up event handlers if provided
  if (options?.eventHandlers) {
    // Subscribe to actor events
    const unsubscribe = system.subscribeToEvents('ACTOR_STATE_CHANGED', (event) => {
      if (event.actorId === actor.identity.id && options.eventHandlers?.onStateChange) {
        const actorInstance = system.getActor(event.actorId);
        if (actorInstance) {
          const snapshot = actorInstance.actorRef.getSnapshot();
          options.eventHandlers.onStateChange(snapshot);
        }
      }
    });

    // Store cleanup function
    actor.subscriptions.push(unsubscribe);
  }

  return {
    system,
    factory,
    actor,
    
    // Convenience methods for this ticker
    executeWorkflow: () => system.manager.sendEvent(actor.identity.id, { type: 'START_MACRO' }),
    pauseWorkflow: () => system.manager.pauseActor(actor.identity.id),
    resumeWorkflow: () => system.manager.resumeActor(actor.identity.id),
    stopWorkflow: (reason?: string) => system.manager.stopActor(actor.identity.id, reason),
    getStatus: () => system.manager.getActorStatus(actor.identity.id),
    subscribeToChanges: (callback: (event: ActorEvent) => void) =>
      system.subscribeToEvents('ACTOR_STATE_CHANGED', callback),
    
    // Cleanup
    cleanup: async () => {
      await system.manager.stopActor(actor.identity.id, 'Ticker setup cleanup');
      await system.cleanup();
    },
  };
}

/**
 * Debug utilities for actor system
 */
export const ActorDebugUtils = {
  /**
   * Get comprehensive system state
   */
  getSystemState(system?: ReturnType<typeof createActorSystem>) {
    const actorSystem = system || createActorSystem();
    const metrics = actorSystem.getSystemMetrics();
    const actors = actorSystem.registry.getAll();
    
    return {
      metrics,
      actors: actors.map((actor: any) => ({
        id: actor.identity.id,
        ticker: actor.identity.ticker,
        type: actor.identity.type,
        state: actor.lifecycleState,
        uptime: actor.startedAt ? Date.now() - actor.startedAt : 0,
        metrics: actor.metrics,
      })),
      subscriptions: actorSystem.broadcaster.getSubscriberCount(),
    };
  },

  /**
   * Log system diagnostics
   */
  logDiagnostics(system?: ReturnType<typeof createActorSystem>) {
    const state = this.getSystemState(system);
    console.group('🎭 Actor System Diagnostics');
    console.log('📊 Registry Metrics:', state.metrics.registry);
    console.log('🎯 Manager Metrics:', state.metrics.manager);
    console.log('📡 Broadcaster Stats:', state.metrics.broadcaster);
    console.log('🎪 Active Actors:', state.actors.filter((a: any) => a.state === 'running'));
    console.log('💾 All Actors:', state.actors);
    console.groupEnd();
  },

  /**
   * Create test event sequence
   */
  createTestEventSequence(system: ReturnType<typeof createActorSystem>, actorId: string) {
    const events = [
      { type: 'START_MACRO' },
      { type: 'PAUSE' },
      { type: 'RESUME' },
      { type: 'STOP' },
    ];

    return events.map((event, index) => ({
      event,
      execute: () => {
        setTimeout(() => {
          system.manager.sendEvent(actorId, event);
        }, index * 1000);
      },
    }));
  },
};

// Re-export key integration types
export type { TickerContextHooks } from '@/lib/xstate/integration';