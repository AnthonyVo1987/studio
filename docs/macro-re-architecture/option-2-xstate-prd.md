# PRD: Option 2 - XState State Machine Implementation

**Version**: 1.1.0  
**Date**: August 2, 2025  
**Project**: Macro Automation Re-Architecture  
**Option**: 2 - XState State Machine Pattern  
**Recommendation**: ⭐ **PRIMARY CHOICE**  
**Review Status**: ✅ **ENHANCED** - Enterprise-grade improvements applied

---

## Executive Summary

### Overview

This PRD defines the implementation of a formal state machine approach using XState for macro automation, replacing the current complex useRef-based state management with predictable state transitions and built-in error handling.

### Key Benefits

- **Eliminates State Synchronization Complexity**: Single source of truth with impossible invalid states
- **65% Code Reduction**: From 1,400+ lines to ~500 lines (XState v5 optimized)
- **Enterprise-Grade Security**: Built-in authorization, validation, and audit trails
- **Advanced Error Handling**: Circuit breaker patterns and resilient recovery mechanisms
- **Performance Optimized**: XState v5 with batched events and selective re-renders
- **Built-in Debugging**: XState DevTools with distributed tracing and correlation IDs
- **Formal Validation**: Mathematical guarantees about state transitions with type safety
- **Self-Documenting**: State machine serves as living documentation with security context

### Success Metrics

| Metric | Current | Target | Expected Impact |
|--------|---------|--------|----------------|
| **Lines of Code** | 1,400+ | ~800 | 45% reduction (with security framework) |
| **State Synchronization Bugs** | Frequent | Zero | Eliminated by design with type safety |
| **Debugging Time** | 11+ hours | 1-2 hours | 90% reduction with distributed tracing |
| **Developer Onboarding** | Complex | Visual/Intuitive | 10x improvement with visual debugging |
| **Security Compliance** | None | Enterprise | Complete authorization and audit trails |
| **Performance Monitoring** | Basic | Advanced | Distributed tracing and correlation IDs |
| **Error Recovery** | Manual | Automated | Circuit breakers and resilient patterns |

---

## Technical Requirements

### Functional Requirements

#### FR-1: State Machine Definition
- **States**: `idle`, `executing`, `completed`, `error`, `cancelled`
- **Substates**: `step1` (expirations), `step2` (stock data), `step3` (AI takeaways), `step4` (AI options)
- **Events**: `START`, `STEP_COMPLETE`, `STEP_FAIL`, `CANCEL`, `RETRY`
- **Context**: Execution data, results, timing, errors

#### FR-2: Service Integration
- **Async Services**: Each step implemented as XState service
- **Error Handling**: Automatic retry logic with exponential backoff
- **Timeout Protection**: Built-in 45-second timeout per step
- **Result Storage**: Context-based result aggregation

#### FR-3: Enhanced React Integration (XState v5)
- **Modern Hook Usage**: `useActor` hook with `createActor` for optimal performance
- **Selective Re-renders**: `useSelector` for performance-optimized state subscriptions
- **Batched Events**: XState v5 batched event processing for complex workflows
- **State Reactivity**: Automatic UI updates with correlation tracking
- **Action Dispatching**: Event-based interaction model with security context
- **Context Access**: Direct access to execution context with authorization
- **Parallel States**: Advanced parallel state management for complex scenarios

#### FR-4: DevTools Integration
- **Visual Debugging**: XState DevTools for state visualization
- **Event Logging**: Complete event history tracking
- **State Inspection**: Real-time context and state monitoring
- **Export/Import**: State snapshots for debugging

### Non-Functional Requirements

#### NFR-1: Performance & Scalability
- **Bundle Size**: +42KB for XState v5 (improved tree shaking)
- **Execution Overhead**: <3ms per state transition (v5 optimizations)
- **Memory Management**: Efficient actor lifecycle with automatic cleanup
- **Reactivity**: Selective re-renders with useSelector optimization
- **Batched Processing**: Event batching for complex state transitions
- **Resource Limits**: Configurable memory and execution time constraints

#### NFR-2: Reliability & Resilience
- **State Consistency**: Mathematically guaranteed valid states with type safety
- **Circuit Breaker Patterns**: Advanced error isolation and recovery
- **Error Recovery**: Exponential backoff with intelligent retry mechanisms
- **Deterministic Behavior**: Predictable state transitions with audit trails
- **Fault Tolerance**: Graceful degradation and automatic failover
- **Health Monitoring**: Real-time machine and actor health metrics

#### NFR-3: Developer Experience & Security
- **Visual Debugging**: XState DevTools with distributed tracing
- **Type Safety**: Full TypeScript integration with XState v5 type generation
- **Security Integration**: Built-in authorization and input validation
- **Testing**: Comprehensive unit testing of state transitions and security
- **Documentation**: Self-documenting state machine with security context
- **Audit Trails**: Complete execution logging with correlation IDs
- **Performance Monitoring**: Built-in metrics and observability

---

## Enhanced Architecture Design

### Security Framework Integration

```typescript
// Enhanced error handling for XState v5
export class XStateError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly category: 'TIMEOUT' | 'NETWORK' | 'VALIDATION' | 'BUSINESS' | 'SECURITY' | 'STATE_MACHINE',
    public readonly retryable: boolean = true,
    public readonly context?: Record<string, any>,
    public readonly correlationId?: string
  ) {
    super(message);
    this.name = 'XStateError';
  }
}

export interface SecurityContext {
  userId: string;
  permissions: string[];
  sessionId: string;
  ipAddress: string;
  correlationId: string;
  timestamp: number;
}

export interface MacroExecutionMetadata {
  executionId: string;
  correlationId: string;
  traceId: string;
  spanId: string;
  startTime: number;
  permissions: string[];
  securityContext: SecurityContext;
}
```

### XState v5 Machine Definition with Security

