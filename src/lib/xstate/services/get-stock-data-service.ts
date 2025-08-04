/**
 * @fileOverview Get Stock Data Service - XState-compatible service wrapper
 * 
 * Wraps existing StockSage stock data fetching functionality into an XState-compatible
 * service with timeout protection, retry logic, and comprehensive error handling.
 */

import { getFullStockData } from '@/services/data-sources/adapters/polygon-adapter';
import { createTickerLogger } from '@/lib/ticker-logger';
import type {
  MacroServiceOptions,
  MacroServiceResult,
  StockDataResult,
  ServiceError,
  GetStockDataService,
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
 * Extract current stock price from stock data response
 */
function extractCurrentPrice(stockDataPackage: any): number {
  try {
    // Try multiple sources for current price
    if (stockDataPackage.stockSnapshot?.currentPrice) {
      return stockDataPackage.stockSnapshot.currentPrice;
    }
    if (stockDataPackage.stockSnapshot?.day?.c) {
      return stockDataPackage.stockSnapshot.day.c;
    }
    if (stockDataPackage.stockSnapshot?.prevDay?.c) {
      return stockDataPackage.stockSnapshot.prevDay.c;
    }
    throw new Error('Unable to extract current price from stock data');
  } catch (error) {
    throw new Error(`Price extraction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get Stock Data Service Implementation
 * 
 * Wraps the existing Polygon API stock data fetching functionality
 * with XState-compatible Promise-based interface, timeout protection,
 * retry logic, and comprehensive error handling.
 */
export const createGetStockDataService: () => GetStockDataService = () => {
  return async (options: MacroServiceOptions): Promise<MacroServiceResult<StockDataResult>> => {
    const {
      ticker,
      executionId,
      macroExpiration,
      timeout = 45000,
      maxRetries = 2,
      enableDebug = false,
      cancellationToken,
    } = options;

    const startTime = Date.now();
    const logger = createTickerLogger(ticker, 'GetStockDataService', executionId);
    const serviceContext = {
      serviceName: 'GetStockDataService',
      stepId: 2,
      ticker,
      executionId,
      attempt: 0,
    };

    let retryCount = 0;
    let lastError: Error | undefined;

    if (enableDebug) {
      logger.stateValidation('ServiceStart', 'Stock data service starting', {
        ticker,
        executionId,
        macroExpiration,
        timeout,
        maxRetries,
        stepId: 2,
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
            macroExpiration,
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

        // Prepare options for stock data fetch
        const fetchOptions = macroExpiration ? { expirationDate: macroExpiration } : undefined;

        // Execute the stock data operation with timeout protection
        const stockDataResponse = await executeWithTimeout(
          () => getFullStockData(ticker, fetchOptions),
          timeout,
          cancellationToken
        );

        // Validate response structure
        if (!stockDataResponse || !stockDataResponse.stockData) {
          throw createServiceError(
            new Error(`Invalid stock data response structure for ${ticker}`),
            'validation',
            serviceContext
          );
        }

        const { stockData } = stockDataResponse;

        // Check for errors in the response
        if (stockData.error) {
          throw createServiceError(
            new Error(`Stock data fetch error: ${stockData.error}`),
            'api',
            serviceContext
          );
        }

        // Extract and validate current price
        const currentPrice = extractCurrentPrice(stockData);

        // Convert data to JSON strings for compatibility with existing system
        const stockSnapshotJson = JSON.stringify(stockData.stockSnapshot || {});
        const marketStatusJson = JSON.stringify(stockData.marketStatus || {});
        const technicalIndicatorsJson = JSON.stringify(stockData.technicalIndicators || {});
        const optionsChainJson = JSON.stringify(stockData.optionsChain || {});

        const endTime = Date.now();
        const duration = endTime - startTime;
        const fetchTimestamp = Date.now();

        const result: StockDataResult = {
          stockSnapshotJson,
          marketStatusJson,
          technicalIndicatorsJson,
          optionsChainJson,
          currentPrice,
          dataSource: 'polygon',
          fetchTimestamp,
        };

        if (enableDebug) {
          logger.stateValidation('ServiceSuccess', 'Stock data fetch completed successfully', {
            ticker,
            executionId,
            currentPrice,
            duration: `${duration}ms`,
            attempt,
            retryCount,
            macroExpiration,
            dataSize: {
              stockSnapshot: stockSnapshotJson.length,
              marketStatus: marketStatusJson.length,
              technicalIndicators: technicalIndicatorsJson.length,
              optionsChain: optionsChainJson.length,
            },
          });
        }

        return {
          success: true,
          data: result,
          duration,
          retryCount,
          stepId: 2,
          metrics: {
            startTime,
            endTime,
            networkLatency: duration,
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
            macroExpiration,
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
        macroExpiration,
      });
    }

    return {
      success: false,
      error: finalError,
      duration,
      retryCount,
      stepId: 2,
      metrics: {
        startTime,
        endTime,
        networkLatency: duration,
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
export default createGetStockDataService;