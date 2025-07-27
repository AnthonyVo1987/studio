[v4.1.8.0] [SPY UI] Console Logs for Debug

- USE SEQUENTIAL THINKING TOOL for initial review and analysis
- USE CONTEXT7 to ensure we are working with the most up to date robust practices for our App's Stack
- For implementation, USE SEQUENTIAL THINKING TOOL & CONTEXT7 on an as needed basis for any tasks
- Refer to Main Page tab to serve as just a reference point if needed for our re-architcture

###
- Focus on the ROOT CAUSE of the symptoms, and do not have tunnel vision and incorrectly focus on the symptoms itself which may not be the root cause
- Failure analysis report and scope potential fix(es)
- Wait for user approval of your Root Cause Report and Scope of Fixes before proceding with any code changes

###
[Detailed Symptom(s) / Change Request(s)]:
- Add Console log output messages so that we can now debug the SPY page
- Do NOT add console log messages for UI/Render events since that was a previous pain point that could cause infinite console log update issues, where a console log needs a UI/Render update, which triggers another console log etc
- Be very careful NOT to add console logs in other pain points and follow best practices, such as avoiding logs inside useEffects, dependecy arrays etc
- Add as many console logs as you need for further debugging
- At least add Enter/Exit type logs for every API call, every User Action, and major critical  events/flows, excluding UI/Render of course
- For Options Chain, since the output is very large, you can use a reduced message for the Options CHain data Enter/Exit since we do not need granularity for every single Strike price etc, which would flood our logs
- May have to add console logs for major state, flags, variable transitions etc
- Be mindful of potential infinite loops
###
[Log(s)]:
