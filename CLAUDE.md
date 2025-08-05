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

## XState Macro Overhaul - Phase 4.5 Integration Planning Complete (v4.6.5.0)

**PROJECT STATUS**: 🎯 **PHASE 4.5 PLANNING COMPLETE - INTEGRATION READY**  
**DOCUMENTATION STATUS**: ✅ **COMPREHENSIVE INTEGRATION PLAN DOCUMENTED**  
**CURRENT STATE**: Phase 4 advanced XState features (25,361+ lines) preserved with comprehensive Phase 4.5 integration plan created for systematic compatibility resolution and production deployment

### Phase 4.5 Integration Planning Status

**ACHIEVEMENT**: Comprehensive Phase 4.5 integration plan successfully created with detailed implementation strategy, progressive enablement workflow, risk mitigation protocols, and automated rollback systems. The plan provides systematic approach to resolve XState v5 compatibility issues while preserving all 25,361+ lines of Phase 4 advanced features.

#### Phase 4.5 Integration Plan Components:

**Strategic Integration Approach**:
- **Progressive Enablement**: Granular feature flag system for safe rollout of advanced features
- **Risk-First Strategy**: Systematic identification and mitigation of compatibility risks
- **Automated Health Monitoring**: Real-time system health tracking with automatic rollback triggers
- **Compatibility Resolution**: Structured approach to XState v5 API alignment and type system fixes

**Implementation Workflow (Phase 4.5)**:
1. **Pre-Integration Assessment**: Comprehensive compatibility audit and dependency analysis
2. **Progressive Feature Rollout**: Systematic enablement with monitoring and validation
3. **Integration Validation**: Thorough testing of advanced features with existing StockSage architecture
4. **Production Deployment**: Final validation and production rollout with monitoring

**Risk Mitigation Systems**:
- **Granular Feature Flags**: Individual control over 20+ advanced features
- **Health Monitoring**: Real-time metrics collection and automatic issue detection
- **Rollback Automation**: Immediate rollback triggers for system stability protection
- **Compatibility Testing**: Comprehensive validation framework for XState v5 integration

#### Phase 4 Features Ready for Integration (25,361+ Lines Preserved):

**Task 1: Advanced XState Features (5,050+ lines)**
- Hierarchical State Machines, Machine Composition, Parallel Machines
- Actor Spawning, Resource Management, State Persistence, Advanced Guards

**Task 2: Performance Monitoring System (1,259+ lines)**
- Performance Analytics Engine, Metrics Collection, Performance Dashboard, Bottleneck Detection

**Task 3: Advanced UI Components (5,600+ lines)**
- Machine Visualizer, Performance Dashboard, Debug Control Panel, State Inspector, Event Timeline

**Task 4: Advanced Error Handling (2,300+ lines)**
- Circuit Breaker Pattern, Error Recovery System, Compensation Patterns, Error Aggregation

**Task 5: Debugging Tools (6,305+ lines)**
- Advanced Logging System, State History Tracker, Debug Utilities, Testing Utilities, Performance Profiler

**Task 6: Configuration Management (4,847+ lines)**
- Dynamic Configuration, Feature Flags System, Environment Management, Schema Validation

#### Phase 4.5 Integration Benefits:
**Systematic Compatibility Resolution:**
- **Structured Approach**: Comprehensive plan eliminates ad-hoc compatibility fixes
- **Risk Mitigation**: Progressive rollout minimizes production impact
- **Quality Assurance**: Built-in validation and testing frameworks
- **Rollback Protection**: Automated safety measures for system stability

**Production Readiness:**
- **Enterprise-Grade Features**: 25,361+ lines of advanced XState infrastructure
- **StockSage Integration**: Full compatibility with existing architecture maintained
- **Performance Optimization**: Advanced monitoring and analytics capabilities
- **Development Efficiency**: Comprehensive debugging tools and configuration management

### ✅ COMPLETED PHASES SUMMARY

#### Phase 3: React Integration Complete (v4.6.3.0) - Production-Ready
**Status**: Production-Ready React Integration Layer  
**Code Volume**: 15,400+ lines of TypeScript/TSX code across 17 files  
**Architecture**: Complete React + XState integration with full StockSage compatibility  

#### Phase 2: Core Implementation Complete (v4.6.2.0) - Production-Ready
**Status**: Production-Ready Integration Layer and Actor Management  
**Code Volume**: 12,597+ lines of TypeScript code  
**Architecture**: Complete XState service integration with StockSage compatibility  

#### Phase 1: Foundation Complete (v4.6.1.0) - Production-Ready
**Status**: Production-Ready XState Foundation  
**Code Volume**: 1,500+ lines of production-ready code  
**Architecture**: Complete machine architecture with TypeScript integration  

