
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { StockAnalysisOutput } from "@/ai/schemas/stock-analysis-schemas";
import type { StockSnapshotData } from "@/services/data-sources/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { downloadJson, downloadTxt, copyToClipboard } from "@/lib/export-utils";

type TakeawayCategory = keyof StockAnalysisOutput;

interface TakeawayDisplayItem {
  categoryLabel: string;
  categoryKey: TakeawayCategory;
  sentiment: string;
  text: string;
  textSentimentClass: string;
  badgeSentimentClass: string;
}

const getSemanticBadgeClass = (sentiment?: string): string => {
  if (!sentiment) return "bg-muted text-muted-foreground border-border";
  const s = sentiment.toLowerCase();
  if (s.includes('bullish') || s.includes('positive') || s.includes('strong') || s.includes('increasing')) {
    return "bg-positive-muted text-positive-muted-foreground border-positive";
  }
  if (s.includes('bearish') || s.includes('negative') || s.includes('weak') || s.includes('decreasing')) {
    return "bg-destructive text-destructive-foreground border-destructive"; 
  }
  if (s.includes('high') || s.includes('low') || s.includes('moderate')) { 
    return "bg-warning-muted text-warning-muted-foreground border-warning";
  }
  return "bg-muted text-muted-foreground border-border";
};

const getSemanticTextColorClass = (sentiment?: string): string => {
    if (!sentiment) return 'text-muted-foreground';
    const s = sentiment.toLowerCase();
    if (s.includes('bullish') || s.includes('positive') || s.includes('strong') || s.includes('increasing')) return 'text-positive';
    if (s.includes('bearish') || s.includes('negative') || s.includes('weak') || s.includes('decreasing')) return 'text-destructive';
    if (s.includes('high') || s.includes('low') || s.includes('moderate')) return 'text-warning-foreground'; 
    return 'text-muted-foreground';
};


const categoryLabels: Record<TakeawayCategory, string> = {
  priceAction: "Price Action",
  trend: "Trend",
  volatility: "Volatility",
  momentum: "Momentum",
  patterns: "Patterns",
};

const getTickerFromSnapshot = (snapshotJson: string, logDebug: Function): string => {
  try {
    if (snapshotJson && snapshotJson !== '{}' && !snapshotJson.includes('"status":') && !snapshotJson.includes('"error":')) {
      const snapshotData = JSON.parse(snapshotJson) as StockSnapshotData;
      return snapshotData?.ticker?.toUpperCase() || "STOCK";
    }
  } catch (e) {
    logDebug('AiKeyTakeawaysDisplay:getTickerFromSnapshot', "Failed to parse stockSnapshotJson for ticker", e);
  }
  return "STOCK";
};

const generateKeyTakeawaysText = (data: StockAnalysisOutput, ticker: string): string => {
  let text = `AI Key Takeaways for ${ticker}\n\n`;
  for (const key in data) {
    const category = key as TakeawayCategory;
    text += `${categoryLabels[category]}: ${data[category].sentiment}\n`;
    text += `${data[category].takeaway}\n\n`;
  }
  return text.trim();
};

const escapeCsvField = (field: string): string => {
  if (/[",\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
};

const generateKeyTakeawaysCsv = (data: StockAnalysisOutput): string => {
  const headers = "Category,Sentiment,Takeaway\n";
  let csvRows = "";
  for (const key in data) {
    const category = key as TakeawayCategory;
    const sentiment = data[category].sentiment;
    const takeawayText = data[category].takeaway;
    csvRows += `${escapeCsvField(categoryLabels[category])},${escapeCsvField(sentiment)},${escapeCsvField(takeawayText)}\n`;
  }
  return headers + csvRows.trim();
};

const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }'
];

