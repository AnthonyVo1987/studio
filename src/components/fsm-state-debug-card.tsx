
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { useStockAnalysis, type GlobalFsmState, type GlobalFsmFlags, type GlobalFsmContextVariables } from '@/contexts/stock-analysis-context';
import { downloadJson, copyToClipboard } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { ClipboardCopy, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CONSOLE_HEIGHT_PX = 250;
export const FSM_CARD_HEIGHT_PX = 200;

interface FsmStateDisplayProps {
  title: string;
  previousState: GlobalFsmState | null;
  currentState: GlobalFsmState;
  targetState: GlobalFsmState | null;
}

function GlobalFsmStateDisplay({ title, previousState, currentState, targetState }: FsmStateDisplayProps) {
  return (
    <div className="p-2 border rounded-md bg-muted/30">
      <p className="text-sm font-semibold mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Prev:</span> {previousState || 'N/A'} |{' '}
        <span className="font-medium text-foreground">Curr:</span> {currentState} |{' '}
        <span className="font-medium">Target:</span> {targetState || 'N/A'}
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
    fsmFlags,
    fsmVariables,
    isClientDebugConsoleEnabled,
    isClientDebugConsoleOpen,
    logDebug,
  } = useStockAnalysis();

  const { toast } = useToast();

  if (!isFsmDebugCardEnabled || !isFsmDebugCardOpen) {
    return null;
  }

  const allGlobalFsmDataForExport = {
    timestamp: new Date().toISOString(),
    globalApplicationFSM: {
      previous: globalPreviousFsmState,
      current: globalFsmState,
      target: globalTargetFsmDisplayState,
    },
    globalFsmFlags: fsmFlags,
    globalFsmContextVariables: fsmVariables,
  };

  const handleCopyJson = async () => {
    logDebug('FsmStateDebugCard', 'CopyAction', 'Copying Global FSM state, flags, and variables as JSON.');
    if (await copyToClipboard(JSON.stringify(allGlobalFsmDataForExport, null, 2))) {
      toast({ title: 'Global FSM Data Copied', description: 'Global FSM state, flags, and variables copied as JSON.' });
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy Global FSM data.' });
    }
  };

  const handleExportJson = () => {
    logDebug('FsmStateDebugCard', 'ExportAction', 'Exporting Global FSM state, flags, and variables as JSON.');
    try {
      downloadJson(allGlobalFsmDataForExport, 'stocksage_global_fsm_snapshot.json');
      toast({ title: 'Global FSM Data Exported', description: 'Global FSM state, flags, and variables downloaded as JSON.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export Global FSM data.' });
    }
  };

  const renderVariables = (variables: GlobalFsmContextVariables) => {
    return Object.entries(variables).map(([key, value]) => (
      <TableRow key={`var-${key}`}>
        <TableCell className="font-medium py-1 px-2 text-xs break-all">{key}</TableCell>
        <TableCell className="py-1 px-2 text-xs break-all">
          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? 'null')}
        </TableCell>
      </TableRow>
    ));
  };

  const renderFlags = (flags: GlobalFsmFlags) => {
    return Object.entries(flags).map(([key, value]) => (
      <TableRow key={`flag-${key}`}>
        <TableCell className="font-medium py-1 px-2 text-xs break-all">{key}</TableCell>
        <TableCell className="py-1 px-2 text-xs break-all">{String(value)}</TableCell>
      </TableRow>
    ));
  };


  return (
    <Card
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t-2 shadow-xl bg-background/95 backdrop-blur-sm',
        'transition-all duration-300 ease-in-out'
      )}
      style={{
        transform: (isClientDebugConsoleEnabled && isClientDebugConsoleOpen) ? `translateY(-${CONSOLE_HEIGHT_PX}px)` : `translateY(0px)`,
        height: `${FSM_CARD_HEIGHT_PX}px`
      }}
    >
      <CardHeader className="p-2 border-b">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 flex-shrink min-w-0">
            <CardTitle className="text-sm truncate">Global FSM Monitor</CardTitle>
            <CardDescription className="text-xs whitespace-nowrap truncate">
              State, Flags, and Variables
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleCopyJson} title="Copy Global FSM Data (JSON)" className="h-7 w-7">
              <ClipboardCopy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleExportJson} title="Export Global FSM Data (JSON)" className="h-7 w-7">
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
            <GlobalFsmStateDisplay
                title="Global Application FSM"
                previousState={globalPreviousFsmState}
                currentState={globalFsmState}
                targetState={globalTargetFsmDisplayState}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <Card className="overflow-hidden">
                <CardHeader className="p-1.5 border-b bg-muted/40">
                  <CardTitle className="text-xs font-semibold">Global FSM Flags</CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[80px] overflow-y-auto">
                  <Table> {/* Removed dense prop */}
                    <TableBody>{renderFlags(fsmFlags)}</TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <CardHeader className="p-1.5 border-b bg-muted/40">
                  <CardTitle className="text-xs font-semibold">Global FSM Variables</CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[80px] overflow-y-auto">
                  <Table> {/* Removed dense prop */}
                    <TableBody>{renderVariables(fsmVariables)}</TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
