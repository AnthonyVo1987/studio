
"use client";

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
  '{ "status": "full_analysis_pending..." }'
];

export function AiAnalyzedTaDisplay() { 
  const { aiAnalyzedTaJson, stockSnapshotJson, logDebug } = useStockAnalysis(); 
  const componentName = 'AiAnalyzedTaDisplay';

  logDebug(componentName, "PropsReceived", "aiAnalyzedTaJson received. Length:", aiAnalyzedTaJson?.length, "Is empty/null:", !aiAnalyzedTaJson || aiAnalyzedTaJson === '{}');
  
  let isLoading = false;
  let isError = false;
  let errorOrSkippedMessage = "AI Analyzed TA data not available."; 
  let parsedTaData: AnalyzeTaOutput | null = null; 
  let currentPrice: number | null = null;

  if (!aiAnalyzedTaJson || aiAnalyzedTaJson === '{}') {
    isLoading = false; 
    isError = false; 
    parsedTaData = null;
    errorOrSkippedMessage = "No AI Analyzed TA data. Ensure stock data was fetched and AI TA processed.";
  } else if (PENDING_STATUS_JSON_VARIANTS.includes(aiAnalyzedTaJson.trim())) {
    isLoading = true;
    isError = false;
    parsedTaData = null;
    errorOrSkippedMessage = ""; 
  } else if (aiAnalyzedTaJson.includes('"status": "error"') || aiAnalyzedTaJson.includes('"status": "skipped"')) {
    isLoading = false;
    isError = true;
    parsedTaData = null;
    try {
      const statusObj = JSON.parse(aiAnalyzedTaJson);
      if (statusObj.status === "skipped") {
        errorOrSkippedMessage = statusObj.message || "AI Analyzed TA was skipped.";
      } else { 
        errorOrSkippedMessage = statusObj.message || statusObj.error || "Error loading AI Analyzed TA.";
      }
    } catch (e) {
      errorOrSkippedMessage = "Failed to parse status message from error/skipped JSON for AI Analyzed TA.";
    }
  } else {
    isLoading = false;
    isError = false;
    try {
      const data = JSON.parse(aiAnalyzedTaJson) as AnalyzeTaOutput;
      if (data && typeof data === 'object' && data.pivotPoint !== undefined && data.support1 !== undefined) {
        parsedTaData = data;
        logDebug(componentName, "DataParsed", "Successfully parsed aiAnalyzedTaJson. Keys:", Object.keys(parsedTaData));
      } else {
        isError = true;
        errorOrSkippedMessage = "AI Analyzed TA data is malformed or incomplete.";
        parsedTaData = null;
      }
    } catch (e) {
      isError = true;
      errorOrSkippedMessage = "Failed to parse AI Analyzed TA data.";
      parsedTaData = null;
    }
  }

  if (!isLoading && !isError && parsedTaData && stockSnapshotJson && stockSnapshotJson !== '{}') {
      try {
        if (!PENDING_STATUS_JSON_VARIANTS.includes(stockSnapshotJson.trim()) && 
            !stockSnapshotJson.includes('"status":') && 
            !stockSnapshotJson.includes('"error":')) {
            const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
            if (snapshot && snapshot.currentPrice !== undefined && snapshot.currentPrice !== null) {
                currentPrice = snapshot.currentPrice;
            }
        }
      } catch (e) {
        logDebug(componentName, "ParseStockSnapshotError", "Failed to parse stockSnapshotJson for current price:", e);
      }
  }

  logDebug(componentName, 'RenderState', `isLoading=${isLoading}, isError=${isError}, errorOrSkippedMessage='${errorOrSkippedMessage}', parsedTaData exists=${!!parsedTaData}, currentPrice=${currentPrice}`);

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
            {isLoading ? (
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
            ) : isError ? (
                <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                        {errorOrSkippedMessage}
                    </TableCell>
                </TableRow>
            ) : parsedTaData ? (
              taPointDefinitions.map((pointDef) => {
                const value = parsedTaData[pointDef.key];
                const displayValue = (value === null || value === undefined)
                  ? "N/A"
                  : formatToTwoDecimals(value as number, "N/A");

                let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
                if (pointDef.key === 'pivotPoint' && currentPrice !== null && value !== null && value !== undefined) {
                    if (currentPrice > (value as number)) sentiment = 'bullish';
                    else if (currentPrice < (value as number)) sentiment = 'bearish';
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
                        {errorOrSkippedMessage || "AI Analyzed TA data is unavailable."}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