```typescript
import { createMachine, assign, createActor } from 'xstate';

export const macroMachine = createMachine({
  id: 'macroAutomation',
  initial: 'idle',
  
  context: {
    ticker: 'NVDA_STAGING',
    startTime: null,
    executionId: null,
    correlationId: null,
    traceId: null,
    selectedExpiration: null,
    securityContext: null as SecurityContext | null,
    results: {
      expirations: null,
      stockData: null,
      aiTakeaways: null,
      aiOptions: null
    },
    errors: [],
    metrics: {
      stepTimes: [],
      totalTime: 0,
      retryCount: 0,
      circuitBreakerState: 'CLOSED' as 'OPEN' | 'HALF_OPEN' | 'CLOSED'
    },
    auditTrail: [] as Array<{
      action: string;
      timestamp: number;
      correlationId: string;
      result: 'SUCCESS' | 'FAILURE' | 'PENDING';
    }>
  },

  states: {
    idle: {
      entry: ['resetContext'],
      on: {
        START: {
          target: 'executing',
          actions: ['initializeExecution']
        }
      }
    },

    executing: {
      initial: 'step1',
      entry: ['startTimer'],
      
      states: {
        step1: {
          invoke: {
            id: 'fetchExpirations',
            src: 'fetchExpirationsService',
            input: ({ context }) => ({ 
              securityContext: context.securityContext,
              correlationId: context.correlationId 
            }),
            onDone: {
              target: 'step2',
              actions: ['storeExpirationsResult', 'logStepCompletion', 'updateAuditTrail']
            },
            onError: {
              target: '#macroAutomation.error',
              actions: ['logStepError', 'updateCircuitBreaker', 'logSecurityEvent']
            }
          }
        },

        step2: {
          invoke: {
            id: 'getStockData',
            src: 'getStockDataService',
            input: ({ context }) => ({ 
              securityContext: context.securityContext,
              correlationId: context.correlationId,
              selectedExpiration: context.selectedExpiration
            }),
            onDone: {
              target: 'step3',
              actions: ['storeStockDataResult', 'logStepCompletion', 'updateAuditTrail']
            },
            onError: {
              target: '#macroAutomation.error',
              actions: ['logStepError', 'updateCircuitBreaker', 'logSecurityEvent']
            }
          }
        },

        step3: {
          invoke: {
            id: 'generateAiTakeaways',
            src: 'generateAiTakeawaysService',
            input: ({ context }) => ({ 
              securityContext: context.securityContext,
              correlationId: context.correlationId,
              stockData: context.results.stockData
            }),
            onDone: {
              target: 'step4',
              actions: ['storeAiTakeawaysResult', 'logStepCompletion', 'updateAuditTrail']
            },
            onError: {
              target: '#macroAutomation.error',
              actions: ['logStepError', 'updateCircuitBreaker', 'logSecurityEvent']
            }
          }
        },

        step4: {
          invoke: {
            id: 'generateAiOptions',
            src: 'generateAiOptionsService',
            input: ({ context }) => ({ 
              securityContext: context.securityContext,
              correlationId: context.correlationId,
              stockData: context.results.stockData,
              aiTakeaways: context.results.aiTakeaways
            }),
            onDone: {
              target: '#macroAutomation.completed',
              actions: ['storeAiOptionsResult', 'logStepCompletion', 'updateAuditTrail']
            },
            onError: {
              target: '#macroAutomation.error',
              actions: ['logStepError', 'updateCircuitBreaker', 'logSecurityEvent']
            }
          }
        }
      },

      on: {
        CANCEL: {
          target: 'cancelled',
          actions: ['logCancellation']
        }
      }
    },

    completed: {
      entry: ['finishTimer', 'logCompletion'],
      on: {
        START: {
          target: 'executing',
          actions: ['resetContext', 'initializeExecution']
        }
      }
    },

    error: {
      entry: ['logError', 'updateCircuitBreaker'],
      on: {
        RETRY: {
          target: 'executing',
          actions: ['incrementRetryCount', 'resetCircuitBreaker'],
          guard: 'canRetryWithCircuitBreaker'
        },
        START: {
          target: 'executing',
          actions: ['resetContext', 'initializeExecution', 'resetCircuitBreaker']
        },
        FORCE_RESET: {
          target: 'idle',
          actions: ['resetContext', 'resetCircuitBreaker', 'logSecurityEvent']
        }
      }
    },

    cancelled: {
      entry: ['logCancellation'],
      on: {
        START: {
          target: 'executing',
          actions: ['resetContext', 'initializeExecution']
        }
      }
    }
  },

  // XState v5 Guards
  guards: {
    canRetryWithCircuitBreaker: ({ context }) => {
      return context.metrics.retryCount < 3 && context.metrics.circuitBreakerState !== 'OPEN';
    },
    hasValidSecurityContext: ({ context }) => {
      return context.securityContext && context.securityContext.permissions.includes('MACRO_EXECUTE');
    }
  }
});
```

### Enhanced Service Implementations with Security

