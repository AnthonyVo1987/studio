"use client";

/**
 * @fileOverview Base Market Status Display Template
 * 
 * This template demonstrates the ticker-agnostic pattern for display components.
 * It uses the context provided by the factory to display market status data.
 * 
 * ARCHITECTURE PATTERN:
 * - Direct context consumption via custom hook
 * - Safe JSON parsing with error handling
 * - Loading state derivation from FSM and data flags
 * - Consistent error handling and fallback values
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

import type { TickerConfig, TickerContextResult } from '../../types';

interface BaseMarketStatusDisplayProps<T extends TickerConfig> {
  config: T;
  context: TickerContextResult<T>;
}

interface MarketDetailItem {
  label: string;
  value: string | null;
}

const renderDetailRow = (item: MarketDetailItem, index: number, isLoading: boolean, ticker: string) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-${ticker.toLowerCase()}-market-${index}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for {ticker} market data...
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

export function BaseMarketStatusDisplay<T extends TickerConfig>({
  config,
  context,
}: BaseMarketStatusDisplayProps<T>) {
  const state = context.hooks.useState();

  // Safe JSON parsing pattern following actual Polygon API structure
  const marketData = state.marketStatusJson ? (() => {
    try {
      const parsed = JSON.parse(state.marketStatusJson);
      return {
        status: parsed.market || "Unknown",
        isOpen: parsed.market === "open",
        localDateTime: parsed.serverTime || new Date().toISOString(),
        earlyHours: parsed.earlyHours || false,
        lateHours: parsed.lateHours || false,
        exchanges: parsed.exchanges || {},
        currencies: parsed.currencies || {},
        isDataReady: state.dataRetrievalComplete
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
    status: "No market data available",
    isOpen: false,
    localDateTime: new Date().toISOString(),
    earlyHours: false,
    lateHours: false,
    exchanges: {},
    currencies: {},
    isDataReady: false
  };

  // Derive loading state from FSM state and data availability
  const isLoading = state.status === 'loading' || !state.dataRetrievalComplete;

  const marketDetails: MarketDetailItem[] = [
    { label: "Market Status", value: marketData.status || "Unknown" },
    { label: "Early Hours", value: marketData.earlyHours ? "Yes" : "No" },
    { label: "Late Hours", value: marketData.lateHours ? "Yes" : "No" },
    { label: "Server Time", value: marketData.localDateTime ? new Date(marketData.localDateTime).toLocaleString() : null },
  ];

  // Count open exchanges
  const openExchanges = Object.values(marketData.exchanges || {}).filter(
    (exchange: any) => exchange?.status === "open"
  ).length;
  const totalExchanges = Object.keys(marketData.exchanges || {}).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Market Status
        </CardTitle>
        <CardDescription>
          Current market conditions and trading hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Market</span>
            <Badge variant={marketData.isOpen ? "default" : "secondary"}>
              {marketData.isOpen ? "OPEN" : "CLOSED"}
            </Badge>
          </div>
          
          <Table>
            <TableBody>
              {marketDetails.map((item, index) => 
                renderDetailRow(item, index, isLoading, config.ticker)
              )}
              <TableRow>
                <TableCell className="font-medium">Exchanges</TableCell>
                <TableCell>
                  {isLoading ? (
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  ) : (
                    `${openExchanges} / ${totalExchanges} Open`
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}