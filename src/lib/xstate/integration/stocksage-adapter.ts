/**
 * @fileoverview StockSage Integration Adapter
 * 
 * Bridges XState services with existing StockSage NVDA/SPY context architecture.
 * Provides seamless integration while maintaining backward compatibility.
 */

import type { 
  IntegrationAdapter,
  IntegrationResult,
  IntegrationMetrics,
  StockSageCompatConfig,
  ServiceIntegrationConfig,
  WorkflowIntegrationConfig,
  IntegrationEvent,
  SupportedTicker,
  TickerContextState,
  ContextDispatch
} from './integration-types';
import type { MacroServiceOptions, MacroServiceResult } from '@/lib/xstate/services';
import { createTickerLogger } from '@/lib/ticker-logger';
// These will be imported when compatibility layer is completed
// import { createCompatibilityLayer } from './compatibility-layer';
// import { createDataTransformers } from './data-transformers';

/**
 * StockSage Integration Adapter Implementation
 * Handles the bridge between XState services and StockSage contexts
 */
export class StockSageAdapter implements IntegrationAdapter {
  private metrics: IntegrationMetrics;
  private compatibilityLayer;
  private dataTransformers;
  private logger;
  private eventHandlers: Map<string, (event: IntegrationEvent) => void>;

  constructor(private ticker: SupportedTicker) {
    this.metrics = {
      totalExecutions: 0,
      successfulIntegrations: 0,
      failedIntegrations: 0,
      averageExecutionTime: 0,
      contextUpdateSuccessRate: 0,
      serviceSuccessRate: 0,
    };
    
    // Placeholder implementations - will be implemented when dependencies are ready
    this.compatibilityLayer = null as any; // createCompatibilityLayer();
    this.dataTransformers = null as any; // createDataTransformers();
    this.logger = createTickerLogger(ticker, `${ticker}_XSTATE_INTEGRATION`);
    this.eventHandlers = new Map();
  }

