"use client";

/**
 * @fileOverview User Ticker Key Metrics Display - Dynamic Ticker Component
 * 
 * This component is ticker-agnostic and works with any ticker symbol from
 * the user-ticker-analysis-context. It displays key financial metrics for
 * the currently selected ticker.
 * 
 * ARCHITECTURE PATTERN:
 * - Direct context consumption via useUserTickerAnalysis hook
 * - Safe JSON parsing with error handling
 * - Loading state derivation from FSM and data flags
 * - Dynamic ticker display with proper fallback handling
 * - Consistent error handling for cases with no ticker set
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// User Ticker Context
import { useUserTickerAnalysis } from "@/contexts/user-ticker-analysis-context";

interface MetricItem {
  label: string;
  value: string | number | null;
  change?: number | null;
  isPercentage?: boolean;
}

const formatValue = (value: any, isPercentage = false): string => {
  if (value === null || value === undefined) return "N/A";
  
  if (typeof value === 'number') {
    if (isPercentage) {
      return `${value.toFixed(2)}%`;
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  return String(value);
};

const renderMetricRow = (item: MetricItem, index: number, isLoading: boolean, ticker: string) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-user-ticker-metrics-${index}`}>
        <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
          {ticker ? `Loading ${ticker} metrics...` : 'Loading metrics...'}
        </TableCell>
      </TableRow>
    );
  }

  const TrendIcon = item.change && item.change > 0 
    ? TrendingUp 
    : item.change && item.change < 0 
    ? TrendingDown 
    : Minus;

  const trendColor = item.change && item.change > 0 
    ? "text-green-600" 
    : item.change && item.change < 0 
    ? "text-red-600" 
    : "text-gray-500";

  return (
    <TableRow key={item.label}>
      <TableCell className="font-medium w-1/3">{item.label}</TableCell>
      <TableCell>{formatValue(item.value, item.isPercentage)}</TableCell>
      <TableCell className="text-right">
        {item.change !== undefined && item.change !== null && (
          <div className={`flex items-center justify-end gap-1 ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span className="text-sm">
              {formatValue(item.change, item.isPercentage)}
            </span>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

export function UserTickerKeyMetricsDisplay() {
  const userTickerState = useUserTickerAnalysis();

  // Get current ticker for display
  const currentTicker = userTickerState.currentTicker || '';
  const displayTicker = currentTicker || 'No Ticker Selected';

  // Safe JSON parsing pattern following actual Polygon API structure
  const stockData = userTickerState.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(userTickerState.stockSnapshotJson);
      const result = parsed.results?.[0] || {};
      
      return {
        ticker: result.ticker || currentTicker,
        price: result.value || null,
        change: result.change || null,
        changePercent: result.changePercent || null,
        volume: result.day?.volume || result.volume || null,
        high: result.day?.high || result.high || null,
        low: result.day?.low || result.low || null,
        open: result.day?.open || result.open || null,
        close: result.day?.close || result.close || result.previousClose || null,
        marketCap: result.marketCap || null,
        pe: result.pe || null,
        dividend: result.dividend || null,
        isDataReady: userTickerState.dataRetrievalComplete
      };
    } catch (e) {
      return {
        ticker: currentTicker,
        price: null,
        change: null,
        changePercent: null,
        volume: null,
        high: null,
        low: null,
        open: null,
        close: null,
        marketCap: null,
        pe: null,
        dividend: null,
        isDataReady: false
      };
    }
  })() : {
    ticker: currentTicker,
    price: null,
    change: null,
    changePercent: null,
    volume: null,
    high: null,
    low: null,
    open: null,
    close: null,
    marketCap: null,
    pe: null,
    dividend: null,
    isDataReady: false
  };

  // Derive loading state from FSM state and data availability
  const isLoading = userTickerState.status === 'loading' || 
                   (currentTicker && userTickerState.isTickerValid && !userTickerState.dataRetrievalComplete);

  const keyMetrics: MetricItem[] = [
    { label: "Current Price", value: stockData.price, change: stockData.change },
    { label: "Change %", value: stockData.changePercent, isPercentage: true },
    { label: "Day High", value: stockData.high },
    { label: "Day Low", value: stockData.low },
    { label: "Open", value: stockData.open },
    { label: "Previous Close", value: stockData.close },
    { label: "Volume", value: stockData.volume },
    { label: "Market Cap", value: stockData.marketCap },
    { label: "P/E Ratio", value: stockData.pe },
    { label: "Dividend", value: stockData.dividend },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {displayTicker} Key Metrics
        </CardTitle>
        <CardDescription>
          {currentTicker 
            ? `Financial metrics and trading data for ${currentTicker}`
            : "Select a ticker symbol to view key metrics"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {stockData.change !== null && (
              <Badge variant={stockData.change >= 0 ? "default" : "destructive"}>
                {stockData.change >= 0 ? "Positive" : "Negative"}
              </Badge>
            )}
            {isLoading && (
              <Badge variant="outline">Loading...</Badge>
            )}
            {!currentTicker && (
              <Badge variant="outline">No Ticker</Badge>
            )}
            {currentTicker && !userTickerState.isTickerValid && (
              <Badge variant="destructive">Invalid Ticker</Badge>
            )}
          </div>

          {/* Key Metrics Table */}
          <Table>
            <TableBody>
              {keyMetrics.map((item, index) => renderMetricRow(item, index, isLoading, currentTicker))}
            </TableBody>
          </Table>

          {/* Error State */}
          {userTickerState.tickerValidationError && (
            <div className="text-sm text-destructive">
              {userTickerState.tickerValidationError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}