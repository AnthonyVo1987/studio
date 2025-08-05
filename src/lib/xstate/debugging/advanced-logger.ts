/**
 * @fileOverview Advanced Logging System for XState Debugging
 * 
 * Comprehensive logging infrastructure with structured output, contextual information,
 * performance-aware sampling, and seamless integration with existing ticker-logger system.
 * Supports log filtering, aggregation, and export capabilities.
 */

import type {
  DebugConfiguration,
  DebugLevel,
  DebugCategory,
  DebugLogFilter,
  MachineSnapshot,
  StateTransition,
  TickerDebugContext,
  MacroDebugEvent
} from './debugging-types';
import type { MacroExecutionContext, MacroExecutionEvent } from '../types/macro-types';
import { 
  createTickerLogger, 
  generateExecutionId, 
  type LogLevel, 
  type LogContext,
  type TickerLogOptions 
} from '../../ticker-logger';

// ================================
// ADVANCED LOGGER CONFIGURATION
// ================================

export const DEFAULT_LOGGING_CONFIG: DebugConfiguration = {
  enabled: process.env.NODE_ENV === 'development',
  level: 'info',
  enableInspector: true,
  enableConsoleLogging: true,
  enablePerformanceMetrics: true,
  enableStateSnapshots: true,
  enableTransitionLogging: true,
  enableActionLogging: true,
  enableGuardLogging: false,
  enableServiceLogging: true,
  enableErrorTracking: true,
  maxSnapshots: 1000,
  snapshotInterval: 1000,
  performanceSamplingRate: 0.1,
  logFilters: []
};

// ================================
// STRUCTURED LOG ENTRY
// ================================

export interface StructuredLogEntry {
  id: string;
  timestamp: number;
  level: DebugLevel;
  category: DebugCategory;
  machineId?: string;
  message: string;
  data?: any;
  context?: TickerDebugContext;
  performance?: LogPerformanceMetrics;
  stackTrace?: string;
  correlationId?: string;
  sessionId: string;
  environment: string;
}

export interface LogPerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency?: number;
  renderTime?: number;
}

// ================================
// LOG AGGREGATION AND FILTERING
// ================================

export class LogAggregator {
  private entries: StructuredLogEntry[] = [];
  private maxEntries: number;
  private filters: DebugLogFilter[];
  private sessionId: string;

  constructor(maxEntries: number = 10000, filters: DebugLogFilter[] = []) {
    this.maxEntries = maxEntries;
    this.filters = filters;
    this.sessionId = generateExecutionId('session');
  }

