
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { AiOptionsAnalysisOutput, WallDetail, ClusterDetail } from "@/ai/schemas/ai-options-analysis-schemas";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";
import { formatCurrency, formatCompactNumber } from "@/lib/number-utils";
import type { StockSnapshotData } from "@/services/data-sources/types";

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
  let errorOrSkippedMessage = "AI Options Analysis data not available.";
  let parsedAnalysisData: AiOptionsAnalysisOutput | null = null;

  if (!aiOptionsAnalysisJson || aiOptionsAnalysisJson === '{}') {
    isLoading = false;
    isError = false; // Not an error, just no data yet
    parsedAnalysisData = null;
    errorOrSkippedMessage = "No AI Options Analysis data. Ensure options chain was processed by AI.";
    logDebug(componentName, "aiOptionsAnalysisJson is empty or null. Displaying 'No data'.");
  } else if (PENDING_STATUS_JSON_VARIANTS.includes(aiOptionsAnalysisJson.trim())) {
    isLoading = true;
    isError = false;
    parsedAnalysisData = null;
    errorOrSkippedMessage = ""; // Clear any previous error message
    logDebug(componentName, "aiOptionsAnalysisJson is in a defined pending/initializing state.");
  } else if (aiOptionsAnalysisJson.includes('"status": "error"') || aiOptionsAnalysisJson.includes('"status": "skipped"') || aiOptionsAnalysisJson.includes('"error":')) { 
    isLoading = false;
    isError = true;
    parsedAnalysisData = null;
    try {
      const statusObj = JSON.parse(aiOptionsAnalysisJson);
      if (statusObj.status === "skipped") {
        errorOrSkippedMessage = statusObj.message || "AI Options Analysis was skipped.";
      } else { // error or direct error field
        errorOrSkippedMessage = statusObj.message || statusObj.error || "Error loading AI Options Analysis.";
      }
      logDebug(componentName, `JSON indicates status/error: ${statusObj.status || 'direct_error'}, message: ${errorOrSkippedMessage}`);
    } catch (e) {
      errorOrSkippedMessage = "Failed to parse status message from error/skipped JSON for AI Options Analysis.";
      logDebug(componentName, "Failed to parse error/skipped status JSON for AI Options Analysis.", e);
    }
  } else {
    // Attempt to parse actual data
    isLoading = false;
    isError = false;
    try {
      const data = JSON.parse(aiOptionsAnalysisJson) as AiOptionsAnalysisOutput;
      // Basic validation for expected data structure
      if (data && typeof data === 'object' && data.callWalls !== undefined && data.putWalls !== undefined) { 
        parsedAnalysisData = data;
        logDebug(componentName, "Successfully parsed aiOptionsAnalysisJson data.", data);
      } else {
        isError = true;
        errorOrSkippedMessage = "AI Options Analysis data is malformed or incomplete.";
        parsedAnalysisData = null;
        logDebug(componentName, "Parsed aiOptionsAnalysisJson data is malformed or missing critical fields.", data);
      }
    } catch (e) {
      isError = true;
      errorOrSkippedMessage = "Failed to parse AI Options Analysis data.";
      parsedAnalysisData = null;
      logDebug(componentName, "Error parsing AI Options Analysis JSON.", e);
    }
  }

  const currentTicker = getTickerFromSnapshot(stockSnapshotJson, logDebug);
  const isDataReadyForExport = !isLoading && !isError && parsedAnalysisData && 
    ( (parsedAnalysisData.callWalls && parsedAnalysisData.callWalls.length > 0) || 
      (parsedAnalysisData.putWalls && parsedAnalysisData.putWalls.length > 0) || 
      (parsedAnalysisData.callClusters && parsedAnalysisData.callClusters.length > 0) ||
      (parsedAnalysisData.putClusters && parsedAnalysisData.putClusters.length > 0) ||
      !!parsedAnalysisData.analysisSummary);

  const handleExport = () => {
    logDebug(componentName, `Attempting to export options analysis as JSON for ${currentTicker}`);
    if (!isDataReadyForExport || !parsedAnalysisData) {
      toast({ variant: "destructive", title: "Export Failed", description: "AI options analysis data not available." });
      return;
    }
    try {
      downloadJson(parsedAnalysisData, `${currentTicker}_ai_options_analysis.json`);
      toast({ title: "Exported as JSON", description: "AI options analysis downloaded." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Export Error", description: `Could not export options analysis: ${e.message}` });
    }
  };

  const handleCopy = async () => {
    logDebug(componentName, `Attempting to copy options analysis as JSON for ${currentTicker}`);
    if (!isDataReadyForExport || !parsedAnalysisData) {
      toast({ variant: "destructive", title: "Copy Failed", description: "AI options analysis data not available." });
      return;
    }
    try {
      const success = await copyToClipboard(JSON.stringify(parsedAnalysisData, null, 2));
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {walls.map(wall => (
            <TableRow key={`${type}-wall-${wall.strike}`}>
              <TableCell>{formatCurrency(wall.strike, "$", "N/A", true)}</TableCell>
              <TableCell className="text-right">{formatCompactNumber(wall.openInterest, "N/A")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderClusterTable = (clusters: ClusterDetail[] | undefined, type: 'Call' | 'Put') => {
    if (!clusters || clusters.length === 0) {
      return <p className="text-sm text-muted-foreground p-2">No significant {type.toLowerCase()} OI clusters identified.</p>;
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Strikes</TableHead>
            <TableHead className="text-right">Total OI</TableHead>
            <TableHead className="text-right">Avg OI / Strike</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clusters.map((cluster, index) => (
            <TableRow key={`${type}-cluster-${index}`}>
              <TableCell>{cluster.strikes.map(s => formatCurrency(s, "$", "", true)).join(', ')}</TableCell>
              <TableCell className="text-right">{formatCompactNumber(cluster.totalOI, "N/A")}</TableCell>
              <TableCell className="text-right">{formatCompactNumber(cluster.averageOI, "N/A")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  logDebug(componentName, `Render state: isLoading=${isLoading}, isError=${isError}, errorOrSkippedMessage='${errorOrSkippedMessage}', parsedDataExists=${!!parsedAnalysisData}`);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>AI Analyzed Options Chain</CardTitle>
          <CardDescription>Key levels (Walls & OI Clusters) identified from options data analysis.</CardDescription>
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
        {isLoading ? (
          <div className="space-y-4 p-2">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-1/3 mb-2 mt-4" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : isError ? (
           <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
             {errorOrSkippedMessage}
           </div>
        ) : parsedAnalysisData && ( 
            (parsedAnalysisData.callWalls && parsedAnalysisData.callWalls.length > 0) || 
            (parsedAnalysisData.putWalls && parsedAnalysisData.putWalls.length > 0) || 
            (parsedAnalysisData.callClusters && parsedAnalysisData.callClusters.length > 0) ||
            (parsedAnalysisData.putClusters && parsedAnalysisData.putClusters.length > 0) ||
            !!parsedAnalysisData.analysisSummary
        ) ? (
          <>
            {parsedAnalysisData.analysisSummary && (
              <p className="text-sm text-muted-foreground p-2 mb-3 border-l-4 border-primary/50 bg-primary/10 dark:bg-primary/20">
                <strong>AI Note:</strong> {parsedAnalysisData.analysisSummary}
              </p>
            )}
            <Accordion type="multiple" defaultValue={["call-walls", "put-walls", "call-clusters", "put-clusters"]} className="w-full">
              <AccordionItem value="call-walls">
                <AccordionTrigger className="text-md font-semibold">Identified Call Walls ({parsedAnalysisData.callWalls?.length || 0})</AccordionTrigger>
                <AccordionContent>
                  {renderWallTable(parsedAnalysisData.callWalls, 'Call')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="put-walls">
                <AccordionTrigger className="text-md font-semibold">Identified Put Walls ({parsedAnalysisData.putWalls?.length || 0})</AccordionTrigger>
                <AccordionContent>
                  {renderWallTable(parsedAnalysisData.putWalls, 'Put')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="call-clusters">
                <AccordionTrigger className="text-md font-semibold">Identified Call OI Clusters ({parsedAnalysisData.callClusters?.length || 0})</AccordionTrigger>
                <AccordionContent>
                  {renderClusterTable(parsedAnalysisData.callClusters, 'Call')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="put-clusters">
                <AccordionTrigger className="text-md font-semibold">Identified Put OI Clusters ({parsedAnalysisData.putClusters?.length || 0})</AccordionTrigger>
                <AccordionContent>
                  {renderClusterTable(parsedAnalysisData.putClusters, 'Put')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        ) : (
           <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
             {errorOrSkippedMessage || "No AI Options Analysis data to display."}
           </div>
        )}
      </CardContent>
    </Card>
  );
}

