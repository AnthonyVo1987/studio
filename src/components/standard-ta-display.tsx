
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { TechnicalIndicatorsData, MultiWindowIndicatorValues, MACDValue, VWAPValue } from "@/services/data-sources/types";
import { formatToTwoDecimals } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-positive';
  if (sentiment === 'bearish') return 'text-destructive';
  return '';
};

// Helper to render multiple values for an indicator
const renderMultiWindowValues = (
  label: string,
  data?: MultiWindowIndicatorValues | null,
  windows?: string[], // Specified windows to display in order
  sentimentKey?: string, // e.g., "14" for RSI sentiment
  getSentiment?: (value?: number | null) => 'bullish' | 'bearish' | 'neutral'
) => {
  if (!windows || windows.length === 0) return null;

  const valuesExist = data && windows.some(w => data[w] !== undefined && data[w] !== null);
  if (!valuesExist && !(data && (data as any).error)) return null; // Don't render if no values and no error

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
  const { standardTasJson, logDebug } = useStockAnalysis();
  logDebug('StandardTaDisplay', "standardTasJson (start):", standardTasJson.substring(0,100));

  let isLoading = false;
  let isError = false;
  let generalErrorMessage: string | null = null;
  let parsedTaData: TechnicalIndicatorsData | null = null;

  if (standardTasJson && standardTasJson !== '{}') {
    if (standardTasJson.includes('"status": "initializing"') || standardTasJson.includes('"status": "pending"') || standardTasJson.includes('"status": "full_analysis_pending..."')) {
      isLoading = true;
    } else if (standardTasJson.includes('"status": "error"') || standardTasJson.includes('"status": "skipped"') || standardTasJson.includes('"error":')) {
        // Check for top-level error string first
        try {
            const tempData = JSON.parse(standardTasJson);
            if (tempData.error) {
                 generalErrorMessage = tempData.error;
                 logDebug('StandardTaDisplay', "standardTasJson indicates a top-level error state:", generalErrorMessage);
            } else {
                 logDebug('StandardTaDisplay', "standardTasJson indicates a status error/skipped.");
            }
        } catch(e) {
            logDebug('StandardTaDisplay', "standardTasJson indicates an error/skipped status, and is not valid JSON itself.");
        }
        isLoading = false;
        isError = true;
    } else {
      try {
        const data = JSON.parse(standardTasJson) as TechnicalIndicatorsData;
        if (data && typeof data === 'object' && !data.error) { // Check for internal error property
          isLoading = false;
          isError = false;
          parsedTaData = data;
          logDebug('StandardTaDisplay', "Successfully parsed standardTasJson. RSI data:", data?.RSI);
        } else if (data && data.error) {
          isLoading = false;
          isError = true;
          generalErrorMessage = data.error;
          logDebug('StandardTaDisplay', "Parsed standardTasJson contains an error property:", data.error);
        } else {
          isLoading = false;
          isError = true;
          generalErrorMessage = "TA data is malformed or incomplete.";
          logDebug('StandardTaDisplay', "Parsed standardTasJson is missing expected TA data or structure.");
        }
      } catch (e) {
        console.error("[StandardTaDisplay] Failed to parse standardTasJson:", e);
        logDebug('StandardTaDisplay', "Error during standardTasJson parsing.", e);
        isLoading = false;
        isError = true;
        generalErrorMessage = "Failed to parse technical indicators data.";
      }
    }
  } else {
    isLoading = false;
    logDebug('StandardTaDisplay', "standardTasJson is empty or null.");
  }

  logDebug('StandardTaDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, parsedTaData exists=${!!parsedTaData}`);

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

  const renderSkeletonRow = (key: string) => (
    <TableRow key={`skeleton-ta-${key}`}>
      <TableCell className="font-medium"><Skeleton className="h-5 w-3/4" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-5 w-full" /></TableCell>
    </TableRow>
  );

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
              <>
                {renderSkeletonRow("rsi")}
                {renderSkeletonRow("macd")}
                {renderSkeletonRow("vwap")}
                {renderSkeletonRow("ema")}
                {renderSkeletonRow("sma")}
              </>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  {generalErrorMessage || "Technical indicators data not available."}
                </TableCell>
              </TableRow>
            ) : !parsedTaData || Object.keys(parsedTaData).length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  No standard technical indicators to display.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* RSI */}
                {renderMultiWindowValues("RSI", parsedTaData.RSI, ["7", "10", "14"], "14", rsiSentiment)}

                {/* MACD */}
                <TableRow>
                  <TableCell className="font-medium">MACD (12,26,9)</TableCell>
                  <TableCell className="text-right">
                    {parsedTaData.MACD ? (
                      <>
                        {formatToTwoDecimals(parsedTaData.MACD.value)} / {formatToTwoDecimals(parsedTaData.MACD.signal)} / <span className={getSentimentColorClass(macdSentiment(parsedTaData.MACD.histogram))}>{formatToTwoDecimals(parsedTaData.MACD.histogram)}</span>
                      </>
                    ) : "N/A"}
                  </TableCell>
                </TableRow>

                {/* VWAP */}
                <TableRow>
                  <TableCell className="font-medium">VWAP</TableCell>
                  <TableCell className="text-right">
                    {parsedTaData.VWAP ? (
                      `Day: $${formatToTwoDecimals(parsedTaData.VWAP.day)} | Minute: $${formatToTwoDecimals(parsedTaData.VWAP.minute)}`
                    ) : "N/A"}
                  </TableCell>
                </TableRow>

                {/* EMA */}
                {renderMultiWindowValues("EMA", parsedTaData.EMA, ["5", "10", "20", "50", "200"])}
                
                {/* SMA */}
                {renderMultiWindowValues("SMA", parsedTaData.SMA, ["5", "10", "20", "50", "200"])}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