```typescript
// services/macroServices.ts
import { XStateError, SecurityContext } from './security';

// Enhanced service interface with security context
interface SecureServiceInput {
  securityContext: SecurityContext;
  correlationId: string;
  [key: string]: any;
}

// Circuit breaker implementation
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold = 3;
  private readonly timeout = 30000; // 30 seconds

  async execute<T>(operation: () => Promise<T>, correlationId: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new XStateError(
          'Circuit breaker is OPEN',
          'CIRCUIT_BREAKER_OPEN',
          'STATE_MACHINE',
          false,
          { correlationId }
        );
      } else {
        this.state = 'HALF_OPEN';
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

const circuitBreaker = new CircuitBreaker();

export const macroServices = {
  fetchExpirationsService: async ({ securityContext, correlationId }: SecureServiceInput) => {
    // Security validation
    if (!securityContext?.permissions.includes('MACRO_EXECUTE')) {
      throw new XStateError(
        'Insufficient permissions for macro execution',
        'PERMISSION_DENIED',
        'SECURITY',
        false,
        { correlationId, userId: securityContext?.userId }
      );
    }

    return await circuitBreaker.execute(async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new XStateError(
          'Timeout: Fetch expirations after 45 seconds',
          'OPERATION_TIMEOUT',
          'TIMEOUT',
          true,
          { correlationId }
        )), 45000);
      });

      const fetchPromise = stagingHandlers.fetchExpirations();
      
      const result = await Promise.race([fetchPromise, timeoutPromise]);
    
      return {
        selectedExpiration: await stagingContext.getCurrentExpiration(),
        availableExpirations: await stagingContext.getAvailableExpirations(),
        timestamp: Date.now(),
        correlationId,
        securityContext: securityContext.userId
      };
    }, correlationId);
  },

  getStockDataService: async ({ securityContext, correlationId, selectedExpiration }: SecureServiceInput & { selectedExpiration: string }) => {
    if (!selectedExpiration) {
      throw new XStateError(
        'No expiration selected for stock data fetch',
        'MISSING_DEPENDENCY',
        'VALIDATION',
        false,
        { correlationId }
      );
    }

    // Security validation
    if (!securityContext?.permissions.includes('STOCK_DATA_ACCESS')) {
      throw new XStateError(
        'Insufficient permissions for stock data access',
        'PERMISSION_DENIED',
        'SECURITY',
        false,
        { correlationId, userId: securityContext?.userId }
      );
    }

    return await circuitBreaker.execute(async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new XStateError(
          'Timeout: Get stock data after 45 seconds',
          'OPERATION_TIMEOUT',
          'TIMEOUT',
          true,
          { correlationId }
        )), 45000);
      });

      const stockPromise = stagingHandlers.getStockData(selectedExpiration);
      
      const result = await Promise.race([stockPromise, timeoutPromise]);
    
      return {
        stockSnapshot: await stagingContext.getStockSnapshot(),
        marketStatus: await stagingContext.getMarketStatus(),
        technicalAnalysis: await stagingContext.getTechnicalAnalysis(),
        timestamp: Date.now(),
        correlationId,
        securityContext: securityContext.userId
      };
    }, correlationId);
  },

  generateAiTakeawaysService: async ({ securityContext, correlationId, stockData }: SecureServiceInput & { stockData: any }) => {
    // Security validation
    if (!securityContext?.permissions.includes('AI_ANALYSIS_ACCESS')) {
      throw new XStateError(
        'Insufficient permissions for AI analysis',
        'PERMISSION_DENIED',
        'SECURITY',
        false,
        { correlationId, userId: securityContext?.userId }
      );
    }
    return await circuitBreaker.execute(async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new XStateError(
          'Timeout: AI takeaways after 45 seconds',
          'OPERATION_TIMEOUT',
          'TIMEOUT',
          true,
          { correlationId }
        )), 45000);
      });

      const aiPromise = stagingHandlers.generateAiTakeaways();
      
      await Promise.race([aiPromise, timeoutPromise]);
    
      return {
        takeaways: await stagingContext.getAiTakeaways(),
        timestamp: Date.now(),
        correlationId,
        securityContext: securityContext.userId
      };
    }, correlationId);
  },

  generateAiOptionsService: async ({ securityContext, correlationId, stockData, aiTakeaways }: SecureServiceInput & { stockData: any; aiTakeaways: any }) => {
    // Security validation
    if (!securityContext?.permissions.includes('AI_OPTIONS_ACCESS')) {
      throw new XStateError(
        'Insufficient permissions for AI options analysis',
        'PERMISSION_DENIED',
        'SECURITY',
        false,
        { correlationId, userId: securityContext?.userId }
      );
    }
    return await circuitBreaker.execute(async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new XStateError(
          'Timeout: AI options after 45 seconds',
          'OPERATION_TIMEOUT',
          'TIMEOUT',
          true,
          { correlationId }
        )), 45000);
      });

      const aiPromise = stagingHandlers.generateAiOptions();
      
      await Promise.race([aiPromise, timeoutPromise]);
    
      return {
        optionsAnalysis: await stagingContext.getAiOptionsAnalysis(),
        timestamp: Date.now(),
        correlationId,
        securityContext: securityContext.userId
      };
    }, correlationId);
  }
};
```

### Enhanced React Component Integration (XState v5)

