# PRD: Option 3 - Command Pattern Implementation

**Version**: 1.0.0  
**Date**: August 2, 2025  
**Project**: Macro Automation Re-Architecture  
**Option**: 3 - Command Pattern with Queue Management  
**Recommendation**: Future Expansion Option

---

## Executive Summary

### Overview

This PRD defines the implementation of a command pattern approach for macro automation, providing complete separation of concerns between UI, execution logic, and business operations through a flexible command queue architecture.

### Key Benefits

- **Complete Separation of Concerns**: UI, execution, and business logic are fully decoupled
- **Excellent Testability**: Commands can be unit tested independently
- **Flexible Execution Control**: Easy to reorder, skip, or modify command sequences
- **Observable Operations**: Real-time status updates via event-driven architecture
- **Extensible Design**: Simple to add new commands and execution patterns

### Success Metrics

| Metric | Current | Target | Expected Impact |
|--------|---------|--------|----------------|
| **Component Coupling** | High | Zero | Complete decoupling |
| **Test Coverage** | Difficult | >95% | Independent command testing |
| **Execution Flexibility** | Fixed | Dynamic | Runtime command modification |
| **Code Maintainability** | Complex | High | Clear separation patterns |

---

## Technical Requirements

### Functional Requirements

#### FR-1: Command Interface
- **Base Command Class**: Abstract command with execute() method
- **Command Types**: FetchExpirations, GetStockData, GenerateAI commands
- **Retry Logic**: Built-in exponential backoff for each command
- **Result Aggregation**: Command results stored in execution context

#### FR-2: Command Queue Management
- **Queue Operations**: Add, remove, reorder commands
- **Execution Control**: Start, pause, resume, cancel operations
- **Progress Tracking**: Real-time status updates via events
- **Error Handling**: Command-level error isolation and recovery

#### FR-3: Event-Driven Communication
- **Event Emitter**: Command queue publishes execution events
- **Event Types**: started, stepStarted, stepCompleted, stepFailed, completed, cancelled
- **React Integration**: Custom hooks for event subscription
- **Status Updates**: Real-time UI updates based on events

#### FR-4: Context Management
- **Execution Context**: Shared state between commands
- **Result Storage**: Aggregated command results
- **Metadata Tracking**: Timing, retry counts, error history
- **Context Isolation**: Separate context per execution

### Non-Functional Requirements

#### NFR-1: Performance
- **Execution Overhead**: <10ms per command dispatch
- **Memory Usage**: Efficient command queue management
- **Event Performance**: Non-blocking event emission
- **Bundle Size**: Minimal additional overhead

#### NFR-2: Reliability
- **Command Isolation**: Failures isolated to individual commands
- **Retry Mechanisms**: Configurable retry logic per command
- **Error Recovery**: Graceful handling of command failures
- **Execution Consistency**: Reliable command execution order

#### NFR-3: Extensibility
- **Plugin Architecture**: Easy addition of new command types
- **Configuration**: Runtime command configuration
- **Custom Workflows**: User-defined command sequences
- **Integration Points**: External system integration capabilities

---

## Architecture Design

### Command Interface Definition

