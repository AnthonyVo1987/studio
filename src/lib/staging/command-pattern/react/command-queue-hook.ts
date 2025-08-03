/**
 * @fileOverview React Hook for Command Queue Management - Enterprise Implementation
 * 
 * Provides React hooks for integrating the command pattern with React components,
 * including state management, event handling, and performance monitoring.
 * 
 * FEATURES:
 * - React-friendly command queue management
 * - Real-time event subscription and cleanup
 * - Performance metrics and monitoring integration
 * - Error handling with user-friendly messages
 * - TypeScript support with comprehensive type safety
 * - Memory leak prevention with proper cleanup
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { EnhancedMacroCommandQueue, QueueEvent, QueueMetrics } from '../queue/enhanced-command-queue';
import { MacroCommand, MacroExecutionContext, SecurityContext } from '../interfaces/command';

// Type-safe cleanup function storage
const cleanupMap = new WeakMap<EnhancedMacroCommandQueue, () => void>();

// ===============================
// HOOK TYPES AND INTERFACES
// ===============================

export interface CommandQueueState {
  isExecuting: boolean;
  isPaused: boolean;
  isCancelled: boolean;
  currentCommandIndex: number;
  totalCommands: number;
  completedCommands: number;
  failedCommands: number;
  progress: number; // 0-100
  error: string | null;
  lastEvent: QueueEvent | null;
  metrics: QueueMetrics;
}

export interface CommandQueueActions {
  execute: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  addCommand: (command: MacroCommand) => void;
  addCommands: (commands: MacroCommand[]) => void;
  removeCommand: (commandId: string) => boolean;
  clearQueue: () => void;
  retry: () => Promise<void>;
}

export interface UseCommandQueueOptions {
  autoCleanup?: boolean;
  eventHistoryLimit?: number;
  enablePerformanceMonitoring?: boolean;
  onEvent?: (event: QueueEvent) => void;
  onError?: (error: Error) => void;
  onComplete?: (metrics: QueueMetrics) => void;
}

export interface UseCommandQueueReturn {
  state: CommandQueueState;
  actions: CommandQueueActions;
  queue: EnhancedMacroCommandQueue | null;
  events: QueueEvent[];
}

// ===============================
// MAIN HOOK IMPLEMENTATION
// ===============================

export function useCommandQueue(
  context: MacroExecutionContext,
  securityContext: SecurityContext,
  options: UseCommandQueueOptions = {}
): UseCommandQueueReturn {
  const {
    autoCleanup = true,
    eventHistoryLimit = 50,
    enablePerformanceMonitoring = true,
    onEvent,
    onError,
    onComplete
  } = options;

  // Queue instance (stable reference)
  const queueRef = useRef<EnhancedMacroCommandQueue | null>(null);
  
  // Event history
  const [events, setEvents] = useState<QueueEvent[]>([]);
  
  // Queue state
  const [state, setState] = useState<CommandQueueState>({
    isExecuting: false,
    isPaused: false,
    isCancelled: false,
    currentCommandIndex: 0,
    totalCommands: 0,
    completedCommands: 0,
    failedCommands: 0,
    progress: 0,
    error: null,
    lastEvent: null,
    metrics: {
      totalCommands: 0,
      completedCommands: 0,
      failedCommands: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      memoryUsage: 0,
      successRate: 0
    }
  });

  // Initialize queue
  useEffect(() => {
    if (!queueRef.current) {
      queueRef.current = new EnhancedMacroCommandQueue(
        context,
        securityContext,
        undefined,
        {
          enablePerformanceMonitoring,
          maxHistorySize: eventHistoryLimit,
          enableDistributedTracing: true,
          enableSecurityValidation: true,
          maxConcurrentCommands: 4,
          memoryThreshold: 50 * 1024 * 1024
        }
      );

      // Set up event listeners
      setupEventListeners(queueRef.current);
    }

    return () => {
      if (autoCleanup && queueRef.current) {
        cleanup();
      }
    };
  }, [context, securityContext, enablePerformanceMonitoring, eventHistoryLimit, autoCleanup]);

  // Event listener setup
  const setupEventListeners = useCallback((queue: EnhancedMacroCommandQueue) => {
    const handleEvent = (event: QueueEvent) => {
      // Update events history
      setEvents(prev => {
        const newEvents = [...prev, event];
        return newEvents.slice(-eventHistoryLimit);
      });

      // Update state based on event
      setState(prev => {
        const newState = { ...prev };
        
        switch (event.type) {
          case 'started':
            newState.isExecuting = true;
            newState.isPaused = false;
            newState.isCancelled = false;
            newState.error = null;
            newState.progress = 0;
            break;
            
          case 'stepStarted':
            newState.currentCommandIndex = event.commandIndex || 0;
            newState.progress = queue.getQueueSize() > 0 
              ? Math.round((newState.currentCommandIndex / queue.getQueueSize()) * 100)
              : 0;
            break;
            
          case 'stepCompleted':
            newState.completedCommands = prev.completedCommands + 1;
            newState.progress = queue.getQueueSize() > 0 
              ? Math.round(((event.commandIndex || 0) + 1) / queue.getQueueSize() * 100)
              : 100;
            break;
            
          case 'stepFailed':
            newState.failedCommands = prev.failedCommands + 1;
            newState.error = event.error?.message || 'Command failed';
            break;
            
          case 'completed':
            newState.isExecuting = false;
            newState.progress = 100;
            newState.metrics = queue.getMetrics();
            if (onComplete) {
              onComplete(newState.metrics);
            }
            break;
            
          case 'cancelled':
            newState.isExecuting = false;
            newState.isCancelled = true;
            break;
            
          case 'paused':
            newState.isPaused = true;
            break;
            
          case 'resumed':
            newState.isPaused = false;
            break;
        }
        
        newState.lastEvent = event;
        newState.totalCommands = queue.getQueueSize();
        
        return newState;
      });

      // Call external event handler
      if (onEvent) {
        onEvent(event);
      }
    };

    // Subscribe to all queue events
    queue.on('queueEvent', handleEvent);

    // Handle errors
    queue.on('error', (error: Error) => {
      setState(prev => ({
        ...prev,
        error: error.message,
        isExecuting: false
      }));
      
      if (onError) {
        onError(error);
      }
    });

    // Handle memory threshold exceeded
    queue.on('memoryThresholdExceeded', (event: any) => {
      console.warn('Command queue memory threshold exceeded', event);
    });

    // Store cleanup function using a WeakMap for type safety
    if (!cleanupMap.has(queue)) {
      const cleanupFn = () => {
        queue.removeAllListeners();
      };
      cleanupMap.set(queue, cleanupFn);
    };

  }, [eventHistoryLimit, onEvent, onError, onComplete]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (queueRef.current) {
      const cleanupFn = cleanupMap.get(queueRef.current);
      if (cleanupFn) {
        cleanupFn();
        cleanupMap.delete(queueRef.current);
      }
      queueRef.current = null;
    }
  }, []);

  // Action implementations
  const actions: CommandQueueActions = {
    execute: useCallback(async () => {
      if (!queueRef.current) {
        throw new Error('Queue not initialized');
      }
      
      try {
        await queueRef.current.execute();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isExecuting: false
        }));
        throw error;
      }
    }, []),

    pause: useCallback(() => {
      if (queueRef.current) {
        queueRef.current.pause();
      }
    }, []),

    resume: useCallback(() => {
      if (queueRef.current) {
        queueRef.current.resume();
      }
    }, []),

    cancel: useCallback(() => {
      if (queueRef.current) {
        queueRef.current.cancel();
      }
    }, []),

    addCommand: useCallback((command: MacroCommand) => {
      if (queueRef.current) {
        queueRef.current.addCommand(command);
        setState(prev => ({
          ...prev,
          totalCommands: queueRef.current!.getQueueSize()
        }));
      }
    }, []),

    addCommands: useCallback((commands: MacroCommand[]) => {
      if (queueRef.current) {
        queueRef.current.addCommands(commands);
        setState(prev => ({
          ...prev,
          totalCommands: queueRef.current!.getQueueSize()
        }));
      }
    }, []),

    removeCommand: useCallback((commandId: string) => {
      if (queueRef.current) {
        const removed = queueRef.current.removeCommand(commandId);
        if (removed) {
          setState(prev => ({
            ...prev,
            totalCommands: queueRef.current!.getQueueSize()
          }));
        }
        return removed;
      }
      return false;
    }, []),

    clearQueue: useCallback(() => {
      if (queueRef.current) {
        queueRef.current.clearQueue();
        setState(prev => ({
          ...prev,
          totalCommands: 0,
          completedCommands: 0,
          failedCommands: 0,
          progress: 0,
          error: null
        }));
      }
    }, []),

    retry: useCallback(async () => {
      if (!queueRef.current) {
        throw new Error('Queue not initialized');
      }

      // Reset error state
      setState(prev => ({
        ...prev,
        error: null,
        isCancelled: false
      }));

      // Re-execute the queue
      try {
        await queueRef.current.execute();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isExecuting: false
        }));
        throw error;
      }
    }, [])
  };

  return {
    state,
    actions,
    queue: queueRef.current,
    events
  };
}

// ===============================
// SPECIALIZED HOOKS
// ===============================

/**
 * Hook for managing NVDA staging macro automation commands
 */
