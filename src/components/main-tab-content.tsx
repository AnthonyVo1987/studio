
"use client";

import type { FormEvent } from 'react';
import React, { useState, useEffect, useRef, useCallback } from "react"; // Removed useReducer
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
import { OptionsChainTable } from "@/components/options-chain-table";
import { AiOptionsAnalysisDisplay } from "@/components/ai-options-analysis-display";
import { AiKeyTakeawaysDisplay } from "@/components/ai-key-takeaways-display";
import { Chatbot } from "@/components/chatbot";
import { ChatbotFsmProvider } from "@/contexts/chatbot-fsm-context";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";

import { useStockAnalysis, type ChatMessage, GlobalFsmState, type FsmDisplayTuple, type LogSourceId, type FsmEvent } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Copy, Zap, Brain, BarChartBig } from "lucide-react";
// Removed: StockSnapshotData import, it's used internally in context or other components
import { useActionState } from 'react';
import { chatServerAction, type ChatActionState, type ChatActionInputs } from '@/actions/chat-server-action';


// Removed: All MainTabLocalFsm related enums, types, initial state, and reducer

const initialLocalChatActionState: ChatActionState = {
  status: 'idle', data: undefined, error: null, message: null,
};

function isDataReadyForProcessing(jsonString: string | null | undefined, logDebugFn?: Function, sourceComponent?: string, dataName?: string): boolean {
  const callContext = `${sourceComponent || 'isDataReadyForProcessingCheck'}:${dataName || 'data'}`;
  if (!jsonString || jsonString === '{}' || jsonString.trim() === '{ "status": "pending..." }' || jsonString.trim() === '{ "status": "no_analysis_run_yet" }' || jsonString.trim() === '{ "status": "initializing..." }') {
    logDebugFn?.(sourceComponent as LogSourceId, 'Result:NotReady(EmptyOrGenericPending)', `${callContext} JSON: '${jsonString?.substring(0,50)}...'`);
    return false;
  }
  try {
    const parsed = JSON.parse(jsonString.trim());
    if (parsed && typeof parsed === 'object') {
      if (parsed.status && (parsed.status.includes('error') || parsed.status.includes('skipped') || parsed.status.includes('pending') || parsed.status.includes('initializing'))) {
        logDebugFn?.(sourceComponent as LogSourceId,'Result:NotReady(StatusField)', `${callContext} JSON: '${jsonString.trim().substring(0,100)}...'`);
        return false;
      }
      if (parsed.error) {
        logDebugFn?.(sourceComponent as LogSourceId,'Result:NotReady(ErrorField)', `${callContext} JSON: '${jsonString.trim().substring(0,100)}...'`);
        return false;
      }
    }
  } catch(e) {
    logDebugFn?.(sourceComponent as LogSourceId,'Result:NotReady(ParseFailed)', `${callContext} JSON: '${jsonString.trim().substring(0,100)}...'`);
    return false;
  }
  logDebugFn?.(sourceComponent as LogSourceId,'Result:Ready', `${callContext} JSON: '${jsonString.trim().substring(0,100)}...'`);
  return true;
}

interface MainTabContentProps {
  // Props related to local FSM display reporting removed
}

