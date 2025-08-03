/**
 * XState v5 Macro Execution Machine
 * 
 * This file contains the core XState machine definition for macro execution
 * using XState v5's setup() pattern with proper TypeScript integration.
 */

import { setup, assign } from 'xstate';
import type { 
  MacroExecutionContext, 
  MacroExecutionEvent,
  MacroExecutionStateValue,
  DEFAULT_TIMEOUT_CONFIG,
  DEFAULT_PERFORMANCE_METRICS
} from '../types/macro-types';
import { MACRO_STEPS } from '../types/macro-types';
import { createDefaultContext } from '../types/context-types';

// ================================
// MACHINE SETUP
// ================================

export const macroExecutionMachine = setup({
  types: {
    context: {} as MacroExecutionContext,
    events: {} as MacroExecutionEvent,
    input: {} as { ticker: string; debugMode?: boolean }
  },

  // ================================
  // GUARDS
  // ================================
  guards: {
    canExecuteStep: ({ context }, params: { stepId: number }) => {
      const step = MACRO_STEPS.find(s => s.id === params.stepId);
      if (!step) return false;
      
      // Check if all prerequisites are met
      return step.prerequisites.every(prereq => {
        switch (prereq.type) {
          case 'context_property':
            return Boolean((context as any)[prereq.property]);
          case 'data_exists':
            return prereq.validator ? prereq.validator(context) : false;
          case 'state_value':
            return (context as any)[prereq.property] === prereq.expectedValue;
          case 'custom':
            return prereq.validator ? prereq.validator(context) : true;
          default:
            return true;
        }
      });
    },

    hasValidExpiration: ({ context }) => {
      return Boolean(context.selectedExpiration);
    },

    canRetryStep: ({ context }, params: { stepId: number }) => {
      const step = MACRO_STEPS.find(s => s.id === params.stepId);
      if (!step || !step.retryable) return false;
      
      return context.currentRetryAttempt < context.timeoutSettings.maxRetries;
    },

    hasRequiredData: ({ context }, params: { dataKeys: string[] }) => {
      return params.dataKeys.every(key => {
        // Check if data exists in step results
        const stepId = parseInt(key.replace('step', ''));
        if (!isNaN(stepId)) {
          const result = context.stepResults.get(stepId);
          return result && result.status === 'success' && result.data;
        }
        
        // Check context properties
        return Boolean((context as any)[key]);
      });
    },

    isWithinRetryLimit: ({ context }) => {
      return context.currentRetryAttempt < context.timeoutSettings.maxRetries;
    },

    prerequisitesMet: ({ context }, params: { stepId: number }) => {
      const step = MACRO_STEPS.find(s => s.id === params.stepId);
      if (!step) return false;
      
      return step.prerequisites.every(prereq => prereq.validator ? prereq.validator(context) : true);
    },

    isDebugMode: ({ context }) => {
      return context.debugMode;
    },

    executionCancelled: ({ context }) => {
      return context.cancelled;
    },

    hasError: ({ context }) => {
      return Boolean(context.error);
    }
  },

  // ================================
  // ACTIONS
  // ================================
  actions: {
    initializeContext: assign(({ context, event }) => {
      if (event.type !== 'START_EXECUTION') return context;
      
      const updatedContext = {
        ...context,
        startTime: Date.now(),
        error: null,
        cancelled: false,
        currentRetryAttempt: 0
      };
      
      if (context.debugMode) {
        console.log(`[XState] Initializing macro execution for ${context.ticker}`, {
          executionId: context.executionId,
          debugMode: context.debugMode
        });
      }
      
      return updatedContext;
    }),

    updateStepResult: assign(({ context, event }) => {
      if (event.type !== 'STEP_COMPLETED') return context;
      
      const updatedStepResults = new Map(context.stepResults);
      updatedStepResults.set(event.stepId, event.result);
      
      const updatedCompletedSteps = [...context.completedSteps];
      if (!updatedCompletedSteps.includes(event.stepId)) {
        updatedCompletedSteps.push(event.stepId);
      }
      
      if (context.debugMode) {
        console.log(`[XState] Step ${event.stepId} completed`, {
          stepName: event.result.stepName,
          duration: event.result.duration,
          status: event.result.status
        });
      }
      
      return {
        ...context,
        stepResults: updatedStepResults,
        completedSteps: updatedCompletedSteps,
        currentStep: (event as any).nextStep || context.currentStep + 1,
        currentRetryAttempt: 0 // Reset retry count on success
      };
    }),

    incrementRetryCount: assign(({ context }) => {
      const newRetryCount = context.currentRetryAttempt + 1;
      
      if (context.debugMode) {
        console.log(`[XState] Incrementing retry count to ${newRetryCount}`);
      }
      
      return {
        ...context,
        currentRetryAttempt: newRetryCount,
        performance: {
          ...context.performance,
          retryCount: context.performance.retryCount + 1
        }
      };
    }),

    setError: assign(({ context, event }) => {
      const error = 'error' in event ? event.error : new Error('Unknown error');
      
      if (context.debugMode) {
        console.error(`[XState] Error occurred:`, error);
      }
      
      return {
        ...context,
        error
      };
    }),

    clearError: assign(({ context }) => {
      if (context.debugMode && context.error) {
        console.log(`[XState] Clearing error:`, context.error.message);
      }
      
      return {
        ...context,
        error: null
      };
    }),

    markStepCompleted: assign(({ context, event }) => {
      if (event.type !== 'STEP_COMPLETED') return context;
      
      const updatedCompletedSteps = [...context.completedSteps];
      if (!updatedCompletedSteps.includes(event.stepId)) {
        updatedCompletedSteps.push(event.stepId);
      }
      
      return {
        ...context,
        completedSteps: updatedCompletedSteps
      };
    }),

    resetExecution: assign(({ context }) => {
      if (context.debugMode) {
        console.log(`[XState] Resetting execution for ${context.ticker}`);
      }
      
      return {
        ...context,
        stepResults: new Map(),
        currentStep: 0,
        completedSteps: [],
        error: null,
        startTime: null,
        performance: {
          totalDuration: 0,
          stepDurations: new Map(),
          retryCount: 0,
          timeoutCount: 0
        },
        currentRetryAttempt: 0,
        cancelled: false
      };
    }),

    updatePerformanceMetrics: assign(({ context, event }) => {
      if (event.type !== 'PERFORMANCE_UPDATE') return context;
      
      return {
        ...context,
        performance: {
          ...context.performance,
          ...event.metrics
        }
      };
    }),

    logDebugInfo: ({ context, event }) => {
      if (!context.debugMode) return;
      
      console.log(`[XState] Debug info:`, {
        executionId: context.executionId,
        ticker: context.ticker,
        currentStep: context.currentStep,
        completedSteps: context.completedSteps,
        event: event.type,
        timestamp: new Date().toISOString()
      });
    },

    cancelExecution: assign(({ context, event }) => {
      const reason = event.type === 'CANCEL_EXECUTION' ? event.reason || 'User cancelled' : 'Execution cancelled';
      
      if (context.debugMode) {
        console.log(`[XState] Cancelling execution:`, reason);
      }
      
      return {
        ...context,
        cancelled: true,
        error: new Error(reason)
      };
    }),

    setSelectedExpiration: assign(({ context, event }) => {
      if (event.type !== 'EXPIRATION_SELECTED') return context;
      
      if (context.debugMode) {
        console.log(`[XState] Expiration selected:`, event.expiration);
      }
      
      return {
        ...context,
        selectedExpiration: event.expiration
      };
    }),

    setStartTime: assign(({ context }) => ({
      ...context,
      startTime: Date.now()
    })),

    updateTimeoutConfig: assign(({ context, event }) => {
      if (event.type !== 'UPDATE_TIMEOUT_CONFIG') return context;
      
      return {
        ...context,
        timeoutSettings: {
          ...context.timeoutSettings,
          ...event.config
        }
      };
    }),

    setDebugMode: assign(({ context, event }) => {
      if (event.type !== 'SET_DEBUG_MODE') return context;
      
      return {
        ...context,
        debugMode: event.enabled
      };
    })
  }
}).createMachine({
  // ================================
  // MACHINE CONFIGURATION
  // ================================
  id: 'macroExecution',
  initial: 'idle',
  
  context: ({ input }) => {
    if (!input || !input.ticker) {
      throw new Error('Ticker input is required for macro execution machine');
    }
    return createDefaultContext(input.ticker, {
      debugMode: input.debugMode || false
    });
  },

  // ================================
  // STATE DEFINITIONS
  // ================================
  states: {
    idle: {
      entry: ['logDebugInfo'],
      on: {
        START_EXECUTION: {
          target: 'initializing',
          actions: ['initializeContext', 'setStartTime', 'clearError']
        },
        SET_DEBUG_MODE: {
          actions: ['setDebugMode']
        },
        UPDATE_TIMEOUT_CONFIG: {
          actions: ['updateTimeoutConfig']
        }
      }
    },

    initializing: {
      entry: ['logDebugInfo'],
      always: [
        {
          target: 'validatingPrerequisites',
          guard: 'hasValidExpiration'
        },
        {
          target: 'waitingForExpiration'
        }
      ]
    },

    waitingForExpiration: {
      entry: ['logDebugInfo'],
      on: {
        EXPIRATION_SELECTED: {
          target: 'validatingPrerequisites',
          actions: ['setSelectedExpiration']
        },
        CANCEL_EXECUTION: {
          target: 'cancelled',
          actions: ['cancelExecution']
        },
        RESET: {
          target: 'idle',
          actions: ['resetExecution']
        }
      }
    },

    validatingPrerequisites: {
      entry: ['logDebugInfo'],
      initial: 'checkingStep1',
      states: {
        checkingStep1: {
          always: [
            {
              target: '#macroExecution.executing.step1',
              guard: { type: 'canExecuteStep', params: { stepId: 1 } }
            },
            {
              target: '#macroExecution.error'
            }
          ]
        }
      }
    },

    executing: {
      entry: ['logDebugInfo'],
      initial: 'step1',
      on: {
        CANCEL_EXECUTION: {
          target: 'cancelled',
          actions: ['cancelExecution']
        },
        STEP_FAILED: [
          {
            target: 'retrying',
            guard: ({ context, event }) => {
              const stepId = 'stepId' in event ? event.stepId : 0;
              const step = MACRO_STEPS.find(s => s.id === stepId);
              if (!step || !step.retryable) return false;
              return context.currentRetryAttempt < context.timeoutSettings.maxRetries;
            },
            actions: ['setError', 'logDebugInfo']
          },
          {
            target: 'error',
            actions: ['setError', 'logDebugInfo']
          }
        ],
        STEP_TIMEOUT: [
          {
            target: 'retrying',
            guard: ({ context, event }) => {
              const stepId = 'stepId' in event ? event.stepId : 0;
              const step = MACRO_STEPS.find(s => s.id === stepId);
              if (!step || !step.retryable) return false;
              return context.currentRetryAttempt < context.timeoutSettings.maxRetries;
            },
            actions: ['setError', 'incrementRetryCount', 'logDebugInfo']
          },
          {
            target: 'error',
            actions: ['setError', 'logDebugInfo']
          }
        ]
      },
      states: {
        step1: {
          entry: ['logDebugInfo'],
          on: {
            STEP_COMPLETED: [
              {
                target: 'step2',
                guard: { type: 'canExecuteStep', params: { stepId: 2 } },
                actions: ['updateStepResult', 'logDebugInfo']
              },
              {
                target: '#macroExecution.error',
                actions: ['updateStepResult', 'logDebugInfo']
              }
            ]
          }
        },

        step2: {
          entry: ['logDebugInfo'],
          on: {
            STEP_COMPLETED: [
              {
                target: 'step3',
                guard: { type: 'canExecuteStep', params: { stepId: 3 } },
                actions: ['updateStepResult', 'logDebugInfo']
              },
              {
                target: '#macroExecution.error',
                actions: ['updateStepResult', 'logDebugInfo']
              }
            ]
          }
        },

        step3: {
          entry: ['logDebugInfo'],
          on: {
            STEP_COMPLETED: [
              {
                target: 'step4',
                guard: { type: 'canExecuteStep', params: { stepId: 4 } },
                actions: ['updateStepResult', 'logDebugInfo']
              },
              {
                target: '#macroExecution.error',
                actions: ['updateStepResult', 'logDebugInfo']
              }
            ]
          }
        },

        step4: {
          entry: ['logDebugInfo'],
          on: {
            STEP_COMPLETED: {
              target: '#macroExecution.completed',
              actions: ['updateStepResult', 'logDebugInfo']
            }
          }
        }
      }
    },

    retrying: {
      entry: ['incrementRetryCount', 'logDebugInfo'],
      always: [
        {
          target: 'executing',
          guard: 'isWithinRetryLimit',
          actions: ['clearError']
        },
        {
          target: 'error'
        }
      ]
    },

    completed: {
      type: 'final',
      entry: ['logDebugInfo'],
      on: {
        RESET: {
          target: 'idle',
          actions: ['resetExecution']
        }
      }
    },

    error: {
      entry: ['logDebugInfo'],
      on: {
        RETRY_STEP: {
          target: 'retrying',
          actions: ['clearError', 'logDebugInfo']
        },
        RESET: {
          target: 'idle',
          actions: ['resetExecution']
        },
        // ERROR_RECOVERED event handled by global event handlers
      }
    },

    cancelled: {
      entry: ['logDebugInfo'],
      on: {
        RESET: {
          target: 'idle',
          actions: ['resetExecution']
        }
      }
    }
  },

  // ================================
  // GLOBAL EVENT HANDLERS
  // ================================
  on: {
    SET_DEBUG_MODE: {
      actions: ['setDebugMode']
    },
    UPDATE_TIMEOUT_CONFIG: {
      actions: ['updateTimeoutConfig']
    },
    PERFORMANCE_UPDATE: {
      actions: ['updatePerformanceMetrics']
    }
  }
});

// ================================
// MACHINE FACTORY
// ================================

export const createMacroExecutionMachine = (ticker: string, options: { debugMode?: boolean } = {}) => {
  const input = {
    ticker,
    debugMode: options.debugMode || false
  };
  
  return macroExecutionMachine.provide({});
};

// ================================
// TYPE EXPORTS
// ================================

export type MacroExecutionMachine = typeof macroExecutionMachine;
export type MacroExecutionActor = ReturnType<typeof macroExecutionMachine.provide>;