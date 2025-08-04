'use client';

import React, { useState, useActionState, startTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  Search,
  FileText,
  CandlestickChart,
  SearchCode,
  Globe,
  Copy,
  Download,
  Bot
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNvdaAnalysis, NVDA_TICKER } from '@/contexts/nvda-analysis-context';
import { agenticChatAction, type AgenticChatState } from '@/actions/agentic-chat-action';
import { type AgenticChatInput } from '@/ai/flows/agentic-chat-orchestrator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// UI Constants
const CHAT_HEIGHTS = {
  RESPONSIVE: 'h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh] 2xl:h-[75vh]',
  MIN: 'min-h-[400px]',
  MAX: 'max-h-[80vh]'
} as const;

const SCROLL_AREA_CONFIG = {
  FLEXIBLE_HEIGHT: 'flex-1 overflow-y-auto',
  MIN_HEIGHT: 'min-h-[300px]'
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
}

// Button prompt definitions - simplified for the agent
const quickPrompts = [
  { title: "Stock Trader's Takeaways", icon: FileText },
  { title: "Options Trader's Takeaways", icon: FileText },
  { title: "Additional Holistic Takeaways", icon: FileText },
  { title: "Search for recent S/R Levels", icon: CandlestickChart },
  { title: "Search for technical analysis", icon: SearchCode },
  { title: "Search for options flow", icon: Search },
];

export function AgenticNvdaConsolidatedChat() {
  const nvdaState = useNvdaAnalysis();
  const { toast } = useToast();

  // Local state
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  // Action state for the new agentic chat
  const [chatState, submitChat, isChatPending] = useActionState<AgenticChatState, AgenticChatInput>(
    agenticChatAction,
    { status: 'idle' }
  );

  // Derived state
  const hasAnyData = nvdaState.hasStockData || nvdaState.hasAiTaData || nvdaState.hasAiKeyTakeaways || nvdaState.hasAiOptionsAnalysis;

  // Ref for scroll area
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = React.useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  const handleChatSuccess = React.useCallback((data: any) => {
    if (!currentRequestId || !data) return;

    const responseContent = data.response || 'No response received.';

    setChatHistory(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'model',
      content: responseContent,
      timestamp: new Date(),
    }]);

    setTimeout(scrollToBottom, 100);

    toast({
      title: 'Response Generated',
      description: 'The agent has processed your request.',
    });

    setCurrentRequestId(null);
  }, [currentRequestId, toast, scrollToBottom]);

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

    setCurrentRequestId(null);
  }, [currentRequestId, toast]);

  React.useEffect(() => {
    if (chatState.status === 'idle' || isChatPending || !currentRequestId) return;

    if (chatState.status === 'success' && chatState.data) {
      handleChatSuccess(chatState.data);
    } else if (chatState.status === 'error') {
      handleChatError(chatState.error || 'Unknown Error', chatState.message);
    }
  }, [chatState, isChatPending, currentRequestId, handleChatSuccess, handleChatError]);

  const handleSubmitChat = (customInput?: string) => {
    if (isChatPending || currentRequestId) {
      return;
    }

    const requestId = crypto.randomUUID();
    setCurrentRequestId(requestId);

    const finalInput = customInput || userInput.trim();
    if (!finalInput) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a message.',
        variant: 'destructive',
      });
      setCurrentRequestId(null);
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: finalInput,
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, userMessage]);
    setTimeout(scrollToBottom, 100);

    const chatInput: AgenticChatInput = {
      ticker: NVDA_TICKER,
      userInput: finalInput,
      chatHistory: chatHistory.map(m => ({role: m.role, content: m.content})), // Pass simplified history
      stockSnapshotJson: nvdaState.stockSnapshotJson,
      aiKeyTakeawaysJson: nvdaState.aiKeyTakeawaysJson,
      aiAnalyzedTaJson: nvdaState.aiAnalyzedTaJson,
      aiOptionsAnalysisJson: nvdaState.aiOptionsAnalysisJson,
      marketStatusJson: nvdaState.marketStatusJson,
    };

    startTransition(() => {
      submitChat(chatInput);
    });

    if (!customInput) {
      setUserInput('');
    }
  };

  const handleButtonPrompt = (promptTitle: string) => {
    if (isChatPending) return;
    handleSubmitChat(promptTitle);
  };

  const handleClearChat = () => {
    setChatHistory([]);
    toast({ title: 'Chat Cleared', description: 'Chat history has been cleared.' });
  };

  const handleCopyChat = async () => {
    try {
      const chatData = {
        ticker: NVDA_TICKER,
        timestamp: new Date().toISOString(),
        chatHistory: chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        }))
      };
      await navigator.clipboard.writeText(JSON.stringify(chatData, null, 2));
      toast({
        title: 'Chat Copied',
        description: 'Chat history copied to clipboard as JSON.'
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy chat history.',
        variant: 'destructive'
      });
    }
  };

  const handleExportChat = () => {
    try {
      const chatData = {
        ticker: NVDA_TICKER,
        timestamp: new Date().toISOString(),
        chatHistory: chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        }))
      };
      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${NVDA_TICKER}_agentic_chat_history_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Chat Exported',
        description: 'Chat history exported as JSON file.'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export chat history.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className={`${CHAT_HEIGHTS.RESPONSIVE} ${CHAT_HEIGHTS.MAX} flex flex-col border rounded-lg border-primary/50`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {NVDA_TICKER} Agentic AI Chat (Experimental)
            </CardTitle>
            <CardDescription>
              An intelligent agent that dynamically uses tools to answer your questions.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyChat} disabled={isChatPending || chatHistory.length === 0}><Copy className="h-4 w-4 mr-1" /> Copy</Button>
            <Button variant="outline" size="sm" onClick={handleExportChat} disabled={isChatPending || chatHistory.length === 0}><Download className="h-4 w-4 mr-1" /> Export</Button>
            <Button variant="outline" size="sm" onClick={handleClearChat} disabled={isChatPending || chatHistory.length === 0}><Trash2 className="h-4 w-4 mr-1" /> Clear</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Prompts</Label>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((button) => {
              const Icon = button.icon;
              return (
                <Button
                  key={button.title}
                  variant="outline"
                  size="sm"
                  onClick={() => handleButtonPrompt(button.title)}
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

        <Separator />

        <ScrollArea ref={scrollAreaRef} className={`${SCROLL_AREA_CONFIG.FLEXIBLE_HEIGHT} ${SCROLL_AREA_CONFIG.MIN_HEIGHT} scroll-smooth`}>
          <div className="space-y-4 p-4 overflow-hidden">
            {chatHistory.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Ask the agent anything about {NVDA_TICKER}.
                {!hasAnyData && (
                  <div className="mt-2 text-xs">
                    <strong>Note:</strong> Load {NVDA_TICKER} data first for the agent to use its internal analysis tools.
                  </div>
                )}
              </div>
            ) : (
              chatHistory.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} overflow-hidden w-full`}>
                  <div className={`max-w-[80%] sm:max-w-[85%] md:max-w-[80%] rounded-lg px-3 py-2 text-sm overflow-hidden ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className="prose dark:prose-invert prose-sm max-w-none overflow-hidden whitespace-pre-wrap break-words"
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask the agent anything..."
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
          <Button onClick={() => handleSubmitChat()} disabled={isChatPending || !userInput.trim()} size="sm">
            {isChatPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {isChatPending && <div className="text-xs text-muted-foreground text-center">Agent is thinking...</div>}
      </CardContent>
    </Card>
  );
}
