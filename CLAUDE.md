# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Operating Mode Guidelines

**Agents**: Call and Use whatever Agents needed for the requested task(s), allowing ALL tool and MCP Tool use for ALL Agents:

Additional Tools that Every Agent can use as needed:
- **Context Gathering**: Use CONTEXT7 tool as needed to understand current architecture and best practices based on the app's tech stack
- **Sequential Analysis**: Use SEQUENTIAL THINKING tool as needed for complex investigations requiring step-by-step reasoning

### Custom Slash Commands
- **New custom slash command "/task"**: Add new customer slash command for "/task" that will have Claude Code Agent(s) to open and read the "task.md" file in the "docs" folder for the next User Task

## Overview
StockSage is a Next.js financial analysis application that provides real-time stock data, options chain analysis, and AI-powered insights using Google's Gemini AI models. As of v4.1.10.0, it includes a dedicated SPY tab with completely isolated architecture and advanced specialized AI chat system.

## Common Development Commands

### Build & Development
```bash
npm run dev          # Development server (http://localhost:9002)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint linting
npm run typecheck    # TypeScript type checking
npm run genkit:dev   # Genkit AI flows dev server (http://localhost:3400)
npm run genkit:watch # Genkit AI flows dev server with watch mode
```

### Critical Pre-Commit Commands
Always run these before committing:
```bash
npm run lint
npm run typecheck
```

## High-Level Architecture (v4.0.0.7+)

### Core Technology Stack
- **Frontend**: Next.js 15.3.3 with React 18.3.1
- **AI Backend**: Google Genkit + Google AI SDK
- **State Management**: Standard React Context + FSM (Simplified)
- **UI Components**: ShadCN UI + Tailwind CSS
- **Data Sources**: Polygon.io API
- **AI Model**: Google Gemini 2.5-flash-lite

### Simplified Architecture (v4.0.0.7+)

**The application now uses standard React best practices with direct business context consumption:**

#### 1. Business Logic Layer
- **Location**: `src/contexts/business-logic-context.tsx`
- **Purpose**: All application state, business logic, FSM state management, and data processing
- **FSM States**: Simplified enum (APP_INITIALIZING, IDLE, LOADING)
- **Orchestrator**: `src/components/main-tab-content-ui.tsx` - Contains deterministic handlers for on-demand operations
- **Pattern**: Standard React Context with useReducer for FSM state

#### 2. Presentation Layer
- **Location**: `src/components/main-tab-content-ui.tsx` + all display components
- **Purpose**: UI rendering using business context directly
- **Pattern**: All display components use `useStockAnalysis()` hook directly
- **Loading States**: Derived from FSM state and business flags
- **On-Demand AI**: AI Key Takeaways and Options Analysis are manual button-triggered only

### SPY Tab Architecture (v4.1.10.0+)

**Completely isolated SPY-dedicated tab with specialized AI chat system:**

#### 1. SPY Context Layer
- **Location**: `src/contexts/spy-analysis-context.tsx`
- **Purpose**: Dedicated state management for SPY analysis only
- **Pattern**: Context + Reducer with custom hooks (`useSpyAnalysis()`, `useSpyDispatch()`)
- **Isolation**: Zero cross-dependencies with Main tab context

#### 2. SPY UI Components
- **Main Component**: `src/components/spy-tab-content.tsx` - Deterministic handlers
- **Data Section**: `src/components/spy-data-section.tsx` - Self-contained JSON display
- **Display Components**: `spy-*.tsx` pattern - All isolated from Main tab components
- **Advanced Chat**: `src/components/spy-consolidated-chat.tsx` - Specialized trading-focused AI chat
- **AI Analysis**: Full feature parity with Main tab (Key Takeaways, Options Analysis)

#### 3. Advanced SPY Chat Architecture (v4.1.10.0)
- **Specialized Prompt System**: Three distinct trading-focused prompt templates:
  - `stock-trader-takeaways.json` - Trading-focused market analysis
  - `options-trader-takeaways.json` - Options strategy insights
  - `holistic-takeaways.json` - Comprehensive market analysis
