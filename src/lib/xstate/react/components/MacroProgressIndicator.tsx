/**
 * @fileoverview Macro Progress Indicator React Component
 * 
 * Provides visual progress tracking for macro execution workflows
 * with step-by-step progress, time estimation, and status indicators.
 */

'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import type { MacroProgress, MacroExecutionState } from '../hooks/use-macro-execution';
import type { SupportedTicker } from '@/lib/xstate/actors';
import type { MacroStepId, toStepId } from '@/lib/xstate/types/macro-types';

export interface MacroProgressIndicatorProps {
  /** Current macro execution state */
  executionState: MacroExecutionState;
  /** Display mode */
  mode?: 'compact' | 'detailed' | 'minimal';
  /** Show time information */
  showTiming?: boolean;
  /** Show step details */
  showStepDetails?: boolean;
  /** Enable animations */
  animated?: boolean;
  /** Color theme */
  theme?: 'default' | 'success' | 'warning' | 'error';
  /** Custom styling */
  className?: string;
  /** Show cancel button */
  showCancelButton?: boolean;
  /** Cancel handler */
  onCancel?: () => void;
  /** Step click handler */
  onStepClick?: (step: MacroStepId) => void;
}

// Step configuration
const MACRO_STEPS: Array<{
  id: MacroStepId;
  name: string;
  description: string;
  icon: string;
  estimatedDuration: number;
}> = [
  {
    id: 'fetchExpirations',
    name: 'Fetch Expirations',
    description: 'Getting available option expiration dates',
    icon: '📅',
    estimatedDuration: 5000,
  },
  {
    id: 'getStockData',
    name: 'Get Stock Data',
    description: 'Retrieving current stock data and options chain',
    icon: '📈',
    estimatedDuration: 8000,
  },
  {
    id: 'generateAITakeaways',
    name: 'AI Analysis',  
    description: 'Analyzing data and generating key insights',
    icon: '🤖',
    estimatedDuration: 15000,
  },
  {
    id: 'generateAIOptions',
    name: 'AI Recommendations',
    description: 'Creating options trading recommendations',
    icon: '💡',
    estimatedDuration: 12000,
  },
];

/**
 * Main macro progress indicator component
 */
