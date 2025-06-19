
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { downloadJson, downloadTxt, copyToClipboard } from "@/lib/export-utils"; 

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

const generateOptionsCsv = (optionsData: OptionsChainData, logDebugFn: Function, compName: string): string => {
  logDebugFn(compName, 'GenerateCSV', 'Starting CSV generation for ticker:', optionsData.ticker);
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
  return csvString;
};

const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }',
  '{ "status": "no_analysis_run_yet" }'
];

export function OptionsChainTable() {
  const { optionsChainJson, stockSnapshotJson, logDebug } = useStockAnalysis();
  const { toast } = useToast();
  const componentName = 'OptionsChainTable';
  const prevOptionsJsonRef = useRef<string | null>(null);
  const prevSnapshotJsonRef = useRef<string | null>(null);

  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isErrorState, setIsErrorState] = useState(false);
  const [errorOrSkippedMessageState, setErrorOrSkippedMessageState] = useState("Options data failed to load.");
  const [parsedDataState, setParsedDataState] = useState<OptionsChainData | null>(null);
  const [currentPriceForATMState, setCurrentPriceForATMState] = useState<number | null>(null);
  const [atmStrikeValueState, setAtmStrikeValueState] = useState<number | null>(null);

  useEffect(() => {
    const currentOptionsJson = optionsChainJson;
    const currentSnapshotJson = stockSnapshotJson;
    let optionsChanged = false;
    let snapshotChanged = false;

    if (currentOptionsJson !== prevOptionsJsonRef.current) {
      logDebug(componentName, "PropsReceived:Options", "optionsChainJson prop changed. New Length:", currentOptionsJson?.length);
      prevOptionsJsonRef.current = currentOptionsJson;
      optionsChanged = true;
    }
    if (currentSnapshotJson !== prevSnapshotJsonRef.current) {
      logDebug(componentName, "PropsReceived:Snapshot", "stockSnapshotJson prop changed. New Length:", currentSnapshotJson?.length);
      prevSnapshotJsonRef.current = currentSnapshotJson;
      snapshotChanged = true;
    }

    if (!optionsChanged && !snapshotChanged) {
      return; 
    }

    let newIsLoading = isLoadingState;
    let newIsError = isErrorState;
    let newErrorMsg = errorOrSkippedMessageState;
    let newParsedData = parsedDataState;
    let newCurrentPriceForATM = currentPriceForATMState;

    if (optionsChanged) { // Process options chain data
        newIsLoading = true; // Assume loading until parsed
        newIsError = false;
        newErrorMsg = "Options data failed to load.";
        newParsedData = null;

        if (!currentOptionsJson || currentOptionsJson === '{}') {
            newIsLoading = false;
            newErrorMsg = "No options chain data. This data is fetched with 'Analyze Stock'.";
            logDebug(componentName, "OptionsStateUpdate:NoData", newErrorMsg);
        } else if (PENDING_STATUS_JSON_VARIANTS.includes(currentOptionsJson.trim())) {
            newIsLoading = true;
            newErrorMsg = "Loading options chain...";
            logDebug(componentName, "OptionsStateUpdate:Loading", newErrorMsg);
        } else if (currentOptionsJson.includes('"status": "error"') || currentOptionsJson.includes('"error":')) {
            newIsLoading = false;
            newIsError = true;
            try {
                const statusObj = JSON.parse(currentOptionsJson);
                newErrorMsg = statusObj.message || statusObj.error || "Error loading options data.";
            } catch(e) { newErrorMsg = "Error loading options data (malformed error JSON)."; }
            logDebug(componentName, "OptionsStateUpdate:Error", newErrorMsg);
        } else if (currentOptionsJson.includes('"status": "skipped"')) {
            newIsLoading = false;
            newIsError = true;
            try {
                const statusObj = JSON.parse(currentOptionsJson);
                newErrorMsg = statusObj.message || "Options data loading was skipped.";
            } catch(e) { newErrorMsg = "Options data loading was skipped (malformed skipped JSON)."; }
            logDebug(componentName, "OptionsStateUpdate:Skipped", newErrorMsg);
        } else {
            try {
            const data = JSON.parse(currentOptionsJson) as OptionsChainData;
            if (data && typeof data === 'object' && !(data as any).error && Array.isArray(data.contracts)) {
                newIsLoading = false;
                newIsError = false;
                newParsedData = data;
                newErrorMsg = ""; 
                logDebug(componentName, "OptionsDataParsed", "Successfully parsed optionsChainJson. Contracts:", newParsedData.contracts?.length);
            } else {
                newIsLoading = false;
                newIsError = true;
                newErrorMsg = "Options data is malformed or incomplete.";
                logDebug(componentName, "OptionsStateUpdate:Malformed", newErrorMsg);
            }
            } catch (e) {
            console.error(`[${componentName}] Failed to parse optionsChainJson:`, e, "JSON:", currentOptionsJson.substring(0,200));
            newIsLoading = false;
            newIsError = true;
            newErrorMsg = "Failed to parse options data.";
            logDebug(componentName, "OptionsStateUpdate:ParseFailed", newErrorMsg);
            }
        }
        setParsedDataState(newParsedData);
    }

    if (snapshotChanged && currentSnapshotJson && currentSnapshotJson !== '{}') {
        try {
          if (!PENDING_STATUS_JSON_VARIANTS.includes(currentSnapshotJson.trim()) && !currentSnapshotJson.includes('"status":') && !currentSnapshotJson.includes('"error":')) {
            const parsedSnapshotData = JSON.parse(currentSnapshotJson) as StockSnapshotData;
            newCurrentPriceForATM = parsedSnapshotData?.currentPrice ?? parsedSnapshotData?.day?.c ?? null;
            logDebug(componentName, "SnapshotPriceUpdate", "Current price for ATM calculation:", newCurrentPriceForATM);
          } else {
            newCurrentPriceForATM = null; 
          }
        } catch (e) {
          console.error(`[${componentName}] Failed to parse stockSnapshotJson for ATM price:`, e);
          newCurrentPriceForATM = null;
        }
        setCurrentPriceForATMState(newCurrentPriceForATM);
    }
    
    // Calculate ATM Strike only after both parsedData and currentPriceForATM might have updated
    const finalContracts = newParsedData?.contracts || [];
    let newAtmStrikeValue: number | null = null;
    if (newCurrentPriceForATM !== null && finalContracts.length > 0) {
        newAtmStrikeValue = finalContracts.reduce((prev, curr) => {
        return (Math.abs((curr.strike || 0) - (newCurrentPriceForATM!)) < Math.abs((prev.strike || 0) - (newCurrentPriceForATM!))) ? curr : prev;
        }).strike;
    } else if (finalContracts.length > 0 && !newCurrentPriceForATM && newParsedData?.underlying_price) {
        const underlying = newParsedData.underlying_price;
        if(underlying){
            newAtmStrikeValue = finalContracts.reduce((prev, curr) => {
                return (Math.abs((curr.strike || 0) - (underlying!)) < Math.abs((prev.strike || 0) - (underlying!))) ? curr : prev;
            }).strike;
        }
    }
    setAtmStrikeValueState(newAtmStrikeValue);

    setIsLoadingState(newIsLoading);
    setIsErrorState(newIsError);
    setErrorOrSkippedMessageState(newErrorMsg);

  }, [optionsChainJson, stockSnapshotJson, logDebug, isLoadingState, isErrorState, errorOrSkippedMessageState, parsedDataState, currentPriceForATMState]);

  const displayTicker = parsedDataState?.ticker || (isLoadingState ? "" : "N/A");
  const displayExpirationDate = parsedDataState?.expiration_date ? formatDisplayDate(parsedDataState.expiration_date) : (isLoadingState ? "" : "N/A");
  const contractsToDisplay = parsedDataState?.contracts || [];
  
  const isDataReadyForExport = !isLoadingState && !isErrorState && parsedDataState && (parsedDataState.contracts?.length || 0) > 0;

  const handleExportOptionsCsv = () => {
    logDebug(componentName, 'ExportAction', 'Export Options CSV button clicked. Data ready:', isDataReadyForExport);
    if (!isDataReadyForExport || !parsedDataState) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'Options chain data is not available for export.' });
      return;
    }
    try {
      const csvString = generateOptionsCsv(parsedDataState, logDebug, componentName);
      const filenameTicker = parsedDataState.ticker || "STOCK";
      const filenameExpDate = parsedDataState.expiration_date ? parsedDataState.expiration_date.replace(/-/g,'') : "EXP";
      const filename = `${filenameTicker}_options_${filenameExpDate}.csv`;
      downloadTxt(csvString, filename);
      toast({ title: 'Options Exported', description: `Options chain for ${filenameTicker} downloaded as ${filename}.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export Error', description: `Failed to generate or download CSV: ${e.message}` });
    }
  };

  const handleCopyOptionsCsv = async () => {
    logDebug(componentName, 'CopyAction', 'Copy Options CSV button clicked. Data ready:', isDataReadyForExport);
    if (!isDataReadyForExport || !parsedDataState) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'Options chain data is not available for copy.' });
      return;
    }
    try {
      const csvString = generateOptionsCsv(parsedDataState, logDebug, componentName);
      const success = await copyToClipboard(csvString);
      if (success) {
        toast({ title: 'Options Copied', description: 'Options chain CSV data copied to clipboard.' });
      } else {
        toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy options chain CSV data.' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Copy Error', description: `Failed to generate or copy CSV: ${e.message}` });
    }
  };

  const handleExportOptionsJson = () => {
    logDebug(componentName, 'ExportAction', 'Export Options JSON button clicked. Data ready:', isDataReadyForExport);
    if (!isDataReadyForExport || !parsedDataState) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'Options chain data is not available for JSON export.' });
      return;
    }
    try {
      const filenameTicker = parsedDataState.ticker || "STOCK";
      const filenameExpDate = parsedDataState.expiration_date ? parsedDataState.expiration_date.replace(/-/g,'') : "EXP";
      const filename = `${filenameTicker}_options_chain_${filenameExpDate}.json`;
      downloadJson(parsedDataState, filename);
      toast({ title: 'Options Exported (JSON)', description: `Options chain for ${filenameTicker} downloaded as ${filename}.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export Error', description: `Failed to download JSON: ${e.message}` });
    }
  };

  const handleCopyOptionsJson = async () => {
    logDebug(componentName, 'CopyAction', 'Copy Options JSON button clicked. Data ready:', isDataReadyForExport);
    if (!isDataReadyForExport || !parsedDataState) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'Options chain data is not available for JSON copy.' });
      return;
    }
    try {
      const success = await copyToClipboard(JSON.stringify(parsedDataState, null, 2));
      if (success) {
        toast({ title: 'Options Copied (JSON)', description: 'Options chain JSON data copied to clipboard.' });
      } else {
        toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy options chain JSON data.' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Copy Error', description: `Failed to copy JSON: ${e.message}` });
    }
  };
  
  logDebug(componentName, 'RenderState', `isLoading=${isLoadingState}, isError=${isErrorState}, errorMsg='${errorOrSkippedMessageState}', contracts=${contractsToDisplay.length}, atmStrike=${atmStrikeValueState}, exportReady=${isDataReadyForExport}`);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Options Chain</CardTitle>
                {isLoadingState ? (
                    <Skeleton className="h-5 w-3/4 mt-1" />
                ) : (
                    <CardDescription className="mt-1">
                    Options chain for {displayTicker} - Expires: {displayExpirationDate}
                    </CardDescription>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyOptionsJson} disabled={!isDataReadyForExport} title="Copy Options Chain as JSON">
                    <Copy className="mr-2 h-4 w-4" /> Copy JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportOptionsJson} disabled={!isDataReadyForExport} title="Export Options Chain as JSON">
                    <Download className="mr-2 h-4 w-4" /> Export JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyOptionsCsv} disabled={!isDataReadyForExport} title="Copy Options Chain as CSV">
                    <Copy className="mr-2 h-4 w-4" /> Copy CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportOptionsCsv} disabled={!isDataReadyForExport} title="Export Options Chain as CSV">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
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
            {isLoadingState
              ? Array.from({ length: 15 }).map((_, index) => renderSkeletonRow(index))
              : isErrorState
                ? <TableRow><TableCell colSpan={callHeadersConfig.length + 1 + putHeadersConfig.length} className="text-center h-24 text-muted-foreground">
                    {errorOrSkippedMessageState}
                  </TableCell></TableRow>
                : !parsedDataState || contractsToDisplay.length === 0
                    ? <TableRow><TableCell colSpan={callHeadersConfig.length + 1 + putHeadersConfig.length} className="text-center h-24 text-muted-foreground">
                        {errorOrSkippedMessageState || "No option contracts found for this expiration and strike range."}
                      </TableCell></TableRow>
                    : contractsToDisplay.map((row: OptionsTableRow, index: number) => {
                        const isATMRow = row.strike !== null && row.strike !== undefined && atmStrikeValueState !== null && row.strike === atmStrikeValueState;
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
