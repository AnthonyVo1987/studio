/**
 * @fileoverview XState React Error Boundary Component
 * 
 * Provides specialized error boundary for XState machine failures,
 * actor errors, and macro execution errors with recovery mechanisms.
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import type { SupportedTicker } from '@/lib/xstate/actors';
import { globalLogger } from '@/lib/xstate';

// Error types that can be handled by this boundary
export type XStateErrorType = 
  | 'MACHINE_ERROR'
  | 'ACTOR_ERROR'
  | 'MACRO_EXECUTION_ERROR'
  | 'SERVICE_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

// Enhanced error information
export interface XStateError extends Error {
  type?: XStateErrorType;
  machineId?: string;
  actorId?: string;
  ticker?: SupportedTicker;
  step?: string;
  context?: any;
  originalError?: Error;
  timestamp?: number;
  recoverable?: boolean;
}

// Error boundary state
interface XStateErrorBoundaryState {
  hasError: boolean;
  error: XStateError | null;
  errorId: string;
  retryCount: number;
  isRecovering: boolean;
}

// Error boundary props
export interface XStateErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: (error: XStateError, retry: () => void, reset: () => void) => ReactNode;
  /** Enable automatic recovery for recoverable errors */
  enableAutoRecovery?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Recovery delay in milliseconds */
  recoveryDelay?: number;
  /** Custom error handler */
  onError?: (error: XStateError, errorInfo: ErrorInfo) => void;
  /** Recovery success handler */
  onRecovery?: (error: XStateError) => void;
  /** Error logging handler */
  onLog?: (error: XStateError, errorInfo: ErrorInfo) => void;
  /** Specific error types to handle */
  handleErrorTypes?: XStateErrorType[];
  /** Context information for error reporting */
  contextInfo?: {
    ticker?: SupportedTicker;
    component?: string;
    feature?: string;
  };
}

/**
 * Specialized error boundary for XState integration
 */
export class XStateErrorBoundary extends Component<XStateErrorBoundaryProps, XStateErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: XStateErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<XStateErrorBoundaryState> {
    // Convert error to XStateError format
    const xstateError: XStateError = {
      ...error,
      type: XStateErrorBoundary.classifyError(error),
      timestamp: Date.now(),
      recoverable: XStateErrorBoundary.isRecoverable(error),
    };

    return {
      hasError: true,
      error: xstateError,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const xstateError = this.state.error!;
    
    // Enhanced error logging
    const errorDetails = {
      ...xstateError,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'XStateErrorBoundary',
      contextInfo: this.props.contextInfo,
      props: {
        enableAutoRecovery: this.props.enableAutoRecovery,
        maxRetries: this.props.maxRetries,
        handleErrorTypes: this.props.handleErrorTypes,
      },
    };

    // Use custom log handler or default logging
    if (this.props.onLog) {
      this.props.onLog(xstateError, errorInfo);
    } else {
      console.error('XState Error Boundary caught error:', errorDetails);
    }

    // Call custom error handler
    this.props.onError?.(xstateError, errorInfo);

    // Attempt automatic recovery if enabled
    if (this.props.enableAutoRecovery && xstateError.recoverable) {
      this.attemptRecovery();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  public static classifyError(error: Error): XStateErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Machine-related errors
    if (message.includes('machine') || message.includes('xstate')) {
      return 'MACHINE_ERROR';
    }

    // Actor-related errors
    if (message.includes('actor') || message.includes('service')) {
      return 'ACTOR_ERROR';
    }

    // Macro execution errors
    if (message.includes('macro') || message.includes('execution')) {
      return 'MACRO_EXECUTION_ERROR';
    }

    // Service errors
    if (message.includes('service') || message.includes('api')) {
      return 'SERVICE_ERROR';
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('enotfound')) {
      return 'NETWORK_ERROR';
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('request timeout')) {
      return 'TIMEOUT_ERROR';
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  public static isRecoverable(error: Error): boolean {
    const recoverableTypes: XStateErrorType[] = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVICE_ERROR',
    ];

    const errorType = XStateErrorBoundary.classifyError(error);
    return recoverableTypes.includes(errorType);
  }

  private shouldHandleError(errorType: XStateErrorType): boolean {
    if (!this.props.handleErrorTypes) return true;
    return this.props.handleErrorTypes.includes(errorType);
  }

  private attemptRecovery = () => {
    const { maxRetries = 3, recoveryDelay = 2000 } = this.props;
    const { error, retryCount } = this.state;

    if (!error || retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRecovering: true });

    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        ...prevState,
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
        isRecovering: false,
      }));

      // Call recovery handler
      this.props.onRecovery?.(error);
      
      console.info('XState Error Boundary recovery attempted:', {
        errorType: error.type,
        retryCount: retryCount + 1,
        maxRetries,
      });
    }, recoveryDelay);
  };

  private handleRetry = () => {
    this.setState({ isRecovering: true });
    
    // Small delay to show loading state
    setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: '',
        retryCount: prevState.retryCount + 1,
        isRecovering: false,
      }));
    }, 500);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0,
      isRecovering: false,
    });
  };

  render() {
    const { hasError, error, isRecovering } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Check if we should handle this error type
      if (!this.shouldHandleError(error.type || 'UNKNOWN_ERROR')) {
        throw error; // Re-throw to parent boundary
      }

      // Show recovery state
      if (isRecovering) {
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mb-4"></div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Attempting Recovery...
            </h3>
            <p className="text-yellow-700 text-center">
              Trying to recover from {error.type?.replace('_', ' ').toLowerCase()}
            </p>
          </div>
        );
      }

      // Use custom fallback or default error UI
      if (fallback) {
        return fallback(error, this.handleRetry, this.handleReset);
      }

      return (
        <DefaultErrorFallback
          error={error}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries || 3}
          contextInfo={this.props.contextInfo}
        />
      );
    }

    return children;
  }
}

