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
- **TypeScript**: tsc, eslint - 120s
- **AI/Genkit**: genkit flows - 120-180s

**Usage Protocol**:
- All standard development workflows are fully autonomous
- No manual approvals needed for common operations
- Universal fallback ensures comprehensive coverage
- Proper timeout usage prevents approval requests

**Examples**:
- `npm run build` → Automatically uses 300s timeout for production builds
- `git commit` → Uses 120s timeout for reliable operations
- `lsof -i :9002` → Uses 60s timeout for port checking
- `kill -9 PID` → Uses 30s timeout for quick termination

**Universal Coverage Pattern**:
The autonomous system includes a universal fallback pattern `Bash(timeout 120s *)` that covers all scenarios not explicitly defined, ensuring complete automation coverage for all bash commands.

**Performance Optimization**:
- **Critical Operations**: 30s timeout for immediate actions
- **Standard Commands**: 120s timeout for reliable execution
- **Build Operations**: 300s timeout for complex compilation processes
- **AI/Genkit Operations**: 120-180s timeout for AI workflow processing

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

#### Enhanced Autonomous Operation (v4.4.2.10)
The AI development team now operates with full bash command automation:
- 140+ pre-approved command patterns eliminate manual approvals
- Specialists use appropriate timeouts automatically
- Universal coverage ensures smooth task execution
- Zero interruptions for standard development workflows

#### Workflow Integration Benefits:
- **Consistent Task Structure**: Every task follows the same standardized format
- **Reduced Communication Overhead**: Template ensures all required context is captured upfront
- **Quality Assurance**: Built-in quality gates prevent delivery of incomplete work
- **Documentation Compliance**: Mandatory documentation requirements are clearly specified
- **Specialist Efficiency**: Clear task assignments eliminate role confusion and overlap
- **Autonomous Execution**: Full command automation enables uninterrupted specialist workflows

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
StockSage is a Next.js financial analysis application that provides real-time stock data, options chain analysis, and AI-powered insights using Google's Gemini AI models. As of v4.4.2.7, it features a proven dedicated two-tab architecture with NVDA and SPY analysis pages, complete context isolation, and battle-tested React patterns. The application includes a robust macro automation system with comprehensive debugging capabilities and enhanced console logging. The blueprint system exists as preserved scaffolding in `src/lib/ticker-framework/` for future development phases but is not currently integrated into the application.

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

### Debug & Validation Commands (v4.4.2.7)
Commands for working with the current architecture:
```bash
# Standard development workflow
npm run build        # Production build
npm run dev          # Development server with dedicated tab system

# Code quality validation
npm run lint         # ESLint validation (fully configured)
npm run typecheck    # TypeScript type checking

# Architecture verification
node -e "console.log('Current architecture: Dedicated NVDA/SPY tabs')"
node -e "console.log('Blueprint status: Preserved as unused scaffolding')"
node -e "console.log('Macro Automation: Enhanced debugging with comprehensive console logging')"
```

### Macro Automation Debugging
The application includes comprehensive debugging capabilities for the macro automation system:
- **Console Logging Pattern**: `[TICKER:COMPONENT:CONTEXT:ACTION]` format for consistent debugging
- **Expiration Date Tracking**: Complete lifecycle visibility from selection through API response
- **State Validation**: Auto-recovery mechanisms prevent contamination between manual/macro operations
- **Performance Monitoring**: <1ms overhead with detailed execution tracking
- **Cross-Tab Consistency**: Perfect parity between NVDA and SPY implementations

### ESLint Configuration (Fully Operational)
- **Status**: ✅ Fully configured and integrated
- **Configuration**: `eslint.config.mjs` (modern flat config)
- **Integration**: Built into build process and development workflow
- **Customization**: Claude Code can modify ESLint rules as needed
- **Pre-commit**: Always run `npm run lint` before committing

## Recent Critical Fixes (v4.4.2.7)

### Macro Automation Debugging Enhancements
- **Issue**: Expiration date inconsistencies in macro automation causing incorrect options data display
- **Root Cause**: State contamination between manual operations and macro automation workflows
- **Solution**: Comprehensive debugging system with enhanced console logging and state validation
- **Impact**: Reliable macro automation with consistent expiration date handling and troubleshooting capabilities
- **Status**: Macro automation fully operational with <1ms performance overhead and comprehensive debugging support
- **Technical Details**: Enhanced state cleanup, auto-recovery mechanisms, and API response validation ensure consistent behavior

## Development Workflow (v4.4.2.3)

