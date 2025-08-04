/**
 * @fileoverview XState-StockSage Integration Layer - Main Export Module
 * 
 * Provides seamless integration between XState services and existing 
 * StockSage NVDA/SPY context architecture (79 fields each).
 */

// Core integration types
export type {
  SupportedTicker,
  TickerContextState,
  TickerContextAction,
  TickerContextHooks,
  ServiceContextMapping,
  IntegrationResult,
  IntegrationMetrics,
  IntegrationEvent,
  StockSageCompatConfig,
  ServiceIntegrationConfig,
  WorkflowIntegrationConfig,
  CompatibilityLayer,
  IntegrationAdapter,
  ContextBridge,
  BridgeFactory,
  DataValidator,
  ContextTransformer,
  BatchUpdateConfig,
} from './integration-types';

// StockSage Integration Adapter
export {
  StockSageAdapter,
  createStockSageAdapter,
  createConfiguredAdapter,
} from './stocksage-adapter';

// Context Bridge
export {
  StockSageContextBridge,
  createContextBridge,
  getContextMapping,
  validateContextState,
  createSafeUpdates,
} from './context-bridge';

// Data Transformers
export {
  DataTransformers,
  StockSageDataValidator,
  createDataTransformers,
  createDataValidator,
  createSafeJsonString,
  mergeContextUpdates,
  validateTickerUpdates,
} from './data-transformers';

// Compatibility Layer
export {
  StockSageCompatibilityLayer,
  createCompatibilityLayer,
  areUpdatesCompatible,
  getSafeUpdates,
} from './compatibility-layer';

// Import functions for use in this file
import { createContextBridge } from './context-bridge';
import { createCompatibilityLayer } from './compatibility-layer';
import { createDataTransformers } from './data-transformers';

/**
 * Main integration factory function
 * Creates complete integration setup for a ticker
 * 
 * Production implementation for Phase 2 completion.
 */
