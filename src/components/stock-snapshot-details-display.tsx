
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { StockSnapshotData, StockPriceData } from "@/services/data-sources/types";
import { formatCurrency, formatToTwoDecimals, formatCompactNumber, formatPercentage } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StockDetailItem {
  label: string;
  value: string | null;
  isCritical?: boolean; // Optional flag for styling
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
      if (data && typeof data === 'object' && !data.error && data.ticker) { 
        isLoading = false;
        parsedSnapshotData = data;
        
        const criticalDetails: StockDetailItem[] = [
          { label: "Current Price", value: formatCurrency(parsedSnapshotData.currentPrice), isCritical: true },
          { label: "Today's Change %", value: formatPercentage(parsedSnapshotData.todaysChangePerc, "N/A", true), isCritical: true },
          { label: "Today's Change", value: formatCurrency(parsedSnapshotData.todaysChange), isCritical: true },
          { label: "Day's VWAP", value: formatCurrency(parsedSnapshotData.day?.vw), isCritical: true },
          { label: "Day's Volume", value: formatCompactNumber(parsedSnapshotData.day?.v), isCritical: true },
          { label: "Day's Close", value: formatCurrency(parsedSnapshotData.day?.c), isCritical: true },
        ];
        
        const dayDetails: StockDetailItem[] = [
          { label: "Day's Open", value: formatCurrency(parsedSnapshotData.day?.o) },
          { label: "Day's High", value: formatCurrency(parsedSnapshotData.day?.h) },
          { label: "Day's Low", value: formatCurrency(parsedSnapshotData.day?.l) },
          // VWAP, Volume, Close are already in criticalDetails
        ];

        const prevDayDetails: StockDetailItem[] = [
          { label: "Prev. Open", value: formatCurrency(parsedSnapshotData.prevDay?.o) },
          { label: "Prev. High", value: formatCurrency(parsedSnapshotData.prevDay?.h) },
          { label: "Prev. Low", value: formatCurrency(parsedSnapshotData.prevDay?.l) },
          { label: "Prev. Close", value: formatCurrency(parsedSnapshotData.prevDay?.c) },
          { label: "Prev. Volume", value: formatCompactNumber(parsedSnapshotData.prevDay?.v) },
          { label: "Prev. VWAP", value: formatCurrency(parsedSnapshotData.prevDay?.vw) },
        ];

        details = [
          ...criticalDetails,
          { label: "Ticker", value: parsedSnapshotData.ticker || "N/A" },
          ...dayDetails.filter(d => !criticalDetails.find(cd => cd.label.startsWith(d.label.split(" ")[0]))), // Avoid duplication
          ...prevDayDetails,
          // Removed "Current Price (from Snapshot)" as it's now at the top
        ];
      } else {
        isError = true; 
        isLoading = false;
      }
    } catch (e) {
      console.error("Failed to parse stockSnapshotJson in StockSnapshotDetailsDisplay:", e);
      isError = true;
      isLoading = false;
    }
  }
  
  const placeholderRowCount = 12; // Adjusted for more items

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
              ? Array.from({ length: placeholderRowCount }).map((_, index) => renderDetailRow({label: "", value: null}, index, true))
              : isError || !parsedSnapshotData
                ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">Snapshot data not available.</TableCell></TableRow>
                : details.map((item, index) => renderDetailRow(item, index, false))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
