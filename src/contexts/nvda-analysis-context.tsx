/**
 * @fileOverview NVDA Analysis Context
 * 
 * Dedicated context for NVDA (NVIDIA Corporation) analysis.
 * Created using the ticker context factory for complete isolation.
 */

'use client';

import { createTickerContext } from '@/lib/ticker-context-factory';
import { TICKER_CONFIGS } from '@/lib/ticker-config';

// Get NVDA configuration
const nvdaConfig = TICKER_CONFIGS.NVDA;

// Create NVDA-specific context using factory
const nvdaContext = createTickerContext(nvdaConfig);

// Export NVDA-specific provider and hooks
export const NvdaAnalysisProvider = nvdaContext.Provider;
export const useNvdaAnalysis = nvdaContext.useAnalysis;
export const useNvdaDispatch = nvdaContext.useDispatch;