/**
 * Event Type Definitions for XState Macro System
 * 
 * This file provides comprehensive event type definitions and utilities
 * for the XState-based macro execution system.
 */

import type { StepResult, TimeoutConfig, PerformanceMetrics } from './macro-types';

// ================================
// CORE EVENT TYPES
// ================================

/**
 * All possible events that can be sent to the macro execution machine
 */
export type MacroExecutionEvent =
  // Execution Control Events
  | StartExecutionEvent
  | CancelExecutionEvent
  | ResetExecutionEvent
  | PauseExecutionEvent
  | ResumeExecutionEvent
  
  // Step Management Events
  | StepCompletedEvent
  | StepFailedEvent
  | StepTimeoutEvent
  | RetryStepEvent
  | SkipStepEvent
  
  // Configuration Events
  | UpdateTimeoutConfigEvent
  | SetDebugModeEvent
  | ExpirationSelectedEvent
  
  // Validation Events
  | PrerequisitesValidatedEvent
  | ValidationFailedEvent
  
  // Performance Events
  | PerformanceUpdateEvent
  | MetricsResetEvent
  
  // Error Handling Events
  | ErrorRecoveredEvent
  | FatalErrorEvent
  
  // Debug Events
  | DebugInfoRequestedEvent
  | StateSnapshotRequestedEvent;

// ================================
// EXECUTION CONTROL EVENTS
// ================================

export interface StartExecutionEvent {
  type: 'START_EXECUTION';
  ticker: string;
  debugMode?: boolean;
  customSteps?: number[];
  skipValidation?: boolean;
}

export interface CancelExecutionEvent {
  type: 'CANCEL_EXECUTION';
  reason?: string;
  immediate?: boolean;
}

export interface ResetExecutionEvent {
  type: 'RESET';
  preserveConfig?: boolean;
  clearPerformanceMetrics?: boolean;
}

export interface PauseExecutionEvent {
  type: 'PAUSE_EXECUTION';
  reason?: string;
}

export interface ResumeExecutionEvent {
  type: 'RESUME_EXECUTION';
  fromStep?: number;
}

// ================================
// STEP MANAGEMENT EVENTS
// ================================

export interface StepCompletedEvent {
  type: 'STEP_COMPLETED';
  stepId: number;
  result: StepResult;
  nextStep?: number;
}

export interface StepFailedEvent {
  type: 'STEP_FAILED';
  stepId: number;
  error: Error;
  retryable?: boolean;
  suggestedRetryDelay?: number;
}

export interface StepTimeoutEvent {
  type: 'STEP_TIMEOUT';
  stepId: number;
  error: Error;
  timeoutDuration: number;
}

export interface RetryStepEvent {
  type: 'RETRY_STEP';
  stepId: number;
  delayMs?: number;
  maxAttempts?: number;
}

export interface SkipStepEvent {
  type: 'SKIP_STEP';
  stepId: number;
  reason: string;
}

// ================================
// CONFIGURATION EVENTS
// ================================

export interface UpdateTimeoutConfigEvent {
  type: 'UPDATE_TIMEOUT_CONFIG';
  config: Partial<TimeoutConfig>;
  applyToCurrentExecution?: boolean;
}