- **Enhanced UI/UX**: Dynamic responsive design with cross-device optimization
  - Adaptive sizing: `min-h-[400px] max-h-[80vh]` with breakpoint responsiveness
  - Textarea component for enhanced multi-line input experience
  - Improved UX flow with Chat Mode toggle positioned near input section
- **Comprehensive Export Features**: Copy/Export JSON functionality for chat responses
- **Race Condition Protection**: Request ID tracking prevents concurrent request conflicts
- **Technical Excellence**: 
  - Modern Google GenAI SDK with conditional GoogleSearch tool
  - Comprehensive error handling with toast notifications
  - Maintainable constants (CHAT_HEIGHTS, TEXTAREA_CONFIG)
  - Safe JSON parsing with error handling
- **Server Action**: `spy-consolidated-chat-action.ts` with advanced request lifecycle management

## File Organization

### Core Architecture Files (Tier 1 - Critical)
- `src/contexts/business-logic-context.tsx` - All application state & FSM management
- `src/contexts/spy-analysis-context.tsx` - SPY dedicated state management (isolated)
- `src/components/main-tab-content-ui.tsx` - Main UI component with deterministic handlers for on-demand operations
- `src/components/spy-tab-content.tsx` - SPY UI component with deterministic handlers
- `src/services/data-sources/adapters/polygon-adapter.ts` - API integration
- `src/types/` - Type definitions directory (e.g., `options.ts`)

### Server Actions (Tier 2 - High Priority)
- `src/actions/analyze-stock-server-action.ts` - Stock data fetching
- `src/actions/analyze-ta-action.ts` - Technical analysis
- `src/actions/perform-ai-analysis-action.ts` - AI key takeaways
- `src/actions/perform-ai-options-analysis-action.ts` - AI options analysis
- `src/actions/spy-consolidated-chat-action.ts` - SPY unified AI chat with conditional web search

### AI Flows & Prompts (Tier 2 - High Priority)
- `src/ai/flows/` - Genkit AI flow definitions
- `src/ai/definitions/` - JSON prompt templates
- `src/ai/schemas/` - Zod validation schemas

## Critical Architectural Rules (v4.0.0.7+)

### 1. Standard React Context Pattern
```typescript
// CORRECT - UI component using business context directly
const MyDisplayComponent = () => {
  const business = useStockAnalysis(); // ✅ Correct
  
  // Parse JSON data as needed
  const stockData = business.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(business.stockSnapshotJson);
      return parsed.results?.[0] || {};
    } catch (e) { return {}; }
  })() : {};
  
  return <div>{stockData.ticker}</div>;
};
```

### 2. On-Demand Handler Pattern (Main UI Component)
```typescript
// CORRECT - Deterministic handler pattern in main-tab-content-ui.tsx
const MainTabContentUI = () => {
  const business = useStockAnalysis();
  
  const handleOnDemandDataFetch = async () => {
    // Set loading state
    business.dispatchGlobalFsmEvent({ type: 'SET_LOADING' });
    
    try {
      // Execute server action
      const result = await fetchStockDataAction({...});
      
      // Update business state based on result
      if (result.status === 'success' && result.data) {
        business.setStockSnapshotJson(result.data.stockSnapshotJson);
      }
    } finally {
      // Reset to idle state
      business.dispatchGlobalFsmEvent({ type: 'SET_IDLE' });
    }
  };
};
```

### 3. On-Demand AI Analysis
```typescript
// AI Analysis is now triggered manually via buttons, not automated pipeline
const handleOnDemandKeyTakeaways = async () => {
  const result = await performAiAnalysisAction({...});
  if (result.status === 'success') {
    setAiKeyTakeawaysJson(result.data.aiKeyTakeawaysJson);
  }
};
```

### 4. React Best Practices
- **Standard useContext + useReducer patterns**
- **Minimal useEffect dependency arrays**
- **Always batch multiple state updates** with `startTransition`
- **Direct business context consumption** in UI components

## Development Guidelines

