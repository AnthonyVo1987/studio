[v4.2.1.0] [BUG REPORT] AI Key Takeways Miswired Input 

###

###
[Symptoms_or_Change_Request]:
- Pressing AI Key Takeways gives error that there was invalid inputs for AI to analyze across all 3x pages: User Input, SPY, & NVDA
- I suspect it just be a a bad wiring issuing where the latest code changes is not properly passing in the correponding input for this AI Action to analyze
- Data seems valid and exists, so I highly suspect wiring issue, but please confirm the root cause and fix the root cause and NOT just symptoms


###
Actions & Agents to be run only AFTER ALL coding tasks are complete:
- Run code-review agent only after ALL coding tasks are complete
- If code-review agent finds any issues to fix, then fix them automatically, and re-run the code-review agent and fix cycle again until all issues are resolved
###

[Log(s)]:

[0] [ServerAction:fetchStockDataAction:Ticker:SPY] Starting stock data fetch... {
[1]   ticker: 'SPY',
[2]   expirationDate: '2025-07-29',
[3]   optionType: 'both',
[4]   strikeCount: 20
[5] }
[6] [ServerAction:fetchStockDataAction:Ticker:SPY] Calling polygon adapter...
[7] [ServerAction:fetchStockDataAction:Ticker:SPY] Adapter response received
[8] [ServerAction:fetchStockDataAction:Ticker:SPY] Data processing complete: {
[9]   hasMarketStatus: true,
[10]   hasStockSnapshot: true,
[11]   hasTechnicalIndicators: true,
[12]   hasOptionsChain: true,
[13]   optionsChainSize: 0
[14] }
[15] [ServerAction:fetchStockDataAction:Ticker:SPY] SUCCESS - Stock data fetch completed
[16]  POST /?monospaceUid=735050 200 in 4668ms
[17] [ServerAction:analyzeTaAction:Ticker:SPY] Starting technical analysis... { hasStockSnapshot: true, dataSize: 572 }
[18] [ServerAction:analyzeTaAction:Ticker:SPY] Parsing stock snapshot data...
[19] [ServerAction:analyzeTaAction:Ticker:SPY] Stock snapshot parsed successfully
[20] [ServerAction:analyzeTaAction:Ticker:SPY] Validating previous day data...
[21] [ServerAction:analyzeTaAction:Ticker:SPY] Prepared flow input: {
[22]   previousDayHigh: 637.58,
[23]   previousDayLow: 634.84,
[24]   previousDayClose: 637.1
[25] }
[26] [ServerAction:analyzeTaAction:Ticker:SPY] Calling AI flow for technical analysis...
[27] [ServerAction:analyzeTaAction:Ticker:SPY] AI flow completed successfully
[28] [ServerAction:analyzeTaAction:Ticker:SPY] SUCCESS - Technical analysis completed
[29]  POST /?monospaceUid=735050 200 in 266ms
[30] [ServerAction:performAiAnalysisAction:Ticker:SPY] Starting AI key takeaways analysis... {
[31]   ticker: 'SPY',
[32]   hasStockSnapshot: true,
[33]   hasStandardTas: false,
[34]   hasAiAnalyzedTa: true,
[35]   hasMarketStatus: true
[36] }
[37] Error: [ServerAction:performAiAnalysisAction:Ticker:SPY] Validation error: One or more required data inputs for AI Key Takeaways analysis are missing or empty.
[38] 
[39]  POST /?monospaceUid=735050 200 in 139ms
[40] [ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] Starting AI options analysis... { ticker: 'SPY', hasOptionsChain: true, hasStockSnapshot: true }
[41] [ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] Validating input data...
[42] [ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] Calling AI flow for options analysis...
[43] [ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] AI flow completed successfully
[44] [ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] SUCCESS - AI options analysis completed
[45]  POST /?monospaceUid=735050 200 in 7129ms
[46] [ServerAction:spyConsolidatedChatAction:stock-trader-takeaways] Starting unified chat request
[47] [ServerAction:spyConsolidatedChatAction:stock-trader-takeaways] Extracted current date for grounding: 07/28/2025
[48] [getAppDataPrompt] Loading definition for promptName: stock-trader-takeaways, file: stock-trader-takeaways
[49] [getAppDataPrompt] Successfully cached prompt for: stock-trader-takeaways
[50] [ServerAction:spyConsolidatedChatAction:stock-trader-takeaways] Generating content with webSearch: false
[51] [ServerAction:spyConsolidatedChatAction:stock-trader-takeaways] Successfully generated response
[52]  POST /?monospaceUid=735050 200 in 3811ms
[53] [ServerAction:spyConsolidatedChatAction:options-trader-takeaways] Starting unified chat request
[54] [ServerAction:spyConsolidatedChatAction:options-trader-takeaways] Extracted current date for grounding: 07/28/2025
[55] [getAppDataPrompt] Loading definition for promptName: options-trader-takeaways, file: options-trader-takeaways
[56] [getAppDataPrompt] Successfully cached prompt for: options-trader-takeaways
[57] [ServerAction:spyConsolidatedChatAction:options-trader-takeaways] Generating content with webSearch: false
[58] [ServerAction:spyConsolidatedChatAction:options-trader-takeaways] Successfully generated response
[59]  POST /?monospaceUid=735050 200 in 4263ms
[60] [ServerAction:spyConsolidatedChatAction:holistic-takeaways] Starting unified chat request
[61] [ServerAction:spyConsolidatedChatAction:holistic-takeaways] Extracted current date for grounding: 07/28/2025
[62] [getAppDataPrompt] Loading definition for promptName: holistic-takeaways, file: holistic-takeaways
[63] [getAppDataPrompt] Successfully cached prompt for: holistic-takeaways
[64] [ServerAction:spyConsolidatedChatAction:holistic-takeaways] Generating content with webSearch: false
[65] [ServerAction:spyConsolidatedChatAction:holistic-takeaways] Successfully generated response
[66]  POST /?monospaceUid=735050 200 in 5858ms
[67] [ServerAction:spyConsolidatedChatAction:support-resistance-web-search] Starting unified chat request
[68] [ServerAction:spyConsolidatedChatAction:support-resistance-web-search] Extracted current date for grounding: 07/28/2025
[69] [ServerAction:spyConsolidatedChatAction:support-resistance-web-search] Generating content with webSearch: true
[70] [ServerAction:spyConsolidatedChatAction:support-resistance-web-search] Successfully generated response
[71]  POST /?monospaceUid=735050 200 in 8773ms
[72] [ServerAction:spyConsolidatedChatAction:technical-analysis-web-search] Starting unified chat request
[73] [ServerAction:spyConsolidatedChatAction:technical-analysis-web-search] Extracted current date for grounding: 07/28/2025
[74] [ServerAction:spyConsolidatedChatAction:technical-analysis-web-search] Generating content with webSearch: true
[75] [ServerAction:spyConsolidatedChatAction:technical-analysis-web-search] Successfully generated response
[76]  POST /?monospaceUid=735050 200 in 9360ms
[77] [ServerAction:spyConsolidatedChatAction:options-flow-web-search] Starting unified chat request
[78] [ServerAction:spyConsolidatedChatAction:options-flow-web-search] Extracted current date for grounding: 07/28/2025
[79] [ServerAction:spyConsolidatedChatAction:options-flow-web-search] Generating content with webSearch: true
[80] [ServerAction:spyConsolidatedChatAction:options-flow-web-search] Successfully generated response
[81]  POST /?monospaceUid=735050 200 in 9655ms
[82]  POST /?monospaceUid=735050 200 in 1236ms
[83] [ServerAction:fetchStockDataAction:Ticker:NVDA] Starting stock data fetch... {
[84]   ticker: 'NVDA',
[85]   expirationDate: '2025-08-01',
[86]   optionType: 'both',
[87]   strikeCount: 20
[88] }
[89] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling polygon adapter...
[90] [ServerAction:fetchStockDataAction:Ticker:NVDA] Adapter response received
[91] [ServerAction:fetchStockDataAction:Ticker:NVDA] Data processing complete: {
[92]   hasMarketStatus: true,
[93]   hasStockSnapshot: true,
[94]   hasTechnicalIndicators: true,
[95]   hasOptionsChain: true,
[96]   optionsChainSize: 0
[97] }
[98] [ServerAction:fetchStockDataAction:Ticker:NVDA] SUCCESS - Stock data fetch completed
[99]  POST /?monospaceUid=735050 200 in 4600ms
[100] [ServerAction:analyzeTaAction:Ticker:NVDA] Starting technical analysis... { hasStockSnapshot: true, dataSize: 571 }
[101] [ServerAction:analyzeTaAction:Ticker:NVDA] Parsing stock snapshot data...
[102] [ServerAction:analyzeTaAction:Ticker:NVDA] Stock snapshot parsed successfully
[103] [ServerAction:analyzeTaAction:Ticker:NVDA] Validating previous day data...
[104] [ServerAction:analyzeTaAction:Ticker:NVDA] Prepared flow input: {
[105]   previousDayHigh: 174.72,
[106]   previousDayLow: 172.96,
[107]   previousDayClose: 173.5
[108] }
[109] [ServerAction:analyzeTaAction:Ticker:NVDA] Calling AI flow for technical analysis...
[110] [ServerAction:analyzeTaAction:Ticker:NVDA] AI flow completed successfully
[111] [ServerAction:analyzeTaAction:Ticker:NVDA] SUCCESS - Technical analysis completed
[112]  POST /?monospaceUid=735050 200 in 129ms
[113] [ServerAction:performAiAnalysisAction:Ticker:NVDA] Starting AI key takeaways analysis... {
[114]   ticker: 'NVDA',
[115]   hasStockSnapshot: true,
[116]   hasStandardTas: false,
[117]   hasAiAnalyzedTa: true,
[118]   hasMarketStatus: true
[119] }
[120] Error: [ServerAction:performAiAnalysisAction:Ticker:NVDA] Validation error: One or more required data inputs for AI Key Takeaways analysis are missing or empty.
[121] 
[122]  POST /?monospaceUid=735050 200 in 123ms
[123] [ServerAction:performAiOptionsAnalysisAction:Ticker:NVDA] Starting AI options analysis... { ticker: 'NVDA', hasOptionsChain: true, hasStockSnapshot: true }
[124] [ServerAction:performAiOptionsAnalysisAction:Ticker:NVDA] Validating input data...
[125] [ServerAction:performAiOptionsAnalysisAction:Ticker:NVDA] Calling AI flow for options analysis...
[126] [ServerAction:performAiOptionsAnalysisAction:Ticker:NVDA] AI flow completed successfully
[127] [ServerAction:performAiOptionsAnalysisAction:Ticker:NVDA] SUCCESS - AI options analysis completed
[128]  POST /?monospaceUid=735050 200 in 7206ms
[129] [ServerAction:nvdaConsolidatedChatAction:stock-trader-takeaways] Starting unified chat request
[130] [ServerAction:nvdaConsolidatedChatAction:stock-trader-takeaways] Extracted current date for grounding: 07/28/2025
[131] [getAppDataPrompt] Loading definition for promptName: stock-trader-takeaways, file: stock-trader-takeaways
[132] [getAppDataPrompt] Successfully cached prompt for: stock-trader-takeaways
[133] [ServerAction:nvdaConsolidatedChatAction:stock-trader-takeaways] Generating content with webSearch: false
[134] [ServerAction:nvdaConsolidatedChatAction:stock-trader-takeaways] Successfully generated response
[135]  POST /?monospaceUid=735050 200 in 2891ms
[136] [ServerAction:nvdaConsolidatedChatAction:options-trader-takeaways] Starting unified chat request
[137] [ServerAction:nvdaConsolidatedChatAction:options-trader-takeaways] Extracted current date for grounding: 07/28/2025
[138] [getAppDataPrompt] Loading definition for promptName: options-trader-takeaways, file: options-trader-takeaways
[139] [getAppDataPrompt] Successfully cached prompt for: options-trader-takeaways
[140] [ServerAction:nvdaConsolidatedChatAction:options-trader-takeaways] Generating content with webSearch: false
[141] [ServerAction:nvdaConsolidatedChatAction:options-trader-takeaways] Successfully generated response
[142]  POST /?monospaceUid=735050 200 in 4652ms
[143] [ServerAction:nvdaConsolidatedChatAction:holistic-takeaways] Starting unified chat request
[144] [ServerAction:nvdaConsolidatedChatAction:holistic-takeaways] Extracted current date for grounding: 07/28/2025
[145] [getAppDataPrompt] Loading definition for promptName: holistic-takeaways, file: holistic-takeaways
[146] [getAppDataPrompt] Successfully cached prompt for: holistic-takeaways
[147] [ServerAction:nvdaConsolidatedChatAction:holistic-takeaways] Generating content with webSearch: false
[148] [ServerAction:nvdaConsolidatedChatAction:holistic-takeaways] Successfully generated response
[149]  POST /?monospaceUid=735050 200 in 5466ms
[150] [ServerAction:nvdaConsolidatedChatAction:support-resistance-web-search] Starting unified chat request
[151] [ServerAction:nvdaConsolidatedChatAction:support-resistance-web-search] Extracted current date for grounding: 07/28/2025
[152] [ServerAction:nvdaConsolidatedChatAction:support-resistance-web-search] Generating content with webSearch: true
[153] [ServerAction:nvdaConsolidatedChatAction:support-resistance-web-search] Successfully generated response
[154]  POST /?monospaceUid=735050 200 in 9018ms
[155] [ServerAction:nvdaConsolidatedChatAction:technical-analysis-web-search] Starting unified chat request
[156] [ServerAction:nvdaConsolidatedChatAction:technical-analysis-web-search] Extracted current date for grounding: 07/28/2025
[157] [ServerAction:nvdaConsolidatedChatAction:technical-analysis-web-search] Generating content with webSearch: true
[158] [ServerAction:nvdaConsolidatedChatAction:technical-analysis-web-search] Successfully generated response
[159]  POST /?monospaceUid=735050 200 in 10658ms
[160] [ServerAction:nvdaConsolidatedChatAction:options-flow-web-search] Starting unified chat request
[161] [ServerAction:nvdaConsolidatedChatAction:options-flow-web-search] Extracted current date for grounding: 07/28/2025
[162] [ServerAction:nvdaConsolidatedChatAction:options-flow-web-search] Generating content with webSearch: true
[163] [ServerAction:nvdaConsolidatedChatAction:options-flow-web-search] Successfully generated response
[164]  POST /?monospaceUid=735050 200 in 8866ms
[165]  POST /?monospaceUid=735050 200 in 414ms
[166] [ServerAction:fetchStockDataAction:Ticker:GME] Starting stock data fetch... {
[167]   ticker: 'GME',
[168]   expirationDate: '2025-08-15',
[169]   optionType: 'both',
[170]   strikeCount: 20
[171] }
[172] [ServerAction:fetchStockDataAction:Ticker:GME] Calling polygon adapter...
[173] [ServerAction:fetchStockDataAction:Ticker:GME] Adapter response received
[174] [ServerAction:fetchStockDataAction:Ticker:GME] Data processing complete: {
[175]   hasMarketStatus: true,
[176]   hasStockSnapshot: true,
[177]   hasTechnicalIndicators: true,
[178]   hasOptionsChain: true,
[179]   optionsChainSize: 0
[180] }
[181] [ServerAction:fetchStockDataAction:Ticker:GME] SUCCESS - Stock data fetch completed
[182]  POST /?monospaceUid=735050 200 in 4651ms
[183] [ServerAction:analyzeTaAction:Ticker:GME] Starting technical analysis... { hasStockSnapshot: true, dataSize: 551 }
[184] [ServerAction:analyzeTaAction:Ticker:GME] Parsing stock snapshot data...
[185] [ServerAction:analyzeTaAction:Ticker:GME] Stock snapshot parsed successfully
[186] [ServerAction:analyzeTaAction:Ticker:GME] Validating previous day data...
[187] [ServerAction:analyzeTaAction:Ticker:GME] Prepared flow input: {
[188]   previousDayHigh: 23.6,
[189]   previousDayLow: 23.25,
[190]   previousDayClose: 23.33
[191] }
[192] [ServerAction:analyzeTaAction:Ticker:GME] Calling AI flow for technical analysis...
[193] [ServerAction:analyzeTaAction:Ticker:GME] AI flow completed successfully
[194] [ServerAction:analyzeTaAction:Ticker:GME] SUCCESS - Technical analysis completed
[195]  POST /?monospaceUid=735050 200 in 123ms
[196] [ServerAction:performAiAnalysisAction:Ticker:GME] Starting AI key takeaways analysis... {
[197]   ticker: 'GME',
[198]   hasStockSnapshot: true,
[199]   hasStandardTas: false,
[200]   hasAiAnalyzedTa: true,
[201]   hasMarketStatus: true
[202] }
[203] Error: [ServerAction:performAiAnalysisAction:Ticker:GME] Validation error: One or more required data inputs for AI Key Takeaways analysis are missing or empty.
[204] 
[205]  POST /?monospaceUid=735050 200 in 130ms
[206] [ServerAction:performAiOptionsAnalysisAction:Ticker:GME] Starting AI options analysis... { ticker: 'GME', hasOptionsChain: true, hasStockSnapshot: true }
[207] [ServerAction:performAiOptionsAnalysisAction:Ticker:GME] Validating input data...
[208] [ServerAction:performAiOptionsAnalysisAction:Ticker:GME] Calling AI flow for options analysis...
[209] [ServerAction:performAiOptionsAnalysisAction:Ticker:GME] AI flow completed successfully
[210] [ServerAction:performAiOptionsAnalysisAction:Ticker:GME] SUCCESS - AI options analysis completed
[211]  POST /?monospaceUid=735050 200 in 8649ms
[212] [userTickerConsolidatedChatAction] Starting request processing
[213] [userTickerConsolidatedChatAction] Validated input for ticker: GME, webSearch: false
[214] [userTickerConsolidatedChatAction] Using web search: false
[215] [getAppDataPrompt] Loading definition for promptName: stock-trader-takeaways, file: stock-trader-takeaways
[216] [getAppDataPrompt] Successfully cached prompt for: stock-trader-takeaways
[217] [userTickerConsolidatedChatAction] System prompt preview: You are StockSage, a professional trading analyst specializing in actionable stock trading insights....
[218] [userTickerConsolidatedChatAction] User message preview: **GME Stock Analysis Context (Current Date: 07/28/2025)**
[219] 
[220] **Stock Snapshot Data:**
[221] ```json
[222] {
[223]   "ticker": "GME",
[224]   "day": {
[225]     "o": 23.35,
[226]     "h": 23.56,
[227]     "l": 23.08,
[228]     "c": 23.15,
[229]     "v": 970...
[230] [userTickerConsolidatedChatAction] Generating response with model: gemini-2.0-flash-exp
[231] Error: [userTickerConsolidatedChatAction] Error: Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent: [400 Bad Request] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[0]': Cannot find field.
[232] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[0]': Cannot find field.
[233] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[1]': Cannot find field.
[234] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[1]': Cannot find field.
[235] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[2]': Cannot find field.
[236] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[2]': Cannot find field. [{"@type":"type.googleapis.com/google.rpc.BadRequest","fieldViolations":[{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[2]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[2]': Cannot find field."}]}]
[237]     at async userTickerConsolidatedChatAction (src/actions/user-ticker-consolidated-chat-action.ts:283:19)
[238]   281 |     // Generate response
[239]   282 |     console.log(`[userTickerConsolidatedChatAction] Generating response with model: ${modelConfig.model}`);
[240] > 283 |     const result = await model.generateContent([
[241]       |                   ^
[242]   284 |       { role: 'user', parts: [{ text: systemPrompt }] },
[243]   285 |       { role: 'model', parts: [{ text: 'I understand. I\'m ready to help with your analysis.' }] },
[244]   286 |       { role: 'user', parts: [{ text: userMessage }] } {
[245]   status: 400,
[246]   statusText: 'Bad Request',
[247]   errorDetails: [Array]
[248] }
[249] 
[250]  POST /?monospaceUid=735050 200 in 1755ms
[251] [userTickerConsolidatedChatAction] Starting request processing
[252] [userTickerConsolidatedChatAction] Validated input for ticker: GME, webSearch: false
[253] [userTickerConsolidatedChatAction] Using web search: false
[254] [getAppDataPrompt] Loading definition for promptName: options-trader-takeaways, file: options-trader-takeaways
[255] [getAppDataPrompt] Successfully cached prompt for: options-trader-takeaways
[256] [userTickerConsolidatedChatAction] System prompt preview: You are StockSage, a professional options trading strategist with deep expertise in options flow ana...
[257] [userTickerConsolidatedChatAction] User message preview: **GME Stock Analysis Context (Current Date: 07/28/2025)**
[258] 
[259] **Stock Snapshot Data:**
[260] ```json
[261] {
[262]   "ticker": "GME",
[263]   "day": {
[264]     "o": 23.35,
[265]     "h": 23.56,
[266]     "l": 23.08,
[267]     "c": 23.15,
[268]     "v": 970...
[269] [userTickerConsolidatedChatAction] Generating response with model: gemini-2.0-flash-exp
[270] Error: [userTickerConsolidatedChatAction] Error: Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent: [400 Bad Request] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[0]': Cannot find field.
[271] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[0]': Cannot find field.
[272] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[1]': Cannot find field.
[273] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[1]': Cannot find field.
[274] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[2]': Cannot find field.
[275] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[2]': Cannot find field. [{"@type":"type.googleapis.com/google.rpc.BadRequest","fieldViolations":[{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[2]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[2]': Cannot find field."}]}]
[276]     at async userTickerConsolidatedChatAction (src/actions/user-ticker-consolidated-chat-action.ts:283:19)
[277]   281 |     // Generate response
[278]   282 |     console.log(`[userTickerConsolidatedChatAction] Generating response with model: ${modelConfig.model}`);
[279] > 283 |     const result = await model.generateContent([
[280]       |                   ^
[281]   284 |       { role: 'user', parts: [{ text: systemPrompt }] },
[282]   285 |       { role: 'model', parts: [{ text: 'I understand. I\'m ready to help with your analysis.' }] },
[283]   286 |       { role: 'user', parts: [{ text: userMessage }] } {
[284]   status: 400,
[285]   statusText: 'Bad Request',
[286]   errorDetails: [Array]
[287] }
[288] 
[289]  POST /?monospaceUid=735050 200 in 871ms
[290] [userTickerConsolidatedChatAction] Starting request processing
[291] [userTickerConsolidatedChatAction] Validated input for ticker: GME, webSearch: false
[292] [userTickerConsolidatedChatAction] Using web search: false
[293] [getAppDataPrompt] Loading definition for promptName: holistic-takeaways, file: holistic-takeaways
[294] [getAppDataPrompt] Successfully cached prompt for: holistic-takeaways
[295] [userTickerConsolidatedChatAction] System prompt preview: You are StockSage, a comprehensive market analyst providing holistic investment perspectives.
[296] Your e...
[297] [userTickerConsolidatedChatAction] User message preview: **GME Stock Analysis Context (Current Date: 07/28/2025)**
[298] 
[299] **Stock Snapshot Data:**
[300] ```json
[301] {
[302]   "ticker": "GME",
[303]   "day": {
[304]     "o": 23.35,
[305]     "h": 23.56,
[306]     "l": 23.08,
[307]     "c": 23.15,
[308]     "v": 970...
[309] [userTickerConsolidatedChatAction] Generating response with model: gemini-2.0-flash-exp
[310] Error: [userTickerConsolidatedChatAction] Error: Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent: [400 Bad Request] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[0]': Cannot find field.
[311] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[0]': Cannot find field.
[312] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[1]': Cannot find field.
[313] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[1]': Cannot find field.
[314] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[2]': Cannot find field.
[315] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[2]': Cannot find field. [{"@type":"type.googleapis.com/google.rpc.BadRequest","fieldViolations":[{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[2]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[2]': Cannot find field."}]}]
[316]     at async userTickerConsolidatedChatAction (src/actions/user-ticker-consolidated-chat-action.ts:283:19)
[317]   281 |     // Generate response
[318]   282 |     console.log(`[userTickerConsolidatedChatAction] Generating response with model: ${modelConfig.model}`);
[319] > 283 |     const result = await model.generateContent([
[320]       |                   ^
[321]   284 |       { role: 'user', parts: [{ text: systemPrompt }] },
[322]   285 |       { role: 'model', parts: [{ text: 'I understand. I\'m ready to help with your analysis.' }] },
[323]   286 |       { role: 'user', parts: [{ text: userMessage }] } {
[324]   status: 400,
[325]   statusText: 'Bad Request',
[326]   errorDetails: [Array]
[327] }
[328] 
[329]  POST /?monospaceUid=735050 200 in 921ms
[330] [userTickerConsolidatedChatAction] Starting request processing
[331] [userTickerConsolidatedChatAction] Validated input for ticker: GME, webSearch: true
[332] [userTickerConsolidatedChatAction] Using web search: true
[333] [getWebSearchPrompt] Loading definition for promptName: support-resistance-web-search, file: support-resistance-web-search
[334] Error: Failed to load web search prompt for support-resistance-web-search: Error: Failed to load AI definition 'support-resistance-web-search': Cannot find module '@/ai/definitions/support-resistance-web-search.json'
[335]     at loadDefinition (src/ai/definition-loader.ts:93:10)
[336]     at async getWebSearchPrompt (src/actions/user-ticker-consolidated-chat-action.ts:117:23)
[337]     at async userTickerConsolidatedChatAction (src/actions/user-ticker-consolidated-chat-action.ts:233:8)
[338]   91 |     if (error.message.includes('Cannot find module') || error.code === 'MODULE_NOT_FOUND') {
[339]   92 |     }
[340] > 93 |     throw new Error(`Failed to load AI definition '${definitionName}': ${error.message}`);
[341]      |          ^
[342]   94 |   }
[343]   95 | }
[344]   96 |
[345] 
[346] [getWebSearchPrompt] Using fallback prompt for: support-resistance-web-search
[347] [userTickerConsolidatedChatAction] System prompt preview: You are a helpful AI assistant specializing in stock market analysis. Use web search to find current...
[348] [userTickerConsolidatedChatAction] User message preview: **Analysis Request for GME (Current Date: 07/28/2025)**
[349] 
[350] Please provide support resistance-web-search analysis for GME....
[351] [userTickerConsolidatedChatAction] Generating response with model: gemini-2.0-flash-exp
[352] Error: [userTickerConsolidatedChatAction] Error: Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent: [400 Bad Request] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[0]': Cannot find field.
[353] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[0]': Cannot find field.
[354] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[1]': Cannot find field.
[355] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[1]': Cannot find field.
[356] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[2]': Cannot find field.
[357] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[2]': Cannot find field. [{"@type":"type.googleapis.com/google.rpc.BadRequest","fieldViolations":[{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[2]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[2]': Cannot find field."}]}]
[358]     at async userTickerConsolidatedChatAction (src/actions/user-ticker-consolidated-chat-action.ts:283:19)
[359]   281 |     // Generate response
[360]   282 |     console.log(`[userTickerConsolidatedChatAction] Generating response with model: ${modelConfig.model}`);
[361] > 283 |     const result = await model.generateContent([
[362]       |                   ^
[363]   284 |       { role: 'user', parts: [{ text: systemPrompt }] },
[364]   285 |       { role: 'model', parts: [{ text: 'I understand. I\'m ready to help with your analysis.' }] },
[365]   286 |       { role: 'user', parts: [{ text: userMessage }] } {
[366]   status: 400,
[367]   statusText: 'Bad Request',
[368]   errorDetails: [Array]
[369] }
[370] 
[371]  POST /?monospaceUid=735050 200 in 1448ms
[372] [userTickerConsolidatedChatAction] Starting request processing
[373] [userTickerConsolidatedChatAction] Validated input for ticker: GME, webSearch: true
[374] [userTickerConsolidatedChatAction] Using web search: true
[375] [getWebSearchPrompt] Loading definition for promptName: technical-analysis-web-search, file: technical-analysis-web-search
[376] Error: Failed to load web search prompt for technical-analysis-web-search: Error: Failed to load AI definition 'technical-analysis-web-search': Cannot find module '@/ai/definitions/technical-analysis-web-search.json'
[377]     at loadDefinition (src/ai/definition-loader.ts:93:10)
[378]     at async getWebSearchPrompt (src/actions/user-ticker-consolidated-chat-action.ts:117:23)
[379]     at async userTickerConsolidatedChatAction (src/actions/user-ticker-consolidated-chat-action.ts:233:8)
[380]   91 |     if (error.message.includes('Cannot find module') || error.code === 'MODULE_NOT_FOUND') {
[381]   92 |     }
[382] > 93 |     throw new Error(`Failed to load AI definition '${definitionName}': ${error.message}`);
[383]      |          ^
[384]   94 |   }
[385]   95 | }
[386]   96 |
[387] 
[388] [getWebSearchPrompt] Using fallback prompt for: technical-analysis-web-search
[389] [userTickerConsolidatedChatAction] System prompt preview: You are a helpful AI assistant specializing in stock market analysis. Use web search to find current...
[390] [userTickerConsolidatedChatAction] User message preview: **Analysis Request for GME (Current Date: 07/28/2025)**
[391] 
[392] Please provide technical analysis-web-search analysis for GME....
[393] [userTickerConsolidatedChatAction] Generating response with model: gemini-2.0-flash-exp
[394] Error: [userTickerConsolidatedChatAction] Error: Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent: [400 Bad Request] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[0]': Cannot find field.
[395] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[0]': Cannot find field.
[396] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[1]': Cannot find field.
[397] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[1]': Cannot find field.
[398] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[2]': Cannot find field.
[399] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[2]': Cannot find field. [{"@type":"type.googleapis.com/google.rpc.BadRequest","fieldViolations":[{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[2]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[2]': Cannot find field."}]}]
[400]     at async userTickerConsolidatedChatAction (src/actions/user-ticker-consolidated-chat-action.ts:283:19)
[401]   281 |     // Generate response
[402]   282 |     console.log(`[userTickerConsolidatedChatAction] Generating response with model: ${modelConfig.model}`);
[403] > 283 |     const result = await model.generateContent([
[404]       |                   ^
[405]   284 |       { role: 'user', parts: [{ text: systemPrompt }] },
[406]   285 |       { role: 'model', parts: [{ text: 'I understand. I\'m ready to help with your analysis.' }] },
[407]   286 |       { role: 'user', parts: [{ text: userMessage }] } {
[408]   status: 400,
[409]   statusText: 'Bad Request',
[410]   errorDetails: [Array]
[411] }
[412] 
[413]  POST /?monospaceUid=735050 200 in 1203ms
[414] [userTickerConsolidatedChatAction] Starting request processing
[415] [userTickerConsolidatedChatAction] Validated input for ticker: GME, webSearch: true
[416] [userTickerConsolidatedChatAction] Using web search: true
[417] [getWebSearchPrompt] Loading definition for promptName: options-flow-web-search, file: options-flow-web-search
[418] Error: Failed to load web search prompt for options-flow-web-search: Error: Failed to load AI definition 'options-flow-web-search': Cannot find module '@/ai/definitions/options-flow-web-search.json'
[419]     at loadDefinition (src/ai/definition-loader.ts:93:10)
[420]     at async getWebSearchPrompt (src/actions/user-ticker-consolidated-chat-action.ts:117:23)
[421]     at async userTickerConsolidatedChatAction (src/actions/user-ticker-consolidated-chat-action.ts:233:8)
[422]   91 |     if (error.message.includes('Cannot find module') || error.code === 'MODULE_NOT_FOUND') {
[423]   92 |     }
[424] > 93 |     throw new Error(`Failed to load AI definition '${definitionName}': ${error.message}`);
[425]      |          ^
[426]   94 |   }
[427]   95 | }
[428]   96 |
[429] 
[430] [getWebSearchPrompt] Using fallback prompt for: options-flow-web-search
[431] [userTickerConsolidatedChatAction] System prompt preview: You are a helpful AI assistant specializing in stock market analysis. Use web search to find current...
[432] [userTickerConsolidatedChatAction] User message preview: **Analysis Request for GME (Current Date: 07/28/2025)**
[433] 
[434] Please provide options flow-web-search analysis for GME....
[435] [userTickerConsolidatedChatAction] Generating response with model: gemini-2.0-flash-exp
[436] Error: [userTickerConsolidatedChatAction] Error: Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent: [400 Bad Request] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[0]': Cannot find field.
[437] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[0]': Cannot find field.
[438] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[1]': Cannot find field.
[439] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[1]': Cannot find field.
[440] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[2]': Cannot find field.
[441] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[2]': Cannot find field. [{"@type":"type.googleapis.com/google.rpc.BadRequest","fieldViolations":[{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[2]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[2]': Cannot find field."}]}]
[442]     at async userTickerConsolidatedChatAction (src/actions/user-ticker-consolidated-chat-action.ts:283:19)
[443]   281 |     // Generate response
[444]   282 |     console.log(`[userTickerConsolidatedChatAction] Generating response with model: ${modelConfig.model}`);
[445] > 283 |     const result = await model.generateContent([
[446]       |                   ^
[447]   284 |       { role: 'user', parts: [{ text: systemPrompt }] },
[448]   285 |       { role: 'model', parts: [{ text: 'I understand. I\'m ready to help with your analysis.' }] },
[449]   286 |       { role: 'user', parts: [{ text: userMessage }] } {
[450]   status: 400,
[451]   statusText: 'Bad Request',
[452]   errorDetails: [Array]
[453] }
[454] 
[455]  POST /?monospaceUid=735050 200 in 1249ms
[456] [userTickerConsolidatedChatAction] Starting request processing
[457] [userTickerConsolidatedChatAction] Validated input for ticker: GME, webSearch: true
[458] [userTickerConsolidatedChatAction] Using web search: true
[459] [getWebSearchPrompt] Loading definition for promptName: user-input, file: web-search-chatbot
[460] Error: Failed to load web search prompt for user-input: Error: Failed to load AI definition 'web-search-chatbot': Cannot find module '@/ai/definitions/web-search-chatbot.json'
[461]     at loadDefinition (src/ai/definition-loader.ts:93:10)
[462]     at async getWebSearchPrompt (src/actions/user-ticker-consolidated-chat-action.ts:117:23)
[463]     at async userTickerConsolidatedChatAction (src/actions/user-ticker-consolidated-chat-action.ts:233:8)
[464]   91 |     if (error.message.includes('Cannot find module') || error.code === 'MODULE_NOT_FOUND') {
[465]   92 |     }
[466] > 93 |     throw new Error(`Failed to load AI definition '${definitionName}': ${error.message}`);
[467]      |          ^
[468]   94 |   }
[469]   95 | }
[470]   96 |
[471] 
[472] [getWebSearchPrompt] Using fallback prompt for: user-input
[473] [userTickerConsolidatedChatAction] System prompt preview: You are a helpful AI assistant specializing in stock market analysis. Use web search to find current...
[474] [userTickerConsolidatedChatAction] User message preview: **Analysis Request for GME (Current Date: 07/28/2025)**
[475] 
[476] when is GME earnings...
[477] [userTickerConsolidatedChatAction] Generating response with model: gemini-2.0-flash-exp
[478] Error: [userTickerConsolidatedChatAction] Error: Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent: [400 Bad Request] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[0]': Cannot find field.
[479] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[0]': Cannot find field.
[480] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[1]': Cannot find field.
[481] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[1]': Cannot find field.
[482] Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[2]': Cannot find field.
[483] Invalid JSON payload received. Unknown name "parts" at 'contents[0].parts[2]': Cannot find field. [{"@type":"type.googleapis.com/google.rpc.BadRequest","fieldViolations":[{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[0]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[0]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[1]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[1]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"role\" at 'contents[0].parts[2]': Cannot find field."},{"field":"contents[0].parts[2]","description":"Invalid JSON payload received. Unknown name \"parts\" at 'contents[0].parts[2]': Cannot find field."}]}]
[484]     at async userTickerConsolidatedChatAction (src/actions/user-ticker-consolidated-chat-action.ts:283:19)
[485]   281 |     // Generate response
[486]   282 |     console.log(`[userTickerConsolidatedChatAction] Generating response with model: ${modelConfig.model}`);
[487] > 283 |     const result = await model.generateContent([
[488]       |                   ^
[489]   284 |       { role: 'user', parts: [{ text: systemPrompt }] },
[490]   285 |       { role: 'model', parts: [{ text: 'I understand. I\'m ready to help with your analysis.' }] },
[491]   286 |       { role: 'user', parts: [{ text: userMessage }] } {
[492]   status: 400,
[493]   statusText: 'Bad Request',
[494]   errorDetails: [Array]
[495] }
[496] 
[497]  POST /?monospaceUid=735050 200 in 1343ms
