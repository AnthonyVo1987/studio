
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

const renderMultiWindowValues = (
  label: string,
  data?: MultiWindowIndicatorValues | null,
  windows?: string[], 
  sentimentKey?: string, 
  getSentiment?: (value?: number | null) => 'bullish' | 'bearish' | 'neutral'
) => {
  if (!windows || windows.length === 0) return null;

  const valuesExist = data && windows.some(w => data[w] !== undefined && data[w] !== null);
  if (!valuesExist && !(data && (data as any).error)) return null; 

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
  let errorOrSkippedMessage: string | null = "Technical indicators data not available.";
  let parsedTaData: TechnicalIndicatorsData | null = null;

  if (standardTasJson && standardTasJson !== '{}') {
    if (standardTasJson.includes('"status": "initializing"') || standardTasJson.includes('"status": "pending"') || standardTasJson.includes('"status": "full_analysis_pending..."')) {
      isLoading = true;
      logDebug('StandardTaDisplay', "standardTasJson is in pending/initializing state.");
    } else if (standardTasJson.includes('"status": "error"') || standardTasJson.includes('"error":')) {
        isLoading = false;
        isError = true;
        errorOrSkippedMessage = "Error loading technical indicators.";
        logDebug('StandardTaDisplay', "standardTasJson indicates an error state.");
        try {
            const tempData = JSON.parse(standardTasJson);
            if (tempData.error) {
                 errorOrSkippedMessage = tempData.error;
                 logDebug('StandardTaDisplay', "Parsed error from JSON:", tempData.error);
            }
        } catch(e) { /* Ignore if not valid JSON */ }
    } else if (standardTasJson.includes('"status": "skipped"')) {
        isLoading = false;
        isError = true;
        errorOrSkippedMessage = "Technical indicators loading was skipped.";
        logDebug('StandardTaDisplay', "standardTasJson indicates a skipped state.");
    } else {
      try {
        const data = JSON.parse(standardTasJson) as TechnicalIndicatorsData;
        if (data && typeof data === 'object' && !data.error) { 
          isLoading = false;
          isError = false;
          parsedTaData = data;
          logDebug('StandardTaDisplay', "Successfully parsed standardTasJson. RSI data:", data?.RSI);
        } else if (data && data.error) {
          isLoading = false;
          isError = true;
          errorOrSkippedMessage = data.error;
          logDebug('StandardTaDisplay', "Parsed standardTasJson contains an error property:", data.error);
        } else {
          isLoading = false;
          isError = true;
          errorOrSkippedMessage = "TA data is malformed or incomplete.";
          logDebug('StandardTaDisplay', "Parsed standardTasJson is missing expected TA data or structure.");
        }
      } catch (e) {
        console.error("[StandardTaDisplay] Failed to parse standardTasJson:", e);
        logDebug('StandardTaDisplay', "Error during standardTasJson parsing.", e);
        isLoading = false;
        isError = true;
        errorOrSkippedMessage = "Failed to parse technical indicators data.";
      }
    }
  } else {
    isLoading = false;
    logDebug('StandardTaDisplay', "standardTasJson is empty or null.");
    // Do not set isError true here, just means no data yet
  }

  logDebug('StandardTaDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, errorOrSkippedMessage=${errorOrSkippedMessage}, parsedTaData exists=${!!parsedTaData}`);

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
                  {errorOrSkippedMessage}
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
                {renderMultiWindowValues("RSI", parsedTaData.RSI, ["7", "10", "14"], "14", rsiSentiment)}
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
                <TableRow>
                  <TableCell className="font-medium">VWAP</TableCell>
                  <TableCell className="text-right">
                    {parsedTaData.VWAP ? (
                      `Day: $${formatToTwoDecimals(parsedTaData.VWAP.day)} | Minute: $${formatToTwoDecimals(parsedTaData.VWAP.minute)}`
                    ) : "N/A"}
                  </TableCell>
                </TableRow>
                {renderMultiWindowValues("EMA", parsedTaData.EMA, ["5", "10", "20", "50", "200"])}
                {renderMultiWindowValues("SMA", parsedTaData.SMA, ["5", "10", "20", "50", "200"])}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

