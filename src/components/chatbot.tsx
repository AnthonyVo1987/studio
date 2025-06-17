
"use client";

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useStockAnalysis, type ChatMessage } from '@/contexts/stock-analysis-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
// Example prompts will be loaded from JSON
import exampleChatPromptsData from '@/ai/prompts/example-chat-prompts.json';
import type { ExampleChatPrompt, ExampleChatPromptsFile } from '@/ai/prompt-loader';

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
import { useChatbotFsm, ChatbotFsmInternalState } from '@/contexts/chatbot-fsm-context';

interface ChatbotProps {
  isAnyAnalysisInProgress: boolean;
  currentTickerForDisplay: string;
}

// Cast the imported JSON data to the correct type
const exampleChatPrompts: ExampleChatPromptsFile = exampleChatPromptsData as ExampleChatPromptsFile;


export function Chatbot({ isAnyAnalysisInProgress, currentTickerForDisplay }: ChatbotProps) {
  const {
    chatHistory: globalChatHistory,
    clearChatHistory: clearGlobalChatHistory,
    logDebug: globalLogDebug,
  } = useStockAnalysis();

  const {
    fsmState: chatbotFsmState,
    userInput: fsmUserInput,
    dispatchChatbotFsmEvent,
    previousChatbotFsmState,
    targetChatbotFsmDisplayState
  } = useChatbotFsm();

  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const logDebug = globalLogDebug;

  logDebug('Chatbot', 'Render', `ChatbotFSM State: Prev: ${previousChatbotFsmState || 'N/A'} | Curr: ${chatbotFsmState} | Target: ${targetChatbotFsmDisplayState || 'N/A'}, isAnyAnalysisInProgress (prop): ${isAnyAnalysisInProgress}, FSM UserInput: "${fsmUserInput.substring(0,20)}"`);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [globalChatHistory]);

  useEffect(() => {
    if (chatbotFsmState === ChatbotFsmInternalState.SUBMITTING_MESSAGE && !isAnyAnalysisInProgress) {
      logDebug('Chatbot', 'EffectOnIsAnyAnalysisInProgress', `isAnyAnalysisInProgress became false while FSM was SUBMITTING_MESSAGE. Dispatching SUBMISSION_CONCLUDED.`);
      dispatchChatbotFsmEvent({ type: 'SUBMISSION_CONCLUDED' });
    }
  }, [isAnyAnalysisInProgress, chatbotFsmState, dispatchChatbotFsmEvent, logDebug]);

  const handleFormSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    logDebug('Chatbot', 'handleFormSubmit', `Submit requested. ChatbotFSM State: ${chatbotFsmState}, FSM UserInput: "${fsmUserInput.substring(0,20)}"`);
    if (!fsmUserInput.trim() || chatbotFsmState === ChatbotFsmInternalState.SUBMITTING_MESSAGE || isAnyAnalysisInProgress) {
      logDebug('Chatbot', 'handleFormSubmit', 'Submit prevented: input empty, already submitting, or another analysis is in progress.');
      return;
    }
    dispatchChatbotFsmEvent({ type: 'SUBMIT_MESSAGE_REQUESTED' });
  }, [fsmUserInput, chatbotFsmState, dispatchChatbotFsmEvent, logDebug, isAnyAnalysisInProgress]);

  const handleExamplePromptClick = (promptTemplate: string) => {
    if (chatbotFsmState === ChatbotFsmInternalState.SUBMITTING_MESSAGE || isAnyAnalysisInProgress) return;
    const filledPrompt = promptTemplate.replace(/{TICKER}/g, currentTickerForDisplay || 'this stock');
    
    logDebug('Chatbot', 'ExamplePromptClicked', `Prompt set to: "${filledPrompt}". Dispatching USER_INPUT_CHANGED then SUBMIT_MESSAGE_REQUESTED.`);
        
    dispatchChatbotFsmEvent({ type: 'USER_INPUT_CHANGED', payload: filledPrompt });
    // Small timeout to allow state update before submitting, if necessary, though direct dispatch is usually fine
    // setTimeout(() => dispatchChatbotFsmEvent({ type: 'SUBMIT_MESSAGE_REQUESTED' }), 50);
    dispatchChatbotFsmEvent({ type: 'SUBMIT_MESSAGE_REQUESTED' }); // Direct submission
  };

  const handleCopyChat = async () => {
    if (globalChatHistory.length === 0) {
        logDebug('Chatbot', 'CopyChat', 'No history to copy.');
        return;
    }
    const success = await copyToClipboard(JSON.stringify(globalChatHistory, null, 2));
    toast({ title: success ? 'Chat Copied' : 'Copy Failed', description: success ? 'Chat history copied as JSON.' : 'Could not copy chat history.'});
    logDebug('Chatbot', 'CopyChat', success ? 'Success.' : 'Failed.');
  };

  const handleExportChat = () => {
    if (globalChatHistory.length === 0) {
        logDebug('Chatbot', 'ExportChat', 'No history to export.');
        return;
    }
    try {
      downloadJson(globalChatHistory, `${currentTickerForDisplay || 'stocksage'}_chat_history.json`);
      toast({ title: 'Chat Exported', description: 'Chat history downloaded as JSON.' });
      logDebug('Chatbot', 'ExportChat', 'Success.');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export chat history.' });
      logDebug('Chatbot', 'ExportChat', 'Error:', error);
    }
  };

  const isProcessing = chatbotFsmState === ChatbotFsmInternalState.SUBMITTING_MESSAGE || isAnyAnalysisInProgress;

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center text-lg">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            StockSage AI Chat
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Ask about {currentTickerForDisplay || "the stock"}. (Inputs disabled during analysis)
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Clear Chat History" disabled={globalChatHistory.length === 0 || isProcessing}>
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
                    <AlertDialogAction onClick={() => { clearGlobalChatHistory(); toast({title: "Chat Cleared"}); }}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          <Button variant="ghost" size="icon" onClick={handleCopyChat} title="Copy Chat (JSON)" disabled={globalChatHistory.length === 0 || isProcessing}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExportChat} title="Export Chat (JSON)" disabled={globalChatHistory.length === 0 || isProcessing}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 space-y-4 overflow-hidden">
        <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {globalChatHistory.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Try an example prompt or ask a question!
              </div>
            )}
            {globalChatHistory.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm break-words", 
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
            {isProcessing && globalChatHistory.length > 0 && globalChatHistory[globalChatHistory.length-1].role === 'user' && (
                 <div className={cn("flex w-full max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm break-words", "bg-muted")}> 
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground italic">StockSage is thinking...</span>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex flex-wrap gap-2 mb-2">
          {exampleChatPrompts.map((p: ExampleChatPrompt, index: number) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleExamplePromptClick(p.promptTemplate)}
              disabled={isProcessing}
              className="text-xs px-2 py-1 h-auto"
            >
              <HelpCircle className="mr-1.5 h-3 w-3" />
              {p.title.replace(/{TICKER}/g, currentTickerForDisplay || 'Stock')}
            </Button>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="flex items-center space-x-2 pt-2 border-t">
          <Input
            value={fsmUserInput}
            onChange={(e) => dispatchChatbotFsmEvent({ type: 'USER_INPUT_CHANGED', payload: e.target.value })}
            placeholder={`Ask about ${currentTickerForDisplay || 'the stock'}...`}
            disabled={isProcessing}
            className="flex-grow"
            onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFormSubmit(); }}}
          />
          <Button type="submit" disabled={isProcessing || !fsmUserInput.trim()}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
