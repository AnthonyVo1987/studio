'use client';

/**
 * @fileOverview NVDA Staging Consolidated Chat - Enterprise Experimental Component
 * 
 * Staging version of consolidated chat with orange/amber theming and staging context consumption.
 * Architecture Pattern: Direct staging context consumption with AI chat functionality.
 * 
 * REPLICATION PATTERN from baseline component:
 * 1. Adapted from nvda-consolidated-chat.tsx for staging environment
 * 2. Updated imports: useNvdaAnalysis → useNvdaStagingAnalysis
 * 3. Updated component name: NvdaConsolidatedChat → NvdaStagingConsolidatedChat
 * 4. Updated ticker reference: NVDA_TICKER → NVDA_STAGING_TICKER
 * 5. Added staging-specific orange/amber card styling and title suffix
 * 
 * STAGING ENHANCEMENTS:
 * - Orange/amber color scheme for staging differentiation
 * - "(Staging)" suffix in component title
 * - Staging context consumption via useNvdaStagingAnalysis()
 * - Note: For MVP, displays placeholder with future implementation plan
 */

import React, { useState, useEffect } from 'react';
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
  Download,
  Wrench
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNvdaStagingAnalysis, useNvdaStagingDispatch, NVDA_STAGING_TICKER } from '@/contexts/nvda-staging-analysis-context';

// UI Constants - Responsive viewport-based heights for optimal message viewing
const CHAT_HEIGHTS = {
  // Responsive height strategy: 50vh mobile → 65vh desktop → 75vh xl screens
  RESPONSIVE: 'h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh] 2xl:h-[75vh]',
  MIN: 'min-h-[400px]', // Fallback minimum height
  MAX: 'max-h-[80vh]'   // Maximum height constraint
} as const;

