
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Copy, Info } from "lucide-react";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { AiOptionsAnalysisOutput, WallDetail } from "@/ai/schemas/ai-options-analysis-schemas";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";
import { formatCurrency, formatCompactNumber, formatToTwoDecimals } from "@/lib/number-utils";
import type { StockSnapshotData } from "@/services/data-sources/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getTickerFromSnapshot = (snapshotJson: string, logDebug: Function): string => {
  try {
    if (snapshotJson && snapshotJson !== '{}' && !snapshotJson.includes('"status":') && !snapshotJson.includes('"error":')) {
      const snapshotData = JSON.parse(snapshotJson) as StockSnapshotData;
      return snapshotData?.ticker?.toUpperCase() || "STOCK";
    }
  } catch (e) {
    logDebug('AiOptionsAnalysisDisplay:getTickerFromSnapshot', "Failed to parse stockSnapshotJson for ticker", e);
  }
  return "STOCK";
};

const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }'
];

export function AiOptionsAnalysisDisplay() {
  const { aiOptionsAnalysisJson, stockSnapshotJson, logDebug } = useStockAnalysis();
  const { toast } = useToast();
  const componentName = 'AiOptionsAnalysisDisplay';

  logDebug(componentName, "aiOptionsAnalysisJson (start):", aiOptionsAnalysisJson ? aiOptionsAnalysisJson.substring(0,100) : "null");

  let isLoading = false;
  let isError = false;
  let errorMessageForDisplay: string | null = null;
  let parsedSuccessfullyData: AiOptionsAnalysisOutput | null = null;

  if (!aiOptionsAnalysisJson) {
    errorMessageForDisplay = "AI Options Analysis data not available.";
  } else if (aiOptionsAnalysisJson === '{}') {
    errorMessageForDisplay = "No AI Options Analysis data. Ensure options chain was processed by AI.";
  } else if (PENDING_STATUS_JSON_VARIANTS.includes(aiOptionsAnalysisJson.trim())) {
    isLoading = true;
  } else {
    try {
      const parsedJson = JSON.parse(aiOptionsAnalysisJson);
      if (parsedJson.status === 'error' || parsedJson.error) {
        isError = true;
        errorMessageForDisplay = parsedJson.message || parsedJson.error || "Error loading AI Options Analysis.";
        logDebug(componentName, `JSON indicates status/error: ${parsedJson.status || parsedJson.error || 'unknown_structure'}, message: ${errorMessageForDisplay}`);
      } else if (parsedJson.status === 'skipped') {
        isError = true;
        errorMessageForDisplay = parsedJson.message || "AI Options Analysis was skipped.";
        logDebug(componentName, `JSON indicates status: skipped, message: ${errorMessageForDisplay}`);
      } else if (typeof parsedJson === 'object' && parsedJson !== null && Array.isArray(parsedJson.callWalls) && Array.isArray(parsedJson.putWalls)) {
        parsedSuccessfullyData = parsedJson as AiOptionsAnalysisOutput;
        isError = false;
        errorMessageForDisplay = null;
        logDebug(componentName, "Successfully parsed aiOptionsAnalysisJson data.", parsedSuccessfullyData);
      } else {
        isError = true;
        errorMessageForDisplay = "AI Options Analysis data is malformed or incomplete.";
        logDebug(componentName, "Parsed aiOptionsAnalysisJson data is malformed or missing critical fields.", parsedJson);
      }
    } catch (e) {
      isError = true;
      errorMessageForDisplay = "Failed to parse AI Options Analysis data.";
      logDebug(componentName, "Error parsing AI Options Analysis JSON.", e, aiOptionsAnalysisJson);
    }
  }

  const currentTicker = getTickerFromSnapshot(stockSnapshotJson, logDebug);
  const isDataReadyForExport = !isLoading && !isError && parsedSuccessfullyData &&
    ( (parsedSuccessfullyData.callWalls && parsedSuccessfullyData.callWalls.length > 0) ||
      (parsedSuccessfullyData.putWalls && parsedSuccessfullyData.putWalls.length > 0) ||
       parsedSuccessfullyData.liquidityTier // Allow export if tier/methodology exists even with no walls
    );

  const handleExport = () => {
    logDebug(componentName, `Attempting to export options analysis as JSON for ${currentTicker}`);
    if (!isDataReadyForExport || !parsedSuccessfullyData) {
      toast({ variant: "destructive", title: "Export Failed", description: "AI options analysis data not available for export." });
      return;
    }
    try {
      downloadJson(parsedSuccessfullyData, `${currentTicker}_ai_options_analysis.json`);
      toast({ title: "Exported as JSON", description: "AI options analysis downloaded." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Export Error", description: `Could not export options analysis: ${e.message}` });
    }
  };

  const handleCopy = async () => {
    logDebug(componentName, `Attempting to copy options analysis as JSON for ${currentTicker}`);
    if (!isDataReadyForExport || !parsedSuccessfullyData) {
      toast({ variant: "destructive", title: "Copy Failed", description: "AI options analysis data not available for copy." });
      return;
    }
    try {
      const success = await copyToClipboard(JSON.stringify(parsedSuccessfullyData, null, 2));
      if (success) {
        toast({ title: `Copied as JSON`, description: "AI options analysis copied to clipboard." });
      } else {
        throw new Error("Clipboard API failed.");
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Copy Error", description: `Could not copy options analysis: ${e.message}` });
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
            <TableHead className="text-right">Wall Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {walls.map(wall => (
            <TableRow key={`${type}-wall-${wall.strike}`}>
              <TableCell>{formatCurrency(wall.strike, "$", "N/A", true)}</TableCell>
              <TableCell className="text-right">{formatCompactNumber(wall.openInterest, "N/A")}</TableCell>
              <TableCell className="text-right">{wall.wallScore !== undefined ? formatToTwoDecimals(wall.wallScore, "-") : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  logDebug(componentName, `Render state: isLoading=${isLoading}, isError=${isError}, errorMessageForDisplay='${errorMessageForDisplay}', parsedSuccessfullyData exists=${!!parsedSuccessfullyData}`);

  let content;
  if (isLoading) {
    content = (
      <div className="space-y-4 p-2">
        <Skeleton className="h-6 w-1/2 mb-1" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-1/3 mb-2 mt-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  } else if (isError && errorMessageForDisplay) {
    content = (
      <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
        {errorMessageForDisplay}
      </div>
    );
  } else if (parsedSuccessfullyData) {
    const hasWalls = parsedSuccessfullyData.callWalls.length > 0 || parsedSuccessfullyData.putWalls.length > 0;
    content = (
      <>
        {parsedSuccessfullyData.liquidityTier && (
          <div className="p-2 mb-3 text-sm text-muted-foreground border-b pb-3">
            <span className="font-semibold text-foreground">Liquidity Tier:</span> {parsedSuccessfullyData.liquidityTier}
            {parsedSuccessfullyData.analysisMethodology && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0 align-middle">
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{parsedSuccessfullyData.analysisMethodology}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
        {hasWalls ? (
          <Accordion type="multiple" defaultValue={["call-walls", "put-walls"]} className="w-full">
            <AccordionItem value="call-walls">
              <AccordionTrigger className="text-md font-semibold">Identified Call Walls ({parsedSuccessfullyData.callWalls?.length || 0})</AccordionTrigger>
              <AccordionContent>
                {renderWallTable(parsedSuccessfullyData.callWalls, 'Call')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="put-walls">
              <AccordionTrigger className="text-md font-semibold">Identified Put Walls ({parsedSuccessfullyData.putWalls?.length || 0})</AccordionTrigger>
              <AccordionContent>
                {renderWallTable(parsedSuccessfullyData.putWalls, 'Put')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
            No significant walls identified by AI using the current methodology.
          </div>
        )}
      </>
    );
  } else {
      content = (
        <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
          AI Options Analysis data not available.
        </div>
      );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>AI Analyzed Options Chain</CardTitle>
          <CardDescription>Key levels (Call & Put Walls, up to 3 each) based on adaptive OI analysis.</CardDescription>
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
