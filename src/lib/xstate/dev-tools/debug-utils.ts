/**
 * XState Debug Utilities
 * 
 * This file provides comprehensive debugging utilities for XState machines
 * in the macro automation system.
 */

import type { MacroExecutionContext, MacroExecutionEvent, StepResult, MacroStepNumber } from '../types/macro-types';
import type { DebugSnapshot } from './xstate-inspector';

// ================================
// DEBUG CONTEXT ANALYZER
// ================================

export interface ContextAnalysis {
  health: 'healthy' | 'warning' | 'error';
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    property?: string;
    suggestion?: string;
  }>;
  metrics: {
    executionProgress: number; // 0-100
    averageStepDuration: number;
    errorRate: number;
    retryRate: number;
  };
  stepSummary: Array<{
    stepId: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    duration?: number;
    retryCount: number;
    error?: string;
  }>;
}

export const analyzeContext = (context: MacroExecutionContext): ContextAnalysis => {
  const issues: ContextAnalysis['issues'] = [];
  const stepSummary: ContextAnalysis['stepSummary'] = [];
  
  // Analyze execution state
  if (!context.ticker) {
    issues.push({
      type: 'error',
      message: 'Ticker is missing',
      property: 'ticker',
      suggestion: 'Ensure ticker is set before starting execution'
    });
  }
  
  if (!context.selectedExpiration && (typeof context.currentStep === 'number' ? context.currentStep > 0 : context.currentStep !== 'fetchExpirations')) {
    issues.push({
      type: 'warning',
      message: 'No expiration selected but execution started',
      property: 'selectedExpiration',
      suggestion: 'Select an expiration date before proceeding'
    });
  }
  
  if (context.error) {
    issues.push({
      type: 'error',
      message: `Execution error: ${context.error.message}`,
      property: 'error',
      suggestion: 'Check error details and retry if applicable'
    });
  }
  
  if (context.cancelled) {
    issues.push({
      type: 'info',
      message: 'Execution was cancelled',
      property: 'cancelled'
    });
  }
  
  // Analyze performance
  const totalSteps = 4; // Known number of macro steps
  const completedSteps = context.completedSteps.length;
  const executionProgress = (completedSteps / totalSteps) * 100;
  
  if (context.performance.retryCount > 5) {
    issues.push({
      type: 'warning',
      message: `High retry count: ${context.performance.retryCount}`,
      property: 'performance.retryCount',
      suggestion: 'Check network connectivity or increase timeout values'
    });
  }
  
  if (context.performance.timeoutCount > 2) {
    issues.push({
      type: 'warning',
      message: `Multiple timeouts: ${context.performance.timeoutCount}`,
      property: 'performance.timeoutCount',
      suggestion: 'Consider increasing timeout values'
    });
  }
  
  // Calculate metrics
  const stepDurations = Array.from(context.performance.stepDurations.values());
  const averageStepDuration = stepDurations.length > 0 
    ? stepDurations.reduce((sum, duration) => sum + duration, 0) / stepDurations.length 
    : 0;
  
  const totalOperations = completedSteps + context.performance.retryCount;
  const errorRate = totalOperations > 0 ? (context.performance.retryCount / totalOperations) * 100 : 0;
  const retryRate = completedSteps > 0 ? (context.performance.retryCount / completedSteps) * 100 : 0;
  
  // Build step summary
  for (let stepId = 1; stepId <= totalSteps; stepId++) {
    const stepIdTyped = stepId as MacroStepNumber;
    const stepResult = context.stepResults.get(stepIdTyped);
    const isCompleted = context.completedSteps.includes(stepIdTyped);
    const isRunning = context.currentStep === stepId && !isCompleted;
    
    stepSummary.push({
      stepId,
      status: stepResult?.status === 'error' ? 'failed' 
             : isCompleted ? 'completed'
             : isRunning ? 'running'
             : 'pending',
      duration: stepResult?.duration,
      retryCount: stepResult?.retryCount || 0,
      error: stepResult?.error?.message
    });
  }
  
  // Determine overall health
  const hasErrors = issues.some(issue => issue.type === 'error');
  const hasWarnings = issues.some(issue => issue.type === 'warning');
  const health = hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy';
  
  return {
    health,
    issues,
    metrics: {
      executionProgress,
      averageStepDuration,
      errorRate,
      retryRate
    },
    stepSummary
  };
};

