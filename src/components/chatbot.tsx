
"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import type { AppDataChatMessage, GlobalFsmState } from '@/contexts/stock-analysis-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useChatbotFsm, type ChatbotFsmEvent } from '@/contexts/chatbot-fsm-context'; 

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
  fsmState: GlobalFsmState; 
  isProcessing: boolean;
  exampleButtons: ExamplePromptButton[];
  currentTickerForDisplay: string;
  logDebug: (source: string, category: string, ...messages: any[]) => void;
}

export function Chatbot({
  title,
  description,
  chatHistory,
  clearChatHistory,
  fsmState,
  isProcessing,
  exampleButtons,
  currentTickerForDisplay,
  logDebug,
}: ChatbotProps) {
  const {
    fsmState: chatbotFsmState, 
    userInput: fsmUserInput,
    dispatchChatbotFsmEvent,
  } = useChatbotFsm();

  const { toast } = useToast();
  const logSourceId = `Chatbot:${title.replace(/\s+/g, '')}`;
  const cardContentRef = useRef<HTMLDivElement>(null); 

  // --- Diagnostic Logging Effect ---
  useEffect(() => {
    if (cardContentRef.current) {
        const dimensions = {
            cardContentClientHeight: cardContentRef.current.clientHeight,
            cardContentScrollHeight: cardContentRef.current.scrollHeight,
        };
        console.log(`[CHAT SCROLL DEBUG - ${title}]`, dimensions);
    }
  }, [chatHistory, title]);
  // --- End Diagnostic Logging Effect ---

  useEffect(() => {
    if (cardContentRef.current) {
      cardContentRef.current.scrollTo({ top: cardContentRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleFormSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    logDebug(logSourceId, 'UserAction_Submit', `GlobalFSM: ${fsmState}, FSM UserInput: "${fsmUserInput.substring(0,20)}"`);
    if (!fsmUserInput.trim() || isProcessing) {
      logDebug(logSourceId, 'UserAction_Submit_Prevented', 'Input empty or analysis/chat is globally in progress.');
      return;
    }
    const event: ChatbotFsmEvent = { type: 'SUBMIT_MESSAGE_REQUESTED', payload: { userInput: fsmUserInput, promptName: title.toLowerCase().includes('web') ? 'web-search-chatbot' : 'app-data-chatbot' } };
    dispatchChatbotFsmEvent(event); 
  }, [fsmUserInput, fsmState, dispatchChatbotFsmEvent, logDebug, isProcessing, logSourceId, title]);

  const handleExamplePromptClick = (promptName: string) => {
    if (isProcessing) return;
    logDebug(logSourceId, 'UserAction_ExamplePrompt', `PromptName: "${promptName}". Dispatching SUBMIT_MESSAGE_REQUESTED.`);
    const event: ChatbotFsmEvent = { type: 'SUBMIT_MESSAGE_REQUESTED', payload: { userInput: promptName, promptName: promptName } };
    dispatchChatbotFsmEvent(event);
  };

  const handleCopyChat = async () => {
    if (chatHistory.length === 0) { logDebug(logSourceId, 'UserAction_CopyChat', 'No history to copy.'); return; }
    const success = await copyToClipboard(JSON.stringify(chatHistory, null, 2));
    toast({ title: success ? 'Chat Copied' : 'Copy Failed', description: success ? 'Chat history copied as JSON.' : 'Could not copy chat history.'});
    logDebug(logSourceId, 'UserAction_CopyChat_Result', success ? 'Success.' : 'Failed.');
  };

  const handleExportChat = () => {
    if (chatHistory.length === 0) { logDebug(logSourceId, 'UserAction_ExportChat', 'No history to export.'); return; }
    try {
      const filenamePrefix = title.toLowerCase().includes('web') ? 'web_search' : 'app_data';
      downloadJson(chatHistory, `${currentTickerForDisplay || 'stocksage'}_${filenamePrefix}_chat_history.json`);
      toast({ title: 'Chat Exported', description: 'Chat history downloaded as JSON.' });
      logDebug(logSourceId, 'UserAction_ExportChat_Result', 'Success.');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export chat history.' });
      logDebug(logSourceId, 'UserAction_ExportChat_Result', 'Error:', error);
    }
  };

  const renderPromptButtons = (buttons: ExamplePromptButton[]) => (
    buttons.map((p, index) => (
      <Button key={index} variant="outline" size="sm" onClick={() => handleExamplePromptClick(p.promptName)} disabled={isProcessing} className="text-xs px-2 py-1 h-auto" title={p.title}>
        <p.icon className="mr-1.5 h-3 w-3" />
        {p.title}
      </Button>
    ))
  );

  return (
    <Card className="flex flex-col h-full min-h-[650px]">
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
      <CardContent ref={cardContentRef} className="flex-grow overflow-y-auto p-4 space-y-4">
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
            <div className="flex flex-wrap gap-2">{renderPromptButtons(exampleButtons)}</div>
        </div>
        <form onSubmit={handleFormSubmit} className="w-full flex items-center space-x-2">
          <Input value={fsmUserInput} onChange={(e) => dispatchChatbotFsmEvent({ type: 'USER_INPUT_CHANGED', payload: e.target.value })} placeholder={`Ask about ${currentTickerForDisplay || 'the stock'}...`} disabled={isProcessing} className="flex-grow" onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFormSubmit(); }}} />
          <Button type="submit" disabled={isProcessing || !fsmUserInput.trim()}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
