/**
 * @fileOverview Component Factory for Ticker Framework
 * 
 * This factory generates complete component sets for ticker-specific tabs
 * using the base component templates. It creates all 11 components needed
 * for a complete ticker analysis interface.
 * 
 * Features:
 * - Type-safe component generation
 * - Consistent prop patterns across all components
 * - Automatic ticker parameterization
 * - Tree-shaking friendly exports
 */

import { ComponentType } from 'react';
import type { TickerConfig, TickerContextResult } from '../types';

// Import all base component templates
import { BaseTabContent } from './base-tab-content';
import { BaseDataSection } from './base-data-section';
import { BaseConsolidatedChat } from './base-consolidated-chat';
import { BaseOptionsChainTable } from './base-options-chain-table';

// Display components
import { BaseMarketStatusDisplay } from './displays/base-market-status-display';
import { BaseKeyMetricsDisplay } from './displays/base-key-metrics-display';
import { BaseStockSnapshotDisplay } from './displays/base-stock-snapshot-display';
import { BaseStandardTaDisplay } from './displays/base-standard-ta-display';
import { BaseAiAnalyzedTaDisplay } from './displays/base-ai-analyzed-ta-display';
import { BaseAiKeyTakeawaysDisplay } from './displays/base-ai-key-takeaways-display';
import { BaseAiOptionsAnalysisDisplay } from './displays/base-ai-options-analysis-display';

/**
 * Complete set of components for a ticker analysis tab
 */
export interface TickerComponents<T extends TickerConfig> {
  // Main orchestrator component
  TabContent: ComponentType<{
    tickerPage?: string;  // Optional page identifier for logging
    chatAction?: (params: any) => Promise<any>; // Optional chat server action
  }>;
  
  // Data and utility components
  DataSection: ComponentType<{}>;
  ConsolidatedChat: ComponentType<{
    chatAction?: (params: any) => Promise<any>;
  }>;
  OptionsChainTable: ComponentType<{}>;
  
  // Display components
  MarketStatusDisplay: ComponentType<{}>;
  KeyMetricsDisplay: ComponentType<{}>;
  StockSnapshotDisplay: ComponentType<{}>;
  StandardTaDisplay: ComponentType<{}>;
  AiAnalyzedTaDisplay: ComponentType<{}>;
  AiKeyTakeawaysDisplay: ComponentType<{}>;
  AiOptionsAnalysisDisplay: ComponentType<{}>;
}

/**
 * Component factory function that creates all components for a ticker
 * 
 * @param config - Ticker configuration object
 * @param context - Generated ticker context from context factory
 * @returns Complete set of components bound to the ticker configuration
 */
export function createTickerComponents<T extends TickerConfig>(
  config: T,
  context: TickerContextResult<T>
): TickerComponents<T> {
  
  // Create bound display components
  const MarketStatusDisplay: ComponentType<{}> = () => 
    BaseMarketStatusDisplay({ config, context });
    
  const KeyMetricsDisplay: ComponentType<{}> = () => 
    BaseKeyMetricsDisplay({ config, context });
    
  const StockSnapshotDisplay: ComponentType<{}> = () => 
    BaseStockSnapshotDisplay({ config, context });
    
  const StandardTaDisplay: ComponentType<{}> = () => 
    BaseStandardTaDisplay({ config, context });
    
  const AiAnalyzedTaDisplay: ComponentType<{}> = () => 
    BaseAiAnalyzedTaDisplay({ config, context });
    
  const AiKeyTakeawaysDisplay: ComponentType<{}> = () => 
    BaseAiKeyTakeawaysDisplay({ config, context });
    
  const AiOptionsAnalysisDisplay: ComponentType<{}> = () => 
    BaseAiOptionsAnalysisDisplay({ config, context });

  // Create bound utility components
  const DataSection: ComponentType<{}> = () => 
    BaseDataSection({ config, context });
    
  const OptionsChainTable: ComponentType<{}> = () => 
    BaseOptionsChainTable({ config, context });
    
  const ConsolidatedChat: ComponentType<{
    chatAction?: (params: any) => Promise<any>;
  }> = ({ chatAction }) => 
    BaseConsolidatedChat({ config, context, chatAction });

  // Create main tab content orchestrator
  const TabContent: ComponentType<{
    tickerPage?: string;
    chatAction?: (params: any) => Promise<any>;
  }> = ({ tickerPage, chatAction }) => 
    BaseTabContent({
      config,
      context,
      DataSection,
      MarketStatusDisplay,
      KeyMetricsDisplay,
      StockSnapshotDisplay,
      StandardTaDisplay,
      AiAnalyzedTaDisplay,
      OptionsChainTable,
      AiKeyTakeawaysDisplay,
      AiOptionsAnalysisDisplay,
      ConsolidatedChat: () => ConsolidatedChat({ chatAction }),
      tickerPage: tickerPage as keyof typeof import('@/lib/ticker-logger').TICKER_PAGES,
    });

  return {
    TabContent,
    DataSection,
    ConsolidatedChat,
    OptionsChainTable,
    MarketStatusDisplay,
    KeyMetricsDisplay,
    StockSnapshotDisplay,
    StandardTaDisplay,
    AiAnalyzedTaDisplay,
    AiKeyTakeawaysDisplay,
    AiOptionsAnalysisDisplay,
  };
}

