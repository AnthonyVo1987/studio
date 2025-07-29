# StockSage Blueprint System Guide

**Comprehensive guide for using the v4.4.2.0 blueprint system for trivial ticker addition**

## Overview

The StockSage Blueprint System is a revolutionary configuration-driven architecture that enables adding new ticker analysis tabs with 95% code reduction. Instead of manually creating contexts, components, and state management for each ticker, the system automatically generates everything from centralized configuration.

## System Architecture

### Core Components

#### 1. Context Factory (`src/lib/ticker-framework/core/context-factory.ts`)
Automatically generates ticker-specific React contexts and hooks:
- Creates `use{Ticker}Analysis()` hooks
- Creates `use{Ticker}Dispatch()` hooks  
- Handles FSM state management
- Provides complete context isolation

#### 2. Component Templates (`src/lib/ticker-framework/core/base-components/`)
Base component templates that adapt to any ticker:
- `base-tab-content.tsx` - Main tab orchestrator
- `base-data-section.tsx` - Financial data display
- `base-consolidated-chat.tsx` - AI chat interface
- `base-options-chain-table.tsx` - Options chain visualization
- Display templates in `displays/` directory

#### 3. Configuration System (`src/config/ticker-configs.ts`)
Centralized configuration for all tickers:
- Single source of truth for ticker settings
- Feature flags for AI chat, options chain, technical analysis
- Theming and branding configuration
- Dynamic enable/disable capabilities

#### 4. Registry System (`src/lib/ticker-registry.ts`)
Manages dynamic ticker loading:
- Auto-discovery from configuration
- Runtime enable/disable
- Lazy loading and code splitting
- Debug utilities

#### 5. Dynamic Tab System (`src/components/tabs/dynamic-tab-system.tsx`)
Orchestrates tab management:
- Build-time manifest generation
- Multi-provider composition
- Context isolation enforcement
- Fallback handling

## Adding New Tickers

### Method 1: Configuration Only (Recommended)

This is the simplest method for adding standard tickers that don't need custom AI prompts.

#### Step 1: Update Configuration

Open `src/config/ticker-configs.ts` and add your ticker:

```typescript
export const TICKER_CONFIGS: DynamicTickerConfig[] = [
  // ... existing configs
  
  // Add your new ticker
  createTickerConfig('AAPL', 'Apple Inc.', {
    order: 4,
    category: 'STOCK',
    description: 'Technology hardware and services company',
    accentColor: '#000000', // Apple brand color
    enabled: true, // ✅ Enable the ticker
    features: {
      aiChat: true,
      optionsChain: true,
      technicalAnalysis: true,
      webSearch: true,
    },
  }),
];
```

#### Step 2: Build and Test

```bash
# Build the application (auto-discovery happens here)
npm run build

# Start development server
npm run dev

# Visit http://localhost:9002 - new AAPL tab should appear
```

That's it! The new ticker tab will automatically appear with full functionality.

### Method 2: Configuration + Custom Chat Action

If you want custom AI prompts or specialized chat behavior, create a custom chat action.

#### Step 1: Update Configuration

Same as Method 1, but add the chat action path:

```typescript
createTickerConfig('AAPL', 'Apple Inc.', {
  order: 4,
  category: 'STOCK',
  description: 'Technology hardware and services company',
  accentColor: '#000000',
  enabled: true,
  chatActionPath: '@/actions/aapl-consolidated-chat-action', // Custom chat action
}),
```

#### Step 2: Create Chat Action

Copy an existing chat action and customize:

```bash
# Copy existing chat action as template
cp src/actions/nvda-consolidated-chat-action.ts src/actions/aapl-consolidated-chat-action.ts
```

Update the new file:

```typescript
// src/actions/aapl-consolidated-chat-action.ts

// 1. Update imports
import { useAaplAnalysis } from '@/contexts/aapl-analysis-context';

// 2. Update context usage
export async function aaplConsolidatedChatAction(
  prevState: any,
  formData: FormData
): Promise<ConsolidatedChatActionResult> {
  // Replace nvda references with aapl
  const ticker = 'AAPL';
  
  // ... rest of the implementation
}

// 3. Update any NVDA-specific prompts or logic for AAPL
```

#### Step 3: Build and Test

```bash
npm run build
npm run dev
```

## Configuration Options

### Basic Configuration