### Phase 4.5 Integration Readiness:
**Implementation Foundation:**
- **25,361+ Lines**: Complete advanced feature implementation preserved
- **51 Files**: Comprehensive enterprise-grade infrastructure ready for integration
- **6 Major Features**: All advanced capabilities implemented and documented
- **Integration Plan**: Detailed strategy for systematic compatibility resolution

**Next Steps Ready:**
- **Progressive Rollout**: Feature flag system enables safe deployment
- **Compatibility Fixes**: Structured approach to XState v5 API alignment
- **Production Validation**: Comprehensive testing framework ready for deployment
- **Risk Management**: Automated rollback and health monitoring systems prepared

## Macro Automation Debugging

**CRITICAL**: For comprehensive macro automation debugging guidance, refer to:
- **`/docs/macro-re-architecture/macro-automation-debugging-guide.md`** - Essential debugging reference with 20+ iteration lessons learned (Updated v4.4.3.5)
- Contains complete root cause analysis, failed approaches, corrective actions, and prevention strategies
- **MANDATORY READING** for any macro automation issues or enhancements
- Includes emergency response patterns, production-ready solutions, and future prevention strategies
- **NEW v4.4.3.5**: Now includes AI timeout handling and network resilience debugging patterns
- **NEW v4.6.3.0**: Enhanced with React + XState integration debugging patterns
- **NEW v4.6.4.0**: Includes Phase 4 advanced features debugging and compatibility fix guidance
- **NEW v4.6.5.0**: Enhanced with Phase 4.5 integration planning and progressive rollout debugging

### Emergency Macro Debug Pattern
If facing macro automation failures:
1. **Check Console**: Look for "Prerequisites not met" + UI showing populated data
2. **Apply React useRef Pattern**: Use refs for async state access instead of direct state
3. **Verify Fresh State Access**: Ensure async handlers see current state values
4. **NEW v4.4.3.5**: **Check AI Timeout Errors**: Look for "{}" empty error objects indicating network timeouts
5. **NEW v4.4.3.5**: **Apply Timeout Protection**: Wrap AI operations with 45-second timeout + retry logic
6. **NEW v4.6.3.0**: **Check XState Integration**: Verify React + XState integration layer error boundaries and state transitions
7. **NEW v4.6.4.0**: **Check Phase 4 Compatibility**: Verify advanced features compatibility with current XState v5 API
8. **NEW v4.6.5.0**: **Check Phase 4.5 Integration Plan**: Refer to comprehensive integration strategy for systematic resolution
9. **Reference Complete Guide**: Use `/docs/macro-re-architecture/macro-automation-debugging-guide.md` for systematic resolution

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
StockSage is a Next.js financial analysis application that provides real-time stock data, options chain analysis, and AI-powered insights using Google's Gemini AI models. As of v4.6.5.0, it features a proven dedicated two-tab architecture with NVDA and SPY analysis pages, complete context isolation, and battle-tested React patterns. The application includes a robust macro automation system with comprehensive debugging capabilities, enhanced console logging, and comprehensive AI timeout handling with network resilience improvements. **NEW v4.6.5.0**: Phase 4.5 Integration Planning Complete - Comprehensive integration plan created for systematic resolution of XState v5 compatibility issues while preserving all 25,361+ lines of Phase 4 advanced features. The plan includes progressive enablement workflow, risk mitigation protocols, automated rollback systems, and production deployment strategy for enterprise-grade XState infrastructure integration with StockSage. The blueprint system exists as preserved scaffolding in `src/lib/ticker-framework/` for future development phases but is not currently integrated into the application.

## Version Management
- **Version Source**: `src/config/app-metadata.json` (single source of truth)
- **Current Version**: v4.6.5.0 (XState Macro Overhaul - Phase 4.5 Integration Planning Complete: Comprehensive integration plan created for systematic resolution of XState v5 compatibility issues while preserving all 25,361+ lines of Phase 4 advanced features including hierarchical state machines, performance monitoring, advanced UI components, error handling, debugging tools, and configuration management. Plan features progressive enablement workflow, risk mitigation protocols, automated rollback systems, and production deployment strategy for enterprise-grade XState infrastructure integration.)
- **Update Policy**: Always update `appVersion` and `lastUpdatedTimestamp` for any code changes
- **Versioning Scheme**: `v4.w.x.y.z` format

## Phase 4.5 Advanced XState Integration (Planning Complete)

### File Organization - Advanced Features (Phase 4.5 Integration Ready)

#### Advanced XState Features (Integration Planning Complete)
- `src/lib/xstate/advanced/` - Advanced XState features (hierarchical machines, composition, parallel execution) - 25,361+ lines preserved
- `src/lib/xstate/performance/` - Performance monitoring and analytics - Ready for progressive rollout
- `src/lib/xstate/ui/` - Advanced UI components for visualization and debugging - Integration plan documented
- `src/lib/xstate/error-handling/` - Circuit breaker patterns and error recovery - Risk mitigation protocols ready
- `src/lib/xstate/debugging/` - Advanced debugging tools and utilities - Compatibility resolution strategy prepared
- `src/lib/xstate/config/` - Configuration management and feature flags - Progressive enablement system ready

