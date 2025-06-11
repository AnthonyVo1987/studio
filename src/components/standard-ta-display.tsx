
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
  formatter: (value?: TechnicalIndicatorValue) => string;
  getSentiment?: (value?: TechnicalIndicatorValue) => 'bullish' | 'bearish' | 'neutral';
}

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-green-600 dark:text-green-400';
  if (sentiment === 'bearish') return 'text-red-600 dark:text-red-400';
  return ''; // Default theme color
};

const taDefinitions: TaIndicatorDisplayInfo[] = [
  { 
    key: "RSI", 
    label: "RSI (14)", 
    formatter: (val) => formatToTwoDecimals(val?.value),
    getSentiment: (val) => {
      if (val?.value === undefined || val.value === null) return 'neutral';
      if (val.value < 30) return 'bullish'; // Oversold
      if (val.value > 70) return 'bearish'; // Overbought
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
      if (val.histogram > 0) return 'bullish'; // MACD line above signal line
      if (val.histogram < 0) return 'bearish'; // MACD line below signal line
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
  const { standardTasJson } = useStockAnalysis(); 

  let isLoading = false;
  let isError = false;
  let parsedTaData: Partial<TechnicalIndicatorsData> | null = null;

  if (
    standardTasJson.includes('"status": "initializing"') ||
    standardTasJson.includes('"status": "pending"')
  ) {
    isLoading = true;
  } else if (standardTasJson.includes('"error":') || standardTasJson.includes('"status": "skipped"')) {
    isError = true;
    isLoading = false;
  } else {
    try {
      const data = JSON.parse(standardTasJson) as TechnicalIndicatorsData;
      if (data && typeof data === 'object' && !data.error) {
        isLoading = false;
        parsedTaData = data;
      } else {
        isError = true;
        isLoading = false;
        if (data && data.error) console.error("Standard TA data contains error:", data.error);
      }
    } catch (e) {
      console.error("Failed to parse standardTasJson in StandardTaDisplay:", e);
      isError = true;
      isLoading = false;
    }
  }

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
              const displayValue = isError ? "N/A" : def.formatter(value);
              const sentiment = def.getSentiment ? def.getSentiment(value) : 'neutral';
              const colorClass = getSentimentColorClass(sentiment);

              return (
                <TableRow key={def.key}>
                  <TableCell className="font-medium">{def.label}</TableCell>
                  <TableCell className={cn("text-right", colorClass)}>{displayValue}</TableCell>
                </TableRow>
              );
            })}
             {isError && !isLoading && (
                <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                        Technical indicators data not available.
                    </TableCell>
                </TableRow>
            )}
            {!isLoading && !isError && Object.keys(parsedTaData || {}).length === 0 && (
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
