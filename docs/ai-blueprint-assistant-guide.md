# AI Assistant Blueprint System Guide

**Specific instructions for AI assistants working with the StockSage v4.4.2.0 blueprint system**

## Critical Guidelines for AI Assistants

### 1. Blueprint-First Approach (MANDATORY)

**Always use the blueprint system for new ticker implementations. Never create manual contexts or components.**

```typescript
// ✅ CORRECT - Use blueprint system
// 1. Update configuration in src/config/ticker-configs.ts
createTickerConfig('AAPL', 'Apple Inc.', { 
  enabled: true, 
  order: 4 
})

// 2. Build automatically generates everything
npm run build

// ❌ WRONG - Manual context creation
// Never manually create contexts, components, or state management
```

### 2. Configuration-Driven Development

All ticker features are controlled through configuration. Update `src/config/ticker-configs.ts` before any implementation:

```typescript
// Template for new ticker configuration
createTickerConfig('SYMBOL', 'Display Name', {
  order: 10,              // Required: Tab order
  category: 'STOCK',      // Required: STOCK|ETF|INDEX|CRYPTO
  enabled: true,          // Required: Enable ticker
  description: 'Brief description',
  accentColor: '#000000', // Optional: Brand color
  features: {             // Optional: Feature flags
    aiChat: true,
    optionsChain: true,
    technicalAnalysis: true,
    webSearch: true,
  },
  chatActionPath: '@/actions/symbol-chat-action', // Optional
}),
```

### 3. Step-by-Step Ticker Addition Workflow

Follow this exact sequence for every new ticker:

#### Step 1: Configuration Update
```typescript
// Always start with configuration
// File: src/config/ticker-configs.ts
export const TICKER_CONFIGS: DynamicTickerConfig[] = [
  // ... existing configs
  
  // Add new ticker here
  createTickerConfig('NEW_SYMBOL', 'Company Name', {
    order: 99, // Choose appropriate order
    category: 'STOCK', // or ETF, INDEX, CRYPTO
    enabled: true,
    // Add other options as needed
  }),
];
```

#### Step 2: Chat Action (Only if Custom AI Needed)
```bash
# Copy existing chat action
cp src/actions/nvda-consolidated-chat-action.ts src/actions/new-symbol-consolidated-chat-action.ts

# Update ticker references in the new file:
# - Replace 'NVDA' with 'NEW_SYMBOL'
# - Replace 'nvda' with 'newSymbol' (camelCase)
# - Update context hooks: useNvdaAnalysis → useNewSymbolAnalysis
```

#### Step 3: Build and Validate
```bash
# Build for auto-discovery
npm run build

# Start development server
npm run dev

# Verify new tab appears at http://localhost:9002
```

### 4. Code Templates for Common Tasks

#### Adding a Basic Stock Ticker

```typescript
// src/config/ticker-configs.ts
createTickerConfig('AAPL', 'Apple Inc.', {
  order: 4,
  category: 'STOCK',
  description: 'Technology hardware and services company',
  accentColor: '#000000', // Apple brand color
  enabled: true,
}),
```

#### Adding an ETF with Custom Features

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
    webSearch: false, // Disable web search
  },
}),
```

#### Custom Chat Action Template

```typescript
// src/actions/aapl-consolidated-chat-action.ts
'use server';

import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { createStreamableValue } from 'ai/rsc';
import { z } from 'zod';

// Update context import
import { useAaplAnalysis } from '@/contexts/aapl-analysis-context';

export async function aaplConsolidatedChatAction(
  prevState: any,
  formData: FormData
): Promise<ConsolidatedChatActionResult> {
  const ticker = 'AAPL'; // Update ticker symbol
  
  // Implementation follows same pattern as NVDA
  // Update all context references and prompts as needed
  
  // ... rest of implementation
}
```

### 5. Context and Hook Usage

The blueprint system automatically generates hooks. Use the correct naming convention:

```typescript
// Generated hooks follow this pattern:
// use{TickerInCamelCase}Analysis()
// use{TickerInCamelCase}Dispatch()

// Examples:
const aaplData = useAaplAnalysis();     // For AAPL
const msftData = useMsftAnalysis();     // For MSFT  
const spyData = useSpyAnalysis();       // For SPY
const nvdaData = useNvdaAnalysis();     // For NVDA

// ❌ Wrong naming:
// useApplAnalysis() - incorrect capitalization
// useAAPLAnalysis() - all caps not supported
// useAppleAnalysis() - use ticker symbol, not company name
```

### 6. Debugging New Tickers

Always verify ticker implementation with these checks:

```typescript
// 1. Verify configuration
import { getTickerConfig, isTickerEnabled } from '@/config/ticker-configs';

const config = getTickerConfig('AAPL');
console.log('AAPL config:', config);

const enabled = isTickerEnabled('AAPL');  
console.log('AAPL enabled:', enabled);

// 2. Test registry loading
import { useTickerRegistry } from '@/lib/ticker-registry';

const registry = useTickerRegistry();
const testResult = await registry.debug.testTickerLoad('AAPL');
console.log('AAPL load test:', testResult);

