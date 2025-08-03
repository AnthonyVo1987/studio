"use client";

/**
 * @fileOverview NVDA Staging Key Metrics Display - Enterprise Experimental Component
 * 
 * Staging version of key metrics display with orange/amber theming and staging context consumption.
 * Architecture Pattern: Direct staging context consumption with safe JSON parsing and price change visualization.
 * 
 * REPLICATION PATTERN from baseline component:
 * 1. Adapted from nvda-key-metrics-display.tsx for staging environment
 * 2. Updated imports: useNvdaAnalysis → useNvdaStagingAnalysis
 * 3. Updated component name: NvdaKeyMetricsDisplay → NvdaStagingKeyMetricsDisplay
 * 4. Updated loading text: "NVDA price data" → "NVDA staging price data"
 * 5. Added staging-specific orange/amber card styling and title suffix
 * 
 * STAGING ENHANCEMENTS:
 * - Orange/amber color scheme for staging differentiation
 * - "(Staging)" suffix in component title
 * - Staging context consumption via useNvdaStagingAnalysis()
 * - Derives key metrics from stock snapshot data (identical to baseline)
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// NVDA Staging Context
import { useNvdaStagingAnalysis } from "@/contexts/nvda-staging-analysis-context";

export function NvdaStagingKeyMetricsDisplay() {
  const stagingState = useNvdaStagingAnalysis();

  // Safe JSON parsing pattern following actual Polygon API structure
  // Derive key metrics from stock snapshot data (no separate keyMetricsJson needed)
  const metricsData = stagingState.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(stagingState.stockSnapshotJson);
      return {
        ticker: parsed.ticker || "NVDA",
        currentPrice: parsed.currentPrice?.toString() || "0.00",
        changeAmount: parsed.todaysChange?.toString() || "0.00",
        changePercent: parsed.todaysChangePerc?.toString() || "0.00",
        isDataReady: stagingState.dataRetrievalComplete
      };
    } catch (e) {
      return {
        ticker: "NVDA",
        currentPrice: "Error parsing data",
        changeAmount: "0.00",
        changePercent: "0.00",
        isDataReady: false
      };
    }
  })() : {
    ticker: "NVDA",
    currentPrice: "No data available",
    changeAmount: "0.00",
    changePercent: "0.00",
    isDataReady: false
  };

  // Derive loading state from FSM state and data availability
  const isLoading = stagingState.status === 'loading' || !stagingState.dataRetrievalComplete;

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
    <Card className="border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
        <CardTitle className="text-lg flex items-center justify-between text-orange-900">
          <span className="flex items-center gap-2">
            {getTrendIcon(metricsData.changeAmount)}
            NVDA Key Metrics (Staging)
          </span>
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">{metricsData.ticker}</Badge>
        </CardTitle>
        <CardDescription className="text-orange-700">
          Real-time price and change information for NVDA - Staging Environment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">
              Waiting for NVDA staging price data...
            </div>
          ) : (
            <>
              {/* Current Price */}
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-900">${metricsData.currentPrice}</div>
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
              <Badge variant="outline" className="border-orange-300 text-orange-700">Loading NVDA Staging Data...</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}