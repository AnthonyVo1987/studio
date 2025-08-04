/**
 * @fileoverview XState Actor Management React Hook
 * 
 * Provides React integration for XState actor lifecycle management,
 * leveraging the existing actor management infrastructure from Phase 2.
 */

import { useActor } from '@xstate/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnyActorRef, SnapshotFrom } from 'xstate';
import type { 
  ActorInstance, 
  ActorConfig, 
  ActorEvent, 
  ActorLifecycleState,
  SupportedTicker,
  TickerContextHooks 
} from '@/lib/xstate/actors';
import { 
  createActorSystem, 
  createActorFactory, 
  getGlobalActorManager,
  getGlobalEventBroadcaster 
} from '@/lib/xstate/actors';
import { globalLogger } from '@/lib/xstate';

export interface ActorConfig {
  /** Unique identifier for the actor */
  actorId?: string;
  /** Ticker symbol for financial data actors */
  ticker?: SupportedTicker;
  /** Actor type classification */
  type?: 'macro-execution' | 'data-fetcher' | 'ai-analyzer' | 'custom';
  /** Auto-start the actor on creation */
  autoStart?: boolean;
  /** Auto-cleanup on component unmount */
  autoCleanup?: boolean;
  /** Actor-specific options */
  options?: {
    timeout?: number;
    maxRetries?: number;
    enableDebug?: boolean;
  };
  /** Context hooks for StockSage integration */
  contextHooks?: TickerContextHooks;
  /** Event handlers */
  eventHandlers?: {
    onStateChange?: (snapshot: any) => void;
    onError?: (error: Error) => void;
    onCreate?: (actorInstance: ActorInstance) => void;
    onStart?: (actorInstance: ActorInstance) => void;
    onStop?: (actorInstance: ActorInstance) => void;
  };
}

export interface XStateActorResult {
  /** Current actor snapshot */
  snapshot: any;
  /** Send events to the actor */
  send: (event: any) => void;
  /** Actor reference for advanced usage */
  actorRef: AnyActorRef;
  /** Actor instance from the management system */
  actorInstance: ActorInstance | null;
  /** Actor lifecycle state */
  lifecycleState: ActorLifecycleState;
  /** Actor metadata */
  meta: {
    id: string;
    ticker?: SupportedTicker;
    type: string;
    isRunning: boolean;
    isHealthy: boolean;
    uptime: number;
    createdAt: number;
    startedAt?: number;
    stoppedAt?: number;
  };
  /** Actor control methods */
  controls: {
    start: () => Promise<void>;
    stop: (reason?: string) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    restart: () => Promise<void>;
    getStatus: () => any;
  };
  /** Performance and monitoring */
  metrics: {
    messagesSent: number;
    messagesReceived: number;
    errorCount: number;
    averageResponseTime: number;
    lastActivityAt: number;
  };
  /** Debug utilities */
  debug: {
    logSnapshot: () => void;
    logMetrics: () => void;
    logLifecycle: () => void;
    exportDiagnostics: () => any;
  };
}

/**
 * Core XState actor management hook
 */
export function useXStateActor(config: ActorConfig): XStateActorResult {
  const {
    actorId,
    ticker = 'NVDA',
    type = 'macro-execution',
    autoStart = true,
    autoCleanup = true,
    options = {},
    contextHooks,
    eventHandlers,
  } = config;

  // Actor management system
  const [actorSystem] = useState(() => createActorSystem({ enableDebug: options.enableDebug }));
  const [actorFactory] = useState(() => createActorFactory(actorSystem.manager, actorSystem.registry));
  
  // Actor instance state
  const [actorInstance, setActorInstance] = useState<ActorInstance | null>(null);
  const [lifecycleState, setLifecycleState] = useState<ActorLifecycleState>('created');
  
  // Performance tracking
  const metricsRef = useRef({
    messagesSent: 0,
    messagesReceived: 0,
    errorCount: 0,
    responseTimes: [] as number[],
    lastActivityAt: Date.now(),
  });

  // Create unique actor ID if not provided
  const finalActorId = useMemo(() => 
    actorId || `${type}-${ticker.toLowerCase()}-${Date.now()}`,
    [actorId, type, ticker]
  );

  // Initialize actor instance
  useEffect(() => {
    let mounted = true;

    const initializeActor = async () => {
      try {
        globalLogger.debug('Initializing XState actor:', { id: finalActorId, ticker, type });
        
        const instance = await actorFactory.createMacroExecutionActor(
          ticker,
          contextHooks || {} as any,
          {
            autoStart: false, // We'll control start manually
            timeout: options.timeout,
            maxRetries: options.maxRetries,
            enableDebug: options.enableDebug,
          }
        );

        if (!mounted) return;

        setActorInstance(instance);
        setLifecycleState(instance.lifecycleState);
        
        // Call onCreate handler
        eventHandlers?.onCreate?.(instance);

        // Auto-start if configured
        if (autoStart) {
          await actorSystem.manager.startActor(instance.identity.id);
          if (mounted) {
            setLifecycleState('running');
            eventHandlers?.onStart?.(instance);
          }
        }

      } catch (error) {
        globalLogger.error('Failed to initialize XState actor:', error);
        eventHandlers?.onError?.(error as Error);
        if (mounted) {
          metricsRef.current.errorCount++;
        }
      }
    };

    initializeActor();

    return () => {
      mounted = false;
    };
  }, [finalActorId, ticker, type, autoStart, options, contextHooks, eventHandlers, actorFactory, actorSystem]);

  // Subscribe to actor events
  useEffect(() => {
    if (!actorInstance) return;

    const unsubscribe = actorSystem.subscribeToEvents('ACTOR_STATE_CHANGED', (event: ActorEvent) => {
      if (event.actorId === actorInstance.identity.id) {
        setLifecycleState(event.newState as ActorLifecycleState);
        metricsRef.current.lastActivityAt = Date.now();
        
        // Get updated snapshot for state change handler
        const updatedInstance = actorSystem.getActor(event.actorId);
        if (updatedInstance) {
          const snapshot = updatedInstance.actorRef.getSnapshot();
          eventHandlers?.onStateChange?.(snapshot);
        }
      }
    });

    return unsubscribe;
  }, [actorInstance, actorSystem, eventHandlers]);

  // Use @xstate/react useActor hook for snapshot management
  const [snapshot, send] = useActor(
    actorInstance?.actorRef || ({ send: () => {}, getSnapshot: () => ({}) } as any),
    (actor) => actor.getSnapshot?.() || {}
  );

  // Wrap send function with metrics tracking
  const trackedSend = useCallback((event: any) => {
    const startTime = Date.now();
    metricsRef.current.messagesSent++;
    metricsRef.current.lastActivityAt = startTime;
    
    try {
      send(event);
      // Track response time (simplified - actual response would need event correlation)
      const responseTime = Date.now() - startTime;
      metricsRef.current.responseTimes.push(responseTime);
      if (metricsRef.current.responseTimes.length > 100) {
        metricsRef.current.responseTimes = metricsRef.current.responseTimes.slice(-100);
      }
    } catch (error) {
      metricsRef.current.errorCount++;
      eventHandlers?.onError?.(error as Error);
      throw error;
    }
  }, [send, eventHandlers]);

  // Actor control methods
  const controls = useMemo(() => ({
    start: async () => {
      if (!actorInstance) return;
      await actorSystem.manager.startActor(actorInstance.identity.id);
      eventHandlers?.onStart?.(actorInstance);
    },

    stop: async (reason?: string) => {
      if (!actorInstance) return;
      await actorSystem.manager.stopActor(actorInstance.identity.id, reason);
      eventHandlers?.onStop?.(actorInstance);
    },

    pause: async () => {
      if (!actorInstance) return;
      await actorSystem.manager.pauseActor(actorInstance.identity.id);
    },

    resume: async () => {
      if (!actorInstance) return;
      await actorSystem.manager.resumeActor(actorInstance.identity.id);
    },

    restart: async () => {
      if (!actorInstance) return;
      await actorSystem.manager.stopActor(actorInstance.identity.id, 'Restarting');
      await actorSystem.manager.startActor(actorInstance.identity.id);
    },

    getStatus: () => {
      if (!actorInstance) return null;
      return actorSystem.manager.getActorStatus(actorInstance.identity.id);
    },
  }), [actorInstance, actorSystem, eventHandlers]);

  // Actor metadata
  const meta = useMemo(() => {
    if (!actorInstance) {
      return {
        id: finalActorId,
        ticker,
        type,
        isRunning: false,
        isHealthy: false,
        uptime: 0,
        createdAt: Date.now(),
      };
    }

    const now = Date.now();
    const uptime = actorInstance.startedAt ? now - actorInstance.startedAt : 0;
    const isRunning = lifecycleState === 'running';
    const isHealthy = lifecycleState === 'running' && metricsRef.current.errorCount === 0;

    return {
      id: actorInstance.identity.id,
      ticker: actorInstance.identity.ticker,
      type: actorInstance.identity.type,
      isRunning,
      isHealthy,
      uptime,
      createdAt: actorInstance.identity.createdAt,
      startedAt: actorInstance.startedAt,
      stoppedAt: actorInstance.stoppedAt,
    };
  }, [actorInstance, lifecycleState, finalActorId, ticker, type]);

  // Performance metrics
  const metrics = useMemo(() => {
    const times = metricsRef.current.responseTimes;
    const averageResponseTime = times.length > 0 
      ? times.reduce((sum, time) => sum + time, 0) / times.length 
      : 0;

    return {
      messagesSent: metricsRef.current.messagesSent,
      messagesReceived: metricsRef.current.messagesReceived,
      errorCount: metricsRef.current.errorCount,
      averageResponseTime,
      lastActivityAt: metricsRef.current.lastActivityAt,
    };
  }, []);

  // Debug utilities
  const debug = useMemo(() => ({
    logSnapshot: () => {
      console.group(`🎭 Actor Snapshot - ${meta.id}`);
      console.log('Snapshot:', snapshot);
      console.log('Lifecycle State:', lifecycleState);
      console.log('Meta:', meta);
      console.groupEnd();
    },

    logMetrics: () => {
      console.log(`📊 Actor Metrics - ${meta.id}:`, metrics);
    },

    logLifecycle: () => {
      console.group(`♻️ Actor Lifecycle - ${meta.id}`);
      console.log('Current State:', lifecycleState);
      console.log('Created At:', new Date(meta.createdAt));
      console.log('Started At:', meta.startedAt ? new Date(meta.startedAt) : 'Not started');
      console.log('Uptime:', `${meta.uptime}ms`);
      console.log('Is Healthy:', meta.isHealthy);
      console.groupEnd();
    },

    exportDiagnostics: () => ({
      id: meta.id,
      ticker: meta.ticker,
      type: meta.type,
      lifecycleState,
      meta,
      metrics,
      snapshot: snapshot ? { value: snapshot.value, context: snapshot.context } : null,
      timestamp: Date.now(),
    }),
  }), [snapshot, lifecycleState, meta, metrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCleanup && actorInstance) {
        actorSystem.manager.stopActor(actorInstance.identity.id, 'Component unmounted')
          .catch(error => globalLogger.error('Failed to cleanup actor on unmount:', error));
      }
    };
  }, [autoCleanup, actorInstance, actorSystem]);

  return {
    snapshot,
    send: trackedSend,
    actorRef: actorInstance?.actorRef || ({ send: () => {} } as any),
    actorInstance,
    lifecycleState,
    meta,
    controls,
    metrics,
    debug,
  };
}

