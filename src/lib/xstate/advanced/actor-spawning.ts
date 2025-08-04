/**
 * @fileoverview Dynamic Actor Spawning System for Runtime Ticker Management
 * 
 * Provides sophisticated actor lifecycle management with dynamic spawning,
 * pool management, parent-child communication, and resource optimization.
 */

import {
  createMachine,
  createActor,
  assign,
  sendTo,
  raise,
  type ActorRef,
  type AnyMachineSnapshot
} from 'xstate';
import type {
  ActorSpawningConfig,
  ActorSpawningContext,
  SpawnedActorMetadata,
  SpawnMetrics,
  AdvancedEvent
} from './advanced-types';
import type { 
  MacroExecutionContext,
  MacroExecutionEvent 
} from '@/lib/xstate/types/macro-types';
import type { ActorInstance, ActorConfig, SupportedTicker } from '@/lib/xstate/actors/actor-types';
import { createMacroExecutionMachine } from '@/lib/xstate/machines/macro-execution-machine';

// ================================
// ACTOR POOL MANAGER
// ================================

/**
 * Pool manager for pre-allocated actors to improve spawn performance
 */
export class ActorPool {
  private pool: Map<string, ActorRef<any, any>[]> = new Map();
  private activeActors: Map<string, ActorRef<any, any>> = new Map();
  private config: ActorSpawningConfig;
  private metrics: SpawnMetrics;

  constructor(config: ActorSpawningConfig) {
    this.config = config;
    this.metrics = {
      totalSpawned: 0,
      activeSpawned: 0,
      destroyed: 0,
      averageLifetime: 0,
      spawnRate: 0,
      resourceUtilization: 0
    };
    
    if (config.spawnStrategy === 'preAllocated') {
      this.preAllocateActors();
    }
  }

  /**
   * Pre-allocate actors for improved performance
   */
  private preAllocateActors(): void {
    const actorTypes = ['macro-execution', 'data-fetcher', 'ai-processor'];
    
    actorTypes.forEach(actorType => {
      const actors: ActorRef<any, any>[] = [];
      
      for (let i = 0; i < this.config.warmUpSize; i++) {
        const actor = this.createPooledActor(actorType);
        actors.push(actor);
      }
      
      this.pool.set(actorType, actors);
    });
  }

  /**
   * Create a pooled actor instance
   */
  private createPooledActor(actorType: string): ActorRef<any, any> {
    // Create base machine based on actor type
    let machine;
    
    switch (actorType) {
      case 'macro-execution':
        machine = createMacroExecutionMachine();
        break;
      case 'data-fetcher':
        machine = this.createDataFetcherMachine();
        break;
      case 'ai-processor':
        machine = this.createAIProcessorMachine();
        break;
      default:
        machine = createMacroExecutionMachine();
    }

    return createActor(machine);
  }

