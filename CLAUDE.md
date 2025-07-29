# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Operating Mode Guidelines

**Agents**: Call and Use whatever Agents needed for the requested task(s), allowing ALL tool and MCP Tool use for ALL Agents:

### Tool Usage Optimization Guidelines

**CRITICAL**: All AI specialists must follow these enhanced tool usage practices for optimal efficiency and quality delivery.

#### Sequential Thinking Tool - Decision Criteria

**✅ OPTIMAL USE CASES:**
- Complex multi-step analysis requiring systematic breakdown
- Tasks with uncertain scope or evolving requirements that need exploration
- Architecture decisions needing comprehensive evaluation of trade-offs
- Problem diagnosis requiring step-by-step reasoning and validation
- Feature planning with multiple dependencies and integration points
- Code review tasks involving complex architectural patterns

**❌ AVOID FOR:**
- Simple, straightforward single-step tasks (e.g., updating a single field)
- Well-understood patterns already established in codebase
- Basic syntax questions or routine implementation tasks
- Tasks with clear, predetermined solutions

**Quality Metrics:**
- Use when task complexity score > 7/10 (requires significant analysis)
- Apply for tasks estimated >2 hours of implementation time
- Essential for tasks affecting multiple system components

#### Context7 Tool - Decision Criteria  

**✅ OPTIMAL USE CASES:**
- Research on current best practices for technology stack components
- Understanding new libraries/frameworks being integrated into project
- Industry standards for implementation approaches not documented locally
- External API integration patterns and authentication methods
- Performance optimization techniques for specific technologies
- Security best practices for financial application development

**❌ AVOID FOR:**
- Well-known patterns already documented in project CLAUDE.md
- Simple syntax or basic language feature questions
- Internal project-specific patterns and conventions
- Tasks using established project utilities and helpers

**Quality Metrics:**
- Use when integrating external technologies or APIs
- Apply for tasks requiring industry-standard compliance
- Essential for security-critical implementations

#### Tool Call Optimization Patterns

**Efficient Tool Usage:**
```
1. Assess task complexity before beginning
2. Choose appropriate tool based on decision criteria
3. Use tools proactively at task start, not reactively during work
4. Document tool insights in deliverables
5. Avoid tool stacking unless genuinely required
```

**Anti-Patterns to Avoid:**
- Using both tools for simple tasks
- Excessive tool calls that don't add measurable value
- Tool usage without incorporating insights into implementation
- Sequential tool calls with redundant information gathering

### Custom Slash Commands
- **Custom slash command "/new_task"**: ✅ **IMPLEMENTED** - NEW WORKFLOW: User runs "/new_task" command which activates @tech-lead-orchestrator to read `docs/new_task_details.md` (user-filled task template) and coordinate AI development team delegation workflow. Stored as `.claude/commands/new_task.md`
- **Custom slash command "/close_task"**: Add new custom slash command for "/close_task" that will call the task-finalizer agent to close the current task with complete documentation updates and git commit workflow

### New Task Workflow Process (NEW WORKFLOW)

#### User Workflow Steps:
1. **User Preparation**: User fills out the standardized task template at `docs/new_task_details.md` with complete task requirements, objectives, and context
2. **Task Initiation**: User runs the "/new_task" custom command in Claude Code
3. **Orchestrator Activation**: Command automatically activates @tech-lead-orchestrator to coordinate the task
4. **Team Delegation**: @tech-lead-orchestrator reads the task template and delegates to appropriate AI development team specialists

#### Template-Driven Task Management:
- **Structured Requirements**: All tasks must follow the `docs/new_task_details.md` template format for consistency
- **Specialist Assignment Matrix**: Template includes clear mapping of task types to appropriate specialists
- **Quality Gates**: Built-in checkpoints ensure proper code review and testing before delivery
- **Documentation Requirements**: Mandatory documentation updates specified for each task type
- **Progress Tracking**: Template milestones enable systematic progress monitoring

#### Orchestrator Responsibilities in New Workflow:
- **Template Analysis**: Read and parse the user-filled `docs/new_task_details.md` template
- **Tool Usage Coordination**: Apply enhanced tool usage guidelines and share with specialists
- **Task Breakdown**: Decompose complex requirements into specialist-appropriate subtasks
- **Team Coordination**: Route tasks to appropriate specialists based on technical requirements
- **Tool Selection Guidance**: Ensure specialists use appropriate tools based on task complexity
- **Quality Assurance**: Ensure all template requirements and quality gates are met
- **Progress Management**: Monitor task completion against template milestones

**CRITICAL**: @tech-lead-orchestrator remains a **COORDINATION-ONLY** role and must delegate all hands-on implementation work to appropriate specialists as defined in the "Tech Lead Orchestrator Operating Rules" section.

## Tech Lead Orchestrator Operating Rules

### CRITICAL: Orchestrator Role Boundaries
The **@tech-lead-orchestrator** is a **COORDINATION-ONLY** role and MUST NEVER perform hands-on implementation work. The orchestrator's sole responsibilities are:

#### ✅ ALLOWED Orchestrator Activities:
- **Task Analysis & Planning**: Break down complex tasks into specific, actionable subtasks
- **Tool Usage Guidance**: Share enhanced tool usage guidelines with specialists and monitor appropriate tool selection
- **Specialist Assignment**: Route tasks to appropriate specialist agents based on technical requirements
- **Team Coordination**: Manage communication and dependencies between multiple specialists
- **Progress Tracking**: Monitor task completion and identify blockers or bottlenecks
- **Architecture Guidance**: Provide high-level architectural direction and decision-making
- **Quality Gate Management**: Ensure code review processes are followed before delivery
- **Documentation Coordination**: Ensure proper documentation updates accompany code changes

#### ❌ PROHIBITED Orchestrator Activities:
- **Direct Code Implementation**: Writing, editing, or modifying any source code files
- **File System Operations**: Creating, editing, or deleting files (except coordination documentation)
- **Tool Execution**: Running builds, tests, linting, or any development commands
- **Hands-On Analysis**: Performing detailed code analysis that specialists should handle
- **Direct Problem Solving**: Implementing technical solutions instead of delegating

### Required Delegation Patterns

#### 1. Implementation Tasks → Specialists
```
❌ WRONG: Orchestrator writes code directly
✅ CORRECT: "Delegating to @react-component-architect to implement the new ticker input component"
```

#### 2. Code Analysis → Specialists
```
❌ WRONG: Orchestrator analyzes code patterns
✅ CORRECT: "Assigning @code-reviewer to analyze the current context isolation patterns"
```

#### 3. Problem Diagnosis → Specialists
```
❌ WRONG: Orchestrator debugs issues directly
✅ CORRECT: "Routing to @performance-optimizer to diagnose the rendering performance issue"
```

### Standard Task Workflow

#### Phase 1: Task Analysis (Orchestrator)
1. **Parse Requirements**: Understand the complete scope and objectives
2. **Identify Dependencies**: Determine what components/systems are affected
3. **Break Down Tasks**: Create specific, actionable subtasks for specialists
4. **Resource Planning**: Estimate complexity and required specialist skills

#### Phase 2: Specialist Assignment (Orchestrator)
1. **Route Tasks**: Assign each subtask to the most appropriate specialist
2. **Provide Context**: Share relevant project context and requirements
3. **Set Expectations**: Define deliverables and success criteria
4. **Establish Timeline**: Coordinate dependencies between specialists

#### Phase 3: Execution Monitoring (Orchestrator)
1. **Track Progress**: Monitor specialist work without interfering
2. **Facilitate Communication**: Help specialists coordinate when needed
3. **Remove Blockers**: Address issues that prevent specialist progress
4. **Quality Assurance**: Ensure code review processes are followed

#### Phase 4: Integration & Delivery (Orchestrator)
1. **Coordinate Delivery**: Ensure all specialists complete their assigned work
2. **Documentation Review**: Verify all documentation is updated appropriately
3. **Final Quality Gate**: Confirm code review and testing requirements are met
4. **Task Closure**: Follow the established task finalization workflow

### New Task Template Integration (Updated for NEW WORKFLOW)

**IMPORTANT**: The new workflow is fully integrated with the standardized task template at `docs/new_task_details.md`. This template provides:
- **Structured Task Definition**: Consistent format for all development tasks
- **Specialist Assignment Matrix**: Clear mapping of task types to appropriate specialists
- **Quality Gates**: Required checkpoints before task completion
- **Documentation Requirements**: Mandatory updates for different task types

#### Template Usage in NEW WORKFLOW:
1. **User Template Completion**: User fills out `docs/new_task_details.md` with complete task requirements before running "/new_task" command
2. **Orchestrator Template Reading**: @tech-lead-orchestrator reads the user-completed template to understand full task scope
3. **Specialist Briefing**: Template sections provide structured context for specialist assignments
4. **Progress Tracking**: Template milestones enable systematic progress monitoring
5. **Task Closure**: All template requirements must be completed before task finalization

#### Workflow Integration Benefits:
- **Consistent Task Structure**: Every task follows the same standardized format
- **Reduced Communication Overhead**: Template ensures all required context is captured upfront
- **Quality Assurance**: Built-in quality gates prevent delivery of incomplete work
- **Documentation Compliance**: Mandatory documentation requirements are clearly specified
- **Specialist Efficiency**: Clear task assignments eliminate role confusion and overlap

### Escalation Procedures

#### When Orchestrator Role is Violated:
1. **Immediate Stop**: Halt any hands-on implementation activity
2. **Reassess Task**: Determine which specialist should handle the work
3. **Proper Delegation**: Route the task to the appropriate specialist with clear requirements
4. **Document Violation**: Note the role boundary violation for future prevention

#### When Specialists Need Coordination:
1. **Cross-Team Dependencies**: Orchestrator facilitates communication between specialists
2. **Resource Conflicts**: Orchestrator manages competing priorities and resource allocation
3. **Technical Decisions**: Orchestrator provides architectural guidance without implementing
4. **Quality Issues**: Orchestrator ensures proper code review processes are followed

### Success Metrics for Orchestration

#### Effective Orchestration Indicators:
- **Clear Task Delegation**: All implementation work is assigned to appropriate specialists
- **Enhanced Tool Usage**: Specialists apply appropriate tools based on task complexity guidelines
- **Minimal Role Boundary Violations**: Orchestrator stays within coordination responsibilities
- **Efficient Specialist Utilization**: Right specialist assigned to right task consistently
- **Quality Gate Compliance**: All code reviews and testing requirements are met
- **Documentation Completeness**: All required documentation updates are coordinated

#### Warning Signs of Poor Orchestration:
- **Orchestrator Implementing Code**: Direct hands-on work instead of delegation
- **Specialist Confusion**: Unclear task assignments or missing context
- **Quality Gate Bypasses**: Code delivered without proper review processes
- **Documentation Gaps**: Missing or incomplete documentation updates
- **Task Bottlenecks**: Orchestrator becomes a bottleneck instead of enabler

This orchestration model ensures clear role separation, effective delegation, and consistent quality delivery while preventing role boundary violations that can lead to inefficient workflow and quality issues.

## Overview
StockSage is a Next.js financial analysis application that provides real-time stock data, options chain analysis, and AI-powered insights using Google's Gemini AI models. As of v4.4.1.0, it features a simplified two-tab architecture with NVDA and SPY dedicated analysis tabs, each with advanced specialized AI chat systems and ticker-agnostic logging. Phase 1 of the architecture cleanup has been completed, removing 38 legacy files and eliminating all dead code for optimal performance.

## Common Development Commands

### Build & Development
```bash
npm run dev          # Development server (http://localhost:9002) - USER RESERVED PORT
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint linting (fully configured)
npm run typecheck    # TypeScript type checking
npm run genkit:dev   # Genkit AI flows dev server (http://localhost:3400)
npm run genkit:watch # Genkit AI flows dev server with watch mode
```

### IMPORTANT: Port Usage Guidelines
**USER RESERVED PORTS - DO NOT USE FOR TESTING:**
- **Port 9002**: Reserved exclusively for user development testing
- **Port 3400**: Reserved for user Genkit testing

**CLAUDE CODE TESTING PORTS - USE THESE FOR INTERNAL TESTING:**
When Claude Code needs to test builds or start development servers for code review or testing purposes, use these alternative ports to avoid conflicts:
```bash
# For internal testing only - DO NOT use user ports 9002 or 3400
next dev --turbopack -p 9003    # Claude Code dev server testing
next dev --turbopack -p 9004    # Alternative testing port
genkit start -p 3401            # Claude Code Genkit testing
```

### Critical Pre-Commit Commands
Always run these before committing:
```bash
npm run lint         # ESLint is fully configured and operational
npm run typecheck    # TypeScript type checking
```

### ESLint Configuration
- **Status**: Fully configured and operational ESLint setup
- **Configuration Files**: ESLint config files are committed to the project
- **Customization**: ESLint settings and configuration can be updated by Claude Code on an as-needed basis for project requirements
- **Integration**: ESLint is integrated with the build process and pre-commit workflow

## High-Level Architecture (v4.4.1.0)

