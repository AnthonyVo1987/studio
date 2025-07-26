"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { useUIState } from "@/contexts/ui-state-context";
import { formatToTwoDecimals } from "@/lib/number-utils";
import { cn } from "@/lib/utils";

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-positive';
  if (sentiment === 'bearish') return 'text-destructive';
  return '';
};

const renderMultiWindowValues = (
  label: string,
  data?: Record<string, number> | null,
  windows?: string[], 
  sentimentKey?: string, 
  getSentiment?: (value?: number | null) => 'bullish' | 'bearish' | 'neutral'
) => {
  if (!windows || windows.length === 0) return null;

  const valuesExist = data && windows.some(w => data[w] !== undefined && data[w] !== null);
  if (!valuesExist) return null; 

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

export function StandardTaDisplay() {
  const { currentSnapshot } = useUIState();
  const loadingStates = currentSnapshot.loadingStates;

  // Derive values directly from UI snapshot
  const technicalAnalysis = currentSnapshot.technicalAnalysis;
  const isLoading = loadingStates.isCalculatingTA || !technicalAnalysis.isDataReady;
  
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-sm text-muted-foreground h-24">
                  Waiting for technical analysis data...
                </TableCell>
              </TableRow>
            ) : !technicalAnalysis.isDataReady ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  No technical analysis data available.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {renderMultiWindowValues("RSI", technicalAnalysis.indicators.RSI, ["7", "10", "14"], "14", rsiSentiment)}
                <TableRow>
                  <TableCell className="font-medium">MACD (12,26,9)</TableCell>
                  <TableCell className="text-right">
                    {technicalAnalysis.indicators.MACD ? (
                      <>
                        {formatToTwoDecimals(technicalAnalysis.indicators.MACD.value)} / {formatToTwoDecimals(technicalAnalysis.indicators.MACD.signal)} / <span className={getSentimentColorClass(macdSentiment(technicalAnalysis.indicators.MACD.histogram))}>{formatToTwoDecimals(technicalAnalysis.indicators.MACD.histogram)}</span>
                      </>
                    ) : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">VWAP</TableCell>
                  <TableCell className="text-right">
                    {technicalAnalysis.indicators.VWAP ? (
                      `Day: $${formatToTwoDecimals(technicalAnalysis.indicators.VWAP.day)} | Minute: $${formatToTwoDecimals(technicalAnalysis.indicators.VWAP.minute)}`
                    ) : "N/A"}
                  </TableCell>
                </TableRow>
                {renderMultiWindowValues("EMA", technicalAnalysis.indicators.EMA, ["5", "10", "20", "50", "200"])}
                {renderMultiWindowValues("SMA", technicalAnalysis.indicators.SMA, ["5", "10", "20", "50", "200"])}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}