  addEntry(entry: Omit<StructuredLogEntry, 'id' | 'timestamp' | 'sessionId' | 'environment'>): void {
    if (!this.shouldLogEntry(entry)) return;

    const fullEntry: StructuredLogEntry = {
      ...entry,
      id: generateExecutionId('log'),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      environment: process.env.NODE_ENV || 'unknown'
    };

    this.entries.push(fullEntry);

    // Trim entries if we exceed max
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  private shouldLogEntry(entry: Partial<StructuredLogEntry>): boolean {
    return this.filters.every(filter => this.applyFilter(filter, entry));
  }

  private applyFilter(filter: DebugLogFilter, entry: Partial<StructuredLogEntry>): boolean {
    const matchesPattern = this.matchesPattern(filter.pattern, entry.message || '');
    const matchesCategory = filter.categories.length === 0 || 
                           filter.categories.includes(entry.category as DebugCategory);
    
    const matches = matchesPattern && matchesCategory;
    
    return filter.type === 'include' ? matches : !matches;
  }

  private matchesPattern(pattern: string | RegExp, text: string): boolean {
    if (typeof pattern === 'string') {
      return text.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(text);
  }

  getEntries(filter?: Partial<Pick<StructuredLogEntry, 'level' | 'category' | 'machineId'>>): StructuredLogEntry[] {
    if (!filter) return [...this.entries];

    return this.entries.filter(entry => {
      if (filter.level && entry.level !== filter.level) return false;
      if (filter.category && entry.category !== filter.category) return false;
      if (filter.machineId && entry.machineId !== filter.machineId) return false;
      return true;
    });
  }

  getEntriesByTimeRange(start: number, end: number): StructuredLogEntry[] {
    return this.entries.filter(entry => 
      entry.timestamp >= start && entry.timestamp <= end
    );
  }

  clearEntries(machineId?: string): void {
    if (machineId) {
      this.entries = this.entries.filter(entry => entry.machineId !== machineId);
    } else {
      this.entries = [];
    }
  }

  exportLogs(format: 'json' | 'csv' | 'text' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify({
          exportTime: new Date().toISOString(),
          sessionId: this.sessionId,
          entryCount: this.entries.length,
          entries: this.entries
        }, null, 2);
      
      case 'csv':
        return this.exportToCsv();
      
      case 'text':
        return this.exportToText();
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportToCsv(): string {
    const headers = [
      'timestamp', 'level', 'category', 'machineId', 'message', 
      'correlationId', 'executionTime', 'memoryUsage'
    ];
    
    const rows = this.entries.map(entry => [
      new Date(entry.timestamp).toISOString(),
      entry.level,
      entry.category,
      entry.machineId || '',
      entry.message.replace(/"/g, '""'),
      entry.correlationId || '',
      entry.performance?.executionTime || '',
      entry.performance?.memoryUsage || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  private exportToText(): string {
    return this.entries.map(entry => {
      const timestamp = new Date(entry.timestamp).toISOString();
      const machine = entry.machineId ? `[${entry.machineId}] ` : '';
      const perf = entry.performance ? 
        ` (${entry.performance.executionTime}ms, ${entry.performance.memoryUsage}MB)` : '';
      
      return `${timestamp} [${entry.level.toUpperCase()}] [${entry.category}] ${machine}${entry.message}${perf}`;
    }).join('\n');
  }

  getStatistics(): LogStatistics {
    const levelCounts = this.entries.reduce((acc, entry) => {
      acc[entry.level] = (acc[entry.level] || 0) + 1;
      return acc;
    }, {} as Record<DebugLevel, number>);

    const categoryCounts = this.entries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1;
      return acc;
    }, {} as Record<DebugCategory, number>);

    const performanceMetrics = this.entries
      .filter(entry => entry.performance)
      .map(entry => entry.performance!);

    return {
      totalEntries: this.entries.length,
      levelDistribution: levelCounts,
      categoryDistribution: categoryCounts,
      timeRange: this.entries.length > 0 ? {
        start: this.entries[0].timestamp,
        end: this.entries[this.entries.length - 1].timestamp
      } : null,
      performanceSummary: performanceMetrics.length > 0 ? {
        averageExecutionTime: performanceMetrics.reduce((sum, p) => sum + p.executionTime, 0) / performanceMetrics.length,
        averageMemoryUsage: performanceMetrics.reduce((sum, p) => sum + p.memoryUsage, 0) / performanceMetrics.length,
        maxExecutionTime: Math.max(...performanceMetrics.map(p => p.executionTime)),
        maxMemoryUsage: Math.max(...performanceMetrics.map(p => p.memoryUsage))
      } : null
    };
  }
}

export interface LogStatistics {
  totalEntries: number;
  levelDistribution: Record<DebugLevel, number>;
  categoryDistribution: Record<DebugCategory, number>;
  timeRange: { start: number; end: number } | null;
  performanceSummary: {
    averageExecutionTime: number;
    averageMemoryUsage: number;
    maxExecutionTime: number;
    maxMemoryUsage: number;
  } | null;
}

// ================================
// ADVANCED LOGGER CLASS
// ================================

export class AdvancedXStateLogger {
  private config: DebugConfiguration;
  private aggregator: LogAggregator;
  private tickerLogger: ReturnType<typeof createTickerLogger>;
  private performanceObserver?: PerformanceObserver;
  private memoryMonitor?: NodeJS.Timeout;

  constructor(config: Partial<DebugConfiguration> = {}) {
    this.config = { ...DEFAULT_LOGGING_CONFIG, ...config };
    this.aggregator = new LogAggregator(this.config.maxSnapshots, this.config.logFilters);
    this.tickerLogger = createTickerLogger('XSTATE', 'AdvancedLogger', generateExecutionId('logger'));

    if (this.config.enablePerformanceMetrics) {
      this.initializePerformanceMonitoring();
    }
  }

  // ================================
  // CORE LOGGING METHODS
  // ================================

  logStateTransition(transition: StateTransition): void {
    if (!this.config.enabled || !this.config.enableTransitionLogging) return;

    const entry = {
      level: 'info' as DebugLevel,
      category: 'state-transition' as DebugCategory,
      machineId: transition.machineId,
      message: `State transition: ${this.formatState(transition.from)} → ${this.formatState(transition.to)}`,
      data: {
        event: transition.event,
        duration: transition.duration,
        success: transition.success,
        actions: transition.actions.map(a => a.name),
        guards: transition.guards.map(g => ({ name: g.name, result: g.result }))
      },
      context: this.createTickerContext(transition.context),
      performance: {
        executionTime: transition.duration,
        memoryUsage: this.getCurrentMemoryUsage(),
        cpuUsage: this.getCurrentCpuUsage()
      },
      correlationId: transition.context?.executionId
    };

    this.addLogEntry(entry);

    // Also log to ticker logger for consistency
    this.tickerLogger.state(
      'StateTransition',
      `${this.formatState(transition.from)} → ${this.formatState(transition.to)}`,
      { event: transition.event?.type, duration: transition.duration }
    );
  }

  logActionExecution(
    machineId: string,
    actionName: string,
    success: boolean,
    executionTime: number,
    context?: MacroExecutionContext,
    error?: Error
  ): void {
    if (!this.config.enabled || !this.config.enableActionLogging) return;

    const entry = {
      level: error ? 'error' as DebugLevel : 'debug' as DebugLevel,
      category: 'action-execution' as DebugCategory,
      machineId,
      message: `Action ${actionName}: ${success ? 'SUCCESS' : 'FAILED'}${error ? ` - ${error.message}` : ''}`,
      data: {
        actionName,
        success,
        executionTime,
        context: context ? {
          ticker: context.ticker,
          executionId: context.executionId,
          currentStep: context.currentStep
        } : undefined,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      },
      context: this.createTickerContext({ 
        ticker: context?.ticker,
        executionId: context?.executionId 
      }),
      performance: {
        executionTime,
        memoryUsage: this.getCurrentMemoryUsage(),
        cpuUsage: this.getCurrentCpuUsage()
      },
      correlationId: context?.executionId
    };

    this.addLogEntry(entry);

    // Log to ticker logger
    const tickerLogMethod = error ? this.tickerLogger.error : this.tickerLogger.debug;
    tickerLogMethod(
      'ActionExecution',
      `${actionName}: ${success ? 'SUCCESS' : 'FAILED'}`,
      { executionTime, error: error?.message }
    );
  }

  logGuardEvaluation(
    machineId: string,
    guardName: string,
    result: boolean,
    evaluationTime: number,
    context?: MacroExecutionContext,
    parameters?: any
  ): void {
    if (!this.config.enabled || !this.config.enableGuardLogging) return;

    const entry = {
      level: 'debug' as DebugLevel,
      category: 'guard-evaluation' as DebugCategory,
      machineId,
      message: `Guard ${guardName}: ${result ? 'PASS' : 'FAIL'}`,
      data: {
        guardName,
        result,
        evaluationTime,
        parameters,
        context: context ? {
          ticker: context.ticker,
          executionId: context.executionId,
          currentStep: context.currentStep
        } : undefined
      },
      context: this.createTickerContext({
        ticker: context?.ticker,
        executionId: context?.executionId
      }),
      performance: {
        executionTime: evaluationTime,
        memoryUsage: this.getCurrentMemoryUsage(),
        cpuUsage: this.getCurrentCpuUsage()
      },
      correlationId: context?.executionId
    };

    this.addLogEntry(entry);
  }

  logServiceInvocation(
    machineId: string,
    serviceName: string,
    status: 'start' | 'success' | 'error',
    duration?: number,
    context?: MacroExecutionContext,
    data?: any,
    error?: Error
  ): void {
    if (!this.config.enabled || !this.config.enableServiceLogging) return;

    const level: DebugLevel = error ? 'error' : status === 'start' ? 'debug' : 'info';

    const entry = {
      level,
      category: 'service-invocation' as DebugCategory,
      machineId,
      message: `Service ${serviceName}: ${status.toUpperCase()}${error ? ` - ${error.message}` : ''}`,
      data: {
        serviceName,
        status,
        duration,
        data,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined,
        context: context ? {
          ticker: context.ticker,
          executionId: context.executionId,
          currentStep: context.currentStep
        } : undefined
      },
      context: this.createTickerContext({
        ticker: context?.ticker,
        executionId: context?.executionId
      }),
      performance: duration ? {
        executionTime: duration,
        memoryUsage: this.getCurrentMemoryUsage(),
        cpuUsage: this.getCurrentCpuUsage()
      } : undefined,
      correlationId: context?.executionId
    };

    this.addLogEntry(entry);

    // Log to ticker logger
    this.tickerLogger.serverAction(
      'ServiceInvocation',
      `${serviceName}: ${status}`,
      { duration, error: error?.message }
    );
  }

  logMachineSnapshot(snapshot: MachineSnapshot): void {
    if (!this.config.enabled || !this.config.enableStateSnapshots) return;

    // Sample snapshots based on configuration
    if (Math.random() > this.config.performanceSamplingRate) return;

    const entry = {
      level: 'trace' as DebugLevel,
      category: 'machine-lifecycle' as DebugCategory,
      machineId: snapshot.machineId,
      message: `Machine snapshot captured: ${this.formatState(snapshot.state)}`,
      data: {
        snapshot: {
          state: snapshot.state,
          contextSize: snapshot.performance.contextSize,
          memoryFootprint: snapshot.performance.memoryFootprint,
          uptime: snapshot.performance.machineUptime
        }
      },
      context: this.createTickerContext({
        ticker: snapshot.metadata.ticker,
        executionId: snapshot.metadata.executionId,
        snapshotId: snapshot.id
      }),
      performance: {
        executionTime: snapshot.performance.captureTime,
        memoryUsage: snapshot.performance.memoryFootprint,
        cpuUsage: this.getCurrentCpuUsage()
      },
      correlationId: snapshot.metadata.executionId
    };

    this.addLogEntry(entry);
  }

  logError(
    machineId: string,
    error: Error,
    context?: MacroExecutionContext,
    additionalData?: any
  ): void {
    if (!this.config.enabled || !this.config.enableErrorTracking) return;

    const entry = {
      level: 'error' as DebugLevel,
      category: 'error-occurrence' as DebugCategory,
      machineId,
      message: `Error: ${error.message}`,
      data: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context: context ? {
          ticker: context.ticker,
          executionId: context.executionId,
          currentStep: context.currentStep
        } : undefined,
        additionalData
      },
      context: this.createTickerContext({
        ticker: context?.ticker,
        executionId: context?.executionId
      }),
      performance: {
        executionTime: 0,
        memoryUsage: this.getCurrentMemoryUsage(),
        cpuUsage: this.getCurrentCpuUsage()
      },
      stackTrace: error.stack,
      correlationId: context?.executionId
    };

    this.addLogEntry(entry);

    // Log to ticker logger
    this.tickerLogger.error(
      'MachineError',
      error.message,
      { error: error.name, stack: error.stack }
    );
  }

  logPerformanceMetric(
    machineId: string,
    metricName: string,
    value: number,
    unit: string,
    context?: MacroExecutionContext
  ): void {
    if (!this.config.enabled || !this.config.enablePerformanceMetrics) return;

    const entry = {
      level: 'info' as DebugLevel,
      category: 'performance-metric' as DebugCategory,
      machineId,
      message: `Performance metric: ${metricName} = ${value}${unit}`,
      data: {
        metricName,
        value,
        unit,
        context: context ? {
          ticker: context.ticker,
          executionId: context.executionId,
          currentStep: context.currentStep
        } : undefined
      },
      context: this.createTickerContext({
        ticker: context?.ticker,
        executionId: context?.executionId
      }),
      performance: {
        executionTime: 0,
        memoryUsage: this.getCurrentMemoryUsage(),
        cpuUsage: this.getCurrentCpuUsage()
      },
      correlationId: context?.executionId
    };

    this.addLogEntry(entry);

    // Log to ticker logger
    this.tickerLogger.performance(
      'PerformanceMetric',
      `${metricName}: ${value}${unit}`,
      { metric: metricName, value, unit }
    );
  }

  // ================================
  // CONVENIENCE METHODS
  // ================================

  debug(machineId: string, message: string, data?: any, context?: MacroExecutionContext): void {
    this.log('debug', 'machine-lifecycle', machineId, message, data, context);
  }

  info(machineId: string, message: string, data?: any, context?: MacroExecutionContext): void {
    this.log('info', 'machine-lifecycle', machineId, message, data, context);
  }

  warn(machineId: string, message: string, data?: any, context?: MacroExecutionContext): void {
    this.log('warn', 'machine-lifecycle', machineId, message, data, context);
  }

  error(machineId: string, message: string, data?: any, context?: MacroExecutionContext): void {
    this.log('error', 'error-occurrence', machineId, message, data, context);
  }

  private log(
    level: DebugLevel,
    category: DebugCategory,
    machineId: string,
    message: string,
    data?: any,
    context?: MacroExecutionContext
  ): void {
    if (!this.config.enabled) return;

    const entry = {
      level,
      category,
      machineId,
      message,
      data,
      context: this.createTickerContext({
        ticker: context?.ticker,
        executionId: context?.executionId
      }),
      performance: {
        executionTime: 0,
        memoryUsage: this.getCurrentMemoryUsage(),
        cpuUsage: this.getCurrentCpuUsage()
      },
      correlationId: context?.executionId
    };

    this.addLogEntry(entry);
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private addLogEntry(entry: Omit<StructuredLogEntry, 'id' | 'timestamp' | 'sessionId' | 'environment'>): void {
    this.aggregator.addEntry(entry);

    // Console logging if enabled
    if (this.config.enableConsoleLogging) {
      this.logToConsole(entry);
    }
  }

  private logToConsole(entry: Omit<StructuredLogEntry, 'id' | 'timestamp' | 'sessionId' | 'environment'>): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    const machine = entry.machineId ? ` [${entry.machineId}]` : '';
    const message = `${prefix}${machine} ${entry.message}`;

    switch (entry.level) {
      case 'error':
        console.error(message, entry.data);
        break;
      case 'warn':
        console.warn(message, entry.data);
        break;
      case 'debug':
      case 'trace':
        console.debug(message, entry.data);
        break;
      default:
        console.log(message, entry.data);
        break;
    }
  }

  private createTickerContext(data: {
    ticker?: string;
    executionId?: string;
    snapshotId?: string;
    transitionId?: string;
  }): TickerDebugContext {
    return {
      ticker: data.ticker || 'SYSTEM',
      page: 'XState-Debug',
      action: 'LogEntry',
      context: 'State',
      machineId: data.executionId,
      snapshotId: data.snapshotId,
      transitionId: data.transitionId,
      performanceMetrics: {
        memory: this.getCurrentMemoryUsage(),
        cpu: this.getCurrentCpuUsage()
      }
    };
  }

  private formatState(state: any): string {
    if (typeof state === 'string') return state;
    if (typeof state === 'object') return JSON.stringify(state);
    return String(state);
  }

  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }

  private getCurrentCpuUsage(): number {
    // Simplified CPU usage - in production, use proper CPU monitoring
    return Math.random() * 100; // Placeholder
  }

  private initializePerformanceMonitoring(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.startsWith('xstate-')) {
            this.logPerformanceMetric(
              'performance-monitor',
              entry.name,
              entry.duration,
              'ms'
            );
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }

    // Memory monitoring
    if (typeof process !== 'undefined') {
      this.memoryMonitor = setInterval(() => {
        const memUsage = process.memoryUsage();
        this.logPerformanceMetric(
          'memory-monitor',
          'heap-used',
          memUsage.heapUsed / 1024 / 1024,
          'MB'
        );
      }, 30000); // Every 30 seconds
    }
  }

  // ================================
  // PUBLIC API
  // ================================

  getConfiguration(): DebugConfiguration {
    return { ...this.config };
  }

  updateConfiguration(updates: Partial<DebugConfiguration>): void {
    this.config = { ...this.config, ...updates };
    this.aggregator = new LogAggregator(this.config.maxSnapshots, this.config.logFilters);
  }

  getLogs(filter?: Partial<Pick<StructuredLogEntry, 'level' | 'category' | 'machineId'>>): StructuredLogEntry[] {
    return this.aggregator.getEntries(filter);
  }

  getLogsByTimeRange(start: number, end: number): StructuredLogEntry[] {
    return this.aggregator.getEntriesByTimeRange(start, end);
  }

  clearLogs(machineId?: string): void {
    this.aggregator.clearEntries(machineId);
  }

  exportLogs(format: 'json' | 'csv' | 'text' = 'json'): string {
    return this.aggregator.exportLogs(format);
  }

  getStatistics(): LogStatistics {
    return this.aggregator.getStatistics();
  }

  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }
  }
}

