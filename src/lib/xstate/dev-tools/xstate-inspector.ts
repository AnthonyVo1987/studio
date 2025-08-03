/**
 * XState v5 Inspector and Development Tools Integration
 * 
 * This file provides development debugging utilities and inspector integration
 * for XState v5 machines in the macro automation system.
 */

import { createActor } from 'xstate';
import type { MacroExecutionContext, MacroExecutionEvent } from '../types/macro-types';

// ================================
// INSPECTOR CONFIGURATION
// ================================

export interface InspectorConfig {
  enabled: boolean;
  url?: string;
  autoStart?: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  logTransitions: boolean;
  logActions: boolean;
  logGuards: boolean;
  logServices: boolean;
}

export const DEFAULT_INSPECTOR_CONFIG: InspectorConfig = {
  enabled: process.env.NODE_ENV === 'development',
  url: 'https://stately.ai/viz?inspect',
  autoStart: true,
  logLevel: 'info',
  logTransitions: true,
  logActions: true,
  logGuards: false,
  logServices: true
};

// ================================
// DEVELOPMENT LOGGER
// ================================

export class MacroExecutionLogger {
  private config: InspectorConfig;
  private startTime: number = Date.now();
  
  constructor(config: Partial<InspectorConfig> = {}) {
    this.config = { ...DEFAULT_INSPECTOR_CONFIG, ...config };
  }
  
