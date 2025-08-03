/**
 * XState Machine Testing Utilities
 * 
 * This file provides comprehensive testing utilities for XState machines
 * in the macro automation system.
 */

import { createActor } from 'xstate';
import type { 
  MacroExecutionContext, 
  MacroExecutionEvent,
  StepResult,
  MacroExecutionStateValue 
} from '../types/macro-types';
import { createDefaultContext } from '../types/context-types';
import { macroExecutionMachine } from '../machines/macro-execution-machine';

// ================================
// TEST ACTOR UTILITIES
// ================================

export interface TestActorOptions {
  ticker?: string;
  debugMode?: boolean;
  initialContext?: Partial<MacroExecutionContext>;
  autoStart?: boolean;
}

export const createTestActor = (options: TestActorOptions = {}) => {
  const { ticker = 'TEST', debugMode = false, initialContext, autoStart = true } = options;
  
  const machine = macroExecutionMachine.provide({});
  
  const actor = createActor(machine, {
    input: { ticker, debugMode }
  });
  
  if (initialContext) {
    // Note: In XState v5, we would need to use a different approach
    // to override initial context. This is a simplified version.
    console.warn('Initial context override not fully implemented for XState v5');
  }
  
  if (autoStart) {
    actor.start();
  }
  
  return actor;
};

// ================================
// STATE WAITING UTILITIES
// ================================

export const waitForState = async (
  actor: ReturnType<typeof createTestActor>,
  stateMatcher: string | ((state: any) => boolean),
  timeout: number = 5000
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      subscription.unsubscribe();
      reject(new Error(`Timeout waiting for state: ${typeof stateMatcher === 'string' ? stateMatcher : 'custom matcher'}`));
    }, timeout);
    
    const subscription = actor.subscribe((state) => {
      const matches = typeof stateMatcher === 'string' 
        ? state.matches(stateMatcher as any)
        : stateMatcher(state);
        
      if (matches) {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        resolve(state);
      }
    });
  });
};

