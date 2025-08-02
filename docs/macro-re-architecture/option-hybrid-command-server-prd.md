# PRD: Hybrid Option - Command Pattern + Server-Side Orchestration

**Version**: 1.0.0  
**Date**: August 2, 2025  
**Project**: Macro Automation Re-Architecture  
**Option**: Hybrid - Command Pattern with Server-Side Execution  
**Recommendation**: Best of Both Worlds Solution

---

## Executive Summary

### Overview

This PRD defines the implementation of a hybrid approach combining the architectural flexibility of the Command Pattern with the reliability and performance benefits of Server-Side Orchestration, creating the optimal solution for complex macro automation.

### Key Benefits

- **Architectural Flexibility**: Command Pattern's modularity and testability
- **Maximum Reliability**: Server-side execution with guaranteed consistency
- **Real-time Experience**: Live streaming updates with client-side command orchestration
- **Perfect Testability**: Independent command testing with server-side integration
- **Ultimate Scalability**: Distributed command execution across server infrastructure

### Success Metrics

| Metric | Current | Target | Expected Impact |
|--------|---------|--------|----------------|
| **Code Maintainability** | Complex | Excellent | Command-based modularity |
| **Execution Reliability** | 95% | 99.8% | Server-side guarantees |
| **Test Coverage** | Difficult | >98% | Independent command testing |
| **Developer Experience** | Poor | Excellent | Visual debugging + reliability |

---

## Technical Requirements

### Functional Requirements

#### FR-1: Hybrid Command Architecture
- **Client-Side Commands**: Command pattern for orchestration and UI
- **Server-Side Execution**: Actual command execution on server
- **Command Streaming**: Real-time command status via Server-Sent Events
- **Bidirectional Communication**: Command dispatch and cancellation

#### FR-2: Command-Server Integration
- **Command Serialization**: Commands serialized for server transmission
- **Server Command Registry**: Server-side command implementations
- **Result Streaming**: Real-time command results via streaming
- **Error Propagation**: Detailed error information from server to client

#### FR-3: Advanced Orchestration
- **Command Queue Management**: Client-side queue with server execution
- **Parallel Processing**: Server-side parallel command execution
- **Dependency Management**: Command dependencies and prerequisites
- **Dynamic Workflows**: Runtime command modification and reordering

#### FR-4: Comprehensive Monitoring
- **Real-time Visualization**: Command execution visualization
- **Performance Metrics**: Detailed timing and resource usage
- **Error Analytics**: Comprehensive error tracking and analysis
- **Execution History**: Complete command execution audit trail

### Non-Functional Requirements

#### NFR-1: Performance
- **Command Dispatch**: <50ms client to server command transmission
- **Execution Speed**: Server-side optimized command execution
- **Streaming Latency**: <100ms for real-time status updates
- **Resource Efficiency**: Optimal client and server resource utilization

#### NFR-2: Reliability
- **Server Guarantees**: 99.9% server-side execution reliability
- **Network Resilience**: Automatic reconnection and state synchronization
- **Command Isolation**: Individual command failures don't affect others
- **State Consistency**: Perfect synchronization between client and server

#### NFR-3: Scalability
- **Horizontal Scaling**: Multiple server instances for command execution
- **Concurrent Execution**: Multiple command queues executing simultaneously
- **Resource Optimization**: Intelligent command scheduling and resource allocation
- **Load Balancing**: Distributed command execution across server infrastructure

---

## Architecture Design

### Hybrid Command Interface

