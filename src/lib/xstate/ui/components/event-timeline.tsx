/**
 * @fileOverview Event Timeline UI Component
 * 
 * Advanced React component for visualizing machine events and state transitions
 * in a timeline format with filtering, search, and export capabilities.
 * 
 * Features:
 * - Real-time event timeline visualization
 * - Event filtering by type, level, and time range
 * - Interactive event details and context inspection
 * - Export timeline data to JSON
 * - Responsive design with accessibility support
 * - Integration with XState machine visualization
 * 
 * @created 2025-08-05
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Play, 
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Hooks and utilities
import { useXStateIntegration } from '../hooks/use-xstate-integration';
import { useAdvancedInteractions } from '../hooks/use-advanced-interactions';
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// Types
import type { 
  EventTimelineConfig, 
  BaseAdvancedUIProps 
} from '../types/ui-types';

// =============================================================================
// Logger Setup
// =============================================================================

const logger = createTickerLogger('EVENT_TIMELINE', TICKER_PAGES.ADVANCED_UI);

// =============================================================================
// Component Props & Types
// =============================================================================

interface EventTimelineProps extends BaseAdvancedUIProps {
  /** Timeline configuration */
  config: EventTimelineConfig;
  /** Component title */
  title?: string;
  /** Component description */
  description?: string;
  /** Maximum number of events to display */
  maxEvents?: number;
  /** Enable real-time updates */
  realTime?: boolean;
  /** Enable event filtering */
  enableFiltering?: boolean;
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Enable export functionality */
  enableExport?: boolean;
  /** Auto-scroll to latest events */
  autoScroll?: boolean;
  /** Compact display mode */
  compact?: boolean;
}

interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'transition' | 'action' | 'guard' | 'service' | 'error' | 'info';
  level: 'debug' | 'info' | 'warn' | 'error';
  title: string;
  description?: string;
  details?: any;
  duration?: number;
  machineId?: string;
  stateFrom?: string;
  stateTo?: string;
  eventName?: string;
}

interface FilterOptions {
  types: string[];
  levels: string[];
  timeRange: 'all' | '1m' | '5m' | '15m' | '1h' | '24h';
  searchQuery: string;
  machineId?: string;
}

// =============================================================================
// Main Component
// =============================================================================

