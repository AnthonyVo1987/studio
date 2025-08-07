"use client";

/**
 * @fileOverview Base AI Key Takeaways Display Template
 * 
 * This template displays AI-generated key takeaways for any ticker.
 * It shows important insights, analysis, and trading recommendations.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Download, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import type { TickerConfig, TickerContextResult } from '../../types';

interface BaseAiKeyTakeawaysDisplayProps<T extends TickerConfig> {
  config: T;
  context: TickerContextResult<T>;
}

interface Takeaway {
  category: string;
  insight: string;
  impact: "high" | "medium" | "low";
  sentiment?: "bullish" | "bearish" | "neutral";
}

export function BaseAiKeyTakeawaysDisplay<T extends TickerConfig>({
  config,
  context,
}: BaseAiKeyTakeawaysDisplayProps<T>) {
  const state = context.hooks.useState();
  const { toast } = useToast();

  // Safe JSON parsing for AI key takeaways data
  const takeawaysData = state.aiKeyTakeawaysJson ? (() => {
    try {
      const parsed = JSON.parse(state.aiKeyTakeawaysJson);
      
      return {
        // Main Analysis
        summary: parsed.summary || "No summary available",
        overallSentiment: parsed.overallSentiment || parsed.overall_sentiment || "neutral",
        confidenceLevel: parsed.confidenceLevel || parsed.confidence_level || "medium",
        
        // Key Takeaways
        takeaways: parsed.takeaways || parsed.key_takeaways || [],
        
        // Market Outlook
        shortTermOutlook: parsed.shortTermOutlook || parsed.short_term_outlook || "No short-term outlook available",
        longTermOutlook: parsed.longTermOutlook || parsed.long_term_outlook || "No long-term outlook available",
        
        // Trading Insights
        tradingOpportunities: parsed.tradingOpportunities || parsed.trading_opportunities || [],
        riskAssessment: parsed.riskAssessment || parsed.risk_assessment || "No risk assessment available",
        
        // Price Targets
        priceTargets: parsed.priceTargets || parsed.price_targets || {},
        
        // Catalyst Events
        catalysts: parsed.catalysts || parsed.catalyst_events || [],
        
        // Additional Insights
        technicalSignals: parsed.technicalSignals || parsed.technical_signals || [],
        fundamentalFactors: parsed.fundamentalFactors || parsed.fundamental_factors || [],
        
        // Metadata
        analysisTimestamp: parsed.analysisTimestamp || parsed.analysis_timestamp || new Date().toISOString(),
        dataQuality: parsed.dataQuality || parsed.data_quality || "good",
        
        isDataReady: state.hasAiKeyTakeaways
      };
    } catch (e) {
      return {
        summary: "Error parsing AI key takeaways data",
        overallSentiment: "neutral",
        confidenceLevel: "low",
        takeaways: [],
        shortTermOutlook: "Error parsing data",
        longTermOutlook: "Error parsing data",
        tradingOpportunities: [],
        riskAssessment: "Error parsing data",
        priceTargets: {},
        catalysts: [],
        technicalSignals: [],
        fundamentalFactors: [],
        analysisTimestamp: new Date().toISOString(),
        dataQuality: "poor",
        isDataReady: false
      };
    }
  })() : {
    summary: "No AI key takeaways generated yet",
    overallSentiment: "neutral",
    confidenceLevel: "low",
    takeaways: [],
    shortTermOutlook: "Generate AI analysis to see outlook",
    longTermOutlook: "Generate AI analysis to see outlook",
    tradingOpportunities: [],
    riskAssessment: "Generate AI analysis to see risk assessment",
    priceTargets: {},
    catalysts: [],
    technicalSignals: [],
    fundamentalFactors: [],
    analysisTimestamp: new Date().toISOString(),
    dataQuality: "none",
    isDataReady: false
  };

  const isLoading = state.isAiKeyTakeawaysLoading;
  const hasData = state.hasAiKeyTakeaways && takeawaysData.isDataReady;

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

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
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

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleCopyTakeaways = async () => {
    try {
      await navigator.clipboard.writeText(state.aiKeyTakeawaysJson);
      toast({
        title: "Copied to Clipboard",
        description: `${config.ticker} AI Key Takeaways JSON copied successfully`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleExportTakeaways = () => {
    try {
      const blob = new Blob([state.aiKeyTakeawaysJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.ticker}_ai_key_takeaways_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `${config.ticker} AI Key Takeaways exported successfully`,
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
              <FileText className="h-4 w-4" />
              {config.ticker} AI Key Takeaways
            </CardTitle>
            <CardDescription>
              AI-generated insights and analysis summary
            </CardDescription>
          </div>
          {hasData && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTakeaways}
                className="flex items-center gap-2"
              >
                <Copy className="h-3 w-3" />
                Copy JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTakeaways}
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
            <p className="text-muted-foreground">Generating AI key takeaways for {config.ticker}...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take up to 30 seconds</p>
          </div>
        ) : !hasData ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No AI key takeaways generated yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click &quot;Generate AI Key Takeaways&quot; to get insights for {config.ticker}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analysis Header */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sentiment:</span>
                  <Badge variant={getSentimentVariant(takeawaysData.overallSentiment)}>
                    {takeawaysData.overallSentiment.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Confidence:</span>
                  <span className={`text-sm font-semibold ${getConfidenceColor(takeawaysData.confidenceLevel)}`}>
                    {takeawaysData.confidenceLevel.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(takeawaysData.analysisTimestamp).toLocaleString()}
              </div>
            </div>

            {/* Executive Summary */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Executive Summary
              </h4>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm leading-relaxed">{takeawaysData.summary}</p>
              </div>
            </div>

            {/* Key Takeaways */}
            {takeawaysData.takeaways.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Key Takeaways
                </h4>
                <div className="space-y-3">
                  {takeawaysData.takeaways.map((takeaway: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600">
                          {takeaway.category || `Takeaway ${index + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          {takeaway.sentiment && (
                            <Badge variant={getSentimentVariant(takeaway.sentiment)}>
                              {takeaway.sentiment}
                            </Badge>
                          )}
                          {takeaway.impact && (
                            <Badge variant="outline">
                              {takeaway.impact} impact
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {takeaway.insight || takeaway.description || takeaway.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Outlook */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Short-term Outlook
                </h4>
                <div className="p-3 bg-green-50 rounded-lg border-l-2 border-green-400">
                  <p className="text-sm leading-relaxed">{takeawaysData.shortTermOutlook}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Long-term Outlook
                </h4>
                <div className="p-3 bg-blue-50 rounded-lg border-l-2 border-blue-400">
                  <p className="text-sm leading-relaxed">{takeawaysData.longTermOutlook}</p>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Risk Assessment
              </h4>
              <div className="p-4 bg-yellow-50 rounded-lg border-l-2 border-yellow-400">
                <p className="text-sm leading-relaxed">{takeawaysData.riskAssessment}</p>
              </div>
            </div>

            {/* Trading Opportunities */}
            {takeawaysData.tradingOpportunities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Trading Opportunities</h4>
                <div className="space-y-2">
                  {takeawaysData.tradingOpportunities.map((opportunity: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <p className="text-sm">{opportunity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Targets */}
            {Object.keys(takeawaysData.priceTargets).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Price Targets</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(takeawaysData.priceTargets).map(([key, value]) => (
                    <div key={key} className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{key}</p>
                      <p className="text-lg font-semibold">${(value as number).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Signals */}
            {takeawaysData.technicalSignals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Technical Signals</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {takeawaysData.technicalSignals.map((signal: string, index: number) => (
                    <div key={index} className="p-2 bg-muted/50 rounded text-sm">
                      {signal}
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