# Task Template - New Development Task

## Version Information
**Version**: [v4.4.0.0]
**Task Type**: [DOCS] 
---

## Abstract
**Brief Summary**: Update New Task Procedures with Better Tool Use & Autonomy

**Affected Systems**: _[DOCS]_

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

#### Step 4: Completion Checklist
- [ ] Enhanced tool usage guidelines shared with all specialists
- [ ] All sub-tasks delegated to appropriate specialists
- [ ] Appropriate tool selection verified for task complexity
- [ ] All specialist work completed and reviewed
- [ ] Tool insights incorporated into deliverables
- [ ] Code review performed by `@code-reviewer`
- [ ] Documentation updated by `@documentation-specialist`
- [ ] Integration testing completed
- [ ] Version metadata updated in `src/config/app-metadata.json`

---

## Task Details

1. Use Context7 tool to perform some more research on best, optimal practices & prompt logic for having AI Agents use the SEQUENTIAL THINKING MCP TOOL & CONTEXT7 MCP Tool on a fully dynamic, adaptable, & proactive basis, where the AI Agent only calls the tool in scenarios that are absolutely neccessary and/or optimal, with the most optimal # of tool uses. We want to come up a an enhanced prompt logic to ensure the AI uses these tools smartly only when needed, to prevent excessive and unnecessary tool calls that do not fit the current scope of the task(s)

2. After research has been performed for best practices, now we can try and update some details and operating procedures across all of those docs to sync up for the TECH-LEAD-ORCHESTRATOR when /new_task command is invoked:

- We currently have a custom command "/new_task" stored in .claude/commands/new_task.md that will trigger the to read the docs/new_task.md for the details in order to fully delegate & coordinate to approrpiate AI Specialist to complete all task(s) requested.  There are also instructions in CLAUDE.md to follow this new task operating procedure
- So now update all of these docs to ensure that when "/new_task" command is invoked, the .claude/commands/new_task.md command details, docs/new_task.md new task details, and CLAUDE.md are all in sync to ensure that the TECH-LEAD-ORCHESTRATOR properly follows the best practices for the tool calls in order to fully delegate & coordinate AI Specialist(s) to complete all tasks.
- rename docs/new_task.md to docs/new_task_details.md to help distuguish between new_task command vs new_task details.  Update all references across project to now use docs/new_task_details.md instead of the older file
- Create a new .md file in docs folder "ai_team_task_history.md", that will work similiar to CHANGELOG.md, but this just gets updated automically by the approriate specialist to track and summarize the Actions and Calls for the AI Team tied to the new specific task(s) outlined in new_task_details.md.  This will help manage, oversee, and review how the AI Team specialist for each Task request as a metric for workflow optimization later on. This needs to be a summarized version that finds the best balance between details and metrics vs too much overloading of details and information overload. It should be "snapshot" style type to quickly summarize and provide metrics on the AI Team for the entirety of the task workflow
- We also need to ensure the AI Specialist needs to also adhere to the optimal tool use practices too that was researched, so we may need to have TECH-LEAD-ORCHESTRATOR pass along details about optimal tool use practices to each specialist
- Once ALL code changes are fully implemented, code review, and tested by the AI team, the TECH-LEAD-ORCHESTRATOR  needs to delegate & coordinate AI Specialist(s) to follow procedure to fully close out a task by updating all project docs [ai_team_task_history.md, README.md, CHANGELOG.md, CLAUDE.md] AND performing a git commit AND push as completley atomic together with all code changes and doc updates and be unattendded by the user without needing confirmation for the git commit & push

3. Enforce Mandatory rule and operating procedure that the entire new task(s) needs to be fully implemented, tested, git committed, and git push ALL unattended by the user to be completely autonomous. 

### Current Situation
_[Describe the current state of the system/feature/issue]_

### Desired Outcome
_[Describe what the end result should look like]_


So the end goal deliverable of these new operating procedure updates is:
1. User fills in details of the next task in newly renamed file docs/new_task_details.md
2. User invokes "/new_task" command, with details located in .claude/commands/new_task.md
3. TECH-LEAD-ORCHESTRATOR follows the /new_task command directions
4. TECH-LEAD-ORCHESTRATOR will act as the delegator, coordinator, and orchestrater to trigger and oversee ALL implementation tasks details until completion end to end
5. All tasks in new_task_details.md will be fully scoped, planned out, researched, implemented, tested, code reviewed, docs fully updated, and finally fully atomic commit & pushed to repo completley autonomous without needing any user input to approve and/or confirm any commands, whether build, compile, bash, or any other commands


### Acceptance Criteria
1. _[Specific, measurable criteria for task completion]_
2. _[Additional criteria as needed]_
3. _[Include performance, UX, and technical requirements]_


- The user basically justs wants a fully streamlined autonomous workflow where after user invokes /new_task, User can step away and come back within 1-2 hours and the task is fully completed, committed, and pushed as a single atomic check in.

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