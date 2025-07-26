'use client';

import React, { useState, type FormEvent, useCallback, useRef, useEffect, startTransition } from "react";
import { useActionState } from "react";
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
import { Chatbot, type ExamplePromptButton } from "@/components/chatbot";
import { DebugSnapshotControls } from "@/components/debug-snapshot-controls";

// Business Logic Context (for all application data)
import { useStockAnalysis, BusinessFsmState } from "@/contexts/business-logic-context";

import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, Search, SearchCode, FileText, CandlestickChart, CalendarDays } from "lucide-react";
import { loadExamplePrompts, type ExamplePrompt } from '@/ai/definition-loader';
import { findNextAvailableDate } from '@/lib/date-utils';

// Server Actions (for on-demand calls only)
import { performAiAnalysisAction } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction } from '@/actions/perform-ai-options-analysis-action';
import { appDataChatAction, type AppDataChatActionState } from '@/actions/app-data-chat-action';
import { sdkWebSearchChatAction } from '@/actions/sdk-web-search-chat-action';
import type { AppDataChatInput } from '@/ai/flows/app-data-chat-flow';
import type { SdkWebSearchChatActionState, SdkWebSearchChatActionInputs } from '@/ai/schemas/sdk-web-search-chat-schemas';
import { getExpirationDates } from "@/services/data-sources/adapters/polygon-adapter";

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

interface MainTabContentUIProps {
  appVersion: string;
}

/**
 * MainTabContentUI - UI component using business context directly
 * 
 * SIMPLIFIED ARCHITECTURE (v4.0.0.3):
 * - Uses business context for all application data
 * - Standard React best practices
 * - No complex UI state layer
 * - Direct business context consumption
 */