// ================================
// EVENT TRACE ANALYZER
// ================================

export interface EventTrace {
  timestamp: number;
  event: MacroExecutionEvent;
  state: string;
  context: Partial<MacroExecutionContext>;
}

export interface EventAnalysis {
  totalEvents: number;
  eventTypes: Record<string, number>;
  errorEvents: EventTrace[];
  successEvents: EventTrace[];
  timeline: Array<{
    timestamp: number;
    type: string;
    description: string;
    duration?: number;
  }>;
  patterns: Array<{
    type: 'loop' | 'retry' | 'failure_chain' | 'success_chain';
    description: string;
    events: EventTrace[];
  }>;
}

export class EventTracer {
  private traces: EventTrace[] = [];
  private startTime: number = Date.now();
  
  trace(event: MacroExecutionEvent, state: string, context: MacroExecutionContext) {
    const trace: EventTrace = {
      timestamp: Date.now(),
      event,
      state,
      context: {
        ticker: context.ticker,
        currentStep: context.currentStep,
        completedSteps: [...context.completedSteps],
        error: context.error ? { message: context.error.message } as any : null,
        performance: { ...context.performance }
      }
    };
    
    this.traces.push(trace);
    
    // Limit traces to prevent memory issues
    if (this.traces.length > 1000) {
      this.traces = this.traces.slice(-500);
    }
  }
  
  analyze(): EventAnalysis {
    const eventTypes: Record<string, number> = {};
    const errorEvents: EventTrace[] = [];
    const successEvents: EventTrace[] = [];
    const timeline: EventAnalysis['timeline'] = [];
    
    // Count event types and categorize
    this.traces.forEach(trace => {
      eventTypes[trace.event.type] = (eventTypes[trace.event.type] || 0) + 1;
      
      if (['STEP_FAILED', 'STEP_TIMEOUT', 'FATAL_ERROR'].includes(trace.event.type)) {
        errorEvents.push(trace);
      }
      
      if (['STEP_COMPLETED', 'ERROR_RECOVERED'].includes(trace.event.type)) {
        successEvents.push(trace);
      }
      
      timeline.push({
        timestamp: trace.timestamp,
        type: trace.event.type,
        description: this.getEventDescription(trace.event),
        duration: this.calculateEventDuration(trace)
      });
    });
    
    // Detect patterns
    const patterns = this.detectPatterns();
    
    return {
      totalEvents: this.traces.length,
      eventTypes,
      errorEvents,
      successEvents,
      timeline,
      patterns
    };
  }
  
  private getEventDescription(event: MacroExecutionEvent): string {
    switch (event.type) {
      case 'START_EXECUTION':
        return `Started execution for ${event.ticker}`;
      case 'STEP_COMPLETED':
        return `Completed step ${event.stepId}`;
      case 'STEP_FAILED':
        return `Step ${event.stepId} failed: ${event.error.message}`;
      case 'STEP_TIMEOUT':
        return `Step ${event.stepId} timed out`;
      case 'RETRY_STEP':
        return `Retrying step ${event.stepId}`;
      case 'CANCEL_EXECUTION':
        return `Execution cancelled: ${event.reason || 'No reason provided'}`;
      default:
        return `Event: ${event.type}`;
    }
  }
  
  private calculateEventDuration(trace: EventTrace): number | undefined {
    const nextTrace = this.traces[this.traces.indexOf(trace) + 1];
    return nextTrace ? nextTrace.timestamp - trace.timestamp : undefined;
  }
  
