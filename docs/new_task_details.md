# Task Template - New Development Task

## Version Information
**Version**: [v4.4.2.6]
**Task Type**: [FEATURE] 
---

## Abstract
**Brief Summary**: Phase 2: Add New Analyze All Macro Buttons

**Affected Systems**: []

**Priority Level**: _[HIGH]_

---

## DELEGATION INSTRUCTIONS FOR TECH-LEAD-ORCHESTRATOR

### ⚠️ CRITICAL: TECH-LEAD-ORCHESTRATOR ROLE BOUNDARIES

**YOU ARE A COORDINATOR ONLY - DO NOT PERFORM HANDS-ON WORK**

#### Your Responsibilities (COORDINATOR ONLY):
- ✅ **Analyze** the task requirements and break down into sub-tasks
- ✅ **Delegate** specific work to appropriate specialists
- ✅ **Coordinate** between specialists when dependencies exist
- ✅ **Review** overall progress and ensure all requirements are met
- ✅ **Synthesize** specialist outputs into cohesive solution
- ✅ **Ensure** code review process is followed
- ✅ **Verify** documentation updates are completed

#### What You MUST NOT Do (HANDS-ON WORK):
- ❌ **Write** any code directly
- ❌ **Edit** any files directly
- ❌ **Implement** features yourself
- ❌ **Debug** code issues directly
- ❌ **Create** new components or functions
- ❌ **Modify** existing business logic
- ❌ **Perform** any technical implementation work

### MANDATORY DELEGATION WORKFLOW

#### CRITICAL: AUTONOMOUS COMPLETION COMMITMENT
**ORCHESTRATOR PLEDGE**: I commit to executing complete autonomous task completion from code review PASS to final git commit without requiring manual user intervention. I understand that asking the user to manually request documentation updates or git commits after a passing code review constitutes a role boundary violation.

#### Step 1: Task Analysis & Breakdown
1. **Analyze** the task requirements thoroughly
2. **Identify** all affected systems and components
3. **Break down** into specific, actionable sub-tasks
4. **Determine** specialist assignments for each sub-task

#### Step 2: Enhanced Tool Usage & Specialist Assignment Guidelines

**CRITICAL: Share Enhanced Tool Usage Guidelines with ALL Specialists**

**Tool Selection Criteria:**
- **Sequential Thinking Tool**: Use for complex multi-step analysis (>7/10 complexity, >2h tasks, multi-component impact)
- **Context7 Tool**: Use for external technology research, industry standards, new library integration
- **Quality Metrics**: Tool usage should align with task complexity, avoid excessive calls, document insights

**Specialist Assignment Matrix:**

**Frontend/UI Work** → Delegate to:
- `@react-component-architect` - Complex UI components, state management patterns
  - *Tool Guidance*: Use Sequential Thinking for complex component architecture decisions
- `@react-nextjs-expert` - Next.js architecture, Server Components, App Router
  - *Tool Guidance*: Use Context7 for new Next.js features or performance patterns
- `@tailwind-css-expert` - ShadCN UI customization, responsive design
  - *Tool Guidance*: Use Context7 for responsive design best practices and accessibility standards

**Backend/API Work** → Delegate to:
- `@api-architect` - Server Actions, AI flows, Genkit development
  - *Tool Guidance*: Use Sequential Thinking for complex AI flow design, Context7 for Genkit best practices
- `@backend-developer` - Data integration, API optimization, Polygon.io
  - *Tool Guidance*: Use Context7 for API integration patterns and error handling strategies

**Quality Assurance** → Delegate to:
- `@code-reviewer` - Code review, security audit, React anti-patterns
  - *Tool Guidance*: Use Sequential Thinking for complex architectural reviews
- `@performance-optimizer` - Performance optimization, bundle analysis
  - *Tool Guidance*: Use Context7 for current performance optimization techniques

**Documentation** → Delegate to:
- `@documentation-specialist` - Documentation updates, API specs
  - *Tool Guidance*: Use Context7 for documentation standards and best practices

#### Step 3: Coordination Requirements
1. **Share Tool Usage Guidelines**: Ensure all specialists receive enhanced tool usage criteria
2. **Clearly communicate** requirements to each specialist
3. **Monitor Tool Selection**: Verify specialists use appropriate tools based on task complexity
4. **Manage dependencies** between specialist work
5. **Review Tool Insights**: Ensure tool findings are incorporated into deliverables
6. **Ensure consistent** implementation across specialists
7. **Review all outputs** for cohesion and completeness
8. **Coordinate final integration** of all specialist work

#### Step 4: Autonomous Completion Workflow (CRITICAL)

**🚨 AUTONOMOUS OPERATION REQUIREMENTS:**

**Code Review PASS = Automatic Completion Trigger**
When `@code-reviewer` reports **"PASSED"** status, orchestrator MUST immediately initiate autonomous completion sequence WITHOUT user intervention.

**Autonomous Completion Sequence:**
1. **Documentation Update** → Delegate to `@documentation-specialist` for final updates (README.md, CHANGELOG.md, docs/ai_team_task_history.md)
2. **Version Metadata Update** → Coordinate `src/config/app-metadata.json` version increment  
3. **Atomic Git Commit** → Execute complete git commit and push workflow
4. **Task Closure Confirmation** → Provide final completion status to user

**⚠️ ZERO MANUAL INTERVENTION POLICY:**
- NO user requests needed after code review passes
- NO manual prompting for documentation or commit steps
- NO incomplete task handoffs requiring user action
- COMPLETE autonomous operation from review pass to final commit

