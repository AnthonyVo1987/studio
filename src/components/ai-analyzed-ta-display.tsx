
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

export function AiAnalyzedTaDisplay() { 
  const { aiAnalyzedTaJson, stockSnapshotJson, logDebug } = useStockAnalysis(); 
  logDebug('AiAnalyzedTaDisplay', "aiAnalyzedTaJson (start):", aiAnalyzedTaJson.substring(0,100));
  logDebug('AiAnalyzedTaDisplay', "stockSnapshotJson (start):", stockSnapshotJson.substring(0,100));

  let isLoading = false;
  let isError = false;
  let errorOrSkippedMessage = "AI Analyzed TA data not available."; 
  let parsedTaData: AnalyzeTaOutput | null = null; 
  let currentPrice: number | null = null;

  if (aiAnalyzedTaJson && aiAnalyzedTaJson !== '{}') {
    if (aiAnalyzedTaJson.includes('"status": "initializing"') || aiAnalyzedTaJson.includes('"status": "pending"') || aiAnalyzedTaJson.includes('"status": "full_analysis_pending..."')) {
      logDebug('AiAnalyzedTaDisplay', "aiAnalyzedTaJson is in pending/initializing state.");
      isLoading = true;
    } else if (aiAnalyzedTaJson.includes('"status": "error"')) {
      logDebug('AiAnalyzedTaDisplay', "aiAnalyzedTaJson indicates an error state.");
      isLoading = false;
      isError = true;
      try {
        const errorData = JSON.parse(aiAnalyzedTaJson);
        errorOrSkippedMessage = errorData.message || "Error loading AI Analyzed TA.";
      } catch {
        errorOrSkippedMessage = "Error loading AI Analyzed TA.";
      }
    } else if (aiAnalyzedTaJson.includes('"status": "skipped"')) {
      logDebug('AiAnalyzedTaDisplay', "aiAnalyzedTaJson indicates a skipped state.");
      isLoading = false;
      isError = true; 
      errorOrSkippedMessage = "AI Analyzed TA was skipped.";
    } else {
      try {
        const data = JSON.parse(aiAnalyzedTaJson) as AnalyzeTaOutput; 
        logDebug('AiAnalyzedTaDisplay', "Attempting to parse aiAnalyzedTaJson. Parsed PivotPoint:", data?.pivotPoint);
        if (data && typeof data === 'object' && data.pivotPoint !== undefined) {
          isLoading = false;
          isError = false;
          parsedTaData = data;
        } else {
          logDebug('AiAnalyzedTaDisplay', "Parsed aiAnalyzedTaJson is missing pivotPoint or critical data.");
          isLoading = false;
          isError = true;
          errorOrSkippedMessage = "AI Analyzed TA data is malformed or incomplete.";
        }
      } catch (e) {
        console.error("[AiAnalyzedTaDisplay] Failed to parse aiAnalyzedTaJson:", e);
        logDebug('AiAnalyzedTaDisplay', "Error during aiAnalyzedTaJson parsing.", e);
        isLoading = false;
        isError = true;
        errorOrSkippedMessage = "Failed to parse AI Analyzed TA data.";
      }
    }
  } else {
     logDebug('AiAnalyzedTaDisplay', "aiAnalyzedTaJson is empty or null. No data to display.");
     isLoading = false; // Not loading if empty
     isError = true; // Treat as error/unavailable if null or empty and not explicitly loading
     errorOrSkippedMessage = "No AI Analyzed TA data. Ensure stock data was fetched and AI TA processed.";
  }

  if (!isLoading && !isError && parsedTaData && stockSnapshotJson && stockSnapshotJson !== '{}') {
      try {
        if (!stockSnapshotJson.includes('"status":') && !stockSnapshotJson.includes('"error":')) {
            const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
            if (snapshot && snapshot.currentPrice !== undefined && snapshot.currentPrice !== null) {
                currentPrice = snapshot.currentPrice;
                logDebug('AiAnalyzedTaDisplay', "Current price from stockSnapshotJson for sentiment:", currentPrice);
            } else {
                logDebug('AiAnalyzedTaDisplay', "Current price not found in valid stockSnapshotJson.");
            }
        }
      } catch (e) {
        logDebug('AiAnalyzedTaDisplay', "Failed to parse stockSnapshotJson for current price:", e);
      }
  }

  logDebug('AiAnalyzedTaDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, errorOrSkippedMessage=${errorOrSkippedMessage}, parsedTaData exists=${!!parsedTaData}, currentPrice=${currentPrice}`);

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
            {isError && !isLoading && !parsedTaData && (
                <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                        {errorOrSkippedMessage}
                    </TableCell>
                </TableRow>
            )}
             {!isLoading && !isError && !parsedTaData && aiAnalyzedTaJson && aiAnalyzedTaJson === '{}' && ( // Explicitly check for empty JSON if not loading/error
                 <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                        No AI Analyzed TA data.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    