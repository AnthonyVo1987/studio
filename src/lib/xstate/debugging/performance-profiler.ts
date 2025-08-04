/**
 * @fileOverview Performance Profiler for XState Debugging
 * 
 * Advanced performance analysis and bottleneck identification for XState machines.
 * Provides detailed metrics, profiling sessions, and optimization recommendations.
 * Integrates with existing performance monitoring and debugging infrastructure.
 */

import type {
  PerformanceMonitorConfiguration,
  PerformanceThresholds,
  PerformanceReport,
  PerformanceMetric,
  PerformanceBottleneck,
  PerformanceSummary,
  MachineSnapshot,
  StateTransition
} from './debugging-types';
import type { MacroExecutionContext } from '../types/macro-types';
import { createTickerLogger, generateExecutionId } from '../../ticker-logger';
import { globalAdvancedLogger } from './advanced-logger';

// ================================
// PERFORMANCE PROFILER CONFIGURATION
// ================================

export const DEFAULT_PROFILER_CONFIG: PerformanceMonitorConfiguration = {
  enabled: process.env.NODE_ENV === 'development',
  samplingRate: 0.1, // 10% sampling
  metricsInterval: 1000, // 1 second
  enableMemoryTracking: true,
  enableCpuTracking: true,
  enableNetworkTracking: false,
  enableCustomMetrics: true,
  thresholds: {
    transitionTime: 100, // ms
    memoryUsage: 50 * 1024 * 1024, // 50MB
    cpuUsage: 80, // 80%
    gcFrequency: 10, // per minute
    networkLatency: 1000 // ms
  }
};

// ================================
// PERFORMANCE METRICS COLLECTOR
// ================================

interface MetricSample {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

interface MetricSeries {
  name: string;
  unit: string;
  category: PerformanceMetric['category'];
  samples: MetricSample[];
  threshold?: number;
  aggregatedValue?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export class PerformanceMetricsCollector {
  private metrics: Map<string, MetricSeries> = new Map();
  private config: PerformanceMonitorConfiguration;
  private logger = createTickerLogger('SYSTEM', 'PerfCollector', generateExecutionId('collector'));
  private collectionInterval?: NodeJS.Timer;
  private performanceObserver?: PerformanceObserver;

  constructor(config: Partial<PerformanceMonitorConfiguration> = {}) {
    this.config = { ...DEFAULT_PROFILER_CONFIG, ...config };
    
    if (this.config.enabled) {
      this.initializeCollection();
    }
  }

  private initializeCollection(): void {
    this.logger.info('Initialize', 'Starting performance metrics collection', {
      samplingRate: this.config.samplingRate,
      interval: this.config.metricsInterval
    });

    // Start periodic collection
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.metricsInterval);

    // Initialize Performance Observer for web APIs
    if (typeof PerformanceObserver !== 'undefined') {
      this.initializePerformanceObserver();
    }

    // Initialize custom metrics
    this.initializeCustomMetrics();
  }

