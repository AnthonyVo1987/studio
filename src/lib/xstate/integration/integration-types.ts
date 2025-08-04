/**
 * @fileoverview Integration Types for XState-StockSage Bridge
 * 
 * Defines interfaces and types for bridging XState services with existing 
 * StockSage NVDA/SPY context architecture (79 fields each).
 */

import type { NvdaAnalysisState, NvdaAnalysisAction } from '@/contexts/nvda-analysis-context';
// Note: SPY context will be imported when available
// import type { SpyAnalysisState, SpyAnalysisAction } from '@/contexts/spy-analysis-context';
import type { MacroServiceResult, MacroServiceOptions } from '@/lib/xstate/services';

// Re-export service types for compatibility layer usage
export type { MacroServiceResult, MacroServiceOptions } from '@/lib/xstate/services';

/**
 * Supported ticker symbols for integration
 */
export type SupportedTicker = 'NVDA' | 'SPY';

/**
 * Context state union type for any supported ticker
 * Currently using NVDA as the primary type, SPY will be added when available
 */
export type TickerContextState = NvdaAnalysisState; // | SpyAnalysisState;

/**
 * Context action union type for any supported ticker
 * Currently using NVDA as the primary type, SPY will be added when available
 */
export type TickerContextAction = NvdaAnalysisAction; // | SpyAnalysisAction;

/**
 * Context dispatch function type
 */
export type ContextDispatch = React.Dispatch<TickerContextAction>;

/**
 * Context hooks interface for any ticker
 */
export interface TickerContextHooks {
  useAnalysis: () => TickerContextState;
  useDispatch: () => ContextDispatch;
}

/**
 * StockSage compatibility layer configuration
 */
export interface StockSageCompatConfig {
  /** Ticker symbol */
  ticker: SupportedTicker;
  /** Enable debug logging */
  enableDebug?: boolean;
  /** Custom timeout for operations */
  timeout?: number;
  /** Max retry attempts */
  maxRetries?: number;
  /** Context hooks for the ticker */
  contextHooks: TickerContextHooks;
}

/**
 * Service-to-Context field mapping configuration
 */
export interface ServiceContextMapping {
  /** Step 1: Expiration data mapping */
  expiration: {
    availableExpirations: keyof TickerContextState;
    selectedExpiration: keyof TickerContextState;
  };
  /** Step 2: Stock data mapping */
  stockData: {
    stockSnapshotJson: keyof TickerContextState;
    marketStatusJson: keyof TickerContextState;
    standardTasJson: keyof TickerContextState;
    aiAnalyzedTaJson: keyof TickerContextState;
    optionsChainJson: keyof TickerContextState;
    hasStockData: keyof TickerContextState;
    hasOptionsChainData: keyof TickerContextState;
  };
  /** Step 3: AI takeaways mapping */
  aiTakeaways: {
    aiKeyTakeawaysJson: keyof TickerContextState;
    hasAiKeyTakeaways: keyof TickerContextState;
    isAiKeyTakeawaysLoading: keyof TickerContextState;
  };
  /** Step 4: AI options mapping */
  aiOptions: {
    aiOptionsAnalysisJson: keyof TickerContextState;
    hasAiOptionsAnalysis: keyof TickerContextState;
    isAiOptionsAnalysisLoading: keyof TickerContextState;
  };
  /** General state mapping */
  general: {
    status: keyof TickerContextState;
    error: keyof TickerContextState;
    dataRetrievalComplete: keyof TickerContextState;
  };
}

/**
 * Integration result for service execution
 */
export interface IntegrationResult<T = any> {
  /** Success status */
  success: boolean;
  /** Service result data */
  data?: T;
  /** Error information */
  error?: Error;
  /** Context update status */
  contextUpdated: boolean;
  /** Fields updated in context */
  fieldsUpdated: string[];
  /** Service execution metadata */
  serviceResult: MacroServiceResult<T>;
}

/**
 * Batch update configuration for context
 */
export interface BatchUpdateConfig {
  /** Updates to apply to context */
  updates: Partial<TickerContextState>;
  /** Action type for batch update */
  actionType: string;
  /** Whether to validate updates before applying */
  validateUpdates?: boolean;
  /** Custom validation function */
  validator?: (updates: Partial<TickerContextState>) => boolean;
}

/**
 * Integration event types for XState communication
 */
export type IntegrationEvent =
  | { type: 'CONTEXT_UPDATED'; ticker: SupportedTicker; fields: string[] }
  | { type: 'SERVICE_COMPLETED'; ticker: SupportedTicker; step: number; success: boolean }
  | { type: 'ERROR_OCCURRED'; ticker: SupportedTicker; error: Error; step?: number }
  | { type: 'WORKFLOW_STARTED'; ticker: SupportedTicker; executionId: string }
  | { type: 'WORKFLOW_COMPLETED'; ticker: SupportedTicker; executionId: string; success: boolean };

