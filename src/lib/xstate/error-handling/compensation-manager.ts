/**
 * Compensation Transaction Manager
 * 
 * Advanced transaction rollback and compensation system for multi-step operations.
 * Integrates with XState macro execution context and provides robust error recovery.
 */

import {
  type CompensationAction,
  type TransactionStep,
  type TransactionContext,
  type TransactionResult,
  type TransactionLogEntry,
  ErrorCategory
} from './error-types';

import { classifyError, createErrorContext } from './error-classifier';
import { retryWithExponentialBackoff } from './retry-strategies';

// ================================
// COMPENSATION MANAGER
// ================================

/**
 * Transaction manager with automatic compensation and rollback capabilities
 */
export class CompensationManager {
  private activeTransactions = new Map<string, TransactionContext>();
  private transactionLogs = new Map<string, TransactionLogEntry[]>();
  private completedTransactions = new Map<string, TransactionResult>();
  private compensationTimeout = 30000; // 30 seconds for compensation actions

  /**
   * Execute a multi-step transaction with automatic compensation on failure
   */
  public async executeTransaction(
    transactionId: string,
    steps: TransactionStep[],
    options: {
      continueOnNonCriticalFailure?: boolean;
      maxCompensationRetries?: number;
      compensationTimeout?: number;
      onStepStart?: (step: TransactionStep) => void;
      onStepComplete?: (step: TransactionStep, result: unknown) => void;
      onStepFailed?: (step: TransactionStep, error: Error) => void;
      onCompensationStart?: (step: TransactionStep) => void;
      onCompensationComplete?: (step: TransactionStep) => void;
    } = {}
  ): Promise<TransactionResult> {
    const {
      continueOnNonCriticalFailure = false,
      maxCompensationRetries = 2,
      compensationTimeout = this.compensationTimeout
    } = options;

    // Validate transaction
    this.validateTransaction(transactionId, steps);
    
    // Initialize transaction context
    const context: TransactionContext = {
      transactionId,
      steps: [...steps].sort((a, b) => a.id.localeCompare(b.id)), // Ensure deterministic order
      executedSteps: [],
      compensatedSteps: [],
      startTime: Date.now(),
      metadata: {
        continueOnNonCriticalFailure,
        maxCompensationRetries,
        compensationTimeout
      }
    };

    this.activeTransactions.set(transactionId, context);
    this.transactionLogs.set(transactionId, []);

    console.log(`[CompensationManager] Starting transaction ${transactionId} with ${steps.length} steps`);
    
    try {
      // Execute steps in order
      let failedStep: TransactionStep | undefined;
      let executionError: Error | undefined;

      for (const step of steps) {
        // Update current step in mutable context
        (context as any).currentStep = step.id;
        
        try {
          await this.executeStep(step, context, options);
          context.executedSteps.push(step.id);
        } catch (error) {
          executionError = error as Error;
          failedStep = step;
          
          // Check if failure should stop transaction
          if (step.critical || !continueOnNonCriticalFailure) {
            console.warn(`[CompensationManager] Critical step ${step.id} failed, initiating compensation`);
            break;
          } else {
            console.warn(`[CompensationManager] Non-critical step ${step.id} failed, continuing transaction`);
            this.logEntry(context, 'step_failure', step.id, 0, (error as Error).message);
          }
        }
      }

      // If we have a failed critical step, compensate executed steps
      if (failedStep && (failedStep.critical || !continueOnNonCriticalFailure)) {
        await this.compensateExecutedSteps(context, maxCompensationRetries, compensationTimeout, options);
        
        return this.createFailureResult(context, failedStep, executionError!);
      }

      // Transaction completed successfully
      return this.createSuccessResult(context);

    } catch (error) {
      // Unexpected error during transaction
      console.error(`[CompensationManager] Unexpected error in transaction ${transactionId}:`, error);
      
      try {
        await this.compensateExecutedSteps(context, maxCompensationRetries, compensationTimeout, options);
      } catch (compensationError) {
        console.error(`[CompensationManager] Compensation failed for transaction ${transactionId}:`, compensationError);
      }
      
      return this.createFailureResult(context, undefined, error as Error);
    } finally {
      // Clean up active transaction
      this.activeTransactions.delete(transactionId);
      
      // Store completed transaction for auditing
      const result = this.completedTransactions.get(transactionId);
      if (result) {
        setTimeout(() => {
          this.completedTransactions.delete(transactionId);
          this.transactionLogs.delete(transactionId);
        }, 300000); // Clean up after 5 minutes
      }
    }
  }