  private initializePerformanceObserver(): void {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordWebAPIMetric(entry);
        }
      });

      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'navigation', 'resource', 'mark'] 
      });
    } catch (error) {
      this.logger.warn('InitPerformanceObserver', 'Could not initialize PerformanceObserver', error);
    }
  }

  private initializeCustomMetrics(): void {
    // Initialize standard metrics
    this.createMetric('transition_time', 'ms', 'custom', this.config.thresholds.transitionTime);
    this.createMetric('memory_heap_used', 'bytes', 'memory', this.config.thresholds.memoryUsage);
    this.createMetric('cpu_usage', '%', 'cpu', this.config.thresholds.cpuUsage);
    this.createMetric('gc_frequency', 'per_minute', 'memory', this.config.thresholds.gcFrequency);
    
    if (this.config.enableNetworkTracking) {
      this.createMetric('network_latency', 'ms', 'network', this.config.thresholds.networkLatency);
    }
  }

  private createMetric(
    name: string, 
    unit: string, 
    category: PerformanceMetric['category'], 
    threshold?: number
  ): void {
    this.metrics.set(name, {
      name,
      unit,
      category,
      samples: [],
      threshold,
      aggregatedValue: 0,
      trend: 'stable'
    });
  }

  recordMetric(
    name: string, 
    value: number, 
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enabled) return;

    // Apply sampling rate
    if (Math.random() > this.config.samplingRate) return;

    let metric = this.metrics.get(name);
    if (!metric) {
      // Auto-create custom metric
      metric = {
        name,
        unit: 'unknown',
        category: 'custom',
        samples: [],
        aggregatedValue: 0,
        trend: 'stable'
      };
      this.metrics.set(name, metric);
    }

    const sample: MetricSample = {
      timestamp: Date.now(),
      value,
      metadata
    };

    metric.samples.push(sample);

    // Keep only recent samples (last 1000)
    if (metric.samples.length > 1000) {
      metric.samples = metric.samples.slice(-1000);
    }

    // Update aggregated value and trend
    this.updateMetricAnalysis(metric);

    // Log threshold violations
    if (metric.threshold && value > metric.threshold) {
      this.logger.warn('ThresholdViolation', `Metric ${name} exceeded threshold`, {
        value,
        threshold: metric.threshold,
        unit: metric.unit
      });
    }
  }

  private updateMetricAnalysis(metric: MetricSeries): void {
    if (metric.samples.length < 2) return;

    // Calculate aggregated value (recent average)
    const recentSamples = metric.samples.slice(-10); // Last 10 samples
    metric.aggregatedValue = recentSamples.reduce((sum, sample) => sum + sample.value, 0) / recentSamples.length;

    // Determine trend
    if (metric.samples.length >= 5) {
      const older = metric.samples.slice(-10, -5);
      const newer = metric.samples.slice(-5);
      
      const olderAvg = older.reduce((sum, s) => sum + s.value, 0) / older.length;
      const newerAvg = newer.reduce((sum, s) => sum + s.value, 0) / newer.length;
      
      const changePercent = (newerAvg - olderAvg) / olderAvg * 100;
      
      if (changePercent > 10) {
        metric.trend = 'increasing';
      } else if (changePercent < -10) {
        metric.trend = 'decreasing';
      } else {
        metric.trend = 'stable';
      }
    }
  }

  private collectSystemMetrics(): void {
    // Memory metrics (Node.js)
    if (this.config.enableMemoryTracking && typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      this.recordMetric('memory_heap_used', memUsage.heapUsed);
      this.recordMetric('memory_heap_total', memUsage.heapTotal);
      this.recordMetric('memory_external', memUsage.external);
      this.recordMetric('memory_rss', memUsage.rss);
    }

    // CPU metrics (simplified)
    if (this.config.enableCpuTracking && typeof process !== 'undefined' && process.cpuUsage) {
      const cpuUsage = process.cpuUsage();
      const totalCPU = cpuUsage.user + cpuUsage.system;
      this.recordMetric('cpu_usage', totalCPU / 1000); // Convert to ms
    }

    // Browser memory metrics
    if (this.config.enableMemoryTracking && typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_used_js_heap_size', memory.usedJSHeapSize);
      this.recordMetric('memory_total_js_heap_size', memory.totalJSHeapSize);
      this.recordMetric('memory_js_heap_size_limit', memory.jsHeapSizeLimit);
    }
  }

  private recordWebAPIMetric(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'measure':
        if (entry.name.startsWith('xstate-')) {
          this.recordMetric(`measure_${entry.name}`, entry.duration, {
            entryType: entry.entryType,
            startTime: entry.startTime
          });
        }
        break;
        
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.recordMetric('navigation_dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
        this.recordMetric('navigation_load_complete', navEntry.loadEventEnd - navEntry.loadEventStart);
        break;
        
      case 'resource':
        if (entry.name.includes('api/') || entry.name.includes('socket')) {
          this.recordMetric('resource_duration', entry.duration, {
            resource: entry.name,
            entryType: entry.entryType
          });
        }
        break;
    }
  }

  recordStateTransition(transition: StateTransition): void {
    this.recordMetric('transition_time', transition.duration, {
      from: transition.from,
      to: transition.to,
      machineId: transition.machineId,
      success: transition.success
    });

    // Record action execution times
    transition.actions.forEach(action => {
      this.recordMetric('action_execution_time', action.executionTime, {
        actionName: action.name,
        actionType: action.type,
        success: action.success
      });
    });

    // Record guard evaluation times
    transition.guards.forEach(guard => {
      this.recordMetric('guard_evaluation_time', guard.evaluationTime, {
        guardName: guard.name,
        result: guard.result
      });
    });
  }

  recordMachineSnapshot(snapshot: MachineSnapshot): void {
    this.recordMetric('snapshot_capture_time', snapshot.performance.captureTime, {
      machineId: snapshot.machineId,
      contextSize: snapshot.performance.contextSize
    });

    this.recordMetric('context_size', snapshot.performance.contextSize, {
      machineId: snapshot.machineId
    });

    this.recordMetric('machine_uptime', snapshot.performance.machineUptime, {
      machineId: snapshot.machineId
    });
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).map(metric => ({
      name: metric.name,
      value: metric.aggregatedValue || 0,
      unit: metric.unit,
      category: metric.category,
      threshold: metric.threshold,
      exceeded: metric.threshold ? (metric.aggregatedValue || 0) > metric.threshold : false
    }));
  }

  getMetricHistory(name: string, maxSamples: number = 100): MetricSample[] {
    const metric = this.metrics.get(name);
    if (!metric) return [];
    
    return metric.samples.slice(-maxSamples);
  }

  getMetricTrend(name: string): 'increasing' | 'decreasing' | 'stable' | null {
    const metric = this.metrics.get(name);
    return metric?.trend || null;
  }

  clearMetrics(name?: string): void {
    if (name) {
      const metric = this.metrics.get(name);
      if (metric) {
        metric.samples = [];
        metric.aggregatedValue = 0;
        metric.trend = 'stable';
      }
    } else {
      this.metrics.forEach(metric => {
        metric.samples = [];
        metric.aggregatedValue = 0;
        metric.trend = 'stable';
      });
    }
    
    this.logger.debug('ClearMetrics', name ? `Cleared metric: ${name}` : 'Cleared all metrics');
  }

  destroy(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.metrics.clear();
    this.logger.info('Destroy', 'Performance metrics collector destroyed');
  }
}

