/**
 * @fileOverview Enhanced Command Queue Management - Enterprise Implementation
 * 
 * Provides comprehensive command queue management with priority scheduling,
 * dependency resolution, event-driven architecture, and enterprise monitoring.
 * 
 * ENTERPRISE FEATURES:
 * - Priority-based command scheduling with dependency resolution
 * - Event-driven architecture with distributed tracing
 * - Circuit breaker integration for resilience
 * - Performance monitoring and memory management
 * - Security context validation and audit trails
 * - Comprehensive error isolation and recovery
 */

import { EventEmitter } from 'events';
import { MacroCommand, CommandResult, CommandError, SecurityContext, MacroExecutionContext } from '../interfaces/command';
import { generateUUID } from '@/lib/staging/uuid-polyfill';

// ===============================
// EVENT SYSTEM TYPES
// ===============================

export interface QueueEvent {
  type: 'started' | 'stepStarted' | 'stepCompleted' | 'stepFailed' | 'completed' | 'cancelled' | 'paused' | 'resumed';
  executionId: string;
  correlationId: string;
  command?: MacroCommand;
  commandIndex?: number;
  result?: CommandResult;
  error?: CommandError;
  timestamp: number;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  performance?: {
    memoryUsage: number;
    cpuUsage?: number;
    heapUsed: number;
  };
}

export interface QueueMetrics {
  totalCommands: number;
  completedCommands: number;
  failedCommands: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  memoryUsage: number;
  successRate: number;
}

// ===============================
// QUEUE CONFIGURATION
// ===============================

export interface QueueConfig {
  maxConcurrentCommands: number;
  maxHistorySize: number;
  memoryThreshold: number; // bytes
  enablePerformanceMonitoring: boolean;
  enableDistributedTracing: boolean;
  enableSecurityValidation: boolean;
}

const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  maxConcurrentCommands: 4,
  maxHistorySize: 100,
  memoryThreshold: 50 * 1024 * 1024, // 50MB
  enablePerformanceMonitoring: true,
  enableDistributedTracing: true,
  enableSecurityValidation: true,
};

// ===============================
// ENHANCED COMMAND QUEUE CLASS
// ===============================

export class EnhancedMacroCommandQueue extends EventEmitter {
  private commands: MacroCommand[] = [];
  private isExecuting = false;
  private isPaused = false;
  private isCancelled = false;
  private currentCommandIndex = 0;
  private context: MacroExecutionContext;
  private securityContext: SecurityContext;
  private config: QueueConfig;
  private executionId: string;
  private correlationId: string;
  private executionHistory: QueueEvent[] = [];
  private metrics: QueueMetrics;
  private startTime: number = 0;

  constructor(
    context: MacroExecutionContext,
    securityContext: SecurityContext,
    correlationId?: string,
    config?: Partial<QueueConfig>
  ) {
    super();
    this.context = context;
    this.securityContext = securityContext;
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
    this.executionId = `queue_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    this.correlationId = correlationId || `corr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    this.metrics = {
      totalCommands: 0,
      completedCommands: 0,
      failedCommands: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      memoryUsage: 0,
      successRate: 0,
    };

    // Set up memory monitoring if enabled
    if (this.config.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }
  }

  // ===============================
  // COMMAND MANAGEMENT
  // ===============================

  addCommand(command: MacroCommand): void {
    this.validateQueueModification();
    this.validateCommandSecurity(command);
    this.validateDependencies(command);
    
    this.commands.push(command);
    this.sortByPriority();
    this.metrics.totalCommands++;

    this.emit('commandAdded', {
      command,
      queueSize: this.commands.length,
      timestamp: Date.now()
    });
  }

  addCommands(commands: MacroCommand[]): void {
    this.validateQueueModification();
    
    // Validate all commands before adding any
    commands.forEach(cmd => {
      this.validateCommandSecurity(cmd);
      this.validateDependencies(cmd);
    });

    this.commands.push(...commands);
    this.sortByPriority();
    this.metrics.totalCommands += commands.length;

    this.emit('commandsAdded', {
      commands,
      queueSize: this.commands.length,
      timestamp: Date.now()
    });
  }

