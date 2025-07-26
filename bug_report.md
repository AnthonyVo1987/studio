[v4.0.0.2] [BUG REPORT] App init: Cannot read properties of undefined (reading 'isFetchingData')
###
- USE SEQUENTIAL THINKING TOOL
- Focus on the ROOT CAUSE of the symptoms, and do not have tunnel vision and incorrectly focus on the symptoms itself which may not be the root cause
- Failure analysis report and scope potential fix(es)
- Wait for user approval of your Root Cause Report and Scope of Fixes before proceding with any code changes

###
[Detailed Symptom(s) / Change Request(s)]:
- App immediately crashes
- TypeError: Cannot read properties of undefined (reading 'isFetchingData')

###
[Log(s)]:

2025-07-26T02:15:52Z [web] [AppConfigLoader:getAppConfig] CACHE_HIT: Returning cached application configuration. Version: v4.0.0.1
2025-07-26T02:15:52Z [web] Error:  ⨯ TypeError: Cannot read properties of undefined (reading 'isFetchingData')
2025-07-26T02:15:52Z [web]     at KeyMetricsDisplay (src/components/key-metrics-display.tsx:85:34)
2025-07-26T02:15:52Z [web]   83 |   // Derive values directly from UI snapshot - no state management needed
2025-07-26T02:15:52Z [web]   84 |   const stockSnapshot = currentSnapshot.stockSnapshot;
2025-07-26T02:15:52Z [web] > 85 |   const isLoading = loadingStates.isFetchingData || !stockSnapshot.isDataReady;
2025-07-26T02:15:52Z [web]      |                                  ^
2025-07-26T02:15:52Z [web]   86 |   
2025-07-26T02:15:52Z [web]   87 |   // Calculate sentiment for day's change
2025-07-26T02:15:52Z [web]   88 |   const dayChangeSentiment: 'bullish' | 'bearish' | 'neutral' =  {
2025-07-26T02:15:52Z [web]   digest: '3455404650'
2025-07-26T02:15:52Z [web] }
2025-07-26T02:15:52Z [web] 
2025-07-26T02:15:52Z [web]  GET /?monospaceUid=829753 500 in 770ms
