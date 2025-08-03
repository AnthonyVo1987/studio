"use client";

/**
 * @fileOverview NVDA Staging Standard TA Display - Enterprise Experimental Component
 * 
 * Staging version of standard technical analysis display with orange/amber theming and staging context consumption.
 * Architecture Pattern: Direct staging context consumption with multi-window technical indicators display.
 * 
 * REPLICATION PATTERN from baseline component:
 * 1. Adapted from nvda-standard-ta-display.tsx for staging environment
 * 2. Updated imports: useNvdaAnalysis → useNvdaStagingAnalysis
 * 3. Updated component name: NvdaStandardTaDisplay → NvdaStagingStandardTaDisplay
 * 4. Updated loading text: "NVDA technical analysis data" → "NVDA staging technical analysis data"
 * 5. Added staging-specific orange/amber card styling and title suffix
 * 
 * STAGING ENHANCEMENTS:
 * - Orange/amber color scheme for staging differentiation
 * - "(Staging)" suffix in component title
 * - Staging context consumption via useNvdaStagingAnalysis()
 * - Identical technical indicators rendering with sentiment colors
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity } from "lucide-react";

// NVDA Staging Context
import { useNvdaStagingAnalysis } from "@/contexts/nvda-staging-analysis-context";
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

export function NvdaStagingStandardTaDisplay() {
  const stagingState = useNvdaStagingAnalysis();

  // Parse standard TA data directly from NVDA staging context
  const taData = stagingState.standardTasJson ? (() => {
    try {
      const parsed = JSON.parse(stagingState.standardTasJson);
      if (parsed && typeof parsed === 'object') {
        return {
          indicators: parsed,
          isDataReady: stagingState.dataRetrievalComplete
        };
      }
    } catch (e) {}
    return { indicators: {}, isDataReady: false };
  })() : { indicators: {}, isDataReady: false };

  // Derive loading state from FSM state and data availability
  const isLoading = stagingState.status === 'loading' || !stagingState.dataRetrievalComplete;
  
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
    <Card className="border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
        <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
          <Activity className="h-5 w-5" />
          NVDA Technical Analysis (Staging)
        </CardTitle>
        <CardDescription className="text-orange-700">
          Standard technical indicators and market signals for NVDA - Staging Environment
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
                  Waiting for NVDA staging technical analysis data...
                </TableCell>
              </TableRow>
            ) : !taData.isDataReady ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  No NVDA staging technical analysis data available.
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