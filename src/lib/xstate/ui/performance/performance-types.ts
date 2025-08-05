/**
 * @fileoverview Performance Types - UI Integration Complete
 * 
 * Complete performance types with all required properties for UI performance monitoring.
 * Fixes all interface violations and property access errors in use-performance-monitor.ts.
 * 
 * @updated Phase 4.5C - Fixed interface violations for MetricsSnapshot
 * @version 1.0.1
 */

export interface PerformanceMetrics {
  /** Total execution duration in milliseconds */
  totalDuration: number;
  /** Duration of each individual step */
  stepDurations: Record<string, number>;
  /** Total number of retry attempts */
  retryCount: number;
  /** Number of operations that hit timeout */
  timeoutCount: number;
  /** Memory usage snapshot */
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface MetricsSnapshot {
  /** Snapshot timestamp */
  timestamp: Date;
  /** Performance metrics at this point in time */
  metrics: PerformanceMetrics;
  /** Average response time in milliseconds - accessed directly in hooks */
  averageResponseTime: number;
  /** Memory usage percentage - accessed directly in hooks */
  memoryUsage: number;
  /** Error rate percentage - accessed directly in hooks */
  errorRate: number;
  /** Operations per second - accessed directly in hooks */
  operationsPerSecond: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}
