
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
import type { GlobalLogEntry } from '@/lib/global-log-buffer';
import { downloadJson, copyToClipboard } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { ClipboardCopy, Download, Trash2, X, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logSourceIds, logSourceLabels, type LogSourceId, logTypes, type LogType } from '@/lib/debug-log-types';

const POLLING_INTERVAL_MS = 750;
const MAX_DISPLAYED_LOGS = 2000;

interface LogConsoleProps {
  appVersion: string;
  logEntries: GlobalLogEntry[];
  getSnapshotForExport: () => any;
  clearLogs: () => void;
  consoleTitle: string;
  consoleDescription: string;
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

export function LogConsole({
  appVersion,
  logEntries,
  getSnapshotForExport,
  clearLogs,
  consoleTitle,
  consoleDescription
}: LogConsoleProps) {
  const { logDebug } = useStockAnalysis();
  const { toast } = useToast();
  
  const [displayedLogs, setDisplayedLogs] = useState<GlobalLogEntry[]>([]);
  const [isFilterMenuOpen, setFilterMenuOpen] = useState(false);
  const [localActiveFilters, setLocalActiveFilters] = useState<{ types: Set<LogType>; sources: Set<LogSourceId> }>({ types: new Set(), sources: new Set() });
  const [localSearchTerm, setLocalSearchTerm] = useState<string>('');

  const processLogs = useCallback(() => {
    let logsToProcess = [...logEntries];
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
  }, [logEntries, localActiveFilters, localSearchTerm]);

  const fetchAndUpdateLogs = useCallback(() => {
    const newLogs = processLogs();
    if (newLogs.length !== displayedLogs.length ||
        (newLogs.length > 0 && displayedLogs.length > 0 && newLogs[newLogs.length -1].id !== displayedLogs[displayedLogs.length-1]?.id) ||
        (newLogs.length > 0 && displayedLogs.length === 0) ||
        (newLogs.length === 0 && displayedLogs.length > 0)
       ) {
       setDisplayedLogs(newLogs);
    }
  }, [displayedLogs, processLogs]);

  useEffect(() => {
    fetchAndUpdateLogs();
    const intervalId = setInterval(fetchAndUpdateLogs, POLLING_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchAndUpdateLogs, localActiveFilters, localSearchTerm]);

  const handleClearLogs = () => {
    clearLogs();
    setDisplayedLogs([]);
    setLocalSearchTerm('');
    toast({ title: 'Logs Cleared', description: `${consoleTitle} have been cleared.` });
    logDebug('LogConsole', 'LogClear', `${consoleTitle} cleared by user.`);
  };

  const handleCopyJson = async () => {
    logDebug('LogConsole', 'CopyAction', `Copying snapshot from ${consoleTitle}.`);
    if (displayedLogs.length === 0) { toast({ variant: 'destructive', title: 'Copy Failed', description: 'No logs to copy.' }); return; }
    const snapshotData = getSnapshotForExport();
    const exportData = { appVersion, snapshot: snapshotData, logs: displayedLogs };
    if (await copyToClipboard(JSON.stringify(exportData, null, 2))) {
      toast({ title: 'Snapshot Copied', description: 'Full system snapshot copied to clipboard as JSON.' });
    } else {
      toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy system snapshot." });
    }
  };

  const handleExportJson = () => {
    logDebug('LogConsole', 'ExportAction', `Exporting snapshot from ${consoleTitle}.`);
    if (displayedLogs.length === 0) { toast({ variant: 'destructive', title: 'Export Failed', description: 'No logs to export.' }); return; }
    try {
      const snapshotData = getSnapshotForExport();
      const exportData = { appVersion, snapshot: snapshotData, logs: displayedLogs };
      const filenameSuffix = consoleTitle.toLowerCase().replace(/\s+/g, '_');
      downloadJson(exportData, `stocksage_${filenameSuffix}_snapshot_${appVersion}.json`);
      toast({ title: 'Snapshot Exported', description: 'Full system snapshot downloaded as JSON.' });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export snapshot." });
    }
  };
  
  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(event.target.value);
  };
  const clearSearchTerm = () => { setLocalSearchTerm(''); };
  const updateTypeFilter = (type: LogType, checked: boolean) => setLocalActiveFilters(prev => ({ ...prev, types: checked ? new Set(prev.types).add(type) : new Set([...prev.types].filter(t => t !== type)) }));
  const updateSourceFilter = (source: LogSourceId, checked: boolean) => setLocalActiveFilters(prev => ({ ...prev, sources: checked ? new Set(prev.sources).add(source) : new Set([...prev.sources].filter(s => s !== source)) }));
  const setAllTypeFilters = (selectAll: boolean) => setLocalActiveFilters(prev => ({ ...prev, types: selectAll ? new Set(logTypes) : new Set() }));
  const setAllSourceFilters = (selectAll: boolean) => setLocalActiveFilters(prev => ({ ...prev, sources: selectAll ? new Set(logSourceIds) : new Set() }));
  const activeFilterCount = localActiveFilters.types.size + localActiveFilters.sources.size;
  const isUserInteractionDisabled = displayedLogs.length === 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 border-b flex-shrink-0">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-4 flex-shrink min-w-0">
            <div>
              <CardTitle className="text-lg">{consoleTitle}</CardTitle>
              <CardDescription className="text-xs">{consoleDescription} ({displayedLogs.length} entries shown)</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-grow justify-center px-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search logs..." value={localSearchTerm} onChange={handleSearchTermChange} className="h-9 pl-9 pr-8 text-sm" />
              {localSearchTerm && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={clearSearchTerm} title="Clear search"><X className="h-4 w-4" /><span className="sr-only">Clear search</span></Button>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <DropdownMenu open={isFilterMenuOpen} onOpenChange={setFilterMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" title="Filter Logs">
                  <Filter className="mr-2 h-4 w-4" /> Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Filter by Log Type</DropdownMenuLabel>
                <DropdownMenuGroup><DropdownMenuItem onSelect={() => setAllTypeFilters(true)}>Select All</DropdownMenuItem><DropdownMenuItem onSelect={() => setAllTypeFilters(false)}>Clear All</DropdownMenuItem></DropdownMenuGroup><DropdownMenuSeparator />
                {logTypes.map(type => (<DropdownMenuCheckboxItem key={type} checked={localActiveFilters.types.has(type)} onCheckedChange={(checked) => updateTypeFilter(type, !!checked)} onSelect={(e) => e.preventDefault()}>{type.toUpperCase()}</DropdownMenuCheckboxItem>))}
                <DropdownMenuSeparator /><DropdownMenuLabel>Filter by Log Source</DropdownMenuLabel>
                <DropdownMenuGroup><DropdownMenuItem onSelect={() => setAllSourceFilters(true)}>Select All</DropdownMenuItem><DropdownMenuItem onSelect={() => setAllSourceFilters(false)}>Clear All</DropdownMenuItem></DropdownMenuGroup><DropdownMenuSeparator />
                <ScrollArea className="h-[200px]">{logSourceIds.map(source => (<DropdownMenuCheckboxItem key={source} checked={localActiveFilters.sources.has(source)} onCheckedChange={(checked) => updateSourceFilter(source, !!checked)} onSelect={(e) => e.preventDefault()}>{logSourceLabels[source] || source}</DropdownMenuCheckboxItem>))}</ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" title="Copy Snapshot as JSON" disabled={isUserInteractionDisabled} onClick={handleCopyJson}><ClipboardCopy className="mr-2 h-4 w-4" /> Copy</Button>
            <Button variant="outline" size="sm" title="Export Snapshot as JSON" disabled={isUserInteractionDisabled} onClick={handleExportJson}><Download className="mr-2 h-4 w-4" /> Export</Button>
            <Button variant="destructive" size="sm" onClick={handleClearLogs} title="Clear Logs"><Trash2 className="mr-2 h-4 w-4" /> Clear</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow">
        <ScrollArea className="h-[calc(100vh-24rem)] p-2">
          {displayedLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              {localSearchTerm ? `No logs found for "${localSearchTerm}" with current filters.` : "No logs matching current filters."}
            </div>
          ) : (
            <div className="space-y-1 font-code text-xs">
              {displayedLogs.map((log) => {
                if (log.source === 'LogBuffer' && log.type === 'system') {
                  return (<div key={log.id} className="my-2 text-center"><Separator className="mb-1" /><em className="text-muted-foreground text-xs px-2 py-0.5 rounded bg-muted/50">{formatLogMessage(log.messages)}</em><Separator className="mt-1" /></div>);
                }
                return (
                  <div key={log.id} className="flex items-start">
                    <span className="text-muted-foreground/70 mr-1 whitespace-nowrap">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}]</span>
                    <span className={cn('mr-1 font-semibold uppercase', {
                        'text-yellow-500 dark:text-yellow-400': log.type === 'warn', 'text-red-500 dark:text-red-400': log.type === 'error',
                        'text-blue-500 dark:text-blue-400': log.type === 'info', 'text-purple-500 dark:text-purple-400': log.type === 'debug',
                        'text-green-500 dark:text-green-400': log.type === 'system', 'text-gray-500 dark:text-gray-400': log.type === 'log',
                      })}>[{log.type}]</span>
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
