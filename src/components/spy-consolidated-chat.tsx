'use client';

import React, { useState, useActionState, startTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  Trash2, 
  Search, 
  Database,
  FileText,
  CandlestickChart,
  SearchCode,
  Globe,
  Copy,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSpyAnalysis, useSpyDispatch, SPY_TICKER } from '@/contexts/spy-analysis-context';
import { spyConsolidatedChatAction } from '@/actions/spy-consolidated-chat-action';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { 
  SpyConsolidatedChatState, 
  SpyConsolidatedChatInput 
} from '@/ai/schemas/spy-consolidated-chat-schemas';

// UI Constants
const CHAT_HEIGHTS = {
  MIN: 'min-h-[400px]',
  MAX: 'max-h-[85vh]',
  MOBILE: 'h-[500px]',
  TABLET: 'sm:h-[600px]',
  DESKTOP: 'md:h-[650px]'
} as const;

const SCROLL_AREA_CONFIG = {
  MAX_HEIGHT: 'max-h-[calc(100%-180px)]', // Account for header, footer, and other elements
  MIN_HEIGHT: 'min-h-[200px]'
} as const;

const TEXTAREA_CONFIG = {
  MIN_HEIGHT: 'min-h-[80px]',
  MAX_HEIGHT: 'max-h-[200px]',
  DEFAULT_ROWS: 3
} as const;

// Chat message interface
interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  webSearchUsed?: boolean;
}

// Button prompt definitions
const appDataButtons = [
  { title: "Stock Trader's Takeaways", promptName: 'stock-trader-takeaways', icon: FileText, webSearchEnabled: false },
  { title: "Options Trader's Takeaways", promptName: 'options-trader-takeaways', icon: FileText, webSearchEnabled: false },
  { title: "Additional Holistic Takeaways", promptName: 'holistic-takeaways', icon: FileText, webSearchEnabled: false },
];

const webSearchButtons = [
  { title: "S/R Levels Search", promptName: 'support-resistance-web-search', icon: CandlestickChart, webSearchEnabled: true },
  { title: "Technical Analysis Search", promptName: 'technical-analysis-web-search', icon: SearchCode, webSearchEnabled: true },
  { title: "Options Flow Search", promptName: 'options-flow-web-search', icon: Search, webSearchEnabled: true },
];

