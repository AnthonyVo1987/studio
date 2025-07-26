"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp } from "lucide-react";

interface AiIndicator {
  name: string;
  value: string | null;
  confidence: number;
  trend: 'up' | 'down' | 'sideways';
}

const renderAiIndicatorRow = (indicator: AiIndicator, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-spy-ai-ta-${index}`}>
        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
          Waiting for SPY AI technical analysis...
        </TableCell>
      </TableRow>
    );
  }

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'up':
        return <Badge variant="default" className="bg-green-500">↑ Up</Badge>;
      case 'down':
        return <Badge variant="destructive">↓ Down</Badge>;
      default:
        return <Badge variant="secondary">→ Sideways</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <TableRow key={indicator.name}>
      <TableCell className="font-medium">{indicator.name}</TableCell>
      <TableCell>{indicator.value ?? "N/A"}</TableCell>
      <TableCell className={getConfidenceColor(indicator.confidence)}>
        {indicator.confidence}%
      </TableCell>
      <TableCell>{getTrendBadge(indicator.trend)}</TableCell>
    </TableRow>
  );
};

export function SpyAiAnalyzedTaDisplay() {
  // Static placeholder data - future task will connect to SPY context
  const aiTaData = {
    pivotPoints: "Data will load here",
    supportLevels: "Data will load here",
    resistanceLevels: "Data will load here",
    trendAnalysis: "Data will load here",
    momentum: "Data will load here",
    isDataReady: false
  };

  const isLoading = true; // Always loading for now since not connected to data

  const aiIndicators: AiIndicator[] = [
    { name: "AI Pivot Points", value: aiTaData.pivotPoints, confidence: 0, trend: 'sideways' },
    { name: "Support Levels", value: aiTaData.supportLevels, confidence: 0, trend: 'sideways' },
    { name: "Resistance Levels", value: aiTaData.resistanceLevels, confidence: 0, trend: 'sideways' },
    { name: "Trend Analysis", value: aiTaData.trendAnalysis, confidence: 0, trend: 'sideways' },
    { name: "Momentum", value: aiTaData.momentum, confidence: 0, trend: 'sideways' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5" />
          SPY AI Technical Analysis
        </CardTitle>
        <CardDescription>
          AI-powered technical analysis and market insights for SPY
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* AI Analysis Header */}
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Powered by Gemini AI</span>
          </div>

          {/* AI Technical Indicators Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AI Indicator</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aiIndicators.map((indicator, index) => 
                renderAiIndicatorRow(indicator, index, isLoading)
              )}
            </TableBody>
          </Table>

          {/* Loading Badge */}
          {isLoading && (
            <div className="flex justify-center">
              <Badge variant="outline">Loading SPY AI Analysis...</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}