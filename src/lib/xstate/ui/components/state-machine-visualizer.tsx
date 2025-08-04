/**
 * @fileOverview State Machine Visualizer Component
 * 
 * Advanced React component for visualizing and debugging XState machines
 * with Stately.ai integration, interactive controls, and real-time state monitoring.
 * 
 * Features:
 * - Embedded Stately.ai visualizer with customizable display modes
 * - Real-time state updates and transition monitoring
 * - Interactive controls for panning, zooming, and state inspection
 * - Development tools integration with debug logging
 * - Responsive design with mobile support
 * - Accessibility features with keyboard navigation
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Settings, 
  Activity,
  Eye,
  Code,
  Layers,
  Users
} from 'lucide-react';

// Hooks and utilities
import { useStateMachineVisualizer } from '../hooks/use-xstate-integration';
import { useAccessibility } from '../hooks/use-advanced-interactions';
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// Types
import type { 
  StateMachineVisualizerConfig, 
  BaseAdvancedUIProps 
} from '../types/ui-types';

// =============================================================================
// Logger Setup
// =============================================================================

const logger = createTickerLogger('STATE_MACHINE_VISUALIZER', TICKER_PAGES.ADVANCED_UI);

// =============================================================================
// Component Props
// =============================================================================

interface StateMachineVisualizerProps extends BaseAdvancedUIProps {
  /** Visualizer configuration */
  config: StateMachineVisualizerConfig;
  /** Component title */
  title?: string;
  /** Component description */
  description?: string;
  /** Enable fullscreen mode */
  enableFullscreen?: boolean;
  /** Enable state history */
  enableStateHistory?: boolean;
  /** Enable event logging */
  enableEventLogging?: boolean;
  /** Custom height override */
  height?: number;
  /** Custom width override */
  width?: number;
}

// =============================================================================
// State History Interface
// =============================================================================

interface StateHistoryEntry {
  timestamp: Date;
  state: string;
  event?: string;
  context?: any;
}

// =============================================================================
// Main Component
// =============================================================================

