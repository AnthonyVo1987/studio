# StockSage Macro Services - XState Compatible Service Layer

This directory contains the complete XState-compatible service layer that wraps existing StockSage macro operations into robust, reusable services with comprehensive error handling, timeout protection, and retry logic.

## Architecture Overview

The service layer transforms the existing 4-step macro automation workflow into XState-compatible Promise-based services:

1. **Fetch Expirations Service** - Retrieves available options expiration dates
2. **Get Stock Data Service** - Fetches real-time stock data and options chains  
3. **AI Takeaways Service** - Generates AI technical analysis
4. **AI Options Service** - Creates AI options strategies and recommendations

## Key Features

### 🛡️ **Robust Error Handling**
- **Timeout Protection**: 45-second default timeout with Promise.race protection
- **Retry Logic**: Exponential backoff retry for network failures (2 retries default)
- **Error Classification**: Categorizes errors as `timeout`, `network`, `api`, `validation`, or `unknown`
- **Comprehensive Logging**: Detailed logging with ticker-specific logger integration

### 🚀 **Performance & Metrics**
- **Performance Tracking**: Start time, end time, network latency, and processing time
- **Execution Metadata**: Retry counts, timeout indicators, cancellation status
- **Service Orchestration**: Sequential execution with dependency management
- **Resource Management**: Proper cleanup and memory management

### 🎯 **XState Integration Ready**
- **Promise-Based Interface**: Direct XState service compatibility
- **Cancellation Support**: AbortController integration for user cancellation
- **State Isolation**: Each execution maintains isolated state context
- **Event-Driven Architecture**: Ready for XState machine integration

### 🔧 **Developer Experience**
- **TypeScript First**: Complete type safety with comprehensive interfaces
- **Flexible Configuration**: Customizable timeouts, retries, and debug settings
- **Service Discovery**: Registry pattern for service management
- **Testing Support**: Comprehensive test utilities and mocks

## Quick Start

### Basic Usage

```typescript
import { executeMacroWorkflow } from '@/lib/xstate/services';

// Execute complete 4-step workflow
const workflow = await executeMacroWorkflow('NVDA', {
  timeout: 45000,
  maxRetries: 2,
  enableDebug: true,
});

console.log(`Success: ${workflow.success}`);
console.log(`Completed ${workflow.summary.successfulSteps}/${workflow.summary.totalSteps} steps`);
```

### Individual Service Usage

```typescript
import { 
  createFetchExpirationsService,
  createGetStockDataService,
  MacroServiceOptions 
} from '@/lib/xstate/services';

const fetchService = createFetchExpirationsService();
const stockService = createGetStockDataService();

const options: MacroServiceOptions = {
  ticker: 'NVDA',
  executionId: 'my-execution-001',
  timeout: 30000,
  maxRetries: 1,
  enableDebug: true,
};

// Execute individual services
const expResult = await fetchService(options);
if (expResult.success) {
  const stockResult = await stockService({
    ...options,
    macroExpiration: expResult.data.selectedExpiration,
  });
}
```

### Orchestrator Usage

```typescript
import { createMacroExecution } from '@/lib/xstate/services';

const execution = createMacroExecution('SPY', {
  timeout: 60000,
  maxRetries: 3,
  enableDebug: true,
});

const results = await execution.orchestrator.executeAll(execution.options);

// Check individual step results
results.forEach((result, index) => {
  console.log(`Step ${result.stepId}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Duration: ${result.duration}ms, Retries: ${result.retryCount}`);
});
```

## Service Interfaces

### MacroServiceOptions
```typescript
interface MacroServiceOptions {
  ticker: string;              // Stock ticker symbol
  executionId: string;         // Unique execution identifier
  timeout?: number;            // Timeout in milliseconds (default: 45000)
  maxRetries?: number;         // Max retry attempts (default: 2)
  enableDebug?: boolean;       // Enable debug logging
  macroExpiration?: string;    // Options expiration date
  cancellationToken?: AbortSignal; // Cancellation support
}
```

### MacroServiceResult
```typescript
interface MacroServiceResult<T = any> {
  success: boolean;            // Operation success status
  data?: T;                   // Result data if successful
  error?: Error;              // Error information if failed
  duration: number;           // Operation duration in ms
  retryCount: number;         // Number of retry attempts used
  stepId: number;            // Service step identifier
  metrics?: PerformanceMetrics; // Performance tracking data
  metadata?: ExecutionMetadata; // Additional execution information
}
```

## Service-Specific Data Types

