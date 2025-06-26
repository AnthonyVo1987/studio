'use client';

import React, { useState } from 'react';
import { useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { sdkDebugChatAction } from '@/actions/sdk-debug-chat-action';
import type { RawDebugChatActionState } from '@/ai/schemas/raw-debug-chat-schemas';
import { Bug, Loader2, Copy, ShieldAlert, SearchCode, Search, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { copyToClipboard } from '@/lib/export-utils';

interface SdkDebugChatbotProps {
  title: string;
  description: string;
  promptType: 'sdk-app-data' | 'sdk-web-search';
}

const initialState: RawDebugChatActionState = {
  status: 'idle',
};

export function SdkDebugChatbot({ title, description, promptType }: SdkDebugChatbotProps) {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(sdkDebugChatAction, initialState);
  const [userInput, setUserInput] = useState('');

  React.useEffect(() => {
    if (state.status === 'error' && state.error) {
      toast({
        variant: 'destructive',
        title: `SDK Debug Failed: ${state.message || 'An error occurred.'}`,
        description: state.error,
      });
    } else if (state.status === 'success' && state.message) {
      toast({
        title: 'SDK Debug Success',
        description: state.message,
      });
    }
  }, [state, toast]);

  const handleCopy = async () => {
    if (!state.data) {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'No data to copy.' });
      return;
    }
    try {
        const dataToCopy = {
            request: JSON.parse(state.data.requestJson),
            response: JSON.parse(state.data.responseJson),
        };
        const success = await copyToClipboard(JSON.stringify(dataToCopy, null, 2));
        if (success) {
            toast({ title: 'Copied to Clipboard', description: 'SDK debug data copied as JSON.' });
        } else {
            throw new Error("Clipboard API failed.");
        }
    } catch (e) {
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy SDK debug data due to invalid JSON in response." });
    }
  };

  const renderWebSearchButtons = () => (
    <>
      <form action={() => formAction({ promptType: 'sdk-web-search' })}>
        <Button type="submit" variant="secondary" disabled={isPending} title="What's the current ATR-14 for NVDA" className="w-full justify-start">
          {isPending && state.data?.requestJson.includes('sdk_web_search') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bug className="mr-2 h-4 w-4" />}
          Run SDK Debug Prompt
        </Button>
      </form>
      <form action={() => formAction({ promptType: 'sdk-ta-web-search' })}>
        <Button type="submit" variant="secondary" disabled={isPending} className="w-full justify-start">
          {isPending && state.data?.requestJson.includes('sdk-ta-web-search') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchCode className="mr-2 h-4 w-4" />}
          Run SDK TA Web Search
        </Button>
      </form>
      <form action={() => formAction({ promptType: 'sdk-options-web-search' })}>
        <Button type="submit" variant="secondary" disabled={isPending} className="w-full justify-start">
          {isPending && state.data?.requestJson.includes('sdk-options-web-search') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Run SDK Options Web Search
        </Button>
      </form>
      <form action={() => formAction({ promptType: 'sdk-user-web-search', userInput })} className="w-full flex items-center space-x-2 pt-2">
        <Input value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Enter custom web search prompt..." disabled={isPending} className="flex-grow" />
        <Button type="submit" disabled={isPending || !userInput.trim()}>
            {isPending && state.data?.requestJson.includes('sdk-user-web-search') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          {promptType === 'sdk-app-data' ? (
            <form action={() => formAction({ promptType: 'sdk-app-data' })}>
              <Button type="submit" variant="secondary" disabled={isPending} className="w-full justify-start">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                  Run SDK Debug Prompt
              </Button>
            </form>
          ) : (
            renderWebSearchButtons()
          )}
        </div>
        <Button variant="outline" onClick={handleCopy} disabled={!state.data}>
            <Copy className="mr-2 h-4 w-4" /> Copy Full Result JSON
        </Button>
        <Separator />
        <div>
          <h4 className="text-sm font-semibold mb-2">Request JSON</h4>
          <Textarea
            readOnly
            value={state.data?.requestJson || '{ "status": "not_run" }'}
            className="h-24 font-code text-xs bg-muted/30"
          />
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Response JSON</h4>
          <Textarea
            readOnly
            value={state.data?.responseJson || '{ "status": "not_run" }'}
            className="h-48 font-code text-xs bg-muted/30"
          />
        </div>
      </CardContent>
    </Card>
  );
}
