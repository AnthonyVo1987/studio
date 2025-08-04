/**
 * @fileoverview Compatibility Layer for XState-StockSage Integration
 * 
 * Ensures backward compatibility with existing StockSage architecture while
 * enabling XState services integration. Maintains 79-field context patterns.
 */

import type {
  CompatibilityLayer,
  SupportedTicker,
  TickerContextState,
  ContextDispatch,
  ServiceContextMapping,
  MacroServiceResult,
} from './integration-types';
import { createTickerLogger } from '@/lib/ticker-logger';
import { createDataValidator, createSafeJsonString } from './data-transformers';
import { getContextMapping } from './context-bridge';

/**
 * StockSage Compatibility Layer Implementation
 * Provides seamless compatibility between XState services & existing contexts
 */
export class StockSageCompatibilityLayer implements CompatibilityLayer {
  private logger;
  private dataValidator;
  private fieldMappings: Map<SupportedTicker, ServiceContextMapping>;

  constructor() {
    this.logger = createTickerLogger('SYSTEM', 'COMPATIBILITY_LAYER');
    this.dataValidator = createDataValidator();
    this.fieldMappings = new Map();
    
    // Initialize field mappings for supported tickers
    this.initializeFieldMappings();
  }

  /**
   * Transform service result to context format
   */
  transformToContext<T>(
    serviceResult: MacroServiceResult<T>,
    targetTicker: SupportedTicker
  ): Partial<TickerContextState> {
    this.logger.debug('TransformToContext', 'Transforming service result', {
      ticker: targetTicker,
      stepId: serviceResult.stepId,
      success: serviceResult.success,
      hasData: !!serviceResult.data,
    });

    if (!serviceResult.success) {
      return this.createErrorUpdate(serviceResult.error);
    }

    // Transform based on step ID
    switch (serviceResult.stepId) {
      case 1:
        return this.transformExpirationResult(serviceResult.data, targetTicker);
      case 2:
        return this.transformStockDataResult(serviceResult.data, targetTicker);
      case 3:
        return this.transformAITakeawaysResult(serviceResult.data, targetTicker);
      case 4:
        return this.transformAIOptionsResult(serviceResult.data, targetTicker);
      default:
        this.logger.error('TransformToContext', `Unknown step ID: ${serviceResult.stepId}`);
        return {};
    }
  }

