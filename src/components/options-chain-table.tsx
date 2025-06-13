
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { OptionsChainData, OptionsTableRow, StreamlinedOptionContract, StockSnapshotData } from "@/services/data-sources/types";
import { formatCurrency, formatPercentage, formatCompactNumber, formatToTwoDecimals, roundNumber } from "@/lib/number-utils";
import { formatDisplayDate } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { downloadTxt, copyToClipboard } from "@/lib/export-utils";

interface OptionHeaderConfig {
  key: keyof StreamlinedOptionContract;
  label: string;
  formatter: (value: any) => string;
}

const callHeadersConfig: OptionHeaderConfig[] = [
  { key: "gamma", label: "Gamma", formatter: (v) => formatToTwoDecimals(v, "-") },
  { key: "iv", label: "IV", formatter: (v) => formatPercentage(v, "-", false) }, 
  { key: "percent_change", label: "% Chg", formatter: (v) => formatPercentage(v, "-", true) }, 
  { key: "bid", label: "Bid", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "ask", label: "Ask", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "last_price", label: "Last", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "volume", label: "Volume", formatter: (v) => formatCompactNumber(v, "-") },
  { key: "open_interest", label: "Open Int", formatter: (v) => formatCompactNumber(v, "-") },
  { key: "delta", label: "Delta", formatter: (v) => formatToTwoDecimals(v, "-") },
];

const putHeadersConfig: OptionHeaderConfig[] = [
  { key: "delta", label: "Delta", formatter: (v) => formatToTwoDecimals(v, "-") },
  { key: "open_interest", label: "Open Int", formatter: (v) => formatCompactNumber(v, "-") },
  { key: "volume", label: "Volume", formatter: (v) => formatCompactNumber(v, "-") },
  { key: "last_price", label: "Last", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "bid", label: "Bid", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "ask", label: "Ask", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "percent_change", label: "% Chg", formatter: (v) => formatPercentage(v, "-", true) },
  { key: "iv", label: "IV", formatter: (v) => formatPercentage(v, "-", false) },
  { key: "gamma", label: "Gamma", formatter: (v) => formatToTwoDecimals(v, "-") },
];

const csvCallKeys: (keyof StreamlinedOptionContract)[] = ["gamma", "iv", "percent_change", "bid", "ask", "last_price", "volume", "open_interest", "delta"];
const csvPutKeys: (keyof StreamlinedOptionContract)[] = ["delta", "open_interest", "volume", "last_price", "bid", "ask", "percent_change", "iv", "gamma"];


const renderSkeletonRow = (rowIndex: number) => (
  <TableRow key={`skeleton-options-${rowIndex}`} className={rowIndex % 2 !== 0 ? "bg-muted/20 dark:bg-muted/10" : ""}>
    {callHeadersConfig.map((header) => (
      <TableCell key={`call-skel-${header.key}-${rowIndex}`} className="p-1.5 whitespace-nowrap text-center">
        <Skeleton className="h-4 w-10 mx-auto" />
      </TableCell>
    ))}
    <TableCell className="p-1.5 whitespace-nowrap text-center font-semibold sticky left-1/2 -translate-x-1/2 bg-card z-10 border-l border-r">
      <Skeleton className="h-4 w-12 mx-auto" />
    </TableCell>
    {putHeadersConfig.map((header) => (
      <TableCell key={`put-skel-${header.key}-${rowIndex}`} className="p-1.5 whitespace-nowrap text-center">
        <Skeleton className="h-4 w-10 mx-auto" />
      </TableCell>
    ))}
  </TableRow>
);

