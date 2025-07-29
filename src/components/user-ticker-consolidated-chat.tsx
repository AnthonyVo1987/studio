'use client';

/**
 * @fileOverview User Ticker Consolidated Chat - Dynamic Ticker Component
 * 
 * This component is ticker-agnostic and works with any ticker symbol from
 * the user-ticker-analysis-context. It provides a unified AI chat interface
 * with both app data and web search capabilities for the currently selected ticker.
 * 
 * ARCHITECTURE PATTERN:
 * - Direct context consumption via useUserTickerAnalysis hook
 * - Safe JSON parsing with error handling
 * - Loading state derivation from FSM and data flags
 * - Dynamic ticker display with proper fallback handling
 * - Consistent error handling for cases with no ticker set
 * - Race condition protection with request ID tracking
 */

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
import { useUserTickerAnalysis, useUserTickerDispatch } from '@/contexts/user-ticker-analysis-context';
import { userTickerConsolidatedChatAction } from '@/actions/user-ticker-consolidated-chat-action';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { 
  UserTickerConsolidatedChatState, 
  UserTickerConsolidatedChatInput 
} from '@/ai/schemas/user-ticker-consolidated-chat-schemas';

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

export function UserTickerConsolidatedChat() {
  const userTickerState = useUserTickerAnalysis();
  const userTickerDispatch = useUserTickerDispatch();
  const { toast } = useToast();

  // Get current ticker for display
  const currentTicker = userTickerState.currentTicker || '';
  const displayTicker = currentTicker || 'No Ticker Selected';

  // Local state
  const [userInput, setUserInput] = useState('');
  const [webSearchMode, setWebSearchMode] = useState<'app-data' | 'web-search'>('app-data');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [currentRequestContext, setCurrentRequestContext] = useState<{
    promptName?: string;
    webSearchEnabled: boolean;
    isUserInput: boolean;
    userInputText?: string;
  } | null>(null);

  // Action state for unified chat
  const [chatState, submitChat, isChatPending] = useActionState<UserTickerConsolidatedChatState, UserTickerConsolidatedChatInput>(
    userTickerConsolidatedChatAction, 
    { status: 'idle' }
  );

  // Derived state
  const webSearchEnabled = webSearchMode === 'web-search';
  const hasValidTicker = currentTicker && userTickerState.isTickerValid;

  // Process chat response
  React.useEffect(() => {
    if (chatState.status === 'success' && chatState.data && currentRequestContext) {
      try {
        const responseData = JSON.parse(chatState.data.responseJson);
        const response = responseData.response || 'No response received';

        // Add to chat history
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: currentRequestContext.promptName && !currentRequestContext.isUserInput
            ? `[${currentRequestContext.promptName}] ${currentRequestContext.userInputText || ''}`
            : currentRequestContext.userInputText || userInput,
          timestamp: new Date(),
          webSearchUsed: currentRequestContext.webSearchEnabled
        };

        const modelMessage: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: response,
          timestamp: new Date(),
          webSearchUsed: responseData.webSearchUsed || false
        };

        setChatHistory(prev => [...prev, userMessage, modelMessage]);

        // Store raw response in context for debug purposes
        userTickerDispatch({
          type: 'SET_AI_CHAT_RAW_DATA',
          payload: {
            promptName: currentRequestContext.promptName || 'user-input',
            responseJson: chatState.data.responseJson,
            webSearchEnabled: currentRequestContext.webSearchEnabled,
            isUserInput: currentRequestContext.isUserInput
          }
        });

        // Clear user input if it was a user message
        if (currentRequestContext.isUserInput) {
          setUserInput('');
        }

        toast({
          title: 'Response Received',
          description: `${displayTicker} AI analysis completed successfully.`,
        });
      } catch (error) {
        console.error('Error processing chat response:', error);
        toast({
          title: 'Processing Error',
          description: 'Failed to process AI response.',
          variant: 'destructive',
        });
      } finally {
        setCurrentRequestId(null);
        setCurrentRequestContext(null);
      }
    } else if (chatState.status === 'error') {
      toast({
        title: 'Chat Error',
        description: chatState.error || 'An error occurred during chat processing.',
        variant: 'destructive',
      });
      setCurrentRequestId(null);
      setCurrentRequestContext(null);
    }
  }, [chatState, currentRequestContext, userInput, userTickerDispatch, toast, displayTicker]);

  // Generic chat handler
  const handleChatSubmission = (promptName: string, userInputText: string, webSearchEnabled: boolean, isUserInput: boolean) => {
    if (!hasValidTicker) {
      toast({
        title: 'No Valid Ticker',
        description: 'Please select a valid ticker symbol before using AI chat.',
        variant: 'destructive',
      });
      return;
    }

    // Prevent concurrent requests
    if (currentRequestId) {
      toast({
        title: 'Request in Progress',
        description: 'Please wait for the current request to complete.',
        variant: 'destructive',
      });
      return;
    }

    const requestId = `${Date.now()}-${Math.random()}`;
    setCurrentRequestId(requestId);
    setCurrentRequestContext({
      promptName,
      webSearchEnabled,
      isUserInput,
      userInputText // Store the actual input text for later use
    });

    startTransition(() => {
      submitChat({
        ticker: currentTicker,
        userInput: userInputText,
        promptName,
        webSearchEnabled,
        stockSnapshotJson: userTickerState.stockSnapshotJson,
        aiKeyTakeawaysJson: userTickerState.aiKeyTakeawaysJson,
        aiAnalyzedTaJson: userTickerState.aiAnalyzedTaJson,
        aiOptionsAnalysisJson: userTickerState.aiOptionsAnalysisJson,
        marketStatusJson: userTickerState.marketStatusJson,
        chatHistory: chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          id: msg.id
        }))
      });
    });
  };

  // User input submission
  const handleUserInputSubmit = () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput) {
      toast({
        title: 'Input Required',
        description: 'Please enter a message before sending.',
        variant: 'destructive',
      });
      return;
    }

    handleChatSubmission('user-input', trimmedInput, webSearchEnabled, true);
  };

  // Button prompt submission
  const handleButtonPromptSubmit = (button: typeof appDataButtons[0] | typeof webSearchButtons[0]) => {
    handleChatSubmission(button.promptName, button.title, button.webSearchEnabled, false);
  };

  // Clear chat history
  const handleClearChat = () => {
    setChatHistory([]);
    toast({
      title: 'Chat Cleared',
      description: `${displayTicker} chat history has been cleared.`,
    });
  };

  // Copy chat history
  const handleCopyChat = async () => {
    if (chatHistory.length === 0) {
      toast({
        title: 'No Chat History',
        description: 'No chat messages to copy.',
        variant: 'destructive',
      });
      return;
    }

    const chatText = chatHistory.map(msg => 
      `**${msg.role === 'user' ? 'User' : 'AI'}** (${msg.timestamp.toLocaleString()}):\n${msg.content}\n\n`
    ).join('');

    try {
      await navigator.clipboard.writeText(chatText);
      toast({
        title: 'Chat Copied',
        description: `${displayTicker} chat history copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy chat history.',
        variant: 'destructive',
      });
    }
  };

  // Export chat history
  const handleExportChat = () => {
    if (chatHistory.length === 0) {
      toast({
        title: 'No Chat History',
        description: 'No chat messages to export.',
        variant: 'destructive',
      });
      return;
    }

    const chatData = {
      ticker: currentTicker,
      timestamp: new Date().toISOString(),
      messages: chatHistory
    };

    const chatText = JSON.stringify(chatData, null, 2);
    const filename = `${currentTicker || 'unknown'}-chat-history-${new Date().toISOString().split('T')[0]}.json`;
    
    const blob = new Blob([chatText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Chat Exported',
      description: `${displayTicker} chat history exported as ${filename}.`,
    });
  };

  return (
    <Card className={`${CHAT_HEIGHTS.MIN} ${CHAT_HEIGHTS.MAX} ${CHAT_HEIGHTS.MOBILE} ${CHAT_HEIGHTS.TABLET} ${CHAT_HEIGHTS.DESKTOP}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {displayTicker} AI Chat
        </CardTitle>
        <CardDescription>
          {hasValidTicker 
            ? `Unified AI chat with app data and web search capabilities for ${currentTicker}`
            : "Select a valid ticker symbol to use AI chat"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Mode Toggle */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Chat Mode</Label>
          <RadioGroup
            value={webSearchMode}
            onValueChange={(value) => setWebSearchMode(value as 'app-data' | 'web-search')}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="app-data" id="app-data" disabled={!hasValidTicker} />
              <Label htmlFor="app-data" className="flex items-center gap-2 cursor-pointer">
                <Database className="h-4 w-4" />
                App Data Analysis
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="web-search" id="web-search" disabled={!hasValidTicker} />
              <Label htmlFor="web-search" className="flex items-center gap-2 cursor-pointer">
                <Globe className="h-4 w-4" />
                Web Search Analysis
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Quick Action Buttons */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {webSearchEnabled ? 'Web Search Analysis' : 'App Data Analysis'}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(webSearchEnabled ? webSearchButtons : appDataButtons).map((button) => {
                const IconComponent = button.icon;
                return (
                  <Button
                    key={button.promptName}
                    onClick={() => handleButtonPromptSubmit(button)}
                    variant="outline"
                    size="sm"
                    disabled={!hasValidTicker || isChatPending}
                    className="flex items-center gap-2 text-xs"
                  >
                    <IconComponent className="h-3 w-3" />
                    {button.title}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <Separator />

        {/* Chat History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Chat History</Label>
            <div className="flex gap-2">
              <Button
                onClick={handleCopyChat}
                variant="ghost"
                size="sm"
                disabled={chatHistory.length === 0}
                className="flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
              <Button
                onClick={handleExportChat}
                variant="ghost"
                size="sm"
                disabled={chatHistory.length === 0}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
              <Button
                onClick={handleClearChat}
                variant="ghost"
                size="sm"
                disabled={chatHistory.length === 0}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            </div>
          </div>
          
          <ScrollArea className={`border rounded-lg ${SCROLL_AREA_CONFIG.MAX_HEIGHT} ${SCROLL_AREA_CONFIG.MIN_HEIGHT}`}>
            <div className="p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm">
                  {!hasValidTicker 
                    ? "Select a valid ticker to start chatting"
                    : "No messages yet. Start a conversation with the AI!"
                  }
                </div>
              ) : (
                chatHistory.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.role === 'user' ? 'You' : 'AI'}
                        </span>
                        {message.webSearchUsed && (
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        {message.role === 'model' ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none dark:prose-invert">
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isChatPending && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI is thinking about {currentTicker}...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* User Input */}
        <div className="space-y-2">
          <Label htmlFor="user-input" className="text-sm font-medium">
            Your Message
          </Label>
          <div className="flex gap-2">
            <Textarea
              id="user-input"
              placeholder={hasValidTicker 
                ? `Ask anything about ${currentTicker}...`
                : "Select a ticker to start chatting"
              }
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={!hasValidTicker || isChatPending}
              className={`${TEXTAREA_CONFIG.MIN_HEIGHT} ${TEXTAREA_CONFIG.MAX_HEIGHT} resize-none`}
              rows={TEXTAREA_CONFIG.DEFAULT_ROWS}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleUserInputSubmit();
                }
              }}
            />
            <Button
              onClick={handleUserInputSubmit}
              disabled={!hasValidTicker || !userInput.trim() || isChatPending}
              size="sm"
              className="self-end"
            >
              {isChatPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
            {webSearchEnabled && ' • Web search mode enabled'}
          </p>
        </div>

        {/* Status Messages */}
        {!hasValidTicker && (
          <div className="text-sm text-muted-foreground text-center p-2 bg-muted/50 rounded">
            {!currentTicker 
              ? "Please select a ticker symbol to use AI chat features"
              : `"${currentTicker}" is not a valid ticker symbol`
            }
          </div>
        )}

        {userTickerState.tickerValidationError && (
          <div className="text-sm text-destructive">
            {userTickerState.tickerValidationError}
          </div>
        )}
      </CardContent>
    </Card>
  );
}