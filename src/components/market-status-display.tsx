
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  '{ "status": "full_analysis_pending..." }',
  '{ "status": "no_analysis_run_yet" }' 
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
  const prevMarketStatusJsonRef = useRef<string | null>(null);

  const [formattedServerTime, setFormattedServerTime] = useState<string>("Loading server time...");
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true
  const [isError, setIsError] = useState<boolean>(false);
  const [errorOrSkippedMessage, setErrorOrSkippedMessage] = useState<string | null>("Market status data not available.");
  const [details, setDetails] = useState<MarketDetailItem[]>([]);

  useEffect(() => {
    const currentJson = marketStatusJson;
    const prevJson = prevMarketStatusJsonRef.current;

    if (currentJson !== prevJson) {
      logDebug(componentName, "PropsReceived", "marketStatusJson prop changed. New Length:", currentJson?.length, "Is empty/null:", !currentJson || currentJson === '{}');
      prevMarketStatusJsonRef.current = currentJson;
    } else {
      // If prop string reference hasn't changed, no need to re-process or log "PropsReceived" again.
      // The component might re-render due to parent, but this effect shouldn't re-log this specific message.
      return;
    }
    
    let currentIsLoading = false;
    let currentIsError = false;
    let currentErrorOrSkippedMessage: string | null = "Market status data not available.";
    let currentDetails: MarketDetailItem[] = [];

    if (!currentJson || currentJson === '{}') {
      currentIsLoading = false;
      currentIsError = false; 
      currentErrorOrSkippedMessage = "No market status data. Ensure stock data was fetched.";
      logDebug(componentName, "StateUpdate:NoData", currentErrorOrSkippedMessage);
    } else if (PENDING_STATUS_JSON_VARIANTS.includes(currentJson.trim())) {
      currentIsLoading = true;
      currentIsError = false;
      currentErrorOrSkippedMessage = "Loading market status..."; 
      logDebug(componentName, "StateUpdate:Loading", currentErrorOrSkippedMessage);
    } else if (currentJson.includes('"status": "error"') || currentJson.includes('"error":')) {
      currentIsLoading = false;
      currentIsError = true;
      try {
        const statusObj = JSON.parse(currentJson);
        currentErrorOrSkippedMessage = statusObj.message || statusObj.error || "Error loading market status.";
      } catch (e) {
        currentErrorOrSkippedMessage = "Error loading market status (failed to parse error JSON).";
      }
      logDebug(componentName, "StateUpdate:Error", currentErrorOrSkippedMessage);
    } else if (currentJson.includes('"status": "skipped"')) {
      currentIsLoading = false;
      currentIsError = true; // Treat skipped as an error for display purposes
      try {
        const statusObj = JSON.parse(currentJson);
        currentErrorOrSkippedMessage = statusObj.message || "Market status loading was skipped.";
      } catch (e) {
        currentErrorOrSkippedMessage = "Market status loading was skipped (failed to parse skipped JSON).";
      }
      logDebug(componentName, "StateUpdate:Skipped", currentErrorOrSkippedMessage);
    } else {
      try {
        const data = JSON.parse(currentJson) as MarketStatusData;
        if (data && typeof data === 'object' && !data.error) {
          currentIsLoading = false;
          currentIsError = false;
          currentErrorOrSkippedMessage = null; 
          
          setFormattedServerTime(formatTimestampToPacificTime(data.serverTime));
          logDebug(componentName, "DataParsed", "Successfully parsed marketStatusJson. Market status:", data?.market);

          currentDetails = [
            { label: "Market Status", value: data.market?.toUpperCase() || "N/A" },
            { label: "Early Hours Trading", value: data.earlyHours ? "Yes" : "No" },
            { label: "Late Hours Trading", value: data.lateHours ? "Yes" : "No" },
          ];
          if (data.exchanges) {
            Object.entries(data.exchanges).forEach(([key, value]) => {
              currentDetails.push({ label: `${key.toUpperCase()} Exchange`, value: value?.toUpperCase() || "N/A" });
            });
          }
          if (data.currencies) {
            Object.entries(data.currencies)
              .filter(([key]) => {
                const lowerKey = key.toLowerCase();
                return lowerKey !== 'crypto' && lowerKey !== 'fx';
              })
              .forEach(([key, value]) => {
                currentDetails.push({ label: `${key.toUpperCase()} Market`, value: value?.toUpperCase() || "N/A" });
              });
          }
        } else {
           if (data?.error) {
             currentErrorOrSkippedMessage = `Error in market data: ${data.error}`;
           } else {
             currentErrorOrSkippedMessage = "Market status data is malformed.";
           }
           currentIsLoading = false;
           currentIsError = true;
           logDebug(componentName, "StateUpdate:Malformed", currentErrorOrSkippedMessage);
        }
      } catch (e) {
        console.error(`[${componentName}] (effect) Failed to parse marketStatusJson:`, e, "JSON:", currentJson.substring(0,200));
        currentIsLoading = false;
        currentIsError = true;
        currentErrorOrSkippedMessage = "Failed to parse market status data.";
        logDebug(componentName, "StateUpdate:ParseFailed", currentErrorOrSkippedMessage);
      }
    }
    
    setIsLoading(currentIsLoading);
    setIsError(currentIsError);
    setErrorOrSkippedMessage(currentErrorOrSkippedMessage);
    setDetails(currentDetails);

  }, [marketStatusJson, logDebug]);


  const finalDetailsToRender = [...details];
  if (!isLoading && !isError && errorOrSkippedMessage === null) {
    const serverTimeDetailIndex = finalDetailsToRender.findIndex(d => d.label === "Server Time (ET)");
    if (serverTimeDetailIndex > -1) {
        finalDetailsToRender[serverTimeDetailIndex].value = formattedServerTime;
    } else {
        const marketStatusIndex = finalDetailsToRender.findIndex(d => d.label === "Late Hours Trading");
        if (marketStatusIndex !== -1) {
            finalDetailsToRender.splice(marketStatusIndex + 1, 0, { label: "Server Time (ET)", value: formattedServerTime });
        } else {
             finalDetailsToRender.push({ label: "Server Time (ET)", value: formattedServerTime });
        }
    }
  }
  
  // This log now more accurately reflects the processed state after useEffect.
  // It will still log on re-renders not caused by marketStatusJson change, but its content will be stable then.
  // The key is that the "PropsReceived" and parsing logic logs inside useEffect are now conditional.
  logDebug(componentName, 'RenderState', `isLoading=${isLoading}, isError=${isError}, errorMsg='${errorOrSkippedMessage}', details=${finalDetailsToRender.length}`);

  const placeholderRows = Math.max(1, details.filter(d => d.value !== "N/A" && d.value !== "").length || 4);

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
                : finalDetailsToRender.length > 0 && finalDetailsToRender.some(d => d.value && d.value !== "N/A")
                    ? finalDetailsToRender.map((item, index) => renderDetailRow(item, index, false))
                    : <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">{errorOrSkippedMessage || "No applicable market status to display."}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
