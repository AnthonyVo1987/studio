
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, DollarSign, Hash } from "lucide-react";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { StockSnapshotData } from "@/services/data-sources/types";
import { formatCurrency, formatToTwoDecimals } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KeyMetricProps {
  label: string;
  value: string;
  change?: number | null;
  icon?: React.ReactNode;
  isLoading?: boolean;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-green-600 dark:text-green-400';
  if (sentiment === 'bearish') return 'text-red-600 dark:text-red-400';
  return ''; // Default theme color for text
};

const getChangeIconColorClass = (change?: number | null): string => {
  if (change === null || change === undefined) return "text-muted-foreground";
  if (change > 0) return "text-green-500 dark:text-green-400";
  if (change < 0) return "text-red-500 dark:text-red-400";
  return "text-muted-foreground";
}

function KeyMetricCard({ label, value, change, icon, isLoading, sentiment }: KeyMetricProps) {
  let ChangeIcon = Minus;
  let changeIconColor = getChangeIconColorClass(change);
  let formattedChange = "N/A";

  if (change !== null && change !== undefined) {
    if (change > 0) ChangeIcon = TrendingUp;
    else if (change < 0) ChangeIcon = TrendingDown;
    formattedChange = `${change > 0 ? "+" : ""}${formatToTwoDecimals(change, "0.00")}%`;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4 mb-1" />
          {label === "Day's Change" && <Skeleton className="h-4 w-1/2" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", getSentimentColorClass(sentiment))}>{value}</div>
        {label === "Day's Change" && (
          <p className={cn("text-xs flex items-center", getSentimentColorClass(sentiment))}>
            <ChangeIcon className={cn("mr-1 h-4 w-4", changeIconColor)} />
            {formattedChange}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function KeyMetricsDisplay() {
  const { stockSnapshotJson } = useStockAnalysis(); 

  let tickerDisplay = "N/A";
  let currentPriceDisplay = "N/A";
  let todaysChangePercDisplay: number | null = null;
  let isLoading = true;
  let currentPriceSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';

  if (stockSnapshotJson && !stockSnapshotJson.includes('"status":') && !stockSnapshotJson.includes('"error":')) {
    try {
      const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
      if (snapshot && typeof snapshot === 'object' && snapshot.ticker) {
        isLoading = false;
        tickerDisplay = snapshot.ticker || "N/A";
        const price = snapshot.currentPrice ?? snapshot.day?.c;
        currentPriceDisplay = formatCurrency(price, "$", "N/A");
        todaysChangePercDisplay = snapshot.todaysChangePerc ?? null;

        if (todaysChangePercDisplay !== null) {
          if (todaysChangePercDisplay > 0) currentPriceSentiment = 'bullish';
          else if (todaysChangePercDisplay < 0) currentPriceSentiment = 'bearish';
        }
      } else {
        isLoading = false; // Parsed, but no valid data structure
        if (snapshot && snapshot.error) console.error("Snapshot data error:", snapshot.error);
      }
    } catch (e) {
      console.error("Failed to parse stockSnapshotJson in KeyMetricsDisplay:", e);
      isLoading = false;
    }
  } else if (!stockSnapshotJson.includes('"status": "initializing"') && !stockSnapshotJson.includes('"status": "pending"')) {
      isLoading = false; // Not initializing or pending, so assume loaded (even if empty or error)
  }


  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KeyMetricCard
        label="Ticker"
        value={tickerDisplay}
        icon={<Hash className="h-4 w-4" />}
        isLoading={isLoading}
        sentiment="neutral"
      />
      <KeyMetricCard
        label="Current Price"
        value={currentPriceDisplay}
        icon={<DollarSign className="h-4 w-4" />}
        isLoading={isLoading}
        sentiment="neutral" // Current price itself is neutral, change reflects sentiment
      />
      <KeyMetricCard
        label="Day's Change"
        value={todaysChangePercDisplay !== null ? `${todaysChangePercDisplay > 0 ? "+" : ""}${formatToTwoDecimals(todaysChangePercDisplay, "0.00")}%` : "N/A"}
        change={todaysChangePercDisplay} // Pass raw percentage for icon logic
        isLoading={isLoading}
        sentiment={currentPriceSentiment} // Apply sentiment to the value itself
      />
    </div>
  );
}
