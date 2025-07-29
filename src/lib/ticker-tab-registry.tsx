/**
 * @fileOverview Ticker Tab Registry
 * 
 * This module provides a registry system for dynamically managing ticker tabs.
 * It enables scalable addition of new tickers without modifying core components.
 * 
 * Architecture Benefits:
 * - Dynamic tab generation from configuration
 * - Lazy loading of ticker components
 * - Automatic context isolation per ticker
 * - Scales to 10x+ tickers without code changes
 */

'use client';

import React, { lazy, Suspense } from 'react';
import type { TickerConfig } from './ticker-config';
import { createTickerContext } from './ticker-context-factory';
import { createTickerTabContent, createTickerLoadingSkeleton } from './ticker-component-factory';
import { TICKER_CONFIGS, createTickerConfig } from './ticker-config';

export interface TickerTabRegistration {
  config: TickerConfig;
  Provider: React.FC<{ children: React.ReactNode }>;
  TabContent: React.FC;
  LoadingSkeleton: React.FC;
}

/**
 * Registry for all ticker tabs
 */
class TickerTabRegistry {
  private registrations: Map<string, TickerTabRegistration> = new Map();
  
  /**
   * Register a ticker tab
   */
  register(ticker: string, config?: TickerConfig): TickerTabRegistration {
    const upperTicker = ticker.toUpperCase();
    
    // Check if already registered
    if (this.registrations.has(upperTicker)) {
      return this.registrations.get(upperTicker)!;
    }
    
    // Get or create config
    const tickerConfig = config || TICKER_CONFIGS[upperTicker] || createTickerConfig(ticker);
    
    // Create context
    const context = createTickerContext(tickerConfig);
    
    // Create components
    const TabContent = createTickerTabContent({
      config: tickerConfig,
      useAnalysis: context.useAnalysis,
      useDispatch: context.useDispatch,
    });
    
    const LoadingSkeleton = createTickerLoadingSkeleton({ config: tickerConfig });
    
    // Create registration
    const registration: TickerTabRegistration = {
      config: tickerConfig,
      Provider: context.Provider,
      TabContent,
      LoadingSkeleton,
    };
    
    // Store registration
    this.registrations.set(upperTicker, registration);
    
    return registration;
  }
  
  /**
   * Get a ticker tab registration
   */
  get(ticker: string): TickerTabRegistration | undefined {
    return this.registrations.get(ticker.toUpperCase());
  }
  
  /**
   * Get all registered tickers
   */
  getAllTickers(): string[] {
    return Array.from(this.registrations.keys());
  }
  
  /**
   * Check if a ticker is registered
   */
  has(ticker: string): boolean {
    return this.registrations.has(ticker.toUpperCase());
  }
  
  /**
   * Clear all registrations
   */
  clear(): void {
    this.registrations.clear();
  }
}

// Global registry instance
export const tickerTabRegistry = new TickerTabRegistry();

/**
 * Pre-register configured tickers
 */
export function preRegisterTickers() {
  Object.keys(TICKER_CONFIGS).forEach(ticker => {
    tickerTabRegistry.register(ticker);
  });
}

/**
 * Dynamic ticker tab component
 */
export interface DynamicTickerTabProps {
  ticker: string;
}

export const DynamicTickerTab: React.FC<DynamicTickerTabProps> = ({ ticker }) => {
  const registration = tickerTabRegistry.get(ticker);
  
  if (!registration) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ticker {ticker} not found</p>
      </div>
    );
  }
  
  const { Provider, TabContent, LoadingSkeleton } = registration;
  
  return (
    <Provider>
      <Suspense fallback={<LoadingSkeleton />}>
        <TabContent />
      </Suspense>
    </Provider>
  );
};

/**
 * Hook to get ticker tab configuration
 */
export function useTickerTab(ticker: string): TickerTabRegistration | undefined {
  // Register if not already registered
  if (!tickerTabRegistry.has(ticker)) {
    tickerTabRegistry.register(ticker);
  }
  
  return tickerTabRegistry.get(ticker);
}