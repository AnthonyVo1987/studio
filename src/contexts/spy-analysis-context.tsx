/**
 * @fileOverview SPY Analysis Context
 * 
 * Dedicated context for SPY (SPDR S&P 500 ETF) analysis.
 * Created using the ticker context factory for complete isolation.
 */

'use client';

import { createTickerContext } from '@/lib/ticker-context-factory';
import { TICKER_CONFIGS } from '@/lib/ticker-config';

// Get SPY configuration
const spyConfig = TICKER_CONFIGS.SPY;

// Create SPY-specific context using factory
const spyContext = createTickerContext(spyConfig);

// Export SPY-specific provider and hooks
export const SpyAnalysisProvider = spyContext.Provider;
export const useSpyAnalysis = spyContext.useAnalysis;
export const useSpyDispatch = spyContext.useDispatch;