  /**
   * Get transaction status
   */
  public getTransactionStatus(transactionId: string): {
    active: boolean;
    context?: TransactionContext;
    result?: TransactionResult;
    logs: TransactionLogEntry[];
  } {
    const context = this.activeTransactions.get(transactionId);
    const result = this.completedTransactions.get(transactionId);
    const logs = this.transactionLogs.get(transactionId) || [];

    return {
      active: !!context,
      context,
      result,
      logs
    };
  }

  /**
   * Cancel an active transaction
   */
  public async cancelTransaction(
    transactionId: string,
    reason = 'User cancelled'
  ): Promise<TransactionResult | null> {
    const context = this.activeTransactions.get(transactionId);
    if (!context) {
      return null;
    }

    console.log(`[CompensationManager] Cancelling transaction ${transactionId}: ${reason}`);
    
    try {
      await this.compensateExecutedSteps(context, 2, this.compensationTimeout);
      return this.createFailureResult(context, undefined, new Error(`Transaction cancelled: ${reason}`));
    } catch (error) {
      console.error(`[CompensationManager] Error during transaction cancellation:`, error);
      return this.createFailureResult(context, undefined, error as Error);
    } finally {
      this.activeTransactions.delete(transactionId);
    }
  }

  /**
   * Get all active transactions
   */
  public getActiveTransactions(): TransactionContext[] {
    return Array.from(this.activeTransactions.values());
  }

  /**
   * Get transaction audit logs
   */
  public getTransactionLogs(transactionId: string): TransactionLogEntry[] {
    return this.transactionLogs.get(transactionId) || [];
  }

