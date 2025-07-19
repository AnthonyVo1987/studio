/**
 * Shared constants for StockSage application
 * Consolidates repeated constants across components for better maintainability
 */

// JSON status variants for pending/loading states
export const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }',
  '{ "status": "no_analysis_run_yet" }'
] as const

// JSON status variants for error states
export const ERROR_STATUS_JSON_VARIANTS = [
  '{ "status": "error" }',
  '{ "error": "',
  '"error":'
] as const

// JSON status indicators for successful data
export const SUCCESS_STATUS_INDICATORS = [
  '"takeaways"',
  '"analysis"', 
  '"summary"',
  '"snapshot"',
  '"metrics"',
  '"options"'
] as const

// Common JSON validation patterns
export const EMPTY_JSON_PATTERNS = [
  '{}',
  '',
  'null',
  'undefined'
] as const

// Export constants for easy access
export type PendingStatusVariant = typeof PENDING_STATUS_JSON_VARIANTS[number]
export type ErrorStatusVariant = typeof ERROR_STATUS_JSON_VARIANTS[number]
export type SuccessStatusIndicator = typeof SUCCESS_STATUS_INDICATORS[number]