**Completion Success Criteria:**
- [ ] Enhanced tool usage guidelines shared with all specialists
- [ ] All sub-tasks delegated to appropriate specialists
- [ ] Appropriate tool selection verified for task complexity
- [ ] All specialist work completed and reviewed
- [ ] Tool insights incorporated into deliverables
- [ ] **🚨 AUTONOMOUS TRIGGER**: Code review performed by `@code-reviewer` with PASS status
- [ ] **🚨 AUTO-EXECUTE**: Documentation updated by `@documentation-specialist`
- [ ] **🚨 AUTO-EXECUTE**: Integration testing completed (if required)
- [ ] **🚨 AUTO-EXECUTE**: Version metadata updated in `src/config/app-metadata.json`
- [ ] **🚨 AUTO-EXECUTE**: Complete atomic git commit and push operation
- [ ] **🚨 AUTO-CONFIRM**: Final task completion status provided to user

**Orchestrator Accountability:**
Orchestrator MUST complete entire autonomous workflow without requiring additional user requests. Failure to execute autonomous completion constitutes role boundary violation.

---

## Task Details

Phase 2: Add New Analyze All Macro Buttons
- Add New "Analyze All" button that will run macros that will automaticaly trigger all user action buttons\events to fully retreive data and analyze everything automatically
- This new feature will basically help the user save alot of time by wrapping alot of the app manual button actions to be done autonomously, mimic what A user would have to do manually over multiple steps in this exact sequence that a user normally does:

1. Trigger the Fetch Expiration button action and have the default expiration selected
2. Trigger the Get Stock Data button action to retreive all stock data
3. Trigger the On Demand AI Key Takeaways button action
4. Trigger the On Demand AI Options Analysis button action
5. Trigger the AI Chat App Data Analysis Stock Trader's Takeways button action
6. Trigger the AI Chat App Data Analysis Options Trader Takeways button action
7. Trigger the AI Chat App Data Analysis Additional Holistic Takeways button action
8. Trigger the AI Chat Web Search Analysis Support/Resistance button action
9. Trigger the AI Chat Web Search Analysis Technical Analysis button action
10. Trigger the AI Chat Web Search Analysis Options Flow button action

###

- You will  have to use CONTEXT7 to research on best, optimal, and robust practices to implement the new macro feature
- You will  have to use CONTEXT7 to research and ensure that we have proper error handling, next macro step\state handling, race condition prevention, proper next action signaling etc
- You MAY have to use SEQUENTIAL THINKING AND CONTEXT7 to come up with this complex "macro" architecture
- We have to make sure it is robust and the macro does not do things out of order, or go too soon to the next step before the current step is fininshed, or if data is not ready yet etc
- We need to ensure the new macro feature is deterministic for robustness, so make sure you research best practices for this initial "10 step macro\pipeline" automatation concept
- State, flags, variables, and data tracking may be needed so a certain macro step knows what data it needs to perform its job, and what is the next state etc
- We need the macro button for EVERY ticker page, so it needs to be modular enough to be used for multiple ticker pages, since every new page will have this feature
- For now, implement for both the NVDA & SPY pages
- Since this is a brand new and complex feature with many moving parts, we need to liberally add as many console outputs as feasible to help debug this issue while we are developing and testing it.  Off the top of my head, at the bare minimum, we need Start/End logs when user triggers the start of macro action, individual granular start/end output for EACH macro step, and add anything else you think may help.  With this level of granularity, we can then see if user triggered the macro, and if a macro step fails, we would know which macro step got started and which one ended etc.  You may add any relevent parameters to the console messages to provide more debug info.

### Current Situation



### Desired Outcome
_[Describe what the end result should look like]_

### Acceptance Criteria
1. _[Specific, measurable criteria for task completion]_
2. _[Additional criteria as needed]_
3. _[Include performance, UX, and technical requirements]_


---

## Symptoms or Change Request

### Issue Description
_[Detailed description of the problem or requested change]_


### Steps to Reproduce (if applicable)
1. _[Step 1]_
2. _[Step 2]_
3. _[Step 3]_

### Expected vs Actual Behavior
**Expected**: _[What should happen]_  
**Actual**: _[What actually happens]_

---

## Technical Context

### Affected Files/Components
_[List specific files, components, or systems that need modification]_

### Dependencies
_[List any dependencies between this task and other systems/features]_

### Architecture Considerations
_[Any architectural decisions or patterns that must be followed]_

---

## Logs and Evidence

### Error Logs
```


```

### Screenshots/Evidence
_[Describe or attach any visual evidence of the issue]_

---

## Requirements and Constraints

### Technical Requirements
- _[Specific technical requirements]_
- _[Performance requirements]_
- _[Compatibility requirements]_

### Business Requirements
- _[User experience requirements]_
- _[Functional requirements]_
- _[Integration requirements]_

### Constraints
- _[Timeline constraints]_
- _[Resource constraints]_
- _[Technical limitations]_

---

## Implementation Notes

### Suggested Approach
_[High-level approach or strategy for implementation]_

### Risk Assessment
- **High Risk**: _[Items that could cause significant issues]_
- **Medium Risk**: _[Items that need careful consideration]_
- **Low Risk**: _[Items with minimal impact]_

### Testing Strategy
_[How the implementation should be tested]_

---

## Additional Context

### Related Issues/Tasks
_[Reference to related tasks, issues, or documentation]_

### Background Information
_[Any additional context that would help with implementation]_

### Success Metrics
_[How success will be measured]_

---

## TEMPLATE USAGE INSTRUCTIONS

1. **Fill out all relevant sections** before starting task work
2. **Tech-lead-orchestrator MUST** follow delegation instructions strictly
3. **All specialists** should reference this document for requirements
4. **Update this document** as requirements change or are clarified
5. **Archive completed tasks** by renaming to `completed_task_[version].md`

---

**Template Version**: v1.0.0  
**Last Updated**: [Current Date]  
**Created By**: [User/Team Name]