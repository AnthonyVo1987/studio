'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Shield, TrendingUp, TrendingDown, CandlestickChart } from 'lucide-react';
import { useSpyAnalysis, SPY_TICKER } from '@/contexts/spy-analysis-context';
import { useQuickExport } from '@/hooks/use-export-actions';

export function SpyAiOptionsAnalysisDisplay() {
  const spyState = useSpyAnalysis();

  // Derived state - data availability
  const isDataReady = spyState.hasAiOptionsAnalysis;
  
  // Parse AI options analysis data for export and display
  const optionsAnalysisData = spyState.aiOptionsAnalysisJson ? (() => {
    try {
      return JSON.parse(spyState.aiOptionsAnalysisJson);
    } catch (e) {
      return {};
    }
  })() : {};

  // Extract wall metrics from AI analysis for display (hardcoded labels as requested)
  const wallMetrics = isDataReady ? {
    callWalls: optionsAnalysisData.callWalls || 'No data',
    putWalls: optionsAnalysisData.putWalls || 'No data'
  } : null;

  // Export functionality
  const exportActions = useQuickExport(
    optionsAnalysisData,
    `${SPY_TICKER}_ai_options_analysis`,
    `${SPY_TICKER} AI Options Analysis`
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
            <CardTitle className="flex items-center gap-2">
              <CandlestickChart className="h-5 w-5" />
              {SPY_TICKER} AI Options Analysis
            </CardTitle>
            <CardDescription>
              AI-powered analysis of {SPY_TICKER} options chain data with strategic insights.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy} 
              disabled={!isDataReady}
              title={`Copy ${SPY_TICKER} AI Options Analysis as JSON`}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              disabled={!isDataReady}
              title={`Export ${SPY_TICKER} AI Options Analysis as JSON`}
            >
              <Download className="mr-2 h-4 w-4" /> Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isDataReady && wallMetrics ? (
          <div className="space-y-4">
            {/* Hardcoded wall metric labels as requested */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">Call Walls</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">{wallMetrics.callWalls}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <TrendingDown className="h-6 w-6 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 dark:text-red-100">Put Walls</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{wallMetrics.putWalls}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Options Flow Analysis</p>
                <p className="text-xs text-muted-foreground">
                  AI analysis identifies key support and resistance levels through options positioning
                </p>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-muted-foreground">
                {SPY_TICKER} AI options analysis completed successfully. Use the export buttons above to view the detailed insights.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
            No {SPY_TICKER} AI options analysis available. Generate analysis first using the button above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}