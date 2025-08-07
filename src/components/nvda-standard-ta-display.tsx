"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity } from "lucide-react";

// NVDA Context
import { useNvdaAnalysis } from "@/contexts/nvda-analysis-context";
import { formatToTwoDecimals } from "@/lib/number-utils";

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

export function NvdaStandardTaDisplay() {
  const nvdaState = useNvdaAnalysis();

  // Parse standard TA data directly from NVDA context
  const taData = nvdaState.standardTasJson ? (() => {
    try {
      const parsed = JSON.parse(nvdaState.standardTasJson);
      if (parsed && typeof parsed === 'object') {
        return {
          indicators: parsed,
          isDataReady: nvdaState.dataRetrievalComplete
        };
      }
    } catch (e) {
      // Error parsing TA data - will return empty object below
    }
    return { indicators: {}, isDataReady: false };
  })() : { indicators: {}, isDataReady: false };

  // Derive loading state from FSM state and data availability
  const isLoading = nvdaState.status === 'loading' || !nvdaState.dataRetrievalComplete;
  
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
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          NVDA Technical Analysis
        </CardTitle>
        <CardDescription>
          Standard technical indicators and market signals for NVDA
        </CardDescription>
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
                  Waiting for NVDA technical analysis data...
                </TableCell>
              </TableRow>
            ) : !taData.isDataReady ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  No NVDA technical analysis data available.
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