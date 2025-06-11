
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useStockAnalysis } from '@/contexts/stock-analysis-context';
import { globalLogEntries, clearGlobalLogBuffer, type GlobalLogEntry } from '@/lib/global-log-buffer';
import { downloadJson, copyToClipboard } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { ClipboardCopy, Download, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logSourceLabels, type LogSourceId } from '@/lib/debug-log-types';


export const CONSOLE_HEIGHT_PX = 250;
const POLLING_INTERVAL_MS = 750;
const MAX_DISPLAYED_LOGS = 200;

function formatLogMessage(messages: any[]): string {
  return messages
    .map((msg) => {
      if (typeof msg === 'string') return msg;
      if (typeof msg === 'object' && msg !== null) {
        try {
          return JSON.stringify(msg);
        } catch {
          return String(msg);
        }
      }
      return String(msg);
    })
    .join(' ');
}

export function DebugConsole() {
  const {
    isClientDebugConsoleOpen,
    setClientDebugConsoleOpen,
    isClientDebugConsoleEnabled,
  } = useStockAnalysis();
  const { toast } = useToast();
  const [displayedLogs, setDisplayedLogs] = useState<GlobalLogEntry[]>([]);

  const fetchAndUpdateLogs = useCallback(() => {
    if (!isClientDebugConsoleOpen || !isClientDebugConsoleEnabled) return;

    const newLogs = globalLogEntries.slice(Math.max(0, globalLogEntries.length - MAX_DISPLAYED_LOGS));
    if (newLogs.length !== displayedLogs.length || (newLogs.length > 0 && newLogs[newLogs.length -1].id !== displayedLogs[displayedLogs.length-1]?.id)) {
       setDisplayedLogs(newLogs);
    }
  }, [isClientDebugConsoleOpen, isClientDebugConsoleEnabled, displayedLogs.length]);


  useEffect(() => {
    if (isClientDebugConsoleOpen && isClientDebugConsoleEnabled) {
      fetchAndUpdateLogs();
      const intervalId = setInterval(fetchAndUpdateLogs, POLLING_INTERVAL_MS);
      return () => clearInterval(intervalId);
    }
  }, [isClientDebugConsoleOpen, isClientDebugConsoleEnabled, fetchAndUpdateLogs]);

  if (!isClientDebugConsoleEnabled || !isClientDebugConsoleOpen) {
    return null;
  }

  const handleClearLogs = () => {
    clearGlobalLogBuffer();
    setDisplayedLogs([]);
    toast({ title: 'Logs Cleared', description: 'Client debug logs have been cleared.' });
  };

  const handleCopyLogs = () => {
    if (copyToClipboard(JSON.stringify(displayedLogs, null, 2))) {
      toast({ title: 'Logs Copied', description: 'Displayed client logs copied to clipboard as JSON.' });
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy client logs.' });
    }
  };

  const handleExportLogs = () => {
    try {
      downloadJson(displayedLogs, 'stocksage_client_logs.json');
      toast({ title: 'Logs Exported', description: 'Displayed client logs downloaded as JSON.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export client logs.' });
      browserConsole.error('[DebugConsole] Export error:', error);
    }
  };

  const getSourceLabel = (source?: LogSourceId): string => {
    if (!source) return '';
    return `[${logSourceLabels[source] || source}] `;
  };

  return (
    <Card
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t-2 shadow-2xl bg-background/95 backdrop-blur-sm',
        'transition-all duration-300 ease-in-out'
      )}
      style={{ height: `${CONSOLE_HEIGHT_PX}px` }}
    >
      <CardHeader className="p-2 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Client Debug Console</CardTitle>
            <CardDescription className="text-xs">({displayedLogs.length} entries)</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleCopyLogs} title="Copy Logs (JSON)" className="h-7 w-7">
              <ClipboardCopy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleExportLogs} title="Export Logs (JSON)" className="h-7 w-7">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClearLogs} title="Clear Logs" className="h-7 w-7">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" onClick={() => setClientDebugConsoleOpen(false)} title="Close Console" className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-53px)]">
        <ScrollArea className="h-full p-2">
          {displayedLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No client logs yet. Enable logging sources or use console.log().
            </div>
          ) : (
            <div className="space-y-1 font-code text-xs">
              {displayedLogs.map((log) => (
                <div key={log.id} className="flex items-start">
                  <span className="text-muted-foreground/70 mr-1 whitespace-nowrap">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span
                    className={cn('mr-1 font-semibold uppercase', {
                      'text-yellow-500 dark:text-yellow-400': log.type === 'warn',
                      'text-red-500 dark:text-red-400': log.type === 'error',
                      'text-blue-500 dark:text-blue-400': log.type === 'info',
                      'text-purple-500 dark:text-purple-400': log.type === 'debug',
                      'text-gray-500 dark:text-gray-400': log.type === 'log',
                    })}
                  >
                    [{log.type}]
                  </span>
                  <span className="text-muted-foreground/80 mr-1">{getSourceLabel(log.source)}</span>
                  <span className="whitespace-pre-wrap break-all">{formatLogMessage(log.messages)}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
