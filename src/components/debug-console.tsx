
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
import { downloadJson, copyToClipboard } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { ClipboardCopy, Download, Trash2, X, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logSourceIds, logSourceLabels, type LogSourceId, logTypes, type LogType } from '@/lib/debug-log-types';


export const CONSOLE_HEIGHT_PX = 250;
const POLLING_INTERVAL_MS = 750;
const MAX_DISPLAYED_LOGS = 1000;

interface DebugConsoleProps {
  appVersion: string;
}

function formatLogMessage(messages: any[]): string {
  const seen = new Set();
  return messages
    .map((msg) => {
      if (typeof msg === 'string') return msg;
      if (typeof msg === 'object' && msg !== null) {
        try {
          seen.clear();
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
      return String(msg);
    })
    .join(' ');
}

const getSourceLabel = (source?: LogSourceId): string => {
  if (!source) return '';
  return `${logSourceLabels[source] || source}`;
};

const getFullSnapshotForExport = (context: ReturnType<typeof useStockAnalysis>) => ({
  reportTimestamp: new Date().toISOString(),
  fsmStatesSnapshot: {
    globalApplicationFSM: {
      previous: context.previousFsmState,
      current: context.fsmState,
      target: context.targetFsmDisplayState
    },
    globalFsmFlags: context.fsmFlags,
    globalFsmContextVariables: context.fsmVariables,
  },
  allRawData: {
    polygonApiRequestLogJson: context.polygonApiRequestLogJson,
    polygonApiResponseLogJson: context.polygonApiResponseLogJson,
    marketStatusJson: context.marketStatusJson,
    stockSnapshotJson: context.stockSnapshotJson,
    standardTasJson: context.standardTasJson,
    optionsChainJson: context.optionsChainJson,
    aiAnalyzedTaRequestJson: context.aiAnalyzedTaRequestJson,
    aiAnalyzedTaJson: context.aiAnalyzedTaJson,
    aiOptionsAnalysisRequestJson: context.aiOptionsAnalysisRequestJson,
    aiOptionsAnalysisJson: context.aiOptionsAnalysisJson,
    aiKeyTakeawaysRequestJson: context.aiKeyTakeawaysRequestJson,
    aiKeyTakeawaysJson: context.aiKeyTakeawaysJson,
    appDataChatRequestJson: context.userInputAppDataChatRequestJson,
    appDataChatResponseJson: context.userInputAppDataChatResponseJson,
    userInputWebSearchChatRequestJson: context.userInputWebSearchChatRequestJson,
    userInputWebSearchChatResponseJson: context.userInputWebSearchChatResponseJson,
    rawTaWebSearchRequestJson: context.rawTaWebSearchRequestJson,
    rawTaWebSearchResponseJson: context.rawTaWebSearchResponseJson,
    rawOptionsWebSearchRequestJson: context.rawOptionsWebSearchRequestJson,
    rawOptionsWebSearchResponseJson: context.rawOptionsWebSearchResponseJson,
  },
});

export function DebugConsole({ appVersion }: DebugConsoleProps) {
  const stockAnalysisContext = useStockAnalysis();
  const {
    isClientDebugConsoleOpen,
    setClientDebugConsoleOpen,
    isClientDebugConsoleEnabled,
    logDebug,
    fsmFlags,
    dispatchFsmEvent,
  } = stockAnalysisContext;

  const { toast } = useToast();
  const [displayedLogs, setDisplayedLogs] = useState<GlobalLogEntry[]>([]);

  const [localActiveFilters, setLocalActiveFilters] = useState<{ types: Set<LogType>; sources: Set<LogSourceId> }>({ types: new Set(), sources: new Set() });
  const [localSearchTerm, setLocalSearchTerm] = useState<string>('');

  const processLogs = useCallback(() => {
    let logsToProcess = [...globalLogEntries];
    const currentSearchTerm = localSearchTerm.toLowerCase();

    if (localActiveFilters.types.size > 0) {
      logsToProcess = logsToProcess.filter(log => localActiveFilters.types.has(log.type as LogType));
    }
    if (localActiveFilters.sources.size > 0) {
      logsToProcess = logsToProcess.filter(log => log.source && localActiveFilters.sources.has(log.source));
    }

    if (currentSearchTerm) {
      logsToProcess = logsToProcess.filter(log => {
        if (log.source === 'LogBuffer' && log.type === 'system') return true;
        return formatLogMessage(log.messages).toLowerCase().includes(currentSearchTerm);
      });
    }
    return logsToProcess.slice(Math.max(0, logsToProcess.length - MAX_DISPLAYED_LOGS));
  }, [localActiveFilters, localSearchTerm]);


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

  const getFullExportSnapshot = useCallback(() => {
    return getFullSnapshotForExport(stockAnalysisContext);
  }, [stockAnalysisContext]);

  useEffect(() => {
    if (isClientDebugConsoleOpen && isClientDebugConsoleEnabled) {
      fetchAndUpdateLogs();
      const intervalId = setInterval(fetchAndUpdateLogs, POLLING_INTERVAL_MS);
      return () => clearInterval(intervalId);
    }
  }, [isClientDebugConsoleOpen, isClientDebugConsoleEnabled, fetchAndUpdateLogs, localActiveFilters, localSearchTerm]);

  if (!isClientDebugConsoleEnabled || !isClientDebugConsoleOpen) {
    return null;
  }

  const handleClearLogs = () => {
    clearGlobalLogBuffer();
    setDisplayedLogs([]);
    setLocalSearchTerm('');
    toast({ title: 'Logs Cleared', description: 'Client debug logs have been cleared.' });
    logDebug('DebugConsole', 'LogClear', 'Client debug logs cleared by user. Search term also cleared.');
  };

  const handleCopyJson = async () => {
    logDebug('DebugConsole', 'CopyAction', 'Copying full snapshot as JSON.');
    if (displayedLogs.length === 0) { toast({ variant: 'destructive', title: 'Copy Failed', description: 'No logs to copy.' }); return; }
    const fullSnapshot = getFullExportSnapshot();
    const exportData = { appVersion, ...fullSnapshot, logs: displayedLogs };
    if (await copyToClipboard(JSON.stringify(exportData, null, 2))) {
      toast({ title: 'Snapshot Copied', description: 'Full system snapshot copied to clipboard as JSON.' });
    } else {
      toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy system snapshot." });
    }
  };

  const handleExportJson = () => {
    logDebug('DebugConsole', 'ExportAction', 'Exporting full snapshot as JSON.');
    if (displayedLogs.length === 0) { toast({ variant: 'destructive', title: 'Export Failed', description: 'No logs to export.' }); return; }
    try {
      const fullSnapshot = getFullExportSnapshot();
      const exportData = { appVersion, ...fullSnapshot, logs: displayedLogs };
      downloadJson(exportData, `stocksage_full_snapshot_${appVersion}.json`);
      toast({ title: 'Snapshot Exported', description: 'Full system snapshot downloaded as JSON.' });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export snapshot." });
    }
  };

  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(event.target.value);
  };

  const clearSearchTerm = () => {
    setLocalSearchTerm('');
  };

  const updateTypeFilter = (type: LogType, checked: boolean) => {
    setLocalActiveFilters(prev => {
        const newTypes = new Set(prev.types);
        if (checked) newTypes.add(type); else newTypes.delete(type);
        return { ...prev, types: newTypes };
    });
  };
  const updateSourceFilter = (source: LogSourceId, checked: boolean) => {
    setLocalActiveFilters(prev => {
        const newSources = new Set(prev.sources);
        if (checked) newSources.add(source); else newSources.delete(source);
        return { ...prev, sources: newSources };
    });
  };
  const setAllTypeFilters = (selectAll: boolean) => {
    setLocalActiveFilters(prev => ({ ...prev, types: selectAll ? new Set(logTypes) : new Set() }));
  };
  const setAllSourceFilters = (selectAll: boolean) => {
    setLocalActiveFilters(prev => ({ ...prev, sources: selectAll ? new Set(logSourceIds) : new Set() }));
  };

  const activeFilterCountFromLocalState = localActiveFilters.types.size + localActiveFilters.sources.size;
  const isUserInteractionDisabled = displayedLogs.length === 0;

  return (
    <Card
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 border-t-2 shadow-2xl bg-background/95 backdrop-blur-sm',
        'transition-all duration-300 ease-in-out'
      )}
      style={{
        transform: `translateY(0px)`,
        height: `${CONSOLE_HEIGHT_PX}px`
      }}
    >
      <CardHeader className="p-2 border-b">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 flex-shrink min-w-0">
            <CardTitle className="text-sm truncate">Client Debug Console</CardTitle>
            <CardDescription className="text-xs whitespace-nowrap">
              (App: {appVersion} | {displayedLogs.length} entries)
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 flex-grow justify-center px-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search logs..."
                value={localSearchTerm}
                onChange={handleSearchTermChange}
                className="h-7 pl-8 pr-7 text-xs"
              />
              {localSearchTerm && (
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
            <DropdownMenu
              open={fsmFlags.isDebugConsoleFilterMenuOpen}
              onOpenChange={(isOpen) => dispatchFsmEvent({ type: 'TOGGLE_DEBUG_CONSOLE_MENU', payload: { menu: 'filter', isOpen }})}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Filter Logs" className="h-7 w-7">
                  <Filter className="h-4 w-4" />
                  {activeFilterCountFromLocalState > 0 && (
                    <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                      {activeFilterCountFromLocalState}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Filter by Log Type</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setAllTypeFilters(true)}>Select All Types</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setAllTypeFilters(false)}>Clear All Types</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {logTypes.map(type => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={localActiveFilters.types.has(type)}
                    onCheckedChange={(checked) => updateTypeFilter(type, !!checked)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {type.toUpperCase()}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Log Source</DropdownMenuLabel>
                 <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setAllSourceFilters(true)}>Select All Sources</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setAllSourceFilters(false)}>Clear All Sources</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[200px]">
                  {logSourceIds.map(source => (
                    <DropdownMenuCheckboxItem
                      key={source}
                      checked={localActiveFilters.sources.has(source)}
                      onCheckedChange={(checked) => updateSourceFilter(source, !!checked)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {logSourceLabels[source] || source}
                    </DropdownMenuCheckboxItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" title="Copy Snapshot as JSON" className="h-7 w-7" disabled={isUserInteractionDisabled} onClick={handleCopyJson}>
                <ClipboardCopy className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" title="Export Snapshot as JSON" className="h-7 w-7" disabled={isUserInteractionDisabled} onClick={handleExportJson}>
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
              {localSearchTerm ? `No logs found for "${localSearchTerm}" with current filters.` : "No client logs matching current filters."}
            </div>
          ) : (
            <div className="space-y-1 font-code text-xs">
              {displayedLogs.map((log) => {
                if (log.source === 'LogBuffer' && log.type === 'system') {
                  return (
                    <div key={log.id} className="my-2 text-center">
                      <Separator className="mb-1" />
                      <em className="text-muted-foreground text-xs px-2 py-0.5 rounded bg-muted/50">
                        {formatLogMessage(log.messages)}
                      </em>
                      <Separator className="mt-1" />
                    </div>
                  );
                }
                return (
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
                        'text-green-500 dark:text-green-400': log.type === 'system',
                        'text-gray-500 dark:text-gray-400': log.type === 'log',
                      })}
                    >
                      [{log.type}]
                    </span>
                    <span className="text-muted-foreground/80 mr-1">{log.source ? `[${getSourceLabel(log.source)}]` : ''}</span>
                    <span className="whitespace-pre-wrap break-all">{formatLogMessage(log.messages)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
