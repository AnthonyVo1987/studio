
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useStockAnalysis, type LogEntry } from '@/contexts/stock-analysis-context';
import { downloadJson, copyToClipboard } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { ClipboardCopy, Download, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CONSOLE_HEIGHT_PX = 250; // For layout adjustment

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
    clientLogs,
    clearClientLogs,
    isClientDebugConsoleOpen,
    setClientDebugConsoleOpen,
    isClientDebugConsoleEnabled,
  } = useStockAnalysis();
  const { toast } = useToast();

  if (!isClientDebugConsoleEnabled || !isClientDebugConsoleOpen) {
    return null;
  }

  const handleCopyLogs = () => {
    if (copyToClipboard(JSON.stringify(clientLogs, null, 2))) {
      toast({ title: 'Logs Copied', description: 'Client logs copied to clipboard as JSON.' });
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy client logs.' });
    }
  };

  const handleExportLogs = () => {
    try {
      downloadJson(clientLogs, 'stocksage_client_logs.json');
      toast({ title: 'Logs Exported', description: 'Client logs downloaded as JSON.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export client logs.' });
      console.error('[DebugConsole] Export error:', error);
    }
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
            <CardDescription className="text-xs">({clientLogs.length} entries)</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleCopyLogs} title="Copy Logs (JSON)" className="h-7 w-7">
              <ClipboardCopy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleExportLogs} title="Export Logs (JSON)" className="h-7 w-7">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={clearClientLogs} title="Clear Logs" className="h-7 w-7">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" onClick={() => setClientDebugConsoleOpen(false)} title="Close Console" className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-53px)]"> {/* Header height approx 53px */}
        <ScrollArea className="h-full p-2">
          {clientLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No client logs yet.
            </div>
          ) : (
            <div className="space-y-1 font-code text-xs">
              {clientLogs.map((log) => (
                <div key={log.id} className="flex items-start">
                  <span className="text-muted-foreground/70 mr-2 whitespace-nowrap">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span
                    className={cn('mr-2 font-semibold uppercase', {
                      'text-yellow-500 dark:text-yellow-400': log.type === 'warn',
                      'text-red-500 dark:text-red-400': log.type === 'error',
                      'text-blue-500 dark:text-blue-400': log.type === 'info',
                      'text-purple-500 dark:text-purple-400': log.type === 'debug',
                      'text-gray-500 dark:text-gray-400': log.type === 'log',
                    })}
                  >
                    [{log.type}]
                  </span>
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
