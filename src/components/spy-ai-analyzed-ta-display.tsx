"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain } from "lucide-react";

// SPY Context
import { useSpyAnalysis } from "@/contexts/spy-analysis-context";
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

const renderLevelRow = (item: SupportResistanceItem, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-spy-ai-ta-${index}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for SPY AI technical analysis...
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

export function SpyAiAnalyzedTaDisplay() {
  const spyState = useSpyAnalysis();

  // Parse AI analyzed TA data directly from SPY context
  const aiTaData = spyState.aiAnalyzedTaJson ? (() => {
    try {
      const parsed = JSON.parse(spyState.aiAnalyzedTaJson);
      if (parsed && typeof parsed === 'object') {
        return {
          technicalAnalysis: parsed,
          isDataReady: spyState.dataRetrievalComplete
        };
      }
    } catch (e) {
      // Error parsing TA data - will return null below
    }
    return { technicalAnalysis: null, isDataReady: false };
  })() : { technicalAnalysis: null, isDataReady: false };

  // Derive loading state from FSM state and data availability
  const isLoading = spyState.status === 'loading' || !spyState.dataRetrievalComplete;

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
          SPY AI Technical Analysis
        </CardTitle>
        <CardDescription>
          AI-calculated support, resistance, and pivot levels for SPY
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
            {isLoading ? (
              Array.from({ length: 7 }).map((_, index) => renderLevelRow({label: "", value: null}, index, true))
            ) : levels.length > 0 ? (
              levels.map((item, index) => renderLevelRow(item, index, false))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  No SPY AI technical analysis data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}