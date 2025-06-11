
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

// For individual option contract details (streamlined based on snapshotOptionChain)
export interface StreamlinedOptionContract {
  strike_price: number;
  option_type: 'call' | 'put'; 
  contract_name?: string; 
  primary_exchange?: string;
  underlying_ticker?: string; 

  // Fields from Polygon's SnapshotOptionContract (result items from snapshotOptionChain)
  iv?: number | null;                 // from result.implied_volatility
  last_price?: number | null;         // from result.day.close (snapshot uses day.close)
  change?: number | null;             // from result.day.change
  percent_change?: number | null;     // from result.day.change_percent
  volume?: number | null;             // from result.day.volume
  open_interest?: number | null;      // from result.open_interest
  break_even_price?: number | null;   // from result.details.break_even_price

  // Greeks from result.greeks
  delta?: number | null;
  gamma?: number | null;
  theta?: number | null;
  vega?: number | null;
  rho?: number | null; // Often not present or less critical for display

  // Bid/Ask are NOT typically in snapshotOptionChain results directly.
  // If needed, they would come from a quotes endpoint. For now, mark as optional/nullable.
  bid?: number | null;
  ask?: number | null;
  bid_size?: number | null;
  ask_size?: number | null;
  
  [key: string]: any; 
}


// Representing a row in the options chain table as designed
export interface OptionsTableRow {
  call?: StreamlinedOptionContract; // Changed from Partial to allow full object or undefined
  strike: number;
  put?: StreamlinedOptionContract; // Changed from Partial
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
  ticker: string; 
  marketStatus?: MarketStatusData | { error?: string; rawErrorDetails?: any };
  stockSnapshot?: StockSnapshotData | { error?: string; rawErrorDetails?: any };
  technicalIndicators?: TechnicalIndicatorsData | { error?: string; rawErrorDetails?: any };
  optionsChain?: OptionsChainData | { error?: string; rawErrorDetails?: any };
  error?: string; 
  rawOverallError?: any;
  [key: string]: any;
}

// Output from the data source adapter
export interface AdapterOutput {
  stockData: StockDataPackage; 
  rawRequestParams?: any; 
  rawResponse?: any; 
}