export function AiKeyTakeawaysDisplay() {
  const { aiKeyTakeawaysJson, stockSnapshotJson, logDebug } = useStockAnalysis();
  const { toast } = useToast();
  const jsonString = aiKeyTakeawaysJson;
  const componentName = 'AiKeyTakeawaysDisplay';

  logDebug(componentName, "aiKeyTakeawaysJson (start):", jsonString ? jsonString.substring(0,100) : "null");

  let isLoading = false;
  let isError = false;
  let errorOrSkippedMessage = "AI Key Takeaways not available.";
  let parsedTakeawaysData: StockAnalysisOutput | null = null;
  let displayTakeaways: TakeawayDisplayItem[] = [];
  
  if (!jsonString || jsonString === '{}') {
    isLoading = false;
    isError = true; 
    errorOrSkippedMessage = "No AI Key Takeaways to display. Ensure AI TA was successfully processed.";
    logDebug(componentName, "aiKeyTakeawaysJson is empty or null.");
  } else if (PENDING_STATUS_JSON_VARIANTS.includes(jsonString.trim())) {
    isLoading = true;
    isError = false;
    parsedTakeawaysData = null;
    errorOrSkippedMessage = ""; // Clear any previous error message
    logDebug(componentName, "aiKeyTakeawaysJson is in a defined pending/initializing state.");
  } else if (jsonString.includes('"status": "error"') || jsonString.includes('"status": "skipped"')) {
    isLoading = false;
    isError = true;
    parsedTakeawaysData = null;
    try {
      const statusObj = JSON.parse(jsonString);
      if (statusObj.status === "skipped") {
        errorOrSkippedMessage = statusObj.message || "AI Key Takeaways were skipped.";
      } else {
        errorOrSkippedMessage = statusObj.message || "Error loading AI Key Takeaways.";
      }
      logDebug(componentName, `JSON indicates status: ${statusObj.status}, message: ${errorOrSkippedMessage}`);
    } catch (e) {
      errorOrSkippedMessage = "Failed to parse status message from error/skipped JSON for AI Key Takeaways.";
      logDebug(componentName, "Failed to parse error/skipped status JSON for AI Key Takeaways.", e);
    }
  } else {
    isLoading = false;
    isError = false;
    try {
      const data = JSON.parse(jsonString) as StockAnalysisOutput;
      if (data && typeof data === 'object' && data.priceAction && data.trend && data.volatility && data.momentum && data.patterns) {
        parsedTakeawaysData = data;
        displayTakeaways = (Object.keys(data) as TakeawayCategory[]).map(key => ({
            categoryKey: key,
            categoryLabel: categoryLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
            sentiment: data[key]?.sentiment || "neutral",
            text: data[key]?.takeaway || "No takeaway generated.",
            textSentimentClass: getSemanticTextColorClass(data[key]?.sentiment),
            badgeSentimentClass: getSemanticBadgeClass(data[key]?.sentiment)
        }));
        logDebug(componentName, "Successfully parsed aiKeyTakeawaysJson data.", data);
      } else {
        isError = true;
        errorOrSkippedMessage = "AI Key Takeaways data is malformed or incomplete.";
        parsedTakeawaysData = null;
        logDebug(componentName, "Parsed aiKeyTakeawaysJson data is malformed or missing critical fields.", data);
      }
    } catch (e) {
      isError = true;
      errorOrSkippedMessage = "Failed to parse AI Key Takeaways data.";
      parsedTakeawaysData = null;
      logDebug(componentName, "Error parsing AI Key Takeaways JSON.", e);
    }
  }

  logDebug(componentName, `Render state: isLoading=${isLoading}, isError=${isError}, errorOrSkippedMessage=${errorOrSkippedMessage}, parsedDataExists=${!!parsedTakeawaysData}, displayTakeaways.length=${displayTakeaways.length}`);

  const isDataReadyForExport = !isLoading && !isError && parsedTakeawaysData && Object.keys(parsedTakeawaysData).length > 0;
  const currentTicker = getTickerFromSnapshot(stockSnapshotJson, logDebug);

  const handleExport = (format: 'json' | 'text' | 'csv') => {
    logDebug(componentName, `Attempting to export takeaways as ${format} for ${currentTicker}`);
    if (!isDataReadyForExport || !parsedTakeawaysData) {
      toast({ variant: "destructive", title: "Export Failed", description: "Key takeaways data not available." });
      return;
    }
    try {
      let filename = `${currentTicker}_key_takeaways`;
      if (format === 'json') {
        downloadJson(parsedTakeawaysData, `${filename}.json`);
        toast({ title: "Exported as JSON", description: "Key takeaways downloaded." });
      } else if (format === 'text') {
        const textData = generateKeyTakeawaysText(parsedTakeawaysData, currentTicker);
        downloadTxt(textData, `${filename}.txt`);
        toast({ title: "Exported as Text", description: "Key takeaways downloaded." });
      } else if (format === 'csv') {
        const csvData = generateKeyTakeawaysCsv(parsedTakeawaysData);
        downloadTxt(csvData, `${filename}.csv`); 
        toast({ title: "Exported as CSV", description: "Key takeaways downloaded." });
      }
      logDebug(componentName, `Successfully exported as ${format}`);
    } catch (e: any) {
      logDebug(componentName, `Error exporting as ${format}:`, e);
      toast({ variant: "destructive", title: "Export Error", description: `Could not export takeaways: ${e.message}` });
    }
  };

  const handleCopy = async (format: 'json' | 'text' | 'csv') => {
    logDebug(componentName, `Attempting to copy takeaways as ${format} for ${currentTicker}`);
    if (!isDataReadyForExport || !parsedTakeawaysData) {
      toast({ variant: "destructive", title: "Copy Failed", description: "Key takeaways data not available." });
      return;
    }
    let dataToCopy = "";
    let success = false;
    try {
      if (format === 'json') {
        dataToCopy = JSON.stringify(parsedTakeawaysData, null, 2);
      } else if (format === 'text') {
        dataToCopy = generateKeyTakeawaysText(parsedTakeawaysData, currentTicker);
      } else if (format === 'csv') {
        dataToCopy = generateKeyTakeawaysCsv(parsedTakeawaysData);
      }
      success = await copyToClipboard(dataToCopy);
      if (success) {
        toast({ title: `Copied as ${format.toUpperCase()}`, description: "Key takeaways copied to clipboard." });
        logDebug(componentName, `Successfully copied as ${format}`);
      } else {
        throw new Error("Clipboard API failed.");
      }
    } catch (e: any) {
      logDebug(componentName, `Error copying as ${format}:`, e);
      toast({ variant: "destructive", title: "Copy Error", description: `Could not copy takeaways: ${e.message}` });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>AI Key Takeaways</CardTitle>
          <CardDescription>Sentiment-focused insights based on current data analysis.</CardDescription>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!isDataReadyForExport}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCopy('json')}>JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopy('text')}>Text</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopy('csv')}>CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!isDataReadyForExport}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('json')}>JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('text')}>Text</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={`skeleton-takeaway-${index}`} className="p-3 border rounded-md bg-card/60 shadow-sm">
              <div className="flex justify-between items-center mb-1.5">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </div>
          ))
        ) : isError ? (
           <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
             {errorOrSkippedMessage}
           </div>
        ) : displayTakeaways.length > 0 && parsedTakeawaysData ? (
          displayTakeaways.map((takeaway) => (
            <div key={takeaway.categoryKey} className="p-3 border rounded-md bg-card/60 shadow-sm">
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="font-semibold text-md">{takeaway.categoryLabel}</h4>
                <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 text-xs", takeaway.badgeSentimentClass)}>
                  {takeaway.sentiment}
                </Badge>
              </div>
              <p className={cn("text-sm", takeaway.textSentimentClass)}>{takeaway.text}</p>
            </div>
          ))
        ) : (
           <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
             No AI Key Takeaways data to display.
           </div>
        )}
      </CardContent>
    </Card>
  );
}