// ================================
// GLOBAL LOGGER INSTANCE
// ================================

export const globalAdvancedLogger = new AdvancedXStateLogger();

// ================================
// FACTORY FUNCTIONS
// ================================

export const createMachineLogger = (
  machineId: string,
  config?: Partial<DebugConfiguration>
) => {
  const logger = config ? new AdvancedXStateLogger(config) : globalAdvancedLogger;
  
  return {
    logTransition: (transition: StateTransition) => logger.logStateTransition(transition),
    logAction: (name: string, success: boolean, time: number, context?: MacroExecutionContext, error?: Error) => 
      logger.logActionExecution(machineId, name, success, time, context, error),
    logGuard: (name: string, result: boolean, time: number, context?: MacroExecutionContext, params?: any) => 
      logger.logGuardEvaluation(machineId, name, result, time, context, params),
    logService: (name: string, status: 'start' | 'success' | 'error', duration?: number, context?: MacroExecutionContext, data?: any, error?: Error) => 
      logger.logServiceInvocation(machineId, name, status, duration, context, data, error),
    logSnapshot: (snapshot: MachineSnapshot) => logger.logMachineSnapshot(snapshot),
    logError: (error: Error, context?: MacroExecutionContext, data?: any) => 
      logger.logError(machineId, error, context, data),
    logMetric: (name: string, value: number, unit: string, context?: MacroExecutionContext) => 
      logger.logPerformanceMetric(machineId, name, value, unit, context),
    debug: (message: string, data?: any, context?: MacroExecutionContext) => 
      logger.debug(machineId, message, data, context),
    info: (message: string, data?: any, context?: MacroExecutionContext) => 
      logger.info(machineId, message, data, context),
    warn: (message: string, data?: any, context?: MacroExecutionContext) => 
      logger.warn(machineId, message, data, context),
    error: (message: string, data?: any, context?: MacroExecutionContext) => 
      logger.error(machineId, message, data, context)
  };
};

// Already exported above - no duplicate exports needed