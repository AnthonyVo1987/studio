"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

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
  // Static placeholder data - future task will connect to SPY context
  const snapshotData = {
    ticker: "SPY",
    open: "Data will load here",
    high: "Data will load here", 
    low: "Data will load here",
    close: "Data will load here",
    volume: "Data will load here",
    vwap: "Data will load here",
    isDataReady: false
  };

  const isLoading = true; // Always loading for now since not connected to data

  const snapshotDetails: SnapshotDetailItem[] = [
    { label: "Open", current: snapshotData.open, previous: "Previous day data" },
    { label: "High", current: snapshotData.high, previous: "Previous day data" },
    { label: "Low", current: snapshotData.low, previous: "Previous day data" },
    { label: "Close", current: snapshotData.close, previous: "Previous day data" },
    { label: "Volume", current: snapshotData.volume, previous: "Previous day data" },
    { label: "VWAP", current: snapshotData.vwap, previous: "Previous day data" },
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