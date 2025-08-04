/**
 * @fileoverview XState React Context Provider
 * 
 * Provides global XState context for sharing machine instances, actor management,
 * and system-wide configuration across React components.
 */

'use client';

import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { createActorContext } from '@xstate/react';
import type { ReactNode } from 'react';
import type { AnyActorRef, AnyStateMachine } from 'xstate';
import { 
  createActorSystem, 
  createActorFactory,
  ActorDebugUtils,
  type ActorInstance,
  type SupportedTicker 
} from '@/lib/xstate/actors';
import { 
  createMacroExecutionMachine, 
  initializeXStateMacroSystem,
  globalLogger 
} from '@/lib/xstate';

// Global XState system configuration
export interface XStateSystemConfig {
  /** Enable debug mode globally */
  debugMode?: boolean;
  /** Enable XState inspector integration */
  enableInspection?: boolean;
  /** Maximum number of actors to maintain */
  maxActors?: number;
  /** Actor cleanup interval (ms) */
  cleanupInterval?: number;
  /** Global timeout configurations */
  timeouts?: {
    default?: number;
    dataFetch?: number;
    aiGeneration?: number;
  };
  /** Performance monitoring settings */
  monitoring?: {
    enableMetrics?: boolean;
    metricsInterval?: number;
  };
}

// XState system context value
export interface XStateSystemContextValue {
  /** Actor management system */
  system: ReturnType<typeof createActorSystem>;
  /** Actor factory for creating new actors */
  factory: ReturnType<typeof createActorFactory>;
  /** System configuration */
  config: XStateSystemConfig;
  /** System status */
  status: {
    isInitialized: boolean;
    activeActors: number;
    totalActors: number;
    systemHealth: 'healthy' | 'degraded' | 'error';
    lastError?: Error;
  };
  /** System controls */
  controls: {
    /** Create a new macro execution actor */
    createMacroActor: (ticker: SupportedTicker, options?: any) => Promise<ActorInstance>;
    /** Get an existing actor by ID */
    getActor: (actorId: string) => ActorInstance | undefined;
    /** Remove an actor */
    removeActor: (actorId: string, reason?: string) => Promise<void>;
    /** Get system metrics */
    getSystemMetrics: () => any;
    /** Clean up inactive actors */
    cleanupActors: () => Promise<void>;
    /** Reset entire system */
    resetSystem: () => Promise<void>;
  };
  /** Debug utilities */
  debug: {
    /** Log system diagnostics */
    logDiagnostics: () => void;
    /** Export system state */
    exportSystemState: () => any;
    /** Enable/disable debug mode */
    setDebugMode: (enabled: boolean) => void;
  };
}

// Create context
const XStateSystemContext = createContext<XStateSystemContextValue | null>(null);

// Provider props
export interface XStateProviderProps {
  children: ReactNode;
  config?: XStateSystemConfig;
}

/**
 * Global XState system provider
 */
