
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { type AugmentedOptionsSearchOutput } from "@/ai/schemas/augmented-options-search-schemas";
import { formatToTwoDecimals, formatCompactNumber, formatCurrency } from '@/lib/number-utils';
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

export function AugmentedOptionsDisplay() {
  const { augmentedOptionsSearchJson, logDebug } = useStockAnalysis();
  const componentName = 'AugmentedOptionsDisplay';
  const prevJsonRef = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [displayData, setDisplayData] = useState<DisplayRow[]>([]);

  useEffect(() => {
    const currentJson = augmentedOptionsSearchJson;
    if (currentJson === prevJsonRef.current) return;
    prevJsonRef.current = currentJson;

    logDebug(componentName, "PropsReceived", "augmentedOptionsSearchJson prop changed.", { length: currentJson?.length });

    if (!currentJson || currentJson === '{}' || PENDING_STATUS_JSON_VARIANTS.includes(currentJson.trim())) {
      setIsLoading(false);
      setIsError(false);
      setDisplayData([]);
      setErrorMessage(null);
      return;
    }
    
    // Explicitly set loading to true when a fetch is initiated (indicated by 'pending...' status).
    if (currentJson.includes('"status": "pending..."')) {
        setIsLoading(true);
        setIsError(false);
        setDisplayData([]);
        setErrorMessage(null);
        return;
    }

    try {
      const data: AugmentedOptionsSearchOutput | { error?: string } = JSON.parse(currentJson);

      if ('error' in data && data.error) {
        setIsLoading(false);
        setIsError(true);
        setErrorMessage(data.error);
        setDisplayData([]);
        return;
      }

      const optionsData = data as AugmentedOptionsSearchOutput;
      const newDisplayData: DisplayRow[] = [];

      if (optionsData.maxPain !== null) {
        newDisplayData.push({ label: "Max Pain", value: formatCurrency(optionsData.maxPain, "$") });
      }

      if (optionsData.putCallRatio !== null) {
        newDisplayData.push({ label: "Put/Call Ratio", value: formatToTwoDecimals(optionsData.putCallRatio, "N/A") });
      }

      if (optionsData.gammaExposure !== null) {
        newDisplayData.push({ label: "Gamma Exposure (GEX)", value: formatCompactNumber(optionsData.gammaExposure, "N/A") });
      }

      if (optionsData.ivRank !== null) {
        newDisplayData.push({ label: "IV Rank", value: `${formatToTwoDecimals(optionsData.ivRank, "N/A")}%` });
      }
      
      setIsLoading(false);
      setIsError(false);
      setDisplayData(newDisplayData);
      setErrorMessage(null);

    } catch (e) {
      logDebug(componentName, "ParseFailed", "Failed to parse augmentedOptionsSearchJson.", e);
      setIsLoading(false);
      setIsError(true);
      setErrorMessage("Failed to parse augmented options data.");
      setDisplayData([]);
    }
  }, [augmentedOptionsSearchJson, logDebug]);
  
  if (!isLoading && !isError && displayData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Augmented Options Flow
          <Badge variant="outline">Web Search</Badge>
        </CardTitle>
        <CardDescription>Advanced options metrics sourced from Google Search in real-time.</CardDescription>
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
                  <TableCell className="font-semibold w-1/2">{row.label}</TableCell>
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