const generateOptionsCsv = (optionsData: OptionsChainData, logDebug: Function): string => {
  logDebug('OptionsChainTable:generateOptionsCsv', 'Starting CSV generation for ticker:', optionsData.ticker);
  const headers: string[] = [
    ...csvCallKeys.map(k => `Call ${k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`),
    "Strike",
    ...csvPutKeys.map(k => `Put ${k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`),
  ];

  const rows: string[] = (optionsData.contracts || []).map(contractRow => {
    const callValues = csvCallKeys.map(key => {
      let val = contractRow.call?.[key];
      if (key === 'percent_change' && typeof val === 'number') { 
        val = roundNumber(val / 100, 4);
      }
      return val !== undefined && val !== null ? String(val) : "";
    });
    const putValues = csvPutKeys.map(key => {
      let val = contractRow.put?.[key];
      if (key === 'percent_change' && typeof val === 'number') {
         val = roundNumber(val / 100, 4);
      }
      return val !== undefined && val !== null ? String(val) : "";
    });
    return [...callValues, String(contractRow.strike ?? ""), ...putValues].join(',');
  });
  
  const csvString = [headers.join(','), ...rows].join('\n');
  logDebug('OptionsChainTable:generateOptionsCsv', `CSV generation complete. Header: ${headers.join(',')}. First data row preview: ${rows[0]?.substring(0,100)}`);
  return csvString;
};

const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }'
];