  /**
   * Acquire actor from pool or create new one
   */
  acquireActor(
    actorType: string,
    spawnParams: Record<string, any> = {}
  ): { actor: ActorRef<any, any>; fromPool: boolean } {
    const poolActors = this.pool.get(actorType);
    
    if (poolActors && poolActors.length > 0) {
      const actor = poolActors.pop()!;
      const actorId = `${actorType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      this.activeActors.set(actorId, actor);
      this.metrics.activeSpawned++;
      
      // Initialize actor with spawn params
      if (spawnParams.ticker) {
        actor.send({ type: 'INITIALIZE_TICKER', ticker: spawnParams.ticker });
      }
      
      return { actor, fromPool: true };
    }

    // Create new actor if pool is empty or doesn't exist
    const actor = this.createPooledActor(actorType);
    const actorId = `${actorType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeActors.set(actorId, actor);
    this.metrics.totalSpawned++;
    this.metrics.activeSpawned++;
    
    return { actor, fromPool: false };
  }

  /**
   * Return actor to pool or destroy it
   */
  releaseActor(actorId: string, actor: ActorRef<any, any>): void {
    this.activeActors.delete(actorId);
    this.metrics.activeSpawned--;
    
    // Check if we should return to pool or destroy
    const actorType = this.getActorType(actor);
    const poolActors = this.pool.get(actorType) || [];
    
    if (poolActors.length < this.config.warmUpSize) {
      // Reset actor state and return to pool
      actor.send({ type: 'RESET' });
      poolActors.push(actor);
      this.pool.set(actorType, poolActors);
    } else {
      // Pool is full, destroy actor
      actor.stop();
      this.metrics.destroyed++;
    }
  }

  /**
   * Get actor type from actor reference
   */
  private getActorType(actor: ActorRef<any, any>): string {
    // This would need to be implemented based on how actors store their type
    return 'macro-execution'; // Default fallback
  }

  /**
   * Create data fetcher machine
   */
  private createDataFetcherMachine() {
    return createMachine({
      id: 'dataFetcher',
      initial: 'idle',
      context: {
        ticker: undefined,
        data: undefined,
        error: undefined
      },
      states: {
        idle: {
          on: {
            FETCH_DATA: 'fetching',
            INITIALIZE_TICKER: {
              actions: assign({ ticker: ({ event }) => (event as any).ticker })
            },
            RESET: {
              actions: assign({ ticker: undefined, data: undefined, error: undefined })
            }
          }
        },
        fetching: {
          on: {
            FETCH_COMPLETE: {
              target: 'idle',
              actions: assign({ data: ({ event }) => (event as any).data })
            },
            FETCH_ERROR: {
              target: 'idle',
              actions: assign({ error: ({ event }) => (event as any).error })
            }
          }
        }
      }
    });
  }

  /**
   * Create AI processor machine
   */
  private createAIProcessorMachine() {
    return createMachine({
      id: 'aiProcessor',
      initial: 'idle',
      context: {
        ticker: undefined,
        result: undefined,
        error: undefined
      },
      states: {
        idle: {
          on: {
            PROCESS_AI: 'processing',
            INITIALIZE_TICKER: {
              actions: assign({ ticker: ({ event }) => (event as any).ticker })
            },
            RESET: {
              actions: assign({ ticker: undefined, result: undefined, error: undefined })
            }
          }
        },
        processing: {
          on: {
            PROCESS_COMPLETE: {
              target: 'idle',
              actions: assign({ result: ({ event }) => (event as any).result })
            },
            PROCESS_ERROR: {
              target: 'idle',
              actions: assign({ error: ({ event }) => (event as any).error })
            }
          }
        }
      }
    });
  }

  /**
   * Get current pool metrics
   */
  getMetrics(): SpawnMetrics {
    return { ...this.metrics };
  }

  /**
   * Get pool status
   */
  getPoolStatus(): Record<string, { pooled: number; active: number }> {
    const status: Record<string, { pooled: number; active: number }> = {};
    
    for (const [actorType, actors] of this.pool.entries()) {
      status[actorType] = {
        pooled: actors.length,
        active: Array.from(this.activeActors.values()).filter(
          actor => this.getActorType(actor) === actorType
        ).length
      };
    }
    
    return status;
  }

  /**
   * Cleanup all pool resources
   */
  destroy(): void {
    // Stop all pooled actors
    for (const actors of this.pool.values()) {
      actors.forEach(actor => actor.stop());
    }
    this.pool.clear();
    
    // Stop all active actors
    for (const actor of this.activeActors.values()) {
      actor.stop();
    }
    this.activeActors.clear();
  }
}

// ================================
// ACTOR SPAWNING MACHINE
// ================================

/**
 * Create actor spawning management machine
 */
export function createActorSpawningMachine(config: ActorSpawningConfig) {
  return createMachine({
    id: 'actorSpawning',
    types: {} as {
      context: ActorSpawningContext;
      events: MacroExecutionEvent | AdvancedEvent | { type: 'SPAWN_ACTOR'; actorType: string; spawnParams: Record<string, any> } | { type: 'INITIALIZATION_COMPLETE' } | { type: 'INITIALIZATION_FAILED' } | { type: 'DESTROY_ACTOR'; actorId: string } | { type: 'CLEANUP_IDLE_ACTORS' } | { type: 'RETRY' } | { type: 'RESET' };
    },
    context: {
      config,
      spawnedActors: new Map(),
      actorPool: [],
      spawnMetrics: {
        totalSpawned: 0,
        activeSpawned: 0,
        destroyed: 0,
        averageLifetime: 0,
        spawnRate: 0,
        resourceUtilization: 0
      },
      resourceConstraints: {
        maxApiRequests: 10,
        memoryLimit: 1024 * 1024 * 100, // 100MB
        connectionPoolSize: 5,
        acquisitionTimeout: 5000,
        cleanupInterval: 30000
      }
    },
    initial: 'initializing',
    states: {
      initializing: {
        entry: 'initializeActorPool',
        on: {
          INITIALIZATION_COMPLETE: 'ready',
          INITIALIZATION_FAILED: 'error'
        }
      },
      
      ready: {
        on: {
          SPAWN_ACTOR: {
            target: 'spawning',
            actions: assign({
              spawnMetrics: ({ context }) => ({
                ...context.spawnMetrics,
                totalSpawned: context.spawnMetrics.totalSpawned + 1
              })
            })
          },
          DESTROY_ACTOR: {
            actions: 'destroyActor'
          },
          CLEANUP_IDLE_ACTORS: {
            actions: 'cleanupIdleActors'
          }
        }
      },
      
      spawning: {
        invoke: {
          src: 'spawnActorService',
          onDone: {
            target: 'ready',
            actions: 'recordSpawnedActor'
          },
          onError: {
            target: 'ready',
            actions: 'handleSpawnError'
          }
        }
      },
      
      error: {
        on: {
          RETRY: 'initializing',
          RESET: 'initializing'
        }
      }
    }
  }, {
    actions: {
      initializeActorPool: ({ context }) => {
        console.log('Initializing actor pool with config:', context.config);
      },
      
      recordSpawnedActor: assign({
        spawnedActors: ({ context, event }: { context: ActorSpawningContext; event: any }) => {
          const newSpawnedActors = new Map(context.spawnedActors);
          if (event.output && event.output.metadata) {
            newSpawnedActors.set(event.output.metadata.spawnId, event.output.metadata);
          }
          return newSpawnedActors;
        },
        spawnMetrics: ({ context }: { context: ActorSpawningContext; event: any }) => ({
          ...context.spawnMetrics,
          activeSpawned: context.spawnMetrics.activeSpawned + 1
        })
      }),
      
      destroyActor: assign({
        spawnedActors: ({ context, event }: { context: ActorSpawningContext; event: any }) => {
          const newSpawnedActors = new Map(context.spawnedActors);
          if ('actorId' in event) {
            newSpawnedActors.delete(event.actorId as string);
          }
          return newSpawnedActors;
        },
        spawnMetrics: ({ context }: { context: ActorSpawningContext; event: any }) => ({
          ...context.spawnMetrics,
          activeSpawned: Math.max(0, context.spawnMetrics.activeSpawned - 1),
          destroyed: context.spawnMetrics.destroyed + 1
        })
      }),
      
      cleanupIdleActors: ({ context }) => {
        const now = Date.now();
        const idleThreshold = context.config.idleTimeout;
        
        for (const [spawnId, metadata] of context.spawnedActors.entries()) {
          if (now - metadata.lastActivity > idleThreshold) {
            console.log(`Cleaning up idle actor: ${spawnId}`);
          }
        }
      },
      
      handleSpawnError: ({ event }) => {
        console.error('Actor spawn failed:', event.error);
      }
    },
    
    actors: {
      spawnActorService: async ({ context, event }: { context: ActorSpawningContext; event: any }) => {
        if (event.type !== 'SPAWN_ACTOR') {
          throw new Error('Invalid event for spawn service');
        }
        
        // Check if we can spawn more actors
        if (context.spawnedActors.size >= context.config.maxActors) {
          throw new Error('Maximum actor limit reached');
        }
        
        const spawnId = `${event.actorType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const metadata: SpawnedActorMetadata = {
          spawnId,
          parentId: 'spawning-manager',
          spawnedAt: Date.now(),
          purpose: event.actorType,
          spawnParams: event.spawnParams,
          lastActivity: Date.now(),
          activityCount: 0
        };
        
        // Create the actual actor based on type
        let actor: ActorRef<any, any>;
        
        switch (event.actorType) {
          case 'macro-execution':
            const macroMachine = createMacroExecutionMachine();
            actor = createActor(macroMachine);
            if (event.spawnParams.ticker) {
              actor.send({ type: 'START_EXECUTION', ticker: event.spawnParams.ticker });
            }
            break;
          default:
            throw new Error(`Unknown actor type: ${event.actorType}`);
        }
        
        actor.start();
        
        return {
          actor,
          metadata
        };
      }
    }
  });
}

// ================================
// ACTOR SPAWNER CLASS
// ================================

/**
 * High-level actor spawning manager with lifecycle control
 */
export class ActorSpawner {
  private spawningMachine: ActorRef<any, any>;
  private actorPool: ActorPool;
  private parentChildMap: Map<string, Set<string>> = new Map();
  private communicationChannels: Map<string, ActorRef<any, any>> = new Map();

  constructor(config: ActorSpawningConfig) {
    this.spawningMachine = createActor(createActorSpawningMachine(config));
    this.actorPool = new ActorPool(config);
    
    this.spawningMachine.start();
  }

  /**
   * Spawn new actor with specific configuration
   */
  async spawnActor(
    actorType: string,
    spawnParams: Record<string, any> = {},
    parentId?: string
  ): Promise<{ actor: ActorRef<any, any>; spawnId: string }> {
    
    // Use pool for efficient actor creation
    const { actor, fromPool } = this.actorPool.acquireActor(actorType, spawnParams);
    
    const spawnId = `${actorType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Track parent-child relationship
    if (parentId) {
      if (!this.parentChildMap.has(parentId)) {
        this.parentChildMap.set(parentId, new Set());
      }
      this.parentChildMap.get(parentId)!.add(spawnId);
    }
    
    // Establish communication channel
    this.communicationChannels.set(spawnId, actor);
    
    // Start the actor
    actor.start();
    
    // Notify spawning machine
    this.spawningMachine.send({
      type: 'SPAWN_ACTOR',
      actorType,
      spawnParams: { ...spawnParams, spawnId, fromPool }
    });
    
    return { actor, spawnId };
  }

  /**
   * Destroy spawned actor and cleanup resources
   */
  async destroyActor(spawnId: string): Promise<boolean> {
    const actor = this.communicationChannels.get(spawnId);
    if (!actor) {
      return false;
    }
    
    // Stop the actor
    actor.stop();
    
    // Remove from communication channels
    this.communicationChannels.delete(spawnId);
    
    // Return to pool or destroy
    this.actorPool.releaseActor(spawnId, actor);
    
    // Cleanup parent-child relationships
    for (const [parentId, children] of this.parentChildMap.entries()) {
      children.delete(spawnId);
      if (children.size === 0) {
        this.parentChildMap.delete(parentId);
      }
    }
    
    // Also destroy any child actors
    const children = this.parentChildMap.get(spawnId);
    if (children) {
      for (const childId of children) {
        await this.destroyActor(childId);
      }
    }
    
    // Notify spawning machine
    this.spawningMachine.send({ type: 'DESTROY_ACTOR', actorId: spawnId });
    
    return true;
  }

  /**
   * Send message to spawned actor
   */
  sendToActor(spawnId: string, event: any): boolean {
    const actor = this.communicationChannels.get(spawnId);
    if (!actor) {
      return false;
    }
    
    actor.send(event);
    return true;
  }

  /**
   * Broadcast message to all child actors of a parent
   */
  broadcastToChildren(parentId: string, event: any): number {
    const children = this.parentChildMap.get(parentId);
    if (!children) {
      return 0;
    }
    
    let sentCount = 0;
    for (const childId of children) {
      if (this.sendToActor(childId, event)) {
        sentCount++;
      }
    }
    
    return sentCount;
  }

  /**
   * Get actor status by spawn ID
   */
  getActorStatus(spawnId: string): { actor: ActorRef<any, any>; state: any } | null {
    const actor = this.communicationChannels.get(spawnId);
    if (!actor) {
      return null;
    }
    
    return {
      actor,
      state: actor.getSnapshot()
    };
  }

  /**
   * Get all spawned actors
   */
  getAllSpawnedActors(): Map<string, ActorRef<any, any>> {
    return new Map(this.communicationChannels);
  }

  /**
   * Get child actors for a parent
   */
  getChildActors(parentId: string): string[] {
    const children = this.parentChildMap.get(parentId);
    return children ? Array.from(children) : [];
  }

  /**
   * Get spawning metrics
   */
  getSpawningMetrics(): SpawnMetrics {
    return this.actorPool.getMetrics();
  }

  /**
   * Cleanup idle actors
   */
  cleanupIdleActors(): void {
    this.spawningMachine.send({ type: 'CLEANUP_IDLE_ACTORS' });
  }

  /**
   * Destroy all resources
   */
  destroy(): void {
    // Stop all actors
    for (const actor of this.communicationChannels.values()) {
      actor.stop();
    }
    
    // Cleanup data structures
    this.communicationChannels.clear();
    this.parentChildMap.clear();
    
    // Cleanup pool and machine
    this.actorPool.destroy();
    this.spawningMachine.stop();
  }
}

// ================================
// COMMUNICATION UTILITIES
// ================================

/**
 * Utilities for parent-child actor communication
 */
export const ActorCommunicationUtils = {
  /**
   * Create message envelope for actor communication
   */
  createMessage(
    from: string,
    to: string,
    type: string,
    payload: any = {},
    requestId?: string
  ): any {
    return {
      type,
      from,
      to,
      payload,
      requestId: requestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
  },

  /**
   * Create response message
   */
  createResponse(
    originalMessage: any,
    responsePayload: any,
    success: boolean = true
  ): any {
    return {
      type: 'RESPONSE',
      from: originalMessage.to,
      to: originalMessage.from,
      payload: responsePayload,
      requestId: originalMessage.requestId,
      success,
      timestamp: Date.now()
    };
  },

  /**
   * Create broadcast message for multiple recipients
   */
  createBroadcast(
    from: string,
    recipients: string[],
    type: string,
    payload: any = {}
  ): any[] {
    return recipients.map(recipient => ({
      type,
      from,
      to: recipient,
      payload,
      timestamp: Date.now(),
      broadcast: true
    }));
  }
};

// ================================
// EXPORTS
// ================================

export {
  type ActorSpawningConfig,
  type SpawnedActorMetadata,
  type SpawnMetrics,
  type ActorSpawningContext
};