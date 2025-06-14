
"use client";

import React, { useState, useEffect } from 'react';
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

  const [formattedServerTime, setFormattedServerTime] = useState<string>("Loading server time...");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorOrSkippedMessage, setErrorOrSkippedMessage] = useState<string | null>("Market status data not available.");
  const [details, setDetails] = useState<MarketDetailItem[]>([]);

  useEffect(() => {
    logDebug(componentName, "marketStatusJson (effect start):", marketStatusJson ? marketStatusJson.substring(0,100) : "null");
    let currentIsLoading = false;
    let currentIsError = false;
    let currentErrorOrSkippedMessage: string | null = "Market status data not available.";
    let currentDetails: MarketDetailItem[] = [];

    if (!marketStatusJson || marketStatusJson === '{}') {
      currentIsLoading = false;
      currentIsError = false; 
      currentErrorOrSkippedMessage = "No market status data. Ensure stock data was fetched.";
      logDebug(componentName, "marketStatusJson is empty or null. Displaying 'No data'.");
    } else if (PENDING_STATUS_JSON_VARIANTS.includes(marketStatusJson.trim())) {
      currentIsLoading = true;
      currentIsError = false;
      currentErrorOrSkippedMessage = ""; 
      logDebug(componentName, "marketStatusJson is in a defined pending/initializing state.");
    } else if (marketStatusJson.includes('"status": "error"') || marketStatusJson.includes('"error":')) {
      currentIsLoading = false;
      currentIsError = true;
      try {
        const statusObj = JSON.parse(marketStatusJson);
        currentErrorOrSkippedMessage = statusObj.message || statusObj.error || "Error loading market status.";
      } catch (e) {
        currentErrorOrSkippedMessage = "Error loading market status (failed to parse error JSON).";
      }
      logDebug(componentName, "marketStatusJson indicates an error state.", currentErrorOrSkippedMessage);
    } else if (marketStatusJson.includes('"status": "skipped"')) {
      currentIsLoading = false;
      currentIsError = true;
      try {
        const statusObj = JSON.parse(marketStatusJson);
        currentErrorOrSkippedMessage = statusObj.message || "Market status loading was skipped.";
      } catch (e) {
        currentErrorOrSkippedMessage = "Market status loading was skipped (failed to parse skipped JSON).";
      }
      logDebug(componentName, "marketStatusJson indicates a skipped state.", currentErrorOrSkippedMessage);
    } else {
      try {
        const data = JSON.parse(marketStatusJson) as MarketStatusData;
        logDebug(componentName, "Attempting to parse marketStatusJson in effect. Market status:", data?.market);
        if (data && typeof data === 'object' && !data.error) {
          currentIsLoading = false;
          currentIsError = false;
          currentErrorOrSkippedMessage = null; 
          
          setFormattedServerTime(formatTimestampToPacificTime(data.serverTime));

          currentDetails = [
            { label: "Market Status", value: data.market?.toUpperCase() || "N/A" },
            { label: "Early Hours Trading", value: data.earlyHours ? "Yes" : "No" },
            { label: "Late Hours Trading", value: data.lateHours ? "Yes" : "No" },
            // Server Time will be handled by formattedServerTime state
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
          logDebug(componentName, "Successfully parsed marketStatusJson in effect.", currentDetails);
        } else {
           if (data?.error) {
             currentErrorOrSkippedMessage = `Error in market data: ${data.error}`;
             logDebug(componentName, "Parsed marketStatusJson (effect) contains an error field:", data.error);
           } else {
             currentErrorOrSkippedMessage = "Market status data is malformed.";
             logDebug(componentName, "Parsed marketStatusJson (effect) is not a valid object for display.");
           }
           currentIsLoading = false;
           currentIsError = true;
        }
      } catch (e) {
        console.error(`[${componentName}] (effect) Failed to parse marketStatusJson:`, e);
        logDebug(componentName, "Error during marketStatusJson parsing in effect.", e);
        currentIsLoading = false;
        currentIsError = true;
        currentErrorOrSkippedMessage = "Failed to parse market status data.";
      }
    }
    
    setIsLoading(currentIsLoading);
    setIsError(currentIsError);
    setErrorOrSkippedMessage(currentErrorOrSkippedMessage);
    setDetails(currentDetails);

  }, [marketStatusJson, logDebug]);


  const finalDetails = [...details];
  if (!isLoading && !isError && errorOrSkippedMessage === null) {
    const serverTimeDetailIndex = finalDetails.findIndex(d => d.label === "Server Time (ET)");
    if (serverTimeDetailIndex > -1) {
        finalDetails[serverTimeDetailIndex].value = formattedServerTime;
    } else {
        // Insert server time if not already part of the initial detail construction (e.g. if it was added later)
        const marketStatusIndex = finalDetails.findIndex(d => d.label === "Late Hours Trading"); // Find a common point to insert after
        if (marketStatusIndex !== -1) {
            finalDetails.splice(marketStatusIndex + 1, 0, { label: "Server Time (ET)", value: formattedServerTime });
        } else {
             finalDetails.push({ label: "Server Time (ET)", value: formattedServerTime }); // Fallback to append
        }
    }
  }


  logDebug(componentName, `Render state: isLoading=${isLoading}, isError=${isError}, errorOrSkippedMessage=${errorOrSkippedMessage}, details.length=${finalDetails.length}, formattedServerTime=${formattedServerTime}`);
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
                : finalDetails.length > 0 && finalDetails.some(d => d.value && d.value !== "N/A")
                    ? finalDetails.map((item, index) => renderDetailRow(item, index, false))
                    : <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">{errorOrSkippedMessage || "No applicable market status to display."}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    