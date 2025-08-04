/**
 * @fileoverview State Machine Visualizer React Component
 * 
 * Provides visual representation of XState machine states, transitions,
 * and execution flows with interactive controls and real-time updates.
 */

'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useStateVisualization, useMacroVisualization } from '../hooks/use-state-visualization';
import type { XStateMachineResult } from '../hooks/use-xstate-machine';
import type { StateVisualizationData, MacroVisualizationData, VisualizationConfig } from '../hooks/use-state-visualization';
import type { SupportedTicker } from '@/lib/xstate/actors';
import type { MacroStep } from '@/lib/xstate';

// Component configuration
export interface StateMachineVisualizerProps {
  /** Machine result from useXStateMachine */
  machineResult: XStateMachineResult<any>;
  /** Visualization configuration */
  config?: VisualizationConfig;
  /** Display mode */
  mode?: 'compact' | 'detailed' | 'flow';
  /** Enable interactive controls */
  interactive?: boolean;
  /** Show transition history */
  showHistory?: boolean;
  /** Maximum history entries to display */
  maxHistoryEntries?: number;
  /** Enable real-time updates */
  realTimeUpdates?: boolean;
  /** Custom styling */
  className?: string;
  /** Theme */
  theme?: 'light' | 'dark' | 'auto';
}

// Macro-specific visualizer props
export interface MacroVisualizerProps extends Omit<StateMachineVisualizerProps, 'machineResult'> {
  /** Machine result from useMacroExecutionMachine */
  machineResult: XStateMachineResult<any>;
  /** Ticker for context */
  ticker: SupportedTicker;
  /** Show step progress */
  showStepProgress?: boolean;
  /** Show workflow diagram */
  showWorkflow?: boolean;
}

/**
 * Core state machine visualizer component
 */
