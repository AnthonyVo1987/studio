/**
 * Server Action Logging Wrapper
 * v4.4.2.8 - Wraps server actions with automatic log capture
 */

import { ServerLogCapture, captureServerLogs } from '@/lib/server-log-capture';
import type { 
  ServerActionResponse, 
  LegacyServerActionResponse,
  ServerLogEntry 
} from '@/types/server-action-response';

/**
 * Configuration for server action wrapper
 */
interface WrapperConfig {
  enabled?: boolean;
  sanitize?: boolean;
  maxLogs?: number;
  includeMetadata?: boolean;
}

/**
 * Default wrapper configuration
 */
const DEFAULT_WRAPPER_CONFIG: Required<WrapperConfig> = {
  enabled: process.env.NODE_ENV === 'development',
  sanitize: true,
  maxLogs: 100,
  includeMetadata: true,
};

/**
 * Type for a server action function, now supporting multiple arguments
 */
type ServerActionFunction<TParams extends any[] = any[], TReturn = any> = (
  ...params: TParams
) => Promise<TReturn>;

/**
 * Type for wrapped server action that preserves response structure and multi-arg support
 */
type WrappedServerAction<TParams extends any[] = any[], TReturn = any> =
  TReturn extends ServerActionResponse<infer TData> 
    ? ServerActionFunction<TParams, ServerActionResponse<TData>>
    : TReturn extends LegacyServerActionResponse<infer TData>
    ? ServerActionFunction<TParams, ServerActionResponse<TData>>
    : ServerActionFunction<TParams, ServerActionResponse<TReturn>>;

/**
 * Higher-order function to wrap server actions with logging
 */
export function withServerLogging<TParams extends any[] = any[], TReturn = any>(
  action: ServerActionFunction<TParams, TReturn>,
  config?: WrapperConfig
): ServerActionFunction<TParams, TReturn> {
  const mergedConfig = { ...DEFAULT_WRAPPER_CONFIG, ...config };

  return async (...params: TParams): Promise<TReturn> => {
    'use server';

    if (!mergedConfig.enabled) {
      return action(...params);
    }

    const startTime = Date.now();
    let result: TReturn;
    let logs: ServerLogEntry[] = [];

    try {
      const captured = await captureServerLogs(async () => action(...params), {
        enabled: mergedConfig.enabled,
        sanitize: mergedConfig.sanitize,
        maxLogs: mergedConfig.maxLogs,
      });
      result = captured.result;
      logs = captured.logs;
    } catch (error) {
      const errorLogs = new ServerLogCapture(mergedConfig).getLogs();
      console.error('[ServerActionWrapper] Action error:', error);
      
      const errorResult = {
        status: 'error' as const,
        error: error instanceof Error ? error.message : String(error),
        serverLogs: errorLogs,
        metadata: mergedConfig.includeMetadata
          ? {
              executionTime: Date.now() - startTime,
              serverVersion: process.env.npm_package_version,
            }
          : undefined,
      };

      // Attempt to cast to TReturn, this might not be perfect but it's the best we can do
      return errorResult as TReturn;
    }

    if (typeof result === 'object' && result !== null) {
      const enhancedResult = { ...result };

      if (isServerActionResponse(enhancedResult)) {
        if ('serverLogs' in enhancedResult) {
          enhancedResult.serverLogs = [...(enhancedResult.serverLogs || []), ...logs];
        }

        if (mergedConfig.includeMetadata && 'metadata' in enhancedResult) {
          const existingMetadata = enhancedResult.metadata || {};
          enhancedResult.metadata = {
            ...existingMetadata,
            executionTime: Date.now() - startTime,
            serverVersion: process.env.npm_package_version,
          };
        }
      }
      return enhancedResult as TReturn;
    }

    return result;
  };
}

/**
 * Type guard to check if value is a server action response
 */
function isServerActionResponse(value: any): value is ServerActionResponse<any> | LegacyServerActionResponse<any> {
  return (
    value &&
    typeof value === 'object' &&
    'status' in value &&
    (value.status === 'success' || value.status === 'error')
  );
}

/**
 * Utility to wrap multiple server actions at once
 */
export function wrapServerActions<T extends Record<string, ServerActionFunction<any[], any>>>(
  actions: T,
  config?: WrapperConfig
): { [K in keyof T]: ServerActionFunction<Parameters<T[K]>, Awaited<ReturnType<T[K]>>> } {
  const wrapped: any = {};
  
  for (const [name, action] of Object.entries(actions)) {
    wrapped[name] = withServerLogging(action, config);
  }
  
  return wrapped;
}

/**
 * Development-only wrapper that preserves production behavior
 */
export function withDevLogging<TParams extends any[] = any[], TReturn = any>(
  action: ServerActionFunction<TParams, TReturn>
): ServerActionFunction<TParams, TReturn> {
  return withServerLogging(action, {
    enabled: process.env.NODE_ENV === 'development',
  });
}