### 1. Code Quality Standards
- **TypeScript**: Strict mode enabled, use `import type` for type imports
- **Error Handling**: Wrap all async operations in try/catch blocks
- **Logging**: Use standard `console.*` methods for both client-side and server-side
- **Validation**: Use Zod schemas for all data validation

### 2. UI/UX Conventions
- **Components**: ShadCN UI components with Tailwind styling
- **Icons**: Lucide React icons
- **Loading States**: Derive from FSM state and business flags
- **Responsiveness**: Mobile-first approach with proper breakpoints

### 3. Data Export Features
- All data cards support "Copy JSON" and "Export JSON" functionality
- Export utilities located in `src/lib/export-utils.ts`
- JSON state hooks in `src/hooks/use-json-data-state.ts`

## Common Pitfalls & Solutions

### 1. Infinite Render Loops
**Cause**: State updates during render phase or circular dependencies in useEffect
**Solution**: Move all state updates to orchestrator components, avoid setters in dependency arrays

### 2. FSM State Inconsistency
**Cause**: Skipping FSM feedback after async operations
**Solution**: Always dispatch FSM events after each step in deterministic handlers

### 3. Race Conditions
**Cause**: Reactive orchestrators with complex dependency arrays
**Solution**: Use deterministic handlers with simple async/await patterns

## Key Files to Understand

### Context Factory Pattern
- `src/contexts/context-setter-factory.ts` - Centralized setter creation
- Reduces boilerplate and ensures consistent error handling

### Custom Hooks
- `src/hooks/use-json-data-state.ts` - JSON state management utilities
- `src/hooks/use-toast.ts` - Toast notification system

### API Integration
- `src/services/data-sources/adapters/polygon-adapter.ts` - Polygon.io API wrapper
- Includes retry logic, error handling, and rate limiting

## Version Management
- **Version Source**: `src/config/app-metadata.json` (single source of truth)
- **Current Version**: v4.1.10.0 (as of this documentation update)
- **Update Policy**: Always update `appVersion` and `lastUpdatedTimestamp` for any code changes
- **Versioning Scheme**: `v4.w.x.y.z` format (v4.0.0.7+ for current simplified architecture)

## Code Review Process

### Comprehensive Code Review Methodology
Use this process for any significant code changes or new implementations:

#### Phase 1: Targeted Implementation Review
- **USE SEQUENTIAL THINKING TOOL** for systematic analysis
- **USE CONTEXT7 TOOL** to ensure up-to-date robust practices for the app's stack
- Focus on specific implementation of code changes for current tasks
- Verify proper logic and input/output wiring for data and UI/Render updates

#### Phase 2: Generic Codebase Audit
After targeted review, check for these items (non-exhaustive list):
- Verify all logic is enforced to be DETERMINISTIC
- Verify there are no "complex/convoluted" useEffect/dependency array/UI/Render that can affect main business logic
- Verify there are no unused code, functions, imports etc that have been removed and/or deprecated
- Verify there are no other "React anti-pattern" issues
- Verify no other orchestrator vs reducer issues
- Verify no potential infinite loops during UI/Render vs a dependency
- Verify no console logs can cause infinite loops during UI/Render, triggering another console log, triggering another UI/Render loop etc
- Verify proper JSON parsing, comparing to current working Main page JSON parsing
- Add any other items to check depending on the scope of changes for the current task

#### Phase 3: Post-Review Actions
- **If code review FAILED**: Fix issues, summarize fixes, wait for next task, do NOT commit
- **If code review PASSED**: Perform all actions in order:
  1. Update README.md, CHANGELOG.md
  2. Perform Claude command "/init" to update CLAUDE.md project doc
  3. Git commit and push as completely single shot atomic operation with ALL code changes, doc changes, CLAUDE.md changes, settings json etc
  4. This ensures code changes go along with documentation changes instead of needing additional commits just for docs

## Testing & Quality Assurance
- Always run `npm run lint` and `npm run typecheck` before committing
- Simplified architecture uses standard React patterns
- Direct business context consumption with safe JSON parsing patterns
- Follow the comprehensive code review process above for all significant changes

## Environment & Configuration

