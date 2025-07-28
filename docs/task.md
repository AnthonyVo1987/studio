[v4.1.16.0] [BUG REPORT] SPY: AI On demand Analysis incorrectly wiping out data \ UI\Render

###
- USE AS MANY AGENT(S) & Tool Calls as needed
- USE SEQUENTIAL THINKING TOOL as needed 
- USE CONTEXT7 TOOL as needed 

###
[Symptoms_or_Change_Request]:
- Pressing any of SPY AI Analysis (On-Demand) for either AI Key Takeways and/or AI Options Analysis is incorrectly wiping out the rest of the Stock Data and\or incorrectly sets rest of UI/Render cards to "Waiting for SPY market data..."
- The raw data may actually be correct and still not wiped out, but the issue could possibly be UI\Render related, so investigate the real root cause
###
- The expected app behavior is:
1. User Fetches expirations and selects a date
2. User presses Get Stock Data Button
3. Data is properly all populated and will ONLY get wiped if there is a subsequent Get Stock Data Button
4. So all data needs to stay and UI/Render needs to still show the current data from the Get Stock Data Button and will ONLY get wiped if user restarts the analysis
5. Pressing ANY on demand button should NOT wipe data and/or reset UI\Render
6. Get Stock Data Button is the single source of truth to wipe\clear\reset Data and/or UI\Render
7. Make sure ALL AI On demand actions work correctly 
8. Make sure even AI Chat Prompt buttons also follow this similiar behavior to not accidently wipe\clear\ Reset a UI\Render on its own. AI Chat should still keep it's chat history even after a Get Stock Data Button press, so this is the only "static" element since the user can issue multiple different analysis and get stock data, and can still have the chat history context to have more questions etc


[Log(s)]:
[ServerAction:fetchStockDataAction:Ticker:SPY] Starting stock data fetch... {
  ticker: 'SPY',
  expirationDate: '2025-08-01',
  optionType: 'both',
  strikeCount: 20
}
[ServerAction:fetchStockDataAction:Ticker:SPY] Calling polygon adapter...
[ServerAction:fetchStockDataAction:Ticker:SPY] Adapter response received
[ServerAction:fetchStockDataAction:Ticker:SPY] Data processing complete: {
  hasMarketStatus: true,
  hasStockSnapshot: true,
  hasTechnicalIndicators: true,
  hasOptionsChain: true,
  optionsChainSize: 0
}
[ServerAction:fetchStockDataAction:Ticker:SPY] SUCCESS - Stock data fetch completed
 POST / 200 in 4863ms
[ServerAction:analyzeTaAction:Ticker:SPY] Starting technical analysis... { hasStockSnapshot: true, dataSize: 565 }
[ServerAction:analyzeTaAction:Ticker:SPY] Parsing stock snapshot data...
[ServerAction:analyzeTaAction:Ticker:SPY] Stock snapshot parsed successfully
[ServerAction:analyzeTaAction:Ticker:SPY] Validating previous day data...
[ServerAction:analyzeTaAction:Ticker:SPY] Prepared flow input: {
  previousDayHigh: 636.15,
  previousDayLow: 633.99,
  previousDayClose: 634.42
}
[ServerAction:analyzeTaAction:Ticker:SPY] Calling AI flow for technical analysis...
[ServerAction:analyzeTaAction:Ticker:SPY] AI flow completed successfully
[ServerAction:analyzeTaAction:Ticker:SPY] SUCCESS - Technical analysis completed
 POST / 200 in 278ms
[ServerAction:performAiAnalysisAction:Ticker:SPY] Starting AI key takeaways analysis... {
  ticker: 'SPY',
  hasStockSnapshot: true,
  hasStandardTas: true,
  hasAiAnalyzedTa: true,
  hasMarketStatus: true
}
[ServerAction:performAiAnalysisAction:Ticker:SPY] Prepared flow input for AI analysis
[ServerAction:performAiAnalysisAction:Ticker:SPY] Calling AI flow for key takeaways generation...
[ServerAction:performAiAnalysisAction:Ticker:SPY] AI flow completed successfully
[ServerAction:performAiAnalysisAction:Ticker:SPY] SUCCESS - AI key takeaways analysis completed
 POST / 200 in 4605ms
