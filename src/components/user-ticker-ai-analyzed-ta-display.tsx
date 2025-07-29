"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain } from "lucide-react";

// User Ticker Context
import { useUserTickerAnalysis } from "@/contexts/user-ticker-analysis-context";
import { formatCurrency } from "@/lib/number-utils";

interface SupportResistanceItem {
  label: string;
  value: string | null;
  level?: 'support' | 'resistance' | 'pivot';
}

const getLevelColorClass = (level?: 'support' | 'resistance' | 'pivot'): string => {
  if (level === 'support') return 'text-positive';
  if (level === 'resistance') return 'text-destructive';
  if (level === 'pivot') return 'text-primary';
  return '';
};

const renderLevelRow = (item: SupportResistanceItem, index: number, isLoading: boolean, ticker: string) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-user-ticker-ai-ta-${index}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for {ticker} AI technical analysis...
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow key={item.label}>
      <TableCell className="font-medium">{item.label}</TableCell>
      <TableCell className={`text-right font-semibold ${getLevelColorClass(item.level)}`}>
        {item.value ?? "N/A"}
      </TableCell>
    </TableRow>
  );
};

export function UserTickerAiAnalyzedTaDisplay() {
  const userTickerState = useUserTickerAnalysis();

  // Use the ticker from state
  const ticker = userTickerState.currentTicker || 'TICKER';
  const displayTicker = ticker || 'No Ticker Selected';

  // Parse AI analyzed TA data directly from context
  const aiTaData = userTickerState.aiAnalyzedTaJson ? (() => {
    try {
      const parsed = JSON.parse(userTickerState.aiAnalyzedTaJson);
      if (parsed && typeof parsed === 'object') {
        return {
          technicalAnalysis: parsed,
          isDataReady: userTickerState.dataRetrievalComplete
        };
      }
    } catch (e) {}
    return { technicalAnalysis: null, isDataReady: false };
  })() : { technicalAnalysis: null, isDataReady: false };

  // Derive loading state from FSM state and data availability
  const isLoading = userTickerState.status === 'loading' || 
                   (ticker && userTickerState.isTickerValid && !userTickerState.dataRetrievalComplete);

  // Build levels array if data is ready
  const levels: SupportResistanceItem[] = [];
  
  if (aiTaData.isDataReady && aiTaData.technicalAnalysis) {
    const ta = aiTaData.technicalAnalysis;
    levels.push(
      { label: "Pivot Point", value: formatCurrency(ta.pivotPoint), level: 'pivot' },
      { label: "Support 1", value: formatCurrency(ta.support1), level: 'support' },
      { label: "Support 2", value: formatCurrency(ta.support2), level: 'support' },
      { label: "Support 3", value: formatCurrency(ta.support3), level: 'support' },
      { label: "Resistance 1", value: formatCurrency(ta.resistance1), level: 'resistance' },
      { label: "Resistance 2", value: formatCurrency(ta.resistance2), level: 'resistance' },
      { label: "Resistance 3", value: formatCurrency(ta.resistance3), level: 'resistance' }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5" />
          {displayTicker} AI Technical Analysis
        </CardTitle>
        <CardDescription>
          {ticker && userTickerState.isTickerValid
            ? `AI-calculated support, resistance, and pivot levels for ${ticker}`
            : "Select a valid ticker symbol to view AI technical analysis"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!ticker || !userTickerState.isTickerValid ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  {!ticker ? "No ticker selected" : "Invalid ticker symbol"}
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: 7 }).map((_, index) => renderLevelRow({label: "", value: null}, index, true, ticker))
            ) : levels.length > 0 ? (
              levels.map((item, index) => renderLevelRow(item, index, false, ticker))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  No {ticker} AI technical analysis data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Error State */}
        {userTickerState.tickerValidationError && (
          <div className="text-sm text-destructive text-center mt-4">
            {userTickerState.tickerValidationError}
          </div>
        )}
      </CardContent>
    </Card>
  );
}