  private detectPatterns(): EventAnalysis['patterns'] {
    const patterns: EventAnalysis['patterns'] = [];
    
    // Detect retry patterns
    const retrySequences = this.findRetrySequences();
    retrySequences.forEach(sequence => {
      patterns.push({
        type: 'retry',
        description: `Retry sequence for step ${sequence[0].event.type}`,
        events: sequence
      });
    });
    
    // Detect failure chains
    const failureChains = this.findFailureChains();
    failureChains.forEach(chain => {
      patterns.push({
        type: 'failure_chain',
        description: `Series of failures: ${chain.length} consecutive errors`,
        events: chain
      });
    });
    
    return patterns;
  }
  
  private findRetrySequences(): EventTrace[][] {
    const sequences: EventTrace[][] = [];
    let currentSequence: EventTrace[] = [];
    
    for (const trace of this.traces) {
      if (trace.event.type === 'RETRY_STEP') {
        currentSequence.push(trace);
      } else if (currentSequence.length > 0) {
        if (currentSequence.length > 1) {
          sequences.push([...currentSequence]);
        }
        currentSequence = [];
      }
    }
    
    return sequences;
  }
  
  private findFailureChains(): EventTrace[][] {
    const chains: EventTrace[][] = [];
    let currentChain: EventTrace[] = [];
    
    for (const trace of this.traces) {
      if (['STEP_FAILED', 'STEP_TIMEOUT', 'FATAL_ERROR'].includes(trace.event.type)) {
        currentChain.push(trace);
      } else if (currentChain.length > 0) {
        if (currentChain.length > 2) {
          chains.push([...currentChain]);
        }
        currentChain = [];
      }
    }
    
    return chains;
  }
  
  clear() {
    this.traces = [];
    this.startTime = Date.now();
  }
  
  export(): string {
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      traceCount: this.traces.length,
      analysis: this.analyze(),
      traces: this.traces
    }, null, 2);
  }
}

// ================================
// PERFORMANCE MONITOR
// ================================

export interface PerformanceReport {
  summary: {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    averageStepTime: number;
  };
  stepBreakdown: Array<{
    stepId: number;
    stepName: string;
    attempts: number;
    successes: number;
    failures: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
  }>;
  trends: {
    executionTimes: number[];
    errorRates: number[];
    retryRates: number[];
  };
  recommendations: string[];
}

export class PerformanceMonitor {
  private executions: Array<{
    ticker: string;
    startTime: number;
    endTime?: number;
    success: boolean;
    stepResults: Map<number, StepResult>;
  }> = [];
  
