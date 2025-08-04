/**
 * @fileOverview Actor Spawning Dashboard Component
 * 
 * Advanced React component for managing XState actor spawning, lifecycle,
 * and coordination across multiple ticker analysis contexts.
 * 
 * Features:
 * - Interactive actor spawning with type selection
 * - Real-time actor status monitoring and management
 * - Performance metrics for spawned actors
 * - Actor communication and event sending
 * - Lifecycle management with auto-cleanup
 * - Visual actor hierarchy and relationships
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Play, 
  Square, 
  Trash2, 
  Activity, 
  Settings,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

// Hooks and utilities
import { useActorSpawning } from '../hooks/use-xstate-integration';
import { useAccessibility } from '../hooks/use-advanced-interactions';
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// Types
import type { 
  ActorSpawningConfig, 
  ActorInstance, 
  ActorTypeDefinition,
  BaseAdvancedUIProps 
} from '../types/ui-types';

// =============================================================================
// Logger Setup
// =============================================================================

const logger = createTickerLogger('ACTOR_SPAWNING_DASHBOARD', TICKER_PAGES.ADVANCED_UI);

// =============================================================================
// Component Props
// =============================================================================

interface ActorSpawningDashboardProps extends BaseAdvancedUIProps {
  /** Actor spawning configuration */
  config: ActorSpawningConfig;
  /** Component title */
  title?: string;
  /** Component description */
  description?: string;
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Enable actor communication */
  enableActorCommunication?: boolean;
  /** Auto refresh interval in milliseconds */
  autoRefreshInterval?: number;
}

// =============================================================================
// Actor Status Icon Component
// =============================================================================

function ActorStatusIcon({ status }: { status: ActorInstance['status'] }) {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'idle':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'terminated':
      return <Square className="h-4 w-4 text-gray-500" />;
    default:
      return <Activity className="h-4 w-4 text-blue-500" />;
  }
}

// =============================================================================
// Actor Creation Dialog Component
// =============================================================================

interface ActorCreationDialogProps {
  availableTypes: ActorTypeDefinition[];
  onCreateActor: (typeId: string, name: string, context?: Record<string, any>) => Promise<void>;
  isSpawning: boolean;
}

