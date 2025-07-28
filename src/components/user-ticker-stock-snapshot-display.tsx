"use client";

/**
 * @fileOverview User Ticker Stock Snapshot Display - Dynamic Ticker Component
 * 
 * This component is ticker-agnostic and works with any ticker symbol from
 * the user-ticker-analysis-context. It displays stock snapshot data for
 * the currently selected ticker.
 * 
 * ARCHITECTURE PATTERN:
 * - Direct context consumption via useUserTickerAnalysis hook
 * - Safe JSON parsing with error handling
 * - Loading state derivation from FSM and data flags
 * - Dynamic ticker display with proper fallback handling
 * - Consistent error handling for cases with no ticker set
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, BarChart3, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// User Ticker Context
import { useUserTickerAnalysis } from "@/contexts/user-ticker-analysis-context";

// Export utilities
import { copyToClipboard } from "@/lib/export-utils";

export function UserTickerStockSnapshotDisplay() {
  const userTickerState = useUserTickerAnalysis();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get current ticker for display
  const currentTicker = userTickerState.currentTicker || '';
  const displayTicker = currentTicker || 'No Ticker Selected';

  // Safe JSON parsing pattern
  const stockData = userTickerState.stockSnapshotJson ? (() => {
    try {
      const parsed = JSON.parse(userTickerState.stockSnapshotJson);
      return {
        raw: parsed,
        result: parsed.results?.[0] || {},
        isValid: !!parsed.results?.[0],
        ticker: parsed.results?.[0]?.ticker || currentTicker
      };
    } catch (e) {
      return {
        raw: {},
        result: {},
        isValid: false,
        ticker: currentTicker
      };
    }
  })() : {
    raw: {},
    result: {},
    isValid: false,
    ticker: currentTicker
  };

  // Derive loading state from FSM state and data availability
  const isLoading = userTickerState.status === 'loading' || 
                   (currentTicker && userTickerState.isTickerValid && !userTickerState.dataRetrievalComplete);

  // Format JSON for display
  const formatJsonData = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return 'Invalid JSON data';
    }
  };

  // Copy handler
  const handleCopy = async () => {
    if (!userTickerState.stockSnapshotJson) {
      toast({
        title: 'No Data Available',
        description: `No stock snapshot data available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const formattedData = formatJsonData(stockData.raw);
    const success = await copyToClipboard(formattedData);
    
    if (success) {
      toast({
        title: 'Copied to Clipboard',
        description: `${displayTicker} stock snapshot data copied successfully.`,
      });
    } else {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy data to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Export handler
  const handleExport = () => {
    if (!userTickerState.stockSnapshotJson) {
      toast({
        title: 'No Data Available',
        description: `No stock snapshot data available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const formattedData = formatJsonData(stockData.raw);
    const filename = `${currentTicker || 'unknown'}-stock-snapshot-${new Date().toISOString().split('T')[0]}.json`;
    
    // Create download link
    const blob = new Blob([formattedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: `${displayTicker} stock snapshot data exported as ${filename}.`,
    });
  };

  // Extract key information for summary
  const summary = stockData.isValid ? {
    price: stockData.result.value || stockData.result.price,
    change: stockData.result.change,
    changePercent: stockData.result.changePercent,
    volume: stockData.result.day?.volume || stockData.result.volume,
    timestamp: stockData.result.updated || stockData.result.timestamp
  } : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {displayTicker} Stock Snapshot
        </CardTitle>
        <CardDescription>
          {currentTicker 
            ? `Raw stock snapshot data from Polygon.io API for ${currentTicker}`
            : "Select a ticker symbol to view stock snapshot data"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={userTickerState.hasStockData ? "default" : "secondary"}>
                {userTickerState.hasStockData ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" />Data Available</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" />No Data</>
                )}
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
            
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                disabled={!userTickerState.stockSnapshotJson}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy JSON
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                disabled={!userTickerState.stockSnapshotJson}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Summary Information */}
          {summary && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Quick Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <span className="ml-2 font-medium">
                    {summary.price ? `$${Number(summary.price).toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Change:</span>
                  <span className={`ml-2 font-medium ${
                    summary.change && summary.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary.change ? `${summary.change >= 0 ? '+' : ''}${summary.change.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Change %:</span>
                  <span className={`ml-2 font-medium ${
                    summary.changePercent && summary.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary.changePercent ? `${summary.changePercent.toFixed(2)}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Volume:</span>
                  <span className="ml-2">{summary.volume ? summary.volume.toLocaleString() : 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="ml-2">
                    {summary.timestamp ? new Date(summary.timestamp).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* JSON Data Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Raw JSON Data</h4>
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>
            
            <div className="border rounded-lg">
              <pre className={`p-4 text-sm overflow-auto bg-muted/50 ${
                isExpanded ? 'max-h-none' : 'max-h-48'
              }`}>
                <code>
                  {isLoading && currentTicker
                    ? `Loading ${currentTicker} stock snapshot data...`
                    : !currentTicker
                    ? 'No ticker selected'
                    : userTickerState.stockSnapshotJson
                    ? formatJsonData(stockData.raw)
                    : 'No stock snapshot data available'
                  }
                </code>
              </pre>
            </div>
          </div>

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