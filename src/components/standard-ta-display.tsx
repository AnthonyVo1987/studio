
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { TechnicalIndicatorsData, MultiWindowIndicatorValues, MACDValue, VWAPValue } from "@/services/data-sources/types";
import { formatToTwoDecimals } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-positive';
  if (sentiment === 'bearish') return 'text-destructive';
  return '';
};

const renderMultiWindowValues = (
  label: string,
  data?: MultiWindowIndicatorValues | null,
  windows?: string[], 
  sentimentKey?: string, 
  getSentiment?: (value?: number | null) => 'bullish' | 'bearish' | 'neutral'
) => {
  if (!windows || windows.length === 0) return null;

  const valuesExist = data && windows.some(w => data[w] !== undefined && data[w] !== null);
  if (!valuesExist && !(data && (data as any).error)) return null; 

  const displayValues = windows.map(window => {
    const val = data?.[window];
    const formattedVal = formatToTwoDecimals(val);
    let sentimentColor = '';
    if (sentimentKey === window && getSentiment && val !== undefined) {
      sentimentColor = getSentimentColorClass(getSentiment(val));
    }
    return `${window}: ` + (sentimentColor ? `<span class="${sentimentColor}">${formattedVal}</span>` : formattedVal);
  }).join(' | ');

  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-right" dangerouslySetInnerHTML={{ __html: displayValues }} />
    </TableRow>
  );
};

const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }',
  '{ "status": "no_analysis_run_yet" }'
];

