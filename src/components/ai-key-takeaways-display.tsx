"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { useUIState } from "@/contexts/ui-state-context";
import { useQuickExport } from "@/hooks/use-export-actions";

export function AiKeyTakeawaysDisplay() {
  const { currentSnapshot } = useUIState();
  const loadingStates = currentSnapshot.loadingStates;

  // Derive values directly from UI snapshot
  const aiAnalysis = currentSnapshot.aiAnalysis;
  const isLoading = loadingStates.isGeneratingTakeaways;
  const isDataReady = aiAnalysis.isKeyTakeawaysReady;

  // Export functionality
  const exportActions = useQuickExport(
    aiAnalysis.keyTakeaways || {},
    `${currentSnapshot.activeTicker || "STOCK"}_ai_key_takeaways`,
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