```typescript
createTickerConfig('SYMBOL', 'Display Name', {
  // Required fields
  order: 10,              // Tab order (lower = leftmost)
  category: 'STOCK',      // 'STOCK' | 'ETF' | 'INDEX' | 'CRYPTO'
  enabled: true,          // Enable/disable ticker
  
  // Optional customization
  description: 'Company description',
  accentColor: '#ff0000', // Tab accent color
  
  // Feature flags
  features: {
    aiChat: true,           // Enable AI chat
    optionsChain: true,     // Enable options chain
    technicalAnalysis: true, // Enable technical analysis
    webSearch: true,        // Enable web search in AI
  },
  
  // Advanced options
  defaultStrikeCount: 30,    // 20, 30, or 40
  defaultTableDisplay: 'side-by-side', // or 'top-bottom'
  chatActionPath: '@/actions/symbol-chat-action', // Custom chat action
});
```

### Available Categories

- **STOCK**: Individual company stocks (AAPL, MSFT, GOOGL)
- **ETF**: Exchange-traded funds (SPY, QQQ, XLF)
- **INDEX**: Market indices (VIX, SPX)
- **CRYPTO**: Cryptocurrency (future expansion)

### Color Palette Suggestions

Use brand colors or category-appropriate colors:

```typescript
// Brand colors
accentColor: '#000000',    // Apple black
accentColor: '#00a4ef',    // Microsoft blue
accentColor: '#4285f4',    // Google blue
accentColor: '#ff9900',    // Amazon orange
accentColor: '#76b900',    // NVIDIA green

// Category colors
accentColor: '#3b82f6',    // Blue for ETFs
accentColor: '#10b981',    // Green for financial
accentColor: '#7c3aed',    // Purple for tech
accentColor: '#dc2626',    // Red for volatility
```

## Advanced Usage

### Runtime Ticker Management

You can enable/disable tickers at runtime:

```typescript
import { useTickerRegistry } from '@/lib/ticker-registry';

const { enable, disable, getStats } = useTickerRegistry();

// Enable a ticker
await enable('AAPL');

// Disable a ticker  
await disable('AAPL');

// Get registry statistics
const stats = getStats();
```

### Custom Feature Sets

Disable specific features for certain tickers:

```typescript
// VIX doesn't have traditional options
createTickerConfig('VIX', 'CBOE Volatility Index', {
  category: 'INDEX',
  features: {
    aiChat: true,
    optionsChain: false,    // ❌ Disable options
    technicalAnalysis: true,
    webSearch: true,
  },
}),
```

### Development Utilities

```typescript
import { DevUtils } from '@/config/ticker-configs';

// Enable all tickers (for development)
DevUtils.enableAllTickers();

// Enable only specific tickers
DevUtils.enableOnlyTickers(['SPY', 'NVDA', 'AAPL']);

// Reset to defaults
DevUtils.resetToDefaults();

// Get configuration summary
console.log(DevUtils.getConfigSummary());
```

## Testing New Tickers

### 1. Verify Configuration

```typescript
import { getTickerConfig, isTickerEnabled } from '@/config/ticker-configs';

// Check if ticker is properly configured
const config = getTickerConfig('AAPL');
console.log('AAPL config:', config);

// Check if ticker is enabled
const enabled = isTickerEnabled('AAPL');
console.log('AAPL enabled:', enabled);
```

### 2. Test Registry Loading

```typescript
import { useTickerRegistry } from '@/lib/ticker-registry';

const registry = useTickerRegistry();

// Test ticker loading
const result = await registry.debug.testTickerLoad('AAPL');
console.log('AAPL load test:', result);

// Get ticker details
const details = await registry.debug.getTickerDetails('AAPL');
console.log('AAPL details:', details);
```

### 3. Check Tab System

1. Run `npm run build` to ensure build-time discovery works
2. Check browser developer console for registry initialization logs
3. Verify new tab appears in the tab bar
4. Test tab switching and context isolation
5. Verify all features work (data loading, AI chat, etc.)

## Troubleshooting

### Common Issues

#### 1. Ticker Not Appearing

**Problem**: New ticker doesn't show up in tabs
**Solution**: 
- Check `enabled: true` in configuration
- Verify ticker symbol is uppercase in config
- Run `npm run build` to regenerate manifest
- Check browser console for registry errors

#### 2. Context Errors

**Problem**: `use{Ticker}Analysis is not defined`
**Solution**:
- Context is generated automatically by blueprint system
- Make sure you're using the correct hook name (camelCase)
- For AAPL: `useAaplAnalysis()`, not `useApplAnalysis()`

