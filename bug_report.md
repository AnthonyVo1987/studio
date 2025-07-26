- Approved
- You also VIOLATED procedure by asking for approval while investigation is still going on
- You only need approval to move forward with code changes/fixes
- a bug report means you do whatever is necessary with tool calls and investigation to come up with the Root Cause Analysis and Propose Scope of Fix/Changes
- I will NOT approve intermediate invesigation steps because you need to do this on your own


[v3.7.4.5] [BUG REPORT] getFullStockData Stuck in Loop
###
- Focus on the ROOT CAUSE of the symptoms, and do not have tunnel vision and incorrectly focus on the symptoms itself which may not be the root cause
- Failure analysis report and scope potential fix(es)
- Wait for user approval of your Root Cause Report and Scope of Fixes before proceding with any code changes

###
[Detailed Symptom(s) / Change Request(s)]:
- Pressing analyze stock button gets getFullStockData Stuck in Loop
- If I switch to a different tab and then switch back to main tab, then no more loop

###
[Log(s)]:

{
  "appVersion": "v3.7.4.4",
  "snapshotType": "debug_snapshot",
  "timestamp": "2025-07-26T00:30:29.632Z",
  "fsmSnapshot": {
    "state": "IDLE",
    "previousState": "IDLE",
    "flags": {
      "canAnalyzeStock": true,
      "isMarketDataReady": true,
      "isSnapshotDataReady": true,
      "isStandardTADataReady": true,
      "isOptionsChainDataReady": true,
      "isCalculatedTADataReady": true,
      "isKeyTakeawaysDataAvailable": false,
      "isOptionsAnalysisDataAvailable": false,
      "isAiKeyTakeawaysSelected": false,
      "isAiOptionsAnalysisSelected": false
    },
    "variables": {
      "activeTicker": "NVDA",
      "userInputTicker": "NVDA",
      "lastError": null
    },
    "optionsChainSettings": {
      "optionType": "both",
      "strikeCount": 20,
      "tableDisplayType": "side-by-side"
    }
  },
  "debugData": {
    "polygonApiRequestLog": {
      "requestedTicker": "NVDA",
      "adapterInstanceFor": "NVDA",
      "cacheBustValueForRun": 1753489753837,
      "expirationDate": "2025-08-01",
      "optionType": "both",
      "strikeCount": 20
    },
    "polygonApiResponseLog": {
      "requestedTicker": "NVDA",
      "adapterInstanceFor": "NVDA",
      "responseTicker": "NVDA",
      "marketStatusLoaded": true,
      "snapshotLoaded": true,
      "tasLoaded": true,
      "optionsLoaded": true
    },
    "marketStatus": {
      "market": "closed",
      "earlyHours": false,
      "lateHours": false,
      "serverTime": "2025-07-25T20:29:14-04:00",
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
    "stockSnapshot": {
      "ticker": "NVDA",
      "day": {
        "o": 173.61,
        "h": 174.72,
        "l": 172.96,
        "c": 173.5,
        "v": 123917237,
        "vw": 173.8627,
        "t": 1753488000000000000
      },
      "prevDay": {
        "o": 172.44,
        "h": 173.83,
        "l": 171.3,
        "c": 173.74,
        "v": 128984628,
        "vw": 173.0158
      },
      "min": {
        "o": 173.35,
        "h": 173.45,
        "l": 173.35,
        "c": 173.45,
        "v": 6734,
        "vw": 173.3824,
        "t": 1753487940000,
        "n": 95
      },
      "todaysChange": -0.29,
      "todaysChangePerc": -0.1669,
      "updated": 1753488000000000000,
      "currentPrice": 173.5
    },
    "standardTas": {
      "RSI": {
        "7": 69.39,
        "10": 70.42,
        "14": 71.47
      },
      "MACD": {
        "value": 7.0383,
        "signal": 7.2588,
        "histogram": -0.2205
      },
      "VWAP": {
        "day": 173.8627,
        "minute": 173.3824
      },
      "EMA": {
        "5": 171.96,
        "10": 169.92,
        "20": 164.92,
        "50": 151.9,
        "200": 131.31
      },
      "SMA": {
        "5": 171.29,
        "10": 170.8,
        "20": 165.19,
        "50": 150.36,
        "200": 133.73
      }
    },
    "optionsChain": {
      "ticker": "NVDA",
      "expiration_date": "2025-08-01",
      "contracts": [
        {
          "strike": 197.5,
          "call": {
            "strike_price": 197.5,
            "option_type": "call",
            "iv": 0.3721,
            "last_price": 0.01,
            "change": -0.03,
            "percent_change": -75,
            "volume": 1486,
            "open_interest": 3759,
            "delta": 0.0052,
            "gamma": 0.0017,
            "theta": -0.0097,
            "vega": 0.0058
          },
          "put": {
            "strike_price": 197.5,
            "option_type": "put",
            "iv": 0.8946,
            "last_price": 25.45,
            "change": 0,
            "percent_change": 0,
            "volume": 1,
            "open_interest": 1,
            "delta": -0.8418,
            "gamma": 0.0116,
            "theta": -0.3612,
            "vega": 0.0673
          }
        },
        {
          "strike": 195,
          "call": {
            "strike_price": 195,
            "option_type": "call",
            "iv": 0.3382,
            "last_price": 0.02,
            "change": -0.03,
            "percent_change": -60,
            "volume": 4814,
            "open_interest": 2908,
            "delta": 0.0057,
            "gamma": 0.002,
            "theta": -0.0095,
            "vega": 0.0058
          },
          "put": {
            "strike_price": 195,
            "option_type": "put",
            "iv": 0.8591,
            "last_price": 29,
            "change": 0,
            "percent_change": 0,
            "volume": 1,
            "open_interest": 1,
            "delta": -0.8241,
            "gamma": 0.0128,
            "theta": -0.3694,
            "vega": 0.0673
          }
        },
        {
          "strike": 192.5,
          "call": {
            "strike_price": 192.5,
            "option_type": "call",
            "iv": 0.3211,
            "last_price": 0.04,
            "change": -0.02,
            "percent_change": -33.3,
            "volume": 6063,
            "open_interest": 2968,
            "delta": 0.0095,
            "gamma": 0.0033,
            "theta": -0.0141,
            "vega": 0.0058
          },
          "put": {
            "strike_price": 192.5,
            "option_type": "put",
            "iv": 0.7856,
            "last_price": 19.25,
            "change": -0.32,
            "percent_change": -1.64,
            "volume": 2,
            "open_interest": 0,
            "delta": -0.818,
            "gamma": 0.0143,
            "theta": -0.344,
            "vega": 0.0669
          }
        },
        {
          "strike": 190,
          "call": {
            "strike_price": 190,
            "option_type": "call",
            "iv": 0.3101,
            "last_price": 0.04,
            "change": -0.07,
            "percent_change": -63.6,
            "volume": 11267,
            "open_interest": 13629,
            "delta": 0.0166,
            "gamma": 0.0056,
            "theta": -0.0223,
            "vega": 0.0133
          },
          "put": {
            "strike_price": 190,
            "option_type": "put",
            "iv": 0.3882,
            "last_price": 16.55,
            "change": -1.18,
            "percent_change": -6.66,
            "volume": 66,
            "open_interest": 7,
            "delta": -0.96,
            "gamma": 0.0111,
            "theta": -0.0478,
            "vega": 0.0228
          }
        },
        {
          "strike": 187.5,
          "call": {
            "strike_price": 187.5,
            "option_type": "call",
            "iv": 0.3002,
            "last_price": 0.09,
            "change": -0.09,
            "percent_change": -50,
            "volume": 5142,
            "open_interest": 8192,
            "delta": 0.0304,
            "gamma": 0.0096,
            "theta": -0.0364,
            "vega": 0.0132
          },
          "put": {
            "strike_price": 187.5,
            "option_type": "put",
            "last_price": 13.85,
            "change": -0.25,
            "percent_change": -1.77,
            "volume": 35,
            "open_interest": 66
          }
        },
        {
          "strike": 185,
          "call": {
            "strike_price": 185,
            "option_type": "call",
            "iv": 0.2885,
            "last_price": 0.17,
            "change": -0.13,
            "percent_change": -43.3,
            "volume": 68544,
            "open_interest": 35652,
            "delta": 0.0557,
            "gamma": 0.0163,
            "theta": -0.0569,
            "vega": 0.0261
          },
          "put": {
            "strike_price": 185,
            "option_type": "put",
            "last_price": 11.4,
            "change": -0.07,
            "percent_change": -0.61,
            "volume": 311,
            "open_interest": 238
          }
        },
        {
          "strike": 182.5,
          "call": {
            "strike_price": 182.5,
            "option_type": "call",
            "iv": 0.2807,
            "last_price": 0.32,
            "change": -0.22,
            "percent_change": -40.7,
            "volume": 21590,
            "open_interest": 19835,
            "delta": 0.1,
            "gamma": 0.0262,
            "theta": -0.0869,
            "vega": 0.0446
          },
          "put": {
            "strike_price": 182.5,
            "option_type": "put",
            "iv": 0.248,
            "last_price": 9.2,
            "change": 0.08,
            "percent_change": 0.88,
            "volume": 633,
            "open_interest": 317,
            "delta": -0.9404,
            "gamma": 0.0243,
            "theta": -0.0415,
            "vega": 0.0235
          }
        },
        {
          "strike": 180,
          "call": {
            "strike_price": 180,
            "option_type": "call",
            "iv": 0.2782,
            "last_price": 0.63,
            "change": -0.33,
            "percent_change": -34.4,
            "volume": 81977,
            "open_interest": 46673,
            "delta": 0.1755,
            "gamma": 0.0389,
            "theta": -0.1277,
            "vega": 0.066
          },
          "put": {
            "strike_price": 180,
            "option_type": "put",
            "iv": 0.2559,
            "last_price": 7,
            "change": 0,
            "percent_change": 0,
            "volume": 4819,
            "open_interest": 1466,
            "delta": -0.8549,
            "gamma": 0.0399,
            "theta": -0.0897,
            "vega": 0.0628
          }
        },
        {
          "strike": 177.5,
          "call": {
            "strike_price": 177.5,
            "option_type": "call",
            "iv": 0.2815,
            "last_price": 1.21,
            "change": -0.44,
            "percent_change": -26.7,
            "volume": 94252,
            "open_interest": 39562,
            "delta": 0.2876,
            "gamma": 0.0509,
            "theta": -0.1719,
            "vega": 0.085
          },
          "put": {
            "strike_price": 177.5,
            "option_type": "put",
            "iv": 0.2659,
            "last_price": 5.11,
            "change": -0.09,
            "percent_change": -1.73,
            "volume": 2730,
            "open_interest": 1474,
            "delta": -0.7294,
            "gamma": 0.0536,
            "theta": -0.1408,
            "vega": 0.0845
          }
        },
        {
          "strike": 175,
          "call": {
            "strike_price": 175,
            "option_type": "call",
            "iv": 0.2882,
            "last_price": 2.11,
            "change": -0.55,
            "percent_change": -20.7,
            "volume": 123442,
            "open_interest": 36953,
            "delta": 0.4244,
            "gamma": 0.0572,
            "theta": -0.2041,
            "vega": 0.0957
          },
          "put": {
            "strike_price": 175,
            "option_type": "put",
            "iv": 0.2788,
            "last_price": 3.49,
            "change": -0.22,
            "percent_change": -5.93,
            "volume": 19387,
            "open_interest": 6173,
            "delta": -0.5814,
            "gamma": 0.0596,
            "theta": -0.1785,
            "vega": 0.0956
          }
        },
        {
          "strike": 172.5,
          "call": {
            "strike_price": 172.5,
            "option_type": "call",
            "iv": 0.3048,
            "last_price": 3.45,
            "change": -0.54,
            "percent_change": -13.5,
            "volume": 25493,
            "open_interest": 24241,
            "delta": 0.5647,
            "gamma": 0.0544,
            "theta": -0.2193,
            "vega": 0.0943
          },
          "put": {
            "strike_price": 172.5,
            "option_type": "put",
            "iv": 0.2919,
            "last_price": 2.31,
            "change": -0.24,
            "percent_change": -9.41,
            "volume": 47852,
            "open_interest": 7579,
            "delta": -0.4348,
            "gamma": 0.0571,
            "theta": -0.1912,
            "vega": 0.0943
          }
        },
        {
          "strike": 170,
          "call": {
            "strike_price": 170,
            "option_type": "call",
            "iv": 0.3226,
            "last_price": 5.15,
            "change": -0.5,
            "percent_change": -8.85,
            "volume": 14879,
            "open_interest": 24134,
            "delta": 0.6861,
            "gamma": 0.0465,
            "theta": -0.2127,
            "vega": 0.0815
          },
          "put": {
            "strike_price": 170,
            "option_type": "put",
            "iv": 0.3085,
            "last_price": 1.5,
            "change": -0.19,
            "percent_change": -11.2,
            "volume": 33526,
            "open_interest": 18364,
            "delta": -0.3079,
            "gamma": 0.0483,
            "theta": -0.1828,
            "vega": 0.0814
          }
        },
        {
          "strike": 167.5,
          "call": {
            "strike_price": 167.5,
            "option_type": "call",
            "iv": 0.3488,
            "last_price": 7.05,
            "change": -0.5,
            "percent_change": -6.62,
            "volume": 4707,
            "open_interest": 8923,
            "delta": 0.7787,
            "gamma": 0.0363,
            "theta": -0.1968,
            "vega": 0.0805
          },
          "put": {
            "strike_price": 167.5,
            "option_type": "put",
            "iv": 0.3311,
            "last_price": 0.96,
            "change": -0.14,
            "percent_change": -12.7,
            "volume": 18914,
            "open_interest": 9862,
            "delta": -0.211,
            "gamma": 0.0372,
            "theta": -0.1637,
            "vega": 0.0617
          }
        },
        {
          "strike": 165,
          "call": {
            "strike_price": 165,
            "option_type": "call",
            "iv": 0.3644,
            "last_price": 9.25,
            "change": -0.44,
            "percent_change": -4.54,
            "volume": 4012,
            "open_interest": 13736,
            "delta": 0.8482,
            "gamma": 0.0271,
            "theta": -0.1642,
            "vega": 0.0609
          },
          "put": {
            "strike_price": 165,
            "option_type": "put",
            "iv": 0.3517,
            "last_price": 0.65,
            "change": -0.08,
            "percent_change": -11,
            "volume": 29291,
            "open_interest": 26067,
            "delta": -0.1432,
            "gamma": 0.0271,
            "theta": -0.1351,
            "vega": 0.0608
          }
        },
        {
          "strike": 162.5,
          "call": {
            "strike_price": 162.5,
            "option_type": "call",
            "iv": 0.3846,
            "last_price": 11.6,
            "change": -0.35,
            "percent_change": -2.93,
            "volume": 936,
            "open_interest": 5960,
            "delta": 0.8973,
            "gamma": 0.0196,
            "theta": -0.1359,
            "vega": 0.0402
          },
          "put": {
            "strike_price": 162.5,
            "option_type": "put",
            "iv": 0.3762,
            "last_price": 0.44,
            "change": -0.07,
            "percent_change": -13.7,
            "volume": 11437,
            "open_interest": 11808,
            "delta": -0.0984,
            "gamma": 0.0193,
            "theta": -0.1108,
            "vega": 0.0401
          }
        },
        {
          "strike": 160,
          "call": {
            "strike_price": 160,
            "option_type": "call",
            "iv": 0.4242,
            "last_price": 13.95,
            "change": -0.4,
            "percent_change": -2.79,
            "volume": 1383,
            "open_interest": 14712,
            "delta": 0.9226,
            "gamma": 0.0143,
            "theta": -0.1232,
            "vega": 0.0398
          },
          "put": {
            "strike_price": 160,
            "option_type": "put",
            "iv": 0.4102,
            "last_price": 0.31,
            "change": -0.05,
            "percent_change": -13.9,
            "volume": 11026,
            "open_interest": 20236,
            "delta": -0.0699,
            "gamma": 0.0138,
            "theta": -0.0942,
            "vega": 0.0398
          }
        },
        {
          "strike": 157.5,
          "call": {
            "strike_price": 157.5,
            "option_type": "call",
            "iv": 0.4835,
            "last_price": 16.35,
            "change": -0.3,
            "percent_change": -1.8,
            "volume": 386,
            "open_interest": 4840,
            "delta": 0.9341,
            "gamma": 0.0112,
            "theta": -0.125,
            "vega": 0.0396
          },
          "put": {
            "strike_price": 157.5,
            "option_type": "put",
            "iv": 0.4398,
            "last_price": 0.23,
            "change": -0.05,
            "percent_change": -17.9,
            "volume": 3788,
            "open_interest": 11596,
            "delta": -0.051,
            "gamma": 0.01,
            "theta": -0.0786,
            "vega": 0.0228
          }
        },
        {
          "strike": 155,
          "call": {
            "strike_price": 155,
            "option_type": "call",
            "iv": 0.5245,
            "last_price": 18.84,
            "change": -0.28,
            "percent_change": -1.46,
            "volume": 1389,
            "open_interest": 7074,
            "delta": 0.9461,
            "gamma": 0.0088,
            "theta": -0.1164,
            "vega": 0.0227
          },
          "put": {
            "strike_price": 155,
            "option_type": "put",
            "iv": 0.4698,
            "last_price": 0.17,
            "change": -0.05,
            "percent_change": -22.7,
            "volume": 7748,
            "open_interest": 12481,
            "delta": -0.0371,
            "gamma": 0.0072,
            "theta": -0.0648,
            "vega": 0.0226
          }
        },
        {
          "strike": 152.5,
          "call": {
            "strike_price": 152.5,
            "option_type": "call",
            "iv": 0.5608,
            "last_price": 21.38,
            "change": -0.05,
            "percent_change": -0.23,
            "volume": 296,
            "open_interest": 2615,
            "delta": 0.9566,
            "gamma": 0.0068,
            "theta": -0.1055,
            "vega": 0.0226
          },
          "put": {
            "strike_price": 152.5,
            "option_type": "put",
            "iv": 0.5137,
            "last_price": 0.13,
            "change": -0.05,
            "percent_change": -27.8,
            "volume": 2657,
            "open_interest": 4334,
            "delta": -0.0293,
            "gamma": 0.0055,
            "theta": -0.059,
            "vega": 0.0225
          }
        },
        {
          "strike": 150,
          "call": {
            "strike_price": 150,
            "option_type": "call",
            "iv": 0.5755,
            "last_price": 23.78,
            "change": -0.32,
            "percent_change": -1.33,
            "volume": 740,
            "open_interest": 6625,
            "delta": 0.9722,
            "gamma": 0.0047,
            "theta": -0.081,
            "vega": 0.0223
          },
          "put": {
            "strike_price": 150,
            "option_type": "put",
            "iv": 0.5427,
            "last_price": 0.11,
            "change": -0.04,
            "percent_change": -26.7,
            "volume": 17753,
            "open_interest": 13279,
            "delta": -0.0226,
            "gamma": 0.0041,
            "theta": -0.0498,
            "vega": 0.0111
          }
        },
        {
          "strike": 149,
          "call": {
            "strike_price": 149,
            "option_type": "call",
            "iv": 0.5757,
            "last_price": 24.79,
            "change": -0.19,
            "percent_change": -0.76,
            "volume": 93,
            "open_interest": 1203,
            "delta": 0.9762,
            "gamma": 0.0041,
            "theta": -0.0726,
            "vega": 0.0111
          },
          "put": {
            "strike_price": 149,
            "option_type": "put",
            "iv": 0.5542,
            "last_price": 0.11,
            "change": -0.03,
            "percent_change": -21.4,
            "volume": 5330,
            "open_interest": 3191,
            "delta": -0.0204,
            "gamma": 0.0037,
            "theta": -0.0464,
            "vega": 0.0111
          }
        }
      ],
      "underlying_price": 173.5
    },
    "aiAnalyzedTaRequest": {
      "previousDayHigh": 173.83,
      "previousDayLow": 171.3,
      "previousDayClose": 173.74
    },
    "aiAnalyzedTa": {
      "pivotPoint": 172.96,
      "support1": 172.08,
      "support2": 170.43,
      "support3": 169.55,
      "resistance1": 174.61,
      "resistance2": 175.49,
      "resistance3": 177.14
    },
    "aiOptionsAnalysisRequest": {
      "status": "pending..."
    },
    "aiOptionsAnalysis": {
      "status": "pending..."
    },
    "aiKeyTakeawaysRequest": {
      "status": "pending..."
    },
    "aiKeyTakeaways": {
      "status": "pending..."
    },
    "userInputAppDataChatRequest": {
      "status": "no_analysis_run_yet"
    },
    "userInputAppDataChatResponse": {
      "status": "no_analysis_run_yet"
    },
    "stockTraderTakeawaysRequest": {
      "status": "no_analysis_run_yet"
    },
    "stockTraderTakeawaysResponse": {
      "status": "no_analysis_run_yet"
    },
    "optionsTraderTakeawaysRequest": {
      "status": "no_analysis_run_yet"
    },
    "optionsTraderTakeawaysResponse": {
      "status": "no_analysis_run_yet"
    },
    "holisticTakeawaysRequest": {
      "status": "no_analysis_run_yet"
    },
    "holisticTakeawaysResponse": {
      "status": "no_analysis_run_yet"
    }
  },
  "chatHistories": {
    "appDataChat": [],
    "webSearchChat": []
  },
  "clientTraceLogs": []
}

###

2025-07-26T00:24:31Z [web]  POST /?monospaceUid=867460 200 in 1148ms
2025-07-26T00:24:39Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:24:39Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:24:43Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:24:43Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:24:43Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:24:43Z [web]  POST /?monospaceUid=867460 200 in 4725ms
2025-07-26T00:24:44Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:24:44Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:24:48Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:24:48Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:24:48Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:24:48Z [web]  POST /?monospaceUid=867460 200 in 4607ms
2025-07-26T00:24:48Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:24:48Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:24:53Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:24:53Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:24:53Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:24:53Z [web]  POST /?monospaceUid=867460 200 in 4552ms
2025-07-26T00:24:53Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:24:53Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:24:57Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:24:57Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:24:57Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:24:58Z [web]  POST /?monospaceUid=867460 200 in 4521ms
2025-07-26T00:24:58Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:24:58Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:02Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:02Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:02Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:02Z [web]  POST /?monospaceUid=867460 200 in 4547ms
2025-07-26T00:25:02Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:02Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:07Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:07Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:07Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:07Z [web]  POST /?monospaceUid=867460 200 in 4933ms
2025-07-26T00:25:08Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:08Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:12Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:12Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:12Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:12Z [web]  POST /?monospaceUid=867460 200 in 4727ms
2025-07-26T00:25:12Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:12Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:17Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:17Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:17Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:17Z [web]  POST /?monospaceUid=867460 200 in 4583ms
2025-07-26T00:25:17Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:17Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:22Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:22Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:22Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:22Z [web]  POST /?monospaceUid=867460 200 in 4559ms
2025-07-26T00:25:22Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:22Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:26Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:26Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:26Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:26Z [web]  POST /?monospaceUid=867460 200 in 4580ms
2025-07-26T00:25:27Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:27Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:31Z [web]  POST /?monospaceUid=867460 200 in 4506ms
2025-07-26T00:25:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:36Z [web]  POST /?monospaceUid=867460 200 in 4630ms
2025-07-26T00:25:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:40Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:40Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:40Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:40Z [web]  POST /?monospaceUid=867460 200 in 4538ms
2025-07-26T00:25:41Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:41Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:45Z [web]  POST /?monospaceUid=867460 200 in 4560ms
2025-07-26T00:25:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:50Z [web]  POST /?monospaceUid=867460 200 in 4589ms
2025-07-26T00:25:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:55Z [web]  POST /?monospaceUid=867460 200 in 4522ms
2025-07-26T00:25:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:25:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:25:59Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:25:59Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:25:59Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:25:59Z [web]  POST /?monospaceUid=867460 200 in 4672ms
2025-07-26T00:26:00Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:00Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:04Z [web]  POST /?monospaceUid=867460 200 in 4515ms
2025-07-26T00:26:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:09Z [web]  POST /?monospaceUid=867460 200 in 4501ms
2025-07-26T00:26:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:13Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:13Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:13Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:13Z [web]  POST /?monospaceUid=867460 200 in 4493ms
2025-07-26T00:26:14Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:14Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:18Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:18Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:18Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:18Z [web]  POST /?monospaceUid=867460 200 in 4469ms
2025-07-26T00:26:18Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:18Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:23Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:23Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:23Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:23Z [web]  POST /?monospaceUid=867460 200 in 4542ms
2025-07-26T00:26:23Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:23Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:28Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:28Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:28Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:28Z [web]  POST /?monospaceUid=867460 200 in 4828ms
2025-07-26T00:26:28Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:28Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:32Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:32Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:32Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:32Z [web]  POST /?monospaceUid=867460 200 in 4507ms
2025-07-26T00:26:32Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:32Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:37Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:37Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:37Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:37Z [web]  POST /?monospaceUid=867460 200 in 4545ms
2025-07-26T00:26:37Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:37Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:43Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:43Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:43Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:43Z [web]  POST /?monospaceUid=867460 200 in 5507ms
2025-07-26T00:26:43Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:43Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:47Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:47Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:47Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:47Z [web]  POST /?monospaceUid=867460 200 in 4496ms
2025-07-26T00:26:47Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:47Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:52Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:52Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:52Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:52Z [web]  POST /?monospaceUid=867460 200 in 4771ms
2025-07-26T00:26:52Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:52Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:26:57Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:26:57Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:26:57Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:26:57Z [web]  POST /?monospaceUid=867460 200 in 4495ms
2025-07-26T00:26:57Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:26:57Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:01Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:01Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:01Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:01Z [web]  POST /?monospaceUid=867460 200 in 4521ms
2025-07-26T00:27:02Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:02Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:06Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:06Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:06Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:06Z [web]  POST /?monospaceUid=867460 200 in 4488ms
2025-07-26T00:27:06Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:06Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:11Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:11Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:11Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:11Z [web]  POST /?monospaceUid=867460 200 in 4516ms
2025-07-26T00:27:11Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:11Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:15Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:15Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:15Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:15Z [web]  POST /?monospaceUid=867460 200 in 4479ms
2025-07-26T00:27:16Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:16Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:20Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:20Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:20Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:20Z [web]  POST /?monospaceUid=867460 200 in 4702ms
2025-07-26T00:27:20Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:20Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:27Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:27Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:27Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:27Z [web]  POST /?monospaceUid=867460 200 in 6368ms
2025-07-26T00:27:27Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:27Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:31Z [web]  POST /?monospaceUid=867460 200 in 4507ms
2025-07-26T00:27:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:36Z [web]  POST /?monospaceUid=867460 200 in 4527ms
2025-07-26T00:27:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:41Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:41Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:41Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:41Z [web]  POST /?monospaceUid=867460 200 in 4543ms
2025-07-26T00:27:41Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:41Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:45Z [web]  POST /?monospaceUid=867460 200 in 4692ms
2025-07-26T00:27:46Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:46Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:50Z [web]  POST /?monospaceUid=867460 200 in 4491ms
2025-07-26T00:27:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:27:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:27:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:27:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:27:55Z [web]  POST /?monospaceUid=867460 200 in 4674ms
2025-07-26T00:27:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:27:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:00Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:00Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:00Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:00Z [web]  POST /?monospaceUid=867460 200 in 4529ms
2025-07-26T00:28:00Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:00Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:04Z [web]  POST /?monospaceUid=867460 200 in 4769ms
2025-07-26T00:28:05Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:05Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:09Z [web]  POST /?monospaceUid=867460 200 in 4546ms
2025-07-26T00:28:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:17Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:17Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:17Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:17Z [web]  POST /?monospaceUid=867460 200 in 7644ms
2025-07-26T00:28:17Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:17Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:22Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:22Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:22Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:22Z [web]  POST /?monospaceUid=867460 200 in 4520ms
2025-07-26T00:28:22Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:22Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:26Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:26Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:26Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:26Z [web]  POST /?monospaceUid=867460 200 in 4514ms
2025-07-26T00:28:27Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:27Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:31Z [web]  POST /?monospaceUid=867460 200 in 4513ms
2025-07-26T00:28:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:31Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:36Z [web]  POST /?monospaceUid=867460 200 in 4519ms
2025-07-26T00:28:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:36Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:40Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:40Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:40Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:40Z [web]  POST /?monospaceUid=867460 200 in 4555ms
2025-07-26T00:28:41Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:41Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:45Z [web]  POST /?monospaceUid=867460 200 in 4704ms
2025-07-26T00:28:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:45Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:50Z [web]  POST /?monospaceUid=867460 200 in 4456ms
2025-07-26T00:28:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:50Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:54Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:54Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:54Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:54Z [web]  POST /?monospaceUid=867460 200 in 4481ms
2025-07-26T00:28:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:55Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:28:59Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:28:59Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:28:59Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:28:59Z [web]  POST /?monospaceUid=867460 200 in 4499ms
2025-07-26T00:28:59Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:28:59Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:29:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:29:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:29:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:29:04Z [web]  POST /?monospaceUid=867460 200 in 4476ms
2025-07-26T00:29:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:29:04Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:29:08Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:29:08Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:29:08Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:29:08Z [web]  POST /?monospaceUid=867460 200 in 4611ms
2025-07-26T00:29:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:29:09Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:29:13Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:29:13Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:29:13Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:29:13Z [web]  POST /?monospaceUid=867460 200 in 4482ms
2025-07-26T00:29:13Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Received request. Payload keys: ticker, expirationDate, optionType, strikeCount.
2025-07-26T00:29:13Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Calling getFullStockData for NVDA.
2025-07-26T00:29:18Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] getFullStockData returned. Raw request params keys: requestedTicker, adapterInstanceFor, cacheBustValueForRun, expirationDate, optionType, strikeCount. Raw response summary keys: requestedTicker, adapterInstanceFor, responseTicker, marketStatusLoaded, snapshotLoaded, tasLoaded, optionsLoaded, autoSelectedExpirationDate, error
2025-07-26T00:29:18Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Ticker consistency check: Requested: NVDA, AdapterStockDataPkgTicker: NVDA, AdapterSnapshotTicker: NVDA
2025-07-26T00:29:18Z [web] [ServerAction:fetchStockDataAction:Ticker:NVDA] Successfully processed data. Final snapshot ticker: NVDA
2025-07-26T00:29:18Z [web]  POST /?monospaceUid=867460 200 in 4496ms
2025-07-26T00:30:06Z [web] [ServerAction:analyzeTaAction:Ticker:NVDA] Received request.
2025-07-26T00:30:06Z [web] [ServerAction:analyzeTaAction:Ticker:NVDA] Parsed stockSnapshotJson for NVDA
2025-07-26T00:30:06Z [web] [DEBUG] [AIFlow:analyzeTaIndicators] Received input { symbol: undefined, hasHlcData: false }
2025-07-26T00:30:06Z [web] [AIFlow:analyzeTaIndicatorsFlow] Starting analysis with input: {
2025-07-26T00:30:06Z [web]   previousDayHigh: 173.83,
2025-07-26T00:30:06Z [web]   previousDayLow: 171.3,
2025-07-26T00:30:06Z [web]   previousDayClose: 173.74
2025-07-26T00:30:06Z [web] }
2025-07-26T00:30:06Z [web] [AIFlow:analyzeTaIndicatorsFlow] Analysis complete. Output: {
2025-07-26T00:30:06Z [web]   pivotPoint: 172.96,
2025-07-26T00:30:06Z [web]   support1: 172.08,
2025-07-26T00:30:06Z [web]   support2: 170.43,
2025-07-26T00:30:06Z [web]   support3: 169.55,
2025-07-26T00:30:06Z [web]   resistance1: 174.61,
2025-07-26T00:30:06Z [web]   resistance2: 175.49,
2025-07-26T00:30:06Z [web]   resistance3: 177.14
2025-07-26T00:30:06Z [web] }
2025-07-26T00:30:06Z [web]  POST /?monospaceUid=867460 200 in 234ms
2025-07-26T00:30:07Z [web] [ServerAction:analyzeTaAction:Ticker:NVDA] Received request.
2025-07-26T00:30:07Z [web] [ServerAction:analyzeTaAction:Ticker:NVDA] Parsed stockSnapshotJson for NVDA
2025-07-26T00:30:07Z [web] [DEBUG] [AIFlow:analyzeTaIndicators] Received input { symbol: undefined, hasHlcData: false }
2025-07-26T00:30:07Z [web] [AIFlow:analyzeTaIndicatorsFlow] Starting analysis with input: {
2025-07-26T00:30:07Z [web]   previousDayHigh: 173.83,
2025-07-26T00:30:07Z [web]   previousDayLow: 171.3,
2025-07-26T00:30:07Z [web]   previousDayClose: 173.74
2025-07-26T00:30:07Z [web] }
2025-07-26T00:30:07Z [web] [AIFlow:analyzeTaIndicatorsFlow] Analysis complete. Output: {
2025-07-26T00:30:07Z [web]   pivotPoint: 172.96,
2025-07-26T00:30:07Z [web]   support1: 172.08,
2025-07-26T00:30:07Z [web]   support2: 170.43,
2025-07-26T00:30:07Z [web]   support3: 169.55,
2025-07-26T00:30:07Z [web]   resistance1: 174.61,
2025-07-26T00:30:07Z [web]   resistance2: 175.49,
2025-07-26T00:30:07Z [web]   resistance3: 177.14
2025-07-26T00:30:07Z [web] }
2025-07-26T00:30:07Z [web]  POST /?monospaceUid=867460 200 in 214ms
2025-07-26T00:30:07Z [web] [ServerAction:analyzeTaAction:Ticker:NVDA] Received request.
2025-07-26T00:30:07Z [web] [ServerAction:analyzeTaAction:Ticker:NVDA] Parsed stockSnapshotJson for NVDA
2025-07-26T00:30:07Z [web] [DEBUG] [AIFlow:analyzeTaIndicators] Received input { symbol: undefined, hasHlcData: false }
2025-07-26T00:30:07Z [web] [AIFlow:analyzeTaIndicatorsFlow] Starting analysis with input: {
2025-07-26T00:30:07Z [web]   previousDayHigh: 173.83,
2025-07-26T00:30:07Z [web]   previousDayLow: 171.3,
2025-07-26T00:30:07Z [web]   previousDayClose: 173.74
2025-07-26T00:30:07Z [web] }
2025-07-26T00:30:07Z [web] [AIFlow:analyzeTaIndicatorsFlow] Analysis complete. Output: {
2025-07-26T00:30:07Z [web]   pivotPoint: 172.96,
2025-07-26T00:30:07Z [web]   support1: 172.08,
2025-07-26T00:30:07Z [web]   support2: 170.43,
2025-07-26T00:30:07Z [web]   support3: 169.55,
2025-07-26T00:30:07Z [web]   resistance1: 174.61,
2025-07-26T00:30:07Z [web]   resistance2: 175.49,
2025-07-26T00:30:07Z [web]   resistance3: 177.14
2025-07-26T00:30:07Z [web] }
2025-07-26T00:30:07Z [web]  POST /?monospaceUid=867460 200 in 240ms
