/**
 * @fileOverview Ticker Tabs Component
 * 
 * A scalable tabs component that dynamically renders ticker tabs based on configuration.
 * Supports lazy loading and automatic tab generation for new tickers.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DynamicTickerTab, preRegisterTickers, tickerTabRegistry } from '@/lib/ticker-tab-registry';
import { getAllTickers } from '@/lib/ticker-config';
import { cn } from '@/lib/utils';

export interface TickerTabsProps {
  defaultTicker?: string;
  tickers?: string[];
  className?: string;
  tabListClassName?: string;
  enableUserInput?: boolean;
}

export function TickerTabs({ 
  defaultTicker = 'SPY',
  tickers,
  className,
  tabListClassName,
  enableUserInput = false
}: TickerTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTicker.toLowerCase());
  
  // Pre-register configured tickers on mount
  useEffect(() => {
    preRegisterTickers();
  }, []);
  
  // Get tickers to display
  const displayTickers = tickers || getAllTickers();
  
  // Calculate grid columns based on ticker count
  const getGridCols = (count: number) => {
    if (count <= 2) return 'grid-cols-2';
    if (count <= 3) return 'grid-cols-3';
    if (count <= 4) return 'grid-cols-4';
    if (count <= 6) return 'grid-cols-3 md:grid-cols-6';
    return 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6';
  };
  
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab}
      className={cn('w-full', className)}
    >
      <TabsList className={cn(
        'grid w-full',
        getGridCols(displayTickers.length + (enableUserInput ? 1 : 0)),
        tabListClassName
      )}>
        {displayTickers.map((ticker) => {
          const registration = tickerTabRegistry.get(ticker);
          const config = registration?.config;
          
          return (
            <TabsTrigger 
              key={ticker} 
              value={ticker.toLowerCase()}
              className="data-[state=active]:font-semibold"
            >
              {config?.tabLabel || ticker}
            </TabsTrigger>
          );
        })}
        
        {enableUserInput && (
          <TabsTrigger value="custom" className="data-[state=active]:font-semibold">
            Custom
          </TabsTrigger>
        )}
      </TabsList>
      
      {displayTickers.map((ticker) => (
        <TabsContent key={ticker} value={ticker.toLowerCase()} className="mt-4">
          <DynamicTickerTab ticker={ticker} />
        </TabsContent>
      ))}
      
      {enableUserInput && (
        <TabsContent value="custom" className="mt-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Custom ticker input coming soon</p>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}

/**
 * Preset ticker tab configurations for common use cases
 */
export const TICKER_TAB_PRESETS = {
  // Major indices
  indices: ['SPY', 'QQQ', 'DIA', 'IWM'] as string[],
  
  // Tech giants
  megaTech: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'] as string[],
  
  // Popular trading stocks
  popular: ['SPY', 'NVDA', 'TSLA', 'AAPL', 'MSFT'] as string[],
  
  // Full configured set
  all: getAllTickers(),
};

/**
 * Ticker tabs with preset configurations
 */
export function PresetTickerTabs({ 
  preset = 'popular',
  ...props 
}: Omit<TickerTabsProps, 'tickers'> & { 
  preset?: keyof typeof TICKER_TAB_PRESETS 
}) {
  return <TickerTabs tickers={TICKER_TAB_PRESETS[preset]} {...props} />;
}