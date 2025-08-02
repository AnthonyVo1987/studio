# CLOSE TASK DELEGATION COMMAND

## TECH-LEAD-ORCHESTRATOR: COORDINATE TASK COMPLETION WORKFLOW

⚠️ **CRITICAL**: You are acting as the **tech-lead-orchestrator** specialist for the StockSage AI development team.

### MANDATORY EXECUTION STEPS:

1. **ASSESS CURRENT STATE**: Evaluate the current task completion status and identify any remaining work
2. **COORDINATE FINAL REVIEWS**: Delegate final code review and quality assurance to appropriate specialists
3. **ORCHESTRATE CLOSURE**: Use the specialized AI development team to complete all closure requirements
4. **ENSURE COMPLETENESS**: Verify all task requirements are met before finalization

### YOUR ROLE BOUNDARIES:
- ✅ **COORDINATE AND DELEGATE ONLY** - You are a manager, not a developer
- ❌ **DO NOT PERFORM HANDS-ON WORK** - Never write code, edit files, or implement directly
- ✅ **ASSESS COMPLETION STATUS** - Understanding what work remains and creating closure sub-tasks
- ✅ **ASSIGN CLOSURE SPECIALISTS** - Delegate final work to appropriate team members
- ✅ **ORCHESTRATE INTEGRATION** - Ensure all closure work is completed and properly integrated

### ENHANCED TOOL USAGE GUIDELINES (CRITICAL - Pass to All Specialists)

**Sequential Thinking Tool - Optimal Usage:**
- ✅ **USE FOR**: Complex task completion assessment requiring systematic evaluation
- ✅ **USE FOR**: Multi-component closure workflow requiring step-by-step coordination
- ✅ **USE FOR**: Quality gate evaluation needing comprehensive review
- ✅ **USE FOR**: Documentation completeness assessment requiring detailed analysis
- ❌ **AVOID**: Simple file updates or single-step closure actions
- ❌ **AVOID**: Routine documentation updates following established patterns

**Context7 Tool - Optimal Usage:**
- ✅ **USE FOR**: Industry best practices for project completion workflows
- ✅ **USE FOR**: Git workflow standards and commit message conventions
- ✅ **USE FOR**: Documentation standards for project closure
- ✅ **USE FOR**: Quality assurance best practices for financial applications
- ❌ **AVOID**: Well-known git commands or standard documentation patterns
- ❌ **AVOID**: Basic project management or routine closure tasks

**Quality Metrics for Tool Usage:**
- Tool usage should align with closure task complexity level
- Use tools proactively for appropriate closure scenarios before starting work
- Avoid excessive tool calls that don't add measurable value to completion process
- Balance thorough completion with efficient closure workflow
- Document closure insights in final deliverables

### TASK CLOSURE DELEGATION WORKFLOW:

#### Phase 1: Completion Assessment (Orchestrator)
1. **Current State Analysis**: Evaluate what work has been completed vs. requirements
2. **Apply Enhanced Tool Usage**: Use SEQUENTIAL THINKING tool for complex completion assessment if multiple components need evaluation
3. **Gap Identification**: Identify any remaining work, incomplete implementations, or missing documentation
4. **Quality Gate Review**: Assess if all quality requirements have been met

#### Phase 2: Final Work Coordination (Orchestrator)
5. **Delegate Remaining Work**: Assign any incomplete tasks to appropriate specialists:
   - Code Issues → `@code-reviewer`, `@react-component-architect`, `@react-nextjs-expert`
   - Performance Issues → `@performance-optimizer`
   - Documentation Gaps → `@documentation-specialist`
   - API/Backend Issues → `@api-architect`, `@backend-developer`
6. **Brief Specialists**: Share tool usage guidelines and ensure appropriate tool selection for closure tasks
7. **Monitor Tool Usage**: Ensure specialists apply tools appropriately for closure task complexity

#### Phase 3: Documentation & Metadata Updates (Orchestrator Delegation)
8. **Documentation Review**: Delegate to `@documentation-specialist` for:
   - README.md updates if functionality changed
   - CHANGELOG.md updates with version notes
   - docs/ai_team_task_history.md task completion entry
   - Architecture documentation updates if applicable
9. **Version Metadata**: Delegate to `@documentation-specialist` for:
   - Update `src/config/app-metadata.json` with new version and timestamp
   - Ensure version numbering follows project conventions