```typescript
// interfaces/HybridCommand.ts
export interface HybridCommandMetadata {
  id: string;
  name: string;
  description: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  serverImplementation: string;
  dependencies: string[];
  estimatedDuration: number;
}

export interface CommandExecutionContext {
  executionId: string;
  ticker: string;
  startTime: number;
  results: Map<string, any>;
  errors: CommandError[];
  metrics: ExecutionMetrics;
}

export interface ServerCommandRequest {
  commandId: string;
  commandType: string;
  parameters: Record<string, any>;
  context: CommandExecutionContext;
  metadata: HybridCommandMetadata;
}

export interface ServerCommandResponse {
  success: boolean;
  commandId: string;
  result?: any;
  error?: CommandError;
  metrics: {
    executionTime: number;
    serverProcessingTime: number;
    retryCount: number;
    resourceUsage: ResourceMetrics;
  };
}

export abstract class HybridCommand {
  protected metadata: HybridCommandMetadata;
  protected context: CommandExecutionContext;

  constructor(metadata: HybridCommandMetadata, context: CommandExecutionContext) {
    this.metadata = metadata;
    this.context = context;
  }

  // Client-side command preparation
  abstract prepareExecution(): Promise<ServerCommandRequest>;

  // Client-side result processing
  abstract processResult(response: ServerCommandResponse): Promise<void>;

  // Client-side validation
  abstract validatePrerequisites(): Promise<boolean>;

  // Server execution happens via API call
  async executeOnServer(): Promise<ServerCommandResponse> {
    const request = await this.prepareExecution();
    
    const response = await fetch('/api/command-execution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Server execution failed: ${response.statusText}`);
    }

    return await response.json();
  }

  getId(): string { return this.metadata.id; }
  getName(): string { return this.metadata.name; }
  getDescription(): string { return this.metadata.description; }
  getDependencies(): string[] { return this.metadata.dependencies; }
}
```

### Command Implementations

```typescript
// commands/hybrid/FetchExpirationsHybridCommand.ts
export class FetchExpirationsHybridCommand extends HybridCommand {
  constructor(context: CommandExecutionContext) {
    super({
      id: 'fetch-expirations',
      name: 'Fetch Option Expirations',
      description: 'Retrieve available option expiration dates from server',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 2000,
      serverImplementation: 'fetchExpirationsServerImpl',
      dependencies: [],
      estimatedDuration: 5000
    }, context);
  }

  async validatePrerequisites(): Promise<boolean> {
    // Client-side validation
    return !!this.context.ticker && this.context.ticker.length > 0;
  }

  async prepareExecution(): Promise<ServerCommandRequest> {
    return {
      commandId: this.metadata.id,
      commandType: 'fetch-expirations',
      parameters: {
        ticker: this.context.ticker
      },
      context: this.context,
      metadata: this.metadata
    };
  }

  async processResult(response: ServerCommandResponse): Promise<void> {
    if (response.success && response.result) {
      // Update client-side context with server results
      this.context.results.set('expirations', response.result);
      this.context.results.set('selectedExpiration', response.result.selectedExpiration);
      
      // Emit client-side events for UI updates
      this.emitCommandEvent('expirations-updated', response.result);
    } else {
      throw new Error(`Fetch expirations failed: ${response.error?.message}`);
    }
  }

  private emitCommandEvent(type: string, data: any) {
    window.dispatchEvent(new CustomEvent('hybrid-command-event', {
      detail: { type, commandId: this.metadata.id, data }
    }));
  }
}

// commands/hybrid/GetStockDataHybridCommand.ts
export class GetStockDataHybridCommand extends HybridCommand {
  constructor(context: CommandExecutionContext) {
    super({
      id: 'get-stock-data',
      name: 'Get Stock Data',
      description: 'Retrieve comprehensive stock data and technical analysis',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 2000,
      serverImplementation: 'getStockDataServerImpl',
      dependencies: ['fetch-expirations'],
      estimatedDuration: 8000
    }, context);
  }

  async validatePrerequisites(): Promise<boolean> {
    const expirations = this.context.results.get('expirations');
    const selectedExpiration = this.context.results.get('selectedExpiration');
    
    return !!(expirations && selectedExpiration);
  }

  async prepareExecution(): Promise<ServerCommandRequest> {
    const selectedExpiration = this.context.results.get('selectedExpiration');
    
    return {
      commandId: this.metadata.id,
      commandType: 'get-stock-data',
      parameters: {
        ticker: this.context.ticker,
        expiration: selectedExpiration
      },
      context: this.context,
      metadata: this.metadata
    };
  }

  async processResult(response: ServerCommandResponse): Promise<void> {
    if (response.success && response.result) {
      this.context.results.set('stockData', response.result);
      this.emitCommandEvent('stock-data-updated', response.result);
    } else {
      throw new Error(`Get stock data failed: ${response.error?.message}`);
    }
  }

