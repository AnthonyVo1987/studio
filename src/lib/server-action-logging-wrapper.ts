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
 * Type for a server action function
 */
type ServerActionFunction<TParams = any, TReturn = any> = (
  params: TParams
) => Promise<TReturn>;

/**
 * Type for wrapped server action that preserves response structure
 */
type WrappedServerAction<TParams = any, TReturn = any> = 
  TReturn extends ServerActionResponse<infer TData> 
    ? ServerActionFunction<TParams, ServerActionResponse<TData>>
    : TReturn extends LegacyServerActionResponse<infer TData>
    ? ServerActionFunction<TParams, ServerActionResponse<TData>>
    : ServerActionFunction<TParams, ServerActionResponse<TReturn>>;

/**
 * Higher-order function to wrap server actions with logging
 */
export function withServerLogging<TParams = any, TReturn = any>(
  action: ServerActionFunction<TParams, TReturn>,
  config?: WrapperConfig
): WrappedServerAction<TParams, TReturn> {
  const mergedConfig = { ...DEFAULT_WRAPPER_CONFIG, ...config };

  return async (params: TParams): Promise<any> => {
    'use server';
    
    // If logging is disabled, just run the action
    if (!mergedConfig.enabled) {
      return action(params);
    }

    const startTime = Date.now();
    
    try {
      // Capture logs during action execution
      const { result, logs } = await captureServerLogs(
        async () => action(params),
        {
          enabled: mergedConfig.enabled,
          sanitize: mergedConfig.sanitize,
          maxLogs: mergedConfig.maxLogs,
        }
      );

      // Handle different response types
      if (isServerActionResponse(result)) {
        // Already a server action response - enhance it
        return {
          ...result,
          serverLogs: logs,
          metadata: mergedConfig.includeMetadata
            ? {
                ...result.metadata,
                executionTime: Date.now() - startTime,
                serverVersion: process.env.npm_package_version,
              }
            : result.metadata,
        };
      } else {
        // Wrap non-standard response
        return {
          status: 'success' as const,
          data: result,
          serverLogs: logs,
          metadata: mergedConfig.includeMetadata
            ? {
                executionTime: Date.now() - startTime,
                serverVersion: process.env.npm_package_version,
              }
            : undefined,
        };
      }
    } catch (error) {
      // Capture any logs before the error
      const errorLogs = new ServerLogCapture(mergedConfig).getLogs();
      
      // Log the error itself
      console.error('[ServerActionWrapper] Action error:', error);
      
      return {
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
    }
  };
}

/**
 * Type guard to check if value is a server action response
 */
function isServerActionResponse(value: any): value is ServerActionResponse | LegacyServerActionResponse {
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
export function wrapServerActions<T extends Record<string, ServerActionFunction>>(
  actions: T,
  config?: WrapperConfig
): { [K in keyof T]: WrappedServerAction<Parameters<T[K]>[0], Awaited<ReturnType<T[K]>>> } {
  const wrapped: any = {};
  
  for (const [name, action] of Object.entries(actions)) {
    wrapped[name] = withServerLogging(action, config);
  }
  
  return wrapped;
}

/**
 * Development-only wrapper that preserves production behavior
 */
export function withDevLogging<TParams = any, TReturn = any>(
  action: ServerActionFunction<TParams, TReturn>
): WrappedServerAction<TParams, TReturn> {
  return withServerLogging(action, {
    enabled: process.env.NODE_ENV === 'development',
  });
}