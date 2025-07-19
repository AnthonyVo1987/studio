
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
import { PENDING_STATUS_JSON_VARIANTS } from "@/lib/constants";
import { useQuickExport } from "@/hooks/use-export-actions";
import { useJsonDataStateWithFsm } from "@/hooks/use-json-data-state";

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


export function AiKeyTakeawaysDisplay() {
  const { aiKeyTakeawaysJson, stockSnapshotJson, logDebug, fsmState } = useStockAnalysis();
  const { toast } = useToast();
  const componentName = 'AiKeyTakeawaysDisplay';

  // Use new JSON data state hook with FSM integration
  const { data: parsedTakeawaysData, isLoading, isError, isEmpty } = useJsonDataStateWithFsm<StockAnalysisOutput>(
    aiKeyTakeawaysJson,
    fsmState,
    { 
      enableLogging: process.env.NODE_ENV === 'development',
      validateData: (data) => {
        return data && typeof data === 'object' && 
               data.priceAction && data.trend && data.volatility && 
               data.momentum && data.patterns;
      }
    }
  );

  const [errorOrSkippedMessageState, setErrorOrSkippedMessageState] = useState("AI Key Takeaways not available.");
  const [displayTakeawaysState, setDisplayTakeawaysState] = useState<TakeawayDisplayItem[]>([]);
  
  useEffect(() => {
    if (isEmpty) {
      setErrorOrSkippedMessageState("No AI Key Takeaways to display. Ensure AI TA was successfully processed.");
      setDisplayTakeawaysState([]);
    } else if (isLoading) {
      setErrorOrSkippedMessageState("Loading AI Key Takeaways...");
      setDisplayTakeawaysState([]);
    } else if (isError) {
      // Check for specific error patterns in the JSON
      try {
        const parsedJson = JSON.parse(aiKeyTakeawaysJson);
        if (parsedJson.status === 'skipped') {
          setErrorOrSkippedMessageState(parsedJson.message || "AI Key Takeaways were skipped.");
        } else {
          setErrorOrSkippedMessageState(parsedJson.message || parsedJson.error || "Error loading AI Key Takeaways.");
        }
      } catch {
        setErrorOrSkippedMessageState("Failed to parse AI Key Takeaways data.");
      }
      setDisplayTakeawaysState([]);
    } else if (parsedTakeawaysData) {
      const newDisplayTakeaways = (Object.keys(parsedTakeawaysData) as TakeawayCategory[]).map(key => ({
        categoryKey: key,
        categoryLabel: categoryLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
        sentiment: parsedTakeawaysData[key]?.sentiment || "neutral",
        text: parsedTakeawaysData[key]?.takeaway || "No takeaway generated.",
        textSentimentClass: getSemanticTextColorClass(parsedTakeawaysData[key]?.sentiment, key),
        badgeSentimentClass: getSemanticBadgeClass(parsedTakeawaysData[key]?.sentiment)
      }));
      setDisplayTakeawaysState(newDisplayTakeaways);
      setErrorOrSkippedMessageState("");
    }

    logDebug(componentName, `JSON State Updated: isLoading=${isLoading}, isError=${isError}, displayItemsCount=${displayTakeawaysState.length}`);
  }, [parsedTakeawaysData, isLoading, isError, isEmpty, aiKeyTakeawaysJson, logDebug]);

  const isDataReadyForExport = !isLoading && !isError && parsedTakeawaysData && Object.keys(parsedTakeawaysData).length > 0;
  const currentTicker = getTickerFromSnapshot(stockSnapshotJson);
  
  const exportActions = useQuickExport(
    parsedTakeawaysData || {},
    `${currentTicker}_key_takeaways`,
    "Key Takeaways"
  );

  const handleExport = () => {
    logDebug(componentName, `ExportAction`, `Attempting to export takeaways as JSON for ${currentTicker}`);
    if (!isDataReadyForExport || !parsedTakeawaysData) {
      toast({ variant: "destructive", title: "Export Failed", description: "Key takeaways data not available." });
      return;
    }
    exportActions.download();
  };

  const handleCopy = async () => {
    logDebug(componentName, `CopyAction`, `Attempting to copy takeaways as JSON for ${currentTicker}`);
    if (!isDataReadyForExport || !parsedTakeawaysData) {
      toast({ variant: "destructive", title: "Copy Failed", description: "Key takeaways data not available." });
      return;
    }
    await exportActions.copy();
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
             {errorOrSkippedMessageState}
           </div>
        ) : displayTakeawaysState.length > 0 && parsedTakeawaysData ? (
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
