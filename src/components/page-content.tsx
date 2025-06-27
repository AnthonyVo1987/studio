
"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugTabContent } from "@/components/debug-tab-content";
import { MainTabContent } from "@/components/main-tab-content";
import { FsmDebugTabContent } from "@/components/fsm-debug-tab-content";
import { StagingTabContent } from "@/components/staging-tab-content";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { LogConsole } from "@/components/log-console";
import { globalLogEntries, clearGlobalLogBuffer } from "@/lib/global-log-buffer";
import { rawConsoleLogEntries, clearRawConsoleBuffer } from "@/lib/raw-console-log-buffer";
import { cn } from "@/lib/utils";

interface PageContentProps {
  appVersion: string;
  lastUpdatedTimestamp?: string;
}

export function PageContent({ appVersion, lastUpdatedTimestamp }: PageContentProps) {
  const stockAnalysisContext = useStockAnalysis();

  const getSystemStateSnapshotForExport = useCallback(() => {
    const {
        fsmState, previousFsmState, targetFsmDisplayState, fsmFlags, fsmVariables,
        polygonApiRequestLogJson, polygonApiResponseLogJson, marketStatusJson, stockSnapshotJson,
        standardTasJson, optionsChainJson, aiAnalyzedTaRequestJson, aiAnalyzedTaJson,
        aiOptionsAnalysisRequestJson, aiOptionsAnalysisJson, aiKeyTakeawaysRequestJson, aiKeyTakeawaysJson,
        userInputAppDataChatRequestJson, userInputAppDataChatResponseJson, stockTraderTakeawaysRequestJson,
        stockTraderTakeawaysResponseJson, optionsTraderTakeawaysRequestJson, optionsTraderTakeawaysResponseJson,
        holisticTakeawaysRequestJson, holisticTakeawaysResponseJson, userInputWebSearchChatRequestJson,
        userInputWebSearchChatResponseJson, rawTaWebSearchRequestJson, rawTaWebSearchResponseJson,
        rawOptionsWebSearchRequestJson, rawOptionsWebSearchResponseJson
    } = stockAnalysisContext;

    return {
        reportTimestamp: new Date().toISOString(),
        fsmStatesSnapshot: {
            globalApplicationFSM: {
                previous: previousFsmState,
                current: fsmState,
                target: targetFsmDisplayState
            },
            globalFsmFlags: fsmFlags,
            globalFsmContextVariables: fsmVariables
        },
        allRawData: {
            polygonApiRequestLogJson, polygonApiResponseLogJson, marketStatusJson, stockSnapshotJson,
            standardTasJson, optionsChainJson, aiAnalyzedTaRequestJson, aiAnalyzedTaJson,
            aiOptionsAnalysisRequestJson, aiOptionsAnalysisJson, aiKeyTakeawaysRequestJson, aiKeyTakeawaysJson,
            userInputAppDataChatRequestJson, userInputAppDataChatResponseJson, stockTraderTakeawaysRequestJson,
            stockTraderTakeawaysResponseJson, optionsTraderTakeawaysRequestJson, optionsTraderTakeawaysResponseJson,
            holisticTakeawaysRequestJson, holisticTakeawaysResponseJson, userInputWebSearchChatRequestJson,
            userInputWebSearchChatResponseJson, rawTaWebSearchRequestJson, rawTaWebSearchResponseJson,
            rawOptionsWebSearchRequestJson, rawOptionsWebSearchResponseJson,
        },
    };
  }, [stockAnalysisContext]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header appVersion={appVersion} lastUpdatedTimestamp={lastUpdatedTimestamp} />
      <main
        className={cn(
          "flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8"
        )}
      >
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="debug-data">Debug Data</TabsTrigger>
            <TabsTrigger value="client-trace-logs">Client Debug Trace Logs</TabsTrigger>
            <TabsTrigger value="console-logs">Console Logs</TabsTrigger>
            <TabsTrigger value="fsm-debug">FSM Debug</TabsTrigger>
          </TabsList>
          <TabsContent value="main">
            <MainTabContent /> 
          </TabsContent>
          <TabsContent value="debug-data">
            <DebugTabContent />
          </TabsContent>
          <TabsContent value="client-trace-logs">
            <LogConsole
              appVersion={appVersion}
              logEntries={globalLogEntries}
              getSnapshotForExport={getSystemStateSnapshotForExport}
              clearLogs={clearGlobalLogBuffer}
              consoleTitle="Client Debug Trace Logs"
              consoleDescription="Curated, high-level trace logs from the application's internal logging system."
            />
          </TabsContent>
           <TabsContent value="console-logs">
            <LogConsole
              appVersion={appVersion}
              logEntries={rawConsoleLogEntries}
              getSnapshotForExport={getSystemStateSnapshotForExport}
              clearLogs={clearRawConsoleBuffer}
              consoleTitle="Console Logs"
              consoleDescription="A raw, unfiltered duplicate of the browser's developer console output."
            />
          </TabsContent>
          <TabsContent value="fsm-debug">
            <FsmDebugTabContent />
          </TabsContent>
          <TabsContent value="staging">
            <StagingTabContent />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
