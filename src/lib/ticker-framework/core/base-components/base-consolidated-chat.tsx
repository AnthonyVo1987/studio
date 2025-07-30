"use client";

/**
 * @fileOverview Base Consolidated Chat Template
 * 
 * This template provides a unified AI chat interface for any ticker.
 * Note: This is a simplified template - full implementation would require
 * ticker-specific server actions and chat handlers.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Send, 
  Globe, 
  Database, 
  Copy, 
  Download,
  Loader2,
  Brain
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

import type { TickerConfig, TickerContextResult } from '../types';

interface BaseConsolidatedChatProps<T extends TickerConfig> {
  config: T;
  context: TickerContextResult<T>;
  // Server action would be passed as prop in real implementation
  chatAction?: (params: any) => Promise<any>;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode: 'app-data' | 'web-search';
}

export function BaseConsolidatedChat<T extends TickerConfig>({
  config,
  context,
  chatAction,
}: BaseConsolidatedChatProps<T>) {
  const state = context.hooks.useState();
  const { toast } = useToast();
  
  // Local chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [chatMode, setChatMode] = useState<'app-data' | 'web-search'>('app-data');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  const isDataAvailable = state.hasStockData || state.hasAiTaData;

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
      mode: chatMode,
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // In real implementation, this would call the ticker-specific server action
      if (chatAction) {
        const response = await chatAction({
          ticker: config.ticker,
          userInput: userMessage.content,
          chatMode,
          stockData: state.stockSnapshotJson,
          standardTA: state.standardTasJson,
          aiAnalyzedTA: state.aiAnalyzedTaJson,
          marketStatus: state.marketStatusJson,
        });

        if (response.status === 'success') {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: response.data?.response || 'No response received',
            timestamp: new Date(),
            mode: chatMode,
          };

          setMessages(prev => [...prev, assistantMessage]);
        } else {
          throw new Error(response.message || 'Chat request failed');
        }
      } else {
        // Fallback when no chat action is provided
        const mockResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `I'm a placeholder AI assistant for ${config.ticker}. To use real chat functionality, implement the ticker-specific server action.`,
          timestamp: new Date(),
          mode: chatMode,
        };

        setMessages(prev => [...prev, mockResponse]);
      }
    } catch (error) {
      toast({
        title: 'Chat Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (actionType: string, prompt: string) => {
    if (isLoading) return;

    setIsLoading(true);
    
    try {
      // Add system message for quick action
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: `[${actionType}] ${prompt}`,
        timestamp: new Date(),
        mode: chatMode,
      };

      setMessages(prev => [...prev, systemMessage]);

      // In real implementation, this would call specialized server actions
      const mockResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `This is a placeholder response for ${actionType} analysis of ${config.ticker}. Implement the corresponding server action for real functionality.`,
        timestamp: new Date(),
        mode: chatMode,
      };

      setMessages(prev => [...prev, mockResponse]);
    } catch (error) {
      toast({
        title: 'Quick Action Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportChatHistory = () => {
    try {
      const chatData = {
        ticker: config.ticker,
        timestamp: new Date().toISOString(),
        messages: messages,
        totalMessages: messages.length,
      };

      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.ticker}_chat_history_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `${config.ticker} chat history exported successfully`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Unable to export chat history',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {config.ticker} AI Chat Assistant
            </CardTitle>
            <CardDescription>
              Interactive AI analysis and trading insights
            </CardDescription>
          </div>
          
          {messages.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportChatHistory}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Export Chat
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat Interface</TabsTrigger>
            <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            {/* Chat Mode Toggle */}
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Chat Mode:</span>
              <div className="flex gap-2">
                <Button
                  variant={chatMode === 'app-data' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChatMode('app-data')}
                  className="flex items-center gap-2"
                  disabled={!isDataAvailable}
                >
                  <Database className="h-3 w-3" />
                  App Data
                </Button>
                <Button
                  variant={chatMode === 'web-search' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChatMode('web-search')}
                  className="flex items-center gap-2"
                >
                  <Globe className="h-3 w-3" />
                  Web Search
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh] 2xl:h-[75vh] max-h-[80vh] overflow-y-auto border rounded-lg p-4 space-y-4 scroll-smooth">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4" />
                  <p>Start a conversation about {config.ticker}</p>
                  <p className="text-sm mt-2">
                    Ask about technical analysis, market conditions, or trading strategies
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {message.mode === 'app-data' ? 'App Data' : 'Web Search'}
                        </Badge>
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="space-y-2">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`Ask me anything about ${config.ticker}...`}
                className="min-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </span>
                <Button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quick-actions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleQuickAction('Stock Analysis', `Provide comprehensive stock analysis for ${config.ticker}`)}
                disabled={isLoading || !isDataAvailable}
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="font-medium">Stock Trader Analysis</div>
                <div className="text-sm text-muted-foreground text-left">
                  Comprehensive stock analysis and trading insights
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleQuickAction('Options Analysis', `Analyze options opportunities for ${config.ticker}`)}
                disabled={isLoading || !state.hasOptionsChainData}
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="font-medium">Options Trader Analysis</div>
                <div className="text-sm text-muted-foreground text-left">
                  Options strategies and volatility analysis
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleQuickAction('Technical Analysis', `Analyze technical indicators for ${config.ticker}`)}
                disabled={isLoading || !state.hasAiTaData}
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="font-medium">Technical Analysis</div>
                <div className="text-sm text-muted-foreground text-left">
                  Deep dive into technical patterns and signals
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleQuickAction('Holistic Analysis', `Provide holistic market analysis for ${config.ticker}`)}
                disabled={isLoading || !isDataAvailable}
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="font-medium">Holistic Market Analysis</div>
                <div className="text-sm text-muted-foreground text-left">
                  Comprehensive market view and outlook
                </div>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}