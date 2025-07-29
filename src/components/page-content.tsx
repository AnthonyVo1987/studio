
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PresetTickerTabs } from "@/components/ticker-tabs";
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
        {/* Using the scalable ticker tabs system */}
        <PresetTickerTabs 
          preset="popular" 
          defaultTicker="NVDA"
          enableUserInput={true}
        />
      </main>
      <Footer />
    </div>
  );
}
