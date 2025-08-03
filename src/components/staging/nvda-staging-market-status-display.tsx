"use client";

/**
 * @fileOverview NVDA Staging Market Status Display - Enterprise Experimental Component
 * 
 * Staging version of market status display with orange/amber theming and staging context consumption.
 * Architecture Pattern: Direct staging context consumption with safe JSON parsing and staging-specific styling.
 * 
 * REPLICATION PATTERN from baseline component:
 * 1. Adapted from nvda-market-status-display.tsx for staging environment
 * 2. Updated imports: useNvdaAnalysis → useNvdaStagingAnalysis
 * 3. Updated component name: NvdaMarketStatusDisplay → NvdaStagingMarketStatusDisplay
 * 4. Updated loading text: "NVDA market data" → "NVDA staging market data"
 * 5. Added staging-specific orange/amber card styling and title suffix
 * 
 * STAGING ENHANCEMENTS:
 * - Orange/amber color scheme for staging differentiation
 * - "(Staging)" suffix in component title
 * - Staging context consumption via useNvdaStagingAnalysis()
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

// NVDA Staging Context
import { useNvdaStagingAnalysis } from "@/contexts/nvda-staging-analysis-context";

interface MarketDetailItem {
  label: string;
  value: string | null;
}

const renderDetailRow = (item: MarketDetailItem, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-nvda-staging-market-${index}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for NVDA staging market data...
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

export function NvdaStagingMarketStatusDisplay() {
  const stagingState = useNvdaStagingAnalysis();

  // Safe JSON parsing pattern following actual Polygon API structure
  const marketData = stagingState.marketStatusJson ? (() => {
    try {
      const parsed = JSON.parse(stagingState.marketStatusJson);
      return {
        status: parsed.market || "Unknown",
        isOpen: parsed.market === "open",
        localDateTime: parsed.serverTime || new Date().toISOString(),
        earlyHours: parsed.earlyHours || false,
        lateHours: parsed.lateHours || false,
        exchanges: parsed.exchanges || {},
        currencies: parsed.currencies || {},
        isDataReady: stagingState.dataRetrievalComplete
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
  const isLoading = stagingState.status === 'loading' || !stagingState.dataRetrievalComplete;

  const marketDetails: MarketDetailItem[] = [
    { label: "Market Status", value: marketData.status || "Unknown" },
    { label: "Early Hours", value: marketData.earlyHours ? "Yes" : "No" },
    { label: "Late Hours", value: marketData.lateHours ? "Yes" : "No" },
    { label: "Server Time", value: marketData.localDateTime ? new Date(marketData.localDateTime).toLocaleString() : null },
  ];

  return (
    <Card className="border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
        <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
          <Clock className="h-5 w-5" />
          NVDA Market Status (Staging)
        </CardTitle>
        <CardDescription className="text-orange-700">
          Current market status and trading hours for NVDA - Staging Environment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={marketData.isOpen ? "default" : "secondary"} className="bg-orange-100 text-orange-800 border-orange-300">
              {marketData.isOpen ? "Market Open" : "Market Closed"}
            </Badge>
            {isLoading && (
              <Badge variant="outline" className="border-orange-300 text-orange-700">Loading...</Badge>
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