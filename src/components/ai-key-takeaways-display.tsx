
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { StockAnalysisOutput } from "@/ai/schemas/stock-analysis-schemas";
import type { StockSnapshotData } from "@/services/data-sources/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";

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

const getSemanticTextColorClass = (sentiment?: string, categoryKey?: TakeawayCategory): string => {
    if (!sentiment) return 'text-muted-foreground';
    const s = sentiment.toLowerCase();

    if (categoryKey === 'volatility' && s.includes('moderate')) {
        return 'text-foreground'; 
    }

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

const getTickerFromSnapshot = (snapshotJson: string, logDebugFn: Function, compName: string): string => {
  try {
    if (snapshotJson && snapshotJson !== '{}' && !snapshotJson.includes('"status":') && !snapshotJson.includes('"error":')) {
      const snapshotData = JSON.parse(snapshotJson) as StockSnapshotData;
      return snapshotData?.ticker?.toUpperCase() || "STOCK";
    }
  } catch (e) {
    logDebugFn(compName, "GetTickerError", "Failed to parse stockSnapshotJson for ticker", e);
  }
  return "STOCK";
};

const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "full_analysis_pending..." }',
  '{ "status": "no_analysis_run_yet" }'
];

export function AiKeyTakeawaysDisplay() {
  const { aiKeyTakeawaysJson, stockSnapshotJson, logDebug } = useStockAnalysis();
  const { toast } = useToast();
  const componentName = 'AiKeyTakeawaysDisplay';
  const prevJsonRef = useRef<string | null>(null);

  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isErrorState, setIsErrorState] = useState(false);
  const [errorOrSkippedMessageState, setErrorOrSkippedMessageState] = useState("AI Key Takeaways not available.");
  const [parsedTakeawaysDataState, setParsedTakeawaysDataState] = useState<StockAnalysisOutput | null>(null);
  const [displayTakeawaysState, setDisplayTakeawaysState] = useState<TakeawayDisplayItem[]>([]);
  
  useEffect(() => {
    const currentJson = aiKeyTakeawaysJson;
    if (currentJson !== prevJsonRef.current) {
      logDebug(componentName, "PropsReceived", "aiKeyTakeawaysJson prop changed. New Length:", currentJson?.length);
      prevJsonRef.current = currentJson;
    } else {
      return;
    }

    let newIsLoading = true;
    let newIsError = false;
    let newErrorMsg = "AI Key Takeaways not available.";
    let newParsedData: StockAnalysisOutput | null = null;
    let newDisplayTakeaways: TakeawayDisplayItem[] = [];
  
    if (!currentJson || currentJson === '{}') {
      newIsLoading = false;
      newErrorMsg = "No AI Key Takeaways to display. Ensure AI TA was successfully processed.";
      logDebug(componentName, "StateUpdate:NoData", newErrorMsg);
    } else if (PENDING_STATUS_JSON_VARIANTS.includes(currentJson.trim())) {
      newIsLoading = true;
      newErrorMsg = "Loading AI Key Takeaways...";
      logDebug(componentName, "StateUpdate:Loading", newErrorMsg);
    } else {
      try {
        const parsedJson = JSON.parse(currentJson);
        if (parsedJson.error) { 
          newIsLoading = false;
          newIsError = true;
          newErrorMsg = parsedJson.message || parsedJson.error || "Error loading AI Key Takeaways.";
          logDebug(componentName, "StateUpdate:DataErrorDirect", newErrorMsg);
        } else if (parsedJson.status === 'error' || parsedJson.status === 'skipped') {
          newIsLoading = false;
          newIsError = true;
          if (parsedJson.status === "skipped") {
            newErrorMsg = parsedJson.message || "AI Key Takeaways were skipped.";
          } else { 
            newErrorMsg = parsedJson.message || parsedJson.error || "Error loading AI Key Takeaways.";
          }
          logDebug(componentName, "StateUpdate:DataErrorStatus", `Status: ${parsedJson.status}. Message: ${newErrorMsg}`);
        } else if (parsedJson && typeof parsedJson === 'object' && parsedJson.priceAction && parsedJson.trend && parsedJson.volatility && parsedJson.momentum && parsedJson.patterns) {
          newIsLoading = false;
          newIsError = false;
          newParsedData = parsedJson as StockAnalysisOutput;
          newDisplayTakeaways = (Object.keys(parsedJson) as TakeawayCategory[]).map(key => ({
              categoryKey: key,
              categoryLabel: categoryLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
              sentiment: parsedJson[key]?.sentiment || "neutral",
              text: parsedJson[key]?.takeaway || "No takeaway generated.",
              textSentimentClass: getSemanticTextColorClass(parsedJson[key]?.sentiment, key),
              badgeSentimentClass: getSemanticBadgeClass(parsedJson[key]?.sentiment)
          }));
          newErrorMsg = ""; // Clear error on success
          logDebug(componentName, "DataParsed", "Successfully parsed aiKeyTakeawaysJson. Display items:", newDisplayTakeaways.length);
        } else {
          newIsLoading = false;
          newIsError = true;
          newErrorMsg = "AI Key Takeaways data is malformed or incomplete.";
          logDebug(componentName, "StateUpdate:Malformed", newErrorMsg);
        }
      } catch (e) {
        console.error(`[${componentName}] Failed to parse aiKeyTakeawaysJson:`, e, "JSON:", currentJson.substring(0,200));
        newIsLoading = false;
        newIsError = true;
        newErrorMsg = "Failed to parse AI Key Takeaways data.";
        logDebug(componentName, "StateUpdate:ParseFailed", newErrorMsg, e);
      }
    }

    setIsLoadingState(newIsLoading);
    setIsErrorState(newIsError);
    setErrorOrSkippedMessageState(newErrorMsg);
    setParsedTakeawaysDataState(newParsedData);
    setDisplayTakeawaysState(newDisplayTakeaways);

  }, [aiKeyTakeawaysJson, logDebug]);

  logDebug(componentName, 'RenderState', `isLoading=${isLoadingState}, isError=${isErrorState}, errorMsg='${errorOrSkippedMessageState}', parsedData=${!!parsedTakeawaysDataState}, displayItems=${displayTakeawaysState.length}`);

  const isDataReadyForExport = !isLoadingState && !isErrorState && parsedTakeawaysDataState && Object.keys(parsedTakeawaysDataState).length > 0;
  const currentTicker = getTickerFromSnapshot(stockSnapshotJson, logDebug, componentName);

  const handleExport = () => {
    logDebug(componentName, `ExportAction`, `Attempting to export takeaways as JSON for ${currentTicker}`);
    if (!isDataReadyForExport || !parsedTakeawaysDataState) {
      toast({ variant: "destructive", title: "Export Failed", description: "Key takeaways data not available." });
      return;
    }
    try {
      let filename = `${currentTicker}_key_takeaways.json`;
      downloadJson(parsedTakeawaysDataState, filename);
      toast({ title: "Exported as JSON", description: "Key takeaways downloaded." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Export Error", description: `Could not export takeaways: ${e.message}` });
    }
  };

  const handleCopy = async () => {
    logDebug(componentName, `CopyAction`, `Attempting to copy takeaways as JSON for ${currentTicker}`);
    if (!isDataReadyForExport || !parsedTakeawaysDataState) {
      toast({ variant: "destructive", title: "Copy Failed", description: "Key takeaways data not available." });
      return;
    }
    let dataToCopy = JSON.stringify(parsedTakeawaysDataState, null, 2);
    try {
      const success = await copyToClipboard(dataToCopy);
      if (success) {
        toast({ title: `Copied as JSON`, description: "Key takeaways copied to clipboard." });
      } else {
        throw new Error("Clipboard API failed.");
      }
    } catch (e: any) {
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
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!isDataReadyForExport}>
            <Copy className="mr-2 h-4 w-4" /> Copy JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!isDataReadyForExport}>
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoadingState ? (
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
        ) : isErrorState ? (
           <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
             {errorOrSkippedMessageState}
           </div>
        ) : displayTakeawaysState.length > 0 && parsedTakeawaysDataState ? (
          displayTakeawaysState.map((takeaway) => (
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
             {errorOrSkippedMessageState}
           </div>
        )}
      </CardContent>
    </Card>
  );
}