// ================================
// PERFORMANCE PROFILER
// ================================

interface ProfilingSession {
  id: string;
  machineId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metrics: PerformanceMetric[];
  bottlenecks: PerformanceBottleneck[];
  recommendations: string[];
}

export class PerformanceProfiler {
  private collector: PerformanceMetricsCollector;
  private logger = createTickerLogger('SYSTEM', 'Profiler', generateExecutionId('profiler'));
  private activeSessions: Map<string, ProfilingSession> = new Map();
  private config: PerformanceMonitorConfiguration;

  constructor(config: Partial<PerformanceMonitorConfiguration> = {}) {
    this.config = { ...DEFAULT_PROFILER_CONFIG, ...config };
    this.collector = new PerformanceMetricsCollector(config);
  }

  startProfiling(machineId: string): string {
    const sessionId = generateExecutionId('profile');
    
    const session: ProfilingSession = {
      id: sessionId,
      machineId,
      startTime: Date.now(),
      metrics: [],
      bottlenecks: [],
      recommendations: []
    };

    this.activeSessions.set(sessionId, session);
    
    this.logger.info('StartProfiling', `Started profiling session for machine: ${machineId}`, {
      sessionId
    });

    return sessionId;
  }

  stopProfiling(sessionId: string): PerformanceReport {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`No active profiling session found: ${sessionId}`);
    }

    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // Collect final metrics
    session.metrics = this.collector.getMetrics();

    // Analyze bottlenecks
    session.bottlenecks = this.analyzeBottlenecks(session);

    // Generate recommendations
    session.recommendations = this.generateRecommendations(session);

    this.activeSessions.delete(sessionId);

    const report: PerformanceReport = {
      id: sessionId,
      timestamp: session.endTime,
      machineId: session.machineId,
      duration: session.duration,
      metrics: session.metrics,
      bottlenecks: session.bottlenecks,
      recommendations: session.recommendations,
      summary: this.generateSummary(session)
    };

    this.logger.info('StopProfiling', `Completed profiling session: ${sessionId}`, {
      duration: session.duration,
      metricsCount: session.metrics.length,
      bottlenecksFound: session.bottlenecks.length
    });

    return report;
  }

  private analyzeBottlenecks(session: ProfilingSession): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];

    // Analyze each metric for bottlenecks
    session.metrics.forEach(metric => {
      if (metric.threshold && metric.exceeded) {
        const severity = this.calculateSeverity(metric.value, metric.threshold);
        const impact = this.calculateImpact(metric);
        
        bottlenecks.push({
          location: `Metric: ${metric.name}`,
          type: metric.category,
          severity,
          impact,
          suggestion: this.getSuggestionForMetric(metric)
        });
      }
    });

    // Look for patterns in transition times
    const transitionMetrics = session.metrics.filter(m => m.name.includes('transition'));
    if (transitionMetrics.length > 0) {
      const avgTransitionTime = transitionMetrics.reduce((sum, m) => sum + m.value, 0) / transitionMetrics.length;
      
      if (avgTransitionTime > this.config.thresholds.transitionTime) {
        bottlenecks.push({
          location: 'State Transitions',
          type: 'logic',
          severity: avgTransitionTime > this.config.thresholds.transitionTime * 2 ? 'high' : 'medium',
          impact: 70, // High impact on user experience
          suggestion: 'Consider optimizing guard conditions and action implementations'
        });
      }
    }

    // Memory leak detection
    const memoryMetrics = session.metrics.filter(m => m.name.includes('memory'));
    if (memoryMetrics.length > 0) {
      const trend = this.collector.getMetricTrend('memory_heap_used');
      if (trend === 'increasing') {
        bottlenecks.push({
          location: 'Memory Management',
          type: 'memory',
          severity: 'medium',
          impact: 60,
          suggestion: 'Monitor for memory leaks in machine context or service handlers'
        });
      }
    }

    return bottlenecks.sort((a, b) => b.impact - a.impact);
  }

  private calculateSeverity(value: number, threshold: number): PerformanceBottleneck['severity'] {
    const ratio = value / threshold;
    if (ratio > 3) return 'critical';
    if (ratio > 2) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  }

  private calculateImpact(metric: PerformanceMetric): number {
    // Impact calculation based on metric type and severity
    const baseImpact = {
      memory: 60,
      cpu: 70,
      network: 50,
      custom: 40
    }[metric.category] || 40;

    if (!metric.threshold) return baseImpact;

    const exceedRatio = metric.value / metric.threshold;
    return Math.min(100, baseImpact * exceedRatio);
  }

  private getSuggestionForMetric(metric: PerformanceMetric): string {
    const suggestions = {
      transition_time: 'Optimize guard conditions and reduce action complexity',
      memory_heap_used: 'Check for memory leaks in context objects and service handlers',
      cpu_usage: 'Review synchronous operations in actions and services',
      action_execution_time: 'Optimize action implementations and consider async operations',
      guard_evaluation_time: 'Simplify guard logic and cache expensive computations',
      context_size: 'Reduce context object size and avoid storing large data structures',
      snapshot_capture_time: 'Optimize context serialization and reduce object depth'
    };

    return suggestions[metric.name as keyof typeof suggestions] || 
           `Review performance for ${metric.name} metric`;
  }

  private generateRecommendations(session: ProfilingSession): string[] {
    const recommendations: string[] = [];

    // General recommendations based on bottlenecks
    const criticalBottlenecks = session.bottlenecks.filter(b => b.severity === 'critical');
    const highBottlenecks = session.bottlenecks.filter(b => b.severity === 'high');

    if (criticalBottlenecks.length > 0) {
      recommendations.push('🚨 Critical performance issues detected. Address immediately.');
      recommendations.push('Focus on the highest impact bottlenecks first.');
    }

    if (highBottlenecks.length > 0) {
      recommendations.push('⚠️ High-impact performance issues found.');
    }

    // Memory recommendations
    const memoryBottlenecks = session.bottlenecks.filter(b => b.type === 'memory');
    if (memoryBottlenecks.length > 0) {
      recommendations.push('💾 Memory optimization needed:');
      recommendations.push('  • Implement context cleanup strategies');
      recommendations.push('  • Use object pooling for frequently created objects');
      recommendations.push('  • Consider lazy loading for large data structures');
    }

    // CPU recommendations
    const cpuBottlenecks = session.bottlenecks.filter(b => b.type === 'cpu');
    if (cpuBottlenecks.length > 0) {
      recommendations.push('⚡ CPU optimization opportunities:');
      recommendations.push('  • Move heavy computations to web workers');
      recommendations.push('  • Implement debouncing for frequent operations');
      recommendations.push('  • Cache expensive calculations');
    }

    // Logic recommendations
    const logicBottlenecks = session.bottlenecks.filter(b => b.type === 'logic');
    if (logicBottlenecks.length > 0) {
      recommendations.push('🔧 Logic optimization suggestions:');
      recommendations.push('  • Simplify state machine complexity');
      recommendations.push('  • Reduce the number of nested states');
      recommendations.push('  • Optimize guard and action implementations');
    }

    // General best practices
    if (session.duration > 10000) { // Long profiling session
      recommendations.push('📊 Long-term monitoring insights:');
      recommendations.push('  • Consider implementing performance budgets');
      recommendations.push('  • Set up automated performance alerts');
      recommendations.push('  • Regular performance regression testing');
    }

    return recommendations;
  }

  private generateSummary(session: ProfilingSession): PerformanceSummary {
    const transitionTimes = session.metrics
      .filter(m => m.name.includes('transition'))
      .map(m => m.value);

    const memoryMetrics = session.metrics
      .filter(m => m.name.includes('memory'))
      .map(m => m.value);

    const cpuMetrics = session.metrics
      .filter(m => m.name.includes('cpu'))
      .map(m => m.value);

    const averageTransitionTime = transitionTimes.length > 0 
      ? transitionTimes.reduce((sum, t) => sum + t, 0) / transitionTimes.length 
      : 0;

    const peakMemoryUsage = memoryMetrics.length > 0 ? Math.max(...memoryMetrics) : 0;
    const averageCpuUsage = cpuMetrics.length > 0 
      ? cpuMetrics.reduce((sum, c) => sum + c, 0) / cpuMetrics.length 
      : 0;

    // Calculate overall rating
    let rating: PerformanceSummary['overallRating'] = 'excellent';
    const criticalCount = session.bottlenecks.filter(b => b.severity === 'critical').length;
    const highCount = session.bottlenecks.filter(b => b.severity === 'high').length;

    if (criticalCount > 0) {
      rating = 'poor';
    } else if (highCount > 2) {
      rating = 'poor';
    } else if (highCount > 0 || session.bottlenecks.length > 5) {
      rating = 'fair';
    } else if (session.bottlenecks.length > 2) {
      rating = 'good';
    }

    return {
      totalExecutionTime: session.duration || 0,
      averageTransitionTime,
      peakMemoryUsage,
      averageCpuUsage,
      bottleneckCount: session.bottlenecks.length,
      overallRating: rating
    };
  }

  // Public API methods
  recordTransition(transition: StateTransition): void {
    this.collector.recordStateTransition(transition);
  }

  recordSnapshot(snapshot: MachineSnapshot): void {
    this.collector.recordMachineSnapshot(snapshot);
  }

  recordCustomMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.collector.recordMetric(name, value, metadata);
  }

  getCurrentMetrics(): PerformanceMetric[] {
    return this.collector.getMetrics();
  }

  getMetricHistory(name: string, maxSamples?: number): MetricSample[] {
    return this.collector.getMetricHistory(name, maxSamples);
  }

  getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  isProfilingActive(machineId?: string): boolean {
    if (!machineId) {
      return this.activeSessions.size > 0;
    }
    return Array.from(this.activeSessions.values()).some(s => s.machineId === machineId);
  }

  exportProfilerData(): string {
    const data = {
      exportTime: new Date().toISOString(),
      activeSessions: Array.from(this.activeSessions.values()),
      currentMetrics: this.collector.getMetrics(),
      configuration: this.config
    };

    return JSON.stringify(data, null, 2);
  }

  destroy(): void {
    this.activeSessions.clear();
    this.collector.destroy();
    this.logger.info('Destroy', 'Performance profiler destroyed');
  }
}

