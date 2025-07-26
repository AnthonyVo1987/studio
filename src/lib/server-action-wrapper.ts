import { z } from 'zod';

interface ActionOptions<TInput, TOutput> {
  name: string;
  inputSchema?: z.ZodSchema<TInput>;
  outputSchema?: z.ZodSchema<TOutput>;
  requireAuth?: boolean;
  rateLimitKey?: string;
}

interface ActionResult<T> {
  status: 'idle' | 'success' | 'error';
  data?: T;
  error?: string | null;
  message?: string | null;
}

export const createServerAction = <TInput = any, TOutput = any>(
  options: ActionOptions<TInput, TOutput>
) => {
  return (handler: (input: TInput) => Promise<TOutput>) => {
    return async (input: TInput): Promise<ActionResult<TOutput>> => {
      const startTime = Date.now();
      const actionId = `${options.name}-${startTime}`;
      const actionLogPrefix = `[ServerAction:${options.name}]`;
      
      try {

        // Input validation
        if (options.inputSchema) {
          const validation = options.inputSchema.safeParse(input);
          if (!validation.success) {
            const errorMsg = 'Invalid input parameters';
            return {
              status: 'error',
              error: errorMsg,
              message: 'Input validation failed',
              data: undefined
            };
          }
          input = validation.data;
        }


        // Execute handler
        const result = await handler(input);

        // Output validation
        if (options.outputSchema) {
          const validation = options.outputSchema.safeParse(result);
          if (!validation.success) {
            return {
              status: 'error',
              error: 'Invalid response format',
              message: 'Output validation failed',
              data: undefined
            };
          }
        }

        const duration = Date.now() - startTime;

        return {
          status: 'success',
          data: result,
          error: null,
          message: 'Operation completed successfully'
        };

      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
        
          actionId, 
          duration,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        });

        return {
          status: 'error',
          error: errorMessage,
          message: 'Server action failed',
          data: undefined
        };
      }
    };
  };
};

// Specialized wrapper for StockSage actions
export const createStockAnalysisAction = <TInput, TOutput>(
  name: string,
  inputSchema?: z.ZodSchema<TInput>,
  outputSchema?: z.ZodSchema<TOutput>
) => createServerAction<TInput, TOutput>({
  name: `stock-analysis-${name}`,
  inputSchema,
  outputSchema,
  requireAuth: false, // StockSage doesn't require auth
});

// Utility function for safe JSON stringification (used in many actions)
export const safeJsonStringify = (obj: any, name: string, actionPrefix: string): string => {
  if (obj === undefined || obj === null) {
    return '{}';
  }
  
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e: any) {
    const errorMsg = `Failed to stringify ${name}`;
    return JSON.stringify({ error: errorMsg, details: e.message }, null, 2);
  }
};

// Input validation helpers for common StockSage patterns
export const validateTicker = (ticker: any, actionPrefix: string): string | null => {
  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    const errorMsg = 'Ticker symbol is required and must be a non-empty string';
    return errorMsg;
  }
  return null;
};

export const validateRequiredJsonInputs = (inputs: Record<string, string>, actionPrefix: string): string | null => {
  const missingInputs = Object.entries(inputs)
    .filter(([key, value]) => !value || value === '{}')
    .map(([key]) => key);
  
  if (missingInputs.length > 0) {
    const errorMsg = `Required data inputs are missing or empty: ${missingInputs.join(', ')}`;
    return errorMsg;
  }
  return null;
};