  startExecution(ticker: string): string {
    const executionId = `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.executions.push({
      ticker,
      startTime: Date.now(),
      success: false,
      stepResults: new Map()
    });
    
    return executionId;
  }
  
  endExecution(success: boolean, stepResults: Map<number, StepResult>) {
    const execution = this.executions[this.executions.length - 1];
    if (execution) {
      execution.endTime = Date.now();
      execution.success = success;
      execution.stepResults = new Map(stepResults);
    }
  }
  
  generateReport(): PerformanceReport {
    const completedExecutions = this.executions.filter(e => e.endTime);
    
    // Calculate summary
    const totalExecutions = completedExecutions.length;
    const successfulExecutions = completedExecutions.filter(e => e.success).length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    
    const executionTimes = completedExecutions.map(e => e.endTime! - e.startTime);
    const averageExecutionTime = executionTimes.length > 0 
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
      : 0;
    
    // Calculate step breakdown
    const stepStats = new Map<number, { attempts: number; successes: number; durations: number[] }>();
    
    completedExecutions.forEach(execution => {
      execution.stepResults.forEach((result, stepId) => {
        if (!stepStats.has(stepId)) {
          stepStats.set(stepId, { attempts: 0, successes: 0, durations: [] });
        }
        
        const stats = stepStats.get(stepId)!;
        stats.attempts++;
        if (result.status === 'success') {
          stats.successes++;
        }
        stats.durations.push(result.duration);
      });
    });
    
    const stepBreakdown = Array.from(stepStats.entries()).map(([stepId, stats]) => {
      const durations = stats.durations;
      return {
        stepId,
        stepName: `Step ${stepId}`,
        attempts: stats.attempts,
        successes: stats.successes,
        failures: stats.attempts - stats.successes,
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations)
      };
    });
    
    const allStepDurations = Array.from(stepStats.values())
      .flatMap(stats => stats.durations);
    const averageStepTime = allStepDurations.length > 0
      ? allStepDurations.reduce((sum, time) => sum + time, 0) / allStepDurations.length
      : 0;
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (successRate < 80) {
      recommendations.push('Success rate is below 80%. Consider reviewing error handling and retry logic.');
    }
    
    if (averageExecutionTime > 120000) { // 2 minutes
      recommendations.push('Average execution time exceeds 2 minutes. Consider optimizing step implementations.');
    }
    
    stepBreakdown.forEach(step => {
      if (step.failures / step.attempts > 0.3) {
        recommendations.push(`Step ${step.stepId} has high failure rate (${Math.round((step.failures / step.attempts) * 100)}%). Review implementation.`);
      }
      
      if (step.averageDuration > 60000) { // 1 minute
        recommendations.push(`Step ${step.stepId} average duration exceeds 1 minute. Consider optimization.`);
      }
    });
    
    return {
      summary: {
        totalExecutions,
        successRate,
        averageExecutionTime,
        averageStepTime
      },
      stepBreakdown,
      trends: {
        executionTimes: executionTimes.slice(-20), // Last 20 executions
        errorRates: [], // Would be calculated from historical data
        retryRates: []  // Would be calculated from historical data
      },
      recommendations
    };
  }
  
  clear() {
    this.executions = [];
  }
  
  export(): string {
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      report: this.generateReport(),
      rawData: this.executions
    }, null, 2);
  }
}

// ================================
// GLOBAL INSTANCES
// ================================

export const globalEventTracer = new EventTracer();
export const globalPerformanceMonitor = new PerformanceMonitor();

// ================================
// UTILITY FUNCTIONS
// ================================

export const createDebugReport = (context: MacroExecutionContext, traces?: EventTrace[]): string => {
  const contextAnalysis = analyzeContext(context);
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    ticker: context.ticker,
    executionId: context.executionId,
    contextAnalysis,
    traces: traces || [],
    performanceSnapshot: {
      uptime: context.startTime ? Date.now() - context.startTime : 0,
      memoryUsage: typeof process !== 'undefined' ? process.memoryUsage() : undefined
    }
  };
  
  return JSON.stringify(report, null, 2);
};

export const logDebugSummary = (context: MacroExecutionContext) => {
  const analysis = analyzeContext(context);
  
  console.group(`🔍 Debug Summary: ${context.ticker} (${context.executionId})`);
  console.log(`Health: ${analysis.health}`);
  console.log(`Progress: ${analysis.metrics.executionProgress.toFixed(1)}%`);
  console.log(`Avg Step Duration: ${analysis.metrics.averageStepDuration.toFixed(0)}ms`);
  console.log(`Error Rate: ${analysis.metrics.errorRate.toFixed(1)}%`);
  
  if (analysis.issues.length > 0) {
    console.group('Issues:');
    analysis.issues.forEach(issue => {
      const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${icon} ${issue.message}`);
      if (issue.suggestion) {
        console.log(`   💡 ${issue.suggestion}`);
      }
    });
    console.groupEnd();
  }
  
  console.group('Step Status:');
  analysis.stepSummary.forEach(step => {
    const icon = step.status === 'completed' ? '✅' 
                : step.status === 'failed' ? '❌'
                : step.status === 'running' ? '🔄'
                : '⏳';
    console.log(`${icon} Step ${step.stepId}: ${step.status} ${step.duration ? `(${step.duration}ms)` : ''}`);
  });
  console.groupEnd();
  
  console.groupEnd();
};

// ================================
// EXPORTS
// ================================

// Types are already exported in the main export section above