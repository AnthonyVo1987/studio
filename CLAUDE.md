# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Operating Mode Guidelines

**Agents**: Call and Use whatever Agents needed for the requested task(s), allowing ALL tool and MCP Tool use for ALL Agents:

### CLAUDE.md Character Threshold Monitoring

**CRITICAL**: Monitor CLAUDE.md file size to maintain optimal performance and prevent context pollution.

#### Character Count Thresholds:
- **Optimal Range**: Under 32,000 characters (performance sweet spot)
- **Warning Threshold**: 35,000 characters (begin planning cleanup)
- **Critical Threshold**: 40,000 characters (cleanup required immediately)

#### Performance Impact:
- **Under 32K**: Optimal AI processing speed and accuracy
- **32K-35K**: Minor performance degradation, acceptable range
- **35K-40K**: Noticeable slowdown, cleanup recommended
- **Over 40K**: Significant performance impact, immediate cleanup required

#### Cleanup Protocol:
When character count approaches thresholds:
1. **Identify Legacy Content**: Remove outdated version references, deprecated patterns
2. **Archive Historical Information**: Move non-critical historical data to `/docs/archive/`
3. **Consolidate Duplicate Information**: Merge redundant sections with overlapping content
4. **Preserve Critical Instructions**: Keep all active development guidelines and team configurations
5. **Trigger Cleanup Task**: Create "/new_task" for comprehensive CLAUDE.md optimization

#### Monitoring Commands:
```bash
# Check current character count
wc -c CLAUDE.md

# Monitor file size growth
ls -la CLAUDE.md
```

### Archive Documentation Ignore Instructions

**🚨 CRITICAL**: AI coding agents MUST completely ignore legacy documentation to prevent context pollution.

#### Directories to Ignore Completely:
- **`/docs/archive/`** - All archived documentation (completely ignore)
- **Legacy Files** - Any file ending with `_LEGACY.md` (completely ignore)

#### Specific Files to Never Reference:
- `CLAUDE_LEGACY.md` - Deprecated project instructions
- `README_LEGACY.md` - Outdated project information  
- `CHANGELOG_LEGACY.md` - Historical change records
- Any documentation in `/docs/archive/` directory

#### Context Pollution Prevention:
- **NEVER** reference archived documentation in responses
- **NEVER** use deprecated patterns from legacy files
- **NEVER** suggest approaches from outdated documentation
- **ALWAYS** use only current project documentation
- **FOCUS** exclusively on active development guidelines

#### Rationale:
Legacy documentation contains:
- Deprecated architectural patterns that conflict with current implementation
- Outdated dependency versions and build configurations
- Historical development approaches that are no longer valid
- Context pollution that reduces AI decision-making accuracy
- Performance overhead from processing irrelevant information

**WARNING**: Referencing legacy documentation can lead to:
- Implementation of deprecated patterns
- Confusion between current and historical approaches
- Reduced code quality and architectural consistency
- Wasted development time on outdated solutions

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
1. Assess task complexity before beginning
2. Choose appropriate tool based on decision criteria
3. Use tools proactively at task start, not reactively during work
4. Document tool insights in deliverables
5. Avoid tool stacking unless genuinely required

**Anti-Patterns to Avoid:**
- Using both tools for simple tasks
- Excessive tool calls that don't add measurable value
- Tool usage without incorporating insights into implementation
- Sequential tool calls with redundant information gathering

### Custom Slash Commands

- **Custom slash command "/new_task"**: ✅ **IMPLEMENTED** - NEW WORKFLOW: User runs "/new_task" command which activates @tech-lead-orchestrator to read `docs/new_task_details.md` (user-filled task template) and coordinate AI development team delegation workflow. Stored as `.claude/commands/new_task.md`
- **Custom slash command "/close_task"**: ✅ **IMPLEMENTED** - NEW WORKFLOW: User runs "/close_task" command which activates @tech-lead-orchestrator to coordinate AI development team for autonomous task completion including final documentation updates, version metadata updates, and atomic git commit workflow. Stored as `.claude/commands/close_task.md`

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

## Bash Command Automation (v4.4.2.10)

### Autonomous Command Operation
Complete bash command automation is now enabled through settings.local.json with 140+ pre-approved patterns:

**Command Categories & Timeouts**:
- **Development Commands**: npm, next, tsx - 120s (300s for production builds)
- **Version Control**: git operations - 120s
- **Process Management**: ps, kill, lsof, pgrep - 30-120s optimized
- **File Operations**: ls, cat, find, grep, mkdir - 120s
- **Environment**: export, env, printenv - 120s
- **TypeScript**: tsc - 120s
- **AI/Genkit**: genkit flows - 120-180s