  /**
   * Execute service with context integration
   */
  async executeWithIntegration<T>(
    serviceFn: (options: MacroServiceOptions) => Promise<MacroServiceResult<T>>,
    config: StockSageCompatConfig,
    serviceConfig: ServiceIntegrationConfig
  ): Promise<IntegrationResult<T>> {
    const startTime = Date.now();
    const executionId = `${config.ticker}-${serviceConfig.stepId}-${Date.now()}`;
    
    this.logger.info('ExecuteWithIntegration', `Starting service integration`, {
      executionId,
      serviceName: serviceConfig.serviceName,
      stepId: serviceConfig.stepId,
    });

    try {
      this.metrics.totalExecutions++;
      
      // Validate context state if required
      if (serviceConfig.contextValidator) {
        const currentState = config.contextHooks.useAnalysis();
        if (!serviceConfig.contextValidator(currentState)) {
          throw new Error(`Context validation failed for ${serviceConfig.serviceName}`);
        }
      }

      // Prepare service options
      const serviceOptions: MacroServiceOptions = {
        ticker: config.ticker,
        executionId,
        timeout: config.timeout || 45000,
        maxRetries: config.maxRetries || 2,
        enableDebug: config.enableDebug || false,
      };

      // Add required context fields to service options
      if (serviceConfig.requiredFields) {
        const currentState = config.contextHooks.useAnalysis();
        serviceConfig.requiredFields.forEach(field => {
          const value = currentState[field];
          if (field === 'selectedExpirationDate' && typeof value === 'string') {
            serviceOptions.macroExpiration = value;
          }
        });
      }

      // Execute the service
      this.emitEvent({
        type: 'SERVICE_COMPLETED',
        ticker: config.ticker,
        step: serviceConfig.stepId,
        success: false, // Will be updated after service execution
      });

      const serviceResult = await serviceFn(serviceOptions);
      const duration = Date.now() - startTime;
      
      this.logger.info('ServiceExecution', `Service completed`, {
        executionId,
        success: serviceResult.success,
        duration,
        retryCount: serviceResult.retryCount,
      });

      // Transform service result to context format
      let contextUpdated = false;
      let fieldsUpdated: string[] = [];

      if (serviceResult.success && serviceResult.data) {
        try {
          const currentState = config.contextHooks.useAnalysis();
          const contextUpdates = serviceConfig.transformer(serviceResult, currentState);
          
          // Validate context updates
          if (this.compatibilityLayer.validateContextUpdate(contextUpdates, config.ticker)) {
            // Apply updates to context
            const dispatch = config.contextHooks.useDispatch();
            contextUpdated = this.applyContextUpdates(
              contextUpdates,
              dispatch,
              config.ticker,
              serviceConfig.stepId
            );
            fieldsUpdated = Object.keys(contextUpdates);
            
            this.logger.info('ContextUpdate', `Context updated successfully`, {
              executionId,
              fieldsUpdated: fieldsUpdated.length,
              fields: fieldsUpdated,
            });
          } else {
            this.logger.error('ContextUpdate', `Context validation failed`, {
              executionId,
              updates: Object.keys(contextUpdates),
            });
          }
        } catch (error) {
          this.logger.error('ContextUpdate', `Context update failed`, {
            executionId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Update metrics
      if (serviceResult.success) {
        this.metrics.successfulIntegrations++;
      } else {
        this.metrics.failedIntegrations++;
      }

      if (contextUpdated) {
        this.metrics.contextUpdateSuccessRate = 
          (this.metrics.contextUpdateSuccessRate * (this.metrics.totalExecutions - 1) + 1) / 
          this.metrics.totalExecutions;
      }

      this.metrics.serviceSuccessRate = 
        this.metrics.successfulIntegrations / this.metrics.totalExecutions;
      
      this.metrics.averageExecutionTime = 
        (this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + duration) / 
        this.metrics.totalExecutions;

      // Emit completion event
      this.emitEvent({
        type: 'SERVICE_COMPLETED',
        ticker: config.ticker,
        step: serviceConfig.stepId,
        success: serviceResult.success,
      });

      if (contextUpdated) {
        this.emitEvent({
          type: 'CONTEXT_UPDATED',
          ticker: config.ticker,
          fields: fieldsUpdated,
        });
      }

      return {
        success: serviceResult.success && contextUpdated,
        data: serviceResult.data,
        error: serviceResult.error,
        contextUpdated,
        fieldsUpdated,
        serviceResult,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      this.logger.error('ExecuteWithIntegration', `Integration failed`, {
        executionId,
        error: errorObj.message,
        duration,
      });

      this.metrics.failedIntegrations++;
      
      this.emitEvent({
        type: 'ERROR_OCCURRED',
        ticker: config.ticker,
        error: errorObj,
        step: serviceConfig.stepId,
      });

      return {
        success: false,
        error: errorObj,
        contextUpdated: false,
        fieldsUpdated: [],
        serviceResult: {
          success: false,
          error: errorObj,
          duration,
          retryCount: 0,
          stepId: serviceConfig.stepId,
        },
      };
    }
  }

  /**
   * Execute full workflow with context integration
   */
  async executeWorkflowWithIntegration(
    config: WorkflowIntegrationConfig
  ): Promise<IntegrationResult[]> {
    const executionId = `${config.ticker}-workflow-${Date.now()}`;
    
    this.logger.info('WorkflowExecution', `Starting workflow integration`, {
      executionId,
      ticker: config.ticker,
      totalSteps: config.serviceConfigs.length,
    });

    this.emitEvent({
      type: 'WORKFLOW_STARTED',
      ticker: config.ticker,
      executionId,
    });

    const results: IntegrationResult[] = [];
    let overallSuccess = true;

    try {
      // Set initial context state to loading
      const dispatch = config.contextHooks.useDispatch();
      this.setContextLoading(dispatch, config.ticker, true);

      // Execute each service in sequence
      for (const serviceConfig of config.serviceConfigs) {
        this.logger.info('WorkflowStep', `Executing step ${serviceConfig.stepId}`, {
          executionId,
          serviceName: serviceConfig.serviceName,
        });

        // Get appropriate service function (this would be implemented based on step ID)
        const serviceFn = this.getServiceFunction(serviceConfig.stepId);
        
        if (!serviceFn) {
          const error = new Error(`No service function found for step ${serviceConfig.stepId}`);
          results.push({
            success: false,
            error,
            contextUpdated: false,
            fieldsUpdated: [],
            serviceResult: {
              success: false,
              error,
              duration: 0,
              retryCount: 0,
              stepId: serviceConfig.stepId,
            },
          });
          overallSuccess = false;
          continue;
        }

        const stepResult = await this.executeWithIntegration(
          serviceFn,
          {
            ...config,
            ticker: config.ticker,
            contextHooks: config.contextHooks,
          },
          serviceConfig
        );

        results.push(stepResult);

        if (!stepResult.success) {
          overallSuccess = false;
          this.logger.error('WorkflowStep', `Step ${serviceConfig.stepId} failed`, {
            executionId,
            error: stepResult.error?.message,
          });
          // Continue with remaining steps despite failure
        }
      }

      // Set final context state
      this.setContextLoading(dispatch, config.ticker, false);
      if (overallSuccess) {
        this.setContextComplete(dispatch, config.ticker, true);
      } else {
        this.setContextError(dispatch, config.ticker, 'Workflow completed with errors');
      }

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      overallSuccess = false;
      
      this.logger.error('WorkflowExecution', `Workflow failed`, {
        executionId,
        error: errorObj.message,
      });

      // Set error state in context
      const dispatch = config.contextHooks.useDispatch();
      this.setContextError(dispatch, config.ticker, errorObj.message);
    }

    this.emitEvent({
      type: 'WORKFLOW_COMPLETED',
      ticker: config.ticker,
      executionId,
      success: overallSuccess,
    });

    this.logger.info('WorkflowExecution', `Workflow completed`, {
      executionId,
      totalSteps: results.length,
      successfulSteps: results.filter(r => r.success).length,
      overallSuccess,
    });

    return results;
  }

  /**
   * Get integration metrics
   */
  getMetrics(): IntegrationMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalExecutions: 0,
      successfulIntegrations: 0,
      failedIntegrations: 0,
      averageExecutionTime: 0,
      contextUpdateSuccessRate: 0,
      serviceSuccessRate: 0,
    };
  }

  /**
   * Apply context updates via dispatch
   */
  private applyContextUpdates(
    updates: Partial<TickerContextState>,
    dispatch: ContextDispatch,
    ticker: SupportedTicker,
    stepId: number
  ): boolean {
    try {
      // Apply updates based on step ID and update type
      if (stepId === 1 && 'availableExpirationDates' in updates) {
        // Step 1: Expiration data
        dispatch({
          type: 'SET_EXPIRATION_DATES',
          payload: updates.availableExpirationDates as string[],
        } as any);
        
        if (updates.selectedExpirationDate) {
          dispatch({
            type: 'SET_SELECTED_EXPIRATION',
            payload: updates.selectedExpirationDate as string,
          } as any);
        }
      } else if (stepId === 2 && 'stockSnapshotJson' in updates) {
        // Step 2: Stock data
        dispatch({
          type: 'SET_STOCK_DATA',
          payload: {
            stockSnapshotJson: updates.stockSnapshotJson as string || '',
            marketStatusJson: updates.marketStatusJson as string || '',
            standardTasJson: updates.standardTasJson as string || '',
            aiAnalyzedTaJson: updates.aiAnalyzedTaJson as string || '',
          },
        } as any);
        
        if (updates.optionsChainJson) {
          dispatch({
            type: 'SET_OPTIONS_CHAIN_DATA',
            payload: updates.optionsChainJson as string,
          } as any);
        }
      } else if (stepId === 3 && 'aiKeyTakeawaysJson' in updates) {
        // Step 3: AI takeaways
        dispatch({
          type: 'SET_AI_KEY_TAKEAWAYS',
          payload: updates.aiKeyTakeawaysJson as string,
        } as any);
      } else if (stepId === 4 && 'aiOptionsAnalysisJson' in updates) {
        // Step 4: AI options
        dispatch({
          type: 'SET_AI_OPTIONS_ANALYSIS',
          payload: updates.aiOptionsAnalysisJson as string,
        } as any);
      }

      return true;
    } catch (error) {
      this.logger.error('ApplyContextUpdates', `Failed to apply context updates`, {
        stepId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Set context loading state
   */
  private setContextLoading(dispatch: ContextDispatch, ticker: SupportedTicker, loading: boolean): void {
    if (loading) {
      dispatch({ type: 'SET_LOADING' } as any);
    } else {
      dispatch({ type: 'SET_IDLE' } as any);
    }
  }

  /**
   * Set context complete state
   */
  private setContextComplete(dispatch: ContextDispatch, ticker: SupportedTicker, complete: boolean): void {
    dispatch({
      type: 'SET_DATA_RETRIEVAL_COMPLETE',
      payload: complete,
    } as any);
  }

  /**
   * Set context error state
   */
  private setContextError(dispatch: ContextDispatch, ticker: SupportedTicker, error: string): void {
    dispatch({
      type: 'SET_ERROR',
      payload: error,
    } as any);
  }

  /**
   * Get service function by step ID
   */
  private getServiceFunction(stepId: number): ((options: MacroServiceOptions) => Promise<MacroServiceResult>) | null {
    // This would be implemented to return the appropriate service function
    // based on the step ID. For now, returning null as placeholder.
    // In a real implementation, this would import and return the actual service functions
    // from the services directory.
    return null;
  }

  /**
   * Emit integration event
   */
  private emitEvent(event: IntegrationEvent): void {
    const eventKey = `${event.type}_${this.ticker}`;
    const handler = this.eventHandlers.get(eventKey);
    if (handler) {
      handler(event);
    }
  }

  /**
   * Subscribe to integration events
   */
  public subscribe(eventType: IntegrationEvent['type'], handler: (event: IntegrationEvent) => void): () => void {
    const eventKey = `${eventType}_${this.ticker}`;
    this.eventHandlers.set(eventKey, handler);
    
    return () => {
      this.eventHandlers.delete(eventKey);
    };
  }
}

/**
 * Factory function to create StockSage adapter
 */
export function createStockSageAdapter(ticker: SupportedTicker): StockSageAdapter {
  return new StockSageAdapter(ticker);
}

/**
 * Factory function to create adapter with configuration
 */
export function createConfiguredAdapter(
  ticker: SupportedTicker,
  options?: {
    enableDebug?: boolean;
    customMetrics?: Partial<IntegrationMetrics>;
  }
): StockSageAdapter {
  const adapter = new StockSageAdapter(ticker);
  
  if (options?.customMetrics) {
    // Apply custom metrics if provided
    Object.assign(adapter['metrics'], options.customMetrics);
  }
  
  return adapter;
}