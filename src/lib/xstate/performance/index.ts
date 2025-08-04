/**
 * @fileoverview Performance Monitoring System - Phase 4 Task 2
 * 
 * Complete performance monitoring and analytics system for XState machines
 * with comprehensive metrics collection and real-time analysis.
 */

// Core exports
export { PerformanceMonitor, createPerformanceMonitor, createStockSagePerformanceMonitor } from "./performance-monitor";
export { MetricsCollector, createMetricsCollector, createStockSageMetricsCollector } from "./metrics-collector";
export { AnalyticsEngine, createAnalyticsEngine } from "./analytics-engine";

// Type exports
export type { PerformanceMetric, PerformanceMonitorConfig, AnalyticsEngine as IAnalyticsEngine } from "./performance-types";
export { DEFAULT_CONFIG } from "./performance-types";

/**
 * Complete Performance Monitoring Factory
 */
export function createCompletePerformanceMonitoring(machineId: string) {
  const monitor = createPerformanceMonitor(`monitor-${machineId}`);
  const collector = createMetricsCollector();
  const analytics = createAnalyticsEngine(`analytics-${machineId}`);
  
  return {
    monitor,
    collector,
    analytics,
    
    start: () => {
      monitor.start();
      console.log(`Performance monitoring started for ${machineId}`);
    },
    
    stop: () => {
      monitor.stop();
      console.log(`Performance monitoring stopped for ${machineId}`);
    },
    
    analyze: (metrics: any[]) => {
      return analytics.analyzePerformance(metrics);
    }
  };
}

/**
 * StockSage Performance Monitoring Setup
 */
export function createStockSagePerformanceMonitoring() {
  const nvdaMonitoring = createCompletePerformanceMonitoring("nvda-analysis");
  const spyMonitoring = createCompletePerformanceMonitoring("spy-analysis");
  const macroMonitoring = createCompletePerformanceMonitoring("macro-execution");
  
  return {
    nvda: nvdaMonitoring,
    spy: spyMonitoring,
    macro: macroMonitoring,
    
    startAll: () => {
      nvdaMonitoring.start();
      spyMonitoring.start();
      macroMonitoring.start();
    },
    
    stopAll: () => {
      nvdaMonitoring.stop();
      spyMonitoring.stop();
      macroMonitoring.stop();
    }
  };
}

export default {
  createCompletePerformanceMonitoring,
  createStockSagePerformanceMonitoring
};