/**
 * Utility function to create a complete ticker analysis setup
 * This combines the context factory and component factory for convenience
 * 
 * @param config - Ticker configuration object
 * @param contextFactory - Context factory function
 * @returns Object containing both context and components
 */
export function createCompleteTickerSetup<T extends TickerConfig>(
  config: T,
  contextFactory: (config: T) => TickerContextResult<T>
) {
  const context = contextFactory(config);
  const components = createTickerComponents(config, context);
  
  return {
    config,
    context,
    components,
    // Convenience exports
    Provider: context.Provider,
    hooks: context.hooks,
    setters: context.setters,
  };
}

/**
 * Example usage function (for documentation purposes)
 * This shows how to use the component factory in practice
 */
export function exampleUsage() {
  // This is commented out to avoid import errors in the template
  // 
  // import { createTickerContext } from '../context-factory';
  // 
  // // 1. Define ticker configuration
  // const spyConfig: TickerConfig = {
  //   ticker: 'SPY',
  //   displayName: 'SPY (SPDR S&P 500 ETF)',
  //   defaultStrikeCount: 30,
  //   defaultTableDisplay: 'side-by-side',
  // };
  // 
  // // 2. Create context and components
  // const setup = createCompleteTickerSetup(spyConfig, createTickerContext);
  // 
  // // 3. Use in your page component
  // export default function SPYPage() {
  //   return (
  //     <setup.Provider>
  //       <setup.components.TabContent tickerPage="SPY_TAB" />
  //     </setup.Provider>
  //   );
  // }
  // 
  // // 4. Or use individual components
  // export function CustomSPYLayout() {
  //   return (
  //     <setup.Provider>
  //       <div className="grid grid-cols-2 gap-4">
  //         <setup.components.MarketStatusDisplay />
  //         <setup.components.KeyMetricsDisplay />
  //       </div>
  //       <setup.components.ConsolidatedChat />
  //     </setup.Provider>
  //   );
  // }
}

/**
 * Migration helper for existing components
 * This function helps migrate from ticker-specific components to factory-generated ones
 */
export interface MigrationGuide {
  fromComponent: string;
  toFactoryUsage: string;
  notes: string;
}

export const migrationGuide: MigrationGuide[] = [
  {
    fromComponent: 'NvdaTabContent',
    toFactoryUsage: 'setup.components.TabContent',
    notes: 'Replace direct component usage with factory-generated component'
  },
  {
    fromComponent: 'NvdaMarketStatusDisplay',
    toFactoryUsage: 'setup.components.MarketStatusDisplay',
    notes: 'All display components follow the same pattern'
  },
  {
    fromComponent: 'useNvdaAnalysis',
    toFactoryUsage: 'setup.hooks.useState',
    notes: 'Hook names are now generic across all tickers'
  },
  {
    fromComponent: 'useNvdaDispatch',
    toFactoryUsage: 'setup.hooks.useDispatch',
    notes: 'Dispatch functions are identical across tickers'
  },
  {
    fromComponent: 'NVDA_TICKER constant',
    toFactoryUsage: 'setup.config.ticker',
    notes: 'Ticker symbol is now part of configuration'
  },
];

/**
 * Performance considerations for component factory usage:
 * 
 * 1. Tree Shaking: Only import components you actually use
 * 2. Code Splitting: Use dynamic imports for large ticker setups
 * 3. Memoization: Components are created once per ticker configuration
 * 4. Bundle Size: Base templates are shared across all tickers
 * 
 * Example of optimized usage:
 * 
 * // Only create components you need
 * const { MarketStatusDisplay, KeyMetricsDisplay } = createTickerComponents(config, context);
 * 
 * // Use dynamic imports for code splitting
 * const TickerComponents = lazy(() => import('./ticker-components').then(module => ({
 *   default: () => module.createTickerComponents(config, context).TabContent
 * })));
 */