function ActorCreationDialog({ availableTypes, onCreateActor, isSpawning }: ActorCreationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [actorName, setActorName] = useState('');
  const [initialContext, setInitialContext] = useState('{}');

  const handleCreate = useCallback(async () => {
    if (!selectedType || !actorName) return;

    try {
      let context = {};
      if (initialContext.trim()) {
        context = JSON.parse(initialContext);
      }

      await onCreateActor(selectedType, actorName, context);
      
      // Reset form
      setSelectedType('');
      setActorName('');
      setInitialContext('{}');
      setIsOpen(false);
    } catch (error) {
      logger.error('Failed to create actor:', error);
    }
  }, [selectedType, actorName, initialContext, onCreateActor]);

  const selectedTypeInfo = useMemo(() => {
    return availableTypes.find(type => type.id === selectedType);
  }, [availableTypes, selectedType]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Spawn Actor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Spawn New Actor</DialogTitle>
          <DialogDescription>
            Create a new actor instance from an available actor type.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="actor-type" className="text-right">
              Type
            </Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select actor type" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      <span>{type.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {type.category}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTypeInfo && (
            <div className="col-span-4 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p><strong>Description:</strong> {selectedTypeInfo.description}</p>
              {selectedTypeInfo.permissions && selectedTypeInfo.permissions.length > 0 && (
                <p className="mt-1">
                  <strong>Permissions:</strong> {selectedTypeInfo.permissions.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="actor-name" className="text-right">
              Name
            </Label>
            <Input
              id="actor-name"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              placeholder="Enter actor name"
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="initial-context" className="text-right mt-2">
              Context
            </Label>
            <div className="col-span-3 space-y-2">
              <textarea
                id="initial-context"
                value={initialContext}
                onChange={(e) => setInitialContext(e.target.value)}
                placeholder="Initial context (JSON)"
                className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Provide initial context as valid JSON
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!selectedType || !actorName || isSpawning}
          >
            {isSpawning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Spawning...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Create Actor
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Actor Card Component
// =============================================================================

interface ActorCardProps {
  actor: ActorInstance;
  onTerminate: (actorId: string) => void;
  onSendEvent: (actorId: string, event: any) => void;
  enableCommunication: boolean;
}

function ActorCard({ actor, onTerminate, onSendEvent, enableCommunication }: ActorCardProps) {
  const [eventToSend, setEventToSend] = useState('');

  const handleSendEvent = useCallback(() => {
    if (!eventToSend.trim()) return;

    try {
      const event = JSON.parse(eventToSend);
      onSendEvent(actor.id, event);
      setEventToSend('');
    } catch (error) {
      logger.error('Invalid event JSON:', error);
    }
  }, [eventToSend, onSendEvent, actor.id]);

  const activityDuration = useMemo(() => {
    const now = Date.now();
    const lastActivity = actor.lastActivity.getTime();
    const durationMs = now - lastActivity;
    
    if (durationMs < 60000) {
      return `${Math.floor(durationMs / 1000)}s ago`;
    } else if (durationMs < 3600000) {
      return `${Math.floor(durationMs / 60000)}m ago`;
    } else {
      return `${Math.floor(durationMs / 3600000)}h ago`;
    }
  }, [actor.lastActivity]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ActorStatusIcon status={actor.status} />
            <div>
              <CardTitle className="text-sm">{actor.name}</CardTitle>
              <CardDescription className="text-xs">
                {actor.typeId} • Created {actor.createdAt.toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTerminate(actor.id)}
            disabled={actor.status === 'terminated'}
            aria-label={`Terminate ${actor.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Current State</Label>
            <Badge variant="outline" className="text-xs mt-1">
              {actor.currentState}
            </Badge>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Last Activity</Label>
            <p className="text-xs mt-1">{activityDuration}</p>
          </div>
        </div>

        {actor.error && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {actor.error.message}
            </AlertDescription>
          </Alert>
        )}

        {actor.metrics && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Performance</Label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">CPU:</span>
                <Progress value={actor.metrics.cpuUsage || 0} className="h-1 mt-1" />
              </div>
              <div>
                <span className="text-muted-foreground">Memory:</span>
                <Progress value={actor.metrics.memoryUsage || 0} className="h-1 mt-1" />
              </div>
            </div>
          </div>
        )}

        {enableCommunication && actor.status === 'active' && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs text-muted-foreground">Send Event</Label>
            <div className="flex gap-2">
              <Input
                value={eventToSend}
                onChange={(e) => setEventToSend(e.target.value)}
                placeholder='{"type": "EVENT_NAME"}'
                className="text-xs"
              />
              <Button
                size="sm"
                onClick={handleSendEvent}
                disabled={!eventToSend.trim()}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ActorSpawningDashboard({
  config,
  title = 'Actor Spawning Dashboard',
  description = 'Manage XState actors and their lifecycle',
  enablePerformanceMonitoring = true,
  enableActorCommunication = true,
  autoRefreshInterval = 5000,
  className = '',
  accessibility,
  onError,
  loading = false,
  disabled = false,
  ...props
}: ActorSpawningDashboardProps) {
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
      dashboard: 'Actor spawning dashboard',
      actorList: 'Active actors list',
      spawnButton: 'Spawn new actor',
      controls: 'Actor controls'
    }
  };

  const { announceToScreenReader, ariaLabels } = useAccessibility(accessibilityConfig);

  // Actor spawning hook
  const {
    actors,
    isSpawning,
    spawnActor,
    terminateActor,
    sendToActor,
    availableTypes,
    canSpawnMore
  } = useActorSpawning(config);

  // Create actor handler
  const handleCreateActor = useCallback(async (
    typeId: string, 
    name: string, 
    context?: Record<string, any>
  ) => {
    try {
      const actor = await spawnActor(typeId, name, context);
      announceToScreenReader(`Actor ${name} spawned successfully`);
      logger.info('Actor spawned via dashboard:', { actorId: actor.id, typeId, name });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      announceToScreenReader(`Failed to spawn actor: ${errorMessage}`);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      logger.error('Failed to spawn actor via dashboard:', error);
    }
  }, [spawnActor, announceToScreenReader, onError]);

  // Terminate actor handler
  const handleTerminateActor = useCallback((actorId: string) => {
    const actor = actors.find(a => a.id === actorId);
    terminateActor(actorId);
    announceToScreenReader(`Actor ${actor?.name || actorId} terminated`);
    logger.info('Actor terminated via dashboard:', { actorId });
  }, [actors, terminateActor, announceToScreenReader]);

  // Send event handler
  const handleSendEvent = useCallback((actorId: string, event: any) => {
    const actor = actors.find(a => a.id === actorId);
    sendToActor(actorId, event);
    announceToScreenReader(`Event sent to ${actor?.name || actorId}`);
    logger.debug('Event sent via dashboard:', { actorId, event });
  }, [actors, sendToActor, announceToScreenReader]);

  // Statistics
  const statistics = useMemo(() => {
    const statusCounts = actors.reduce((acc, actor) => {
      acc[actor.status] = (acc[actor.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryCounts = actors.reduce((acc, actor) => {
      const type = availableTypes.find(t => t.id === actor.typeId);
      const category = type?.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: actors.length,
      active: statusCounts.active || 0,
      idle: statusCounts.idle || 0,
      error: statusCounts.error || 0,
      terminated: statusCounts.terminated || 0,
      categories: categoryCounts,
      utilizationPercentage: config.maxConcurrentActors 
        ? Math.round((actors.length / config.maxConcurrentActors) * 100)
        : 0
    };
  }, [actors, availableTypes, config.maxConcurrentActors]);

  return (
    <Card className={`w-full ${className}`} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          {/* Dashboard controls */}
          <div className="flex items-center gap-2">
            <ActorCreationDialog
              availableTypes={availableTypes}
              onCreateActor={handleCreateActor}
              isSpawning={isSpawning}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{statistics.total}</div>
            <div className="text-xs text-muted-foreground">Total Actors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{statistics.active}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{statistics.idle}</div>
            <div className="text-xs text-muted-foreground">Idle</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{statistics.error}</div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>
        </div>

        {/* Utilization indicator */}
        {config.maxConcurrentActors && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Actor Utilization</span>
              <span>{statistics.utilizationPercentage}%</span>
            </div>
            <Progress value={statistics.utilizationPercentage} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="actors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="actors">Active Actors</TabsTrigger>
            <TabsTrigger value="types">Available Types</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Active Actors Tab */}
          <TabsContent value="actors" className="mt-4">
            {actors.length > 0 ? (
              <ScrollArea className="h-[400px]" aria-label={ariaLabels.actorList}>
                <div className="grid gap-4">
                  {actors.map((actor) => (
                    <ActorCard
                      key={actor.id}
                      actor={actor}
                      onTerminate={handleTerminateActor}
                      onSendEvent={handleSendEvent}
                      enableCommunication={enableActorCommunication}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Active Actors</h3>
                <p>Spawn your first actor to get started with automated analysis.</p>
              </div>
            )}
          </TabsContent>

          {/* Available Types Tab */}
          <TabsContent value="types" className="mt-4">
            <div className="grid gap-4">
              {availableTypes.map((type) => (
                <Card key={type.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {type.icon}
                      <div>
                        <CardTitle className="text-sm">{type.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {type.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {type.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {type.permissions && type.permissions.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Permissions:</strong> {type.permissions.join(', ')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="mt-4">
            {enablePerformanceMonitoring ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Average Response Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">42ms</div>
                      <div className="text-xs text-muted-foreground">Last 24 hours</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">98.5%</div>
                      <div className="text-xs text-muted-foreground">Last 24 hours</div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Resource Usage by Category</h4>
                  <div className="space-y-2">
                    {Object.entries(statistics.categories).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Performance Monitoring Disabled</h3>
                <p>Enable performance monitoring to view detailed metrics.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Default Export
// =============================================================================

export default ActorSpawningDashboard;