export function EventTimeline({
  config,
  title = 'Event Timeline',
  description = 'Real-time machine event visualization',
  maxEvents = 200,
  realTime = true,
  enableFiltering = true,
  enableSearch = true,
  enableExport = true,
  autoScroll = true,
  compact = false,
  className = '',
  ...props
}: EventTimelineProps) {
  // Hooks
  const xstateIntegration = useXStateIntegration(config.integrationConfig);
  const { announceToScreenReader } = useAdvancedInteractions({
    componentId: 'event-timeline',
    enableKeyboardShortcuts: true,
    enableAccessibilityAnnouncements: true,
  });

  // State
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    types: ['transition', 'action', 'guard', 'service', 'error', 'info'],
    levels: ['debug', 'info', 'warn', 'error'],
    timeRange: 'all',
    searchQuery: '',
    machineId: undefined,
  });
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(autoScroll);
  const [isPaused, setIsPaused] = useState(false);

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const eventCounterRef = useRef(0);

  // Process integration events into timeline events
  const processIntegrationEvents = useCallback((integrationData: any) => {
    if (!integrationData || isPaused) return;

    const newEvents: TimelineEvent[] = [];

    // Process state transitions
    if (integrationData.transitions) {
      integrationData.transitions.forEach((transition: any, index: number) => {
        if (index >= eventCounterRef.current) {
          newEvents.push({
            id: `transition-${transition.timestamp}-${index}`,
            timestamp: transition.timestamp,
            type: 'transition',
            level: 'info',
            title: `State Transition`,
            description: `${transition.from} → ${transition.to}`,
            details: transition,
            duration: transition.duration,
            machineId: transition.machineId,
            stateFrom: transition.from,
            stateTo: transition.to,
            eventName: transition.event,
          });
        }
      });
      eventCounterRef.current = integrationData.transitions.length;
    }

    // Process machine errors
    if (integrationData.errors) {
      integrationData.errors.forEach((error: any) => {
        newEvents.push({
          id: `error-${error.timestamp}-${Math.random()}`,
          timestamp: error.timestamp || Date.now(),
          type: 'error',
          level: 'error',
          title: 'Machine Error',
          description: error.message || 'Unknown error',
          details: error,
          machineId: error.machineId,
        });
      });
    }

    // Process service invocations
    if (integrationData.services) {
      integrationData.services.forEach((service: any) => {
        newEvents.push({
          id: `service-${service.timestamp}-${Math.random()}`,
          timestamp: service.timestamp || Date.now(),
          type: 'service',
          level: service.level || 'info',
          title: `Service: ${service.name}`,
          description: service.status || 'Invoked',
          details: service,
          duration: service.duration,
          machineId: service.machineId,
        });
      });
    }

    if (newEvents.length > 0) {
      setEvents(prevEvents => {
        const combined = [...prevEvents, ...newEvents]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxEvents);
        return combined;
      });
    }
  }, [maxEvents, isPaused]);

  // Update events when integration data changes
  useEffect(() => {
    if (xstateIntegration.data && realTime) {
      processIntegrationEvents(xstateIntegration.data);
    }
  }, [xstateIntegration.data, processIntegrationEvents, realTime]);

  // Auto-scroll to top (newest events)
  useEffect(() => {
    if (isAutoScrollEnabled && timelineRef.current && events.length > 0) {
      timelineRef.current.scrollTop = 0;
    }
  }, [events, isAutoScrollEnabled]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by type
    if (filters.types.length > 0 && filters.types.length < 6) {
      filtered = filtered.filter(event => filters.types.includes(event.type));
    }

    // Filter by level
    if (filters.levels.length > 0 && filters.levels.length < 4) {
      filtered = filtered.filter(event => filters.levels.includes(event.level));
    }

    // Filter by time range
    if (filters.timeRange !== 'all') {
      const now = Date.now();
      const timeRanges = {
        '1m': 60 * 1000,
        '5m': 5 * 60 * 1000,
        '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
      };
      const cutoff = now - timeRanges[filters.timeRange];
      filtered = filtered.filter(event => event.timestamp >= cutoff);
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.eventName?.toLowerCase().includes(query) ||
        event.stateFrom?.toLowerCase().includes(query) ||
        event.stateTo?.toLowerCase().includes(query)
      );
    }

    // Filter by machine ID
    if (filters.machineId) {
      filtered = filtered.filter(event => event.machineId === filters.machineId);
    }

    return filtered;
  }, [events, filters]);

  // Event handlers
  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => {
      const newState = !prev;
      announceToScreenReader(
        newState ? 'Timeline paused' : 'Timeline resumed'
      );
      return newState;
    });
  }, [announceToScreenReader]);

  const handleClearEvents = useCallback(() => {
    setEvents([]);
    setSelectedEvent(null);
    eventCounterRef.current = 0;
    announceToScreenReader('Timeline cleared');
  }, [announceToScreenReader]);

  const handleExport = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalEvents: events.length,
      filteredEvents: filteredEvents.length,
      filters,
      events: filteredEvents,
      config,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-timeline-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    announceToScreenReader('Timeline data exported');
  }, [events, filteredEvents, filters, config, announceToScreenReader]);

  // Helper functions
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (duration?: number): string => {
    if (!duration) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const getEventIcon = (event: TimelineEvent): React.ReactNode => {
    switch (event.type) {
      case 'transition':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'action':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'guard':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'service':
        return <Clock className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventColor = (event: TimelineEvent): string => {
    switch (event.level) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warn':
        return 'border-yellow-200 bg-yellow-50';
      case 'debug':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  // Render timeline event
  const renderEvent = (event: TimelineEvent, index: number) => {
    const isSelected = selectedEvent === event.id;
    const isCompactMode = compact && !isSelected;

    return (
      <div
        key={event.id}
        className={`relative pl-8 pb-4 ${index < filteredEvents.length - 1 ? 'border-l-2 border-gray-200 ml-2' : ''}`}
      >
        {/* Timeline dot */}
        <div className="absolute left-0 top-1 transform -translate-x-1/2">
          <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
            {getEventIcon(event)}
          </div>
        </div>

        {/* Event card */}
        <div
          className={`ml-4 p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${
            isSelected ? 'ring-2 ring-blue-500' : ''
          } ${getEventColor(event)}`}
          onClick={() => setSelectedEvent(isSelected ? null : event.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{event.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {event.type}
                </Badge>
                {event.level === 'error' && (
                  <Badge variant="destructive" className="text-xs">
                    Error
                  </Badge>
                )}
              </div>
              
              {event.description && (
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <span>{formatTime(event.timestamp)}</span>
                {event.duration && <span>{formatDuration(event.duration)}</span>}
                {event.machineId && <span>Machine: {event.machineId}</span>}
              </div>
            </div>

            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(isSelected ? null : event.id);
              }}
            >
              {isSelected ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Expanded details */}
          {isSelected && event.details && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="font-medium text-sm mb-2">Event Details</h5>
              <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
                {JSON.stringify(event.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`} {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePause}
              className="flex items-center gap-1"
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearEvents}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>

            {enableExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Events: {filteredEvents.length} / {events.length}</span>
            {realTime && !isPaused && (
              <div className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs">Live</span>
              </div>
            )}
            {isPaused && (
              <Badge variant="secondary" className="text-xs">
                Paused
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Filters and search */}
        {(enableFiltering || enableSearch) && (
          <div className="mb-4 p-3 border rounded-lg bg-gray-50">
            <div className="flex flex-wrap items-center gap-4">
              {enableSearch && (
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search events..."
                      value={filters.searchQuery}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        searchQuery: e.target.value 
                      }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {enableFiltering && (
                <>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={filters.timeRange}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        timeRange: e.target.value as FilterOptions['timeRange'] 
                      }))}
                      className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Time</option>
                      <option value="1m">Last 1m</option>
                      <option value="5m">Last 5m</option>
                      <option value="15m">Last 15m</option>
                      <option value="1h">Last 1h</option>
                      <option value="24h">Last 24h</option>
                    </select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
                    className={isAutoScrollEnabled ? 'bg-blue-100' : ''}
                  >
                    Auto-scroll
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <ScrollArea className="h-96" ref={timelineRef}>
          {filteredEvents.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div>No events to display</div>
                <div className="text-sm mt-1">
                  {events.length === 0 ? 'Waiting for events...' : 'Try adjusting filters'}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4">
              {filteredEvents.map((event, index) => renderEvent(event, index))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * Default export
 */
export default EventTimeline;