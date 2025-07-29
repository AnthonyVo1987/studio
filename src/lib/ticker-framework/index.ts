/**
 * @fileOverview Ticker Framework - Main Export File
 * 
 * This file exports all the components of the ticker framework
 * for creating isolated ticker contexts in StockSage v4.4.2.0
 */

// Core exports
export { createTickerContext } from './core/context-factory';
export type {
  TickerConfig,
  TickerAnalysisState,
  TickerAnalysisAction,
  TickerContextResult,
  TickerSetterFunctions,
  OptionType,
  StrikeCount,
  TableDisplayType,
} from './core/types';

// Re-export commonly used types for convenience
export type { Dispatch } from 'react';