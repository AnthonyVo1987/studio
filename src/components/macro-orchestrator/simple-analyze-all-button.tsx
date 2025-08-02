'use client';

/**
 * @fileOverview Simple AnalyzeAll Button Component
 * 
 * A simplified version of the macro orchestrator that executes the existing
 * tab handlers in sequence without the complex orchestrator architecture.
 * This ensures immediate functionality while maintaining context isolation.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Zap,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createTickerLogger, generateExecutionId, type MacroExecutionLogData } from '@/lib/ticker-logger';
import { useNvdaAnalysis } from '@/contexts/nvda-analysis-context';
import { useSpyAnalysis } from '@/contexts/spy-analysis-context';

export interface SimpleAnalyzeAllButtonProps {
  ticker: string;
  // Handler functions from the tab context - UPDATED to support macro parameters
  onFetchExpirations: () => Promise<void>;
  onGetStockData: (macroExpiration?: string) => Promise<void>;
  onGenerateAiKeyTakeaways: (macroExpiration?: string) => Promise<void>;
  onGenerateAiOptionsAnalysis: (macroExpiration?: string) => Promise<void>;
  // State validation functions
  canFetchExpirations: () => boolean;
  canGetStockData: () => boolean;
  canGenerateAiKeyTakeaways: () => boolean;
  canGenerateAiOptionsAnalysis: () => boolean;
  // Callbacks
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

interface Step {
  id: number;
  name: string;
  description: string;
  handler: () => Promise<void>;
  canExecute: () => boolean;
}

// Step result data structure for typed storage
interface StepResult {
  macroExpiration?: string | null;
  stepDuration?: number | string;
  preExecutionExpiration?: string;
  postExecutionExpiration?: string;
  availableExpirationsCount?: number;
  preExecutionState?: Record<string, unknown>;
  postExecutionState?: Record<string, unknown>;
  timestamp?: number;
  [key: string]: unknown; // Allow for additional properties
}

// Macro execution context to maintain isolated state
interface MacroExecutionContext {
  selectedExpiration: string | null;
  isExecuting: boolean;
  stepResults: Map<number, StepResult>;
}

export function SimpleAnalyzeAllButton({
  ticker,
  onFetchExpirations,
  onGetStockData,
  onGenerateAiKeyTakeaways,
  onGenerateAiOptionsAnalysis,
  canFetchExpirations,
  canGetStockData,
  canGenerateAiKeyTakeaways,
  canGenerateAiOptionsAnalysis,
  onComplete,
  onError,
  onCancel
}: SimpleAnalyzeAllButtonProps) {
  const { toast } = useToast();
  
  // ✅ CRITICAL FIX: Call hooks at top level to comply with React Hook Rules
  const nvdaAnalysis = useNvdaAnalysis();
  const spyAnalysis = useSpyAnalysis();
  
  // ✅ CRITICAL FIX: Create stable refs for fresh state access within callbacks
  const contextRef = useRef({ nvdaAnalysis, spyAnalysis });
  
  // ✅ CRITICAL FIX: Update ref on every render for fresh state access
  contextRef.current = { nvdaAnalysis, spyAnalysis };
  
  // Execution ID state - generated only when execution starts
  const [executionId, setExecutionId] = useState<string>('');
  
  // Create ticker-specific logger that recreates when executionId changes from placeholder to actual ID
  const loggerRef = useRef<ReturnType<typeof createTickerLogger> | null>(null);
  const logger = useMemo(() => {
    // Create new logger when ticker or executionId changes
    const loggerExecutionId = executionId || 'placeholder';
    loggerRef.current = createTickerLogger(ticker, 'MacroOrchestrator', loggerExecutionId);
    return loggerRef.current;
  }, [ticker, executionId]); // Include executionId to recreate logger when execution starts
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [executionError, setExecutionError] = useState<Error | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [shouldCancel, setShouldCancel] = useState(false);
  
  // CRITICAL: Macro-specific execution context to prevent state contamination
  const [macroExecutionContext, setMacroExecutionContext] = useState<MacroExecutionContext>({
    selectedExpiration: null,
    isExecuting: false,
    stepResults: new Map()
  });
  
  // CRITICAL: Use ref for immediate state access during step validation
  const macroContextRef = useRef<MacroExecutionContext>(macroExecutionContext);
  
  // Keep ref synchronized with state changes (but avoid overwriting manual updates during execution)
  React.useEffect(() => {
    // Only sync if not actively executing to prevent race conditions
    if (!macroExecutionContext.isExecuting) {
      macroContextRef.current = macroExecutionContext;
    }
  }, [macroExecutionContext]);
  
  // Track step timing for performance metrics
  const [stepStartTimes, setStepStartTimes] = useState<Map<number, number>>(new Map());
  const [anomaliesDetected, setAnomaliesDetected] = useState<string[]>([]);
  
  // ✅ FIXED: Dynamic state access functions using contextRef for fresh state
  const getCurrentExpiration = useCallback(() => {
    const { nvdaAnalysis, spyAnalysis } = contextRef.current;
    if (ticker === 'NVDA') {
      return nvdaAnalysis.selectedExpirationDate;
    } else {
      return spyAnalysis.selectedExpirationDate;
    }
  }, [ticker]);

  const getAvailableExpirations = useCallback(() => {
    const { nvdaAnalysis, spyAnalysis } = contextRef.current;
    if (ticker === 'NVDA') {
      return nvdaAnalysis.availableExpirationDates;
    } else {
      return spyAnalysis.availableExpirationDates;
    }
  }, [ticker]);
  
  // CRITICAL FIX: Add execution history state tracking
  interface ExecutionHistory {
    previousExecutionId?: string;
    hasRunBefore: boolean;
    lastRunTimestamp?: number;
    lastRunResult?: 'success' | 'error' | 'cancelled';
  }
  
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory>({
    hasRunBefore: false
  });

  // Wrapped handler for Step 1: Fetch expirations and capture the selected one
  const fetchExpirationsWithCapture = useCallback(async () => {
    const stepStart = Date.now();
    setStepStartTimes(prev => new Map(prev).set(1, stepStart));
    
    // Capture the current state before execution
    const preExecutionExpiration = getCurrentExpiration();
    const preExecutionAvailable = getAvailableExpirations();
    
    const currentLogger = loggerRef.current || logger;
    currentLogger.stateValidation('Step1_PreExecution', 'Capturing pre-execution state', {
      currentSharedExpiration: preExecutionExpiration,
      availableExpirationsCount: preExecutionAvailable.length,
      macroSelectedExpiration: macroExecutionContext.selectedExpiration,
      executionId,
      timestamp: new Date(stepStart).toISOString()
    });
    
    // Execute the original fetch operation
    await onFetchExpirations();
    
    // CRITICAL FIX: Wait for React state to propagate before capturing
    // Use state polling to ensure we capture the updated values
    let postExecutionExpiration = '';
    let attempts = 0;
    const maxAttempts = 20; // Maximum 1 second with 50ms intervals
    
    currentLogger.stateValidation('Step1_StatePolling', 'Beginning state propagation polling', {
      executionId,
      maxAttempts,
      pollingInterval: '50ms'
    });
    
    while (postExecutionExpiration === '' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Allow state propagation
      postExecutionExpiration = getCurrentExpiration();
      attempts++;
      
      if (attempts % 5 === 0) { // Log every 250ms for debugging
        currentLogger.stateValidation('Step1_PollingProgress', `State polling attempt ${attempts}/${maxAttempts}`, {
          executionId,
          capturedExpiration: postExecutionExpiration,
          isEmpty: postExecutionExpiration === ''
        });
      }
    }
    
    // Final capture of available expirations after state has propagated
    const postExecutionAvailable = getAvailableExpirations();
    
    // Log the polling result
    currentLogger.stateValidation('Step1_PollingComplete', 'State polling completed', {
      executionId,
      finalExpiration: postExecutionExpiration,
      availableCount: postExecutionAvailable.length,
      attemptsUsed: attempts,
      pollingSuccessful: postExecutionExpiration !== '',
      totalPollingTime: `${attempts * 50}ms`
    });
    
    // Set macro's selected expiration IMMEDIATELY after fetch
    const newContext = {
      selectedExpiration: postExecutionExpiration,
      isExecuting: true,
      stepResults: new Map().set(1, {
        preExecutionExpiration,
        postExecutionExpiration,
        availableExpirationsCount: postExecutionAvailable.length,
        stepDuration: `${Date.now() - stepStart}ms`
      })
    };
    
    // Update both state and ref for immediate access - ensure atomic update
    setMacroExecutionContext(prev => ({ ...prev, ...newContext }));
    // CRITICAL: Update ref immediately and atomically to prevent race conditions
    macroContextRef.current = {
      selectedExpiration: postExecutionExpiration,
      isExecuting: true,
      stepResults: new Map().set(1, {
        preExecutionExpiration,
        postExecutionExpiration,
        availableExpirationsCount: postExecutionAvailable.length,
        stepDuration: `${Date.now() - stepStart}ms`
      })
    };
    
    currentLogger.stateValidation('Step1_PostExecution', 'State captured after fetch with polling', {
      preExecutionExpiration,
      postExecutionExpiration,
      macroSelectedExpiration: postExecutionExpiration,
      availableExpirationsCount: postExecutionAvailable.length,
      executionId,
      stepDuration: `${Date.now() - stepStart}ms`,
      statePollingUsed: true,
      attemptsRequired: attempts
    });
    
    // Final validation
    if (postExecutionExpiration !== preExecutionExpiration) {
      currentLogger.macroExecution('Step1_ExpSelectionChanged', 'Expiration selection updated', {
        from: preExecutionExpiration,
        to: postExecutionExpiration,
        executionId
      });
    }
  }, [onFetchExpirations, getCurrentExpiration, getAvailableExpirations, macroExecutionContext.selectedExpiration, executionId, setStepStartTimes]);

  // Macro state validation to ensure consistency
  const validateMacroExpiration = useCallback(() => {
    const currentSharedExpiration = getCurrentExpiration();
    // CRITICAL FIX: Use ref for immediate access like all other validation functions
    const macroSelectedExpirationRef = macroContextRef.current.selectedExpiration;
    const macroSelectedExpirationState = macroExecutionContext.selectedExpiration;
    
    const currentLogger = loggerRef.current || logger;
    
    // Enhanced debugging: Log both ref and state values for comprehensive troubleshooting
    currentLogger.stateValidation('Macro_ValidationDebug', 'State synchronization validation', {
      refSelectedExpiration: macroSelectedExpirationRef,
      stateSelectedExpiration: macroSelectedExpirationState,
      currentSharedExpiration: currentSharedExpiration,
      refStateMatch: macroSelectedExpirationRef === macroSelectedExpirationState,
      refExists: !!macroSelectedExpirationRef,
      stateExists: !!macroSelectedExpirationState,
      executionId
    });
    
    // Use ref value as primary source (consistent with other validation functions)
    const macroSelectedExpiration = macroSelectedExpirationRef;
    
    if (!macroSelectedExpiration) {
      currentLogger.stateValidation('Macro_NoSelection', 'Macro has no selected expiration in ref', {
        currentShared: currentSharedExpiration,
        refValue: macroSelectedExpirationRef,
        stateValue: macroSelectedExpirationState,
        executionId
      });
      
      // Error recovery: Try fallback to state value if ref is null but state has value
      if (macroSelectedExpirationState) {
        currentLogger.stateValidation('Macro_FallbackRecovery', 'Using state value as fallback', {
          fallbackValue: macroSelectedExpirationState,
          executionId
        });
        return macroSelectedExpirationState;
      }
    } else if (currentSharedExpiration !== macroSelectedExpiration) {
      currentLogger.stateValidation('Macro_StateContamination', 'Shared state differs from macro state', {
        macroSelected: macroSelectedExpiration,
        currentShared: currentSharedExpiration,
        usingRefValue: true,
        executionId
      });
      
      setAnomaliesDetected(prev => [
        ...prev,
        `State contamination detected: macro=${macroSelectedExpiration}, shared=${currentSharedExpiration}`
      ]);
    } else {
      currentLogger.stateValidation('Macro_StateConsistent', 'Macro and shared state consistent', {
        expiration: macroSelectedExpiration,
        usingRefValue: true,
        refStateSync: macroSelectedExpirationRef === macroSelectedExpirationState,
        executionId
      });
    }
    
    return macroSelectedExpiration;
  }, [getCurrentExpiration, macroExecutionContext.selectedExpiration, executionId]);

  // Macro-aware validation functions that prioritize macro context over shared state
  const canGetStockDataMacroAware = useCallback(() => {
    // First check if we have a macro-captured expiration
    const macroExpiration = macroContextRef.current.selectedExpiration;
    const stateExpiration = macroExecutionContext.selectedExpiration;
    
    // Add debug logging to track ref synchronization
    const currentLogger = loggerRef.current || logger;
    currentLogger.stateValidation('CanGetStockData_RefDebug', 'Ref state before Step 2 validation', {
      refSelectedExpiration: macroExpiration,
      stateSelectedExpiration: stateExpiration,
      refStateMatch: macroExpiration === stateExpiration,
      executionId
    });
    
    if (macroExpiration) {
      currentLogger.stateValidation('CanGetStockData_MacroAware', 'Using macro-captured expiration for validation', {
        macroExpiration,
        currentSharedExpiration: getCurrentExpiration(),
        validationResult: true,
        executionId
      });
      return true;
    }
    
    // Fall back to original shared state validation
    const originalResult = canGetStockData();
    currentLogger.stateValidation('CanGetStockData_SharedState', 'Using shared state validation (no macro expiration)', {
      originalResult,
      currentSharedExpiration: getCurrentExpiration(),
      executionId
    });
    return originalResult;
  }, [canGetStockData, getCurrentExpiration, executionId, macroExecutionContext.selectedExpiration]);

  const canGenerateAiKeyTakeawaysMacroAware = useCallback(() => {
    // First check if we have a macro-captured expiration
    const macroExpiration = macroContextRef.current.selectedExpiration;
    if (macroExpiration) {
      return true;
    }
    
    // Fall back to original shared state validation
    return canGenerateAiKeyTakeaways();
  }, [canGenerateAiKeyTakeaways]);

  const canGenerateAiOptionsAnalysisMacroAware = useCallback(() => {
    // First check if we have a macro-captured expiration
    const macroExpiration = macroContextRef.current.selectedExpiration;
    if (macroExpiration) {
      return true;
    }
    
    // Fall back to original shared state validation
    return canGenerateAiOptionsAnalysis();
  }, [canGenerateAiOptionsAnalysis]);

  // Define the execution steps with wrapped handlers for macro isolation
  const steps: Step[] = useMemo(() => [
    {
      id: 1,
      name: 'Fetch Expirations',
      description: 'Fetching available expiration dates',
      handler: fetchExpirationsWithCapture, // Use wrapped handler to capture expiration
      canExecute: canFetchExpirations,
    },
    {
      id: 2,
      name: 'Get Stock Data',
      description: 'Retrieving stock data and options chain',
      handler: async () => {
        const stepStart = Date.now();
        setStepStartTimes(prev => new Map(prev).set(2, stepStart));
        
        // Pre-execution state logging
        const preExecutionState = {
          macroExpiration: macroExecutionContext.selectedExpiration,
          currentUIExpiration: getCurrentExpiration(),
          availableExpirationsCount: getAvailableExpirations().length
        };
        
        logger.stateValidation('Step2_PreExecution', 'Pre-execution state for stock data fetch', {
          ...preExecutionState,
          executionId,
          stepId: 2
        });
        
        // Validate macro expiration before execution
        const macroExpiration = validateMacroExpiration();
        logger.macroExecution('Step2_Start', `Using macro-isolated expiration: ${macroExpiration}`, {
          macroExpiration,
          currentShared: getCurrentExpiration(),
          stateIsolated: macroExpiration !== getCurrentExpiration(),
          executionId,
          stepId: 2,
          timestamp: new Date(stepStart).toISOString()
        });
        
        // Execute the stock data fetch with macro expiration parameter
        try {
          await onGetStockData(macroExpiration || undefined);
          
          const stepDuration = Date.now() - stepStart;
          
          // Post-execution validation
          const postExecutionState = {
            macroExpiration,
            currentUIExpiration: getCurrentExpiration(),
            statePreserved: macroExpiration === macroExecutionContext.selectedExpiration,
            executionSuccessful: true
          };
          
          logger.stateValidation('Step2_PostExecution', 'Post-execution state validation', {
            ...postExecutionState,
            executionId,
            stepId: 2,
            stepDuration: `${stepDuration}ms`
          });
          
          logger.performance('Step2_Complete', 'Stock data fetch completed', {
            stepDuration: `${stepDuration}ms`,
            macroExpiration,
            executionId,
            dataFetchedForExpiration: macroExpiration
          });
          
          // Store result with enhanced metadata
          setMacroExecutionContext(prev => ({
            ...prev,
            stepResults: new Map(prev.stepResults).set(2, { 
              macroExpiration,
              stepDuration,
              preExecutionState,
              postExecutionState,
              timestamp: Date.now()
            })
          }));
        } catch (error) {
          const stepDuration = Date.now() - stepStart;
          logger.error('Step2_Error', 'Error during stock data fetch', {
            error: error instanceof Error ? error.message : String(error),
            macroExpiration,
            stepDuration: `${stepDuration}ms`,
            executionId,
            stepId: 2
          });
          throw error;
        }
      },
      canExecute: canGetStockDataMacroAware,
    },
    {
      id: 3,
      name: 'AI Key Takeaways',
      description: 'Generating AI analysis insights',
      handler: async () => {
        const stepStart = Date.now();
        setStepStartTimes(prev => new Map(prev).set(3, stepStart));
        
        // Log macro state before AI analysis
        const macroExpiration = macroExecutionContext.selectedExpiration;
        const currentExpiration = getCurrentExpiration();
        
        logger.macroExecution('Step3_Start', 'AI Key Takeaways with macro context', {
          macroExpiration,
          currentShared: currentExpiration,
          contaminated: macroExpiration !== currentExpiration,
          executionId,
          stepId: 3
        });
        
        await onGenerateAiKeyTakeaways(macroExpiration || undefined);
        
        const stepDuration = Date.now() - stepStart;
        logger.performance('Step3_Complete', 'AI Key Takeaways generated', {
          stepDuration: `${stepDuration}ms`,
          macroExpiration,
          executionId
        });
        
        // Store result
        setMacroExecutionContext(prev => ({
          ...prev,
          stepResults: new Map(prev.stepResults).set(3, { 
            macroExpiration,
            stepDuration
          })
        }));
      },
      canExecute: canGenerateAiKeyTakeawaysMacroAware,
    },
    {
      id: 4,
      name: 'AI Options Analysis',
      description: 'Analyzing options strategies with AI',
      handler: async () => {
        const stepStart = Date.now();
        setStepStartTimes(prev => new Map(prev).set(4, stepStart));
        
        // Log macro state before options analysis
        const macroExpiration = macroExecutionContext.selectedExpiration;
        const currentExpiration = getCurrentExpiration();
        
        logger.macroExecution('Step4_Start', 'AI Options Analysis with macro context', {
          macroExpiration,
          currentShared: currentExpiration,
          contaminated: macroExpiration !== currentExpiration,
          executionId,
          stepId: 4
        });
        
        await onGenerateAiOptionsAnalysis(macroExpiration || undefined);
        
        const stepDuration = Date.now() - stepStart;
        logger.performance('Step4_Complete', 'AI Options Analysis completed', {
          stepDuration: `${stepDuration}ms`,
          macroExpiration,
          executionId
        });
        
        // Store result
        setMacroExecutionContext(prev => ({
          ...prev,
          stepResults: new Map(prev.stepResults).set(4, { 
            macroExpiration,
            stepDuration
          })
        }));
      },
      canExecute: canGenerateAiOptionsAnalysisMacroAware,
    },
  ], [
    fetchExpirationsWithCapture,
    validateMacroExpiration,
    onGetStockData,
    onGenerateAiKeyTakeaways,
    onGenerateAiOptionsAnalysis,
    canFetchExpirations,
    canGetStockDataMacroAware,
    canGenerateAiKeyTakeawaysMacroAware,
    canGenerateAiOptionsAnalysisMacroAware,
    getCurrentExpiration,
    getAvailableExpirations,
    macroExecutionContext,
    logger,
    executionId,
    setStepStartTimes,
    setMacroExecutionContext
  ]);

  // Reset execution state (internal helper, not in useCallback to break circular dependency)
  const resetExecutionState = () => {
    setIsExecuting(false);
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsCompleted(false);
    setIsCancelled(false);
    setExecutionError(null);
    setStartTime(null);
    setShouldCancel(false);
    // Reset macro execution context
    setMacroExecutionContext({
      selectedExpiration: null,
      isExecuting: false,
      stepResults: new Map()
    });
    // CRITICAL FIX: Also reset the ref immediately to prevent stale data
    macroContextRef.current = {
      selectedExpiration: null,
      isExecuting: false,
      stepResults: new Map()
    };
    // Reset tracking
    setStepStartTimes(new Map());
    setAnomaliesDetected([]);
    // CRITICAL: Clear logger ref to force recreation with new execution ID
    loggerRef.current = null;
  };



  // CRITICAL FIX: Add intelligent context detection
  const detectExecutionContext = useCallback(() => {
    if (!executionHistory.hasRunBefore) {
      return { context: 'first_run', previousExecutionId: null };
    }
    
    const currentExp = getCurrentExpiration();
    if (!currentExp) {
      return { context: 'app_startup', previousExecutionId: null };
    }
    
    return { 
      context: 'subsequent_run', 
      previousExecutionId: executionHistory.previousExecutionId 
    };
  }, [executionHistory, getCurrentExpiration]);

  // Helper function to determine if we need to fetch expirations
  const shouldFetchExpirations = useCallback(() => {
    const currentExp = getCurrentExpiration();
    const availableExps = getAvailableExpirations();
    
    // Need to fetch if no current expiration OR no available expirations
    const needsFetch = !currentExp || !currentExp.trim() || availableExps.length === 0;
    
    const currentLogger = loggerRef.current || logger;
    currentLogger.stateValidation('ShouldFetchExpirations', 'Evaluating if expiration fetch is needed', {
      currentExpiration: currentExp,
      availableExpirationsCount: availableExps.length,
      needsFetch,
      executionId
    });
    
    return needsFetch;
  }, [getCurrentExpiration, getAvailableExpirations, executionId]);

  // Execute all steps sequentially
  const handleExecuteAll = useCallback(async () => {
    if (isExecuting) {
      logger.warn('ExecutionBlocked', 'Macro execution already in progress', {
        executionId,
        currentStep,
        isExecuting
      });
      return;
    }

    // CRITICAL FIX: Detect execution context and get proper previous execution ID
    const executionContext = detectExecutionContext();
    
    // Log state reset if there was a previous execution
    if (executionId && (isExecuting || isCompleted || isCancelled)) {
      logger.macroExecution('StateReset', 'Resetting macro execution state', {
        previousExecutionId: executionContext.previousExecutionId,
        currentExecutionId: executionId,
        executionContext: executionContext.context,
        wasExecuting: isExecuting,
        wasCompleted: isCompleted,
        wasCancelled: isCancelled,
        hadError: !!executionError,
        anomaliesFromPreviousRun: anomaliesDetected.length > 0 ? anomaliesDetected : undefined
      });
    }

    // Reset state and generate new execution ID inline to break circular dependency
    resetExecutionState();
    const newExecutionId = generateExecutionId('macro');
    setExecutionId(newExecutionId);
    
    // Create fresh logger immediately with new execution ID to prevent split-brain
    const freshLogger = createTickerLogger(ticker, 'MacroOrchestrator', newExecutionId);
    loggerRef.current = freshLogger;
    
    const executionStart = Date.now();
    setIsExecuting(true);
    setStartTime(executionStart);
    
    // CRITICAL FIX: Log new execution ID generation with proper previous ID reference
    freshLogger.macroExecution('NewExecutionId', 'Generated new execution ID for macro run', {
      newExecutionId,
      previousExecutionId: executionContext.previousExecutionId || null,
      isFirstRun: !executionHistory.hasRunBefore,
      executionContext: executionContext.context
    });
    
    // Initialize macro execution context with comprehensive state
    const initialUIExpiration = getCurrentExpiration();
    const availableExpirations = getAvailableExpirations();
    
    // INTELLIGENT STEP SELECTION: Determine if we need to fetch expirations
    const needsExpirationFetch = shouldFetchExpirations();
    
    // Pre-initialize selectedExpiration if we're skipping the fetch step
    const initialMacroExpiration = needsExpirationFetch ? null : initialUIExpiration;
    
    setMacroExecutionContext(prev => ({ 
      ...prev, 
      isExecuting: true,
      selectedExpiration: initialMacroExpiration,
      stepResults: new Map()
    }));
    
    // DYNAMIC STEP SELECTION: Build execution plan based on current state
    const executionSteps = needsExpirationFetch ? steps : steps.slice(1);
    
    // Log macro context initialization
    freshLogger.macroExecution('ContextInit', 'Macro execution context initialized', {
      newExecutionId,
      contextState: {
        selectedExpiration: initialMacroExpiration,
        isExecuting: true,
        stepResultsCount: 0
      },
      uiState: {
        currentExpiration: initialUIExpiration,
        availableExpirationsCount: availableExpirations.length,
        availableExpirations: availableExpirations.slice(0, 3) // First 3 for brevity
      },
      stepSelection: {
        needsExpirationFetch,
        totalStepsToExecute: executionSteps.length,
        skippingFetchStep: !needsExpirationFetch
      }
    });

    // Log macro automation start with comprehensive context
    freshLogger.macroExecution('MacroStart', `Beginning ${executionSteps.length}-step automation workflow`, {
      newExecutionId,
      totalSteps: executionSteps.length,
      stepNames: executionSteps.map(s => s.name),
      isolationMode: 'macro-context-enabled',
      initialUIExpiration,
      availableExpirationsCount: availableExpirations.length,
      ticker,
      timestamp: new Date(executionStart).toISOString(),
      intelligentExecution: {
        needsExpirationFetch,
        skippedSteps: needsExpirationFetch ? [] : ['Fetch Expirations'],
        preSelectedExpiration: initialMacroExpiration
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        canExecuteSteps: executionSteps.map(s => ({ 
          stepId: s.id, 
          stepName: s.name, 
          canExecute: s.canExecute() 
        }))
      }
    });

    try {
      toast({
        title: `${ticker} Analyze All Started`,
        description: 'Executing comprehensive analysis workflow...',
      });

      const completed: number[] = [];

      for (let i = 0; i < executionSteps.length; i++) {
        if (shouldCancel) {
          setIsCancelled(true);
          
          const totalDuration = startTime ? Date.now() - startTime : 0;
          
          // Log cancellation with full context
          freshLogger.macroExecution('MacroCancelled', 'Macro automation cancelled by user', {
            newExecutionId,
            stoppedAtStep: i + 1,
            totalSteps: executionSteps.length,
            completedSteps: completed.length,
            reason: 'User cancellation',
            totalDuration: `${totalDuration}ms`,
            macroExpiration: macroExecutionContext.selectedExpiration,
            currentExpiration: getCurrentExpiration(),
            anomalies: anomaliesDetected.length > 0 ? anomaliesDetected : undefined,
            intelligentExecution: {
              needsExpirationFetch,
              executedDynamicSteps: true
            }
          });
          
          toast({
            title: `${ticker} Analysis Cancelled`,
            description: `Stopped at step ${i + 1} of ${executionSteps.length}`,
            variant: 'destructive',
          });
          onCancel?.();
          return;
        }

        const step = executionSteps[i];
        setCurrentStep(step.id);

        // Log step start with enhanced context
        freshLogger.macroExecution(`Step${step.id}_Init`, `Starting: ${step.name}`, {
          newExecutionId,
          stepId: step.id,
          stepName: step.name,
          stepDescription: step.description,
          completedSteps: completed.length,
          totalSteps: executionSteps.length,
          progress: `${completed.length}/${executionSteps.length}`,
          currentExpiration: getCurrentExpiration(),
          macroExpiration: macroExecutionContext.selectedExpiration
        });

        // Check if step can be executed
        if (!step.canExecute()) {
          // Skip step if prerequisites not met, but continue
          const skipReason = 'Prerequisites not met';
          setAnomaliesDetected(prev => [...prev, `Step ${step.id} skipped: ${skipReason}`]);
          
          freshLogger.warn(`Step${step.id}_Skip`, `Skipping: ${skipReason}`, {
            newExecutionId,
            stepId: step.id,
            stepName: step.name,
            reason: skipReason,
            anomaly: 'prerequisites_not_met'
          });
          console.warn(`Skipping step ${step.id} (${step.name}): Prerequisites not met`);
          continue;
        }

        try {
          // Execute step
          await step.handler();
          completed.push(step.id);
          setCompletedSteps([...completed]);

          // Calculate step duration
          const stepStartTime = stepStartTimes.get(step.id) || Date.now();
          const stepDuration = Date.now() - stepStartTime;
          
          // Log step completion with timing
          freshLogger.macroExecution(`Step${step.id}_Success`, `Completed: ${step.name}`, {
            newExecutionId,
            stepId: step.id,
            stepName: step.name,
            completedSteps: completed.length,
            totalSteps: executionSteps.length,
            progress: `${completed.length}/${executionSteps.length}`,
            stepDuration: `${stepDuration}ms`,
            macroExpiration: macroExecutionContext.selectedExpiration,
            currentExpiration: getCurrentExpiration()
          });

          // Brief pause between steps for UI feedback
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (stepError) {
          const error = stepError instanceof Error ? stepError : new Error(String(stepError));
          
          // Log step failure with comprehensive context
          const stepStartTime = stepStartTimes.get(step.id) || Date.now();
          const stepDuration = Date.now() - stepStartTime;
          const errorAnomaly = `Step ${step.id} failed: ${error.message}`;
          setAnomaliesDetected(prev => [...prev, errorAnomaly]);
          
          freshLogger.error(`Step${step.id}_Failed`, `Failed: ${step.name}`, {
            newExecutionId,
            stepId: step.id,
            stepName: step.name,
            errorMessage: error.message,
            errorStack: error.stack,
            completedSteps: completed.length,
            continuingExecution: true,
            stepDuration: `${stepDuration}ms`,
            anomaly: 'step_execution_failed',
            macroExpiration: macroExecutionContext.selectedExpiration,
            currentExpiration: getCurrentExpiration()
          });
          
          console.error(`Step ${step.id} (${step.name}) failed:`, error);
          
          // For now, continue execution even if a step fails
          // This allows partial completion rather than complete failure
          toast({
            title: `Step Failed: ${step.name}`,
            description: `Continuing with remaining steps. Error: ${error.message}`,
            variant: 'destructive',
          });
        }
      }

      // Mark as completed
      setIsCompleted(true);
      setCurrentStep(0);

      const totalDuration = startTime ? Date.now() - startTime : 0;
      const durationSeconds = Math.round(totalDuration / 1000);
      
      // Compile execution summary
      const executionSummary: MacroExecutionLogData = {
        executionId: newExecutionId,
        completedSteps: completed.length,
        totalSteps: executionSteps.length,
        totalDuration: `${totalDuration}ms (${durationSeconds}s)`,
        successRate: `${completed.length}/${executionSteps.length} (${Math.round((completed.length / executionSteps.length) * 100)}%)`,
        stepResults: Object.fromEntries(
          completed.map(id => [
            `step${id}`,
            {
              name: executionSteps.find(s => s.id === id)?.name,
              duration: macroExecutionContext.stepResults.get(id)?.stepDuration
            }
          ])
        ),
        macroExpiration: macroExecutionContext.selectedExpiration,
        anomalies: anomaliesDetected.length > 0 ? anomaliesDetected : undefined
      };
      
      // Log comprehensive macro completion summary
      freshLogger.macroExecution('MacroComplete', 'Macro automation completed', executionSummary);
      
      // Log performance summary
      freshLogger.performance('ExecutionSummary', 'Performance metrics', {
        executionId: newExecutionId,
        totalDuration: `${totalDuration}ms`,
        averageStepDuration: `${Math.round(totalDuration / completed.length)}ms`,
        stepTimings: Object.fromEntries(
          Array.from(macroExecutionContext.stepResults.entries()).map(([id, result]) => [
            `step${id}`,
            result.stepDuration
          ])
        )
      });
      
      toast({
        title: `${ticker} Analysis Complete`,
        description: `Completed ${completed.length} of ${executionSteps.length} steps in ${durationSeconds}s`,
      });

      onComplete?.();

    } catch (error) {
      const executionError = error instanceof Error ? error : new Error(String(error));
      setExecutionError(executionError);
      
      const totalDuration = startTime ? Date.now() - startTime : 0;
      
      // Log execution failure with comprehensive context
      freshLogger.error('MacroFailed', 'Macro automation failed', {
        executionId: newExecutionId,
        errorMessage: executionError.message,
        errorStack: executionError.stack,
        completedSteps: completedSteps.length,
        totalSteps: executionSteps.length,
        failedAtStep: currentStep,
        totalDuration: `${totalDuration}ms`,
        macroExpiration: macroExecutionContext.selectedExpiration,
        currentExpiration: getCurrentExpiration(),
        anomalies: anomaliesDetected,
        anomaly: 'macro_execution_failed'
      });
      
      toast({
        title: `${ticker} Analysis Failed`,
        description: executionError.message,
        variant: 'destructive',
      });

      onError?.(executionError);

    } finally {
      setIsExecuting(false);
      // Clear macro execution flag
      setMacroExecutionContext(prev => ({ ...prev, isExecuting: false }));
      
      // CRITICAL FIX: Update execution history on completion
      setExecutionHistory(prev => ({
        previousExecutionId: newExecutionId,
        hasRunBefore: true,
        lastRunTimestamp: Date.now(),
        lastRunResult: executionError ? 'error' : (isCancelled ? 'cancelled' : 'success')
      }));
      
      // Log final state for debugging
      freshLogger.stateValidation('MacroFinalize', 'Macro execution finalized', {
        executionId: newExecutionId,
        finalMacroExpiration: macroExecutionContext.selectedExpiration,
        finalUIExpiration: getCurrentExpiration(),
        stateConsistent: macroExecutionContext.selectedExpiration === getCurrentExpiration(),
        anomaliesDetected: anomaliesDetected.length,
        anomaliesList: anomaliesDetected.length > 0 ? anomaliesDetected : undefined,
        executionHistoryUpdated: true
      });
    }
  }, [isExecuting, steps, ticker, toast, onComplete, onError, onCancel, shouldCancel, startTime, 
      logger, executionId, currentStep, getCurrentExpiration, getAvailableExpirations, completedSteps, 
      macroExecutionContext, anomaliesDetected, stepStartTimes, shouldFetchExpirations, isCompleted, isCancelled, executionError, 
      detectExecutionContext, executionHistory]);

  // Handle cancellation
  const handleCancel = useCallback(() => {
    logger.macroExecution('CancelRequested', 'User requested cancellation', {
      executionId,
      currentStep,
      completedSteps: completedSteps.length,
      totalSteps: steps.length,
      macroExpiration: macroExecutionContext.selectedExpiration,
      currentExpiration: getCurrentExpiration()
    });
    
    setShouldCancel(true);
    setIsExecuting(false);
  }, [logger, currentStep, completedSteps.length, executionId, macroExecutionContext.selectedExpiration, getCurrentExpiration]);

  // Format elapsed time
  const formatElapsedTime = useCallback((): string => {
    if (!startTime) return '0:00';
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [startTime]);

  // Calculate progress (needs to account for dynamic step count)
  const getCurrentStepCount = useCallback(() => {
    if (!isExecuting) return steps.length;
    // During execution, use the dynamic step count that was determined at start
    const needsExpirationFetch = shouldFetchExpirations();
    return needsExpirationFetch ? steps.length : steps.length - 1;
  }, [isExecuting, steps.length, shouldFetchExpirations]);

  const progress = getCurrentStepCount() > 0 ? (completedSteps.length / getCurrentStepCount()) * 100 : 0;
  const canStart = !isExecuting;
  
  // Log button state for debugging re-run functionality
  React.useEffect(() => {
    if (logger) {
      logger.macroExecution('ButtonState', 'Macro button state calculated', {
        canStart,
        isExecuting,
        isCompleted,
        isCancelled,
        buttonText: isCompleted ? 'Run Again' : 'Analyze All',
        executionId: executionId || 'none'
      });
    }
  }, [canStart, isExecuting, isCompleted, isCancelled, logger, executionId]);

  return (
    <Card className={macroExecutionContext.isExecuting ? 'relative' : ''}>
      {/* Overlay during macro execution to prevent UI interactions */}
      {macroExecutionContext.isExecuting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm font-medium">Macro automation in progress...</p>
            <p className="text-xs text-muted-foreground">
              Please do not interact with the UI during execution
            </p>
          </div>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {ticker} Analyze All (Isolated State)
        </CardTitle>
        <CardDescription>
          Execute all analysis steps in sequence with isolated macro state - protected from UI changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status and Progress Section */}
        <div className="space-y-3">
          {/* Status Badge and Timer */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={isCompleted ? 'default' : isExecuting ? 'secondary' : 'outline'}
              className="flex items-center gap-1"
            >
              {isCompleted ? (
                <CheckCircle className="h-3 w-3" />
              ) : isExecuting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isCancelled ? (
                <XCircle className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              {isCompleted ? 'Complete' : isExecuting ? 'Running' : isCancelled ? 'Cancelled' : 'Ready'}
            </Badge>
            
            {isExecuting && startTime && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatElapsedTime()}
              </div>
            )}
          </div>

          {/* Progress Bar and Step Counter */}
          {(isExecuting || isCompleted) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {isExecuting ? `Step ${currentStep}` : 'Complete'} - {completedSteps.length} of {getCurrentStepCount()}
                </span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Current Step Display */}
          {isExecuting && currentStep > 0 && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Current: {steps.find(s => s.id === currentStep)?.description || 'Processing...'}
              </div>
              {macroExecutionContext.selectedExpiration && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs py-0 px-1.5">
                    Macro Expiration: {macroExecutionContext.selectedExpiration}
                  </Badge>
                  {getCurrentExpiration() !== macroExecutionContext.selectedExpiration && (
                    <Badge variant="destructive" className="text-xs py-0 px-1.5">
                      UI Changed!
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isExecuting ? (
            <Button
              onClick={handleCancel}
              variant="destructive"
              className="flex-1"
            >
              <Square className="mr-2 h-4 w-4" />
              Cancel Execution
            </Button>
          ) : (
            <Button
              onClick={handleExecuteAll}
              disabled={!canStart}
              size="lg"
              className="flex-1"
            >
              {isExecuting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isCompleted ? 'Run Again' : 'Analyze All'}
            </Button>
          )}
        </div>

        {/* Error Display */}
        {executionError && (
          <div className="p-3 border border-red-200 bg-red-50 rounded-md">
            <div className="flex items-center gap-2 text-red-800 font-medium text-sm">
              <XCircle className="h-4 w-4" />
              Execution Error
            </div>
            <p className="text-red-600 text-sm mt-1">{executionError.message}</p>
            <Button
              onClick={() => setExecutionError(null)}
              variant="ghost"
              size="sm"
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Clear Error
            </Button>
          </div>
        )}

        {/* Completion Summary */}
        {isCompleted && startTime && (
          <div className="p-3 border border-green-200 bg-green-50 rounded-md">
            <div className="flex items-center gap-2 text-green-800 font-medium text-sm">
              <CheckCircle className="h-4 w-4" />
              Analysis Complete
            </div>
            <p className="text-green-600 text-sm mt-1">
              Completed {completedSteps.length} of {getCurrentStepCount()} steps in {Math.round((Date.now() - startTime) / 1000)}s
            </p>
            {macroExecutionContext.selectedExpiration && (
              <p className="text-green-600 text-xs mt-1">
                Macro Expiration Used: {macroExecutionContext.selectedExpiration}
              </p>
            )}
          </div>
        )}
        
        {/* Debug Information Panel (Development Only) */}
        {process.env.NODE_ENV === 'development' && macroExecutionContext.isExecuting && (
          <div className="p-3 border border-blue-200 bg-blue-50 rounded-md space-y-2">
            <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
              <Zap className="h-4 w-4" />
              Debug: Macro Execution State
            </div>
            <div className="text-xs text-blue-600 space-y-1">
              <p>Execution ID: {executionId}</p>
              <p>Macro Expiration: {macroExecutionContext.selectedExpiration || 'Not captured yet'}</p>
              <p>Current UI Expiration: {getCurrentExpiration()}</p>
              <p>State Consistent: {macroExecutionContext.selectedExpiration === getCurrentExpiration() ? 'Yes' : 'No'}</p>
              <p>Anomalies Detected: {anomaliesDetected.length}</p>
              {anomaliesDetected.length > 0 && (
                <div className="mt-1">
                  <p className="font-medium">Anomalies:</p>
                  <ul className="list-disc list-inside pl-2">
                    {anomaliesDetected.map((anomaly, idx) => (
                      <li key={idx} className="text-xs">{anomaly}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}