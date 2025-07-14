
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugTabContent } from "@/components/debug-tab-content";
import { MainTabContent } from "@/components/main-tab-content";
import { FsmDebugTabContent } from "@/components/fsm-debug-tab-content";
import { LogConsole } from "@/components/log-console";
import { globalLogEntries, clearGlobalLogBuffer } from "@/lib/global-log-buffer";
import { cn } from "@/lib/utils";

interface PageContentProps {
  appVersion: string;
  lastUpdatedTimestamp?: string;
}

export function PageContent({ appVersion, lastUpdatedTimestamp }: PageContentProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header appVersion={appVersion} lastUpdatedTimestamp={lastUpdatedTimestamp} />
      <main
        className={cn(
          "flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8"
        )}
      >
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
            <TabsTrigger value="client-trace-logs">Debug Logs</TabsTrigger>
            <TabsTrigger value="fsm-debug">Debug FSM</TabsTrigger>
          </TabsList>
          <TabsContent value="main">
            <MainTabContent appVersion={appVersion} /> 
          </TabsContent>
          <TabsContent value="debug">
            <DebugTabContent />
          </TabsContent>
          <TabsContent value="client-trace-logs">
            <LogConsole
              appVersion={appVersion}
              logEntries={globalLogEntries}
              clearLogs={clearGlobalLogBuffer}
              consoleTitle="Client Debug Trace Logs"
              consoleDescription="Curated, high-level trace logs from the application's internal logging system."
            />
          </TabsContent>
          <TabsContent value="fsm-debug">
            <FsmDebugTabContent />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
