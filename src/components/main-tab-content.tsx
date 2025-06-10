
"use client";

import type { FormEvent } from 'react';
import React, { useState, useActionState, useEffect, startTransition } from "react"; // Added startTransition
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
import { performAiAnalysisAction, type PerformAiAnalysisActionState } from "@/actions/perform-ai-analysis-action";
import { chatServerAction, type ChatActionState, type ChatActionInputs } from "@/actions/chat-server-action"; // Chatbot action

import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const initialStockDataFetchState: AnalyzeStockServerActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialCalculateAiTaState: CalculateAiTaActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialPerformAiAnalysisState: PerformAiAnalysisActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialChatActionState: ChatActionState = { // For Chatbot
  status: 'idle', data: undefined, error: null, message: null,
};


export function MainTabContent() {
  const [ticker, setTicker] = useState("NVDA");
  const { toast } = useToast();
  const { 
    marketStatusJson, // To pass to AI analysis
    stockSnapshotJson, 
    standardTasJson,   // To pass to AI analysis
    aiCalculatedTaJson,// To pass to AI analysis and chat
    // Context Setters
    setMarketStatusJson, 
    setStockSnapshotJson, 
    setStandardTasJson, 
    setOptionsChainJson,
    setPolygonApiRequestLogJson,
    setPolygonApiResponseLogJson,
    setAiCalculatedTaRequestJson,
    setAiCalculatedTaJson,
    setAiKeyTakeawaysRequestJson, 
    setAiKeyTakeawaysJson,       
    setChatbotRequestJson,       
    setChatbotResponseJson,      
  } = useStockAnalysis();

  const [analyzeStockState, analyzeStockFormAction, isAnalyzeStockPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(
    fetchStockDataAction,
    initialStockDataFetchState
  );

  const [calculateAiTaState, calculateAiTaFormAction, isCalculateAiTaPending] = useActionState<CalculateAiTaActionState, { stockSnapshotJson: string }>(
    calculateAiTaAction,
    initialCalculateAiTaState
  );

  const [performAiAnalysisState, performAiAnalysisFormAction, isPerformAiAnalysisPending] = useActionState<PerformAiAnalysisActionState, Parameters<typeof performAiAnalysisAction>[1]>(
    performAiAnalysisAction,
    initialPerformAiAnalysisState
  );
  
  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(
    chatServerAction,
    initialChatActionState
  );


  const handleAnalyzeStockSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({ title: "Fetching Stock Data...", description: `Requesting data for ${ticker.toUpperCase()}.` });
    setAiCalculatedTaRequestJson('{ "status": "pending..." }');
    setAiCalculatedTaJson('{ "status": "pending..." }');
    setAiKeyTakeawaysRequestJson('{ "status": "pending..." }'); 
    setAiKeyTakeawaysJson('{ "status": "pending..." }');     
    analyzeStockFormAction({ ticker });
  };

  const handleAiFullAnalysis = () => {
    console.log("AI Full Stock Analysis button clicked - Phase 5: Not fully implemented, only logs.");
    toast({ title: "Coming Soon", description: "Full AI analysis with chatbot interaction will be implemented in Phase 6." });
  };

  useEffect(() => {
    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      toast({ title: "Data Fetched", description: analyzeStockState.message || `Data for ${ticker.toUpperCase()} loaded.` });
      setMarketStatusJson(analyzeStockState.data.marketStatusJson);
      setStockSnapshotJson(analyzeStockState.data.stockSnapshotJson);
      setStandardTasJson(analyzeStockState.data.standardTasJson);
      setOptionsChainJson(analyzeStockState.data.optionsChainJson);
      setPolygonApiRequestLogJson(analyzeStockState.data.polygonApiRequestLogJson);
      setPolygonApiResponseLogJson(analyzeStockState.data.polygonApiResponseLogJson);

      if (analyzeStockState.data.stockSnapshotJson && analyzeStockState.data.stockSnapshotJson !== '{}') {
        toast({ title: "Calculating AI TA...", description: "Requesting AI-calculated technical indicators." });
        startTransition(() => { // Wrap in startTransition
          calculateAiTaFormAction({ stockSnapshotJson: analyzeStockState.data.stockSnapshotJson });
        });
      } else {
         setAiCalculatedTaRequestJson('{ "status": "skipped", "reason": "No stock snapshot data" }');
         setAiCalculatedTaJson('{ "status": "skipped", "reason": "No stock snapshot data" }');
         setAiKeyTakeawaysRequestJson('{ "status": "skipped", "reason": "AI TA skipped" }');
         setAiKeyTakeawaysJson('{ "status": "skipped", "reason": "AI TA skipped" }');
      }
    } else if (analyzeStockState.status === 'error') {
      toast({ variant: "destructive", title: "Error Fetching Data", description: analyzeStockState.error || "An unknown error occurred." });
       setAiCalculatedTaRequestJson('{ "status": "skipped", "reason": "Stock data fetch failed" }');
       setAiCalculatedTaJson('{ "status": "skipped", "reason": "Stock data fetch failed" }');
       setAiKeyTakeawaysRequestJson('{ "status": "skipped", "reason": "Stock data fetch failed" }');
       setAiKeyTakeawaysJson('{ "status": "skipped", "reason": "Stock data fetch failed" }');
    }
  }, [analyzeStockState, ticker, 
      setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson, 
      setPolygonApiRequestLogJson, setPolygonApiResponseLogJson,
      calculateAiTaFormAction, toast, 
      setAiCalculatedTaJson, setAiCalculatedTaRequestJson,
      setAiKeyTakeawaysJson, setAiKeyTakeawaysRequestJson
    ]);

  useEffect(() => {
    if (calculateAiTaState.status === 'success' && calculateAiTaState.data) {
      toast({ title: "AI TA Calculated", description: calculateAiTaState.message || "AI TA indicators processed." });
      setAiCalculatedTaRequestJson(calculateAiTaState.data.aiCalculatedTaRequestJson);
      setAiCalculatedTaJson(calculateAiTaState.data.aiCalculatedTaJson);

      if (stockSnapshotJson !== '{}' && standardTasJson !== '{}' && marketStatusJson !== '{}' && calculateAiTaState.data.aiCalculatedTaJson !== '{}') {
        toast({ title: "Generating AI Key Takeaways...", description: "Requesting AI-driven analysis." });
        startTransition(() => { // Wrap in startTransition
          performAiAnalysisFormAction({ 
            ticker, 
            stockSnapshotJson, 
            standardTasJson, 
            aiCalculatedTaJson: calculateAiTaState.data.aiCalculatedTaJson, 
            marketStatusJson
          });
        });
      } else {
        setAiKeyTakeawaysRequestJson('{ "status": "skipped", "reason": "Prerequisite data for Key Takeaways missing or AI TA failed." }');
        setAiKeyTakeawaysJson('{ "status": "skipped", "reason": "Prerequisite data for Key Takeaways missing or AI TA failed." }');
      }

    } else if (calculateAiTaState.status === 'error') {
      toast({ variant: "destructive", title: "AI TA Calculation Failed", description: calculateAiTaState.error || "Could not calculate AI TA." });
      if(calculateAiTaState.data?.aiCalculatedTaRequestJson) {
        setAiCalculatedTaRequestJson(calculateAiTaState.data.aiCalculatedTaRequestJson);
      } else {
         setAiCalculatedTaRequestJson(`{ "status": "error", "details": "${calculateAiTaState.error || 'Pre-calculation error'}" }`);
      }
      setAiCalculatedTaJson(`{ "status": "error", "details": "${calculateAiTaState.error || 'Calculation failed'}" }`);
      setAiKeyTakeawaysRequestJson('{ "status": "skipped", "reason": "AI TA calculation failed" }');
      setAiKeyTakeawaysJson('{ "status": "skipped", "reason": "AI TA calculation failed" }');
    }
  }, [calculateAiTaState, ticker, stockSnapshotJson, standardTasJson, marketStatusJson,
      performAiAnalysisFormAction, 
      setAiCalculatedTaRequestJson, setAiCalculatedTaJson, 
      setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson, toast]);

  useEffect(() => {
    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Generated", description: performAiAnalysisState.message || "AI analysis complete." });
      setAiKeyTakeawaysRequestJson(performAiAnalysisState.data.aiKeyTakeawaysRequestJson);
      setAiKeyTakeawaysJson(performAiAnalysisState.data.aiKeyTakeawaysJson);
    } else if (performAiAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Key Takeaways Failed", description: performAiAnalysisState.error || "Could not generate AI takeaways." });
      if (performAiAnalysisState.data?.aiKeyTakeawaysRequestJson) {
        setAiKeyTakeawaysRequestJson(performAiAnalysisState.data.aiKeyTakeawaysRequestJson);
      } else {
         setAiKeyTakeawaysRequestJson(`{ "status": "error", "details": "${performAiAnalysisState.error || 'Pre-analysis error'}" }`);
      }
      setAiKeyTakeawaysJson(`{ "status": "error", "details": "${performAiAnalysisState.error || 'Analysis failed'}" }`);
    }
  }, [performAiAnalysisState, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson, toast]);

  useEffect(() => {
    if (chatActionState.status === 'success' && chatActionState.data) {
      toast({ title: "Chatbot Responded", description: chatActionState.message || "Chat interaction processed." });
      setChatbotRequestJson(chatActionState.data.chatbotRequestJson);
      setChatbotResponseJson(chatActionState.data.chatbotResponseJson);
    } else if (chatActionState.status === 'error') {
      toast({ variant: "destructive", title: "Chatbot Error", description: chatActionState.error || "Chatbot failed to respond." });
      if (chatActionState.data?.chatbotRequestJson) { 
        setChatbotRequestJson(chatActionState.data.chatbotRequestJson);
        setChatbotResponseJson(`{ "status": "error", "details": "${chatActionState.error || 'Chat flow failed'}" }`);
      } else { 
        setChatbotRequestJson(`{ "status": "error", "reason": "Pre-chat error: ${chatActionState.error}"}`);
        setChatbotResponseJson(`{ "status": "error", "reason": "Pre-chat error: ${chatActionState.error}"}`);
      }
    }
  }, [chatActionState, setChatbotRequestJson, setChatbotResponseJson, toast]);


  const isAnyActionPending = isAnalyzeStockPending || isCalculateAiTaPending || isPerformAiAnalysisPending || isChatPending;

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
              { (isAnalyzeStockPending || 
                (analyzeStockState.status === 'success' && isCalculateAiTaPending) ||
                (calculateAiTaState.status === 'success' && isPerformAiAnalysisPending)
              ) && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
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
          {/* Chatbot UI will be added here in Phase 6 */}
        </div>
      </CardContent>
    </Card>
  );
}
