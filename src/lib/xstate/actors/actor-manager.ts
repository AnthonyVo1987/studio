/**
 * @fileoverview Actor Manager for XState-StockSage Integration
 * 
 * Manages actor lifecycle, event handling, and coordination between
 * XState machines and StockSage contexts. Provides centralized control.
 */

import type { ActorRef } from 'xstate';
import { createActor } from 'xstate';
import type {
  ActorManager,
  ActorInstance,
  ActorConfig,
  ActorStatus,
  ActorEvent,
  ManagerMetrics,
  ActorLifecycleState,
  SupportedTicker,
} from './actor-types';
import type { TickerContextHooks } from '@/lib/xstate/integration';
import { createActorRegistry, getGlobalActorRegistry } from './actor-registry';
import { createEventBroadcaster } from './event-broadcaster';
import { createTickerLogger } from '@/lib/ticker-logger';

/**
 * Actor Manager Implementation
 * Coordinates actor lifecycle and provides centralized management
 */
export class StockSageActorManager implements ActorManager {
  private registry = getGlobalActorRegistry();
  private broadcaster = createEventBroadcaster();
  private logger = createTickerLogger('SYSTEM', 'ACTOR_MANAGER');
  private createdAt = Date.now();
  private eventCount = 0;
  private lastEventTime = Date.now();

  constructor() {
    this.logger.state('ActorManager', 'Manager initialized', {
      timestamp: this.createdAt,
    });
  }

