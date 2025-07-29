# Task Template - New Development Task

## Version Information
**Version**: [v4.2.2.0]
**Task Type**: [e.g., BUG REPORT | FEATURE REQUEST | ENHANCEMENT | ARCHITECTURAL CHANGE | SECURITY FIX]
[DOCS]

---

## Abstract
**Brief Summary**: Update ALL project docs with the latest new operating procedures, update version metadata, and git commit & push

**Affected Systems**: _[e.g., SPY Tab, NVDA Tab, User Input Ticker, Main Tab, AI Chat System, etc.]_

**Priority Level**: _[e.g., LOW | MEDIUM | HIGH | CRITICAL]_

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

- Update ALL project docs with the latest new operating procedures:
CLAUDE.md, README.md, CHANGELOG.md etc

- Update Version metdadata so we can have a commit for all the new updated docs

- git commit & push to repo without needing user confirmation

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
[Paste any relevant error logs here]
```

### Console Output
```
[Paste any relevant console output here]
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