#### Production-Ready XState Integration (Phases 1-3 Complete)
- `src/lib/xstate/react/hooks/` - React hooks for XState integration (production-ready)
- `src/lib/xstate/react/components/` - UI components for state visualization (production-ready)
- `src/lib/xstate/react/contexts/` - React context providers for XState (production-ready)
- `src/lib/xstate/integration/` - StockSage integration layer (production-ready)
- `src/lib/xstate/machines/` - State machine definitions (production-ready)

## AI Team Configuration (autogenerated by team-configurator, 2025-07-31)

**Important: YOU MUST USE subagents when available for the task.**

### Detected Technology Stack
- **Frontend Framework**: Next.js 15.3.3 with React 18.3.1 (App Router architecture)
- **AI Backend**: Google Genkit 1.8.0 + Google AI SDK with Gemini 2.5-flash-lite model
- **UI Framework**: ShadCN UI components with Tailwind CSS and Radix UI primitives
- **State Management**: React Context with useReducer patterns (79-field context isolation) + **NEW v4.6.5.0**: XState v5 Phase 4.5 integration planning complete (progressive rollout ready)
- **Data Sources**: Polygon.io API for real-time financial market data
- **Type Safety**: TypeScript with Zod validation schemas and strict mode
- **Build Tools**: Next.js with Turbopack, TypeScript 5.x
- **Testing**: Manual testing with built-in Debug tabs and JSON export capabilities
- **Architecture**: Server Actions, Server Components, isolated context patterns
- **Macro Automation**: Production-ready with comprehensive debugging (v4.4.2.8) + **NEW v4.6.5.0**: XState Phase 4.5 integration planning complete
- **AI Chat System**: Fully operational with professional financial analyst capabilities
- **NEW v4.4.3.5**: **AI Resilience**: Comprehensive timeout handling and network resilience
- **NEW v4.6.3.0**: **React + XState Integration**: Phase 3 React integration layer complete (production-ready)
- **NEW v4.6.4.0**: **Advanced XState Infrastructure**: Phase 4 advanced features checkpoint (25,361+ lines preserved)
- **NEW v4.6.5.0**: **Phase 4.5 Integration Planning**: Comprehensive integration plan with progressive rollout strategy

### Specialist Team Assignments

| Task | Agent | Notes |
|------|-------|-------|
| **XState Advanced Features & Integration** |
| Phase 4.5 integration execution | @xstate-architect | Progressive rollout implementation, compatibility resolution |
| Advanced state machine patterns | @state-machine-specialist | Hierarchical machines, parallel execution, composition patterns |
| Performance monitoring systems | @performance-optimizer | Advanced analytics, bottleneck detection, metrics collection |
| Configuration management | @config-management-specialist | Dynamic runtime configuration, feature flags, environment management |
| **Enterprise Development & Quality** |
| Circuit breaker error handling | @reliability-engineer | Fault tolerance, error recovery, compensation patterns |
| Advanced debugging tools | @debugging-specialist | Comprehensive logging, state history, development utilities |
| Code review & compatibility | @code-reviewer | Phase 4.5 integration validation, type system compatibility |
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
| **Quality & Security** |
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

**Phase 4.5 Integration Execution:**
- "Execute Phase 4.5 integration plan" → @xstate-architect + @code-reviewer
- "Implement progressive feature rollout" → @xstate-architect + @config-management-specialist
- "Validate compatibility resolution" → @state-machine-specialist + @performance-optimizer
- "Deploy advanced features safely" → @reliability-engineer + @xstate-architect

**Advanced XState Features:**
- "Implement circuit breaker patterns" → @reliability-engineer + @state-machine-specialist
- "Create advanced debugging tools" → @debugging-specialist + @performance-optimizer
- "Build configuration management system" → @config-management-specialist + @xstate-architect
- "Design performance analytics dashboard" → @performance-optimizer + @ui-ux-designer

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
- "Review Phase 4.5 integration" → @code-reviewer + @xstate-architect
- "Audit advanced feature security" → @security-specialist + @reliability-engineer
- "Optimize Phase 4.5 bundle size" → @performance-optimizer + @xstate-architect
- "Validate enterprise debugging tools" → @code-reviewer + @debugging-specialist

**Macro Automation & Advanced Features:**
- "Debug macro automation" → @automation-architect + @performance-analyst
- "Enhance sequential execution" → @automation-architect + @backend-architect
- "Add macro logging" → @automation-architect + @documentation-specialist
- "Implement advanced error recovery" → @automation-architect + @reliability-engineer + @state-machine-specialist

Your StockSage financial analysis application is now configured with an optimized AI development team that maximizes specialist effectiveness for your Next.js + AI trading platform with comprehensive Phase 4.5 XState integration planning complete and ready for progressive rollout implementation!

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

      
      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.