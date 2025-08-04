/**
 * @fileOverview Server action to bridge the frontend agentic chat components
 * with the Genkit agentic orchestrator flow.
 */

'use server';

import { z } from 'zod';
import {
  agenticChatOrchestratorFlow,
  AgenticChatInputSchema,
  type AgenticChatInput,
} from '@/ai/flows/agentic-chat-orchestrator';

// Define the state for the useActionState hook in the frontend component.
// This allows for structured data passing, including success and error states.
export interface AgenticChatState {
  status: 'idle' | 'success' | 'error';
  data?: {
    response: string;
  };
  error?: string;
  message?: string;
}

// The main server action function.
export async function agenticChatAction(
  prevState: AgenticChatState,
  payload: AgenticChatInput
): Promise<AgenticChatState> {
  const logPrefix = `[AgenticAction:${payload.ticker}]`;
  console.log(`${logPrefix} Received request with user input: "${payload.userInput}"`);

  // 1. Validate the input payload against the Zod schema.
  const validationResult = AgenticChatInputSchema.safeParse(payload);
  if (!validationResult.success) {
    const errorMessage = 'Invalid input parameters.';
    console.error(`${logPrefix} Validation failed:`, validationResult.error.flatten());
    return {
      status: 'error',
      error: errorMessage,
      message: 'There was an issue with the data sent to the server. Please try again.',
    };
  }

  try {
    // 2. Invoke the Genkit agentic orchestrator flow with the validated payload.
    console.log(`${logPrefix} Invoking agenticChatOrchestratorFlow...`);
    const flowResult = await agenticChatOrchestratorFlow.run(validationResult.data);

    // 3. On success, return the response from the flow.
    console.log(`${logPrefix} Flow executed successfully.`);
    return {
      status: 'success',
      data: {
        response: flowResult.response,
      },
    };

  } catch (error) {
    // 4. On failure, catch the error, log it, and return a structured error state.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during the agentic flow.';
    console.error(`${logPrefix} Error executing flow:`, error);

    // Provide a user-friendly message.
    let userMessage = 'Failed to generate a response. Please try again.';
    if (errorMessage.includes('timeout')) {
        userMessage = 'The request timed out. This can happen with complex queries. Please try again.';
    } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        userMessage = 'The system is currently busy. Please wait a moment and try again.';
    }

    return {
      status: 'error',
      error: errorMessage,
      message: userMessage,
    };
  }
}
