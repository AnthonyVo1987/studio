/**
 * @fileOverview AI Options Service - XState-compatible service wrapper
 * 
 * Wraps existing StockSage AI options analysis functionality into an XState-compatible
 * service with timeout protection, retry logic, and comprehensive error handling.
 */

import { nvdaConsolidatedChatAction } from '@/actions/nvda-consolidated-chat-action';
import { spyConsolidatedChatAction } from '@/actions/spy-consolidated-chat-action';
import { createTickerLogger } from '@/lib/ticker-logger';
import type {
  MacroServiceOptions,
  MacroServiceResult,
  AIOptionsResult,
  ServiceError,
  AIOptionsService,
} from './service-types';

/**
 * Create a ServiceError with proper classification and context
 */
function createServiceError(
  error: unknown,
  type: ServiceError['type'],
  serviceContext: ServiceError['serviceContext']
): ServiceError {
  const originalError = error instanceof Error ? error : new Error(String(error));
  const serviceError = new Error(originalError.message) as ServiceError;
  
  serviceError.name = 'ServiceError';
  serviceError.type = type;
  serviceError.retryable = type === 'timeout' || type === 'network';
  serviceError.originalError = originalError;
  serviceError.serviceContext = serviceContext;
  
  return serviceError;
}

/**
 * Classify error type based on error message and properties
 */
function classifyError(error: unknown): ServiceError['type'] {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'timeout';
    }
    if (message.includes('enotfound') || message.includes('econnreset') || message.includes('network')) {
      return 'network';
    }
    if (message.includes('api') || message.includes('rate limit') || message.includes('quota')) {
      return 'api';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
  }
  return 'unknown';
}

/**
 * Execute operation with timeout protection
 */
async function executeWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  cancellationToken?: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    let isSettled = false;

    // Handle cancellation
    const handleCancellation = () => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timeoutId);
        reject(new Error('Operation was cancelled'));
      }
    };

    if (cancellationToken?.aborted) {
      handleCancellation();
      return;
    }

    cancellationToken?.addEventListener('abort', handleCancellation);

    // Set up timeout
    timeoutId = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        cancellationToken?.removeEventListener('abort', handleCancellation);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    // Execute operation
    operation()
      .then((result) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeoutId);
          cancellationToken?.removeEventListener('abort', handleCancellation);
          resolve(result);
        }
      })
      .catch((error) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeoutId);
          cancellationToken?.removeEventListener('abort', handleCancellation);
          reject(error);
        }
      });
  });
}

/**
 * Get appropriate chat action for ticker
 */
function getChatActionForTicker(ticker: string) {
  const normalizedTicker = ticker.toUpperCase();
  switch (normalizedTicker) {
    case 'NVDA':
      return nvdaConsolidatedChatAction;
    case 'SPY':
      return spyConsolidatedChatAction;
    default:
      // Default to NVDA action for unknown tickers
      return nvdaConsolidatedChatAction;
  }
}

/**
 * Build context data for AI analysis including previous AI results
 */
interface ContextData {
  stockSnapshotJson?: string;
  marketStatusJson?: string;
  technicalIndicatorsJson?: string;
  optionsChainJson?: string;
  aiKeyTakeawaysJson?: string;
}

function buildAIContextFromResults(stockDataResult?: any, aiTakeawaysResult?: any): ContextData {
  const context: ContextData = {};

  // Add stock data context
  if (stockDataResult?.data) {
    const { data } = stockDataResult;
    context.stockSnapshotJson = data.stockSnapshotJson || '';
    context.marketStatusJson = data.marketStatusJson || '';
    context.technicalIndicatorsJson = data.technicalIndicatorsJson || '';
    context.optionsChainJson = data.optionsChainJson || '';
  }

  // Add AI takeaways context
  if (aiTakeawaysResult?.data?.aiKeyTakeawaysJson) {
    context.aiKeyTakeawaysJson = aiTakeawaysResult.data.aiKeyTakeawaysJson;
  }

  return context;
}

/**
 * Estimate number of strategies from AI response
 */
function estimateStrategiesCount(responseText: string): number {
  try {
    // Look for common strategy indicators
    const strategyKeywords = [
      'strategy', 'trade', 'call', 'put', 'spread', 'straddle', 'strangle',
      'iron condor', 'butterfly', 'collar', 'covered', 'protective'
    ];
    
    let count = 0;
    const lowerText = responseText.toLowerCase();
    
    // Count occurrences of strategy-related terms
    for (const keyword of strategyKeywords) {
      const matches = lowerText.match(new RegExp(keyword, 'g'));
      if (matches) {
        count += matches.length;
      }
    }
    
    // Return a reasonable estimate (minimum 1, maximum 10)
    return Math.max(1, Math.min(Math.ceil(count / 3), 10));
  } catch {
    return 1; // Default fallback
  }
}

/**
 * AI Options Service Implementation
 * 
 * Wraps the existing Google Genkit AI options analysis functionality
 * with XState-compatible Promise-based interface, timeout protection,
 * retry logic, and comprehensive error handling.
 */
