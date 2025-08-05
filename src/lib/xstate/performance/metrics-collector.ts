/**
 * @fileoverview Metrics Collector - Data Collection Utilities
 * 
 * High-performance metrics collection system with automatic
 * categorization and intelligent sampling.
 */

import { v4 as uuidv4 } from 'uuid';

interface CollectedMetric {
  id: string;
  timestamp: number;
  machineId: string;
  actorId?: string;
  metricType: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

interface CollectionRule {
  metricType: string;
  samplingRate: number;
  enabled: boolean;
  aggregationWindow: number;
  tags?: Record<string, string>;
}

interface MemorySnapshot {
  used: number;
  total: number;
  percentage: number;
}

/**
 * Advanced metrics collector with intelligent sampling
 * and automatic performance categorization
 */
export class MetricsCollector {
  private readonly collectionRules: Map<string, CollectionRule> = new Map();
  private readonly metricBuffer: CollectedMetric[] = [];
  private readonly aggregationCache: Map<string, number[]> = new Map();
  private collectionCount = 0;
  
  constructor(
    private readonly maxBufferSize: number = 10000,
    private readonly flushInterval: number = 60000 // 1 minute
  ) {
    this.initializeDefaultRules();
    this.startPeriodicFlush();
  }

  /**
   * Collect a performance metric with intelligent sampling
   */
  collect(
    machineId: string,
    metricType: string,
    value: number,
    unit: string,
    options: {
      actorId?: string;
      tags?: Record<string, string>;
      metadata?: Record<string, any>;
      forceCollection?: boolean;
    } = {}
  ): boolean {
    const rule = this.collectionRules.get(metricType);
    
    // Skip if rule disabled or doesn't exist
    if (!rule?.enabled && !options.forceCollection) {
      return false;
    }
    
    // Apply sampling rate
    if (!options.forceCollection && Math.random() > (rule?.samplingRate || 1.0)) {
      return false;
    }
    
    const metric: CollectedMetric = {
      id: uuidv4(),
      timestamp: Date.now(),
      machineId,
      actorId: options.actorId,
      metricType,
      value,
      unit,
      tags: {
        ...rule?.tags,
        ...options.tags
      },
      metadata: options.metadata
    };
    
    this.addToBuffer(metric);
    this.updateAggregationCache(metric);
    this.collectionCount++;
    
    return true;
  }