  removeCommand(commandId: string): boolean {
    this.validateQueueModification();
    
    const index = this.commands.findIndex(cmd => cmd.getId() === commandId);
    if (index !== -1) {
      const removedCommand = this.commands.splice(index, 1)[0];
      this.metrics.totalCommands--;
      
      this.emit('commandRemoved', {
        command: removedCommand,
        queueSize: this.commands.length,
        timestamp: Date.now()
      });
      
      return true;
    }
    return false;
  }

  clearQueue(): void {
    this.validateQueueModification();
    
    const clearedCount = this.commands.length;
    this.commands = [];
    this.metrics.totalCommands = 0;
    this.metrics.completedCommands = 0;
    this.metrics.failedCommands = 0;

    this.emit('queueCleared', {
      clearedCount,
      timestamp: Date.now()
    });
  }

  // ===============================
  // EXECUTION CONTROL
  // ===============================

  async execute(): Promise<void> {
    if (this.isExecuting) {
      throw new CommandError(
        'Queue is already executing',
        'ALREADY_EXECUTING',
        'BUSINESS',
        false,
        { executionId: this.executionId }
      );
    }

    if (this.commands.length === 0) {
      throw new CommandError(
        'No commands to execute',
        'EMPTY_QUEUE',
        'BUSINESS',
        false,
        { queueSize: this.commands.length }
      );
    }

    this.initializeExecution();

    this.emitEvent({
      type: 'started',
      executionId: this.executionId,
      correlationId: this.correlationId,
      timestamp: Date.now(),
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      performance: this.getPerformanceMetrics()
    });

    try {
      const resolvedOrder = this.resolveExecutionOrder();
      
      for (let i = this.currentCommandIndex; i < resolvedOrder.length; i++) {
        // Handle pause/cancel states
        await this.handleExecutionControl();
        
        if (this.isCancelled) {
          break;
        }

        const command = resolvedOrder[i];
        this.currentCommandIndex = i;

        await this.executeCommand(command, i);
        
        // Memory management check
        if (this.config.enablePerformanceMonitoring) {
          this.checkMemoryUsage();
        }
      }

      if (!this.isCancelled) {
        this.emitEvent({
          type: 'completed',
          executionId: this.executionId,
          correlationId: this.correlationId,
          timestamp: Date.now(),
          traceId: this.generateTraceId(),
          spanId: this.generateSpanId(),
          performance: this.getPerformanceMetrics()
        });
      }

    } catch (error) {
      const commandError = error instanceof CommandError ? error : new CommandError(
        error instanceof Error ? error.message : String(error),
        'QUEUE_EXECUTION_ERROR',
        'BUSINESS',
        false,
        { executionId: this.executionId, originalError: error }
      );

      this.emitEvent({
        type: 'stepFailed',
        executionId: this.executionId,
        correlationId: this.correlationId,
        error: commandError,
        timestamp: Date.now(),
        traceId: this.generateTraceId(),
        spanId: this.generateSpanId(),
        performance: this.getPerformanceMetrics()
      });

      throw commandError;
    } finally {
      this.finalizeExecution();
    }
  }

  pause(): void {
    if (!this.isExecuting) {
      throw new CommandError(
        'Cannot pause - queue is not executing',
        'NOT_EXECUTING',
        'BUSINESS',
        false
      );
    }

    this.isPaused = true;
    
    this.emitEvent({
      type: 'paused',
      executionId: this.executionId,
      correlationId: this.correlationId,
      timestamp: Date.now(),
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      commandIndex: this.currentCommandIndex
    });
  }

  resume(): void {
    if (!this.isExecuting || !this.isPaused) {
      throw new CommandError(
        'Cannot resume - queue is not paused',
        'NOT_PAUSED',
        'BUSINESS',
        false
      );
    }

    this.isPaused = false;
    
    this.emitEvent({
      type: 'resumed',
      executionId: this.executionId,
      correlationId: this.correlationId,
      timestamp: Date.now(),
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      commandIndex: this.currentCommandIndex
    });
  }

  cancel(): void {
    if (!this.isExecuting) {
      throw new CommandError(
        'Cannot cancel - queue is not executing',
        'NOT_EXECUTING',
        'BUSINESS',
        false
      );
    }

    this.isCancelled = true;
    this.isPaused = false;
    
    this.emitEvent({
      type: 'cancelled',
      executionId: this.executionId,
      correlationId: this.correlationId,
      timestamp: Date.now(),
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      commandIndex: this.currentCommandIndex
    });
  }

