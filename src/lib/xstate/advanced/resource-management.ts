/**
 * @fileoverview Advanced Resource Management System for XState Machines
 * 
 * Provides sophisticated resource allocation, monitoring, and optimization
 * with support for multiple resource types, throttling, and adaptive allocation.
 */

import type {
  ResourceManagerConfig,
  ResourcePoolConfig,
  ResourceAllocation,
  ResourceUsageMetrics,
  ResourceUsagePoint,
  ResourceCleanupPolicy,
  AdvancedEvent,
  ResourceTypeId,
  ResourceConstraint,
  ResourceRequest,
  AllocationResult
} from './advanced-types';

// ================================
// RESOURCE TYPES AND CONSTRAINTS
// ================================

// Use types from advanced-types.ts to avoid conflicts
// All resource types are imported from advanced-types

// ================================
// RESOURCE POOL IMPLEMENTATION
// ================================

/**
 * Enhanced resource pool with advanced features
 */
class AdvancedResourcePool {
  private config: ResourcePoolConfig;
  private allocations: Map<string, ResourceAllocation> = new Map();
  private usageHistory: Map<string, ResourceUsagePoint[]> = new Map();
  private requestQueue: ResourceRequest[] = [];
  private cleanupInterval?: NodeJS.Timeout;
  private monitoringInterval?: NodeJS.Timeout;
  private allocationStrategies: Map<string, AllocationStrategy> = new Map();

  constructor(config: ResourcePoolConfig) {
    this.config = config;
    this.initializeResourceTypes();
    this.startMonitoring();
    this.startCleanup();
  }

  /**
   * Initialize resource types and their strategies
   */
  private initializeResourceTypes(): void {
    const resourceTypes: string[] = ['memory', 'cpu', 'network', 'api', 'disk'];
    
    resourceTypes.forEach(type => {
      this.usageHistory.set(type, []);
      this.allocationStrategies.set(type, new FairAllocationStrategy());
    });
  }

