
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { TechnicalIndicatorsData, TechnicalIndicatorValue } from "@/services/data-sources/types";
import { formatToTwoDecimals } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TaIndicatorDisplayInfo {
  key: keyof TechnicalIndicatorsData;
  label: string;
  formatter: (value?: TechnicalIndicatorValue) => string;
}

const taDefinitions: TaIndicatorDisplayInfo[] = [
  { 
    key: "RSI", 
    label: "RSI (14)", 
    formatter: (val) => formatToTwoDecimals(val?.value) 
  },
  { 
    key: "EMA", 
    label: "EMA (20)", 
    formatter: (val) => `$${formatToTwoDecimals(val?.value)}` // Assuming price based
  },
  { 
    key: "SMA", 
    label: "SMA (50)", 
    formatter: (val) => `$${formatToTwoDecimals(val?.value)}` // Assuming price based
  },
  { 
    key: "MACD", 
    label: "MACD (12,26,9)", 
    formatter: (val) => 
      val?.value !== undefined 
      ? `${formatToTwoDecimals(val.value)} / ${formatToTwoDecimals(val.signal)} / ${formatToTwoDecimals(val.histogram)}`
      : "N/A"
  },
  { 
    key: "VWAP", 
    label: "VWAP (Day)", 
    formatter: (val) => `$${formatToTwoDecimals(val?.value)}`
  },
];

export function StandardTaDisplay() {
  const { standardTasJson, aiCalculatedTaJson } = useStockAnalysis(); // aiCalculatedTaJson as proxy for loading chain

  let isLoading = true;
  let isError = false;
  let parsedTaData: Partial<TechnicalIndicatorsData> | null = null;

  if (
    standardTasJson.includes('"status": "initializing"') ||
    standardTasJson.includes('"status": "pending"') ||
    aiCalculatedTaJson.includes('"status": "pending"') || 
    aiCalculatedTaJson.includes('"status": "initializing"')
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

              return (
                <TableRow key={def.key}>
                  <TableCell className="font-medium">{def.label}</TableCell>
                  <TableCell className="text-right">{displayValue}</TableCell>
                </TableRow>
              );
            })}
             {isError && !isLoading && (
                <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Technical indicators data not available.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
