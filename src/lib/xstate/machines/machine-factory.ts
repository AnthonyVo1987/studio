/**
 * Machine Factory for Ticker-Specific XState Machines
 * 
 * This file provides utilities for creating and managing XState machines
 * for different tickers with customizable configurations.
 */

import { createActor } from 'xstate';
import { macroExecutionMachine, createMacroExecutionMachine } from './macro-execution-machine';
import type { MacroExecutionContext, MacroMachineConfig, TimeoutConfig } from '../types/macro-types';
import type { MacroExecutionEvent } from '../types/event-types';

// ================================
// MACHINE FACTORY INTERFACE
// ================================

export interface MachineFactory {
  createMachine: (config: MacroMachineConfig) => ReturnType<typeof macroExecutionMachine.provide>;
  createActor: (config: MacroMachineConfig) => ReturnType<typeof createActor>;
  getDefaultConfig: (ticker: string) => MacroMachineConfig;
  validateConfig: (config: MacroMachineConfig) => ConfigValidationResult;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ================================
// DEFAULT CONFIGURATIONS
// ================================

export const getDefaultMachineConfig = (ticker: string): MacroMachineConfig => ({
  id: `macro-execution-${ticker.toLowerCase()}`,
  ticker: ticker.toUpperCase(),
  steps: [
    {
      id: 1,
      stepId: 'fetchExpirations',
      name: 'Fetch Expirations',
      description: `Retrieve available options expiration dates for ${ticker}`,
      prerequisites: [
        {
          type: 'context_property',
          property: 'ticker',
          validator: (ctx) => Boolean(ctx.ticker) && ctx.ticker === ticker.toUpperCase()
        }
      ],
      retryable: true,
      timeout: 30000
    },
    {
      id: 2,
      stepId: 'getStockData',
      name: 'Get Stock Data',
      description: `Fetch current stock snapshot and market data for ${ticker}`,
      prerequisites: [
        {
          type: 'context_property',
          property: 'selectedExpiration',
          validator: (ctx) => Boolean(ctx.selectedExpiration)
        }
      ],
      retryable: true,
      timeout: 30000
    },
    {
      id: 3,
      stepId: 'generateAITakeaways',
      name: 'AI Takeaways',
      description: `Generate AI-powered stock analysis and insights for ${ticker}`,
      prerequisites: [
        {
          type: 'data_exists',
          property: 'stockData',
          validator: (ctx) => ctx.stepResults.has(2) && ctx.stepResults.get(2)?.status === 'success'
        }
      ],
      retryable: true,
      timeout: 60000
    },
    {
      id: 4,
      stepId: 'generateAIOptions',
      name: 'AI Options',
      description: `Generate AI-powered options trading recommendations for ${ticker}`,
      prerequisites: [
        {
          type: 'data_exists',
          property: 'aiTakeaways',
          validator: (ctx) => ctx.stepResults.has(3) && ctx.stepResults.get(3)?.status === 'success'
        }
      ],
      retryable: true,
      timeout: 60000
    }
  ],
  timeouts: {
    stepTimeout: 45000,
    maxRetries: 2,
    backoffMultiplier: 2,
    baseRetryDelay: 1000
  },
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: 'info',
    logSteps: true,
    logTransitions: true
  }
});

// ================================
// TICKER-SPECIFIC CONFIGURATIONS
// ================================

const TICKER_SPECIFIC_CONFIGS: Record<string, Partial<MacroMachineConfig>> = {
  NVDA: {
    debug: {
      enabled: true,
      logLevel: 'debug',
      logSteps: true,
      logTransitions: true
    },
    timeouts: {
      stepTimeout: 60000, // Longer timeout for NVDA due to high volume
      maxRetries: 3,
      backoffMultiplier: 2,
      baseRetryDelay: 1000
    }
  },
  SPY: {
    debug: {
      enabled: true,
      logLevel: 'info',
      logSteps: true,
      logTransitions: false
    },
    timeouts: {
      stepTimeout: 45000,
      maxRetries: 2,
      backoffMultiplier: 2,
      baseRetryDelay: 1000
    }
  },
  // Add more ticker-specific configurations as needed
};

// ================================
// MACHINE FACTORY IMPLEMENTATION
// ================================

