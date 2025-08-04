/**
 * @fileoverview Machine Composition System for Advanced Workflow Orchestration
 * 
 * Provides sophisticated machine composition patterns including sequential,
 * parallel, conditional, and pipeline execution with data flow management
 * and comprehensive error handling.
 */

import {
  createMachine,
  createActor,
  assign,
  sendTo,
  raise,
  type ActorRef,
  type AnyMachineSnapshot
} from 'xstate';
import type {
  MachineCompositionConfig,
  CompositionMachine,
  DataMapping,
  DataFlowConfig,
  ValidationRule,
  DataTransform,
  CompositionErrorHandling,
  CompositionRetryConfig,
  CompensationStrategy,
  PerformanceConstraints,
  MachineOptions,
  AdvancedEvent
} from './advanced-types';

// ================================
// DATA TRANSFORMATION PIPELINE
// ================================

/**
 * Data transformation and validation pipeline for machine composition
 */
export class DataTransformationPipeline {
  private transforms: Map<string, DataTransform> = new Map();
  private validators: Map<string, ValidationRule> = new Map();

  /**
   * Add data transformation step
   */
  addTransform(transform: DataTransform): void {
    this.transforms.set(transform.id, transform);
  }

  /**
   * Add validation rule
   */
  addValidator(validator: ValidationRule): void {
    this.validators.set(validator.id, validator);
  }

