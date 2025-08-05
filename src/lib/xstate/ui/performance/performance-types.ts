/**
 * @fileoverview Performance Types - UI Integration Stub
 * 
 * This is a stub file to resolve TypeScript compilation errors.
 * It provides minimal types needed for UI performance monitoring
 * without full performance system implementation.
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
  /** Additional metadata */
  metadata?: Record<string, any>;
}