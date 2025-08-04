/**
 * @fileoverview Context Bridge for XState-StockSage Integration
 * 
 * Maps XState context to existing NVDA/SPY contexts (79 fields each).
 * Provides seamless data flow between state machines and React contexts.
 */

import type {
  ContextBridge,
  SupportedTicker,
  TickerContextState,
  TickerContextAction,
  TickerContextHooks,
  ServiceContextMapping,
  BatchUpdateConfig,
} from './integration-types';
import type { NvdaAnalysisState, NvdaAnalysisAction } from '@/contexts/nvda-analysis-context';
// Note: SPY context import will be available when SPY context is fully implemented
// import type { SpyAnalysisState, SpyAnalysisAction } from '@/contexts/spy-analysis-context';
import { createTickerLogger } from '@/lib/ticker-logger';

/**
 * Context Bridge Implementation
 * Provides direct interface to StockSage NVDA/SPY contexts
 */
export class StockSageContextBridge implements ContextBridge {
  private logger;
  private subscribers: Set<(state: TickerContextState) => void>;
  private lastState: TickerContextState | null;

  constructor(
    private ticker: SupportedTicker,
    private contextHooks: TickerContextHooks
  ) {
    this.logger = createTickerLogger(ticker, `${ticker}_CONTEXT_BRIDGE`);
    this.subscribers = new Set();
    this.lastState = null;
  }

