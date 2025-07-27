[v4.1.3.0] [BUG REPORT] SPY UI: more UI fixes & Populate Technical Analysis, AI Technical Analysis Cards 

- USE SEQUENTIAL THINKING TOOL
- Refer to Main Page tab if there are other data parsing issues for Polygon API JSON data

###
- USE SEQUENTIAL THINKING TOOL
- Focus on the ROOT CAUSE of the symptoms, and do not have tunnel vision and incorrectly focus on the symptoms itself which may not be the root cause
- Failure analysis report and scope potential fix(es)
- Wait for user approval of your Root Cause Report and Scope of Fixes before proceding with any code changes

###
[Detailed Symptom(s) / Change Request(s)]:
- Remove "Is Open" from Market Status because that is redundant with Market Status
- SPY Stock Snapshot UI is missing additional "Minute" Data Column.  We only have Current and Previous Day in UI update at the moment
- Add UI update to populate SPY Technical Analysis card
- Add UI update to populate SPY AI Technical Analysis
- Remove ALL individual granualar Copy\Export of SPY Raw Data, which were supposed to be removed in previous request
- There should only be a SINGLE pair of Copy\Export ALL to JSON that is a single atomic snaphot of the raw data
- No individual raw data copy\export is allowed, it should be ALL or nothing


###
[Log(s)]:

{
  "ticker": "SPY",
  "timestamp": "2025-07-27T00:47:34.185Z",
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
      "serverTime": "2025-07-26T20:46:48-04:00",
      "exchanges": {
        "nasdaq": "closed",
        "nyse": "closed",
        "otc": "closed"
      },
      "currencies": {
        "crypto": "open",
        "fx": "closed"
      }
    },
    "standardTa": {
      "RSI": {
        "7": 84.38,
        "10": 79.41,
        "14": 76.94
      },
      "MACD": {
        "value": 8.3093,
        "signal": 8.2382,
        "histogram": 0.0711
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
    "aiKeyTakeaways": null,
    "aiOptionsAnalysis": null
  }
}
