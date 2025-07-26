
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, DollarSign, Hash } from "lucide-react";
import { useStockAnalysis } from "@/contexts/business-logic-context";
import type { StockSnapshotData } from "@/services/data-sources/types";
import { formatCurrency, formatPercentage } from "@/lib/number-utils";
import { cn } from "@/lib/utils";
import { PENDING_STATUS_JSON_VARIANTS } from "@/lib/constants";

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


export function KeyMetricsDisplay() {
  const { stockSnapshotJson } = useStockAnalysis();
  const componentName = 'KeyMetricsDisplay';

  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isErrorState, setIsErrorState] = useState(false);
  const [tickerDisplayState, setTickerDisplayState] = useState("N/A");
  const [currentPriceDisplayState, setCurrentPriceDisplayState] = useState("N/A");
  const [todaysChangePercState, setTodaysChangePercState] = useState<number | null>(null);
  const [dayChangeSentimentState, setDayChangeSentimentState] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  
  useEffect(() => {
    const currentJson = stockSnapshotJson;

    let newIsLoading = true;
    let newIsError = false;
    let newTickerDisplay = "N/A";
    let newCurrentPriceDisplay = "N/A";
    let newTodaysChangePerc: number | null = null;
    let newDayChangeSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let errorMsg = "Snapshot data not available.";

    if (currentJson && currentJson !== '{}') {
      if (PENDING_STATUS_JSON_VARIANTS.includes(currentJson.trim())) {
        newIsLoading = true;
        errorMsg = "Loading key metrics...";
      } else if (currentJson.includes('"error":') || currentJson.includes('"status": "skipped"')) {
        newIsLoading = false;
        newIsError = true;
        errorMsg = "Error loading snapshot data for metrics.";
      } else {
        try {
          const snapshot = JSON.parse(currentJson) as StockSnapshotData;
          if (snapshot && typeof snapshot === 'object' && snapshot.ticker) {
            newIsLoading = false;
            newIsError = false;
            newTickerDisplay = snapshot.ticker || "N/A";
            const price = snapshot.currentPrice ?? snapshot.day?.c;
            newCurrentPriceDisplay = formatCurrency(price, "$", "N/A");
            newTodaysChangePerc = snapshot.todaysChangePerc ?? null;

            if (newTodaysChangePerc !== null) {
              if (newTodaysChangePerc > 0) newDayChangeSentiment = 'bullish';
              else if (newTodaysChangePerc < 0) newDayChangeSentiment = 'bearish';
            }
          } else {
            newIsLoading = false;
            newIsError = true;
            errorMsg = "Snapshot data malformed for metrics.";
          }
        } catch (e) {
          console.error(`[${componentName}] Failed to parse stockSnapshotJson:`, e, "JSON:", currentJson.substring(0,200));
          newIsLoading = false;
          newIsError = true;
          errorMsg = "Failed to parse snapshot data for metrics.";
        }
      }
    } else {
      newIsLoading = false; // No JSON means not loading, just default/empty state
      errorMsg = "No snapshot data available for metrics.";
    }
    
    setIsLoadingState(newIsLoading);
    setIsErrorState(newIsError);
    setTickerDisplayState(newTickerDisplay);
    setCurrentPriceDisplayState(newCurrentPriceDisplay);
    setTodaysChangePercState(newTodaysChangePerc);
    setDayChangeSentimentState(newDayChangeSentiment);

  }, [stockSnapshotJson]);
  
  const displayValueForDayChange = isLoadingState ? "Loading..." : (isErrorState || todaysChangePercState === null ? "N/A" : formatPercentage(todaysChangePercState, "N/A", true, 2));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KeyMetricCard
        label="Ticker"
        value={tickerDisplayState}
        icon={<Hash className="h-4 w-4" />}
        isLoading={isLoadingState}
        sentiment="neutral"
      />
      <KeyMetricCard
        label="Current Price"
        value={currentPriceDisplayState}
        icon={<DollarSign className="h-4 w-4" />}
        isLoading={isLoadingState}
        sentiment="neutral"
      />
      <KeyMetricCard
        label="Day's Change"
        value={displayValueForDayChange}
        changePercent={todaysChangePercState}
        isLoading={isLoadingState}
        sentiment={dayChangeSentimentState}
      />
    </div>
  );
}