### Core Technology Stack
- **Frontend**: Next.js 15.3.3 with React 18.3.1
- **AI Backend**: Google Genkit + Google AI SDK
- **State Management**: Standard React Context + FSM (Simplified)
- **UI Components**: ShadCN UI + Tailwind CSS
- **Data Sources**: Polygon.io API
- **AI Model**: Google Gemini 2.5-flash-lite

### Simplified Two-Tab Architecture (v4.4.1.0)

**The application features a clean two-tab architecture using standard React best practices:**

#### Tab Architecture Overview
1. **NVDA Dedicated Tab** - Complete NVDA-specific analysis with advanced AI chat system
2. **SPY Dedicated Tab** - Production-ready SPY analysis serving as blueprint reference

#### 1. NVDA Context Layer
- **Location**: `src/contexts/nvda-analysis-context.tsx`
- **Purpose**: Dedicated state management for NVDA analysis only
- **Pattern**: Context + Reducer with custom hooks (`useNvdaAnalysis()`, `useNvdaDispatch()`)
- **Isolation**: Zero cross-dependencies with SPY context
- **FSM States**: Simplified enum (APP_INITIALIZING, IDLE, LOADING)

#### 2. SPY Context Layer (Blueprint Reference)
- **Location**: `src/contexts/spy-analysis-context.tsx`
- **Purpose**: Dedicated state management for SPY analysis only
- **Pattern**: Context + Reducer with custom hooks (`useSpyAnalysis()`, `useSpyDispatch()`)
- **Isolation**: Zero cross-dependencies with NVDA context
- **Blueprint Quality**: Production-ready architecture serving as reference implementation

### NVDA Dedicated Architecture (v4.4.1.0)

**Complete NVDA-specific analysis tab with advanced AI chat system:**

#### 1. NVDA UI Components
- **Main Component**: `src/components/nvda-tab-content.tsx` - Deterministic handlers for NVDA
- **Data Section**: `src/components/nvda-data-section.tsx` - NVDA-specific JSON display
- **Display Components**: `nvda-*.tsx` pattern - All NVDA-isolated components
- **Advanced Chat**: `src/components/nvda-consolidated-chat.tsx` - NVDA-focused trading AI chat
- **AI Analysis**: Complete feature parity with SPY tab implementation
- **Server Actions**: `nvda-consolidated-chat-action.ts` with NVDA-specific configurations

#### 2. Ticker-Agnostic Logging System (v4.4.1.0)
- **Location**: `src/lib/ticker-logger.ts` - Centralized logging utility for both ticker tabs
- **Purpose**: Standardized console messaging across NVDA and SPY contexts to avoid UI/render infinite loops
- **Pattern**: Function factory that accepts ticker, page context, and data context for consistent formatting
- **Usage**: `tickerLogger(ticker, 'NVDA Tab', 'Data Fetch', data)` produces formatted console messages
- **Benefits**: 
  - Eliminates duplicate console message logic across tabs
  - Prevents UI/render infinite loops with proper logging guards
  - Consistent debugging experience across NVDA and SPY tabs
  - Centralized console message formatting and filtering

### SPY Dedicated Architecture (v4.4.1.0 - Blueprint Reference)

**Production-ready SPY analysis serving as architecture blueprint:**

#### 1. SPY UI Components
- **Main Component**: `src/components/spy-tab-content.tsx` - Deterministic handlers
- **Data Section**: `src/components/spy-data-section.tsx` - Self-contained JSON display
- **Display Components**: `spy-*.tsx` pattern - All SPY-isolated components
- **Advanced Chat**: `src/components/spy-consolidated-chat.tsx` - Specialized trading-focused AI chat
- **AI Analysis**: Complete AI Key Takeaways and Options Analysis functionality
- **Server Actions**: `spy-consolidated-chat-action.ts` with SPY-specific configurations

#### 3. Advanced SPY Chat Architecture (v4.1.18.0)
- **Specialized Prompt System**: Three distinct trading-focused prompt templates:
  - `stock-trader-takeaways.json` - Trading-focused market analysis
  - `options-trader-takeaways.json` - Options strategy insights
  - `holistic-takeaways.json` - Comprehensive market analysis
- **Enhanced UI/UX**: Dynamic responsive design with cross-device optimization
  - Adaptive sizing: `min-h-[400px] max-h-[80vh]` with breakpoint responsiveness
  - Textarea component for enhanced multi-line input experience
  - Improved UX flow with Chat Mode toggle positioned near input section
