"use client";

/**
 * @fileOverview User Ticker Standard TA Display - Dynamic Ticker Component
 * 
 * This component is ticker-agnostic and works with any ticker symbol from
 * the user-ticker-analysis-context. It displays standard technical analysis
 * data for the currently selected ticker.
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
import { Copy, Download, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// User Ticker Context
import { useUserTickerAnalysis } from "@/contexts/user-ticker-analysis-context";

// Export utilities
import { copyToClipboard } from "@/lib/export-utils";

export function UserTickerStandardTaDisplay() {
  const userTickerState = useUserTickerAnalysis();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get current ticker for display
  const currentTicker = userTickerState.currentTicker || '';
  const displayTicker = currentTicker || 'No Ticker Selected';

  // Safe JSON parsing pattern
  const taData = userTickerState.standardTasJson ? (() => {
    try {
      const parsed = JSON.parse(userTickerState.standardTasJson);
      return {
        raw: parsed,
        isValid: !!parsed && typeof parsed === 'object',
        indicators: parsed.indicators || {},
        summary: parsed.summary || {},
        timestamp: parsed.timestamp || parsed.lastUpdated
      };
    } catch (e) {
      return {
        raw: {},
        isValid: false,
        indicators: {},
        summary: {},
        timestamp: null
      };
    }
  })() : {
    raw: {},
    isValid: false,
    indicators: {},
    summary: {},
    timestamp: null
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
    if (!userTickerState.standardTasJson) {
      toast({
        title: 'No Data Available',
        description: `No standard TA data available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const formattedData = formatJsonData(taData.raw);
    const success = await copyToClipboard(formattedData);
    
    if (success) {
      toast({
        title: 'Copied to Clipboard',
        description: `${displayTicker} standard TA data copied successfully.`,
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
    if (!userTickerState.standardTasJson) {
      toast({
        title: 'No Data Available',
        description: `No standard TA data available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const formattedData = formatJsonData(taData.raw);
    const filename = `${currentTicker || 'unknown'}-standard-ta-${new Date().toISOString().split('T')[0]}.json`;
    
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
      description: `${displayTicker} standard TA data exported as ${filename}.`,
    });
  };

  // Extract key technical indicators for summary
  const extractSummary = () => {
    if (!taData.isValid) return null;

    // Try to extract common TA indicators from various possible structures
    const indicators = taData.indicators || taData.raw;
    const summary = taData.summary || {};

    return {
      rsi: indicators.rsi || indicators.RSI || summary.rsi,
      macd: indicators.macd || indicators.MACD || summary.macd,
      sma: indicators.sma || indicators.SMA || summary.sma,
      ema: indicators.ema || indicators.EMA || summary.ema,
      bollingerBands: indicators.bollingerBands || indicators.bollinger || summary.bollinger,
      volume: indicators.volume || summary.volume,
      trend: summary.trend || indicators.trend,
      signal: summary.signal || indicators.signal
    };
  };

  const summary = extractSummary();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {displayTicker} Standard Technical Analysis
        </CardTitle>
        <CardDescription>
          {currentTicker 
            ? `Technical analysis indicators and signals for ${currentTicker}`
            : "Select a ticker symbol to view technical analysis"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={userTickerState.hasAiTaData ? "default" : "secondary"}>
                {userTickerState.hasAiTaData ? (
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
                disabled={!userTickerState.standardTasJson}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy JSON
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                disabled={!userTickerState.standardTasJson}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Technical Analysis Summary */}
          {summary && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Key Indicators</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {summary.rsi && (
                  <div>
                    <span className="text-muted-foreground">RSI:</span>
                    <span className="ml-2 font-medium">
                      {typeof summary.rsi === 'number' ? summary.rsi.toFixed(2) : summary.rsi}
                    </span>
                  </div>
                )}
                {summary.macd && (
                  <div>
                    <span className="text-muted-foreground">MACD:</span>
                    <span className="ml-2 font-medium">
                      {typeof summary.macd === 'object' 
                        ? `${summary.macd.value?.toFixed(2) || 'N/A'}`
                        : typeof summary.macd === 'number' 
                        ? summary.macd.toFixed(2)
                        : summary.macd
                      }
                    </span>
                  </div>
                )}
                {summary.sma && (
                  <div>
                    <span className="text-muted-foreground">SMA:</span>
                    <span className="ml-2 font-medium">
                      {typeof summary.sma === 'number' ? summary.sma.toFixed(2) : summary.sma}
                    </span>
                  </div>
                )}
                {summary.ema && (
                  <div>
                    <span className="text-muted-foreground">EMA:</span>
                    <span className="ml-2 font-medium">
                      {typeof summary.ema === 'number' ? summary.ema.toFixed(2) : summary.ema}
                    </span>
                  </div>
                )}
                {summary.trend && (
                  <div>
                    <span className="text-muted-foreground">Trend:</span>
                    <span className={`ml-2 font-medium ${
                      summary.trend === 'bullish' ? 'text-green-600' : 
                      summary.trend === 'bearish' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {summary.trend}
                    </span>
                  </div>
                )}
                {summary.signal && (
                  <div>
                    <span className="text-muted-foreground">Signal:</span>
                    <span className={`ml-2 font-medium ${
                      summary.signal === 'buy' ? 'text-green-600' : 
                      summary.signal === 'sell' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {summary.signal}
                    </span>
                  </div>
                )}
              </div>
              {taData.timestamp && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Last updated: {new Date(taData.timestamp).toLocaleString()}
                </div>
              )}
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
                    ? `Loading ${currentTicker} technical analysis data...`
                    : !currentTicker
                    ? 'No ticker selected'
                    : userTickerState.standardTasJson
                    ? formatJsonData(taData.raw)
                    : 'No standard TA data available'
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