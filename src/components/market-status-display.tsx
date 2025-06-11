
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { MarketStatusData } from "@/services/data-sources/types";
import { formatTimestampToPacificTime } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketDetailItem {
  label: string;
  value: string | null;
}

const renderDetailRow = (item: MarketDetailItem, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`skeleton-market-${index}`}>
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

export function MarketStatusDisplay() {
  const { marketStatusJson, logDebug } = useStockAnalysis();
  logDebug('MarketStatusDisplay', "marketStatusJson (start):", marketStatusJson.substring(0,100));

  let isLoading = false;
  let isError = false;
  let details: MarketDetailItem[] = [];

  if (marketStatusJson && marketStatusJson !== '{}') {
    if (marketStatusJson.includes('"status": "initializing"') || marketStatusJson.includes('"status": "pending"') || marketStatusJson.includes('"status": "full_analysis_pending..."')) {
      logDebug('MarketStatusDisplay', "marketStatusJson is in pending/initializing state.");
      isLoading = true;
    } else if (marketStatusJson.includes('"error":') || marketStatusJson.includes('"status": "skipped"')) {
      logDebug('MarketStatusDisplay', "marketStatusJson indicates an error or skipped state.");
      isLoading = false;
      isError = true;
    } else {
      try {
        const data = JSON.parse(marketStatusJson) as MarketStatusData;
        logDebug('MarketStatusDisplay', "Successfully parsed marketStatusJson. Market status:", data?.market);
        if (data && typeof data === 'object' && !data.error) {
          isLoading = false;
          isError = false;
          details = [
            { label: "Market Status", value: data.market?.toUpperCase() || "N/A" },
            { label: "Early Hours Trading", value: data.earlyHours ? "Yes" : "No" },
            { label: "Late Hours Trading", value: data.lateHours ? "Yes" : "No" },
            { label: "Server Time (ET)", value: formatTimestampToPacificTime(data.serverTime) },
          ];
          if (data.exchanges) {
            Object.entries(data.exchanges).forEach(([key, value]) => {
              details.push({ label: `${key.toUpperCase()} Exchange`, value: value?.toUpperCase() || "N/A" });
            });
          }
          if (data.currencies) {
            Object.entries(data.currencies)
              .filter(([key]) => {
                const lowerKey = key.toLowerCase();
                return lowerKey !== 'crypto' && lowerKey !== 'fx';
              })
              .forEach(([key, value]) => {
                details.push({ label: `${key.toUpperCase()} Market`, value: value?.toUpperCase() || "N/A" });
              });
          }
        } else {
           logDebug('MarketStatusDisplay', "Parsed marketStatusJson is not a valid object or contains error field.");
           isLoading = false;
           isError = true;
        }
      } catch (e) {
        console.error("[MarketStatusDisplay] Failed to parse marketStatusJson:", e);
        logDebug('MarketStatusDisplay', "Error during marketStatusJson parsing.", e);
        isLoading = false;
        isError = true;
      }
    }
  } else {
    logDebug('MarketStatusDisplay', "marketStatusJson is empty or null.");
    isLoading = false;
  }

  logDebug('MarketStatusDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, details.length=${details.length}`);
  const placeholderRows = Math.max(1, details.filter(d => d.value !== "N/A" && d.value !== "").length || 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Status</CardTitle>
        <CardDescription>Current status of relevant markets and exchanges.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
             {isLoading
              ? Array.from({ length: placeholderRows }).map((_, index) => renderDetailRow({label: "", value: null}, index, true))
              : isError || details.length === 0
                ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">Market status data not available.</TableCell></TableRow>
                : details.length > 0 && details.some(d => d.value && d.value !== "N/A")
                    ? details.map((item, index) => renderDetailRow(item, index, false))
                    : <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">No applicable market status to display.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
