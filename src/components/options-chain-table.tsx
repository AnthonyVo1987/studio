
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
import { formatCurrency, formatPercentage, formatCompactNumber, formatToTwoDecimals } from "@/lib/number-utils";
import { formatDisplayDate } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { downloadJson, copyToClipboard } from "@/lib/export-utils"; 
import type { OptionType, TableDisplayType } from '@/contexts/staging-options-context';

interface OptionHeaderConfig {
  key: keyof StreamlinedOptionContract;
  label: string;
  formatter: (value: any) => string;
}

const callHeadersConfig: OptionHeaderConfig[] = [
  { key: "iv", label: "IV", formatter: (v) => formatPercentage(v, "-", false) },
  { key: "percent_change", label: "% Chg", formatter: (v) => formatPercentage(v, "-", true) },
  { key: "bid", label: "Bid", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "ask", label: "Ask", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "last_price", label: "Last", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "volume", label: "Volume", formatter: (v) => formatCompactNumber(v, "-") },
  { key: "open_interest", label: "Open Int", formatter: (v) => formatCompactNumber(v, "-") },
  { key: "delta", label: "Delta", formatter: (v) => formatToTwoDecimals(v, "-") },
  { key: "gamma", label: "Gamma", formatter: (v) => formatToTwoDecimals(v, "-") },
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

const singleTableHeadersConfig: OptionHeaderConfig[] = [
  // Strike is handled separately
  { key: "iv", label: "IV", formatter: (v) => formatPercentage(v, "-", false) },
  { key: "percent_change", label: "% Chg", formatter: (v) => formatPercentage(v, "-", true) },
  { key: "bid", label: "Bid", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "ask", label: "Ask", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "last_price", label: "Last", formatter: (v) => formatCurrency(v, "$", "-") },
  { key: "volume", label: "Volume", formatter: (v) => formatCompactNumber(v, "-") },
  { key: "open_interest", label: "Open Int", formatter: (v) => formatCompactNumber(v, "-") },
  { key: "delta", label: "Delta", formatter: (v) => formatToTwoDecimals(v, "-") },
  { key: "gamma", label: "Gamma", formatter: (v) => formatToTwoDecimals(v, "-") },
];


const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }',
  '{ "status": "no_analysis_run_yet" }'
];

interface OptionsChainTableProps {
  dataSourceJson?: string;
  snapshotDataSourceJson?: string;
  optionType?: OptionType;
  tableDisplayType?: TableDisplayType;
}