export function OptionsChainTable() {
  const { optionsChainJson, stockSnapshotJson, logDebug } = useStockAnalysis();
  const { toast } = useToast();
  const componentName = 'OptionsChainTable';

  logDebug(componentName, "optionsChainJson (start):", optionsChainJson ? optionsChainJson.substring(0,100) : "null");
  logDebug(componentName, "stockSnapshotJson (start):", stockSnapshotJson ? stockSnapshotJson.substring(0,100) : "null");

  let isLoading = false;
  let isError = false;
  let errorOrSkippedMessage = "Options data failed to load.";
  let parsedData: OptionsChainData | null = null;
  let currentPriceForATM: number | null = null;

  if (!optionsChainJson || optionsChainJson === '{}') {
    isLoading = false;
    isError = true;
    errorOrSkippedMessage = "No options chain data available.";
    logDebug(componentName, "optionsChainJson is empty or null.");
  } else if (PENDING_STATUS_JSON_VARIANTS.includes(optionsChainJson.trim())) {
    isLoading = true;
    isError = false;
    parsedData = null;
    errorOrSkippedMessage = ""; 
    logDebug(componentName, "optionsChainJson is in a defined pending/initializing state.");
  } else if (optionsChainJson.includes('"status": "error"') || optionsChainJson.includes('"error":')) {
    isLoading = false;
    isError = true;
    errorOrSkippedMessage = "Error loading options data.";
     try {
        const statusObj = JSON.parse(optionsChainJson);
        errorOrSkippedMessage = statusObj.message || statusObj.error || "Error loading options data.";
     } catch(e) { /* no-op */ }
    logDebug(componentName, "optionsChainJson indicates an error state.", errorOrSkippedMessage);
  } else if (optionsChainJson.includes('"status": "skipped"')) {
    isLoading = false;
    isError = true;
    try {
        const statusObj = JSON.parse(optionsChainJson);
        errorOrSkippedMessage = statusObj.message || "Options data loading was skipped.";
    } catch(e) {
        errorOrSkippedMessage = "Options data loading was skipped.";
    }
    logDebug(componentName, "optionsChainJson indicates a skipped state.", errorOrSkippedMessage);
  } else {
    try {
      const data = JSON.parse(optionsChainJson) as OptionsChainData;
      logDebug(componentName, "Attempting to parse optionsChainJson. Contracts count:", data?.contracts?.length);
      if (data && typeof data === 'object' && !(data as any).error && Array.isArray(data.contracts)) {
        isLoading = false;
        isError = false;
        parsedData = data;
        logDebug(componentName, "Successfully parsed optionsChainJson.");
      } else {
        logDebug(componentName, "Parsed optionsChainJson is missing contracts array or contains error/status field. Data:", data);
        isLoading = false;
        isError = true;
        errorOrSkippedMessage = "Options data is malformed or incomplete.";
      }
    } catch (e) {
      console.error(`[${componentName}] Failed to parse optionsChainJson:`, e);
      logDebug(componentName, "Error during optionsChainJson parsing.", e);
      isLoading = false;
      isError = true;
      errorOrSkippedMessage = "Failed to parse options data.";
    }
  }

  if (stockSnapshotJson && stockSnapshotJson !== '{}') {
    try {
      if (!PENDING_STATUS_JSON_VARIANTS.includes(stockSnapshotJson.trim()) && !stockSnapshotJson.includes('"status":') && !stockSnapshotJson.includes('"error":')) {
        const parsedSnapshotData = JSON.parse(stockSnapshotJson) as StockSnapshotData;
        currentPriceForATM = parsedSnapshotData?.currentPrice ?? parsedSnapshotData?.day?.c ?? null;
        logDebug(componentName, "Successfully parsed stockSnapshotJson for ATM price:", currentPriceForATM);
      } else {
         logDebug(componentName, "stockSnapshotJson contains status/error or is pending, cannot get current price for ATM.");
      }
    } catch (e) {
      console.error(`[${componentName}] Failed to parse stockSnapshotJson for ATM price:`, e);
      logDebug(componentName, "Error during stockSnapshotJson parsing for ATM.", e);
    }
  } else {
     logDebug(componentName, "stockSnapshotJson is empty or null, cannot determine ATM strike accurately for display.");
  }

  const displayTicker = parsedData?.ticker || (isLoading ? "" : "N/A");
  const displayExpirationDate = parsedData?.expiration_date ? formatDisplayDate(parsedData.expiration_date) : (isLoading ? "" : "N/A");
  const contracts = parsedData?.contracts || [];

  let atmStrikeValue: number | null = null;
  if (currentPriceForATM !== null && contracts.length > 0) {
    atmStrikeValue = contracts.reduce((prev, curr) => {
      return (Math.abs((curr.strike || 0) - (currentPriceForATM!)) < Math.abs((prev.strike || 0) - (currentPriceForATM!))) ? curr : prev;
    }).strike;
    logDebug(componentName, 'Determined ATM strike based on currentPriceForATM:', atmStrikeValue);
  } else if (contracts.length > 0 && !currentPriceForATM && parsedData?.underlying_price) {
    currentPriceForATM = parsedData.underlying_price;
    if(currentPriceForATM){
        atmStrikeValue = contracts.reduce((prev, curr) => {
            return (Math.abs((curr.strike || 0) - (currentPriceForATM!)) < Math.abs((prev.strike || 0) - (currentPriceForATM!))) ? curr : prev;
        }).strike;
        logDebug(componentName, 'Determined ATM strike based on parsedData.underlying_price:', atmStrikeValue);
    }
  }

  const isDataReadyForExport = !isLoading && !isError && parsedData && (parsedData.contracts?.length || 0) > 0;

  const handleExportOptionsCsv = () => {
    logDebug(componentName, 'Export Options CSV button clicked. Data ready:', isDataReadyForExport);
    if (!isDataReadyForExport || !parsedData) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'Options chain data is not available for export.' });
      return;
    }
    try {
      const csvString = generateOptionsCsv(parsedData, logDebug);
      const filenameTicker = parsedData.ticker || "STOCK";
      const filenameExpDate = parsedData.expiration_date ? parsedData.expiration_date.replace(/-/g,'') : "EXP";
      const filename = `${filenameTicker}_options_${filenameExpDate}.csv`;
      downloadTxt(csvString, filename);
      toast({ title: 'Options Exported', description: `Options chain for ${filenameTicker} downloaded as ${filename}.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export Error', description: `Failed to generate or download CSV: ${e.message}` });
      logDebug(componentName, 'Export error:', e);
    }
  };

  const handleCopyOptionsCsv = async () => {
    logDebug(componentName, 'Copy Options CSV button clicked. Data ready:', isDataReadyForExport);
    if (!isDataReadyForExport || !parsedData) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'Options chain data is not available for copy.' });
      return;
    }
    try {
      const csvString = generateOptionsCsv(parsedData, logDebug);
      const success = await copyToClipboard(csvString);
      if (success) {
        toast({ title: 'Options Copied', description: 'Options chain CSV data copied to clipboard.' });
      } else {
        toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy options chain CSV data.' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Copy Error', description: `Failed to generate or copy CSV: ${e.message}` });
      logDebug(componentName, 'Copy error:', e);
    }
  };

  logDebug(componentName, `Render state: isLoading=${isLoading}, isError=${isError}, errorOrSkippedMessage=${errorOrSkippedMessage}, contracts.length=${contracts.length}, atmStrike=${atmStrikeValue}, isDataReadyForExport=${isDataReadyForExport}`);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Options Chain</CardTitle>
                {isLoading ? (
                    <Skeleton className="h-5 w-3/4 mt-1" />
                ) : (
                    <CardDescription className="mt-1">
                    Options chain for {displayTicker} - Expires: {displayExpirationDate}
                    </CardDescription>
                )}
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportOptionsCsv} disabled={!isDataReadyForExport} title="Export Options Chain as CSV">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyOptionsCsv} disabled={!isDataReadyForExport} title="Copy Options Chain as CSV">
                    <Copy className="mr-2 h-4 w-4" /> Copy CSV
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-2 md:p-3">
        <Table className="min-w-max text-xs">
          <TableHeader>
            <TableRow>
              <TableHead colSpan={callHeadersConfig.length} className="text-center font-semibold text-base p-1.5 whitespace-nowrap border-b-2">CALLS</TableHead>
              <TableHead className="text-center font-semibold text-base p-1.5 whitespace-nowrap sticky left-1/2 -translate-x-1/2 bg-card z-10 border-l border-r border-b-2">STRIKE</TableHead>
              <TableHead colSpan={putHeadersConfig.length} className="text-center font-semibold text-base p-1.5 whitespace-nowrap border-b-2">PUTS</TableHead>
            </TableRow>
            <TableRow>
              {callHeadersConfig.map((header) => (
                <TableHead key={`call-header-${header.key}`} className="p-1.5 whitespace-nowrap text-center text-muted-foreground">
                  {header.label}
                </TableHead>
              ))}
              <TableHead className="p-1.5 whitespace-nowrap text-center sticky left-1/2 -translate-x-1/2 bg-card z-10 border-l border-r text-muted-foreground">Price</TableHead>
              {putHeadersConfig.map((header) => (
                <TableHead key={`put-header-${header.key}`} className="p-1.5 whitespace-nowrap text-center text-muted-foreground">
                  {header.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 15 }).map((_, index) => renderSkeletonRow(index))
              : isError
                ? <TableRow><TableCell colSpan={callHeadersConfig.length + 1 + putHeadersConfig.length} className="text-center h-24 text-muted-foreground">
                    {errorOrSkippedMessage}
                  </TableCell></TableRow>
                : !parsedData || contracts.length === 0
                    ? <TableRow><TableCell colSpan={callHeadersConfig.length + 1 + putHeadersConfig.length} className="text-center h-24 text-muted-foreground">
                        No option contracts found for this expiration and strike range.
                      </TableCell></TableRow>
                    : contracts.map((row: OptionsTableRow, index: number) => {
                        const isATMRow = row.strike !== null && row.strike !== undefined && atmStrikeValue !== null && row.strike === atmStrikeValue;
                        const rowClasses = cn(
                            "transition-colors",
                            isATMRow ? "bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 font-semibold" :
                                       (index % 2 !== 0 ? "bg-muted/25 dark:bg-muted/10 hover:bg-muted/40 dark:hover:bg-muted/20" : "hover:bg-muted/40 dark:hover:bg-muted/20")
                        );
                        return (
                            <TableRow key={`options-row-${row.strike}-${index}`} className={rowClasses}>
                                {callHeadersConfig.map((header) => (
                                <TableCell key={`call-cell-${header.key}-${index}`} className="p-1.5 whitespace-nowrap text-center">
                                    {header.formatter(row.call?.[header.key])}
                                </TableCell>
                                ))}
                                <TableCell className={cn(
                                    "p-1.5 whitespace-nowrap text-center font-semibold sticky left-1/2 -translate-x-1/2 z-10 border-l border-r",
                                    isATMRow ? "bg-primary/20 dark:bg-primary/30 text-primary-foreground" : (index % 2 !== 0 ? "bg-muted/30 dark:bg-muted/15" : "bg-card")
                                )}>
                                {formatCurrency(row.strike, "$", "-", true)}
                                </TableCell>
                                {putHeadersConfig.map((header) => (
                                <TableCell key={`put-cell-${header.key}-${index}`} className="p-1.5 whitespace-nowrap text-center">
                                    {header.formatter(row.put?.[header.key])}
                                </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
