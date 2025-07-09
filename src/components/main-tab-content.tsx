
'use client';

import React, { useState, type FormEvent, useCallback, useRef, useEffect, startTransition } from "react";
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
import { Loader2, Zap, Search, SearchCode, FileText, CandlestickChart, CalendarDays } from "lucide-react";
import { loadExamplePrompts, type ExamplePrompt } from '@/ai/definition-loader';
import { findNextAvailableDate } from '@/lib/date-utils';

// Server Actions
import { fetchStockDataAction } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction } from '@/actions/perform-ai-options-analysis-action';
import { appDataChatAction, type AppDataChatActionState, type AppDataChatActionInputs } from '@/actions/app-data-chat-action';
import { sdkWebSearchChatAction, type SdkWebSearchChatActionState, type SdkWebSearchChatActionInputs } from '@/actions/sdk-web-search-chat-action';
import { getOptionsExpirationsAction } from '@/actions/get-options-expirations-action';
import { getOptionsChainForExpirationAction } from '@/actions/get-options-chain-for-expiration-action';

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

const pendingJson = '{ "status": "pending..." }';
const initialJsonPlaceholder = '{ "status": "no_analysis_run_yet" }';

interface MainTabContentProps {
  appVersion: string;
}

export function MainTabContent({ appVersion }: MainTabContentProps) {
  const { toast } = useToast();
  const {
    marketStatusJson: contextMarketStatusJson, stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson, optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson, aiKeyTakeawaysJson: contextKeyTakeawaysJson, 
    aiOptionsAnalysisJson: contextOptionsAnalysisJson, logDebug,
    fsmState: globalFsmStateFromContext, fsmVariables: globalFsmVariables, fsmFlags: globalFsmFlags,
    dispatchFsmEvent: dispatchGlobalFsmEvent,
    // AI Analysis Setters
    setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
    setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson,
    setOptionsChainJson,
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
    // New On-Demand Options State
    availableExpirationDates, setAvailableExpirationDates,
    selectedExpirationDate, setSelectedExpirationDate,
    setOnDemandOptionsChainRequestJson,
    isLoadingExpirations, setIsLoadingExpirations,
    isLoadingOnDemandOptions, setIsLoadingOnDemandOptions,
    optionType, setOptionType,
    strikeCount, setStrikeCount,
    tableDisplayType, setTableDisplayType,
  } = useStockAnalysis();

  const [appDataChatUserInput, setAppDataChatUserInput] = useState('');
  const [webSearchUserInput, setWebSearchUserInput] = useState('');
  
  const [appDataExamplePrompts, setAppDataExamplePrompts] = useState<ExamplePrompt[]>([]);
  const [webSearchExamplePrompts, setWebSearchExamplePrompts] = useState<ExamplePrompt[]>([]);

  useEffect(() => {
    loadExamplePrompts('example-chat-prompts.json').then(setAppDataExamplePrompts).catch(err => {
      console.error("Failed to load App Data example prompts:", err);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load app data example prompts.' });
    });
    loadExamplePrompts('example-web-search-prompts.json').then(setWebSearchExamplePrompts).catch(err => {
      console.error("Failed to load Web Search example prompts:", err);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load web search example prompts.' });
    });
  }, [toast]);

  const [appDataChatState, submitAppDataChat, isAppDataChatPending] = useActionState<AppDataChatActionState, AppDataChatActionInputs>(appDataChatAction, { status: 'idle' });
  const [webSearchChatState, submitWebSearchChat, isWebSearchChatPending] = useActionState<SdkWebSearchChatActionState, SdkWebSearchChatActionInputs>(sdkWebSearchChatAction, { status: 'idle' });
  
  const initialInitializationDispatchedRef = useRef(false);

  useEffect(() => {
    if (!initialInitializationDispatchedRef.current) {
        dispatchGlobalFsmEvent({ type: 'INITIALIZATION_COMPLETE' });
        initialInitializationDispatchedRef.current = true;
    }
  }, [dispatchGlobalFsmEvent]);

  // Reactive Pipeline Orchestrator
  useEffect(() => {
    const orchestratorLogPrefix = 'MainTabContent:Orchestrator';

    const runPipelineStep = async () => {
      switch (globalFsmStateFromContext) {
        case GlobalFsmState.DATA_FETCH_IN_PROGRESS: {
          const newTicker = globalFsmVariables.activeTicker;
          let currentOptionsTicker: string | undefined;
          try {
            if (contextOptionsChainJson && contextOptionsChainJson !== '{}' && !contextOptionsChainJson.includes('"status":')) {
              const parsed = JSON.parse(contextOptionsChainJson);
              currentOptionsTicker = parsed?.ticker;
            }
          } catch (e) {
          }

          const isContextStale = newTicker && currentOptionsTicker && newTicker !== currentOptionsTicker;

          const result = await fetchStockDataAction({
            ticker: newTicker!,
            expirationDate: isContextStale ? undefined : selectedExpirationDate,
            optionType: optionType,
            strikeCount: strikeCount,
          });
          dispatchGlobalFsmEvent({ type: result.status === 'success' ? 'FETCH_DATA_SUCCESS' : 'FETCH_DATA_FAILURE', payload: result });
          if(result.status !== 'success') toast({ title: "Data Fetch Failed", description: result.message, variant: 'destructive' });
          break;
        }
        case GlobalFsmState.CALCULATING_AI_TA: {
          const result = await analyzeTaAction({ stockSnapshotJson: contextStockSnapshotJson, ticker: globalFsmVariables.activeTicker! });
          dispatchGlobalFsmEvent({ type: result.status === 'success' ? 'AI_TA_SUCCESS' : 'AI_TA_FAILURE', payload: result });
          if(result.status !== 'success') toast({ title: "AI TA Calculation Failed", description: result.message, variant: 'destructive' });
          break;
        }
        case GlobalFsmState.GENERATING_KEY_TAKEAWAYS: {
          const result = await performAiAnalysisAction({
            ticker: globalFsmVariables.activeTicker!, 
            stockSnapshotJson: contextStockSnapshotJson, 
            standardTasJson: contextStandardTasJson, 
            aiAnalyzedTaJson: contextAiAnalyzedTaJson, 
            marketStatusJson: contextMarketStatusJson
          });
          if (result.status === 'success' && result.data) {
            setAiKeyTakeawaysRequestJson(result.data.aiKeyTakeawaysRequestJson);
            setAiKeyTakeawaysJson(result.data.aiKeyTakeawaysJson);
          }
          dispatchGlobalFsmEvent({ type: 'KEY_TAKEAWAYS_SUCCESS', payload: result });
          if(result.status !== 'success') toast({ title: "Pipeline Step Failed: AI Key Takeaways", description: result.message, variant: 'destructive' });
          break;
        }
        case GlobalFsmState.ANALYZING_OPTIONS: {
          const result = await performAiOptionsAnalysisAction({
            ticker: globalFsmVariables.activeTicker!, 
            stockSnapshotJson: contextStockSnapshotJson, 
            optionsChainJson: contextOptionsChainJson,
          });
          if(result.status === 'success' && result.data) {
            setAiOptionsAnalysisRequestJson(result.data.aiOptionsAnalysisRequestJson);
            setAiOptionsAnalysisJson(result.data.aiOptionsAnalysisJson);
          }
          dispatchGlobalFsmEvent({ type: 'OPTIONS_ANALYSIS_SUCCESS', payload: result });
          if(result.status !== 'success') toast({ title: "Pipeline Step Failed: AI Options Analysis", description: result.message, variant: 'destructive' });
          break;
        }
        default: break;
      }
    };

    runPipelineStep();

  }, [globalFsmStateFromContext, globalFsmVariables.activeTicker, contextStockSnapshotJson, contextStandardTasJson, contextAiAnalyzedTaJson, contextMarketStatusJson, contextOptionsChainJson, dispatchGlobalFsmEvent, toast, setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson, setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson, selectedExpirationDate, optionType, strikeCount]);


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

  const handleAppDataChatSubmit = (payload: { userInput?: string; promptName?: string }) => {
    if (isAppDataChatPending) return;
    const { userInput: rawUserInput, promptName } = payload;
    let finalUserInput = rawUserInput || '';
    let messageToHistory = finalUserInput;

    if (promptName) {
      const promptTemplate = appDataExamplePrompts.find(p => p.promptName === promptName)?.promptTemplate;
      if (promptTemplate) {
        finalUserInput = promptTemplate.replace(/\{TICKER\}/g, globalFsmVariables.activeTicker || 'the stock');
        messageToHistory = promptName;
      } else {
        toast({ variant: 'destructive', title: 'Error', description: `Could not find App Data prompt: ${promptName}` });
        return;
      }
    }

    addAppDataChatMessage({ role: 'user', content: messageToHistory });
    setAppDataChatUserInput('');
    startTransition(() => {
        submitAppDataChat({
          ticker: globalFsmVariables.activeTicker || '',
          stockSnapshotJson: contextStockSnapshotJson,
          aiKeyTakeawaysJson: contextKeyTakeawaysJson,
          aiAnalyzedTaJson: contextAiAnalyzedTaJson,
          aiOptionsAnalysisJson: contextOptionsAnalysisJson,
          chatHistory: contextAppDataChatHistory,
          userInput: finalUserInput,
          promptName: promptName,
        });
    });
  };

  const handleWebSearchChatSubmit = (payload: { userInput?: string; promptName?: string }) => {
    if (isWebSearchChatPending) return;
    const { userInput: rawUserInput, promptName } = payload;
    let finalUserInput = rawUserInput || '';
    let messageToHistory = finalUserInput;

    if (promptName) {
      const promptTemplate = webSearchExamplePrompts.find(p => p.promptName === promptName)?.promptTemplate;
      if (promptTemplate) {
        finalUserInput = promptTemplate.replace(/\{TICKER\}/g, globalFsmVariables.activeTicker || 'the stock');
        messageToHistory = promptName;
      } else {
        toast({ variant: 'destructive', title: 'Error', description: `Could not find Web Search prompt: ${promptName}` });
        return;
      }
    }
    
    addWebSearchChatMessage({ role: 'user', content: messageToHistory });
    setWebSearchUserInput('');
    startTransition(() => {
        submitWebSearchChat({
            ticker: globalFsmVariables.activeTicker || '',
            promptName: promptName,
            userInput: finalUserInput,
        });
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


  const handleFetchExpirations = async () => {
    const ticker = globalFsmVariables.userInputTicker.trim();
    if (!ticker) {
        toast({ variant: 'destructive', title: 'Invalid Ticker', description: 'Please enter a ticker symbol first.' });
        return;
    }
    setIsLoadingExpirations(true);
    setAvailableExpirationDates([]);
    setSelectedExpirationDate(undefined);

    const result = await getOptionsExpirationsAction({ ticker });

    if (result.status === 'success' && result.data) {
        const allDates = result.data.expirationDates;
        setAvailableExpirationDates(allDates);
        if (allDates.length > 0) {
            const nextExpDate = findNextAvailableDate(allDates);
            setSelectedExpirationDate(nextExpDate);
        }
        toast({ title: 'Success', description: `Found ${allDates.length} expiration dates.` });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to fetch expiration dates.' });
    }
    setIsLoadingExpirations(false);
  };
  
  const handleFetchSelectedOptionsChain = async () => {
    const ticker = globalFsmVariables.userInputTicker.trim();
    if (!ticker || !selectedExpirationDate) {
        toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please enter a ticker and select an expiration date.' });
        return;
    }
    setIsLoadingOnDemandOptions(true);
    setOptionsChainJson(pendingJson); // Set main display to pending
    
    const requestPayload = { ticker, expirationDate: selectedExpirationDate, optionType, strikeCount };
    setOnDemandOptionsChainRequestJson(JSON.stringify(requestPayload, null, 2));
    
    const result = await getOptionsChainForExpirationAction(requestPayload);

    if (result.status === 'success' && result.data) {
        setOptionsChainJson(result.data.optionsChainJson);
        toast({ title: 'Success', description: 'Options chain fetched.' });
    } else {
        const errorJson = `{ "status": "error", "message": "${result.error?.replace(/"/g, '\\"') || 'Failed to fetch options chain.'}" }`;
        setOptionsChainJson(errorJson);
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'An unknown error occurred.' });
    }
    setIsLoadingOnDemandOptions(false);
  };

  const analyzeButtonLoading = isPipelineInProgress;
  const isAnyChatPending = isAppDataChatPending || isWebSearchChatPending;
  const isOverallLoading = analyzeButtonLoading || isLoadingExpirations || isLoadingOnDemandOptions;
  
  const analyzeButtonDisabled = !globalFsmFlags.canAnalyzeStock || isOverallLoading || isAnyChatPending || !globalUserInputTicker.trim();

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Stock Analysis Input</CardTitle>
                <CardDescription>Enter a stock ticker to begin the analysis pipeline. Use the toggles to customize the AI-driven steps.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleAnalyzeStockSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                        <Label htmlFor="ticker">Stock Ticker</Label>
                        <Input id="ticker" value={globalUserInputTicker} onChange={handleTickerInputChange} placeholder="e.g., AAPL, MSFT" disabled={isOverallLoading}/>
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="dataSource">Data Source</Label>
                        <Select defaultValue="polygon" disabled><SelectTrigger id="dataSource" disabled={isOverallLoading}><SelectValue placeholder="Select data source" /></SelectTrigger><SelectContent><SelectItem value="polygon">Polygon.io</SelectItem></SelectContent></Select>
                        </div>
                    </div>
                     <div className="flex gap-2 pt-2">
                        <Button type="submit" className="w-auto" disabled={analyzeButtonDisabled}>
                            {analyzeButtonLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />} Analyze Stock (Full Pipeline)
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Options Chain Settings</CardTitle>
                <CardDescription>Fetch options data for a specific expiration date. This selection will also be used by the "Analyze Stock" pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                <div className="flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground">Step 1</Label>
                    <Button onClick={handleFetchExpirations} disabled={!globalUserInputTicker || isOverallLoading} className="w-full">
                        {isLoadingExpirations ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CalendarDays className="mr-2 h-4 w-4" />}
                        Fetch Expirations
                    </Button>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="on-demand-expiration">Step 2: Select Date</Label>
                    <Select value={selectedExpirationDate || ''} onValueChange={setSelectedExpirationDate} disabled={availableExpirationDates.length === 0 || isOverallLoading}>
                        <SelectTrigger id="on-demand-expiration"><SelectValue placeholder="Select a date"/></SelectTrigger>
                        <SelectContent>
                            {availableExpirationDates.map(date => <SelectItem key={date} value={date}>{date}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="on-demand-strike-count">Strike Count</Label>
                    <Select value={String(strikeCount)} onValueChange={(val) => setStrikeCount(Number(val) as typeof strikeCount)} disabled={isOverallLoading}>
                        <SelectTrigger id="on-demand-strike-count"><SelectValue placeholder="Strikes"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="40">40</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="on-demand-option-type">Option Type</Label>
                    <Select value={optionType} onValueChange={(val) => setOptionType(val as typeof optionType)} disabled={isOverallLoading}>
                        <SelectTrigger id="on-demand-option-type"><SelectValue placeholder="Type"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="both">Both</SelectItem>
                            <SelectItem value="calls">Calls</SelectItem>
                            <SelectItem value="puts">Puts</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="main-table-display">Table Display</Label>
                    <Select value={tableDisplayType} onValueChange={(val) => setTableDisplayType(val as typeof tableDisplayType)} disabled={isOverallLoading}>
                        <SelectTrigger id="main-table-display">
                            <SelectValue placeholder="Select display" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="side-by-side">Side-by-Side</SelectItem>
                            <SelectItem value="top-bottom">Top/Bottom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button onClick={handleFetchSelectedOptionsChain} disabled={!selectedExpirationDate || isOverallLoading} className="w-auto" variant="secondary">
                        {isLoadingOnDemandOptions ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                        Just Get Options
                    </Button>
                </div>
            </CardContent>
        </Card>
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
              onFormSubmit={handleAppDataChatSubmit}
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
              onFormSubmit={handleWebSearchChatSubmit}
            />
          </div>
          <Separator />
          <MarketStatusDisplay />
          <Separator />
          <DebugSnapshotControls appVersion={appVersion} />
        </div>
    </div>
  );
}
