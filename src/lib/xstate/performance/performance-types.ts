export interface PerformanceMetric {
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

export interface PerformanceMonitorConfig {
  enabled: boolean;
  samplingRate: number;
  retentionPeriod: number;
  aggregationInterval: number;
  enableRealTimeAlerts: boolean;
  enableHistoricalAnalysis: boolean;
  maxMetricsInMemory: number;
  exportInterval?: number;
}

export interface AnalyticsEngine {
  id: string;
  analyzePerformance(metrics: PerformanceMetric[]): any;
  identifyBottlenecks(metrics: PerformanceMetric[]): any[];
  generateOptimizationRecommendations(analysis: any): any[];
}

export const DEFAULT_CONFIG = {
  enabled: true,
  samplingRate: 1.0,
  retentionPeriod: 24 * 60 * 60 * 1000,
  aggregationInterval: 60 * 1000,
  enableRealTimeAlerts: true,
  enableHistoricalAnalysis: true,
  maxMetricsInMemory: 10000
};
