/**
 * @fileOverview Ticker Analysis Blueprint Configuration System
 * 
 * This file demonstrates how the SPY architecture can be abstracted into a 
 * configuration-driven system for creating new ticker-specific analysis pages.
 * 
 * USAGE EXAMPLE:
 * const nvdaConfig = createTickerConfig('NVDA', 'NVIDIA Corporation Analysis');
 * const appleConfig = createTickerConfig('AAPL', 'Apple Inc. Analysis');
 */

import type { OptionType, StrikeCount, TableDisplayType } from '@/contexts/spy-analysis-context';

export interface TickerAnalysisConfig {
  // Core ticker information
  ticker: string;
  displayName: string;
  
  // Default settings
  defaultOptionType: OptionType;
  defaultStrikeCount: StrikeCount;
  defaultTableDisplayType: TableDisplayType;
  
  // UI configuration
  headerTitle: string;
  headerDescription: string;
  controlsCardTitle: string;
  controlsCardDescription: string;
  aiAnalysisCardTitle: string;
  aiAnalysisCardDescription: string;
  
  // Context naming
  contextName: string;
  providerName: string;
  hookName: string;
  dispatchHookName: string;
  
  // Component naming patterns
  tabContentComponent: string;
  displayComponentPrefix: string;
  contextFileName: string;
  
  // Debug logging prefix
  logPrefix: string;
}

/**
 * Factory function to create ticker-specific configuration
 */
export function createTickerConfig(
  ticker: string, 
  displayName: string,
  overrides: Partial<TickerAnalysisConfig> = {}
): TickerAnalysisConfig {
  const baseConfig: TickerAnalysisConfig = {
    ticker,
    displayName,
    
    // Default settings (can be customized per ticker)
    defaultOptionType: 'both',
    defaultStrikeCount: 20,
    defaultTableDisplayType: 'side-by-side',
    
    // Generated UI configuration
    headerTitle: `${ticker} Dedicated Analysis`,
    headerDescription: `Real-time ${ticker} stock analysis with technical indicators and options data`,
    controlsCardTitle: `${ticker} Analysis Controls`,
    controlsCardDescription: `Manage expiration dates and trigger data retrieval for ${ticker}`,
    aiAnalysisCardTitle: `${ticker} AI Analysis (On-Demand)`,
    aiAnalysisCardDescription: 'Generate AI analysis manually. Each button is independent and requires specific data to be available.',
    
    // Generated context naming
    contextName: `${ticker.toLowerCase()}Analysis`,
    providerName: `${ticker}AnalysisProvider`,
    hookName: `use${ticker}Analysis`,
    dispatchHookName: `use${ticker}Dispatch`,
    
    // Generated component naming
    tabContentComponent: `${ticker}TabContent`,
    displayComponentPrefix: ticker.toLowerCase(),
    contextFileName: `${ticker.toLowerCase()}-analysis-context.tsx`,
    
    // Debug logging
    logPrefix: `[${ticker}:UserAction]`,
    
    ...overrides
  };
  
  return baseConfig;
}

/**
 * Pre-configured ticker configurations for common stocks
 */
export const TICKER_CONFIGS = {
  SPY: createTickerConfig('SPY', 'SPY ETF Analysis'),
  NVDA: createTickerConfig('NVDA', 'NVIDIA Corporation Analysis'),
  AAPL: createTickerConfig('AAPL', 'Apple Inc. Analysis'),
  MSFT: createTickerConfig('MSFT', 'Microsoft Corporation Analysis'),
  TSLA: createTickerConfig('TSLA', 'Tesla Inc. Analysis'),
  GOOGL: createTickerConfig('GOOGL', 'Alphabet Inc. Analysis'),
  AMZN: createTickerConfig('AMZN', 'Amazon.com Inc. Analysis'),
} as const;

/**
 * Type helper for ticker configuration keys
 */
export type SupportedTicker = keyof typeof TICKER_CONFIGS;

/**
 * Utility function to get configuration for a specific ticker
 */
export function getTickerConfig(ticker: SupportedTicker): TickerAnalysisConfig {
  return TICKER_CONFIGS[ticker];
}

/**
 * Validation function to ensure ticker configuration is complete
 */
export function validateTickerConfig(config: TickerAnalysisConfig): boolean {
  const requiredFields: (keyof TickerAnalysisConfig)[] = [
    'ticker', 'displayName', 'contextName', 'providerName', 
    'hookName', 'dispatchHookName', 'tabContentComponent'
  ];
  
  return requiredFields.every(field => {
    const value = config[field];
    return typeof value === 'string' && value.length > 0;
  });
}

/**
 * Example usage patterns for developers
 */
export const IMPLEMENTATION_EXAMPLES = {
  /**
   * Example 1: Creating a new NVDA analysis page
   */
  nvdaImplementation: {
    step1: 'Copy spy-analysis-context.tsx → nvda-analysis-context.tsx',
    step2: 'Update imports and constants using TICKER_CONFIGS.NVDA',
    step3: 'Copy spy-tab-content.tsx → nvda-tab-content.tsx',
    step4: 'Copy all spy-*-display.tsx → nvda-*-display.tsx components',
    step5: 'Update provider mounting in pages or layout files',
  },
  
  /**
   * Example 2: Configuration-driven component generation
   */
  configDrivenGeneration: {
    note: 'Use TickerAnalysisConfig to generate component templates',
    example: 'const config = getTickerConfig("NVDA"); // Use config for naming',
  },
  
  /**
   * Example 3: Factory pattern for context creation
   */
  factoryPatternUsage: {
    note: 'Create generic context factory that accepts ticker config',
    benefit: 'Reduces code duplication and ensures consistency',
  },
} as const;