# Task Template - New Development Task

## Version Information
**Version**: [v4.3.0.0]
**Task Type**: [MAJOR FEATURE\REFACTOR]
---

## Abstract
**Brief Summary**: Refactor & Consolidate to use new Architecture from NVDA\SPY tabs only

**Affected Systems**: _[User Input Ticker]_

**Priority Level**: _[CRITICAL]_

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

#### Step 1: Task Analysis & Breakdown
1. **Analyze** the task requirements thoroughly
2. **Identify** all affected systems and components
3. **Break down** into specific, actionable sub-tasks
4. **Determine** specialist assignments for each sub-task

#### Step 2: Specialist Assignment Guidelines

**Frontend/UI Work** → Delegate to:
- `@react-component-architect` - Complex UI components, state management patterns
- `@react-nextjs-expert` - Next.js architecture, Server Components, App Router
- `@tailwind-css-expert` - ShadCN UI customization, responsive design

**Backend/API Work** → Delegate to:
- `@api-architect` - Server Actions, AI flows, Genkit development
- `@backend-developer` - Data integration, API optimization, Polygon.io

**Quality Assurance** → Delegate to:
- `@code-reviewer` - Code review, security audit, React anti-patterns
- `@performance-optimizer` - Performance optimization, bundle analysis

**Documentation** → Delegate to:
- `@documentation-specialist` - Documentation updates, API specs

#### Step 3: Coordination Requirements
1. **Clearly communicate** requirements to each specialist
2. **Manage dependencies** between specialist work
3. **Ensure consistent** implementation across specialists
4. **Review all outputs** for cohesion and completeness
5. **Coordinate final integration** of all specialist work

#### Step 4: Completion Checklist
- [ ] All sub-tasks delegated to appropriate specialists
- [ ] All specialist work completed and reviewed
- [ ] Code review performed by `@code-reviewer`
- [ ] Documentation updated by `@documentation-specialist`
- [ ] Integration testing completed
- [ ] Version metadata updated in `src/config/app-metadata.json`

---

## Task Details

Refactor & Consolidate to use new Architecture from NVDA\SPY tabs only
- NVDA & SPY pages are working perfectly with zero issues, so it is time to fully migrate, integrate, & consolidate the app to use the new architecture
- We will completely Remove ALL of the legacy main page code, Legacy Data tab, legacy debug FSM tab, and anything else related to the legacy architecture
- The new User Input page is also not working correctly, so we will plan a new re-design in a future task, so the User Input ticker tab and all corresponding code also needs to be completely removed
- NVDA & SPY dedicated tabs will now be the "single source of truth and architecture going forward
- Since NVDA & SPY tabs are robust and currently "isolated", as part of the refactor we need to then consolidate the two separate tabs and refactor into a more "re-usable common code module" so that we do NOT have so much duplicate code currently. We need to refactor into a core component type blueprint to leverage as much code as possible, and the main differences is to have some sort of parameter\flags passed for the tab to know if it is NVDA dedicated and/or SPY dedicated.  This should greatly reduce alot of duplicated code flows and wiring and allows further expansion in the future
- In the future, we may even add more dedicated tabs for more tickers, so let's get it out of the way now to create a more streamlined blueprint\modular design so that creating even 5-10x total dedicated stock ticker tabs should be very trivial if our re-factor is done correctly.  We also need to keep in mind the new shared common code component architecture for new pages should be flexible enough with either switch statements and/or flags if the new tabs being added are for specific single tickers OR even user input ticker.  For example, in the future we can have 5x dedicated single ticker tabs, and 5x more user input tabs for a total of 10x tabs
- So even though multiple tabs will share and use the same underlying modular component, each tab NEEDS to be completely isolated from other tabs withs it's own blueprint\template of it's own data space, so keep this in mind for the refactor\redesign
- The end deliverable will be a completely streamlined, modular app, with JUST NVDA and SPY dedicated tabs initially, and new user input and dedicated stock ticker tabs to be added on in a later task. 
- TECH-LEAD-ORCHESTRATOR needs to properly delegate tasks to ensure during the refactor to make sure we have NO remnants and unused code\data flows anymore and ensure proper wiring

- One last TECH-LEAD-ORCHESTRATOR delegation documentation task is to also remove all references to "close_task and/or task finalizer agent" because I removed\deleted the agent for now, and will rely fully on our AI Team with the TECH-LEAD-ORCHESTRATOR to handle those actions now instead of having a custom agent for it.  This custom agent and custom command is NOT part of our AI Development team that the TECH-LEAD-ORCHESTRATOR can delegate tasks to, so to remove confusion, we won't use custom agents like that at the moment.  The TECH-LEAD-ORCHESTRATOR already has the ability to delegate all of the task closing, doc update, and git commits & push, so we are removing a redundant agent and instructions


### Current Situation
_[Describe the current state of the system/feature/issue]_

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

### Console Output
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