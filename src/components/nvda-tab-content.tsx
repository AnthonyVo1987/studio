/**
 * @fileOverview NVDA Tab Content
 * 
 * Main tab content for NVDA analysis, created using the component factory.
 * This ensures consistent UI patterns while maintaining NVDA-specific functionality.
 */

'use client';

import { createTickerTabContent } from '@/lib/ticker-component-factory';
import { useNvdaAnalysis, useNvdaDispatch } from '@/contexts/nvda-analysis-context';
import { TICKER_CONFIGS } from '@/lib/ticker-config';

// Create NVDA tab content using factory
const NvdaTabContent = createTickerTabContent({
  config: TICKER_CONFIGS.NVDA,
  useAnalysis: useNvdaAnalysis,
  useDispatch: useNvdaDispatch,
});

export { NvdaTabContent };