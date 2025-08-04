/**
 * @fileOverview Macro Services Orchestrator - Main service coordination layer
 * 
 * Provides the main orchestrator that manages all 4 macro steps as XState-compatible
 * services with comprehensive error handling, performance metrics, and service discovery.
 */

import { createTickerLogger, generateExecutionId } from '@/lib/ticker-logger';
import { createFetchExpirationsService } from './fetch-expirations-service';
import { createGetStockDataService } from './get-stock-data-service';
import { createAITakeawaysService } from './ai-takeaways-service';
import { createAIOptionsService } from './ai-options-service';
import type {
  MacroServiceOptions,
  MacroServiceResult,
  MacroServiceConfig,
  MacroOrchestrator,
  ServiceRegistry,
  ServiceFactory,
  ServiceError,
  MacroExecutionContext,
  ExpirationData,
  StockDataResult,
  AITakeawaysResult,
  AIOptionsResult,
} from './service-types';

/**
 * Service Registry Implementation
 * 
 * Manages registration and discovery of macro services
 */
class MacroServiceRegistry implements ServiceRegistry {
  private services = new Map<number, any>();
  private configs = new Map<number, MacroServiceConfig>();

  register(stepId: number, service: any, config: MacroServiceConfig): void {
    this.services.set(stepId, service);
    this.configs.set(stepId, config);
  }

  get(stepId: number): any {
    return this.services.get(stepId);
  }

  getConfig(stepId: number): MacroServiceConfig | undefined {
    return this.configs.get(stepId);
  }

  has(stepId: number): boolean {
    return this.services.has(stepId);
  }

  list(): Array<{ stepId: number; config: MacroServiceConfig }> {
    const result: Array<{ stepId: number; config: MacroServiceConfig }> = [];
    for (const [stepId, config] of this.configs.entries()) {
      result.push({ stepId, config });
    }
    return result.sort((a, b) => a.stepId - b.stepId);
  }
}

/**
 * Macro Orchestrator Implementation
 * 
 * Coordinates execution of all macro services with comprehensive error handling
 * and performance tracking
 */
class MacroServiceOrchestrator implements MacroOrchestrator {
  private registry: ServiceRegistry;
  private activeExecutions = new Map<string, AbortController>();

  constructor(registry: ServiceRegistry) {
    this.registry = registry;
    this.setupDefaultServices();
  }

  /**
   * Set up the default 4-step macro services
   */
  private setupDefaultServices(): void {
    // Step 1: Fetch Expirations
    this.registry.register(1, createFetchExpirationsService(), {
      name: 'FetchExpirationsService',
      description: 'Fetch available options expiration dates',
      defaultTimeout: 45000,
      defaultRetries: 2,
      optional: false,
    });

    // Step 2: Get Stock Data
    this.registry.register(2, createGetStockDataService(), {
      name: 'GetStockDataService',
      description: 'Fetch real-time stock data and options chain',
      defaultTimeout: 45000,
      defaultRetries: 2,
      dependencies: ['FetchExpirationsService'],
      optional: false,
    });

    // Step 3: AI Takeaways
    this.registry.register(3, createAITakeawaysService(), {
      name: 'AITakeawaysService',
      description: 'Generate AI technical analysis takeaways',
      defaultTimeout: 45000,
      defaultRetries: 2,
      dependencies: ['GetStockDataService'],
      optional: false,
    });

    // Step 4: AI Options
    this.registry.register(4, createAIOptionsService(), {
      name: 'AIOptionsService',
      description: 'Generate AI options strategies and analysis',
      defaultTimeout: 45000,
      defaultRetries: 2,
      dependencies: ['AITakeawaysService'],
      optional: false,
    });
  }