export function createIntegrationSetup(
  ticker: string, // Using string for now, will be SupportedTicker when types are ready
  contextHooks: any, // Using any for now, will be TickerContextHooks when ready
  options?: {
    enableDebug?: boolean;
    timeout?: number;
    maxRetries?: number;
  }
) {
  const config = {
    ticker,
    contextHooks,
    enableDebug: options?.enableDebug ?? false,
    timeout: options?.timeout ?? 45000,
    maxRetries: options?.maxRetries ?? 2,
  };

  // Create actual integration components with full functionality
  const contextBridge = createContextBridge(ticker as any, contextHooks);
  const compatibilityLayer = createCompatibilityLayer();
  const dataTransformers = createDataTransformers(ticker as any);
  
  // Metrics tracking
  let totalExecutions = 0;
  let successfulIntegrations = 0;
  let failedIntegrations = 0;
  let executionTimes: number[] = [];
  let contextUpdateSuccesses = 0;
  let contextUpdateAttempts = 0;
  
  const adapter = {
    executeWithIntegration: async (serviceFn: any, serviceConfig: any, config: any, options?: { timeout?: number; maxRetries?: number }) => {
      const startTime = Date.now();
      totalExecutions++;
      
      const timeout = options?.timeout || config.timeout || 45000;
      const maxRetries = options?.maxRetries || config.maxRetries || 2;
      
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Create timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Service execution timeout after ${timeout}ms`)), timeout);
          });
          
          // Execute service with timeout protection
          const servicePromise = typeof serviceFn === 'function' ? serviceFn(serviceConfig) : serviceFn;
          const serviceResult = await Promise.race([servicePromise, timeoutPromise]);
          
          // Transform service result to context updates
          const contextUpdates = dataTransformers.transformServiceResult(serviceResult, serviceConfig);
          
          // Update context if we have valid updates
          let contextUpdated = false;
          let fieldsUpdated: string[] = [];
          
          if (contextUpdates && Object.keys(contextUpdates).length > 0) {
            contextUpdateAttempts++;
            try {
              contextBridge.batchUpdate(contextUpdates);
              contextUpdated = true;
              fieldsUpdated = Object.keys(contextUpdates);
              contextUpdateSuccesses++;
            } catch (updateError) {
              throw new Error(`Context update failed: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
            }
          }
          
          const duration = Date.now() - startTime;
          executionTimes.push(duration);
          successfulIntegrations++;
          
          return {
            success: true,
            error: null,
            duration,
            retryCount: attempt - 1,
            contextUpdated,
            fieldsUpdated,
            serviceResult
          };
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // If it's the last attempt or not a retryable error, break
          if (attempt >= maxRetries || !isRetryableError(lastError)) {
            break;
          }
          
          // Exponential backoff for retries
          const backoffDelay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
      
      // All retries failed
      const duration = Date.now() - startTime;
      executionTimes.push(duration);
      failedIntegrations++;
      
      return {
        success: false,
        error: lastError || new Error('Unknown service execution error'),
        duration,
        retryCount: maxRetries,
        contextUpdated: false,
        fieldsUpdated: []
      };
    },
    
    executeWorkflow: async (workflowConfig: any[], config: any) => {
      const results = [];
      
      for (const serviceConfig of workflowConfig) {
        const result = await adapter.executeWithIntegration(
          serviceConfig.serviceFn,
          serviceConfig,
          config
        );
        
        results.push({
          success: result.success,
          error: result.error,
          stepId: serviceConfig.stepId,
          duration: result.duration,
          retryCount: result.retryCount,
          contextUpdated: result.contextUpdated,
          fieldsUpdated: result.fieldsUpdated
        });
        
        // Stop on first failure if not configured to continue
        if (!result.success && !config.continueOnFailure) {
          break;
        }
      }
      
      return results;
    },
    
    on: (event: string, callback: any) => {
      // Simple event system for now - could be enhanced with full EventTarget
      const listeners = (adapter as any)._listeners || ((adapter as any)._listeners = new Map());
      const eventListeners = listeners.get(event) || [];
      eventListeners.push(callback);
      listeners.set(event, eventListeners);
      
      return () => {
        const currentListeners = listeners.get(event) || [];
        const index = currentListeners.indexOf(callback);
        if (index > -1) {
          currentListeners.splice(index, 1);
        }
      };
    },
    
    getMetrics: () => {
      const avgExecutionTime = executionTimes.length > 0 
        ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
        : 0;
      
      const contextUpdateSuccessRate = contextUpdateAttempts > 0 
        ? (contextUpdateSuccesses / contextUpdateAttempts) * 100 
        : 0;
      
      const serviceSuccessRate = totalExecutions > 0 
        ? (successfulIntegrations / totalExecutions) * 100 
        : 0;
      
      return {
        totalExecutions,
        successfulIntegrations,
        failedIntegrations,
        averageExecutionTime: avgExecutionTime,
        contextUpdateSuccessRate,
        serviceSuccessRate
      };
    },
  };
  
  // Helper function to determine if error is retryable
  const isRetryableError = (error: Error): boolean => {
    const retryableMessages = [
      'timeout',
      'network',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'fetch failed'
    ];
    
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  };
  
  return {
    config,
    adapter,
    contextBridge,
    compatibilityLayer,
    dataTransformers,
    
    // Functional methods
    executeService: async (serviceFn: any, serviceConfig: any) => {
      try {
        const result = await adapter.executeWithIntegration(serviceFn, serviceConfig, config);
        return {
          success: result.success,
          error: result.error,
          contextUpdated: result.contextUpdated || false,
          fieldsUpdated: result.fieldsUpdated || [],
          serviceResult: {
            success: result.success,
            error: result.error,
            duration: result.duration || 0,
            retryCount: result.retryCount || 0,
            stepId: serviceConfig.stepId || 0
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          contextUpdated: false,
          fieldsUpdated: [],
          serviceResult: {
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            duration: 0,
            retryCount: 0,
            stepId: serviceConfig?.stepId || 0
          }
        };
      }
    },
    executeWorkflow: async (workflowConfig: any[]) => {
      const results = [];
      for (const serviceConfig of workflowConfig) {
        try {
          const result = await adapter.executeWorkflow([serviceConfig], config);
          results.push(...result);
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            stepId: serviceConfig.stepId,
            duration: 0,
            retryCount: 0
          });
        }
      }
      return results;
    },
    getCurrentState: () => {
      try {
        return contextHooks.useAnalysis ? contextHooks.useAnalysis() : {};
      } catch {
        return {};
      }
    },
    updateContext: (updates: any) => {
      try {
        const dispatch = contextHooks.useDispatch ? contextHooks.useDispatch() : null;
        if (dispatch && updates) {
          contextBridge.batchUpdate(updates);
          console.log('Context updated via bridge:', Object.keys(updates));
        }
      } catch (error) {
        console.error('Context update failed:', error);
      }
    },
    subscribeToChanges: (callback: (event: any) => void) => {
      return adapter.on('*', callback);
    },
    getMetrics: () => adapter.getMetrics(),
  };
}

/**
 * Create service integration configuration helper
 * 
 * Production implementation for Phase 2 completion.
 */
export function createServiceConfig(
  stepId: number,
  serviceName: string,
  options?: {
    requiredFields?: string[];
    optionalFields?: string[];
    customValidator?: (context: any) => boolean;
  }
): any {
  const defaultTransformers = {
    'FetchExpirationsService': (result: any) => ({
      availableExpirationDates: result.data?.availableExpirations?.join(',') || '',
      selectedExpirationDate: result.data?.selectedExpiration || '',
      expirationAutoSelected: result.data?.autoSelected || false,
    }),
    'GetStockDataService': (result: any) => ({
      stockSnapshotJson: result.data?.stockSnapshotJson || '{}',
      marketStatusJson: result.data?.marketStatusJson || '{}',
      technicalIndicatorsJson: result.data?.technicalIndicatorsJson || '{}',
      optionsChainJson: result.data?.optionsChainJson || '{}',
      currentPrice: result.data?.currentPrice || 0,
      dataFetchTimestamp: result.data?.fetchTimestamp || Date.now(),
    }),
    'AITakeawaysService': (result: any) => ({
      aiKeyTakeawaysJson: result.data?.aiKeyTakeawaysJson || '{}',
      aiTakeawaysGeneratedAt: Date.now(),
    }),
    'AIOptionsService': (result: any) => ({
      aiOptionsAnalysisJson: result.data?.aiOptionsAnalysisJson || '{}',
      aiOptionsGeneratedAt: Date.now(),
    }),
  };
  
  return {
    stepId,
    serviceName,
    transformer: defaultTransformers[serviceName as keyof typeof defaultTransformers] || (() => ({})),
    requiredFields: options?.requiredFields || [],
    optionalFields: options?.optionalFields || [],
    contextValidator: options?.customValidator || (() => true),
  };
}

