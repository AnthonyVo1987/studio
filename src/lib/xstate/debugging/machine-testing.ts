/**
 * @fileOverview XState Machine Testing Utilities and Mocks
 * 
 * Comprehensive testing infrastructure for XState machines including
 * testing helpers, mock services, scenario runners, and state validation.
 * Integrates with existing test-utils and macro execution patterns.
 */

import { createActor, type ActorRef, type StateFrom, type EventFrom } from 'xstate';
import type {
  TestingConfiguration,
  MockServiceConfiguration,
  MockCondition,
  TestScenario,
  TestEvent,
  TestAssertion,
  TestResult,
  AssertionResult,
  StateManipulationCommand
} from './debugging-types';
import type { MacroExecutionContext, MacroExecutionEvent, MacroStepNumber } from '../types/macro-types';
import { createTickerLogger, generateExecutionId } from '../../ticker-logger';
import { globalAdvancedLogger } from './advanced-logger';

// ================================
// TESTING CONFIGURATION
// ================================

export const DEFAULT_TESTING_CONFIG: TestingConfiguration = {
  enableMockServices: true,
  enableTimeTravel: true,
  enableStateManipulation: true,
  mockServiceDelay: 100,
  automaticStateValidation: true,
  testDataGeneration: true
};

// ================================
// MOCK SERVICE MANAGER
// ================================

export class MockServiceManager {
  private mocks: Map<string, MockServiceConfiguration> = new Map();
  private logger = createTickerLogger('SYSTEM', 'MockServices', generateExecutionId('mocks'));
  private callHistory: Map<string, any[]> = new Map();
  private enabled: boolean = false;

  constructor(private config: TestingConfiguration = DEFAULT_TESTING_CONFIG) {
    this.enabled = config.enableMockServices;
  }

  registerMock(config: MockServiceConfiguration): void {
    this.mocks.set(config.serviceName, config);
    this.callHistory.set(config.serviceName, []);
    
    this.logger.info('RegisterMock', `Registered mock service: ${config.serviceName}`, {
      mockType: config.mockType,
      delay: config.delay,
      errorRate: config.errorRate
    });
  }

  unregisterMock(serviceName: string): void {
    if (this.mocks.delete(serviceName)) {
      this.callHistory.delete(serviceName);
      this.logger.info('UnregisterMock', `Unregistered mock service: ${serviceName}`);
    }
  }

  createMockService(serviceName: string) {
    if (!this.enabled) {
      throw new Error('Mock services are disabled');
    }

    const config = this.mocks.get(serviceName);
    if (!config) {
      throw new Error(`No mock configuration found for service: ${serviceName}`);
    }

    return async (context: any, event: any) => {
      this.recordServiceCall(serviceName, { context, event });

      // Apply conditions if present
      if (config.conditions) {
        for (const condition of config.conditions) {
          if (condition.when(context, event)) {
            return this.executeMockBehavior(serviceName, condition.then, condition.value);
          }
        }
      }

      // Default behavior
      return this.executeMockBehavior(serviceName, config.mockType, config.responseData);
    };
  }

  private async executeMockBehavior(
    serviceName: string, 
    mockType: MockServiceConfiguration['mockType'], 
    responseData?: any
  ): Promise<any> {
    const config = this.mocks.get(serviceName)!;
    
    // Apply delay if configured
    if (config.delay || this.config.mockServiceDelay) {
      await this.sleep(config.delay || this.config.mockServiceDelay);
    }

    switch (mockType) {
      case 'success':
        this.logger.debug('MockSuccess', `Mock service success: ${serviceName}`, { responseData });
        return responseData || { status: 'success', timestamp: Date.now() };

      case 'error': {
        this.logger.debug('MockError', `Mock service error: ${serviceName}`);
        const error = new Error(responseData?.message || `Mock error from ${serviceName}`);
        error.name = responseData?.name || 'MockServiceError';
        throw error;
      }

      case 'delayed': {
        const delayTime = responseData?.delay || 1000;
        await this.sleep(delayTime);
        this.logger.debug('MockDelayed', `Mock service delayed response: ${serviceName}`, { delayTime });
        return responseData?.data || { status: 'delayed_success', delay: delayTime };
      }

      case 'conditional':
        // Conditional behavior should have been handled above
        return responseData || { status: 'conditional_success' };

      default:
        throw new Error(`Unknown mock type: ${mockType}`);
    }
  }

