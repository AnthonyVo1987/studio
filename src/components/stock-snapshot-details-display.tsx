
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { StockSnapshotData } from "@/services/data-sources/types";
import { formatCurrency, formatPercentage, formatCompactNumber } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StockDetailItem {
  label: string;
  value: string | null;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-positive'; // Use theme color
  if (sentiment === 'bearish') return 'text-destructive'; // Use theme color
  return '';
};

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
      <TableCell className={cn(getSentimentColorClass(item.sentiment))}>{item.value ?? "N/A"}</TableCell>
    </TableRow>
  );
};

export function StockSnapshotDetailsDisplay() {
  const { stockSnapshotJson, logDebug } = useStockAnalysis();
  logDebug('StockSnapshotDetailsDisplay', "stockSnapshotJson (start):", stockSnapshotJson.substring(0,100));

  let isLoading = false;
  let isError = false;
  let details: StockDetailItem[] = [];
  let parsedSnapshotData: StockSnapshotData | null = null;

  if (stockSnapshotJson && stockSnapshotJson !== '{}') {
    if (stockSnapshotJson.includes('"status": "initializing"') || stockSnapshotJson.includes('"status": "pending"') || stockSnapshotJson.includes('"status": "full_analysis_pending..."')) {
      logDebug('StockSnapshotDetailsDisplay', "stockSnapshotJson is in pending/initializing state.");
      isLoading = true;
    } else if (stockSnapshotJson.includes('"error":') || stockSnapshotJson.includes('"status": "skipped"')) {
      logDebug('StockSnapshotDetailsDisplay', "stockSnapshotJson indicates an error or skipped state.");
      isLoading = false;
      isError = true;
    } else {
      try {
        const data = JSON.parse(stockSnapshotJson) as StockSnapshotData;
        logDebug('StockSnapshotDetailsDisplay', "Successfully parsed stockSnapshotJson. Ticker:", data?.ticker);
        if (data && typeof data === 'object' && data.ticker) {
          isLoading = false;
          isError = false;
          parsedSnapshotData = data;

          const change = parsedSnapshotData.todaysChange ?? 0;
          const changePerc = parsedSnapshotData.todaysChangePerc ?? null;
          const changeSentiment = change > 0 ? 'bullish' : (change < 0 ? 'bearish' : 'neutral');

          const criticalDetails: StockDetailItem[] = [
            { label: "Current Price", value: formatCurrency(parsedSnapshotData.currentPrice)},
            { label: "Today's Change %", value: formatPercentage(changePerc, "N/A", true, 2), sentiment: changeSentiment },
            { label: "Today's Change", value: formatCurrency(change, "$", "N/A"), sentiment: changeSentiment },
            { label: "Day's VWAP", value: formatCurrency(parsedSnapshotData.day?.vw) },
            { label: "Day's Volume", value: formatCompactNumber(parsedSnapshotData.day?.v) },
            { label: "Day's Close", value: formatCurrency(parsedSnapshotData.day?.c) },
          ];

          const dayDetails: StockDetailItem[] = [
            { label: "Day's Open", value: formatCurrency(parsedSnapshotData.day?.o) },
            { label: "Day's High", value: formatCurrency(parsedSnapshotData.day?.h) },
            { label: "Day's Low", value: formatCurrency(parsedSnapshotData.day?.l) },
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
            ...dayDetails,
            ...prevDayDetails,
          ];
        } else {
          logDebug('StockSnapshotDetailsDisplay', "Parsed stockSnapshotJson is missing ticker or not an object.");
          isLoading = false;
          isError = true;
        }
      } catch (e) {
        console.error("[StockSnapshotDetailsDisplay] Failed to parse stockSnapshotJson:", e);
        logDebug('StockSnapshotDetailsDisplay', "Error during stockSnapshotJson parsing.", e);
        isLoading = false;
        isError = true;
      }
    }
  } else {
    logDebug('StockSnapshotDetailsDisplay', "stockSnapshotJson is empty or null.");
    isLoading = false;
  }

  logDebug('StockSnapshotDetailsDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, details.length=${details.length}, parsedSnapshotData exists=${!!parsedSnapshotData}`);
  const placeholderRowCount = 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Snapshot Details</CardTitle>
        <CardDescription>Detailed price and volume information for {parsedSnapshotData?.ticker || "the selected ticker"}.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {isLoading
              ? Array.from({ length: placeholderRowCount }).map((_, index) => renderDetailRow({label: "", value: null}, index, true))
              : isError || !parsedSnapshotData || details.length === 0
                ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">Snapshot data not available.</TableCell></TableRow>
                : details.map((item, index) => renderDetailRow(item, index, false))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
