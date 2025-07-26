"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { useStockAnalysis, BusinessFsmState } from "@/contexts/business-logic-context";
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
      <TableRow key={`loading-ta-${index}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for AI technical analysis...
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

interface AiAnalyzedTaDisplayProps {
  onRefresh?: () => void;
}

export function AiAnalyzedTaDisplay({ onRefresh }: AiAnalyzedTaDisplayProps) {
  const business = useStockAnalysis();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Parse AI analyzed TA data directly from business context
  const aiTaData = business.aiAnalyzedTaJson ? (() => {
    try {
      const parsed = JSON.parse(business.aiAnalyzedTaJson);
      if (parsed && typeof parsed === 'object') {
        return {
          technicalAnalysis: parsed,
          isDataReady: business.fsmFlags.hasAiTaData
        };
      }
    } catch (e) {}
    return { technicalAnalysis: null, isDataReady: false };
  })() : { technicalAnalysis: null, isDataReady: false };

  // Derive loading state from FSM
  const isLoading = business.fsmState === BusinessFsmState.LOADING || !aiTaData.isDataReady;

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

  // On-demand refresh handler (v4.0.0.5)
  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>AI-Analyzed Technical Analysis</CardTitle>
            <CardDescription>AI-calculated support, resistance, and pivot levels based on market data.</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing || !onRefresh}
            className="h-8 w-8 p-0"
            title="Refresh AI Technical Analysis"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
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
                  No AI technical analysis data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}