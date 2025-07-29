/**
 * @fileOverview Ticker Configuration System
 * 
 * This module provides a scalable configuration system for ticker-specific pages.
 * It enables creation of new ticker tabs through configuration rather than code duplication,
 * supporting the architecture goal of scaling to 5-10x more tickers.
 * 
 * Architecture Benefits:
 * - Configuration-driven ticker page generation
 * - Consistent behavior across all ticker tabs
 * - Easy addition of new tickers without code duplication
 * - Centralized management of ticker-specific settings
 */

export interface TickerConfig {
  // Basic ticker information
  ticker: string;
  displayName: string;
  description: string;
  
  // Tab configuration
  tabKey: string; // Used for tab value in UI
  tabLabel: string; // Display label for tab
  
  // Page/context naming
  pageName: string; // Used for logging (e.g., 'SPY-Tab')
  contextName: string; // Used for context provider naming
  
  // Feature flags
  features: {
    aiKeyTakeaways: boolean;
    aiOptionsAnalysis: boolean;
    advancedChat: boolean;
    optionsChain: boolean;
    technicalAnalysis: boolean;
    webSearch: boolean;
  };
  
  // Default settings
  defaults: {
    strikeCount: 20 | 30 | 40;
    optionType: 'both' | 'calls' | 'puts';
    tableDisplayType: 'side-by-side' | 'top-bottom';
  };
  
  // UI customization
  ui: {
    primaryColor?: string;
    icon?: string; // Optional icon identifier
    chartType?: 'candlestick' | 'line' | 'area';
  };
}

/**
 * Factory function to create ticker configurations
 */
export function createTickerConfig(
  ticker: string,
  overrides: Partial<TickerConfig> = {}
): TickerConfig {
  const upperTicker = ticker.toUpperCase();
  const lowerTicker = ticker.toLowerCase();
  
  const defaultConfig: TickerConfig = {
    ticker: upperTicker,
    displayName: upperTicker,
    description: `Real-time analysis and insights for ${upperTicker}`,
    
    tabKey: lowerTicker,
    tabLabel: upperTicker,
    
    pageName: `${upperTicker}-Tab`,
    contextName: `${lowerTicker}Analysis`,
    
    features: {
      aiKeyTakeaways: true,
      aiOptionsAnalysis: true,
      advancedChat: true,
      optionsChain: true,
      technicalAnalysis: true,
      webSearch: true,
    },
    
    defaults: {
      strikeCount: 30,
      optionType: 'both',
      tableDisplayType: 'side-by-side',
    },
    
    ui: {
      chartType: 'candlestick',
    },
    
    ...overrides,
  };
  
  // Deep merge features and defaults if provided in overrides
  if (overrides.features) {
    defaultConfig.features = { ...defaultConfig.features, ...overrides.features };
  }
  if (overrides.defaults) {
    defaultConfig.defaults = { ...defaultConfig.defaults, ...overrides.defaults };
  }
  if (overrides.ui) {
    defaultConfig.ui = { ...defaultConfig.ui, ...overrides.ui };
  }
  
  return defaultConfig;
}

/**
 * Pre-configured ticker configurations
 */
export const TICKER_CONFIGS: Record<string, TickerConfig> = {
  SPY: createTickerConfig('SPY', {
    displayName: 'SPDR S&P 500 ETF',
    description: 'Real-time analysis and insights for SPDR S&P 500 ETF Trust',
    ui: {
      primaryColor: '#0066CC',
      icon: 'chart-line',
    },
  }),
  
  NVDA: createTickerConfig('NVDA', {
    displayName: 'NVIDIA Corporation',
    description: 'Real-time analysis and insights for NVIDIA Corporation',
    ui: {
      primaryColor: '#76B900',
      icon: 'cpu',
    },
  }),
  
  AAPL: createTickerConfig('AAPL', {
    displayName: 'Apple Inc.',
    description: 'Real-time analysis and insights for Apple Inc.',
    ui: {
      primaryColor: '#A8DADC',
      icon: 'apple',
    },
  }),
  
  MSFT: createTickerConfig('MSFT', {
    displayName: 'Microsoft Corporation',
    description: 'Real-time analysis and insights for Microsoft Corporation',
    ui: {
      primaryColor: '#0078D4',
      icon: 'windows',
    },
  }),
  
  TSLA: createTickerConfig('TSLA', {
    displayName: 'Tesla, Inc.',
    description: 'Real-time analysis and insights for Tesla, Inc.',
    ui: {
      primaryColor: '#CC0000',
      icon: 'zap',
    },
  }),
  
  GOOGL: createTickerConfig('GOOGL', {
    displayName: 'Alphabet Inc.',
    description: 'Real-time analysis and insights for Alphabet Inc. Class A',
    ui: {
      primaryColor: '#4285F4',
      icon: 'search',
    },
  }),
  
  AMZN: createTickerConfig('AMZN', {
    displayName: 'Amazon.com, Inc.',
    description: 'Real-time analysis and insights for Amazon.com, Inc.',
    ui: {
      primaryColor: '#FF9900',
      icon: 'package',
    },
  }),
  
  META: createTickerConfig('META', {
    displayName: 'Meta Platforms, Inc.',
    description: 'Real-time analysis and insights for Meta Platforms, Inc.',
    ui: {
      primaryColor: '#0866FF',
      icon: 'share-2',
    },
  }),
  
  BRK_B: createTickerConfig('BRK.B', {
    displayName: 'Berkshire Hathaway Inc.',
    description: 'Real-time analysis and insights for Berkshire Hathaway Inc. Class B',
    tabKey: 'brk-b',
    tabLabel: 'BRK.B',
    pageName: 'BRK.B-Tab',
    contextName: 'brkBAnalysis',
    ui: {
      primaryColor: '#003366',
      icon: 'briefcase',
    },
  }),
  
  JPM: createTickerConfig('JPM', {
    displayName: 'JPMorgan Chase & Co.',
    description: 'Real-time analysis and insights for JPMorgan Chase & Co.',
    ui: {
      primaryColor: '#117ACA',
      icon: 'landmark',
    },
  }),
};

/**
 * Get ticker configuration by ticker symbol
 */
export function getTickerConfig(ticker: string): TickerConfig {
  const upperTicker = ticker.toUpperCase();
  return TICKER_CONFIGS[upperTicker] || createTickerConfig(ticker);
}

/**
 * Get all configured tickers
 */
export function getAllTickers(): string[] {
  return Object.keys(TICKER_CONFIGS);
}

/**
 * Validate if a ticker is pre-configured
 */
export function isConfiguredTicker(ticker: string): boolean {
  return ticker.toUpperCase() in TICKER_CONFIGS;
}