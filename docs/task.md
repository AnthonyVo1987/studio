[v4.1.17.0] [BUG REPORT] SPY: Tab switch fix, debug enhancements & AI Chat Improvements 

###
- USE AS MANY AGENT(S) & Tool Calls as needed
- USE SEQUENTIAL THINKING TOOL as needed if there are multiple task requests
- USE CONTEXT7 TOOL as needed if there are multiple task requests
- Add whatever console log\debug\warn if needed for future debug, avoiding console logging for UI\Render updates to avoid potential infinite loops 

###
[Symptoms_or_Change_Request]:
- When switching between tabs, SPY tab gets incorrectly reset\wiped out.  It should be enforced that switching and cycling through different tabs\pages is NOT a trigger for a data\UI\Render wipe and/or reset. Pages need to be persistent across simple switching across tabs\pages.
- Add 2x new SPY Raw Data Copy\Export JSON buttons that will have truncated Options Chain Raw Data, that will NOT have the full Options Chain Raw Data for debugging issues not related to Options Chain to reduce tokens needed.  The Current 2x Copy\Export All buttons remain unchanged to capture ALL full data in case we need the full options chain data for debug snapshot
- For ALL AI Chat Prompts, even user input, enforce a temperature of ".2" to have responses be more straight to the point
- For ALL Web Search AI Prompts, which includes button prompts, and user input toggled to web search, update the web search prompt schema\input\architecture to also include and state the current date at the very top of the prompt, which can be extracted from the market status data retrieval. By always including the current date for web search prompts, the AI will ALWWAYS be grounded by knowing the current real world date, and then the AI web search prompts should always include the date so that AI web search query will always search for the requested prompt info WITH a comment "... as of mm/dd/yyy", so that will help ensure web results are the most up to date and that the AI does not search and use outdated and stale info
###

[Log(s)]:

