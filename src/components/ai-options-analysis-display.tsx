
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { AiOptionsAnalysisOutput, WallDetail } from "@/ai/schemas/ai-options-analysis-schemas";
import { useToast } from "@/hooks/use-toast";
import { PENDING_STATUS_JSON_VARIANTS } from "@/lib/constants";
import { useQuickExport } from "@/hooks/use-export-actions";
import { formatCurrency, formatCompactNumber } from "@/lib/number-utils";
import type { StockSnapshotData } from "@/services/data-sources/types";
import { useJsonDataStateWithFsm } from "@/hooks/use-json-data-state";

const getTickerFromSnapshot = (snapshotJson: string): string => {
  try {
    if (snapshotJson && snapshotJson !== '{}' && !snapshotJson.includes('"status":') && !snapshotJson.includes('"error":')) {
      const snapshotData = JSON.parse(snapshotJson) as StockSnapshotData;
      return snapshotData?.ticker?.toUpperCase() || "STOCK";
    }
  } catch (e) {
    // Note: Minimal error handling for ticker parsing, no logging to avoid render loops
  }
  return "STOCK";
};


export function AiOptionsAnalysisDisplay() {
  const { aiOptionsAnalysisJson, stockSnapshotJson, fsmState } = useStockAnalysis();
  const { toast } = useToast();
  const componentName = 'AiOptionsAnalysisDisplay';

  // Use new JSON data state hook with FSM integration - disable logging to prevent render loops
  const { data: parsedData, isLoading, isError, isEmpty } = useJsonDataStateWithFsm<AiOptionsAnalysisOutput>(
    aiOptionsAnalysisJson,
    fsmState,
    { 
      enableLogging: false, // Disabled to prevent render loop with console.debug calls
      validateData: (data) => {
        return data && typeof data === 'object' && data.call_wall && data.put_wall;
      }
    }
  );

  // Memoize error message to prevent recalculation and state updates
  const errorMessage = useMemo(() => {
    if (isEmpty) {
      return "No AI Options Analysis data. Ensure options chain was processed by AI.";
    } else if (isLoading) {
      return "Loading AI Options Analysis...";
    } else if (isError) {
      // Check for specific error patterns in the JSON
      try {
        const parsedJson = JSON.parse(aiOptionsAnalysisJson);
        if (parsedJson.status === 'skipped') {
          return parsedJson.message || "AI Options Analysis was skipped.";
        } else {
          return parsedJson.message || parsedJson.error || "Error loading AI Options Analysis.";
        }
      } catch {
        return "Failed to parse AI Options Analysis data.";
      }
    }
    return null;
  }, [isEmpty, isLoading, isError, aiOptionsAnalysisJson]);

  // Remove state change logging to prevent potential render loops and console noise
  // State changes are already tracked internally by useJsonDataStateWithFsm

  const currentTicker = getTickerFromSnapshot(stockSnapshotJson);
  const isDataReadyForExport = !isLoading && !isError && parsedData &&
    ( (parsedData.callWalls && parsedData.callWalls.length > 0) ||
      (parsedData.putWalls && parsedData.putWalls.length > 0)
    );

  const exportActions = useQuickExport(
    parsedData || {},
    `${currentTicker}_ai_options_analysis`,
    "AI Options Analysis"
  );

  const handleExport = () => {
    if (!isDataReadyForExport || !parsedData) {
      toast({ variant: "destructive", title: "Export Failed", description: "AI options analysis data not available for export." });
      return;
    }
    exportActions.download();
  };

  const handleCopy = async () => {
    if (!isDataReadyForExport || !parsedData) {
      toast({ variant: "destructive", title: "Copy Failed", description: "AI options analysis data not available for copy." });
      return;
    }
    await exportActions.copy();
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
  if (isLoading) {
    content = (
      <div className="p-3 text-center text-sm text-muted-foreground h-24 flex items-center justify-center">
        Waiting for options analysis...
      </div>
    );
  } else if (isError && errorMessage) {
    content = (
      <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
        {errorMessage}
      </div>
    );
  } else if (parsedData) {
    const hasWalls = parsedData.callWalls.length > 0 || parsedData.putWalls.length > 0;
    content = (
      <>
        {hasWalls ? (
          <Accordion type="multiple" defaultValue={["call-walls", "put-walls"]} className="w-full">
            <AccordionItem value="call-walls">
              <AccordionTrigger className="text-md font-semibold">Identified Call Walls ({parsedData.callWalls?.length || 0})</AccordionTrigger>
              <AccordionContent>
                {renderWallTable(parsedData.callWalls, 'Call')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="put-walls">
              <AccordionTrigger className="text-md font-semibold">Identified Put Walls ({parsedData.putWalls?.length || 0})</AccordionTrigger>
              <AccordionContent>
                {renderWallTable(parsedData.putWalls, 'Put')}
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
          {errorMessage || "AI Options Analysis data is unavailable."}
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