/**
 * Pre-configured service configurations for common workflows
 * NOTE: Placeholder implementations during Phase 2 development.
 */
export const STANDARD_SERVICE_CONFIGS = {
  EXPIRATION_SERVICE: createServiceConfig(1, 'FetchExpirationsService'),
  STOCK_DATA_SERVICE: createServiceConfig(2, 'GetStockDataService', {
    requiredFields: ['selectedExpirationDate'],
  }),
  AI_TAKEAWAYS_SERVICE: createServiceConfig(3, 'AITakeawaysService', {
    requiredFields: ['stockSnapshotJson', 'standardTasJson'],
  }),
  AI_OPTIONS_SERVICE: createServiceConfig(4, 'AIOptionsService', {
    requiredFields: ['stockSnapshotJson', 'optionsChainJson'],
  }),
} as const;

/**
 * Complete workflow configuration for standard macro execution
 */
export const STANDARD_WORKFLOW_CONFIGS = [
  STANDARD_SERVICE_CONFIGS.EXPIRATION_SERVICE,
  STANDARD_SERVICE_CONFIGS.STOCK_DATA_SERVICE,
  STANDARD_SERVICE_CONFIGS.AI_TAKEAWAYS_SERVICE,
  STANDARD_SERVICE_CONFIGS.AI_OPTIONS_SERVICE,
] as const;

/**
 * Integration status checker utility
 * Production implementation for Phase 2 completion.
 */
export function checkIntegrationStatus(
  ticker: string,
  contextHooks: any
): {
  isReady: boolean;
  missingComponents: string[];
  contextValid: boolean;
  hooksValid: boolean;
} {
  const missingComponents: string[] = [];
  
  // Check ticker support
  const supportedTickers = ['NVDA', 'SPY'];
  if (!supportedTickers.includes(ticker.toUpperCase())) {
    missingComponents.push(`Unsupported ticker: ${ticker}`);
  }
  
  // Check context hooks
  const hooksValid = !!(contextHooks?.useAnalysis && contextHooks?.useDispatch);
  if (!hooksValid) {
    missingComponents.push('Context hooks missing or invalid');
  }
  
  // Check context validity
  let contextValid = false;
  try {
    const state = contextHooks?.useAnalysis?.();
    contextValid = !!(state && typeof state === 'object');
  } catch {
    missingComponents.push('Context state not accessible');
  }
  
  return {
    isReady: missingComponents.length === 0,
    missingComponents,
    contextValid,
    hooksValid,
  };
}

/**
 * Debug utility for integration troubleshooting
 * Production implementation for Phase 2 completion.
 */
export function debugIntegration(
  ticker: string,
  contextHooks: any
): {
  ticker: string;
  contextFields: string[];
  fieldMappings: any;
  statusCheck: ReturnType<typeof checkIntegrationStatus>;
  currentState: any;
} {
  let currentState = {};
  let contextFields: string[] = [];
  
  try {
    currentState = contextHooks?.useAnalysis?.() || {};
    contextFields = Object.keys(currentState);
  } catch (error) {
    console.warn('Failed to access current state:', error);
  }
  
  // Standard field mappings for NVDA/SPY contexts
  const fieldMappings = {
    // Service 1: Expiration fetching
    'availableExpirationDates': 'FetchExpirationsService.availableExpirations',
    'selectedExpirationDate': 'FetchExpirationsService.selectedExpiration',
    'expirationAutoSelected': 'FetchExpirationsService.autoSelected',
    
    // Service 2: Stock data
    'stockSnapshotJson': 'GetStockDataService.stockSnapshotJson',
    'marketStatusJson': 'GetStockDataService.marketStatusJson',
    'technicalIndicatorsJson': 'GetStockDataService.technicalIndicatorsJson',
    'optionsChainJson': 'GetStockDataService.optionsChainJson',
    'currentPrice': 'GetStockDataService.currentPrice',
    
    // Service 3: AI takeaways
    'aiKeyTakeawaysJson': 'AITakeawaysService.aiKeyTakeawaysJson',
    
    // Service 4: AI options
    'aiOptionsAnalysisJson': 'AIOptionsService.aiOptionsAnalysisJson',
  };
  
  return {
    ticker,
    contextFields,
    fieldMappings,
    statusCheck: checkIntegrationStatus(ticker, contextHooks),
    currentState,
  };
}

// Re-export service types for convenience
export type { MacroServiceOptions, MacroServiceResult } from '@/lib/xstate/services';