```typescript
// interfaces/Command.ts
export interface CommandResult {
  success: boolean;
  data?: any;
  error?: Error;
  executionTime: number;
  retryCount: number;
}

export interface CommandMetadata {
  id: string;
  name: string;
  description: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export abstract class MacroCommand {
  protected metadata: CommandMetadata;
  protected context: MacroExecutionContext;

  constructor(metadata: CommandMetadata, context: MacroExecutionContext) {
    this.metadata = metadata;
    this.context = context;
  }

  abstract execute(): Promise<any>;

  async executeWithRetry(): Promise<CommandResult> {
    const startTime = Date.now();
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.metadata.maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout: ${this.metadata.name}`)), this.metadata.timeout);
        });

        const result = await Promise.race([
          this.execute(),
          timeoutPromise
        ]);

        return {
          success: true,
          data: result,
          executionTime: Date.now() - startTime,
          retryCount: attempt - 1
        };

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.metadata.maxRetries) {
          const delay = this.metadata.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: lastError,
      executionTime: Date.now() - startTime,
      retryCount: this.metadata.maxRetries
    };
  }

  getId(): string { return this.metadata.id; }
  getName(): string { return this.metadata.name; }
  getDescription(): string { return this.metadata.description; }
}
```

### Command Implementations

```typescript
// commands/FetchExpirationsCommand.ts
export class FetchExpirationsCommand extends MacroCommand {
  constructor(context: MacroExecutionContext, private handler: () => Promise<void>) {
    super({
      id: 'fetch-expirations',
      name: 'Fetch Option Expirations',
      description: 'Retrieve available option expiration dates',
      timeout: 45000,
      maxRetries: 3,
      retryDelay: 2000
    }, context);
  }

  async execute(): Promise<ExpirationResult> {
    // Execute the handler
    await this.handler();
    
    // Extract results from context
    const selectedExpiration = await this.context.getCurrentExpiration();
    const availableExpirations = await this.context.getAvailableExpirations();
    
    if (!selectedExpiration) {
      throw new Error('No expiration date was selected');
    }

    const result = {
      selectedExpiration,
      availableExpirations,
      timestamp: Date.now()
    };

    // Update context with results
    this.context.setExpirationResult(result);
    
    return result;
  }
}

// commands/GetStockDataCommand.ts
export class GetStockDataCommand extends MacroCommand {
  constructor(context: MacroExecutionContext, private handler: (expiration: string) => Promise<void>) {
    super({
      id: 'get-stock-data',
      name: 'Get Stock Data',
      description: 'Retrieve stock snapshot and technical analysis',
      timeout: 45000,
      maxRetries: 3,
      retryDelay: 2000
    }, context);
  }

  async execute(): Promise<StockDataResult> {
    const expiration = this.context.getSelectedExpiration();
    
    if (!expiration) {
      throw new Error('No expiration date available for stock data fetch');
    }

    // Execute the handler
    await this.handler(expiration);
    
    // Extract results from context
    const stockSnapshot = await this.context.getStockSnapshot();
    const marketStatus = await this.context.getMarketStatus();
    const technicalAnalysis = await this.context.getTechnicalAnalysis();
    
    const result = {
      stockSnapshot,
      marketStatus,
      technicalAnalysis,
      expiration,
      timestamp: Date.now()
    };

    // Update context with results
    this.context.setStockDataResult(result);
    
    return result;
  }
}

// commands/GenerateAiTakeawaysCommand.ts
export class GenerateAiTakeawaysCommand extends MacroCommand {
  constructor(context: MacroExecutionContext, private handler: () => Promise<void>) {
    super({
      id: 'generate-ai-takeaways',
      name: 'Generate AI Key Takeaways',
      description: 'Generate AI-powered analysis of stock data',
      timeout: 45000,
      maxRetries: 2,
      retryDelay: 3000
    }, context);
  }

  async execute(): Promise<AiTakeawaysResult> {
    // Validate prerequisites
    if (!this.context.hasStockData()) {
      throw new Error('Stock data must be available before generating AI takeaways');
    }

    // Execute the handler
    await this.handler();
    
    // Extract results from context
    const takeaways = await this.context.getAiTakeaways();
    
    if (!takeaways) {
      throw new Error('AI takeaways generation failed');
    }

    const result = {
      takeaways,
      timestamp: Date.now()
    };

    // Update context with results
    this.context.setAiTakeawaysResult(result);
    
    return result;
  }
}

// commands/GenerateAiOptionsCommand.ts
export class GenerateAiOptionsCommand extends MacroCommand {
  constructor(context: MacroExecutionContext, private handler: () => Promise<void>) {
    super({
      id: 'generate-ai-options',
      name: 'Generate AI Options Analysis',
      description: 'Generate AI-powered options trading analysis',
      timeout: 45000,
      maxRetries: 2,
      retryDelay: 3000
    }, context);
  }