### Current Development Pattern
1. **Direct Component Development**: Modify existing `nvda-*` or `spy-*` components
2. **Context Usage**: Use `useNvdaAnalysis()` / `useSpyAnalysis()` hooks directly
3. **Server Actions**: Extend existing consolidated chat actions
4. **AI Prompts**: Modify JSON prompt definitions in `src/ai/definitions/`

### Adding New Features to Existing Tabs
```typescript
// 1. Update context interface (79 fields available)
interface NvdaAnalysisState {
  // Add new fields here
  newFeatureJson: string;
  newFeatureLoading: boolean;
}

// 2. Add reducer action
type NvdaAnalysisAction = 
  | { type: 'SET_NEW_FEATURE_DATA'; payload: { newFeatureJson: string } }
  | ... // existing actions

// 3. Create display component
const NvdaNewFeatureDisplay = () => {
  const nvda = useNvdaAnalysis();
  // Component implementation
};

// 4. Add to nvda-tab-content.tsx orchestrator
```

### Quality Gates (MANDATORY)
```bash
# Before any commit
npm run lint         # ESLint validation (fully configured)
npm run typecheck    # TypeScript validation
npm run build        # Build verification
```

## High-Level Architecture (v4.4.2.3 - Current State)

### Core Technology Stack
- **Frontend**: Next.js 15.3.3 with React 18.3.1
- **AI Backend**: Google Genkit + Google AI SDK
- **State Management**: Standard React Context + FSM (Simplified)
- **UI Components**: ShadCN UI + Tailwind CSS
- **Data Sources**: Polygon.io API
- **AI Model**: Google Gemini 2.5-flash-lite

### Current Implementation Architecture (v4.4.2.3)

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

#### 🚧 PRESERVED SCAFFOLDING (UNUSED)
- **Blueprint Framework**: Complete but unused in `src/lib/ticker-framework/`
- **Dynamic Tab System**: `src/components/tabs/dynamic-tab-system.tsx` (not integrated)
- **Ticker Registry**: `src/lib/ticker-registry.ts` (not integrated)
- **Configuration System**: `src/config/ticker-configs.ts` (not integrated)

## AI Integration Architecture (v4.4.2.3)

### Google Genkit + Gemini Integration
- **AI Runtime**: Google Genkit 1.8.0 with Gemini 2.5-flash-lite model
- **Prompt System**: Specialized JSON-based prompt definitions in `src/ai/definitions/`
  - `app-data-chatbot.json` - **RESTORED v4.4.2.3** - Core AI personality and analysis capabilities
  - `stock-trader-takeaways.json` - Stock analysis prompts
  - `options-trader-takeaways.json` - Options strategy prompts
  - `holistic-takeaways.json` - Comprehensive analysis prompts
- **Server Actions**: Ticker-specific consolidated chat actions
  - `src/actions/nvda-consolidated-chat-action.ts`
  - `src/actions/spy-consolidated-chat-action.ts`
- **Schema Validation**: Zod schemas in `src/ai/schemas/`
- **Temperature Setting**: 0.2 for focused, deterministic responses
- **Chat Status**: ✅ Fully operational AI chat with professional financial analyst persona

### AI Development Commands
```bash
npm run genkit:dev   # Start Genkit dev server (port 3400)
npm run genkit:watch # Genkit with file watching
```

### Dedicated Two-Tab Architecture (v4.4.2.3)

**The application features a proven dedicated two-tab architecture using standard React best practices:**

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

### NVDA Dedicated Architecture (v4.4.2.3 - Protected Baseline)

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

### SPY Dedicated Architecture (v4.4.2.3 - Protected Baseline)

**Production-ready SPY analysis serving as stable reference implementation:**

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

## Future Development - Blueprint System (v4.4.2.0+ Scaffolding)

**IMPORTANT**: The blueprint system exists as unused scaffolding for future development phases. It is NOT currently integrated into the application.

**Preserved scaffolding for configuration-driven architecture:**

### Core Blueprint Components

#### 1. Context Factory (`src/lib/ticker-framework/core/context-factory.ts`)
- **Automatic Context Generation**: Creates ticker-specific React contexts from configuration
- **Type-Safe Hook Generation**: Generates `use{Ticker}Analysis()` and `use{Ticker}Dispatch()` hooks
- **FSM Integration**: Built-in finite state machine management for each ticker
- **Provider Orchestration**: Automatic provider component creation with context isolation

