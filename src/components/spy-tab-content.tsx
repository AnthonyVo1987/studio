/**
 * @fileOverview SPY Tab Content
 * 
 * Main tab content for SPY analysis, created using the component factory.
 * This ensures consistent UI patterns while maintaining SPY-specific functionality.
 */

'use client';

import { createTickerTabContent } from '@/lib/ticker-component-factory';
import { useSpyAnalysis, useSpyDispatch } from '@/contexts/spy-analysis-context';
import { TICKER_CONFIGS } from '@/lib/ticker-config';

// Create SPY tab content using factory
const SpyTabContent = createTickerTabContent({
  config: TICKER_CONFIGS.SPY,
  useAnalysis: useSpyAnalysis,
  useDispatch: useSpyDispatch,
});

export { SpyTabContent };