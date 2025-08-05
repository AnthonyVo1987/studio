/**
 * @fileOverview Ticker-Agnostic Logging Utility
 * 
 * Provides standardized console logging across all ticker-specific pages.
 * This ensures consistent log formatting and makes debugging easier by
 * clearly identifying the ticker, page/tab, and action being performed.
 * 
 * Format: [TICKER:Page:Action] message
 * Example: [SPY:SPY-Tab:UserAction:FetchExpirations] Starting expiration fetch...
 * Example: [AAPL:UserInput-Tab:State] FSM transition: -> LOADING
 */

export type LogLevel = 'log' | 'warn' | 'error' | 'debug';

export type LogContext = 'UserAction' | 'State' | 'ServerAction' | 'Error' | 'AIFlow' | 'DataFetch' | 'UIUpdate' | 'MacroExecution' | 'StateValidation' | 'Performance';

export interface TickerLogOptions {
  ticker: string;
  page: string;
  action: string;
  context?: LogContext;
  data?: any;
  executionId?: string;  // For tracking specific macro executions
  timestamp?: number;    // For performance timing
}

/**
 * Creates a standardized log prefix for ticker-specific operations
 */
function createLogPrefix(options: TickerLogOptions): string {
  const { ticker, page, action, context, executionId } = options;
  const contextPart = context ? `:${context}` : '';
  const executionPart = executionId ? `@${executionId}` : '';
  return `[${ticker}:${page}${contextPart}:${action}${executionPart}]`;
}

/**
 * Main logging function for ticker-specific operations
 */
export function logTickerAction(
  options: TickerLogOptions,
  message: string,
  level: LogLevel = 'log'
): void {
  const prefix = createLogPrefix(options);
  const fullMessage = `${prefix} ${message}`;
  
  // Include timestamp if provided
  const timestampInfo = options.timestamp ? { timestamp: new Date(options.timestamp).toISOString() } : {};
  
  // Include data if provided
  if (options.data !== undefined) {
    console[level](fullMessage, { ...timestampInfo, ...options.data });
  } else if (Object.keys(timestampInfo).length > 0) {
    console[level](fullMessage, timestampInfo);
  } else {
    console[level](fullMessage);
  }
}

/**
 * Convenience functions for common logging patterns
 */
export const tickerLog = {
  // User actions (button clicks, form submissions)
  userAction: (ticker: string, page: string, action: string, message: string, data?: any) => {
    logTickerAction({ ticker, page, action, context: 'UserAction', data }, message);
  },
  
  // State transitions and updates
  state: (ticker: string, page: string, action: string, message: string, data?: any) => {
    logTickerAction({ ticker, page, action, context: 'State', data }, message);
  },
  
  // Server action calls
  serverAction: (ticker: string, page: string, action: string, message: string, data?: any) => {
    logTickerAction({ ticker, page, action, context: 'ServerAction', data }, message);
  },
  
  // Error logging
  error: (ticker: string, page: string, action: string, message: string, error?: any) => {
    logTickerAction({ ticker, page, action, context: 'Error', data: error }, message, 'error');
  },
  
  // AI flow operations
  aiFlow: (ticker: string, page: string, action: string, message: string, data?: any) => {
    logTickerAction({ ticker, page, action, context: 'AIFlow', data }, message);
  },
  
  // Data fetching operations
  dataFetch: (ticker: string, page: string, action: string, message: string, data?: any) => {
    logTickerAction({ ticker, page, action, context: 'DataFetch', data }, message);
  },
  
  // UI updates (use sparingly to avoid render loops)
  uiUpdate: (ticker: string, page: string, action: string, message: string, data?: any) => {
    // Only log UI updates in development to avoid potential render loops
    if (process.env.NODE_ENV === 'development') {
      logTickerAction({ ticker, page, action, context: 'UIUpdate', data }, message, 'debug');
    }
  },
  
  // Macro execution tracking
  macroExecution: (ticker: string, page: string, action: string, message: string, data?: any, executionId?: string) => {
    logTickerAction({ ticker, page, action, context: 'MacroExecution', data, executionId }, message);
  },
  
  // State validation logging
  stateValidation: (ticker: string, page: string, action: string, message: string, data?: any, executionId?: string) => {
    logTickerAction({ ticker, page, action, context: 'StateValidation', data, executionId }, message);
  },
  
  // Performance tracking
  performance: (ticker: string, page: string, action: string, message: string, data?: any, executionId?: string) => {
    logTickerAction({ ticker, page, action, context: 'Performance', data, executionId, timestamp: Date.now() }, message);
  },
  
  // Warning for state contamination or other issues
  warn: (ticker: string, page: string, action: string, message: string, data?: any) => {
    logTickerAction({ ticker, page, action, data }, message, 'warn');
  }
};

