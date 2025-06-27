
'use client';

import { useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { downloadJson, copyToClipboard } from "@/lib/export-utils";
import { globalLogEntries } from "@/lib/global-log-buffer";
import { rawConsoleLogEntries } from "@/lib/raw-console-log-buffer";
import { Download, Copy } from "lucide-react";

type SnapshotType = 'full' | 'client' | 'console' | 'data';

export function DebugSnapshotControls() {
  const { toast } = useToast();
  const context = useStockAnalysis();

  const getBaseSnapshot = useCallback(() => {
    // Destructure all needed parts from the context
    const {
        fsmState, previousFsmState, fsmFlags, fsmVariables,
        polygonApiRequestLogJson, polygonApiResponseLogJson, marketStatusJson, stockSnapshotJson,
        standardTasJson, optionsChainJson, aiAnalyzedTaRequestJson, aiAnalyzedTaJson,
        aiOptionsAnalysisRequestJson, aiOptionsAnalysisJson, aiKeyTakeawaysRequestJson, aiKeyTakeawaysJson,
        userInputAppDataChatRequestJson, userInputAppDataChatResponseJson, stockTraderTakeawaysRequestJson,
        stockTraderTakeawaysResponseJson, optionsTraderTakeawaysRequestJson, optionsTraderTakeawaysResponseJson,
        holisticTakeawaysRequestJson, holisticTakeawaysResponseJson, userInputWebSearchChatRequestJson,
        userInputWebSearchChatResponseJson, rawTaWebSearchRequestJson, rawTaWebSearchResponseJson,
        rawOptionsWebSearchRequestJson, rawOptionsWebSearchResponseJson,
        appDataChatHistory, webSearchChatHistory,
    } = context;

    // Helper to safely parse JSON strings
    const safeJsonParse = (jsonString: string, fallback: any = {}) => {
        try {
            return JSON.parse(jsonString);
        } catch {
            return fallback;
        }
    };

    return {
        fsmSnapshot: {
            state: fsmState,
            previousState: previousFsmState,
            flags: fsmFlags,
            variables: fsmVariables,
        },
        debugData: {
            polygonApiRequestLog: safeJsonParse(polygonApiRequestLogJson),
            polygonApiResponseLog: safeJsonParse(polygonApiResponseLogJson),
            marketStatus: safeJsonParse(marketStatusJson),
            stockSnapshot: safeJsonParse(stockSnapshotJson),
            standardTas: safeJsonParse(standardTasJson),
            optionsChain: safeJsonParse(optionsChainJson),
            aiAnalyzedTaRequest: safeJsonParse(aiAnalyzedTaRequestJson),
            aiAnalyzedTa: safeJsonParse(aiAnalyzedTaJson),
            aiOptionsAnalysisRequest: safeJsonParse(aiOptionsAnalysisRequestJson),
            aiOptionsAnalysis: safeJsonParse(aiOptionsAnalysisJson),
            aiKeyTakeawaysRequest: safeJsonParse(aiKeyTakeawaysRequestJson),
            aiKeyTakeaways: safeJsonParse(aiKeyTakeawaysJson),
            userInputAppDataChatRequest: safeJsonParse(userInputAppDataChatRequestJson),
            userInputAppDataChatResponse: safeJsonParse(userInputAppDataChatResponseJson),
            stockTraderTakeawaysRequest: safeJsonParse(stockTraderTakeawaysRequestJson),
            stockTraderTakeawaysResponse: safeJsonParse(stockTraderTakeawaysResponseJson),
            optionsTraderTakeawaysRequest: safeJsonParse(optionsTraderTakeawaysRequestJson),
            optionsTraderTakeawaysResponse: safeJsonParse(optionsTraderTakeawaysResponseJson),
            holisticTakeawaysRequest: safeJsonParse(holisticTakeawaysRequestJson),
            holisticTakeawaysResponse: safeJsonParse(holisticTakeawaysResponseJson),
            userInputWebSearchChatRequest: safeJsonParse(userInputWebSearchChatRequestJson),
            userInputWebSearchChatResponse: safeJsonParse(userInputWebSearchChatResponseJson),
            rawTaWebSearchRequest: safeJsonParse(rawTaWebSearchRequestJson),
            rawTaWebSearchResponse: safeJsonParse(rawTaWebSearchResponseJson),
            rawOptionsWebSearchRequest: safeJsonParse(rawOptionsWebSearchRequestJson),
            rawOptionsWebSearchResponse: safeJsonParse(rawOptionsWebSearchResponseJson),
        },
        chatHistories: {
            appDataChat: appDataChatHistory,
            webSearchChat: webSearchChatHistory,
        },
    };
  }, [context]);

  const generateSnapshot = useCallback((type: SnapshotType) => {
    const base = getBaseSnapshot();
    const snapshot: any = {
      snapshotType: type,
      timestamp: new Date().toISOString(),
      ...base,
    };

    if (type === 'full' || type === 'client') {
      snapshot.clientTraceLogs = [...globalLogEntries];
    }
    if (type === 'full' || type === 'console') {
      snapshot.consoleLogs = [...rawConsoleLogEntries];
    }

    return snapshot;
  }, [getBaseSnapshot]);

  const handleAction = async (type: SnapshotType, action: 'copy' | 'export') => {
    const snapshotData = generateSnapshot(type);
    const ticker = context.fsmVariables.activeTicker || 'STOCK';
    const filename = `stocksage_snapshot_${ticker}_${type}.json`;
    const dataString = JSON.stringify(snapshotData, null, 2);

    try {
      if (action === 'copy') {
        if (await copyToClipboard(dataString)) {
          toast({ title: 'Snapshot Copied', description: `The '${type}' snapshot was copied to your clipboard.` });
        } else {
          throw new Error('Clipboard API failed.');
        }
      } else {
        downloadJson(snapshotData, filename);
        toast({ title: 'Snapshot Exported', description: `The '${type}' snapshot was downloaded as ${filename}.` });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: `Could not ${action} snapshot: ${e.message}` });
    }
  };
  
  const isAnyAnalysisInProgress = !context.fsmFlags.canAnalyzeStock;
  const isDataAvailableForSnapshot = !!context.fsmVariables.activeTicker;
  const isDisabled = isAnyAnalysisInProgress || !isDataAvailableForSnapshot;
  
  const snapshotButtons: { type: SnapshotType; label: string; description: string }[] = [
    { type: 'full', label: 'Full Snapshot', description: 'Includes FSM, Debug Data, Chat Histories, Client Trace Logs, and Raw Console Logs.' },
    { type: 'client', label: 'Client Debug Snapshot', description: 'Includes FSM, Debug Data, Chats, and Client Trace Logs. (Standard bug report)' },
    { type: 'console', label: 'Console Debug Snapshot', description: 'Includes FSM, Debug Data, Chats, and Raw Console Logs. (Deep-dive issues)' },
    { type: 'data', label: 'Data-Only Snapshot', description: 'Includes FSM, Debug Data, and Chat Histories. (AI prompt/data issues)' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Snapshots</CardTitle>
        <CardDescription>Generate a complete JSON snapshot of the application state for bug reporting and analysis. Snapshots are available after an initial analysis is run.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {snapshotButtons.map(({ type, label, description }) => (
          <div key={type} className="p-3 border rounded-md">
            <h4 className="font-semibold">{label}</h4>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            <div className="flex gap-2">
              <Button onClick={() => handleAction(type, 'copy')} variant="outline" size="sm" disabled={isDisabled}><Copy className="mr-2 h-4 w-4" /> Copy JSON</Button>
              <Button onClick={() => handleAction(type, 'export')} variant="outline" size="sm" disabled={isDisabled}><Download className="mr-2 h-4 w-4" /> Export JSON</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