export function MainTabContent({
  // Props removed
}: MainTabContentProps) {
  const [tickerInput, setTickerInput] = useState("NVDA");
  const { toast } = useToast();
  const {
    marketStatusJson: contextMarketStatusJson,
    stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson,
    optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson,
    aiKeyTakeawaysJson: contextAiKeyTakeawaysJson,
    aiOptionsAnalysisJson: contextAiOptionsAnalysisJson,
    setChatbotRequestJson,
    setChatbotResponseJson,
    logDebug,
    fsmState: globalFsmStateFromContext,
    fsmVariables: globalFsmVariables,
    fsmFlags: globalFsmFlags,
    dispatchFsmEvent: dispatchGlobalFsmEvent,
    chatHistory: contextChatHistory,
    addChatMessage: addChatMessageToGlobalContext,
    setChatbotFsmDisplay,
    // Removed: previousGlobalFsmStateFromContext from destructuring as it's not directly used here for guard logic anymore
  } = useStockAnalysis();

  const contextChatHistoryRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    contextChatHistoryRef.current = contextChatHistory;
  }, [contextChatHistory]);

  const globalDispatchGuardRef = useRef<Record<string, boolean>>({});

  // Simplified useEffect for globalDispatchGuardRef. 
  // Its primary role for automated pipeline is now handled by button disablement.
  // This effect remains for potential use with manual actions later.
  useEffect(() => {
    const logPrefixEff = 'MainTabContent:GlobalDispatchEffect_v3211';
    logDebug(logPrefixEff as LogSourceId, 'ENTRY_Simplified', `Global: ${globalFsmStateFromContext}, Guard: ${JSON.stringify(globalDispatchGuardRef.current)}`);

    const keyTakeawaysTerminalStates: GlobalFsmState[] = [GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED];
    const optionsAnalysisTerminalStates: GlobalFsmState[] = [GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED];
    
    const activeTickerForGuardReset = globalFsmVariables.activeTicker; 

    const guardKeyForManualKT = activeTickerForGuardReset ? `TRIGGER_MANUAL_KEY_TAKEAWAYS_FOR_${activeTickerForGuardReset}` : null;
    if (guardKeyForManualKT && globalDispatchGuardRef.current[guardKeyForManualKT] &&
        globalFsmStateFromContext === GlobalFsmState.IDLE &&
        // Simplified check; assumes if FSM is IDLE and guard was active, the action completed or failed.
        // More precise check on previousGlobalFsmState might be needed if guards for manual actions become complex.
        (globalFsmVariables.lastError?.source === 'KeyTakeaways' || !globalFsmVariables.lastError) 
    ) {
      logDebug(logPrefixEff as LogSourceId, 'ResettingGuard_ManualKTDone', `Resetting guard: ${guardKeyForManualKT}.`);
      globalDispatchGuardRef.current[guardKeyForManualKT] = false;
    }
  
    const guardKeyForManualOpt = activeTickerForGuardReset ? `TRIGGER_MANUAL_OPTIONS_ANALYSIS_FOR_${activeTickerForGuardReset}` : null;
    if (guardKeyForManualOpt && globalDispatchGuardRef.current[guardKeyForManualOpt] &&
        globalFsmStateFromContext === GlobalFsmState.IDLE &&
        (globalFsmVariables.lastError?.source === 'OptionsAnalysis' || !globalFsmVariables.lastError)
    ) {
      logDebug(logPrefixEff as LogSourceId, 'ResettingGuard_ManualOptDone', `Resetting guard: ${guardKeyForManualOpt}.`);
      globalDispatchGuardRef.current[guardKeyForManualOpt] = false;
    }
  
  }, [
    globalFsmStateFromContext,
    globalFsmVariables.activeTicker,
    globalFsmVariables.lastError,
    logDebug,
  ]);


  const [chatActionState, chatFormAction, isChatPending] = useActionState<ChatActionState, ChatActionInputs>(
    chatServerAction,
    initialLocalChatActionState
  );

  useEffect(() => {
    if (chatActionState.status === 'success' && chatActionState.data) {
        logDebug('MainTabContent:chatActionState' as LogSourceId, 'ChatActionResultObserved:SUCCESS', `Chat action server call succeeded. Message: ${chatActionState.message}`);
        setChatbotRequestJson(chatActionState.data.chatbotRequestJson);
        setChatbotResponseJson(chatActionState.data.chatbotResponseJson);
        try {
            const modelResponse = JSON.parse(chatActionState.data.chatbotResponseJson);
            if (modelResponse.error) {
                logDebug('MainTabContent:chatActionState' as LogSourceId, 'ModelResponseWithErrorField', 'Chatbot flow indicated an error:', modelResponse.error);
                addChatMessageToGlobalContext({
                    id: Date.now().toString() + '_model_flow_error_main',
                    role: 'model',
                    content: modelResponse.message || modelResponse.error || "Sorry, the chatbot encountered an issue.",
                });
            } else if (modelResponse.response) {
                const lastMessageInHistory = contextChatHistoryRef.current[contextChatHistoryRef.current.length -1];
                if (lastMessageInHistory?.role !== 'model' || lastMessageInHistory?.content !== modelResponse.response) {
                    addChatMessageToGlobalContext({
                        id: Date.now().toString() + '_model_main',
                        role: 'model',
                        content: modelResponse.response,
                    });
                    logDebug('MainTabContent:chatActionState' as LogSourceId, 'ModelResponseAdded', 'Model response added to global chat history.');
                } else {
                    logDebug('MainTabContent:chatActionState' as LogSourceId, 'ModelResponseDuplicate', 'Duplicate model response detected, not adding to history.');
                }
            } else {
                 logDebug('MainTabContent:chatActionState' as LogSourceId, 'ModelResponseMissing', 'Model response content missing in successful action state data.');
                 addChatMessageToGlobalContext({
                    id: Date.now().toString() + '_model_malformed_main',
                    role: 'model',
                    content: "Sorry, I received an unclear response. Please try again.",
                });
            }
        } catch (e) {
            logDebug('MainTabContent:chatActionState' as LogSourceId, 'ModelResponseParseError', 'Failed to parse chatbotResponseJson.', e);
             addChatMessageToGlobalContext({
                id: Date.now().toString() + '_model_parse_error_main',
                role: 'model',
                content: "Sorry, I had trouble understanding that response. Please try again.",
            });
        }
    } else if (chatActionState.status === 'error') {
        logDebug('MainTabContent:chatActionState' as LogSourceId, 'ChatActionResultObserved:ERROR', `Chat action server call failed. Error: ${chatActionState.error}, Message: ${chatActionState.message}`);
        setChatbotRequestJson(chatActionState.data?.chatbotRequestJson || JSON.stringify({ error: chatActionState.error, message: chatActionState.message }, null, 2));
        setChatbotResponseJson(chatActionState.data?.chatbotResponseJson || JSON.stringify({ error: chatActionState.error, details: "Server action failed directly." }, null, 2));
        addChatMessageToGlobalContext({
            id: Date.now().toString() + '_model_action_error_main',
            role: 'model',
            content: chatActionState.message || "Sorry, an error occurred. Please try again.",
        });
    }
  }, [chatActionState, addChatMessageToGlobalContext, logDebug, setChatbotRequestJson, setChatbotResponseJson]);


  const handleTickerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTicker = e.target.value.toUpperCase();
    setTickerInput(newTicker);
  };

  const handleAnalyzeStockSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!tickerInput.trim()) {
      toast({ title: "Invalid Ticker", description: "Please enter a stock ticker.", variant: "destructive" });
      return;
    }
    logDebug('MainTabContent' as LogSourceId, 'UserAction_AnalyzeStock_CLICKED', `Button clicked for ${tickerInput}. Dispatching START_FULL_ANALYSIS to global FSM.`);
    dispatchGlobalFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker: tickerInput } });
  };

  const handleGenerateKeyTakeaways = () => {
    if (!globalFsmVariables.activeTicker) {
      toast({ title: "No Active Ticker", description: "Please analyze a stock first.", variant: "destructive" });
      return;
    }
    logDebug('MainTabContent' as LogSourceId, 'UserAction_GenKT_CLICKED', `Button clicked for ${globalFsmVariables.activeTicker}. Manual KT dispatch TBD.`);
    // dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_KEY_TAKEAWAYS', payload: { ticker: globalFsmVariables.activeTicker } }); // To be implemented in later task
  };

  const handleGenerateOptionsAnalysis = () => {
     if (!globalFsmVariables.activeTicker) {
      toast({ title: "No Active Ticker", description: "Please analyze a stock first.", variant: "destructive" });
      return;
    }
    logDebug('MainTabContent' as LogSourceId, 'UserAction_GenOpt_CLICKED', `Button clicked for ${globalFsmVariables.activeTicker}. Manual Options dispatch TBD.`);
    // dispatchGlobalFsmEvent({ type: 'TRIGGER_MANUAL_OPTIONS_ANALYSIS', payload: { ticker: globalFsmVariables.activeTicker } }); // To be implemented in later task
  };

  const analyzeButtonLoading = [
    GlobalFsmState.APP_INITIALIZING, // Technically, canAnalyzeStock should be false here anyway
    GlobalFsmState.PIPELINE_REQUESTED_DATA_FETCH,
    GlobalFsmState.DATA_FETCH_IN_PROGRESS,
    GlobalFsmState.CALCULATING_AI_TA
  ].includes(globalFsmStateFromContext);

  const analyzeButtonDisabled = !globalFsmFlags.canAnalyzeStock || analyzeButtonLoading || !tickerInput.trim();

  const [isKtButtonDisabled, setIsKtButtonDisabled] = useState(true);
  const [isOptButtonDisabled, setIsOptButtonDisabled] = useState(true);

  const keyTakeawaysButtonLoading = globalFsmStateFromContext === GlobalFsmState.GENERATING_KEY_TAKEAWAYS;
  const optionsAnalysisButtonLoading = globalFsmStateFromContext === GlobalFsmState.ANALYZING_OPTIONS;
  
  const isGlobalPipelineActive = ![
    GlobalFsmState.IDLE,
    GlobalFsmState.AWAITING_TICKER_INPUT,
    GlobalFsmState.VALID_TICKER_ENTERED,
    GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE,
    GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED,
    GlobalFsmState.KEY_TAKEAWAYS_FAILED,
    GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED,
    GlobalFsmState.OPTIONS_ANALYSIS_FAILED,
    GlobalFsmState.ERROR_STALE_DATA,
    GlobalFsmState.DATA_FETCH_FAILED,
    GlobalFsmState.AI_TA_CALCULATION_FAILED,
  ].includes(globalFsmStateFromContext);

  const isOverallAnalysisPending = isGlobalPipelineActive || isChatPending;


  useEffect(() => {
    const logPrefixDC = 'MainTabContent:ButtonStateEffect_v3211';

    const manualActionsPossible = [
        GlobalFsmState.IDLE, 
        GlobalFsmState.VALID_TICKER_ENTERED, 
        GlobalFsmState.PIPELINE_AUTOMATED_COMPLETE,
        GlobalFsmState.KEY_TAKEAWAYS_SUCCEEDED, GlobalFsmState.KEY_TAKEAWAYS_FAILED,
        GlobalFsmState.OPTIONS_ANALYSIS_SUCCEEDED, GlobalFsmState.OPTIONS_ANALYSIS_FAILED,
      ].includes(globalFsmStateFromContext) &&
      !!globalFsmVariables.activeTicker &&
      globalFsmVariables.activeTicker === tickerInput; // Ensure current input matches active analysis

    const ktSnapshotReady = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, logPrefixDC as LogSourceId, 'KT_Snapshot_DC');
    const ktStdTaReady = isDataReadyForProcessing(contextStandardTasJson, logDebug, logPrefixDC as LogSourceId, 'KT_StdTA_DC');
    const ktAiTaReady = isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, logPrefixDC as LogSourceId, 'KT_AiTA_DC');
    const ktMarketStatusReady = isDataReadyForProcessing(contextMarketStatusJson, logDebug, logPrefixDC as LogSourceId, 'KT_MarketStatus_DC');
    const ktPrereqsMet = ktSnapshotReady && ktStdTaReady && ktAiTaReady && ktMarketStatusReady;

    const optSnapshotReady = isDataReadyForProcessing(contextStockSnapshotJson, logDebug, logPrefixDC as LogSourceId, 'Opt_Snapshot_DC');
    const optChainReady = isDataReadyForProcessing(contextOptionsChainJson, logDebug, logPrefixDC as LogSourceId, 'Opt_Chain_DC');
    const optPrereqsMet = optSnapshotReady && optChainReady;

    const shouldKtButtonBeEnabled = manualActionsPossible && !keyTakeawaysButtonLoading && !analyzeButtonLoading && !isGlobalPipelineActive && ktPrereqsMet;
    const shouldOptButtonBeEnabled = manualActionsPossible && !optionsAnalysisButtonLoading && !analyzeButtonLoading && !isGlobalPipelineActive && optPrereqsMet;

    setIsKtButtonDisabled(!shouldKtButtonBeEnabled);
    setIsOptButtonDisabled(!shouldOptButtonBeEnabled);

  }, [
      globalFsmStateFromContext, globalFsmVariables.activeTicker, tickerInput,
      contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, contextOptionsChainJson,
      analyzeButtonLoading, keyTakeawaysButtonLoading, optionsAnalysisButtonLoading, isGlobalPipelineActive, logDebug
    ]);


  const getCombinedDataForExport = useCallback(() => {
    const baseData: any = {
      ticker: globalFsmVariables.activeTicker || tickerInput,
      marketStatus: JSON.parse(contextMarketStatusJson || '{}'),
      stockSnapshot: JSON.parse(contextStockSnapshotJson || '{}'),
      standardTechnicalIndicators: JSON.parse(contextStandardTasJson || '{}'),
      aiAnalyzedTechnicalAnalysis: JSON.parse(contextAiAnalyzedTaJson || '{}'),
    };

    if (isDataReadyForProcessing(contextAiKeyTakeawaysJson, logDebug, 'CombinedExportCheck' as LogSourceId, 'AiKeyTakeaways')) {
      baseData.aiKeyTakeaways = JSON.parse(contextAiKeyTakeawaysJson || '{}');
    }
    if (isDataReadyForProcessing(contextAiOptionsAnalysisJson, logDebug, 'CombinedExportCheck' as LogSourceId, 'AiOptionsAnalysis')) {
      baseData.aiOptionsAnalysis = JSON.parse(contextAiOptionsAnalysisJson || '{}');
    }
    if (isDataReadyForProcessing(contextOptionsChainJson, logDebug, 'CombinedExportCheck' as LogSourceId, 'OptionsChain')) {
      baseData.optionsChain = JSON.parse(contextOptionsChainJson || '{}');
    }
    return baseData;
  }, [
      globalFsmVariables.activeTicker, tickerInput,
      contextMarketStatusJson, contextStockSnapshotJson, contextStandardTasJson,
      contextAiAnalyzedTaJson, contextAiKeyTakeawaysJson, contextAiOptionsAnalysisJson,
      contextOptionsChainJson, logDebug
    ]);

  const isBaseDataReadyForCombinedExport =
    isDataReadyForProcessing(contextMarketStatusJson, logDebug, 'ExportCheck' as LogSourceId, 'MarketStatus') &&
    isDataReadyForProcessing(contextStockSnapshotJson, logDebug, 'ExportCheck' as LogSourceId, 'StockSnapshot') &&
    isDataReadyForProcessing(contextStandardTasJson, logDebug, 'ExportCheck' as LogSourceId, 'StandardTAs') &&
    isDataReadyForProcessing(contextAiAnalyzedTaJson, logDebug, 'ExportCheck' as LogSourceId, 'AiAnalyzedTA');

  const combinedExportButtonsDisabled =
    !isBaseDataReadyForCombinedExport ||
    analyzeButtonLoading ||
    keyTakeawaysButtonLoading ||
    optionsAnalysisButtonLoading ||
    isGlobalPipelineActive;


  const handleExportAllToJson = useCallback(async () => {
    logDebug('MainTabContent' as LogSourceId, 'Export_All', 'Export All to JSON clicked.');
    if (!isBaseDataReadyForCombinedExport) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'Core data sections are not available for export.' });
      return;
    }
    try {
      const combinedData = getCombinedDataForExport();
      const filename = `${combinedData.ticker || 'StockSage'}_full_analysis_${new Date().toISOString().split('T')[0]}.json`;
      downloadJson(combinedData, filename);
      toast({ title: 'Export Successful', description: `Data exported to ${filename}` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export Error', description: `Could not export data: ${e.message}` });
    }
  }, [isBaseDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  const handleCopyAllToJson = useCallback(async () => {
    logDebug('MainTabContent' as LogSourceId, 'Copy_All', 'Copy All to JSON clicked.');
     if (!isBaseDataReadyForCombinedExport) {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Core data sections are not available for copy.' });
      return;
    }
    try {
      const combinedData = getCombinedDataForExport();
      const success = await copyToClipboard(JSON.stringify(combinedData, null, 2));
      if (success) {
        toast({ title: 'Copied to Clipboard', description: 'Data copied as JSON.' });
      } else {
        throw new Error('Clipboard API failed.');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Copy Error', description: `Could not copy data: ${e.message}` });
    }
  }, [isBaseDataReadyForCombinedExport, getCombinedDataForExport, toast, logDebug]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis Input</CardTitle>
        <CardDescription>
          Enter ticker for Data Fetch & AI TA. Manual AI actions available after.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleAnalyzeStockSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="ticker">Stock Ticker</Label>
              <Input
                id="ticker"
                value={tickerInput}
                onChange={handleTickerInputChange}
                placeholder="e.g., AAPL, MSFT"
                disabled={analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading || isGlobalPipelineActive}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon" disabled>
                <SelectTrigger id="dataSource" disabled={analyzeButtonLoading || keyTakeawaysButtonLoading || optionsAnalysisButtonLoading || isGlobalPipelineActive}>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polygon">Polygon.io</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" className="w-full sm:w-auto"
              disabled={analyzeButtonDisabled}>
              { analyzeButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
              <Zap className="mr-2 h-4 w-4" /> Analyze Stock (Data & AI TA)
            </Button>
          </div>
        </form>

        <Separator />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">On-Demand AI Analysis</CardTitle>
            <CardDescription>
              Generate specific AI insights for {globalFsmVariables.activeTicker || "the analyzed stock"}. Available after initial "Analyze Stock" is complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleGenerateKeyTakeaways}
                  className="w-full sm:w-auto"
                  disabled={isKtButtonDisabled}
                >
                  {keyTakeawaysButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Brain className="mr-2 h-4 w-4" /> Generate AI Key Takeaways
                </Button>
                <Button
                  onClick={handleGenerateOptionsAnalysis}
                  className="w-full sm:w-auto"
                  disabled={isOptButtonDisabled}
                >
                  {optionsAnalysisButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <BarChartBig className="mr-2 h-4 w-4" /> Generate AI Options Analysis
                </Button>
              </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-2">
            <h3 className="text-lg font-medium">Combined Data Export</h3>
            <CardDescription>Exports Snapshot, Standard TAs, AI Analyzed TA, and Market Status. AI Key Takeaways, Options Chain, and AI Options Analysis are included if available.</CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={handleExportAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={combinedExportButtonsDisabled}>
                    <Download className="mr-2 h-4 w-4" /> Export All to JSON
                </Button>
                <Button onClick={handleCopyAllToJson} type="button" variant="outline" className="w-full sm:w-auto" disabled={combinedExportButtonsDisabled}>
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
          <ChatbotFsmProvider
            chatFormAction={chatFormAction}
            addChatMessageToGlobalContext={addChatMessageToGlobalContext}
            currentTicker={globalFsmVariables.activeTicker || tickerInput}
            stockSnapshotJson={contextStockSnapshotJson || '{}'}
            aiKeyTakeawaysJson={contextAiKeyTakeawaysJson || '{}'}
            aiAnalyzedTaJson={contextAiAnalyzedTaJson || '{}'}
            aiOptionsAnalysisJson={contextAiOptionsAnalysisJson || '{}'}
            currentGlobalChatHistory={contextChatHistory}
            logDebug={logDebug}
            setChatbotFsmDisplayState={setChatbotFsmDisplay}
          >
            <Chatbot
              isAnyAnalysisInProgress={isOverallAnalysisPending}
              currentTickerForDisplay={globalFsmVariables.activeTicker || tickerInput}
            />
          </ChatbotFsmProvider>
          <MarketStatusDisplay />
        </div>
      </CardContent>
    </Card>
  );
}

