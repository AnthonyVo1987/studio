
/**
 * @fileOverview Type definitions for data retrieved from stock data sources.
 */

export interface StockPriceData {
  o: number | null | undefined; 
  h: number | null | undefined; 
  l: number | null | undefined; 
  c: number | null | undefined; 
  v: number | null | undefined; 
  vw?: number | null | undefined; 
  t?: number | null | undefined; 
  n?: number | null | undefined; 
}

export interface MarketStatusData {
  market?: string | null; 
  earlyHours?: boolean | null;
  lateHours?: boolean | null;
  serverTime?: string | null; 
  exchanges?: Record<string, string> | null; 
  currencies?: Record<string, string> | null; 
  [key: string]: any; 
}

export interface StockSnapshotData {
  ticker?: string | null;
  day?: StockPriceData | null;
  prevDay?: StockPriceData | null;
  todaysChange?: number | null;
  todaysChangePerc?: number | null;
  updated?: number | null; 
  currentPrice?: number | null; 
  [key: string]: any; 
}

export interface TechnicalIndicatorValue {
  value?: number | null;
  [key: string]: any; 
}
export interface TechnicalIndicatorsData {
  RSI?: TechnicalIndicatorValue | null;
  EMA?: TechnicalIndicatorValue | null;
  SMA?: TechnicalIndicatorValue | null;
  MACD?: TechnicalIndicatorValue & { signal?: number | null; histogram?: number | null } | null;
  VWAP?: TechnicalIndicatorValue | null; 
  [key: string]: any; 
}

export interface StreamlinedOptionContract {
  strike_price: number;
  option_type: 'call' | 'put'; 
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
  call?: StreamlinedOptionContract | null; 
  strike: number;
  put?: StreamlinedOptionContract | null; 
}

export interface OptionsChainData {
  ticker?: string | null;
  expiration_date?: string | null; 
  contracts?: OptionsTableRow[] | null; 
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
  polygonAdapterDebugMessages?: string[]; // For adapter-specific debug logs
  [key: string]: any;
}

export interface AdapterOutput {
  stockData: StockDataPackage; 
  rawRequestParams?: any; // For high-level input to the adapter
  rawResponseSummary?: any; // For high-level output/error summary from the adapter
  polygonAdapterDebugMessages?: string[]; // For granular Polygon call logs
}