- **Comprehensive Export Features**: Copy/Export JSON functionality for chat responses
  - **Truncated Export Capability (v4.1.17.0)**: "Copy Truncated" and "Export Truncated" options for SPY Raw Data
  - Options chain data is summarized (strike count, call/put count, ranges) for reduced token usage
- **Advanced Race Condition Protection**: 
  - Request ID tracking prevents concurrent request conflicts
  - Automatic 30-second timeout cleanup prevents stuck states
  - Complete request validation with currentRequestId checks
- **Granular Debug Data Storage (v4.1.17.0)**: Dedicated raw debug data for each AI Chat response type
  - **App Data Button Responses**: `stockTraderTakeawaysRawJson`, `optionsTraderTakeawaysRawJson`, `holisticTakeawaysRawJson`
  - **Web Search Button Responses**: `supportResistanceWebSearchRawJson`, `technicalAnalysisWebSearchRawJson`, `optionsFlowWebSearchRawJson`
  - **User Input Responses**: Separated by mode (`userInputAppDataRawJson`, `userInputWebSearchRawJson`)
  - **Context Tracking**: Request context storage for proper debug data mapping
- **Optimized AI Response Quality (v4.1.17.0)**:
  - **Temperature Optimization**: Reduced from 0.7 to 0.2 for more focused, deterministic responses
  - **Web Search Date Grounding**: Current date extraction from market status data for accurate search context
  - All web search prompts include "as of mm/dd/yyyy" for temporal accuracy
- **Technical Excellence**: 
  - Proper `startTransition` usage with `useActionState` to prevent async errors
  - Modern Google GenAI SDK with conditional GoogleSearch tool
  - Comprehensive error handling with toast notifications and timeout protection
  - Enhanced console logging with detailed request lifecycle tracking
  - Maintainable constants (CHAT_HEIGHTS, TEXTAREA_CONFIG)
  - Safe JSON parsing with error handling and user feedback
- **Server Action**: `spy-consolidated-chat-action.ts` with advanced request lifecycle management

#### 4. SPY Blueprint Architecture System (v4.1.18.0)
- **Configuration System**: `src/lib/ticker-blueprint-config.ts` - Centralized configuration factory for ticker-specific pages
- **Replication Guide**: Complete architectural blueprint with naming conventions, component patterns, and implementation examples
- **Factory Pattern**: `createTickerConfig()` function generates ticker-specific configurations (NVDA, AAPL, MSFT, TSLA, GOOGL, AMZN)
- **Blueprint Quality Score**: 9.8/10 - SPY architecture validated as production-ready blueprint through comprehensive multi-agent review
- **Implementation Examples**: Detailed step-by-step replication guides for creating new ticker-specific analysis pages
- **Architectural Patterns**: 
  - Context isolation with dedicated providers
  - Component naming conventions (`${ticker.toLowerCase()}-*-display.tsx`)
  - Configuration-driven UI generation
  - Deterministic handler patterns
  - FSM integration patterns
- **Pre-configured Tickers**: SPY, NVDA, AAPL, MSFT, TSLA, GOOGL, AMZN with complete configuration objects

## File Organization

### Core Architecture Files (Tier 1 - Critical)
- `src/contexts/nvda-analysis-context.tsx` - NVDA dedicated state management (isolated)
- `src/contexts/spy-analysis-context.tsx` - SPY dedicated state management (isolated) - **BLUEPRINT REFERENCE**
- `src/components/nvda-tab-content.tsx` - NVDA orchestrator with deterministic handlers
- `src/components/spy-tab-content.tsx` - SPY UI component with deterministic handlers - **BLUEPRINT REFERENCE**
- `src/services/data-sources/adapters/polygon-adapter.ts` - API integration
- `src/types/` - Type definitions directory (e.g., `options.ts`)
- `src/lib/ticker-logger.ts` - Ticker-agnostic logging system for both tabs

### Server Actions (Tier 2 - High Priority)
- `src/actions/analyze-stock-server-action.ts` - Stock data fetching
- `src/actions/analyze-ta-action.ts` - Technical analysis
- `src/actions/perform-ai-analysis-action.ts` - AI key takeaways
- `src/actions/perform-ai-options-analysis-action.ts` - AI options analysis
- `src/actions/spy-consolidated-chat-action.ts` - SPY unified AI chat with conditional web search
- `src/actions/nvda-consolidated-chat-action.ts` - NVDA unified AI chat with conditional web search