export function SpyConsolidatedChat() {
  const spyState = useSpyAnalysis();
  const spyDispatch = useSpyDispatch();
  const { toast } = useToast();

  // Local state
  const [userInput, setUserInput] = useState('');
  const [webSearchMode, setWebSearchMode] = useState<'app-data' | 'web-search'>('app-data');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [currentRequestContext, setCurrentRequestContext] = useState<{
    promptName?: string;
    webSearchEnabled: boolean;
    isUserInput: boolean;
  } | null>(null);

  // Action state for unified chat
  const [chatState, submitChat, isChatPending] = useActionState<SpyConsolidatedChatState, SpyConsolidatedChatInput>(
    spyConsolidatedChatAction, 
    { status: 'idle' }
  );

  // Derived state
  const webSearchEnabled = webSearchMode === 'web-search';
  const hasStockData = spyState.hasStockData;
  const hasAnyData = hasStockData || spyState.hasAiTaData || spyState.hasAiKeyTakeaways || spyState.hasAiOptionsAnalysis;

  // Handle chat response success with race condition protection
  const handleChatSuccess = React.useCallback((data: any) => {
    if (!currentRequestId || !data) return;
    
    // Safe JSON parsing pattern
    const responseData = (() => {
      try {
        return JSON.parse(data.responseJson);
      } catch (e) {
        console.error('Failed to parse response JSON:', e);
        return { response: 'Error: Invalid response format', webSearchUsed: false };
      }
    })();
    
    const responseContent = responseData.response || 'No response received.';
    const webSearchUsed = responseData.webSearchUsed || false;
    
    // Store raw debug data if we have current request context
    if (currentRequestContext) {
      console.log('[SPY:Chat:Debug] Storing raw debug data:', {
        promptName: currentRequestContext.promptName,
        webSearchEnabled: currentRequestContext.webSearchEnabled,
        isUserInput: currentRequestContext.isUserInput,
        hasRawData: !!data.responseJson
      });
      
      spyDispatch({
        type: 'SET_AI_CHAT_RAW_DATA',
        payload: {
          promptName: currentRequestContext.promptName || 'user-input',
          responseJson: data.responseJson,
          webSearchEnabled: currentRequestContext.webSearchEnabled,
          isUserInput: currentRequestContext.isUserInput,
        }
      });
    }
      
    // Add model response to chat history
    setChatHistory(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'model',
      content: responseContent,
      timestamp: new Date(),
      webSearchUsed,
    }]);
    
    toast({ 
      title: 'Response Generated', 
      description: webSearchUsed ? 'Response with web search' : 'Response with app data',
    });
    
    // Clear current request context and ID when response is processed
    setCurrentRequestId(null);
    setCurrentRequestContext(null);
  }, [currentRequestId, currentRequestContext, spyDispatch, toast]);

  // Handle chat response error with race condition protection
  const handleChatError = React.useCallback((error: string, message?: string) => {
    if (!currentRequestId) return;
    
    setChatHistory(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'model',
      content: `Error: ${message || error}`,
      timestamp: new Date(),
    }]);
    
    toast({ 
      title: 'Chat Error', 
      description: message || error || 'An error occurred',
      variant: 'destructive',
    });
    
    // Clear current request context and ID when error is processed
    setCurrentRequestId(null);
    setCurrentRequestContext(null);
  }, [currentRequestId, toast]);

  // Simplified useEffect for chat status changes
  React.useEffect(() => {
    if (chatState.status === 'idle' || isChatPending || !currentRequestId) return;

    if (chatState.status === 'success' && chatState.data) {
      handleChatSuccess(chatState.data);
    } else if (chatState.status === 'error') {
      handleChatError(chatState.error || '', chatState.message || undefined);
    }
  }, [chatState.status, chatState.data, chatState.error, chatState.message, 
      isChatPending, currentRequestId, handleChatSuccess, handleChatError]);

  // Request timeout cleanup to prevent stuck states  
  React.useEffect(() => {
    if (!currentRequestId) return;
    
    const timeoutId = setTimeout(() => {
      console.warn('[SPY:Chat:Timeout] Request timeout, clearing request ID');
      setCurrentRequestId(null);
      setCurrentRequestContext(null);
      toast({
        title: 'Request Timeout',
        description: 'Request took too long, please try again.',
        variant: 'destructive'
      });
    }, 30000); // 30 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [currentRequestId, toast]);

  // Submit chat message
  const handleSubmitChat = (promptName?: string, customInput?: string, overrideWebSearchEnabled?: boolean) => {
    const effectiveWebSearchEnabled = overrideWebSearchEnabled !== undefined ? overrideWebSearchEnabled : webSearchEnabled;
    
    console.log('[SPY:Chat:Submit] Starting chat submission...', {
      promptName,
      hasCustomInput: !!customInput,
      webSearchMode,
      effectiveWebSearchEnabled,
      hasAnyData,
      isChatPending
    });
    
    if (isChatPending || currentRequestId) {
      console.log('[SPY:Chat:Submit] Blocked - chat already pending or request in progress');
      return;
    }
    
    // Generate and track request ID for race condition protection
    const requestId = crypto.randomUUID();
    setCurrentRequestId(requestId);
    
    // Set request context for debug data storage
    setCurrentRequestContext({
      promptName,
      webSearchEnabled: effectiveWebSearchEnabled,
      isUserInput: !promptName, // If no promptName, this is user input
    });

    const finalInput = customInput || userInput.trim();
    if (!finalInput) {
      console.log('[SPY:Chat:Submit] Blocked - empty input');
      toast({ 
        title: 'Invalid Input', 
        description: 'Please enter a message.',
        variant: 'destructive',
      });
      return;
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: promptName ? `[${promptName}] ${finalInput}` : finalInput,
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, userMessage]);
    console.log('[SPY:Chat:Submit] User message added to history');

    // Prepare chat input
    const chatInput: SpyConsolidatedChatInput = {
      ticker: SPY_TICKER,
      userInput: finalInput,
      promptName,
      webSearchEnabled: effectiveWebSearchEnabled,
      chatHistory: chatHistory,
      
      // Include app data context for non-web search prompts
      ...((!effectiveWebSearchEnabled && hasAnyData) && {
        stockSnapshotJson: spyState.stockSnapshotJson,
        aiKeyTakeawaysJson: spyState.aiKeyTakeawaysJson,
        aiAnalyzedTaJson: spyState.aiAnalyzedTaJson,
        aiOptionsAnalysisJson: spyState.aiOptionsAnalysisJson,
        marketStatusJson: spyState.marketStatusJson,
      }),
    };

    console.log('[SPY:Chat:Submit] Submitting to server action...', {
      effectiveWebSearchEnabled,
      hasAppData: !effectiveWebSearchEnabled && hasAnyData,
      historyLength: chatHistory.length
    });
    
    // Submit to action with proper transition
    startTransition(() => {
      submitChat(chatInput);
    });
    
    // Clear user input
    if (!customInput) {
      setUserInput('');
    }
  };

  // Handle button prompts
  const handleButtonPrompt = (button: typeof appDataButtons[0] | typeof webSearchButtons[0]) => {
    console.log('[SPY:Chat:ButtonPrompt] Button clicked:', {
      title: button.title,
      promptName: button.promptName,
      webSearchEnabled: button.webSearchEnabled,
      currentMode: webSearchMode,
      hasStockData,
      hasAnyData,
      isChatPending
    });
    
    if (isChatPending) {
      console.warn('[SPY:Chat:ButtonPrompt] Blocked - chat request already pending');
      return;
    }
    
    // Submit with button-specific web search setting (no mode switching needed)
    handleSubmitChat(button.promptName, button.title, button.webSearchEnabled);
  };

  // Clear chat history
  const handleClearChat = () => {
    console.log('[SPY:Chat:Clear] Clearing chat history...', { 
      previousMessageCount: chatHistory.length 
    });
    setChatHistory([]);
    toast({ title: 'Chat Cleared', description: 'Chat history has been cleared.' });
  };

  // Copy chat history to clipboard
  const handleCopyChat = async () => {
    try {
      const chatData = {
        ticker: SPY_TICKER,
        timestamp: new Date().toISOString(),
        chatHistory: chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          webSearchUsed: msg.webSearchUsed || false
        }))
      };
      
      await navigator.clipboard.writeText(JSON.stringify(chatData, null, 2));
      toast({ 
        title: 'Chat Copied', 
        description: 'Chat history copied to clipboard as JSON.' 
      });
    } catch (error) {
      console.error('Failed to copy chat history:', error);
      toast({ 
        title: 'Copy Failed', 
        description: 'Failed to copy chat history to clipboard.',
        variant: 'destructive' 
      });
    }
  };

  // Export chat history as JSON file
  const handleExportChat = () => {
    try {
      const chatData = {
        ticker: SPY_TICKER,
        timestamp: new Date().toISOString(),
        chatHistory: chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          webSearchUsed: msg.webSearchUsed || false
        }))
      };

      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${SPY_TICKER}_chat_history_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ 
        title: 'Chat Exported', 
        description: 'Chat history exported as JSON file.' 
      });
    } catch (error) {
      console.error('Failed to export chat history:', error);
      toast({ 
        title: 'Export Failed', 
        description: 'Failed to export chat history.',
        variant: 'destructive' 
      });
    }
  };

  return (
    <Card className={`${CHAT_HEIGHTS.MIN} ${CHAT_HEIGHTS.MAX} ${CHAT_HEIGHTS.MOBILE} ${CHAT_HEIGHTS.TABLET} ${CHAT_HEIGHTS.DESKTOP} flex flex-col`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {SPY_TICKER} Consolidated AI Chat
            </CardTitle>
            <CardDescription>
              Unified chat interface with app data analysis and web search capabilities
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyChat}
              disabled={isChatPending || chatHistory.length === 0}
              title="Copy chat history as JSON"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportChat}
              disabled={isChatPending || chatHistory.length === 0}
              title="Export chat history as JSON file"
            >
              <Download className="h-4 w-4 mr-1" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              disabled={isChatPending || chatHistory.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Example Prompts */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Prompts</Label>
          
          {/* App Data Prompts */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">App Data Analysis</div>
            <div className="flex flex-wrap gap-2">
              {appDataButtons.map((button) => {
                const Icon = button.icon;
                const disabled = isChatPending || (!hasAnyData && !webSearchEnabled);
                
                return (
                  <Button
                    key={button.promptName}
                    variant="outline"
                    size="sm"
                    onClick={() => handleButtonPrompt(button)}
                    disabled={disabled}
                    className="text-xs"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {button.title}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Web Search Prompts */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">Web Search Analysis</div>
            <div className="flex flex-wrap gap-2">
              {webSearchButtons.map((button) => {
                const Icon = button.icon;
                
                return (
                  <Button
                    key={button.promptName}
                    variant="outline"
                    size="sm"
                    onClick={() => handleButtonPrompt(button)}
                    disabled={isChatPending}
                    className="text-xs"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {button.title}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <Separator />

        {/* Web Search Mode Toggle - Positioned near input for better UX */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Chat Mode</Label>
          <RadioGroup
            value={webSearchMode}
            onValueChange={(value) => setWebSearchMode(value as 'app-data' | 'web-search')}
            className="flex flex-wrap space-x-6"
            disabled={isChatPending}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="app-data" id="app-data" />
              <Label htmlFor="app-data" className="flex items-center gap-2 cursor-pointer">
                <Database className="h-4 w-4" />
                App Data Only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="web-search" id="web-search" />
              <Label htmlFor="web-search" className="flex items-center gap-2 cursor-pointer">
                <Globe className="h-4 w-4" />
                Web Search Enabled
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Chat Messages */}
        <ScrollArea className={`flex-1 space-y-4 ${SCROLL_AREA_CONFIG.MAX_HEIGHT} ${SCROLL_AREA_CONFIG.MIN_HEIGHT} overflow-y-auto overflow-x-hidden`}>
          <div className="space-y-4 pr-4 overflow-hidden">
            {chatHistory.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Start a conversation by typing below or using the quick prompts above.
                {!hasAnyData && webSearchMode === 'app-data' && (
                  <div className="mt-2 text-xs">
                    <strong>Note:</strong> Load {SPY_TICKER} data first for app data analysis.
                  </div>
                )}
              </div>
            ) : (
              chatHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} overflow-hidden w-full`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[85%] md:max-w-[80%] rounded-lg px-3 py-2 text-sm overflow-hidden ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      className="prose dark:prose-invert prose-sm max-w-none overflow-hidden whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word"
                      components={{
                        // Ensure code blocks don't overflow
                        code: ({node, ...props}) => {
                          const {children, className, ...rest} = props;
                          const isInline = !className || !className.includes('language-');
                          return (
                            <code 
                              {...rest} 
                              className={`${className || ''} ${isInline ? "break-words overflow-hidden" : "block whitespace-pre-wrap break-words overflow-x-hidden overflow-y-hidden"}`}
                            >
                              {children}
                            </code>
                          );
                        },
                        // Ensure pre blocks don't overflow
                        pre: ({node, ...props}) => (
                          <pre {...props} className="whitespace-pre-wrap break-words overflow-x-hidden overflow-y-hidden max-w-full" />
                        ),
                        // Ensure all block elements respect container boundaries
                        p: ({node, ...props}) => (
                          <p {...props} className="break-words overflow-wrap-anywhere word-break-break-word overflow-hidden" />
                        ),
                        div: ({node, ...props}) => (
                          <div {...props} className="break-words overflow-wrap-anywhere word-break-break-word overflow-hidden" />
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.webSearchUsed && (
                      <div className="text-xs mt-1 opacity-70 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Web search used
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={webSearchEnabled ? 'Ask anything with web search... (Shift+Enter for new line)' : 'Ask about SPY data... (Shift+Enter for new line)'}
            disabled={isChatPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitChat();
              }
            }}
            className={`flex-1 ${TEXTAREA_CONFIG.MIN_HEIGHT} ${TEXTAREA_CONFIG.MAX_HEIGHT} resize-none`}
            rows={TEXTAREA_CONFIG.DEFAULT_ROWS}
          />
          <Button
            onClick={() => handleSubmitChat()}
            disabled={isChatPending || !userInput.trim()}
            size="sm"
          >
            {isChatPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Status Indicator */}
        {isChatPending && (
          <div className="text-xs text-muted-foreground text-center">
            Generating response with {webSearchEnabled ? 'web search' : 'app data'}...
          </div>
        )}
      </CardContent>
    </Card>
  );
}