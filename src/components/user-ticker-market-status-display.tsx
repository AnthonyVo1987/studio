"use client";

/**
 * @fileOverview User Ticker Market Status Display - Dynamic Ticker Component
 * 
 * This component is ticker-agnostic and works with any ticker symbol from
 * the user-ticker-analysis-context. It displays market status for the 
 * currently selected ticker.
 * 
 * ARCHITECTURE PATTERN:
 * - Direct context consumption via useUserTickerAnalysis hook
 * - Safe JSON parsing with error handling
 * - Loading state derivation from FSM and data flags
 * - Dynamic ticker display with proper fallback handling
 * - Consistent error handling for cases with no ticker set
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

// User Ticker Context
import { useUserTickerAnalysis } from "@/contexts/user-ticker-analysis-context";

interface MarketDetailItem {
  label: string;
  value: string | null;
}

const renderDetailRow = (item: MarketDetailItem, index: number, isLoading: boolean, ticker: string) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-user-ticker-market-${index}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          {ticker ? `Waiting for ${ticker} market data...` : 'Waiting for market data...'}
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow key={item.label}>
      <TableCell className="font-medium w-1/3">{item.label}</TableCell>
      <TableCell>{item.value ?? "N/A"}</TableCell>
    </TableRow>
  );
};

export function UserTickerMarketStatusDisplay() {
  const userTickerState = useUserTickerAnalysis();

  // Get current ticker for display
  const currentTicker = userTickerState.currentTicker || '';
  const displayTicker = currentTicker || 'No Ticker Selected';

  // Safe JSON parsing pattern following actual Polygon API structure
  const marketData = userTickerState.marketStatusJson ? (() => {
    try {
      const parsed = JSON.parse(userTickerState.marketStatusJson);
      return {
        status: parsed.market || "Unknown",
        isOpen: parsed.market === "open",
        localDateTime: parsed.serverTime || new Date().toISOString(),
        earlyHours: parsed.earlyHours || false,
        lateHours: parsed.lateHours || false,
        exchanges: parsed.exchanges || {},
        currencies: parsed.currencies || {},
        isDataReady: userTickerState.dataRetrievalComplete
      };
    } catch (e) {
      return {
        status: "Error parsing market data",
        isOpen: false,
        localDateTime: new Date().toISOString(),
        earlyHours: false,
        lateHours: false,
        exchanges: {},
        currencies: {},
        isDataReady: false
      };
    }
  })() : {
    status: currentTicker ? "No market data available" : "Select a ticker to view market status",
    isOpen: false,
    localDateTime: new Date().toISOString(),
    earlyHours: false,
    lateHours: false,
    exchanges: {},
    currencies: {},
    isDataReady: false
  };

  // Derive loading state from FSM state and data availability
  const isLoading = userTickerState.status === 'loading' || 
                   (currentTicker && userTickerState.isTickerValid && !userTickerState.dataRetrievalComplete);

  const marketDetails: MarketDetailItem[] = [
    { label: "Market Status", value: marketData.status || "Unknown" },
    { label: "Early Hours", value: marketData.earlyHours ? "Yes" : "No" },
    { label: "Late Hours", value: marketData.lateHours ? "Yes" : "No" },
    { label: "Server Time", value: marketData.localDateTime ? new Date(marketData.localDateTime).toLocaleString() : null },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {displayTicker} Market Status
        </CardTitle>
        <CardDescription>
          {currentTicker 
            ? `Current market status and trading hours for ${currentTicker}`
            : "Select a ticker symbol to view market status"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={marketData.isOpen ? "default" : "secondary"}>
              {marketData.isOpen ? "Market Open" : "Market Closed"}
            </Badge>
            {isLoading && (
              <Badge variant="outline">Loading...</Badge>
            )}
            {!currentTicker && (
              <Badge variant="outline">No Ticker</Badge>
            )}
            {currentTicker && !userTickerState.isTickerValid && (
              <Badge variant="destructive">Invalid Ticker</Badge>
            )}
          </div>

          {/* Market Details Table */}
          <Table>
            <TableBody>
              {marketDetails.map((item, index) => renderDetailRow(item, index, isLoading, currentTicker))}
            </TableBody>
          </Table>

          {/* Error State */}
          {userTickerState.tickerValidationError && (
            <div className="text-sm text-destructive">
              {userTickerState.tickerValidationError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}