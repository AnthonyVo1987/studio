/**
 * @fileOverview Macro Services - Main Export Module
 * 
 * Central export point for all XState-compatible macro services, orchestrators,
 * and utilities. Provides a clean API for consuming the service layer.
 */

// Import types for internal usage
import type { MacroServiceResult } from './service-types';
import { createMacroExecution } from './macro-services';

// Core service implementations
export { createFetchExpirationsService } from './fetch-expirations-service';
export { createGetStockDataService } from './get-stock-data-service';
export { createAITakeawaysService } from './ai-takeaways-service';
export { createAIOptionsService } from './ai-options-service';

// Main orchestrator and factory
export {
  serviceFactory,
  defaultOrchestrator,
  MacroServiceRegistry,
  MacroServiceOrchestrator,
  MacroServiceFactory,
  createMacroExecution,
  executeMacroWorkflow,
} from './macro-services';

// Type definitions
export type {
  // Core service types
  MacroServiceOptions,
  MacroServiceResult,
  MacroServiceConfig,
  ServiceError,
  
  // Data result types
  ExpirationData,
  StockDataResult,
  AITakeawaysResult,
  AIOptionsResult,
  
  // Service function types
  FetchExpirationsService,
  GetStockDataService,
  AITakeawaysService,
  AIOptionsService,
  
  // Orchestrator types
  MacroOrchestrator,
  ServiceRegistry,
  ServiceFactory,
  
  // Context and event types
  MacroExecutionContext,
  MacroExecutionEvent,
  
  // Utility types
  ServiceCreator,
  
  // Convenience aliases
  ServiceOptions,
  ServiceResult,
  ServiceConfig,
} from './service-types';

// Additional workflow types needed by xstate index
export interface MacroWorkflowResult {
  success: boolean;
  results: MacroServiceResult[];
  totalDuration: number;
  completedSteps: number;
  failedSteps: number;
  error?: Error;
}

export interface MacroWorkflowSummary {
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  totalDuration: number;
  averageStepDuration: number;
  successRate: number;
  hasTimeouts: boolean;
  hasRetries: boolean;
}

export interface ExecutionMetadata {
  executionId: string;
  ticker: string;
  startTime: number;
  endTime?: number;
  wasTimeout?: boolean;
  wasCancelled?: boolean;
  wasRetried?: boolean;
  originalError?: string;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  networkLatency?: number;
  processTime?: number;
  totalExecutionTime?: number;
  stepDurations?: Record<number, number>;
  retryCount?: number;
  timeoutCount?: number;
}

// Demo and examples (for development)
export { runAllExamples as runServiceDemo } from './demo-usage';

/**
 * Service Layer Version Information
 */
export const SERVICE_LAYER_VERSION = '1.0.0';
export const SERVICE_LAYER_COMPATIBLE_XSTATE_VERSION = '^5.0.0';

/**
 * Default configuration constants
 */
export const DEFAULT_SERVICE_CONFIG = {
  TIMEOUT: 45000,
  MAX_RETRIES: 2,
  ENABLE_DEBUG: process.env.NODE_ENV === 'development',
} as const;

/**
 * Service step mapping for reference
 */
export const SERVICE_STEPS = {
  FETCH_EXPIRATIONS: 1,
  GET_STOCK_DATA: 2,
  AI_TAKEAWAYS: 3,
  AI_OPTIONS: 4,
} as const;

/**
 * Utility function to check service layer compatibility
 */
export function isServiceLayerCompatible(): boolean {
  try {
    // Basic compatibility checks
    const hasPromiseSupport = typeof Promise !== 'undefined';
    const hasAsyncSupport = typeof async function() {} === 'function';
    const hasAbortController = typeof AbortController !== 'undefined';
    
    return hasPromiseSupport && hasAsyncSupport && hasAbortController;
  } catch {
    return false;
  }
}

/**
 * Create a service execution summary
 */
export function createServiceSummary(results: MacroServiceResult[]): {
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  totalDuration: number;
  averageStepDuration: number;
  successRate: number;
  hasTimeouts: boolean;
  hasRetries: boolean;
  stepDetails: Array<{
    stepId: number;
    success: boolean;
    duration: number;
    retryCount: number;
    errorType?: string;
  }>;
} {
  const totalSteps = results.length;
  const successfulSteps = results.filter(r => r.success).length;
  const failedSteps = totalSteps - successfulSteps;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const averageStepDuration = totalSteps > 0 ? totalDuration / totalSteps : 0;
  const successRate = totalSteps > 0 ? (successfulSteps / totalSteps) * 100 : 0;
  const hasTimeouts = results.some(r => r.metadata?.wasTimeout);
  const hasRetries = results.some(r => r.retryCount > 0);

  const stepDetails = results.map(result => ({
    stepId: result.stepId,
    success: result.success,
    duration: result.duration,
    retryCount: result.retryCount,
    errorType: result.success ? undefined : (result.error as any)?.type || 'unknown',
  }));

  return {
    totalSteps,
    successfulSteps,
    failedSteps,
    totalDuration,
    averageStepDuration,
    successRate,
    hasTimeouts,
    hasRetries,
    stepDetails,
  };
}

/**
 * Quick start helper for common use cases
 */
export class MacroServiceQuickStart {
  /**
   * Execute macro workflow with default settings
   */
  static async execute(ticker: string): Promise<MacroServiceResult[]> {
    const execution = createMacroExecution(ticker);
    return await execution.orchestrator.executeAll(execution.options);
  }

  /**
   * Execute with custom timeout
   */
  static async executeWithTimeout(ticker: string, timeoutMs: number): Promise<MacroServiceResult[]> {
    const execution = createMacroExecution(ticker, { timeout: timeoutMs });
    return await execution.orchestrator.executeAll(execution.options);
  }

  /**
   * Execute with custom retry settings
   */
  static async executeWithRetries(ticker: string, maxRetries: number): Promise<MacroServiceResult[]> {
    const execution = createMacroExecution(ticker, { maxRetries });
    return await execution.orchestrator.executeAll(execution.options);
  }

  /**
   * Execute single step only
   */
  static async executeSingleStep(ticker: string, stepId: number): Promise<MacroServiceResult> {
    const execution = createMacroExecution(ticker);
    return await execution.orchestrator.executeStep(stepId, execution.options);
  }

  /**
   * Validate if services can execute for ticker
   */
  static validate(ticker: string): boolean {
    const execution = createMacroExecution(ticker);
    return execution.orchestrator.validateExecution(execution.options);
  }
}

/**
 * Export quick start for convenience
 */
export const quickStart = MacroServiceQuickStart;