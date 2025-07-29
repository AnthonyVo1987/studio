/**
 * @fileOverview Ticker Registry System
 * 
 * Central registry for managing available tickers in the StockSage application.
 * Provides auto-discovery, dynamic loading, and runtime management of ticker tabs.
 * 
 * Features:
 * - Auto-discovery of ticker configurations
 * - Dynamic enable/disable of ticker tabs
 * - Integration with build-time generation
 * - Runtime ticker management
 * - Type-safe ticker loading
 */

import { lazy, ComponentType } from 'react';
import type { DynamicTickerConfig } from '@/config/ticker-configs';
import { getEnabledTickers, getTickerConfig, TICKER_CONFIGS } from '@/config/ticker-configs';
import { createTickerContext } from '@/lib/ticker-framework/core/context-factory';
import { createTickerComponents, type TickerComponents } from '@/lib/ticker-framework/core/base-components/component-factory';
import type { TickerConfig, TickerContextResult } from '@/lib/ticker-framework/core/types';

/**
 * Registry entry for a single ticker
 */
export interface TickerRegistryEntry {
  config: DynamicTickerConfig;
  context: TickerContextResult<DynamicTickerConfig>;
  components: TickerComponents<DynamicTickerConfig>;
  
  // Lazy-loaded components for code splitting
  lazyComponents?: {
    TabContent: ComponentType<any>;
    DataSection: ComponentType<any>;
    ConsolidatedChat: ComponentType<any>;
  };
  
  // Runtime status
  status: 'registered' | 'loading' | 'loaded' | 'error';
  error?: string;
  loadedAt?: Date;
}

/**
 * Complete ticker registry state
 */
export interface TickerRegistryState {
  entries: Map<string, TickerRegistryEntry>;
  loadingOrder: string[];
  initialized: boolean;
  lastUpdated: Date;
}

/**
 * Ticker Registry Manager
 */
class TickerRegistryManager {
  private state: TickerRegistryState = {
    entries: new Map(),
    loadingOrder: [],
    initialized: false,
    lastUpdated: new Date(),
  };
  