#### 2. Component Templates (`src/lib/ticker-framework/core/base-components/`)
- **Template-Based Generation**: Base components that adapt to any ticker configuration
- **95% Code Reduction**: New tickers require minimal custom code
- **Consistent UI Patterns**: Standardized layouts and behaviors across all tickers
- **Template Library**:
  - `base-tab-content.tsx` - Main ticker tab orchestrator
  - `base-data-section.tsx` - Financial data display container
  - `base-consolidated-chat.tsx` - AI chat interface
  - `base-options-chain-table.tsx` - Options chain visualization
  - Display templates: Stock snapshot, key metrics, technical analysis, AI insights

#### 3. Configuration System (`src/config/ticker-configs.ts`)
- **Centralized Configuration**: Single source of truth for all ticker settings
- **Dynamic Enable/Disable**: Runtime ticker management with hot-reloading
- **Feature Flags**: Granular control over AI chat, options chain, technical analysis
- **Theming Support**: Custom accent colors and branding per ticker
- **Category Management**: ETF, STOCK, INDEX, CRYPTO categorization

#### 4. Registry System (`src/lib/ticker-registry.ts`)
- **Auto-Discovery**: Automatic ticker registration from configuration
- **Lazy Loading**: Code splitting and dynamic component loading
- **Runtime Management**: Enable/disable tickers without rebuilds
- **Provider Orchestration**: Dynamic provider tree construction
- **Debug Utilities**: Comprehensive debugging and monitoring tools

#### 5. Dynamic Tab System (`src/components/tabs/dynamic-tab-system.tsx`)
- **Build-Time Manifest**: Automatic tab discovery and registration
- **Context Orchestration**: Multi-provider composition for isolated state
- **Tab Management**: Dynamic tab loading with suspense boundaries
- **Fallback Handling**: Graceful degradation for loading/error states

### Adding New Tickers (Trivial Process)

#### Step 1: Configuration Update
```typescript
// src/config/ticker-configs.ts
export const TICKER_CONFIGS: DynamicTickerConfig[] = [
  // ... existing configs
  
  createTickerConfig('AAPL', 'Apple Inc.', {
    order: 4,
    category: 'STOCK',
    description: 'Technology hardware and services company',
    accentColor: '#000000',
    enabled: true, // ✅ Enable the ticker
    chatActionPath: '@/actions/aapl-consolidated-chat-action', // Optional
  }),
];
```

#### Step 2: Chat Action (Optional)
Create `src/actions/aapl-consolidated-chat-action.ts` using existing template:
```typescript
// Copy from nvda-consolidated-chat-action.ts
// Replace ticker references: 'NVDA' → 'AAPL'
// Update context hooks: useNvdaAnalysis → useAaplAnalysis
// Customize prompts if needed (optional)
```

#### Step 3: Build & Deploy
```bash
npm run build  # Automatic discovery and registration
npm run dev    # New AAPL tab appears automatically
```

### Blueprint Benefits

#### 95% Code Reduction
- **Before Blueprint**: ~2,000 lines of code per ticker (context, components, actions)
- **After Blueprint**: ~100 lines of code per ticker (configuration + optional chat action)
- **Template Reuse**: All UI components generated from base templates
- **Consistent Architecture**: Identical patterns across all tickers

#### Trivial Ticker Addition
- **Configuration-Driven**: Update single config object to add new ticker
- **Zero Boilerplate**: No manual context creation or component duplication
- **Instant Integration**: Automatic tab system discovery and registration
- **Type Safety**: Full TypeScript support with automatic type generation

#### Simplified Maintenance
- **Single Source of Truth**: All ticker settings in one configuration file
- **Template Updates**: Fix/feature applied to all tickers simultaneously
- **Consistent Debugging**: Uniform logging and error handling across tickers
- **Runtime Management**: Enable/disable tickers without code changes

### Development Workflow Integration

#### AI Assistant Instructions for Ticker Addition
1. **Update Configuration**: Enable ticker in `src/config/ticker-configs.ts`
2. **Create Chat Action**: Copy existing template and update ticker references
3. **Test Integration**: Verify automatic tab system discovery
4. **Quality Assurance**: Ensure context isolation and proper state management
5. **Documentation**: Update ticker list in project documentation

#### Quality Gates for Blueprint System
- **Context Isolation**: Each ticker maintains completely independent state
- **Template Integrity**: All base components must work with any ticker configuration
- **Type Safety**: Generated hooks and components must be fully type-safe
- **Performance**: No performance degradation with additional ticker tabs
- **Debugging**: Consistent logging patterns across all generated components

