# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
StockSage is a Next.js financial analysis application that provides real-time stock data, options chain analysis, and AI-powered insights using Google's Gemini AI models.

## Common Development Commands

### Build & Development
```bash
npm run dev          # Development server (http://localhost:9002)
npm run build        # Production build
npm run lint         # ESLint linting
npm run typecheck    # TypeScript type checking
npm run genkit:watch # Genkit AI flows dev server (http://localhost:3400)
```

### Critical Pre-Commit Commands
Always run these before committing:
```bash
npm run lint
npm run typecheck
```

## High-Level Architecture

### Core Technology Stack
- **Frontend**: Next.js 15.3.3 with React 18.3.1
- **AI Backend**: Google Genkit + Google AI SDK
- **State Management**: React Context + FSM (Finite State Machine)
- **UI Components**: ShadCN UI + Tailwind CSS
- **Data Sources**: Polygon.io API
- **AI Model**: Google Gemini 2.5-flash-lite

### Key Architectural Patterns

#### 1. FSM (Finite State Machine) Pattern
- **Location**: `src/contexts/stock-analysis-context.tsx`
- **Purpose**: Centralized state management for the entire application
- **States**: Defined in `GlobalFsmState` enum (APP_INITIALIZING, IDLE, DATA_FETCH_IN_PROGRESS, etc.)
- **Critical Rule**: The FSM feedback loop is **non-removable** - orchestrators MUST dispatch events back to FSM after each step

#### 2. Deterministic Handler Pattern (MANDATORY)
- **Location**: `src/components/main-tab-content.tsx`
- **Purpose**: Sequential async/await execution for complex data pipelines
- **Architecture**: User event → async handler → server actions with await → FSM feedback after each step
- **Anti-Pattern**: Never use reactive orchestrators with complex useEffect dependencies

#### 3. Orchestrator vs Reducer Separation (CRITICAL)
- **FSM Reducer**: Handles ONLY FSM state transitions and flag updates
- **Orchestrator**: Handles ALL actual state updates (setters) BEFORE dispatching FSM events
- **Rule**: State updates during render phase cause infinite loops - keep them in orchestrators

## File Organization

### Core Architecture Files (Tier 1 - Critical)
- `src/contexts/stock-analysis-context.tsx` - Global state management & FSM
- `src/components/main-tab-content.tsx` - Main orchestrator component  
- `src/services/data-sources/adapters/polygon-adapter.ts` - API integration
- `src/types/` - Type definitions directory (e.g., `options.ts`)

### Server Actions (Tier 2 - High Priority)
- `src/actions/analyze-stock-server-action.ts` - Stock data fetching
- `src/actions/analyze-ta-action.ts` - Technical analysis
- `src/actions/perform-ai-analysis-action.ts` - AI key takeaways
- `src/actions/perform-ai-options-analysis-action.ts` - AI options analysis

### AI Flows & Prompts (Tier 2 - High Priority)
- `src/ai/flows/` - Genkit AI flow definitions
- `src/ai/definitions/` - JSON prompt templates
- `src/ai/schemas/` - Zod validation schemas

## Critical Architectural Rules

### 1. React Anti-Pattern Prevention
- **Never update state during render phase** (inside reducers)
- **Never call setters inside useEffect dependency arrays** (causes loops)
- **Always batch multiple state updates** with `startTransition`
- **UI components must derive loading state from FSM**, not data content

### 2. FSM Feedback Loop (Non-Negotiable)
```typescript
// CORRECT - Orchestrator pattern with FSM feedback
const handleAnalyzeStock = async () => {
  // Update state BEFORE dispatching FSM event
  if (result.status === 'success' && result.data) {
    setAiKeyTakeawaysJson(result.data.aiKeyTakeawaysJson);
  }
  // REQUIRED: Dispatch FSM event for UI feedback
  dispatchGlobalFsmEvent({ 
    type: result.status === 'success' ? 'KEY_TAKEAWAYS_SUCCESS' : 'KEY_TAKEAWAYS_FAILURE', 
    payload: result 
  });
};
```

### 3. State Update Pattern
```typescript
// CORRECT - State updates in orchestrator
startTransition(() => {
  setAiKeyTakeawaysRequestJson(requestJson);
  setAiKeyTakeawaysJson(responseJson);
});

// WRONG - State updates in FSM reducer (causes infinite loops)
case 'KEY_TAKEAWAYS_SUCCESS':
  contextSetters.setAiKeyTakeawaysJson(event.payload.data); // DON'T DO THIS
```

## Development Guidelines

### 1. Code Quality Standards
- **TypeScript**: Strict mode enabled, use `import type` for type imports
- **Error Handling**: Wrap all async operations in try/catch blocks
- **Logging**: Use `logDebug()` for client-side, `console.*` for server-side
- **Validation**: Use Zod schemas for all data validation

### 2. UI/UX Conventions
- **Components**: ShadCN UI components with Tailwind styling
- **Icons**: Lucide React icons
- **Loading States**: Derive from FSM state, not data content parsing
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
- **Update Policy**: Always update `appVersion` and `lastUpdatedTimestamp` for any code changes
- **Versioning Scheme**: `v3.w.x.y.z` format

## Testing & Quality Assurance
- Always run `npm run lint` and `npm run typecheck` before committing
- The application uses the "Deterministic Handler" pattern specifically to avoid race conditions
- FSM feedback loop ensures UI always reflects true application state

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
- **Logging**: `logDebug()` for client-side, `console.*` for server-side

## Performance & Optimization

### Recent Achievements (v3.7.4.4)
- **Token Reduction**: 27.9% reduction achieved (~75K tokens total)
- **React Anti-Patterns**: All infinite render loops eliminated
- **Console Logging**: Cleaned up for production-ready output
- **Bundle Size**: Reduced by 12% through code consolidation

### Current Metrics
- **Context Window Usage**: 75K tokens = 37.5% of 200K AI limit
- **Build Time**: Reduced by 15%
- **Type Checking**: 40% faster

## Important Notes for AI Assistants
1. **Never modify the core FSM feedback loop** without explicit user approval
2. **Always preserve the deterministic handler pattern** in main-tab-content.tsx
3. **Batch state updates** with startTransition to prevent render loops
4. **Derive UI loading states from FSM**, not by parsing data content
5. **Keep orchestrator logic separate from reducer logic** to prevent infinite loops
6. **Always update version metadata** in `src/config/app-metadata.json` for any code changes

This architecture has been battle-tested through multiple refactoring cycles and represents the most stable pattern for this application's complexity level.