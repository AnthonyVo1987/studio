
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
import { fetchStockDataAction, type AnalyzeStockServerActionState } from "@/actions/analyze-stock-server-action";
import { calculateAiTaAction, type CalculateAiTaActionState } from "@/actions/calculate-ai-ta-action";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const initialStockDataFetchState: AnalyzeStockServerActionState = {
  status: 'idle',
  data: undefined,
  error: null,
  message: null,
};

const initialCalculateAiTaState: CalculateAiTaActionState = {
  status: 'idle',
  data: undefined,
  error: null,
  message: null,
};

export function MainTabContent() {
  const [ticker, setTicker] = useState("NVDA");
  const { toast } = useToast();
  const { 
    stockSnapshotJson, // Get stockSnapshotJson to pass to AI TA action
    setMarketStatusJson, 
    setStockSnapshotJson, 
    setStandardTasJson, 
    setOptionsChainJson,
    setPolygonApiRequestLogJson,
    setPolygonApiResponseLogJson,
    setAiCalculatedTaRequestJson,
    setAiCalculatedTaJson,
  } = useStockAnalysis();

  const [analyzeStockState, analyzeStockFormAction, isAnalyzeStockPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(
    fetchStockDataAction,
    initialStockDataFetchState
  );

  const [calculateAiTaState, calculateAiTaFormAction, isCalculateAiTaPending] = useActionState<CalculateAiTaActionState, { stockSnapshotJson: string }>(
    calculateAiTaAction,
    initialCalculateAiTaState
  );

  const handleAnalyzeStockSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({ title: "Fetching Stock Data...", description: `Requesting data for ${ticker.toUpperCase()}.` });
    // Reset AI TA state when new stock data is fetched
    setAiCalculatedTaRequestJson('{ "status": "pending..." }');
    setAiCalculatedTaJson('{ "status": "pending..." }');
    analyzeStockFormAction({ ticker });
  };

  const handleAiFullAnalysis = () => {
    console.log("AI Full Stock Analysis button clicked");
    toast({ title: "Not Implemented", description: "AI Full Stock Analysis will be available soon." });
  };

  // Effect for handling stock data fetching result and triggering AI TA calculation
  useEffect(() => {
    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      toast({
        title: "Data Fetched Successfully",
        description: analyzeStockState.message || `Data for ${ticker.toUpperCase()} loaded.`,
      });
      // Update context with fetched stock data
      setMarketStatusJson(analyzeStockState.data.marketStatusJson);
      setStockSnapshotJson(analyzeStockState.data.stockSnapshotJson);
      setStandardTasJson(analyzeStockState.data.standardTasJson);
      setOptionsChainJson(analyzeStockState.data.optionsChainJson);
      setPolygonApiRequestLogJson(analyzeStockState.data.polygonApiRequestLogJson);
      setPolygonApiResponseLogJson(analyzeStockState.data.polygonApiResponseLogJson);

      // Trigger AI TA calculation
      if (analyzeStockState.data.stockSnapshotJson && analyzeStockState.data.stockSnapshotJson !== '{}') {
        toast({ title: "Calculating AI TA...", description: "Requesting AI-calculated technical indicators." });
        calculateAiTaFormAction({ stockSnapshotJson: analyzeStockState.data.stockSnapshotJson });
      } else {
         setAiCalculatedTaRequestJson('{ "status": "skipped", "reason": "No stock snapshot data" }');
         setAiCalculatedTaJson('{ "status": "skipped", "reason": "No stock snapshot data" }');
      }
    } else if (analyzeStockState.status === 'error') {
      toast({
        variant: "destructive",
        title: "Error Fetching Data",
        description: analyzeStockState.error || "An unknown error occurred.",
      });
       setAiCalculatedTaRequestJson('{ "status": "skipped", "reason": "Stock data fetch failed" }');
       setAiCalculatedTaJson('{ "status": "skipped", "reason": "Stock data fetch failed" }');
    }
  }, [analyzeStockState, ticker, 
      setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson, 
      setPolygonApiRequestLogJson, setPolygonApiResponseLogJson,
      calculateAiTaFormAction, toast, // Added calculateAiTaFormAction, toast
      setAiCalculatedTaJson, setAiCalculatedTaRequestJson // To reset states
    ]);

  // Effect for handling AI TA calculation result
  useEffect(() => {
    if (calculateAiTaState.status === 'success' && calculateAiTaState.data) {
      toast({
        title: "AI TA Calculated",
        description: calculateAiTaState.message || "AI TA indicators processed.",
      });
      setAiCalculatedTaRequestJson(calculateAiTaState.data.aiCalculatedTaRequestJson);
      setAiCalculatedTaJson(calculateAiTaState.data.aiCalculatedTaJson);
    } else if (calculateAiTaState.status === 'error') {
      toast({
        variant: "destructive",
        title: "AI TA Calculation Failed",
        description: calculateAiTaState.error || "Could not calculate AI TA.",
      });
      // Persist the request JSON if it was made, but show error for output
      if(calculateAiTaState.data?.aiCalculatedTaRequestJson) {
        setAiCalculatedTaRequestJson(calculateAiTaState.data.aiCalculatedTaRequestJson);
      } else {
        // If request JSON itself was problematic (e.g. parsing snapshot failed)
         setAiCalculatedTaRequestJson(`{ "status": "error", "details": "${calculateAiTaState.error || 'Pre-calculation error'}" }`);
      }
      setAiCalculatedTaJson(`{ "status": "error", "details": "${calculateAiTaState.error || 'Calculation failed'}" }`);
    }
  }, [calculateAiTaState, setAiCalculatedTaRequestJson, setAiCalculatedTaJson, toast]);


  const isAnyActionPending = isAnalyzeStockPending || isCalculateAiTaPending;

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
                disabled={isAnyActionPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon" disabled>
                <SelectTrigger id="dataSource" disabled={isAnyActionPending}>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polygon">Polygon.io</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={isAnyActionPending}>
              {(isAnalyzeStockPending || (analyzeStockState.status === 'success' && isCalculateAiTaPending) ) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Stock
            </Button>
            <Button onClick={handleAiFullAnalysis} type="button" variant="outline" className="w-full sm:w-auto" disabled={isAnyActionPending}>
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