### Legacy SPY Blueprint Integration
The previous SPY blueprint system (v4.1.18.0) has been integrated into the new framework:
- **SPY Configuration**: Migrated to new config system with preserved settings
- **Component Migration**: SPY components serve as template validation reference
- **Advanced Chat**: SPY chat patterns incorporated into base template system
- **Feature Parity**: All SPY features available to new tickers through templates

## File Organization (v4.4.2.3 Current State)

### Active Architecture Files (Tier 1 - Critical)
- `src/contexts/nvda-analysis-context.tsx` - NVDA state management (79 fields)
- `src/contexts/spy-analysis-context.tsx` - SPY state management (79 fields) 
- `src/components/nvda-tab-content.tsx` - NVDA main orchestrator
- `src/components/spy-tab-content.tsx` - SPY main orchestrator
- `src/components/page-content.tsx` - Simple two-tab UI implementation
- `src/app/page.tsx` - Direct context providers setup

### AI System Files (Tier 1 - Critical)
- `src/actions/nvda-consolidated-chat-action.ts` - NVDA AI chat server action
- `src/actions/spy-consolidated-chat-action.ts` - SPY AI chat server action
- `src/ai/definitions/app-data-chatbot.json` - **RESTORED v4.4.2.3** - Core AI chat functionality
- `src/ai/definitions/*.json` - Specialized trading prompt templates
- `src/ai/schemas/*-schemas.ts` - Zod validation schemas
- `src/ai/flows/*.ts` - Genkit AI flow definitions

### Preserved Blueprint Scaffolding (Tier 3 - Unused)
- `src/lib/ticker-framework/` - Complete blueprint system (unused)
- `src/components/tabs/dynamic-tab-system.tsx` - Dynamic tabs (unused)
- `src/lib/ticker-registry.ts` - Registry system (unused)
- `src/config/ticker-configs.ts` - Configuration system (unused)

### Macro Automation System (v4.4.2.7 - Production Ready)
- `src/components/macro-orchestrator/simple-analyze-all-button.tsx` - **Enhanced macro automation implementation**
  - Sequential 4-step execution: Fetch Expirations → Get Stock Data → AI Takeaways → AI Options
  - **Enhanced Debugging**: Comprehensive console logging with ticker-agnostic patterns
  - **State Validation**: Auto-recovery mechanisms and expiration date consistency checks
  - **Cross-Tab Consistency**: Perfect NVDA/SPY implementation parity
  - **Performance Optimized**: <1ms overhead with comprehensive troubleshooting capabilities
  - **Error Handling**: Robust validation and API response mismatch detection
  - **Architecture Status**: Production-ready with enhanced debugging and reliability

### Shared Infrastructure Files (Tier 2)
- `src/services/data-sources/adapters/polygon-adapter.ts` - API integration
- `src/types/` - Type definitions directory (e.g., `options.ts`)
- `src/lib/ticker-logger.ts` - Ticker-agnostic logging system for all tabs

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
- **Current Version**: v4.4.2.10 (autonomous bash command automation implementation: 140+ standardized commands, enhanced workflow integration, production-ready autonomous task completion)
- **Update Policy**: Always update `appVersion` and `lastUpdatedTimestamp` for any code changes
- **Versioning Scheme**: `v4.w.x.y.z` format (v4.4.2.7 stable state with macro automation debugging, enhanced logging, and cross-tab consistency)

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

## Code Quality Standards (v4.4.2.3)

### TypeScript Configuration
- **Strict Mode**: Enabled in development
- **Build Bypass**: TypeScript errors ignored during builds (see `next.config.ts`)
- **Type Checking**: Manual via `npm run typecheck`
- **Import Patterns**: Use `import type` for type-only imports

### Code Quality Requirements
- **TypeScript**: Strict mode enabled, use `import type` for type imports
- **Error Handling**: Wrap all async operations in try/catch blocks
- **Logging**: Use standard `console.*` methods for both client-side and server-side
- **Validation**: Use Zod schemas for all data validation

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

## Important Notes for AI Assistants (v4.4.2.0)

### Blueprint System Architecture (NEW v4.4.2.0)
1. **Revolutionary Blueprint System** - Application now features configuration-driven ticker addition with 95% code reduction
2. **Context Factory Pattern** - Use `createTickerContext()` from `src/lib/ticker-framework/core/context-factory.ts` for automatic context generation
3. **Template-Based Components** - All ticker components generated from base templates in `src/lib/ticker-framework/core/base-components/`
4. **Configuration Management** - Update `src/config/ticker-configs.ts` to add/enable/disable tickers
5. **Dynamic Registry System** - `src/lib/ticker-registry.ts` handles automatic ticker discovery and registration

