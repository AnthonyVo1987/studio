
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  if (sentiment === 'bullish') return 'text-positive'; 
  if (sentiment === 'bearish') return 'text-destructive'; 
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

const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }',
  '{ "status": "no_analysis_run_yet" }'
];

export function StockSnapshotDetailsDisplay() {
  const { stockSnapshotJson, logDebug } = useStockAnalysis();
  const componentName = 'StockSnapshotDetailsDisplay';
  const prevJsonRef = useRef<string | null>(null);

  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isErrorState, setIsErrorState] = useState(false);
  const [errorOrSkippedMessageState, setErrorOrSkippedMessageState] = useState("Snapshot data not available.");
  const [detailsState, setDetailsState] = useState<StockDetailItem[]>([]);
  const [parsedSnapshotDataState, setParsedSnapshotDataState] = useState<StockSnapshotData | null>(null);

  useEffect(() => {
    const currentJson = stockSnapshotJson;
    if (currentJson !== prevJsonRef.current) {
      logDebug(componentName, "PropsReceived", "stockSnapshotJson prop changed. New Length:", currentJson?.length);
      prevJsonRef.current = currentJson;
    } else {
      return;
    }

    let newIsLoading = true;
    let newIsError = false;
    let newErrorMsg = "Snapshot data not available.";
    let newDetails: StockDetailItem[] = [];
    let newParsedSnapshotData: StockSnapshotData | null = null;

    if (currentJson && currentJson !== '{}') {
      if (PENDING_STATUS_JSON_VARIANTS.includes(currentJson.trim())) {
        newIsLoading = true;
        newErrorMsg = "Loading snapshot details...";
        logDebug(componentName, "StateUpdate:Loading", newErrorMsg);
      } else if (currentJson.includes('"error":') || currentJson.includes('"status": "skipped"')) {
        newIsLoading = false;
        newIsError = true;
        if (currentJson.includes('"status": "skipped"')) {
          newErrorMsg = "Snapshot data loading was skipped.";
        } else {
          newErrorMsg = "Error loading snapshot data.";
        }
        logDebug(componentName, "StateUpdate:ErrorOrSkipped", newErrorMsg);
      } else {
        try {
          const data = JSON.parse(currentJson) as StockSnapshotData;
          if (data && typeof data === 'object' && data.ticker) {
            newIsLoading = false;
            newIsError = false;
            newParsedSnapshotData = data;
            logDebug(componentName, "DataParsed", "Successfully parsed stockSnapshotJson. Ticker:", newParsedSnapshotData.ticker);

            const change = newParsedSnapshotData.todaysChange ?? 0;
            const changePerc = newParsedSnapshotData.todaysChangePerc ?? null;
            const changeSentiment = change > 0 ? 'bullish' : (change < 0 ? 'bearish' : 'neutral');

            const criticalDetails: StockDetailItem[] = [
              { label: "Current Price", value: formatCurrency(newParsedSnapshotData.currentPrice)},
              { label: "Today's Change %", value: formatPercentage(changePerc, "N/A", true, 2), sentiment: changeSentiment },
              { label: "Today's Change", value: formatCurrency(change, "$", "N/A"), sentiment: changeSentiment },
              { label: "Day's VWAP", value: formatCurrency(newParsedSnapshotData.day?.vw) },
              { label: "Day's Volume", value: formatCompactNumber(newParsedSnapshotData.day?.v) },
              { label: "Day's Close", value: formatCurrency(newParsedSnapshotData.day?.c) },
            ];
            const dayDetails: StockDetailItem[] = [
              { label: "Day's Open", value: formatCurrency(newParsedSnapshotData.day?.o) },
              { label: "Day's High", value: formatCurrency(newParsedSnapshotData.day?.h) },
              { label: "Day's Low", value: formatCurrency(newParsedSnapshotData.day?.l) },
            ];
            const prevDayDetails: StockDetailItem[] = [
              { label: "Prev. Open", value: formatCurrency(newParsedSnapshotData.prevDay?.o) },
              { label: "Prev. High", value: formatCurrency(newParsedSnapshotData.prevDay?.h) },
              { label: "Prev. Low", value: formatCurrency(newParsedSnapshotData.prevDay?.l) },
              { label: "Prev. Close", value: formatCurrency(newParsedSnapshotData.prevDay?.c) },
              { label: "Prev. Volume", value: formatCompactNumber(newParsedSnapshotData.prevDay?.v) },
              { label: "Prev. VWAP", value: formatCurrency(newParsedSnapshotData.prevDay?.vw) },
            ];
            newDetails = [...criticalDetails, ...dayDetails, ...prevDayDetails];
          } else {
            newIsLoading = false;
            newIsError = true;
            newErrorMsg = "Snapshot data malformed for details display.";
            logDebug(componentName, "StateUpdate:Malformed", newErrorMsg);
          }
        } catch (e) {
          console.error(`[${componentName}] Failed to parse stockSnapshotJson:`, e, "JSON:", currentJson.substring(0,200));
          newIsLoading = false;
          newIsError = true;
          newErrorMsg = "Failed to parse snapshot data for details display.";
          logDebug(componentName, "StateUpdate:ParseFailed", newErrorMsg);
        }
      }
    } else {
      newIsLoading = false;
      newErrorMsg = "No snapshot data available for details display.";
      logDebug(componentName, "StateUpdate:NoData", newErrorMsg);
    }

    setIsLoadingState(newIsLoading);
    setIsErrorState(newIsError);
    setErrorOrSkippedMessageState(newErrorMsg);
    setDetailsState(newDetails);
    setParsedSnapshotDataState(newParsedSnapshotData);

  }, [stockSnapshotJson, logDebug]);

  logDebug(componentName, 'RenderState', `isLoading=${isLoadingState}, isError=${isErrorState}, errorMsg='${errorOrSkippedMessageState}', details=${detailsState.length}, parsedData=${!!parsedSnapshotDataState}`);
  const placeholderRowCount = 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Snapshot Details</CardTitle>
        <CardDescription>Detailed price and volume information for {parsedSnapshotDataState?.ticker || "the selected ticker"}.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {isLoadingState
              ? Array.from({ length: placeholderRowCount }).map((_, index) => renderDetailRow({label: "", value: null}, index, true))
              : isErrorState
                ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">{errorOrSkippedMessageState}</TableCell></TableRow>
                : !parsedSnapshotDataState || detailsState.length === 0
                    ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">{errorOrSkippedMessageState}</TableCell></TableRow>
                    : detailsState.map((item, index) => renderDetailRow(item, index, false))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
