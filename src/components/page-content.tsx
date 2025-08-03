"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NvdaTabContent } from "@/components/nvda-tab-content";
import { SpyTabContent } from "@/components/spy-tab-content";
import { NvdaStagingTabContent } from "@/components/staging/nvda-staging-tab-content";
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
            <TabsTrigger 
              value="nvda-staging" 
              className={cn(
                "text-orange-600 border-orange-300",
                "data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700",
                "data-[state=active]:border-orange-500",
                "hover:bg-orange-50 hover:text-orange-600",
                "relative"
              )}
            >
              <span className="flex items-center gap-2">
                🧪 NVDA (Macro Staging)
                <span className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full font-medium">
                  EXPERIMENTAL
                </span>
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="nvda">
            <NvdaTabContent />
          </TabsContent>
          <TabsContent value="spy">
            <SpyTabContent />
          </TabsContent>
          <TabsContent value="nvda-staging">
            <NvdaStagingTabContent />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}