  private emitCommandEvent(type: string, data: any) {
    window.dispatchEvent(new CustomEvent('hybrid-command-event', {
      detail: { type, commandId: this.metadata.id, data }
    }));
  }
}

// Additional command implementations for AI operations...
```

### Server-Side Command Registry

```typescript
// api/command-execution/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface ServerCommandImplementation {
  execute(request: ServerCommandRequest): Promise<ServerCommandResponse>;
}

class FetchExpirationsServerImpl implements ServerCommandImplementation {
  async execute(request: ServerCommandRequest): Promise<ServerCommandResponse> {
    const startTime = Date.now();
    
    try {
      // Server-side expiration fetching with full error handling
      const response = await fetch(`https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${request.parameters.ticker}&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${process.env.POLYGON_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.statusText}`);
      }

      const data = await response.json();
      const expirations = extractUniqueExpirations(data.results);
      
      const result = {
        selectedExpiration: expirations[0],
        availableExpirations: expirations,
        timestamp: Date.now(),
        sourceData: data.results.length
      };

      // Stream progress update
      await streamCommandUpdate(request.context.executionId, {
        commandId: request.commandId,
        type: 'command_completed',
        progress: 100,
        message: `Found ${expirations.length} expiration dates`,
        data: result,
        timestamp: Date.now()
      });

      return {
        success: true,
        commandId: request.commandId,
        result,
        metrics: {
          executionTime: Date.now() - startTime,
          serverProcessingTime: Date.now() - startTime,
          retryCount: 0,
          resourceUsage: {
            memoryUsed: process.memoryUsage().heapUsed,
            cpuTime: process.cpuUsage().user
          }
        }
      };

    } catch (error) {
      await streamCommandUpdate(request.context.executionId, {
        commandId: request.commandId,
        type: 'command_failed',
        message: `Expiration fetch failed: ${error.message}`,
        error: error.message,
        timestamp: Date.now()
      });

      return {
        success: false,
        commandId: request.commandId,
        error: {
          message: error.message,
          code: 'FETCH_EXPIRATIONS_FAILED',
          timestamp: Date.now()
        },
        metrics: {
          executionTime: Date.now() - startTime,
          serverProcessingTime: Date.now() - startTime,
          retryCount: 0,
          resourceUsage: {
            memoryUsed: process.memoryUsage().heapUsed,
            cpuTime: process.cpuUsage().user
          }
        }
      };
    }
  }
}

class GetStockDataServerImpl implements ServerCommandImplementation {
  async execute(request: ServerCommandRequest): Promise<ServerCommandResponse> {
    const startTime = Date.now();
    
    try {
      // Stream progress updates during execution
      await streamCommandUpdate(request.context.executionId, {
        commandId: request.commandId,
        type: 'command_progress',
        progress: 25,
        message: 'Fetching stock snapshot...',
        timestamp: Date.now()
      });

      // Parallel data fetching on server
      const [stockSnapshot, marketStatus, technicalAnalysis] = await Promise.all([
        fetchStockSnapshotServer(request.parameters.ticker),
        fetchMarketStatusServer(request.parameters.ticker),
        fetchTechnicalAnalysisServer(request.parameters.ticker)
      ]);

      await streamCommandUpdate(request.context.executionId, {
        commandId: request.commandId,
        type: 'command_progress',
        progress: 75,
        message: 'Processing technical analysis...',
        timestamp: Date.now()
      });

      const result = {
        stockSnapshot,
        marketStatus,
        technicalAnalysis,
        expiration: request.parameters.expiration,
        timestamp: Date.now()
      };

      await streamCommandUpdate(request.context.executionId, {
        commandId: request.commandId,
        type: 'command_completed',
        progress: 100,
        message: 'Stock data retrieval completed',
        data: result,
        timestamp: Date.now()
      });

      return {
        success: true,
        commandId: request.commandId,
        result,
        metrics: {
          executionTime: Date.now() - startTime,
          serverProcessingTime: Date.now() - startTime,
          retryCount: 0,
          resourceUsage: {
            memoryUsed: process.memoryUsage().heapUsed,
            cpuTime: process.cpuUsage().user
          }
        }
      };

    } catch (error) {
      await streamCommandUpdate(request.context.executionId, {
        commandId: request.commandId,
        type: 'command_failed',
        message: `Stock data fetch failed: ${error.message}`,
        error: error.message,
        timestamp: Date.now()
      });

      return {
        success: false,
        commandId: request.commandId,
        error: {
          message: error.message,
          code: 'GET_STOCK_DATA_FAILED',
          timestamp: Date.now()
        },
        metrics: {
          executionTime: Date.now() - startTime,
          serverProcessingTime: Date.now() - startTime,
          retryCount: 0,
          resourceUsage: {
            memoryUsed: process.memoryUsage().heapUsed,
            cpuTime: process.cpuUsage().user
          }
        }
      };
    }
  }
}