/**
 * Default error fallback component
 */
interface DefaultErrorFallbackProps {
  error: XStateError;
  onRetry: () => void;
  onReset: () => void;
  retryCount: number;
  maxRetries: number;
  contextInfo?: XStateErrorBoundaryProps['contextInfo'];
}

function DefaultErrorFallback({
  error,
  onRetry,
  onReset,
  retryCount,
  maxRetries,
  contextInfo,
}: DefaultErrorFallbackProps) {
  const canRetry = retryCount < maxRetries && error.recoverable;
  
  const getErrorIcon = (type: XStateErrorType) => {
    switch (type) {
      case 'NETWORK_ERROR':
        return '🌐';
      case 'TIMEOUT_ERROR':
        return '⏱️';
      case 'MACHINE_ERROR':
        return '⚙️';
      case 'ACTOR_ERROR':
        return '🎭';
      case 'MACRO_EXECUTION_ERROR':
        return '🎯';
      case 'SERVICE_ERROR':
        return '🔧';
      case 'VALIDATION_ERROR':
        return '✅';
      default:
        return '❌';
    }
  };

  const getErrorTitle = (type: XStateErrorType) => {
    switch (type) {
      case 'NETWORK_ERROR':
        return 'Network Connection Error';
      case 'TIMEOUT_ERROR':
        return 'Request Timeout';
      case 'MACHINE_ERROR':
        return 'State Machine Error';
      case 'ACTOR_ERROR':
        return 'Actor Management Error';
      case 'MACRO_EXECUTION_ERROR':
        return 'Macro Execution Failed';
      case 'SERVICE_ERROR':
        return 'Service Error';
      case 'VALIDATION_ERROR':
        return 'Validation Error';
      default:
        return 'An Error Occurred';
    }
  };

  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-4xl mb-4">
        {getErrorIcon(error.type || 'UNKNOWN_ERROR')}
      </div>
      
      <h2 className="text-xl font-bold text-red-800 mb-2">
        {getErrorTitle(error.type || 'UNKNOWN_ERROR')}
      </h2>
      
      <p className="text-red-700 text-center mb-6 max-w-md">
        {error.message || 'An unexpected error occurred in the XState system.'}
      </p>

      {contextInfo && (
        <div className="bg-red-100 p-3 rounded mb-4 text-sm">
          <div className="text-red-800 font-medium mb-1">Context:</div>
          {contextInfo.ticker && (
            <div className="text-red-700">Ticker: {contextInfo.ticker}</div>
          )}
          {contextInfo.component && (
            <div className="text-red-700">Component: {contextInfo.component}</div>
          )}
          {contextInfo.feature && (
            <div className="text-red-700">Feature: {contextInfo.feature}</div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {canRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Retry ({maxRetries - retryCount} remaining)
          </button>
        )}
        
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Reset
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 w-full max-w-2xl">
          <summary className="cursor-pointer text-red-600 font-medium mb-2">
            Error Details (Development)
          </summary>
          <pre className="bg-red-100 p-4 rounded text-xs overflow-auto text-red-800">
            {JSON.stringify({
              type: error.type,
              message: error.message,
              stack: error.stack,
              machineId: error.machineId,
              actorId: error.actorId,
              ticker: error.ticker,
              step: error.step,
              timestamp: error.timestamp ? new Date(error.timestamp).toISOString() : undefined,
              recoverable: error.recoverable,
              retryCount,
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * HOC for wrapping components with XState error boundary
 */
export function withXStateErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<XStateErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <XStateErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </XStateErrorBoundary>
    );
  };
}

/**
 * Hook for programmatic error reporting
 */
export function useXStateErrorReporting() {
  const reportError = (error: Error, additionalInfo?: Partial<XStateError>) => {
    const xstateError: XStateError = {
      ...error,
      ...additionalInfo,
      type: additionalInfo?.type || XStateErrorBoundary.classifyError(error),
      timestamp: Date.now(),
      recoverable: additionalInfo?.recoverable ?? XStateErrorBoundary.isRecoverable(error),
    };

    globalLogger.error('Programmatic XState error report:', xstateError);
    
    // This could integrate with error reporting services
    return xstateError;
  };

  return { reportError };
}

/**
 * Default export
 */
export default XStateErrorBoundary;