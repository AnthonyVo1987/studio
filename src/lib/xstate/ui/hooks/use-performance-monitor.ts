/**
 * @fileOverview Performance Monitoring Hooks for Advanced UI Components
 * 
 * React hooks for real-time performance monitoring, metrics collection,
 * and dashboard integration with Recharts visualization components.
 * 
 * Features:
 * - Real-time performance metrics collection
 * - Chart data management for Recharts integration
 * - Alert system for performance thresholds
 * - Memory usage and execution time tracking
 * - Event frequency and state transition monitoring
 * - Performance analytics and reporting
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePerformanceMonitor as useBasePerformanceMonitor } from '../../performance/performance-monitor';
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// Type Imports
import type {
  PerformanceDashboardConfig,
  PerformanceChartType,
  AlertThreshold,
  ChartDataPoint,
  PerformanceAlert
} from '../types/ui-types';
import type { PerformanceMetrics, MetricsSnapshot } from '../performance/performance-types';

// =============================================================================
// Logger Setup
// =============================================================================

const logger = createTickerLogger('PERFORMANCE_UI', TICKER_PAGES.ADVANCED_UI);

// =============================================================================
// Temporary stub function to convert metrics
function createStubMetricsSnapshot(rawMetrics: any): MetricsSnapshot {
  const defaultMetrics: PerformanceMetrics = {
    totalDuration: 0,
    stepDurations: {},
    retryCount: 0,
    timeoutCount: 0
  };
  return {
    timestamp: new Date(),
    metrics: defaultMetrics,
    averageResponseTime: 0,
    memoryUsage: 0,
    errorRate: 0,
    operationsPerSecond: 0
  };
}

// Performance Dashboard Hook
// =============================================================================

/**
 * Comprehensive performance monitoring hook for dashboard components
 */
