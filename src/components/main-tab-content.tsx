
"use client";

import type { FormEvent } from 'react';
import React, { useState, useActionState, useEffect, startTransition, useRef, useCallback } from "react";
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
import { AiAnalyzedTaDisplay } from "@/components/ai-analyzed-ta-display";
import { AiOptionsAnalysisDisplay } from "@/components/ai-options-analysis-display";
import { AiKeyTakeawaysDisplay } from "@/components/ai-key-takeaways-display";
import { OptionsChainTable } from "@/components/options-chain-table";
import { Chatbot } from "@/components/chatbot";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";

import { fetchStockDataAction, type AnalyzeStockServerActionState } from "@/actions/analyze-stock-server-action";
import { analyzeTaAction, type AnalyzeTaActionState } from "@/actions/analyze-ta-action";
import { performAiAnalysisAction, type PerformAiAnalysisActionState } from "@/actions/perform-ai-analysis-action";
import { performAiOptionsAnalysisAction, type PerformAiOptionsAnalysisActionState } from "@/actions/perform-ai-options-analysis-action";
import { chatServerAction, type ChatActionState, type ChatActionInputs } from "@/actions/chat-server-action";

import { useStockAnalysis, type FullAnalysisStatus, type ChatMessage } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap } from "lucide-react";

