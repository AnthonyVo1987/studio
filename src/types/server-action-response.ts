/**
 * Server Action Response Types for Unified Logging System
 * v4.4.2.8 - Unified server/client logging implementation
 */

/**
 * Individual server log entry
 */
export interface ServerLogEntry {
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  args: any[];
  stack?: string;
}

/**
 * Extended server action response with optional logs
 */
export interface ServerActionResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  serverLogs?: ServerLogEntry[];
  metadata?: {
    executionTime?: number;
    serverVersion?: string;
  };
}

/**
 * Legacy response type for backward compatibility
 */
export type LegacyServerActionResponse<T = any> = {
  status: 'success' | 'error';
  data?: T;
  error?: string;
};

/**
 * Type guard to check if response includes server logs
 */
export function hasServerLogs<T>(
  response: ServerActionResponse<T> | LegacyServerActionResponse<T>
): response is ServerActionResponse<T> {
  return 'serverLogs' in response && Array.isArray(response.serverLogs);
}