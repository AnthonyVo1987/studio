
'use client';

import React, { useState, useCallback, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { sdkDebugChatAction } from '@/actions/sdk-debug-chat-action';
import type { RawDebugChatActionState, RawDebugChatInputs } from '@/ai/schemas/raw-debug-chat-schemas';
import { Bug, Loader2, Copy, ShieldAlert, SearchCode, Search, Send, Timer, CandlestickChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { copyToClipboard } from '@/lib/export-utils';

const initialActionState: RawDebugChatActionState = {
  status: 'idle',
};

export function SdkDebugChatbot({ title, description, promptType }: { title: string; description: string; promptType: 'sdk-app-data' | 'sdk-web-search' }) {
  const { toast } = useToast();
  // Removed userInput state as it's no longer needed for the web search variant
  
  // Use simple state for deterministic control
  const [actionResult, setActionResult] = useState<RawDebugChatActionState>(initialActionState);
  const [isPending, setIsPending] = useState(false);
  const [activeRequest, setActiveRequest] = useState<string | null>(null);

  const handleActionSubmit = useCallback(async (payload: RawDebugChatInputs) => {
    setIsPending(true);
    setActiveRequest(payload.promptType); // Track which button is active
    setActionResult(initialActionState); // Clear previous result

    try {
      const result = await sdkDebugChatAction({ status: 'idle' }, payload);
      setActionResult(result);
      if (result.status === 'error') {
        toast({
          variant: 'destructive',
          title: `SDK Debug Failed: ${result.message || 'An error occurred.'}`,
          description: result.error,
        });
      } else {
        toast({
          title: 'SDK Debug Success',
          description: result.message,
        });
      }
    } catch (e: any) {
      const errorMsg = e.message || "An unexpected error occurred.";
      setActionResult({
        status: 'error',
        error: errorMsg,
        message: 'The server action threw an exception.',
      });
      toast({
        variant: 'destructive',
        title: 'Critical Action Failure',
        description: errorMsg,
      });
    } finally {
      setIsPending(false);
      setActiveRequest(null); // Clear active request tracker
    }
  }, [toast]);

  const handleCopy = async () => {
    if (!actionResult?.data) return;
    try {
      const dataToCopy = { 
        request: JSON.parse(actionResult.data.requestJson), 
        response: JSON.parse(actionResult.data.responseJson) 
      };
      if (await copyToClipboard(JSON.stringify(dataToCopy, null, 2))) {
        toast({ title: 'Copied to Clipboard' });
      } else throw new Error("Clipboard API failed.");
    } catch {
      toast({ variant: "destructive", title: "Copy Failed" });
    }
  };

  const renderButtons = () => {
    if (promptType === 'sdk-web-search') {
      return (
        <div className="flex flex-col gap-2">
           <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleActionSubmit({ promptType: 'sdk-support-resistance-web-search' }); }}>
            <Button type="submit" variant="secondary" disabled={isPending} className="w-full justify-start">
               {isPending && activeRequest === 'sdk-support-resistance-web-search' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CandlestickChart className="mr-2 h-4 w-4" />}
              Run SDK S/R Web Search
            </Button>
          </form>
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleActionSubmit({ promptType: 'sdk-ta-web-search' }); }}>
            <Button type="submit" variant="secondary" disabled={isPending} className="w-full justify-start">
               {isPending && activeRequest === 'sdk-ta-web-search' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchCode className="mr-2 h-4 w-4" />}
              Run SDK TA Web Search
            </Button>
          </form>
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleActionSubmit({ promptType: 'sdk-options-web-search' }); }}>
            <Button type="submit" variant="secondary" disabled={isPending} className="w-full justify-start">
               {isPending && activeRequest === 'sdk-options-web-search' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Run SDK Options Web Search
            </Button>
          </form>
          {/* The user input form for sdk-user-web-search has been removed to fix the UI inconsistency */}
        </div>
      );
    }
    return (
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleActionSubmit({ promptType: 'sdk-app-data' }); }}>
        <Button type="submit" variant="secondary" disabled={isPending} className="w-full justify-start">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
          Run SDK Debug Prompt
        </Button>
      </form>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderButtons()}
        <Button variant="outline" onClick={handleCopy} disabled={!actionResult?.data}>
          <Copy className="mr-2 h-4 w-4" /> Copy Full Result JSON
        </Button>
        <Separator />
        <div>
          <h4 className="text-sm font-semibold mb-2">Request JSON</h4>
          <Textarea readOnly value={actionResult?.data?.requestJson || '{ "status": "not_run" }'} className="h-24 font-code text-xs bg-muted/30"/>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Response JSON</h4>
          <Textarea readOnly value={actionResult?.data?.responseJson || '{ "status": "not_run" }'} className="h-48 font-code text-xs bg-muted/30"/>
        </div>
      </CardContent>
    </Card>
  );
}
