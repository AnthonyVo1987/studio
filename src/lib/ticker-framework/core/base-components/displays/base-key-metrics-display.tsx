"use client";

/**
 * @fileOverview Base Key Metrics Display Template
 * 
 * This template displays key financial metrics for any ticker.
 * It demonstrates safe JSON parsing and ticker-agnostic design.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

import type { TickerConfig, TickerContextResult } from '../../types';

interface BaseKeyMetricsDisplayProps<T extends TickerConfig> {
  config: T;
  context: TickerContextResult<T>;
}

export function BaseKeyMetricsDisplay<T extends TickerConfig>({
  config,
  context,
}: BaseKeyMetricsDisplayProps<T>) {
  const state = context.hooks.useState();

  // Safe JSON parsing following actual Polygon API ticker structure
  const stockData = state.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(state.stockSnapshotJson);
      const ticker = parsed.results?.[0] || {};
      return {
        // Ticker Info
        symbol: ticker.T || config.ticker,
        
        // Price Data (from ticker snapshot)
        currentPrice: ticker.c || 0,
        previousClose: ticker.pc || ticker.prevDay?.c || 0,
        openPrice: ticker.o || 0,
        dayHigh: ticker.h || 0,
        dayLow: ticker.l || 0,
        volume: ticker.v || 0,
        
        // Calculate change and change percentage
        priceChange: (ticker.c || 0) - (ticker.pc || ticker.prevDay?.c || 0),
        priceChangePercent: ticker.pc || ticker.prevDay?.c ? 
          (((ticker.c || 0) - (ticker.pc || ticker.prevDay?.c || 0)) / (ticker.pc || ticker.prevDay?.c || 1)) * 100 : 0,
        
        // Additional fields that might be available
        vwap: ticker.vw || ticker.prevDay?.vw || 0,
        
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
        priceChange: 0,
        priceChangePercent: 0,
        vwap: 0,
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
    priceChange: 0,
    priceChangePercent: 0,
    vwap: 0,
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

  const isPositive = stockData.priceChange >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.ticker} Key Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Price and Change */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {isLoading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  formatCurrency(stockData.currentPrice)
                )}
              </p>
              <p className="text-sm text-muted-foreground">Current Price</p>
            </div>
            {!isLoading && (
              <div className="text-right">
                <Badge variant={isPositive ? "default" : "destructive"} className="flex items-center gap-1">
                  {isPositive ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                  {formatCurrency(Math.abs(stockData.priceChange))}
                </Badge>
                <p className={`text-sm mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(stockData.priceChangePercent)}
                </p>
              </div>
            )}
          </div>

          {/* Trading Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Day Range</p>
              <p className="font-medium">
                {isLoading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  `${formatCurrency(stockData.dayLow)} - ${formatCurrency(stockData.dayHigh)}`
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Previous Close</p>
              <p className="font-medium">
                {isLoading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  formatCurrency(stockData.previousClose)
                )}
              </p>
            </div>
          </div>

          {/* Volume and VWAP */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Volume</p>
              <p className="font-medium">
                {isLoading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  formatNumber(stockData.volume)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">VWAP</p>
              <p className="font-medium">
                {isLoading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : stockData.vwap ? (
                  formatCurrency(stockData.vwap)
                ) : (
                  "N/A"
                )}
              </p>
            </div>
          </div>

          {/* Open Price */}
          <div>
            <p className="text-sm text-muted-foreground">Open</p>
            <p className="font-medium">
              {isLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                formatCurrency(stockData.openPrice)
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}