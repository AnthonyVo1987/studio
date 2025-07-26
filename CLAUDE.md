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

## High-Level Architecture (v4.0.0.0+)

### Core Technology Stack
- **Frontend**: Next.js 15.3.3 with React 18.3.1
- **AI Backend**: Google Genkit + Google AI SDK
- **State Management**: Three-Layer Architecture with React Context + FSM
- **UI Components**: ShadCN UI + Tailwind CSS
- **Data Sources**: Polygon.io API
- **AI Model**: Google Gemini 2.5-flash-lite

### Three-Layer Architecture (MANDATORY)

**The application uses a strict three-layer separation to prevent race conditions and infinite render loops:**

#### 1. Business Logic Layer
- **Location**: `src/contexts/business-logic-context.tsx`
- **Purpose**: Pure business logic, FSM state management, and data processing
- **FSM States**: Defined in `BusinessFsmState` enum (APP_INITIALIZING, IDLE, DATA_FETCH_IN_PROGRESS, etc.)
- **Orchestrator**: `src/components/business-orchestrator.tsx` - Executes business pipeline without UI concerns
- **Critical Rule**: Business logic NEVER depends on UI state - only on raw data and FSM state

#### 2. UI State Layer  
- **Location**: `src/contexts/ui-state-context.tsx`
- **Purpose**: Transforms business data into UI-ready snapshots with "1 step behind" lag mechanism
- **Key Feature**: 500ms delay between business state changes and UI updates for stability
- **UI Snapshots**: Pre-transformed, versioned data structures that UI components consume
- **Anti-Pattern**: UI components must NEVER use business context directly

#### 3. Presentation Layer
- **Location**: `src/components/main-tab-content-ui.tsx` + all display components
- **Purpose**: Pure UI rendering using only UI snapshots
- **Pattern**: All display components consume `useUIState()` hook, never `useStockAnalysis()`
- **Loading States**: Derived from UI snapshots, not by parsing data content

## File Organization

### Core Architecture Files (Tier 1 - Critical)
- `src/contexts/business-logic-context.tsx` - Business logic & FSM state management
- `src/contexts/ui-state-context.tsx` - UI state transformation layer with lag mechanism
- `src/components/business-orchestrator.tsx` - Business pipeline execution (no UI)
- `src/components/main-tab-content-ui.tsx` - Main UI component (presentation only)
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

## Critical Architectural Rules (v4.0.0.0+)

### 1. Three-Layer Separation (NON-NEGOTIABLE)
```typescript
// CORRECT - UI component using UI snapshots only
const MyDisplayComponent = () => {
  const { currentSnapshot } = useUIState(); // ✅ Correct
  return <div>{currentSnapshot.stockSnapshot.ticker}</div>;
};

// WRONG - UI component accessing business logic directly  
const MyDisplayComponent = () => {
  const { stockSnapshotJson } = useStockAnalysis(); // ❌ ARCHITECTURE VIOLATION
  const data = JSON.parse(stockSnapshotJson); // ❌ Raw parsing in UI
  return <div>{data.ticker}</div>;
};
```

### 2. FSM Feedback Loop (Business Layer Only)
```typescript
// CORRECT - Business orchestrator pattern with FSM feedback
const BusinessOrchestrator = () => {
  const handleAnalyzeStock = async () => {
    // Update business state BEFORE dispatching FSM event
    if (result.status === 'success' && result.data) {
      setAiKeyTakeawaysJson(result.data.aiKeyTakeawaysJson);
    }
    // REQUIRED: Dispatch FSM event for business state transition
    dispatchGlobalFsmEvent({ 
      type: result.status === 'success' ? 'KEY_TAKEAWAYS_SUCCESS' : 'KEY_TAKEAWAYS_FAILURE', 
      payload: result 
    });
  };
};
```

### 3. UI State Lag Mechanism
```typescript
// Built-in 500ms delay in UI State Context
// Business logic updates immediately, UI updates with delay for stability
// This prevents race conditions and ensures "1 step behind" UI behavior
```

### 4. React Anti-Pattern Prevention
- **Never update state during render phase** (inside reducers)
- **Never call setters inside useEffect dependency arrays** (causes loops)
- **Always batch multiple state updates** with `startTransition`
- **UI components derive ALL state from UI snapshots**, never raw data parsing

## Development Guidelines

### 1. Code Quality Standards
- **TypeScript**: Strict mode enabled, use `import type` for type imports
- **Error Handling**: Wrap all async operations in try/catch blocks
- **Logging**: Use `logDebug()` for client-side, `console.*` for server-side
- **Validation**: Use Zod schemas for all data validation

### 2. UI/UX Conventions
- **Components**: ShadCN UI components with Tailwind styling
- **Icons**: Lucide React icons
- **Loading States**: Derive from UI snapshots, never from business state or data parsing
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
- **Versioning Scheme**: `v4.w.x.y.z` format (v4.0.0.0+ for major architecture overhaul)

## Testing & Quality Assurance
- Always run `npm run lint` and `npm run typecheck` before committing
- Three-layer architecture eliminates race conditions through separation of concerns
- UI snapshots ensure UI always reflects stable business state with controlled lag

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

### Recent Achievements (v4.0.0.0+)
- **Architecture Overhaul**: Complete three-layer separation eliminates all race conditions
- **React Anti-Patterns**: UI snapshot pattern prevents all infinite render loops
- **Race Condition Prevention**: 500ms lag mechanism ensures stability
- **Display Component Refactor**: All 7 display components converted to pure presentation layer

### Current Metrics
- **Architecture Stability**: Zero race conditions through three-layer separation
- **UI Responsiveness**: Controlled 500ms delay for smooth user experience
- **Code Maintainability**: Clear separation of concerns across all layers

## Important Notes for AI Assistants (v4.0.0.0+)
1. **NEVER violate the three-layer architecture** - UI components must only use `useUIState()`, never `useStockAnalysis()`
2. **Always preserve the business orchestrator pattern** in `business-orchestrator.tsx`
3. **UI components are pure presentation** - no JSON parsing, no business logic, only snapshot consumption
4. **Respect the 500ms lag mechanism** - business updates immediately, UI updates with controlled delay
5. **Keep business logic completely separate from UI state** - unidirectional data flow only
6. **Always update version metadata** in `src/config/app-metadata.json` for any code changes
7. **Display components follow the pattern**: `useUIState()` → consume snapshots → render

This three-layer architecture was designed after extensive refactoring to eliminate all race conditions and infinite render loops. It represents the most battle-tested and stable pattern for this application's complexity level.