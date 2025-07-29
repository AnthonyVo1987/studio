"use client";

/**
 * @fileOverview Base Standard TA Display Template
 * 
 * This template displays standard technical analysis data for any ticker.
 * It shows RSI, SMA, EMA, MACD and other technical indicators.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart } from "lucide-react";

import type { TickerConfig, TickerContextResult } from '../../types';

interface BaseStandardTaDisplayProps<T extends TickerConfig> {
  config: T;
  context: TickerContextResult<T>;
}

interface TechnicalIndicator {
  label: string;
  value: string | null;
  signal?: "bullish" | "bearish" | "neutral";
}

const renderIndicatorRow = (indicator: TechnicalIndicator, isLoading: boolean, ticker: string) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-${ticker.toLowerCase()}-ta-${indicator.label}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for {ticker} technical analysis...
        </TableCell>
      </TableRow>
    );
  }
  
  const signalColors = {
    bullish: "text-green-600",
    bearish: "text-red-600",
    neutral: "text-gray-600",
  };
  
  return (
    <TableRow key={indicator.label}>
      <TableCell className="font-medium w-1/2">{indicator.label}</TableCell>
      <TableCell>
        <div className="flex items-center justify-between">
          <span className={indicator.signal ? signalColors[indicator.signal] : ""}>
            {indicator.value ?? "N/A"}
          </span>
          {indicator.signal && (
            <Badge 
              variant={indicator.signal === "bullish" ? "default" : indicator.signal === "bearish" ? "destructive" : "secondary"}
              className="ml-2"
            >
              {indicator.signal}
            </Badge>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export function BaseStandardTaDisplay<T extends TickerConfig>({
  config,
  context,
}: BaseStandardTaDisplayProps<T>) {
  const state = context.hooks.useState();

  // Safe JSON parsing for technical analysis data
  const taData = state.standardTasJson ? (() => {
    try {
      const parsed = JSON.parse(state.standardTasJson);
      const results = parsed.results || {};
      
      return {
        // RSI (Relative Strength Index)
        rsi14: results.rsi_14 || results.RSI_14 || null,
        rsi14Signal: results.rsi_14 ? (results.rsi_14 > 70 ? "bearish" : results.rsi_14 < 30 ? "bullish" : "neutral") : null,
        
        // Moving Averages
        sma20: results.sma_20 || results.SMA_20 || null,
        sma50: results.sma_50 || results.SMA_50 || null,
        sma200: results.sma_200 || results.SMA_200 || null,
        ema20: results.ema_20 || results.EMA_20 || null,
        ema50: results.ema_50 || results.EMA_50 || null,
        
        // MACD
        macd: results.macd || results.MACD || null,
        macdSignal: results.macd_signal || results.MACD_signal || null,
        macdHistogram: results.macd_histogram || results.MACD_histogram || null,
        
        // Bollinger Bands
        bbUpper: results.bb_upper || results.BB_upper || null,
        bbMiddle: results.bb_middle || results.BB_middle || null,
        bbLower: results.bb_lower || results.BB_lower || null,
        
        // Additional Indicators
        atr14: results.atr_14 || results.ATR_14 || null,
        adx14: results.adx_14 || results.ADX_14 || null,
        stochK: results.stoch_k || results.STOCH_K || null,
        stochD: results.stoch_d || results.STOCH_D || null,
        
        // Volume indicators
        obv: results.obv || results.OBV || null,
        vwap: results.vwap || results.VWAP || null,
        
        isDataReady: state.dataRetrievalComplete
      };
    } catch (e) {
      return {
        rsi14: null,
        rsi14Signal: null,
        sma20: null,
        sma50: null,
        sma200: null,
        ema20: null,
        ema50: null,
        macd: null,
        macdSignal: null,
        macdHistogram: null,
        bbUpper: null,
        bbMiddle: null,
        bbLower: null,
        atr14: null,
        adx14: null,
        stochK: null,
        stochD: null,
        obv: null,
        vwap: null,
        isDataReady: false
      };
    }
  })() : {
    rsi14: null,
    rsi14Signal: null,
    sma20: null,
    sma50: null,
    sma200: null,
    ema20: null,
    ema50: null,
    macd: null,
    macdSignal: null,
    macdHistogram: null,
    bbUpper: null,
    bbMiddle: null,
    bbLower: null,
    atr14: null,
    adx14: null,
    stochK: null,
    stochD: null,
    obv: null,
    vwap: null,
    isDataReady: false
  };

  // Derive loading state from FSM state and data availability
  const isLoading = state.status === 'loading' || !state.dataRetrievalComplete;

  const formatNumber = (value: number | null, decimals: number = 2) => {
    if (value === null) return null;
    return value.toFixed(decimals);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Group indicators by category
  const momentumIndicators: TechnicalIndicator[] = [
    { 
      label: "RSI (14)", 
      value: formatNumber(taData.rsi14), 
      signal: taData.rsi14Signal as "bullish" | "bearish" | "neutral" | undefined
    },
    { 
      label: "MACD", 
      value: formatNumber(taData.macd, 4)
    },
    { 
      label: "MACD Signal", 
      value: formatNumber(taData.macdSignal, 4)
    },
    { 
      label: "MACD Histogram", 
      value: formatNumber(taData.macdHistogram, 4)
    },
    { 
      label: "Stochastic %K", 
      value: formatNumber(taData.stochK)
    },
    { 
      label: "Stochastic %D", 
      value: formatNumber(taData.stochD)
    },
  ];

  const movingAverages: TechnicalIndicator[] = [
    { label: "SMA (20)", value: formatCurrency(taData.sma20) },
    { label: "SMA (50)", value: formatCurrency(taData.sma50) },
    { label: "SMA (200)", value: formatCurrency(taData.sma200) },
    { label: "EMA (20)", value: formatCurrency(taData.ema20) },
    { label: "EMA (50)", value: formatCurrency(taData.ema50) },
  ];

  const volatilityIndicators: TechnicalIndicator[] = [
    { label: "Bollinger Upper", value: formatCurrency(taData.bbUpper) },
    { label: "Bollinger Middle", value: formatCurrency(taData.bbMiddle) },
    { label: "Bollinger Lower", value: formatCurrency(taData.bbLower) },
    { label: "ATR (14)", value: formatNumber(taData.atr14) },
    { label: "ADX (14)", value: formatNumber(taData.adx14) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-4 w-4" />
          {config.ticker} Standard Technical Analysis
        </CardTitle>
        <CardDescription>
          Key technical indicators and moving averages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Momentum Indicators */}
          <div>
            <h4 className="text-sm font-medium mb-3">Momentum Indicators</h4>
            <Table>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                      Loading {config.ticker} momentum indicators...
                    </TableCell>
                  </TableRow>
                ) : (
                  momentumIndicators.map(indicator => renderIndicatorRow(indicator, false, config.ticker))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Moving Averages */}
          <div>
            <h4 className="text-sm font-medium mb-3">Moving Averages</h4>
            <Table>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                      Loading {config.ticker} moving averages...
                    </TableCell>
                  </TableRow>
                ) : (
                  movingAverages.map(indicator => renderIndicatorRow(indicator, false, config.ticker))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Volatility Indicators */}
          <div>
            <h4 className="text-sm font-medium mb-3">Volatility & Trend</h4>
            <Table>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                      Loading {config.ticker} volatility indicators...
                    </TableCell>
                  </TableRow>
                ) : (
                  volatilityIndicators.map(indicator => renderIndicatorRow(indicator, false, config.ticker))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}