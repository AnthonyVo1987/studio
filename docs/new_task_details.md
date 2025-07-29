# Task Template - New Development Task

## Version Information
**Version**: [v4.4.2.0]
**Task Type**: [FEATURE]
---

## Abstract
**Brief Summary**: [New Architecture Phase 2] Develop new tab blueprint/template system scaffolding

**Affected Systems**: _[NEW Blueprint]_

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

[New Architecture Phase 2] Develop new tab blueprint/template system scaffolding

### Current Situation
	⁃	This phase is focused on developing and implementing the initial scaffolding/blueprint/template system in order to make adding brand new dedicated stock, pages a trivial task
 
	⁃	For example, it should be trivial to add 5x additional dedicated tabs utilizing the newly design and architecture blueprint system
 
	⁃	So perform some research using context7, especially to find out the best practices and trying to implement a very modular blueprint system so that we can add additional app tabs very easily and streamline and make it very trivial
 
	⁃	We will just work on just the blueprint system itself here for this phase and there will be follow on phases where we will actually use the new blueprint system in order to generate a brand new dedicated tap to test
 
	⁃	Since the current NVDA and spy  isolated tabs are perfectly working you may review and leverage and understand the concepts and architecture that made it work and then your blueprint system needs to be modular plug and play where there should be very minimal changes to configure and add a new page so it’s helpful to see what were the main differences between the current dedicated spy and NVDA tabs and then what is duplicated code to come up with the most optimized blueprint system
 
	⁃	There should be added extra comments and or instructions throughout the code based and documentation to instruct Claude AI, how to add future dedicated pages utilizing the blueprint system
 
	⁃	In the perfect world, the blueprint system would allow us to add new dedicated ticker pages with very minimal code changes needed such as maybe just updating the main page for the additional tab and providing the ticker for the new dedicated page. In the perfect world, we will need very minimal parameters or config settings past him just a duplicate a page so find the best balance to create a truly modular extendable flexible easy to implement design for the blueprint architecture 
 
	⁃	Eventually, the current isolated dedicated NVDA and spy pages will be retired and re factored, but that will come at a later phase once we have completed robust testing, so we’ll still keep those dedicated NVDA and spy pages to serve as a reference point and baseline to see what worked just in case we run into issues with our new blueprint system we could always refer back to the current baseline working Model to see what needs to be fixed
 


### Desired Outcome
_[Describe what the end result should look like]_
	⁃	The end goal deliverable for this phase is that we have all the initial code, blueprint architecture, scaffolding, and documentation updated so that the next phase we can add a dedicated ticker page using the new blueprint system and start testing it so that it will have 100% feature parity with a current dedicated and Nvidia and spy pages

  - Even though new ticker tabs will try and share and re-use the new blueprint components, each indivdual dedicated ticker tab neesd to operate in it's own "context space" where issues with one page, does NOT affect other pages. So it's a hybrid isolation architecture where the blueprint allows easy re-use of new tab components, BUT each new tab is separate from other tabs, even if they are all using the same underlying modular blueprint architecture


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