# Ticker Framework Component Usage Examples

This guide demonstrates how to use the reusable component template system to create ticker-specific analysis tabs with minimal code duplication.

## Quick Start Example

```typescript
// 1. Import the necessary functions
import { createTickerContext } from '@/lib/ticker-framework/core/context-factory';
import { createCompleteTickerSetup } from '@/lib/ticker-framework/core/base-components';
import type { TickerConfig } from '@/lib/ticker-framework/core/types';

// 2. Define your ticker configuration
const appleConfig: TickerConfig = {
  ticker: 'AAPL',
  displayName: 'Apple Inc. (AAPL)',
  defaultStrikeCount: 30,
  defaultTableDisplay: 'side-by-side',
};

// 3. Create the complete setup
const appleSetup = createCompleteTickerSetup(appleConfig, createTickerContext);

// 4. Create your page component
export default function ApplePage() {
  return (
    <appleSetup.Provider>
      <appleSetup.components.TabContent 
        tickerPage="APPLE_TAB"
        chatAction={appleChatAction} // Optional: implement ticker-specific chat
      />
    </appleSetup.Provider>
  );
}
```

That's it! You now have a fully functional Apple analysis tab with all 11 components.

## Step-by-Step Implementation Guide

### Step 1: Define Ticker Configuration

```typescript
const tickerConfig: TickerConfig = {
  ticker: 'MSFT',           // Stock symbol
  displayName: 'Microsoft Corporation', // Human-readable name
  defaultStrikeCount: 40,   // Default options strikes to show
  defaultTableDisplay: 'top-bottom', // Default table layout
  customSettings: {         // Optional custom settings
    sector: 'Technology',
    marketCap: 'Large',
  }
};
```

### Step 2: Create Context and Components

```typescript
import { createTickerContext } from '@/lib/ticker-framework/core/context-factory';
import { createTickerComponents } from '@/lib/ticker-framework/core/base-components';

// Create isolated context
const microsoftContext = createTickerContext(tickerConfig);

// Create all components
const microsoftComponents = createTickerComponents(tickerConfig, microsoftContext);

// Export for use in your application
export { microsoftContext, microsoftComponents };
```

### Step 3: Use Components in Your Page

```typescript
export default function MicrosoftPage() {
  return (
    <microsoftContext.Provider>
      <div className="space-y-6">
        {/* Full tab content (includes everything) */}
        <microsoftComponents.TabContent tickerPage="MSFT_TAB" />
        
        {/* Or use individual components for custom layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <microsoftComponents.MarketStatusDisplay />
          <microsoftComponents.KeyMetricsDisplay />
        </div>
        
        <microsoftComponents.ConsolidatedChat 
          chatAction={microsoftChatAction}
        />
      </div>
    </microsoftContext.Provider>
  );
}
```

## Advanced Usage Patterns

### Custom Layout with Individual Components

```typescript
function CustomTickerLayout() {
  return (
    <tickerSetup.Provider>
      {/* Header Section */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <tickerSetup.components.MarketStatusDisplay />
        <tickerSetup.components.KeyMetricsDisplay />
        <tickerSetup.components.StockSnapshotDisplay />
      </div>
      
      {/* Technical Analysis Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <tickerSetup.components.StandardTaDisplay />
        <tickerSetup.components.AiAnalyzedTaDisplay />
      </div>
      
      {/* AI Analysis Section */}
      <tickerSetup.components.AiKeyTakeawaysDisplay />
      <tickerSetup.components.AiOptionsAnalysisDisplay />
      
      {/* Interactive Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <tickerSetup.components.OptionsChainTable />
        <tickerSetup.components.ConsolidatedChat />
      </div>
      
      {/* Debug Section */}
      <tickerSetup.components.DataSection />
    </tickerSetup.Provider>
  );
}
```

### Multiple Tickers on One Page

```typescript
// Create setups for multiple tickers
const spySetup = createCompleteTickerSetup(spyConfig, createTickerContext);
const qqqSetup = createCompleteTickerSetup(qqqConfig, createTickerContext);

function MultiTickerDashboard() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* SPY Analysis */}
      <div>
        <spySetup.Provider>
          <h2 className="text-2xl font-bold mb-4">SPY Analysis</h2>
          <div className="space-y-4">
            <spySetup.components.MarketStatusDisplay />
            <spySetup.components.KeyMetricsDisplay />
            <spySetup.components.AiKeyTakeawaysDisplay />
          </div>
        </spySetup.Provider>
      </div>
      
      {/* QQQ Analysis */}
      <div>
        <qqqSetup.Provider>
          <h2 className="text-2xl font-bold mb-4">QQQ Analysis</h2>
          <div className="space-y-4">
            <qqqSetup.components.MarketStatusDisplay />
            <qqqSetup.components.KeyMetricsDisplay />
            <qqqSetup.components.AiKeyTakeawaysDisplay />
          </div>
        </qqqSetup.Provider>
      </div>
    </div>
  );
}
```

