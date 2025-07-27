"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

// SPY Context
import { useSpyAnalysis } from "@/contexts/spy-analysis-context";

interface SnapshotDetailItem {
  label: string;
  current: string | null;
  previous: string | null;
}

const renderDetailRow = (item: SnapshotDetailItem, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-spy-snapshot-${index}`}>
        <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
          Waiting for SPY snapshot data...
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow key={item.label}>
      <TableCell className="font-medium">{item.label}</TableCell>
      <TableCell>{item.current ?? "N/A"}</TableCell>
      <TableCell>{item.previous ?? "N/A"}</TableCell>
    </TableRow>
  );
};

export function SpyStockSnapshotDisplay() {
  const spyState = useSpyAnalysis();

  // Safe JSON parsing pattern following actual Polygon API structure
  const snapshotData = spyState.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(spyState.stockSnapshotJson);
      const day = parsed.day || {};
      const prevDay = parsed.prevDay || {};
      
      return {
        ticker: parsed.ticker || "SPY",
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
        currentPrice: parsed.currentPrice?.toFixed(2) || "N/A",
        todaysChange: parsed.todaysChange?.toFixed(2) || "N/A",
        todaysChangePerc: parsed.todaysChangePerc?.toFixed(2) || "N/A",
        isDataReady: spyState.dataRetrievalComplete
      };
    } catch (e) {
      return {
        ticker: "SPY",
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
        currentPrice: "N/A",
        todaysChange: "N/A",
        todaysChangePerc: "N/A",
        isDataReady: false
      };
    }
  })() : {
    ticker: "SPY",
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
    currentPrice: "N/A",
    todaysChange: "N/A",
    todaysChangePerc: "N/A",
    isDataReady: false
  };

  // Derive loading state from FSM state and data availability
  const isLoading = spyState.status === 'loading' || !spyState.dataRetrievalComplete;

  const snapshotDetails: SnapshotDetailItem[] = [
    { label: "Open", current: snapshotData.open, previous: snapshotData.prevOpen },
    { label: "High", current: snapshotData.high, previous: snapshotData.prevHigh },
    { label: "Low", current: snapshotData.low, previous: snapshotData.prevLow },
    { label: "Close", current: snapshotData.close, previous: snapshotData.prevClose },
    { label: "Volume", current: snapshotData.volume, previous: snapshotData.prevVolume },
    { label: "VWAP", current: snapshotData.vwap, previous: snapshotData.prevVwap },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            SPY Stock Snapshot
          </span>
          <Badge variant="outline">{snapshotData.ticker}</Badge>
        </CardTitle>
        <CardDescription>
          Detailed trading data and volume metrics for SPY
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
                <TableHead>Previous Day</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshotDetails.map((item, index) => renderDetailRow(item, index, isLoading))}
            </TableBody>
          </Table>

          {/* Loading Badge */}
          {isLoading && (
            <div className="flex justify-center">
              <Badge variant="outline">Loading SPY Snapshot...</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}