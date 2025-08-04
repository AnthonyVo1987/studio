/**
 * @fileoverview Data Transformers for XState-StockSage Integration
 * 
 * Transforms XState service results to existing StockSage JSON formats.
 * Ensures compatibility with NVDA/SPY context expectations (79 fields each).
 */

import type {
  ContextTransformer,
  SupportedTicker,
  TickerContextState,
  DataValidator,
} from './integration-types';
import type { MacroServiceResult } from '@/lib/xstate/services';
import { createTickerLogger } from '@/lib/ticker-logger';

/**
 * Service result types from the XState services
 */
interface ExpirationData {
  availableExpirations: string[];
  selectedExpiration: string;
  autoSelected: boolean;
  source: string;
}

interface StockDataResult {
  stockSnapshotJson: string;
  marketStatusJson: string;
  technicalIndicatorsJson: string;
  optionsChainJson: string;
  currentPrice: number;
  dataSource: string;
  fetchTimestamp: number;
}

interface AITakeawaysResult {
  aiKeyTakeawaysJson: string;
  promptUsed: string;
  processingTime: number;
  tokenCount?: number;
  modelUsed: string;
}

interface AIOptionsResult {
  aiOptionsAnalysisJson: string;
  promptUsed: string;
  processingTime: number;
  tokenCount?: number;
  modelUsed: string;
  strategiesGenerated: number;
}

/**
 * Data Transformer Collection
 */
export class DataTransformers {
  private logger;
  private validator: DataValidator;

  constructor(private ticker: SupportedTicker) {
    this.logger = createTickerLogger(ticker, `${ticker}_DATA_TRANSFORMERS`);
    this.validator = new StockSageDataValidator();
  }

  /**
   * Transform Step 1: Expiration Data
   */
  transformExpirationData: ContextTransformer<ExpirationData> = (
    serviceResult,
    currentContext
  ) => {
    this.logger.debug('TransformExpirationData', 'Transforming expiration data', {
      success: serviceResult.success,
      hasData: !!serviceResult.data,
    });

    if (!serviceResult.success || !serviceResult.data) {
      return {};
    }

    const expirationData = serviceResult.data as ExpirationData;
    
    // Validate the data
    if (!this.validator.validateExpirationDate(expirationData.selectedExpiration)) {
      this.logger.error('TransformExpirationData', 'Invalid expiration date format', {
        selectedExpiration: expirationData.selectedExpiration,
      });
      return {};
    }

    return {
      availableExpirationDates: expirationData.availableExpirations,
      selectedExpirationDate: expirationData.selectedExpiration,
      // Update status to indicate expiration data is loaded
      status: 'idle' as const,
      error: null,
    };
  };

  /**
   * Transform Step 2: Stock Data
   */
  transformStockData: ContextTransformer<StockDataResult> = (
    serviceResult,
    currentContext
  ) => {
    this.logger.debug('TransformStockData', 'Transforming stock data', {
      success: serviceResult.success,
      hasData: !!serviceResult.data,
    });

    if (!serviceResult.success || !serviceResult.data) {
      return {};
    }

    const stockData = serviceResult.data as StockDataResult;
    
    // Validate JSON strings
    const isValidStockSnapshot = this.validator.validateJsonString(stockData.stockSnapshotJson);
    const isValidMarketStatus = this.validator.validateJsonString(stockData.marketStatusJson);
    const isValidOptionsChain = this.validator.validateJsonString(stockData.optionsChainJson);

    if (!isValidStockSnapshot) {
      this.logger.error('TransformStockData', 'Invalid stock snapshot JSON', {
        length: stockData.stockSnapshotJson?.length || 0,
      });
    }

    return {
      stockSnapshotJson: isValidStockSnapshot ? stockData.stockSnapshotJson : '',
      marketStatusJson: isValidMarketStatus ? stockData.marketStatusJson : '',
      standardTasJson: stockData.technicalIndicatorsJson || '',
      aiAnalyzedTaJson: '', // This would be populated by AI analysis
      optionsChainJson: isValidOptionsChain ? stockData.optionsChainJson : '',
      hasStockData: isValidStockSnapshot,
      hasOptionsChainData: isValidOptionsChain,
      status: 'idle' as const,
      error: null,
    };
  };