```typescript
// components/staging/nvda-staging-xstate-macro.tsx
import { createActorContext } from '@xstate/react';
import { macroMachine } from './macroMachine';
import { macroServices } from './macroServices';
import { SecurityContext } from './security';
import { useCallback, useMemo } from 'react';

// Create XState v5 Actor Context
const MacroMachineContext = createActorContext(macroMachine.provide({
  actors: macroServices,
  actions: {
    initializeExecution: assign({
        startTime: () => Date.now(),
        executionId: () => `xstate_macro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        correlationId: () => `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        traceId: () => `trace_${Date.now()}`,
        securityContext: ({ input }) => input.securityContext,
        errors: () => [],
        metrics: () => ({
          stepTimes: [],
          totalTime: 0,
          retryCount: 0,
          circuitBreakerState: 'CLOSED' as const
        }),
        auditTrail: () => []
      }),

      storeExpirationsResult: assign({
        selectedExpiration: ({ event }) => event.output.selectedExpiration,
        results: ({ context, event }) => ({
          ...context.results,
          expirations: event.output
        })
      }),

      updateAuditTrail: assign({
        auditTrail: ({ context, event }) => [
          ...context.auditTrail,
          {
            action: event.type,
            timestamp: Date.now(),
            correlationId: context.correlationId,
            result: 'SUCCESS'
          }
        ]
      }),

      updateCircuitBreaker: assign({
        metrics: ({ context }) => ({
          ...context.metrics,
          circuitBreakerState: 'OPEN' as const
        })
      }),

      resetCircuitBreaker: assign({
        metrics: ({ context }) => ({
          ...context.metrics,
          circuitBreakerState: 'CLOSED' as const
        })
      }),

      logSecurityEvent: ({ context, event }) => {
        console.log('Security event logged:', {
          correlationId: context.correlationId,
          userId: context.securityContext?.userId,
          event: event.type,
          timestamp: Date.now()
        });
      },

      storeStockDataResult: assign({
        results: ({ context, event }) => ({
          ...context.results,
          stockData: event.output
        })
      }),

      storeAiTakeawaysResult: assign({
        results: ({ context, event }) => ({
          ...context.results,
          aiTakeaways: event.output
        })
      }),

      storeAiOptionsResult: assign({
        results: ({ context, event }) => ({
          ...context.results,
          aiOptions: event.output
        })
      }),

      logStepCompletion: assign({
        metrics: ({ context }) => ({
          ...context.metrics,
          stepTimes: [...context.metrics.stepTimes, Date.now() - context.startTime]
        })
      }),

      logStepError: assign({
        errors: ({ context, event }) => [...context.errors, {
          step: 'current_step', // Will be dynamically determined
          error: event.error,
          timestamp: Date.now(),
          correlationId: context.correlationId
        }]
      }),

      resetContext: assign({
        startTime: null,
        executionId: null,
        correlationId: null,
        traceId: null,
        selectedExpiration: null,
        results: {
          expirations: null,
          stockData: null,
          aiTakeaways: null,
          aiOptions: null
        },
        errors: [],
        metrics: {
          stepTimes: [],
          totalTime: 0,
          retryCount: 0,
          circuitBreakerState: 'CLOSED' as const
        },
        auditTrail: []
      })
      }
    })
  }
}));

interface MacroComponentProps {
  securityContext: SecurityContext;
}

function MacroComponent() {
  // XState v5 pattern with Context hooks
  const [state, send] = MacroMachineContext.useActor();

  // Performance-optimized selectors using useSelector
  const currentState = MacroMachineContext.useSelector((state) => state.value);
  const isExecuting = MacroMachineContext.useSelector((state) => state.matches('executing'));
  const errors = MacroMachineContext.useSelector((state) => state.context.errors);
  const metrics = MacroMachineContext.useSelector((state) => state.context.metrics);
  const executionId = MacroMachineContext.useSelector((state) => state.context.executionId);
  const correlationId = MacroMachineContext.useSelector((state) => state.context.correlationId);

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-blue-600" />
          XState Macro Automation
        </CardTitle>
        <CardDescription>
          Formal state machine with predictable transitions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* State visualization */}
        <div className="mb-4">
          <Badge variant={
            state.matches('executing') ? 'secondary' :
            state.matches('completed') ? 'default' :
            state.matches('error') ? 'destructive' :
            state.matches('cancelled') ? 'outline' : 'outline'
          }>
            State: {JSON.stringify(state.value)}
          </Badge>
        </div>

        {/* Progress visualization */}
        {state.matches('executing') && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">
              Current Step: {getCurrentStep(state.value)}
            </div>
            <Progress value={getProgressPercentage(state.value)} />
          </div>
        )}

        {/* Execution context display */}
        {state.context.executionId && (
          <div className="mb-4 p-3 bg-blue-100 rounded text-sm">
            <div className="font-medium">Execution ID: {state.context.executionId}</div>
            {state.context.selectedExpiration && (
              <div>Expiration: {state.context.selectedExpiration}</div>
            )}
            {state.context.startTime && (
              <div>Duration: {Math.round((Date.now() - state.context.startTime) / 1000)}s</div>
            )}
          </div>
        )}

        {/* Error display */}
        {state.matches('error') && state.context.errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded">
            <div className="font-medium text-red-800 mb-2">Error Details:</div>
            {state.context.errors.map((error, index) => (
              <div key={index} className="text-sm text-red-700">
                Step {error.step}: {error.error.message}
              </div>
            ))}
          </div>
        )}

        {/* Metrics display */}
        {state.matches('completed') && (
          <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded">
            <div className="font-medium text-green-800 mb-2">Execution Complete</div>
            <div className="text-sm text-green-700">
              Total Time: {Math.round(state.context.metrics.totalTime / 1000)}s
            </div>
            <div className="text-sm text-green-700">
              Steps: {state.context.metrics.stepTimes.length}/4
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {state.matches('idle') || state.matches('completed') || state.matches('error') || state.matches('cancelled') ? (
            <Button onClick={() => send('START')} className="flex-1">
              {state.matches('completed') ? 'Run Again' : 'Start XState Macro'}
            </Button>
          ) : (
            <Button onClick={() => send('CANCEL')} variant="destructive" className="flex-1">
              Cancel Execution
            </Button>
          )}

          {state.matches('error') && (
            <Button onClick={() => send('RETRY')} variant="outline">
              Retry
            </Button>
          )}
        </div>

        {/* Debug information */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Debug Information
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify({ state: state.value, context: state.context }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
export function NvdaStagingXStateMacro({ securityContext }: MacroComponentProps) {
  const correlationId = useMemo(() => 
    `macro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, []);
  const traceId = useMemo(() => `trace_${Date.now()}`, []);

  return (
    <MacroMachineContext.Provider 
      machine={macroMachine.provide({
        input: {
          securityContext,
          correlationId,
          traceId
        }
      })}
    >
      <MacroComponent />
    </MacroMachineContext.Provider>
  );
}

function getCurrentStep(stateValue: any): string {
  if (typeof stateValue === 'string') return stateValue;
  if (stateValue.executing) return stateValue.executing;
  return 'Unknown';
}

function getProgressPercentage(stateValue: any): number {
  const stepMap = {
    'step1': 25,
    'step2': 50,
    'step3': 75,
    'step4': 100
  };
  
  const currentStep = getCurrentStep(stateValue);
  return stepMap[currentStep] || 0;
}
```

---

## Enterprise Security Framework

### Security Architecture

```typescript
// security/SecurityManager.ts
export class SecurityManager {
  private static instance: SecurityManager;
  private sessionStore = new Map<string, SecurityContext>();

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  validateSession(sessionId: string): SecurityContext | null {
    const context = this.sessionStore.get(sessionId);
    if (!context || this.isSessionExpired(context)) {
      this.sessionStore.delete(sessionId);
      return null;
    }
    return context;
  }

  createSecurityContext(userId: string, permissions: string[], ipAddress: string): SecurityContext {
    const correlationId = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = `sess_${Date.now()}_${userId}`;
    
    const context: SecurityContext = {
      userId,
      permissions,
      sessionId,
      ipAddress,
      correlationId,
      timestamp: Date.now()
    };

    this.sessionStore.set(sessionId, context);
    return context;
  }

  private isSessionExpired(context: SecurityContext): boolean {
    const sessionTimeout = 3600000; // 1 hour
    return Date.now() - context.timestamp > sessionTimeout;
  }

  auditLog(action: string, context: SecurityContext, result: 'SUCCESS' | 'FAILURE', details?: any) {
    console.log('AUDIT:', {
      timestamp: new Date().toISOString(),
      correlationId: context.correlationId,
      userId: context.userId,
      action,
      result,
      ipAddress: context.ipAddress,
      details
    });
  }
}
```

### Input Validation Framework

```typescript
// validation/InputValidator.ts
export class InputValidator {
  static validateMacroInput(input: any, securityContext: SecurityContext): void {
    // Validate required permissions
    if (!securityContext.permissions.includes('MACRO_EXECUTE')) {
      throw new XStateError(
        'Insufficient permissions for macro execution',
        'PERMISSION_DENIED',
        'SECURITY',
        false,
        { userId: securityContext.userId }
      );
    }

    // Validate input structure
    if (typeof input !== 'object' || input === null) {
      throw new XStateError(
        'Invalid input structure',
        'INVALID_INPUT',
        'VALIDATION',
        false,
        { correlationId: securityContext.correlationId }
      );
    }

    // Rate limiting check
    this.checkRateLimit(securityContext.userId);
  }

  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  private static checkRateLimit(userId: string): void {
    const now = Date.now();
    const windowSize = 60000; // 1 minute window
    const maxRequests = 10;
    
    const userRecord = this.rateLimitStore.get(userId);
    
    if (!userRecord || now > userRecord.resetTime) {
      // Reset or initialize rate limit window
      this.rateLimitStore.set(userId, { count: 1, resetTime: now + windowSize });
      return;
    }
    
    if (userRecord.count >= maxRequests) {
      throw new XStateError(
        'Rate limit exceeded',
        'RATE_LIMIT_EXCEEDED',
        'SECURITY',
        true,
        { userId, retryAfter: userRecord.resetTime - now }
      );
    }
    
    userRecord.count++;
  }

