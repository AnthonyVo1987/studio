"use client";

/**
 * @fileOverview Base Data Section Template
 * 
 * This template provides a comprehensive data viewer for all JSON data
 * stored in the ticker context. It includes tabs for different data types
 * and export/copy functionality.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Copy, Download, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

import type { TickerConfig, TickerContextResult } from '../types';

interface BaseDataSectionProps<T extends TickerConfig> {
  config: T;
  context: TickerContextResult<T>;
}

interface DataTab<T> {
  id: string;
  label: string;
  jsonKey: keyof T;
  description: string;
  category: 'market' | 'analysis' | 'ai' | 'chat';
}

export function BaseDataSection<T extends TickerConfig>({
  config,
  context,
}: BaseDataSectionProps<T>) {
  const state = context.hooks.useState();
  const { toast } = useToast();
  const [showRawJson, setShowRawJson] = useState<Record<string, boolean>>({});

  // Define all available data tabs
  const dataTabs: DataTab<typeof state>[] = [
    // Market Data
    {
      id: 'stock-snapshot',
      label: 'Stock Snapshot',
      jsonKey: 'stockSnapshotJson',
      description: 'Real-time stock price and trading data',
      category: 'market'
    },
    {
      id: 'market-status',
      label: 'Market Status',
      jsonKey: 'marketStatusJson',
      description: 'Market hours and exchange status',
      category: 'market'
    },
    {
      id: 'options-chain',
      label: 'Options Chain',
      jsonKey: 'optionsChainJson',
      description: 'Options contracts and pricing data',
      category: 'market'
    },
    
    // Technical Analysis
    {
      id: 'standard-ta',
      label: 'Standard TA',
      jsonKey: 'standardTasJson',
      description: 'Technical indicators and signals',
      category: 'analysis'
    },
    {
      id: 'ai-analyzed-ta',
      label: 'AI Analyzed TA',
      jsonKey: 'aiAnalyzedTaJson',
      description: 'AI interpretation of technical analysis',
      category: 'ai'
    },
    
    // AI Analysis
    {
      id: 'ai-key-takeaways',
      label: 'AI Key Takeaways',
      jsonKey: 'aiKeyTakeawaysJson',
      description: 'AI-generated insights and analysis',
      category: 'ai'
    },
    {
      id: 'ai-options-analysis',
      label: 'AI Options Analysis',
      jsonKey: 'aiOptionsAnalysisJson',
      description: 'AI options strategies and recommendations',
      category: 'ai'
    },
    
    // Chat Debug Data
    {
      id: 'stock-trader-chat',
      label: 'Stock Trader Chat',
      jsonKey: 'stockTraderTakeawaysRawJson',
      description: 'Stock trader focused chat responses',
      category: 'chat'
    },
    {
      id: 'options-trader-chat',
      label: 'Options Trader Chat',
      jsonKey: 'optionsTraderTakeawaysRawJson',
      description: 'Options trader focused chat responses',
      category: 'chat'
    },
    {
      id: 'holistic-chat',
      label: 'Holistic Chat',
      jsonKey: 'holisticTakeawaysRawJson',
      description: 'Comprehensive market analysis chat',
      category: 'chat'
    },
    {
      id: 'user-input-app',
      label: 'User Input (App)',
      jsonKey: 'userInputAppDataRawJson',
      description: 'User chat responses using app data',
      category: 'chat'
    },
    {
      id: 'user-input-web',
      label: 'User Input (Web)',
      jsonKey: 'userInputWebSearchRawJson',
      description: 'User chat responses using web search',
      category: 'chat'
    },
  ];

  const formatJson = (jsonString: string) => {
    if (!jsonString) return "No data available";
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  const handleCopyData = async (jsonKey: string, label: string) => {
    try {
      const jsonString = state[jsonKey as keyof typeof state] as string;
      await navigator.clipboard.writeText(jsonString || "");
      toast({
        title: "Copied to Clipboard",
        description: `${config.ticker} ${label} data copied successfully`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleExportData = (jsonKey: string, label: string) => {
    try {
      const jsonString = state[jsonKey as keyof typeof state] as string;
      const blob = new Blob([jsonString || ""], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.ticker}_${label.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `${config.ticker} ${label} data exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export data",
        variant: "destructive",
      });
    }
  };

  const toggleRawJson = (tabId: string) => {
    setShowRawJson(prev => ({
      ...prev,
      [tabId]: !prev[tabId]
    }));
  };

  const getCategoryColor = (category: DataTab<typeof state>['category']) => {
    switch (category) {
      case 'market':
        return 'bg-blue-100 text-blue-800';
      case 'analysis':
        return 'bg-green-100 text-green-800';
      case 'ai':
        return 'bg-purple-100 text-purple-800';
      case 'chat':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableTabs = () => {
    return dataTabs.filter(tab => {
      const jsonString = state[tab.jsonKey] as string;
      return jsonString && jsonString.length > 0;
    });
  };

  const availableTabs = getAvailableTabs();

  if (availableTabs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {config.ticker} Raw Data
          </CardTitle>
          <CardDescription>
            JSON data viewer for all retrieved information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No data available yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Retrieve stock data to see raw JSON information
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          {config.ticker} Raw Data
        </CardTitle>
        <CardDescription>
          JSON data viewer for all retrieved information ({availableTabs.length} datasets available)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={availableTabs[0]?.id} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(availableTabs.length, 4)}, 1fr)` }}>
            {availableTabs.slice(0, 4).map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {availableTabs.length > 4 && (
            <div className="mt-2">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(availableTabs.length - 4, 4)}, 1fr)` }}>
                {availableTabs.slice(4, 8).map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          )}
          
          {availableTabs.length > 8 && (
            <div className="mt-2">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableTabs.length - 8}, 1fr)` }}>
                {availableTabs.slice(8).map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          )}

          {availableTabs.map((tab) => {
            const jsonString = state[tab.jsonKey] as string;
            const isRawView = showRawJson[tab.id];
            
            return (
              <TabsContent key={tab.id} value={tab.id} className="mt-4">
                <div className="space-y-4">
                  {/* Tab Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{tab.label}</h3>
                      <Badge className={getCategoryColor(tab.category)}>
                        {tab.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRawJson(tab.id)}
                        className="flex items-center gap-2"
                      >
                        {isRawView ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {isRawView ? "Pretty" : "Raw"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyData(tab.jsonKey as string, tab.label)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportData(tab.jsonKey as string, tab.label)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-3 w-3" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground">{tab.description}</p>

                  {/* JSON Data */}
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                      {isRawView ? jsonString : formatJson(jsonString)}
                    </pre>
                  </div>

                  {/* Data Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Size: {(jsonString?.length || 0).toLocaleString()} characters</span>
                    <span>Updated: {new Date().toLocaleString()}</span>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}