**Usage Protocol**:
- All standard development workflows are fully autonomous
- No manual approvals needed for common operations
- Universal fallback ensures comprehensive coverage
- Proper timeout usage prevents approval requests

**Performance Optimization**:
- **Critical Operations**: 30s timeout for immediate actions
- **Standard Commands**: 120s timeout for reliable execution
- **Build Operations**: 300s timeout for complex compilation processes
- **AI/Genkit Operations**: 120-180s timeout for AI workflow processing

## Macro Automation Debugging

**CRITICAL**: For comprehensive macro automation debugging guidance, refer to:
- **`/docs/macro-re-architecture/macro-automation-debugging-guide.md`** - Essential debugging reference with 20+ iteration lessons learned (Updated v4.4.3.5)
- Contains complete root cause analysis, failed approaches, corrective actions, and prevention strategies
- **MANDATORY READING** for any macro automation issues or enhancements
- Includes emergency response patterns, production-ready solutions, and future prevention strategies
- **NEW v4.4.3.5**: Now includes AI timeout handling and network resilience debugging patterns

### Emergency Macro Debug Pattern
If facing macro automation failures:
1. **Check Console**: Look for "Prerequisites not met" + UI showing populated data
2. **Apply React useRef Pattern**: Use refs for async state access instead of direct state
3. **Verify Fresh State Access**: Ensure async handlers see current state values
4. **NEW v4.4.3.5**: **Check AI Timeout Errors**: Look for "{}" empty error objects indicating network timeouts
5. **NEW v4.4.3.5**: **Apply Timeout Protection**: Wrap AI operations with 45-second timeout + retry logic
6. **Reference Complete Guide**: Use `/docs/macro-re-architecture/macro-automation-debugging-guide.md` for systematic resolution

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

#### Phase 4: Autonomous Integration & Delivery (Orchestrator)
1. **Coordinate Delivery**: Ensure all specialists complete their assigned work
2. **Code Review Quality Gate**: Monitor `@code-reviewer` completion status
3. **🚨 AUTONOMOUS COMPLETION TRIGGER**: When code review status = "PASSED"
4. **Auto-Execute Documentation**: Immediately delegate final updates to `@documentation-specialist`
5. **Auto-Execute Version Update**: Coordinate `src/config/app-metadata.json` version increment
6. **Auto-Execute Git Workflow**: Complete atomic commit and push operation
7. **Task Closure Confirmation**: Provide final completion status to user

**⚠️ CRITICAL AUTONOMOUS OPERATION RULES:**
- **Zero Manual Intervention**: NO user requests needed after code review passes
- **Immediate Execution**: Autonomous sequence triggers immediately upon review PASS
- **Complete Workflow**: All steps from documentation to git commit executed automatically
- **Role Boundary Compliance**: Failure to execute autonomous completion = role violation

### Success Metrics for Orchestration

#### Effective Orchestration Indicators:
- **Clear Task Delegation**: All implementation work is assigned to appropriate specialists
- **Enhanced Tool Usage**: Specialists apply appropriate tools based on task complexity guidelines
- **Minimal Role Boundary Violations**: Orchestrator stays within coordination responsibilities
- **Efficient Specialist Utilization**: Right specialist assigned to right task consistently
- **Quality Gate Compliance**: All code reviews and testing requirements are met
- **Documentation Completeness**: All required documentation updates are coordinated
- **🚨 AUTONOMOUS COMPLETION**: Complete workflow from code review PASS to final commit without user intervention

#### Warning Signs of Poor Orchestration:
- **Orchestrator Implementing Code**: Direct hands-on work instead of delegation
- **Specialist Confusion**: Unclear task assignments or missing context
- **Quality Gate Bypasses**: Code delivered without proper review processes
- **Documentation Gaps**: Missing or incomplete documentation updates
- **Task Bottlenecks**: Orchestrator becomes a bottleneck instead of enabler
- **🚨 MANUAL INTERVENTION REQUESTS**: Asking user to manually request documentation/git commits after code review PASS (ROLE VIOLATION)

This orchestration model ensures clear role separation, effective delegation, and consistent quality delivery while preventing role boundary violations that can lead to inefficient workflow and quality issues.

## 🚨 PROTECTED BASELINE ARCHITECTURE (v4.4.2.3)

