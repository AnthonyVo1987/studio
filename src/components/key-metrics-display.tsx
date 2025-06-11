
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, DollarSign, Hash } from "lucide-react";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { StockSnapshotData } from "@/services/data-sources/types";
import { formatCurrency, formatToTwoDecimals, formatPercentage } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KeyMetricProps {
  label: string;
  value: string;
  changeAbsolute?: number | null; // For Day's Change absolute value if needed for icon
  changePercent?: number | null; // For Day's Change percentage value for text and icon
  icon?: React.ReactNode;
  isLoading?: boolean;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-green-600 dark:text-green-400';
  if (sentiment === 'bearish') return 'text-red-600 dark:text-red-400';
  return ''; 
};

const getChangeIconColorClass = (changeValue?: number | null): string => {
  if (changeValue === null || changeValue === undefined) return "text-muted-foreground";
  if (changeValue > 0) return "text-green-500 dark:text-green-400";
  if (changeValue < 0) return "text-red-500 dark:text-red-400";
  return "text-muted-foreground";
};

function KeyMetricCard({ label, value, changeAbsolute, changePercent, icon, isLoading, sentiment }: KeyMetricProps) {
  let ChangeIcon = Minus;
  // Use changePercent for icon determination primarily if available, otherwise changeAbsolute
  const changeForIcon = changePercent !== null && changePercent !== undefined ? changePercent : changeAbsolute;
  let changeIconColor = getChangeIconColorClass(changeForIcon);
  
  let formattedChangePercent = "N/A";
  if (changePercent !== null && changePercent !== undefined) {
    if (changePercent > 0) ChangeIcon = TrendingUp;
    else if (changePercent < 0) ChangeIcon = TrendingDown;
    formattedChangePercent = formatPercentage(changePercent, "0.00%", true); // Use formatPercentage for display
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
            {formattedChangePercent}
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
  let todaysChangePerc: number | null = null;
  let isLoading = true;
  let currentPriceSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';

  if (stockSnapshotJson && !stockSnapshotJson.includes('"status":') && !stockSnapshotJson.includes('"error":') && stockSnapshotJson !== '{}') {
    try {
      const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
      if (snapshot && typeof snapshot === 'object' && snapshot.ticker) {
        isLoading = false;
        tickerDisplay = snapshot.ticker || "N/A";
        const price = snapshot.currentPrice ?? snapshot.day?.c;
        currentPriceDisplay = formatCurrency(price, "$", "N/A");
        todaysChangePerc = snapshot.todaysChangePerc ?? null;

        if (todaysChangePerc !== null) {
          if (todaysChangePerc > 0) currentPriceSentiment = 'bullish';
          else if (todaysChangePerc < 0) currentPriceSentiment = 'bearish';
        }
      } else {
        isLoading = false; 
        if (snapshot && snapshot.error) console.error("Snapshot data error:", snapshot.error);
      }
    } catch (e) {
      console.error("Failed to parse stockSnapshotJson in KeyMetricsDisplay:", e);
      isLoading = false;
    }
  } else if (!stockSnapshotJson.includes('"status": "initializing"') && !stockSnapshotJson.includes('"status": "pending"')) {
      isLoading = false; 
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
        sentiment="neutral" 
      />
      <KeyMetricCard
        label="Day's Change"
        value={todaysChangePerc !== null ? formatPercentage(todaysChangePerc, "N/A", true) : "N/A"}
        changePercent={todaysChangePerc} 
        isLoading={isLoading}
        sentiment={currentPriceSentiment} 
      />
    </div>
  );
}
