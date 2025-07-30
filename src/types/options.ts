/**
 * @fileOverview Types for options trading functionality
 * Previously located in staging-options-context, consolidated during token reduction
 */

export type OptionType = 'calls' | 'puts' | 'both';
export type StrikeCount = number; // Default 20, typically 10, 15, 20, 25, 30