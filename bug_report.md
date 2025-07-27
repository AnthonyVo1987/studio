[v4.1.7.0] [SPY UI] Consolidated AI Chat Interface

- USE SEQUENTIAL THINKING TOOL
- USE CONTEXT7 to ensure we are working with the most up to date robust practices and Google GenKit AI API updates
- Refer to Main Page tab to serve as just a reference point if needed

###
- Focus on the ROOT CAUSE of the symptoms, and do not have tunnel vision and incorrectly focus on the symptoms itself which may not be the root cause
- Failure analysis report and scope potential fix(es)
- Wait for user approval of your Root Cause Report and Scope of Fixes before proceding with any code changes

###
[Detailed Symptom(s) / Change Request(s)]:
- Now let's add & integrate the On Demand Buttons & Output Data Display for AI Key Takeways & AI Options Analysis
- Refer to Main Page tab as needed to get an idea of the implementation so that our implementation is from the ground
- Enforce DETERMINISTIC implementation useEffect/dependency array/UI/Render that the Main Page may have implemented, since we are re-architecting from the gro
- Avoid "React anti-pattern" and "complex\convoluted" und up
- So we need the 2x On demand buttons that can ONLY be pressed if there was a stock data analysis
- Need to populate the raw data from the button actions and then also output to corresponding Cards

- AI Key Takeaways Card: Hard code initial Card display to ALWAYS have the Metrics Labels, which will then be populated later with actual analysis from JSON data: Price Action, Trend, Volatility, Momentum, Patterns. After the AI Key Takeaways button action completes, populate the card. 

- AI Analyzed Options Chain: Hard code initial Card display to ALWAYS have the Metrics Labels, which will then be populated later with actual analysis from JSON data: Call Walls, Put Walls. After the AI Analyzed Options Chain button action completes, populate the card. 

- Make sure we are wiring the correct AI Prompts to the correct button action, and we are passing the proper JSON input data payload for analysis. Refer to Main Page for more context. AI Key Takeways only takes a subset of all the raw data, and the AI Options Chain Analysis also takes a specific sub set, such as the full options chain data etc

- To reiterate, this is a ground up implementation so do NOT mirror the Main Page code completly since Main page has inherit archtectural flaws we are trying to avoid for "React anti-pattern" and "complex\convoluted" useEffect/dependency array/UI/Render and focusing on DETERMINISTIC.  So the Main page code serves as a reference point on how that page implemented it, and we will improve upon it with best practices.

###
[Log(s)]: