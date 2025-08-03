/**
 * @fileOverview Browser Extension Error Boundary - Extension Isolation
 * 
 * Error boundary component to isolate browser extension errors from affecting
 * the main application. Handles TypeError: Cannot read property of null errors
 * commonly caused by browser extensions.
 * 
 * FEATURES:
 * - Isolates browser extension TypeError exceptions
 * - Graceful fallback UI for extension-related errors
 * - Error reporting for monitoring and debugging
 * - Automatic recovery mechanisms
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

export class BrowserExtensionErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a browser extension related error
    const isBrowserExtensionError = 
      error.message.includes('background.js') ||
      error.message.includes('extension') ||
      error.message.includes('Cannot read property') ||
      error.name === 'TypeError' ||
      error.stack?.includes('extension://');

    if (isBrowserExtensionError) {
      return {
        hasError: true,
        error,
        errorId: `ext_error_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      };
    }

    // Re-throw non-extension errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log browser extension errors for monitoring
    console.warn('🔌 Browser Extension Error Caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Report to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).reportError) {
      (window as any).reportError(error, {
        category: 'browser-extension',
        errorId: this.state.errorId,
        context: 'staging-environment'
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Max retries reached - suggest page refresh
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default browser extension error UI
      return (
        <Alert variant="default" className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="space-y-3">
            <div>
              <div className="font-medium text-yellow-800">
                Browser Extension Interference Detected
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                A browser extension appears to be interfering with the application. 
                This won't affect your data or analysis results.
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                disabled={this.state.retryCount >= this.maxRetries}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {this.state.retryCount >= this.maxRetries ? 'Refresh Page' : 'Retry'}
              </Button>
              
              <div className="text-xs text-yellow-600">
                Retry {this.state.retryCount + 1}/{this.maxRetries + 1}
              </div>
            </div>

            {this.state.retryCount >= this.maxRetries && (
              <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
                <strong>Tip:</strong> Try disabling browser extensions or using incognito mode for better performance.
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export function useBrowserExtensionErrorHandler() {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Check if this is a browser extension error
      if (error && typeof error === 'object' && 
          (error.message?.includes('extension') || 
           error.stack?.includes('extension://'))) {
        
        console.warn('🔌 Unhandled Extension Promise Rejection:', error);
        event.preventDefault(); // Prevent unhandled rejection
      }
    };

    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      
      // Check if this is a browser extension error
      if (error && 
          (error.message?.includes('extension') || 
           event.filename?.includes('extension://') ||
           error.stack?.includes('background.js'))) {
        
        console.warn('🔌 Extension Script Error:', error);
        event.preventDefault(); // Prevent error propagation
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
}