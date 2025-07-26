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
      id: 'key-metrics',
      title: 'Key Metrics',
      data: spyState.keyMetricsJson,
      hasData: spyState.hasStockData,
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
                
                {section.hasData && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleCopy(section.data, section.title)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy JSON
                    </Button>
                    <Button
                      onClick={() => handleExport(section.data, section.title)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Export JSON
                    </Button>
                  </div>
                )}
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
              <span className="text-muted-foreground">AI Data:</span>
              <span className="ml-2">{spyState.hasAiTaData ? 'Loaded' : 'Not Loaded'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}