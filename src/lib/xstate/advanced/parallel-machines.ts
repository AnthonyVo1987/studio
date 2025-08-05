/**
 * @fileoverview Parallel State Machines for Concurrent Ticker Operations
 * 
 * Enables concurrent execution of macro operations across multiple tickers
 * with sophisticated resource management, synchronization, and coordination.
 */

import { 
  setup, 
  createActor, 
  assign, 
  sendTo, 
  raise,
  type ActorRef,
  type AnyMachineSnapshot
} from 'xstate';
import type {
  ParallelMachineConfig,
  ParallelExecutionContext,
  ResourcePoolConfig,
  ResourceAllocation,
  AdvancedEvent
} from './advanced-types';
import type { 
  SupportedTicker,
  MacroExecutionContext,
  MacroExecutionEvent 
} from '@/lib/xstate/types/macro-types';
import type { ActorInstance } from '@/lib/xstate/actors/actor-types';

// ================================
// RESOURCE POOL MANAGEMENT
// ================================

/**
 * Resource pool for managing shared resources across parallel operations
 */
export class ResourcePool {
  private config: ResourcePoolConfig;
  private allocations: Map<string, ResourceAllocation> = new Map();
  private usageMetrics: Map<string, number[]> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: ResourcePoolConfig) {
    this.config = config;
    this.startCleanupScheduler();
  }

  /**
   * Acquire resource from pool
   */
  async acquireResource(
    resourceType: 'api' | 'memory' | 'connection' | 'computation',
    amount: number,
    ownerId: string,
    timeout: number = this.config.acquisitionTimeout
  ): Promise<ResourceAllocation | null> {
    const resourceId = `${resourceType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check availability
    const currentUsage = this.getCurrentUsage(resourceType);
    const maxAvailable = this.getMaxAvailable(resourceType);
    
    if (currentUsage + amount > maxAvailable) {
      // Try to wait for resource availability
      const acquired = await this.waitForResource(resourceType, amount, timeout);
      if (!acquired) {
        return null;
      }
    }

    const allocation: ResourceAllocation = {
      resourceId,
      resourceType,
      allocatedAmount: amount,
      maxAvailable,
      currentUsage: currentUsage + amount,
      allocatedAt: Date.now(),
      ownerId
    };

    this.allocations.set(resourceId, allocation);
    this.recordUsage(resourceType, currentUsage + amount);
    
    return allocation;
  }

  /**
   * Release resource back to pool
   */
  releaseResource(resourceId: string): boolean {
    const allocation = this.allocations.get(resourceId);
    if (!allocation) {
      return false;
    }

    this.allocations.delete(resourceId);
    this.recordUsage(allocation.resourceType, 
      this.getCurrentUsage(allocation.resourceType) - allocation.allocatedAmount);
    
    return true;
  }

  /**
   * Get current resource usage
   */
  private getCurrentUsage(resourceType: string): number {
    let usage = 0;
    for (const allocation of this.allocations.values()) {
      if (allocation.resourceType === resourceType) {
        usage += allocation.allocatedAmount;
      }
    }
    return usage;
  }

  /**
   * Get maximum available resources
   */
  private getMaxAvailable(resourceType: string): number {
    switch (resourceType) {
      case 'api': return this.config.maxApiRequests;
      case 'memory': return this.config.memoryLimit;
      case 'connection': return this.config.connectionPoolSize;
      case 'computation': return 100; // Default computation units
      default: return 0;
    }
  }

  /**
   * Wait for resource availability
   */
  private async waitForResource(
    resourceType: string, 
    amount: number, 
    timeout: number
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.getCurrentUsage(resourceType) + amount <= this.getMaxAvailable(resourceType)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100)); // Check every 100ms
    }
    
    return false;
  }

  /**
   * Record resource usage for metrics
   */
  private recordUsage(resourceType: string, usage: number): void {
    if (!this.usageMetrics.has(resourceType)) {
      this.usageMetrics.set(resourceType, []);
    }
    
    const metrics = this.usageMetrics.get(resourceType)!;
    metrics.push(usage);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  /**
   * Start cleanup scheduler
   */
  private startCleanupScheduler(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredAllocations();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired allocations
   */
  private cleanupExpiredAllocations(): void {
    const now = Date.now();
    const expiredIds: string[] = [];
    
    for (const [id, allocation] of this.allocations.entries()) {
      // Release allocations older than 5 minutes
      if (now - allocation.allocatedAt > 5 * 60 * 1000) {
        expiredIds.push(id);
      }
    }
    
    expiredIds.forEach(id => this.releaseResource(id));
  }

  /**
   * Get resource utilization metrics
   */
  getUtilizationMetrics(): Record<string, { current: number; average: number; peak: number }> {
    const metrics: Record<string, { current: number; average: number; peak: number }> = {};
    
    for (const [resourceType, usageHistory] of this.usageMetrics.entries()) {
      const current = this.getCurrentUsage(resourceType);
      const average = usageHistory.reduce((sum, val) => sum + val, 0) / usageHistory.length;
      const peak = Math.max(...usageHistory);
      
      metrics[resourceType] = { current, average, peak };
    }
    
    return metrics;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.allocations.clear();
    this.usageMetrics.clear();
  }
}

// ================================
// PARALLEL COORDINATION MACHINE
// ================================

/**
 * Create parallel coordination machine for managing concurrent ticker operations
 */
export function createParallelCoordinationMachine(config: ParallelMachineConfig) {
  return setup({
    types: {
      context: {} as ParallelExecutionContext,
      events: {} as MacroExecutionEvent | AdvancedEvent
    },
    actions: {
      initializeParallelExecution: assign({
        synchronizationState: ({ context }) => {
          const syncState = new Map<string, boolean>();
          context.parallelConfig.synchronizationPoints.forEach(point => {
            syncState.set(point, false);
          });
          return syncState;
        }
      }),
      
      spawnTickerActors: ({ context }) => {
        // This would integrate with the actor spawning system
        console.log('Spawning actors for tickers:', context.parallelConfig.tickers);
      },
      
      startResourceMonitoring: ({ context }) => {
        console.log('Starting resource monitoring for parallel execution');
      },
      
      handleResourceRequest: assign({
        resourceAllocations: ({ context, event }) => {
          if (event.type === 'RESOURCE_ALLOCATION_REQUESTED') {
            // Handle resource allocation logic
            return new Map(context.resourceAllocations);
          }
          return context.resourceAllocations;
        }
      }),
      
      handleResourceRelease: ({ context }) => {
        console.log('Handling resource release');
      },
      
      handleSynchronizationRequest: assign({
        synchronizationState: ({ context, event }) => {
          if (event.type === 'PARALLEL_COORDINATION_REQUIRED') {
            const newState = new Map(context.synchronizationState);
            newState.set(event.synchronizationPoint, true);
            return newState;
          }
          return context.synchronizationState;
        }
      }),
      
      performSynchronization: ({ context }) => {
        console.log('Performing synchronization at point');
      },
      
      recordTickerCompletion: assign({
        coordinationResults: ({ context, event }) => {
          if (event.type === 'TICKER_EXECUTION_COMPLETE') {
            const newResults = new Map(context.coordinationResults);
            // Record completion data
            return newResults;
          }
          return context.coordinationResults;
        }
      }),
      
      aggregateResults: ({ context }) => {
        console.log('Aggregating results from all ticker executions');
      },
      
      finalizeParallelExecution: ({ context }) => {
        console.log('Finalizing parallel execution');
      },
      
      handleParallelError: assign({
        error: ({ event }) => {
          if ('error' in event) {
            return event.error as Error;
          }
          return new Error('Parallel execution failed');
        }
      })
    }
  }).createMachine({
    id: 'parallelCoordination',
    context: {
      // Base macro context
      ticker: 'MULTI', // Special ticker for parallel operations
      executionId: `parallel-${Date.now()}`,
      selectedExpiration: null,
      stepResults: new Map(),
      currentStep: 0,
      totalSteps: 0, // Will be set based on parallel operations
      completedSteps: [],
      error: null,
      timeoutSettings: {
        stepTimeout: 45000,
        maxRetries: 2,
        backoffMultiplier: 2,
        baseRetryDelay: 1000
      },
      startTime: null,
      performance: {
        totalDuration: 0,
        stepDurations: new Map(),
        retryCount: 0,
        timeoutCount: 0
      },
      currentRetryAttempt: 0,
      cancelled: false,
      debugMode: false,
      
      // Parallel-specific context
      parallelConfig: config,
      resourceAllocations: new Map(),
      sharedData: new Map(),
      synchronizationState: new Map(),
      coordinationResults: new Map()
    },
    initial: 'idle',
    states: {
      idle: {
        on: {
          START_PARALLEL_EXECUTION: {
            target: 'initializing',
            actions: assign({
              startTime: Date.now(),
              executionId: ({ context }) => `parallel-${Date.now()}`
            })
          }
        }
      },
      
      initializing: {
        entry: 'initializeParallelExecution',
        on: {
          INITIALIZATION_COMPLETE: 'spawningActors',
          INITIALIZATION_FAILED: 'error'
        }
      },
      
      spawningActors: {
        entry: 'spawnTickerActors',
        on: {
          ALL_ACTORS_SPAWNED: 'coordinating',
          SPAWN_FAILED: 'error'
        }
      },
      
      coordinating: {
        type: 'parallel',
        states: {
          // Resource management
          resourceManagement: {
            initial: 'monitoring',
            states: {
              monitoring: {
                entry: 'startResourceMonitoring',
                on: {
                  RESOURCE_ALLOCATION_REQUESTED: {
                    actions: 'handleResourceRequest'
                  },
                  RESOURCE_RELEASED: {
                    actions: 'handleResourceRelease'
                  }
                }
              }
            }
          },
          
          // Execution coordination
          execution: {
            initial: 'running',
            states: {
              running: {
                on: {
                  PARALLEL_COORDINATION_REQUIRED: {
                    target: 'synchronizing',
                    actions: 'handleSynchronizationRequest'
                  },
                  TICKER_EXECUTION_COMPLETE: {
                    actions: 'recordTickerCompletion'
                  },
                  ALL_TICKERS_COMPLETE: 'completed'
                }
              },
              
              synchronizing: {
                entry: 'performSynchronization',
                on: {
                  SYNCHRONIZATION_COMPLETE: 'running',
                  SYNCHRONIZATION_TIMEOUT: 'error'
                }
              },
              
              completed: {
                type: 'final',
                entry: 'aggregateResults'
              }
            }
          }
        },
        
        onDone: 'completed'
      },
      
      completed: {
        entry: 'finalizeParallelExecution',
        type: 'final'
      },
      
      error: {
        entry: 'handleParallelError',
        on: {
          RETRY_PARALLEL_EXECUTION: 'initializing',
          RESET: 'idle'
        }
      }
    }
  });
}

// ================================
// PARALLEL EXECUTION MANAGER
// ================================

/**
 * Manager for parallel ticker execution with resource coordination
 */
export class ParallelExecutionManager {
  private resourcePool: ResourcePool;
  private activeExecutions: Map<string, ActorRef<any, any>> = new Map();
  private executionMetrics: Map<string, any> = new Map();

  constructor(resourceConfig: ResourcePoolConfig) {
    this.resourcePool = new ResourcePool(resourceConfig);
  }

  /**
   * Start parallel execution for multiple tickers
   */
  async startParallelExecution(
    config: ParallelMachineConfig,
    tickerContexts: Map<SupportedTicker, any>
  ): Promise<string> {
    const executionId = `parallel-${Date.now()}`;
    
    // Create coordination machine
    const coordinationMachine = createParallelCoordinationMachine(config);
    const coordinationActor = createActor(coordinationMachine);
    
    // Store execution reference
    this.activeExecutions.set(executionId, coordinationActor);
    
    // Start coordination
    coordinationActor.start();
    coordinationActor.send({ type: 'START_PARALLEL_EXECUTION' });
    
    return executionId;
  }

  /**
   * Request resource allocation for execution
   */
  async requestResource(
    resourceType: 'api' | 'memory' | 'connection' | 'computation',
    amount: number,
    ownerId: string
  ): Promise<ResourceAllocation | null> {
    return await this.resourcePool.acquireResource(resourceType, amount, ownerId);
  }

  /**
   * Release allocated resource
   */
  releaseResource(resourceId: string): boolean {
    return this.resourcePool.releaseResource(resourceId);
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): any {
    const actor = this.activeExecutions.get(executionId);
    if (!actor) {
      return null;
    }
    
    return {
      executionId,
      state: actor.getSnapshot().value,
      context: actor.getSnapshot().context,
      isRunning: !actor.getSnapshot().done
    };
  }

  /**
   * Cancel parallel execution
   */
  async cancelExecution(executionId: string, reason?: string): Promise<boolean> {
    const actor = this.activeExecutions.get(executionId);
    if (!actor) {
      return false;
    }
    
    actor.send({ type: 'CANCEL_EXECUTION', reason });
    actor.stop();
    this.activeExecutions.delete(executionId);
    
    return true;
  }

  /**
   * Get resource utilization metrics
   */
  getResourceMetrics(): Record<string, { current: number; average: number; peak: number }> {
    return this.resourcePool.getUtilizationMetrics();
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions.keys());
  }

  /**
   * Cleanup manager resources
   */
  destroy(): void {
    // Stop all active executions
    for (const [executionId, actor] of this.activeExecutions.entries()) {
      actor.stop();
    }
    this.activeExecutions.clear();
    
    // Cleanup resource pool
    this.resourcePool.destroy();
    
    // Clear metrics
    this.executionMetrics.clear();
  }
}

// ================================
// COORDINATION UTILITIES
// ================================

/**
 * Utility functions for parallel coordination
 */
export const ParallelCoordinationUtils = {
  /**
   * Create synchronization barrier for parallel operations
   */
  createSynchronizationBarrier(
    participantCount: number,
    timeout: number = 30000
  ): {
    wait: () => Promise<boolean>;
    signal: () => void;
    reset: () => void;
  } {
    let arrivedCount = 0;
    let waitingResolvers: Array<(value: boolean) => void> = [];
    let timeoutId: NodeJS.Timeout | null = null;

    const wait = (): Promise<boolean> => {
      return new Promise((resolve) => {
        arrivedCount++;
        
        if (arrivedCount >= participantCount) {
          // All participants arrived, release all waiters
          waitingResolvers.forEach(resolver => resolver(true));
          waitingResolvers = [];
          if (timeoutId) clearTimeout(timeoutId);
          resolve(true);
        } else {
          // Wait for other participants
          waitingResolvers.push(resolve);
          
          if (!timeoutId) {
            timeoutId = setTimeout(() => {
              waitingResolvers.forEach(resolver => resolver(false));
              waitingResolvers = [];
            }, timeout);
          }
        }
      });
    };

    const signal = (): void => {
      arrivedCount++;
      if (arrivedCount >= participantCount) {
        waitingResolvers.forEach(resolver => resolver(true));
        waitingResolvers = [];
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    const reset = (): void => {
      arrivedCount = 0;
      waitingResolvers.forEach(resolver => resolver(false));
      waitingResolvers = [];
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = null;
    };

    return { wait, signal, reset };
  },

  /**
   * Merge results from parallel executions
   */
  mergeParallelResults(results: Map<SupportedTicker, any>): any {
    const merged = {
      tickers: Array.from(results.keys()),
      results: Object.fromEntries(results),
      summary: {
        totalTickers: results.size,
        successCount: 0,
        errorCount: 0,
        totalDuration: 0
      }
    };

    for (const [ticker, result] of results.entries()) {
      if (result.success) {
        merged.summary.successCount++;
      } else {
        merged.summary.errorCount++;
      }
      merged.summary.totalDuration += result.duration || 0;
    }

    return merged;
  },

  /**
   * Calculate optimal concurrency based on resource availability
   */
  calculateOptimalConcurrency(
    resourceMetrics: Record<string, { current: number; average: number; peak: number }>,
    tickerCount: number
  ): number {
    let optimalConcurrency = tickerCount;

    // Analyze resource constraints
    for (const [resourceType, metrics] of Object.entries(resourceMetrics)) {
      const utilizationRate = metrics.current / metrics.peak;
      
      if (utilizationRate > 0.8) { // High utilization
        optimalConcurrency = Math.min(optimalConcurrency, Math.floor(tickerCount * 0.5));
      } else if (utilizationRate > 0.6) { // Medium utilization
        optimalConcurrency = Math.min(optimalConcurrency, Math.floor(tickerCount * 0.75));
      }
    }

    return Math.max(1, optimalConcurrency); // Ensure at least 1
  }
};

// ================================
// EXPORTS
// ================================

export {
  type ParallelMachineConfig,
  type ParallelExecutionContext,
  type ResourceAllocation,
  type ResourcePoolConfig
};