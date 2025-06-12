
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { downloadJson, copyToClipboard } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { ClipboardCopy, Download, Trash2, X, Filter } from 'lucide-react';
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
    logDebug, // Get logDebug from context
  } = useStockAnalysis();
  const { toast } = useToast();
  const [displayedLogs, setDisplayedLogs] = useState<GlobalLogEntry[]>([]);
  const [activeFilters, setActiveFilters] = useState<{ types: Set<LogType>; sources: Set<LogSourceId> }>({
    types: new Set(),
    sources: new Set(),
  });

  const processLogs = useCallback(() => {
    let logsToProcess = [...globalLogEntries]; // Work with a copy

    if (activeFilters.types.size > 0) {
      logsToProcess = logsToProcess.filter(log => activeFilters.types.has(log.type as LogType));
    }
    if (activeFilters.sources.size > 0) {
      logsToProcess = logsToProcess.filter(log => log.source && activeFilters.sources.has(log.source));
    }
    
    return logsToProcess.slice(Math.max(0, logsToProcess.length - MAX_DISPLAYED_LOGS));
  }, [activeFilters]);


  const fetchAndUpdateLogs = useCallback(() => {
    if (!isClientDebugConsoleOpen || !isClientDebugConsoleEnabled) return;

    const newLogs = processLogs();
    // Efficiently check if displayedLogs needs update
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
      fetchAndUpdateLogs(); // Initial fetch
      const intervalId = setInterval(fetchAndUpdateLogs, POLLING_INTERVAL_MS);
      return () => clearInterval(intervalId);
    }
  }, [isClientDebugConsoleOpen, isClientDebugConsoleEnabled, fetchAndUpdateLogs, activeFilters]); // activeFilters added

  if (!isClientDebugConsoleEnabled || !isClientDebugConsoleOpen) {
    return null;
  }

  const handleClearLogs = () => {
    clearGlobalLogBuffer();
    setDisplayedLogs([]); // Clear displayed logs immediately
    toast({ title: 'Logs Cleared', description: 'Client debug logs have been cleared.' });
    logDebug('DebugConsole', 'Client debug logs cleared by user.');
  };

  const handleCopyLogs = () => {
    if (copyToClipboard(JSON.stringify(displayedLogs, null, 2))) { // displayedLogs is already filtered
      toast({ title: 'Logs Copied', description: 'Displayed client logs copied to clipboard as JSON.' });
      logDebug('DebugConsole', 'Displayed client logs copied to clipboard.');
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy client logs.' });
      logDebug('DebugConsole', 'Failed to copy client logs to clipboard.');
    }
  };

  const handleExportLogs = () => {
    try {
      downloadJson(displayedLogs, 'stocksage_client_logs.json'); // displayedLogs is already filtered
      toast({ title: 'Logs Exported', description: 'Displayed client logs downloaded as JSON.' });
      logDebug('DebugConsole', 'Displayed client logs exported as JSON.');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export client logs.' });
      logDebug('DebugConsole', 'Error exporting client logs:', error);
    }
  };

  const getSourceLabel = (source?: LogSourceId): string => {
    if (!source) return '';
    return `[${logSourceLabels[source] || source}] `;
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

  const activeFilterCount = activeFilters.types.size + activeFilters.sources.size;

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
            <CardDescription className="text-xs">({displayedLogs.length} entries displayed)</CardDescription>
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
                    onSelect={(e) => e.preventDefault()} // Prevent menu close on select
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
                      onSelect={(e) => e.preventDefault()} // Prevent menu close on select
                    >
                      {logSourceLabels[source] || source}
                    </DropdownMenuCheckboxItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

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
              No client logs matching current filters.
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

