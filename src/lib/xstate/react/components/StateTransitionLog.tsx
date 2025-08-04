/**
 * @fileoverview State Transition Log React Component
 * 
 * Provides real-time logging and visualization of XState machine transitions,
 * events, and state changes with filtering and export capabilities.
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useStateVisualization } from '../hooks/use-state-visualization';
import type { XStateMachineResult } from '../hooks/use-xstate-machine';
import type { StateVisualizationData } from '../hooks/use-state-visualization';

export interface StateTransitionLogProps {
  /** Machine result from useXStateMachine */
  machineResult: XStateMachineResult<any>;
  /** Maximum number of log entries to display */
  maxEntries?: number;
  /** Enable real-time updates */
  realTime?: boolean;
  /** Show transition details */
  showDetails?: boolean;
  /** Enable filtering */
  enableFiltering?: boolean;
  /** Enable export functionality */
  enableExport?: boolean;
  /** Auto-scroll to latest entries */
  autoScroll?: boolean;
  /** Custom styling */
  className?: string;
  /** Compact display mode */
  compact?: boolean;
}

// Log entry types
interface LogEntry {
  id: string;
  timestamp: number;
  type: 'transition' | 'event' | 'error' | 'action';
  from?: string | object;
  to?: string | object;
  event?: string;
  message: string;
  details?: any;
  duration?: number;
  level: 'info' | 'warn' | 'error' | 'debug';
}

// Filter options
interface FilterOptions {
  types: string[];
  levels: string[];
  timeRange: 'all' | '1m' | '5m' | '15m' | '1h';
  searchText: string;
}

/**
 * State transition log component
 */