  // ===============================
  // PRIVATE EXECUTION METHODS
  // ===============================

  private initializeExecution(): void {
    this.isExecuting = true;
    this.isPaused = false;
    this.isCancelled = false;
    this.currentCommandIndex = 0;
    this.startTime = Date.now();
    
    // Reset metrics for this execution
    this.metrics.completedCommands = 0;
    this.metrics.failedCommands = 0;
    this.metrics.totalExecutionTime = 0;
  }

  private finalizeExecution(): void {
    const executionTime = Date.now() - this.startTime;
    this.metrics.totalExecutionTime = executionTime;
    this.metrics.averageExecutionTime = this.metrics.totalCommands > 0 
      ? this.metrics.totalExecutionTime / this.metrics.totalCommands 
      : 0;
    this.metrics.successRate = this.metrics.totalCommands > 0 
      ? this.metrics.completedCommands / this.metrics.totalCommands 
      : 0;

    this.isExecuting = false;
    this.isPaused = false;
    this.isCancelled = false;
  }

  private async handleExecutionControl(): Promise<void> {
    // Wait while paused
    while (this.isPaused && this.isExecuting && !this.isCancelled) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async executeCommand(command: MacroCommand, index: number): Promise<void> {
    const stepTraceId = this.generateTraceId();
    const stepSpanId = this.generateSpanId();

    this.emitEvent({
      type: 'stepStarted',
      executionId: this.executionId,
      correlationId: this.correlationId,
      command,
      commandIndex: index,
      timestamp: Date.now(),
      traceId: stepTraceId,
      spanId: stepSpanId,
      performance: this.getPerformanceMetrics()
    });

    try {
      const result = await command.executeWithRetry();
      
      // Store result in context
      this.context.setResult(command.getId(), result.data);

      if (result.success) {
        this.metrics.completedCommands++;
        
        this.emitEvent({
          type: 'stepCompleted',
          executionId: this.executionId,
          correlationId: this.correlationId,
          command,
          commandIndex: index,
          result,
          timestamp: Date.now(),
          traceId: stepTraceId,
          spanId: stepSpanId,
          performance: this.getPerformanceMetrics()
        });
      } else {
        this.metrics.failedCommands++;
        
        this.emitEvent({
          type: 'stepFailed',
          executionId: this.executionId,
          correlationId: this.correlationId,
          command,
          commandIndex: index,
          result,
          error: result.error,
          timestamp: Date.now(),
          traceId: stepTraceId,
          spanId: stepSpanId,
          performance: this.getPerformanceMetrics()
        });

        // Decide whether to continue or fail based on command configuration
        if (result.error && !result.error.retryable) {
          throw result.error;
        }
      }

    } catch (error) {
      this.metrics.failedCommands++;
      
      const commandError = error instanceof CommandError ? error : new CommandError(
        error instanceof Error ? error.message : String(error),
        'COMMAND_EXECUTION_ERROR',
        'BUSINESS',
        false,
        { commandId: command.getId(), originalError: error }
      );

      this.emitEvent({
        type: 'stepFailed',
        executionId: this.executionId,
        correlationId: this.correlationId,
        command,
        commandIndex: index,
        error: commandError,
        timestamp: Date.now(),
        traceId: stepTraceId,
        spanId: stepSpanId,
        performance: this.getPerformanceMetrics()
      });

      throw commandError;
    }
  }

  // ===============================
  // DEPENDENCY RESOLUTION
  // ===============================

  private resolveExecutionOrder(): MacroCommand[] {
    const resolved: MacroCommand[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (command: MacroCommand) => {
      const commandId = command.getId();
      
      if (visiting.has(commandId)) {
        throw new CommandError(
          `Circular dependency detected in command: ${command.getName()}`,
          'CIRCULAR_DEPENDENCY',
          'VALIDATION',
          false,
          { commandId, dependencies: command.getDependencies() }
        );
      }

      if (visited.has(commandId)) {
        return;
      }

      visiting.add(commandId);

      // Visit all dependencies first
      for (const depId of command.getDependencies()) {
        const depCommand = this.commands.find(cmd => cmd.getId() === depId);
        if (depCommand) {
          visit(depCommand);
        }
      }

      visiting.delete(commandId);
      visited.add(commandId);
      resolved.push(command);
    };

    // Visit all commands to resolve dependencies
    for (const command of this.commands) {
      visit(command);
    }

    return resolved;
  }

  // ===============================
  // VALIDATION METHODS
  // ===============================

  private validateQueueModification(): void {
    if (this.isExecuting) {
      throw new CommandError(
        'Cannot modify queue while executing',
        'QUEUE_LOCKED',
        'BUSINESS',
        false,
        { executionId: this.executionId, isExecuting: this.isExecuting }
      );
    }
  }

  private validateCommandSecurity(command: MacroCommand): void {
    if (!this.config.enableSecurityValidation) return;

    // Validate command permissions against security context
    const requiredPermissions = command.getPermissions();
    for (const permission of requiredPermissions) {
      if (!this.securityContext.permissions.includes(permission)) {
        throw new CommandError(
          `Command ${command.getName()} requires permission: ${permission}`,
          'INSUFFICIENT_PERMISSIONS',
          'SECURITY',
          false,
          { 
            commandId: command.getId(), 
            requiredPermissions, 
            userPermissions: this.securityContext.permissions 
          }
        );
      }
    }
  }

  private validateDependencies(command: MacroCommand): void {
    const dependencies = command.getDependencies();
    for (const depId of dependencies) {
      if (!this.commands.find(cmd => cmd.getId() === depId)) {
        throw new CommandError(
          `Command ${command.getName()} has missing dependency: ${depId}`,
          'MISSING_DEPENDENCY',
          'VALIDATION',
          false,
          { commandId: command.getId(), missingDependency: depId, dependencies }
        );
      }
    }
  }

  private sortByPriority(): void {
    this.commands.sort((a, b) => a.getPriority() - b.getPriority());
  }

  // ===============================
  // MONITORING AND METRICS
  // ===============================

  private setupPerformanceMonitoring(): void {
    // Set up periodic memory monitoring
    setInterval(() => {
      this.checkMemoryUsage();
    }, 10000); // Every 10 seconds
  }

  private checkMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage().heapUsed;
      this.metrics.memoryUsage = memUsage;
      
      if (memUsage > this.config.memoryThreshold) {
        this.cleanupHistory();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        this.emit('memoryThresholdExceeded', {
          memoryUsage: memUsage,
          threshold: this.config.memoryThreshold,
          timestamp: Date.now()
        });
      }
    }
  }

