/**
 * @fileOverview Central Ticker Configuration System
 * 
 * This file defines all available tickers for the StockSage application
 * and provides factory functions for creating ticker configurations.
 * Used by the dynamic tab system for automatic ticker registration.
 */

import type { TickerConfig, StrikeCount, TableDisplayType } from '@/lib/ticker-framework/core/types';

/**
 * Extended ticker configuration with dynamic loading support
 */
export interface DynamicTickerConfig extends TickerConfig {
  ticker: string;
  displayName: string;
  defaultStrikeCount: StrikeCount;
  defaultTableDisplay: TableDisplayType;
  
  // Dynamic loading configuration
  enabled: boolean;
  order: number;
  category?: 'ETF' | 'STOCK' | 'CRYPTO' | 'INDEX';
  description?: string;
  
  // Server action imports (for lazy loading)
  chatActionPath?: string;
  
  // Custom theming/styling
  accentColor?: string;
  icon?: string;
  
  // Feature flags
  features?: {
    aiChat?: boolean;
    optionsChain?: boolean;
    technicalAnalysis?: boolean;
    webSearch?: boolean;
  };
}

/**
 * Default feature set for all tickers
 */
const DEFAULT_FEATURES = {
  aiChat: true,
  optionsChain: true,
  technicalAnalysis: true,
  webSearch: true,
};

/**
 * Factory function for creating ticker configurations
 */
export function createTickerConfig(
  ticker: string,
  displayName: string,
  overrides: Partial<DynamicTickerConfig> = {}
): DynamicTickerConfig {
  return {
    ticker: ticker.toUpperCase(),
    displayName,
    defaultStrikeCount: 30,
    defaultTableDisplay: 'side-by-side',
    enabled: true,
    order: 999, // Default to end of list
    category: 'STOCK',
    features: DEFAULT_FEATURES,
    ...overrides,
  };
}

/**
 * All available ticker configurations
 * These are registered in the ticker registry for dynamic loading
 */
export const TICKER_CONFIGS: DynamicTickerConfig[] = [
  // Primary ETFs (highest priority)
  createTickerConfig('SPY', 'SPY (SPDR S&P 500 ETF)', {
    order: 1,
    category: 'ETF',
    description: 'The most liquid ETF tracking the S&P 500 index',
    accentColor: '#3b82f6', // blue-500
    chatActionPath: '@/actions/spy-consolidated-chat-action',
  }),
  
  createTickerConfig('QQQ', 'QQQ (Invesco QQQ Trust)', {
    order: 2, 
    category: 'ETF',
    description: 'ETF tracking the Nasdaq-100 index',
    accentColor: '#10b981', // emerald-500
    enabled: false, // Disabled until chat action is implemented
    chatActionPath: '@/actions/qqq-consolidated-chat-action',
  }),
  
  // Major Tech Stocks
  createTickerConfig('NVDA', 'NVIDIA Corporation', {
    order: 3,
    category: 'STOCK',
    description: 'Leading AI and graphics processing company',
    accentColor: '#76b900', // NVIDIA green
    chatActionPath: '@/actions/nvda-consolidated-chat-action',
  }),
  
  createTickerConfig('AAPL', 'Apple Inc.', {
    order: 4,
    category: 'STOCK', 
    description: 'Technology hardware and services company',
    accentColor: '#000000', // Apple black
    enabled: false, // Disabled by default - enable when needed
  }),
  
  createTickerConfig('MSFT', 'Microsoft Corporation', {
    order: 5,
    category: 'STOCK',
    description: 'Cloud computing and software services',
    accentColor: '#00a4ef', // Microsoft blue
    enabled: false,
  }),
  
  createTickerConfig('GOOGL', 'Alphabet Inc. Class A', {
    order: 6,
    category: 'STOCK',
    description: 'Internet search and cloud services',
    accentColor: '#4285f4', // Google blue
    enabled: false,
  }),
  
  createTickerConfig('AMZN', 'Amazon.com Inc.', {
    order: 7,
    category: 'STOCK',
    description: 'E-commerce and cloud computing',
    accentColor: '#ff9900', // Amazon orange
    enabled: false,
  }),
  
  createTickerConfig('TSLA', 'Tesla Inc.', {
    order: 8,
    category: 'STOCK',
    description: 'Electric vehicles and clean energy',
    accentColor: '#cc0000', // Tesla red
    enabled: false,
  }),
  
  // Financial Sector ETFs
  createTickerConfig('XLF', 'Financial Select Sector SPDR Fund', {
    order: 20,
    category: 'ETF',
    description: 'Financial sector ETF',
    accentColor: '#059669', // emerald-600
    enabled: false,
  }),
  
  // Technology Sector ETFs  
  createTickerConfig('XLK', 'Technology Select Sector SPDR Fund', {
    order: 21,
    category: 'ETF', 
    description: 'Technology sector ETF',
    accentColor: '#7c3aed', // violet-600
    enabled: false,
  }),
  
  // Volatility and Market Indicators
  createTickerConfig('VIX', 'CBOE Volatility Index', {
    order: 30,
    category: 'INDEX',
    description: 'Market volatility indicator',
    accentColor: '#dc2626', // red-600
    enabled: false,
    features: {
      ...DEFAULT_FEATURES,
      optionsChain: false, // VIX doesn't have traditional options
    },
  }),
];