### CRITICAL PROTECTION RULE
**These files represent the stable, battle-tested architecture and MUST NOT be modified without explicit user request:**

#### Core Protected Files
- `src/contexts/nvda-analysis-context.tsx` (79 state fields, proven patterns)
- `src/contexts/spy-analysis-context.tsx` (79 state fields, proven patterns)
- `src/components/nvda-tab-content.tsx` (main orchestrator, deterministic handlers)
- `src/components/spy-tab-content.tsx` (main orchestrator, deterministic handlers)
- `src/app/page.tsx` (direct context provider setup)
- `src/components/page-content.tsx` (simple two-tab implementation)
- `src/ai/definitions/app-data-chatbot.json` (RECENTLY RESTORED - enables AI chat functionality)

#### Protection Rationale
- **Stability**: These components ensure 100% application functionality
- **Battle-Tested**: Proven React patterns with complete context isolation
- **Zero Dependencies**: No cross-dependencies between NVDA and SPY
- **Performance**: Optimized patterns with 27.9% token reduction achievement

#### Development Guidelines
- **Extend, Don't Replace**: Add new display components instead of modifying core files
- **Context Isolation**: Maintain zero cross-dependencies between NVDA/SPY contexts
- **Deterministic Handlers**: Follow existing async/await patterns in tab content

## Overview
StockSage is a Next.js financial analysis application that provides real-time stock data, options chain analysis, and AI-powered insights using Google's Gemini AI models. As of v4.4.3.5, it features a proven dedicated two-tab architecture with NVDA and SPY analysis pages, complete context isolation, and battle-tested React patterns. The application includes a robust macro automation system with comprehensive debugging capabilities, enhanced console logging, and comprehensive AI timeout handling with network resilience improvements. The blueprint system exists as preserved scaffolding in `src/lib/ticker-framework/` for future development phases but is not currently integrated into the application.

## Common Development Commands

### Build & Development
```bash
npm run dev          # Development server (http://localhost:9002) - USER RESERVED PORT
npm run build        # Production build
npm run start        # Production server
npm run typecheck    # TypeScript type checking
npm run genkit:dev   # Genkit AI flows dev server (http://localhost:3400)
npm run genkit:watch # Genkit AI flows dev server with watch mode
```

### Port Usage Guidelines
**USER RESERVED PORTS - DO NOT USE FOR TESTING:**
- **Port 9002**: Reserved exclusively for user development testing
- **Port 3400**: Reserved for user Genkit testing

**CLAUDE CODE TESTING PORTS - USE THESE FOR INTERNAL TESTING:**
```bash
# For internal testing only - DO NOT use user ports 9002 or 3400
next dev --turbopack -p 9003    # Claude Code dev server testing
next dev --turbopack -p 9004    # Alternative testing port
genkit start -p 3401            # Claude Code Genkit testing
```

### Critical Pre-Commit Commands
**IMPORTANT**: ESLint is NOT properly configured in this project. Do NOT run `npm run lint` as it will fail.

Always run these before committing:
```bash
npm run typecheck    # TypeScript type checking (primary code quality check)
npm run build        # Verify production build works
```

**Note**: The project has ESLint dependencies installed but the configuration has compatibility issues. Use TypeScript compiler for code quality validation instead.

## High-Level Architecture (v4.4.3.5 - Current State)

### Core Technology Stack
- **Frontend**: Next.js 15.3.3 with React 18.3.1
- **AI Backend**: Google Genkit + Google AI SDK
- **State Management**: Standard React Context + FSM (Simplified)
- **UI Components**: ShadCN UI + Tailwind CSS
- **Data Sources**: Polygon.io API
- **AI Model**: Google Gemini 2.5-flash-lite

### Current Implementation Architecture (v4.4.3.5)

#### ✅ ACTIVE IMPLEMENTATION
- **Two-Tab System**: Hardcoded NVDA/SPY tabs in `src/components/page-content.tsx`
- **Dedicated Contexts**:
  - `src/contexts/nvda-analysis-context.tsx` (79 state fields)
  - `src/contexts/spy-analysis-context.tsx` (79 state fields)
- **Component Architecture**:
  - `src/components/nvda-tab-content.tsx` (main orchestrator)
  - `src/components/spy-tab-content.tsx` (main orchestrator)
  - Individual display components: `nvda-*-display.tsx`, `spy-*-display.tsx`
