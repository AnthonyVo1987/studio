/**
 * Extended Context Type Definitions for XState Macro System
 * 
 * This file provides additional context-related types and utilities
 * that complement the core macro types.
 */

import type { MacroExecutionContext, StepResult, TimeoutConfig, PerformanceMetrics } from './macro-types';

// ================================
// CONTEXT UTILITIES
// ================================

/**
 * Context factory for creating initial macro execution contexts
 */
export interface MacroContextFactory {
  create: (ticker: string, options?: Partial<MacroExecutionContextOptions>) => MacroExecutionContext;
  createFromSnapshot: (snapshot: MacroExecutionContextSnapshot) => MacroExecutionContext;
  reset: (context: MacroExecutionContext) => MacroExecutionContext;
}

export interface MacroExecutionContextOptions {
  executionId?: string;
  debugMode?: boolean;
  timeoutSettings?: Partial<TimeoutConfig>;
  selectedExpiration?: string;
}

// ================================
// CONTEXT SNAPSHOTS
// ================================

/**
 * Serializable snapshot of macro execution context for persistence/debugging
 */
export interface MacroExecutionContextSnapshot {
  ticker: string;
  executionId: string;
  selectedExpiration: string | null;
  stepResults: Array<[number, StepResult]>; // Serialized Map
  currentStep: number;
  completedSteps: number[];
  error: string | null; // Serialized Error
  timeoutSettings: TimeoutConfig;
  startTime: number | null;
  performance: {
    totalDuration: number;
    stepDurations: Array<[number, number]>; // Serialized Map
    retryCount: number;
    timeoutCount: number;
  };
  currentRetryAttempt: number;
  cancelled: boolean;
  debugMode: boolean;
  timestamp: number;
}

// ================================
// CONTEXT VALIDATION
// ================================

export interface ContextValidator {
  validate: (context: MacroExecutionContext) => ContextValidationResult;
  validateStep: (context: MacroExecutionContext, stepId: number) => StepValidationResult;
  validatePrerequisites: (context: MacroExecutionContext, stepId: number) => PrerequisiteValidationResult;
}

export interface ContextValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StepValidationResult {
  canExecute: boolean;
  reason?: string;
  missingPrerequisites: string[];
}

export interface PrerequisiteValidationResult {
  met: boolean;
  details: Array<{
    type: string;
    property: string;
    met: boolean;
    message: string;
  }>;
}

// ================================
// CONTEXT MUTATIONS
// ================================

/**
 * Type-safe context mutation utilities
 */
export interface ContextMutations {
  setStepResult: (stepId: number, result: StepResult) => (context: MacroExecutionContext) => MacroExecutionContext;
  incrementRetry: () => (context: MacroExecutionContext) => MacroExecutionContext;
  setError: (error: Error) => (context: MacroExecutionContext) => MacroExecutionContext;
  clearError: () => (context: MacroExecutionContext) => MacroExecutionContext;
  markStepCompleted: (stepId: number) => (context: MacroExecutionContext) => MacroExecutionContext;
  updatePerformance: (metrics: Partial<PerformanceMetrics>) => (context: MacroExecutionContext) => MacroExecutionContext;
  reset: () => (context: MacroExecutionContext) => MacroExecutionContext;
}

// ================================
// CONTEXT QUERIES
// ================================

/**
 * Type-safe context query utilities
 */
export interface ContextQueries {
  isStepCompleted: (context: MacroExecutionContext, stepId: number) => boolean;
  getStepResult: (context: MacroExecutionContext, stepId: number) => StepResult | undefined;
  canRetryCurrentStep: (context: MacroExecutionContext) => boolean;
  getExecutionProgress: (context: MacroExecutionContext) => ExecutionProgress;
  hasRequiredData: (context: MacroExecutionContext, dataKeys: string[]) => boolean;
  getNextStep: (context: MacroExecutionContext) => number | null;
}

export interface ExecutionProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  progressPercentage: number;
  estimatedTimeRemaining?: number;
}

// ================================
// CONTEXT SERIALIZATION
// ================================

export interface ContextSerializer {
  serialize: (context: MacroExecutionContext) => MacroExecutionContextSnapshot;
  deserialize: (snapshot: MacroExecutionContextSnapshot) => MacroExecutionContext;
  toJSON: (context: MacroExecutionContext) => string;
  fromJSON: (json: string) => MacroExecutionContext;
}

// ================================
// CONTEXT DEBUGGING
// ================================

export interface ContextDebugInfo {
  executionId: string;
  ticker: string;
  currentState: string;
  elapsedTime: number;
  stepSummary: Array<{
    stepId: number;
    stepName: string;
    status: string;
    duration?: number;
    error?: string;
  }>;
  performanceMetrics: PerformanceMetrics;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface ContextDebugger {
  getDebugInfo: (context: MacroExecutionContext) => ContextDebugInfo;
  logContextState: (context: MacroExecutionContext, level?: 'info' | 'debug' | 'warn' | 'error') => void;
  exportDebugData: (context: MacroExecutionContext) => string;
}

// ================================
// TYPE GUARDS
// ================================

export const isValidContext = (obj: any): obj is MacroExecutionContext => {
  return (
    obj &&
    typeof obj.ticker === 'string' &&
    typeof obj.executionId === 'string' &&
    obj.stepResults instanceof Map &&
    typeof obj.currentStep === 'number' &&
    Array.isArray(obj.completedSteps) &&
    obj.timeoutSettings &&
    typeof obj.timeoutSettings.stepTimeout === 'number'
  );
};

export const isValidStepResult = (obj: any): obj is StepResult => {
  return (
    obj &&
    typeof obj.stepId === 'number' &&
    typeof obj.stepName === 'string' &&
    ['success', 'error', 'timeout', 'cancelled'].includes(obj.status) &&
    typeof obj.duration === 'number' &&
    typeof obj.startTime === 'number' &&
    typeof obj.retryCount === 'number'
  );
};

// ================================
// CONTEXT DEFAULTS
// ================================

export const createDefaultContext = (ticker: string, options: MacroExecutionContextOptions = {}): MacroExecutionContext => {
  return {
    ticker,
    executionId: options.executionId || `xstate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    selectedExpiration: options.selectedExpiration || null,
    stepResults: new Map(),
    currentStep: 0,
    completedSteps: [],
    error: null,
    timeoutSettings: {
      stepTimeout: 45000,
      maxRetries: 2,
      backoffMultiplier: 2,
      baseRetryDelay: 1000,
      ...options.timeoutSettings
    },
    startTime: null,
    performance: {
      totalDuration: 0,
      stepDurations: new Map(),
      retryCount: 0,
      timeoutCount: 0
    },
    currentRetryAttempt: 0,
    cancelled: false,
    debugMode: options.debugMode || false
  };
};