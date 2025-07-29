"use client";

/**
 * @fileOverview Base AI Options Analysis Display Template
 * 
 * This template displays AI-generated options analysis for any ticker.
 * It shows options insights, strategies, and trading recommendations.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CandlestickChart, Copy, Download, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import type { TickerConfig, TickerContextResult } from '../../types';

interface BaseAiOptionsAnalysisDisplayProps<T extends TickerConfig> {
  config: T;
  context: TickerContextResult<T>;
}

interface OptionsStrategy {
  name: string;
  type: "bullish" | "bearish" | "neutral";
  probability: number;
  maxProfit: number;
  maxLoss: number;
  breakeven: number[];
  description: string;
}

export function BaseAiOptionsAnalysisDisplay<T extends TickerConfig>({
  config,
  context,
}: BaseAiOptionsAnalysisDisplayProps<T>) {
  const state = context.hooks.useState();
  const { toast } = useToast();

  // Safe JSON parsing for AI options analysis data
  const optionsData = state.aiOptionsAnalysisJson ? (() => {
    try {
      const parsed = JSON.parse(state.aiOptionsAnalysisJson);
      
      return {
        // Overall Analysis
        summary: parsed.summary || "No options analysis summary available",
        overallSentiment: parsed.overallSentiment || parsed.overall_sentiment || "neutral",
        marketCondition: parsed.marketCondition || parsed.market_condition || "neutral",
        
        // Volatility Analysis
        impliedVolatility: parsed.impliedVolatility || parsed.implied_volatility || 0,
        historicalVolatility: parsed.historicalVolatility || parsed.historical_volatility || 0,
        volatilityRank: parsed.volatilityRank || parsed.volatility_rank || 0,
        volatilitySkew: parsed.volatilitySkew || parsed.volatility_skew || [],
        
        // Options Flow
        callPutRatio: parsed.callPutRatio || parsed.call_put_ratio || 0,
        unusualActivity: parsed.unusualActivity || parsed.unusual_activity || [],
        volumeAnalysis: parsed.volumeAnalysis || parsed.volume_analysis || {},
        
        // Strategy Recommendations
        strategies: parsed.strategies || parsed.recommended_strategies || [],
        optimalStrategies: parsed.optimalStrategies || parsed.optimal_strategies || [],
        
        // Greeks Analysis
        greeksAnalysis: parsed.greeksAnalysis || parsed.greeks_analysis || {},
        deltaHedging: parsed.deltaHedging || parsed.delta_hedging || {},
        
        // Risk Metrics
        riskMetrics: parsed.riskMetrics || parsed.risk_metrics || {},
        stressTests: parsed.stressTests || parsed.stress_tests || [],
        
        // Price Targets
        priceTargets: parsed.priceTargets || parsed.price_targets || {},
        probabilityAnalysis: parsed.probabilityAnalysis || parsed.probability_analysis || {},
        
        // Time Decay
        timeDecayAnalysis: parsed.timeDecayAnalysis || parsed.time_decay_analysis || "No time decay analysis available",
        
        // Key Insights
        keyInsights: parsed.keyInsights || parsed.key_insights || [],
        warnings: parsed.warnings || parsed.risk_warnings || [],
        
        // Metadata
        analysisTimestamp: parsed.analysisTimestamp || parsed.analysis_timestamp || new Date().toISOString(),
        expirationDate: parsed.expirationDate || parsed.expiration_date || "",
        underlyingPrice: parsed.underlyingPrice || parsed.underlying_price || 0,
        
        isDataReady: state.hasAiOptionsAnalysis
      };
    } catch (e) {
      return {
        summary: "Error parsing AI options analysis data",
        overallSentiment: "neutral",
        marketCondition: "neutral",
        impliedVolatility: 0,
        historicalVolatility: 0,
        volatilityRank: 0,
        volatilitySkew: [],
        callPutRatio: 0,
        unusualActivity: [],
        volumeAnalysis: {},
        strategies: [],
        optimalStrategies: [],
        greeksAnalysis: {},
        deltaHedging: {},
        riskMetrics: {},
        stressTests: [],
        priceTargets: {},
        probabilityAnalysis: {},
        timeDecayAnalysis: "Error parsing data",
        keyInsights: [],
        warnings: [],
        analysisTimestamp: new Date().toISOString(),
        expirationDate: "",
        underlyingPrice: 0,
        isDataReady: false
      };
    }
  })() : {
    summary: "No AI options analysis generated yet",
    overallSentiment: "neutral",
    marketCondition: "neutral",
    impliedVolatility: 0,
    historicalVolatility: 0,
    volatilityRank: 0,
    volatilitySkew: [],
    callPutRatio: 0,
    unusualActivity: [],
    volumeAnalysis: {},
    strategies: [],
    optimalStrategies: [],
    greeksAnalysis: {},
    deltaHedging: {},
    riskMetrics: {},
    stressTests: [],
    priceTargets: {},
    probabilityAnalysis: {},
    timeDecayAnalysis: "Generate AI analysis to see time decay analysis",
    keyInsights: [],
    warnings: [],
    analysisTimestamp: new Date().toISOString(),
    expirationDate: "",
    underlyingPrice: 0,
    isDataReady: false
  };

  const isLoading = state.isAiOptionsAnalysisLoading;
  const hasData = state.hasAiOptionsAnalysis && optionsData.isDataReady;

  const getSentimentVariant = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish':
        return 'default' as const;
      case 'bearish':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleCopyAnalysis = async () => {
    try {
      await navigator.clipboard.writeText(state.aiOptionsAnalysisJson);
      toast({
        title: "Copied to Clipboard",
        description: `${config.ticker} AI Options Analysis JSON copied successfully`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleExportAnalysis = () => {
    try {
      const blob = new Blob([state.aiOptionsAnalysisJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.ticker}_ai_options_analysis_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `${config.ticker} AI Options Analysis exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export data",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CandlestickChart className="h-4 w-4" />
              {config.ticker} AI Options Analysis
            </CardTitle>
            <CardDescription>
              AI-powered options insights and trading strategies
            </CardDescription>
          </div>
          {hasData && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAnalysis}
                className="flex items-center gap-2"
              >
                <Copy className="h-3 w-3" />
                Copy JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAnalysis}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Generating AI options analysis for {config.ticker}...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take up to 30 seconds</p>
          </div>
        ) : !hasData ? (
          <div className="text-center py-8">
            <CandlestickChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No AI options analysis generated yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Generate AI Options Analysis" to get insights for {config.ticker}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analysis Header */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sentiment:</span>
                  <Badge variant={getSentimentVariant(optionsData.overallSentiment)}>
                    {optionsData.overallSentiment.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Market:</span>
                  <Badge variant="outline">
                    {optionsData.marketCondition.toUpperCase()}
                  </Badge>
                </div>
                {optionsData.underlyingPrice > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Price:</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(optionsData.underlyingPrice)}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(optionsData.analysisTimestamp).toLocaleString()}
              </div>
            </div>

            {/* Executive Summary */}
            <div>
              <h4 className="text-sm font-medium mb-3">Analysis Summary</h4>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm leading-relaxed">{optionsData.summary}</p>
              </div>
            </div>

            {/* Volatility Metrics */}
            <div>
              <h4 className="text-sm font-medium mb-3">Volatility Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Implied Vol</p>
                  <p className="text-lg font-semibold">{formatPercent(optionsData.impliedVolatility)}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Historical Vol</p>
                  <p className="text-lg font-semibold">{formatPercent(optionsData.historicalVolatility)}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Vol Rank</p>
                  <p className="text-lg font-semibold">{formatPercent(optionsData.volatilityRank)}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Call/Put Ratio</p>
                  <p className="text-lg font-semibold">{optionsData.callPutRatio.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            {optionsData.keyInsights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Key Options Insights
                </h4>
                <div className="space-y-2">
                  {optionsData.keyInsights.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategy Recommendations */}
            {optionsData.strategies.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Recommended Strategies
                </h4>
                <div className="space-y-3">
                  {optionsData.strategies.map((strategy: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{strategy.name || `Strategy ${index + 1}`}</span>
                          {strategy.type && (
                            <Badge variant={getSentimentVariant(strategy.type)}>
                              {strategy.type}
                            </Badge>
                          )}
                        </div>
                        {strategy.probability && (
                          <span className="text-sm text-muted-foreground">
                            {formatPercent(strategy.probability)} success
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {strategy.description || strategy.details}
                      </p>
                      {(strategy.maxProfit || strategy.maxLoss || strategy.breakeven) && (
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          {strategy.maxProfit && (
                            <div>
                              <span className="text-muted-foreground">Max Profit:</span>
                              <span className="ml-1 font-medium text-green-600">
                                {formatCurrency(strategy.maxProfit)}
                              </span>
                            </div>
                          )}
                          {strategy.maxLoss && (
                            <div>
                              <span className="text-muted-foreground">Max Loss:</span>
                              <span className="ml-1 font-medium text-red-600">
                                {formatCurrency(strategy.maxLoss)}
                              </span>
                            </div>
                          )}
                          {strategy.breakeven && (
                            <div>
                              <span className="text-muted-foreground">Breakeven:</span>
                              <span className="ml-1 font-medium">
                                {Array.isArray(strategy.breakeven) 
                                  ? strategy.breakeven.map((be: number) => formatCurrency(be)).join(', ')
                                  : formatCurrency(strategy.breakeven)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Decay Analysis */}
            <div>
              <h4 className="text-sm font-medium mb-3">Time Decay Analysis</h4>
              <div className="p-4 bg-yellow-50 rounded-lg border-l-2 border-yellow-400">
                <p className="text-sm leading-relaxed">{optionsData.timeDecayAnalysis}</p>
              </div>
            </div>

            {/* Risk Warnings */}
            {optionsData.warnings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Risk Warnings
                </h4>
                <div className="space-y-2">
                  {optionsData.warnings.map((warning: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded-md border-l-2 border-red-400">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{warning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unusual Activity */}
            {optionsData.unusualActivity.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Unusual Options Activity</h4>
                <div className="space-y-2">
                  {optionsData.unusualActivity.map((activity: any, index: number) => (
                    <div key={index} className="p-3 bg-orange-50 rounded-md border-l-2 border-orange-400">
                      <p className="text-sm">{typeof activity === 'string' ? activity : activity.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}