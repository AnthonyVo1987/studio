
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

export function AiOptionsAnalysisDisplay() {
  const { aiOptionsAnalysisJson, stockSnapshotJson, logDebug } = useStockAnalysis();
  const { toast } = useToast();

  logDebug('AiOptionsAnalysisDisplay', "aiOptionsAnalysisJson (start):", aiOptionsAnalysisJson ? aiOptionsAnalysisJson.substring(0,100) : "null");

  let isLoading = false;
  let isError = false;
  let errorOrSkippedMessage = "AI Options Analysis data not available.";
  let parsedAnalysisData: AiOptionsAnalysisOutput | null = null;

  if (aiOptionsAnalysisJson === null || (typeof aiOptionsAnalysisJson === 'string' &&
    (aiOptionsAnalysisJson.includes('"status": "initializing"') ||
     aiOptionsAnalysisJson.includes('"status": "pending"') ||
     aiOptionsAnalysisJson.includes('"status": "full_analysis_pending..."')))) {
    isLoading = true;
    logDebug('AiOptionsAnalysisDisplay', "aiOptionsAnalysisJson is in pending/initializing state.");
  } else if (typeof aiOptionsAnalysisJson === 'string' && aiOptionsAnalysisJson !== '{}') {
    if (aiOptionsAnalysisJson.includes('"status": "error"') || aiOptionsAnalysisJson.includes('"error":')) { // Check for general error or specific status
      isError = true;
      errorOrSkippedMessage = "Error loading AI Options Analysis.";
      logDebug('AiOptionsAnalysisDisplay', 'aiOptionsAnalysisJson indicates an error state.');
       try {
        const tempError = JSON.parse(aiOptionsAnalysisJson);
        if (tempError.error) {
            logDebug('AiOptionsAnalysisDisplay', 'Parsed error field from JSON:', tempError.error);
        }
      } catch (e) { /* Ignore if not valid JSON */ }
    } else if (aiOptionsAnalysisJson.includes('"status": "skipped"')) {
      isError = true;
      errorOrSkippedMessage = "AI Options Analysis was skipped.";
      logDebug('AiOptionsAnalysisDisplay', 'aiOptionsAnalysisJson indicates a skipped state.');
    } else {
      try {
        const data = JSON.parse(aiOptionsAnalysisJson) as AiOptionsAnalysisOutput;
        logDebug('AiOptionsAnalysisDisplay', 'Attempting to parse aiOptionsAnalysisJson. Parsed CallWalls length:', data?.callWalls?.length);
        if (data && typeof data === 'object' && data.callWalls !== undefined && data.putWalls !== undefined) {
            parsedAnalysisData = data;
        } else {
          isError = true;
          errorOrSkippedMessage = "AI Options Analysis data is malformed or incomplete.";
          logDebug('AiOptionsAnalysisDisplay', 'Parsed data missing expected fields (callWalls/putWalls).');
        }
      } catch (e) {
        isError = true;
        errorOrSkippedMessage = "Failed to parse AI Options Analysis data.";
        logDebug('AiOptionsAnalysisDisplay', 'Error parsing AI Options Analysis JSON:', e);
      }
    }
  } else {
    isLoading = false;
    isError = true; // Treat as error/unavailable if null or empty
    errorOrSkippedMessage = "No AI Options Analysis data. Ensure options chain was processed by AI.";
    logDebug('AiOptionsAnalysisDisplay', "aiOptionsAnalysisJson is empty or null.");
  }

  const currentTicker = getTickerFromSnapshot(stockSnapshotJson, logDebug);
  const isDataReadyForExport = !isLoading && !isError && parsedAnalysisData && 
    ( (parsedAnalysisData.callWalls && parsedAnalysisData.callWalls.length > 0) || 
      (parsedAnalysisData.putWalls && parsedAnalysisData.putWalls.length > 0) || 
      (parsedAnalysisData.callClusters && parsedAnalysisData.callClusters.length > 0) ||
      (parsedAnalysisData.putClusters && parsedAnalysisData.putClusters.length > 0) ||
      !!parsedAnalysisData.analysisSummary);

  const handleExport = () => {
    logDebug('AiOptionsAnalysisDisplay:handleExport', `Attempting to export options analysis as JSON for ${currentTicker}`);
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
    logDebug('AiOptionsAnalysisDisplay:handleCopy', `Attempting to copy options analysis as JSON for ${currentTicker}`);
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


  logDebug('AiOptionsAnalysisDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, errorOrSkippedMessage=${errorOrSkippedMessage}, parsedDataExists=${!!parsedAnalysisData}`);

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
        ) : !parsedAnalysisData || (
            (!parsedAnalysisData.callWalls || parsedAnalysisData.callWalls.length === 0) &&
            (!parsedAnalysisData.putWalls || parsedAnalysisData.putWalls.length === 0) &&
            (!parsedAnalysisData.callClusters || parsedAnalysisData.callClusters.length === 0) &&
            (!parsedAnalysisData.putClusters || parsedAnalysisData.putClusters.length === 0) &&
            !parsedAnalysisData.analysisSummary
        ) ? (
           <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
             No AI Options Analysis data to display.
           </div>
        ) : (
          <>
            {parsedAnalysisData.analysisSummary && (
              <p className="text-sm text-muted-foreground p-2 mb-3 border-l-4 border-blue-500 bg-blue-500/10 dark:bg-blue-500/20">
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
        )}
      </CardContent>
    </Card>
  );
}

