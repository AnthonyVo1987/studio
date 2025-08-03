'use client';

/**
 * @fileOverview NVDA Staging AI Key Takeaways Display - Enterprise Experimental Component
 * 
 * Staging version of AI key takeaways display with orange/amber theming and staging context consumption.
 * Architecture Pattern: Direct staging context consumption with AI insights display.
 * 
 * REPLICATION PATTERN from baseline component:
 * 1. Adapted from nvda-ai-key-takeaways-display.tsx for staging environment
 * 2. Updated imports: useNvdaAnalysis → useNvdaStagingAnalysis
 * 3. Updated component name: NvdaAiKeyTakeawaysDisplay → NvdaStagingAiKeyTakeawaysDisplay
 * 4. Updated loading text: "NVDA AI key takeaways" → "NVDA staging AI key takeaways"
 * 5. Added staging-specific orange/amber card styling and title suffix
 * 
 * STAGING ENHANCEMENTS:
 * - Orange/amber color scheme for staging differentiation
 * - "(Staging)" suffix in component title
 * - Staging context consumption via useNvdaStagingAnalysis()
 * - Identical AI takeaways rendering with metric cards and export functionality
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, TrendingUp, TrendingDown, Activity, BarChart3, Zap } from 'lucide-react';
import { useNvdaStagingAnalysis, NVDA_STAGING_TICKER } from '@/contexts/nvda-staging-analysis-context';
import { useQuickExport } from '@/hooks/use-export-actions';

export function NvdaStagingAiKeyTakeawaysDisplay() {
  const stagingState = useNvdaStagingAnalysis();

  // Derived state - data availability and loading state
  const isDataReady = stagingState.hasAiKeyTakeaways;
  const isLoading = stagingState.isAiKeyTakeawaysLoading;
  
  // Parse AI key takeaways data for export and display
  const keyTakeawaysData = stagingState.aiKeyTakeawaysJson ? (() => {
    try {
      return JSON.parse(stagingState.aiKeyTakeawaysJson);
    } catch (e) {
      return {};
    }
  })() : {};

  // Extract metrics from AI analysis for display (hardcoded labels as requested)
  // Fix: Extract takeaway strings from objects to prevent React rendering crash
  const metrics = isDataReady ? {
    priceAction: keyTakeawaysData.priceAction?.takeaway || 'No data',
    trend: keyTakeawaysData.trend?.takeaway || 'No data', 
    volatility: keyTakeawaysData.volatility?.takeaway || 'No data',
    momentum: keyTakeawaysData.momentum?.takeaway || 'No data',
    patterns: keyTakeawaysData.patterns?.takeaway || 'No data'
  } : null;

  // Export functionality with staging identifier
  const exportActions = useQuickExport(
    keyTakeawaysData,
    `${NVDA_STAGING_TICKER}_ai_key_takeaways`,
    `${NVDA_STAGING_TICKER} AI Key Takeaways`
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
              <Zap className="h-5 w-5" />
              NVDA AI Key Takeaways (Staging)
            </CardTitle>
            <CardDescription className="text-orange-700">
              AI-generated insights and analysis based on comprehensive NVDA market data - Staging Environment
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy} 
              disabled={!isDataReady}
              title="Copy NVDA Staging AI Key Takeaways as JSON"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Copy className="mr-2 h-4 w-4" /> Copy JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              disabled={!isDataReady}
              title="Export NVDA Staging AI Key Takeaways as JSON"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Download className="mr-2 h-4 w-4" /> Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isDataReady && metrics ? (
          <div className="space-y-4">
            {/* Hardcoded metric labels as requested */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Price Action</p>
                  <p className="text-xs text-orange-700">{metrics.priceAction}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <TrendingDown className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Trend</p>
                  <p className="text-xs text-orange-700">{metrics.trend}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Activity className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Volatility</p>
                  <p className="text-xs text-orange-700">{metrics.volatility}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Momentum</p>
                  <p className="text-xs text-orange-700">{metrics.momentum}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200 md:col-span-2 lg:col-span-1">
                <Zap className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Patterns</p>
                  <p className="text-xs text-orange-700">{metrics.patterns}</p>
                </div>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-orange-700">
                NVDA staging AI analysis completed successfully. Use the export buttons above to view the detailed insights.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
            Generating NVDA staging AI key takeaways...
          </div>
        ) : (
          <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
            No NVDA staging AI key takeaways available. Generate analysis first using the button above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}