export function StateMachineVisualizer({
  machineResult,
  config,
  mode = 'detailed',
  interactive = true,
  showHistory = true,
  maxHistoryEntries = 20,
  realTimeUpdates = true,
  className = '',
  theme = 'auto',
}: StateMachineVisualizerProps) {
  const visualization = useStateVisualization(machineResult, config);
  const [selectedTransition, setSelectedTransition] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-refresh for real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      // Force re-render by updating a timestamp
      // The visualization hook will automatically track state changes
    }, config?.updateFrequency || 100);

    return () => clearInterval(interval);
  }, [realTimeUpdates, config?.updateFrequency]);

  // Get theme classes
  const themeClasses = useMemo(() => {
    const baseClasses = 'rounded-lg border';
    
    if (theme === 'dark') {
      return `${baseClasses} bg-gray-900 border-gray-700 text-white`;
    } else if (theme === 'light') {
      return `${baseClasses} bg-white border-gray-200 text-gray-900`;
    } else {
      return `${baseClasses} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white`;
    }
  }, [theme]);

  const renderCompactView = () => (
    <div className={`p-4 ${themeClasses} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">
          State Machine: {visualization.data.meta.machineId}
        </h3>
        {interactive && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: visualization.utils.getStateColor(visualization.data.currentState) }}
          />
          <span className="font-medium">
            {visualization.utils.formatState(visualization.data.currentState)}
          </span>
        </div>
        
        {visualization.data.meta.hasError && (
          <div className="flex items-center gap-1 text-red-600">
            <span className="text-sm">⚠️</span>
            <span className="text-sm">Error State</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div>Next Events: {visualization.data.nextEvents.join(', ') || 'None'}</div>
          <div>Transitions: {visualization.data.transitionHistory.length}</div>
        </div>
      )}
    </div>
  );

  const renderDetailedView = () => (
    <div className={`${themeClasses} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            State Machine Visualizer
          </h3>
          {interactive && (
            <div className="flex gap-2">
              <button
                onClick={visualization.controls.clearHistory}
                className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                Clear History
              </button>
              <button
                onClick={() => {
                  const data = visualization.controls.exportData();
                  console.log('Exported visualization data:', data);
                }}
                className="text-sm px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700"
              >
                Export Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Current State */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="font-medium mb-3">Current State</h4>
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: visualization.utils.getStateColor(visualization.data.currentState) }}
          />
          <span className="text-lg font-medium">
            {visualization.utils.formatState(visualization.data.currentState)}
          </span>
          {visualization.data.meta.isFinal && (
            <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded">
              Final State
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Machine ID:</span> {visualization.data.meta.machineId}
          </div>
          <div>
            <span className="font-medium">State Depth:</span> {visualization.data.meta.depth}
          </div>
          <div>
            <span className="font-medium">Available Events:</span> {visualization.data.nextEvents.length}
          </div>
          <div>
            <span className="font-medium">Has Error:</span> {visualization.data.meta.hasError ? 'Yes' : 'No'}
          </div>
        </div>

        {visualization.data.nextEvents.length > 0 && (
          <div className="mt-3">
            <div className="font-medium mb-2">Available Transitions:</div>
            <div className="flex flex-wrap gap-2">
              {visualization.data.nextEvents.map((event) => (
                <span
                  key={event}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded dark:bg-blue-800 dark:text-blue-200"
                >
                  {visualization.utils.formatEvent(event)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Context Data */}
      {visualization.data.context && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium mb-3">Context Data</h4>
          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-32">
            {JSON.stringify(visualization.data.context, null, 2)}
          </pre>
        </div>
      )}

      {/* Transition History */}
      {showHistory && visualization.data.transitionHistory.length > 0 && (
        <div className="p-4">
          <h4 className="font-medium mb-3">
            Transition History ({visualization.data.transitionHistory.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-auto">
            {visualization.data.transitionHistory
              .slice(-maxHistoryEntries)
              .reverse()
              .map((transition, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border text-sm cursor-pointer transition-colors ${
                    selectedTransition === index
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedTransition(selectedTransition === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {visualization.utils.formatEvent(transition.event)}
                      </span>
                      <span className="text-gray-500">→</span>
                      <span>
                        {visualization.utils.formatState(transition.to)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(transition.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {selectedTransition === index && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium">From:</span> {visualization.utils.formatState(transition.from)}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {transition.duration ? `${transition.duration}ms` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFlowView = () => (
    <div className={`p-4 ${themeClasses} ${className}`}>
      <h3 className="text-lg font-semibold mb-4">State Flow Diagram</h3>
      <div className="flex items-center justify-center min-h-[200px] bg-gray-50 dark:bg-gray-800 rounded">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🔄</div>
          <div>Interactive Flow Diagram</div>
          <div className="text-sm mt-1">(Feature in development)</div>
        </div>
      </div>
    </div>
  );

  switch (mode) {
    case 'compact':
      return renderCompactView();
    case 'flow':
      return renderFlowView();
    case 'detailed':
    default:
      return renderDetailedView();
  }
}

/**
 * Specialized macro execution visualizer
 */
export function MacroVisualizer({
  machineResult,
  ticker,
  showStepProgress = true,
  showWorkflow = true,
  ...props
}: MacroVisualizerProps) {
  const macroVisualization = useMacroVisualization(machineResult, props.config);

  const renderStepProgress = () => (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <h4 className="font-medium mb-3">Macro Progress</h4>
      
      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Overall Progress</span>
          <span>{Math.round(macroVisualization.macroData.macroProgress.overallProgress * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${macroVisualization.macroData.macroProgress.overallProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
          <span className="font-medium">Current Step:</span>
          <span>{macroVisualization.macroData.stepInfo.name}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {macroVisualization.macroData.stepInfo.description}
        </div>
      </div>

      {/* Step Statistics */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="font-medium">Completed:</span> {macroVisualization.macroData.macroProgress.completedSteps}
        </div>
        <div>
          <span className="font-medium">Total:</span> {macroVisualization.macroData.macroProgress.totalSteps}
        </div>
        <div>
          <span className="font-medium">Time:</span> {Math.round(macroVisualization.macroData.macroProgress.timeElapsed / 1000)}s
        </div>
      </div>
    </div>
  );

  const renderWorkflow = () => (
    <div className="p-4">
      <h4 className="font-medium mb-3">Workflow Steps</h4>
      <div className="space-y-3">
        {macroVisualization.macroData.workflow.steps.map((step, index) => {
          const isActive = step.id === macroVisualization.macroData.macroProgress.currentStep;
          const statusColors = {
            pending: 'bg-gray-200 text-gray-600',
            executing: 'bg-yellow-200 text-yellow-800',
            completed: 'bg-green-200 text-green-800',
            failed: 'bg-red-200 text-red-800',
            skipped: 'bg-gray-200 text-gray-500',
          };

          return (
            <div
              key={step.id}
              className={`p-3 rounded border ${
                isActive 
                  ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-mono text-gray-500">
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                  <div>
                    <div className="font-medium">{step.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Est. {step.estimatedDuration / 1000}s
                      {step.actualDuration && ` • Actual: ${step.actualDuration / 1000}s`}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${statusColors[step.status]}`}>
                  {step.status}
                </div>
              </div>
              
              {isActive && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${macroVisualization.macroData.macroProgress.stepProgress * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`${props.className || ''}`}>
      {/* Base visualizer */}
      <StateMachineVisualizer machineResult={machineResult} {...props} />
      
      {/* Macro-specific sections */}
      {showStepProgress && renderStepProgress()}
      {showWorkflow && renderWorkflow()}
    </div>
  );
}

/**
 * Simplified state indicator component
 */
export function StateIndicator({
  machineResult,
  size = 'md',
  showLabel = true,
  className = '',
}: {
  machineResult: XStateMachineResult<any>;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}) {
  const visualization = useStateVisualization(machineResult);
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-full`}
        style={{ backgroundColor: visualization.utils.getStateColor(visualization.data.currentState) }}
      />
      {showLabel && (
        <span className="text-sm">
          {visualization.utils.formatState(visualization.data.currentState)}
        </span>
      )}
    </div>
  );
}

/**
 * Default exports
 */
export default StateMachineVisualizer;