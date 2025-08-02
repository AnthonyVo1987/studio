# PRD: Option 4 - Server-Side Orchestration Implementation

**Version**: 1.0.0  
**Date**: August 2, 2025  
**Project**: Macro Automation Re-Architecture  
**Option**: 4 - Server-Side Orchestration with Real-time Streaming  
**Recommendation**: Maximum Reliability Option

---

## Executive Summary

### Overview

This PRD defines the implementation of server-side macro orchestration using Next.js Server Actions with real-time streaming updates, moving the entire macro execution logic to the server for maximum reliability and network resilience.

### Key Benefits

- **Maximum Reliability**: Server-side execution eliminates client-side issues
- **Network Resilience**: Built-in retry and recovery at server level
- **Real-time Updates**: Streaming provides excellent user experience
- **Scalability**: Leverages server resources and caching capabilities
- **Security**: Sensitive operations run server-side with enhanced protection

### Success Metrics

| Metric | Current | Target | Expected Impact |
|--------|---------|--------|----------------|
| **Execution Reliability** | 95% | 99.5% | Server-side stability |
| **Network Failure Recovery** | Manual | Automatic | Built-in resilience |
| **User Experience** | Static | Real-time | Live progress updates |
| **Security Posture** | Client-exposed | Server-protected | Enhanced security |

---

## Technical Requirements

### Functional Requirements

#### FR-1: Server Action Architecture
- **Sequential Execution**: Server-side step-by-step macro execution
- **Streaming Updates**: Real-time progress updates to client
- **State Management**: Server-side execution state tracking
- **Result Aggregation**: Complete result collection and formatting

#### FR-2: Real-time Communication
- **Server-Sent Events**: Live streaming of execution progress
- **Event Types**: step_started, step_progress, step_completed, step_failed, execution_complete
- **Bi-directional Communication**: Client cancellation requests to server
- **Connection Management**: Automatic reconnection and state synchronization

#### FR-3: Client Integration
- **Server Action Hooks**: React integration with server actions
- **Optimistic Updates**: Client-side state predictions
- **Event Subscription**: Real-time event handling in React
- **Error Boundaries**: Client-side error isolation and recovery

#### FR-4: Resilience & Recovery
- **Automatic Retry**: Server-side retry logic with exponential backoff
- **Failure Recovery**: Graceful handling of individual step failures
- **Connection Recovery**: Automatic reconnection on network issues
- **State Synchronization**: Client state sync after reconnection

### Non-Functional Requirements

#### NFR-1: Performance
- **Server Execution Speed**: Leverage server resources for faster execution
- **Streaming Latency**: <100ms update delivery to client
- **Connection Efficiency**: Minimal bandwidth usage for events
- **Resource Usage**: Efficient server resource utilization

#### NFR-2: Reliability
- **Server Stability**: 99.9% uptime for macro execution
- **Network Resilience**: Automatic recovery from connection issues
- **Error Isolation**: Server errors don't crash client application
- **Data Integrity**: Consistent state between server and client

#### NFR-3: Security
- **Server-side Validation**: All input validation on server
- **API Protection**: Secured server actions with rate limiting
- **Data Privacy**: Sensitive data processed server-side only
- **Authentication**: Proper session validation for server actions

---

## Architecture Design

### Server Action Implementation

