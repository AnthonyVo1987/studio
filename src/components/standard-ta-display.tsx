"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { useStockAnalysis, BusinessFsmState } from "@/contexts/business-logic-context";
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
  const business = useStockAnalysis();

  // Parse standard TA data directly from business context
  const taData = business.standardTasJson ? (() => {
    try {
      const parsed = JSON.parse(business.standardTasJson);
      if (parsed.values) {
        return {
          indicators: parsed.values,
          isDataReady: business.fsmFlags.isStandardTADataReady
        };
      }
    } catch (e) {}
    return { indicators: {}, isDataReady: false };
  })() : { indicators: {}, isDataReady: false };

  // Derive loading state from FSM
  const isLoading = business.fsmState === BusinessFsmState.DATA_FETCH_IN_PROGRESS || !taData.isDataReady;
  
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
            ) : !taData.isDataReady ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  No technical analysis data available.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {renderMultiWindowValues("RSI", taData.indicators.RSI, ["7", "10", "14"], "14", rsiSentiment)}
                <TableRow>
                  <TableCell className="font-medium">MACD (12,26,9)</TableCell>
                  <TableCell className="text-right">
                    {taData.indicators.MACD ? (
                      <>
                        {formatToTwoDecimals(taData.indicators.MACD.value)} / {formatToTwoDecimals(taData.indicators.MACD.signal)} / <span className={getSentimentColorClass(macdSentiment(taData.indicators.MACD.histogram))}>{formatToTwoDecimals(taData.indicators.MACD.histogram)}</span>
                      </>
                    ) : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">VWAP</TableCell>
                  <TableCell className="text-right">
                    {taData.indicators.VWAP ? (
                      `Day: $${formatToTwoDecimals(taData.indicators.VWAP.day)} | Minute: $${formatToTwoDecimals(taData.indicators.VWAP.minute)}`
                    ) : "N/A"}
                  </TableCell>
                </TableRow>
                {renderMultiWindowValues("EMA", taData.indicators.EMA, ["5", "10", "20", "50", "200"])}
                {renderMultiWindowValues("SMA", taData.indicators.SMA, ["5", "10", "20", "50", "200"])}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}