  /**
   * Validate context updates
   */
  validateContextUpdate(
    updates: Partial<TickerContextState>,
    ticker: SupportedTicker
  ): boolean {
    try {
      this.logger.debug('ValidateContextUpdate', 'Validating context updates', {
        ticker,
        fieldsCount: Object.keys(updates).length,
        fields: Object.keys(updates).slice(0, 5), // Log first 5 fields
      });

      // Basic validation
      if (!updates || typeof updates !== 'object') {
        return false;
      }

      // Validate specific fields
      const validationResults = this.validateIndividualFields(updates, ticker);
      const isValid = validationResults.every(result => result.valid);

      if (!isValid) {
        const invalidFields = validationResults
          .filter(result => !result.valid)
          .map(result => result.field);
        
        this.logger.error('ValidateContextUpdate', 'Validation failed', {
          ticker,
          invalidFields,
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error('ValidateContextUpdate', 'Validation error', {
        ticker,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Apply updates to context via dispatch
   */
  applyContextUpdates(
    updates: Partial<TickerContextState>,
    dispatch: ContextDispatch,
    ticker: SupportedTicker
  ): boolean {
    try {
      this.logger.debug('ApplyContextUpdates', 'Applying context updates', {
        ticker,
        fieldsCount: Object.keys(updates).length,
      });

      // Group updates by action type for efficient dispatch
      const actionGroups = this.groupUpdatesByActionType(updates, ticker);
      
      // Apply each group of actions
      let successCount = 0;
      for (const [actionType, actionPayload] of actionGroups) {
        try {
          dispatch(actionPayload as any);
          successCount++;
          
          this.logger.debug('ApplyContextUpdates', `Action applied: ${actionType}`, {
            ticker,
          });
        } catch (error) {
          this.logger.error('ApplyContextUpdates', `Action failed: ${actionType}`, {
            ticker,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const allSuccess = successCount === actionGroups.size;
      
      this.logger.info('ApplyContextUpdates', 'Context updates completed', {
        ticker,
        totalActions: actionGroups.size,
        successfulActions: successCount,
        allSuccess,
      });

      return allSuccess;
    } catch (error) {
      this.logger.error('ApplyContextUpdates', 'Apply updates failed', {
        ticker,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get context field mapping for ticker
   */
  getFieldMapping(ticker: SupportedTicker): ServiceContextMapping {
    const mapping = this.fieldMappings.get(ticker);
    if (!mapping) {
      throw new Error(`No field mapping found for ticker: ${ticker}`);
    }
    return mapping;
  }

  /**
   * Initialize field mappings for all supported tickers
   */
  private initializeFieldMappings(): void {
    const supportedTickers: SupportedTicker[] = ['NVDA', 'SPY'];
    
    supportedTickers.forEach(ticker => {
      const mapping = getContextMapping(ticker);
      this.fieldMappings.set(ticker, mapping);
      
      this.logger.debug('InitializeFieldMappings', `Initialized mapping for ${ticker}`, {
        fieldsCount: Object.keys(mapping).length,
      });
    });
  }

  /**
   * Transform expiration result to context format
   */
  private transformExpirationResult(data: any, ticker: SupportedTicker): Partial<TickerContextState> {
    if (!data) return {};

    const mapping = this.getFieldMapping(ticker);
    const updates: Partial<TickerContextState> = {};

    if (data.availableExpirations && Array.isArray(data.availableExpirations)) {
      updates[mapping.expiration.availableExpirations] = data.availableExpirations as any;
    }

    if (data.selectedExpiration && this.dataValidator.validateExpirationDate(data.selectedExpiration)) {
      updates[mapping.expiration.selectedExpiration] = data.selectedExpiration as any;
    }

    // Update status
    updates[mapping.general.status] = 'idle' as any;
    updates[mapping.general.error] = null as any;

    return updates;
  }

  /**
   * Transform stock data result to context format
   */
  private transformStockDataResult(data: any, ticker: SupportedTicker): Partial<TickerContextState> {
    if (!data) return {};

    const mapping = this.getFieldMapping(ticker);
    const updates: Partial<TickerContextState> = {};

    // Transform JSON data fields
    if (data.stockSnapshotJson) {
      const safeJson = createSafeJsonString(data.stockSnapshotJson);
      if (safeJson) {
        updates[mapping.stockData.stockSnapshotJson] = safeJson as any;
        updates[mapping.stockData.hasStockData] = true as any;
      }
    }

    if (data.marketStatusJson) {
      updates[mapping.stockData.marketStatusJson] = createSafeJsonString(data.marketStatusJson) as any;
    }

    if (data.technicalIndicatorsJson) {
      updates[mapping.stockData.standardTasJson] = createSafeJsonString(data.technicalIndicatorsJson) as any;
    }

    if (data.optionsChainJson) {
      const safeJson = createSafeJsonString(data.optionsChainJson);
      if (safeJson) {
        updates[mapping.stockData.optionsChainJson] = safeJson as any;
        updates[mapping.stockData.hasOptionsChainData] = true as any;
      }
    }

    // Update status
    updates[mapping.general.status] = 'idle' as any;
    updates[mapping.general.error] = null as any;

    return updates;
  }

  /**
   * Transform AI takeaways result to context format
   */
  private transformAITakeawaysResult(data: any, ticker: SupportedTicker): Partial<TickerContextState> {
    if (!data) return {};

    const mapping = this.getFieldMapping(ticker);
    const updates: Partial<TickerContextState> = {};

    if (data.aiKeyTakeawaysJson) {
      const safeJson = createSafeJsonString(data.aiKeyTakeawaysJson);
      if (safeJson) {
        updates[mapping.aiTakeaways.aiKeyTakeawaysJson] = safeJson as any;
        updates[mapping.aiTakeaways.hasAiKeyTakeaways] = true as any;
      }
    }

    // Stop loading state
    updates[mapping.aiTakeaways.isAiKeyTakeawaysLoading] = false as any;
    
    // Update general status
    updates[mapping.general.status] = 'idle' as any;
    updates[mapping.general.error] = null as any;

    return updates;
  }

  /**
   * Transform AI options result to context format
   */
  private transformAIOptionsResult(data: any, ticker: SupportedTicker): Partial<TickerContextState> {
    if (!data) return {};

    const mapping = this.getFieldMapping(ticker);
    const updates: Partial<TickerContextState> = {};

    if (data.aiOptionsAnalysisJson) {
      const safeJson = createSafeJsonString(data.aiOptionsAnalysisJson);
      if (safeJson) {
        updates[mapping.aiOptions.aiOptionsAnalysisJson] = safeJson as any;
        updates[mapping.aiOptions.hasAiOptionsAnalysis] = true as any;
      }
    }

    // Stop loading state
    updates[mapping.aiOptions.isAiOptionsAnalysisLoading] = false as any;
    
    // Mark data retrieval as complete
    updates[mapping.general.dataRetrievalComplete] = true as any;
    
    // Update general status
    updates[mapping.general.status] = 'idle' as any;
    updates[mapping.general.error] = null as any;

    return updates;
  }

  /**
   * Create error update for context
   */
  private createErrorUpdate(error?: Error): Partial<TickerContextState> {
    return {
      status: 'error' as any,
      error: error?.message || 'Unknown error occurred',
      isAiKeyTakeawaysLoading: false as any,
      isAiOptionsAnalysisLoading: false as any,
      dataRetrievalComplete: false as any,
    };
  }

  /**
   * Validate individual fields in updates
   */
  private validateIndividualFields(
    updates: Partial<TickerContextState>,
    ticker: SupportedTicker
  ): Array<{ field: string; valid: boolean; reason?: string }> {
    const results: Array<{ field: string; valid: boolean; reason?: string }> = [];

    Object.keys(updates).forEach(field => {
      const value = updates[field as keyof TickerContextState];
      let valid = true;
      let reason: string | undefined;

      // Validate based on field type
      if (field.endsWith('Json') && typeof value === 'string' && value.length > 0) {
        valid = this.dataValidator.validateJsonString(value);
        if (!valid) reason = 'Invalid JSON format';
      } else if (field === 'status') {
        valid = ['idle', 'loading', 'error'].includes(value as string);
        if (!valid) reason = 'Invalid status value';
      } else if (field === 'availableExpirationDates') {
        valid = Array.isArray(value);
        if (!valid) reason = 'Must be array';
      } else if (field === 'selectedExpirationDate' && typeof value === 'string') {
        valid = this.dataValidator.validateExpirationDate(value);
        if (!valid) reason = 'Invalid date format';
      }

      results.push({ field, valid, reason });
    });

    return results;
  }

  /**
   * Group updates by appropriate action type
   */
  private groupUpdatesByActionType(
    updates: Partial<TickerContextState>,
    ticker: SupportedTicker
  ): Map<string, any> {
    const groups = new Map<string, any>();

    // Status updates
    if (updates.status || updates.error !== undefined) {
      if (updates.status === 'loading') {
        groups.set('SET_LOADING', { type: 'SET_LOADING' });
      } else if (updates.status === 'idle') {
        groups.set('SET_IDLE', { type: 'SET_IDLE' });
      } else if (updates.status === 'error') {
        groups.set('SET_ERROR', { 
          type: 'SET_ERROR', 
          payload: updates.error || 'Unknown error' 
        });
      }
    }

    // Expiration updates
    if (updates.availableExpirationDates) {
      groups.set('SET_EXPIRATION_DATES', {
        type: 'SET_EXPIRATION_DATES',
        payload: updates.availableExpirationDates,
      });
    }

    if (updates.selectedExpirationDate) {
      groups.set('SET_SELECTED_EXPIRATION', {
        type: 'SET_SELECTED_EXPIRATION',
        payload: updates.selectedExpirationDate,
      });
    }

    // Stock data updates
    const stockFields = ['stockSnapshotJson', 'marketStatusJson', 'standardTasJson', 'aiAnalyzedTaJson'];
    if (stockFields.some(field => field in updates)) {
      groups.set('SET_STOCK_DATA', {
        type: 'SET_STOCK_DATA',
        payload: {
          stockSnapshotJson: updates.stockSnapshotJson || '',
          marketStatusJson: updates.marketStatusJson || '',
          standardTasJson: updates.standardTasJson || '',
          aiAnalyzedTaJson: updates.aiAnalyzedTaJson || '',
        },
      });
    }

    // Options chain updates
    if (updates.optionsChainJson) {
      groups.set('SET_OPTIONS_CHAIN_DATA', {
        type: 'SET_OPTIONS_CHAIN_DATA',
        payload: updates.optionsChainJson,
      });
    }

    // AI takeaways updates
    if (updates.aiKeyTakeawaysJson) {
      groups.set('SET_AI_KEY_TAKEAWAYS', {
        type: 'SET_AI_KEY_TAKEAWAYS',
        payload: updates.aiKeyTakeawaysJson,
      });
    }

    if ('isAiKeyTakeawaysLoading' in updates) {
      groups.set('SET_AI_KEY_TAKEAWAYS_LOADING', {
        type: 'SET_AI_KEY_TAKEAWAYS_LOADING',
        payload: updates.isAiKeyTakeawaysLoading,
      });
    }

    // AI options updates
    if (updates.aiOptionsAnalysisJson) {
      groups.set('SET_AI_OPTIONS_ANALYSIS', {
        type: 'SET_AI_OPTIONS_ANALYSIS',
        payload: updates.aiOptionsAnalysisJson,
      });
    }

    if ('isAiOptionsAnalysisLoading' in updates) {
      groups.set('SET_AI_OPTIONS_ANALYSIS_LOADING', {
        type: 'SET_AI_OPTIONS_ANALYSIS_LOADING',
        payload: updates.isAiOptionsAnalysisLoading,
      });
    }

    // Data retrieval complete
    if ('dataRetrievalComplete' in updates) {
      groups.set('SET_DATA_RETRIEVAL_COMPLETE', {
        type: 'SET_DATA_RETRIEVAL_COMPLETE',
        payload: updates.dataRetrievalComplete,
      });
    }

    return groups;
  }
}

/**
 * Factory function to create compatibility layer
 */
export function createCompatibilityLayer(): CompatibilityLayer {
  return new StockSageCompatibilityLayer();
}

/**
 * Utility function to check if updates are compatible with ticker
 */
export function areUpdatesCompatible(
  updates: Partial<TickerContextState>,
  ticker: SupportedTicker
): boolean {
  const compatLayer = createCompatibilityLayer();
  return compatLayer.validateContextUpdate(updates, ticker);
}

/**
 * Utility function to get safe updates for ticker
 */
export function getSafeUpdates(
  updates: Partial<TickerContextState>,
  ticker: SupportedTicker,
  currentContext: TickerContextState
): Partial<TickerContextState> {
  const compatLayer = createCompatibilityLayer();
  const safeUpdates: Partial<TickerContextState> = {};
  
  // Only include updates that pass validation
  Object.keys(updates).forEach(key => {
    const field = key as keyof TickerContextState;
    const singleUpdate = { [field]: updates[field] } as Partial<TickerContextState>;
    
    if (compatLayer.validateContextUpdate(singleUpdate, ticker)) {
      safeUpdates[field] = updates[field] as any;
    }
  });
  
  return safeUpdates;
}