/**
 * Integration metrics for monitoring
 */
export interface IntegrationMetrics {
  /** Total integration executions */
  totalExecutions: number;
  /** Successful integrations */
  successfulIntegrations: number;
  /** Failed integrations */
  failedIntegrations: number;
  /** Average execution time */
  averageExecutionTime: number;
  /** Context update success rate */
  contextUpdateSuccessRate: number;
  /** Service success rate */
  serviceSuccessRate: number;
}

/**
 * Context transformation function type
 */
export type ContextTransformer<T = any> = (
  serviceResult: MacroServiceResult<T>,
  currentContext: TickerContextState
) => Partial<TickerContextState>;

/**
 * Service integration configuration
 */
export interface ServiceIntegrationConfig {
  /** Service step ID */
  stepId: number;
  /** Service name */
  serviceName: string;
  /** Context transformer function */
  transformer: ContextTransformer;
  /** Required context fields for execution */
  requiredFields?: (keyof TickerContextState)[];
  /** Optional context fields */
  optionalFields?: (keyof TickerContextState)[];
  /** Validation function for context state */
  contextValidator?: (context: TickerContextState) => boolean;
}

/**
 * Workflow integration configuration
 */
export interface WorkflowIntegrationConfig {
  /** Ticker symbol */
  ticker: SupportedTicker;
  /** Service integration configs for each step */
  serviceConfigs: ServiceIntegrationConfig[];
  /** Workflow-level options */
  options: MacroServiceOptions;
  /** Context hooks */
  contextHooks: TickerContextHooks;
  /** Event handler for integration events */
  eventHandler?: (event: IntegrationEvent) => void;
}

/**
 * Compatibility layer interface
 */
export interface CompatibilityLayer {
  /** Transform service result to context format */
  transformToContext<T>(
    serviceResult: MacroServiceResult<T>,
    targetTicker: SupportedTicker
  ): Partial<TickerContextState>;
  
  /** Validate context updates */
  validateContextUpdate(
    updates: Partial<TickerContextState>,
    ticker: SupportedTicker
  ): boolean;
  
  /** Apply updates to context via dispatch */
  applyContextUpdates(
    updates: Partial<TickerContextState>,
    dispatch: ContextDispatch,
    ticker: SupportedTicker
  ): boolean;
  
  /** Get context field mapping for ticker */
  getFieldMapping(ticker: SupportedTicker): ServiceContextMapping;
}

/**
 * Integration adapter interface
 */
export interface IntegrationAdapter {
  /** Execute service with context integration */
  executeWithIntegration<T>(
    serviceFn: (options: MacroServiceOptions) => Promise<MacroServiceResult<T>>,
    config: StockSageCompatConfig,
    serviceConfig: ServiceIntegrationConfig
  ): Promise<IntegrationResult<T>>;
  
  /** Execute full workflow with context integration */
  executeWorkflowWithIntegration(
    config: WorkflowIntegrationConfig
  ): Promise<IntegrationResult[]>;
  
  /** Get integration metrics */
  getMetrics(): IntegrationMetrics;
  
  /** Reset metrics */
  resetMetrics(): void;
}

/**
 * Bridge factory interface
 */
export interface BridgeFactory {
  /** Create integration adapter for ticker */
  createAdapter(ticker: SupportedTicker): IntegrationAdapter;
  
  /** Create compatibility layer */
  createCompatibilityLayer(): CompatibilityLayer;
  
  /** Create context bridge for ticker */
  createContextBridge(
    ticker: SupportedTicker,
    contextHooks: TickerContextHooks
  ): ContextBridge;
}

/**
 * Context bridge interface for direct context interaction
 */
export interface ContextBridge {
  /** Get current context state */
  getCurrentState(): TickerContextState;
  
  /** Dispatch action to context */
  dispatch(action: TickerContextAction): void;
  
  /** Update multiple context fields */
  batchUpdate(updates: Partial<TickerContextState>): void;
  
  /** Subscribe to context changes */
  subscribe(callback: (state: TickerContextState) => void): () => void;
  
  /** Get ticker symbol */
  getTicker(): SupportedTicker;
}

/**
 * Data format validation interface
 */
export interface DataValidator {
  /** Validate JSON string format */
  validateJsonString(data: string, expectedStructure?: object): boolean;
  
  /** Validate expiration date format */
  validateExpirationDate(date: string): boolean;
  
  /** Validate stock data structure */
  validateStockData(data: any): boolean;
  
  /** Validate options chain structure */
  validateOptionsChain(data: any): boolean;
  
  /** Validate AI response structure */
  validateAIResponse(data: any): boolean;
}