  private shouldLog(level: InspectorConfig['logLevel']): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel <= configLevel;
  }
  
  private formatMessage(prefix: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    return `[${timestamp}] [+${elapsed}ms] [${prefix}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
  }
  
  logTransition(from: string, to: string, event: string, context?: MacroExecutionContext) {
    if (!this.config.enabled || !this.config.logTransitions || !this.shouldLog('info')) return;
    
    const message = `State transition: ${from} → ${to} (${event})`;
    const data = context ? {
      ticker: context.ticker,
      executionId: context.executionId,
      currentStep: context.currentStep,
      completedSteps: context.completedSteps
    } : undefined;
    
    console.log(this.formatMessage('TRANSITION', message, data));
  }
  
  logAction(actionName: string, event: MacroExecutionEvent, context?: MacroExecutionContext) {
    if (!this.config.enabled || !this.config.logActions || !this.shouldLog('debug')) return;
    
    const message = `Action executed: ${actionName}`;
    const data = {
      event: { type: event.type, ...('stepId' in event ? { stepId: event.stepId } : {}) },
      context: context ? {
        ticker: context.ticker,
        currentStep: context.currentStep,
        error: context.error?.message
      } : undefined
    };
    
    console.debug(this.formatMessage('ACTION', message, data));
  }
  
  logGuard(guardName: string, result: boolean, params?: any) {
    if (!this.config.enabled || !this.config.logGuards || !this.shouldLog('debug')) return;
    
    const message = `Guard evaluated: ${guardName} → ${result}`;
    const data = params ? { params } : undefined;
    
    console.debug(this.formatMessage('GUARD', message, data));
  }
  
  logService(serviceName: string, status: 'start' | 'success' | 'error', data?: any) {
    if (!this.config.enabled || !this.config.logServices || !this.shouldLog('info')) return;
    
    const message = `Service ${serviceName}: ${status}`;
    const logData = data ? { data } : undefined;
    
    const logFn = status === 'error' ? console.error : console.log;
    logFn(this.formatMessage('SERVICE', message, logData));
  }
  
  logError(error: Error, context?: MacroExecutionContext) {
    if (!this.config.enabled || !this.shouldLog('error')) return;
    
    const message = `Error occurred: ${error.message}`;
    const data = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: context ? {
        ticker: context.ticker,
        executionId: context.executionId,
        currentStep: context.currentStep
      } : undefined
    };
    
    console.error(this.formatMessage('ERROR', message, data));
  }
  
  logPerformance(metrics: {
    operation: string;
    duration: number;
    success: boolean;
    retryCount?: number;
  }) {
    if (!this.config.enabled || !this.shouldLog('info')) return;
    
    const message = `Performance: ${metrics.operation} (${metrics.duration}ms) - ${metrics.success ? 'SUCCESS' : 'FAILED'}`;
    const data = {
      duration: metrics.duration,
      success: metrics.success,
      retryCount: metrics.retryCount || 0
    };
    
    console.log(this.formatMessage('PERF', message, data));
  }
}

// ================================
// INSPECTOR INTEGRATION
// ================================

/**
 * Creates an inspected machine for development debugging
 * Note: XState v5 has built-in inspection capabilities
 */
export const createInspectedMachine = (machine: any, config: Partial<InspectorConfig> = {}) => {
  const inspectorConfig = { ...DEFAULT_INSPECTOR_CONFIG, ...config };
  
  if (!inspectorConfig.enabled || process.env.NODE_ENV !== 'development') {
    return machine;
  }
  
  // For XState v5, we provide inspection configuration
  return machine.provide({
    inspect: {
      url: inspectorConfig.url,
      autoStart: inspectorConfig.autoStart
    }
  });
};

/**
 * Creates an inspected actor with enhanced logging
 */
export const createInspectedActor = (machine: any, config: Partial<InspectorConfig> = {}) => {
  const inspectorConfig = { ...DEFAULT_INSPECTOR_CONFIG, ...config };
  const logger = new MacroExecutionLogger(inspectorConfig);
  
  const inspectedMachine = createInspectedMachine(machine, inspectorConfig);
  const actor = createActor(inspectedMachine);
  
  if (inspectorConfig.enabled) {
    // Subscribe to state changes for logging
    actor.subscribe((state) => {
      if (inspectorConfig.logTransitions) {
        logger.logTransition(
          'previous', // XState v5 doesn't provide previous state in subscription
          String(state.value),
          'STATE_CHANGE',
          state.context as MacroExecutionContext
        );
      }
    });
    
    // Log actor lifecycle
    actor.subscribe({
      next: (state) => {
        logger.logService('Actor', 'success', { state: state.value });
      },
      error: (error) => {
        logger.logError(error as Error);
      },
      complete: () => {
        logger.logService('Actor', 'success', { status: 'completed' });
      }
    });
  }
  
  return { actor, logger };
};

// ================================
// MACHINE VISUALIZER
// ================================

export interface MachineVisualization {
  states: Array<{
    id: string;
    type: 'atomic' | 'compound' | 'parallel' | 'final';
    parent?: string;
    children?: string[];
  }>;
  transitions: Array<{
    from: string;
    to: string;
    event: string;
    guard?: string;
    actions?: string[];
  }>;
  context: Record<string, any>;
}

export const visualizeMachine = (machine: any): MachineVisualization => {
  // This is a simplified visualization - in a real implementation,
  // you would traverse the machine definition to extract this information
  return {
    states: [
      { id: 'idle', type: 'atomic' },
      { id: 'initializing', type: 'atomic' },
      { id: 'validatingPrerequisites', type: 'compound', children: ['checkingStep1'] },
      { id: 'executing', type: 'compound', children: ['step1', 'step2', 'step3', 'step4'] },
      { id: 'retrying', type: 'atomic' },
      { id: 'completed', type: 'final' },
      { id: 'error', type: 'atomic' },
      { id: 'cancelled', type: 'atomic' }
    ],
    transitions: [
      { from: 'idle', to: 'initializing', event: 'START_EXECUTION' },
      { from: 'initializing', to: 'validatingPrerequisites', event: '', guard: 'hasValidExpiration' },
      { from: 'executing.step1', to: 'executing.step2', event: 'STEP_COMPLETED' },
      { from: 'executing.step2', to: 'executing.step3', event: 'STEP_COMPLETED' },
      { from: 'executing.step3', to: 'executing.step4', event: 'STEP_COMPLETED' },
      { from: 'executing.step4', to: 'completed', event: 'STEP_COMPLETED' }
    ],
    context: {}
  };
};

// ================================
// DEBUGGING UTILITIES
// ================================

export interface DebugSnapshot {
  timestamp: number;
  machineId: string;
  state: string;
  context: MacroExecutionContext;
  event?: MacroExecutionEvent;
  performance: {
    uptime: number;
    memoryUsage?: NodeJS.MemoryUsage;
  };
}

export class MachineDebugger {
  private snapshots: DebugSnapshot[] = [];
  private startTime: number = Date.now();
  
  takeSnapshot(machineId: string, state: string, context: MacroExecutionContext, event?: MacroExecutionEvent): DebugSnapshot {
    const snapshot: DebugSnapshot = {
      timestamp: Date.now(),
      machineId,
      state,
      context: { ...context }, // Deep clone would be better in production
      event,
      performance: {
        uptime: Date.now() - this.startTime,
        memoryUsage: typeof process !== 'undefined' ? process.memoryUsage() : undefined
      }
    };
    
    this.snapshots.push(snapshot);
    
    // Keep only last 100 snapshots to prevent memory leaks
    if (this.snapshots.length > 100) {
      this.snapshots = this.snapshots.slice(-100);
    }
    
    return snapshot;
  }
  
  getSnapshots(machineId?: string): DebugSnapshot[] {
    return machineId 
      ? this.snapshots.filter(s => s.machineId === machineId)
      : this.snapshots;
  }
  
  exportDebugData(machineId?: string): string {
    const snapshots = this.getSnapshots(machineId);
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      machineId,
      snapshotCount: snapshots.length,
      snapshots
    }, null, 2);
  }
  
  clearSnapshots(machineId?: string) {
    if (machineId) {
      this.snapshots = this.snapshots.filter(s => s.machineId !== machineId);
    } else {
      this.snapshots = [];
    }
  }
  
  getPerformanceMetrics(machineId?: string) {
    const snapshots = this.getSnapshots(machineId);
    if (snapshots.length === 0) return null;
    
    const durations = snapshots.slice(1).map((snapshot, index) => 
      snapshot.timestamp - snapshots[index].timestamp
    );
    
    return {
      totalSnapshots: snapshots.length,
      averageTransitionTime: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minTransitionTime: durations.length > 0 ? Math.min(...durations) : 0,
      maxTransitionTime: durations.length > 0 ? Math.max(...durations) : 0,
      totalUptime: snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp
    };
  }
}

// ================================
// GLOBAL INSTANCES
// ================================

export const globalLogger = new MacroExecutionLogger();
export const globalDebugger = new MachineDebugger();

// ================================
// DEVELOPMENT HELPERS
// ================================

export const enableGlobalInspection = (config: Partial<InspectorConfig> = {}) => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Global inspection is only available in development mode');
    return;
  }
  
  const inspectorConfig = { ...DEFAULT_INSPECTOR_CONFIG, ...config };
  
  // Enable global logging
  (globalThis as any).__XSTATE_DEBUG__ = true;
  
  console.log('XState inspection enabled', inspectorConfig);
  
  return inspectorConfig;
};

export const disableGlobalInspection = () => {
  (globalThis as any).__XSTATE_DEBUG__ = false;
  console.log('XState inspection disabled');
};

// ================================
// EXPORTS
// ================================

// Types are already exported in the main export section above