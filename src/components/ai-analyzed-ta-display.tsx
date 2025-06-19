
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { AnalyzeTaOutput } from "@/ai/schemas/ai-analyzed-ta-schemas"; 
import type { StockSnapshotData } from "@/services/data-sources/types";
import { formatToTwoDecimals } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TaPointDisplayInfo {
  key: keyof AnalyzeTaOutput; 
  label: string;
}

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-positive';
  if (sentiment === 'bearish') return 'text-destructive';
  return '';
};

const taPointDefinitions: TaPointDisplayInfo[] = [
  { key: "pivotPoint", label: "Pivot Point (PP)" },
  { key: "support1", label: "Support 1 (S1)" },
  { key: "support2", label: "Support 2 (S2)" },
  { key: "support3", label: "Support 3 (S3)" },
  { key: "resistance1", label: "Resistance 1 (R1)" },
  { key: "resistance2", label: "Resistance 2 (R2)" },
  { key: "resistance3", label: "Resistance 3 (R3)" },
];

const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }',
  '{ "status": "no_analysis_run_yet" }'
];

export function AiAnalyzedTaDisplay() { 
  const { aiAnalyzedTaJson, stockSnapshotJson, logDebug } = useStockAnalysis(); 
  const componentName = 'AiAnalyzedTaDisplay';
  const prevJsonRef = useRef<string | null>(null);

  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isErrorState, setIsErrorState] = useState(false);
  const [errorOrSkippedMessageState, setErrorOrSkippedMessageState] = useState("AI Analyzed TA data not available.");
  const [parsedTaDataState, setParsedTaDataState] = useState<AnalyzeTaOutput | null>(null);
  const [currentPriceState, setCurrentPriceState] = useState<number | null>(null);

  useEffect(() => {
    const currentJson = aiAnalyzedTaJson;
    if (currentJson !== prevJsonRef.current) {
      logDebug(componentName, "PropsReceived", "aiAnalyzedTaJson prop changed. New Length:", currentJson?.length);
      prevJsonRef.current = currentJson;
    } else {
      return;
    }
    
    let newIsLoading = true;
    let newIsError = false;
    let newErrorMsg = "AI Analyzed TA data not available."; 
    let newParsedData: AnalyzeTaOutput | null = null;

    if (!currentJson || currentJson === '{}') {
      newIsLoading = false; 
      newErrorMsg = "No AI Analyzed TA data. Ensure stock data was fetched and AI TA processed.";
      logDebug(componentName, "StateUpdate:NoData", newErrorMsg);
    } else if (PENDING_STATUS_JSON_VARIANTS.includes(currentJson.trim())) {
      newIsLoading = true;
      newErrorMsg = "Loading AI Analyzed TA...";
      logDebug(componentName, "StateUpdate:Loading", newErrorMsg);
    } else if (currentJson.includes('"status": "error"') || currentJson.includes('"error":')) {
      newIsLoading = false;
      newIsError = true;
      try {
        const statusObj = JSON.parse(currentJson);
        newErrorMsg = statusObj.message || statusObj.error || "Error loading AI Analyzed TA.";
      } catch (e) {
        newErrorMsg = "Error loading AI Analyzed TA (malformed error JSON).";
      }
      logDebug(componentName, "StateUpdate:Error", newErrorMsg);
    } else if (currentJson.includes('"status": "skipped"')) {
      newIsLoading = false;
      newIsError = true; // Treat skipped as an error for display
      try {
        const statusObj = JSON.parse(currentJson);
        newErrorMsg = statusObj.message || "AI Analyzed TA was skipped.";
      } catch (e) {
        newErrorMsg = "AI Analyzed TA was skipped (malformed skipped JSON).";
      }
      logDebug(componentName, "StateUpdate:Skipped", newErrorMsg);
    } else {
      try {
        const data = JSON.parse(currentJson) as AnalyzeTaOutput;
        if (data && typeof data === 'object' && data.pivotPoint !== undefined && data.support1 !== undefined) {
          newIsLoading = false;
          newIsError = false;
          newParsedData = data;
          newErrorMsg = ""; // Clear error message on successful parse
          logDebug(componentName, "DataParsed", "Successfully parsed aiAnalyzedTaJson. Keys:", Object.keys(newParsedData));
        } else {
          newIsLoading = false;
          newIsError = true;
          newErrorMsg = "AI Analyzed TA data is malformed or incomplete.";
          logDebug(componentName, "StateUpdate:Malformed", newErrorMsg);
        }
      } catch (e) {
        console.error(`[${componentName}] Failed to parse aiAnalyzedTaJson:`, e, "JSON:", currentJson.substring(0,200));
        newIsLoading = false;
        newIsError = true;
        newErrorMsg = "Failed to parse AI Analyzed TA data.";
        logDebug(componentName, "StateUpdate:ParseFailed", newErrorMsg);
      }
    }
    
    setIsLoadingState(newIsLoading);
    setIsErrorState(newIsError);
    setErrorOrSkippedMessageState(newErrorMsg);
    setParsedTaDataState(newParsedData);

  }, [aiAnalyzedTaJson, logDebug]);

  useEffect(() => {
    // Effect for current price, separate from TA data processing
    if (!isLoadingState && !isErrorState && parsedTaDataState && stockSnapshotJson && stockSnapshotJson !== '{}') {
      try {
        if (!PENDING_STATUS_JSON_VARIANTS.includes(stockSnapshotJson.trim()) && 
            !stockSnapshotJson.includes('"status":') && 
            !stockSnapshotJson.includes('"error":')) {
            const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
            if (snapshot && snapshot.currentPrice !== undefined && snapshot.currentPrice !== null) {
                setCurrentPriceState(snapshot.currentPrice);
            } else {
                setCurrentPriceState(null);
            }
        } else {
           setCurrentPriceState(null);
        }
      } catch (e) {
        logDebug(componentName, "ParseStockSnapshotError", "Failed to parse stockSnapshotJson for current price:", e);
        setCurrentPriceState(null);
      }
    } else if (isLoadingState || isErrorState || !parsedTaDataState) {
        setCurrentPriceState(null); // Reset if TA data is not ready
    }
  }, [isLoadingState, isErrorState, parsedTaDataState, stockSnapshotJson, logDebug]);

  logDebug(componentName, 'RenderState', `isLoading=${isLoadingState}, isError=${isErrorState}, errorMsg='${errorOrSkippedMessageState}', parsedData=${!!parsedTaDataState}, currentPrice=${currentPriceState}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analyzed Technical Analysis</CardTitle> 
        <CardDescription>Daily Pivot Points based on previous day HLC. Color indicates current price relative to Pivot Point.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Indicator</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingState ? (
              taPointDefinitions.map((pointDef) => (
                <TableRow key={`skeleton-${pointDef.key}`}>
                  <TableCell className="font-medium">
                    <Skeleton className="h-5 w-3/4" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-1/2 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : isErrorState ? (
                <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                        {errorOrSkippedMessageState}
                    </TableCell>
                </TableRow>
            ) : parsedTaDataState ? (
              taPointDefinitions.map((pointDef) => {
                const value = parsedTaDataState[pointDef.key];
                const displayValue = (value === null || value === undefined)
                  ? "N/A"
                  : formatToTwoDecimals(value as number, "N/A");

                let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
                if (pointDef.key === 'pivotPoint' && currentPriceState !== null && value !== null && value !== undefined) {
                    if (currentPriceState > (value as number)) sentiment = 'bullish';
                    else if (currentPriceState < (value as number)) sentiment = 'bearish';
                }
                const colorClass = pointDef.key === 'pivotPoint' ? getSentimentColorClass(sentiment) : '';

                return (
                  <TableRow key={pointDef.key}>
                    <TableCell className="font-medium">{pointDef.label}</TableCell>
                    <TableCell className={cn("text-right", colorClass)}>{displayValue}</TableCell>
                  </TableRow>
                );
              })
            ) : ( 
                 <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                        {errorOrSkippedMessageState}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