// ================================
// GLOBAL PROFILER INSTANCE
// ================================

export const globalPerformanceProfiler = new PerformanceProfiler();

// ================================
// CONVENIENCE FUNCTIONS
// ================================

export const startProfiling = (machineId: string): string => {
  return globalPerformanceProfiler.startProfiling(machineId);
};

export const stopProfiling = (sessionId: string): PerformanceReport => {
  return globalPerformanceProfiler.stopProfiling(sessionId);
};

export const recordTransitionPerformance = (transition: StateTransition): void => {
  globalPerformanceProfiler.recordTransition(transition);
};

export const recordSnapshotPerformance = (snapshot: MachineSnapshot): void => {
  globalPerformanceProfiler.recordSnapshot(snapshot);
};

export const recordCustomMetric = (
  name: string, 
  value: number, 
  metadata?: Record<string, any>
): void => {
  globalPerformanceProfiler.recordCustomMetric(name, value, metadata);
};

export const getCurrentPerformanceMetrics = (): PerformanceMetric[] => {
  return globalPerformanceProfiler.getCurrentMetrics();
};

export const profileMachineExecution = async <T>(
  machineId: string,
  operation: () => Promise<T>
): Promise<{ result: T; report: PerformanceReport }> => {
  const sessionId = startProfiling(machineId);
  
  try {
    const result = await operation();
    const report = stopProfiling(sessionId);
    
    return { result, report };
  } catch (error) {
    // Still generate report even on error
    const report = stopProfiling(sessionId);
    throw { error, report };
  }
};

// ================================
// EXPORTS
// ================================

export {
  PerformanceMetricsCollector,
  PerformanceProfiler,
  DEFAULT_PROFILER_CONFIG
};

export type {
  MetricSample,
  MetricSeries,
  ProfilingSession
};