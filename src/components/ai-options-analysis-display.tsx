
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { AiOptionsAnalysisOutput, WallDetail } from "@/ai/schemas/ai-options-analysis-schemas";
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
  let parsedAnalysisData: AiOptionsAnalysisOutput | null = null;

  if (aiOptionsAnalysisJson === null || (typeof aiOptionsAnalysisJson === 'string' &&
    (aiOptionsAnalysisJson.includes('"status": "initializing"') ||
     aiOptionsAnalysisJson.includes('"status": "pending"') ||
     aiOptionsAnalysisJson.includes('"status": "full_analysis_pending..."')))) {
    isLoading = true;
  } else if (typeof aiOptionsAnalysisJson === 'string' && aiOptionsAnalysisJson !== '{}') {
    if (aiOptionsAnalysisJson.includes('"status": "error"') || aiOptionsAnalysisJson.includes('"status": "skipped"') || aiOptionsAnalysisJson.includes('"error":')) { // Check for top-level error string in JSON
      isError = true;
       try {
        const tempError = JSON.parse(aiOptionsAnalysisJson);
        if (tempError.error) {
            logDebug('AiOptionsAnalysisDisplay', 'Error status from JSON string or parsed error field:', tempError.error);
        } else {
            logDebug('AiOptionsAnalysisDisplay', 'Error/skipped status from JSON string.');
        }
      } catch (e) { /* Ignore if not valid JSON */ }
    } else {
      try {
        const data = JSON.parse(aiOptionsAnalysisJson) as AiOptionsAnalysisOutput;
        if (data && typeof data === 'object' && data.callWalls !== undefined && data.putWalls !== undefined) {
            // Even if walls are empty, it's a valid analysis if analysisSummary is present
            parsedAnalysisData = data;
        } else {
          isError = true;
          logDebug('AiOptionsAnalysisDisplay', 'Parsed data missing expected fields (callWalls/putWalls).');
        }
      } catch (e) {
        isError = true;
        logDebug('AiOptionsAnalysisDisplay', 'Error parsing AI Options Analysis JSON:', e);
      }
    }
  }

  const currentTicker = getTickerFromSnapshot(stockSnapshotJson, logDebug);
  const isDataReadyForExport = !isLoading && !isError && parsedAnalysisData && (parsedAnalysisData.callWalls.length > 0 || parsedAnalysisData.putWalls.length > 0 || !!parsedAnalysisData.analysisSummary);

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
  
  const renderWallTable = (walls: WallDetail[], type: 'Call' | 'Put') => {
    if (walls.length === 0) {
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

  logDebug('AiOptionsAnalysisDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, parsedDataExists=${!!parsedAnalysisData}`);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>AI Analyzed Options Chain</CardTitle>
          <CardDescription>Key levels identified from options data analysis. Further analyses can be added.</CardDescription>
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
             AI Options Analysis data not available or an error occurred.
           </div>
        ) : !parsedAnalysisData || (!parsedAnalysisData.callWalls.length && !parsedAnalysisData.putWalls.length && !parsedAnalysisData.analysisSummary) ? (
           <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
             No AI Options Analysis data to display. Ensure options chain was successfully processed by AI.
           </div>
        ) : (
          <>
            {parsedAnalysisData.analysisSummary && (
              <p className="text-sm text-muted-foreground p-2 mb-3 border-l-4 border-blue-500 bg-blue-500/10 dark:bg-blue-500/20">
                <strong>AI Note:</strong> {parsedAnalysisData.analysisSummary}
              </p>
            )}
            <Accordion type="multiple" defaultValue={["call-walls", "put-walls"]} className="w-full">
              <AccordionItem value="call-walls">
                <AccordionTrigger className="text-md font-semibold">Identified Call Walls ({parsedAnalysisData.callWalls.length})</AccordionTrigger>
                <AccordionContent>
                  {renderWallTable(parsedAnalysisData.callWalls, 'Call')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="put-walls">
                <AccordionTrigger className="text-md font-semibold">Identified Put Walls ({parsedAnalysisData.putWalls.length})</AccordionTrigger>
                <AccordionContent>
                  {renderWallTable(parsedAnalysisData.putWalls, 'Put')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </CardContent>
    </Card>
  );
}
