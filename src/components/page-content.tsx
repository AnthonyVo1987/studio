
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DynamicTabSystem } from "@/components/tabs/dynamic-tab-system";
import { cn } from "@/lib/utils";

interface PageContentProps {
  appVersion: string;
  lastUpdatedTimestamp?: string;
}

export function PageContent({ appVersion, lastUpdatedTimestamp }: PageContentProps) {
  const handleTabChange = (ticker: string) => {
    console.log(`[PageContent] Active tab changed to: ${ticker}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header appVersion={appVersion} lastUpdatedTimestamp={lastUpdatedTimestamp} />
      <main
        className={cn(
          "flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8"
        )}
      >
        <DynamicTabSystem 
          defaultTab="NVDA"
          onTabChange={handleTabChange}
          className="min-h-[600px]"
        />
      </main>
      <Footer />
    </div>
  );
}
