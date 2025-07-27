'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, TrendingUp, TrendingDown, Activity, BarChart3, Zap } from 'lucide-react';
import { useSpyAnalysis, SPY_TICKER } from '@/contexts/spy-analysis-context';
import { useQuickExport } from '@/hooks/use-export-actions';

export function SpyAiKeyTakeawaysDisplay() {
  const spyState = useSpyAnalysis();

  // Derived state - data availability
  const isDataReady = spyState.hasAiKeyTakeaways;
  
  // Parse AI key takeaways data for export and display
  const keyTakeawaysData = spyState.aiKeyTakeawaysJson ? (() => {
    try {
      return JSON.parse(spyState.aiKeyTakeawaysJson);
    } catch (e) {
      return {};
    }
  })() : {};

  // Extract metrics from AI analysis for display (hardcoded labels as requested)
  const metrics = isDataReady ? {
    priceAction: keyTakeawaysData.priceAction || 'No data',
    trend: keyTakeawaysData.trend || 'No data', 
    volatility: keyTakeawaysData.volatility || 'No data',
    momentum: keyTakeawaysData.momentum || 'No data',
    patterns: keyTakeawaysData.patterns || 'No data'
  } : null;

  // Export functionality
  const exportActions = useQuickExport(
    keyTakeawaysData,
    `${SPY_TICKER}_ai_key_takeaways`,
    `${SPY_TICKER} AI Key Takeaways`
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
              <Zap className="h-5 w-5" />
              {SPY_TICKER} AI Key Takeaways
            </CardTitle>
            <CardDescription>
              AI-generated insights and analysis based on comprehensive {SPY_TICKER} market data.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy} 
              disabled={!isDataReady}
              title={`Copy ${SPY_TICKER} AI Key Takeaways as JSON`}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              disabled={!isDataReady}
              title={`Export ${SPY_TICKER} AI Key Takeaways as JSON`}
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
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Price Action</p>
                  <p className="text-xs text-muted-foreground">{metrics.priceAction}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <TrendingDown className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Trend</p>
                  <p className="text-xs text-muted-foreground">{metrics.trend}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Volatility</p>
                  <p className="text-xs text-muted-foreground">{metrics.volatility}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Momentum</p>
                  <p className="text-xs text-muted-foreground">{metrics.momentum}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg md:col-span-2 lg:col-span-1">
                <Zap className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Patterns</p>
                  <p className="text-xs text-muted-foreground">{metrics.patterns}</p>
                </div>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-muted-foreground">
                {SPY_TICKER} AI analysis completed successfully. Use the export buttons above to view the detailed insights.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
            No {SPY_TICKER} AI key takeaways available. Generate analysis first using the button above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}