/**
 * Factory function to create ticker-specific loggers
 * This reduces repetition when logging from a specific ticker/page combination
 */
export function createTickerLogger(ticker: string, page: string, executionId?: string) {
  return {
    userAction: (action: string, message: string, data?: any) => 
      tickerLog.userAction(ticker, page, action, message, data),
    
    state: (action: string, message: string, data?: any) => 
      tickerLog.state(ticker, page, action, message, data),
    
    serverAction: (action: string, message: string, data?: any) => 
      tickerLog.serverAction(ticker, page, action, message, data),
    
    error: (action: string, message: string, error?: any) => 
      tickerLog.error(ticker, page, action, message, error),
    
    aiFlow: (action: string, message: string, data?: any) => 
      tickerLog.aiFlow(ticker, page, action, message, data),
    
    dataFetch: (action: string, message: string, data?: any) => 
      tickerLog.dataFetch(ticker, page, action, message, data),
    
    uiUpdate: (action: string, message: string, data?: any) => 
      tickerLog.uiUpdate(ticker, page, action, message, data),
    
    macroExecution: (action: string, message: string, data?: any) => 
      tickerLog.macroExecution(ticker, page, action, message, data, executionId),
    
    stateValidation: (action: string, message: string, data?: any) => 
      tickerLog.stateValidation(ticker, page, action, message, data, executionId),
    
    performance: (action: string, message: string, data?: any) => 
      tickerLog.performance(ticker, page, action, message, data, executionId),
    
    warn: (action: string, message: string, data?: any) => 
      tickerLog.warn(ticker, page, action, message, data),
    
    // XState-compatible logger methods
    info: (action: string, message: string, data?: any) => 
      logTickerAction({ ticker, page, action, context: 'State', data }, message, 'log'),
    
    debug: (action: string, message: string, data?: any) => 
      logTickerAction({ ticker, page, action, context: 'State', data }, message, 'debug')
  };
}

/**
 * Standard page/tab names for consistency
 */
export const TICKER_PAGES = {
  SPY_TAB: 'SPY-Tab',
  NVDA_TAB: 'NVDA-Tab',
  USER_INPUT_TAB: 'UserInput-Tab',
  MAIN_TAB: 'Main-Tab',
  ADVANCED_UI: 'Advanced-UI'
} as const;

export type TickerPage = typeof TICKER_PAGES[keyof typeof TICKER_PAGES];

/**
 * Helper type for macro execution state tracking
 */
export interface MacroExecutionLogData {
  executionId: string;
  stepId?: number;
  stepName?: string;
  macroExpiration?: string | null;
  uiExpiration?: string;
  contaminated?: boolean;
  recoveryAction?: string;
  stepDuration?: string;
  totalDuration?: string;
  completedSteps?: number;
  totalSteps?: number;
  successRate?: string;
  stepResults?: any;
  anomalies?: string[];
}

/**
 * Helper function to generate execution ID
 */
export function generateExecutionId(prefix: string = 'macro'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper function to create a formatted state validation log
 */
export function createStateValidationLog(
  ticker: string,
  action: string,
  macroExpiration: string | null,
  uiExpiration: string,
  executionId: string
): MacroExecutionLogData {
  const contaminated = macroExpiration !== uiExpiration;
  return {
    executionId,
    macroExpiration,
    uiExpiration,
    contaminated,
    recoveryAction: contaminated ? 'using_macro_state' : 'none_needed',
    anomalies: contaminated ? [`Expiration mismatch: macro=${macroExpiration}, ui=${uiExpiration}`] : undefined
  };
}