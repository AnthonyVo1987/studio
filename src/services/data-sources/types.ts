
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
  vw?: number | null; // Volume weighted average price
  t?: number | null; // Timestamp (epoch ms)
  n?: number | null; // Number of transactions
}

// For market status
export interface MarketStatusData {
  market: string; // e.g., "stocks" or "extended-hours"
  earlyHours?: boolean;
  lateHours?: boolean;
  serverTime?: string | null; // ISO string or formatted time
  exchanges?: Record<string, string>; // e.g., { "nasdaq": "open", "nyse": "closed" }
  currencies?: Record<string, string>; // e.g., { "fx": "open", "crypto": "open" }
  [key: string]: any; // For any other fields
}

// For stock snapshot data (current and previous day)
export interface StockSnapshotData {
  ticker: string;
  day: StockPriceData;
  prevDay: StockPriceData;
  todaysChange?: number | null;
  todaysChangePerc?: number | null;
  updated?: number | null; // Last update timestamp (epoch ns from Polygon)
  currentPrice?: number | null; 
  [key: string]: any; 
}

// For technical indicators
export interface TechnicalIndicatorValue {
  value?: number | null;
  [key: string]: any; 
}
export interface TechnicalIndicatorsData {
  RSI?: TechnicalIndicatorValue;
  EMA?: TechnicalIndicatorValue;
  SMA?: TechnicalIndicatorValue;
  MACD?: TechnicalIndicatorValue & { signal?: number | null; histogram?: number | null };
  VWAP?: TechnicalIndicatorValue; 
  [key: string]: any; 
}

export interface StreamlinedOptionContract {
  strike_price: number;
  option_type: 'call' | 'put'; 
  // contract_name removed as per request
  // underlying_ticker removed as per request
  primary_exchange?: string | null; 

  iv?: number | null;                
  last_price?: number | null;        
  change?: number | null;            
  percent_change?: number | null;    
  volume?: number | null;            
  open_interest?: number | null;     
  break_even_price?: number | null;  

  delta?: number | null;
  gamma?: number | null;
  theta?: number | null;
  vega?: number | null;
  rho?: number | null; 

  bid?: number | null;
  ask?: number | null;
  bid_size?: number | null;
  ask_size?: number | null;
  
  [key: string]: any; 
}


export interface OptionsTableRow {
  call?: StreamlinedOptionContract; 
  strike: number;
  put?: StreamlinedOptionContract; 
}

export interface OptionsChainData {
  ticker: string;
  expiration_date: string; // YYYY-MM-DD
  contracts: OptionsTableRow[]; 
  underlying_price?: number | null; 
  [key: string]: any;
}

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

export interface AdapterOutput {
  stockData: StockDataPackage; 
  rawRequestParams?: any; 
  rawResponse?: any; 
}