[ServerAction:fetchStockDataAction:Ticker:SPY] Starting stock data fetch... {
  ticker: 'SPY',
  expirationDate: '2025-08-15',
  optionType: 'both',
  strikeCount: 20
}
[ServerAction:fetchStockDataAction:Ticker:SPY] Calling polygon adapter...
[ServerAction:fetchStockDataAction:Ticker:SPY] Adapter response received
[ServerAction:fetchStockDataAction:Ticker:SPY] Data processing complete: {
  hasMarketStatus: true,
  hasStockSnapshot: true,
  hasTechnicalIndicators: true,
  hasOptionsChain: true,
  optionsChainSize: 0
}
[ServerAction:fetchStockDataAction:Ticker:SPY] SUCCESS - Stock data fetch completed
 POST / 200 in 4913ms
[ServerAction:analyzeTaAction:Ticker:SPY] Starting technical analysis... { hasStockSnapshot: true, dataSize: 565 }
[ServerAction:analyzeTaAction:Ticker:SPY] Parsing stock snapshot data...
[ServerAction:analyzeTaAction:Ticker:SPY] Stock snapshot parsed successfully
[ServerAction:analyzeTaAction:Ticker:SPY] Validating previous day data...
[ServerAction:analyzeTaAction:Ticker:SPY] Prepared flow input: {
  previousDayHigh: 636.15,
  previousDayLow: 633.99,
  previousDayClose: 634.42
}
[ServerAction:analyzeTaAction:Ticker:SPY] Calling AI flow for technical analysis...
[ServerAction:analyzeTaAction:Ticker:SPY] AI flow completed successfully
[ServerAction:analyzeTaAction:Ticker:SPY] SUCCESS - Technical analysis completed
 POST / 200 in 261ms
[ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] Starting AI options analysis... { ticker: 'SPY', hasOptionsChain: true, hasStockSnapshot: true }
[ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] Validating input data...
[ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] Calling AI flow for options analysis...
[ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] AI flow completed successfully
[ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] SUCCESS - AI options analysis completed
 POST / 200 in 7580ms
[ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] Starting AI options analysis... { ticker: 'SPY', hasOptionsChain: true, hasStockSnapshot: true }
[ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] Validating input data...
[ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] Calling AI flow for options analysis...
[ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] AI flow completed successfully
[ServerAction:performAiOptionsAnalysisAction:Ticker:SPY] SUCCESS - AI options analysis completed

###