/**
 * Specialized hook for macro execution actors
 */
export function useMacroExecutionActor(
  ticker: SupportedTicker,
  contextHooks: TickerContextHooks,
  options?: Omit<ActorConfig, 'ticker' | 'type' | 'contextHooks'> & {
    onMacroComplete?: (result: any) => void;
    onMacroError?: (error: Error, step?: string) => void;
    onStepComplete?: (step: string, result: any) => void;
  }
) {
  const { onMacroComplete, onMacroError, onStepComplete, ...actorOptions } = options || {};

  const result = useXStateActor({
    ...actorOptions,
    ticker,
    type: 'macro-execution',
    contextHooks,
    eventHandlers: {
      ...actorOptions.eventHandlers,
      onStateChange: (snapshot) => {
        // Handle macro-specific state changes
        if (snapshot.matches?.('completed')) {
          onMacroComplete?.(snapshot.context);
        } else if (snapshot.matches?.('failed')) {
          onMacroError?.(snapshot.context?.error, snapshot.context?.currentStep);
        } else if (snapshot.context?.lastCompletedStep) {
          onStepComplete?.(snapshot.context.lastCompletedStep, snapshot.context.stepResults);
        }
        
        actorOptions.eventHandlers?.onStateChange?.(snapshot);
      },
      onError: (error) => {
        onMacroError?.(error);
        actorOptions.eventHandlers?.onError?.(error);
      },
    },
  });

  return {
    ...result,
    // Macro-specific methods
    startMacroExecution: () => result.send({ type: 'START_MACRO' }),
    pauseMacroExecution: () => result.send({ type: 'PAUSE' }),
    resumeMacroExecution: () => result.send({ type: 'RESUME' }),
    cancelMacroExecution: (reason?: string) => result.send({ type: 'CANCEL', reason }),
    selectExpiration: (expiration: string) => result.send({ type: 'SELECT_EXPIRATION', expiration }),
    
    // Macro state checks
    isExecutingMacro: () => result.snapshot?.matches?.('executing'),
    isMacroCompleted: () => result.snapshot?.matches?.('completed'),
    isMacroFailed: () => result.snapshot?.matches?.('failed'),
    getCurrentStep: () => result.snapshot?.context?.currentStep,
    getStepResults: () => result.snapshot?.context?.stepResults,
    getMacroProgress: () => result.snapshot?.context?.progress,
  };
}

/**
 * Hook for managing multiple actors as a group
 */
export function useXStateActorGroup(configs: ActorConfig[]) {
  const [actors, setActors] = useState<XStateActorResult[]>([]);
  
  // This would manage multiple actors as a coordinated group
  // Implementation would depend on specific use cases
  
  return {
    actors,
    startAll: () => Promise.all(actors.map(actor => actor.controls.start())),
    stopAll: () => Promise.all(actors.map(actor => actor.controls.stop())),
    getGroupMetrics: () => ({
      totalActors: actors.length,
      runningActors: actors.filter(actor => actor.meta.isRunning).length,
      healthyActors: actors.filter(actor => actor.meta.isHealthy).length,
      totalMessages: actors.reduce((sum, actor) => sum + actor.metrics.messagesSent, 0),
      totalErrors: actors.reduce((sum, actor) => sum + actor.metrics.errorCount, 0),
    }),
  };
}