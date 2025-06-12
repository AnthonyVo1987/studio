
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
import { Chatbot } from "@/components/chatbot";
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
    marketStatusJson: contextMarketStatusJson,
    stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson,
    optionsChainJson: contextOptionsChainJson,
    aiCalculatedTaJson: contextAiCalculatedTaJson,
    // aiKeyTakeawaysJson is used by AiKeyTakeawaysDisplay, but not directly in combined export
    // chatbotRequestJson and chatbotResponseJson are for the chatbot component
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
    
    setAiCalculatedTaRequestJson(placeholderToUse); 
    setAiCalculatedTaJson(placeholderToUse);
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
      logDebug('MainTabContent', 'Analyze Stock button: Full analysis already in progress.');
      return;
    }
    if (isAnyActionPending) {
       toast({ title: "Process Busy", description: "Another analysis process is currently running.", variant: "default" });
       logDebug('MainTabContent', 'Analyze Stock button: Another action is pending.');
       return;
    }
    setIsFullAnalysisTriggered(false); 
    initiateAnalysisSequence(tickerInput);
  };

  const handleAiFullAnalysisSubmit = () => {
    logDebug('MainTabContent', 'AI Full Stock Analysis button clicked.');
    if (isAnyActionPending) {
      toast({ title: "Process Busy", description: "Another analysis process is currently running.", variant: "default" });
      logDebug('MainTabContent', 'AI Full Stock Analysis button: Another action is pending.');
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

    if (!currentAnalysisTicker) {
        logDebug('MainTabContent', "analyzeStockState effect: No active analysis ticker. Bailing.");
        return;
    }

    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
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

      if (analyzeStockState.data.stockSnapshotJson && 
          !analyzeStockState.data.stockSnapshotJson.includes('"error":') && 
          !analyzeStockState.data.stockSnapshotJson.includes('"status":')) {
        logDebug('MainTabContent', "analyzeStockState success, triggering calculateAiTaFormAction for", currentAnalysisTicker);
        const aiTaPendingPlaceholder = `{ "status": "pending..." }`;
        setAiCalculatedTaRequestJson(aiTaPendingPlaceholder);
        setAiCalculatedTaJson(aiTaPendingPlaceholder);
        startTransition(() => {
          calculateAiTaFormAction({ stockSnapshotJson: analyzeStockState.data.stockSnapshotJson, ticker: currentAnalysisTicker });
        });
      } else {
         const errorMsg = `Stock snapshot data missing, error, or still pending for ${currentAnalysisTicker}. Skipping AI TA. SnapshotJSON: ${analyzeStockState.data.stockSnapshotJson.substring(0,100)}`;
         logDebug('MainTabContent', "analyzeStockState success, BUT " + errorMsg);
         toast({ variant: "destructive", title: "AI TA Skipped", description: errorMsg, duration: 7000 });
         const skippedJson = `{ "status": "skipped", "reason": "${errorMsg.replace(/"/g, '\\"')}" }`;
         setAiCalculatedTaRequestJson(skippedJson);
         setAiCalculatedTaJson(skippedJson);
         
         if (isFullAnalysisTriggered) {
            logDebug('MainTabContent', "Full analysis: AI TA skipped, attempting to proceed to takeaways for", currentAnalysisTicker);
            setFullAnalysisStatus('generatingTakeaways'); 
            const takeawaysPendingPlaceholder = `{ "status": "pending..." }`;
            setAiKeyTakeawaysRequestJson(takeawaysPendingPlaceholder);
            setAiKeyTakeawaysJson(takeawaysPendingPlaceholder);
            startTransition(() => {
                performAiAnalysisFormAction({
                    ticker: currentAnalysisTicker,
                    stockSnapshotJson: analyzeStockState.data.stockSnapshotJson || `{ "status": "error", "reason": "Snapshot missing/error for ${currentAnalysisTicker}" }`, 
                    standardTasJson: analyzeStockState.data.standardTasJson || `{ "status": "error", "reason": "Standard TAs missing/error for ${currentAnalysisTicker}" }`,
                    aiCalculatedTaJson: skippedJson, 
                    marketStatusJson: analyzeStockState.data.marketStatusJson || `{ "status": "error", "reason": "Market status missing/error for ${currentAnalysisTicker}" }`
                });
            });
         } else {
            logDebug('MainTabContent', "Standard analysis: AI TA skipped. Sequence ended for", currentAnalysisTicker);
            analysisTriggeredForTickerRef.current = null; 
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
       if(currentAnalysisTicker){
           analysisTriggeredForTickerRef.current = null; 
           logDebug('MainTabContent', "analyzeStockState error, cleared analysisTriggeredForTickerRef for", currentAnalysisTicker);
       }
    }
  }, [analyzeStockState, isFullAnalysisTriggered, setFullAnalysisStatus, setIsFullAnalysisTriggered,
      setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson,
      setPolygonApiRequestLogJson, setPolygonApiResponseLogJson,
      calculateAiTaFormAction, setAiCalculatedTaRequestJson, setAiCalculatedTaJson, 
      performAiAnalysisFormAction, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
      toast, logDebug]);

  useEffect(() => {
    logDebug('MainTabContent', "calculateAiTaState changed:", calculateAiTaState);
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;

    if (!currentAnalysisTicker) {
        logDebug('MainTabContent', "calculateAiTaState effect: No active analysis ticker. Bailing.");
        return;
    }

    if (calculateAiTaState.status === 'success' && calculateAiTaState.data) {
      toast({ title: "AI TA Calculated", description: calculateAiTaState.message });
      setAiCalculatedTaRequestJson(calculateAiTaState.data.aiCalculatedTaRequestJson);
      setAiCalculatedTaJson(calculateAiTaState.data.aiCalculatedTaJson);

      if (isFullAnalysisTriggered) {
        setFullAnalysisStatus('generatingTakeaways');
      }

      if (
        analyzeStockState.status === 'success' && analyzeStockState.data &&
        analyzeStockState.data.stockSnapshotJson && !analyzeStockState.data.stockSnapshotJson.includes('"error":') && !analyzeStockState.data.stockSnapshotJson.includes('"status":') &&
        analyzeStockState.data.standardTasJson && !analyzeStockState.data.standardTasJson.includes('"error":') && !analyzeStockState.data.standardTasJson.includes('"status":') &&
        analyzeStockState.data.marketStatusJson && !analyzeStockState.data.marketStatusJson.includes('"error":') && !analyzeStockState.data.marketStatusJson.includes('"status":') &&
        calculateAiTaState.data.aiCalculatedTaJson && !calculateAiTaState.data.aiCalculatedTaJson.includes('"error":') && !calculateAiTaState.data.aiCalculatedTaJson.includes('"status":')
      ) {
        logDebug('MainTabContent', "calculateAiTaState success, all data fresh, triggering performAiAnalysisFormAction for", currentAnalysisTicker);
        const takeawaysPendingPlaceholder = `{ "status": "pending..." }`;
        setAiKeyTakeawaysRequestJson(takeawaysPendingPlaceholder);
        setAiKeyTakeawaysJson(takeawaysPendingPlaceholder);
        startTransition(() => {
          performAiAnalysisFormAction({
            ticker: currentAnalysisTicker,
            stockSnapshotJson: analyzeStockState.data.stockSnapshotJson,
            standardTasJson: analyzeStockState.data.standardTasJson,
            aiCalculatedTaJson: calculateAiTaState.data.aiCalculatedTaJson, 
            marketStatusJson: analyzeStockState.data.marketStatusJson
          });
        });
      } else {
        const errorMsg = `Prerequisite data (snapshot, TAs, market status from analyzeStockState, or AI TA data) missing/error for Key Takeaways for ${currentAnalysisTicker}. analyzeStockState: ${analyzeStockState.status}, calculateAiTaState: ${calculateAiTaState.status}.`;
        logDebug('MainTabContent', "calculateAiTaState success, BUT " + errorMsg);
        toast({ variant: "destructive", title: "Key Takeaways Skipped", description: errorMsg, duration: 7000 });
        const skippedJson = `{ "status": "skipped", "reason": "${errorMsg.replace(/"/g, '\\"')}" }`;
        setAiKeyTakeawaysRequestJson(skippedJson);
        setAiKeyTakeawaysJson(skippedJson);
        if (isFullAnalysisTriggered) {
             logDebug('MainTabContent', "Full analysis: prerequisite data error before takeaways, attempting to proceed to chat for", currentAnalysisTicker);
             setFullAnalysisStatus('chatting');
             const autoPrompt = "Provide a full detailed analysis of this stock based on all the context provided (some context may be missing due to errors).";
             clearChatHistory();
             const chatPendingPlaceholder = `{ "status": "pending..." }`;
             setChatbotRequestJson(chatPendingPlaceholder);
             setChatbotResponseJson(chatPendingPlaceholder);
             startTransition(() => {
               chatFormAction({
                 ticker: currentAnalysisTicker,
                 stockSnapshotJson: analyzeStockState.data?.stockSnapshotJson || `{ "status": "error", "reason": "Snapshot missing/error for ${currentAnalysisTicker}" }`, 
                 aiKeyTakeawaysJson: skippedJson, 
                 aiCalculatedTaJson: calculateAiTaState.data.aiCalculatedTaJson, 
                 userInput: autoPrompt,
                 chatHistory: []
               });
             });
        } else {
            logDebug('MainTabContent', "Standard analysis: prerequisite data error for takeaways, sequence ended for", currentAnalysisTicker);
            analysisTriggeredForTickerRef.current = null; 
        }
      }
    } else if (calculateAiTaState.status === 'error' && currentAnalysisTicker) {
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
      if (!isFullAnalysisTriggered) {
        analysisTriggeredForTickerRef.current = null;
        logDebug('MainTabContent', "calculateAiTaState error (standard analysis), cleared analysisTriggeredForTickerRef for", currentAnalysisTicker);
      }
    }
  }, [calculateAiTaState, analyzeStockState, isFullAnalysisTriggered,
      performAiAnalysisFormAction, setFullAnalysisStatus, setIsFullAnalysisTriggered, clearChatHistory, chatFormAction,
      setAiCalculatedTaRequestJson, setAiCalculatedTaJson, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
      setChatbotRequestJson, setChatbotResponseJson,
      toast, logDebug]);

  useEffect(() => {
    logDebug('MainTabContent', "performAiAnalysisState changed:", performAiAnalysisState);
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;

    if (!currentAnalysisTicker) {
        logDebug('MainTabContent', "performAiAnalysisState effect: No active analysis ticker. Bailing.");
        return;
    }

    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Generated", description: performAiAnalysisState.message });
      setAiKeyTakeawaysRequestJson(performAiAnalysisState.data.aiKeyTakeawaysRequestJson);
      setAiKeyTakeawaysJson(performAiAnalysisState.data.aiKeyTakeawaysJson);

      if (isFullAnalysisTriggered) {
        logDebug('MainTabContent', "performAiAnalysisState success (full analysis), triggering chatFormAction for", currentAnalysisTicker);
        
        if (analyzeStockState.status === 'success' && analyzeStockState.data &&
            calculateAiTaState.status === 'success' && calculateAiTaState.data &&
            analyzeStockState.data.stockSnapshotJson && !analyzeStockState.data.stockSnapshotJson.includes('"error":') && !analyzeStockState.data.stockSnapshotJson.includes('"status":') &&
            calculateAiTaState.data.aiCalculatedTaJson && !calculateAiTaState.data.aiCalculatedTaJson.includes('"error":') && !calculateAiTaState.data.aiCalculatedTaJson.includes('"status":') &&
            performAiAnalysisState.data.aiKeyTakeawaysJson && !performAiAnalysisState.data.aiKeyTakeawaysJson.includes('"error":') && !performAiAnalysisState.data.aiKeyTakeawaysJson.includes('"status":')
            ) {
            setFullAnalysisStatus('chatting');
            const autoPrompt = "Provide a full detailed analysis of this stock based on all the context provided.";
            clearChatHistory();
            const chatPendingPlaceholder = `{ "status": "pending..." }`;
            setChatbotRequestJson(chatPendingPlaceholder);
            setChatbotResponseJson(chatPendingPlaceholder);
            startTransition(() => {
              chatFormAction({
                ticker: currentAnalysisTicker,
                stockSnapshotJson: analyzeStockState.data.stockSnapshotJson,
                aiKeyTakeawaysJson: performAiAnalysisState.data.aiKeyTakeawaysJson,
                aiCalculatedTaJson: calculateAiTaState.data.aiCalculatedTaJson, 
                userInput: autoPrompt,
                chatHistory: []
              });
            });
        } else {
            const errorMsg = `Missing prerequisite data (snapshot/AI TA/Takeaways) for chat step in full analysis for ${currentAnalysisTicker}. Snapshot: ${analyzeStockState.status}, AI TA: ${calculateAiTaState.status}, Takeaways: ${performAiAnalysisState.status}.`;
            logDebug('MainTabContent', "Full analysis: " + errorMsg);
            toast({ variant: "destructive", title: "Chat Skipped", description: errorMsg, duration: 7000 });
            setChatbotRequestJson(`{ "status": "skipped", "reason": "${errorMsg.replace(/"/g, '\\"')}" }`);
            setChatbotResponseJson(`{ "status": "skipped", "response": "Cannot proceed with chat due to missing prior data." }`);
            setFullAnalysisStatus('error');
            setIsFullAnalysisTriggered(false);
            analysisTriggeredForTickerRef.current = null;
        }
      } else { 
        logDebug('MainTabContent', "performAiAnalysisState success (standard analysis), clearing analysisTriggeredForTickerRef for", currentAnalysisTicker);
        analysisTriggeredForTickerRef.current = null;
      }
    } else if (performAiAnalysisState.status === 'error' && currentAnalysisTicker) {
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
      logDebug('MainTabContent', "performAiAnalysisState error, cleared analysisTriggeredForTickerRef for", currentAnalysisTicker);
    }
  }, [performAiAnalysisState, analyzeStockState, calculateAiTaState, isFullAnalysisTriggered,
      chatFormAction, setFullAnalysisStatus, setIsFullAnalysisTriggered, clearChatHistory,
      setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
      setChatbotRequestJson, setChatbotResponseJson,
      toast, logDebug]);

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
        if(currentAnalysisTicker){ 
             toast({ title: `Full AI Analysis for ${currentAnalysisTicker} Complete!`, description: "All steps finished. See chat for summary.", duration: 5000 });
        }
      }
      if(currentAnalysisTicker){ 
          logDebug('MainTabContent', "chatActionState success, clearing analysisTriggeredForTickerRef for", currentAnalysisTicker);
          analysisTriggeredForTickerRef.current = null; 
      }
    } else if (chatActionState.status === 'error') {
      logDebug('MainTabContent', "chatActionState error:", chatActionState.error);
      toast({ variant: "destructive", title: "Chatbot Error", description: chatActionState.message });
      const errorRequestJson = chatActionState.data?.chatbotRequestJson || `{ "status": "error", "message": "Request data missing for chat for ${currentAnalysisTicker || 'unknown ticker'}" }`;
      const errorResponseJson = chatActionState.data?.chatbotResponseJson || `{ "status": "error", "message": "${chatActionState.message?.replace(/"/g, '\\"')}" }`;
      setChatbotRequestJson(errorRequestJson);
      setChatbotResponseJson(errorResponseJson);
      addChatMessage({ id: Date.now().toString() + '_model_error', role: 'model', content: `Error: ${chatActionState.message || 'Failed to get response.'}` });

      if (isFullAnalysisTriggered) {
        setFullAnalysisStatus('error');
        setIsFullAnalysisTriggered(false);
      }
      if(currentAnalysisTicker){
          logDebug('MainTabContent', "chatActionState error, clearing analysisTriggeredForTickerRef for", currentAnalysisTicker);
          analysisTriggeredForTickerRef.current = null; 
      }
    }
  }, [chatActionState, isFullAnalysisTriggered, addChatMessage,
      setChatbotRequestJson, setChatbotResponseJson,
      setFullAnalysisStatus, setIsFullAnalysisTriggered, toast, logDebug]);
  
  const isAnySubActionPending = isAnalyzeStockPending || isCalculateAiTaPending || isPerformAiAnalysisPending || isChatPending;
  const isAnyActionPending = isAnySubActionPending || (isFullAnalysisTriggered && fullAnalysisStatus !== 'success' && fullAnalysisStatus !== 'error' && fullAnalysisStatus !== 'idle');

  const getCombinedDataForExport = () => {
    logDebug('MainTabContent', 'getCombinedDataForExport called.');
    try {
      return {
        stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
        standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'),
        aiCalculatedTechnicalAnalysis: JSON.parse(contextAiCalculatedTaJson || '{}'),
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
    isJsonReadyForExport(contextAiCalculatedTaJson) &&
    isJsonReadyForExport(contextOptionsChainJson) &&
    isJsonReadyForExport(contextMarketStatusJson);

  const handleExportAllToJson = async () => {
    logDebug('MainTabContent', 'Export All to JSON button clicked.');
    if (!isDataReadyForCombinedExport) {
        toast({variant: "destructive", title: "Data Not Ready", description: "Not all required data sections are available for combined export."});
        logDebug('MainTabContent', 'Export All to JSON: Data not ready.');
        return;
    }
    try {
      const dataToExport = getCombinedDataForExport();
      if ((dataToExport as any).error) {
          logDebug('MainTabContent', 'Export All to JSON: Error during data preparation.', dataToExport);
          return; // Toast already shown by getCombinedDataForExport
      }
      const currentDisplayTicker = dataToExport.stockSnapshot?.ticker || tickerInput || 'STOCK';
      downloadJson(dataToExport, `${currentDisplayTicker}_stocksage_all_data.json`);
      toast({ title: "Data Exported", description: `Combined analysis for ${currentDisplayTicker} downloaded as JSON.` });
      logDebug('MainTabContent', 'Export All to JSON: Success.');
    } catch (e) {
      toast({variant: "destructive", title: "Export Error", description: "Could not export combined data."});
      logDebug('MainTabContent', 'Export All to JSON: Unexpected error.', e);
    }
  };
  
  const handleCopyAllToJson = async () => {
    logDebug('MainTabContent', 'Copy All to JSON button clicked.');
    if (!isDataReadyForCombinedExport) {
        toast({variant: "destructive", title: "Data Not Ready", description: "Not all required data sections are available for combined copy."});
        logDebug('MainTabContent', 'Copy All to JSON: Data not ready.');
        return;
    }
    try {
      const dataToExport = getCombinedDataForExport();
       if ((dataToExport as any).error) {
          logDebug('MainTabContent', 'Copy All to JSON: Error during data preparation.', dataToExport);
          return; // Toast already shown by getCombinedDataForExport
      }
      const currentDisplayTicker = dataToExport.stockSnapshot?.ticker || tickerInput || 'STOCK';
      const success = await copyToClipboard(JSON.stringify(dataToExport, null, 2));
      if (success) {
        toast({ title: "Data Copied", description: `Combined analysis for ${currentDisplayTicker} copied to clipboard.` });
        logDebug('MainTabContent', 'Copy All to JSON: Success.');
      } else {
        toast({variant: "destructive", title: "Copy Failed", description: "Could not copy combined data."});
        logDebug('MainTabContent', 'Copy All to JSON: Failed.');
      }
    } catch (e) {
       toast({variant: "destructive", title: "Copy Error", description: "Could not prepare combined data for copy."});
       logDebug('MainTabContent', 'Copy All to JSON: Unexpected error.', e);
    }
  };


  logDebug('MainTabContent', `Rendering. isAnyActionPending=${isAnyActionPending}, fullAnalysisStatus=${fullAnalysisStatus}, currentTickerInput=${tickerInput}, analysisTriggeredFor=${analysisTriggeredForTickerRef.current}, isDataReadyForCombinedExport=${isDataReadyForCombinedExport}`);

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
            <h3 className="text-lg font-medium">Combined Data Export</h3>
            <CardDescription>Exports Stock Snapshot, Standard TAs, AI Calculated TAs, Options Chain, and Market Status.</CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button 
                  onClick={handleExportAllToJson}
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto" 
                  disabled={!isDataReadyForCombinedExport || isAnyActionPending}
                >
                    <Download className="mr-2 h-4 w-4" /> Export All to JSON
                </Button>
                <Button 
                  onClick={handleCopyAllToJson}
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto" 
                  disabled={!isDataReadyForCombinedExport || isAnyActionPending}
                >
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

    