  private recordServiceCall(serviceName: string, callData: any): void {
    const history = this.callHistory.get(serviceName) || [];
    history.push({
      timestamp: Date.now(),
      ...callData
    });
    
    // Keep only last 100 calls per service
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.callHistory.set(serviceName, history);
  }

  getCallHistory(serviceName: string): any[] {
    return [...(this.callHistory.get(serviceName) || [])];
  }

  clearCallHistory(serviceName?: string): void {
    if (serviceName) {
      this.callHistory.set(serviceName, []);
    } else {
      this.callHistory.clear();
    }
    
    this.logger.debug('ClearCallHistory', serviceName ? 
      `Cleared call history for ${serviceName}` : 
      'Cleared all call history'
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.logger.info('SetEnabled', `Mock services ${enabled ? 'enabled' : 'disabled'}`);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getAllMocks(): MockServiceConfiguration[] {
    return Array.from(this.mocks.values());
  }
}

// ================================
// TEST SCENARIO RUNNER
// ================================

export class TestScenarioRunner {
  private logger = createTickerLogger('SYSTEM', 'TestRunner', generateExecutionId('testrunner'));
  private mockManager: MockServiceManager;
  private runningTests: Map<string, Promise<TestResult>> = new Map();

  constructor(mockManager: MockServiceManager) {
    this.mockManager = mockManager;
  }

  async runScenario(scenario: TestScenario, machine: any): Promise<TestResult> {
    const testId = generateExecutionId('test');
    
    this.logger.info('RunScenario', `Starting test scenario: ${scenario.name}`, {
      scenarioId: scenario.id,
      testId,
      eventsCount: scenario.events.length,
      assertionsCount: scenario.assertions.length
    });

    const startTime = Date.now();

    try {
      // Create actor with initial state and context
      const actor = createActor(machine, {
        input: scenario.initialContext
      });

      // Start the actor
      actor.start();

      // Verify initial state
      const initialState = actor.getSnapshot();
      if (!this.compareStates(initialState.value, scenario.initialState)) {
        throw new Error(`Initial state mismatch. Expected: ${JSON.stringify(scenario.initialState)}, Got: ${JSON.stringify(initialState.value)}`);
      }

      // Execute test events
      for (const event of scenario.events) {
        await this.executeTestEvent(actor, event);
      }

      // Verify final state
      const finalState = actor.getSnapshot();
      if (!this.compareStates(finalState.value, scenario.expectedFinalState)) {
        throw new Error(`Final state mismatch. Expected: ${JSON.stringify(scenario.expectedFinalState)}, Got: ${JSON.stringify(finalState.value)}`);
      }

      // Verify final context
      if (!this.compareContexts(finalState.context, scenario.expectedFinalContext)) {
        throw new Error(`Final context mismatch. Expected: ${JSON.stringify(scenario.expectedFinalContext)}, Got: ${JSON.stringify(finalState.context)}`);
      }

      // Run assertions
      const assertionResults = await this.runAssertions(scenario.assertions, actor);

      const duration = Date.now() - startTime;
      const success = assertionResults.every(result => result.passed);

      const result: TestResult = {
        scenarioId: scenario.id,
        success,
        duration,
        assertions: assertionResults,
        finalState: finalState.value,
        finalContext: finalState.context
      };

      this.logger.info('RunScenario', `Test scenario completed: ${scenario.name}`, {
        success,
        duration,
        assertionsPassed: assertionResults.filter(a => a.passed).length,
        assertionsTotal: assertionResults.length
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('RunScenario', `Test scenario failed: ${scenario.name}`, error);

      return {
        scenarioId: scenario.id,
        success: false,
        duration,
        assertions: [],
        error: error as Error,
        finalState: 'error',
        finalContext: {}
      };
    }
  }

  private async executeTestEvent(actor: ActorRef<any, any>, event: TestEvent): Promise<void> {
    // Apply delay if specified
    if (event.delay) {
      await new Promise(resolve => setTimeout(resolve, event.delay));
    }

    // Check condition if specified
    if (event.condition) {
      const currentState = actor.getSnapshot();
      if (!event.condition(currentState.context)) {
        this.logger.debug('ExecuteTestEvent', `Skipping event due to condition: ${event.type}`);
        return;
      }
    }

    this.logger.debug('ExecuteTestEvent', `Sending event: ${event.type}`, { data: event.data });

    // Send the event
    actor.send({
      type: event.type,
      ...event.data
    });

    // Wait a small amount for the state to settle
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async runAssertions(assertions: TestAssertion[], actor: ActorRef<any, any>): Promise<AssertionResult[]> {
    const results: AssertionResult[] = [];
    const currentState = actor.getSnapshot();

    for (const assertion of assertions) {
      try {
        const result = await this.runAssertion(assertion, currentState);
        results.push(result);
      } catch (error) {
        results.push({
          assertion,
          passed: false,
          actual: undefined,
          expected: assertion.expected,
          message: (error as Error).message
        });
      }
    }

    return results;
  }

  private async runAssertion(assertion: TestAssertion, state: any): Promise<AssertionResult> {
    let actual: any;
    let passed = false;

    // Get actual value based on assertion type
    switch (assertion.type) {
      case 'state':
        actual = state.value;
        break;
      case 'context':
        actual = this.getNestedValue(state.context, assertion.target);
        break;
      case 'event':
        actual = state.event;
        break;
      default:
        throw new Error(`Unsupported assertion type: ${assertion.type}`);
    }

    // Evaluate condition
    switch (assertion.condition) {
      case 'equals':
        passed = this.deepEquals(actual, assertion.expected);
        break;
      case 'contains':
        passed = this.contains(actual, assertion.expected);
        break;
      case 'matches':
        passed = this.matches(actual, assertion.expected);
        break;
      case 'custom':
        if (assertion.customValidator) {
          passed = assertion.customValidator(actual, assertion.expected);
        } else {
          throw new Error('Custom validator is required for custom condition');
        }
        break;
      default:
        throw new Error(`Unsupported assertion condition: ${assertion.condition}`);
    }

    return {
      assertion,
      passed,
      actual,
      expected: assertion.expected,
      message: passed ? undefined : `Assertion failed: ${assertion.type} ${assertion.condition} ${JSON.stringify(assertion.expected)}`
    };
  }

  private compareStates(stateA: any, stateB: any): boolean {
    return this.deepEquals(stateA, stateB);
  }

  private compareContexts(contextA: any, contextB: any): boolean {
    return this.deepEquals(contextA, contextB);
  }

  private deepEquals(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEquals(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }

  private contains(actual: any, expected: any): boolean {
    if (typeof actual === 'string' && typeof expected === 'string') {
      return actual.includes(expected);
    }
    
    if (Array.isArray(actual)) {
      return actual.some(item => this.deepEquals(item, expected));
    }
    
    if (typeof actual === 'object' && actual != null) {
      return Object.values(actual).some(value => this.deepEquals(value, expected));
    }
    
    return false;
  }

  private matches(actual: any, expected: any): boolean {
    if (expected instanceof RegExp) {
      return expected.test(String(actual));
    }
    
    return this.deepEquals(actual, expected);
  }

  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }

  async runMultipleScenarios(scenarios: TestScenario[], machine: any): Promise<TestResult[]> {
    this.logger.info('RunMultipleScenarios', `Running ${scenarios.length} test scenarios`);

    const results: TestResult[] = [];
    
    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario, machine);
      results.push(result);
    }

    const passedCount = results.filter(r => r.success).length;
    const failedCount = results.length - passedCount;

    this.logger.info('RunMultipleScenarios', `Test run completed`, {
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      successRate: (passedCount / results.length * 100).toFixed(1) + '%'
    });

    return results;
  }
}

// ================================
// STATE VALIDATION UTILITIES
// ================================

export class StateValidator {
  private logger = createTickerLogger('SYSTEM', 'StateValidator', generateExecutionId('validator'));

  validateMachineState(actor: ActorRef<any, any>, expectedState: any, expectedContext?: any): ValidationResult {
    const currentState = actor.getSnapshot();
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      state: currentState.value,
      context: currentState.context
    };

    // Validate state
    if (!this.deepEquals(currentState.value, expectedState)) {
      result.valid = false;
      result.errors.push({
        type: 'state_mismatch',
        message: `State mismatch. Expected: ${JSON.stringify(expectedState)}, Got: ${JSON.stringify(currentState.value)}`,
        expected: expectedState,
        actual: currentState.value
      });
    }

    // Validate context if provided
    if (expectedContext !== undefined) {
      if (!this.deepEquals(currentState.context, expectedContext)) {
        result.valid = false;
        result.errors.push({
          type: 'context_mismatch',
          message: `Context mismatch. Expected: ${JSON.stringify(expectedContext)}, Got: ${JSON.stringify(currentState.context)}`,
          expected: expectedContext,
          actual: currentState.context
        });
      }
    }

    // Check for common issues
    this.checkForCommonIssues(currentState, result);

    this.logger.debug('ValidateMachineState', `State validation ${result.valid ? 'passed' : 'failed'}`, {
      errors: result.errors.length,
      warnings: result.warnings.length
    });

    return result;
  }

  private checkForCommonIssues(state: any, result: ValidationResult): void {
    // Check for undefined values in context
    if (state.context && typeof state.context === 'object') {
      const undefinedKeys = Object.keys(state.context).filter(key => state.context[key] === undefined);
      if (undefinedKeys.length > 0) {
        result.warnings.push({
          type: 'undefined_context_values',
          message: `Context contains undefined values: ${undefinedKeys.join(', ')}`,
          data: undefinedKeys
        });
      }
    }

    // Check for error state without error context
    if (typeof state.value === 'string' && state.value.includes('error') && !state.context?.error) {
      result.warnings.push({
        type: 'error_state_without_error_context',
        message: 'Machine is in error state but context.error is not set',
        data: { state: state.value }
      });
    }

    // Check for very large context objects
    const contextSize = JSON.stringify(state.context).length;
    if (contextSize > 10000) {
      result.warnings.push({
        type: 'large_context',
        message: `Context is very large (${contextSize} characters). Consider optimizing.`,
        data: { size: contextSize }
      });
    }
  }

  private deepEquals(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEquals(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  state: any;
  context: any;
}

export interface ValidationError {
  type: string;
  message: string;
  expected?: any;
  actual?: any;
  data?: any;
}

export interface ValidationWarning {
  type: string;
  message: string;
  data?: any;
}

// ================================
// TEST DATA GENERATOR
// ================================

export class TestDataGenerator {
  private logger = createTickerLogger('SYSTEM', 'TestDataGenerator', generateExecutionId('datagen'));

  generateMacroExecutionContext(overrides: Partial<MacroExecutionContext> = {}): MacroExecutionContext {
    return {
      ticker: 'TEST',
      executionId: generateExecutionId('test'),
      currentStep: 1,
      totalSteps: 4,
      startTime: Date.now(),
      completedSteps: [],
      stepResults: new Map(),
      selectedExpiration: '2024-01-19',
      error: null,
      timeoutSettings: {
        stepTimeout: 30000,
        maxRetries: 3,
        backoffMultiplier: 1.5,
        baseRetryDelay: 1000
      },
      performance: {
        totalDuration: 0,
        stepDurations: new Map(),
        retryCount: 0,
        timeoutCount: 0
      },
      currentRetryAttempt: 0,
      cancelled: false,
      debugMode: false,
      ...overrides
    };
  }

  generateTestEvents(count: number = 5): TestEvent[] {
    const eventTypes = ['START_EXECUTION', 'STEP_COMPLETED', 'STEP_FAILED', 'RETRY_STEP', 'CANCEL_EXECUTION'];
    const events: TestEvent[] = [];

    for (let i = 0; i < count; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      events.push({
        type: eventType,
        data: this.generateEventData(eventType),
        delay: Math.random() > 0.7 ? Math.floor(Math.random() * 1000) : undefined
      });
    }

    return events;
  }

  private generateEventData(eventType: string): any {
    switch (eventType) {
      case 'START_EXECUTION':
        return {
          ticker: 'TEST',
          selectedExpiration: '2024-01-19'
        };
      
      case 'STEP_COMPLETED':
        return {
          stepId: Math.floor(Math.random() * 4) + 1,
          result: { status: 'success', data: { value: Math.random() * 100 } }
        };
        
      case 'STEP_FAILED':
        return {
          stepId: Math.floor(Math.random() * 4) + 1,
          error: new Error('Test error'),
          retryCount: Math.floor(Math.random() * 3)
        };
      
      default:
        return {};
    }
  }

  generateTestScenario(name: string, overrides: Partial<TestScenario> = {}): TestScenario {
    return {
      id: generateExecutionId('scenario'),
      name,
      description: `Generated test scenario: ${name}`,
      initialState: 'idle',
      initialContext: this.generateMacroExecutionContext(),
      events: this.generateTestEvents(3),
      expectedFinalState: 'completed',
      expectedFinalContext: this.generateMacroExecutionContext({ currentStep: 4 }),
      assertions: [
        {
          type: 'state',
          target: '',
          condition: 'equals',
          expected: 'completed'
        },
        {
          type: 'context',
          target: 'currentStep',
          condition: 'equals',
          expected: 4
        }
      ],
      ...overrides
    };
  }

  generateMockServiceConfigs(services: string[]): MockServiceConfiguration[] {
    return services.map(serviceName => ({
      serviceName,
      mockType: Math.random() > 0.8 ? 'error' : 'success',
      delay: Math.random() > 0.5 ? Math.floor(Math.random() * 500) : undefined,
      errorRate: Math.random() > 0.8 ? Math.random() * 0.3 : undefined,
      responseData: {
        status: 'success',
        timestamp: Date.now(),
        data: { value: Math.random() * 100 }
      }
    }));
  }
}

// ================================
// GLOBAL INSTANCES
// ================================

export const globalMockManager = new MockServiceManager();
export const globalTestRunner = new TestScenarioRunner(globalMockManager);
export const globalStateValidator = new StateValidator();
export const globalTestDataGenerator = new TestDataGenerator();

// ================================
// TESTING UTILITIES
// ================================

export const createTestMachine = (machine: any, config: TestingConfiguration = DEFAULT_TESTING_CONFIG) => {
  if (!config.enableMockServices) {
    return machine;
  }

  // In a real implementation, this would wrap the machine with mock services
  return machine.provide({
    services: {
      // Mock services would be provided here
    }
  });
};

export const runQuickTest = async (
  machine: any, 
  scenario: Partial<TestScenario>,
  mocks: MockServiceConfiguration[] = []
): Promise<TestResult> => {

  // Register mocks
  mocks.forEach(mock => globalMockManager.registerMock(mock));

  try {
    const fullScenario = globalTestDataGenerator.generateTestScenario(
      scenario.name || 'Quick Test',
      scenario
    );

    return await globalTestRunner.runScenario(fullScenario, machine);
  } finally {
    // Cleanup mocks
    mocks.forEach(mock => globalMockManager.unregisterMock(mock.serviceName));
  }
};

export const createMacroExecutionTest = (
  ticker: string,
  steps: number = 4
): TestScenario => {
  return {
    id: generateExecutionId('macro-test'),
    name: `Macro Execution Test - ${ticker}`,
    description: `Test complete macro execution for ${ticker} with ${steps} steps`,
    initialState: 'idle',
    initialContext: globalTestDataGenerator.generateMacroExecutionContext({
      ticker,
      totalSteps: steps
    }),
    events: [
      { type: 'START_EXECUTION', data: { ticker } },
      ...Array.from({ length: steps }, (_, i) => ({
        type: 'STEP_COMPLETED',
        data: { stepId: i + 1, result: { status: 'success' } }
      }))
    ],
    expectedFinalState: 'completed',
    expectedFinalContext: globalTestDataGenerator.generateMacroExecutionContext({
      ticker,
      currentStep: steps as MacroStepNumber,
      totalSteps: steps
    }),
    assertions: [
      {
        type: 'state',
        target: '',
        condition: 'equals',
        expected: 'completed'
      },
      {
        type: 'context',
        target: 'ticker',
        condition: 'equals',
        expected: ticker
      },
      {
        type: 'context',
        target: 'currentStep',
        condition: 'equals',
        expected: steps
      }
    ]
  };
};

// ================================
// EXPORTS
// ================================

// Classes and types are already exported inline above