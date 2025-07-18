type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogConfig {
  level: LogLevel
  enabledInProduction: boolean
}

const DEFAULT_CONFIG: LogConfig = {
  level: 'info',
  enabledInProduction: false
}

export const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  },

  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data || '')
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '')
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '')
  }
}
