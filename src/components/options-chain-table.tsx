
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
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { OptionsChainData, OptionsTableRow, StreamlinedOptionContract, StockSnapshotData } from "@/services/data-sources/types";
import { formatCurrency, formatPercentage, formatCompactNumber, formatToTwoDecimals } from "@/lib/number-utils";
import { formatDisplayDate } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

const renderSkeletonRow = (rowIndex: number) => (
  <TableRow key={`skeleton-options-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-muted/20 dark:bg-muted/10" : ""}>
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


export function OptionsChainTable() {
  const { optionsChainJson, stockSnapshotJson } = useStockAnalysis(); 

  let isLoading = false;
  let isError = false;
  let parsedData: OptionsChainData | null = null;
  let parsedSnapshotData: StockSnapshotData | null = null;

  if (
    optionsChainJson.includes('"status": "initializing"') ||
    optionsChainJson.includes('"status": "pending"')
  ) {
    isLoading = true;
  } else if (optionsChainJson.includes('"error":') || optionsChainJson.includes('"status": "skipped"')) {
    isError = true;
    isLoading = false;
  } else {
    try {
      const data = JSON.parse(optionsChainJson) as OptionsChainData;
      if (data && typeof data === 'object' && !data.error && Array.isArray(data.contracts)) {
        isLoading = false;
        parsedData = data;
      } else {
        isError = true; 
        isLoading = false;
      }
    } catch (e) {
      console.error("Failed to parse optionsChainJson in OptionsChainTable:", e);
      isError = true;
      isLoading = false;
    }
  }

  try {
    if (stockSnapshotJson && !stockSnapshotJson.includes('"status":') && !stockSnapshotJson.includes('"error":')) {
      parsedSnapshotData = JSON.parse(stockSnapshotJson) as StockSnapshotData;
    }
  } catch (e) {
    console.error("Failed to parse stockSnapshotJson for ATM price:", e);
    // ATM highlighting will not work, but table can still render
  }
  
  const displayTicker = parsedData?.ticker || (isLoading ? "" : "N/A");
  const displayExpirationDate = parsedData?.expiration_date ? formatDisplayDate(parsedData.expiration_date) : (isLoading ? "" : "N/A");
  const contracts = parsedData?.contracts || [];

  let atmStrikeValue: number | null = null;
  if (parsedSnapshotData?.currentPrice && contracts.length > 0) {
    atmStrikeValue = contracts.reduce((prev, curr) => {
      return (Math.abs(curr.strike - parsedSnapshotData!.currentPrice!) < Math.abs(prev.strike - parsedSnapshotData!.currentPrice!)) ? curr : prev;
    }).strike;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Options Chain</CardTitle>
        {isLoading ? (
            <Skeleton className="h-5 w-1/2" />
        ) : (
            <CardDescription>
            Options chain for {displayTicker} - Expires: {displayExpirationDate}
            </CardDescription>
        )}
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
              : isError || !parsedData
                ? <TableRow><TableCell colSpan={callHeadersConfig.length + 1 + putHeadersConfig.length} className="text-center h-24 text-muted-foreground">Options data not available or failed to load.</TableCell></TableRow>
                : contracts.length === 0 
                    ? <TableRow><TableCell colSpan={callHeadersConfig.length + 1 + putHeadersConfig.length} className="text-center h-24 text-muted-foreground">No option contracts found for this expiration and strike range.</TableCell></TableRow>
                    : contracts.map((row: OptionsTableRow, index: number) => {
                        const isATMRow = row.strike === atmStrikeValue;
                        const rowClasses = cn(
                            isATMRow ? "bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30" : 
                                       (index % 2 === 0 ? "bg-muted/25 dark:bg-muted/10 hover:bg-muted/40 dark:hover:bg-muted/20" : "hover:bg-muted/40 dark:hover:bg-muted/20")
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
                                    isATMRow ? "bg-primary/10 dark:bg-primary/20" : (index % 2 === 0 ? "bg-muted/25 dark:bg-muted/10" : "bg-card")
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
