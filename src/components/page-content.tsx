
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebugTabContent } from "@/components/debug-tab-content";
import { MainTabContentUI } from "@/components/main-tab-content-ui";
import { FsmDebugTabContent } from "@/components/fsm-debug-tab-content";
import { SpyAnalysisProvider } from "@/contexts/spy-analysis-context";
import { SpyTabContent } from "@/components/spy-tab-content";
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
            <TabsTrigger value="spy">SPY</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="fsm-debug">Debug FSM</TabsTrigger>
          </TabsList>
          <TabsContent value="main">
            <MainTabContentUI appVersion={appVersion} /> 
          </TabsContent>
          <TabsContent value="spy">
            <SpyAnalysisProvider>
              <SpyTabContent />
            </SpyAnalysisProvider>
          </TabsContent>
          <TabsContent value="data">
            <DebugTabContent />
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