  /**
   * Apply transformations to data
   */
  async applyTransformations(data: any): Promise<{ data: any; errors: string[] }> {
    const errors: string[] = [];
    let transformedData = data;

    // Sort transforms by order
    const sortedTransforms = Array.from(this.transforms.values())
      .sort((a, b) => a.order - b.order);

    for (const transform of sortedTransforms) {
      try {
        transformedData = transform.transform(transformedData);
      } catch (error) {
        errors.push(`Transform ${transform.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { data: transformedData, errors };
  }

  /**
   * Validate data against all rules
   */
  validateData(data: any): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const validator of this.validators.values()) {
      try {
        const fieldValue = this.getValueFromPath(data, validator.field);
        const result = validator.validator(fieldValue);

        if (typeof result === 'string') {
          // Validation failed with custom message
          if (validator.severity === 'error') {
            errors.push(result);
          } else if (validator.severity === 'warning') {
            warnings.push(result);
          }
        } else if (!result) {
          // Boolean validation failed
          if (validator.severity === 'error') {
            errors.push(validator.errorMessage);
          } else if (validator.severity === 'warning') {
            warnings.push(validator.errorMessage);
          }
        }
      } catch (error) {
        errors.push(`Validation ${validator.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get value from object path
   */
  private getValueFromPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// ================================
// COMPOSITION ORCHESTRATOR
// ================================

/**
 * Main orchestrator for machine composition workflows
 */
export class MachineCompositionOrchestrator {
  private compositions: Map<string, CompositionExecution> = new Map();
  private dataTransformationPipeline: DataTransformationPipeline;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.dataTransformationPipeline = new DataTransformationPipeline();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Execute machine composition workflow
   */
  async executeComposition(
    compositionId: string,
    config: MachineCompositionConfig,
    initialData: any = {}
  ): Promise<CompositionResult> {
    const execution: CompositionExecution = {
      id: compositionId,
      config,
      state: 'initializing',
      machineActors: new Map(),
      dataFlow: initialData,
      errors: [],
      startTime: Date.now(),
      endTime: null,
      performance: {
        machinePerformance: new Map(),
        dataTransformationTime: 0,
        totalExecutionTime: 0
      }
    };

    this.compositions.set(compositionId, execution);

    try {
      // Setup data transformation pipeline
      this.setupDataPipeline(config.dataFlow);

      // Execute based on strategy
      switch (config.strategy) {
        case 'sequential':
          return await this.executeSequential(execution);
        case 'parallel':
          return await this.executeParallel(execution);
        case 'conditional':
          return await this.executeConditional(execution);
        case 'pipeline':
          return await this.executePipeline(execution);
        default:
          throw new Error(`Unknown composition strategy: ${config.strategy}`);
      }
    } catch (error) {
      execution.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return this.handleCompositionError(execution, error as Error);
    } finally {
      execution.endTime = Date.now();
      execution.performance.totalExecutionTime = execution.endTime - execution.startTime;
    }
  }

  /**
   * Execute sequential composition
   */
  private async executeSequential(execution: CompositionExecution): Promise<CompositionResult> {
    execution.state = 'executing';
    const results: Map<string, any> = new Map();

    for (const machine of execution.config.machines) {
      const startTime = Date.now();
      
      try {
        // Apply input mappings
        const mappedInput = this.applyDataMappings(execution.dataFlow, machine.inputMapping);
        
        // Create and start machine
        const machineActor = await this.createMachineActor(machine, mappedInput);
        execution.machineActors.set(machine.id, machineActor);
        
        // Wait for completion
        const result = await this.waitForMachineCompletion(machineActor, machine.options.timeout);
        
        // Apply output mappings
        const mappedOutput = this.applyDataMappings(result, machine.outputMapping);
        results.set(machine.id, mappedOutput);
        
        // Update data flow for next machine
        execution.dataFlow = { ...execution.dataFlow, ...mappedOutput };
        
        // Record performance
        const executionTime = Date.now() - startTime;
        execution.performance.machinePerformance.set(machine.id, {
          executionTime,
          success: true,
          memoryUsage: this.estimateMemoryUsage(result)
        });
        
      } catch (error) {
        const executionTime = Date.now() - startTime;
        execution.performance.machinePerformance.set(machine.id, {
          executionTime,
          success: false,
          memoryUsage: 0
        });
        
        // Handle error based on error handling strategy
        const handled = await this.handleMachineError(execution, machine, error as Error);
        if (!handled) {
          throw error;
        }
      }
    }

    execution.state = 'completed';
    return this.createCompositionResult(execution, results);
  }

  /**
   * Execute parallel composition
   */
  private async executeParallel(execution: CompositionExecution): Promise<CompositionResult> {
    execution.state = 'executing';
    
    // Check dependencies and create execution plan
    const executionPlan = this.createParallelExecutionPlan(execution.config.machines);
    const results: Map<string, any> = new Map();
    
    for (const batch of executionPlan) {
      const batchPromises = batch.map(async (machine) => {
        const startTime = Date.now();
        
        try {
          // Apply input mappings with current data flow
          const mappedInput = this.applyDataMappings(execution.dataFlow, machine.inputMapping);
          
          // Create and start machine
          const machineActor = await this.createMachineActor(machine, mappedInput);
          execution.machineActors.set(machine.id, machineActor);
          
          // Wait for completion
          const result = await this.waitForMachineCompletion(machineActor, machine.options.timeout);
          
          // Apply output mappings
          const mappedOutput = this.applyDataMappings(result, machine.outputMapping);
          
          // Record performance
          const executionTime = Date.now() - startTime;
          execution.performance.machinePerformance.set(machine.id, {
            executionTime,
            success: true,
            memoryUsage: this.estimateMemoryUsage(result)
          });
          
          return { machineId: machine.id, result: mappedOutput };
          
        } catch (error) {
          const executionTime = Date.now() - startTime;
          execution.performance.machinePerformance.set(machine.id, {
            executionTime,
            success: false,
            memoryUsage: 0
          });
          
          // Handle error
          const handled = await this.handleMachineError(execution, machine, error as Error);
          if (!handled) {
            throw error;
          }
          
          return { machineId: machine.id, result: null, error: error as Error };
        }
      });
      
      // Wait for batch completion
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      for (const promiseResult of batchResults) {
        if (promiseResult.status === 'fulfilled' && promiseResult.value.result) {
          results.set(promiseResult.value.machineId, promiseResult.value.result);
          // Update shared data flow
          execution.dataFlow = { ...execution.dataFlow, ...promiseResult.value.result };
        }
      }
    }

    execution.state = 'completed';
    return this.createCompositionResult(execution, results);
  }

  /**
   * Execute conditional composition
   */
  private async executeConditional(execution: CompositionExecution): Promise<CompositionResult> {
    execution.state = 'executing';
    const results: Map<string, any> = new Map();

    for (const machine of execution.config.machines) {
      // Check if machine should execute based on current data
      if (!this.shouldExecuteMachine(machine, execution.dataFlow)) {
        continue;
      }

      const startTime = Date.now();
      
      try {
        // Apply input mappings
        const mappedInput = this.applyDataMappings(execution.dataFlow, machine.inputMapping);
        
        // Create and start machine
        const machineActor = await this.createMachineActor(machine, mappedInput);
        execution.machineActors.set(machine.id, machineActor);
        
        // Wait for completion
        const result = await this.waitForMachineCompletion(machineActor, machine.options.timeout);
        
        // Apply output mappings
        const mappedOutput = this.applyDataMappings(result, machine.outputMapping);
        results.set(machine.id, mappedOutput);
        
        // Update data flow
        execution.dataFlow = { ...execution.dataFlow, ...mappedOutput };
        
        // Record performance
        const executionTime = Date.now() - startTime;
        execution.performance.machinePerformance.set(machine.id, {
          executionTime,
          success: true,
          memoryUsage: this.estimateMemoryUsage(result)
        });
        
      } catch (error) {
        const executionTime = Date.now() - startTime;
        execution.performance.machinePerformance.set(machine.id, {
          executionTime,
          success: false,
          memoryUsage: 0
        });
        
        const handled = await this.handleMachineError(execution, machine, error as Error);
        if (!handled) {
          throw error;
        }
      }
    }

    execution.state = 'completed';
    return this.createCompositionResult(execution, results);
  }

  /**
   * Execute pipeline composition
   */
  private async executePipeline(execution: CompositionExecution): Promise<CompositionResult> {
    execution.state = 'executing';
    const results: Map<string, any> = new Map();
    let pipelineData = execution.dataFlow;

    for (const machine of execution.config.machines) {
      const startTime = Date.now();
      
      try {
        // Transform data through pipeline
        const transformedInput = await this.transformPipelineData(pipelineData, machine);
        
        // Apply input mappings
        const mappedInput = this.applyDataMappings(transformedInput, machine.inputMapping);
        
        // Create and start machine
        const machineActor = await this.createMachineActor(machine, mappedInput);
        execution.machineActors.set(machine.id, machineActor);
        
        // Wait for completion
        const result = await this.waitForMachineCompletion(machineActor, machine.options.timeout);
        
        // Apply output mappings
        const mappedOutput = this.applyDataMappings(result, machine.outputMapping);
        results.set(machine.id, mappedOutput);
        
        // Pass output as input to next stage
        pipelineData = mappedOutput;
        
        // Record performance
        const executionTime = Date.now() - startTime;
        execution.performance.machinePerformance.set(machine.id, {
          executionTime,
          success: true,
          memoryUsage: this.estimateMemoryUsage(result)
        });
        
      } catch (error) {
        const executionTime = Date.now() - startTime;
        execution.performance.machinePerformance.set(machine.id, {
          executionTime,
          success: false,
          memoryUsage: 0
        });
        
        const handled = await this.handleMachineError(execution, machine, error as Error);
        if (!handled) {
          throw error;
        }
      }
    }

    execution.state = 'completed';
    execution.dataFlow = pipelineData;
    return this.createCompositionResult(execution, results);
  }

  /**
   * Setup data transformation pipeline
   */
  private setupDataPipeline(dataFlowConfig: DataFlowConfig): void {
    // Add transformations
    for (const transform of dataFlowConfig.transformationPipeline) {
      this.dataTransformationPipeline.addTransform(transform);
    }
    
    // Add validations
    for (const validation of dataFlowConfig.validationRules) {
      this.dataTransformationPipeline.addValidator(validation);
    }
  }

  /**
   * Apply data mappings
   */
  private applyDataMappings(sourceData: any, mappings: DataMapping[]): any {
    const mappedData: any = {};
    
    for (const mapping of mappings) {
      try {
        let value = this.getValueFromPath(sourceData, mapping.source);
        
        // Apply transformation if provided
        if (mapping.transform) {
          value = mapping.transform(value);
        }
        
        // Validate if required
        if (mapping.validate && !mapping.validate(value)) {
          if (mapping.required) {
            throw new Error(`Required field ${mapping.target} failed validation`);
          }
          continue;
        }
        
        // Set mapped value
        this.setValueAtPath(mappedData, mapping.target, value);
        
      } catch (error) {
        if (mapping.required) {
          throw new Error(`Failed to map required field ${mapping.source} to ${mapping.target}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    return mappedData;
  }

  /**
   * Create machine actor
   */
  private async createMachineActor(machine: CompositionMachine, input: any): Promise<ActorRef<any, any>> {
    const machineInstance = machine.factory();
    const actor = createActor(machineInstance, {
      input
    });
    
    actor.start();
    return actor;
  }

  /**
   * Wait for machine completion with timeout
   */
  private async waitForMachineCompletion(actor: ActorRef<any, any>, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Machine execution timed out after ${timeout}ms`));
      }, timeout);

      const subscription = actor.subscribe({
        complete: () => {
          clearTimeout(timeoutId);
          resolve(actor.getSnapshot().output);
        },
        error: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      // Cleanup subscription on timeout
      setTimeout(() => {
        subscription.unsubscribe();
      }, timeout + 100);
    });
  }

  /**
   * Create parallel execution plan considering dependencies
   */
  private createParallelExecutionPlan(machines: CompositionMachine[]): CompositionMachine[][] {
    const plan: CompositionMachine[][] = [];
    const processed = new Set<string>();
    const remaining = [...machines];

    while (remaining.length > 0) {
      const batch: CompositionMachine[] = [];
      
      for (let i = remaining.length - 1; i >= 0; i--) {
        const machine = remaining[i];
        
        // Check if all dependencies are satisfied
        const dependenciesSatisfied = machine.dependencies.every(dep => processed.has(dep));
        
        if (dependenciesSatisfied) {
          batch.push(machine);
          processed.add(machine.id);
          remaining.splice(i, 1);
        }
      }
      
      if (batch.length === 0 && remaining.length > 0) {
        throw new Error('Circular dependencies detected in machine composition');
      }
      
      if (batch.length > 0) {
        plan.push(batch);
      }
    }

    return plan;
  }

  /**
   * Check if machine should execute based on conditions
   */
  private shouldExecuteMachine(machine: CompositionMachine, dataFlow: any): boolean {
    // Simplified condition checking - could be enhanced with complex predicates
    return machine.dependencies.every(dep => 
      this.getValueFromPath(dataFlow, dep) !== undefined
    );
  }

  /**
   * Transform data through pipeline for specific machine
   */
  private async transformPipelineData(data: any, machine: CompositionMachine): Promise<any> {
    const { data: transformedData } = await this.dataTransformationPipeline.applyTransformations(data);
    return transformedData;
  }

  /**
   * Handle machine execution error
   */
  private async handleMachineError(
    execution: CompositionExecution,
    machine: CompositionMachine,
    error: Error
  ): Promise<boolean> {
    const errorHandling = execution.config.errorHandling;
    execution.errors.push(`Machine ${machine.id} failed: ${error.message}`);

    switch (errorHandling.propagation) {
      case 'stop':
        return false; // Stop entire composition
      
      case 'continue':
        return true; // Continue with next machine
      
      case 'retry':
        return await this.retryMachine(execution, machine, error);
      
      case 'compensate':
        return await this.compensateMachine(execution, machine, error);
      
      default:
        return false;
    }
  }

  /**
   * Retry machine execution
   */
  private async retryMachine(
    execution: CompositionExecution,
    machine: CompositionMachine,
    error: Error
  ): Promise<boolean> {
    const retryConfig = execution.config.errorHandling.retryConfig;
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        // Wait based on backoff strategy
        const delay = this.calculateRetryDelay(attempt, retryConfig);
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Retry machine execution
        const mappedInput = this.applyDataMappings(execution.dataFlow, machine.inputMapping);
        const machineActor = await this.createMachineActor(machine, mappedInput);
        const result = await this.waitForMachineCompletion(machineActor, machine.options.timeout);
        
        // Success - apply output mappings and continue
        const mappedOutput = this.applyDataMappings(result, machine.outputMapping);
        execution.dataFlow = { ...execution.dataFlow, ...mappedOutput };
        
        return true;
        
      } catch (retryError) {
        if (attempt === retryConfig.maxAttempts) {
          execution.errors.push(`Machine ${machine.id} failed after ${retryConfig.maxAttempts} retries`);
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Compensate for machine failure
   */
  private async compensateMachine(
    execution: CompositionExecution,
    machine: CompositionMachine,
    error: Error
  ): Promise<boolean> {
    const compensationStrategies = execution.config.errorHandling.compensationStrategies;
    
    for (const strategy of compensationStrategies) {
      // Check if strategy triggers apply
      const shouldApply = strategy.triggers.some(trigger => {
        if (trigger.errorType && !error.message.includes(trigger.errorType)) {
          return false;
        }
        if (trigger.predicate && !trigger.predicate(error, execution.dataFlow)) {
          return false;
        }
        return true;
      });

      if (shouldApply) {
        try {
          // Execute compensation actions
          for (const action of strategy.actions) {
            await this.executeCompensationAction(action, execution, machine, error);
          }
          return true;
        } catch (compensationError) {
          execution.errors.push(`Compensation failed: ${compensationError instanceof Error ? compensationError.message : 'Unknown error'}`);
        }
      }
    }

    return false;
  }

  /**
   * Execute compensation action
   */
  private async executeCompensationAction(
    action: any,
    execution: CompositionExecution,
    machine: CompositionMachine,
    error: Error
  ): Promise<void> {
    switch (action.type) {
      case 'rollback':
        // Implement rollback logic
        break;
      case 'repair':
        // Implement repair logic
        break;
      case 'notify':
        console.warn(`Machine ${machine.id} failed:`, error.message);
        break;
      case 'restart':
        // Restart the machine
        break;
      case 'custom':
        if (action.implementation) {
          await action.implementation(execution.dataFlow);
        }
        break;
    }
  }

  /**
   * Calculate retry delay based on strategy
   */
  private calculateRetryDelay(attempt: number, retryConfig: CompositionRetryConfig): number {
    switch (retryConfig.backoffStrategy) {
      case 'linear':
        return retryConfig.delay * attempt;
      case 'exponential':
        return retryConfig.delay * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
      case 'fixed':
      default:
        return retryConfig.delay;
    }
  }

  /**
   * Handle composition error
   */
  private handleCompositionError(execution: CompositionExecution, error: Error): CompositionResult {
    execution.state = 'error';
    
    return {
      success: false,
      results: new Map(),
      error: error.message,
      execution,
      performance: execution.performance
    };
  }

  /**
   * Create composition result
   */
  private createCompositionResult(
    execution: CompositionExecution,
    results: Map<string, any>
  ): CompositionResult {
    return {
      success: execution.state === 'completed',
      results,
      error: execution.errors.length > 0 ? execution.errors.join('; ') : undefined,
      execution,
      performance: execution.performance
    };
  }

  /**
   * Estimate memory usage (simplified)
   */
  private estimateMemoryUsage(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate
    } catch {
      return 0;
    }
  }

  // Utility methods for path-based data access
  private getValueFromPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setValueAtPath(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Get composition status
   */
  getCompositionStatus(compositionId: string): CompositionExecution | null {
    return this.compositions.get(compositionId) || null;
  }

  /**
   * Cancel composition execution
   */
  async cancelComposition(compositionId: string): Promise<boolean> {
    const execution = this.compositions.get(compositionId);
    if (!execution) {
      return false;
    }

    execution.state = 'cancelled';
    
    // Stop all running machines
    for (const actor of execution.machineActors.values()) {
      actor.stop();
    }

    return true;
  }

  /**
   * Cleanup orchestrator resources
   */
  destroy(): void {
    // Stop all active compositions
    for (const execution of this.compositions.values()) {
      for (const actor of execution.machineActors.values()) {
        actor.stop();
      }
    }
    
    this.compositions.clear();
  }
}

// ================================
// PERFORMANCE MONITOR
// ================================

/**
 * Performance monitoring for machine compositions
 */
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  recordMetric(compositionId: string, machineId: string, metric: MachinePerformanceMetric): void {
    const key = `${compositionId}-${machineId}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        totalExecutions: 0,
        averageExecutionTime: 0,
        successRate: 0,
        memoryUsage: []
      });
    }

    const metrics = this.metrics.get(key)!;
    metrics.totalExecutions++;
    
    // Update average execution time
    const newAverage = (metrics.averageExecutionTime * (metrics.totalExecutions - 1) + metric.executionTime) / metrics.totalExecutions;
    metrics.averageExecutionTime = newAverage;
    
    // Update success rate
    const successCount = Math.round(metrics.successRate * (metrics.totalExecutions - 1) / 100) + (metric.success ? 1 : 0);
    metrics.successRate = (successCount / metrics.totalExecutions) * 100;
    
    // Track memory usage
    metrics.memoryUsage.push(metric.memoryUsage);
    if (metrics.memoryUsage.length > 100) {
      metrics.memoryUsage.splice(0, metrics.memoryUsage.length - 100);
    }
  }

  getMetrics(compositionId: string, machineId: string): PerformanceMetrics | null {
    const key = `${compositionId}-${machineId}`;
    return this.metrics.get(key) || null;
  }
}

// ================================
// TYPE DEFINITIONS
// ================================

interface CompositionExecution {
  id: string;
  config: MachineCompositionConfig;
  state: 'initializing' | 'executing' | 'completed' | 'error' | 'cancelled';
  machineActors: Map<string, ActorRef<any, any>>;
  dataFlow: any;
  errors: string[];
  startTime: number;
  endTime: number | null;
  performance: CompositionPerformance;
}

interface CompositionResult {
  success: boolean;
  results: Map<string, any>;
  error?: string;
  execution: CompositionExecution;
  performance: CompositionPerformance;
}

interface CompositionPerformance {
  machinePerformance: Map<string, MachinePerformanceMetric>;
  dataTransformationTime: number;
  totalExecutionTime: number;
}

interface MachinePerformanceMetric {
  executionTime: number;
  success: boolean;
  memoryUsage: number;
}

interface PerformanceMetrics {
  totalExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  memoryUsage: number[];
}

// ================================
// EXPORTS
// ================================

export {
  type MachineCompositionConfig,
  type CompositionMachine,
  type DataMapping,
  type DataFlowConfig,
  type ValidationRule,
  type DataTransform,
  type CompositionErrorHandling,
  DataTransformationPipeline
};