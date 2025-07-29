/**
 * @fileOverview Base Components Index
 * 
 * This file exports all base component templates and the component factory.
 * It provides a clean API for creating ticker-specific components.
 */

// Export the main factory function
export { createTickerComponents, createCompleteTickerSetup, type TickerComponents } from './component-factory';

// Export base component templates (for advanced usage)
export { BaseTabContent } from './base-tab-content';
export { BaseDataSection } from './base-data-section';
export { BaseConsolidatedChat } from './base-consolidated-chat';
export { BaseOptionsChainTable } from './base-options-chain-table';

// Export display component templates
export { BaseMarketStatusDisplay } from './displays/base-market-status-display';
export { BaseKeyMetricsDisplay } from './displays/base-key-metrics-display';
export { BaseStockSnapshotDisplay } from './displays/base-stock-snapshot-display';
export { BaseStandardTaDisplay } from './displays/base-standard-ta-display';
export { BaseAiAnalyzedTaDisplay } from './displays/base-ai-analyzed-ta-display';
export { BaseAiKeyTakeawaysDisplay } from './displays/base-ai-key-takeaways-display';
export { BaseAiOptionsAnalysisDisplay } from './displays/base-ai-options-analysis-display';

// Re-export types for convenience
export type { TickerConfig, TickerContextResult } from '../types';