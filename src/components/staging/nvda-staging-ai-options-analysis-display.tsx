'use client';

/**
 * @fileOverview NVDA Staging AI Options Analysis Display - Enterprise Experimental Component
 * 
 * Staging version of AI options analysis display with orange/amber theming and staging context consumption.
 * Architecture Pattern: Direct staging context consumption with options walls visualization.
 * 
 * REPLICATION PATTERN from baseline component:
 * 1. Adapted from nvda-ai-options-analysis-display.tsx for staging environment
 * 2. Updated imports: useNvdaAnalysis → useNvdaStagingAnalysis
 * 3. Updated component name: NvdaAiOptionsAnalysisDisplay → NvdaStagingAiOptionsAnalysisDisplay
 * 4. Updated loading text: "NVDA AI options analysis" → "NVDA staging AI options analysis"
 * 5. Added staging-specific orange/amber card styling and title suffix
 * 
 * STAGING ENHANCEMENTS:
 * - Orange/amber color scheme for staging differentiation
 * - "(Staging)" suffix in component title
 * - Staging context consumption via useNvdaStagingAnalysis()
 * - Identical AI options analysis rendering with call/put walls visualization
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Shield, TrendingUp, TrendingDown, CandlestickChart } from 'lucide-react';
import { useNvdaStagingAnalysis, NVDA_STAGING_TICKER } from '@/contexts/nvda-staging-analysis-context';
import { useQuickExport } from '@/hooks/use-export-actions';

interface OptionsWall {
  strike: number;
  openInterest?: number;
  volume?: number;
  type: 'call' | 'put';
}

export function NvdaStagingAiOptionsAnalysisDisplay() {
  const stagingState = useNvdaStagingAnalysis();

  // Derived state - data availability and loading state
  const isDataReady = stagingState.hasAiOptionsAnalysis;
  const isLoading = stagingState.isAiOptionsAnalysisLoading;
  
  // Parse AI options analysis data for export and display
  const optionsAnalysisData = stagingState.aiOptionsAnalysisJson ? (() => {
    try {
      return JSON.parse(stagingState.aiOptionsAnalysisJson);
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

  // Export functionality with staging identifier
  const exportActions = useQuickExport(
    optionsAnalysisData,
    `${NVDA_STAGING_TICKER}_ai_options_analysis`,
    `${NVDA_STAGING_TICKER} AI Options Analysis`
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
    <Card className="border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <CandlestickChart className="h-5 w-5" />
              NVDA AI Options Analysis (Staging)
            </CardTitle>
            <CardDescription className="text-orange-700">
              AI-powered analysis of NVDA options chain data with strategic insights - Staging Environment
              {/* STAGING VERSION: Display expiration used for analysis */}
              {stagingState.selectedExpirationDate && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">Analysis Expiration:</span> {stagingState.selectedExpirationDate}
                </div>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy} 
              disabled={!isDataReady}
              title="Copy NVDA Staging AI Options Analysis as JSON"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Copy className="mr-2 h-4 w-4" /> Copy JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              disabled={!isDataReady}
              title="Export NVDA Staging AI Options Analysis as JSON"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
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
            
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">Options Flow Analysis</p>
                <p className="text-xs text-orange-700">
                  AI analysis identifies key support and resistance levels through options positioning - Staging Environment
                </p>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-orange-700">
                NVDA staging AI options analysis completed successfully. Use the export buttons above to view the detailed insights.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
            Generating NVDA staging AI options analysis...
          </div>
        ) : (
          <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
            No NVDA staging AI options analysis available. Generate analysis first using the button above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}