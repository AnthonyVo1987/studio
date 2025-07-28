'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Database, CheckCircle2, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// SPY Context
import { useSpyAnalysis, SPY_TICKER } from '@/contexts/spy-analysis-context';

// Export utilities (reused from existing codebase)
import { copyToClipboard } from '@/lib/export-utils';

export function SpyDataSection() {
  const spyState = useSpyAnalysis();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('stock-snapshot');

  // Data sections with status indicators
  const dataSections = [
    {
      id: 'stock-snapshot',
      title: 'Stock Snapshot',
      data: spyState.stockSnapshotJson,
      hasData: spyState.hasStockData,
    },
    {
      id: 'market-status',
      title: 'Market Status',
      data: spyState.marketStatusJson,
      hasData: spyState.hasStockData,
    },
    {
      id: 'options-chain',
      title: 'Options Chain',
      data: spyState.optionsChainJson,
      hasData: spyState.hasOptionsChainData,
    },
    {
      id: 'standard-ta',
      title: 'Standard TA',
      data: spyState.standardTaJson,
      hasData: spyState.hasAiTaData,
    },
    {
      id: 'ai-analyzed-ta',
      title: 'AI Analyzed TA',
      data: spyState.aiAnalyzedTaJson,
      hasData: spyState.hasAiTaData,
    },
    {
      id: 'ai-key-takeaways',
      title: 'AI Key Takeaways',
      data: spyState.aiKeyTakeawaysJson,
      hasData: spyState.hasAiKeyTakeaways,
    },
    {
      id: 'ai-options-analysis',
      title: 'AI Options Analysis',
      data: spyState.aiOptionsAnalysisJson,
      hasData: spyState.hasAiOptionsAnalysis,
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
    const formattedData = formatJsonData(data);
    const success = await copyToClipboard(formattedData);
    
    if (success) {
      toast({
        title: 'Copied to Clipboard',
        description: `${SPY_TICKER} ${title} data copied successfully.`,
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
    const formattedData = formatJsonData(data);
    const filename = `spy-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    
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
      description: `${SPY_TICKER} ${title} data exported as ${filename}.`,
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
      ticker: SPY_TICKER,
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: spyState.stockSnapshotJson ? safeJsonParse(spyState.stockSnapshotJson) : null,
        marketStatus: spyState.marketStatusJson ? safeJsonParse(spyState.marketStatusJson) : null,
        optionsChain: spyState.optionsChainJson ? safeJsonParse(spyState.optionsChainJson) : null,
        standardTa: spyState.standardTaJson ? safeJsonParse(spyState.standardTaJson) : null,
        aiAnalyzedTa: spyState.aiAnalyzedTaJson ? safeJsonParse(spyState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: spyState.aiKeyTakeawaysJson ? safeJsonParse(spyState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: spyState.aiOptionsAnalysisJson ? safeJsonParse(spyState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(allData, null, 2);
    const success = await copyToClipboard(formattedData);
    
    if (success) {
      toast({
        title: 'All SPY Data Copied',
        description: `Complete ${SPY_TICKER} dataset copied to clipboard.`,
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
      ticker: SPY_TICKER,
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: spyState.stockSnapshotJson ? safeJsonParse(spyState.stockSnapshotJson) : null,
        marketStatus: spyState.marketStatusJson ? safeJsonParse(spyState.marketStatusJson) : null,
        optionsChain: spyState.optionsChainJson ? safeJsonParse(spyState.optionsChainJson) : null,
        standardTa: spyState.standardTaJson ? safeJsonParse(spyState.standardTaJson) : null,
        aiAnalyzedTa: spyState.aiAnalyzedTaJson ? safeJsonParse(spyState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: spyState.aiKeyTakeawaysJson ? safeJsonParse(spyState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: spyState.aiOptionsAnalysisJson ? safeJsonParse(spyState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(allData, null, 2);
    const filename = `spy-complete-dataset-${new Date().toISOString().split('T')[0]}.json`;
    
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
      title: 'All SPY Data Exported',
      description: `Complete ${SPY_TICKER} dataset exported as ${filename}.`,
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
      ticker: SPY_TICKER,
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: spyState.stockSnapshotJson ? safeJsonParse(spyState.stockSnapshotJson) : null,
        marketStatus: spyState.marketStatusJson ? safeJsonParse(spyState.marketStatusJson) : null,
        optionsChainSummary: generateOptionsChainSummary(spyState.optionsChainJson),
        standardTa: spyState.standardTaJson ? safeJsonParse(spyState.standardTaJson) : null,
        aiAnalyzedTa: spyState.aiAnalyzedTaJson ? safeJsonParse(spyState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: spyState.aiKeyTakeawaysJson ? safeJsonParse(spyState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: spyState.aiOptionsAnalysisJson ? safeJsonParse(spyState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(truncatedData, null, 2);
    const success = await copyToClipboard(formattedData);
    
    if (success) {
      toast({
        title: 'Truncated SPY Data Copied',
        description: `${SPY_TICKER} dataset (without full options chain) copied to clipboard.`,
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
      ticker: SPY_TICKER,
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: spyState.stockSnapshotJson ? safeJsonParse(spyState.stockSnapshotJson) : null,
        marketStatus: spyState.marketStatusJson ? safeJsonParse(spyState.marketStatusJson) : null,
        optionsChainSummary: generateOptionsChainSummary(spyState.optionsChainJson),
        standardTa: spyState.standardTaJson ? safeJsonParse(spyState.standardTaJson) : null,
        aiAnalyzedTa: spyState.aiAnalyzedTaJson ? safeJsonParse(spyState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: spyState.aiKeyTakeawaysJson ? safeJsonParse(spyState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: spyState.aiOptionsAnalysisJson ? safeJsonParse(spyState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(truncatedData, null, 2);
    const filename = `spy-truncated-dataset-${new Date().toISOString().split('T')[0]}.json`;
    
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
      title: 'Truncated SPY Data Exported',
      description: `${SPY_TICKER} dataset (without full options chain) exported as ${filename}.`,
    });
  };

  // Find active section
  const activeSection = dataSections.find(section => section.id === activeTab);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {SPY_TICKER} Raw Data
        </CardTitle>
        <CardDescription>
          All API responses and processed data for {SPY_TICKER} analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Unified Export ALL SPY Data Actions */}
        <div className="flex flex-col gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
          <div>
            <h3 className="text-lg font-semibold">Export All {SPY_TICKER} Data</h3>
            <p className="text-sm text-muted-foreground">Copy or export all available SPY data in one action</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => handleCopyAll()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy ALL
            </Button>
            <Button
              onClick={() => handleExportAll()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export ALL
            </Button>
            <Button
              onClick={() => handleCopyTruncated()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Truncated
            </Button>
            <Button
              onClick={() => handleExportTruncated()}
              variant="outline"
              size="sm"
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
                
              </div>

              {/* JSON Data Display */}
              <div className="border rounded-lg">
                <pre className="p-4 text-sm overflow-auto max-h-96 bg-muted/50">
                  <code>
                    {formatJsonData(section.data)}
                  </code>
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Data Summary */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">{SPY_TICKER} Data Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2 capitalize">{spyState.status}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Selected Expiration:</span>
              <span className="ml-2">{spyState.selectedExpirationDate || 'None'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Stock Data:</span>
              <span className="ml-2">{spyState.hasStockData ? 'Loaded' : 'Not Loaded'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Options Data:</span>
              <span className="ml-2">{spyState.hasOptionsChainData ? 'Loaded' : 'Not Loaded'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">AI Data:</span>
              <span className="ml-2">{spyState.hasAiTaData ? 'Loaded' : 'Not Loaded'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}