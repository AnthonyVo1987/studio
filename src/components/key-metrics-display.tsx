
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, DollarSign, Hash } from "lucide-react"; // Added DollarSign and Hash
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { StockSnapshotData } from "@/services/data-sources/types";
import { formatCurrency, formatToTwoDecimals } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

interface KeyMetricProps {
  label: string;
  value: string;
  change?: number | null; // Allow null for change
  icon?: React.ReactNode;
  isLoading?: boolean;
}

function KeyMetricCard({ label, value, change, icon, isLoading }: KeyMetricProps) {
  let ChangeIcon = Minus;
  let changeColor = "text-muted-foreground";
  let formattedChange = "N/A";

  if (change !== null && change !== undefined) {
    if (change > 0) {
      ChangeIcon = TrendingUp;
      changeColor = "text-green-500 dark:text-green-400";
      formattedChange = `+${formatToTwoDecimals(change, "0.00")}%`;
    } else if (change < 0) {
      ChangeIcon = TrendingDown;
      changeColor = "text-red-500 dark:text-red-400";
      formattedChange = `${formatToTwoDecimals(change, "0.00")}%`;
    } else { // change is 0
      formattedChange = `${formatToTwoDecimals(change, "0.00")}%`;
    }
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
        <div className="text-2xl font-bold">{value}</div>
        {label === "Day's Change" && ( // Only show change details for "Day's Change" card
          <p className={`text-xs ${changeColor} flex items-center`}>
            <ChangeIcon className="mr-1 h-4 w-4" />
            {formattedChange}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function KeyMetricsDisplay() {
  const { stockSnapshotJson, aiCalculatedTaJson } = useStockAnalysis(); // aiCalculatedTaJson indicates data loading is complete or errored

  let tickerDisplay = "N/A";
  let currentPriceDisplay = "N/A";
  let todaysChangePercDisplay: number | null = null; // Use number or null
  let isLoading = true; // Assume loading initially

  if (stockSnapshotJson && stockSnapshotJson !== '{ "status": "initializing..." }' && stockSnapshotJson !== '{ "status": "pending..." }') {
    try {
      const snapshot = JSON.parse(stockSnapshotJson) as StockSnapshotData;
      
      // Check if data has been fetched by looking at a specific field or if an error occurred
      // A simple way is to see if aiCalculatedTaJson also indicates completion or an error state,
      // implying the sequence has run.
      const isDataActuallyLoaded = aiCalculatedTaJson !== '{ "status": "initializing..." }' && aiCalculatedTaJson !== '{ "status": "pending..." }';

      if (snapshot && typeof snapshot === 'object' && !snapshot.error && isDataActuallyLoaded) {
        isLoading = false;
        tickerDisplay = snapshot.ticker || "N/A";
        // Use the convenient currentPrice if available, else fallback to day's close
        const price = snapshot.currentPrice ?? snapshot.day?.c;
        currentPriceDisplay = formatCurrency(price, "$", "N/A");
        todaysChangePercDisplay = snapshot.todaysChangePerc ?? null;
      } else if (snapshot.error || !isDataActuallyLoaded) {
        // Data fetch might have failed or is still in progress in the sequence
        isLoading = !isDataActuallyLoaded; // Still loading if AI TA isn't settled
        tickerDisplay = "N/A";
        currentPriceDisplay = "N/A";
        todaysChangePercDisplay = null;
         if (snapshot.error) isLoading = false; // If error, stop loading
      }
    } catch (e) {
      console.error("Failed to parse stockSnapshotJson in KeyMetricsDisplay:", e);
      isLoading = false; // Stop loading on parse error
      // Values remain "N/A"
    }
  } else if (aiCalculatedTaJson !== '{ "status": "initializing..." }' && aiCalculatedTaJson !== '{ "status": "pending..." }'){
      // This means stockSnapshotJson was empty/initial but AI TA is done (or skipped/errored)
      // which implies data fetching process has completed (possibly with error for snapshot)
      isLoading = false;
  }


  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KeyMetricCard
        label="Ticker"
        value={tickerDisplay}
        icon={<Hash className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <KeyMetricCard
        label="Current Price"
        value={currentPriceDisplay}
        icon={<DollarSign className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <KeyMetricCard
        label="Day's Change"
        // Pass the raw percentage; KeyMetricCard will format it including the % sign
        value={todaysChangePercDisplay !== null ? `${todaysChangePercDisplay > 0 ? "+" : ""}${formatToTwoDecimals(todaysChangePercDisplay, "0.00")}%` : "N/A"}
        change={todaysChangePercDisplay}
        isLoading={isLoading}
      />
    </div>
  );
}