export function StandardTaDisplay() {
  const { standardTasJson, logDebug } = useStockAnalysis();
  const componentName = 'StandardTaDisplay';
  const prevJsonRef = useRef<string | null>(null);

  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isErrorState, setIsErrorState] = useState(false);
  const [errorOrSkippedMessageState, setErrorOrSkippedMessageState] = useState("Technical indicators data not available.");
  const [parsedTaDataState, setParsedTaDataState] = useState<TechnicalIndicatorsData | null>(null);

  useEffect(() => {
    const currentJson = standardTasJson;
    if (currentJson !== prevJsonRef.current) {
      logDebug(componentName, "PropsReceived", "standardTasJson prop changed. New Length:", currentJson?.length);
      prevJsonRef.current = currentJson;
    } else {
      return;
    }

    let newIsLoading = true;
    let newIsError = false;
    let newErrorMsg = "Technical indicators data not available.";
    let newParsedData: TechnicalIndicatorsData | null = null;

    if (currentJson && currentJson !== '{}') {
      if (PENDING_STATUS_JSON_VARIANTS.includes(currentJson.trim())) {
        newIsLoading = true;
        newErrorMsg = "Loading standard TAs...";
        logDebug(componentName, "StateUpdate:Loading", newErrorMsg);
      } else if (currentJson.includes('"error":') || currentJson.includes('"status": "skipped"')) {
        newIsLoading = false;
        newIsError = true;
        if (currentJson.includes('"status": "skipped"')) {
          newErrorMsg = "Standard TA loading was skipped.";
        } else {
          newErrorMsg = "Error loading standard TAs.";
          try {
            const tempData = JSON.parse(currentJson);
            if (tempData.error) newErrorMsg = tempData.error;
          } catch(e) { /* Ignore parse error for error message itself */ }
        }
        logDebug(componentName, "StateUpdate:ErrorOrSkipped", newErrorMsg);
      } else {
        try {
          const data = JSON.parse(currentJson) as TechnicalIndicatorsData;
          if (data && typeof data === 'object' && !data.error) { 
            newIsLoading = false;
            newIsError = false;
            newParsedData = data;
            logDebug(componentName, "DataParsed", "Successfully parsed standardTasJson. Keys:", Object.keys(newParsedData));
          } else if (data && data.error) {
            newIsLoading = false;
            newIsError = true;
            newErrorMsg = data.error;
            logDebug(componentName, "StateUpdate:DataErrorField", newErrorMsg);
          } else {
            newIsLoading = false;
            newIsError = true;
            newErrorMsg = "Standard TA data is malformed or incomplete.";
            logDebug(componentName, "StateUpdate:Malformed", newErrorMsg);
          }
        } catch (e) {
          console.error(`[${componentName}] Failed to parse standardTasJson:`, e, "JSON:", currentJson.substring(0,200));
          newIsLoading = false;
          newIsError = true;
          newErrorMsg = "Failed to parse standard TA data.";
          logDebug(componentName, "StateUpdate:ParseFailed", newErrorMsg);
        }
      }
    } else {
      newIsLoading = false;
      newErrorMsg = "No standard TA data to display.";
      logDebug(componentName, "StateUpdate:NoData", newErrorMsg);
    }

    setIsLoadingState(newIsLoading);
    setIsErrorState(newIsError);
    setErrorOrSkippedMessageState(newErrorMsg);
    setParsedTaDataState(newParsedData);

  }, [standardTasJson, logDebug]);
  
  logDebug(componentName, 'RenderState', `isLoading=${isLoadingState}, isError=${isErrorState}, errorMsg='${errorOrSkippedMessageState}', parsedData=${!!parsedTaDataState}`);

  const rsiSentiment = (val?: number | null) => {
    if (val === undefined || val === null) return 'neutral';
    if (val < 30) return 'bullish';
    if (val > 70) return 'bearish';
    return 'neutral';
  };

  const macdSentiment = (histogram?: number | null) => {
    if (histogram === undefined || histogram === null) return 'neutral';
    if (histogram > 0) return 'bullish';
    if (histogram < 0) return 'bearish';
    return 'neutral';
  };

  const renderSkeletonRow = (key: string) => (
    <TableRow key={`skeleton-ta-${key}`}>
      <TableCell className="font-medium"><Skeleton className="h-5 w-3/4" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-5 w-full" /></TableCell>
    </TableRow>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standard Technical Indicators</CardTitle>
        <CardDescription>Commonly used technical indicators with multiple time windows.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Indicator</TableHead>
              <TableHead className="text-right">Value(s)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingState ? (
              <>
                {renderSkeletonRow("rsi")}
                {renderSkeletonRow("macd")}
                {renderSkeletonRow("vwap")}
                {renderSkeletonRow("ema")}
                {renderSkeletonRow("sma")}
              </>
            ) : isErrorState ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  {errorOrSkippedMessageState}
                </TableCell>
              </TableRow>
            ) : !parsedTaDataState || Object.keys(parsedTaDataState).length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  {errorOrSkippedMessageState}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {renderMultiWindowValues("RSI", parsedTaDataState.RSI, ["7", "10", "14"], "14", rsiSentiment)}
                <TableRow>
                  <TableCell className="font-medium">MACD (12,26,9)</TableCell>
                  <TableCell className="text-right">
                    {parsedTaDataState.MACD ? (
                      <>
                        {formatToTwoDecimals(parsedTaDataState.MACD.value)} / {formatToTwoDecimals(parsedTaDataState.MACD.signal)} / <span className={getSentimentColorClass(macdSentiment(parsedTaDataState.MACD.histogram))}>{formatToTwoDecimals(parsedTaDataState.MACD.histogram)}</span>
                      </>
                    ) : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">VWAP</TableCell>
                  <TableCell className="text-right">
                    {parsedTaDataState.VWAP ? (
                      `Day: $${formatToTwoDecimals(parsedTaDataState.VWAP.day)} | Minute: $${formatToTwoDecimals(parsedTaDataState.VWAP.minute)}`
                    ) : "N/A"}
                  </TableCell>
                </TableRow>
                {renderMultiWindowValues("EMA", parsedTaDataState.EMA, ["5", "10", "20", "50", "200"])}
                {renderMultiWindowValues("SMA", parsedTaDataState.SMA, ["5", "10", "20", "50", "200"])}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