// 3. Check registry stats
const stats = registry.getStats();
console.log('Registry stats:', stats);
```

### 7. Common Mistake Prevention

#### ❌ Don't Create Manual Contexts
```typescript
// NEVER do this - blueprint handles context creation
const AaplAnalysisContext = createContext();
const AaplProvider = ({ children }) => { /* ... */ };
```

#### ❌ Don't Create Manual Components  
```typescript
// NEVER do this - blueprint handles component generation
export const AaplTabContent = () => { /* ... */ };
export const AaplDataSection = () => { /* ... */ };
```

#### ❌ Don't Skip Configuration
```typescript
// NEVER skip configuration step
// Always update src/config/ticker-configs.ts first
```

#### ✅ Do Use Blueprint System
```typescript
// ALWAYS use blueprint system
// 1. Update configuration
// 2. Optional: Create chat action
// 3. Build and test
```

### 8. Quality Assurance Checklist

Before completing any ticker addition, verify:

- [ ] Ticker added to `src/config/ticker-configs.ts` with `enabled: true`
- [ ] Configuration follows correct format with all required fields
- [ ] Ticker symbol is uppercase (AAPL, not aapl)
- [ ] Order value is appropriate for tab positioning
- [ ] Category is correct (STOCK, ETF, INDEX, or CRYPTO)
- [ ] Custom chat action created if needed (optional)
- [ ] `npm run build` completes without errors
- [ ] New tab appears in development server
- [ ] All ticker features work (data loading, AI chat, etc.)
- [ ] Context isolation maintained (no cross-ticker contamination)
- [ ] No console errors in browser developer tools
- [ ] Loading states work correctly
- [ ] Export functionality works

### 9. Runtime Management

You can enable/disable tickers programmatically:

```typescript
import { TickerConfigUtils } from '@/config/ticker-configs';

// Enable ticker at runtime
TickerConfigUtils.enableTicker('AAPL');

// Disable ticker at runtime  
TickerConfigUtils.disableTicker('AAPL');

// Update ticker order
TickerConfigUtils.updateTickerOrder('AAPL', 5);

// Validate configuration
const validation = TickerConfigUtils.validateConfig(config);
if (!validation.valid) {
  console.error('Config errors:', validation.errors);
}
```

### 10. Development Utilities

Use these utilities during development:

```typescript
import { DevUtils } from '@/config/ticker-configs';

// Enable all tickers (for testing)
DevUtils.enableAllTickers();

// Enable only specific tickers
DevUtils.enableOnlyTickers(['SPY', 'NVDA', 'AAPL']);

// Reset to production defaults
DevUtils.resetToDefaults();

// Get configuration summary
console.log(DevUtils.getConfigSummary());
```

### 11. Error Handling and Troubleshooting

#### Configuration Errors
```typescript
// If ticker doesn't appear, check:
const config = getTickerConfig('AAPL');
if (!config) {
  console.error('Ticker AAPL not found in configuration');
}

if (!config.enabled) {
  console.error('Ticker AAPL is disabled');
}
```

#### Registry Errors
```typescript
// If context errors occur, check registry:
import { tickerRegistry } from '@/lib/ticker-registry';

const registryState = tickerRegistry.debug.getFullState();
console.log('Registry state:', registryState);

const tickerDetails = await tickerRegistry.debug.getTickerDetails('AAPL');
console.log('AAPL details:', tickerDetails);
```

#### Build Errors
- Verify configuration syntax in `ticker-configs.ts`
- Check TypeScript errors in terminal
- Ensure all imports are correct
- Verify ticker symbol consistency

### 12. Advanced Configuration Options

#### Feature Flag Control
```typescript
createTickerConfig('VIX', 'CBOE Volatility Index', {
  category: 'INDEX',
  features: {
    aiChat: true,
    optionsChain: false,    // VIX doesn't have options
    technicalAnalysis: true,
    webSearch: true,
  },
}),
```

#### Custom Styling
```typescript
createTickerConfig('TSLA', 'Tesla Inc.', {
  accentColor: '#cc0000',  // Tesla red
  category: 'STOCK',
  // Custom strike counts and display options
  defaultStrikeCount: 40,
  defaultTableDisplay: 'top-bottom',
}),
```

### 13. Testing Strategy

#### Unit Testing Approach
1. **Configuration Test**: Verify ticker appears in enabled list
2. **Registry Test**: Confirm ticker loads successfully  
3. **Context Test**: Verify hooks are generated correctly
4. **Integration Test**: Test tab switching and data loading
5. **Isolation Test**: Ensure no cross-ticker state contamination

#### Manual Testing Checklist
- [ ] Tab appears in tab bar
- [ ] Tab switching works smoothly
- [ ] Data loads correctly
- [ ] AI chat functions (if enabled)
- [ ] Options chain displays (if enabled)
- [ ] Technical analysis works (if enabled)
- [ ] Export functionality works
- [ ] No console errors
- [ ] Context isolation maintained

### 14. Performance Considerations

- Enable only necessary tickers in production
- Use appropriate order values (lower numbers = higher priority)
- Consider lazy loading for large numbers of tickers
- Monitor bundle size impact
- Test with multiple tickers enabled simultaneously

### 15. Integration with Existing Systems

The blueprint system integrates with:
- **Legacy Components**: Existing NVDA/SPY components work alongside blueprint
- **Server Actions**: Existing actions continue to work
- **AI Flows**: All AI functionality preserved
- **Export Systems**: All export features maintained
- **Debug Tools**: Enhanced debugging capabilities

## Summary

The StockSage Blueprint System revolutionizes ticker addition by:
1. **95% Code Reduction**: Minimal implementation required
2. **Configuration-Driven**: Single source of truth
3. **Automatic Generation**: Contexts, hooks, and components created automatically
4. **Type Safety**: Full TypeScript support throughout
5. **Runtime Management**: Dynamic enable/disable capabilities

Always follow the blueprint-first approach and use the provided templates and utilities for consistent, reliable ticker implementations.