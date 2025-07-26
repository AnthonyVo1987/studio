"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useStockAnalysis, BusinessFsmState } from "@/contexts/business-logic-context";
import { formatCurrency, formatPercentage, formatCompactNumber } from "@/lib/number-utils";
import { cn } from "@/lib/utils";

interface StockDetailItem {
  label: string;
  value: string | null;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-positive'; 
  if (sentiment === 'bearish') return 'text-destructive'; 
  return '';
};

const renderDetailRow = (item: StockDetailItem, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-snapshot-${index}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for stock data...
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow key={item.label}>
      <TableCell className="font-medium w-1/3">{item.label}</TableCell>
      <TableCell className={cn(getSentimentColorClass(item.sentiment))}>{item.value ?? "N/A"}</TableCell>
    </TableRow>
  );
};

interface StockSnapshotDetailsDisplayProps {
  // No props needed - component auto-updates when business context changes
}

export function StockSnapshotDetailsDisplay({}: StockSnapshotDetailsDisplayProps) {
  const business = useStockAnalysis();

  // Parse stock snapshot data directly from business context
  const stockData = business.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(business.stockSnapshotJson);
      if (parsed.results && parsed.results[0]) {
        const result = parsed.results[0];
        return {
          ticker: result.ticker || null,
          price: result.value || null,
          change: result.todaysChange || null,
          changePercent: result.todaysChangePerc || null,
          volume: result.volume || null,
          marketCap: result.market_cap ? `$${(result.market_cap / 1e9).toFixed(2)}B` : null,
          previousClose: result.prevDay?.c || null,
          isDataReady: true
        };
      }
    } catch (e) {}
    return { ticker: null, price: null, change: null, changePercent: null, volume: null, marketCap: null, previousClose: null, isDataReady: false };
  })() : { ticker: null, price: null, change: null, changePercent: null, volume: null, marketCap: null, previousClose: null, isDataReady: false };

  // Derive loading state from FSM
  const isLoading = business.fsmState === BusinessFsmState.LOADING || !stockData.isDataReady;

  // Calculate sentiment for changes
  const changeSentiment: 'bullish' | 'bearish' | 'neutral' = 
    stockData.change && stockData.change > 0 ? 'bullish' :
    stockData.change && stockData.change < 0 ? 'bearish' : 'neutral';

  // Build details array if data is ready
  const details: StockDetailItem[] = [];
  
  if (stockData.isDataReady) {
    details.push(
      { label: "Current Price", value: formatCurrency(stockData.price) },
      { label: "Today's Change %", value: formatPercentage(stockData.changePercent, "N/A", true, 2), sentiment: changeSentiment },
      { label: "Today's Change", value: formatCurrency(stockData.change, "$", "N/A"), sentiment: changeSentiment },
      { label: "Volume", value: formatCompactNumber(stockData.volume) },
      { label: "Previous Close", value: formatCurrency(stockData.previousClose) },
      { label: "Market Cap", value: stockData.marketCap || "N/A" }
    );
  }

  // Component auto-updates when business context changes (v4.0.0.7)
  // No individual refresh needed - data updates via main "Get Stock Data" button

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Snapshot Details</CardTitle>
        <CardDescription>Detailed price and volume information for {stockData.ticker || "the selected ticker"}. Updates automatically with stock data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => renderDetailRow({label: "", value: null}, index, true))
            ) : details.length > 0 ? (
              details.map((item, index) => renderDetailRow(item, index, false))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  No stock snapshot data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}