react-dom-client.development.js:25022 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
spy-tab-content.tsx:44 [SPY:UserAction:FetchExpirations] Starting expiration fetch... Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-tab-content.tsx:49 [SPY:UserAction:FetchExpirations] Expirations received: Object
spy-tab-content.tsx:52 [SPY:UserAction:FetchExpirations] Next available date: 2025-07-28
spy-tab-content.tsx:67 [SPY:UserAction:FetchExpirations] Completed successfully
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:155 [SPY:State] Setting expiration dates: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:155 [SPY:State] Setting expiration dates: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:162 [SPY:State] Setting selected expiration: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:162 [SPY:State] Setting selected expiration: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
spy-tab-content.tsx:283 [SPY:UserAction:ExpirationChange] Expiration date changed: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:162 [SPY:State] Setting selected expiration: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:162 [SPY:State] Setting selected expiration: Object
spy-tab-content.tsx:84 [SPY:UserAction:GetStockData] Starting stock data fetch... Object
spy-tab-content.tsx:106 [SPY:UserAction:GetStockData] Step 1: Fetching stock data...
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:229 [SPY:State] Setting data retrieval complete: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:229 [SPY:State] Setting data retrieval complete: Objectcomplete: false[[Prototype]]: Object
spy-tab-content.tsx:117 [SPY:UserAction:GetStockData] Step 1: Stock data received
spy-tab-content.tsx:120 [SPY:UserAction:GetStockData] Step 2: Fetching technical analysis...
spy-tab-content.tsx:129 [SPY:UserAction:GetStockData] Step 2: Technical analysis received
spy-tab-content.tsx:132 [SPY:UserAction:GetStockData] Step 3: Updating state with stock data
spy-tab-content.tsx:145 [SPY:UserAction:GetStockData] Step 4: Setting options chain data Object
spy-tab-content.tsx:157 [SPY:UserAction:GetStockData] Step 5: Marking data retrieval complete
spy-tab-content.tsx:166 [SPY:UserAction:GetStockData] Completed successfully
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:178 [SPY:State] Setting stock data: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:178 [SPY:State] Setting stock data: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:202 [SPY:State] Setting options chain data: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:202 [SPY:State] Setting options chain data: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:229 [SPY:State] Setting data retrieval complete: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:229 [SPY:State] Setting data retrieval complete: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
spy-tab-content.tsx:183 [SPY:UserAction:AIKeyTakeaways] Starting AI key takeaways generation... Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-tab-content.tsx:203 [SPY:UserAction:AIKeyTakeaways] AI analysis completed successfully
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:213 [SPY:State] Setting AI key takeaways: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:213 [SPY:State] Setting AI key takeaways: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
spy-tab-content.tsx:283 [SPY:UserAction:ExpirationChange] Expiration date changed: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:162 [SPY:State] Setting selected expiration: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:162 [SPY:State] Setting selected expiration: Object
spy-tab-content.tsx:84 [SPY:UserAction:GetStockData] Starting stock data fetch... Object
spy-tab-content.tsx:106 [SPY:UserAction:GetStockData] Step 1: Fetching stock data...
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:229 [SPY:State] Setting data retrieval complete: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:229 [SPY:State] Setting data retrieval complete: Objectcomplete: false[[Prototype]]: Object
spy-tab-content.tsx:117 [SPY:UserAction:GetStockData] Step 1: Stock data received
spy-tab-content.tsx:120 [SPY:UserAction:GetStockData] Step 2: Fetching technical analysis...
spy-tab-content.tsx:129 [SPY:UserAction:GetStockData] Step 2: Technical analysis received
spy-tab-content.tsx:132 [SPY:UserAction:GetStockData] Step 3: Updating state with stock data
spy-tab-content.tsx:145 [SPY:UserAction:GetStockData] Step 4: Setting options chain data Object
spy-tab-content.tsx:157 [SPY:UserAction:GetStockData] Step 5: Marking data retrieval complete
spy-tab-content.tsx:166 [SPY:UserAction:GetStockData] Completed successfully
spy-analysis-context.tsx:126 [SPY:State] Reducer action: ObjectpreviousStatus: "loading"type: "SET_STOCK_DATA"[[Prototype]]: Object
spy-analysis-context.tsx:178 [SPY:State] Setting stock data: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:178 [SPY:State] Setting stock data: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:202 [SPY:State] Setting options chain data: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:202 [SPY:State] Setting options chain data: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:229 [SPY:State] Setting data retrieval complete: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:229 [SPY:State] Setting data retrieval complete: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: ObjectpreviousStatus: "loading"type: "SET_IDLE"[[Prototype]]: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
spy-tab-content.tsx:235 [SPY:UserAction:AIOptionsAnalysis] Starting AI options analysis... ObjecthasOptionsChain: truehasStockData: trueticker: "SPY"[[Prototype]]: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-tab-content.tsx:251 [SPY:UserAction:AIOptionsAnalysis] AI options analysis completed successfully
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:221 [SPY:State] Setting AI options analysis: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:221 [SPY:State] Setting AI options analysis: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
spy-tab-content.tsx:235 [SPY:UserAction:AIOptionsAnalysis] Starting AI options analysis... Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: ObjectpreviousStatus: "idle"type: "SET_LOADING"[[Prototype]]: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:130 [SPY:State] FSM transition: -> LOADING
spy-tab-content.tsx:251 [SPY:UserAction:AIOptionsAnalysis] AI options analysis completed successfully
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:221 [SPY:State] Setting AI options analysis: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:221 [SPY:State] Setting AI options analysis: Object
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
spy-analysis-context.tsx:126 [SPY:State] Reducer action: Object
spy-analysis-context.tsx:139 [SPY:State] FSM transition: -> IDLE
turbopack-hot-reloader-common.ts:41 [Fast Refresh] rebuilding
report-hmr-latency.ts:26 [Fast Refresh] done in 102ms

###