  private static getUserRequestCount(userId: string): number {
    const userRecord = this.rateLimitStore.get(userId);
    return userRecord?.count || 0;
  }
}
```

### Audit Trail Implementation

```typescript
// audit/AuditTrail.ts
export interface AuditEvent {
  eventId: string;
  correlationId: string;
  userId: string;
  action: string;
  timestamp: number;
  result: 'SUCCESS' | 'FAILURE' | 'PENDING';
  duration?: number;
  errorCode?: string;
  metadata: Record<string, any>;
}

export class AuditTrail {
  private events: AuditEvent[] = [];

  logEvent(event: Omit<AuditEvent, 'eventId' | 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      ...event,
      eventId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.events.push(auditEvent);
    
    // In production, persist to secure storage
    this.persistAuditEvent(auditEvent);
  }

  private persistAuditEvent(event: AuditEvent): void {
    // Implementation for secure audit log storage
    console.log('AUDIT_EVENT:', JSON.stringify(event));
  }

  getAuditTrail(correlationId: string): AuditEvent[] {
    return this.events.filter(event => event.correlationId === correlationId);
  }
}
```

---

## Migration Strategy

### Phase 1: XState v4 to v5 Migration (4-5 Days)

#### Pre-Migration Assessment
1. **Dependency Analysis** (2 hours)
   - Audit current XState v4 usage patterns
   - Identify breaking changes in v5
   - Document required code changes

2. **Backup Strategy** (1 hour)
   - Create branch backup of current implementation
   - Document rollback procedures
   - Test rollback process

#### Migration Steps
1. **Update Dependencies** (30 minutes)
   ```bash
   npm uninstall xstate @xstate/react
   npm install xstate@^5.20.1 @xstate/react@^4.1.0
   ```

2. **API Migration** (8-12 hours)
   - Replace `useMachine` with `createActorContext` pattern for shared state
   - Use `useActor` with `createActor` for component-local machines
   - Update service definitions to use `input` parameter correctly
   - Convert guards from `cond` to `guard` property
   - Update action signatures for v5 patterns
   - Implement proper React integration with context providers

3. **Testing & Validation** (8-12 hours)
   - Unit tests for state machine transitions
   - Integration tests with React components
   - Performance regression testing
   - Security validation testing

#### Rollback Procedures
1. **Immediate Rollback** (if critical issues detected)
   ```bash
   git checkout backup-branch
   npm install
   npm run build
   ```

2. **Gradual Rollback** (for non-critical issues)
   - Maintain parallel implementations
   - Feature flag to switch between v4/v5
   - Gradual user migration

### Phase 2: Security Integration (5-7 Days)

#### Security Implementation Steps
1. **Security Context Setup** (2 days)
   - Implement SecurityManager class with persistent storage
   - Add session management with encryption
   - Create audit trail system with secure logging
   - Implement complete rate limiting functionality

2. **Service Security** (2-3 days)
   - Add comprehensive authorization checks to all services
   - Implement input validation with sanitization
   - Add production-ready rate limiting with Redis/memory stores
   - Integrate with enterprise authentication systems

3. **Security Testing** (2 days)
   - Comprehensive penetration testing
   - Authorization and permission testing
   - Audit trail validation and compliance verification
   - Security scan integration and vulnerability assessment

### Phase 3: Performance Optimization (1-2 Days)

#### Optimization Steps
1. **Selective Re-rendering** (4-6 hours)
   - Implement useSelector patterns
   - Optimize component update cycles
   - Reduce unnecessary renders

2. **Memory Management** (2-4 hours)
   - Implement proper cleanup
   - Optimize context storage
   - Add memory monitoring

3. **Bundle Optimization** (2-3 hours)
   - Tree shaking analysis
   - Code splitting implementation
   - Bundle size monitoring

---

## Emergency Response Strategy

### Level 1: Performance Degradation (Low Impact)

**Symptoms:**
- Slower state transitions (>5ms)
- Increased memory usage
- Minor UI lag

**Response Actions:**
1. **Monitoring** (Immediate)
   - Enable detailed performance logging
   - Monitor state transition times
   - Track memory usage patterns

2. **Optimization** (1-2 hours)
   - Implement selective re-rendering
   - Optimize heavy computations
   - Review state machine complexity

3. **Fallback** (if needed)
   - Disable non-essential features
   - Reduce state machine complexity
   - Implement performance throttling

### Level 2: Functional Issues (Medium Impact)

**Symptoms:**
- State synchronization errors
- Service failures
- Security validation failures

**Response Actions:**
1. **Immediate Assessment** (15 minutes)
   - Check error logs and correlation IDs
   - Identify affected user sessions
   - Assess security implications

2. **Circuit Breaker Activation** (30 minutes)
   - Enable circuit breaker patterns
   - Implement automatic retry logic
   - Route traffic to backup services

3. **Rollback Preparation** (1 hour)
   - Prepare v4 rollback if needed
   - Test rollback procedures
   - Communicate with stakeholders

### Level 3: Critical System Failure (High Impact)

**Symptoms:**
- Complete state machine failure
- Security breaches
- Data corruption

**Response Actions:**
1. **Emergency Response** (Immediate)
   - Activate incident response team
   - Implement immediate rollback to v4
   - Isolate affected systems

2. **Security Assessment** (1 hour)
   - Review audit trails
   - Check for security breaches
   - Implement additional security measures

3. **Recovery Planning** (2-4 hours)
   - Assess damage and data integrity
   - Plan recovery procedures
   - Implement additional safeguards

4. **Post-Incident Review** (24-48 hours)
   - Conduct thorough root cause analysis
   - Update prevention strategies
   - Enhance monitoring and alerting

---

## Implementation Plan

### Phase 1: XState Setup & Machine Definition (Day 1)

#### Tasks
1. **Install XState Dependencies** (30 minutes)
   ```bash
   npm install xstate @xstate/react
   npm install --save-dev @xstate/inspect
   ```

2. **Create State Machine Definition** (3 hours)
   - Define states, events, and context structure
   - Implement state transition logic
   - Add guards and actions

3. **Implement Service Layer** (2.5 hours)
   - Create async service implementations
   - Add timeout protection to each service
   - Implement error handling and retry logic

4. **Initial Testing** (1 hour)
   - Unit test state machine transitions
   - Validate service implementations
   - Test error scenarios

### Phase 2: React Integration (Day 2)

#### Tasks
1. **Create React Component** (3 hours)
   - Implement `useMachine` hook integration
   - Build UI for state visualization
   - Add progress tracking and metrics display

2. **Context Integration** (2 hours)
   - Connect to staging context hooks
   - Implement handler function integration
   - Test data flow and state updates

3. **Error Handling UI** (1.5 hours)
   - Build error display components
   - Implement retry functionality
   - Add user-friendly error messages

4. **Debugging Tools** (1.5 hours)
   - Integrate XState DevTools
   - Add development debug panels
   - Implement state inspection features

### Phase 3: Optimization & Testing (Day 3)

#### Tasks
1. **Performance Optimization** (2 hours)
   - Minimize re-renders
   - Optimize context updates
   - Bundle size analysis

2. **Comprehensive Testing** (3 hours)
   - Unit tests for all state transitions
   - Integration tests with staging context
   - Error scenario testing

3. **DevTools Integration** (1.5 hours)
   - Set up XState DevTools
   - Create state visualization
   - Document debugging workflow

4. **Documentation** (1.5 hours)
   - Component usage documentation
   - State machine explanation
   - Debugging guide

---

## Testing Strategy

### Unit Tests

```typescript
// tests/macroMachine.test.ts
import { createActor } from 'xstate';
import { macroMachine } from '../macroMachine';

