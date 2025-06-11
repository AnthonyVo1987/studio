
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

import { useStockAnalysis, type FullAnalysisStatus } from "@/contexts/stock-analysis-context"; // Removed type ChatMessage as it's not used here
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap } from "lucide-react";
import { DebugLogCategory } from "@/lib/debug-log-types";

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
  const [ticker, setTicker] = useState("NVDA");
  const { toast } = useToast();
  const {
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
    
    fullAnalysisStatus, 
    setFullAnalysisStatus,
    isFullAnalysisTriggered,
    setIsFullAnalysisTriggered,
    clearChatHistory,
    logDebug, // Get logDebug from context
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

  const handleAnalyzeStockButtonSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isFullAnalysisTriggered) {
      toast({ title: "Full Analysis in Progress", description: "Please wait for the current full AI analysis to complete.", variant: "default" });
      return;
    }
    toast({ title: "Fetching Stock Data...", description: `Requesting data for ${ticker.toUpperCase()}.` });
    logDebug(DebugLogCategory.ACTION_LIFECYCLE, `[MainTabContent] handleAnalyzeStockButtonSubmit for ${ticker}`);

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

  const handleAiFullAnalysisSubmit = () => {
    if (isAnyActionPending) {
      toast({ title: "Process Busy", description: "Another analysis process is currently running.", variant: "default" });
      return;
    }
    toast({ title: "Starting Full AI Analysis...", description: `Initiating sequence for ${ticker.toUpperCase()}.` });
    logDebug(DebugLogCategory.ACTION_LIFECYCLE, `[MainTabContent] handleAiFullAnalysisSubmit for ${ticker}`);
    
    clearChatHistory(); 
    setFullAnalysisStatus('pending');
    setIsFullAnalysisTriggered(true);

    setMarketStatusJson('{ "status": "full_analysis_pending..." }');
    setStockSnapshotJson('{ "status": "full_analysis_pending..." }');
    setStandardTasJson('{ "status": "full_analysis_pending..." }');
    setOptionsChainJson('{ "status": "full_analysis_pending..." }');
    setAiCalculatedTaRequestJson('{ "status": "full_analysis_pending..." }');
    setAiCalculatedTaJson('{ "status": "full_analysis_pending..." }');
    setAiKeyTakeawaysRequestJson('{ "status": "full_analysis_pending..." }');
    setAiKeyTakeawaysJson('{ "status": "full_analysis_pending..." }');
    setChatbotRequestJson('{ "status": "full_analysis_pending..." }');
    setChatbotResponseJson('{ "status": "full_analysis_pending..." }');
    setPolygonApiRequestLogJson(`{ "status": "full_analysis_pending...", "input": {"ticker": "${ticker}"} }`);
    setPolygonApiResponseLogJson('{ "status": "full_analysis_pending..." }');

    startTransition(() => {
      analyzeStockFormAction({ ticker }); 
    });
  };


  useEffect(() => {
    logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] analyzeStockState changed:", analyzeStockState);
    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      // ... (rest of the logic for success)
      if (analyzeStockState.data.stockSnapshotJson && analyzeStockState.data.stockSnapshotJson !== '{}' && !analyzeStockState.data.stockSnapshotJson.includes('"error":')) {
        logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] analyzeStockState success, triggering calculateAiTaFormAction for", ticker);
        startTransition(() => {
          calculateAiTaFormAction({ stockSnapshotJson: analyzeStockState.data.stockSnapshotJson, ticker });
        });
      } else {
         logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] analyzeStockState success, BUT stockSnapshotJson is empty/error. Skipping AI TA.", ticker);
      }
    } else if (analyzeStockState.status === 'error') {
       logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] analyzeStockState error:", analyzeStockState.error);
    }
  }, [analyzeStockState, ticker, isFullAnalysisTriggered, setFullAnalysisStatus, setIsFullAnalysisTriggered,
      setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson,
      setPolygonApiRequestLogJson, setPolygonApiResponseLogJson, 
      calculateAiTaFormAction, toast,
      setAiCalculatedTaJson, setAiCalculatedTaRequestJson,
      setAiKeyTakeawaysJson, setAiKeyTakeawaysJson, logDebug 
    ]);

  useEffect(() => {
    logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] calculateAiTaState changed:", calculateAiTaState);
    if (calculateAiTaState.status === 'success' && calculateAiTaState.data) {
      // ...
      if (stockSnapshotJson !== '{}' && !stockSnapshotJson.includes('"error":') &&
          standardTasJson !== '{}' && !standardTasJson.includes('"error":') &&
          marketStatusJson !== '{}' && !marketStatusJson.includes('"error":') &&
          calculateAiTaState.data.aiCalculatedTaJson !== '{}' && !calculateAiTaState.data.aiCalculatedTaJson.includes('"error":')
          ) {
        logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] calculateAiTaState success, triggering performAiAnalysisFormAction for", ticker);
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
        logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] calculateAiTaState success, BUT prerequisite data missing/error. Skipping Key Takeaways.", ticker);
      }
    } else if (calculateAiTaState.status === 'error') {
      logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] calculateAiTaState error:", calculateAiTaState.error);
    }
  }, [calculateAiTaState, ticker, stockSnapshotJson, standardTasJson, marketStatusJson, isFullAnalysisTriggered,
      performAiAnalysisFormAction, setFullAnalysisStatus, setIsFullAnalysisTriggered,
      setAiCalculatedTaRequestJson, setAiCalculatedTaJson,
      setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson, toast, logDebug]);

  useEffect(() => {
    logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] performAiAnalysisState changed:", performAiAnalysisState);
    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      // ...
      if (isFullAnalysisTriggered) {
        logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] performAiAnalysisState success (full analysis), triggering chatFormAction for", ticker);
        const autoPrompt = "Provide a full detailed analysis of this stock based on all the context provided.";
        clearChatHistory(); 
        startTransition(() => {
          chatFormAction({
            ticker,
            stockSnapshotJson,
            aiKeyTakeawaysJson: performAiAnalysisState.data.aiKeyTakeawaysJson, 
            aiCalculatedTaJson,
            userInput: autoPrompt,
            chatHistory: [] 
          });
        });
      }
    } else if (performAiAnalysisState.status === 'error') {
      logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] performAiAnalysisState error:", performAiAnalysisState.error);
    }
  }, [performAiAnalysisState, ticker, stockSnapshotJson, aiCalculatedTaJson, aiKeyTakeawaysJson, isFullAnalysisTriggered, // Corrected: aiKeyTakeawaysJson was missing from deps
      chatFormAction, setFullAnalysisStatus, setIsFullAnalysisTriggered, clearChatHistory, 
      setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson, toast, logDebug]);
  
  useEffect(() => {
    logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] chatActionState changed:", chatActionState);
    if (chatActionState.status === 'success' && chatActionState.data) {
      // ...
    } else if (chatActionState.status === 'error') {
      logDebug(DebugLogCategory.ACTION_LIFECYCLE, "[MainTabContent] chatActionState error:", chatActionState.error);
    }
  }, [chatActionState, isFullAnalysisTriggered, fullAnalysisStatus, 
      setChatbotRequestJson, setChatbotResponseJson, 
      setFullAnalysisStatus, setIsFullAnalysisTriggered, toast, logDebug]);


  const getCombinedDataForExport = () => {
    const safeParse = (jsonString: string, key: string) => {
      try {
        if (jsonString.includes('"status":') || jsonString.includes('"error":')) {
           return { _placeholder_status_or_error: jsonString };
        }
        return JSON.parse(jsonString);
      } catch (e) {
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
    return dataToExport;
  };

  const handleExportAllData = () => {
    const combinedData = getCombinedDataForExport();
    downloadJson(combinedData, `${ticker || 'STOCK'}_stocksage_analysis.json`);
    toast({ title: "Data Exported", description: `Combined analysis for ${ticker || 'STOCK'} downloaded.` });
  };

  const handleCopyAllData = () => {
    const combinedData = getCombinedDataForExport();
    const stringifiedData = JSON.stringify(combinedData, null, 2);
    copyToClipboard(stringifiedData);
    toast({ title: "Data Copied", description: `Combined analysis for ${ticker || 'STOCK'} copied to clipboard.` });
  };

  const isAnySubActionPending = isAnalyzeStockPending || isCalculateAiTaPending || isPerformAiAnalysisPending || isChatPending;
  const isAnyActionPending = isAnySubActionPending || (isFullAnalysisTriggered && fullAnalysisStatus !== 'success' && fullAnalysisStatus !== 'error' && fullAnalysisStatus !== 'idle');


  const isDataReadyForExport =
    !stockSnapshotJson.includes('"status":') && !stockSnapshotJson.includes('"error":') && stockSnapshotJson !== '{}' &&
    !standardTasJson.includes('"status":') && !standardTasJson.includes('"error":') && standardTasJson !== '{}' &&
    !aiCalculatedTaJson.includes('"status":') && !aiCalculatedTaJson.includes('"error":') && aiCalculatedTaJson !== '{}' &&
    !optionsChainJson.includes('"status":') && !optionsChainJson.includes('"error":') && optionsChainJson !== '{}' &&
    !marketStatusJson.includes('"status":') && !marketStatusJson.includes('"error":') && marketStatusJson !== '{}';

  logDebug(DebugLogCategory.UI_COMPONENT_STATE, `[MainTabContent] Rendering. isAnyActionPending=${isAnyActionPending}, fullAnalysisStatus=${fullAnalysisStatus}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis</CardTitle>
        <CardDescription>
          Enter a stock ticker and select a data source to begin your analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAnalyzeStockButtonSubmit} className="space-y-4">
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
                (analyzeStockState.status === 'success' && !isFullAnalysisTriggered && isCalculateAiTaPending) ||
                (calculateAiTaState.status === 'success' && !isFullAnalysisTriggered && isPerformAiAnalysisPending)
              ) && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
              Analyze Stock
            </Button>
            <Button onClick={handleAiFullAnalysisSubmit} type="button" variant="outline" className="w-full sm:w-auto" disabled={isAnyActionPending}>
               {isFullAnalysisTriggered && fullAnalysisStatus !== 'idle' && fullAnalysisStatus !== 'success' && fullAnalysisStatus !== 'error' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Zap className="mr-2 h-4 w-4" /> AI Full Stock Analysis
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
          {/* Chatbot UI will be added here in Task 6.6 */}
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}
