'use client';

import React, { useState, useActionState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSpyAnalysis, SPY_TICKER } from '@/contexts/spy-analysis-context';
import { spyConsolidatedChatAction } from '@/actions/spy-consolidated-chat-action';
import type { 
  SpyConsolidatedChatState, 
  SpyConsolidatedChatInput 
} from '@/ai/schemas/spy-consolidated-chat-schemas';

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
  const { toast } = useToast();

  // Local state
  const [userInput, setUserInput] = useState('');
  const [webSearchMode, setWebSearchMode] = useState<'app-data' | 'web-search'>('app-data');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Action state for unified chat
  const [chatState, submitChat, isChatPending] = useActionState<SpyConsolidatedChatState, SpyConsolidatedChatInput>(
    spyConsolidatedChatAction, 
    { status: 'idle' }
  );

  // Derived state
  const webSearchEnabled = webSearchMode === 'web-search';
  const hasStockData = spyState.hasStockData;
  const hasAnyData = hasStockData || spyState.hasAiTaData || spyState.hasAiKeyTakeaways || spyState.hasAiOptionsAnalysis;

  // Handle chat response
  React.useEffect(() => {
    if (chatState.status === 'idle' || isChatPending) return;

    const { data, error, message, status } = chatState;
    
    if (status === 'success' && data) {
      try {
        const responseData = JSON.parse(data.responseJson);
        const responseContent = responseData.response || 'No response received.';
        const webSearchUsed = responseData.webSearchUsed || false;
        
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
      } catch (e) {
        console.error('Failed to parse chat response:', e);
        setChatHistory(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'model',
          content: 'Error: Failed to parse response.',
          timestamp: new Date(),
        }]);
      }
    } else if (status === 'error') {
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
    }
  }, [chatState, isChatPending, toast]);

  // Submit chat message
  const handleSubmitChat = (promptName?: string, customInput?: string) => {
    console.log('[SPY:Chat:Submit] Starting chat submission...', {
      promptName,
      hasCustomInput: !!customInput,
      webSearchMode,
      hasAnyData,
      isChatPending
    });
    
    if (isChatPending) {
      console.log('[SPY:Chat:Submit] Blocked - chat already pending');
      return;
    }

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
      webSearchEnabled,
      chatHistory: chatHistory,
      
      // Include app data context for non-web search prompts
      ...((!webSearchEnabled && hasAnyData) && {
        stockSnapshotJson: spyState.stockSnapshotJson,
        aiKeyTakeawaysJson: spyState.aiKeyTakeawaysJson,
        aiAnalyzedTaJson: spyState.aiAnalyzedTaJson,
        aiOptionsAnalysisJson: spyState.aiOptionsAnalysisJson,
        marketStatusJson: spyState.marketStatusJson,
      }),
    };

    console.log('[SPY:Chat:Submit] Submitting to server action...', {
      webSearchEnabled,
      hasAppData: !webSearchEnabled && hasAnyData,
      historyLength: chatHistory.length
    });
    
    // Submit to action
    submitChat(chatInput);
    
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
      currentMode: webSearchMode
    });
    
    // Temporarily set web search mode for the request
    const originalMode = webSearchMode;
    if (button.webSearchEnabled !== webSearchEnabled) {
      console.log('[SPY:Chat:ButtonPrompt] Temporarily switching chat mode:', {
        from: originalMode,
        to: button.webSearchEnabled ? 'web-search' : 'app-data'
      });
      setWebSearchMode(button.webSearchEnabled ? 'web-search' : 'app-data');
    }

    // Submit with prompt name
    handleSubmitChat(button.promptName, button.title);

    // Restore original mode
    if (button.webSearchEnabled !== webSearchEnabled) {
      setTimeout(() => setWebSearchMode(originalMode), 100);
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    console.log('[SPY:Chat:Clear] Clearing chat history...', { 
      previousMessageCount: chatHistory.length 
    });
    setChatHistory([]);
    toast({ title: 'Chat Cleared', description: 'Chat history has been cleared.' });
  };

  return (
    <Card className="h-[600px] flex flex-col">
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
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Web Search Mode Toggle */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Chat Mode</Label>
          <RadioGroup
            value={webSearchMode}
            onValueChange={(value) => setWebSearchMode(value as 'app-data' | 'web-search')}
            className="flex space-x-6"
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

        <Separator />

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

        {/* Chat Messages */}
        <ScrollArea className="flex-1 space-y-4">
          <div className="space-y-4 pr-4">
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
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
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
        <div className="flex space-x-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={webSearchEnabled ? 'Ask anything with web search...' : 'Ask about SPY data...'}
            disabled={isChatPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitChat();
              }
            }}
            className="flex-1"
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