export function MainTabContentUI({ appVersion }: MainTabContentUIProps) {
  const { toast } = useToast();
  
  // Business Context - for all application data
  const business = useStockAnalysis();
  
  // Destructure commonly used business context values
  const {
    // FSM state and control
    fsmState, fsmFlags, fsmVariables, dispatchFsmEvent: dispatchGlobalFsmEvent,
    
    // Chat data and actions
    appDataChatHistory: contextAppDataChatHistory, addAppDataChatMessage, clearAppDataChatHistory,
    setUserInputAppDataChatRequestJson, setUserInputAppDataChatResponseJson,
    setStockTraderTakeawaysRequestJson, setStockTraderTakeawaysResponseJson,
    setOptionsTraderTakeawaysRequestJson, setOptionsTraderTakeawaysResponseJson,
    setHolisticTakeawaysRequestJson, setHolisticTakeawaysResponseJson,
    
    webSearchChatHistory: contextWebSearchChatHistory, addWebSearchChatMessage, clearWebSearchChatHistory,
    setUserInputWebSearchChatRequestJson, setUserInputWebSearchChatResponseJson,
    setRawTaWebSearchRequestJson, setRawTaWebSearchResponseJson,
    setRawOptionsWebSearchRequestJson, setRawOptionsWebSearchResponseJson,
    setRawSupportResistanceWebSearchRequestJson, setRawSupportResistanceWebSearchResponseJson,
    
    // AI Analysis setters (for on-demand calls)
    setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
    setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson,
    
    // Options business state
    availableExpirationDates, setAvailableExpirationDates,
    selectedExpirationDate, setSelectedExpirationDate,
    isLoadingExpirations, setIsLoadingExpirations,
    
    // JSON data
    stockSnapshotJson, marketStatusJson, standardTasJson, aiAnalyzedTaJson,
    aiKeyTakeawaysJson, aiOptionsAnalysisJson, optionsChainJson,
  } = business;

  // Local UI state
  const [appDataChatUserInput, setAppDataChatUserInput] = useState('');
  const [webSearchUserInput, setWebSearchUserInput] = useState('');
  const [appDataExamplePrompts, setAppDataExamplePrompts] = useState<ExamplePrompt[]>([]);
  const [webSearchExamplePrompts, setWebSearchExamplePrompts] = useState<ExamplePrompt[]>([]);

  // Chat action states
  const [appDataChatState, submitAppDataChat, isAppDataChatPending] = useActionState<AppDataChatActionState, AppDataChatInput>(appDataChatAction, { status: 'idle' });
  const [webSearchChatState, submitWebSearchChat, isWebSearchChatPending] = useActionState<SdkWebSearchChatActionState, SdkWebSearchChatActionInputs>(sdkWebSearchChatAction, { status: 'idle' });
  
  const initialInitializationDispatchedRef = useRef(false);

  // Load example prompts
  useEffect(() => {
    loadExamplePrompts('example-chat-prompts.json').then(setAppDataExamplePrompts).catch(err => {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load app data example prompts.' });
    });
    loadExamplePrompts('example-web-search-prompts.json').then(setWebSearchExamplePrompts).catch(err => {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load web search example prompts.' });
    });
  }, [toast]);

  // Initialize the business FSM
  useEffect(() => {
    if (!initialInitializationDispatchedRef.current) {
      dispatchGlobalFsmEvent({ type: 'INITIALIZATION_COMPLETE' });
      initialInitializationDispatchedRef.current = true;
    }
  }, [dispatchGlobalFsmEvent]);

  // Handle App Data Chat results
  useEffect(() => {
    if (appDataChatState.status === 'idle' || isAppDataChatPending) return;
    const { data, error, message, status } = appDataChatState;
    const requestJson = data?.chatbotRequestJson || '{}';
    const responseJson = data?.chatbotResponseJson || '{}';
    const promptName = JSON.parse(requestJson)?.promptName;
    
    switch (promptName) {
      case 'stock-trader-takeaways': 
        setStockTraderTakeawaysRequestJson(requestJson); 
        setStockTraderTakeawaysResponseJson(responseJson); 
        break;
      case 'options-trader-takeaways': 
        setOptionsTraderTakeawaysRequestJson(requestJson); 
        setOptionsTraderTakeawaysResponseJson(responseJson); 
        break;
      case 'holistic-takeaways': 
        setHolisticTakeawaysRequestJson(requestJson); 
        setHolisticTakeawaysResponseJson(responseJson); 
        break;
      default: 
        setUserInputAppDataChatRequestJson(requestJson); 
        setUserInputAppDataChatResponseJson(responseJson); 
        break;
    }
    
    if (status === 'success') {
      const response = JSON.parse(responseJson)?.response;
      addAppDataChatMessage({ id: crypto.randomUUID(), role: 'model', content: response || 'No response text found.' });
    } else if (status === 'error') {
      addAppDataChatMessage({ id: crypto.randomUUID(), role: 'model', content: `Error: ${message || error}` });
    }
  }, [appDataChatState, isAppDataChatPending, setStockTraderTakeawaysRequestJson, setStockTraderTakeawaysResponseJson, 
      setOptionsTraderTakeawaysRequestJson, setOptionsTraderTakeawaysResponseJson, setHolisticTakeawaysRequestJson, 
      setHolisticTakeawaysResponseJson, setUserInputAppDataChatRequestJson, setUserInputAppDataChatResponseJson, addAppDataChatMessage]);

  // Handle Web Search Chat results
  useEffect(() => {
    if (webSearchChatState.status === 'idle' || isWebSearchChatPending) return;
    const { data, error, message, status } = webSearchChatState;
    const requestJson = data?.requestJson || '{}';
    const responseJson = data?.responseJson || '{}';
    const promptName = JSON.parse(requestJson)?.promptName;

    switch (promptName) {
      case 'support-resistance-web-search': 
        setRawSupportResistanceWebSearchRequestJson(requestJson); 
        setRawSupportResistanceWebSearchResponseJson(responseJson); 
        break;
      case 'technical-analysis-web-search': 
        setRawTaWebSearchRequestJson(requestJson); 
        setRawTaWebSearchResponseJson(responseJson); 
        break;
      case 'options-flow-web-search': 
        setRawOptionsWebSearchRequestJson(requestJson); 
        setRawOptionsWebSearchResponseJson(responseJson); 
        break;
      default: 
        setUserInputWebSearchChatRequestJson(requestJson); 
        setUserInputWebSearchChatResponseJson(responseJson); 
        break;
    }

    if (status === 'success') {
      const response = JSON.parse(responseJson)?.response;
      addWebSearchChatMessage({ id: crypto.randomUUID(), role: 'model', content: response || 'No response text found.' });
    } else if (status === 'error') {
      addWebSearchChatMessage({ id: crypto.randomUUID(), role: 'model', content: `Error: ${message || error}` });
    }
  }, [webSearchChatState, isWebSearchChatPending, setRawSupportResistanceWebSearchRequestJson, 
      setRawSupportResistanceWebSearchResponseJson, setRawTaWebSearchRequestJson, setRawTaWebSearchResponseJson, 
      setRawOptionsWebSearchRequestJson, setRawOptionsWebSearchResponseJson, setUserInputWebSearchChatRequestJson, 
      setUserInputWebSearchChatResponseJson, addWebSearchChatMessage]);

  // Derive loading and error states from business context
  const loadingStates = {
    isAnalyzing: [
      BusinessFsmState.DATA_FETCH_IN_PROGRESS,
      BusinessFsmState.CALCULATING_AI_TA,
    ].includes(fsmState),
    isFetchingData: fsmState === BusinessFsmState.DATA_FETCH_IN_PROGRESS,
    isCalculatingTA: fsmState === BusinessFsmState.CALCULATING_AI_TA,
    currentStep: fsmState,
    progress: (() => {
      switch (fsmState) {
        case BusinessFsmState.DATA_FETCH_IN_PROGRESS: return 50;
        case BusinessFsmState.CALCULATING_AI_TA: return 75;
        case BusinessFsmState.IDLE: return fsmFlags.isSnapshotDataReady ? 100 : 0;
        default: return 0;
      }
    })()
  };
  
  const errorState = {
    hasError: !!fsmVariables.lastError,
    message: fsmVariables.lastError?.message || null,
    source: fsmVariables.lastError?.source || null,
    canRetry: [BusinessFsmState.IDLE, BusinessFsmState.VALID_TICKER_ENTERED].includes(fsmState),
  };

  // User interaction handlers
  const handleTickerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTicker = e.target.value.toUpperCase();
    dispatchGlobalFsmEvent({ type: 'USER_INPUT_TICKER_CHANGED', payload: { ticker: newTicker } });
  };
  
  const handleAnalyzeStockSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const ticker = fsmVariables.userInputTicker.trim();
    if (!ticker) {
      toast({ title: "Invalid Ticker", description: "Please enter a stock ticker.", variant: "destructive" });
      return;
    }
    dispatchGlobalFsmEvent({ type: 'START_BASIC_ANALYSIS', payload: { ticker } });
  };


  // On-demand analysis handlers
  const handleOnDemandKeyTakeaways = async () => {
    const logPrefix = 'MainTabContentUI:OnDemandKeyTakeaways';
    
    try {
      const result = await performAiAnalysisAction({
        ticker: fsmVariables.activeTicker!, 
        stockSnapshotJson: stockSnapshotJson, 
        standardTasJson: standardTasJson, 
        aiAnalyzedTaJson: aiAnalyzedTaJson, 
        marketStatusJson: marketStatusJson
      });
      
      if (result.status === 'success' && result.data) {
        setAiKeyTakeawaysRequestJson(result.data.aiKeyTakeawaysRequestJson);
        setAiKeyTakeawaysJson(result.data.aiKeyTakeawaysJson);
        toast({ title: "Success", description: "AI Key Takeaways generated successfully" });
      } else {
        toast({ title: "Error", description: result.message || "Failed to generate AI Key Takeaways", variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: 'destructive' });
    }
  };

  const handleOnDemandOptionsAnalysis = async () => {
    const logPrefix = 'MainTabContentUI:OnDemandOptionsAnalysis';
    
    try {
      const result = await performAiOptionsAnalysisAction({
        ticker: fsmVariables.activeTicker!, 
        stockSnapshotJson: stockSnapshotJson, 
        optionsChainJson: optionsChainJson,
      });
      
      if (result.status === 'success' && result.data) {
        setAiOptionsAnalysisRequestJson(result.data.aiOptionsAnalysisRequestJson);
        setAiOptionsAnalysisJson(result.data.aiOptionsAnalysisJson);
        toast({ title: "Success", description: "AI Options Analysis generated successfully" });
      } else {
        toast({ title: "Error", description: result.message || "Failed to generate AI Options Analysis", variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: 'destructive' });
    }
  };

  // Chat submit handlers
  const handleAppDataChatSubmit = (payload: { userInput?: string; promptName?: string }) => {
    if (isAppDataChatPending) return;
    const { userInput: rawUserInput, promptName } = payload;
    let finalUserInput = rawUserInput || '';
    let messageToHistory = finalUserInput;

    if (promptName) {
      const promptTemplate = appDataExamplePrompts.find(p => p.promptName === promptName)?.promptTemplate;
      if (promptTemplate) {
        finalUserInput = promptTemplate.replace(/\{TICKER\}/g, fsmVariables.activeTicker || 'the stock');
        messageToHistory = promptName;
      } else {
        toast({ variant: 'destructive', title: 'Error', description: `Could not find App Data prompt: ${promptName}` });
        return;
      }
    }

    addAppDataChatMessage({ id: crypto.randomUUID(), role: 'user', content: messageToHistory });
    setAppDataChatUserInput('');
    startTransition(() => {
      submitAppDataChat({
        ticker: fsmVariables.activeTicker || '',
        stockSnapshotJson: stockSnapshotJson,
        aiKeyTakeawaysJson: aiKeyTakeawaysJson,
        aiAnalyzedTaJson: aiAnalyzedTaJson,
        aiOptionsAnalysisJson: aiOptionsAnalysisJson,
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
        finalUserInput = promptTemplate.replace(/\{TICKER\}/g, fsmVariables.activeTicker || 'the stock');
        messageToHistory = promptName;
      } else {
        toast({ variant: 'destructive', title: 'Error', description: `Could not find Web Search prompt: ${promptName}` });
        return;
      }
    }
    
    addWebSearchChatMessage({ id: crypto.randomUUID(), role: 'user', content: messageToHistory });
    setWebSearchUserInput('');
    startTransition(() => {
      submitWebSearchChat({
        ticker: fsmVariables.activeTicker || '',
        promptName: promptName,
        userInput: finalUserInput,
      });
    });
  };

  const handleFetchExpirations = async () => {
    const ticker = fsmVariables.userInputTicker.trim();
    if (!ticker) {
      toast({ variant: 'destructive', title: 'Invalid Ticker', description: 'Please enter a ticker symbol first.' });
      return;
    }
    setIsLoadingExpirations(true);
    try {
      const expirationDates = await getExpirationDates(ticker);
      setAvailableExpirationDates(expirationDates);
      if (expirationDates.length > 0) {
        const nextExpDate = findNextAvailableDate(expirationDates);
        setSelectedExpirationDate(nextExpDate);
      }
      toast({ title: 'Success', description: `Found ${expirationDates.length} expiration dates.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to fetch expiration dates.' });
    }
    setIsLoadingExpirations(false);
  };

  // Computed states from business context
  const isAnyChatPending = isAppDataChatPending || isWebSearchChatPending;
  const isOverallLoading = loadingStates.isAnalyzing || isLoadingExpirations;
  const analyzeButtonDisabled = !fsmFlags.canAnalyzeStock || isOverallLoading || isAnyChatPending || 
                                !fsmVariables.userInputTicker.trim() || !selectedExpirationDate;

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
                <Input 
                  id="ticker" 
                  value={fsmVariables.userInputTicker} 
                  onChange={handleTickerInputChange} 
                  placeholder="e.g., AAPL, MSFT" 
                  disabled={isOverallLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataSource">Data Source</Label>
                <Select defaultValue="polygon" disabled>
                  <SelectTrigger id="dataSource" disabled={isOverallLoading}>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polygon">Polygon.io</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="w-auto" disabled={analyzeButtonDisabled}>
                {loadingStates.isAnalyzing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Analyze Stock (Basic + AI TA)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Show loading state */}
      {loadingStates.isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {loadingStates.currentStep} - Progress: {loadingStates.progress}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Show error state */}
      {errorState.hasError && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-destructive">
              <strong>Error:</strong> {errorState.message}
              {errorState.canRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => handleAnalyzeStockSubmit()}
                >
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Options Chain Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Options Chain Settings</CardTitle>
          <CardDescription>Fetch options data for a specific expiration date. This selection will also be used by the "Analyze Stock" pipeline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Step 1</Label>
              <Button onClick={handleFetchExpirations} disabled={!fsmVariables.userInputTicker || isOverallLoading} className="w-full">
                {isLoadingExpirations ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                ) : (
                  <CalendarDays className="mr-2 h-4 w-4" />
                )}
                Fetch Expirations
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="on-demand-expiration">Step 2: Select Date</Label>
              <Select value={selectedExpirationDate || ''} onValueChange={setSelectedExpirationDate} disabled={availableExpirationDates.length === 0 || isOverallLoading}>
                <SelectTrigger id="on-demand-expiration">
                  <SelectValue placeholder="Select a date"/>
                </SelectTrigger>
                <SelectContent>
                  {availableExpirationDates.map(date => <SelectItem key={date} value={date}>{date}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="on-demand-strike-count">Strike Count</Label>
              <Select value={String(business.strikeCount)} onValueChange={(val) => business.setStrikeCount(Number(val) as any)} disabled={isOverallLoading}>
                <SelectTrigger id="on-demand-strike-count">
                  <SelectValue placeholder="Strikes"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="40">40</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="on-demand-option-type">Option Type</Label>
              <Select value={business.optionType} onValueChange={(val) => business.setOptionType(val as any)} disabled={isOverallLoading}>
                <SelectTrigger id="on-demand-option-type">
                  <SelectValue placeholder="Type"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="calls">Calls</SelectItem>
                  <SelectItem value="puts">Puts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="main-table-display">Table Display</Label>
              <Select value={business.tableDisplayType} onValueChange={(val) => business.setTableDisplayType(val as any)} disabled={isOverallLoading}>
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
        </CardContent>
      </Card>
      
      <Separator />
      
      {/* On-Demand AI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis (On-Demand)</CardTitle>
          <CardDescription>Generate AI analysis manually after running the basic stock analysis pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleOnDemandKeyTakeaways}
              disabled={!fsmVariables.activeTicker || !fsmFlags.isSnapshotDataReady || 
                       !fsmFlags.isStandardTADataReady || !fsmFlags.isCalculatedTADataReady ||
                       !fsmFlags.isMarketDataReady || loadingStates.isAnalyzing || isAnyChatPending}
              variant="outline"
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate AI Key Takeaways
            </Button>
            <Button 
              onClick={handleOnDemandOptionsAnalysis}
              disabled={!fsmVariables.activeTicker || !fsmFlags.isOptionsChainDataReady || 
                       loadingStates.isAnalyzing || isAnyChatPending}
              variant="outline"
              className="flex-1"
            >
              <CandlestickChart className="mr-2 h-4 w-4" />
              Generate AI Options Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Separator />
      
      {/* Data Display Components */}
      <div className="space-y-6">
        <KeyMetricsDisplay />
        <StockSnapshotDetailsDisplay />
        <StandardTaDisplay />
        <AiAnalyzedTaDisplay />
        <AiKeyTakeawaysDisplay />
        <OptionsChainTable />
        <AiOptionsAnalysisDisplay />
        
        {/* Chat Components */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Chatbot
            title="App Data AI Chat"
            description={`Analyzes loaded app data for ${fsmVariables.activeTicker || "the stock"}. Cannot access web.`}
            chatHistory={contextAppDataChatHistory}
            clearChatHistory={clearAppDataChatHistory}
            isProcessing={isAppDataChatPending}
            exampleButtons={appDataButtons}
            currentTickerForDisplay={fsmVariables.activeTicker || fsmVariables.userInputTicker}
            userInput={appDataChatUserInput}
            setUserInput={setAppDataChatUserInput}
            onFormSubmit={handleAppDataChatSubmit}
          />
          <Chatbot
            title="Web Search AI Chat"
            description="Ask AI anything with Google Search Support..."
            chatHistory={contextWebSearchChatHistory}
            clearChatHistory={clearWebSearchChatHistory}
            isProcessing={isWebSearchChatPending}
            exampleButtons={webSearchButtons}
            currentTickerForDisplay={fsmVariables.activeTicker || fsmVariables.userInputTicker}
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