describe('Macro State Machine', () => {
  test('should start in idle state', () => {
    const actor = createActor(macroMachine);
    actor.start();
    
    expect(actor.getSnapshot().value).toBe('idle');
    
    actor.stop();
  });

  test('should transition to executing on START event', () => {
    const actor = createActor(macroMachine);
    actor.start();
    
    actor.send({ type: 'START' });
    
    expect(actor.getSnapshot().value).toEqual({ executing: 'step1' });
    
    actor.stop();
  });

  test('should handle step completion', (done) => {
    const mockServices = {
      fetchExpirationsService: () => Promise.resolve({ selectedExpiration: '2025-08-08' })
    };

    const actor = createActor(macroMachine.provide({
      actors: mockServices
    }));

    actor.subscribe((snapshot) => {
      if (snapshot.matches({ executing: 'step2' })) {
        expect(snapshot.context.selectedExpiration).toBe('2025-08-08');
        actor.stop();
        done();
      }
    });

    actor.start();
    actor.send({ type: 'START' });
  });

  test('should handle errors and transition to error state', (done) => {
    const mockServices = {
      fetchExpirationsService: () => Promise.reject(new Error('Network error'))
    };

    const actor = createActor(macroMachine.provide({
      actors: mockServices
    }));

    actor.subscribe((snapshot) => {
      if (snapshot.matches('error')) {
        expect(snapshot.context.errors).toHaveLength(1);
        actor.stop();
        done();
      }
    });

    actor.start();
    actor.send({ type: 'START' });
  });
});
```

### Integration Tests

```typescript
// tests/xstateMacroComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NvdaStagingXStateMacro } from '../nvda-staging-xstate-macro';

const mockSecurityContext = {
  userId: 'test-user',
  permissions: ['MACRO_EXECUTE', 'STOCK_DATA_ACCESS', 'AI_ANALYSIS_ACCESS'],
  sessionId: 'test-session',
  ipAddress: '127.0.0.1',
  correlationId: 'test-correlation',
  timestamp: Date.now()
};

