'use client';

/**
 * @fileOverview Simple AnalyzeAll Button Component
 * 
 * A simplified version of the macro orchestrator that executes the existing
 * tab handlers in sequence without the complex orchestrator architecture.
 * This ensures immediate functionality while maintaining context isolation.
 */

import React, { useState, useCallback } from 'react';
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
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [executionError, setExecutionError] = useState<Error | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [shouldCancel, setShouldCancel] = useState(false);

  // Define the execution steps
  const steps: Step[] = [
    {
      id: 1,
      name: 'Fetch Expirations',
      description: 'Fetching available expiration dates',
      handler: onFetchExpirations,
      canExecute: canFetchExpirations,
    },
    {
      id: 2,
      name: 'Get Stock Data',
      description: 'Retrieving stock data and options chain',
      handler: onGetStockData,
      canExecute: canGetStockData,
    },
    {
      id: 3,
      name: 'AI Key Takeaways',
      description: 'Generating AI analysis insights',
      handler: onGenerateAiKeyTakeaways,
      canExecute: canGenerateAiKeyTakeaways,
    },
    {
      id: 4,
      name: 'AI Options Analysis',
      description: 'Analyzing options strategies with AI',
      handler: onGenerateAiOptionsAnalysis,
      canExecute: canGenerateAiOptionsAnalysis,
    },
  ];

  // Reset execution state
  const resetState = useCallback(() => {
    setIsExecuting(false);
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsCompleted(false);
    setIsCancelled(false);
    setExecutionError(null);
    setStartTime(null);
    setShouldCancel(false);
  }, []);

  // Execute all steps sequentially
  const handleExecuteAll = useCallback(async () => {
    if (isExecuting) return;

    resetState();
    setIsExecuting(true);
    setStartTime(Date.now());

    try {
      toast({
        title: `${ticker} Analyze All Started`,
        description: 'Executing comprehensive analysis workflow...',
      });

      const completed: number[] = [];

      for (let i = 0; i < steps.length; i++) {
        if (shouldCancel) {
          setIsCancelled(true);
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

        // Check if step can be executed
        if (!step.canExecute()) {
          // Skip step if prerequisites not met, but continue
          console.warn(`Skipping step ${step.id} (${step.name}): Prerequisites not met`);
          continue;
        }

        try {
          // Execute step
          await step.handler();
          completed.push(step.id);
          setCompletedSteps([...completed]);

          // Brief pause between steps for UI feedback
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (stepError) {
          const error = stepError instanceof Error ? stepError : new Error(String(stepError));
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

      const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      toast({
        title: `${ticker} Analysis Complete`,
        description: `Completed ${completed.length} of ${steps.length} steps in ${duration}s`,
      });

      onComplete?.();

    } catch (error) {
      const executionError = error instanceof Error ? error : new Error(String(error));
      setExecutionError(executionError);
      
      toast({
        title: `${ticker} Analysis Failed`,
        description: executionError.message,
        variant: 'destructive',
      });

      onError?.(executionError);

    } finally {
      setIsExecuting(false);
    }
  }, [isExecuting, steps, ticker, toast, onComplete, onError, onCancel, resetState, shouldCancel, startTime]);

  // Handle cancellation
  const handleCancel = useCallback(() => {
    setShouldCancel(true);
    setIsExecuting(false);
  }, []);

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {ticker} Analyze All (Simplified)
        </CardTitle>
        <CardDescription>
          Execute all analysis steps in sequence - Fetch data, run AI analysis, and generate insights
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
            <div className="text-sm text-muted-foreground">
              Current: {steps.find(s => s.id === currentStep)?.description || 'Processing...'}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}