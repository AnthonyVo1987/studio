"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// SPY Context
import { useSpyAnalysis } from "@/contexts/spy-analysis-context";

export function SpyKeyMetricsDisplay() {
  const spyState = useSpyAnalysis();

  // Safe JSON parsing pattern following actual Polygon API structure
  // Derive key metrics from stock snapshot data (no separate keyMetricsJson needed)
  const metricsData = spyState.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(spyState.stockSnapshotJson);
      return {
        ticker: parsed.ticker || "SPY",
        currentPrice: parsed.currentPrice?.toString() || "0.00",
        changeAmount: parsed.todaysChange?.toString() || "0.00",
        changePercent: parsed.todaysChangePerc?.toString() || "0.00",
        isDataReady: spyState.dataRetrievalComplete
      };
    } catch (e) {
      return {
        ticker: "SPY",
        currentPrice: "Error parsing data",
        changeAmount: "0.00",
        changePercent: "0.00",
        isDataReady: false
      };
    }
  })() : {
    ticker: "SPY",
    currentPrice: "No data available",
    changeAmount: "0.00",
    changePercent: "0.00",
    isDataReady: false
  };

  // Derive loading state from FSM state and data availability
  const isLoading = spyState.status === 'loading' || !spyState.dataRetrievalComplete;

  const getTrendIcon = (changeAmount: string) => {
    const change = parseFloat(changeAmount);
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (changeAmount: string) => {
    const change = parseFloat(changeAmount);
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getTrendIcon(metricsData.changeAmount)}
            SPY Key Metrics
          </span>
          <Badge variant="outline">{metricsData.ticker}</Badge>
        </CardTitle>
        <CardDescription>
          Real-time price and change information for SPY
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">
              Waiting for SPY price data...
            </div>
          ) : (
            <>
              {/* Current Price */}
              <div className="text-center">
                <div className="text-3xl font-bold">${metricsData.currentPrice}</div>
                <div className="text-sm text-muted-foreground">Current Price</div>
              </div>

              {/* Change Information */}
              <div className={`text-center ${getTrendColor(metricsData.changeAmount)}`}>
                <div className="flex items-center justify-center gap-1">
                  {getTrendIcon(metricsData.changeAmount)}
                  <span className="text-lg font-semibold">
                    ${metricsData.changeAmount} ({metricsData.changePercent}%)
                  </span>
                </div>
                <div className="text-sm">Today's Change</div>
              </div>
            </>
          )}

          {/* Loading Badge */}
          {isLoading && (
            <div className="flex justify-center">
              <Badge variant="outline">Loading SPY Data...</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}