```typescript
// actions/macroServerAction.ts
'use server';

export interface MacroExecutionState {
  executionId: string;
  status: 'idle' | 'executing' | 'completed' | 'error' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  results: {
    expirations?: ExpirationResult;
    stockData?: StockDataResult;
    aiTakeaways?: AiTakeawaysResult;
    aiOptions?: AiOptionsResult;
  };
  errors: MacroExecutionError[];
  metrics: {
    startTime: number;
    endTime?: number;
    stepTimes: number[];
    totalDuration?: number;
  };
}

export interface MacroStreamUpdate {
  executionId: string;
  type: 'step_started' | 'step_progress' | 'step_completed' | 'step_failed' | 'execution_complete' | 'execution_error';
  step?: number;
  stepName?: string;
  progress?: number;
  message?: string;
  data?: any;
  error?: string;
  timestamp: number;
}

// Global execution state storage (in production, use Redis or database)
const executionStates = new Map<string, MacroExecutionState>();

export async function executeMacroAnalysis(
  ticker: string,
  prevState?: MacroExecutionState
): Promise<{ success: boolean; executionId: string; error?: string }> {
  const executionId = `server_macro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Initialize execution state
  const state: MacroExecutionState = {
    executionId,
    status: 'executing',
    currentStep: 0,
    totalSteps: 4,
    results: {},
    errors: [],
    metrics: {
      startTime: Date.now(),
      stepTimes: []
    }
  };

  executionStates.set(executionId, state);

  try {
    // Stream execution start
    await streamUpdate(executionId, {
      executionId,
      type: 'step_started',
      step: 1,
      stepName: 'Fetch Expirations',
      message: 'Starting expiration data retrieval...',
      timestamp: Date.now()
    });

    // Step 1: Fetch Expirations
    state.currentStep = 1;
    const expirationsResult = await executeStepWithRetry(
      executionId,
      1,
      'Fetch Expirations',
      async () => {
        const result = await fetchExpirationsServerSide(ticker);
        return result;
      }
    );

    state.results.expirations = expirationsResult;
    
    await streamUpdate(executionId, {
      executionId,
      type: 'step_completed',
      step: 1,
      stepName: 'Fetch Expirations',
      message: `Found ${expirationsResult.availableExpirations.length} expiration dates`,
      data: { selectedExpiration: expirationsResult.selectedExpiration },
      timestamp: Date.now()
    });

    // Step 2: Get Stock Data
    state.currentStep = 2;
    await streamUpdate(executionId, {
      executionId,
      type: 'step_started',
      step: 2,
      stepName: 'Get Stock Data',
      message: 'Retrieving stock data and technical analysis...',
      timestamp: Date.now()
    });

    const stockDataResult = await executeStepWithRetry(
      executionId,
      2,
      'Get Stock Data',
      async () => {
        const result = await getStockDataServerSide(ticker, expirationsResult.selectedExpiration);
        return result;
      }
    );

    state.results.stockData = stockDataResult;

    await streamUpdate(executionId, {
      executionId,
      type: 'step_completed',
      step: 2,
      stepName: 'Get Stock Data',
      message: 'Stock data and technical analysis retrieved successfully',
      data: { stockSnapshot: stockDataResult.stockSnapshot },
      timestamp: Date.now()
    });

    // Step 3: Generate AI Key Takeaways
    state.currentStep = 3;
    await streamUpdate(executionId, {
      executionId,
      type: 'step_started',
      step: 3,
      stepName: 'AI Key Takeaways',
      message: 'Generating AI-powered analysis insights...',
      timestamp: Date.now()
    });

    const aiTakeawaysResult = await executeStepWithRetry(
      executionId,
      3,
      'AI Key Takeaways',
      async () => {
        // Progress updates during AI processing
        await streamUpdate(executionId, {
          executionId,
          type: 'step_progress',
          step: 3,
          stepName: 'AI Key Takeaways',
          progress: 25,
          message: 'Analyzing market data...',
          timestamp: Date.now()
        });

        await streamUpdate(executionId, {
          executionId,
          type: 'step_progress',
          step: 3,
          stepName: 'AI Key Takeaways',
          progress: 75,
          message: 'Generating insights...',
          timestamp: Date.now()
        });

        const result = await generateAiTakeawaysServerSide(ticker, stockDataResult);
        return result;
      }
    );

    state.results.aiTakeaways = aiTakeawaysResult;

    await streamUpdate(executionId, {
      executionId,
      type: 'step_completed',
      step: 3,
      stepName: 'AI Key Takeaways',
      message: 'AI analysis completed successfully',
      data: { takeawaysLength: aiTakeawaysResult.takeaways.length },
      timestamp: Date.now()
    });

    // Step 4: Generate AI Options Analysis
    state.currentStep = 4;
    await streamUpdate(executionId, {
      executionId,
      type: 'step_started',
      step: 4,
      stepName: 'AI Options Analysis',
      message: 'Generating AI options trading recommendations...',
      timestamp: Date.now()
    });

    const aiOptionsResult = await executeStepWithRetry(
      executionId,
      4,
      'AI Options Analysis',
      async () => {
        // Progress updates during AI processing
        await streamUpdate(executionId, {
          executionId,
          type: 'step_progress',
          step: 4,
          stepName: 'AI Options Analysis',
          progress: 30,
          message: 'Analyzing options chain...',
          timestamp: Date.now()
        });

        await streamUpdate(executionId, {
          executionId,
          type: 'step_progress',
          step: 4,
          stepName: 'AI Options Analysis',
          progress: 80,
          message: 'Generating trading strategies...',
          timestamp: Date.now()
        });

        const result = await generateAiOptionsServerSide(ticker, stockDataResult, aiTakeawaysResult);
        return result;
      }
    );

    state.results.aiOptions = aiOptionsResult;

    // Complete execution
    state.status = 'completed';
    state.metrics.endTime = Date.now();
    state.metrics.totalDuration = state.metrics.endTime - state.metrics.startTime;

    await streamUpdate(executionId, {
      executionId,
      type: 'execution_complete',
      step: 4,
      stepName: 'AI Options Analysis',
      message: 'Macro execution completed successfully',
      data: {
        totalDuration: state.metrics.totalDuration,
        results: {
          selectedExpiration: expirationsResult.selectedExpiration,
          stockTicker: ticker,
          analysisComplete: true
        }
      },
      timestamp: Date.now()
    });

    return {
      success: true,
      executionId
    };

  } catch (error) {
    state.status = 'error';
    state.errors.push({
      step: state.currentStep,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });

    await streamUpdate(executionId, {
      executionId,
      type: 'execution_error',
      step: state.currentStep,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Macro execution failed',
      timestamp: Date.now()
    });

    return {
      success: false,
      executionId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    executionStates.set(executionId, state);
  }
}

