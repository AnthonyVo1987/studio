/**
 * Mock Services for XState Machine Testing
 * 
 * This file provides mock implementations of services used in XState machines
 * for testing purposes.
 */

import type { 
  MacroExecutionContext, 
  MacroExecutionEvent, 
  StepResult 
} from '../types/macro-types';

// ================================
// MOCK DATA
// ================================

export const MOCK_STOCK_DATA = {
  ticker: 'TEST',
  price: 450.25,
  change: 5.75,
  changePercent: 1.29,
  volume: 25000000,
  marketCap: 1125000000000,
  high: 455.50,
  low: 448.00,
  open: 449.75,
  close: 450.25
};

export const MOCK_OPTIONS_DATA = {
  expirations: ['2024-01-19', '2024-01-26', '2024-02-02', '2024-02-16'],
  chains: {
    '2024-01-19': [
      { strike: 440, call: { price: 15.25, volume: 1250 }, put: { price: 4.75, volume: 890 } },
      { strike: 450, call: { price: 8.50, volume: 2100 }, put: { price: 8.25, volume: 1800 } },
      { strike: 460, call: { price: 3.75, volume: 1500 }, put: { price: 13.50, volume: 950 } }
    ]
  }
};

export const MOCK_AI_ANALYSIS = {
  bullishSignals: [
    'Strong earnings growth trajectory',
    'Positive market sentiment in tech sector',
    'Institutional buying pressure'
  ],
  bearishSignals: [
    'High valuation metrics',
    'Increased volatility in recent sessions'
  ],
  recommendation: 'MODERATE_BUY',
  confidence: 0.72,
  targetPrice: 475.00,
  supportLevels: [445, 435, 420],
  resistanceLevels: [465, 480, 495]
};

export const MOCK_OPTIONS_RECOMMENDATIONS = {
  strategies: [
    {
      name: 'Bull Call Spread',
      strikes: [450, 460],
      expiration: '2024-01-19',
      maxProfit: 750,
      maxLoss: 250,
      breakeven: 452.50,
      probability: 0.65
    },
    {
      name: 'Iron Condor',
      strikes: [440, 445, 455, 460],
      expiration: '2024-01-26',
      maxProfit: 350,
      maxLoss: 150,
      breakeven: [443.50, 456.50],
      probability: 0.58
    }
  ],
  riskAssessment: 'MODERATE',
  impliedVolatility: 28.5,
  expectedMove: 22.75
};

// ================================
// MOCK SERVICE IMPLEMENTATIONS
// ================================

export interface MockServiceOptions {
  delay?: number;
  errorRate?: number; // 0-1, probability of error
  timeoutRate?: number; // 0-1, probability of timeout
  customError?: Error;
}

export class MockServiceFactory {
  private static defaultOptions: MockServiceOptions = {
    delay: 100,
    errorRate: 0,
    timeoutRate: 0
  };
  
  static async fetchExpirations(
    context: MacroExecutionContext, 
    event: MacroExecutionEvent,
    options: MockServiceOptions = {}
  ): Promise<string[]> {
    const opts = { ...MockServiceFactory.defaultOptions, ...options };
    
    await MockServiceFactory.simulateDelay(opts.delay!);
    
    if (Math.random() < opts.errorRate!) {
      throw opts.customError || new Error('Mock service: Failed to fetch expirations');
    }
    
    if (Math.random() < opts.timeoutRate!) {
      await MockServiceFactory.simulateTimeout();
    }
    
    return MOCK_OPTIONS_DATA.expirations;
  }
  
  static async fetchStockData(
    context: MacroExecutionContext,
    event: MacroExecutionEvent,
    options: MockServiceOptions = {}
  ): Promise<typeof MOCK_STOCK_DATA> {
    const opts = { ...MockServiceFactory.defaultOptions, ...options };
    
    await MockServiceFactory.simulateDelay(opts.delay!);
    
    if (Math.random() < opts.errorRate!) {
      throw opts.customError || new Error('Mock service: Failed to fetch stock data');
    }
    
    if (Math.random() < opts.timeoutRate!) {
      await MockServiceFactory.simulateTimeout();
    }
    
    return {
      ...MOCK_STOCK_DATA,
      ticker: context.ticker
    };
  }
  
  static async performAIAnalysis(
    context: MacroExecutionContext,
    event: MacroExecutionEvent,
    options: MockServiceOptions = {}
  ): Promise<typeof MOCK_AI_ANALYSIS> {
    const opts = { ...MockServiceFactory.defaultOptions, ...options };
    
    await MockServiceFactory.simulateDelay(opts.delay! * 2); // AI takes longer
    
    if (Math.random() < opts.errorRate!) {
      throw opts.customError || new Error('Mock service: AI analysis failed');
    }
    
    if (Math.random() < opts.timeoutRate!) {
      await MockServiceFactory.simulateTimeout();
    }
    
    return MOCK_AI_ANALYSIS;
  }
  
