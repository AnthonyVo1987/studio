"use client";

/**
 * @fileOverview Base Stock Snapshot Display Template
 * 
 * This template displays detailed stock snapshot data for any ticker.
 * It demonstrates safe JSON parsing and comprehensive data display.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar } from "lucide-react";

import type { TickerConfig, TickerContextResult } from '../../types';

interface BaseStockSnapshotDisplayProps<T extends TickerConfig> {
  config: T;
  context: TickerContextResult<T>;
}

interface SnapshotDetailItem {
  label: string;
  value: string | null;
  variant?: "default" | "highlight";
}

const renderDetailRow = (item: SnapshotDetailItem, isLoading: boolean, ticker: string) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-${ticker.toLowerCase()}-snapshot-${item.label}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for {ticker} stock data...
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow key={item.label}>
      <TableCell className="font-medium w-1/2">{item.label}</TableCell>
      <TableCell className={item.variant === "highlight" ? "font-semibold" : ""}>
        {item.value ?? "N/A"}
      </TableCell>
    </TableRow>
  );
};

export function BaseStockSnapshotDisplay<T extends TickerConfig>({
  config,
  context,
}: BaseStockSnapshotDisplayProps<T>) {
  const state = context.hooks.useState();

  // Safe JSON parsing following actual Polygon API ticker structure
  const stockData = state.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(state.stockSnapshotJson);
      const ticker = parsed.results?.[0] || {};
      const prevDay = ticker.prevDay || {};
      
      return {
        // Core Data
        symbol: ticker.T || config.ticker,
        currentPrice: ticker.c || 0,
        previousClose: prevDay.c || ticker.pc || 0,
        openPrice: ticker.o || 0,
        dayHigh: ticker.h || 0,
        dayLow: ticker.l || 0,
        volume: ticker.v || 0,
        vwap: ticker.vw || 0,
        
        // Previous Day Data
        prevDayOpen: prevDay.o || 0,
        prevDayHigh: prevDay.h || 0,
        prevDayLow: prevDay.l || 0,
        prevDayVolume: prevDay.v || 0,
        prevDayVWAP: prevDay.vw || 0,
        
        // Timestamp
        timestamp: ticker.t || ticker.updated || new Date().getTime(),
        
        // Change calculations
        priceChange: (ticker.c || 0) - (prevDay.c || ticker.pc || 0),
        priceChangePercent: prevDay.c || ticker.pc ? 
          (((ticker.c || 0) - (prevDay.c || ticker.pc || 0)) / (prevDay.c || ticker.pc || 1)) * 100 : 0,
        
        isDataReady: state.dataRetrievalComplete
      };
    } catch (e) {
      return {
        symbol: config.ticker,
        currentPrice: 0,
        previousClose: 0,
        openPrice: 0,
        dayHigh: 0,
        dayLow: 0,
        volume: 0,
        vwap: 0,
        prevDayOpen: 0,
        prevDayHigh: 0,
        prevDayLow: 0,
        prevDayVolume: 0,
        prevDayVWAP: 0,
        timestamp: new Date().getTime(),
        priceChange: 0,
        priceChangePercent: 0,
        isDataReady: false
      };
    }
  })() : {
    symbol: config.ticker,
    currentPrice: 0,
    previousClose: 0,
    openPrice: 0,
    dayHigh: 0,
    dayLow: 0,
    volume: 0,
    vwap: 0,
    prevDayOpen: 0,
    prevDayHigh: 0,
    prevDayLow: 0,
    prevDayVolume: 0,
    prevDayVWAP: 0,
    timestamp: new Date().getTime(),
    priceChange: 0,
    priceChangePercent: 0,
    isDataReady: false
  };

  // Derive loading state from FSM state and data availability
  const isLoading = state.status === 'loading' || !state.dataRetrievalComplete;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const isPositive = stockData.priceChange >= 0;

  const currentDayDetails: SnapshotDetailItem[] = [
    { label: "Current Price", value: formatCurrency(stockData.currentPrice), variant: "highlight" },
    { label: "Open", value: formatCurrency(stockData.openPrice) },
    { label: "High", value: formatCurrency(stockData.dayHigh) },
    { label: "Low", value: formatCurrency(stockData.dayLow) },
    { label: "Volume", value: formatNumber(stockData.volume) },
    { label: "VWAP", value: stockData.vwap ? formatCurrency(stockData.vwap) : null },
  ];

  const previousDayDetails: SnapshotDetailItem[] = [
    { label: "Previous Close", value: formatCurrency(stockData.previousClose), variant: "highlight" },
    { label: "Previous Open", value: formatCurrency(stockData.prevDayOpen) },
    { label: "Previous High", value: formatCurrency(stockData.prevDayHigh) },
    { label: "Previous Low", value: formatCurrency(stockData.prevDayLow) },
    { label: "Previous Volume", value: formatNumber(stockData.prevDayVolume) },
    { label: "Previous VWAP", value: stockData.prevDayVWAP ? formatCurrency(stockData.prevDayVWAP) : null },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {config.ticker} Stock Snapshot
        </CardTitle>
        <CardDescription>
          Comprehensive stock data and trading statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Price Change Summary */}
          {!isLoading && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant={isPositive ? "default" : "destructive"}>
                  {formatCurrency(Math.abs(stockData.priceChange))}
                </Badge>
                <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(stockData.priceChangePercent)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatTimestamp(stockData.timestamp)}
              </div>
            </div>
          )}

          {/* Current Day Data */}
          <div>
            <h4 className="text-sm font-medium mb-3">Current Trading Day</h4>
            <Table>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                      Loading {config.ticker} snapshot data...
                    </TableCell>
                  </TableRow>
                ) : (
                  currentDayDetails.map(item => renderDetailRow(item, false, config.ticker))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Previous Day Data */}
          <div>
            <h4 className="text-sm font-medium mb-3">Previous Trading Day</h4>
            <Table>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                      Loading previous day data...
                    </TableCell>
                  </TableRow>
                ) : (
                  previousDayDetails.map(item => renderDetailRow(item, false, config.ticker))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}