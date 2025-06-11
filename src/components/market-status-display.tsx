
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
  const { marketStatusJson, aiCalculatedTaJson } = useStockAnalysis(); // aiCalculatedTaJson as proxy for loading chain

  let isLoading = true;
  let isError = false;
  let details: MarketDetailItem[] = [];

  if (
    marketStatusJson.includes('"status": "initializing"') ||
    marketStatusJson.includes('"status": "pending"') ||
    aiCalculatedTaJson.includes('"status": "pending"') || 
    aiCalculatedTaJson.includes('"status": "initializing"')
  ) {
    isLoading = true;
  } else if (marketStatusJson.includes('"error":') || marketStatusJson.includes('"status": "skipped"')) {
    isError = true;
    isLoading = false;
  } else {
    try {
      const data = JSON.parse(marketStatusJson) as MarketStatusData;
      if (data && typeof data === 'object' && !data.error) {
        isLoading = false;
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
          Object.entries(data.currencies).forEach(([key, value]) => {
            details.push({ label: `${key.toUpperCase()} Market`, value: value?.toUpperCase() || "N/A" });
          });
        }
      } else {
        isError = true;
        isLoading = false;
      }
    } catch (e) {
      console.error("Failed to parse marketStatusJson in MarketStatusDisplay:", e);
      isError = true;
      isLoading = false;
    }
  }

  const placeholderRows = 5; 

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
              : isError
                ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Market status data not available.</TableCell></TableRow>
                : details.map((item, index) => renderDetailRow(item, index, false))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
