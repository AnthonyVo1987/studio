
"use client";

import React, { useEffect, useRef, FormEvent } from 'react';
import type { AppDataChatMessage } from '@/contexts/business-logic-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare, Trash2, Copy, Download, Loader2, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { copyToClipboard, downloadJson } from '@/lib/export-utils';

export interface ExamplePromptButton {
  title: string;
  promptName: string;
  icon: React.ElementType;
}

interface ChatbotProps {
  title: string;
  description: string;
  chatHistory: AppDataChatMessage[];
  clearChatHistory: () => void;
  isProcessing: boolean;
  exampleButtons: ExamplePromptButton[];
  currentTickerForDisplay: string;
  userInput: string;
  setUserInput: (input: string) => void;
  onFormSubmit: (payload: { userInput?: string; promptName?: string }) => void;
}

export function Chatbot({
  title,
  description,
  chatHistory,
  clearChatHistory,
  isProcessing,
  exampleButtons,
  currentTickerForDisplay,
  userInput,
  setUserInput,
  onFormSubmit,
}: ChatbotProps) {
  const { toast } = useToast();
  const logSourceId = `Chatbot:${title.replace(/\s+/g, '')}`;
  const viewportRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleCopyChat = async () => {
    if (chatHistory.length === 0) { return; }
    const success = await copyToClipboard(JSON.stringify(chatHistory, null, 2));
    toast({ title: success ? 'Chat Copied' : 'Copy Failed', description: success ? 'Chat history copied as JSON.' : 'Could not copy chat history.'});
  };

  const handleExportChat = () => {
    if (chatHistory.length === 0) { return; }
    try {
      const filenamePrefix = title.toLowerCase().includes('web') ? 'web_search' : 'app_data';
      downloadJson(chatHistory, `${currentTickerForDisplay || 'stocksage'}_${filenamePrefix}_chat_history.json`);
      toast({ title: 'Chat Exported', description: 'Chat history downloaded as JSON.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export chat history.' });
    }
  };
  
  const handleExamplePromptSubmit = (e: FormEvent, promptName: string) => {
    e.preventDefault();
    if(isProcessing) return;
    onFormSubmit({ promptName });
  };
  
  const handleUserInputSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isProcessing || !userInput.trim()) return;
    onFormSubmit({ userInput });
  };

  const renderPromptButtons = (buttons: ExamplePromptButton[]) => (
    buttons.map((p, index) => (
      <form key={index} onSubmit={(e) => handleExamplePromptSubmit(e, p.promptName)}>
        <Button 
            type="submit" 
            variant="outline" 
            size="sm" 
            disabled={isProcessing} 
            className="text-xs px-2 py-1 h-auto w-full justify-start" 
            title={p.title}
        >
          <p.icon className="mr-1.5 h-3 w-3" />
          {p.title}
        </Button>
      </form>
    ))
  );

  return (
    <Card className="flex flex-col h-[650px]">
      <CardHeader className="flex-shrink-0">
        <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-lg">
                <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                {title}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {description}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Clear Chat History" disabled={chatHistory.length === 0 || isProcessing}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this chat history. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { clearChatHistory(); toast({title: "Chat Cleared"}); }}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              <Button variant="ghost" size="icon" onClick={handleCopyChat} title="Copy Chat (JSON)" disabled={chatHistory.length === 0 || isProcessing}><Copy className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={handleExportChat} title="Export Chat (JSON)" disabled={chatHistory.length === 0 || isProcessing}><Download className="h-4 w-4" /></Button>
            </div>
        </div>
      </CardHeader>
      <CardContent ref={viewportRef} className="flex-grow overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
        <div className="text-center text-muted-foreground py-8">No messages yet. Try a prompt or ask a question!</div>
        )}
        {chatHistory.map((msg) => (
        <div key={msg.id} className={cn("flex w-full max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm break-words", msg.role === 'user' ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose dark:prose-invert prose-sm max-w-none">{msg.content}</ReactMarkdown>
        </div>
        ))}
        {isProcessing && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user' && (
            <div className={cn("flex w-full max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm break-words", "bg-muted")}> 
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground italic">StockSage is thinking...</span>
                </div>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex-shrink-0 flex flex-col items-start gap-4 p-4 pt-4 border-t">
        <div className="w-full">
            <div className="text-xs font-semibold text-muted-foreground mb-1.5 ml-1 flex items-center gap-1.5"><Info className="h-3 w-3" /> Example Prompts</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">{renderPromptButtons(exampleButtons)}</div>
        </div>
        <form onSubmit={handleUserInputSubmit} className="w-full flex items-center space-x-2">
          <Input name="userInputDisplay" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={`Ask about ${currentTickerForDisplay || 'the stock'}...`} disabled={isProcessing} className="flex-grow" />
          <Button type="submit" disabled={isProcessing || !userInput.trim()}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