export function XStateProvider({ children, config = {} }: XStateProviderProps) {
  const {
    debugMode = process.env.NODE_ENV === 'development',
    enableInspection = debugMode,
    maxActors = 10,
    cleanupInterval = 300000, // 5 minutes
    timeouts = {},
    monitoring = {},
  } = config;

  // Initialize system state
  const [system] = useState(() => {
    if (debugMode) {
      initializeXStateMacroSystem();
    }
    return createActorSystem({ enableDebug: debugMode });
  });

  const [factory] = useState(() => createActorFactory(system.manager, system.registry));
  const [status, setStatus] = useState({
    isInitialized: false,
    activeActors: 0,
    totalActors: 0,
    systemHealth: 'healthy' as const,
    lastError: undefined as Error | undefined,
  });

  // Initialize system
  useEffect(() => {
    const initialize = async () => {
      try {
        globalLogger.info('Initializing XState React system');
        setStatus(prev => ({ ...prev, isInitialized: true }));
      } catch (error) {
        globalLogger.error('Failed to initialize XState system:', error);
        setStatus(prev => ({ 
          ...prev, 
          systemHealth: 'error',
          lastError: error as Error 
        }));
      }
    };

    initialize();
  }, []);

  // Update system status periodically
  useEffect(() => {
    const updateStatus = () => {
      try {
        const metrics = system.getSystemMetrics();
        setStatus(prev => ({
          ...prev,
          activeActors: metrics.manager.activeActors || 0,
          totalActors: metrics.registry.totalActors || 0,
          systemHealth: prev.lastError ? 'error' : 'healthy',
        }));
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          systemHealth: 'error',
          lastError: error as Error,
        }));
      }
    };

    const interval = setInterval(updateStatus, monitoring.metricsInterval || 5000);
    updateStatus(); // Initial update

    return () => clearInterval(interval);
  }, [system, monitoring.metricsInterval]);

  // Cleanup inactive actors periodically
  useEffect(() => {
    const cleanup = async () => {
      try {
        const actors = system.registry.getAll();
        const inactiveActors = actors.filter((actor: any) => 
          actor.lifecycleState === 'stopped' || 
          (actor.stoppedAt && Date.now() - actor.stoppedAt > cleanupInterval)
        );

        for (const actor of inactiveActors) {
          await system.manager.removeActor(actor.identity.id);
        }

        if (inactiveActors.length > 0 && debugMode) {
          globalLogger.debug(`Cleaned up ${inactiveActors.length} inactive actors`);
        }
      } catch (error) {
        globalLogger.error('Actor cleanup failed:', error);
      }
    };

    const interval = setInterval(cleanup, cleanupInterval);
    return () => clearInterval(interval);
  }, [system, cleanupInterval, debugMode]);

  // System controls
  const controls = useMemo(() => ({
    createMacroActor: async (ticker: SupportedTicker, options: any = {}) => {
      try {
        const contextHooks = options.contextHooks || {};
        const actor = await factory.createMacroExecutionActor(ticker, contextHooks, {
          autoStart: options.autoStart ?? true,
          timeout: options.timeout ?? timeouts.default ?? 45000,
          maxRetries: options.maxRetries ?? 2,
          enableDebug: options.enableDebug ?? debugMode,
        });

        if (debugMode) {
          globalLogger.debug('Created macro actor:', { 
            id: actor.identity.id, 
            ticker,
            options 
          });
        }

        return actor;
      } catch (error) {
        globalLogger.error('Failed to create macro actor:', error);
        setStatus(prev => ({ ...prev, lastError: error as Error }));
        throw error;
      }
    },

    getActor: (actorId: string) => {
      return system.getActor(actorId);
    },

    removeActor: async (actorId: string, reason = 'Manual removal') => {
      try {
        await system.manager.stopActor(actorId, reason);
        await system.manager.removeActor(actorId);
        
        if (debugMode) {
          globalLogger.debug('Removed actor:', { actorId, reason });
        }
      } catch (error) {
        globalLogger.error('Failed to remove actor:', error);
        throw error;
      }
    },

    getSystemMetrics: () => system.getSystemMetrics(),

    cleanupActors: async () => {
      const actors = system.registry.getAll();
      const stoppedActors = actors.filter((actor: any) => actor.lifecycleState === 'stopped');
      
      for (const actor of stoppedActors) {
        await system.manager.removeActor(actor.identity.id);
      }

      return stoppedActors.length;
    },

    resetSystem: async () => {
      try {
        await system.cleanup();
        setStatus({
          isInitialized: true,
          activeActors: 0,
          totalActors: 0,
          systemHealth: 'healthy',
          lastError: undefined,
        });
        
        globalLogger.info('XState system reset completed');
      } catch (error) {
        globalLogger.error('System reset failed:', error);
        throw error;
      }
    },
  }), [factory, system, timeouts, debugMode]);

  // Debug utilities
  const debug = useMemo(() => ({
    logDiagnostics: () => {
      ActorDebugUtils.logDiagnostics(system);
    },

    exportSystemState: () => {
      return {
        config: { debugMode, enableInspection, maxActors, timeouts, monitoring },
        status,
        metrics: system.getSystemMetrics(),
        actors: system.registry.getAll().map((actor: any) => ({
          id: actor.identity.id,
          ticker: actor.identity.ticker,
          type: actor.identity.type,
          state: actor.lifecycleState,
          createdAt: actor.identity.createdAt,
          startedAt: actor.startedAt,
          metrics: actor.metrics,
        })),
        timestamp: Date.now(),
      };
    },

    setDebugMode: (enabled: boolean) => {
      if (enabled !== debugMode) {
        globalLogger.info(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
        // This would update the system configuration
        // For now, we just log the change
      }
    },
  }), [system, status, debugMode, enableInspection, maxActors, timeouts, monitoring]);

  // Context value
  const contextValue = useMemo<XStateSystemContextValue>(() => ({
    system,
    factory,
    config: { debugMode, enableInspection, maxActors, cleanupInterval, timeouts, monitoring },
    status,
    controls,
    debug,
  }), [system, factory, debugMode, enableInspection, maxActors, cleanupInterval, timeouts, monitoring, status, controls, debug]);

  return (
    <XStateSystemContext.Provider value={contextValue}>
      {children}
    </XStateSystemContext.Provider>
  );
}

/**
 * Hook to access XState system context
 */
export function useXStateSystem(): XStateSystemContextValue {
  const context = useContext(XStateSystemContext);
  if (!context) {
    throw new Error('useXStateSystem must be used within an XStateProvider');
  }
  return context;
}

/**
 * Hook to access only the actor system
 */
export function useActorSystem() {
  const { system } = useXStateSystem();
  return system;
}

/**
 * Hook to access only the actor factory
 */
export function useActorFactory() {
  const { factory } = useXStateSystem();
  return factory;
}

/**
 * Specialized hook for macro actor management
 */
export function useMacroActorManager() {
  const { controls, status } = useXStateSystem();
  
  return {
    createMacroActor: controls.createMacroActor,
    getActor: controls.getActor,
    removeActor: controls.removeActor,
    activeActors: status.activeActors,
    systemHealth: status.systemHealth,
  };
}

/**
 * Hook for system monitoring and diagnostics
 */
export function useXStateSystemMonitoring() {
  const { status, controls, debug } = useXStateSystem();
  
  return {
    status,
    metrics: controls.getSystemMetrics,
    diagnostics: debug.logDiagnostics,
    exportState: debug.exportSystemState,
    cleanup: controls.cleanupActors,
    reset: controls.resetSystem,
  };
}

/**
 * Create actor context for specific machine types
 * This provides a way to create typed contexts for specific machines
 */
export function createXStateMachineContext<TMachine extends AnyStateMachine>(
  machine: TMachine,
  contextId: string
) {
  const MachineContext = createActorContext(machine);
  
  // Wrap with custom provider that integrates with our system
  const WrappedProvider = ({ children, ...props }: { children: ReactNode; [key: string]: any }) => {
    const system = useXStateSystem();
    
    return (
      <MachineContext.Provider {...props}>
        {children}
      </MachineContext.Provider>
    );
  };

  return {
    Provider: WrappedProvider,
    useActor: MachineContext.useActor,
    useSelector: MachineContext.useSelector,
    useActorRef: MachineContext.useActorRef,
    contextId,
  };
}

/**
 * Default export for convenience
 */
export default XStateProvider;