export const waitForEvent = async (
  actor: ReturnType<typeof createTestActor>,
  eventType: MacroExecutionEvent['type'],
  timeout: number = 5000
): Promise<MacroExecutionEvent> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventType}`));
    }, timeout);
    
    let eventReceived = false;
    
    // Subscribe to actor to capture sent events
    const originalSend = actor.send.bind(actor);
    actor.send = (event: any) => {
      if (!eventReceived && event.type === eventType) {
        eventReceived = true;
        clearTimeout(timeoutId);
        resolve(event);
      }
      return originalSend(event);
    };
  });
};

// ================================
// ASSERTION UTILITIES
// ================================

export const assertState = (actor: ReturnType<typeof createTestActor>, expectedState: string) => {
  const currentState = actor.getSnapshot();
  const matches = currentState.matches(expectedState as any);
  
  if (!matches) {
    throw new Error(`Expected state "${expectedState}", but got "${currentState.value}"`);
  }
  
  return currentState;
};

export const assertContext = (
  actor: ReturnType<typeof createTestActor>,
  assertions: Partial<MacroExecutionContext> | ((context: MacroExecutionContext) => boolean)
) => {
  const currentState = actor.getSnapshot();
  const context = currentState.context as MacroExecutionContext;
  
  if (typeof assertions === 'function') {
    const result = assertions(context);
    if (!result) {
      throw new Error('Context assertion failed');
    }
  } else {
    Object.entries(assertions).forEach(([key, expectedValue]) => {
      const actualValue = (context as any)[key];
      if (actualValue !== expectedValue) {
        throw new Error(`Expected context.${key} to be ${expectedValue}, but got ${actualValue}`);
      }
    });
  }
  
  return context;
};

export const assertStepResult = (
  actor: ReturnType<typeof createTestActor>,
  stepId: number,
  expectedStatus: StepResult['status']
) => {
  const context = actor.getSnapshot().context as MacroExecutionContext;
  const stepResult = context.stepResults.get(stepId);
  
  if (!stepResult) {
    throw new Error(`No result found for step ${stepId}`);
  }
  
  if (stepResult.status !== expectedStatus) {
    throw new Error(`Expected step ${stepId} to have status "${expectedStatus}", but got "${stepResult.status}"`);
  }
  
  return stepResult;
};

// ================================
// SCENARIO TESTING
// ================================

export interface TestScenario {
  name: string;
  description: string;
  setup: (actor: ReturnType<typeof createTestActor>) => void;
  actions: Array<{
    action: 'send' | 'wait' | 'assert';
    params: any;
  }>;
  cleanup?: (actor: ReturnType<typeof createTestActor>) => void;
}

export const runTestScenario = async (scenario: TestScenario, options: TestActorOptions = {}) => {
  const actor = createTestActor(options);
  
  try {
    // Setup
    if (scenario.setup) {
      scenario.setup(actor);
    }
    
    // Execute actions
    for (const step of scenario.actions) {
      switch (step.action) {
        case 'send':
          actor.send(step.params);
          break;
          
        case 'wait':
          await waitForState(actor, step.params.state, step.params.timeout);
          break;
          
        case 'assert':
          if (step.params.type === 'state') {
            assertState(actor, step.params.expected);
          } else if (step.params.type === 'context') {
            assertContext(actor, step.params.assertions);
          } else if (step.params.type === 'stepResult') {
            assertStepResult(actor, step.params.stepId, step.params.status);
          }
          break;
      }
    }
    
    console.log(`✅ Test scenario "${scenario.name}" passed`);
    return { success: true, actor };
    
  } catch (error) {
    console.error(`❌ Test scenario "${scenario.name}" failed:`, error);
    return { success: false, error, actor };
    
  } finally {
    // Cleanup
    if (scenario.cleanup) {
      scenario.cleanup(actor);
    }
    actor.stop();
  }
};

// ================================
// COMMON TEST SCENARIOS
// ================================

export const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Basic Execution Flow',
    description: 'Test normal execution from idle to completed',
    setup: (actor) => {
      // No special setup needed
    },
    actions: [
      {
        action: 'assert',
        params: { type: 'state', expected: 'idle' }
      },
      {
        action: 'send',
        params: { type: 'START_EXECUTION', ticker: 'TEST' }
      },
      {
        action: 'wait',
        params: { state: 'waitingForExpiration', timeout: 1000 }
      },
      {
        action: 'send',
        params: { type: 'EXPIRATION_SELECTED', expiration: '2024-01-19' }
      },
      {
        action: 'wait',
        params: { state: 'executing.step1', timeout: 1000 }
      }
    ]
  },
  
  {
    name: 'Step Completion',
    description: 'Test step completion and progression',
    setup: (actor) => {
      actor.send({ type: 'START_EXECUTION', ticker: 'TEST' });
      actor.send({ type: 'EXPIRATION_SELECTED', expiration: '2024-01-19' });
    },
    actions: [
      {
        action: 'wait',
        params: { state: 'executing.step1', timeout: 1000 }
      },
      {
        action: 'send',
        params: {
          type: 'STEP_COMPLETED',
          stepId: 1,
          result: {
            stepId: 1,
            stepName: 'Test Step 1',
            status: 'success',
            data: { test: 'data' },
            duration: 1000,
            startTime: Date.now(),
            retryCount: 0
          }
        }
      },
      {
        action: 'wait',
        params: { state: 'executing.step2', timeout: 1000 }
      },
      {
        action: 'assert',
        params: {
          type: 'context',
          assertions: (context: MacroExecutionContext) => context.completedSteps.includes(1)
        }
      }
    ]
  },
  
  {
    name: 'Error Handling',
    description: 'Test error handling and retry logic',
    setup: (actor) => {
      actor.send({ type: 'START_EXECUTION', ticker: 'TEST' });
      actor.send({ type: 'EXPIRATION_SELECTED', expiration: '2024-01-19' });
    },
    actions: [
      {
        action: 'wait',
        params: { state: 'executing.step1', timeout: 1000 }
      },
      {
        action: 'send',
        params: {
          type: 'STEP_FAILED',
          stepId: 1,
          error: new Error('Test error'),
          retryable: true
        }
      },
      {
        action: 'wait',
        params: { state: 'retrying', timeout: 1000 }
      },
      {
        action: 'assert',
        params: {
          type: 'context',
          assertions: (context: MacroExecutionContext) => context.currentRetryAttempt > 0
        }
      }
    ]
  },
  
  {
    name: 'Cancellation',
    description: 'Test execution cancellation',
    setup: (actor) => {
      actor.send({ type: 'START_EXECUTION', ticker: 'TEST' });
    },
    actions: [
      {
        action: 'send',
        params: { type: 'CANCEL_EXECUTION', reason: 'Test cancellation' }
      },
      {
        action: 'wait',
        params: { state: 'cancelled', timeout: 1000 }
      },
      {
        action: 'assert',
        params: {
          type: 'context',
          assertions: (context: MacroExecutionContext) => context.cancelled === true
        }
      }
    ]
  }
];

// ================================
// PERFORMANCE TESTING
// ================================

export interface PerformanceTestResult {
  scenario: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  errors: Error[];
}

export const runPerformanceTest = async (
  scenario: TestScenario,
  iterations: number = 100,
  options: TestActorOptions = {}
): Promise<PerformanceTestResult> => {
  const times: number[] = [];
  const errors: Error[] = [];
  let successes = 0;
  
  console.log(`🏃 Running performance test: ${scenario.name} (${iterations} iterations)`);
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const result = await runTestScenario(scenario, options);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      times.push(duration);
      
      if (result.success) {
        successes++;
      } else if (result.error) {
        errors.push(result.error as Error);
      }
      
    } catch (error) {
      errors.push(error as Error);
      times.push(Date.now() - startTime);
    }
    
    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`  Progress: ${i + 1}/${iterations}`);
    }
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const successRate = (successes / iterations) * 100;
  
  const result: PerformanceTestResult = {
    scenario: scenario.name,
    iterations,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    successRate,
    errors
  };
  
  console.log(`📊 Performance test results for "${scenario.name}":`, {
    averageTime: `${averageTime.toFixed(2)}ms`,
    successRate: `${successRate.toFixed(1)}%`,
    errorCount: errors.length
  });
  
  return result;
};

// ================================
// BATCH TESTING
// ================================

export const runAllTestScenarios = async (options: TestActorOptions = {}) => {
  console.log('🧪 Running all test scenarios...');
  
  const results = [];
  
  for (const scenario of TEST_SCENARIOS) {
    const result = await runTestScenario(scenario, options);
    results.push(result);
  }
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`📋 Test Summary: ${successful}/${total} scenarios passed`);
  
  if (successful < total) {
    console.error('❌ Some tests failed. Check individual test output for details.');
  } else {
    console.log('✅ All tests passed!');
  }
  
  return results;
};

// ================================
// EXPORTS
// ================================

// Types are already exported in the main export section above