  /**
   * Request resource allocation
   */
  async requestResource(request: ResourceRequest): Promise<AllocationResult> {
    const startTime = Date.now();
    
    // Check immediate availability
    if (this.canAllocateImmediately(request)) {
      const allocation = await this.allocateResource(request);
      return {
        requestId: request.id,
        status: 'success' as const,
        success: true,
        allocatedResources: { [allocation.resourceType]: allocation.allocatedAmount },
        allocation,
        timestamp: new Date(),
        waitTime: Date.now() - startTime
      };
    }

    // Add to queue if can't allocate immediately
    this.requestQueue.push(request);
    this.sortRequestQueue();

    // Wait for allocation or timeout
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.removeFromQueue(request.id);
        resolve({
          requestId: request.id,
          status: 'failed' as const,
          success: false,
          allocatedResources: {},
          error: 'Request timed out',
          timestamp: new Date(),
          waitTime: Date.now() - startTime
        });
      }, request.timeout);

      // Check queue periodically
      const checkInterval = setInterval(() => {
        if (this.canAllocateImmediately(request)) {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          this.removeFromQueue(request.id);
          
          this.allocateResource(request).then(allocation => {
            resolve({
              requestId: request.id,
              status: 'success' as const,
              success: true,
              allocatedResources: { [allocation.resourceType]: allocation.allocatedAmount },
              allocation,
              timestamp: new Date(),
              waitTime: Date.now() - startTime
            });
          });
        }
      }, 100);
    });
  }

  /**
   * Release allocated resource
   */
  async releaseResource(allocationId: string): Promise<boolean> {
    const allocation = this.allocations.get(allocationId);
    if (!allocation) {
      return false;
    }

    this.allocations.delete(allocationId);
    this.recordUsage(allocation.resourceType, this.getCurrentUsage(allocation.resourceType));

    // Process queue after release
    await this.processQueue();

    return true;
  }

  /**
   * Check if resource can be allocated immediately
   */
  private canAllocateImmediately(request: ResourceRequest): boolean {
    const currentUsage = this.getCurrentUsage(request.type);
    const limit = this.getResourceLimit(request.type);
    
    return currentUsage + request.amount <= limit;
  }

  /**
   * Allocate resource
   */
  private async allocateResource(request: ResourceRequest): Promise<ResourceAllocation> {
    const allocation: ResourceAllocation = {
      resourceId: `${request.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resourceType: request.type,
      allocatedAmount: request.amount,
      maxAvailable: this.getResourceLimit(request.type),
      currentUsage: this.getCurrentUsage(request.type) + request.amount,
      allocatedAt: Date.now(),
      ownerId: request.requesterActorId
    };

    this.allocations.set(allocation.resourceId, allocation);
    this.recordUsage(request.type, allocation.currentUsage);

    return allocation;
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
   * Get resource limit based on type
   */
  private getResourceLimit(resourceType: string): number {
    switch (resourceType) {
      case 'memory': return this.config.memoryLimit;
      case 'api': return this.config.maxApiRequests;
      case 'connection': return this.config.connectionPoolSize;
      case 'computation': return 100; // CPU percentage
      default: return 100;
    }
  }

  /**
   * Sort request queue by priority and wait time
   */
  private sortRequestQueue(): void {
    this.requestQueue.sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Earlier requests first (FIFO for same priority)
      return a.requestedAt - b.requestedAt;
    });
  }

  /**
   * Remove request from queue
   */
  private removeFromQueue(requestId: string): void {
    const index = this.requestQueue.findIndex(req => req.id === requestId);
    if (index >= 0) {
      this.requestQueue.splice(index, 1);
    }
  }

  /**
   * Process waiting queue
   */
  private async processQueue(): Promise<void> {
    const processableRequests = this.requestQueue.filter(request => 
      this.canAllocateImmediately(request)
    );

    for (const request of processableRequests) {
      this.removeFromQueue(request.id);
      await this.allocateResource(request);
    }
  }

  /**
   * Record resource usage for metrics
   */
  private recordUsage(resourceType: string, usage: number): void {
    const history = this.usageHistory.get(resourceType) || [];
    const usagePoint: ResourceUsagePoint = {
      timestamp: Date.now(),
      usage,
      allocations: this.getAllocationsForType(resourceType).length,
      activeActors: this.getActiveActorsForType(resourceType)
    };

    history.push(usagePoint);

    // Keep only last 1000 points
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    this.usageHistory.set(resourceType, history);
  }

  /**
   * Get allocations for specific resource type
   */
  private getAllocationsForType(resourceType: ResourceTypeId): ResourceAllocation[] {
    return Array.from(this.allocations.values()).filter(
      allocation => allocation.resourceType === resourceType
    );
  }

  /**
   * Get active actors for resource type
   */
  private getActiveActorsForType(resourceType: ResourceTypeId): number {
    const actorIds = new Set();
    for (const allocation of this.allocations.values()) {
      if (allocation.resourceType === resourceType) {
        actorIds.add(allocation.ownerId);
      }
    }
    return actorIds.size;
  }

  /**
   * Start resource monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateResourceMetrics();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update resource metrics
   */
  private updateResourceMetrics(): void {
    for (const resourceType of this.usageHistory.keys()) {
      const currentUsage = this.getCurrentUsage(resourceType);
      this.recordUsage(resourceType, currentUsage);
    }
  }

  /**
   * Start cleanup process
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Perform resource cleanup
   */
  private performCleanup(): void {
    const now = Date.now();
    const expiredAllocations: string[] = [];

    for (const [id, allocation] of this.allocations.entries()) {
      // Check if allocation has expired (configurable timeout)
      const allocationAge = now - allocation.allocatedAt;
      if (allocationAge > 300000) { // 5 minutes default
        expiredAllocations.push(id);
      }
    }

    // Release expired allocations
    expiredAllocations.forEach(id => this.releaseResource(id));
  }

  /**
   * Get resource usage metrics
   */
  getUsageMetrics(resourceType?: ResourceTypeId): Map<ResourceTypeId, ResourceUsageMetrics> {
    const metrics = new Map<ResourceTypeId, ResourceUsageMetrics>();

    const typesToProcess = resourceType ? [resourceType] : Array.from(this.usageHistory.keys());

    for (const type of typesToProcess) {
      const history = this.usageHistory.get(type) || [];
      if (history.length === 0) continue;

      const currentUsage = this.getCurrentUsage(type);
      const totalAvailable = this.getResourceLimit(type);
      const usageValues = history.map(point => point.usage);
      
      const peakUsage = Math.max(...usageValues);
      const averageUsage = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length;
      const allocationEfficiency = currentUsage > 0 ? (averageUsage / totalAvailable) * 100 : 100;

      metrics.set(type, {
        resourceType: type,
        totalAvailable,
        currentlyAllocated: currentUsage,
        peakUsage,
        averageUsage,
        allocationEfficiency,
        usageHistory: history
      });
    }

    return metrics;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number;
    averageWaitTime: number;
    requestsByType: Map<ResourceTypeId, number>;
  } {
    const requestsByType = new Map<ResourceTypeId, number>();
    
    for (const request of this.requestQueue) {
      const count = requestsByType.get(request.type) || 0;
      requestsByType.set(request.type, count + 1);
    }

    return {
      queueLength: this.requestQueue.length,
      averageWaitTime: this.calculateAverageWaitTime(),
      requestsByType
    };
  }

  /**
   * Calculate average wait time
   */
  private calculateAverageWaitTime(): number {
    if (this.requestQueue.length === 0) return 0;

    const now = Date.now();
    const totalWaitTime = this.requestQueue.reduce((sum, request) => 
      sum + (now - request.requestedAt), 0);

    return totalWaitTime / this.requestQueue.length;
  }

  /**
   * Optimize resource allocation
   */
  optimizeAllocation(): OptimizationResult {
    const recommendations: OptimizationRecommendation[] = [];
    
    for (const [type, metrics] of this.getUsageMetrics().entries()) {
      if (metrics.allocationEfficiency < 70) {
        recommendations.push({
          resourceType: type,
          currentEfficiency: metrics.allocationEfficiency,
          recommendation: 'Consider reducing resource limits or optimizing usage patterns',
          potentialSavings: (100 - metrics.allocationEfficiency) / 100 * metrics.totalAvailable
        });
      }
      
      if (metrics.peakUsage > metrics.totalAvailable * 0.9) {
        recommendations.push({
          resourceType: type,
          currentEfficiency: metrics.allocationEfficiency,
          recommendation: 'Consider increasing resource limits to avoid bottlenecks',
          potentialSavings: 0
        });
      }
    }

    return {
      totalRecommendations: recommendations.length,
      recommendations,
      estimatedSavings: recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0)
    };
  }

  /**
   * Cleanup and destroy pool
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Release all allocations
    for (const allocationId of this.allocations.keys()) {
      this.releaseResource(allocationId);
    }

    this.allocations.clear();
    this.usageHistory.clear();
    this.requestQueue.length = 0;
  }
}

// ================================
// ALLOCATION STRATEGIES
// ================================

/**
 * Base allocation strategy interface
 */
interface AllocationStrategy {
  canAllocate(request: ResourceRequest, currentUsage: number, limit: number): boolean;
  getPriority(request: ResourceRequest): number;
}

/**
 * Fair allocation strategy - equal opportunity for all requesters
 */
class FairAllocationStrategy implements AllocationStrategy {
  canAllocate(request: ResourceRequest, currentUsage: number, limit: number): boolean {
    return currentUsage + request.amount <= limit;
  }

  getPriority(request: ResourceRequest): number {
    return request.priority;
  }
}

/**
 * Priority-based allocation strategy
 */
class PriorityAllocationStrategy implements AllocationStrategy {
  canAllocate(request: ResourceRequest, currentUsage: number, limit: number): boolean {
    // Allow high priority requests to exceed limits slightly
    const allowedOverage = request.priority > 8 ? limit * 0.1 : 0;
    return currentUsage + request.amount <= limit + allowedOverage;
  }

  getPriority(request: ResourceRequest): number {
    return request.priority * 10; // Amplify priority differences
  }
}

/**
 * Adaptive allocation strategy - adjusts based on historical usage
 */
class AdaptiveAllocationStrategy implements AllocationStrategy {
  private usageHistory: ResourceUsagePoint[] = [];

  canAllocate(request: ResourceRequest, currentUsage: number, limit: number): boolean {
    const adaptiveLimit = this.calculateAdaptiveLimit(limit);
    return currentUsage + request.amount <= adaptiveLimit;
  }

  getPriority(request: ResourceRequest): number {
    return request.priority;
  }

  private calculateAdaptiveLimit(baseLimit: number): number {
    if (this.usageHistory.length < 10) {
      return baseLimit;
    }

    const recentUsage = this.usageHistory.slice(-10);
    const averageUsage = recentUsage.reduce((sum, point) => sum + point.usage, 0) / recentUsage.length;
    
    // Adjust limit based on recent usage patterns
    if (averageUsage < baseLimit * 0.5) {
      return baseLimit * 0.8; // Reduce limit if underutilized
    } else if (averageUsage > baseLimit * 0.8) {
      return baseLimit * 1.2; // Increase limit if highly utilized
    }
    
    return baseLimit;
  }

  updateUsageHistory(history: ResourceUsagePoint[]): void {
    this.usageHistory = history;
  }
}

// ================================
// RESOURCE MANAGER
// ================================

/**
 * Main resource manager coordinating multiple resource pools
 */
export class ResourceManager {
  private config: ResourceManagerConfig;
  private resourcePools: Map<ResourceTypeId, AdvancedResourcePool> = new Map();
  private throttlers: Map<ResourceTypeId, ResourceThrottler> = new Map();
  private globalMetrics: GlobalResourceMetrics;

  constructor(config: ResourceManagerConfig) {
    this.config = config;
    this.globalMetrics = new GlobalResourceMetrics();
    this.initializeResourcePools();
    this.initializeThrottlers();
  }

  /**
   * Initialize resource pools
   */
  private initializeResourcePools(): void {
    for (const [poolName, poolConfig] of Object.entries(this.config.pools)) {
      const resourceType = poolName as ResourceTypeId;
      const pool = new AdvancedResourcePool(poolConfig);
      this.resourcePools.set(resourceType, pool);
    }
  }

  /**
   * Initialize throttlers
   */
  private initializeThrottlers(): void {
    for (const resourceType of this.resourcePools.keys()) {
      const throttler = new ResourceThrottler(resourceType, {
        maxRequestsPerSecond: 10,
        burstSize: 5,
        windowSizeMs: 1000
      });
      this.throttlers.set(resourceType, throttler);
    }
  }

  /**
   * Request resource allocation
   */
  async requestResource(
    resourceType: ResourceTypeIdId,
    amount: number,
    actorId: string,
    priority: number = 5,
    timeout: number = 30000
  ): Promise<AllocationResult> {
    // Check throttling
    const throttler = this.throttlers.get(resourceType);
    if (throttler && !throttler.canProceed(actorId)) {
      return {
        requestId: `${actorId}-${Date.now()}`,
        status: 'failed' as const,
        success: false,
        allocatedResources: {},
        error: 'Request throttled',
        timestamp: new Date(),
        waitTime: 0
      };
    }

    const pool = this.resourcePools.get(resourceType);
    if (!pool) {
      return {
        success: false,
        error: `No pool available for resource type: ${resourceType}`,
        waitTime: 0
      };
    }

    const request: ResourceRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: resourceType,
      amount,
      priority,
      timeout,
      requesterActorId: actorId,
      requestedAt: Date.now()
    };

    const result = await pool.requestResource(request);
    
    // Update global metrics
    this.globalMetrics.recordRequest(resourceType, result.success);
    
    return result;
  }

  /**
   * Release resource allocation
   */
  async releaseResource(resourceType: ResourceTypeId, allocationId: string): Promise<boolean> {
    const pool = this.resourcePools.get(resourceType);
    if (!pool) {
      return false;
    }

    const released = await pool.releaseResource(allocationId);
    
    if (released) {
      this.globalMetrics.recordRelease(resourceType);
    }
    
    return released;
  }

  /**
   * Get resource usage metrics
   */
  getResourceMetrics(resourceType?: ResourceTypeId): Map<ResourceTypeId, ResourceUsageMetrics> {
    if (resourceType) {
      const pool = this.resourcePools.get(resourceType);
      return pool ? pool.getUsageMetrics(resourceType) : new Map();
    }

    const allMetrics = new Map<ResourceTypeId, ResourceUsageMetrics>();
    
    for (const [type, pool] of this.resourcePools.entries()) {
      const metrics = pool.getUsageMetrics(type);
      for (const [metricType, metric] of metrics.entries()) {
        allMetrics.set(metricType, metric);
      }
    }

    return allMetrics;
  }

  /**
   * Get global resource statistics
   */
  getGlobalMetrics(): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    resourceUtilization: Map<ResourceTypeId, number>;
  } {
    return this.globalMetrics.getMetrics();
  }

  /**
   * Optimize all resource pools
   */
  optimizeAllPools(): Map<ResourceTypeId, OptimizationResult> {
    const results = new Map<ResourceTypeId, OptimizationResult>();
    
    for (const [type, pool] of this.resourcePools.entries()) {
      results.set(type, pool.optimizeAllocation());
    }
    
    return results;
  }

  /**
   * Cleanup and destroy manager
   */
  destroy(): void {
    for (const pool of this.resourcePools.values()) {
      pool.destroy();
    }
    
    for (const throttler of this.throttlers.values()) {
      throttler.destroy();
    }
    
    this.resourcePools.clear();
    this.throttlers.clear();
  }
}

// ================================
// RESOURCE THROTTLER
// ================================

/**
 * Throttler for controlling resource request rates
 */
class ResourceThrottler {
  private resourceType: ResourceTypeId;
  private config: ThrottlerConfig;
  private requestCounts: Map<string, RequestCount> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(resourceType: ResourceTypeId, config: ThrottlerConfig) {
    this.resourceType = resourceType;
    this.config = config;
    this.startCleanup();
  }

  /**
   * Check if request can proceed
   */
  canProceed(actorId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowSizeMs;
    
    let requestCount = this.requestCounts.get(actorId);
    if (!requestCount) {
      requestCount = { count: 0, windowStart: now, requests: [] };
      this.requestCounts.set(actorId, requestCount);
    }

    // Clean old requests outside window
    requestCount.requests = requestCount.requests.filter(timestamp => timestamp > windowStart);
    requestCount.count = requestCount.requests.length;

    // Check burst limit
    if (requestCount.count >= this.config.burstSize) {
      return false;
    }

    // Check rate limit
    const rateLimit = this.config.maxRequestsPerSecond * (this.config.windowSizeMs / 1000);
    if (requestCount.count >= rateLimit) {
      return false;
    }

    // Record request
    requestCount.requests.push(now);
    requestCount.count++;

    return true;
  }

  /**
   * Start cleanup process
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const windowStart = now - this.config.windowSizeMs;

      for (const [actorId, requestCount] of this.requestCounts.entries()) {
        requestCount.requests = requestCount.requests.filter(timestamp => timestamp > windowStart);
        requestCount.count = requestCount.requests.length;

        // Remove empty entries
        if (requestCount.count === 0) {
          this.requestCounts.delete(actorId);
        }
      }
    }, this.config.windowSizeMs);
  }

  /**
   * Destroy throttler
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requestCounts.clear();
  }
}

// ================================
// GLOBAL METRICS TRACKER
// ================================

/**
 * Global resource metrics tracking
 */
class GlobalResourceMetrics {
  private requestCounts: Map<ResourceTypeId, number> = new Map();
  private successCounts: Map<ResourceTypeId, number> = new Map();
  private releaseCounts: Map<ResourceTypeId, number> = new Map();
  private responseTimes: Map<ResourceTypeId, number[]> = new Map();

  recordRequest(resourceType: ResourceTypeId, success: boolean): void {
    const requests = this.requestCounts.get(resourceType) || 0;
    this.requestCounts.set(resourceType, requests + 1);

    if (success) {
      const successes = this.successCounts.get(resourceType) || 0;
      this.successCounts.set(resourceType, successes + 1);
    }
  }

  recordRelease(resourceType: ResourceTypeId): void {
    const releases = this.releaseCounts.get(resourceType) || 0;
    this.releaseCounts.set(resourceType, releases + 1);
  }

  getMetrics(): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    resourceUtilization: Map<ResourceTypeId, number>;
  } {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0);
    const totalSuccesses = Array.from(this.successCounts.values()).reduce((sum, count) => sum + count, 0);
    const successRate = totalRequests > 0 ? (totalSuccesses / totalRequests) * 100 : 0;

    const resourceUtilization = new Map<ResourceTypeId, number>();
    for (const [type, requests] of this.requestCounts.entries()) {
      const releases = this.releaseCounts.get(type) || 0;
      const utilization = requests > 0 ? Math.max(0, requests - releases) : 0;
      resourceUtilization.set(type, utilization);
    }

    return {
      totalRequests,
      successRate,
      averageResponseTime: 0, // Would need to implement response time tracking
      resourceUtilization
    };
  }
}

// ================================
// TYPE DEFINITIONS
// ================================

interface ThrottlerConfig {
  maxRequestsPerSecond: number;
  burstSize: number;
  windowSizeMs: number;
}

interface RequestCount {
  count: number;
  windowStart: number;
  requests: number[];
}

interface OptimizationResult {
  totalRecommendations: number;
  recommendations: OptimizationRecommendation[];
  estimatedSavings: number;
}

interface OptimizationRecommendation {
  resourceType: string;
  currentEfficiency: number;
  recommendation: string;
  potentialSavings: number;
}

// ================================
// EXPORTS
// ================================

// Note: Types are exported from advanced-types.ts to avoid conflicts
// Only export the implementation class
export {
  AdvancedResourcePool
};