  async execute(): Promise<AiOptionsResult> {
    // Validate prerequisites
    if (!this.context.hasAiTakeaways()) {
      throw new Error('AI takeaways must be available before generating options analysis');
    }

    // Execute the handler
    await this.handler();
    
    // Extract results from context
    const optionsAnalysis = await this.context.getAiOptionsAnalysis();
    
    if (!optionsAnalysis) {
      throw new Error('AI options analysis generation failed');
    }

    const result = {
      optionsAnalysis,
      timestamp: Date.now()
    };

    // Update context with results
    this.context.setAiOptionsResult(result);
    
    return result;
  }
}
```

### Command Queue Management

```typescript
// queue/MacroCommandQueue.ts
export interface QueueEvent {
  type: 'started' | 'stepStarted' | 'stepCompleted' | 'stepFailed' | 'completed' | 'cancelled' | 'paused' | 'resumed';
  command?: MacroCommand;
  commandIndex?: number;
  result?: CommandResult;
  error?: Error;
  timestamp: number;
}

export class MacroCommandQueue extends EventEmitter {
  private commands: MacroCommand[] = [];
  private isExecuting = false;
  private isPaused = false;
  private currentCommandIndex = 0;
  private context: MacroExecutionContext;
  private executionId: string;

  constructor(context: MacroExecutionContext) {
    super();
    this.context = context;
    this.executionId = `command_queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addCommand(command: MacroCommand): void {
    if (this.isExecuting) {
      throw new Error('Cannot modify queue while executing');
    }
    this.commands.push(command);
  }

  addCommands(commands: MacroCommand[]): void {
    if (this.isExecuting) {
      throw new Error('Cannot modify queue while executing');
    }
    this.commands.push(...commands);
  }

  removeCommand(commandId: string): boolean {
    if (this.isExecuting) {
      throw new Error('Cannot modify queue while executing');
    }
    
    const index = this.commands.findIndex(cmd => cmd.getId() === commandId);
    if (index !== -1) {
      this.commands.splice(index, 1);
      return true;
    }
    return false;
  }

  reorderCommands(commandIds: string[]): void {
    if (this.isExecuting) {
      throw new Error('Cannot modify queue while executing');
    }

    const reorderedCommands: MacroCommand[] = [];
    
    for (const id of commandIds) {
      const command = this.commands.find(cmd => cmd.getId() === id);
      if (command) {
        reorderedCommands.push(command);
      }
    }

    if (reorderedCommands.length !== this.commands.length) {
      throw new Error('Invalid command reordering: missing commands');
    }

    this.commands = reorderedCommands;
  }

  async execute(): Promise<void> {
    if (this.isExecuting) {
      throw new Error('Queue is already executing');
    }

    if (this.commands.length === 0) {
      throw new Error('No commands to execute');
    }

    this.isExecuting = true;
    this.isPaused = false;
    this.currentCommandIndex = 0;

    this.emit('started', {
      type: 'started',
      timestamp: Date.now()
    });

    try {
      for (let i = this.currentCommandIndex; i < this.commands.length; i++) {
        // Check for pause
        while (this.isPaused && this.isExecuting) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Check for cancellation
        if (!this.isExecuting) {
          break;
        }

        const command = this.commands[i];
        this.currentCommandIndex = i;

        this.emit('stepStarted', {
          type: 'stepStarted',
          command,
          commandIndex: i,
          timestamp: Date.now()
        });

        try {
          const result = await command.executeWithRetry();

          if (result.success) {
            this.emit('stepCompleted', {
              type: 'stepCompleted',
              command,
              commandIndex: i,
              result,
              timestamp: Date.now()
            });
          } else {
            this.emit('stepFailed', {
              type: 'stepFailed',
              command,
              commandIndex: i,
              result,
              error: result.error,
              timestamp: Date.now()
            });

            // Stop execution on command failure
            throw result.error;
          }

        } catch (error) {
          this.emit('stepFailed', {
            type: 'stepFailed',
            command,
            commandIndex: i,
            error: error as Error,
            timestamp: Date.now()
          });

          throw error;
        }
      }

      // All commands completed successfully
      this.emit('completed', {
        type: 'completed',
        timestamp: Date.now()
      });

    } catch (error) {
      // Execution failed
      throw error;
    } finally {
      this.isExecuting = false;
      this.isPaused = false;
    }
  }

  pause(): void {
    if (!this.isExecuting) {
      throw new Error('Queue is not executing');
    }

    this.isPaused = true;
    this.emit('paused', {
      type: 'paused',
      timestamp: Date.now()
    });
  }

  resume(): void {
    if (!this.isExecuting || !this.isPaused) {
      throw new Error('Queue is not paused');
    }

    this.isPaused = false;
    this.emit('resumed', {
      type: 'resumed',
      timestamp: Date.now()
    });
  }

  cancel(): void {
    if (!this.isExecuting) {
      return;
    }

    this.isExecuting = false;
    this.isPaused = false;

    this.emit('cancelled', {
      type: 'cancelled',
      timestamp: Date.now()
    });
  }

  getStatus(): {
    isExecuting: boolean;
    isPaused: boolean;
    currentCommandIndex: number;
    totalCommands: number;
    progress: number;
  } {
    return {
      isExecuting: this.isExecuting,
      isPaused: this.isPaused,
      currentCommandIndex: this.currentCommandIndex,
      totalCommands: this.commands.length,
      progress: this.commands.length > 0 ? (this.currentCommandIndex / this.commands.length) * 100 : 0
    };
  }

  getCommands(): readonly MacroCommand[] {
    return [...this.commands];
  }

  getExecutionId(): string {
    return this.executionId;
  }
}
```

### React Integration Hook

```typescript
// hooks/useCommandQueue.ts
export function useCommandQueue(
  ticker: string,
  handlers: {
    onFetchExpirations: () => Promise<void>;
    onGetStockData: (expiration: string) => Promise<void>;
    onGenerateAiTakeaways: () => Promise<void>;
    onGenerateAiOptions: () => Promise<void>;
  }
) {
  const [status, setStatus] = useState<'idle' | 'executing' | 'paused' | 'completed' | 'error' | 'cancelled'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [executionHistory, setExecutionHistory] = useState<QueueEvent[]>([]);
  const [executionMetrics, setExecutionMetrics] = useState<ExecutionMetrics | null>(null);

  const queueRef = useRef<MacroCommandQueue>();
  const contextRef = useRef<MacroExecutionContext>();

  useEffect(() => {
    // Initialize execution context
    const context = new MacroExecutionContext(ticker);
    contextRef.current = context;

    // Create command queue
    const queue = new MacroCommandQueue(context);

    // Add standard macro commands
    queue.addCommands([
      new FetchExpirationsCommand(context, handlers.onFetchExpirations),
      new GetStockDataCommand(context, handlers.onGetStockData),
      new GenerateAiTakeawaysCommand(context, handlers.onGenerateAiTakeaways),
      new GenerateAiOptionsCommand(context, handlers.onGenerateAiOptions)
    ]);

    setTotalSteps(queue.getCommands().length);

    // Event listeners
    const handleStarted = (event: QueueEvent) => {
      setStatus('executing');
      setCurrentStep(0);
      setError(null);
      setExecutionHistory([event]);
      setExecutionMetrics({ startTime: event.timestamp, endTime: null, totalDuration: 0 });
    };

    const handleStepStarted = (event: QueueEvent) => {
      setCurrentStep(event.commandIndex! + 1);
      setExecutionHistory(prev => [...prev, event]);
    };

    const handleStepCompleted = (event: QueueEvent) => {
      setExecutionHistory(prev => [...prev, event]);
    };

    const handleStepFailed = (event: QueueEvent) => {
      setStatus('error');
      setError(event.error!);
      setExecutionHistory(prev => [...prev, event]);
    };

    const handleCompleted = (event: QueueEvent) => {
      setStatus('completed');
      setExecutionHistory(prev => [...prev, event]);
      setExecutionMetrics(prev => prev ? {
        ...prev,
        endTime: event.timestamp,
        totalDuration: event.timestamp - prev.startTime
      } : null);
    };

    const handleCancelled = (event: QueueEvent) => {
      setStatus('cancelled');
      setExecutionHistory(prev => [...prev, event]);
    };

    const handlePaused = (event: QueueEvent) => {
      setStatus('paused');
      setExecutionHistory(prev => [...prev, event]);
    };

    const handleResumed = (event: QueueEvent) => {
      setStatus('executing');
      setExecutionHistory(prev => [...prev, event]);
    };

    queue.on('started', handleStarted);
    queue.on('stepStarted', handleStepStarted);
    queue.on('stepCompleted', handleStepCompleted);
    queue.on('stepFailed', handleStepFailed);
    queue.on('completed', handleCompleted);
    queue.on('cancelled', handleCancelled);
    queue.on('paused', handlePaused);
    queue.on('resumed', handleResumed);

    queueRef.current = queue;

    // Cleanup
    return () => {
      queue.removeAllListeners();
      queue.cancel();
    };
  }, [handlers, ticker]);

  const execute = useCallback(async () => {
    if (!queueRef.current) return;

    try {
      await queueRef.current.execute();
    } catch (error) {
      console.error('Command queue execution failed:', error);
    }
  }, []);

  const pause = useCallback(() => {
    queueRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    queueRef.current?.resume();
  }, []);

  const cancel = useCallback(() => {
    queueRef.current?.cancel();
  }, []);

  const addCustomCommand = useCallback((command: MacroCommand) => {
    if (status === 'executing') {
      throw new Error('Cannot add commands while executing');
    }
    queueRef.current?.addCommand(command);
    setTotalSteps(prev => prev + 1);
  }, [status]);

  const removeCommand = useCallback((commandId: string) => {
    if (status === 'executing') {
      throw new Error('Cannot remove commands while executing');
    }
    const removed = queueRef.current?.removeCommand(commandId);
    if (removed) {
      setTotalSteps(prev => prev - 1);
    }
    return removed;
  }, [status]);

  const reorderCommands = useCallback((commandIds: string[]) => {
    if (status === 'executing') {
      throw new Error('Cannot reorder commands while executing');
    }
    queueRef.current?.reorderCommands(commandIds);
  }, [status]);

  return {
    // State
    status,
    currentStep,
    totalSteps,
    error,
    executionHistory,
    executionMetrics,
    progress: totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0,

    // Actions
    execute,
    pause,
    resume,
    cancel,

    // Queue management
    addCustomCommand,
    removeCommand,
    reorderCommands,
    getCommands: () => queueRef.current?.getCommands() || [],
    getContext: () => contextRef.current
  };
}
```

### React Component Implementation

```typescript
// components/staging/nvda-staging-command-macro.tsx
export function NvdaStagingCommandMacro() {
  const staging = useNvdaStagingAnalysis();
  const stagingDispatch = useNvdaStagingDispatch();

  const handlers = useMemo(() => ({
    onFetchExpirations: async () => {
      await handleStagingFetchExpirations();
    },
    onGetStockData: async (expiration: string) => {
      await handleStagingGetStockData(expiration);
    },
    onGenerateAiTakeaways: async () => {
      await handleStagingAiTakeaways();
    },
    onGenerateAiOptions: async () => {
      await handleStagingAiOptions();
    }
  }), []);

  const {
    status,
    currentStep,
    totalSteps,
    error,
    progress,
    execute,
    pause,
    resume,
    cancel,
    executionHistory,
    executionMetrics
  } = useCommandQueue('NVDA_STAGING', handlers);

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Command className="h-5 w-5 text-purple-600" />
          Command Pattern Macro Automation
        </CardTitle>
        <CardDescription>
          Decoupled command execution with flexible control
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Status display */}
        <div className="mb-4">
          <Badge variant={
            status === 'executing' ? 'secondary' :
            status === 'completed' ? 'default' :
            status === 'error' ? 'destructive' :
            status === 'paused' ? 'outline' : 'outline'
          }>
            Status: {status}
          </Badge>

          {status === 'executing' && (
            <div className="mt-2">
              <div className="text-sm text-muted-foreground mb-1">
                Step {currentStep} of {totalSteps}
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded">
            <div className="font-medium text-red-800 mb-1">Execution Error:</div>
            <div className="text-sm text-red-700">{error.message}</div>
          </div>
        )}

        {/* Execution metrics */}
        {executionMetrics && status === 'completed' && (
          <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded">
            <div className="font-medium text-green-800 mb-2">Execution Complete</div>
            <div className="text-sm text-green-700">
              Total Time: {Math.round(executionMetrics.totalDuration / 1000)}s
            </div>
            <div className="text-sm text-green-700">
              Commands: {totalSteps}/{totalSteps}
            </div>
          </div>
        )}

        {/* Command history */}
        {executionHistory.length > 0 && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm font-medium text-purple-700">
              Execution History ({executionHistory.length} events)
            </summary>
            <div className="mt-2 max-h-32 overflow-y-auto">
              {executionHistory.map((event, index) => (
                <div key={index} className="text-xs text-muted-foreground border-l-2 border-purple-200 pl-2 py-1">
                  <span className="font-medium">{event.type}</span>
                  {event.command && <span> - {event.command.getName()}</span>}
                  <span className="ml-2 text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {status === 'idle' || status === 'completed' || status === 'error' || status === 'cancelled' ? (
            <Button onClick={execute} className="flex-1">
              {status === 'completed' ? 'Run Again' : 'Execute Commands'}
            </Button>
          ) : status === 'executing' ? (
            <>
              <Button onClick={pause} variant="outline" className="flex-1">
                Pause
              </Button>
              <Button onClick={cancel} variant="destructive" className="flex-1">
                Cancel
              </Button>
            </>
          ) : status === 'paused' ? (
            <>
              <Button onClick={resume} className="flex-1">
                Resume
              </Button>
              <Button onClick={cancel} variant="destructive" className="flex-1">
                Cancel
              </Button>
            </>
          ) : null}
        </div>

        {/* Development debug info */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Debug Information
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify({ 
                status, 
                currentStep, 
                totalSteps, 
                progress, 
                executionMetrics 
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

### Phase 1: Command Infrastructure (Day 1)

#### Tasks
1. **Command Interface Design** (2 hours)
   - Create base command class and interfaces
   - Define command result and metadata structures
   - Implement retry logic with exponential backoff

2. **Command Implementations** (4 hours)
   - Implement FetchExpirationsCommand
   - Implement GetStockDataCommand
   - Implement GenerateAiTakeawaysCommand
   - Implement GenerateAiOptionsCommand

3. **Queue Management** (3 hours)
   - Create MacroCommandQueue class
   - Implement event emission system
   - Add queue control methods (pause, resume, cancel)

4. **Testing Infrastructure** (1 hour)
   - Set up unit tests for commands
   - Create mock execution context
   - Test basic command execution

### Phase 2: React Integration (Day 2)

#### Tasks
1. **Custom Hook Development** (3 hours)
   - Implement useCommandQueue hook
   - Add event subscription and state management
   - Integrate with staging context

2. **React Component** (3 hours)
   - Create command macro UI component
   - Implement progress visualization
   - Add control buttons and status display

3. **Event Handling** (1.5 hours)
   - Handle all queue events in React
   - Update UI state based on events
   - Implement error display and recovery

4. **Integration Testing** (1.5 hours)
   - Test component with staging context
   - Validate event flow and UI updates
   - Test error scenarios and recovery

### Phase 3: Advanced Features (Day 3)

#### Tasks
1. **Queue Management UI** (2.5 hours)
   - Add command reordering interface
   - Implement command addition/removal
   - Create execution history display

2. **Performance Optimization** (2 hours)
   - Optimize event handling performance
   - Minimize unnecessary re-renders
   - Bundle size analysis and optimization

3. **Error Handling Enhancement** (1.5 hours)
   - Implement comprehensive error recovery
   - Add user-friendly error messages
   - Create error reporting and debugging

4. **Documentation & Testing** (2 hours)
   - Complete component documentation
   - Comprehensive test coverage
   - Performance benchmarking

---

## Testing Strategy

### Unit Tests

```typescript
// tests/commands/FetchExpirationsCommand.test.ts
describe('FetchExpirationsCommand', () => {
  let command: FetchExpirationsCommand;
  let mockContext: jest.Mocked<MacroExecutionContext>;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    mockContext = createMockContext();
    mockHandler = jest.fn().mockResolvedValue(undefined);
    command = new FetchExpirationsCommand(mockContext, mockHandler);
  });

  test('should execute successfully with valid data', async () => {
    mockContext.getCurrentExpiration.mockResolvedValue('2025-08-08');
    mockContext.getAvailableExpirations.mockResolvedValue(['2025-08-08', '2025-09-19']);

    const result = await command.executeWithRetry();

    expect(result.success).toBe(true);
    expect(result.data.selectedExpiration).toBe('2025-08-08');
    expect(mockHandler).toHaveBeenCalledOnce();
  });

  test('should retry on failure', async () => {
    mockHandler
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);
    
    mockContext.getCurrentExpiration.mockResolvedValue('2025-08-08');

    const result = await command.executeWithRetry();

    expect(result.success).toBe(true);
    expect(result.retryCount).toBe(1);
    expect(mockHandler).toHaveBeenCalledTimes(2);
  });