- **Context Providers**: Direct setup in `src/app/page.tsx`
- **AI Chat System**: Fully operational with restored `app-data-chatbot.json` (v4.4.2.3)
- **NEW v4.4.3.5**: **Enhanced AI Timeout Handling**: Robust 45-second timeout protection with exponential backoff retry logic
- **NEW v4.4.3.5**: **Network Resilience**: Comprehensive error handling for network interruptions and long-dated options processing

#### 🚧 PRESERVED SCAFFOLDING (UNUSED)
- **Blueprint Framework**: Complete but unused in `src/lib/ticker-framework/`
- **Dynamic Tab System**: `src/components/tabs/dynamic-tab-system.tsx` (not integrated)
- **Ticker Registry**: `src/lib/ticker-registry.ts` (not integrated)
- **Configuration System**: `src/config/ticker-configs.ts` (not integrated)

## AI Integration Architecture (v4.4.3.5)

### Google Genkit + Gemini Integration
- **AI Runtime**: Google Genkit 1.8.0 with Gemini 2.5-flash-lite model
- **Prompt System**: Specialized JSON-based prompt definitions in `src/ai/definitions/`
  - `app-data-chatbot.json` - **RESTORED v4.4.2.3** - Core AI personality and analysis capabilities
  - `stock-trader-takeaways.json` - Stock analysis prompts
  - `options-trader-takeaways.json` - Options strategy prompts
  - `holistic-takeaways.json` - Comprehensive analysis prompts
- **Server Actions**: Ticker-specific consolidated chat actions
  - `src/actions/nvda-consolidated-chat-action.ts` - **ENHANCED v4.4.3.5** with timeout protection
  - `src/actions/spy-consolidated-chat-action.ts` - **ENHANCED v4.4.3.5** with timeout protection
- **Schema Validation**: Zod schemas in `src/ai/schemas/`
- **Temperature Setting**: 0.2 for focused, deterministic responses
- **Chat Status**: ✅ Fully operational AI chat with professional financial analyst persona
- **NEW v4.4.3.5**: **Timeout Protection**: All AI operations protected with 45-second timeouts
- **NEW v4.4.3.5**: **Retry Logic**: Exponential backoff retry for network failures
- **NEW v4.4.3.5**: **Enhanced Error Messages**: User-friendly error reporting replacing cryptic "{}" failures

### Dedicated Two-Tab Architecture (v4.4.3.5)
**The application features a proven dedicated two-tab architecture using standard React best practices:**

#### Tab Architecture Overview
1. **NVDA Dedicated Tab** - Complete NVDA-specific analysis with advanced AI chat system and robust timeout handling
2. **SPY Dedicated Tab** - Production-ready SPY analysis serving as blueprint reference with network resilience

#### NVDA Context Layer
- **Location**: `src/contexts/nvda-analysis-context.tsx`
- **Purpose**: Dedicated state management for NVDA analysis only
- **Pattern**: Context + Reducer with custom hooks (`useNvdaAnalysis()`, `useNvdaDispatch()`)
- **Isolation**: Zero cross-dependencies with SPY context
- **FSM States**: Simplified enum (APP_INITIALIZING, IDLE, LOADING)

#### SPY Context Layer (Blueprint Reference)
- **Location**: `src/contexts/spy-analysis-context.tsx`
- **Purpose**: Dedicated state management for SPY analysis only
- **Pattern**: Context + Reducer with custom hooks (`useSpyAnalysis()`, `useSpyDispatch()`)
- **Isolation**: Zero cross-dependencies with NVDA context
- **Blueprint Quality**: Production-ready architecture serving as reference implementation

## Development Workflow (v4.4.3.5)

### Current Development Pattern
1. **Direct Component Development**: Modify existing `nvda-*` or `spy-*` components
2. **Context Usage**: Use `useNvdaAnalysis()` / `useSpyAnalysis()` hooks directly
3. **Server Actions**: Extend existing consolidated chat actions with timeout protection
4. **AI Prompts**: Modify JSON prompt definitions in `src/ai/definitions/`
5. **NEW v4.4.3.5**: **AI Operation Implementation**: Always include timeout and retry logic for AI calls

### Adding New Features
```typescript
// 1. Update context interface (79 fields available)
interface NvdaAnalysisState {
  newFeatureJson: string;
  newFeatureLoading: boolean;
}

// 2. Add reducer action
type NvdaAnalysisAction = 
  | { type: 'SET_NEW_FEATURE_DATA'; payload: { newFeatureJson: string } }

// 3. Create display component
const NvdaNewFeatureDisplay = () => {
  const nvda = useNvdaAnalysis();
  // Component implementation
};

// 4. Add to nvda-tab-content.tsx orchestrator

// NEW v4.4.3.5: 5. Add timeout protection for AI operations
const performAIAnalysisWithTimeout = async (operation, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 45 seconds')), 45000);
      });
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
      if (error.message.includes('timeout') && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw error;
    }
  }
};
```