#### 3. Chat Action Not Working

**Problem**: AI chat doesn't work with custom chat action
**Solution**:
- Verify chat action file path in configuration
- Check all ticker references are updated in the action
- Ensure correct context hook imports
- Verify server action is properly exported

#### 4. Build Errors

**Problem**: TypeScript errors during build
**Solution**:
- Check configuration syntax in `ticker-configs.ts`
- Verify all required fields are provided
- Make sure ticker symbol matches between config and chat action

### Debug Tools

#### Registry Debug Console

```typescript
import { tickerRegistry } from '@/lib/ticker-registry';

// Get full registry state
console.log(tickerRegistry.debug.getFullState());

// Get specific ticker details
console.log(await tickerRegistry.debug.getTickerDetails('AAPL'));

// Test ticker loading
console.log(await tickerRegistry.debug.testTickerLoad('AAPL'));
```

#### Configuration Validation

```typescript
import { TickerConfigUtils } from '@/config/ticker-configs';

const config = getTickerConfig('AAPL');
const validation = TickerConfigUtils.validateConfig(config);

if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}
```

## Migration from Legacy Components

If you have existing ticker-specific components, you can migrate to the blueprint system:

### 1. Identify Components to Migrate

- `{ticker}-analysis-context.tsx` - Replace with blueprint context
- `{ticker}-tab-content.tsx` - Replace with blueprint tab content
- `{ticker}-data-section.tsx` - Replace with blueprint data section
- `{ticker}-*-display.tsx` - Replace with blueprint displays

### 2. Migration Steps

1. **Add ticker to configuration** using `createTickerConfig()`
2. **Enable the ticker** in configuration
3. **Test blueprint version** alongside legacy version
4. **Migrate custom chat action** if needed
5. **Remove legacy components** once validated

### 3. Validation Checklist

- [ ] All data displays work correctly
- [ ] AI chat functions properly
- [ ] Context isolation is maintained
- [ ] Loading states work correctly
- [ ] Export functionality works
- [ ] No console errors
- [ ] Performance is maintained

## Best Practices

### 1. Configuration Management

- Keep ticker configurations sorted by order
- Use meaningful descriptions for each ticker
- Choose appropriate category classifications
- Use brand-appropriate accent colors
- Enable only necessary features

### 2. Naming Conventions

- Ticker symbols always uppercase (AAPL, not aapl)
- Display names use proper capitalization
- Chat action files use kebab-case: `aapl-consolidated-chat-action.ts`
- Context hooks use camelCase: `useAaplAnalysis()`

### 3. Testing Strategy

- Test new tickers in development first
- Verify context isolation between tickers
- Check all feature flags work correctly
- Test with both enabled and disabled states
- Validate chat actions with various inputs

### 4. Performance Considerations

- Enable only necessary tickers in production
- Use appropriate order values to control tab sequence
- Consider lazy loading for large numbers of tickers
- Monitor bundle size with additional tickers

## Example Implementations

### Basic Stock Ticker

```typescript
createTickerConfig('MSFT', 'Microsoft Corporation', {
  order: 5,
  category: 'STOCK',
  description: 'Cloud computing and software services',
  accentColor: '#00a4ef',
  enabled: true,
}),
```

### ETF with Custom Features

```typescript
createTickerConfig('QQQ', 'Invesco QQQ Trust', {
  order: 2,
  category: 'ETF',
  description: 'ETF tracking the Nasdaq-100 index',
  accentColor: '#10b981',
  enabled: true,
  features: {
    aiChat: true,
    optionsChain: true,
    technicalAnalysis: true,
    webSearch: false, // Disable web search for this ticker
  },
  chatActionPath: '@/actions/qqq-consolidated-chat-action',
}),
```

### Index with Limited Features

```typescript
createTickerConfig('VIX', 'CBOE Volatility Index', {
  order: 30,
  category: 'INDEX',
  description: 'Market volatility indicator',
  accentColor: '#dc2626',
  enabled: false, // Disabled by default
  features: {
    aiChat: true,
    optionsChain: false, // VIX doesn't have traditional options
    technicalAnalysis: true,
    webSearch: true,
  },
}),
```

## Conclusion

The StockSage Blueprint System dramatically simplifies ticker addition while maintaining code quality and consistency. By following this guide, you can add new tickers with minimal effort and maximum reliability.

For additional support or advanced use cases, refer to the implementation examples in `src/lib/ticker-framework/examples/` or consult the main project documentation in `CLAUDE.md`.