  test('should fail after max retries', async () => {
    mockHandler.mockRejectedValue(new Error('Persistent error'));

    const result = await command.executeWithRetry();

    expect(result.success).toBe(false);
    expect(result.retryCount).toBe(3);
    expect(mockHandler).toHaveBeenCalledTimes(3);
  });
});
```

### Integration Tests

```typescript
// tests/integration/CommandQueue.test.ts
describe('MacroCommandQueue Integration', () => {
  let queue: MacroCommandQueue;
  let mockContext: jest.Mocked<MacroExecutionContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    queue = new MacroCommandQueue(mockContext);
  });

  test('should execute all commands in sequence', async () => {
    const commands = [
      new MockCommand('cmd1', () => Promise.resolve('result1')),
      new MockCommand('cmd2', () => Promise.resolve('result2')),
      new MockCommand('cmd3', () => Promise.resolve('result3'))
    ];

    queue.addCommands(commands);

    const events: QueueEvent[] = [];
    queue.on('stepCompleted', (event) => events.push(event));

    await queue.execute();

    expect(events).toHaveLength(3);
    expect(events[0].result?.data).toBe('result1');
    expect(events[1].result?.data).toBe('result2');
    expect(events[2].result?.data).toBe('result3');
  });

  test('should handle command failure and stop execution', async () => {
    const commands = [
      new MockCommand('cmd1', () => Promise.resolve('result1')),
      new MockCommand('cmd2', () => Promise.reject(new Error('Command failed'))),
      new MockCommand('cmd3', () => Promise.resolve('result3'))
    ];

    queue.addCommands(commands);

    const failedEvents: QueueEvent[] = [];
    queue.on('stepFailed', (event) => failedEvents.push(event));

    await expect(queue.execute()).rejects.toThrow('Command failed');

    expect(failedEvents).toHaveLength(1);
    expect(failedEvents[0].command?.getId()).toBe('cmd2');
  });
});
```

---

## Performance Analysis

### Bundle Size Impact

| Component | Size | Justification |
|-----------|------|---------------|
| **Command Classes** | 15KB | Command implementations and interfaces |
| **Queue Management** | 12KB | Event emitter and queue control logic |
| **React Integration** | 8KB | Custom hooks and component logic |
| **Context Management** | 5KB | Execution context and utilities |
| **Total** | **40KB** | 16% increase for complete architectural redesign |

### Performance Benefits

| Metric | Current | Command Pattern | Improvement |
|--------|---------|----------------|-------------|
| **Testability** | Difficult | Excellent | Independent command testing |
| **Flexibility** | Fixed sequence | Dynamic | Runtime command modification |
| **Error Isolation** | Component-wide | Command-level | Granular error handling |
| **Execution Control** | Limited | Full | Pause, resume, reorder capabilities |

### Memory Usage

- **Command Instances**: Minimal memory per command
- **Event History**: Configurable retention policy
- **Queue State**: Lightweight execution tracking
- **Context Management**: Shared context between commands

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Complex Architecture** | Medium | Medium | Comprehensive documentation and examples |
| **Event Performance** | Low | Low | Efficient event emission and handling |
| **Memory Leaks** | Medium | Low | Proper cleanup and event listener management |
| **Queue State Corruption** | High | Very Low | Immutable state patterns and validation |

### Implementation Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Over-Engineering** | Medium | Medium | Focus on core use cases first |
| **Learning Curve** | Medium | High | Training and documentation |
| **Integration Complexity** | High | Medium | Comprehensive testing and validation |
| **Performance Overhead** | Low | Low | Performance monitoring and optimization |

---

## Success Criteria

### Primary Success Metrics

1. **Separation of Concerns**: Complete decoupling of UI, execution, and business logic
2. **Test Coverage**: >95% test coverage for all commands and queue logic
3. **Execution Flexibility**: Ability to modify command sequences at runtime
4. **Error Isolation**: Command failures don't affect other commands

### Secondary Success Metrics

1. **Performance**: No significant overhead compared to current implementation
2. **Developer Experience**: Intuitive command creation and queue management
3. **Extensibility**: Easy addition of new commands and execution patterns
4. **Maintainability**: Clear code structure and comprehensive documentation

### Validation Criteria

1. **Functional**: All 4 macro steps execute successfully via commands
2. **Flexibility**: Demonstrate command reordering and selective execution
3. **Recovery**: Graceful handling of individual command failures
4. **Integration**: Seamless integration with staging context and UI

---

## Future Enhancements

### Short Term (1-2 sprints)

1. **Command Persistence**: Save and restore command queues
2. **Batch Operations**: Execute multiple queues in parallel
3. **Custom Commands**: User-defined command creation
4. **Queue Templates**: Predefined command sequences

### Medium Term (3-6 months)

1. **Visual Queue Editor**: Drag-and-drop command composition
2. **Conditional Execution**: Command execution based on conditions
3. **External Integrations**: Commands for external system integration
4. **Performance Analytics**: Detailed command execution analytics

### Long Term (6+ months)

1. **Command Marketplace**: Shareable command library
2. **Machine Learning**: Predictive command optimization
3. **Distributed Execution**: Multi-node command execution
4. **Real-time Collaboration**: Multi-user command queue editing

---

## Conclusion

The Command Pattern approach provides the highest level of architectural flexibility and testability among all re-architecture options. By completely decoupling execution logic from UI concerns, it enables:

- **Perfect Testability** through independent command units
- **Maximum Flexibility** with runtime command modification
- **Excellent Error Isolation** with granular failure handling
- **Superior Extensibility** for future enhancements

This implementation is ideal for scenarios requiring complex workflow customization and enterprise-level flexibility, though it comes with higher initial complexity compared to simpler alternatives.

---

**Next Steps**: Evaluate against simpler options and user requirements.  
**Dependencies**: Requires completed staging page infrastructure.  
**Recommendation**: Best for complex workflows and enterprise scenarios.