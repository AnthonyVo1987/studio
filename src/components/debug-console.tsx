
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { useStockAnalysis } from '@/contexts/stock-analysis-context';
import { globalLogEntries, clearGlobalLogBuffer, type GlobalLogEntry } from '@/lib/global-log-buffer';
import { downloadJson, copyToClipboard, downloadTxt } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { ClipboardCopy, Download, Trash2, X, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logSourceIds, logSourceLabels, type LogSourceId, logTypes, type LogType } from '@/lib/debug-log-types';


export const CONSOLE_HEIGHT_PX = 250;
const POLLING_INTERVAL_MS = 750;
const MAX_DISPLAYED_LOGS = 200;

function formatLogMessage(messages: any[]): string {
  return messages
    .map((msg) => {
      if (typeof msg === 'string') return msg;
      if (typeof msg === 'object' && msg !== null) {
        try {
          // Attempt to stringify, but handle circular references or other errors gracefully
          return JSON.stringify(msg, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular Reference]';
              }
              seen.add(value);
            }
            return value;
          });
        } catch {
          return String(msg);
        }
      }
      const seen = new Set(); // Reset 'seen' for each top-level message part
      return String(msg);
    })
    .join(' ');
}

const getSourceLabel = (source?: LogSourceId): string => {
  if (!source) return '';
  return `${logSourceLabels[source] || source}`;
};

