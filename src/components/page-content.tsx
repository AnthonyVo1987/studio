
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpyTabContent } from "@/components/spy-tab-content";
import { NvdaTabContent } from "@/components/nvda-tab-content";
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
        <Tabs defaultValue="nvda" className="w-full">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="nvda">NVDA</TabsTrigger>
            <TabsTrigger value="spy">SPY</TabsTrigger>
          </TabsList>
          <TabsContent value="nvda">
            <NvdaTabContent />
          </TabsContent>
          <TabsContent value="spy">
            <SpyTabContent />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
