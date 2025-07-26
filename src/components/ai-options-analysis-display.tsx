"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { useStockAnalysis, BusinessFsmState } from "@/contexts/business-logic-context";
import { useQuickExport } from "@/hooks/use-export-actions";

export function AiOptionsAnalysisDisplay() {
  const business = useStockAnalysis();

  // AI Options Analysis are now on-demand only (no FSM loading state)
  const isLoading = false; // On-demand actions handle their own loading states
  const isDataReady = business.fsmFlags.isOptionsAnalysisDataAvailable;

  // Parse AI options analysis data for export
  const optionsAnalysisData = business.aiOptionsAnalysisJson ? (() => {
    try {
      return JSON.parse(business.aiOptionsAnalysisJson);
    } catch (e) {
      return {};
    }
  })() : {};

  // Export functionality
  const exportActions = useQuickExport(
    optionsAnalysisData,
    `${business.fsmVariables.activeTicker || "STOCK"}_ai_options_analysis`,
    "AI Options Analysis"
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>AI Options Analysis</CardTitle>
            <CardDescription>
              AI-powered analysis of options chain data with strategic insights.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy} 
              disabled={!isDataReady}
              title="Copy AI Options Analysis as JSON"
            >
              <Copy className="mr-2 h-4 w-4" /> Copy JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              disabled={!isDataReady}
              title="Export AI Options Analysis as JSON"
            >
              <Download className="mr-2 h-4 w-4" /> Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground h-24 flex items-center justify-center">
            Analyzing options data with AI...
          </div>
        ) : isDataReady ? (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p>AI options analysis completed successfully. Use the export buttons above to view the detailed insights.</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
            No AI options analysis available. Generate analysis first.
          </div>
        )}
      </CardContent>
    </Card>
  );
}