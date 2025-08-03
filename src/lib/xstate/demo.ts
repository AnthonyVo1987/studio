/**
 * XState Macro System Demo
 * 
 * Simple demonstration script to verify the XState implementation works
 */

import { createMacroExecutionMachine, initializeXStateMacroSystem } from './index';
import { createActor } from 'xstate';

// Initialize the system
console.log('='.repeat(50));
console.log('XState Macro Automation System Demo');
console.log('='.repeat(50));

const systemInfo = initializeXStateMacroSystem();
console.log('System Info:', systemInfo);

// Create a simple machine and actor
const machine = createMacroExecutionMachine('DEMO', { debugMode: true });
const actor = createActor(machine, {
  input: { ticker: 'DEMO', debugMode: true }
});

console.log('\n📦 Created macro execution machine for DEMO ticker');

// Test basic state transitions
console.log('\n🔄 Testing state transitions...');

// Subscribe to state changes
actor.subscribe((state) => {
  console.log(`State: ${String(state.value)} | Context: ${JSON.stringify({
    ticker: state.context.ticker,
    currentStep: state.context.currentStep,
    completedSteps: state.context.completedSteps
  })}`);
});

// Start the actor
actor.start();
console.log('✅ Actor started');

// Trigger execution
actor.send({ type: 'START_EXECUTION', ticker: 'DEMO', debugMode: true });
console.log('✅ Execution started');

// Select expiration
setTimeout(() => {
  actor.send({ type: 'EXPIRATION_SELECTED', expiration: '2024-01-19' });
  console.log('✅ Expiration selected');
}, 100);

// Simulate step completion
setTimeout(() => {
  actor.send({
    type: 'STEP_COMPLETED',
    stepId: 1,
    result: {
      stepId: 1,
      stepName: 'Demo Step 1',
      status: 'success',
      data: { demo: 'data' },
      duration: 1000,
      startTime: Date.now() - 1000,
      endTime: Date.now(),
      retryCount: 0
    }
  });
  console.log('✅ Step 1 completed');
}, 200);

// Clean up after demo
setTimeout(() => {
  actor.stop();
  console.log('\n✅ Demo completed successfully');
  console.log('='.repeat(50));
}, 300);