export function usePerformanceDashboard(config: PerformanceDashboardConfig) {
  const {
    refreshInterval,
    maxDataPoints = 100,
    chartTypes,
    alertThresholds,
    autoResize = true,
    realTimeUpdates = true
  } = config;

  // Base performance monitor
  const baseMonitor = useBasePerformanceMonitor();

  // State management
  const [chartData, setChartData] = useState<Record<PerformanceChartType, ChartDataPoint[]>>(() => {
    const initialData: Record<PerformanceChartType, ChartDataPoint[]> = {} as any;
    chartTypes.forEach(type => {
      initialData[type] = [];
    });
    return initialData;
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Refs for data management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertCounterRef = useRef(0);

  // Current metrics snapshot
  const [currentMetrics, setCurrentMetrics] = useState<MetricsSnapshot | null>(null);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    logger.state('startMonitoring', 'Performance dashboard monitoring started');

    if (realTimeUpdates) {
      intervalRef.current = setInterval(() => {
        // Collect current metrics
        const rawMetrics = baseMonitor.getCurrentMetrics();
        const metricsSnapshot = createStubMetricsSnapshot(rawMetrics);
        setCurrentMetrics(metricsSnapshot);

        const timestamp = new Date();
        
        // Update chart data for each chart type
        chartTypes.forEach(chartType => {
          const dataPoint = createDataPointFromMetrics(metricsSnapshot, chartType, timestamp);
          
          setChartData(prev => {
            const updated = { ...prev };
            const currentData = updated[chartType] || [];
            
            // Add new data point
            const newData = [...currentData, dataPoint];
            
            // Limit data points to maxDataPoints
            if (newData.length > maxDataPoints) {
              newData.splice(0, newData.length - maxDataPoints);
            }
            
            updated[chartType] = newData;
            return updated;
          });
        });

        // Check alert thresholds
        checkAlertThresholds(metricsSnapshot, timestamp);
        
        setLastUpdate(timestamp);
      }, refreshInterval);
    }
  }, [isMonitoring, realTimeUpdates, refreshInterval, chartTypes, maxDataPoints, baseMonitor]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    logger.state('stopMonitoring', 'Performance dashboard monitoring stopped');
  }, [isMonitoring]);

  // Check alert thresholds
  const checkAlertThresholds = useCallback((metrics: MetricsSnapshot, timestamp: Date) => {
    alertThresholds.forEach(threshold => {
      const value = getMetricValue(metrics, threshold.metric);
      const shouldAlert = evaluateThreshold(value, threshold.threshold, threshold.operator);

      if (shouldAlert) {
        const alertId = `alert_${threshold.metric}_${alertCounterRef.current++}`;
        
        const alert: PerformanceAlert = {
          id: alertId,
          threshold,
          currentValue: value,
          triggeredAt: timestamp,
          status: 'active',
          context: {
            metrics,
            chartType: threshold.metric
          }
        };

        setAlerts(prev => [...prev, alert]);
        
        logger.warn('PerformanceAlert', 'Performance alert triggered', {
          alertId,
          metric: threshold.metric,
          currentValue: value,
          threshold: threshold.threshold,
          severity: threshold.severity
        });

        // Trigger notification if enabled
        if (threshold.enableNotifications) {
          triggerNotification(alert);
        }
      }
    });
  }, [alertThresholds]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'acknowledged' as const }
          : alert
      )
    );
    
    logger.userAction('acknowledgeAlert', 'Alert acknowledged', { alertId });
  }, []);

  // Resolve alert
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved' as const }
          : alert
      )
    );
    
    logger.userAction('resolveAlert', 'Alert resolved', { alertId });
  }, []);

  // Clear old alerts
  const clearResolvedAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => alert.status !== 'resolved'));
    logger.debug('ClearAlerts', 'Cleared resolved alerts');
  }, []);

  // Get chart data for specific type
  const getChartData = useCallback((chartType: PerformanceChartType) => {
    return chartData[chartType] || [];
  }, [chartData]);

  // Add custom data point
  const addCustomDataPoint = useCallback((
    chartType: PerformanceChartType,
    value: number,
    label?: string,
    metadata?: Record<string, any>
  ) => {
    const dataPoint: ChartDataPoint = {
      timestamp: new Date(),
      value,
      label,
      metadata
    };

    setChartData(prev => {
      const updated = { ...prev };
      const currentData = updated[chartType] || [];
      const newData = [...currentData, dataPoint];
      
      if (newData.length > maxDataPoints) {
        newData.splice(0, newData.length - maxDataPoints);
      }
      
      updated[chartType] = newData;
      return updated;
    });

    logger.debug('AddDataPoint', 'Custom data point added', { chartType, value, label });
  }, [maxDataPoints]);

  // Clear chart data
  const clearChartData = useCallback((chartType?: PerformanceChartType) => {
    if (chartType) {
      setChartData(prev => ({ ...prev, [chartType]: [] }));
      logger.debug('ClearChartData', 'Chart data cleared for type', { chartType });
    } else {
      const clearedData: Record<PerformanceChartType, ChartDataPoint[]> = {} as any;
      chartTypes.forEach(type => {
        clearedData[type] = [];
      });
      setChartData(clearedData);
      logger.debug('ClearAllChartData', 'All chart data cleared');
    }
  }, [chartTypes]);

  // Export chart data
  const exportChartData = useCallback((chartType: PerformanceChartType) => {
    const data = chartData[chartType] || [];
    const csvContent = convertToCSV(data);
    
    // Create downloadable file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance_${chartType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    logger.userAction('exportChartData', 'Chart data exported', { chartType, dataPoints: data.length });
  }, [chartData]);

  // Performance summary
  const performanceSummary = useMemo(() => {
    if (!currentMetrics) return null;

    return {
      totalMetrics: Object.keys(chartData).length,
      totalDataPoints: Object.values(chartData).reduce((sum, data) => sum + data.length, 0),
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      lastUpdate,
      monitoringDuration: isMonitoring ? Date.now() - (intervalRef.current ? Date.now() : 0) : 0,
      averageValues: calculateAverageValues(),
      trendsAnalysis: analyzeTrends()
    };
  }, [currentMetrics, chartData, alerts, lastUpdate, isMonitoring]);

  // Calculate average values for all chart types
  const calculateAverageValues = useCallback(() => {
    const averages: Record<PerformanceChartType, number> = {} as any;
    
    chartTypes.forEach(chartType => {
      const data = chartData[chartType] || [];
      if (data.length > 0) {
        const sum = data.reduce((acc, point) => acc + point.value, 0);
        averages[chartType] = sum / data.length;
      } else {
        averages[chartType] = 0;
      }
    });
    
    return averages;
  }, [chartTypes, chartData]);

  // Analyze trends in performance data
  const analyzeTrends = useCallback(() => {
    const trends: Record<PerformanceChartType, 'improving' | 'degrading' | 'stable'> = {} as any;
    
    chartTypes.forEach(chartType => {
      const data = chartData[chartType] || [];
      if (data.length < 2) {
        trends[chartType] = 'stable';
        return;
      }

      const recent = data.slice(-10); // Last 10 data points
      const older = data.slice(-20, -10); // Previous 10 data points

      if (recent.length === 0 || older.length === 0) {
        trends[chartType] = 'stable';
        return;
      }

      const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, p) => sum + p.value, 0) / older.length;

      const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (Math.abs(changePercent) < 5) {
        trends[chartType] = 'stable';
      } else if (changePercent > 0) {
        // For metrics like execution-time and memory-usage, higher is worse
        trends[chartType] = ['execution-time', 'memory-usage', 'error-rate'].includes(chartType) 
          ? 'degrading' 
          : 'improving';
      } else {
        trends[chartType] = ['execution-time', 'memory-usage', 'error-rate'].includes(chartType) 
          ? 'improving' 
          : 'degrading';
      }
    });
    
    return trends;
  }, [chartTypes, chartData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    chartData,
    alerts,
    currentMetrics,
    isMonitoring,
    lastUpdate,
    performanceSummary,

    // Actions
    startMonitoring,
    stopMonitoring,
    acknowledgeAlert,
    resolveAlert,
    clearResolvedAlerts,
    addCustomDataPoint,
    clearChartData,
    exportChartData,

    // Data accessors
    getChartData,

    // Computed values
    activeAlerts: alerts.filter(a => a.status === 'active'),
    resolvedAlerts: alerts.filter(a => a.status === 'resolved'),
    chartTypes,
    hasData: Object.values(chartData).some(data => data.length > 0)
  };
}

