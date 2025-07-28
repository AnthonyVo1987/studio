"use client";

/**
 * @fileOverview SPY Market Status Display - Blueprint Component
 * 
 * This component demonstrates the ticker-agnostic pattern used throughout SPY display components.
 * 
 * REPLICATION PATTERN for new ticker display components:
 * 1. Copy this file: spy-market-status-display.tsx → nvda-market-status-display.tsx
 * 2. Update imports: useSpyAnalysis → useNvdaAnalysis
 * 3. Update component name: SpyMarketStatusDisplay → NvdaMarketStatusDisplay
 * 4. Update loading text: "SPY market data" → "NVDA market data"
 * 5. Update card title if needed
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

// SPY Context
import { useSpyAnalysis } from "@/contexts/spy-analysis-context";

interface MarketDetailItem {
  label: string;
  value: string | null;
}

const renderDetailRow = (item: MarketDetailItem, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-spy-market-${index}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for SPY market data...
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

export function SpyMarketStatusDisplay() {
  const spyState = useSpyAnalysis();

  // Safe JSON parsing pattern following actual Polygon API structure
  const marketData = spyState.marketStatusJson ? (() => {
    try {
      const parsed = JSON.parse(spyState.marketStatusJson);
      return {
        status: parsed.market || "Unknown",
        isOpen: parsed.market === "open",
        localDateTime: parsed.serverTime || new Date().toISOString(),
        earlyHours: parsed.earlyHours || false,
        lateHours: parsed.lateHours || false,
        exchanges: parsed.exchanges || {},
        currencies: parsed.currencies || {},
        isDataReady: spyState.dataRetrievalComplete
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
  const isLoading = spyState.status === 'loading' || !spyState.dataRetrievalComplete;

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
          SPY Market Status
        </CardTitle>
        <CardDescription>
          Current market status and trading hours for SPY
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
          </div>

          {/* Market Details Table */}
          <Table>
            <TableBody>
              {marketDetails.map((item, index) => renderDetailRow(item, index, isLoading))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}