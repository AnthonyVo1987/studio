"use client";

/**
 * @fileOverview User Ticker AI Key Takeaways Display - Dynamic Ticker Component
 * 
 * This component is ticker-agnostic and works with any ticker symbol from
 * the user-ticker-analysis-context. It displays AI-generated key takeaways
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
import { Copy, Download, Lightbulb, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// User Ticker Context
import { useUserTickerAnalysis } from "@/contexts/user-ticker-analysis-context";

// Export utilities
import { copyToClipboard } from "@/lib/export-utils";

export function UserTickerAiKeyTakeawaysDisplay() {
  const userTickerState = useUserTickerAnalysis();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  // Get current ticker for display
  const currentTicker = userTickerState.currentTicker || '';
  const displayTicker = currentTicker || 'No Ticker Selected';

  // Safe JSON parsing pattern
  const takeawaysData = userTickerState.aiKeyTakeawaysJson ? (() => {
    try {
      const parsed = JSON.parse(userTickerState.aiKeyTakeawaysJson);
      return {
        raw: parsed,
        isValid: !!parsed && typeof parsed === 'object',
        takeaways: parsed.takeaways || parsed.content || parsed.response || '',
        summary: parsed.summary || '',
        keyPoints: parsed.keyPoints || parsed.key_points || [],
        recommendations: parsed.recommendations || [],
        confidence: parsed.confidence || null,
        timestamp: parsed.timestamp || parsed.lastUpdated || new Date().toISOString()
      };
    } catch (e) {
      return {
        raw: {},
        isValid: false,
        takeaways: '',
        summary: '',
        keyPoints: [],
        recommendations: [],
        confidence: null,
        timestamp: null
      };
    }
  })() : {
    raw: {},
    isValid: false,
    takeaways: '',
    summary: '',
    keyPoints: [],
    recommendations: [],
    confidence: null,
    timestamp: null
  };

  // Derive loading state from FSM state and data availability
  const isLoading = userTickerState.status === 'loading' || 
                   (currentTicker && userTickerState.isTickerValid && !userTickerState.dataRetrievalComplete);

  // Check if AI Key Takeaways is currently loading (separate from main FSM)
  const isAiLoading = userTickerState.isAiKeyTakeawaysLoading;

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
    if (!userTickerState.aiKeyTakeawaysJson) {
      toast({
        title: 'No Data Available',
        description: `No AI key takeaways available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const contentToCopy = viewMode === 'formatted' 
      ? takeawaysData.takeaways || formatJsonData(takeawaysData.raw)
      : formatJsonData(takeawaysData.raw);
    
    const success = await copyToClipboard(contentToCopy);
    
    if (success) {
      toast({
        title: 'Copied to Clipboard',
        description: `${displayTicker} AI key takeaways copied successfully.`,
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
    if (!userTickerState.aiKeyTakeawaysJson) {
      toast({
        title: 'No Data Available',
        description: `No AI key takeaways available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const contentToExport = viewMode === 'formatted' && takeawaysData.takeaways
      ? takeawaysData.takeaways
      : formatJsonData(takeawaysData.raw);
    
    const fileExtension = viewMode === 'formatted' && takeawaysData.takeaways ? 'md' : 'json';
    const mimeType = viewMode === 'formatted' && takeawaysData.takeaways ? 'text/markdown' : 'application/json';
    const filename = `${currentTicker || 'unknown'}-ai-key-takeaways-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    
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
      description: `${displayTicker} AI key takeaways exported as ${filename}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          {displayTicker} AI Key Takeaways
        </CardTitle>
        <CardDescription>
          {currentTicker 
            ? `AI-generated key insights and takeaways for ${currentTicker}`
            : "Select a ticker symbol to view AI key takeaways"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={userTickerState.hasAiKeyTakeaways ? "default" : "secondary"}>
                {userTickerState.hasAiKeyTakeaways ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" />Data Available</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" />No Data</>
                )}
              </Badge>
              {takeawaysData.confidence && (
                <Badge variant="outline">
                  Confidence: {takeawaysData.confidence}%
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
                disabled={!userTickerState.aiKeyTakeawaysJson}
              >
                {viewMode === 'formatted' ? 'Show Raw' : 'Show Formatted'}
              </Button>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                disabled={!userTickerState.aiKeyTakeawaysJson}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                disabled={!userTickerState.aiKeyTakeawaysJson}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Points Summary */}
          {takeawaysData.keyPoints && takeawaysData.keyPoints.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Key Points</h4>
              <ul className="text-sm space-y-1">
                {takeawaysData.keyPoints.map((point: any, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{typeof point === 'string' ? point : point.text || point.point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          {takeawaysData.summary && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Executive Summary</h4>
              <div className="text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {takeawaysData.summary}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {takeawaysData.recommendations && takeawaysData.recommendations.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="text-sm space-y-1">
                {takeawaysData.recommendations.map((rec: any, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600">→</span>
                    <span>{typeof rec === 'string' ? rec : rec.text || rec.recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Takeaways Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                {viewMode === 'formatted' ? 'AI Key Takeaways' : 'Raw JSON Data'}
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
                    Generating AI key takeaways for {currentTicker}...
                  </div>
                ) : isLoading && currentTicker ? (
                  <div className="text-center text-muted-foreground">
                    Loading {currentTicker} data for AI analysis...
                  </div>
                ) : !currentTicker ? (
                  <div className="text-center text-muted-foreground">
                    No ticker selected
                  </div>
                ) : !userTickerState.aiKeyTakeawaysJson ? (
                  <div className="text-center text-muted-foreground">
                    No AI key takeaways available. Use the "AI Key Takeaways" button to generate insights.
                  </div>
                ) : viewMode === 'formatted' && takeawaysData.takeaways ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {takeawaysData.takeaways}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre>
                    <code>{formatJsonData(takeawaysData.raw)}</code>
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Timestamp */}
          {takeawaysData.timestamp && (
            <div className="text-xs text-muted-foreground">
              Analysis generated: {new Date(takeawaysData.timestamp).toLocaleString()}
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