export const machineFactory: MachineFactory = {
  createMachine: (config: MacroMachineConfig) => {
    const validationResult = machineFactory.validateConfig(config);
    
    if (!validationResult.valid) {
      throw new Error(`Invalid machine configuration: ${validationResult.errors.join(', ')}`);
    }

    if (validationResult.warnings.length > 0 && config.debug.enabled) {
      console.warn('[XState Factory] Configuration warnings:', validationResult.warnings);
    }

    return createMacroExecutionMachine(config.ticker, {
      debugMode: config.debug.enabled
    });
  },

  createActor: (config: MacroMachineConfig) => {
    const machine = machineFactory.createMachine(config);
    const actor = createActor(machine, {
      input: {
        ticker: config.ticker,
        debugMode: config.debug.enabled
      }
    });
    
    if (config.debug.enabled) {
      console.log(`[XState Factory] Created actor for ${config.ticker}`, {
        machineId: config.id,
        debugMode: config.debug.enabled
      });
    }
    
    return actor;
  },

  getDefaultConfig: (ticker: string) => {
    const baseConfig = getDefaultMachineConfig(ticker);
    const tickerSpecific = TICKER_SPECIFIC_CONFIGS[ticker.toUpperCase()] || {};
    
    return {
      ...baseConfig,
      ...tickerSpecific,
      ticker: ticker.toUpperCase(),
      timeouts: {
        ...baseConfig.timeouts,
        ...tickerSpecific.timeouts
      },
      debug: {
        ...baseConfig.debug,
        ...tickerSpecific.debug
      }
    };
  },

  validateConfig: (config: MacroMachineConfig): ConfigValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!config.id || typeof config.id !== 'string') {
      errors.push('Machine ID is required and must be a string');
    }

    if (!config.ticker || typeof config.ticker !== 'string') {
      errors.push('Ticker is required and must be a string');
    }

    if (!config.steps || !Array.isArray(config.steps) || config.steps.length === 0) {
      errors.push('Steps array is required and must not be empty');
    }

    // Step validation
    if (config.steps) {
      const stepIds = new Set<number>();
      
      config.steps.forEach((step, index) => {
        if (typeof step.id !== 'number') {
          errors.push(`Step ${index}: ID must be a number`);
        } else if (stepIds.has(step.id)) {
          errors.push(`Step ${index}: Duplicate step ID ${step.id}`);
        } else {
          stepIds.add(step.id);
        }

        if (!step.name || typeof step.name !== 'string') {
          errors.push(`Step ${index}: Name is required and must be a string`);
        }

        if (!Array.isArray(step.prerequisites)) {
          errors.push(`Step ${index}: Prerequisites must be an array`);
        }

        if (typeof step.retryable !== 'boolean') {
          warnings.push(`Step ${index}: retryable should be a boolean (defaulting to true)`);
        }

        if (step.timeout && (typeof step.timeout !== 'number' || step.timeout <= 0)) {
          warnings.push(`Step ${index}: timeout should be a positive number`);
        }
      });
    }

    // Timeout configuration validation
    if (config.timeouts) {
      const { stepTimeout, maxRetries, backoffMultiplier, baseRetryDelay } = config.timeouts;

      if (typeof stepTimeout !== 'number' || stepTimeout <= 0) {
        errors.push('stepTimeout must be a positive number');
      }

      if (typeof maxRetries !== 'number' || maxRetries < 0) {
        errors.push('maxRetries must be a non-negative number');
      }

      if (typeof backoffMultiplier !== 'number' || backoffMultiplier <= 0) {
        warnings.push('backoffMultiplier should be a positive number (defaulting to 2)');
      }

      if (typeof baseRetryDelay !== 'number' || baseRetryDelay < 0) {
        warnings.push('baseRetryDelay should be a non-negative number (defaulting to 1000)');
      }
    }

    // Debug configuration validation
    if (config.debug) {
      if (typeof config.debug.enabled !== 'boolean') {
        warnings.push('debug.enabled should be a boolean (defaulting to false)');
      }

      if (!['error', 'warn', 'info', 'debug'].includes(config.debug.logLevel)) {
        warnings.push('debug.logLevel should be one of: error, warn, info, debug (defaulting to info)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
};

// ================================
// CONVENIENCE FUNCTIONS
// ================================

export const createTickerMachine = (ticker: string, options: {
  debugMode?: boolean;
  customTimeouts?: Partial<TimeoutConfig>;
  customSteps?: number[];
} = {}) => {
  const config = machineFactory.getDefaultConfig(ticker);
  
  // Apply custom options
  if (options.debugMode !== undefined) {
    config.debug.enabled = options.debugMode;
  }
  
  if (options.customTimeouts) {
    config.timeouts = {
      ...config.timeouts,
      ...options.customTimeouts
    };
  }
  
  return machineFactory.createMachine(config);
};

export const createTickerActor = (ticker: string, options: {
  debugMode?: boolean;
  customTimeouts?: Partial<TimeoutConfig>;
  autoStart?: boolean;
} = {}) => {
  const config = machineFactory.getDefaultConfig(ticker);
  
  // Apply custom options
  if (options.debugMode !== undefined) {
    config.debug.enabled = options.debugMode;
  }
  
  if (options.customTimeouts) {
    config.timeouts = {
      ...config.timeouts,
      ...options.customTimeouts
    };
  }
  
  const actor = machineFactory.createActor(config);
  
  if (options.autoStart !== false) {
    actor.start();
  }
  
  return actor;
};

// ================================
// MACHINE REGISTRY
// ================================

export class MachineRegistry {
  private machines = new Map<string, ReturnType<typeof createActor>>();
  
  register(ticker: string, options: Parameters<typeof createTickerActor>[1] = {}) {
    if (this.machines.has(ticker)) {
      console.warn(`[XState Registry] Machine for ${ticker} already exists, replacing...`);
      this.unregister(ticker);
    }
    
    const actor = createTickerActor(ticker, options);
    this.machines.set(ticker, actor);
    
    return actor;
  }
  
  get(ticker: string) {
    return this.machines.get(ticker);
  }
  
  unregister(ticker: string) {
    const machine = this.machines.get(ticker);
    if (machine) {
      machine.stop();
      this.machines.delete(ticker);
    }
  }
  
  unregisterAll() {
    for (const [ticker, machine] of this.machines) {
      machine.stop();
    }
    this.machines.clear();
  }
  
  getRegisteredTickers() {
    return Array.from(this.machines.keys());
  }
  
  getActiveCount() {
    return this.machines.size;
  }
}

// Global registry instance
export const globalMachineRegistry = new MachineRegistry();

// ================================
// EXPORTS
// ================================

export default machineFactory;
// Types are already exported in the main export section above