"use client";

/**
 * @fileOverview User Ticker AI Analyzed TA Display - Dynamic Ticker Component
 * 
 * This component is ticker-agnostic and works with any ticker symbol from
 * the user-ticker-analysis-context. It displays AI-analyzed technical analysis
 * data for the currently selected ticker.
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
import { Copy, Download, Brain, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// User Ticker Context
import { useUserTickerAnalysis } from "@/contexts/user-ticker-analysis-context";

// Export utilities
import { copyToClipboard } from "@/lib/export-utils";

export function UserTickerAiAnalyzedTaDisplay() {
  const userTickerState = useUserTickerAnalysis();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  // Get current ticker for display
  const currentTicker = userTickerState.currentTicker || '';
  const displayTicker = currentTicker || 'No Ticker Selected';

  // Safe JSON parsing pattern
  const aiTaData = userTickerState.aiAnalyzedTaJson ? (() => {
    try {
      const parsed = JSON.parse(userTickerState.aiAnalyzedTaJson);
      return {
        raw: parsed,
        isValid: !!parsed && typeof parsed === 'object',
        analysis: parsed.analysis || parsed.content || parsed.response || '',
        summary: parsed.summary || '',
        recommendations: parsed.recommendations || [],
        confidence: parsed.confidence || null,
        timestamp: parsed.timestamp || parsed.lastUpdated || new Date().toISOString()
      };
    } catch (e) {
      return {
        raw: {},
        isValid: false,
        analysis: '',
        summary: '',
        recommendations: [],
        confidence: null,
        timestamp: null
      };
    }
  })() : {
    raw: {},
    isValid: false,
    analysis: '',
    summary: '',
    recommendations: [],
    confidence: null,
    timestamp: null
  };

  // Derive loading state from FSM state and data availability
  const isLoading = userTickerState.status === 'loading' || 
                   (currentTicker && userTickerState.isTickerValid && !userTickerState.dataRetrievalComplete);

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
    if (!userTickerState.aiAnalyzedTaJson) {
      toast({
        title: 'No Data Available',
        description: `No AI analyzed TA data available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const contentToCopy = viewMode === 'formatted' 
      ? aiTaData.analysis || formatJsonData(aiTaData.raw)
      : formatJsonData(aiTaData.raw);
    
    const success = await copyToClipboard(contentToCopy);
    
    if (success) {
      toast({
        title: 'Copied to Clipboard',
        description: `${displayTicker} AI analyzed TA data copied successfully.`,
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
    if (!userTickerState.aiAnalyzedTaJson) {
      toast({
        title: 'No Data Available',
        description: `No AI analyzed TA data available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const contentToExport = viewMode === 'formatted' && aiTaData.analysis
      ? aiTaData.analysis
      : formatJsonData(aiTaData.raw);
    
    const fileExtension = viewMode === 'formatted' && aiTaData.analysis ? 'md' : 'json';
    const mimeType = viewMode === 'formatted' && aiTaData.analysis ? 'text/markdown' : 'application/json';
    const filename = `${currentTicker || 'unknown'}-ai-analyzed-ta-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    
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
      description: `${displayTicker} AI analyzed TA data exported as ${filename}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5" />
          {displayTicker} AI Analyzed Technical Analysis
        </CardTitle>
        <CardDescription>
          {currentTicker 
            ? `AI-powered technical analysis and insights for ${currentTicker}`
            : "Select a ticker symbol to view AI technical analysis"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={userTickerState.hasAiTaData ? "default" : "secondary"}>
                {userTickerState.hasAiTaData ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" />Data Available</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" />No Data</>
                )}
              </Badge>
              {aiTaData.confidence && (
                <Badge variant="outline">
                  Confidence: {aiTaData.confidence}%
                </Badge>
              )}
              {isLoading && (
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
                disabled={!userTickerState.aiAnalyzedTaJson}
              >
                {viewMode === 'formatted' ? 'Show Raw' : 'Show Formatted'}
              </Button>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                disabled={!userTickerState.aiAnalyzedTaJson}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                disabled={!userTickerState.aiAnalyzedTaJson}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* AI Analysis Summary */}
          {aiTaData.summary && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Analysis Summary</h4>
              <div className="text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aiTaData.summary}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {aiTaData.recommendations && aiTaData.recommendations.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Key Recommendations</h4>
              <ul className="text-sm space-y-1">
                {aiTaData.recommendations.map((rec: any, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{typeof rec === 'string' ? rec : rec.text || rec.recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Analysis Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                {viewMode === 'formatted' ? 'AI Analysis' : 'Raw JSON Data'}
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
                {isLoading && currentTicker ? (
                  <div className="text-center text-muted-foreground">
                    Loading {currentTicker} AI technical analysis...
                  </div>
                ) : !currentTicker ? (
                  <div className="text-center text-muted-foreground">
                    No ticker selected
                  </div>
                ) : !userTickerState.aiAnalyzedTaJson ? (
                  <div className="text-center text-muted-foreground">
                    No AI analyzed TA data available
                  </div>
                ) : viewMode === 'formatted' && aiTaData.analysis ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aiTaData.analysis}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre>
                    <code>{formatJsonData(aiTaData.raw)}</code>
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Timestamp */}
          {aiTaData.timestamp && (
            <div className="text-xs text-muted-foreground">
              Analysis generated: {new Date(aiTaData.timestamp).toLocaleString()}
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