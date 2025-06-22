
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { type AugmentedTaSearchOutput } from "@/ai/flows/augmented-ta-search-flow";
import { formatToTwoDecimals } from '@/lib/number-utils';
import { Badge } from './ui/badge';

const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }',
  '{ "status": "no_analysis_run_yet" }'
];

interface DisplayRow {
  label: string;
  value: string | React.ReactNode;
}

export function AugmentedTaDisplay() {
  const { augmentedTaSearchJson, logDebug } = useStockAnalysis();
  const componentName = 'AugmentedTaDisplay';
  const prevJsonRef = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [displayData, setDisplayData] = useState<DisplayRow[]>([]);

  useEffect(() => {
    const currentJson = augmentedTaSearchJson;
    if (currentJson === prevJsonRef.current) return;
    prevJsonRef.current = currentJson;

    logDebug(componentName, "PropsReceived", "augmentedTaSearchJson prop changed.", { length: currentJson?.length });

    if (!currentJson || currentJson === '{}' || PENDING_STATUS_JSON_VARIANTS.includes(currentJson.trim())) {
      setIsLoading(false);
      setIsError(false);
      setDisplayData([]);
      setErrorMessage(null);
      return;
    }

    try {
      const data: AugmentedTaSearchOutput | { error?: string } = JSON.parse(currentJson);

      if ('error' in data && data.error) {
        setIsLoading(false);
        setIsError(true);
        setErrorMessage(data.error);
        setDisplayData([]);
        return;
      }

      const taData = data as AugmentedTaSearchOutput;
      const newDisplayData: DisplayRow[] = [];

      if (taData.atr14 !== null) {
        newDisplayData.push({ label: "ATR (14)", value: formatToTwoDecimals(taData.atr14, "N/A") });
      }

      if (taData.supportLevels && taData.supportLevels.length > 0) {
        newDisplayData.push({ label: "Support Levels", value: taData.supportLevels.map(l => `$${formatToTwoDecimals(l)}`).join(' | ') });
      }

      if (taData.resistanceLevels && taData.resistanceLevels.length > 0) {
        newDisplayData.push({ label: "Resistance Levels", value: taData.resistanceLevels.map(l => `$${formatToTwoDecimals(l)}`).join(' | ') });
      }
      
      if (taData.bollingerBands) {
        const { upper, middle, lower } = taData.bollingerBands;
        newDisplayData.push({ label: "Bollinger Bands", value: (
          <div className="flex flex-col items-end">
            <span>Upper: ${formatToTwoDecimals(upper)}</span>
            <span>Middle: ${formatToTwoDecimals(middle)}</span>
            <span>Lower: ${formatToTwoDecimals(lower)}</span>
          </div>
        ) });
      }

      if (taData.fibonacciRetracement) {
        const fibLevels = Object.entries(taData.fibonacciRetracement).map(([level, value]) => `${level}: $${formatToTwoDecimals(value)}`).join(', ');
        newDisplayData.push({ label: "Fibonacci Retracement", value: <span className="text-xs">{fibLevels}</span> });
      }
      
      setIsLoading(false);
      setIsError(false);
      setDisplayData(newDisplayData);
      setErrorMessage(null);

    } catch (e) {
      logDebug(componentName, "ParseFailed", "Failed to parse augmentedTaSearchJson.", e);
      setIsLoading(false);
      setIsError(true);
      setErrorMessage("Failed to parse augmented TA data.");
      setDisplayData([]);
    }
  }, [augmentedTaSearchJson, logDebug]);
  
  if (!isLoading && !isError && displayData.length === 0) {
    // Don't render anything if there's no data to show and no loading/error state
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Augmented Technical Analysis
          <Badge variant="outline">Web Search</Badge>
        </CardTitle>
        <CardDescription>Additional indicators sourced from Google Search in real-time.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : isError ? (
          <div className="text-center text-destructive">{errorMessage}</div>
        ) : (
          <Table>
            <TableBody>
              {displayData.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-semibold w-1/3">{row.label}</TableCell>
                  <TableCell className="text-right">{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