export function StateMachineVisualizer({
  config,
  title = 'State Machine Visualizer',
  description = 'Interactive state machine visualization and debugging',
  enableFullscreen = true,
  enableStateHistory = true,
  enableEventLogging = true,
  height = 600,
  width,
  className = '',
  accessibility,
  onError,
  loading = false,
  disabled = false,
  ...props
}: StateMachineVisualizerProps) {
  // Accessibility setup
  const accessibilityConfig = accessibility || {
    enableScreenReader: true,
    enableKeyboardNavigation: true,
    focusManagement: {
      autoFocus: false,
      focusTrap: false,
      restoreFocus: false,
      skipLinks: []
    },
    ariaLabels: {
      visualizer: 'State machine visualizer',
      controls: 'Visualizer controls',
      stateInfo: 'Current state information',
      history: 'State transition history'
    }
  };

  const { 
    manageFocus, 
    announceToScreenReader, 
    ariaLabels 
  } = useAccessibility(accessibilityConfig);

  // Component state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState(config.panel || 'state');
  const [stateHistory, setStateHistory] = useState<StateHistoryEntry[]>([]);
  const [eventLog, setEventLog] = useState<Array<{ timestamp: Date; event: string; data?: any }>>([]);
  const [isPlaying, setIsPlaying] = useState(true);

  // Visualizer hook
  const {
    visualizerUrl,
    currentState,
    isLoading: visualizerLoading,
    error: visualizerError,
    refresh
  } = useStateMachineVisualizer(config);

  // Handle errors
  useEffect(() => {
    if (visualizerError) {
      logger.error('Visualizer error:', visualizerError);
      onError?.(visualizerError);
    }
  }, [visualizerError, onError]);

  // Track state changes for history
  useEffect(() => {
    if (!currentState || !enableStateHistory) return;

    const historyEntry: StateHistoryEntry = {
      timestamp: new Date(),
      state: typeof currentState.value === 'string' ? currentState.value : JSON.stringify(currentState.value),
      context: currentState.context
    };

    setStateHistory(prev => {
      const newHistory = [...prev, historyEntry];
      // Keep only last 50 entries
      if (newHistory.length > 50) {
        newHistory.splice(0, newHistory.length - 50);
      }
      return newHistory;
    });

    // Announce state change to screen reader
    announceToScreenReader(`State changed to ${historyEntry.state}`);
  }, [currentState, enableStateHistory, announceToScreenReader]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const newFullscreen = !prev;
      announceToScreenReader(
        newFullscreen ? 'Entered fullscreen mode' : 'Exited fullscreen mode'
      );
      return newFullscreen;
    });
  }, [announceToScreenReader]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => {
      const newState = !prev;
      announceToScreenReader(
        newState ? 'Visualizer resumed' : 'Visualizer paused'
      );
      return newState;
    });
  }, [announceToScreenReader]);

  // Reset visualizer
  const resetVisualizer = useCallback(() => {
    setStateHistory([]);
    setEventLog([]);
    refresh();
    announceToScreenReader('Visualizer reset');
  }, [refresh, announceToScreenReader]);

  // Clear history
  const clearHistory = useCallback(() => {
    setStateHistory([]);
    setEventLog([]);
    announceToScreenReader('History cleared');
  }, [announceToScreenReader]);

  // Visualizer iframe props
  const iframeProps = useMemo(() => ({
    src: visualizerUrl,
    width: width || '100%',
    height: isFullscreen ? '90vh' : height,
    frameBorder: 0,
    allow: "accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking",
    sandbox: "allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts",
    title: ariaLabels.visualizer || 'State machine visualization',
    'aria-label': ariaLabels.visualizer || 'State machine visualization'
  }), [visualizerUrl, width, height, isFullscreen, ariaLabels.visualizer]);

  // Current state display
  const currentStateDisplay = useMemo(() => {
    if (!currentState) return 'Unknown';
    
    const stateValue = currentState.value;
    if (typeof stateValue === 'string') {
      return stateValue;
    }
    
    if (typeof stateValue === 'object' && stateValue !== null) {
      return Object.entries(stateValue)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
    
    return JSON.stringify(stateValue);
  }, [currentState]);

  // Render error state
  if (visualizerError) {
    return (
      <Card className={`w-full ${className}`} {...props}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Activity className="h-5 w-5" />
            {title} - Error
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load state machine visualizer: {visualizerError.message}
            </AlertDescription>
          </Alert>
          <Button onClick={refresh} className="mt-4">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`w-full ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${className}`} 
      {...props}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          {/* Control buttons */}
          <div 
            className="flex items-center gap-2"
            role="toolbar"
            aria-label={ariaLabels.controls || 'Visualizer controls'}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPause}
              disabled={disabled || loading}
              aria-label={isPlaying ? 'Pause visualizer' : 'Resume visualizer'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetVisualizer}
              disabled={disabled || loading}
              aria-label="Reset visualizer"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            {enableFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Current state indicator */}
        {currentState && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              Current State: {currentStateDisplay}
            </Badge>
            {currentState.done && (
              <Badge variant="destructive" className="text-xs">
                Final
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={selectedPanel} onValueChange={setSelectedPanel}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="visualizer" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Visualizer
            </TabsTrigger>
            <TabsTrigger value="state" className="flex items-center gap-1">
              <Layers className="h-4 w-4" />
              State
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              Code
            </TabsTrigger>
            {enableStateHistory && (
              <TabsTrigger value="history" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                History
              </TabsTrigger>
            )}
          </TabsList>

          {/* Visualizer Tab */}
          <TabsContent value="visualizer" className="mt-4">
            {(loading || visualizerLoading) ? (
              <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading visualizer...</p>
                </div>
              </div>
            ) : visualizerUrl ? (
              <div className="border rounded-lg overflow-hidden">
                <iframe {...iframeProps} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                <p className="text-muted-foreground">No visualizer URL available</p>
              </div>
            )}
          </TabsContent>

          {/* State Tab */}
          <TabsContent value="state" className="mt-4">
            <div 
              className="space-y-4"
              role="region"
              aria-label={ariaLabels.stateInfo || 'Current state information'}
            >
              {currentState ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Current State</h4>
                      <Badge variant="outline" className="text-sm">
                        {currentStateDisplay}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Status</h4>
                      <Badge 
                        variant={currentState.done ? 'destructive' : 'default'}
                        className="text-sm"
                      >
                        {currentState.done ? 'Final' : 'Active'}
                      </Badge>
                    </div>
                  </div>

                  {currentState.context && (
                    <div>
                      <h4 className="font-medium mb-2">Context</h4>
                      <ScrollArea className="h-32 w-full border rounded-md p-2">
                        <pre className="text-xs">
                          {JSON.stringify(currentState.context, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}

                  {currentState.meta && Object.keys(currentState.meta).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Metadata</h4>
                      <ScrollArea className="h-32 w-full border rounded-md p-2">
                        <pre className="text-xs">
                          {JSON.stringify(currentState.meta, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No state information available
                </div>
              )}
            </div>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Machine Configuration</h4>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <ScrollArea className="h-96 w-full border rounded-md p-4">
                <pre className="text-xs">
                  {JSON.stringify(config.machine?.config || {}, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* History Tab */}
          {enableStateHistory && (
            <TabsContent value="history" className="mt-4">
              <div 
                className="space-y-4"
                role="region"
                aria-label={ariaLabels.history || 'State transition history'}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">State Transition History</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearHistory}
                    disabled={stateHistory.length === 0}
                  >
                    Clear History
                  </Button>
                </div>
                
                <ScrollArea className="h-64 w-full border rounded-md">
                  {stateHistory.length > 0 ? (
                    <div className="p-4 space-y-2">
                      {stateHistory.slice().reverse().map((entry, index) => (
                        <div 
                          key={`${entry.timestamp.getTime()}-${index}`}
                          className="flex items-center justify-between text-sm border-b border-border/50 pb-2"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {entry.state}
                            </Badge>
                            {entry.event && (
                              <span className="text-muted-foreground">
                                ← {entry.event}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      No state transitions recorded
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Default Export
// =============================================================================

export default StateMachineVisualizer;