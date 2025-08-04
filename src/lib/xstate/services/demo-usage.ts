/**
 * @fileOverview Macro Services Usage Examples
 * 
 * Demonstrates how to use the XState-compatible macro services in various scenarios,
 * from individual service calls to full workflow orchestration.
 */

import {
  createMacroExecution,
  executeMacroWorkflow,
  serviceFactory,
  defaultOrchestrator,
  createFetchExpirationsService,
  createGetStockDataService,
  createAITakeawaysService,
  createAIOptionsService,
} from './macro-services';
import type {
  MacroServiceOptions,
  MacroServiceResult,
  ExpirationData,
  StockDataResult,
  AITakeawaysResult,
  AIOptionsResult,
} from './service-types';

/**
 * Example 1: Execute individual services
 */
export async function individualServiceExample() {
  console.log('=== Individual Service Usage Example ===');
  
  // Create individual services
  const fetchExpirationsService = createFetchExpirationsService();
  const getStockDataService = createGetStockDataService();
  const aiTakeawaysService = createAITakeawaysService();
  const aiOptionsService = createAIOptionsService();

  const options: MacroServiceOptions = {
    ticker: 'NVDA',
    executionId: 'individual-demo-001',
    timeout: 45000,
    maxRetries: 2,
    enableDebug: true,
  };

  try {
    // Step 1: Fetch Expirations
    console.log('Fetching expiration dates...');
    const expirationsResult = await fetchExpirationsService(options);
    
    if (!expirationsResult.success) {
      console.error('Failed to fetch expirations:', expirationsResult.error?.message);
      return;
    }

    const expirationData = expirationsResult.data as ExpirationData;
    console.log(`Found ${expirationData.availableExpirations.length} expiration dates`);
    console.log(`Selected expiration: ${expirationData.selectedExpiration}`);

    // Step 2: Get Stock Data (with expiration from previous step)
    console.log('\nFetching stock data...');
    const stockDataOptions = {
      ...options,
      macroExpiration: expirationData.selectedExpiration,
    };
    
    const stockDataResult = await getStockDataService(stockDataOptions);
    
    if (!stockDataResult.success) {
      console.error('Failed to fetch stock data:', stockDataResult.error?.message);
      return;
    }

    const stockData = stockDataResult.data as StockDataResult;
    console.log(`Current price: $${stockData.currentPrice}`);
    console.log(`Data source: ${stockData.dataSource}`);

    // Step 3: AI Takeaways (with stock data context)
    console.log('\nGenerating AI takeaways...');
    const aiTakeawaysOptions = {
      ...options,
      stockDataResult,
    } as any;
    
    const aiTakeawaysResult = await aiTakeawaysService(aiTakeawaysOptions);
    
    if (!aiTakeawaysResult.success) {
      console.error('Failed to generate AI takeaways:', aiTakeawaysResult.error?.message);
      return;
    }

    const aiTakeaways = aiTakeawaysResult.data as AITakeawaysResult;
    console.log(`AI takeaways generated in ${aiTakeaways.processingTime}ms`);
    console.log(`Model used: ${aiTakeaways.modelUsed}`);

    // Step 4: AI Options (with all previous context)
    console.log('\nGenerating AI options analysis...');
    const aiOptionsOptions = {
      ...options,
      stockDataResult,
      aiTakeawaysResult,
    } as any;
    
    const aiOptionsResult = await aiOptionsService(aiOptionsOptions);
    
    if (!aiOptionsResult.success) {
      console.error('Failed to generate AI options:', aiOptionsResult.error?.message);
      return;
    }

    const aiOptions = aiOptionsResult.data as AIOptionsResult;
    console.log(`AI options analysis generated in ${aiOptions.processingTime}ms`);
    console.log(`Strategies generated: ${aiOptions.strategiesGenerated}`);

    console.log('\n✅ Individual service example completed successfully!');

  } catch (error) {
    console.error('Individual service example failed:', error);
  }
}

/**
 * Example 2: Execute complete workflow using orchestrator
 */
