/**
 * Simplified logging utility for StockSage application
 * Reduces verbose console.log statements while maintaining functionality
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogConfig {
  level: LogLevel
  enabledInProduction: boolean
}

const DEFAULT_CONFIG: LogConfig = {
  level: 'info',
  enabledInProduction: false
}

/**
 * Centralized logger with different levels
 * Automatically filters debug logs in production
 */
export const logger = {
  /**
   * Debug level logging - only shown in development
   */
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  },
  
  /**
   * Info level logging - general information
   */
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data || '')
  },
  
  /**
   * Warning level logging - potential issues
   */
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '')
  },
  
  /**
   * Error level logging - critical issues
   */
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '')
  },

  /**
   * Context-specific logger with component prefix
   */
  withContext: (context: string) => ({
    debug: (message: string, data?: any) => logger.debug(`[${context}] ${message}`, data),
    info: (message: string, data?: any) => logger.info(`[${context}] ${message}`, data),
    warn: (message: string, data?: any) => logger.warn(`[${context}] ${message}`, data),
    error: (message: string, error?: any) => logger.error(`[${context}] ${message}`, error)
  })
}

/**
 * Helper function to create contextual loggers for components
 */
export const createLogger = (context: string) => logger.withContext(context)

/**
 * Performance logging utility
 */
export const logPerformance = (label: string, startTime: number) => {
  const duration = Date.now() - startTime
  logger.debug(`Performance: ${label}`, { duration: `${duration}ms` })
}

/**
 * Data logging utility with size information
 */
export const logDataUpdate = (dataType: string, json: string) => {
  logger.debug(`Data updated: ${dataType}`, { 
    length: json.length, 
    isEmpty: !json || json.trim() === '' 
  })
}