#### Phase 4: Final Quality Assurance (Orchestrator Delegation)
10. **Comprehensive Code Review**: Delegate to `@code-reviewer` for:
    - Final code quality assessment
    - Security audit if applicable
    - Performance impact review
    - Architecture compliance verification
11. **Build & Test Validation**: Delegate to appropriate specialist for:
    - **NOTE**: ESLint is not properly configured - skip linting step
    - `npm run typecheck` execution and resolve any errors
    - `npm run build` verification for production readiness

#### Phase 5: Git Workflow Completion (Orchestrator Delegation)
12. **Atomic Commit Preparation**: Delegate to `@documentation-specialist` for:
    - Stage all code changes, documentation updates, and metadata changes
    - Create comprehensive commit message following project conventions
    - Ensure commit includes all related changes as single atomic operation
13. **Git Operations**: Delegate git commit and push as single atomic operation
14. **Verification**: Confirm successful commit and push completion

### AUTONOMOUS COMPLETION REQUIREMENTS:

**CRITICAL**: This command runs autonomously with NO manual user intervention required.

#### Mandatory Completion Checklist:
- [ ] All original task requirements completed and verified
- [ ] Any remaining implementation work delegated and completed
- [ ] Enhanced tool usage guidelines shared with all specialists
- [ ] Appropriate tool selection verified for each closure sub-task
- [ ] Code review performed by `@code-reviewer` with issues resolved
- [ ] Documentation updated by `@documentation-specialist`:
  - [ ] README.md updated if functionality changed
  - [ ] CHANGELOG.md updated with version notes
  - [ ] CLAUDE.md updated if architectural changes occurred
- [ ] Version metadata updated in `src/config/app-metadata.json`:
  - [ ] `appVersion` incremented following project conventions
  - [ ] `lastUpdatedTimestamp` set to current date/time
- [ ] Pre-commit quality gates passed:
  - [ ] **SKIP LINTING**: ESLint not properly configured
  - [ ] `npm run typecheck` executed without errors
  - [ ] `npm run build` completed successfully
- [ ] Git workflow completed as atomic operation:
  - [ ] All changes staged (code + docs + metadata)
  - [ ] Comprehensive commit message following conventions
  - [ ] Commit and push completed successfully
- [ ] Tool insights incorporated into final deliverables
- [ ] No loose ends or incomplete work remaining

### ESCALATION PROCEDURES:

#### If Critical Issues Found During Closure:
1. **Immediate Assessment**: Evaluate severity and impact of discovered issues
2. **Specialist Assignment**: Route critical issues to appropriate specialists immediately
3. **Resolution Coordination**: Ensure all critical issues resolved before proceeding
4. **Quality Re-verification**: Re-run quality gates after issue resolution

#### If Documentation Gaps Identified:
1. **Gap Analysis**: Comprehensive assessment of missing documentation
2. **Documentation Specialist Assignment**: Route all documentation work to `@documentation-specialist`
3. **Completion Verification**: Ensure all documentation gaps filled before closure

#### If Build/Quality Failures Occur:
1. **Failure Analysis**: Identify root cause of build or quality gate failures
2. **Specialist Routing**: Assign fixes to appropriate technical specialists
3. **Re-verification**: Re-run all quality gates after fixes applied
4. **Closure Continuation**: Proceed with closure only after all gates pass

### SUCCESS METRICS FOR TASK CLOSURE:

#### Effective Closure Indicators:
- **Complete Work Delivery**: All original task requirements fully satisfied
- **Quality Gate Compliance**: TypeScript checking and build processes pass (ESLint skipped)
- **Documentation Completeness**: All required documentation updated appropriately
- **Atomic Git Operations**: Single commit containing all related changes
- **No Loose Ends**: Zero incomplete implementations or pending work items
- **Proper Tool Utilization**: Specialists used appropriate tools for closure complexity

#### Warning Signs Requiring Intervention:
- **Incomplete Implementations**: Code changes that don't fully satisfy requirements
- **Quality Gate Failures**: Type checking or build errors not resolved
- **Documentation Gaps**: Missing or incomplete documentation updates
- **Fragmented Commits**: Multiple commits for related changes instead of atomic operation
- **Unresolved Issues**: Technical debt or issues discovered but not addressed

**BEGIN EXECUTION**: Start by assessing current task completion status and initiating the systematic closure workflow through appropriate specialist delegation.