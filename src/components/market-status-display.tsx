
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

const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }'
];

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
  const componentName = 'MarketStatusDisplay';
  logDebug(componentName, "marketStatusJson (start):", marketStatusJson ? marketStatusJson.substring(0,100) : "null");

  let isLoading = false;
  let isError = false;
  let errorOrSkippedMessage: string | null = "Market status data not available.";
  let details: MarketDetailItem[] = [];

  if (!marketStatusJson || marketStatusJson === '{}') {
    isLoading = false;
    isError = false; // Not an error, just no data yet or legitimately empty
    errorOrSkippedMessage = "No market status data. Ensure stock data was fetched.";
    logDebug(componentName, "marketStatusJson is empty or null. Displaying 'No data'.");
  } else if (PENDING_STATUS_JSON_VARIANTS.includes(marketStatusJson.trim())) {
    isLoading = true;
    isError = false;
    details = []; // Clear details when loading
    errorOrSkippedMessage = ""; // Clear any previous error message
    logDebug(componentName, "marketStatusJson is in a defined pending/initializing state.");
  } else if (marketStatusJson.includes('"status": "error"') || marketStatusJson.includes('"error":')) {
    isLoading = false;
    isError = true;
    try {
      const statusObj = JSON.parse(marketStatusJson);
      errorOrSkippedMessage = statusObj.message || statusObj.error || "Error loading market status.";
    } catch (e) {
      errorOrSkippedMessage = "Error loading market status (failed to parse error JSON).";
    }
    logDebug(componentName, "marketStatusJson indicates an error state.", errorOrSkippedMessage);
  } else if (marketStatusJson.includes('"status": "skipped"')) {
    isLoading = false;
    isError = true;
    try {
      const statusObj = JSON.parse(marketStatusJson);
      errorOrSkippedMessage = statusObj.message || "Market status loading was skipped.";
    } catch (e) {
      errorOrSkippedMessage = "Market status loading was skipped (failed to parse skipped JSON).";
    }
    logDebug(componentName, "marketStatusJson indicates a skipped state.", errorOrSkippedMessage);
  } else {
    try {
      const data = JSON.parse(marketStatusJson) as MarketStatusData;
      logDebug(componentName, "Attempting to parse marketStatusJson. Market status:", data?.market);
      if (data && typeof data === 'object' && !data.error) {
        isLoading = false;
        isError = false;
        errorOrSkippedMessage = null; // Clear if data is valid
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
        logDebug(componentName, "Successfully parsed marketStatusJson.", details);
      } else {
         if (data?.error) {
           errorOrSkippedMessage = `Error in market data: ${data.error}`;
           logDebug(componentName, "Parsed marketStatusJson contains an error field:", data.error);
         } else {
           errorOrSkippedMessage = "Market status data is malformed.";
           logDebug(componentName, "Parsed marketStatusJson is not a valid object for display.");
         }
         isLoading = false;
         isError = true;
      }
    } catch (e) {
      console.error(`[${componentName}] Failed to parse marketStatusJson:`, e);
      logDebug(componentName, "Error during marketStatusJson parsing.", e);
      isLoading = false;
      isError = true;
      errorOrSkippedMessage = "Failed to parse market status data.";
    }
  }

  logDebug(componentName, `Render state: isLoading=${isLoading}, isError=${isError}, errorOrSkippedMessage=${errorOrSkippedMessage}, details.length=${details.length}`);
  const placeholderRows = Math.max(1, details.filter(d => d.value !== "N/A" && d.value !== "").length || 4); // Adjusted placeholder count

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
              : isError && errorOrSkippedMessage
                ? <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">{errorOrSkippedMessage}</TableCell></TableRow>
                : details.length > 0 && details.some(d => d.value && d.value !== "N/A")
                    ? details.map((item, index) => renderDetailRow(item, index, false))
                    : <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">{errorOrSkippedMessage || "No applicable market status to display."}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