  static async generateOptionsRecommendations(
    context: MacroExecutionContext,
    event: MacroExecutionEvent,
    options: MockServiceOptions = {}
  ): Promise<typeof MOCK_OPTIONS_RECOMMENDATIONS> {
    const opts = { ...MockServiceFactory.defaultOptions, ...options };
    
    await MockServiceFactory.simulateDelay(opts.delay! * 2); // AI takes longer
    
    if (Math.random() < opts.errorRate!) {
      throw opts.customError || new Error('Mock service: Options recommendations failed');
    }
    
    if (Math.random() < opts.timeoutRate!) {
      await MockServiceFactory.simulateTimeout();
    }
    
    return MOCK_OPTIONS_RECOMMENDATIONS;
  }
  
  private static async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private static async simulateTimeout(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Mock service: Request timeout')), 5000);
    });
  }
}

// ================================
// PREDEFINED MOCK SCENARIOS
// ================================

export const MOCK_SCENARIOS = {
  SUCCESS: {
    description: 'All services succeed with normal timing',
    options: {
      delay: 100,
      errorRate: 0,
      timeoutRate: 0
    }
  },
  
  HIGH_LATENCY: {
    description: 'Services succeed but with high latency',
    options: {
      delay: 2000,
      errorRate: 0,
      timeoutRate: 0
    }
  },
  
  INTERMITTENT_ERRORS: {
    description: 'Services occasionally fail',
    options: {
      delay: 100,
      errorRate: 0.2,
      timeoutRate: 0
    }
  },
  
  FREQUENT_TIMEOUTS: {
    description: 'Services frequently timeout',
    options: {
      delay: 100,
      errorRate: 0,
      timeoutRate: 0.3
    }
  },
  
  NETWORK_ISSUES: {
    description: 'Combination of errors and timeouts',
    options: {
      delay: 500,
      errorRate: 0.15,
      timeoutRate: 0.15
    }
  },
  
  STEP1_FAILURE: {
    description: 'First step always fails',
    options: {
      delay: 100,
      errorRate: 1.0, // Always fail
      timeoutRate: 0,
      customError: new Error('Step 1 consistently failing')
    }
  },
  
  AI_TIMEOUT: {
    description: 'AI services timeout frequently',
    options: {
      delay: 100,
      errorRate: 0,
      timeoutRate: 0.8 // High timeout rate for AI steps
    }
  }
};

// ================================
// MOCK STEP RESULTS FACTORY
// ================================

export class MockStepResultFactory {
  static createSuccessResult(stepId: number, stepName: string, data?: any): StepResult {
    return {
      stepId,
      stepName,
      status: 'success',
      data: data || MockStepResultFactory.getDefaultDataForStep(stepId),
      duration: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
      startTime: Date.now() - Math.floor(Math.random() * 2000) - 500,
      endTime: Date.now(),
      retryCount: 0
    };
  }
  
  static createErrorResult(stepId: number, stepName: string, error?: Error): StepResult {
    return {
      stepId,
      stepName,
      status: 'error',
      error: error || new Error(`Mock error for step ${stepId}`),
      duration: Math.floor(Math.random() * 1000) + 100, // 100-1100ms
      startTime: Date.now() - Math.floor(Math.random() * 1000) - 100,
      endTime: Date.now(),
      retryCount: Math.floor(Math.random() * 3) + 1
    };
  }
  
  static createTimeoutResult(stepId: number, stepName: string): StepResult {
    return {
      stepId,
      stepName,
      status: 'timeout',
      error: new Error(`Step ${stepId} timed out`),
      duration: 45000, // Timeout duration
      startTime: Date.now() - 45000,
      endTime: Date.now(),
      retryCount: 0
    };
  }
  
  static createCancelledResult(stepId: number, stepName: string): StepResult {
    return {
      stepId,
      stepName,
      status: 'cancelled',
      duration: Math.floor(Math.random() * 500) + 100,
      startTime: Date.now() - Math.floor(Math.random() * 500) - 100,
      endTime: Date.now(),
      retryCount: 0
    };
  }
  
  private static getDefaultDataForStep(stepId: number): any {
    switch (stepId) {
      case 1:
        return { expirations: MOCK_OPTIONS_DATA.expirations };
      case 2:
        return { stockData: MOCK_STOCK_DATA };
      case 3:
        return { analysis: MOCK_AI_ANALYSIS };
      case 4:
        return { recommendations: MOCK_OPTIONS_RECOMMENDATIONS };
      default:
        return { mockData: `Default data for step ${stepId}` };
    }
  }
}