  /**
   * Collect execution time automatically
   */
  async collectExecutionTime<T>(
    machineId: string,
    operationType: string,
    operation: () => Promise<T>,
    options: {
      actorId?: string;
      tags?: Record<string, string>;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getMemorySnapshot();
    
    try {
      const result = await operation();
      const executionTime = performance.now() - startTime;
      const endMemory = this.getMemorySnapshot();
      
      // Collect execution time
      this.collect(machineId, 'execution_time', executionTime, 'milliseconds', {
        ...options,
        tags: { 
          ...options.tags, 
          operationType,
          success: 'true'
        },
        metadata: {
          ...options.metadata,
          startTime,
          memoryDelta: endMemory.used - startMemory.used
        }
      });
      
      // Collect memory usage if significant change
      const memoryDelta = endMemory.used - startMemory.used;
      if (Math.abs(memoryDelta) > 1024 * 1024) { // > 1MB change
        this.collect(machineId, 'memory_usage', memoryDelta, 'bytes', {
          ...options,
          tags: { 
            ...options.tags, 
            operationType,
            memoryChangeType: memoryDelta > 0 ? 'increase' : 'decrease'
          }
        });
      }
      
      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      // Collect failed execution time
      this.collect(machineId, 'execution_time', executionTime, 'milliseconds', {
        ...options,
        tags: { 
          ...options.tags, 
          operationType,
          success: 'false',
          errorType: error instanceof Error ? error.name : 'unknown'
        }
      });
      
      // Collect error count
      this.collect(machineId, 'error_count', 1, 'count', {
        ...options,
        tags: { 
          ...options.tags, 
          operationType,
          errorType: error instanceof Error ? error.name : 'unknown'
        },
        metadata: {
          ...options.metadata,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });
      
      throw error;
    }
  }

  /**
   * Collect API request metrics
   */
  collectApiMetrics(
    machineId: string,
    endpoint: string,
    responseTime: number,
    statusCode: number,
    options: {
      actorId?: string;
      method?: string;
      tags?: Record<string, string>;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    // Response time
    this.collect(machineId, 'api_response_time', responseTime, 'milliseconds', {
      ...options,
      tags: {
        ...options.tags,
        endpoint,
        method: options.method || 'GET',
        statusCode: statusCode.toString(),
        statusCategory: this.getStatusCategory(statusCode)
      }
    });
    
    // Request count
    this.collect(machineId, 'api_request_count', 1, 'count', {
      ...options,
      tags: {
        ...options.tags,
        endpoint,
        method: options.method || 'GET',
        statusCode: statusCode.toString()
      }
    });
    
    // Error count for non-2xx responses
    if (statusCode >= 400) {
      this.collect(machineId, 'error_count', 1, 'count', {
        ...options,
        tags: {
          ...options.tags,
          endpoint,
          errorType: 'api_error',
          statusCode: statusCode.toString()
        }
      });
    }
  }

  /**
   * Collect state transition metrics
   */
  collectStateTransition(
    machineId: string,
    fromState: string,
    toState: string,
    transitionTime: number,
    options: {
      actorId?: string;
      eventType?: string;
      tags?: Record<string, string>;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    this.collect(machineId, 'state_transition_count', 1, 'count', {
      ...options,
      tags: {
        ...options.tags,
        fromState,
        toState,
        eventType: options.eventType || 'unknown'
      }
    });
    
    if (transitionTime > 0) {
      this.collect(machineId, 'state_transition_time', transitionTime, 'milliseconds', {
        ...options,
        tags: {
          ...options.tags,
          fromState,
          toState,
          eventType: options.eventType || 'unknown'
        }
      });
    }
  }

  /**
   * Collect context update metrics
   */
  collectContextUpdate(
    machineId: string,
    updateCount: number,
    updateTime: number,
    options: {
      actorId?: string;
      updateType?: string;
      fieldsUpdated?: string[];
      tags?: Record<string, string>;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    this.collect(machineId, 'context_update_time', updateTime, 'milliseconds', {
      ...options,
      tags: {
        ...options.tags,
        updateType: options.updateType || 'batch',
        fieldCount: options.fieldsUpdated?.length?.toString() || '0'
      },
      metadata: {
        ...options.metadata,
        fieldsUpdated: options.fieldsUpdated
      }
    });
    
    this.collect(machineId, 'context_update_count', updateCount, 'count', {
      ...options,
      tags: {
        ...options.tags,
        updateType: options.updateType || 'batch'
      }
    });
  }

  /**
   * Configure collection rules
   */
  setCollectionRule(metricType: string, rule: Partial<CollectionRule>): void {
    const existingRule = this.collectionRules.get(metricType);
    this.collectionRules.set(metricType, {
      metricType,
      samplingRate: 1.0,
      enabled: true,
      aggregationWindow: 60000,
      ...existingRule,
      ...rule
    });
  }

  /**
   * Get collected metrics
   */
  getMetrics(since?: number): CollectedMetric[] {
    if (!since) return [...this.metricBuffer];
    
    return this.metricBuffer.filter(metric => metric.timestamp >= since);
  }

  /**
   * Get aggregated values for a metric type
   */
  getAggregatedValue(metricType: string, aggregationType: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'avg'): number | null {
    const values = this.aggregationCache.get(metricType);
    if (!values || values.length === 0) return null;
    
    switch (aggregationType) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
  }

  /**
   * Clear collected metrics
   */
  flush(): CollectedMetric[] {
    const metrics = [...this.metricBuffer];
    this.metricBuffer.length = 0;
    this.aggregationCache.clear();
    return metrics;
  }

  /**
   * Get collection statistics
   */
  getStats(): {
    totalCollected: number;
    bufferSize: number;
    enabledRules: number;
    recentCollectionRate: number;
  } {
    return {
      totalCollected: this.collectionCount,
      bufferSize: this.metricBuffer.length,
      enabledRules: Array.from(this.collectionRules.values()).filter(r => r.enabled).length,
      recentCollectionRate: this.calculateRecentCollectionRate()
    };
  }

  /**
   * Initialize default collection rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: Array<[string, Partial<CollectionRule>]> = [
      ['execution_time', { samplingRate: 1.0, enabled: true }],
      ['memory_usage', { samplingRate: 0.5, enabled: true }],
      ['api_response_time', { samplingRate: 1.0, enabled: true }],
      ['api_request_count', { samplingRate: 1.0, enabled: true }],
      ['error_count', { samplingRate: 1.0, enabled: true }],
      ['state_transition_count', { samplingRate: 1.0, enabled: true }],
      ['state_transition_time', { samplingRate: 0.8, enabled: true }],
      ['context_update_time', { samplingRate: 0.7, enabled: true }],
      ['context_update_count', { samplingRate: 1.0, enabled: true }],
      ['cpu_usage', { samplingRate: 0.3, enabled: false }], // Disabled by default (expensive)
      ['throughput', { samplingRate: 1.0, enabled: true }],
      ['cache_hit_ratio', { samplingRate: 0.5, enabled: true }]
    ];
    
    defaultRules.forEach(([metricType, rule]) => {
      this.setCollectionRule(metricType, rule);
    });
  }

  /**
   * Add metric to buffer with overflow management
   */
  private addToBuffer(metric: CollectedMetric): void {
    this.metricBuffer.push(metric);
    
    // Maintain buffer size limit
    if (this.metricBuffer.length > this.maxBufferSize) {
      // Remove oldest 20% of metrics
      const removeCount = Math.floor(this.maxBufferSize * 0.2);
      this.metricBuffer.splice(0, removeCount);
    }
  }

  /**
   * Update aggregation cache for fast queries
   */
  private updateAggregationCache(metric: CollectedMetric): void {
    if (!this.aggregationCache.has(metric.metricType)) {
      this.aggregationCache.set(metric.metricType, []);
    }
    
    const values = this.aggregationCache.get(metric.metricType)!;
    values.push(metric.value);
    
    // Keep only recent values (last 100)
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Get memory snapshot
   */
  private getMemorySnapshot(): MemorySnapshot {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        used: usage.heapUsed,
        total: usage.heapTotal,
        percentage: (usage.heapUsed / usage.heapTotal) * 100
      };
    }
    
    // Browser fallback (approximate)
    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  /**
   * Get HTTP status category
   */
  private getStatusCategory(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 300 && statusCode < 400) return 'redirect';
    if (statusCode >= 400 && statusCode < 500) return 'client_error';
    if (statusCode >= 500) return 'server_error';
    return 'unknown';
  }

  /**
   * Calculate recent collection rate
   */
  private calculateRecentCollectionRate(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentMetrics = this.metricBuffer.filter(m => m.timestamp >= oneMinuteAgo);
    return recentMetrics.length / 60; // metrics per second
  }

  /**
   * Start periodic buffer flush
   */
  private startPeriodicFlush(): void {
    setInterval(() => {
      if (this.metricBuffer.length > this.maxBufferSize * 0.8) {
        console.log(`MetricsCollector: Buffer approaching limit (${this.metricBuffer.length}/${this.maxBufferSize}), considering flush`);
      }
    }, this.flushInterval);
  }
}

/**
 * Factory function to create a metrics collector
 */
export function createMetricsCollector(
  maxBufferSize: number = 10000,
  flushInterval: number = 60000
): MetricsCollector {
  return new MetricsCollector(maxBufferSize, flushInterval);
}

/**
 * StockSage-optimized metrics collector
 */
export function createStockSageMetricsCollector(): MetricsCollector {
  const collector = createMetricsCollector(5000, 30000); // Smaller buffer, faster flush
  
  // Configure rules for financial data processing
  collector.setCollectionRule('ai_analysis_time', {
    samplingRate: 1.0,
    enabled: true,
    tags: { category: 'ai' }
  });
  
  collector.setCollectionRule('data_fetch_time', {
    samplingRate: 1.0,
    enabled: true,
    tags: { category: 'data' }
  });
  
  collector.setCollectionRule('options_processing_time', {
    samplingRate: 1.0,
    enabled: true,
    tags: { category: 'options' }
  });
  
  return collector;
}

export default MetricsCollector;