export const createAIOptionsService: () => AIOptionsService = () => {
  return async (options: MacroServiceOptions & { stockDataResult?: any; aiTakeawaysResult?: any }): Promise<MacroServiceResult<AIOptionsResult>> => {
    const {
      ticker,
      executionId,
      timeout = 45000,
      maxRetries = 2,
      enableDebug = false,
      cancellationToken,
      stockDataResult,
      aiTakeawaysResult,
    } = options as any;

    const startTime = Date.now();
    const logger = createTickerLogger(ticker, 'AIOptionsService', executionId);
    const serviceContext = {
      serviceName: 'AIOptionsService',
      stepId: 4,
      ticker,
      executionId,
      attempt: 0,
    };

    let retryCount = 0;
    let lastError: Error | undefined;

    if (enableDebug) {
      logger.stateValidation('ServiceStart', 'AI options service starting', {
        ticker,
        executionId,
        timeout,
        maxRetries,
        stepId: 4,
        hasStockData: !!stockDataResult,
        hasAITakeaways: !!aiTakeawaysResult,
      });
    }

    // Retry loop with exponential backoff
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      serviceContext.attempt = attempt;
      retryCount = attempt - 1;

      try {
        if (enableDebug) {
          logger.stateValidation('ServiceAttempt', `Attempt ${attempt}/${maxRetries + 1}`, {
            ticker,
            executionId,
            attempt,
            retryCount,
          });
        }

        // Check for cancellation before starting
        if (cancellationToken?.aborted) {
          throw createServiceError(
            new Error('Operation was cancelled before execution'),
            'cancellation',
            serviceContext
          );
        }

        // Get appropriate chat action for the ticker
        const chatAction = getChatActionForTicker(ticker);

        // Build comprehensive context data from both stock data and AI takeaways
        const contextData = buildAIContextFromResults(stockDataResult, aiTakeawaysResult);

        // Prepare AI chat input payload for options analysis
        const chatInput = {
          ticker,
          promptName: 'options-trader-takeaways',
          userInput: `Generate comprehensive options trading strategies and analysis for ${ticker}`,
          webSearchEnabled: false,
          ...contextData,
        };

        // Execute the AI options analysis operation with timeout protection
        const initialState = { status: 'idle' as const };
        
        const aiResponse = await executeWithTimeout(
          () => chatAction(initialState, chatInput),
          timeout,
          cancellationToken
        );

        // Validate AI response
        if (!aiResponse || aiResponse.status !== 'success') {
          const errorMessage = aiResponse?.error || aiResponse?.message || 'AI options analysis failed';
          throw createServiceError(
            new Error(`AI options analysis generation failed: ${errorMessage}`),
            'api',
            serviceContext
          );
        }

        // Extract and validate response data
        if (!aiResponse.data?.responseJson) {
          throw createServiceError(
            new Error('AI response missing expected data structure'),
            'validation',
            serviceContext
          );
        }

        const endTime = Date.now();
        const duration = endTime - startTime;
        const processingTime = duration;

        // Parse the response to estimate token count and strategies
        let tokenCount: number | undefined;
        let strategiesGenerated = 1;
        
        try {
          const responseData = JSON.parse(aiResponse.data.responseJson);
          const responseText = responseData.response || '';
          
          // Rough token estimation: ~4 characters per token
          tokenCount = Math.ceil(responseText.length / 4);
          
          // Estimate number of strategies generated
          strategiesGenerated = estimateStrategiesCount(responseText);
        } catch {
          // Estimation failed, continue with defaults
        }

        const result: AIOptionsResult = {
          aiOptionsAnalysisJson: aiResponse.data.responseJson,
          promptUsed: 'options-trader-takeaways',
          processingTime,
          tokenCount,
          modelUsed: 'gemini-2.5-flash-lite',
          strategiesGenerated,
        };

        if (enableDebug) {
          logger.stateValidation('ServiceSuccess', 'AI options analysis completed successfully', {
            ticker,
            executionId,
            duration: `${duration}ms`,
            attempt,
            retryCount,
            tokenCount,
            strategiesGenerated,
            responseSize: aiResponse.data.responseJson.length,
          });
        }

        return {
          success: true,
          data: result,
          duration,
          retryCount,
          stepId: 4,
          metrics: {
            startTime,
            endTime,
            processTime: processingTime,
          },
          metadata: {
            wasRetried: retryCount > 0,
          },
        };

      } catch (error) {
        const errorType = classifyError(error);
        const serviceError = error instanceof Error && 'type' in error 
          ? error as ServiceError
          : createServiceError(error, errorType, serviceContext);

        lastError = serviceError;

        const endTime = Date.now();
        const duration = endTime - startTime;

        if (enableDebug) {
          logger.error('ServiceAttemptFailed', `Attempt ${attempt} failed`, {
            ticker,
            executionId,
            attempt,
            errorMessage: serviceError.message,
            errorType: serviceError.type,
            retryable: serviceError.retryable,
            duration: `${duration}ms`,
          });
        }

        // Don't retry if not the last attempt and error is retryable
        if (attempt <= maxRetries && serviceError.retryable && !cancellationToken?.aborted) {
          const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          
          if (enableDebug) {
            logger.stateValidation('ServiceRetry', `Retrying in ${backoffTime}ms`, {
              ticker,
              executionId,
              attempt,
              nextAttempt: attempt + 1,
              backoffTime: `${backoffTime}ms`,
            });
          }

          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }

        // Final failure
        break;
      }
    }

    // All attempts failed
    const endTime = Date.now();
    const duration = endTime - startTime;
    const finalError = lastError || new Error('Unknown error occurred');

    if (enableDebug) {
      logger.error('ServiceFailed', 'All retry attempts exhausted', {
        ticker,
        executionId,
        totalAttempts: maxRetries + 1,
        totalDuration: `${duration}ms`,
        finalError: finalError.message,
        errorType: (finalError as ServiceError).type || 'unknown',
      });
    }

    return {
      success: false,
      error: finalError,
      duration,
      retryCount,
      stepId: 4,
      metrics: {
        startTime,
        endTime,
        processTime: duration,
      },
      metadata: {
        wasTimeout: finalError.message.includes('timeout'),
        wasCancelled: cancellationToken?.aborted || false,
        wasRetried: retryCount > 0,
        originalError: finalError.message,
      },
    };
  };
};

/**
 * Default export of the service creator
 */
export default createAIOptionsService;