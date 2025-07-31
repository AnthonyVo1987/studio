/**
 * Server Log Capture Utility
 * v4.4.2.8 - Captures and sanitizes server-side console output
 */

import type { ServerLogEntry } from '@/types/server-action-response';

/**
 * Configuration for server log capture
 */
interface LogCaptureConfig {
  enabled?: boolean;
  maxLogs?: number;
  sanitize?: boolean;
  includePaths?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<LogCaptureConfig> = {
  enabled: process.env.NODE_ENV === 'development',
  maxLogs: 100,
  sanitize: true,
  includePaths: false,
};

/**
 * Sanitization patterns for sensitive data
 */
const SANITIZATION_PATTERNS = [
  // API keys
  {
    pattern: /(?:api[_-]?key|apikey)[\s:="']*([a-zA-Z0-9\-_]+)/gi,
    replacement: 'API_KEY_REDACTED',
  },
  // Bearer tokens
  {
    pattern: /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,
    replacement: 'Bearer [REDACTED]',
  },
  // Email addresses
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL_REDACTED]',
  },
  // Credit card numbers
  {
    pattern: /\b(?:\d{4}[\s\-]?){3}\d{4}\b/g,
    replacement: '[CARD_REDACTED]',
  },
  // Polygon API keys specifically
  {
    pattern: /polygon[_-]?(?:api[_-]?)?key[\s:="']*([a-zA-Z0-9\-_]+)/gi,
    replacement: 'POLYGON_KEY_REDACTED',
  },
  // Gemini API keys specifically
  {
    pattern: /gemini[_-]?(?:api[_-]?)?key[\s:="']*([a-zA-Z0-9\-_]+)/gi,
    replacement: 'GEMINI_KEY_REDACTED',
  },
];

/**
 * Sanitizes a string value by removing sensitive data
 */
function sanitizeValue(value: any): any {
  if (typeof value !== 'string') {
    if (typeof value === 'object' && value !== null) {
      // Recursively sanitize objects
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  }

  let sanitized = value;
  for (const { pattern, replacement } of SANITIZATION_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized;
}

/**
 * Server log capture class
 */
export class ServerLogCapture {
  private logs: ServerLogEntry[] = [];
  private originalConsole: Partial<Console> = {};
  private config: Required<LogCaptureConfig>;
  private isCapturing = false;

  constructor(config?: LogCaptureConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start capturing console output
   */
  start(): void {
    if (!this.config.enabled || this.isCapturing) {
      return;
    }

    this.isCapturing = true;
    this.logs = [];

    // Store original console methods
    const methods: (keyof Console)[] = ['log', 'info', 'warn', 'error', 'debug'];
    
    methods.forEach((method) => {
      const originalMethod = (console as any)[method];
      this.originalConsole[method] = originalMethod;
      
      // Override console method
      (console as any)[method] = (...args: any[]) => {
        // Call original method
        if (typeof originalMethod === 'function') {
          originalMethod.apply(console, args);
        }
        
        // Capture log
        this.captureLog(method as ServerLogEntry['level'], args);
      };
    });
  }

  /**
   * Stop capturing and restore original console
   */
  stop(): ServerLogEntry[] {
    if (!this.isCapturing) {
      return [];
    }

    this.isCapturing = false;

    // Restore original console methods
    Object.entries(this.originalConsole).forEach(([method, original]) => {
      if (original) {
        (console as any)[method] = original;
      }
    });

    const capturedLogs = [...this.logs];
    this.logs = [];
    return capturedLogs;
  }

  /**
   * Capture a single log entry
   */
  private captureLog(level: ServerLogEntry['level'], args: any[]): void {
    // Circular buffer - remove oldest if at max capacity
    if (this.logs.length >= this.config.maxLogs) {
      this.logs.shift();
    }

    // Sanitize arguments if enabled
    const sanitizedArgs = this.config.sanitize 
      ? args.map(arg => sanitizeValue(arg))
      : args;

    // Create log entry
    const entry: ServerLogEntry = {
      timestamp: Date.now(),
      level,
      args: sanitizedArgs,
    };

    // Add stack trace for errors
    if (level === 'error' && args[0] instanceof Error) {
      entry.stack = args[0].stack;
    }

    this.logs.push(entry);
  }

  /**
   * Get current logs without stopping capture
   */
  getLogs(): ServerLogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear logs without stopping capture
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Check if currently capturing
   */
  isActive(): boolean {
    return this.isCapturing;
  }
}

/**
 * Global singleton instance for convenience
 */
let globalCapture: ServerLogCapture | null = null;

/**
 * Get or create global capture instance
 */
export function getGlobalCapture(config?: LogCaptureConfig): ServerLogCapture {
  if (!globalCapture) {
    globalCapture = new ServerLogCapture(config);
  }
  return globalCapture;
}

/**
 * Utility function to capture logs for a single operation
 */
export async function captureServerLogs<T>(
  operation: () => Promise<T>,
  config?: LogCaptureConfig
): Promise<{ result: T; logs: ServerLogEntry[] }> {
  const capture = new ServerLogCapture(config);
  
  try {
    capture.start();
    const result = await operation();
    const logs = capture.stop();
    return { result, logs };
  } catch (error) {
    const logs = capture.stop();
    throw error;
  }
}