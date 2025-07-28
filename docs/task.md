[v4.2.0.0] [feat] Add New User Input Ticker & Dedicated NVDA Pages 

###
- USE AS MANY AGENT(S) & Tool Calls as needed
- USE SEQUENTIAL THINKING TOOL ON AN AS NEEDED BASIS, especially if there are complex\multiple task(s)
- USE CONTEXT7 TOOL ON AN AS NEEDED BASIS to ensure we are working with the most up to date robust practices for our App's Stack
- Add whatever console log\debug\warn if needed for future debug, avoiding console logging for UI\Render updates to avoid potential infinite loops 

###
[Symptoms_or_Change_Request]:
- Let's implement 2x new Pages: Main(NEW), and NVDA using the verified blueprint architecture from the SPY tab
- Enforce complete isolation from each tab\page to ensure issues are completely isolated from each tab
- Add console messages for easier debug, and we may have to rework some console messages to be more ticker agnostic in order to reduce haveing to write separate console messages for each ticker.  There should be a common console message format that any ticker and any of the pages can use, passing in the proper ticker, page, and data context to match the corresponding ticker\page

1. Main (NEW): This tab is dedicated and focused on any user input ticker
2. NVDA: This tab is dedicated and focused on JUST 'NVDA' similiar to our dedicated SPY tab

###
Actions & Agents to be run only AFTER ALL coding tasks are complete:
- Run code-review agent only after ALL coding tasks are complete
- If code-review agent finds any issues to fix, then fix them automatically, and re-run the code-review agent and fix cycle again until all issues are resolved
- If code-review agent PASSED, run the task close agent with "claude /init" command, and update CLAUDE.MD as needed in case task close agent or "claude /init" command fails. 
###

[Log(s)]:

