/**
 * Client Log Handler
 * v4.4.2.8 - Processes and displays server logs in the client console
 */
'use client';

import React, { useCallback, useRef } from 'react';
import type { ServerLogEntry } from '@/types/server-action-response';

/**
 * Configuration for client log handling
 */
interface ClientLogConfig {
  enabled?: boolean;
  prefix?: string;
  includeTimestamp?: boolean;
  groupLogs?: boolean;
  collapseGroups?: boolean;
}

/**
 * Default client log configuration
 */
const DEFAULT_CLIENT_CONFIG: Required<ClientLogConfig> = {
  enabled: process.env.NODE_ENV === 'development',
  prefix: '[Server]',
  includeTimestamp: true,
  groupLogs: true,
  collapseGroups: true,
};

/**
 * Format a server log entry for console display
 */
function formatLogEntry(entry: ServerLogEntry, config: Required<ClientLogConfig>): string {
  const parts: string[] = [];
  
  // Add prefix
  if (config.prefix) {
    parts.push(config.prefix);
  }
  
  // Add timestamp
  if (config.includeTimestamp) {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    parts.push(`[${time}]`);
  }
  
  // Add log level indicator
  const levelIndicators = {
    log: '📝',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    debug: '🔍',
  };
  parts.push(levelIndicators[entry.level] || '📝');
  
  return parts.join(' ');
}

/**
 * Process and display server logs in the client console
 */
export function processServerLogs(
  response: any,
  config?: ClientLogConfig
): void {
  const mergedConfig = { ...DEFAULT_CLIENT_CONFIG, ...config };
  
  if (!mergedConfig.enabled) {
    return;
  }
  
  // Check if response has server logs
  if (!response?.serverLogs || !Array.isArray(response.serverLogs)) {
    return;
  }
  
  const logs = response.serverLogs as ServerLogEntry[];
  
  if (logs.length === 0) {
    return;
  }
  
  // Group logs if enabled
  if (mergedConfig.groupLogs) {
    const groupMethod = mergedConfig.collapseGroups ? console.groupCollapsed : console.group;
    groupMethod(`${mergedConfig.prefix} Server Logs (${logs.length} entries)`);
  }
  
  // Process each log entry
  logs.forEach((entry) => {
    const prefix = formatLogEntry(entry, mergedConfig);
    const consoleMethod = console[entry.level] || console.log;
    
    // If it's an error with a stack, handle specially
    if (entry.level === 'error' && entry.stack) {
      consoleMethod(prefix, ...entry.args);
      console.error('Stack trace:', entry.stack);
    } else {
      consoleMethod(prefix, ...entry.args);
    }
  });
  
  // Close group if opened
  if (mergedConfig.groupLogs) {
    console.groupEnd();
  }
  
  // Show metadata if available
  if (response.metadata && mergedConfig.includeTimestamp) {
    console.debug(`${mergedConfig.prefix} Execution time: ${response.metadata.executionTime}ms`);
  }
}

/**
 * React hook for processing server logs
 */
export function useServerLogs(config?: ClientLogConfig) {
  const configRef = useRef<ClientLogConfig | undefined>(config);
  
  // Update config ref without causing re-renders
  React.useLayoutEffect(() => {
    configRef.current = config;
  }, [config]);
  
  const processLogs = useCallback(<T extends any>(
    response: T
  ): T => {
    processServerLogs(response, configRef.current);
    return response;
  }, []);
  
  return { processLogs };
}

/**
 * Higher-order component that automatically processes server logs
 */
export function withServerLogProcessing<P extends object>(
  Component: React.ComponentType<P>,
  config?: ClientLogConfig
): React.ComponentType<P> {
  const WithServerLogProcessing = function WithServerLogProcessing(props: P) {
    const { processLogs } = useServerLogs(config);
    
    // Inject processLogs into props if component accepts it
    const enhancedProps = {
      ...props,
      processServerLogs: processLogs,
    } as P & { processServerLogs: typeof processLogs };
    
    return <Component {...(enhancedProps as P)} />;
  };
  
  WithServerLogProcessing.displayName = `withServerLogProcessing(${Component.displayName || Component.name || 'Component'})`;
  
  return WithServerLogProcessing;
}

/**
 * Utility to create a custom log processor with preset config
 */
export function createLogProcessor(config: ClientLogConfig) {
  return (response: any) => processServerLogs(response, config);
}

/**
 * Development-only log processor
 */
export const devLogProcessor = createLogProcessor({
  enabled: process.env.NODE_ENV === 'development',
});