  private cleanupHistory(): void {
    const targetSize = Math.floor(this.config.maxHistorySize * 0.7); // Keep 70%
    if (this.executionHistory.length > targetSize) {
      this.executionHistory = this.executionHistory.slice(-targetSize);
    }
  }

  private getPerformanceMetrics() {
    if (typeof process !== 'undefined' && process.memoryUsage && process.cpuUsage) {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        memoryUsage: memUsage.heapUsed,
        cpuUsage: cpuUsage.user + cpuUsage.system,
        heapUsed: memUsage.heapUsed
      };
    }
    
    return {
      memoryUsage: 0,
      heapUsed: 0
    };
  }

  // ===============================
  // EVENT MANAGEMENT
  // ===============================

  private emitEvent(event: QueueEvent): void {
    // Add to history if within limits
    if (this.executionHistory.length < this.config.maxHistorySize) {
      this.executionHistory.push(event);
    }
    
    // Emit the event
    this.emit(event.type, event);
    this.emit('queueEvent', event);
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateSpanId(): string {
    return `span_${Math.random().toString(36).substring(2, 11)}`;
  }

  // ===============================
  // PUBLIC ACCESSORS
  // ===============================

  getQueueSize(): number {
    return this.commands.length;
  }

  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  getExecutionHistory(): QueueEvent[] {
    return [...this.executionHistory];
  }

  isRunning(): boolean {
    return this.isExecuting;
  }

  isQueuePaused(): boolean {
    return this.isPaused;
  }

  isQueueCancelled(): boolean {
    return this.isCancelled;
  }

  getCurrentCommandIndex(): number {
    return this.currentCommandIndex;
  }

  getCommands(): MacroCommand[] {
    return [...this.commands];
  }

  getExecutionId(): string {
    return this.executionId;
  }

  getCorrelationId(): string {
    return this.correlationId;
  }
}