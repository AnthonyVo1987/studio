
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStockAnalysis, type ChatMessage } from '@/contexts/stock-analysis-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { exampleChatPrompts } from '@/ai/schemas/chat-schemas';
import { Send, MessageSquare, Trash2, Copy, Download, Loader2, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { copyToClipboard, downloadJson } from '@/lib/export-utils';
import type { ChatActionInputs } from '@/actions/chat-server-action';

interface ChatbotProps {
  chatFormAction: (payload: ChatActionInputs) => void;
  isChatPending: boolean;
  currentTicker: string;
}

export function Chatbot({ chatFormAction, isChatPending, currentTicker }: ChatbotProps) {
  const { 
    chatHistory, 
    addChatMessage, 
    clearChatHistory,
    stockSnapshotJson,
    aiKeyTakeawaysJson,
    aiCalculatedTaJson,
    logDebug,
  } = useStockAnalysis();
  const [userInput, setUserInput] = useState('');
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isContextJsonReady = useCallback((jsonString: string | null | undefined): boolean => {
    return !!jsonString && 
           jsonString !== '{}' && 
           !jsonString.includes('"status":') && 
           !jsonString.includes('"error":');
  }, []);

  const currentContextReady = useCallback(() => {
    return isContextJsonReady(stockSnapshotJson) && 
           isContextJsonReady(aiKeyTakeawaysJson) && 
           isContextJsonReady(aiCalculatedTaJson);
  }, [stockSnapshotJson, aiKeyTakeawaysJson, aiCalculatedTaJson, isContextJsonReady]);


  useEffect(() => {
    logDebug('Chatbot', 'Initial render / props update:', { currentTicker, isChatPending });
  }, [currentTicker, isChatPending, logDebug]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  useEffect(() => {
    const snapshotReady = isContextJsonReady(stockSnapshotJson);
    const takeawaysReady = isContextJsonReady(aiKeyTakeawaysJson);
    const taReady = isContextJsonReady(aiCalculatedTaJson);
    logDebug('Chatbot', 'Context readiness check:', { 
      isOverallReady: currentContextReady(), 
      snapshotJsonValid: snapshotReady,
      takeawaysJsonValid: takeawaysReady,
      aiTaJsonValid: taReady,
    });
  }, [stockSnapshotJson, aiKeyTakeawaysJson, aiCalculatedTaJson, logDebug, currentContextReady, isContextJsonReady]);


  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!userInput.trim() || isChatPending || !currentContextReady()) {
        if(!currentContextReady()) {
            toast({ variant: 'destructive', title: 'Context Not Ready', description: 'Please analyze a stock first for full chat context.' });
        }
        logDebug('Chatbot', 'Submit prevented:', {userInputEmpty: !userInput.trim(), isChatPending, contextNotReady: !currentContextReady() });
        return;
    }

    const userMessage: ChatMessage = { id: Date.now().toString() + '_user', role: 'user', content: userInput.trim() };
    addChatMessage(userMessage); // This will also log from StockAnalysisContext

    logDebug('Chatbot', `Submitting chat message for ${currentTicker}: "${userInput.trim()}"`);

    const chatPayload: ChatActionInputs = {
      ticker: currentTicker,
      stockSnapshotJson,
      aiKeyTakeawaysJson,
      aiCalculatedTaJson,
      chatHistory: [...chatHistory, userMessage], 
      userInput: userInput.trim(),
    };
    
    chatFormAction(chatPayload);
    setUserInput('');
  };

  const handleExamplePromptClick = (promptTemplate: string) => {
    if (!currentContextReady()) {
        toast({ variant: 'destructive', title: 'Context Not Ready', description: 'Analyze a stock before using example prompts.' });
        logDebug('Chatbot', 'Example prompt click prevented: context not ready.');
        return;
    }
    const filledPrompt = promptTemplate.replace(/{TICKER}/g, currentTicker || 'this stock');
    setUserInput(filledPrompt);
    logDebug('Chatbot', 'Example prompt clicked:', { title: promptTemplate, filledPrompt });
  };

  const handleCopyChat = async () => {
    if (chatHistory.length === 0) {
        logDebug('Chatbot', 'Copy chat: No history to copy.');
        return;
    }
    const success = await copyToClipboard(JSON.stringify(chatHistory, null, 2));
    if (success) {
      toast({ title: 'Chat Copied', description: 'Chat history copied to clipboard as JSON.' });
      logDebug('Chatbot', 'Chat history copied to clipboard successfully.');
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy chat history.' });
      logDebug('Chatbot', 'Failed to copy chat history to clipboard.');
    }
  };

  const handleExportChat = () => {
    if (chatHistory.length === 0) {
        logDebug('Chatbot', 'Export chat: No history to export.');
        return;
    }
    try {
      downloadJson(chatHistory, `${currentTicker || 'stocksage'}_chat_history.json`);
      toast({ title: 'Chat Exported', description: 'Chat history downloaded as JSON.' });
      logDebug('Chatbot', 'Chat history exported as JSON successfully.');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export chat history.' });
      logDebug('Chatbot', 'Error exporting chat history:', error);
    }
  };
  
  const contextReady = currentContextReady();

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center text-lg">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            StockSage AI Chat
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Ask questions about {currentTicker || "the analyzed stock"}. Chat history is session-based.
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Clear Chat History" disabled={chatHistory.length === 0}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the current chat history. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { clearChatHistory(); toast({title: "Chat Cleared"}); }}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          <Button variant="ghost" size="icon" onClick={handleCopyChat} title="Copy Chat (JSON)" disabled={chatHistory.length === 0}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExportChat} title="Export Chat (JSON)" disabled={chatHistory.length === 0}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 space-y-4 overflow-hidden">
        <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chatHistory.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Try an example prompt or ask a question!
              </div>
            )}
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-max max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm break-words",
                  msg.role === 'user'
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose dark:prose-invert prose-sm max-w-none">
                  {msg.content}
                </ReactMarkdown>
              </div>
            ))}
            {isChatPending && chatHistory.length > 0 && chatHistory[chatHistory.length-1].role === 'user' && (
                 <div className={cn("flex w-max max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm", "bg-muted")}>
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground italic">StockSage is thinking...</span>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        
        {!contextReady && (
          <div className="p-3 mb-2 text-center text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-700/20 border border-orange-200 dark:border-orange-600/50 rounded-md">
            Chat context is not fully loaded. Please analyze a stock first for the best experience.
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-2">
          {exampleChatPrompts.map((p, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleExamplePromptClick(p.prompt)}
              disabled={isChatPending || !contextReady}
              className="text-xs px-2 py-1 h-auto"
            >
              <HelpCircle className="mr-1.5 h-3 w-3" />
              {p.title.replace(/{TICKER}/g, currentTicker || 'Stock')}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center space-x-2 pt-2 border-t">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={contextReady ? `Ask about ${currentTicker || 'the stock'}...` : "Analyze a stock to enable chat..."}
            disabled={isChatPending || !contextReady}
            className="flex-grow"
            onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e as any);}}
          />
          <Button type="submit" disabled={isChatPending || !userInput.trim() || !contextReady}>
            {isChatPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