### Required Environment Variables
Create `.env` in project root:
```env
POLYGON_API_KEY=your_polygon_api_key
GEMINI_API_KEY=your_google_ai_api_key
```

### Build Configuration
- **TypeScript errors are ignored during builds** (see `next.config.ts`)
- **ESLint errors are ignored during builds** (see `next.config.ts`)
- **Strict TypeScript** is enabled in development but bypassed for builds

## Testing & Debugging

### Testing Strategy
- **No formal test suite exists** - manual testing required
- Use the built-in Debug tabs in the application for verification:
  - "Debug" tab: Raw JSON inputs/outputs
  - "Debug Logs" tab: Application trace logs with filtering
  - "Debug FSM" tab: Real-time FSM state monitoring

### Debugging Tools
- **Debug Snapshot**: Export comprehensive application state for bug reports
- **JSON Export**: All data cards support "Copy JSON" and "Export JSON"
- **Logging**: Standard `console.*` methods for both client-side and server-side

## Performance & Optimization

### Recent Achievements (v4.0.0.7+)
- **Architecture Simplification**: Removed complex UI state layer, now uses standard React patterns
- **On-Demand AI**: Simplified pipeline with manual AI analysis (no automated steps)
- **FSM Simplification**: Reduced states (APP_INITIALIZING, IDLE, LOADING), removed automated pipeline complexity
- **Code Cleanup**: Removed "one step behind" UI update mechanism
- **Direct Context Consumption**: All display components now use business context directly
- **Token Optimization**: Achieved 27.9% reduction in codebase tokens (~29K tokens saved) while preserving functionality

### Current Metrics
- **Architecture Simplicity**: Standard React best practices, no complex UI state layer
- **Pipeline Efficiency**: Basic analysis (data + AI TA) with on-demand AI features
- **Code Maintainability**: Straightforward context consumption across all components

## Important Notes for AI Assistants (v4.1.10.0+)
1. **Use standard React patterns** - UI components use `useStockAnalysis()` directly for all data
2. **Maintain the deterministic handler pattern** in `main-tab-content-ui.tsx` for on-demand operations
3. **Parse JSON data in components** as needed using try/catch patterns for safety
4. **AI actions are on-demand only** - no automated pipeline states or toggles
5. **Keep business logic in the business context** - UI components focus on presentation
6. **Always update version metadata** in `src/config/app-metadata.json` for any code changes
7. **Display components follow the pattern**: `useStockAnalysis()` → parse data → derive loading states → render
8. **FSM has minimal states** - APP_INITIALIZING, IDLE, LOADING (for any on-demand operation)
9. **Context has been renamed** - `business-logic-context.tsx` contains the main `useStockAnalysis()` hook
10. **Token-optimized codebase** - Utilizes factory patterns, shared utilities, and centralized configurations
11. **SPY Tab Isolation** - SPY tab uses completely separate context (`spy-analysis-context.tsx`) with `useSpyAnalysis()` hook
12. **SPY Components Pattern** - All SPY components follow `spy-*.tsx` naming and are isolated from Main tab
13. **SPY Advanced AI Chat (v4.1.10.0)** - Specialized trading-focused AI chat with enhanced UX:
    - **Specialized Prompt System**: Three distinct templates (stock-trader, options-trader, holistic-takeaways)
    - **Enhanced UI/UX**: Dynamic responsive design with Textarea component and adaptive sizing
    - **Comprehensive Export**: Copy/Export JSON functionality for chat responses
    - **Race Condition Protection**: Request ID tracking prevents concurrent request conflicts
    - **Advanced Error Handling**: Toast notifications and safe JSON parsing
    - **Maintainable Architecture**: Extracted constants and improved code organization
14. **SPY AI Analysis (v4.1.6.0)** - Complete deterministic implementation with feature parity to Main tab
15. **Build Configuration Note** - TypeScript and ESLint errors are ignored during builds for deployment flexibility

This architecture (v4.1.10.0) maintains React best practices with two parallel, isolated analysis tabs: Main (user input) and SPY (dedicated ticker with advanced AI chat).