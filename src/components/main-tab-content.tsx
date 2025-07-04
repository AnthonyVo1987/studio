
'use client';

import React, { useState, type FormEvent, useCallback, useRef, useEffect } from "react";
import { useActionState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { KeyMetricsDisplay } from "@/components/key-metrics-display";
import { StockSnapshotDetailsDisplay } from "@/components/stock-snapshot-details-display";
import { MarketStatusDisplay } from "@/components/market-status-display";
import { StandardTaDisplay } from "@/components/standard-ta-display";
import { AiAnalyzedTaDisplay } from "@/components/ai-analyzed-ta-display";
import { OptionsChainTable } from "@/components/options-chain-table";
import { AiOptionsAnalysisDisplay } from "@/components/ai-options-analysis-display";
import { AiKeyTakeawaysDisplay } from "@/components/ai-key-takeaways-display";
import { Chatbot, type ExamplePromptButton } from "@/components/chatbot";
import { DebugSnapshotControls } from "@/components/debug-snapshot-controls";
import { useStockAnalysis, GlobalFsmState, type AnalysisToggleType } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, Search, SearchCode, FileText, CandlestickChart } from "lucide-react";

// Server Actions
import { fetchStockDataAction } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction } from '@/actions/perform-ai-options-analysis-action';
import { appDataChatAction, type AppDataChatActionState, type AppDataChatActionInputs } from '@/actions/app-data-chat-action';
import { sdkWebSearchChatAction, type SdkWebSearchChatActionState, type SdkWebSearchChatActionInputs } from '@/actions/sdk-web-search-chat-action';

const appDataButtons: ExamplePromptButton[] = [
  { title: "Stock Trader's Takeaways", promptName: 'stock-trader-takeaways', icon: FileText },
  { title: "Options Trader's Takeaways", promptName: 'options-trader-takeaways', icon: FileText },
  { title: "Additional Holistic Takeaways", promptName: 'holistic-takeaways', icon: FileText },
];

const webSearchButtons: ExamplePromptButton[] = [
    { title: "S/R Levels Search", promptName: 'support-resistance-web-search', icon: CandlestickChart },
    { title: "Technical Analysis Search", promptName: 'technical-analysis-web-search', icon: SearchCode },
    { title: "Options Flow Search", promptName: 'options-flow-web-search', icon: Search },
];

