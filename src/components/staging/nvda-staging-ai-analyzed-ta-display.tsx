"use client";

/**
 * @fileOverview NVDA Staging AI Analyzed TA Display - Enterprise Experimental Component
 * 
 * Staging version of AI analyzed technical analysis display with orange/amber theming and staging context consumption.
 * Architecture Pattern: Direct staging context consumption with support/resistance levels display.
 * 
 * REPLICATION PATTERN from baseline component:
 * 1. Adapted from nvda-ai-analyzed-ta-display.tsx for staging environment
 * 2. Updated imports: useNvdaAnalysis → useNvdaStagingAnalysis
 * 3. Updated component name: NvdaAiAnalyzedTaDisplay → NvdaStagingAiAnalyzedTaDisplay
 * 4. Updated loading text: "NVDA AI technical analysis" → "NVDA staging AI technical analysis"
 * 5. Added staging-specific orange/amber card styling and title suffix
 * 
 * STAGING ENHANCEMENTS:
 * - Orange/amber color scheme for staging differentiation
 * - "(Staging)" suffix in component title
 * - Staging context consumption via useNvdaStagingAnalysis()
 * - Identical support/resistance levels rendering with color-coded levels
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain } from "lucide-react";

// NVDA Staging Context
import { useNvdaStagingAnalysis } from "@/contexts/nvda-staging-analysis-context";
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
      <TableRow key={`loading-nvda-staging-ai-ta-${index}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for NVDA staging AI technical analysis...
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

export function NvdaStagingAiAnalyzedTaDisplay() {
  const stagingState = useNvdaStagingAnalysis();

  // Parse AI analyzed TA data directly from NVDA staging context
  const aiTaData = stagingState.aiAnalyzedTaJson ? (() => {
    try {
      const parsed = JSON.parse(stagingState.aiAnalyzedTaJson);
      if (parsed && typeof parsed === 'object') {
        return {
          technicalAnalysis: parsed,
          isDataReady: stagingState.dataRetrievalComplete
        };
      }
    } catch (e) {}
    return { technicalAnalysis: null, isDataReady: false };
  })() : { technicalAnalysis: null, isDataReady: false };

  // Derive loading state from FSM state and data availability
  const isLoading = stagingState.status === 'loading' || !stagingState.dataRetrievalComplete;

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
    <Card className="border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
        <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
          <Brain className="h-5 w-5" />
          NVDA AI Technical Analysis (Staging)
        </CardTitle>
        <CardDescription className="text-orange-700">
          AI-calculated support, resistance, and pivot levels for NVDA - Staging Environment
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
                  No NVDA staging AI technical analysis data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}