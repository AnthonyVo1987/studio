/**
 * @fileoverview Actor Registry for XState-StockSage Integration
 * 
 * Manages registration, discovery, and lifecycle of XState actors.
 * Provides centralized actor management with metrics and monitoring.
 */

import type {
  ActorRegistry,
  ActorInstance,
  RegistryMetrics,
  ActorIdentity,
  SupportedTicker,
} from './actor-types';
import { createTickerLogger } from '@/lib/ticker-logger';

/**
 * Actor Registry Implementation
 * Centralized management for all XState actors in the system
 */
export class StockSageActorRegistry implements ActorRegistry {
  private actors: Map<string, ActorInstance>;
  private logger;
  private createdAt: number;
  private metrics: RegistryMetrics;

  constructor() {
    this.actors = new Map();
    this.logger = createTickerLogger('SYSTEM', 'ACTOR_REGISTRY');
    this.createdAt = Date.now();
    this.metrics = this.initializeMetrics();
    
    this.logger.info('ActorRegistry', 'Registry initialized', {
      timestamp: this.createdAt,
    });
  }

  /**
   * Register new actor
   */
  async register(actor: ActorInstance): Promise<void> {
    try {
      const actorId = actor.identity.id;
      
      if (this.actors.has(actorId)) {
        throw new Error(`Actor with ID ${actorId} already exists`);
      }

      this.actors.set(actorId, actor);
      this.updateMetricsOnRegister(actor);

      this.logger.info('Register', `Actor registered: ${actorId}`, {
        actorId,
        ticker: actor.identity.ticker,
        type: actor.identity.type,
        lifecycleState: actor.lifecycleState,
      });

      // Set up actor lifecycle monitoring
      this.setupActorMonitoring(actor);

    } catch (error) {
      this.logger.error('Register', 'Failed to register actor', {
        actorId: actor.identity.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Unregister actor
   */
  async unregister(actorId: string): Promise<boolean> {
    try {
      const actor = this.actors.get(actorId);
      
      if (!actor) {
        this.logger.warn('Unregister', `Actor not found: ${actorId}`);
        return false;
      }

      // Clean up actor subscriptions
      actor.subscriptions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          this.logger.error('Unregister', 'Subscription cleanup failed', {
            actorId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      // Stop actor if it's still running
      if (actor.lifecycleState === 'running') {
        try {
          actor.actorRef.stop();
        } catch (error) {
          this.logger.error('Unregister', 'Failed to stop actor', {
            actorId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      this.actors.delete(actorId);
      this.updateMetricsOnUnregister(actor);

      this.logger.info('Unregister', `Actor unregistered: ${actorId}`, {
        actorId,
        ticker: actor.identity.ticker,
        uptime: this.calculateUptime(actor),
      });

      return true;
    } catch (error) {
      this.logger.error('Unregister', 'Failed to unregister actor', {
        actorId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get actor by ID
   */
  get(actorId: string): ActorInstance | undefined {
    return this.actors.get(actorId);
  }

  /**
   * Get all actors for ticker
   */
  getByTicker(ticker: SupportedTicker): ActorInstance[] {
    return Array.from(this.actors.values()).filter(
      actor => actor.identity.ticker === ticker
    );
  }

  /**
   * Get all actors by type
   */
  getByType(type: ActorIdentity['type']): ActorInstance[] {
    return Array.from(this.actors.values()).filter(
      actor => actor.identity.type === type
    );
  }

  /**
   * Get all actors
   */
  getAll(): ActorInstance[] {
    return Array.from(this.actors.values());
  }

  /**
   * Check if actor exists
   */
  exists(actorId: string): boolean {
    return this.actors.has(actorId);
  }

  /**
   * Get registry metrics
   */
  getMetrics(): RegistryMetrics {
    this.updateCurrentMetrics();
    return { ...this.metrics };
  }

  /**
   * Clear all actors
   */
  async clear(): Promise<void> {
    this.logger.info('Clear', 'Clearing all actors', {
      actorCount: this.actors.size,
    });

    const actorIds = Array.from(this.actors.keys());
    
    // Unregister all actors
    const unregisterPromises = actorIds.map(actorId => this.unregister(actorId));
    await Promise.allSettled(unregisterPromises);

    this.actors.clear();
    this.metrics = this.initializeMetrics();

    this.logger.info('Clear', 'All actors cleared', {
      clearedActors: actorIds.length,
    });
  }

  /**
   * Get actors by lifecycle state
   */
  getByLifecycleState(state: ActorInstance['lifecycleState']): ActorInstance[] {
    return Array.from(this.actors.values()).filter(
      actor => actor.lifecycleState === state
    );
  }

  /**
   * Get healthy actors
   */
  getHealthyActors(): ActorInstance[] {
    return Array.from(this.actors.values()).filter(
      actor => this.isActorHealthy(actor)
    );
  }

  /**
   * Get actor statistics
   */
  getStatistics(): {
    totalActors: number;
    runningActors: number;
    errorActors: number;
    averageUptime: number;
    totalExecutions: number;
    successRate: number;
  } {
    const actors = this.getAll();
    const runningActors = actors.filter(a => a.lifecycleState === 'running').length;
    const errorActors = actors.filter(a => a.lifecycleState === 'error').length;
    
    const totalExecutions = actors.reduce((sum, a) => sum + a.metrics.totalExecutions, 0);
    const successfulExecutions = actors.reduce((sum, a) => sum + a.metrics.successfulExecutions, 0);
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    
    const uptimes = actors
      .filter(a => a.startedAt)
      .map(a => this.calculateUptime(a));
    const averageUptime = uptimes.length > 0 ? 
      uptimes.reduce((sum, uptime) => sum + uptime, 0) / uptimes.length : 0;

    return {
      totalActors: actors.length,
      runningActors,
      errorActors,
      averageUptime,
      totalExecutions,
      successRate,
    };
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): RegistryMetrics {
    return {
      totalActors: 0,
      activeActors: 0,
      stoppedActors: 0,
      errorActors: 0,
      actorsByTicker: {} as Record<SupportedTicker, number>,
      actorsByType: {},
      uptime: 0,
    };
  }

  /**
   * Update metrics when actor is registered
   */
  private updateMetricsOnRegister(actor: ActorInstance): void {
    this.metrics.totalActors++;
    
    if (actor.lifecycleState === 'running') {
      this.metrics.activeActors++;
    } else if (actor.lifecycleState === 'stopped') {
      this.metrics.stoppedActors++;
    } else if (actor.lifecycleState === 'error') {
      this.metrics.errorActors++;
    }

    // Update ticker counts
    const ticker = actor.identity.ticker;
    this.metrics.actorsByTicker[ticker] = (this.metrics.actorsByTicker[ticker] || 0) + 1;

    // Update type counts
    const type = actor.identity.type;
    this.metrics.actorsByType[type] = (this.metrics.actorsByType[type] || 0) + 1;
  }

  /**
   * Update metrics when actor is unregistered
   */
  private updateMetricsOnUnregister(actor: ActorInstance): void {
    this.metrics.totalActors = Math.max(0, this.metrics.totalActors - 1);
    
    if (actor.lifecycleState === 'running') {
      this.metrics.activeActors = Math.max(0, this.metrics.activeActors - 1);
    } else if (actor.lifecycleState === 'stopped') {
      this.metrics.stoppedActors = Math.max(0, this.metrics.stoppedActors - 1);
    } else if (actor.lifecycleState === 'error') {
      this.metrics.errorActors = Math.max(0, this.metrics.errorActors - 1);
    }

    // Update ticker counts
    const ticker = actor.identity.ticker;
    this.metrics.actorsByTicker[ticker] = Math.max(0, (this.metrics.actorsByTicker[ticker] || 0) - 1);

    // Update type counts
    const type = actor.identity.type;
    this.metrics.actorsByType[type] = Math.max(0, (this.metrics.actorsByType[type] || 0) - 1);
  }

  /**
   * Update current metrics
   */
  private updateCurrentMetrics(): void {
    const actors = this.getAll();
    
    this.metrics.totalActors = actors.length;
    this.metrics.activeActors = actors.filter(a => a.lifecycleState === 'running').length;
    this.metrics.stoppedActors = actors.filter(a => a.lifecycleState === 'stopped').length;
    this.metrics.errorActors = actors.filter(a => a.lifecycleState === 'error').length;
    this.metrics.uptime = Date.now() - this.createdAt;

    // Recalculate ticker and type counts
    this.metrics.actorsByTicker = {} as Record<SupportedTicker, number>;
    this.metrics.actorsByType = {};

    actors.forEach(actor => {
      const ticker = actor.identity.ticker;
      const type = actor.identity.type;
      
      this.metrics.actorsByTicker[ticker] = (this.metrics.actorsByTicker[ticker] || 0) + 1;
      this.metrics.actorsByType[type] = (this.metrics.actorsByType[type] || 0) + 1;
    });
  }

  /**
   * Set up monitoring for an actor
   */
  private setupActorMonitoring(actor: ActorInstance): void {
    try {
      // Monitor actor state changes
      const subscription = actor.actorRef.subscribe({
        next: (snapshot) => {
          this.handleActorStateChange(actor, snapshot);
        },
        error: (error) => {
          this.handleActorError(actor, error as Error);
        },
        complete: () => {
          this.handleActorComplete(actor);
        },
      });

      // Store cleanup function
      actor.subscriptions.push(() => subscription.unsubscribe());

    } catch (error) {
      this.logger.error('SetupActorMonitoring', 'Failed to setup monitoring', {
        actorId: actor.identity.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle actor state change
   */
  private handleActorStateChange(actor: ActorInstance, snapshot: any): void {
    try {
      const previousState = actor.lifecycleState;
      const newState = this.deriveLifecycleState(snapshot);
      
      if (previousState !== newState) {
        actor.lifecycleState = newState;
        
        this.logger.debug('ActorStateChange', `Actor ${actor.identity.id} state: ${previousState} -> ${newState}`, {
          actorId: actor.identity.id,
          previousState,
          newState,
          machineState: snapshot.value,
        });
      }
    } catch (error) {
      this.logger.error('HandleActorStateChange', 'State change handling failed', {
        actorId: actor.identity.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle actor error
   */
  private handleActorError(actor: ActorInstance, error: Error): void {
    actor.lifecycleState = 'error';
    actor.lastError = error;
    
    this.logger.error('ActorError', `Actor ${actor.identity.id} encountered error`, {
      actorId: actor.identity.id,
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Handle actor completion
   */
  private handleActorComplete(actor: ActorInstance): void {
    actor.lifecycleState = 'stopped';
    actor.stoppedAt = Date.now();
    
    this.logger.info('ActorComplete', `Actor ${actor.identity.id} completed`, {
      actorId: actor.identity.id,
      uptime: this.calculateUptime(actor),
    });
  }

  /**
   * Derive lifecycle state from machine snapshot
   */
  private deriveLifecycleState(snapshot: any): ActorInstance['lifecycleState'] {
    if (!snapshot) return 'error';
    
    const value = snapshot.value;
    if (typeof value === 'string') {
      switch (value) {
        case 'idle':
        case 'ready':
          return 'created';
        case 'executing':
        case 'running':
          return 'running';
        case 'paused':
          return 'paused';
        case 'complete':
        case 'success':
          return 'stopped';
        case 'error':
        case 'failed':
          return 'error';
        default:
          return 'running';
      }
    }
    
    return 'running';
  }

  /**
   * Check if actor is healthy
   */
  private isActorHealthy(actor: ActorInstance): boolean {
    try {
      // Basic health checks
      const isNotInError = actor.lifecycleState !== 'error';
      const hasRecentActivity = !actor.startedAt || 
        (Date.now() - actor.startedAt) < 300000; // 5 minutes
      const hasGoodSuccessRate = actor.metrics.totalExecutions === 0 || 
        (actor.metrics.successfulExecutions / actor.metrics.totalExecutions) > 0.5;
      
      return isNotInError && hasRecentActivity && hasGoodSuccessRate;
    } catch {
      return false;
    }
  }

  /**
   * Calculate actor uptime
   */
  private calculateUptime(actor: ActorInstance): number {
    if (!actor.startedAt) return 0;
    const endTime = actor.stoppedAt || Date.now();
    return endTime - actor.startedAt;
  }
}

/**
 * Factory function to create actor registry
 */
export function createActorRegistry(): ActorRegistry {
  return new StockSageActorRegistry();
}

/**
 * Singleton registry instance for global use
 */
let globalRegistry: ActorRegistry | null = null;

/**
 * Get global actor registry instance
 */
export function getGlobalActorRegistry(): ActorRegistry {
  if (!globalRegistry) {
    globalRegistry = createActorRegistry();
  }
  return globalRegistry;
}

/**
 * Reset global registry (for testing)
 */
export function resetGlobalActorRegistry(): void {
  if (globalRegistry) {
    globalRegistry.clear();
    globalRegistry = null;
  }
}