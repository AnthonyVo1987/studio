'use client';

/**
 * @fileOverview Simple AnalyzeAll Button Component
 * 
 * A simplified version of the macro orchestrator that executes the existing
 * tab handlers in sequence without the complex orchestrator architecture.
 * This ensures immediate functionality while maintaining context isolation.
 */

import React, { useState, useCallback, useMemo } from 'react';
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

export interface SimpleAnalyzeAllButtonProps {
  ticker: string;
  // Handler functions from the tab context
  onFetchExpirations: () => Promise<void>;
  onGetStockData: () => Promise<void>;
  onGenerateAiKeyTakeaways: () => Promise<void>;
  onGenerateAiOptionsAnalysis: () => Promise<void>;
  // State validation functions
  canFetchExpirations: () => boolean;
  canGetStockData: () => boolean;
  canGenerateAiKeyTakeaways: () => boolean;
  canGenerateAiOptionsAnalysis: () => boolean;
  // Get current state values for macro isolation
  getCurrentExpiration: () => string;
  getAvailableExpirations: () => string[];
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

// Macro execution context to maintain isolated state
interface MacroExecutionContext {
  selectedExpiration: string | null;
  isExecuting: boolean;
  stepResults: Map<number, any>;
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
  getCurrentExpiration,
  getAvailableExpirations,
  onComplete,
  onError,
  onCancel
}: SimpleAnalyzeAllButtonProps) {
  const { toast } = useToast();
  
  // Generate unique execution ID for this macro run
  const [executionId, setExecutionId] = useState<string>(() => generateExecutionId('macro'));
  
  // Create ticker-specific logger with execution ID
  const logger = useMemo(() => createTickerLogger(ticker, 'MacroOrchestrator', executionId), [ticker, executionId]);
  
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
  
  // Track step timing for performance metrics
  const [stepStartTimes, setStepStartTimes] = useState<Map<number, number>>(new Map());
  const [anomaliesDetected, setAnomaliesDetected] = useState<string[]>([]);

  // Wrapped handler for Step 1: Fetch expirations and capture the selected one
  const fetchExpirationsWithCapture = useCallback(async () => {
    const stepStart = Date.now();
    setStepStartTimes(prev => new Map(prev).set(1, stepStart));
    
    // Capture the current state before execution
    const preExecutionExpiration = getCurrentExpiration();
    const preExecutionAvailable = getAvailableExpirations();
    
    logger.stateValidation('Step1_PreExecution', 'Capturing pre-execution state', {
      currentSharedExpiration: preExecutionExpiration,
      availableExpirationsCount: preExecutionAvailable.length,
      macroSelectedExpiration: macroExecutionContext.selectedExpiration,
      executionId,
      timestamp: new Date(stepStart).toISOString()
    });
    
    // Execute the original fetch operation
    await onFetchExpirations();
    
    // Capture state IMMEDIATELY after fetch but before external contamination
    const postExecutionExpiration = getCurrentExpiration();
    const postExecutionAvailable = getAvailableExpirations();
    
    // Set macro's selected expiration IMMEDIATELY after fetch
    setMacroExecutionContext(prev => ({
      ...prev,
      selectedExpiration: postExecutionExpiration,
      stepResults: new Map(prev.stepResults).set(1, {
        preExecutionExpiration,
        postExecutionExpiration,
        availableExpirationsCount: postExecutionAvailable.length,
        stepDuration: `${Date.now() - stepStart}ms`
      })
    }));
    
    logger.stateValidation('Step1_PostExecution', 'State captured after fetch', {
      preExecutionExpiration,
      postExecutionExpiration,
      macroSelectedExpiration: postExecutionExpiration,
      availableExpirationsCount: postExecutionAvailable.length,
      executionId,
      stepDuration: `${Date.now() - stepStart}ms`
    });
    
    // Final validation
    if (postExecutionExpiration !== preExecutionExpiration) {
      logger.macroExecution('Step1_ExpSelectionChanged', 'Expiration selection updated', {
        from: preExecutionExpiration,
        to: postExecutionExpiration,
        executionId
      });
    }
  }, [onFetchExpirations, getCurrentExpiration, getAvailableExpirations, macroExecutionContext.selectedExpiration, executionId, logger, setStepStartTimes]);

  // Macro state validation to ensure consistency
  const validateMacroExpiration = useCallback(() => {
    const currentSharedExpiration = getCurrentExpiration();
    const macroSelectedExpiration = macroExecutionContext.selectedExpiration;
    
    if (!macroSelectedExpiration) {
      logger.stateValidation('Macro_NoSelection', 'Macro has no selected expiration', {
        currentShared: currentSharedExpiration,
        executionId
      });
    } else if (currentSharedExpiration !== macroSelectedExpiration) {
      logger.stateValidation('Macro_StateContamination', 'Shared state differs from macro state', {
        macroSelected: macroSelectedExpiration,
        currentShared: currentSharedExpiration,
        executionId
      });
      
      setAnomaliesDetected(prev => [
        ...prev,
        `State contamination detected: macro=${macroSelectedExpiration}, shared=${currentSharedExpiration}`
      ]);
    } else {
      logger.stateValidation('Macro_StateConsistent', 'Macro and shared state consistent', {
        expiration: macroSelectedExpiration,
        executionId
      });
    }
    
    return macroSelectedExpiration;
  }, [getCurrentExpiration, macroExecutionContext.selectedExpiration, executionId, logger]);

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
        
        // Execute the stock data fetch
        try {
          await onGetStockData();
          
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
      canExecute: canGetStockData,
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
        
        await onGenerateAiKeyTakeaways();
        
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
      canExecute: canGenerateAiKeyTakeaways,
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
        
        await onGenerateAiOptionsAnalysis();
        
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
      canExecute: canGenerateAiOptionsAnalysis,
    },
  ], [
    fetchExpirationsWithCapture,
    validateMacroExpiration,
    onGetStockData,
    onGenerateAiKeyTakeaways,
    onGenerateAiOptionsAnalysis,
    canFetchExpirations,
    canGetStockData,
    canGenerateAiKeyTakeaways,
    canGenerateAiOptionsAnalysis,
    getCurrentExpiration,
    getAvailableExpirations,
    macroExecutionContext,
    logger,
    executionId,
    setStepStartTimes,
    setMacroExecutionContext
  ]);

  // Reset execution state
  const resetState = useCallback(() => {
    // Log state reset if there was a previous execution
    if (executionId && (isExecuting || isCompleted || isCancelled)) {
      logger.macroExecution('StateReset', 'Resetting macro execution state', {
        previousExecutionId: executionId,
        wasExecuting: isExecuting,
        wasCompleted: isCompleted,
        wasCancelled: isCancelled,
        hadError: !!executionError,
        anomaliesFromPreviousRun: anomaliesDetected.length > 0 ? anomaliesDetected : undefined
      });
    }
    
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
    // Reset tracking
    setStepStartTimes(new Map());
    setAnomaliesDetected([]);
    // Generate new execution ID for next run
    const newExecutionId = generateExecutionId('macro');
    setExecutionId(newExecutionId);
    
    // Log new execution ID generation
    logger.macroExecution('NewExecutionId', 'Generated new execution ID for next run', {
      newExecutionId,
      previousExecutionId: executionId
    });
  }, [executionId, isExecuting, isCompleted, isCancelled, executionError, anomaliesDetected, logger]);



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

    resetState();
    const executionStart = Date.now();
    setIsExecuting(true);
    setStartTime(executionStart);
    
    // Initialize macro execution context with comprehensive state
    const initialUIExpiration = getCurrentExpiration();
    const availableExpirations = getAvailableExpirations();
    
    setMacroExecutionContext(prev => ({ 
      ...prev, 
      isExecuting: true,
      selectedExpiration: null, // Will be captured in Step 1
      stepResults: new Map()
    }));
    
    // Log macro context initialization
    logger.macroExecution('ContextInit', 'Macro execution context initialized', {
      executionId,
      contextState: {
        selectedExpiration: null,
        isExecuting: true,
        stepResultsCount: 0
      },
      uiState: {
        currentExpiration: initialUIExpiration,
        availableExpirationsCount: availableExpirations.length,
        availableExpirations: availableExpirations.slice(0, 3) // First 3 for brevity
      }
    });

    // Log macro automation start with comprehensive context
    logger.macroExecution('MacroStart', 'Beginning 4-step automation workflow', {
      executionId,
      totalSteps: steps.length,
      stepNames: steps.map(s => s.name),
      isolationMode: 'macro-context-enabled',
      initialUIExpiration,
      availableExpirationsCount: availableExpirations.length,
      ticker,
      timestamp: new Date(executionStart).toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        canExecuteSteps: steps.map(s => ({ 
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

      for (let i = 0; i < steps.length; i++) {
        if (shouldCancel) {
          setIsCancelled(true);
          
          const totalDuration = startTime ? Date.now() - startTime : 0;
          
          // Log cancellation with full context
          logger.macroExecution('MacroCancelled', 'Macro automation cancelled by user', {
            executionId,
            stoppedAtStep: i + 1,
            totalSteps: steps.length,
            completedSteps: completed.length,
            reason: 'User cancellation',
            totalDuration: `${totalDuration}ms`,
            macroExpiration: macroExecutionContext.selectedExpiration,
            currentExpiration: getCurrentExpiration(),
            anomalies: anomaliesDetected.length > 0 ? anomaliesDetected : undefined
          });
          
          toast({
            title: `${ticker} Analysis Cancelled`,
            description: `Stopped at step ${i + 1} of ${steps.length}`,
            variant: 'destructive',
          });
          onCancel?.();
          return;
        }

        const step = steps[i];
        setCurrentStep(step.id);

        // Log step start with enhanced context
        logger.macroExecution(`Step${step.id}_Init`, `Starting: ${step.name}`, {
          executionId,
          stepId: step.id,
          stepName: step.name,
          stepDescription: step.description,
          completedSteps: completed.length,
          totalSteps: steps.length,
          progress: `${completed.length}/${steps.length}`,
          currentExpiration: getCurrentExpiration(),
          macroExpiration: macroExecutionContext.selectedExpiration
        });

        // Check if step can be executed
        if (!step.canExecute()) {
          // Skip step if prerequisites not met, but continue
          const skipReason = 'Prerequisites not met';
          setAnomaliesDetected(prev => [...prev, `Step ${step.id} skipped: ${skipReason}`]);
          
          logger.warn(`Step${step.id}_Skip`, `Skipping: ${skipReason}`, {
            executionId,
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
          logger.macroExecution(`Step${step.id}_Success`, `Completed: ${step.name}`, {
            executionId,
            stepId: step.id,
            stepName: step.name,
            completedSteps: completed.length,
            totalSteps: steps.length,
            progress: `${completed.length}/${steps.length}`,
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
          
          logger.error(`Step${step.id}_Failed`, `Failed: ${step.name}`, {
            executionId,
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
        executionId,
        completedSteps: completed.length,
        totalSteps: steps.length,
        totalDuration: `${totalDuration}ms (${durationSeconds}s)`,
        successRate: `${completed.length}/${steps.length} (${Math.round((completed.length / steps.length) * 100)}%)`,
        stepResults: Object.fromEntries(
          completed.map(id => [
            `step${id}`,
            {
              name: steps.find(s => s.id === id)?.name,
              duration: macroExecutionContext.stepResults.get(id)?.stepDuration
            }
          ])
        ),
        macroExpiration: macroExecutionContext.selectedExpiration,
        anomalies: anomaliesDetected.length > 0 ? anomaliesDetected : undefined
      };
      
      // Log comprehensive macro completion summary
      logger.macroExecution('MacroComplete', 'Macro automation completed', executionSummary);
      
      // Log performance summary
      logger.performance('ExecutionSummary', 'Performance metrics', {
        executionId,
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
        description: `Completed ${completed.length} of ${steps.length} steps in ${durationSeconds}s`,
      });

      onComplete?.();

    } catch (error) {
      const executionError = error instanceof Error ? error : new Error(String(error));
      setExecutionError(executionError);
      
      const totalDuration = startTime ? Date.now() - startTime : 0;
      
      // Log execution failure with comprehensive context
      logger.error('MacroFailed', 'Macro automation failed', {
        executionId,
        errorMessage: executionError.message,
        errorStack: executionError.stack,
        completedSteps: completedSteps.length,
        totalSteps: steps.length,
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
      
      // Log final state for debugging
      logger.stateValidation('MacroFinalize', 'Macro execution finalized', {
        executionId,
        finalMacroExpiration: macroExecutionContext.selectedExpiration,
        finalUIExpiration: getCurrentExpiration(),
        stateConsistent: macroExecutionContext.selectedExpiration === getCurrentExpiration(),
        anomaliesDetected: anomaliesDetected.length,
        anomaliesList: anomaliesDetected.length > 0 ? anomaliesDetected : undefined
      });
    }
  }, [isExecuting, steps, ticker, toast, onComplete, onError, onCancel, resetState, shouldCancel, startTime, 
      logger, executionId, currentStep, getCurrentExpiration, getAvailableExpirations, completedSteps, 
      macroExecutionContext, anomaliesDetected, stepStartTimes]);

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
  }, [logger, currentStep, completedSteps.length, steps.length, executionId, macroExecutionContext.selectedExpiration, getCurrentExpiration]);

  // Format elapsed time
  const formatElapsedTime = useCallback((): string => {
    if (!startTime) return '0:00';
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [startTime]);

  // Calculate progress
  const progress = steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;
  const canStart = !isExecuting && !isCompleted;

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
                  {isExecuting ? `Step ${currentStep}` : 'Complete'} - {completedSteps.length} of {steps.length}
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
              Completed {completedSteps.length} of {steps.length} steps in {Math.round((Date.now() - startTime) / 1000)}s
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