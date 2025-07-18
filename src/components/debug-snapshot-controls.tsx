
'use client';

import { useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { useExportActions } from '@/hooks/use-export-actions';
import { globalLogEntries } from "@/lib/global-log-buffer";
import { Download, Copy } from "lucide-react";

interface DebugSnapshotControlsProps {
    appVersion: string;
}

export function DebugSnapshotControls({ appVersion }: DebugSnapshotControlsProps) {
  const { toast } = useToast();
  const context = useStockAnalysis();
  const { exportActions } = useExportActions();

  const generateSnapshot = useCallback(() => {
    // Destructure all needed parts from the context
    const {
        fsmState, previousFsmState, fsmFlags, fsmVariables,
        polygonApiRequestLogJson, polygonApiResponseLogJson, marketStatusJson, stockSnapshotJson,
        standardTasJson, optionsChainJson, aiAnalyzedTaRequestJson, aiAnalyzedTaJson,
        aiOptionsAnalysisRequestJson, aiOptionsAnalysisJson, aiKeyTakeawaysRequestJson, aiKeyTakeawaysJson,
        userInputAppDataChatRequestJson, userInputAppDataChatResponseJson, stockTraderTakeawaysRequestJson,
        stockTraderTakeawaysResponseJson, optionsTraderTakeawaysRequestJson, optionsTraderTakeawaysResponseJson,
        holisticTakeawaysRequestJson, holisticTakeawaysResponseJson,
        appDataChatHistory, webSearchChatHistory,
        optionType, strikeCount, tableDisplayType,
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
        appVersion: appVersion,
        snapshotType: 'debug_snapshot',
        timestamp: new Date().toISOString(),
        fsmSnapshot: {
            state: fsmState,
            previousState: previousFsmState,
            flags: fsmFlags,
            variables: fsmVariables,
            optionsChainSettings: {
                optionType,
                strikeCount,
                tableDisplayType,
            },
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
        },
        chatHistories: {
            appDataChat: appDataChatHistory,
            webSearchChat: webSearchChatHistory,
        },
        clientTraceLogs: [...globalLogEntries],
    };
  }, [context, appVersion]);

  const handleAction = async (action: 'copy' | 'export') => {
    const snapshotData = generateSnapshot();
    const ticker = context.fsmVariables.activeTicker || 'STOCK';
    const { copy, download } = exportActions({
      data: snapshotData,
      filename: `stocksage_snapshot_${ticker}`,
      label: 'Debug Snapshot'
    });

    try {
      if (action === 'copy') {
        if (await copy()) {
          toast({ title: 'Snapshot Copied', description: `The debug snapshot was copied to your clipboard.` });
        } else {
          throw new Error('Clipboard API failed.');
        }
      } else {
        if (download()) {
          toast({ title: 'Snapshot Exported', description: `The debug snapshot was downloaded.` });
        } else {
          throw new Error('Download failed.');
        }
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: `Could not ${action} snapshot: ${e.message}` });
    }
  };
  
  const isAnyAnalysisInProgress = !context.fsmFlags.canAnalyzeStock;
  const isDataAvailableForSnapshot = !!context.fsmVariables.activeTicker;
  const isDisabled = isAnyAnalysisInProgress || !isDataAvailableForSnapshot;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Snapshot</CardTitle>
        <CardDescription>Generate a complete JSON snapshot of the application state for bug reporting. Includes FSM state, all data JSONs, chat histories, and client trace logs. Available after an analysis is run.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
            <Button onClick={() => handleAction('copy')} variant="outline" size="sm" disabled={isDisabled}><Copy className="mr-2 h-4 w-4" /> Copy Snapshot</Button>
            <Button onClick={() => handleAction('export')} variant="outline" size="sm" disabled={isDisabled}><Download className="mr-2 h-4 w-4" /> Export Snapshot</Button>
        </div>
      </CardContent>
    </Card>
  );
}
