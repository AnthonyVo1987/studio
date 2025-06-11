
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogEntry, useStockAnalysis } from '@/contexts/stock-analysis-context';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Trash2, Search, ClipboardCopy, Download, Terminal, CircleAlert, CircleX, Info, Bug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadJson, downloadTxt, copyToClipboard } from '@/lib/export-utils';
import { CONSOLE_HEIGHT } from '@/contexts/stock-analysis-context';

type LogTypeFilter = 'all' | 'log' | 'warn' | 'error' | 'info' | 'debug';

const logTypeStyles = {
  log: 'text-gray-500 dark:text-gray-400',
  info: 'text-blue-500 dark:text-blue-400',
  warn: 'text-yellow-500 dark:text-yellow-400',
  error: 'text-red-500 dark:text-red-400',
  debug: 'text-purple-500 dark:text-purple-400',
};

const logTypeIcons = {
    log: <Terminal className="h-4 w-4 mr-2 flex-shrink-0" />,
    info: <Info className="h-4 w-4 mr-2 flex-shrink-0" />,
    warn: <CircleAlert className="h-4 w-4 mr-2 flex-shrink-0" />,
    error: <CircleX className="h-4 w-4 mr-2 flex-shrink-0" />,
    debug: <Bug className="h-4 w-4 mr-2 flex-shrink-0" />,
};

export function DebugConsole() {
  const {
    clientLogs,
    clearClientLogs,
    isClientDebugConsoleOpen,
    setClientDebugConsoleOpen,
  } = useStockAnalysis();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<LogTypeFilter>('all');

  const filteredLogs = useMemo(() => {
    return clientLogs.filter(log => {
      const typeMatch = activeFilter === 'all' || log.type === activeFilter;
      const searchTermMatch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatch && searchTermMatch;
    });
  }, [clientLogs, activeFilter, searchTerm]);

  const handleExport = (format: 'json' | 'txt') => {
    if (filteredLogs.length === 0) {
      toast({ title: 'Export Failed', description: 'No logs to export.', variant: 'destructive' });
      return;
    }
    const filename = `stocksage_client_logs_${new Date().toISOString().replace(/:/g, '-')}`;
    if (format === 'json') {
      downloadJson(filteredLogs, `${filename}.json`);
    } else {
      const textContent = filteredLogs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
      downloadTxt(textContent, `${filename}.txt`);
    }
    toast({ title: 'Logs Exported', description: `Logs exported as ${format.toUpperCase()}.` });
  };

  const handleCopy = (format: 'json' | 'txt') => {
    if (filteredLogs.length === 0) {
      toast({ title: 'Copy Failed', description: 'No logs to copy.', variant: 'destructive' });
      return;
    }
    let contentToCopy: string;
    if (format === 'json') {
      contentToCopy = JSON.stringify(filteredLogs, null, 2);
    } else {
      contentToCopy = filteredLogs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
    }
    copyToClipboard(contentToCopy).then(success => {
      if (success) {
        toast({ title: 'Logs Copied', description: `Logs copied as ${format.toUpperCase()}.` });
      } else {
        toast({ title: 'Copy Failed', description: 'Could not copy logs to clipboard.', variant: 'destructive' });
      }
    });
  };


  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out">
      <Card className={cn(
        "border-t-2 shadow-2xl dark:shadow-primary/30 bg-background/95 backdrop-blur-sm",
        isClientDebugConsoleOpen ? `h-[${CONSOLE_HEIGHT}px]` : "h-[48px]",
        "flex flex-col"
      )}>
        <CardHeader className="p-2 border-b flex flex-row items-center justify-between space-y-0 cursor-pointer" onClick={() => setClientDebugConsoleOpen(!isClientDebugConsoleOpen)}>
          <div className="flex items-center">
            <Terminal className="h-5 w-5 mr-2 text-primary" />
            <CardTitle className="text-md font-medium">Client Debug Console</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" >
            {isClientDebugConsoleOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </Button>
        </CardHeader>
        {isClientDebugConsoleOpen && (
          <CardContent className="p-2 flex-grow flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-2 mb-2 p-1 border-b pb-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {(['all', 'log', 'info', 'warn', 'error', 'debug'] as LogTypeFilter[]).map(filter => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    className="h-9 text-xs px-2.5"
                  >
                    {filter.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-grow mb-2 pr-2">
              {filteredLogs.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    {clientLogs.length === 0 ? "No logs yet." : "No logs match current filters."}
                </div>
              ) : (
                <div className="space-y-1 text-xs font-code">
                  {filteredLogs.map(log => (
                    <div key={log.id} className={cn("flex items-start p-1 rounded-sm hover:bg-muted/50", logTypeStyles[log.type])}>
                      <span className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0">{log.timestamp}</span>
                      <div className="mr-1 flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {logTypeIcons[log.type]}
                      </div>
                      <pre className="whitespace-pre-wrap break-all flex-grow min-w-0">{log.message}</pre>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t mt-auto">
              <Button variant="outline" size="sm" onClick={clearClientLogs} className="h-8 text-xs">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCopy('txt')} className="h-8 text-xs">
                <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" /> Copy TXT
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCopy('json')} className="h-8 text-xs">
                <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" /> Copy JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('txt')} className="h-8 text-xs">
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export TXT
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('json')} className="h-8 text-xs">
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export JSON
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