export async function orchestratedWorkflowExample() {
  console.log('\n=== Orchestrated Workflow Example ===');
  
  try {
    // Create a new macro execution
    const execution = createMacroExecution('SPY', {
      timeout: 45000,
      maxRetries: 2,
      enableDebug: true,
    });

    console.log(`Execution ID: ${execution.executionId}`);
    console.log(`Ticker: ${execution.options.ticker}`);

    // Execute all steps using the orchestrator
    console.log('\nExecuting complete macro workflow...');
    const results = await execution.orchestrator.executeAll(execution.options);

    console.log(`\nWorkflow completed with ${results.length} steps:`);
    
    results.forEach((result, index) => {
      const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
      const duration = `${result.duration}ms`;
      const retries = result.retryCount > 0 ? ` (${result.retryCount} retries)` : '';
      
      console.log(`  Step ${result.stepId}: ${status} - ${duration}${retries}`);
      
      if (!result.success && result.error) {
        console.log(`    Error: ${result.error.message}`);
      }
    });

    // Calculate summary stats
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = Math.round(totalDuration / results.length);

    console.log(`\nSummary: ${successful}/${results.length} successful (${failed} failed)`);
    console.log(`Total duration: ${totalDuration}ms, Average: ${avgDuration}ms`);

  } catch (error) {
    console.error('Orchestrated workflow example failed:', error);
  }
}

/**
 * Example 3: Simplified workflow using convenience function
 */
export async function simplifiedWorkflowExample() {
  console.log('\n=== Simplified Workflow Example ===');
  
  try {
    // Execute complete workflow with single function call
    console.log('Executing simplified macro workflow...');
    
    const workflow = await executeMacroWorkflow('NVDA', {
      timeout: 30000,
      maxRetries: 1,
      enableDebug: true,
    });

    console.log(`\nWorkflow Results:`);
    console.log(`Execution ID: ${workflow.executionId}`);
    console.log(`Overall Success: ${workflow.success ? '✅' : '❌'}`);
    
    console.log('\nSummary:');
    console.log(`  Total Steps: ${workflow.summary.totalSteps}`);
    console.log(`  Successful: ${workflow.summary.successfulSteps}`);
    console.log(`  Failed: ${workflow.summary.failedSteps}`);
    console.log(`  Total Duration: ${workflow.summary.totalDuration}ms`);
    console.log(`  Average Step Duration: ${Math.round(workflow.summary.averageStepDuration)}ms`);

    console.log('\nStep-by-step Results:');
    workflow.results.forEach((result) => {
      const stepName = getStepName(result.stepId);
      const status = result.success ? '✅' : '❌';
      const metrics = result.metrics ? 
        `(network: ${result.metrics.networkLatency || 0}ms)` : '';
      
      console.log(`  ${stepName}: ${status} ${result.duration}ms ${metrics}`);
      
      if (result.metadata?.wasRetried) {
        console.log(`    ↻ Retried ${result.retryCount} times`);
      }
      
      if (result.metadata?.wasTimeout) {
        console.log(`    ⏱ Timed out`);
      }
    });

  } catch (error) {
    console.error('Simplified workflow example failed:', error);
  }
}

/**
 * Example 4: Error handling and retry demonstration
 */
export async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');
  
  try {
    // Execute with very short timeout to demonstrate error handling
    const workflow = await executeMacroWorkflow('NVDA', {
      timeout: 1, // Extremely short timeout to force errors
      maxRetries: 3,
      enableDebug: true,
    });

    console.log('\nError handling results:');
    console.log(`Success: ${workflow.success}`);
    console.log(`Failed steps: ${workflow.summary.failedSteps}`);

    workflow.results.forEach((result) => {
      if (!result.success && result.error) {
        const stepName = getStepName(result.stepId);
        console.log(`\n${stepName} Error Details:`);
        console.log(`  Message: ${result.error.message}`);
        console.log(`  Type: ${(result.error as any).type || 'unknown'}`);
        console.log(`  Retryable: ${(result.error as any).retryable || false}`);
        console.log(`  Retry Count: ${result.retryCount}`);
        
        if (result.metadata) {
          console.log(`  Was Timeout: ${result.metadata.wasTimeout || false}`);
          console.log(`  Was Cancelled: ${result.metadata.wasCancelled || false}`);
          console.log(`  Was Retried: ${result.metadata.wasRetried || false}`);
        }
      }
    });

  } catch (error) {
    console.error('Error handling example failed:', error);
  }
}