export function MainTabContent() {
  const { toast } = useToast();
  const {
    marketStatusJson: contextMarketStatusJson, stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson, optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson, aiKeyTakeawaysJson: contextKeyTakeawaysJson, 
    aiOptionsAnalysisJson: contextOptionsAnalysisJson, logDebug,
    fsmState: globalFsmStateFromContext, fsmVariables: globalFsmVariables, fsmFlags: globalFsmFlags,
    dispatchFsmEvent: dispatchGlobalFsmEvent,
    // App Data Chat
    appDataChatHistory: contextAppDataChatHistory, addAppDataChatMessage, clearAppDataChatHistory,
    setUserInputAppDataChatRequestJson, setUserInputAppDataChatResponseJson,
    setStockTraderTakeawaysRequestJson, setStockTraderTakeawaysResponseJson,
    setOptionsTraderTakeawaysRequestJson, setOptionsTraderTakeawaysResponseJson,
    setHolisticTakeawaysRequestJson, setHolisticTakeawaysResponseJson,
    // Web Search Chat
    webSearchChatHistory: contextWebSearchChatHistory, addWebSearchChatMessage, clearWebSearchChatHistory,
    setUserInputWebSearchChatRequestJson, setUserInputWebSearchChatResponseJson,
    setRawTaWebSearchRequestJson, setRawTaWebSearchResponseJson,
    setRawOptionsWebSearchRequestJson, setRawOptionsWebSearchResponseJson,
    setRawSupportResistanceWebSearchRequestJson, setRawSupportResistanceWebSearchResponseJson,
    setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
    setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson,
  } = useStockAnalysis();

  const [appDataChatUserInput, setAppDataChatUserInput] = useState('');
  const [webSearchUserInput, setWebSearchUserInput] = useState('');

  const [appDataChatState, appDataChatFormAction, isAppDataChatPending] = useActionState<AppDataChatActionState, AppDataChatActionInputs>(appDataChatAction, { status: 'idle' });
  const [webSearchChatState, webSearchChatFormAction, isWebSearchChatPending] = useActionState<SdkWebSearchChatActionState, SdkWebSearchChatActionInputs>(sdkWebSearchChatAction, { status: 'idle' });
  
  const initialInitializationDispatchedRef = useRef(false);

  useEffect(() => {
    if (!initialInitializationDispatchedRef.current) {
        logDebug('MainTabContent', 'Initialization', 'Dispatching INITIALIZATION_COMPLETE event on mount.');
        dispatchGlobalFsmEvent({ type: 'INITIALIZATION_COMPLETE' });
        initialInitializationDispatchedRef.current = true;
    }
  }, [dispatchGlobalFsmEvent, logDebug]);

  // Reactive Pipeline Orchestrator
  useEffect(() => {
    const orchestratorLogPrefix = 'StockAnalysisContext:GlobalFSM_Orchestrator';
    logDebug(orchestratorLogPrefix as any, 'Entry', `Orchestrator running. Current FSM state: ${globalFsmStateFromContext}`);

    const runPipelineStep = async () => {
      switch (globalFsmStateFromContext) {
        case GlobalFsmState.DATA_FETCH_IN_PROGRESS: {
          const dataResult = await fetchStockDataAction({ ticker: globalFsmVariables.activeTicker! });
          dispatchGlobalFsmEvent({ type: dataResult.status === 'success' ? 'FETCH_DATA_SUCCESS' : 'FETCH_DATA_FAILURE', payload: dataResult });
          if(dataResult.status !== 'success') toast({ title: "Data Fetch Failed", description: dataResult.message, variant: 'destructive' });
          break;
        }
        case GlobalFsmState.CALCULATING_AI_TA: {
          const aiTaResult = await analyzeTaAction({ stockSnapshotJson: contextStockSnapshotJson, ticker: globalFsmVariables.activeTicker! });
          dispatchGlobalFsmEvent({ type: aiTaResult.status === 'success' ? 'AI_TA_SUCCESS' : 'AI_TA_FAILURE', payload: aiTaResult });
          if(aiTaResult.status !== 'success') toast({ title: "AI TA Calculation Failed", description: aiTaResult.message, variant: 'destructive' });
          break;
        }
        case GlobalFsmState.GENERATING_KEY_TAKEAWAYS: {
          const keyTakeawaysResult = await performAiAnalysisAction({
            ticker: globalFsmVariables.activeTicker!, 
            stockSnapshotJson: contextStockSnapshotJson, 
            standardTasJson: contextStandardTasJson, 
            aiAnalyzedTaJson: contextAiAnalyzedTaJson, 
            marketStatusJson: contextMarketStatusJson
          });
          if (keyTakeawaysResult.data) {
            setAiKeyTakeawaysRequestJson(keyTakeawaysResult.data.aiKeyTakeawaysRequestJson);
            setAiKeyTakeawaysJson(keyTakeawaysResult.data.aiKeyTakeawaysJson);
          }
          dispatchGlobalFsmEvent({ type: keyTakeawaysResult.status === 'success' ? 'KEY_TAKEAWAYS_SUCCESS' : 'KEY_TAKEAWAYS_FAILURE', payload: keyTakeawaysResult });
          if(keyTakeawaysResult.status !== 'success') toast({ title: "Pipeline Step Failed: AI Key Takeaways", description: keyTakeawaysResult.message, variant: 'destructive' });
          break;
        }
        case GlobalFsmState.ANALYZING_OPTIONS: {
          const optionsAnalysisResult = await performAiOptionsAnalysisAction({
            ticker: globalFsmVariables.activeTicker!, 
            stockSnapshotJson: contextStockSnapshotJson, 
            optionsChainJson: contextOptionsChainJson,
          });
          if (optionsAnalysisResult.data) {
            setAiOptionsAnalysisRequestJson(optionsAnalysisResult.data.aiOptionsAnalysisRequestJson);
            setAiOptionsAnalysisJson(optionsAnalysisResult.data.aiOptionsAnalysisJson);
          }
          dispatchGlobalFsmEvent({ type: optionsAnalysisResult.status === 'success' ? 'OPTIONS_ANALYSIS_SUCCESS' : 'OPTIONS_ANALYSIS_FAILURE', payload: optionsAnalysisResult });
          if(optionsAnalysisResult.status !== 'success') toast({ title: "Pipeline Step Failed: AI Options Analysis", description: optionsAnalysisResult.message, variant: 'destructive' });
          break;
        }
        default:
          // Do nothing in other states
          break;
      }
    };

    runPipelineStep();

  }, [globalFsmStateFromContext]); // End of Orchestrator


  // Effect to handle App Data Chat results
  useEffect(() => {
    if (appDataChatState.status === 'idle' || isAppDataChatPending) return;
    const { data, error, message, status } = appDataChatState;
    const requestJson = data?.chatbotRequestJson || '{}';
    const responseJson = data?.chatbotResponseJson || '{}';
    const promptName = JSON.parse(requestJson)?.promptName;
    
    switch (promptName) {
      case 'stock-trader-takeaways': setStockTraderTakeawaysRequestJson(requestJson); setStockTraderTakeawaysResponseJson(responseJson); break;
      case 'options-trader-takeaways': setOptionsTraderTakeawaysRequestJson(requestJson); setOptionsTraderTakeawaysResponseJson(responseJson); break;
      case 'holistic-takeaways': setHolisticTakeawaysRequestJson(requestJson); setHolisticTakeawaysResponseJson(responseJson); break;
      default: setUserInputAppDataChatRequestJson(requestJson); setUserInputAppDataChatResponseJson(responseJson); break;
    }
    
    if (status === 'success') {
      const response = JSON.parse(responseJson)?.response;
      addAppDataChatMessage({ role: 'model', content: response || 'No response text found.' });
    } else if (status === 'error') {
      addAppDataChatMessage({ role: 'model', content: `Error: ${message || error}` });
    }
  }, [appDataChatState, isAppDataChatPending, addAppDataChatMessage, setHolisticTakeawaysRequestJson, setHolisticTakeawaysResponseJson, setOptionsTraderTakeawaysRequestJson, setOptionsTraderTakeawaysResponseJson, setStockTraderTakeawaysRequestJson, setStockTraderTakeawaysResponseJson, setUserInputAppDataChatRequestJson, setUserInputAppDataChatResponseJson]);

  // Effect to handle Web Search Chat results
  useEffect(() => {
    if (webSearchChatState.status === 'idle' || isWebSearchChatPending) return;
    const { data, error, message, status } = webSearchChatState;
    const requestJson = data?.requestJson || '{}';
    const responseJson = data?.responseJson || '{}';
    const promptName = JSON.parse(requestJson)?.promptName;

    switch (promptName) {
      case 'support-resistance-web-search': setRawSupportResistanceWebSearchRequestJson(requestJson); setRawSupportResistanceWebSearchResponseJson(responseJson); break;
      case 'technical-analysis-web-search': setRawTaWebSearchRequestJson(requestJson); setRawTaWebSearchResponseJson(responseJson); break;
      case 'options-flow-web-search': setRawOptionsWebSearchRequestJson(requestJson); setRawOptionsWebSearchResponseJson(responseJson); break;
      default: setUserInputWebSearchChatRequestJson(requestJson); setUserInputWebSearchChatResponseJson(responseJson); break;
    }

    if (status === 'success') {
      const response = JSON.parse(responseJson)?.response;
      addWebSearchChatMessage({ role: 'model', content: response || 'No response text found.' });
    } else if (status === 'error') {
      addWebSearchChatMessage({ role: 'model', content: `Error: ${message || error}` });
    }
  }, [webSearchChatState, isWebSearchChatPending, addWebSearchChatMessage, setRawOptionsWebSearchRequestJson, setRawOptionsWebSearchResponseJson, setRawSupportResistanceWebSearchRequestJson, setRawSupportResistanceWebSearchResponseJson, setRawTaWebSearchRequestJson, setRawTaWebSearchResponseJson, setUserInputWebSearchChatRequestJson, setUserInputWebSearchChatResponseJson]);

  const appDataFormActionWrapper = (payload: { userInput?: string; promptName?: string }) => {
    if (isAppDataChatPending) return;
    const userInput = payload.userInput || payload.promptName || '';
    addAppDataChatMessage({ role: 'user', content: userInput });
    appDataChatFormAction({
      ticker: globalFsmVariables.activeTicker || '',
      stockSnapshotJson: contextStockSnapshotJson,
      aiKeyTakeawaysJson: contextKeyTakeawaysJson,
      aiAnalyzedTaJson: contextAiAnalyzedTaJson,
      aiOptionsAnalysisJson: contextOptionsAnalysisJson,
      chatHistory: contextAppDataChatHistory,
      userInput: userInput,
      promptName: payload.promptName,
    });
  };

  const webSearchFormActionWrapper = (payload: { userInput?: string; promptName?: string }) => {
    if (isWebSearchChatPending) return;
    const userInput = payload.userInput || payload.promptName || '';
    addWebSearchChatMessage({ role: 'user', content: userInput });
    webSearchChatFormAction({
        ticker: globalFsmVariables.activeTicker || '',
        promptName: payload.promptName,
        userInput: payload.userInput,
    });
  };
  
  const { userInputTicker: globalUserInputTicker } = globalFsmVariables;

  const handleTickerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTicker = e.target.value.toUpperCase();
    dispatchGlobalFsmEvent({ type: 'USER_INPUT_TICKER_CHANGED', payload: { ticker: newTicker } });
  };
  
  const handleAnalyzeStockSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const ticker = globalUserInputTicker.trim();
    if (!ticker) {
      toast({ title: "Invalid Ticker", description: "Please enter a stock ticker.", variant: "destructive" });
      return;
    }
    dispatchGlobalFsmEvent({ type: 'START_FULL_ANALYSIS', payload: { ticker } });
  };


  const handleToggleChange = (toggleType: AnalysisToggleType, isEnabled: boolean) => {
    dispatchGlobalFsmEvent({ type: 'ANALYSIS_TOGGLE_CHANGED', payload: { toggleType, isEnabled } });
  };

  const isPipelineInProgress = ![
    GlobalFsmState.IDLE,
    GlobalFsmState.AWAITING_TICKER_INPUT,
    GlobalFsmState.VALID_TICKER_ENTERED,
    GlobalFsmState.DATA_FETCH_FAILED,
    GlobalFsmState.ERROR_STALE_DATA,
    GlobalFsmState.AI_TA_CALCULATION_FAILED,
    GlobalFsmState.KEY_TAKEAWAYS_FAILED,
    GlobalFsmState.OPTIONS_ANALYSIS_FAILED,
  ].includes(globalFsmStateFromContext);


  const analyzeButtonLoading = isPipelineInProgress;
  const analyzeButtonDisabled = !globalFsmFlags.canAnalyzeStock || analyzeButtonLoading || !globalUserInputTicker.trim();
  
  const isAnyChatPending = isAppDataChatPending || isWebSearchChatPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis Input</CardTitle>
        <CardDescription>Enter a stock ticker to begin the analysis pipeline. Use the toggles to customize the AI-driven steps.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleAnalyzeStockSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="ticker">Stock Ticker</Label>
              <Input id="ticker" value={globalUserInputTicker} onChange={handleTickerInputChange} placeholder="e.g., AAPL, MSFT" disabled={analyzeButtonLoading}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon" disabled><SelectTrigger id="dataSource" disabled={analyzeButtonLoading}><SelectValue placeholder="Select data source" /></SelectTrigger><SelectContent><SelectItem value="polygon">Polygon.io</SelectItem></SelectContent></Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={analyzeButtonDisabled || isAnyChatPending}>
              {analyzeButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <Zap className="mr-2 h-4 w-4" /> Analyze Stock
            </Button>
          </div>
        </form>
        <Separator />
        <Card>
          <CardHeader>
            <CardTitle>Customizable Analysis Pipeline</CardTitle>
            <CardDescription>Select which AI analyses to run when you click "Analyze Stock".</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between space-x-2 p-2 border rounded-md">
              <Label htmlFor="toggle-key-takeaways" className="flex-grow text-sm">AI Key Takeaways</Label>
              <Switch id="toggle-key-takeaways" checked={globalFsmFlags.isAiKeyTakeawaysSelected} onCheckedChange={(checked) => handleToggleChange('ai_key_takeaways', checked)} disabled={analyzeButtonLoading} />
            </div>
            <div className="flex items-center justify-between space-x-2 p-2 border rounded-md">
              <Label htmlFor="toggle-options-analysis" className="flex-grow text-sm">AI Analyzed Options Chain</Label>
              <Switch id="toggle-options-analysis" checked={globalFsmFlags.isAiOptionsAnalysisSelected} onCheckedChange={(checked) => handleToggleChange('ai_options_analysis', checked)} disabled={analyzeButtonLoading} />
            </div>
          </CardContent>
        </Card>
        <Separator />
        <div className="space-y-6">
          <KeyMetricsDisplay />
          <StockSnapshotDetailsDisplay />
          <StandardTaDisplay />
          <AiAnalyzedTaDisplay />
          <AiKeyTakeawaysDisplay />
          <OptionsChainTable />
          <AiOptionsAnalysisDisplay />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Chatbot
              title="App Data AI Chat"
              description={`Analyzes loaded app data for ${globalFsmVariables.activeTicker || "the stock"}. Cannot access web.`}
              chatHistory={contextAppDataChatHistory}
              clearChatHistory={clearAppDataChatHistory}
              isProcessing={isAppDataChatPending}
              exampleButtons={appDataButtons}
              currentTickerForDisplay={globalFsmVariables.activeTicker || globalUserInputTicker}
              logDebug={logDebug}
              userInput={appDataChatUserInput}
              setUserInput={setAppDataChatUserInput}
              formAction={appDataFormActionWrapper}
            />
            <Chatbot
              title="Web Search AI Chat"
              description={`Ask AI anything with Google Search Support...`}
              chatHistory={contextWebSearchChatHistory}
              clearChatHistory={clearWebSearchChatHistory}
              isProcessing={isWebSearchChatPending}
              exampleButtons={webSearchButtons}
              currentTickerForDisplay={globalFsmVariables.activeTicker || globalUserInputTicker}
              logDebug={logDebug}
              userInput={webSearchUserInput}
              setUserInput={setWebSearchUserInput}
              formAction={webSearchFormActionWrapper}
            />
          </div>
          <Separator />
          <MarketStatusDisplay />
          <Separator />
          <DebugSnapshotControls />
        </div>
      </CardContent>
    </Card>
  );
}
