
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { StockSnapshotData, StockPriceData } from "@/services/data-sources/types";
import { formatCurrency, formatToTwoDecimals, formatCompactNumber, formatPercentage } from "@/lib/number-utils"; // Added formatPercentage
import { Skeleton } from "@/components/ui/skeleton";

interface StockDetailItem {
  label: string;
  value: string | null;
}

const renderDetailRow = (item: StockDetailItem, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`skeleton-snapshot-${index}`}>
        <TableCell className="font-medium w-1/3"><Skeleton className="h-5 w-3/4" /></TableCell>
        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow key={item.label}>
      <TableCell className="font-medium w-1/3">{item.label}</TableCell>
      <TableCell>{item.value ?? "N/A"}</TableCell>
    </TableRow>
  );
};

export function StockSnapshotDetailsDisplay() {
  const { stockSnapshotJson } = useStockAnalysis(); 

  let isLoading = false;
  let isError = false;
  let details: StockDetailItem[] = [];
  let parsedSnapshotData: StockSnapshotData | null = null;

  if (
    stockSnapshotJson.includes('"status": "initializing"') ||
    stockSnapshotJson.includes('"status": "pending"')
  ) {
    isLoading = true;
  } else if (stockSnapshotJson.includes('"error":') || stockSnapshotJson.includes('"status": "skipped"')) {
    isError = true;
    isLoading = false;
  } else {
    try {
      const data = JSON.parse(stockSnapshotJson) as StockSnapshotData;
      if (data && typeof data === 'object' && !data.error && data.ticker) { // Check for ticker as a sign of valid data
        isLoading = false;
        parsedSnapshotData = data;
        const formatPriceData = (pd?: StockPriceData, prefix: string = "") => [
          { label: `${prefix} Open`, value: formatCurrency(pd?.o) },
          { label: `${prefix} High`, value: formatCurrency(pd?.h) },
          { label: `${prefix} Low`, value: formatCurrency(pd?.l) },
          { label: `${prefix} Close`, value: formatCurrency(pd?.c) },
          { label: `${prefix} Volume`, value: formatCompactNumber(pd?.v) },
          { label: `${prefix} VWAP`, value: formatCurrency(pd?.vw) },
        ];

        details = [
          { label: "Ticker", value: parsedSnapshotData.ticker || "N/A" },
          ...formatPriceData(parsedSnapshotData.prevDay, "Prev."),
          ...formatPriceData(parsedSnapshotData.day, "Day's"),
          { label: "Today's Change", value: formatCurrency(parsedSnapshotData.todaysChange) },
          { label: "Today's Change %", value: formatPercentage(parsedSnapshotData.todaysChangePerc, "N/A", true) }, // Value is already a percentage
          { label: "Current Price (from Snapshot)", value: formatCurrency(parsedSnapshotData.currentPrice) },
        ];
      } else {
        // If not loading, and data is not in expected format or has an error property
        isError = true; 
        isLoading = false;
      }
    } catch (e) {
      console.error("Failed to parse stockSnapshotJson in StockSnapshotDetailsDisplay:", e);
      isError = true;
      isLoading = false;
    }
  }
  
  const placeholderRows = 8; 

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Snapshot Details</CardTitle>
        <CardDescription>Detailed information from the latest stock snapshot.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {isLoading 
              ? Array.from({ length: placeholderRows }).map((_, index) => renderDetailRow({label: "", value: null}, index, true))
              : isError || !parsedSnapshotData
                ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">Snapshot data not available.</TableCell></TableRow>
                : details.map((item, index) => renderDetailRow(item, index, false))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
