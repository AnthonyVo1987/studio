
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
}

const sentimentColorMap: Record<string, string> = {
  bullish: "bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600",
  positive: "bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600",
  strong: "bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600",
  increasing: "bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600",
  bearish: "bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300 border-red-300 dark:border-red-600",
  negative: "bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300 border-red-300 dark:border-red-600",
  weak: "bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300 border-red-300 dark:border-red-600",
  decreasing: "bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300 border-red-300 dark:border-red-600",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300 border-gray-300 dark:border-gray-600",
  moderate: "bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300 border-blue-300 dark:border-blue-600",
  stable: "bg-indigo-100 text-indigo-800 dark:bg-indigo-700/30 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600",
  high: "bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600",
  low: "bg-purple-100 text-purple-800 dark:bg-purple-700/30 dark:text-purple-300 border-purple-300 dark:border-purple-600",
  default: "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300 border-gray-300 dark:border-gray-600",
};

const getTextSentimentColorClass = (detailedSentiment: string): string => {
    const s = detailedSentiment.toLowerCase();
    if (s.includes('bullish') || s.includes('positive') || s.includes('strong') || s.includes('increasing')) return 'text-green-600 dark:text-green-400';
    if (s.includes('bearish') || s.includes('negative') || s.includes('weak') || s.includes('decreasing')) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
};

const getBadgeSentimentClasses = (sentiment?: string): string => {
  if (!sentiment) return sentimentColorMap.default;
  return sentimentColorMap[sentiment.toLowerCase()] || sentimentColorMap.default;
};

const categoryLabels: Record<TakeawayCategory, string> = {
  priceAction: "Price Action",
  trend: "Trend",
  volatility: "Volatility",
  momentum: "Momentum",
  patterns: "Patterns",
};

// Helper function to safely parse JSON and get the ticker
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
  // If the field contains a comma, newline, or double quote, enclose it in double quotes.
  // Also, double up any existing double quotes within the field.
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


export function AiKeyTakeawaysDisplay() {
  const { aiKeyTakeawaysJson, stockSnapshotJson, logDebug } = useStockAnalysis();
  const { toast } = useToast();
  const jsonString = aiKeyTakeawaysJson;

  let isLoading = false;
  let isError = false;
  let parsedTakeawaysData: StockAnalysisOutput | null = null;
  let displayTakeaways: TakeawayDisplayItem[] = [];

  logDebug('AiKeyTakeawaysDisplay', "aiKeyTakeawaysJson (start):", jsonString ? jsonString.substring(0,100) : "null");

  if (jsonString === null || (typeof jsonString === 'string' &&
    (jsonString.includes('"status": "initializing"') ||
     jsonString.includes('"status": "pending"') ||
     jsonString.includes('"status": "full_analysis_pending..."')))) {
    isLoading = true;
  } else if (typeof jsonString === 'string' && jsonString !== '{}') {
    if (jsonString.includes('"status": "error"') || jsonString.includes('"status": "skipped"')) {
      isError = true;
    } else {
      try {
        const data = JSON.parse(jsonString) as StockAnalysisOutput;
        if (data && typeof data === 'object' && !(data as any).error && !(data as any).status && data.priceAction) {
          parsedTakeawaysData = data;
          displayTakeaways = (Object.keys(data) as TakeawayCategory[]).map(key => ({
              categoryKey: key,
              categoryLabel: categoryLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
              sentiment: data[key]?.sentiment || "neutral",
              text: data[key]?.takeaway || "No takeaway generated.",
              textSentimentClass: getTextSentimentColorClass(data[key]?.sentiment || "neutral")
          }));
        } else {
          if (Object.keys(data || {}).length === 0 && !jsonString.includes('"error"')) {
            // No data, not an error
          } else {
            isError = true;
          }
        }
      } catch (e) {
        isError = true;
      }
    }
  }

  logDebug('AiKeyTakeawaysDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, parsedDataExists=${!!parsedTakeawaysData}, displayTakeaways.length=${displayTakeaways.length}`);

  const isDataReadyForExport = !isLoading && !isError && parsedTakeawaysData && Object.keys(parsedTakeawaysData).length > 0;
  const currentTicker = getTickerFromSnapshot(stockSnapshotJson, logDebug);

  const handleExport = (format: 'json' | 'text' | 'csv') => {
    logDebug('AiKeyTakeawaysDisplay:handleExport', `Attempting to export takeaways as ${format} for ${currentTicker}`);
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
      logDebug('AiKeyTakeawaysDisplay:handleExport', `Successfully exported as ${format}`);
    } catch (e: any) {
      logDebug('AiKeyTakeawaysDisplay:handleExport', `Error exporting as ${format}:`, e);
      toast({ variant: "destructive", title: "Export Error", description: `Could not export takeaways: ${e.message}` });
    }
  };

  const handleCopy = async (format: 'json' | 'text' | 'csv') => {
    logDebug('AiKeyTakeawaysDisplay:handleCopy', `Attempting to copy takeaways as ${format} for ${currentTicker}`);
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
        logDebug('AiKeyTakeawaysDisplay:handleCopy', `Successfully copied as ${format}`);
      } else {
        throw new Error("Clipboard API failed.");
      }
    } catch (e: any) {
      logDebug('AiKeyTakeawaysDisplay:handleCopy', `Error copying as ${format}:`, e);
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
             AI Key Takeaways not available.
           </div>
        ) : displayTakeaways.length === 0 ? (
           <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
             No AI Key Takeaways to display. Ensure stock data and AI TA were successfully processed.
           </div>
        ) : (
          displayTakeaways.map((takeaway) => (
            <div key={takeaway.categoryKey} className="p-3 border rounded-md bg-card/60 shadow-sm">
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="font-semibold text-md">{takeaway.categoryLabel}</h4>
                <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 text-xs", getBadgeSentimentClasses(takeaway.sentiment))}>
                  {takeaway.sentiment}
                </Badge>
              </div>
              <p className={cn("text-sm", takeaway.textSentimentClass)}>{takeaway.text}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

    