export function useNVDAMacroCommands(
  context: MacroExecutionContext,
  securityContext: SecurityContext,
  options?: UseCommandQueueOptions
) {
  const commandQueue = useCommandQueue(context, securityContext, options);

  const executeNVDAMacro = useCallback(async (analysisTypes?: string[]) => {
    const { FetchExpirationsCommand } = await import('../commands/fetch-expirations-command');
    const { GetStockDataCommand } = await import('../commands/get-stock-data-command');
    const { GenerateAITakeawaysCommand } = await import('../commands/generate-ai-takeaways-command');
    const { GenerateAIOptionsCommand } = await import('../commands/generate-ai-options-command');

    // Clear existing commands
    commandQueue.actions.clearQueue();

    // Build command sequence
    const commands = [];

    // 1. Fetch expiration dates
    commands.push(FetchExpirationsCommand.createForNVDA(context, securityContext));

    // 2. Get stock data with technical analysis
    commands.push(GetStockDataCommand.createForNVDA(context, securityContext));

    // 3. Generate AI takeaways (multiple types if requested)
    const defaultAnalysisTypes = analysisTypes || ['stock-trader-takeaways', 'holistic-takeaways'];
    for (const analysisType of defaultAnalysisTypes) {
      if (['stock-trader-takeaways', 'options-trader-takeaways', 'holistic-takeaways'].includes(analysisType)) {
        commands.push(new GenerateAITakeawaysCommand(
          { analysisType: analysisType as any, ticker: 'NVDA' },
          context,
          securityContext
        ));
      }
    }

    // 4. Generate AI options analysis
    commands.push(GenerateAIOptionsCommand.createForNVDA(context, securityContext, 'detailed'));

    // Add all commands to queue
    commandQueue.actions.addCommands(commands);

    // Execute the queue
    await commandQueue.actions.execute();
  }, [commandQueue, context, securityContext]);

  return {
    ...commandQueue,
    executeNVDAMacro
  };
}

/**
 * Hook for managing individual command execution with retry logic
 */
export function useCommandExecution<T>(
  commandFactory: () => MacroCommand,
  options: {
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    retryCount?: number;
  } = {}
) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const execute = useCallback(async () => {
    const { retryCount = 2 } = options;
    
    setIsExecuting(true);
    setError(null);
    setRetryAttempt(0);

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        setRetryAttempt(attempt);
        
        const command = commandFactory();
        const commandResult = await command.executeWithRetry();
        
        if (commandResult.success) {
          setResult(commandResult.data);
          setIsExecuting(false);
          
          if (options.onSuccess) {
            options.onSuccess(commandResult.data);
          }
          
          return commandResult.data;
        } else {
          throw new Error(commandResult.error?.message || 'Command execution failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        if (attempt === retryCount) {
          setError(errorMessage);
          setIsExecuting(false);
          
          if (options.onError) {
            options.onError(err instanceof Error ? err : new Error(errorMessage));
          }
          
          throw err;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }, [commandFactory, options]);

  return {
    execute,
    isExecuting,
    result,
    error,
    retryAttempt
  };
}