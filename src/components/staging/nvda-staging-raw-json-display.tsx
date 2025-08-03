'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Database, CheckCircle2, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// NVDA Staging Context
import { useNvdaStagingAnalysis, NVDA_STAGING_TICKER } from '@/contexts/nvda-staging-analysis-context';

// Export utilities (reused from existing codebase)
import { copyToClipboard } from '@/lib/export-utils';

export function NvdaStagingRawJsonDisplay() {
  const stagingState = useNvdaStagingAnalysis();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('stock-snapshot');

  // Data sections with status indicators
  const dataSections = [
    {
      id: 'stock-snapshot',
      title: 'Stock Snapshot',
      data: stagingState.stockSnapshotJson,
      hasData: stagingState.hasStockData,
    },
    {
      id: 'market-status',
      title: 'Market Status',
      data: stagingState.marketStatusJson,
      hasData: stagingState.hasStockData,
    },
    {
      id: 'options-chain',
      title: 'Options Chain',
      data: stagingState.optionsChainJson,
      hasData: stagingState.hasOptionsChainData,
    },
    {
      id: 'standard-ta',
      title: 'Standard TA',
      data: stagingState.standardTasJson,
      hasData: stagingState.hasAiTaData,
    },
    {
      id: 'ai-analyzed-ta',
      title: 'AI Analyzed TA',
      data: stagingState.aiAnalyzedTaJson,
      hasData: stagingState.hasAiTaData,
    },
    {
      id: 'ai-key-takeaways',
      title: 'AI Key Takeaways',
      data: stagingState.aiKeyTakeawaysJson,
      hasData: stagingState.hasAiKeyTakeaways,
    },
    {
      id: 'ai-options-analysis',
      title: 'AI Options Analysis',
      data: stagingState.aiOptionsAnalysisJson,
      hasData: stagingState.hasAiOptionsAnalysis,
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
        title: 'Copied to Clipboard (Staging)',
        description: `${NVDA_STAGING_TICKER} ${title} data copied successfully.`,
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
    const filename = `nvda-staging-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    
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
      title: 'Export Complete (Staging)',
      description: `${NVDA_STAGING_TICKER} ${title} data exported as ${filename}.`,
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
      ticker: NVDA_STAGING_TICKER,
      environment: 'STAGING',
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: stagingState.stockSnapshotJson ? safeJsonParse(stagingState.stockSnapshotJson) : null,
        marketStatus: stagingState.marketStatusJson ? safeJsonParse(stagingState.marketStatusJson) : null,
        optionsChain: stagingState.optionsChainJson ? safeJsonParse(stagingState.optionsChainJson) : null,
        standardTa: stagingState.standardTasJson ? safeJsonParse(stagingState.standardTasJson) : null,
        aiAnalyzedTa: stagingState.aiAnalyzedTaJson ? safeJsonParse(stagingState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: stagingState.aiKeyTakeawaysJson ? safeJsonParse(stagingState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: stagingState.aiOptionsAnalysisJson ? safeJsonParse(stagingState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(allData, null, 2);
    const success = await copyToClipboard(formattedData);
    
    if (success) {
      toast({
        title: 'All NVDA Staging Data Copied',
        description: `Complete ${NVDA_STAGING_TICKER} staging dataset copied to clipboard.`,
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
      ticker: NVDA_STAGING_TICKER,
      environment: 'STAGING',
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: stagingState.stockSnapshotJson ? safeJsonParse(stagingState.stockSnapshotJson) : null,
        marketStatus: stagingState.marketStatusJson ? safeJsonParse(stagingState.marketStatusJson) : null,
        optionsChain: stagingState.optionsChainJson ? safeJsonParse(stagingState.optionsChainJson) : null,
        standardTa: stagingState.standardTasJson ? safeJsonParse(stagingState.standardTasJson) : null,
        aiAnalyzedTa: stagingState.aiAnalyzedTaJson ? safeJsonParse(stagingState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: stagingState.aiKeyTakeawaysJson ? safeJsonParse(stagingState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: stagingState.aiOptionsAnalysisJson ? safeJsonParse(stagingState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(allData, null, 2);
    const filename = `nvda-staging-complete-dataset-${new Date().toISOString().split('T')[0]}.json`;
    
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
      title: 'All NVDA Staging Data Exported',
      description: `Complete ${NVDA_STAGING_TICKER} staging dataset exported as ${filename}.`,
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
      ticker: NVDA_STAGING_TICKER,
      environment: 'STAGING',
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: stagingState.stockSnapshotJson ? safeJsonParse(stagingState.stockSnapshotJson) : null,
        marketStatus: stagingState.marketStatusJson ? safeJsonParse(stagingState.marketStatusJson) : null,
        optionsChainSummary: generateOptionsChainSummary(stagingState.optionsChainJson),
        standardTa: stagingState.standardTasJson ? safeJsonParse(stagingState.standardTasJson) : null,
        aiAnalyzedTa: stagingState.aiAnalyzedTaJson ? safeJsonParse(stagingState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: stagingState.aiKeyTakeawaysJson ? safeJsonParse(stagingState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: stagingState.aiOptionsAnalysisJson ? safeJsonParse(stagingState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(truncatedData, null, 2);
    const success = await copyToClipboard(formattedData);
    
    if (success) {
      toast({
        title: 'Truncated NVDA Staging Data Copied',
        description: `${NVDA_STAGING_TICKER} staging dataset (without full options chain) copied to clipboard.`,
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
      ticker: NVDA_STAGING_TICKER,
      environment: 'STAGING',
      timestamp: new Date().toISOString(),
      data: {
        stockSnapshot: stagingState.stockSnapshotJson ? safeJsonParse(stagingState.stockSnapshotJson) : null,
        marketStatus: stagingState.marketStatusJson ? safeJsonParse(stagingState.marketStatusJson) : null,
        optionsChainSummary: generateOptionsChainSummary(stagingState.optionsChainJson),
        standardTa: stagingState.standardTasJson ? safeJsonParse(stagingState.standardTasJson) : null,
        aiAnalyzedTa: stagingState.aiAnalyzedTaJson ? safeJsonParse(stagingState.aiAnalyzedTaJson) : null,
        aiKeyTakeaways: stagingState.aiKeyTakeawaysJson ? safeJsonParse(stagingState.aiKeyTakeawaysJson) : null,
        aiOptionsAnalysis: stagingState.aiOptionsAnalysisJson ? safeJsonParse(stagingState.aiOptionsAnalysisJson) : null,
      }
    };

    const formattedData = JSON.stringify(truncatedData, null, 2);
    const filename = `nvda-staging-truncated-dataset-${new Date().toISOString().split('T')[0]}.json`;
    
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
      title: 'Truncated NVDA Staging Data Exported',
      description: `${NVDA_STAGING_TICKER} staging dataset (without full options chain) exported as ${filename}.`,
    });
  };

  // Find active section
  const activeSection = dataSections.find(section => section.id === activeTab);

  return (
    <Card className="border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Database className="h-5 w-5" />
          {NVDA_STAGING_TICKER} Raw Data (Staging)
        </CardTitle>
        <CardDescription className="text-orange-700">
          All API responses and processed data for {NVDA_STAGING_TICKER} staging analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Unified Export ALL NVDA Staging Data Actions */}
        <div className="flex flex-col gap-4 mb-6 p-4 border border-orange-200 rounded-lg bg-orange-50/50">
          <div>
            <h3 className="text-lg font-semibold text-orange-900">Export All {NVDA_STAGING_TICKER} Staging Data</h3>
            <p className="text-sm text-orange-700">Copy or export all available NVDA staging data in one action</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => handleCopyAll()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Copy className="h-4 w-4" />
              Copy ALL
            </Button>
            <Button
              onClick={() => handleExportAll()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Download className="h-4 w-4" />
              Export ALL
            </Button>
            <Button
              onClick={() => handleCopyTruncated()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Copy className="h-4 w-4" />
              Copy Truncated
            </Button>
            <Button
              onClick={() => handleExportTruncated()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Download className="h-4 w-4" />
              Export Truncated
            </Button>
          </div>
          <p className="text-xs text-orange-600">
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
                  <h3 className="text-lg font-semibold text-orange-900">{section.title}</h3>
                  <Badge variant={section.hasData ? "default" : "secondary"} className={section.hasData ? "bg-orange-600 text-white" : ""}>
                    {section.hasData ? "Data Available" : "No Data"}
                  </Badge>
                </div>
              </div>

              {/* JSON Data Display */}
              <div className="border border-orange-200 rounded-lg">
                <pre className="p-4 text-sm overflow-auto max-h-96 bg-orange-50/30">
                  <code>
                    {formatJsonData(section.data)}
                  </code>
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Data Summary */}
        <div className="mt-6 p-4 bg-orange-50/50 rounded-lg border border-orange-200">
          <h4 className="font-semibold mb-2 text-orange-900">{NVDA_STAGING_TICKER} Staging Data Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-orange-600">Status:</span>
              <span className="ml-2 capitalize text-orange-800">{stagingState.status}</span>
            </div>
            <div>
              <span className="text-orange-600">Selected Expiration:</span>
              <span className="ml-2 text-orange-800">{stagingState.selectedExpirationDate || 'None'}</span>
            </div>
            <div>
              <span className="text-orange-600">Stock Data:</span>
              <span className="ml-2 text-orange-800">{stagingState.hasStockData ? 'Loaded' : 'Not Loaded'}</span>
            </div>
            <div>
              <span className="text-orange-600">Options Data:</span>
              <span className="ml-2 text-orange-800">{stagingState.hasOptionsChainData ? 'Loaded' : 'Not Loaded'}</span>
            </div>
            <div>
              <span className="text-orange-600">AI Data:</span>
              <span className="ml-2 text-orange-800">{stagingState.hasAiTaData ? 'Loaded' : 'Not Loaded'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}