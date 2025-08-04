import { v4 as uuidv4 } from "uuid";

interface PerformanceMetric {
  id: string;
  timestamp: number;
  machineId: string;
  actorId?: string;
  metricType: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
}

export class AnalyticsEngine {
  constructor(public readonly id: string = uuidv4()) {
    console.log(`AnalyticsEngine ${this.id} initialized`);
  }

  analyzePerformance(metrics: PerformanceMetric[]) {
    return {
      id: uuidv4(),
      timestamp: Date.now(),
      summary: this.generateSummary(metrics),
      bottlenecks: this.identifyBottlenecks(metrics),
      recommendations: []
    };
  }

  identifyBottlenecks(metrics: PerformanceMetric[]) {
    const bottlenecks = [];
    const executionTimes = metrics.filter(m => m.metricType === "execution_time");
    
    if (executionTimes.length > 0) {
      const avgTime = executionTimes.reduce((sum, m) => sum + m.value, 0) / executionTimes.length;
      if (avgTime > 5000) {
        bottlenecks.push({
          id: uuidv4(),
          type: "slow_execution",
          severity: "high",
          description: `Average execution time is ${avgTime.toFixed(2)}ms`
        });
      }
    }
    
    return bottlenecks;
  }

  generateOptimizationRecommendations(analysis: any) {
    return [];
  }

  private generateSummary(metrics: PerformanceMetric[]) {
    return {
      totalMetrics: metrics.length,
      uniqueMachines: new Set(metrics.map(m => m.machineId)).size,
      timespan: metrics.length > 0 ? {
        start: Math.min(...metrics.map(m => m.timestamp)),
        end: Math.max(...metrics.map(m => m.timestamp))
      } : null
    };
  }
}

export function createAnalyticsEngine(id?: string): AnalyticsEngine {
  return new AnalyticsEngine(id);
}

export default AnalyticsEngine;
