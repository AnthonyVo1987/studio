/**
 * @fileOverview Command Pattern Module Index - Enterprise Implementation
 * 
 * Central export point for the command pattern implementation with
 * comprehensive type safety and clean import paths.
 * 
 * EXPORTS:
 * - Core command interfaces and base classes
 * - Specific command implementations
 * - Enhanced command queue management
 * - React integration hooks and components
 * - Utility functions and factories
 */

// ===============================
// CORE INTERFACES AND CLASSES
// ===============================

export {
  MacroCommand,
  CommandError,
  DefaultMacroExecutionContext,
  type CommandResult,
  type CommandMetadata,
  type SecurityContext,
  type MacroExecutionContext,
  type CircuitBreakerInterface,
  type CircuitBreakerConfig,
  type CircuitBreakerState
} from './interfaces/command';

// ===============================
// COMMAND QUEUE MANAGEMENT
// ===============================

export {
  EnhancedMacroCommandQueue,
  type QueueEvent,
  type QueueMetrics,
  type QueueConfig
} from './queue/enhanced-command-queue';

// ===============================
// SPECIFIC COMMAND IMPLEMENTATIONS
// ===============================

export {
  FetchExpirationsCommand,
  type FetchExpirationsInput,
  type FetchExpirationsOutput
} from './commands/fetch-expirations-command';

export {
  GetStockDataCommand,
  type GetStockDataInput,
  type GetStockDataOutput,
  type StockSnapshot,
  type MarketStatus,
  type TechnicalAnalysis
} from './commands/get-stock-data-command';

export {
  GenerateAITakeawaysCommand,
  type GenerateAITakeawaysInput,
  type AITakeawaysOutput,
  type AIAnalysisType
} from './commands/generate-ai-takeaways-command';

export {
  GenerateAIOptionsCommand,
  type GenerateAIOptionsInput,
  type GenerateAIOptionsOutput,
  type OptionsGreeks,
  type VolatilityAnalysis,
  type OptionsStrategy
} from './commands/generate-ai-options-command';

// ===============================
// REACT INTEGRATION
// ===============================

export {
  useCommandQueue,
  useNVDAMacroCommands,
  useCommandExecution,
  type CommandQueueState,
  type CommandQueueActions,
  type UseCommandQueueOptions,
  type UseCommandQueueReturn
} from './react/command-queue-hook';

// ===============================
// UTILITY FUNCTIONS AND FACTORIES
// ===============================

/**
 * Factory function to create a complete NVDA macro command sequence
 */
export async function createNVDAMacroSequence(
  context: import('./interfaces/command').MacroExecutionContext,
  securityContext: import('./interfaces/command').SecurityContext,
  options?: {
    analysisTypes?: import('./commands/generate-ai-takeaways-command').AIAnalysisType[];
    includeOptions?: boolean;
    analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
  }
): Promise<import('./interfaces/command').MacroCommand[]> {
  const commands: import('./interfaces/command').MacroCommand[] = [];
  const analysisTypes = options?.analysisTypes || ['stock-trader-takeaways', 'holistic-takeaways'];

  // Dynamic imports to resolve circular dependencies
  const { FetchExpirationsCommand } = await import('./commands/fetch-expirations-command');
  const { GetStockDataCommand } = await import('./commands/get-stock-data-command');
  const { GenerateAITakeawaysCommand } = await import('./commands/generate-ai-takeaways-command');
  const { GenerateAIOptionsCommand } = await import('./commands/generate-ai-options-command');

  // 1. Fetch expiration dates
  commands.push(FetchExpirationsCommand.createForNVDA(context, securityContext));

  // 2. Get stock data with technical analysis
  commands.push(GetStockDataCommand.createForNVDA(context, securityContext));

  // 3. Generate AI takeaways
  for (const analysisType of analysisTypes) {
    commands.push(new GenerateAITakeawaysCommand(
      { analysisType, ticker: 'NVDA' },
      context,
      securityContext
    ));
  }

  // 4. Generate AI options analysis (if requested)
  if (options?.includeOptions !== false) {
    commands.push(GenerateAIOptionsCommand.createForNVDA(
      context,
      securityContext,
      options?.analysisDepth || 'detailed'
    ));
  }

  return commands;
}

/**
 * Factory function to create a basic security context for staging
 */
export function createStagingSecurityContext(overrides?: Partial<import('./interfaces/command').SecurityContext>): import('./interfaces/command').SecurityContext {
  return {
    userId: 'staging-user',
    permissions: [
      'READ_STOCK_DATA',
      'READ_OPTIONS_DATA',
      'AI_ACCESS',
      'API_ACCESS',
      'GENERATE_INSIGHTS'
    ],
    sessionId: `staging_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    ipAddress: '127.0.0.1',
    correlationId: `corr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    environment: 'staging',
    ...overrides
  };
}

/**
 * Utility function to validate command dependencies
 */
export function validateCommandDependencies(commands: import('./interfaces/command').MacroCommand[]): {
  valid: boolean;
  missingDependencies: string[];
  circularDependencies: string[];
} {
  const commandIds = new Set(commands.map(cmd => cmd.getId()));
  const missingDependencies: string[] = [];
  const circularDependencies: string[] = [];

  // Check for missing dependencies
  for (const command of commands) {
    for (const depId of command.getDependencies()) {
      if (!commandIds.has(depId)) {
        missingDependencies.push(`${command.getId()} -> ${depId}`);
      }
    }
  }

  // Check for circular dependencies using DFS
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function hasCircularDep(commandId: string): boolean {
    if (visiting.has(commandId)) {
      return true;
    }
    if (visited.has(commandId)) {
      return false;
    }

    visiting.add(commandId);
    
    const command = commands.find(cmd => cmd.getId() === commandId);
    if (command) {
      for (const depId of command.getDependencies()) {
        if (hasCircularDep(depId)) {
          circularDependencies.push(`${commandId} -> ${depId}`);
          return true;
        }
      }
    }

    visiting.delete(commandId);
    visited.add(commandId);
    return false;
  }

  for (const command of commands) {
    hasCircularDep(command.getId());
  }

  return {
    valid: missingDependencies.length === 0 && circularDependencies.length === 0,
    missingDependencies,
    circularDependencies
  };
}

// ===============================
// TYPE EXPORTS FOR CONVENIENCE
// ===============================
// Note: Types are already exported above with their respective modules

// ===============================
// VERSION INFORMATION
// ===============================

export const COMMAND_PATTERN_VERSION = '1.0.0';
export const SUPPORTED_FEATURES = [
  'command-execution',
  'queue-management',
  'circuit-breaker',
  'retry-logic',
  'distributed-tracing',
  'security-context',
  'performance-monitoring',
  'react-integration',
  'dependency-resolution',
  'priority-scheduling'
] as const;

export type SupportedFeature = typeof SUPPORTED_FEATURES[number];