### ExpirationData (Step 1)
```typescript
interface ExpirationData {
  availableExpirations: string[];  // All available expiration dates
  selectedExpiration: string;      // Default selected expiration
  autoSelected: boolean;           // Whether expiration was auto-selected
  source: 'polygon';              // Data source identifier
}
```

### StockDataResult (Step 2)
```typescript
interface StockDataResult {
  stockSnapshotJson: string;       // Stock snapshot data
  marketStatusJson: string;        // Market status information
  technicalIndicatorsJson: string; // Technical analysis data
  optionsChainJson: string;        // Options chain data
  currentPrice: number;            // Current stock price
  dataSource: 'polygon';           // Data source identifier
  fetchTimestamp: number;          // Data fetch timestamp
}
```

### AITakeawaysResult (Step 3)
```typescript
interface AITakeawaysResult {
  aiKeyTakeawaysJson: string;      // AI analysis JSON response
  promptUsed: string;              // Prompt template used
  processingTime: number;          // AI processing time in ms
  tokenCount?: number;             // Estimated token count
  modelUsed: 'gemini-2.5-flash-lite'; // AI model identifier
}
```

### AIOptionsResult (Step 4)
```typescript
interface AIOptionsResult {
  aiOptionsAnalysisJson: string;   // AI options analysis JSON
  promptUsed: string;              // Prompt template used
  processingTime: number;          // Processing time in ms
  tokenCount?: number;             // Estimated token count
  modelUsed: 'gemini-2.5-flash-lite'; // AI model identifier
  strategiesGenerated: number;     // Number of strategies generated
}
```

## Error Handling

### Error Types
- **`timeout`**: Request exceeded timeout limit
- **`network`**: Network connectivity issues (ENOTFOUND, ECONNRESET)
- **`api`**: API-specific errors (rate limits, quota exceeded)
- **`validation`**: Input validation or data format errors
- **`cancellation`**: User-requested cancellation
- **`unknown`**: Unclassified errors

### Retry Logic
Services automatically retry on `timeout` and `network` errors using exponential backoff:
- 1st retry: Wait 2 seconds
- 2nd retry: Wait 4 seconds  
- 3rd retry: Wait 8 seconds

### Error Recovery Example
```typescript
const result = await service(options);

if (!result.success && result.error) {
  const serviceError = result.error as ServiceError;
  
  console.log(`Error Type: ${serviceError.type}`);
  console.log(`Retryable: ${serviceError.retryable}`);
  console.log(`Retry Count: ${result.retryCount}`);
  
  if (result.metadata?.wasTimeout) {
    console.log('Operation timed out - consider increasing timeout');
  }
  
  if (result.metadata?.wasRetried) {
    console.log('Operation was retried but still failed');
  }
}
```

## Advanced Usage

### Custom Service Registry
```typescript
import { MacroServiceRegistry, createFetchExpirationsService } from '@/lib/xstate/services';

const registry = new MacroServiceRegistry();

// Register custom service with specific configuration
registry.register(1, createFetchExpirationsService(), {
  name: 'CustomExpirationService',
  description: 'Expiration service with extended timeout',
  defaultTimeout: 90000,
  defaultRetries: 5,
  optional: false,
});

// Use custom registry with orchestrator
const orchestrator = new MacroServiceOrchestrator(registry);
```

### Cancellation Support
```typescript
const execution = createMacroExecution('NVDA');
const abortController = new AbortController();

// Cancel execution after 10 seconds
setTimeout(() => {
  execution.orchestrator.cancel(execution.executionId);
  // or use AbortController
  abortController.abort();
}, 10000);

const results = await execution.orchestrator.executeAll({
  ...execution.options,
  cancellationToken: abortController.signal,
});
```

### Performance Monitoring
```typescript
const workflow = await executeMacroWorkflow('NVDA');

console.log('Performance Summary:');
console.log(`Total Duration: ${workflow.summary.totalDuration}ms`);
console.log(`Average Step Duration: ${workflow.summary.averageStepDuration}ms`);
console.log(`Success Rate: ${workflow.summary.successRate}%`);

// Detailed step analysis
workflow.results.forEach(result => {
  if (result.metrics) {
    console.log(`Step ${result.stepId}:`);
    console.log(`  Network Time: ${result.metrics.networkLatency}ms`);
    console.log(`  Process Time: ${result.metrics.processTime}ms`);
  }
});
```

## Integration with Existing StockSage Architecture

### Context Integration
Services integrate seamlessly with existing NVDA/SPY contexts:

```typescript
// In NVDA tab content component
const handleMacroExecution = async () => {
  const workflow = await executeMacroWorkflow('NVDA', {
    enableDebug: true,
  });
  
  if (workflow.success) {
    // Update NVDA context with results
    const stockResult = workflow.results[1].data as StockDataResult;
    nvda.setStockSnapshotJson(stockResult.stockSnapshotJson);
    nvda.setMarketStatusJson(stockResult.marketStatusJson);
    // ... update other context fields
  }
};
```

### Backwards Compatibility
Services maintain complete compatibility with existing macro automation:

- **Same Data Formats**: JSON strings match existing context expectations
- **Same API Endpoints**: Uses existing Polygon adapter and Genkit actions
- **Same Error Patterns**: Preserves existing timeout and retry behavior
- **Same Logging**: Integrates with existing ticker logger system

### Migration Path
Existing macro automation can be gradually migrated:

1. **Phase 1**: Use services alongside existing macro automation
2. **Phase 2**: Replace individual macro steps with service calls
3. **Phase 3**: Full migration to service-based workflow
4. **Phase 4**: Add XState state machine integration

## File Structure

```
src/lib/xstate/services/
├── README.md                          # This documentation
├── index.ts                          # Main export module
├── service-types.ts                  # TypeScript interfaces
├── fetch-expirations-service.ts     # Step 1 service implementation
├── get-stock-data-service.ts         # Step 2 service implementation
├── ai-takeaways-service.ts           # Step 3 service implementation
├── ai-options-service.ts             # Step 4 service implementation
├── macro-services.ts                 # Orchestrator and factory
└── demo-usage.ts                     # Usage examples and demos
```

## Dependencies

### External Dependencies
- `@/services/data-sources/adapters/polygon-adapter` - Stock data fetching
- `@/actions/nvda-consolidated-chat-action` - NVDA AI analysis
- `@/actions/spy-consolidated-chat-action` - SPY AI analysis  
- `@/lib/ticker-logger` - Logging and debugging

### Internal Dependencies
- No circular dependencies
- Self-contained service layer
- Compatible with existing architecture

## Testing

### Running Service Demos
```bash
# In Node.js environment or browser console
npm run dev

# Then in your application:
import { runServiceDemo } from '@/lib/xstate/services';
await runServiceDemo();
```

### Manual Testing Examples
See `demo-usage.ts` for comprehensive examples including:
- Individual service execution
- Full workflow orchestration
- Error handling scenarios
- Cancellation testing
- Performance monitoring

## Performance Benchmarks

Based on typical StockSage macro executions:

| Step | Typical Duration | Timeout | Retry Count |
|------|-----------------|---------|-------------|
| Fetch Expirations | 2-5 seconds | 45s | 2 |
| Get Stock Data | 5-15 seconds | 45s | 2 |
| AI Takeaways | 10-30 seconds | 45s | 2 |
| AI Options | 15-45 seconds | 45s | 2 |
| **Total Workflow** | **30-90 seconds** | **Per-step** | **Per-step** |

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout for complex options data
2. **Network Failures**: Check Polygon API key and connectivity
3. **AI Service Failures**: Verify Gemini API key and quota
4. **Memory Issues**: Monitor service cleanup and garbage collection

### Debug Mode
Enable debug logging for detailed execution tracking:

```typescript
const workflow = await executeMacroWorkflow('NVDA', {
  enableDebug: true, // Enables comprehensive logging
});
```

### Logging Output
Debug mode provides:
- Service start/end timestamps
- Step-by-step execution progress
- Error details with stack traces
- Performance metrics
- Retry attempt logging
- Cancellation tracking

## Contributing

When contributing to the service layer:

1. **Maintain Backwards Compatibility**: Services must work with existing StockSage architecture
2. **Follow Error Patterns**: Use ServiceError interface for consistent error handling
3. **Add Comprehensive Logging**: Include debug logging for troubleshooting
4. **Write Type-Safe Code**: Maintain full TypeScript compatibility
5. **Test Thoroughly**: Verify timeout, retry, and cancellation behavior

## Future Enhancements

Planned improvements for the service layer:

- **XState Machine Integration**: Pre-built state machines for macro workflows
- **Service Composition**: Higher-order services for complex workflows  
- **Caching Layer**: Service result caching for improved performance
- **Health Checks**: Service availability and health monitoring
- **Circuit Breakers**: Automatic failure recovery and service protection
- **Service Metrics**: Detailed performance analytics and monitoring
- **Custom Service Types**: Framework for adding new macro steps