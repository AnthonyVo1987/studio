# Task Template - New Development Task

## Version Information
**Version**: [v4.4.3.5]
**Task Type**: [BUG] 
---

## Abstract
**Brief Summary**: 
**Affected Systems**: []

**Priority Level**: _[CRITICAL]_

---

## DELEGATION INSTRUCTIONS FOR TECH-LEAD-ORCHESTRATOR

### ⚠️ CRITICAL: TECH-LEAD-ORCHESTRATOR ROLE BOUNDARIES

**YOU ARE A COORDINATOR ONLY - DO NOT PERFORM HANDS-ON WORK**

#### Your Responsibilities (COORDINATOR ONLY):
- ✅ **Analyze** the task requirements and break down into sub-tasks
- ✅ **Delegate** specific work to appropriate specialists
- ✅ **Coordinate** between specialists when dependencies exist
- ✅ **Ensure that you actually trigger the delegation and coordination with other Specialist, instead of incorrectly stopping after coming up with a delegation and coordination plan
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
**ORCHESTRATOR PLEDGE**: I commit to ensure that I actually trigger the delegation and coordination with other Specialist, instead of incorrectly stopping after coming up with a delegation and coordination plan for executing complete autonomous task completion from code review PASS to final git commit without requiring manual user intervention. I understand that asking the user to manually request documentation updates or git commits after a passing code review constitutes a role boundary violation.

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
Refer to CLAUDE.md for Specialist Team Assignments

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

## Enhanced AI Team Capabilities (v4.4.2.10)

### Autonomous Bash Command Operation
The AI development team operates with full command automation:
- **Zero Manual Approvals**: All standard commands pre-approved through 140+ command patterns
- **Appropriate Timeouts**: 120s standard, 300s builds, 30s critical operations
- **Universal Coverage**: Comprehensive fallback patterns ensure complete automation
- **Smooth Workflows**: Uninterrupted development operations for all standard tasks

**Command Categories Covered:**
- **Development**: npm, next, tsx, build processes (120-300s timeouts)
- **Version Control**: git operations, commits, pushes (120s timeout)
- **Process Management**: ps, kill, lsof, pgrep (30-120s optimized)
- **File Operations**: ls, cat, find, grep, mkdir (120s timeout)
- **Environment**: export, env, printenv (120s timeout)
- **TypeScript**: tsc, type checking (120s timeout) - NOTE: ESLint not properly configured
- **AI/Genkit**: genkit flows, AI operations (120-180s timeout)

When filling out task details, note that AI specialists can now execute all standard development, build, test, and deployment commands autonomously.

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

- I decided to pivot and abandon the current plan and changes and rolled back the code
- I have switched to a new branch for the new direction
- Instead of a staging dupe NVDA page, I will instead just create seprate development branches and then stage and test out changes on the dedicated Pages. Because we will be on an isolated development branch, this also acheives the goal perserving business logic by leaving the new changes only on a dev branch
##

* AI Team: MANDATORY CONTEXT7 & SEQUENTIAL THINKING TOOL USE FOR EVERY SINGLE DOCUMENT TO BE REVIEWED

* CRITICAL MANDATE for AI Team: TECH-LEAD-ORCHESTRATOR IS STRICTLY PROHIBITED FROM PERFORMING ANY OF THE ACTUAL WORK BECAUSE THIS IS A VIOLATION. TECH-LEAD-ORCHESTRATOR IS REQUIRED TO DELEGATE & COORDINATE THE AI TEAM.

* For example, TECH-LEAD-ORCHESTRATOR IS STRICTLY PROHIBITED FROM READING ANY DOCS, CODE, INVESTIGATING CODE, REVIEWING CODE, UPDATING\FIXING DOCS, PERFORMING GIT COMMIT & PUSH OPERATIONS ETC

- AI Team: MUST USE MANDATORY CONTEXT7 & SEQUENTIAL THINKING TOOL USE FOR EVERY SINGLE DOCUMENT to ensure best practices and full analysis
##
AI Team: Peform comphrensive updated research, scoping, and recommend with details below:

- AI Team: will reject & remove Hybrid & Server-Side as options after I reviewed the complexity and we will not move forward with these options. Remove all docs and references to these

- AI Team: will reject & remove a staging page prd to test out the macro options, so remove all docs and references to these

- Command Pattern & XState are the preferred options to implement the macro overhaul

- AI Team: MUST USE MANDATORY CONTEXT7 & SEQUENTIAL THINKING TOOL USE FOR EVERY SINGLE DOCUMENT to ensure best practices and full analysis to perform Add on a new potential option of using a Hybrid  Command Pattern & XState together, for a total of 3x options now after removing the rejected proposals

- AI Team: MUST USE MANDATORY CONTEXT7 & SEQUENTIAL THINKING TOOL USE FOR EVERY SINGLE DOCUMENT to ensure best practices and full analysis to perform some more research and re-scoping for all of these options to re-generate the report for the most recommended option(s).  Here are some planned future features that will be worked on at a later point in time, so the analysis for the best options needs to take these new feaures into account for feature product integration.

- So basically, the new Macro Overaul architecture needs to be modular and easily expandable to add more actions to the app, and even modify the sequence of events for certain actions

1. Adding more Broker API Get Data Calls
2. Adding more AI analysis
3. Adding more AI Chat Prompts
4. Adding an Agentic AI to handle all and\or most AI Analysis & AI Chat
5. Overhauling AI Chat to be completly orchestrated by an Agentic AI to dynamically route user prompts to the correct place
6. Multiple User Input ticker pages
7. Multiple Dedicated Ticker Pages
8. etc



##




###


* We recently updated the docs for our "Macro Automation Re-Architecture" Project