  /**
   * Transform Step 3: AI Takeaways
   */
  transformAITakeaways: ContextTransformer<AITakeawaysResult> = (
    serviceResult,
    currentContext
  ) => {
    this.logger.debug('TransformAITakeaways', 'Transforming AI takeaways', {
      success: serviceResult.success,
      hasData: !!serviceResult.data,
    });

    if (!serviceResult.success || !serviceResult.data) {
      return {
        isAiKeyTakeawaysLoading: false,
        hasAiKeyTakeaways: false,
      };
    }

    const aiData = serviceResult.data as AITakeawaysResult;
    
    // Validate AI response
    const isValidAIResponse = this.validator.validateAIResponse(
      this.parseJsonSafely(aiData.aiKeyTakeawaysJson)
    );

    if (!isValidAIResponse) {
      this.logger.error('TransformAITakeaways', 'Invalid AI takeaways response', {
        length: aiData.aiKeyTakeawaysJson?.length || 0,
      });
    }

    return {
      aiKeyTakeawaysJson: isValidAIResponse ? aiData.aiKeyTakeawaysJson : '',
      hasAiKeyTakeaways: isValidAIResponse,
      isAiKeyTakeawaysLoading: false,
      // Also update aiAnalyzedTaJson for compatibility
      aiAnalyzedTaJson: isValidAIResponse ? aiData.aiKeyTakeawaysJson : currentContext.aiAnalyzedTaJson,
      hasAiTaData: isValidAIResponse || currentContext.hasAiTaData,
      status: 'idle' as const,
      error: null,
    };
  };

  /**
   * Transform Step 4: AI Options Analysis
   */
  transformAIOptions: ContextTransformer<AIOptionsResult> = (
    serviceResult,
    currentContext
  ) => {
    this.logger.debug('TransformAIOptions', 'Transforming AI options', {
      success: serviceResult.success,
      hasData: !!serviceResult.data,
    });

    if (!serviceResult.success || !serviceResult.data) {
      return {
        isAiOptionsAnalysisLoading: false,
        hasAiOptionsAnalysis: false,
      };
    }

    const aiData = serviceResult.data as AIOptionsResult;
    
    // Validate AI response
    const isValidAIResponse = this.validator.validateAIResponse(
      this.parseJsonSafely(aiData.aiOptionsAnalysisJson)
    );

    if (!isValidAIResponse) {
      this.logger.error('TransformAIOptions', 'Invalid AI options response', {
        length: aiData.aiOptionsAnalysisJson?.length || 0,
        strategiesGenerated: aiData.strategiesGenerated || 0,
      });
    }

    return {
      aiOptionsAnalysisJson: isValidAIResponse ? aiData.aiOptionsAnalysisJson : '',
      hasAiOptionsAnalysis: isValidAIResponse,
      isAiOptionsAnalysisLoading: false,
      // Mark data retrieval as complete if this is the final step
      dataRetrievalComplete: true,
      status: 'idle' as const,
      error: null,
    };
  };

  /**
   * Transform error result
   */
  transformError: ContextTransformer<any> = (serviceResult, currentContext) => {
    this.logger.error('TransformError', 'Transforming error result', {
      error: serviceResult.error?.message,
      stepId: serviceResult.stepId,
    });

    return {
      status: 'error' as const,
      error: serviceResult.error?.message || 'Unknown error occurred',
      // Reset loading flags
      isAiKeyTakeawaysLoading: false,
      isAiOptionsAnalysisLoading: false,
      dataRetrievalComplete: false,
    };
  };

  /**
   * Generic transformer for any step
   */
  getTransformerForStep(stepId: number): ContextTransformer {
    switch (stepId) {
      case 1:
        return this.transformExpirationData;
      case 2:
        return this.transformStockData;
      case 3:
        return this.transformAITakeaways;
      case 4:
        return this.transformAIOptions;
      default:
        return this.transformError;
    }
  }

  /**
   * Transform service result based on service configuration
   * This is the main method called by the integration layer
   */
  transformServiceResult(
    serviceResult: MacroServiceResult<any>,
    serviceConfig: any
  ): Partial<TickerContextState> {
    this.logger.debug('TransformServiceResult', 'Transforming service result', {
      stepId: serviceResult.stepId,
      serviceName: serviceConfig?.serviceName,
      success: serviceResult.success,
    });

    // Use the appropriate transformer for the step
    const transformer = this.getTransformerForStep(serviceResult.stepId);
    
    // Get current context (empty object as fallback)
    const currentContext = {} as TickerContextState;
    
    try {
      const result = transformer(serviceResult, currentContext);
      
      this.logger.debug('TransformServiceResult', 'Transformation completed', {
        stepId: serviceResult.stepId,
        fieldsUpdated: Object.keys(result).length,
        fields: Object.keys(result),
      });
      
      return result;
    } catch (error) {
      this.logger.error('TransformServiceResult', 'Transformation failed', {
        stepId: serviceResult.stepId,
        error: error instanceof Error ? error.message : String(error),
      });
      
      return this.transformError(serviceResult, currentContext);
    }
  }