export function MacroProgressIndicator({
  executionState,
  mode = 'detailed',
  showTiming = true,
  showStepDetails = true,
  animated = true,
  theme = 'default',
  className = '',
  showCancelButton = false,
  onCancel,
  onStepClick,
}: MacroProgressIndicatorProps) {
  const [animationPhase, setAnimationPhase] = useState(0);

  // Animation cycle for active states
  useEffect(() => {
    if (!animated || !executionState.meta.isRunning) return;

    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, [animated, executionState.meta.isRunning]);

  // Theme styling
  const themeClasses = useMemo(() => {
    const themes = {
      default: 'border-gray-200 bg-white',
      success: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50',
    };
    return themes[theme];
  }, [theme]);

  // Progress calculations
  const progressInfo = useMemo(() => {
    const progress = executionState.progress;
    const totalSteps = progress.totalSteps;
    const completedSteps = progress.completedSteps;
    // Safe type validation for current step
    const isValidMacroStep = (step: unknown): step is MacroStepId => {
      const validSteps: MacroStepId[] = ['fetchExpirations', 'getStockData', 'generateAITakeaways', 'generateAIOptions'];
      return typeof step === 'string' && validSteps.includes(step as MacroStepId);
    };
    
    const currentStepName = isValidMacroStep(progress.currentStep) ? progress.currentStep : 'fetchExpirations';
    const currentStepIndex = MACRO_STEPS.findIndex(step => step.id === currentStepName);
    
    return {
      overallProgress: progress.overallProgress,
      stepProgress: progress.stepProgress,
      completedSteps,
      totalSteps,
      currentStepIndex,
      currentStep: MACRO_STEPS[currentStepIndex],
      isComplete: executionState.status === 'completed',
      isError: executionState.status === 'failed',
      isRunning: executionState.meta.isRunning,
    };
  }, [executionState]);

  // Time calculations
  const timeInfo = useMemo(() => {
    const now = Date.now();
    const startTime = executionState.meta.startedAt || now;
    const elapsed = now - startTime;
    
    // Estimate remaining time based on step progress
    const totalEstimatedTime = MACRO_STEPS.reduce((sum, step) => sum + step.estimatedDuration, 0);
    const completedTime = MACRO_STEPS
      .slice(0, progressInfo.completedSteps)
      .reduce((sum, step) => sum + step.estimatedDuration, 0);
    const currentStepElapsed = progressInfo.currentStep 
      ? progressInfo.currentStep.estimatedDuration * progressInfo.stepProgress 
      : 0;
    const estimatedRemaining = Math.max(0, totalEstimatedTime - completedTime - currentStepElapsed);

    return {
      elapsed,
      estimatedRemaining,
      totalEstimated: totalEstimatedTime,
    };
  }, [executionState, progressInfo]);

  const formatTime = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  }, []);

  const renderMinimalView = () => (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${themeClasses} ${className}`}>
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">
            {progressInfo.isComplete ? 'Completed' : 
             progressInfo.isError ? 'Failed' :
             progressInfo.currentStep?.name || 'Processing'}
          </span>
          <span>{Math.round(progressInfo.overallProgress * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progressInfo.isError ? 'bg-red-500' : 
              progressInfo.isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressInfo.overallProgress * 100}%` }}
          />
        </div>
      </div>
      
      {showCancelButton && onCancel && progressInfo.isRunning && (
        <button
          onClick={onCancel}
          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded"
        >
          Cancel
        </button>
      )}
    </div>
  );

  const renderCompactView = () => (
    <div className={`p-4 rounded-lg border ${themeClasses} ${className}`}>
      {/* Header with overall progress */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          Macro Execution - {executionState.meta.ticker}
        </h3>
        {showCancelButton && onCancel && progressInfo.isRunning && (
          <button
            onClick={onCancel}
            className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded border border-red-200"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Overall Progress</span>
          <span>{Math.round(progressInfo.overallProgress * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              progressInfo.isError ? 'bg-red-500' : 
              progressInfo.isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressInfo.overallProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Current step info */}
      {progressInfo.currentStep && progressInfo.isRunning && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
          <div className="text-2xl">
            {progressInfo.currentStep.icon}{animated && <span className="animate-pulse">⚡</span>}
          </div>
          <div className="flex-1">
            <div className="font-medium">{progressInfo.currentStep.name}</div>
            <div className="text-sm text-gray-600">{progressInfo.currentStep.description}</div>
          </div>
        </div>
      )}

      {/* Timing information */}
      {showTiming && (
        <div className="flex justify-between text-sm text-gray-600 mt-3">
          <span>Elapsed: {formatTime(timeInfo.elapsed)}</span>
          {progressInfo.isRunning && (
            <span>Est. remaining: {formatTime(timeInfo.estimatedRemaining)}</span>
          )}
        </div>
      )}
    </div>
  );

  const renderDetailedView = () => (
    <div className={`p-6 rounded-lg border ${themeClasses} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">
            Macro Execution Progress
          </h3>
          <div className="text-sm text-gray-600">
            Ticker: {executionState.meta.ticker} • {executionState.status}
          </div>
        </div>
        {showCancelButton && onCancel && progressInfo.isRunning && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50"
          >
            Cancel Execution
          </button>
        )}
      </div>

      {/* Overall progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Overall Progress</span>
          <span className="text-lg font-semibold">
            {Math.round(progressInfo.overallProgress * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-700 ${
              progressInfo.isError ? 'bg-red-500' : 
              progressInfo.isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressInfo.overallProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Step details */}
      {showStepDetails && (
        <div className="space-y-3 mb-6">
          {MACRO_STEPS.map((step, index) => {
            const isCompleted = index < progressInfo.completedSteps;
            const isCurrent = index === progressInfo.currentStepIndex;
            const isPending = index > progressInfo.currentStepIndex;
            
            let statusColor = 'border-gray-200 bg-gray-50';
            let statusIcon = '⏳';
            
            if (isCompleted) {
              statusColor = 'border-green-200 bg-green-50';
              statusIcon = '✅';
            } else if (isCurrent) {
              statusColor = 'border-blue-200 bg-blue-50';
              statusIcon = animated ? ['⚡', '🔄', '⏳', '🔄'][animationPhase] : '🔄';
            }

            return (
              <div
                key={step.id}
                className={`p-4 rounded-lg border transition-all duration-300 ${statusColor} ${
                  onStepClick ? 'cursor-pointer hover:shadow-md' : ''
                }`}
                onClick={() => onStepClick?.(step.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {step.icon}
                    {isCurrent && <span className="ml-1">{statusIcon}</span>}
                    {isCompleted && <span className="ml-1">✅</span>}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{step.name}</h4>
                      <span className="text-sm text-gray-500">
                        {Math.round(step.estimatedDuration / 1000)}s est.
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    
                    {isCurrent && progressInfo.stepProgress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${progressInfo.stepProgress * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timing and statistics */}
      {showTiming && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">{formatTime(timeInfo.elapsed)}</div>
              <div className="text-sm text-gray-600">Elapsed</div>
            </div>
            {progressInfo.isRunning && (
              <div>
                <div className="text-lg font-semibold">{formatTime(timeInfo.estimatedRemaining)}</div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
            )}
            <div>
              <div className="text-lg font-semibold">
                {progressInfo.completedSteps}/{progressInfo.totalSteps}
              </div>
              <div className="text-sm text-gray-600">Steps</div>
            </div>
          </div>
        </div>
      )}

      {/* Error information */}
      {executionState.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600">⚠️</span>
            <span className="font-medium text-red-800">Execution Error</span>
          </div>
          <div className="text-red-700 text-sm">
            {executionState.error.message}
            {executionState.error.step && (
              <span className="ml-2 text-red-600">
                (Step: {String(executionState.error.step)})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  switch (mode) {
    case 'minimal':
      return renderMinimalView();
    case 'compact':
      return renderCompactView();
    case 'detailed':
    default:
      return renderDetailedView();
  }
}

/**
 * Simple progress bar component
 */
export function MacroProgressBar({
  progress,
  status,
  className = '',
  showPercentage = true,
}: {
  progress: number;
  status: MacroExecutionState['status'];
  className?: string;
  showPercentage?: boolean;
}) {
  const getBarColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-sm font-medium min-w-[3rem] text-right">
          {Math.round(progress * 100)}%
        </span>
      )}
    </div>
  );
}

/**
 * Step status indicator component
 */
export function StepStatusIndicator({
  step,
  status,
  animated = false,
}: {
  step: MacroStepId;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  animated?: boolean;
}) {
  const stepConfig = MACRO_STEPS.find(s => s.id === step);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'executing':
        return animated ? '🔄' : '⚡';
      default:
        return '⏳';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'executing':
        return 'text-blue-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${getStatusColor()}`}>
      <span className={animated && status === 'executing' ? 'animate-spin' : ''}>
        {getStatusIcon()}
      </span>
      <span className="text-sm font-medium">
        {stepConfig?.name || String(step)}
      </span>
    </div>
  );
}

/**
 * Default export
 */
export default MacroProgressIndicator;