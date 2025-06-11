
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { TechnicalIndicatorsData, TechnicalIndicatorValue } from "@/services/data-sources/types";
import { formatToTwoDecimals } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TaIndicatorDisplayInfo {
  key: keyof TechnicalIndicatorsData;
  label: string;
  formatter: (value?: TechnicalIndicatorValue | null) => string;
  getSentiment?: (value?: TechnicalIndicatorValue | null) => 'bullish' | 'bearish' | 'neutral';
}

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-green-600 dark:text-green-400';
  if (sentiment === 'bearish') return 'text-red-600 dark:text-red-400';
  return '';
};

const taDefinitions: TaIndicatorDisplayInfo[] = [
  {
    key: "RSI",
    label: "RSI (14)",
    formatter: (val) => formatToTwoDecimals(val?.value),
    getSentiment: (val) => {
      if (val?.value === undefined || val.value === null) return 'neutral';
      if (val.value < 30) return 'bullish';
      if (val.value > 70) return 'bearish';
      return 'neutral';
    }
  },
  {
    key: "EMA",
    label: "EMA (20)",
    formatter: (val) => `$${formatToTwoDecimals(val?.value)}`
  },
  {
    key: "SMA",
    label: "SMA (50)",
    formatter: (val) => `$${formatToTwoDecimals(val?.value)}`
  },
  {
    key: "MACD",
    label: "MACD (12,26,9)",
    formatter: (val) =>
      val?.value !== undefined && val?.signal !== undefined && val?.histogram !== undefined
      ? `${formatToTwoDecimals(val.value)} / ${formatToTwoDecimals(val.signal)} / ${formatToTwoDecimals(val.histogram)}`
      : "N/A",
    getSentiment: (val) => {
      if (val?.histogram === undefined || val.histogram === null) return 'neutral';
      if (val.histogram > 0) return 'bullish';
      if (val.histogram < 0) return 'bearish';
      return 'neutral';
    }
  },
  {
    key: "VWAP",
    label: "VWAP (Day)",
    formatter: (val) => `$${formatToTwoDecimals(val?.value)}`
  },
];

export function StandardTaDisplay() {
  const { standardTasJson, logDebug } = useStockAnalysis();
  logDebug('StandardTaDisplay', "standardTasJson (start):", standardTasJson.substring(0,100));

  let isLoading = false;
  let isError = false;
  let parsedTaData: Partial<TechnicalIndicatorsData> | null = null;

  if (standardTasJson && standardTasJson !== '{}') {
    if (standardTasJson.includes('"status": "initializing"') || standardTasJson.includes('"status": "pending"') || standardTasJson.includes('"status": "full_analysis_pending..."')) {
      logDebug('StandardTaDisplay', "standardTasJson is in pending/initializing state.");
      isLoading = true;
    } else if (standardTasJson.includes('"error":') || standardTasJson.includes('"status": "skipped"')) {
      logDebug('StandardTaDisplay', "standardTasJson indicates an error or skipped state.");
      isLoading = false;
      isError = true;
    } else {
      try {
        const data = JSON.parse(standardTasJson) as TechnicalIndicatorsData;
        logDebug('StandardTaDisplay', "Successfully parsed standardTasJson. RSI value:", data?.RSI?.value);
        if (data && typeof data === 'object' && !data.error && (data.RSI || data.EMA || data.SMA || data.MACD || data.VWAP)) {
          isLoading = false;
          isError = false;
          parsedTaData = data;
        } else {
          logDebug('StandardTaDisplay', "Parsed standardTasJson is missing expected TA data or is not an object.");
          isLoading = false;
          isError = true;
        }
      } catch (e) {
        console.error("[StandardTaDisplay] Failed to parse standardTasJson:", e);
        logDebug('StandardTaDisplay', "Error during standardTasJson parsing.", e);
        isLoading = false;
        isError = true;
      }
    }
  } else {
    logDebug('StandardTaDisplay', "standardTasJson is empty or null.");
    isLoading = false;
  }

  logDebug('StandardTaDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, parsedTaData exists=${!!parsedTaData && Object.keys(parsedTaData).length > 0}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standard Technical Indicators</CardTitle>
        <CardDescription>Commonly used technical indicators for the stock.</CardDescription>
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
            {taDefinitions.map((def) => {
              if (isLoading) {
                return (
                  <TableRow key={`skeleton-ta-${def.key}`}>
                    <TableCell className="font-medium"><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                  </TableRow>
                );
              }

              const value = parsedTaData ? parsedTaData[def.key] : undefined;
              const displayValue = isError && !parsedTaData ? "N/A" : def.formatter(value);
              const sentiment = def.getSentiment ? def.getSentiment(value) : 'neutral';
              const colorClass = getSentimentColorClass(sentiment);

              return (
                <TableRow key={def.key}>
                  <TableCell className="font-medium">{def.label}</TableCell>
                  <TableCell className={cn("text-right", colorClass)}>{displayValue}</TableCell>
                </TableRow>
              );
            })}
             {isError && !isLoading && (!parsedTaData || Object.keys(parsedTaData).length === 0) && (
                <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                        Technical indicators data not available.
                    </TableCell>
                </TableRow>
            )}
            {!isLoading && !isError && parsedTaData && Object.keys(parsedTaData).length === 0 && (
                 <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                        No standard technical indicators to display.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