### Ticker Addition Workflow (SIMPLIFIED)
6. **Trivial Ticker Addition**: 
   - Step 1: Enable ticker in `src/config/ticker-configs.ts` 
   - Step 2: Create chat action (optional) by copying existing template
   - Step 3: Build and deploy - automatic tab system discovery
7. **Zero Boilerplate Required** - No manual context creation or component duplication needed
8. **Automatic Type Generation** - TypeScript hooks and components generated automatically from configuration

### Development Patterns (UPDATED)
9. **Use Generated Hooks** - Blueprint system creates `use{Ticker}Analysis()` and `use{Ticker}Dispatch()` hooks automatically
10. **Template-Based Components** - All UI components inherit from base templates with ticker-specific configuration
11. **Maintain Context Isolation** - Each ticker maintains completely independent state through context factory
12. **Configuration-Driven Features** - AI chat, options chain, technical analysis controlled via feature flags in config

### Legacy Integration (TRANSITION PERIOD)
13. **Legacy Components Preserved** - Existing NVDA/SPY components maintained during blueprint transition
14. **Hybrid Architecture** - System supports both legacy direct components and blueprint-generated components
15. **Migration Path** - Legacy components serve as validation reference for blueprint template accuracy

### Quality Assurance (ENHANCED)
16. **Template Integrity** - Ensure all base components work with any ticker configuration
17. **Context Isolation Testing** - Verify each ticker maintains independent state without cross-dependencies
18. **Performance Validation** - No performance degradation with additional ticker tabs
19. **Type Safety Verification** - All generated hooks and components must be fully type-safe

### Build & Development (UPDATED)
20. **Build-Time Discovery** - `npm run build` automatically discovers and registers enabled tickers
21. **Dynamic Tab System** - `src/components/tabs/dynamic-tab-system.tsx` handles tab orchestration
22. **Runtime Management** - Enable/disable tickers without code changes through registry system
23. **Debug Utilities** - Enhanced debugging tools in ticker registry for troubleshooting

### AI Assistant Guidelines (CRITICAL)
24. **Blueprint-First Approach** - Always use blueprint system for new ticker implementations
25. **Configuration Updates** - Update ticker configurations before creating custom implementations
26. **Template Validation** - Ensure any custom modifications maintain template compatibility
27. **Registry Integration** - Verify ticker registry properly discovers and loads new configurations

### Tech Lead Orchestrator Role Boundaries (UNCHANGED)
28. **@tech-lead-orchestrator is COORDINATION-ONLY**: Must never perform hands-on implementation work
29. **Mandatory Delegation**: All code writing, editing, and technical tasks must be delegated to appropriate specialists
30. **Task Template Compliance**: All workflows must reference `docs/new_task_details.md` template structure
31. **Quality Gate Enforcement**: Orchestrator ensures code review processes without performing reviews directly
32. **Role Violation Prevention**: Immediate halt and reassignment if orchestrator attempts hands-on work

## Important Notes for AI Assistants (v4.4.2.3 - Current State)

### Current Architecture Status (CRITICAL UNDERSTANDING)
1. **Dedicated NVDA/SPY Architecture**: Application currently uses proven dedicated two-tab architecture
2. **Blueprint System Status**: Preserved as unused scaffolding - NOT integrated into active application
3. **Protected Baseline Files**: NVDA/SPY contexts and components are protected and stable
4. **AI Chat Status**: ✅ **FULLY RESTORED** - Complete AI chat functionality operational (v4.4.2.3)
5. **Development Focus**: All current development should use existing dedicated architecture patterns
6. **Future Integration**: Blueprint system available for future enhancement phases when stability allows

### Current Development Patterns (v4.4.2.3)
7. **Use Existing Hooks**: `useNvdaAnalysis()`, `useSpyAnalysis()` for current implementation
8. **Component Patterns**: Follow existing `nvda-*.tsx` and `spy-*.tsx` naming conventions
9. **Context Isolation**: Maintain complete independence between NVDA and SPY contexts
10. **Deterministic Handlers**: Use proven async/await patterns in tab content components
11. **AI Chat Integration**: Leverage restored `app-data-chatbot.json` for professional financial analysis