export function StateTransitionLog({
  machineResult,
  maxEntries = 100,
  realTime = true,
  showDetails = true,
  enableFiltering = true,
  enableExport = true,
  autoScroll = true,
  className = '',
  compact = false,
}: StateTransitionLogProps) {
  const visualization = useStateVisualization(machineResult, {
    trackHistory: true,
    maxHistorySize: maxEntries,
    trackTiming: true,
    enableDebugLogging: true,
  });

  // Log state
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    types: ['transition', 'event', 'error', 'action'],
    levels: ['info', 'warn', 'error', 'debug'],
    timeRange: 'all',
    searchText: '',
  });
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(autoScroll);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  // Refs
  const logContainerRef = useRef<HTMLDivElement>(null);
  const previousTransitionCountRef = useRef(0);

  // Convert transitions to log entries
  const convertTransitionsToLogEntries = useCallback((transitionHistory: StateVisualizationData['transitionHistory']) => {
    return transitionHistory.map((transition, index): LogEntry => ({
      id: `transition-${transition.timestamp}-${index}`,
      timestamp: transition.timestamp,
      type: 'transition',
      from: transition.from,
      to: transition.to,
      event: transition.event,
      message: `${formatStateValue(transition.from)} → ${formatStateValue(transition.to)} (${transition.event})`,
      details: {
        from: transition.from,
        to: transition.to,
        event: transition.event,
        duration: transition.duration,
      },
      duration: transition.duration,
      level: 'info',
    }));
  }, []);

  // Update log entries when transitions change
  useEffect(() => {
    const newTransitionCount = visualization.data.transitionHistory.length;
    if (newTransitionCount > previousTransitionCountRef.current) {
      // New transitions detected
      const newTransitions = visualization.data.transitionHistory.slice(previousTransitionCountRef.current);
      const newLogEntries = convertTransitionsToLogEntries(newTransitions);
      
      setLogEntries(prevEntries => {
        const combined = [...prevEntries, ...newLogEntries];
        return combined.slice(-maxEntries); // Keep only recent entries
      });

      previousTransitionCountRef.current = newTransitionCount;
    }
  }, [visualization.data.transitionHistory, convertTransitionsToLogEntries, maxEntries]);

  // Add machine errors to log
  useEffect(() => {
    if (machineResult.meta.hasError && machineResult.meta.error) {
      const errorEntry: LogEntry = {
        id: `error-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        type: 'error',
        message: `Machine Error: ${machineResult.meta.error.message}`,
        details: {
          error: machineResult.meta.error,
          state: visualization.data.currentState,
          context: visualization.data.context,
        },
        level: 'error',
      };

      setLogEntries(prev => [...prev.slice(-(maxEntries - 1)), errorEntry]);
    }
  }, [machineResult.meta.hasError, machineResult.meta.error, visualization.data, maxEntries]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isAutoScrollEnabled && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logEntries, isAutoScrollEnabled]);

  // Filter log entries
  const filteredEntries = useMemo(() => {
    let filtered = logEntries;

    // Filter by type
    if (filters.types.length > 0) {
      filtered = filtered.filter(entry => filters.types.includes(entry.type));
    }

    // Filter by level
    if (filters.levels.length > 0) {
      filtered = filtered.filter(entry => filters.levels.includes(entry.level));
    }

    // Filter by time range
    if (filters.timeRange !== 'all') {
      const now = Date.now();
      const timeRanges = {
        '1m': 60 * 1000,
        '5m': 5 * 60 * 1000,
        '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000,
      };
      const cutoff = now - timeRanges[filters.timeRange];
      filtered = filtered.filter(entry => entry.timestamp >= cutoff);
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.message.toLowerCase().includes(searchLower) ||
        entry.event?.toLowerCase().includes(searchLower) ||
        (typeof entry.from === 'string' && entry.from.toLowerCase().includes(searchLower)) ||
        (typeof entry.to === 'string' && entry.to.toLowerCase().includes(searchLower))
      );
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [logEntries, filters]);

  // Helper functions
  const formatStateValue = (state: string | object | undefined): string => {
    if (!state) return 'unknown';
    if (typeof state === 'string') return state;
    return JSON.stringify(state);
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (duration?: number): string => {
    if (!duration) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const getLevelIcon = (level: LogEntry['level']): string => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'debug': return '🔍';
      default: return 'ℹ️';
    }
  };

  const getLevelColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warn': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'debug': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  // Export functionality
  const handleExport = () => {
    const exportData = {
      machineId: machineResult.meta.machineId,
      exportedAt: new Date().toISOString(),
      totalEntries: logEntries.length,
      filteredEntries: filteredEntries.length,
      filters,
      entries: filteredEntries,
      machineInfo: {
        currentState: visualization.data.currentState,
        transitionCount: visualization.data.transitionHistory.length,
        hasError: machineResult.meta.hasError,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xstate-log-${machineResult.meta.machineId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear log
  const handleClear = () => {
    setLogEntries([]);
    setSelectedEntry(null);
    previousTransitionCountRef.current = 0;
  };

  // Render filter controls
  const renderFilters = () => (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search log entries..."
            value={filters.searchText}
            onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Types:</span>
          {['transition', 'event', 'error', 'action'].map(type => (
            <label key={type} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={filters.types.includes(type)}
                onChange={(e) => {
                  setFilters(prev => ({
                    ...prev,
                    types: e.target.checked
                      ? [...prev.types, type]
                      : prev.types.filter(t => t !== type)
                  }));
                }}
                className="w-4 h-4"
              />
              {type}
            </label>
          ))}
        </div>

        {/* Time range */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Time:</span>
          <select
            value={filters.timeRange}
            onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as FilterOptions['timeRange'] }))}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="1m">Last 1m</option>
            <option value="5m">Last 5m</option>
            <option value="15m">Last 15m</option>
            <option value="1h">Last 1h</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Render log entry
  const renderLogEntry = (entry: LogEntry) => (
    <div
      key={entry.id}
      className={`p-3 border-l-4 cursor-pointer transition-colors ${
        selectedEntry === entry.id
          ? 'bg-blue-100 border-l-blue-500'
          : `hover:bg-gray-50 ${getLevelColor(entry.level)}`
      }`}
      onClick={() => setSelectedEntry(selectedEntry === entry.id ? null : entry.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-lg">{getLevelIcon(entry.level)}</span>
          <div className="flex-1">
            <div className="font-medium text-sm">{entry.message}</div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              <span>{formatTime(entry.timestamp)}</span>
              <span className="uppercase">{entry.type}</span>
              {entry.duration && <span>{formatDuration(entry.duration)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {selectedEntry === entry.id && showDetails && entry.details && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(entry.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  // Render compact entry
  const renderCompactEntry = (entry: LogEntry) => (
    <div
      key={entry.id}
      className="flex items-center gap-2 px-3 py-1 text-sm hover:bg-gray-50 cursor-pointer"
      onClick={() => setSelectedEntry(selectedEntry === entry.id ? null : entry.id)}
    >
      <span>{getLevelIcon(entry.level)}</span>
      <span className="text-gray-500 text-xs">{formatTime(entry.timestamp)}</span>
      <span className="flex-1 truncate">{entry.message}</span>
      {entry.duration && (
        <span className="text-gray-400 text-xs">{formatDuration(entry.duration)}</span>
      )}
    </div>
  );

  return (
    <div className={`border border-gray-200 rounded-lg bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Transition Log</h3>
          <span className="text-sm text-gray-500">
            {filteredEntries.length} / {logEntries.length} entries
          </span>
          {realTime && (
            <div className="flex items-center gap-1 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs">Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
            className={`text-xs px-2 py-1 rounded ${
              isAutoScrollEnabled
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Auto-scroll
          </button>
          
          {enableExport && (
            <button
              onClick={handleExport}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              Export
            </button>
          )}
          
          <button
            onClick={handleClear}
            className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Filters */}
      {enableFiltering && renderFilters()}

      {/* Log entries */}
      <div
        ref={logContainerRef}
        className={`overflow-auto ${compact ? 'max-h-60' : 'max-h-96'}`}
      >
        {filteredEntries.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">📝</div>
              <div>No log entries</div>
              <div className="text-sm mt-1">
                {logEntries.length === 0 ? 'Waiting for transitions...' : 'Try adjusting filters'}
              </div>
            </div>
          </div>
        ) : (
          <div className={compact ? 'space-y-0' : 'space-y-1'}>
            {filteredEntries.map(entry => 
              compact ? renderCompactEntry(entry) : renderLogEntry(entry)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple transition counter component
 */
export function TransitionCounter({
  machineResult,
  className = '',
}: {
  machineResult: XStateMachineResult<any>;
  className?: string;
}) {
  const visualization = useStateVisualization(machineResult);
  
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-gray-600">Transitions:</span>
      <span className="font-medium">{visualization.data.transitionHistory.length}</span>
    </div>
  );
}

/**
 * Default export
 */
export default StateTransitionLog;