const SCROLL_AREA_CONFIG = {
  // Optimized for smooth scrolling with auto-scroll to bottom for new responses
  FLEXIBLE_HEIGHT: 'flex-1 overflow-y-auto', 
  MIN_HEIGHT: 'min-h-[300px]' // Increased for better message visibility
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

// Button prompt definitions (staging versions)
const appDataButtons = [
  { title: "Stock Trader's Takeaways (Staging)", promptName: 'stock-trader-takeaways', icon: FileText, webSearchEnabled: false },
  { title: "Options Trader's Takeaways (Staging)", promptName: 'options-trader-takeaways', icon: FileText, webSearchEnabled: false },
  { title: "Additional Holistic Takeaways (Staging)", promptName: 'holistic-takeaways', icon: FileText, webSearchEnabled: false },
];

const webSearchButtons = [
  { title: "S/R Levels Search (Staging)", promptName: 'support-resistance-web-search', icon: CandlestickChart, webSearchEnabled: true },
  { title: "Technical Analysis Search (Staging)", promptName: 'technical-analysis-web-search', icon: SearchCode, webSearchEnabled: true },
  { title: "Options Flow Search (Staging)", promptName: 'options-flow-web-search', icon: Search, webSearchEnabled: true },
];

export function NvdaStagingConsolidatedChat() {
  const stagingState = useNvdaStagingAnalysis();
  const stagingDispatch = useNvdaStagingDispatch();
  const { toast } = useToast();

  // Local state
  const [userInput, setUserInput] = useState('');
  const [webSearchMode, setWebSearchMode] = useState<'app-data' | 'web-search'>('app-data');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatPending, setIsChatPending] = useState(false);

  // Derived state
  const webSearchEnabled = webSearchMode === 'web-search';
  const hasStockData = stagingState.hasStockData;
  const hasAnyData = hasStockData || stagingState.hasAiTaData || stagingState.hasAiKeyTakeaways || stagingState.hasAiOptionsAnalysis;

  // Ref for scroll area to enable auto-scroll functionality
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom for new messages
  const scrollToBottom = React.useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  // TODO: Implement staging-specific chat action
  // For now, this is a placeholder that demonstrates the interface
  const handleSubmitChat = (promptName?: string, customInput?: string, overrideWebSearchEnabled?: boolean) => {
    const effectiveWebSearchEnabled = overrideWebSearchEnabled !== undefined ? overrideWebSearchEnabled : webSearchEnabled;
    
    console.log('[NVDA:Staging:Chat:Submit] Starting staging chat submission...', {
      promptName,
      hasCustomInput: !!customInput,
      webSearchMode,
      effectiveWebSearchEnabled,
      hasAnyData,
      isChatPending
    });
    
    if (isChatPending) {
      console.log('[NVDA:Staging:Chat:Submit] Blocked - chat already pending');
      return;
    }
    
    const finalInput = customInput || userInput.trim();
    if (!finalInput) {
      console.log('[NVDA:Staging:Chat:Submit] Blocked - empty input');
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
    
    // Auto-scroll to bottom for new user messages
    setTimeout(scrollToBottom, 100);
    
    setIsChatPending(true);
    
    // Simulate AI response for staging environment
    setTimeout(() => {
      const simulatedResponse: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: `🧪 **Staging Environment Response**\n\nThis is a simulated response for the staging environment. In production, this would:\n\n- Process your request: "${finalInput}"\n- Use ${effectiveWebSearchEnabled ? 'web search' : 'app data'} mode\n- Analyze NVDA staging data\n- Return comprehensive insights\n\n**Implementation Status:** Chat functionality will be integrated with staging-specific server actions in the next phase.`,
        timestamp: new Date(),
        webSearchUsed: effectiveWebSearchEnabled,
      };
      
      setChatHistory(prev => [...prev, simulatedResponse]);
      setIsChatPending(false);
      
      // Auto-scroll to bottom for new AI responses
      setTimeout(scrollToBottom, 100);
      
      toast({ 
        title: 'Staging Response Generated', 
        description: 'Simulated response for staging environment',
      });
    }, 2000);
    
    // Clear user input
    if (!customInput) {
      setUserInput('');
    }
  };

  // Handle button prompts
  const handleButtonPrompt = (button: typeof appDataButtons[0] | typeof webSearchButtons[0]) => {
    console.log('[NVDA:Staging:Chat:ButtonPrompt] Button clicked:', {
      title: button.title,
      promptName: button.promptName,
      webSearchEnabled: button.webSearchEnabled,
      currentMode: webSearchMode,
      hasStockData,
      hasAnyData,
      isChatPending
    });
    
    if (isChatPending) {
      console.warn('[NVDA:Staging:Chat:ButtonPrompt] Blocked - chat request already pending');
      return;
    }
    
    // Submit with button-specific web search setting (no mode switching needed)
    handleSubmitChat(button.promptName, button.title, button.webSearchEnabled);
  };

  // Clear chat history
  const handleClearChat = () => {
    console.log('[NVDA:Staging:Chat:Clear] Clearing staging chat history...', { 
      previousMessageCount: chatHistory.length 
    });
    setChatHistory([]);
    toast({ title: 'Staging Chat Cleared', description: 'Staging chat history has been cleared.' });
  };

  // Copy chat history to clipboard
  const handleCopyChat = async () => {
    try {
      const chatData = {
        ticker: NVDA_STAGING_TICKER,
        environment: 'staging',
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
        title: 'Staging Chat Copied', 
        description: 'Staging chat history copied to clipboard as JSON.' 
      });
    } catch (error) {
      console.error('Failed to copy staging chat history:', error);
      toast({ 
        title: 'Copy Failed', 
        description: 'Failed to copy staging chat history to clipboard.',
        variant: 'destructive' 
      });
    }
  };

  // Export chat history as JSON file
  const handleExportChat = () => {
    try {
      const chatData = {
        ticker: NVDA_STAGING_TICKER,
        environment: 'staging',
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
      link.download = `${NVDA_STAGING_TICKER}_chat_history_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ 
        title: 'Staging Chat Exported', 
        description: 'Staging chat history exported as JSON file.' 
      });
    } catch (error) {
      console.error('Failed to export staging chat history:', error);
      toast({ 
        title: 'Export Failed', 
        description: 'Failed to export staging chat history.',
        variant: 'destructive' 
      });
    }
  };

  return (
    <Card className={`${CHAT_HEIGHTS.RESPONSIVE} ${CHAT_HEIGHTS.MAX} flex flex-col border-orange-200`}>
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <MessageSquare className="h-5 w-5" />
              NVDA Consolidated AI Chat (Staging)
            </CardTitle>
            <CardDescription className="text-orange-700">
              Unified chat interface with app data analysis and web search capabilities - Staging Environment
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyChat}
              disabled={isChatPending || chatHistory.length === 0}
              title="Copy staging chat history as JSON"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportChat}
              disabled={isChatPending || chatHistory.length === 0}
              title="Export staging chat history as JSON file"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              disabled={isChatPending || chatHistory.length === 0}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Implementation Status Banner */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Wrench className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">🚧 Implementation Status</p>
            <p className="text-blue-700">Chat functionality provides simulated responses. Server action integration planned for next phase.</p>
          </div>
        </div>

        {/* Example Prompts */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-orange-900">Quick Prompts (Staging)</Label>
          
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
                    className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
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
                    className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
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
          <Label className="text-sm font-medium text-orange-900">Chat Mode</Label>
          <RadioGroup
            value={webSearchMode}
            onValueChange={(value) => setWebSearchMode(value as 'app-data' | 'web-search')}
            className="flex flex-wrap space-x-6"
            disabled={isChatPending}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="app-data" id="app-data-staging" />
              <Label htmlFor="app-data-staging" className="flex items-center gap-2 cursor-pointer">
                <Database className="h-4 w-4" />
                App Data Only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="web-search" id="web-search-staging" />
              <Label htmlFor="web-search-staging" className="flex items-center gap-2 cursor-pointer">
                <Globe className="h-4 w-4" />
                Web Search Enabled
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Chat Messages */}
        <ScrollArea 
          ref={scrollAreaRef}
          className={`${SCROLL_AREA_CONFIG.FLEXIBLE_HEIGHT} ${SCROLL_AREA_CONFIG.MIN_HEIGHT} scroll-smooth`}
        >
          <div className="space-y-4 p-4 overflow-hidden">
            {chatHistory.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Start a conversation by typing below or using the quick prompts above.
                {!hasAnyData && webSearchMode === 'app-data' && (
                  <div className="mt-2 text-xs">
                    <strong>Note:</strong> Load NVDA staging data first for app data analysis.
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
                        ? 'bg-orange-100 text-orange-900 border border-orange-200'
                        : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <div className="prose dark:prose-invert prose-sm max-w-none overflow-hidden whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    {message.webSearchUsed && (
                      <div className="text-xs mt-1 opacity-70 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Web search used (staging)
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
            placeholder={webSearchEnabled ? 'Ask anything with web search... (staging mode) (Shift+Enter for new line)' : 'Ask about NVDA staging data... (Shift+Enter for new line)'}
            disabled={isChatPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitChat();
              }
            }}
            className={`flex-1 ${TEXTAREA_CONFIG.MIN_HEIGHT} ${TEXTAREA_CONFIG.MAX_HEIGHT} resize-none border-orange-300`}
            rows={TEXTAREA_CONFIG.DEFAULT_ROWS}
          />
          <Button
            onClick={() => handleSubmitChat()}
            disabled={isChatPending || !userInput.trim()}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
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
            Generating staging response with {webSearchEnabled ? 'web search' : 'app data'}...
          </div>
        )}
      </CardContent>
    </Card>
  );
}