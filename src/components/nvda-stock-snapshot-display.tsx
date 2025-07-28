"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

// NVDA Context
import { useNvdaAnalysis } from "@/contexts/nvda-analysis-context";

interface SnapshotDetailItem {
  label: string;
  current: string | null;
  previous: string | null;
  minute: string | null;
}

const renderDetailRow = (item: SnapshotDetailItem, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-nvda-snapshot-${index}`}>
        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
          Waiting for NVDA snapshot data...
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

export function NvdaStockSnapshotDisplay() {
  const nvdaState = useNvdaAnalysis();

  // Safe JSON parsing pattern following actual Polygon API structure
  const snapshotData = nvdaState.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(nvdaState.stockSnapshotJson);
      const day = parsed.day || {};
      const prevDay = parsed.prevDay || {};
      const min = parsed.min || {};
      
      return {
        ticker: parsed.ticker || "NVDA",
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
        isDataReady: nvdaState.dataRetrievalComplete
      };
    } catch (e) {
      return {
        ticker: "NVDA",
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
    ticker: "NVDA",
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
  const isLoading = nvdaState.status === 'loading' || !nvdaState.dataRetrievalComplete;

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
            NVDA Stock Snapshot
          </span>
          <Badge variant="outline">{snapshotData.ticker}</Badge>
        </CardTitle>
        <CardDescription>
          Detailed trading data and volume metrics for NVDA
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
              {snapshotDetails.map((item, index) => renderDetailRow(item, index, isLoading))}
            </TableBody>
          </Table>

          {/* Loading Badge */}
          {isLoading && (
            <div className="flex justify-center">
              <Badge variant="outline">Loading NVDA Snapshot...</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}