// Server command registry
const commandRegistry = new Map<string, ServerCommandImplementation>([
  ['fetch-expirations', new FetchExpirationsServerImpl()],
  ['get-stock-data', new GetStockDataServerImpl()],
  ['generate-ai-takeaways', new GenerateAiTakeawaysServerImpl()],
  ['generate-ai-options', new GenerateAiOptionsServerImpl()]
]);

export async function POST(request: NextRequest) {
  try {
    const commandRequest: ServerCommandRequest = await request.json();
    
    const implementation = commandRegistry.get(commandRequest.commandType);
    if (!implementation) {
      return NextResponse.json({
        success: false,
        commandId: commandRequest.commandId,
        error: {
          message: `Unknown command type: ${commandRequest.commandType}`,
          code: 'UNKNOWN_COMMAND_TYPE',
          timestamp: Date.now()
        }
      }, { status: 400 });
    }

    // Execute command on server
    const response = await implementation.execute(commandRequest);
    
    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: 'SERVER_EXECUTION_ERROR',
        timestamp: Date.now()
      }
    }, { status: 500 });
  }
}
```

### Hybrid Command Queue

```typescript
// queue/HybridCommandQueue.ts
export class HybridCommandQueue extends EventEmitter {
  private commands: HybridCommand[] = [];
  private isExecuting = false;
  private currentCommandIndex = 0;
  private context: CommandExecutionContext;
  private streamConnection: EventSource | null = null;

  constructor(context: CommandExecutionContext) {
    super();
    this.context = context;
  }

  addCommand(command: HybridCommand): void {
    if (this.isExecuting) {
      throw new Error('Cannot modify queue while executing');
    }
    this.commands.push(command);
  }

  async execute(): Promise<void> {
    if (this.isExecuting) {
      throw new Error('Queue is already executing');
    }

    this.isExecuting = true;
    this.currentCommandIndex = 0;

    // Connect to server streaming
    await this.connectToServerStream();

    this.emit('execution_started', {
      executionId: this.context.executionId,
      totalCommands: this.commands.length,
      timestamp: Date.now()
    });

    try {
      // Build dependency graph
      const dependencyGraph = this.buildDependencyGraph();
      
      // Execute commands according to dependencies
      await this.executeWithDependencies(dependencyGraph);

      this.emit('execution_completed', {
        executionId: this.context.executionId,
        timestamp: Date.now()
      });

    } catch (error) {
      this.emit('execution_failed', {
        executionId: this.context.executionId,
        error: error.message,
        timestamp: Date.now()
      });
      throw error;
    } finally {
      this.isExecuting = false;
      this.disconnectFromServerStream();
    }
  }

