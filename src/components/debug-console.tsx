
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
import { useStockAnalysis, type FsmDisplayTuple } from '@/contexts/stock-analysis-context';
import { useDebugConsoleFsm, DebugConsoleFsmMenuState } from '@/contexts/debug-console-fsm-context';
import { globalLogEntries, clearGlobalLogBuffer, type GlobalLogEntry } from '@/lib/global-log-buffer';
import { downloadJson, copyToClipboard, downloadTxt } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { ClipboardCopy, Download, Trash2, X, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logSourceIds, logSourceLabels, type LogSourceId, logTypes, type LogType } from '@/lib/debug-log-types';


export const CONSOLE_HEIGHT_PX = 250;
const POLLING_INTERVAL_MS = 750;
const MAX_DISPLAYED_LOGS = 1000;
// REMOVED: export const APP_VERSION_FOR_EXPORT = "v3.0.0.1"; 

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

const escapeCsvField = (field: any): string => {
  if (field === null || field === undefined) {
    return '';
  }
  const stringField = String(field);
  if (/[",\n]/.test(stringField)) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

const getFsmStatesAndTimestampForExport = (
    globalPreviousFsmState: FsmState | null,
    globalFsmState: FsmState,
    globalTargetFsmDisplayState: FsmState | null,
    mainTabFsmDisplay: FsmDisplayTuple | null,
    chatbotFsmDisplay: FsmDisplayTuple | null,
    contextDebugConsoleMenuFsmDisplay: FsmDisplayTuple | null
) => ({
  reportTimestamp: new Date().toISOString(),
  fsmStatesSnapshot: {
    globalApplicationFSM: { previous: globalPreviousFsmState, current: globalFsmState, target: globalTargetFsmDisplayState },
    mainTabUI_FSM: mainTabFsmDisplay,
    chatbotUI_FSM: chatbotFsmDisplay,
    debugConsoleMenuUI_FSM: contextDebugConsoleMenuFsmDisplay,
  }
});


const generateLogsTxtWithMetadata = (
    logs: GlobalLogEntry[],
    currentAppVersion: string, 
    fsmStates: any 
): string => {
  let metadata = `App Version: ${currentAppVersion}\n`;
  metadata += `Report Timestamp: ${new Date().toISOString()}\n\n`;
  metadata += "FSM States:\n";
  metadata += `  Global Application FSM: Prev: ${fsmStates.globalApplicationFSM?.previous || 'N/A'}, Curr: ${fsmStates.globalApplicationFSM?.current || 'N/A'}, Target: ${fsmStates.globalApplicationFSM?.target || 'N/A'}\n`;
  metadata += `  Main Tab UI FSM: Prev: ${fsmStates.mainTabUI_FSM?.previous || 'N/A'}, Curr: ${fsmStates.mainTabUI_FSM?.current || 'N/A'}, Target: ${fsmStates.mainTabUI_FSM?.target || 'N/A'}\n`;
  metadata += `  Chatbot UI FSM: Prev: ${fsmStates.chatbotUI_FSM?.previous || 'N/A'}, Curr: ${fsmStates.chatbotUI_FSM?.current || 'N/A'}, Target: ${fsmStates.chatbotUI_FSM?.target || 'N/A'}\n`;
  metadata += `  Debug Console Menu FSM: Prev: ${fsmStates.debugConsoleMenuUI_FSM?.previous || 'N/A'}, Curr: ${fsmStates.debugConsoleMenuUI_FSM?.current || 'N/A'}, Target: ${fsmStates.debugConsoleMenuUI_FSM?.target || 'N/A'}\n\n`;
  metadata += "Client Debug Logs:\n";
  metadata += "--------------------------------------------------\n";

  const logLines = logs.map(log => {
    const timestamp = `[${new Date(log.timestamp).toISOString()}]`;
    const type = `[${log.type.toUpperCase()}]`;
    const source = log.source ? `[${getSourceLabel(log.source)}]` : '[UNKNOWN_SOURCE]';
    const message = formatLogMessage(log.messages);
    return `${timestamp} ${type} ${source} ${message}`;
  }).join('\n');
  return metadata + logLines;
};

const generateLogsCsvWithMetadata = (
    logs: GlobalLogEntry[],
    currentAppVersion: string, 
    fsmStates: any
): string => {
  let metadata = `App Version:,${currentAppVersion}\n`;
  metadata += `Report Timestamp:,${new Date().toISOString()}\n\n`;
  metadata += `FSM States:\n`;
  metadata += `Global Application FSM:,Prev: ${fsmStates.globalApplicationFSM?.previous || 'N/A'}, Curr: ${fsmStates.globalApplicationFSM?.current || 'N/A'}, Target: ${fsmStates.globalApplicationFSM?.target || 'N/A'}\n`;
  metadata += `Main Tab UI FSM:,Prev: ${fsmStates.mainTabUI_FSM?.previous || 'N/A'}, Curr: ${fsmStates.mainTabUI_FSM?.current || 'N/A'}, Target: ${fsmStates.mainTabUI_FSM?.target || 'N/A'}\n`;
  metadata += `Chatbot UI FSM:,Prev: ${fsmStates.chatbotUI_FSM?.previous || 'N/A'}, Curr: ${fsmStates.chatbotUI_FSM?.current || 'N/A'}, Target: ${fsmStates.chatbotUI_FSM?.target || 'N/A'}\n`;
  metadata += `Debug Console Menu FSM:,Prev: ${fsmStates.debugConsoleMenuUI_FSM?.previous || 'N/A'}, Curr: ${fsmStates.debugConsoleMenuUI_FSM?.current || 'N/A'}, Target: ${fsmStates.debugConsoleMenuUI_FSM?.target || 'N/A'}\n\n`;
  metadata += "Client Debug Logs:\n";
  metadata += "Timestamp,Type,Source,Message\n";

  const logRows = logs.map(log => {
    const timestamp = log.timestamp;
    const type = log.type;
    const source = log.source ? getSourceLabel(log.source) : '';
    const message = formatLogMessage(log.messages);
    return `${escapeCsvField(timestamp)},${escapeCsvField(type)},${escapeCsvField(source)},${escapeCsvField(message)}`;
  }).join('\n');
  return metadata + logRows;
};


export function DebugConsole({ appVersion }: DebugConsoleProps) {
  const {
    isClientDebugConsoleOpen,
    setClientDebugConsoleOpen,
    isClientDebugConsoleEnabled,
    logDebug: stockAnalysisLogDebug,
    fsmState: globalFsmState,
    previousFsmState: globalPreviousFsmState,
    targetFsmDisplayState: globalTargetFsmDisplayState,
    mainTabFsmDisplay,
    chatbotFsmDisplay,
    debugConsoleMenuFsmDisplay: contextDebugConsoleMenuFsmDisplay,
  } = useStockAnalysis();

  const {
    uiMenuState,
    activeFilters,
    searchTerm,
    dispatchDebugConsoleFsmEvent,
  } = useDebugConsoleFsm();

  const { toast } = useToast();
  const [displayedLogs, setDisplayedLogs] = useState<GlobalLogEntry[]>([]);

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
    }

    return logsToProcess.slice(Math.max(0, logsToProcess.length - MAX_DISPLAYED_LOGS));
  }, [activeFilters, searchTerm]);


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
    dispatchDebugConsoleFsmEvent({ type: 'CLEAR_SEARCH_TERM' });
    toast({ title: 'Logs Cleared', description: 'Client debug logs have been cleared.' });
    stockAnalysisLogDebug('DebugConsole', 'LogClear', 'Client debug logs cleared by user. Search term also cleared.');
  };

  const handleCopyJson = async () => {
    stockAnalysisLogDebug('DebugConsole', 'CopyAction', 'Copying logs as JSON.');
    if (displayedLogs.length === 0) {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'No logs to copy.' }); return;
    }
    const { reportTimestamp, fsmStatesSnapshot } = getFsmStatesAndTimestampForExport(
        globalPreviousFsmState, globalFsmState, globalTargetFsmDisplayState, 
        mainTabFsmDisplay, chatbotFsmDisplay, contextDebugConsoleMenuFsmDisplay
    );
    const exportData = { appVersion, reportTimestamp, fsmStatesSnapshot, logs: displayedLogs };
    if (await copyToClipboard(JSON.stringify(exportData, null, 2))) {
      toast({ title: 'Logs Copied', description: 'Displayed client logs and FSM states copied to clipboard as JSON.' });
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy client logs as JSON.' });
    }
  };

  const handleCopyTxt = async () => {
    stockAnalysisLogDebug('DebugConsole', 'CopyAction', 'Copying logs as TXT.');
    if (displayedLogs.length === 0) { toast({ variant: 'destructive', title: 'Copy Failed', description: 'No logs to copy.' }); return; }
    const { fsmStatesSnapshot } = getFsmStatesAndTimestampForExport(
        globalPreviousFsmState, globalFsmState, globalTargetFsmDisplayState, 
        mainTabFsmDisplay, chatbotFsmDisplay, contextDebugConsoleMenuFsmDisplay
    );
    const txtData = generateLogsTxtWithMetadata(displayedLogs, appVersion, fsmStatesSnapshot); 
    if (await copyToClipboard(txtData)) {
      toast({ title: 'Logs Copied', description: 'Displayed client logs and FSM states copied to clipboard as TXT.' });
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy client logs as TXT.' });
    }
  };

  const handleCopyCsv = async () => {
    stockAnalysisLogDebug('DebugConsole', 'CopyAction', 'Copying logs as CSV.');
    if (displayedLogs.length === 0) { toast({ variant: 'destructive', title: 'Copy Failed', description: 'No logs to copy.' }); return; }
    const { fsmStatesSnapshot } = getFsmStatesAndTimestampForExport(
        globalPreviousFsmState, globalFsmState, globalTargetFsmDisplayState, 
        mainTabFsmDisplay, chatbotFsmDisplay, contextDebugConsoleMenuFsmDisplay
    );
    const csvData = generateLogsCsvWithMetadata(displayedLogs, appVersion, fsmStatesSnapshot); 
    if (await copyToClipboard(csvData)) {
      toast({ title: 'Logs Copied', description: 'Displayed client logs and FSM states copied to clipboard as CSV.' });
    } else {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy client logs as CSV.' });
    }
  };

  const handleExportJson = () => {
    stockAnalysisLogDebug('DebugConsole', 'ExportAction', 'Exporting logs as JSON.');
    if (displayedLogs.length === 0) { toast({ variant: 'destructive', title: 'Export Failed', description: 'No logs to export.' }); return; }
    try {
      const { reportTimestamp, fsmStatesSnapshot } = getFsmStatesAndTimestampForExport(
        globalPreviousFsmState, globalFsmState, globalTargetFsmDisplayState, 
        mainTabFsmDisplay, chatbotFsmDisplay, contextDebugConsoleMenuFsmDisplay
      );
      const exportData = { appVersion, reportTimestamp, fsmStatesSnapshot, logs: displayedLogs };
      downloadJson(exportData, `stocksage_client_logs_fsm_${appVersion}.json`); 
      toast({ title: 'Logs Exported', description: 'Displayed client logs and FSM states downloaded as JSON.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export client logs as JSON.' });
    }
  };

  const handleExportTxt = () => {
    stockAnalysisLogDebug('DebugConsole', 'ExportAction', 'Exporting logs as TXT.');
    if (displayedLogs.length === 0) { toast({ variant: 'destructive', title: 'Export Failed', description: 'No logs to export.' }); return; }
    try {
      const { fsmStatesSnapshot } = getFsmStatesAndTimestampForExport(
        globalPreviousFsmState, globalFsmState, globalTargetFsmDisplayState, 
        mainTabFsmDisplay, chatbotFsmDisplay, contextDebugConsoleMenuFsmDisplay
      );
      const txtData = generateLogsTxtWithMetadata(displayedLogs, appVersion, fsmStatesSnapshot); 
      downloadTxt(txtData, `stocksage_client_logs_fsm_${appVersion}.txt`); 
      toast({ title: 'Logs Exported', description: 'Displayed client logs and FSM states downloaded as TXT.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export client logs as TXT.' });
    }
  };

  const handleExportCsv = () => {
    stockAnalysisLogDebug('DebugConsole', 'ExportAction', 'Exporting logs as CSV.');
    if (displayedLogs.length === 0) { toast({ variant: 'destructive', title: 'Export Failed', description: 'No logs to export.' }); return; }
    try {
      const { fsmStatesSnapshot } = getFsmStatesAndTimestampForExport(
        globalPreviousFsmState, globalFsmState, globalTargetFsmDisplayState, 
        mainTabFsmDisplay, chatbotFsmDisplay, contextDebugConsoleMenuFsmDisplay
      );
      const csvData = generateLogsCsvWithMetadata(displayedLogs, appVersion, fsmStatesSnapshot); 
      downloadTxt(csvData, `stocksage_client_logs_fsm_${appVersion}.csv`); 
      toast({ title: 'Logs Exported', description: 'Displayed client logs and FSM states downloaded as CSV.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export client logs as CSV.' });
    }
  };


  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatchDebugConsoleFsmEvent({ type: 'SEARCH_TERM_CHANGED', payload: event.target.value });
  };

  const clearSearchTerm = () => {
    dispatchDebugConsoleFsmEvent({ type: 'CLEAR_SEARCH_TERM' });
  };

  const activeFilterCountFromFsm = activeFilters.types.size + activeFilters.sources.size;
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
            <DropdownMenu
              open={uiMenuState === DebugConsoleFsmMenuState.FILTER_TYPE_MENU_OPEN}
              onOpenChange={(isOpen) => dispatchDebugConsoleFsmEvent({ type: 'SET_MENU_OPEN_STATE', payload: { menu: 'filterType', isOpen } })}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Filter Logs" className="h-7 w-7">
                  <Filter className="h-4 w-4" />
                  {activeFilterCountFromFsm > 0 && (
                    <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                      {activeFilterCountFromFsm}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Filter by Log Type</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => dispatchDebugConsoleFsmEvent({ type: 'SET_ALL_TYPE_FILTERS', payload: { selectAll: true } })}>Select All Types</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => dispatchDebugConsoleFsmEvent({ type: 'SET_ALL_TYPE_FILTERS', payload: { selectAll: false } })}>Clear All Types</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {logTypes.map(type => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={activeFilters.types.has(type)}
                    onCheckedChange={(checked) => dispatchDebugConsoleFsmEvent({ type: 'UPDATE_TYPE_FILTER', payload: { type, checked } })}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {type.toUpperCase()}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Log Source</DropdownMenuLabel>
                 <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => dispatchDebugConsoleFsmEvent({ type: 'SET_ALL_SOURCE_FILTERS', payload: { selectAll: true } })}>Select All Sources</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => dispatchDebugConsoleFsmEvent({ type: 'SET_ALL_SOURCE_FILTERS', payload: { selectAll: false } })}>Clear All Sources</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[200px]">
                  {logSourceIds.map(source => (
                    <DropdownMenuCheckboxItem
                      key={source}
                      checked={activeFilters.sources.has(source)}
                      onCheckedChange={(checked) => dispatchDebugConsoleFsmEvent({ type: 'UPDATE_SOURCE_FILTER', payload: { source, checked } })}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {logSourceLabels[source] || source}
                    </DropdownMenuCheckboxItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu
              open={uiMenuState === DebugConsoleFsmMenuState.COPY_MENU_OPEN}
              onOpenChange={(isOpen) => dispatchDebugConsoleFsmEvent({ type: 'SET_MENU_OPEN_STATE', payload: { menu: 'copy', isOpen } })}
            >
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" title="Copy Logs" className="h-7 w-7" disabled={isUserInteractionDisabled}>
                        <ClipboardCopy className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopyJson} disabled={isUserInteractionDisabled}>Copy as JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyTxt} disabled={isUserInteractionDisabled}>Copy as TXT</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyCsv} disabled={isUserInteractionDisabled}>Copy as CSV</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu
              open={uiMenuState === DebugConsoleFsmMenuState.EXPORT_MENU_OPEN}
              onOpenChange={(isOpen) => dispatchDebugConsoleFsmEvent({ type: 'SET_MENU_OPEN_STATE', payload: { menu: 'export', isOpen } })}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Export Logs" className="h-7 w-7" disabled={isUserInteractionDisabled}>
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportJson} disabled={isUserInteractionDisabled}>Export as JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportTxt} disabled={isUserInteractionDisabled}>Export as TXT</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCsv} disabled={isUserInteractionDisabled}>Export as CSV</DropdownMenuItem>
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


    