export function OptionsChainTable({ 
  dataSourceJson, 
  snapshotDataSourceJson, 
  optionType: propOptionType, 
  tableDisplayType: propTableDisplayType 
}: OptionsChainTableProps) {
  const globalContext = useStockAnalysis();
  const { toast } = useToast();
  const componentName = 'OptionsChainTable';

  // Use props if provided (for staging), otherwise fall back to global context (for main tab)
  const optionsChainJson = dataSourceJson !== undefined ? dataSourceJson : globalContext.optionsChainJson;
  const stockSnapshotJson = snapshotDataSourceJson !== undefined ? snapshotDataSourceJson : globalContext.stockSnapshotJson;
  const optionType = propOptionType !== undefined ? propOptionType : globalContext.optionType;
  const tableDisplayType = propTableDisplayType !== undefined ? propTableDisplayType : globalContext.tableDisplayType;

  const { logDebug } = globalContext;

  const prevOptionsJsonRef = useRef<string | null>(null);
  const prevSnapshotJsonRef = useRef<string | null>(null);

  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isErrorState, setIsErrorState] = useState(false);
  const [errorOrSkippedMessageState, setErrorOrSkippedMessageState] = useState("Options data failed to load.");
  const [parsedDataState, setParsedDataState] = useState<OptionsChainData | null>(null);
  const [currentPriceForATMState, setCurrentPriceForATMState] = useState<number | null>(null);
  const [atmStrikeValueState, setAtmStrikeValueState] = useState<number | null>(null);
  
  const showCalls = optionType === 'both' || optionType === 'calls';
  const showPuts = optionType === 'both' || optionType === 'puts';
  
  useEffect(() => {
    const currentOptionsJson = optionsChainJson;
    const currentSnapshotJson = stockSnapshotJson;
    let optionsChanged = false;
    let snapshotChanged = false;

    if (currentOptionsJson !== prevOptionsJsonRef.current) {
      logDebug(componentName, "PropsReceived", "optionsChainJson prop changed. New Length:", currentOptionsJson?.length);
      prevOptionsJsonRef.current = currentOptionsJson;
      optionsChanged = true;
    }
    if (currentSnapshotJson !== prevSnapshotJsonRef.current) {
      logDebug(componentName, "PropsReceived", "stockSnapshotJson prop changed. New Length:", currentSnapshotJson?.length);
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

    if (optionsChanged) {
        newIsLoading = true;
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
    
    const finalContracts = newParsedData?.contracts || [];
    let newAtmStrikeValue: number | null = null;
    let priceToUseForAtm = newCurrentPriceForATM;

    if (priceToUseForAtm === null && newParsedData?.underlying_price) {
        priceToUseForAtm = newParsedData.underlying_price;
        logDebug(componentName, "AtmPriceFallback", `Using underlying_price from options data for ATM: ${priceToUseForAtm}`);
    }

    if (priceToUseForAtm !== null && finalContracts.length > 0) {
        newAtmStrikeValue = finalContracts.reduce((prev, curr) => {
        return (Math.abs((curr.strike || 0) - (priceToUseForAtm!)) < Math.abs((prev.strike || 0) - (priceToUseForAtm!))) ? curr : prev;
        }).strike;
    }
    
    setAtmStrikeValueState(newAtmStrikeValue);
    setIsLoadingState(newIsLoading);
    setIsErrorState(newIsError);
    setErrorOrSkippedMessageState(newErrorMsg);

  }, [optionsChainJson, stockSnapshotJson, logDebug]);

  const displayTicker = parsedDataState?.ticker || (isLoadingState ? "" : "N/A");
  const displayExpirationDate = parsedDataState?.expiration_date ? formatDisplayDate(parsedDataState.expiration_date) : (isLoadingState ? "" : "N/A");
  const contractsToDisplay = parsedDataState?.contracts || [];
  
  const isDataReadyForExport = !isLoadingState && !isErrorState && parsedDataState && (parsedDataState.contracts?.length || 0) > 0;

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
  
  logDebug(componentName, 'RenderState', `isLoading=${isLoadingState}, isError=${isErrorState}, errorMsg='${errorOrSkippedMessageState}', contracts=${contractsToDisplay.length}, atmStrike=${atmStrikeValueState}, exportReady=${isDataReadyForExport}, tableDisplayType=${tableDisplayType}, optionType=${optionType}`);

  const renderSideBySideTable = () => (
    <Table className="min-w-max text-xs">
        <TableHeader>
        <TableRow>
            {showCalls && <TableHead colSpan={callHeadersConfig.length} className="text-center font-semibold text-base p-1.5 whitespace-nowrap border-b-2">CALLS</TableHead>}
            <TableHead className="text-center font-semibold text-base p-1.5 whitespace-nowrap bg-card border-l border-r border-b-2">STRIKE</TableHead>
            {showPuts && <TableHead colSpan={putHeadersConfig.length} className="text-center font-semibold text-base p-1.5 whitespace-nowrap border-b-2">PUTS</TableHead>}
        </TableRow>
        <TableRow>
            {showCalls && callHeadersConfig.slice().reverse().map((header) => (
            <TableHead key={`call-header-${header.key}`} className="p-1.5 whitespace-nowrap text-center text-muted-foreground">
                {header.label}
            </TableHead>
            ))}
            <TableHead className="p-1.5 whitespace-nowrap text-center bg-card border-l border-r text-muted-foreground">Price</TableHead>
            {showPuts && putHeadersConfig.map((header) => (
            <TableHead key={`put-header-${header.key}`} className="p-1.5 whitespace-nowrap text-center text-muted-foreground">
                {header.label}
            </TableHead>
            ))}
        </TableRow>
        </TableHeader>
        <TableBody>
          {contractsToDisplay.map((row: OptionsTableRow, index: number) => {
              const isATMRow = row.strike !== null && row.strike !== undefined && atmStrikeValueState !== null && row.strike === atmStrikeValueState;
              const rowClasses = cn(
                  "transition-colors",
                  isATMRow ? "bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 font-semibold" :
                              (index % 2 !== 0 ? "bg-muted/25 dark:bg-muted/10 hover:bg-muted/40 dark:hover:bg-muted/20" : "hover:bg-muted/40 dark:hover:bg-muted/20")
              );
              return (
                  <TableRow key={`options-row-${row.strike}-${index}`} className={rowClasses}>
                      {showCalls && callHeadersConfig.slice().reverse().map((header) => (
                      <TableCell key={`call-cell-${header.key}-${index}`} className="p-1.5 whitespace-nowrap text-center">
                          {header.formatter(row.call?.[header.key])}
                      </TableCell>
                      ))}
                      <TableCell className={cn(
                          "p-1.5 whitespace-nowrap text-center font-semibold border-l border-r",
                          isATMRow ? "bg-primary/20 dark:bg-primary/30 text-primary-foreground" : (index % 2 !== 0 ? "bg-muted/30 dark:bg-muted/15" : "bg-card")
                      )}>
                      {formatCurrency(row.strike, "$", "-", true)}
                      </TableCell>
                      {showPuts && putHeadersConfig.map((header) => (
                      <TableCell key={`put-cell-${header.key}-${index}`} className="p-1.5 whitespace-nowrap text-center">
                          {header.formatter(row.put?.[header.key])}
                      </TableCell>
                      ))}
                  </TableRow>
              );
          })}
        </TableBody>
    </Table>
  );

  const renderTopBottomTable = (type: 'call' | 'put') => (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">{type === 'call' ? 'Call Options' : 'Put Options'}</h3>
      <Table className="min-w-max text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="p-1.5 whitespace-nowrap text-left text-muted-foreground font-semibold">Strike</TableHead>
            {singleTableHeadersConfig.map(header => (
              <TableHead key={`${type}-tb-header-${header.key}`} className="p-1.5 whitespace-nowrap text-center text-muted-foreground">{header.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {contractsToDisplay.map((row, index) => {
            const contract = row[type];
            if (!contract) return null;
            const isATMRow = row.strike === atmStrikeValueState;
            const rowClasses = cn(
              "transition-colors",
              isATMRow ? "bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 font-semibold" :
                         (index % 2 !== 0 ? "bg-muted/25 dark:bg-muted/10 hover:bg-muted/40 dark:hover:bg-muted/20" : "hover:bg-muted/40 dark:hover:bg-muted/20")
            );
            return (
              <TableRow key={`${type}-tb-row-${row.strike}`} className={rowClasses}>
                <TableCell className="p-1.5 whitespace-nowrap text-left font-semibold">{formatCurrency(row.strike, "$", "-", true)}</TableCell>
                {singleTableHeadersConfig.map(header => (
                  <TableCell key={`${type}-tb-cell-${header.key}-${row.strike}`} className="p-1.5 whitespace-nowrap text-center">
                    {header.formatter(contract[header.key])}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderContent = () => {
    if (isLoadingState) {
      return <div className="p-4"><Skeleton className="h-64 w-full" /></div>;
    }
    if (isErrorState) {
      return <div className="text-center h-24 p-4 text-muted-foreground">{errorOrSkippedMessageState}</div>;
    }
    if (!parsedDataState || contractsToDisplay.length === 0) {
      return <div className="text-center h-24 p-4 text-muted-foreground">{errorOrSkippedMessageState || "No option contracts found for this expiration and strike range."}</div>;
    }

    if (tableDisplayType === 'top-bottom') {
      return (
        <div className="overflow-x-auto">
          {showCalls && renderTopBottomTable('call')}
          {showPuts && renderTopBottomTable('put')}
        </div>
      );
    }
    
    // Default to side-by-side
    return <div className="overflow-x-auto">{renderSideBySideTable()}</div>;
  }

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
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 md:p-3">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