  /**
   * Get transaction statistics
   */
  public getStatistics(): {
    activeTransactions: number;
    completedTransactions: number;
    successRate: number;
    averageExecutionTime: number;
    totalCompensations: number;
  } {
    const completed = Array.from(this.completedTransactions.values());
    const successful = completed.filter(t => t.success).length;
    const totalCompensations = completed.reduce((sum, t) => sum + t.compensatedSteps.length, 0);
    const averageTime = completed.length > 0 
      ? completed.reduce((sum, t) => sum + t.duration, 0) / completed.length 
      : 0;

    return {
      activeTransactions: this.activeTransactions.size,
      completedTransactions: completed.length,
      successRate: completed.length > 0 ? successful / completed.length : 0,
      averageExecutionTime: averageTime,
      totalCompensations
    };
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private async executeStep(
    step: TransactionStep,
    context: TransactionContext,
    options: any
  ): Promise<void> {
    const startTime = Date.now();
    
    this.logEntry(context, 'step_start', step.id);
    options.onStepStart?.(step);

    try {
      // Execute step with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Step timeout after ${step.timeout}ms`)), step.timeout);
      });

      const result = await Promise.race([step.execute(), timeoutPromise]);
      
      // Validate result if validator provided
      if (step.validate) {
        const isValid = await step.validate();
        if (!isValid) {
          throw new Error(`Step validation failed: ${step.name}`);
        }
      }

      const duration = Date.now() - startTime;
      this.logEntry(context, 'step_success', step.id, duration);
      options.onStepComplete?.(step, result);

      console.log(`[CompensationManager] Step ${step.id} completed successfully in ${duration}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;
      const stepError = error as Error;
      
      this.logEntry(context, 'step_failure', step.id, duration, stepError.message);
      options.onStepFailed?.(step, stepError);
      
      console.error(`[CompensationManager] Step ${step.id} failed after ${duration}ms:`, stepError.message);
      throw stepError;
    }
  }

  private async compensateExecutedSteps(
    context: TransactionContext,
    maxRetries: number,
    timeout: number,
    options: any = {}
  ): Promise<void> {
    if (context.executedSteps.length === 0) {
      console.log(`[CompensationManager] No steps to compensate for transaction ${context.transactionId}`);
      return;
    }

    console.log(`[CompensationManager] Starting compensation for ${context.executedSteps.length} executed steps`);
    
    // Get compensation actions for executed steps (in reverse order)
    const compensationActions = context.executedSteps
      .reverse()
      .map(stepId => {
        const step = context.steps.find(s => s.id === stepId);
        return step?.compensate;
      })
      .filter((action): action is CompensationAction => !!action);

    // Sort by priority (higher priority runs first)
    compensationActions.sort((a, b) => b.priority - a.priority);

    // Execute compensation actions
    for (const action of compensationActions) {
      try {
        await this.executeCompensationAction(action, maxRetries, timeout, context, options);
        context.compensatedSteps.push(action.id);
      } catch (error) {
        console.error(`[CompensationManager] Compensation action ${action.id} failed:`, error);
        // Continue with other compensations even if one fails
      }
    }

    console.log(`[CompensationManager] Compensation completed: ${context.compensatedSteps.length}/${compensationActions.length} actions succeeded`);
  }

  private async executeCompensationAction(
    action: CompensationAction,
    maxRetries: number,
    timeout: number,
    context: TransactionContext,
    options: any
  ): Promise<void> {
    const startTime = Date.now();
    
    this.logEntry(context, 'compensation_start', action.id);
    options.onCompensationStart?.(action);

    try {
      if (action.retryable && maxRetries > 1) {
        // Use retry strategy for retryable compensation actions
        const result = await retryWithExponentialBackoff(
          async () => {
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error(`Compensation timeout after ${timeout}ms`)), timeout);
            });
            return Promise.race([action.execute(), timeoutPromise]);
          },
          {
            maxAttempts: maxRetries,
            baseDelayMs: 1000,
            maxDelayMs: 5000,
            exponentialBackoff: true,
            timeout: timeout
          },
          {
            operation: `compensation-${action.id}`,
            component: 'compensation-manager'
          }
        );

        if (!result.success) {
          throw result.error || new Error('Compensation retry exhausted');
        }
      } else {
        // Execute once with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Compensation timeout after ${timeout}ms`)), timeout);
        });
        await Promise.race([action.execute(), timeoutPromise]);
      }

      // Validate compensation if validator provided
      if (action.validate) {
        const isValid = await action.validate();
        if (!isValid) {
          throw new Error(`Compensation validation failed: ${action.name}`);
        }
      }

      const duration = Date.now() - startTime;
      this.logEntry(context, 'compensation_success', action.id, duration);
      options.onCompensationComplete?.(action);
      
      console.log(`[CompensationManager] Compensation action ${action.id} completed in ${duration}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;
      const compensationError = error as Error;
      
      this.logEntry(context, 'compensation_failure', action.id, duration, compensationError.message);
      
      console.error(`[CompensationManager] Compensation action ${action.id} failed after ${duration}ms:`, compensationError.message);
      throw compensationError;
    }
  }

  private logEntry(
    context: TransactionContext,
    type: TransactionLogEntry['type'],
    stepId: string,
    duration?: number,
    error?: string,
    metadata?: Record<string, unknown>
  ): void {
    const logs = this.transactionLogs.get(context.transactionId) || [];
    
    const entry: TransactionLogEntry = {
      timestamp: Date.now(),
      type,
      stepId,
      duration,
      error,
      metadata
    };
    
    logs.push(entry);
    this.transactionLogs.set(context.transactionId, logs);
  }

  private createSuccessResult(context: TransactionContext): TransactionResult {
    const duration = Date.now() - context.startTime;
    const auditLog = this.transactionLogs.get(context.transactionId) || [];
    
    const result: TransactionResult = {
      success: true,
      transactionId: context.transactionId,
      completedSteps: [...context.executedSteps],
      compensatedSteps: [...context.compensatedSteps],
      duration,
      auditLog: [...auditLog]
    };
    
    this.completedTransactions.set(context.transactionId, result);
    console.log(`[CompensationManager] Transaction ${context.transactionId} completed successfully in ${duration}ms`);
    
    return result;
  }

  private createFailureResult(
    context: TransactionContext,
    failedStep?: TransactionStep,
    error?: Error
  ): TransactionResult {
    const duration = Date.now() - context.startTime;
    const auditLog = this.transactionLogs.get(context.transactionId) || [];
    
    const result: TransactionResult = {
      success: false,
      transactionId: context.transactionId,
      completedSteps: [...context.executedSteps],
      failedStep: failedStep?.id,
      compensatedSteps: [...context.compensatedSteps],
      error,
      duration,
      auditLog: [...auditLog]
    };
    
    this.completedTransactions.set(context.transactionId, result);
    console.error(`[CompensationManager] Transaction ${context.transactionId} failed after ${duration}ms:`, error?.message);
    
    return result;
  }

  private validateTransaction(transactionId: string, steps: TransactionStep[]): void {
    if (!transactionId || transactionId.trim() === '') {
      throw new Error('Transaction ID is required');
    }
    
    if (this.activeTransactions.has(transactionId)) {
      throw new Error(`Transaction ${transactionId} is already active`);
    }
    
    if (steps.length === 0) {
      throw new Error('At least one transaction step is required');
    }
    
    // Validate step IDs are unique
    const stepIds = new Set<string>();
    for (const step of steps) {
      if (stepIds.has(step.id)) {
        throw new Error(`Duplicate step ID: ${step.id}`);
      }
      stepIds.add(step.id);
      
      if (!step.execute || typeof step.execute !== 'function') {
        throw new Error(`Step ${step.id} must have an execute function`);
      }
      
      if (!step.compensate || typeof step.compensate.execute !== 'function') {
        throw new Error(`Step ${step.id} must have a compensation action`);
      }
    }
    
    // Validate compensation dependencies
    for (const step of steps) {
      const compensation = step.compensate;
      for (const depId of compensation.dependencies) {
        if (!stepIds.has(depId)) {
          throw new Error(`Compensation dependency '${depId}' for step '${step.id}' not found`);
        }
      }
    }
  }
}

// ================================
// TRANSACTION BUILDER
// ================================

/**
 * Builder pattern for creating complex transactions
 */
export class TransactionBuilder {
  private steps: TransactionStep[] = [];
  private transactionId: string;

  constructor(transactionId: string) {
    this.transactionId = transactionId;
  }

  /**
   * Add a step to the transaction
   */
  public addStep(
    id: string,
    name: string,
    execute: () => Promise<unknown>,
    compensate: Omit<CompensationAction, 'id'>,
    options: {
      validate?: () => Promise<boolean>;
      timeout?: number;
      critical?: boolean;
    } = {}
  ): TransactionBuilder {
    const step: TransactionStep = {
      id,
      name,
      execute,
      compensate: {
        id: `comp-${id}`,
        ...compensate,
        name: compensate.name || `Compensate ${name}`,
        description: compensate.description || `Rollback operation for ${name}`,
        timeout: compensate.timeout || 30000,
        retryable: compensate.retryable !== undefined ? compensate.retryable : true,
        dependencies: compensate.dependencies || [],
        priority: compensate.priority !== undefined ? compensate.priority : 1
      },
      validate: options.validate,
      timeout: options.timeout || 60000,
      critical: options.critical !== false // Default to critical
    };

    this.steps.push(step);
    return this;
  }

  /**
   * Add a macro automation step (StockSage specific)
   */
  public addMacroStep(
    stepId: string,
    stepName: string,
    executeOperation: () => Promise<unknown>,
    rollbackData: () => Promise<void>,
    options: {
      ticker?: string;
      timeout?: number;
      validateResult?: () => Promise<boolean>;
    } = {}
  ): TransactionBuilder {
    return this.addStep(
      stepId,
      stepName,
      executeOperation,
      {
        name: `Compensate ${stepName}`,
        execute: rollbackData,
        description: `Rollback ${stepName} for ${options.ticker || 'ticker'}`,
        timeout: options.timeout || 30000,
        retryable: true,
        dependencies: [],
        priority: 10 // High priority for macro steps
      },
      {
        validate: options.validateResult,
        timeout: options.timeout || 60000,
        critical: true
      }
    );
  }

  /**
   * Build the transaction
   */
  public build(): { transactionId: string; steps: TransactionStep[] } {
    if (this.steps.length === 0) {
      throw new Error('Transaction must have at least one step');
    }

    return {
      transactionId: this.transactionId,
      steps: [...this.steps]
    };
  }

  /**
   * Get current step count
   */
  public getStepCount(): number {
    return this.steps.length;
  }

  /**
   * Clear all steps
   */
  public clear(): TransactionBuilder {
    this.steps = [];
    return this;
  }
}

// ================================
// GLOBAL COMPENSATION MANAGER
// ================================

/**
 * Global compensation manager instance
 */
export const globalCompensationManager = new CompensationManager();

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Create a transaction builder
 */
export const createTransaction = (transactionId: string): TransactionBuilder => {
  return new TransactionBuilder(transactionId);
};

/**
 * Execute a simple two-step compensatable operation
 */
export const executeCompensatableOperation = async <T>(
  operationId: string,
  operation: () => Promise<T>,
  compensation: () => Promise<void>,
  options: {
    timeout?: number;
    validateResult?: (result: T) => Promise<boolean>;
    onSuccess?: (result: T) => void;
    onFailure?: (error: Error) => void;
  } = {}
): Promise<T> => {
  const transactionId = `simple-${operationId}-${Date.now()}`;
  const builder = createTransaction(transactionId);

  let operationResult: T;

  builder.addStep(
    'main-operation',
    `Execute ${operationId}`,
    async () => {
      operationResult = await operation();
      return operationResult;
    },
    {
      name: `Compensate ${operationId}`,
      execute: compensation,
      description: `Rollback ${operationId}`,
      timeout: options.timeout || 30000,
      retryable: true,
      dependencies: [],
      priority: 1
    },
    {
      timeout: options.timeout || 60000,
      validate: options.validateResult ? () => options.validateResult!(operationResult) : undefined
    }
  );

  const { transactionId: txId, steps } = builder.build();
  const result = await globalCompensationManager.executeTransaction(txId, steps);

  if (result.success) {
    options.onSuccess?.(operationResult!);
    return operationResult!;
  } else {
    options.onFailure?.(result.error!);
    throw result.error || new Error('Operation failed');
  }
};

/**
 * Create a macro automation transaction (StockSage specific)
 */
export const createMacroTransaction = (
  ticker: string,
  operations: Array<{
    id: string;
    name: string;
    execute: () => Promise<unknown>;
    rollback: () => Promise<void>;
    validate?: () => Promise<boolean>;
  }>
): TransactionBuilder => {
  const transactionId = `macro-${ticker}-${Date.now()}`;
  const builder = createTransaction(transactionId);

  for (const op of operations) {
    builder.addMacroStep(
      op.id,
      op.name,
      op.execute,
      op.rollback,
      {
        ticker,
        validateResult: op.validate,
        timeout: 45000 // Match v4.4.3.5 timeout
      }
    );
  }

  return builder;
};

export default CompensationManager;