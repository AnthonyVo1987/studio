
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { CalculateAiTaOutput } from "@/ai/schemas/ai-calculated-ta-schemas";
import type { StockSnapshotData } from "@/services/data-sources/types";
import { formatToTwoDecimals } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TaPointDisplayInfo {
  key: keyof CalculateAiTaOutput;
  label: string;
}

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-positive'; // Use theme color
  if (sentiment === 'bearish') return 'text-destructive'; // Use theme color
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

export function AiCalculatedTaDisplay() {
  const { aiCalculatedTaJson, stockSnapshotJson, logDebug } = useStockAnalysis();
  logDebug('AiCalculatedTaDisplay', "aiCalculatedTaJson (start):", aiCalculatedTaJson.substring(0,100));
  logDebug('AiCalculatedTaDisplay', "stockSnapshotJson (start):", stockSnapshotJson.substring(0,100));

  let isLoading = false;
  let isError = false;
  let parsedTaData: CalculateAiTaOutput | null = null;
  let currentPrice: number | null = null;

  if (aiCalculatedTaJson && aiCalculatedTaJson !== '{}') {
    if (aiCalculatedTaJson.includes('"status": "initializing"') || aiCalculatedTaJson.includes('"status": "pending"') || aiCalculatedTaJson.includes('"status": "full_analysis_pending..."')) {
      logDebug('AiCalculatedTaDisplay', "aiCalculatedTaJson is in pending/initializing state.");
      isLoading = true;
    } else if (aiCalculatedTaJson.includes('"status": "error"') || aiCalculatedTaJson.includes('"status": "skipped"')) {
      logDebug('AiCalculatedTaDisplay', "aiCalculatedTaJson indicates an error or skipped state.");
      isLoading = false;
      isError = true;
    } else {
      try {
        const data = JSON.parse(aiCalculatedTaJson) as CalculateAiTaOutput;
        logDebug('AiCalculatedTaDisplay', "Successfully parsed aiCalculatedTaJson. PivotPoint:", data?.pivotPoint);
        if (data && typeof data === 'object' && !(data as any).error && !(data as any).status && data.pivotPoint !== undefined) {
          isLoading = false;
          isError = false;
          parsedTaData = data;
        } else {
          logDebug('AiCalculatedTaDisplay', "Parsed aiCalculatedTaJson is missing pivotPoint or contains error/status field.");
          isLoading = false;
          isError = true;
        }
      } catch (e) {
        console.error("[AiCalculatedTaDisplay] Failed to parse aiCalculatedTaJson:", e);
        logDebug('AiCalculatedTaDisplay', "Error during aiCalculatedTaJson parsing.", e);
        isLoading = false;
        isError = true;
      }
    }
  } else {
     logDebug('AiCalculatedTaDisplay', "aiCalculatedTaJson is empty or null.");
     isLoading = false;
  }

  if (!isLoading && !isError && parsedTaData && stockSnapshotJson && stockSnapshotJson !== '{}') {
      try {
        if (!stockSnapshotJson.includes('"status":') && !stockSnapshotJson.includes('"error":')) {
            const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
            if (snapshot && snapshot.currentPrice !== undefined && snapshot.currentPrice !== null) {
                currentPrice = snapshot.currentPrice;
                logDebug('AiCalculatedTaDisplay', "Current price from stockSnapshotJson for sentiment:", currentPrice);
            }
        }
      } catch (e) {
        logDebug('AiCalculatedTaDisplay', "Failed to parse stockSnapshotJson for current price:", e);
      }
  }

  logDebug('AiCalculatedTaDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, parsedTaData exists=${!!parsedTaData}, currentPrice=${currentPrice}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Calculated Technical Analysis</CardTitle>
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
            {taPointDefinitions.map((pointDef) => {
              if (isLoading) {
                return (
                  <TableRow key={`skeleton-${pointDef.key}`}>
                    <TableCell className="font-medium">
                      <Skeleton className="h-5 w-3/4" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-5 w-1/2 ml-auto" />
                    </TableCell>
                  </TableRow>
                );
              }

              const value = parsedTaData ? parsedTaData[pointDef.key] : null;
              const displayValue = isError && !parsedTaData ? "N/A" : (value === null || value === undefined
                ? "N/A"
                : formatToTwoDecimals(value as number, "N/A"));

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
            })}
            {isError && !isLoading && (!parsedTaData || Object.keys(parsedTaData).length === 0) && (
                <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                        AI TA data not available.
                    </TableCell>
                </TableRow>
            )}
             {!isLoading && !isError && !parsedTaData && (
                 <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                        No AI TA data to display. Ensure stock data was fetched.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