/**
 * Get all enabled ticker configurations
 */
export function getEnabledTickers(): DynamicTickerConfig[] {
  return TICKER_CONFIGS
    .filter(config => config.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get ticker configuration by symbol
 */
export function getTickerConfig(ticker: string): DynamicTickerConfig | undefined {
  return TICKER_CONFIGS.find(config => config.ticker === ticker.toUpperCase());
}

/**
 * Get tickers by category
 */
export function getTickersByCategory(category: DynamicTickerConfig['category']): DynamicTickerConfig[] {
  return TICKER_CONFIGS
    .filter(config => config.category === category && config.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Check if a ticker is enabled
 */
export function isTickerEnabled(ticker: string): boolean {
  const config = getTickerConfig(ticker);
  return config?.enabled ?? false;
}

/**
 * Get ticker count by status
 */
export function getTickerStats() {
  const all = TICKER_CONFIGS;
  const enabled = all.filter(c => c.enabled);
  
  return {
    total: all.length,
    enabled: enabled.length,
    disabled: all.length - enabled.length,
    byCategory: {
      ETF: all.filter(c => c.category === 'ETF').length,
      STOCK: all.filter(c => c.category === 'STOCK').length,
      INDEX: all.filter(c => c.category === 'INDEX').length,
      CRYPTO: all.filter(c => c.category === 'CRYPTO').length,
    },
  };
}

/**
 * Runtime configuration utilities
 */
export const TickerConfigUtils = {
  /**
   * Enable a ticker at runtime
   */
  enableTicker(ticker: string): boolean {
    const config = getTickerConfig(ticker);
    if (config) {
      config.enabled = true;
      return true;
    }
    return false;
  },
  
  /**
   * Disable a ticker at runtime
   */
  disableTicker(ticker: string): boolean {
    const config = getTickerConfig(ticker);
    if (config) {
      config.enabled = false;
      return true;
    }
    return false;
  },
  
  /**
   * Update ticker order
   */
  updateTickerOrder(ticker: string, newOrder: number): boolean {
    const config = getTickerConfig(ticker);
    if (config) {
      config.order = newOrder;
      return true;
    }
    return false;
  },
  
  /**
   * Validate ticker configuration
   */
  validateConfig(config: DynamicTickerConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.ticker || config.ticker.length === 0) {
      errors.push('Ticker symbol is required');
    }
    
    if (!config.displayName || config.displayName.length === 0) {
      errors.push('Display name is required');
    }
    
    if (![20, 30, 40].includes(config.defaultStrikeCount)) {
      errors.push('Default strike count must be 20, 30, or 40');
    }
    
    if (!['side-by-side', 'top-bottom'].includes(config.defaultTableDisplay)) {
      errors.push('Default table display must be side-by-side or top-bottom');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Development utilities for testing
 */
export const DevUtils = {
  /**
   * Enable all tickers (for development)
   */
  enableAllTickers(): void {
    TICKER_CONFIGS.forEach(config => {
      config.enabled = true;
    });
  },
  
  /**
   * Enable only specific tickers
   */
  enableOnlyTickers(tickers: string[]): void {
    TICKER_CONFIGS.forEach(config => {
      config.enabled = tickers.includes(config.ticker);
    });
  },
  
  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    // Reset SPY, NVDA, QQQ to enabled (current production setup)
    DevUtils.enableOnlyTickers(['SPY', 'NVDA', 'QQQ']);
  },
  
  /**
   * Get configuration summary for debugging
   */
  getConfigSummary(): string {
    const stats = getTickerStats();
    const enabled = getEnabledTickers();
    
    return `
Ticker Configuration Summary:
- Total Tickers: ${stats.total}
- Enabled: ${stats.enabled}
- Disabled: ${stats.disabled}

Enabled Tickers (in order):
${enabled.map(t => `  ${t.order}. ${t.ticker} - ${t.displayName}`).join('\n')}

Categories:
- ETFs: ${stats.byCategory.ETF}
- Stocks: ${stats.byCategory.STOCK}  
- Indices: ${stats.byCategory.INDEX}
- Crypto: ${stats.byCategory.CRYPTO}
    `.trim();
  },
};