  /**
   * Execute all macro steps in sequence
   */
  async executeAll(options: MacroServiceOptions): Promise<MacroServiceResult[]> {
    const { ticker, executionId } = options;
    const logger = createTickerLogger(ticker, 'MacroOrchestrator', executionId);
    
    // Create cancellation controller for this execution
    const abortController = new AbortController();
    this.activeExecutions.set(executionId, abortController);

    const results: MacroServiceResult[] = [];
    const startTime = Date.now();
    
    logger.macroExecution('OrchestratorStart', 'Beginning macro service orchestration', {
      executionId,
      ticker,
      totalSteps: 4,
      timestamp: new Date(startTime).toISOString(),
    });

    try {
      // Get all services in order
      const serviceSteps = this.registry.list();
      let stepResults = new Map<number, MacroServiceResult>();

      for (const { stepId, config } of serviceSteps) {
        // Check for cancellation
        if (abortController.signal.aborted) {
          logger.macroExecution('OrchestratorCancelled', 'Orchestration cancelled', {
            executionId,
            completedSteps: results.length,
            totalSteps: serviceSteps.length,
            cancelledAtStep: stepId,
          });
          break;
        }

        const service = this.registry.get(stepId);
        if (!service) {
          const error = new Error(`Service not found for step ${stepId}`) as ServiceError;
          error.type = 'validation';
          error.retryable = false;
          
          const failedResult: MacroServiceResult = {
            success: false,
            error,
            duration: 0,
            retryCount: 0,
            stepId,
          };
          
          results.push(failedResult);
          continue;
        }

        // Prepare options for this step
        const stepOptions: MacroServiceOptions & any = {
          ...options,
          cancellationToken: abortController.signal,
          timeout: config.defaultTimeout,
          maxRetries: config.defaultRetries,
        };

        // Add previous step results as context for dependent services
        if (stepId === 2) {
          // Stock data service gets expiration data
          const expirationResult = stepResults.get(1);
          if (expirationResult?.success && expirationResult.data) {
            stepOptions.macroExpiration = (expirationResult.data as ExpirationData).selectedExpiration;
          }
        } else if (stepId === 3) {
          // AI takeaways service gets stock data
          const stockDataResult = stepResults.get(2);
          stepOptions.stockDataResult = stockDataResult;
        } else if (stepId === 4) {
          // AI options service gets both stock data and AI takeaways
          const stockDataResult = stepResults.get(2);
          const aiTakeawaysResult = stepResults.get(3);
          stepOptions.stockDataResult = stockDataResult;
          stepOptions.aiTakeawaysResult = aiTakeawaysResult;
        }

        logger.macroExecution(`Step${stepId}_Start`, `Starting ${config.name}`, {
          executionId,
          stepId,
          serviceName: config.name,
          description: config.description,
          hasContext: stepId > 1,
        });

        try {
          // Execute the service
          const stepResult = await service(stepOptions);
          results.push(stepResult);
          stepResults.set(stepId, stepResult);

          if (stepResult.success) {
            logger.macroExecution(`Step${stepId}_Success`, `${config.name} completed successfully`, {
              executionId,
              stepId,
              duration: `${stepResult.duration}ms`,
              retryCount: stepResult.retryCount,
            });
          } else {
            logger.error(`Step${stepId}_Failed`, `${config.name} failed`, {
              executionId,
              stepId,
              error: stepResult.error?.message,
              duration: `${stepResult.duration}ms`,
              retryCount: stepResult.retryCount,
            });
          }

        } catch (error) {
          const serviceError = error instanceof Error ? error : new Error(String(error));
          const failedResult: MacroServiceResult = {
            success: false,
            error: serviceError,
            duration: 0,
            retryCount: 0,
            stepId,
          };
          
          results.push(failedResult);
          stepResults.set(stepId, failedResult);

          logger.error(`Step${stepId}_Exception`, `${config.name} threw exception`, {
            executionId,
            stepId,
            error: serviceError.message,
            stack: serviceError.stack,
          });
        }
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      // Calculate performance metrics
      const successfulSteps = results.filter(r => r.success).length;
      const failedSteps = results.filter(r => !r.success).length;
      const avgStepDuration = results.length > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0;

      logger.macroExecution('OrchestratorComplete', 'Macro orchestration completed', {
        executionId,
        totalDuration: `${totalDuration}ms`,
        totalSteps: results.length,
        successfulSteps,
        failedSteps,
        successRate: `${Math.round((successfulSteps / results.length) * 100)}%`,
        avgStepDuration: `${Math.round(avgStepDuration)}ms`,
      });

      return results;

    } catch (error) {
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      logger.error('OrchestratorFailed', 'Macro orchestration failed', {
        executionId,
        totalDuration: `${totalDuration}ms`,
        error: error instanceof Error ? error.message : String(error),
        completedSteps: results.length,
      });

      throw error;

    } finally {
      // Clean up execution tracking
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Execute a single step by ID
   */
  async executeStep(stepId: number, options: MacroServiceOptions): Promise<MacroServiceResult> {
    const service = this.registry.get(stepId);
    const config = this.registry.getConfig(stepId);
    
    if (!service || !config) {
      const error = new Error(`Service not found for step ${stepId}`) as ServiceError;
      error.type = 'validation';
      error.retryable = false;
      
      return {
        success: false,
        error,
        duration: 0,
        retryCount: 0,
        stepId,
      };
    }

    const stepOptions = {
      ...options,
      timeout: config.defaultTimeout,
      maxRetries: config.defaultRetries,
    };

    return await service(stepOptions);
  }

  /**
   * Get service configuration
   */
  getServiceConfig(stepId: number): MacroServiceConfig | undefined {
    return this.registry.getConfig(stepId);
  }

  /**
   * Validate if all services can execute
   */
  validateExecution(options: MacroServiceOptions): boolean {
    const serviceSteps = this.registry.list();
    
    for (const { stepId, config } of serviceSteps) {
      const service = this.registry.get(stepId);
      if (!service) {
        return false;
      }
      
      // Check if service has custom validation
      if (config.canExecute && !config.canExecute(options)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Cancel ongoing execution
   */
  cancel(executionId: string): void {
    const controller = this.activeExecutions.get(executionId);
    if (controller) {
      controller.abort();
      this.activeExecutions.delete(executionId);
    }
  }
}

/**
 * Service Factory Implementation
 * 
 * Creates instances of all service types and orchestrators
 */
class MacroServiceFactory implements ServiceFactory {
  createFetchExpirationsService() {
    return createFetchExpirationsService();
  }

  createGetStockDataService() {
    return createGetStockDataService();
  }

  createAITakeawaysService() {
    return createAITakeawaysService();
  }

  createAIOptionsService() {
    return createAIOptionsService();
  }

  createMacroOrchestrator(): MacroOrchestrator {
    const registry = this.createServiceRegistry();
    return new MacroServiceOrchestrator(registry);
  }

  createServiceRegistry(): ServiceRegistry {
    return new MacroServiceRegistry();
  }
}

// Export singleton instances for convenience
export const serviceFactory = new MacroServiceFactory();
export const defaultOrchestrator = serviceFactory.createMacroOrchestrator();

// Export classes for custom instantiation
export { MacroServiceRegistry, MacroServiceOrchestrator, MacroServiceFactory };

// Export individual service creators
export {
  createFetchExpirationsService,
  createGetStockDataService,
  createAITakeawaysService,
  createAIOptionsService,
};

// Export types
export type * from './service-types';

/**
 * Convenience function to create a new macro execution
 */
export function createMacroExecution(ticker: string, options?: Partial<MacroServiceOptions>): {
  executionId: string;
  options: MacroServiceOptions;
  orchestrator: MacroOrchestrator;
} {
  const executionId = generateExecutionId('macro-service');
  
  const fullOptions: MacroServiceOptions = {
    ticker,
    executionId,
    timeout: 45000,
    maxRetries: 2,
    enableDebug: process.env.NODE_ENV === 'development',
    ...options,
  };

  return {
    executionId,
    options: fullOptions,
    orchestrator: defaultOrchestrator,
  };
}

/**
 * Convenience function to execute all macro steps
 */
export async function executeMacroWorkflow(ticker: string, options?: Partial<MacroServiceOptions>): Promise<{
  executionId: string;
  results: MacroServiceResult[];
  success: boolean;
  summary: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    totalDuration: number;
    averageStepDuration: number;
  };
}> {
  const execution = createMacroExecution(ticker, options);
  const startTime = Date.now();
  
  const results = await execution.orchestrator.executeAll(execution.options);
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  const successfulSteps = results.filter(r => r.success).length;
  const failedSteps = results.filter(r => !r.success).length;
  const averageStepDuration = results.length > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0;

  return {
    executionId: execution.executionId,
    results,
    success: successfulSteps === results.length,
    summary: {
      totalSteps: results.length,
      successfulSteps,
      failedSteps,
      totalDuration,
      averageStepDuration,
    },
  };
}