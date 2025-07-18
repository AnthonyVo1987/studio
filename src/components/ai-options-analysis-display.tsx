
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { AiOptionsAnalysisOutput, WallDetail } from "@/ai/schemas/ai-options-analysis-schemas";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useExportActions } from '@/hooks/use-export-actions';
import { formatCurrency, formatCompactNumber } from "@/lib/number-utils";
import type { StockSnapshotData } from "@/services/data-sources/types";

const getTickerFromSnapshot = (snapshotJson: string): string => {
  try {
    if (snapshotJson && snapshotJson !== '{}' && !snapshotJson.includes('"status":') && !snapshotJson.includes('"error":')) {
      const snapshotData = JSON.parse(snapshotJson) as StockSnapshotData;
      return snapshotData?.ticker?.toUpperCase() || "STOCK";
    }
  } catch (e) {
    console.error("Failed to parse stockSnapshotJson for ticker", e);
  }
  return "STOCK";
};

import { PENDING_STATUS_JSON_VARIANTS } from "@/lib/constants";

export function AiOptionsAnalysisDisplay() {
  const { aiOptionsAnalysisJson, stockSnapshotJson, logDebug } = useStockAnalysis();
  const { toast } = useToast();
  const { exportActions } = useExportActions();
  const componentName = 'AiOptionsAnalysisDisplay';

  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isErrorState, setIsErrorState] = useState(false);
  const [errorMessageForDisplayState, setErrorMessageForDisplayState] = useState<string | null>("AI Options Analysis data not available.");
  const [parsedDataState, setParsedDataState] = useState<AiOptionsAnalysisOutput | null>(null);

  useEffect(() => {
    const currentJson = aiOptionsAnalysisJson;

    let newIsLoading = true;
    let newIsError = false;
    let newErrorMsg: string | null = "AI Options Analysis data not available.";
    let newParsedData: AiOptionsAnalysisOutput | null = null;

    if (!currentJson || currentJson === '{}') {
      newIsLoading = false;
      newErrorMsg = "No AI Options Analysis data. Ensure options chain was processed by AI.";
    } else if (PENDING_STATUS_JSON_VARIANTS.includes(currentJson.trim())) {
      newIsLoading = true;
      newErrorMsg = "Loading AI Options Analysis...";
    } else {
      try {
        const parsedJson = JSON.parse(currentJson);
        if (parsedJson.error) { 
          newIsLoading = false;
          newIsError = true;
          newErrorMsg = parsedJson.message || parsedJson.error || "Error loading AI Options Analysis.";
        } else if (parsedJson.status === 'error' || parsedJson.status === 'skipped') {
          newIsLoading = false;
          newIsError = true;
          if (parsedJson.status === "skipped") {
            newErrorMsg = parsedJson.message || "AI Options Analysis was skipped.";
          } else { 
            newErrorMsg = parsedJson.message || parsedJson.error || "Error loading AI Options Analysis.";
          }
        } else if (typeof parsedJson === 'object' && parsedJson !== null && Array.isArray(parsedJson.callWalls) && Array.isArray(parsedJson.putWalls)) {
          newIsLoading = false;
          newIsError = false;
          newParsedData = parsedJson as AiOptionsAnalysisOutput;
          newErrorMsg = null;
        } else {
          newIsLoading = false;
          newIsError = true;
          newErrorMsg = "AI Options Analysis data is malformed or incomplete.";
        }
      } catch (e) {
        console.error(`[${componentName}] Failed to parse aiOptionsAnalysisJson:`, e, "JSON:", currentJson.substring(0,200));
        newIsLoading = false;
        newIsError = true;
        newErrorMsg = "Failed to parse AI Options Analysis data.";
      }
    }
    
    setIsLoadingState(newIsLoading);
    setIsErrorState(newIsError);
    setErrorMessageForDisplayState(newErrorMsg);
    setParsedDataState(newParsedData);

  }, [aiOptionsAnalysisJson]);

  const currentTicker = getTickerFromSnapshot(stockSnapshotJson);
  const isDataReadyForExport = !isLoadingState && !isErrorState && parsedDataState &&
    ( (parsedDataState.callWalls && parsedDataState.callWalls.length > 0) ||
      (parsedDataState.putWalls && parsedDataState.putWalls.length > 0)
    );

  const { copy, download } = exportActions({
    data: parsedDataState,
    filename: `${currentTicker}_ai_options_analysis`,
    label: 'AI Options Analysis'
  });

  const handleCopy = async () => {
    logDebug(componentName, `CopyAction`, `Attempting to copy options analysis as JSON for ${currentTicker}`);
    if (!isDataReadyForExport) {
      toast({ variant: "destructive", title: "Copy Failed", description: "AI options analysis data not available for copy." });
      return;
    }
    const success = await copy();
    if (success) {
      toast({ title: `Copied as JSON`, description: "AI options analysis copied to clipboard." });
    } else {
      toast({ variant: "destructive", title: "Copy Error", description: `Could not copy options analysis.` });
    }
  };

  const handleExport = () => {
    logDebug(componentName, `ExportAction`, `Attempting to export options analysis as JSON for ${currentTicker}`);
    if (!isDataReadyForExport) {
      toast({ variant: "destructive", title: "Export Failed", description: "AI options analysis data not available for export." });
      return;
    }
    const success = download();
    if (success) {
      toast({ title: "Exported as JSON", description: "AI options analysis downloaded." });
    } else {
      toast({ variant: "destructive", title: "Export Error", description: `Could not export options analysis.` });
    }
  };

  const renderWallTable = (walls: WallDetail[] | undefined, type: 'Call' | 'Put') => {
    if (!walls || walls.length === 0) {
      return <p className="text-sm text-muted-foreground p-2">No significant {type.toLowerCase()} walls identified.</p>;
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Strike</TableHead>
            <TableHead className="text-right">Open Interest</TableHead>
            <TableHead className="text-right">Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {walls.map(wall => (
            <TableRow key={`${type}-wall-${wall.strike}`}>
              <TableCell>{formatCurrency(wall.strike, "$", "N/A", true)}</TableCell>
              <TableCell className="text-right">{formatCompactNumber(wall.openInterest, "N/A")}</TableCell>
              <TableCell className="text-right">{wall.volume !== undefined ? formatCompactNumber(wall.volume, "-") : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  let content;
  if (isLoadingState) {
    content = (
      <div className="space-y-4 p-2">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-1/3 mb-2 mt-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  } else if (isErrorState && errorMessageForDisplayState) {
    content = (
      <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
        {errorMessageForDisplayState}
      </div>
    );
  } else if (parsedDataState) {
    const hasWalls = parsedDataState.callWalls.length > 0 || parsedDataState.putWalls.length > 0;
    content = (
      <>
        {hasWalls ? (
          <Accordion type="multiple" defaultValue={["call-walls", "put-walls"]} className="w-full">
            <AccordionItem value="call-walls">
              <AccordionTrigger className="text-md font-semibold">Identified Call Walls ({parsedDataState.callWalls?.length || 0})</AccordionTrigger>
              <AccordionContent>
                {renderWallTable(parsedDataState.callWalls, 'Call')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="put-walls">
              <AccordionTrigger className="text-md font-semibold">Identified Put Walls ({parsedDataState.putWalls?.length || 0})</AccordionTrigger>
              <AccordionContent>
                {renderWallTable(parsedDataState.putWalls, 'Put')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
            No significant walls identified by AI.
          </div>
        )}
      </>
    );
  } else {
      content = (
        <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
          {errorMessageForDisplayState || "AI Options Analysis data is unavailable."}
        </div>
      );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>AI Analyzed Options Chain</CardTitle>
          <CardDescription>Key levels (Call & Put Walls, up to 3 each) based on OI/Volume concentration.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!isDataReadyForExport}>
            <Copy className="mr-2 h-4 w-4" /> Copy JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!isDataReadyForExport}>
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
