
'use server';

import {
  analyzeStockData,
  type StockAnalysisInput,
  type StockAnalysisOutput,
} from '@/ai/flows/analyze-stock-data';

export interface PerformAiAnalysisResult {
  aiKeyTakeawaysRequestJson: string;
  aiKeyTakeawaysJson: string;
}

export interface PerformAiAnalysisActionState {
  status: 'idle' | 'success' | 'error';
  data?: PerformAiAnalysisResult;
  error?: string | null;
  message?: string | null;
}

interface PerformAiAnalysisActionInputs {
  ticker: string;
  stockSnapshotJson: string;
  standardTasJson: string;
  aiAnalyzedTaJson: string;
  marketStatusJson: string;
}

export async function performAiAnalysisAction(
  payload: PerformAiAnalysisActionInputs
): Promise<PerformAiAnalysisActionState> {
  const {
    ticker,
    stockSnapshotJson,
    standardTasJson,
    aiAnalyzedTaJson,
    marketStatusJson,
  } = payload;
  const actionLogPrefix = `[ServerAction:performAiAnalysisAction:Ticker:${ticker}]`;

  console.log(`${actionLogPrefix} Starting AI key takeaways analysis...`, {
    ticker,
    hasStockSnapshot: !!stockSnapshotJson,
    hasStandardTas: !!standardTasJson,
    hasAiAnalyzedTa: !!aiAnalyzedTaJson,
    hasMarketStatus: !!marketStatusJson
  });

  // Check only for essential data - allow technical analysis to contain errors
  if (!ticker || !stockSnapshotJson || stockSnapshotJson === '{}' ||
      !marketStatusJson || marketStatusJson === '{}') {
    const errorMsg = 'Essential data inputs (ticker, stock snapshot, market status) are missing for AI Key Takeaways analysis.';
    console.error(`${actionLogPrefix} Validation error:`, errorMsg);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Essential prerequisite data not available for AI key takeaways.',
      data: {
        aiKeyTakeawaysRequestJson: JSON.stringify({ error: errorMsg, ticker }, null, 2),
        aiKeyTakeawaysJson: JSON.stringify({ error: errorMsg, details: "Missing essential prerequisite data." }, null, 2),
      },
    };
  }

  // Log warning if technical analysis data is missing or contains errors, but continue processing
  if (!standardTasJson || standardTasJson === '{}') {
    console.warn(`${actionLogPrefix} Warning: Standard technical analysis data is missing or empty`);
  }
  if (!aiAnalyzedTaJson || aiAnalyzedTaJson === '{}') {
    console.warn(`${actionLogPrefix} Warning: AI analyzed technical analysis data is missing or empty`);
  }

  const flowInput: StockAnalysisInput = {
    ticker,
    stockSnapshotJson,
    standardTasJson,
    aiAnalyzedTaJson,
    marketStatusJson,
  };

  console.log(`${actionLogPrefix} Prepared flow input for AI analysis`);
  const aiKeyTakeawaysRequestJson = JSON.stringify(flowInput, null, 2);
  
  try {
    console.log(`${actionLogPrefix} Calling AI flow for key takeaways generation...`);
    
    // Add comprehensive timeout wrapper with retry logic
    const analyzeWithRetry = async (maxRetries = 2) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`${actionLogPrefix} Analysis attempt ${attempt}/${maxRetries}`);
          
          // Create timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`AI analysis timeout after 45 seconds for ${ticker} (attempt ${attempt})`));
            }, 45000);
          });
          
          // Create analysis promise
          const analysisPromise = analyzeStockData(flowInput);
          
          // Race them
          return await Promise.race([analysisPromise, timeoutPromise]);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isTimeoutError = errorMessage.includes('timeout') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNRESET');
          
          console.error(`${actionLogPrefix} Attempt ${attempt} failed:`, {
            errorMessage,
            isTimeoutError,
            attempt,
            maxRetries
          });
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Only retry on timeout/network errors
          if (isTimeoutError) {
            const waitTime = Math.pow(2, attempt) * 1000; // exponential backoff
            console.log(`${actionLogPrefix} Retrying in ${waitTime}ms due to timeout...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            // For non-timeout errors, don't retry
            throw error;
          }
        }
      }
      throw new Error('All retry attempts failed');
    };
    
    const flowOutput: StockAnalysisOutput = await analyzeWithRetry();
    console.log(`${actionLogPrefix} AI flow completed successfully`);

    const aiKeyTakeawaysJson = JSON.stringify(flowOutput, null, 2);

    console.log(`${actionLogPrefix} SUCCESS - AI key takeaways analysis completed`);
    return {
      status: 'success',
      data: {
        aiKeyTakeawaysRequestJson,
        aiKeyTakeawaysJson,
      },
      message: `AI key takeaways for ${ticker} generated successfully.`,
      error: null,
    };
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    const isTimeoutError = errorMessage.includes('timeout') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNRESET');
    
    // Enhanced error logging
    console.error(`${actionLogPrefix} FINAL ERROR:`, {
      errorMessage,
      errorType: error.constructor?.name || typeof error,
      isTimeoutError,
      ticker,
      stackTrace: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Provide user-friendly error messages
    let userMessage = `Failed to generate AI key takeaways for ${ticker}.`;
    if (isTimeoutError) {
      userMessage = `AI analysis timed out for ${ticker}. This can happen with complex options data. Please try again.`;
    } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      userMessage = `API rate limit exceeded for ${ticker}. Please wait a moment and try again.`;
    }
    
    return {
      status: 'error',
      error: errorMessage,
      message: userMessage,
      data: {
        aiKeyTakeawaysRequestJson,
        aiKeyTakeawaysJson: JSON.stringify({ 
          error: errorMessage,
          errorType: isTimeoutError ? 'timeout' : 'analysis_error',
          isRetryable: isTimeoutError,
          ticker,
          timestamp: new Date().toISOString(),
          details: String(error)
        }, null, 2),
      },
    };
  }
}
