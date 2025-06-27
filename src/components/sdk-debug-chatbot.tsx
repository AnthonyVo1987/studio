'use client';

import React, { useState, useReducer, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { sdkDebugChatAction } from '@/actions/sdk-debug-chat-action';
import type { RawDebugChatActionState, RawDebugChatInputs } from '@/ai/schemas/raw-debug-chat-schemas';
import { Bug, Loader2, Copy, ShieldAlert, SearchCode, Search, Send, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { copyToClipboard } from '@/lib/export-utils';
import { extractJsonString } from '@/lib/string-utils';

const POLLING_INTERVAL_MS = 5000;
const INITIAL_DELAY_MS = 5000;
const MAX_RETRIES = 5;

// --- Local FSM Definition ---
type FsmState = 'IDLE' | 'AWAITING_RESPONSE' | 'POLLING' | 'COMPLETE' | 'ERROR' | 'TIMED_OUT';
type FsmAction =
  | { type: 'SUBMIT'; payload: RawDebugChatInputs }
  | { type: 'RESPONSE_RECEIVED'; payload: RawDebugChatActionState }
  | { type: 'RETRY_POLL' }
  | { type: 'TIMEOUT' };

interface LocalFsmState {
  fsmState: FsmState;
  retries: number;
  serverResponse: RawDebugChatActionState | null;
  activePrompt: RawDebugChatInputs | null;
}

const initialLocalFsmState: LocalFsmState = {
  fsmState: 'IDLE',
  retries: 0,
  serverResponse: null,
  activePrompt: null,
};

function localFsmReducer(state: LocalFsmState, action: FsmAction): LocalFsmState {
  console.log(`[SdkDebugChatbot:FSM] Event: ${action.type}, FromState: ${state.fsmState}, Retries: ${state.retries}`);
  switch (action.type) {
    case 'SUBMIT':
      return { ...initialLocalFsmState, fsmState: 'AWAITING_RESPONSE', activePrompt: action.payload };
    case 'RESPONSE_RECEIVED':
      const { payload } = action;
      if (payload.status === 'error') {
        return { ...state, fsmState: 'ERROR', serverResponse: payload };
      }
      try {
        const responseJson = JSON.parse(payload.data?.responseJson || '{}');
        const textResponse = responseJson.response || "";
        const extractedJsonString = extractJsonString(textResponse);
        
        if (extractedJsonString) {
          const innerJson = JSON.parse(extractedJsonString);
          if (innerJson.searchStatus === 'COMPLETE') {
            return { ...state, fsmState: 'COMPLETE', serverResponse: payload };
          }
          if ((innerJson.searchStatus === 'PARTIAL' || innerJson.searchStatus === 'NOT_FOUND') && state.retries < MAX_RETRIES) {
            return { ...state, fsmState: 'POLLING', retries: state.retries + 1, serverResponse: payload };
          }
        }
      } catch (e) { /* Fall through if parsing fails */ }
      
      return { ...state, fsmState: 'COMPLETE', serverResponse: payload };
    case 'RETRY_POLL':
      return { ...state, fsmState: 'AWAITING_RESPONSE' }; // Will trigger a re-fetch
    case 'TIMEOUT':
      let finalResponse = state.serverResponse;
      if (finalResponse?.data?.responseJson) {
        try {
          const parsed = JSON.parse(finalResponse.data.responseJson);
          if (parsed.response) {
            const innerJson = JSON.parse(extractJsonString(parsed.response) || "{}");
            innerJson.searchStatus = 'WEB_SEARCH_TIMEOUT';
            parsed.response = JSON.stringify(innerJson, null, 2);
            finalResponse.data.responseJson = JSON.stringify(parsed, null, 2);
          }
        } catch(e){}
      }
      return { ...state, fsmState: 'TIMED_OUT', serverResponse: finalResponse };
    default:
      return state;
  }
}
// --- End FSM Definition ---

export function SdkDebugChatbot({ title, description, promptType }: { title: string; description: string; promptType: 'sdk-app-data' | 'sdk-web-search' }) {
  const { toast } = useToast();
  const [userInput, setUserInput] = useState('');
  const [localFsm, dispatch] = useReducer(localFsmReducer, initialLocalFsmState);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Manual state management for the server action
  const [actionResult, setActionResult] = useState<RawDebugChatActionState>({ status: 'idle' });
  const [isPending, setIsPending] = useState(false);

  const handleActionSubmit = async (payload: RawDebugChatInputs) => {
    setIsPending(true);
    const result = await sdkDebugChatAction({ status: 'idle' }, payload);
    setActionResult(result);
    setIsPending(false);
  };

  // Effect to link server action state back to local FSM, with initial delay
  useEffect(() => {
    if (actionResult.status === 'idle') return;

    if (localFsm.fsmState === 'AWAITING_RESPONSE') {
      const isFirstResponse = localFsm.retries === 0;
      const delayMs = isFirstResponse ? INITIAL_DELAY_MS : 0;
      
      if (delayMs > 0) {
        console.log(`[SdkDebugChatbot:Effect] Received new server state. Starting ${delayMs}ms delay before processing.`);
      }

      const processingTimeout = setTimeout(() => {
        if (delayMs > 0) {
          console.log(`[SdkDebugChatbot:Effect] ${delayMs}ms delay complete. Dispatching RESPONSE_RECEIVED to local FSM.`);
        }
        dispatch({ type: 'RESPONSE_RECEIVED', payload: actionResult });
      }, delayMs);

      return () => clearTimeout(processingTimeout);
    }
  }, [actionResult, localFsm.fsmState, localFsm.retries]);


  // Effect to handle polling
  useEffect(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    
    if (localFsm.fsmState === 'POLLING') {
      if (localFsm.retries >= MAX_RETRIES) {
        dispatch({ type: 'TIMEOUT' });
      } else {
        pollingTimeoutRef.current = setTimeout(() => {
          dispatch({ type: 'RETRY_POLL' });
        }, POLLING_INTERVAL_MS);
      }
    }

    return () => {
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, [localFsm.fsmState, localFsm.retries]);

  // Effect to re-trigger action on poll or initial submit
  useEffect(() => {
    if (localFsm.fsmState === 'AWAITING_RESPONSE' && localFsm.activePrompt) {
      handleActionSubmit(localFsm.activePrompt);
    }
  }, [localFsm.fsmState, localFsm.activePrompt]);


  const handleCopy = async () => {
    if (!localFsm.serverResponse?.data) return;
    try {
      const dataToCopy = { request: JSON.parse(localFsm.serverResponse.data.requestJson), response: JSON.parse(localFsm.serverResponse.data.responseJson) };
      if (await copyToClipboard(JSON.stringify(dataToCopy, null, 2))) {
        toast({ title: 'Copied to Clipboard' });
      } else throw new Error("Clipboard API failed.");
    } catch {
      toast({ variant: "destructive", title: "Copy Failed" });
    }
  };

  const isUiPending = localFsm.fsmState === 'AWAITING_RESPONSE' || localFsm.fsmState === 'POLLING' || isPending;
  
  const renderButtons = () => {
    if (promptType === 'sdk-web-search') {
      return (
        <div className="flex flex-col gap-2">
          <form onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'SUBMIT', payload: { promptType: 'sdk-web-search' } }); }}>
            <Button type="submit" variant="secondary" disabled={isUiPending} className="w-full justify-start">
              {isUiPending && localFsm.activePrompt?.promptType === 'sdk-web-search' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bug className="mr-2 h-4 w-4" />}
              Run SDK Debug Prompt
            </Button>
          </form>
          <form onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'SUBMIT', payload: { promptType: 'sdk-ta-web-search' } }); }}>
            <Button type="submit" variant="secondary" disabled={isUiPending} className="w-full justify-start">
              {isUiPending && localFsm.activePrompt?.promptType === 'sdk-ta-web-search' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchCode className="mr-2 h-4 w-4" />}
              Run SDK TA Web Search
            </Button>
          </form>
          <form onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'SUBMIT', payload: { promptType: 'sdk-options-web-search' } }); }}>
            <Button type="submit" variant="secondary" disabled={isUiPending} className="w-full justify-start">
              {isUiPending && localFsm.activePrompt?.promptType === 'sdk-options-web-search' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Run SDK Options Web Search
            </Button>
          </form>
          <form onSubmit={(e) => { e.preventDefault(); if (!isUiPending && userInput.trim()) { dispatch({ type: 'SUBMIT', payload: { promptType: 'sdk-user-web-search', userInput } }); } }} className="w-full flex items-center space-x-2 pt-2">
            <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter custom web search..."
                disabled={isUiPending}
            />
            <Button type="submit" disabled={isUiPending || !userInput.trim()}>
                {isUiPending && localFsm.activePrompt?.promptType === 'sdk-user-web-search' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      );
    }
    return (
      <form onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'SUBMIT', payload: { promptType: 'sdk-app-data' } }); }}>
        <Button type="submit" variant="secondary" disabled={isUiPending} className="w-full justify-start">
          {isUiPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
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
        <Button variant="outline" onClick={handleCopy} disabled={!localFsm.serverResponse?.data}>
          <Copy className="mr-2 h-4 w-4" /> Copy Full Result JSON
        </Button>
        {localFsm.fsmState === 'POLLING' && (
          <div className="flex items-center text-sm text-amber-500 bg-amber-500/10 p-2 rounded-md border border-amber-500/20">
            <Timer className="mr-2 h-4 w-4 animate-pulse"/>
            Polling for complete response... Retry {localFsm.retries}/{MAX_RETRIES}
          </div>
        )}
        <Separator />
        <div>
          <h4 className="text-sm font-semibold mb-2">Request JSON</h4>
          <Textarea readOnly value={localFsm.serverResponse?.data?.requestJson || '{ "status": "not_run" }'} className="h-24 font-code text-xs bg-muted/30"/>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Response JSON</h4>
          <Textarea readOnly value={localFsm.serverResponse?.data?.responseJson || '{ "status": "not_run" }'} className="h-48 font-code text-xs bg-muted/30"/>
        </div>
      </CardContent>
    </Card>
  );
}