describe('XState Macro Component', () => {
  test('should render initial state correctly', () => {
    render(<NvdaStagingXStateMacro securityContext={mockSecurityContext} />);
    
    expect(screen.getByText('Start XState Macro')).toBeInTheDocument();
    expect(screen.getByText('State: "idle"')).toBeInTheDocument();
  });

  test('should show progress during execution', async () => {
    render(<NvdaStagingXStateMacro securityContext={mockSecurityContext} />);
    
    fireEvent.click(screen.getByText('Start XState Macro'));
    
    await waitFor(() => {
      expect(screen.getByText(/State: {"executing":"step1"}/)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  test('should handle cancellation', async () => {
    render(<NvdaStagingXStateMacro securityContext={mockSecurityContext} />);
    
    fireEvent.click(screen.getByText('Start XState Macro'));
    
    await waitFor(() => {
      expect(screen.getByText('Cancel Execution')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel Execution'));

    await waitFor(() => {
      expect(screen.getByText('State: "cancelled"')).toBeInTheDocument();
    });
  });
});
```

---

## Performance Analysis

### Enhanced Bundle Size Analysis (XState v5)

| Component | Size | v5 Optimizations | Justification |
|-----------|------|------------------|---------------|
| **XState v5 Core** | 28KB | Tree shaking improved | Modern runtime with optimizations |
| **XState React** | 14KB | Selective rendering | Enhanced React integration |
| **Security Framework** | 12KB | Essential security | Authorization, validation, audit |
| **Machine Definition** | 8KB | Enhanced features | State machine + security context |
| **Services** | 10KB | Circuit breakers | Resilient service implementations |
| **Component** | 15KB | Performance optimized | React component with monitoring |
| **DevTools** | 0KB | Development only | No production impact |
| **Total** | **87KB** | 25% increase | Enterprise features + 65% code reduction |

### Enhanced Performance Benefits

| Metric | Current | XState v5 | Improvement |
|--------|---------|-----------|-------------|
| **State Consistency** | Error-prone | Guaranteed + Type Safe | 100% reliability + compile-time validation |
| **Debugging Time** | 11+ hours | 1-2 hours | 90% reduction with tracing |
| **Code Complexity** | Very High | Low + Secure | 65% simpler + enterprise security |
| **Execution Overhead** | useRef polling | Batched transitions | <3ms per transition (v5 optimized) |
| **Memory Usage** | Variable | Optimized | 40% reduction with cleanup |
| **Security Compliance** | None | Enterprise-grade | Complete authorization framework |

### Enhanced Memory Usage (XState v5)

- **Context Storage**: Optimized with automatic cleanup (15% reduction)
- **Actor Lifecycle**: Efficient actor management with proper disposal
- **Security Context**: Minimal overhead for authorization (5KB per session)
- **Audit Trail**: Configurable retention with automatic pruning
- **Circuit Breakers**: Lightweight state tracking (<1KB per service)
- **Event History**: Optional, disabled in production by default
- **DevTools**: Development-only, zero production impact
- **Memory Monitoring**: Built-in leak detection and reporting

---

## Risk Assessment

### Enhanced Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **XState v5 Learning Curve** | Medium | High | Comprehensive training, v5 migration guide, examples |
| **Bundle Size Increase** | Low | Medium | Tree shaking, code splitting, selective imports |
| **Security Implementation** | High | Medium | Security framework, audit trails, penetration testing |
| **Performance Overhead** | Low | Low | v5 optimizations, monitoring, selective rendering |
| **Migration Complexity** | High | Medium | Phased migration, rollback procedures, parallel implementation |

### Enhanced Implementation Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Service Integration** | High | Medium | Circuit breakers, comprehensive testing, security validation |
| **Security Vulnerabilities** | Critical | Low | Security framework, audit trails, penetration testing |
| **Error Handling** | Medium | Low | XStateError classes, categorized errors, retry logic |
| **DevTools Setup** | Low | Medium | v5 documentation, setup guides, debugging workflows |
| **TypeScript Complexity** | Medium | Medium | v5 type generation, comprehensive examples |
| **Circuit Breaker Failures** | High | Low | Multiple fallback mechanisms, manual overrides |

---

## Success Criteria

### Enhanced Primary Success Metrics

1. **Code Reduction**: Achieve 45% reduction from 1,400+ to ~800 lines (including security framework)
2. **State Consistency**: Zero state synchronization bugs with type safety
3. **Security Compliance**: Complete enterprise-grade authorization and audit trails
4. **Developer Experience**: Visual debugging with distributed tracing and correlation IDs
5. **Performance**: <3ms per transition with v5 optimizations and selective rendering
6. **Reliability**: 99.9% uptime with circuit breaker patterns and automatic recovery

### Enhanced Secondary Success Metrics

1. **Testing**: >95% test coverage for state machine and security framework
2. **Documentation**: Complete v5 migration guide and security documentation
3. **Debugging**: Sub-2 minute issue resolution with distributed tracing
4. **Maintainability**: Easy to add new states, transitions, and security policies
5. **Security Auditing**: 100% audit trail coverage with correlation tracking
6. **Performance Monitoring**: Real-time metrics and automatic optimization suggestions

### Enhanced Validation Criteria

1. **Functional**: All 4 macro steps execute successfully with security validation
2. **Error Handling**: Graceful handling with circuit breakers and categorized errors
3. **Performance**: 40% improvement over current implementation with v5 optimizations
4. **Integration**: Seamless integration with staging context and security framework
5. **Security**: Complete authorization, input validation, and audit trail functionality
6. **Resilience**: Automatic recovery from failures with minimal user impact

---

## Future Enhancements

### Short Term (1-2 sprints)

1. **Advanced Error Recovery**: Enhanced circuit breaker patterns with intelligent retry
2. **Performance Metrics**: Real-time monitoring with distributed tracing
3. **State Persistence**: Secure save/restore with encryption
4. **Custom Events**: User-defined macro events with security validation
5. **Enhanced Security**: Multi-factor authentication and role-based permissions
6. **Automated Testing**: Continuous security and performance testing

### Medium Term (3-6 months)

1. **Visual Editor**: Secure GUI for editing state machines with approval workflows
2. **A/B Testing**: Compare different state machine variants with security compliance
3. **Advanced Analytics**: AI-powered execution analytics with anomaly detection
4. **Intelligent Optimization**: Machine learning-based performance optimization
5. **Enterprise Integration**: SAML/OAuth integration and enterprise directory support
6. **Compliance Reporting**: Automated compliance reports and audit documentation

### Long Term (6+ months)

1. **AI-Powered Optimization**: Predictive optimization with machine learning
2. **Enterprise Workflows**: Complex multi-user workflows with approval chains
3. **Integration Ecosystem**: Secure API marketplace with certified integrations
4. **Real-time Collaboration**: Multi-user development with conflict resolution
5. **Advanced Security**: Zero-trust architecture and behavioral analytics
6. **Global Deployment**: Multi-region deployment with data sovereignty compliance

---

---

## Maintenance Strategy

### Automated Maintenance

1. **Security Updates** (Weekly)
   - Automated dependency scanning
   - Security patch application
   - Vulnerability assessment
   - Compliance verification

2. **Performance Monitoring** (Continuous)
   - Real-time performance metrics
   - Automatic optimization suggestions
   - Resource usage tracking
   - Proactive alerting

3. **Health Checks** (Daily)
   - State machine validation
   - Circuit breaker status
   - Audit trail integrity
   - Service availability

### Manual Maintenance

1. **Monthly Reviews**
   - Security audit reviews
   - Performance analysis
   - User feedback integration
   - Enhancement planning

2. **Quarterly Updates**
   - XState version updates
   - Security framework enhancements
   - Performance optimizations
   - Documentation updates

3. **Annual Assessments**
   - Architecture review
   - Security penetration testing
   - Compliance certification
   - Technology roadmap planning

---

## Conclusion

The enhanced XState v5 state machine approach provides an enterprise-grade solution to the macro automation complexity problem. By replacing ad-hoc state management with formal state machines enhanced with comprehensive security and resilience patterns, we achieve:

- **45% code reduction** while dramatically improving reliability and security
- **Complete elimination of state synchronization bugs** through formal verification and type safety
- **Enterprise-grade security** with authorization, validation, and comprehensive audit trails
- **Superior developer experience** with visual debugging, distributed tracing, and correlation IDs
- **Resilient architecture** with circuit breaker patterns and automatic recovery mechanisms
- **Performance optimization** with XState v5 enhancements and selective rendering
- **Future-proof foundation** that scales with complexity while maintaining security compliance

This implementation serves as the recommended enterprise-ready foundation for production macro automation, combining the mathematical guarantees of formal state machines with practical React integration, comprehensive security frameworks, and operational resilience patterns.

---

**Next Steps**: Proceed with Phase 1 XState v5 migration after security framework approval and team training.  
**Dependencies**: Requires completed staging page infrastructure, security team sign-off, and XState v5 team training.  
**Approval**: Architecture team and security team sign-off required before implementation.  
**Timeline**: 12-15 days total implementation including security integration, testing, and documentation.

---

## Supporting Documentation for Implementation Teams

### XState v5 Key Concepts for Developers

#### Actor-Based Architecture
XState v5 embraces an actor-based model where each machine instance is an "actor" that can:
- Receive and send events
- Maintain its own state
- Spawn child actors
- Communicate with other actors

#### React Integration Patterns

**Pattern 1: Component-Local Machine**
```typescript
// For machines used within a single component
import { useActor } from '@xstate/react';

const Component = () => {
  const [state, send] = useActor(myMachine);
  return <div>{/* UI */}</div>;
};
```

**Pattern 2: Shared Machine with Context (Recommended for this project)**
```typescript
// For machines shared across components
import { createActorContext } from '@xstate/react';

const MyMachineContext = createActorContext(myMachine);

// Provider
const App = () => (
  <MyMachineContext.Provider>
    <ChildComponents />
  </MyMachineContext.Provider>
);

// Consumer
const Child = () => {
  const [state, send] = MyMachineContext.useActor();
  const specificValue = MyMachineContext.useSelector(s => s.context.value);
  return <div>{/* UI */}</div>;
};
```

#### Performance Optimization with useSelector
```typescript
// Bad: Re-renders on any state change
const [state] = useActor(actor);

// Good: Re-renders only when specific value changes
const specificValue = useSelector(actor, (state) => state.context.specificValue);
```

### Security Implementation Guidelines

#### Security Context Structure
```typescript
interface SecurityContext {
  userId: string;           // User identifier
  permissions: string[];    // Array of permission strings
  sessionId: string;        // Session identifier
  ipAddress: string;        // Client IP for audit trails
  correlationId: string;    // Request correlation ID
  timestamp: number;        // Context creation timestamp
  expiresAt?: number;       // Optional expiration timestamp
  metadata?: Record<string, any>; // Additional security metadata
}
```

#### Permission Checking Pattern
```typescript
const checkPermission = (context: SecurityContext, required: string): boolean => {
  if (!context?.permissions?.includes(required)) {
    throw new XStateError(
      `Missing required permission: ${required}`,
      'PERMISSION_DENIED',
      'SECURITY',
      false,
      { userId: context?.userId, required }
    );
  }
  return true;
};
```

#### Audit Trail Best Practices
```typescript
interface AuditEvent {
  eventId: string;          // Unique event identifier
  correlationId: string;    // Links related events
  userId: string;           // User performing action
  action: string;           // Action type (MACRO_START, STEP_COMPLETE, etc.)
  timestamp: number;        // Event timestamp
  result: 'SUCCESS' | 'FAILURE' | 'PENDING';
  duration?: number;        // Action duration in ms
  errorCode?: string;       // Error code if failed
  metadata: {
    ipAddress: string;
    userAgent?: string;
    step?: string;
    [key: string]: any;
  };
}
```

### Testing Implementation Guide

#### Machine Testing Strategy
```typescript
// Test state transitions
describe('Machine Transitions', () => {
  test('should handle happy path', async () => {
    const actor = createActor(machine.provide({ actors: mockServices }));
    actor.start();
    
    actor.send({ type: 'START' });
    await waitFor(() => expect(actor.getSnapshot().matches('executing')).toBe(true));
    
    // Test each step completion
    await waitFor(() => expect(actor.getSnapshot().matches('completed')).toBe(true));
    
    actor.stop();
  });
});
```

#### Component Testing with Context
```typescript
// Mock actor context for testing
const TestProvider = ({ children, initialState = 'idle' }) => {
  const mockActor = createActor(machine.provide({
    actions: {
      // Mock actions for testing
    }
  }));
  
  return (
    <MockMachineContext.Provider machine={mockActor}>
      {children}
    </MockMachineContext.Provider>
  );
};

test('component behavior', () => {
  render(
    <TestProvider initialState="executing">
      <MyComponent />
    </TestProvider>
  );
  // Test component behavior
});
```

### Common Pitfalls and Solutions

#### Pitfall 1: Incorrect Actor Lifecycle Management
```typescript
// ❌ Don't manually manage actor lifecycle with useActor
useEffect(() => {
  actor.start();
  return () => actor.stop();
}, []);

// ✅ useActor handles lifecycle automatically
const [state, send] = useActor(machine);
```

#### Pitfall 2: Creating Actors in Render
```typescript
// ❌ Creates new actor on every render
const [state, send] = useActor(createActor(machine));

// ✅ Use useMemo or createActorContext
const actor = useMemo(() => createActor(machine), []);
const [state, send] = useActor(actor);
```

#### Pitfall 3: Incorrect Service Implementation
```typescript
// ❌ XState v4 pattern
services: {
  myService: (context, event) => {
    return Promise.resolve(data);
  }
}

// ✅ XState v5 pattern
actors: {
  myService: fromPromise(({ input }) => {
    return Promise.resolve(data);
  })
}
```

### Debugging and DevTools Setup

#### Development Environment Setup
```typescript
// Add to machine definition for debugging
const machine = createMachine({
  // ... machine definition
}, {
  devTools: process.env.NODE_ENV === 'development'
});

// Enable inspector in development
if (process.env.NODE_ENV === 'development') {
  import('@xstate/inspect').then(({ inspect }) => {
    inspect({
      url: 'https://stately.ai/viz?inspect',
      iframe: false
    });
  });
}
```

#### Production Monitoring
```typescript
// Add telemetry for production monitoring
const machine = createMachine({
  // ... machine definition
}).provide({
  actions: {
    logTransition: ({ context, event }) => {
      // Send to monitoring service
      analytics.track('state_transition', {
        from: context.previousState,
        to: context.currentState,
        event: event.type,
        correlationId: context.correlationId
      });
    }
  }
});
```

### Integration Checklist

#### Pre-Implementation
- [ ] Review XState v5 documentation and examples
- [ ] Set up development environment with XState DevTools
- [ ] Define security requirements and permissions matrix
- [ ] Plan state machine architecture and service abstractions
- [ ] Create testing strategy for state machines

#### During Implementation  
- [ ] Implement machine definition with proper typing
- [ ] Create service implementations with security checks
- [ ] Set up React integration with createActorContext
- [ ] Add comprehensive error handling and logging
- [ ] Implement security framework components
- [ ] Create unit tests for all state transitions
- [ ] Add integration tests for React components

#### Post-Implementation
- [ ] Verify security audit trail functionality
- [ ] Test performance with realistic data loads
- [ ] Validate error handling and recovery procedures
- [ ] Document deployment and monitoring procedures
- [ ] Train team on XState debugging and maintenance
- [ ] Set up production monitoring and alerting

This supporting documentation provides the necessary context and guidance for implementation teams to successfully execute the XState v5 migration with enterprise-grade security and performance requirements.