  /**
   * Create new actor
   */
  async createActor(config: ActorConfig): Promise<ActorInstance> {
    try {
      const { identity, contextHooks, options, eventHandlers } = config;
      
      this.logger.state('CreateActor', `Creating actor: ${identity.id}`, {
        actorId: identity.id,
        ticker: identity.ticker,
        type: identity.type,
      });

      // Create appropriate machine based on actor type
      const machine = this.createMachineForType(identity.type, identity.ticker, contextHooks, options);
      
      // Create XState actor
      const actorRef = createActor(machine, {
        input: {
          ticker: identity.ticker,
          ...options.customConfig,
        },
      });

      // Create actor instance
      const actorInstance: ActorInstance = {
        identity,
        actorRef,
        lifecycleState: 'created',
        config,
        metrics: this.initializeActorMetrics(),
        subscriptions: [],
      };

      // Set up event handlers
      this.setupEventHandlers(actorInstance, eventHandlers);

      // Register the actor
      await this.registry.register(actorInstance);

      // Broadcast creation event
      this.broadcastEvent({
        type: 'ACTOR_CREATED',
        actorId: identity.id,
        identity,
      });

      // Auto-start if configured
      if (options.autoStart) {
        await this.startActor(identity.id);
      }

      this.logger.state('CreateActor', `Actor created successfully: ${identity.id}`);
      return actorInstance;

    } catch (error) {
      this.logger.error('CreateActor', 'Failed to create actor', {
        actorId: config.identity.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Start actor
   */
  async startActor(actorId: string): Promise<boolean> {
    try {
      const actor = this.registry.get(actorId);
      if (!actor) {
        this.logger.error('StartActor', `Actor not found: ${actorId}`);
        return false;
      }

      if (actor.lifecycleState === 'running') {
        this.logger.warn('StartActor', `Actor already running: ${actorId}`);
        return true;
      }

      this.logger.info('StartActor', `Starting actor: ${actorId}`);

      // Start the XState actor
      actor.actorRef.start();
      actor.lifecycleState = 'starting';
      actor.startedAt = Date.now();

      // Set up monitoring
      this.setupActorMonitoring(actor);

      // Update lifecycle state after successful start
      actor.lifecycleState = 'running';

      // Broadcast start event
      this.broadcastEvent({
        type: 'ACTOR_STARTED',
        actorId,
        timestamp: Date.now(),
      });

      this.logger.info('StartActor', `Actor started successfully: ${actorId}`);
      return true;

    } catch (error) {
      this.logger.error('StartActor', 'Failed to start actor', {
        actorId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Stop actor
   */
  async stopActor(actorId: string, reason?: string): Promise<boolean> {
    try {
      const actor = this.registry.get(actorId);
      if (!actor) {
        this.logger.error('StopActor', `Actor not found: ${actorId}`);
        return false;
      }

      if (actor.lifecycleState === 'stopped') {
        this.logger.warn('StopActor', `Actor already stopped: ${actorId}`);
        return true;
      }

      this.logger.info('StopActor', `Stopping actor: ${actorId}`, {
        reason: reason || 'Manual stop',
      });

      // Update lifecycle state
      actor.lifecycleState = 'stopping';

      // Stop the XState actor
      actor.actorRef.stop();
      actor.stoppedAt = Date.now();
      actor.lifecycleState = 'stopped';

      // Update metrics
      if (actor.startedAt) {
        const uptime = actor.stoppedAt - actor.startedAt;
        actor.metrics.totalUptime += uptime;
      }

      // Broadcast stop event
      this.broadcastEvent({
        type: 'ACTOR_STOPPED',
        actorId,
        timestamp: Date.now(),
        reason,
      });

      this.logger.info('StopActor', `Actor stopped successfully: ${actorId}`);
      return true;

    } catch (error) {
      this.logger.error('StopActor', 'Failed to stop actor', {
        actorId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Restart actor
   */
  async restartActor(actorId: string): Promise<boolean> {
    try {
      const actor = this.registry.get(actorId);
      if (!actor) {
        this.logger.error('RestartActor', `Actor not found: ${actorId}`);
        return false;
      }

      this.logger.info('RestartActor', `Restarting actor: ${actorId}`);

      // Stop the actor first
      const stopped = await this.stopActor(actorId, 'Restart');
      if (!stopped) {
        return false;
      }

      // Wait a brief moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start the actor again
      const started = await this.startActor(actorId);
      
      if (started) {
        actor.metrics.restartCount++;
        this.logger.info('RestartActor', `Actor restarted successfully: ${actorId}`);
      }

      return started;

    } catch (error) {
      this.logger.error('RestartActor', 'Failed to restart actor', {
        actorId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Pause actor
   */
  async pauseActor(actorId: string): Promise<boolean> {
    try {
      const actor = this.registry.get(actorId);
      if (!actor) {
        this.logger.error('PauseActor', `Actor not found: ${actorId}`);
        return false;
      }

      if (actor.lifecycleState !== 'running') {
        this.logger.warn('PauseActor', `Actor not running: ${actorId}`, {
          currentState: actor.lifecycleState,
        });
        return false;
      }

      // Send pause event to the machine
      actor.actorRef.send({ type: 'PAUSE' });
      actor.lifecycleState = 'paused';

      this.logger.info('PauseActor', `Actor paused: ${actorId}`);
      return true;

    } catch (error) {
      this.logger.error('PauseActor', 'Failed to pause actor', {
        actorId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Resume actor
   */
  async resumeActor(actorId: string): Promise<boolean> {
    try {
      const actor = this.registry.get(actorId);
      if (!actor) {
        this.logger.error('ResumeActor', `Actor not found: ${actorId}`);
        return false;
      }

      if (actor.lifecycleState !== 'paused') {
        this.logger.warn('ResumeActor', `Actor not paused: ${actorId}`, {
          currentState: actor.lifecycleState,
        });
        return false;
      }

      // Send resume event to the machine
      actor.actorRef.send({ type: 'RESUME' });
      actor.lifecycleState = 'running';

      this.logger.info('ResumeActor', `Actor resumed: ${actorId}`);
      return true;

    } catch (error) {
      this.logger.error('ResumeActor', 'Failed to resume actor', {
        actorId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Send event to actor
   */
  async sendEvent(actorId: string, event: any): Promise<boolean> {
    try {
      const actor = this.registry.get(actorId);
      if (!actor) {
        this.logger.error('SendEvent', `Actor not found: ${actorId}`);
        return false;
      }

      if (actor.lifecycleState !== 'running') {
        this.logger.warn('SendEvent', `Actor not running: ${actorId}`, {
          currentState: actor.lifecycleState,
          eventType: event.type,
        });
        return false;
      }

      // Send event to the machine
      actor.actorRef.send(event);

      this.logger.debug('SendEvent', `Event sent to actor: ${actorId}`, {
        eventType: event.type,
      });

      return true;

    } catch (error) {
      this.logger.error('SendEvent', 'Failed to send event to actor', {
        actorId,
        eventType: event.type,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get actor status
   */
  getActorStatus(actorId: string): ActorStatus | undefined {
    const actor = this.registry.get(actorId);
    if (!actor) {
      return undefined;
    }

    const currentSnapshot = actor.actorRef.getSnapshot();
    const uptime = actor.startedAt ? Date.now() - actor.startedAt : 0;
    const lastActivity = actor.startedAt || actor.identity.createdAt;

    return {
      identity: actor.identity,
      lifecycleState: actor.lifecycleState,
      machineState: this.getMachineStateString(currentSnapshot),
      isRunning: actor.lifecycleState === 'running',
      isHealthy: this.isActorHealthy(actor),
      uptime,
      lastActivity,
      metrics: actor.metrics,
    };
  }

  /**
   * Subscribe to actor events
   */
  subscribe(
    actorId: string,
    callback: (event: ActorEvent) => void
  ): () => void {
    // Subscribe to all events and filter by actorId
    return this.broadcaster.subscribeAll((event: ActorEvent) => {
      if ('actorId' in event && event.actorId === actorId) {
        callback(event);
      }
    });
  }

  /**
   * Remove actor completely
   */
  async removeActor(actorId: string, reason = 'Requested removal'): Promise<boolean> {
    try {
      this.logger.state('RemoveActor', `Removing actor: ${actorId}`, {
        actorId,
        reason,
      });

      // First stop the actor if it's running
      const actor = this.registry.get(actorId);
      if (actor && actor.lifecycleState === 'running') {
        await this.stopActor(actorId, reason);
      }

      // Unregister from registry
      const unregistered = await this.registry.unregister(actorId);

      if (unregistered) {
        // Broadcast removal event
        this.broadcastEvent({
          type: 'ACTOR_REMOVED',
          actorId,
          reason,
        });

        this.logger.state('RemoveActor', `Actor removed successfully: ${actorId}`);
        return true;
      } else {
        this.logger.warn('RemoveActor', `Actor not found for removal: ${actorId}`);
        return false;
      }

    } catch (error) {
      this.logger.error('RemoveActor', 'Failed to remove actor', {
        actorId,
        reason,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get manager metrics
   */
  getMetrics(): ManagerMetrics {
    const registryMetrics = this.registry.getMetrics();
    const uptime = Date.now() - this.createdAt;
    const eventsPerSecond = this.eventCount / (uptime / 1000);
    
    const actors = this.registry.getAll();
    const totalActorLifetime = actors.reduce((sum, actor) => {
      const lifetime = actor.stoppedAt 
        ? actor.stoppedAt - actor.identity.createdAt
        : Date.now() - actor.identity.createdAt;
      return sum + lifetime;
    }, 0);
    const averageActorLifetime = actors.length > 0 ? totalActorLifetime / actors.length : 0;

    return {
      registry: registryMetrics,
      activeActors: registryMetrics.activeActors,
      totalEvents: this.eventCount,
      eventsPerSecond,
      averageActorLifetime,
      memoryUsage: this.getMemoryUsage(),
      uptime,
    };
  }

  /**
   * Cleanup all actors
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleanup', 'Starting manager cleanup');

    // Stop all running actors
    const actors = this.registry.getAll();
    const stopPromises = actors
      .filter(actor => actor.lifecycleState === 'running')
      .map(actor => this.stopActor(actor.identity.id, 'Manager cleanup'));

    await Promise.allSettled(stopPromises);

    // Clear the registry
    await this.registry.clear();

    // Clear broadcaster subscriptions
    this.broadcaster.clearSubscriptions();

    this.logger.info('Cleanup', 'Manager cleanup completed', {
      stoppedActors: stopPromises.length,
    });
  }

  /**
   * Create machine for actor type
   */
  private createMachineForType(
    type: ActorInstance['identity']['type'],
    ticker: SupportedTicker,
    contextHooks: TickerContextHooks,
    options: ActorConfig['options']
  ): any {
    // For now, create a simple state machine placeholder
    // This will be replaced with actual machine implementations
    const { createMachine } = require('xstate');
    
    switch (type) {
      case 'macro-execution':
        return createMachine({
          id: `macro-${ticker.toLowerCase()}`,
          initial: 'idle',
          context: {
            ticker,
            debugMode: options.enableDebug || false,
          },
          states: {
            idle: {
              on: {
                START_MACRO: 'executing',
                PAUSE: 'paused',
                STOP: 'stopped',
              },
            },
            executing: {
              on: {
                PAUSE: 'paused',
                STOP: 'stopped',
                COMPLETE: 'completed',
                ERROR: 'error',
              },
            },
            paused: {
              on: {
                RESUME: 'executing',
                STOP: 'stopped',
              },
            },
            completed: {
              type: 'final',
            },
            stopped: {
              type: 'final',
            },
            error: {
              on: {
                RETRY: 'executing',
                STOP: 'stopped',
              },
            },
          },
        });
      case 'data-fetcher':
      case 'ai-processor':
      case 'custom':
      default:
        throw new Error(`Unsupported actor type: ${type}`);
    }
  }

  /**
   * Initialize actor metrics
   */
  private initializeActorMetrics(): ActorInstance['metrics'] {
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      totalUptime: 0,
      restartCount: 0,
      performanceSamples: [],
    };
  }

  /**
   * Set up event handlers for actor
   */
  private setupEventHandlers(
    actor: ActorInstance,
    handlers?: ActorConfig['eventHandlers']
  ): void {
    if (!handlers) return;

    // Set up state change handler
    if (handlers.onStateChange) {
      const subscription = actor.actorRef.subscribe({
        next: handlers.onStateChange,
      });
      actor.subscriptions.push(() => subscription.unsubscribe());
    }

    // Set up error handler
    if (handlers.onError) {
      const subscription = actor.actorRef.subscribe(
        () => {}, // next
        (error: any) => handlers.onError!(error), // error handler
        undefined // complete
      );
      actor.subscriptions.push(() => subscription.unsubscribe());
    }

    // Set up completion handler
    if (handlers.onComplete) {
      const subscription = actor.actorRef.subscribe(
        () => {}, // next
        undefined, // error
        () => handlers.onComplete!(null) // complete handler
      );
      actor.subscriptions.push(() => subscription.unsubscribe());
    }
  }

  /**
   * Set up actor monitoring
   */
  private setupActorMonitoring(actor: ActorInstance): void {
    const subscription = actor.actorRef.subscribe({
      next: (snapshot) => {
        this.handleActorSnapshot(actor, snapshot);
      },
      error: (error: unknown) => {
        this.handleActorError(actor, error as Error);
      },
      complete: () => {
        this.handleActorComplete(actor);
      },
    });

    actor.subscriptions.push(() => subscription.unsubscribe());
  }

  /**
   * Handle actor snapshot
   */
  private handleActorSnapshot(actor: ActorInstance, snapshot: any): void {
    const oldState = actor.lifecycleState;
    const newState = this.deriveLfieccleState(snapshot);
    
    if (oldState !== newState) {
      actor.lifecycleState = newState;
      
      this.broadcastEvent({
        type: 'ACTOR_STATE_CHANGED',
        actorId: actor.identity.id,
        newState: this.getMachineStateString(snapshot),
        oldState,
      });
    }
  }

  /**
   * Handle actor error
   */
  private handleActorError(actor: ActorInstance, error: unknown): void {
    const actualError = error instanceof Error ? error : new Error(String(error));
    actor.lifecycleState = 'error';
    actor.lastError = actualError;
    actor.metrics.failedExecutions++;

    this.broadcastEvent({
      type: 'ACTOR_ERROR',
      actorId: actor.identity.id,
      error: actualError,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle actor completion
   */
  private handleActorComplete(actor: ActorInstance): void {
    actor.lifecycleState = 'stopped';
    actor.stoppedAt = Date.now();
    actor.metrics.successfulExecutions++;

    if (actor.startedAt) {
      const duration = actor.stoppedAt - actor.startedAt;
      actor.metrics.totalUptime += duration;
      
      // Update average execution time
      const totalTime = actor.metrics.averageExecutionTime * (actor.metrics.totalExecutions - 1) + duration;
      actor.metrics.averageExecutionTime = totalTime / actor.metrics.totalExecutions;
    }
  }

  /**
   * Derive lifecycle state from machine snapshot
   */
  private deriveLfieccleState(snapshot: any): ActorLifecycleState {
    if (!snapshot || !snapshot.value) return 'error';
    
    const value = snapshot.value;
    if (typeof value === 'string') {
      switch (value) {
        case 'idle':
          return 'created';
        case 'executing':
          return 'running';
        case 'paused':
          return 'paused';
        case 'complete':
          return 'stopped';
        case 'error':
          return 'error';
        default:
          return 'running';
      }
    }
    
    return 'running';
  }

  /**
   * Get machine state as string
   */
  private getMachineStateString(snapshot: any): string {
    if (!snapshot || !snapshot.value) return 'unknown';
    
    if (typeof snapshot.value === 'string') {
      return snapshot.value;
    }
    
    if (typeof snapshot.value === 'object') {
      return JSON.stringify(snapshot.value);
    }
    
    return String(snapshot.value);
  }

  /**
   * Check if actor is healthy
   */
  private isActorHealthy(actor: ActorInstance): boolean {
    try {
      const isNotInError = actor.lifecycleState !== 'error';
      const hasGoodMetrics = actor.metrics.totalExecutions === 0 || 
        (actor.metrics.successfulExecutions / actor.metrics.totalExecutions) > 0.5;
      const hasRecentActivity = !actor.lastError || 
        (Date.now() - actor.identity.createdAt) < 300000; // 5 minutes
      
      return isNotInError && hasGoodMetrics && hasRecentActivity;
    } catch {
      return false;
    }
  }

  /**
   * Broadcast event
   */
  private broadcastEvent(event: ActorEvent): void {
    this.eventCount++;
    this.lastEventTime = Date.now();
    this.broadcaster.broadcast(event);
  }

  /**
   * Get memory usage (simplified)
   */
  private getMemoryUsage(): number {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage().heapUsed;
      }
      return 0;
    } catch {
      return 0;
    }
  }
}

/**
 * Factory function to create actor manager
 */
export function createActorManager(): ActorManager {
  return new StockSageActorManager();
}

/**
 * Singleton manager instance for global use
 */
let globalManager: ActorManager | null = null;

/**
 * Get global actor manager instance
 */
export function getGlobalActorManager(): ActorManager {
  if (!globalManager) {
    globalManager = createActorManager();
  }
  return globalManager;
}

/**
 * Reset global manager (for testing)
 */
export function resetGlobalActorManager(): void {
  if (globalManager) {
    globalManager.cleanup();
    globalManager = null;
  }
}