* AI Team: MANDATORY CONTEXT7 & SEQUENTIAL THINKING TOOL USE FOR EVERY SINGLE DOCUMENT TO BE REVIEWED

* CRITICAL MANDATE for AI Team: TECH-LEAD-ORCHESTRATOR IS STRICTLY PROHIBITED FROM PERFORMING ANY OF THE ACTUAL WORK BECAUSE THIS IS A VIOLATION. TECH-LEAD-ORCHESTRATOR IS REQUIRED TO DELEGATE & COORDINATE THE AI TEAM. For example, TECH-LEAD-ORCHESTRATOR IS STRICTLY PROHIBITED FROM READING ANY DOCS, CODE, INVESTIGATING CODE, REVIEWING CODE, UPDATING\FIXING DOCS, PERFORMING GIT COMMIT & PUSH OPERATIONS ETC


- AI Team: MUST USE MANDATORY CONTEXT7 & SEQUENTIAL THINKING TOOL USE FOR EVERY SINGLE DOCUMENT to ensure best practices and full analysis of the complex PRDs docs to Thoroughly review & analayze all 4x Macro Re-Architecture PRDs and RANK them in terms of recommended and most optimal suggestions for which path forward

- AI Team: Criteria for "recommended and most optimal suggestions for which path forward" needs to strike a holistic balance by scoring these individual metrics in order to come up with a score for each option:
- Implemention Complexity
- Integration Complexity
- Debugging Complexity
- Reliability
- Accuracy
- Maintainability
- Modularity


PRDs to be scored and analyzed:
1. option-2-xstate-prd.md
2. option-3-command-pattern-prd.md
3. option-4-server-side-prd.md
4. option-hybrid-command-server-prd.md

- Generate a new .md doc in macro-re-architecture folder with the fully detailed AI Team report and analysis and summary









Have the AI Team perform a comprhensive Deep dive architectural & code review & scope out mode code optimizations\re-architecting for the macro automation implementation code with all of the following details below:
##
Background and Context:
- Now that we have stabilized our macro automation code to make it robust, let’s go back and perform a full code audit and deep dive architectural review and code review of our macro implementation

- There was a lot of unexpected complexity and  errors that took more efforts and iterations, then is usually required so we would like this architectural review to also serve as a postmortem of this entire adventure, fiasco and disaster from our initial limitation of the macro automation code of all our Debugging adventures with failed debug and successful debugs and all the lessons  learned, corrective actions ,bad practices, and good practices to be adhered to next time to serve as our guide in the future

- So to provide more context and background, when I first requested you to implement the macro automation from a high-level I thought this would be pretty trivial and not complex because if I understood the core architecture of app correctly all the macro automation needs to do is basically just be a wrapper and or either a Function pointer where the macro instead of reinventing the wheel or having some convoluted state machine dependency , all the macro does is this to manually call the actual user action buttons basically pretending and mimicking the macro actions an actual user or it manually calls.

- The normal user action flow would have some sort of delay or handshaking or signal system to know that an action completed and then if it is, it moves onto the next step That just calls the user action. And since my initial idea, I have my mind of the implantation means we just piggyback and leverage and mirror the existing user actions that means he already existing code already has the proper context and knowing which data to pass through and when. So my initial assessment is that The architecture is pretty simple since we already have working, robust manual user actions, my initial understanding is that the macro just manually calls, user actions in a specific order with some realistic, real world delay or a handshaking signal system that is completed before moving onto the next, 

- but it seems like the initial AI Team implementation had a very convoluted complex, dependency, array, and state machine and execution, IDs and basically spaghetti code, etc. even recent fixes had to make fixes in the macro path and a macro had to properly detect the expiration matches the analysis versus usual selection, which to me completely reinvent the wheel because why does the macro automation code need to detect the proper dependencies and expiration dates if they already existing user button actions properly sync up the dates and the rest of the data flow so I’m pretty confused there

- 

##
* AI Team is MANDATED to use both SEQUENTIAL THINKING & CONTEXT7 Tools for all of these tasks!!!

So as part of your architectural review, there are two main focuses, with details below for the AI Team to perform:

1. AI Team: Is my initial scoping of the feature, thinking the macro automation would be simple, is it misguided and or  inaccurate ? is the architecture of our app actually prevented the ability to make a straightforward, simple non-complex macro automation ? It was a super simple macro automation code just not possible with how our current app works?

2. AI Team: the second focus of our architectural review is deep dive analysis and criticisms and optimizations since we had so many issues is it possible to completely re-architect refactor and basically redesigned the entire macro system knowing all the issues we hit before and the Debugging and the wrong premises. AI Team may need to go through history of project Docs and git commit change log history and diffs for the review, especially "/docs/macro-re-architecture/macro-automation-debugging-guide.md", Claude.md, Readme.md, Changelog.md, /docs/macro-re-architecture/v4.4.3.5_TIMEOUT_FIX_IMPLEMENTATION_REPORT.md etc, Maybe we can just re-architect this from the ground up picking all the  notes from our initial  complex implementation, that gave us so many headaches. Is there a better way to do this? so provide details on what is required and needed if we wanted to re-architect the entire macro automation. Then I will review it your scope and see if I want to implement it or not. You may optionally provide multiple different options too so that I can try and choose the most optmial options for the re-architecture. Please also rank and recommend which option(s) we should move forward with in the future for the macro automation re-architecture

3. AI Team : Provide your fully detailed findings and analysis of the deep dive architectural review and re-architecture scoping in a brand new generated .md document and save it in the docs folder

4. AI Team should pause after Task 3 so user can fully review the new documents and then proceed from there what the next task will be.  There are no requested code changes and /or bug fixes at this time yet

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

See "/docs/web_console_log.md" 

###








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

###