  /**
   * Safely parse JSON string
   */
  private parseJsonSafely(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }
}

/**
 * StockSage Data Validator Implementation
 */
export class StockSageDataValidator implements DataValidator {
  /**
   * Validate JSON string format
   */
  validateJsonString(data: string, expectedStructure?: object): boolean {
    if (!data || typeof data !== 'string') {
      return false;
    }

    try {
      const parsed = JSON.parse(data);
      
      // If expected structure is provided, validate against it
      if (expectedStructure) {
        return this.validateStructure(parsed, expectedStructure);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate expiration date format
   */
  validateExpirationDate(date: string): boolean {
    if (!date || typeof date !== 'string') {
      return false;
    }

    // Check for common expiration date formats
    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{4}\d{2}\d{2}$/, // YYYYMMDD
    ];

    return dateFormats.some(format => format.test(date));
  }

  /**
   * Validate stock data structure
   */
  validateStockData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for essential stock data fields
    const requiredFields = ['ticker', 'price'];
    const optionalFields = ['change', 'changePercent', 'volume', 'marketCap'];

    return requiredFields.every(field => field in data);
  }

  /**
   * Validate options chain structure
   */
  validateOptionsChain(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for options chain structure
    const hasResults = 'results' in data && Array.isArray(data.results);
    const hasUnderlyingTicker = 'underlying_ticker' in data;
    
    return hasResults || hasUnderlyingTicker;
  }

  /**
   * Validate AI response structure
   */
  validateAIResponse(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for common AI response patterns
    const hasAnalysis = 'analysis' in data || 'takeaways' in data || 'recommendations' in data;
    const hasContent = Object.keys(data).length > 0;
    
    return hasAnalysis || hasContent;
  }

  /**
   * Validate structure against expected schema
   */
  private validateStructure(data: any, expected: object): boolean {
    try {
      if (typeof data !== typeof expected) {
        return false;
      }

      if (typeof data === 'object' && data !== null && expected !== null) {
        return Object.keys(expected).every(key => key in data);
      }

      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create data transformers
 */
export function createDataTransformers(ticker: SupportedTicker): DataTransformers {
  return new DataTransformers(ticker);
}

/**
 * Factory function to create data validator
 */
export function createDataValidator(): DataValidator {
  return new StockSageDataValidator();
}

/**
 * Utility function to create safe JSON string
 */
export function createSafeJsonString(data: any): string {
  try {
    if (typeof data === 'string') {
      // Validate existing JSON string
      JSON.parse(data);
      return data;
    }
    return JSON.stringify(data);
  } catch {
    return '';
  }
}

/**
 * Utility function to merge context updates safely
 */
export function mergeContextUpdates(
  existing: Partial<TickerContextState>,
  newUpdates: Partial<TickerContextState>
): Partial<TickerContextState> {
  // Create a safe merge that preserves existing values when new values are undefined
  const merged = { ...existing };
  
  Object.keys(newUpdates).forEach(key => {
    const typedKey = key as keyof TickerContextState;
    const newValue = newUpdates[typedKey];
    
    // Only update if new value is defined and different
    if (newValue !== undefined && newValue !== existing[typedKey]) {
      (merged as any)[typedKey] = newValue;
    }
  });
  
  return merged;
}

/**
 * Utility function to validate ticker-specific updates
 */
export function validateTickerUpdates(
  updates: Partial<TickerContextState>,
  ticker: SupportedTicker
): boolean {
  try {
    // Basic validation - ensure updates object is valid
    if (!updates || typeof updates !== 'object') {
      return false;
    }

    // Validate specific field types
    if (updates.status && !['idle', 'loading', 'error'].includes(updates.status)) {
      return false;
    }

    if (updates.availableExpirationDates && !Array.isArray(updates.availableExpirationDates)) {
      return false;
    }

    // Validate JSON strings if present
    const validator = createDataValidator();
    const jsonFields = [
      'stockSnapshotJson',
      'marketStatusJson',
      'standardTasJson',
      'aiAnalyzedTaJson',
      'aiKeyTakeawaysJson',
      'aiOptionsAnalysisJson',
      'optionsChainJson',
    ];

    for (const field of jsonFields) {
      const value = updates[field as keyof TickerContextState];
      if (value && typeof value === 'string' && value.length > 0) {
        if (!validator.validateJsonString(value)) {
          return false;
        }
      }
    }

    return true;
  } catch {
    return false;
  }
}