async function executeStepWithRetry<T>(
  executionId: string,
  step: number,
  stepName: string,
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout: ${stepName}`)), 45000);
        })
      ]);

      return result;

    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const retryDelay = Math.pow(2, attempt) * 1000; // Exponential backoff
        
        await streamUpdate(executionId, {
          executionId,
          type: 'step_progress',
          step,
          stepName,
          message: `Step failed, retrying in ${retryDelay / 1000}s... (attempt ${attempt}/${maxRetries})`,
          timestamp: Date.now()
        });

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError;
}

// Server-side implementations
async function fetchExpirationsServerSide(ticker: string): Promise<ExpirationResult> {
  // Server-side implementation of expiration fetching
  // Direct API calls to Polygon.io without client-side constraints
  const response = await fetch(`https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${ticker}&limit=1000`, {
    headers: {
      'Authorization': `Bearer ${process.env.POLYGON_API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch expirations: ${response.statusText}`);
  }

  const data = await response.json();
  const expirations = extractUniqueExpirations(data.results);
  
  return {
    selectedExpiration: expirations[0],
    availableExpirations: expirations,
    timestamp: Date.now()
  };
}

async function getStockDataServerSide(ticker: string, expiration: string): Promise<StockDataResult> {
  // Parallel server-side data fetching
  const [stockSnapshot, marketStatus, technicalAnalysis] = await Promise.all([
    fetchStockSnapshot(ticker),
    fetchMarketStatus(ticker),
    fetchTechnicalAnalysis(ticker)
  ]);

  return {
    stockSnapshot,
    marketStatus,
    technicalAnalysis,
    expiration,
    timestamp: Date.now()
  };
}

async function generateAiTakeawaysServerSide(
  ticker: string, 
  stockData: StockDataResult
): Promise<AiTakeawaysResult> {
  // Server-side AI generation with Genkit
  const flow = await import('@/ai/flows/analyze-stock-data');
  
  const result = await flow.analyzeStockDataFlow({
    ticker,
    stockData: stockData.stockSnapshot,
    technicalAnalysis: stockData.technicalAnalysis,
    marketStatus: stockData.marketStatus
  });

  return {
    takeaways: result.analysis,
    timestamp: Date.now()
  };
}

async function generateAiOptionsServerSide(
  ticker: string,
  stockData: StockDataResult,
  aiTakeaways: AiTakeawaysResult
): Promise<AiOptionsResult> {
  // Server-side AI options analysis
  const flow = await import('@/ai/flows/analyze-options-data');
  
  const result = await flow.analyzeOptionsDataFlow({
    ticker,
    stockData: stockData.stockSnapshot,
    aiTakeaways: aiTakeaways.takeaways,
    expiration: stockData.expiration
  });

  return {
    optionsAnalysis: result.analysis,
    timestamp: Date.now()
  };
}
```

### Streaming Implementation

```typescript
// api/macro-stream/route.ts
import { NextRequest } from 'next/server';

// Global stream connections (in production, use Redis pub/sub)
const streamConnections = new Map<string, { controller: ReadableStreamDefaultController; executionId: string }>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get('executionId');

  if (!executionId) {
    return new Response('Missing executionId', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Store connection for this execution
      streamConnections.set(executionId, { controller, executionId });

      // Send initial connection confirmation
      const initMessage = `data: ${JSON.stringify({
        type: 'connection_established',
        executionId,
        timestamp: Date.now()
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(initMessage));
    },

    cancel() {
      // Clean up connection
      streamConnections.delete(executionId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

// Utility function called from server action
export async function streamUpdate(executionId: string, update: MacroStreamUpdate) {
  const connection = streamConnections.get(executionId);
  
  if (connection) {
    const message = `data: ${JSON.stringify(update)}\n\n`;
    
    try {
      connection.controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.error('Failed to send stream update:', error);
      streamConnections.delete(executionId);
    }
  }
}
```

### React Client Integration

```typescript
// hooks/useMacroStream.ts
export function useMacroStream() {
  const [state, setState] = useState<MacroStreamState>({
    status: 'idle',
    currentStep: 0,
    totalSteps: 4,
    progress: 0,
    messages: [],
    results: {},
    error: null,
    executionId: null,
    connectionStatus: 'disconnected'
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const { execute: executeServerAction, isLoading } = useServerAction(executeMacroAnalysis);

  const connectToStream = useCallback((executionId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/macro-stream?executionId=${executionId}`);

    eventSource.onopen = () => {
      setState(prev => ({ ...prev, connectionStatus: 'connected' }));
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const update: MacroStreamUpdate = JSON.parse(event.data);
        
        setState(prev => {
          const newState = { ...prev };

          switch (update.type) {
            case 'step_started':
              newState.currentStep = update.step || 0;
              newState.messages = [...prev.messages, {
                type: 'info',
                message: update.message || '',
                timestamp: update.timestamp
              }];
              break;

            case 'step_progress':
              newState.progress = update.progress || 0;
              newState.messages = [...prev.messages, {
                type: 'progress',
                message: update.message || '',
                timestamp: update.timestamp
              }];
              break;

            case 'step_completed':
              newState.messages = [...prev.messages, {
                type: 'success',
                message: update.message || '',
                timestamp: update.timestamp
              }];
              if (update.data) {
                newState.results = { ...prev.results, ...update.data };
              }
              break;

            case 'step_failed':
              newState.status = 'error';
              newState.error = update.error || 'Step failed';
              newState.messages = [...prev.messages, {
                type: 'error',
                message: update.message || '',
                timestamp: update.timestamp
              }];
              break;

            case 'execution_complete':
              newState.status = 'completed';
              newState.progress = 100;
              newState.messages = [...prev.messages, {
                type: 'success',
                message: update.message || '',
                timestamp: update.timestamp
              }];
              if (update.data) {
                newState.results = { ...prev.results, ...update.data };
              }
              break;

            case 'execution_error':
              newState.status = 'error';
              newState.error = update.error || 'Execution failed';
              newState.messages = [...prev.messages, {
                type: 'error',
                message: update.message || '',
                timestamp: update.timestamp
              }];
              break;
          }

          return newState;
        });

      } catch (error) {
        console.error('Failed to parse stream update:', error);
      }
    };

    eventSource.onerror = () => {
      setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      
      // Attempt reconnection after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        if (state.status === 'executing') {
          connectToStream(executionId);
        }
      }, 3000);
    };

    eventSourceRef.current = eventSource;
  }, [state.status]);

  const execute = useCallback(async (ticker: string) => {
    setState(prev => ({
      ...prev,
      status: 'executing',
      currentStep: 0,
      progress: 0,
      messages: [],
      results: {},
      error: null
    }));

    try {
      const result = await executeServerAction(ticker, state);
      
      if (result.success && result.executionId) {
        setState(prev => ({ ...prev, executionId: result.executionId }));
        connectToStream(result.executionId);
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: result.error || 'Execution failed'
        }));
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [executeServerAction, connectToStream]);

  const cancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState(prev => ({
      ...prev,
      status: 'cancelled',
      connectionStatus: 'disconnected'
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    execute,
    cancel,
    isLoading: isLoading || state.status === 'executing'
  };
}
```

### React Component Implementation

```typescript
// components/staging/nvda-staging-server-macro.tsx
export function NvdaStagingServerMacro() {
  const { state, execute, cancel, isLoading } = useMacroStream();

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-green-600" />
          Server-Side Macro Automation
        </CardTitle>
        <CardDescription>
          Reliable server-side execution with real-time streaming
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Connection status */}
        <div className="mb-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            state.connectionStatus === 'connected' ? 'bg-green-500' :
            state.connectionStatus === 'connecting' ? 'bg-yellow-500' :
            'bg-gray-400'
          }`} />
          <span className="text-sm text-muted-foreground capitalize">
            {state.connectionStatus}
          </span>
          
          <Badge variant={
            state.status === 'executing' ? 'secondary' :
            state.status === 'completed' ? 'default' :
            state.status === 'error' ? 'destructive' : 'outline'
          } className="ml-auto">
            {state.status}
          </Badge>
        </div>

        {/* Progress visualization */}
        {state.status === 'executing' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {state.currentStep} of {state.totalSteps}</span>
              <span>{Math.round(state.progress)}%</span>
            </div>
            <Progress value={state.progress} />
          </div>
        )}

        {/* Real-time messages */}
        {state.messages.length > 0 && (
          <div className="mb-4 max-h-32 overflow-y-auto space-y-1">
            {state.messages.slice(-5).map((message, index) => (
              <div key={index} className={`text-xs p-2 rounded ${
                message.type === 'error' ? 'bg-red-100 text-red-700' :
                message.type === 'success' ? 'bg-green-100 text-green-700' :
                message.type === 'progress' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                <div className="flex justify-between items-start">
                  <span>{message.message}</span>
                  <span className="text-xs opacity-70 ml-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error display */}
        {state.error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded">
            <div className="font-medium text-red-800 mb-1">Execution Error:</div>
            <div className="text-sm text-red-700">{state.error}</div>
          </div>
        )}

        {/* Results summary */}
        {state.status === 'completed' && state.results && (
          <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded">
            <div className="font-medium text-green-800 mb-2">Execution Complete</div>
            {state.results.totalDuration && (
              <div className="text-sm text-green-700">
                Total Time: {Math.round(state.results.totalDuration / 1000)}s
              </div>
            )}
            {state.results.selectedExpiration && (
              <div className="text-sm text-green-700">
                Expiration: {state.results.selectedExpiration}
              </div>
            )}
          </div>
        )}

        {/* Execution details */}
        {state.executionId && (
          <div className="mb-4 p-2 bg-green-100 rounded text-xs">
            <div className="font-medium">Server Execution ID:</div>
            <div className="font-mono">{state.executionId}</div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {state.status === 'idle' || state.status === 'completed' || state.status === 'error' || state.status === 'cancelled' ? (
            <Button 
              onClick={() => execute('NVDA_STAGING')} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : state.status === 'completed' ? (
                'Run Again'
              ) : (
                'Start Server Macro'
              )}
            </Button>
          ) : (
            <Button onClick={cancel} variant="destructive" className="flex-1">
              Cancel Execution
            </Button>
          )}

          {state.connectionStatus === 'disconnected' && state.status === 'executing' && (
            <Button 
              onClick={() => state.executionId && connectToStream(state.executionId)} 
              variant="outline"
            >
              Reconnect
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
              {JSON.stringify({ 
                status: state.status,
                connectionStatus: state.connectionStatus,
                currentStep: state.currentStep,
                progress: state.progress,
                executionId: state.executionId,
                messageCount: state.messages.length
              }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Implementation Plan

### Phase 1: Server Infrastructure (Day 1)

#### Tasks
1. **Server Action Setup** (3 hours)
   - Implement macro execution server action
   - Add step-by-step execution logic
   - Implement retry mechanisms with exponential backoff

2. **Streaming Infrastructure** (3 hours)
   - Create Server-Sent Events API route
   - Implement streaming update functionality
   - Add connection management and cleanup

3. **Server-Side Services** (3 hours)
   - Implement server-side data fetching
   - Add server-side AI generation
   - Create execution state management

4. **Testing & Validation** (1 hour)
   - Test server action execution
   - Validate streaming functionality
   - Test error scenarios and recovery

### Phase 2: Client Integration (Day 2)

#### Tasks
1. **Stream Hook Development** (3 hours)
   - Implement useMacroStream hook
   - Add real-time event handling
   - Implement connection management and reconnection

2. **React Component** (3 hours)
   - Create server macro UI component
   - Add real-time progress visualization
   - Implement connection status display

3. **Error Handling** (1.5 hours)
   - Handle network disconnections
   - Implement automatic reconnection
   - Add user-friendly error messages

4. **Integration Testing** (1.5 hours)
   - Test complete client-server flow
   - Validate real-time updates
   - Test error scenarios and recovery

### Phase 3: Optimization & Resilience (Day 3)

#### Tasks
1. **Performance Optimization** (2.5 hours)
   - Optimize streaming performance
   - Implement connection pooling
   - Bundle size analysis and optimization

2. **Enhanced Resilience** (2.5 hours)
   - Implement advanced retry strategies
   - Add connection quality monitoring
   - Create fallback mechanisms

3. **Security Hardening** (1.5 hours)
   - Add rate limiting for server actions
   - Implement proper input validation
   - Add authentication checks

4. **Documentation & Testing** (1.5 hours)
   - Complete component documentation
   - Comprehensive test coverage
   - Performance benchmarking

---

## Testing Strategy

### Unit Tests

```typescript
// tests/serverActions/macroServerAction.test.ts
describe('Macro Server Action', () => {
  test('should execute all steps successfully', async () => {
    const mockTicker = 'NVDA_STAGING';
    
    const result = await executeMacroAnalysis(mockTicker);
    
    expect(result.success).toBe(true);
    expect(result.executionId).toBeDefined();
  });

  test('should handle step failures with retry', async () => {
    // Mock a failing service
    jest.spyOn(console, 'error').mockImplementation();
    
    // Test retry logic and recovery
    const result = await executeMacroAnalysis('INVALID_TICKER');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should stream updates during execution', async () => {
    const updates: MacroStreamUpdate[] = [];
    
    // Mock streaming function
    jest.mocked(streamUpdate).mockImplementation(async (id, update) => {
      updates.push(update);
    });

    await executeMacroAnalysis('NVDA_STAGING');

    expect(updates.length).toBeGreaterThan(4); // At least one update per step
    expect(updates[0].type).toBe('step_started');
    expect(updates[updates.length - 1].type).toBe('execution_complete');
  });
});
```

### Integration Tests

```typescript
// tests/integration/macroStream.test.tsx
describe('Macro Stream Integration', () => {
  test('should handle complete execution flow', async () => {
    render(<NvdaStagingServerMacro />);
    
    // Start execution
    fireEvent.click(screen.getByText('Start Server Macro'));
    
    // Wait for execution to start
    await waitFor(() => {
      expect(screen.getByText(/executing/i)).toBeInTheDocument();
    });

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
    }, { timeout: 60000 });
  });

  test('should handle connection failures gracefully', async () => {
    // Mock network failure
    global.EventSource = jest.fn().mockImplementation(() => ({
      onerror: jest.fn(),
      close: jest.fn()
    }));

    render(<NvdaStagingServerMacro />);
    
    fireEvent.click(screen.getByText('Start Server Macro'));

    await waitFor(() => {
      expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
    });
  });
});
```

---

## Performance Analysis

### Server-Side Benefits

| Aspect | Client-Side | Server-Side | Improvement |
|--------|-------------|-------------|-------------|
| **Execution Reliability** | Browser dependent | Server guaranteed | 99.9% uptime |
| **Network Resilience** | Manual retry | Automatic recovery | Built-in handling |
| **Resource Utilization** | Limited | Server-class | 5-10x performance |
| **Security** | Client-exposed | Server-protected | Enhanced protection |

### Streaming Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Update Latency** | <100ms | Server to client delivery |
| **Connection Overhead** | <5KB | EventSource connection size |
| **Bandwidth Usage** | <1KB/update | JSON message size |
| **Reconnection Time** | <3s | Auto-reconnection delay |

### Resource Usage

- **Server CPU**: Optimized for parallel processing
- **Memory**: Efficient state management with cleanup
- **Network**: Minimal bandwidth for streaming updates
- **Client**: Reduced JavaScript execution overhead

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Network Connectivity** | High | Medium | Automatic reconnection and state sync |
| **Server Load** | Medium | Low | Horizontal scaling and load balancing |
| **Streaming Latency** | Low | Low | Optimized event delivery and compression |
| **State Synchronization** | Medium | Low | Checksums and state validation |

### Implementation Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Complex Architecture** | High | Medium | Comprehensive documentation and testing |
| **Debugging Difficulty** | Medium | Medium | Enhanced logging and monitoring |
| **Network Dependency** | High | Medium | Fallback mechanisms and offline support |
| **Scalability Concerns** | Medium | Low | Cloud infrastructure and auto-scaling |

---

## Success Criteria

### Primary Success Metrics

1. **Execution Reliability**: Achieve 99.5% success rate for macro execution
2. **Real-time Experience**: <100ms latency for streaming updates
3. **Network Resilience**: Automatic recovery from connection failures
4. **Performance**: Faster execution than client-side equivalent

### Secondary Success Metrics

1. **User Experience**: Seamless real-time progress updates
2. **Error Recovery**: Graceful handling of all failure scenarios
3. **Scalability**: Support multiple concurrent macro executions
4. **Security**: Enhanced protection of sensitive operations

### Validation Criteria

1. **Functional**: All 4 macro steps execute successfully on server
2. **Streaming**: Real-time updates delivered to client
3. **Resilience**: Automatic recovery from network failures
4. **Performance**: Server execution faster than client equivalent

---

## Future Enhancements

### Short Term (1-2 sprints)

1. **Execution History**: Server-side execution log storage
2. **Parallel Execution**: Multiple concurrent macro executions
3. **Advanced Retry**: Smart retry based on error types
4. **Performance Analytics**: Detailed server-side metrics

### Medium Term (3-6 months)

1. **Distributed Processing**: Multi-server macro execution
2. **Real-time Collaboration**: Multi-user macro monitoring
3. **Advanced Caching**: Intelligent result caching strategies
4. **Custom Workflows**: User-defined server-side workflows

### Long Term (6+ months)

1. **AI Optimization**: Machine learning for execution optimization
2. **Global Distribution**: Edge server macro execution
3. **Advanced Analytics**: Predictive performance insights
4. **Enterprise Features**: Multi-tenant execution and monitoring

---

## Conclusion

The Server-Side Orchestration approach provides the highest level of reliability and network resilience among all re-architecture options. By moving execution to the server with real-time streaming, it achieves:

- **Maximum Reliability** through server-side execution guarantees
- **Enhanced User Experience** with real-time progress updates
- **Superior Network Resilience** with automatic retry and recovery
- **Enhanced Security** through server-side operation protection

This implementation is ideal for production environments requiring maximum reliability and sophisticated error recovery capabilities, though it requires the most complex infrastructure setup.

---

**Next Steps**: Consider hybrid approaches and infrastructure requirements.  
**Dependencies**: Requires server infrastructure and streaming capabilities.  
**Recommendation**: Best for high-reliability production environments.