### Quality Gates (MANDATORY)
```bash
npm run typecheck    # TypeScript validation (primary quality check)
npm run build        # Build verification
```

**Note**: Do NOT run `npm run lint` as ESLint is not properly configured.

## Future Development - Blueprint System

**IMPORTANT**: The blueprint system exists as unused scaffolding for future development phases. It is NOT currently integrated into the application.

### Blueprint System Summary
The preserved scaffolding provides a configuration-driven architecture that would enable:
- **95% Code Reduction**: New tickers require only configuration changes
- **Automatic Context Generation**: Creates ticker-specific React contexts from configuration
- **Template-Based Components**: Base components that adapt to any ticker configuration
- **Dynamic Tab System**: Build-time discovery and registration of enabled tickers
- **Configuration Management**: Single source of truth for all ticker settings in `src/config/ticker-configs.ts`

### Key Blueprint Components (Preserved, Unused)
- **Context Factory** (`src/lib/ticker-framework/core/context-factory.ts`) - Automatic context generation
- **Component Templates** (`src/lib/ticker-framework/core/base-components/`) - Template-based generation
- **Registry System** (`src/lib/ticker-registry.ts`) - Auto-discovery and lazy loading
- **Dynamic Tab System** (`src/components/tabs/dynamic-tab-system.tsx`) - Tab orchestration

## File Organization

### Active Architecture Files (Critical)
- `src/contexts/nvda-analysis-context.tsx` - NVDA state management (79 fields)
- `src/contexts/spy-analysis-context.tsx` - SPY state management (79 fields)
- `src/components/nvda-tab-content.tsx` - NVDA main orchestrator
- `src/components/spy-tab-content.tsx` - SPY main orchestrator
- `src/components/page-content.tsx` - Simple two-tab UI implementation
- `src/app/page.tsx` - Direct context providers setup

### AI System Files (Critical)
- `src/actions/nvda-consolidated-chat-action.ts` - NVDA AI chat server action (ENHANCED v4.4.3.5)
- `src/actions/spy-consolidated-chat-action.ts` - SPY AI chat server action (ENHANCED v4.4.3.5)
- `src/ai/definitions/app-data-chatbot.json` - **RESTORED v4.4.2.3** - Core AI chat functionality
- `src/ai/definitions/*.json` - Specialized trading prompt templates
- `src/ai/schemas/*-schemas.ts` - Zod validation schemas

### Macro Automation System (v4.4.3.5 - Production Ready with AI Resilience)
- `src/components/macro-orchestrator/simple-analyze-all-button.tsx` - Enhanced macro automation
  - Sequential 4-step execution: Fetch Expirations → Get Stock Data → AI Takeaways → AI Options
  - **Enhanced Debugging**: Comprehensive console logging with ticker-agnostic patterns
  - **State Validation**: Auto-recovery mechanisms and expiration date consistency checks
  - **Performance Optimized**: <1ms overhead with comprehensive troubleshooting capabilities
  - **NEW v4.4.3.5**: **AI Timeout Protection**: All AI steps protected with 45-second timeouts + retry logic
  - **NEW v4.4.3.5**: **Network Resilience**: Comprehensive error handling for network interruptions

### Shared Infrastructure Files
- `src/services/data-sources/adapters/polygon-adapter.ts` - API integration
- `src/types/` - Type definitions directory
- `src/lib/ticker-logger.ts` - Ticker-agnostic logging system

