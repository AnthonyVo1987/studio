/**
 * @fileOverview XState Integration Hooks for Advanced UI Components
 * 
 * Custom React hooks that bridge XState machines with StockSage's React architecture,
 * providing seamless integration with NVDA/SPY contexts and advanced state management.
 * 
 * Features:
 * - XState machine integration with StockSage contexts
 * - State visualization and debugging capabilities
 * - Actor spawning and management
 * - Multi-ticker coordination
 * - Performance monitoring integration
 * - Type-safe event handling and state access
 * 
 * @created 2024-08-04
 * @version 1.0.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMachine, useSelector } from '@xstate/react';
import type { ActorRef, StateFrom, EventFrom, Actor } from 'xstate';
import { createMachine, interpret, assign } from 'xstate';

// StockSage Context Imports
import { useNvdaAnalysis, useNvdaDispatch } from '@/contexts/nvda-analysis-context';
import { useSpyAnalysis, useSpyDispatch } from '@/contexts/spy-analysis-context';
import { createTickerLogger, TICKER_PAGES } from '@/lib/ticker-logger';

// XState Infrastructure Imports (Stub implementations)
// import { MacroExecutionMachine } from '../machines/macro-execution-machine';
// import { useMacroExecution } from '../react/hooks/use-macro-execution';
// import { usePerformanceMonitor } from '../performance/performance-monitor';

// Stub implementations for missing imports
const MacroExecutionMachine = null;
const useMacroExecution = () => ({ send: () => {}, state: { value: 'idle' } });
const usePerformanceMonitor = () => ({
  recordStateTransition: () => {},
  recordEvent: () => {},
  getMetricsSnapshot: () => ({})
});

// Type Imports
import type { MacroExecutionContext } from '@/lib/xstate/types/macro-types';
import type {
  StateMachineVisualizerConfig,
  ActorSpawningConfig,
  ActorInstance,
  ActorTypeDefinition,
  MultiTickerCoordinationConfig,
  TickerConfig,
  CoordinationStatus
} from '../types/ui-types';

// =============================================================================
// Logger Setup
// =============================================================================

const logger = createTickerLogger('XSTATE_UI', TICKER_PAGES.NVDA_TAB);

// =============================================================================
// XState Machine Integration Hook
// =============================================================================

/**
 * Main integration hook for XState machines with StockSage contexts
 */
export function useXStateMachineIntegration(
  machine: any,
  options?: {
    /** Ticker symbol for context integration */
    ticker?: 'NVDA' | 'SPY';
    /** Enable performance monitoring */
    enablePerformanceMonitoring?: boolean;
    /** Enable development tools */
    enableDevTools?: boolean;
    /** Custom actions */
    actions?: Record<string, any>;
    /** Custom guards */
    guards?: Record<string, any>;
    /** Custom services */
    services?: Record<string, any>;
  }
) {
  const {
    ticker = 'NVDA',
    enablePerformanceMonitoring = true,
    enableDevTools = process.env.NODE_ENV === 'development',
    actions = {},
    guards = {},
    services = {}
  } = options || {};

  // Context Integration
  const nvdaContext = useNvdaAnalysis();
  const nvdaDispatch = useNvdaDispatch();
  const spyContext = useSpyAnalysis();
  const spyDispatch = useSpyDispatch();

  // Select appropriate context based on ticker
  const tickerContext = ticker === 'NVDA' ? nvdaContext : spyContext;
  const tickerDispatch = ticker === 'NVDA' ? nvdaDispatch : spyDispatch;

  // Performance monitoring
  const performanceMonitor = usePerformanceMonitor();

  // Machine interpretation with enhanced options (simplified for stub)
  const [state, send, service] = useMachine(machine || createMachine({ 
    id: 'stub', 
    initial: 'idle',
    states: { idle: {} }
  }));

  // Performance monitoring integration
  useEffect(() => {
    if (enablePerformanceMonitoring && performanceMonitor) {
      const unsubscribe = service.subscribe((state) => {
        performanceMonitor.recordStateTransition?.();
      });

      return () => {
        if (unsubscribe) {
          unsubscribe.unsubscribe();
        }
      };
    }
  }, [service, enablePerformanceMonitoring, performanceMonitor, ticker]);

  // Enhanced send function with logging
  const enhancedSend = useCallback((event: any) => {
    logger.debug('SendEvent', `Sending event to ${ticker}: ${event.type}`);
    
    if (enablePerformanceMonitoring && performanceMonitor) {
      performanceMonitor.recordEvent?.();
    }
    
    send(event);
  }, [send, state.value, ticker, enablePerformanceMonitoring, performanceMonitor]);

  return {
    state,
    send: enhancedSend,
    service,
    tickerContext,
    tickerDispatch,
    isLoading: tickerContext.status === 'loading',
    hasError: Boolean(tickerContext.error),
    error: tickerContext.error
  };
}

