
"use client";

import type { FormEvent } from 'react';
import React, { useState, useActionState, useEffect, startTransition, useRef } from "react";
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

import { useStockAnalysis, type FullAnalysisStatus } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap } from "lucide-react";

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
  const [tickerInput, setTickerInput] = useState("NVDA"); 
  const analysisTriggeredForTickerRef = useRef<string | null>(null);

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
    logDebug,
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

  const initiateAnalysisSequence = (currentTickerToAnalyze: string) => {
    analysisTriggeredForTickerRef.current = currentTickerToAnalyze;
    toast({ title: "Fetching Stock Data...", description: `Requesting data for ${currentTickerToAnalyze.toUpperCase()}.` });
    logDebug('MainTabContent', `initiateAnalysisSequence for ${currentTickerToAnalyze}`);

    const pendingPlaceholder = `{ "status": "pending..." }`;
    const fullAnalysisPendingPlaceholder = `{ "status": "full_analysis_pending..." }`;
    const placeholderToUse = isFullAnalysisTriggered ? fullAnalysisPendingPlaceholder : pendingPlaceholder;

    setMarketStatusJson(placeholderToUse);
    setStockSnapshotJson(placeholderToUse);
    setStandardTasJson(placeholderToUse);
    setOptionsChainJson(placeholderToUse);
    setPolygonApiRequestLogJson(`{ "status": "pending...", "input": {"ticker": "${currentTickerToAnalyze}"} }`);
    setPolygonApiResponseLogJson(placeholderToUse);
    
    setAiCalculatedTaRequestJson(placeholderToUse);
    setAiCalculatedTaJson(placeholderToUse);
    setAiKeyTakeawaysRequestJson(placeholderToUse);
    setAiKeyTakeawaysJson(placeholderToUse);

    if (isFullAnalysisTriggered) {
        setChatbotRequestJson(placeholderToUse);
        setChatbotResponseJson(placeholderToUse);
    }
    
    startTransition(() => {
      analyzeStockFormAction({ ticker: currentTickerToAnalyze });
    });
  };

  const handleAnalyzeStockButtonSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (isFullAnalysisTriggered) {
      toast({ title: "Full Analysis in Progress", description: "Please wait for the current full AI analysis to complete.", variant: "default" });
      return;
    }
    if (isAnyActionPending) {
       toast({ title: "Process Busy", description: "Another analysis process is currently running.", variant: "default" });
       return;
    }
    setIsFullAnalysisTriggered(false); 
    initiateAnalysisSequence(tickerInput);
  };

  const handleAiFullAnalysisSubmit = () => {
    if (isAnyActionPending) {
      toast({ title: "Process Busy", description: "Another analysis process is currently running.", variant: "default" });
      return;
    }
    toast({ title: "Starting Full AI Analysis...", description: `Initiating sequence for ${tickerInput.toUpperCase()}.` });
    logDebug('MainTabContent', `handleAiFullAnalysisSubmit for ${tickerInput}`);

    clearChatHistory();
    setFullAnalysisStatus('pending');
    setIsFullAnalysisTriggered(true);
    initiateAnalysisSequence(tickerInput);
  };


  useEffect(() => {
    logDebug('MainTabContent', "analyzeStockState changed:", analyzeStockState);
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;

    if (analyzeStockState.status === 'success' && analyzeStockState.data && currentAnalysisTicker) {
      toast({ title: "Data Fetched", description: analyzeStockState.message });
      setMarketStatusJson(analyzeStockState.data.marketStatusJson);
      setStockSnapshotJson(analyzeStockState.data.stockSnapshotJson);
      setStandardTasJson(analyzeStockState.data.standardTasJson);
      setOptionsChainJson(analyzeStockState.data.optionsChainJson);
      setPolygonApiRequestLogJson(analyzeStockState.data.polygonApiRequestLogJson);
      setPolygonApiResponseLogJson(analyzeStockState.data.polygonApiResponseLogJson);

      if (isFullAnalysisTriggered) {
        setFullAnalysisStatus('calculatingAiTa');
      }

      if (analyzeStockState.data.stockSnapshotJson && analyzeStockState.data.stockSnapshotJson !== '{}' && !analyzeStockState.data.stockSnapshotJson.includes('"error":')) {
        logDebug('MainTabContent', "analyzeStockState success, triggering calculateAiTaFormAction for", currentAnalysisTicker);
        startTransition(() => {
          calculateAiTaFormAction({ stockSnapshotJson: analyzeStockState.data.stockSnapshotJson, ticker: currentAnalysisTicker });
        });
      } else {
         logDebug('MainTabContent', "analyzeStockState success, BUT stockSnapshotJson is empty/error. Skipping AI TA for", currentAnalysisTicker);
         const errorMsg = `{ "status": "skipped", "reason": "Stock snapshot data missing or error for ${currentAnalysisTicker}." }`;
         setAiCalculatedTaRequestJson(errorMsg);
         setAiCalculatedTaJson(errorMsg);
         if (isFullAnalysisTriggered) {
            setFullAnalysisStatus('generatingTakeaways'); 
            logDebug('MainTabContent', "Full analysis: stock snapshot error, attempting to proceed to takeaways for", currentAnalysisTicker);
             startTransition(() => {
                performAiAnalysisFormAction({
                    ticker: currentAnalysisTicker,
                    stockSnapshotJson: analyzeStockState.data.stockSnapshotJson, 
                    standardTasJson, 
                    aiCalculatedTaJson: errorMsg,
                    marketStatusJson
                });
            });
         } else {
            analysisTriggeredForTickerRef.current = null; // End of chain for standard analysis if snapshot fails
            logDebug('MainTabContent', "Standard analysis: stock snapshot error, sequence ended. Cleared analysisTriggeredForTickerRef.");
         }
      }
    } else if (analyzeStockState.status === 'error') {
       logDebug('MainTabContent', "analyzeStockState error:", analyzeStockState.error);
       toast({ variant: "destructive", title: "Data Fetch Error", description: analyzeStockState.message });
       const errorJson = `{ "status": "error", "message": "${analyzeStockState.message?.replace(/"/g, '\\"')}" }`;
       setMarketStatusJson(errorJson);
       setStockSnapshotJson(errorJson);
       setStandardTasJson(errorJson);
       setOptionsChainJson(errorJson);
       setAiCalculatedTaRequestJson(errorJson);
       setAiCalculatedTaJson(errorJson);
       setAiKeyTakeawaysRequestJson(errorJson);
       setAiKeyTakeawaysJson(errorJson);
       if (isFullAnalysisTriggered) {
            setIsFullAnalysisTriggered(false);
            setFullAnalysisStatus('error');
       }
       analysisTriggeredForTickerRef.current = null; 
       logDebug('MainTabContent', "analyzeStockState error, cleared analysisTriggeredForTickerRef.");
    }
  }, [analyzeStockState, isFullAnalysisTriggered, marketStatusJson, standardTasJson, // Only include JSONs if they are INPUTS to the next step
      setFullAnalysisStatus, setIsFullAnalysisTriggered,
      setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson,
      setPolygonApiRequestLogJson, setPolygonApiResponseLogJson,
      calculateAiTaFormAction, setAiCalculatedTaRequestJson, setAiCalculatedTaJson, 
      performAiAnalysisFormAction, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
      toast, logDebug
    ]);

  useEffect(() => {
    logDebug('MainTabContent', "calculateAiTaState changed:", calculateAiTaState);
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;

    if (calculateAiTaState.status === 'success' && calculateAiTaState.data && currentAnalysisTicker) {
      toast({ title: "AI TA Calculated", description: calculateAiTaState.message });
      setAiCalculatedTaRequestJson(calculateAiTaState.data.aiCalculatedTaRequestJson);
      setAiCalculatedTaJson(calculateAiTaState.data.aiCalculatedTaJson);

      if (isFullAnalysisTriggered) {
        setFullAnalysisStatus('generatingTakeaways');
      }

      if (stockSnapshotJson !== '{}' && !stockSnapshotJson.includes('"error":') &&
          standardTasJson !== '{}' && !standardTasJson.includes('"error":') &&
          marketStatusJson !== '{}' && !marketStatusJson.includes('"error":') &&
          calculateAiTaState.data.aiCalculatedTaJson !== '{}' && !calculateAiTaState.data.aiCalculatedTaJson.includes('"error":')
          ) {
        logDebug('MainTabContent', "calculateAiTaState success, triggering performAiAnalysisFormAction for", currentAnalysisTicker);
        startTransition(() => {
          performAiAnalysisFormAction({
            ticker: currentAnalysisTicker,
            stockSnapshotJson,
            standardTasJson,
            aiCalculatedTaJson: calculateAiTaState.data.aiCalculatedTaJson, 
            marketStatusJson
          });
        });
      } else {
        logDebug('MainTabContent', "calculateAiTaState success, BUT prerequisite data missing/error for Key Takeaways. Skipping for", currentAnalysisTicker);
        const errorMsg = `{ "status": "skipped", "reason": "Prerequisite data for key takeaways missing or error after AI TA calc for ${currentAnalysisTicker}." }`;
        setAiKeyTakeawaysRequestJson(errorMsg);
        setAiKeyTakeawaysJson(errorMsg);
        if (isFullAnalysisTriggered) {
             logDebug('MainTabContent', "Full analysis: prerequisite data error before takeaways, attempting to proceed to chat for", currentAnalysisTicker);
             setFullAnalysisStatus('chatting');
             const autoPrompt = "Provide a full detailed analysis of this stock based on all the context provided (some context may be missing due to errors).";
             clearChatHistory();
             startTransition(() => {
               chatFormAction({
                 ticker: currentAnalysisTicker,
                 stockSnapshotJson, 
                 aiKeyTakeawaysJson: errorMsg, 
                 aiCalculatedTaJson: calculateAiTaState.data.aiCalculatedTaJson,
                 userInput: autoPrompt,
                 chatHistory: []
               });
             });
        } else {
            analysisTriggeredForTickerRef.current = null; // End of chain for standard analysis if prerequisites for takeaways fail
            logDebug('MainTabContent', "Standard analysis: prerequisite data error for takeaways, sequence ended. Cleared analysisTriggeredForTickerRef.");
        }
      }
    } else if (calculateAiTaState.status === 'error') {
      logDebug('MainTabContent', "calculateAiTaState error:", calculateAiTaState.error);
      toast({ variant: "destructive", title: "AI TA Error", description: calculateAiTaState.message });
      const errorJson = `{ "status": "error", "message": "${calculateAiTaState.message?.replace(/"/g, '\\"')}" }`;
      setAiCalculatedTaRequestJson(errorJson);
      setAiCalculatedTaJson(errorJson);
      setAiKeyTakeawaysRequestJson(errorJson); 
      setAiKeyTakeawaysJson(errorJson);
      if (isFullAnalysisTriggered) {
        setFullAnalysisStatus('error');
        setIsFullAnalysisTriggered(false);
      }
      analysisTriggeredForTickerRef.current = null;
      logDebug('MainTabContent', "calculateAiTaState error, cleared analysisTriggeredForTickerRef.");
    }
  }, [calculateAiTaState, stockSnapshotJson, standardTasJson, marketStatusJson, isFullAnalysisTriggered,
      performAiAnalysisFormAction, setFullAnalysisStatus, setIsFullAnalysisTriggered, clearChatHistory, chatFormAction,
      setAiCalculatedTaRequestJson, setAiCalculatedTaJson, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
      toast, logDebug
    ]);

  useEffect(() => {
    logDebug('MainTabContent', "performAiAnalysisState changed:", performAiAnalysisState);
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;

    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data && currentAnalysisTicker) {
      toast({ title: "AI Key Takeaways Generated", description: performAiAnalysisState.message });
      setAiKeyTakeawaysRequestJson(performAiAnalysisState.data.aiKeyTakeawaysRequestJson);
      setAiKeyTakeawaysJson(performAiAnalysisState.data.aiKeyTakeawaysJson);

      if (isFullAnalysisTriggered) {
        logDebug('MainTabContent', "performAiAnalysisState success (full analysis), triggering chatFormAction for", currentAnalysisTicker);
        setFullAnalysisStatus('chatting');
        const autoPrompt = "Provide a full detailed analysis of this stock based on all the context provided.";
        clearChatHistory();
        startTransition(() => {
          chatFormAction({
            ticker: currentAnalysisTicker,
            stockSnapshotJson,
            aiKeyTakeawaysJson: performAiAnalysisState.data.aiKeyTakeawaysJson,
            aiCalculatedTaJson, 
            userInput: autoPrompt,
            chatHistory: []
          });
        });
      } else {
        logDebug('MainTabContent', "performAiAnalysisState success (standard analysis), clearing analysisTriggeredForTickerRef.");
        analysisTriggeredForTickerRef.current = null;
      }
    } else if (performAiAnalysisState.status === 'error') {
      logDebug('MainTabContent', "performAiAnalysisState error:", performAiAnalysisState.error);
      toast({ variant: "destructive", title: "AI Analysis Error", description: performAiAnalysisState.message });
      const errorJson = `{ "status": "error", "message": "${performAiAnalysisState.message?.replace(/"/g, '\\"')}" }`;
      setAiKeyTakeawaysRequestJson(errorJson);
      setAiKeyTakeawaysJson(errorJson);
      if (isFullAnalysisTriggered) {
        setFullAnalysisStatus('error');
        setIsFullAnalysisTriggered(false);
      }
      analysisTriggeredForTickerRef.current = null;
      logDebug('MainTabContent', "performAiAnalysisState error, cleared analysisTriggeredForTickerRef.");
    }
  }, [performAiAnalysisState, stockSnapshotJson, aiCalculatedTaJson, isFullAnalysisTriggered,
      chatFormAction, setFullAnalysisStatus, setIsFullAnalysisTriggered, clearChatHistory,
      setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson, toast, logDebug]);

  useEffect(() => {
    logDebug('MainTabContent', "chatActionState changed:", chatActionState);
    if (chatActionState.status === 'success' && chatActionState.data) {
      toast({ title: "Chatbot Responded", description: chatActionState.message });
      setChatbotRequestJson(chatActionState.data.chatbotRequestJson);
      setChatbotResponseJson(chatActionState.data.chatbotResponseJson);
      if (isFullAnalysisTriggered) {
        setFullAnalysisStatus('success');
        setIsFullAnalysisTriggered(false);
        toast({ title: "Full AI Analysis Complete!", description: "All steps finished. See chat for summary.", duration: 5000 });
      }
      analysisTriggeredForTickerRef.current = null; 
      logDebug('MainTabContent', "chatActionState success, cleared analysisTriggeredForTickerRef.");
    } else if (chatActionState.status === 'error') {
      logDebug('MainTabContent', "chatActionState error:", chatActionState.error);
      toast({ variant: "destructive", title: "Chatbot Error", description: chatActionState.message });
      setChatbotRequestJson(chatActionState.data?.chatbotRequestJson || `{ "status": "error", "message": "Request data missing for chat" }`);
      setChatbotResponseJson(chatActionState.data?.chatbotResponseJson || `{ "status": "error", "message": "${chatActionState.message?.replace(/"/g, '\\"')}" }`);
      if (isFullAnalysisTriggered) {
        setFullAnalysisStatus('error');
        setIsFullAnalysisTriggered(false);
      }
      analysisTriggeredForTickerRef.current = null; 
      logDebug('MainTabContent', "chatActionState error, cleared analysisTriggeredForTickerRef.");
    }
  }, [chatActionState, isFullAnalysisTriggered,
      setChatbotRequestJson, setChatbotResponseJson,
      setFullAnalysisStatus, setIsFullAnalysisTriggered, toast, logDebug]);
  
  const isAnySubActionPending = isAnalyzeStockPending || isCalculateAiTaPending || isPerformAiAnalysisPending || isChatPending;
  const isAnyActionPending = isAnySubActionPending || (isFullAnalysisTriggered && fullAnalysisStatus !== 'success' && fullAnalysisStatus !== 'error' && fullAnalysisStatus !== 'idle');


  const isDataReadyForExport =
    !stockSnapshotJson.includes('"status":') && !stockSnapshotJson.includes('"error":') && stockSnapshotJson !== '{}' &&
    !standardTasJson.includes('"status":') && !standardTasJson.includes('"error":') && standardTasJson !== '{}' &&
    !aiCalculatedTaJson.includes('"status":') && !aiCalculatedTaJson.includes('"error":') && aiCalculatedTaJson !== '{}' &&
    !optionsChainJson.includes('"status":') && !optionsChainJson.includes('"error":') && optionsChainJson !== '{}' &&
    !marketStatusJson.includes('"status":') && !marketStatusJson.includes('"error":') && marketStatusJson !== '{}';

  logDebug('MainTabContent', `Rendering. isAnyActionPending=${isAnyActionPending}, fullAnalysisStatus=${fullAnalysisStatus}, currentTickerInput=${tickerInput}`);

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
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
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
                (analyzeStockState.status === 'success' && !isFullAnalysisTriggered && (isCalculateAiTaPending || isPerformAiAnalysisPending))
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
                <Button onClick={() => downloadJson(getCombinedDataForExport(), `${tickerInput || 'STOCK'}_stocksage_analysis.json`)} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isDataReadyForExport || isAnyActionPending}>
                    <Download className="mr-2 h-4 w-4" /> Export All to JSON
                </Button>
                <Button onClick={() => {
                    copyToClipboard(JSON.stringify(getCombinedDataForExport(), null, 2));
                    toast({ title: "Data Copied", description: `Combined analysis for ${tickerInput || 'STOCK'} copied to clipboard.` });
                }} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isDataReadyForExport || isAnyActionPending}>
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
    