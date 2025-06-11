
"use client";

import type { FormEvent } from 'react';
import React, { useState, useActionState, useEffect, startTransition } from "react";
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
import { downloadJson, copyToClipboard } from "@/lib/export-utils";

import { fetchStockDataAction, type AnalyzeStockServerActionState } from "@/actions/analyze-stock-server-action";
import { calculateAiTaAction, type CalculateAiTaActionState } from "@/actions/calculate-ai-ta-action";
import { performAiAnalysisAction, type PerformAiAnalysisActionState } from "@/actions/perform-ai-analysis-action";
import { chatServerAction, type ChatActionState, type ChatActionInputs } from "@/actions/chat-server-action";

import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy } from "lucide-react";

const initialStockDataFetchState: AnalyzeStockServerActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialCalculateAiTaState: CalculateAiTaActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialPerformAiAnalysisState: PerformAiAnalysisActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialChatActionState: ChatActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};


export function MainTabContent() {
  // console.debug("[MainTabContent] Component mounted/rendered."); // Re-enable if needed later
  const [ticker, setTicker] = useState("NVDA");
  const { toast } = useToast();
  const {
    // Remove addClientLog
    marketStatusJson,
    stockSnapshotJson,
    standardTasJson,
    optionsChainJson,
    aiCalculatedTaJson,
    aiKeyTakeawaysJson,
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

  const [calculateAiTaState, calculateAiTaFormAction, isCalculateAiTaPending] = useActionState<CalculateAiTaActionState, { stockSnapshotJson: string, ticker?: string }>(
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

  // useEffect(() => {
  //   console.debug("[MainTabContent] Ticker state changed:", ticker);
  // }, [ticker]);


  const handleAnalyzeStockSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // console.debug(`[MainTabContent] handleAnalyzeStockSubmit triggered for ticker: ${ticker}. isAnalyzeStockPending: ${isAnalyzeStockPending}`);
    toast({ title: "Fetching Stock Data...", description: `Requesting data for ${ticker.toUpperCase()}.` });

    setMarketStatusJson('{ "status": "pending..." }');
    setStockSnapshotJson('{ "status": "pending..." }');
    setStandardTasJson('{ "status": "pending..." }');
    setOptionsChainJson('{ "status": "pending..." }');
    setAiCalculatedTaRequestJson('{ "status": "pending..." }');
    setAiCalculatedTaJson('{ "status": "pending..." }');
    setAiKeyTakeawaysRequestJson('{ "status": "pending..." }');
    setAiKeyTakeawaysJson('{ "status": "pending..." }');
    setPolygonApiRequestLogJson(`{ "status": "pending...", "input": {"ticker": "${ticker}"} }`);
    setPolygonApiResponseLogJson('{ "status": "pending..." }');

    startTransition(() => {
      analyzeStockFormAction({ ticker });
    });
  };

  const handleAiFullAnalysis = () => {
    // console.debug("[MainTabContent] AI Full Stock Analysis button clicked.");
    toast({ title: "Coming Soon", description: "Full AI analysis with chatbot interaction will be implemented in Phase 6." });
  };

  useEffect(() => {
    // console.debug("[MainTabContent] analyzeStockState changed:", analyzeStockState);
    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      toast({ title: "Data Fetched", description: analyzeStockState.message || `Data for ${ticker.toUpperCase()} loaded.` });
      // console.debug("[MainTabContent] analyzeStockState success. Updating context JSONs.");
      setMarketStatusJson(analyzeStockState.data.marketStatusJson);
      setStockSnapshotJson(analyzeStockState.data.stockSnapshotJson);
      setStandardTasJson(analyzeStockState.data.standardTasJson);
      setOptionsChainJson(analyzeStockState.data.optionsChainJson);
      setPolygonApiRequestLogJson(analyzeStockState.data.polygonApiRequestLogJson);
      setPolygonApiResponseLogJson(analyzeStockState.data.polygonApiResponseLogJson);

      // Remove polygonAdapterDebugMessages logic
      // if (analyzeStockState.data.polygonAdapterDebugMessages && analyzeStockState.data.polygonAdapterDebugMessages.length > 0) {
      //   console.debug(`[MainTabContent] Injecting ${analyzeStockState.data.polygonAdapterDebugMessages.length} Polygon adapter logs into client console.`);
      //   analyzeStockState.data.polygonAdapterDebugMessages.forEach(msg => {
      //     addClientLog({ type: 'debug', message: msg, category: 'PolygonAdapter' });
      //   });
      // }

      if (analyzeStockState.data.stockSnapshotJson && analyzeStockState.data.stockSnapshotJson !== '{}' && !analyzeStockState.data.stockSnapshotJson.includes('"error":')) {
        toast({ title: "Calculating AI TA...", description: "Requesting AI-calculated technical indicators." });
        // console.debug("[MainTabContent] Triggering calculateAiTaAction.");
        startTransition(() => {
          calculateAiTaFormAction({ stockSnapshotJson: analyzeStockState.data.stockSnapshotJson, ticker });
        });
      } else {
         // console.warn("[MainTabContent] Skipping AI TA calculation due to missing or invalid stock snapshot data.");
         setAiCalculatedTaRequestJson('{ "status": "skipped", "reason": "No stock snapshot data" }');
         setAiCalculatedTaJson('{ "status": "skipped", "reason": "No stock snapshot data" }');
         setAiKeyTakeawaysRequestJson('{ "status": "skipped", "reason": "AI TA skipped" }');
         setAiKeyTakeawaysJson('{ "status": "skipped", "reason": "AI TA skipped" }');
      }
    } else if (analyzeStockState.status === 'error') {
      toast({ variant: "destructive", title: "Error Fetching Data", description: analyzeStockState.error || "An unknown error occurred." });
      // console.error("[MainTabContent] analyzeStockState error:", analyzeStockState.error);
       setMarketStatusJson(`{ "status": "error", "details": "${analyzeStockState.error}"}`);
       setStockSnapshotJson(`{ "status": "error", "details": "${analyzeStockState.error}"}`);
       setStandardTasJson(`{ "status": "error", "details": "${analyzeStockState.error}"}`);
       setOptionsChainJson(`{ "status": "error", "details": "${analyzeStockState.error}"}`);
       setPolygonApiRequestLogJson(`{ "status": "error", "details": "${analyzeStockState.error}" }`);
       setPolygonApiResponseLogJson(`{ "status": "error", "details": "${analyzeStockState.error}" }`);
       setAiCalculatedTaRequestJson('{ "status": "skipped", "reason": "Stock data fetch failed" }');
       setAiCalculatedTaJson('{ "status": "skipped", "reason": "Stock data fetch failed" }');
       setAiKeyTakeawaysRequestJson('{ "status": "skipped", "reason": "Stock data fetch failed" }');
       setAiKeyTakeawaysJson('{ "status": "skipped", "reason": "Stock data fetch failed" }');
    }
  }, [analyzeStockState, ticker,
      setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson,
      setPolygonApiRequestLogJson, setPolygonApiResponseLogJson, // addClientLog removed
      calculateAiTaFormAction, toast,
      setAiCalculatedTaJson, setAiCalculatedTaRequestJson,
      setAiKeyTakeawaysJson, setAiKeyTakeawaysRequestJson
    ]);

  useEffect(() => {
    // console.debug("[MainTabContent] calculateAiTaState changed:", calculateAiTaState);
    if (calculateAiTaState.status === 'success' && calculateAiTaState.data) {
      toast({ title: "AI TA Calculated", description: calculateAiTaState.message || "AI TA indicators processed." });
      // console.debug("[MainTabContent] calculateAiTaState success. Updating context JSONs.");
      setAiCalculatedTaRequestJson(calculateAiTaState.data.aiCalculatedTaRequestJson);
      setAiCalculatedTaJson(calculateAiTaState.data.aiCalculatedTaJson);

      if (stockSnapshotJson !== '{}' && !stockSnapshotJson.includes('"error":') &&
          standardTasJson !== '{}' && !standardTasJson.includes('"error":') &&
          marketStatusJson !== '{}' && !marketStatusJson.includes('"error":') &&
          calculateAiTaState.data.aiCalculatedTaJson !== '{}' && !calculateAiTaState.data.aiCalculatedTaJson.includes('"error":')
          ) {
        toast({ title: "Generating AI Key Takeaways...", description: "Requesting AI-driven analysis." });
        // console.debug("[MainTabContent] Triggering performAiAnalysisAction.");
        startTransition(() => {
          performAiAnalysisFormAction({
            ticker,
            stockSnapshotJson,
            standardTasJson,
            aiCalculatedTaJson: calculateAiTaState.data.aiCalculatedTaJson,
            marketStatusJson
          });
        });
      } else {
        // console.warn("[MainTabContent] Skipping AI Key Takeaways generation due to missing prerequisite data or AI TA failure.");
        setAiKeyTakeawaysRequestJson('{ "status": "skipped", "reason": "Prerequisite data for Key Takeaways missing or AI TA failed." }');
        setAiKeyTakeawaysJson('{ "status": "skipped", "reason": "Prerequisite data for Key Takeaways missing or AI TA failed." }');
      }

    } else if (calculateAiTaState.status === 'error') {
      toast({ variant: "destructive", title: "AI TA Calculation Failed", description: calculateAiTaState.error || "Could not calculate AI TA." });
      // console.error("[MainTabContent] calculateAiTaState error:", calculateAiTaState.error);
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
    // console.debug("[MainTabContent] performAiAnalysisState changed:", performAiAnalysisState);
    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Generated", description: performAiAnalysisState.message || "AI analysis complete." });
      // console.debug("[MainTabContent] performAiAnalysisState success. Updating context JSONs.");
      setAiKeyTakeawaysRequestJson(performAiAnalysisState.data.aiKeyTakeawaysRequestJson);
      setAiKeyTakeawaysJson(performAiAnalysisState.data.aiKeyTakeawaysJson);
    } else if (performAiAnalysisState.status === 'error') {
      toast({ variant: "destructive", title: "AI Key Takeaways Failed", description: performAiAnalysisState.error || "Could not generate AI takeaways." });
      // console.error("[MainTabContent] performAiAnalysisState error:", performAiAnalysisState.error);
      if (performAiAnalysisState.data?.aiKeyTakeawaysRequestJson) {
        setAiKeyTakeawaysRequestJson(performAiAnalysisState.data.aiKeyTakeawaysRequestJson);
      } else {
         setAiKeyTakeawaysRequestJson(`{ "status": "error", "details": "${performAiAnalysisState.error || 'Pre-analysis error'}" }`);
      }
      setAiKeyTakeawaysJson(`{ "status": "error", "details": "${performAiAnalysisState.error || 'Analysis failed'}" }`);
    }
  }, [performAiAnalysisState, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson, toast]);

  useEffect(() => {
    // console.debug("[MainTabContent] chatActionState changed:", chatActionState);
    if (chatActionState.status === 'success' && chatActionState.data) {
      toast({ title: "Chatbot Responded", description: chatActionState.message || "Chat interaction processed." });
      // console.debug("[MainTabContent] chatActionState success. Updating context JSONs.");
      setChatbotRequestJson(chatActionState.data.chatbotRequestJson);
      setChatbotResponseJson(chatActionState.data.chatbotResponseJson);
    } else if (chatActionState.status === 'error') {
      toast({ variant: "destructive", title: "Chatbot Error", description: chatActionState.error || "Chatbot failed to respond." });
      // console.error("[MainTabContent] chatActionState error:", chatActionState.error);
      if (chatActionState.data?.chatbotRequestJson) {
        setChatbotRequestJson(chatActionState.data.chatbotRequestJson);
        setChatbotResponseJson(`{ "status": "error", "details": "${chatActionState.error || 'Chat flow failed'}" }`);
      } else {
        setChatbotRequestJson(`{ "status": "error", "reason": "Pre-chat error: ${chatActionState.error}"}`);
        setChatbotResponseJson(`{ "status": "error", "reason": "Pre-chat error: ${chatActionState.error}"}`);
      }
    }
  }, [chatActionState, setChatbotRequestJson, setChatbotResponseJson, toast]);

  const getCombinedDataForExport = () => {
    // console.debug("[MainTabContent] getCombinedDataForExport called.");
    const safeParse = (jsonString: string, key: string) => {
      try {
        if (jsonString.includes('"status":') || jsonString.includes('"error":')) {
           // console.warn(`[MainTabContent] Skipping ${key} for export due to status/error in JSON:`, jsonString.substring(0,50));
           return { _placeholder_status_or_error: jsonString };
        }
        return JSON.parse(jsonString);
      } catch (e) {
        // console.error(`[MainTabContent] Error parsing ${key} JSON for export:`, e, "JSON string:", jsonString.substring(0,100));
        return { _placeholder_error_parsing: (e as Error).message };
      }
    };

    const dataToExport = {
      stockSnapshot: safeParse(stockSnapshotJson, "Stock Snapshot"),
      standardTechnicalIndicators: safeParse(standardTasJson, "Standard TAs"),
      aiCalculatedTechnicalAnalysis: safeParse(aiCalculatedTaJson, "AI TA"),
      optionsChain: safeParse(optionsChainJson, "Options Chain"),
      marketStatus: safeParse(marketStatusJson, "Market Status"),
    };
    // console.debug("[MainTabContent] Combined data for export:", dataToExport);
    return dataToExport;
  };

  const handleExportAllData = () => {
    // console.debug("[MainTabContent] handleExportAllData called.");
    const combinedData = getCombinedDataForExport();
    downloadJson(combinedData, `${ticker || 'STOCK'}_stocksage_analysis.json`);
    toast({ title: "Data Exported", description: `Combined analysis for ${ticker || 'STOCK'} downloaded.` });
  };

  const handleCopyAllData = () => {
    // console.debug("[MainTabContent] handleCopyAllData called.");
    const combinedData = getCombinedDataForExport();
    const stringifiedData = JSON.stringify(combinedData, null, 2);
    copyToClipboard(stringifiedData);
    toast({ title: "Data Copied", description: `Combined analysis for ${ticker || 'STOCK'} copied to clipboard.` });
  };

  const isAnyActionPending = isAnalyzeStockPending || isCalculateAiTaPending || isPerformAiAnalysisPending || isChatPending;

  const isDataReadyForExport =
    !stockSnapshotJson.includes('"status":') && !stockSnapshotJson.includes('"error":') && stockSnapshotJson !== '{}' &&
    !standardTasJson.includes('"status":') && !standardTasJson.includes('"error":') && standardTasJson !== '{}' &&
    !aiCalculatedTaJson.includes('"status":') && !aiCalculatedTaJson.includes('"error":') && aiCalculatedTaJson !== '{}' &&
    !optionsChainJson.includes('"status":') && !optionsChainJson.includes('"error":') && optionsChainJson !== '{}' &&
    !marketStatusJson.includes('"status":') && !marketStatusJson.includes('"error":') && marketStatusJson !== '{}';

  // console.debug(`[MainTabContent] Render. isAnyActionPending: ${isAnyActionPending}, isDataReadyForExport: ${isDataReadyForExport}`);

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

        <div className="space-y-2">
            <h3 className="text-lg font-medium">Data Export</h3>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleExportAllData} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isDataReadyForExport || isAnyActionPending}>
                    <Download className="mr-2 h-4 w-4" /> Export All to JSON
                </Button>
                <Button onClick={handleCopyAllData} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isDataReadyForExport || isAnyActionPending}>
                    <Copy className="mr-2 h-4 w-4" /> Copy All to JSON
                </Button>
            </div>
        </div>

        <Separator />

        <div className="space-y-6">
          <KeyMetricsDisplay />
          <StockSnapshotDetailsDisplay />
          <StandardTaDisplay />
          <AiCalculatedTaDisplay />
          <OptionsChainTable />
          <AiKeyTakeawaysDisplay />
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}
