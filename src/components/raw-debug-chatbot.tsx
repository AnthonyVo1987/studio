
'use client';

import React from 'react';
import { useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { rawDebugChatAction, type RawDebugChatActionState } from '@/actions/raw-debug-chat-action';
import { Bug, Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { copyToClipboard } from '@/lib/export-utils';


interface RawDebugChatbotProps {
  title: string;
  description: string;
  promptType: 'app-data' | 'web-search';
}

const initialState: RawDebugChatActionState = {
  status: 'idle',
};

export function RawDebugChatbot({ title, description, promptType }: RawDebugChatbotProps) {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(rawDebugChatAction, initialState);

  React.useEffect(() => {
    if (state.status === 'error' && state.error) {
      toast({
        variant: 'destructive',
        title: `Raw Debug Failed: ${state.message || 'An error occurred.'}`,
        description: state.error,
      });
    } else if (state.status === 'success' && state.message) {
      toast({
        title: 'Raw Debug Success',
        description: state.message,
      });
    }
  }, [state, toast]);

  const handleCopy = async () => {
    if (!state.data) {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'No data to copy.' });
      return;
    }
    const dataToCopy = {
      request: JSON.parse(state.data.requestJson),
      response: JSON.parse(state.data.responseJson),
    };
    const success = await copyToClipboard(JSON.stringify(dataToCopy, null, 2));
    if (success) {
      toast({ title: 'Copied to Clipboard', description: 'Raw debug data copied as JSON.' });
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy debug data.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
            <form action={() => formAction({ promptType })}>
                <Button type="submit" variant="destructive" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bug className="mr-2 h-4 w-4" />}
                    Run Raw Debug Prompt
                </Button>
            </form>
            <Button variant="outline" onClick={handleCopy} disabled={!state.data}>
                <Copy className="mr-2 h-4 w-4" /> Copy JSON
            </Button>
        </div>
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