// =============================================================================
// Real-time Metrics Hook
// =============================================================================

/**
 * Hook for real-time performance metrics with minimal overhead
 */
export function useRealTimeMetrics(interval: number = 1000) {
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [isActive, setIsActive] = useState(false);
  const baseMonitor = useBasePerformanceMonitor();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (isActive) return;

    setIsActive(true);
    intervalRef.current = setInterval(() => {
      const rawMetrics = baseMonitor.getCurrentMetrics();
      const metricsSnapshot = createStubMetricsSnapshot(rawMetrics);
      setMetrics(metricsSnapshot);
    }, interval);
  }, [isActive, interval, baseMonitor]);

  const stop = useCallback(() => {
    if (!isActive) return;

    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    metrics,
    isActive,
    start,
    stop
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create data point from metrics snapshot
 */
function createDataPointFromMetrics(
  metrics: MetricsSnapshot,
  chartType: PerformanceChartType,
  timestamp: Date
): ChartDataPoint {
  const value = getMetricValue(metrics, chartType);
  
  return {
    timestamp,
    value,
    metadata: {
      chartType,
      fullMetrics: metrics
    }
  };
}

/**
 * Get metric value based on chart type
 */
function getMetricValue(metrics: MetricsSnapshot, chartType: PerformanceChartType): number {
  switch (chartType) {
    case 'execution-time':
      return metrics.metrics.totalDuration || 0;
    case 'memory-usage':
      return metrics.metrics.memoryUsage?.percentage || 0;
    case 'event-frequency':
      return metrics.metrics.retryCount || 0;
    case 'state-transitions':
      return metrics.metrics.retryCount || 0;
    case 'error-rate':
      return metrics.metrics.timeoutCount || 0;
    case 'throughput':
      return (1000 / (metrics.metrics.totalDuration || 1)) || 0;
    default:
      return 0;
  }
}

/**
 * Evaluate threshold condition
 */
function evaluateThreshold(
  value: number,
  threshold: number,
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
): boolean {
  switch (operator) {
    case 'gt':
      return value > threshold;
    case 'lt':
      return value < threshold;
    case 'eq':
      return value === threshold;
    case 'gte':
      return value >= threshold;
    case 'lte':
      return value <= threshold;
    default:
      return false;
  }
}

/**
 * Trigger performance alert notification
 */
function triggerNotification(alert: PerformanceAlert) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const message = alert.threshold.messageTemplate
      .replace('{metric}', alert.threshold.metric)
      .replace('{value}', alert.currentValue.toString())
      .replace('{threshold}', alert.threshold.threshold.toString());

    new Notification('Performance Alert', {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });
  }
}

/**
 * Convert chart data to CSV format
 */
function convertToCSV(data: ChartDataPoint[]): string {
  if (data.length === 0) return '';

  const headers = ['timestamp', 'value', 'label'];
  const rows = data.map(point => [
    point.timestamp.toISOString(),
    point.value.toString(),
    point.label || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
}

// =============================================================================
// Exports
// =============================================================================

export type {
  PerformanceDashboardConfig,
  PerformanceChartType,
  AlertThreshold,
  ChartDataPoint,
  PerformanceAlert
};