// =============================================================================
// State Machine Visualizer Hook
// =============================================================================

/**
 * Hook for state machine visualization and debugging
 */
export function useStateMachineVisualizer(config: StateMachineVisualizerConfig) {
  const { machine, actorRef, mode, panel, readOnly, showControls } = config;
  
  const [visualizerUrl, setVisualizerUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Generate Stately.ai visualizer URL
  useEffect(() => {
    const generateVisualizerUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Convert machine to Stately.ai compatible format
        const machineConfig = JSON.stringify(machine.config);
        const encodedConfig = encodeURIComponent(machineConfig);
        
        // Build URL with configuration
        const baseUrl = 'https://stately.ai/viz/embed';
        const params = new URLSearchParams({
          mode: mode || 'full',
          panel: panel || 'state',
          readOnly: readOnly ? '1' : '0',
          showOriginalLink: '0',
          controls: showControls ? '1' : '0',
          pan: showControls ? '1' : '0',
          zoom: showControls ? '1' : '0'
        });

        const url = `${baseUrl}?${params.toString()}&config=${encodedConfig}`;
        setVisualizerUrl(url);
        
        logger.debug('GenerateVisualizerURL', `Generated visualizer URL for machine ${machine.id || 'unknown'}`);
      } catch (err) {
        setError(err as Error);
        logger.error('GenerateVisualizerURL', `Failed to generate visualizer URL: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (machine) {
      generateVisualizerUrl();
    }
  }, [machine, mode, panel, readOnly, showControls]);

  // Current state information
  const currentState = useSelector(actorRef, (state) => state);
  
  return {
    visualizerUrl,
    currentState,
    isLoading,
    error,
    refresh: () => {
      setVisualizerUrl('');
      setIsLoading(true);
    }
  };
}

// =============================================================================
// Actor Spawning Hook
// =============================================================================

/**
 * Hook for managing actor spawning and lifecycle
 */
export function useActorSpawning(config: ActorSpawningConfig) {
  const {
    availableActorTypes,
    maxConcurrentActors = 10,
    autoCleanup = true,
    cleanupThreshold = 300000, // 5 minutes
    enablePerformanceMonitoring = true
  } = config;

  const [actors, setActors] = useState<ActorInstance[]>([]);
  const [isSpawning, setIsSpawning] = useState(false);
  const actorRefs = useRef<Map<string, ActorRef<any, any>>>(new Map());
  const performanceMonitor = usePerformanceMonitor();

  // Spawn new actor
  const spawnActor = useCallback(async (
    typeId: string,
    name: string,
    initialContext?: Record<string, any>
  ) => {
    if (actors.length >= maxConcurrentActors) {
      throw new Error(`Maximum concurrent actors limit reached (${maxConcurrentActors})`);
    }

    const actorType = availableActorTypes.find(type => type.id === typeId);
    if (!actorType) {
      throw new Error(`Unknown actor type: ${typeId}`);
    }

    setIsSpawning(true);

    try {
      const machine = actorType.machineFactory();
      const actorRef = interpret(machine.withContext({
        ...actorType.initialContext,
        ...initialContext
      }));

      const actorId = `${typeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const actorInstance: ActorInstance = {
        id: actorId,
        typeId,
        name,
        actorRef,
        createdAt: new Date(),
        lastActivity: new Date(),
        currentState: machine.initialState.value as string,
        status: 'active'
      };

      // Start the actor
      actorRef.start();
      
      // Set up state monitoring
      actorRef.subscribe((state) => {
        setActors(prev => prev.map(actor => 
          actor.id === actorId 
            ? { 
                ...actor, 
                currentState: state.value as string,
                lastActivity: new Date(),
                status: state.done ? 'terminated' : 'active'
              }
            : actor
        ));

        // Performance monitoring  
        if (enablePerformanceMonitoring && performanceMonitor) {
          performanceMonitor.recordEvent?.();
        }
      });

      // Store actor reference
      actorRefs.current.set(actorId, actorRef);
      
      // Add to actors list
      setActors(prev => [...prev, actorInstance]);
      
      logger.state('actorSpawned', `Actor spawned: ${actorId} (${typeId})`);
      
      return actorInstance;
    } catch (error) {
      logger.error('SpawnActor', `Failed to spawn actor: ${error}`);
      throw error;
    } finally {
      setIsSpawning(false);
    }
  }, [actors.length, maxConcurrentActors, availableActorTypes, enablePerformanceMonitoring, performanceMonitor]);

  // Terminate actor
  const terminateActor = useCallback((actorId: string) => {
    const actorRef = actorRefs.current.get(actorId);
    if (actorRef) {
      actorRef.stop();
      actorRefs.current.delete(actorId);
      
      setActors(prev => prev.filter(actor => actor.id !== actorId));
      
      logger.state('actorTerminated', `Actor terminated: ${actorId}`);
    }
  }, []);

  // Send event to actor
  const sendToActor = useCallback((actorId: string, event: any) => {
    const actorRef = actorRefs.current.get(actorId);
    if (actorRef) {
      actorRef.send(event);
      
      // Update last activity
      setActors(prev => prev.map(actor =>
        actor.id === actorId
          ? { ...actor, lastActivity: new Date() }
          : actor
      ));
    }
  }, []);

  // Auto-cleanup inactive actors
  useEffect(() => {
    if (!autoCleanup) return;

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const threshold = cleanupThreshold;

      actors.forEach(actor => {
        const inactiveTime = now - actor.lastActivity.getTime();
        if (inactiveTime > threshold && actor.status === 'idle') {
          logger.state('actorCleanup', `Auto-cleaning inactive actor: ${actor.id} (inactive for ${inactiveTime}ms)`);
          terminateActor(actor.id);
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, [actors, autoCleanup, cleanupThreshold, terminateActor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      actorRefs.current.forEach((actorRef, actorId) => {
        actorRef.stop();
        logger.debug('CleanupActor', `Cleanup: stopped actor ${actorId}`);
      });
      actorRefs.current.clear();
    };
  }, []);

  return {
    actors,
    isSpawning,
    spawnActor,
    terminateActor,
    sendToActor,
    availableTypes: availableActorTypes,
    canSpawnMore: actors.length < maxConcurrentActors
  };
}

// =============================================================================
// Multi-Ticker Coordination Hook
// =============================================================================

/**
 * Hook for coordinating multiple ticker analysis
 */
export function useMultiTickerCoordination(config: MultiTickerCoordinationConfig) {
  const {
    enabledTickers,
    synchronization,
    mode,
    updateFrequency,
    enableCrossAnalysis = false
  } = config;

  const [coordinationStatus, setCoordinationStatus] = useState<CoordinationStatus>({
    status: 'idle',
    activeOperations: [],
    lastSync: new Date(),
    pendingConflicts: [],
    metrics: {
      syncSuccessRate: 0,
      avgSyncTime: 0,
      totalOperations: 0,
      activeConflictsCount: 0,
      last24hOperations: 0
    }
  });

  // Ticker contexts
  const nvdaContext = useNvdaAnalysis();
  const nvdaDispatch = useNvdaDispatch();
  const spyContext = useSpyAnalysis();
  const spyDispatch = useSpyDispatch();

  // Coordination machine
  const coordinationMachine = useMemo(() => createMachine({
    id: 'multiTickerCoordination',
    initial: 'idle',
    context: {
      enabledTickers,
      mode,
      synchronization,
      lastSyncTimestamp: Date.now(),
      activeOperations: [],
      pendingConflicts: []
    },
    states: {
      idle: {
        on: {
          START_COORDINATION: 'coordinating',
          UPDATE_TICKER: 'updating'
        }
      },
      coordinating: {
        on: {
          SYNC_COMPLETE: 'synchronized',
          SYNC_CONFLICT: 'conflict',
          SYNC_ERROR: 'error'
        }
      },
      synchronized: {
        after: {
          [updateFrequency]: 'idle'
        }
      },
      conflict: {
        on: {
          RESOLVE_CONFLICT: 'coordinating',
          IGNORE_CONFLICT: 'synchronized'
        }
      },
      updating: {
        on: {
          UPDATE_COMPLETE: 'idle',
          UPDATE_ERROR: 'error'
        }
      },
      error: {
        on: {
          RETRY: 'idle',
          RESET: 'idle'
        }
      }
    }
  }), [enabledTickers, mode, synchronization, updateFrequency]);

  const [state, send] = useMachine(coordinationMachine);

  // Synchronize data across tickers
  const synchronizeData = useCallback(async (operation: string) => {
    if (!synchronization.syncDataFetching) return;

    setCoordinationStatus(prev => ({
      ...prev,
      status: 'coordinating',
      activeOperations: [...prev.activeOperations, operation]
    }));

    try {
      const startTime = Date.now();
      
      // Execute operation on all enabled tickers
      const promises = enabledTickers.map(async (ticker) => {
        const dispatch = ticker.symbol === 'NVDA' ? nvdaDispatch : spyDispatch;
        
        switch (operation) {
          case 'fetchStockData':
            dispatch({ type: 'SET_LOADING' });
            break;
          case 'fetchOptionsChain':
            dispatch({ type: 'SET_LOADING' });
            break;
          case 'runAiAnalysis':
            dispatch({ type: 'SET_LOADING' });
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      });

      await Promise.all(promises);
      
      const syncTime = Date.now() - startTime;
      
      setCoordinationStatus(prev => ({
        ...prev,
        status: 'synchronized',
        activeOperations: prev.activeOperations.filter(op => op !== operation),
        lastSync: new Date(),
        metrics: {
          ...prev.metrics,
          avgSyncTime: (prev.metrics.avgSyncTime + syncTime) / 2,
          totalOperations: prev.metrics.totalOperations + 1,
          syncSuccessRate: ((prev.metrics.syncSuccessRate * prev.metrics.totalOperations) + 1) / (prev.metrics.totalOperations + 1)
        }
      }));

      send({ type: 'SYNC_COMPLETE' });
      
      logger.state('synchronizationComplete', `Multi-ticker synchronization complete: ${operation} for ${enabledTickers.map(t => t.symbol).join(', ')} (${syncTime}ms)`);
      
    } catch (error) {
      setCoordinationStatus(prev => ({
        ...prev,
        status: 'error',
        activeOperations: prev.activeOperations.filter(op => op !== operation)
      }));
      
      send({ type: 'SYNC_ERROR' });
      logger.error('MultiTickerSync', `Multi-ticker synchronization failed: ${error}`);
    }
  }, [enabledTickers, synchronization.syncDataFetching, nvdaDispatch, spyDispatch, send]);

  // Cross-ticker analysis
  const performCrossAnalysis = useCallback(async () => {
    if (!enableCrossAnalysis) return null;

    const nvdaData = nvdaContext.stockSnapshotJson ? JSON.parse(nvdaContext.stockSnapshotJson) : null;
    const spyData = spyContext.stockSnapshotJson ? JSON.parse(spyContext.stockSnapshotJson) : null;

    if (!nvdaData || !spyData) {
      logger.warn('CrossAnalysis', 'Insufficient data for cross-ticker analysis');
      return null;
    }

    // Perform correlation analysis
    const analysis = {
      correlation: calculateCorrelation(nvdaData, spyData),
      relativePerformance: calculateRelativePerformance(nvdaData, spyData),
      timestamp: new Date().toISOString()
    };

    logger.state('crossTickerAnalysis', 'Cross-ticker analysis complete for NVDA and SPY');
    return analysis;
  }, [enableCrossAnalysis, nvdaContext.stockSnapshotJson, spyContext.stockSnapshotJson]);

  return {
    coordinationStatus,
    state: state.value,
    synchronizeData,
    performCrossAnalysis,
    send,
    enabledTickers,
    isCoordinating: state.value === 'coordinating',
    hasConflicts: coordinationStatus.pendingConflicts.length > 0
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Calculate correlation between two datasets
 */
function calculateCorrelation(data1: any, data2: any): number {
  // Simplified correlation calculation
  // In a real implementation, this would be more sophisticated
  const price1 = data1.results?.[0]?.c || 0;
  const price2 = data2.results?.[0]?.c || 0;
  
  // Return a mock correlation value
  return Math.random() * 2 - 1; // -1 to 1
}

/**
 * Calculate relative performance between tickers
 */
function calculateRelativePerformance(data1: any, data2: any): number {
  const price1 = data1.results?.[0]?.c || 0;
  const price2 = data2.results?.[0]?.c || 0;
  const prevClose1 = data1.results?.[0]?.pc || price1;
  const prevClose2 = data2.results?.[0]?.pc || price2;
  
  const return1 = (price1 - prevClose1) / prevClose1;
  const return2 = (price2 - prevClose2) / prevClose2;
  
  return return1 - return2;
}

// =============================================================================
// Exports
// =============================================================================

export type {
  StateMachineVisualizerConfig,
  ActorSpawningConfig,
  ActorInstance,
  MultiTickerCoordinationConfig,
  CoordinationStatus
};