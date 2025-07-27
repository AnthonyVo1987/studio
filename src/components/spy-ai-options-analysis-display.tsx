'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Shield, TrendingUp, TrendingDown, CandlestickChart } from 'lucide-react';
import { useSpyAnalysis, SPY_TICKER } from '@/contexts/spy-analysis-context';
import { useQuickExport } from '@/hooks/use-export-actions';

interface OptionsWall {
  strike: number;
  openInterest?: number;
  volume?: number;
  type: 'call' | 'put';
}

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
  // Fix: Format arrays of wall objects into readable strings to prevent React rendering crash
  const wallMetrics = isDataReady ? {
    callWalls: Array.isArray(optionsAnalysisData.callWalls) && optionsAnalysisData.callWalls.length > 0
      ? `${optionsAnalysisData.callWalls.length} call wall${optionsAnalysisData.callWalls.length > 1 ? 's' : ''} identified`
      : 'No call walls detected',
    putWalls: Array.isArray(optionsAnalysisData.putWalls) && optionsAnalysisData.putWalls.length > 0
      ? `${optionsAnalysisData.putWalls.length} put wall${optionsAnalysisData.putWalls.length > 1 ? 's' : ''} identified`
      : 'No put walls detected'
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
            {/* Call Walls Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Call Walls</h3>
              </div>
              {Array.isArray(optionsAnalysisData.callWalls) && optionsAnalysisData.callWalls.length > 0 ? (
                <div className="space-y-2">
                  {optionsAnalysisData.callWalls.map((wall: OptionsWall, index: number) => (
                    <div key={index} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-green-900 dark:text-green-100">Strike: ${wall.strike}</span>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-green-700 dark:text-green-300">OI: {wall.openInterest?.toLocaleString()}</div>
                          {wall.volume && <div className="text-green-600 dark:text-green-400">Vol: {wall.volume.toLocaleString()}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-green-700 dark:text-green-300 italic">No call walls detected</p>
              )}
            </div>

            {/* Put Walls Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Put Walls</h3>
              </div>
              {Array.isArray(optionsAnalysisData.putWalls) && optionsAnalysisData.putWalls.length > 0 ? (
                <div className="space-y-2">
                  {optionsAnalysisData.putWalls.map((wall: OptionsWall, index: number) => (
                    <div key={index} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-red-900 dark:text-red-100">Strike: ${wall.strike}</span>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-red-700 dark:text-red-300">OI: {wall.openInterest?.toLocaleString()}</div>
                          {wall.volume && <div className="text-red-600 dark:text-red-400">Vol: {wall.volume.toLocaleString()}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-700 dark:text-red-300 italic">No put walls detected</p>
              )}
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