  private async connectToServerStream(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.streamConnection = new EventSource(`/api/command-stream?executionId=${this.context.executionId}`);

      this.streamConnection.onopen = () => {
        resolve();
      };

      this.streamConnection.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          this.handleServerStreamUpdate(update);
        } catch (error) {
          console.error('Failed to parse server stream update:', error);
        }
      };

      this.streamConnection.onerror = (error) => {
        console.error('Server stream error:', error);
        // Attempt reconnection
        setTimeout(() => {
          if (this.isExecuting) {
            this.connectToServerStream();
          }
        }, 3000);
      };

      // Timeout for connection
      setTimeout(() => {
        if (this.streamConnection?.readyState !== EventSource.OPEN) {
          reject(new Error('Failed to connect to server stream'));
        }
      }, 5000);
    });
  }

  private handleServerStreamUpdate(update: any): void {
    this.emit('server_update', update);

    // Handle different update types
    switch (update.type) {
      case 'command_progress':
        this.emit('command_progress', {
          commandId: update.commandId,
          progress: update.progress,
          message: update.message
        });
        break;

      case 'command_completed':
        this.emit('command_completed', {
          commandId: update.commandId,
          data: update.data
        });
        break;

      case 'command_failed':
        this.emit('command_failed', {
          commandId: update.commandId,
          error: update.error
        });
        break;
    }
  }

  private buildDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const command of this.commands) {
      graph.set(command.getId(), command.getDependencies());
    }
    
    return graph;
  }

  private async executeWithDependencies(dependencyGraph: Map<string, string[]>): Promise<void> {
    const completed = new Set<string>();
    const executing = new Set<string>();

    while (completed.size < this.commands.length) {
      // Find commands ready to execute
      const readyCommands = this.commands.filter(command => {
        const commandId = command.getId();
        const dependencies = dependencyGraph.get(commandId) || [];
        
        return !completed.has(commandId) && 
               !executing.has(commandId) && 
               dependencies.every(dep => completed.has(dep));
      });

      if (readyCommands.length === 0) {
        throw new Error('Circular dependency detected in command graph');
      }

      // Execute ready commands in parallel
      const executionPromises = readyCommands.map(async command => {
        const commandId = command.getId();
        executing.add(commandId);

        this.emit('command_started', {
          commandId,
          commandName: command.getName(),
          timestamp: Date.now()
        });

        try {
          // Validate prerequisites
          const prerequisitesMet = await command.validatePrerequisites();
          if (!prerequisitesMet) {
            throw new Error(`Prerequisites not met for command: ${command.getName()}`);
          }

          // Execute on server
          const response = await command.executeOnServer();
          
          if (response.success) {
            // Process result on client
            await command.processResult(response);
            
            this.emit('command_completed', {
              commandId,
              result: response.result,
              metrics: response.metrics,
              timestamp: Date.now()
            });
          } else {
            throw new Error(response.error?.message || 'Command execution failed');
          }

        } catch (error) {
          this.emit('command_failed', {
            commandId,
            error: error.message,
            timestamp: Date.now()
          });
          throw error;
        } finally {
          executing.delete(commandId);
          completed.add(commandId);
        }
      });

      // Wait for all parallel commands to complete
      await Promise.all(executionPromises);
    }
  }

  private disconnectFromServerStream(): void {
    if (this.streamConnection) {
      this.streamConnection.close();
      this.streamConnection = null;
    }
  }
}
```

### React Integration

```typescript
// hooks/useHybridCommandQueue.ts
export function useHybridCommandQueue(ticker: string) {
  const [state, setState] = useState<HybridQueueState>({
    status: 'idle',
    executionId: null,
    currentCommands: [],
    completedCommands: [],
    failedCommands: [],
    totalCommands: 0,
    progress: 0,
    messages: [],
    metrics: null
  });

  const queueRef = useRef<HybridCommandQueue>();
  const contextRef = useRef<CommandExecutionContext>();

  useEffect(() => {
    // Initialize execution context
    const context: CommandExecutionContext = {
      executionId: `hybrid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticker,
      startTime: Date.now(),
      results: new Map(),
      errors: [],
      metrics: {
        commandTimes: [],
        totalDuration: 0,
        serverProcessingTime: 0,
        networkLatency: 0
      }
    };

    contextRef.current = context;

    // Create hybrid command queue
    const queue = new HybridCommandQueue(context);

    // Add standard commands
    queue.addCommands([
      new FetchExpirationsHybridCommand(context),
      new GetStockDataHybridCommand(context),
      new GenerateAiTakeawaysHybridCommand(context),
      new GenerateAiOptionsHybridCommand(context)
    ]);

    // Event listeners
    queue.on('execution_started', (event) => {
      setState(prev => ({
        ...prev,
        status: 'executing',
        executionId: event.executionId,
        totalCommands: event.totalCommands,
        currentCommands: [],
        completedCommands: [],
        failedCommands: [],
        progress: 0
      }));
    });

    queue.on('command_started', (event) => {
      setState(prev => ({
        ...prev,
        currentCommands: [...prev.currentCommands, event.commandId],
        messages: [...prev.messages, {
          type: 'info',
          message: `Starting ${event.commandName}...`,
          timestamp: event.timestamp
        }]
      }));
    });

    queue.on('command_progress', (event) => {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          type: 'progress',
          message: event.message,
          commandId: event.commandId,
          progress: event.progress,
          timestamp: Date.now()
        }]
      }));
    });

    queue.on('command_completed', (event) => {
      setState(prev => ({
        ...prev,
        currentCommands: prev.currentCommands.filter(id => id !== event.commandId),
        completedCommands: [...prev.completedCommands, event.commandId],
        progress: ((prev.completedCommands.length + 1) / prev.totalCommands) * 100,
        messages: [...prev.messages, {
          type: 'success',
          message: `Completed ${event.commandId}`,
          timestamp: event.timestamp
        }]
      }));
    });

    queue.on('command_failed', (event) => {
      setState(prev => ({
        ...prev,
        currentCommands: prev.currentCommands.filter(id => id !== event.commandId),
        failedCommands: [...prev.failedCommands, event.commandId],
        messages: [...prev.messages, {
          type: 'error',
          message: `Failed ${event.commandId}: ${event.error}`,
          timestamp: event.timestamp
        }]
      }));
    });

    queue.on('execution_completed', (event) => {
      setState(prev => ({
        ...prev,
        status: 'completed',
        progress: 100
      }));
    });

    queue.on('execution_failed', (event) => {
      setState(prev => ({
        ...prev,
        status: 'error'
      }));
    });

    queueRef.current = queue;

    return () => {
      queue.removeAllListeners();
    };
  }, [ticker]);

  const execute = useCallback(async () => {
    if (!queueRef.current) return;

    try {
      await queueRef.current.execute();
    } catch (error) {
      console.error('Hybrid command queue execution failed:', error);
    }
  }, []);

  return {
    state,
    execute,
    getContext: () => contextRef.current
  };
}
```

### React Component

```typescript
// components/staging/nvda-staging-hybrid-macro.tsx
export function NvdaStagingHybridMacro() {
  const { state, execute } = useHybridCommandQueue('NVDA_STAGING');

  return (
    <Card className="border-indigo-200 bg-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-indigo-600" />
          Hybrid Command + Server Macro
        </CardTitle>
        <CardDescription>
          Command pattern flexibility with server-side reliability
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Status display */}
        <div className="mb-4 flex items-center justify-between">
          <Badge variant={
            state.status === 'executing' ? 'secondary' :
            state.status === 'completed' ? 'default' :
            state.status === 'error' ? 'destructive' : 'outline'
          }>
            {state.status}
          </Badge>

          {state.executionId && (
            <span className="text-xs text-muted-foreground font-mono">
              {state.executionId}
            </span>
          )}
        </div>

        {/* Progress visualization */}
        {state.status === 'executing' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>
                Commands: {state.completedCommands.length}/{state.totalCommands}
              </span>
              <span>{Math.round(state.progress)}%</span>
            </div>
            <Progress value={state.progress} />
            
            {/* Currently executing commands */}
            {state.currentCommands.length > 0 && (
              <div className="mt-2 text-sm text-indigo-700">
                Executing: {state.currentCommands.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Real-time messages */}
        {state.messages.length > 0 && (
          <div className="mb-4 max-h-32 overflow-y-auto space-y-1">
            {state.messages.slice(-6).map((message, index) => (
              <div key={index} className={`text-xs p-2 rounded flex justify-between items-start ${
                message.type === 'error' ? 'bg-red-100 text-red-700' :
                message.type === 'success' ? 'bg-green-100 text-green-700' :
                message.type === 'progress' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                <div className="flex-1">
                  {message.message}
                  {message.progress && (
                    <div className="w-16 h-1 bg-white bg-opacity-50 rounded mt-1">
                      <div 
                        className="h-full bg-current rounded"
                        style={{ width: `${message.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-xs opacity-70 ml-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Command execution summary */}
        {(state.completedCommands.length > 0 || state.failedCommands.length > 0) && (
          <div className="mb-4 p-3 bg-indigo-100 border border-indigo-200 rounded">
            <div className="font-medium text-indigo-800 mb-1">Execution Summary</div>
            <div className="text-sm text-indigo-700">
              ✅ Completed: {state.completedCommands.length}
              {state.failedCommands.length > 0 && (
                <span className="text-red-700 ml-3">
                  ❌ Failed: {state.failedCommands.length}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {state.status === 'idle' || state.status === 'completed' || state.status === 'error' ? (
            <Button onClick={execute} className="flex-1">
              {state.status === 'completed' ? 'Run Again' : 'Execute Hybrid Macro'}
            </Button>
          ) : (
            <Button variant="destructive" className="flex-1" disabled>
              Executing...
            </Button>
          )}
        </div>

        {/* Architecture benefits */}
        <div className="mt-4 p-3 bg-indigo-100 border border-indigo-200 rounded">
          <div className="text-sm font-medium text-indigo-800 mb-1">
            Hybrid Architecture Benefits:
          </div>
          <ul className="text-xs text-indigo-700 space-y-1">
            <li>• Command Pattern: Flexible, testable architecture</li>
            <li>• Server Execution: Maximum reliability & performance</li>
            <li>• Real-time Streaming: Live progress updates</li>
            <li>• Parallel Processing: Commands execute concurrently when possible</li>
          </ul>
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
                progress: state.progress,
                currentCommands: state.currentCommands,
                completedCommands: state.completedCommands,
                failedCommands: state.failedCommands,
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

### Phase 1: Hybrid Infrastructure (Day 1)

#### Tasks
1. **Command Interface Design** (3 hours)
   - Create hybrid command base class
   - Design server-client communication protocol
   - Implement command serialization/deserialization

2. **Server Command Registry** (3 hours)
   - Implement server-side command implementations
   - Create command execution API endpoint
   - Add server-side error handling and metrics

3. **Streaming Integration** (2 hours)
   - Implement command progress streaming
   - Add bidirectional communication patterns
   - Create connection management utilities

### Phase 2: Command Implementations (Day 2)

#### Tasks
1. **Hybrid Command Development** (4 hours)
   - Implement all 4 hybrid commands
   - Add client-side validation and processing
   - Create server-side execution logic

2. **Queue Management** (2.5 hours)
   - Create hybrid command queue with dependency management
   - Implement parallel execution capabilities
   - Add streaming integration

3. **Error Handling** (1.5 hours)
   - Comprehensive error propagation
   - Network failure recovery
   - Command-level isolation

### Phase 3: React Integration & Testing (Day 3)

#### Tasks
1. **React Integration** (3 hours)
   - Implement useHybridCommandQueue hook
   - Create hybrid macro component
   - Add real-time visualization

2. **Advanced Features** (2.5 hours)
   - Dependency management UI
   - Parallel execution visualization
   - Performance metrics display

3. **Testing & Optimization** (2.5 hours)
   - Comprehensive testing suite
   - Performance optimization
   - Documentation completion

---

## Success Criteria

### Primary Success Metrics

1. **Architectural Quality**: Perfect separation of concerns with command pattern
2. **Execution Reliability**: 99.8% success rate with server-side execution
3. **Real-time Experience**: Live updates with <100ms latency
4. **Test Coverage**: >98% with independent command testing

### Secondary Success Metrics

1. **Performance**: Optimal resource utilization on client and server
2. **Scalability**: Support for complex workflows and parallel execution
3. **Developer Experience**: Superior debugging and monitoring capabilities
4. **Maintainability**: Clear architecture with extensible command system

---

## Conclusion

The Hybrid Command + Server-Side approach represents the ultimate evolution of macro automation architecture, combining:

- **Architectural Excellence** of the Command Pattern
- **Reliability Guarantees** of Server-Side Execution
- **Real-time Experience** of streaming updates
- **Perfect Testability** through command isolation

This implementation provides the optimal solution for enterprise-grade macro automation requiring both flexibility and reliability.

---

**Next Steps**: Evaluate implementation complexity vs. benefits.  
**Dependencies**: Requires both client and server infrastructure.  
**Recommendation**: Best for enterprise applications requiring maximum capability.