
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
import { AiAnalyzedTaDisplay } from "@/components/ai-analyzed-ta-display"; // Renamed import
import { AiOptionsAnalysisDisplay } from "@/components/ai-options-analysis-display"; // New import
import { AiKeyTakeawaysDisplay } from "@/components/ai-key-takeaways-display";
import { OptionsChainTable } from "@/components/options-chain-table";
import { Chatbot } from "@/components/chatbot";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";

import { fetchStockDataAction, type AnalyzeStockServerActionState } from "@/actions/analyze-stock-server-action";
import { analyzeTaAction, type AnalyzeTaActionState } from "@/actions/analyze-ta-action"; // Renamed import
import { performAiAnalysisAction, type PerformAiAnalysisActionState } from "@/actions/perform-ai-analysis-action";
import { performAiOptionsAnalysisAction, type PerformAiOptionsAnalysisActionState } from "@/actions/perform-ai-options-analysis-action"; // New import
import { chatServerAction, type ChatActionState, type ChatActionInputs } from "@/actions/chat-server-action";

import { useStockAnalysis, type FullAnalysisStatus } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap } from "lucide-react";

const initialStockDataFetchState: AnalyzeStockServerActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialAnalyzeTaState: AnalyzeTaActionState = { // Renamed
  status: 'idle', data: undefined, error: null, message: null,
};
const initialPerformAiOptionsAnalysisState: PerformAiOptionsAnalysisActionState = { // New
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
    marketStatusJson: contextMarketStatusJson,
    stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson,
    optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson, // Renamed
    aiOptionsAnalysisJson: contextAiOptionsAnalysisJson, // New
    setMarketStatusJson,
    setStockSnapshotJson,
    setStandardTasJson,
    setOptionsChainJson,
    setPolygonApiRequestLogJson,
    setPolygonApiResponseLogJson,
    setAiAnalyzedTaRequestJson, // Renamed
    setAiAnalyzedTaJson,        // Renamed
    setAiOptionsAnalysisRequestJson, // New
    setAiOptionsAnalysisJson,        // New
    setAiKeyTakeawaysRequestJson,
    setAiKeyTakeawaysJson,
    setChatbotRequestJson,
    setChatbotResponseJson,
    addChatMessage,
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

  const [analyzeTaState, analyzeTaFormAction, isAnalyzeTaPending] = useActionState<AnalyzeTaActionState, { stockSnapshotJson: string, ticker?: string }>(
    analyzeTaAction, // Renamed action
    initialAnalyzeTaState // Renamed state
  );

  const [performAiOptionsAnalysisState, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending] = useActionState<PerformAiOptionsAnalysisActionState, Parameters<typeof performAiOptionsAnalysisAction>[1]>(
    performAiOptionsAnalysisAction, // New action
    initialPerformAiOptionsAnalysisState // New state
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
    const initializingPlaceholder = `{ "status": "initializing..." }`;
    const fullAnalysisPendingPlaceholder = `{ "status": "full_analysis_pending..." }`;
    
    const placeholderToUse = isFullAnalysisTriggered ? fullAnalysisPendingPlaceholder : pendingPlaceholder;
    const requestLogPlaceholder = isFullAnalysisTriggered 
        ? `{ "status": "full_analysis_pending...", "input": {"ticker": "${currentTickerToAnalyze}"} }`
        : `{ "status": "pending...", "input": {"ticker": "${currentTickerToAnalyze}"} }`;

    setMarketStatusJson(placeholderToUse);
    setStockSnapshotJson(placeholderToUse);
    setStandardTasJson(placeholderToUse);
    setOptionsChainJson(placeholderToUse);
    setPolygonApiRequestLogJson(requestLogPlaceholder);
    setPolygonApiResponseLogJson(placeholderToUse);
    
    setAiAnalyzedTaRequestJson(placeholderToUse); 
    setAiAnalyzedTaJson(placeholderToUse);
    setAiOptionsAnalysisRequestJson(placeholderToUse); // New
    setAiOptionsAnalysisJson(placeholderToUse);        // New
    setAiKeyTakeawaysRequestJson(placeholderToUse);
    setAiKeyTakeawaysJson(placeholderToUse);

    setChatbotRequestJson(initializingPlaceholder); 
    setChatbotResponseJson(initializingPlaceholder);
    
    startTransition(() => {
      analyzeStockFormAction({ ticker: currentTickerToAnalyze });
    });
  };

  const handleAnalyzeStockButtonSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    logDebug('MainTabContent', 'Analyze Stock button clicked.');
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
    logDebug('MainTabContent', 'AI Full Stock Analysis button clicked.');
    if (isAnyActionPending) {
      toast({ title: "Process Busy", description: "Another analysis process is currently running.", variant: "default" });
      return;
    }
    toast({ title: "Starting Full AI Analysis...", description: `Initiating sequence for ${tickerInput.toUpperCase()}.` });
    clearChatHistory();
    setFullAnalysisStatus('pending');
    setIsFullAnalysisTriggered(true);
    initiateAnalysisSequence(tickerInput);
  };

  // Effect for analyzeStockState -> triggers analyzeTaFormAction
  useEffect(() => {
    logDebug('MainTabContent', "analyzeStockState changed:", analyzeStockState);
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (!currentAnalysisTicker) return;

    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      toast({ title: "Data Fetched", description: analyzeStockState.message });
      setMarketStatusJson(analyzeStockState.data.marketStatusJson);
      setStockSnapshotJson(analyzeStockState.data.stockSnapshotJson);
      setStandardTasJson(analyzeStockState.data.standardTasJson);
      setOptionsChainJson(analyzeStockState.data.optionsChainJson);
      setPolygonApiRequestLogJson(analyzeStockState.data.polygonApiRequestLogJson);
      setPolygonApiResponseLogJson(analyzeStockState.data.polygonApiResponseLogJson);

      if (isFullAnalysisTriggered) setFullAnalysisStatus('analyzingTa');

      if (analyzeStockState.data.stockSnapshotJson && !analyzeStockState.data.stockSnapshotJson.includes('"error":') && !analyzeStockState.data.stockSnapshotJson.includes('"status":')) {
        logDebug('MainTabContent', "analyzeStockState success, triggering analyzeTaFormAction for", currentAnalysisTicker);
        const aiTaPendingPlaceholder = `{ "status": "pending..." }`;
        setAiAnalyzedTaRequestJson(aiTaPendingPlaceholder);
        setAiAnalyzedTaJson(aiTaPendingPlaceholder);
        startTransition(() => analyzeTaFormAction({ stockSnapshotJson: analyzeStockState.data.stockSnapshotJson, ticker: currentAnalysisTicker }));
      } else {
        const errorMsg = `Stock snapshot data missing/error for ${currentAnalysisTicker}. Skipping AI TA.`;
        logDebug('MainTabContent', "analyzeStockState success, BUT " + errorMsg);
        toast({ variant: "destructive", title: "AI TA Skipped", description: errorMsg, duration: 7000 });
        const skippedJson = `{ "status": "skipped", "reason": "${errorMsg.replace(/"/g, '\\"')}" }`;
        setAiAnalyzedTaRequestJson(skippedJson);
        setAiAnalyzedTaJson(skippedJson);
        if (isFullAnalysisTriggered) {
          setFullAnalysisStatus('generatingTakeaways'); // Skip to takeaways if TA fails at this stage
          startTransition(() => performAiAnalysisFormAction({
            ticker: currentAnalysisTicker,
            stockSnapshotJson: analyzeStockState.data.stockSnapshotJson || "{}",
            standardTasJson: analyzeStockState.data.standardTasJson || "{}",
            aiAnalyzedTaJson: skippedJson,
            marketStatusJson: analyzeStockState.data.marketStatusJson || "{}"
          }));
        } else analysisTriggeredForTickerRef.current = null;
      }
    } else if (analyzeStockState.status === 'error') {
      logDebug('MainTabContent', "analyzeStockState error:", analyzeStockState.error);
      toast({ variant: "destructive", title: "Data Fetch Error", description: analyzeStockState.message });
      const errorJson = `{ "status": "error", "message": "${analyzeStockState.message?.replace(/"/g, '\\"')}" }`;
      [setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson, setAiAnalyzedTaRequestJson, setAiAnalyzedTaJson, setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson].forEach(setter => setter(errorJson));
      if (isFullAnalysisTriggered) { setIsFullAnalysisTriggered(false); setFullAnalysisStatus('error'); }
      if (currentAnalysisTicker) analysisTriggeredForTickerRef.current = null;
    }
  }, [analyzeStockState, isFullAnalysisTriggered, setFullAnalysisStatus, setIsFullAnalysisTriggered,
      setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson,
      setPolygonApiRequestLogJson, setPolygonApiResponseLogJson,
      analyzeTaFormAction, setAiAnalyzedTaRequestJson, setAiAnalyzedTaJson, 
      performAiAnalysisFormAction, setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson,
      setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
      toast, logDebug]);

  // Effect for analyzeTaState -> triggers performAiOptionsAnalysisAction
  useEffect(() => {
    logDebug('MainTabContent', "analyzeTaState changed:", analyzeTaState);
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (!currentAnalysisTicker) return;

    if (analyzeTaState.status === 'success' && analyzeTaState.data) {
      toast({ title: "AI TA Analyzed", description: analyzeTaState.message });
      setAiAnalyzedTaRequestJson(analyzeTaState.data.aiAnalyzedTaRequestJson);
      setAiAnalyzedTaJson(analyzeTaState.data.aiAnalyzedTaJson);

      if (isFullAnalysisTriggered) setFullAnalysisStatus('analyzingOptions');

      if (analyzeStockState.status === 'success' && analyzeStockState.data?.optionsChainJson && 
          !analyzeStockState.data.optionsChainJson.includes('"error":') && !analyzeStockState.data.optionsChainJson.includes('"status":') &&
          analyzeStockState.data.stockSnapshotJson && !analyzeStockState.data.stockSnapshotJson.includes('"error":') && !analyzeStockState.data.stockSnapshotJson.includes('"status":')) {
        logDebug('MainTabContent', "analyzeTaState success, triggering performAiOptionsAnalysisFormAction for", currentAnalysisTicker);
        const optionsPendingPlaceholder = `{ "status": "pending..." }`;
        setAiOptionsAnalysisRequestJson(optionsPendingPlaceholder);
        setAiOptionsAnalysisJson(optionsPendingPlaceholder);
        startTransition(() => performAiOptionsAnalysisFormAction({
            ticker: currentAnalysisTicker,
            optionsChainJson: analyzeStockState.data.optionsChainJson,
            stockSnapshotJson: analyzeStockState.data.stockSnapshotJson
        }));
      } else {
        const errorMsg = `Options chain or snapshot data missing/error for AI Options Analysis for ${currentAnalysisTicker}. Options: ${analyzeStockState.data?.optionsChainJson?.substring(0,50)}, Snapshot: ${analyzeStockState.data?.stockSnapshotJson?.substring(0,50)}`;
        logDebug('MainTabContent', "analyzeTaState success, BUT " + errorMsg);
        toast({ variant: "destructive", title: "AI Options Analysis Skipped", description: errorMsg, duration: 7000 });
        const skippedJson = `{ "status": "skipped", "reason": "${errorMsg.replace(/"/g, '\\"')}" }`;
        setAiOptionsAnalysisRequestJson(skippedJson);
        setAiOptionsAnalysisJson(skippedJson);
        if (isFullAnalysisTriggered) {
          setFullAnalysisStatus('generatingTakeaways');
          startTransition(() => performAiAnalysisFormAction({
            ticker: currentAnalysisTicker,
            stockSnapshotJson: analyzeStockState.data?.stockSnapshotJson || "{}",
            standardTasJson: analyzeStockState.data?.standardTasJson || "{}",
            aiAnalyzedTaJson: analyzeTaState.data.aiAnalyzedTaJson, // Use the successful TA data
            marketStatusJson: analyzeStockState.data?.marketStatusJson || "{}"
          }));
        } else analysisTriggeredForTickerRef.current = null;
      }
    } else if (analyzeTaState.status === 'error') {
      logDebug('MainTabContent', "analyzeTaState error:", analyzeTaState.error);
      toast({ variant: "destructive", title: "AI TA Error", description: analyzeTaState.message });
      const errorJson = `{ "status": "error", "message": "${analyzeTaState.message?.replace(/"/g, '\\"')}" }`;
      setAiAnalyzedTaRequestJson(errorJson); setAiAnalyzedTaJson(errorJson);
      setAiOptionsAnalysisRequestJson(errorJson); setAiOptionsAnalysisJson(errorJson); // Also mark options analysis as error
      setAiKeyTakeawaysRequestJson(errorJson); setAiKeyTakeawaysJson(errorJson);
      if (isFullAnalysisTriggered) { setIsFullAnalysisTriggered(false); setFullAnalysisStatus('error'); }
      if (currentAnalysisTicker && !isFullAnalysisTriggered) analysisTriggeredForTickerRef.current = null;
    }
  }, [analyzeTaState, analyzeStockState, isFullAnalysisTriggered, performAiOptionsAnalysisFormAction,
      setFullAnalysisStatus, setIsFullAnalysisTriggered, setAiAnalyzedTaRequestJson, setAiAnalyzedTaJson,
      setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
      performAiAnalysisFormAction, toast, logDebug]);

  // Effect for performAiOptionsAnalysisState -> triggers performAiAnalysisAction (Key Takeaways)
  useEffect(() => {
    logDebug('MainTabContent', "performAiOptionsAnalysisState changed:", performAiOptionsAnalysisState);
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (!currentAnalysisTicker) return;

    if (performAiOptionsAnalysisState.status === 'success' && performAiOptionsAnalysisState.data) {
      toast({ title: "AI Options Analysis Complete", description: performAiOptionsAnalysisState.message });
      setAiOptionsAnalysisRequestJson(performAiOptionsAnalysisState.data.aiOptionsAnalysisRequestJson);
      setAiOptionsAnalysisJson(performAiOptionsAnalysisState.data.aiOptionsAnalysisJson);
      
      if (isFullAnalysisTriggered) setFullAnalysisStatus('generatingTakeaways');
      
      if (analyzeStockState.status === 'success' && analyzeStockState.data &&
          analyzeTaState.status === 'success' && analyzeTaState.data) {
          logDebug('MainTabContent', "performAiOptionsAnalysisState success, triggering performAiAnalysisFormAction (Key Takeaways) for", currentAnalysisTicker);
          const takeawaysPendingPlaceholder = `{ "status": "pending..." }`;
          setAiKeyTakeawaysRequestJson(takeawaysPendingPlaceholder);
          setAiKeyTakeawaysJson(takeawaysPendingPlaceholder);
          startTransition(() => performAiAnalysisFormAction({
              ticker: currentAnalysisTicker,
              stockSnapshotJson: analyzeStockState.data.stockSnapshotJson || '{}',
              standardTasJson: analyzeStockState.data.standardTasJson || '{}',
              aiAnalyzedTaJson: analyzeTaState.data.aiAnalyzedTaJson || '{}',
              marketStatusJson: analyzeStockState.data.marketStatusJson || '{}'
          }));
      } else {
        const errorMsg = `Prerequisite data missing for Key Takeaways (Snapshot, Standard TAs, or AI Analyzed TA) after Options Analysis for ${currentAnalysisTicker}.`;
        logDebug('MainTabContent', "performAiOptionsAnalysisState success, BUT " + errorMsg);
        toast({ variant: "destructive", title: "Key Takeaways Skipped", description: errorMsg, duration: 7000 });
        const skippedJson = `{ "status": "skipped", "reason": "${errorMsg.replace(/"/g, '\\"')}" }`;
        setAiKeyTakeawaysRequestJson(skippedJson); setAiKeyTakeawaysJson(skippedJson);
        if (isFullAnalysisTriggered) {
            setFullAnalysisStatus('chatting'); // Proceed to chat even if takeaways fail
            const autoPrompt = "Provide an analysis based on available data (some steps may have been skipped).";
            clearChatHistory();
            startTransition(() => chatFormAction({
                ticker: currentAnalysisTicker,
                stockSnapshotJson: analyzeStockState.data?.stockSnapshotJson || '{}',
                aiKeyTakeawaysJson: skippedJson,
                aiAnalyzedTaJson: analyzeTaState.data?.aiAnalyzedTaJson || '{}',
                aiOptionsAnalysisJson: performAiOptionsAnalysisState.data.aiOptionsAnalysisJson, // Use successful options analysis
                userInput: autoPrompt, chatHistory: []
            }));
        } else analysisTriggeredForTickerRef.current = null;
      }
    } else if (performAiOptionsAnalysisState.status === 'error') {
        logDebug('MainTabContent', "performAiOptionsAnalysisState error:", performAiOptionsAnalysisState.error);
        toast({ variant: "destructive", title: "AI Options Analysis Error", description: performAiOptionsAnalysisState.message });
        const errorJson = `{ "status": "error", "message": "${performAiOptionsAnalysisState.message?.replace(/"/g, '\\"')}" }`;
        setAiOptionsAnalysisRequestJson(errorJson); setAiOptionsAnalysisJson(errorJson);
        setAiKeyTakeawaysRequestJson(errorJson); setAiKeyTakeawaysJson(errorJson); // Mark Key Takeaways as error too
        if (isFullAnalysisTriggered) { setIsFullAnalysisTriggered(false); setFullAnalysisStatus('error'); }
        if (currentAnalysisTicker && !isFullAnalysisTriggered) analysisTriggeredForTickerRef.current = null;
    }
  }, [performAiOptionsAnalysisState, analyzeStockState, analyzeTaState, isFullAnalysisTriggered,
      performAiAnalysisFormAction, setFullAnalysisStatus, setIsFullAnalysisTriggered,
      setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
      clearChatHistory, chatFormAction, toast, logDebug]);

  // Effect for performAiAnalysisState (Key Takeaways) -> triggers chatFormAction
  useEffect(() => {
    logDebug('MainTabContent', "performAiAnalysisState (Key Takeaways) changed:", performAiAnalysisState);
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (!currentAnalysisTicker) return;

    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Generated", description: performAiAnalysisState.message });
      setAiKeyTakeawaysRequestJson(performAiAnalysisState.data.aiKeyTakeawaysRequestJson);
      setAiKeyTakeawaysJson(performAiAnalysisState.data.aiKeyTakeawaysJson);

      if (isFullAnalysisTriggered) {
        setFullAnalysisStatus('chatting');
        logDebug('MainTabContent', "performAiAnalysisState success (full analysis), triggering chatFormAction for", currentAnalysisTicker);
        const autoPrompt = "Provide a full detailed analysis of this stock based on all the context provided.";
        clearChatHistory();
        startTransition(() => chatFormAction({
            ticker: currentAnalysisTicker,
            stockSnapshotJson: analyzeStockState.data?.stockSnapshotJson || '{}',
            aiKeyTakeawaysJson: performAiAnalysisState.data.aiKeyTakeawaysJson,
            aiAnalyzedTaJson: analyzeTaState.data?.aiAnalyzedTaJson || '{}',
            aiOptionsAnalysisJson: performAiOptionsAnalysisState.data?.aiOptionsAnalysisJson || '{}',
            userInput: autoPrompt, chatHistory: []
        }));
      } else analysisTriggeredForTickerRef.current = null;
    } else if (performAiAnalysisState.status === 'error') {
      logDebug('MainTabContent', "performAiAnalysisState error:", performAiAnalysisState.error);
      toast({ variant: "destructive", title: "AI Key Takeaways Error", description: performAiAnalysisState.message });
      const errorJson = `{ "status": "error", "message": "${performAiAnalysisState.message?.replace(/"/g, '\\"')}" }`;
      setAiKeyTakeawaysRequestJson(errorJson); setAiKeyTakeawaysJson(errorJson);
      if (isFullAnalysisTriggered) {
          setFullAnalysisStatus('chatting'); // Still attempt chat even if takeaways fail
          const autoPrompt = "Provide an analysis based on available data (key takeaways might be missing).";
          clearChatHistory();
          startTransition(() => chatFormAction({
            ticker: currentAnalysisTicker,
            stockSnapshotJson: analyzeStockState.data?.stockSnapshotJson || '{}',
            aiKeyTakeawaysJson: errorJson,
            aiAnalyzedTaJson: analyzeTaState.data?.aiAnalyzedTaJson || '{}',
            aiOptionsAnalysisJson: performAiOptionsAnalysisState.data?.aiOptionsAnalysisJson || '{}',
            userInput: autoPrompt, chatHistory: []
          }));
      } else analysisTriggeredForTickerRef.current = null;
    }
  }, [performAiAnalysisState, analyzeStockState, analyzeTaState, performAiOptionsAnalysisState, isFullAnalysisTriggered,
      chatFormAction, setFullAnalysisStatus, setIsFullAnalysisTriggered, clearChatHistory,
      setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson, toast, logDebug]);

  // Effect for chatActionState -> final step
  useEffect(() => {
    logDebug('MainTabContent', "chatActionState changed:", chatActionState);
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current; 

    if (chatActionState.status === 'success' && chatActionState.data) {
      const modelResponse = JSON.parse(chatActionState.data.chatbotResponseJson);
      addChatMessage({ id: Date.now().toString() + '_model', role: 'model', content: modelResponse.response || "Model did not provide a response." });
      toast({ title: "Chatbot Responded", description: chatActionState.message });
      setChatbotRequestJson(chatActionState.data.chatbotRequestJson);
      setChatbotResponseJson(chatActionState.data.chatbotResponseJson);

      if (isFullAnalysisTriggered) {
        setFullAnalysisStatus('success');
        setIsFullAnalysisTriggered(false);
        if(currentAnalysisTicker) toast({ title: `Full AI Analysis for ${currentAnalysisTicker} Complete!`, description: "All steps finished. See chat for summary.", duration: 5000 });
      }
      if(currentAnalysisTicker) analysisTriggeredForTickerRef.current = null; 
    } else if (chatActionState.status === 'error') {
      logDebug('MainTabContent', "chatActionState error:", chatActionState.error);
      toast({ variant: "destructive", title: "Chatbot Error", description: chatActionState.message });
      const errorRequestJson = chatActionState.data?.chatbotRequestJson || `{ "status": "error", "message": "Request data missing for chat for ${currentAnalysisTicker || 'unknown ticker'}" }`;
      const errorResponseJson = chatActionState.data?.chatbotResponseJson || `{ "status": "error", "message": "${chatActionState.message?.replace(/"/g, '\\"')}" }`;
      setChatbotRequestJson(errorRequestJson);
      setChatbotResponseJson(errorResponseJson);
      addChatMessage({ id: Date.now().toString() + '_model_error', role: 'model', content: `Error: ${chatActionState.message || 'Failed to get response.'}` });

      if (isFullAnalysisTriggered) { setFullAnalysisStatus('error'); setIsFullAnalysisTriggered(false); }
      if(currentAnalysisTicker) analysisTriggeredForTickerRef.current = null; 
    }
  }, [chatActionState, isFullAnalysisTriggered, addChatMessage,
      setChatbotRequestJson, setChatbotResponseJson,
      setFullAnalysisStatus, setIsFullAnalysisTriggered, toast, logDebug]);
  
  const isAnySubActionPending = isAnalyzeStockPending || isAnalyzeTaPending || isPerformAiOptionsAnalysisPending || isPerformAiAnalysisPending || isChatPending;
  const isAnyActionPending = isAnySubActionPending || (isFullAnalysisTriggered && fullAnalysisStatus !== 'success' && fullAnalysisStatus !== 'error' && fullAnalysisStatus !== 'idle');

  const getCombinedDataForExport = () => {
    logDebug('MainTabContent', 'getCombinedDataForExport called.');
    try {
      return {
        stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
        standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'),
        aiAnalyzedTechnicalAnalysis: JSON.parse(contextAiAnalyzedTaJson || '{}'), // Renamed
        aiOptionsAnalysis: JSON.parse(contextAiOptionsAnalysisJson || '{}'), // New
        optionsChain: JSON.parse(contextOptionsChainJson || '{}'),
        marketStatus: JSON.parse(contextMarketStatusJson || '{}'),
      };
    } catch (e) {
        logDebug('MainTabContent', 'Error parsing JSON in getCombinedDataForExport:', e);
        toast({variant: "destructive", title: "Data Preparation Error", description: "Could not parse all data components for export."});
        return { error: "Failed to parse one or more data components." };
    }
  };

  const isJsonReadyForExport = (jsonString: string): boolean => {
    return jsonString && jsonString !== '{}' && !jsonString.includes('"status":') && !jsonString.includes('"error":');
  };

  const isDataReadyForCombinedExport =
    isJsonReadyForExport(contextStockSnapshotJson) &&
    isJsonReadyForExport(contextStandardTasJson) &&
    isJsonReadyForExport(contextAiAnalyzedTaJson) && // Renamed
    isJsonReadyForExport(contextAiOptionsAnalysisJson) && // New
    isJsonReadyForExport(contextOptionsChainJson) &&
    isJsonReadyForExport(contextMarketStatusJson);

  const handleExportAllToJson = async () => {
    logDebug('MainTabContent', 'Export All to JSON button clicked.');
    if (!isDataReadyForCombinedExport) {
        toast({variant: "destructive", title: "Data Not Ready", description: "Not all required data sections are available for combined export."});
        return;
    }
    try {
      const dataToExport = getCombinedDataForExport();
      if ((dataToExport as any).error) return;
      const currentDisplayTicker = dataToExport.stockSnapshot?.ticker || tickerInput || 'STOCK';
      downloadJson(dataToExport, `${currentDisplayTicker}_stocksage_all_data.json`);
      toast({ title: "Data Exported", description: `Combined analysis for ${currentDisplayTicker} downloaded as JSON.` });
    } catch (e) {
      toast({variant: "destructive", title: "Export Error", description: "Could not export combined data."});
    }
  };
  
  const handleCopyAllToJson = async () => {
    logDebug('MainTabContent', 'Copy All to JSON button clicked.');
    if (!isDataReadyForCombinedExport) {
        toast({variant: "destructive", title: "Data Not Ready", description: "Not all required data sections are available for combined copy."});
        return;
    }
    try {
      const dataToExport = getCombinedDataForExport();
       if ((dataToExport as any).error) return;
      const currentDisplayTicker = dataToExport.stockSnapshot?.ticker || tickerInput || 'STOCK';
      const success = await copyToClipboard(JSON.stringify(dataToExport, null, 2));
      if (success) {
        toast({ title: "Data Copied", description: `Combined analysis for ${currentDisplayTicker} copied to clipboard.` });
      } else {
        toast({variant: "destructive", title: "Copy Failed", description: "Could not copy combined data."});
      }
    } catch (e) {
       toast({variant: "destructive", title: "Copy Error", description: "Could not prepare combined data for copy."});
    }
  };

  logDebug('MainTabContent', `Rendering. isAnyActionPending=${isAnyActionPending}, fullAnalysisStatus=${fullAnalysisStatus}`);

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
                (analyzeStockState.status === 'success' && !isFullAnalysisTriggered && (isAnalyzeTaPending || isPerformAiOptionsAnalysisPending || isPerformAiAnalysisPending)) // Adjusted pending check
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
            <h3 className="text-lg font-medium">Combined Data Export</h3>
            <CardDescription>Exports Snapshot, Standard TAs, AI Analyzed TA, AI Options Analysis, Options Chain, and Market Status.</CardDescription> {/* Updated description */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={handleExportAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isDataReadyForCombinedExport || isAnyActionPending}>
                    <Download className="mr-2 h-4 w-4" /> Export All to JSON
                </Button>
                <Button onClick={handleCopyAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={!isDataReadyForCombinedExport || isAnyActionPending}>
                    <Copy className="mr-2 h-4 w-4" /> Copy All to JSON
                </Button>
            </div>
        </div>

        <Separator />

        <div className="space-y-6">
          <KeyMetricsDisplay />
          <StockSnapshotDetailsDisplay />
          <StandardTaDisplay />
          <AiAnalyzedTaDisplay /> {/* Renamed component */}
          <OptionsChainTable />
          <AiOptionsAnalysisDisplay /> {/* New component */}
          <AiKeyTakeawaysDisplay />
          <Chatbot 
            chatFormAction={chatFormAction}
            isChatPending={isChatPending || (isFullAnalysisTriggered && fullAnalysisStatus === 'chatting')}
            currentTicker={analysisTriggeredForTickerRef.current || tickerInput}
          />
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}
