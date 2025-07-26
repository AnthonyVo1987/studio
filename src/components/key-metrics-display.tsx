
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, DollarSign, Hash } from "lucide-react";
import { useStockAnalysis, BusinessFsmState } from "@/contexts/business-logic-context";
import { formatCurrency, formatPercentage } from "@/lib/number-utils";
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
          <p className="text-sm text-muted-foreground">Waiting for stock data...</p>
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


interface KeyMetricsDisplayProps {
  // No props needed - component auto-updates when business context changes
}

export function KeyMetricsDisplay({}: KeyMetricsDisplayProps) {
  const business = useStockAnalysis();

  // Parse stock snapshot data directly from business context
  const stockData = business.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(business.stockSnapshotJson);
      if (parsed.results && parsed.results[0]) {
        const result = parsed.results[0];
        return {
          ticker: result.ticker || null,
          price: result.value || null,
          changePercent: result.todaysChangePerc || null,
          isDataReady: true
        };
      }
    } catch (e) {}
    return { ticker: null, price: null, changePercent: null, isDataReady: false };
  })() : { ticker: null, price: null, changePercent: null, isDataReady: false };

  // Simple loading state - not FSM dependent
  const isLoading = business.fsmState === BusinessFsmState.LOADING || !stockData.isDataReady;
  
  // Calculate sentiment for day's change
  const dayChangeSentiment: 'bullish' | 'bearish' | 'neutral' = 
    stockData.changePercent && stockData.changePercent > 0 ? 'bullish' :
    stockData.changePercent && stockData.changePercent < 0 ? 'bearish' : 'neutral';

  const displayValueForDayChange = isLoading ? "Loading..." : 
    stockData.changePercent !== null ? formatPercentage(stockData.changePercent, "N/A", true, 2) : "N/A";

  // Component auto-updates when business context changes (v4.0.0.7)
  // No individual refresh needed - data updates via main "Get Stock Data" button

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Key Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <KeyMetricCard
            label="Ticker"
            value={stockData.ticker || "N/A"}
            icon={<Hash className="h-4 w-4" />}
            isLoading={isLoading}
            sentiment="neutral"
          />
          <KeyMetricCard
            label="Current Price"
            value={formatCurrency(stockData.price, "$", "N/A")}
            icon={<DollarSign className="h-4 w-4" />}
            isLoading={isLoading}
            sentiment="neutral"
          />
          <KeyMetricCard
            label="Day's Change"
            value={displayValueForDayChange}
            changePercent={stockData.changePercent}
            isLoading={isLoading}
            sentiment={dayChangeSentiment}
          />
        </div>
      </CardContent>
    </Card>
  );
}