// Helper function to escape CSV fields
const escapeCsvField = (field: any): string => {
  if (field === null || field === undefined) {
    return '';
  }
  const stringField = String(field);
  // If the field contains a comma, newline, or double quote, enclose it in double quotes.
  // Also, double up any existing double quotes within the field.
  if (/[",\n]/.test(stringField)) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

// Helper function to generate TXT content from logs
const generateLogsTxt = (logs: GlobalLogEntry[]): string => {
  return logs.map(log => {
    const timestamp = `[${new Date(log.timestamp).toISOString()}]`;
    const type = `[${log.type.toUpperCase()}]`;
    const source = log.source ? `[${getSourceLabel(log.source)}]` : '[UNKNOWN_SOURCE]';
    const message = formatLogMessage(log.messages);
    return `${timestamp} ${type} ${source} ${message}`;
  }).join('\n');
};

// Helper function to generate CSV content from logs
const generateLogsCsv = (logs: GlobalLogEntry[]): string => {
  const headers = "Timestamp,Type,Source,Message\n";
  const rows = logs.map(log => {
    const timestamp = log.timestamp;
    const type = log.type;
    const source = log.source ? getSourceLabel(log.source) : '';
    const message = formatLogMessage(log.messages);
    return `${escapeCsvField(timestamp)},${escapeCsvField(type)},${escapeCsvField(source)},${escapeCsvField(message)}`;
  }).join('\n');
  return headers + rows;
};


export function DebugConsole() {
  const {
    isClientDebugConsoleOpen,
    setClientDebugConsoleOpen,
    isClientDebugConsoleEnabled,
    logDebug, 
  } = useStockAnalysis();
  const { toast } = useToast();
  const [displayedLogs, setDisplayedLogs] = useState<GlobalLogEntry[]>([]);
  const [activeFilters, setActiveFilters] = useState<{ types: Set<LogType>; sources: Set<LogSourceId> }>({
    types: new Set(),
    sources: new Set(),
  });
  const [searchTerm, setSearchTerm] = useState<string>('');

  const processLogs = useCallback(() => {
    let logsToProcess = [...globalLogEntries]; 
    const currentSearchTerm = searchTerm.toLowerCase();

    if (activeFilters.types.size > 0) {
      logsToProcess = logsToProcess.filter(log => activeFilters.types.has(log.type as LogType));
    }
    if (activeFilters.sources.size > 0) {
      logsToProcess = logsToProcess.filter(log => log.source && activeFilters.sources.has(log.source));
    }
    
    if (currentSearchTerm) {
      logsToProcess = logsToProcess.filter(log => 
        formatLogMessage(log.messages).toLowerCase().includes(currentSearchTerm)
      );
      logDebug('DebugConsole', `Search: "${currentSearchTerm}" matched ${logsToProcess.length} logs after type/source filters.`);
    }
    
    return logsToProcess.slice(Math.max(0, logsToProcess.length - MAX_DISPLAYED_LOGS));
  }, [activeFilters, searchTerm, logDebug]);


  const fetchAndUpdateLogs = useCallback(() => {
    if (!isClientDebugConsoleOpen || !isClientDebugConsoleEnabled) return;

    const newLogs = processLogs();
    if (newLogs.length !== displayedLogs.length || 
        (newLogs.length > 0 && displayedLogs.length > 0 && newLogs[newLogs.length -1].id !== displayedLogs[displayedLogs.length-1]?.id) ||
        (newLogs.length > 0 && displayedLogs.length === 0) ||
        (newLogs.length === 0 && displayedLogs.length > 0) 
       ) {
       setDisplayedLogs(newLogs);
    }
  }, [isClientDebugConsoleOpen, isClientDebugConsoleEnabled, displayedLogs, processLogs]);


  useEffect(() => {
    if (isClientDebugConsoleOpen && isClientDebugConsoleEnabled) {
      fetchAndUpdateLogs(); 
      const intervalId = setInterval(fetchAndUpdateLogs, POLLING_INTERVAL_MS);
      return () => clearInterval(intervalId);
    }
  }, [isClientDebugConsoleOpen, isClientDebugConsoleEnabled, fetchAndUpdateLogs, activeFilters, searchTerm]);

  if (!isClientDebugConsoleEnabled || !isClientDebugConsoleOpen) {
    return null;
  }

  const handleClearLogs = () => {
    clearGlobalLogBuffer();
    setDisplayedLogs([]); 
    setSearchTerm('');
    toast({ title: 'Logs Cleared', description: 'Client debug logs have been cleared.' });
    logDebug('DebugConsole', 'Client debug logs cleared by user. Search term also cleared.');
  };

  const handleCopyLogs = () => {
    if (copyToClipboard(JSON.stringify(displayedLogs, null, 2))) { 
      toast({ title: 'Logs Copied', description: 'Displayed client logs copied to clipboard as JSON.' });
      logDebug('DebugConsole', `Displayed client logs copied to clipboard. Count: ${displayedLogs.length}`);
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy client logs.' });
      logDebug('DebugConsole', 'Failed to copy client logs to clipboard.');
    }
  };

  const handleExportJson = () => {
    logDebug('DebugConsole', 'Exporting logs as JSON.');
    if (displayedLogs.length === 0) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No logs to export.' });
      return;
    }
    try {
      downloadJson(displayedLogs, 'stocksage_client_logs.json'); 
      toast({ title: 'Logs Exported', description: 'Displayed client logs downloaded as JSON.' });
      logDebug('DebugConsole', `Displayed client logs exported as JSON. Count: ${displayedLogs.length}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export client logs as JSON.' });
      logDebug('DebugConsole', 'Error exporting client logs as JSON:', error);
    }
  };

  const handleExportTxt = () => {
    logDebug('DebugConsole', 'Exporting logs as TXT.');
    if (displayedLogs.length === 0) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No logs to export.' });
      return;
    }
    try {
      const txtData = generateLogsTxt(displayedLogs);
      downloadTxt(txtData, 'stocksage_client_logs.txt');
      toast({ title: 'Logs Exported', description: 'Displayed client logs downloaded as TXT.' });
      logDebug('DebugConsole', `Displayed client logs exported as TXT. Count: ${displayedLogs.length}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export client logs as TXT.' });
      logDebug('DebugConsole', 'Error exporting client logs as TXT:', error);
    }
  };

  const handleExportCsv = () => {
    logDebug('DebugConsole', 'Exporting logs as CSV.');
    if (displayedLogs.length === 0) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No logs to export.' });
      return;
    }
    try {
      const csvData = generateLogsCsv(displayedLogs);
      downloadTxt(csvData, 'stocksage_client_logs.csv'); // downloadTxt is fine for CSV
      toast({ title: 'Logs Exported', description: 'Displayed client logs downloaded as CSV.' });
      logDebug('DebugConsole', `Displayed client logs exported as CSV. Count: ${displayedLogs.length}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export client logs as CSV.' });
      logDebug('DebugConsole', 'Error exporting client logs as CSV:', error);
    }
  };


  const toggleFilterType = (type: LogType) => {
    setActiveFilters(prev => {
      const newTypes = new Set(prev.types);
      if (newTypes.has(type)) newTypes.delete(type);
      else newTypes.add(type);
      logDebug('DebugConsole', 'Log type filter changed:', { type, active: newTypes.has(type), newTypes: Array.from(newTypes) });
      return { ...prev, types: newTypes };
    });
  };

  const toggleFilterSource = (source: LogSourceId) => {
    setActiveFilters(prev => {
      const newSources = new Set(prev.sources);
      if (newSources.has(source)) newSources.delete(source);
      else newSources.add(source);
      logDebug('DebugConsole', 'Log source filter changed:', { source, active: newSources.has(source), newSources: Array.from(newSources) });
      return { ...prev, sources: newSources };
    });
  };

  const setAllFilterTypes = (select: boolean) => {
    setActiveFilters(prev => {
      const newTypes = select ? new Set(logTypes) : new Set<LogType>();
      logDebug('DebugConsole', `Set all log type filters to ${select}:`, Array.from(newTypes));
      return { ...prev, types: newTypes };
    });
  };

  const setAllFilterSources = (select: boolean) => {
    setActiveFilters(prev => {
      const newSources = select ? new Set(logSourceIds) : new Set<LogSourceId>();
      logDebug('DebugConsole', `Set all log source filters to ${select}:`, Array.from(newSources));
      return { ...prev, sources: newSources };
    });
  };

  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    logDebug('DebugConsole', 'Search term changed:', newSearchTerm);
  };

  const clearSearchTerm = () => {
    setSearchTerm('');
    logDebug('DebugConsole', 'Search term cleared.');
  };

  const activeFilterCount = activeFilters.types.size + activeFilters.sources.size;
  const isExportDisabled = displayedLogs.length === 0;

  return (
    <Card
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t-2 shadow-2xl bg-background/95 backdrop-blur-sm',
        'transition-all duration-300 ease-in-out'
      )}
      style={{ height: `${CONSOLE_HEIGHT_PX}px` }}
    >
      <CardHeader className="p-2 border-b">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 flex-shrink min-w-0">
            <CardTitle className="text-sm truncate">Client Debug Console</CardTitle>
            <CardDescription className="text-xs whitespace-nowrap">({displayedLogs.length} entries)</CardDescription>
          </div>
          <div className="flex items-center gap-1.5 flex-grow justify-center px-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={handleSearchTermChange}
                className="h-7 pl-8 pr-7 text-xs"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={clearSearchTerm}
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Filter Logs" className="h-7 w-7">
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Filter by Log Type</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setAllFilterTypes(true)}>Select All Types</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setAllFilterTypes(false)}>Clear All Types</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {logTypes.map(type => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={activeFilters.types.has(type)}
                    onCheckedChange={() => toggleFilterType(type)}
                    onSelect={(e) => e.preventDefault()} 
                  >
                    {type.toUpperCase()}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Log Source</DropdownMenuLabel>
                 <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setAllFilterSources(true)}>Select All Sources</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setAllFilterSources(false)}>Clear All Sources</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[200px]">
                  {logSourceIds.map(source => (
                    <DropdownMenuCheckboxItem
                      key={source}
                      checked={activeFilters.sources.has(source)}
                      onCheckedChange={() => toggleFilterSource(source)}
                      onSelect={(e) => e.preventDefault()} 
                    >
                      {logSourceLabels[source] || source}
                    </DropdownMenuCheckboxItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={handleCopyLogs} title="Copy Logs (Raw JSON)" className="h-7 w-7">
              <ClipboardCopy className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Export Logs" className="h-7 w-7" disabled={isExportDisabled}>
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportJson} disabled={isExportDisabled}>Export as JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportTxt} disabled={isExportDisabled}>Export as TXT</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCsv} disabled={isExportDisabled}>Export as CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
              {searchTerm ? `No logs found for "${searchTerm}" with current filters.` : "No client logs matching current filters."}
            </div>
          ) : (
            <div className="space-y-1 font-code text-xs">
              {displayedLogs.map((log) => (
                <div key={log.id} className="flex items-start">
                  <span className="text-muted-foreground/70 mr-1 whitespace-nowrap">
                    [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}]
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
                  <span className="text-muted-foreground/80 mr-1">{log.source ? `[${getSourceLabel(log.source)}]` : ''}</span>
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

    