{
  "ticker": "SPY",
  "timestamp": "2025-07-28T01:30:42.676Z",
  "data": {
    "stockSnapshot": {
      "ticker": "SPY",
      "day": {
        "o": 635.09,
        "h": 637.58,
        "l": 634.84,
        "c": 637.1,
        "v": 56916993,
        "vw": 636.4023,
        "t": 1753488000000000000
      },
      "prevDay": {
        "o": 634.6,
        "h": 636.15,
        "l": 633.99,
        "c": 634.42,
        "v": 71307134,
        "vw": 634.9893
      },
      "min": {
        "o": 637.49,
        "h": 637.49,
        "l": 637.46,
        "c": 637.46,
        "v": 1194,
        "vw": 637.4863,
        "t": 1753487940000,
        "n": 28
      },
      "todaysChange": 2.68,
      "todaysChangePerc": 0.4224,
      "updated": 1753488000000000000,
      "currentPrice": 637.1
    },
    "marketStatus": {
      "market": "closed",
      "earlyHours": false,
      "lateHours": false,
      "serverTime": "2025-07-27T21:27:30-04:00",
      "exchanges": {
        "nasdaq": "closed",
        "nyse": "closed",
        "otc": "closed"
      },
      "currencies": {
        "crypto": "open",
        "fx": "open"
      }
    },
    "optionsChain": {
      "ticker": "SPY",
      "expiration_date": "2025-08-15",
      "contracts": [
        {
          "strike": 639,
          "call": {
            "strike_price": 639,
            "option_type": "call",
            "iv": 0.1255,
            "last_price": 6.82,
            "change": 0,
            "percent_change": 0,
            "volume": 549,
            "open_interest": 3087,
            "delta": 0.4846,
            "gamma": 0.0221,
            "theta": -0.2176,
            "vega": 0.5765
          },
          "put": {
            "strike_price": 639,
            "option_type": "put",
            "iv": 0.1149,
            "last_price": 7.34,
            "change": 0,
            "percent_change": 0,
            "volume": 392,
            "open_interest": 121,
            "delta": -0.5253,
            "gamma": 0.0248,
            "theta": -0.1545,
            "vega": 0.5758
          }
        },
        {
          "strike": 638,
          "call": {
            "strike_price": 638,
            "option_type": "call",
            "iv": 0.128,
            "last_price": 7.35,
            "change": 0,
            "percent_change": 0,
            "volume": 1285,
            "open_interest": 1349,
            "delta": 0.5065,
            "gamma": 0.0218,
            "theta": -0.2238,
            "vega": 0.5743
          },
          "put": {
            "strike_price": 638,
            "option_type": "put",
            "iv": 0.1169,
            "last_price": 6.91,
            "change": 0,
            "percent_change": 0,
            "volume": 452,
            "open_interest": 432,
            "delta": -0.5008,
            "gamma": 0.0245,
            "theta": -0.1599,
            "vega": 0.5738
          }
        },
        {
          "strike": 637,
          "call": {
            "strike_price": 637,
            "option_type": "call",
            "iv": 0.1307,
            "last_price": 8,
            "change": 0,
            "percent_change": 0,
            "volume": 768,
            "open_interest": 1334,
            "delta": 0.5276,
            "gamma": 0.0215,
            "theta": -0.2299,
            "vega": 0.5723
          },
          "put": {
            "strike_price": 637,
            "option_type": "put",
            "iv": 0.1195,
            "last_price": 6.45,
            "change": 0,
            "percent_change": 0,
            "volume": 5012,
            "open_interest": 238,
            "delta": -0.4773,
            "gamma": 0.024,
            "theta": -0.166,
            "vega": 0.5715
          }
        },
        {
          "strike": 636,
          "call": {
            "strike_price": 636,
            "option_type": "call",
            "iv": 0.1315,
            "last_price": 8.57,
            "change": 0,
            "percent_change": 0,
            "volume": 1544,
            "open_interest": 1161,
            "delta": 0.548,
            "gamma": 0.0211,
            "theta": -0.2295,
            "vega": 0.5704
          },
          "put": {
            "strike_price": 636,
            "option_type": "put",
            "iv": 0.1203,
            "last_price": 6.06,
            "change": 0,
            "percent_change": 0,
            "volume": 1129,
            "open_interest": 495,
            "delta": -0.4539,
            "gamma": 0.0235,
            "theta": -0.1654,
            "vega": 0.5699
          }
        },
        {
          "strike": 635,
          "call": {
            "strike_price": 635,
            "option_type": "call",
            "iv": 0.1327,
            "last_price": 9.21,
            "change": 0,
            "percent_change": 0,
            "volume": 3313,
            "open_interest": 22271,
            "delta": 0.568,
            "gamma": 0.0206,
            "theta": -0.2297,
            "vega": 0.5685
          },
          "put": {
            "strike_price": 635,
            "option_type": "put",
            "iv": 0.1213,
            "last_price": 5.7,
            "change": 0,
            "percent_change": 0,
            "volume": 9554,
            "open_interest": 7595,
            "delta": -0.4314,
            "gamma": 0.0229,
            "theta": -0.1653,
            "vega": 0.568
          }
        },
        {
          "strike": 634,
          "call": {
            "strike_price": 634,
            "option_type": "call",
            "iv": 0.1345,
            "last_price": 9.9,
            "change": 0,
            "percent_change": 0,
            "volume": 750,
            "open_interest": 1232,
            "delta": 0.5874,
            "gamma": 0.0201,
            "theta": -0.2308,
            "vega": 0.5667
          },
          "put": {
            "strike_price": 634,
            "option_type": "put",
            "iv": 0.1229,
            "last_price": 5.43,
            "change": 0,
            "percent_change": 0,
            "volume": 882,
            "open_interest": 540,
            "delta": -0.4098,
            "gamma": 0.0223,
            "theta": -0.166,
            "vega": 0.5661
          }
        },
        {
          "strike": 633,
          "call": {
            "strike_price": 633,
            "option_type": "call",
            "iv": 0.1364,
            "last_price": 10.57,
            "change": 0,
            "percent_change": 0,
            "volume": 616,
            "open_interest": 2056,
            "delta": 0.6062,
            "gamma": 0.0196,
            "theta": -0.232,
            "vega": 0.565
          },
          "put": {
            "strike_price": 633,
            "option_type": "put",
            "iv": 0.1248,
            "last_price": 5.05,
            "change": 0,
            "percent_change": 0,
            "volume": 1284,
            "open_interest": 803,
            "delta": -0.3891,
            "gamma": 0.0216,
            "theta": -0.1673,
            "vega": 0.5642
          }
        },
        {
          "strike": 632,
          "call": {
            "strike_price": 632,
            "option_type": "call",
            "iv": 0.1388,
            "last_price": 11.37,
            "change": 0,
            "percent_change": 0,
            "volume": 238,
            "open_interest": 905,
            "delta": 0.624,
            "gamma": 0.019,
            "theta": -0.234,
            "vega": 0.5635
          },
          "put": {
            "strike_price": 632,
            "option_type": "put",
            "iv": 0.127,
            "last_price": 4.77,
            "change": 0,
            "percent_change": 0,
            "volume": 908,
            "open_interest": 1298,
            "delta": -0.3693,
            "gamma": 0.021,
            "theta": -0.1689,
            "vega": 0.5624
          }
        },
        {
          "strike": 631,
          "call": {
            "strike_price": 631,
            "option_type": "call",
            "iv": 0.1415,
            "last_price": 12.52,
            "change": 0,
            "percent_change": 0,
            "volume": 284,
            "open_interest": 1666,
            "delta": 0.641,
            "gamma": 0.0185,
            "theta": -0.2364,
            "vega": 0.562
          },
          "put": {
            "strike_price": 631,
            "option_type": "put",
            "iv": 0.1294,
            "last_price": 4.56,
            "change": 0,
            "percent_change": 0,
            "volume": 438,
            "open_interest": 1875,
            "delta": -0.3505,
            "gamma": 0.0203,
            "theta": -0.1709,
            "vega": 0.5607
          }
        },
        {
          "strike": 630,
          "call": {
            "strike_price": 630,
            "option_type": "call",
            "iv": 0.1446,
            "last_price": 12.82,
            "change": 0,
            "percent_change": 0,
            "volume": 1227,
            "open_interest": 47078,
            "delta": 0.657,
            "gamma": 0.0179,
            "theta": -0.2394,
            "vega": 0.5607
          },
          "put": {
            "strike_price": 630,
            "option_type": "put",
            "iv": 0.1322,
            "last_price": 4.26,
            "change": 0,
            "percent_change": 0,
            "volume": 8337,
            "open_interest": 21695,
            "delta": -0.333,
            "gamma": 0.0196,
            "theta": -0.1732,
            "vega": 0.5047
          }
        },
        {
          "strike": 629,
          "call": {
            "strike_price": 629,
            "option_type": "call",
            "iv": 0.1472,
            "last_price": 13.79,
            "change": 0,
            "percent_change": 0,
            "volume": 16,
            "open_interest": 1240,
            "delta": 0.672,
            "gamma": 0.0173,
            "theta": -0.2405,
            "vega": 0.4894
          },
          "put": {
            "strike_price": 629,
            "option_type": "put",
            "iv": 0.1333,
            "last_price": 4.02,
            "change": 0,
            "percent_change": 0,
            "volume": 776,
            "open_interest": 906,
            "delta": -0.3159,
            "gamma": 0.0189,
            "theta": -0.1701,
            "vega": 0.4894
          }
        },
        {
          "strike": 628,
          "call": {
            "strike_price": 628,
            "option_type": "call",
            "iv": 0.1487,
            "last_price": 14.56,
            "change": 0,
            "percent_change": 0,
            "volume": 26,
            "open_interest": 710,
            "delta": 0.6864,
            "gamma": 0.0167,
            "theta": -0.2381,
            "vega": 0.4882
          },
          "put": {
            "strike_price": 628,
            "option_type": "put",
            "iv": 0.1344,
            "last_price": 3.81,
            "change": 0,
            "percent_change": 0,
            "volume": 1160,
            "open_interest": 1867,
            "delta": -0.2995,
            "gamma": 0.0182,
            "theta": -0.167,
            "vega": 0.4871
          }
        },
        {
          "strike": 627,
          "call": {
            "strike_price": 627,
            "option_type": "call",
            "iv": 0.1502,
            "last_price": 15.47,
            "change": 0,
            "percent_change": 0,
            "volume": 209,
            "open_interest": 700,
            "delta": 0.7004,
            "gamma": 0.0161,
            "theta": -0.2358,
            "vega": 0.487
          },
          "put": {
            "strike_price": 627,
            "option_type": "put",
            "iv": 0.1361,
            "last_price": 3.6,
            "change": 0,
            "percent_change": 0,
            "volume": 740,
            "open_interest": 8004,
            "delta": -0.2842,
            "gamma": 0.0175,
            "theta": -0.1649,
            "vega": 0.4856
          }
        }
      ],
      "underlying_price": 637.1
    },
    "standardTa": {
      "RSI": {
        "7": 84.57,
        "10": 79.26,
        "14": 76.79
      },
      "MACD": {
        "value": 8.3097,
        "signal": 8.2388,
        "histogram": 0.0709
      },
      "VWAP": {
        "day": 636.4023,
        "minute": 637.4863
      },
      "EMA": {
        "5": 633.24,
        "10": 629.92,
        "20": 623.96,
        "50": 608.14,
        "200": 581.27
      },
      "SMA": {
        "5": 632.67,
        "10": 629.02,
        "20": 625.04,
        "50": 607.28,
        "200": 587.13
      }
    },
    "aiAnalyzedTa": {
      "pivotPoint": 634.85,
      "support1": 633.56,
      "support2": 632.69,
      "support3": 631.4,
      "resistance1": 635.72,
      "resistance2": 637.01,
      "resistance3": 637.88
    },
    "aiKeyTakeaways": {
      "momentum": {
        "sentiment": "strong",
        "takeaway": "Momentum is strong, evidenced by the extremely high RSI readings across multiple periods (7-day RSI: 84.57, 14-day RSI: 76.79), indicating sustained buying pressure."
      },
      "patterns": {
        "sentiment": "bullish",
        "takeaway": "The stock has successfully broken above resistance levels R1 ($635.72) and R2 ($637.01), suggesting a bullish continuation or breakout pattern is in play."
      },
      "priceAction": {
        "sentiment": "bullish",
        "takeaway": "The stock is trading above key resistance levels, including R1 at $635.72 and R2 at $637.01, and is also well above its day's VWAP of $636.40."
      },
      "trend": {
        "sentiment": "bullish",
        "takeaway": "SPY is exhibiting a strong uptrend, with its current price of $637.10 trading significantly above the 5-day EMA ($633.24) and 200-day EMA ($581.27)."
      },
      "volatility": {
        "sentiment": "high",
        "takeaway": "Volatility is elevated, marked by a significant upward move of 0.42% today, pushing the price to new highs and the 14-day RSI into overbought territory at 76.79."
      }
    },
    "aiOptionsAnalysis": {
      "callWalls": [
        {
          "openInterest": 47078,
          "strike": 630,
          "type": "call",
          "volume": 1227
        },
        {
          "openInterest": 22271,
          "strike": 635,
          "type": "call",
          "volume": 3313
        },
        {
          "openInterest": 3087,
          "strike": 639,
          "type": "call",
          "volume": 549
        }
      ],
      "putWalls": [
        {
          "openInterest": 21695,
          "strike": 630,
          "type": "put",
          "volume": 8337
        },
        {
          "openInterest": 7595,
          "strike": 635,
          "type": "put",
          "volume": 9554
        },
        {
          "openInterest": 8004,
          "strike": 627,
          "type": "put",
          "volume": 740
        }
      ]
    }
  }
}