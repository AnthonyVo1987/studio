"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

interface TechnicalIndicator {
  name: string;
  value: string | null;
  signal: 'bullish' | 'bearish' | 'neutral';
}

const renderIndicatorRow = (indicator: TechnicalIndicator, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-spy-ta-${index}`}>
        <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
          Waiting for SPY technical analysis...
        </TableCell>
      </TableRow>
    );
  }

  const getSignalBadge = (signal: string) => {
    switch (signal) {
      case 'bullish':
        return <Badge variant="default" className="bg-green-500">Bullish</Badge>;
      case 'bearish':
        return <Badge variant="destructive">Bearish</Badge>;
      default:
        return <Badge variant="secondary">Neutral</Badge>;
    }
  };

  return (
    <TableRow key={indicator.name}>
      <TableCell className="font-medium">{indicator.name}</TableCell>
      <TableCell>{indicator.value ?? "N/A"}</TableCell>
      <TableCell>{getSignalBadge(indicator.signal)}</TableCell>
    </TableRow>
  );
};

export function SpyStandardTaDisplay() {
  // Static placeholder data - future task will connect to SPY context
  const taData = {
    rsi: "Data will load here",
    macd: "Data will load here",
    bollinger: "Data will load here",
    sma: "Data will load here",
    ema: "Data will load here",
    isDataReady: false
  };

  const isLoading = true; // Always loading for now since not connected to data

  const technicalIndicators: TechnicalIndicator[] = [
    { name: "RSI (14)", value: taData.rsi, signal: 'neutral' },
    { name: "MACD", value: taData.macd, signal: 'neutral' },
    { name: "Bollinger Bands", value: taData.bollinger, signal: 'neutral' },
    { name: "SMA (20)", value: taData.sma, signal: 'neutral' },
    { name: "EMA (12)", value: taData.ema, signal: 'neutral' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          SPY Technical Analysis
        </CardTitle>
        <CardDescription>
          Standard technical indicators and market signals for SPY
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Technical Indicators Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicator</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Signal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicalIndicators.map((indicator, index) => 
                renderIndicatorRow(indicator, index, isLoading)
              )}
            </TableBody>
          </Table>

          {/* Loading Badge */}
          {isLoading && (
            <div className="flex justify-center">
              <Badge variant="outline">Loading SPY Technical Analysis...</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}