### AI Flows & Prompts (Tier 2 - High Priority)
- `src/ai/flows/` - Genkit AI flow definitions
- `src/ai/definitions/` - JSON prompt templates
- `src/ai/schemas/` - Zod validation schemas
- `src/ai/schemas/nvda-consolidated-chat-schemas.ts` - NVDA-specific chat validation schemas
- `src/ai/schemas/spy-consolidated-chat-schemas.ts` - SPY-specific chat validation schemas

## Critical Architectural Rules (v4.4.1.0)

### 1. Two-Tab Context Pattern
```typescript
// CORRECT - NVDA component using NVDA context directly
const NvdaDisplayComponent = () => {
  const nvda = useNvdaAnalysis(); // ✅ Correct for NVDA tab
  
  // Parse JSON data as needed
  const stockData = nvda.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(nvda.stockSnapshotJson);
      return parsed.results?.[0] || {};
    } catch (e) { return {}; }
  })() : {};
  
  return <div>{stockData.ticker}</div>;
};

// CORRECT - SPY component using SPY context directly
const SpyDisplayComponent = () => {
  const spy = useSpyAnalysis(); // ✅ Correct for SPY tab
  
  // Same pattern for SPY data
  return <div>{/* SPY-specific rendering */}</div>;
};
```

### 2. On-Demand Handler Pattern (Tab Components)
```typescript
// CORRECT - Deterministic handler pattern in nvda-tab-content.tsx
const NvdaTabContent = () => {
  const nvda = useNvdaAnalysis();
  
  const handleOnDemandDataFetch = async () => {
    // Set loading state
    nvda.dispatchGlobalFsmEvent({ type: 'SET_LOADING' });
    
    try {
      // Execute server action
      const result = await fetchStockDataAction({ticker: 'NVDA'});
      
      // Update NVDA state based on result
      if (result.status === 'success' && result.data) {
        nvda.setStockSnapshotJson(result.data.stockSnapshotJson);
      }
    } finally {
      // Reset to idle state
      nvda.dispatchGlobalFsmEvent({ type: 'SET_IDLE' });
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
- **Current Version**: v4.4.1.0 (as of this documentation update)
- **Update Policy**: Always update `appVersion` and `lastUpdatedTimestamp` for any code changes
- **Versioning Scheme**: `v4.w.x.y.z` format (v4.4.1.0 latest with Phase 1 architecture cleanup - removed 38 legacy files, simplified to two-tab architecture with NVDA and SPY dedicated tabs)

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

## Important Notes for AI Assistants (v4.4.1.0)

1. **Two-Tab Simplified Architecture** - Application now features only NVDA and SPY dedicated tabs
2. **Use ticker-specific React patterns** - NVDA components use `useNvdaAnalysis()`, SPY components use `useSpyAnalysis()`
3. **Maintain deterministic handler patterns** in `nvda-tab-content.tsx` and `spy-tab-content.tsx` for on-demand operations
4. **Parse JSON data in components** as needed using try/catch patterns for safety
5. **AI actions are on-demand only** - no automated pipeline states or toggles
6. **Keep business logic in context** - UI components focus on presentation
7. **Always update version metadata** in `src/config/app-metadata.json` for any code changes
8. **Display components follow the pattern**: `useNvdaAnalysis()` or `useSpyAnalysis()` → parse data → derive loading states → render
9. **FSM has minimal states** - APP_INITIALIZING, IDLE, LOADING (for any on-demand operation)
10. **Complete Context Isolation** - NVDA and SPY contexts have zero cross-dependencies
11. **Component Naming Patterns**:
    - NVDA: `nvda-*.tsx` pattern with NVDA-specific implementations
    - SPY: `spy-*.tsx` pattern serving as blueprint reference
12. **SPY Blueprint Reference** - SPY tab serves as production-ready architecture blueprint:
    - **Advanced AI Chat**: Specialized trading-focused prompts (stock-trader, options-trader, holistic)
    - **Enhanced UI/UX**: Dynamic responsive design with comprehensive export features
    - **Race Condition Protection**: Request ID tracking prevents concurrent conflicts
    - **Error Handling**: Toast notifications and safe JSON parsing
13. **Ticker-Agnostic Logging** - Use `tickerLogger()` from `src/lib/ticker-logger.ts` for console messaging:
    - Prevents UI/render infinite loops with proper logging guards
    - Standardized format: `tickerLogger(ticker, pageContext, actionContext, data)`
    - Works for both NVDA and SPY tabs
14. **Phase 1 Cleanup Complete** - 38 legacy files removed, zero dead code remaining:
    - No Main tab references (`business-logic-context.tsx`, `main-tab-content-ui.tsx`)
    - No User Input ticker components (`user-ticker-*.tsx`)
    - Clean build with optimized bundle size
15. **Build Configuration** - TypeScript and ESLint errors ignored during builds for deployment flexibility
16. **Tech Lead Orchestrator Role Boundaries** - CRITICAL role separation enforced:
    - **@tech-lead-orchestrator is COORDINATION-ONLY**: Must never perform hands-on implementation work
    - **Mandatory Delegation**: All code writing, editing, and technical tasks must be delegated to appropriate specialists
    - **Task Template Compliance**: All workflows must reference `docs/new_task_details.md` template structure
    - **Quality Gate Enforcement**: Orchestrator ensures code review processes without performing reviews directly
    - **Role Violation Prevention**: Immediate halt and reassignment if orchestrator attempts hands-on work

This architecture (v4.4.1.0) represents a clean, simplified two-tab system with NVDA and SPY dedicated analysis tabs. Each tab features complete state isolation, advanced AI chat systems, and optimized performance through Phase 1 legacy code cleanup.

---

## AI Development Team Configuration
*Updated for v4.4.1.0 on 2025-07-29*

Your StockSage project has been analyzed and configured with a specialized AI development team optimized for your simplified two-tab Next.js financial analysis application.

### Detected Technology Stack
- **Frontend**: Next.js 15.3.3 with React 18.3.1, App Router architecture
- **AI Backend**: Google Genkit + Google AI SDK with Gemini 2.5-flash-lite
- **UI Framework**: ShadCN UI components with Tailwind CSS
- **State Management**: React Context with useReducer patterns
- **Data Sources**: Polygon.io API for real-time financial data
- **Type Safety**: TypeScript with Zod validation schemas
- **Architecture**: Server Actions, Server Components, and isolated context patterns

### Specialist Team Assignments

#### 🚀 Frontend Development & Architecture
- **Next.js Applications** → @react-nextjs-expert
  - App Router architecture, Server Components, Server Actions
  - SSR/SSG optimization, ISR for financial data caching
  - Performance optimization for real-time data rendering
  
- **React Components** → @react-component-architect
  - Complex financial UI components (charts, tables, data displays)
  - State management patterns with Context and useReducer
  - Interactive trading interfaces and dashboard components
  
- **UI/UX Implementation** → @tailwind-css-expert
  - ShadCN UI component customization and theming
  - Responsive design for financial dashboards
  - Mobile-first approach for trading interfaces

#### 🔧 Backend & API Development
- **AI Flow Development** → @api-architect
  - Google Genkit flow design and optimization
  - Server Actions architecture for AI analysis
  - Financial data processing and validation patterns
  
- **Data Integration** → @backend-developer
  - Polygon.io API integration and optimization
  - Real-time data fetching strategies
  - Error handling and retry logic for financial APIs
  
- **AI Prompt Engineering** → @api-architect
  - Specialized trading prompt system (stock-trader, options-trader, holistic)
  - Context-aware AI analysis for financial insights
  - Gemini model optimization for financial use cases

#### 🔍 Quality Assurance & Optimization
- **Code Review & Security** → @code-reviewer
  - Financial application security audits
  - React anti-pattern prevention
  - Context isolation and state management review
  
- **Performance Optimization** → @performance-optimizer
  - Real-time data rendering optimization
  - Bundle analysis and code splitting
  - Memory management for continuous market data
  
- **Documentation & Analysis** → @documentation-specialist
  - Codebase architecture documentation
  - API documentation and integration guides
  - Financial feature specifications

#### 🎯 Project Management & Coordination
- **Technical Leadership** → @tech-lead-orchestrator
  - **COORDINATION-ONLY ROLE** (see Tech Lead Orchestrator Operating Rules above)
  - Cross-team coordination for complex features
  - Architecture decision guidance
  - Release planning and version management
  - MUST delegate all hands-on work to appropriate specialists
  
- **Project Analysis** → @project-analyst
  - Feature requirement analysis
  - Technology stack optimization recommendations
  - Development workflow improvements

### Task-Based Routing Examples

**For Frontend Development:**
- "Build a new NVDA options chain component" → @react-component-architect
- "Create SPY data visualization component" → @react-component-architect
- "Optimize two-tab navigation for mobile devices" → @tailwind-css-expert
- "Implement real-time chart updates for NVDA/SPY" → @react-nextjs-expert

**For Backend & AI:**
- "Create a new AI analysis prompt for earnings data" → @api-architect
- "Optimize Polygon.io data fetching" → @backend-developer
- "Design REST endpoints for portfolio tracking" → @api-architect

**For Quality & Performance:**
- "Review the SPY chat implementation" → @code-reviewer
- "Optimize bundle size and loading times" → @performance-optimizer
- "Audit financial data security" → @code-reviewer

**For Project Coordination:**
- "Plan the v4.2 release features" → @tech-lead-orchestrator
- "Analyze technical debt in the codebase" → @project-analyst
- "Document the new AI prompt system" → @documentation-specialist

### Specialized Knowledge Areas

#### Financial Application Expertise
- **Real-time Data Handling**: Optimized for continuous market data streams
- **Trading Interface Design**: NVDA and SPY focused UI with advanced chat systems
- **AI Financial Analysis**: Context-aware prompts for stock and options analysis
- **Performance Optimization**: Efficient rendering for high-frequency data updates
- **Simplified Architecture**: Clean two-tab system with zero legacy dependencies

#### React/Next.js Best Practices
- **Context Isolation**: Separate contexts for NVDA and SPY tabs with zero cross-dependencies
- **Deterministic Handlers**: On-demand operations with FSM state management
- **Server Components**: Optimal SSR for SEO and performance
- **Type Safety**: Comprehensive TypeScript with Zod validation

#### Architecture Patterns
- **Factory Patterns**: Centralized setter creation and configuration
- **Token Optimization**: 27.9% codebase reduction while preserving functionality
- **Simplified FSM**: Clean state management (APP_INITIALIZING, IDLE, LOADING)
- **Direct Context Consumption**: Standard React patterns throughout

### Development Workflow Integration (Updated for NEW WORKFLOW)

#### Standard Development Process:
1. **Task Initiation**: User fills `docs/new_task_details.md` template and runs "/new_task" command
2. **Orchestrator Coordination**: @tech-lead-orchestrator reads template and delegates to specialists
3. **Feature Development**: Start with @react-nextjs-expert or @react-component-architect
4. **AI Integration**: Use @api-architect for Genkit flows and prompt engineering
5. **Quality Review**: Always route through @code-reviewer before production
6. **Performance Check**: Use @performance-optimizer for optimization opportunities
7. **Documentation**: Update with @documentation-specialist for complex features
8. **Task Closure**: Complete all template requirements and use "/close_task" command

#### New Workflow Benefits:
- **Template-Driven Consistency**: Every task follows the standardized `docs/new_task_details.md` format
- **Automatic Orchestrator Activation**: "/new_task" command ensures proper coordination from start
- **Specialist Assignment Clarity**: Template mapping ensures right specialist for each task type
- **Quality Gate Enforcement**: Built-in checkpoints prevent incomplete deliveries
- **Documentation Compliance**: Mandatory documentation updates are clearly specified

### Team Coordination Commands

- **"Assemble full team for [feature]"** → @tech-lead-orchestrator coordinates specialists (COORDINATION ONLY)
- **"Review entire codebase"** → @project-analyst provides comprehensive analysis
- **"Plan next sprint"** → @tech-lead-orchestrator with relevant specialists (DELEGATION REQUIRED)

### Critical Delegation Requirements (NEW WORKFLOW INTEGRATION)

**IMPORTANT**: The @tech-lead-orchestrator must follow the delegation patterns established in the "Tech Lead Orchestrator Operating Rules" section above. Key requirements for the NEW "/new_task" workflow:

1. **NO Direct Implementation**: @tech-lead-orchestrator MUST NOT write, edit, or modify any code files
2. **Mandatory Delegation**: All hands-on work must be assigned to appropriate specialists
3. **Task Template Compliance**: All workflows must reference `docs/new_task_details.md` template structure
4. **"/new_task" Command Integration**: Orchestrator must be activated via "/new_task" command to read user-filled template
5. **Template-Driven Coordination**: Use template sections to provide structured context to specialists
6. **Quality Gate Enforcement**: Ensure code review processes are followed before delivery
7. **Documentation Coordination**: Verify all required documentation updates are completed
8. **Task Closure Integration**: Ensure "/close_task" workflow is followed for proper task finalization

#### NEW WORKFLOW Summary:
User fills `docs/new_task_details.md` → User runs "/new_task" → @tech-lead-orchestrator reads template → Delegates to specialists → Quality gates → Task completion → "/close_task" finalization

Your specialized AI development team is now configured and ready to handle the unique challenges of building a sophisticated financial analysis application with Next.js and AI integration!