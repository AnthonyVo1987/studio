/**
 * @fileOverview Fetch Expirations Service - XState-compatible service wrapper
 * 
 * Wraps existing StockSage expiration fetching functionality into an XState-compatible
 * service with timeout protection, retry logic, and comprehensive error handling.
 */

import { getExpirationDates } from '@/services/data-sources/adapters/polygon-adapter';
import { createTickerLogger } from '@/lib/ticker-logger';
import type {
  MacroServiceOptions,
  MacroServiceResult,
  ExpirationData,
  ServiceError,
  FetchExpirationsService,
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
 * Fetch Expirations Service Implementation
 * 
 * Wraps the existing Polygon API expiration dates fetching functionality
 * with XState-compatible Promise-based interface, timeout protection,
 * retry logic, and comprehensive error handling.
 */
export const createFetchExpirationsService: () => FetchExpirationsService = () => {
  return async (options: MacroServiceOptions): Promise<MacroServiceResult<ExpirationData>> => {
    const {
      ticker,
      executionId,
      timeout = 45000,
      maxRetries = 2,
      enableDebug = false,
      cancellationToken,
    } = options;

    const startTime = Date.now();
    const logger = createTickerLogger(ticker, 'FetchExpirationsService', executionId);
    const serviceContext = {
      serviceName: 'FetchExpirationsService',
      stepId: 1,
      ticker,
      executionId,
      attempt: 0,
    };

    let retryCount = 0;
    let lastError: Error | undefined;

    if (enableDebug) {
      logger.stateValidation('ServiceStart', 'Fetch expirations service starting', {
        ticker,
        executionId,
        timeout,
        maxRetries,
        stepId: 1,
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

        // Execute the expiration fetching operation with timeout protection
        const availableExpirations = await executeWithTimeout(
          () => getExpirationDates(ticker),
          timeout,
          cancellationToken
        );

        // Validate results
        if (!Array.isArray(availableExpirations) || availableExpirations.length === 0) {
          throw createServiceError(
            new Error(`No expiration dates found for ${ticker}`),
            'validation',
            serviceContext
          );
        }

        // Select the first available expiration as default
        const selectedExpiration = availableExpirations[0];
        const endTime = Date.now();
        const duration = endTime - startTime;

        const result: ExpirationData = {
          availableExpirations,
          selectedExpiration,
          autoSelected: true,
          source: 'polygon',
        };

        if (enableDebug) {
          logger.stateValidation('ServiceSuccess', 'Fetch expirations completed successfully', {
            ticker,
            executionId,
            expirationsCount: availableExpirations.length,
            selectedExpiration,
            duration: `${duration}ms`,
            attempt,
            retryCount,
          });
        }

        return {
          success: true,
          data: result,
          duration,
          retryCount,
          stepId: 1,
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
      stepId: 1,
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
export default createFetchExpirationsService;