"use client";

/**
 * @fileOverview User Ticker AI Options Analysis Display - Dynamic Ticker Component
 * 
 * This component is ticker-agnostic and works with any ticker symbol from
 * the user-ticker-analysis-context. It displays AI-generated options analysis
 * for the currently selected ticker.
 * 
 * ARCHITECTURE PATTERN:
 * - Direct context consumption via useUserTickerAnalysis hook
 * - Safe JSON parsing with error handling
 * - Loading state derivation from FSM and data flags
 * - Dynamic ticker display with proper fallback handling
 * - Consistent error handling for cases with no ticker set
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// User Ticker Context
import { useUserTickerAnalysis } from "@/contexts/user-ticker-analysis-context";

// Export utilities
import { copyToClipboard } from "@/lib/export-utils";

export function UserTickerAiOptionsAnalysisDisplay() {
  const userTickerState = useUserTickerAnalysis();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  // Get current ticker for display
  const currentTicker = userTickerState.currentTicker || '';
  const displayTicker = currentTicker || 'No Ticker Selected';

  // Safe JSON parsing pattern
  const optionsAnalysisData = userTickerState.aiOptionsAnalysisJson ? (() => {
    try {
      const parsed = JSON.parse(userTickerState.aiOptionsAnalysisJson);
      return {
        raw: parsed,
        isValid: !!parsed && typeof parsed === 'object',
        analysis: parsed.analysis || parsed.content || parsed.response || '',
        summary: parsed.summary || '',
        strategies: parsed.strategies || parsed.recommended_strategies || [],
        riskAssessment: parsed.riskAssessment || parsed.risk_assessment || '',
        keyLevels: parsed.keyLevels || parsed.key_levels || {},
        confidence: parsed.confidence || null,
        timestamp: parsed.timestamp || parsed.lastUpdated || new Date().toISOString()
      };
    } catch (e) {
      return {
        raw: {},
        isValid: false,
        analysis: '',
        summary: '',
        strategies: [],
        riskAssessment: '',
        keyLevels: {},
        confidence: null,
        timestamp: null
      };
    }
  })() : {
    raw: {},
    isValid: false,
    analysis: '',
    summary: '',
    strategies: [],
    riskAssessment: '',
    keyLevels: {},
    confidence: null,
    timestamp: null
  };

  // Derive loading state from FSM state and data availability
  const isLoading = userTickerState.status === 'loading' || 
                   (currentTicker && userTickerState.isTickerValid && !userTickerState.dataRetrievalComplete);

  // Check if AI Options Analysis is currently loading (separate from main FSM)
  const isAiLoading = userTickerState.isAiOptionsAnalysisLoading;

  // Format JSON for display
  const formatJsonData = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return 'Invalid JSON data';
    }
  };

  // Copy handler
  const handleCopy = async () => {
    if (!userTickerState.aiOptionsAnalysisJson) {
      toast({
        title: 'No Data Available',
        description: `No AI options analysis available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const contentToCopy = viewMode === 'formatted' 
      ? optionsAnalysisData.analysis || formatJsonData(optionsAnalysisData.raw)
      : formatJsonData(optionsAnalysisData.raw);
    
    const success = await copyToClipboard(contentToCopy);
    
    if (success) {
      toast({
        title: 'Copied to Clipboard',
        description: `${displayTicker} AI options analysis copied successfully.`,
      });
    } else {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy data to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Export handler
  const handleExport = () => {
    if (!userTickerState.aiOptionsAnalysisJson) {
      toast({
        title: 'No Data Available',
        description: `No AI options analysis available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const contentToExport = viewMode === 'formatted' && optionsAnalysisData.analysis
      ? optionsAnalysisData.analysis
      : formatJsonData(optionsAnalysisData.raw);
    
    const fileExtension = viewMode === 'formatted' && optionsAnalysisData.analysis ? 'md' : 'json';
    const mimeType = viewMode === 'formatted' && optionsAnalysisData.analysis ? 'text/markdown' : 'application/json';
    const filename = `${currentTicker || 'unknown'}-ai-options-analysis-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    
    // Create download link
    const blob = new Blob([contentToExport], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: `${displayTicker} AI options analysis exported as ${filename}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {displayTicker} AI Options Analysis
        </CardTitle>
        <CardDescription>
          {currentTicker 
            ? `AI-powered options trading analysis and strategies for ${currentTicker}`
            : "Select a ticker symbol to view AI options analysis"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={userTickerState.hasAiOptionsAnalysis ? "default" : "secondary"}>
                {userTickerState.hasAiOptionsAnalysis ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" />Data Available</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" />No Data</>
                )}
              </Badge>
              {optionsAnalysisData.confidence && (
                <Badge variant="outline">
                  Confidence: {optionsAnalysisData.confidence}%
                </Badge>
              )}
              {isAiLoading && (
                <Badge variant="outline">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  AI Processing...
                </Badge>
              )}
              {isLoading && !isAiLoading && (
                <Badge variant="outline">Loading...</Badge>
              )}
              {!currentTicker && (
                <Badge variant="outline">No Ticker</Badge>
              )}
              {currentTicker && !userTickerState.isTickerValid && (
                <Badge variant="destructive">Invalid Ticker</Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
                variant="ghost"
                size="sm"
                disabled={!userTickerState.aiOptionsAnalysisJson}
              >
                {viewMode === 'formatted' ? 'Show Raw' : 'Show Formatted'}
              </Button>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                disabled={!userTickerState.aiOptionsAnalysisJson}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                disabled={!userTickerState.aiOptionsAnalysisJson}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Levels */}
          {optionsAnalysisData.keyLevels && Object.keys(optionsAnalysisData.keyLevels).length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Key Price Levels</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {Object.entries(optionsAnalysisData.keyLevels).map(([level, value]: [string, any]) => (
                  <div key={level}>
                    <span className="text-muted-foreground capitalize">{level.replace('_', ' ')}:</span>
                    <span className="ml-2 font-medium">
                      {typeof value === 'number' ? `$${value.toFixed(2)}` : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Strategies */}
          {optionsAnalysisData.strategies && optionsAnalysisData.strategies.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Recommended Strategies</h4>
              <ul className="text-sm space-y-2">
                {optionsAnalysisData.strategies.map((strategy: any, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <div>
                      <div className="font-medium">
                        {typeof strategy === 'string' ? strategy : strategy.name || strategy.strategy}
                      </div>
                      {typeof strategy === 'object' && strategy.description && (
                        <div className="text-muted-foreground mt-1">
                          {strategy.description}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Assessment */}
          {optionsAnalysisData.riskAssessment && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Risk Assessment</h4>
              <div className="text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {optionsAnalysisData.riskAssessment}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Summary */}
          {optionsAnalysisData.summary && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Analysis Summary</h4>
              <div className="text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {optionsAnalysisData.summary}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Options Analysis Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                {viewMode === 'formatted' ? 'AI Options Analysis' : 'Raw JSON Data'}
              </h4>
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>
            
            <div className="border rounded-lg">
              <div className={`p-4 text-sm overflow-auto bg-muted/50 ${
                isExpanded ? 'max-h-none' : 'max-h-96'
              }`}>
                {isAiLoading ? (
                  <div className="text-center text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating AI options analysis for {currentTicker}...
                  </div>
                ) : isLoading && currentTicker ? (
                  <div className="text-center text-muted-foreground">
                    Loading {currentTicker} data for AI options analysis...
                  </div>
                ) : !currentTicker ? (
                  <div className="text-center text-muted-foreground">
                    No ticker selected
                  </div>
                ) : !userTickerState.aiOptionsAnalysisJson ? (
                  <div className="text-center text-muted-foreground">
                    No AI options analysis available. Use the "AI Options Analysis" button to generate insights.
                  </div>
                ) : viewMode === 'formatted' && optionsAnalysisData.analysis ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {optionsAnalysisData.analysis}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre>
                    <code>{formatJsonData(optionsAnalysisData.raw)}</code>
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Timestamp */}
          {optionsAnalysisData.timestamp && (
            <div className="text-xs text-muted-foreground">
              Analysis generated: {new Date(optionsAnalysisData.timestamp).toLocaleString()}
            </div>
          )}

          {/* Error State */}
          {userTickerState.tickerValidationError && (
            <div className="text-sm text-destructive">
              {userTickerState.tickerValidationError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}