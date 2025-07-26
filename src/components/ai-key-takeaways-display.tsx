"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, RefreshCw } from "lucide-react";
import { useStockAnalysis, BusinessFsmState } from "@/contexts/business-logic-context";
import { useQuickExport } from "@/hooks/use-export-actions";

interface AiKeyTakeawaysDisplayProps {
  onRefresh?: () => void;
}

export function AiKeyTakeawaysDisplay({ onRefresh }: AiKeyTakeawaysDisplayProps) {
  const business = useStockAnalysis();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // AI Key Takeaways are now on-demand only (no FSM loading state)
  const isLoading = false; // On-demand actions handle their own loading states
  const isDataReady = business.fsmFlags.hasAiKeyTakeaways;

  // Parse AI key takeaways data for export
  const keyTakeawaysData = business.aiKeyTakeawaysJson ? (() => {
    try {
      return JSON.parse(business.aiKeyTakeawaysJson);
    } catch (e) {
      return {};
    }
  })() : {};

  // Export functionality
  const exportActions = useQuickExport(
    keyTakeawaysData,
    `${business.fsmVariables.activeTicker || "STOCK"}_ai_key_takeaways`,
    "AI Key Takeaways"
  );

  const handleExport = () => {
    if (isDataReady) {
      exportActions.download();
    }
  };

  const handleCopy = async () => {
    if (isDataReady) {
      await exportActions.copy();
    }
  };

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
            <CardTitle>AI Key Takeaways</CardTitle>
            <CardDescription>
              AI-generated insights and analysis based on comprehensive market data.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing || !onRefresh}
              title="Refresh AI Key Takeaways"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy} 
              disabled={!isDataReady}
              title="Copy AI Key Takeaways as JSON"
            >
              <Copy className="mr-2 h-4 w-4" /> Copy JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              disabled={!isDataReady}
              title="Export AI Key Takeaways as JSON"
            >
              <Download className="mr-2 h-4 w-4" /> Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground h-24 flex items-center justify-center">
            Generating AI key takeaways...
          </div>
        ) : isDataReady ? (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p>AI analysis completed successfully. Use the export buttons above to view the detailed insights.</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
            No AI key takeaways available. Generate analysis first.
          </div>
        )}
      </CardContent>
    </Card>
  );
}