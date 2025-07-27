[v4.1.5.0] [BUG REPORT] SPY UI: Options Chain Table Re-Architect

- USE SEQUENTIAL THINKING TOOL
- Refer to Main Page tab if there are other data parsing issues for Polygon API JSON data

###
- Focus on the ROOT CAUSE of the symptoms, and do not have tunnel vision and incorrectly focus on the symptoms itself which may not be the root cause
- Failure analysis report and scope potential fix(es)
- Wait for user approval of your Root Cause Report and Scope of Fixes before proceding with any code changes

###
[Detailed Symptom(s) / Change Request(s)]:
- SPY Options Chain was implemented to mirror the robust Main Page implementation
- But The Main page has architectural flaw that violates "React anti-pattern" and "complex\convoluted" useEffect/dependency array/UI/Render
- So let's re-archite

###
[Log(s)]:

Sample default Options Chain JSON output from Main page to serve as a reference point how to parse/format the data
{
  "ticker": "SPY",
  "expiration_date": "2025-08-01",
  "contracts": [
    {
      "strike": 647,
      "call": {
        "strike_price": 647,
        "option_type": "call",
        "iv": 0.1141,
        "last_price": 0.72,
        "change": 0,
        "percent_change": 0,
        "volume": 2553,
        "open_interest": 355,
        "delta": 0.1512,
        "gamma": 0.0256,
        "theta": -0.193,
        "vega": 0.2244
      },
      "put": {
        "strike_price": 647,
        "option_type": "put",
        "iv": 0.1093,
        "last_price": 10.04,
        "change": 0,
        "percent_change": 0,
        "volume": 21,
        "open_interest": 5,
        "delta": -0.8723,
        "gamma": 0.0266,
        "theta": -0.1314,
        "vega": 0.1425
      }
    },
    {
      "strike": 646,
      "call": {
        "strike_price": 646,
        "option_type": "call",
        "iv": 0.1147,
        "last_price": 0.91,
        "change": 0,
        "percent_change": 0,
        "volume": 4994,
        "open_interest": 5097,
        "delta": 0.1816,
        "gamma": 0.0284,
        "theta": -0.217,
        "vega": 0.2234
      },
      "put": {
        "strike_price": 646,
        "option_type": "put",
        "iv": 0.1099,
        "last_price": 9.63,
        "change": 0,
        "percent_change": 0,
        "volume": 25,
        "open_interest": 30,
        "delta": -0.84,
        "gamma": 0.0297,
        "theta": -0.1555,
        "vega": 0.2122
      }
    },
    {
      "strike": 645,
      "call": {
        "strike_price": 645,
        "option_type": "call",
        "iv": 0.1168,
        "last_price": 1.17,
        "change": 0,
        "percent_change": 0,
        "volume": 8637,
        "open_interest": 15650,
        "delta": 0.2147,
        "gamma": 0.0311,
        "theta": -0.2465,
        "vega": 0.2222
      },
      "put": {
        "strike_price": 645,
        "option_type": "put",
        "iv": 0.1117,
        "last_price": 8.82,
        "change": 0,
        "percent_change": 0,
        "volume": 426,
        "open_interest": 424,
        "delta": -0.8043,
        "gamma": 0.0324,
        "theta": -0.1834,
        "vega": 0.2172
      }
    },
    {
      "strike": 644,
      "call": {
        "strike_price": 644,
        "option_type": "call",
        "iv": 0.1195,
        "last_price": 1.44,
        "change": 0,
        "percent_change": 0,
        "volume": 4334,
        "open_interest": 2417,
        "delta": 0.2495,
        "gamma": 0.0333,
        "theta": -0.2768,
        "vega": 0.2891
      },
      "put": {
        "strike_price": 644,
        "option_type": "put",
        "iv": 0.1152,
        "last_price": 8,
        "change": 0,
        "percent_change": 0,
        "volume": 120,
        "open_interest": 51,
        "delta": -0.7673,
        "gamma": 0.0348,
        "theta": -0.217,
        "vega": 0.2191
      }
    },
    {
      "strike": 643,
      "call": {
        "strike_price": 643,
        "option_type": "call",
        "iv": 0.1199,
        "last_price": 1.76,
        "change": 0,
        "percent_change": 0,
        "volume": 102703,
        "open_interest": 969,
        "delta": 0.2861,
        "gamma": 0.0352,
        "theta": -0.2952,
        "vega": 0.2879
      },
      "put": {
        "strike_price": 643,
        "option_type": "put",
        "iv": 0.1154,
        "last_price": 7.24,
        "change": 0,
        "percent_change": 0,
        "volume": 133,
        "open_interest": 108,
        "delta": -0.7287,
        "gamma": 0.0369,
        "theta": -0.2352,
        "vega": 0.2839
      }
    },
    {
      "strike": 642,
      "call": {
        "strike_price": 642,
        "option_type": "call",
        "iv": 0.122,
        "last_price": 2.12,
        "change": 0,
        "percent_change": 0,
        "volume": 3556,
        "open_interest": 1348,
        "delta": 0.3249,
        "gamma": 0.0366,
        "theta": -0.3191,
        "vega": 0.2867
      },
      "put": {
        "strike_price": 642,
        "option_type": "put",
        "iv": 0.1169,
        "last_price": 6.7,
        "change": 0,
        "percent_change": 0,
        "volume": 711,
        "open_interest": 35,
        "delta": -0.6882,
        "gamma": 0.0385,
        "theta": -0.257,
        "vega": 0.2849
      }
    },
    {
      "strike": 641,
      "call": {
        "strike_price": 641,
        "option_type": "call",
        "iv": 0.1253,
        "last_price": 2.51,
        "change": 0,
        "percent_change": 0,
        "volume": 3506,
        "open_interest": 1407,
        "delta": 0.3637,
        "gamma": 0.0377,
        "theta": -0.3468,
        "vega": 0.2854
      },
      "put": {
        "strike_price": 641,
        "option_type": "put",
        "iv": 0.1201,
        "last_price": 6.1,
        "change": 0,
        "percent_change": 0,
        "volume": 326,
        "open_interest": 122,
        "delta": -0.647,
        "gamma": 0.0396,
        "theta": -0.284,
        "vega": 0.2848
      }
    },
    {
      "strike": 640,
      "call": {
        "strike_price": 640,
        "option_type": "call",
        "iv": 0.126,
        "last_price": 2.91,
        "change": 0,
        "percent_change": 0,
        "volume": 8519,
        "open_interest": 6184,
        "delta": 0.4024,
        "gamma": 0.0382,
        "theta": -0.3574,
        "vega": 0.325
      },
      "put": {
        "strike_price": 640,
        "option_type": "put",
        "iv": 0.1211,
        "last_price": 5.52,
        "change": 0,
        "percent_change": 0,
        "volume": 1495,
        "open_interest": 4440,
        "delta": -0.6062,
        "gamma": 0.0403,
        "theta": -0.2973,
        "vega": 0.3237
      }
    },
    {
      "strike": 639,
      "call": {
        "strike_price": 639,
        "option_type": "call",
        "iv": 0.1273,
        "last_price": 3.43,
        "change": 0,
        "percent_change": 0,
        "volume": 3173,
        "open_interest": 2178,
        "delta": 0.4418,
        "gamma": 0.0384,
        "theta": -0.3682,
        "vega": 0.3237
      },
      "put": {
        "strike_price": 639,
        "option_type": "put",
        "iv": 0.1224,
        "last_price": 4.88,
        "change": 0,
        "percent_change": 0,
        "volume": 701,
        "open_interest": 179,
        "delta": -0.5646,
        "gamma": 0.0404,
        "theta": -0.3074,
        "vega": 0.3234
      }
    },
    {
      "strike": 638,
      "call": {
        "strike_price": 638,
        "option_type": "call",
        "iv": 0.1301,
        "last_price": 3.9,
        "change": 0,
        "percent_change": 0,
        "volume": 4257,
        "open_interest": 1755,
        "delta": 0.4807,
        "gamma": 0.0382,
        "theta": -0.3829,
        "vega": 0.3225
      },
      "put": {
        "strike_price": 638,
        "option_type": "put",
        "iv": 0.1247,
        "last_price": 4.39,
        "change": 0,
        "percent_change": 0,
        "volume": 3728,
        "open_interest": 540,
        "delta": -0.5238,
        "gamma": 0.0402,
        "theta": -0.3206,
        "vega": 0.3225
      }
    },
    {
      "strike": 637,
      "call": {
        "strike_price": 637,
        "option_type": "call",
        "iv": 0.1334,
        "last_price": 4.49,
        "change": 0,
        "percent_change": 0,
        "volume": 5984,
        "open_interest": 1540,
        "delta": 0.5179,
        "gamma": 0.0376,
        "theta": -0.3977,
        "vega": 0.3214
      },
      "put": {
        "strike_price": 637,
        "option_type": "put",
        "iv": 0.1281,
        "last_price": 3.95,
        "change": 0,
        "percent_change": 0,
        "volume": 6800,
        "open_interest": 1089,
        "delta": -0.4846,
        "gamma": 0.0396,
        "theta": -0.3358,
        "vega": 0.3213
      }
    },
    {
      "strike": 636,
      "call": {
        "strike_price": 636,
        "option_type": "call",
        "iv": 0.134,
        "last_price": 5.08,
        "change": 0,
        "percent_change": 0,
        "volume": 7983,
        "open_interest": 2351,
        "delta": 0.5539,
        "gamma": 0.0367,
        "theta": -0.3938,
        "vega": 0.3204
      },
      "put": {
        "strike_price": 636,
        "option_type": "put",
        "iv": 0.1284,
        "last_price": 3.54,
        "change": 0,
        "percent_change": 0,
        "volume": 5340,
        "open_interest": 1581,
        "delta": -0.4463,
        "gamma": 0.0386,
        "theta": -0.3307,
        "vega": 0.3203
      }
    },
    {
      "strike": 635,
      "call": {
        "strike_price": 635,
        "option_type": "call",
        "iv": 0.1357,
        "last_price": 5.75,
        "change": 0,
        "percent_change": 0,
        "volume": 11503,
        "open_interest": 4448,
        "delta": 0.589,
        "gamma": 0.0355,
        "theta": -0.3929,
        "vega": 0.3194
      },
      "put": {
        "strike_price": 635,
        "option_type": "put",
        "iv": 0.1303,
        "last_price": 3.18,
        "change": 0,
        "percent_change": 0,
        "volume": 16431,
        "open_interest": 2371,
        "delta": -0.4096,
        "gamma": 0.0372,
        "theta": -0.3301,
        "vega": 0.3193
      }
    },
    {
      "strike": 634,
      "call": {
        "strike_price": 634,
        "option_type": "call",
        "iv": 0.1384,
        "last_price": 6.3,
        "change": 0,
        "percent_change": 0,
        "volume": 2062,
        "open_interest": 1924,
        "delta": 0.6224,
        "gamma": 0.0342,
        "theta": -0.3947,
        "vega": 0.3184
      },
      "put": {
        "strike_price": 634,
        "option_type": "put",
        "iv": 0.1329,
        "last_price": 2.85,
        "change": 0,
        "percent_change": 0,
        "volume": 8100,
        "open_interest": 2349,
        "delta": -0.3747,
        "gamma": 0.0357,
        "theta": -0.3317,
        "vega": 0.3183
      }
    },
    {
      "strike": 633,
      "call": {
        "strike_price": 633,
        "option_type": "call",
        "iv": 0.1424,
        "last_price": 7.19,
        "change": 0,
        "percent_change": 0,
        "volume": 842,
        "open_interest": 1729,
        "delta": 0.6532,
        "gamma": 0.0326,
        "theta": -0.3999,
        "vega": 0.3176
      },
      "put": {
        "strike_price": 633,
        "option_type": "put",
        "iv": 0.1366,
        "last_price": 2.56,
        "change": 0,
        "percent_change": 0,
        "volume": 2595,
        "open_interest": 5712,
        "delta": -0.3424,
        "gamma": 0.0341,
        "theta": -0.3355,
        "vega": 0.2862
      }
    },
    {
      "strike": 632,
      "call": {
        "strike_price": 632,
        "option_type": "call",
        "iv": 0.1438,
        "last_price": 7.85,
        "change": 0,
        "percent_change": 0,
        "volume": 822,
        "open_interest": 8634,
        "delta": 0.6819,
        "gamma": 0.031,
        "theta": -0.3893,
        "vega": 0.2771
      },
      "put": {
        "strike_price": 632,
        "option_type": "put",
        "iv": 0.1372,
        "last_price": 2.33,
        "change": 0,
        "percent_change": 0,
        "volume": 2786,
        "open_interest": 1993,
        "delta": -0.3119,
        "gamma": 0.0322,
        "theta": -0.3215,
        "vega": 0.2771
      }
    },
    {
      "strike": 631,
      "call": {
        "strike_price": 631,
        "option_type": "call",
        "iv": 0.1453,
        "last_price": 8.46,
        "change": 0,
        "percent_change": 0,
        "volume": 413,
        "open_interest": 1089,
        "delta": 0.7092,
        "gamma": 0.0292,
        "theta": -0.378,
        "vega": 0.2763
      },
      "put": {
        "strike_price": 631,
        "option_type": "put",
        "iv": 0.1389,
        "last_price": 2.08,
        "change": 0,
        "percent_change": 0,
        "volume": 1960,
        "open_interest": 1603,
        "delta": -0.2835,
        "gamma": 0.0303,
        "theta": -0.3106,
        "vega": 0.2761
      }
    },
    {
      "strike": 630,
      "call": {
        "strike_price": 630,
        "option_type": "call",
        "iv": 0.1477,
        "last_price": 9.28,
        "change": 0,
        "percent_change": 0,
        "volume": 1849,
        "open_interest": 5440,
        "delta": 0.7348,
        "gamma": 0.0275,
        "theta": -0.3695,
        "vega": 0.2757
      },
      "put": {
        "strike_price": 630,
        "option_type": "put",
        "iv": 0.1413,
        "last_price": 1.82,
        "change": 0,
        "percent_change": 0,
        "volume": 13829,
        "open_interest": 6814,
        "delta": -0.2568,
        "gamma": 0.0284,
        "theta": -0.302,
        "vega": 0.2753
      }
    },
    {
      "strike": 629,
      "call": {
        "strike_price": 629,
        "option_type": "call",
        "iv": 0.1511,
        "last_price": 10.16,
        "change": 0,
        "percent_change": 0,
        "volume": 432,
        "open_interest": 1844,
        "delta": 0.7581,
        "gamma": 0.0257,
        "theta": -0.3637,
        "vega": 0.2751
      },
      "put": {
        "strike_price": 629,
        "option_type": "put",
        "iv": 0.1448,
        "last_price": 1.62,
        "change": 0,
        "percent_change": 0,
        "volume": 2670,
        "open_interest": 2822,
        "delta": -0.2329,
        "gamma": 0.0265,
        "theta": -0.2968,
        "vega": 0.2747
      }
    },
    {
      "strike": 628,
      "call": {
        "strike_price": 628,
        "option_type": "call",
        "iv": 0.1554,
        "last_price": 11.03,
        "change": 0,
        "percent_change": 0,
        "volume": 744,
        "open_interest": 3932,
        "delta": 0.7789,
        "gamma": 0.024,
        "theta": -0.3606,
        "vega": 0.2746
      },
      "put": {
        "strike_price": 628,
        "option_type": "put",
        "iv": 0.1474,
        "last_price": 1.45,
        "change": 0,
        "percent_change": 0,
        "volume": 3294,
        "open_interest": 5260,
        "delta": -0.2108,
        "gamma": 0.0246,
        "theta": -0.2866,
        "vega": 0.2102
      }
    },
    {
      "strike": 627,
      "call": {
        "strike_price": 627,
        "option_type": "call",
        "iv": 0.1568,
        "last_price": 11.8,
        "change": 0,
        "percent_change": 0,
        "volume": 97,
        "open_interest": 1149,
        "delta": 0.7981,
        "gamma": 0.0224,
        "theta": -0.345,
        "vega": 0.2095
      },
      "put": {
        "strike_price": 627,
        "option_type": "put",
        "iv": 0.1485,
        "last_price": 1.33,
        "change": 0,
        "percent_change": 0,
        "volume": 3523,
        "open_interest": 3197,
        "delta": -0.1906,
        "gamma": 0.0228,
        "theta": -0.2695,
        "vega": 0.2091
      }
    }
  ],
  "underlying_price": 637.1
}