export interface SetDebugModeEvent {
  type: 'SET_DEBUG_MODE';
  enabled: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

export interface ExpirationSelectedEvent {
  type: 'EXPIRATION_SELECTED';
  expiration: string;
  validateImmediately?: boolean;
}

// ================================
// VALIDATION EVENTS
// ================================

export interface PrerequisitesValidatedEvent {
  type: 'PREREQUISITES_VALIDATED';
  stepId: number;
  valid: boolean;
  details?: Array<{
    type: string;
    property: string;
    met: boolean;
    message: string;
  }>;
}

export interface ValidationFailedEvent {
  type: 'VALIDATION_FAILED';
  stepId: number;
  errors: string[];
  canProceed: boolean;
}

// ================================
// PERFORMANCE EVENTS
// ================================

export interface PerformanceUpdateEvent {
  type: 'PERFORMANCE_UPDATE';
  metrics: Partial<PerformanceMetrics>;
  timestamp?: number;
}

export interface MetricsResetEvent {
  type: 'METRICS_RESET';
  preserveHistory?: boolean;
}

// ================================
// ERROR HANDLING EVENTS
// ================================

export interface ErrorRecoveredEvent {
  type: 'ERROR_RECOVERED';
  previousError: Error;
  recoveryAction: string;
}

export interface FatalErrorEvent {
  type: 'FATAL_ERROR';
  error: Error;
  context?: Record<string, any>;
  stackTrace?: string;
}

// ================================
// DEBUG EVENTS
// ================================

export interface DebugInfoRequestedEvent {
  type: 'DEBUG_INFO_REQUESTED';
  requestId: string;
  includeStepDetails?: boolean;
  includePerformanceMetrics?: boolean;
}

export interface StateSnapshotRequestedEvent {
  type: 'STATE_SNAPSHOT_REQUESTED';
  requestId: string;
  includeContext?: boolean;
}

// ================================
// EVENT FACTORIES
// ================================

export const createStartExecutionEvent = (
  ticker: string,
  options: Omit<StartExecutionEvent, 'type' | 'ticker'> = {}
): StartExecutionEvent => ({
  type: 'START_EXECUTION',
  ticker,
  ...options
});

export const createStepCompletedEvent = (
  stepId: number,
  result: StepResult,
  options: Omit<StepCompletedEvent, 'type' | 'stepId' | 'result'> = {}
): StepCompletedEvent => ({
  type: 'STEP_COMPLETED',
  stepId,
  result,
  ...options
});

export const createStepFailedEvent = (
  stepId: number,
  error: Error,
  options: Omit<StepFailedEvent, 'type' | 'stepId' | 'error'> = {}
): StepFailedEvent => ({
  type: 'STEP_FAILED',
  stepId,
  error,
  ...options
});

export const createRetryStepEvent = (
  stepId: number,
  options: Omit<RetryStepEvent, 'type' | 'stepId'> = {}
): RetryStepEvent => ({
  type: 'RETRY_STEP',
  stepId,
  ...options
});

export const createCancelExecutionEvent = (
  options: Omit<CancelExecutionEvent, 'type'> = {}
): CancelExecutionEvent => ({
  type: 'CANCEL_EXECUTION',
  ...options
});

// ================================
// EVENT UTILITIES
// ================================

export const isExecutionControlEvent = (event: MacroExecutionEvent): boolean => {
  return [
    'START_EXECUTION',
    'CANCEL_EXECUTION',
    'RESET',
    'PAUSE_EXECUTION',
    'RESUME_EXECUTION'
  ].includes(event.type);
};

export const isStepManagementEvent = (event: MacroExecutionEvent): boolean => {
  return [
    'STEP_COMPLETED',
    'STEP_FAILED',
    'STEP_TIMEOUT',
    'RETRY_STEP',
    'SKIP_STEP'
  ].includes(event.type);
};

export const isConfigurationEvent = (event: MacroExecutionEvent): boolean => {
  return [
    'UPDATE_TIMEOUT_CONFIG',
    'SET_DEBUG_MODE',
    'EXPIRATION_SELECTED'
  ].includes(event.type);
};

export const isValidationEvent = (event: MacroExecutionEvent): boolean => {
  return [
    'PREREQUISITES_VALIDATED',
    'VALIDATION_FAILED'
  ].includes(event.type);
};

export const isErrorEvent = (event: MacroExecutionEvent): boolean => {
  return [
    'STEP_FAILED',
    'STEP_TIMEOUT',
    'VALIDATION_FAILED',
    'FATAL_ERROR'
  ].includes(event.type);
};

export const isSuccessEvent = (event: MacroExecutionEvent): boolean => {
  return [
    'STEP_COMPLETED',
    'PREREQUISITES_VALIDATED',
    'ERROR_RECOVERED'
  ].includes(event.type);
};

// ================================
// EVENT VALIDATION
// ================================

export const validateEvent = (event: any): event is MacroExecutionEvent => {
  if (!event || typeof event !== 'object' || typeof event.type !== 'string') {
    return false;
  }

  // Basic validation for required fields based on event type
  switch (event.type) {
    case 'START_EXECUTION':
      return typeof event.ticker === 'string' && event.ticker.length > 0;
    
    case 'STEP_COMPLETED':
      return typeof event.stepId === 'number' && event.result && typeof event.result === 'object';
    
    case 'STEP_FAILED':
    case 'STEP_TIMEOUT':
      return typeof event.stepId === 'number' && event.error instanceof Error;
    
    case 'RETRY_STEP':
    case 'SKIP_STEP':
      return typeof event.stepId === 'number';
    
    case 'EXPIRATION_SELECTED':
      return typeof event.expiration === 'string' && event.expiration.length > 0;
    
    default:
      return true; // Allow other events to pass through
  }
};

// ================================
// EVENT SERIALIZATION
// ================================

export const serializeEvent = (event: MacroExecutionEvent): string => {
  try {
    // Handle Error objects specially since they don't serialize well
    const serializable = { ...event };
    if ('error' in event && event.error instanceof Error) {
      (serializable as any).error = {
        name: event.error.name,
        message: event.error.message,
        stack: event.error.stack
      };
    }
    return JSON.stringify(serializable);
  } catch (error) {
    console.warn('Failed to serialize event:', error);
    return JSON.stringify({ type: 'SERIALIZATION_ERROR', originalType: event.type });
  }
};

export const deserializeEvent = (eventJson: string): MacroExecutionEvent | null => {
  try {
    const parsed = JSON.parse(eventJson);
    
    // Reconstruct Error objects
    if (parsed.error && typeof parsed.error === 'object' && parsed.error.name && parsed.error.message) {
      const error = new Error(parsed.error.message);
      error.name = parsed.error.name;
      if (parsed.error.stack) {
        error.stack = parsed.error.stack;
      }
      parsed.error = error;
    }
    
    return validateEvent(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Failed to deserialize event:', error);
    return null;
  }
};