### Blueprint System Future Integration
12. **Scaffolding Preserved**: Blueprint framework exists in `src/lib/ticker-framework/` (unused)
13. **Configuration Available**: `src/config/ticker-configs.ts` contains future ticker configurations
14. **Registry System**: `src/lib/ticker-registry.ts` available for future dynamic loading
15. **Template Components**: Base components preserved in `src/lib/ticker-framework/core/base-components/`

### Quality Assurance (UPDATED FOR CURRENT STATE)
16. **Baseline Protection**: Dedicated NVDA/SPY components are protected from modification
17. **Stability First**: Current architecture prioritized over experimental features
18. **Context Isolation Verified**: Each ticker maintains independent state without cross-dependencies
19. **Proven Patterns**: Battle-tested React Context + useReducer patterns throughout
20. **AI Chat Validation**: Restored AI functionality provides professional financial analysis capabilities

### Build & Development (CURRENT STATE)
21. **Standard Build Process**: `npm run build` uses current dedicated architecture
22. **Tab System**: Standard React tabs with NVDA and SPY dedicated components
23. **Runtime Stability**: No dynamic ticker loading - fixed NVDA/SPY tabs only
24. **Debug Support**: Standard console logging and debugging tools
25. **AI Integration**: Fully operational Google Genkit + Gemini chat system

### AI Assistant Guidelines (CURRENT STATE)
26. **Current Architecture First**: Always use existing dedicated NVDA/SPY patterns
27. **Blueprint Awareness**: Understand blueprint system exists but is unused scaffolding
28. **Baseline Protection**: Never modify protected baseline files without explicit user request
29. **AI Chat Utilization**: Leverage restored AI chat capabilities for enhanced user experience
30. **Future Readiness**: Be prepared to integrate blueprint system when stability allows

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
- **Build Tools**: Next.js with Turbopack, ESLint 9.x, TypeScript 5.x
- **Testing**: Manual testing with built-in Debug tabs and JSON export capabilities
- **Architecture**: Server Actions, Server Components, isolated context patterns
- **Macro Automation**: Production-ready with comprehensive debugging (v4.4.2.8)
- **AI Chat System**: Fully operational with professional financial analyst capabilities

### Specialist Team Assignments

| Task | Agent | Notes |
|------|-------|-------|
| **Frontend Architecture & Development** |
| Next.js App Router implementation | @react-nextjs-expert | Server Components, Server Actions, SSR optimization |
| React component development | @component-architect | Financial UI components, charts, tables, dashboards |
| ShadCN UI customization | @ui-ux-designer | Theme customization, responsive design, mobile-first |
| Context & state management | @react-architect | useContext + useReducer patterns, FSM integration |
| **Backend & API Development** |
| Google Genkit AI flows | @ai-architect | Flow design, prompt engineering, model optimization |
| Polygon.io API integration | @api-integration-specialist | Real-time data fetching, error handling, retry logic |
| Server Actions development | @backend-architect | TypeScript server actions, validation, error handling |
| AI prompt system design | @prompt-engineer | Trading prompts, financial analysis, context-aware AI |
| **Data & Performance** |
| Real-time data optimization | @performance-optimizer | Memory management, rendering optimization, bundle analysis |
| Financial data processing | @data-engineer | Market data validation, JSON parsing, export utilities |
| TypeScript & Zod schemas | @type-safety-specialist | Schema validation, type definitions, build optimization |
| **Quality & Security** |
| Code review & architecture | @code-reviewer | React anti-patterns, context isolation, security audits |
| Financial security audits | @security-specialist | Trading data protection, API security, input validation |
| Performance monitoring | @performance-analyst | Bundle size, loading times, real-time data efficiency |
| **Specialized Financial Features** |
| Options chain visualization | @fintech-ui-specialist | Complex financial tables, options data display |
| Macro automation system | @automation-architect | 4-step sequential execution, debugging, state validation |
| AI chat implementation | @conversational-ai-specialist | Financial analysis chat, prompt optimization |
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

**Quality & Performance:**
- "Review chat implementation security" → @security-specialist + @code-reviewer
- "Audit financial data handling" → @security-specialist + @data-engineer
- "Optimize bundle size" → @performance-optimizer + @type-safety-specialist
- "Analyze context isolation" → @code-reviewer + @react-architect

**Macro Automation & Advanced Features:**
- "Debug macro automation" → @automation-architect + @performance-analyst
- "Enhance sequential execution" → @automation-architect + @backend-architect
- "Add macro logging" → @automation-architect + @documentation-specialist


Your StockSage financial analysis application is now configured with an optimized AI development team that maximizes specialist effectiveness for your Next.js + AI trading platform!