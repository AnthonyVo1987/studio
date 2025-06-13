
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, DollarSign, Hash } from "lucide-react";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { StockSnapshotData } from "@/services/data-sources/types";
import { formatCurrency, formatPercentage } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KeyMetricProps {
  label: string;
  value: string;
  changeAbsolute?: number | null;
  changePercent?: number | null;
  icon?: React.ReactNode;
  isLoading?: boolean;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

const getSentimentColorClass = (sentiment?: 'bullish' | 'bearish' | 'neutral'): string => {
  if (sentiment === 'bullish') return 'text-positive'; 
  if (sentiment === 'bearish') return 'text-destructive'; 
  return '';
};

const getChangeIconColorClass = (changeValue?: number | null): string => {
  if (changeValue === null || changeValue === undefined) return "text-muted-foreground";
  if (changeValue > 0) return "text-positive"; 
  if (changeValue < 0) return "text-destructive"; 
  return "text-muted-foreground";
};

function KeyMetricCard({ label, value, changeAbsolute, changePercent, icon, isLoading, sentiment }: KeyMetricProps) {
  let ChangeIcon = Minus;
  const changeForIcon = changePercent !== null && changePercent !== undefined ? changePercent : changeAbsolute;
  let changeIconColor = getChangeIconColorClass(changeForIcon);

  let formattedChangePercent = "N/A";
  if (changePercent !== null && changePercent !== undefined) {
    if (changePercent > 0) ChangeIcon = TrendingUp;
    else if (changePercent < 0) ChangeIcon = TrendingDown;
    formattedChangePercent = formatPercentage(changePercent, "N/A", true, 2);
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
        <div className={cn("text-2xl font-bold", label === "Day's Change" ? getSentimentColorClass(sentiment) : "")}>{value}</div>
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
  const { stockSnapshotJson, logDebug } = useStockAnalysis();
  logDebug('KeyMetricsDisplay', "stockSnapshotJson (start):", stockSnapshotJson.substring(0,100));

  let tickerDisplay = "N/A";
  let currentPriceDisplay = "N/A";
  let todaysChangePerc: number | null = null;
  let isLoading = true;
  let isError = false;
  let dayChangeSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';

  if (stockSnapshotJson && stockSnapshotJson !== '{}') {
    if (stockSnapshotJson.includes('"status": "initializing"') || stockSnapshotJson.includes('"status": "pending"') || stockSnapshotJson.includes('"status": "full_analysis_pending..."')) {
      logDebug('KeyMetricsDisplay', "stockSnapshotJson is in pending/initializing state.");
      isLoading = true;
    } else if (stockSnapshotJson.includes('"error":') || stockSnapshotJson.includes('"status": "skipped"')) {
      logDebug('KeyMetricsDisplay', "stockSnapshotJson indicates an error or skipped state. Displaying N/A.");
      isLoading = false;
      isError = true;
    } else {
      try {
        const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
        logDebug('KeyMetricsDisplay', "Successfully parsed stockSnapshotJson. Ticker:", snapshot?.ticker);
        if (snapshot && typeof snapshot === 'object' && snapshot.ticker) {
          isLoading = false;
          isError = false;
          tickerDisplay = snapshot.ticker || "N/A";
          const price = snapshot.currentPrice ?? snapshot.day?.c;
          currentPriceDisplay = formatCurrency(price, "$", "N/A");
          todaysChangePerc = snapshot.todaysChangePerc ?? null;

          if (todaysChangePerc !== null) {
            if (todaysChangePerc > 0) dayChangeSentiment = 'bullish';
            else if (todaysChangePerc < 0) dayChangeSentiment = 'bearish';
          }
        } else {
          logDebug('KeyMetricsDisplay', "Parsed stockSnapshotJson is missing ticker or not an object. Displaying N/A.");
          isLoading = false;
          isError = true;
        }
      } catch (e) {
        console.error("[KeyMetricsDisplay] Failed to parse stockSnapshotJson:", e);
        logDebug('KeyMetricsDisplay', "Error during stockSnapshotJson parsing. Displaying N/A.", e);
        isLoading = false;
        isError = true;
      }
    }
  } else {
    logDebug('KeyMetricsDisplay', "stockSnapshotJson is empty or null. Displaying N/A initially.");
    isLoading = false; // No data to load, not an error yet, just empty.
  }

  if (isError && !isLoading) { // Ensure N/A if error after loading attempt.
      tickerDisplay = "N/A";
      currentPriceDisplay = "N/A";
      logDebug('KeyMetricsDisplay', 'Setting display to N/A due to error state.');
  }

  logDebug('KeyMetricsDisplay', `Render state: isLoading=${isLoading}, isError=${isError}, ticker=${tickerDisplay}, price=${currentPriceDisplay}, changePerc=${todaysChangePerc}`);

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
        value={isLoading ? "Loading..." : (isError || todaysChangePerc === null ? "N/A" : formatPercentage(todaysChangePerc, "N/A", true, 2))}
        changePercent={todaysChangePerc}
        isLoading={isLoading}
        sentiment={dayChangeSentiment}
      />
    </div>
  );
}

