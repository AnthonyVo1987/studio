"use client";

/**
 * @fileOverview Base AI Analyzed TA Display Template
 * 
 * This template displays AI-analyzed technical analysis data for any ticker.
 * It shows AI-generated insights and interpretations of technical indicators.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle } from "lucide-react";

import type { TickerConfig, TickerContextResult } from '../../types';

interface BaseAiAnalyzedTaDisplayProps<T extends TickerConfig> {
  config: T;
  context: TickerContextResult<T>;
}

interface AnalysisSection {
  title: string;
  content: string;
  sentiment?: "bullish" | "bearish" | "neutral";
  confidence?: number;
}

export function BaseAiAnalyzedTaDisplay<T extends TickerConfig>({
  config,
  context,
}: BaseAiAnalyzedTaDisplayProps<T>) {
  const state = context.hooks.useState();

  // Safe JSON parsing for AI analyzed technical analysis data
  const aiTaData = state.aiAnalyzedTaJson ? (() => {
    try {
      const parsed = JSON.parse(state.aiAnalyzedTaJson);
      
      return {
        // Overall Analysis
        overallSentiment: parsed.overallSentiment || parsed.overall_sentiment || "neutral",
        confidenceScore: parsed.confidenceScore || parsed.confidence_score || 0,
        
        // Key Insights
        keyInsights: parsed.keyInsights || parsed.key_insights || [],
        
        // Analysis Sections
        trendAnalysis: parsed.trendAnalysis || parsed.trend_analysis || "No trend analysis available",
        momentumAnalysis: parsed.momentumAnalysis || parsed.momentum_analysis || "No momentum analysis available",
        volatilityAnalysis: parsed.volatilityAnalysis || parsed.volatility_analysis || "No volatility analysis available",
        
        // Support and Resistance
        supportLevels: parsed.supportLevels || parsed.support_levels || [],
        resistanceLevels: parsed.resistanceLevels || parsed.resistance_levels || [],
        
        // Trading Signals
        signals: parsed.signals || [],
        recommendations: parsed.recommendations || [],
        
        // Risk Assessment
        riskLevel: parsed.riskLevel || parsed.risk_level || "medium",
        riskFactors: parsed.riskFactors || parsed.risk_factors || [],
        
        // Timestamp
        analysisTimestamp: parsed.analysisTimestamp || parsed.analysis_timestamp || new Date().toISOString(),
        
        isDataReady: state.dataRetrievalComplete
      };
    } catch (e) {
      return {
        overallSentiment: "neutral",
        confidenceScore: 0,
        keyInsights: [],
        trendAnalysis: "Error parsing AI analysis data",
        momentumAnalysis: "Error parsing AI analysis data",
        volatilityAnalysis: "Error parsing AI analysis data",
        supportLevels: [],
        resistanceLevels: [],
        signals: [],
        recommendations: [],
        riskLevel: "medium",
        riskFactors: [],
        analysisTimestamp: new Date().toISOString(),
        isDataReady: false
      };
    }
  })() : {
    overallSentiment: "neutral",
    confidenceScore: 0,
    keyInsights: [],
    trendAnalysis: "No AI analysis data available",
    momentumAnalysis: "No AI analysis data available",
    volatilityAnalysis: "No AI analysis data available",
    supportLevels: [],
    resistanceLevels: [],
    signals: [],
    recommendations: [],
    riskLevel: "medium",
    riskFactors: [],
    analysisTimestamp: new Date().toISOString(),
    isDataReady: false
  };

  // Derive loading state from FSM state and data availability
  const isLoading = state.status === 'loading' || !state.dataRetrievalComplete || !state.hasAiTaData;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish':
        return 'text-green-600';
      case 'bearish':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

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

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const analysisSections: AnalysisSection[] = [
    {
      title: "Trend Analysis",
      content: aiTaData.trendAnalysis,
    },
    {
      title: "Momentum Analysis", 
      content: aiTaData.momentumAnalysis,
    },
    {
      title: "Volatility Analysis",
      content: aiTaData.volatilityAnalysis,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          {config.ticker} AI Technical Analysis
        </CardTitle>
        <CardDescription>
          AI-powered insights and interpretation of technical indicators
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading AI technical analysis for {config.ticker}...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Sentiment & Confidence */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Overall Sentiment:</span>
                  <Badge variant={getSentimentVariant(aiTaData.overallSentiment)}>
                    {aiTaData.overallSentiment.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Confidence:</span>
                  <span className="text-sm font-semibold">
                    {formatConfidence(aiTaData.confidenceScore)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Risk:</span>
                <span className={`font-medium ${getRiskColor(aiTaData.riskLevel)}`}>
                  {aiTaData.riskLevel.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Key Insights */}
            {aiTaData.keyInsights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Key Insights
                </h4>
                <div className="space-y-2">
                  {aiTaData.keyInsights.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Sections */}
            <div>
              <h4 className="text-sm font-medium mb-3">Detailed Analysis</h4>
              <div className="space-y-4">
                {analysisSections.map((section, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2">{section.title}</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Support and Resistance Levels */}
            {(aiTaData.supportLevels.length > 0 || aiTaData.resistanceLevels.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiTaData.supportLevels.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-green-600">Support Levels</h4>
                    <div className="space-y-1">
                      {aiTaData.supportLevels.map((level: number, index: number) => (
                        <div key={index} className="text-sm bg-green-50 px-2 py-1 rounded">
                          ${level.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {aiTaData.resistanceLevels.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-red-600">Resistance Levels</h4>
                    <div className="space-y-1">
                      {aiTaData.resistanceLevels.map((level: number, index: number) => (
                        <div key={index} className="text-sm bg-red-50 px-2 py-1 rounded">
                          ${level.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Risk Factors */}
            {aiTaData.riskFactors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Risk Factors
                </h4>
                <div className="space-y-2">
                  {aiTaData.riskFactors.map((factor: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-md border-l-2 border-yellow-400">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{factor}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trading Recommendations */}
            {aiTaData.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Trading Recommendations</h4>
                <div className="space-y-2">
                  {aiTaData.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Timestamp */}
            <div className="text-xs text-muted-foreground text-center pt-4 border-t">
              Analysis generated: {new Date(aiTaData.analysisTimestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}