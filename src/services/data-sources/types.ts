/**
 * @fileOverview Type definitions for data retrieved from stock data sources.
 */

// For individual stock tick/aggregate data, often part of snapshots
export interface StockPriceData {
  o: number; // Open price
  h: number; // High price
  l: number; // Low price
  c: number; // Close price
  v: number; // Volume
  vw?: number; // Volume weighted average price
  t?: number; // Timestamp (epoch ms)
  n?: number; // Number of transactions
}

// For market status
export interface MarketStatusData {
  market: string; // e.g., "株式市場" (Japanese for "stock market") or "extended hours"
  earlyHours: boolean;
  lateHours: boolean;
  serverTime: string; // ISO string or formatted time
  exchanges: Record<string, string>; // e.g., { "nasdaq": "open", "nyse": "closed" }
  currencies?: Record<string, string>; // e.g., { "fx": "open", "crypto": "open" }
  [key: string]: any; // For any other fields
}

// For stock snapshot data (current and previous day)
export interface StockSnapshotData {
  ticker: string;
  day: StockPriceData; // Current day's aggregates
  prevDay: StockPriceData; // Previous day's aggregates
  todaysChange?: number;
  todaysChangePerc?: number;
  updated?: number; // Last update timestamp
  [key: string]: any; // For any other fields
}

// For technical indicators
export interface TechnicalIndicatorsData {
  RSI?: { value: number; [key: string]: any };
  EMA?: { value: number; [key: string]: any };
  SMA?: { value: number; [key: string]: any };
  MACD?: { value: number; signal?: number; histogram?: number; [key: string]: any };
  VWAP?: { value: number; [key: string]: any }; // Often from snapshot
  [key: string]: any; // For other indicators
}

// For individual option contract details (streamlined)
export interface StreamlinedOptionContract {
  strike_price: number;
  option_type: 'call' | 'put'; // To differentiate if not clear from context
  // Fields present in the UI:
  gamma?: number | null;
  iv?: number | null; // Implied Volatility
  percent_change?: number | null; // % Chg
  bid?: number | null;
  ask?: number | null;
  last_price?: number | null; // Last
  volume?: number | null;
  open_interest?: number | null;
  delta?: number | null;
  // Other potentially useful fields (not directly in PRD table, but common)
  theta?: number | null;
  vega?: number | null;
  rho?: number | null;
  bid_size?: number | null;
  ask_size?: number | null;
  change?: number | null; // Absolute change
  contract_name?: string; // Full contract name if needed for debugging or display
  primary_exchange?: string;
  underlying_ticker?: string; // Re-added for context if needed, PRD said remove underlying_asset object
  break_even_price?: number | null;
  [key: string]: any; // For flexibility
}


// Representing a row in the options chain table as designed
export interface OptionsTableRow {
  call?: Partial<StreamlinedOptionContract>;
  strike: number;
  put?: Partial<StreamlinedOptionContract>;
}

// For the entire options chain for a specific expiration
export interface OptionsChainData {
  ticker: string;
  expiration_date: string; // YYYY-MM-DD
  contracts: OptionsTableRow[]; // Sorted by strike price descending
  underlying_price?: number; // Price of the underlying asset at the time of fetch
  [key: string]: any;
}

// Comprehensive structure for all fetched stock data
export interface StockDataPackage {
  marketStatus?: MarketStatusData;
  stockSnapshot?: StockSnapshotData;
  technicalIndicators?: TechnicalIndicatorsData;
  optionsChain?: OptionsChainData;
  [key: string]: any;
}

// Output from the data source adapter
export interface AdapterOutput {
  stockData: StockDataPackage; // All data packaged together
  rawRequestParams?: any; // Optional: Log of params sent to API
  rawResponse?: any; // Optional: Full raw response from API
}
