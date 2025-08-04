/**
 * React Error Boundary with Advanced Error Handling
 * 
 * Comprehensive React error boundary component with automatic error classification,
 * recovery attempts, and integration with the advanced error handling system.
 */

'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, RefreshCw, Bug, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

import type {
  ErrorBoundaryState,
  ErrorBoundaryConfig,
  ErrorBoundaryFallbackProps,
  ClassifiedError,
  RecoveryPlan,
  RecoveryResult
} from './error-types';

import { globalErrorClassifier, createErrorContext } from './error-classifier';
import { globalRecoveryManager } from './recovery-strategies';

// ================================
// ERROR BOUNDARY PROPS
// ================================

interface ErrorBoundaryProps {
  children: ReactNode;
  config?: Partial<ErrorBoundaryConfig>;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRecovery?: (error: Error) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolateError?: boolean;
}

// ================================
// DEFAULT FALLBACK COMPONENT
// ================================

const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  errorInfo,
  classifiedError,
  recoveryPlan,
  onRetry,
  onReset,
  canRetry
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = React.useState(false);

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'network': return '🌐';
      case 'ai_service': return '🤖';
      case 'timeout': return '⏱️';
      case 'data_validation': return '📊';
      case 'business_logic': return '💼';
      case 'ui_render': return '🎨';
      case 'authentication': return '🔐';
      case 'rate_limit': return '🚦';
      case 'system': return '⚙️';
      default: return '❓';
    }
  };

  const getUserFriendlyMessage = (classifiedError?: ClassifiedError): string => {
    if (!classifiedError) {
      return 'An unexpected error occurred. Please try refreshing the page.';
    }

    const categoryMessages: Record<string, string> = {
      network: 'Network connection issue detected. Please check your internet connection and try again.',
      ai_service: 'AI service is temporarily unavailable. Some features may be limited.',
      timeout: 'The request took too long to complete. Please try again.',
      data_validation: 'There was an issue with the data format. Please refresh and try again.',
      business_logic: 'A system logic error occurred. The development team has been notified.',
      ui_render: 'Display error encountered. Please refresh the page.',
      authentication: 'Authentication error. Please check your credentials.',
      rate_limit: 'Rate limit exceeded. Please wait a moment and try again.',
      system: 'System error encountered. Please contact support if this persists.',
      unknown: 'An unexpected error occurred. Please try again.'
    };

    return categoryMessages[classifiedError.category] || categoryMessages.unknown;
  };

  const getRecoveryInstructions = (recoveryPlan?: RecoveryPlan): string[] => {
    if (!recoveryPlan || recoveryPlan.actions.length === 0) {
      return [
        'Refresh the page to reload the application',
        'Check your internet connection',
        'Try again in a few moments',
        'Contact support if the problem persists'
      ];
    }

    return recoveryPlan.actions.map(action => {
      switch (action.strategy) {
        case 'retry':
          return 'The system will automatically retry the operation';
        case 'circuit_breaker':
          return 'Service protection has been activated';
        case 'fallback':
          return 'Fallback data is being used temporarily';
        case 'graceful_degradation':
          return 'Some features may be temporarily disabled';
        case 'compensation':
          return 'Changes are being rolled back';
        case 'user_intervention':
          return 'Manual action may be required';
        default:
          return action.description;
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            {getUserFriendlyMessage(classifiedError)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Classification */}          
          {classifiedError && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl" role="img" aria-label="Category">
                {getCategoryIcon(classifiedError.category)}
              </span>
              <Badge className={getSeverityColor(classifiedError.severity)}>
                {classifiedError.severity.toUpperCase()} SEVERITY
              </Badge>
              <Badge variant="outline">
                {classifiedError.category.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Recovery Plan */}
          {recoveryPlan && (
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Recovery Actions</AlertTitle>
              <AlertDescription className="mt-2">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {getRecoveryInstructions(recoveryPlan).map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {canRetry && (
              <Button 
                onClick={onRetry} 
                className="flex items-center gap-2"
                variant="default"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button 
              onClick={onReset} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Application
            </Button>
          </div>

          {/* Expandable Details */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>

            {showDetails && (
              <div className="space-y-3 text-sm">
                <Separator />
                
                {/* Error Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Error Information</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p><strong>Message:</strong> {error.message}</p>
                    <p><strong>Type:</strong> {error.name}</p>
                    {classifiedError && (
                      <>
                        <p><strong>Category:</strong> {classifiedError.category}</p>
                        <p><strong>Severity:</strong> {classifiedError.severity}</p>
                        <p><strong>Retryable:</strong> {classifiedError.isRetryable ? 'Yes' : 'No'}</p>
                        <p><strong>Confidence:</strong> {(classifiedError.classification.confidence * 100).toFixed(1)}%</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Recovery Plan Details */}
                {recoveryPlan && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recovery Plan</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p><strong>Strategy:</strong> {recoveryPlan.description}</p>
                      <p><strong>Confidence:</strong> {(recoveryPlan.confidence * 100).toFixed(1)}%</p>
                      <p><strong>Estimated Duration:</strong> {recoveryPlan.estimatedDuration}ms</p>
                      <p><strong>Actions:</strong> {recoveryPlan.actions.length}</p>
                    </div>
                  </div>
                )}

                {/* Technical Details */}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="flex items-center gap-2 text-xs text-gray-500"
                  >
                    <Bug className="h-3 w-3" />
                    {showTechnicalDetails ? 'Hide Technical Details' : 'Show Technical Details'}
                  </Button>

                  {showTechnicalDetails && (
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-md mt-2 font-mono text-xs overflow-auto max-h-40">
                      <pre>{error.stack}</pre>
                      {errorInfo.componentStack && (
                        <>
                          <div className="mt-2 text-gray-400">Component Stack:</div>
                          <pre>{errorInfo.componentStack}</pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ================================
// ERROR BOUNDARY COMPONENT
// ================================

/**
 * Advanced React Error Boundary with automatic error classification and recovery
 */
export class AdvancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private config: ErrorBoundaryConfig;
  private previousResetKeys: Array<string | number>;
  private recoveryAttemptTimeout?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.config = {
      fallbackComponent: props.fallback || DefaultErrorFallback,
      enableRecovery: true,
      maxRecoveryAttempts: 3,
      autoRecoveryDelay: 5000,
      reportErrors: true,
      onError: props.onError,
      onRecovery: props.onRecovery,
      ...props.config
    };

    this.previousResetKeys = props.resetKeys || [];

    this.state = {
      hasError: false,
      recoveryAttempts: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.handleError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Auto-reset on props change if enabled
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
      return;
    }

    // Reset if resetKeys changed
    if (hasError && resetKeys && prevProps.resetKeys !== resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => this.previousResetKeys[index] !== key
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
        return;
      }
    }

    this.previousResetKeys = resetKeys || [];
  }

  componentWillUnmount() {
    if (this.recoveryAttemptTimeout) {
      clearTimeout(this.recoveryAttemptTimeout);
    }
  }

  private async handleError(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    try {
      // Create error context
      const errorContext = createErrorContext({
        component: 'error-boundary',
        operation: 'component-render',
        metadata: {
          componentStack: errorInfo.componentStack,
          isolateError: this.props.isolateError,
          resetKeys: this.props.resetKeys
        }
      });

      // Classify the error
      const classifiedError = globalErrorClassifier.createClassifiedError(error, errorContext);
      
      // Create recovery plan
      const recoveryPlan = globalRecoveryManager.createRecoveryPlan(classifiedError);

      // Update state with classified error and recovery plan
      this.setState({
        error,
        errorInfo,
        errorId: classifiedError.id,
        classifiedError,
        recoveryPlan
      });

      // Report error if enabled
      if (this.config.reportErrors) {
        this.reportError(classifiedError, errorInfo);
      }

      // Call onError callback
      this.config.onError?.(error, errorInfo);

      // Attempt automatic recovery if enabled
      if (this.config.enableRecovery && this.canAttemptRecovery()) {
        this.scheduleRecoveryAttempt(classifiedError, errorContext);
      }

    } catch (handlingError) {
      console.error('[ErrorBoundary] Error in error handling:', handlingError);
      
      // Fallback state if error handling fails
      this.setState({
        error,
        errorInfo,
        errorId: `fallback-${Date.now()}`,
        recoveryAttempts: this.state.recoveryAttempts
      });
    }
  }

  private canAttemptRecovery(): boolean {
    return this.state.recoveryAttempts < this.config.maxRecoveryAttempts &&
           this.state.classifiedError?.isRetryable === true;
  }

  private scheduleRecoveryAttempt(classifiedError: ClassifiedError, context: ErrorContext) {
    if (this.recoveryAttemptTimeout) {
      clearTimeout(this.recoveryAttemptTimeout);
    }

    console.log(`[ErrorBoundary] Scheduling recovery attempt in ${this.config.autoRecoveryDelay}ms`);

    this.recoveryAttemptTimeout = setTimeout(async () => {
      await this.attemptRecovery(classifiedError, context);
    }, this.config.autoRecoveryDelay);
  }

  private async attemptRecovery(classifiedError: ClassifiedError, context: ErrorContext) {
    const attemptNumber = this.state.recoveryAttempts + 1;
    
    console.log(`[ErrorBoundary] Attempting recovery ${attemptNumber}/${this.config.maxRecoveryAttempts}`);

    try {
      // Execute recovery plan
      const recoveryResult = await globalRecoveryManager.executeRecoveryPlan(
        classifiedError,
        {
          ...context,
          metadata: {
            ...context.metadata,
            recoveryAttempt: attemptNumber,
            lastRecoveryTime: this.state.lastRecoveryTime
          }
        }
      );

      if (recoveryResult.success) {
        console.log(`[ErrorBoundary] Recovery successful with strategy: ${recoveryResult.strategy}`);
        
        // Reset error boundary on successful recovery
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          errorId: undefined,
          classifiedError: undefined,
          recoveryPlan: undefined,
          recoveryAttempts: 0,
          lastRecoveryTime: Date.now()
        });

        // Call onRecovery callback
        this.config.onRecovery?.(classifiedError);

      } else {
        console.warn(`[ErrorBoundary] Recovery attempt ${attemptNumber} failed:`, recoveryResult.error?.message);
        
        // Update recovery attempts
        this.setState({
          recoveryAttempts: attemptNumber,
          lastRecoveryTime: Date.now()
        });

        // Schedule next attempt if we haven't exhausted our attempts
        if (this.canAttemptRecovery()) {
          this.scheduleRecoveryAttempt(classifiedError, context);
        }
      }

    } catch (recoveryError) {
      console.error(`[ErrorBoundary] Recovery attempt ${attemptNumber} threw error:`, recoveryError);
      
      this.setState({
        recoveryAttempts: attemptNumber,
        lastRecoveryTime: Date.now()
      });
    }
  }

  private reportError(classifiedError: ClassifiedError, errorInfo: ErrorInfo) {
    // In a real implementation, this would send error reports to a monitoring service
    const errorReport = {
      id: classifiedError.id,
      timestamp: Date.now(),
      error: {
        message: classifiedError.message,
        name: classifiedError.name,
        stack: classifiedError.stack
      },
      classification: classifiedError.classification,
      context: classifiedError.context,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('[ErrorBoundary] Error report:', errorReport);
    
    // Here you would send to your error reporting service
    // Example: Sentry, LogRocket, Bugsnag, etc.
  }

  private resetErrorBoundary = () => {
    if (this.recoveryAttemptTimeout) {
      clearTimeout(this.recoveryAttemptTimeout);
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      classifiedError: undefined,
      recoveryPlan: undefined,
      recoveryAttempts: 0,
      lastRecoveryTime: undefined
    });

    console.log('[ErrorBoundary] Error boundary reset');
  };

  private retryOperation = async () => {
    const { classifiedError } = this.state;
    
    if (!classifiedError) {
      this.resetErrorBoundary();
      return;
    }

    console.log('[ErrorBoundary] Manual retry requested');

    // If we have an original operation in context, try to retry it
    const originalOperation = (classifiedError.context.metadata as any)?.originalOperation;
    
    if (originalOperation && typeof originalOperation === 'function') {
      try {
        await originalOperation();
        this.resetErrorBoundary();
        this.config.onRecovery?.(classifiedError);
      } catch (retryError) {
        console.error('[ErrorBoundary] Manual retry failed:', retryError);
        // Update the error state with the new error
        this.handleError(retryError as Error, this.state.errorInfo!);
      }
    } else {
      // If no original operation, just reset the boundary
      this.resetErrorBoundary();
    }
  };

  render() {
    const { hasError, error, errorInfo, classifiedError, recoveryPlan } = this.state;
    const { children } = this.props;

    if (hasError && error && errorInfo) {
      const FallbackComponent = this.config.fallbackComponent!;
      
      return (
        <FallbackComponent
          error={error}
          errorInfo={errorInfo}
          classifiedError={classifiedError}
          recoveryPlan={recoveryPlan}
          onRetry={this.retryOperation}
          onReset={this.resetErrorBoundary}
          canRetry={classifiedError?.isRetryable === true}
        />
      );
    }

    return children;
  }
}

// ================================
// UTILITY COMPONENTS
// ================================

/**
 * Higher-order component for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) => {
  const WrappedComponent = (props: P) => (
    <AdvancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AdvancedErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Hook for using error boundary context (would need React Context implementation)
 */
export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: { componentStack?: string }) => {
    // Manually trigger error boundary
    throw error;
  }, []);
};

// ================================
// EXPORTS
// ================================

export default AdvancedErrorBoundary;
export { DefaultErrorFallback };
export type { ErrorBoundaryProps, ErrorBoundaryFallbackProps };