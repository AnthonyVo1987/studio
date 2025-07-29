"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

// User Ticker Context
import { useUserTickerAnalysis } from "@/contexts/user-ticker-analysis-context";

interface SnapshotDetailItem {
  label: string;
  current: string | null;
  previous: string | null;
  minute: string | null;
}

const renderDetailRow = (item: SnapshotDetailItem, index: number, isLoading: boolean, ticker: string) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-user-ticker-snapshot-${index}`}>
        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
          Waiting for {ticker} snapshot data...
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow key={item.label}>
      <TableCell className="font-medium">{item.label}</TableCell>
      <TableCell>{item.current ?? "N/A"}</TableCell>
      <TableCell>{item.minute ?? "N/A"}</TableCell>
      <TableCell>{item.previous ?? "N/A"}</TableCell>
    </TableRow>
  );
};

export function UserTickerStockSnapshotDisplay() {
  const userTickerState = useUserTickerAnalysis();

  // Use the ticker from state
  const ticker = userTickerState.currentTicker || 'TICKER';
  const displayTicker = ticker || 'No Ticker Selected';

  // Safe JSON parsing pattern following actual Polygon API structure
  const snapshotData = userTickerState.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(userTickerState.stockSnapshotJson);
      const day = parsed.day || {};
      const prevDay = parsed.prevDay || {};
      const min = parsed.min || {};
      
      return {
        ticker: parsed.ticker || ticker,
        open: day.o?.toFixed(2) || "N/A",
        high: day.h?.toFixed(2) || "N/A",
        low: day.l?.toFixed(2) || "N/A",
        close: day.c?.toFixed(2) || "N/A",
        volume: day.v?.toLocaleString() || "N/A",
        vwap: day.vw?.toFixed(2) || "N/A",
        prevOpen: prevDay.o?.toFixed(2) || "N/A",
        prevHigh: prevDay.h?.toFixed(2) || "N/A",
        prevLow: prevDay.l?.toFixed(2) || "N/A",
        prevClose: prevDay.c?.toFixed(2) || "N/A",
        prevVolume: prevDay.v?.toLocaleString() || "N/A",
        prevVwap: prevDay.vw?.toFixed(2) || "N/A",
        minOpen: min.o?.toFixed(2) || "N/A",
        minHigh: min.h?.toFixed(2) || "N/A",
        minLow: min.l?.toFixed(2) || "N/A",
        minClose: min.c?.toFixed(2) || "N/A",
        minVolume: min.v?.toLocaleString() || "N/A",
        minVwap: min.vw?.toFixed(2) || "N/A",
        currentPrice: parsed.currentPrice?.toFixed(2) || "N/A",
        todaysChange: parsed.todaysChange?.toFixed(2) || "N/A",
        todaysChangePerc: parsed.todaysChangePerc?.toFixed(2) || "N/A",
        isDataReady: userTickerState.dataRetrievalComplete
      };
    } catch (e) {
      return {
        ticker: ticker,
        open: "Error parsing data",
        high: "Error parsing data",
        low: "Error parsing data",
        close: "Error parsing data",
        volume: "Error parsing data",
        vwap: "Error parsing data",
        prevOpen: "N/A",
        prevHigh: "N/A",
        prevLow: "N/A",
        prevClose: "N/A",
        prevVolume: "N/A",
        prevVwap: "N/A",
        minOpen: "N/A",
        minHigh: "N/A",
        minLow: "N/A",
        minClose: "N/A",
        minVolume: "N/A",
        minVwap: "N/A",
        currentPrice: "N/A",
        todaysChange: "N/A",
        todaysChangePerc: "N/A",
        isDataReady: false
      };
    }
  })() : {
    ticker: ticker,
    open: "No data available",
    high: "No data available",
    low: "No data available",
    close: "No data available",
    volume: "No data available",
    vwap: "No data available",
    prevOpen: "N/A",
    prevHigh: "N/A",
    prevLow: "N/A",
    prevClose: "N/A",
    prevVolume: "N/A",
    prevVwap: "N/A",
    minOpen: "N/A",
    minHigh: "N/A",
    minLow: "N/A",
    minClose: "N/A",
    minVolume: "N/A",
    minVwap: "N/A",
    currentPrice: "N/A",
    todaysChange: "N/A",
    todaysChangePerc: "N/A",
    isDataReady: false
  };

  // Derive loading state from FSM state and data availability
  const isLoading = userTickerState.status === 'loading' || 
                   (ticker && userTickerState.isTickerValid && !userTickerState.dataRetrievalComplete);

  const snapshotDetails: SnapshotDetailItem[] = [
    { label: "Open", current: snapshotData.open, previous: snapshotData.prevOpen, minute: snapshotData.minOpen },
    { label: "High", current: snapshotData.high, previous: snapshotData.prevHigh, minute: snapshotData.minHigh },
    { label: "Low", current: snapshotData.low, previous: snapshotData.prevLow, minute: snapshotData.minLow },
    { label: "Close", current: snapshotData.close, previous: snapshotData.prevClose, minute: snapshotData.minClose },
    { label: "Volume", current: snapshotData.volume, previous: snapshotData.prevVolume, minute: snapshotData.minVolume },
    { label: "VWAP", current: snapshotData.vwap, previous: snapshotData.prevVwap, minute: snapshotData.minVwap },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {displayTicker} Stock Snapshot
          </span>
          <Badge variant="outline">{snapshotData.ticker}</Badge>
        </CardTitle>
        <CardDescription>
          {ticker && userTickerState.isTickerValid
            ? `Detailed trading data and volume metrics for ${ticker}`
            : "Select a valid ticker symbol to view stock snapshot data"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Snapshot Data Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Current Day</TableHead>
                <TableHead>Current Minute</TableHead>
                <TableHead>Previous Day</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!ticker || !userTickerState.isTickerValid ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground h-24">
                    {!ticker ? "No ticker selected" : "Invalid ticker symbol"}
                  </TableCell>
                </TableRow>
              ) : (
                snapshotDetails.map((item, index) => renderDetailRow(item, index, isLoading, ticker))
              )}
            </TableBody>
          </Table>

          {/* Loading Badge */}
          {isLoading && (
            <div className="flex justify-center">
              <Badge variant="outline">Loading {ticker} Snapshot...</Badge>
            </div>
          )}
          
          {/* Error State */}
          {userTickerState.tickerValidationError && (
            <div className="text-sm text-destructive text-center">
              {userTickerState.tickerValidationError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}