## Critical Architectural Rules

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
```

### 2. On-Demand Handler Pattern
```typescript
// CORRECT - Deterministic handler pattern in nvda-tab-content.tsx
const NvdaTabContent = () => {
  const nvda = useNvdaAnalysis();
  
  const handleOnDemandDataFetch = async () => {
    nvda.dispatchGlobalFsmEvent({ type: 'SET_LOADING' });
    
    try {
      const result = await fetchStockDataAction({ticker: 'NVDA'});
      if (result.status === 'success' && result.data) {
        nvda.setStockSnapshotJson(result.data.stockSnapshotJson);
      }
    } finally {
      nvda.dispatchGlobalFsmEvent({ type: 'SET_IDLE' });
    }
  };
};
```

### 3. React Best Practices
- **Standard useContext + useReducer patterns**
- **Minimal useEffect dependency arrays**
- **Always batch multiple state updates** with `startTransition`
- **Direct business context consumption** in UI components

### 4. NEW v4.4.3.5: AI Operation Best Practices
- **Mandatory Timeout Protection**: All AI operations must have 45-second timeout wrappers
- **Exponential Backoff Retry**: Network failures require 2-3 retry attempts with backoff
- **Enhanced Error Messages**: Replace cryptic errors with user-friendly, actionable messages
- **Network Resilience**: Handle ENOTFOUND, ECONNRESET, and timeout errors gracefully

## Development Guidelines

### Code Quality Standards
- **TypeScript**: Strict mode enabled, use `import type` for type imports
- **Error Handling**: Wrap all async operations in try/catch blocks
- **Logging**: Use standard `console.*` methods for both client-side and server-side
- **Validation**: Use Zod schemas for all data validation
- **NEW v4.4.3.5**: **AI Operations**: Always include timeout and retry logic for AI calls

### UI/UX Conventions
- **Components**: ShadCN UI components with Tailwind styling
- **Icons**: Lucide React icons
- **Loading States**: Derive from FSM state and business flags
- **Responsiveness**: Mobile-first approach with proper breakpoints

### Data Export Features
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

### 4. NEW v4.4.3.5: AI Timeout Issues
**Cause**: Network interruptions causing indefinite hangs or cryptic error messages
**Solution**: Implement timeout protection with Promise.race and exponential backoff retry logic

## Version Management
- **Version Source**: `src/config/app-metadata.json` (single source of truth)
- **Current Version**: v4.4.3.5 (AI timeout handling & network resilience improvements: Resolved cryptic "{}" errors, implemented 45-second timeout protection with exponential backoff retry logic, enhanced error reporting for improved user experience, successful processing of long-dated options)
- **Update Policy**: Always update `appVersion` and `lastUpdatedTimestamp` for any code changes
- **Versioning Scheme**: `v4.w.x.y.z` format

## Code Review Process

### Comprehensive Code Review Methodology
Use this process for any significant code changes or new implementations:

#### Phase 1: Targeted Implementation Review
- **USE SEQUENTIAL THINKING TOOL** for systematic analysis
- **USE CONTEXT7 TOOL** to ensure up-to-date robust practices for the app's stack
- Focus on specific implementation of code changes for current tasks
- Verify proper logic and input/output wiring for data and UI/Render updates

#### Phase 2: Generic Codebase Audit
After targeted review, check for these items:
- Verify all logic is enforced to be DETERMINISTIC
- Verify there are no "complex/convoluted" useEffect/dependency array/UI/Render that can affect main business logic
- Verify there are no unused code, functions, imports etc that have been removed and/or deprecated
- Verify there are no other "React anti-pattern" issues
- Verify no other orchestrator vs reducer issues
- Verify no potential infinite loops during UI/Render vs a dependency
- Verify no console logs can cause infinite loops during UI/Render
- Verify proper JSON parsing, comparing to current working Main page JSON parsing
- **NEW v4.4.3.5**: Verify all AI operations have timeout protection and retry logic

#### Phase 3: Post-Review Actions
- **If code review FAILED**: Fix issues, summarize fixes, wait for next task, do NOT commit
- **If code review PASSED**: Perform all actions in order:
  1. Update README.md, CHANGELOG.md
  2. Perform Claude command "/init" to update CLAUDE.md project doc
  3. Git commit and push as completely single shot atomic operation with ALL code changes, doc changes, CLAUDE.md changes, settings json etc

## Testing & Quality Assurance
- Always run `npm run typecheck` before committing (ESLint not properly configured)
- Simplified architecture uses standard React patterns
- Direct business context consumption with safe JSON parsing patterns
- Follow the comprehensive code review process above for all significant changes
- **NEW v4.4.3.5**: Test AI operations with timeout simulation for network resilience

## Environment & Configuration

### Required Environment Variables
Create `.env` in project root:
```env
POLYGON_API_KEY=your_polygon_api_key
GEMINI_API_KEY=your_google_ai_api_key
```

### Build Configuration
- **TypeScript errors are ignored during builds** (see `next.config.ts`)
- **ESLint Configuration**: Not properly configured, do not use `npm run lint`
- **Strict TypeScript** is enabled in development but bypassed for builds

## Performance & Optimization

### Recent Achievements (v4.0.0.7+ through v4.4.3.5)
- **Architecture Simplification**: Removed complex UI state layer, now uses standard React patterns
- **On-Demand AI**: Simplified pipeline with manual AI analysis (no automated steps)
- **FSM Simplification**: Reduced states (APP_INITIALIZING, IDLE, LOADING), removed automated pipeline complexity
- **Code Cleanup**: Removed "one step behind" UI update mechanism
- **Direct Context Consumption**: All display components now use business context directly
- **Token Optimization**: Achieved 27.9% reduction in codebase tokens (~29K tokens saved) while preserving functionality
- **NEW v4.4.3.5**: **AI Resilience**: Eliminated indefinite hangs during network issues with timeout protection
- **NEW v4.4.3.5**: **User Experience**: Enhanced error messages replace cryptic failures
- **NEW v4.4.3.5**: **Network Recovery**: >90% success rate for AI operations after retry logic

### Current Metrics
- **Architecture Simplicity**: Standard React best practices, no complex UI state layer
- **Pipeline Efficiency**: Basic analysis (data + AI TA) with on-demand AI features
- **Code Maintainability**: Straightforward context consumption across all components
- **AI Operation Reliability**: 100% timeout protection with exponential backoff retry

## Important Notes for AI Assistants (v4.4.3.5 - Current State)

### Current Architecture Status (CRITICAL UNDERSTANDING)
1. **Dedicated NVDA/SPY Architecture**: Application currently uses proven dedicated two-tab architecture
2. **Blueprint System Status**: Preserved as unused scaffolding - NOT integrated into active application
3. **Protected Baseline Files**: NVDA/SPY contexts and components are protected and stable
4. **AI Chat Status**: ✅ **FULLY RESTORED** - Complete AI chat functionality operational (v4.4.2.3)
5. **Development Focus**: All current development should use existing dedicated architecture patterns
6. **Future Integration**: Blueprint system available for future enhancement phases when stability allows
7. **NEW v4.4.3.5**: **AI Resilience Status**: ✅ **FULLY IMPLEMENTED** - Comprehensive timeout handling and network resilience

### Current Development Patterns (v4.4.3.5)
8. **Use Existing Hooks**: `useNvdaAnalysis()`, `useSpyAnalysis()` for current implementation
9. **Component Patterns**: Follow existing `nvda-*.tsx` and `spy-*.tsx` naming conventions
10. **Context Isolation**: Maintain complete independence between NVDA and SPY contexts
11. **Deterministic Handlers**: Use proven async/await patterns in tab content components
12. **AI Chat Integration**: Leverage restored `app-data-chatbot.json` for professional financial analysis
13. **NEW v4.4.3.5**: **AI Operation Integration**: Always include timeout protection and retry logic for AI operations

### Quality Assurance (UPDATED FOR CURRENT STATE)
14. **Baseline Protection**: Dedicated NVDA/SPY components are protected from modification
15. **Stability First**: Current architecture prioritized over experimental features
16. **Context Isolation Verified**: Each ticker maintains independent state without cross-dependencies
17. **Proven Patterns**: Battle-tested React Context + useReducer patterns throughout
18. **AI Chat Validation**: Restored AI functionality provides professional financial analysis capabilities
19. **NEW v4.4.3.5**: **AI Resilience Validation**: All AI operations have timeout and retry protection

### AI Assistant Guidelines (CURRENT STATE)
20. **Current Architecture First**: Always use existing dedicated NVDA/SPY patterns
21. **Blueprint Awareness**: Understand blueprint system exists but is unused scaffolding
22. **Baseline Protection**: Never modify protected baseline files without explicit user request
23. **AI Chat Utilization**: Leverage restored AI chat capabilities for enhanced user experience
24. **Future Readiness**: Be prepared to integrate blueprint system when stability allows
25. **NEW v4.4.3.5**: **AI Resilience First**: All new AI operations must include timeout and retry logic

---

## AI Team Configuration (autogenerated by team-configurator, 2025-07-31)

**Important: YOU MUST USE subagents when available for the task.**

### Detected Technology Stack
- **Frontend Framework**: Next.js 15.3.3 with React 18.3.1 (App Router architecture)
- **AI Backend**: Google Genkit 1.8.0 + Google AI SDK with Gemini 2.5-flash-lite model
- **UI Framework**: ShadCN UI components with Tailwind CSS and Radix UI primitives
- **State Management**: React Context with useReducer patterns (79-field context isolation)
- **Data Sources**: Polygon.io API for real-time financial market data
- **Type Safety**: TypeScript with Zod validation schemas and strict mode
- **Build Tools**: Next.js with Turbopack, TypeScript 5.x
- **Testing**: Manual testing with built-in Debug tabs and JSON export capabilities
- **Architecture**: Server Actions, Server Components, isolated context patterns
- **Macro Automation**: Production-ready with comprehensive debugging (v4.4.2.8)
- **AI Chat System**: Fully operational with professional financial analyst capabilities
- **NEW v4.4.3.5**: **AI Resilience**: Comprehensive timeout handling and network resilience

### Specialist Team Assignments

| Task | Agent | Notes |
|------|-------|-------|
| **Frontend Architecture & Development** |
| Next.js App Router implementation | @react-nextjs-expert | Server Components, Server Actions, SSR optimization |
| React component development | @component-architect | Financial UI components, charts, tables, dashboards |
| ShadCN UI customization | @ui-ux-designer | Theme customization, responsive design, mobile-first |
| Context & state management | @react-architect | useContext + useReducer patterns, FSM integration |
| **Backend & AI Development** |
| Google Genkit AI flows | @ai-architect | Flow design, prompt engineering, model optimization, timeout handling |
| Polygon.io API integration | @api-integration-specialist | Real-time data fetching, error handling, retry logic |
| Server Actions development | @backend-architect | TypeScript server actions, validation, error handling |
| AI prompt system design | @prompt-engineer | Trading prompts, financial analysis, context-aware AI |
| **Data & Performance** |
| Real-time data optimization | @performance-optimizer | Memory management, rendering optimization, bundle analysis |
| Financial data processing | @data-engineer | Market data validation, JSON parsing, export utilities |
| TypeScript & Zod schemas | @type-safety-specialist | Schema validation, type definitions, build optimization |
| **Quality & Security** |
| Code review & architecture | @code-reviewer | React anti-patterns, context isolation, security audits, AI resilience |
| Financial security audits | @security-specialist | Trading data protection, API security, input validation |
| Performance monitoring | @performance-analyst | Bundle size, loading times, real-time data efficiency |
| **Specialized Financial Features** |
| Options chain visualization | @fintech-ui-specialist | Complex financial tables, options data display |
| Macro automation system | @automation-architect | 4-step sequential execution, debugging, state validation, AI resilience |
| AI chat implementation | @conversational-ai-specialist | Financial analysis chat, prompt optimization, timeout handling |
| Technical analysis displays | @financial-data-visualizer | TA indicators, chart components, market metrics |
| **Project Management** |
| Technical coordination | @tech-lead-orchestrator | **COORDINATION-ONLY** - delegates all implementation work |
| Documentation management | @documentation-specialist | Architecture docs, API guides, feature specifications |
| Codebase analysis | @code-archaeologist | Technical debt analysis, architecture assessment |

### Task Routing Examples

**Frontend Development:**
- "Build NVDA options chain component" → @component-architect + @fintech-ui-specialist
- "Optimize mobile responsiveness" → @ui-ux-designer + @performance-optimizer
- "Add new technical indicators" → @financial-data-visualizer + @react-architect
- "Implement real-time chart updates" → @react-nextjs-expert + @performance-optimizer

**Backend & AI:**
- "Create earnings analysis prompt" → @prompt-engineer + @ai-architect
- "Optimize Polygon API calls" → @api-integration-specialist + @performance-optimizer
- "Design new Genkit flow" → @ai-architect + @backend-architect
- "Add options trading AI analysis" → @conversational-ai-specialist + @prompt-engineer
- "Implement AI timeout handling" → @ai-architect + @backend-architect + @performance-optimizer

**Quality & Performance:**
- "Review chat implementation security" → @security-specialist + @code-reviewer
- "Audit financial data handling" → @security-specialist + @data-engineer
- "Optimize bundle size" → @performance-optimizer + @type-safety-specialist
- "Analyze context isolation" → @code-reviewer + @react-architect
- "Review AI resilience patterns" → @code-reviewer + @ai-architect + @performance-analyst

**Macro Automation & Advanced Features:**
- "Debug macro automation" → @automation-architect + @performance-analyst
- "Enhance sequential execution" → @automation-architect + @backend-architect
- "Add macro logging" → @automation-architect + @documentation-specialist
- "Implement AI timeout protection" → @automation-architect + @ai-architect + @performance-optimizer

Your StockSage financial analysis application is now configured with an optimized AI development team that maximizes specialist effectiveness for your Next.js + AI trading platform with comprehensive AI resilience capabilities!