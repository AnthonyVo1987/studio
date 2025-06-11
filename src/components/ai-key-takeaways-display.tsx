
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { StockAnalysisOutput } from "@/ai/schemas/stock-analysis-schemas";
import { Skeleton } from "@/components/ui/skeleton";

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

export function AiKeyTakeawaysDisplay() {
  const { aiKeyTakeawaysJson, logDebug } = useStockAnalysis();
  logDebug('AiKeyTakeawaysDisplay', "aiKeyTakeawaysJson (start):", aiKeyTakeawaysJson ? aiKeyTakeawaysJson.substring(0,100) : "null");

  let isLoading = false;
  let isError = false;
  let displayTakeaways: TakeawayDisplayItem[] = [];

  if (aiKeyTakeawaysJson === null || 
      (typeof aiKeyTakeawaysJson === 'string' && 
        (aiKeyTakeawaysJson.includes('"status": "initializing"') || 
         aiKeyTakeawaysJson.includes('"status": "pending"') || 
         aiKeyTakeawaysJson.includes('"status": "full_analysis_pending..."')
        )
      )
     ) {
    logDebug('AiKeyTakeawaysDisplay', "aiKeyTakeawaysJson is null or explicitly indicates pending/initializing state.");
    isLoading = true;
  } else if (typeof aiKeyTakeawaysJson === 'string' && aiKeyTakeawaysJson !== '{}') {
    if (aiKeyTakeawaysJson.includes('"status": "error"') || aiKeyTakeawaysJson.includes('"status": "skipped"')) {
      logDebug('AiKeyTakeawaysDisplay', "aiKeyTakeawaysJson indicates an error or skipped state.");
      isError = true;
    } else {
      try {
        const data = JSON.parse(aiKeyTakeawaysJson) as StockAnalysisOutput;
        logDebug('AiKeyTakeawaysDisplay', "Successfully parsed aiKeyTakeawaysJson. PriceAction takeaway:", data?.priceAction?.takeaway);
        if (data && typeof data === 'object' && !(data as any).error && !(data as any).status && data.priceAction) {
          displayTakeaways = (Object.keys(data) as TakeawayCategory[]).map(key => ({
              categoryKey: key,
              categoryLabel: categoryLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
              sentiment: data[key]?.sentiment || "neutral",
              text: data[key]?.takeaway || "No takeaway generated.",
              textSentimentClass: getTextSentimentColorClass(data[key]?.sentiment || "neutral")
          }));
        } else {
          logDebug('AiKeyTakeawaysDisplay', "Parsed aiKeyTakeawaysJson is missing priceAction or contains implicit error/status field not caught above. Treating as error or empty.");
          // If it's not a recognized error/skipped string, but also not valid data, it implies an issue or truly empty.
          if (!aiKeyTakeawaysJson.includes('"status":') && Object.keys(data || {}).length === 0) {
            // Valid JSON but empty object, not an error, just no takeaways.
            logDebug('AiKeyTakeawaysDisplay', "Parsed JSON is empty object, no takeaways to display.");
          } else {
            isError = true; // Treat other malformed "success" as error.
          }
        }
      } catch (e) {
        console.error("[AiKeyTakeawaysDisplay] Failed to parse aiKeyTakeawaysJson:", e);
        logDebug('AiKeyTakeawaysDisplay', "Error during aiKeyTakeawaysJson parsing.", e);
        isError = true;
      }
    }
  } else if (!aiKeyTakeawaysJson || aiKeyTakeawaysJson === '{}') {
    // This covers undefined, or explicit '{}' string. If null, caught by the first 'if'.
    logDebug('AiKeyTakeawaysDisplay', "aiKeyTakeawaysJson is effectively empty (undefined or '{}' string), treating as loading.");
    isLoading = true;
  }


  logDebug('AiKeyTakeawaysDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, displayTakeaways.length=${displayTakeaways.length}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Key Takeaways</CardTitle>
        <CardDescription>Sentiment-focused insights based on current data analysis.</CardDescription>
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
        ) : isError || displayTakeaways.length === 0 ? (
           <div className="p-3 text-center text-muted-foreground h-24 flex items-center justify-center">
             {isError ? "AI Key Takeaways not available." : "No AI Key Takeaways to display. Ensure stock data and AI TA were successfully processed."}
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
    