const initialStockDataFetchState: AnalyzeStockServerActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialAnalyzeTaState: AnalyzeTaActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};
const initialPerformAiAnalysisState: PerformAiAnalysisActionState = { // For Key Takeaways
  status: 'idle', data: undefined, error: null, message: null,
};
const initialPerformAiOptionsAnalysisState: PerformAiOptionsAnalysisActionState = {
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
    // Context state variables
    marketStatusJson: contextMarketStatusJson,
    stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson,
    optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaRequestJson: contextAiAnalyzedTaRequestJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson,
    aiKeyTakeawaysRequestJson: contextAiKeyTakeawaysRequestJson,
    aiKeyTakeawaysJson: contextAiKeyTakeawaysJson,
    aiOptionsAnalysisRequestJson: contextAiOptionsAnalysisRequestJson,
    aiOptionsAnalysisJson: contextAiOptionsAnalysisJson,
    chatHistory: contextChatHistory,

    // Context setters
    setMarketStatusJson,
    setStockSnapshotJson,
    setStandardTasJson,
    setOptionsChainJson,
    setPolygonApiRequestLogJson,
    setPolygonApiResponseLogJson,
    setAiAnalyzedTaRequestJson,
    setAiAnalyzedTaJson,
    setAiKeyTakeawaysRequestJson,
    setAiKeyTakeawaysJson,
    setAiOptionsAnalysisRequestJson,
    setAiOptionsAnalysisJson,
    setChatbotRequestJson,
    setChatbotResponseJson,
    addChatMessage,
    clearChatHistory,

    // Full analysis tracking
    fullAnalysisStatus,
    setFullAnalysisStatus,
    isFullAnalysisTriggered,
    setIsFullAnalysisTriggered,
    logDebug,
  } = useStockAnalysis();

  const [analyzeStockState, analyzeStockFormAction, isAnalyzeStockPending] = useActionState<AnalyzeStockServerActionState, { ticker: string }>(
    fetchStockDataAction,
    initialStockDataFetchState
  );

  const [analyzeTaState, analyzeTaFormAction, isAnalyzeTaPending] = useActionState<AnalyzeTaActionState, { stockSnapshotJson: string, ticker?: string }>(
    analyzeTaAction,
    initialAnalyzeTaState
  );

  const [performAiAnalysisState, performAiAnalysisFormAction, isPerformAiAnalysisPending] = useActionState<PerformAiAnalysisActionState, Parameters<typeof performAiAnalysisAction>[1]>(
    performAiAnalysisAction,
    initialPerformAiAnalysisState
  );

  const [performAiOptionsAnalysisState, performAiOptionsAnalysisFormAction, isPerformAiOptionsAnalysisPending] = useActionState<PerformAiOptionsAnalysisActionState, Parameters<typeof performAiOptionsAnalysisAction>[1]>(
    performAiOptionsAnalysisAction,
    initialPerformAiOptionsAnalysisState
  );
  
  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(
    chatServerAction,
    initialChatActionState
  );

  const isAnySubActionPending = isAnalyzeStockPending || isAnalyzeTaPending || isPerformAiAnalysisPending || isPerformAiOptionsAnalysisPending || isChatPending;
  const isAnyActionPending = isAnySubActionPending || (isFullAnalysisTriggered && fullAnalysisStatus !== 'idle' && fullAnalysisStatus !== 'success' && fullAnalysisStatus !== 'error');
  

  const setAllPlaceholders = useCallback((currentTicker: string, forFullAnalysis: boolean) => {
    const pendingPlaceholder = `{ "status": "pending..." }`;
    const fullAnalysisPendingPlaceholder = `{ "status": "full_analysis_pending..." }`;
    const initializingPlaceholder = `{ "status": "initializing..." }`;
    const placeholderToUse = forFullAnalysis ? fullAnalysisPendingPlaceholder : pendingPlaceholder;
    const requestLogPlaceholder = forFullAnalysis
        ? `{ "status": "full_analysis_pending...", "input": {"ticker": "${currentTicker}"} }`
        : `{ "status": "pending...", "input": {"ticker": "${currentTicker}"} }`;

    setMarketStatusJson(placeholderToUse);
    setStockSnapshotJson(placeholderToUse);
    setStandardTasJson(placeholderToUse);
    setOptionsChainJson(placeholderToUse);
    setPolygonApiRequestLogJson(requestLogPlaceholder);
    setPolygonApiResponseLogJson(placeholderToUse);

    setAiAnalyzedTaRequestJson(placeholderToUse);
    setAiAnalyzedTaJson(placeholderToUse);
    setAiKeyTakeawaysRequestJson(placeholderToUse);
    setAiKeyTakeawaysJson(placeholderToUse);
    setAiOptionsAnalysisRequestJson(placeholderToUse);
    setAiOptionsAnalysisJson(placeholderToUse);
    
    setChatbotRequestJson(initializingPlaceholder);
    setChatbotResponseJson(initializingPlaceholder);
  }, [setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson, setPolygonApiRequestLogJson, setPolygonApiResponseLogJson, setAiAnalyzedTaRequestJson, setAiAnalyzedTaJson, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson, setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson, setChatbotRequestJson, setChatbotResponseJson]);

  const handleGenericError = useCallback((step: string, message: string | null | undefined, currentTicker: string) => {
    logDebug('MainTabContent:handleGenericError', `Error during ${step} for ${currentTicker}: ${message}`);
    toast({ variant: "destructive", title: `${step} Error`, description: message || "An unknown error occurred." });
    const errorJson = `{ "status": "error", "message": "${(message || 'Unknown error').replace(/"/g, '\\"')}" }`;
    const skippedJson = `{ "status": "skipped_due_to_prior_error", "prior_step": "${step}" }`;
    
    const setJsonForError = (setter: (json: string) => void, isCurrentStepError: boolean) => {
        setter(isCurrentStepError ? errorJson : skippedJson);
    };

    if (step === "Data Fetch") {
        setJsonForError(setAiAnalyzedTaRequestJson, true); setJsonForError(setAiAnalyzedTaJson, true);
        setJsonForError(setAiKeyTakeawaysRequestJson, true); setJsonForError(setAiKeyTakeawaysJson, true);
        setJsonForError(setAiOptionsAnalysisRequestJson, true); setJsonForError(setAiOptionsAnalysisJson, true);
    } else if (step === "AI TA") {
        setJsonForError(setAiAnalyzedTaRequestJson, contextAiAnalyzedTaRequestJson.includes("pending")); setJsonForError(setAiAnalyzedTaJson, true);
        setJsonForError(setAiKeyTakeawaysRequestJson, true); setJsonForError(setAiKeyTakeawaysJson, true);
        setJsonForError(setAiOptionsAnalysisRequestJson, true); setJsonForError(setAiOptionsAnalysisJson, true);
    } else if (step === "AI Key Takeaways") {
        setJsonForError(setAiKeyTakeawaysRequestJson, contextAiKeyTakeawaysRequestJson.includes("pending")); setJsonForError(setAiKeyTakeawaysJson, true);
        setJsonForError(setAiOptionsAnalysisRequestJson, true); setJsonForError(setAiOptionsAnalysisJson, true);
    } else if (step === "AI Options Analysis") {
        setJsonForError(setAiOptionsAnalysisRequestJson, contextAiOptionsAnalysisRequestJson.includes("pending")); setJsonForError(setAiOptionsAnalysisJson, true);
    }
      
    setFullAnalysisStatus('error');
    if (analysisTriggeredForTickerRef.current === currentTicker) {
        analysisTriggeredForTickerRef.current = null;
    }
  }, [logDebug, toast, setAiAnalyzedTaRequestJson, setAiAnalyzedTaJson, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson, setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson, contextAiAnalyzedTaRequestJson, contextAiKeyTakeawaysRequestJson, contextAiOptionsAnalysisRequestJson, setFullAnalysisStatus]);
  

  // Step 1: Initial Data Fetch
  const initiateAnalysisSequence = useCallback((currentTickerToAnalyze: string, isFullMode: boolean) => {
    analysisTriggeredForTickerRef.current = currentTickerToAnalyze;
    toast({ title: "Fetching Stock Data...", description: `Requesting data for ${currentTickerToAnalyze.toUpperCase()}.` });
    logDebug('MainTabContent:initiateAnalysisSequence', `Sequence for ${currentTickerToAnalyze}, FullMode: ${isFullMode}`);
    
    setAllPlaceholders(currentTickerToAnalyze, isFullMode);
    clearChatHistory(); 
    
    if (isFullMode) {
        setIsFullAnalysisTriggered(true);
        setFullAnalysisStatus('fetchingData');
    } else {
        setIsFullAnalysisTriggered(false); 
        setFullAnalysisStatus('fetchingData'); 
    }

    startTransition(() => {
      analyzeStockFormAction({ ticker: currentTickerToAnalyze });
    });
  }, [toast, logDebug, setAllPlaceholders, clearChatHistory, setIsFullAnalysisTriggered, setFullAnalysisStatus, analyzeStockFormAction]);

  const handleAnalyzeStockButtonSubmit = useCallback((event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    logDebug('MainTabContent', 'Analyze Stock button clicked.');
    if (isAnyActionPending) {
      toast({ title: "Process Busy", description: "An analysis sequence is already running.", variant: "default" });
      return;
    }
    initiateAnalysisSequence(tickerInput, false);
  }, [isAnyActionPending, toast, tickerInput, initiateAnalysisSequence, logDebug]);

  const handleAiFullAnalysisSubmit = useCallback(() => {
    logDebug('MainTabContent', 'AI Full Stock Analysis button clicked.');
    if (isAnyActionPending) {
      toast({ title: "Process Busy", description: "Another analysis process is currently running.", variant: "default" });
      return;
    }
    initiateAnalysisSequence(tickerInput, true);
  }, [isAnyActionPending, toast, tickerInput, initiateAnalysisSequence, logDebug]);

  // Effect for analyzeStockState (Data Fetch) -> Step 2: AI Analyzed TA
  useEffect(() => {
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (!currentAnalysisTicker || analyzeStockState.status === 'idle' || (fullAnalysisStatus !== 'fetchingData' && !isAnalyzeStockPending)) {
      return;
    }
    logDebug('MainTabContent:useEffect[analyzeStockState]', "Data Fetch state changed:", analyzeStockState, "FullAnalysisTriggered:", isFullAnalysisTriggered, "CurrentTickerRef:", currentAnalysisTicker);

    if (analyzeStockState.status === 'success' && analyzeStockState.data) {
      toast({ title: "Data Fetched", description: analyzeStockState.message });
      setMarketStatusJson(analyzeStockState.data.marketStatusJson);
      setStockSnapshotJson(analyzeStockState.data.stockSnapshotJson);
      setStandardTasJson(analyzeStockState.data.standardTasJson);
      setOptionsChainJson(analyzeStockState.data.optionsChainJson);
      setPolygonApiRequestLogJson(analyzeStockState.data.polygonApiRequestLogJson);
      setPolygonApiResponseLogJson(analyzeStockState.data.polygonApiResponseLogJson);

      if (analyzeStockState.data.stockSnapshotJson && !analyzeStockState.data.stockSnapshotJson.includes('"error":') && !analyzeStockState.data.stockSnapshotJson.includes('"status":')) {
        setFullAnalysisStatus('analyzingTa');
        logDebug('MainTabContent:useEffect[analyzeStockState]', "Data fetch success, triggering AI TA for", currentAnalysisTicker);
        const placeholder = `{ "status": "${isFullAnalysisTriggered ? 'full_analysis_pending...' : 'pending...'}" }`;
        setAiAnalyzedTaRequestJson(placeholder); setAiAnalyzedTaJson(placeholder);
        startTransition(() => analyzeTaFormAction({ stockSnapshotJson: analyzeStockState.data.stockSnapshotJson, ticker: currentAnalysisTicker }));
      } else {
        handleGenericError("AI TA Prerequisite", `Stock snapshot data missing/error for ${currentAnalysisTicker}. Skipping subsequent AI steps.`, currentAnalysisTicker);
      }
    } else if (analyzeStockState.status === 'error') {
      handleGenericError("Data Fetch", analyzeStockState.error, currentAnalysisTicker);
    }
  }, [
      analyzeStockState, 
      fullAnalysisStatus, 
      isAnalyzeStockPending, 
      setMarketStatusJson, 
      setStockSnapshotJson, 
      setStandardTasJson, 
      setOptionsChainJson, 
      setPolygonApiRequestLogJson, 
      setPolygonApiResponseLogJson, 
      setFullAnalysisStatus, 
      logDebug, 
      isFullAnalysisTriggered, 
      setAiAnalyzedTaRequestJson, 
      setAiAnalyzedTaJson, 
      analyzeTaFormAction, 
      toast, 
      handleGenericError
    ]);

  // Effect for analyzeTaState (AI TA) -> Step 3: AI Key Takeaways
  useEffect(() => {
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (!currentAnalysisTicker || analyzeTaState.status === 'idle' || (fullAnalysisStatus !== 'analyzingTa' && !isAnalyzeTaPending)) {
      return;
    }
    logDebug('MainTabContent:useEffect[analyzeTaState]', "AI TA state changed:", analyzeTaState, "FullAnalysisTriggered:", isFullAnalysisTriggered, "CurrentTickerRef:", currentAnalysisTicker);
    
    if (analyzeTaState.status === 'success' && analyzeTaState.data) {
      toast({ title: "AI TA Analyzed", description: analyzeTaState.message });
      setAiAnalyzedTaRequestJson(analyzeTaState.data.aiAnalyzedTaRequestJson);
      setAiAnalyzedTaJson(analyzeTaState.data.aiAnalyzedTaJson);

      if (isFullAnalysisTriggered) {
        setFullAnalysisStatus('generatingTakeaways');
        logDebug('MainTabContent:useEffect[analyzeTaState]', "AI TA success (full analysis), triggering Key Takeaways for", currentAnalysisTicker);
        const placeholder = `{ "status": "full_analysis_pending..." }`;
        setAiKeyTakeawaysRequestJson(placeholder); setAiKeyTakeawaysJson(placeholder);
        startTransition(() => performAiAnalysisFormAction({
          ticker: currentAnalysisTicker,
          stockSnapshotJson: contextStockSnapshotJson, 
          standardTasJson: contextStandardTasJson,     
          aiAnalyzedTaJson: analyzeTaState.data.aiAnalyzedTaJson, 
          marketStatusJson: contextMarketStatusJson,   
        }));
      } else { 
        logDebug('MainTabContent:useEffect[analyzeTaState]', "AI TA success (partial analysis), ending sequence for", currentAnalysisTicker);
        setFullAnalysisStatus('success'); 
        if (analysisTriggeredForTickerRef.current === currentAnalysisTicker) {
            analysisTriggeredForTickerRef.current = null;
        }
      }
    } else if (analyzeTaState.status === 'error') {
      const errorTaJsonForContext = `{ "status": "error", "message": "${(analyzeTaState.error || 'AI TA error').replace(/"/g, '\\"')}" }`;
      setAiAnalyzedTaRequestJson(analyzeTaState.data?.aiAnalyzedTaRequestJson || errorTaJsonForContext); 
      setAiAnalyzedTaJson(errorTaJsonForContext);
      
      if (isFullAnalysisTriggered) {
        logDebug('MainTabContent:useEffect[analyzeTaState]', "AI TA error (full analysis), attempting Key Takeaways for", currentAnalysisTicker, "with error TA JSON.");
        setFullAnalysisStatus('generatingTakeaways'); 
        const placeholder = `{ "status": "full_analysis_pending..." }`;
        setAiKeyTakeawaysRequestJson(placeholder); setAiKeyTakeawaysJson(placeholder);
        startTransition(() => performAiAnalysisFormAction({
            ticker: currentAnalysisTicker,
            stockSnapshotJson: contextStockSnapshotJson,
            standardTasJson: contextStandardTasJson,
            aiAnalyzedTaJson: errorTaJsonForContext, 
            marketStatusJson: contextMarketStatusJson,
        }));
      } else {
        handleGenericError("AI TA", analyzeTaState.error, currentAnalysisTicker); 
      }
    }
  }, [
      analyzeTaState, 
      fullAnalysisStatus, 
      isAnalyzeTaPending, 
      isFullAnalysisTriggered, 
      contextStockSnapshotJson, 
      contextStandardTasJson, 
      contextMarketStatusJson, 
      setAiAnalyzedTaRequestJson, 
      setAiAnalyzedTaJson, 
      setFullAnalysisStatus, 
      logDebug, 
      setAiKeyTakeawaysRequestJson, 
      setAiKeyTakeawaysJson, 
      performAiAnalysisFormAction, 
      toast, 
      handleGenericError
    ]);
  
  // Effect for performAiAnalysisState (Key Takeaways) -> Step 4: AI Options Analysis
  useEffect(() => {
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (!currentAnalysisTicker || !isFullAnalysisTriggered || performAiAnalysisState.status === 'idle' || (fullAnalysisStatus !== 'generatingTakeaways' && !isPerformAiAnalysisPending)) {
      return;
    }
    logDebug('MainTabContent:useEffect[performAiAnalysisState]', "Key Takeaways state changed:", performAiAnalysisState, "CurrentTickerRef:", currentAnalysisTicker);

    if (performAiAnalysisState.status === 'success' && performAiAnalysisState.data) {
      toast({ title: "AI Key Takeaways Generated", description: performAiAnalysisState.message });
      setAiKeyTakeawaysRequestJson(performAiAnalysisState.data.aiKeyTakeawaysRequestJson);
      setAiKeyTakeawaysJson(performAiAnalysisState.data.aiKeyTakeawaysJson);

      setFullAnalysisStatus('analyzingOptions');
      logDebug('MainTabContent:useEffect[performAiAnalysisState]', "Key Takeaways success, triggering AI Options Analysis for", currentAnalysisTicker);
      const placeholder = `{ "status": "full_analysis_pending..." }`;
      setAiOptionsAnalysisRequestJson(placeholder); setAiOptionsAnalysisJson(placeholder);
      startTransition(() => performAiOptionsAnalysisFormAction({
        ticker: currentAnalysisTicker,
        optionsChainJson: contextOptionsChainJson, 
        stockSnapshotJson: contextStockSnapshotJson, 
      }));
    } else if (performAiAnalysisState.status === 'error') {
      const errorKtJsonForContext = `{ "status": "error", "message": "${(performAiAnalysisState.error || 'Key Takeaways error').replace(/"/g, '\\"')}" }`;
      setAiKeyTakeawaysRequestJson(performAiAnalysisState.data?.aiKeyTakeawaysRequestJson || errorKtJsonForContext); 
      setAiKeyTakeawaysJson(errorKtJsonForContext);
      
      logDebug('MainTabContent:useEffect[performAiAnalysisState]', "Key Takeaways error, attempting AI Options Analysis for", currentAnalysisTicker, "with error KT JSON.");
      setFullAnalysisStatus('analyzingOptions'); 
      const placeholder = `{ "status": "full_analysis_pending..." }`;
      setAiOptionsAnalysisRequestJson(placeholder); setAiOptionsAnalysisJson(placeholder);
      startTransition(() => performAiOptionsAnalysisFormAction({
          ticker: currentAnalysisTicker,
          optionsChainJson: contextOptionsChainJson,
          stockSnapshotJson: contextStockSnapshotJson,
      }));
    }
  }, [
      performAiAnalysisState, 
      isFullAnalysisTriggered, 
      fullAnalysisStatus, 
      isPerformAiAnalysisPending,
      contextOptionsChainJson, 
      contextStockSnapshotJson, 
      setAiKeyTakeawaysRequestJson, 
      setAiKeyTakeawaysJson, 
      setFullAnalysisStatus, 
      logDebug, 
      setAiOptionsAnalysisRequestJson, 
      setAiOptionsAnalysisJson, 
      performAiOptionsAnalysisFormAction, 
      toast, 
      handleGenericError 
    ]);

  // Effect for performAiOptionsAnalysisState (Options Analysis) -> Step 5: Chatbot Summary
  useEffect(() => {
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (!currentAnalysisTicker || !isFullAnalysisTriggered || performAiOptionsAnalysisState.status === 'idle' || (fullAnalysisStatus !== 'analyzingOptions' && !isPerformAiOptionsAnalysisPending)) {
      return;
    }
    logDebug('MainTabContent:useEffect[performAiOptionsAnalysisState]', "Options Analysis state changed:", performAiOptionsAnalysisState, "CurrentTickerRef:", currentAnalysisTicker);
    
    const autoPromptBase = "Provide a full detailed analysis of this stock based on all the context provided.";
    let finalAiOptionsJson = "{}"; 

    if (performAiOptionsAnalysisState.status === 'success' && performAiOptionsAnalysisState.data) {
      toast({ title: "AI Options Analysis Complete", description: performAiOptionsAnalysisState.message });
      setAiOptionsAnalysisRequestJson(performAiOptionsAnalysisState.data.aiOptionsAnalysisRequestJson);
      setAiOptionsAnalysisJson(performAiOptionsAnalysisState.data.aiOptionsAnalysisJson);
      finalAiOptionsJson = performAiOptionsAnalysisState.data.aiOptionsAnalysisJson;
    } else if (performAiOptionsAnalysisState.status === 'error') {
      finalAiOptionsJson = performAiOptionsAnalysisState.data?.aiOptionsAnalysisJson || `{ "status": "error", "message": "${(performAiOptionsAnalysisState.error || 'Options Analysis error').replace(/"/g, '\\"')}" }`;
      setAiOptionsAnalysisRequestJson(performAiOptionsAnalysisState.data?.aiOptionsAnalysisRequestJson || finalAiOptionsJson); 
      setAiOptionsAnalysisJson(finalAiOptionsJson);
      toast({ variant: "warning", title: "AI Options Analysis Warning", description: `Proceeding with chat, but options analysis may have issues: ${performAiOptionsAnalysisState.error || 'Unknown issue'}` });
    }
    
    setFullAnalysisStatus('chatting');
    const autoPrompt = performAiOptionsAnalysisState.status === 'error' 
      ? `${autoPromptBase} Note: Options analysis may have encountered an issue.` 
      : autoPromptBase;
    logDebug('MainTabContent:useEffect[performAiOptionsAnalysisState]', "Proceeding to Chatbot summary for", currentAnalysisTicker, "AutoPrompt:", autoPrompt.substring(0,50));
    
    const temporaryUserMessage: ChatMessage = {id: Date.now().toString() + "_sys_prompt", role: 'user', content: autoPrompt};
    addChatMessage(temporaryUserMessage); 

    startTransition(() => chatFormAction({
      ticker: currentAnalysisTicker,
      stockSnapshotJson: contextStockSnapshotJson,
      aiKeyTakeawaysJson: contextAiKeyTakeawaysJson,
      aiAnalyzedTaJson: contextAiAnalyzedTaJson,
      aiOptionsAnalysisJson: finalAiOptionsJson, 
      userInput: autoPrompt,
      chatHistory: [...contextChatHistory, temporaryUserMessage], 
    }));

  }, [
      performAiOptionsAnalysisState, 
      isFullAnalysisTriggered, 
      fullAnalysisStatus, 
      isPerformAiOptionsAnalysisPending,
      contextStockSnapshotJson, 
      contextAiKeyTakeawaysJson, 
      contextAiAnalyzedTaJson, 
      contextChatHistory, 
      setAiOptionsAnalysisRequestJson, 
      setAiOptionsAnalysisJson, 
      setFullAnalysisStatus, 
      logDebug, 
      addChatMessage, 
      chatFormAction, 
      toast, 
      handleGenericError
    ]); 
  
  // Effect for chatActionState (final step of full analysis or user-initiated chat)
  useEffect(() => {
    const currentAnalysisTicker = analysisTriggeredForTickerRef.current;
    if (chatActionState.status === 'idle' && (!currentAnalysisTicker || !isFullAnalysisTriggered || fullAnalysisStatus !== 'chatting')) {
        return;
    }
    logDebug('MainTabContent:useEffect[chatActionState]', "Chat state changed:", chatActionState, "FullAnalysisTriggered:", isFullAnalysisTriggered, "FullAnalysisStatus:", fullAnalysisStatus, "CurrentTickerRef:", currentAnalysisTicker);

    if (chatActionState.status === 'success' && chatActionState.data) {
      const modelResponse = JSON.parse(chatActionState.data.chatbotResponseJson);
      addChatMessage({ id: Date.now().toString() + '_model', role: 'model', content: modelResponse.response || "Model did not provide a response." });
      toast({ title: "Chatbot Responded", description: chatActionState.message });
      setChatbotRequestJson(chatActionState.data.chatbotRequestJson);
      setChatbotResponseJson(chatActionState.data.chatbotResponseJson);

      if (isFullAnalysisTriggered && currentAnalysisTicker && fullAnalysisStatus === 'chatting') {
        setFullAnalysisStatus('success');
        setIsFullAnalysisTriggered(false);
        toast({ title: `Full AI Analysis for ${currentAnalysisTicker} Complete!`, description: "All steps finished. See chat for summary.", duration: 7000 });
        if (analysisTriggeredForTickerRef.current === currentAnalysisTicker) {
            analysisTriggeredForTickerRef.current = null;
        }
      }
    } else if (chatActionState.status === 'error') {
      const errorMsg = chatActionState.error || 'Chatbot failed to respond.';
      toast({ variant: "destructive", title: "Chatbot Error", description: errorMsg });
      
      const errorRequestJson = chatActionState.data?.chatbotRequestJson || `{ "status": "error", "message": "Request data missing for chat for ${currentAnalysisTicker || 'unknown ticker'}" }`;
      const errorResponseJson = chatActionState.data?.chatbotResponseJson || `{ "status": "error", "message": "${errorMsg.replace(/"/g, '\\"')}" }`;
      setChatbotRequestJson(errorRequestJson);
      setChatbotResponseJson(errorResponseJson);
      addChatMessage({ id: Date.now().toString() + '_model_error', role: 'model', content: `Error: ${errorMsg}` });

      if (isFullAnalysisTriggered && currentAnalysisTicker && fullAnalysisStatus === 'chatting') {
        setFullAnalysisStatus('error');
        setIsFullAnalysisTriggered(false);
        if (analysisTriggeredForTickerRef.current === currentAnalysisTicker) {
            analysisTriggeredForTickerRef.current = null;
        }
      }
    }
  }, [
      chatActionState, 
      isFullAnalysisTriggered, 
      fullAnalysisStatus, 
      addChatMessage, 
      toast, 
      setChatbotRequestJson, 
      setChatbotResponseJson, 
      setFullAnalysisStatus, 
      setIsFullAnalysisTriggered, 
      logDebug
    ]);


  const getCombinedDataForExport = useCallback(() => {
    logDebug('MainTabContent:getCombinedDataForExport', 'Called.');
    try {
      return {
        stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
        standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'),
        aiAnalyzedTechnicalAnalysis: JSON.parse(contextAiAnalyzedTaJson || '{}'),
        aiKeyTakeaways: JSON.parse(contextAiKeyTakeawaysJson || '{}'),
        aiOptionsAnalysis: JSON.parse(contextAiOptionsAnalysisJson || '{}'),
        optionsChain: JSON.parse(contextOptionsChainJson || '{}'),
        marketStatus: JSON.parse(contextMarketStatusJson || '{}'),
      };
    } catch (e) {
        logDebug('MainTabContent:getCombinedDataForExport', 'Error parsing JSON:', e);
        toast({variant: "destructive", title: "Data Preparation Error", description: "Could not parse all data components for export."});
        return { error: "Failed to parse one or more data components." };
    }
  }, [logDebug, toast, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson, contextOptionsChainJson, contextMarketStatusJson]);

  const isJsonReadyForExport = (jsonString: string): boolean => {
    return !!jsonString && jsonString !== '{}' && !jsonString.includes('"status":') && !jsonString.includes('"error":');
  };

  const isDataReadyForCombinedExport =
    isJsonReadyForExport(contextStockSnapshotJson) &&
    isJsonReadyForExport(contextStandardTasJson) &&
    isJsonReadyForExport(contextAiAnalyzedTaJson) &&
    isJsonReadyForExport(contextAiKeyTakeawaysJson) &&
    isJsonReadyForExport(contextAiOptionsAnalysisJson) &&
    isJsonReadyForExport(contextOptionsChainJson) &&
    isJsonReadyForExport(contextMarketStatusJson);

  const handleExportAllToJson = useCallback(async () => {
    logDebug('MainTabContent:handleExportAllToJson', 'Button clicked.');
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
  }, [isDataReadyForCombinedExport, getCombinedDataForExport, tickerInput, toast, logDebug]);

  const handleCopyAllToJson = useCallback(async () => {
    logDebug('MainTabContent:handleCopyAllToJson', 'Button clicked.');
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
  }, [isDataReadyForCombinedExport, getCombinedDataForExport, tickerInput, toast, logDebug]);

  logDebug('MainTabContent', `Rendering. isAnyActionPending=${isAnyActionPending}, fullAnalysisStatus=${fullAnalysisStatus}, analysisTriggeredForTickerRef=${analysisTriggeredForTickerRef.current}`);
  const activeTickerForChat = (analysisTriggeredForTickerRef.current && (isFullAnalysisTriggered || (fullAnalysisStatus !== 'idle' && fullAnalysisStatus !== 'success' && fullAnalysisStatus !== 'error'))) ? analysisTriggeredForTickerRef.current : tickerInput;


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
                (fullAnalysisStatus === 'analyzingTa' && !isFullAnalysisTriggered && isAnalyzeTaPending)
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
            <CardDescription>Exports Snapshot, Standard TAs, AI Analyzed TA, AI Key Takeaways, AI Options Analysis, Options Chain, and Market Status.</CardDescription>
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
          <AiAnalyzedTaDisplay />
          <AiKeyTakeawaysDisplay /> 
          <OptionsChainTable />
          <AiOptionsAnalysisDisplay />
          <Chatbot
            chatFormAction={chatFormAction}
            isChatPending={isChatPending || (isFullAnalysisTriggered && fullAnalysisStatus === 'chatting')}
            currentTicker={activeTickerForChat}
          />
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}