// ================================
// MOCK CONTEXT FACTORY
// ================================

export class MockContextFactory {
  static createInitialContext(ticker: string = 'TEST'): MacroExecutionContext {
    return {
      ticker,
      executionId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      selectedExpiration: null,
      stepResults: new Map(),
      currentStep: 0,
      completedSteps: [],
      error: null,
      timeoutSettings: {
        stepTimeout: 45000,
        maxRetries: 2,
        backoffMultiplier: 2,
        baseRetryDelay: 1000
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
      debugMode: true
    };
  }
  
  static createContextWithCompletedSteps(
    ticker: string = 'TEST', 
    completedStepIds: number[] = []
  ): MacroExecutionContext {
    const context = MockContextFactory.createInitialContext(ticker);
    
    completedStepIds.forEach(stepId => {
      const result = MockStepResultFactory.createSuccessResult(
        stepId, 
        `Mock Step ${stepId}`
      );
      context.stepResults.set(stepId, result);
      context.completedSteps.push(stepId);
      context.performance.stepDurations.set(stepId, result.duration);
    });
    
    context.currentStep = completedStepIds.length > 0 ? Math.max(...completedStepIds) + 1 : 1;
    context.selectedExpiration = '2024-01-19';
    context.startTime = Date.now() - 10000; // Started 10 seconds ago
    
    return context;
  }
  
  static createContextWithError(
    ticker: string = 'TEST',
    error: Error = new Error('Mock error')
  ): MacroExecutionContext {
    const context = MockContextFactory.createInitialContext(ticker);
    context.error = error;
    context.currentStep = 1;
    context.selectedExpiration = '2024-01-19';
    return context;
  }
  
  static createContextInProgress(
    ticker: string = 'TEST',
    currentStep: number = 2
  ): MacroExecutionContext {
    const completedSteps = Array.from({ length: currentStep - 1 }, (_, i) => i + 1);
    const context = MockContextFactory.createContextWithCompletedSteps(ticker, completedSteps);
    context.currentStep = currentStep;
    return context;
  }
}

// ================================
// SERVICE MOCKING UTILITIES
// ================================

export const createMockServiceProvider = (scenario: keyof typeof MOCK_SCENARIOS = 'SUCCESS') => {
  const options = MOCK_SCENARIOS[scenario].options;
  
  return {
    fetchExpirations: (context: MacroExecutionContext, event: MacroExecutionEvent) =>
      MockServiceFactory.fetchExpirations(context, event, options),
    
    fetchStockData: (context: MacroExecutionContext, event: MacroExecutionEvent) =>
      MockServiceFactory.fetchStockData(context, event, options),
    
    performAIAnalysis: (context: MacroExecutionContext, event: MacroExecutionEvent) =>
      MockServiceFactory.performAIAnalysis(context, event, options),
    
    generateOptionsRecommendations: (context: MacroExecutionContext, event: MacroExecutionEvent) =>
      MockServiceFactory.generateOptionsRecommendations(context, event, options)
  };
};

// ================================
// VALIDATION HELPERS
// ================================

export const validateMockData = () => {
  const validations = [
    {
      name: 'MOCK_STOCK_DATA',
      valid: typeof MOCK_STOCK_DATA.ticker === 'string' && MOCK_STOCK_DATA.price > 0
    },
    {
      name: 'MOCK_OPTIONS_DATA',
      valid: Array.isArray(MOCK_OPTIONS_DATA.expirations) && MOCK_OPTIONS_DATA.expirations.length > 0
    },
    {
      name: 'MOCK_AI_ANALYSIS',
      valid: typeof MOCK_AI_ANALYSIS.confidence === 'number' && 
             MOCK_AI_ANALYSIS.confidence >= 0 && 
             MOCK_AI_ANALYSIS.confidence <= 1
    },
    {
      name: 'MOCK_OPTIONS_RECOMMENDATIONS',
      valid: Array.isArray(MOCK_OPTIONS_RECOMMENDATIONS.strategies) &&
             MOCK_OPTIONS_RECOMMENDATIONS.strategies.length > 0
    }
  ];
  
  const invalid = validations.filter(v => !v.valid);
  
  if (invalid.length > 0) {
    console.error('Invalid mock data detected:', invalid.map(v => v.name));
    return false;
  }
  
  console.log('✅ All mock data validated successfully');
  return true;
};

// ================================
// EXPORTS
// ================================

// Types are already exported in the main export section above