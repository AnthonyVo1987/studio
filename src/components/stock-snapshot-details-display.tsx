"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useUIState } from "@/contexts/ui-state-context";
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

export function StockSnapshotDetailsDisplay() {
  const { currentSnapshot, loadingStates } = useUIState();

  // Derive values directly from UI snapshot
  const stockSnapshot = currentSnapshot.stockSnapshot;
  const isLoading = loadingStates.isFetchingData || !stockSnapshot.isDataReady;

  // Calculate sentiment for changes
  const changeSentiment: 'bullish' | 'bearish' | 'neutral' = 
    stockSnapshot.change && stockSnapshot.change > 0 ? 'bullish' :
    stockSnapshot.change && stockSnapshot.change < 0 ? 'bearish' : 'neutral';

  // Build details array if data is ready
  const details: StockDetailItem[] = [];
  
  if (stockSnapshot.isDataReady) {
    details.push(
      { label: "Current Price", value: formatCurrency(stockSnapshot.price) },
      { label: "Today's Change %", value: formatPercentage(stockSnapshot.changePercent, "N/A", true, 2), sentiment: changeSentiment },
      { label: "Today's Change", value: formatCurrency(stockSnapshot.change, "$", "N/A"), sentiment: changeSentiment },
      { label: "Volume", value: formatCompactNumber(stockSnapshot.volume) },
      { label: "Previous Close", value: formatCurrency(stockSnapshot.previousClose) },
      { label: "Market Cap", value: formatCurrency(stockSnapshot.marketCap, "$", "N/A") }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Snapshot Details</CardTitle>
        <CardDescription>Detailed price and volume information for {stockSnapshot.ticker || "the selected ticker"}.</CardDescription>
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