'use client';

/**
 * @fileOverview User Ticker Data Section - Dynamic Ticker Component
 * 
 * This component is ticker-agnostic and works with any ticker symbol from
 * the user-ticker-analysis-context. It displays all raw data sections with
 * export functionality for the currently selected ticker.
 * 
 * ARCHITECTURE PATTERN:
 * - Direct context consumption via useUserTickerAnalysis hook
 * - Safe JSON parsing with error handling
 * - Loading state derivation from FSM and data flags
 * - Dynamic ticker display with proper fallback handling
 * - Consistent error handling for cases with no ticker set
 * - Comprehensive export functionality (individual and bulk)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Database, CheckCircle2, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// User Ticker Context
import { useUserTickerAnalysis } from '@/contexts/user-ticker-analysis-context';

// Export utilities (reused from existing codebase)
import { copyToClipboard } from '@/lib/export-utils';

export function UserTickerDataSection() {
  const userTickerState = useUserTickerAnalysis();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('stock-snapshot');

  // Get current ticker for display
  const currentTicker = userTickerState.currentTicker || '';
  const displayTicker = currentTicker || 'No Ticker Selected';

  // Data sections with status indicators
  const dataSections = [
    {
      id: 'stock-snapshot',
      title: 'Stock Snapshot',
      data: userTickerState.stockSnapshotJson,
      hasData: userTickerState.hasStockData,
    },
    {
      id: 'market-status',
      title: 'Market Status',
      data: userTickerState.marketStatusJson,
      hasData: userTickerState.hasStockData,
    },
    {
      id: 'options-chain',
      title: 'Options Chain',
      data: userTickerState.optionsChainJson,
      hasData: userTickerState.hasOptionsChainData,
    },
    {
      id: 'standard-ta',
      title: 'Standard TA',
      data: userTickerState.standardTasJson,
      hasData: userTickerState.hasAiTaData,
    },
    {
      id: 'ai-analyzed-ta',
      title: 'AI Analyzed TA',
      data: userTickerState.aiAnalyzedTaJson,
      hasData: userTickerState.hasAiTaData,
    },
    {
      id: 'ai-key-takeaways',
      title: 'AI Key Takeaways',
      data: userTickerState.aiKeyTakeawaysJson,
      hasData: userTickerState.hasAiKeyTakeaways,
    },
    {
      id: 'ai-options-analysis',
      title: 'AI Options Analysis',
      data: userTickerState.aiOptionsAnalysisJson,
      hasData: userTickerState.hasAiOptionsAnalysis,
    },
  ];

  // Helper to get formatted JSON
  const formatJsonData = (jsonString: string) => {
    if (!jsonString) return 'No data available';
    
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return jsonString; // Return raw string if not valid JSON
    }
  };

  // Copy handler
  const handleCopy = async (data: string, title: string) => {
    if (!data) {
      toast({
        title: 'No Data Available',
        description: `No ${title.toLowerCase()} data available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const formattedData = formatJsonData(data);
    const success = await copyToClipboard(formattedData);
    
    if (success) {
      toast({
        title: 'Copied to Clipboard',
        description: `${displayTicker} ${title} data copied successfully.`,
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
  const handleExport = (data: string, title: string) => {
    if (!data) {
      toast({
        title: 'No Data Available',
        description: `No ${title.toLowerCase()} data available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    const formattedData = formatJsonData(data);
    const filename = `${currentTicker || 'unknown'}-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    
    // Create download link
    const blob = new Blob([formattedData], { type: 'application/json' });
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
      description: `${displayTicker} ${title} data exported as ${filename}.`,
    });
  };

  // Unified Copy All Handler
  const handleCopyAll = async () => {
    const safeJsonParse = (jsonString: string) => {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        return { error: 'Failed to parse JSON', raw: jsonString };
      }
    };

    const allData = {
      ticker: currentTicker,
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: userTickerState.stockSnapshotJson ? safeJsonParse(userTickerState.stockSnapshotJson) : null,
        marketStatus: userTickerState.marketStatusJson ? safeJsonParse(userTickerState.marketStatusJson) : null,
        optionsChain: userTickerState.optionsChainJson ? safeJsonParse(userTickerState.optionsChainJson) : null,
        standardTa: userTickerState.standardTasJson ? safeJsonParse(userTickerState.standardTasJson) : null,
        aiAnalyzedTa: userTickerState.aiAnalyzedTaJson ? safeJsonParse(userTickerState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: userTickerState.aiKeyTakeawaysJson ? safeJsonParse(userTickerState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: userTickerState.aiOptionsAnalysisJson ? safeJsonParse(userTickerState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(allData, null, 2);
    const success = await copyToClipboard(formattedData);
    
    if (success) {
      toast({
        title: 'All Data Copied',
        description: `Complete ${displayTicker} dataset copied to clipboard.`,
      });
    } else {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy all data to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Unified Export All Handler
  const handleExportAll = () => {
    const safeJsonParse = (jsonString: string) => {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        return { error: 'Failed to parse JSON', raw: jsonString };
      }
    };

    const allData = {
      ticker: currentTicker,
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: userTickerState.stockSnapshotJson ? safeJsonParse(userTickerState.stockSnapshotJson) : null,
        marketStatus: userTickerState.marketStatusJson ? safeJsonParse(userTickerState.marketStatusJson) : null,
        optionsChain: userTickerState.optionsChainJson ? safeJsonParse(userTickerState.optionsChainJson) : null,
        standardTa: userTickerState.standardTasJson ? safeJsonParse(userTickerState.standardTasJson) : null,
        aiAnalyzedTa: userTickerState.aiAnalyzedTaJson ? safeJsonParse(userTickerState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: userTickerState.aiKeyTakeawaysJson ? safeJsonParse(userTickerState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: userTickerState.aiOptionsAnalysisJson ? safeJsonParse(userTickerState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(allData, null, 2);
    const filename = `${currentTicker || 'unknown'}-complete-dataset-${new Date().toISOString().split('T')[0]}.json`;
    
    // Create download link
    const blob = new Blob([formattedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'All Data Exported',
      description: `Complete ${displayTicker} dataset exported as ${filename}.`,
    });
  };

  // Helper function to generate truncated options chain summary
  const generateOptionsChainSummary = (optionsChainJson: string) => {
    if (!optionsChainJson) return null;
    
    try {
      const parsed = JSON.parse(optionsChainJson);
      
      // Extract summary statistics instead of full strike data
      const summary = {
        status: parsed.status,
        request_id: parsed.request_id,
        next_url: parsed.next_url,
        summary: {
          total_results: parsed.results?.length || 0,
          call_count: parsed.results?.filter((option: any) => option.contract_type === 'call')?.length || 0,
          put_count: parsed.results?.filter((option: any) => option.contract_type === 'put')?.length || 0,
          strike_range: parsed.results?.length > 0 ? {
            min_strike: Math.min(...parsed.results.map((option: any) => option.strike_price || 0)),
            max_strike: Math.max(...parsed.results.map((option: any) => option.strike_price || 0))
          } : null,
          expiration_dates: [...new Set(parsed.results?.map((option: any) => option.expiration_date) || [])],
        },
        note: "Full strike details excluded in truncated version - use 'Copy ALL' or 'Export ALL' for complete data"
      };
      
      return summary;
    } catch (e) {
      return { error: 'Failed to parse options chain JSON', raw: optionsChainJson };
    }
  };

  // Truncated Copy All Handler (excludes full options chain data)
  const handleCopyTruncated = async () => {
    const safeJsonParse = (jsonString: string) => {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        return { error: 'Failed to parse JSON', raw: jsonString };
      }
    };

    const truncatedData = {
      ticker: currentTicker,
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: userTickerState.stockSnapshotJson ? safeJsonParse(userTickerState.stockSnapshotJson) : null,
        marketStatus: userTickerState.marketStatusJson ? safeJsonParse(userTickerState.marketStatusJson) : null,
        optionsChainSummary: generateOptionsChainSummary(userTickerState.optionsChainJson),
        standardTa: userTickerState.standardTasJson ? safeJsonParse(userTickerState.standardTasJson) : null,
        aiAnalyzedTa: userTickerState.aiAnalyzedTaJson ? safeJsonParse(userTickerState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: userTickerState.aiKeyTakeawaysJson ? safeJsonParse(userTickerState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: userTickerState.aiOptionsAnalysisJson ? safeJsonParse(userTickerState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(truncatedData, null, 2);
    const success = await copyToClipboard(formattedData);
    
    if (success) {
      toast({
        title: 'Truncated Data Copied',
        description: `${displayTicker} dataset (without full options chain) copied to clipboard.`,
      });
    } else {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy truncated data to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Truncated Export All Handler (excludes full options chain data)
  const handleExportTruncated = () => {
    const safeJsonParse = (jsonString: string) => {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        return { error: 'Failed to parse JSON', raw: jsonString };
      }
    };

    const truncatedData = {
      ticker: currentTicker,
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: userTickerState.stockSnapshotJson ? safeJsonParse(userTickerState.stockSnapshotJson) : null,
        marketStatus: userTickerState.marketStatusJson ? safeJsonParse(userTickerState.marketStatusJson) : null,
        optionsChainSummary: generateOptionsChainSummary(userTickerState.optionsChainJson),
        standardTa: userTickerState.standardTasJson ? safeJsonParse(userTickerState.standardTasJson) : null,
        aiAnalyzedTa: userTickerState.aiAnalyzedTaJson ? safeJsonParse(userTickerState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: userTickerState.aiKeyTakeawaysJson ? safeJsonParse(userTickerState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: userTickerState.aiOptionsAnalysisJson ? safeJsonParse(userTickerState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(truncatedData, null, 2);
    const filename = `${currentTicker || 'unknown'}-truncated-dataset-${new Date().toISOString().split('T')[0]}.json`;
    
    // Create download link
    const blob = new Blob([formattedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Truncated Data Exported',
      description: `${displayTicker} dataset (without full options chain) exported as ${filename}.`,
    });
  };

  // Find active section
  const activeSection = dataSections.find(section => section.id === activeTab);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {displayTicker} Raw Data
        </CardTitle>
        <CardDescription>
          {currentTicker 
            ? `All API responses and processed data for ${currentTicker} analysis`
            : "Select a ticker symbol to view raw data"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Unified Export ALL Data Actions */}
        <div className="flex flex-col gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
          <div>
            <h3 className="text-lg font-semibold">Export All {displayTicker} Data</h3>
            <p className="text-sm text-muted-foreground">
              {currentTicker 
                ? `Copy or export all available ${currentTicker} data in one action`
                : "Select a ticker to export data"
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => handleCopyAll()}
              variant="outline"
              size="sm"
              disabled={!currentTicker}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy ALL
            </Button>
            <Button
              onClick={() => handleExportAll()}
              variant="outline"
              size="sm"
              disabled={!currentTicker}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export ALL
            </Button>
            <Button
              onClick={() => handleCopyTruncated()}
              variant="outline"
              size="sm"
              disabled={!currentTicker}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Truncated
            </Button>
            <Button
              onClick={() => handleExportTruncated()}
              variant="outline"
              size="sm"
              disabled={!currentTicker}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Truncated
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Truncated version:</strong> Excludes full options chain data, includes summary statistics only (strike count, call/put count, strike range).
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 mb-4">
            {dataSections.map((section) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id} 
                className="text-xs flex items-center gap-1"
              >
                {section.hasData ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Circle className="h-3 w-3 text-gray-400" />
                )}
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {dataSections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-4">
              {/* Section Header with Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <Badge variant={section.hasData ? "default" : "secondary"}>
                    {section.hasData ? "Data Available" : "No Data"}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCopy(section.data, section.title)}
                    variant="outline"
                    size="sm"
                    disabled={!section.data}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    onClick={() => handleExport(section.data, section.title)}
                    variant="outline"
                    size="sm"
                    disabled={!section.data}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* JSON Data Display */}
              <div className="border rounded-lg">
                <pre className="p-4 text-sm overflow-auto max-h-96 bg-muted/50">
                  <code>
                    {section.data
                      ? formatJsonData(section.data)
                      : currentTicker
                      ? `No ${section.title.toLowerCase()} data available for ${currentTicker}`
                      : `Select a ticker to view ${section.title.toLowerCase()} data`
                    }
                  </code>
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Data Summary */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">{displayTicker} Data Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2 capitalize">{userTickerState.status}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Current Ticker:</span>
              <span className="ml-2">{currentTicker || 'None'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Selected Expiration:</span>
              <span className="ml-2">{userTickerState.selectedExpirationDate || 'None'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Stock Data:</span>
              <span className="ml-2">{userTickerState.hasStockData ? 'Loaded' : 'Not Loaded'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Options Data:</span>
              <span className="ml-2">{userTickerState.hasOptionsChainData ? 'Loaded' : 'Not Loaded'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">AI Data:</span>
              <span className="ml-2">{userTickerState.hasAiTaData ? 'Loaded' : 'Not Loaded'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ticker Valid:</span>
              <span className="ml-2">{userTickerState.isTickerValid ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {userTickerState.tickerValidationError && (
          <div className="mt-4 text-sm text-destructive">
            {userTickerState.tickerValidationError}
          </div>
        )}
      </CardContent>
    </Card>
  );
}