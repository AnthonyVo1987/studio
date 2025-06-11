
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
  market: string; // e.g., "stocks" or "extended-hours"
  earlyHours?: boolean;
  lateHours?: boolean;
  serverTime?: string; // ISO string or formatted time
  exchanges?: Record<string, string>; // e.g., { "nasdaq": "open", "nyse": "closed" }
  currencies?: Record<string, string>; // e.g., { "fx": "open", "crypto": "open" }
  [key: string]: any; // For any other fields
}

// For stock snapshot data (current and previous day)
export interface StockSnapshotData {
  ticker: string;
  day: StockPriceData;
  prevDay: StockPriceData;
  todaysChange?: number;
  todaysChangePerc?: number;
  updated?: number; // Last update timestamp (epoch ns from Polygon)
  currentPrice?: number; // Added for convenience
  [key: string]: any; // For any other fields
}

// For technical indicators
export interface TechnicalIndicatorValue {
  value?: number;
  [key: string]: any; // For other fields like signal, histogram for MACD
}
export interface TechnicalIndicatorsData {
  RSI?: TechnicalIndicatorValue;
  EMA?: TechnicalIndicatorValue;
  SMA?: TechnicalIndicatorValue;
  MACD?: TechnicalIndicatorValue & { signal?: number; histogram?: number };
  VWAP?: TechnicalIndicatorValue; 
  [key: string]: any; 
}

// For individual option contract details (streamlined)
export interface StreamlinedOptionContract {
  strike_price: number;
  option_type: 'call' | 'put'; 
  gamma?: number | null;
  iv?: number | null; 
  percent_change?: number | null; 
  bid?: number | null;
  ask?: number | null;
  last_price?: number | null; 
  volume?: number | null;
  open_interest?: number | null;
  delta?: number | null;
  theta?: number | null;
  vega?: number | null;
  rho?: number | null;
  bid_size?: number | null;
  ask_size?: number | null;
  change?: number | null; 
  contract_name?: string; 
  primary_exchange?: string;
  underlying_ticker?: string; 
  break_even_price?: number | null;
  [key: string]: any; 
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
  ticker: string; // Ensure ticker is always present at the top level
  marketStatus?: MarketStatusData | { error?: string; rawErrorDetails?: any };
  stockSnapshot?: StockSnapshotData | { error?: string; rawErrorDetails?: any };
  technicalIndicators?: TechnicalIndicatorsData | { error?: string; rawErrorDetails?: any };
  optionsChain?: OptionsChainData | { error?: string; rawErrorDetails?: any };
  error?: string; // Top-level error for the entire package if something catastrophic happens
  rawOverallError?: any;
  [key: string]: any;
}

// Output from the data source adapter
export interface AdapterOutput {
  stockData: StockDataPackage; 
  rawRequestParams?: any; 
  rawResponse?: any; 
}