### Performance Optimization with Code Splitting

```typescript
import { lazy, Suspense } from 'react';

// Lazy load ticker components
const LazyTickerTab = lazy(async () => {
  const setup = createCompleteTickerSetup(tickerConfig, createTickerContext);
  return {
    default: () => (
      <setup.Provider>
        <setup.components.TabContent />
      </setup.Provider>
    ),
  };
});

export default function OptimizedTickerPage() {
  return (
    <Suspense fallback={<div>Loading ticker analysis...</div>}>
      <LazyTickerTab />
    </Suspense>
  );
}
```

## Migration Guide

### From Existing NVDA/SPY Components

**Before (NVDA-specific):**
```typescript
import { NvdaTabContent } from '@/components/nvda-tab-content';
import { useNvdaAnalysis } from '@/contexts/nvda-analysis-context';

export default function NvdaPage() {
  return <NvdaTabContent />;
}
```

**After (Framework-based):**
```typescript
import { createCompleteTickerSetup } from '@/lib/ticker-framework/core/base-components';
import { createTickerContext } from '@/lib/ticker-framework/core/context-factory';

const nvdaConfig = {
  ticker: 'NVDA',
  displayName: 'NVIDIA Corporation',
  defaultStrikeCount: 30,
  defaultTableDisplay: 'side-by-side',
};

const nvdaSetup = createCompleteTickerSetup(nvdaConfig, createTickerContext);

export default function NvdaPage() {
  return (
    <nvdaSetup.Provider>
      <nvdaSetup.components.TabContent tickerPage="NVDA_TAB" />
    </nvdaSetup.Provider>
  );
}
```

### Hook Migration

**Before:**
```typescript
const nvdaState = useNvdaAnalysis();
const nvdaDispatch = useNvdaDispatch();
```

**After:**
```typescript
const state = nvdaSetup.hooks.useState();
const dispatch = nvdaSetup.hooks.useDispatch();
// Or with setters for convenience
const stateWithSetters = nvdaSetup.hooks.useStateWithSetters();
```

### Component Props Migration

**Before:**
```typescript
<NvdaMarketStatusDisplay />
<NvdaKeyMetricsDisplay />
```

**After:**
```typescript
<nvdaSetup.components.MarketStatusDisplay />
<nvdaSetup.components.KeyMetricsDisplay />
```

## Server Action Integration

To integrate with ticker-specific server actions (like chat functionality), pass them as props:

```typescript
// Import your ticker-specific server action
import { nvdaChatAction } from '@/actions/nvda-consolidated-chat-action';

function NvdaPageWithChat() {
  return (
    <nvdaSetup.Provider>
      <nvdaSetup.components.TabContent 
        tickerPage="NVDA_TAB"
        chatAction={nvdaChatAction}
      />
    </nvdaSetup.Provider>
  );
}
```

Or use the chat component individually:

```typescript
<nvdaSetup.components.ConsolidatedChat 
  chatAction={nvdaChatAction}
/>
```

## Benefits of the Framework Approach

1. **95% Code Reduction**: Eliminate duplicate component code across tickers
2. **Type Safety**: Full TypeScript support with generic typing
3. **Consistency**: Identical behavior and UI across all ticker tabs
4. **Maintainability**: Single source of truth for component logic
5. **Performance**: Shared base templates reduce bundle size
6. **Extensibility**: Easy to add new tickers or modify existing ones
7. **Testing**: Test base templates once, apply to all tickers

## Common Patterns

### Conditional Component Rendering

```typescript
function ConditionalTickerLayout() {
  const state = tickerSetup.hooks.useState();
  
  return (
    <tickerSetup.Provider>
      <tickerSetup.components.MarketStatusDisplay />
      
      {state.hasStockData && (
        <tickerSetup.components.KeyMetricsDisplay />
      )}
      
      {state.hasAiKeyTakeaways && (
        <tickerSetup.components.AiKeyTakeawaysDisplay />
      )}
      
      {state.hasOptionsChainData && (
        <tickerSetup.components.OptionsChainTable />
      )}
    </tickerSetup.Provider>
  );
}
```

### Custom Ticker Configurations

```typescript
// High-frequency trading setup
const hftConfig: TickerConfig = {
  ticker: 'SPY',
  displayName: 'SPY (HFT Mode)',
  defaultStrikeCount: 40,
  defaultTableDisplay: 'side-by-side',
  customSettings: {
    refreshRate: 'high',
    precision: 4,
    showMicroPrice: true,
  }
};

// Long-term investment setup
const longTermConfig: TickerConfig = {
  ticker: 'SPY',
  displayName: 'SPY (Long-term Analysis)',
  defaultStrikeCount: 20,
  defaultTableDisplay: 'top-bottom',
  customSettings: {
    timeHorizon: 'longTerm',
    showFundamentals: true,
  }
};
```

This framework approach provides maximum flexibility while maintaining code consistency and reducing duplication across all ticker-specific implementations.