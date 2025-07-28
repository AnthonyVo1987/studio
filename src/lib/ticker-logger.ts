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

export type LogContext = 'UserAction' | 'State' | 'ServerAction' | 'Error' | 'AIFlow' | 'DataFetch' | 'UIUpdate';

export interface TickerLogOptions {
  ticker: string;
  page: string;
  action: string;
  context?: LogContext;
  data?: any;
}

/**
 * Creates a standardized log prefix for ticker-specific operations
 */
function createLogPrefix(options: TickerLogOptions): string {
  const { ticker, page, action, context } = options;
  const contextPart = context ? `:${context}` : '';
  return `[${ticker}:${page}${contextPart}:${action}]`;
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
  
  // Include data if provided
  if (options.data !== undefined) {
    console[level](fullMessage, options.data);
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
  }
};

/**
 * Factory function to create ticker-specific loggers
 * This reduces repetition when logging from a specific ticker/page combination
 */
export function createTickerLogger(ticker: string, page: string) {
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
      tickerLog.uiUpdate(ticker, page, action, message, data)
  };
}

/**
 * Standard page/tab names for consistency
 */
export const TICKER_PAGES = {
  SPY_TAB: 'SPY-Tab',
  NVDA_TAB: 'NVDA-Tab',
  USER_INPUT_TAB: 'UserInput-Tab',
  MAIN_TAB: 'Main-Tab'
} as const;

export type TickerPage = typeof TICKER_PAGES[keyof typeof TICKER_PAGES];