  /**
   * Get current context state
   */
  getCurrentState(): TickerContextState {
    try {
      const state = this.contextHooks.useAnalysis();
      this.lastState = state;
      return state;
    } catch (error) {
      this.logger.error('GetCurrentState', 'Failed to get current state', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Dispatch action to context
   */
  dispatch(action: TickerContextAction): void {
    try {
      const dispatch = this.contextHooks.useDispatch();
      dispatch(action);
      
      this.logger.debug('Dispatch', 'Action dispatched', {
        type: (action as any).type,
        hasPayload: 'payload' in action,
      });

      // Notify subscribers of potential state change
      this.notifySubscribers();
    } catch (error) {
      this.logger.error('Dispatch', 'Failed to dispatch action', {
        actionType: (action as any).type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update multiple context fields at once
   */
  batchUpdate(updates: Partial<TickerContextState>): void {
    try {
      const dispatch = this.contextHooks.useDispatch();
      const currentState = this.getCurrentState();

      this.logger.debug('BatchUpdate', 'Starting batch update', {
        fieldsToUpdate: Object.keys(updates).length,
        fields: Object.keys(updates),
      });

      // Apply updates based on field types and patterns
      this.applyBatchUpdates(updates, dispatch, currentState);

      this.logger.info('BatchUpdate', 'Batch update completed', {
        fieldsUpdated: Object.keys(updates).length,
      });

      // Notify subscribers
      this.notifySubscribers();
    } catch (error) {
      this.logger.error('BatchUpdate', 'Batch update failed', {
        error: error instanceof Error ? error.message : String(error),
        fieldsAttempted: Object.keys(updates),
      });
      throw error;
    }
  }

  /**
   * Subscribe to context changes
   */
  subscribe(callback: (state: TickerContextState) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current state if available
    if (this.lastState) {
      try {
        callback(this.lastState);
      } catch (error) {
        this.logger.error('Subscribe', 'Subscriber callback failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get ticker symbol
   */
  getTicker(): SupportedTicker {
    return this.ticker;
  }

  /**
   * Apply batch updates to context
   */
  private applyBatchUpdates(
    updates: Partial<TickerContextState>,
    dispatch: React.Dispatch<TickerContextAction>,
    currentState: TickerContextState
  ): void {
    // Group updates by action type for efficient dispatch
    const groupedUpdates = this.groupUpdatesByActionType(updates, currentState);

    // Apply each group of updates
    for (const [actionType, actionUpdates] of groupedUpdates) {
      try {
        dispatch(actionUpdates as TickerContextAction);
        this.logger.debug('ApplyBatchUpdates', `Applied ${actionType} update`, {
          fieldsInUpdate: Object.keys(actionUpdates.payload || {}).length,
        });
      } catch (error) {
        this.logger.error('ApplyBatchUpdates', `Failed to apply ${actionType} update`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Group updates by appropriate action type
   */
  private groupUpdatesByActionType(
    updates: Partial<TickerContextState>,
    currentState: TickerContextState
  ): Map<string, any> {
    const grouped = new Map<string, any>();

    // Status updates
    if ('status' in updates || 'error' in updates) {
      if (updates.status === 'loading') {
        grouped.set('SET_LOADING', { type: 'SET_LOADING' });
      } else if (updates.status === 'idle') {
        grouped.set('SET_IDLE', { type: 'SET_IDLE' });
      } else if (updates.status === 'error' && updates.error) {
        grouped.set('SET_ERROR', { type: 'SET_ERROR', payload: updates.error });
      }
    }

    // Expiration updates
    const expirationFields = ['availableExpirationDates', 'selectedExpirationDate'];
    const hasExpirationUpdates = expirationFields.some(field => field in updates);
    if (hasExpirationUpdates) {
      if (updates.availableExpirationDates) {
        grouped.set('SET_EXPIRATION_DATES', {
          type: 'SET_EXPIRATION_DATES',
          payload: updates.availableExpirationDates,
        });
      }
      if (updates.selectedExpirationDate) {
        grouped.set('SET_SELECTED_EXPIRATION', {
          type: 'SET_SELECTED_EXPIRATION',
          payload: updates.selectedExpirationDate,
        });
      }
    }

    // Stock data updates
    const stockDataFields = [
      'stockSnapshotJson',
      'marketStatusJson',
      'standardTasJson',
      'aiAnalyzedTaJson',
    ];
    const hasStockDataUpdates = stockDataFields.some(field => field in updates);
    if (hasStockDataUpdates) {
      grouped.set('SET_STOCK_DATA', {
        type: 'SET_STOCK_DATA',
        payload: {
          stockSnapshotJson: updates.stockSnapshotJson || currentState.stockSnapshotJson || '',
          marketStatusJson: updates.marketStatusJson || currentState.marketStatusJson || '',
          standardTasJson: updates.standardTasJson || currentState.standardTasJson || '',
          aiAnalyzedTaJson: updates.aiAnalyzedTaJson || currentState.aiAnalyzedTaJson || '',
        },
      });
    }

    // Options chain updates
    if (updates.optionsChainJson) {
      grouped.set('SET_OPTIONS_CHAIN_DATA', {
        type: 'SET_OPTIONS_CHAIN_DATA',
        payload: updates.optionsChainJson,
      });
    }

    // AI takeaways updates
    if (updates.aiKeyTakeawaysJson) {
      grouped.set('SET_AI_KEY_TAKEAWAYS', {
        type: 'SET_AI_KEY_TAKEAWAYS',
        payload: updates.aiKeyTakeawaysJson,
      });
    }

    if ('isAiKeyTakeawaysLoading' in updates) {
      grouped.set('SET_AI_KEY_TAKEAWAYS_LOADING', {
        type: 'SET_AI_KEY_TAKEAWAYS_LOADING',
        payload: updates.isAiKeyTakeawaysLoading,
      });
    }

    // AI options updates
    if (updates.aiOptionsAnalysisJson) {
      grouped.set('SET_AI_OPTIONS_ANALYSIS', {
        type: 'SET_AI_OPTIONS_ANALYSIS',
        payload: updates.aiOptionsAnalysisJson,
      });
    }

    if ('isAiOptionsAnalysisLoading' in updates) {
      grouped.set('SET_AI_OPTIONS_ANALYSIS_LOADING', {
        type: 'SET_AI_OPTIONS_ANALYSIS_LOADING',
        payload: updates.isAiOptionsAnalysisLoading,
      });
    }

    // Data retrieval complete updates
    if ('dataRetrievalComplete' in updates) {
      grouped.set('SET_DATA_RETRIEVAL_COMPLETE', {
        type: 'SET_DATA_RETRIEVAL_COMPLETE',
        payload: updates.dataRetrievalComplete,
      });
    }

    // Options settings updates
    const optionsSettingsFields = ['optionType', 'strikeCount', 'tableDisplayType'];
    const hasOptionsSettingsUpdates = optionsSettingsFields.some(field => field in updates);
    if (hasOptionsSettingsUpdates) {
      const settingsPayload: any = {};
      if (updates.optionType) settingsPayload.optionType = updates.optionType;
      if (updates.strikeCount) settingsPayload.strikeCount = updates.strikeCount;
      if (updates.tableDisplayType) settingsPayload.tableDisplayType = updates.tableDisplayType;
      
      grouped.set('SET_OPTIONS_SETTINGS', {
        type: 'SET_OPTIONS_SETTINGS',
        payload: settingsPayload,
      });
    }

    return grouped;
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers(): void {
    try {
      const currentState = this.getCurrentState();
      
      // Only notify if state has actually changed
      if (this.hasStateChanged(currentState)) {
        this.subscribers.forEach(callback => {
          try {
            callback(currentState);
          } catch (error) {
            this.logger.error('NotifySubscribers', 'Subscriber callback error', {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });
        this.lastState = currentState;
      }
    } catch (error) {
      this.logger.error('NotifySubscribers', 'Failed to notify subscribers', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if state has changed since last notification
   */
  private hasStateChanged(currentState: TickerContextState): boolean {
    if (!this.lastState) return true;
    
    // Simple shallow comparison for key fields
    const keyFields = [
      'status',
      'stockSnapshotJson',
      'optionsChainJson',
      'aiKeyTakeawaysJson',
      'aiOptionsAnalysisJson',
      'selectedExpirationDate',
      'dataRetrievalComplete',
    ];
    
    return keyFields.some(field => this.lastState![field as keyof TickerContextState] !== currentState[field as keyof TickerContextState]);
  }
}

/**
 * Get context field mapping for a ticker
 */
export function getContextMapping(ticker: SupportedTicker): ServiceContextMapping {
  // Standard mapping that works for both NVDA and SPY contexts
  return {
    expiration: {
      availableExpirations: 'availableExpirationDates' as keyof TickerContextState,
      selectedExpiration: 'selectedExpirationDate' as keyof TickerContextState,
    },
    stockData: {
      stockSnapshotJson: 'stockSnapshotJson' as keyof TickerContextState,
      marketStatusJson: 'marketStatusJson' as keyof TickerContextState,
      standardTasJson: 'standardTasJson' as keyof TickerContextState,
      aiAnalyzedTaJson: 'aiAnalyzedTaJson' as keyof TickerContextState,
      optionsChainJson: 'optionsChainJson' as keyof TickerContextState,
      hasStockData: 'hasStockData' as keyof TickerContextState,
      hasOptionsChainData: 'hasOptionsChainData' as keyof TickerContextState,
    },
    aiTakeaways: {
      aiKeyTakeawaysJson: 'aiKeyTakeawaysJson' as keyof TickerContextState,
      hasAiKeyTakeaways: 'hasAiKeyTakeaways' as keyof TickerContextState,
      isAiKeyTakeawaysLoading: 'isAiKeyTakeawaysLoading' as keyof TickerContextState,
    },
    aiOptions: {
      aiOptionsAnalysisJson: 'aiOptionsAnalysisJson' as keyof TickerContextState,
      hasAiOptionsAnalysis: 'hasAiOptionsAnalysis' as keyof TickerContextState,
      isAiOptionsAnalysisLoading: 'isAiOptionsAnalysisLoading' as keyof TickerContextState,
    },
    general: {
      status: 'status' as keyof TickerContextState,
      error: 'error' as keyof TickerContextState,
      dataRetrievalComplete: 'dataRetrievalComplete' as keyof TickerContextState,
    },
  };
}

/**
 * Factory function to create context bridge
 */
export function createContextBridge(
  ticker: SupportedTicker,
  contextHooks: TickerContextHooks
): ContextBridge {
  return new StockSageContextBridge(ticker, contextHooks);
}

/**
 * Utility function to validate context state
 */
export function validateContextState(
  state: TickerContextState,
  ticker: SupportedTicker,
  requiredFields?: (keyof TickerContextState)[]
): boolean {
  try {
    // Basic validation
    if (!state || typeof state !== 'object') {
      return false;
    }

    // Check required fields if specified
    if (requiredFields) {
      return requiredFields.every(field => field in state);
    }

    // Default validation - check for essential fields
    const essentialFields: (keyof TickerContextState)[] = [
      'status',
      'stockSnapshotJson',
      'optionsChainJson',
    ];

    return essentialFields.every(field => field in state);
  } catch {
    return false;
  }
}

/**
 * Utility function to create safe field updates
 */
export function createSafeUpdates(
  updates: Partial<TickerContextState>,
  currentState: TickerContextState,
  ticker: SupportedTicker
): Partial<TickerContextState> {
  const safeUpdates: Partial<TickerContextState> = {};
  
  // Only include updates for fields that exist in the current state
  Object.keys(updates).forEach(key => {
    const typedKey = key as keyof TickerContextState;
    if (typedKey in currentState) {
      safeUpdates[typedKey] = updates[typedKey] as any;
    }
  });
  
  return safeUpdates;
}