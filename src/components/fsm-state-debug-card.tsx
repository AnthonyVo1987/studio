
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useStockAnalysis, type FsmDisplayTuple } from '@/contexts/stock-analysis-context';
import { downloadJson, copyToClipboard } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { ClipboardCopy, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FSM_CARD_HEIGHT_PX = 200;

interface FsmStateDisplayProps {
  title: string;
  fsmTuple: FsmDisplayTuple;
}

function FsmStateDisplay({ title, fsmTuple }: FsmStateDisplayProps) {
  return (
    <div className="p-2 border rounded-md bg-muted/30">
      <p className="text-sm font-semibold mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Prev:</span> {fsmTuple.previous || 'N/A'} |{' '}
        <span className="font-medium text-foreground">Curr:</span> {fsmTuple.current || 'N/A'} |{' '}
        <span className="font-medium">Target:</span> {fsmTuple.target || 'N/A'}
      </p>
    </div>
  );
}

export function FsmStateDebugCard() {
  const {
    isFsmDebugCardEnabled,
    isFsmDebugCardOpen,
    setFsmDebugCardOpen,
    fsmState: globalFsmState,
    previousFsmState: globalPreviousFsmState,
    targetFsmDisplayState: globalTargetFsmDisplayState,
    mainTabFsmDisplay,
    chatbotFsmDisplay,
    debugConsoleMenuFsmDisplay,
    logDebug,
  } = useStockAnalysis();
  const { toast } = useToast();

  if (!isFsmDebugCardEnabled || !isFsmDebugCardOpen) {
    return null;
  }

  const allFsmStates = {
    timestamp: new Date().toISOString(),
    globalApplicationFSM: {
        previous: globalPreviousFsmState,
        current: globalFsmState,
        target: globalTargetFsmDisplayState,
    },
    mainTabUI_FSM: mainTabFsmDisplay,
    chatbotUI_FSM: chatbotFsmDisplay,
    debugConsoleMenuUI_FSM: debugConsoleMenuFsmDisplay,
  };

  const handleCopyJson = async () => {
    logDebug('FsmStateDebugCard', 'CopyAction', 'Copying FSM states as JSON.');
    if (await copyToClipboard(JSON.stringify(allFsmStates, null, 2))) {
      toast({ title: 'FSM States Copied', description: 'All FSM states copied to clipboard as JSON.' });
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy FSM states.' });
    }
  };

  const handleExportJson = () => {
    logDebug('FsmStateDebugCard', 'ExportAction', 'Exporting FSM states as JSON.');
    try {
      downloadJson(allFsmStates, 'stocksage_fsm_states.json');
      toast({ title: 'FSM States Exported', description: 'All FSM states downloaded as JSON.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export FSM states.' });
    }
  };

  return (
    <Card
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t-2 shadow-xl bg-background/95 backdrop-blur-sm',
        'transition-all duration-300 ease-in-out'
      )}
      style={{ transform: `translateY(-${250}px)`, height: `${FSM_CARD_HEIGHT_PX}px` }}
    >
      <CardHeader className="p-2 border-b">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 flex-shrink min-w-0">
            <CardTitle className="text-sm truncate">FSM States Monitor</CardTitle>
            <CardDescription className="text-xs whitespace-nowrap truncate">
              Live states of all major Finite State Machines
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleCopyJson} title="Copy FSM States (JSON)" className="h-7 w-7">
              <ClipboardCopy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleExportJson} title="Export FSM States (JSON)" className="h-7 w-7">
              <Download className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" onClick={() => setFsmDebugCardOpen(false)} title="Close FSM Monitor" className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-53px)]">
        <ScrollArea className="h-full p-2">
          <div className="space-y-2 font-code text-xs">
            <FsmStateDisplay title="Global Application FSM" fsmTuple={{previous: globalPreviousFsmState, current: globalFsmState, target: globalTargetFsmDisplayState}} />
            <FsmStateDisplay title="Main Tab UI FSM" fsmTuple={mainTabFsmDisplay} />
            <FsmStateDisplay title="Chatbot UI FSM" fsmTuple={chatbotFsmDisplay} />
            <FsmStateDisplay title="Debug Console Menu FSM" fsmTuple={debugConsoleMenuFsmDisplay} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

    