/**
 * Example 5: Cancellation demonstration
 */
export async function cancellationExample() {
  console.log('\n=== Cancellation Example ===');
  
  try {
    const execution = createMacroExecution('SPY', {
      timeout: 60000, // Long timeout
      maxRetries: 1,
      enableDebug: true,
    });

    console.log(`Starting execution: ${execution.executionId}`);

    // Cancel after 2 seconds
    setTimeout(() => {
      console.log('Requesting cancellation...');
      execution.orchestrator.cancel(execution.executionId);
    }, 2000);

    const results = await execution.orchestrator.executeAll(execution.options);

    console.log('\nCancellation results:');
    const completed = results.filter(r => r.success).length;
    const cancelled = results.filter(r => 
      !r.success && r.metadata?.wasCancelled
    ).length;

    console.log(`Completed steps: ${completed}`);
    console.log(`Cancelled steps: ${cancelled}`);
    console.log(`Total results: ${results.length}`);

  } catch (error) {
    console.error('Cancellation example failed:', error);
  }
}

/**
 * Utility function to get step name by ID
 */
function getStepName(stepId: number): string {
  const stepNames = {
    1: 'Fetch Expirations',
    2: 'Get Stock Data',
    3: 'AI Takeaways',
    4: 'AI Options',
  };
  return stepNames[stepId as keyof typeof stepNames] || `Step ${stepId}`;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Macro Services Demo Starting...\n');
  
  try {
    await individualServiceExample();
    await orchestratedWorkflowExample();
    await simplifiedWorkflowExample();
    await errorHandlingExample();
    await cancellationExample();
    
    console.log('\n🎉 All examples completed!');
  } catch (error) {
    console.error('\n💥 Demo failed:', error);
  }
}

/**
 * Example service configuration and customization
 */
export function serviceConfigurationExample() {
  console.log('\n=== Service Configuration Example ===');
  
  // Create custom service registry
  const registry = serviceFactory.createServiceRegistry();
  
  // Example of custom service registration
  const customFetchService = createFetchExpirationsService();
  registry.register(1, customFetchService, {
    name: 'CustomFetchExpirationsService',
    description: 'Custom expiration fetching with special timeout',
    defaultTimeout: 60000, // Custom timeout
    defaultRetries: 3,     // Custom retry count
    optional: false,
  });

  console.log('Registered services:');
  const services = registry.list();
  services.forEach(({ stepId, config }) => {
    console.log(`  Step ${stepId}: ${config.name}`);
    console.log(`    Description: ${config.description}`);
    console.log(`    Timeout: ${config.defaultTimeout}ms`);
    console.log(`    Retries: ${config.defaultRetries}`);
    console.log(`    Optional: ${config.optional || false}`);
    console.log('');
  });
}

// Export the demo runner for external usage
export default runAllExamples;

// Example of how to integrate with XState (commented out to avoid dependencies)
/*
import { createMachine, assign } from 'xstate';

export const macroExecutionMachine = createMachine({
  id: 'macroExecution',
  initial: 'idle',
  context: {
    ticker: '',
    executionId: '',
    results: [],
    currentStep: 0,
  },
  states: {
    idle: {
      on: {
        START: {
          target: 'executing',
          actions: assign({
            ticker: ({ event }) => event.ticker,
            executionId: ({ event }) => event.executionId,
          }),
        },
      },
    },
    executing: {
      invoke: {
        src: 'executeMacroWorkflow',
        input: ({ context }) => ({
          ticker: context.ticker,
          executionId: context.executionId,
        }),
        onDone: {
          target: 'completed',
          actions: assign({
            results: ({ event }) => event.output.results,
          }),
        },
        onError: {
          target: 'failed',
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },
    completed: {
      type: 'final',
    },
    failed: {
      on: {
        RETRY: 'executing',
        RESET: 'idle',
      },
    },
  },
}, {
  actors: {
    executeMacroWorkflow: fromPromise(async ({ input }) => {
      return await executeMacroWorkflow(input.ticker, {
        executionId: input.executionId,
        enableDebug: true,
      });
    }),
  },
});
*/