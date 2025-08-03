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

## Macro Re-Architecture Analysis Complete (v4.5.3.0)

**PROJECT STATUS**: ✅ **MACRO RE-ARCHITECTURE ANALYSIS COMPLETE**  
**DOCUMENTATION STATUS**: ✅ **CODE REVIEW PASSED**  
**NEXT PHASE**: Implementation Decision & Development  

### Comprehensive Analysis Delivered

**CRITICAL**: Complete macro automation re-architecture analysis has been delivered with 3 viable implementation options and strategic decision framework.

#### Key Deliverables:
- **📋 Architecture Decision Analysis**: `/docs/macro-re-architecture/comprehensive-architecture-decision-analysis.md`
- **📄 Strategic Implementation Guide**: `/docs/macro-re-architecture/strategic-implementation-guide.md`
- **⭐ 3 Viable Options**: XState (4-5 days), Command Pattern (5-6 days), Hybrid (20-25 days)
- **🎯 Decision Matrix**: Complete evaluation criteria for selecting optimal approach
- **📊 Technical Specifications**: Detailed PRDs for all architectural options
- **🔧 Migration Strategies**: Step-by-step implementation roadmaps

#### Current Macro System Analysis:
- **Current State**: 1,400+ lines, 20+ debugging iterations, complex React closure patterns
- **Success Rate**: 100% execution with useRef escape hatch patterns
- **Technical Debt**: High complexity, difficult maintenance, limited extensibility
- **Performance**: 5-11 second baseline, up to 45 seconds for complex operations

#### Re-Architecture Options Available:

**1. XState State Machine (Option 2)** ⭐ **PRIMARY RECOMMENDATION**
- **Complexity**: Medium
- **Implementation**: 4-5 days
- **Benefits**: 65% complexity reduction, impossible invalid states, visual debugging
- **Best For**: Fast implementation with moderate complexity tolerance

**2. Command Pattern (Option 3)** ⭐ **ALTERNATIVE RECOMMENDATION**
- **Complexity**: High
- **Implementation**: 5-6 days
- **Benefits**: Complete separation of concerns, excellent testability
- **Best For**: Maximum testability and enterprise security requirements

**3. Hybrid Command + XState (Option 4)** 🚀 **FUTURE-PROOF CHOICE**
- **Complexity**: Very High
- **Implementation**: 20-25 days
- **Benefits**: Ultimate modularity, AI-native integration, plugin ecosystem
- **Best For**: Revolutionary architecture with unlimited extensibility

### Implementation Decision Framework

#### Quick Decision Guide:
- **Need Fast Results (4-5 days)**: Choose XState (Option 2)
- **Maximum Testability Required**: Choose Command Pattern (Option 3)
- **Revolutionary Future-Proofing**: Choose Hybrid (Option 4)

#### Documentation Structure:
```
/docs/macro-re-architecture/
├── README.md                                     # Project hub and status
├── comprehensive-architecture-decision-analysis.md # Complete decision analysis
├── strategic-implementation-guide.md            # Strategic guidance
├── option-2-xstate-prd.md                      # XState PRD
├── option-3-command-pattern-prd.md             # Command Pattern PRD
├── option-4-hybrid-command-xstate-prd.md       # Hybrid PRD
├── macro-automation-debugging-guide.md         # Current system debugging
└── v4.4.3.5_TIMEOUT_FIX_IMPLEMENTATION_REPORT.md # Recent fixes
```

### Next Steps for Implementation:
1. **Review Documentation**: Study comprehensive analysis and decision framework
2. **Select Architecture**: Choose from 3 viable options based on requirements
3. **Implementation Planning**: Use provided roadmaps and timelines
4. **Development Phase**: Execute selected architectural approach

**REFERENCE**: For complete analysis, refer to `/docs/macro-re-architecture/README.md` and comprehensive documentation suite.

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
StockSage is a Next.js financial analysis application that provides real-time stock data, options chain analysis, and AI-powered insights using Google's Gemini AI models. As of v4.5.3.0, it features a proven dedicated two-tab architecture with NVDA and SPY analysis pages, complete context isolation, and battle-tested React patterns. The application includes a robust macro automation system with comprehensive debugging capabilities, enhanced console logging, and comprehensive AI timeout handling with network resilience improvements. **NEW v4.5.3.0**: Completed comprehensive macro re-architecture analysis with 3 viable implementation options (XState, Command Pattern, Hybrid) and strategic decision framework ready for implementation phase. The blueprint system exists as preserved scaffolding in `src/lib/ticker-framework/` for future development phases but is not currently integrated into the application.

## Version Management
- **Version Source**: `src/config/app-metadata.json` (single source of truth)
- **Current Version**: v4.5.3.0 (Macro Re-Architecture Analysis Complete: Comprehensive analysis of macro automation re-architecture with 3 viable implementation options (XState, Command Pattern, Hybrid). Delivered strategic decision framework with detailed PRDs, technical specifications, and implementation roadmaps. Code review PASSED for all architectural documentation. System ready for implementation decision and development phase.)
- **Update Policy**: Always update `appVersion` and `lastUpdatedTimestamp` for any code changes
- **Versioning Scheme**: `v4.w.x.y.z` format

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
- **NEW v4.5.3.0**: **Macro Re-Architecture**: Complete analysis with 3 implementation options ready

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
| **Macro Re-Architecture Implementation** |
| XState implementation | @automation-architect + @react-architect | State machine patterns, FSM integration |
| Command Pattern implementation | @automation-architect + @backend-architect | Command queue, execution pipeline |
| Hybrid architecture implementation | @automation-architect + @ai-architect | Advanced plugin system |
| **Quality & Security** |
| Code review & architecture | @code-reviewer | React anti-patterns, context isolation, security audits, AI resilience |
| Financial security audits | @security-specialist | Trading data protection, API security, input validation |
| Performance monitoring | @performance-analyst | Bundle size, loading times, real-time data efficiency |
| **Project Management** |
| Technical coordination | @tech-lead-orchestrator | **COORDINATION-ONLY** - delegates all implementation work |
| Documentation management | @documentation-specialist | Architecture docs, API guides, feature specifications |
| Codebase analysis | @code-archaeologist | Technical debt analysis, architecture assessment |

**Your StockSage financial analysis application is now configured with an optimized AI development team that maximizes specialist effectiveness for your Next.js + AI trading platform with comprehensive AI resilience capabilities and macro re-architecture implementation readiness!**