  private initializationPromise: Promise<void> | null = null;
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize the registry with all enabled tickers
   */
  private async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }
  
  private async _doInitialize(): Promise<void> {
    console.log('[TickerRegistry] Initializing ticker registry...');
    
    try {
      const enabledTickers = getEnabledTickers();
      console.log(`[TickerRegistry] Found ${enabledTickers.length} enabled tickers:`, 
        enabledTickers.map(t => t.ticker).join(', '));
      
      // Register all enabled tickers
      for (const config of enabledTickers) {
        try {
          await this.registerTicker(config);
        } catch (error) {
          console.error(`[TickerRegistry] Failed to register ticker ${config.ticker}:`, error);
          
          // Create error entry
          this.state.entries.set(config.ticker, {
            config,
            context: null as any,
            components: null as any,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      this.state.initialized = true;
      this.state.lastUpdated = new Date();
      this.state.loadingOrder = enabledTickers.map(t => t.ticker);
      
      console.log('[TickerRegistry] Registry initialization complete');
      console.log('[TickerRegistry] Registry state:', this.getRegistryStats());
      
    } catch (error) {
      console.error('[TickerRegistry] Failed to initialize registry:', error);
      throw error;
    }
  }
  
  /**
   * Register a single ticker
   */
  private async registerTicker(config: DynamicTickerConfig): Promise<void> {
    console.log(`[TickerRegistry] Registering ticker: ${config.ticker}`);
    
    try {
      // Create context using factory
      const context = createTickerContext(config);
      
      // Create components using factory
      const components = createTickerComponents(config, context);
      
      // Create lazy components for code splitting
      const lazyComponents = this.createLazyComponents(config, components);
      
      // Create registry entry
      const entry: TickerRegistryEntry = {
        config,
        context,
        components,
        lazyComponents,
        status: 'loaded',
        loadedAt: new Date(),
      };
      
      // Store in registry
      this.state.entries.set(config.ticker, entry);
      
      console.log(`[TickerRegistry] Successfully registered ticker: ${config.ticker}`);
      
    } catch (error) {
      console.error(`[TickerRegistry] Failed to register ticker ${config.ticker}:`, error);
      throw error;
    }
  }
  
  /**
   * Create lazy-loaded components for code splitting
   */
  private createLazyComponents(
    config: DynamicTickerConfig, 
    components: TickerComponents<DynamicTickerConfig>
  ) {
    // For now, we'll just wrap the regular components
    // In the future, these could be true lazy imports from separate modules
    return {
      TabContent: lazy(() => Promise.resolve({ 
        default: components.TabContent 
      })),
      DataSection: lazy(() => Promise.resolve({ 
        default: components.DataSection 
      })),
      ConsolidatedChat: lazy(() => Promise.resolve({ 
        default: components.ConsolidatedChat 
      })),
    };
  }
  
  /**
   * Get all registered tickers
   */
  public async getRegisteredTickers(): Promise<TickerRegistryEntry[]> {
    await this.initialize();
    
    return Array.from(this.state.entries.values())
      .filter(entry => entry.status === 'loaded')
      .sort((a, b) => a.config.order - b.config.order);
  }
  
  /**
   * Get a specific ticker entry
   */
  public async getTicker(ticker: string): Promise<TickerRegistryEntry | undefined> {
    await this.initialize();
    return this.state.entries.get(ticker.toUpperCase());
  }
  
  /**
   * Check if a ticker is registered and loaded
   */
  public async isTickerAvailable(ticker: string): Promise<boolean> {
    const entry = await this.getTicker(ticker);
    return entry?.status === 'loaded';
  }
  
  /**
   * Get ticker components (with auto-loading)
   */
  public async getTickerComponents(ticker: string): Promise<TickerComponents<DynamicTickerConfig> | null> {
    const entry = await this.getTicker(ticker);
    return entry?.status === 'loaded' ? entry.components : null;
  }
  
  /**
   * Get ticker context (with auto-loading)
   */
  public async getTickerContext(ticker: string): Promise<TickerContextResult<DynamicTickerConfig> | null> {
    const entry = await this.getTicker(ticker);
    return entry?.status === 'loaded' ? entry.context : null;
  }
  
  /**
   * Dynamically enable a ticker at runtime
   */
  public async enableTicker(ticker: string): Promise<boolean> {
    console.log(`[TickerRegistry] Attempting to enable ticker: ${ticker}`);
    
    const config = getTickerConfig(ticker);
    if (!config) {
      console.error(`[TickerRegistry] Ticker ${ticker} not found in configuration`);
      return false;
    }
    
    // Check if already registered
    const existing = this.state.entries.get(ticker);
    if (existing?.status === 'loaded') {
      console.log(`[TickerRegistry] Ticker ${ticker} already enabled`);
      return true;
    }
    
    try {
      // Enable in configuration
      config.enabled = true;
      
      // Register the ticker
      await this.registerTicker(config);
      
      // Update loading order
      this.updateLoadingOrder();
      
      console.log(`[TickerRegistry] Successfully enabled ticker: ${ticker}`);
      return true;
      
    } catch (error) {
      console.error(`[TickerRegistry] Failed to enable ticker ${ticker}:`, error);
      return false;
    }
  }
  
  /**
   * Dynamically disable a ticker at runtime
   */
  public async disableTicker(ticker: string): Promise<boolean> {
    console.log(`[TickerRegistry] Attempting to disable ticker: ${ticker}`);
    
    const config = getTickerConfig(ticker);
    if (!config) {
      console.error(`[TickerRegistry] Ticker ${ticker} not found in configuration`);
      return false;
    }
    
    try {
      // Disable in configuration
      config.enabled = false;
      
      // Remove from registry
      this.state.entries.delete(ticker);
      
      // Update loading order
      this.updateLoadingOrder();
      
      console.log(`[TickerRegistry] Successfully disabled ticker: ${ticker}`);
      return true;
      
    } catch (error) {
      console.error(`[TickerRegistry] Failed to disable ticker ${ticker}:`, error);
      return false;
    }
  }
  
  /**
   * Update the loading order based on current configuration
   */
  private updateLoadingOrder(): void {
    const enabledTickers = getEnabledTickers();
    this.state.loadingOrder = enabledTickers.map(t => t.ticker);
    this.state.lastUpdated = new Date();
  }
  
  /**
   * Reload the entire registry
   */
  public async reload(): Promise<void> {
    console.log('[TickerRegistry] Reloading registry...');
    
    // Clear current state
    this.state.entries.clear();
    this.state.initialized = false;
    this.initializationPromise = null;
    
    // Reinitialize
    await this.initialize();
  }
  
  /**
   * Get registry statistics
   */
  public getRegistryStats() {
    const entries = Array.from(this.state.entries.values());
    
    return {
      total: entries.length,
      loaded: entries.filter(e => e.status === 'loaded').length,
      loading: entries.filter(e => e.status === 'loading').length,
      error: entries.filter(e => e.status === 'error').length,
      initialized: this.state.initialized,
      lastUpdated: this.state.lastUpdated,
      loadingOrder: this.state.loadingOrder,
    };
  }
  
  /**
   * Get all provider components for dynamic provider orchestration
   */
  public async getAllProviders(): Promise<Array<{
    ticker: string;
    Provider: React.FC<{ children: React.ReactNode }>;
    order: number;
  }>> {
    await this.initialize();
    
    const entries = Array.from(this.state.entries.values())
      .filter(entry => entry.status === 'loaded')
      .sort((a, b) => a.config.order - b.config.order);
    
    return entries.map(entry => ({
      ticker: entry.config.ticker,
      Provider: entry.context.Provider,
      order: entry.config.order,
    }));
  }
  
  /**
   * Debug utilities
   */
  public debug = {
    /**
     * Get full registry state for debugging
     */
    getFullState: () => {
      return {
        state: this.state,
        stats: this.getRegistryStats(),
      };
    },
    
    /**
     * Get detailed ticker information
     */
    getTickerDetails: async (ticker: string) => {
      const entry = await this.getTicker(ticker);
      if (!entry) return null;
      
      return {
        config: entry.config,
        status: entry.status,
        error: entry.error,
        loadedAt: entry.loadedAt,
        hasContext: !!entry.context,
        hasComponents: !!entry.components,
        hasLazyComponents: !!entry.lazyComponents,
      };
    },
    
    /**
     * Test ticker loading
     */
    testTickerLoad: async (ticker: string) => {
      console.log(`[TickerRegistry] Testing load for ticker: ${ticker}`);
      
      try {
        const entry = await this.getTicker(ticker);
        const components = await this.getTickerComponents(ticker);
        const context = await this.getTickerContext(ticker);
        
        return {
          success: true,
          hasEntry: !!entry,
          hasComponents: !!components,
          hasContext: !!context,
          status: entry?.status,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  };
}

// Create singleton instance
export const tickerRegistry = new TickerRegistryManager();

/**
 * React hook for accessing ticker registry
 */
export function useTickerRegistry() {
  return {
    /**
     * Get all registered tickers
     */
    getTickers: () => tickerRegistry.getRegisteredTickers(),
    
    /**
     * Get specific ticker
     */
    getTicker: (ticker: string) => tickerRegistry.getTicker(ticker),
    
    /**
     * Check if ticker is available
     */
    isAvailable: (ticker: string) => tickerRegistry.isTickerAvailable(ticker),
    
    /**
     * Get ticker components
     */
    getComponents: (ticker: string) => tickerRegistry.getTickerComponents(ticker),
    
    /**
     * Get ticker context
     */
    getContext: (ticker: string) => tickerRegistry.getTickerContext(ticker),
    
    /**
     * Runtime management
     */
    enable: (ticker: string) => tickerRegistry.enableTicker(ticker),
    disable: (ticker: string) => tickerRegistry.disableTicker(ticker),
    reload: () => tickerRegistry.reload(),
    
    /**
     * Registry information
     */
    getStats: () => tickerRegistry.getRegistryStats(),
    debug: tickerRegistry.debug,
  };
}

/**
 * Utility functions for common operations
 */
export const TickerRegistryUtils = {
  /**
   * Get enabled ticker symbols as array
   */
  getEnabledTickerSymbols: async (): Promise<string[]> => {
    const tickers = await tickerRegistry.getRegisteredTickers();
    return tickers.map(t => t.config.ticker);
  },
  
  /**
   * Get ticker configurations for tabs
   */
  getTickerTabConfigs: async () => {
    const tickers = await tickerRegistry.getRegisteredTickers();
    return tickers.map(entry => ({
      ticker: entry.config.ticker,
      displayName: entry.config.displayName,
      description: entry.config.description,
      accentColor: entry.config.accentColor,
      category: entry.config.category,
      order: entry.config.order,
    }));
  },
  
  /**
   * Pre-load all registered tickers
   */
  preloadAll: async (): Promise<void> => {
    console.log('[TickerRegistry] Pre-loading all registered tickers...');
    const tickers = await tickerRegistry.getRegisteredTickers();
    console.log(`[TickerRegistry] Pre-loading complete. ${tickers.length} tickers ready.`);
  },
};