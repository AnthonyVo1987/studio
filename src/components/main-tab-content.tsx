
"use client";

import type { FormEvent } from 'react';
import React, { useState, useActionState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KeyMetricsDisplay } from "@/components/key-metrics-display";
import { StockSnapshotDetailsDisplay } from "@/components/stock-snapshot-details-display";
import { MarketStatusDisplay } from "@/components/market-status-display";
import { StandardTaDisplay } from "@/components/standard-ta-display";
import { AiCalculatedTaDisplay } from "@/components/ai-calculated-ta-display";
import { AiKeyTakeawaysDisplay } from "@/components/ai-key-takeaways-display";
import { OptionsChainTable } from "@/components/options-chain-table";
import { fetchStockDataAction, type AnalyzeStockServerActionState } from "@/actions/analyze-stock-server-action"; // Removed initialStockDataFetchState import
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Define initialStockDataFetchState here as it's used by useActionState in this Client Component
const initialStockDataFetchState: AnalyzeStockServerActionState = {
  status: 'idle',
  data: undefined,
  error: null,
  message: null,
};

export function MainTabContent() {
  const [ticker, setTicker] = useState("NVDA");
  const { toast } = useToast();
  const { 
    setMarketStatusJson, 
    setStockSnapshotJson, 
    setStandardTasJson, 
    setOptionsChainJson,
    setPolygonApiRequestLogJson,
    setPolygonApiResponseLogJson,
  } = useStockAnalysis();

  const [analyzeStockState, analyzeStockFormAction, isAnalyzeStockPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(
    fetchStockDataAction,
    initialStockDataFetchState // Use the locally defined initial state
  );

  const handleAnalyzeStockSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({ title: "Fetching Stock Data...", description: `Requesting data for ${ticker.toUpperCase()}.` });
    analyzeStockFormAction({ ticker });
  };

  const handleAiFullAnalysis = () => {
    console.log("AI Full Stock Analysis button clicked");
    toast({ title: "Not Implemented", description: "AI Full Stock Analysis will be available soon." });
    // Logic to be implemented later
  };

  useEffect(() => {
    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      toast({
        title: "Data Fetched Successfully",
        description: analyzeStockState.message || `Data for ${ticker.toUpperCase()} loaded.`,
      });
      setMarketStatusJson(analyzeStockState.data.marketStatusJson);
      setStockSnapshotJson(analyzeStockState.data.stockSnapshotJson);
      setStandardTasJson(analyzeStockState.data.standardTasJson);
      setOptionsChainJson(analyzeStockState.data.optionsChainJson);
      setPolygonApiRequestLogJson(analyzeStockState.data.polygonApiRequestLogJson);
      setPolygonApiResponseLogJson(analyzeStockState.data.polygonApiResponseLogJson);
    } else if (analyzeStockState.status === 'error') {
      toast({
        variant: "destructive",
        title: "Error Fetching Data",
        description: analyzeStockState.error || "An unknown error occurred.",
      });
    }
  }, [analyzeStockState, toast, ticker, setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson, setPolygonApiRequestLogJson, setPolygonApiResponseLogJson]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis</CardTitle>
        <CardDescription>
          Enter a stock ticker and select a data source to begin your analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAnalyzeStockSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="ticker">Stock Ticker</Label>
              <Input 
                id="ticker" 
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, MSFT" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon" disabled>
                <SelectTrigger id="dataSource">
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polygon">Polygon.io</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={isAnalyzeStockPending}>
              {isAnalyzeStockPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Stock
            </Button>
            <Button onClick={handleAiFullAnalysis} type="button" variant="outline" className="w-full sm:w-auto" disabled={isAnalyzeStockPending}>
              AI Full Stock Analysis
            </Button>
          </div>
        </form>

        <Separator />

        <div className="space-y-6">
          <KeyMetricsDisplay />
          <StockSnapshotDetailsDisplay />
          <MarketStatusDisplay />
          <StandardTaDisplay />
          <AiCalculatedTaDisplay />
          <AiKeyTakeawaysDisplay />
          <OptionsChainTable />
        </div>
      </CardContent>
    </Card>
  );
}
