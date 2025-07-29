/**
 * @fileOverview Ticker Expansion Demonstration
 * 
 * This file demonstrates how easy it is to add new tickers to the system.
 * The modular architecture supports scaling to 5-10x more tickers with minimal effort.
 */

import { createTickerConfig, TICKER_CONFIGS } from './ticker-config';

/**
 * Example 1: Adding a single new ticker with custom configuration
 */
export function addCustomTicker() {
  // Add Netflix with custom settings
  const netflixConfig = createTickerConfig('NFLX', {
    displayName: 'Netflix, Inc.',
    description: 'Real-time analysis for streaming entertainment leader',
    defaults: {
      strikeCount: 40, // More strikes for volatile stock
      optionType: 'both',
      tableDisplayType: 'top-bottom',
    },
    ui: {
      primaryColor: '#E50914',
      icon: 'tv',
      chartType: 'candlestick',
    },
  });
  
  // This ticker is now available throughout the app
  return netflixConfig;
}

/**
 * Example 2: Batch adding multiple tickers
 */
export function addBatchTickers() {
  const newTickers = {
    // Banking sector
    BAC: createTickerConfig('BAC', {
      displayName: 'Bank of America Corporation',
      ui: { primaryColor: '#012169', icon: 'landmark' },
    }),
    
    WFC: createTickerConfig('WFC', {
      displayName: 'Wells Fargo & Company',
      ui: { primaryColor: '#D71E2B', icon: 'landmark' },
    }),
    
    GS: createTickerConfig('GS', {
      displayName: 'The Goldman Sachs Group, Inc.',
      ui: { primaryColor: '#7399C6', icon: 'landmark' },
    }),
    
    // Energy sector
    XOM: createTickerConfig('XOM', {
      displayName: 'Exxon Mobil Corporation',
      ui: { primaryColor: '#F01716', icon: 'fuel' },
    }),
    
    CVX: createTickerConfig('CVX', {
      displayName: 'Chevron Corporation',
      ui: { primaryColor: '#0066B3', icon: 'fuel' },
    }),
    
    // Retail sector
    WMT: createTickerConfig('WMT', {
      displayName: 'Walmart Inc.',
      ui: { primaryColor: '#0071CE', icon: 'shopping-cart' },
    }),
    
    TGT: createTickerConfig('TGT', {
      displayName: 'Target Corporation',
      ui: { primaryColor: '#CC0000', icon: 'target' },
    }),
    
    COST: createTickerConfig('COST', {
      displayName: 'Costco Wholesale Corporation',
      ui: { primaryColor: '#005DAA', icon: 'shopping-cart' },
    }),
  };
  
  return newTickers;
}

/**
 * Example 3: Creating sector-specific ticker groups
 */
export const SECTOR_TICKERS = {
  technology: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'INTC', 'AMD', 'CRM', 'ORCL', 'ADBE'],
  finance: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC', 'TFC', 'SCHW'],
  healthcare: ['JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'MRK', 'ABT', 'DHR', 'CVS', 'MDT'],
  consumer: ['AMZN', 'TSLA', 'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'COST', 'LOW'],
  energy: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'PXD', 'OXY'],
  indices: ['SPY', 'QQQ', 'DIA', 'IWM', 'VOO', 'VTI', 'EFA', 'EEM', 'GLD', 'TLT'],
} as const;

/**
 * Example 4: Dynamic ticker addition based on user preferences
 */
export function createUserWatchlist(userTickers: string[]) {
  const watchlistConfigs: Record<string, ReturnType<typeof createTickerConfig>> = {};
  
  userTickers.forEach(ticker => {
    // Check if already configured
    if (!TICKER_CONFIGS[ticker]) {
      // Create new configuration dynamically
      watchlistConfigs[ticker] = createTickerConfig(ticker);
    }
  });
  
  return watchlistConfigs;
}

/**
 * Example 5: Adding tickers with special features
 */
export function addSpecializedTickers() {
  return {
    // Crypto-related stocks with extended hours
    COIN: createTickerConfig('COIN', {
      displayName: 'Coinbase Global, Inc.',
      description: 'Cryptocurrency exchange platform',
      features: {
        aiKeyTakeaways: true,
        aiOptionsAnalysis: true,
        advancedChat: true,
        optionsChain: true,
        technicalAnalysis: true,
        webSearch: true, // Extra important for crypto news
      },
      ui: {
        primaryColor: '#0052FF',
        icon: 'bitcoin',
      },
    }),
    
    // High-dividend stocks with different defaults
    T: createTickerConfig('T', {
      displayName: 'AT&T Inc.',
      description: 'Telecommunications and dividend stock',
      defaults: {
        strikeCount: 20, // Less volatile, fewer strikes needed
        optionType: 'puts', // Income generation focus
        tableDisplayType: 'side-by-side',
      },
      ui: {
        primaryColor: '#009FDB',
        icon: 'phone',
      },
    }),
    
    // Penny stocks with limited features
    SNDL: createTickerConfig('SNDL', {
      displayName: 'SNDL Inc.',
      description: 'Cannabis sector penny stock',
      features: {
        aiKeyTakeaways: true,
        aiOptionsAnalysis: false, // Limited options liquidity
        advancedChat: true,
        optionsChain: false, // May not have options
        technicalAnalysis: true,
        webSearch: true,
      },
      ui: {
        primaryColor: '#00A652',
        icon: 'leaf',
      },
    }),
  };
}

/**
 * Demonstration: Scale to 50+ tickers easily
 */
export function generateMassiveTickers() {
  // S&P 500 top 50 companies
  const sp500Top50 = [
    'AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'META', 'TSLA', 'BRK.B', 'UNH', 'JNJ',
    'XOM', 'JPM', 'V', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'LLY', 'ABBV',
    'BAC', 'PFE', 'KO', 'PEP', 'COST', 'WMT', 'MCD', 'DIS', 'CSCO', 'ACN',
    'ADBE', 'TMO', 'ABT', 'VZ', 'CRM', 'NKE', 'CMCSA', 'NEE', 'NFLX', 'BMY',
    'DHR', 'WFC', 'TXN', 'COP', 'PM', 'RTX', 'UNP', 'HON', 'SCHW', 'LOW',
  ];
  
  const configs: Record<string, ReturnType<typeof createTickerConfig>> = {};
  
  sp500Top50.forEach(ticker => {
    if (!TICKER_CONFIGS[ticker]) {
      configs[ticker] = createTickerConfig(ticker);
    }
  });
  
  return configs;
}

/**
 * Usage in components:
 * 
 * 1. Single ticker page:
 *    <TickerTabs tickers={['NFLX']} />
 * 
 * 2. Sector-specific page:
 *    <TickerTabs tickers={SECTOR_TICKERS.technology} />
 * 
 * 3. All configured tickers:
 *    <PresetTickerTabs preset="all" />
 * 
 * 4. Custom watchlist:
 *    const userTickers = ['AAPL', 'TSLA', 'BTC', 'CUSTOM'];
 *    <TickerTabs tickers={userTickers} />
 * 
 * 5. Dynamic addition:
 *    tickerTabRegistry.register('NEW_TICKER');
 */